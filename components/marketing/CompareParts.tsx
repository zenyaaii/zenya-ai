import Link from 'next/link'
import { Check } from 'lucide-react'
import type { CompareRow } from '@/lib/comparisons'
import type { QA } from '@/app/(main)/faq/faq-data'

/**
 * Server-rendered building blocks for the SEO comparison + feature pages.
 * Everything here is plain HTML (no client JS) so the content lives in the
 * initial markup — the best shape for Google and for AI assistants that read
 * the page. The FAQ uses native <details> so it's an accordion without any
 * hydration.
 */

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="مسار التنقّل" className="mb-6 text-[12.5px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((t, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {t.href ? (
              <Link href={t.href} className="transition-colors hover:text-foreground">
                {t.label}
              </Link>
            ) : (
              <span className="text-foreground">{t.label}</span>
            )}
            {i < trail.length - 1 && <span aria-hidden className="text-subtle">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function CompareHero({
  kicker,
  title,
  intro,
}: {
  kicker: string
  title: React.ReactNode
  intro: string[]
}) {
  return (
    <header className="mb-12 max-w-3xl">
      <p className="kicker mb-3">{kicker}</p>
      <h1 className="display-ar text-[clamp(30px,5.5vw,52px)] text-foreground">{title}</h1>
      <div className="mt-5 space-y-3">
        {intro.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.95] text-muted">
            {p}
          </p>
        ))}
      </div>
    </header>
  )
}

/** Head-to-head table. `themName` labels the competitor column. */
export function CompareTable({
  themName,
  rows,
  locale = 'ar',
}: {
  themName: string
  rows: CompareRow[]
  locale?: 'ar' | 'en'
}) {
  const t =
    locale === 'en'
      ? { caption: `Zenya vs ${themName} compared`, item: 'Feature', zenya: 'Zenya' }
      : { caption: `مقارنة زينيا مقابل ${themName}`, item: 'البند', zenya: 'زينيا' }
  return (
    <div className="overflow-hidden rounded-2xl border border-token bg-white">
      <table className="w-full border-collapse text-start">
        <caption className="sr-only">{t.caption}</caption>
        <thead>
          <tr className="border-b border-token bg-[var(--surface-2)]">
            <th scope="col" className="px-4 py-3 text-start text-[12.5px] font-semibold text-subtle">
              {t.item}
            </th>
            <th scope="col" className="px-4 py-3 text-start text-[13.5px] font-bold text-primary">
              {t.zenya}
            </th>
            <th scope="col" className="px-4 py-3 text-start text-[13.5px] font-bold text-foreground">
              {themName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-token last:border-0 align-top">
              <th scope="row" className="px-4 py-3.5 text-start text-[13px] font-semibold text-foreground">
                {r.label}
              </th>
              <td
                className="px-4 py-3.5 text-[13px] leading-[1.7] text-foreground"
                style={{ background: 'rgba(94,106,210,0.05)' }}
              >
                <span className="flex items-start gap-1.5">
                  {r.zenyaWins && (
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(39,166,68,0.14)]">
                      <Check className="h-2.5 w-2.5 text-[#27a644]" strokeWidth={3} />
                    </span>
                  )}
                  {r.zenya}
                </span>
              </td>
              <td className="px-4 py-3.5 text-[13px] leading-[1.7] text-muted">{r.them}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** "When to choose which" — an honest two-up so the page never reads as a
 *  one-sided ad. */
export function ChooseBlocks({
  themName,
  chooseZenya,
  chooseThem,
  locale = 'ar',
}: {
  themName: string
  chooseZenya: string
  chooseThem: string
  locale?: 'ar' | 'en'
}) {
  const h =
    locale === 'en'
      ? { zenya: 'When to choose Zenya', them: `When to choose ${themName}` }
      : { zenya: 'متى تختار زينيا', them: `متى تختار ${themName}` }
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2">
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'rgba(94,106,210,0.30)', background: 'rgba(94,106,210,0.05)' }}
      >
        <h3 className="mb-2 text-[15px] font-bold text-primary">{h.zenya}</h3>
        <p className="text-[14px] leading-[1.9] text-foreground">{chooseZenya}</p>
      </div>
      <div className="rounded-2xl border border-token bg-white p-5">
        <h3 className="mb-2 text-[15px] font-bold text-foreground">{h.them}</h3>
        <p className="text-[14px] leading-[1.9] text-muted">{chooseThem}</p>
      </div>
    </div>
  )
}

/** Crawlable FAQ (native details/summary, no client JS). */
export function FaqList({ title, faqs }: { title: string; faqs: QA[] }) {
  return (
    <section className="mt-16">
      <h2 className="heading-ar mb-6 text-[clamp(22px,3.6vw,32px)] text-foreground">{title}</h2>
      <div className="space-y-2.5">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-token bg-white px-5 py-4 open:border-[rgba(94,106,210,0.30)] open:bg-[rgba(94,106,210,0.04)]"
          >
            <summary className="cursor-pointer list-none text-[14.5px] font-[510] text-foreground marker:hidden">
              {f.q}
            </summary>
            <p className="mt-3 text-[13.5px] leading-[1.85] text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/** Closing call-to-action band, reused across SEO pages. */
export function CtaBand({
  title = 'جرّب زينيا مجانًا الآن',
  subtitle = 'اختر قالبًا، اكتب نبذة، واحصل على موقع عربي احترافي خلال دقائق. بلا بطاقة.',
  primaryLabel = 'ابدأ الإنشاء مجانًا',
  secondaryLabel = 'شاهد الأسعار',
  secondaryHref = '/pricing',
}: {
  title?: string
  subtitle?: string
  primaryLabel?: string
  secondaryLabel?: string
  secondaryHref?: string
}) {
  return (
    <section className="mt-20 overflow-hidden rounded-3xl border border-token bg-white p-8 text-center sm:p-12">
      <h2 className="display-ar text-[clamp(24px,4vw,38px)] text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-[15px] leading-[1.9] text-muted">{subtitle}</p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[14.5px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex items-center gap-2 rounded-lg border border-token bg-white px-7 py-3.5 text-[14.5px] font-medium text-muted transition-all duration-200 hover:text-foreground"
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  )
}
