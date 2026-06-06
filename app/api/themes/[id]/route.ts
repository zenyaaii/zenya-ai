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
 * GET /api/themes/[id] — fetch a single theme (owned by caller).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ theme: data })
}

/**
 * PATCH /api/themes/[id]
 * Body: { content?: object, product_name?: string }
 *
 * Updates the theme's content jsonb. Used by the editor — the client
 * sends back the full content object after the user edits text /
 * toggles section visibility / sets social links. Auth + ownership
 * enforced; activity log on success.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body?.content !== undefined && typeof body.content === 'object') {
    patch.content = body.content
  }
  if (typeof body?.product_name === 'string' && body.product_name.trim().length > 0) {
    patch.product_name = body.product_name.trim().slice(0, 80)
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const a = admin()
  // Verify ownership before letting the service role write.
  const { data: existing } = await a
    .from('themes')
    .select('id, user_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data, error } = await a
    .from('themes')
    .update(patch)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    console.error('[/api/themes/[id]] update failed', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.edited',
    metadata: { theme_id: params.id, fields: Object.keys(patch).filter((k) => k !== 'updated_at') } as any,
  })

  return NextResponse.json({ ok: true, theme: data })
}
