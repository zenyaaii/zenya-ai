'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * HeroWordmark — a giant Arabic "زينيا" set behind the hero copy.
 *
 * Two stacked copies of the word:
 *   • base   — barely-there ghost, always present (the word is "hidden" by
 *              default, just a faint shape in the background).
 *   • reveal — a brighter gradient copy clipped to a soft radial spotlight
 *              that follows the cursor, so the wordmark only lights up
 *              *where the mouse is* — "appears a little bit" on hover.
 *
 * Everything is driven imperatively through refs (no React state) so moving
 * the mouse never triggers a re-render — the spotlight stays buttery and the
 * cursor position is never reset by a render. Pointer-events: none so it can
 * never steal clicks from the hero CTAs. Disabled on touch / reduced-motion
 * (the base ghost still renders).
 *
 * REQUIRES a positioned parent (the hero <section> is `relative`).
 */
export default function HeroWordmark() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduce) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const root = rootRef.current
    const reveal = revealRef.current
    const parent = root?.parentElement
    if (!root || !reveal || !parent) return

    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      root.style.setProperty('--mx', `${x}%`)
      root.style.setProperty('--my', `${y}%`)
      root.style.setProperty('--reveal', '0.55')
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

  const SIZE = 'clamp(150px, 26vw, 400px)'

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-[5] flex items-center justify-center overflow-hidden [--mx:50%] [--my:38%] [--reveal:0]"
    >
      {/* Base ghost — the word is there but almost invisible. */}
      <span
        className="display-ar select-none whitespace-nowrap leading-none text-foreground"
        style={{ fontSize: SIZE, opacity: 0.04, letterSpacing: '-0.02em' }}
      >
        زينيا
      </span>

      {/* Spotlight reveal — same word, brighter, clipped to a radius around
          the cursor. Opacity is toggled imperatively on mousemove/leave. */}
      {!reduce && (
        <span
          ref={revealRef}
          className="gradient-text display-ar absolute select-none whitespace-nowrap leading-none transition-opacity duration-500"
          style={{
            fontSize: SIZE,
            letterSpacing: '-0.02em',
            opacity: 'var(--reveal)',
            WebkitMaskImage:
              'radial-gradient(circle 210px at var(--mx) var(--my), #000 0%, rgba(0,0,0,0.55) 38%, transparent 72%)',
            maskImage:
              'radial-gradient(circle 210px at var(--mx) var(--my), #000 0%, rgba(0,0,0,0.55) 38%, transparent 72%)',
          }}
        >
          زينيا
        </span>
      )}
    </div>
  )
}
