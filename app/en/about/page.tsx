import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Layers, Zap, Languages, ShieldCheck } from 'lucide-react'
import { CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why Zenya exists: small businesses in the Arab world were stuck choosing between a cheap site that looks it and an agency that costs thousands. Zenya is the third option, built Arabic-first and hosted in the EU.',
  keywords: ['about Zenya', 'Arabic AI website builder', 'Zenya company'],
  alternates: {
    canonical: `${SITE}/en/about`,
    languages: { en: `${SITE}/en/about`, ar: `${SITE}/about`, 'x-default': `${SITE}/about` },
  },
  openGraph: {
    title: 'About Zenya',
    description: 'Agency-quality websites for Arab small businesses, written by AI and hosted in the EU.',
    url: `${SITE}/en/about`,
    type: 'website',
    locale: 'en_US',
  },
}

const PILLARS = [
  {
    icon: Layers,
    title: 'Eight templates, one per business',
    body: 'Restaurant, fashion lookbook, app landing page, brand story, wellness centre, services, multi-product catalogue, and a single-product store. A template per business type, rather than one template trying to suit everyone.',
    color: '#5e6ad2',
  },
  {
    icon: Zap,
    title: 'From brief to site in minutes',
    body: 'Write a short brief about your business and the AI writes the copy, picks the design, and orders the sections. No code, no designer, no weeks of waiting.',
    color: '#d97706',
  },
  {
    icon: Languages,
    title: 'Genuinely Arabic-first',
    body: 'Zenya is built for the Arab market: correct Arabic copy, right-to-left layout, and fonts designed for Arabic. Arabic by design, not a translation added afterwards.',
    color: '#27a644',
  },
  {
    icon: ShieldCheck,
    title: 'EU hosting, GDPR compliant',
    body: 'Your sites and your data are hosted inside the European Union, with automatic SSL and real privacy protection. A trustworthy foundation for your brand.',
    color: '#5e6ad2',
  },
]

const VALUES = [
  'Honesty first. No invented numbers and no fabricated reviews. What we show is real, or we do not show it.',
  'Quality is not a luxury. Every template is built to look professional and to sell, not just to look pretty.',
  'Within reach. Agency-grade tooling at a price a new business can actually pay.',
  'Your privacy is yours. Hosting and data inside the EU, and full GDPR compliance.',
]

export default function EnAbout() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    inLanguage: 'en',
    name: 'About Zenya',
    url: `${SITE}/en/about`,
    description: 'Why Zenya exists and what it stands for.',
  }

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <div>
          <h1 className="display-ar text-[clamp(32px,5.5vw,52px)] leading-[1.1] text-foreground">
            Every business deserves a <span className="gradient-text">professional website.</span>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.9] text-muted">
            Zenya turns a short brief into a finished, publish-ready website. Built for the Arab market,
            hosted in Europe, and priced for businesses that are just getting started.
          </p>
        </div>

        <section className="mt-16">
          <h2 className="heading-ar text-[clamp(22px,3.6vw,30px)] text-foreground">Our story</h2>
          <p className="mt-4 text-[15px] leading-[1.95] text-muted">
            Zenya started from a simple observation. Small business owners in the Arab world were choosing
            between two bad options: a cheap website that looks cheap, or an agency that costs thousands and
            takes weeks of back-and-forth revisions. We wanted a third option, with agency-level quality,
            without the agency price or the wait.
          </p>
          <p className="mt-4 text-[15px] leading-[1.95] text-muted">
            Today we do not build one template. We build{' '}
            <strong className="font-semibold text-foreground">eight</strong>, one for each type of business,
            each designed around what that business actually needs in order to win customers.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="heading-ar mb-8 text-[clamp(22px,3.6vw,30px)] text-foreground">
            What makes Zenya different
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-token bg-white p-6">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${p.color}14`, color: p.color }}
                >
                  <p.icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <h3 className="text-[16px] font-bold text-foreground">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="heading-ar mb-6 text-[clamp(22px,3.6vw,30px)] text-foreground">What we stand for</h2>
          <ul className="space-y-3">
            {VALUES.map((v) => (
              <li key={v} className="flex items-start gap-3 rounded-xl border border-token bg-white px-5 py-4">
                <span
                  aria-hidden
                  className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"
                />
                <span className="text-[13.5px] leading-[1.8] text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-token bg-[var(--surface-2)] p-6">
          <h2 className="text-[16px] font-bold text-foreground">Who is behind Zenya</h2>
          <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">
            Zenya is run as a Dutch sole proprietorship and operated from the European Union. If you want to
            reach a person rather than a form, write to{' '}
            <a href="mailto:support@zenyaai.co" className="font-medium text-primary hover:text-foreground">
              support@zenyaai.co
            </a>
            .
          </p>
          <Link
            href="/en/contact"
            className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-primary transition-colors hover:text-foreground"
          >
            Get in touch
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </section>

        <CtaBand
          title="Try Zenya free"
          subtitle="Two free generations, no card. Pick a template, write a brief, and see what the AI builds."
          primaryLabel="Start building free"
          secondaryLabel="Browse templates"
          secondaryHref="/en/themes"
        />
      </div>
    </main>
  )
}
