/**
 * The candidate dashboard's sample data.
 *
 * Invented, and the standing note under the page says so in Arabic. The shapes
 * are the product's own (TrafficData, Row) wherever a real component consumes
 * them, so the traffic card, the stat tiles and the bar lists render this
 * exactly as they render a live payload — which is the whole point of the
 * demo: it exercises the shipped components rather than reproducing them.
 *
 * It lives in its own module because the view file is nine surfaces long and a
 * hundred lines of fixtures in the middle of it makes both halves harder to
 * read. Same reason app/demo/access keeps its CSS in styles.ts.
 */

import type { TMetric, TRange, TrafficData } from '@/components/dashboard/screens/traffic'

/* ── traffic ─────────────────────────────────────────────────────────────── */

const row = (name: string, views: number) => ({
  name, views, sessions: Math.round(views * 0.6), visitors: Math.round(views * 0.42),
})

export const CHANNELS = [
  row('بحث عضوي', 2740), row('مباشر', 1980), row('شبكات اجتماعية', 1240),
  row('إحالات', 560), row('بريد', 303),
]

export const PAGES = [
  row('/', 3120), row('/menu', 1488), row('/reservations', 902),
  row('/about', 613), row('/contact', 402),
]

/* ── sites ───────────────────────────────────────────────────────────────── */

export type DemoSite = {
  id: string
  name: string
  kind: string
  host: string | null
  live: boolean
  views: number
  updated: string
}

export const SITES: DemoSite[] = [
  { id: 's1', name: 'مطعم المدينة', kind: 'مطعم',   host: 'al-madina.beynoun.com',   live: true,  views: 4821, updated: 'قبل يومين' },
  { id: 's2', name: 'أطلس ستوديو',  kind: 'تطبيق',  host: 'atlas-studio.beynoun.com', live: true,  views: 1264, updated: 'قبل 6 أيام' },
  { id: 's3', name: 'واحة العافية',  kind: 'عافية',  host: 'waha.beynoun.com',        live: true,  views: 738,  updated: 'قبل أسبوعين' },
  { id: 's4', name: 'لوك بوك 26',   kind: 'أزياء',  host: null,                     live: false, views: 0,    updated: 'قبل شهر' },
  { id: 's5', name: 'متجر الخيط',   kind: 'شوبيفاي', host: null,                    live: false, views: 0,    updated: 'قبل شهرين' },
]

/* ── bookings ────────────────────────────────────────────────────────────── */

export type BookingTone = 'accent' | 'ok' | 'quiet' | 'bad'

export type DemoBooking = {
  name: string; site: string; kind: string; when: string
  party: string; phone: string; status: string; tone: BookingTone; note?: string
}

export const BOOKINGS: DemoBooking[] = [
  { name: 'سارة الحمادي', site: 'مطعم المدينة', kind: 'حجز طاولة', when: '6 سبتمبر · 19:00', party: 'شخصان', phone: '+971501234510', status: 'جديد',  tone: 'accent', note: 'نفضّل طاولة بجانب النافذة إن أمكن، ولدينا طفل صغير.' },
  { name: 'خالد بن راشد', site: 'واحة العافية',  kind: 'حجز موعد', when: '7 سبتمبر · 13:30', party: '3 أشخاص', phone: '+971501234511', status: 'مؤكّد', tone: 'ok' },
  { name: 'ليلى منصور',   site: 'مطعم المدينة', kind: 'حجز طاولة', when: '8 سبتمبر · 20:30', party: '4 أشخاص', phone: '+971501234512', status: 'جديد',  tone: 'accent' },
  { name: 'عمر الشريف',   site: 'مطعم المدينة', kind: 'حجز طاولة', when: '4 سبتمبر · 21:00', party: 'شخصان', phone: '+971501234513', status: 'منجز',  tone: 'quiet' },
  { name: 'هدى العتيبي',  site: 'أطلس ستوديو',  kind: 'طلب تواصل', when: '3 سبتمبر · 11:00', party: '5 أشخاص', phone: '+971501234514', status: 'ملغى',  tone: 'bad' },
]

/* ── domains ─────────────────────────────────────────────────────────────── */

export type DemoDomain = {
  domain: string; site: string; status: string
  tone: BookingTone; ssl: boolean; renews: string
}

export const DOMAINS: DemoDomain[] = [
  { domain: 'almadina.ae',      site: 'مطعم المدينة', status: 'متصل',         tone: 'ok',     ssl: true,  renews: '12 مارس 2027' },
  { domain: 'atlasstudio.app',  site: 'أطلس ستوديو',  status: 'متصل',         tone: 'ok',     ssl: true,  renews: '2 يونيو 2027' },
  { domain: 'waha-wellness.co', site: 'واحة العافية',  status: 'بانتظار DNS',  tone: 'accent', ssl: false, renews: '—' },
  { domain: 'lookbook26.com',   site: 'لوك بوك 26',   status: 'ينتهي قريبًا', tone: 'quiet',  ssl: true,  renews: '28 سبتمبر 2026' },
]

