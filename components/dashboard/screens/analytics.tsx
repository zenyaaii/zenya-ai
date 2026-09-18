'use client'

import { BarChart3, Eye, LogOut, MousePointerClick, Timer, Users } from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import TrendChart from '@/components/dashboard/analytics/TrendChart'
import { BarList, Delta, Tile } from '@/components/dashboard/analytics/primitives'
import type { Row, SeriesPoint } from '@/components/dashboard/analytics/types'
import { Page, PageHead } from './kit'

export type MetricKey = 'views' | 'visitors' | 'sessions' | 'events'
export type RangeKey = '24h' | '7d' | '30d' | '90d' | '12mo'

export const RANGE_LABEL: Record<RangeKey, string> = {
  '24h': '24 ساعة', '7d': '7 أيام', '30d': '30 يومًا', '90d': '90 يومًا', '12mo': 'سنة',
}

export type AnalyticsScreenProps = {
  metric: MetricKey
  setMetric: (m: MetricKey) => void
  range: RangeKey
  setRange: (r: RangeKey) => void
  totals: Record<MetricKey, number>
  deltas: Record<MetricKey, number | null>
  series: SeriesPoint[]
  prevSeries: SeriesPoint[]
  channels: Row[]
  pages: Row[]
  avgDuration: string
  avgDurationDelta: number | null
}

export function AnalyticsScreen({
  metric, setMetric, range, setRange, totals, deltas, series, prevSeries, channels, pages,
  avgDuration, avgDurationDelta,
}: AnalyticsScreenProps) {
  return (
    <Page>
      <PageHead
        title="التحليلات"
        sub="كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا."
        icon={BarChart3}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented
          label="اختر المدة"
          value={range}
          onChange={setRange}
          items={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ key: k, label: RANGE_LABEL[k] }))}
        />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="الزوّار" value={totals.visitors.toLocaleString('ar')} icon={Users}
          delta={deltas.visitors} sub="أشخاص مختلفون" spark={series.map((s) => s.visitors)}
          active={metric === 'visitors'} onClick={() => setMetric('visitors')} />
        <Tile label="الجلسات" value={totals.sessions.toLocaleString('ar')} icon={LogOut}
          delta={deltas.sessions} sub="زيارات منفصلة"
          active={metric === 'sessions'} onClick={() => setMetric('sessions')} />
        <Tile label="المشاهدات" value={totals.views.toLocaleString('ar')} icon={Eye}
          delta={deltas.views} sub="صفحات مفتوحة"
          active={metric === 'views'} onClick={() => setMetric('views')} />
        <Tile label="التواصل" value={totals.events.toLocaleString('ar')} icon={MousePointerClick}
          delta={deltas.events} sub="واتساب · هاتف · حجز"
          active={metric === 'events'} onClick={() => setMetric('events')} />
      </section>

      <div className="mt-5">
        <TrendChart
          series={series} prevSeries={prevSeries}
          metric={metric} onMetricChange={setMetric}
          showPrev compareLabel="المدة السابقة"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl zy-card">
          <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-4">
            <h3 className="zy-h3">من أين يأتون</h3>
            <span className="shrink-0 text-[14.5px] font-medium text-[#66666e]">آخر {RANGE_LABEL[range]}</span>
          </div>
          <BarList rows={channels} max={5} />
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl zy-card">
          <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-4">
            <h3 className="zy-h3">أهم الصفحات</h3>
            <span className="shrink-0 text-[14.5px] font-medium text-[#66666e]">{Math.min(pages.length, 5)} صفحات</span>
          </div>
          <BarList rows={pages} max={5} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl zy-card p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-2">
          <Timer className="h-4 w-4 shrink-0 text-[#66666e]" strokeWidth={2} />
          <span className="zy-sub">متوسط المدة {avgDuration}</span>
        </div>
        <Delta value={avgDurationDelta} />
      </div>
    </Page>
  )
}
