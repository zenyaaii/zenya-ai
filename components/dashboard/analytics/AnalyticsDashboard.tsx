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
import { Segmented, TabBar } from '@/components/app/Segmented'
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
        className="flex flex-wrap items-end justify-between gap-3 pb-5"
        style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.08)' }}
      >
        <div className="min-w-0">
          <h1 className="zy-h1">التحليلات</h1>
          <p className="mt-1.5 text-[13px] font-medium leading-[1.8] text-[#56565a]">
            كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="zy-btn-q"
            >
              <ShieldCheck className="h-3 w-3" /> لوحة الإدارة
            </Link>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="zy-btn-q disabled:opacity-60"
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
      {/* KPI tiles (persist across tabs).

          THE SIX ACCENT COLOURS ARE GONE. Each tile used to pass its own hue
          - #5e6ad2, #4f5ab8, #15803d, #b45309, #9b6f00, #c8a96a - so the row
          read as six categories when it is one: six measures of the same
          traffic. Worse, three of those were the status triad used as
          identity, which is the one thing status colour must never do; a page
          view is not "good" the way a passing check is.

          What carries colour now is the SELECTION: the tile whose metric the
          chart is plotting wears the accent, and the rest are grey. That is
          the accent doing its job on a product surface - saying which one you
          are looking at - instead of decorating six boxes. The delta keeps the
          triad, because up-versus-down genuinely is good-versus-bad. */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Tile
          label="الزوّار" value={t.visitors.toLocaleString('ar')} icon={Users}
          delta={compare ? dl.visitors : undefined} spark={sparks}
          sub="أشخاص مختلفون"
          active={metric === 'visitors'} onClick={() => setMetric('visitors')}
        />
        <Tile
          label="الجلسات" value={t.sessions.toLocaleString('ar')} icon={LogOut}
          delta={compare ? dl.sessions : undefined}
          sub="زيارات منفصلة"
          active={metric === 'sessions'} onClick={() => setMetric('sessions')}
        />
        <Tile
          label="المشاهدات" value={t.views.toLocaleString('ar')} icon={Eye}
          delta={compare ? dl.views : undefined}
          sub="صفحات مفتوحة"
          active={metric === 'views'} onClick={() => setMetric('views')}
        />
        <Tile
          label="معدل المغادرة" value={t.sessions ? `${t.bounce_rate}%` : '—'} icon={LogOut}
          delta={compare ? dl.bounce_rate : undefined} invertDelta
          sub="غادروا بعد صفحة"
        />
        <Tile
          label="متوسط المدة" value={formatDuration(t.avg_duration_ms)} icon={Timer}
          delta={compare ? dl.avg_duration_ms : undefined}
          sub="وقت فعلي على الصفحة"
        />
        <Tile
          label="التواصل" value={t.events.toLocaleString('ar')} icon={MousePointerClick}
          delta={compare ? dl.events : undefined}
          sub={t.sessions ? `${t.conversion_rate}% من الجلسات` : 'واتساب · هاتف · حجز'}
          active={metric === 'events'} onClick={() => setMetric('events')}
        />
      </section>

      {data.sessions_since === null && t.views > 0 && (
        <p className="mt-3 rounded-[10px] bg-[#f4f4f6] px-3 py-2.5 text-[11.5px] font-medium leading-[1.8] text-[#56565a]" style={{ boxShadow: '0 0 0 1px rgba(17,17,17,0.08)' }}>
          الزوّار والجلسات ومعدل المغادرة والمدة تُقاس منذ تفعيل القياس الجديد فقط. المشاهدات
          الأقدم من ذلك مسجّلة، لكن بلا تفاصيل الجلسة — لذلك تظهر أصفارًا هنا بدل أرقام مُختلَقة.
        </p>
      )}

      {/* ---- tabs ----
           The shared TabBar: one indicator that MOVES between tabs, measured
           from the laid-out button rather than computed from an index, so it
           lands correctly under Arabic labels of different widths and in both
           directions. The row scrolls sideways rather than wrapping - eight
           wrapped tabs read as two rows of controls and the indicator would
           have to jump a line. */}
      <TabBar
        items={TABS}
        value={tab}
        onChange={setTab}
        label="أقسام التحليلات"
        className="mt-7"
      />

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

      <p className="mt-10 text-center text-[11.5px] font-medium leading-[1.8] text-[#66666e]">
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
      {/* range - the filter every reader reaches for, so it comes first in
          the row. Same sliding indicator as the metric switcher inside the
          chart, because they are the same kind of choice. */}
      <Segmented
        items={RANGES.map((r) => ({ key: r, label: SHORT_RANGE[r] ?? RANGE_LABEL_AR[r] }))}
        value={range}
        onChange={setRange}
        label="اختر المدة"
      />

      {/* site */}
      {data.sites.length > 0 && (
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          aria-label="اختر الموقع"
          className="max-w-[190px] px-2.5 py-[7px] text-[12.5px] font-medium"
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
          className="zy-btn-q"
        >
          <Download className="h-3 w-3" />
          <span className="hidden sm:inline">تصدير</span>
        </button>
        {exportOpen && (
          <div
            role="menu"
            className="zy-menu absolute end-0 z-20 mt-1.5 w-52"
          >
            {EXPORTS.map((x) => (
              <a
                key={x.key}
                role="menuitem"
                href={`/api/analytics/export?dataset=${x.key}&${params}`}
                onClick={() => setExportOpen(false)}
                className="zy-menu-row"
              >
                {x.label}
              </a>
            ))}
            <p className="mt-1 border-t border-[rgba(17,17,17,0.07)] px-2.5 pb-1 pt-2 text-[11px] font-medium leading-[1.7] text-[#66666e]">
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
      /* A two-state switch, so it says which state it is IN rather than what
         pressing it would do. On is the accent: it is a filter the reader
         chose, and a chosen option is exactly what the accent marks here. */
      className="zy-toggle"
      data-on={active ? '' : undefined}
    >
      {children}
    </button>
  )
}
