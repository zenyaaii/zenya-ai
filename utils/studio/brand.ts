import { z } from 'zod'

/**
 * «علامة تجارية وقصة», version 2 (Anas, 2026-11-20).
 *
 * The brand-story template rebuilt on the new system: links first, the
 * brand's own photos and colours, and a site drawn only from what the owner
 * gave or confirmed. The answers ARE the site: buildBrandContent() is a pure
 * function, no model is called at build time, two presses give the same site.
 *
 * Stored as content.studio with `v: 2`, so the editor, the preview page and
 * the public renderer keep finding the studio template where they always
 * did; StudioPreview draws the new design (BrandStoryView) when it sees v 2.
 *
 * Every list may be empty, hold one item, or many. A section with nothing in
 * it is left out of the site, never filled with a stand-in.
 */

const s = (max: number) => z.string().trim().max(max)
const opt = (max: number) => s(max).optional()

export const brandItem = z.object({ title: s(80), text: opt(400), photo: opt(600) })
export const brandProduct = z.object({ name: s(80), text: opt(300), size: opt(40), price: opt(40), photo: opt(600) })

export const brandInputSchema = z.object({
  name: s(60).min(2),
  kind: opt(60),
  tagline: opt(140),
  intro: opt(400),
  city: opt(80),
  story: z.object({
    heading: opt(120),
    paragraphs: z.array(s(900)).max(4).default([]),
    quote: opt(240),
    signature: opt(80),
    role: opt(80),
  }).default({ paragraphs: [] }),
  values: z.array(brandItem).max(6).default([]),
  steps: z.array(brandItem).max(6).default([]),
  benefits: z.array(brandItem).max(10).default([]),
  products: z.array(brandProduct).max(24).default([]),
  products_note: opt(300),
  timeline: z.array(z.object({ year: s(12), text: s(200) })).max(10).default([]),
  team: z.array(z.object({ name: s(60), role: opt(80), photo: opt(600) })).max(12).default([]),
  reviews: z.array(z.object({ name: s(60), text: s(500), from: opt(60) })).max(12).default([]),
  press: z.array(z.object({ name: s(80), url: s(400) })).max(10).default([]),
  contact: z.object({
    phone: opt(30), whatsapp: opt(30), email: opt(120), address: opt(240),
  }).default({}),
  links: z.object({
    instagram: opt(200), tiktok: opt(200), facebook: opt(200), snapchat: opt(200), x: opt(200), youtube: opt(200), website: opt(300), store: opt(300),
  }).default({}),
  /** What the visitor's main button does: message on WhatsApp, call, or open the store. */
  buy: z.enum(['whatsapp', 'call', 'store', 'email']).optional(),
  photos: z.object({ hero: opt(600), story: opt(600), gallery: z.array(s(600)).max(16).default([]) }).default({ gallery: [] }),
  logo: opt(600),
})

export type BrandInput = z.infer<typeof brandInputSchema>

export type BrandContent = {
  v: 2
  brand: { name: string; kind?: string; tagline?: string; intro?: string; city?: string; logo?: string }
  hero: { photo?: string }
  story: { heading: string; paragraphs: string[]; quote?: string; signature?: string; role?: string; photo?: string }
  values: { heading: string; items: { title: string; text?: string }[] }
  steps: { heading: string; items: { title: string; text?: string; photo?: string }[] }
  benefits: { heading: string; items: { title: string; text?: string }[] }
  products: { heading: string; note?: string; items: { name: string; text?: string; size?: string; price?: string; photo?: string }[] }
  timeline: { heading: string; items: { year: string; text: string }[] }
  team: { heading: string; items: { name: string; role?: string; photo?: string }[] }
  reviews: { heading: string; items: { name: string; text: string; from?: string }[] }
  press: { heading: string; items: { name: string; url: string }[] }
  gallery: { heading: string; images: string[] }
  contact: { heading: string; phone?: string; whatsapp?: string; email?: string; address?: string }
  links: BrandInput['links']
  buy: 'whatsapp' | 'call' | 'store' | 'email' | 'none'
  footer: { tagline?: string }
  seo: { title: string; description: string }
  /** Kept so the old studio panels that read these paths never crash on a v2 site. */
  [k: string]: unknown
}

const clean = (v?: string) => (v || '').trim() || undefined

