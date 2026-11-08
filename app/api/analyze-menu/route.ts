import { NextRequest, NextResponse } from 'next/server'
import { AiClient, aiKey } from '@/lib/ai-client'
import { createClient } from '@/utils/supabase/server'
import { MODEL, MAX_IMAGES, MAX_IMAGE_CHARS, analyzeOne, mergeResults, type Category } from '@/lib/menu-ocr'

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

/* ────────────────────────────────────────────────────────────────────── *
 * The public build demo.                                                   *
 *                                                                          *
 * /demo/home shows the restaurant wizard filling itself in, and its Menu    *
 * card drives THIS route through the wizard's own analyzer component — the  *
 * same file, the same client-side preparation, the same request. But the    *
 * page is public and the reader is not signed in, so it announces itself    *
 * with `demo: true`.                                                        *
 *                                                                          *
 * A flag anyone could send cannot be allowed to buy vision calls, so a demo *
 * read is bounded twice over:                                               *
 *                                                                           *
 *  1. It reads the BUNDLED SAMPLE, never the posted image. The demo answer   *
 *     is one shared object, so honouring whatever arrived would let one      *
 *     caller's photograph become what every visitor after them watches fill  *
 *     in — and would put an open vision endpoint behind a boolean.           *
 *  2. It is memoised per server instance. The first demo read is a real      *
 *     model call and every read after it is handed that same answer, so the  *
 *     route is worth exactly one call per instance however hard it is        *
 *     hammered.                                                              *
 *                                                                           *
 * What the demo shows is therefore a real AI read of a real photograph,  *
 * made by this route. A signed-in caller never touches any of this.          *
 * ────────────────────────────────────────────────────────────────────── */
const DEMO_SAMPLE = '/demo/menu-sample.jpg'
const DEMO_CUISINE = 'مأكولات شامية عصرية'
let demoRead: Promise<{ categories: Category[]; ok: boolean; error?: string }[]> | null = null

/**
 * The demo's own read: fetch the bundled sample over the request's own
 * origin (public assets are not reliably on the lambda's filesystem, but they
 * are always on the CDN) and put it through the same single vision call the
 * wizard would. Runs at most once per server instance.
 */
async function readDemoSample(aiClient: AiClient, origin: string, cookie: string | null) {
  // A protected preview deployment answers an anonymous fetch with its login
  // page, not the photo. The visitor's own cookie carries their preview
  // access, so it goes along; production has no protection and ignores it.
  const res = await fetch(new URL(DEMO_SAMPLE, origin).toString(), {
    headers: cookie ? { cookie } : undefined,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`demo_sample_${res.status}`)
  const type = res.headers.get('content-type') || ''
  if (!type.startsWith('image/')) throw new Error(`demo_sample_not_image:${type}`)
  const image = `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
  return Promise.all([analyzeOne(aiClient, image, DEMO_CUISINE, null)])
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Auth-gate: this burns vision tokens and the wizard already requires login.
  // The public demo is the one exception, and it is memoised — see above.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const demo = !user && body?.demo === true
  if (!user && !demo) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const rawImages = Array.isArray(body?.images) ? body.images : []
  const images: string[] = rawImages
    .filter((s: unknown): s is string => typeof s === 'string')
    .map((s: string) => s.trim())
    .filter((s: string) => /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(s) || /^https?:\/\//i.test(s))
    .filter((s: string) => s.length <= MAX_IMAGE_CHARS)
    .slice(0, MAX_IMAGES)

  // A demo read supplies its own image, so it is allowed to arrive without
  // one — which is also how the page warms this route before it needs it.
  if (images.length === 0 && !demo) {
    return NextResponse.json(
      { error: 'no_images', message: 'ارفع صورة واحدة واضحة على الأقل لقائمتك.' },
      { status: 400 }
    )
  }

  const apiKey = aiKey()
  if (!apiKey) {
    return NextResponse.json(
      { categories: [], error: 'no_api_key', message: 'قراءة القائمة غير متاحة حاليًا. يمكنك إدخال الأصناف يدويًا.' },
      { status: 200 }
    )
  }

  const cuisine =
    typeof body?.cuisine === 'string' && body.cuisine.trim() ? body.cuisine.trim().slice(0, 60) : undefined

  try {
    const aiClient = new AiClient({ apiKey })

    let results
    if (demo) {
      // The bundled sample, read once per server instance and then shared.
      if (!demoRead) {
        demoRead = readDemoSample(aiClient, req.nextUrl.origin, req.headers.get('cookie'))
          .catch((e) => { demoRead = null; throw e })
      }
      results = await demoRead
      // Never keep a failure: the next visitor should get a fresh attempt.
      if (!results.some((r) => r.ok)) demoRead = null
    } else {
      // Fire every image concurrently; a slow/failed slice doesn't sink the rest.
      results = await Promise.all(images.map((img) => analyzeOne(aiClient, img, cuisine, user!.id)))
    }

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
        source: demo ? 'claude:demo-sample' : 'claude',
        model: MODEL,
        images: demo ? 1 : images.length,
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
