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
 * Design notes:                                                            *
 *  - A SEPARATE React root is mounted inside the iframe (createRoot). React *
 *    attaches its event system to that root's document, so onClick /       *
 *    accordions / view switches inside the theme keep working. A           *
 *    cross-document portal would silently swallow those events.            *
 *  - The iframe has a FIXED height (fills the pane) and scrolls INTERNALLY.   *
 *    Themes use viewport heights (`h-screen`, `min-h-[90vh]`); auto-growing   *
 *    the iframe to its content would make those grow the iframe, which grows  *
 *    them again — a grow-forever loop. A fixed viewport keeps `100vh` stable. *
 *  - framer-motion's `whileInView` can't fire across the iframe boundary, so  *
 *    we force reduced-motion (below) — every reveal renders in its final,     *
 *    visible state regardless of scroll, which is what an editor wants.       *
 *  - Each effect run owns + tears down its own root/observers, so React 18  *
 *    Strict Mode's dev double-invoke ends on a single live root.           *
 *                                                                          *
 * Tailwind/global CSS lives in the parent document, so we clone the head   *
 * <style>/<link> tags into the iframe (and keep them in sync through HMR). *
 * Fonts + colors travel with the theme's own React tree.                   *
 * ────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

export const DEVICE_WIDTH: Record<PreviewDevice, number | null> = {
  desktop: null, // fill the pane
  tablet: 834,
  mobile: 390,
}

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

export default function PreviewFrame({
  device,
  sectionStylesCss,
  render,
  onReady,
}: {
  device: PreviewDevice
  sectionStylesCss?: string
  /** Renders the theme tree into the iframe's own React root. */
  render: (doc: Document) => ReactNode
  /** Fires once the iframe document + element are ready (for the overlay). */
  onReady?: (doc: Document, iframe: HTMLIFrameElement) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const rootRef = useRef<Root | null>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const renderRef = useRef(render)
  renderRef.current = render
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  // Set up the iframe document + its own React root. Each effect run owns and
  // tears down its own root/observers, so React 18 Strict Mode's double-invoke
  // (dev) ends with a single live root rather than an orphaned/unmounted one.
  useEffect(() => {
    const iframe = iframeRef.current
    const d = iframe?.contentDocument
    if (!iframe || !d || !d.body) return

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
    root.render(renderRef.current(d))

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

  // Re-render the iframe root whenever the parent re-renders (content edits,
  // preset/typography/color changes, view switches) so the preview stays live.
  useEffect(() => {
    if (doc && rootRef.current) rootRef.current.render(render(doc))
  })

  // Keep per-section style overrides in sync.
  useEffect(() => {
    if (!doc) return
    const s = doc.getElementById('zenya-section-styles')
    if (s) s.textContent = sectionStylesCss || ''
  }, [doc, sectionStylesCss])

  const width = DEVICE_WIDTH[device]
  const framed = width != null

  return (
    <div
      className="flex h-full w-full justify-center"
      style={{ padding: framed ? '24px 16px' : 0, alignItems: 'stretch' }}
    >
      <div
        style={{
          width: framed ? width : '100%',
          maxWidth: '100%',
          height: '100%',
          // Explicit flex-basis in px: with `auto`, the iframe's intrinsic size
          // leaks into the basis calc and the frame won't honor the device width.
          flex: framed ? `0 0 ${width}px` : '1 1 auto',
          borderRadius: framed ? 20 : 0,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: framed
            ? '0 24px 70px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)'
            : 'none',
          transition: 'width 0.25s ease',
        }}
      >
        {/* Fixed-height iframe that scrolls internally: the iframe's viewport
            height stays stable, so theme `100vh`/`min-h-screen` heroes resolve
            to one device viewport instead of feeding a grow-forever loop. */}
        <iframe
          ref={iframeRef}
          title="Theme preview"
          className="block h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  )
}
