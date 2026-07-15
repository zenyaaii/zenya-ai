import { NextRequest, NextResponse } from 'next/server'
import { RequestedTokenType } from '@shopify/shopify-api'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'
import { shopify } from '@/lib/shopify'
import { createShopifyProduct } from '@/utils/shopify'
import { generateTheme } from '@/lib/build/theme-generator'
import { parseBuildConfig } from '@/lib/build/parse-config'
import { pushThemeToShop } from '@/lib/build/shopify-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/build/publish
 *
 * One-click publish: generates the theme server-side, pushes it to the
 * user's connected Shopify store as an UNPUBLISHED theme, and creates
 * the scraped product so the theme's buy buttons attach to it
 * immediately (the buy box falls back to collections.all.products.first).
 *
 * Authorization is two-layered: the Supabase session identifies the
 * Zenya user, and shopify_connections proves THIS user ran the OAuth
 * install for the shop — knowing a shop domain is never enough.
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { body = {} }

  // Two authorization paths:
  //  A) Embedded Shopify app — a valid App Bridge session token proves
  //     the caller is inside the installed app; the shop comes from the
  //     token, no Supabase binding needed.
  //  B) Standalone /build — a Supabase session plus a shopify_connections
  //     binding written during the OAuth install.
  const authorization = req.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  let shop = ''
  let embedded = false

  if (bearer) {
    try {
      const payload = await shopify.session.decodeSessionToken(bearer)
      const dest = typeof payload?.dest === 'string' ? payload.dest : ''
      shop = dest.replace(/^https?:\/\//, '').replace(/\/$/, '')
      embedded = Boolean(shop)
    } catch {
      return NextResponse.json(
        { error: 'invalid_session_token', message: 'Reopen the app inside Shopify Admin and try again.' },
        { status: 401 },
      )
    }
  }

  if (!embedded) {
    // Standalone path requires a Zenya account + an explicit shop.
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Admin-only while the new one-product builder is in the works. The
    // embedded App Bridge path above is founder-controlled (custom app), so
    // this gate covers the public website surface.
    if (!(await userIsAdmin(user.id))) {
      return NextResponse.json(
        { error: 'coming_soon', message: 'منشئ متجر المنتج الواحد قيد التطوير — نسخة جديدة كليًا قادمة قريبًا.' },
        { status: 403 },
      )
    }

    shop = shopify.utils.sanitizeShop(String(body?.shop || ''), true) || ''
    if (!shop) {
      return NextResponse.json(
        { error: 'invalid_shop', message: 'Enter your store like my-store.myshopify.com.' },
        { status: 400 },
      )
    }

    const { data: connection } = await supabase
      .from('shopify_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('shop', shop)
      .maybeSingle()
    if (!connection) {
      return NextResponse.json(
        {
          error: 'not_connected',
          message: 'This store is not connected to your Zenya account yet.',
          authUrl: `/api/shopify/auth?shop=${encodeURIComponent(shop)}&returnTo=${encodeURIComponent('/build/connected')}`,
        },
        { status: 403 },
      )
    }
  }

  const sanitizedShop = shopify.utils.sanitizeShop(shop, true)
  if (!sanitizedShop) {
    return NextResponse.json(
      { error: 'invalid_shop', message: 'Could not resolve a valid store domain.' },
      { status: 400 },
    )
  }
  shop = sanitizedShop

  const parsed = parseBuildConfig(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, message: parsed.message }, { status: 400 })
  }
  const config = parsed.config

  // Offline access token: try the stored session first, then fall back to
  // Token Exchange for embedded installs (Managed Installation skips our
  // /api/shopify/callback, so the Prisma session storage stays empty on
  // first use — Token Exchange mints an offline token from the App Bridge
  // session token and we cache it via sessionStorage for next time).
  let accessToken = ''
  try {
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop)
    const offline = sessions?.find((s: any) => !s.isOnline && s.accessToken) || sessions?.[0]
    accessToken = offline?.accessToken || ''
  } catch (e) {
    console.error('session storage lookup failed:', e)
  }

  if (!accessToken && embedded && bearer) {
    try {
      const { session } = await shopify.auth.tokenExchange({
        shop,
        sessionToken: bearer,
        requestedTokenType: RequestedTokenType.OfflineAccessToken,
      })
      accessToken = session.accessToken || ''
      // Cache so future requests skip the exchange round-trip.
      try { await shopify.config.sessionStorage.storeSession(session) } catch (e) {
        console.warn('publish: sessionStorage.storeSession failed (non-fatal):', e)
      }
    } catch (e: any) {
      console.error('publish: token exchange failed:', e?.message || e)
    }
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'no_session',
        message: 'The Shopify connection expired — reconnect your store.',
        authUrl: `/api/shopify/auth?shop=${encodeURIComponent(shop)}&returnTo=${encodeURIComponent('/build/connected')}`,
      },
      { status: 401 },
    )
  }

  // 1. Create the product first so the theme attaches to it on first
  //    render. A product failure shouldn't block the theme push —
  //    report it as partial success instead.
  let product: { id: number | string; handle?: string } | null = null
  let productError: string | null = null
  try {
    product = await createShopifyProduct(shop, accessToken, {
      name: config.productName,
      description: config.description || `${config.productName} — sold by ${config.storeName}.`,
      images: config.images,
      price: config.salePrice,
      originalPrice: config.originalPrice,
      vendor: config.storeName,
    })
  } catch (e: any) {
    productError = e?.message || 'Product creation failed'
    console.error('publish: product creation failed:', e)
  }

  // 2. Generate + push the theme.
  const storeHandleForFallback = shop.replace('.myshopify.com', '')
  let theme
  try {
    const files = generateTheme(config)
    const safeStore = config.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'store'
    theme = await pushThemeToShop({
      shop,
      accessToken,
      files,
      themeName: `${safeStore}-zenya-theme`,
    })
  } catch (e: any) {
    const msg = String(e?.message || '')
    console.error('publish: theme push failed:', e)

    // Shopify locked themeCreate behind a per-app exemption in 2024. Until
    // Zenya's exemption request is approved, `write_themes` alone can't
    // install a new theme. Fall back gracefully: the product is already
    // created; return a 200 with `needsManualInstall` so the client can
    // hand the merchant a one-click ZIP download + upload instructions.
    const isExemptionGate =
      /themeCreate/i.test(msg) ||
      /exemption from Shopify/i.test(msg) ||
      /Access denied for themeCreate/i.test(msg)

    if (isExemptionGate) {
      return NextResponse.json({
        ok: true,
        needsManualInstall: true,
        shop,
        product: product
          ? {
              id: product.id,
              handle: product.handle || null,
              adminUrl: `https://admin.shopify.com/store/${storeHandleForFallback}/products/${product.id}`,
            }
          : null,
        productError,
        themesUrl: `https://admin.shopify.com/store/${storeHandleForFallback}/themes`,
      })
    }

    return NextResponse.json(
      {
        error: 'theme_push_failed',
        message: e?.message || 'Pushing the theme to Shopify failed.',
        product: product
          ? { id: product.id, adminUrl: `https://admin.shopify.com/store/${storeHandleForFallback}/products/${product.id}` }
          : null,
      },
      { status: 502 },
    )
  }

  const storeHandle = shop.replace('.myshopify.com', '')
  return NextResponse.json({
    ok: true,
    shop,
    theme: {
      id: theme.numericId,
      name: theme.name,
      processing: theme.processing,
      previewUrl: theme.previewUrl,
      editorUrl: theme.editorUrl,
      themesUrl: `https://admin.shopify.com/store/${storeHandle}/themes`,
    },
    product: product
      ? {
          id: product.id,
          handle: product.handle || null,
          adminUrl: `https://admin.shopify.com/store/${storeHandle}/products/${product.id}`,
        }
      : null,
    productError,
  })
}
