import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EN_FAQS } from '@/app/(main)/faq/faq-data'
import { FaqList, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'FAQ — Zenya',
  description:
    'Answers about Zenya: how the AI builds your site, which templates exist, what it costs, where sites are hosted, custom domains, Shopify export, and cancelling.',
  keywords: ['Zenya FAQ', 'AI website builder questions', 'Arabic website builder FAQ'],
  alternates: {
    canonical: `${SITE}/en/faq`,
    languages: { en: `${SITE}/en/faq`, ar: `${SITE}/faq`, 'x-default': `${SITE}/faq` },
  },
  openGraph: {
    title: 'Zenya FAQ',
    description: 'How Zenya works, what it costs, where it hosts, and how to leave if you want to.',
    url: `${SITE}/en/faq`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnFaq() {
  /** FAQPage schema so the answers can surface directly in search results. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'en',
    url: `${SITE}/en/faq`,
    mainEntity: EN_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <h1 className="display-ar text-[clamp(32px,5.5vw,52px)] leading-[1.1] text-foreground">
            Questions, <span className="gradient-text">answered straight.</span>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.9] text-muted">
            What Zenya does, what it costs, where your site lives, and how to take it with you if you leave.
          </p>
        </div>

        <FaqList title="Frequently asked questions" faqs={EN_FAQS} />

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/en/pricing"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-primary transition-colors hover:text-foreground"
          >
            See pricing
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-muted transition-colors hover:text-foreground"
          >
            Still stuck? Contact us
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </div>

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
