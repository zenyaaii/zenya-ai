'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * A living, ambient background for the accounts portal — slowly drifting
 * brand-colored aurora orbs over a soft cream base, with a faint moving mesh
 * and a couple of floating sparkles. Purely decorative (aria-hidden) and
 * pointer-events-none so it never interferes with the auth card on top.
 *
 * Respects prefers-reduced-motion: falls back to a static gradient.
 */
export default function AccountsBackground() {
  const reduce = useReducedMotion()

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f7f4ed 0%, #f2eee4 100%)' }}
    >
      {/* Drifting aurora orbs */}
      <Orb
        color="rgba(94,106,210,0.42)"
        size={620}
        start={{ top: '-12%', left: '-8%' }}
        path={reduce ? undefined : { x: [0, 120, -40, 0], y: [0, 80, 40, 0] }}
        duration={26}
      />
      <Orb
        color="rgba(217,119,6,0.20)"
        size={520}
        start={{ bottom: '-14%', right: '-6%' }}
        path={reduce ? undefined : { x: [0, -100, 30, 0], y: [0, -70, -30, 0] }}
        duration={32}
      />
      <Orb
        color="rgba(13,148,136,0.20)"
        size={460}
        start={{ top: '35%', right: '18%' }}
        path={reduce ? undefined : { x: [0, 60, -80, 0], y: [0, -50, 60, 0] }}
        duration={38}
      />

      {/* Faint moving mesh grid — adds subtle depth/motion */}
      {!reduce && (
        <motion.div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(28,28,28,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,28,0.05) 1px, transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(circle at 50% 45%, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 45%, black, transparent 72%)',
          }}
          animate={{ backgroundPositionX: ['0px', '46px'], backgroundPositionY: ['0px', '46px'] }}
          transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
        />
      )}

      {/* Floating sparkles */}
      {!reduce &&
        SPARKLES.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              background: 'radial-gradient(circle, rgba(94,106,210,0.9), rgba(94,106,210,0))',
            }}
            animate={{ y: [0, -14, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: s.dur, ease: 'easeInOut', repeat: Infinity, delay: s.delay }}
          />
        ))}

      {/* Top light bloom to keep the card area bright */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{ background: 'radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.7), transparent 70%)' }}
      />
    </div>
  )
}

function Orb({
  color,
  size,
  start,
  path,
  duration,
}: {
  color: string
  size: number
  start: React.CSSProperties
  path?: { x: number[]; y: number[] }
  duration: number
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        ...start,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        filter: 'blur(28px)',
      }}
      animate={path}
      transition={path ? { duration, ease: 'easeInOut', repeat: Infinity } : undefined}
    />
  )
}

const SPARKLES = [
  { top: '22%', left: '18%', size: 6, dur: 6, delay: 0 },
  { top: '30%', left: '78%', size: 5, dur: 7, delay: 1.2 },
  { top: '68%', left: '28%', size: 7, dur: 8, delay: 0.6 },
  { top: '60%', left: '70%', size: 5, dur: 6.5, delay: 1.8 },
  { top: '44%', left: '50%', size: 4, dur: 7.5, delay: 0.9 },
]
