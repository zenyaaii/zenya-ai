/**
 * Step 1 of the restaurant build: collect what the place says about itself.
 *
 *  - Google: our own Places API (details, up to 10 photos, up to 5 reviews,
 *    and the place's attributes: breakfast, outdoor seating, live music…).
 *  - Instagram / Facebook: through Apify, only when the lead carries a link
 *    and APIFY_TOKEN is set. Bio, captions and post photos tell us how the
 *    place talks and what it looks like. A failed or missing account is not
 *    an error: the build carries on with Google alone.
 *
 * Nothing here judges anything. It only fetches, with short timeouts, so one
 * slow source never sinks the build.
 */

import { apifyOutage, googleOutage, missingKey, noteDown, noteUp, OutageError } from '@/lib/service-health'

export type RawPhoto = {
  id: string                 // g0…g9, i0…, f0…
  src: 'google' | 'instagram' | 'facebook'
  url: string                // where it was fetched from (never stored on a site)
  buf: Buffer
  author?: string            // Google: the contributor's name (attribution)
  caption?: string           // Instagram: the post's caption
  logoHint?: boolean         // Facebook/Instagram profile picture
}

export type GReview = { stars: number; text: string; who: string; when: string }
export type GPeriod = { open?: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } }

export type Place = {
  type?: string
  summary?: string
  hoursText: string[]
  periods: GPeriod[]
  reviews: GReview[]
  /** Yes/no facts Google holds about the place, already in Arabic. */
  attributes: string[]
  photoRefs: { name: string; author?: string }[]
  /** Only when asked for ({ contact: true }): Google bills these fields at a higher tier. */
  contact?: { phone?: string; address?: string; city?: string; area?: string }
}

export type Social = {
  instagram?: { handle: string; bio: string; name?: string; captions: string[]; followers?: number; site?: string }
  facebook?: { url: string; title?: string; intro?: string; categories?: string[]; info?: string[]; email?: string; phone?: string }
}

const placesKey = () => process.env.GOOGLE_PLACES_API_KEY || process.env.google_places_api_key || ''
const apifyToken = () => process.env.APIFY_TOKEN || process.env.apify_token || ''

async function timed<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined
  const out = await Promise.race([p.catch(() => fallback), new Promise<T>((r) => { t = setTimeout(() => r(fallback), ms) })])
  clearTimeout(t)
  return out
}

const ATTR: [string, string][] = [
  ['servesBreakfast', 'يقدّم الفطور'], ['servesLunch', 'يقدّم الغداء'], ['servesDinner', 'يقدّم العشاء'],
  ['servesCoffee', 'يقدّم القهوة'], ['servesDessert', 'يقدّم الحلويات'], ['servesVegetarianFood', 'فيه أطباق نباتية'],
  ['outdoorSeating', 'فيه جلسات خارجية'], ['liveMusic', 'فيه موسيقى حيّة'], ['goodForChildren', 'مناسب للأطفال'],
  ['menuForChildren', 'فيه قائمة للأطفال'], ['goodForGroups', 'مناسب للمجموعات'], ['reservable', 'يقبل الحجز'],
  ['delivery', 'فيه توصيل'], ['takeout', 'فيه طلبات خارجية (تيك أواي)'], ['dineIn', 'فيه جلوس داخل المطعم'],
]

