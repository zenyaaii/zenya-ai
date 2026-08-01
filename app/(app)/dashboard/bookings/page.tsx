import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { bookingAccess } from '@/lib/booking-entitlement'
import BookingsInbox, { type BookingRow, type SiteMap } from '@/components/dashboard/BookingsInbox'

export const dynamic = 'force-dynamic'

/**
 * /dashboard/bookings — the owner's reservations inbox.
 *
 * Bookings are a Pro-plan feature with a one-month free trial; the entitlement
 * state (pro / trial / trial_expired / locked) drives whether we show the
 * "start free month" CTA, a countdown banner, or an upgrade prompt. The list
 * itself is always readable (RLS-scoped to the owner's own themes) so past
 * bookings never disappear.
 */
export default async function BookingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prof } = await supabase
    .from('profiles')
    .select('plan, has_hosting, bookings_trial_started_at')
    .eq('id', user.id)
    .maybeSingle()

  const access = bookingAccess(prof)

  // Owner's sites — for mapping a booking to a readable site name.
  const { data: themes } = await supabase
    .from('themes')
    .select('id, product_name, slug')
    .eq('user_id', user.id)

  const sites: SiteMap = {}
  for (const t of themes || []) {
    sites[t.id] = t.product_name || t.slug || 'موقع بلا اسم'
  }

  // RLS scopes this to the owner's themes automatically.
  const { data: bookingsRaw } = await supabase
    .from('site_bookings')
    .select(
      'id, theme_id, booking_type, name, phone, email, message, party_size, preferred_date, preferred_time, status, source_path, country, created_at',
    )
    .eq('is_bot', false)
    .order('created_at', { ascending: false })
    .limit(500)

  const bookings = (bookingsRaw || []) as BookingRow[]

  return (
    <BookingsInbox
      access={access}
      bookings={bookings}
      sites={sites}
      hasSites={(themes || []).length > 0}
    />
  )
}
