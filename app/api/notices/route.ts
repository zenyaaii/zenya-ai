import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { serviceClient } from '@/lib/handover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/notices — the signed-in owner's unopened notices from Beynoun, for
 * the notification bell. Rows in public.user_notices are written only by the
 * service role, so they are read through it too.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notices: [] }, { status: 401 })

  const { data } = await serviceClient()
    .from('user_notices')
    .select('id, title, body, href, created_at')
    .eq('user_id', user.id)
    .is('seen_at', null)
    .order('created_at', { ascending: false })
    .limit(5)
  return NextResponse.json({ notices: data || [] })
}
