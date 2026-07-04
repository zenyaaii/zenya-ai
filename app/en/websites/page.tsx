import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TEMPLATE_PAGES_EN } from '@/lib/template-pages-en'
import { themePreview } from '@/lib/theme-previews'
import { Breadcrumbs, CompareHero, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Website Types: Restaurant, App, Store, Services, Wellness & More',
  description:
    'Whatever your business, Zenya has a template: a restaurant website, an app landing page, an online store, a fashion site, a services website, a wellness center, a brand story, or a one-product store. Pick your type and launch with AI in minutes.',
  keywords: ['website types', 'restaurant website', 'app landing page', 'online store', 'services website', 'wellness website', 'ai website builder'],
  alternates: {
    canonical: `${SITE}/en/websites`,
    languages: { en: `${SITE}/en/websites`, ar: `${SITE}/websites`, 'x-default': `${SITE}/websites` },
  },
  openGraph: {
    title: 'Website types Zenya builds',
    description: 'A template for every business: restaurant, app, store, fashion, services, wellness, brand, and one-product — with AI.',
    url: `${SITE}/en/websites`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function WebsitesHubEn() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/en` },
        { '@type': 'ListItem', position: 2, name: 'Templates', item: `${SITE}/en/websites` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Website types in Zenya',
      itemListElement: TEMPLATE_PAGES_EN.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        url: `${SITE}/en/websites/${t.slug}`,
      })),
    },
  ]

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'Home', href: '/en' }, { label: 'Templates' }]} />

        <CompareHero
          kicker="A template for every business"
          title={
            <>
              Whatever your business, Zenya has a <span className="gradient-text">template for it.</span>
            </>
          }
          intro={[
            'Eight professional templates, one per business type — the AI writes their content in Arabic and gets them publish-ready in minutes. Pick your website type to see what it includes and view a live example.',
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_PAGES_EN.map((t) => (
            <Link
              key={t.slug}
              href={`/en/websites/${t.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-token bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_18px_44px_-22px_rgba(28,28,28,0.28)]"
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={themePreview(t.key)} alt={`${t.name} example`} className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                <span className="absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: t.accent }}>
                  {t.label}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="flex items-center justify-between gap-2 text-[15.5px] font-bold capitalize text-foreground">
                  {t.name}
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.75] text-muted">{t.audience}</p>
              </div>
            </Link>
          ))}
        </div>

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
