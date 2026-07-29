'use client'

/* ─────────────────────────────────────────────────────────────────────── *
 * Tap-to-edit overlay (touch)                                              *
 *                                                                          *
 * The phone editor's counterpart to ClickToEditOverlay. The theme preview  *
 * renders inside an <iframe>; here we:                                      *
 *   • draw a steady outline around the section currently being edited, so   *
 *     the user always sees what the open sheet maps to; and                 *
 *   • on TAP of any [data-section], briefly flash it and open that section  *
 *     in the sheet.                                                         *
 *                                                                          *
 * Touch devices synthesize a `click` after a tap, so we bind `click` (not   *
 * hover). Real buttons/links inside a section keep working — we bail if the  *
 * tap crosses an interactive element before reaching the section root.       *
 * ─────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'

type Rect = { top: number; left: number; width: number; height: number }

const INTERACTIVE_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL', 'OPTION', 'SUMMARY'])

function isInteractiveBetween(target: HTMLElement, sectionRoot: HTMLElement): boolean {
  let cur: HTMLElement | null = target
  while (cur && cur !== sectionRoot) {
    if (INTERACTIVE_TAGS.has(cur.tagName)) return true
    const role = cur.getAttribute('role')
    if (role === 'button' || role === 'link' || role === 'tab' || role === 'menuitem') return true
    if (cur.isContentEditable) return true
    cur = cur.parentElement
  }
  return false
}

export default function TapToEditOverlay({
  doc,
  iframe,
  selectedPanelId,
  onPick,
  panelToViews,
  currentView,
  onViewChange,
}: {
  doc: Document | null
  iframe: HTMLIFrameElement | null
  /** The section the sheet is currently editing — gets a steady outline. */
  selectedPanelId?: string
  onPick: (panelId: string) => void
  panelToViews?: Record<string, string[]>
  currentView?: string
  onViewChange?: (view: string) => void
}) {
  // Steady outline for the section being edited.
  const [selRect, setSelRect] = useState<Rect | null>(null)
  // Brief flash on the tapped section.
  const [flash, setFlash] = useState<Rect | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!doc || !iframe) return

    function parentRect(el: HTMLElement): Rect {
      const r = el.getBoundingClientRect()
      const f = iframe!.getBoundingClientRect()
      return { top: f.top + r.top, left: f.left + r.left, width: r.width, height: r.height }
    }

    function repositionSelected() {
      if (!selectedPanelId) { setSelRect(null); return }
      const el = doc!.querySelector(`[data-section="${cssEscape(selectedPanelId)}"]`) as HTMLElement | null
      setSelRect(el && el.isConnected ? parentRect(el) : null)
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (!target) return
      const sec = target.closest('[data-section]') as HTMLElement | null
      if (!sec) return
      if (isInteractiveBetween(target, sec)) return // let real buttons/links work
      const panelId = sec.getAttribute('data-section') || ''
      if (!panelId) return
      e.preventDefault()
      e.stopPropagation()

      const views = panelToViews?.[panelId]
      if (views && views.length && onViewChange && (!currentView || !views.includes(currentView))) {
        onViewChange(views[0])
      }

      // Flash the tapped section, then clear.
      setFlash(parentRect(sec))
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlash(null), 480)

      onPick(panelId)
    }

    const win = doc.defaultView
    doc.addEventListener('click', onClick, true)
    doc.addEventListener('scroll', repositionSelected, true)
    win?.addEventListener('scroll', repositionSelected, true)
    window.addEventListener('scroll', repositionSelected, true)
    window.addEventListener('resize', repositionSelected)

    repositionSelected()
    // The selected section can change height as the user edits its copy; keep
    // the outline glued to it with a light poll (cheap, and edits are bursty).
    const poll = setInterval(repositionSelected, 400)

    return () => {
      doc.removeEventListener('click', onClick, true)
      doc.removeEventListener('scroll', repositionSelected, true)
      win?.removeEventListener('scroll', repositionSelected, true)
      window.removeEventListener('scroll', repositionSelected, true)
      window.removeEventListener('resize', repositionSelected)
      clearInterval(poll)
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [doc, iframe, selectedPanelId, onPick, panelToViews, currentView, onViewChange])

  return (
    <>
      {selRect && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: selRect.top, left: selRect.left, width: selRect.width, height: selRect.height,
            pointerEvents: 'none', zIndex: 40,
            outline: '2px solid rgba(94,106,210,0.9)',
            outlineOffset: '-2px',
            boxShadow: '0 0 0 4px rgba(94,106,210,0.12)',
            borderRadius: 4,
            transition: 'top 0.12s, left 0.12s, width 0.12s, height 0.12s',
          }}
        />
      )}
      {flash && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: flash.top, left: flash.left, width: flash.width, height: flash.height,
            pointerEvents: 'none', zIndex: 41,
            background: 'rgba(94,106,210,0.16)',
            borderRadius: 4,
            animation: 'zenya-tap-flash 0.48s ease-out forwards',
          }}
        />
      )}
      <style>{`@keyframes zenya-tap-flash{0%{opacity:1}100%{opacity:0}}`}</style>
    </>
  )
}

/** Minimal CSS.escape shim (jsdom/older Safari safety). */
function cssEscape(s: string): string {
  if (typeof (window as any).CSS?.escape === 'function') return (window as any).CSS.escape(s)
  return s.replace(/["\\\]]/g, '\\$&')
}
