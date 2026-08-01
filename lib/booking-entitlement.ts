/**
 * Bookings entitlement — who can use the reservations/bookings feature.
 *
 * Product rule (set by the founder): bookings, and the email/notification
 * layer that will grow on top of them, are a PRO-PLAN feature. To let people
 * try it, every owner gets a ONE-MONTH free trial the first time they turn it
 * on — after that it's Pro only.
 *
 *   entitled  ==  Pro plan  OR  (trial started AND now < trial start + 30 days)
 *
 * We deliberately key "Pro" off the plan string + has_hosting, NOT the cached
 * `is_pro` boolean: the Stripe webhook sets is_pro=true for Starter ($14.99)
 * too, and this feature is reserved for Pro ($24.99) exactly like the domain
 * perks in lib/domain-entitlement.ts. Starter and free reach the feature only
 * through the trial.
 *
 * Pure + isomorphic: no DB, no secrets. Safe to import on the server (public
 * endpoint, site render) and in client components (dashboard banner).
 */

/** Length of the free trial, in days. */
export const BOOKINGS_TRIAL_DAYS = 30

/** Plans that count as Pro for the bookings feature. Mirrors the Pro set in
 *  lib/domain-entitlement.ts — Starter is intentionally excluded. */
const PRO_PLANS = new Set(['pro', 'pro_hosting', 'pro_onetime', 'admin'])

export type BookingProfile = {
  plan?: string | null
  has_hosting?: boolean | null
  bookings_trial_started_at?: string | null
}

export type BookingAccessStatus = 'pro' | 'trial' | 'trial_expired' | 'locked'

export type BookingAccess = {
  /** May the owner use bookings right now (render the form + read the inbox)? */
  entitled: boolean
  /**
   *  pro           — on a Pro plan; unlimited.
   *  trial         — non-Pro, inside the free month.
   *  trial_expired — non-Pro, the free month has ended → upsell.
   *  locked        — non-Pro, trial never started → offer "start free month".
   */
  status: BookingAccessStatus
  /** When the trial ends (null for Pro or if never started). */
  trialEndsAt: Date | null
  /** Whole days left in the trial (null unless status === 'trial'). 0 on the
   *  last day. */
  daysLeft: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Is this profile on a real Pro plan (ignoring the trial)? */
export function isProForBookings(p: BookingProfile | null | undefined): boolean {
  if (!p) return false
  return !!p.has_hosting || PRO_PLANS.has(String(p.plan || ''))
}

/**
 * Resolve a profile's bookings access. `now` is injectable for tests.
 */
export function bookingAccess(
  p: BookingProfile | null | undefined,
  now: Date = new Date(),
): BookingAccess {
  if (isProForBookings(p)) {
    return { entitled: true, status: 'pro', trialEndsAt: null, daysLeft: null }
  }

  const startedRaw = p?.bookings_trial_started_at
  if (!startedRaw) {
    return { entitled: false, status: 'locked', trialEndsAt: null, daysLeft: null }
  }

  const started = new Date(startedRaw)
  if (isNaN(started.getTime())) {
    // Corrupt timestamp — treat as never started rather than granting forever.
    return { entitled: false, status: 'locked', trialEndsAt: null, daysLeft: null }
  }

  const endsAt = new Date(started.getTime() + BOOKINGS_TRIAL_DAYS * DAY_MS)
  if (now.getTime() < endsAt.getTime()) {
    const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS))
    return { entitled: true, status: 'trial', trialEndsAt: endsAt, daysLeft }
  }

  return { entitled: false, status: 'trial_expired', trialEndsAt: endsAt, daysLeft: 0 }
}
