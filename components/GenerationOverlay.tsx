'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

/**
 * GenerationOverlay — the "building" animation shown while a theme is being
 * generated. Every section of the form appears to fold inward and *mix* into a
 * single glowing dot at the center of the screen, which then breathes while the
 * AI works. Status copy cycles underneath so the wait feels alive.
 *
 * It's intentionally self-contained and theme-agnostic so it can front any
 * generator (wellness wizard, one-product /build, future templates) — and so
 * the whole thing can be swapped for a bespoke animation later by replacing
 * this one file.
 *
 * Under prefers-reduced-motion it collapses to a calm pulsing dot + label.
 */

// Shards start spread across the viewport and converge on the center — each one
// a fragment of the "sections" being mixed together. Positions are fixed (not
// random) so it reads the same every run.
const SHARDS: Array<{ x: number; y: number; hue: string; delay: number; size: number }> = [
  { x: -260, y: -150, hue: '#5e6ad2', delay: 0.0,  size: 46 },
  { x:  240, y: -180, hue: '#7170ff', delay: 0.12, size: 38 },
  { x: -300, y:   90, hue: '#b9b8ff', delay: 0.24, size: 30 },
  { x:  300, y:  120, hue: '#4f5ab8', delay: 0.06, size: 52 },
  { x:  -90, y: -230, hue: '#7170ff', delay: 0.3,  size: 34 },
  { x:  140, y:  220, hue: '#5e6ad2', delay: 0.18, size: 42 },
  { x: -210, y:  210, hue: '#b9b8ff', delay: 0.36, size: 28 },
  { x:  330, y:  -40, hue: '#5e6ad2', delay: 0.42, size: 36 },
  { x: -340, y:  -30, hue: '#7170ff', delay: 0.48, size: 44 },
  { x:   60, y: -250, hue: '#4f5ab8', delay: 0.54, size: 32 },
]

const DEFAULT_MESSAGES = [
  'نمزج أقسام موقعك معًا…',
  'نصوغ النصوص بالذكاء الاصطناعي…',
  'ننسّق الألوان والخطوط…',
  'نرتّب الصفحات والمعرض…',
  'نضيف اللمسات الأخيرة…',
]

export default function GenerationOverlay({
  open,
  title = 'جارٍ بناء موقعك',
  messages = DEFAULT_MESSAGES,
}: {
  open: boolean
  title?: string
  messages?: string[]
}) {
  const reduce = useReducedMotion()
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!open) { setMsgIndex(0); return }
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 2200)
    return () => clearInterval(id)
  }, [open, messages.length])

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'rgba(10,10,14,0.86)', backdropFilter: 'blur(14px)' }}
          role="status"
          aria-live="polite"
        >
          {/* The mixing field */}
          <div className="relative flex h-[320px] w-[320px] items-center justify-center">
            {/* Converging shards (skipped under reduced motion) */}
            {!reduce && SHARDS.map((s, i) => (
              <motion.span
                key={i}
                className="absolute rounded-2xl"
                style={{
                  width: s.size,
                  height: s.size,
                  background: `linear-gradient(135deg, ${s.hue}, rgba(255,255,255,0.18))`,
                  boxShadow: `0 0 24px ${s.hue}66`,
                }}
                initial={{ x: s.x, y: s.y, scale: 1, opacity: 0, borderRadius: 16, rotate: 0 }}
                animate={{
                  x: 0, y: 0,
                  scale: [1, 1, 0.12],
                  opacity: [0, 1, 0],
                  borderRadius: ['16px', '16px', '50%'],
                  rotate: [0, 25, 0],
                }}
                transition={{
                  duration: 1.9,
                  delay: s.delay,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: [0.5, 0, 0.2, 1],
                }}
              />
            ))}

            {/* The dot the sections mix into — a breathing brand orb. */}
            <motion.div
              className="relative h-24 w-24 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #b9b8ff, #5e6ad2 55%, #4f5ab8 100%)',
                boxShadow: '0 0 60px rgba(94,106,210,0.65), 0 0 120px rgba(94,106,210,0.35)',
              }}
              animate={reduce ? { opacity: [0.7, 1, 0.7] } : { scale: [1, 1.12, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Inner sheen */}
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle at 70% 75%, rgba(255,255,255,0.0), rgba(255,255,255,0.25))' }}
              />
            </motion.div>

            {/* Halo ring */}
            {!reduce && (
              <motion.span
                className="absolute rounded-full"
                style={{ width: 160, height: 160, border: '1px solid rgba(185,184,255,0.35)' }}
                animate={{ scale: [0.8, 1.25], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </div>

          <h2 className="mt-6 text-center text-xl font-extrabold tracking-tight text-white">
            {title}
          </h2>

          <div className="relative mt-2 h-6 w-full max-w-sm overflow-hidden text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-sm text-white/70"
              >
                {messages[msgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
