"use client"

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { WellnessContent, WellnessTreatment, WellnessTeamMember, WellnessTestimonial, WellnessFaqItem } from '@/utils/wellness/types'
import { getWellnessPreset } from '@/utils/wellness/presets'
import { getTypographyPreset } from '@/utils/theme-editor-typography'

type Props = {
  content: WellnessContent
  presetId?: string
  className?: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  view?: string
  onViewChange?: (v: string) => void
}

type WellnessView = 'home' | 'treatments' | 'team' | 'space' | 'about' | 'contact'

// ─── Motion primitives ────────────────────────────────────────────────────────
function useReveal(delay = 0) {
  const rm = useReducedMotion()
  return {
    initial: rm ? {} : { opacity: 0, y: 28 },
    whileInView: rm ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }
  }
}

function useFade(delay = 0) {
  const rm = useReducedMotion()
  return {
    initial: rm ? {} : { opacity: 0 },
    whileInView: rm ? {} : { opacity: 1 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.7, ease: 'easeOut', delay }
  }
}

// ─── Font preload ─────────────────────────────────────────────────────────────
function FontPreload() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&family=Raleway:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap"
    />
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating = 5, color }: { rating?: number; color: string }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill={i <= rating ? color : 'none'} stroke={color} strokeWidth="1.5" className="h-4 w-4">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function OrnamentDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px w-16 opacity-30" style={{ background: color }} />
      <svg viewBox="0 0 24 24" fill={color} className="h-3 w-3 opacity-50">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
      <div className="h-px w-16 opacity-30" style={{ background: color }} />
    </div>
  )
}

