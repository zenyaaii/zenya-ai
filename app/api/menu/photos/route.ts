import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { googleMenuPhotos } from '@/lib/restaurant-build/sources'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

/**
 * POST /api/menu/photos { place_id } → { photos: string[] }
 *
 * Every photo in the «Menu» tab of the place on Google Maps (the Places API
 * stops at 10 photos and has no menu tab). No AI: one Apify run. The wizard
 * then hands these to /api/menu/find, which reads them all.
 *
 * Signed in, or the public try page with `demo: true` (it only lists photos,
 * so it is safe to show; throttled harder by address).
 */

const MAX_PER_HOUR = 10
const DEMO_PER_HOUR = 3
const hits = new Map<string, number[]>()
function throttled(who: string, max: number): boolean {
  const now = Date.now()
  const recent = (hits.get(who) || []).filter((t) => now - t < 3_600_000)
  if (recent.length >= max) { hits.set(who, recent); return true }
  recent.push(now); hits.set(who, recent)
  return false
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { data: { user } } = await createClient().auth.getUser().catch(() => ({ data: { user: null } }))
  const demo = !user && body?.demo === true
  if (!user && !demo) return NextResponse.json({ error: 'sign_in' }, { status: 401 })
  const placeId = typeof body?.place_id === 'string' ? body.place_id.trim() : ''
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(placeId)) return NextResponse.json({ error: 'bad_place' }, { status: 400 })
  if (!(process.env.APIFY_TOKEN || process.env.apify_token)) return NextResponse.json({ photos: [], error: 'not_configured' })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  if (throttled(user ? user.id : 'demo:' + ip, demo ? DEMO_PER_HOUR : MAX_PER_HOUR)) return NextResponse.json({ error: 'too_many' }, { status: 429 })
  try {
    const photos = await googleMenuPhotos(placeId, 40)
    return NextResponse.json({ photos })
  } catch (e) {
    console.error('[menu/photos]', e instanceof Error ? e.message : e)
    return NextResponse.json({ photos: [], error: 'lookup_failed' })
  }
}
