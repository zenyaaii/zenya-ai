'use client'

import { useEffect, useRef } from 'react'

/**
 * The area chart of the 2026-10 dashboard: a soft line over a faint fill,
 * the comparison period dashed behind it.
 *
 * Time runs the way the page reads. In Arabic the oldest point sits on the
 * right and today on the left, so the day names under the chart and the line
 * above them agree.
 *
 * `slots` is how many places the time axis has. A past day has 24 hours and
 * fills them; today has only the hours so far, so its line stops at the
 * current hour while the dashed line of the same day last week runs on.
 *
 * Motion: when only the numbers change (another metric, the next day), the
 * line morphs from its old shape to the new one on a spring. When the shape
 * of the axis changes (7 days to 30), it draws itself in again. Under reduced
 * motion it simply appears.
 *
 * Drawn imperatively into one SVG, so a scrub or a morph frame does not
 * re-render React. The chart is decoration for numbers the card prints in
 * words; it is aria-hidden, and its readout (onScrub) is what a reader hears.
 */

const W = 600
const H = 220

const springE = (t: number) => (t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(8.4 * t))

const smoothPath = (P: Array<[number, number]>) =>
  P.map((q, i) => {
    if (!i) return `M${q[0].toFixed(1)},${q[1].toFixed(1)}`
    const a = P[i - 1]
    const cx = (a[0] + q[0]) / 2
    return `C${cx.toFixed(1)},${a[1].toFixed(1)} ${cx.toFixed(1)},${q[1].toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}`
  }).join(' ')

export default function AreaChart({
  values, prev, slots, rtl = true, onScrub, onLeave, onPick,
}: {
  values: number[]
  /** The comparison period, point for point. */
  prev?: number[] | null
  /** Places on the time axis; defaults to the number of values. */
  slots?: number
  rtl?: boolean
  /** The point under the finger or the pointer, by index. */
  onScrub?: (i: number) => void
  onLeave?: () => void
  /** A short tap (not a drag) on a point, e.g. a day that opens its hours. */
  onPick?: (i: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const ln = useRef<SVGPathElement>(null)
  const ar = useRef<SVGPathElement>(null)
  const pv = useRef<SVGPathElement>(null)
  const cur = useRef<HTMLSpanElement>(null)
  const st = useRef({ y: null as number[] | null, p: null as number[] | null, slots: 0, n: 0, raf: 0, draw: 0 })
  const down = useRef<{ x: number; t: number } | null>(null)
  const n = slots || values.length

  const X = (i: number, count: number) => {
    const x = (i * W) / Math.max(1, count - 1)
    return rtl ? W - x : x
  }

  function paint(y: number[], p: number[] | null, count: number) {
    if (!ln.current || !ar.current || !pv.current) return
    const L = y.length ? smoothPath(y.map((v, i) => [X(i, count), v])) : ''
    ln.current.setAttribute('d', L)
    ar.current.setAttribute('d', y.length ? `${L} L${X(y.length - 1, count).toFixed(1)},${H} L${X(0, count).toFixed(1)},${H}Z` : '')
    pv.current.setAttribute('d', p && p.length ? smoothPath(p.map((v, i) => [X(i, count), v])) : '')
  }

  useEffect(() => {
    const s = st.current
    const el = box.current
    if (!el || !ln.current) return
    const max = Math.max(1, ...values, ...(prev || [0])) * 1.08
    const ys = (arr: number[]) => arr.map((v) => H - 6 - (v / max) * (H - 20))
    const ty = ys(values)
    const tp = prev ? ys(prev) : null
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cancelAnimationFrame(s.raf)

    const sameShape = s.y && s.slots === n && s.y.length === ty.length && (!tp || (s.p && s.p.length === tp.length))
    if (sameShape && !reduce && el.hasAttribute('data-drawn')) {
      const fy = s.y!.slice()
      const fp = (s.p || tp || ty).slice()
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 760)
        const e = springE(k)
        s.y = fy.map((v, i) => v + (ty[i] - v) * e)
        s.p = tp ? fp.map((v, i) => v + (tp[i] - v) * e) : null
        paint(s.y, s.p, n)
        if (k < 1) s.raf = requestAnimationFrame(step)
      }
      s.raf = requestAnimationFrame(step)
    } else {
      s.slots = n
      s.y = ty
      s.p = tp
      paint(ty, tp, n)
      el.removeAttribute('data-drawn')
      const len = ty.length > 1 ? Math.ceil(ln.current.getTotalLength() * 3) : 0
      el.style.setProperty('--len', String(len))
      // The draw-in has its own frame handle: a re-run of this effect (a
      // second render, strict mode) must not cancel it half way.
      cancelAnimationFrame(s.draw)
      if (reduce) el.setAttribute('data-drawn', '')
      else s.draw = requestAnimationFrame(() => { s.draw = requestAnimationFrame(() => el.setAttribute('data-drawn', '')) })
    }
    s.n = values.length
    return () => cancelAnimationFrame(s.raf)
  }, [values, prev, n]) // eslint-disable-line react-hooks/exhaustive-deps

  const at = (x: number) => {
    const r = box.current!.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, rtl ? (r.right - x) / r.width : (x - r.left) / r.width))
    return Math.min(st.current.n - 1, Math.round(f * (n - 1)))
  }

  function scrub(x: number) {
    const s = st.current
    if (!s.n || !s.y || !cur.current) return
    const i = at(x)
    const f = (i / Math.max(1, n - 1)) * 100
    cur.current.style.left = `${rtl ? 100 - f : f}%`
    cur.current.style.setProperty('--y', `${(s.y[i] / H) * 100}%`)
    onScrub?.(i)
  }

  const lift = () => {
    box.current?.removeAttribute('data-touch')
    onLeave?.()
  }

  return (
    <div
      ref={box}
      className="zb-chart"
      data-pick={onPick ? '' : undefined}
      aria-hidden="true"
      onPointerMove={(e) => scrub(e.clientX)}
      onPointerDown={(e) => {
        down.current = { x: e.clientX, t: performance.now() }
        box.current?.setAttribute('data-touch', '')
        scrub(e.clientX)
      }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') { box.current?.setAttribute('data-touch', ''); scrub(e.clientX) } }}
      onClick={(e) => {
        if (!onPick || !st.current.n) return
        const d = down.current
        if (d && (Math.abs(e.clientX - d.x) > 10 || performance.now() - d.t > 650)) return
        onPick(at(e.clientX))
      }}
      onPointerLeave={lift}
      onPointerUp={(e) => { if (e.pointerType !== 'mouse') lift() }}
      onPointerCancel={lift}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} className="zb-gl" x1="0" x2={W} y1={H * f} y2={H * f} />)}
        <path ref={ar} className="zb-ar" />
        <path ref={pv} className="zb-pv" />
        <path ref={ln} className="zb-ln" />
      </svg>
      <span ref={cur} className="zb-cur" />
    </div>
  )
}

/** A small line for a stat tile: the shape of the period, nothing else. */
export function Spark({ values, rtl = true }: { values: number[]; rtl?: boolean }) {
  if (values.length < 2) return null
  const w = 72
  const h = 28
  const mx = Math.max(...values)
  const mn = Math.min(...values)
  const pts = values.map((v, i): [number, number] => {
    const x = (i * w) / (values.length - 1)
    return [rtl ? w - x : x, h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)]
  })
  return (
    <svg className="zb-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={smoothPath(pts)} />
    </svg>
  )
}
