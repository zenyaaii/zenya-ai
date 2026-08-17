'use client'

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  dirFor,
  type Locale,
} from '@/lib/i18n/config'
import { translator } from '@/lib/i18n'
import type { Messages } from '@/lib/i18n/messages'

/**
 * Carries the server-resolved locale into client components.
 *
 * The locale is resolved once on the server (from the cookie or an /en path)
 * and handed down, so the client never re-derives it and there is no hydration
 * mismatch where the first paint is Arabic and the second is English.
 */

type LocaleContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: Messages
  /** Persist a new locale and re-render the tree with it. */
  setLocale: (next: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const router = useRouter()

  const setLocale = useCallback(
    (next: Locale) => {
      // Written client-side rather than through an API route: it is a display
      // preference, not a secret, and this keeps the switch instant.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
      // The root layout reads the cookie on the server, so the tree has to be
      // re-fetched for <html lang/dir> and every server component to update.
      router.refresh()
    },
    [router]
  )

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir: dirFor(locale), t: translator(locale), setLocale }),
    [locale, setLocale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/**
 * Locale + messages for a client component.
 *
 * Falls back to the default locale rather than throwing when used outside a
 * provider: a missing provider should degrade to Arabic, not blank the page.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (ctx) return ctx
  return {
    locale: DEFAULT_LOCALE,
    dir: dirFor(DEFAULT_LOCALE),
    t: translator(DEFAULT_LOCALE),
    setLocale: () => {},
  }
}

/** Shorthand for the common case of only needing the message tree. */
export function useT(): Messages {
  return useLocale().t
}
