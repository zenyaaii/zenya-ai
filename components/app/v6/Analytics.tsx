'use client'

/**
 * ANALYTICS, as the v6 design draws it (VIEWS.analytics in the design file):
 * a page head with the range button and «تصدير», six tabs — نظرة عامة،
 * المصادر، الصفحات، التواصل، بحث جوجل، مباشر — and the day stepper when the
 * range is a single day.
 *
 * Everything is about the site the frame's switcher shows (v6/site), and
 * every number is the account's own: /api/analytics for a range,
 * /api/analytics/day for a day by hour, /api/analytics/realtime for «مباشر»,
 * /api/gsc/* for Google. Where the design showed a sample, an empty state
 * says what is missing instead.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { CHANNEL_LABEL_AR, EVENT_LABEL_AR, countryNameAr, deviceLabelAr, isEventType } from '@/lib/analytics-core'
import type { AnalyticsPayload, DayPayload, RealtimePayload } from '@/components/dashboard/analytics/types'
import { dateAgo, trafficFromDay, trafficFromRange, ymd, type TMetric, type TrafficData } from '@/components/dashboard/screens/traffic'
import { useDashboardPath } from '@/components/app/useDashboardPath'
import type { IconName } from './sprite'
import { useSite } from './site'
import { A, type Act } from './Home'
import {
  AreaChart, Bars, DayNav, Ic, RANGES, Seg, Spark, agoName, dayNote, deltaTxt, fmt, hh, rangeLabel,
  useV6, type Range,
} from './ui'

const ATABS = [['overview', 'نظرة عامة'], ['sources', 'المصادر'], ['pages', 'الصفحات'], ['contacts', 'التواصل'], ['search', 'بحث جوجل'], ['live', 'مباشر']] as const
type Tab = (typeof ATABS)[number][0]

const MET: Record<TMetric, { t: string; u: string; sub: string }> = {
  visitors: { t: 'الزوار', u: 'زائر', sub: 'أشخاص مختلفون' },
  sessions: { t: 'الجلسات', u: 'جلسة', sub: 'زيارات منفصلة' },
  views: { t: 'المشاهدات', u: 'مشاهدة', sub: 'صفحات مفتوحة' },
  events: { t: 'التواصل', u: 'تواصل', sub: 'طلب · واتساب · خريطة · هاتف' },
}

const EVENT_ICON: Record<string, IconName> = {
  whatsapp_click: 'whatsapp', phone_click: 'phone', email_click: 'mail', booking_click: 'cal',
  map_click: 'pin', order_click: 'store', social_click: 'share', form_submit: 'text', outbound_click: 'link',
}

const tzNow = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } }
const mmss = (ms: number | null | undefined) => {
  const s = Math.round((ms || 0) / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const PAGE_NAME: Record<string, string> = {
  '/': 'الرئيسية', '/menu': 'القائمة', '/contact': 'تواصل', '/about': 'من نحن', '/services': 'خدماتنا',
  '/gallery': 'المعرض', '/booking': 'الحجز', '/book': 'الحجز', '/reservations': 'الحجز', '/reviews': 'التقييمات', '/process': 'كيف نعمل',
  '/pricing': 'الأسعار', '/team': 'الفريق', '/faq': 'أسئلة شائعة',
}
const pageName = (p: string) => PAGE_NAME[p] || p
const BROWSER_AR: Record<string, string> = {
  Safari: 'سفاري', Chrome: 'كروم', Instagram: 'إنستغرام', Facebook: 'فيسبوك', Firefox: 'فايرفوكس',
  Edge: 'إيدج', Opera: 'أوبرا', 'Samsung Internet': 'سامسونج', Other: 'أخرى', Unknown: 'أخرى',
}

/** A year of days folded into months, so the 12-month line has twelve points. */
function byMonth(t: TrafficData): TrafficData {
  const now = new Date()
  const keys = Array.from({ length: 12 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
  })
  const fold = (vals: number[], dates: string[], shiftYear: number) => keys.map((k) => {
    const [y, m] = k.split('-').map(Number)
    const kk = `${y - shiftYear}-${String(m).padStart(2, '0')}`
    return vals.reduce((a, v, i) => a + ((dates[i] || '').startsWith(kk) ? v : 0), 0)
  })
  // The comparison year is the 365 days before; its dates are a year earlier.
  const prevDates = t.dates.map((d) => { const [y, ...r] = d.split('-'); return [Number(y) - 1, ...r].join('-') })
  const out = { ...t, values: {} as TrafficData['values'], prev: {} as TrafficData['prev'], slots: 12, dates: keys }
  for (const m of Object.keys(t.values) as TMetric[]) {
    out.values[m] = fold(t.values[m], t.dates, 0)
    out.prev[m] = fold(t.prev[m], prevDates, 1)
  }
  return out
}

