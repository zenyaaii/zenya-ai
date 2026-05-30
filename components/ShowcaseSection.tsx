'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
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
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { cn } from '@/lib/utils'

const TYPE_META: Record<
  string,
  { icon: LucideIcon; tagline: string; pitch: string; demoHref: string }
> = {
  one_product: {
    icon: ShoppingBag,
    tagline: 'One-product Shopify',
    pitch: 'Hero funnel, sticky add-to-cart, bundles, comparison, urgency, FAQ. Exports as a Shopify OS 2.0 theme.',
    demoHref: '/demo',
  },
  restaurant: {
    icon: Utensils,
    tagline: 'Restaurant · Menu · Reservations',
    pitch: 'Editorial fine-dining site: tabbed menu, gallery, hours, reservations, press wall, and chef story.',
    demoHref: '/demo/restaurant',
  },
  atlas: {
    icon: LayoutDashboard,
    tagline: 'SaaS · Software · B2B',
    pitch: 'Modern product landing: hero, feature grid, pricing tiers, integrations, security trust strip, demo CTA.',
    demoHref: '/demo/atlas',
  },
  lookbook: {
    icon: Shirt,
    tagline: 'Fashion · Apparel · Brand',
    pitch: 'Full-bleed editorial lookbook, drop banner, bestsellers grid, brand story, press wall, newsletter.',
    demoHref: '/demo/lookbook',
  },
  collective: {
    icon: Store,
    tagline: 'Catalog · Multi-product',
    pitch: 'Luxury multi-brand storefront with curated collections, bestsellers, brand promise, newsletter.',
    demoHref: '/demo/collective',
  },
  studio: {
    icon: Feather,
    tagline: 'Brand story · Editorial',
    pitch: 'Founder letter, timeline, values, process, team, press wall, community stats — long-form storytelling.',
    demoHref: '/demo/studio',
  },
  services: {
    icon: Wrench,
    tagline: 'Local services · Trades',
    pitch: 'Premium services site: hero, proof, before-after, areas served, reviews, FAQ, quote-request flow.',
    demoHref: '/demo/services',
  },
  wellness: {
    icon: Leaf,
    tagline: 'Spa · Yoga · Wellness',
    pitch: 'Calming template with treatment menu, booking, instructors, schedules, gift cards.',
    demoHref: '/demo/wellness',
  },
}

export default function ShowcaseSection() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Eight templates · one design language
            </p>
            <h2 className="text-[40px] font-[590] leading-[1.1] tracking-[-1.2px] text-foreground sm:text-[48px] sm:tracking-[-1.6px]">
              Built with{' '}
              <span className="gradient-text">Zenya.</span>
            </h2>
          </div>
          <Link
            href="/themes"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted transition-colors hover:text-foreground"
          >
            Explore all templates
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </motion.div>

        {/* 8-card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_TYPE_ORDER.map((key, i) => {
            const tint = auroraTints[key]
            const meta = TYPE_META[key]
            const Icon = meta.icon
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-token bg-white transition-all duration-200 hover:-translate-y-1"
                style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.04)' }}
              >
                {/* Per-type aurora wash (hover) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tint.orb1}, transparent 70%)`,
                  }}
                />
                {/* Per-type accent bar at top */}
                <div className="h-0.5 w-full" style={{ background: tint.accent }} />

                <div className="relative flex flex-1 flex-col gap-3 p-5">
                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-[1.06]"
                    style={{ background: `${tint.accent}10`, border: `1px solid ${tint.accent}20`, color: tint.accent }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>

                  {/* Name + tagline */}
                  <div>
                    <h3 className="text-[16px] font-[590] text-foreground">{tint.label}</h3>
                    <p className="mt-0.5 text-[11.5px] uppercase tracking-[0.08em] text-muted">
                      {meta.tagline}
                    </p>
                  </div>

                  {/* Pitch */}
                  <p className="text-[13px] leading-[1.55] text-muted">{meta.pitch}</p>

                  {/* Footer link */}
                  <Link
                    href={meta.demoHref}
                    className={cn(
                      'mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] font-medium transition-all',
                      'text-muted group-hover:text-foreground'
                    )}
                  >
                    View live demo
                    <ArrowUpRight
                      className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2.25}
                    />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
