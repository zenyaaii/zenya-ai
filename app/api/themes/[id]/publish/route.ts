import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { validateSlug, slugErrorMessage } from '@/lib/slug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Templates we'll host on Zenya. E-commerce templates (Storefront/Collective)
// have to ship to Shopify — they're not in this set.
const HOSTABLE_TYPES = new Set([
  'restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services',
])

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * POST /api/themes/[id]/publish
 * Body: { slug: string }
 *
 * Sets the theme's slug, flips is_published=true, stamps published_at.
 * Requires the caller to own the theme AND have plan='pro_hosting' (or admin).
 * Returns 409 on slug collision.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const slug = String(body?.slug || '').trim().toLowerCase()

  const v = validateSlug(slug)
  if (!v.ok) {
    return NextResponse.json(
      { error: 'invalid_slug', reason: v.reason, message: slugErrorMessage(v.reason) },
      { status: 400 }
    )
  }

  // 1. Verify ownership + check template_type/content
  const { data: theme, error: themeErr } = await supabase
    .from('themes')
    .select('id, user_id, template_type, content, slug')
    .eq('id', params.id)
    .maybeSingle()

  if (themeErr || !theme) {
    return NextResponse.json({ error: 'theme_not_found' }, { status: 404 })
  }
  if (theme.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type
  if (!HOSTABLE_TYPES.has(businessType)) {
    return NextResponse.json(
      {
        error: 'not_hostable',
        message:
          'E-commerce templates (Storefront, Collective) deploy to Shopify, not Zenya hosting. Use the Shopify connect or ZIP download instead.',
      },
      { status: 400 }
    )
  }

  // 2. Verify hosting entitlement (admin bypass)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, has_hosting')
    .eq('id', user.id)
    .maybeSingle()

  // Starter ($14.99) gets slug.zenya.co hosting. Pro ($24.99) adds custom domain + no badge.
  const HOSTING_PLANS = new Set(['starter', 'pro', 'pro_hosting', 'pro_onetime', 'admin'])
  if (!profile || (!HOSTING_PLANS.has(profile.plan) && !profile.has_hosting)) {
    return NextResponse.json(
      {
        error: 'hosting_required',
        message: 'يتطلّب النشر خطة Starter (14.99$ شهريًا) على الأقل للحصول على موقع مباشر على اسمك.zenya.co.',
        cta: '/checkout?plan=starter',
      },
      { status: 402 }
    )
  }

  // 3. Slug collision check (case-insensitive)
  const a = admin()
  const { data: existing } = await a
    .from('themes')
    .select('id, user_id')
    .ilike('slug', slug)
    .maybeSingle()

  if (existing && existing.id !== theme.id) {
    return NextResponse.json(
      { error: 'slug_taken', message: 'That slug is already taken. Try another.' },
      { status: 409 }
    )
  }

  // 4. Publish (service role to bypass RLS for the slug uniqueness path)
  const now = new Date().toISOString()
  const siteUrl = `https://${slug}.zenya.co`

  const { error: updErr } = await a
    .from('themes')
    .update({
      slug,
      is_published: true,
      status: 'published',
      published_url: siteUrl,
      published_at: now,
      unpublished_at: null,
    })
    .eq('id', theme.id)

  if (updErr) {
    return NextResponse.json({ error: 'publish_failed', message: updErr.message }, { status: 500 })
  }

  // 5. Activity log
  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.published',
    metadata: { theme_id: theme.id, slug, business_type: businessType } as any,
  })

  return NextResponse.json({
    ok: true,
    slug,
    url: siteUrl,
    published_at: now,
  })
}

/**
 * DELETE /api/themes/[id]/publish
 * Unpublish — keeps the slug reserved on the theme so re-publish is free,
 * but flips is_published off so /s/[slug] 404s.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const a = admin()
  const { data: theme } = await a
    .from('themes')
    .select('id, user_id, slug, is_published')
    .eq('id', params.id)
    .maybeSingle()

  if (!theme || theme.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { error } = await a
    .from('themes')
    .update({
      is_published: false,
      status: 'archived',
      unpublished_at: new Date().toISOString(),
    })
    .eq('id', theme.id)

  if (error) {
    return NextResponse.json({ error: 'unpublish_failed', message: error.message }, { status: 500 })
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.unpublished',
    metadata: { theme_id: theme.id, slug: theme.slug } as any,
  })

  return NextResponse.json({ ok: true })
}