/**
 * How the page reads its numbers. The dashboard reads the account's own API;
 * the demo hands in its fixtures under the same paths, so both run this file.
 */
export type AnalyticsGet = (path: string, q: Record<string, string>) => Promise<any>
const apiGet: AnalyticsGet = (path, q) =>
  fetch(`${path}?${new URLSearchParams(q)}`, { cache: 'no-store' })
    // Google's answers carry a reason even when they are not 200.
    .then((r) => r.json().then((j) => (r.ok || path.startsWith('/api/gsc') ? j : Promise.reject(r.status))))

export default function V6Analytics({ get = apiGet, demo = false, nav }: {
  get?: AnalyticsGet
  /** The demo: no file to download, and no account to connect. */
  demo?: boolean
  /** The demo switches views instead of linking: nav('seo'). */
  nav?: (page: string) => void
}) {
  const account = useSite()
  const { linkTo } = useDashboardPath()
  const page = (key: string, route: string): Act => (nav ? { onSelect: () => nav(key) } : { href: linkTo(route) })
  const { openPop, closePop, toast } = useV6()
  const site = account?.themes?.find((t) => t.id === account.siteId) || null
  const live = !!(site?.is_published && site.slug)

  const [tab, setTab] = useState<Tab>('overview')
  const [range, setRange] = useState<Range>('30d')
  const [day, setDay] = useState(0)
  const [metric, setMetric] = useState<TMetric>('visitors')

  // ?tab=search and ?range=day&back=1 — the home's links, and the search
  // palette's, which can arrive while this page is already open. The day is
  // taken once and dropped from the address; the tab stays in it.
  const qs = useSearchParams()?.toString() || ''
  useEffect(() => {
    const q = new URLSearchParams(qs)
    const t = q.get('tab')
    if (t && ATABS.some(([k]) => k === t)) setTab(t as Tab)
    if (q.get('range') === 'day') {
      setRange('day')
      setDay(Math.max(0, Math.min(89, Number(q.get('back')) || 0)))
      const url = new URL(window.location.href)
      url.searchParams.delete('range')
      url.searchParams.delete('back')
      window.history.replaceState(window.history.state, '', url)
    }
  }, [qs])
  const pickTab = (t: Tab) => {
    setTab(t)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', t)
    window.history.replaceState(window.history.state, '', url)
  }

  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [traffic, setTraffic] = useState<TrafficData | null>(null)
  const [failed, setFailed] = useState(false)
  const tz = useMemo(tzNow, [])

  useEffect(() => {
    if (!site || !live) return
    let cancelled = false
    const read = (q: Record<string, string>, path = '/api/analytics') => get(path, { ...q, tz, site: site.id })
    const load = async () => {
      if (range !== 'day') {
        const j: AnalyticsPayload = await read({ range })
        const t = trafficFromRange(j)
        return { j, t: range === '12mo' ? byMonth(t) : t }
      }
      const start = dateAgo(day)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const [j, h]: [AnalyticsPayload, DayPayload] = await Promise.all([
        read({ range: 'custom', from: start.toISOString(), to: (day === 0 ? new Date() : end).toISOString() }),
        read({ date: ymd(dateAgo(day)) }, '/api/analytics/day'),
      ])
      return { j, t: trafficFromDay(h) }
    }
    load()
      .then(({ j, t }) => { if (!cancelled) { setData(j); setTraffic(t); setFailed(false) } })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [site?.id, live, range, day, tz, get]) // eslint-disable-line react-hooks/exhaustive-deps

  const rangeTitle = range === 'day' ? agoName(day) : 'آخر ' + RANGES.find((r) => r[0] === range)![1]
  const rl = range === 'day' ? dayNote(day) : rangeTitle
  const dayNavOn = range === 'day' && tab !== 'search' && tab !== 'live'

  const rangeMenu = (anchor: HTMLElement) => openPop(anchor, (
    <>
      <h4>المدة</h4>
      {RANGES.map(([k, t]) => (
        <button key={k} className={`pi ${k === range ? 'on' : ''}`} onClick={() => { if (k === 'day' && range !== 'day') setDay(0); setRange(k); closePop() }}>
          <span className="tx"><b>{k === 'day' ? 'يوم واحد بالساعات' : 'آخر ' + t}</b>{k === 'day' && <span>اختر أي يوم وشاهد ما حدث في كل ساعة</span>}</span>
          {k === range && <span className="end"><Ic n="check" /></span>}
        </button>
      ))}
    </>
  ), 260)

  if (!account?.themes) return null

  if (!site || !live) {
    return (
      <>
        <div className="phead"><div className="txt"><h1 className="t-h1 rv">التحليلات</h1><p className="rv" style={{ ['--i' as string]: 1 }}>{site ? `أرقام موقع «${site.product_name || 'موقع بلا اسم'}».` : 'أرقام مواقعك.'}</p></div></div>
        <div className="card rv" style={{ ['--i' as string]: 2 }}>
          <div className="empty">
            <Ic n="chart" /><b>لا أرقام بعد</b>
            <span>{site ? 'انشر الموقع أولًا، وتبدأ الأرقام بالظهور هنا من أول زائر.' : 'أنشئ موقعك وانشره، وتبدأ الأرقام بالظهور هنا من أول زائر.'}</span>
            <A className="btn acc press" to={site ? page('sites', '/dashboard/sites') : { href: '/theme/new' }}><Ic n="globe" />{site ? 'انشر الموقع' : 'موقع جديد'}</A>
          </div>
        </div>
      </>
    )
  }

  const exportHref = (() => {
    const q = new URLSearchParams({ dataset: 'daily', tz, site: site.id })
    if (range === 'day') {
      const start = dateAgo(day); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(end.getDate() + 1)
      q.set('range', 'custom'); q.set('from', start.toISOString()); q.set('to', end.toISOString())
    } else q.set('range', range)
    return `/api/analytics/export?${q}`
  })()

  return (
    <>
      <div className="phead">
        <div className="txt">
          <h1 className="t-h1 rv">التحليلات</h1>
          <p className="rv" style={{ ['--i' as string]: 1 }}>كل ما يحدث على موقع «{site.product_name || 'موقع بلا اسم'}»: من زاره، ومن أين أتى، وماذا فعل.</p>
        </div>
        <div className="acts rv" style={{ ['--i' as string]: 2 }}>
          <button className="btn sm press" aria-haspopup="true" aria-expanded="false" onClick={(e) => rangeMenu(e.currentTarget)}><Ic n="cal" /><span>{rangeTitle}</span><Ic n="chevd" /></button>
          {demo
            ? <button className="btn line sm press" onClick={() => toast('في لوحتك الحقيقية ينزّل هذا الزر ملف الأرقام', { ok: false })}><Ic n="download" />تصدير</button>
            : <a className="btn line sm press" href={exportHref} download><Ic n="download" />تصدير</a>}
        </div>
      </div>
      <div className="an-tabs rv" style={{ ['--i' as string]: 3 }}>
        <Seg<Tab> items={ATABS.map(([k, t]): [Tab, string] => [k, t])} value={tab} onChange={pickTab} className="tabs" label="الأقسام" id="aTabs" />
      </div>
      <DayNav day={day} onDay={setDay} hidden={!dayNavOn} id="aDayNav" />
      {failed && !data && <div className="card"><div className="empty"><Ic n="chart" /><b>تعذّر تحميل الأرقام</b><span>أعد تحميل الصفحة بعد لحظات.</span></div></div>}
      <div>
        {tab === 'overview' && data && traffic && <Overview data={data} t={traffic} range={range} day={day} rl={rl} metric={metric} setMetric={setMetric} onPick={(i) => { if (range === 'day' || range === '12mo') return; setDay(traffic.values.views.length - 1 - i); setRange('day') }} />}
        {tab === 'sources' && data && <Sources data={data} rl={rl} />}
        {tab === 'pages' && data && <Pages data={data} />}
        {tab === 'contacts' && data && <Contacts data={data} rl={rl} />}
        {tab === 'search' && <Search get={get} siteId={site.id} toSeo={page('seo', '/dashboard/seo')} demo={demo} />}
        {tab === 'live' && <Live get={get} siteId={site.id} tz={tz} />}
      </div>
    </>
  )
}

/** One tab's pane. `grow` replays the meters' fill when it opens, as v6 does for التواصل. */
function Pane({ children, grow }: { children: ReactNode; grow?: boolean }) {
  const [inn, setIn] = useState(false)
  useEffect(() => {
    if (!grow) return
    const r = requestAnimationFrame(() => setIn(true))
    return () => cancelAnimationFrame(r)
  }, [grow])
  return <section className={`an-pane on ${inn ? 'in' : ''}`}>{children}</section>
}

/* ---- نظرة عامة ------------------------------------------------------------------ */
function Overview({ data, t, range, day, rl, metric, setMetric, onPick }: {
  data: AnalyticsPayload; t: TrafficData; range: Range; day: number; rl: string
  metric: TMetric; setMetric: (m: TMetric) => void; onPick: (i: number) => void
}) {
  const isDay = range === 'day'
  const v = t.values[metric]
  const n = v.length
  const [hover, setHover] = useState(false)
  useEffect(() => { setHover(window.matchMedia('(hover:hover)').matches) }, [])
  const hint = isDay ? (hover ? 'مرّر على الرسم لترى كل ساعة' : 'المس الرسم لترى كل ساعة') : range === '12mo' ? '' : 'اضغط على يوم لترى ساعاته'
  const [scrub, setScrub] = useState<ReactNode>(null)
  const label = (i: number) => range === '12mo' ? rangeLabel('12mo', i, 12) : rangeLabel(range, i, n)
  const tot = data.totals
  const durDelta = isDay ? null : data.delta.avg_duration_ms
  const ch = data.channels.map((c): [string, number] => [CHANNEL_LABEL_AR[c.key as keyof typeof CHANNEL_LABEL_AR] || c.name, c.views])
  const pg = data.pages.slice(0, 6).map((p): [string, number] => [pageName(p.path), p.views])
  return (
    <Pane>
      <div className="tiles" id="aTiles">
        {(Object.keys(MET) as TMetric[]).map((m) => {
          const x = t.deltas[m]
          return (
            <button key={m} className="stat press" aria-pressed={m === metric} onClick={() => setMetric(m)}>
              <span className="top"><span>{MET[m].t}</span><span className={`delta ${x != null && x < 0 ? 'dn' : ''}`}>{deltaTxt(x == null ? null : Math.round(x))}</span></span>
              <span className="vrow"><span className="v num">{fmt(t.totals[m])}</span><Spark values={t.values[m]} /></span>
              <span className="ft"><small>{MET[m].sub}</small></span>
            </button>
          )
        })}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h">
          <div><h2 className="t-h2">{MET[metric].t}</h2><span className="t-small">{rl}</span></div>
          <div className="scrub" style={{ textAlign: 'end' }}>{scrub ?? hint}</div>
        </div>
        <AreaChart
          values={v} prev={t.prev[metric]} slots={isDay ? 24 : n} pick={!isDay && range !== '12mo'}
          onScrub={(i, val) => setScrub(<><b className="num">{fmt(val)}</b> {MET[metric].u} · {label(i)}</>)}
          onLeave={() => setScrub(null)}
          onPick={onPick}
        />
        <div className="axis">
          {isDay
            ? [0, 6, 12, 18, 23].map((h) => <span key={h} className="num">{hh(h)}</span>)
            : n > 0 && [0, Math.floor((n - 1) / 2), n - 1].map((i) => <span key={i}>{label(i)}</span>)}
        </div>
        <div className="legend" style={{ marginTop: 12 }}>
          <span><i /><span>{isDay ? agoName(day) : 'هذه المدة'}</span></span>
          <span><i className="p" /><span>{isDay ? 'نفس اليوم قبل أسبوع' : 'المدة السابقة'}</span></span>
        </div>
      </div>
      <div className="an-grid">
        <div className="card"><div className="card-h"><h2 className="t-h3">من أين يأتون</h2><span className="side-note">{rl}</span></div>{ch.length ? <Bars rows={ch} /> : <Empty />}</div>
        <div className="card"><div className="card-h"><h2 className="t-h3">أهم الصفحات</h2><span className="side-note">{rl}</span></div>{pg.length ? <Bars rows={pg} tone="blue" /> : <Empty />}</div>
      </div>
      <div className="card" style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 24px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tile"><Ic n="timer" /></span>
          <span><span className="t-small">متوسط مدة الزيارة</span><b style={{ display: 'block', fontSize: 18 }} className="num">{mmss(tot.avg_duration_ms)}</b></span>
        </span>
        {durDelta != null && <span className={`delta ${durDelta < 0 ? 'dn' : ''}`}>{deltaTxt(Math.round(durDelta))}</span>}
        <span className="t-small" style={{ flex: '1 1 240px' }}>زيارات الروبوتات لا تُحسب في هذه الأرقام.</span>
      </div>
    </Pane>
  )
}

function Empty({ text = 'لا شيء في هذه المدة بعد.' }: { text?: string }) {
  return <p className="t-small" style={{ padding: '8px 4px' }}>{text}</p>
}

/* ---- المصادر ---------------------------------------------------------------------- */
function Sources({ data, rl }: { data: AnalyticsPayload; rl: string }) {
  const ch = data.channels.map((c): [string, number] => [CHANNEL_LABEL_AR[c.key as keyof typeof CHANNEL_LABEL_AR] || c.name, c.views])
  const top = data.channels[0]?.key
  const countries = data.countries.slice(0, 6).map((c): [string, number] => [countryNameAr(c.name), c.visitors || c.views])
  const devTotal = data.devices.reduce((a, d) => a + (d.visitors || d.views), 0)
  const dev = (['Mobile', 'Desktop', 'Tablet'] as const).map((k, i) => {
    const row = data.devices.find((d) => d.name === k)
    const pct = devTotal ? Math.round(((row?.visitors || row?.views || 0) / devTotal) * 100) : 0
    return { k, label: k === 'Desktop' ? 'كمبيوتر' : k === 'Tablet' ? 'تابلت' : deviceLabelAr(k), pct, color: ['var(--acc)', 'var(--ink2)', 'var(--mut2)'][i], icon: (['mobile', 'monitor', 'tablet'] as IconName[])[i] }
  })
  const browsers = data.browsers.slice(0, 5).map((b): [string, number] => [BROWSER_AR[b.name] || b.name, b.visitors || b.views])
  return (
    <Pane>
      <div className="an-grid" style={{ marginTop: 0 }}>
        <div className="card">
          <div className="card-h"><h2 className="t-h3">القنوات</h2><span className="side-note">{rl}</span></div>
          {ch.length ? <Bars rows={ch} /> : <Empty />}
          <p className="t-small" style={{ marginTop: 14 }}>{top === 'search' ? 'أغلب زوارك يجدونك من بحث جوجل. صفحة السيو تساعدك على الظهور أكثر.' : 'صفحة السيو تساعدك على الظهور أكثر في بحث جوجل.'}</p>
        </div>
        <div className="card"><div className="card-h"><h2 className="t-h3">الدول</h2><span className="side-note">{rl}</span></div>{countries.length ? <Bars rows={countries} tone="blue" /> : <Empty />}</div>
        <div className="card">
          <div className="card-h"><h2 className="t-h3">الأجهزة</h2></div>
          <div className="devices">{dev.map((d) => <i key={d.k} style={{ width: `${d.pct}%`, background: d.color }} />)}</div>
          <div className="dev-legend">{dev.map((d) => <div key={d.k}><i style={{ background: d.color }} /><Ic n={d.icon} /><span>{d.label}</span><b className="num">{d.pct}%</b></div>)}</div>
          {devTotal > 0 && <p className="t-small" style={{ marginTop: 14 }}>{dev[0].pct}% من زوارك على الجوال، لذلك نصمم موقعك للجوال أولًا.</p>}
        </div>
        <div className="card"><div className="card-h"><h2 className="t-h3">المتصفحات</h2></div>{browsers.length ? <Bars rows={browsers} tone="ok" /> : <Empty />}</div>
      </div>
    </Pane>
  )
}

/* ---- الصفحات ------------------------------------------------------------------------ */
function Pages({ data }: { data: AnalyticsPayload }) {
  return (
    <Pane>
      <div className="card flush">
        {data.pages.length === 0 ? <div className="empty"><Ic n="text" /><b>لا صفحات في هذه المدة</b></div> : (
          <table className="tbl">
            <thead><tr><th>الصفحة</th><th>المشاهدات</th><th>الزوار</th><th>متوسط المدة</th><th className="end">عمق التمرير</th></tr></thead>
            <tbody>
              {data.pages.map((x) => {
                const sc = x.avg_scroll_pct == null ? null : Math.round(x.avg_scroll_pct)
                return (
                  <tr key={x.path}>
                    <td className="k" data-l="الصفحة"><b>{pageName(x.path)}</b> <span className="t-small ltr">{x.path}</span></td>
                    <td data-l="المشاهدات" className="num">{fmt(x.views)}</td>
                    <td data-l="الزوار" className="num">{fmt(x.visitors)}</td>
                    <td data-l="المدة" className="num">{x.avg_engaged_ms == null ? '—' : mmss(x.avg_engaged_ms)}</td>
                    <td className="end" data-l="التمرير">{sc == null ? '—' : <span className={`pill ${sc >= 70 ? 'ok' : ''} num`}>{sc}%</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="t-small" style={{ margin: '12px 4px 0' }}>عمق التمرير: كم نزل الزائر في الصفحة قبل أن يغادر. فوق 70% يعني أنه قرأها كلها تقريبًا.</p>
    </Pane>
  )
}

/* ---- التواصل ------------------------------------------------------------------------- */
function Contacts({ data, rl }: { data: AnalyticsPayload; rl: string }) {
  const tot = data.conversions.total
  const vis = data.totals.visitors
  const rate = vis ? (tot / vis) * 100 : 0
  const rows = data.conversions.by_type.filter((r) => r.events > 0)
  const steps: [string, number][] = [['جلسات', data.totals.sessions], ['زوار', vis], ['تواصل', tot]]
  const top = steps[0][1] || 1
  return (
    <Pane grow>
      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <span className="tile lg acc"><Ic n="click" /></span>
          <p style={{ flex: '1 1 260px', fontSize: 17, lineHeight: 1.8 }}>
            من كل <b className="num">100</b> زائر، تواصل معك <b className="num" style={{ color: 'var(--acc-ink)' }}>{Math.round(rate)}</b>: بواتساب، أو اتصال، أو حجز من الموقع.
          </p>
        </div>
      </div>
      <div className="an-grid">
        <div className="card">
          <div className="card-h"><h2 className="t-h3">حسب نوع التواصل</h2><span className="side-note">{rl}</span></div>
          {rows.length ? (
            <div className="rows">
              {rows.map((c) => (
                <div className="r" key={c.event_type}>
                  <span className="tile"><Ic n={EVENT_ICON[c.event_type] || 'click'} /></span>
                  <span className="tx"><b>{isEventType(c.event_type) ? EVENT_LABEL_AR[c.event_type] : c.event_type}</b></span>
                  <span className="end"><b className="num" style={{ fontSize: 16 }}>{fmt(c.events)}</b></span>
                </div>
              ))}
            </div>
          ) : <Empty text="لم يتواصل معك أحد من الموقع في هذه المدة بعد." />}
        </div>
        <div className="card">
          <div className="card-h"><h2 className="t-h3">من الزيارة إلى التواصل</h2></div>
          <div className="funnel">
            {steps.map(([t, v]) => (
              <div className="f" key={t}><span>{t}</span><b className="num">{fmt(v)}</b><div className="meter" style={{ ['--v' as string]: (v / top).toFixed(3) }}><i /></div></div>
            ))}
          </div>
          <p className="t-small" style={{ marginTop: 16 }}>نسجّل كل ضغطة على واتساب أو الهاتف أو زر الحجز تلقائيًا، دون أي إعداد منك.</p>
        </div>
      </div>
    </Pane>
  )
}

/* ---- بحث جوجل -------------------------------------------------------------------------- */
type Gsc =
  | { s: 'loading' } | { s: 'off' } | { s: 'disconnected' } | { s: 'missing' } | { s: 'error' }
  | { s: 'ok'; email?: string; totals: { clicks: number; impressions: number; ctr: number; position: number }; queries: { query: string; clicks: number; impressions: number; position: number }[] }

function Search({ get, siteId, toSeo, demo }: { get: AnalyticsGet; siteId: string; toSeo: Act; demo: boolean }) {
  const { toast } = useV6()
  const [g, setG] = useState<Gsc>({ s: 'loading' })
  useEffect(() => {
    let cancelled = false
    const set = (v: Gsc) => { if (!cancelled) setG(v) }
    ;(async () => {
      try {
        const st = await get('/api/gsc/status', {})
        if (!st?.configured) return set({ s: 'off' })
        if (!st.connected) return set({ s: 'disconnected' })
        const p = await get('/api/gsc/performance', { themeId: siteId })
        if (p?.connected === false) return set({ s: 'disconnected' })
        if (p?.reason === 'property_not_found') return set({ s: 'missing' })
        if (!p?.totals) return set({ s: 'error' })
        set({ s: 'ok', email: st.email, totals: p.totals, queries: p.queries || [] })
      } catch { set({ s: 'error' }) }
    })()
    return () => { cancelled = true }
  }, [siteId, get])

  const seoLink = <A className="link" to={toSeo} style={{ display: 'inline-flex', minHeight: 0 }}>صفحة السيو</A>
  if (g.s === 'loading') return <Pane><div className="card"><div className="empty"><Ic n="g" /><span>نقرأ أرقامك من Google…</span></div></div></Pane>
  if (g.s !== 'ok') {
    const text = g.s === 'missing'
      ? 'حسابك في Google مربوط، لكن هذا الموقع لم يُضف إليه بعد. أضفه من صفحة السيو بزر واحد.'
      : g.s === 'error' || g.s === 'off'
        ? 'تعذّر الوصول إلى Google الآن. حاول بعد قليل.'
        : 'اربطه بحساب Google الخاص بك، وتظهر هنا مرات ظهور موقعك في جوجل، والنقرات، والكلمات التي وجدك الناس بها.'
    return (
      <Pane>
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <span className="tile blue" style={{ margin: '0 auto 14px' }}><Ic n="g" /></span>
          <h2 className="t-h3">{g.s === 'missing' ? 'الموقع غير مضاف إلى Google Search Console' : 'Google Search Console غير مربوط بعد'}</h2>
          <p className="t-small" style={{ maxWidth: 440, margin: '10px auto 18px' }}>{text}</p>
          {g.s === 'disconnected' && (demo
            ? <button className="btn k press" onClick={() => toast('في لوحتك الحقيقية يفتح هذا الزر حساب Google لتربطه', { ok: false })}><Ic n="g" />اربط Google Search Console</button>
            // A full-page visit: Google's sign-in cannot run inside a client navigation.
            : <a className="btn k press" href={`/api/gsc/connect?site=${encodeURIComponent(siteId)}`}><Ic n="g" />اربط Google Search Console</a>)}
          {g.s === 'missing' && <A className="btn k press" to={toSeo}><Ic n="g" />افتح صفحة السيو</A>}
        </div>
        <p className="t-small" style={{ margin: '12px 4px 0' }}>لتحسين ظهورك افتح {seoLink}.</p>
      </Pane>
    )
  }
  const T = g.totals
  return (
    <Pane>
      <div className="gsc-head">
        <div className="who">
          <span className="tile blue"><Ic n="g" /></span>
          <span className="trunc"><b style={{ display: 'block' }}>Google Search Console</b>{g.email && <span className="t-small">مربوط بحساب <span className="ltr">{g.email}</span></span>}</span>
        </div>
        <span className="pill ok"><Ic n="check" />متصل</span>
      </div>
      <div className="tiles">
        {([['مرات الظهور', fmt(T.impressions), 'eye', 'في نتائج جوجل'], ['النقرات', fmt(T.clicks), 'click', 'دخلوا موقعك من البحث'], ['نسبة النقر', `${(T.ctr * (T.ctr <= 1 ? 100 : 1)).toFixed(1)}%`, 'percent', 'نقرات من كل ظهور'], ['متوسط الترتيب', T.position.toFixed(1), 'sort', 'الأقل أفضل']] as [string, string, IconName, string][]).map((x) => (
          <div className="stat" key={x[0]}><span className="top"><span>{x[0]}</span><Ic n={x[2]} /></span><span className="v num">{x[1]}</span><span className="ft"><small>{x[3]}</small></span></div>
        ))}
      </div>
      <div className="card flush" style={{ marginTop: 16 }}>
        <div className="card-h" style={{ padding: '20px 20px 0' }}><h2 className="t-h3">الكلمات التي وجدوك بها</h2><span className="side-note">آخر 28 يومًا</span></div>
        {g.queries.length === 0 ? <div className="empty"><b>لا كلمات بعد</b><span>تظهر هنا حين يجدك الناس في بحث جوجل.</span></div> : (
          <table className="tbl">
            <thead><tr><th>الكلمة</th><th>الظهور</th><th>النقرات</th><th className="end">الترتيب</th></tr></thead>
            <tbody>
              {g.queries.slice(0, 20).map((q) => (
                <tr key={q.query}>
                  <td className="k" data-l="الكلمة">{q.query}</td>
                  <td data-l="الظهور" className="num">{fmt(q.impressions)}</td>
                  <td data-l="النقرات" className="num">{fmt(q.clicks)}</td>
                  <td className="end"><span className={`pill ${q.position <= 3 ? 'ok' : q.position <= 10 ? 'blue' : ''} num`}>#{Math.round(q.position)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="t-small" style={{ margin: '12px 4px 0' }}>أرقام حقيقية من Google تصل متأخرة يومين أو ثلاثة. لتحسين ظهورك افتح {seoLink}.</p>
    </Pane>
  )
}

/* ---- مباشر ----------------------------------------------------------------------------- */
const ago = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 45 ? 'الآن' : s < 3600 ? `قبل ${Math.round(s / 60)} د` : `قبل ${Math.round(s / 3600)} س` }

function Live({ get, siteId, tz }: { get: AnalyticsGet; siteId: string; tz: string }) {
  const [rt, setRt] = useState<RealtimePayload | null>(null)
  const [today, setToday] = useState<{ visitors: number; events: number } | null>(null)
  const [, tick] = useState(0)
  const load = useCallback(() => {
    if (document.hidden) return
    get('/api/analytics/realtime', { site: siteId })
      .then((j: RealtimePayload) => { if (j) setRt(j) }).catch(() => {})
    get('/api/analytics/day', { tz, site: siteId, date: ymd(dateAgo(0)) })
      .then((j: DayPayload | null) => { if (j?.totals) setToday({ visitors: j.totals.visitors, events: j.totals.events }) }).catch(() => {})
  }, [get, siteId, tz])
  useEffect(() => {
    load()
    const t = setInterval(() => { load(); tick((x) => x + 1) }, 10_000)
    return () => clearInterval(t)
  }, [load])
  const feed = (rt?.recent || []).filter((r) => !r.is_bot).slice(0, 6)
  return (
    <Pane>
      <div className="an-grid" style={{ marginTop: 0 }}>
        <div className="card">
          <div className="pulse">
            <span className="big num">{rt ? rt.active : '…'}</span>
            <span><span className="live">مباشر الآن</span><span className="t-small" style={{ display: 'block' }}>أشخاص يتصفحون موقعك في هذه اللحظة</span></span>
          </div>
          <div className="rows" style={{ marginTop: 12 }}>
            <div className="r"><span className="tile"><Ic n="users" /></span><span className="tx"><b>زوار اليوم</b></span><span className="end"><b className="num">{today ? fmt(today.visitors) : '…'}</b></span></div>
            <div className="r"><span className="tile"><Ic n="click" /></span><span className="tx"><b>تواصل اليوم</b></span><span className="end"><b className="num">{today ? fmt(today.events) : '…'}</b></span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h2 className="t-h3">آخر الزيارات</h2><span className="side-note">تتحدث تلقائيًا</span></div>
          {feed.length === 0 ? <Empty text="لا زيارات في آخر ساعة." /> : (
            <div className="feed">
              {feed.map((x) => (
                <div className="fi" key={x.id}>
                  <span className="tile"><Ic n={x.device === 'Desktop' ? 'monitor' : x.device === 'Tablet' ? 'tablet' : 'mobile'} /></span>
                  <span className="tx"><b>{pageName(x.path)}</b><span>{x.channel ? CHANNEL_LABEL_AR[x.channel as keyof typeof CHANNEL_LABEL_AR] || x.channel : 'مباشر'} · {countryNameAr(x.country)}</span></span>
                  <time className="num">{ago(new Date(x.at).getTime())}</time>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Pane>
  )
}
