/**
 * Slug rules for public Zenya-hosted sites at /s/{slug}.
 *
 * Shape: lowercase alphanumeric + hyphens, 3-40 chars, must start and end
 * with [a-z0-9]. Enforced both at the DB CHECK constraint and here so we
 * can show friendly errors before the round-trip.
 */

export const SLUG_MIN = 3
export const SLUG_MAX = 40
const SLUG_SHAPE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

/**
 * Reserved namespaces — anything that would collide with an existing route
 * or look like a Zenya/system page. First-match wins; not authorisation.
 */
const RESERVED = new Set([
  'about', 'account', 'admin', 'api', 'app', 'auth', 'billing', 'blog',
  'careers', 'checkout', 'contact', 'cookies', 'dashboard', 'demo',
  'docs', 'download', 'editor', 'enterprise', 'faq', 'feedback',
  'forgot-password', 'help', 'home', 'index', 'invite', 'jobs',
  'launch', 'legal', 'login', 'logout', 'mail', 'maintenance',
  'mfa', 'oauth', 'pages', 'pay', 'payment', 'preview', 'pricing',
  'privacy', 'profile', 'public', 'recover', 'refund', 'register',
  'reset', 'reset-password', 's', 'security', 'settings', 'shop',
  'shopify', 'signin', 'signup', 'site', 'sitemap', 'sites',
  'status', 'store', 'subprocessors', 'support', 'team', 'teams',
  'terms', 'theme', 'themes', 'tos', 'verify', 'webhook', 'webhooks',
  'workspace', 'www', 'you', 'zenya', 'zenyaai',
])

/**
 * Normalize an arbitrary string into a slug-shaped candidate (does NOT
 * validate). Used to seed the picker UI from a product/restaurant name.
 *
 *   "Pierre's Bakery"    -> "pierres-bakery"
 *   "  Atlas - SaaS  "   -> "atlas-saas"
 *   "café-côté"          -> "cafe-cote"
 */
export function normalizeSlug(input: string): string {
  return input
    .normalize('NFKD')                  // split accents
    .replace(/[̀-ͯ]/g, '')    // drop combining marks
    .toLowerCase()
    .replace(/['"`]/g, '')              // strip apostrophes (don't replace with -)
    .replace(/[^a-z0-9]+/g, '-')        // everything else collapses to a hyphen
    .replace(/^-+|-+$/g, '')            // trim leading/trailing hyphens
    .replace(/-{2,}/g, '-')             // collapse runs
    .slice(0, SLUG_MAX)
}

export type SlugCheck =
  | { ok: true }
  | { ok: false; reason: 'too_short' | 'too_long' | 'shape' | 'reserved' | 'starts_with_xn--' }

export function validateSlug(slug: string): SlugCheck {
  if (slug.length < SLUG_MIN) return { ok: false, reason: 'too_short' }
  if (slug.length > SLUG_MAX) return { ok: false, reason: 'too_long' }
  if (!SLUG_SHAPE.test(slug))  return { ok: false, reason: 'shape' }
  if (slug.startsWith('xn--')) return { ok: false, reason: 'starts_with_xn--' }
  if (RESERVED.has(slug))      return { ok: false, reason: 'reserved' }
  return { ok: true }
}

export function slugErrorMessage(reason: Exclude<SlugCheck, { ok: true }>['reason']): string {
  switch (reason) {
    case 'too_short':         return `Slug must be at least ${SLUG_MIN} characters.`
    case 'too_long':          return `Slug must be at most ${SLUG_MAX} characters.`
    case 'shape':             return 'Use lowercase letters, numbers, and hyphens only. Start and end with a letter or number.'
    case 'reserved':          return 'That slug is reserved. Try another.'
    case 'starts_with_xn--':  return 'Slug cannot start with “xn--”.'
  }
}

/**
 * Generate a starting suggestion from a product/business name. Caller is
 * expected to test availability and append a numeric suffix on collision
 * (e.g. "pierres-bakery-2").
 */
export function suggestSlugFrom(name: string): string {
  const base = normalizeSlug(name || 'site')
  if (base.length >= SLUG_MIN) return base
  // Pad short bases — e.g. "ab" -> "ab-site" — to clear the length check.
  return normalizeSlug(`${base}-site`)
}
