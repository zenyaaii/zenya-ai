'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The dashboard's one-of-several control, in two dresses.
 *
 * <Segmented> is the pill row (a range picker, a metric picker). <TabBar> is
 * the underline row, for when there are too many options to fit as pills - the
 * analytics dashboard has eight. Both share the same mechanic and the same
 * reason for it: THE INDICATOR MOVES RATHER THAN BEING REDRAWN, so the reader
 * follows one object across the row and reads the options as alternatives.
 *
 * WHY THE POSITION IS MEASURED RATHER THAN COMPUTED FROM AN INDEX. The labels
 * are Arabic words of different lengths, so there is no arithmetic that gives
 * the indicator's offset - only the laid-out button knows where it is. The
 * measurement is offsetLeft/offsetWidth, which are CSS pixels, and it is
 * written back as a translateX in CSS pixels, so the two agree. Deliberately
 * NOT getBoundingClientRect: the root ZoomLock writes CSS zoom, a rect comes
 * back in RENDERED pixels, and mixing the two shrinks the indicator by the
 * zoom factor on every render.
 *
 * A transform is physical and does not follow dir. That is exactly why this
 * uses one: offsetLeft is physical too, so the same code lands the indicator
 * correctly in an RTL row and in an LTR one, with no direction branch.
 */

type Item<K extends string> = { key: K; label: string }

function useIndicator<K extends string>(items: Item<K>[], value: K) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef(new Map<K, HTMLButtonElement>())
  const [box, setBox] = useState<{ x: number; w: number } | null>(null)

  const measure = useCallback(() => {
    const el = btnRefs.current.get(value)
    const wrap = wrapRef.current
    if (!el || !wrap) return
    // offsetLeft is relative to the offsetParent; the wrapper is positioned,
    // so it IS the offsetParent. scrollLeft keeps the indicator attached to
    // its button when the row is scrolled sideways on a narrow screen.
    setBox({ x: el.offsetLeft, w: el.offsetWidth })
  }, [value])

  // Layout effect: the indicator must be in place on the frame the row first
  // paints, or it visibly slides in from the start edge on mount.
  useLayoutEffect(measure, [measure, items.length])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    // The labels are webfont text. Until the face lands the buttons are a
    // different width, so a single measurement on mount is wrong by however
    // much the fallback differs.
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    for (const el of btnRefs.current.values()) ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const setRef = (key: K) => (el: HTMLButtonElement | null) => {
    if (el) btnRefs.current.set(key, el)
    else btnRefs.current.delete(key)
  }

  return { wrapRef, setRef, box }
}

/**
 * Roving-tabindex keyboard handling, which is what a tablist owes a keyboard
 * reader: one stop for the whole group, then arrows to move within it.
 * Home/End jump to the ends. The arrows are swapped in RTL, because "next" on
 * screen is the LEFT arrow when the row runs right to left.
 */
function useArrowKeys<K extends string>(items: Item<K>[], value: K, onChange: (k: K) => void) {
  return (e: React.KeyboardEvent) => {
    const i = items.findIndex((it) => it.key === value)
    if (i < 0) return
    const rtl = getComputedStyle(e.currentTarget as Element).direction === 'rtl'
    let next = i
    if (e.key === 'ArrowRight') next = rtl ? i - 1 : i + 1
    else if (e.key === 'ArrowLeft') next = rtl ? i + 1 : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    const clamped = Math.max(0, Math.min(items.length - 1, next))
    if (clamped !== i) onChange(items[clamped].key)
  }
}

export function Segmented<K extends string>({
  items, value, onChange, label, className = '',
}: {
  items: Item<K>[]
  value: K
  onChange: (k: K) => void
  label: string
  className?: string
}) {
  const { wrapRef, setRef, box } = useIndicator(items, value)
  const onKeyDown = useArrowKeys(items, value, onChange)

  return (
    <div ref={wrapRef} role="tablist" aria-label={label} className={'zy-seg ' + className} onKeyDown={onKeyDown}>
      <span
        aria-hidden
        className="zy-seg-ind"
        data-idle={box ? undefined : ''}
        style={box ? { width: box.w, transform: `translateX(${box.x}px)` } : undefined}
      />
      {items.map((it) => (
        <button
          key={it.key}
          ref={setRef(it.key)}
          type="button"
          role="tab"
          aria-selected={value === it.key}
          tabIndex={value === it.key ? 0 : -1}
          data-on={value === it.key ? '' : undefined}
          onClick={() => onChange(it.key)}
          className="zy-seg-b"
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function TabBar<K extends string>({
  items, value, onChange, label, className = '',
}: {
  items: Item<K>[]
  value: K
  onChange: (k: K) => void
  label: string
  className?: string
}) {
  const { wrapRef, setRef, box } = useIndicator(items, value)
  const onKeyDown = useArrowKeys(items, value, onChange)

  return (
    <div ref={wrapRef} role="tablist" aria-label={label} className={'zy-tabs ' + className} onKeyDown={onKeyDown}>
      {items.map((it) => (
        <button
          key={it.key}
          ref={setRef(it.key)}
          type="button"
          role="tab"
          aria-selected={value === it.key}
          tabIndex={value === it.key ? 0 : -1}
          data-on={value === it.key ? '' : undefined}
          onClick={() => onChange(it.key)}
          className="zy-tab"
        >
          {it.label}
        </button>
      ))}
      <span
        aria-hidden
        className="zy-tab-ind"
        data-idle={box ? undefined : ''}
        style={box ? { width: box.w, transform: `translateX(${box.x}px)` } : undefined}
      />
    </div>
  )
}
