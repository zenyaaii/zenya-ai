'use client'
import Link from 'next/link'
import { Heart, ArrowUpRight } from 'lucide-react'
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { cn } from '@/lib/utils'
import { openConsent } from '@/components/CookieConsent'
import ZenyaMark from '@/components/ZenyaMark'
import BrandLogo from '@/components/BrandLogo'

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function XIcon2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
  { href: '/themes',     label: 'تصفّح القوالب' },
  { href: '/features',   label: 'الميزات'       },
  { href: '/websites',   label: 'أنواع المواقع' },
  { href: '/pricing',    label: 'الأسعار'       },
  { href: '/compare',    label: 'المقارنات'     },
  { href: '/theme/new',  label: 'ابدأ الإنشاء'  },
  { href: '/about',      label: 'من نحن'        },
  { href: '/faq',        label: 'الأسئلة الشائعة' },
  { href: '/contact',    label: 'تواصل معنا'    },
]

const LEGAL = [
  { href: '/privacy',        label: 'الخصوصية'           },
  { href: '/terms',          label: 'الشروط'             },
  { href: '/cookies',        label: 'ملفات الارتباط'     },
  { href: '/refund',         label: 'الاسترجاع'          },
  { href: '/subprocessors',  label: 'المعالِجون الفرعيون' },
]

const SOCIALS = [
  { label: 'TikTok',    href: 'https://www.tiktok.com/@zenyaai.co',  icon: TikTokIcon    },
  { label: 'Instagram', href: 'https://www.instagram.com/zenyaai.co', icon: InstagramIcon },
  { label: 'X',         href: 'https://x.com/zenyaaico',             icon: XIcon2        },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-[var(--background)] pt-20 pb-10 text-foreground">
      {/* Subtle aurora wash at the very top of the footer for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[300px] -z-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 25% 0%, rgba(94,106,210,0.10), transparent 70%), radial-gradient(ellipse 50% 90% at 80% 0%, rgba(217,119,6,0.07), transparent 70%)',
        }}
      />
      {/* Hairline top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(94,106,210,0.30), transparent)' }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* ── Brand ── */}
          <div className="md:col-span-5">
            <Link href="/" className="mb-4 flex w-fit items-center">
              <ZenyaMark className="h-6 text-foreground" />
            </Link>

            <p className="max-w-sm text-[14px] leading-[1.85] text-muted">
              منشئ مواقع بالذكاء الاصطناعي للأنشطة التجارية الحقيقية. ثمانية قوالب
              احترافية — مطاعم، أزياء، صفحات هبوط للتطبيقات، قصص علامات تجارية،
              مراكز عافية، خدمات، ومتاجر إلكترونية. اكتب نبذة، واحصل على موقع مباشر.
            </p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {['HTTPS', 'متوافق مع GDPR', 'قاعدة بيانات في أوروبا'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted"
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
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted transition-colors duration-150',
                    'hover:border-[rgba(94,106,210,0.55)] hover:bg-[rgba(94,106,210,0.08)] hover:text-foreground'
                  )}
                >
                  <Icon className="h-[15px] w-[15px]" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── Templates (new — communicates the 8 business types) ── */}
          <div className="md:col-span-4">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              القوالب
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
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              المنتج
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
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              قانوني
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
        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[12.5px] text-muted">
            © {new Date().getFullYear()} زينيا. تُدار كمؤسسة فردية هولندية.
            جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <button
              onClick={openConsent}
              className="transition-colors hover:text-foreground"
            >
              تفضيلات ملفات الارتباط
            </button>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              صُنع بحبّ
              <Heart className="h-3.5 w-3.5 text-[#f87171]" aria-hidden fill="currentColor" />
              في الاتحاد الأوروبي.
            </span>
          </div>
        </div>
      </div>

      {/* ── Giant brand signature — the official زينيا logo stretched across the
          foot of the page. Uses the real logo asset once it's dropped at
          /public/brand/wordmark.svg; until then BrandLogo falls back to a
          gradient Cairo rendering so nothing breaks. The thin rule above ties
          the mark to the page. Purely decorative. */}
      <div aria-hidden className="relative z-10 mt-16 w-full select-none">
        <div
          className="mx-6 mb-4 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(28,28,28,0.12), transparent)' }}
        />
        <BrandLogo className="mx-auto w-full max-w-5xl px-6" markClassName="text-[#0d0d0e]" />
      </div>
    </footer>
  )
}
