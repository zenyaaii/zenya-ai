import { AI_MODEL } from '@/lib/ai'
import { AiClient, type ContentPart } from '@/lib/ai-client'
import { logAiUsage } from '@/lib/ai-usage'

/**
 * Reading a photo of a printed menu into the wizard's menu shape. Shared by
 * /api/analyze-menu (the owner uploads photos) and the lead builder (the menu
 * photo found among the place's own pictures). One call per image, merged.
 */

// The main model reads dense Arabic menus well. Per-image calls keep each
// response small, so latency stays low without a fallback model.
export const MODEL = AI_MODEL
// Per-call budget. Each image/half is one page-slice, so this is plenty and
// keeps any single call from running long.
const PER_CALL_TIMEOUT_MS = 55_000
const PER_CALL_MAX_TOKENS = 4000
// Wide menus are split client-side into left/right halves, so a 2–3 page menu
// can arrive as up to 6 image parts.
export const MAX_IMAGES = 6
// Generous per-image cap on the (base64) data URL.
export const MAX_IMAGE_CHARS = 3_500_000

// Schema-aligned clamps — mirror utils/restaurant/input.ts so whatever we
// extract can flow straight through the wizard without tripping validation.
const MAX_CATEGORIES = 12
const MAX_ITEMS_PER_CAT = 40

export type Item = { name: string; price: string; description: string; badge: string }
export type Category = { name: string; description: string; items: Item[] }

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) }
    )
  })
}

export function parseJsonSafe(raw: string): any {
  try {
    return JSON.parse(raw)
  } catch {
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

/** Loose key for de-duping names across overlapping halves / repeated pages. */
function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ـ\s]+/g, ' ') // strip Arabic tatweel + collapse whitespace
    .replace(/[.،؛:_-]+/g, '')
    .trim()
}

/** Normalise one model response into clean Category[] (no cross-image merge). */
function sanitizeOne(ai: any): Category[] {
  const rawCats = Array.isArray(ai?.categories) ? ai.categories : []
  const out: Category[] = []
  for (const cat of rawCats) {
    const name = str(cat?.name).trim().slice(0, 40)
    if (!name) continue
    const rawItems = Array.isArray(cat?.items) ? cat.items : []
    const items: Item[] = []
    for (const it of rawItems) {
      const iname = str(it?.name).trim().slice(0, 80)
      if (iname.length < 1) continue
      items.push({
        name: iname,
        price: str(it?.price).trim().slice(0, 30),
        description: str(it?.description).trim().slice(0, 220),
        badge: str(it?.badge).trim().slice(0, 20),
      })
    }
    if (items.length === 0) continue
    out.push({ name, description: str(cat?.description).trim().slice(0, 160), items })
  }
  return out
}

/**
 * Merge the per-image results into one menu. Categories with the same (loose)
 * name fold together; items de-dupe by name within a category, keeping the
 * richer copy (fills a missing price/description from a duplicate). Overlapping
 * halves therefore reinforce rather than duplicate.
 */
export function mergeResults(lists: Category[][]): Category[] {
  const cats = new Map<string, { name: string; description: string; items: Map<string, Item> }>()
  for (const list of lists) {
    for (const cat of list) {
      const ck = normKey(cat.name)
      if (!ck) continue
      let entry = cats.get(ck)
      if (!entry) {
        entry = { name: cat.name, description: cat.description, items: new Map() }
        cats.set(ck, entry)
      } else if (!entry.description && cat.description) {
        entry.description = cat.description
      }
      for (const item of cat.items) {
        const ik = normKey(item.name)
        if (!ik) continue
        const existing = entry.items.get(ik)
        if (!existing) {
          entry.items.set(ik, { ...item })
        } else {
          if (!existing.price && item.price) existing.price = item.price
          if (!existing.description && item.description) existing.description = item.description
          if (!existing.badge && item.badge) existing.badge = item.badge
        }
      }
    }
  }

  const merged: Category[] = []
  for (const entry of cats.values()) {
    merged.push({
      name: entry.name,
      description: entry.description,
      items: Array.from(entry.items.values()).slice(0, MAX_ITEMS_PER_CAT),
    })
    if (merged.length >= MAX_CATEGORIES) break
  }
  return merged
}

