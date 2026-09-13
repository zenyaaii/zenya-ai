/**
 * The owner's email preferences, stored on the auth user's metadata as
 * `notification_prefs` - no table, no migration.
 *
 * What reads each switch:
 *   booking  → app/api/bookings (the "new booking" email to the site owner)
 *   product  → scripts/send-broadcast.ts announcement
 *   offers   → marketing consent. Off by default and no offer mail exists yet;
 *              any offer or discount broadcast added later MUST send only to
 *              owners with offers === true.
 */

export type NotificationPrefs = { booking: boolean; product: boolean; offers: boolean }

export const NOTIFICATION_PREFS: Array<{ key: keyof NotificationPrefs; label: string }> = [
  { key: 'booking', label: 'حجز جديد' },
  { key: 'product', label: 'تحديثات المنتج' },
  { key: 'offers', label: 'عروض وتخفيضات' },
]

/** Booking and product mail default on (they are service mail); offers default off. */
export function readPrefs(raw: unknown): NotificationPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof NotificationPrefs, unknown>>
  return {
    booking: r.booking !== false,
    product: r.product !== false,
    offers: r.offers === true,
  }
}
