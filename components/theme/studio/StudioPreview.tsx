"use client"

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import type {
  StudioContent,
  StudioTimelineEvent,
  StudioValue,
  StudioTeamMember,
  StudioPressItem
} from '@/utils/studio/types'
import { getStudioPreset } from '@/utils/studio/presets'
import { getTypographyPreset } from '@/utils/theme-editor-typography'
import BookingSection from '@/components/site/BookingSection'

type Props = {
  content: StudioContent
  presetId?: string
  className?: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  view?: string
  onViewChange?: (v: string) => void
}

type StudioView = 'home' | 'about' | 'process' | 'team' | 'contact'

// ─── Motion helpers ────────────────────────────────────────────────────────────
// These are *not* React hooks. They take the reduced-motion flag as a
// parameter so call sites can safely use them inside .map() callbacks and
// conditional `view === '…'` branches — neither of which is safe for a real
// hook. Every component that uses them calls `useReducedMotion()` once at
// the top to get `rm`, then threads it through.
function revealAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0, y: 48 },
    whileInView: rm ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }
  }
}

function fadeInAnim(rm: boolean, delay = 0) {
  return {
    initial: rm ? {} : { opacity: 0 },
    animate: rm ? {} : { opacity: 1 },
    transition: { duration: 0.9, ease: 'easeOut', delay }
  }
}

function slideInAnim(rm: boolean, delay = 0, from: 'left' | 'right' = 'left') {
  return {
    initial: rm ? {} : { opacity: 0, x: from === 'left' ? -40 : 40 },
    whileInView: rm ? {} : { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }
  }
}

