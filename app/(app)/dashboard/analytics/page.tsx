'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3, Eye, Folder, Globe, TrendingUp, RefreshCw,
  ArrowUpRight, ExternalLink,
} from 'lucide-react'

type Analytics = {
  generated_at: string
  totals: {
    themes: number
    published_themes: number
    live_domains: number
    lifetime_views: number
    views_30d: number
    views_7d: number
  }
  series: Array<{ date: string; views: number }>
  per_site: Array<{
    id: string
    product_name: string
    slug: string | null
    is_published: boolean
    template_type: string
    lifetime_views: number
    views_30d: number
    last_viewed_at: string | null
    created_at: string
  }>
  top_referrers: Array<{ name: string; count: number }>
  top_countries: Array<{ name: string; count: number }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(silent = false) {
    if (silent) setRefreshing(true)
    try {
      const r = await fetch('/api/analytics', { cache: 'no-store' })
      if (!r.ok) {
        setError(`Failed to load analytics (${r.status})`)
        return
      }
      setData(await r.json())
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SkeletonHeader />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonTile key={i} />)}
        </div>
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-token bg-white" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl border border-token bg-white p-8 text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
          <h2 className="mt-3 text-[16px] font-semibold text-foreground">Couldn’t load analytics</h2>
          <p className="mt-1 text-[13px] text-muted">{error || 'Something went wrong.'}</p>
          <button
            onClick={() => { setLoading(true); load() }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12.5px] font-semibold text-white"
          >
            <RefreshCw className="h-3 w-3" /> Try again
          </button>
        </div>
      </div>
    )
  }

  const t = data.totals
  const maxSeries = Math.max(1, ...data.series.map((s) => s.views))
  const hasAnyViews = t.lifetime_views > 0 || t.views_30d > 0

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5"
      >
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-[13px] text-muted">
            Pageviews and traffic across all of your live Zenya sites · last 30 days.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-black/5"
        >
          <RefreshCw className={'h-3 w-3 ' + (refreshing ? 'animate-spin' : '')} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </motion.header>

      {/* Headline tiles */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Pageviews (7d)" value={t.views_7d.toLocaleString()} sub={t.views_7d > 0 ? 'last 7 days' : 'no views yet'} icon={Eye} accent="#5e6ad2" />
        <Tile label="Pageviews (30d)" value={t.views_30d.toLocaleString()} sub="last 30 days" icon={TrendingUp} accent="#15803d" />
        <Tile label="Total sites" value={t.themes.toLocaleString()} sub={`${t.published_themes} live · ${t.live_domains} custom domain${t.live_domains === 1 ? '' : 's'}`} icon={Folder} accent="#c8a96a" />
        <Tile label="Lifetime views" value={t.lifetime_views.toLocaleString()} sub="across all sites" icon={Globe} accent="#9b6f00" />
      </section>

      {/* Chart */}
      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Daily pageviews</h2>
          <span className="text-[11.5px] text-muted">last 30 days</span>
        </div>
        <div className="rounded-2xl border border-token bg-white p-5">
          {hasAnyViews ? (
            <>
              <div
                className="grid items-end gap-px overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${data.series.length}, minmax(0, 1fr))`, height: 180 }}
              >
                {data.series.map((s) => {
                  const h = (s.views / maxSeries) * 160
                  return (
                    <div key={s.date} className="group relative flex items-end justify-center">
                      <div
                        className="w-full rounded-t-sm transition-colors"
                        style={{
                          height: `${Math.max(2, h)}px`,
                          background:
                            s.views === 0
                              ? 'rgba(28,28,28,0.06)'
                              : 'linear-gradient(180deg, #5e6ad2 0%, #4a55b8 100%)',
                        }}
                        title={`${s.date}: ${s.views} views`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex justify-between text-[10.5px] text-muted">
                <span>{data.series[0]?.date.slice(5)}</span>
                <span>{data.series[Math.floor(data.series.length / 2)]?.date.slice(5)}</span>
                <span>{data.series[data.series.length - 1]?.date.slice(5)}</span>
              </div>
            </>
          ) : (
            <EmptyChartHint />
          )}
        </div>
      </section>

      {/* Per-site breakdown */}
      <section className="mt-10">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Per-site breakdown</h2>
          <Link href="/dashboard/sites" className="text-[12px] font-medium text-primary hover:underline">
            Manage sites →
          </Link>
        </div>
        {data.per_site.length === 0 ? (
          <EmptyState
            title="No sites yet"
            body="Build a site, publish it to Zenya, and we’ll start tracking pageviews here."
            cta={{ href: '/theme/new', label: 'Create your first site' }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-token bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafaf7]">
                <tr>
                  <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Site</th>
                  <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Views (30d)</th>
                  <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Lifetime</th>
                  <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.per_site.map((s) => (
                  <tr key={s.id} className="border-t border-token">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[rgba(94,106,210,0.10)]">
                          <Folder className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{s.product_name}</div>
                          <div className="truncate text-[11.5px] text-muted">
                            {s.is_published && s.slug ? `zenyaai.co/s/${s.slug}` : `${s.template_type} · draft`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{s.views_30d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{s.lifetime_views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {s.is_published && s.slug ? (
                        <a
                          href={`/s/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#15803d]"
                        >
                          Live <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="inline-flex rounded-full bg-[rgba(217,119,6,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b45309]">
                          Draft
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top referrers + countries */}
      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <Card title="Top referrers" empty="No traffic sources yet">
          {data.top_referrers.length > 0 && (
            <BarList items={data.top_referrers} />
          )}
        </Card>
        <Card title="Top countries" empty="No country data yet">
          {data.top_countries.length > 0 && (
            <BarList items={data.top_countries} />
          )}
        </Card>
      </section>

      <p className="mt-10 text-center text-[11.5px] text-muted">
        Generated {new Date(data.generated_at).toLocaleString()} · pulled live from Supabase
      </p>
    </div>
  )
}

/* ─── tiny subcomponents ────────────────────────────────────────────────── */

function Tile({
  label, value, sub, icon: Icon, accent,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Folder
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-token bg-white p-5"
    >
      <div className="flex items-start justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${accent}1a` }}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} style={{ color: accent }} />
        </div>
      </div>
      <div className="mt-2 text-[24px] font-bold tracking-tight text-foreground tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
    </motion.div>
  )
}

function Card({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = !!(children && Array.isArray(children) ? children.length : children)
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      <div className="mt-3">
        {hasChildren ? children : (
          <div className="py-6 text-center text-[12.5px] text-muted">{empty}</div>
        )}
      </div>
    </div>
  )
}

function BarList({ items }: { items: Array<{ name: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.name} className="text-[12.5px]">
          <div className="flex items-baseline justify-between">
            <span className="truncate font-medium text-foreground">{i.name}</span>
            <span className="tabular-nums text-muted">{i.count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyChartHint() {
  return (
    <div className="grid place-items-center py-10 text-center">
      <div className="rounded-full bg-[rgba(94,106,210,0.10)] p-3">
        <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <p className="mt-3 max-w-xs text-[12.5px] text-muted">
        No pageviews yet. Once a visitor lands on a live site, you’ll see the daily curve fill in here.
      </p>
    </div>
  )
}

function EmptyState({
  title, body, cta,
}: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-token bg-white p-10 text-center">
      <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white"
        >
          {cta.label}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="border-b border-token pb-5">
      <div className="h-6 w-32 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
      <div className="mt-2 h-3 w-72 animate-pulse rounded bg-[rgba(28,28,28,0.04)]" />
    </div>
  )
}

function SkeletonTile() {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="h-2.5 w-20 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
      <div className="mt-3 h-6 w-24 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
      <div className="mt-2 h-2.5 w-28 animate-pulse rounded bg-[rgba(28,28,28,0.04)]" />
    </div>
  )
}
