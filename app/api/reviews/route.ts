import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/reviews — persist a customer review.
 *
 * Rows land as `status='pending'` and are NEVER shown publicly until a founder
 * approves them (see the reviews table comment). This is the honest-by-design
 * pipeline: real submissions in, only approved ones out. RLS ("Anyone submits a
 * pending review") permits both anon and authenticated inserts as long as
 * status is pending and user_id is null or the caller's own id.
 */
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(3).max(4000),
  email: z.string().email().max(200).optional().or(z.literal('')),
  site_url: z.string().trim().max(400).optional().or(z.literal('')),
  role: z.string().trim().max(120).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid', message: 'يرجى إدخال تقييم (نجمة واحدة على الأقل) ونص المراجعة.', issues: parsed.error.format() },
      { status: 400 },
    )
  }
  const { name, rating, body: text, email, site_url, role } = parsed.data

  // Cheap honeypot: reject UA-less clients (usually spam scripts) but pretend
  // success so we don't teach the abuser anything.
  const ua = req.headers.get('user-agent') || ''
  if (!ua) return NextResponse.json({ ok: true })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ip =
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    null

  const { error } = await supabase.from('reviews').insert({
    user_id: user?.id ?? null,
    name,
    role: role || null,
    rating,
    body: text,
    email: email || user?.email || null,
    site_url: site_url || null,
    ip_address: ip,
    user_agent: ua.slice(0, 400),
    status: 'pending',
  })

  if (error) {
    console.error('[/api/reviews] insert failed', error)
    return NextResponse.json({ error: 'db_error', message: 'تعذّر حفظ مراجعتك. حاول مجددًا.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
