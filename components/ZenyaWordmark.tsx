'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Animated Arabic brand wordmark — زينيا.
 *
 * Arabic letters connect, so splitting the word into per-letter spans would
 * break the ligatures and look broken. Instead we keep the word whole and
 * reveal it right-to-left (Arabic reading order) so each letter emerges in
 * sequence, while the brand indigo→violet gradient shines through it
 * continuously (see `.wordmark-ar` in globals.css). A soft lift on hover keeps
 * it feeling alive. Fully static under prefers-reduced-motion.
 *
 * Use everywhere the brand name appears in chrome (navbar, footer, sidebar,
 * auth). Pass a Tailwind text-size via `className`.
 */
export default function ZenyaWordmark({
  className,
  delay = 0,
}: {
  className?: string
  /** Stagger the reveal when several mount together (rare). */
  delay?: number
}) {
  const reduce = useReducedMotion()

  return (
    <motion.span
      dir="rtl"
      aria-label="زينيا"
      className={cn(
        'wordmark-ar inline-block select-none font-extrabold leading-[1.35] tracking-tight',
        className
      )}
      // Reveal the connected word from its right edge leftward — letters appear
      // one after another in Arabic reading order. Negative top/bottom insets
      // keep diacritics and tall letters from being clipped mid-reveal.
      initial={reduce ? false : { clipPath: 'inset(-15% 0% -15% 100%)', opacity: 0 }}
      animate={{ clipPath: 'inset(-15% 0% -15% 0%)', opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={reduce ? undefined : { scale: 1.05 }}
    >
      زينيا
    </motion.span>
  )
}
