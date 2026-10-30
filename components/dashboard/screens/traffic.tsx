'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AreaChart from '@/components/dashboard/analytics/AreaChart'
import Odometer from '@/components/dashboard/analytics/Odometer'
import type { DayPayload, SeriesPoint } from '@/components/dashboard/analytics/types'

/**
 * Traffic, the way the home card and the analytics page show it: one number
 * that rolls, a chart of the period against the one before, and a range that
 * reaches down to a single day hour by hour.
 *
 * The screens stay presentational. A page fetches /api/analytics (a range of
 * days) or /api/analytics/day (one day by hour) and turns either answer into
 * a TrafficData with the two builders below; the demo builds the same shape
 * from its sample numbers.
 */

export type TMetric = 'views' | 'visitors' | 'sessions' | 'events'
export type TRange = 'day' | '7d' | '30d' | '90d'

export type TrafficData = {
  values: Record<TMetric, number[]>
  prev: Record<TMetric, number[]>
  totals: Record<TMetric, number>
  deltas: Record<TMetric, number | null>
  /** Places on the time axis: 24 for a day, one per day otherwise. */
  slots: number
  /** YYYY-MM-DD of each point, for a range of days (a week's first day when weekly). */
  dates: string[]
  /** Days per point: 1, or 7 once a year is folded into weeks. */
  step?: number
}

export const METRIC_LABEL: Record<TMetric, string> = {
  views: 'المشاهدات',
  visitors: 'الزوار',
  sessions: 'الجلسات',
  events: 'التواصل',
}

export const RANGE_ITEMS: Array<[TRange, string]> = [
  ['day', 'يوم'], ['7d', '7 أيام'], ['30d', '30 يومًا'], ['90d', '90 يومًا'],
]
const RANGE_LONG: Record<Exclude<TRange, 'day'>, string> = { '7d': '7 أيام', '30d': '30 يومًا', '90d': '90 يومًا' }

/** How far back the day view reaches (the API allows the same). */
export const DAY_MAX = 89

// ---- dates, in the reader's own calendar --------------------------------

export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
export const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

/** Noon of the day `back` days ago, local time (noon keeps DST out of it). */
export function dateAgo(back: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - back)
  return d
}
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const dayFull = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
/** «اليوم» / «أمس» / «الأحد 25 أكتوبر». */
export const agoName = (back: number) => (back === 0 ? 'اليوم' : back === 1 ? 'أمس' : dayFull(dateAgo(back)))
/** How many days before today a YYYY-MM-DD is. */
export function backOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(y, m - 1, d, 12)
  return Math.round((dateAgo(0).getTime() - t.getTime()) / 86_400_000)
}
const hh = (h: number) => `${String(h % 24).padStart(2, '0')}:00`
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
export const deltaTxt = (x: number | null) => (x == null ? '' : x < 0 ? `▼ ${Math.abs(Math.round(x))}%` : `▲ ${Math.round(x)}%`)

// ---- building the data ---------------------------------------------------

const METRICS: TMetric[] = ['views', 'visitors', 'sessions', 'events']
const pick = (rows: SeriesPoint[], m: TMetric) => rows.map((r) => Number(r[m]) || 0)

/** From /api/analytics: a range of days. */
export function trafficFromRange(p: {
  series: SeriesPoint[]
  prev_series: SeriesPoint[]
  totals: Record<TMetric, number>
  delta: Record<string, number | null>
}): TrafficData {
  const out = { values: {}, prev: {}, totals: {}, deltas: {} } as TrafficData
  for (const m of METRICS) {
    out.values[m] = pick(p.series, m)
    out.prev[m] = pick(p.prev_series, m)
    out.totals[m] = Number(p.totals[m]) || 0
    out.deltas[m] = p.delta[m] ?? null
  }
  out.slots = p.series.length
  out.dates = p.series.map((s) => s.date)
  return out
}

/** From /api/analytics/day: one day by hour, today only as far as now. */
export function trafficFromDay(d: DayPayload): TrafficData {
  const out = { values: {}, prev: {}, totals: {}, deltas: {} } as TrafficData
  for (const m of METRICS) {
    out.values[m] = d.hours[m].slice(0, d.upto)
    out.prev[m] = d.prev_hours[m]
    out.totals[m] = d.totals[m]
    out.deltas[m] = d.delta[m]
  }
  out.slots = 24
  out.dates = []
  return out
}

/**
 * A year of days folded into weeks, counted back from today so the newest
 * point is the last seven days. 365 daily points are noise on a phone; 52
 * weeks are a shape. A week is summed, and so is its comparison.
 */
