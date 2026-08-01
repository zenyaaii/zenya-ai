import { NextRequest, NextResponse } from 'next/server'
import {
  analyticsAdmin, clientIpFrom, resolveThemeBySlug, visitorHash, withinBurstLimit,
} from '@/lib/analytics-server'
import { isBotUA, normalizePath } from '@/lib/analytics-core'
import { bookingAccess } from '@/lib/booking-entitlement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings — capture a reservation/booking from a published Zenya
 * site's booking form.
 *
 * Rides the same slug → theme → owner pipeline as the analytics beacon
 * (/api/insight). Unlike the beacon this is a real form the visitor is waiting
 * on, so it returns a JSON result instead of a silent 204.
 *
 * Gating: bookings are a Pro-plan feature with a one-month free trial. The
 * owner of the site must be entitled (Pro or in-trial) or the submission is
 * rejected — the public form only renders when they are, this is defense in
 * depth so a stale/replayed request can't write rows the owner can't see.
 *
 * The owner reads these rows at /dashboard/bookings under RLS. This endpoint
 * writes with the service role.
 */

const TYPES = new Set(['reservation', 'appointment', 'quote', 'contact'])

type Body = {
  slug?: unknown
  type?: unknown
  name?: unknown
  phone?: unknown
  email?: unknown
  message?: unknown
  party_size?: unknown
  date?: unknown
  time?: unknown
  path?: unknown
  sid?: unknown
}

export async function POST(req: NextRequest) {
  try {
    const h = req.headers
    const ip = clientIpFrom(h)
    if (!withinBurstLimit(`bk:${ip || 'unknown'}`)) {
      return json({ ok: false, error: 'rate_limited' }, 429)
    }

    const raw = await req.text()
    if (!raw || raw.length > 6000) return json({ ok: false, error: 'bad_request' }, 400)

    let body: Body
    try {
      body = JSON.parse(raw)
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400)
    }

    const slug = str(body.slug, 120)
    if (!slug) return json({ ok: false, error: 'bad_request' }, 400)

    const theme = await resolveThemeBySlug(slug)
    // Never reveal whether a slug exists — same generic "unavailable" either way.
    if (!theme) return json({ ok: false, error: 'unavailable' }, 404)

    const a = analyticsAdmin()

    // ---- owner entitlement -------------------------------------------------
    const { data: t } = await a
      .from('themes')
      .select('user_id')
      .eq('id', theme.id)
      .maybeSingle()
    if (!t?.user_id) return json({ ok: false, error: 'unavailable' }, 404)

    const { data: prof } = await a
      .from('profiles')
      .select('plan, has_hosting, bookings_trial_started_at')
      .eq('id', t.user_id)
      .maybeSingle()

    if (!bookingAccess(prof).entitled) {
      return json({ ok: false, error: 'unavailable' }, 403)
    }

    // ---- validate the submission ------------------------------------------
    const type = TYPES.has(String(body.type)) ? String(body.type) : 'contact'
    const name = str(body.name, 120)
    const phone = str(body.phone, 40)
    const email = emailStr(body.email)
    const message = str(body.message, 2000)

    if (!name) return json({ ok: false, error: 'name_required' }, 422)
    // Need at least one way to reach the person back.
    if (!phone && !email) return json({ ok: false, error: 'contact_required' }, 422)

    const partySize = clampInt(body.party_size, 1, 100)
    const preferredDate = dateStr(body.date)
    const preferredTime = str(body.time, 40)

    const userAgent = h.get('user-agent')
    const bot = isBotUA(userAgent)
    const country = h.get('x-vercel-ip-country') || null
    const sessionId = str(body.sid, 40)
    const path = normalizePath(typeof body.path === 'string' ? body.path : '/')

    const { error: insErr } = await a.from('site_bookings').insert({
      theme_id: theme.id,
      booking_type: type,
      name,
      phone,
      email,
      message,
      party_size: partySize,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      source_path: path,
      session_id: sessionId,
      visitor_hash: visitorHash({ ip, userAgent, themeId: theme.id }),
      country,
      is_bot: bot,
    })

    if (insErr) return json({ ok: false, error: 'server_error' }, 500)

    return json({ ok: true }, 200)
  } catch {
    return json({ ok: false, error: 'server_error' }, 500)
  }
}

function json(payload: Record<string, unknown>, status: number) {
  return NextResponse.json(payload, { status })
}

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

function emailStr(v: unknown): string | null {
  const s = str(v, 200)
  if (!s) return null
  // Cheap sanity check — the owner still sees whatever was typed; this only
  // stops obvious junk from being stored as an email.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null
}

function dateStr(v: unknown): string | null {
  const s = str(v, 10)
  if (!s) return null
  // YYYY-MM-DD only; anything else is dropped rather than trusted.
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  if (!isFinite(n)) return null
  return Math.max(min, Math.min(max, Math.round(n)))
}
