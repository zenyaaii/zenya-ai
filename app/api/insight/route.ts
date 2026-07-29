import { NextRequest, NextResponse } from 'next/server'
import {
  analyticsAdmin, clientIpFrom, resolveThemeBySlug, visitorHash, withinBurstLimit,
} from '@/lib/analytics-server'
import {
  browserFromUA, classifyChannel, deviceFromUA, isBotUA, isEventType,
  normalizePath, osFromUA, referrerHost,
} from '@/lib/analytics-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/insight — the ingest endpoint for the customer-site beacon.
 *
 * Deliberately NOT named /api/track or /api/analytics/collect: those exact
 * paths are on public ad-blocker filter lists, and a blocked beacon silently
 * undercounts the owner's traffic. This is first-party, same-origin, and
 * privacy-preserving, so there is nothing to block — but the name shouldn't
 * trip a regex either.
 *
 * Three payload kinds, all sent via navigator.sendBeacon:
 *   pv  — a pageview (enriches the row the server render already wrote)
 *   ev  — a conversion action (WhatsApp tap, phone tap, booking…)
 *   end — tab hidden: engaged time + scroll depth for the current page
 *
 * Always returns 204. A visitor's browser must never see an error from
 * analytics, and an attacker must not be able to probe which slugs exist.
 */
export async function POST(req: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 })

  try {
    const h = req.headers
    const ip = clientIpFrom(h)
    if (!withinBurstLimit(ip || 'unknown')) return noContent

    // sendBeacon sends a Blob; depending on the browser the Content-Type may
    // be text/plain rather than application/json, so parse the text directly.
    const raw = await req.text()
    if (!raw || raw.length > 4000) return noContent

    let body: any
    try {
      body = JSON.parse(raw)
    } catch {
      return noContent
    }

    const kind = body.k
    if (kind !== 'pv' && kind !== 'ev' && kind !== 'end') return noContent

    const sessionId = typeof body.i === 'string' ? body.i.slice(0, 40) : null
    const path = normalizePath(typeof body.p === 'string' ? body.p : '/')

    // ---- 'end': just close out the existing row ---------------------------
    if (kind === 'end') {
      if (!sessionId) return noContent
      const engaged = clampInt(body.ms, 0, 4 * 3600_000)
      const scroll = clampInt(body.sc, 0, 100)
      if (engaged == null && scroll == null) return noContent
      const a = analyticsAdmin()
      await a.rpc('analytics_finalize_view', {
        p_session_id: sessionId,
        p_path: path,
        p_engaged_ms: engaged ?? 0,
        p_scroll_pct: scroll ?? 0,
      })
      return noContent
    }

    const slug = typeof body.s === 'string' ? body.s.slice(0, 120) : ''
    if (!slug) return noContent

    const theme = await resolveThemeBySlug(slug)
    if (!theme) return noContent

    const userAgent = h.get('user-agent')
    const country = h.get('x-vercel-ip-country') || null
    const bot = isBotUA(userAgent)
    const vhash = visitorHash({ ip, userAgent, themeId: theme.id })

    // ---- 'ev': a conversion action ---------------------------------------
    if (kind === 'ev') {
      if (!isEventType(body.e)) return noContent
      const a = analyticsAdmin()
      await a.from('site_events').insert({
        theme_id: theme.id,
        session_id: sessionId,
        visitor_hash: vhash,
        event_type: body.e,
        label: typeof body.l === 'string' ? body.l.slice(0, 200) : null,
        path,
        country,
        device: deviceFromUA(userAgent),
        is_bot: bot,
      })
      return noContent
    }

    // ---- 'pv': a pageview -------------------------------------------------
    const referrer = typeof body.r === 'string' && body.r ? body.r.slice(0, 500) : null
    const rHost = referrerHost(referrer)
    const utm = body.q || {}
    const utmSource = str(utm.s, 100)
    const utmMedium = str(utm.m, 100)
    const utmCampaign = str(utm.c, 100)

    const channel = classifyChannel({
      referrerHost: rHost,
      utmMedium,
      utmSource,
      // A click from the site's own /menu to /about is navigation, not a
      // referral — the host header tells us what "our own site" means here.
      selfHost: h.get('host'),
    })

    const a = analyticsAdmin()
    await a.rpc('analytics_ingest_view', {
      p_theme_id: theme.id,
      p_slug: slug,
      p_path: path,
      p_visitor_hash: vhash,
      p_session_id: sessionId,
      p_country: country,
      p_referrer: referrer,
      p_referrer_host: rHost,
      p_channel: channel,
      p_utm_source: utmSource,
      p_utm_medium: utmMedium,
      p_utm_campaign: utmCampaign,
      p_device: deviceFromUA(userAgent),
      p_browser: browserFromUA(userAgent),
      p_os: osFromUA(userAgent),
      p_user_agent: userAgent,
      p_is_bot: bot,
    })

    return noContent
  } catch {
    // Analytics must never surface an error to a customer's visitor.
    return noContent
  }
}

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  if (!isFinite(n)) return null
  return Math.max(min, Math.min(max, Math.round(n)))
}
