import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { resolveSeo, readSeoOverrides, parseGscVerification, SEO_TITLE_MAX, SEO_DESC_MAX, type SeoOverrides } from '@/lib/seo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * GET /api/themes/[id]/seo
 * Returns the theme's current SEO overrides + the auto-derived resolved values
 * (so the editor can show placeholders and the live SERP preview).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('themes')
    .select('id, product_name, slug, content, template_type, is_published')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({
    overrides: readSeoOverrides(data as any),
    resolved: resolveSeo(data as any),
  })
}

/**
 * PATCH /api/themes/[id]/seo
 * Body: { title?, description?, keywords?, ogImage?, gscVerification?, noindex? }
 * Merges the given SEO overrides into themes.content.seo (leaving the rest of
 * the content untouched). Empty string clears an override.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}

  const a = admin()
  const { data: existing } = await a
    .from('themes')
    .select('id, user_id, content')
    .eq('id', params.id)
    .maybeSingle()
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const content = (existing.content && typeof existing.content === 'object') ? { ...existing.content } : {}
  const prev: SeoOverrides = (content as any).seo && typeof (content as any).seo === 'object'
    ? { ...(content as any).seo }
    : {}

  // Apply only the fields present in the body. Empty string → delete override.
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : undefined)

  const next: SeoOverrides = { ...prev }
  const setOrClear = (key: keyof SeoOverrides, value: string | undefined) => {
    if (value === undefined) return
    if (value === '') delete next[key]
    else (next as any)[key] = value
  }

  if ('title' in body)           setOrClear('title', str(body.title, SEO_TITLE_MAX))
  if ('description' in body)     setOrClear('description', str(body.description, SEO_DESC_MAX))
  if ('keywords' in body)        setOrClear('keywords', str(body.keywords, 300))
  if ('ogImage' in body)         setOrClear('ogImage', str(body.ogImage, 500))
  if ('gscVerification' in body) {
    // Smart paste: figure out whether the user gave us Google's HTML *file*
    // (google<hash>.html) or the meta *tag* / token, and store the right one,
    // clearing the other so only one method is ever active.
    const parsed = parseGscVerification(typeof body.gscVerification === 'string' ? body.gscVerification : '')
    if (parsed.method === 'file') {
      setOrClear('gscFile', (parsed.fileName || '').slice(0, 120))
      delete next.gscVerification
    } else if (parsed.method === 'meta') {
      setOrClear('gscVerification', (parsed.token || '').slice(0, 200))
      delete next.gscFile
    } else {
      // empty → clear both
      delete next.gscVerification
      delete next.gscFile
    }
  }
  if ('noindex' in body) {
    if (body.noindex === true) next.noindex = true
    else delete next.noindex
  }

  ;(content as any).seo = next

  const { data, error } = await a
    .from('themes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, product_name, slug, content, template_type, is_published')
    .single()

  if (error) {
    console.error('[/api/themes/[id]/seo] update failed', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.seo_edited',
    metadata: { theme_id: params.id, fields: Object.keys(body || {}) } as any,
  })

  return NextResponse.json({
    ok: true,
    overrides: readSeoOverrides(data as any),
    resolved: resolveSeo(data as any),
  })
}
