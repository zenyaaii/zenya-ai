import { KIND, type NicheKind } from '@/utils/services/kinds'
import sharp from 'sharp'
import type { RawPhoto } from './sources'

/**
 * Steps 2 and 3: clean the photos without AI, then let AI look at them the
 * way a visitor would — all of them at once, on one numbered contact sheet,
 * so judging 20 photos costs one vision call, not 20.
 */

export type Pic = RawPhoto & { w: number; h: number; hash: bigint; jpeg: Buffer }

export type Kind = 'food' | 'drink' | 'interior' | 'exterior' | 'logo' | 'menu' | 'people' | 'other'
export type Verdict = {
  n: number
  kind: Kind
  quality: number          // 1–10: light, focus, framing — does it look professional?
  appetite: number         // 1–10: does it make a visitor want to go?
  people: 'none' | 'far' | 'faces' | 'women'
  tattoo: boolean
  text: boolean            // a poster, price card or graphic over the photo
  cgi: boolean             // a 3D render, AI image or stock illustration, not a photo of this place
  dish: string             // Arabic dish name, only when plainly recognisable
  alt: string              // short Arabic description
}
export type Judged = Pic & { v: Verdict; ok: boolean; why?: string }

// ── clean (no AI) ─────────────────────────────────────────────────────────
async function dhash(buf: Buffer): Promise<bigint> {
  const px = await sharp(buf).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer()
  let h = BigInt(0)
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    h = (h << BigInt(1)) | (px[y * 9 + x] > px[y * 9 + x + 1] ? BigInt(1) : BigInt(0))
  }
  return h
}
export const hamming = (a: bigint, b: bigint) => { let x = a ^ b, n = 0; while (x) { n += Number(x & BigInt(1)); x >>= BigInt(1) } return n }

/** Broken, tiny and duplicate photos out; everything else normalised to a JPEG ≤1600px. */
export async function cleanPhotos(raw: RawPhoto[], max = 25): Promise<Pic[]> {
  const out: Pic[] = []
  for (const r of raw) {
    try {
      const jpeg = await sharp(r.buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
      const m = await sharp(jpeg).metadata()
      const w = m.width || 0, h = m.height || 0
      if (Math.min(w, h) < (r.logoHint ? 150 : 400)) continue
      const hash = await dhash(jpeg)
      const dup = out.findIndex((p) => hamming(p.hash, hash) <= 6)
      if (dup >= 0) { if (w * h > out[dup].w * out[dup].h) out[dup] = { ...r, w, h, hash, jpeg }; continue }
      out.push({ ...r, w, h, hash, jpeg })
    } catch { /* unreadable: dropped */ }
  }
  return out.slice(0, max)
}

// ── contact sheet ─────────────────────────────────────────────────────────
const CELL = 300, COLS = 5
export async function contactSheet(pics: Pic[]): Promise<Buffer> {
  const rows = Math.ceil(pics.length / COLS)
  const tiles = await Promise.all(pics.map(async (p, i) => {
    const img = await sharp(p.jpeg).resize(CELL - 8, CELL - 8, { fit: 'contain', background: '#202020' }).toBuffer()
    const label = Buffer.from(`<svg width="44" height="30"><rect width="44" height="30" rx="4" fill="#ffd400"/><text x="22" y="22" font-size="20" font-family="Arial" font-weight="700" text-anchor="middle" fill="#000">${i + 1}</text></svg>`)
    return [
      { input: img, left: (i % COLS) * CELL + 4, top: Math.floor(i / COLS) * CELL + 4 },
      { input: label, left: (i % COLS) * CELL + 8, top: Math.floor(i / COLS) * CELL + 8 },
    ]
  }))
  return sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 3, background: '#111' } })
    .composite(tiles.flat()).jpeg({ quality: 80 }).toBuffer()
}


export type Niche = 'restaurant' | NicheKind

const PLACE: Partial<Record<Niche, { what: string; want: string; work: string; workEg: string; hero: string; dish: string }>> = {
  restaurant: {
    what: 'restaurant', want: 'want to go and eat here', work: 'food | drink', workEg: '',
    hero: 'makes you want to go', dish: 'for food/drink only, the dish in short Arabic (e.g. "مشاوي مشكلة", "كنافة") when you can plainly recognise it; otherwise "".',
  },
  barber: {
    what: "men's barbershop", want: 'want to get my haircut here', work: 'food (= a finished haircut, fade or beard, seen close) | drink (= tools, products or a station close up)',
    workEg: ' A haircut result is kind "food".',
    hero: 'shows the shop itself (chairs, mirrors, the room or the front), makes you want to sit in that chair',
    dish: 'for "food" (a haircut) only, the style in short Arabic (e.g. "تدريج", "لحية مرتبة") when plain; otherwise "".',
  },
}

