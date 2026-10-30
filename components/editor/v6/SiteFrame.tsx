'use client'

/**
 * The customer's site, live, in an iframe of its own — the v6 editor's
 * viewport (#vp in the sample). The iframe set-up is PreviewFrame's, kept
 * whole: a separate React root inside the iframe so the template's own
 * clicks keep working, the parent's stylesheets cloned in, reduced motion
 * forced so every reveal renders in its final state, section styles in a
 * <style> of their own. What changed is the geometry: the stage works out
 * the device's width, height and scale (the sample's layoutCanvas) and this
 * only draws the iframe at that size.
 */

import { startTransition, useEffect, useRef, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

function syncHeadStyles(src: Document, dest: Document) {
  dest.querySelectorAll('[data-zenya-style-clone]').forEach((n) => n.remove())
  const base = dest.getElementById('zenya-base')
  const frag = dest.createDocumentFragment()
  src.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => {
    const clone = n.cloneNode(true) as HTMLElement
    clone.setAttribute('data-zenya-style-clone', '')
    frag.appendChild(clone)
  })
  if (base) dest.head.insertBefore(frag, base)
  else dest.head.appendChild(frag)
}

export default function SiteFrame({
  w, h, scale, preview, sectionStylesCss, onReady, title,
}: {
  w: number
  h: number
  scale: number
  /** PASS A MEMOISED ELEMENT: the iframe root re-renders when it changes identity. */
  preview: ReactNode
  sectionStylesCss?: string
  onReady?: (doc: Document, iframe: HTMLIFrameElement) => void
  title: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const rootRef = useRef<Root | null>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const previewRef = useRef(preview)
  previewRef.current = preview
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const iframe = iframeRef.current
    const d = iframe?.contentDocument
    if (!iframe || !d || !d.body) return
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

    d.documentElement.setAttribute('dir', document.documentElement.getAttribute('dir') || 'rtl')
    d.documentElement.setAttribute('lang', document.documentElement.getAttribute('lang') || 'ar')
    d.querySelectorAll('#zenya-base,#zenya-section-styles,#zenya-root,[data-zenya-style-clone]').forEach((n) => n.remove())

    const base = d.createElement('style')
    base.id = 'zenya-base'
    base.textContent =
      'html{height:100%;margin:0;padding:0;}' +
      'body{height:100%;margin:0;padding:0;overflow-x:hidden;overflow-y:auto;background:transparent;scrollbar-width:thin}' +
      '*{box-sizing:border-box;}' +
      // A map or video inside the site would swallow the click that picks its section.
      'html.zy-editing iframe{pointer-events:none}'
    d.head.appendChild(base)
    const section = d.createElement('style')
    section.id = 'zenya-section-styles'
    d.head.appendChild(section)

    syncHeadStyles(document, d)
    const headObs = new MutationObserver(() => syncHeadStyles(document, d))
    headObs.observe(document.head, { childList: true, subtree: true })
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
  }, [])

  // A keystroke renders the site as a transition, so the field never waits for it.
  useEffect(() => {
    const root = rootRef.current
    if (!doc || !root) return
    startTransition(() => { root.render(preview) })
  }, [doc, preview])

  useEffect(() => {
    if (!doc) return
    const s = doc.getElementById('zenya-section-styles')
    if (s) s.textContent = sectionStylesCss || ''
  }, [doc, sectionStylesCss])

  return (
    <iframe
      ref={iframeRef}
      title={title}
      className="site-if"
      style={{ width: w, height: h, transform: scale !== 1 ? `scale(${scale})` : undefined }}
    />
  )
}
