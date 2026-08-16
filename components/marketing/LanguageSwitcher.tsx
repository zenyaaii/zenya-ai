'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { counterpartPath, isEnglishPath } from '@/lib/i18n-routes'

/**
 * ar ⇄ en switcher for the marketing site.
 *
 * Always labels the TARGET language in that language's own script ("English"
 * when you are on Arabic, "العربية" when you are on English) so a reader who
 * cannot read the current page can still recognise the way out.
 *
 * The destination comes from lib/i18n-routes, which only maps pages that are
 * actually published in both languages; Arabic-only pages fall back to the
 * English home rather than linking to a 404.
 */
export default function LanguageSwitcher({
  variant = 'chip',
  className,
}: {
  variant?: 'chip' | 'inline'
  className?: string
}) {
  const pathname = usePathname() || '/'
  const onEnglish = isEnglishPath(pathname)
  const href = counterpartPath(pathname)

  const targetLang = onEnglish ? 'ar' : 'en'
  const targetLabel = onEnglish ? 'العربية' : 'English'
  const ariaLabel = onEnglish ? 'التبديل إلى العربية' : 'Switch to English'

  return (
    <Link
      href={href}
      hrefLang={targetLang}
      lang={targetLang}
      dir={onEnglish ? 'rtl' : 'ltr'}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors duration-150',
        variant === 'chip'
          ? cn(
              'rounded-full border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-muted',
              'hover:border-[rgba(94,106,210,0.55)] hover:bg-[rgba(94,106,210,0.08)] hover:text-foreground'
            )
          : 'text-[12.5px] font-medium text-muted hover:text-foreground',
        className
      )}
    >
      <Languages className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} aria-hidden />
      {targetLabel}
    </Link>
  )
}
