import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Eye } from 'lucide-react'
import { TEMPLATE_PAGES, getTemplatePage } from '@/lib/template-pages'
import { themePreview } from '@/lib/theme-previews'
import { Breadcrumbs, FaqList, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export function generateStaticParams() {
  return TEMPLATE_PAGES.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = getTemplatePage(params.slug)
  if (!t) return {}
  const url = `${SITE}/websites/${t.slug}`
  return {
    title: t.title,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: {
      canonical: url,
      languages: { ar: url, en: `${SITE}/en/websites/${t.slug}`, 'x-default': url },
    },
    openGraph: {
      title: t.title,
      description: t.metaDescription,
      url,
      type: 'website',
      images: [{ url: themePreview(t.key), width: 1200, height: 630, alt: t.name }],
    },
    twitter: { card: 'summary_large_image', title: t.title, description: t.metaDescription },
  }
}

export default function TemplateLandingPage({ params }: { params: { slug: string } }) {
  const t = getTemplatePage(params.slug)
  if (!t) notFound()

  const url = `${SITE}/websites/${t.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'أنواع المواقع', item: `${SITE}/websites` },
        { '@type': 'ListItem', position: 3, name: t.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  const others = TEMPLATE_PAGES.filter((x) => x.slug !== t.slug)

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Breadcrumbs
          trail={[
            { label: 'الرئيسية', href: '/' },
            { label: 'أنواع المواقع', href: '/websites' },
            { label: t.name },
          ]}
        />

        {/* Hero: copy + live preview image */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <header>
            <p className="kicker mb-3">قالب {t.label}</p>
            <h1 className="display-ar text-[clamp(30px,5vw,50px)] text-foreground">{t.h1}</h1>
            <div className="mt-5 space-y-3">
              {t.intro.map((p, i) => (
                <p key={i} className="text-[15.5px] leading-[1.95] text-muted">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
              >
                أنشئ {t.name} مجانًا
              </Link>
              <Link
                href={t.demoHref}
                className="inline-flex items-center gap-2 rounded-lg border border-token bg-white px-6 py-3 text-[14px] font-medium text-muted transition-all duration-200 hover:text-foreground"
              >
                <Eye className="h-4 w-4" strokeWidth={2} />
                شاهد نموذجًا حيًّا
              </Link>
            </div>
          </header>

          <div
            className="overflow-hidden rounded-2xl border border-token bg-white"
            style={{ boxShadow: `0 30px 70px -30px ${t.accent}55` }}
          >
            <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ background: '#faf8f3', borderBottom: '1px solid #f0ede6' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: '#fca5a5' }} />
              <span className="h-2 w-2 rounded-full" style={{ background: '#fcd34d' }} />
              <span className="h-2 w-2 rounded-full" style={{ background: '#86efac' }} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={themePreview(t.key)} alt={`نموذج ${t.name} من زينيا`} className="h-auto w-full object-cover" loading="eager" />
          </div>
        </div>

        {/* What's included */}
        <section className="mt-16">
          <h2 className="heading-ar mb-6 text-[clamp(22px,3.6vw,32px)] text-foreground">
            ماذا يتضمّن {t.name}؟
          </h2>
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

        {/* Who it's for */}
        <section className="mt-10 rounded-2xl border border-token bg-[var(--surface-2)] p-6 sm:p-8">
          <h2 className="heading-ar mb-2 text-[20px] text-foreground">لمن هذا القالب؟</h2>
          <p className="text-[15px] leading-[1.9] text-muted">{t.audience}</p>
        </section>

        <FaqList title={`أسئلة شائعة عن ${t.name}`} faqs={t.faqs} />

        {/* Cross-links to the other template pages */}
        <section className="mt-16">
          <h2 className="heading-ar mb-5 text-[20px] text-foreground">أنواع مواقع أخرى</h2>
          <div className="flex flex-wrap gap-2.5">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/websites/${o.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-medium text-muted transition-all hover:border-[rgba(94,106,210,0.30)] hover:text-foreground"
              >
                {o.name}
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.25} />
              </Link>
            ))}
          </div>
        </section>

        <CtaBand title={`أنشئ ${t.name} خلال دقائق`} />
      </div>
    </main>
  )
}
