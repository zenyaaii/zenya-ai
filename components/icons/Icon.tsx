'use client'

import { motion, type Variants } from 'framer-motion'
import { resolveIcon, resolveIconKey } from './registry'
import { ANIMATED_KEYS, AnimatedIcon } from './animated'

export type IconAnimation =
  | 'none'   // no motion
  | 'draw'   // fade + scale in on scroll into view (default fallback)
  | 'pop'    // spring scale-in
  | 'spin'   // rotate + scale in
  | 'bounce' // drop + settle
  | 'float'  // gentle infinite bob
  | 'pulse'  // soft infinite breathing

/** Entrance/idle motion presets for the wrapper (fallback icons only). */
const ENTRANCE: Record<IconAnimation, Variants | undefined> = {
  none: undefined,
  draw: {
    hidden: { opacity: 0, scale: 0.6 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.4 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 15 } },
  },
  spin: {
    hidden: { opacity: 0, scale: 0.5, rotate: -90 },
    show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 16 } },
  },
  bounce: {
    hidden: { opacity: 0, y: -14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 12 } },
  },
  float: {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      y: [0, -5, 0],
      transition: {
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  pulse: {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: [1, 1.08, 1],
      transition: {
        opacity: { duration: 0.4 },
        scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
}

export interface IconProps {
  /** Semantic name, alias, or raw lucide name. Falls back gracefully. */
  name?: string | null
  size?: number | string
  strokeWidth?: number
  className?: string
  /** Colour for the glyph. Defaults to currentColor. */
  color?: string
  /**
   * Fallback-only entrance animation (used when no per-icon animation exists).
   * Default: 'draw'.
   */
  animation?: IconAnimation
  /** Springy hover on fallback icons. Default: true. */
  hover?: boolean
  /** Accessible label; when omitted the icon is aria-hidden (decorative). */
  title?: string
  /**
   * Force the fallback wrapper even when an animated version exists.
   * Useful for tiny/static contexts.
   */
  static?: boolean
}

/**
 * The one icon component used everywhere. When the name maps to a
 * hand-choreographed animated icon, that plays its own parts on hover;
 * otherwise the whole glyph gets a tasteful wrapper animation. Never blank.
 */
export function Icon({
  name,
  size = 24,
  strokeWidth = 2,
  className,
  color,
  animation = 'draw',
  hover = true,
  title,
  static: forceStatic,
}: IconProps) {
  // Prefer a per-icon animated version (bell swings, gear spins, …).
  if (!forceStatic) {
    const key = resolveIconKey(name)
    if (key && ANIMATED_KEYS.has(key)) {
      return (
        <AnimatedIcon name={key} size={size} strokeWidth={strokeWidth} className={className} color={color} title={title} />
      )
    }
  }

  // Fallback: whole-glyph wrapper animation over a lucide icon.
  const Glyph = resolveIcon(name)
  const variants = ENTRANCE[animation]
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-flex', color, lineHeight: 0 }}
      variants={variants}
      initial={variants ? 'hidden' : undefined}
      whileInView={variants ? 'show' : undefined}
      viewport={{ once: true, amount: 0.4 }}
      whileHover={hover ? { scale: 1.14, rotate: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <Glyph size={size} strokeWidth={strokeWidth} />
    </motion.span>
  )
}

export default Icon
