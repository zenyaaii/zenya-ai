import { AiClient, aiKey } from '@/lib/ai-client'
import sharp from 'sharp'
import { AI_MODEL } from '@/lib/ai'
import { logAiUsage } from '@/lib/ai-usage'
import { serviceClient } from '@/lib/handover'
import { analyzeOne, mergeResults, parseJsonSafe, type Category } from '@/lib/menu-ocr'
import type { RestaurantColors, RestaurantContent } from '@/utils/restaurant/types'
import type { ServiceContent } from '@/utils/services/types'
import { KIND, type NicheKind } from '@/utils/services/kinds'
import { placeOf, googlePhotos, instagramOf, facebookOf, type Place, type Social } from './sources'
import { findSocial, type Who, type Found } from './find-social'
import { cleanPhotos, contactSheet, applyVerdicts, choose, judgePrompt, type Judged, type Picks, type Niche } from './photos'
import { measure, snap, paletteOf } from './palette'

/**
 * The restaurant build system (the eight steps Anas approved, 2026-11-07):
 *
 *  1 collect   Google Places (ours) + Instagram/Facebook (Apify)     sources.ts
 *  2 clean     broken, tiny, duplicate photos out — no AI            photos.ts
 *  3 look      one numbered contact sheet, judged with a visitor's eyes
 *  4 read      the menu photo (OCR) and the place's own colours      palette.ts
 *  5 write     copy in the place's voice (lead-build.ts → generator)
 *  6 file      the restaurant file: every source, choice and gap, stored
 *  7 build     the template, with the rules the template already checks
 *  8 visit     an AI visitor scores the result out of 10, fixes up to twice,
 *              and only a site at 8+ is published; below that it waits for
 *              a person, with the reasons.
 *
 * Google review text and photos are shown with their source named. Instagram
 * and Facebook material is the place's own.
 */

export type Prepared = {
  place: Place
  social: Social
  picks: Picks
  judged: Judged[]
  urls: Map<string, string>          // photo id → our public URL
  colors: RestaurantColors
  mood: 'dark' | 'light'
  menu: Category[]                   // read from a menu photo; [] when none
  file: BuildFile
  /** Accounts the search found for a lead that had no link (to save on the lead). */
  found: Found
}

export type BuildFile = {
  v: 1
  at: string
  sources: { google: { photos: number; reviews: number }; instagram?: string; facebook?: string; found_by_search?: string }
  photos: { id: string; src: string; kind: string; quality: number; appetite: number; dish?: string; alt?: string; used?: string; rejected?: string; author?: string }[]
  colors: { identity: string[]; mood: 'dark' | 'light'; from: number[] }
  menu: { from: 'photo' | 'reviews'; items: number }
  missing: string[]
  visitor: { round: number; score: number; notes: string[] }[]
  published: boolean
}

const aiClient = () => {
  const apiKey = aiKey()
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  return new AiClient({ apiKey })
}

async function vision(prompt: string, images: Buffer[], op: string, maxTokens = 3000): Promise<any> {
  const res = await aiClient().chat.completions.create({
    model: AI_MODEL, temperature: 0.2, max_tokens: maxTokens, response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: [
      { type: 'text', text: prompt },
      ...images.map((b) => ({ type: 'image_url' as const, image_url: { url: `data:image/jpeg;base64,${b.toString('base64')}`, detail: 'high' as const } })),
    ] }],
  })
  await logAiUsage({ operation: op, userId: null, model: AI_MODEL }, res.usage)
  return parseJsonSafe(res.choices?.[0]?.message?.content || '{}')
}