const SYSTEM_PROMPT = `You are a precise menu-digitising engine for a restaurant website builder.
You are given a photo (or half of a wide photo) of a real restaurant's printed menu.
Your only job is to transcribe what is printed into clean structured data.

READING DENSE / ARABIC MENUS (important — most menus look like this):
- Menus are often laid out in MULTIPLE COLUMNS. Read every column, top to bottom, and don't stop after the first one. One image can hold several separate sections.
- Arabic and RTL menus read RIGHT-TO-LEFT: the dish NAME is on the right, the PRICE is on the left, usually joined by a row of dots (………). Pair each name with the number on its own line. Follow the dotted "leader" lines so you attach the right price to the right dish.
- Numbers are prices even when written in Arabic-Indic digits (٢٥ = 25). Transcribe prices using Western digits (0-9).
- Be thorough: extract EVERY item you can read in this image, not just a sample.

ABSOLUTE RULES:
- Transcribe ONLY what you can actually read. Never invent, guess, or embellish a dish, a price, or a description. If the menu shows no descriptions, leave every description empty.
- Preserve the menu's OWN language and the exact dish names as printed. Do NOT translate.
- Keep prices as printed. Include the currency if shown (e.g. "45 ج.م", "$18"); otherwise just the number. No visible price → empty string, never a guess.
- Group items under the section headings the menu uses (المشروبات الساخنة / الحلويات اليمنية / Appetizers / etc.). Items with no heading go under one category named "القائمة" (or "Menu" if the menu is not in Arabic). Never name a category after the cuisine or the restaurant.
- Only set "badge" if the menu itself marks an item (e.g. "جديد", "الأكثر طلبًا", "Chef's special"). Otherwise empty.
- If the image is genuinely not a menu or is fully unreadable, return an empty categories array — but do not give up on a menu just because it is dense.

Return STRICT JSON only, no prose, no markdown:
{
  "categories": [
    {
      "name": "section name as printed",
      "description": "",
      "items": [
        { "name": "dish name as printed", "price": "price as printed or empty", "description": "printed description or empty", "badge": "" }
      ]
    }
  ]
}`

/**
 * How sure the read is, asked only when WE picked the photo (the menu found
 * among the place's own pictures). An owner's upload is read as it is; a photo
 * we found is used only when every name and price on it was read for certain.
 */
export type Legibility = 'full' | 'partial' | 'poor'
const JUDGE_NOTE = `

This photo was found on the restaurant's own pages, not uploaded by the owner, so also judge it. Add one more top-level key, "legibility":
- "full": a real printed menu or price board, sharp, and you read EVERY dish name and EVERY price on it with certainty.
- "partial": some names or prices are cut off at the edge, blurred, in glare, too small, or covered.
- "poor": not a menu, mostly unreadable, a poster/ad with only one or two offers, or a screenshot of an app.
Be strict: when unsure, it is "partial".`

const HALF_NOTE = `
This image is one of two overlapping halves of a single menu page. A line cut at the edge where the halves meet is read in full in the other half: do not count that cut against "legibility".`

/** One vision call for a single image/half. Returns [] on any failure. */
export async function analyzeOne(
  aiClient: AiClient,
  image: string,
  cuisine: string | undefined,
  userId: string | null,
  opts: { judge?: boolean; half?: boolean } = {}
): Promise<{ categories: Category[]; ok: boolean; error?: string; legibility?: Legibility }> {
  const userContent: ContentPart[] = [
    {
      type: 'text',
      text:
        `This is one photo (or half) of a restaurant menu` +
        (cuisine ? ` (cuisine: ${cuisine})` : '') +
        `. Transcribe every category and item you can read in it, following the rules exactly.` +
        (opts.judge ? JUDGE_NOTE : '') +
        (opts.judge && opts.half ? HALF_NOTE : ''),
    },
    { type: 'image_url', image_url: { url: image, detail: 'high' } },
  ]

  try {
    const resp = await withTimeout(
      aiClient.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: PER_CALL_MAX_TOKENS,
        response_format: { type: 'json_object' as const },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      PER_CALL_TIMEOUT_MS,
      'analyze_one'
    )

    await logAiUsage({ operation: 'analyze-menu', userId, model: MODEL }, resp.usage)

    const raw = resp.choices?.[0]?.message?.content || '{}'
    const finish = resp.choices?.[0]?.finish_reason
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      // Truncated/invalid JSON (e.g. hit the token cap on a very dense slice).
      return { categories: [], ok: false, error: `bad_json_${finish || 'unknown'}` }
    }
    const leg = String(ai?.legibility || '').toLowerCase()
    const legibility: Legibility | undefined = opts.judge
      ? (leg === 'full' || leg === 'partial' || leg === 'poor' ? leg : 'poor')
      : undefined
    return { categories: sanitizeOne(ai), ok: true, legibility }
  } catch (e: any) {
    console.error('[/api/analyze-menu] image call failed:', e?.status || '', e?.message || e)
    return { categories: [], ok: false, error: String(e?.message || e) }
  }
}

