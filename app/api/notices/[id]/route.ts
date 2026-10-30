import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { serviceClient } from '@/lib/handover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/notices/<id> — the owner opened the notice, so the bell drops it. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ ok: false }, { status: 400 })
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { error } = await serviceClient()
    .from('user_notices')
    .update({ seen_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('seen_at', null)
  return NextResponse.json({ ok: !error })
}