export async function placeOf(placeId: string, opts: { contact?: boolean } = {}): Promise<Place> {
  const key = placesKey()
  if (!key) { const o = missingKey('google'); await noteDown(o); throw new OutageError(o) }
  const mask = ['reviews', 'regularOpeningHours', 'primaryTypeDisplayName', 'editorialSummary', 'photos', ...ATTR.map(([k]) => k),
    ...(opts.contact ? ['internationalPhoneNumber', 'shortFormattedAddress', 'addressComponents'] : [])].join(',')
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ar`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': mask }, cache: 'no-store',
  })
  const d: any = await r.json().catch(() => ({}))
  if (!r.ok) {
    const o = googleOutage(r.status, String(d?.error?.message || d?.error?.status || ''))
    if (o) { await noteDown(o); throw new OutageError(o) }
    throw new Error(d?.error?.message || `Google ${r.status}`)
  }
  void noteUp('google')
  return {
    type: d.primaryTypeDisplayName?.text,
    summary: d.editorialSummary?.text,
    hoursText: d.regularOpeningHours?.weekdayDescriptions ?? [],
    periods: d.regularOpeningHours?.periods ?? [],
    reviews: (d.reviews ?? []).map((x: any) => ({
      stars: x.rating, text: (x.text?.text ?? x.originalText?.text ?? '').trim(),
      who: x.authorAttribution?.displayName ?? '', when: x.relativePublishTimeDescription ?? '',
    })),
    attributes: ATTR.filter(([k]) => d[k] === true).map(([, ar]) => ar),
    photoRefs: (d.photos ?? []).slice(0, 10).map((p: any) => ({ name: p.name, author: p.authorAttributions?.[0]?.displayName })),
    contact: opts.contact ? contactOf(d) : undefined,
  }
}

/** The phone, the short address, and the city and district from Google's address parts. */
function contactOf(d: any): NonNullable<Place['contact']> {
  const parts: { longText?: string; types?: string[] }[] = d.addressComponents ?? []
  const of = (...types: string[]) => parts.find((c) => types.some((t) => c.types?.includes(t)))?.longText
  return {
    phone: d.internationalPhoneNumber || undefined,
    address: d.shortFormattedAddress || undefined,
    city: of('locality', 'postal_town', 'administrative_area_level_2') || undefined,
    area: of('sublocality_level_1', 'sublocality', 'neighborhood') || undefined,
  }
}

async function fetchImage(url: string, headers?: Record<string, string>): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { headers, cache: 'no-store', redirect: 'follow' })
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const b = Buffer.from(await r.arrayBuffer())
    return b.length > 2000 ? b : null
  } catch { return null }
}

export async function googlePhotos(place: Place): Promise<RawPhoto[]> {
  const key = placesKey()
  const got = await Promise.all(place.photoRefs.map(async (p, i) => {
    const url = `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&maxHeightPx=1600`
    const buf = await timed(fetchImage(url, { 'X-Goog-Api-Key': key }), 15000, null)
    return buf ? { id: `g${i}`, src: 'google' as const, url, buf, author: p.author } : null
  }))
  return got.filter(Boolean) as RawPhoto[]
}

// ── social (Apify) ────────────────────────────────────────────────────────
export async function apify(actor: string, input: unknown, ms: number): Promise<any[]> {
  const token = apifyToken()
  if (!token) { await noteDown(missingKey('apify')); return [] }
  const run = fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=${Math.floor(ms / 1000)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input), cache: 'no-store',
  }).then(async (r) => {
    if (r.ok) { void noteUp('apify'); return r.json() }
    // No credit or a bad token: say so on the dashboard. The build goes on without social data.
    const o = apifyOutage(r.status, await r.text().catch(() => ''))
    if (o) await noteDown(o)
    return []
  }).then((x) => (Array.isArray(x) ? x : []))
  return timed(run, ms + 5000, [])
}

/** Handles as people type them are often a little off (mamai__restaurant for mamai_restaurant). */
export function instagramHandles(link: string): string[] {
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(link || '')
  if (!m) return []
  const h = m[1].replace(/\/$/, '').toLowerCase()
  if (['p', 'reel', 'stories', 'explore'].includes(h)) return []
  return Array.from(new Set([h, h.replace(/_{2,}/g, '_'), h.replace(/\.{2,}/g, '.'), h.replace(/[._]+$/, '')]))
}

export async function instagramOf(link: string): Promise<{ data?: Social['instagram']; photos: RawPhoto[] }> {
  for (const h of instagramHandles(link).slice(0, 3)) {
    const [d] = await apify('apify~instagram-scraper', { directUrls: [`https://www.instagram.com/${h}/`], resultsType: 'details', resultsLimit: 1 }, 45000)
    if (!d || d.error || !d.username) continue
    const posts: any[] = (d.latestPosts ?? []).slice(0, 12)
    const photos = (await Promise.all([
      d.profilePicUrlHD || d.profilePicUrl ? fetchImage(d.profilePicUrlHD || d.profilePicUrl).then((buf) => buf ? { id: 'i0', src: 'instagram' as const, url: d.profilePicUrlHD || d.profilePicUrl, buf, logoHint: true } : null) : null,
      ...posts.map((p, i) => p.displayUrl
        ? timed(fetchImage(p.displayUrl), 12000, null).then((buf) => buf ? { id: `i${i + 1}`, src: 'instagram' as const, url: p.displayUrl, buf, caption: String(p.caption || '').slice(0, 300) } : null)
        : null),
    ])).filter(Boolean) as RawPhoto[]
    return {
      data: {
        handle: d.username, bio: String(d.biography || ''), name: d.fullName || undefined, followers: d.followersCount,
        site: d.externalUrl || undefined,
        captions: posts.map((p) => String(p.caption || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 12),
      },
      photos,
    }
  }
  return { photos: [] }
}

export async function facebookOf(link: string): Promise<{ data?: Social['facebook']; photos: RawPhoto[] }> {
  if (!/facebook\.com|fb\.com/i.test(link || '')) return { photos: [] }
  const [d] = await apify('apify~facebook-pages-scraper', { startUrls: [{ url: link }] }, 45000)
  if (!d || d.error || !(d.title || d.pageName)) return { photos: [] }
  const photos = (await Promise.all([
    d.profilePictureUrl ? fetchImage(d.profilePictureUrl).then((buf) => buf ? { id: 'f0', src: 'facebook' as const, url: d.profilePictureUrl, buf, logoHint: true } : null) : null,
    d.coverPhotoUrl ? fetchImage(d.coverPhotoUrl).then((buf) => buf ? { id: 'f1', src: 'facebook' as const, url: d.coverPhotoUrl, buf } : null) : null,
  ])).filter(Boolean) as RawPhoto[]
  return {
    data: {
      url: link, title: d.title || d.pageName, intro: d.intro || d.about_me?.text || undefined,
      categories: Array.isArray(d.categories) ? d.categories.slice(0, 4) : undefined,
      info: Array.isArray(d.info) ? d.info.slice(0, 8).map(String) : undefined,
      email: typeof d.email === 'string' ? d.email : undefined, phone: typeof d.phone === 'string' ? d.phone : undefined,
    },
    photos,
  }
}
