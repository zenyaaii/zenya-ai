import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMPARISONS_EN, getComparisonEn } from '@/lib/comparisons-en'
import {
  Breadcrumbs,
  CompareHero,
  CompareTable,
  ChooseBlocks,
  FaqList,
  CtaBand,
} from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export function generateStaticParams() {
  return COMPARISONS_EN.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getComparisonEn(params.slug)
  if (!c) return {}
  const enUrl = `${SITE}/en/compare/${c.slug}`
  const arUrl = `${SITE}/compare/${c.slug}`
  return {
    title: c.title,
    description: c.metaDescription,
    keywords: [`Zenya vs ${c.themLatin}`, `${c.themLatin} alternative`, 'Arabic website builder', 'AI website builder'],
    alternates: {
      canonical: enUrl,
      languages: { en: enUrl, ar: arUrl, 'x-default': arUrl },
    },
    openGraph: { title: c.title, description: c.metaDescription, url: enUrl, type: 'article', locale: 'en_US' },
    twitter: { card: 'summary_large_image', title: c.title, description: c.metaDescription },
  }
}

export default function ComparePageEn({ params }: { params: { slug: string } }) {
  const c = getComparisonEn(params.slug)
  if (!c) notFound()

  const enUrl = `${SITE}/en/compare/${c.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'en',
      mainEntity: c.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/en` },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE}/en/compare` },
        { '@type': 'ListItem', position: 3, name: `Zenya vs ${c.themLatin}`, item: enUrl },
      ],
    },
  ]

  const others = COMPARISONS_EN.filter((x) => x.slug !== c.slug)

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <Breadcrumbs
          trail={[
            { label: 'Home', href: '/en' },
            { label: 'Compare', href: '/en/compare' },
            { label: `Zenya vs ${c.themLatin}` },
          ]}
        />

        <CompareHero
          kicker="Honest comparison"
          title={
            <>
              Zenya vs <span className="gradient-text">{c.themLatin}</span>
            </>
          }
          intro={c.intro}
        />

        <CompareTable themName={c.themLatin} rows={c.rows} locale="en" />
        <ChooseBlocks themName={c.themLatin} chooseZenya={c.chooseZenya} chooseThem={c.chooseThem} locale="en" />

        <FaqList title={`FAQ — Zenya vs ${c.themLatin}`} faqs={c.faqs} />

        <section className="mt-16">
          <h2 className="mb-5 text-[20px] font-bold text-foreground">More comparisons</h2>
          <div className="flex flex-wrap gap-2.5">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/en/compare/${o.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-medium text-muted transition-all hover:border-[rgba(94,106,210,0.30)] hover:text-foreground"
              >
                Zenya vs {o.themLatin}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
              </Link>
            ))}
          </div>
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
