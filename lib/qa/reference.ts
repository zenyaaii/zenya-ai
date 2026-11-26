/**
 * The reference — «الأساس» — that «فاحص بينون» checks a site against.
 *
 * Given what a site was built from (the same props the public renderer gets:
 * template, content, preset, colour overrides), it says:
 *
 *   pages      every page the site must open (lib/site-pages)
 *   facts      every piece of real information that must be visible: the name,
 *              the phone, each service, each price, each review, the hours…
 *   absent     sections that must NOT appear, because their data is missing
 *              (a reviews heading over no reviews, a team heading over no team)
 *   forbidden  text that must never be on a customer site (placeholders,
 *              demo names, «منيو», words left in English)
 *   palette    the colours the site may paint with, and where they came from:
 *              the business's own (measured from its photos and logo) or one
 *              of our stock palettes — a colour "from our heads"
 *   actions    where each kind of button must go (wa.me/<number>, tel:<number>, maps)
 *   claims     numbers and reviews that no source backs (likely written by a model)
 *
 * Pure: no fetch, no DOM. The agent (scripts/qa) reads a site's props from the
 * page itself, calls referenceFor(), and measures the rendered page against it.
 */

import { resolveSitePalette } from '@/lib/site-palette'
import { pagesFor } from '@/lib/site-pages'
import { KIND, isNicheKind } from '@/utils/services/kinds'
import { SERVICE_PRESETS } from '@/utils/services/presets'
import { WELLNESS_PRESETS } from '@/utils/wellness/presets'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import { STUDIO_PRESETS } from '@/utils/studio/presets'
import { BRAND_LOOKS } from '@/utils/studio/brand-looks'
import { dE, parseColor } from './color'

export type SiteProps = {
  businessType: string
  content: any
  presetId?: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  logo?: string
}

export type Fact = {
  id: string
  /** Which group it belongs to, in Arabic: «الخدمات», «التقييمات»… */
  group: string
  label: string
  /** Any one of these, normalised, must be visible somewhere on the site. */
  any: string[]
  kind: 'text' | 'phone' | 'image' | 'link'
  /** Must be on the home page, not just somewhere on the site. */
  home?: boolean
  weight: number
}

export type AbsentRule = { id: string; group: string; because: string; headings: RegExp[] }
export type ForbiddenRule = { id: string; label: string; pattern: RegExp; severity: 'high' | 'medium' | 'low' }
export type Claim = { id: string; label: string; text: string; why: string }

