'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Camera, MessageCircle, ShoppingBag, PenLine, TrendingUp, Sparkles } from 'lucide-react'
import ZenyaMark from '@/components/ZenyaMark'
import { themePreview } from '@/lib/theme-previews'

/**
 * HeroConstellation — the "everything connects to زينيا" visual.
 *
 * A central زينيا logo hub with floating cards orbiting it, joined by faint
 * dotted connector lines (quso.ai-style, in our cream/indigo palette). The
 * nodes tell Zenya's real story — no fabricated data:
 *   • three real template previews (restaurant / SaaS / wellness screenshots)
 *   • an "AI is writing your copy" card (what the product actually does)
 *   • an analytics card with an ABSTRACT chart + a neutral "visitors" label
 *     (real feature; deliberately no invented revenue figure)
 *   • ambient platform bubbles (publish / share where customers are)
 *
 * Desktop shows the full constellation; small screens fall back to a compact
 * hub + template grid so nothing overflows.
 */

const EASE = [0.22, 1, 0.36, 1] as const

// Node anchor points in the 0–100 constellation coordinate space. Connector
// lines and the cards both read from here so they always line up.
const NODES = {
  restaurant: { x: 19, y: 25 },
  atlas: { x: 82, y: 21 },
  wellness: { x: 84, y: 74 },
  copy: { x: 16, y: 73 },
  analytics: { x: 50, y: 90 },
} as const

const HUB = { x: 50, y: 50 }

