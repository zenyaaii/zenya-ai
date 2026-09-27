/**
 * Google Places lookup for a business's rating and reviews.
 *
 * Shared by /api/reviews/google (the owner presses fetch) and the daily
 * check at /api/cron/reviews. Needs GOOGLE_PLACES_API_KEY; every call costs
 * money, so callers keep them few. Google exposes at most five reviews.
 */

const PLACES = 'https://places.googleapis.com/v1'
const GOOGLE_HOSTS = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|g\.co)$/i
export function googleUrl(raw: string): URL | null {
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
    publishTime?: string
    authorAttribution?: { displayName?: string }
  }[]
}

export type GoogleLookup = {
  place: { id: string; name: string; rating: number | null; count: number | null; url: string }
  reviews: { name: string; rating: number; text: string; when: string; at?: string }[]
}

/** Thrown with a code the route maps to a status: not_found. Anything else is a failed lookup. */
export class LookupError extends Error {}

/**
 * Find the place (by its id when we have one, else from the link or the
 * business name) and read its rating and reviews.
 */
export async function lookupGoogleReviews(
  key: string,
  q: { placeId?: string; link?: URL | null; name?: string; city?: string },
): Promise<GoogleLookup> {
  let placeId = q.placeId
  if (!placeId) {
    let target: Target = {}
    if (q.link) target = readTarget(await expand(q.link))
    if (!target.placeId && !target.query && q.name) target.query = [q.name, q.city].filter(Boolean).join(' ')
    if (!target.placeId && !target.query) throw new LookupError('not_found')
    placeId = target.placeId
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
  }
  if (!placeId) throw new LookupError('not_found')

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
      at: r.publishTime || undefined,
    }))
    .filter((r) => r.name && r.text)

  return {
    place: {
      id: placeId,
      name: d.displayName?.text || '',
      rating: typeof d.rating === 'number' ? d.rating : null,
      count: typeof d.userRatingCount === 'number' ? d.userRatingCount : null,
      url: d.googleMapsUri || q.link?.toString() || '',
    },
    reviews,
  }
}
