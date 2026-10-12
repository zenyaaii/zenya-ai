import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PLAN_LABEL, asPlan } from '@/components/dashboard/plans'
import { handoverSiteName, handoverSiteUrl, serviceClient } from '@/lib/handover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/handover — the signed-in owner's newest unanswered handover, for
 * the notification bell in the top bar. Read through the service role because an
 * admin's test notice points at a site the admin does not own.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ handover: null }, { status: 401 })

  const a = serviceClient()
  const { data } = await a
    .from('site_handovers')
    .select('token, sent_at, theme:themes(id, user_id, slug, product_name, published_url)')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const theme = (data as any)?.theme
  if (!data || !theme) return NextResponse.json({ handover: null })

  const { data: prof } = await a.from('profiles').select('plan').eq('id', theme.user_id).maybeSingle()
  const url = handoverSiteUrl(theme)
  return NextResponse.json({
    handover: {
      token: data.token,
      sent_at: (data as any).sent_at,
      site: handoverSiteName(theme),
      host: url.replace(/^https?:\/\//, ''),
      plan: PLAN_LABEL[asPlan((prof as any)?.plan)],
    },
  })
}
