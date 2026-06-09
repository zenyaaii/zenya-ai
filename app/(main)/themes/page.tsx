'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Sparkles,
  Layers,
  Palette,
  Utensils,
  Shirt,
  LayoutDashboard,
  Feather,
  Store,
  Wrench,
  Leaf,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { auroraTints, BUSINESS_TYPE_ORDER, type AuroraTint } from '@/lib/aurora-tints'
import { themePreview, themePreviewFallback } from '@/lib/theme-previews'
import { cn } from '@/lib/utils'

type ThemeCard = {
  /** Internal business_type key. Drives aurora tint lookup. */
  id: keyof typeof auroraTints
  /** Display name shown on the card. */
  name: string
  /** Short business descriptor. */
  tagline: string
  /** Long description for the card body. */
  description: string
  /** Cover photo URL. */
  cover: string
  /** Number of style presets the user can pick from in the wizard. */
  presets: number
  /** Number of pre-built sections in the template. */
  sections: number
  /** No-auth live preview URL. */
  demoHref: string
  /** Wizard URL that lets a logged-in user start building. */
  createHref: string
  /** Icon shown in the card chip. */
  icon: LucideIcon
  /** When true, this card gets the large spotlight treatment. */
  featured?: boolean
}

const THEMES: ThemeCard[] = [
  {
    id: 'restaurant',
    name: 'Maison',
    tagline: 'Fine dining · Restaurant',
    description:
      'Editorial fine-dining website for restaurants, tasting rooms, and chef counters. Tabbed menu, gallery, reservations, hours, and press wall — fully responsive.',
    cover: themePreview('restaurant'),
    presets: 4,
    sections: 13,
    demoHref: '/demo/restaurant',
    createHref: '/theme/new?type=restaurant',
    icon: Utensils,
    featured: true,
  },
  {
    id: 'one_product',
    name: 'Storefront',
    tagline: 'One-product · Dropshipping',
    description:
      'Conversion-first single-product Shopify theme. Hero funnel, sticky add-to-cart, bundles, comparison, FAQ, urgency, and a fully designed product page. Exports as a Shopify OS 2.0 ZIP.',
    cover: themePreview('one_product'),
    presets: 3,
    sections: 24,
    demoHref: '/demo',
    createHref: '/theme/new',
    icon: ShoppingBag,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    tagline: 'SaaS · Software',
    description:
      'Modern software landing template. Product hero, feature grid, pricing tiers, integrations, security trust strip, and demo CTA.',
    cover: themePreview('atlas'),
    presets: 4,
    sections: 12,
    demoHref: '/demo/atlas',
    createHref: '/theme/new/atlas',
    icon: LayoutDashboard,
  },
  {
    id: 'services',
    name: 'Trade',
    tagline: 'Local services · Trades',
    description:
      'For plumbers, salons, cleaners, home services, and agencies. Premium hero, services, proof, before-after, areas served, reviews, FAQ, and quote-request flow.',
    cover: themePreview('services'),
    presets: 4,
    sections: 13,
    demoHref: '/demo/services',
    createHref: '/theme/new/services',
    icon: Wrench,
  },
  {
    id: 'collective',
    name: 'Collective',
    tagline: 'Catalog · Multi-product',
    description:
      'Luxury multi-brand storefront with aurora-lit hero, curated collection grid, new arrivals, bestsellers, brand promise, testimonials, and newsletter.',
    cover: themePreview('collective'),
    presets: 4,
    sections: 10,
    demoHref: '/demo/collective',
    createHref: '/theme/new/collective',
    icon: Store,
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Brand story · Editorial',
    description:
      'Editorial brand story page with giant display type, founder letter, timeline, values, process, team, press wall, and community stats.',
    cover: themePreview('studio'),
    presets: 4,
    sections: 12,
    demoHref: '/demo/studio',
    createHref: '/theme/new/studio',
    icon: Feather,
  },
  {
    id: 'lookbook',
    name: 'Lookbook',
    tagline: 'Fashion · Apparel',
    description:
      'High-end fashion template with full-bleed editorial lookbook, drop banner, bestsellers grid, brand story, press wall, reviews, and newsletter.',
    cover: themePreview('lookbook'),
    presets: 4,
    sections: 11,
    demoHref: '/demo/lookbook',
    createHref: '/theme/new/lookbook',
    icon: Shirt,
  },
  {
    id: 'wellness',
    name: 'Wellness',
    tagline: 'Spa · Wellness · Studio',
    description:
      'Calming template for spas, yoga studios, and wellness brands. Treatment menu, booking, instructors, schedules, gift cards.',
    cover: themePreview('wellness'),
    presets: 3,
    sections: 12,
    demoHref: '/demo/wellness',
    createHref: '/theme/new/wellness',
    icon: Leaf,
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    tagline: 'Restaurant · Café · Bar',
    description:
      'Mouth-watering template for restaurants, cafés, and bars. Hero with reservation CTA, menu, story, gallery, hours, contact, and press strip.',
    cover: themePreview('restaurant'),
    presets: 4,
    sections: 13,
    demoHref: '/demo/restaurant',
    createHref: '/theme/new/restaurant',
    icon: Utensils,
  },
]

