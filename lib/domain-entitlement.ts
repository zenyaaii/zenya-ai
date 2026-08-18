/**
 * Domain entitlements for Pro subscribers.
 *
 * Two perks, both applied SERVER-SIDE at checkout (never exposed as public
 * promotion codes):
 *
 *   1. Free domain — a Pro account gets ONE free 1-year registration, but
 *      only on a "standard" domain (retail at or under FREE_DOMAIN_MAX_RETAIL_USD
 *      and not a registry premium). Zenya still pays Porkbun the wholesale
 *      cost; the customer pays $0 via a 100%-off Stripe coupon. Redeemed
 *      once — tracked by profiles.free_domain_claimed_at.
 *
 *   2. Pro domain discount — every OTHER domain a Pro buys (a second domain,
 *      or a premium/expensive one the free perk doesn't cover) gets 30% off
 *      via a Stripe coupon.
 *
 * Coupons live in Stripe (created once). IDs are overridable via env for
 * test-mode / re-issue, defaulting to the live coupons.
 */

/** 100%-off coupon used to zero out the one free Pro domain. */
export const FREE_DOMAIN_COUPON =
  process.env.STRIPE_FREE_DOMAIN_COUPON || 'zenya_free_domain'

/** 30%-off coupon applied to any other domain a Pro subscriber buys. */
export const PRO_DOMAIN_COUPON =
  process.env.STRIPE_PRO_DOMAIN_COUPON || 'zenya_pro_domain_30'

/** Discount rate the Pro coupon applies — kept in sync for UI display. */
export const PRO_DOMAIN_DISCOUNT_PCT = Number(
  process.env.STRIPE_PRO_DOMAIN_DISCOUNT_PCT || '30',
)

/**
 * WHOLESALE price ceiling (USD/first year) for the FREE perk — the raw
 * price Zenya pays Porkbun, NOT the retail we charge. Rule of thumb:
 * "if we can get it for four dollars or less, the Pro subscriber gets
 * it on us." That covers the promotional/cheap TLDs — .store, .site,
 * .online, .shop, .xyz, .club, and .restaurant when it's on promo —
 * without giving away expensive vanity TLDs. Everything above the cap
 * still gets the 30% Pro coupon and the customer pays retail directly.
 *
 * Override with FREE_DOMAIN_MAX_WHOLESALE_USD.
 */
export const FREE_DOMAIN_MAX_WHOLESALE_USD = Number(
  process.env.FREE_DOMAIN_MAX_WHOLESALE_USD || '4',
)

/**
 * @deprecated Kept as a re-export so old imports keep compiling. The
 *  active gate is now FREE_DOMAIN_MAX_WHOLESALE_USD.
 */
export const FREE_DOMAIN_MAX_RETAIL_USD = FREE_DOMAIN_MAX_WHOLESALE_USD

/** The plan labels that count as Pro for the FREE-DOMAIN + 30%-off perks.
 *  Includes legacy `pro_onetime` (grandfathered one-time Pro buyers) so they
 *  keep the perk. Deliberately EXCLUDES `starter`: the free domain and the
 *  30% discount are Pro-only. (Starter CAN connect a custom domain it owns —
 *  see canConnectCustomDomain — it just doesn't get one for free.) */
const PRO_PLANS = new Set(['pro', 'pro_hosting', 'pro_onetime', 'admin'])

/** Plans allowed to CONNECT a custom domain they already own (Starter+). This
 *  is the 2026-08-18 model: custom domains moved down to Starter; Pro adds the
 *  free-for-a-year domain and the 30% discount on top. */
const CUSTOM_DOMAIN_PLANS = new Set(['starter', 'pro', 'pro_hosting', 'pro_onetime', 'admin'])

/**
 * May this profile connect a custom domain it already owns? Starter and above.
 * Keyed off the plan set + has_hosting (never the cached is_pro, same rationale
 * as isProProfile below).
 */
export function canConnectCustomDomain(p: ProfileForEntitlement | null | undefined): boolean {
  if (!p) return false
  return !!p.has_hosting || CUSTOM_DOMAIN_PLANS.has(String(p.plan || ''))
}

export type ProfileForEntitlement = {
  plan?: string | null
  has_hosting?: boolean | null
  is_pro?: boolean | null
  free_domain_claimed_at?: string | null
}

/**
 * Does this profile hold an active Pro/hosting entitlement (for DOMAIN perks)?
 *
 * Keys off has_hosting + the explicit PRO_PLANS set only. We must NOT fall
 * back to `is_pro`, because the webhook sets is_pro=true for Starter too —
 * that would hand Starter ($14.99) the Pro-only free domain. Domain perks are
 * Pro-only per the pricing page.
 */
export function isProProfile(p: ProfileForEntitlement | null | undefined): boolean {
  if (!p) return false
  return !!p.has_hosting || PRO_PLANS.has(String(p.plan || ''))
}

export type FreeDomainCheck = {
  /** Wholesale first-year price (USD) — what Porkbun charges Zenya.
   *  This is the free-perk gate. */
  wholesale: number
  /** Domain retail (USD/year) we'd otherwise charge. Kept for callers
   *  that want to display or record it, but no longer used in the
   *  entitlement decision. */
  retail?: number
  /** Registry-premium flag from Porkbun — premiums are never free. */
  premium: boolean
}

/**
 * Decide how a given domain should be priced for this user.
 *   - 'free'      → zero it out (Pro, unclaimed, wholesale ≤ cap, not premium)
 *   - 'pro'       → apply the 30% Pro discount coupon
 *   - 'standard'  → charge full retail (non-Pro; shouldn't happen since the
 *                   buy flow already gates domains behind hosting/Pro)
 */
export function priceDomainFor(
  profile: ProfileForEntitlement | null | undefined,
  d: FreeDomainCheck,
): 'free' | 'pro' | 'standard' {
  const pro = isProProfile(profile)
  if (!pro) return 'standard'
  const alreadyClaimed = !!profile?.free_domain_claimed_at
  const eligibleFree =
    !alreadyClaimed && !d.premium && d.wholesale <= FREE_DOMAIN_MAX_WHOLESALE_USD
  return eligibleFree ? 'free' : 'pro'
}
