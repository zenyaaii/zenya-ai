'use client'

import { useEffect } from 'react'

/**
 * ZoomLock — caps the app's BASE UI size on touch devices.
 *
 * The owner wanted a fixed maximum interface size on phones and iPads: the
 * dashboard should render at ~85% and not keep growing. PC and laptop screens
 * are left alone entirely.
 *
 * ── What this must NOT do: fight pinch-zoom ──────────────────────────────────
 * There are two different "zooms" on a phone and they behave in opposite ways:
 *
 *   • PINCH zoom  → visual-viewport only. The browser magnifies the rendered
 *     pixels and lets the reader pan around. Layout is untouched: nothing
 *     re-wraps, no section moves. This is the reader deliberately magnifying
 *     something to read it.
 *   • PAGE zoom / text-size setting → changes the layout viewport, so the page
 *     genuinely re-lays out and text re-wraps.
 *
 * An earlier version of this file read `visualViewport.scale` (pinch) and
 * responded by writing CSS `zoom` on the document — and CSS `zoom` REFLOWS.
 * So pinching to magnify made the whole page re-lay out and shrink instead:
 * sections rearranged and words re-wrapped under the reader's fingers, which is
 * the exact opposite of what pinch is supposed to do.
 *
 * So: pinch is never touched, and while the reader is pinched in we don't write
 * anything at all. Only the base page zoom is capped.
 */

// Rendered ceiling for the app UI on touch devices (0.85 = 85%).
const MAX_SCALE = 0.85
// Never shrink past this even at extreme zoom, so the UI stays usable.
const MIN_SCALE = 0.35

export default function ZoomLock() {
  useEffect(() => {
    const root = document.documentElement
    // Phones and iPads report a coarse primary pointer. A laptop — even a
    // touchscreen one — reports fine, which keeps the cap off desktop.
    const coarse = window.matchMedia('(pointer: coarse)')

    let raf = 0

    /**
     * PAGE zoom only. `outerWidth / innerWidth` grows as the layout viewport
     * shrinks under page zoom. `visualViewport.scale` is deliberately excluded:
     * that is pinch, and pinch is the reader's business.
     */
    function pageZoom(): number {
      const ratio = window.innerWidth ? window.outerWidth / window.innerWidth : 1
      return Number.isFinite(ratio) && ratio > 0 ? ratio : 1
    }

    /** True while the reader is pinched in — leave the page completely alone. */
    function isPinched(): boolean {
      return (window.visualViewport?.scale ?? 1) > 1.01
    }

    function apply() {
      // Non-touch (PC/laptop): never interfere, and clear anything we set.
      if (!coarse.matches) {
        ;(root.style as any).zoom = ''
        return
      }
      // Mid-pinch: don't write anything. Writing `zoom` here would reflow the
      // page while the reader is magnifying it.
      if (isPinched()) return

      const z = pageZoom()
      const css = z > MAX_SCALE
        ? Math.max(MIN_SCALE, Math.min(MAX_SCALE, MAX_SCALE / z))
        : ''
      ;(root.style as any).zoom = css === '' ? '' : String(css)
    }

    function onResize() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }

    apply()
    // NOTE: only window resize. `visualViewport`'s resize/scroll events fire
    // continuously during a pinch — subscribing to them is what caused the
    // page to re-lay out mid-gesture.
    window.addEventListener('resize', onResize)
    coarse.addEventListener?.('change', apply)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      coarse.removeEventListener?.('change', apply)
      ;(root.style as any).zoom = ''
    }
  }, [])

  return null
}
