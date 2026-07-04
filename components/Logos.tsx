'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '@/components/marketing/Reveal'
import { RING_BRANDS, BrandMark, type Brand } from '@/components/marketing/BrandMarks'

/**
 * Logos — "يعمل مع أدواتك المفضلة" (Works with your favorite tools).
 *
 * A single ring of soft, puffy 3D bubbles (image-4 style) orbiting a centred
 * heading — the merged replacement for the old logo marquee AND the separate
 * "works with" ring, so the page never repeats the motif.
 *
 * Every bubble carries a REAL brand mark (see BrandMarks): the tools Zenya is
 * built on (Shopify, OpenAI, Stripe, Next.js, Supabase, Vercel) mixed with the
 * platforms a generated site connects to (Instagram, WhatsApp, TikTok, Google,
 * YouTube, Facebook). Marks render as calm dark silhouettes — recognisable and
 * authentic, never a loud rainbow — so the bubble stays the hero, exactly like
 * the reference. Cream/indigo palette throughout.
 */

const EASE = [0.22, 1, 0.36, 1] as const

// Ring geometry, in % of the square stage. Bubbles sit on a circle around the
// centre; a touch of per-index radius jitter keeps it organic (not clockwork).
const COUNT = RING_BRANDS.length
const RADIUS = 41 // %
const JITTER = [0, 2, -1.5, 1.5, -2, 1.5, 0, -1.5, 2, -2, 1.5, -1] // per index

function ringPos(i: number) {
  // Start at the top (-90°) and go clockwise. Round to a fixed precision so the
  // server and client render byte-identical strings (avoids a float-drift
  // hydration mismatch on the last decimal of cos/sin).
  const angle = (-90 + (360 / COUNT) * i) * (Math.PI / 180)
  const r = RADIUS + (JITTER[i % JITTER.length] ?? 0)
  const round = (n: number) => Math.round(n * 1000) / 1000
  return {
    x: round(50 + r * Math.cos(angle)),
    y: round(50 + r * Math.sin(angle)),
  }
}

function BubbleShell({
  children,
  size = 'md',
}: {
  children: React.ReactNode
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'h-12 w-12' : 'h-[46px] w-[46px] sm:h-14 sm:w-14 md:h-16 md:w-16'
  return (
    <div
      className={`flex ${dim} items-center justify-center rounded-full bg-white`}
      style={{
        // Puffy neumorphic depth: soft drop + a bright inner top highlight and
        // a faint inner bottom shade — that's what reads as "3D" in the ref.
        boxShadow:
          '0 16px 34px -12px rgba(28,28,28,0.28), 0 4px 10px -4px rgba(28,28,28,0.12), inset 0 2px 2px rgba(255,255,255,0.95), inset 0 -3px 6px rgba(28,28,28,0.05)',
        border: '1px solid #efece3',
      }}
    >
      {children}
    </div>
  )
}

function OrbitBubble({ brand, i }: { brand: Brand; i: number }) {
  const reduce = useReducedMotion()
  const { x, y } = ringPos(i)
  const delay = 0.04 * i
  return (
    <motion.div
      className="absolute z-10"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        <BubbleShell>
          <BrandMark
            brand={brand}
            className="h-[19px] w-[19px] sm:h-6 sm:w-6 md:h-7 md:w-7"
            // Calm dark silhouette, kept a touch soft so it never shouts.
            color="rgba(28,28,28,0.82)"
          />
        </BubbleShell>
      </motion.div>
    </motion.div>
  )
}

function Center() {
  return (
    <Reveal>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary sm:mb-3 sm:text-xs sm:tracking-[0.28em]">
        منظومة متكاملة
      </p>
      <h2 className="display-ar text-[clamp(19px,5.4vw,46px)] leading-[1.12] text-foreground">
        يعمل مع{' '}
        <span className="gradient-text">أدواتك المفضّلة.</span>
      </h2>
      <p className="mx-auto mt-2.5 max-w-sm text-[11.5px] leading-[1.65] text-muted sm:mt-4 sm:text-[14.5px] sm:leading-[1.9]">
        مبنيّ على المنصّات التي تثق بها كبرى الشركات — ويتصل بمتجرك، وحساباتك على
        التواصل، وخرائطك، ومدفوعاتك في مكان واحد.
      </p>
    </Reveal>
  )
}

export default function Logos() {
  return (
    <section className="relative overflow-hidden border-y border-token py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* One responsive ring at every width — the % positions scale with the
            square container, so phone/tablet show the same composition as
            desktop, just smaller (no separate, weaker mobile layout). */}
        <div className="relative mx-auto aspect-square w-full max-w-[clamp(340px,86vw,600px)]">
          {/* Faint guide circle behind the bubbles — subtle depth, like the ref. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: `${RADIUS * 2}%`,
              height: `${RADIUS * 2}%`,
              border: '1px dashed rgba(94,106,210,0.18)',
            }}
          />
          {RING_BRANDS.map((b, i) => (
            <OrbitBubble key={b.name} brand={b} i={i} />
          ))}
          <div className="absolute left-1/2 top-1/2 z-20 w-[62%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 text-center sm:w-[300px] md:w-[380px]">
            <Center />
          </div>
        </div>
      </div>
    </section>
  )
}
