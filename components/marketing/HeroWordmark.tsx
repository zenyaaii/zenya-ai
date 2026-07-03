'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import ZenyaMark from '@/components/ZenyaMark'

/**
 * HeroWordmark — the giant زينيا logo mark set behind the hero copy.
 *
 * Two stacked copies of the vector wordmark ({@link ZenyaMark}):
 *   • base   — a barely-there blue ghost, always present.
 *   • reveal — a brighter blue copy clipped to a soft radial spotlight that
 *              follows the cursor, so the mark only lights up *where the mouse
 *              is*.
 *
 * Driven imperatively through refs (no React state) so moving the mouse never
 * triggers a re-render — the spotlight stays buttery. Pointer-events: none so it
 * never steals clicks from the hero CTAs. Disabled on touch / reduced-motion
 * (the base ghost still renders).
 *
 * REQUIRES a positioned parent (the hero <section> is `relative`).
 */
export default function HeroWordmark() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const root = rootRef.current
    const parent = root?.parentElement
    if (!root || !parent) return

    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      root.style.setProperty('--mx', `${x}%`)
      root.style.setProperty('--my', `${y}%`)
      root.style.setProperty('--reveal', '0.32')
    }
    const onLeave = () => {
      root.style.setProperty('--reveal', '0')
    }

    parent.addEventListener('mousemove', onMove)
    parent.addEventListener('mouseleave', onLeave)
    return () => {
      parent.removeEventListener('mousemove', onMove)
      parent.removeEventListener('mouseleave', onLeave)
    }
  }, [reduce])

  const WIDTH = 'clamp(340px, 72vw, 1040px)'

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-[5] flex items-center justify-center overflow-hidden [--mx:50%] [--my:38%] [--reveal:0]"
    >
      {/* Base ghost — the mark is there but almost invisible. Kept very faint
          per request so it never competes with the hero copy/constellation. */}
      <div className="select-none" style={{ width: WIDTH, opacity: 0.02 }}>
        <ZenyaMark className="!w-full text-[#5e6ad2]" />
      </div>

      {/* Spotlight reveal — same mark, brighter blue, clipped to a radius around
          the cursor. Opacity is toggled imperatively on mousemove/leave. */}
      {!reduce && (
        <div
          className="absolute select-none transition-opacity duration-500"
          style={{
            width: WIDTH,
            opacity: 'var(--reveal)',
            WebkitMaskImage:
              'radial-gradient(circle 230px at var(--mx) var(--my), #000 0%, rgba(0,0,0,0.55) 38%, transparent 72%)',
            maskImage:
              'radial-gradient(circle 230px at var(--mx) var(--my), #000 0%, rgba(0,0,0,0.55) 38%, transparent 72%)',
          }}
        >
          <ZenyaMark className="!w-full text-[#6b78ff]" />
        </div>
      )}
    </div>
  )
}