export type Reference = {
  template: string
  niche?: string
  name: string
  pages: { path: string; label: string }[]
  facts: Fact[]
  absent: AbsentRule[]
  forbidden: ForbiddenRule[]
  palette: {
    colors: Record<string, string>
    /** 'brand' = measured from the business; 'stock' = one of our palettes; 'default' = the template's fallback. */
    source: 'brand' | 'stock' | 'default'
    stockMatch?: string
    headingFont?: string
    bodyFont?: string
  }
  actions: { whatsapp?: string; phone?: string; maps?: boolean; email?: string }
  claims: Claim[]
  /** How much real information the site was given, by group, so "filled" can be measured. */
  inventory: Record<string, number>
}

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const arr = <T = any>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const digits = (v: string) => v.replace(/[^\d]/g, '').replace(/^00/, '')
/** A review or paragraph is matched on its opening words: templates clamp long text. */
const opening = (t: string, n = 6) => t.replace(/[«»"“”]/g, '').split(/\s+/).filter(Boolean).slice(0, n).join(' ')

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
/** The normal form both the reference and the page text go through before matching. */
export function norm(t: string): string {
  return t
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel + tatweel
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[‌-‏‪-‮⁦-⁩]/g, '')
    .replace(/[«»"“”'’‘()\[\]{}.,،؛:!?؟\-–—_/\\|*•·]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/* ── the stock palettes: every colour set we ship, i.e. colours from our heads ── */
type Stock = { id: string; bg: string; accent: string }
const STOCK: Stock[] = [
  ...SERVICE_PRESETS.map((p) => ({ id: `services:${p.id}`, bg: p.colors.background, accent: p.colors.accent })),
  ...WELLNESS_PRESETS.map((p) => ({ id: `wellness:${p.id}`, bg: (p.colors as any).background, accent: (p.colors as any).accent })),
  ...RESTAURANT_PRESETS.map((p) => ({ id: `restaurant:${p.id}`, bg: (p.colors as any).background, accent: (p.colors as any).accent })),
  ...STUDIO_PRESETS.map((p) => ({ id: `studio:${p.id}`, bg: (p.colors as any).background, accent: (p.colors as any).accent })),
  ...BRAND_LOOKS.map((p) => ({ id: `brand-look:${p.id}`, bg: p.colors.background, accent: p.colors.accent })),
  ...Object.values(KIND).flatMap((k) => k.looks.map((l) => ({ id: `${k.id}:${l.id}`, bg: l.colors.background, accent: l.colors.accent }))),
]

function stockMatch(colors: Record<string, string>): string | undefined {
  const bg = parseColor(colors.background), ac = parseColor(colors.accent)
  if (!bg || !ac) return undefined
  for (const st of STOCK) {
    const b = parseColor(st.bg), a = parseColor(st.accent)
    if (b && a && dE(bg, b) < 3 && dE(ac, a) < 3) return st.id
  }
  return undefined
}

/* ── words that must never reach a customer's page ── */
const FORBIDDEN: ForbiddenRule[] = [
  { id: 'lorem', label: 'نص تجريبي (lorem)', pattern: /lorem|ipsum/i, severity: 'high' },
  { id: 'undefined', label: 'قيمة برمجية ظاهرة (undefined/null/NaN)', pattern: /\b(undefined|null|NaN)\b|\[object/, severity: 'high' },
  { id: 'braces', label: 'قالب لم يُملأ ({{…}})', pattern: /\{\{|\}\}|\$\{/, severity: 'high' },
  { id: 'xxxx', label: 'رقم أو نص مكان المعلومة (XXXX)', pattern: /X{4,}|x{5,}|0{6,}/, severity: 'high' },
  { id: 'placeholder-ar', label: 'نص مكان المعلومة («اكتب هنا»، «اسم المحل»)', pattern: /اكتب هنا|اسم (المحل|النشاط|المطعم) هنا|نص تجريبي|وصف قصير هنا/, severity: 'high' },
  { id: 'example', label: 'عنوان تجريبي (example.com / test@)', pattern: /example\.(com|org)|test@|@example/i, severity: 'high' },
  { id: 'menu-word', label: '«منيو» بدل «قائمة»', pattern: /منيو/, severity: 'medium' },
  { id: 'zero-reviews', label: '«0 تقييم» أو تقييم صفر ظاهر', pattern: /(^|\s)0(\.0)?\s*(من|تقييم|نجوم)/, severity: 'medium' },
  { id: 'ai-word', label: 'كلمة «ذكاء اصطناعي» على موقع العميل', pattern: /ذكاء اصطناعي|\bAI\b/, severity: 'low' },
]

/* ── the facts each template must show ── */
type Builder = (c: any, f: FactSink) => void
type FactSink = {
  fact: (group: string, label: string, values: (string | undefined)[], kind?: Fact['kind'], opts?: { home?: boolean; weight?: number }) => void
  absentIf: (empty: boolean, group: string, because: string, headings: RegExp[]) => void
  claim: (label: string, text: string, why: string) => void
  count: (group: string, n: number) => void
}

const H = {
  reviews: [/^(اراء|آراء|تقييمات|التقييمات|ماذا يقول|قالوا عنا|يقول (عملاؤنا|زبائننا)|شهادات)/],
  team: [/^(الفريق|فريقنا|فريق العمل|الحلاقون|المدربون|خبراؤنا|أخصائيونا|اخصائيونا)/],
  faq: [/^(اسئله|أسئلة|الأسئلة|الاسئله|قبل ان تاتي|قبل أن تأتي)/],
  gallery: [/^(المعرض|معرض الصور|صور(نا)?|أعمالنا|اعمالنا)$/],
  prices: [/^(الأسعار|الاسعار|قائمة الأسعار|قائمه الاسعار)$/],
  menu: [/^(القائمة|القائمه|قائمة الطعام|قائمه الطعام)$/],
  hours: [/^(ساعات العمل|أوقات العمل|اوقات العمل|مواعيد العمل)$/],
}

const services: Builder = (c, f) => {
  const name = s(c.brand?.name)
  f.fact('الأساسيات', 'اسم النشاط', [name, s(c.brand?.latin)], 'text', { home: true, weight: 3 })
  f.fact('التواصل', 'رقم الهاتف', [s(c.footer?.phone)], 'phone', { home: true, weight: 3 })
  if (s(c.footer?.address) || s(c.brand?.area)) f.fact('التواصل', 'العنوان أو المنطقة', [s(c.footer?.address), s(c.brand?.area), s(c.brand?.city)], 'text', { weight: 2 })
  const items = arr(c.services?.items)
  f.count('الخدمات', items.length)
  for (const it of items.slice(0, 24)) {
    f.fact('الخدمات', `خدمة: ${s(it.name)}`, [s(it.name)], 'text', { weight: 1 })
    if (s(it.price_from)) f.fact('الأسعار', `سعر ${s(it.name)}`, [s(it.price_from)], 'text', { weight: 1 })
  }
  f.count('الأسعار', items.filter((i) => s(i.price_from)).length)
  const team = arr(c.team?.members)
  f.count('الفريق', team.length)
  for (const m of team.slice(0, 12)) f.fact('الفريق', `عضو الفريق: ${s(m.name)}`, [s(m.name)], 'text', { weight: 1 })
  f.absentIf(!team.length, 'الفريق', 'لا يوجد فريق في البيانات', H.team)
  const reviews = arr(c.testimonials?.items)
  f.count('التقييمات', reviews.length)
  for (const r of reviews.slice(0, 8)) {
    if (s(r.text)) f.fact('التقييمات', `تقييم ${s(r.name) || ''}`.trim(), [opening(s(r.text))], 'text', { weight: 1 })
    if (r.origin !== 'google' && r.origin !== 'manual' && !s(r.when)) f.claim('تقييم بلا مصدر', opening(s(r.text), 10), 'لا يوجد ما يثبت أن زبونًا حقيقيًا كتبه (لا جوجل ولا صاحب المحل)')
  }
  f.absentIf(!reviews.length, 'التقييمات', 'لا توجد تقييمات في البيانات', H.reviews)
  const faq = arr(c.faq?.items).filter((x) => s(x.a))
  f.count('الأسئلة', faq.length)
  for (const q of faq.slice(0, 8)) f.fact('الأسئلة', `سؤال: ${opening(s(q.q), 5)}`, [opening(s(q.q), 5)], 'text', { weight: 1 })
  f.absentIf(!faq.length, 'الأسئلة', 'لا توجد أسئلة مُجابة', H.faq)
  const hours = arr(c.hours)
  f.count('ساعات العمل', hours.length)
  f.absentIf(!hours.length && !s(c.areas?.availability), 'ساعات العمل', 'لا توجد ساعات عمل في البيانات', H.hours)
  const gallery = arr(c.gallery?.images)
  f.count('الصور', gallery.length + (s(c.hero?.image) ? 1 : 0))
  if (c.google?.rating) f.fact('جوجل', 'تقييم جوجل', [String(c.google.rating)], 'text', { weight: 1 })
  if (c.google?.maps_url) f.count('الخريطة', 1)
  for (const st of arr(c.hero?.stats)) if (s(st.value) && !backedNumber(s(st.value), c)) f.claim('رقم في الواجهة', `${s(st.value)} ${s(st.label)}`, 'رقم بلا مصدر (لا يوجد في بيانات المحل ولا في جوجل)')
}

const wellness: Builder = (c, f) => {
  f.fact('الأساسيات', 'اسم النشاط', [s(c.brand?.name)], 'text', { home: true, weight: 3 })
  f.fact('التواصل', 'رقم الهاتف', [s(c.footer?.phone)], 'phone', { weight: 3 })
  if (s(c.footer?.address)) f.fact('التواصل', 'العنوان', [s(c.footer?.address), s(c.brand?.city)], 'text', { weight: 2 })
  const items = arr(c.treatments?.items)
  f.count('الخدمات', items.length)
  for (const it of items.slice(0, 20)) {
    f.fact('الخدمات', `خدمة: ${s(it.name)}`, [s(it.name)], 'text', { weight: 1 })
    if (s(it.price)) f.fact('الأسعار', `سعر ${s(it.name)}`, [s(it.price)], 'text', { weight: 1 })
  }
  f.count('الأسعار', items.filter((i) => s(i.price)).length)
  const team = arr(c.team?.members)
  f.count('الفريق', team.length)
  for (const m of team.slice(0, 10)) f.fact('الفريق', `عضو الفريق: ${s(m.name)}`, [s(m.name)], 'text', { weight: 1 })
  f.absentIf(!team.length, 'الفريق', 'لا يوجد فريق في البيانات', H.team)
  const reviews = arr(c.testimonials?.items)
  f.count('التقييمات', reviews.length)
  for (const r of reviews.slice(0, 8)) {
    if (s(r.text)) f.fact('التقييمات', `تقييم ${s(r.name)}`.trim(), [opening(s(r.text))], 'text', { weight: 1 })
    if (!s(r.source) && r.origin !== 'google') f.claim('تقييم بلا مصدر', opening(s(r.text), 10), 'لا يوجد ما يثبت أن زبونًا حقيقيًا كتبه')
  }
  f.absentIf(!reviews.length, 'التقييمات', 'لا توجد تقييمات', H.reviews)
  const faq = arr(c.faq?.items).filter((x) => s(x.a))
  f.count('الأسئلة', faq.length)
  f.absentIf(!faq.length, 'الأسئلة', 'لا توجد أسئلة مُجابة', H.faq)
  f.count('الصور', arr(c.space?.images).length + (s(c.hero?.image) ? 1 : 0))
  if (s(c.footer?.hours)) f.count('ساعات العمل', 1)
}

const restaurant: Builder = (c, f) => {
  f.fact('الأساسيات', 'اسم المطعم', [s(c.brand?.name)], 'text', { home: true, weight: 3 })
  const hl = c.hours_location || {}
  f.fact('التواصل', 'رقم الهاتف', [s(hl.phone)], 'phone', { weight: 3 })
  if (s(hl.address)) f.fact('التواصل', 'العنوان', [s(hl.address)], 'text', { weight: 2 })
  const cats = arr(c.menu?.categories)
  const items = cats.flatMap((k) => arr(k.items))
  f.count('القائمة', items.length)
  for (const k of cats.slice(0, 12)) if (s(k.name)) f.fact('القائمة', `قسم القائمة: ${s(k.name)}`, [s(k.name)], 'text', { weight: 1 })
  for (const it of items.slice(0, 40)) {
    f.fact('القائمة', `صنف: ${s(it.name)}`, [s(it.name)], 'text', { weight: 1 })
    if (s(it.price)) f.fact('الأسعار', `سعر ${s(it.name)}`, [s(it.price)], 'text', { weight: 1 })
  }
  f.count('الأسعار', items.filter((i) => s(i.price)).length)
  f.absentIf(!items.length, 'القائمة', 'لا توجد أصناف في القائمة', H.menu)
  for (const d of arr(c.signature_dishes).slice(0, 8)) if (s(d.name)) f.fact('الأطباق المميزة', `طبق: ${s(d.name)}`, [s(d.name)], 'text', { weight: 1 })
  const reviews = arr(c.reviews?.testimonials)
  f.count('التقييمات', reviews.length)
  for (const r of reviews.slice(0, 8)) {
    if (s(r.text)) f.fact('التقييمات', `تقييم ${s(r.name)}`.trim(), [opening(s(r.text))], 'text', { weight: 1 })
    if (!s(r.source)) f.claim('تقييم بلا مصدر', opening(s(r.text), 10), 'لا يوجد ما يثبت أن زبونًا حقيقيًا كتبه')
  }
  f.absentIf(!reviews.length, 'التقييمات', 'لا توجد تقييمات', H.reviews)
  const hours = arr(hl.hours)
  f.count('ساعات العمل', hours.length)
  f.absentIf(!hours.length, 'ساعات العمل', 'لا توجد ساعات عمل', H.hours)
  f.count('الصور', arr(c.gallery?.images).length + (s(c.hero?.image) ? 1 : 0))
  if (s(hl.map_link)) f.count('الخريطة', 1)
}

const brand: Builder = (c, f) => {
  f.fact('الأساسيات', 'اسم العلامة', [s(c.brand?.name)], 'text', { home: true, weight: 3 })
  const ct = c.contact || {}
  if (s(ct.phone) || s(ct.whatsapp)) f.fact('التواصل', 'رقم التواصل', [s(ct.phone), s(ct.whatsapp)], 'phone', { weight: 3 })
  if (s(ct.email)) f.fact('التواصل', 'البريد', [s(ct.email)], 'text', { weight: 1 })
  const products = arr(c.products?.items)
  f.count('المنتجات', products.length)
  for (const p of products.slice(0, 24)) {
    f.fact('المنتجات', `منتج: ${s(p.name)}`, [s(p.name)], 'text', { weight: 1 })
    if (s(p.price)) f.fact('الأسعار', `سعر ${s(p.name)}`, [s(p.price)], 'text', { weight: 1 })
  }
  f.count('الأسعار', products.filter((p) => s(p.price)).length)
  const story = arr<string>(c.story?.paragraphs)
  f.count('القصة', story.length)
  if (story[0]) f.fact('القصة', 'أول سطر من القصة', [opening(story[0])], 'text', { weight: 2 })
  const reviews = arr(c.reviews?.items)
  f.count('التقييمات', reviews.length)
  for (const r of reviews.slice(0, 6)) if (s(r.text)) f.fact('التقييمات', `رأي ${s(r.name)}`.trim(), [opening(s(r.text))], 'text', { weight: 1 })
  f.absentIf(!reviews.length, 'التقييمات', 'لا توجد آراء', H.reviews)
  const team = arr(c.team?.items)
  f.count('الفريق', team.length)
  f.absentIf(!team.length, 'الفريق', 'لا يوجد فريق', H.team)
  f.count('الصور', arr(c.gallery?.images).length + (s(c.hero?.photo) ? 1 : 0) + products.filter((p) => s(p.photo)).length)
}

const studioOld: Builder = (c, f) => {
  f.fact('الأساسيات', 'اسم النشاط', [s(c.brand?.name)], 'text', { home: true, weight: 3 })
  if (s(c.footer?.phone) || s(c.contact?.phone)) f.fact('التواصل', 'رقم الهاتف', [s(c.footer?.phone), s(c.contact?.phone)], 'phone', { weight: 3 })
}

const generic: Builder = (c, f) => {
  const name = s(c.brand?.name) || s(c.name) || s(c.store?.name)
  if (name) f.fact('الأساسيات', 'الاسم', [name], 'text', { home: true, weight: 3 })
}

const BUILDERS: Record<string, Builder> = { services, wellness, restaurant }

export function referenceFor(p: SiteProps): Reference {
  const c = p.content || {}
  const isBrandV2 = p.businessType === 'studio' && c?.v === 2
  const builder: Builder = isBrandV2 ? brand : p.businessType === 'studio' ? studioOld : BUILDERS[p.businessType] || generic
  const facts: Fact[] = []
  const absent: AbsentRule[] = []
  const claims: Claim[] = []
  const inventory: Record<string, number> = {}
  let n = 0
  builder(c, {
    fact: (group, label, values, kind = 'text', opts = {}) => {
      const any = values.map((v) => (v || '').trim()).filter((v) => v.length >= (kind === 'phone' ? 6 : 2))
      if (!any.length) return
      facts.push({ id: `f${++n}`, group, label, any, kind, home: opts.home, weight: opts.weight ?? 1 })
    },
    absentIf: (empty, group, because, headings) => { if (empty) absent.push({ id: `a${++n}`, group, because, headings }) },
    claim: (label, text, why) => { if (text) claims.push({ id: `c${++n}`, label, text, why }) },
    count: (group, k) => { inventory[group] = (inventory[group] || 0) + k },
  })

  const niche = typeof c.niche === 'string' ? c.niche : undefined
  const pages = pagesFor(p.businessType, niche).map((x) => ({ path: x.slug ? `/${x.slug}` : '/', label: x.label }))
  if (!pages.length) pages.push({ path: '/', label: 'الرئيسية' })

  // Colours: what the renderer itself resolves, then where it came from.
  let colors: Record<string, string> = {}
  let headingFont: string | undefined, bodyFont: string | undefined
  const isNiche = p.businessType === 'services' && isNicheKind(niche)
  if (isNiche) {
    const base = KIND[niche as keyof typeof KIND].looks[0].colors as Record<string, string>
    const ov = p.colorOverrides && p.colorOverrides.background && p.colorOverrides.accent ? p.colorOverrides : null
    colors = { ...(ov ? { ...base, ...ov } : base) }
  } else {
    const pal = resolveSitePalette(isBrandV2 ? 'studio' : p.businessType, p.presetId, p.colorOverrides, p.typographyPreset)
    if (pal) {
      colors = { primary: pal.primary, accent: pal.accent, background: pal.background, surface: pal.surface, text: pal.text, muted: pal.muted, border: pal.border, button: pal.button }
      headingFont = pal.headingFont; bodyFont = pal.bodyFont
    }
  }
  const hasOverrides = !!(p.colorOverrides && Object.keys(p.colorOverrides).length)
  const match = stockMatch(colors)
  const source: Reference['palette']['source'] = match ? 'stock' : hasOverrides ? 'brand' : 'default'

  // Where buttons must go.
  const phone = facts.find((f) => f.kind === 'phone')?.any[0]
  const wa = s(c.links?.whatsapp) || s(c.contact?.whatsapp) || ''
  const waDigits = /wa\.me\/(\d+)/.exec(wa)?.[1] || (wa ? digits(wa) : '')

  return {
    template: isBrandV2 ? 'brand' : p.businessType,
    niche,
    name: s(c.brand?.name) || s(c.name),
    pages,
    facts,
    absent,
    forbidden: FORBIDDEN,
    palette: { colors, source, stockMatch: match, headingFont, bodyFont },
    actions: {
      whatsapp: waDigits || undefined,
      phone: phone ? digits(phone) : undefined,
      maps: !!(c.google?.maps_url || c.hours_location?.map_link || c.footer?.address || c.hours_location?.address),
      email: s(c.footer?.email) || s(c.contact?.email) || undefined,
    },
    claims,
    inventory,
  }
}

/**
 * Is a headline number backed by the business's own data? It is when the same number appears
 * anywhere else in the content (a Google rating, a review count, a year, a price) or is the
 * length of a list there (5 services, 3 areas). Otherwise a model probably wrote it.
 */
export function backedNumber(value: string, content: unknown): boolean {
  const latin = (t: string) => t.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/(\d)[,،](\d{3})/g, '$1$2')
  const want = (latin(value).match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n > 0)
  if (!want.length) return true
  const have = new Set<number>()
  const walk = (v: unknown, depth: number, key: string) => {
    if (depth > 7 || v == null) return
    if (key === 'stats') return // the stats themselves prove nothing
    if (typeof v === 'number') { have.add(v); return }
    if (typeof v === 'string') { for (const m of latin(v).match(/\d+(?:\.\d+)?/g) || []) have.add(Number(m)); return }
    if (Array.isArray(v)) { have.add(v.length); v.forEach((x) => walk(x, depth + 1, '')); return }
    if (typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) walk(x, depth + 1, k)
  }
  walk(content, 0, '')
  return have.has(want[0])
}

/** Do two phone numbers name the same line? Country codes and leading zeros differ between sources. */
export function samePhone(a: string, b: string): boolean {
  const x = digits(a).replace(/^0+/, ''), y = digits(b).replace(/^0+/, '')
  if (x.length < 6 || y.length < 6) return false
  const k = Math.min(8, x.length, y.length)
  return x.slice(-k) === y.slice(-k)
}