async function upload(placeId: string, j: Judged): Promise<string | null> {
  const path = `leads/${placeId.replace(/[^A-Za-z0-9_-]/g, '')}/${j.id}.jpg`
  const sb = serviceClient().storage.from('theme-uploads')
  const { error } = await sb.upload(path, j.jpeg, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' })
  if (error) return null
  return sb.getPublicUrl(path).data.publicUrl
}

export async function prepare(placeId: string, socialLink: string | null, who?: Who, niche: Niche = 'restaurant'): Promise<Prepared> {
  // 1 — collect, in parallel; social never blocks Google.
  const link = socialLink || ''
  let igLink = /instagram\.com/i.test(link) ? link : ''
  let fbLink = /facebook\.com|fb\.com/i.test(link) ? link : ''
  // 1b — no saved account for a network: search for the place's own (find-social.ts).
  // The search takes the longest (~1 min): Google's details and photos load meanwhile.
  const placeP = placeOf(placeId)
  const [place, gPhotos, found] = await Promise.all([
    placeP,
    placeP.then(googlePhotos),
    who && (!igLink || !fbLink) ? findSocial(who) : Promise.resolve({} as Found),
  ])
  if (!igLink && found.instagram) igLink = `https://www.instagram.com/${found.instagram}/`
  if (!fbLink && found.facebook) fbLink = found.facebook
  const [ig, fb] = await Promise.all([
    igLink ? instagramOf(igLink) : Promise.resolve({ photos: [] as any[] }),
    fbLink ? facebookOf(fbLink) : Promise.resolve({ photos: [] as any[] }),
  ])
  const social: Social = { instagram: (ig as any).data, facebook: (fb as any).data }

  // 2 — clean. 3 — look.
  const pics = await cleanPhotos([...gPhotos, ...(ig.photos || []), ...(fb.photos || [])])
  let ai: any = {}
  if (pics.length) {
    ai = await vision(judgePrompt(niche), [await contactSheet(pics)], `lead-build-photos${niche === 'restaurant' ? '' : '-' + niche}`).catch(() => ({}))
  }
  const judged = applyVerdicts(pics, ai)
  const picks = choose(judged, Number(ai?.hero) || 0)

  // 4a — the menu, read from the place's own menu photo.
  let menu: Category[] = []
  if (picks.menus.length) {
    const client = aiClient()
    const reads = await Promise.all(picks.menus.slice(0, 3).map((m) =>
      analyzeOne(client, `data:image/jpeg;base64,${m.jpeg.toString('base64')}`, undefined, null)))
    menu = mergeResults(reads.map((r) => r.categories))
  }

  // 4b — colours: the AI names them, the pixels decide them.
  const from: number[] = (Array.isArray(ai?.identity_from) ? ai.identity_from : []).map(Number).filter(Boolean)
  const sources = [...picks.logos, ...judged.filter((j) => from.includes(j.v.n))].filter((j, i, all) => all.indexOf(j) === i).slice(0, 4)
  const measured = (await Promise.all(sources.map((s) => measure(s.jpeg).catch(() => [])))).flat()
  const identity = snap((Array.isArray(ai?.identity) ? ai.identity : []).slice(0, 3), measured)
  const mood: 'dark' | 'light' = ai?.mood === 'light' ? 'light' : 'dark'
  const colors = paletteOf(identity, mood)

  // Our copies of the photos the site uses (never a Google URL on a site).
  const used = new Map<string, string>()
  const roles: [Judged | undefined, string][] = [
    [picks.hero, 'hero'], [picks.story, 'story'], ...picks.dishes.map((d) => [d, 'dish'] as [Judged, string]),
    ...picks.gallery.map((g) => [g, 'gallery'] as [Judged, string]), ...picks.wall.map((w) => [w, 'wall'] as [Judged, string]),
  ]
  for (const [j, role] of roles) if (j && !used.has(j.id)) used.set(j.id, role)
  const urls = new Map<string, string>()
  await Promise.all(Array.from(used.keys()).map(async (id) => {
    const j = judged.find((x) => x.id === id)!
    const u = await upload(placeId, j)
    if (u) urls.set(id, u)
  }))

  const missing: string[] = []
  if (!picks.hero) missing.push('لا توجد صورة احترافية واسعة للواجهة: استُخدمت صورة القالب')
  if (niche === 'restaurant' && picks.dishes.length < 2) missing.push('صور أطباق واضحة قليلة')
  if (!menu.length) missing.push(niche === 'restaurant' ? 'لم نجد صورة قائمة مقروءة: القائمة من التقييمات بلا أسعار' : 'لم نجد لوحة أسعار مقروءة: الأسعار يضيفها صاحب المكان')
  if (!social.instagram && !social.facebook) missing.push('لا حساب تواصل مقروء')
  if (!identity.length) missing.push('لم نتعرّف على ألوان المكان: ألوان افتراضية')

  const roleOf = (id: string) => [picks.hero?.id === id && 'hero', picks.story?.id === id && 'story', picks.dishes.some((d) => d.id === id) && 'dish', picks.gallery.some((d) => d.id === id) && 'gallery', picks.wall.some((d) => d.id === id) && 'wall'].filter(Boolean).join('+') || undefined
  const file: BuildFile = {
    v: 1, at: new Date().toISOString(),
    sources: { google: { photos: gPhotos.length, reviews: place.reviews.length }, instagram: social.instagram?.handle, facebook: social.facebook?.url, found_by_search: found.why },
    photos: judged.map((j) => ({ id: j.id, src: j.src, kind: j.v.kind, quality: j.v.quality, appetite: j.v.appetite, dish: j.v.dish || undefined, alt: j.v.alt || undefined, used: roleOf(j.id), rejected: j.why, author: j.author })),
    colors: { identity: identity.map((c) => '#' + c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')), mood, from },
    menu: { from: menu.length ? 'photo' : 'reviews', items: menu.reduce((n, c) => n + c.items.length, 0) },
    missing, visitor: [], published: false,
  }
  return { place, social, picks, judged, urls, colors, mood, menu, file, found }
}

/** The extra facts block for the copy prompt: what the place says about itself. */
export function factsBlock(p: Prepared): string {
  const ig = p.social.instagram, fb = p.social.facebook
  const lines = [
    p.place.summary && `Google summary: ${p.place.summary}`,
    p.place.attributes.length && `Google says: ${p.place.attributes.join('، ')}`,
    ig && `Instagram @${ig.handle} bio: ${ig.bio.replace(/\s+/g, ' ')}`,
    ig?.captions.length && `Instagram captions (the owner's own words — copy their tone, not their facts unless stated):\n${ig.captions.slice(0, 8).map((c) => `- ${c.slice(0, 220)}`).join('\n')}`,
    fb && `Facebook page "${fb.title ?? ''}": ${[fb.intro, ...(fb.categories ?? []), ...(fb.info ?? [])].filter(Boolean).join(' · ').slice(0, 600)}`,
    p.picks.dishes.length && `Dishes seen in the place's own photos: ${p.picks.dishes.map((d) => d.v.dish).join('، ')}`,
    p.menu.length && `Printed menu (read from its photo):\n${p.menu.map((c) => `${c.name}: ${c.items.slice(0, 12).map((i) => i.name).join('، ')}`).join('\n')}`,
  ].filter(Boolean)
  return lines.length ? `\nWHAT THE PLACE SAYS ABOUT ITSELF\n${lines.join('\n')}\n` : ''
}

const norm = (s: string) => s.replace(/[ـًٌٍَُِّْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim()

/**
 * The menu the wizard gets: the printed menu when we could read one, else
 * the AI's menu from reviews. Either way, a dish seen in the place's own
 * photo gets that photo, and is added under «من مطبخنا» when the menu does
 * not list it, so the home page shows real food.
 */
export function menuWithPhotos(p: Prepared, aiMenu: { name: string; items: { name: string; price: string; image_url?: string; description?: string }[] }[]) {
  const cats = (p.menu.length
    ? p.menu.slice(0, 8).map((c) => ({ name: c.name.slice(0, 40), items: c.items.slice(0, 20).map((i) => ({ name: i.name.slice(0, 80), price: i.price.slice(0, 30), description: i.description || undefined } as any)) }))
    : aiMenu.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })))
  const extra: any[] = []
  for (const d of p.picks.dishes) {
    const url = p.urls.get(d.id); if (!url) continue
    const k = norm(d.v.dish)
    const hit = cats.flatMap((c) => c.items).find((i: any) => !i.image_url && (norm(i.name).includes(k) || k.includes(norm(i.name))))
    if (hit) (hit as any).image_url = url
    else extra.push({ name: d.v.dish, price: '', image_url: url })
  }
  if (extra.length) cats.unshift({ name: 'من مطبخنا', items: extra })
  return cats.slice(0, 8)
}

// ── 8: the AI visitor ─────────────────────────────────────────────────────
const VISIT_PROMPT = (c: RestaurantContent, city: string) => `You are a person in ${city} who just opened this restaurant's new website on your phone, deciding whether to go tonight. The image shows, in order: the big header photo (H), the dish photos (D1…), the story photo (S) and the gallery (G1…). The text is below.

Header: «${c.hero.headline.replace(/\n/g, ' / ')}» — ${c.hero.subheadline}
Story: ${c.story.heading} — ${c.story.body}
Dishes: ${c.signature_dishes.map((d) => d.name).join('، ')}
Menu sections: ${c.menu.categories.map((m) => `${m.name} (${m.items.length})`).join('، ')}
Reviews shown: ${c.reviews.testimonials.length}, FAQ: ${c.faq.items.length}

Score 1-10: does it look professional and real, and does it make you want to go? Be strict: 8 means you would book.
List the concrete problems (Arabic, short). Then the fixes, using ONLY:
- "drop": photo labels to remove (e.g. ["G3","D2"]) — blurry, dark, ugly or off-putting photos
- "hero_from_gallery": a gallery label (e.g. "G2") that would be a better header photo than H, or ""
- "headline": a better 2-line Arabic header text (use \\n), only if the current one is weak, else ""
Never add facts that are not in the text above.

Return strict JSON: { "score": 0, "problems": [""], "drop": [], "hero_from_gallery": "", "headline": "" }`

async function roleSheet(c: RestaurantContent): Promise<Buffer | null> {
  const items: [string, string][] = [
    ['H', c.hero.image], ...c.signature_dishes.filter((d) => d.image).map((d, i) => [`D${i + 1}`, d.image!] as [string, string]),
    ...(c.story.accent_image ? [['S', c.story.accent_image] as [string, string]] : []),
    ...c.gallery.images.map((g, i) => [`G${i + 1}`, g.url] as [string, string]),
  ]
  const bufs = await Promise.all(items.map(async ([label, url]) => {
    try {
      const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return null
      const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(292, 292, { fit: 'cover' }).toBuffer()
      const tag = Buffer.from(`<svg width="54" height="30"><rect width="54" height="30" rx="4" fill="#ffd400"/><text x="27" y="22" font-size="19" font-family="Arial" font-weight="700" text-anchor="middle" fill="#000">${label}</text></svg>`)
      return { img, tag }
    } catch { return null }
  }))
  const ok = bufs.filter(Boolean) as { img: Buffer; tag: Buffer }[]
  if (!ok.length) return null
  const cols = 5, rows = Math.ceil(ok.length / cols)
  return sharp({ create: { width: cols * 300, height: rows * 300, channels: 3, background: '#111' } })
    .composite(ok.flatMap((b, i) => [
      { input: b.img, left: (i % cols) * 300 + 4, top: Math.floor(i / cols) * 300 + 4 },
      { input: b.tag, left: (i % cols) * 300 + 8, top: Math.floor(i / cols) * 300 + 8 },
    ])).jpeg({ quality: 78 }).toBuffer()
}

/** Scores, fixes in place (at most twice), and returns the last score. */
export async function visit(content: RestaurantContent, city: string, file: BuildFile): Promise<number> {
  let score = 0
  for (let round = 1; round <= 3; round++) {
    const sheet = await roleSheet(content)
    const r = await vision(VISIT_PROMPT(content, city), sheet ? [sheet] : [], 'lead-build-visitor', 900).catch(() => null)
    if (!r) break
    score = Math.max(1, Math.min(10, Math.round(Number(r.score) || 1)))
    file.visitor.push({ round, score, notes: (Array.isArray(r.problems) ? r.problems : []).map((x: any) => String(x).slice(0, 160)).slice(0, 6) })
    if (score >= 8 || round === 3) break
    let changed = false
    const drop = new Set<string>((Array.isArray(r.drop) ? r.drop : []).map(String))
    const g = /^G(\d+)$/.exec(String(r.hero_from_gallery || ''))
    if (g && content.gallery.images[+g[1] - 1]) {
      const [img] = content.gallery.images.splice(+g[1] - 1, 1)
      content.hero.image = img.url; changed = true
    }
    if (drop.size) {
      const before = content.gallery.images.length
      content.gallery.images = content.gallery.images.filter((_, i) => !drop.has(`G${i + 1}`))
      content.signature_dishes = content.signature_dishes.map((d, i) => (drop.has(`D${i + 1}`) ? { ...d, image: undefined } : d))
      if (drop.has('S')) content.story.accent_image = undefined
      changed = changed || before !== content.gallery.images.length || [...drop].some((x) => /^D|^S$/.test(x))
    }
    const h = String(r.headline || '').trim()
    if (h && h.length <= 80 && h !== content.hero.headline) { content.hero.headline = h; changed = true }
    if (!changed) break
  }
  return score
}

// ── 8b: the AI visitor for a barber (and, next, every services kind) ──────
const VISIT_BARBER = (c: ServiceContent, city: string, nk: NicheKind) => `You are ${KIND[nk].visitor.who} in ${city} who just opened this ${KIND[nk].visitor.place}'s new website on your phone, deciding whether to ${KIND[nk].visitor.want}. The image shows, in order: the big header photo (H), the side photo (S) and the shop photos (G1…). The text is below.

Header: «${c.hero.headline}» — ${c.hero.subheadline}
Staff: ${(c.team?.members || []).map((m) => `${m.name}${m.quote ? ' (a customer: «' + m.quote + '»)' : ''}`).join('؛ ') || 'none named'}
Services: ${c.services.items.map((s) => s.name + (s.price_from ? ' ' + s.price_from : '')).join('، ')}
Prices shown: ${c.services.items.some((s) => s.price_from) ? 'yes' : 'no, an ask-on-WhatsApp button instead'}
Hours: ${(c.hours || []).length ? 'yes, per day, with open-now' : 'no'}
Terms stated: ${(c.terms || []).map((t) => t.label + ': ' + t.text).join('؛ ') || 'none'}
Google rating: ${c.google?.rating ?? 'none'} from ${c.google?.count ?? 0}; reviews shown: ${c.testimonials.items.length}; FAQ answered: ${c.faq.items.length}

Score 1-10: does it look professional and real, and does it make you want to book? Be strict: 8 means you would book.
List the concrete problems (Arabic, short). Then the fixes, using ONLY:
- "drop": photo labels to remove (e.g. ["G3","S"]) — blurry, dark, ugly, off-putting or not this kind of place
- "hero_from_gallery": a gallery label (e.g. "G2") that would be a better header photo than H, or ""
Never add facts that are not in the text above.

Return strict JSON: { "score": 0, "problems": [""], "drop": [], "hero_from_gallery": "" }`

async function sheetOf(items: [string, string][]): Promise<Buffer | null> {
  const bufs = await Promise.all(items.map(async ([label, url]) => {
    try {
      const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return null
      const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(292, 292, { fit: 'cover' }).toBuffer()
      const tag = Buffer.from(`<svg width="54" height="30"><rect width="54" height="30" rx="4" fill="#ffd400"/><text x="27" y="22" font-size="19" font-family="Arial" font-weight="700" text-anchor="middle" fill="#000">${label}</text></svg>`)
      return { img, tag }
    } catch { return null }
  }))
  const ok = bufs.filter(Boolean) as { img: Buffer; tag: Buffer }[]
  if (!ok.length) return null
  const cols = 5, rows = Math.ceil(ok.length / cols)
  return sharp({ create: { width: cols * 300, height: rows * 300, channels: 3, background: '#111' } })
    .composite(ok.flatMap((b, i) => [
      { input: b.img, left: (i % cols) * 300 + 4, top: Math.floor(i / cols) * 300 + 4 },
      { input: b.tag, left: (i % cols) * 300 + 8, top: Math.floor(i / cols) * 300 + 8 },
    ])).jpeg({ quality: 78 }).toBuffer()
}

/** Scores a barber site, fixes its photos in place (at most twice), returns the last score. */
export async function visitBarber(content: ServiceContent, city: string, file: BuildFile, nk: NicheKind = 'barber'): Promise<number> {
  let score = 0
  for (let round = 1; round <= 3; round++) {
    const items: [string, string][] = [
      ...(content.hero.image ? [['H', content.hero.image] as [string, string]] : []),
      ...(content.story.image ? [['S', content.story.image] as [string, string]] : []),
      ...content.gallery.images.map((g, i) => [`G${i + 1}`, g.url] as [string, string]).filter(([, u]) => u !== content.hero.image && u !== content.story.image),
    ]
    const sheet = await sheetOf(items)
    const r = await vision(VISIT_BARBER(content, city, nk), sheet ? [sheet] : [], `lead-build-visitor-${nk}`, 900).catch(() => null)
    if (!r) break
    score = Math.max(1, Math.min(10, Math.round(Number(r.score) || 1)))
    file.visitor.push({ round, score, notes: (Array.isArray(r.problems) ? r.problems : []).map((x: any) => String(x).slice(0, 160)).slice(0, 6) })
    if (score >= 8 || round === 3) break
    let changed = false
    const drop = new Set<string>((Array.isArray(r.drop) ? r.drop : []).map(String))
    const g = /^G(\d+)$/.exec(String(r.hero_from_gallery || ''))
    if (g && content.gallery.images[+g[1] - 1]) {
      const [img] = content.gallery.images.splice(+g[1] - 1, 1)
      if (content.hero.image && !content.gallery.images.some((x) => x.url === content.hero.image)) content.gallery.images.push({ url: content.hero.image, alt: '' })
      content.hero.image = img.url; content.gallery.images.unshift(img); changed = true
    }
    if (drop.size) {
      const before = content.gallery.images.length
      content.gallery.images = content.gallery.images.filter((_, i) => !drop.has(`G${i + 1}`))
      if (drop.has('S') && content.story.image) { content.story.image = undefined; changed = true }
      changed = changed || before !== content.gallery.images.length
    }
    if (!changed) break
  }
  return score
}
