"use client"

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import type { LookbookContent, LookbookReview } from '@/utils/lookbook/types'
import { getLookbookPreset } from '@/utils/lookbook/presets'
import {
  TYPOGRAPHY_PRESETS,
  buildGoogleFontsUrl,
  getTypographyPreset,
} from '@/utils/theme-editor-typography'

type Props = {
  content: LookbookContent
  presetId?: string
  className?: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  view?: string
  onViewChange?: (v: string) => void
}

type Colors = ReturnType<typeof getLookbookPreset>['colors']
type LookbookView = 'home' | 'shop' | 'lookbook' | 'about'

// ─── Motion helpers ────────────────────────────────────────────────────────────
// These are *not* React hooks even though they look like them. They take the
// reduced-motion flag as a parameter so call sites can safely use them inside
// .map() callbacks, conditional branches, and per-view JSX — none of which is
// safe for an actual hook. Every component that uses them calls
// `useReducedMotion()` once at the top to get `rm`, then threads it through.
function revealAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0, y: 28 },
    whileInView: rm ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
  }
}

function fadeAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0 },
    animate: rm ? {} : { opacity: 1 },
    transition: { duration: 0.8, ease: 'easeOut', delay }
  }
}

// ─── Headline helper ───────────────────────────────────────────────────────────
function Headline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={style}>
      {text.split('\\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ))}
    </span>
  )
}

// ─── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating = 5, color }: { rating?: number; color: string }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill={i <= rating ? color : 'none'} stroke={color} strokeWidth="1.5" className="h-3.5 w-3.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

// ─── صور أزياء (بلا أشخاص) ───────────────────────────────────────────────────
// سياسة الصور: لا صور لنساء غير محجّبات. استُبدلت صور العارضات بصور تحريرية
// خالية من الأشخاص (بوتيك، رفوف ملابس، تنسيقات مسطّحة) لضمان الالتزام.
// يمكن للمالك استبدالها لاحقًا بصور لرجال أو لنساء محجّبات بعد التحقق البصري.
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=85'
]

const LOOK_IMAGES = [
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
]

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1582142839970-2b9e04b60f65?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
]

// ─── Navbar ────────────────────────────────────────────────────────────────────
function LookbookNav({ content, colors, headingFont, bodyFont, view, setView }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string; view: LookbookView; setView: (v: LookbookView) => void }) {
  const leftLinks: { label: string; view: LookbookView }[] = [
    { label: 'المتجر', view: 'shop' },
    { label: 'لوك بوك', view: 'lookbook' },
    { label: 'من نحن', view: 'about' },
  ]

  return (
    <nav
      className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 backdrop-blur-md"
      style={{ fontFamily: bodyFont, background: `${colors.background}e8`, borderBottom: `1px solid ${colors.border}` }}
    >
      {/* Nav links left */}
      <div className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.18em] md:flex" style={{ color: colors.muted }}>
        {leftLinks.map((item) => (
          <button key={item.view} onClick={() => setView(item.view)} className="cursor-pointer transition hover:opacity-100" style={{ opacity: view === item.view ? 1 : 0.7, color: view === item.view ? colors.text : colors.muted, fontWeight: view === item.view ? 700 : 600 }}>{item.label}</button>
        ))}
      </div>

      {/* Brand center */}
      <button
        onClick={() => setView('home')}
        className="absolute left-1/2 -translate-x-1/2 text-2xl font-black tracking-[0.18em] uppercase"
        style={{ fontFamily: headingFont, color: colors.text, letterSpacing: '0.22em' }}
      >
        {content.brand.name}
      </button>

      {/* Nav right */}
      <div className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.18em] md:flex" style={{ color: colors.muted }}>
        <button onClick={() => setView('shop')} className="cursor-pointer transition hover:opacity-100" style={{ opacity: 0.7 }}>تخفيضات</button>
        <button className="text-lg" style={{ color: colors.text }}>🛍</button>
      </div>
    </nav>
  )
}

