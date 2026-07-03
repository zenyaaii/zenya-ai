'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
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
  const sectionRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  // Parallax: the product mockup drifts up and recedes slightly as the
  // hero scrolls away, giving the page real depth on the first scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const mockY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90])
  const mockScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.94])
  const mockOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.35])

  return (
    <section ref={sectionRef} className="relative overflow-hidden pt-24 pb-36">
      {/* The grid + aurora backdrop now lives at the page level (PageBackground)
          so the whole home page shares one continuous background. The hero keeps
          only its own flourishes on top: the cursor glow + the ghost wordmark. */}
      {/* Cursor-following glow — scoped to hero only, skipped on touch + reduced motion */}
      <CursorGlow size={520} color="rgba(94,106,210,0.22)" />
      {/* Giant Arabic "زينيا" — a ghost in the background that lights up
          under the cursor. Sits above the grid (-z-5) but below the copy. */}
      <HeroWordmark />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* ── Copy column ── */}
        <div className="mx-auto max-w-3xl text-center">

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
            موقع غير احترافي يُبعد عملاءك.
            <br />
            <span className="gradient-text">زينيا يستعيدهم بدقائق.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            {...fade(0.12)}
            className="lead-ar mx-auto mt-7 max-w-2xl text-[17.5px] text-muted"
          >
            تصميم قديم، أو موقع يبدو مبنيًا بالهواة، يفقدك ثقة الزوّار ومبيعاتك —
            حتى لو كنت تدفع مقابله كل شهر. مطعم، أو لوك بوك أزياء، أو صفحة هبوط
            لتطبيق، أو قصة علامة تجارية، أو مركز عافية، أو متجر بمنتجات متعددة،
            أو حِرف محلية، أو متجر شوبيفاي — اختر قالبًا، اكتب نبذة، وزينيا يبني
            لك موقعًا احترافيًا بالذكاء الاصطناعي بجزء بسيط من تكلفة الوكالة.
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
              href="/login?mode=signup"
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
              'نطاق مجاني شهرين مع Pro',
              'استضافة أوروبية · GDPR',
            ].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <Check className="h-3.5 w-3.5 text-[#27a644]" strokeWidth={2.5} />
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── In-hero constellation: the زينيا hub + connected floating
            cards (real template previews, AI-copy card, analytics, platform
            bubbles). Outer wrapper owns the scroll parallax. */}
        <motion.div
          style={{ y: mockY, scale: mockScale, opacity: mockOpacity }}
          className="relative will-change-transform"
        >
          <HeroConstellation />
        </motion.div>
      </div>
    </section>
  )
}
