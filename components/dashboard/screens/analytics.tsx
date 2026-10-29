'use client'

import { useMemo, type ReactNode } from 'react'
import { Timer } from 'lucide-react'
import { Spark } from '@/components/dashboard/analytics/AreaChart'
import type { Row } from '@/components/dashboard/analytics/types'
import { Page, PageHead } from './kit'
import {
  DayNav, METRIC_LABEL, Seg, TrafficChart, agoName, deltaTxt, fmt, weekly,
  type TMetric, type TRange, type TrafficData,
} from './traffic'

export type MetricKey = TMetric
/** The analytics page reaches a year back; the home card stops at 90 days. */
export type RangeKey = TRange | '12mo'

export const RANGE_LABEL: Record<RangeKey, string> = {
  day: 'يوم', '7d': '7 أيام', '30d': '30 يومًا', '90d': '90 يومًا', '12mo': 'سنة',
}

export type AnalyticsScreenProps = {
  metric: MetricKey
  setMetric: (m: MetricKey) => void
  range: RangeKey
  setRange: (r: RangeKey) => void
  /** Days before today, when the range is one day. */
  back: number
  setBack: (b: number) => void
  traffic: TrafficData | null
  channels: Row[]
  pages: Row[]
  avgDuration: string
  avgDurationDelta: number | null
  /** Google's numbers (see ./search-console). */
  searchConsole?: ReactNode
}

const TILES: Array<{ m: MetricKey; sub: string }> = [
  { m: 'visitors', sub: 'أشخاص مختلفون' },
  { m: 'sessions', sub: 'زيارات منفصلة' },
  { m: 'views', sub: 'صفحات مفتوحة' },
  { m: 'events', sub: 'واتساب · هاتف · حجز' },
]

/** The page's own words for a few paths; anything else shows as written. */
const PAGE_NAME: Record<string, string> = { '/': 'الصفحة الرئيسية' }

export function AnalyticsScreen({
  metric, setMetric, range, setRange, back, setBack, traffic: raw, channels, pages,
  avgDuration, avgDurationDelta, searchConsole,
}: AnalyticsScreenProps) {
  const day = range === 'day'
  // A year reads as weeks; totals and deltas are the year's either way.
  const traffic = useMemo(() => (raw && range === '12mo' ? weekly(raw) : raw), [raw, range])
  const period = day ? (back === 0 ? 'اليوم حتى الآن' : agoName(back)) : `آخر ${RANGE_LABEL[range]}`
  const pickDay = (b: number) => { setBack(b); setRange('day') }
  return (
    <Page>
      <PageHead
        title="التحليلات"
        sub="كل ما يحدث على مواقعك المنشورة: من زارها، ومن أين أتى، وماذا فعل."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Seg
          label="المدة"
          items={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => [k, RANGE_LABEL[k]] as [RangeKey, string])}
          value={range}
          onChange={(r) => { if (r === 'day') setBack(0); setRange(r) }}
        />
      </div>
      {day && <div className="-mt-2 mb-4"><DayNav back={back} onBack={setBack} /></div>}

      <section className="zb-tiles" aria-label="الأرقام">
        {TILES.map(({ m, sub }, i) => {
          const x = traffic?.deltas[m] ?? null
          return (
            <button
              key={m}
              type="button"
              className="zb-stat zb-rv"
              style={{ ['--i' as string]: i }}
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
            >
              <span className="zb-stat-top">
                <span>{METRIC_LABEL[m]}</span>
                <span className="zb-delta" data-dn={x != null && x < 0 ? '' : undefined}>{deltaTxt(x)}</span>
              </span>
              <span className="zb-stat-row">
                <span className="zb-stat-v">{traffic ? fmt(traffic.totals[m]) : '—'}</span>
                {traffic && <Spark values={traffic.values[m]} />}
              </span>
              <small>{sub}</small>
            </button>
          )
        })}
      </section>

      <article className="zb-card zb-rv mt-4" style={{ ['--i' as string]: 4 }}>
        <div className="zb-card-h" style={{ marginBottom: 0 }}>
          <div className="min-w-0">
            <h2 className="zb-h2">{METRIC_LABEL[metric]}</h2>
            <div className="zb-small">{period}</div>
          </div>
        </div>
        {traffic ? (
          <TrafficChart data={traffic} metric={metric} range={day ? 'day' : '30d'} back={back} onPickDay={pickDay} />
        ) : (
          <div className="zb-chart" aria-hidden="true" />
        )}
      </article>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="zb-card zb-rv" style={{ ['--i' as string]: 5 }}>
          <div className="zb-card-h">
            <h2 className="zb-h2">من أين يأتون</h2>
            <span className="zb-small">{period}</span>
          </div>
          <Bars rows={channels} />
        </article>
        <article className="zb-card zb-rv" style={{ ['--i' as string]: 6 }}>
          <div className="zb-card-h">
            <h2 className="zb-h2">أهم الصفحات</h2>
            <span className="zb-small">{period}</span>
          </div>
          <Bars rows={pages.map((p) => ({ ...p, name: PAGE_NAME[p.name] || p.name }))} tone="blue" />
        </article>
      </div>

      <article className="zb-card zb-rv mt-4 flex flex-wrap items-center gap-x-6 gap-y-2" style={{ ['--i' as string]: 7 }}>
        <span className="zb-tile"><Timer strokeWidth={2} /></span>
        <div className="min-w-0">
          <div className="zb-small">متوسط مدة الزيارة</div>
          <div className="zb-h2 zb-num">{avgDuration}</div>
        </div>
        <span className="zb-delta" data-dn={avgDurationDelta != null && avgDurationDelta < 0 ? '' : undefined}>{deltaTxt(avgDurationDelta)}</span>
        <span className="zb-small">زيارات الروبوتات لا تُحسب في هذه الأرقام.</span>
      </article>

      {searchConsole}
    </Page>
  )
}

function Bars({ rows, tone }: { rows: Row[]; tone?: 'blue' }) {
  const top = rows.slice(0, 5)
  if (!top.length) return <div className="zb-empty">لا زيارات في هذه المدة بعد.</div>
  const max = Math.max(...top.map((r) => r.views), 1)
  const total = rows.reduce((a, r) => a + r.views, 0) || 1
  return (
    <div className="zb-bars" data-tone={tone}>
      {top.map((r, k) => (
        <div key={r.name} style={{ ['--w' as string]: `${((r.views / max) * 100).toFixed(1)}%`, ['--k' as string]: k }}>
          <span dir="auto">{r.name}</span>
          <b className="zb-num">{fmt(r.views)}<small>{Math.round((r.views / total) * 100)}%</small></b>
        </div>
      ))}
    </div>
  )
}
