import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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

const PLACES = 'https://places.googleapis.com/v1'
const GOOGLE_HOSTS = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|g\.co)$/i
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

function googleUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return GOOGLE_HOSTS.test(u.hostname) ? u : null
  } catch {
    return null
  }
}

/** Short share links redirect to the full maps URL. Follow them, but only
 *  while the hops stay on Google. */
async function expand(u: URL): Promise<URL> {
  let current = u
  for (let i = 0; i < 5; i++) {
    if (!/^(maps\.app\.goo\.gl|goo\.gl|g\.page|g\.co)$/i.test(current.hostname)) return current
    const res = await fetch(current.toString(), { redirect: 'manual', signal: AbortSignal.timeout(6000) })
    const loc = res.headers.get('location')
    if (!loc) return current
    const next = googleUrl(new URL(loc, current).toString())
    if (!next) return current
    current = next
  }
  return current
}

type Target = { placeId?: string; query?: string; lat?: number; lng?: number }

function readTarget(u: URL): Target {
  const pid = u.searchParams.get('query_place_id') || u.searchParams.get('place_id')
  if (pid) return { placeId: pid }
  const t: Target = {}
  const place = u.pathname.match(/\/maps\/place\/([^/]+)/)
  if (place) t.query = decodeURIComponent(place[1].replace(/\+/g, ' '))
  const at = u.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (at) { t.lat = Number(at[1]); t.lng = Number(at[2]) }
  if (!t.query) t.query = u.searchParams.get('q') || u.searchParams.get('query') || undefined
  return t
}

async function places<T>(key: string, path: string, init: RequestInit & { fields: string }): Promise<T> {
  const { fields, ...rest } = init
  const res = await fetch(`${PLACES}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`places_${res.status}`)
  return res.json() as Promise<T>
}

type PlaceDetails = {
  displayName?: { text?: string }
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: {
    rating?: number
    text?: { text?: string }
    originalText?: { text?: string }
    relativePublishTimeDescription?: string
    authorAttribution?: { displayName?: string }
  }[]
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
    let target: Target = {}
    if (link) target = readTarget(await expand(link))
    if (!target.placeId && !target.query && name) target.query = [name, city].filter(Boolean).join(' ')
    if (!target.placeId && !target.query) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    let placeId = target.placeId
    if (!placeId) {
      const search = await places<{ places?: { id: string }[] }>(key, '/places:searchText', {
        method: 'POST',
        fields: 'places.id',
        body: JSON.stringify({
          textQuery: target.query,
          languageCode: 'ar',
          maxResultCount: 1,
          ...(target.lat != null && target.lng != null
            ? { locationBias: { circle: { center: { latitude: target.lat, longitude: target.lng }, radius: 1000 } } }
            : {}),
        }),
      })
      placeId = search.places?.[0]?.id
    }
    if (!placeId) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const d = await places<PlaceDetails>(key, `/places/${encodeURIComponent(placeId)}?languageCode=ar`, {
      method: 'GET',
      fields: 'displayName,rating,userRatingCount,googleMapsUri,reviews',
    })

    const reviews = (d.reviews || [])
      .map((r) => ({
        name: (r.authorAttribution?.displayName || '').trim(),
        rating: Math.max(1, Math.min(5, Math.round(r.rating || 5))),
        text: (r.originalText?.text || r.text?.text || '').trim(),
        when: r.relativePublishTimeDescription || '',
      }))
      .filter((r) => r.name && r.text)

    return NextResponse.json({
      place: {
        name: d.displayName?.text || '',
        rating: typeof d.rating === 'number' ? d.rating : null,
        count: typeof d.userRatingCount === 'number' ? d.userRatingCount : null,
        url: d.googleMapsUri || link?.toString() || '',
      },
      reviews,
    })
  } catch (e) {
    console.error('[reviews/google]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 502 })
  }
}
