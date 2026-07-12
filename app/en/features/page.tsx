import type { Metadata } from 'next'
import { Sparkles, Languages, LayoutTemplate, Server, Globe, CreditCard, PencilRuler, BarChart3, Search, Gauge } from 'lucide-react'
import { Breadcrumbs, CompareHero, FaqList, CtaBand } from '@/components/marketing/CompareParts'
import type { QA } from '@/app/(main)/faq/faq-data'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Zenya Features: AI Content, Hosting, Domains & Payments',
  description:
    'Everything Zenya offers: Arabic content written by AI, 8 templates per business type, EU hosting with SSL and GDPR, a free custom domain on Pro, export to Shopify with secure payments, a live editor, analytics, and SEO-readiness.',
  keywords: ['zenya features', 'ai website builder features', 'arabic website hosting', 'custom domain', 'accept payments website', 'gdpr hosting'],
  alternates: {
    canonical: `${SITE}/en/features`,
    languages: { en: `${SITE}/en/features`, ar: `${SITE}/features`, 'x-default': `${SITE}/features` },
  },
  openGraph: {
    title: 'Zenya Features — AI content, hosting, domains, and payments',
    description: 'AI Arabic content, 8 templates, EU hosting + SSL + GDPR, custom domain, Shopify export with secure payments, live editor, and analytics.',
    url: `${SITE}/en/features`,
    type: 'website',
    locale: 'en_US',
  },
}

type Feature = { icon: typeof Sparkles; title: string; body: string }

const FEATURES: Feature[] = [
  { icon: Sparkles, title: 'AI-written content', body: 'Write a short brief about your business and the AI writes all of your site copy in fluent Arabic — headlines, descriptions, calls to action — which you then edit with simple instructions.' },
  { icon: Languages, title: 'Arabic-first · right-to-left', body: 'Zenya is built for Arabic from the ground up: RTL layout, Arabic-designed fonts, and authentic content — not a bolted-on translation of an English template.' },
  { icon: LayoutTemplate, title: 'Eight templates per business type', body: 'Restaurant, fashion lookbook, app landing page, brand story, wellness center, services, multi-product store, and single-product storefront. Pick what fits and start.' },
  { icon: Server, title: 'EU hosting · SSL · GDPR', body: 'On the Pro plan, Zenya hosts your site inside the European Union with automatic SSL and full GDPR compliance — with no technical setup from you.' },
  { icon: Globe, title: 'Free custom domain', body: 'Connect your own domain (like mystore.com) on Pro with SSL and no Zenya badge — and get a free custom domain for a full year (standard domain).' },
  { icon: CreditCard, title: 'E-commerce and secure payments', body: 'The store templates export as ready Shopify themes that run on your store, where Shopify handles the cart, secure checkout, and products. You get content written for you and reliable payments.' },
  { icon: PencilRuler, title: 'A simple live editor', body: 'Edit your site yourself with plain instructions, with undo/redo, autosave, and a responsive preview for every screen — no code.' },
  { icon: BarChart3, title: 'Visitor analytics', body: 'Track your site’s visitors, their sources, and their devices from a simple dashboard — so you know what works and improve it.' },
  { icon: Search, title: 'SEO-ready', body: 'Every site ships with clean search-engine structure: automatic titles and descriptions, structured data, and fast loading — so your business shows up on Google.' },
  { icon: Gauge, title: 'Fast and responsive', body: 'Light, fast sites that run smoothly on mobile and desktop, because site speed and experience directly affect visitor trust and your search ranking.' },
]

const FEATURE_FAQS: QA[] = [
  { q: 'Does Zenya host my site?', a: 'Yes, on the Pro plan. Zenya hosts your site inside the European Union with automatic SSL and GDPR compliance, with no technical setup from you.' },
  { q: 'Can I connect my own domain?', a: 'Yes on Pro, with SSL and no Zenya badge. We also include a free custom domain for a full year (standard domain), and 30% off any other domain.' },
  { q: 'Can my site accept payments?', a: 'For stores, the commerce template exports to Shopify, which handles the cart and secure checkout. Brochure sites (restaurants, services, wellness) are hosted by Zenya.' },
  { q: 'How much does Zenya cost?', a: 'Free to try (two generations), then Starter at $14.99/month, and Pro at $24.99/month adding full hosting and a custom domain.' },
]

export default function FeaturesPageEn() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/en` },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE}/en/features` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'en',
      mainEntity: FEATURE_FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'Home', href: '/en' }, { label: 'Features' }]} />

        <CompareHero
          kicker="Everything you need"
          title={
            <>
              Everything to launch your site — <span className="gradient-text">written and hosted for you.</span>
            </>
          }
          intro={[
            'Zenya is more than templates. From AI-written content to EU hosting, a custom domain, and secure payments — everything your business needs to look professional, in one place.',
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-2xl border border-token bg-white p-5">
                <span className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h2 className="mb-1.5 text-[15.5px] font-bold text-foreground">{f.title}</h2>
                <p className="text-[13.5px] leading-[1.8] text-muted">{f.body}</p>
              </div>
            )
          })}
        </div>

        <FaqList title="Feature FAQ" faqs={FEATURE_FAQS} />

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
