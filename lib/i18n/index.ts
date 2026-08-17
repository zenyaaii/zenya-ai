import { DEFAULT_LOCALE, type Locale } from './config'
import { MESSAGES, type Messages } from './messages'

export * from './config'
export type { Messages } from './messages'
export { MESSAGES } from './messages'

/**
 * Translator for a locale.
 *
 * Returns the message tree directly rather than a `t('a.b.c')` string lookup,
 * so a typo is a compile error instead of a blank space in the UI:
 *
 *   const t = translator(locale)
 *   t.nav.sites          // typed, autocompleted, cannot be misspelled
 */
export function translator(locale: Locale): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}
