import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { prepareThemeZip } from '@/utils/shopify-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Only the e-commerce templates ship to Shopify. Everything else is
// Zenya-hosted; we want the user to use /api/themes/[id]/publish for those.
const SHOPIFY_EXPORTABLE = new Set(['one_product', 'storefront', 'collective'])

/**
 * GET /api/themes/[id]/export-shopify
 * Builds a Shopify OS 2.0 theme ZIP from the user's saved theme content
 * and streams it back as a download. Requires Pro (one-time or hosting).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 1. Verify Pro entitlement (one-time or hosting both unlock the export).
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, plan')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || (!profile.is_pro && profile.plan !== 'admin')) {
    return NextResponse.json(
      {
        error: 'pro_required',
        message:
          'Shopify export is a Pro feature. Get Lifetime Pro for $9.99 or the $19.99/mo hosting plan.',
        cta: '/checkout?plan=onetime',
      },
      { status: 402 }
    )
  }

  // 2. Load the theme — must be owned by caller.
  const { data: theme } = await supabase
    .from('themes')
    .select('id, user_id, product_name, content, primary_color, secondary_color, images, template_type')
    .eq('id', params.id)
    .maybeSingle()

  if (!theme || theme.user_id !== user.id) {
    return NextResponse.json({ error: 'theme_not_found' }, { status: 404 })
  }

  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type ||
    'one_product'

  if (!SHOPIFY_EXPORTABLE.has(businessType)) {
    return NextResponse.json(
      {
        error: 'not_shopify_exportable',
        message: `Template "${businessType}" is hosted on Zenya — use Publish to Zenya instead. Shopify export is only for Storefront and Collective.`,
      },
      { status: 400 }
    )
  }

  // 3. Build the ZIP. The Storefront (one_product) flagship gets the v3
  //    generator (smaller, modern OS 2.0 schema). Collective + legacy
  //    storefront fall back to the v1 prepareThemeZip.
  const colors = {
    primary: theme.primary_color || '#5e6ad2',
    secondary: theme.secondary_color || '#c8a96a',
  }
  const images: string[] = Array.isArray(theme.images) ? theme.images : []
  const productContent =
    (theme.content && typeof theme.content === 'object' && (theme.content as any)[businessType]) ||
    theme.content ||
    {}
  const safeName = (theme.product_name || 'zenya-theme').replace(/[^\w-]+/g, '-').slice(0, 60)

  let zipBuffer: Buffer
  try {
    // v1 prepareThemeZip covers both Storefront and Collective — it's the
    // original generator and accepts any ThemeContent. v3 exists for a more
    // modern one_product layout but returns a Blob directly, which is
    // less convenient for streaming the response. Stick with v1.
    const zip = prepareThemeZip(
      theme.product_name || 'Zenya Theme',
      productContent as any,
      colors,
      images
    )
    zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  } catch (e: any) {
    console.error('[export-shopify] zip build failed:', e)
    return NextResponse.json(
      { error: 'zip_build_failed', message: e?.message || 'Could not generate the theme.' },
      { status: 500 }
    )
  }

  // 4. Log the export — useful conversion data.
  admin().from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.exported_shopify',
    metadata: { theme_id: theme.id, business_type: businessType, size_bytes: zipBuffer.byteLength } as any,
  }).then(() => {})

  return new NextResponse(zipBuffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}-shopify.zip"`,
      'Content-Length': String(zipBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  })
}
