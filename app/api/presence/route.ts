import { NextRequest, NextResponse } from 'next/server'
import { analyticsAdmin, clientIpFrom, visitorHash, withinBurstLimit } from '@/lib/analytics-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/presence — first-party "I'm here" heartbeat.
 *
 * The live-users globe needs to reflect ANYONE currently on a Zenya surface —
 * the marketing site, the dashboard, a customer's own site — not just visitors
 * to generated customer sites (which is all /api/insight + site_views covers).
 * So every Zenya-owned page pings this a few times a minute; we record one row
 * per anonymous visitor at COUNTRY level and nothing else.
 *
 * Privacy: visitor_key is a daily IP+UA hash (same scheme as analytics), the
 * only stored fields are country + surface + last_seen, and nothing here is ever
 * exposed except as country counts via /api/live-users. Always returns 204.
 */
export async function POST(req: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 })
  try {
    const ip = clientIpFrom(req.headers)
    if (!withinBurstLimit(`presence:${ip || 'unknown'}`)) return noContent

    let surface = 'web'
    try {
      const raw = await req.text()
      if (raw && raw.length < 200) {
        const s = JSON.parse(raw)?.s
        if (typeof s === 'string') surface = s.slice(0, 24)
      }
    } catch { /* body is optional */ }

    const userAgent = req.headers.get('user-agent')
    const country = req.headers.get('x-vercel-ip-country') || null
    const visitor_key = visitorHash({ ip, userAgent, themeId: 'presence' })

    const a = analyticsAdmin()
    await a
      .from('live_presence')
      .upsert(
        { visitor_key, country, surface, last_seen: new Date().toISOString() },
        { onConflict: 'visitor_key' },
      )

    // Opportunistic cleanup so the table stays ~= recently-seen visitors.
    if (Math.random() < 0.02) {
      await a.from('live_presence').delete().lt('last_seen', new Date(Date.now() - 24 * 3600_000).toISOString())
    }

    return noContent
  } catch {
    return noContent
  }
}
