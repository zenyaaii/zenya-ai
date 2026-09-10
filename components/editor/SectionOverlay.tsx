'use client'

/* ─────────────────────────────────────────────────────────────────────── *
 * SectionOverlay — the editor's ONE selection model, used by both trees.   *
 *                                                                          *
 * It replaces ClickToEditOverlay (desktop) and TapToEditOverlay (phone),   *
 * which were two models doing one job: the desktop drew a hover outline    *
 * and no selection at all, the phone drew a selection plus a tinted flash  *
 * laid OVER the section it had just picked. Both drew in the parent        *
 * document with position: fixed, adding the iframe's rect to the section's *
 * — a sum that is wrong under ZoomLock's root zoom, because the parent     *
 * rect arrives in rendered pixels and a fixed box's top/left are then      *
 * zoomed a second time. At 1440 the outline landed ~40px off the section.  *
 *                                                                          *
 * THE MODEL, stated once:                                                  *
 *   • A SECTION is SELECTED. It gets one treatment, a ring, and only one   *
 *     section is ever selected. The ring is three hairlines (white,        *
 *     violet, dark) so at least two of them read on any ground — black,    *
 *     white, or a theme painted the accent violet — plus the house corner  *
 *     bracket on two opposite corners, so it is identifiable by FORM and  *
 *     not by colour alone. It is drawn INSET on the section's own edge:    *
 *     nothing is laid over the section's content.                          *
 *   • HOVER exists only on a fine pointer that can hover. It is a dashed  *
 *     line — a different form from the selection — and it disappears the *
 *     moment the pointer is over a real control inside the section,        *
 *     because a click there presses the control, not the section.         *
 *   • PRESS (touch) has no hover. A tap on a section lands the selection  *
 *     ring immediately with a 160ms fade, and a tap on a control inside a *
 *     section is left to the control.                                      *
 *   • Controls never take this ring. Controls are styled in the editor's  *
 *     chrome (editor-style.ts) and this module only ever marks sections.  *
 *                                                                          *
 * WHY INSIDE THE IFRAME. The ring elements live in the preview's own      *
 * document, positioned with that document's own coordinates. They scale  *
 * with the device frame and the root zoom for free, and no parent-side     *
 * rect arithmetic can drift. Positioning is imperative (a transform and a *
 * size, once per animation frame, only when something moved), so neither  *
 * scrolling the preview nor moving the mouse re-renders React.            *
 * ─────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react'

const INTERACTIVE_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL', 'OPTION', 'SUMMARY'])

function isInteractiveBetween(target: Element, sectionRoot: Element): boolean {
  let cur: Element | null = target
  while (cur && cur !== sectionRoot) {
    if (INTERACTIVE_TAGS.has(cur.tagName)) return true
    const role = cur.getAttribute('role')
    if (role === 'button' || role === 'link' || role === 'tab' || role === 'menuitem') return true
    if ((cur as HTMLElement).isContentEditable) return true
    cur = cur.parentElement
  }
  return false
}

/* The ring's own stylesheet, injected into the preview document. `all:
   initial` first, so no theme rule can reach it. */
const RING_CSS =
  '[data-ze-ring]{all:initial;position:fixed;top:0;left:0;z-index:2147483000;pointer-events:none;box-sizing:border-box;display:none}' +
  // The dark stroke is 0.85, not 0.55: on a ground painted the accent violet
  // itself, 0.55 measured 2.32:1 and left the white stroke alone at 4.42:1.
  // At 0.85 two strokes clear 3:1 on the darkest, lightest and violet grounds.
  '[data-ze-ring="sel"]{box-shadow:inset 0 0 0 1px rgba(255,255,255,.95),inset 0 0 0 3px #5e6ad2,inset 0 0 0 4px rgba(17,17,17,.85)}' +
  '[data-ze-ring="sel"]::before,[data-ze-ring="sel"]::after{content:"";position:absolute;width:22px;height:22px;border:0 solid #5e6ad2;' +
    'filter:drop-shadow(0 0 1px rgba(255,255,255,.95)) drop-shadow(0 0 1px rgba(17,17,17,.85))}' +
  '[data-ze-ring="sel"]::before{top:0;left:0;border-top-width:5px;border-left-width:5px}' +
  '[data-ze-ring="sel"]::after{bottom:0;right:0;border-bottom-width:5px;border-right-width:5px}' +
  '[data-ze-ring="sel"][data-rtl]::before{left:auto;right:0;border-left-width:0;border-right-width:5px}' +
  '[data-ze-ring="sel"][data-rtl]::after{right:auto;left:0;border-right-width:0;border-left-width:5px}' +
  '[data-ze-ring="sel"][data-press]{animation:ze-press 160ms cubic-bezier(.22,1,.36,1)}' +
  '@keyframes ze-press{from{opacity:0}to{opacity:1}}' +
  '[data-ze-ring="hov"]{outline:2px dashed #5e6ad2;outline-offset:-2px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.8)}' +
  'html[data-ze-hover] [data-section]{cursor:pointer}' +
  '@media (prefers-reduced-motion:reduce){[data-ze-ring]{animation:none!important}}'

