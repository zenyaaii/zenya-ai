'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
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
import CursorGlow from '@/components/marketing/CursorGlow'
import HeroWordmark from '@/components/marketing/HeroWordmark'
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
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
  one_product: 'مسار شوبيفاي',
  restaurant:  'قائمة · حجوزات',
  atlas:       'صفحة هبوط لتطبيق',
  lookbook:    'أزياء · تحرير',
  collective:  'منتجات متعددة',
  studio:      'علامة · مؤسّس',
  services:    'حِرف · صالونات',
  wellness:    'سبا · ستوديو',
}

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
            كل نشاط تجاري يستحقّ
            <br />
            <span className="gradient-text">موقعًا استثنائيًا.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            {...fade(0.12)}
            className="lead-ar mx-auto mt-7 max-w-2xl text-[17.5px] text-muted"
          >
            مطعم، أو لوك بوك أزياء، أو صفحة هبوط لتطبيق، أو قصة علامة تجارية، أو
            مركز عافية، أو متجر بمنتجات متعددة، أو حِرف محلية، أو متجر شوبيفاي —
            اختر قالبًا، اكتب نبذة، وتتكفّل زينيا بكتابة المحتوى ونشر الموقع.
          </motion.p>

          {/* Price line — set apart for rhythm */}
          <motion.p
            {...fade(0.16)}
            className="mt-3 text-[13.5px] text-subtle"
          >
            <span className="font-latin" dir="ltr">‎$9.99</span> مدى الحياة · أو{' '}
            <span className="font-latin" dir="ltr">$19.99</span> شهريًا مع استضافة كاملة
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

          {/* Social proof */}
          <motion.div {...fade(0.3)} className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
                <strong className="font-semibold text-foreground tnum">+2,400</strong> موقع تم إطلاقه
              </span>
            </div>

            <div className="hidden h-3.5 w-px bg-[#e5e2d9] sm:block" />

            <div className="flex items-center gap-1">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill="#d97706" stroke="none" />
              ))}
              <span className="ms-1 text-[13px] font-medium text-foreground tnum">4.9</span>
              <span className="text-[13px] text-muted">&nbsp;· محبوب من المؤسّسين وأصحاب الأعمال</span>
            </div>
          </motion.div>
        </div>

        {/* ── In-hero product mockup: the BusinessTypePicker preview ──
            Outer wrapper owns the scroll parallax (motion values); the inner
            wrapper owns the one-time entrance — kept separate so framer isn't
            driving y/opacity from two sources at once. */}
        <motion.div
          style={{ y: mockY, scale: mockScale, opacity: mockOpacity }}
          className="relative mx-auto mt-20 max-w-4xl will-change-transform"
        >
         <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.34, ease: EASE }}
          className="relative"
         >
          {/* Rotating conic glow behind the window */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] conic-glow opacity-60 blur-3xl"
          />
          {/* Soft glow behind */}
          <div
            aria-hidden
            className="absolute inset-x-8 top-4 bottom-0 rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(94,106,210,0.16) 0%, transparent 70%)',
              filter: 'blur(28px)',
            }}
          />

          {/* Browser window */}
          <div
            className="relative overflow-hidden rounded-2xl bg-white"
            style={{
              border: '1px solid #e5e2d9',
              boxShadow: '0 40px 90px -30px rgba(28,28,28,0.28), 0 0 0 1px #e5e2d9',
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
                dir="ltr"
                className="mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] text-muted font-latin"
                style={{ background: '#ffffff', border: '1px solid #e5e2d9' }}
              >
                app.zenya.ai/theme/new
              </div>
            </div>

            {/* Picker content (mirrors the real /theme/new BusinessTypePicker) */}
            <div className="p-6 sm:p-8" style={{ background: '#f7f4ed', minHeight: 360 }}>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">الخطوة 1 من 2</p>
                  <div className="mt-1 text-[15px] font-bold text-foreground">ما نوع نشاطك التجاري؟</div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                  style={{ background: 'rgba(39,166,68,0.10)', color: '#27a644', border: '1px solid rgba(39,166,68,0.18)' }}
                >
                  8 قوالب متاحة
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
                      transition={{ delay: 0.55 + i * 0.045, duration: 0.4, ease: EASE }}
                      className="group relative overflow-hidden rounded-lg border border-token bg-white p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_-12px_rgba(28,28,28,0.25)]"
                      style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.04)' }}
                    >
                      {/* Sheen sweep on hover */}
                      <span className="card-sheen absolute inset-0" aria-hidden />
                      {/* Per-type aurora wash, only visible on hover */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(ellipse 80% 80% at 50% 0%, ${tint.orb1}, transparent 70%)`,
                        }}
                      />
                      <div
                        className="relative mb-2 flex h-7 w-7 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-[1.08]"
                        style={{ background: `${tint.accent}10`, border: `1px solid ${tint.accent}20`, color: tint.accent }}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="relative text-[12px] font-bold text-foreground">{tint.label}</div>
                      <div className="relative mt-0.5 text-[10.5px] text-muted">{tagline}</div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
         </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
