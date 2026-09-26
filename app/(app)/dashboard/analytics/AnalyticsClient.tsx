'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDuration } from '@/lib/analytics-core'
import { AnalyticsScreen, type MetricKey, type RangeKey } from '@/components/dashboard/screens/analytics'
import { EmptyHint, Page, PageHead } from '@/components/dashboard/screens/kit'
import { GscNumbers, type GscQuery, type GscTotals } from '@/components/dashboard/screens/search-console'
import type { AnalyticsPayload } from '@/components/dashboard/analytics/types'

type GscView = {
  status: 'off' | 'disconnected' | 'loading' | 'missing' | 'not_published' | 'ok' | 'error'
  totals?: GscTotals
  queries?: GscQuery[]
}

/** Analytics: the demo's analytics screen, on the owner's real traffic. */
export default function AnalyticsClient() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [metric, setMetric] = useState<MetricKey>('views')
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [error, setError] = useState(false)
  const [gscSite, setGscSite] = useState('')
  const [gsc, setGsc] = useState<GscView>({ status: 'loading' })

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

  // Search Console is per site, and only a published site is in Google.
  const gscSites = useMemo(
    () => (data?.sites ?? []).filter((s) => s.is_published && s.slug).map((s) => ({ id: s.id, name: s.name })),
    [data?.sites],
  )
  const activeGscSite = gscSites.some((s) => s.id === gscSite) ? gscSite : gscSites[0]?.id ?? ''

  useEffect(() => {
    if (!data) return
    let cancelled = false
    const set = (v: GscView) => { if (!cancelled) setGsc(v) }
    ;(async () => {
      try {
        const st = await fetch('/api/gsc/status', { cache: 'no-store' }).then((r) => r.json())
        if (!st?.configured || !activeGscSite) return set({ status: 'off' })
        if (!st.connected) return set({ status: 'disconnected' })
        set({ status: 'loading' })
        const p = await fetch(`/api/gsc/performance?themeId=${encodeURIComponent(activeGscSite)}`, { cache: 'no-store' })
          .then((r) => r.json())
        if (p?.connected === false) return set({ status: 'disconnected' })
        if (p?.reason === 'property_not_found') return set({ status: 'missing' })
        if (p?.reason === 'not_published') return set({ status: 'not_published' })
        if (!p?.totals) return set({ status: 'error' })
        set({ status: 'ok', totals: p.totals, queries: p.queries ?? [] })
      } catch {
        set({ status: 'error' })
      }
    })()
    return () => { cancelled = true }
  }, [!!data, activeGscSite]) // eslint-disable-line react-hooks/exhaustive-deps

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
      searchConsole={
        <GscNumbers
          status={gsc.status}
          sites={gscSites}
          selectedId={activeGscSite}
          onSelect={setGscSite}
          totals={gsc.totals}
          queries={gsc.queries}
          toSeo={{ href: '/dashboard/seo' }}
        />
      }
    />
  )
}
