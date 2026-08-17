import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Eye } from 'lucide-react'
import { THEMES_EN } from '@/lib/themes-en'
import { auroraTints } from '@/lib/aurora-tints'
import { themePreview } from '@/lib/theme-previews'
import { CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'All eight Zenya templates, one per business type: restaurant, app landing page, fashion lookbook, multi-brand catalogue, brand story, services, wellness, and a single-product Shopify storefront. Preview any of them live.',
  keywords: ['Zenya templates', 'AI website templates', 'Arabic website templates', 'restaurant website template'],
  alternates: {
    canonical: `${SITE}/en/themes`,
    languages: { en: `${SITE}/en/themes`, ar: `${SITE}/themes`, 'x-default': `${SITE}/themes` },
  },
  openGraph: {
    title: 'Zenya templates',
    description: 'Eight templates, one per business type. Preview any of them live before you build.',
    url: `${SITE}/en/themes`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnThemes() {
  const hosted = THEMES_EN.filter((t) => !t.shopify)
  const shopify = THEMES_EN.filter((t) => t.shopify)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    inLanguage: 'en',
    name: 'Zenya templates',
    url: `${SITE}/en/themes`,
    description: 'The eight Zenya website templates, one per business type.',
  }

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <h1 className="display-ar text-[clamp(32px,5.5vw,52px)] leading-[1.1] text-foreground">
            Eight templates. <span className="gradient-text">One per business type.</span>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.9] text-muted">
            Not one template stretched to fit everyone. Each is built around what its business actually needs
            to sell, and the AI writes the content to match your brief.
          </p>
          <p className="mt-3 text-[14px] text-subtle">
            Previews open the real generated demo, which is in Arabic. Read them as a demonstration of the
            layout and depth rather than the language.
          </p>
        </div>

        {/* Hosted brochure templates */}
        <section className="mt-14">
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
            Hosted by Zenya
          </h2>
          <p className="mb-6 text-[13.5px] text-muted">
            Live at your own domain on Pro, or downloadable as a project you host yourself.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hosted.map((t) => (
              <ThemeCard key={t.id} theme={t} />
            ))}
          </div>
        </section>

        {/* Shopify export */}
        <section className="mt-14">
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
            Exports to Shopify
          </h2>
          <p className="mb-6 text-[13.5px] text-muted">
            Installs into your own Shopify store, where Shopify handles cart, checkout, and payments.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shopify.map((t) => (
              <ThemeCard key={t.id} theme={t} />
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-token bg-[var(--surface-2)] px-6 py-5">
          <p className="text-[13.5px] leading-[1.8] text-muted">
            Need a business type that is not here?{' '}
            <Link href="/contact?topic=request" className="font-medium text-primary hover:text-foreground">
              Request a template
            </Link>{' '}
            and tell us what you build. New templates get added based on what people ask for.
          </p>
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

function ThemeCard({ theme }: { theme: (typeof THEMES_EN)[number] }) {
  const tint = auroraTints[theme.id]
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-token bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={themePreview(theme.id)}
          alt={`${theme.name} template preview`}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ background: tint?.accent }}
          />
          <span className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-subtle">
            {theme.tagline}
          </span>
        </div>

        <h3 className="text-[17px] font-bold text-foreground">{theme.name}</h3>
        <p className="mt-2 flex-1 text-[13.5px] leading-[1.8] text-muted">{theme.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-token bg-background px-2.5 py-0.5 text-[11.5px] font-medium text-muted">
            {theme.sections} sections
          </span>
          <span className="rounded-full border border-token bg-background px-2.5 py-0.5 text-[11.5px] font-medium text-muted">
            {theme.presets} style presets
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Link
            href={theme.createHref}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
          >
            Build with this
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
          <Link
            href={theme.demoHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-token bg-background px-4 py-2.5 text-[13.5px] font-medium text-muted transition-colors duration-150 hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={2} />
            Preview
          </Link>
        </div>
      </div>
    </div>
  )
}
