'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

/**
 * Marketing pages where Lenis smooth scroll is active. App/auth/wizard surfaces
 * (dashboard, theme/new/*, settings, etc.) intentionally use native scroll —
 * form-heavy pages feel weird with virtual scroll, and modals/sticky elements
 * can fight with it.
 */
const MARKETING_PATHS = new Set<string>([
  '/',
  '/pricing',
  '/themes',
  '/contact',
  '/terms',
  '/privacy',
])

/**
 * SmoothScroll — wraps Lenis as a single mountable layer in the root layout.
 *
 * - Only activates on marketing routes (see MARKETING_PATHS).
 * - Disabled entirely under `prefers-reduced-motion: reduce`.
 * - Cleans up its rAF loop on route change.
 * - Renders nothing; it's a pure side-effect component.
 */
export default function SmoothScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!MARKETING_PATHS.has(pathname)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      // Classic ease-out-expo: punchy at the start, settles softly.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [pathname])

  return null
}
