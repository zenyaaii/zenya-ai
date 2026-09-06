"use client"

/**
 * SwipeStack — a deck of cards on a phone. One card in front, its neighbours
 * visibly behind it, and a finger drags between them.
 *
 * WHY THIS IS NOT A LIBRARY, AND NOT REACT STATE PER FRAME.
 * The whole brief for this was "no lagging". A drag that runs through React
 * re-renders every pointermove costs a full render and a style recalc on each
 * of ~120 events per second, on the slowest device the site has. So the drag
 * never touches state: pointermove records a number on a ref, and one rAF per
 * frame writes three transform strings straight onto three elements. React
 * hears about it exactly once, when the finger lifts and the index changes.
 *
 * Everything animated is transform and opacity, so it stays on the compositor
 * and never triggers layout. The cards keep their box, always: nothing here
 * animates width, height, margin or top.
 *
 * TOUCH-ACTION IS THE OTHER HALF OF NOT LAGGING. The stage declares
 * pan-y, which tells the browser up front that vertical scrolling is the
 * page's and horizontal movement is ours. Without it the browser waits to see
 * whether the first move is a scroll before delivering events, and the card
 * visibly lags the thumb for the first few frames of every drag.
 *
 * THE HINT GOES THROUGH THE SAME WRITER AS THE DRAG. If the reader has not
 * touched the stack after a beat, the front card leans one way and then the
 * other and settles, so the cards behind it are seen to be cards. It runs
 * once and any touch cancels it.
 *
 * It was a CSS keyframe first, and that is worth recording: an animation with
 * fill "both" outranks an inline style, so the finished hint pinned the front
 * card to its last frame and the deck's own transform stopped applying to it.
 * Two of three cards ended up stacked dead centre. One writer per transform.
 *
 * The resting state is the finished state: with no JavaScript the front card
 * is in front and the others are behind it, which is what the deck looks like
 * anyway. Nothing here rests invisible.
 */

import { useCallback, useEffect, useRef, useState } from "react"

type Props = {
  children: React.ReactNode[]
  /** Which card starts in front. */
  initialIndex?: number
  /** Accessible name for the group. */
  label: string
  /** Names for the dots, in the same order as the children. */
  itemLabels?: string[]
  className?: string
}

/* How far behind a neighbour sits, and how much smaller. Read once here so the
   script and the stylesheet cannot disagree about the geometry. */
const OFFSET_X = 26
const SCALE_STEP = 0.06
const TILT = 2.2
/** Past this fraction of the stage the drag counts as a decision. */
const THRESHOLD = 0.22

