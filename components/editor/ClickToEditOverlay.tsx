'use client'

/* ─────────────────────────────────────────────────────────────────────── *
 * Click-to-edit overlay                                                    *
 *                                                                          *
 * Mount this inside an editor's preview area, give it a ref to the scroll  *
 * container, and any [data-section="<panelId>"] element in the canvas      *
 * gets a hover outline; clicking anywhere on the section opens that        *
 * section's editor panel.                                                  *
 *                                                                          *
 * Real buttons, links, and form fields inside the section keep working —   *
 * the click handler walks up from the click target and bails out if it     *
 * crosses an interactive element on the way to the section root.           *
 * ─────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'

type Hovered = {
  panelId: string
  rect: { top: number; left: number; width: number; height: number }
}

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
  containerRef,
  onPick,
  panelToView,
  onViewChange,
}: {
  containerRef: React.RefObject<HTMLElement>
  onPick: (panelId: string) => void
  /** Map panelId → view id, so clicking a section on another page also switches the page. */
  panelToView?: Record<string, string>
  onViewChange?: (view: string) => void
}) {
  const [hovered, setHovered] = useState<Hovered | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function findSection(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof HTMLElement)) return null
      return target.closest('[data-section]') as HTMLElement | null
    }

    function rectFor(panelId: string) {
      const root = containerRef.current
      if (!root) return null
      const sec = root.querySelector(`[data-section="${cssEscape(panelId)}"]`) as HTMLElement | null
      if (!sec) return null
      const r = sec.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }

    function onMove(e: MouseEvent) {
      const sec = findSection(e.target)
      if (!sec) {
        setHovered(null)
        return
      }
      const panelId = sec.getAttribute('data-section') || ''
      if (!panelId) {
        setHovered(null)
        return
      }
      const r = sec.getBoundingClientRect()
      setHovered((cur) =>
        cur?.panelId === panelId &&
        cur.rect.top === r.top &&
        cur.rect.left === r.left &&
        cur.rect.width === r.width &&
        cur.rect.height === r.height
          ? cur
          : { panelId, rect: { top: r.top, left: r.left, width: r.width, height: r.height } }
      )
    }

    function onLeave() { setHovered(null) }

    function onScroll() {
      setHovered((cur) => {
        if (!cur) return cur
        const r = rectFor(cur.panelId)
        return r ? { panelId: cur.panelId, rect: r } : null
      })
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (!target) return
      const sec = target.closest('[data-section]') as HTMLElement | null
      if (!sec) return
      // Don't hijack real button/link/input clicks — those should still work
      // exactly as the user expects.
      if (isInteractiveBetween(target, sec)) return
      const panelId = sec.getAttribute('data-section') || ''
      if (!panelId) return
      e.preventDefault()
      e.stopPropagation()
      if (panelToView && panelToView[panelId] && onViewChange) {
        onViewChange(panelToView[panelId])
      }
      onPick(panelId)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('scroll', onScroll, { passive: true })
    // Capture phase so we win the click before any inert listeners inside
    // the canvas swallow it.
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('click', onClick, true)
    }
  }, [containerRef, onPick, panelToView, onViewChange])

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

/** Minimal CSS.escape polyfill — CSS.escape is missing in older browsers. */
function cssEscape(s: string): string {
  if (typeof window !== 'undefined' && (window as any).CSS?.escape) {
    return (window as any).CSS.escape(s)
  }
  return s.replace(/["\\]/g, '\\$&')
}
