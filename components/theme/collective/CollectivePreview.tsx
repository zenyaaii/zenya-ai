"use client"

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import type { CollectiveContent, CollectiveProduct, CollectiveCollection, CollectiveTestimonial } from '@/utils/collective/types'
import { getCollectivePreset } from '@/utils/collective/presets'

type Props = {
  content: CollectiveContent
  presetId?: string
  className?: string
}

type CollectiveView = 'home' | 'collections' | 'arrivals' | 'about'

// ─── Motion helpers ────────────────────────────────────────────────────────────
// Plain functions (not hooks!) so they can be called safely inside .map()
// callbacks and conditional `view === '…'` branches without violating the
// rules of hooks. Every component that uses them calls `useReducedMotion()`
// once at the top to get `rm`, then threads it through.
function revealAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0, y: 40 },
    whileInView: rm ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
  }
}

function fadeUpAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0, y: 20 },
    animate: rm ? {} : { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }
  }
}

function Headline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={style}>
      {text.split('\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ))}
    </span>
  )
}

function Stars({ count = 5, color }: { count?: number; color: string }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill={i < count ? color : 'none'} stroke={color} strokeWidth="1.5" className="h-3.5 w-3.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

// ─── Unsplash image bank ───────────────────────────────────────────────────────
const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1599202860130-f600f4948364?w=600&q=80', // linen
  'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=600&q=80', // ceramics
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', // home
  'https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?w=600&q=80', // skincare
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80', // fashion (بلا أشخاص: بوتيك)
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', // accessories (بلا أشخاص: منتج)
  'https://images.unsplash.com/photo-1622495966585-2c87c0b5d07d?w=600&q=80', // wool
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80', // candle
]

const COLLECTION_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', // living room
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', // wardrobe
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', // morning
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80', // work
]