/* ── gallery ─────────────────────────────────────────────────────────────── */

export type DemoAsset = { id: string; name: string; site: string; size: string; tint: string }

/* The tints are the placeholder artwork's own, not palette tokens: these
   stand in for photographs the demo has no right to ship, and a grid of
   identical grey rectangles would misrepresent what the gallery looks like
   full of a customer's images. They are never used as UI colour. */
export const ASSETS: DemoAsset[] = [
  { id: 'a1', name: 'واجهة المطعم.jpg',   site: 'مطعم المدينة', size: '412 ك.ب', tint: '#c8b8a4' },
  { id: 'a2', name: 'طبق اليوم.jpg',      site: 'مطعم المدينة', size: '288 ك.ب', tint: '#b9a48c' },
  { id: 'a3', name: 'قاعة الجلوس.jpg',    site: 'مطعم المدينة', size: '506 ك.ب', tint: '#a89c94' },
  { id: 'a4', name: 'شاشة التطبيق.png',   site: 'أطلس ستوديو',  size: '164 ك.ب', tint: '#9aa0c4' },
  { id: 'a5', name: 'شعار أطلس.svg',      site: 'أطلس ستوديو',  size: '12 ك.ب',  tint: '#8f97bd' },
  { id: 'a6', name: 'غرفة العلاج.jpg',    site: 'واحة العافية',  size: '374 ك.ب', tint: '#a9bfae' },
  { id: 'a7', name: 'زيوت عطرية.jpg',     site: 'واحة العافية',  size: '221 ك.ب', tint: '#b7c7b4' },
  { id: 'a8', name: 'إطلالة الخريف.jpg',  site: 'لوك بوك 26',   size: '598 ك.ب', tint: '#c3aeb2' },
  { id: 'a9', name: 'تفاصيل القماش.jpg',  site: 'لوك بوك 26',   size: '333 ك.ب', tint: '#b8a6ad' },
]

/* ── billing ─────────────────────────────────────────────────────────────── */