export function weekly(d: TrafficData): TrafficData {
  // Whole weeks only: a stub of a day or two at the old end would draw a cliff.
  const fold = (arr: number[]) => {
    const out: number[] = []
    for (let end = arr.length; end >= 7; end -= 7) out.unshift(arr.slice(end - 7, end).reduce((a, b) => a + b, 0))
    return out
  }
  const dates: string[] = []
  for (let end = d.dates.length; end >= 7; end -= 7) dates.unshift(d.dates[end - 7])
  const out = { ...d, values: {}, prev: {} } as TrafficData
  for (const m of METRICS) {
    out.values[m] = fold(d.values[m])
    out.prev[m] = fold(d.prev[m])
  }
  out.slots = dates.length
  out.dates = dates
  out.step = 7
  return out
}

// ---- controls ------------------------------------------------------------

/** Keeps a sliding highlight under whichever button is pressed. */
function useIndicator(dep: unknown) {
  const box = useRef<HTMLDivElement>(null)
  const ind = useRef<HTMLSpanElement>(null)
  const place = useCallback(() => {
    const on = box.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const p = ind.current
    if (!on || !p || !box.current?.offsetParent) return
    p.style.width = `${on.offsetWidth}px`
    p.style.height = `${on.offsetHeight}px`
    p.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`
  }, [])
  useLayoutEffect(place, [dep, place])
  useEffect(() => {
    const ro = new ResizeObserver(place)
    if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [place])
  return { box, ind }
}

export function Seg<T extends string>({
  items, value, onChange, label,
}: {
  items: Array<[T, string]>
  value: T
  onChange: (v: T) => void
  label: string
}) {
  const { box, ind } = useIndicator(value)
  return (
    <div ref={box} className="zb-seg" role="group" aria-label={label}>
      <span ref={ind} className="zb-seg-ind" aria-hidden="true" />
      {items.map(([v, t]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => v !== value && onChange(v)}>
          {t}
        </button>
      ))}
    </div>
  )
}

/** Older day on the right, newer on the left, like the chart. */
export function DayNav({ back, onBack, rtl = true }: { back: number; onBack: (b: number) => void; rtl?: boolean }) {
  const Older = rtl ? ChevronRight : ChevronLeft
  const Newer = rtl ? ChevronLeft : ChevronRight
  return (
    <div className="zb-daynav">
      <button type="button" className="zb-st" aria-label="اليوم السابق" disabled={back >= DAY_MAX} onClick={() => onBack(Math.min(DAY_MAX, back + 1))}>
        <Older strokeWidth={2.2} />
      </button>
      <b className="zb-dn-t" aria-live="polite">{agoName(back)}</b>
      <button type="button" className="zb-st" aria-label="اليوم التالي" disabled={back === 0} onClick={() => onBack(Math.max(0, back - 1))}>
        <Newer strokeWidth={2.2} />
      </button>
      {back > 0 && <button type="button" className="zb-btn zb-dn-today" onClick={() => onBack(0)}>اليوم</button>}
    </div>
  )
}

// ---- the readout under the big number -----------------------------------

function useHover() {
  const [hover, setHover] = useState(true)
  useEffect(() => { setHover(window.matchMedia('(hover: hover)').matches) }, [])
  return hover
}

export function pointLabel(data: TrafficData, range: TRange, i: number): string {
  if (range === 'day') return `من ${hh(i)} إلى ${hh(i + 1)}`
  const date = data.dates[i]
  if (!date) return ''
  const back = backOf(date)
  if ((data.step || 1) > 1) {
    const w = dateAgo(back)
    return `أسبوع ${w.getDate()} ${MONTHS[w.getMonth()]}${w.getFullYear() !== dateAgo(0).getFullYear() ? ` ${w.getFullYear()}` : ''}`
  }
  return back === 0 ? 'اليوم' : back === 1 ? 'أمس' : dayFull(dateAgo(back))
}

/** The chart with its readout, axis and legend: shared by home and analytics. */
export function TrafficChart({
  data, metric, range, back, onPickDay, rtl = true, readout,
}: {
  data: TrafficData
  metric: TMetric
  range: TRange
  back: number
  /** Tapping a day on a range of days opens it hour by hour. */
  onPickDay?: (back: number) => void
  rtl?: boolean
  /** Where the scrub readout is printed; the chart prints it itself when absent. */
  readout?: (text: ReactNode) => void
}) {
  const hover = useHover()
  const day = range === 'day'
  const weeks = (data.step || 1) > 1
  // A week has no single day to open.
  const pickDay = weeks ? undefined : onPickDay
  const hint = day
    ? (hover ? 'مرّر على الرسم لترى كل ساعة' : 'المس الرسم لترى كل ساعة')
    : weeks
      ? (hover ? 'مرّر على الرسم لترى كل أسبوع' : 'المس الرسم لترى كل أسبوع')
      : pickDay
      ? (hover ? 'مرّر لترى كل يوم، واضغط على يوم لترى ساعاته' : 'المس الرسم لترى كل يوم، واضغط على يوم لترى ساعاته')
      : (hover ? 'مرّر على الرسم لترى كل يوم' : 'المس الرسم لترى كل يوم')
  const [own, setOwn] = useState<ReactNode>(hint)
  const say = readout || setOwn
  useEffect(() => { say(hint) }, [hint]) // eslint-disable-line react-hooks/exhaustive-deps

  const values = data.values[metric]
  const axis = day
    ? [0, 6, 12, 18, 23].map(hh)
    : data.dates.length > 2
      ? [pointLabel(data, range, 0), pointLabel(data, range, Math.floor((data.dates.length - 1) / 2)), pointLabel(data, range, data.dates.length - 1)]
      : []
  return (
    <>
      {!readout && <div className="zb-scrub" aria-live="polite">{own}</div>}
      <AreaChart
        values={values}
        prev={data.prev[metric]?.length ? data.prev[metric] : null}
        slots={data.slots}
        rtl={rtl}
        onScrub={(i) => say(<><b className="zb-num">{fmt(values[i] ?? 0)}</b> · {pointLabel(data, range, i)}</>)}
        onLeave={() => say(hint)}
        onPick={!day && pickDay ? (i) => { const b = data.dates[i] ? backOf(data.dates[i]) : -1; if (b >= 0 && b <= DAY_MAX) pickDay(b) } : undefined}
      />
      {axis.length > 0 && <div className="zb-axis" aria-hidden="true">{axis.map((a, k) => <span key={k} className="zb-num">{a}</span>)}</div>}
      <div className="zb-legend">
        <span><i />{day ? agoName(back) : 'هذه المدة'}</span>
        <span><i data-prev="" />{day ? 'نفس اليوم قبل أسبوع' : 'المدة السابقة'}</span>
      </div>
    </>
  )
}

// ---- the home card --------------------------------------------------------

const HOME_METRICS: TMetric[] = ['views', 'visitors', 'events']

/**
 * The traffic card on the home screen: three numbers as tabs, the range, the
 * big rolling figure for the chosen one, and its chart.
 */
export function TrafficCard({
  data, metric, onMetric, range, onRange, back, onBack, rtl = true,
}: {
  data: TrafficData | null
  metric: TMetric
  onMetric: (m: TMetric) => void
  range: TRange
  onRange: (r: TRange) => void
  back: number
  onBack: (b: number) => void
  rtl?: boolean
}) {
  const { box, ind } = useIndicator(`${metric}|${data ? 1 : 0}`)
  const [readout, setReadout] = useState<ReactNode>('')
  const day = range === 'day'
  const note = back === 0 ? 'اليوم حتى الآن' : back === 1 ? 'أمس' : `يوم ${agoName(back)}`

  return (
    <>
      <div className="zb-statbar">
        <div ref={box} className="zb-mtabs" role="group" aria-label="اختر الرقم">
          <span ref={ind} className="zb-mp" aria-hidden="true" />
          {HOME_METRICS.map((m) => {
            const x = data?.deltas[m] ?? null
            return (
              <button key={m} type="button" className="zb-mtab" aria-pressed={m === metric} onClick={() => onMetric(m)}>
                <small>{METRIC_LABEL[m]}</small>
                <b>{data ? fmt(data.totals[m]) : '—'}</b>
                <em data-dn={x != null && x < 0 ? '' : undefined}>{deltaTxt(x)}</em>
              </button>
            )
          })}
        </div>
        <Seg label="المدة" items={RANGE_ITEMS} value={range} onChange={(r) => { if (r === 'day') onBack(0); onRange(r) }} />
      </div>
      {day && <DayNav back={back} onBack={onBack} rtl={rtl} />}
      <div className="zb-bigline">
        <div>
          <Odometer value={data ? data.totals[metric] : 0} />
          <div className="zb-lab">
            {METRIC_LABEL[metric]} {day ? note : `في آخر ${RANGE_LONG[range as Exclude<TRange, 'day'>]}`}
          </div>
        </div>
        <div className="zb-scrub" aria-live="polite">{readout}</div>
      </div>
      {data && (
        <TrafficChart
          data={data} metric={metric} range={range} back={back} rtl={rtl} readout={setReadout}
          onPickDay={(b) => { onBack(b); onRange('day') }}
        />
      )}
    </>
  )
}
