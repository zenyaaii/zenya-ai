/**
 * The candidate dashboard's sample data.
 *
 * Invented, and the standing note under the page says so in Arabic. The shapes
 * are the product's own (SeriesPoint, Row) wherever a real component consumes
 * them, so TrendChart, Tile and BarList render this exactly as they render a
 * live payload — which is the whole point of the candidate: it exercises the
 * shipped components rather than reproducing them.
 *
 * It lives in its own module because the view file is nine surfaces long and a
 * hundred lines of fixtures in the middle of it makes both halves harder to
 * read. Same reason app/demo/access keeps its CSS in styles.ts.
 */

import type { SeriesPoint } from '@/components/dashboard/analytics/types'

/* ── traffic ─────────────────────────────────────────────────────────────── */

const DAYS = 30

export const SERIES: SeriesPoint[] = Array.from({ length: DAYS }, (_, i) => {
  const views = Math.round(120 + 90 * Math.sin(i / 3.1) + (i % 5) * 18 + (i > 22 ? 60 : 0))
  return {
    date: new Date(Date.now() - (DAYS - 1 - i) * 864e5).toISOString().slice(0, 10),
    views,
    sessions: Math.round(views * 0.62),
    visitors: Math.round(views * 0.44),
    events: Math.round(views * 0.19),
  }
})

export const PREV_SERIES: SeriesPoint[] = SERIES.map((p, i) => ({
  ...p,
  views: Math.round(p.views * 0.82 + (i % 7) * 4),
  sessions: Math.round(p.sessions * 0.79 + (i % 5) * 3),
  visitors: Math.round(p.visitors * 0.84 + (i % 6) * 2),
  events: Math.round(p.events * 0.71 + (i % 4) * 2),
}))

export const TOTALS = SERIES.reduce(
  (a, s) => ({
    views: a.views + s.views,
    sessions: a.sessions + s.sessions,
    visitors: a.visitors + s.visitors,
    events: a.events + s.events,
  }),
  { views: 0, sessions: 0, visitors: 0, events: 0 },
)

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
  { id: 's1', name: 'مطعم المدينة', kind: 'مطعم',   host: 'al-madina.zenyaai.co',   live: true,  views: 4821, updated: 'قبل يومين' },
  { id: 's2', name: 'أطلس ستوديو',  kind: 'تطبيق',  host: 'atlas-studio.zenyaai.co', live: true,  views: 1264, updated: 'قبل 6 أيام' },
  { id: 's3', name: 'واحة العافية',  kind: 'عافية',  host: 'waha.zenyaai.co',        live: true,  views: 738,  updated: 'قبل أسبوعين' },
  { id: 's4', name: 'لوك بوك ٢٦',   kind: 'أزياء',  host: null,                     live: false, views: 0,    updated: 'قبل شهر' },
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
  { domain: 'lookbook26.com',   site: 'لوك بوك ٢٦',   status: 'ينتهي قريبًا', tone: 'quiet',  ssl: true,  renews: '28 سبتمبر 2026' },
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
  { id: 'a8', name: 'إطلالة الخريف.jpg',  site: 'لوك بوك ٢٦',   size: '598 ك.ب', tint: '#c3aeb2' },
  { id: 'a9', name: 'تفاصيل القماش.jpg',  site: 'لوك بوك ٢٦',   size: '333 ك.ب', tint: '#b8a6ad' },
]

/* ── billing ─────────────────────────────────────────────────────────────── */

export const INVOICES = [
  { id: 'INV-2026-009', date: '14 سبتمبر 2026', amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
  { id: 'INV-2026-008', date: '14 أغسطس 2026', amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
  { id: 'INV-2026-007', date: '14 يوليو 2026',  amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
  { id: 'INV-2026-006', date: '14 يونيو 2026',  amount: '24.99$', status: 'مدفوعة', tone: 'ok' as BookingTone },
]

export const PLAN_INCLUDES = [
  'توليد غير محدود بالذكاء الاصطناعي',
  'استضافة مشمولة على zenyaai.co',
  'نطاق مخصّص + شهادة SSL تلقائية',
  'الحجوزات وصندوق الطلبات',
  'أدوات السيو ومعاينة نتيجة جوجل',
  'تصدير ثيم شوبيفاي',
]

/* ── seo ─────────────────────────────────────────────────────────────────── */

export const SEO_SITE = {
  name: 'مطعم المدينة',
  host: 'al-madina.zenyaai.co',
  title: 'مطعم المدينة | مطعم شامي معاصر في قلب المدينة',
  description: 'مطعم المدينة — مطبخ شامي معاصر. تصفّح القائمة، تواصل معنا، واحجز طاولتك مباشرة من الموقع.',
  keywords: 'مطعم شامي, حجز طاولة, مطعم المدينة',
}