// ─── Headline renderer (supports \n line breaks) ───────────────────────────
function MultilineHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const lines = text.split('\\n')
  return (
    <span className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function WellnessPreview({
  content,
  presetId = 'zen',
  className,
  colorOverrides,
  typographyPreset,
  view: controlledView,
  onViewChange,
}: Props) {
  const preset = getWellnessPreset(presetId)
  const colors = useMemo(
    () => ({ ...preset.colors, ...(colorOverrides || {}) }),
    [preset.colors, colorOverrides]
  )
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  const headingFont = typo?.heading_font ?? preset.heading_font
  const bodyFont    = typo?.body_font    ?? preset.body_font

  const [internalView, setInternalView] = useState<WellnessView>('home')
  const view = (controlledView as WellnessView) || internalView
  const setView = (v: WellnessView) => {
    if (onViewChange) onViewChange(v); else setInternalView(v)
  }

  const cssVars = useMemo(() => ({
    '--wl-primary': colors.primary,
    '--wl-accent': colors.accent,
    '--wl-bg': colors.background,
    '--wl-surface': colors.surface,
    '--wl-text': colors.text,
    '--wl-muted': colors.muted,
    '--wl-border': colors.border,
    '--wl-overlay': colors.overlay,
    '--wl-heading': headingFont,
    '--wl-body': bodyFont,
  }) as React.CSSProperties, [colors, headingFont, bodyFont])

  const isDark = presetId === 'noir'

  return (
    <div
      className={className}
      style={{
        ...cssVars,
        background: 'var(--wl-bg)',
        color: 'var(--wl-text)',
        fontFamily: 'var(--wl-body)',
        minHeight: '100%'
      }}
    >
      <FontPreload />
      <NavBar content={content} isDark={isDark} view={view} setView={setView} />

      {view === 'home' && (
        <>
          <HeroSection content={content} isDark={isDark} />
          <TrustBar content={content} isDark={isDark} />
          <PhilosophySection content={content} isDark={isDark} />
          <TestimonialsSection content={content} isDark={isDark} />
          <BookingCtaSection content={content} isDark={isDark} />
        </>
      )}
      {view === 'treatments' && (
        <>
          <TreatmentsSection content={content} isDark={isDark} />
          <JourneySection content={content} isDark={isDark} />
        </>
      )}
      {view === 'team' && <TeamSection content={content} isDark={isDark} />}
      {view === 'space' && <SpaceSection content={content} isDark={isDark} />}
      {view === 'about' && (
        <>
          <PhilosophySection content={content} isDark={isDark} />
          <JourneySection content={content} isDark={isDark} />
        </>
      )}
      {view === 'contact' && (
        <>
          <BookingCtaSection content={content} isDark={isDark} />
          <FaqSection content={content} isDark={isDark} />
        </>
      )}

      <FooterSection content={content} isDark={isDark} />
    </div>
  )
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar({ content, isDark, view, setView }: { content: WellnessContent; isDark: boolean; view: WellnessView; setView: (v: WellnessView) => void }) {
  const navLinks: { label: string; view: WellnessView }[] = [
    { label: 'Treatments', view: 'treatments' },
    { label: 'Our Space', view: 'space' },
    { label: 'Team', view: 'team' },
    { label: 'About', view: 'about' },
  ]
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between gap-4 px-8 py-4 backdrop-blur-xl"
      style={{
        background: isDark ? 'rgba(14,14,14,0.92)' : 'rgba(255,255,255,0.88)',
        borderBottom: `1px solid var(--wl-border)`
      }}
    >
      <button onClick={() => setView('home')} style={{ fontFamily: 'var(--wl-heading)' }}>
        <span className="text-xl font-semibold tracking-wide" style={{ color: 'var(--wl-text)' }}>
          {content.brand.name}
        </span>
        <span className="ml-2 hidden text-xs uppercase tracking-[0.2em] opacity-50 sm:inline" style={{ color: 'var(--wl-muted)' }}>
          {content.brand.type}
        </span>
      </button>
      <div className="hidden items-center gap-7 sm:flex">
        {navLinks.map((item) => (
          <button key={item.view} onClick={() => setView(item.view)} className="text-xs uppercase tracking-[0.18em] transition hover:opacity-100" style={{ color: view === item.view ? 'var(--wl-accent)' : 'var(--wl-text)', opacity: view === item.view ? 1 : 0.6, fontWeight: view === item.view ? 600 : 400 }}>
            {item.label}
          </button>
        ))}
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setView('contact')}
        className="rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] shadow-sm"
        style={{ background: 'var(--wl-accent)', color: isDark ? '#0e0e0e' : 'var(--wl-primary)' }}
      >
        {content.hero.cta_primary}
      </motion.button>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  const rm = useReducedMotion()
  return (
    <section data-section="hero" className="relative min-h-[90vh] overflow-hidden flex items-center">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src={content.hero.image} alt="Studio" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'var(--wl-overlay)' }} />
        {/* Subtle grain */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-8 py-24">
        <div className="max-w-2xl">
          {/* Badge */}
          {content.hero.badge && (
            <motion.div
              initial={rm ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              {content.hero.badge}
            </motion.div>
          )}

          {/* Eyebrow */}
          <motion.p
            initial={rm ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-4 text-xs uppercase tracking-[0.35em] text-white/70"
          >
            {content.hero.eyebrow}
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={rm ? {} : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-5xl font-light leading-[1.1] text-white sm:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--wl-heading)' }}
          >
            <MultilineHeadline text={content.hero.headline} />
          </motion.h1>

          <OrnamentDivider color="#ffffff" />

          {/* Subheadline */}
          <motion.p
            initial={rm ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 max-w-lg text-base font-light leading-relaxed text-white/80"
          >
            {content.hero.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={rm ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              href={content.footer.booking_url || '#'}
              className="rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] shadow-xl"
              style={{ background: 'var(--wl-accent)', color: '#1a1a1a' }}
            >
              {content.hero.cta_primary}
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              href="#treatments"
              className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              {content.hero.cta_secondary}
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={rm ? {} : { y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/30 pt-1.5">
          <div className="h-2 w-0.5 rounded-full bg-white/60" />
        </div>
      </motion.div>
    </section>
  )
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────
function TrustBar({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  return (
    <div
      data-section="trust_bar"
      className="overflow-hidden py-4"
      style={{ background: isDark ? 'var(--wl-surface)' : 'var(--wl-primary)', borderBottom: '1px solid var(--wl-border)' }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
        {content.trust_bar.items.map((item, i) => (
          <motion.div
            key={i}
            {...useFade(i * 0.08)}
            className="flex items-center gap-2.5 text-xs uppercase tracking-[0.2em]"
            style={{ color: isDark ? 'var(--wl-accent)' : 'rgba(255,255,255,0.85)' }}
          >
            <span className="text-base opacity-80" style={{ color: 'var(--wl-accent)' }}>✦</span>
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Philosophy ───────────────────────────────────────────────────────────────
function PhilosophySection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  return (
    <section data-section="philosophy" className="px-8 py-24" style={{ background: 'var(--wl-bg)' }}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.p {...useFade()} className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--wl-accent)' }}>
            {content.philosophy.eyebrow}
          </motion.p>
          <motion.h2 {...useReveal(0.1)} className="text-4xl font-light leading-[1.15] sm:text-5xl" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
            <MultilineHeadline text={content.philosophy.heading} />
          </motion.h2>
          <OrnamentDivider color="var(--wl-accent)" />
          <motion.p {...useReveal(0.2)} className="mx-auto mt-4 max-w-xl text-base font-light leading-relaxed" style={{ color: 'var(--wl-muted)' }}>
            {content.philosophy.subheading}
          </motion.p>
        </div>

        {/* Pillars */}
        <div className="grid gap-8 sm:grid-cols-3">
          {content.philosophy.pillars.map((pillar, i) => (
            <motion.div
              key={i}
              {...useReveal(i * 0.1)}
              className="rounded-3xl border p-8 text-center"
              style={{ borderColor: 'var(--wl-border)', background: 'var(--wl-surface)' }}
            >
              <div className="mb-5 text-4xl">{pillar.icon}</div>
              <h3 className="mb-3 text-lg font-semibold" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
                {pillar.title}
              </h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--wl-muted)' }}>{pillar.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Treatments ───────────────────────────────────────────────────────────────
function TreatmentsSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const categories = ['All', ...Array.from(new Set(content.treatments.items.map((t) => t.category).filter(Boolean)))]
  const filtered = activeCategory === 'All' ? content.treatments.items : content.treatments.items.filter((t) => t.category === activeCategory)

  return (
    <section id="treatments" data-section="treatments" className="px-8 py-24" style={{ background: isDark ? 'var(--wl-surface)' : 'var(--wl-surface)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <motion.p {...useFade()} className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--wl-accent)' }}>
            What we offer
          </motion.p>
          <motion.h2 {...useReveal(0.08)} className="text-4xl font-light sm:text-5xl" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
            {content.treatments.heading}
          </motion.h2>
          <OrnamentDivider color="var(--wl-accent)" />
          <motion.p {...useReveal(0.18)} className="mx-auto mt-4 max-w-xl text-base font-light" style={{ color: 'var(--wl-muted)' }}>
            {content.treatments.subheading}
          </motion.p>
        </div>

        {/* Category filter */}
        {categories.length > 2 && (
          <motion.div {...useFade(0.2)} className="mb-10 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.18em] font-medium transition"
                style={{
                  background: activeCategory === cat ? 'var(--wl-accent)' : 'transparent',
                  borderColor: activeCategory === cat ? 'var(--wl-accent)' : 'var(--wl-border)',
                  color: activeCategory === cat ? (isDark ? '#0e0e0e' : 'var(--wl-primary)') : 'var(--wl-muted)'
                }}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* Treatment grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <TreatmentCard key={t.name + i} treatment={t} index={i} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TreatmentCard({ treatment: t, index, isDark }: { treatment: WellnessTreatment; index: number; isDark: boolean }) {
  return (
    <motion.div
      {...useReveal(index * 0.07)}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border"
      style={{ borderColor: 'var(--wl-border)', background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--wl-bg)' }}
    >
      {/* Category stripe */}
      <div className="h-1 w-full" style={{ background: 'var(--wl-accent)', opacity: 0.6 }} />

      <div className="flex flex-1 flex-col p-6">
        {/* Badge */}
        {t.badge && (
          <span className="mb-3 self-start rounded-full border px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em]"
            style={{ borderColor: 'var(--wl-accent)', color: 'var(--wl-accent)' }}>
            {t.badge}
          </span>
        )}

        <h3 className="mb-2 text-lg font-semibold leading-snug" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
          {t.name}
        </h3>
        <p className="mb-4 flex-1 text-sm font-light leading-relaxed" style={{ color: 'var(--wl-muted)' }}>{t.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--wl-border)' }}>
          <div className="flex items-center gap-3">
            {t.duration && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--wl-muted)' }}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
                {t.duration}
              </span>
            )}
            {t.category && (
              <span className="rounded px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.15em]"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'var(--wl-surface)', color: 'var(--wl-muted)' }}>
                {t.category}
              </span>
            )}
          </div>
          {t.price && (
            <span className="text-sm font-semibold" style={{ color: 'var(--wl-primary)' }}>{t.price}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Journey ──────────────────────────────────────────────────────────────────
function JourneySection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  return (
    <section data-section="journey" className="px-8 py-24" style={{ background: isDark ? 'var(--wl-bg)' : 'var(--wl-primary)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <motion.h2 {...useReveal()} className="text-4xl font-light sm:text-5xl" style={{ fontFamily: 'var(--wl-heading)', color: isDark ? 'var(--wl-text)' : '#fff' }}>
            {content.journey.heading}
          </motion.h2>
          <OrnamentDivider color={isDark ? 'var(--wl-accent)' : 'rgba(255,255,255,0.5)'} />
          <motion.p {...useReveal(0.1)} className="mx-auto mt-4 max-w-xl text-base font-light" style={{ color: isDark ? 'var(--wl-muted)' : 'rgba(255,255,255,0.7)' }}>
            {content.journey.subheading}
          </motion.p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {content.journey.steps.map((step, i) => (
            <motion.div key={i} {...useReveal(i * 0.1)} className="relative text-center">
              {/* Connector line */}
              {i < content.journey.steps.length - 1 && (
                <div className="absolute left-[calc(50%+2.5rem)] top-6 hidden h-px w-[calc(100%-5rem)] sm:block" style={{ background: isDark ? 'var(--wl-border)' : 'rgba(255,255,255,0.2)' }} />
              )}
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--wl-accent)', color: '#1a1a1a' }}>
                {step.step}
              </div>
              <h3 className="mb-3 text-lg font-semibold" style={{ fontFamily: 'var(--wl-heading)', color: isDark ? 'var(--wl-text)' : '#fff' }}>
                {step.title}
              </h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: isDark ? 'var(--wl-muted)' : 'rgba(255,255,255,0.68)' }}>
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Team ─────────────────────────────────────────────────────────────────────
function TeamSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  if (!content.team.members.length) return null
  return (
    <section data-section="team" className="px-8 py-24" style={{ background: 'var(--wl-bg)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <motion.p {...useFade()} className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--wl-accent)' }}>
            The people behind the practice
          </motion.p>
          <motion.h2 {...useReveal(0.08)} className="text-4xl font-light sm:text-5xl" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
            {content.team.heading}
          </motion.h2>
          <OrnamentDivider color="var(--wl-accent)" />
          <motion.p {...useReveal(0.18)} className="mx-auto mt-4 max-w-xl text-base font-light" style={{ color: 'var(--wl-muted)' }}>
            {content.team.subheading}
          </motion.p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {content.team.members.map((member, i) => (
            <TeamCard key={member.name + i} member={member} index={i} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamCard({ member, index, isDark }: { member: WellnessTeamMember; index: number; isDark: boolean }) {
  return (
    <motion.div
      {...useReveal(index * 0.1)}
      className="group overflow-hidden rounded-3xl border"
      style={{ borderColor: 'var(--wl-border)', background: 'var(--wl-surface)' }}
    >
      {/* Photo */}
      <div className="relative h-64 overflow-hidden">
        {member.image ? (
          <img src={member.image} alt={member.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--wl-bg)' }}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-light" style={{ background: 'var(--wl-border)', color: 'var(--wl-accent)', fontFamily: 'var(--wl-heading)' }}>
              {member.name.charAt(0)}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-white/70">{member.title}</p>
        </div>
      </div>
      <div className="p-6">
        <h3 className="mb-1 text-xl font-semibold" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>{member.name}</h3>
        {member.specialty && (
          <p className="mb-3 text-xs uppercase tracking-[0.15em]" style={{ color: 'var(--wl-accent)' }}>{member.specialty}</p>
        )}
        <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--wl-muted)' }}>{member.bio}</p>
      </div>
    </motion.div>
  )
}

// ─── Space / Gallery ──────────────────────────────────────────────────────────
function SpaceSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  const [imgs] = useState(content.space.images)
  return (
    <section data-section="space" className="px-8 py-24" style={{ background: isDark ? 'var(--wl-surface)' : 'var(--wl-surface)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <motion.p {...useFade()} className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--wl-accent)' }}>
              The environment
            </motion.p>
            <motion.h2 {...useReveal(0.08)} className="text-4xl font-light leading-snug sm:text-5xl" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
              {content.space.heading}
            </motion.h2>
            <OrnamentDivider color="var(--wl-accent)" />
            <motion.p {...useReveal(0.18)} className="mt-4 text-base font-light leading-relaxed" style={{ color: 'var(--wl-muted)' }}>
              {content.space.subheading}
            </motion.p>
          </div>
          {/* Amenities */}
          <motion.div {...useReveal(0.22)} className="grid grid-cols-2 gap-3">
            {content.space.amenities.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-2xl border p-3"
                style={{ borderColor: 'var(--wl-border)', background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--wl-bg)' }}>
                <span className="text-sm" style={{ color: 'var(--wl-accent)' }}>✦</span>
                <span className="text-xs font-light" style={{ color: 'var(--wl-text)' }}>{a}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Photo grid */}
        {imgs.length >= 4 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {imgs.slice(0, 4).map((img, i) => (
              <motion.div key={i} {...useReveal(i * 0.08)} className={`relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                style={{ aspectRatio: i === 0 ? '4/3' : '1/1' }}>
                <img src={img.url} alt={img.alt || `Studio ${i + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {imgs.map((img, i) => (
              <motion.div key={i} {...useReveal(i * 0.1)} className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
                <img src={img.url} alt={img.alt || `Studio ${i + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  return (
    <section data-section="testimonials" className="px-8 py-24" style={{ background: isDark ? 'var(--wl-bg)' : 'var(--wl-bg)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <motion.p {...useFade()} className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--wl-accent)' }}>
            Client stories
          </motion.p>
          <motion.h2 {...useReveal(0.08)} className="text-4xl font-light sm:text-5xl" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
            {content.testimonials.heading}
          </motion.h2>
          <OrnamentDivider color="var(--wl-accent)" />
          <motion.p {...useReveal(0.18)} className="mx-auto mt-4 max-w-xl text-base font-light" style={{ color: 'var(--wl-muted)' }}>
            {content.testimonials.subheading}
          </motion.p>

          {/* Rating badge */}
          <motion.div {...useReveal(0.26)} className="mt-8 inline-flex items-center gap-3 rounded-full border px-6 py-3"
            style={{ borderColor: 'var(--wl-border)', background: 'var(--wl-surface)' }}>
            <Stars rating={5} color="var(--wl-accent)" />
            <span className="text-sm font-semibold" style={{ color: 'var(--wl-text)' }}>{content.testimonials.average_rating.toFixed(1)}</span>
            <span className="text-xs" style={{ color: 'var(--wl-muted)' }}>from {content.testimonials.review_count} sessions</span>
          </motion.div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {content.testimonials.items.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} index={i} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial: t, index, isDark }: { testimonial: WellnessTestimonial; index: number; isDark: boolean }) {
  return (
    <motion.div
      {...useReveal(index * 0.1)}
      className="relative flex flex-col rounded-3xl border p-7"
      style={{ borderColor: 'var(--wl-border)', background: 'var(--wl-surface)' }}
    >
      {/* Large quotation mark */}
      <div className="absolute right-6 top-4 text-6xl font-serif leading-none opacity-10 select-none" style={{ color: 'var(--wl-accent)', fontFamily: 'Georgia, serif' }}>"</div>
      <Stars rating={t.rating} color="var(--wl-accent)" />
      <p className="mt-4 flex-1 text-sm font-light leading-relaxed" style={{ color: 'var(--wl-text)', opacity: 0.85 }}>
        "{t.text}"
      </p>
      <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--wl-border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--wl-text)' }}>{t.name}</p>
        {t.treatment && (
          <p className="mt-0.5 text-xs uppercase tracking-[0.15em]" style={{ color: 'var(--wl-accent)' }}>{t.treatment}</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Booking CTA ──────────────────────────────────────────────────────────────
function BookingCtaSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  return (
    <section data-section="booking_cta" className="relative overflow-hidden px-8 py-28">
      <div className="absolute inset-0 z-0">
        <img src={content.booking_cta.image} alt="Book" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'var(--wl-overlay)' }} />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.p {...useFade()} className="mb-4 text-xs uppercase tracking-[0.35em] text-white/60">
          {content.booking_cta.eyebrow}
        </motion.p>
        <motion.h2 {...useReveal(0.1)} className="text-5xl font-light leading-[1.1] text-white sm:text-6xl" style={{ fontFamily: 'var(--wl-heading)' }}>
          {content.booking_cta.heading}
        </motion.h2>
        <OrnamentDivider color="rgba(255,255,255,0.4)" />
        <motion.p {...useReveal(0.2)} className="mx-auto mt-5 max-w-lg text-base font-light text-white/75">
          {content.booking_cta.subheading}
        </motion.p>
        <motion.div {...useReveal(0.3)} className="mt-10 flex flex-col items-center gap-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            href={content.footer.booking_url || `mailto:${content.footer.email}`}
            className="inline-block rounded-full px-12 py-4 text-sm font-bold uppercase tracking-[0.14em] shadow-2xl"
            style={{ background: 'var(--wl-accent)', color: '#1a1a1a' }}
          >
            {content.booking_cta.cta_label}
          </motion.a>
          <p className="text-xs text-white/50">{content.booking_cta.note}</p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section data-section="faq" className="px-8 py-24" style={{ background: 'var(--wl-surface)' }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <motion.h2 {...useReveal()} className="text-4xl font-light" style={{ fontFamily: 'var(--wl-heading)', color: 'var(--wl-text)' }}>
            {content.faq.heading}
          </motion.h2>
          <OrnamentDivider color="var(--wl-accent)" />
        </div>
        <div className="space-y-3">
          {content.faq.items.map((item, i) => (
            <FaqItem key={i} item={item} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ item, index, open, onToggle, isDark }: { item: WellnessFaqItem; index: number; open: boolean; onToggle: () => void; isDark: boolean }) {
  return (
    <motion.div {...useFade(index * 0.05)} className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--wl-border)', background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--wl-bg)' }}>
      <button onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left transition hover:opacity-80">
        <span className="pr-6 text-sm font-medium" style={{ color: 'var(--wl-text)' }}>{item.q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.22 }} className="shrink-0 text-xl font-light" style={{ color: 'var(--wl-accent)' }}>
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm font-light leading-relaxed" style={{ color: 'var(--wl-muted)' }}>{item.a}</p>
      </motion.div>
    </motion.div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection({ content, isDark }: { content: WellnessContent; isDark: boolean }) {
  return (
    <footer className="px-8 py-16" style={{ background: isDark ? 'var(--wl-surface)' : 'var(--wl-primary)', borderTop: '1px solid var(--wl-border)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="mb-3 text-2xl font-light" style={{ fontFamily: 'var(--wl-heading)', color: isDark ? 'var(--wl-text)' : '#fff' }}>
              {content.brand.name}
            </p>
            <p className="max-w-xs text-sm font-light leading-relaxed" style={{ color: isDark ? 'var(--wl-muted)' : 'rgba(255,255,255,0.65)' }}>
              {content.footer.tagline}
            </p>
          </div>
          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: isDark ? 'var(--wl-accent)' : 'rgba(255,255,255,0.5)' }}>
              Contact
            </p>
            <div className="space-y-2 text-sm font-light" style={{ color: isDark ? 'var(--wl-muted)' : 'rgba(255,255,255,0.7)' }}>
              <p>{content.footer.phone}</p>
              <p>{content.footer.email}</p>
              {content.footer.address && <p>{content.footer.address}</p>}
            </div>
          </div>
          {/* Hours */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: isDark ? 'var(--wl-accent)' : 'rgba(255,255,255,0.5)' }}>
              Hours
            </p>
            <p className="text-sm font-light leading-relaxed" style={{ color: isDark ? 'var(--wl-muted)' : 'rgba(255,255,255,0.7)' }}>
              {content.footer.hours || 'Contact us for hours'}
            </p>
            {content.footer.booking_url && (
              <a href={content.footer.booking_url}
                className="mt-4 inline-block rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em]"
                style={{ background: 'var(--wl-accent)', color: '#1a1a1a' }}>
                Book now
              </a>
            )}
          </div>
        </div>
        <div className="border-t pt-8 text-center text-xs" style={{ borderColor: isDark ? 'var(--wl-border)' : 'rgba(255,255,255,0.15)', color: isDark ? 'var(--wl-muted)' : 'rgba(255,255,255,0.4)' }}>
          {content.footer.legal}
        </div>
      </div>
    </footer>
  )
}
