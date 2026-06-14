import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const rawShop = String(body?.shop || '')
  const shop = shopify.utils.sanitizeShop(rawShop, true)
  if (!shop) {
    return NextResponse.json(
      { error: 'invalid_shop', message: 'Enter your store like my-store.myshopify.com.' },
      { status: 400 },
    )
  }

  const parsed = parseBuildConfig(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, message: parsed.message }, { status: 400 })
  }
  const config = parsed.config

  // The shop must be bound to this user (written by the OAuth callback).
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

  // Offline access token from the app's session storage.
  let accessToken = ''
  try {
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop)
    accessToken = sessions?.[0]?.accessToken || ''
  } catch (e) {
    console.error('session storage lookup failed:', e)
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
    console.error('publish: theme push failed:', e)
    return NextResponse.json(
      {
        error: 'theme_push_failed',
        message: e?.message || 'Pushing the theme to Shopify failed.',
        product: product
          ? { id: product.id, adminUrl: `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/products/${product.id}` }
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
