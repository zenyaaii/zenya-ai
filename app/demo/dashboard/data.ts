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
