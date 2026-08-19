import { NextRequest, NextResponse } from 'next/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import { COUNTRY_CENTROIDS } from '@/lib/country-centroids'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/live-users — public, anonymous.
 *
 * Powers the live-users globe on the marketing homepage. Aggregates real
 * visitor activity across ALL sites built with Zenya and returns it at
 * COUNTRY level only:
 *
 *   { active_now, window_min, countries: [{ code, count, lat, lng, ar }] }
 *
 * Privacy: this endpoint returns counts and country codes and nothing else —
 * no site names, no paths, no visitor identifiers, no city. A country lights up
 * on the globe only because it has real recent visitors; nobody is locatable.
 * There is no fabricated activity — an empty platform returns an empty globe.
 */
const LIVE_WINDOW_MIN = 5        // headline "live now" count
const DOT_WINDOW_MIN = 24 * 60   // a country shows a dot if it had real visitors in this window
const ROW_CAP = 10000            // bound the scan; aggregation is approximate above this

export async function GET(req: NextRequest) {
  const dotWindow = clampInt(req.nextUrl.searchParams.get('window'), LIVE_WINDOW_MIN, 7 * 24 * 60) ?? DOT_WINDOW_MIN

  try {
    const a = analyticsAdmin()
    const now = Date.now()
    const dotSince = new Date(now - dotWindow * 60_000).toISOString()
    const liveSince = now - LIVE_WINDOW_MIN * 60_000

    const { data: rows, error } = await a
      .from('site_views')
      .select('country, session_id, visitor_hash, created_at')
      .gte('created_at', dotSince)
      .eq('is_bot', false)
      .not('country', 'is', null)
      .order('created_at', { ascending: false })
      .limit(ROW_CAP)

    if (error) throw error

    // Distinct people, not hits — one visitor refreshing is one session.
    const perCountry = new Map<string, Set<string>>()
    const liveSessions = new Set<string>()

    for (const r of rows || []) {
      const code = String(r.country || '').toUpperCase()
      if (!COUNTRY_CENTROIDS[code]) continue // only places we can put on the sphere
      const key = r.session_id || r.visitor_hash || `${code}:${r.created_at}`
      if (!perCountry.has(code)) perCountry.set(code, new Set())
      perCountry.get(code)!.add(key)
      if (new Date(r.created_at).getTime() >= liveSince) liveSessions.add(key)
    }

    const countries = [...perCountry.entries()]
      .map(([code, sessions]) => {
        const c = COUNTRY_CENTROIDS[code]
        return { code, count: sessions.size, lat: c.lat, lng: c.lng, ar: c.ar }
      })
      .sort((x, y) => y.count - x.count)

    return NextResponse.json(
      {
        generated_at: new Date(now).toISOString(),
        active_now: liveSessions.size,
        window_min: dotWindow,
        countries,
      },
      // Small shared cache: the globe is social proof, not a live console.
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
    )
  } catch {
    // Never surface an analytics error to the marketing page — return an honest
    // empty globe instead of a 500.
    return NextResponse.json(
      { generated_at: new Date().toISOString(), active_now: 0, window_min: dotWindow, countries: [] },
      { headers: { 'Cache-Control': 'public, s-maxage=15' } },
    )
  }
}

function clampInt(v: string | null, min: number, max: number): number | null {
  if (v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(min, Math.min(max, Math.round(n)))
}
