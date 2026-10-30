import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * The editor's draft: what the owner changed and has not published yet
 * (supabase/migrations/20261030_theme_drafts.sql).
 *
 *   PUT  { draft: object | null }  save it; null clears it
 *   POST                           publish it: merge it into content, clear it
 *
 * Visitors are served themes.content and never the draft. A draft holds the
 * editor's own keys only, so a publish never overwrites what the dashboard
 * keeps in content. A key the draft sets to null is removed from content
 * (the colours put back to the preset's, say).
 */
const DRAFT_KEYS = new Set([
  'restaurant', 'atlas', 'lookbook', 'services', 'studio', 'wellness',
  'style_preset', 'typography_preset', 'color_overrides', 'section_styles',
])

async function owned(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const a = admin()
  const { data: theme } = await a
    .from('themes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!theme || theme.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }
  return { a, user, theme }
}

/**
 * Until the migration is applied there are no draft columns. The editor is
 * told so (503 drafts_unavailable) and holds the draft itself, in the
 * owner's browser, publishing straight into content as before.
 */
const missingColumn = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === '42703' || e.code === 'PGRST204' || (/draft/.test(e.message || '') && /column|schema cache/.test(e.message || '')))
const unavailable = () => NextResponse.json({ error: 'drafts_unavailable' }, { status: 503 })

function clean(draft: unknown): Record<string, unknown> | null | 'bad' {
  if (draft === null) return null
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return 'bad'
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(draft as Record<string, unknown>)) {
    if (!DRAFT_KEYS.has(k)) return 'bad'
    out[k] = v === undefined ? null : v
  }
  return out
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let body: any = {}
  try { body = await req.json() } catch {}
  const draft = clean(body?.draft)
  if (draft === 'bad') return NextResponse.json({ error: 'invalid_draft' }, { status: 400 })

  const o = await owned(params.id)
  if ('error' in o) return o.error

  const { error } = await o.a
    .from('themes')
    .update({ draft, draft_saved_at: draft ? new Date().toISOString() : null })
    .eq('id', params.id)
  if (missingColumn(error)) return unavailable()
  if (error) {
    console.error('[/api/themes/[id]/draft] save failed', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const o = await owned(params.id)
  if ('error' in o) return o.error

  if (!('draft' in o.theme)) return unavailable()
  const draft = o.theme.draft as Record<string, unknown> | null
  if (!draft) return NextResponse.json({ ok: true, published: false })

  const content: Record<string, unknown> = { ...((o.theme.content as Record<string, unknown>) || {}) }
  for (const [k, v] of Object.entries(draft)) {
    if (!DRAFT_KEYS.has(k)) continue
    if (v === null) delete content[k]
    else content[k] = v
  }

  const { data, error } = await o.a
    .from('themes')
    .update({ content, draft: null, draft_saved_at: null, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single()
  if (error) {
    console.error('[/api/themes/[id]/draft] publish failed', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  await o.a.from('activity_logs').insert({
    user_id: o.user.id,
    event_type: 'theme.edited',
    metadata: { theme_id: params.id, fields: ['content'], published_draft: true } as any,
  })

  return NextResponse.json({ ok: true, published: true, theme: data })
}
