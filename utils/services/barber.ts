/**
 * The barber kind of the services template.
 *
 * Everything on a barber site is a fact the owner gave us or Google holds:
 * the barbers' names, the services and their prices, the hours, the reviews.
 * Nothing here calls a model, so the content is built the same way every
 * time and costs nothing. A fact we do not have is left out of the page, and
 * the editor shows it as a field to fill (see BarberView for what each gap
 * turns into).
 *
 * Shared by the wizard's route (/api/generate-barber), the lead builder and
 * the view.
 */

import { z } from 'zod'
import type { ContentSource, ServiceContent, ServiceHoursDay, ServiceTeamMember } from './types'
import { KIND, NICHE_KINDS, type NicheKind } from './kinds'

/** Where /demo/barber-build leaves the site it built, for /demo/editor?type=barber to open. */
export const DEMO_BUILT_KEY = 'beynoun:demo-niche-site'

/** Saturday first: the week as it is read across the Gulf and the Levant. */
export const DAYS_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] as const

const hhmm = z.string().regex(/^\d{1,2}:\d{2}$/)
const url = z.string().trim().max(800)

export const barberInputSchema = z.object({
  kind: z.enum(NICHE_KINDS as [NicheKind, ...NicheKind[]]).default('barber'),
  name: z.string().trim().min(2).max(80),
  latin: z.string().trim().max(60).optional(),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  audience: z.string().trim().max(40).optional(),
  phone: z.string().trim().min(4).max(40),
  whatsapp: z.string().trim().max(60).optional(),
  email: z.string().trim().email().max(120).optional().or(z.literal('')),
  maps_url: url.min(8),
  /** Empty only when the owner pressed «ليس عندي حساب». */
  instagram: z.string().trim().max(200).optional(),
  links: z.array(z.object({ label: z.string().trim().max(40), url })).max(10).optional().default([]),
  barbers: z
    .array(z.object({
      name: z.string().trim().min(1).max(40),
      role: z.string().trim().max(40).optional(),
      photo: url.optional(),
      tags: z.array(z.string().trim().min(1).max(24)).max(6).optional().default([]),
    }))
    .max(12)
    .default([]),
  services: z
    .array(z.object({
      name: z.string().trim().min(2).max(60),
      price: z.string().trim().max(20).optional(),
      duration: z.string().trim().max(20).optional(),
      note: z.string().trim().max(80).optional(),
    }))
    .min(1)
    .max(24),
  currency: z.string().trim().max(10).optional(),
  booking: z.object({
    mode: z.enum(['appointment', 'walkin', 'both']).default('both'),
    wait: z.string().trim().max(80).optional(),
    busy: z.string().trim().max(80).optional(),
  }).default({ mode: 'both' }),
  hours: z
    .array(z.object({ day: z.number().int().min(0).max(6), closed: z.boolean().optional(), periods: z.array(z.object({ open: hhmm, close: hhmm })).max(3) }))
    .max(7)
    .optional()
    .default([]),
  photos: z.object({
    hero: url.optional(),
    side: url.optional(),
    gallery: z.array(url).max(12).optional().default([]),
  }).default({ gallery: [] }),
  faq: z.array(z.object({ q: z.string().trim().min(4).max(140), a: z.string().trim().max(500) })).max(16).optional().default([]),
  /** Stated terms: a gym's freeze and cancel rules, a garage's warranty. */
  terms: z.array(z.object({ label: z.string().trim().max(40), text: z.string().trim().max(200) })).max(8).optional().default([]),
  logo: url.optional(),
  /** «هل تريد أن تضيف شيئًا؟» in the owner's words. Kept, not shown, until the organizer places it. */
  extra: z.string().trim().max(1500).optional(),
  /** «هل تتمنى أن نسألك عن شيء آخر؟»: feedback for us, never on the site. */
  wish: z.string().trim().max(800).optional(),
})

export type BarberInput = z.infer<typeof barberInputSchema>

