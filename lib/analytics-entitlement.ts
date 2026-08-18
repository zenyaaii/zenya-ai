/**
 * Site-analytics entitlement — who can see the visitor analytics dashboard.
 *
 * Product rule (2026-08-18): site analytics is a STARTER+ feature. Every owner
 * (Entry / grandfathered free) gets a ONE-MONTH free trial the first time they
 * open the analytics dashboard — after that it's Starter or Pro.
 *
 *   entitled == Starter/Pro plan OR (trial started AND now < trial start + 30 days)
 *
 * Mirrors lib/booking-entitlement.ts exactly, keyed off analytics_trial_started_at.
 * Pure + isomorphic: no DB, no secrets.
 */

/** Length of the free trial, in days. */
export const ANALYTICS_TRIAL_DAYS = 30

/** Plans that include analytics outright (no trial needed). Starter and above. */
const INCLUDED_PLANS = new Set(['starter', 'pro', 'pro_hosting', 'pro_onetime', 'admin'])

export type AnalyticsProfile = {
  plan?: string | null
  has_hosting?: boolean | null
  analytics_trial_started_at?: string | null
}

export type AnalyticsAccessStatus = 'included' | 'trial' | 'trial_expired' | 'locked'

export type AnalyticsAccess = {
  entitled: boolean
  status: AnalyticsAccessStatus
  trialEndsAt: Date | null
  daysLeft: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Does this profile include analytics outright (Starter+), ignoring the trial? */
export function isIncludedForAnalytics(p: AnalyticsProfile | null | undefined): boolean {
  if (!p) return false
  return !!p.has_hosting || INCLUDED_PLANS.has(String(p.plan || ''))
}

/** Resolve a profile's analytics access. `now` is injectable for tests. */
export function analyticsAccess(
  p: AnalyticsProfile | null | undefined,
  now: Date = new Date(),
): AnalyticsAccess {
  if (isIncludedForAnalytics(p)) {
    return { entitled: true, status: 'included', trialEndsAt: null, daysLeft: null }
  }

  const startedRaw = p?.analytics_trial_started_at
  if (!startedRaw) {
    return { entitled: false, status: 'locked', trialEndsAt: null, daysLeft: null }
  }

  const started = new Date(startedRaw)
  if (isNaN(started.getTime())) {
    return { entitled: false, status: 'locked', trialEndsAt: null, daysLeft: null }
  }

  const endsAt = new Date(started.getTime() + ANALYTICS_TRIAL_DAYS * DAY_MS)
  if (now.getTime() < endsAt.getTime()) {
    const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS))
    return { entitled: true, status: 'trial', trialEndsAt: endsAt, daysLeft }
  }

  return { entitled: false, status: 'trial_expired', trialEndsAt: endsAt, daysLeft: 0 }
}
