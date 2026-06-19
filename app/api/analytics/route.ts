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
 * GET /api/analytics
 *
 * Per-user analytics. Powers /dashboard/analytics and the home page tiles.
 * Pulls only data owned by the signed-in user:
 *   - themes (counts, view_count, per-site breakdown)
 *   - site_views in last 30d (daily series, top referrers/countries)
 *   - domains (live count + status mix)
 *
 * site_views and activity_logs are service-role only, so we read them with
 * the admin client after scoping by user_id / theme_id.
 */
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const a = admin()
  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const since7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  // Is the caller the founder/admin? Drives the admin toggle on the page.
  const { data: prof } = await a.from('profiles').select('plan').eq('id', user.id).maybeSingle()
  const isAdmin = prof?.plan === 'admin'

  // ── User's themes -------------------------------------------------------
  const { data: themesRaw } = await a
    .from('themes')
    .select('id, product_name, template_type, slug, is_published, view_count, last_viewed_at, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const themes = themesRaw || []
  const themeIds = themes.map((t) => t.id)
  const liveThemes = themes.filter((t) => t.is_published && t.slug)

  // ── Domain counts -------------------------------------------------------
  const { data: domainsRaw } = await a
    .from('domains')
    .select('id, domain, status, theme_id')
    .eq('user_id', user.id)
    .neq('status', 'removed')

  const domains = domainsRaw || []
  const liveDomains = domains.filter((d) => d.status === 'live').length

  // ── Site views ----------------------------------------------------------
  // We pull last 30 days of pageviews for the user's themes, then bucket
  // them daily + sum totals. site_views rows are tiny so this is cheap.
  let viewsLast30: Array<{ created_at: string; theme_id: string | null; country: string | null; referrer: string | null; user_agent: string | null }> = []
  if (themeIds.length > 0) {
    const { data: vw } = await a
      .from('site_views')
      .select('created_at, theme_id, country, referrer, user_agent')
      .in('theme_id', themeIds)
      .gte('created_at', since30.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000)
    viewsLast30 = vw || []
  }

  // Lifetime totals come from the cached view_count column.
  const lifetimeViews = themes.reduce((s, t) => s + (t.view_count ?? 0), 0)
  const views30d      = viewsLast30.length
  const views7d       = viewsLast30.filter((v) => new Date(v.created_at) >= since7).length

  // ── Daily series (30 buckets, oldest → newest) --------------------------
  const series: Array<{ date: string; views: number }> = []
  const seriesIdx: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    seriesIdx[key] = series.length
    series.push({ date: key, views: 0 })
  }
  for (const v of viewsLast30) {
    const k = v.created_at.slice(0, 10)
    const idx = seriesIdx[k]
    if (idx != null) series[idx].views++
  }

  // ── Per-site breakdown (themes ordered by lifetime views desc) ---------
  const perSite = themes
    .map((t) => {
      const v30 = viewsLast30.filter((v) => v.theme_id === t.id).length
      return {
        id: t.id,
        product_name: t.product_name,
        slug: t.slug,
        is_published: !!t.is_published,
        template_type:
          (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
          t.template_type ||
          'storefront',
        lifetime_views: t.view_count ?? 0,
        views_30d: v30,
        last_viewed_at: t.last_viewed_at || null,
        created_at: t.created_at,
      }
    })
    .sort((x, y) => (y.lifetime_views - x.lifetime_views) || (y.views_30d - x.views_30d))

  // ── Top referrers / countries (30d) ------------------------------------
  const tally = (rows: typeof viewsLast30, key: 'country' | 'referrer') => {
    const out: Record<string, number> = {}
    for (const r of rows) {
      const raw = r[key]
      if (!raw) continue
      let v = raw
      if (key === 'referrer') {
        try { v = new URL(raw).hostname.replace(/^www\./, '') } catch { /* keep raw */ }
      }
      out[v] = (out[v] || 0) + 1
    }
    return Object.entries(out)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))
  }
  const topReferrers = tally(viewsLast30, 'referrer')
  const topCountries = tally(viewsLast30, 'country')

  // ── Per-template breakdown ---------------------------------------------
  // Group every site by its template type and total up the traffic. Lets the
  // user see which kind of template is actually pulling visitors.
  const templateOf = (t: typeof themes[number]) =>
    (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
    t.template_type || 'storefront'
  const themeTemplate: Record<string, string> = {}
  const tmplAgg: Record<string, { template: string; sites: number; published: number; lifetime_views: number; views_30d: number }> = {}
  for (const t of themes) {
    const tmpl = templateOf(t)
    themeTemplate[t.id] = tmpl
    const e = (tmplAgg[tmpl] ||= { template: tmpl, sites: 0, published: 0, lifetime_views: 0, views_30d: 0 })
    e.sites++
    if (t.is_published && t.slug) e.published++
    e.lifetime_views += t.view_count ?? 0
  }
  for (const v of viewsLast30) {
    const tmpl = v.theme_id ? themeTemplate[v.theme_id] : undefined
    if (tmpl && tmplAgg[tmpl]) tmplAgg[tmpl].views_30d++
  }
  const perTemplate = Object.values(tmplAgg)
    .sort((x, y) => (y.views_30d - x.views_30d) || (y.lifetime_views - x.lifetime_views) || (y.sites - x.sites))

  // ── Device mix (30d) ----------------------------------------------------
  const deviceCounts: Record<string, number> = {}
  for (const v of viewsLast30) {
    const d = deviceFromUA(v.user_agent)
    deviceCounts[d] = (deviceCounts[d] || 0) + 1
  }
  const devices = Object.entries(deviceCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  // ── This user's own AI usage (generations + tokens) --------------------
  const { data: aiRows } = await a
    .from('ai_usage')
    .select('operation, total_tokens')
    .eq('user_id', user.id)
    .limit(5000)
  const aiByOp: Record<string, { operation: string; calls: number; tokens: number }> = {}
  let aiCalls = 0
  let aiTokens = 0
  for (const r of aiRows || []) {
    aiCalls++
    aiTokens += (r as any).total_tokens || 0
    const op = (r as any).operation || 'other'
    const e = (aiByOp[op] ||= { operation: op, calls: 0, tokens: 0 })
    e.calls++
    e.tokens += (r as any).total_tokens || 0
  }
  const ai_usage = {
    calls: aiCalls,
    total_tokens: aiTokens,
    by_operation: Object.values(aiByOp).sort((x, y) => y.tokens - x.tokens),
  }

  return NextResponse.json({
    generated_at: now.toISOString(),
    is_admin: isAdmin,
    totals: {
      themes:           themes.length,
      published_themes: liveThemes.length,
      live_domains:     liveDomains,
      lifetime_views:   lifetimeViews,
      views_30d:        views30d,
      views_7d:         views7d,
    },
    series,
    per_site:      perSite,
    per_template:  perTemplate,
    devices,
    ai_usage,
    top_referrers: topReferrers,
    top_countries: topCountries,
  })
}

/** Coarse device class from a user-agent string. Good enough for a traffic mix. */
function deviceFromUA(ua: string | null): string {
  if (!ua) return 'Unknown'
  const s = ua.toLowerCase()
  if (/ipad|tablet|playbook|silk|kindle|(android(?!.*mobile))/.test(s)) return 'Tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(s)) return 'Mobile'
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/.test(s)) return 'Bot'
  return 'Desktop'
}
