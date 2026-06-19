'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Globe, Link2, Monitor, Smartphone, Tablet, Bot, HelpCircle,
  RefreshCw, ExternalLink,
} from 'lucide-react'

type Visitors = {
  generated_at: string
  summary: { visits_7d: number; visits_30d: number; top_country: string | null; top_source: string | null }
  by_country: Array<{ name: string; count: number }>
  by_source: Array<{ name: string; count: number }>
  by_device: Array<{ name: string; count: number }>
  recent: Array<{
    id: number
    at: string
    site_name: string
    template: string
    slug: string | null
    country: string | null
    device: string
    source: string
  }>
  sites: Array<{ id: string; name: string }>
  site_filter: string | null
}

export default function VisitorsPage() {
  const [data, setData] = useState<Visitors | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [site, setSite] = useState<string>('')

  const load = useCallback(async (siteId: string) => {
    setLoading(true)
    try {
      const qs = siteId ? `?site=${encodeURIComponent(siteId)}` : ''
      const r = await fetch(`/api/visitors${qs}`, { cache: 'no-store' })
      if (!r.ok) { setError(`فشل تحميل الزوّار (${r.status})`); return }
      setData(await r.json())
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'فشل التحميل')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(site) }, [site, load])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">الزوّار</h1>
          <p className="mt-1 text-[13px] text-muted">
            كل زيارة لمواقعك المُستضافة على زينيا — من أين أتوا، والدولة، والجهاز. بلا ملفات ارتباط، وبلا متتبّعات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && data.sites.length > 0 && (
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="rounded-md border border-token bg-white px-2.5 py-1.5 text-[12.5px] text-foreground outline-none focus:border-primary"
            >
              <option value="">كل المواقع</option>
              {data.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button
            onClick={() => load(site)}
            className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-black/5"
          >
            <RefreshCw className={'h-3 w-3 ' + (loading ? 'animate-spin' : '')} /> تحديث
          </button>
        </div>
      </header>

      {error ? (
        <div className="mt-8 rounded-2xl border border-token bg-white p-8 text-center text-[13px] text-muted">{error}</div>
      ) : loading && !data ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-token bg-white" />)}</div>
      ) : data ? (
        <>
          {/* Summary tiles */}
          <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="الزيارات (7 أيام)" value={data.summary.visits_7d.toLocaleString()} sub="آخر 7 أيام" icon={Users} />
            <Tile label="الزيارات (30 يومًا)" value={data.summary.visits_30d.toLocaleString()} sub="آخر 30 يومًا" icon={Users} />
            <Tile label="أعلى دولة" value={data.summary.top_country || '—'} sub="آخر 30 يومًا" icon={Globe} />
            <Tile label="أعلى مصدر" value={data.summary.top_source || '—'} sub="آخر 30 يومًا" icon={Link2} />
          </section>

          {data.summary.visits_30d === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-token bg-white p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted/60" strokeWidth={1.5} />
              <h3 className="mt-3 text-[15px] font-semibold text-foreground">لا زيارات بعد</h3>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">
                انشر موقعًا على زينيا وشاركه — ستظهر كل زيارة هنا فورًا.
              </p>
              <Link href="/dashboard/sites" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white">
                إدارة المواقع
              </Link>
            </div>
          ) : (
            <>
              {/* Breakdowns */}
              <section className="mt-8 grid gap-5 lg:grid-cols-3">
                <Card title="الأجهزة">
                  <DeviceList items={data.by_device} />
                </Card>
                <Card title="أعلى المصادر">
                  <BarList items={data.by_source} />
                </Card>
                <Card title="أعلى الدول">
                  <BarList items={data.by_country} />
                </Card>
              </section>

              {/* Recent activity */}
              <section className="mt-10">
                <h2 className="mb-2 text-[15px] font-semibold tracking-tight text-foreground">أحدث الزيارات</h2>
                <div className="overflow-hidden rounded-2xl border border-token bg-white">
                  <table className="w-full text-start text-[13px]">
                    <thead className="bg-[#fafaf7]">
                      <tr>
                        <Th>متى</Th><Th>الموقع</Th><Th>المصدر</Th><Th>الدولة</Th><Th>الجهاز</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.map((v) => (
                        <tr key={v.id} className="border-t border-token">
                          <td className="px-4 py-2.5 text-muted tabular-nums">{timeAgo(v.at)}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-foreground">{v.site_name}</div>
                            <div className="text-[11px] text-muted">{v.template}</div>
                          </td>
                          <td className="px-4 py-2.5 text-foreground">{v.source}</td>
                          <td className="px-4 py-2.5 text-foreground">{v.country || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1.5 text-foreground">
                              <DeviceIcon device={v.device} /> {deviceLabel(v.device)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          <p className="mt-10 text-center text-[11.5px] text-muted">
            أُنشئ {new Date(data.generated_at).toLocaleString()} · مباشر من Supabase · كل صف = مشاهدة واحدة
          </p>
        </>
      ) : null}
    </div>
  )
}

function Tile({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[rgba(94,106,210,0.10)]">
          <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-2 truncate text-[22px] font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-[12px] text-muted">{sub}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function BarList({ items }: { items: Array<{ name: string; count: number }> }) {
  if (!items.length) return <div className="py-4 text-center text-[12.5px] text-muted">لا بيانات بعد</div>
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

function DeviceList({ items }: { items: Array<{ name: string; count: number }> }) {
  if (!items.length) return <div className="py-4 text-center text-[12.5px] text-muted">لا بيانات بعد</div>
  const total = items.reduce((s, i) => s + i.count, 0) || 1
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-2 text-[12.5px]">
          <DeviceIcon device={i.name} />
          <span className="font-medium text-foreground">{deviceLabel(i.name)}</span>
          <span className="ms-auto tabular-nums text-muted">{Math.round((i.count / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}

function deviceLabel(device: string): string {
  const map: Record<string, string> = {
    Mobile: 'جوال', Tablet: 'لوحي', Desktop: 'حاسوب', Bot: 'روبوت', Unknown: 'غير معروف',
  }
  return map[device] || device
}

function DeviceIcon({ device }: { device: string }) {
  const cls = 'h-3.5 w-3.5 text-muted'
  if (device === 'Mobile') return <Smartphone className={cls} strokeWidth={2} />
  if (device === 'Tablet') return <Tablet className={cls} strokeWidth={2} />
  if (device === 'Desktop') return <Monitor className={cls} strokeWidth={2} />
  if (device === 'Bot') return <Bot className={cls} strokeWidth={2} />
  return <HelpCircle className={cls} strokeWidth={2} />
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</th>
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `منذ ${s} ث`
  const m = Math.round(s / 60)
  if (m < 60) return `منذ ${m} د`
  const h = Math.round(m / 60)
  if (h < 24) return `منذ ${h} س`
  const d = Math.round(h / 24)
  return `منذ ${d} ي`
}