type Category = 'all' | 'sites' | 'shopify'

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all',     label: 'All templates'  },
  { id: 'sites',   label: 'Hosted sites'   },
  { id: 'shopify', label: 'Shopify export' },
]

export default function ThemesPage() {
  const [filter, setFilter] = useState<Category>('all')

  const visible = useMemo(() => {
    if (filter === 'shopify') return THEMES.filter((t) => t.id === 'one_product')
    if (filter === 'sites')   return THEMES.filter((t) => t.id !== 'one_product')
    return THEMES
  }, [filter])

  const featured = THEMES.find((t) => t.featured)
  const total = THEMES.length

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Global cream + indigo aurora wash (fixed so it sits behind the long scroll) */}
      <AuroraBackground fixed intensity={0.85} />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-token bg-white/60 px-3 py-1.5 text-[12px] font-medium text-muted backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All {total} templates live · more launching monthly
          </div>
          <h1 className="text-[52px] font-[590] leading-[1.06] tracking-[-1.6px] text-foreground sm:text-[64px] sm:tracking-[-2px]">
            <span className="gradient-text">Templates</span> for every business.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-[1.65] text-muted">
            Eight beautifully crafted website templates. Pick one, share your brief,
            and Zenya AI writes the copy, designs the page, and delivers a live preview
            you can ship today.
          </p>

          {/* Filters */}
          <div className="mt-10 inline-flex items-center gap-1 rounded-full border border-token bg-white/60 p-1 backdrop-blur-md shadow-soft-md">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-full px-5 py-2 text-[13px] font-semibold transition-all',
                  filter === f.id
                    ? 'bg-foreground text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Featured spotlight ── */}
        {featured && filter !== 'shopify' && (
          <FeaturedCard theme={featured} tint={auroraTints[featured.id]} />
        )}

        {/* ── Grid ── */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible
            .filter((t) => !(filter !== 'shopify' && t.id === featured?.id))
            .map((t, i) => (
              <ThemeGridCard key={t.id} theme={t} tint={auroraTints[t.id]} index={i} />
            ))}
        </div>

        {/* ── Bottom CTA ── */}
        <BottomCTA />
      </main>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

