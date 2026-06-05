/**
 * Shopify affiliate link (Impact Radius / shopify.pxf.io).
 *
 * Single source of truth — every "Don't have Shopify yet?" CTA in the app
 * funnels through /api/affiliate/shopify, which logs the click + redirects
 * here. To swap providers, change SHOPIFY_AFFILIATE_BASE_URL and nothing
 * else.
 *
 * The subId1 query string is preserved through the redirect chain — Impact
 * surfaces it back to us in payout reports so we know which placement is
 * actually driving signups (dashboard vs pricing vs theme-new).
 */

export const SHOPIFY_AFFILIATE_BASE_URL =
  'https://shopify.pxf.io/c/7381681/1061744/13624'

/** Known click placements — keep this exhaustive so analytics stays clean. */
export type AffiliatePlacement =
  | 'dashboard_post_export'
  | 'dashboard_empty_state'
  | 'theme_new_ecom_picker'
  | 'pricing_faq'
  | 'preview_export_modal'
  | 'unknown'

export const PLACEMENTS: AffiliatePlacement[] = [
  'dashboard_post_export',
  'dashboard_empty_state',
  'theme_new_ecom_picker',
  'pricing_faq',
  'preview_export_modal',
  'unknown',
]

export function buildShopifyAffiliateUrl(
  placement: AffiliatePlacement = 'unknown'
): string {
  // Impact Radius forwards subId1 to your reports. Append rather than
  // overwrite if the base URL ever gains its own query.
  const u = new URL(SHOPIFY_AFFILIATE_BASE_URL)
  u.searchParams.set('subId1', `zenya_${placement}`)
  return u.toString()
}

/** Server-friendly redirect URL the UI links to instead of the affiliate URL directly. */
export function affiliateClickHref(placement: AffiliatePlacement): string {
  const q = new URLSearchParams({ placement })
  return `/api/affiliate/shopify?${q.toString()}`
}