export default function SectionOverlay({
  doc,
  selectedPanelId,
  onPick,
  panelToViews,
  currentView,
  onViewChange,
  obscuredBottom = 0,
}: {
  /** The preview iframe's document (null until PreviewFrame is ready). */
  doc: Document | null
  /** The section the editor is editing. Global panels have no section. */
  selectedPanelId?: string
  onPick: (panelId: string) => void
  /** panelId -> every view the section appears in. A click only switches the
   *  page when the section is NOT on the current one. */
  panelToViews?: Record<string, string[]>
  currentView?: string
  onViewChange?: (view: string) => void
  /** Pixels at the bottom of the preview hidden under a sheet. A selection
   *  is scrolled into the band above it, so nothing covers what is edited. */
  obscuredBottom?: number
}) {
  // Everything the listeners read goes through refs, so they are bound ONCE
  // per document and never re-bound on a keystroke.
  const selectedRef = useRef(selectedPanelId)
  const onPickRef = useRef(onPick)
  const viewsRef = useRef(panelToViews)
  const viewRef = useRef(currentView)
  const onViewRef = useRef(onViewChange)
  const obscuredRef = useRef(obscuredBottom)
  onPickRef.current = onPick
  viewsRef.current = panelToViews
  viewRef.current = currentView
  onViewRef.current = onViewChange
  obscuredRef.current = obscuredBottom

  // Imperative handles set up by the document effect.
  const api = useRef<{ select: (id: string | undefined, ensure: boolean) => void } | null>(null)
  // When the last tap in the preview landed. A tap that opens the sheet
  // changes what is covered, and the section it picked must stay in view.
  const pickedAtRef = useRef(0)

  useEffect(() => {
    if (!doc || !doc.body) return
    const win = doc.defaultView
    if (!win) return
    const d = doc
    const w = win

    const style = d.createElement('style')
    style.id = 'ze-ring-css'
    style.textContent = RING_CSS
    d.head.appendChild(style)

    const rtl = (d.documentElement.getAttribute('dir') || '') === 'rtl'
    const sel = d.createElement('div')
    sel.setAttribute('data-ze-ring', 'sel')
    sel.setAttribute('aria-hidden', 'true')
    if (rtl) sel.setAttribute('data-rtl', '')
    const hov = d.createElement('div')
    hov.setAttribute('data-ze-ring', 'hov')
    hov.setAttribute('aria-hidden', 'true')
    d.body.appendChild(hov)
    d.body.appendChild(sel)

    // A mouse gets hover; a finger does not. Read from the PARENT window:
    // PreviewFrame only intercepts the reduced-motion query there.
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)')
    let canHover = hoverMq.matches
    const syncHover = () => {
      canHover = hoverMq.matches
      if (canHover) d.documentElement.setAttribute('data-ze-hover', '')
      else { d.documentElement.removeAttribute('data-ze-hover'); hovered = null; schedule() }
    }

    let selEl: Element | null = null
    let hovered: Element | null = null
    let raf = 0
    let press = false

    const find = (id?: string) =>
      id ? d.querySelector('[data-section="' + (w.CSS?.escape ? w.CSS.escape(id) : id.replace(/["\\]/g, '\\$&')) + '"]') : null

    function place(ring: HTMLElement, target: Element | null) {
      if (!target || !target.isConnected) { ring.style.display = 'none'; return }
      const r = target.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= w.innerHeight) {
        ring.style.display = 'none'
        return
      }
      ring.style.display = 'block'
      ring.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)'
      ring.style.width = r.width + 'px'
      ring.style.height = r.height + 'px'
    }

    function update() {
      raf = 0
      if (!selEl || !selEl.isConnected) {
        const next = find(selectedRef.current)
        if (next !== selEl) { if (selEl) ro.unobserve(selEl); selEl = next; if (selEl) ro.observe(selEl) }
      }
      place(sel, selEl)
      if (press) {
        press = false
        sel.removeAttribute('data-press')
        void sel.offsetWidth // restart the fade
        sel.setAttribute('data-press', '')
      }
      place(hov, hovered && hovered !== selEl ? hovered : null)
    }
    function schedule() { if (!raf) raf = w.requestAnimationFrame(update) }

    const RO = (w as any).ResizeObserver as typeof ResizeObserver
    const ro = new RO(schedule)
    const rootEl = d.getElementById('zenya-root')
    if (rootEl) ro.observe(rootEl)
    const MO = (w as any).MutationObserver as typeof MutationObserver
    const mo = new MO(() => { if (selEl && !selEl.isConnected) selEl = null; schedule() })
    if (rootEl) mo.observe(rootEl, { childList: true, subtree: true })

    function ensureVisible(target: Element) {
      const r = target.getBoundingClientRect()
      const band = w.innerHeight - obscuredRef.current
      if (r.bottom > 24 && r.top < band - 24) return
      const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches
      const scroller = d.body.scrollHeight > d.body.clientHeight ? d.body : (d.scrollingElement || d.documentElement)
      scroller.scrollBy({ top: r.top - 12, behavior: reduce ? 'auto' : 'smooth' })
    }

    api.current = {
      select(id: string | undefined, ensure: boolean) {
        if (selEl) ro.unobserve(selEl)
        selEl = find(id)
        if (selEl) { ro.observe(selEl); if (ensure) ensureVisible(selEl) }
        schedule()
      },
    }

    function onMove(e: MouseEvent) {
      if (!canHover) return
      const t = e.target as Element | null
      const sec = t && t.closest ? t.closest('[data-section]') : null
      const next = sec && !isInteractiveBetween(t as Element, sec) ? sec : null
      if (next !== hovered) { hovered = next; schedule() }
    }
    function onLeave() { if (hovered) { hovered = null; schedule() } }

    function onClick(e: MouseEvent) {
      const t = e.target as Element | null
      if (!t || !t.closest) return
      const sec = t.closest('[data-section]')
      if (!sec) return
      if (isInteractiveBetween(t, sec)) return // a control inside the section is pressed, not the section
      const id = sec.getAttribute('data-section') || ''
      if (!id) return
      e.preventDefault()
      e.stopPropagation()
      const views = viewsRef.current?.[id]
      const cur = viewRef.current
      if (views && views.length && onViewRef.current && (!cur || !views.includes(cur))) onViewRef.current(views[0])
      if (!canHover) press = true
      hovered = null
      pickedAtRef.current = Date.now()
      onPickRef.current(id)
    }

    syncHover()
    hoverMq.addEventListener('change', syncHover)
    d.addEventListener('mousemove', onMove, { passive: true })
    d.documentElement.addEventListener('mouseleave', onLeave)
    d.addEventListener('click', onClick, true)
    // The preview scrolls inside itself; keep the rings on their sections.
    d.addEventListener('scroll', schedule, { capture: true, passive: true })
    w.addEventListener('resize', schedule)

    selEl = find(selectedRef.current)
    if (selEl) ro.observe(selEl)
    schedule()

    return () => {
      api.current = null
      if (raf) w.cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      hoverMq.removeEventListener('change', syncHover)
      d.removeEventListener('mousemove', onMove)
      d.documentElement.removeEventListener('mouseleave', onLeave)
      d.removeEventListener('click', onClick, true)
      d.removeEventListener('scroll', schedule, true)
      w.removeEventListener('resize', schedule)
      d.documentElement.removeAttribute('data-ze-hover')
      sel.remove(); hov.remove(); style.remove()
    }
  }, [doc])

  // A new selection — from the rail, the sheet or the preview itself — moves
  // the ring and, if the section is off screen or under the sheet, brings it
  // into view. A click in the preview is already on screen, so it never
  // scrolls; a pick from a list does, because that is how the reader finds it.
  useEffect(() => {
    selectedRef.current = selectedPanelId
    api.current?.select(selectedPanelId, true)
  }, [selectedPanelId, doc])

  // The sheet changing height only re-places the ring. It brings the section
  // back into view only right after a tap picked it — dragging the sheet must
  // never yank a preview the reader has scrolled somewhere else.
  useEffect(() => {
    api.current?.select(selectedRef.current, Date.now() - pickedAtRef.current < 800)
  }, [obscuredBottom])

  return null
}
