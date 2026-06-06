'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Analytics = {
  generated_at: string
  window_days: number
  totals: { users: number; themes: number; published_themes: number; live_domains: number }
  plan_breakdown: Record<string, number>
  purchases: { count_paid: number; count_refunded: number; gross_revenue_cents: number }
  hosting: { active_count: number; mrr_cents: number; churned_30d: number }
  pageviews_30d: number
  event_counts_30d: Record<string, number>
  series: Array<{ date: string; generated: number; published: number; purchased: number; viewed: number }>
  recent_events: Array<{ event_type: string; created_at: string; metadata: any }>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async (r) => {
        if (r.status === 403) {
          setError('Admin-only. Your account does not have plan=admin.')
          return
        }
        if (!r.ok) {
          setError(`Failed to load (${r.status})`)
          return
        }
        setData(await r.json())
      })
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-muted">Loading analytics…</main>
    )
  }
  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/dashboard" className="text-sm text-muted hover:underline">← Dashboard</Link>
        <div className="mt-6 rounded-lg border border-token bg-white p-6 text-sm text-foreground">
          {error}
        </div>
      </main>
    )
  }
  if (!data) return null

  const maxSeries = Math.max(
    1,
    ...data.series.flatMap((s) => [s.generated, s.published, s.purchased])
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-baseline justify-between border-b border-token pb-4">
        <div>
          <Link href="/dashboard" className="text-xs text-muted hover:underline">← Dashboard</Link>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-xs text-muted">Last 30 days · regenerated on load</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md border border-token px-3 py-1.5 text-xs font-medium text-muted hover:bg-black/5"
        >
          Refresh
        </button>
      </div>

      {/* Headline numbers */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total users"       value={data.totals.users} />
        <Stat label="Themes generated"  value={data.totals.themes} />
        <Stat label="Published sites"   value={data.totals.published_themes} />
        <Stat label="Live custom domains" value={data.totals.live_domains} />
      </section>

      {/* Revenue */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="30-day gross"
          value={`$${(data.purchases.gross_revenue_cents / 100).toFixed(2)}`}
          sub={`${data.purchases.count_paid} paid · ${data.purchases.count_refunded} refunded`}
        />
        <Stat
          label="Hosting MRR"
          value={`$${(data.hosting.mrr_cents / 100).toFixed(2)}/mo`}
          sub={`${data.hosting.active_count} active · ${data.hosting.churned_30d} churned (30d)`}
        />
        <Stat label="Pageviews (30d)" value={data.pageviews_30d.toLocaleString()} />
      </section>

      {/* Plan breakdown */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Plan breakdown</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data.plan_breakdown).map(([plan, n]) => (
            <span key={plan} className="rounded-full border border-token bg-white px-3 py-1 text-xs font-medium text-foreground">
              {plan}: <span className="text-primary">{n}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Time series — simple bars */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Daily funnel (30 days)</h2>
        <div className="mt-3 grid grid-cols-30 gap-px overflow-x-auto rounded-lg border border-token bg-white p-4" style={{ gridTemplateColumns: `repeat(${data.series.length}, minmax(18px, 1fr))` }}>
          {data.series.map((s) => (
            <div key={s.date} className="flex flex-col items-center" title={`${s.date}\ngenerated: ${s.generated}\npublished: ${s.published}\npurchased: ${s.purchased}`}>
              <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <div title={`generated ${s.generated}`} style={{ width: 4, height: `${(s.generated / maxSeries) * 80}px`, background: '#5e6ad2' }} />
                <div title={`published ${s.published}`} style={{ width: 4, height: `${(s.published / maxSeries) * 80}px`, background: '#15803d' }} />
                <div title={`purchased ${s.purchased}`} style={{ width: 4, height: `${(s.purchased / maxSeries) * 80}px`, background: '#c8a96a' }} />
              </div>
              <div className="mt-1 text-[9px] text-muted">{s.date.slice(5)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span><span className="inline-block h-2 w-2 rounded-sm" style={{ background: '#5e6ad2' }} /> generated</span>
          <span><span className="inline-block h-2 w-2 rounded-sm" style={{ background: '#15803d' }} /> published</span>
          <span><span className="inline-block h-2 w-2 rounded-sm" style={{ background: '#c8a96a' }} /> purchased</span>
        </div>
      </section>

      {/* Event counts */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Event counts (30d)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(data.event_counts_30d).sort(([, a], [, b]) => b - a).map(([type, n]) => (
            <div key={type} className="flex items-center justify-between rounded-md border border-token bg-white px-3 py-2 text-xs">
              <code className="text-foreground">{type}</code>
              <span className="font-semibold text-primary">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent events */}
      <section className="mt-10 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent activity (latest 50)</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-token bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface">
              <tr>
                <th className="px-3 py-2 font-semibold text-muted">Time</th>
                <th className="px-3 py-2 font-semibold text-muted">Event</th>
                <th className="px-3 py-2 font-semibold text-muted">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_events.map((e, i) => (
                <tr key={i} className="border-t border-token">
                  <td className="px-3 py-2 text-muted">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2"><code>{e.event_type}</code></td>
                  <td className="px-3 py-2 max-w-md truncate text-muted">{JSON.stringify(e.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border border-token bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}