export const INVOICES = [
  { id: 'INV-2026-009', date: '14 سبتمبر 2026', amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
  { id: 'INV-2026-008', date: '14 أغسطس 2026', amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
  { id: 'INV-2026-007', date: '14 يوليو 2026',  amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
  { id: 'INV-2026-006', date: '14 يونيو 2026',  amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
]

export const PLAN_INCLUDES = [
  'توليد غير محدود',
  'استضافة مشمولة على beynoun.com',
  'نطاق مخصّص + شهادة SSL تلقائية',
  'الحجوزات وصندوق الطلبات',
  'أدوات السيو ومعاينة نتيجة جوجل',
  'تصدير ثيم شوبيفاي',
]

/* ── seo ─────────────────────────────────────────────────────────────────── */

export const SEO_SITE = {
  name: 'مطعم المدينة',
  host: 'al-madina.beynoun.com',
  title: 'مطعم المدينة | مطعم شامي معاصر في قلب المدينة',
  description: 'مطعم المدينة — مطبخ شامي معاصر. تصفّح القائمة، تواصل معنا، واحجز طاولتك مباشرة من الموقع.',
  keywords: 'مطعم شامي, حجز طاولة, مطعم المدينة',
}

/* ── Google Search Console ──────────────────────────────────────────────── */

export const GSC_EMAIL = 'nadia.almadina@gmail.com'

export const GSC_TOTALS = { impressions: 3184, clicks: 142, ctr: 0.0446, position: 12.7 }

export const GSC_QUERIES = [
  { query: 'مطعم شامي قريب مني', impressions: 912, clicks: 38, ctr: 0.042, position: 9.1 },
  { query: 'مطعم المدينة', impressions: 604, clicks: 61, ctr: 0.101, position: 1.4 },
  { query: 'حجز طاولة عشاء', impressions: 488, clicks: 11, ctr: 0.023, position: 17.8 },
  { query: 'منيو مطعم المدينة', impressions: 371, clicks: 19, ctr: 0.051, position: 2.2 },
  { query: 'أفضل شاورما في المدينة', impressions: 296, clicks: 6, ctr: 0.02, position: 21.4 },
  { query: 'مطاعم عائلية', impressions: 214, clicks: 4, ctr: 0.019, position: 24.9 },
  { query: 'فتوش وحمص', impressions: 163, clicks: 2, ctr: 0.012, position: 28.3 },
  { query: 'مطعم مفتوح الآن', impressions: 135, clicks: 1, ctr: 0.007, position: 31.0 },
]

/* ── home: traffic for any range, and today's bookings ──────────────────── */

const wave = (i: number, k = 1) => Math.round(110 + 80 * Math.sin(i / 3.1) + (i % 5) * 16 * k + (i % 9 === 0 ? 70 : 0))

/** Sample traffic for the home card and the analytics day view. */
export function demoTraffic(range: TRange | '12mo', back: number): TrafficData {
  const metrics: TMetric[] = ['views', 'visitors', 'sessions', 'events']
  const share: Record<TMetric, number> = { views: 1, visitors: 0.44, sessions: 0.62, events: 0.19 }
  const out = { values: {}, prev: {}, totals: {}, deltas: {} } as TrafficData
  if (range === 'day') {
    // A restaurant's day: quiet morning, lunch, a bigger dinner.
    const shape = [2, 1, 1, 0, 0, 1, 2, 4, 6, 8, 10, 14, 22, 26, 18, 12, 11, 14, 22, 30, 32, 24, 14, 6]
    const scale = 1 + ((back * 7) % 5) / 10
    const upto = back === 0 ? new Date().getHours() + 1 : 24
    for (const m of metrics) {
      const full = shape.map((v, h) => Math.round(v * scale * share[m] * (1 + (h % 3) / 10)))
      const prev = shape.map((v, h) => Math.round(v * 0.9 * share[m] * (1 + ((h + 1) % 4) / 10)))
      out.values[m] = full.slice(0, upto)
      out.prev[m] = prev
      const a = out.values[m].reduce((x, y) => x + y, 0)
      const b = prev.slice(0, upto).reduce((x, y) => x + y, 0)
      out.totals[m] = a
      out.deltas[m] = b ? Math.round((a / b - 1) * 1000) / 10 : null
    }
    out.slots = 24
    out.dates = []
    return out
  }
  const n = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
  const dates = Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  // A year grows slowly through a season; shorter ranges get the busy wave.
  const year = (i: number, k = 1) => Math.round((70 + 0.22 * i + 30 * Math.sin(i / 29) + (i % 7 === 4 ? 45 : 0) + (i % 5) * 9) * k)
  for (const m of metrics) {
    const cur = dates.map((_, i) => Math.round((n === 365 ? year(i) : wave(i + 365 - n)) * share[m]))
    const prev = dates.map((_, i) => Math.round((n === 365 ? year(i, 0.78) : wave(i + 365 - n, 0.6) * 0.84) * share[m]))
    out.values[m] = cur
    out.prev[m] = prev
    const a = cur.reduce((x, y) => x + y, 0)
    const b = prev.reduce((x, y) => x + y, 0)
    out.totals[m] = a
    out.deltas[m] = b ? Math.round((a / b - 1) * 1000) / 10 : null
  }
  out.slots = n
  out.dates = dates
  return out
}

export const HOME_TODAY = {
  list: [
    { id: 'b1', time: '13:30', name: 'خالد بن راشد', people: 3, status: 'confirmed' as const },
    { id: 'b2', time: '19:00', name: 'سارة الحمادي', people: 2, status: 'new' as const, hasNote: true },
    { id: 'b3', time: '20:30', name: 'ليلى منصور', people: 4, status: 'new' as const },
  ],
  tomorrow: [
    { id: 'b4', time: '14:00', name: 'منى القاسمي', people: 6, status: 'confirmed' as const, hasNote: true },
  ],
  week: 6,
}

/* ── analytics: the API's own answers, from the sample traffic ──────────── */

/* The v6 analytics page reads /api/analytics, /api/analytics/day,
   /api/analytics/realtime and /api/gsc/*. The demo answers those same paths
   here, in the same shapes, so the page it shows is the page an owner gets. */

const CHANNEL_KEYS = ['search', 'direct', 'social', 'referral', 'email']
const PAGE_TIME: Record<string, [number, number]> = {
  '/': [27_000, 79], '/menu': [64_000, 88], '/reservations': [44_000, 65], '/about': [10_000, 79], '/contact': [36_000, 50],
}
const COUNTRIES = [['AE', 1210], ['SA', 640], ['EG', 310], ['KW', 120], ['JO', 64]] as const
const DEVICES = [['Mobile', 78], ['Desktop', 19], ['Tablet', 3]] as const
const BROWSERS = [['Safari', 2410], ['Chrome', 2050], ['Instagram', 540], ['Other', 260]] as const
const CONTACTS = [['booking_click', 14], ['whatsapp_click', 12], ['map_click', 8], ['phone_click', 5], ['social_click', 1]] as const

const noonBack = (iso: string) => {
  const d = new Date(iso)
  d.setHours(12, 0, 0, 0)
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.max(0, Math.round((now.getTime() - d.getTime()) / 86_400_000))
}
const ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** /api/analytics for the sample site: a range, or one day (range=custom). */
function demoRange(q: Record<string, string>) {
  const r = q.range
  const back = r === 'custom' && q.from ? noonBack(q.from) : 0
  const t = r === 'custom' ? demoTraffic('day', back) : demoTraffic((r === '12mo' ? '12mo' : r) as TRange | '12mo', 0)
  const base = demoTraffic('30d', 0).totals.views
  const k = t.totals.views / base
  const sc = (n: number) => Math.max(0, Math.round(n * k))
  const series = r === 'custom'
    ? []
    : t.dates.map((date, i) => ({ date, views: t.values.views[i], sessions: t.values.sessions[i], visitors: t.values.visitors[i], events: t.values.events[i] }))
  const prev_series = r === 'custom'
    ? []
    : t.dates.map((date, i) => ({ date, views: t.prev.views[i], sessions: t.prev.sessions[i], visitors: t.prev.visitors[i], events: t.prev.events[i] }))
  const totals = { ...t.totals, bounce_rate: 0.41, avg_duration_ms: 108_000, conversion_rate: t.totals.visitors ? t.totals.events / t.totals.visitors : 0 }
  const contacts = CONTACTS.map(([event_type, n]) => ({ event_type, events: sc(n * 6), sessions: sc(n * 5) }))
  return {
    totals,
    previous: totals,
    delta: { ...t.deltas, bounce_rate: null, avg_duration_ms: r === 'custom' ? null : 6, conversion_rate: null },
    series,
    prev_series,
    pages: PAGES.map((p) => ({ path: p.name, views: sc(p.views), visitors: sc(p.visitors), avg_engaged_ms: PAGE_TIME[p.name]?.[0] ?? null, avg_scroll_pct: PAGE_TIME[p.name]?.[1] ?? null })),
    channels: CHANNELS.map((c, i) => ({ ...c, key: CHANNEL_KEYS[i], views: sc(c.views), visitors: sc(c.visitors), sessions: sc(c.sessions) })),
    countries: COUNTRIES.map(([name, v]) => ({ name, views: sc(v * 2), sessions: sc(v * 1.4), visitors: sc(v) })),
    devices: DEVICES.map(([name, v]) => ({ name, views: sc(v * 60), sessions: sc(v * 40), visitors: sc(v * 30) })),
    browsers: BROWSERS.map(([name, v]) => ({ name, views: sc(v), sessions: sc(v * 0.6), visitors: sc(v * 0.42) })),
    conversions: { total: contacts.reduce((a, c) => a + c.events, 0), rate: 0, by_type: contacts, by_path: [] },
  }
}

/** /api/analytics/day: the day's 24 hours, today only as far as now. */
function demoDay(q: Record<string, string>) {
  const [y, m, d] = (q.date || ymdOf(new Date())).split('-').map(Number)
  const back = noonBack(new Date(y, m - 1, d, 12).toISOString())
  const t = demoTraffic('day', back)
  const pad = (a: number[]) => [...a, ...Array(24 - a.length).fill(0)]
  return {
    date: q.date, prev_date: '', tz: q.tz, upto: t.values.views.length, partial: back === 0,
    hours: { views: pad(t.values.views), visitors: pad(t.values.visitors), sessions: pad(t.values.sessions), events: pad(t.values.events) },
    prev_hours: t.prev, totals: t.totals, prev_totals: t.totals, delta: t.deltas,
  }
}

const LIVE_PATHS = ['/', '/menu', '/reservations', '/contact']
const LIVE_SRC = ['direct', 'search', 'social', 'direct']
const LIVE_CC = ['AE', 'AE', 'SA', 'EG']

/** The sample site answering the analytics page's calls. */
export async function demoAnalyticsGet(path: string, q: Record<string, string>): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 120))
  if (path === '/api/analytics') return demoRange(q)
  if (path === '/api/analytics/day') return demoDay(q)
  if (path === '/api/analytics/realtime') {
    const now = Date.now()
    const tick = Math.floor(now / 10_000)
    return {
      active: 2 + (tick % 4),
      recent: Array.from({ length: 6 }, (_, i) => {
        const n = tick - i
        return {
          id: n, at: new Date(now - i * 97_000).toISOString(), path: LIVE_PATHS[n % 4], country: LIVE_CC[(n * 5) % 4],
          device: n % 5 === 0 ? 'Desktop' : 'Mobile', channel: LIVE_SRC[(n * 3) % 4], source: null, is_bot: false,
        }
      }),
    }
  }
  if (path === '/api/gsc/status') return { configured: true, connected: true, email: GSC_EMAIL }
  if (path === '/api/gsc/performance') return { connected: true, totals: GSC_TOTALS, queries: GSC_QUERIES }
  throw new Error('not in the demo')
}
