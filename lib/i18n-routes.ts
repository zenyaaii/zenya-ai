/**
 * The ar ⇄ en route map for the marketing site.
 *
 * Zenya stays Arabic-first: Arabic lives at the root (`/pricing`) and English
 * is the explicit alternate under `/en` (`/en/pricing`). There is no automatic
 * redirect on browser language, so an Arabic visitor never gets bounced out of
 * the primary site.
 *
 * This file is the single source of truth for which pages are published in
 * both languages. Both the language switcher (which must not link to a 404)
 * and `app/sitemap.ts` (which must not advertise an hreflang alternate that
 * does not exist) read from it, so the two can never drift apart.
 *
 * Adding a bilingual page = create `app/en{path}/page.tsx`, then add the path
 * to BILINGUAL_ROUTES below. Nothing else needs touching.
 */

export const EN_PREFIX = '/en'

/** Static routes published in BOTH languages: Arabic at `path`, English at `/en{path}`. */
export const BILINGUAL_ROUTES = [
  '/',
  '/features',
  '/websites',
  '/compare',
  '/pricing',
  '/faq',
] as const

export type BilingualRoute = (typeof BILINGUAL_ROUTES)[number]

/**
 * Dynamic sections where every slug is published in both languages.
 * Verified parity: `lib/comparisons.ts` / `lib/comparisons-en.ts` (5 slugs) and
 * `lib/template-pages.tsx` / `lib/template-pages-en.tsx` (8 slugs).
 */
export const BILINGUAL_SECTIONS = ['/compare/', '/websites/'] as const

/** Trailing slashes off (root excepted) so '/features/' and '/features' match. */
function normalize(pathname: string): string {
  if (!pathname) return '/'
  const p = pathname.replace(/\/+$/, '')
  return p === '' ? '/' : p
}

export function isEnglishPath(pathname: string): boolean {
  const p = normalize(pathname)
  return p === EN_PREFIX || p.startsWith(`${EN_PREFIX}/`)
}

/** '/en' -> '/', '/en/features' -> '/features'. Already-Arabic paths pass through. */
export function toArabicPath(pathname: string): string {
  const p = normalize(pathname)
  if (!isEnglishPath(p)) return p
  return p.slice(EN_PREFIX.length) || '/'
}

/** '/' -> '/en', '/features' -> '/en/features'. Already-English paths pass through. */
export function toEnglishPath(pathname: string): string {
  const p = normalize(pathname)
  if (isEnglishPath(p)) return p
  return p === '/' ? EN_PREFIX : `${EN_PREFIX}${p}`
}

/** Does this Arabic path have a published English twin? */
export function hasEnglishTwin(pathname: string): boolean {
  const p = normalize(pathname)
  if ((BILINGUAL_ROUTES as readonly string[]).includes(p)) return true
  return BILINGUAL_SECTIONS.some((s) => p.startsWith(s) && p.length > s.length)
}

/**
 * Where the language switcher should point from `pathname`.
 *
 * Every `/en` page has an Arabic twin by construction, so switching to Arabic
 * is always an exact match. Going the other way, most Arabic pages are
 * Arabic-only (about, themes, demos, legal); rather than hiding the switcher
 * there and stranding a non-Arabic reader, we fall back to the English home.
 */
export function counterpartPath(pathname: string): string {
  const p = normalize(pathname)
  if (isEnglishPath(p)) return toArabicPath(p)
  return hasEnglishTwin(p) ? toEnglishPath(p) : EN_PREFIX
}
