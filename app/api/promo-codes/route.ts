import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Persistent store of the discount codes a user has earned, so they can
 * re-access them from Settings instead of losing a one-time reveal (e.g. the
 * review-offer overlay) the moment it's dismissed.
 *
 * Writes are locked to a server-side allowlist of self-serve codes — a user
 * can only save a code Zenya actually hands out, never an arbitrary string.
 */

const REVIEW_CODE = process.env.NEXT_PUBLIC_REVIEW_PROMO_CODE || 'SHUKRAN30'

/** Codes a user may save to their own list, with display metadata. */
const KNOWN_CODES: Record<
  string,
  { label: string; description: string; kind: string; source: string }
> = {
  [REVIEW_CODE]: {
    label: '30% خصم على أول شهر',
    description: 'أدخِله في خانة «Promotion code» عند الاشتراك. صالح لأول شهر وللعملاء الجدد.',
    kind: 'subscription',
    source: 'review',
  },
}

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** GET /api/promo-codes — the caller's saved codes, newest first. */
export async function GET() {
  const supabase = createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_promo_codes')
    .select('id, code, label, description, kind, source, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'db_error', details: error.message }, { status: 500 })
  }
  return NextResponse.json({ codes: data || [] })
}

/**
 * POST /api/promo-codes  Body: { code: string }
 * Saves an allowlisted code to the caller's list. Idempotent — re-saving the
 * same code is a no-op thanks to the (user_id, code) unique constraint.
 */
export async function POST(req: NextRequest) {
  const supabase = createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const code = String(body?.code || '').trim().toUpperCase()
  const meta = KNOWN_CODES[code]
  if (!meta) {
    return NextResponse.json({ error: 'unknown_code' }, { status: 400 })
  }

  const { error } = await admin()
    .from('user_promo_codes')
    .upsert(
      {
        user_id: user.id,
        code,
        label: meta.label,
        description: meta.description,
        kind: meta.kind,
        source: meta.source,
      },
      { onConflict: 'user_id,code', ignoreDuplicates: true },
    )

  if (error) {
    return NextResponse.json({ error: 'db_error', details: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
