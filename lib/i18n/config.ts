/**
 * Runtime i18n for the *app* surfaces (dashboard, wizards, editor, settings,
 * auth).
 *
 * Why this exists alongside the /en marketing pages: the marketing site can
 * afford a duplicate page per language, because those pages are static
 * editorial. A stateful dashboard cannot — you would be maintaining two copies
 * of every form, every table, and every mutation. So app surfaces stay one
 * codebase and pull their strings from a dictionary at runtime.
 *
 * Locale resolution order (see resolveLocale in ./server):
 *   1. an explicit /en/* path        → 'en'  (the marketing English section)
 *   2. the zenya_locale cookie       → whatever the user picked
 *   3. default                       → 'ar'  (Zenya is Arabic-first)
 *
 * There is deliberately no Accept-Language sniffing. An Arabic-first product
 * should not silently flip to English because someone's browser is American.
 */

/**
 * Master switch for the English edition.
 *
 * The English work is paused, not abandoned — every page, the catalog, and the
 * switcher all stay in the repo. While this is `false`:
 *
 *   • /en/* returns 404 (app/en/layout.tsx)
 *   • the language switcher renders nothing, everywhere
 *   • the sitemap advertises Arabic only, with no hreflang alternates
 *   • robots.txt disallows /en
 *   • the locale cookie cannot flip the app to English
 *
 * Flip to `true` to bring it all back. Nothing else needs editing.
 */
export const ENGLISH_ENABLED = false

/**
 * hreflang alternates for a page that has an English twin.
 *
 * Returns undefined while English is paused, so no page advertises an alternate
 * that currently 404s. Callers keep their English URL written inline, so the
 * mapping is still documented and comes back the moment the flag flips.
 */
export function hreflangAlternates(arUrl: string, enUrl: string) {
  if (!ENGLISH_ENABLED) return undefined
  return { ar: arUrl, en: enUrl, 'x-default': arUrl }
}

export const LOCALES = ['ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ar'

/** Cookie the language switcher writes. Readable by the server layout. */
export const LOCALE_COOKIE = 'zenya_locale'

/** One year: a language choice should outlive a browser restart. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Text direction for a locale. Drives <html dir> and any dir-sensitive UI. */
export function dirFor(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

/** The language's own name, for use in a language switcher. */
export const LOCALE_LABEL: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
}
