import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Globe, Info } from 'lucide-react'
import { EN_FAQS } from '@/app/(main)/faq/faq-data'
import { FaqList, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Zenya pricing in plain terms. Preview free, unlock two AI generations for a one-time $0.50 (Entry), then Starter at $14.99/month for unlimited generation, a custom domain, bookings and analytics, or Pro at $24.99/month adding a free domain for a year and no Zenya badge.',
  keywords: ['Zenya pricing', 'AI website builder pricing', 'Arabic website builder cost'],
  alternates: {
    canonical: `${SITE}/en/pricing`,
    languages: { en: `${SITE}/en/pricing`, ar: `${SITE}/pricing`, 'x-default': `${SITE}/pricing` },
  },
  openGraph: {
    title: 'Zenya pricing',
    description:
      'Start free, then $14.99/month for unlimited generation or $24.99/month with full hosting and a custom domain.',
    url: `${SITE}/en/pricing`,
    type: 'website',
    locale: 'en_US',
  },
}

type Plan = {
  name: string
  price: string
  cadence?: string
  tagline: string
  features: string[]
  cta: { label: string; href: string }
  note: string
  featured?: boolean
}

/** Mirrors the Arabic pricing page (app/(main)/pricing/page.tsx). Keep in sync. */
const PLANS: Plan[] = [
  {
    name: 'Entry',
    price: '$0.50',
    cadence: 'one-time',
    tagline: 'Build, manage, and publish — try Zenya for next to nothing.',
    features: [
      'Generate two (2) templates with AI — one-time',
      'All eight templates to preview',
      'Publish your site on yourname.zenyaai.co',
      'Every editing and management tool',
      'One-month trial of bookings and site analytics',
      'Community support',
    ],
    cta: { label: 'Start for $0.50', href: '/checkout?plan=entry' },
    note: 'One-time payment. Previewing templates is always free.',
  },
  {
    name: 'Starter',
    price: '$14.99',
    cadence: '/month',
    tagline: 'Build, manage, and publish — no limits, on your own domain.',
    features: [
      'Unlimited AI generation — includes template updates',
      'All eight professional templates',
      'Publish on your own custom domain',
      'Automatic SSL and a fast CDN',
      'Bookings and site analytics — full access',
      'Ready Shopify theme file (Storefront and Collective)',
      'Early access to new templates',
      'Priority support',
    ],
    cta: { label: 'Choose Starter', href: '/pricing#plan-starter' },
    note: 'Cancel anytime.',
    featured: true,
  },
  {
    name: 'Pro',
    price: '$24.99',
    cadence: '/month',
    tagline: 'Build, manage, and publish — everything included, domain on us.',
    features: [
      'Everything in Starter, plus:',
      'A custom domain free for one year on standard extensions',
      '30% off pricier domains such as .com',
      'The "Made with Zenya" badge removed',
      'Full management of your site and domain',
      'Top priority support',
    ],
    cta: { label: 'Choose Pro', href: '/pricing#plan-pro' },
    note: 'Cancel anytime. Your site stays live until the end of the month.',
  },
]

/**
 * Only the money questions belong here. The full set lives at /en/faq, which
 * also owns the FAQPage schema, so this page shows a subset and links onward
 * rather than duplicating that page.
 */
const PRICING_FAQ_QUESTIONS = new Set([
  'How much does Zenya cost?',
  'Can I cancel anytime?',
  'Can I connect my own custom domain?',
  'Where are sites hosted, and what about privacy?',
])

const PRICING_FAQS = EN_FAQS.filter((f) => PRICING_FAQ_QUESTIONS.has(f.q))

