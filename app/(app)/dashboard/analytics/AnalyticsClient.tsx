'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDuration } from '@/lib/analytics-core'
import { AnalyticsScreen, type MetricKey, type RangeKey } from '@/components/dashboard/screens/analytics'
import { EmptyHint, Page, PageHead } from '@/components/dashboard/screens/kit'
import type { AnalyticsPayload } from '@/components/dashboard/analytics/types'

/** Analytics: the demo's analytics screen, on the owner's real traffic. */
export default function AnalyticsClient() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [metric, setMetric] = useState<MetricKey>('views')
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [error, setError] = useState(false)

  // Days are bucketed in the owner's own timezone server-side.
  const tz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/analytics?${new URLSearchParams({ range, tz })}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => { if (!cancelled) { setData(j); setError(false) } })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [range, tz])

  if (error && !data) {
    return (
      <Page>
        <PageHead title="التحليلات" sub="كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا." />
        <EmptyHint>تعذّر تحميل التحليلات. أعد تحميل الصفحة بعد لحظات.</EmptyHint>
      </Page>
    )
  }
  if (!data) return null

  const t = data.totals
  const d = data.delta
  return (
    <AnalyticsScreen
      metric={metric}
      setMetric={setMetric}
      range={range}
      setRange={setRange}
      totals={{ views: t.views, sessions: t.sessions, visitors: t.visitors, events: t.events }}
      deltas={{ views: d.views, sessions: d.sessions, visitors: d.visitors, events: d.events }}
      series={data.series}
      prevSeries={data.prev_series}
      channels={data.channels}
      pages={data.pages.map((p) => ({ name: p.path, views: p.views, visitors: p.visitors, sessions: 0 }))}
      avgDuration={formatDuration(t.avg_duration_ms)}
      avgDurationDelta={d.avg_duration_ms}
    />
  )
}
