"use client"

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/components/icons'
import type { LookbookContent, LookbookReview } from '@/utils/lookbook/types'
import { getLookbookPreset } from '@/utils/lookbook/presets'
import BookingSection from '@/components/site/BookingSection'
import { useBookingContext } from '@/components/site/BookingContext'
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
// سياسة الصور: لا صور لنساء غير محجّبات. صورة الخلفية هنا للأجواء فقط (الواجهة
// والنشرة البريدية) ولا تُقدَّم على أنها من أعمال العلامة.
// المنتجات والإطلالات وقصة العلامة لا تعرض إلا صور المالك المرفوعة، فلا تُنسب
// صورة من مكتبة عامة إلى العلامة. بلا صور مرفوعة تُرسم البطاقات بلا صورة.
const HERO_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=85'
const NEWSLETTER_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80'

/** The owner's uploaded photo for tile i, cycling through the gallery. None uploaded: undefined. */
function ownPhoto(content: LookbookContent, i: number): string | undefined {
  const gallery = (content.images?.gallery || []).filter(Boolean)
  return gallery.length ? gallery[i % gallery.length] : undefined
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function LookbookNav({ content, colors, headingFont, bodyFont, view, setView }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string; view: LookbookView; setView: (v: LookbookView) => void }) {
  const leftLinks: { label: string; view: LookbookView }[] = [
    { label: 'المتجر', view: 'shop' },
    { label: 'لوك بوك', view: 'lookbook' },
    { label: 'من نحن', view: 'about' },
  ]
  const [menuOpen, setMenuOpen] = useState(false)
  // Close the mobile menu whenever the page changes.
  const go = (v: LookbookView) => { setView(v); setMenuOpen(false) }

  return (
    <div
      className="sticky top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ fontFamily: bodyFont, background: `${colors.background}e8`, borderBottom: `1px solid ${colors.border}` }}
    >
      <nav className="relative flex items-center justify-between px-6 py-5 md:px-8">
        {/* Hamburger — mobile only (start side). */}
        <button
          type="button"
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center md:hidden"
          style={{ color: colors.text }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            {menuOpen
              ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        {/* Nav links left */}
        <div className="hidden items-center gap-8 text-xs font-semibold uppercase md:flex" style={{ color: colors.muted }}>
          {leftLinks.map((item) => (
            <button key={item.view} onClick={() => setView(item.view)} className="cursor-pointer transition hover:opacity-100" style={{ opacity: view === item.view ? 1 : 0.7, color: view === item.view ? colors.text : colors.muted, fontWeight: view === item.view ? 700 : 600 }}>{item.label}</button>
          ))}
        </div>

        {/* Brand center */}
        <button
          onClick={() => setView('home')}
          className="absolute left-1/2 -translate-x-1/2 text-2xl font-black uppercase"
          style={{ fontFamily: headingFont, color: colors.text }}
        >
          {content.brand.name}
        </button>

        {/* Nav right */}
        <div className="hidden items-center gap-8 text-xs font-semibold uppercase md:flex" style={{ color: colors.muted }}>
          <button onClick={() => setView('shop')} className="cursor-pointer transition hover:opacity-100" style={{ opacity: 0.7 }}>تخفيضات</button>
          <button onClick={() => setView('shop')} className="text-lg" style={{ color: colors.text }} aria-label="المتجر">🛍</button>
        </div>

        {/* Cart — mobile only (end side), keeps the brand centered. */}
        <button onClick={() => go('shop')} className="md:hidden" style={{ color: colors.text }} aria-label="المتجر"><Icon name="shopping-bag" size={20} animation="none" /></button>
      </nav>

      {/* Mobile dropdown — the page list, unreachable below md without this. */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden md:hidden"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <div className="flex flex-col px-6 py-2">
            {leftLinks.map((item) => (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className="py-3 text-right text-xs font-semibold uppercase transition"
                style={{ color: view === item.view ? colors.text : colors.muted, fontWeight: view === item.view ? 700 : 600 }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => go('shop')}
              className="py-3 text-right text-xs font-semibold uppercase transition"
              style={{ color: colors.muted }}
            >
              تخفيضات
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Drop Banner ───────────────────────────────────────────────────────────────
function DropBanner({ content, colors, bodyFont, go }: { content: LookbookContent; colors: Colors; bodyFont: string; go: (v: LookbookView) => void }) {
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
      <button type="button" onClick={() => go('shop')} className="cursor-pointer underline underline-offset-2">{content.drop_banner.cta}</button>
      <button onClick={() => setVisible(false)} aria-label="إغلاق" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"><Icon name="close" size={14} animation="none" hover={false} /></button>
    </div>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function LookbookHero({ content, colors, headingFont, bodyFont, go }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string; go: (v: LookbookView) => void }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="hero" className="relative flex h-screen min-h-[600px] items-end overflow-hidden">
      {/* Full-bleed image */}
      <img
        src={content.images?.hero || HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.overlay} 0%, rgba(0,0,0,0.15) 55%, transparent 100%)` }} />

      {/* Badge top right */}
      {content.hero.badge && (
        <motion.div
          {...fadeAnim(rm,0.4)}
          className="absolute right-8 top-24 rounded-full border px-4 py-1.5 text-[0.65rem] font-bold uppercase text-white"
          style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
        >
          {content.hero.badge}
        </motion.div>
      )}

      {/* Text content */}
      <div className="relative z-10 w-full px-8 pb-16 md:px-16 md:pb-20">
        <motion.p {...fadeAnim(rm,0.1)} className="mb-4 text-xs font-semibold uppercase text-white/70" style={{ fontFamily: bodyFont }}>
          {content.hero.eyebrow}
        </motion.p>
        <motion.h1
          {...fadeAnim(rm,0.2)}
          className="mb-6 max-w-3xl text-5xl font-black leading-[1.04] text-white sm:text-6xl md:text-8xl"
          style={{ fontFamily: headingFont }}
        >
          <Headline text={content.hero.headline} />
        </motion.h1>
        <motion.div {...fadeAnim(rm,0.35)} className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => go('shop')}
            className="rounded-full px-8 py-3.5 text-sm font-black uppercase text-white transition hover:scale-105"
            style={{ background: colors.primary }}
          >
            {content.hero.cta_primary}
          </button>
          <button
            type="button"
            onClick={() => go('lookbook')}
            className="rounded-full border px-8 py-3.5 text-sm font-semibold uppercase text-white transition hover:bg-white/10"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
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
        <span className="text-[0.6rem] uppercase text-white/50">مرّر</span>
      </motion.div>
    </section>
  )
}

// ─── Lookbook Grid ─────────────────────────────────────────────────────────────
function LookbookGrid({ content, colors, headingFont, bodyFont, go }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string; go: (v: LookbookView) => void }) {
  const rm = !!useReducedMotion()
  const looks = (content.lookbook.looks || []).slice(0, 6)
  if (!looks.length) return null

  return (
    <section data-section="lookbook_section" className="px-6 py-20 md:px-12 md:py-28" style={{ background: colors.background, fontFamily: bodyFont }}>
      <motion.div {...revealAnim(rm,0)} className="mb-14 text-center">
        <p className="mb-3 text-[0.65rem] font-bold uppercase" style={{ color: colors.muted }}>{content.lookbook.eyebrow}</p>
        <h2 className="text-5xl font-black md:text-6xl" style={{ fontFamily: headingFont, color: colors.text }}>
          <Headline text={content.lookbook.heading} />
        </h2>
        {content.lookbook.subheading ? <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed" style={{ color: colors.muted }}>{content.lookbook.subheading}</p> : null}
      </motion.div>

      {/* Asymmetric editorial grid */}
      <div className="mx-auto max-w-7xl">
        {/* Row 1: large left + 2 stacked right */}
        <div className="mb-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <LookCard look={looks[0]} image={ownPhoto(content, 0)} colors={colors} headingFont={headingFont} tall delay={0} onOpen={() => go('shop')} />
          <div className="grid grid-rows-2 gap-4">
            <LookCard look={looks[1]} image={ownPhoto(content, 1)} colors={colors} headingFont={headingFont} delay={0.08} onOpen={() => go('shop')} />
            <LookCard look={looks[2]} image={ownPhoto(content, 2)} colors={colors} headingFont={headingFont} delay={0.14} onOpen={() => go('shop')} />
          </div>
        </div>
        {/* Row 2: 3 equal */}
        <div className="grid gap-4 sm:grid-cols-3">
          {looks.slice(3, 6).map((look, i) => (
            <LookCard key={i} look={look} image={ownPhoto(content, 3 + i)} colors={colors} headingFont={headingFont} delay={0.06 * i} onOpen={() => go('shop')} />
          ))}
        </div>
      </div>
    </section>
  )
}

function LookCard({ look, image, colors, headingFont, tall = false, delay = 0, onOpen }: {
  look: LookbookContent['lookbook']['looks'][0] | undefined
  /** The owner's own photo. Absent: the card is drawn as a plain panel. */
  image?: string
  colors: Colors
  headingFont: string
  tall?: boolean
  delay?: number
  onOpen: () => void
}) {
  const rm = !!useReducedMotion()
  const [hovered, setHovered] = useState(false)
  if (!look) return null
  return (
    <motion.div
      {...revealAnim(rm,delay)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      role="link"
      tabIndex={0}
      aria-label={look.title}
      className={`group relative overflow-hidden ${tall ? 'h-[520px] md:h-[680px]' : 'h-[260px] md:h-[320px]'}`}
      style={{ cursor: 'pointer' }}
    >
      {image ? (
        <img
          src={image}
          alt={look.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}` }} />
      )}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: colors.overlay, opacity: hovered ? 0.65 : image ? 0.25 : 0 }}
      />
      {/* Bottom text */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <motion.div
          animate={{ y: hovered ? 0 : 8, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <span
            className="rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase text-white"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            {look.tag || 'تسوّق هذه الإطلالة'}
          </span>
        </motion.div>
        <p className="text-[0.6rem] font-semibold uppercase" style={{ color: image || hovered ? 'rgba(255,255,255,0.7)' : colors.muted }}>{look.title}</p>
        <p className="text-lg font-black" style={{ fontFamily: headingFont, color: image || hovered ? '#fff' : colors.text }}>{look.subtitle}</p>
      </div>
    </motion.div>
  )
}

// ─── Bestsellers ───────────────────────────────────────────────────────────────
function LookbookBestsellers({ content, colors, headingFont, bodyFont, go }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string; go?: (v: LookbookView) => void }) {
  const rm = !!useReducedMotion()
  const products = (content.bestsellers.products || []).slice(0, 8)
  if (!products.length) return null

  return (
    <section data-section="bestsellers" className="px-6 py-20 md:px-12 md:py-24" style={{ background: colors.surfaceAlt, fontFamily: bodyFont }}>
      <motion.div {...revealAnim(rm,0)} className="mb-12 flex items-end justify-between">
        <div>
          <p className="mb-2 text-[0.65rem] font-bold uppercase" style={{ color: colors.muted }}>{content.bestsellers.eyebrow}</p>
          <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: headingFont, color: colors.text }}>
            <Headline text={content.bestsellers.heading} />
          </h2>
        </div>
        {go ? (
          <button type="button" onClick={() => go('shop')} className="hidden cursor-pointer text-sm font-semibold underline underline-offset-4 md:block" style={{ color: colors.muted }}>
            عرض الكل ←
          </button>
        ) : null}
      </motion.div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard key={i} product={product} image={ownPhoto(content, i)} colors={colors} headingFont={headingFont} delay={0.04 * i} onOpen={go ? () => go('shop') : undefined} />
        ))}
      </div>
    </section>
  )
}


