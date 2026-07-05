'use client'

/* ──────────────────────────────────────────────────────────────────────
 * Scroll-reveal primitives for the marketing pages.
 *
 * <Reveal>      — single element that blurs + lifts into place on scroll.
 * <RevealGroup> — staggers its <RevealItem> children in sequence.
 *
 * All respect prefers-reduced-motion (render final state, no transform).
 * ────────────────────────────────────────────────────────────────────── */

import {
  motion,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = true,
  once = true,
  className,
  ...rest
}: {
  children: ReactNode
  delay?: number
  y?: number
  blur?: boolean
  once?: boolean
  className?: string
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div className={className} {...(rest as any)}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: blur ? 'blur(10px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

export function RevealGroup({
  children,
  className,
  once = true,
}: {
  children: ReactNode
  className?: string
  once?: boolean
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '0px 0px -8% 0px' }}
    >
      {children}
    </motion.div>
  )
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE },
  },
}

export function RevealItem({
  children,
  className,
  ...rest
}: {
  children: ReactNode
  className?: string
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div className={className} {...(rest as any)}>
        {children}
      </div>
    )
  }
  return (
    <motion.div className={className} variants={itemVariants} {...rest}>
      {children}
    </motion.div>
  )
}
