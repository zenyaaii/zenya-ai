import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check, Eye } from 'lucide-react'
import { ARTICLES_EN, getArticleEn } from '@/lib/why-articles-en'
import { auroraTints } from '@/lib/aurora-tints'
import { Breadcrumbs, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export function generateStaticParams() {
  return ARTICLES_EN.map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticleEn(params.slug)
  if (!a) return {}
  const arTwin = `${SITE}/why/${a.key}`
  const enUrl = `${SITE}/en/why/${a.slug}`
  return {
    title: a.meta.title,
    description: a.meta.description,
    keywords: a.meta.keywords,
    alternates: {
      canonical: enUrl,
      languages: { en: enUrl, ar: arTwin, 'x-default': arTwin },
    },
    openGraph: {
      title: a.meta.title,
      description: a.meta.description,
      url: enUrl,
      type: 'article',
      locale: 'en_US',
    },
  }
}

export default function EnWhyArticle({ params }: { params: { slug: string } }) {
  const a = getArticleEn(params.slug)
  if (!a) notFound()

  const tint = auroraTints[a.key]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    inLanguage: 'en',
    headline: a.hero.h1,
    description: a.meta.description,
    url: `${SITE}/en/why/${a.slug}`,
    author: { '@type': 'Organization', name: 'Zenya' },
    publisher: { '@type': 'Organization', name: 'Zenya' },
  }

  const others = ARTICLES_EN.filter((x) => x.slug !== a.slug).slice(0, 3)

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Breadcrumbs
          trail={[
            { label: 'Home', href: '/en' },
            { label: 'Templates', href: '/en/themes' },
            { label: a.templateName },
          ]}
        />

        <header className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ background: tint?.accent }}
            />
            <span className="text-[11.5px] font-medium uppercase tracking-[0.10em] text-subtle">
              {a.hero.kicker}
            </span>
          </div>
          <h1 className="display-ar text-[clamp(30px,5vw,46px)] leading-[1.14] text-foreground">
            {a.hero.h1}
          </h1>
          <p className="mt-5 text-[17px] leading-[1.9] text-muted">{a.hero.lead}</p>
          <p className="mt-4 text-[12.5px] text-subtle">{a.category}</p>
        </header>

        {/* Cited figures. Every number carries its source by design. */}
        <section className="mt-12 grid gap-3 sm:grid-cols-2">
          {a.stats.map((s) => (
            <div key={s.figure + s.label} className="rounded-2xl border border-token bg-white p-5">
              <div className="text-[28px] font-[590] leading-none tracking-[-1px] gradient-text">
                {s.figure}
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.7] text-foreground">{s.label}</p>
              <p className="mt-1.5 text-[11.5px] text-subtle">Source: {s.source}</p>
            </div>
          ))}
        </section>

        {a.sections.map((sec) => (
          <section key={sec.id} id={sec.id} className="mt-14 scroll-mt-24">
            <h2 className="heading-ar text-[clamp(21px,3.4vw,28px)] text-foreground">{sec.title}</h2>
            {sec.paragraphs.map((p, i) => (
              <p key={i} className="mt-4 text-[15px] leading-[1.95] text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-14">
          <h2 className="heading-ar mb-5 text-[clamp(21px,3.4vw,28px)] text-foreground">
            Before you publish
          </h2>
          <ul className="space-y-2.5">
            {a.checklist.map((c) => (
              <li key={c} className="flex items-start gap-3 rounded-xl border border-token bg-white px-5 py-3.5">
                <Check className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-[#27a644]" strokeWidth={2.75} />
                <span className="text-[13.5px] leading-[1.7] text-foreground">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={a.buildHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
          >
            Build with the {a.templateName} template
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link
            href={a.demoHref}
            className="inline-flex items-center gap-2 rounded-lg border border-token bg-white px-6 py-3 text-[14px] font-medium text-muted transition-colors duration-150 hover:text-foreground"
          >
            <Eye className="h-4 w-4" strokeWidth={2} />
            See the demo
          </Link>
        </div>
        <p className="mt-3 text-[12.5px] text-subtle">
          The demo is a generated Arabic site, shown for layout and depth rather than language.
        </p>

        <section className="mt-16">
          <h2 className="heading-ar mb-5 text-[clamp(19px,3vw,24px)] text-foreground">Keep reading</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/en/why/${o.slug}`}
                className="group rounded-2xl border border-token bg-[var(--surface-2)] p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)]"
              >
                <h3 className="text-[14px] font-bold leading-[1.45] text-foreground">{o.hero.h1}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary">
                  Read
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <CtaBand
          title="Try Zenya free"
          subtitle="Two free generations, no card. Pick a template, write a brief, and see what the AI builds."
          primaryLabel="Start building free"
          secondaryLabel="See pricing"
          secondaryHref="/en/pricing"
        />
      </div>
    </main>
  )
}
