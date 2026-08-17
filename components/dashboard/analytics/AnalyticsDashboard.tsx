'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3, Bot, Download, Eye, LogOut, MousePointerClick, RefreshCw,
  ShieldCheck, Timer, Users,
} from 'lucide-react'
import { RANGE_LABEL_AR, formatDuration, type RangeKey } from '@/lib/analytics-core'
import TrendChart from './TrendChart'
import RealtimePanel from './RealtimePanel'
import SearchPanel from './SearchPanel'
import {
  AudiencePanel, ContentPanel, ConversionsPanel, InsightsPanel, OverviewPanel, SourcesPanel,
} from './panels'
import { Panel, SkeletonBlock, SkeletonTile, Tile, rise } from './primitives'
import type { AnalyticsPayload, TabKey } from './types'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'audience', label: 'الزوّار' },
  { key: 'sources', label: 'المصادر' },
  { key: 'content', label: 'المحتوى' },
  { key: 'conversions', label: 'التحويلات' },
  { key: 'search', label: 'البحث' },
  { key: 'realtime', label: 'مباشر' },
  { key: 'insights', label: 'رؤى' },
]

const RANGES: RangeKey[] = ['24h', '7d', '30d', '90d', '12mo']

const EXPORTS: Array<{ key: string; label: string }> = [
  { key: 'daily', label: 'الزيارات اليومية' },
  { key: 'pages', label: 'الصفحات' },
  { key: 'sources', label: 'المصادر' },
  { key: 'countries', label: 'الدول' },
  { key: 'devices', label: 'الأجهزة والمتصفحات' },
  { key: 'conversions', label: 'التحويلات' },
  { key: 'sites', label: 'المواقع' },
]

type MetricKey = 'views' | 'visitors' | 'sessions' | 'events'

