'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Check } from 'lucide-react'
import CursorGlow from '@/components/marketing/CursorGlow'
import HeroWordmark from '@/components/marketing/HeroWordmark'
import HeroConstellation from '@/components/marketing/HeroConstellation'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
})

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-28">
      {/* The grid + aurora backdrop now lives at the page level (PageBackground)
          so the whole home page shares one continuous background. The hero keeps
          only its own flourishes on top: the cursor glow + the ghost wordmark. */}
      {/* Cursor-following glow — scoped to hero only, skipped on touch + reduced motion */}
      <CursorGlow size={520} color="rgba(94,106,210,0.22)" />
      {/* Giant Arabic "زينيا" — a ghost in the background that lights up
          under the cursor. Sits above the grid (-z-5) but below the copy. */}
      <HeroWordmark />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Stage: the copy sits centred (z-20) over the scatter of floating
            preview cards + platform bubbles that flank it in the wide gutters
            (xl+). Below xl the scatter collapses to a stacked grid under the
            copy — see HeroConstellation. */}
        <div className="relative xl:min-h-[720px]">
          {/* ── Copy column ── */}
          <div className="relative z-20 mx-auto max-w-2xl text-center xl:pt-6 xl:pb-40">

          {/* Badge */}
          <motion.div {...fade(0)} className="mb-8 inline-flex items-center gap-2">
            <span
              className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium card-sheen"
              style={{
                background: 'rgba(94,106,210,0.07)',
                border: '1px solid rgba(94,106,210,0.20)',
                color: '#5e6ad2',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
              8 قوالب · بصياغة الذكاء الاصطناعي · جاهزة خلال دقائق
            </span>
          </motion.div>

          {/* Headline — Arabic display weight, zero tracking (connected script) */}
          <motion.h1
            {...fade(0.06)}
            className="display-ar display-ar-tight text-[clamp(44px,8vw,82px)] text-foreground"
          >
            ابنِ وأدِر وأنشِر
            <br />
            <span className="gradient-text">موقعك</span>
          </motion.h1>

          {/* Sub — one tight, benefit-led line */}
          <motion.p
            {...fade(0.12)}
            className="lead-ar mx-auto mt-6 max-w-xl text-[17px] text-muted"
          >
            اختر قالبًا، اكتب نبذة قصيرة، ويبني لك الذكاء الاصطناعي موقعًا عربيًا
            احترافيًا في دقائق — بجزءٍ بسيط من تكلفة الوكالة.
          </motion.p>

          {/* Price line — set apart for rhythm */}
          <motion.p
            {...fade(0.16)}
            className="mt-3 text-[13.5px] text-subtle"
          >
            <span className="font-latin" dir="ltr">‎$14.99</span> شهريًا · Starter · أو{' '}
            <span className="font-latin" dir="ltr">$24.99</span> شهريًا · Pro مع استضافة كاملة
          </motion.p>

          {/* CTAs */}
          <motion.div {...fade(0.22)} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/themes"
              className={cn(
                'group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-primary px-7 py-3.5 text-[14.5px] font-semibold text-white transition-all duration-200',
                'btn-shadow-primary hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgba(94,106,210,0.6)] active:translate-y-0'
              )}
            >
              <span className="card-sheen absolute inset-0" aria-hidden />
              ابدأ الإنشاء مجانًا
              <ArrowRight className="h-4 w-4 rtl-flip transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={2.5} />
            </Link>
            <Link
              href="/themes"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-token bg-white/55 px-7 py-3.5 text-[14.5px] font-medium text-muted backdrop-blur transition-all duration-200',
                'hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.3)] hover:bg-white hover:text-foreground'
              )}
            >
              شاهد القوالب الثمانية
            </Link>
          </motion.div>

          {/* Trust signals — honest, verifiable guarantees instead of
              fabricated user counts or ratings. */}
          <motion.div {...fade(0.3)} className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
            {[
              'جرّب مجانًا · بلا بطاقة',
              'نطاق مجاني لسنة مع Pro',
              'استضافة أوروبية · GDPR',
            ].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <Check className="h-3.5 w-3.5 text-[#27a644]" strokeWidth={2.5} />
                {label}
              </span>
            ))}
          </motion.div>
          </div>

          {/* ── The quso-style scatter: floating preview cards + platform
              bubbles flanking the copy (xl+), or a stacked grid below it on
              smaller screens. */}
          <HeroConstellation />
        </div>
      </div>
    </section>
  )
}
