import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import { isAppPath, isEnglishPath } from '@/lib/i18n-routes'
import { translator } from './index'

/**
 * Server-side locale resolution. Use from server components and layouts.
 *
 * An explicit /en/* path wins over the cookie: those marketing pages ARE the
 * English edition, so an Arabic-preferring visitor following an English link
 * still gets English rather than a page half in each language. Everywhere else
 * the cookie decides, defaulting to Arabic.
 *
 * `x-pathname` is set by middleware (see middleware.ts).
 */
export function resolveLocale(): Locale {
  const pathname = headers().get('x-pathname') || ''

  // The English marketing section is English outright.
  if (isEnglishPath(pathname)) return 'en'

  // Marketing pages outside /en are Arabic *documents*: their copy is
  // hardcoded Arabic and their English edition is a separate twin page. Honouring
  // an "en" preference here would label an Arabic page lang="en" and flip it to
  // LTR without translating a word of it — worse than ignoring the preference.
  // Only the app surfaces translate at runtime, so only they read the cookie.
  if (!isAppPath(pathname)) return DEFAULT_LOCALE

  const cookie = cookies().get(LOCALE_COOKIE)?.value
  return isLocale(cookie) ? cookie : DEFAULT_LOCALE
}

/** Convenience: resolved locale plus its message tree. */
export function getT() {
  const locale = resolveLocale()
  return { locale, t: translator(locale) }
}
