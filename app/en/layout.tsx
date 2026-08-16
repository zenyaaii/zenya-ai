import Link from 'next/link'
import type { ReactNode } from 'react'
import ZenyaMark from '@/components/ZenyaMark'
import LanguageSwitcher from '@/components/marketing/LanguageSwitcher'

/**
 * English (LTR) section chrome. The document language itself is set on <html>
 * by the root layout, which reads the pathname from middleware; the wrapper
 * below repeats lang/dir so this subtree stays correct even if rendered
 * outside that context. hreflang annotations on each page tell Google these
 * are the English alternates of the Arabic pages, and lib/i18n-routes is the
 * list of which pages actually have a twin.
 */

const NAV = [
  { href: '/en', label: 'Home' },
  { href: '/en/features', label: 'Features' },
  { href: '/en/websites', label: 'Templates' },
  { href: '/en/compare', label: 'Compare' },
  { href: '/en/pricing', label: 'Pricing' },
  { href: '/en/faq', label: 'FAQ' },
]

export default function EnLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="en" dir="ltr" className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-token bg-[rgba(247,244,237,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/en" aria-label="Zenya home" className="flex items-center">
            <ZenyaMark className="h-6 text-foreground" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-[13.5px] font-medium text-muted transition-colors hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {/* Routes to this page's Arabic twin, not always the home page. */}
            <LanguageSwitcher variant="inline" />
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-[13.5px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-token bg-[var(--background)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <ZenyaMark className="h-6 text-foreground" />
              <p className="mt-3 max-w-sm text-[13.5px] leading-[1.7] text-muted">
                Zenya is an Arabic-first AI website builder. Pick a template, write a brief, and get a
                professional site in minutes.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-[13px] text-muted transition-colors hover:text-foreground">
                  {n.label}
                </Link>
              ))}
              <LanguageSwitcher variant="inline" className="text-[13px] text-primary" />
            </nav>
          </div>
          <p className="mt-8 border-t border-token pt-6 text-[12.5px] text-muted">
            © {new Date().getFullYear()} Zenya. Built in the EU.
          </p>
        </div>
      </footer>
    </div>
  )
}
