"use client"

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import type { AtlasContent, AtlasTestimonial, AtlasFaqItem, AtlasPricingTier, AtlasIntegration } from '@/utils/atlas/types'
import { getAtlasPreset } from '@/utils/atlas/presets'
import BookingSection from '@/components/site/BookingSection'
import {
  TYPOGRAPHY_PRESETS,
  buildGoogleFontsUrl,
  getTypographyPreset,
} from '@/utils/theme-editor-typography'

type Props = {
  content: AtlasContent
  presetId?: string
  className?: string
  /** Wrapper-level color overrides — per-key takes precedence over the preset. */
  colorOverrides?: Record<string, string>
  /** Wrapper-level typography preset id. */
  typographyPreset?: string
  view?: string
  onViewChange?: (v: string) => void
}

type AtlasView = 'home' | 'features' | 'pricing' | 'integrations' | 'docs'

// ─── Motion helpers ────────────────────────────────────────────────────────────
// Plain functions (not hooks!) so they can be called safely inside .map()
// callbacks and conditional `view === '…'` branches without violating the
// rules of hooks. Every component that uses them calls `useReducedMotion()`
// once at the top to get `rm`, then threads it through.
function revealAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0, y: 32 },
    whileInView: rm ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }
  }
}

function fadeUpAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0, y: 16 },
    animate: rm ? {} : { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }
  }
}

// ─── Multiline headline ────────────────────────────────────────────────────────
function Headline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
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

