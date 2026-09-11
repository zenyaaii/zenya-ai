'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Segmented } from '@/components/app/Segmented'
import type { SeriesPoint } from './types'

type MetricKey = 'views' | 'visitors' | 'sessions' | 'events'

const METRIC_LABEL: Record<MetricKey, string> = {
  views: 'المشاهدات',
  visitors: 'الزوّار',
  sessions: 'الجلسات',
  events: 'التواصل',
}

const METRICS = (Object.keys(METRIC_LABEL) as MetricKey[]).map((k) => ({
  key: k,
  label: METRIC_LABEL[k],
}))

/* ── the plot box ─────────────────────────────────────────────────────────
   PAD_R is a real GUTTER, not a margin: the y-axis labels live in it, to the
   right of the plot, because an Arabic reader's eye starts on that side. The
   labels used to be drawn INSIDE the plot at its right edge, which put them
   over the area fill and - measurably - outside the SVG box. PAD_B is sized
   for the x-axis band, so the container includes its own axis rather than
   cropping it.
------------------------------------------------------------------------- */
const H = 248
const PAD_T = 18
const PAD_B = 30
const PAD_L = 10
const PAD_R = 48

/**
 * The main traffic chart.
 *
 * Measures its own width rather than stretching a fixed viewBox, so 1 SVG unit
 * is 1 real pixel — no distorted strokes, no squashed hover dots, and the
 * crosshair maths stays trivially correct at any container size.
 *
 * The dashed line is the immediately preceding period of the same length.
 * Without it a count is context-free: "40 views" means nothing until you can
 * see it against the 25 you had last week.
 *
 * ── THE SVG IS FORCED TO direction: ltr, AND THAT IS A BUG FIX ────────────
 * The dashboard is RTL and the SVG inherited it. In an RTL context
 * text-anchor="end" resolves to the LEFT of the anchor point, so every axis
 * label was anchored on the wrong side and hung outside the plot. Measured on
 * the real page at 1440: "175" and "350" overflowed the SVG box by 9.4px,
 * "9/9" by 6.9px and "11/8" by 12.3px on the other side. The geometry here is
 * deliberately left-to-right (time runs left to right, as it did before), so
 * the drawing surface is declared ltr and the anchors mean what they say. The
 * CARD around it stays RTL, which is what the reader actually reads.
 *
 * ── THE REVEAL ───────────────────────────────────────────────────────────
 * One clip rectangle scaled from 0 to 1 wipes across the plot, so the area,
 * the line and the comparison line are uncovered together and can never drift
 * out of sync the way three separate animations would. The clip is keyed on
 * the metric and the range, so switching either re-runs it — the chart redraws
 * itself rather than swapping one picture for another. Chrome (grid, axis,
 * labels) does not animate: it is the frame, and a frame that moves every time
 * the data changes is noise.
 */