// ─── Drop Banner ───────────────────────────────────────────────────────────────
function DropBanner({ content, colors, bodyFont }: { content: LookbookContent; colors: Colors; bodyFont: string }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div
      data-section="drop_banner"
      className="relative z-40 flex items-center justify-center gap-4 px-6 py-3 text-center text-xs font-semibold"
      style={{ background: colors.badge, color: colors.badgeText, fontFamily: bodyFont }}
    >
      <span>{content.drop_banner.label}</span>
      <span className="hidden sm:block" style={{ opacity: 0.7 }}>·</span>
      <span className="hidden sm:block">{content.drop_banner.text}</span>
      <span className="cursor-pointer underline underline-offset-2">{content.drop_banner.cta}</span>
      <button onClick={() => setVisible(false)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function LookbookHero({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="hero" className="relative flex h-screen min-h-[600px] items-end overflow-hidden">
      {/* Full-bleed image */}
      <img
        src={HERO_IMAGES[0]}
        alt="Hero"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.overlay} 0%, rgba(0,0,0,0.15) 55%, transparent 100%)` }} />

      {/* Badge top right */}
      {content.hero.badge && (
        <motion.div
          {...fadeAnim(rm,0.4)}
          className="absolute right-8 top-24 rounded-full border px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white"
          style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
        >
          {content.hero.badge}
        </motion.div>
      )}

      {/* Text content */}
      <div className="relative z-10 w-full px-8 pb-16 md:px-16 md:pb-20">
        <motion.p {...fadeAnim(rm,0.1)} className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/70" style={{ fontFamily: bodyFont }}>
          {content.hero.eyebrow}
        </motion.p>
        <motion.h1
          {...fadeAnim(rm,0.2)}
          className="mb-6 max-w-3xl text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl md:text-8xl"
          style={{ fontFamily: headingFont }}
        >
          <Headline text={content.hero.headline} />
        </motion.h1>
        <motion.div {...fadeAnim(rm,0.35)} className="flex flex-wrap gap-3">
          <button
            className="rounded-full px-8 py-3.5 text-sm font-black uppercase tracking-wider text-white transition hover:scale-105"
            style={{ background: colors.primary, letterSpacing: '0.12em' }}
          >
            {content.hero.cta_primary}
          </button>
          <button
            className="rounded-full border px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10"
            style={{ borderColor: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}
          >
            {content.hero.cta_secondary}
          </button>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        {...fadeAnim(rm,0.6)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="h-10 w-px animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/50">مرّر</span>
      </motion.div>
    </section>
  )
}

// ─── Lookbook Grid ─────────────────────────────────────────────────────────────
function LookbookGrid({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  const looks = content.lookbook.looks.slice(0, 6)

  return (
    <section data-section="lookbook_section" className="px-6 py-20 md:px-12 md:py-28" style={{ background: colors.background, fontFamily: bodyFont }}>
      <motion.div {...revealAnim(rm,0)} className="mb-14 text-center">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.35em]" style={{ color: colors.muted }}>{content.lookbook.eyebrow}</p>
        <h2 className="text-5xl font-black tracking-tight md:text-6xl" style={{ fontFamily: headingFont, color: colors.text }}>
          <Headline text={content.lookbook.heading} />
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed" style={{ color: colors.muted }}>{content.lookbook.subheading}</p>
      </motion.div>

      {/* Asymmetric editorial grid */}
      <div className="mx-auto max-w-7xl">
        {/* Row 1: large left + 2 stacked right */}
        <div className="mb-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <LookCard look={looks[0]} image={LOOK_IMAGES[0]} colors={colors} headingFont={headingFont} tall delay={0} />
          <div className="grid grid-rows-2 gap-4">
            <LookCard look={looks[1]} image={LOOK_IMAGES[1]} colors={colors} headingFont={headingFont} delay={0.08} />
            <LookCard look={looks[2]} image={LOOK_IMAGES[2]} colors={colors} headingFont={headingFont} delay={0.14} />
          </div>
        </div>
        {/* Row 2: 3 equal */}
        <div className="grid gap-4 sm:grid-cols-3">
          {looks.slice(3, 6).map((look, i) => (
            <LookCard key={i} look={look} image={LOOK_IMAGES[3 + i]} colors={colors} headingFont={headingFont} delay={0.06 * i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function LookCard({ look, image, colors, headingFont, tall = false, delay = 0 }: {
  look: LookbookContent['lookbook']['looks'][0]
  image: string
  colors: Colors
  headingFont: string
  tall?: boolean
  delay?: number
}) {
  const rm = !!useReducedMotion()
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      {...revealAnim(rm,delay)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative overflow-hidden ${tall ? 'h-[520px] md:h-[680px]' : 'h-[260px] md:h-[320px]'}`}
      style={{ cursor: 'pointer' }}
    >
      <img
        src={image}
        alt={look.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: colors.overlay, opacity: hovered ? 0.65 : 0.25 }}
      />
      {/* Bottom text */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <motion.div
          animate={{ y: hovered ? 0 : 8, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <span
            className="rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            {look.tag || 'Shop this look'}
          </span>
        </motion.div>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-white/70">{look.title}</p>
        <p className="text-lg font-black text-white" style={{ fontFamily: headingFont }}>{look.subtitle}</p>
      </div>
    </motion.div>
  )
}

// ─── Bestsellers ───────────────────────────────────────────────────────────────
function LookbookBestsellers({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  const products = content.bestsellers.products.slice(0, 8)

  return (
    <section data-section="bestsellers" className="px-6 py-20 md:px-12 md:py-24" style={{ background: colors.surfaceAlt, fontFamily: bodyFont }}>
      <motion.div {...revealAnim(rm,0)} className="mb-12 flex items-end justify-between">
        <div>
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: colors.muted }}>{content.bestsellers.eyebrow}</p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl" style={{ fontFamily: headingFont, color: colors.text }}>
            <Headline text={content.bestsellers.heading} />
          </h2>
        </div>
        <span className="hidden cursor-pointer text-sm font-semibold underline underline-offset-4 md:block" style={{ color: colors.muted }}>
          View all →
        </span>
      </motion.div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard key={i} product={product} image={PRODUCT_IMAGES[i % PRODUCT_IMAGES.length]} colors={colors} headingFont={headingFont} delay={0.04 * i} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product, image, colors, headingFont, delay = 0 }: {
  product: LookbookContent['bestsellers']['products'][0]
  image: string
  colors: Colors
  headingFont: string
  delay?: number
}) {
  const rm = !!useReducedMotion()
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div {...revealAnim(rm,delay)} className="group cursor-pointer">
      <div
        className="relative mb-3 overflow-hidden"
        style={{ aspectRatio: '3/4' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Badge */}
        {product.badge && (
          <div
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wider"
            style={{ background: colors.badge, color: colors.badgeText }}
          >
            {product.badge}
          </div>
        )}
        {/* Quick add */}
        <motion.div
          animate={{ y: hovered ? 0 : 12, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 py-3 text-center text-xs font-black uppercase tracking-wider text-white"
          style={{ background: colors.overlay, backdropFilter: 'blur(4px)' }}
        >
          Quick add +
        </motion.div>
      </div>
      <div>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em]" style={{ color: colors.muted }}>{product.category}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug" style={{ color: colors.text, fontFamily: headingFont }}>{product.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: colors.text }}>{product.price}</span>
          {product.original_price && (
            <span className="text-xs line-through" style={{ color: colors.muted }}>{product.original_price}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Brand Story ───────────────────────────────────────────────────────────────
function LookbookStory({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="brand_story" className="overflow-hidden" style={{ background: colors.background, fontFamily: bodyFont }}>
      <div className="grid md:grid-cols-2">
        {/* Image side */}
        <div className="relative h-[480px] md:h-auto">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
            alt="Brand story"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Text side */}
        <motion.div {...revealAnim(rm,0.1)} className="flex flex-col justify-center px-8 py-16 md:px-14 md:py-20">
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: colors.muted }}>
            {content.brand_story.eyebrow}
          </p>
          <h2 className="mb-6 text-4xl font-black leading-[1.1] tracking-tight md:text-5xl" style={{ fontFamily: headingFont, color: colors.text }}>
            <Headline text={content.brand_story.heading} />
          </h2>
          <p className="mb-10 text-sm leading-relaxed" style={{ color: colors.muted }}>{content.brand_story.body}</p>

          <div className="space-y-6">
            {content.brand_story.values.map((val, i) => (
              <motion.div key={i} {...revealAnim(rm,0.1 + 0.08 * i)} className="flex items-start gap-4">
                <span className="mt-0.5 text-lg" style={{ color: colors.accent }}>{val.icon}</span>
                <div>
                  <p className="text-sm font-black" style={{ color: colors.text }}>{val.title}</p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: colors.muted }}>{val.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Press ─────────────────────────────────────────────────────────────────────
function LookbookPress({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  return (
    <section data-section="press" className="border-y px-8 py-10" style={{ borderColor: colors.border, background: colors.surfaceAlt, fontFamily: bodyFont }}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-7 text-center text-[0.65rem] font-bold uppercase tracking-[0.32em]" style={{ color: colors.muted }}>
          {content.press.heading}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {content.press.publications.map((pub) => (
            <span
              key={pub}
              className="text-base font-black italic tracking-wide transition hover:opacity-100"
              style={{ fontFamily: headingFont, color: colors.muted, opacity: 0.55 }}
            >
              {pub}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ──────────────────────────────────────────────────────────────
function LookbookTestimonials({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="testimonials" className="px-6 py-20 md:px-12 md:py-24" style={{ background: colors.background, fontFamily: bodyFont }}>
      <div className="mx-auto max-w-6xl">
        <motion.div {...revealAnim(rm,0)} className="mb-14 text-center">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.32em]" style={{ color: colors.muted }}>{content.testimonials.eyebrow}</p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl" style={{ fontFamily: headingFont, color: colors.text }}>
            {content.testimonials.heading}
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Stars rating={5} color={colors.accent} />
            <span className="text-sm font-semibold" style={{ color: colors.muted }}>
              {content.testimonials.average_rating} · {content.testimonials.review_count}
            </span>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {content.testimonials.items.map((review, i) => (
            <ReviewCard key={i} review={review} colors={colors} headingFont={headingFont} delay={0.08 * i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewCard({ review, colors, headingFont, delay = 0 }: { review: LookbookReview; colors: Colors; headingFont: string; delay?: number }) {
  const rm = !!useReducedMotion()
  return (
    <motion.div
      {...revealAnim(rm,delay)}
      className="flex flex-col rounded-2xl border p-7"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <Stars rating={review.rating} color={colors.accent} />
      <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: colors.text }}>
        &ldquo;{review.text}&rdquo;
      </p>
      <div className="mt-6 border-t pt-5" style={{ borderColor: colors.border }}>
        <p className="text-sm font-black" style={{ color: colors.text, fontFamily: headingFont }}>{review.author}</p>
        {review.item && (
          <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>Purchased: {review.item}</p>
        )}
        {review.verified && (
          <p className="mt-1 flex items-center gap-1 text-[0.65rem] font-semibold" style={{ color: colors.accent }}>
            ✓ Verified purchase
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Size Guide strip ──────────────────────────────────────────────────────────
function SizeGuideStrip({ colors, bodyFont }: { colors: Colors; bodyFont: string }) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  return (
    <section className="px-6 py-10 text-center" style={{ background: colors.surfaceAlt, fontFamily: bodyFont }}>
      <p className="mb-5 text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: colors.muted }}>
        Size guide · All styles run true to size
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sizes.map((s) => (
          <div
            key={s}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-xs font-black"
            style={{ borderColor: colors.border, color: colors.text, background: colors.surface }}
          >
            {s}
          </div>
        ))}
        <span className="ml-3 cursor-pointer text-xs font-semibold underline underline-offset-4" style={{ color: colors.muted }}>
          Full size guide →
        </span>
      </div>
    </section>
  )
}

// ─── Newsletter ────────────────────────────────────────────────────────────────
function LookbookNewsletter({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <section data-section="newsletter" className="relative overflow-hidden py-24" style={{ fontFamily: bodyFont }}>
      {/* Background image with overlay */}
      <img
        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80"
        alt="Newsletter"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: colors.overlay }} />

      <motion.div {...revealAnim(rm,0)} className="relative z-10 mx-auto max-w-lg px-6 text-center">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-white/60">{content.newsletter.eyebrow}</p>
        <h2 className="mb-3 text-4xl font-black text-white md:text-5xl" style={{ fontFamily: headingFont }}>
          <Headline text={content.newsletter.heading} />
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/70">{content.newsletter.subheading}</p>

        {submitted ? (
          <p className="text-sm font-semibold text-white">✓ You're on the list. Watch your inbox.</p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true) }}
            className="flex overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={content.newsletter.placeholder}
              className="flex-1 bg-transparent px-6 py-3.5 text-sm text-white placeholder-white/50 outline-none"
            />
            <button
              type="submit"
              className="rounded-full px-6 py-3 text-xs font-black uppercase tracking-wider transition hover:scale-105"
              style={{ background: colors.badge, color: colors.badgeText, margin: '4px' }}
            >
              {content.newsletter.cta}
            </button>
          </form>
        )}
        <p className="mt-4 text-[0.65rem] text-white/40">{content.newsletter.note}</p>
      </motion.div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function LookbookFooter({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const links = {
    Shop: ['New arrivals', 'Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'],
    Help: ['Size guide', 'Shipping', 'Returns', 'FAQ', 'Contact'],
    Brand: ['Our story', 'Sustainability', 'Press', 'Careers', 'Stores']
  }

  return (
    <footer className="border-t px-8 pb-10 pt-14" style={{ background: colors.surface, borderColor: colors.border, fontFamily: bodyFont }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <p className="mb-2 text-2xl font-black tracking-[0.18em] uppercase" style={{ fontFamily: headingFont, color: colors.text }}>
              {content.brand.name}
            </p>
            <p className="mb-5 text-sm" style={{ color: colors.muted }}>{content.footer.tagline}</p>
            <p className="text-xs" style={{ color: colors.muted }}>{content.footer.email}</p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="mb-4 text-[0.65rem] font-black uppercase tracking-[0.2em]" style={{ color: colors.text }}>{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <span className="cursor-pointer text-xs transition hover:opacity-100" style={{ color: colors.muted, opacity: 0.7 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row" style={{ borderColor: colors.border }}>
          <p className="text-xs" style={{ color: colors.muted, opacity: 0.55 }}>{content.footer.legal}</p>
          <div className="flex gap-6 text-xs" style={{ color: colors.muted, opacity: 0.55 }}>
            {['Privacy', 'Terms', 'Accessibility'].map((l) => (
              <span key={l} className="cursor-pointer hover:opacity-100">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function LookbookPreview({
  content,
  presetId = 'noir',
  className = '',
  colorOverrides,
  typographyPreset,
  view: controlledView,
  onViewChange,
}: Props) {
  const preset = useMemo(() => getLookbookPreset(presetId), [presetId])
  const colors = useMemo(
    () => ({ ...preset.colors, ...(colorOverrides || {}) }),
    [preset.colors, colorOverrides]
  )
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  const headingFont = typo?.heading_font ?? preset.heading_font
  const bodyFont    = typo?.body_font    ?? preset.body_font

  const [internalView, setInternalView] = useState<LookbookView>('home')
  const view = (controlledView as LookbookView) || internalView
  const setView = (v: LookbookView) => {
    if (onViewChange) onViewChange(v); else setInternalView(v)
  }

  return (
    <div className={`min-h-screen ${className}`} style={{ background: colors.background, color: colors.text }}>
      <link rel="stylesheet" href={buildGoogleFontsUrl(TYPOGRAPHY_PRESETS)} />
      <DropBanner content={content} colors={colors} bodyFont={bodyFont} />
      <LookbookNav content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} view={view} setView={setView} />

      {view === 'home' && (
        <>
          <LookbookHero content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <LookbookBestsellers content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <LookbookTestimonials content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <LookbookNewsletter content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
        </>
      )}
      {view === 'shop' && (
        <>
          <LookbookBestsellers content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <SizeGuideStrip colors={colors} bodyFont={bodyFont} />
        </>
      )}
      {view === 'lookbook' && <LookbookGrid content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />}
      {view === 'about' && (
        <>
          <LookbookStory content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <LookbookPress content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
        </>
      )}

      <LookbookFooter content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
    </div>
  )
}