/** The letter a photo-less product card shows. The Arabic article is skipped:
 *  most names start with "ال", and a row of bare alifs tells nothing apart. */
function productInitial(name: string): string {
  const n = name.trim()
  const rest = n.startsWith('ال') && n.length > 2 ? n.slice(2) : n
  return rest.charAt(0)
}

function ProductCard({ product, image, colors, headingFont, delay = 0, onOpen }: {
  product: LookbookContent['bestsellers']['products'][0]
  /** The owner's own photo. Absent: a plain panel with the product's first letter. */
  image?: string
  colors: Colors
  headingFont: string
  delay?: number
  /** Where a tap goes. Absent on the shop page itself, which is already there. */
  onOpen?: () => void
}) {
  const rm = !!useReducedMotion()
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      {...revealAnim(rm,delay)}
      className={`group ${onOpen ? 'cursor-pointer' : ''}`}
      {...(onOpen ? {
        onClick: onOpen,
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } },
        role: 'link',
        tabIndex: 0,
        'aria-label': product.name,
      } : {})}
    >
      <div
        className="relative mb-3 overflow-hidden"
        style={{ aspectRatio: '3/4' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <span className="text-6xl font-black leading-none" style={{ fontFamily: headingFont, color: colors.muted, opacity: 0.35 }}>{productInitial(product.name)}</span>
          </div>
        )}
        {/* Badge */}
        {product.badge && (
          <div
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase"
            style={{ background: colors.badge, color: colors.badgeText }}
          >
            {product.badge}
          </div>
        )}
        {/* Quick add */}
        <motion.div
          animate={{ y: hovered ? 0 : 12, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 py-3 text-center text-xs font-black uppercase text-white"
          style={{ background: colors.overlay, backdropFilter: 'blur(4px)' }}
        >
          إضافة سريعة +
        </motion.div>
      </div>
      <div>
        {product.category ? <p className="text-[0.6rem] font-semibold uppercase" style={{ color: colors.muted }}>{product.category}</p> : null}
        <p className="mt-0.5 text-sm font-semibold leading-snug" style={{ color: colors.text, fontFamily: headingFont }}>{product.name}</p>
        {product.price ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: colors.text }}>{product.price}</span>
          {product.original_price && (
            <span className="text-xs line-through" style={{ color: colors.muted }}>{product.original_price}</span>
          )}
        </div>
        ) : null}
      </div>
    </motion.div>
  )
}