// ─── Multiline ─────────────────────────────────────────────────────────────────
function ML({ text, className = '', style = {} }: {
  text: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span className={className} style={style}>
      {text.split('\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ))}
    </span>
  )
}

// ─── Section rule ──────────────────────────────────────────────────────────────
function Rule({ color, className = '' }: { color: string; className?: string }) {
  return <div className={`h-px w-full ${className}`} style={{ background: color }} />
}

// ─── Eyebrow label ─────────────────────────────────────────────────────────────
function Eyebrow({ text, colors, fonts }: { text: string; colors: ReturnType<typeof getStudioPreset>['colors']; fonts: { body: string } }) {
  return (
    <span
      className="block text-[10px] font-semibold uppercase tracking-[0.25em]"
      style={{ color: colors.muted, fontFamily: fonts.body }}
    >
      {text}
    </span>
  )
}

// ─── صور (بلا نساء) ───────────────────────────────────────────────────────────
// سياسة الصور: لا صور لنساء غير محجّبات. الواجهة = مشهد ورشة/حِرفة، وصورة
// المؤسّس = رجل. يُرجى التحقّق البصري والاستبدال عند الحاجة.
const HERO_IMG = 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1400&q=85'
const FOUNDER_IMG = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80'
const PROCESS_IMG = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function StudioPreview({
  content,
  presetId,
  className = '',
  colorOverrides,
  typographyPreset,
  view: controlledView,
  onViewChange,
}: Props) {
  const preset = useMemo(() => getStudioPreset(presetId ?? 'ink'), [presetId])
  const colors = useMemo(
    () => ({ ...preset.colors, ...(colorOverrides || {}) }),
    [preset.colors, colorOverrides]
  )
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  const fonts = {
    heading: typo?.heading_font ?? preset.heading_font,
    body:    typo?.body_font    ?? preset.body_font,
    display: preset.display_font,
  }
  const [navOpen, setNavOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [internalView, setInternalView] = useState<StudioView>('home')
  const view = (controlledView as StudioView) || internalView
  const setView = (v: StudioView) => {
    if (onViewChange) onViewChange(v); else setInternalView(v)
  }
  const rm = !!useReducedMotion()

  return (
    <div className={`relative min-h-screen ${className}`} style={{ background: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex h-16 items-center justify-between px-8 md:px-12"
        style={{
          background: `${colors.background}f0`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${colors.border}`
        }}
      >
        <button onClick={() => setView('home')}>
          <span className="text-sm font-semibold tracking-[0.18em] uppercase" style={{ fontFamily: fonts.body, color: colors.text }}>
            {content.brand.name}
          </span>
          {content.brand.founded && (
            <span className="ml-2 text-[10px] tracking-widest" style={{ color: colors.muted }}>تأسّس {content.brand.founded}</span>
          )}
        </button>
        <nav className="hidden items-center gap-10 md:flex">
          {([['قصتنا', 'about'], ['آلية العمل', 'process'], ['الفريق', 'team'], ['تواصل', 'contact']] as [string, StudioView][]).map(([label, page]) => (
            <button key={page} onClick={() => setView(page)} className="text-xs font-medium tracking-widest uppercase transition-opacity hover:opacity-60" style={{ color: view === page ? colors.accent : colors.text, fontFamily: fonts.body, opacity: view === page ? 1 : undefined }}>
              {label}
            </button>
          ))}
        </nav>
        <button
          className="hidden rounded-full border px-6 py-2 text-xs font-semibold uppercase tracking-widest transition-all hover:opacity-80 md:block"
          style={{ borderColor: colors.accent, color: colors.accent, fontFamily: fonts.body }}
        >
          {content.cta.cta_secondary}
        </button>
        <button
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setNavOpen(!navOpen)}
        >
          {[0, 1, 2].map(i => (
            <div key={i} className="h-px w-5" style={{ background: colors.text }} />
          ))}
        </button>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {navOpen && (
          <motion.nav
            className="fixed inset-x-0 top-16 z-40 px-8 py-6"
            style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}` }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {([['قصتنا', 'about'], ['آلية العمل', 'process'], ['الفريق', 'team'], ['تواصل', 'contact']] as [string, StudioView][]).map(([label, page]) => (
              <button
                key={page}
                onClick={() => { setView(page); setNavOpen(false) }}
                className="block w-full py-4 text-right text-sm uppercase tracking-widest transition"
                style={{ color: view === page ? colors.accent : colors.text, borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body }}
              >
                {label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── HERO MANIFESTO ───────────────────────────────────────────────────── */}
      {view === 'home' && <section data-section="hero" className="relative flex min-h-[90vh] flex-col justify-end overflow-hidden px-8 pb-24 pt-32 md:px-12">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="h-full w-full object-cover" style={{ opacity: 0.15 }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, ${colors.background}cc 60%, ${colors.background} 100%)` }} />
        </div>

        {/* Giant manifesto */}
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <motion.div {...fadeInAnim(rm,0.15)}>
            <Eyebrow text={content.hero.eyebrow} colors={colors} fonts={fonts} />
          </motion.div>

          <motion.h1
            className="mt-6 leading-[0.9] tracking-tight"
            style={{
              fontFamily: fonts.display,
              color: colors.text,
              fontWeight: 700,
              fontSize: 'clamp(3.5rem, 10vw, 11rem)',
              letterSpacing: '-0.02em'
            }}
            {...fadeInAnim(rm,0.3)}
          >
            <ML text={content.hero.manifesto} />
          </motion.h1>

          <motion.div className="mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between" {...fadeInAnim(rm,0.5)}>
            <p
              className="max-w-lg text-lg leading-relaxed"
              style={{ color: colors.muted, fontFamily: fonts.body }}
            >
              {content.hero.subheadline}
            </p>
            <div className="flex gap-4">
              <button
                className="rounded-full px-8 py-4 text-sm font-semibold tracking-wide transition-all hover:opacity-80"
                style={{ background: colors.accent, color: colors.background, fontFamily: fonts.body }}
              >
                {content.hero.cta_primary}
              </button>
              <button
                className="rounded-full border px-8 py-4 text-sm font-semibold tracking-wide transition-all hover:opacity-60"
                style={{ borderColor: colors.border, color: colors.text, fontFamily: fonts.body }}
              >
                {content.hero.cta_secondary}
              </button>
            </div>
          </motion.div>
        </div>
      </section>}

      {/* ── MISSION STATEMENT ────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'about') && <section data-section="mission" className="px-8 py-28 md:px-12" style={{ background: colors.surface }}>
        <div className="mx-auto max-w-5xl">
          <Rule color={colors.border} className="mb-16" />
          <div className="grid gap-16 md:grid-cols-[1fr_2fr]">
            <motion.div {...slideInAnim(rm,0, 'left')}>
              <Eyebrow text="رسالتنا" colors={colors} fonts={fonts} />
            </motion.div>
            <motion.div {...slideInAnim(rm,0.15, 'right')}>
              <p
                className="text-2xl font-medium italic leading-relaxed md:text-3xl"
                style={{ fontFamily: fonts.heading, color: colors.text, fontStyle: 'italic' }}
              >
                &ldquo;{content.mission.statement}&rdquo;
              </p>
              <p className="mt-8 text-base leading-[1.9]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                {content.mission.elaboration}
              </p>
            </motion.div>
          </div>
          <Rule color={colors.border} className="mt-16" />
        </div>
      </section>}

      {/* ── FOUNDER LETTER ───────────────────────────────────────────────────── */}
      {view === 'about' && content.founder_letter && (
        <section data-section="founder_letter" className="px-8 py-28 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 md:grid-cols-[5fr_4fr] md:items-start">
              {/* Letter */}
              <motion.div {...revealAnim(rm,0)}>
                <Eyebrow text={content.founder_letter.eyebrow} colors={colors} fonts={fonts} />
                <h2
                  className="mt-6 text-4xl font-semibold leading-tight md:text-5xl"
                  style={{ fontFamily: fonts.heading, color: colors.text }}
                >
                  {content.founder_letter.heading}
                </h2>
                <div className="mt-8 space-y-6">
                  {content.founder_letter.paragraphs.map((para, i) => (
                    <p key={i} className="text-base leading-[1.9]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                      {para}
                    </p>
                  ))}
                </div>
                <div className="mt-10">
                  <p className="text-xl italic" style={{ fontFamily: fonts.heading, color: colors.text }}>
                    — {content.founder_letter.signature}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: colors.muted, fontFamily: fonts.body }}>
                    {content.founder_letter.signature_role}
                  </p>
                </div>
              </motion.div>

              {/* Founder image */}
              <motion.div
                className="relative aspect-[3/4] overflow-hidden rounded-2xl"
                {...revealAnim(rm,0.2)}
              >
                <img src={FOUNDER_IMG} alt="Founder" className="h-full w-full object-cover" style={{ filter: 'grayscale(30%)' }} />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(to top, ${colors.background}60 0%, transparent 50%)` }}
                />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── TIMELINE ─────────────────────────────────────────────────────────── */}
      {view === 'about' && content.timeline && (
        <section data-section="timeline" className="px-8 py-28 md:px-12" style={{ background: colors.surface }}>
          <div className="mx-auto max-w-5xl">
            <motion.div className="mb-16 grid md:grid-cols-[1fr_2fr]" {...revealAnim(rm,0)}>
              <Eyebrow text={content.timeline.eyebrow} colors={colors} fonts={fonts} />
              <h2
                className="mt-4 text-4xl font-semibold leading-tight md:mt-0 md:text-5xl"
                style={{ fontFamily: fonts.heading, color: colors.text }}
              >
                {content.timeline.heading}
              </h2>
            </motion.div>

            {/* Timeline events */}
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-0 top-0 hidden w-px md:block"
                style={{ background: colors.border, height: '100%' }}
              />
              <div className="space-y-0 md:ml-8">
                {content.timeline.events.map((event, i) => (
                  <motion.div
                    key={i}
                    className="relative grid py-10 md:grid-cols-[160px_1fr]"
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                    initial={rm ? {} : { opacity: 0, x: -24 }}
                    whileInView={rm ? {} : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  >
                    {/* Year dot */}
                    <div className="hidden md:block">
                      <div
                        className="absolute -left-[9px] top-[calc(2.5rem_+_2px)] h-4 w-4 rounded-full border-2"
                        style={{ background: colors.background, borderColor: colors.accent }}
                      />
                      <span
                        className="text-3xl font-bold"
                        style={{ fontFamily: fonts.heading, color: colors.muted }}
                      >
                        {event.year}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-3 md:hidden">
                        <span className="text-2xl font-bold" style={{ fontFamily: fonts.heading, color: colors.muted }}>{event.year}</span>
                      </div>
                      <h3 className="text-xl font-semibold" style={{ fontFamily: fonts.heading, color: colors.text }}>
                        {event.title}
                      </h3>
                      <p className="mt-2 text-sm leading-[1.85]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                        {event.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── VALUES ───────────────────────────────────────────────────────────── */}
      {view === 'about' && content.values && (
        <section data-section="values" className="px-8 py-28 md:px-12">
          <div className="mx-auto max-w-5xl">
            <motion.div className="mb-16" {...revealAnim(rm,0)}>
              <Eyebrow text={content.values.eyebrow} colors={colors} fonts={fonts} />
              <h2
                className="mt-6 text-4xl font-semibold leading-tight md:text-5xl"
                style={{ fontFamily: fonts.heading, color: colors.text }}
              >
                {content.values.heading}
              </h2>
              {content.values.subheading && (
                <p className="mt-4 text-lg italic" style={{ fontFamily: fonts.heading, color: colors.muted }}>
                  {content.values.subheading}
                </p>
              )}
            </motion.div>

            <div className="space-y-0">
              {content.values.items.map((val, i) => (
                <motion.div
                  key={i}
                  className="grid gap-6 py-12 md:grid-cols-[120px_1fr_2fr]"
                  style={{ borderTop: `1px solid ${colors.border}` }}
                  initial={rm ? {} : { opacity: 0, y: 32 }}
                  whileInView={rm ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
                >
                  <span
                    className="text-5xl font-bold"
                    style={{ fontFamily: fonts.heading, color: colors.accentMuted === 'rgba(10,10,10,0.07)' ? colors.border : colors.accentMuted, opacity: 0.6 }}
                  >
                    {val.number}
                  </span>
                  <h3 className="text-2xl font-semibold" style={{ fontFamily: fonts.heading, color: colors.text }}>
                    {val.title}
                  </h3>
                  <p className="text-sm leading-[1.9]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                    {val.body}
                  </p>
                </motion.div>
              ))}
              <div style={{ borderTop: `1px solid ${colors.border}` }} />
            </div>
          </div>
        </section>
      )}

      {/* ── PROCESS ──────────────────────────────────────────────────────────── */}
      {(view === 'process' || view === 'home') && content.process && (
        <section data-section="process" className="px-8 py-28 md:px-12" style={{ background: colors.surface }}>
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 grid gap-12 md:grid-cols-2 md:items-end">
              <motion.div {...revealAnim(rm,0)}>
                <Eyebrow text={content.process.eyebrow} colors={colors} fonts={fonts} />
                <h2
                  className="mt-6 text-4xl font-semibold leading-tight md:text-5xl"
                  style={{ fontFamily: fonts.heading, color: colors.text }}
                >
                  {content.process.heading}
                </h2>
              </motion.div>
              <motion.div {...revealAnim(rm,0.15)}>
                <p className="text-base leading-[1.9]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {content.process.body}
                </p>
              </motion.div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {content.process.steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-8"
                  style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}` }}
                  initial={rm ? {} : { opacity: 0, y: 32 }}
                  whileInView={rm ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
                >
                  <span
                    className="block text-4xl font-bold"
                    style={{ fontFamily: fonts.heading, color: colors.accent, opacity: 0.6 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold" style={{ fontFamily: fonts.heading, color: colors.text }}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.85]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Process image */}
            <motion.div className="mt-12 overflow-hidden rounded-2xl" {...revealAnim(rm,0.2)}>
              <img
                src={PROCESS_IMG}
                alt="Process"
                className="h-64 w-full object-cover md:h-80"
                style={{ filter: 'grayscale(20%)' }}
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* ── TEAM ─────────────────────────────────────────────────────────────── */}
      {view === 'team' && content.team && (
        <section data-section="team" className="px-8 py-28 md:px-12">
          <div className="mx-auto max-w-5xl">
            <motion.div className="mb-16" {...revealAnim(rm,0)}>
              <Eyebrow text={content.team.eyebrow} colors={colors} fonts={fonts} />
              <h2
                className="mt-6 text-4xl font-semibold leading-tight md:text-5xl"
                style={{ fontFamily: fonts.heading, color: colors.text }}
              >
                <ML text={content.team.heading} />
              </h2>
              {content.team.subheading && (
                <p className="mt-4 text-base" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {content.team.subheading}
                </p>
              )}
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {content.team.members.map((member, i) => (
                <motion.div
                  key={i}
                  className="group"
                  initial={rm ? {} : { opacity: 0, y: 32 }}
                  whileInView={rm ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 }}
                >
                  <div
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold"
                    style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, fontFamily: fonts.heading }}
                  >
                    {member.avatar_letter}
                  </div>
                  <h3 className="text-xl font-semibold" style={{ fontFamily: fonts.heading, color: colors.text }}>
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-widest" style={{ color: colors.accent, fontFamily: fonts.body }}>
                    {member.role}
                  </p>
                  <p className="mt-4 text-sm leading-[1.85]" style={{ color: colors.muted, fontFamily: fonts.body }}>
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRESS ────────────────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'about') && content.press && (
        <section data-section="press" className="px-8 py-28 md:px-12" style={{ background: colors.surface }}>
          <div className="mx-auto max-w-5xl">
            <motion.div className="mb-16" {...revealAnim(rm,0)}>
              <Rule color={colors.border} className="mb-10" />
              <h2
                className="text-3xl font-semibold italic"
                style={{ fontFamily: fonts.heading, color: colors.muted }}
              >
                {content.press.heading}
              </h2>
            </motion.div>

            <div className="space-y-0">
              {content.press.items.map((item, i) => (
                <motion.div
                  key={i}
                  className="grid gap-4 py-10 md:grid-cols-[200px_1fr_auto]"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                  initial={rm ? {} : { opacity: 0, y: 20 }}
                  whileInView={rm ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                >
                  <span
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: colors.text, fontFamily: fonts.body }}
                  >
                    {item.publication}
                  </span>
                  <p
                    className="text-xl font-medium italic leading-snug"
                    style={{ fontFamily: fonts.heading, color: colors.text }}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  {item.year && (
                    <span className="text-xs self-start" style={{ color: colors.muted, fontFamily: fonts.body }}>
                      {item.year}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── COMMUNITY STATS ──────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'contact') && content.community && (
        <section data-section="community" className="px-8 py-28 md:px-12">
          <div className="mx-auto max-w-5xl">
            <motion.div className="mb-16" {...revealAnim(rm,0)}>
              <Eyebrow text={content.community.eyebrow} colors={colors} fonts={fonts} />
              <h2
                className="mt-6 text-4xl font-semibold leading-tight md:text-5xl"
                style={{ fontFamily: fonts.heading, color: colors.text }}
              >
                <ML text={content.community.heading} />
              </h2>
              {content.community.subheading && (
                <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {content.community.subheading}
                </p>
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {content.community.stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={rm ? {} : { opacity: 0, y: 32 }}
                  whileInView={rm ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
                >
                  <div
                    className="text-4xl font-bold md:text-5xl"
                    style={{ fontFamily: fonts.heading, color: colors.text }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-widest" style={{ color: colors.muted, fontFamily: fonts.body }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      {(view === 'home' || view === 'contact') && content.cta && (
        <section
          data-section="cta"
          className="px-8 py-36 md:px-12"
          style={{ background: colors.accent === '#0a0a0a' ? colors.surfaceAlt : colors.accent === '#c9a84c' ? colors.gradient : colors.surfaceAlt }}
        >
          <motion.div className="mx-auto max-w-3xl text-center" {...revealAnim(rm,0)}>
            <Eyebrow text={content.cta.eyebrow} colors={{ ...colors, muted: colors.accent === '#0a0a0a' ? colors.muted : `${colors.background}99` }} fonts={fonts} />
            <h2
              className="mt-8 leading-[0.95] tracking-tight"
              style={{
                fontFamily: fonts.display,
                color: colors.accent === '#c9a84c' ? '#1a1008' : colors.text,
                fontWeight: 700,
                fontSize: 'clamp(2.5rem, 7vw, 7rem)',
                letterSpacing: '-0.02em'
              }}
            >
              <ML text={content.cta.heading} />
            </h2>
            <p
              className="mx-auto mt-8 max-w-md text-base leading-relaxed"
              style={{ color: colors.muted, fontFamily: fonts.body }}
            >
              {content.cta.subheading}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <button
                className="rounded-full px-10 py-5 text-sm font-semibold tracking-wide transition-all hover:opacity-80"
                style={{ background: colors.text, color: colors.background, fontFamily: fonts.body }}
              >
                {content.cta.cta_primary}
              </button>
              <button
                className="rounded-full border px-10 py-5 text-sm font-semibold tracking-wide transition-all hover:opacity-60"
                style={{ borderColor: colors.border, color: colors.text, fontFamily: fonts.body }}
              >
                {content.cta.cta_secondary}
              </button>
            </div>
          </motion.div>
        </section>
      )}

      {/* ── BOOKING (Pro / free-trial only; renders null otherwise) ──────────── */}
      <BookingSection
        type="contact"
        eyebrow="تواصل"
        heading="احجز استشارة"
        subheading="اترك تفاصيلك وسنعاود التواصل معك لتحديد موعد."
        background={colors.surface}
        palette={{
          accent: colors.accent,
          accentText: colors.background,
          text: colors.text,
          muted: colors.muted,
          surface: colors.background,
          border: colors.border,
          headingFont: fonts.heading,
          bodyFont: fonts.body,
          radius: 4,
        }}
      />

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="px-8 py-16 md:px-12" style={{ background: colors.background, borderTop: `1px solid ${colors.border}` }}>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="block text-sm font-semibold tracking-[0.18em] uppercase" style={{ fontFamily: fonts.body, color: colors.text }}>
                {content.brand.name}
              </span>
              <span className="mt-1 block text-xs italic" style={{ fontFamily: fonts.heading, color: colors.muted }}>
                {content.footer.tagline}
              </span>
            </div>
            <div className="flex flex-wrap gap-8">
              {['قصتنا', 'آلية العمل', 'الفريق', 'الصحافة', 'تواصل'].map((link) => (
                <button key={link} className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60" style={{ color: colors.muted, fontFamily: fonts.body }}>
                  {link}
                </button>
              ))}
            </div>
          </div>
          <Rule color={colors.border} className="my-8" />
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
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
