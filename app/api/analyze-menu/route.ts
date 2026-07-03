import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'
import { logAiUsage } from '@/lib/ai-usage'

/* ────────────────────────────────────────────────────────────────────── *
 * POST /api/analyze-menu                                                   *
 *                                                                          *
 * Reads one or more photos of a physical restaurant menu and returns the   *
 * structured menu — categories → items {name, price, description, badge} — *
 * in the exact shape the restaurant wizard already uses. This is the       *
 * "upload your menu, we'll type it for you" feature: instead of hand-      *
 * entering 40 dishes one by one, the owner snaps their menu and reviews.   *
 *                                                                          *
 * Honesty rules baked into the prompt:                                     *
 *  - Extract ONLY what is actually printed. Never invent dishes, prices,   *
 *    or descriptions. Missing price/description → empty string.            *
 *  - Preserve the menu's own language and dish names verbatim. We do NOT   *
 *    translate here — a Syrian menu stays in its own Arabic, an Italian    *
 *    dish keeps its Italian name. (Marketing copy is Arabicised later, at  *
 *    generation time, which the user explicitly acknowledges.)             *
 *  - No images are ever attached to items here. Photos stay opt-in and     *
 *    owner-provided.                                                       *
 * ────────────────────────────────────────────────────────────────────── */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'gpt-4o'
const TIMEOUT_MS = 50_000
const MAX_IMAGES = 4
// Generous per-image cap on the (base64) data URL. The client downscales to
// ~1500px/JPEG before sending, so a real photo lands well under this; the cap
// only guards against someone posting a raw multi-MB original.
const MAX_IMAGE_CHARS = 3_500_000

// Schema-aligned clamps — mirror utils/restaurant/input.ts so whatever we
// extract can flow straight through the wizard without tripping validation.
const MAX_CATEGORIES = 8
const MAX_ITEMS_PER_CAT = 20

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

/** Normalise the model's JSON into the wizard's category shape + clamp sizes. */
function sanitizeCategories(ai: any): Array<{
  name: string
  description: string
  items: Array<{ name: string; price: string; description: string; badge: string }>
}> {
  const rawCats = Array.isArray(ai?.categories) ? ai.categories : []
  const out: any[] = []
  for (const cat of rawCats.slice(0, MAX_CATEGORIES)) {
    const name = str(cat?.name).trim().slice(0, 40)
    if (!name) continue
    const rawItems = Array.isArray(cat?.items) ? cat.items : []
    const items: any[] = []
    for (const it of rawItems.slice(0, MAX_ITEMS_PER_CAT)) {
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

const SYSTEM_PROMPT = `You are a precise menu-digitising engine for a restaurant website builder.
You are given one or more photographs of a real restaurant's printed menu.
Your only job is to transcribe what is printed into clean structured data.

ABSOLUTE RULES:
- Transcribe ONLY what you can actually read on the menu. Never invent, guess, or embellish a dish, a price, or a description. If a menu shows no descriptions, leave every description empty.
- Preserve the menu's OWN language and the exact dish names as printed. Do NOT translate. Arabic menus stay in their Arabic; foreign dish names (e.g. "Risotto", "Sushi") keep their original spelling.
- Keep prices exactly as printed, including the currency symbol or word if shown (e.g. "٤٥ ج.م", "$18", "12€"). If an item has no visible price, use an empty string.
- Group items under the section headings the menu itself uses (Appetizers / المقبلات / Drinks / etc.). If the menu has no headings, put everything under one sensible category.
- If several photos are different pages of the same menu, merge them into one coherent set of categories. Do not duplicate items that appear on multiple photos.
- Only set "badge" if the menu itself marks an item (e.g. "Chef's special", "جديد", "نباتي", "الأكثر طلبًا"). Otherwise leave it empty.
- If an image is not a menu, or is unreadable, return an empty categories array.

Return STRICT JSON only, no prose, no markdown, matching exactly:
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

export async function POST(req: NextRequest) {
  // Auth-gate: this burns vision tokens, and the wizard already requires a
  // signed-in user, so never let it be hit anonymously.
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
    // Graceful: no key configured → tell the client to fall back to manual entry.
    return NextResponse.json(
      { categories: [], error: 'no_api_key', message: 'قراءة القائمة غير متاحة حاليًا. يمكنك إدخال الأصناف يدويًا.' },
      { status: 200 }
    )
  }

  try {
    const openai = new OpenAI({ apiKey })

    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text:
          `Here ${images.length === 1 ? 'is 1 photo' : `are ${images.length} photos`} of a restaurant menu` +
          (typeof body?.cuisine === 'string' && body.cuisine.trim()
            ? ` (cuisine: ${body.cuisine.trim().slice(0, 60)})`
            : '') +
          `. Transcribe every category and item you can read, following the rules exactly.`,
      },
      ...images.map(
        (url): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
          type: 'image_url',
          image_url: { url, detail: 'high' },
        })
      ),
    ]

    const resp = await withTimeout(
      openai.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' as const },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      TIMEOUT_MS,
      'analyze_menu'
    )

    await logAiUsage(
      { operation: 'analyze-menu', userId: user.id, model: MODEL, meta: { images: images.length } },
      resp.usage
    )

    const raw = resp.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try {
      aiJson = parseJsonSafe(raw)
    } catch {
      aiJson = {}
    }

    const categories = sanitizeCategories(aiJson)
    const itemCount = categories.reduce((n, c) => n + c.items.length, 0)

    if (categories.length === 0) {
      return NextResponse.json(
        {
          categories: [],
          error: 'no_menu_found',
          message: 'لم نتمكّن من قراءة أصناف من الصورة. جرّب صورة أوضح أو أدخل الأصناف يدويًا.',
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      categories,
      _meta: { source: 'openai', model: MODEL, categories: categories.length, items: itemCount },
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
