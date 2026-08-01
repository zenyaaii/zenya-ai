import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PATCH /api/bookings/:id — the owner moves a booking through its lifecycle
 * (new → confirmed / cancelled / done).
 *
 * Runs through the AUTHED client, so RLS (site_bookings_owner_update) is what
 * enforces that the caller owns the theme this booking belongs to — there is
 * no ownership check here beyond that on purpose. Managing existing bookings is
 * allowed even after a trial ends; the gate only stops NEW captures.
 */
const STATUSES = new Set(['new', 'confirmed', 'cancelled', 'done'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 })
  }

  let body: { status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const status = String(body.status)
  if (!STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: 'bad_status' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('site_bookings')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .maybeSingle()

  // RLS makes a non-owned row invisible → no row updated.
  if (error) return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  if (!data) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  return NextResponse.json({ ok: true, booking: data })
}
