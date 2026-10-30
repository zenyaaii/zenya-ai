'use client'

import { useEffect, useState } from 'react'

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/**
 * A number that rolls to its new value, digit by digit, like a meter.
 *
 * Each digit is a column 0–9 moved up by its value; the columns are keyed from
 * the right, so 980 → 1,020 keeps the units under the units. It starts at
 * zero and rolls up once on arrival. Western digits, as everywhere in the
 * dashboard. The whole figure is the accessible name; the columns are hidden.
 */
export default function Odometer({ value, className = '' }: { value: number; className?: string }) {
  const target = fmt(value)
  const [shown, setShown] = useState(() => target.replace(/\d/g, '0'))

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(target))
    return () => cancelAnimationFrame(raf)
  }, [target])

  // Lay the target's shape out now, so a longer number does not jump a frame later.
  const chars = [...target]
  const from = [...shown.padStart(chars.length, '0')].slice(-chars.length)
  return (
    <div className={`zb-odo ${className}`} role="img" aria-label={target}>
      {chars.map((ch, k) => {
        const key = chars.length - k
        if (!/\d/.test(ch)) return <span key={`s${key}`} className="zb-sep" aria-hidden="true">{ch}</span>
        const d = /\d/.test(from[k]) ? Number(from[k]) : 0
        return (
          <span key={`d${key}`} aria-hidden="true">
            <i style={{ transform: `translateY(-${d * 10}%)` }}>
              {'0123456789'.split('').map((x) => <b key={x}>{x}</b>)}
            </i>
          </span>
        )
      })}
    </div>
  )
}