/** The visitor's eye on a contact sheet of the place's photos, for one kind of place. */
export function judgePrompt(niche: Niche = 'restaurant'): string {
  const k = niche === 'restaurant' ? null : KIND[niche]
  const p = PLACE[niche] ?? {
    what: k!.visitor.place, want: k!.visitor.want, work: 'food (= the finished work, seen close: a result, a treated car, a printed photo) | drink (= tools, equipment or products close up)',
    workEg: ' A close-up of finished work is kind "food".', hero: 'shows the place itself (the room, the equipment or the front) and makes you want to go',
    dish: 'for "food" (finished work) only, what it is in short Arabic when plain; otherwise "".',
  }
  return `You are a first-time visitor deciding whether to go to this ${p.what}, looking at the photos it would show on its website. The sheet shows numbered photos (yellow number, top-left of each).

For EVERY number return one entry:
- kind: ${niche === 'restaurant' ? 'food | drink' : p.work} | interior | exterior | logo | menu | people | other. "menu" = a printed menu or price board you could read. "logo" = the brand mark, sign or profile badge.${p.workEg}
- quality 1-10: does it look professional? light, sharpness, framing, no clutter. A phone snapshot in bad light is 3-4; a clean, bright, well-framed shot is 8+.
- appetite 1-10: as a visitor, does this photo make me ${p.want}?
- people: "none"; "far" (small figures or backs, no recognisable face); "faces" (a recognisable face of a guest or staff); "women" (any woman or girl visible, at any size, with or without hijab).
- tattoo: true if any tattoo is visible.
- text: true if the photo is a poster, ad, price card, collage or has graphics/text laid over it (a real menu photo is kind "menu", text false).
- cgi: true if it is NOT a real photograph of this place: a 3D render, an AI-generated or stock-looking image, an illustration, a too-perfect showroom that does not match the other photos.
- dish: ${p.dish}
- alt: 3-8 Arabic words describing the photo.

Also return:
- hero: the number of the single best photo for the big header image of the home page: a real photograph (never cgi), wide, atmospheric, professional, no text, no recognisable faces, ${p.hero}. 0 if none is good enough.
- identity: up to 3 hex colours that are THIS place's own colours as seen in its logo, sign, walls, furniture or uniforms${niche === 'restaurant' ? ' (not the colour of the food)' : ''}. The first is the main one.
- identity_from: the photo numbers you took them from.
- mood: "dark" if the place feels like a night, warm-lit, luxurious or heritage room; "light" if it feels bright, daytime, fresh or casual.

Return strict JSON: { "photos": [ { "n": 1, "kind": "", "quality": 0, "appetite": 0, "people": "none", "tattoo": false, "text": false, "cgi": false, "dish": "", "alt": "" } ], "hero": 0, "identity": ["#000000"], "identity_from": [1], "mood": "dark" }`
}

export const JUDGE_PROMPT = judgePrompt('restaurant')

const KINDS: Kind[] = ['food', 'drink', 'interior', 'exterior', 'logo', 'menu', 'people', 'other']
const n10 = (x: unknown) => Math.max(1, Math.min(10, Math.round(Number(x) || 1)))

