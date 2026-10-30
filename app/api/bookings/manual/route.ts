import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyticsAdmin } from '@/lib/analytics-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/manual — the owner files a booking that came by phone
 * or at the door («حجز جديد» on the bookings page), so it sits with the ones
 * the site's form sent. It is born confirmed: the owner took it.
 *
 * DELETE /api/bookings/manual?id= — takes one back, for the toast's
 * «تراجع». Only a booking filed here can be deleted this way; a visitor's
 * request is cancelled, never deleted.
 *
 * Ownership is checked through the authed client (RLS on themes); the write
 * uses the service role, like the public form, because owners have no insert
 * policy on site_bookings.
 */
const SOURCE = 'dashboard:manual'

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 }) }

  const themeId = str(body.theme_id, 64)
  const name = str(body.name, 120)
  if (!themeId || !name) return NextResponse.json({ ok: false, error: 'name_required' }, { status: 422 })

  const { data: theme } = await supabase
    .from('themes').select('id, template_type, user_id').eq('id', themeId).eq('user_id', user.id).maybeSingle()
  if (!theme) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null
  const n = Number(body.party_size)
  const row = {
    theme_id: theme.id,
    booking_type: theme.template_type === 'restaurant' ? 'reservation' : 'appointment',
    name,
    phone: str(body.phone, 40),
    message: str(body.message, 2000),
    party_size: Number.isInteger(n) && n >= 1 && n <= 100 ? n : null,
    preferred_date: date,
    preferred_time: str(body.time, 40),
    status: 'confirmed',
    source_path: SOURCE,
    is_bot: false,
  }

  const { data, error } = await analyticsAdmin()
    .from('site_bookings').insert(row)
    .select('id, theme_id, booking_type, name, phone, email, message, party_size, preferred_date, preferred_time, status, created_at')
    .single()
  if (error || !data) return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  return NextResponse.json({ ok: true, booking: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 })

  // RLS lets the owner read their own bookings; the source mark keeps a
  // visitor's request out of reach.
  const { data: own } = await supabase
    .from('site_bookings').select('id').eq('id', id).eq('source_path', SOURCE).maybeSingle()
  if (!own) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  const { error } = await analyticsAdmin().from('site_bookings').delete().eq('id', id).eq('source_path', SOURCE)
  if (error) return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