// ─── Aurora Background ─────────────────────────────────────────────────────────
function AuroraBackground({ colors, children, className = '' }: {
  colors: ReturnType<typeof getCollectivePreset>['colors']
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: colors.background }}>
      {/* Aurora orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-1/3 left-1/4 h-[600px] w-[600px] rounded-full opacity-40 blur-[120px]"
          style={{ background: colors.auroraA, animation: 'aurora-drift 12s ease-in-out infinite' }}
        />
        <div
          className="absolute -top-1/4 right-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[100px]"
          style={{ background: colors.auroraB, animation: 'aurora-drift 9s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-25 blur-[80px]"
          style={{ background: colors.auroraC, animation: 'aurora-drift 15s ease-in-out infinite 2s' }}
        />
      </div>
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.08); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
      {children}
    </div>
  )
}

// ─── Glass Card ────────────────────────────────────────────────────────────────
function GlassCard({ colors, children, className = '', style = {}, hover = true }: {
  colors: ReturnType<typeof getCollectivePreset>['colors']
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hover?: boolean
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border ${className}`}
      style={{
        background: colors.surfaceGlass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: colors.borderGlass,
        ...style
      }}
      whileHover={hover ? { scale: 1.02, borderColor: colors.border } : undefined}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ─── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, index, colors, fonts }: {
  product: CollectiveProduct
  index: number
  colors: ReturnType<typeof getCollectivePreset>['colors']
  fonts: { heading: string; body: string }
}) {
  const [hovered, setHovered] = useState(false)
  const img = PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]

  return (
    <motion.div
      className="group relative flex flex-col overflow-hidden rounded-2xl"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover"
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Badge */}
        {product.badge && (
          <div
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ background: colors.accent, color: colors.textInverse, fontFamily: fonts.body }}
          >
            {product.badge}
          </div>
        )}
        {/* Quick add on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.button
              className="absolute inset-x-3 bottom-3 rounded-xl py-2.5 text-xs font-semibold tracking-wider uppercase"
              style={{ background: colors.primary, color: colors.textInverse, fontFamily: fonts.body }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              إضافة سريعة
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && (
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.muted, fontFamily: fonts.body }}>
            {product.category}
          </span>
        )}
        <p className="text-sm font-medium leading-snug" style={{ color: colors.text, fontFamily: fonts.body }}>
          {product.name}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold" style={{ color: colors.text, fontFamily: fonts.body }}>{product.price}</span>
            {product.original_price && (
              <span className="text-xs line-through" style={{ color: colors.muted }}>{product.original_price}</span>
            )}
          </div>
          {product.rating && <Stars count={product.rating} color={colors.accent} />}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Collection Card ───────────────────────────────────────────────────────────
function CollectionCard({ collection, index, colors, fonts }: {
  collection: CollectiveCollection
  index: number
  colors: ReturnType<typeof getCollectivePreset>['colors']
  fonts: { heading: string; body: string }
}) {
  const img = COLLECTION_IMAGES[index % COLLECTION_IMAGES.length]
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl"
      style={{ aspectRatio: index === 0 ? '3/4' : '1/1' }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
    >
      <motion.img
        src={img}
        alt={collection.name}
        className="h-full w-full object-cover"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0" style={{ background: colors.overlay }} />
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {collection.tag && (
          <span
            className="mb-2 inline-block self-start rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accent}40` }}
          >
            {collection.tag}
          </span>
        )}
        <h3
          className="text-lg font-bold leading-tight text-white"
          style={{ fontFamily: fonts.heading }}
        >
          {collection.name}
        </h3>
        {collection.tagline && (
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: fonts.body }}>
            {collection.tagline}
          </p>
        )}
        {collection.product_count && (
          <span className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: fonts.body }}>
            {collection.product_count}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ item, index, colors, fonts }: {
  item: CollectiveTestimonial
  index: number
  colors: ReturnType<typeof getCollectivePreset>['colors']
  fonts: { heading: string; body: string }
}) {
  return (
    <GlassCard
      colors={colors}
      className="flex flex-col gap-4 p-6"
      style={{ border: `1px solid ${colors.borderGlass}` }}
    >
      <Stars count={item.rating} color={colors.accent} />
      <p className="flex-1 text-sm leading-relaxed" style={{ color: colors.text, fontFamily: fonts.body }}>
        &ldquo;{item.quote}&rdquo;
      </p>
      {item.product && (
        <div
          className="inline-flex self-start rounded-full px-3 py-1 text-[10px] font-medium tracking-wide"
          style={{ background: colors.accentMuted, color: colors.accent }}
        >
          Re: {item.product}
        </div>
      )}
      <div className="flex items-center gap-3 border-t pt-4" style={{ borderColor: colors.borderGlass }}>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: colors.primary, color: colors.textInverse, fontFamily: fonts.heading }}
        >
          {item.avatar_letter}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: colors.text, fontFamily: fonts.body }}>{item.author}</p>
          {item.location && (
            <p className="text-xs" style={{ color: colors.muted, fontFamily: fonts.body }}>{item.location}</p>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function CollectivePreview({ content, presetId, className = '' }: Props) {
  const preset = useMemo(() => getCollectivePreset(presetId ?? 'jade'), [presetId])
  const { colors } = preset
  const fonts = { heading: preset.heading_font, body: preset.body_font }
  const [navOpen, setNavOpen] = useState(false)
  const [view, setView] = useState<CollectiveView>('home')
  const rm = !!useReducedMotion()

  const isLight = colors.background.startsWith('#f') || colors.background.startsWith('#fa')

  return (
    <div className={`relative min-h-screen ${className}`} style={{ background: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex h-16 items-center justify-between px-6 md:px-10"
        style={{
          background: `${colors.background}cc`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${colors.borderGlass}`
        }}
      >
        <button onClick={() => setView('home')} className="text-xl font-bold tracking-tight" style={{ fontFamily: fonts.heading, color: colors.text }}>
          {content.brand.name}
        </button>
        <nav className="hidden items-center gap-8 md:flex">
          {([['التشكيلات', 'collections'], ['وصل حديثًا', 'arrivals'], ['من نحن', 'about']] as [string, CollectiveView][]).map(([label, page]) => (
            <button key={page} className="text-sm transition-colors hover:opacity-100" style={{ color: view === page ? colors.primary : colors.muted, fontFamily: fonts.body, fontWeight: view === page ? 600 : 400 }} onClick={() => setView(page)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            className="hidden rounded-xl px-5 py-2.5 text-sm font-semibold transition-all md:block"
            style={{ background: colors.primary, color: colors.textInverse, fontFamily: fonts.body }}
          >
            {content.hero.cta_primary}
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl md:hidden"
            style={{ background: colors.surfaceGlass, border: `1px solid ${colors.borderGlass}` }}
            onClick={() => setNavOpen(!navOpen)}
          >
            <div className="space-y-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-0.5 w-4 rounded-full" style={{ background: colors.text }} />
              ))}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            className="fixed inset-x-0 top-16 z-40 px-6 py-4"
            style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}` }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {([['التشكيلات', 'collections'], ['وصل حديثًا', 'arrivals'], ['من نحن', 'about']] as [string, CollectiveView][]).map(([label, page]) => (
              <button key={page} className="block w-full py-3 text-right text-sm" style={{ color: view === page ? colors.primary : colors.text, borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body }} onClick={() => { setView(page); setNavOpen(false) }}>
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      {view === 'home' && <AuroraBackground colors={colors} className="relative px-6 pb-24 pt-24 md:px-10 md:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <motion.span
            className="mb-6 inline-block rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: colors.borderGlass, background: colors.surfaceGlass, color: colors.muted, backdropFilter: 'blur(8px)', fontFamily: fonts.body }}
            {...fadeUpAnim(rm,0.1)}
          >
            {content.hero.eyebrow}
          </motion.span>

          <motion.h1
            className="mx-auto mb-6 max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl"
            style={{ fontFamily: fonts.heading, color: colors.text }}
            {...fadeUpAnim(rm,0.2)}
          >
            <Headline text={content.hero.headline} />
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed"
            style={{ color: colors.muted, fontFamily: fonts.body }}
            {...fadeUpAnim(rm,0.3)}
          >
            {content.hero.subheadline}
          </motion.p>

          <motion.div className="flex flex-wrap items-center justify-center gap-4" {...fadeUpAnim(rm,0.4)}>
            <button
              className="rounded-2xl px-8 py-4 text-sm font-semibold tracking-wide shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: colors.primary, color: colors.textInverse, boxShadow: `0 8px 32px -8px ${colors.glowPrimary}`, fontFamily: fonts.body }}
            >
              {content.hero.cta_primary}
            </button>
            <button
              className="rounded-2xl border px-8 py-4 text-sm font-semibold tracking-wide transition-all hover:opacity-80"
              style={{ borderColor: colors.borderGlass, color: colors.text, background: colors.surfaceGlass, backdropFilter: 'blur(8px)', fontFamily: fonts.body }}
            >
              {content.hero.cta_secondary}
            </button>
          </motion.div>

          {content.hero.badge && (
            <motion.p className="mt-6 text-xs" style={{ color: colors.muted, fontFamily: fonts.body }} {...fadeUpAnim(rm,0.5)}>
              ✓ {content.hero.badge}
            </motion.p>
          )}
        </div>

        {/* Hero stats strip */}
        {content.brand_promise?.stats && (
          <motion.div
            className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            initial={rm ? {} : { opacity: 0, y: 24 }}
            animate={rm ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {content.brand_promise.stats.map((stat, i) => (
              <GlassCard
                key={i}
                colors={colors}
                className="p-5 text-center"
                hover={false}
              >
                <div className="text-2xl font-bold" style={{ fontFamily: fonts.heading, color: colors.text }}>{stat.value}</div>
                <div className="mt-1 text-xs" style={{ color: colors.muted, fontFamily: fonts.body }}>{stat.label}</div>
              </GlassCard>
            ))}
          </motion.div>
        )}
      </AuroraBackground>}

      {/* ── COLLECTIONS GRID ─────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'collections') && content.collections && (
        <section className="px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            <motion.div className="mb-14 max-w-xl" {...revealAnim(rm,0)}>
              <span className="mb-3 block text-xs font-semibold uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
                {content.collections.eyebrow}
              </span>
              <h2 className="text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: fonts.heading, color: colors.text }}>
                <Headline text={content.collections.heading} />
              </h2>
              {content.collections.subheading && (
                <p className="mt-4 text-base leading-relaxed" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {content.collections.subheading}
                </p>
              )}
            </motion.div>

            {/* Masonry-style grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Large featured */}
              {content.collections.items.slice(0, 1).map((col, i) => (
                <div key={i} className="col-span-2 row-span-2 md:col-span-2">
                  <CollectionCard collection={col} index={i} colors={colors} fonts={fonts} />
                </div>
              ))}
              {/* Remaining */}
              {content.collections.items.slice(1, 4).map((col, i) => (
                <div key={i + 1} className="col-span-1 md:col-span-1">
                  <CollectionCard collection={col} index={i + 1} colors={colors} fonts={fonts} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ──────────────────────────────────────────────────────── */}
      {(view === 'collections' || view === 'arrivals') && content.new_arrivals && (
        <section className="px-6 py-24 md:px-10" style={{ background: colors.surface }}>
          <div className="mx-auto max-w-6xl">
            <motion.div className="mb-12 flex items-end justify-between" {...revealAnim(rm,0)}>
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
                  {content.new_arrivals.eyebrow}
                </span>
                <h2 className="text-4xl font-bold md:text-5xl" style={{ fontFamily: fonts.heading, color: colors.text }}>
                  {content.new_arrivals.heading}
                </h2>
              </div>
              <button className="hidden text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-60 md:block" style={{ color: colors.text, fontFamily: fonts.body }}>
                عرض الكل
              </button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {content.new_arrivals.products.map((product, i) => (
                <div key={i} className={i < 2 ? 'col-span-2 md:col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-2'}>
                  <ProductCard product={product} index={i} colors={colors} fonts={fonts} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BRAND PROMISE ──────────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'about') && content.brand_promise && (
        <AuroraBackground colors={colors} className="px-6 py-28 md:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 md:grid-cols-2 md:items-center">
              <motion.div {...revealAnim(rm,0)}>
                <span className="mb-4 block text-xs font-semibold uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
                  {content.brand_promise.eyebrow}
                </span>
                <h2 className="text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: fonts.heading, color: colors.text }}>
                  <Headline text={content.brand_promise.headline} />
                </h2>
              </motion.div>
              <motion.div {...revealAnim(rm,0.15)}>
                <p className="mb-8 text-lg leading-relaxed" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {content.brand_promise.body}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {content.brand_promise.stats.map((stat, i) => (
                    <GlassCard key={i} colors={colors} className="p-5" hover={false}>
                      <div className="text-2xl font-bold" style={{ fontFamily: fonts.heading, color: colors.text }}>{stat.value}</div>
                      <div className="mt-1 text-xs" style={{ color: colors.muted, fontFamily: fonts.body }}>{stat.label}</div>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </AuroraBackground>
      )}

      {/* ── BESTSELLERS ────────────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'arrivals') && content.bestsellers && (
        <section className="px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            <motion.div className="mb-12 max-w-xl" {...revealAnim(rm,0)}>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
                {content.bestsellers.eyebrow}
              </span>
              <h2 className="text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: fonts.heading, color: colors.text }}>
                <Headline text={content.bestsellers.heading} />
              </h2>
              {content.bestsellers.subheading && (
                <p className="mt-4 leading-relaxed" style={{ color: colors.muted, fontFamily: fonts.body }}>{content.bestsellers.subheading}</p>
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {content.bestsellers.products.slice(0, 8).map((product, i) => (
                <ProductCard key={i} product={product} index={i + 6} colors={colors} fonts={fonts} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PERKS BAR ────────────────────────────────────────────────────────── */}
      {view === 'home' && content.perks && (
        <div style={{ background: colors.surfaceAlt, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
          <div className="mx-auto grid max-w-6xl grid-cols-2 px-6 py-10 md:grid-cols-4 md:px-10">
            {content.perks.items.map((perk, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-3 p-4 text-center"
                initial={rm ? {} : { opacity: 0, y: 16 }}
                whileInView={rm ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <span className="text-2xl">{perk.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.text, fontFamily: fonts.body }}>{perk.title}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.muted, fontFamily: fonts.body }}>{perk.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'about') && content.testimonials && (
        <section className="px-6 py-24 md:px-10" style={{ background: colors.surface }}>
          <div className="mx-auto max-w-6xl">
            <motion.div className="mb-12 text-center" {...revealAnim(rm,0)}>
              <span className="mb-3 block text-xs font-semibold uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
                {content.testimonials.eyebrow}
              </span>
              <h2 className="text-4xl font-bold md:text-5xl" style={{ fontFamily: fonts.heading, color: colors.text }}>
                {content.testimonials.heading}
              </h2>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Stars count={Math.round(content.testimonials.average_rating)} color={colors.accent} />
                <span className="text-sm font-semibold" style={{ color: colors.text }}>{content.testimonials.average_rating}</span>
                <span className="text-sm" style={{ color: colors.muted }}>{content.testimonials.review_count}</span>
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {content.testimonials.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={rm ? {} : { opacity: 0, y: 32 }}
                  whileInView={rm ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
                >
                  <TestimonialCard item={item} index={i} colors={colors} fonts={fonts} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ───────────────────────────────────────────────────────── */}
      {view === 'home' && content.newsletter && (
        <AuroraBackground colors={colors} className="px-6 py-28 md:px-10">
          <motion.div className="mx-auto max-w-xl text-center" {...revealAnim(rm,0)}>
            <span className="mb-4 block text-xs font-semibold uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
              {content.newsletter.eyebrow}
            </span>
            <h2 className="mb-4 text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: fonts.heading, color: colors.text }}>
              <Headline text={content.newsletter.heading} />
            </h2>
            <p className="mb-8 leading-relaxed" style={{ color: colors.muted, fontFamily: fonts.body }}>
              {content.newsletter.subheading}
            </p>
            <GlassCard colors={colors} className="flex overflow-hidden rounded-2xl p-1.5" hover={false}>
              <input
                type="email"
                placeholder={content.newsletter.placeholder}
                className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                style={{ color: colors.text, fontFamily: fonts.body }}
              />
              <button
                className="rounded-xl px-6 py-3 text-sm font-semibold"
                style={{ background: colors.primary, color: colors.textInverse, fontFamily: fonts.body }}
              >
                {content.newsletter.cta}
              </button>
            </GlassCard>
            {content.newsletter.note && (
              <p className="mt-4 text-xs" style={{ color: colors.muted, fontFamily: fonts.body }}>{content.newsletter.note}</p>
            )}
          </motion.div>
        </AuroraBackground>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-16 md:px-10" style={{ background: colors.background, borderTop: `1px solid ${colors.border}` }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <span className="block text-xl font-bold" style={{ fontFamily: fonts.heading, color: colors.text }}>{content.brand.name}</span>
              <span className="mt-1 block text-sm" style={{ color: colors.muted, fontFamily: fonts.body }}>{content.footer.tagline}</span>
            </div>
            <div className="flex gap-8">
              {['التشكيلات', 'من نحن', 'الإرجاع', 'تواصل'].map((link) => (
                <button key={link} className="text-sm transition-opacity hover:opacity-60" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t pt-8 md:flex-row md:items-center" style={{ borderColor: colors.border }}>
            <p className="text-xs" style={{ color: colors.muted, fontFamily: fonts.body }}>{content.footer.legal}</p>
            <a href={`mailto:${content.footer.email}`} className="text-xs transition-opacity hover:opacity-60" style={{ color: colors.muted, fontFamily: fonts.body }}>
              {content.footer.email}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
