'use client'

/* ─────────────────────────────────────────────────────────────────────── *
 * Click-to-edit overlay                                                    *
 *                                                                          *
 * The theme preview renders inside an <iframe> (see PreviewFrame). This    *
 * overlay watches that iframe's document: any [data-section="<panelId>"]   *
 * element gets a hover outline, and clicking it opens that section's panel *
 * in the editor.                                                           *
 *                                                                          *
 * The iframe auto-grows to its content and the parent pane scrolls, so a   *
 * section's rect (measured inside the iframe) is translated into the       *
 * parent viewport by adding the iframe element's own position. The outline *
 * is drawn in the parent document with `position: fixed`.                  *
 *                                                                          *
 * Real buttons, links, and form fields inside a section keep working — the *
 * click handler walks up from the target and bails if it crosses an        *
 * interactive element before reaching the section root.                    *
 * ─────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'

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

export default function ClickToEditOverlay({
  doc,
  iframe,
  onPick,
  panelToViews,
  currentView,
  onViewChange,
}: {
  /** The iframe's document (null until the preview is ready). */
  doc: Document | null
  /** The iframe element, for translating rects into the parent viewport. */
  iframe: HTMLIFrameElement | null
  onPick: (panelId: string) => void
  /** Map panelId → every view the section appears in. Clicking a section only
   *  switches the page when the section is NOT already on the current view —
   *  sections shared across pages (e.g. Philosophy on Home + About) must not
   *  yank the user away from the page they're editing. */
  panelToViews?: Record<string, string[]>
  /** The view currently shown in the preview. */
  currentView?: string
  onViewChange?: (view: string) => void
}) {
  const [hovered, setHovered] = useState<{ panelId: string; rect: Rect } | null>(null)

  useEffect(() => {
    if (!doc || !iframe) return

    function sectionFor(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof HTMLElement)) return null
      return target.closest('[data-section]') as HTMLElement | null
    }

    // Translate an iframe-internal element rect into the parent viewport.
    function parentRect(el: HTMLElement): Rect {
      const r = el.getBoundingClientRect()
      const f = iframe!.getBoundingClientRect()
      return { top: f.top + r.top, left: f.left + r.left, width: r.width, height: r.height }
    }

    let activeEl: HTMLElement | null = null

    function show(el: HTMLElement) {
      activeEl = el
      const panelId = el.getAttribute('data-section') || ''
      if (!panelId) { setHovered(null); return }
      setHovered({ panelId, rect: parentRect(el) })
    }

    function onMove(e: MouseEvent) {
      const sec = sectionFor(e.target)
      if (!sec) { activeEl = null; setHovered(null); return }
      show(sec)
    }

    function reposition() {
      if (!activeEl || !activeEl.isConnected) return
      const panelId = activeEl.getAttribute('data-section') || ''
      if (!panelId) return
      setHovered({ panelId, rect: parentRect(activeEl) })
    }

    function onLeave() { activeEl = null; setHovered(null) }

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
      // Only switch the page if the clicked section isn't on the current view.
      const views = panelToViews?.[panelId]
      if (views && views.length && onViewChange && (!currentView || !views.includes(currentView))) {
        onViewChange(views[0])
      }
      onPick(panelId)
    }

    const win = doc.defaultView

    doc.addEventListener('mousemove', onMove)
    doc.documentElement.addEventListener('mouseleave', onLeave)
    doc.addEventListener('click', onClick, true)
    // The iframe scrolls internally — keep the outline glued to its section as
    // the user scrolls inside the preview (and if the parent pane shifts).
    doc.addEventListener('scroll', reposition, true)
    win?.addEventListener('scroll', reposition, true)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)

    return () => {
      doc.removeEventListener('mousemove', onMove)
      doc.documentElement.removeEventListener('mouseleave', onLeave)
      doc.removeEventListener('click', onClick, true)
      doc.removeEventListener('scroll', reposition, true)
      win?.removeEventListener('scroll', reposition, true)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [doc, iframe, onPick, panelToViews, currentView, onViewChange])

  if (!hovered) return null
  const { rect } = hovered

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none',
        zIndex: 60,
        outline: '2px solid rgba(94,106,210,0.75)',
        outlineOffset: '-2px',
        borderRadius: '4px',
        transition: 'top 0.08s, left 0.08s, width 0.08s, height 0.08s',
      }}
    />
  )
}