function FeaturedCard({ theme, tint }: { theme: ThemeCard; tint: AuroraTint }) {
  const Icon = theme.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-token bg-white shadow-soft-lg"
    >
      {/* Per-type aurora wash behind the whole card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 100% at 100% 0%, ${tint.orb1}, transparent 60%)`,
        }}
      />

      <div className="relative grid lg:grid-cols-[1.15fr_1fr]">
        <div className="relative h-[360px] sm:h-[440px] lg:h-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme.cover}
            alt={theme.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              const fb = themePreviewFallback(theme.id)
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3" strokeWidth={2.25} />
            Featured · New release
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/80">{theme.tagline}</p>
              <h2 className="mt-1 text-[40px] font-[590] tracking-[-1.4px] sm:text-[48px]">{theme.name}</h2>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: tint.accent, color: '#0a0a0c' }}
            >
              Live
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
          <div
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-foreground/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground"
          >
            <Icon className="h-3 w-3" strokeWidth={2.25} style={{ color: tint.accent }} />
            {theme.tagline.split(' · ')[0]}
          </div>
          <h3 className="text-[32px] font-[590] leading-[1.08] tracking-[-1.1px] text-foreground sm:text-[40px] sm:tracking-[-1.4px]">
            A quiet kind of extraordinary.
          </h3>
          <p className="mt-4 text-[14.5px] leading-[1.65] text-muted">{theme.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Style presets" value={String(theme.presets)} icon={Palette} />
            <Stat label="Sections"      value={String(theme.sections)} icon={Layers} />
            <Stat label="AI-generated"  value="100%"                   icon={Sparkles} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={theme.demoHref}
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: tint.accent,
                color: tint.accent === '#1c1c1c' ? '#ffffff' : '#0a0a0c',
                boxShadow: 'rgba(28,28,28,0.10) 0px 1px 3px 0px',
              }}
            >
              View live demo
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
            </Link>
            <Link
              href={theme.createHref}
              className="inline-flex items-center gap-2 rounded-full border border-token bg-white/70 px-5 py-2.5 text-[13px] font-semibold text-foreground backdrop-blur-md transition hover:bg-white"
            >
              Build with this
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-xl border border-token bg-white/70 p-3 backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5 text-muted">
        <Icon className="h-3 w-3" strokeWidth={2} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="text-[20px] font-[590] tracking-[-0.5px] text-foreground">{value}</p>
    </div>
  )
}

function ThemeGridCard({
  theme,
  tint,
  index,
}: {
  theme: ThemeCard
  tint: AuroraTint
  index: number
}) {
  const Icon = theme.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white shadow-soft-md backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      {/* Per-type aurora wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tint.orb1}, transparent 70%)`,
        }}
      />

      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.cover}
          alt={theme.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          onError={(e) => {
            const fb = themePreviewFallback(theme.id)
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        {/* Accent stripe */}
        <div className="absolute left-0 top-0 h-1 w-full" style={{ background: tint.accent }} />
        {/* Status pill */}
        <div className="absolute right-4 top-4">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: tint.accent, color: tint.accent === '#1c1c1c' ? '#ffffff' : '#0a0a0c' }}
          >
            Live
          </span>
        </div>
        {/* Bottom title overlay */}
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/80">{theme.tagline}</p>
            <h3 className="mt-0.5 text-[24px] font-[590] tracking-[-0.6px]">{theme.name}</h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-5">
        <p className="text-[13.5px] leading-[1.6] text-muted">{theme.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: `${tint.accent}1a`, color: tint.accent === '#1c1c1c' ? '#1c1c1c' : tint.accent }}
          >
            <Icon className="h-2.5 w-2.5" strokeWidth={2.25} />
            {theme.tagline.split(' · ')[0]}
          </span>
          <span className="rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            {theme.sections} sections
          </span>
          <span className="rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            {theme.presets} presets
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center gap-2">
            <Link
              href={theme.demoHref}
              className="flex-1 rounded-full px-4 py-2.5 text-center text-[13px] font-semibold transition hover:scale-[1.02]"
              style={{
                background: tint.accent,
                color: tint.accent === '#1c1c1c' ? '#ffffff' : '#0a0a0c',
                boxShadow: 'rgba(28,28,28,0.08) 0px 1px 2px 0px',
              }}
            >
              View demo
            </Link>
            <Link
              href={theme.createHref}
              className="rounded-full border border-token bg-white/70 px-4 py-2.5 text-[13px] font-semibold text-foreground backdrop-blur-md transition hover:bg-white"
              aria-label={`Build with ${theme.name}`}
            >
              Build
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function BottomCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-20 overflow-hidden rounded-3xl border border-token bg-white/70 p-10 text-center backdrop-blur-xl"
    >
      {/* Soft indigo wash, monochromatic — no fuchsia */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(94,106,210,0.10), transparent 65%), radial-gradient(ellipse 60% 80% at 50% 100%, rgba(217,119,6,0.06), transparent 70%)',
        }}
      />

      <div className="relative">
        <h2 className="text-[28px] font-[590] tracking-[-0.8px] text-foreground sm:text-[36px] sm:tracking-[-1.2px]">
          Don&rsquo;t see your business type?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
          We&rsquo;re adding new templates every month. Tell us what you need and we&rsquo;ll
          prioritize it.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-foreground px-6 py-3 text-[13.5px] font-semibold text-white shadow-soft-md transition hover:scale-[1.02] hover:shadow-soft-lg"
          >
            Request a template
          </Link>
          <Link
            href="/theme/new"
            className="rounded-full border border-token bg-white/70 px-6 py-3 text-[13.5px] font-semibold text-foreground backdrop-blur-md transition hover:bg-white"
          >
            Start building now
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
