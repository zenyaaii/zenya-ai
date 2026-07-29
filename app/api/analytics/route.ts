import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import { deltaPct, resolveRange, type Channel, type RangeKey } from '@/lib/analytics-core'
import { publicSiteUrl } from '@/lib/portal-urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics
 *
 * The single read endpoint behind /dashboard/analytics. Every number is
 * scoped to the signed-in user's own themes, computed in Postgres by the
 * analytics_* rollup functions, and paired with the same figure for the
 * immediately preceding window so the UI can show a real delta instead of a
 * context-free count.
 *
 * Query params:
 *   range  24h | 7d | 30d | 90d | 12mo | custom   (default 30d)
 *   from   ISO date, when range=custom
 *   to     ISO date, when range=custom
 *   site   theme id — narrows everything to one site
 *   bots   "1" to include crawler traffic (default: excluded)
 *   tz     IANA timezone for day/hour bucketing (default UTC)
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams
  const rangeKey = (q.get('range') || '30d') as RangeKey
  const includeBots = q.get('bots') === '1'
  const tz = safeTz(q.get('tz'))
  const siteParam = q.get('site') || ''

  const now = new Date()
  const { from, to, prevFrom, prevTo, days } = resolveRange(rangeKey, now, {
    from: q.get('from'),
    to: q.get('to'),
  })

  const a = analyticsAdmin()

  // ---- ownership --------------------------------------------------------
  // Everything downstream is keyed off this array. A theme id that isn't in
  // it can never reach the rollup functions, which is what keeps one user's
  // traffic invisible to another.
  const { data: themesRaw } = await a
    .from('themes')
    .select('id, product_name, template_type, slug, is_published, view_count, last_viewed_at, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const themes = themesRaw || []
  const ownedIds = themes.map((t) => t.id)
  const siteFilter = siteParam && ownedIds.includes(siteParam) ? siteParam : null
  const themeIds = siteFilter ? [siteFilter] : ownedIds

  const { data: prof } = await a.from('profiles').select('plan').eq('id', user.id).maybeSingle()
  const isAdmin = prof?.plan === 'admin'

  const { data: domainsRaw } = await a
    .from('domains')
    .select('id, status')
    .eq('user_id', user.id)
    .neq('status', 'removed')
  const liveDomains = (domainsRaw || []).filter((d) => d.status === 'live').length

  const templateOf = (t: any): string =>
    (t.content && typeof t.content === 'object' && t.content.business_type) ||
    t.template_type ||
    'storefront'

  const sites = themes.map((t) => ({
    id: t.id,
    name: t.product_name || t.slug || 'موقع بلا اسم',
    slug: t.slug,
    is_published: !!t.is_published,
    template: templateOf(t),
    url: t.slug && t.is_published ? publicSiteUrl(t.slug) : null,
  }))

  // No sites at all — return a well-formed empty payload so the page renders
  // its onboarding state instead of erroring.
  if (themeIds.length === 0) {
    return NextResponse.json(emptyPayload({ now, from, to, prevFrom, prevTo, days, rangeKey, tz, isAdmin, sites, siteFilter, includeBots, liveDomains, themes: themes.length }))
  }

  const base = { p_theme_ids: themeIds, p_include_bots: includeBots }
  const cur = { p_from: from.toISOString(), p_to: to.toISOString() }
  const prev = { p_from: prevFrom.toISOString(), p_to: prevTo.toISOString() }

  const dim = (d: string, limit = 12) =>
    a.rpc('analytics_breakdown', { ...base, ...cur, p_dimension: d, p_limit: limit })

  const [
    totalsCur, totalsPrev,
    dailyCur, dailyPrev,
    countries, referrers, channels, devices, browsers, oses, campaigns, sources,
    pages, hourly,
    eventsByType, eventsByPath, eventsDaily, eventsPrev,
    bySite,
    firstSession,
  ] = await Promise.all([
    a.rpc('analytics_totals', { ...base, ...cur }),
    a.rpc('analytics_totals', { ...base, ...prev }),
    a.rpc('analytics_daily', { ...base, ...cur, p_tz: tz }),
    a.rpc('analytics_daily', { ...base, ...prev, p_tz: tz }),
    dim('country'), dim('referrer_host'), dim('channel', 8), dim('device', 6),
    dim('browser', 8), dim('os', 8), dim('utm_campaign', 10), dim('utm_source', 10),
    a.rpc('analytics_pages', { ...base, ...cur, p_limit: 25 }),
    a.rpc('analytics_hourly', { ...base, ...cur, p_tz: tz }),
    a.rpc('analytics_events', { p_theme_ids: themeIds, ...cur }),
    a.rpc('analytics_events_by_path', { p_theme_ids: themeIds, ...cur, p_limit: 10 }),
    a.rpc('analytics_events_daily', { p_theme_ids: themeIds, ...cur, p_tz: tz }),
    a.rpc('analytics_events', { p_theme_ids: themeIds, ...prev }),
    a.rpc('analytics_by_site_range', { ...base, ...cur }),
    a.from('site_views').select('created_at').not('session_id', 'is', null)
      .order('created_at', { ascending: true }).limit(1).maybeSingle(),
  ])

  const T = row(totalsCur.data)
  const P = row(totalsPrev.data)

  const eventsTotal = sum(eventsByType.data, 'events')
  const eventsTotalPrev = sum(eventsPrev.data, 'events')

  const bounceRate = pct(T.bounced_sessions, T.sessions)
  const bounceRatePrev = pct(P.bounced_sessions, P.sessions)
  const avgDuration = T.engaged_samples > 0 ? Math.round(T.engaged_ms_total / T.engaged_samples) : 0
  const avgDurationPrev = P.engaged_samples > 0 ? Math.round(P.engaged_ms_total / P.engaged_samples) : 0
  const convRate = pct(eventsTotal, T.sessions)
  const convRatePrev = pct(eventsTotalPrev, P.sessions)

  // ---- series, zero-filled ------------------------------------------------
  // The rollups only return days that had traffic; the chart needs every
  // bucket or the line lies about the shape of the week.
  const bucketDays = Math.min(days, 366)
  const series = buildSeries(from, to, bucketDays, dailyCur.data, eventsDaily.data, tz)
  const prevSeries = buildSeries(prevFrom, prevTo, bucketDays, dailyPrev.data, null, tz)

  // ---- per-site + per-template -------------------------------------------
  const siteStats = new Map<string, { views: number; sessions: number; visitors: number }>()
  for (const r of bySite.data || []) {
    siteStats.set((r as any).theme_id, {
      views: Number((r as any).views) || 0,
      sessions: Number((r as any).sessions) || 0,
      visitors: Number((r as any).visitors) || 0,
    })
  }

  const scopedThemes = siteFilter ? themes.filter((t) => t.id === siteFilter) : themes
  const perSite = scopedThemes
    .map((t) => {
      const s = siteStats.get(t.id) || { views: 0, sessions: 0, visitors: 0 }
      return {
        id: t.id,
        product_name: t.product_name || t.slug || 'موقع بلا اسم',
        slug: t.slug,
        is_published: !!t.is_published,
        template: templateOf(t),
        views: s.views,
        sessions: s.sessions,
        visitors: s.visitors,
        lifetime_views: t.view_count ?? 0,
        last_viewed_at: t.last_viewed_at || null,
        created_at: t.created_at,
      }
    })
    .sort((x, y) => y.views - x.views || y.lifetime_views - x.lifetime_views)

  const tmplAgg: Record<string, any> = {}
  for (const s of perSite) {
    const e = (tmplAgg[s.template] ||= {
      template: s.template, sites: 0, published: 0, views: 0, visitors: 0, lifetime_views: 0,
    })
    e.sites++
    if (s.is_published && s.slug) e.published++
    e.views += s.views
    e.visitors += s.visitors
    e.lifetime_views += s.lifetime_views
  }
  const perTemplate = Object.values(tmplAgg).sort((x: any, y: any) => y.views - x.views)

  const channelRows = (channels.data || []).map((r: any) => ({
    key: r.name as Channel,
    name: r.name as string,
    views: Number(r.views) || 0,
    sessions: Number(r.sessions) || 0,
    visitors: Number(r.visitors) || 0,
  }))

  const payload = {
    generated_at: now.toISOString(),
    is_admin: isAdmin,
    tz,
    range: {
      key: rangeKey,
      from: from.toISOString(),
      to: to.toISOString(),
      prev_from: prevFrom.toISOString(),
      prev_to: prevTo.toISOString(),
      days,
    },
    include_bots: includeBots,
    sites,
    site_filter: siteFilter,
    /**
     * When session-level collection actually began. Rows written before the
     * beacon shipped have no session, visitor, bounce or duration, so the UI
     * marks that boundary rather than showing zeros as if they were real.
     */
    sessions_since: (firstSession.data as any)?.created_at || null,
    site_counts: {
      themes: themes.length,
      published: themes.filter((t) => t.is_published && t.slug).length,
      live_domains: liveDomains,
      lifetime_views: themes.reduce((s, t) => s + (t.view_count ?? 0), 0),
    },
    totals: {
      views: T.views,
      sessions: T.sessions,
      visitors: T.visitors,
      bounce_rate: bounceRate,
      avg_duration_ms: avgDuration,
      events: eventsTotal,
      conversion_rate: convRate,
    },
    previous: {
      views: P.views,
      sessions: P.sessions,
      visitors: P.visitors,
      bounce_rate: bounceRatePrev,
      avg_duration_ms: avgDurationPrev,
      events: eventsTotalPrev,
      conversion_rate: convRatePrev,
    },
    delta: {
      views: deltaPct(T.views, P.views),
      sessions: deltaPct(T.sessions, P.sessions),
      visitors: deltaPct(T.visitors, P.visitors),
      // Bounce is inverted: lower is better. The UI reads `good` to colour it.
      bounce_rate: deltaPct(bounceRate, bounceRatePrev),
      avg_duration_ms: deltaPct(avgDuration, avgDurationPrev),
      events: deltaPct(eventsTotal, eventsTotalPrev),
      conversion_rate: deltaPct(convRate, convRatePrev),
    },
    series,
    prev_series: prevSeries,
    per_site: perSite,
    per_template: perTemplate,
    pages: (pages.data || []).map((r: any) => ({
      path: r.path,
      views: Number(r.views) || 0,
      visitors: Number(r.visitors) || 0,
      avg_engaged_ms: r.avg_engaged == null ? null : Number(r.avg_engaged),
      avg_scroll_pct: r.avg_scroll == null ? null : Number(r.avg_scroll),
    })),
    channels: channelRows,
    referrers: normalize(referrers.data),
    countries: normalize(countries.data),
    devices: normalize(devices.data),
    browsers: normalize(browsers.data),
    operating_systems: normalize(oses.data),
    campaigns: normalize(campaigns.data).filter((r) => r.name !== 'unknown'),
    utm_sources: normalize(sources.data).filter((r) => r.name !== 'unknown'),
    hourly: (hourly.data || []).map((r: any) => ({
      dow: Number(r.dow), hour: Number(r.hour), views: Number(r.views) || 0,
    })),
    conversions: {
      total: eventsTotal,
      rate: convRate,
      by_type: (eventsByType.data || []).map((r: any) => ({
        event_type: r.event_type,
        events: Number(r.events) || 0,
        sessions: Number(r.sessions) || 0,
      })),
      by_path: (eventsByPath.data || []).map((r: any) => ({
        path: r.path, events: Number(r.events) || 0,
      })),
    },
    insights: [] as Insight[],
  }

  payload.insights = buildInsights(payload)

  return NextResponse.json(payload)
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

type Insight = { tone: 'good' | 'warn' | 'info'; title: string; body: string }

function row(data: any): {
  views: number; sessions: number; visitors: number
  bounced_sessions: number; engaged_ms_total: number; engaged_samples: number
} {
  const r = Array.isArray(data) ? data[0] : data
  return {
    views: Number(r?.views) || 0,
    sessions: Number(r?.sessions) || 0,
    visitors: Number(r?.visitors) || 0,
    bounced_sessions: Number(r?.bounced_sessions) || 0,
    engaged_ms_total: Number(r?.engaged_ms_total) || 0,
    engaged_samples: Number(r?.engaged_samples) || 0,
  }
}

function normalize(data: any): Array<{ name: string; views: number; sessions: number; visitors: number }> {
  return (data || []).map((r: any) => ({
    name: String(r.name ?? 'unknown'),
    views: Number(r.views) || 0,
    sessions: Number(r.sessions) || 0,
    visitors: Number(r.visitors) || 0,
  }))
}

function sum(data: any, key: string): number {
  return (data || []).reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0)
}

