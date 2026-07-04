'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Camera, MessageCircle, ShoppingBag, MapPin, Music2, Mail, PenLine, TrendingUp, Sparkles } from 'lucide-react'
import ZenyaMark from '@/components/ZenyaMark'
import { themePreview } from '@/lib/theme-previews'

/**
 * HeroConstellation — quso.ai-style hero furniture.
 *
 * On large screens this is a SCATTER that flanks the centred hero copy: real
 * template-preview cards + an "AI writes your copy" card + an analytics card
 * tucked into the left/right gutters, with a colourful arc of platform bubbles
 * along the bottom (publish / connect where customers are). The headline itself
 * is the focal point — no central logo hub competing with it.
 *
 * Everything is honest: real screenshots, a real product feature (AI copy), an
 * ABSTRACT chart with a neutral "visitors" label (no invented numbers), and
 * real platforms. Below `lg` it collapses to a compact hub + template grid so
 * nothing overlaps the copy on a phone.
 */

const EASE = [0.22, 1, 0.36, 1] as const

/** Absolute-positioned wrapper with a gentle, endless bob. */
function Floating({
  x,
  y,
  delay = 0,
  amplitude = 8,
  rotate = 0,
  className = '',
  children,
}: {
  x: number
  y: number
  delay?: number
  amplitude?: number
  rotate?: number
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      <motion.div
        style={{ rotate }}
        animate={reduce ? {} : { y: [0, -amplitude, 0] }}
        transition={{ duration: 5 + amplitude * 0.2, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** A mini "browser window" showing a real template screenshot. */
function TemplateCard({ id, tint, className = '' }: { id: string; tint: string; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-white ${className}`}
      style={{ border: '1px solid #e5e2d9', boxShadow: '0 26px 56px -24px rgba(28,28,28,0.4)' }}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ background: '#faf8f3', borderBottom: '1px solid #f0ede6' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fca5a5' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fcd34d' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#86efac' }} />
        <span className="ms-auto h-1.5 w-8 rounded-full" style={{ background: `${tint}30` }} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={themePreview(id)} alt="" className="h-[112px] w-full object-cover object-top" loading="lazy" />
    </div>
  )
}

/** "AI is writing your copy" card — a real product moment. */
function CopyCard() {
  const reduce = useReducedMotion()
  return (
    <div
      className="w-[190px] rounded-2xl bg-white p-3.5"
      style={{ border: '1px solid #e8e5db', boxShadow: '0 24px 54px -24px rgba(28,28,28,0.34)' }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: '#5e6ad2' }}>
          <PenLine className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="text-[11px] font-semibold text-foreground">يكتب نصك الآن…</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <span className="block h-1.5 w-full rounded-full" style={{ background: 'rgba(94,106,210,0.16)' }} />
        <span className="block h-1.5 w-4/5 rounded-full" style={{ background: 'rgba(94,106,210,0.16)' }} />
        <motion.span
          className="block h-1.5 rounded-full"
          style={{ background: '#5e6ad2' }}
          initial={{ width: '20%' }}
          animate={reduce ? { width: '55%' } : { width: ['20%', '62%', '20%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

/** Analytics card — abstract bars, neutral label, no invented figure. */
function AnalyticsCard() {
  return (
    <div
      className="w-[186px] rounded-2xl bg-white p-3.5"
      style={{ border: '1px solid #e8e5db', boxShadow: '0 24px 54px -24px rgba(28,28,28,0.34)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">الزوّار</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#27a644' }}>
          <TrendingUp className="h-3 w-3" strokeWidth={2.25} /> نمو
        </span>
      </div>
      <div className="flex h-10 items-end gap-1">
        {[38, 52, 44, 66, 58, 78, 92].map((h, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: i >= 5 ? '#5e6ad2' : 'rgba(94,106,210,0.25)' }}
            initial={{ height: '20%' }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.06, ease: EASE }}
          />
        ))}
      </div>
    </div>
  )
}

/** Neumorphic platform bubble — colourful, like the reference's social row. */
function Bubble({ delay, children }: { delay: number; children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white sm:h-[52px] sm:w-[52px]"
        style={{ boxShadow: '0 14px 30px -10px rgba(28,28,28,0.28), inset 0 2px 2px rgba(255,255,255,0.95), inset 0 -3px 6px rgba(28,28,28,0.05)', border: '1px solid #efece3' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

const PLATFORMS = [
  { icon: ShoppingBag, color: '#95bf47', delay: 0.5 },
  { icon: Camera, color: '#e1306c', delay: 0.56 },
  { icon: Music2, color: '#1c1c1c', delay: 0.62 },
  { icon: MessageCircle, color: '#25d366', delay: 0.68 },
  { icon: MapPin, color: '#ea4335', delay: 0.74 },
  { icon: Mail, color: '#f59e0b', delay: 0.8 },
]

export default function HeroConstellation() {
  return (
    <>
      {/* ── Desktop (xl+ only, where the gutters are wide enough): scatter
          flanking the copy. Below xl we fall back to the stacked grid so cards
          never crash into the headline. ── */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden xl:block">
        {/* Left gutter — kept well outside the centred copy column */}
        <Floating x={7} y={22} delay={0.15} amplitude={11} rotate={-6}>
          <TemplateCard id="restaurant" tint="#c8a96a" className="w-[178px]" />
        </Floating>
        <Floating x={7} y={68} delay={0.34} amplitude={9} rotate={4}>
          <CopyCard />
        </Floating>

        {/* Right gutter */}
        <Floating x={93} y={25} delay={0.26} amplitude={9} rotate={5}>
          <TemplateCard id="atlas" tint="#5e6ad2" className="w-[178px]" />
        </Floating>
        <Floating x={93} y={70} delay={0.44} amplitude={10} rotate={-4}>
          <AnalyticsCard />
        </Floating>

        {/* A third, smaller preview peeking lower-left for balance */}
        <Floating x={15} y={94} delay={0.5} amplitude={8} rotate={-3}>
          <TemplateCard id="wellness" tint="#14b8a6" className="w-[148px]" />
        </Floating>

        {/* Platform arc along the bottom */}
        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-4">
          {PLATFORMS.map((p, i) => {
            const Icon = p.icon
            return (
              <Bubble key={i} delay={p.delay}>
                <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} style={{ color: p.color }} />
              </Bubble>
            )
          })}
        </div>
      </div>

      {/* ── Mobile / tablet (below xl) — a composed cluster, not a flat grid:
          a glowing زينيا hub, gently fanned preview cards, and one tidy row of
          platform bubbles. Reads as "designed", scaled for small screens. ── */}
      <div className="mt-12 xl:hidden">
        {/* Hub */}
        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(94,106,210,0.22) 0%, transparent 70%)', filter: 'blur(8px)' }}
          />
          <div
            className="relative flex h-[104px] w-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl bg-white"
            style={{ border: '1px solid #e8e5db', boxShadow: '0 26px 56px -24px rgba(94,106,210,0.5), 0 0 0 1px rgba(94,106,210,0.06)' }}
          >
            <span className="conic-glow pointer-events-none absolute -inset-px rounded-3xl opacity-40" aria-hidden />
            <ZenyaMark className="relative h-5 text-[#16171b]" />
            <span className="relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: 'rgba(94,106,210,0.08)', color: '#5e6ad2' }}>
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.25} />
              الذكاء الاصطناعي
            </span>
          </div>
        </div>

        {/* Preview cards — gently fanned for a designed feel */}
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-x-4 gap-y-5">
          {[
            { id: 'restaurant', tint: '#c8a96a', rot: -2.5 },
            { id: 'atlas', tint: '#5e6ad2', rot: 2.5 },
            { id: 'wellness', tint: '#14b8a6', rot: 2 },
            { id: 'services', tint: '#f59e0b', rot: -2 },
          ].map((c) => (
            <div key={c.id} style={{ transform: `rotate(${c.rot}deg)` }}>
              <TemplateCard id={c.id} tint={c.tint} />
            </div>
          ))}
        </div>

        {/* Platform bubbles — one tidy centered row */}
        <div className="mt-9 flex justify-center gap-3">
          {PLATFORMS.map((p, i) => {
            const Icon = p.icon
            return (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
                style={{ boxShadow: '0 12px 26px -10px rgba(28,28,28,0.22), inset 0 1.5px 1.5px rgba(255,255,255,0.9)', border: '1px solid #efece3' }}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: p.color }} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
