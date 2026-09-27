import { z } from 'zod'

/**
 * The owner's own reviews, as every generator takes them.
 *
 * No generator writes reviews, reviewer names, an average rating or a review
 * count. What a site shows is what the owner typed in or picked from Google in
 * the wizard, and nothing when they gave none. Wellness set this rule first;
 * the other templates follow it through the helpers here.
 */

export const ownerReviewSchema = z.object({
  name: z.string().min(1).max(80),
  text: z.string().min(2).max(600),
  /** What the review is about: a product, a service, a dish. */
  detail: z.string().max(120).optional(),
  rating: z.number().min(1).max(5).optional(),
  origin: z.literal('google').optional(),
  when: z.string().max(60).optional(),
})

export type OwnerReview = z.infer<typeof ownerReviewSchema>

/** The two fields each template's social_proof gains beside its rating and count. */
export const ownerReviewsFields = {
  reviews: z.array(ownerReviewSchema).max(12).optional(),
  reviews_url: z.string().url().optional(),
}

/** 1 to 5 whole stars; a review with no stars given counts as 5, as on wellness. */
export function starsOf(rating: number | undefined): number {
  return typeof rating === 'number' ? Math.max(1, Math.min(5, Math.round(rating))) : 5
}

/** Trimmed, with empty ones dropped. */
export function cleanOwnerReviews(list: OwnerReview[] | undefined): OwnerReview[] {
  return (list || [])
    .map((r) => ({ ...r, name: r.name.trim(), text: r.text.trim(), detail: r.detail?.trim() || undefined }))
    .filter((r) => r.name && r.text.length >= 2)
    .slice(0, 12)
}

/** The prompt line every generator carries. */
export const NO_REVIEWS_RULE =
  "- Do not write reviews or testimonials, reviewer names, an average rating, a review count, or any star or score claim (such as \"4.9/5\" or \"+500 five-star reviews\") in any field. Only the owner's real reviews are shown, and the site adds them itself."

/** What the prompt says about the rating: the owner's numbers, or that there are none. */
export function ratingBrief(rating: number | undefined, count: string | undefined): string {
  if (typeof rating !== 'number') {
    return 'Rating: none given. Never mention a rating, stars or a number of reviews.'
  }
  return `Rating (the owner's real one, quote it exactly or not at all): ${rating}/5${count?.trim() ? ` from ${count.trim()} reviews` : ''}`
}

/** Text that states a rating, stars or a number of reviews. */
const RATING_CLAIM = /★|⭐|\/\s*5(?!\d)|تقييم|مراجع|نجوم|نجمة|review|rating|\bstars?\b/i

export function claimsRating(text: unknown): boolean {
  return typeof text === 'string' && RATING_CLAIM.test(text)
}

/** The owner's own rating and count, as the wizard sent them. */
export type OwnerRating = { rating?: number; count?: string }

function numbersIn(text: string): string[] {
  const latin = text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g, '.')
  return latin.match(/\d+(?:[.,]\d+)*/g) || []
}

/**
 * A rating claim may stay only when the owner gave a rating and every number
 * in it is theirs: the rating, the count, or the 5 of "out of 5".
 */
function ownersClaim(text: string, owner: OwnerRating): boolean {
  if (typeof owner.rating !== 'number') return false
  const ok = new Set(['5', String(owner.rating), owner.rating.toFixed(1), ...numbersIn(owner.count || '')])
  return numbersIn(text).every((n) => ok.has(n))
}

/** Drops generated trust copy that states a rating, stars or a review count the owner never gave. */
export function dropRatingClaims<T>(items: T[], textOf: (item: T) => string, owner: OwnerRating): T[] {
  return items.filter((it) => {
    const t = textOf(it)
    return !claimsRating(t) || ownersClaim(t, owner)
  })
}

/** One line of generated copy, or the fallback when it states a rating the owner never gave. */
export function unlessRatingClaim<T extends string | undefined>(text: T, fallback: T, owner: OwnerRating): T {
  return typeof text === 'string' && claimsRating(text) && !ownersClaim(text, owner) ? fallback : text
}

/** The owner's review count as typed ("+120", "120"), or undefined. */
export function countOf(count: string | undefined): string | undefined {
  const c = String(count ?? '').trim()
  return /\d/.test(c) ? c : undefined
}