/** What Google holds for the place; every field may be missing. */
export type BarberGoogle = {
  place_id?: string
  maps_url?: string
  rating?: number | null
  count?: number | null
  reviews?: { name: string; rating: number; text: string; when: string }[]
  /** Google's weekly periods, Sunday = 0 as Google counts. */
  periods?: { open?: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } }[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Google's periods (Sunday = 0) → our week (Saturday = 0). Closed days kept as closed. */
export function hoursFromGoogle(periods: NonNullable<BarberGoogle['periods']>): ServiceHoursDay[] {
  if (!periods.length) return []
  // Open around the clock: one period with no close.
  if (periods.length === 1 && periods[0].open && !periods[0].close) {
    return DAYS_AR.map((_, day) => ({ day, periods: [{ open: '00:00', close: '24:00' }] }))
  }
  const days: ServiceHoursDay[] = DAYS_AR.map((_, day) => ({ day, closed: true, periods: [] }))
  for (const p of periods) {
    if (!p.open) continue
    const day = (p.open.day + 1) % 7
    const close = p.close ? (p.close.day !== p.open.day && p.close.hour === 0 && p.close.minute === 0 ? '24:00' : `${pad(p.close.hour)}:${pad(p.close.minute)}`) : '24:00'
    days[day].closed = false
    days[day].periods.push({ open: `${pad(p.open.hour)}:${pad(p.open.minute)}`, close })
  }
  return days
}

/** "22:00" → "10 م", "09:30" → "9:30 ص". 24:00 and 00:00 read as midnight. */
export function timeAr(t: string): string {
  const [h, m] = t.split(':').map(Number)
  if (h === 24 || (h === 0 && m === 0)) return '12 ليلًا'
  const h12 = h % 12 || 12
  return `${h12}${m ? ':' + pad(m) : ''} ${h < 12 ? 'ص' : 'م'}`
}

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

/** Open now, by the visitor's own clock. Call it after mount: it reads the time. */
export function openState(hours: ServiceHoursDay[] | undefined, now = new Date()): { open: boolean; text: string; today: number } | null {
  if (!hours?.length) return null
  const today = (now.getDay() + 1) % 7
  const min = now.getHours() * 60 + now.getMinutes()
  const d = hours.find((x) => x.day === today)
  const live = d && !d.closed ? d.periods.find((p) => { const o = toMin(p.open), c = toMin(p.close); return c > o ? min >= o && min < c : min >= o || min < c }) : undefined
  if (live) return { open: true, text: `يغلق ${timeAr(live.close)}`, today }
  const later = d && !d.closed ? d.periods.find((p) => toMin(p.open) > min) : undefined
  if (later) return { open: false, text: `يفتح ${timeAr(later.open)}`, today }
  for (let i = 1; i <= 7; i++) {
    const n = hours.find((x) => x.day === (today + i) % 7)
    if (n && !n.closed && n.periods[0]) return { open: false, text: `يفتح ${i === 1 ? 'غدًا' : DAYS_AR[n.day]} ${timeAr(n.periods[0].open)}`, today }
  }
  return { open: false, text: '', today }
}

/** Arabic-aware: "عمار" also matches "عمّار" and "العمار" is not a name hit. */
function mentions(text: string, name: string): boolean {
  const strip = (s: string) => s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  const t = ' ' + strip(text).replace(/[^\p{L}\p{N}]+/gu, ' ') + ' '
  const n = strip(name).trim()
  if (n.length < 2) return false
  return new RegExp(`[ ](?:ل|ب|و|ك|عند |مع )?${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ ]`).test(t)
}

/** The sentence of a review that names the barber, trimmed to a quote. */
export function quoteFor(name: string, reviews: { name: string; text: string; rating: number }[]): { quote: string; by: string; count: number } | null {
  const hits = reviews.filter((r) => r.rating >= 4 && mentions(r.text, name))
  if (!hits.length) return null
  const pick = (r: (typeof hits)[number]) => {
    const parts = r.text.split(/(?<=[.!؟?،,])\s+|\n+/).map((s) => s.trim()).filter(Boolean)
    let q = parts.find((p) => mentions(p, name)) || r.text
    const i = parts.indexOf(q)
    if (q.length < 50 && i >= 0 && parts[i + 1]) q = [q, parts[i + 1]].join(' ')
    if (q.length < 50 && i > 0) q = [parts[i - 1], q].join(' ')
    if (q.length > 170) q = q.slice(0, 165).replace(/\s+\S*$/, '') + '…'
    return q
  }
  // The most telling quote: one that says what he did, not only thanks.
  const ranked = hits.map((r) => ({ r, q: pick(r) })).sort((a, b) => Math.abs(a.q.length - 110) - Math.abs(b.q.length - 110))
  const { r, q: quote } = ranked[0]
  return { quote, by: r.name, count: hits.length }
}

const DEFAULT_FAQ_ORDER = ['موعد', 'تجميد', 'إلغاء', 'يؤلم', 'التأمين', 'ضمان', 'انتظر', 'السعر']

/**
 * The whole site content from the wizard's answers and Google's facts.
 * Deterministic: the same answers always give the same site.
 */
export function buildBarberContent(input: BarberInput, g: BarberGoogle = {}): ServiceContent {
  const reviews = (g.reviews || []).filter((r) => r.text && r.rating >= 4).slice(0, 5)
  const members: ServiceTeamMember[] = input.barbers.map((b) => {
    const q = quoteFor(b.name, g.reviews || [])
    return {
      name: b.name,
      role: b.role || undefined,
      photo: b.photo || undefined,
      tags: b.tags?.length ? b.tags : undefined,
      quote: q?.quote,
      quote_by: q?.by,
    }
  })
  const k = KIND[input.kind]
  const short = input.name.replace(k.prefix, '').replace(k.suffix, '').trim() || input.name
  const named = members.filter((m) => m.quote).map((m) => m.name)
  const where = [input.area, input.city].filter(Boolean).join('، ')
  const lede = k.lede({ named, area: named.length >= 2 ? (input.area || input.city) : where, audience: input.audience })
  const hours = input.hours.length ? input.hours : hoursFromGoogle(g.periods || [])
  const cur = input.currency?.trim() || ''
  const instagram = input.instagram?.trim() || undefined

  const faq = [...input.faq].filter((f) => f.a.trim())
  faq.sort((a, b) => rank(a.q) - rank(b.q))
  function rank(q: string) { const i = DEFAULT_FAQ_ORDER.findIndex((k) => q.includes(k)); return i < 0 ? 99 : i }

  const gallery = [input.photos.hero, input.photos.side, ...(input.photos.gallery || [])].filter((u, i, all): u is string => !!u && all.indexOf(u) === i)

  return {
    niche: input.kind,
    brand: {
      name: input.name,
      category: k.label,
      city: input.city,
      region: input.area,
      area: input.area,
      latin: input.latin || undefined,
      audience: input.audience || undefined,
      tagline: lede,
      name_display: 'arabic',
    },
    hero: {
      eyebrow: [input.latin, input.city].filter(Boolean).join(' · '),
      headline: short,
      subheadline: lede,
      primary_cta: input.booking.mode === 'walkin' ? 'تعال مباشرة' : k.cta,
      secondary_cta: `${k.services} والأسعار`,
      image: input.photos.hero || '',
      stats: [],
    },
    trust_bar: { items: [] },
    services: {
      heading: k.services,
      subheading: input.services.some((s) => s.price) ? 'السعر المكتوب هو ما تدفعه.' : '',
      items: input.services.map((s) => ({
        name: s.name,
        description: s.note || '',
        price_from: s.price ? `${s.price}${cur ? ' ' + cur : ''}` : undefined,
        duration: s.duration || undefined,
      })),
    },
    story: { eyebrow: '', heading: '', body: '', image: input.photos.side },
    proof: { heading: '', subheading: '', items: [] },
    before_after: { heading: '', subheading: '', before_label: '', after_label: '', before_image: '', after_image: '', highlights: [] },
    process: { heading: '', subheading: '', steps: [] },
    areas: { heading: '', subheading: '', areas_served: [], response_time: '', availability: '' },
    offer: { heading: '', subheading: '', points: [], cta_label: '' },
    testimonials: {
      heading: 'ماذا يقول زبائننا',
      subheading: '',
      average_rating: g.rating ?? undefined,
      review_count: g.count ? String(g.count) : undefined,
      items: reviews.map((r) => ({ name: r.name, text: r.text, rating: r.rating, origin: 'google' as const, when: r.when, source: 'Google' })),
    },
    faq: { heading: 'قبل أن تأتي', items: faq },
    final_cta: { heading: k.cta, subheading: '', cta_label: k.cta, secondary_text: '' },
    gallery: { heading: k.place, images: gallery.map((u) => ({ url: u, alt: '', source: sourceOfPhoto(u), from: SOURCE_AR[sourceOfPhoto(u)] })) },
    footer: { tagline: lede, legal: '', phone: input.phone, email: input.email || '', address: input.address || where },
    seo: {
      title: `${input.name} | ${k.seo} في ${input.area || input.city}`,
      description: `${lede} ${k.cta}، وشاهد ${k.services} والأسعار والأوقات والموقع.`.slice(0, 160),
    },
    links: {
      whatsapp: input.whatsapp || undefined,
      reviews_url: g.maps_url || input.maps_url,
      extra: input.links.filter((l) => l.url).length ? input.links.filter((l) => l.url) : undefined,
    },
    social_links: instagram ? { instagram } : undefined,
    team: { heading: k.team, members },
    terms: input.terms.filter((t) => t.text.trim()).length ? input.terms.filter((t) => t.text.trim()) : undefined,
    hours,
    booking: { mode: input.booking.mode, wait: input.booking.wait || undefined, busy: input.booking.busy || undefined },
    google: { rating: g.rating ?? undefined, count: g.count ?? undefined, maps_url: g.maps_url || input.maps_url, place_id: g.place_id },
  }
}

/** Our storage keeps Google and Instagram copies in their own folders; anything else the owner gave. */
export function sourceOfPhoto(u: string): ContentSource {
  return /\/google\//.test(u) ? 'google' : /\/instagram\//.test(u) ? 'instagram' : /\/facebook\//.test(u) ? 'facebook' : 'owner'
}
export const SOURCE_AR: Record<ContentSource, string> = { owner: 'منك', instagram: 'من إنستغرام', facebook: 'من فيسبوك', tiktok: 'من تيك توك', google: 'من جوجل', default: 'اقتراح منا' }

/** Every kind builds the same way; the barber was first. */
export const nicheInputSchema = barberInputSchema
export type NicheInput = BarberInput
export const buildNicheContent = buildBarberContent

/**
 * How complete the site is (the probability rule, spec 2026-11-12 §5-ج).
 * Each part has a weight (they sum to 100) and a fill from 0 to 1, so the
 * owner sees «موقعك مكتمل 65٪» and the one step that adds the most.
 */
export type Completeness = {
  pct: number
  parts: { id: string; label: string; weight: number; fill: number }[]
  next?: { id: string; label: string; gain: number }
}

const PARTS: { id: string; weight: number; label: string; ask: string }[] = [
  { id: 'services', weight: 20, label: 'الخدمات', ask: 'اختر خدماتك أو أضفها' },
  { id: 'prices', weight: 15, label: 'الأسعار', ask: 'أضف أسعارك' },
  { id: 'photos', weight: 20, label: 'الصور', ask: 'أضف صورًا حقيقية للمحل' },
  { id: 'team', weight: 10, label: 'الفريق', ask: 'أضف أسماء الفريق' },
  { id: 'reviews', weight: 10, label: 'التقييمات', ask: 'ضع رابط خرائط جوجل لنجلب تقييماتك' },
  { id: 'booking', weight: 10, label: 'الحجز', ask: 'قل للزبون كم ينتظر ومتى الزحمة' },
  { id: 'hours', weight: 5, label: 'الأوقات', ask: 'أضف أوقات الدوام' },
  { id: 'faq', weight: 5, label: 'الأسئلة', ask: 'أجب عن أسئلة زبائنك' },
  { id: 'extra', weight: 5, label: 'ما يميّزك', ask: 'اكتب ما يميّز محلك' },
]

export function completeness(input: Partial<BarberInput>, g: BarberGoogle = {}, o: { photos?: number; suggestedOnly?: boolean } = {}): Completeness {
  const svc = input.services || []
  const priced = svc.filter((s) => s.price).length
  const photos = o.photos ?? [input.photos?.hero, input.photos?.side, ...(input.photos?.gallery || [])].filter(Boolean).length
  const fill: Record<string, number> = {
    services: !svc.length ? 0 : o.suggestedOnly ? 0.5 : Math.min(1, svc.length / 3),
    prices: svc.length ? priced / svc.length : 0,
    photos: Math.min(1, photos / 6),
    team: (input.barbers || []).length ? 1 : 0,
    reviews: Math.min(1, (g.reviews || []).length / 3),
    booking: 0.4 + (input.booking?.wait ? 0.3 : 0) + (input.booking?.busy ? 0.3 : 0),
    hours: (input.hours || []).length || (g.periods || []).length ? 1 : 0,
    faq: Math.min(1, (input.faq || []).filter((f) => f.a).length / 3),
    extra: (input.extra || '').length >= 20 ? 1 : 0,
  }
  const parts = PARTS.map((p) => ({ id: p.id, label: p.label, weight: p.weight, fill: fill[p.id] }))
  const pct = Math.round(parts.reduce((a, p) => a + p.weight * p.fill, 0))
  const gap = PARTS.map((p) => ({ id: p.id, label: p.ask, gain: Math.round(p.weight * (1 - fill[p.id])) })).sort((a, b) => b.gain - a.gain)[0]
  return { pct, parts, next: gap && gap.gain > 0 ? gap : undefined }
}
