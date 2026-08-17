import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ENGLISH_ENABLED } from '@/lib/i18n/config'
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

/** Header stays lean enough to hold one line at desktop. */
const NAV = [
  { href: '/en/themes', label: 'Templates' },
  { href: '/en/features', label: 'Features' },
  { href: '/en/pricing', label: 'Pricing' },
  { href: '/en/compare', label: 'Compare' },
  { href: '/en/faq', label: 'FAQ' },
]

/** The footer carries the full map, grouped. */
const FOOTER_GROUPS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { href: '/en/themes', label: 'Templates' },
      { href: '/en/websites', label: 'Website types' },
      { href: '/en/features', label: 'Features' },
      { href: '/en/pricing', label: 'Pricing' },
      { href: '/en/compare', label: 'Compare' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/en/about', label: 'About' },
      { href: '/en/contact', label: 'Contact' },
      { href: '/en/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/en/privacy', label: 'Privacy' },
      { href: '/en/cookies', label: 'Cookies' },
      { href: '/en/subprocessors', label: 'Subprocessors' },
      { href: '/en/terms', label: 'Terms' },
      { href: '/en/refund', label: 'Refunds' },
    ],
  },
]

export default function EnLayout({ children }: { children: ReactNode }) {
  // English is paused. One guard here hides the whole /en subtree.
  if (!ENGLISH_ENABLED) notFound()

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
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <ZenyaMark className="h-6 text-foreground" />
              <p className="mt-3 max-w-sm text-[13.5px] leading-[1.7] text-muted">
                Zenya is an Arabic-first AI website builder. Pick a template, write a brief, and get a
                professional site in minutes.
              </p>
              <div className="mt-5">
                <LanguageSwitcher variant="chip" />
              </div>
            </div>

            {FOOTER_GROUPS.map((group) => (
              <div key={group.heading} className="md:col-span-2">
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                  {group.heading}
                </h3>
                <ul className="space-y-2.5">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-muted transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-10 border-t border-token pt-6 text-[12.5px] text-muted">
            © {new Date().getFullYear()} Zenya. Built in the EU.
          </p>
        </div>
      </footer>
    </div>
  )
}
