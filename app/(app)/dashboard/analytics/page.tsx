'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3, Eye, Folder, Globe, TrendingUp, RefreshCw,
  ArrowUpRight, ExternalLink, Users, DollarSign, Cpu, Repeat,
} from 'lucide-react'
import { publicSiteUrl, publicSiteHost } from '@/lib/portal-urls'

type Analytics = {
  generated_at: string
  is_admin?: boolean
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
  per_template: Array<{
    template: string
    sites: number
    published: number
    lifetime_views: number
    views_30d: number
  }>
  devices: Array<{ name: string; count: number }>
  ai_usage?: {
    calls: number
    total_tokens: number
    by_operation: Array<{ operation: string; calls: number; tokens: number }>
  }
  top_referrers: Array<{ name: string; count: number }>
  top_countries: Array<{ name: string; count: number }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [mode, setMode] = useState<'user' | 'admin'>('user')

  async function load(silent = false) {
    if (silent) setRefreshing(true)
    try {
      const r = await fetch('/api/analytics', { cache: 'no-store' })
      if (!r.ok) {
        setError(`تعذّر تحميل التحليلات (${r.status})`)
        return
      }
      setData(await r.json())
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'فشل التحميل')
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
          <h2 className="mt-3 text-[16px] font-semibold text-foreground">تعذّر تحميل التحليلات</h2>
          <p className="mt-1 text-[13px] text-muted">{error || 'حدث خطأ ما.'}</p>
          <button
            onClick={() => { setLoading(true); load() }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12.5px] font-semibold text-white"
          >
            <RefreshCw className="h-3 w-3" /> حاول مجددًا
          </button>
        </div>
      </div>
    )
  }

  const t = data.totals
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
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">
            {mode === 'admin' ? 'الإدارة · الأعمال' : 'التحليلات'}
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {mode === 'admin'
              ? 'مسار التحويل والإيرادات واقتصاديات الوحدة على مستوى الحساب · عرض المؤسس.'
              : 'مرات مشاهدة الصفحات وحركة الزوار عبر كل مواقعك المنشورة على زينيا · آخر 30 يومًا.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.is_admin && (
            <div className="flex items-center gap-0.5 rounded-full border border-token bg-surface/60 p-0.5">
              {(['user', 'admin'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={
                    'rounded-full px-3 py-1 text-[12px] font-medium transition ' +
                    (mode === m ? 'bg-foreground text-white shadow-sm' : 'text-muted hover:text-foreground')
                  }
                >
                  {m === 'user' ? 'مواقعي' : 'الإدارة'}
                </button>
              ))}
            </div>
          )}
          {mode === 'user' && (
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-black/5"
            >
              <RefreshCw className={'h-3 w-3 ' + (refreshing ? 'animate-spin' : '')} />
              {refreshing ? 'جارٍ التحديث…' : 'تحديث'}
            </button>
          )}
        </div>
      </motion.header>

      {mode === 'admin' && data.is_admin ? <AdminDashboard /> : (<>

      {/* Headline tiles */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="المشاهدات (7 أيام)" value={t.views_7d.toLocaleString()} sub={t.views_7d > 0 ? 'آخر 7 أيام' : 'لا مشاهدات بعد'} icon={Eye} accent="#5e6ad2" />
        <Tile label="المشاهدات (30 يومًا)" value={t.views_30d.toLocaleString()} sub="آخر 30 يومًا" icon={TrendingUp} accent="#15803d" />
        <Tile label="إجمالي المواقع" value={t.themes.toLocaleString()} sub={`${t.published_themes} منشور · ${t.live_domains} نطاق مخصص`} icon={Folder} accent="#c8a96a" />
        <Tile label="إجمالي المشاهدات" value={t.lifetime_views.toLocaleString()} sub="عبر كل المواقع" icon={Globe} accent="#9b6f00" />
      </section>

      {/* Chart */}
      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">المشاهدات اليومية</h2>
          <span className="text-[11.5px] text-muted">آخر 30 يومًا</span>
        </div>
        <div className="rounded-2xl border border-token bg-white p-5">
          {hasAnyViews ? <AreaChart series={data.series} /> : <EmptyChartHint />}
        </div>
      </section>

      {/* Per-template breakdown */}
      {data.per_template.length > 0 && (
        <section className="mt-10">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">حسب القالب</h2>
            <span className="text-[11.5px] text-muted">أي قالب يجذب الزوار</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-token bg-white">
            <table className="w-full text-start text-[13px]">
              <thead className="bg-[#fafaf7]">
                <tr>
                  <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">القالب</th>
                  <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">منشور · الإجمالي</th>
                  <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">المشاهدات (30 يومًا)</th>
                  <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الإجمالي الكلي</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxV = Math.max(1, ...data.per_template.map((p) => p.views_30d))
                  return data.per_template.map((p) => (
                    <tr key={p.template} className="border-t border-token">
                      <td className="px-4 py-3">
                        <div className="font-medium capitalize text-foreground">{p.template}</div>
                        <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(p.views_30d / maxV) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums text-muted">{p.published} · {p.sites}</td>
                      <td className="px-4 py-3 text-end tabular-nums text-foreground">{p.views_30d.toLocaleString()}</td>
                      <td className="px-4 py-3 text-end tabular-nums text-muted">{p.lifetime_views.toLocaleString()}</td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Per-site breakdown */}
      <section className="mt-10">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">تفصيل حسب الموقع</h2>
          <Link href="/dashboard/sites" className="text-[12px] font-medium text-primary hover:underline">
            إدارة المواقع ←
          </Link>
        </div>
        {data.per_site.length === 0 ? (
          <EmptyState
            title="لا مواقع بعد"
            body="أنشئ موقعًا وانشره على زينيا، وسنبدأ بتتبّع مرات المشاهدة هنا."
            cta={{ href: '/theme/new', label: 'أنشئ موقعك الأول' }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-token bg-white">
            <table className="w-full text-start text-[13px]">
              <thead className="bg-[#fafaf7]">
                <tr>
                  <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الموقع</th>
                  <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">المشاهدات (30 يومًا)</th>
                  <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الإجمالي الكلي</th>
                  <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الحالة</th>
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
                            {s.is_published && s.slug ? publicSiteHost(s.slug) : `${s.template_type} · مسودة`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-foreground">{s.views_30d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end tabular-nums text-muted">{s.lifetime_views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end">
                      {s.is_published && s.slug ? (
                        <a
                          href={publicSiteUrl(s.slug)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#15803d]"
                        >
                          منشور <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="inline-flex rounded-full bg-[rgba(217,119,6,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b45309]">
                          مسودة
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

      {/* Traffic sources / countries / devices */}
      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <RankTable title="أبرز مصادر الزيارات" label="آخر 30 يومًا" rows={data.top_referrers} />
        <RankTable title="أبرز الدول" label="آخر 30 يومًا" rows={data.top_countries} />
        <RankTable title="الأجهزة" label="آخر 30 يومًا" rows={data.devices} />
      </section>

      {/* AI usage for this account */}
      {data.ai_usage && data.ai_usage.calls > 0 && (
        <section className="mt-10">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">استخدام الذكاء الاصطناعي</h2>
            <span className="text-[11.5px] text-muted">
              {data.ai_usage.calls.toLocaleString()} عملية توليد · {data.ai_usage.total_tokens.toLocaleString()} رمز
            </span>
          </div>
          <AiUsageTable rows={data.ai_usage.by_operation} totalTokens={data.ai_usage.total_tokens} />
        </section>
      )}

      <p className="mt-10 text-center text-[11.5px] text-muted">
        تم التوليد {new Date(data.generated_at).toLocaleString()} · مسحوب مباشرةً من Supabase
      </p>
      </>)}
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

function AreaChart({ series }: { series: Array<{ date: string; views: number }> }) {
  const W = 760, H = 180, P = 8
  const n = series.length
  const max = Math.max(1, ...series.map((s) => s.views))
  const x = (i: number) => P + (i / Math.max(1, n - 1)) * (W - P * 2)
  const y = (v: number) => H - P - (v / max) * (H - P * 2)
  const line = series.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(s.views).toFixed(1)}`).join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`
  const peak = series.reduce((m, d) => (d.views > m.views ? d : m), series[0])
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-44 w-full" role="img" aria-label="Daily pageviews">
        <defs>
          <linearGradient id="zenya-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={P} x2={W - P} y1={H - P - g * (H - P * 2)} y2={H - P - g * (H - P * 2)} stroke="rgba(28,28,28,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#zenya-area)" />
        <path d={line} fill="none" stroke="#5e6ad2" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-[10.5px] text-muted">
        <span>{series[0]?.date.slice(5)}</span>
        {peak && peak.views > 0 && <span>الذروة {peak.views} · {peak.date.slice(5)}</span>}
        <span>{series[series.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}

function RankTable({ title, label, rows }: { title: string; label?: string; rows: Array<{ name: string; count: number }> }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="overflow-hidden rounded-2xl border border-token bg-white">
      <div className="flex items-baseline justify-between border-b border-token px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        {label && <span className="text-[10px] uppercase tracking-[0.14em] text-muted/70">{label}</span>}
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12.5px] text-muted">لا بيانات بعد</div>
      ) : (
        <table className="w-full text-[12.5px]">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} className="border-t border-token first:border-t-0">
                <td className="w-8 py-2.5 ps-4 pe-1 text-end align-top tabular-nums text-muted/60">{i + 1}</td>
                <td className="py-2.5 pe-2">
                  <div className="truncate font-medium text-foreground">{r.name}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5 ps-2 pe-4 text-end align-top tabular-nums text-foreground">
                  {r.count.toLocaleString()}
                  <span className="ms-1 text-[11px] text-muted">{Math.round((r.count / total) * 100)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function AiUsageTable({ rows, totalTokens }: { rows: Array<{ operation: string; calls: number; tokens: number }>; totalTokens: number }) {
  const maxTok = Math.max(1, ...rows.map((r) => r.tokens))
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0)
  const pretty = (op: string) => op.replace(/^generate-/, '').replace(/^ai-/, 'AI ').replace(/:/g, ' · ')
  return (
    <div className="overflow-hidden rounded-2xl border border-token bg-white">
      <table className="w-full text-start text-[13px]">
        <thead className="bg-[#fafaf7]">
          <tr>
            <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">العملية</th>
            <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">مرات التوليد</th>
            <th className="px-4 py-2.5 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الرموز</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.operation} className="border-t border-token">
              <td className="px-4 py-3">
                <div className="font-medium capitalize text-foreground">{pretty(r.operation)}</div>
                <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(r.tokens / maxTok) * 100}%` }} />
                </div>
              </td>
              <td className="px-4 py-3 text-end tabular-nums text-foreground">{r.calls.toLocaleString()}</td>
              <td className="px-4 py-3 text-end tabular-nums text-foreground">{r.tokens.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="border-t border-token bg-[#fafaf7]">
            <td className="px-4 py-2.5 text-[12px] font-semibold text-foreground">الإجمالي</td>
            <td className="px-4 py-2.5 text-end text-[12px] font-semibold tabular-nums text-foreground">{totalCalls.toLocaleString()}</td>
            <td className="px-4 py-2.5 text-end text-[12px] font-semibold tabular-nums text-foreground">{totalTokens.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function EmptyChartHint() {
  return (
    <div className="grid place-items-center py-10 text-center">
      <div className="rounded-full bg-[rgba(94,106,210,0.10)] p-3">
        <BarChart3 className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <p className="mt-3 max-w-xs text-[12.5px] text-muted">
        لا مشاهدات بعد. ما إن يزور أحدهم موقعًا منشورًا، سترى المنحنى اليومي يمتلئ هنا.
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

/* ─── Admin / founder dashboard (toggle target) ─────────────────────────── */

type AdminData = {
  generated_at: string
  totals: { users: number; themes: number; published_themes: number; paying_users: number }
  funnel: Array<{ step: string; users: number }>
  engagement: { active_7d: number; active_30d: number; signups_30d: number }
  revenue: {
    gross_all_time_cents: number; gross_30d_cents: number; mrr_cents: number
    paying_users: number; hosting_active: number; churned_30d: number; refunded_30d: number
  }
  ai_usage: {
    calls: number; tokens_total: number; cost_total_usd: number; tokens_30d: number
    cost_30d_usd: number; cost_per_user_usd: number; margin_vs_revenue_pct: number | null
    by_operation: Array<{ operation: string; calls: number; tokens: number; cost_usd: number }>
  }
  plan_breakdown: Record<string, number>
  pageviews_30d: number
  event_counts_30d: Record<string, number>
  series: Array<{ date: string; generated: number; published: number; purchased: number }>
}

function AdminDashboard() {
  const [d, setD] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(silent = false) {
    if (silent) setRefreshing(true)
    try {
      const r = await fetch('/api/admin/analytics', { cache: 'no-store' })
      if (!r.ok) { setErr(r.status === 403 ? 'للإدارة فقط.' : `تعذّر التحميل (${r.status})`); return }
      setD(await r.json()); setErr(null)
    } catch (e: any) {
      setErr(e?.message || 'فشل التحميل')
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  if (loading) {
    return <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonTile key={i} />)}</div>
  }
  if (err || !d) {
    return <div className="mt-8 rounded-2xl border border-token bg-white p-8 text-center text-[13px] text-muted">{err || 'لا بيانات'}</div>
  }

  const usd = (cents: number) => '$' + (cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
  const maxFunnel = Math.max(1, ...d.funnel.map((f) => f.users))
  const topUsers = d.funnel[0]?.users || 0
  const planItems = Object.entries(d.plan_breakdown).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  const eventItems = Object.entries(d.event_counts_30d).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  const maxOpCost = Math.max(0.0001, ...d.ai_usage.by_operation.map((o) => o.cost_usd))

  return (
    <>
      <div className="mt-5 flex justify-end">
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-black/5"
        >
          <RefreshCw className={'h-3 w-3 ' + (refreshing ? 'animate-spin' : '')} />
          {refreshing ? 'جارٍ التحديث…' : 'تحديث'}
        </button>
      </div>

      <section className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="الإيرادات (الإجمالي)" value={usd(d.revenue.gross_all_time_cents)} sub={`${d.revenue.paying_users} مشترك مدفوع · ${usd(d.revenue.gross_30d_cents)} خلال 30 يومًا`} icon={DollarSign} accent="#15803d" />
        <Tile label="الإيراد الشهري للاستضافة" value={usd(d.revenue.mrr_cents)} sub={`${d.revenue.hosting_active} نشط · ${d.revenue.churned_30d} ملغى خلال 30 يومًا`} icon={Repeat} accent="#5e6ad2" />
        <Tile label="إنفاق الذكاء الاصطناعي (الإجمالي)" value={`$${d.ai_usage.cost_total_usd.toFixed(2)}`} sub={`$${d.ai_usage.cost_30d_usd.toFixed(2)} آخر 30 يومًا`} icon={Cpu} accent="#9b6f00" />
        <Tile label="المستخدمون" value={d.totals.users.toLocaleString()} sub={`${d.engagement.active_30d} نشط خلال 30 يومًا · ${d.engagement.signups_30d} جديد`} icon={Users} accent="#c8a96a" />
      </section>

      {/* Activation funnel */}
      <section className="mt-10">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">مسار التفعيل</h2>
          <span className="text-[11.5px] text-muted">٪ من إجمالي التسجيلات</span>
        </div>
        <div className="space-y-3 rounded-2xl border border-token bg-white p-5">
          {d.funnel.map((f) => {
            const conv = topUsers ? Math.round((f.users / topUsers) * 100) : 0
            return (
              <div key={f.step}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="font-medium text-foreground">{f.step}</span>
                  <span className="tabular-nums text-muted">{f.users.toLocaleString()} · {conv}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(f.users / maxFunnel) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Unit economics + plan mix */}
      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <Card title="اقتصاديات الوحدة (الذكاء الاصطناعي مقابل الإيراد)" empty="لا بيانات بعد">
          <div className="space-y-2 text-[12.5px]">
            <Row label="الإيرادات (الإجمالي)" value={usd(d.revenue.gross_all_time_cents)} />
            <Row label="إنفاق الذكاء الاصطناعي (الإجمالي)" value={`$${d.ai_usage.cost_total_usd.toFixed(2)}`} />
            <Row label="هامش الذكاء الاصطناعي من الإيراد" value={d.ai_usage.margin_vs_revenue_pct == null ? '—' : `${d.ai_usage.margin_vs_revenue_pct}%`} />
            <Row label="تكلفة الذكاء الاصطناعي / مستخدم" value={`$${d.ai_usage.cost_per_user_usd.toFixed(2)}`} />
            <Row label="إجمالي الرموز" value={d.ai_usage.tokens_total.toLocaleString()} />
          </div>
          {d.ai_usage.by_operation.length > 0 && (
            <div className="mt-3 border-t border-token pt-3">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الإنفاق حسب العملية</div>
              <ul className="space-y-2">
                {d.ai_usage.by_operation.map((o) => (
                  <li key={o.operation} className="text-[12.5px]">
                    <div className="flex items-baseline justify-between">
                      <span className="truncate font-medium text-foreground">{o.operation}</span>
                      <span className="tabular-nums text-muted">${o.cost_usd.toFixed(2)} · {o.calls}×</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(o.cost_usd / maxOpCost) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <RankTable title="توزيع الباقات" label="مستخدمون" rows={planItems} />
          <Card title="لمحة عن الحساب" empty="">
            <div className="space-y-2 text-[12.5px]">
              <Row label="المشاهدات (30 يومًا)" value={d.pageviews_30d.toLocaleString()} />
              <Row label="النشطون (7 / 30 يومًا)" value={`${d.engagement.active_7d} / ${d.engagement.active_30d}`} />
              <Row label="المبالغ المستردة (30 يومًا)" value={String(d.revenue.refunded_30d)} />
            </div>
          </Card>
        </div>
      </section>

      {eventItems.length > 0 && (
        <section className="mt-10">
          <RankTable title="النشاط (30 يومًا)" label="أحداث مسجّلة" rows={eventItems} />
        </section>
      )}

      <p className="mt-10 text-center text-[11.5px] text-muted">
        تم التوليد {new Date(d.generated_at).toLocaleString()} · الإدارة · تكلفة الذكاء الاصطناعي مقدّرة بسعر قائمة gpt-4o-mini
      </p>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}
