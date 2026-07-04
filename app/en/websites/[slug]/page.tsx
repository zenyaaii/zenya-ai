import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowRight, Eye } from 'lucide-react'
import { TEMPLATE_PAGES_EN, getTemplatePageEn } from '@/lib/template-pages-en'
import { themePreview } from '@/lib/theme-previews'
import { Breadcrumbs, FaqList, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export function generateStaticParams() {
  return TEMPLATE_PAGES_EN.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = getTemplatePageEn(params.slug)
  if (!t) return {}
  const enUrl = `${SITE}/en/websites/${t.slug}`
  const arUrl = `${SITE}/websites/${t.slug}`
  return {
    title: t.title,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: { canonical: enUrl, languages: { en: enUrl, ar: arUrl, 'x-default': arUrl } },
    openGraph: {
      title: t.title,
      description: t.metaDescription,
      url: enUrl,
      type: 'website',
      locale: 'en_US',
      images: [{ url: themePreview(t.key), width: 1200, height: 630, alt: t.name }],
    },
    twitter: { card: 'summary_large_image', title: t.title, description: t.metaDescription },
  }
}

export default function TemplateLandingPageEn({ params }: { params: { slug: string } }) {
  const t = getTemplatePageEn(params.slug)
  if (!t) notFound()

  const enUrl = `${SITE}/en/websites/${t.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/en` },
        { '@type': 'ListItem', position: 2, name: 'Templates', item: `${SITE}/en/websites` },
        { '@type': 'ListItem', position: 3, name: t.name, item: enUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'en',
      mainEntity: t.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  const others = TEMPLATE_PAGES_EN.filter((x) => x.slug !== t.slug)

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'Home', href: '/en' }, { label: 'Templates', href: '/en/websites' }, { label: t.name }]} />

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <header>
            <p className="kicker mb-3">{t.label} template</p>
            <h1 className="display-ar text-[clamp(30px,5vw,50px)] text-foreground">{t.h1}</h1>
            <div className="mt-5 space-y-3">
              {t.intro.map((p, i) => (
                <p key={i} className="text-[15.5px] leading-[1.9] text-muted">{p}</p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5">
                Build a {t.name} free
              </Link>
              <Link href={t.demoHref} className="inline-flex items-center gap-2 rounded-lg border border-token bg-white px-6 py-3 text-[14px] font-medium text-muted transition-all duration-200 hover:text-foreground">
                <Eye className="h-4 w-4" strokeWidth={2} />
                See a live example
              </Link>
            </div>
          </header>

          <div className="overflow-hidden rounded-2xl border border-token bg-white" style={{ boxShadow: `0 30px 70px -30px ${t.accent}55` }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ background: '#faf8f3', borderBottom: '1px solid #f0ede6' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: '#fca5a5' }} />
              <span className="h-2 w-2 rounded-full" style={{ background: '#fcd34d' }} />
              <span className="h-2 w-2 rounded-full" style={{ background: '#86efac' }} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={themePreview(t.key)} alt={`Zenya ${t.name} example`} className="h-auto w-full object-cover" loading="eager" />
          </div>
        </div>

        <section className="mt-16">
          <h2 className="mb-6 text-[clamp(22px,3.6vw,32px)] font-bold text-foreground">What’s included in a {t.name}?</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {t.includes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 rounded-xl border border-token bg-white px-4 py-3.5 text-[14px] text-foreground">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(39,166,68,0.12)]">
                  <Check className="h-3 w-3 text-[#27a644]" strokeWidth={2.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-token bg-[var(--surface-2)] p-6 sm:p-8">
          <h2 className="mb-2 text-[20px] font-bold text-foreground">Who is this template for?</h2>
          <p className="text-[15px] leading-[1.9] text-muted">{t.audience}</p>
        </section>

        <FaqList title={`FAQ — ${t.name}`} faqs={t.faqs} />

        <section className="mt-16">
          <h2 className="mb-5 text-[20px] font-bold text-foreground">Other website types</h2>
          <div className="flex flex-wrap gap-2.5">
            {others.map((o) => (
              <Link key={o.slug} href={`/en/websites/${o.slug}`} className="group inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-medium text-muted transition-all hover:border-[rgba(94,106,210,0.30)] hover:text-foreground">
                {o.name}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
              </Link>
            ))}
          </div>
        </section>

        <CtaBand
          title={`Build a ${t.name} in minutes`}
          subtitle="Pick a template, write a brief, and get a professional site in minutes. No card required."
          primaryLabel="Start building free"
          secondaryLabel="See pricing"
        />
      </div>
    </main>
  )
}
