import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'
import { logAiUsage } from '@/lib/ai-usage'

/* ────────────────────────────────────────────────────────────────────── *
 * POST /api/analyze-menu                                                   *
 *                                                                          *
 * Reads photos of a physical restaurant menu and returns the structured    *
 * menu — categories → items {name, price, description, badge} — in the      *
 * exact shape the restaurant wizard already uses. "Upload your menu, we'll  *
 * type it for you."                                                        *
 *                                                                          *
 * WHY ONE CALL PER IMAGE (not one big call):                               *
 *  Real menus have 100+ items. A single vision call transcribing the whole *
 *  menu produces a huge response that (a) hit the output-token cap and      *
 *  truncated into invalid JSON, and (b) took long enough to blow Vercel's   *
 *  function timeout (504). So we fire ONE call per image/half CONCURRENTLY, *
 *  each producing a small fast result, then merge them here. Total wall     *
 *  time ≈ the slowest single call instead of the sum.                       *
 *                                                                          *
 * Honesty rules (in the prompt): transcribe only what's printed — never     *
 * invent dishes/prices/descriptions; preserve the menu's own language and   *
 * dish names; never attach images (photos stay owner-provided).             *
 * ────────────────────────────────────────────────────────────────────── */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Ask for the max the plan allows; Vercel clamps to the plan cap. The parallel
// design targets well under 60s regardless.
export const maxDuration = 300

// gpt-4o reads dense menus best and this key has access. Per-image calls keep
// each response small, so latency stays low without a fallback model.
const MODEL = 'gpt-4o'
// Per-call budget. Each image/half is one page-slice, so this is plenty and
// keeps any single call from running long.
const PER_CALL_TIMEOUT_MS = 55_000
const PER_CALL_MAX_TOKENS = 4000
// Wide menus are split client-side into left/right halves, so a 2–3 page menu
// can arrive as up to 6 image parts.
const MAX_IMAGES = 6
// Generous per-image cap on the (base64) data URL.
const MAX_IMAGE_CHARS = 3_500_000

// Schema-aligned clamps — mirror utils/restaurant/input.ts so whatever we
// extract can flow straight through the wizard without tripping validation.
const MAX_CATEGORIES = 12
const MAX_ITEMS_PER_CAT = 40

type Item = { name: string; price: string; description: string; badge: string }
type Category = { name: string; description: string; items: Item[] }

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) }
    )
  })
}

function parseJsonSafe(raw: string): any {
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
function mergeResults(lists: Category[][]): Category[] {
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
- Group items under the section headings the menu uses (المشروبات الساخنة / الحلويات اليمنية / Appetizers / etc.). Items with no heading go under one sensible category.
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

/** One vision call for a single image/half. Returns [] on any failure. */
async function analyzeOne(
  openai: OpenAI,
  image: string,
  cuisine: string | undefined,
  userId: string
): Promise<{ categories: Category[]; ok: boolean; error?: string }> {
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text:
        `This is one photo (or half) of a restaurant menu` +
        (cuisine ? ` (cuisine: ${cuisine})` : '') +
        `. Transcribe every category and item you can read in it, following the rules exactly.`,
    },
    { type: 'image_url', image_url: { url: image, detail: 'high' } },
  ]

  try {
    const resp = await withTimeout(
      openai.chat.completions.create({
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
    return { categories: sanitizeOne(ai), ok: true }
  } catch (e: any) {
    console.error('[/api/analyze-menu] image call failed:', e?.status || '', e?.message || e)
    return { categories: [], ok: false, error: String(e?.message || e) }
  }
}

export async function POST(req: NextRequest) {
  // Auth-gate: this burns vision tokens and the wizard already requires login.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const rawImages = Array.isArray(body?.images) ? body.images : []
  const images: string[] = rawImages
    .filter((s: unknown): s is string => typeof s === 'string')
    .map((s: string) => s.trim())
    .filter((s: string) => /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(s) || /^https?:\/\//i.test(s))
    .filter((s: string) => s.length <= MAX_IMAGE_CHARS)
    .slice(0, MAX_IMAGES)

  if (images.length === 0) {
    return NextResponse.json(
      { error: 'no_images', message: 'ارفع صورة واحدة واضحة على الأقل لقائمتك.' },
      { status: 400 }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { categories: [], error: 'no_api_key', message: 'قراءة القائمة غير متاحة حاليًا. يمكنك إدخال الأصناف يدويًا.' },
      { status: 200 }
    )
  }

  const cuisine =
    typeof body?.cuisine === 'string' && body.cuisine.trim() ? body.cuisine.trim().slice(0, 60) : undefined

  try {
    const openai = new OpenAI({ apiKey })

    // Fire every image concurrently; a slow/failed slice doesn't sink the rest.
    const results = await Promise.all(images.map((img) => analyzeOne(openai, img, cuisine, user.id)))

    const categories = mergeResults(results.map((r) => r.categories))
    const itemCount = categories.reduce((n, c) => n + c.items.length, 0)
    const anyOk = results.some((r) => r.ok)
    const errors = results.filter((r) => !r.ok).map((r) => r.error)

    if (categories.length === 0) {
      // Distinguish "read it but found nothing" from "every call errored".
      const message = anyOk
        ? 'لم نتمكّن من قراءة أصناف من الصورة. جرّب صورة أوضح أو أدخل الأصناف يدويًا.'
        : 'تعذّرت قراءة القائمة الآن. يمكنك إدخال الأصناف يدويًا والمتابعة.'
      return NextResponse.json(
        { categories: [], error: anyOk ? 'no_menu_found' : 'analyze_failed', message, _meta: { errors } },
        { status: 200 }
      )
    }

    return NextResponse.json({
      categories,
      _meta: {
        source: 'openai',
        model: MODEL,
        images: images.length,
        categories: categories.length,
        items: itemCount,
        partial: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        categories: [],
        error: 'analyze_failed',
        message: 'تعذّرت قراءة القائمة الآن. يمكنك إدخال الأصناف يدويًا والمتابعة.',
        detail: String(e?.message || e),
      },
      { status: 200 }
    )
  }
}
