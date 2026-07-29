'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SeriesPoint } from './types'

type MetricKey = 'views' | 'visitors' | 'sessions' | 'events'

const METRIC_LABEL: Record<MetricKey, string> = {
  views: 'المشاهدات',
  visitors: 'الزوّار',
  sessions: 'الجلسات',
  events: 'التواصل',
}

const H = 240
const PAD_T = 16
const PAD_B = 26
const PAD_X = 8

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
  const [width, setWidth] = useState(760)
  const [hover, setHover] = useState<number | null>(null)

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

  const n = series.length
  const values = useMemo(() => series.map((s) => s[metric] ?? 0), [series, metric])
  const prevValues = useMemo(() => prevSeries.map((s) => s[metric] ?? 0), [prevSeries, metric])

  const max = Math.max(1, ...values, ...(showPrev ? prevValues : []))
  // Round the axis up to something readable rather than to the raw peak.
  const niceMax = niceCeil(max)

  const x = (i: number) => PAD_X + (n <= 1 ? 0 : (i / (n - 1)) * (width - PAD_X * 2))
  const y = (v: number) => H - PAD_B - (v / niceMax) * (H - PAD_T - PAD_B)

  const linePath = (vals: number[]) =>
    vals.length === 0
      ? ''
      : vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const line = linePath(values)
  const area =
    n > 1 ? `${line} L${x(n - 1).toFixed(1)},${H - PAD_B} L${x(0).toFixed(1)},${H - PAD_B} Z` : ''

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // The dashboard is RTL, but the SVG axis is not — the series always runs
    // left→right in visual order, so map from the physical left edge.
    const px = e.clientX - rect.left
    const ratio = (px - PAD_X) / Math.max(1, rect.width - PAD_X * 2)
    const idx = Math.round(ratio * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, idx)))
  }

  const hasData = values.some((v) => v > 0)
  const point = hover != null ? series[hover] : null
  const prevPoint = hover != null ? prevSeries[hover] : null

  return (
    <div className="rounded-2xl border border-token bg-white p-4 sm:p-5">
      {/* Metric switcher */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-0.5 rounded-full border border-token bg-surface/60 p-0.5"
          role="tablist"
          aria-label="اختر المقياس"
        >
          {(Object.keys(METRIC_LABEL) as MetricKey[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={metric === m}
              onClick={() => onMetricChange(m)}
              className={
                'rounded-full px-3 py-1 text-[12px] font-medium transition ' +
                (metric === m ? 'bg-foreground text-white shadow-sm' : 'text-muted hover:text-foreground')
              }
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
        {showPrev && (
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <svg width="18" height="6" aria-hidden>
              <line x1="0" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
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
          className="block touch-none"
          role="img"
          aria-label={`${METRIC_LABEL[metric]} عبر الوقت`}
        >
          <defs>
            <linearGradient id="zy-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines + y labels */}
          {[0, 0.5, 1].map((g) => {
            const gy = H - PAD_B - g * (H - PAD_T - PAD_B)
            return (
              <g key={g}>
                <line
                  x1={PAD_X} x2={width - PAD_X} y1={gy} y2={gy}
                  stroke="rgba(28,28,28,0.07)" strokeWidth="1" shapeRendering="crispEdges"
                />
                <text
                  x={width - PAD_X} y={gy - 4} textAnchor="end"
                  className="fill-[color:var(--muted)] text-[10px] tabular-nums"
                >
                  {Math.round(niceMax * g).toLocaleString('ar')}
                </text>
              </g>
            )
          })}

          {showPrev && prevValues.length > 1 && (
            <path
              d={linePath(prevValues)}
              fill="none"
              stroke="rgba(28,28,28,0.28)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeLinejoin="round"
            />
          )}

          {area && <path d={area} fill="url(#zy-area)" />}
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

          {/* single-point ranges still deserve a visible mark */}
          {n === 1 && <circle cx={x(0)} cy={y(values[0])} r="3.5" fill="#5e6ad2" />}

          {hover != null && (
            <g>
              <line
                x1={x(hover)} x2={x(hover)} y1={PAD_T - 6} y2={H - PAD_B}
                stroke="rgba(94,106,210,0.35)" strokeWidth="1"
              />
              <circle cx={x(hover)} cy={y(values[hover] ?? 0)} r="4" fill="#5e6ad2" stroke="#fff" strokeWidth="2" />
            </g>
          )}

          {/* x labels: first, middle, last only — more would collide */}
          {n > 1 &&
            [0, Math.floor((n - 1) / 2), n - 1].map((i, k) => (
              <text
                key={k}
                x={x(i)}
                y={H - 8}
                textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}
                className="fill-[color:var(--muted)] text-[10px] tabular-nums"
              >
                {shortDate(series[i]?.date)}
              </text>
            ))}
        </svg>

        {/* Tooltip. Positioned as a percentage so it tracks the point at any width. */}
        {point && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-[132px] -translate-x-1/2 rounded-lg border border-token bg-white p-2.5 shadow-lg"
            style={{ left: `${(x(hover!) / width) * 100}%` }}
          >
            <div className="text-[11px] font-medium text-muted">{fullDate(point.date)}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[16px] font-bold tabular-nums text-foreground">
                {(point[metric] ?? 0).toLocaleString('ar')}
              </span>
              <span className="text-[11px] text-muted">{METRIC_LABEL[metric]}</span>
            </div>
            {showPrev && prevPoint && (
              <div className="mt-0.5 text-[11px] tabular-nums text-muted">
                السابق: {(prevPoint[metric] ?? 0).toLocaleString('ar')}
              </div>
            )}
          </div>
        )}

        {!hasData && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="max-w-xs rounded-lg bg-white/80 px-3 py-2 text-center text-[12.5px] text-muted backdrop-blur-sm">
              لا مشاهدات في هذه المدة. جرّب مدة أطول، أو شارك رابط موقعك لتبدأ الزيارات.
            </p>
          </div>
        )}
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
