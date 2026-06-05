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
 * GET /api/admin/analytics
 * Returns aggregated stats for the last 30 days. Admin-only.
 */
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.plan !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const a = admin()

  const now = new Date()
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Batch all the counts in parallel.
  const [
    totals,
    purchases,
    hostingSubs,
    pageviews30d,
    recentEvents,
    planBreakdown,
  ] = await Promise.all([
    Promise.all([
      a.from('profiles').select('*', { count: 'exact', head: true }),
      a.from('themes').select('*', { count: 'exact', head: true }),
      a.from('themes').select('*', { count: 'exact', head: true }).eq('is_published', true),
      a.from('domains').select('*', { count: 'exact', head: true }).eq('status', 'live'),
    ]).then(([users, themes, published, domainsLive]) => ({
      users: users.count ?? 0,
      themes: themes.count ?? 0,
      published_themes: published.count ?? 0,
      live_domains: domainsLive.count ?? 0,
    })),

    a.from('purchases')
      .select('amount_cents, currency, status, paid_at')
      .gte('created_at', since)
      .then(({ data }) => {
        const rows = data || []
        const paid = rows.filter((r) => r.status === 'paid')
        const refunded = rows.filter((r) => r.status === 'refunded')
        return {
          count_paid: paid.length,
          count_refunded: refunded.length,
          gross_revenue_cents: paid.reduce((s, r) => s + (r.amount_cents || 0), 0),
        }
      }),

    a.from('hosting_subscriptions')
      .select('status, amount_cents, currency, created_at, canceled_at')
      .then(({ data }) => {
        const rows = data || []
        const active = rows.filter((r) => ['active', 'trialing'].includes(r.status))
        return {
          active_count: active.length,
          mrr_cents: active.reduce((s, r) => s + (r.amount_cents || 0), 0),
          churned_30d: rows.filter(
            (r) => r.canceled_at && new Date(r.canceled_at).toISOString() >= since
          ).length,
        }
      }),

    a.from('site_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .then(({ count }) => count ?? 0),

    a.from('activity_logs')
      .select('event_type, created_at, metadata')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => data || []),

    a.from('profiles')
      .select('plan')
      .then(({ data }) => {
        const out: Record<string, number> = {}
        for (const row of data || []) {
          const p = (row as any).plan || 'free'
          out[p] = (out[p] || 0) + 1
        }
        return out
      }),
  ])

  // Bucket recent events by type for a quick funnel view.
  const eventCounts: Record<string, number> = {}
  for (const e of recentEvents) {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1
  }

  // Time series for the last 30 days, by day, for theme.generated + signups.
  const byDay: Record<string, { generated: number; published: number; purchased: number; viewed: number }> = {}
  const dayKey = (iso: string) => iso.slice(0, 10)
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    byDay[d.toISOString().slice(0, 10)] = { generated: 0, published: 0, purchased: 0, viewed: 0 }
  }
  for (const e of recentEvents) {
    const k = dayKey(e.created_at)
    if (!byDay[k]) continue
    if (e.event_type === 'theme.generated') byDay[k].generated++
    else if (e.event_type === 'theme.published') byDay[k].published++
    else if (e.event_type === 'purchase.completed') byDay[k].purchased++
  }

  return NextResponse.json({
    generated_at: now.toISOString(),
    window_days: 30,
    totals,
    plan_breakdown: planBreakdown,
    purchases,
    hosting: hostingSubs,
    pageviews_30d: pageviews30d,
    event_counts_30d: eventCounts,
    series: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals })),
    recent_events: recentEvents.slice(0, 50),
  })
}
