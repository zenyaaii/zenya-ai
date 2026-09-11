'use client'

/* ────────────────────────────────────────────────────────────────────── *
 * PreviewFrame — renders the live theme preview inside an <iframe> so the  *
 * responsive device toggle shows the *real* mobile/tablet layout.          *
 *                                                                          *
 * Why an iframe at all: the themes are styled with Tailwind viewport       *
 * breakpoints (`sm:` / `md:` / `lg:`). Those respond to the viewport       *
 * width, not a container width — so narrowing a <div> would show a         *
 * squished desktop layout, not the mobile one. An iframe has its own       *
 * viewport, so the breakpoints fire correctly at the device width.         *
 *                                                                          *
 * EVERY DEVICE RENDERS AT ITS TRUE WIDTH, AND SCALES TO FIT. The frame     *
 * used to be `width: <device>; max-width: 100%`, which silently squeezed    *
 * it: on an iPad in landscape the stage is ~730px, so "desktop" showed the  *
 * theme's tablet layout and "tablet" (834) was squashed below 834. Now the  *
 * iframe's own viewport is always the device's width — desktop is the      *
 * stage width but never narrower than DESKTOP_MIN — and when that is wider  *
 * than the stage the iframe is scaled down with a transform. Breakpoints    *
 * fire at the real width; only the picture is smaller.                      *
 *                                                                          *
 * Design notes:                                                            *
 *  - A SEPARATE React root is mounted inside the iframe (createRoot). React *
 *    attaches its event system to that root's document, so onClick /       *
 *    accordions / view switches inside the theme keep working. A           *
 *    cross-document portal would silently swallow those events.            *
 *  - The iframe has a FIXED height (fills the stage) and scrolls           *
 *    INTERNALLY. Themes use viewport heights (`h-screen`, `min-h-[90vh]`);  *
 *    auto-growing the iframe to its content would make those grow the       *
 *    iframe, which grows them again — a grow-forever loop.                 *
 *  - framer-motion's `whileInView` can't fire across the iframe boundary, so  *
 *    we force reduced-motion (below) — every reveal renders in its final,     *
 *    visible state regardless of scroll, which is what an editor wants.       *
 *  - Each effect run owns + tears down its own root/observers, so React 18  *
 *    Strict Mode's dev double-invoke ends on a single live root.           *
 *                                                                          *
 * Tailwind/global CSS lives in the parent document, so we clone the head   *
 * <style>/<link> tags into the iframe (and keep them in sync through HMR). *
 * ────────────────────────────────────────────────────────────────────── */

import { startTransition, useEffect, useRef, useState, type ReactNode } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import { createRoot, type Root } from 'react-dom/client'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

export const DEVICE_WIDTH: Record<PreviewDevice, number | null> = {
  desktop: null, // the stage width, never below DESKTOP_MIN
  tablet: 834,
  mobile: 390,
}

/** A framed phone or tablet is never TALLER than the screen it stands for.
 *  Scaled down to fit a narrow stage, a frame whose viewport ran the stage's
 *  whole height made every 100vh hero grow past the device it claimed to be:
 *  at 834x1112 the "tablet" was 1500px tall. Desktop has no fixed height. */
export const DEVICE_HEIGHT: Record<PreviewDevice, number | null> = {
  desktop: null,
  tablet: 1112,
  mobile: 844,
}

/** The narrowest a "desktop" preview renders. Tailwind's `lg` — below it a
 *  theme is in its tablet layout, which is not what the desktop button says. */
export const DESKTOP_MIN = 1024

/** The stage's inner margin around a framed device, in CSS px. */
const PAD = 12

function syncHeadStyles(src: Document, dest: Document) {
  // Re-clone the parent's stylesheets into the iframe head. Head <style>/<link>
  // churn is rare (essentially HMR in dev), so re-cloning wholesale is cheap.
  dest.querySelectorAll('[data-zenya-style-clone]').forEach((n) => n.remove())
  const base = dest.getElementById('zenya-base')
  const frag = dest.createDocumentFragment()
  src.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => {
    const clone = n.cloneNode(true) as HTMLElement
    clone.setAttribute('data-zenya-style-clone', '')
    frag.appendChild(clone)
  })
  // Insert before our base/section nodes so theme overrides + section styles win.
  if (base) dest.head.insertBefore(frag, base)
  else dest.head.appendChild(frag)
}

/**
 * Device pixels per CSS pixel: the display's own ratio times the root zoom
 * ZoomLock writes. Snapping against this is what makes a rounded length
 * whole where it is actually rasterised rather than where it is declared.
 * One on the server, where there is no window and nothing to rasterise.
 */
