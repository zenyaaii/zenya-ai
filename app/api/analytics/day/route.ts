import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import { deltaPct } from '@/lib/analytics-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/day — one day, hour by hour.
 *
 * Behind the "day" view of the home traffic card and of /dashboard/analytics:
 * a past day (or today so far) in 24 hourly buckets, next to the same day a
 * week earlier, which is the comparison a shop owner actually makes ("was
 * this Friday busier than last Friday?").
 *
 * Query params:
 *   date  YYYY-MM-DD, the owner's local day (default: today in tz)
 *   tz    IANA timezone the day and its hours are counted in (default UTC)
 *   site  theme id — narrows to one site
 *
 * Unlike /api/analytics this reads rows rather than calling a rollup: there is
 * no per-hour distinct-visitor rollup, and adding one is a migration. One day
 * of one small business's views is a few hundred rows, so the rows are paged
 * in and bucketed here, with a hard cap; a day past the cap says so
 * (`partial`) instead of quietly undercounting.
 */

const PAGE = 1000
const MAX_ROWS = 40_000
/** How far back the day view reaches, matching the longest range (90 days). */
const MAX_DAYS_BACK = 89

type Bucket = { views: number[]; visitors: number[]; sessions: number[]; events: number[] }
type Totals = { views: number; visitors: number; sessions: number; events: number }

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams
  const tz = safeTz(q.get('tz'))
  const today = localYmd(new Date(), tz)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') ? q.get('date')! : today
  const back = daysBetween(date, today)
  if (back < 0 || back > MAX_DAYS_BACK) {
    return NextResponse.json({ error: 'out_of_range' }, { status: 400 })
  }

  const a = analyticsAdmin()
  // Ownership: only the signed-in owner's theme ids ever reach a query.
  const { data: themes } = await a.from('themes').select('id').eq('user_id', user.id)
  const owned = (themes || []).map((t) => t.id as string)
  const siteParam = q.get('site') || ''
  const ids = siteParam && owned.includes(siteParam) ? [siteParam] : owned

  // Today stops at the current hour; a past day has all 24. Today is
  // compared with the same hours of last week's day, not with all of it.
  const upto = date === today ? localHour(new Date(), tz) + 1 : 24
  const prevDate = addDays(date, -7)
  const [cur, prev] = await Promise.all([
    readDay(a, ids, date, tz, upto),
    readDay(a, ids, prevDate, tz, upto),
  ])

  return NextResponse.json({
    date,
    prev_date: prevDate,
    tz,
    upto,
    hours: cur.hours,
    prev_hours: prev.hours,
    totals: cur.totals,
    prev_totals: prev.totals,
    delta: {
      views: deltaPct(cur.totals.views, prev.totals.views),
      visitors: deltaPct(cur.totals.visitors, prev.totals.visitors),
      sessions: deltaPct(cur.totals.sessions, prev.totals.sessions),
      events: deltaPct(cur.totals.events, prev.totals.events),
    },
    partial: cur.partial || prev.partial,
  })
}

/**
 * One day's rows in hourly buckets. The buckets always cover 24 hours (the
 * comparison line runs the whole day); the totals count only hours before
 * `upto`, so today so far meets the same stretch of last week's day.
 */
async function readDay(a: ReturnType<typeof analyticsAdmin>, ids: string[], date: string, tz: string, upto: number) {
  const hours: Bucket = { views: zeros(), visitors: zeros(), sessions: zeros(), events: zeros() }
  const totals: Totals = { views: 0, visitors: 0, sessions: 0, events: 0 }
  if (ids.length === 0) return { hours, totals, partial: false }

  const from = zonedMidnight(date, tz)
  const to = zonedMidnight(addDays(date, 1), tz)
  const hourOf = hourReader(tz)

  const [views, events] = await Promise.all([
    pageRows(a, 'site_views', 'created_at, session_id, visitor_hash', ids, from, to),
    pageRows(a, 'site_events', 'created_at', ids, from, to),
  ])

  const vis = Array.from({ length: 24 }, () => new Set<string>())
  const ses = Array.from({ length: 24 }, () => new Set<string>())
  const visDay = new Set<string>()
  const sesDay = new Set<string>()
  for (const r of views.rows) {
    const h = hourOf(r.created_at)
    const counted = h < upto
    hours.views[h]++
    if (counted) totals.views++
    if (r.visitor_hash) { vis[h].add(r.visitor_hash); if (counted) visDay.add(r.visitor_hash) }
    if (r.session_id) { ses[h].add(r.session_id); if (counted) sesDay.add(r.session_id) }
  }
  for (const r of events.rows) {
    const h = hourOf(r.created_at)
    hours.events[h]++
    if (h < upto) totals.events++
  }
  for (let h = 0; h < 24; h++) {
    hours.visitors[h] = vis[h].size
    hours.sessions[h] = ses[h].size
  }

  totals.visitors = visDay.size
  totals.sessions = sesDay.size
  return { hours, totals, partial: views.partial || events.partial }
}

async function pageRows(
  a: ReturnType<typeof analyticsAdmin>,
  table: 'site_views' | 'site_events',
  cols: string,
  ids: string[],
  from: Date,
  to: Date,
): Promise<{ rows: any[]; partial: boolean }> {
  const rows: any[] = []
  for (let off = 0; off < MAX_ROWS; off += PAGE) {
    const { data, error } = await a
      .from(table)
      .select(cols)
      .in('theme_id', ids)
      .eq('is_bot', false)
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .order('id', { ascending: true })
      .range(off, off + PAGE - 1)
    if (error || !data) break
    rows.push(...data)
    if (data.length < PAGE) return { rows, partial: false }
  }
  return { rows, partial: rows.length >= MAX_ROWS }
}

// ---- time ---------------------------------------------------------------

const zeros = () => Array.from({ length: 24 }, () => 0)

function safeTz(tz: string | null): string {
  if (!tz || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) return 'UTC'
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

/** The calendar parts of an instant, as a clock in `tz` shows them. */
function parts(d: Date, tz: string) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return { y: n('year'), m: n('month'), d: n('day'), h: n('hour'), mi: n('minute'), s: n('second') }
}

const localYmd = (d: Date, tz: string) => {
  const p = parts(d, tz)
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}
const localHour = (d: Date, tz: string) => parts(d, tz).h

function hourReader(tz: string) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' })
  return (iso: string) => Number(f.format(new Date(iso))) % 24
}

/** The instant a day starts in `tz` (midnight local, whatever the offset that day). */
function zonedMidnight(ymd: string, tz: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  // The zone's offset at that moment, read back from the clock it shows;
  // a second pass settles a day whose offset changes overnight.
  let t = guess
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(t), tz)
    const shown = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s)
    t = guess - (shown - t)
  }
  return new Date(t)
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const t = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((t(b) - t(a)) / 86_400_000)
}