export default function TrendChart({
  series, prevSeries, metric, onMetricChange, showPrev, compareLabel,
}: {
  series: SeriesPoint[]
  prevSeries: SeriesPoint[]
  metric: MetricKey
  onMetricChange: (m: MetricKey) => void
  showPrev: boolean
  compareLabel: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(760)
  const [hover, setHover] = useState<number | null>(null)
  const [tipW, setTipW] = useState(140)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The tooltip is clamped against its own width, so it has to be measured
  // rather than assumed — the Arabic date line changes length by weekday.
  useLayoutEffect(() => {
    if (tipRef.current) setTipW(tipRef.current.offsetWidth)
  }, [hover, metric])

  const n = series.length
  const values = useMemo(() => series.map((s) => s[metric] ?? 0), [series, metric])
  const prevValues = useMemo(() => prevSeries.map((s) => s[metric] ?? 0), [prevSeries, metric])

  const max = Math.max(1, ...values, ...(showPrev ? prevValues : []))
  // Round the axis up to something readable rather than to the raw peak.
  const niceMax = niceCeil(max)

  const plotL = PAD_L
  const plotR = Math.max(plotL + 1, width - PAD_R)
  const plotW = plotR - plotL

  const x = (i: number) => plotL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => H - PAD_B - (v / niceMax) * (H - PAD_T - PAD_B)

  const linePath = (vals: number[]) =>
    vals.length === 0
      ? ''
      : vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const line = linePath(values)
  const area =
    n > 1 ? `${line} L${x(n - 1).toFixed(1)},${H - PAD_B} L${x(0).toFixed(1)},${H - PAD_B} Z` : ''

  function idxFromClientX(clientX: number, rect: DOMRect) {
    // The card is RTL but the plot is LTR, so the index always maps from the
    // physical left edge. rect is in RENDERED pixels and the plot maths is in
    // CSS pixels, so the ratio is taken first and only then scaled — never
    // subtract a CSS-pixel pad from a rendered-pixel offset.
    const ratio = (clientX - rect.left) / Math.max(1, rect.width)
    const inPlot = (ratio * width - plotL) / Math.max(1, plotW)
    const idx = Math.round(inPlot * (n - 1))
    return Math.max(0, Math.min(n - 1, idx))
  }

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    setHover(idxFromClientX(e.clientX, e.currentTarget.getBoundingClientRect()))
  }

  // Keyboard gets exactly what the pointer gets. A chart whose only readout is
  // a hover tooltip is unreadable without a mouse.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return
    const cur = hover ?? n - 1
    let next: number | null = null
    if (e.key === 'ArrowRight') next = cur + 1
    else if (e.key === 'ArrowLeft') next = cur - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    else if (e.key === 'Escape') { setHover(null); return }
    else return
    e.preventDefault()
    setHover(Math.max(0, Math.min(n - 1, next)))
  }

  const hasData = values.some((v) => v > 0)
  const point = hover != null ? series[hover] : null
  const prevPoint = hover != null ? prevSeries[hover] : null

  // The reveal restarts whenever the plotted numbers change identity.
  const revealKey = `${metric}:${n}:${series[0]?.date ?? ''}:${series[n - 1]?.date ?? ''}`

  // Clamp the tooltip inside the card. Without this it hangs off the edge at
  // the first and last points, which is where a reader looks most often.
  const half = tipW / 2
  const rawX = hover != null ? x(hover) : 0
  const tipX = Math.min(Math.max(rawX, half + 2), Math.max(half + 2, width - half - 2))

  return (
    <div className="rounded-2xl zy-card p-4 sm:p-5">
      {/* Metric switcher + the comparison key. Two series are plotted, so a
          key is not optional — identity must not rest on colour alone. */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <Segmented items={METRICS} value={metric} onChange={onMetricChange} label="اختر المقياس" />
        {showPrev && (
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#56565a]">
            <svg width="18" height="6" aria-hidden className="shrink-0">
              <line x1="0" y1="3" x2="18" y2="3" stroke="rgba(17,17,17,0.34)" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            {compareLabel}
          </span>
        )}
      </div>

      <div
        ref={wrapRef}
        className="relative"
        onPointerMove={onPointer}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          /* direction: ltr comes from .zy-chart. React's SVG prop types have
             no dir attribute, and it belongs in CSS anyway - see the class. */
          className="zy-chart block touch-none"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setHover((h) => (h == null ? n - 1 : h))}
          onBlur={() => setHover(null)}
          role="img"
          aria-label={`${METRIC_LABEL[metric]} عبر الوقت. استخدم الأسهم لتصفّح الأيام.`}
        >
          <defs>
            <linearGradient id="zy-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`zy-reveal-${revealKey.replace(/[^a-z0-9]/gi, '')}`}>
              <rect
                key={revealKey}
                className="zy-chart-wipe"
                x={plotL} y={0} width={plotW} height={H}
              />
            </clipPath>
          </defs>

          {/* ── chrome: gridlines and the y gutter ── */}
          {[0, 0.5, 1].map((g) => {
            const gy = y(niceMax * g)
            return (
              <g key={g}>
                <line
                  x1={plotL} x2={plotR} y1={gy} y2={gy}
                  stroke="rgba(17,17,17,0.07)" strokeWidth="1" shapeRendering="crispEdges"
                />
                <text
                  x={plotR + 8} y={gy} dominantBaseline="middle" textAnchor="start"
                  className="zy-chart-tick"
                >
                  {Math.round(niceMax * g).toLocaleString('ar')}
                </text>
              </g>
            )
          })}

          {/* ── the data, revealed together under one wipe ── */}
          <g clipPath={`url(#zy-reveal-${revealKey.replace(/[^a-z0-9]/gi, '')})`}>
            {area && <path d={area} fill="url(#zy-area)" />}
            {showPrev && prevValues.length > 1 && (
              <path
                d={linePath(prevValues)}
                fill="none"
                stroke="rgba(17,17,17,0.26)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                strokeLinejoin="round"
              />
            )}
            {line && (
              <path
                d={line}
                fill="none"
                stroke="#5e6ad2"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {/* A single-point range still deserves a visible mark. */}
            {n === 1 && <circle cx={x(0)} cy={y(values[0])} r="4" fill="#5e6ad2" stroke="#fff" strokeWidth="2" />}
          </g>

          {/* ── the readout. Translated rather than re-placed, so it glides
                between days instead of teleporting. ── */}
          {hover != null && n > 1 && (
            <g className="zy-chart-cursor" style={{ transform: `translateX(${x(hover)}px)` }}>
              <line
                x1={0} x2={0} y1={PAD_T - 8} y2={H - PAD_B}
                stroke="rgba(94,106,210,0.38)" strokeWidth="1"
              />
              <circle
                cx={0} cy={y(values[hover] ?? 0)} r="4.5"
                fill="#5e6ad2" stroke="#fff" strokeWidth="2"
                style={{ transition: 'cy 220ms cubic-bezier(0.22,1,0.36,1)' }}
              />
            </g>
          )}

          {/* ── x labels: first, middle, last only — more would collide ── */}
          {n > 1 &&
            [0, Math.floor((n - 1) / 2), n - 1].map((i, k) => (
              <text
                key={k}
                x={x(i)}
                y={H - 10}
                textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}
                className="zy-chart-tick"
              >
                {shortDate(series[i]?.date)}
              </text>
            ))}
        </svg>

        {/* Tooltip. Clamped to the card so the first and last points do not
            push it off the edge. Values lead, labels follow. */}
        {point && (
          <div
            ref={tipRef}
            className="zy-chart-tip"
            style={{ transform: `translate(-50%, 0)`, insetInlineStart: 'auto', left: `${tipX}px` }}
          >
            <div className="zy-chart-tip-d">{fullDate(point.date)}</div>
            <div className="zy-chart-tip-v">
              <span className="zy-chart-tip-n">{(point[metric] ?? 0).toLocaleString('ar')}</span>
              <span className="zy-chart-tip-l">
                <i className="zy-chart-key" aria-hidden />
                {METRIC_LABEL[metric]}
              </span>
            </div>
            {showPrev && prevPoint && (
              <div className="zy-chart-tip-p">
                <i className="zy-chart-key" data-prev aria-hidden />
                السابق: {(prevPoint[metric] ?? 0).toLocaleString('ar')}
              </div>
            )}
          </div>
        )}

        {!hasData && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="max-w-xs rounded-[10px] bg-white/85 px-3 py-2 text-center text-[12.5px] font-medium text-[#56565a] backdrop-blur-sm">
              لا مشاهدات في هذه المدة. جرّب مدة أطول، أو شارك رابط موقعك لتبدأ الزيارات.
            </p>
          </div>
        )}
      </div>

      {/* The values without a pointer. A tooltip enhances, it never gates —
          this is the same numbers as a table, for a screen reader and for
          anyone who cannot hover. */}
      {/* The wrapper carries .zy-sr, not the table. A <table> is sized by its
          content and treats width:1px as a suggestion, so the class on the
          table itself left a 224x705 box - clipped and out of flow, so
          invisible and harmless, but it makes every later overflow audit
          report a phantom. A div honours the 1px. */}
      <div className="zy-sr">
      <table>
        <caption>{`${METRIC_LABEL[metric]} لكل يوم`}</caption>
        <thead>
          <tr><th scope="col">اليوم</th><th scope="col">{METRIC_LABEL[metric]}</th></tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.date}>
              <th scope="row">{fullDate(s.date)}</th>
              <td>{(s[metric] ?? 0).toLocaleString('ar')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

/** 40 → 40, 41 → 50, 412 → 500. Keeps the axis labels round. */
function niceCeil(n: number): number {
  if (n <= 5) return 5
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  return Math.ceil(n / (mag / 2)) * (mag / 2)
}

function shortDate(iso?: string): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${Number(m)}`
}

function fullDate(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('ar', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
    })
  } catch {
    return iso
  }
}
