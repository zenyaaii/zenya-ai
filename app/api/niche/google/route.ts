import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/utils/supabase/server'
import { serviceClient } from '@/lib/handover'
import { googleUrl, lookupGoogleReviews, LookupError } from '@/lib/google-reviews'
import { placeOf, googlePhotos } from '@/lib/restaurant-build/sources'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

/**
 * Everything Google holds about the owner's place, for a niche wizard (the
 * barber's first, then every kind that has one): rating, count, the five
 * reviews, the weekly hours and the place's photos.
 *
 * The owner pastes their Google Maps link in step 1 (it is required). The
 * wizard then shows the reviews, fills the hours if the owner has not, and
 * offers the photos for the owner to keep or hide: the owner chooses, no
 * model is called. Photos are copied to our storage so a site never points
 * at Google.
 *
 * Signed-in only and throttled: each call costs Places API money.
 */

const MAX_PER_HOUR = 10
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

  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.google_places_api_key
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  let body: { url?: unknown; name?: unknown; city?: unknown; photos?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const link = typeof body.url === 'string' ? googleUrl(body.url) : null
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 80) : ''
  if (!link) return NextResponse.json({ error: 'not_google_link' }, { status: 400 })
  if (throttled(user.id)) return NextResponse.json({ error: 'too_many' }, { status: 429 })

  try {
    const found = await lookupGoogleReviews(key, { link, name, city })
    const place = await placeOf(found.place.id).catch(() => null)
    let photos: string[] = []
    if (place && body.photos !== false) {
      const raw = await googlePhotos({ ...place, photoRefs: place.photoRefs.slice(0, 10) }).catch(() => [])
      const sb = serviceClient().storage.from('theme-uploads')
      const dir = `owners/${user.id}/google/${found.place.id.replace(/[^A-Za-z0-9_-]/g, '')}`
      const up = await Promise.all(raw.map(async (r) => {
        try {
          const jpeg = await sharp(r.buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
          const meta = await sharp(jpeg).metadata()
          if ((meta.width || 0) < 500 || (meta.height || 0) < 400) return null
          const path = `${dir}/${r.id}.jpg`
          const { error } = await sb.upload(path, jpeg, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' })
          if (error) return null
          return sb.getPublicUrl(path).data.publicUrl
        } catch { return null }
      }))
      photos = up.filter((u): u is string => !!u)
    }
    return NextResponse.json({
      place_id: found.place.id,
      name: found.place.name,
      maps_url: found.place.url,
      rating: found.place.rating,
      count: found.place.count,
      reviews: found.reviews,
      periods: place?.periods || [],
      photos,
    })
  } catch (e) {
    if (e instanceof LookupError) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    console.error('[niche/google]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 502 })
  }
}