export default function AnalyticsDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<TabKey>('overview')
  const [range, setRange] = useState<RangeKey>('30d')
  const [site, setSite] = useState('')
  const [includeBots, setIncludeBots] = useState(false)
  const [compare, setCompare] = useState(true)
  const [metric, setMetric] = useState<MetricKey>('views')

  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The owner's own timezone — everything (days, the hour heatmap) is bucketed
  // in it server-side, so a Gulf business sees their Friday, not UTC's.
  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }, [])

  // ---- restore / persist view state from the URL --------------------------
  // A dashboard view is a thing people bookmark and send to each other.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const t = q.get('tab') as TabKey | null
    if (t && TABS.some((x) => x.key === t)) setTab(t)
    const r = q.get('range') as RangeKey | null
    if (r && RANGES.includes(r)) setRange(r)
    const s = q.get('site')
    if (s) setSite(s)
    if (q.get('bots') === '1') setIncludeBots(true)
  }, [])

  useEffect(() => {
    const q = new URLSearchParams()
    if (tab !== 'overview') q.set('tab', tab)
    if (range !== '30d') q.set('range', range)
    if (site) q.set('site', site)
    if (includeBots) q.set('bots', '1')
    const qs = q.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [tab, range, site, includeBots])

  const params = useMemo(() => {
    const q = new URLSearchParams({ range, tz })
    if (site) q.set('site', site)
    if (includeBots) q.set('bots', '1')
    return q
  }, [range, site, includeBots, tz])

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const r = await fetch(`/api/analytics?${params}`, { cache: 'no-store' })
      if (!r.ok) {
        setError(r.status === 401 ? 'انتهت الجلسة. سجّل الدخول مجددًا.' : `تعذّر تحميل التحليلات (${r.status})`)
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
  }, [params])

  useEffect(() => { load() }, [load])

  // ---- loading / error ----------------------------------------------------
  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="border-b border-token pb-5">
          <div className="h-6 w-32 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
          <div className="mt-2 h-3 w-72 animate-pulse rounded bg-[rgba(28,28,28,0.04)]" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonTile key={i} />)}
        </div>
        <div className="mt-8"><SkeletonBlock height="h-72" /></div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Panel className="p-8 text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
          <h2 className="mt-3 text-[16px] font-semibold text-foreground">تعذّر تحميل التحليلات</h2>
          <p className="mt-1 text-[13px] text-muted">{error}</p>
          <button
            onClick={() => { setLoading(true); load() }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12.5px] font-semibold text-white"
          >
            <RefreshCw className="h-3 w-3" /> حاول مجددًا
          </button>
        </Panel>
      </div>
    )
  }

  if (!data) return null

  const t = data.totals
  const dl = data.delta
  const sparks = data.series.map((s) => s.views)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ---- header ---- */}
      <motion.header
        {...rise}
        className="flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5"
      >
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">التحليلات</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-black/5"
            >
              <ShieldCheck className="h-3 w-3" /> لوحة الإدارة
            </Link>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-black/5 disabled:opacity-60"
          >
            <RefreshCw className={'h-3 w-3 ' + (refreshing ? 'animate-spin' : '')} />
            <span className="hidden sm:inline">{refreshing ? 'جارٍ التحديث…' : 'تحديث'}</span>
          </button>
        </div>
      </motion.header>

      {/* ---- control bar ---- */}
      <ControlBar
        data={data}
        range={range} setRange={setRange}
        site={site} setSite={setSite}
        includeBots={includeBots} setIncludeBots={setIncludeBots}
        compare={compare} setCompare={setCompare}
        params={params}
      />

      {/* ---- KPI tiles (persist across tabs) ---- */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Tile
          label="الزوّار" value={t.visitors.toLocaleString('ar')} icon={Users} accent="#5e6ad2"
          delta={compare ? dl.visitors : undefined} spark={sparks}
          sub="أشخاص مختلفون"
        />
        <Tile
          label="الجلسات" value={t.sessions.toLocaleString('ar')} icon={LogOut} accent="#4f5ab8"
          delta={compare ? dl.sessions : undefined}
          sub="زيارات منفصلة"
        />
        <Tile
          label="المشاهدات" value={t.views.toLocaleString('ar')} icon={Eye} accent="#15803d"
          delta={compare ? dl.views : undefined}
          sub="صفحات مفتوحة"
        />
        <Tile
          label="معدل المغادرة" value={t.sessions ? `${t.bounce_rate}%` : '—'} icon={LogOut} accent="#b45309"
          delta={compare ? dl.bounce_rate : undefined} invertDelta
          sub="غادروا بعد صفحة"
        />
        <Tile
          label="متوسط المدة" value={formatDuration(t.avg_duration_ms)} icon={Timer} accent="#9b6f00"
          delta={compare ? dl.avg_duration_ms : undefined}
          sub="وقت فعلي على الصفحة"
        />
        <Tile
          label="التواصل" value={t.events.toLocaleString('ar')} icon={MousePointerClick} accent="#c8a96a"
          delta={compare ? dl.events : undefined}
          sub={t.sessions ? `${t.conversion_rate}% من الجلسات` : 'واتساب · هاتف · حجز'}
        />
      </section>

      {data.sessions_since === null && t.views > 0 && (
        <p className="mt-3 rounded-lg border border-token bg-[#fafaf7] px-3 py-2 text-[11.5px] leading-relaxed text-muted">
          الزوّار والجلسات ومعدل المغادرة والمدة تُقاس منذ تفعيل القياس الجديد فقط. المشاهدات
          الأقدم من ذلك مسجّلة، لكن بلا تفاصيل الجلسة — لذلك تظهر أصفارًا هنا بدل أرقام مُختلَقة.
        </p>
      )}

      {/* ---- tabs ---- */}
      <div className="mt-7 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-token" role="tablist" aria-label="أقسام التحليلات">
          {TABS.map((x) => (
            <button
              key={x.key}
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={
                'relative whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition ' +
                (tab === x.key ? 'text-foreground' : 'text-muted hover:text-foreground')
              }
            >
              {x.label}
              {tab === x.key && (
                <motion.span
                  layoutId="zy-tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---- tab content ---- */}
      {tab === 'overview' && (
        <div className="mt-6">
          <TrendChart
            series={data.series}
            prevSeries={data.prev_series}
            metric={metric}
            onMetricChange={setMetric}
            showPrev={compare}
            compareLabel="المدة السابقة"
          />
        </div>
      )}

      {tab === 'overview' && <OverviewPanel d={data} />}
      {tab === 'audience' && <AudiencePanel d={data} />}
      {tab === 'sources' && <SourcesPanel d={data} />}
      {tab === 'content' && <ContentPanel d={data} />}
      {tab === 'conversions' && <ConversionsPanel d={data} />}
      {tab === 'search' && <SearchPanel sites={data.sites} site={site} onPickSite={setSite} />}
      {tab === 'realtime' && <RealtimePanel site={site} includeBots={includeBots} />}
      {tab === 'insights' && <InsightsPanel d={data} />}

      <p className="mt-10 text-center text-[11.5px] leading-relaxed text-muted">
        آخر تحديث {new Date(data.generated_at).toLocaleString('ar')} · التوقيت {data.tz}
        {!data.include_bots && ' · زيارات الروبوتات مستبعدة'}
      </p>
    </div>
  )
}

/* ─── control bar ─────────────────────────────────────────────────────────── */

function ControlBar({
  data, range, setRange, site, setSite, includeBots, setIncludeBots, compare, setCompare, params,
}: {
  data: AnalyticsPayload
  range: RangeKey
  setRange: (r: RangeKey) => void
  site: string
  setSite: (s: string) => void
  includeBots: boolean
  setIncludeBots: (b: boolean) => void
  compare: boolean
  setCompare: (b: boolean) => void
  params: URLSearchParams
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return
    const onDown = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExportOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [exportOpen])

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {/* range */}
      <div className="flex flex-wrap items-center gap-0.5 rounded-full border border-token bg-surface/60 p-0.5">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={
              'rounded-full px-2.5 py-1 text-[12px] font-medium transition sm:px-3 ' +
              (range === r ? 'bg-foreground text-white shadow-sm' : 'text-muted hover:text-foreground')
            }
          >
            {SHORT_RANGE[r] ?? RANGE_LABEL_AR[r]}
          </button>
        ))}
      </div>

      {/* site */}
      {data.sites.length > 0 && (
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          aria-label="اختر الموقع"
          className="max-w-[190px] rounded-md border border-token bg-white px-2.5 py-1.5 text-[12.5px] text-foreground outline-none transition focus:border-primary"
        >
          <option value="">كل المواقع ({data.sites.length})</option>
          {data.sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {/* compare */}
      <Toggle active={compare} onClick={() => setCompare(!compare)} title="مقارنة بالمدة السابقة">
        مقارنة
      </Toggle>

      {/* bots */}
      <Toggle
        active={includeBots}
        onClick={() => setIncludeBots(!includeBots)}
        title="تضمين زيارات محركات البحث والروبوتات"
      >
        <Bot className="h-3 w-3" />
        {includeBots ? 'الروبوتات مُضمَّنة' : 'بلا روبوتات'}
      </Toggle>

      {/* export */}
      <div className="relative ms-auto" ref={exportRef}>
        <button
          type="button"
          onClick={() => setExportOpen((v) => !v)}
          aria-expanded={exportOpen}
          aria-haspopup="menu"
          className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-black/5"
        >
          <Download className="h-3 w-3" />
          <span className="hidden sm:inline">تصدير</span>
        </button>
        {exportOpen && (
          <div
            role="menu"
            className="absolute end-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-token bg-white py-1 shadow-lg"
          >
            {EXPORTS.map((x) => (
              <a
                key={x.key}
                role="menuitem"
                href={`/api/analytics/export?dataset=${x.key}&${params}`}
                onClick={() => setExportOpen(false)}
                className="block px-3 py-2 text-[12.5px] text-foreground transition hover:bg-black/[0.04]"
              >
                {x.label}
              </a>
            ))}
            <p className="border-t border-token px-3 py-2 text-[11px] leading-relaxed text-muted">
              ملف CSV يفتح مباشرة في Excel بالعربية.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const SHORT_RANGE: Partial<Record<RangeKey, string>> = {
  '24h': '24 ساعة',
  '7d': '7 أيام',
  '30d': '30 يومًا',
  '90d': '90 يومًا',
  '12mo': 'سنة',
}

function Toggle({
  active, onClick, title, children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition ' +
        (active
          ? 'border-primary/40 bg-[rgba(94,106,210,0.08)] text-primary'
          : 'border-token bg-white text-muted hover:bg-black/5')
      }
    >
      {children}
    </button>
  )
}