/** One floating card wrapper: absolute-positioned + gentle bob. */
function Floating({
  x,
  y,
  delay = 0,
  amplitude = 8,
  className = '',
  children,
}: {
  x: number
  y: number
  delay?: number
  amplitude?: number
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`absolute z-10 ${className}`}
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -amplitude, 0] }}
        transition={{ duration: 5 + amplitude * 0.2, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** A mini "browser window" showing a real template screenshot. */
function TemplateCard({ id, tint }: { id: string; tint: string }) {
  return (
    <div
      className="w-[150px] overflow-hidden rounded-xl bg-white sm:w-[178px]"
      style={{ border: '1px solid #e5e2d9', boxShadow: '0 22px 50px -22px rgba(28,28,28,0.35)' }}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ background: '#faf8f3', borderBottom: '1px solid #f0ede6' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fca5a5' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fcd34d' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#86efac' }} />
        <span className="ms-auto h-1.5 w-8 rounded-full" style={{ background: `${tint}30` }} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={themePreview(id)} alt="" className="h-[104px] w-full object-cover object-top sm:h-[122px]" loading="lazy" />
    </div>
  )
}

/** Neumorphic platform bubble. */
function Bubble({
  x,
  y,
  delay,
  children,
}: {
  x: number
  y: number
  delay: number
  children: React.ReactNode
}) {
  return (
    <Floating x={x} y={y} delay={delay} amplitude={6} className="z-20">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-foreground sm:h-12 sm:w-12"
        style={{ boxShadow: '0 10px 22px -8px rgba(28,28,28,0.25), inset 0 1px 0 rgba(255,255,255,0.9)', border: '1px solid #efece3' }}
      >
        {children}
      </div>
    </Floating>
  )
}

export default function HeroConstellation() {
  const reduce = useReducedMotion()

  return (
    <div className="relative mx-auto mt-16 w-full max-w-5xl">
      {/* ── Desktop / tablet constellation ── */}
      <div className="relative hidden h-[540px] md:block">
        {/* Connector lines from the hub to every card. Drawn in a 0–100 space
            with non-scaling strokes so they stay hairline-crisp. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {Object.values(NODES).map((n, i) => (
            <line
              key={i}
              x1={HUB.x}
              y1={HUB.y}
              x2={n.x}
              y2={n.y}
              stroke="rgba(94,106,210,0.28)"
              strokeWidth={1}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Node dots at each card anchor (HTML so they stay perfectly round). */}
        {Object.values(NODES).map((n, i) => (
          <span
            key={i}
            className="absolute z-[5] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${n.x}%`, top: `${n.y}%`, background: '#5e6ad2', boxShadow: '0 0 0 4px rgba(94,106,210,0.12)' }}
          />
        ))}

        {/* Central hub — the زينيا logo, replacing quso's "Q". */}
        <div
          className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(94,106,210,0.20) 0%, transparent 70%)', filter: 'blur(10px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex h-[132px] w-[132px] flex-col items-center justify-center gap-2 rounded-3xl bg-white"
            style={{ border: '1px solid #e8e5db', boxShadow: '0 30px 70px -25px rgba(94,106,210,0.5), 0 0 0 1px rgba(94,106,210,0.06)' }}
          >
            <span className="conic-glow pointer-events-none absolute -inset-px rounded-3xl opacity-40" aria-hidden />
            <ZenyaMark className="relative h-7 text-[#16171b]" />
            <span className="relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold" style={{ background: 'rgba(94,106,210,0.08)', color: '#5e6ad2' }}>
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.25} />
              الذكاء الاصطناعي
            </span>
          </motion.div>
        </div>

        {/* Template preview cards */}
        <Floating x={NODES.restaurant.x} y={NODES.restaurant.y} delay={0.15} amplitude={10}>
          <TemplateCard id="restaurant" tint="#c8a96a" />
        </Floating>
        <Floating x={NODES.atlas.x} y={NODES.atlas.y} delay={0.28} amplitude={8}>
          <TemplateCard id="atlas" tint="#5e6ad2" />
        </Floating>
        <Floating x={NODES.wellness.x} y={NODES.wellness.y} delay={0.4} amplitude={11}>
          <TemplateCard id="wellness" tint="#14b8a6" />
        </Floating>

        {/* "AI writes your copy" card */}
        <Floating x={NODES.copy.x} y={NODES.copy.y} delay={0.34} amplitude={9}>
          <div
            className="w-[188px] rounded-2xl bg-white p-3.5"
            style={{ border: '1px solid #e8e5db', boxShadow: '0 22px 50px -22px rgba(28,28,28,0.3)' }}
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
        </Floating>

        {/* Analytics card — abstract chart, no invented revenue number */}
        <Floating x={NODES.analytics.x} y={NODES.analytics.y} delay={0.46} amplitude={8}>
          <div
            className="w-[184px] rounded-2xl bg-white p-3.5"
            style={{ border: '1px solid #e8e5db', boxShadow: '0 22px 50px -22px rgba(28,28,28,0.3)' }}
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
        </Floating>

        {/* Ambient platform bubbles — publish / connect where customers are */}
        <Bubble x={50} y={9} delay={0.5}>
          <Camera className="h-5 w-5" strokeWidth={1.75} style={{ color: '#e1306c' }} />
        </Bubble>
        <Bubble x={92} y={47} delay={0.58}>
          <MessageCircle className="h-5 w-5" strokeWidth={1.75} style={{ color: '#25d366' }} />
        </Bubble>
        <Bubble x={8} y={45} delay={0.64}>
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} style={{ color: '#5e6ad2' }} />
        </Bubble>
      </div>

      {/* ── Mobile fallback — hub + template grid, no overflow ── */}
      <div className="md:hidden">
        <div className="flex justify-center">
          <div
            className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white"
            style={{ border: '1px solid #e8e5db', boxShadow: '0 24px 50px -22px rgba(94,106,210,0.45)' }}
          >
            <ZenyaMark className="h-5 text-[#16171b]" />
            <span className="text-[8.5px] font-semibold" style={{ color: '#5e6ad2' }}>الذكاء الاصطناعي</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <TemplateCard id="restaurant" tint="#c8a96a" />
          <TemplateCard id="atlas" tint="#5e6ad2" />
          <TemplateCard id="wellness" tint="#14b8a6" />
          <TemplateCard id="services" tint="#f59e0b" />
        </div>
      </div>
    </div>
  )
}