export default function SwipeStack({
  children,
  initialIndex = 0,
  label,
  itemLabels,
  className,
}: Props) {
  const count = children.length
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), count - 1))
  const [touched, setTouched] = useState(false)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const drag = useRef({ active: false, startX: 0, dx: 0, pointer: -1, raf: 0 })
  const indexRef = useRef(index)
  indexRef.current = index
  const touchedRef = useRef(touched)
  touchedRef.current = touched

  /* One writer for the whole deck. Called on every frame of a drag and once
     when the drag settles; never called from React's render. */
  const paint = useCallback((dx: number, animate: boolean) => {
    const stage = stageRef.current
    if (!stage) return
    const width = stage.clientWidth || 1
    const shift = dx / width
    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i]
      if (!el) continue
      /* The offset is fractional while a finger is down, so a card does not
         jump between resting places: it travels. */
      const o = i - indexRef.current - shift
      const a = Math.abs(o)
      const x = o * OFFSET_X + (i === indexRef.current ? dx : 0)
      const scale = Math.max(1 - a * SCALE_STEP, 0.8)
      const tilt = Math.max(Math.min(o, 1.4), -1.4) * TILT
      el.style.transition = animate
        ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none"
      el.style.transform =
        "translate3d(" + x.toFixed(2) + "px,0,0) scale(" + scale.toFixed(4) + ") rotate(" + tilt.toFixed(2) + "deg)"
      el.style.opacity = a > 1.85 ? "0" : a > 1 ? String(1 - (a - 1) / 0.85) : "1"
      el.style.zIndex = String(100 - Math.round(a * 10))
      el.style.pointerEvents = i === indexRef.current ? "auto" : "none"
    }
  }, [])

  /* Settle whenever the index changes for any reason: a swipe, a dot, a key. */
  useEffect(() => { paint(0, true) }, [index, paint])

  /* Lay the deck out before the first paint, so it never flashes stacked at
     0,0 and then springs apart. */
  useEffect(() => { paint(0, false) }, [paint])

  /* THE HINT RUNS THROUGH paint(), NOT THROUGH CSS.
     It was a keyframe on the front card first, and that quietly broke the
     deck: a CSS animation with fill "both" outranks an inline style, so once
     the hint finished it held that card at its last keyframe and the layout
     transform stopped applying. Measured: two of the three cards sat at
     matrix(1,0,0,1,0,0), stacked dead centre on top of each other.

     Driving it through the same function the drag uses means there is only
     ever one writer of a card's transform, so there is nothing to conflict
     with. It is still just a transform per frame. */
  useEffect(() => {
    if (touched) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const timer = window.setTimeout(() => {
      const start = performance.now()
      const DUR = 1600
      const step = (now: number) => {
        if (touchedRef.current || drag.current.active) { paint(0, true); return }
        const k = Math.min((now - start) / DUR, 1)
        /* One lean each way, decaying to nothing, so the cards behind are seen
           on both sides and the deck ends exactly where it started. */
        const dx = Math.sin(k * Math.PI * 2) * 34 * (1 - k)
        paint(dx, false)
        if (k < 1) raf = requestAnimationFrame(step)
        else paint(0, true)
      }
      raf = requestAnimationFrame(step)
    }, 1200)
    return () => { window.clearTimeout(timer); if (raf) cancelAnimationFrame(raf) }
  }, [touched, paint])

  const go = useCallback((next: number) => {
    setIndex((cur) => {
      const clamped = Math.min(Math.max(next, 0), count - 1)
      if (clamped !== cur) setTouched(true)
      return clamped
    })
  }, [count])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    drag.current.active = true
    drag.current.startX = e.clientX
    drag.current.dx = 0
    drag.current.pointer = e.pointerId
    setTouched(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active || e.pointerId !== d.pointer) return
    d.dx = e.clientX - d.startX
    if (d.raf) return
    /* One write per frame, never one per event. */
    d.raf = requestAnimationFrame(() => {
      d.raf = 0
      paint(d.dx, false)
    })
  }

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active || e.pointerId !== d.pointer) return
    d.active = false
    if (d.raf) { cancelAnimationFrame(d.raf); d.raf = 0 }
    const stage = stageRef.current
    const width = stage?.clientWidth || 1
    const moved = d.dx / width
    d.dx = 0
    if (Math.abs(moved) > THRESHOLD) {
      /* Dragging the front card to the right brings the card that sits to its
         right forward, in both writing directions: the gesture is about the
         deck, not about the language. */
      go(indexRef.current - Math.sign(moved))
    } else {
      paint(0, true)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index + 1) }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(index - 1) }
  }

  return (
    <div className={"ss" + (className ? " " + className : "")}>
      <div
        ref={stageRef}
        className="ss-stage"
        data-hint={touched ? undefined : "true"}
        role="group"
        aria-roledescription="مجموعة بطاقات"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="ss-card"
            ref={(el) => { cardRefs.current[i] = el }}
            aria-hidden={i === index ? undefined : true}
          >
            {child}
          </div>
        ))}
      </div>

      <div className="ss-dots" role="tablist" aria-label={label}>
        {children.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={itemLabels?.[i] ?? "بطاقة " + (i + 1)}
            className="ss-dot"
            data-on={i === index ? "true" : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <p className="ss-tip" data-hide={touched ? "true" : undefined} aria-hidden="true">
        اسحب للتنقّل بين البطاقات
      </p>
    </div>
  )
}
