'use client'

/* Animated number counter. Counts up to its target the first time it scrolls
 * into view. Gracefully handles non-numeric values (e.g. "أقل من دقيقة") by
 * rendering them verbatim, and preserves prefixes/suffixes like "+", "%",
 * thousands separators, and currency glyphs around the number. */

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3)

export default function Counter({
  value,
  durationMs = 1400,
  className,
}: {
  value: string
  durationMs?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduce = useReducedMotion()

  // Split "2,400+" → prefix "", digits "2,400", suffix "+".
  const match = value.match(/^(\D*)([\d.,]+)(.*)$/)
  const [display, setDisplay] = useState(() =>
    match ? `${match[1]}0${match[3]}` : value
  )

  useEffect(() => {
    if (!match) {
      setDisplay(value)
      return
    }
    const [, prefix, digits, suffix] = match
    const target = parseFloat(digits.replace(/,/g, ''))
    const decimals = digits.includes('.') ? digits.split('.')[1].length : 0
    const grouped = digits.includes(',')

    if (reduce || !inView) {
      if (!inView) return
      setDisplay(value)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const n = target * EASE_OUT(p)
      const fixed = n.toFixed(decimals)
      const out = grouped
        ? Number(fixed).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : fixed
      setDisplay(`${prefix}${out}${suffix}`)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, durationMs, reduce]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={className} dir="ltr">
      {display}
    </span>
  )
}
