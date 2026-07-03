import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { COMPARISONS, getComparison } from '@/lib/comparisons'
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
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getComparison(params.slug)
  if (!c) return {}
  const url = `${SITE}/compare/${c.slug}`
  return {
    title: c.title,
    description: c.metaDescription,
    keywords: [
      `زينيا مقابل ${c.them}`,
      `Zenya vs ${c.themLatin}`,
      `${c.them} بديل`,
      `أفضل من ${c.them}`,
      'منشئ مواقع بالذكاء الاصطناعي',
      'منشئ مواقع عربي',
    ],
    alternates: { canonical: url },
    openGraph: {
      title: c.title,
      description: c.metaDescription,
      url,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: c.title, description: c.metaDescription },
  }
}

export default function ComparePage({ params }: { params: { slug: string } }) {
  const c = getComparison(params.slug)
  if (!c) notFound()

  const url = `${SITE}/compare/${c.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
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
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'المقارنات', item: `${SITE}/compare` },
        { '@type': 'ListItem', position: 3, name: `زينيا مقابل ${c.them}`, item: url },
      ],
    },
  ]

  // Sibling comparisons for internal linking.
  const others = COMPARISONS.filter((x) => x.slug !== c.slug)

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <Breadcrumbs
          trail={[
            { label: 'الرئيسية', href: '/' },
            { label: 'المقارنات', href: '/compare' },
            { label: `زينيا مقابل ${c.them}` },
          ]}
        />

        <CompareHero
          kicker="مقارنة صريحة"
          title={
            <>
              زينيا مقابل <span className="gradient-text">{c.them}</span>
            </>
          }
          intro={c.intro}
        />

        <CompareTable themName={c.them} rows={c.rows} />
        <ChooseBlocks themName={c.them} chooseZenya={c.chooseZenya} chooseThem={c.chooseThem} />

        <FaqList title={`أسئلة شائعة — زينيا مقابل ${c.them}`} faqs={c.faqs} />

        {/* Internal links to the other comparisons — helps crawl depth + users */}
        <section className="mt-16">
          <h2 className="heading-ar mb-5 text-[20px] text-foreground">مقارنات أخرى</h2>
          <div className="flex flex-wrap gap-2.5">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/compare/${o.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-medium text-muted transition-all hover:border-[rgba(94,106,210,0.30)] hover:text-foreground"
              >
                زينيا مقابل {o.them}
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.25} />
              </Link>
            ))}
          </div>
        </section>

        <CtaBand />
      </div>
    </main>
  )
}
