"use client"

import { useEffect, type RefObject } from "react"

/* ─────────────────────────────────────────────────────────────────────────
   The cursor engine and the fit pass — the two pieces of machinery every
   section on this page shares.

   Both were written for section two and both turned out to be generic: the
   cursor drives anything carrying a data-t attribute, and the fit pass scales
   whatever is put in a window. Section three uses them as they are rather
   than growing a second copy, which is the only way the two sections can go
   on behaving identically.
   ───────────────────────────────────────────────────────────────────────── */

/* Timings. The cursor is slow enough to be followed and the typing slow
   enough to read as a person rather than a machine. */
export const MOVE = 620
export const PRESS = 170
export const SETTLE = 260
export const KEY = 46
export const THINK = 900

/* Thrown to unwind a run when a section goes off screen or unmounts. Caught
   by the runner itself, and means nothing else. */
export const HALT = Symbol("halt")

export type Cursor = { x: number; y: number; press: boolean } | null

export type Runner = {
  /** Move the cursor to [data-t="key"]. ax/ay are 0..1 across the target. */
  move: (key: string, ax?: number, ay?: number) => Promise<void>
  moveEl: (el: Element | null, ax?: number, ay?: number) => Promise<void>
  /** Press and release. */
  click: () => Promise<void>
  /** The pause between one beat finishing and the next arriving. */
  beat: (ms?: number) => Promise<void>
  wait: (ms: number) => Promise<void>
  find: (key: string) => Element | null
  frame: () => HTMLElement | null
  reduced: boolean
}

/**
 * Builds the cursor engine over one frame.
 *
 * `alive` is what unwinds a run: every wait checks it and throws HALT, so a
 * script that is halfway through a card stops on the frame the section goes
 * away rather than finishing into a dead component.
 */
export function makeRunner({
  frameRef, setCursor, setFocus, reduced, alive,
}: {
  frameRef: RefObject<HTMLElement | null>
  setCursor: (f: (c: Cursor) => Cursor) => void
  setFocus: (k: string | null) => void
  reduced: boolean
  alive: () => boolean
}): Runner {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms))
  const wait = async (ms: number) => { await sleep(ms); if (!alive()) throw HALT }

  /* Where a target sits inside the frame. Rects come back in RENDERED pixels,
     because the root ZoomLock writes CSS zoom, while the offset written onto
     the cursor is in CSS pixels. The frame's own rect against its offsetWidth
     is the ratio between the two, so the two are never mixed — the same trap
     the hero's column measurement fell into. */
  const at = (el: Element | null, ax = 0.5, ay = 0.55) => {
    const frame = frameRef.current
    if (!frame || !el) return null
    const f = frame.getBoundingClientRect()
    const t = el.getBoundingClientRect()
    const scale = frame.offsetWidth ? f.width / frame.offsetWidth : 1
    if (!scale) return null
    return {
      x: (t.left + t.width * ax - f.left) / scale,
      y: (t.top + t.height * ay - f.top) / scale,
    }
  }

  const find = (key: string) => frameRef.current?.querySelector(`[data-t="${key}"]`) ?? null

  /* Bring a target into view before moving to it.

     This is what lets a surface be TALLER than the screen showing it instead
     of being scaled down to fit. Shrinking was the old answer and it has a
     floor: past a point the type is simply too small to read, which is what
     a phone kept running into. Scrolling has no such floor, and it is also
     what a person does — you scroll to the field you are filling in.

     The nearest ancestor that actually overflows is the one that scrolls, so
     this works wherever it is used and does nothing at all when everything
     already fits. */
  const bring = async (el: Element | null) => {
    const frame = frameRef.current
    if (!el || !frame) return
    /* The nearest ancestor that ACTUALLY SCROLLS, which is two tests and not
       one: it has to overflow AND be a scroll container. Overflowing alone
       finds the stretched content box first, and scrollBy on an element whose
       overflow is visible does nothing at all — the scroll silently never
       happened, which is exactly how this failed the first time. */
    const scrolls = (n: HTMLElement) => {
      if (n.scrollHeight <= n.clientHeight + 1) return false
      const o = getComputedStyle(n).overflowY
      return o === "auto" || o === "scroll" || o === "hidden"
    }
    let box: HTMLElement | null = el.parentElement
    while (box && box !== frame && !scrolls(box)) box = box.parentElement
    if (!box || box === frame || !scrolls(box)) return
    const f = frame.getBoundingClientRect()
    const scale = frame.offsetWidth ? f.width / frame.offsetWidth : 1
    if (!scale) return
    const br = box.getBoundingClientRect()
    const tr = el.getBoundingClientRect()
    /* Toward the TOP of the screen, not merely inside it. A device that runs
       off the bottom of the page has a screen whose lower half is not on the
       page either, so "in view of the container" is not the same as "in view
       of the reader". Putting the target a quarter of the way down keeps the
       work in the part still visible, whatever is cut off below. */
    const aim = br.top + br.height * 0.24
    let dy = tr.top - aim
    /* Never past the ends. */
    const max = box.scrollHeight - box.clientHeight - box.scrollTop
    const min = -box.scrollTop
    dy = Math.max(min * scale, Math.min(max * scale, dy))
    if (Math.abs(dy) < 3) return
    /* Rects are rendered pixels, scrollBy takes CSS pixels. */
    box.scrollBy({ top: dy / scale, behavior: reduced ? "auto" : "smooth" })
    await wait(reduced ? 0 : 480)
  }

  const moveEl = async (el: Element | null, ax?: number, ay?: number) => {
    await bring(el)
    const p = at(el, ax, ay)
    if (p) setCursor((c) => ({ x: p.x, y: p.y, press: c ? c.press : false }))
    await wait(reduced ? 0 : MOVE)
  }
  const move = (key: string, ax?: number, ay?: number) => moveEl(find(key), ax, ay)

  const click = async () => {
    setCursor((c) => (c ? { ...c, press: true } : c))
    await wait(PRESS)
    setCursor((c) => (c ? { ...c, press: false } : c))
    await wait(SETTLE)
  }

  /* The beat between one thing finishing and the next arriving. The cursor
     STAYS — a person working through a screen does not vanish between
     fields. */
  const beat = async (ms = THINK) => {
    setFocus(null)
    setCursor((c) => (c ? { ...c, press: false } : c))
    await wait(ms)
  }

  return { move, moveEl, click, beat, wait, find, frame: () => frameRef.current, reduced }
}

