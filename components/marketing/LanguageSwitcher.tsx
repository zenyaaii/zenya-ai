'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { counterpartPath, isAppPath, isEnglishPath } from '@/lib/i18n-routes'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { LOCALE_LABEL } from '@/lib/i18n/config'

/**
 * ar ⇄ en switcher, used on both the marketing site and the app.
 *
 * It behaves differently in the two places because the two are translated
 * differently:
 *
 *  - Marketing pages have a real English twin page, so this navigates there
 *    (and saves the preference on the way, so the app follows suit).
 *  - App pages have no twin — a stateful dashboard is one codebase that reads
 *    its strings from the locale cookie — so this flips the locale in place and
 *    leaves the user exactly where they were. Navigating them to a different
 *    URL mid-task would lose their context.
 *
 * Either way the target language is labelled in its own script, so a reader who
 * cannot read the current page can still recognise the way out.
 */
export default function LanguageSwitcher({
  variant = 'chip',
  className,
}: {
  variant?: 'chip' | 'inline'
  className?: string
}) {
  const pathname = usePathname() || '/'
  const { locale, setLocale } = useLocale()

  const onEnglish = isEnglishPath(pathname) || locale === 'en'
  const target = onEnglish ? 'ar' : 'en'
  const targetLabel = LOCALE_LABEL[target]
  const ariaLabel = onEnglish ? 'التبديل إلى العربية' : 'Switch to English'

  const classes = cn(
    'inline-flex items-center gap-1.5 transition-colors duration-150',
    variant === 'chip'
      ? cn(
          'rounded-full border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-muted',
          'hover:border-[rgba(94,106,210,0.55)] hover:bg-[rgba(94,106,210,0.08)] hover:text-foreground'
        )
      : 'text-[12.5px] font-medium text-muted hover:text-foreground',
    className
  )

  const label = (
    <>
      <Languages className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} aria-hidden />
      {targetLabel}
    </>
  )

  // App surfaces: flip locale, stay on the page.
  if (isAppPath(pathname)) {
    return (
      <button
        type="button"
        onClick={() => setLocale(target)}
        lang={target}
        dir={target === 'ar' ? 'rtl' : 'ltr'}
        aria-label={ariaLabel}
        className={classes}
      >
        {label}
      </button>
    )
  }

  // Marketing surfaces: go to the twin page, and remember the choice.
  return (
    <Link
      href={counterpartPath(pathname)}
      hrefLang={target}
      lang={target}
      dir={target === 'ar' ? 'rtl' : 'ltr'}
      aria-label={ariaLabel}
      onClick={() => setLocale(target)}
      className={classes}
    >
      {label}
    </Link>
  )
}
