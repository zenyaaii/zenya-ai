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

// gpt-4o-mini list price (USD per 1M tokens). Used to estimate AI spend.
const PRICE_IN_PER_M = 0.15
const PRICE_OUT_PER_M = 0.60
const aiCost = (promptTok: number, completionTok: number) =>
  (promptTok / 1_000_000) * PRICE_IN_PER_M + (completionTok / 1_000_000) * PRICE_OUT_PER_M

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * GET /api/admin/analytics — founder/business dashboard. Admin-only
 * (profiles.plan === 'admin'). Aggregates the whole account:
 *   - activation funnel (signup → create → publish → pay → host)
 *   - unit economics (AI spend vs revenue)
 *   - revenue (one-time purchases + hosting MRR)
 *   - engagement (active users, signups), plan mix, event funnel, series
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
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const since = since30.toISOString()

  const [
    profilesRows,
    themeRows,
    purchasesAll,
    hostingSubs,
    aiRows,
    pageviews30d,
    recentEvents,
  ] = await Promise.all([
    a.from('profiles').select('id, plan, is_pro, has_hosting, last_seen_at, created_at')
      .then(({ data }) => data || []),
    a.from('themes').select('user_id, is_published, created_at')
      .then(({ data }) => data || []),
    a.from('purchases').select('user_id, amount_cents, status, created_at')
      .then(({ data }) => data || []),
    a.from('hosting_subscriptions').select('status, amount_cents, canceled_at')
      .then(({ data }) => data || []),
    a.from('ai_usage').select('operation, prompt_tokens, completion_tokens, total_tokens, created_at')
      .then(({ data }) => data || []),
    a.from('site_views').select('id', { count: 'exact', head: true }).gte('created_at', since)
      .then(({ count }) => count ?? 0),
    a.from('activity_logs').select('event_type, created_at, metadata')
      .gte('created_at', since).order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => data || []),
  ])

  // ── Funnel + engagement (people) ───────────────────────────────────────
  const users = profilesRows.length
  const proUsers = profilesRows.filter((p: any) => p.is_pro).length
  const hostingUsers = profilesRows.filter((p: any) => p.has_hosting).length
  const active7 = profilesRows.filter((p: any) => p.last_seen_at && new Date(p.last_seen_at) >= since7).length
  const active30 = profilesRows.filter((p: any) => p.last_seen_at && new Date(p.last_seen_at) >= since30).length
  const signups30 = profilesRows.filter((p: any) => p.created_at && new Date(p.created_at) >= since30).length

  const creators = new Set(themeRows.map((t: any) => t.user_id)).size
  const publishers = new Set(themeRows.filter((t: any) => t.is_published).map((t: any) => t.user_id)).size

  const funnel = [
    { step: 'Signed up', users },
    { step: 'Created a site', users: creators },
    { step: 'Published', users: publishers },
    { step: 'Paid (Pro)', users: proUsers },
    { step: 'Hosting', users: hostingUsers },
  ]

  // ── Revenue ────────────────────────────────────────────────────────────
  const paid = purchasesAll.filter((r: any) => r.status === 'paid')
  const grossAllTimeCents = paid.reduce((s: number, r: any) => s + (r.amount_cents || 0), 0)
  const gross30Cents = paid
    .filter((r: any) => r.created_at && new Date(r.created_at) >= since30)
    .reduce((s: number, r: any) => s + (r.amount_cents || 0), 0)
  const payingUsers = new Set(paid.map((r: any) => r.user_id)).size
  const refunded30 = purchasesAll.filter(
    (r: any) => r.status === 'refunded' && r.created_at && new Date(r.created_at) >= since30
  ).length

  const activeHosting = hostingSubs.filter((r: any) => ['active', 'trialing'].includes(r.status))
  const mrrCents = activeHosting.reduce((s: number, r: any) => s + (r.amount_cents || 0), 0)
  const churned30 = hostingSubs.filter(
    (r: any) => r.canceled_at && new Date(r.canceled_at) >= since30
  ).length

  // ── AI spend (unit economics) ──────────────────────────────────────────
  let tokensTotal = 0, costTotal = 0, tokens30 = 0, cost30 = 0
  const byOp: Record<string, { operation: string; calls: number; tokens: number; cost_usd: number }> = {}
  for (const r of aiRows as any[]) {
    const tok = r.total_tokens || 0
    const c = aiCost(r.prompt_tokens || 0, r.completion_tokens || 0)
    tokensTotal += tok; costTotal += c
    if (r.created_at && new Date(r.created_at) >= since30) { tokens30 += tok; cost30 += c }
    const e = (byOp[r.operation] ||= { operation: r.operation, calls: 0, tokens: 0, cost_usd: 0 })
    e.calls++; e.tokens += tok; e.cost_usd += c
  }
  const revenueAllTimeUsd = grossAllTimeCents / 100
  const ai_usage = {
    calls: aiRows.length,
    tokens_total: tokensTotal,
    cost_total_usd: round2(costTotal),
    tokens_30d: tokens30,
    cost_30d_usd: round2(cost30),
    cost_per_user_usd: users > 0 ? round2(costTotal / users) : 0,
    // Gross margin on AI alone — what's left of revenue after model spend.
    margin_vs_revenue_pct:
      revenueAllTimeUsd > 0 ? Math.round((1 - costTotal / revenueAllTimeUsd) * 100) : null,
    by_operation: Object.values(byOp).sort((x, y) => y.cost_usd - x.cost_usd).map((o) => ({
      ...o, cost_usd: round2(o.cost_usd),
    })),
  }

  // ── Plan mix + event funnel + daily series ─────────────────────────────
  const planBreakdown: Record<string, number> = {}
  for (const p of profilesRows as any[]) planBreakdown[p.plan || 'free'] = (planBreakdown[p.plan || 'free'] || 0) + 1

  const eventCounts: Record<string, number> = {}
  for (const e of recentEvents as any[]) eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1

  const byDay: Record<string, { generated: number; published: number; purchased: number }> = {}
  for (let i = 0; i < 30; i++) {
    byDay[new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10)] = { generated: 0, published: 0, purchased: 0 }
  }
  for (const e of recentEvents as any[]) {
    const k = e.created_at.slice(0, 10)
    if (!byDay[k]) continue
    if (e.event_type === 'theme.generated') byDay[k].generated++
    else if (e.event_type === 'theme.published') byDay[k].published++
    else if (e.event_type === 'purchase.completed') byDay[k].purchased++
  }

  return NextResponse.json({
    generated_at: now.toISOString(),
    window_days: 30,
    totals: {
      users,
      themes: themeRows.length,
      published_themes: themeRows.filter((t: any) => t.is_published).length,
      paying_users: payingUsers,
    },
    funnel,
    engagement: { active_7d: active7, active_30d: active30, signups_30d: signups30 },
    revenue: {
      gross_all_time_cents: grossAllTimeCents,
      gross_30d_cents: gross30Cents,
      mrr_cents: mrrCents,
      paying_users: payingUsers,
      hosting_active: activeHosting.length,
      churned_30d: churned30,
      refunded_30d: refunded30,
    },
    ai_usage,
    plan_breakdown: planBreakdown,
    pageviews_30d: pageviews30d,
    event_counts_30d: eventCounts,
    series: Object.entries(byDay).sort(([x], [y]) => x.localeCompare(y)).map(([date, v]) => ({ date, ...v })),
  })
}
