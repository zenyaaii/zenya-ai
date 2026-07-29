'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Radio, Users } from 'lucide-react'
import { CHANNEL_LABEL_AR, countryFlag, countryNameAr, deviceLabelAr, type Channel } from '@/lib/analytics-core'
import { BarList, EmptyState, Note, Panel, PanelWithTitle, Section, TableWrap, Td, Th } from './primitives'
import { DeviceIcon } from './panels'
import type { RealtimePayload } from './types'

const POLL_MS = 15_000

/**
 * Live view of the owner's sites.
 *
 * Polls rather than streams: at this traffic volume a websocket would cost
 * more than it saves, and a 15s refresh already feels live. Polling pauses
 * while the tab is hidden so a backgrounded dashboard doesn't sit there
 * hammering the API all day.
 */
export default function RealtimePanel({
  site, includeBots,
}: {
  site: string
  includeBots: boolean
}) {
  const [data, setData] = useState<RealtimePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams()
      if (site) qs.set('site', site)
      if (includeBots) qs.set('bots', '1')
      const r = await fetch(`/api/analytics/realtime?${qs}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(`تعذّر التحميل (${r.status})`)
      setData(await r.json())
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'فشل التحميل')
    } finally {
      setLoading(false)
    }
  }, [site, includeBots])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      if (document.visibilityState === 'visible') await load()
      if (!cancelled) timer.current = setTimeout(tick, POLL_MS)
    }
    tick()
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [load])

  if (loading && !data) {
    return <div className="mt-8 h-64 animate-pulse rounded-2xl border border-token bg-white" />
  }
  if (error && !data) {
    return (
      <Section title="مباشر">
        <Panel className="p-8 text-center text-[13px] text-muted">{error}</Panel>
      </Section>
    )
  }
  if (!data) return null

  const feed = data.recent

  return (
    <>
      <Section title="الآن على موقعك">
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <div className="flex items-start justify-between">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                زوّار نشطون
              </div>
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                {data.active > 0 && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15803d] opacity-60" />
                )}
                <span
                  className={
                    'relative inline-flex h-2.5 w-2.5 rounded-full ' +
                    (data.active > 0 ? 'bg-[#15803d]' : 'bg-[rgba(28,28,28,0.18)]')
                  }
                />
              </span>
            </div>
            <div className="mt-2 text-[28px] font-bold tabular-nums tracking-tight text-foreground">
              {data.active.toLocaleString('ar')}
            </div>
            <div className="mt-1 text-[12px] text-muted">
              خلال آخر {data.active_window_min} دقائق
            </div>
          </Panel>

          <div className="lg:col-span-2">
            <PanelWithTitle title="الصفحات النشطة الآن">
              <BarList
                rows={data.active_pages.map((p) => ({
                  name: p.path === '/' ? 'الصفحة الرئيسية' : p.path,
                  views: p.count, sessions: 0, visitors: 0,
                }))}
                emptyLabel="لا أحد يتصفّح موقعك في هذه اللحظة"
              />
            </PanelWithTitle>
          </div>
        </div>
      </Section>

      <Section title="أحدث الزيارات" hint="آخر 24 ساعة">
        {feed.length === 0 ? (
          <EmptyState
            icon={Users}
            title="لا زيارات في آخر 24 ساعة"
            body="انشر موقعك وشارك رابطه — ستظهر كل زيارة هنا خلال ثوانٍ من حدوثها."
          />
        ) : (
          <TableWrap>
            <thead className="bg-[#fafaf7]">
              <tr>
                <Th>متى</Th>
                <Th>الموقع</Th>
                <Th>الصفحة</Th>
                <Th>المصدر</Th>
                <Th>الدولة</Th>
                <Th>الجهاز</Th>
              </tr>
            </thead>
            <tbody>
              {feed.map((v) => (
                <tr key={v.id} className="border-t border-token">
                  <Td className="whitespace-nowrap text-muted tabular-nums">{timeAgo(v.at)}</Td>
                  <Td>
                    <div className="truncate font-medium text-foreground">{v.site_name}</div>
                    <div className="truncate text-[11px] text-muted">{v.template}</div>
                  </Td>
                  <Td className="text-foreground">{v.path === '/' ? 'الرئيسية' : v.path}</Td>
                  <Td className="text-foreground">
                    {v.source || (v.channel ? CHANNEL_LABEL_AR[v.channel as Channel] || v.channel : 'مباشر')}
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground">
                      <span aria-hidden>{countryFlag(v.country)}</span>
                      {countryNameAr(v.country)}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground">
                      <DeviceIcon device={v.device} />
                      {deviceLabelAr(v.device)}
                      {v.is_bot && (
                        <span className="rounded-full bg-[rgba(28,28,28,0.06)] px-1.5 py-0.5 text-[10px] text-muted">
                          روبوت
                        </span>
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Note>
          <Radio className="me-1 inline h-3 w-3 align-[-2px]" />
          يُحدَّث تلقائيًا كل {POLL_MS / 1000} ثانية · كل صف = مشاهدة صفحة واحدة · بلا ملفات ارتباط
        </Note>
      </Section>
    </>
  )
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `قبل ${s} ث`
  const m = Math.round(s / 60)
  if (m < 60) return `قبل ${m} د`
  const h = Math.round(m / 60)
  if (h < 24) return `قبل ${h} س`
  return `قبل ${Math.round(h / 24)} ي`
}
