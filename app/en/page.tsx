import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Sparkles, Check } from 'lucide-react'
import { EN_FAQS } from '@/app/(main)/faq/faq-data'
import { TEMPLATE_PAGES_EN } from '@/lib/template-pages-en'
import { FaqList, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Zenya — The Arabic-First AI Website Builder',
  description:
    'Zenya is an Arabic-first AI website builder. Pick one of 8 business templates, write a short brief, and the AI writes the copy and designs a professional, publish-ready website in minutes. EU hosting, custom domain, and Shopify export included.',
  keywords: ['Arabic website builder', 'AI website builder', 'Arabic AI website builder', 'RTL website builder', 'no-code website builder'],
  alternates: {
    canonical: `${SITE}/en`,
    languages: { en: `${SITE}/en`, ar: `${SITE}/`, 'x-default': `${SITE}/` },
  },
  openGraph: {
    title: 'Zenya — The Arabic-first AI website builder',
    description: 'Pick a template, write a brief, and get a professional Arabic website in minutes. AI writes the content; Zenya hosts it.',
    url: `${SITE}/en`,
    type: 'website',
    locale: 'en_US',
  },
}

const VALUE = [
  { title: 'Arabic-first, RTL by default', body: 'Content, fonts, and layout built for Arabic from the ground up — not a bolted-on translation.' },
  { title: 'The AI writes your site', body: 'From a short brief to a full site with copy and design, ready to publish in minutes.' },
  { title: 'Hosted and managed for you', body: 'EU hosting with SSL and GDPR, plus a custom domain on Pro — no technical setup.' },
  { title: 'Commerce, done right', body: 'Store templates export to Shopify, which handles the cart and secure checkout.' },
]

export default function EnHome() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    inLanguage: 'en',
    name: 'Zenya — The Arabic-first AI website builder',
    url: `${SITE}/en`,
    description:
      'Zenya is an Arabic-first AI website builder: pick a template, write a brief, and get a professional site in minutes.',
  }

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        {/* Hero */}
        <div className="max-w-3xl">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium" style={{ background: 'rgba(94,106,210,0.07)', border: '1px solid rgba(94,106,210,0.20)', color: '#5e6ad2' }}>
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            8 templates · AI-written · ready in minutes
          </span>
          <h1 className="display-ar text-[clamp(34px,6vw,60px)] leading-[1.1] text-foreground">
            The Arabic-first <span className="gradient-text">AI website builder.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.9] text-muted">
            Pick one of 8 business templates, write a short brief, and Zenya’s AI writes the copy, chooses the design,
            and lays out the sections — a professional, publish-ready website in minutes. Arabic and right-to-left are
            built in, not bolted on.
          </p>
          <p className="mt-3 text-[14px] text-subtle">Free to try · then $14.99/mo (Starter) or $24.99/mo with full hosting (Pro).</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/en/websites" className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[14.5px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5">
              Start building free
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link href="/en/websites" className="inline-flex items-center gap-2 rounded-lg border border-token bg-white px-7 py-3.5 text-[14.5px] font-medium text-muted transition-all duration-200 hover:text-foreground">
              Browse templates
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {['Free to try · no card', '1 year free domain on Pro', 'EU hosting · GDPR'].map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <Check className="h-3.5 w-3.5 text-[#27a644]" strokeWidth={2.5} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {VALUE.map((v) => (
            <div key={v.title} className="rounded-2xl border border-token bg-white p-6">
              <h2 className="mb-1.5 text-[16px] font-bold text-foreground">{v.title}</h2>
              <p className="text-[14px] leading-[1.85] text-muted">{v.body}</p>
            </div>
          ))}
        </div>

        {/* Explore */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/en/features', title: 'Features', body: 'Hosting, domains, payments, AI content, analytics, and more.' },
            { href: '/en/websites', title: 'Website types', body: 'Restaurant, app, store, services, wellness, and more.' },
            { href: '/en/compare', title: 'Compare', body: 'Zenya vs Wix, Shopify, WordPress, Squarespace, and agencies.' },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="group rounded-2xl border border-token bg-[var(--surface-2)] p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)]">
              <h3 className="flex items-center justify-between text-[15px] font-bold text-foreground">
                {c.title}
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.7] text-muted">{c.body}</p>
            </Link>
          ))}
        </div>

        {/* Template quick links for crawl depth */}
        <div className="mt-10 flex flex-wrap gap-2.5">
          {TEMPLATE_PAGES_EN.map((t) => (
            <Link key={t.slug} href={`/en/websites/${t.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-3.5 py-1.5 text-[12.5px] font-medium capitalize text-muted transition-all hover:border-[rgba(94,106,210,0.30)] hover:text-foreground">
              {t.name}
            </Link>
          ))}
        </div>

        <FaqList title="Frequently asked questions" faqs={EN_FAQS} />

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
