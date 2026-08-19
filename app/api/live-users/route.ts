import { NextRequest, NextResponse } from 'next/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import { COUNTRY_CENTROIDS } from '@/lib/country-centroids'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/live-users — public, anonymous.
 *
 * Powers the live-users globe on the marketing homepage. Reflects EVERYONE who
 * is currently online on a Zenya surface, from two real sources:
 *   - live_presence : heartbeat from the marketing site + dashboard (/api/presence)
 *   - site_views    : visitors on generated customer sites (/api/insight)
 *
 * Returns { active_now, window_min, countries: [{ code, count, lat, lng, ar }] }
 * at COUNTRY level only — counts and ISO codes, no names, paths, or identifiers.
 * `active_now` counts every distinct person online (even where we can't map their
 * country to a point), so the headline is honest; `countries` holds only the ones
 * we can actually place on the sphere. No live people → an honest empty globe.
 */
const LIVE_WINDOW_MIN = 5
const ROW_CAP = 20000

export async function GET(req: NextRequest) {
  const windowMin = clampInt(req.nextUrl.searchParams.get('window'), 1, 60) ?? LIVE_WINDOW_MIN

  try {
    const a = analyticsAdmin()
    const now = Date.now()
    const sinceIso = new Date(now - windowMin * 60_000).toISOString()

    const [presence, views] = await Promise.all([
      a.from('live_presence').select('visitor_key, country').gte('last_seen', sinceIso).limit(ROW_CAP),
      a.from('site_views').select('country, session_id, visitor_hash')
        .gte('created_at', sinceIso).eq('is_bot', false).limit(ROW_CAP),
    ])

    const perCountry = new Map<string, Set<string>>()
    const everyone = new Set<string>()

    const add = (key: string, rawCountry: string | null) => {
      everyone.add(key)
      const code = String(rawCountry || '').toUpperCase()
      if (!COUNTRY_CENTROIDS[code]) return // counts toward active_now, but not placeable
      if (!perCountry.has(code)) perCountry.set(code, new Set())
      perCountry.get(code)!.add(key)
    }

    for (const r of presence.data || []) add(`p:${r.visitor_key}`, r.country)
    for (const r of views.data || []) add(`v:${r.session_id || r.visitor_hash}`, r.country)

    const countries = [...perCountry.entries()]
      .map(([code, sessions]) => {
        const c = COUNTRY_CENTROIDS[code]
        return { code, count: sessions.size, lat: c.lat, lng: c.lng, ar: c.ar }
      })
      .sort((x, y) => y.count - x.count)

    return NextResponse.json(
      {
        generated_at: new Date(now).toISOString(),
        active_now: everyone.size,
        window_min: windowMin,
        countries,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' } },
    )
  } catch {
    return NextResponse.json(
      { generated_at: new Date().toISOString(), active_now: 0, window_min: windowMin, countries: [] },
      { headers: { 'Cache-Control': 'public, s-maxage=10' } },
    )
  }
}

function clampInt(v: string | null, min: number, max: number): number | null {
  if (v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(min, Math.min(max, Math.round(n)))
}
