'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Utensils,
  Shirt,
  LayoutDashboard,
  Feather,
  Store,
  Wrench,
  Leaf,
  ShoppingBag,
  Star,
  type LucideIcon,
} from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import CursorGlow from '@/components/marketing/CursorGlow'
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { cn } from '@/lib/utils'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
})

/** Icon per business type — shown in the in-hero template picker mockup. */
const TYPE_ICON: Record<string, LucideIcon> = {
  one_product: ShoppingBag,
  restaurant:  Utensils,
  atlas:       LayoutDashboard,
  lookbook:    Shirt,
  collective:  Store,
  studio:      Feather,
  services:    Wrench,
  wellness:    Leaf,
}

/** Short tagline per type — keeps each mockup card legible at small size. */
const TYPE_TAGLINE: Record<string, string> = {
  one_product: 'Shopify funnel',
  restaurant:  'Menu · Reservations',
  atlas:       'SaaS landing',
  lookbook:    'Fashion · Editorial',
  collective:  'Multi-product',
  studio:      'Brand · Founder',
  services:    'Trades · Salons',
  wellness:    'Spa · Studio',
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32">
      {/* Aurora orb wash (default Zenya tint) */}
      <AuroraBackground intensity={0.9} />
      {/* Cursor-following glow — scoped to hero only, skipped on touch + reduced motion */}
      <CursorGlow size={520} color="rgba(94,106,210,0.22)" />
      {/* Very subtle dot grid for depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* ── Copy column ── */}
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <motion.div {...fade(0)} className="mb-8 inline-flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
              style={{
                background: 'rgba(94,106,210,0.08)',
                border: '1px solid rgba(94,106,210,0.18)',
                color: '#5e6ad2',
                letterSpacing: '0.01em',
              }}
            >
              <Sparkles className="h-3 w-3" strokeWidth={2.25} />
              8 templates · AI-written · Live in minutes
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fade(0.06)}
            className="text-[52px] font-[590] leading-[1.06] tracking-[-1.6px] text-foreground sm:text-[68px] sm:tracking-[-2.2px] xl:text-[76px] xl:tracking-[-2.6px]"
          >
            Every business deserves
            <br />
            <span className="gradient-text">a great website.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            {...fade(0.12)}
            className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.65] text-muted"
          >
            Restaurant, lookbook, SaaS landing, brand story, wellness studio,
            catalog, local services, or a one-product Shopify store — pick a
            template, share a brief, and Zenya writes the copy and builds the page.
            Live in minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fade(0.18)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?mode=signup"
              className={cn(
                'group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-white transition-all duration-150',
                'btn-shadow-primary hover:opacity-90 active:scale-[0.98]'
              )}
            >
              Start building free
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="/themes"
              className={cn(
                'inline-flex items-center gap-2 rounded-md border border-token bg-white/55 px-6 py-3 text-[14px] font-medium text-muted backdrop-blur transition-all duration-150',
                'hover:bg-black/[0.03] hover:text-foreground active:scale-[0.98]'
              )}
            >
              See the 8 templates
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div {...fade(0.26)} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {['#5e6ad2', '#c8a96a', '#27a644', '#dc2626', '#7170ff'].map((c, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ background: c, border: '2px solid #f7f4ed', zIndex: 5 - i }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-muted">
                <strong className="font-semibold text-foreground">2,400+</strong> sites launched
              </span>
            </div>

            <div className="hidden h-3.5 w-px bg-[#e5e2d9] sm:block" />

            <div className="flex items-center gap-1">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill="#d97706" stroke="none" />
              ))}
              <span className="ml-1 text-[13px] font-medium text-foreground">4.9</span>
              <span className="text-[13px] text-muted">&nbsp;· Loved by founders &amp; operators</span>
            </div>
          </motion.div>
        </div>

        {/* ── In-hero product mockup: the BusinessTypePicker preview ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-20 max-w-4xl"
        >
          {/* Soft glow behind */}
          <div
            aria-hidden
            className="absolute inset-x-8 top-4 bottom-0 rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(94,106,210,0.14) 0%, transparent 70%)',
              filter: 'blur(28px)',
            }}
          />

          {/* Browser window */}
          <div
            className="relative overflow-hidden rounded-xl bg-white"
            style={{
              border: '1px solid #e5e2d9',
              boxShadow: '0 24px 64px rgba(28,28,28,0.10), 0 0 0 1px #e5e2d9',
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid #f0ede6', background: '#faf8f3' }}
            >
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#fca5a5' }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#fcd34d' }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#86efac' }} />
              </div>
              <div
                className="mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] text-muted"
                style={{ background: '#ffffff', border: '1px solid #e5e2d9' }}
              >
                app.zenya.ai/theme/new
              </div>
            </div>

            {/* Picker content (mirrors the real /theme/new BusinessTypePicker) */}
            <div className="p-6 sm:p-8" style={{ background: '#f7f4ed', minHeight: 360 }}>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Step 1 of 2</p>
                  <div className="mt-1 text-[15px] font-[590] text-foreground">What kind of business?</div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                  style={{ background: 'rgba(39,166,68,0.10)', color: '#27a644', border: '1px solid rgba(39,166,68,0.18)' }}
                >
                  8 templates live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {BUSINESS_TYPE_ORDER.map((key, i) => {
                  const tint = auroraTints[key]
                  const Icon = TYPE_ICON[key]
                  const tagline = TYPE_TAGLINE[key]
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative overflow-hidden rounded-lg border border-token bg-white p-3 transition-all duration-200 hover:-translate-y-0.5"
                      style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.04)' }}
                    >
                      {/* Per-type aurora wash, only visible on hover */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(ellipse 80% 80% at 50% 0%, ${tint.orb1}, transparent 70%)`,
                        }}
                      />
                      <div
                        className="relative mb-2 flex h-7 w-7 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-[1.06]"
                        style={{ background: `${tint.accent}10`, border: `1px solid ${tint.accent}20`, color: tint.accent }}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="relative text-[12px] font-[590] text-foreground">{tint.label}</div>
                      <div className="relative mt-0.5 text-[10.5px] text-muted">{tagline}</div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