/* ── Driving the product's own inputs ──────────────────────────────────────
   Section two hands the menu analyzer a real File on a real DataTransfer and
   dispatches the event React actually listens for. The same problem comes up
   wherever a real component is mounted rather than reproduced: React owns the
   value, so assigning to `.value` is discarded on the next render.

   The prototype's own setter is what React's onChange is built over, so
   writing through it and dispatching a bubbling event is indistinguishable
   from a keystroke as far as the component is concerned. */
export function writeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
  setter ? setter.call(el, value) : (el.value = value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
}

/* ── The fit pass ─────────────────────────────────────────────────────────
   Nothing in a window is ever cut. Content is laid out at its natural size,
   measured, and scaled by the ratio that makes it fit the room it actually
   has — the same thing --fit does to the hero's three words.

   Three rules make it work: it only ever scales DOWN; the child must size to
   its CONTENT rather than stretch, or it measures as the window and the ratio
   always comes back 1; and it measures against the stage's CONTENT box, since
   clientHeight counts the padding and measuring against that lets the card
   bleed into it and clip at the window's edge.

   The observer watches the child's LAYOUT box, which a transform does not
   touch, so scaling cannot feed back into the measurement. */
export function useFit(
  stageRef: RefObject<HTMLElement | null>,
  fitRef: RefObject<HTMLElement | null>,
  deps: unknown[],
) {
  useEffect(() => {
    const stage = stageRef.current
    const fit = fitRef.current
    if (!stage || !fit) return
    const inner = fit.firstElementChild as HTMLElement | null
    if (!inner) return

    const measure = () => {
      fit.style.setProperty("--fit", "1")
      const h = inner.offsetHeight
      const w = inner.offsetWidth
      const cs = getComputedStyle(stage)
      const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      if (!h || !w || availH <= 0 || availW <= 0) return
      const k = Math.min(1, availH / h, availW / w)
      /* Rounded, so a stray sub-pixel does not rewrite the transform on every
         keystroke and force a fresh composite for nothing. */
      fit.style.setProperty("--fit", String(Math.floor(k * 1000) / 1000))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(inner)
    ro.observe(stage)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
