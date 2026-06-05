import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/log
 * Body: { event_type: string, metadata?: Record<string, unknown> }
 *
 * Lightweight client-side event logger. Writes one row to activity_logs
 * with the caller's user_id resolved from the session. Anonymous events
 * are accepted (user_id=null) but rate-limited harder.
 *
 * Convention for event_type: dot-separated noun.verb, lowercase, e.g.
 *   "theme.generated", "theme.previewed", "checkout.started",
 *   "dashboard.opened", "settings.consent_updated".
 */

const MAX_EVENT_TYPE = 80
const MAX_METADATA_BYTES = 4_000 // ~4KB JSON per event

// Allowed event prefixes — keep the namespace clean. Anything else is rejected.
const ALLOWED_PREFIXES = [
  'theme.', 'checkout.', 'purchase.', 'hosting_subscription.', 'domain.',
  'auth.', 'dashboard.', 'settings.', 'pricing.', 'preview.', 'scrape.',
  'page.', 'affiliate.',
]

function isAllowed(eventType: string): boolean {
  return ALLOWED_PREFIXES.some((p) => eventType.startsWith(p))
}

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let body: any = {}
  try { body = await req.json() } catch {}
  const eventType = String(body?.event_type || '').trim().toLowerCase()
  const metadata = body?.metadata ?? {}

  if (!eventType || eventType.length > MAX_EVENT_TYPE) {
    return NextResponse.json({ error: 'invalid_event_type' }, { status: 400 })
  }
  if (!isAllowed(eventType)) {
    return NextResponse.json({ error: 'unknown_event_namespace' }, { status: 400 })
  }
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return NextResponse.json({ error: 'invalid_metadata' }, { status: 400 })
  }

  const metaBytes = Buffer.byteLength(JSON.stringify(metadata), 'utf8')
  if (metaBytes > MAX_METADATA_BYTES) {
    return NextResponse.json({ error: 'metadata_too_large' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req.headers.get('user-agent') || null

  // Service role write — activity_logs SELECT is service-role only and
  // INSERT for authenticated users requires (auth.uid()=user_id OR null).
  // We just pin user_id here and trust the session.
  const a = admin()
  const { error } = await a.from('activity_logs').insert({
    user_id: user?.id || null,
    event_type: eventType,
    metadata: metadata as any,
    ip_address: ip,
    user_agent: ua,
  })

  if (error) {
    console.error('[log] insert failed', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
