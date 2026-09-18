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
 * ONE SWIPE TURNS A CARD, and getting there took two fixes that are easy to
 * mistake for one. The first is POINTER CAPTURE: the stage is 312px wide and
 * centred, so any real swipe leaves it, and without capture the browser stops
 * delivering moves at the edge — the card froze mid-drag and the release was
 * never seen, which read as lag and as having to hold the card the whole way.
 * It is taken LAZILY, once the gesture passes the slop, because a captured
 * pointer makes the browser fire the click at the capturing element: taking
 * it on pointerdown delivers every tap to the stage and the plan's own call
 * to action stops working. The second fix is VELOCITY: the commit test was
 * distance alone, 22 per cent of the stage, so a flick — the gesture everyone
 * actually makes — fell short and snapped back. A gesture now commits if it
 * went far enough OR fast enough, and the flick takes its direction from the
 * velocity.
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
const THRESHOLD = 0.16
/**
 * ...OR past this speed, in pixels per millisecond, which is what makes a
 * flick work. Distance alone meant the only gesture that turned a card was a
 * slow drag held most of the way across the stage: a quick flick of 40px at
 * 300px is 0.13 of the stage, under any sane distance threshold, so the deck
 * snapped back and the reader had to go back and DRAG it. 0.45 px/ms is about
 * a third of a comfortable flick and well above the speed a finger can reach
 * while it is still deciding.
 */
const FLICK = 0.45
/** A flick still has to be a movement, not a jittery tap. */
const FLICK_MIN_PX = 8
/** Past this the gesture was a drag, so the click it ends with is not a tap. */
const SLOP = 6

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
  const drag = useRef({ active: false, startX: 0, dx: 0, pointer: -1, raf: 0,
                       lastX: 0, lastT: 0, vx: 0, swallowUntil: 0, captured: false })
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
    const d = drag.current
    d.active = true
    d.startX = e.clientX
    d.dx = 0
    d.pointer = e.pointerId
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    d.vx = 0
    d.swallowUntil = 0
    d.captured = false
    setTouched(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active || e.pointerId !== d.pointer) return
    d.dx = e.clientX - d.startX
    /* Speed, smoothed, so one stuttered frame near the release cannot decide
       the gesture. Sampled per EVENT rather than per frame: coalesced moves
       are where the speed actually is. */
    const dt = e.timeStamp - d.lastT
    if (dt > 0) {
      const v = (e.clientX - d.lastX) / dt
      d.vx = d.vx === 0 ? v : d.vx * 0.7 + v * 0.3
      d.lastX = e.clientX
      d.lastT = e.timeStamp
    }
    /* CAPTURE, AND IT IS THE HALF OF THIS THAT WAS MISSING — BUT NOT UNTIL THE
       GESTURE IS A DRAG. The stage is 19.5rem wide and centred, so a swipe
       that starts on the card and travels a real distance leaves that box
       well before the finger lifts. Without capture the browser stops
       delivering moves the moment it does: the card freezes wherever it was,
       pointerup never arrives, and the deck sits mid-drag until something
       else touches it. That is what "it lags, you have to hold it the whole
       time" was.

       Taking the capture on pointerdown instead of here looks tidier and is
       wrong, which cost a round of this: while a pointer is captured the
       browser fires the compatibility CLICK at the capturing element, so
       every tap inside the deck was delivered to the stage and the plan's
       own call to action stopped being clickable. Past the slop the gesture
       is a drag and there is no tap left to break. */
    if (!d.captured && Math.abs(d.dx) > SLOP) {
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        d.captured = true
      } catch {
        /* Throws NotFoundError when the pointer is not a live one. The drag
           still works without capture; it just ends at the stage's edge. */
      }
    }
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
    /* Guarded: pointerup releases the capture implicitly, and on
       lostpointercapture it is already gone. Releasing a pointer that is
       not captured throws NotFoundError. */
    if (d.captured && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    d.captured = false
    const stage = stageRef.current
    const width = stage?.clientWidth || 1
    const dx = d.dx
    const moved = dx / width
    const vx = d.vx
    d.dx = 0
    d.vx = 0
    /* A gesture that travelled past the slop is a drag, and the click the
       browser synthesises from it must not reach the plan's button. It is a
       WINDOW and not a flag: a drag that ends on empty card never produces a
       click at all, and a flag left standing would then eat the next real tap
       — or a keyboard Enter, which arrives as a click with no pointer at all. */
    d.swallowUntil = Math.abs(dx) > SLOP ? e.timeStamp + 300 : 0

    /* EITHER far enough OR fast enough. The flick reads its direction from
       the velocity rather than the distance, because at the end of a fast
       throw those can disagree by a pixel or two. */
    const flicked = Math.abs(vx) > FLICK && Math.abs(dx) > FLICK_MIN_PX
    if (flicked || Math.abs(moved) > THRESHOLD) {
      /* Dragging the front card to the right brings the card that sits to its
         right forward, in both writing directions: the gesture is about the
         deck, not about the language. */
      go(indexRef.current - Math.sign(flicked ? vx : moved))
    } else {
      paint(0, true)
    }
  }

  /* Capture phase, so it is decided before the card's own link sees it. */
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.timeStamp > drag.current.swallowUntil) return
    drag.current.swallowUntil = 0
    e.preventDefault()
    e.stopPropagation()
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
        /* The browser takes the pointer when it decides the gesture is a
           vertical scroll; without this the deck would stay mid-drag. */
        onLostPointerCapture={end}
        onClickCapture={onClickCapture}
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
