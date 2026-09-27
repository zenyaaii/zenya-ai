import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { googleUrl, lookupGoogleReviews, LookupError } from '@/lib/google-reviews'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Pull a business's Google rating and reviews from its Google Maps link.
 *
 * The owner pastes the link they already have (a maps.app.goo.gl share link,
 * a g.page link or a full google.com/maps URL). We resolve it to a place with
 * the Places API (New) and return the rating, the review count and the
 * reviews Google exposes, which is at most five. The wizard shows them to the
 * owner, who picks which ones go on the site and can edit them later.
 *
 * Needs GOOGLE_PLACES_API_KEY. Each call costs money, so it is signed-in only
 * and throttled per user.
 */

const MAX_PER_HOUR = 12

const hits = new Map<string, number[]>()
function throttled(userId: string): boolean {
  const now = Date.now()
  const recent = (hits.get(userId) || []).filter((t) => now - t < 3_600_000)
  if (recent.length >= MAX_PER_HOUR) { hits.set(userId, recent); return true }
  recent.push(now)
  hits.set(userId, recent)
  return false
}

export async function POST(req: NextRequest) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: 'sign_in' }, { status: 401 })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  let body: { url?: unknown; name?: unknown; city?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const link = typeof body.url === 'string' ? googleUrl(body.url) : null
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 80) : ''
  if (!link && !name) return NextResponse.json({ error: 'not_google_link' }, { status: 400 })

  if (throttled(user.id)) return NextResponse.json({ error: 'too_many' }, { status: 429 })

  try {
    return NextResponse.json(await lookupGoogleReviews(key, { link, name, city }))
  } catch (e) {
    if (e instanceof LookupError) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    console.error('[reviews/google]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 502 })
  }
}
