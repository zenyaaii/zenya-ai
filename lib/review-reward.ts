/**
 * The review reward: one code, one percentage, one place.
 *
 * WHY THIS FILE EXISTS. The code string and the discount percentage used to be
 * hardcoded independently in eight files: the pricing page, its FAQ, the
 * contact page, the promo-codes route, the contact route, ReviewOffer,
 * AccountSettings and the demo stack. Nothing kept them in step, and they did
 * not stay in step: the live pricing page's Starter card promised "خصم 20% على
 * أول شهر" while the only code that existed gave 30%. A customer who read that
 * line and typed the code got a different number than the one they were sold.
 *
 * Every surface reads from here now, so the percentage cannot disagree with
 * itself again.
 *
 * CHANGING THE REWARD IS TWO STEPS, IN THIS ORDER, AND THE ORDER MATTERS:
 *
 *   1. Create the promotion code in Stripe FIRST. The code below is what a
 *      customer types into "Promotion code" at checkout; if the copy advertises
 *      a code Stripe does not know, every person who follows the offer is
 *      rejected at the till. That is worse than a stale percentage.
 *   2. THEN set both env vars together, on Vercel and in .env.local:
 *        NEXT_PUBLIC_REVIEW_PROMO_CODE   the exact code, e.g. SHUKRAN20
 *        NEXT_PUBLIC_REVIEW_DISCOUNT_PCT the number, e.g. 20
 *
 * Setting one without the other is what this file exists to prevent, so keep
 * them together. The defaults are the pair that is live and working today.
 */

/** The code a customer types at checkout. Must exist in Stripe. */
export const REVIEW_REWARD_CODE =
  process.env.NEXT_PUBLIC_REVIEW_PROMO_CODE || 'SHUKRAN30'

/** The discount it applies, as a whole number of per cent. */
export const REVIEW_REWARD_PCT = Number(
  process.env.NEXT_PUBLIC_REVIEW_DISCOUNT_PCT || '30',
)

/** "خصم 30% على أول شهر" — the offer, as the site says it in Arabic. */
export const REVIEW_REWARD_AR = `خصم ${REVIEW_REWARD_PCT}% على أول شهر`

/** The same offer without the leading noun, for sentences that supply one. */
export const REVIEW_REWARD_AR_SHORT = `${REVIEW_REWARD_PCT}% على أول شهر`

/** "30% off your first month" — the English equivalent. */
export const REVIEW_REWARD_EN = `${REVIEW_REWARD_PCT}% off your first month`

/** The row stored against a user in `user_promo_codes`. */
export const REVIEW_REWARD_META = {
  label: REVIEW_REWARD_AR,
  description:
    'أدخِله في خانة «Promotion code» عند الاشتراك. صالح لأول شهر وللعملاء الجدد.',
  kind: 'subscription',
  source: 'review',
} as const
