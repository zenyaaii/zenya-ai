'use client'
import Link from 'next/link'
import Image from 'next/image'
import { X as XIcon, Heart, ArrowUpRight } from 'lucide-react'
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { cn } from '@/lib/utils'

/**
 * GitHub mark — inlined because lucide-react v1+ removed brand icons.
 * Keeps brand recognition with zero extra deps.
 */
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.56v-2.02c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.97 10.97 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56 4.56-1.52 7.85-5.82 7.85-10.9C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

/**
 * Demo route per business type. Centralized so we can change the URL pattern
 * once if needed. The one-product demo lives at `/demo` (no suffix); the
 * other seven live at `/demo/{type}`.
 */
const DEMO_HREF: Record<string, string> = {
  one_product: '/demo',
  restaurant: '/demo/restaurant',
  atlas: '/demo/atlas',
  lookbook: '/demo/lookbook',
  collective: '/demo/collective',
  studio: '/demo/studio',
  services: '/demo/services',
  wellness: '/demo/wellness',
}

const PRODUCT = [
  { href: '/themes',     label: 'Browse templates' },
  { href: '/pricing',    label: 'Pricing'          },
  { href: '/theme/new',  label: 'Start building'   },
  { href: '/contact',    label: 'Contact'          },
]

const LEGAL = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms',   label: 'Terms'   },
]

const SOCIALS = [
  { label: 'X / Twitter', href: '#', icon: XIcon      },
  { label: 'GitHub',      href: '#', icon: GithubIcon },
]

export default function Footer() {
  return (
    <footer className="relative pt-20 pb-10 border-t border-token bg-white">
      {/* Subtle aurora wash at the very top of the footer for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[260px] -z-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 30% 0%, rgba(94,106,210,0.10), transparent 70%), radial-gradient(ellipse 50% 90% at 75% 0%, rgba(217,119,6,0.07), transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* ── Brand ── */}
          <div className="md:col-span-5">
            <Link href="/" className="mb-4 flex w-fit items-center gap-2.5">
              <div
                className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg"
                style={{
                  background: '#5e6ad2',
                  boxShadow:
                    'rgba(255,255,255,0.20) 0px 0.5px 0px inset, rgba(94,106,210,0.35) 0px 0px 0px 0.5px inset',
                }}
              >
                <Image src="/logo.png" alt="Zenya" fill className="object-cover" />
              </div>
              <span className="text-[16px] font-semibold tracking-tight text-foreground">Zenya</span>
            </Link>

            <p className="max-w-sm text-[14px] leading-[1.65] text-muted">
              AI website generator for real businesses. Eight premium templates —
              restaurants, lookbooks, SaaS landing pages, brand stories, and a
              full Shopify one-product engine. Brief in, live site out.
            </p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {['SSL Secured', 'SOC 2 Ready', 'GDPR Aligned'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-token bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Socials */}
            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md border border-token bg-background text-muted transition-colors duration-150',
                    'hover:border-[rgba(94,106,210,0.30)] hover:text-primary'
                  )}
                >
                  <Icon className="h-[15px] w-[15px]" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── Templates (new — communicates the 8 business types) ── */}
          <div className="md:col-span-4">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Templates
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {BUSINESS_TYPE_ORDER.map((key) => {
                const t = auroraTints[key]
                const href = DEMO_HREF[key] || '/themes'
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      className={cn(
                        'group inline-flex items-center gap-2 text-[13.5px] text-muted transition-colors duration-150',
                        'hover:text-foreground'
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: t.accent }}
                      />
                      <span className="truncate">{t.label}</span>
                      <ArrowUpRight
                        className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ── Product ── */}
          <div className="md:col-span-2">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Product
            </h3>
            <ul className="space-y-2.5">
              {PRODUCT.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13.5px] text-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal ── */}
          <div className="md:col-span-1">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {LEGAL.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13.5px] text-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-14 flex flex-col gap-3 border-t border-token pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[12.5px] text-muted">
            © {new Date().getFullYear()} Zenya AI, Inc. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
            Built with
            <Heart className="h-3.5 w-3.5 text-[#dc2626]" aria-hidden fill="currentColor" />
            for makers, founders, and teams worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