export default function EnPricing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    inLanguage: 'en',
    name: 'Zenya pricing',
    url: `${SITE}/en/pricing`,
    description:
      'Zenya plans: free to try, Starter at $14.99 per month, Pro at $24.99 per month with hosting and a custom domain.',
  }

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        {/* Hero */}
        <div className="max-w-2xl">
          <h1 className="display-ar text-[clamp(32px,5.5vw,52px)] leading-[1.1] text-foreground">
            Pricing, <span className="gradient-text">without the asterisks.</span>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.9] text-muted">
            Preview the templates for free. Unlock two AI generations for a one-time $0.50, then upgrade to
            Starter or Pro once you have seen the site the AI writes for your business.
          </p>
        </div>

        {/* Plans */}
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-2xl bg-white p-7"
              style={
                plan.featured
                  ? { border: '1px solid #5e6ad2', boxShadow: '0 0 0 1px #5e6ad2, 0 8px 24px rgba(94,106,210,0.16)' }
                  : { border: '1px solid var(--border)' }
              }
            >
              <p
                className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  plan.featured ? 'text-primary' : 'text-muted'
                }`}
              >
                {plan.name}
              </p>

              <div className="mb-2 flex items-baseline gap-1">
                <span
                  className={`text-[40px] font-[590] leading-none tracking-[-1.4px] ${
                    plan.featured ? 'gradient-text' : 'text-foreground'
                  }`}
                >
                  {plan.price}
                </span>
                {plan.cadence && <span className="text-[15px] text-muted">{plan.cadence}</span>}
              </div>
              <p className="mb-6 text-[13.5px] leading-[1.7] text-muted">{plan.tagline}</p>

              <ul className="mb-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-primary" strokeWidth={2.75} />
                    <span className="text-[13px] leading-[1.6] text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={
                  plan.featured
                    ? 'block w-full rounded-lg bg-primary py-3 text-center text-[14px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5'
                    : 'block w-full rounded-lg border border-token bg-background py-3 text-center text-[14px] font-medium text-muted transition-all duration-150 hover:text-foreground'
                }
              >
                {plan.cta.label}
              </Link>
              <p className="mt-2.5 text-center text-[12px] leading-[1.6] text-muted">{plan.note}</p>
            </div>
          ))}
        </div>

        {/* Domain detail: the one part of Pro that needs a sentence of nuance */}
        <div
          className="mt-8 flex items-start gap-3 rounded-2xl px-5 py-4"
          style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)' }}
        >
          <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
          <p className="text-[13px] leading-[1.75] text-amber-700">
            The free Pro domain covers standard extensions such as{' '}
            <span dir="ltr">.store .site .online .shop .xyz .club</span> for a full year. Pricier or premium
            names such as .com are discounted 30% instead.
          </p>
        </div>

        {/* Language expectation. Better said plainly than discovered at signup. */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-token bg-[var(--surface-2)] px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" strokeWidth={2} aria-hidden />
          <p className="text-[13px] leading-[1.75] text-muted">
            Worth knowing before you sign up: Zenya is Arabic-first. The builder, the dashboard, and the
            websites it generates are in Arabic and laid out right-to-left. These English pages describe the
            product; the product itself speaks Arabic.
          </p>
        </div>

        {/* Where the money actually goes */}
        <section className="mt-16">
          <h2 className="heading-ar mb-6 text-[clamp(22px,3.6vw,32px)] text-foreground">
            What you are paying for
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'AI that writes, not just fills',
                body: 'Every generation writes real copy for your business from your brief: headlines, sections, FAQs, and calls to action.',
              },
              {
                title: 'Hosting you do not manage',
                body: 'EU infrastructure with automatic SSL, a CDN, and GDPR compliance. No servers, no renewals, no plugins.',
              },
              {
                title: 'A domain that is yours',
                body: 'Pro includes a custom domain free for the first year, and the site keeps working if you later point a different one at it.',
              },
              {
                title: 'An exit, not a lock-in',
                body: 'Store templates export as real Shopify themes, and the other templates download as a project you can host anywhere.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-token bg-white p-6">
                <h3 className="mb-1.5 text-[15px] font-bold text-foreground">{item.title}</h3>
                <p className="text-[13.5px] leading-[1.8] text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <FaqList title="Pricing questions" faqs={PRICING_FAQS} />

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/en/faq"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-primary transition-colors hover:text-foreground"
          >
            Read the full FAQ
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <Link
            href="/en/compare"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-muted transition-colors hover:text-foreground"
          >
            Compare Zenya to Wix, Shopify, and agencies
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </div>

        <CtaBand
          title="Start building with Zenya"
          subtitle="Preview free, then unlock two AI generations for a one-time $0.50. Pick a template, write a brief, and see what the AI builds."
          primaryLabel="Get started"
          secondaryLabel="Browse templates"
          secondaryHref="/en/websites"
        />
      </div>
    </main>
  )
}