/** Normalises the AI's answer and applies the photo rules (no women, no faces, no tattoos, no posters). */
export function applyVerdicts(pics: Pic[], ai: any): Judged[] {
  const list: any[] = Array.isArray(ai?.photos) ? ai.photos : []
  return pics.map((p, i) => {
    const a = list.find((x) => Number(x?.n) === i + 1) || {}
    const v: Verdict = {
      n: i + 1,
      kind: KINDS.includes(a.kind) ? a.kind : 'other',
      quality: n10(a.quality), appetite: n10(a.appetite),
      people: ['none', 'far', 'faces', 'women'].includes(a.people) ? a.people : 'faces',
      tattoo: a.tattoo === true, text: a.text === true, cgi: a.cgi === true,
      dish: String(a.dish || '').trim().slice(0, 40), alt: String(a.alt || '').trim().slice(0, 80),
    }
    if (p.logoHint && v.kind !== 'logo' && v.kind !== 'exterior') v.kind = 'logo'
    const why = v.cgi ? 'ليست صورة حقيقية للمكان (ثلاثية الأبعاد أو مولّدة)' : v.people === 'women' ? 'امرأة في الصورة' : v.people === 'faces' ? 'وجه زائر واضح' : v.tattoo ? 'وشم'
      : v.text && v.kind !== 'menu' ? 'نص أو إعلان فوق الصورة' : v.kind === 'people' || v.kind === 'other' ? 'ليست صورة مكان أو طعام'
      : v.kind !== 'menu' && v.kind !== 'logo' && v.quality < 5 ? 'جودة ضعيفة' : undefined
    return { ...p, v, ok: !why, why }
  })
}

export type Picks = {
  hero?: Judged
  story?: Judged
  dishes: Judged[]
  gallery: Judged[]
  wall: Judged[]
  menus: Judged[]
  logos: Judged[]
}

const score = (j: Judged) => j.v.quality * 0.55 + j.v.appetite * 0.45
const wide = (j: Judged) => j.w >= j.h * 1.1 && j.w >= 900

/** Who goes where. Spreads photos so the same picture is never shown twice on one page. */
export function choose(js: Judged[], aiHero: number): Picks {
  const good = js.filter((j) => j.ok)
  const scene = good.filter((j) => ['food', 'drink', 'interior', 'exterior'].includes(j.v.kind))
  const byScore = (a: Judged, b: Judged) => score(b) - score(a)
  const aiPick = good.find((j) => j.v.n === aiHero && wide(j) && j.v.kind !== 'logo' && j.v.kind !== 'menu')
  // A wide, professional photo is best. Without one, the place's own best
  // photo still beats a stock picture: a stranger's luxury dining room over a
  // shawarma shop tells the visitor a lie (the AI visitor scored that 5/10).
  // The hero is cropped to fit, so a sharp, appetising square photo works too.
  const hero = aiPick && score(aiPick) >= 6.5 ? aiPick
    : [...scene].filter(wide).sort(byScore).find((j) => score(j) >= 6.5)
    ?? [...scene].filter((j) => j.v.quality >= 6).sort(byScore).find((j) => score(j) >= 6.5)
  const used = new Set<string>(hero ? [hero.id] : [])
  const dishes = scene.filter((j) => (j.v.kind === 'food' || j.v.kind === 'drink') && j.v.dish && j.v.appetite >= 6 && !used.has(j.id))
    .sort((a, b) => b.v.appetite - a.v.appetite)
    .filter((j, i, all) => all.findIndex((x) => x.v.dish === j.v.dish) === i)
    .slice(0, 4)
  dishes.forEach((d) => used.add(d.id))
  const story = scene.filter((j) => (j.v.kind === 'interior' || j.v.kind === 'exterior') && !used.has(j.id)).sort(byScore)[0]
  if (story) used.add(story.id)
  const room = (j: Judged) => (j.v.kind === 'interior' || j.v.kind === 'exterior' ? 1 : 0)
  let gallery = scene.filter((j) => !used.has(j.id) && score(j) >= 5.5)
    .sort((a, b) => room(b) - room(a) || byScore(a, b)).slice(0, 7)
  // Under three, the template tops the gallery up with stock rooms that are
  // not this place. Fill it from the place's own photos first, the dish
  // photos included: showing a real dish twice is better than a fake room.
  if (gallery.length < 3) {
    const more = scene.filter((j) => j.id !== hero?.id && !gallery.includes(j) && score(j) >= 4.5).sort(byScore)
    gallery = [...gallery, ...more].slice(0, Math.max(3, gallery.length))
  }
  // The wall sits on the home page under the dishes: their photos go last.
  const isDish = (j: Judged) => dishes.some((d) => d.id === j.id)
  const wall = scene.filter((j) => j.id !== hero?.id).sort((a, b) => Number(isDish(a)) - Number(isDish(b)) || byScore(a, b)).slice(0, 12)
  return {
    hero, story, dishes, gallery, wall,
    menus: js.filter((j) => j.v.kind === 'menu' && !j.v.tattoo && j.v.people !== 'women'),
    logos: js.filter((j) => j.v.kind === 'logo'),
  }
}