// ─── Mock dashboard UI in hero ────────────────────────────────────────────────
function DashboardMockup({ colors }: { colors: ReturnType<typeof getAtlasPreset>['colors'] }) {
  const isDark = colors.background.startsWith('#0') || colors.background.startsWith('#02') || colors.background.startsWith('#08')
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)'
  const barBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
  const textStrong = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'

  return (
    <div
      className="relative overflow-hidden rounded-2xl border shadow-2xl"
      style={{
        background: isDark ? colors.surface : '#ffffff',
        borderColor: colors.border,
        boxShadow: `0 32px 80px -12px ${colors.glowPrimary}, 0 0 0 1px ${colors.border}`
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: colors.border, background: barBg }}>
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <div className="h-3 w-3 rounded-full bg-green-400/70" />
        </div>
        <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md text-[10px]" style={{ background: cardBg, color: textColor }}>
          app.streamline.io/workspace
        </div>
      </div>

      {/* Dashboard layout */}
      <div className="flex h-64 sm:h-80">
        {/* Sidebar */}
        <div className="flex w-16 flex-col items-center gap-3 border-r py-4" style={{ borderColor: colors.border, background: barBg }}>
          {['◼', '⚡', '📊', '🔗', '⚙️'].map((icon, i) => (
            <div
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm transition"
              style={{
                background: i === 0 ? colors.primary : 'transparent',
                color: i === 0 ? '#fff' : textColor
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Header row */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="h-3 w-24 rounded-full" style={{ background: textStrong, opacity: 0.8 }} />
              <div className="mt-1 h-2 w-16 rounded-full" style={{ background: textColor, opacity: 0.5 }} />
            </div>
            <div
              className="h-7 w-20 rounded-lg text-[10px] font-bold flex items-center justify-center text-white"
              style={{ background: colors.primary }}
            >
              + New task
            </div>
          </div>

          {/* Sprint cards row */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: 'قيد التنفيذ', count: '8', color: colors.primary },
              { label: 'قيد المراجعة', count: '3', color: colors.accent },
              { label: 'منجز', count: '24', color: '#10b981' }
            ].map((col) => (
              <div key={col.label} className="rounded-xl p-3" style={{ background: cardBg, border: `1px solid ${colors.border}` }}>
                <div className="h-1.5 w-full rounded-full mb-2" style={{ background: col.color, opacity: 0.3 }}>
                  <div className="h-full rounded-full" style={{ width: col.label === 'منجز' ? '100%' : col.label === 'قيد التنفيذ' ? '55%' : '33%', background: col.color }} />
                </div>
                <p className="text-[10px] font-bold" style={{ color: col.color }}>{col.count}</p>
                <p className="text-[9px]" style={{ color: textColor }}>{col.label}</p>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="space-y-1.5">
            {[
              { title: 'Design new onboarding flow', priority: '🔴', status: 'In Progress' },
              { title: 'Integrate Stripe webhooks', priority: '🟡', status: 'In Review' },
              { title: 'Write API documentation', priority: '🟢', status: 'Todo' },
            ].map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: cardBg, border: `1px solid ${colors.border}` }}
              >
                <div className="h-3.5 w-3.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: colors.primary }} />
                <span className="flex-1 truncate text-[10px] font-medium" style={{ color: textStrong }}>{task.title}</span>
                <span className="text-[9px]">{task.priority}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[8px] font-bold"
                  style={{ background: `${colors.primary}22`, color: colors.primary }}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="hidden w-36 border-l p-3 sm:block" style={{ borderColor: colors.border }}>
          <p className="mb-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: textColor }}>رؤى الذكاء الاصطناعي</p>
          {[
            { label: 'سرعة الإنجاز', value: '+18%' },
            { label: 'عوائق مكتشفة', value: 'خطران' },
            { label: 'تاريخ الإطلاق المتوقّع', value: '28 مارس' },
          ].map((item, i) => (
            <div key={i} className="mb-2 rounded-lg p-2" style={{ background: cardBg, border: `1px solid ${colors.border}` }}>
              <p className="text-[9px]" style={{ color: textColor }}>{item.label}</p>
              <p className="text-[11px] font-bold" style={{ color: colors.primary }}>{item.value}</p>
            </div>
          ))}
          <div
            className="mt-3 rounded-lg p-2 text-center text-[9px] font-bold text-white"
            style={{ background: colors.gradient }}
          >
            ✦ الذكاء يقترح حلًّا
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function AtlasNav({ content, colors, font, view, setView }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string; view: AtlasView; setView: (v: AtlasView) => void }) {
  const navLinks: { label: string; view: AtlasView }[] = [
    { label: 'المزايا', view: 'features' },
    { label: 'الأسعار', view: 'pricing' },
    { label: 'التكاملات', view: 'integrations' },
    { label: 'التوثيق', view: 'docs' },
  ]
  const [menuOpen, setMenuOpen] = useState(false)
  // Close the mobile menu whenever the page changes.
  const go = (v: AtlasView) => { setView(v); setMenuOpen(false) }
  return (
    <div
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: `${colors.background}cc`,
        borderColor: colors.border,
        fontFamily: font
      }}
    >
      <nav className="flex items-center justify-between px-6 py-4">
        <button onClick={() => setView('home')} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-black" style={{ background: colors.gradient }}>
            {content.brand.name[0]}
          </div>
          <span className="text-base font-black tracking-tight" style={{ color: colors.text }}>{content.brand.name}</span>
        </button>
        <div className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: colors.muted }}>
          {navLinks.map((item) => (
            <button key={item.view} onClick={() => setView(item.view)} className="cursor-pointer transition hover:opacity-100" style={{ opacity: view === item.view ? 1 : 0.75, color: view === item.view ? colors.primary : colors.muted, fontWeight: view === item.view ? 700 : 500 }}>{item.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden cursor-pointer text-sm font-semibold md:block" style={{ color: colors.muted }}>تسجيل الدخول</button>
          <button
            onClick={() => setView('pricing')}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition hover:scale-105"
            style={{ background: colors.primary }}
          >
            ابدأ الآن
          </button>
          {/* Hamburger — only below md, where the inline nav is hidden. */}
          <button
            type="button"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
            style={{ border: `1px solid ${colors.border}`, color: colors.text }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {menuOpen
                ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
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
            {navLinks.map((item) => (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className="py-3 text-right text-sm font-medium transition"
                style={{ color: view === item.view ? colors.primary : colors.text, fontWeight: view === item.view ? 700 : 500 }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function AtlasHero({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  const reveal = fadeUpAnim(rm, 0)
  const revealSub = fadeUpAnim(rm, 0.12)
  const revealCtas = fadeUpAnim(rm, 0.22)
  const revealMock = fadeUpAnim(rm, 0.35)

  return (
    <section data-section="hero" className="relative overflow-hidden px-6 py-20 md:py-28" style={{ fontFamily: font }}>
      {/* Glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-30 blur-3xl"
        style={{ background: colors.gradient }}
      />

      <div className="relative mx-auto max-w-6xl text-center">
        {/* Eyebrow */}
        <motion.div {...revealSub}
          className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
          style={{ background: colors.surfaceAlt, borderColor: colors.border, color: colors.muted }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: colors.primary }} />
          {content.hero.eyebrow}
        </motion.div>

        {/* Headline */}
        <motion.h1 {...reveal} className="mx-auto max-w-4xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl md:text-7xl" style={{ color: colors.text }}>
          <Headline
            text={content.hero.headline}
            style={{
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          />
        </motion.h1>

        {/* Subheadline */}
        <motion.p {...revealSub} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: colors.muted }}>
          {content.hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div {...revealCtas} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            className="rounded-full px-8 py-3.5 text-sm font-black text-white transition hover:scale-105 hover:shadow-lg"
            style={{ background: colors.primary, boxShadow: `0 8px 24px -4px ${colors.glowPrimary}` }}
          >
            {content.hero.cta_primary}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border px-8 py-3.5 text-sm font-bold transition hover:scale-105"
            style={{ borderColor: colors.border, color: colors.text, background: colors.surfaceAlt }}
          >
            {content.hero.cta_secondary} <span>→</span>
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.p {...revealCtas} className="mt-4 text-xs" style={{ color: colors.muted }}>
          {content.hero.social_proof}
        </motion.p>

        {/* Dashboard mockup */}
        <motion.div {...revealMock} className="mt-14 mx-auto max-w-5xl">
          <DashboardMockup colors={colors} />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Trust bar ─────────────────────────────────────────────────────────────────
function AtlasTrustBar({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  return (
    <section data-section="trust_bar" className="border-y px-6 py-8" style={{ borderColor: colors.border, fontFamily: font }}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: colors.muted }}>
          {content.trust_bar.label}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {content.trust_bar.logos.map((logo) => (
            <span
              key={logo}
              className="text-base font-black tracking-tight transition hover:opacity-100"
              style={{ color: colors.muted, opacity: 0.5, fontFamily: font }}
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ──────────────────────────────────────────────────────────────────
function AtlasFeatures({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="features" className="px-6 py-24" style={{ fontFamily: font }}>
      <div className="mx-auto max-w-6xl">
        <motion.div {...revealAnim(rm,0)} className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: colors.primary }}>
            {content.features.eyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: colors.text }}>
            <Headline text={content.features.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: colors.muted }}>
            {content.features.subheading}
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.items.map((feature, i) => (
            <motion.div
              key={i}
              {...revealAnim(rm,0.05 * i)}
              className="group relative overflow-hidden rounded-2xl border p-6 transition hover:-translate-y-1"
              style={{
                background: colors.surface,
                borderColor: colors.border,
                boxShadow: `0 1px 3px ${colors.glowPrimary}22`
              }}
            >
              {/* Subtle glow on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 50% 0%, ${colors.glowPrimary}, transparent 70%)` }}
              />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    style={{ background: colors.primaryMuted }}
                  >
                    {feature.icon}
                  </div>
                  {feature.badge && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider"
                      style={{ background: colors.primary, color: '#fff' }}
                    >
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-base font-black" style={{ color: colors.text }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.muted }}>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ──────────────────────────────────────────────────────────────
function AtlasHowItWorks({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="how_it_works" className="px-6 py-24" style={{ background: colors.surfaceAlt, fontFamily: font }}>
      <div className="mx-auto max-w-5xl">
        <motion.div {...revealAnim(rm,0)} className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: colors.primary }}>
            {content.how_it_works.eyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: colors.text }}>
            <Headline text={content.how_it_works.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed" style={{ color: colors.muted }}>
            {content.how_it_works.subheading}
          </p>
        </motion.div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div
            className="absolute left-0 right-0 top-8 hidden h-px md:block"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.border}, ${colors.primary}50, ${colors.border}, transparent)` }}
          />

          {content.how_it_works.steps.map((step, i) => (
            <motion.div key={i} {...revealAnim(rm,0.1 * i)} className="relative text-center">
              {/* Step number bubble */}
              <div
                className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-black"
                style={{
                  background: colors.surface,
                  borderColor: colors.primary,
                  color: colors.primary,
                  boxShadow: `0 0 0 6px ${colors.background}, 0 0 20px ${colors.glowPrimary}`
                }}
              >
                {step.icon}
              </div>
              <div
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 rounded-full px-2 py-0.5 text-[0.6rem] font-black"
                style={{ background: colors.primary, color: '#fff' }}
              >
                {step.step}
              </div>
              <h3 className="mb-2 text-lg font-black" style={{ color: colors.text }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.muted }}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ───────────────────────────────────────────────────────────────────
function AtlasPricing({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="pricing" className="px-6 py-24" style={{ fontFamily: font }}>
      <div className="mx-auto max-w-6xl">
        <motion.div {...revealAnim(rm,0)} className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: colors.primary }}>
            {content.pricing.eyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: colors.text }}>
            <Headline text={content.pricing.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base" style={{ color: colors.muted }}>{content.pricing.subheading}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {content.pricing.tiers.map((tier, i) => (
            <PricingCard key={i} tier={tier} colors={colors} delay={0.08 * i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ tier, colors, delay }: { tier: AtlasPricingTier; colors: ReturnType<typeof getAtlasPreset>['colors']; delay: number }) {
  const rm = !!useReducedMotion()
  return (
    <motion.div
      {...revealAnim(rm,delay)}
      className="relative overflow-hidden rounded-2xl border p-8 transition hover:-translate-y-1"
      style={{
        background: tier.highlighted ? colors.primary : colors.surface,
        borderColor: tier.highlighted ? colors.primary : colors.border,
        boxShadow: tier.highlighted ? `0 24px 48px -8px ${colors.glowPrimary}` : undefined
      }}
    >
      {tier.highlighted && (
        <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider text-white">
          الأكثر شيوعًا
        </div>
      )}
      <div className={tier.highlighted ? 'text-white' : ''}>
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: tier.highlighted ? 'rgba(255,255,255,0.8)' : colors.muted }}>
          {tier.name}
        </p>
        <div className="mt-3 flex items-end gap-1">
          <span className="text-5xl font-black" style={{ color: tier.highlighted ? '#fff' : colors.text }}>{tier.price}</span>
          {tier.price !== 'حسب الطلب' && (
            <span className="mb-2 text-sm" style={{ color: tier.highlighted ? 'rgba(255,255,255,0.7)' : colors.muted }}>/{tier.period}</span>
          )}
        </div>
        <p className="mt-2 text-sm" style={{ color: tier.highlighted ? 'rgba(255,255,255,0.75)' : colors.muted }}>{tier.description}</p>

        <button
          className="mt-6 w-full rounded-full py-3 text-sm font-black transition hover:scale-105"
          style={{
            background: tier.highlighted ? '#fff' : colors.primary,
            color: tier.highlighted ? colors.primary : '#fff'
          }}
        >
          {tier.cta}
        </button>

        <ul className="mt-7 space-y-3">
          {tier.features.map((feat, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke={tier.highlighted ? 'rgba(255,255,255,0.4)' : colors.primary} />
                <path d="M5 8l2 2 4-4" stroke={tier.highlighted ? '#fff' : colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ color: tier.highlighted ? 'rgba(255,255,255,0.85)' : colors.text }}>{feat}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

// ─── Integrations ──────────────────────────────────────────────────────────────
function AtlasIntegrations({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="integrations" className="px-6 py-24" style={{ background: colors.surfaceAlt, fontFamily: font }}>
      <div className="mx-auto max-w-5xl text-center">
        <motion.div {...revealAnim(rm,0)} className="mb-14">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: colors.text }}>
            <Headline text={content.integrations.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base" style={{ color: colors.muted }}>{content.integrations.subheading}</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {content.integrations.items.map((item, i) => (
            <motion.div
              key={i}
              {...revealAnim(rm,0.04 * i)}
              className="group flex flex-col items-center gap-2 rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-lg"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[0.65rem] font-black" style={{ color: colors.text }}>{item.name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider"
                style={{ background: colors.primaryMuted, color: colors.primary }}
              >
                {item.category}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p {...revealAnim(rm,0.3)} className="mt-8 text-sm" style={{ color: colors.muted }}>
          + 68 more integrations via Zapier and native API
        </motion.p>
      </div>
    </section>
  )
}

// ─── Testimonials ──────────────────────────────────────────────────────────────
function AtlasTestimonials({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="testimonials" className="px-6 py-24" style={{ fontFamily: font }}>
      <div className="mx-auto max-w-6xl">
        <motion.div {...revealAnim(rm,0)} className="mb-14 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: colors.primary }}>
            {content.testimonials.eyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: colors.text }}>
            {content.testimonials.heading}
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {content.testimonials.items.map((item, i) => (
            <motion.div
              key={i}
              {...revealAnim(rm,0.08 * i)}
              className="flex flex-col rounded-2xl border p-7"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <Stars rating={item.rating} color={colors.primary} />
              <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: colors.text }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: colors.gradient }}
                >
                  {item.avatar_letter}
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: colors.text }}>{item.author}</p>
                  <p className="text-xs" style={{ color: colors.muted }}>{item.role} · {item.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Security strip ────────────────────────────────────────────────────────────
function AtlasSecurity({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  return (
    <section data-section="security" className="border-y px-6 py-10" style={{ borderColor: colors.border, fontFamily: font }}>
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-6 text-sm font-bold" style={{ color: colors.muted }}>{content.security.heading}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {content.security.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold"
              style={{ background: colors.surface, borderColor: colors.border, color: colors.muted }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L2 4v4c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V4L8 1.5z" stroke={colors.primary} strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M5.5 8l2 2 3-3" stroke={colors.primary} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
function AtlasFaq({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section data-section="faq" className="px-6 py-24" style={{ background: colors.surfaceAlt, fontFamily: font }}>
      <div className="mx-auto max-w-3xl">
        <motion.h2 {...revealAnim(rm,0)} className="mb-10 text-center text-4xl font-black tracking-tight sm:text-5xl" style={{ color: colors.text }}>
          {content.faq.heading}
        </motion.h2>
        <div className="space-y-3">
          {content.faq.items.map((item, i) => (
            <motion.div
              key={i}
              {...revealAnim(rm,0.05 * i)}
              className="overflow-hidden rounded-2xl border"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="pr-4 text-sm font-bold" style={{ color: colors.text }}>{item.q}</span>
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm transition-transform"
                  style={{
                    background: open === i ? colors.primary : colors.primaryMuted,
                    color: open === i ? '#fff' : colors.primary,
                    transform: open === i ? 'rotate(45deg)' : 'none'
                  }}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: colors.muted }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA section ───────────────────────────────────────────────────────────────
function AtlasCta({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  const rm = !!useReducedMotion()
  return (
    <section data-section="cta" className="px-6 py-24" style={{ fontFamily: font }}>
      <motion.div
        {...revealAnim(rm,0)}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center"
        style={{ background: colors.gradient }}
      >
        {/* Glow orbs inside CTA */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/70">{content.cta.eyebrow}</p>
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            <Headline text={content.cta.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/75">{content.cta.subheading}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button className="rounded-full bg-white px-8 py-3.5 text-sm font-black transition hover:scale-105" style={{ color: colors.primary }}>
              {content.cta.cta_primary}
            </button>
            <button className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              {content.cta.cta_secondary}
            </button>
          </div>
          <p className="mt-4 text-xs text-white/60">{content.cta.note}</p>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function AtlasFooter({ content, colors, font }: { content: AtlasContent; colors: ReturnType<typeof getAtlasPreset>['colors']; font: string }) {
  return (
    <footer data-section="footer" className="border-t px-6 py-12" style={{ borderColor: colors.border, fontFamily: font }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-black" style={{ background: colors.gradient }}>
                {content.brand.name[0]}
              </div>
              <span className="text-sm font-black" style={{ color: colors.text }}>{content.brand.name}</span>
            </div>
            <p className="mt-2 text-sm" style={{ color: colors.muted }}>{content.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: colors.muted }}>
            {['المنتج', 'الأسعار', 'التوثيق', 'المدوّنة', 'الخصوصية', 'الشروط'].map((link) => (
              <span key={link} className="cursor-pointer transition hover:opacity-100" style={{ opacity: 0.65 }}>{link}</span>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs" style={{ borderColor: colors.border, color: colors.muted }}>
          {content.footer.legal} · {content.footer.email}
        </div>
      </div>
    </footer>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function AtlasPreview({
  content,
  presetId = 'orbit',
  className = '',
  colorOverrides,
  typographyPreset,
  view: controlledView,
  onViewChange,
}: Props) {
  const preset = useMemo(() => getAtlasPreset(presetId), [presetId])
  // Merge per-key colour overrides on top of the preset palette.
  const colors = useMemo(
    () => ({ ...preset.colors, ...(colorOverrides || {}) }),
    [preset.colors, colorOverrides]
  )
  // Typography preset (optional) overrides the preset's heading + body fonts.
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  const headingFont = typo?.heading_font ?? preset.heading_font
  const bodyFont    = typo?.body_font    ?? preset.body_font

  const [internalView, setInternalView] = useState<AtlasView>('home')
  const view = (controlledView as AtlasView) || internalView
  const setView = (v: AtlasView) => {
    if (onViewChange) onViewChange(v); else setInternalView(v)
  }

  return (
    <div
      className={`min-h-screen ${className}`}
      style={{ background: colors.background, fontFamily: bodyFont, color: colors.text }}
    >
      <link rel="stylesheet" href={buildGoogleFontsUrl(TYPOGRAPHY_PRESETS)} />
      <AtlasNav content={content} colors={colors} font={headingFont} view={view} setView={setView} />

      {view === 'home' && (
        <>
          <AtlasHero content={content} colors={colors} font={headingFont} />
          <AtlasTrustBar content={content} colors={colors} font={bodyFont} />
          <AtlasHowItWorks content={content} colors={colors} font={bodyFont} />
          <AtlasTestimonials content={content} colors={colors} font={bodyFont} />
          <AtlasCta content={content} colors={colors} font={bodyFont} />
        </>
      )}
      {view === 'features' && (
        <>
          <AtlasFeatures content={content} colors={colors} font={bodyFont} />
          <AtlasSecurity content={content} colors={colors} font={bodyFont} />
          <AtlasIntegrations content={content} colors={colors} font={bodyFont} />
        </>
      )}
      {view === 'pricing' && <AtlasPricing content={content} colors={colors} font={bodyFont} />}
      {view === 'integrations' && <AtlasIntegrations content={content} colors={colors} font={bodyFont} />}
      {view === 'docs' && (
        <>
          <AtlasFaq content={content} colors={colors} font={bodyFont} />
          <AtlasCta content={content} colors={colors} font={bodyFont} />
        </>
      )}

      <BookingSection
        type="contact"
        eyebrow="ابدأ الآن"
        heading="اطلب عرضًا توضيحيًا"
        subheading="اترك بياناتك وسيتواصل معك فريقنا لعرض المنتج عليك."
        background={colors.surface}
        palette={{
          accent: colors.primary,
          accentText: '#ffffff',
          text: colors.text,
          muted: colors.muted,
          surface: colors.background,
          border: colors.border,
          headingFont,
          bodyFont,
          radius: 12,
        }}
      />

      <AtlasFooter content={content} colors={colors} font={bodyFont} />
    </div>
  )
}
