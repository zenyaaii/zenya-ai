'use client'

import { useEffect } from 'react'

/**
 * ZoomLock — caps the BASE UI size on EVERY browser and device, for every
 * Zenya-owned surface (the marketing site AND the dashboard). Mounted once at
 * the root layout; customer-generated sites are excluded there.
 *
 * The owner wanted a fixed maximum interface size everywhere — phones, tablets,
 * laptops and desktops, in every browser (Chrome, Safari, Firefox, Edge): the
 * page should render at ~85% and never keep growing when the user zooms the
 * browser.
 *
 * ── The behaviour the owner asked for (Apple-style) ──────────────────────────
 * On Apple's site, zooming in Safari magnifies the page as one piece — the
 * layout never reflows, elements never resize; you just pan around a bigger
 * picture ("zoom with your hands"). That is PINCH zoom, and it must keep
 * working untouched. What the owner does NOT want is the browser's PAGE zoom /
 * text-size reflowing the layout so buttons and text grow and re-wrap. This
 * component neutralises PAGE zoom (holding the render at 85%) while leaving
 * PINCH zoom completely alone.
 *
 * ── The two "zooms", and why we only cancel one ──────────────────────────────
 *   • PINCH zoom  → visual-viewport only. The browser magnifies the rendered
 *     pixels and lets the reader pan around. Layout is untouched: nothing
 *     re-wraps, no section moves. This is the reader deliberately magnifying
 *     something to read it. On a trackpad/desktop, pinch is reported as page
 *     zoom instead, so it is locked too — which is what the owner wants.
 *   • PAGE zoom / text-size setting → changes the layout viewport, so the page
 *     genuinely re-lays out and text re-wraps. This is the one we cancel.
 *
 * `outerWidth / innerWidth` is a clean page-zoom proxy in every browser:
 * `outerWidth` (the OS window) is fixed while zooming, and `innerWidth` (the CSS
 * viewport) shrinks as the user zooms in — so the ratio grows purely with zoom.
 * Dragging the window smaller shrinks both together, so a resize does NOT
 * trigger a false cap. `visualViewport.scale` (pinch) is deliberately excluded.
 *
 * An earlier version read `visualViewport.scale` (pinch) and wrote CSS `zoom`
 * in response — and CSS `zoom` REFLOWS. So pinching to magnify re-laid out and
 * shrank the page under the reader's fingers, the exact opposite of pinch. So:
 * pinch is never touched, and while the reader is pinched in we write nothing.
 */

// Rendered ceiling for the UI (0.85 = 85%). This is also the base render size.
const MAX_SCALE = 0.85
// Never shrink past this even at extreme zoom, so the UI stays usable.
const MIN_SCALE = 0.35

export default function ZoomLock() {
  useEffect(() => {
    const root = document.documentElement

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
      // Mid-pinch (touch): don't write anything. Writing `zoom` here would
      // reflow the page while the reader is magnifying it.
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
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      ;(root.style as any).zoom = ''
    }
  }, [])

  return null
}
