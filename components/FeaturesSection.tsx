'use client'

import { motion } from 'framer-motion'
import {
  Palette,
  Zap,
  PenTool,
  ShoppingBag,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  desc: string
  color: string
}

const FEATURES: Feature[] = [
  {
    icon: Palette,
    title: 'Polished by design',
    desc: 'Editorial typography, restrained color, premium spacing — applied automatically across every section.',
    color: '#5e6ad2',
  },
  {
    icon: Zap,
    title: 'Live in minutes',
    desc: 'Pick a template → share your brief or paste a URL → a complete site is written, designed, and previewed. Faster than a coffee break.',
    color: '#d97706',
  },
  {
    icon: PenTool,
    title: 'AI copy with taste',
    desc: 'Headlines, FAQs, menus, testimonials — written specifically for your business. No generic AI clichés, no filler.',
    color: '#27a644',
  },
  {
    icon: ShoppingBag,
    title: 'Shopify when you need it',
    desc: 'The Storefront template exports a full Shopify OS 2.0 theme ZIP — sections, blocks, settings_schema, ready to upload.',
    color: '#5e6ad2',
  },
  {
    icon: ShieldCheck,
    title: 'Built for outcomes',
    desc: 'Every template includes the trust-building sections, social proof, and clear CTAs the business type actually needs.',
    color: '#d97706',
  },
  {
    icon: Layers,
    title: '8 templates, more coming',
    desc: 'Restaurant, lookbook, SaaS landing, brand story, wellness, catalog, services, and one-product Shopify. New templates launching monthly.',
    color: '#27a644',
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 max-w-xl"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Why Zenya
          </p>
          <h2 className="text-[40px] font-[590] leading-[1.1] tracking-[-1.2px] text-foreground sm:text-[48px] sm:tracking-[-1.6px]">
            Everything you need to{' '}
            <span className="gradient-text">ship fast.</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-px overflow-hidden rounded-xl border border-token md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group relative bg-white p-6 transition-colors duration-150 hover:bg-[#faf8f3]"
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                  style={{ background: `${f.color}10`, border: `1px solid ${f.color}20`, color: f.color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>

                <h3 className="mb-1.5 text-[14px] font-[590] text-foreground">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-muted">{f.desc}</p>

                {/* Top accent line on hover */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  style={{ background: f.color }}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
