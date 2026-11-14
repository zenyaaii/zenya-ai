import sharp from 'sharp'
import { AiClient } from '@/lib/ai-client'
import { AI_MODEL, AI_MODEL_FAST } from '@/lib/ai'
import { logAiUsage } from '@/lib/ai-usage'
import { analyzeOne, mergeResults, parseJsonSafe, withTimeout, type Category, type Legibility } from '@/lib/menu-ocr'
import { cleanPhotos, contactSheet, applyVerdicts, choose, judgePrompt, hamming, type Pic } from './photos'
import type { RawPhoto } from './sources'
import { dishKey } from '@/lib/menu-match'

/**
 * «جاري قلب المنيو»: the wizard's menu step fills itself from the place's own
 * pages, so the owner does not have to photograph a menu that is already on
 * Google or Instagram (Anas, 2026-11-14).
 *
 *  1 look   every photo the links gave us, on one numbered contact sheet, with
 *           the same visitor's eye the lead build uses (judgePrompt): which
 *           ones are a printed menu, which are dishes, which break the photo
 *           rules (women, faces, tattoos, 3D/CGI, posters).
 *  2 read   each menu photo at full size, a wide one in two overlapping halves
 *           (the trick the upload path uses). The reader also says how sure
 *           it is. Nothing fills yet: the wizard shows the owner the photos,
 *           marks the unclear ones, and fills only from the ones he confirms
 *           as his menu (Anas, 2026-11-14: "show him the menu first, is this
 *           the right one, is it clear; if not, he swaps it").
 *  3 text   no readable menu photo, but the captions carry a priced list:
 *           read that, with the same no-invention rules.
 *  4 dress  dishes the visitor's eye recognised in clean, appetising photos;
 *           the wizard puts each beside the menu item of the same name.
 *
 * Nothing is invented: what is not printed stays empty for the owner.
 */

export type MenuPage = {
  url: string
  /** Read in full: every name and price on it, for certain. */
  clear: boolean
  /** Why it is not clear, in Arabic, for the owner. */
  why?: string
  /** When it was put on Google (YYYY-MM-DD), so an old menu can be told from the current one. */
  date?: string
  categories: Category[]
}

export type FoundMenu = {
  /** The menu photos found, best first, each already read. The owner confirms before anything fills. */
  pages: MenuPage[]
  /** A priced list in the Instagram captions, when no menu photo was found. */
  captions: Category[]
  /** Clean dish photos the visitor's eye recognised, to sit beside the menu item of that name. */
  dishes: { url: string; dish: string }[]
  /** Every photo looked at, with the verdict: the wizard drops the rejected ones from its picks. */
  photos: { url: string; ok: boolean; kind: string; why?: string }[]
  /** The visitor's pick for the home page's big photo, when one is good enough. */
  hero?: string
}

// Every page of the menu, not a sample: Anas pays for the reads (2026-11-14).
const MAX_MENU_PHOTOS = 40
const READ_AT_ONCE = 8
const WIDE = 1.2
const TALL = 1.7

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const r = await withTimeout(fetch(url, { cache: 'no-store' }), 12_000, 'menu_photo')
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const b = Buffer.from(await r.arrayBuffer())
    return b.length > 2000 ? b : null
  } catch { return null }
}

/**
 * A wide menu in two overlapping halves (right first), a very tall one in two
 * overlapping halves (top first), so the text reaches the reader at a size it
 * can read.
 */
async function parts(j: Pic): Promise<string[]> {
  const url = (b: Buffer) => `data:image/jpeg;base64,${b.toString('base64')}`
  if (j.w > j.h * WIDE) {
    const half = Math.round(j.w * 0.56)
    const [a, b] = await Promise.all([
      sharp(j.jpeg).extract({ left: j.w - half, top: 0, width: half, height: j.h }).jpeg({ quality: 88 }).toBuffer(),
      sharp(j.jpeg).extract({ left: 0, top: 0, width: half, height: j.h }).jpeg({ quality: 88 }).toBuffer(),
    ])
    return [url(a), url(b)]
  }
  if (j.h > j.w * TALL) {
    const half = Math.round(j.h * 0.56)
    const [a, b] = await Promise.all([
      sharp(j.jpeg).extract({ left: 0, top: 0, width: j.w, height: half }).jpeg({ quality: 88 }).toBuffer(),
      sharp(j.jpeg).extract({ left: 0, top: j.h - half, width: j.w, height: half }).jpeg({ quality: 88 }).toBuffer(),
    ])
    return [url(a), url(b)]
  }
  return [url(j.jpeg)]
}