/** The owner's answers → the site. Pure: nothing invented, nothing fetched. */
export function buildBrandContent(i: BrandInput): BrandContent {
  const name = i.name.trim()
  const paragraphs = (i.story.paragraphs || []).map((p) => p.trim()).filter(Boolean)
  const photos = [i.photos.hero, i.photos.story, ...(i.photos.gallery || [])].map(clean).filter((u): u is string => !!u)
  const hero = clean(i.photos.hero) || photos[0]
  const used = new Set<string>([hero, i.photos.story, ...i.steps.map((x) => x.photo), ...i.products.map((x) => x.photo)].map(clean).filter((u): u is string => !!u))
  const buy = i.buy
    || (i.contact.whatsapp ? 'whatsapp' : i.links.store ? 'store' : i.contact.phone ? 'call' : i.contact.email ? 'email' : 'none')
  const intro = clean(i.intro)
  return {
    v: 2,
    brand: { name, kind: clean(i.kind), tagline: clean(i.tagline), intro, city: clean(i.city), logo: clean(i.logo) },
    hero: { photo: hero },
    story: {
      heading: clean(i.story.heading) || `كيف بدأت ${name}`,
      paragraphs,
      quote: clean(i.story.quote),
      signature: clean(i.story.signature),
      role: clean(i.story.role),
      photo: clean(i.photos.story),
    },
    values: { heading: 'ما لا نتنازل عنه', items: i.values.filter((v) => v.title.trim()).map((v) => ({ title: v.title.trim(), text: clean(v.text) })) },
    steps: { heading: 'كيف نصنع', items: i.steps.filter((v) => v.title.trim()).map((v) => ({ title: v.title.trim(), text: clean(v.text), photo: clean(v.photo) })) },
    benefits: { heading: 'ما يقدّمه لك', items: i.benefits.filter((v) => v.title.trim()).map((v) => ({ title: v.title.trim(), text: clean(v.text) })) },
    products: { heading: 'منتجاتنا', note: clean(i.products_note), items: i.products.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), text: clean(p.text), size: clean(p.size), price: clean(p.price), photo: clean(p.photo) })) },
    timeline: { heading: 'محطاتنا', items: i.timeline.filter((t) => t.year.trim() && t.text.trim()) },
    team: { heading: 'من نحن', items: i.team.filter((t) => t.name.trim()).map((t) => ({ name: t.name.trim(), role: clean(t.role), photo: clean(t.photo) })) },
    reviews: { heading: 'قالوا عنّا', items: i.reviews.filter((r) => r.name.trim() && r.text.trim()) },
    press: { heading: 'ذُكرنا في', items: i.press.filter((p) => p.name.trim() && /^https?:\/\//.test(p.url.trim())) },
    gallery: { heading: 'من عالمنا', images: photos.filter((u) => !used.has(u)).slice(0, 12) },
    contact: { heading: `تواصل مع ${name}`, phone: clean(i.contact.phone), whatsapp: clean(i.contact.whatsapp), email: clean(i.contact.email), address: clean(i.contact.address) },
    links: i.links,
    buy,
    footer: { tagline: clean(i.tagline) },
    seo: {
      title: [name, clean(i.kind)].filter(Boolean).join(' · ').slice(0, 70),
      description: (intro || clean(i.tagline) || paragraphs[0] || name).slice(0, 160),
    },
  }
}

export const isBrandV2 = (c: unknown): c is BrandContent => !!c && typeof c === 'object' && (c as { v?: unknown }).v === 2

/** Digits only, for wa.me and tel: links. */
export const digits = (v?: string) => (v || '').replace(/[^\d+]/g, '').replace(/^00/, '+')

export function profileUrl(net: string, v?: string): string | undefined {
  const t = (v || '').trim()
  if (!t) return undefined
  if (/^https?:\/\//i.test(t)) return t
  const h = t.replace(/^@/, '')
  const base: Record<string, string> = {
    instagram: 'https://www.instagram.com/', tiktok: 'https://www.tiktok.com/@', facebook: 'https://www.facebook.com/',
    snapchat: 'https://www.snapchat.com/add/', x: 'https://x.com/', youtube: 'https://www.youtube.com/@',
  }
  if (base[net]) return base[net] + h
  return 'https://' + t.replace(/^\/+/, '')
}

/** A filled example, used by the editor demo and as the sample before any build. */
export const BRAND_SAMPLE_INPUT: BrandInput = {
  name: 'سَمراء',
  kind: 'محمصة بُنّ مختص · جدة',
  tagline: 'نحمّص كل أسبوع، ونرسل في اليوم نفسه.',
  intro: 'بُنّ من مزارع نعرف أسماءها، نحمّصه بدفعات صغيرة في جدة ونغلّفه بأيدينا.',
  story: {
    heading: 'من مطبخ البيت، بمحمصة كيلو واحد.',
    paragraphs: [
      'بدأت سَمراء سنة 2019 في مطبخ بيتنا، بمحمصة صغيرة تتسع لكيلو واحد. كان أبونا يحمّص البن على المحماس كل جمعة.',
      'أول طلب من خارج جدة جاء من أبها: أربعون كيسًا في ليلة واحدة، غلّفناها حتى الفجر.',
    ],
    quote: 'إذا لم نشربها نحن كل صباح، فلن نرسلها لك.',
    signature: 'أحمد ويوسف', role: 'المؤسسان',
  },
  values: [
    { title: 'نحمّص بالأسبوع', text: 'كل كيس يصلك خلال أيام من تحميصه.' },
    { title: 'المزرعة على الكيس', text: 'نكتب البلد والمزرعة وتاريخ التحميص على كل كيس.' },
    { title: 'نرد بأنفسنا', text: 'كل رسالة يرد عليها أحدنا.' },
  ],
  steps: [
    { title: 'نختار المحصول', text: 'من مزارع نتعامل معها مباشرة.' },
    { title: 'نحمّص دفعات صغيرة', text: 'ونسجّل كل منحنى تحميص.' },
    { title: 'نغلّف ونرسل', text: 'في اليوم نفسه.' },
  ],
  benefits: [],
  products: [
    { name: 'إثيوبيا · قوجي', text: 'تحميص فاتح · ياسمين وخوخ', size: '250 غ' },
    { name: 'اليمن · حَراز', text: 'تحميص متوسط · زبيب وكاكاو', size: '250 غ' },
  ],
  timeline: [], team: [], reviews: [], press: [],
  contact: { whatsapp: '+966500000000' },
  links: { instagram: '@example' },
  photos: { gallery: [] },
}