function pct(part: number, whole: number): number {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}

function safeTz(tz: string | null): string {
  if (!tz) return 'UTC'
  // Only accept things that look like an IANA zone; the value is interpolated
  // into `AT TIME ZONE` downstream.
  if (!/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) return 'UTC'
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

/** Local-day key (YYYY-MM-DD) for a timestamp in the requested timezone. */
function dayKey(d: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d)
    return parts
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

/**
 * Zero-filled day buckets between `from` and `to`. For sub-day ranges (24h)
 * this still produces one bucket per day, which the UI renders as a single
 * point — honest, and avoids inventing hourly precision the rollups don't
 * return.
 */
function buildSeries(
  from: Date, to: Date, maxDays: number,
  daily: any, eventsDaily: any, tz: string,
): Array<{ date: string; views: number; sessions: number; visitors: number; events: number }> {
  const byDay = new Map<string, any>()
  for (const r of daily || []) byDay.set(String(r.day).slice(0, 10), r)
  const evByDay = new Map<string, number>()
  for (const r of eventsDaily || []) evByDay.set(String(r.day).slice(0, 10), Number(r.events) || 0)

  const out: Array<{ date: string; views: number; sessions: number; visitors: number; events: number }> = []
  const cursor = new Date(from)
  let guard = 0
  while (cursor <= to && guard < maxDays + 2) {
    const key = dayKey(cursor, tz)
    const r = byDay.get(key)
    out.push({
      date: key,
      views: Number(r?.views) || 0,
      sessions: Number(r?.sessions) || 0,
      visitors: Number(r?.visitors) || 0,
      events: evByDay.get(key) || 0,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    guard++
  }
  return out
}

function emptyPayload(o: any) {
  return {
    generated_at: o.now.toISOString(),
    is_admin: o.isAdmin,
    tz: o.tz,
    range: {
      key: o.rangeKey, from: o.from.toISOString(), to: o.to.toISOString(),
      prev_from: o.prevFrom.toISOString(), prev_to: o.prevTo.toISOString(), days: o.days,
    },
    include_bots: o.includeBots,
    sites: o.sites,
    site_filter: o.siteFilter,
    sessions_since: null,
    site_counts: { themes: o.themes, published: 0, live_domains: o.liveDomains, lifetime_views: 0 },
    totals: { views: 0, sessions: 0, visitors: 0, bounce_rate: 0, avg_duration_ms: 0, events: 0, conversion_rate: 0 },
    previous: { views: 0, sessions: 0, visitors: 0, bounce_rate: 0, avg_duration_ms: 0, events: 0, conversion_rate: 0 },
    delta: { views: null, sessions: null, visitors: null, bounce_rate: null, avg_duration_ms: null, events: null, conversion_rate: null },
    series: [], prev_series: [], per_site: [], per_template: [], pages: [],
    channels: [], referrers: [], countries: [], devices: [], browsers: [],
    operating_systems: [], campaigns: [], utm_sources: [], hourly: [],
    conversions: { total: 0, rate: 0, by_type: [], by_path: [] },
    insights: [] as Insight[],
  }
}

/* ─── insights ────────────────────────────────────────────────────────────── */

/**
 * Plain-Arabic observations derived strictly from the numbers above.
 *
 * Every rule carries a minimum-sample guard. An "insight" drawn from four
 * pageviews is noise dressed up as advice, and stating it would be inventing
 * confidence the data doesn't support — so below the threshold we say nothing
 * rather than say something shaky.
 */
function buildInsights(p: any): Insight[] {
  const out: Insight[] = []
  const t = p.totals
  const MIN = 30 // views before any claim is worth making

  if (t.views < MIN) {
    return [{
      tone: 'info',
      title: 'لا توجد بيانات كافية بعد',
      body: `سجّلنا ${t.views.toLocaleString('ar')} مشاهدة في هذه المدة. عند تجاوز ${MIN} مشاهدة سنبدأ بعرض ملاحظات مبنية على أرقامك الحقيقية.`,
    }]
  }

  // Traffic direction
  if (p.delta.views != null && Math.abs(p.delta.views) >= 15) {
    const up = p.delta.views > 0
    out.push({
      tone: up ? 'good' : 'warn',
      title: up ? `الزيارات ارتفعت ${p.delta.views}%` : `الزيارات انخفضت ${Math.abs(p.delta.views)}%`,
      body: up
        ? `${t.views.toLocaleString('ar')} مشاهدة مقابل ${p.previous.views.toLocaleString('ar')} في المدة السابقة. استمر بما تفعله.`
        : `${t.views.toLocaleString('ar')} مشاهدة مقابل ${p.previous.views.toLocaleString('ar')} في المدة السابقة. راجع مصادر الزيارات وتحقّق ممّا تغيّر.`,
    })
  }

  // Mobile skew vs conversions
  const mobile = p.devices.find((d: any) => d.name === 'Mobile')
  if (mobile && t.views > 0) {
    const share = Math.round((mobile.views / t.views) * 100)
    if (share >= 60) {
      out.push({
        tone: 'info',
        title: `${share}% من زوّارك يتصفّحون من الجوال`,
        body: 'تأكّد أن زر التواصل (واتساب أو الهاتف) ظاهر في أعلى الصفحة على الجوال دون الحاجة للتمرير.',
      })
    }
  }

  // Conversions
  if (t.sessions >= 20) {
    if (p.conversions.total === 0) {
      out.push({
        tone: 'warn',
        title: 'لا توجد أي نقرات تواصل',
        body: `${t.sessions.toLocaleString('ar')} جلسة دون أي نقرة على واتساب أو الهاتف أو الحجز. غالبًا زر التواصل غير واضح أو بعيد جدًا عن أعلى الصفحة.`,
      })
    } else if (t.conversion_rate >= 5) {
      out.push({
        tone: 'good',
        title: `معدل التواصل ${t.conversion_rate}%`,
        body: `${p.conversions.total.toLocaleString('ar')} إجراء تواصل من ${t.sessions.toLocaleString('ar')} جلسة — هذا معدل جيد.`,
      })
    }
  }

  // Top channel
  const topChannel = p.channels[0]
  if (topChannel && t.views > 0) {
    const share = Math.round((topChannel.views / t.views) * 100)
    if (share >= 50 && topChannel.name === 'direct') {
      out.push({
        tone: 'info',
        title: 'أغلب زياراتك مباشرة',
        body: 'الزيارات المباشرة تعني أن الناس يكتبون رابطك أو يفتحونه من رسالة. لزيادة الوصول، أضف الرابط في حساباتك على التواصل الاجتماعي وفي خرائط جوجل.',
      })
    }
  }

  // Best page
  if (p.pages.length >= 2) {
    const top = p.pages[0]
    if (top.views >= 10) {
      out.push({
        tone: 'info',
        title: `أكثر صفحة زيارة: ${top.path === '/' ? 'الرئيسية' : top.path}`,
        body: `${top.views.toLocaleString('ar')} مشاهدة. ضع أهم عرض لديك في هذه الصفحة تحديدًا.`,
      })
    }
  }

  // Bounce
  if (t.sessions >= 25 && t.bounce_rate >= 75) {
    out.push({
      tone: 'warn',
      title: `معدل المغادرة ${t.bounce_rate}%`,
      body: 'أغلب الزوّار يغادرون بعد صفحة واحدة. جرّب إضافة روابط واضحة لبقية صفحات الموقع في أعلى الصفحة الرئيسية.',
    })
  }

  // Peak hour
  if (p.hourly.length > 0) {
    const peak = p.hourly.reduce((m: any, r: any) => (r.views > m.views ? r : m), p.hourly[0])
    if (peak.views >= 8) {
      out.push({
        tone: 'info',
        title: `ذروة الزيارات الساعة ${peak.hour}:00`,
        body: 'انشر عروضك ومنشوراتك قبل هذه الساعة بقليل لتصل لأكبر عدد من الزوّار.',
      })
    }
  }

  return out.slice(0, 6)
}
