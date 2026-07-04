import Link from 'next/link'
import type { ReactNode } from 'react'
import ZenyaMark from '@/components/ZenyaMark'

/**
 * English (LTR) section chrome. The root <html> stays lang="ar" dir="rtl" for
 * the primary Arabic site; here we flip the whole /en subtree to LTR + English
 * with a wrapper so English SEO pages render correctly. hreflang annotations on
 * each page tell Google these are the English alternates of the Arabic pages.
 */

const NAV = [
  { href: '/en', label: 'Home' },
  { href: '/en/features', label: 'Features' },
  { href: '/en/websites', label: 'Templates' },
  { href: '/en/compare', label: 'Compare' },
  { href: '/pricing', label: 'Pricing' },
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
            <Link href="/" className="text-[13px] font-medium text-muted transition-colors hover:text-foreground" hrefLang="ar">
              العربية
            </Link>
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
              <Link href="/faq" className="text-[13px] text-muted transition-colors hover:text-foreground">
                FAQ
              </Link>
              <Link href="/" hrefLang="ar" className="text-[13px] font-medium text-primary transition-colors hover:text-foreground">
                العربية
              </Link>
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
