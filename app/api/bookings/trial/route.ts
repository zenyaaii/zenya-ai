import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import { bookingAccess } from '@/lib/booking-entitlement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/trial — start the owner's one-month free trial of the
 * bookings feature.
 *
 * Written with the service role and only when the clock hasn't started yet
 * (`bookings_trial_started_at IS NULL`), so a replayed request can never reset
 * or extend the trial. We deliberately don't use the authed client for this:
 * the profiles UPDATE policy is column-unrestricted, and the trial clock must
 * be server-authoritative.
 */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const admin = analyticsAdmin()

  // Set the clock only if it's still null. Returns the row so we can report the
  // resulting access; if it was already set, this updates nothing and we read
  // the existing value below.
  await admin
    .from('profiles')
    .update({ bookings_trial_started_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('bookings_trial_started_at', null)

  const { data: prof } = await admin
    .from('profiles')
    .select('plan, has_hosting, bookings_trial_started_at')
    .eq('id', user.id)
    .maybeSingle()

  const access = bookingAccess(prof)
  return NextResponse.json({ ok: true, access })
}