/** Runs fn over items, at most n at a time, keeping the order. */
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]) }
  }))
  return out
}

const CAPTION_PROMPT = `You are given the captions a restaurant posted on its own Instagram. Some may list dishes with prices.
Extract ONLY dishes that appear with an explicit price in the captions. Never invent a dish, a price or a description; keep names exactly as written, in their language. Prices with Western digits, currency as written.
Group under the section names the captions use; otherwise one section named "القائمة".
If fewer than three priced dishes are written, return an empty categories array.
Return strict JSON: { "categories": [ { "name": "", "description": "", "items": [ { "name": "", "price": "", "description": "", "badge": "" } ] } ] }`

const priced = (t: string) => (t.match(/\d{1,4}(?:[.,]\d{1,2})?\s*(?:ج\.?م|جنيه|ر\.?س|ريال|د\.?إ|درهم|د\.?ك|دينار|ل\.?ل|ليرة|\$|€|£|EGP|SAR|AED|KWD|JOD|QAR|BHD|OMR|LBP|USD)/gi) || []).length

export async function findMenu(
  ai: AiClient,
  opts: { photos: string[]; menuTab?: { url: string; date?: string }[]; captions?: string[]; cuisine?: string; userId: string | null }
): Promise<FoundMenu> {
  // 1 — fetch and look, all at once on one sheet. The Google «Menu» tab is
  // fetched alongside: those photos ARE the menu, so they skip the sheet.
  const [raw, tabRaw] = await Promise.all([
    Promise.all(opts.photos.slice(0, 22).map(async (url, i) => {
      const buf = await fetchImage(url)
      return buf ? { id: `u${i}`, src: (/\/instagram\//.test(url) ? 'instagram' : 'google') as RawPhoto['src'], url, buf } : null
    })),
    pool((opts.menuTab || []).slice(0, MAX_MENU_PHOTOS).map((x) => x.url), READ_AT_ONCE, async (url) => {
      const buf = await fetchImage(url)
      return buf ? { id: `m${url.length}${url.slice(-6)}`, src: 'google' as RawPhoto['src'], url, buf } : null
    }),
  ]).then(([a, b]) => [a.filter(Boolean) as RawPhoto[], b.filter(Boolean) as RawPhoto[]])
  const [pics, tab] = await Promise.all([cleanPhotos(raw), cleanPhotos(tabRaw, MAX_MENU_PHOTOS)])
  let verdict: any = {}
  if (pics.length) {
    const sheet = await contactSheet(pics)
    const res = await withTimeout(ai.chat.completions.create({
      model: AI_MODEL, max_tokens: 3000, response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: judgePrompt('restaurant') },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${sheet.toString('base64')}`, detail: 'high' } },
      ] }],
    }), 60_000, 'menu_judge').catch(() => null)
    if (res) {
      await logAiUsage({ operation: 'menu-find-photos', userId: opts.userId, model: AI_MODEL }, res.usage)
      try { verdict = parseJsonSafe(res.choices?.[0]?.message?.content || '{}') } catch { verdict = {} }
    }
  }
  const judged = applyVerdicts(pics, verdict)
  const picks = choose(judged, Number(verdict?.hero) || 0)

  // 2 — read EVERY menu photo, and say how clear each one is: the menu tab
  // in Google's own order (the pages run in order there), then any menu photo
  // among the links' photos that is not one of those pages again.
  const linkMenus = judged
    .filter((j) => j.v.kind === 'menu' && !j.v.cgi && !j.v.tattoo && j.v.people !== 'women' && j.v.people !== 'faces')
    .sort((a, b) => b.v.quality - a.v.quality)
  const candidates: Pic[] = [...tab]
  for (const j of linkMenus) if (!candidates.some((c) => hamming(c.hash, j.hash) <= 8)) candidates.push(j)
  const read = await pool(candidates.slice(0, MAX_MENU_PHOTOS), READ_AT_ONCE, async (j): Promise<MenuPage | null> => {
    const ps = await parts(j)
    const reads = await Promise.all(ps.map((p) => analyzeOne(ai, p, opts.cuisine, opts.userId, { judge: true, half: ps.length > 1 })))
    const categories = mergeResults(reads.map((r) => r.categories))
    const items = categories.flatMap((c) => c.items)
    const withPrice = items.filter((i) => /\d/.test(i.price)).length
    const legs = reads.map((r) => r.legibility as Legibility | undefined)
    // A cover, a poster or an unreadable photo is not shown as the menu at all.
    if (!items.length || (legs.every((l) => l === 'poor') && items.length < 3)) return null
    const why = reads.some((r) => !r.ok) ? 'لم نقرأها كلها'
      : legs.some((l) => l !== 'full') ? 'بعض الأسماء أو الأسعار غير واضحة أو مقطوعة'
      : withPrice < Math.ceil(items.length * 0.6) ? 'أسعارها غير واضحة'
      : undefined
    return { url: j.url, clear: !why, why, categories, date: opts.menuTab?.find((x) => x.url === j.url)?.date }
  })
  const pages = read.filter(Boolean) as MenuPage[]
  // 3 — no menu photo at all: the captions, when they carry prices.
  let categories: Category[] = []
  const captions = (opts.captions || []).map((c) => String(c || '').trim()).filter(Boolean).slice(0, 12)
  if (!pages.length && captions.length && priced(captions.join('\n')) >= 3) {
    const res = await withTimeout(ai.chat.completions.create({
      model: AI_MODEL_FAST, max_tokens: 3000, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: CAPTION_PROMPT }, { role: 'user', content: captions.map((c, i) => `#${i + 1}\n${c.slice(0, 1200)}`).join('\n\n') }],
    }), 40_000, 'menu_captions').catch(() => null)
    if (res) {
      await logAiUsage({ operation: 'menu-find-captions', userId: opts.userId, model: AI_MODEL_FAST }, res.usage)
      try {
        const got = mergeResults([((parseJsonSafe(res.choices?.[0]?.message?.content || '{}')?.categories) || [])
          .map((c: any) => ({ name: String(c?.name || '').slice(0, 40), description: '', items: (Array.isArray(c?.items) ? c.items : [])
            .map((i: any) => ({ name: String(i?.name || '').trim().slice(0, 80), price: String(i?.price || '').trim().slice(0, 30), description: String(i?.description || '').trim().slice(0, 220), badge: '' }))
            .filter((i: any) => i.name && /\d/.test(i.price)) }))
          .filter((c: Category) => c.name && c.items.length)])
        // A priced dish must appear in the captions as written: nothing the reader made up.
        const all = dishKey(captions.join(' '))
        categories = got.map((c) => ({ ...c, items: c.items.filter((i) => all.includes(dishKey(i.name))) })).filter((c) => c.items.length)
        if (categories.reduce((n, c) => n + c.items.length, 0) < 3) categories = []
      } catch { categories = [] }
    }
  }

  // 4 — clean dish photos, for the menu item of the same name.
  const dishes = judged
    .filter((j) => j.ok && (j.v.kind === 'food' || j.v.kind === 'drink') && j.v.dish && j.v.quality >= 6 && j.v.appetite >= 6)
    .map((j) => ({ url: j.url, dish: j.v.dish }))

  return {
    pages,
    captions: categories,
    dishes,
    photos: judged.map((j) => ({ url: j.url, ok: j.ok, kind: j.v.kind, why: j.why })),
    hero: picks.hero?.url,
  }
}

const TIDY_PROMPT = `You are given ONE restaurant's menu, read off several overlapping photos of its printed menu (some may be older versions). The same section or dish therefore appears several times: in another language ("Hummus" vs "حمص"), in both ("Hummus / حمص"), in other capitals, another spelling, or with a small typo. Sections (s-ids) and dishes (i-ids) are listed newest photo first.

Group the duplicates. Do NOT rewrite the menu; only say which ids are the same thing:
- "sections": every group of s-ids that are the same section, with the name to show: the Arabic name if one of them is Arabic, else one of their names as written. Include every s-id exactly once (a section with no duplicate is a group of one).
- "dishes": only groups of 2+ i-ids that are the SAME dish (same food, same size/kind), with the name to show: the Arabic name if one of them has Arabic, else one of their names as written. Different dishes that look alike ("Chicken" under Pizza and "Chicken" under Fatayer) are NOT the same dish.
- If there are more than 12 section groups, put the smallest related ones together (leftover "Menu"/"القائمة" sections into the section their dishes belong to) so there are at most 12.

Return strict JSON only: { "sections": [ { "name": "", "ids": ["s1"] } ], "dishes": [ { "name": "", "ids": ["i1", "i7"] } ] }`

/**
 * One clean menu from the pages the owner kept: the same dish read off three
 * photos in two languages becomes one dish, at the newest price. The model
 * only GROUPS what was read (ids in, ids out); the menu is rebuilt here, so a
 * dish can never be dropped, invented or re-priced by the tidy-up.
 */
export async function tidyMenu(ai: AiClient, cats: Category[], userId: string | null): Promise<Category[]> {
  type Row = { id: string; sec: string; item: Category['items'][number] }
  const secs = cats.map((c, i) => ({ id: `s${i + 1}`, name: c.name, description: c.description }))
  const rows: Row[] = cats.flatMap((c, i) => c.items.map((item) => ({ id: '', sec: `s${i + 1}`, item })))
  rows.forEach((r, i) => { r.id = `i${i + 1}` })
  const input = cats.map((c, ci) => `${secs[ci].id} ${c.name}\n` + rows.filter((r) => r.sec === secs[ci].id).map((r) => `  ${r.id} ${r.item.name} | ${r.item.price}`).join('\n')).join('\n')
  const res = await withTimeout(ai.chat.completions.create({
    model: AI_MODEL, max_tokens: 12000, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: TIDY_PROMPT }, { role: 'user', content: input.slice(0, 80_000) }],
  }), 150_000, 'menu_tidy')
  await logAiUsage({ operation: 'menu-tidy', userId, model: AI_MODEL }, res.usage)
  const ai_ = parseJsonSafe(res.choices?.[0]?.message?.content || '{}')

  // Sections: each s-id to its group's name (an id the model skipped keeps its own).
  const secName = new Map<string, string>()
  for (const g of Array.isArray(ai_?.sections) ? ai_.sections : []) {
    const ids: string[] = (Array.isArray(g?.ids) ? g.ids : []).map(String).filter((x: string) => secs.some((s) => s.id === x))
    const name = String(g?.name || '').trim().slice(0, 40)
    // The name shown must be one of the group's own names, or at least Arabic text the model chose among them.
    const own = ids.map((x) => secs.find((s) => s.id === x)!.name)
    let pick = own.find((n) => n === name) || (name.length >= 2 ? name : own[0])
    // "MEZZE - COLD / مقبلات باردة" → the Arabic half.
    if (/[\u0600-\u06FF]/.test(pick) && /[A-Za-z]/.test(pick) && /[/|]/.test(pick)) pick = pick.split(/[/|]/).map((x) => x.trim()).find((x) => /[\u0600-\u06FF]/.test(x)) || pick
    for (const x of ids) if (!secName.has(x)) secName.set(x, pick)
  }
  // Dishes: each i-id to its group (first member = newest = the one kept).
  const groupOf = new Map<string, { name: string; ids: string[] }>()
  for (const g of Array.isArray(ai_?.dishes) ? ai_.dishes : []) {
    const ids: string[] = (Array.isArray(g?.ids) ? g.ids : []).map(String).filter((x: string) => rows.some((r) => r.id === x) && !groupOf.has(x))
    if (ids.length < 2) continue
    const members = ids.map((x) => rows.find((r) => r.id === x)!)
    const name = String(g?.name || '').trim()
    // Only a name one of them carries (or a part of it, e.g. the Arabic half of "Hummus / حمص").
    const shown = members.map((m) => m.item.name).find((n) => n === name)
      || (members.some((m) => m.item.name.includes(name) && name.length >= 2) ? name : members[0].item.name)
    const grp = { name: shown.slice(0, 80), ids: [...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))) }
    for (const x of ids) groupOf.set(x, grp)
  }

  const out = new Map<string, { name: string; description: string; items: Category['items'] }>()
  const done = new Set<string>()
  for (const r of rows) {
    if (done.has(r.id)) continue
    const grp = groupOf.get(r.id)
    const members = grp ? grp.ids.map((x) => rows.find((y) => y.id === x)!) : [r]
    members.forEach((m) => done.add(m.id))
    const first = members[0]
    const sec = secName.get(first.sec) || secs.find((s) => s.id === first.sec)!.name
    const entry = out.get(sec) || { name: sec, description: secs.find((s) => s.id === first.sec)!.description, items: [] }
    out.set(sec, entry)
    entry.items.push({
      name: grp ? grp.name : first.item.name,
      price: members.find((m) => m.item.price)?.item.price || '',
      description: members.find((m) => m.item.description)?.item.description || '',
      badge: members.find((m) => m.item.badge)?.item.badge || '',
    })
  }
  // A last pass for exact repeats the grouping left.
  const merged = mergeAll(Array.from(out.values()))
  return merged.length ? merged : cats
}

/** mergeResults without its 12-section cap: the owner sees everything, and the step tells him if it is too long. */
function mergeAll(cats: Category[]): Category[] {
  const by = new Map<string, Category>()
  for (const c of cats) {
    const k = dishKey(c.name) || c.name
    const e = by.get(k) || { name: c.name, description: c.description, items: [] }
    by.set(k, e)
    for (const i of c.items) if (!e.items.some((x) => dishKey(x.name) === dishKey(i.name) && dishKey(i.name))) e.items.push(i)
  }
  return Array.from(by.values())
}
