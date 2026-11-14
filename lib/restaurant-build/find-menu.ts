import sharp from 'sharp'
import { AiClient } from '@/lib/ai-client'
import { AI_MODEL, AI_MODEL_FAST } from '@/lib/ai'
import { logAiUsage } from '@/lib/ai-usage'
import { analyzeOne, mergeResults, parseJsonSafe, withTimeout, type Category, type Legibility } from '@/lib/menu-ocr'
import { cleanPhotos, contactSheet, applyVerdicts, choose, judgePrompt, type Judged } from './photos'
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

const MAX_MENU_PHOTOS = 3
const WIDE = 1.2

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const r = await withTimeout(fetch(url, { cache: 'no-store' }), 12_000, 'menu_photo')
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const b = Buffer.from(await r.arrayBuffer())
    return b.length > 2000 ? b : null
  } catch { return null }
}

/** A wide menu in two overlapping halves, so the text reaches the reader at a size it can read. */
async function parts(j: Judged): Promise<string[]> {
  const url = (b: Buffer) => `data:image/jpeg;base64,${b.toString('base64')}`
  if (j.w <= j.h * WIDE) return [url(j.jpeg)]
  const half = Math.round(j.w * 0.56)
  const [a, b] = await Promise.all([
    sharp(j.jpeg).extract({ left: j.w - half, top: 0, width: half, height: j.h }).jpeg({ quality: 88 }).toBuffer(),
    sharp(j.jpeg).extract({ left: 0, top: 0, width: half, height: j.h }).jpeg({ quality: 88 }).toBuffer(),
  ])
  return [url(a), url(b)]
}

const CAPTION_PROMPT = `You are given the captions a restaurant posted on its own Instagram. Some may list dishes with prices.
Extract ONLY dishes that appear with an explicit price in the captions. Never invent a dish, a price or a description; keep names exactly as written, in their language. Prices with Western digits, currency as written.
Group under the section names the captions use; otherwise one section named "القائمة".
If fewer than three priced dishes are written, return an empty categories array.
Return strict JSON: { "categories": [ { "name": "", "description": "", "items": [ { "name": "", "price": "", "description": "", "badge": "" } ] } ] }`

const priced = (t: string) => (t.match(/\d{1,4}(?:[.,]\d{1,2})?\s*(?:ج\.?م|جنيه|ر\.?س|ريال|د\.?إ|درهم|د\.?ك|دينار|ل\.?ل|ليرة|\$|€|£|EGP|SAR|AED|KWD|JOD|QAR|BHD|OMR|LBP|USD)/gi) || []).length

export async function findMenu(
  ai: AiClient,
  opts: { photos: string[]; captions?: string[]; cuisine?: string; userId: string | null }
): Promise<FoundMenu> {
  // 1 — fetch and look, all at once on one sheet.
  const raw = (await Promise.all(opts.photos.slice(0, 22).map(async (url, i) => {
    const buf = await fetchImage(url)
    return buf ? { id: `u${i}`, src: (/\/instagram\//.test(url) ? 'instagram' : 'google') as RawPhoto['src'], url, buf } : null
  }))).filter(Boolean) as RawPhoto[]
  const pics = await cleanPhotos(raw)
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

  // 2 — read every menu photo, and say how clear each one is.
  const candidates = judged
    .filter((j) => j.v.kind === 'menu' && !j.v.cgi && !j.v.tattoo && j.v.people !== 'women' && j.v.people !== 'faces')
    .sort((a, b) => b.v.quality - a.v.quality)
    .slice(0, MAX_MENU_PHOTOS)
  const read = await Promise.all(candidates.map(async (j): Promise<MenuPage | null> => {
    const reads = await Promise.all((await parts(j)).map((p) => analyzeOne(ai, p, opts.cuisine, opts.userId, { judge: true })))
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
    return { url: j.url, clear: !why, why, categories }
  }))
  const pages = read.filter(Boolean) as MenuPage[]
  // 3 — no menu photo at all: the captions, when they carry prices.
  let categories: Category[] = []
  // 3 — no menu photo we could fully read: the captions, when they carry prices.
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