function pxGrid(): number {
  if (typeof window === 'undefined') return 1
  const dpr = window.devicePixelRatio || 1
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1
  return Math.max(1, dpr * zoom)
}

export default function PreviewFrame({
  device,
  sectionStylesCss,
  preview,
  onReady,
  fullBleed = false,
}: {
  device: PreviewDevice
  sectionStylesCss?: string
  /**
   * The theme element, rendered into the iframe's own React root.
   *
   * PASS A MEMOISED ELEMENT. The iframe root re-renders when — and only
   * when — this changes identity. It used to be a render callback invoked
   * from an effect with no dependency array, so the customer's ENTIRE site
   * re-rendered on every parent render: every keystroke, every autosave
   * status change, and a "saved Xs ago" ticker every 15 seconds while the
   * editor sat idle. The callers now build this with useMemo over exactly
   * the state the preview reads.
   */
  preview: ReactNode
  /** Fires once the iframe document + element are ready (for the overlay). */
  onReady?: (doc: Document, iframe: HTMLIFrameElement) => void
  /** On phones the device IS the device — drop the simulated frame and let
   *  the iframe fill its container edge-to-edge, ignoring the device width. */
  fullBleed?: boolean
}) {
  const t = useT()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<Root | null>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const previewRef = useRef(preview)
  previewRef.current = preview
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  // The stage's size in CSS px. clientWidth is layout size, unaffected by the
  // root zoom and by transforms, which is the unit the frame is sized in.
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const read = () => setBox((b) => {
      const w = el.clientWidth, h = el.clientHeight
      return b && b.w === w && b.h === h ? b : { w, h }
    })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Set up the iframe document + its own React root. Each effect run owns and
  // tears down its own root/observers, so React 18 Strict Mode's double-invoke
  // (dev) ends with a single live root rather than an orphaned/unmounted one.
  useEffect(() => {
    const iframe = iframeRef.current
    const d = iframe?.contentDocument
    if (!iframe || !d || !d.body) return

    // Mirror the parent document's direction + language into the iframe so the
    // preview renders exactly like the published (Arabic-first, RTL) site.
    const rootDir = document.documentElement.getAttribute('dir') || 'rtl'
    const rootLang = document.documentElement.getAttribute('lang') || 'ar'
    d.documentElement.setAttribute('dir', rootDir)
    d.documentElement.setAttribute('lang', rootLang)

    // Clear any prior setup left in this (reused) document.
    d.querySelectorAll('#zenya-base,#zenya-section-styles,#zenya-root,[data-zenya-style-clone]')
      .forEach((n) => n.remove())

    const base = d.createElement('style')
    base.id = 'zenya-base'
    // Make <body> an explicit, definite-height scroll container so content
    // taller than the (fixed) iframe viewport scrolls — independent of how a
    // given engine resolves the document's own scrolling element. `100vh`
    // still resolves to the iframe element height, so viewport-height heroes
    // stay one screen tall.
    base.textContent =
      'html{height:100%;margin:0;padding:0;}' +
      'body{height:100%;margin:0;padding:0;overflow-x:hidden;overflow-y:auto;background:transparent;}' +
      '*{box-sizing:border-box;}' +
      '::-webkit-scrollbar{width:9px;height:9px}' +
      '::-webkit-scrollbar-thumb{background:rgba(0,0,0,.2);border-radius:8px}'
    d.head.appendChild(base)

    const section = d.createElement('style')
    section.id = 'zenya-section-styles'
    d.head.appendChild(section)

    syncHeadStyles(document, d)
    const headObs = new MutationObserver(() => syncHeadStyles(document, d))
    headObs.observe(document.head, { childList: true, subtree: true })

    // Themes gate their scroll-reveal animations on `useReducedMotion()`.
    // Inside an iframe, framer-motion's IntersectionObserver (created in this
    // parent realm) can't observe nodes across the document boundary, so
    // `whileInView` never fires and revealed content would be stuck invisible.
    // Forcing reduced-motion makes every theme render its static, fully-visible
    // state — the correct behavior for an editing preview. We intercept only the
    // reduced-motion media query and restore on unmount; published sites (which
    // don't go through PreviewFrame) keep their animations.
    const origMatchMedia = window.matchMedia
    const patchedMatchMedia = function (q: string): MediaQueryList {
      if (typeof q === 'string' && q.includes('prefers-reduced-motion')) {
        return {
          matches: true, media: q, onchange: null,
          addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {}, dispatchEvent() { return false },
        } as unknown as MediaQueryList
      }
      return origMatchMedia.call(window, q)
    } as typeof window.matchMedia
    window.matchMedia = patchedMatchMedia

    const mountEl = d.createElement('div')
    mountEl.id = 'zenya-root'
    d.body.appendChild(mountEl)
    const root = createRoot(mountEl)
    rootRef.current = root
    root.render(previewRef.current)

    setDoc(d)
    onReadyRef.current?.(d, iframe)

    return () => {
      headObs.disconnect()
      if (window.matchMedia === patchedMatchMedia) window.matchMedia = origMatchMedia
      if (rootRef.current === root) rootRef.current = null
      setTimeout(() => { try { root.unmount() } catch {} ; mountEl.remove() }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render the iframe root when the preview element changes — content
  // edits, preset/typography/colour changes, view switches — and at no other
  // time.
  //
  // AS A TRANSITION, NOT A SYNC UPDATE. A keystroke is a discrete event, and
  // React 18 flushes the passive effects of a discrete update synchronously,
  // so a plain root.render() here inherited the keystroke's sync priority and
  // rendered the whole theme inside the same task as the keypress. Marked as
  // a transition, the theme renders after the field has painted, can yield,
  // and a newer keystroke's render supersedes an unfinished older one instead
  // of queueing behind it. The field never waits for the site.
  useEffect(() => {
    const root = rootRef.current
    if (!doc || !root) return
    startTransition(() => { root.render(preview) })
  }, [doc, preview])

  // Keep per-section style overrides in sync.
  useEffect(() => {
    if (!doc) return
    const s = doc.getElementById('zenya-section-styles')
    if (s) s.textContent = sectionStylesCss || ''
  }, [doc, sectionStylesCss])

  // ── Geometry. Nothing here animates: switching device is instant, because
  //    tweening the width of a live site re-lays it out on every frame. ────
  const availW = box ? Math.max(0, box.w - (fullBleed ? 0 : PAD * 2)) : 0
  const availH = box ? Math.max(0, box.h - (fullBleed ? 0 : PAD * 2)) : 0
  // Until the stage has been measured there is nothing to fit, and a scale of
  // 0/0 would size the iframe NaN; it stays at scale 1, unseen, for the one
  // frame that takes.
  const measured = availW > 0 && availH > 0
  const fixed = DEVICE_WIDTH[device]
  const devW = fullBleed ? availW : (fixed ?? Math.max(availW, DESKTOP_MIN))
  /**
   * THE SCALE IS DERIVED FROM A WHOLE-DEVICE-PIXEL FRAME, not the other way
   * round, and that ordering is the whole point.
   *
   * Before, the scale was the raw ratio and the frame was Math.floor of it.
   * So the container was a whole CSS pixel wide while the iframe inside it
   * was scaled by the unfloored ratio: the two disagreed by up to a pixel,
   * which showed as a soft seam down the edge of the preview, and the
   * customer's whole site was resampled at an arbitrary fraction.
   *
   * Snapping the frame in DEVICE space and deriving the scale from it makes
   * the container and the scaled iframe agree exactly, and puts the
   * preview's edges on the pixel grid. Device space, not CSS space, because
   * ZoomLock renders the document at 0.85 and a whole CSS pixel is not a
   * whole device pixel under it.
   */
  const rawScale = fullBleed || !measured ? 1 : Math.min(1, availW / devW)
  const grid = pxGrid()
  const snapW = (v: number) => Math.max(1, Math.floor(v * grid) / grid)
  const frameW = fullBleed ? 0 : snapW(devW * rawScale)
  const scale = fullBleed || !measured ? 1 : frameW / devW
  const capH = fullBleed ? null : DEVICE_HEIGHT[device]
  const iframeH = Math.min(scale < 1 ? availH / scale : availH, capH ?? Infinity)
  const frameH = fullBleed ? 0 : snapW(iframeH * scale)

  return (
    <div ref={wrapRef} className="ze-frame-wrap" data-bleed={fullBleed ? '' : undefined}>
      <div
        className="ze-frame"
        data-device={fullBleed ? 'bleed' : device}
        data-scale={scale.toFixed(3)}
        style={fullBleed
          ? { width: '100%', height: '100%' }
          : { width: frameW, height: frameH, visibility: measured ? undefined : 'hidden' }}
      >
        <iframe
          ref={iframeRef}
          title={t.editor.previewTitle}
          style={fullBleed
            ? { width: '100%', height: '100%' }
            : { width: devW, height: iframeH, transform: scale < 1 ? `scale(${scale})` : undefined }}
        />
      </div>
    </div>
  )
}
