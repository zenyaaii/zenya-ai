'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

type Props = {
  /** Diameter of the glow in px. */
  size?: number
  /** Glow color (rgba recommended for softness). */
  color?: string
  /** CSS mix-blend-mode for the overlay. */
  blend?: React.CSSProperties['mixBlendMode']
}

/**
 * CursorGlow — soft halo that follows the cursor within its parent.
 *
 * REQUIRES the parent element to have `position: relative` (or any non-static
 * position) so absolute positioning is contained. The glow is `pointer-events-none`
 * and `-z-10` so it sits behind content. Hidden entirely on touch devices and
 * when the user prefers reduced motion.
 *
 * Use one per section, scoped to the hero specifically. Avoid stacking.
 */
export default function CursorGlow({
  size = 480,
  color = 'rgba(94,106,210,0.22)',
  blend = 'multiply',
}: Props) {
  const reduceMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Spring-smoothed motion values — feel premium, not jittery.
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const sx = useSpring(x, { stiffness: 90, damping: 22, mass: 0.55 })
  const sy = useSpring(y, { stiffness: 90, damping: 22, mass: 0.55 })

  useEffect(() => {
    if (reduceMotion) return
    if (typeof window === 'undefined') return
    // Skip touch / coarse pointer devices (mobile, tablet)
    if (window.matchMedia('(pointer: coarse)').matches) return

    const parent = ref.current?.parentElement
    if (!parent) return

    setEnabled(true)

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      x.set(e.clientX - rect.left - size / 2)
      y.set(e.clientY - rect.top - size / 2)
    }
    const onLeave = () => {
      // Park it off-screen so it fades out via the spring
      x.set(-9999)
      y.set(-9999)
    }

    parent.addEventListener('mousemove', onMove)
    parent.addEventListener('mouseleave', onLeave)
    return () => {
      parent.removeEventListener('mousemove', onMove)
      parent.removeEventListener('mouseleave', onLeave)
    }
  }, [reduceMotion, size, x, y])

  if (reduceMotion) return <div ref={ref} aria-hidden style={{ display: 'none' }} />

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute -z-10 rounded-full blur-3xl will-change-transform"
      style={{
        x: sx,
        y: sy,
        width: size,
        height: size,
        background: color,
        mixBlendMode: blend,
        opacity: enabled ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}
    />
  )
}