// ─── Brand Story ───────────────────────────────────────────────────────────────
function LookbookStory({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  // "Our story" shows the owner's own photo or none.
  const photo = content.images?.hero || ownPhoto(content, 0)
  return (
    <section data-section="brand_story" className="overflow-hidden" style={{ background: colors.background, fontFamily: bodyFont }}>
      <div className={photo ? 'grid md:grid-cols-2' : 'mx-auto max-w-3xl'}>
        {/* Image side */}
        {photo ? (
          <div className="relative h-[480px] md:h-auto">
            <img
              src={photo}
              alt={content.brand.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : null}

        {/* Text side */}
        <motion.div {...revealAnim(rm,0.1)} className="flex flex-col justify-center px-8 py-16 md:px-14 md:py-20">
          <p className="mb-4 text-[0.65rem] font-bold uppercase" style={{ color: colors.muted }}>
            {content.brand_story.eyebrow}
          </p>
          <h2 className="mb-6 text-4xl font-black leading-[1.1] md:text-5xl" style={{ fontFamily: headingFont, color: colors.text }}>
            <Headline text={content.brand_story.heading} />
          </h2>
          {content.brand_story.body ? <p className="mb-10 text-sm leading-relaxed" style={{ color: colors.muted }}>{content.brand_story.body}</p> : null}

          {content.brand_story.values?.length ? (
          <div className="space-y-6">
            {content.brand_story.values.map((val, i) => (
              <motion.div key={i} {...revealAnim(rm,0.1 + 0.08 * i)} className="flex items-start gap-4">
                <span className="mt-0.5" style={{ color: colors.accent }}><Icon name={val.icon} size={18} animation="pop" /></span>
                <div>
                  <p className="text-sm font-black" style={{ color: colors.text }}>{val.title}</p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: colors.muted }}>{val.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Press ─────────────────────────────────────────────────────────────────────
function LookbookPress({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  // Only publications the owner named. None given, no section.
  if (!content.press?.publications?.length) return null
  return (
    <section data-section="press" className="border-y px-8 py-10" style={{ borderColor: colors.border, background: colors.surfaceAlt, fontFamily: bodyFont }}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-7 text-center text-[0.65rem] font-bold uppercase" style={{ color: colors.muted }}>
          {content.press.heading}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {content.press.publications.map((pub) => (
            <span
              key={pub}
              className="text-base font-black italic transition hover:opacity-100"
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
  // Only the owner's own reviews and rating are ever here. No reviews: no section.
  const t = content.testimonials
  if (!t?.items?.length) return null
  const avg = typeof t.average_rating === 'number' && t.average_rating > 0 ? t.average_rating : 0
  return (
    <section data-section="testimonials" className="px-6 py-20 md:px-12 md:py-24" style={{ background: colors.background, fontFamily: bodyFont }}>
      <div className="mx-auto max-w-6xl">
        <motion.div {...revealAnim(rm,0)} className="mb-14 text-center">
          <p className="mb-2 text-[0.65rem] font-bold uppercase" style={{ color: colors.muted }}>{content.testimonials.eyebrow}</p>
          <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: headingFont, color: colors.text }}>
            {content.testimonials.heading}
          </h2>
          {avg ? (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Stars rating={Math.round(avg)} color={colors.accent} />
              <span className="text-sm font-semibold" style={{ color: colors.muted }}>
                {[avg.toFixed(1), t.review_count].filter(Boolean).join(' · ')}
              </span>
            </div>
          ) : null}
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
          <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>القطعة: {review.item}</p>
        )}
        {review.verified && (
          <p className="mt-1 flex items-center gap-1 text-[0.65rem] font-semibold" style={{ color: colors.accent }}>
            ✓ شراء موثّق
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Size Guide strip ──────────────────────────────────────────────────────────
function SizeGuideStrip({ content, colors, bodyFont }: { content: LookbookContent; colors: Colors; bodyFont: string }) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  // There is no full size chart on the site, so the link asks the brand
  // instead: the contact form when it is on, else an email, else nothing.
  const { enabled: bookingOn } = useBookingContext()
  const email = content.footer.email?.trim()
  const askClass = 'ms-3 inline-flex min-h-[44px] items-center text-xs font-semibold underline underline-offset-4'
  const askLabel = 'استفسار عن المقاس ←'
  return (
    <section className="px-6 py-10 text-center" style={{ background: colors.surfaceAlt, fontFamily: bodyFont }}>
      <p className="mb-5 text-[0.65rem] font-bold uppercase" style={{ color: colors.muted }}>
        دليل المقاسات
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
        {bookingOn ? (
          <button
            type="button"
            onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={`${askClass} cursor-pointer`}
            style={{ color: colors.muted }}
          >
            {askLabel}
          </button>
        ) : email ? (
          <a href={`mailto:${email}`} className={askClass} style={{ color: colors.muted }}>{askLabel}</a>
        ) : null}
      </div>
    </section>
  )
}

// ─── Newsletter ────────────────────────────────────────────────────────────────
// A sign-up lands in the owner's inbox (/dashboard/bookings) as a contact
// request, the same pipe the booking form uses. On a live site without the
// inbox there is nowhere for it to go, so the block is not drawn. In the
// editor/preview a submit is a no-op that still shows the success state.
function LookbookNewsletter({ content, colors, headingFont, bodyFont }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string }) {
  const rm = !!useReducedMotion()
  const { slug, enabled, preview } = useBookingContext()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!preview && !enabled) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('الرجاء إدخال بريد إلكتروني صحيح.')
      setStatus('error')
      return
    }
    setError(null)
    if (preview || !slug) { setStatus('done'); return }

    setStatus('sending')
    try {
      // Same normalisation as BookingForm: drop the /s/<slug> prefix so the
      // inbox shows the site-relative path.
      const p = window.location.pathname || '/'
      const prefix = `/s/${slug}`
      const path = p === prefix ? '/' : p.startsWith(prefix + '/') ? p.slice(prefix.length) : p
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          type: 'contact',
          name: 'مشترك في النشرة البريدية',
          email: value,
          message: 'طلب اشتراك في النشرة البريدية',
          path,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) setStatus('done')
      else { setError('تعذّر تسجيل اشتراكك، حاول مرة أخرى.'); setStatus('error') }
    } catch {
      setError('تعذّر تسجيل اشتراكك، حاول مرة أخرى.')
      setStatus('error')
    }
  }

  return (
    <section data-section="newsletter" className="relative overflow-hidden py-24" style={{ fontFamily: bodyFont }}>
      {/* Background image with overlay */}
      <img
        src={NEWSLETTER_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: colors.overlay }} />

      <motion.div {...revealAnim(rm,0)} className="relative z-10 mx-auto max-w-lg px-6 text-center">
        <p className="mb-3 text-[0.65rem] font-bold uppercase text-white/60">{content.newsletter.eyebrow}</p>
        <h2 className="mb-3 text-4xl font-black text-white md:text-5xl" style={{ fontFamily: headingFont }}>
          <Headline text={content.newsletter.heading} />
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/70">{content.newsletter.subheading}</p>

        {status === 'done' ? (
          <div>
            <p className="text-sm font-semibold text-white">✓ وصلنا بريدك، وستصلك أخبار التشكيلات الجديدة.</p>
            {preview ? <p className="mt-2 text-[0.7rem] text-white/50">معاينة — لن يتم إرسال هذا النموذج فعليًا.</p> : null}
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={content.newsletter.placeholder}
              aria-label={content.newsletter.placeholder || 'البريد الإلكتروني'}
              aria-invalid={status === 'error'}
              className="flex-1 bg-transparent px-6 py-3.5 text-sm text-white placeholder-white/50 outline-none"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-full px-6 py-3 text-xs font-black uppercase transition hover:scale-105 disabled:opacity-60"
              style={{ background: colors.badge, color: colors.badgeText, margin: '4px' }}
            >
              {status === 'sending' ? 'جارٍ الإرسال…' : content.newsletter.cta}
            </button>
          </form>
        )}
        {status === 'error' && error ? <p role="alert" className="mt-3 text-xs font-semibold text-white">{error}</p> : null}
        {content.newsletter.note ? <p className="mt-4 text-[0.65rem] text-white/40">{content.newsletter.note}</p> : null}
      </motion.div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function LookbookFooter({ content, colors, headingFont, bodyFont, go }: { content: LookbookContent; colors: Colors; headingFont: string; bodyFont: string; go: (v: LookbookView) => void }) {
  const links = {
    'التسوّق': ['وصل حديثًا', 'فساتين', 'بلوزات', 'تنانير', 'معاطف', 'إكسسوارات'],
    'المساعدة': ['دليل المقاسات', 'الشحن', 'الإرجاع', 'الأسئلة الشائعة', 'تواصل'],
    'العلامة': ['قصتنا', 'الاستدامة', 'الصحافة', 'الوظائف', 'المتاجر']
  }
  // Only items with a real destination on this site are clickable. The rest
  // (shipping, returns, careers, stores…) have no page — they stay plain text.
  const { enabled: bookingOn } = useBookingContext()
  const email = content.footer.email?.trim()
  const hasPress = !!content.press?.publications?.length
  const toContact = () => {
    const el = typeof document !== 'undefined' ? document.getElementById('booking') : null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (email) window.location.href = `mailto:${email}`
  }
  const actionFor = (item: string): (() => void) | null => {
    switch (item) {
      case 'وصل حديثًا': case 'فساتين': case 'بلوزات': case 'تنانير': case 'معاطف': case 'إكسسوارات':
      case 'دليل المقاسات':
        return () => go('shop')
      case 'قصتنا':
        return () => go('about')
      case 'الصحافة':
        return hasPress ? () => go('about') : null
      case 'تواصل':
        return bookingOn || email ? toContact : null
      default:
        return null
    }
  }

  return (
    <footer className="border-t px-8 pb-10 pt-14" style={{ background: colors.surface, borderColor: colors.border, fontFamily: bodyFont }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <p className="mb-2 text-2xl font-black uppercase" style={{ fontFamily: headingFont, color: colors.text }}>
              {content.brand.name}
            </p>
            <p className="mb-5 text-sm" style={{ color: colors.muted }}>{content.footer.tagline}</p>
            {content.footer.email ? <p className="text-xs" style={{ color: colors.muted }}>{content.footer.email}</p> : null}
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="mb-4 text-[0.65rem] font-black uppercase" style={{ color: colors.text }}>{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => {
                  const act = actionFor(item)
                  return (
                    <li key={item}>
                      {act ? (
                        <button type="button" onClick={act} className="cursor-pointer text-xs transition hover:opacity-100" style={{ color: colors.muted, opacity: 0.7 }}>{item}</button>
                      ) : (
                        <span className="text-xs" style={{ color: colors.muted, opacity: 0.7 }}>{item}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row" style={{ borderColor: colors.border }}>
          <p className="text-xs" style={{ color: colors.muted, opacity: 0.55 }}>{content.footer.legal}</p>
          <div className="flex gap-6 text-xs" style={{ color: colors.muted, opacity: 0.55 }}>
            {['الخصوصية', 'الشروط', 'إمكانية الوصول'].map((l) => (
              <span key={l}>{l}</span>
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
  // In-page links (hero, banner, cards, footer) change page and start at the top.
  const go = (v: LookbookView) => {
    setView(v)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  return (
    <div className={`min-h-screen ${className}`} style={{ background: colors.background, color: colors.text }}>
      <link rel="stylesheet" href={buildGoogleFontsUrl(TYPOGRAPHY_PRESETS)} />
      <DropBanner content={content} colors={colors} bodyFont={bodyFont} go={go} />
      <LookbookNav content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} view={view} setView={setView} />

      {view === 'home' && (
        <>
          <LookbookHero content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} go={go} />
          <LookbookBestsellers content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} go={go} />
          <LookbookTestimonials content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <LookbookNewsletter content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
        </>
      )}
      {view === 'shop' && (
        <>
          <LookbookBestsellers content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <SizeGuideStrip content={content} colors={colors} bodyFont={bodyFont} />
        </>
      )}
      {view === 'lookbook' && <LookbookGrid content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} go={go} />}
      {view === 'about' && (
        <>
          <LookbookStory content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
          <LookbookPress content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} />
        </>
      )}

      <BookingSection
        type="contact"
        eyebrow="تواصل"
        heading="احجز موعدًا خاصًا"
        subheading="اترك تفاصيلك ونسّق معك موعدًا خاصًا أو استفسارًا عن القطع."
        background={colors.surface}
        palette={{
          accent: colors.accent,
          accentText: colors.background,
          text: colors.text,
          muted: colors.muted,
          surface: colors.background,
          border: colors.border,
          headingFont,
          bodyFont,
          radius: 2,
        }}
      />

      <LookbookFooter content={content} colors={colors} headingFont={headingFont} bodyFont={bodyFont} go={go} />
    </div>
  )
}
