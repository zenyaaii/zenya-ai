import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMPARISONS_EN } from '@/lib/comparisons-en'
import { Breadcrumbs, CompareHero, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Zenya vs Wix, Shopify, WordPress, Squarespace & Agencies',
  description:
    'How does Zenya compare to popular website builders and alternatives? Honest comparisons with Wix, Shopify, WordPress, Squarespace, and agencies — on Arabic/RTL support, AI content, price, and time to launch.',
  keywords: [
    'best Arabic website builder',
    'best AI website builder',
    'Wix alternative',
    'Shopify alternative',
    'WordPress alternative',
    'website builder comparison',
  ],
  alternates: {
    canonical: `${SITE}/en/compare`,
    languages: { en: `${SITE}/en/compare`, ar: `${SITE}/compare`, 'x-default': `${SITE}/compare` },
  },
  openGraph: {
    title: 'Zenya vs the competition — honest comparisons',
    description: 'Honest comparisons of Zenya with Wix, Shopify, WordPress, Squarespace, and agencies.',
    url: `${SITE}/en/compare`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function CompareHubEn() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/en` },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE}/en/compare` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Zenya vs the competition',
      itemListElement: COMPARISONS_EN.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Zenya vs ${c.themLatin}`,
        url: `${SITE}/en/compare/${c.slug}`,
      })),
    },
  ]

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'Home', href: '/en' }, { label: 'Compare' }]} />

        <CompareHero
          kicker="Zenya vs others"
          title={
            <>
              Why do people choose <span className="gradient-text">Zenya</span>?
            </>
          }
          intro={[
            'Most website builders are global and English-first: they give you tools, but you design and write everything yourself. Zenya is Arabic-first, and its AI writes your site and lays out its sections from a short brief — so you launch in minutes.',
            'We compared Zenya honestly with the most popular alternatives. Each comparison explains the differences in detail and says clearly when the competitor is the better pick for you.',
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {COMPARISONS_EN.map((c) => (
            <Link
              key={c.slug}
              href={`/en/compare/${c.slug}`}
              className="group flex flex-col rounded-2xl border border-token bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_16px_40px_-20px_rgba(28,28,28,0.25)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-foreground">Zenya vs {c.themLatin}</h2>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">{c.summary}</p>
            </Link>
          ))}
        </div>

        <section className="mt-14 rounded-2xl border border-token bg-[var(--surface-2)] p-6 sm:p-8">
          <h2 className="mb-4 text-[20px] font-bold text-foreground">The bottom line</h2>
          <ul className="space-y-3 text-[14px] leading-[1.9] text-muted">
            <li><span className="font-semibold text-foreground">Arabic-first:</span> RTL layout, Arabic fonts, and content built for Arabic — not a bolted-on translation.</li>
            <li><span className="font-semibold text-foreground">The AI writes for you:</span> from a short brief to a full site with copy and design.</li>
            <li><span className="font-semibold text-foreground">Ready in minutes:</span> no weeks of waiting and no maintenance.</li>
            <li><span className="font-semibold text-foreground">Fully managed:</span> EU hosting + SSL + GDPR, and a custom domain on Pro.</li>
            <li><span className="font-semibold text-foreground">Affordable:</span> free to try, then $14.99–$24.99/month.</li>
          </ul>
        </section>

        <CtaBand
          title="Try Zenya free"
          subtitle="Pick a template, write a brief, and get a professional site in minutes. No card required."
          primaryLabel="Start building free"
          secondaryLabel="See pricing"
        />
      </div>
    </main>
  )
}
