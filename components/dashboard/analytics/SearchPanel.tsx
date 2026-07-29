'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, MousePointerClick, Eye, Percent, ArrowUpDown } from 'lucide-react'
import { EmptyState, Note, Panel, Section, TableWrap, Td, Th, Tile } from './primitives'
import type { SiteRef } from './types'

type Status = { configured: boolean; connected: boolean; email: string | null }

type Perf = {
  connected: boolean
  reason?: 'not_connected' | 'not_published' | 'property_not_found' | 'no_data_yet' | 'ok'
  property?: string
  expectedProperty?: string
  availableProperties?: string[]
  range?: { startDate: string; endDate: string }
  totals?: { clicks: number; impressions: number; ctr: number; position: number }
  queries?: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>
}

/**
 * Google Search Console, folded into analytics.
 *
 * The integration already existed and worked — it was just stranded on the SEO
 * page, which meant the one number that predicts future traffic (search
 * impressions) lived nowhere near the traffic report. Search Console
 * properties are per-site, so this tab always resolves to exactly one site.
 */
export default function SearchPanel({
  sites, site, onPickSite,
}: {
  sites: SiteRef[]
  site: string
  onPickSite: (id: string) => void
}) {
  const published = sites.filter((s) => s.is_published && s.slug)
  const active = site && published.some((s) => s.id === site) ? site : published[0]?.id || ''

  const [status, setStatus] = useState<Status | null>(null)
  const [perf, setPerf] = useState<Perf | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const st = await fetch('/api/gsc/status', { cache: 'no-store' }).then((r) => r.json())
      setStatus(st)
      if (st?.connected && active) {
        const p = await fetch(`/api/gsc/performance?themeId=${encodeURIComponent(active)}`, {
          cache: 'no-store',
        }).then((r) => r.json())
        setPerf(p)
      } else {
        setPerf(null)
      }
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [active])

  useEffect(() => { load() }, [load])

  if (published.length === 0) {
    return (
      <Section title="أداء البحث">
        <EmptyState
          icon={Search}
          title="لا مواقع منشورة"
          body="بيانات البحث تأتي من Google Search Console، وتحتاج موقعًا منشورًا على رابط حقيقي أولًا."
          cta={{ href: '/dashboard/sites', label: 'إدارة المواقع' }}
        />
      </Section>
    )
  }

  if (loading) {
    return <div className="mt-8 h-64 animate-pulse rounded-2xl border border-token bg-white" />
  }

  if (!status?.configured) {
    return (
      <Section title="أداء البحث">
        <EmptyState
          icon={Search}
          title="ربط Search Console غير مُفعّل"
          body="هذه الميزة تحتاج إعداد Google OAuth على مستوى المنصة. تواصل معنا لتفعيلها لحسابك."
        />
      </Section>
    )
  }

  if (!status.connected) {
    return (
      <Section title="أداء البحث">
        <EmptyState
          icon={Search}
          title="اربط حساب Google الخاص بك"
          body="اربط Search Console لترى عدد مرات ظهور موقعك في نتائج جوجل، والنقرات، وأهم الكلمات التي وجدك بها الناس — بيانات حقيقية من جوجل مباشرة."
          cta={{ href: '/api/gsc/connect', label: 'ربط Search Console' }}
        />
      </Section>
    )
  }

  const siteSelector = published.length > 1 && (
    <select
      value={active}
      onChange={(e) => onPickSite(e.target.value)}
      className="rounded-md border border-token bg-white px-2.5 py-1.5 text-[12.5px] text-foreground outline-none focus:border-primary"
      aria-label="اختر الموقع"
    >
      {published.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  )

  if (perf?.reason === 'property_not_found') {
    return (
      <Section title="أداء البحث" action={siteSelector}>
        <Panel className="p-6">
          <h3 className="text-[15px] font-semibold text-foreground">هذا الموقع غير مُضاف في Search Console</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            حسابك مرتبط ({status.email})، لكن لم نجد هذا الموقع ضمن خصائصك. أضف العنوان التالي
            كخاصية جديدة في Search Console:
          </p>
          <code className="mt-3 block rounded-lg bg-black/[0.04] px-3 py-2 text-[12.5px] text-foreground" dir="ltr">
            {perf.expectedProperty}
          </code>
          <Link href="/dashboard/seo" className="mt-4 inline-block text-[12.5px] font-medium text-primary hover:underline">
            دليل الإضافة خطوة بخطوة ←
          </Link>
        </Panel>
      </Section>
    )
  }

  if (perf?.reason === 'not_published') {
    return (
      <Section title="أداء البحث" action={siteSelector}>
        <EmptyState icon={Search} title="الموقع غير منشور" body="انشر الموقع أولًا حتى يتمكّن جوجل من فهرسته." />
      </Section>
    )
  }

  const t = perf?.totals
  const noData = !t || t.impressions === 0

  return (
    <>
      <Section title="أداء البحث" action={siteSelector}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="مرات الظهور" value={(t?.impressions ?? 0).toLocaleString('ar')} icon={Eye} accent="#5e6ad2" sub="آخر 28 يومًا" />
          <Tile label="النقرات" value={(t?.clicks ?? 0).toLocaleString('ar')} icon={MousePointerClick} accent="#15803d" sub="من نتائج البحث" />
          <Tile label="نسبة النقر" value={t ? `${(t.ctr * 100).toFixed(1)}%` : '—'} icon={Percent} accent="#9b6f00" sub="نقرات ÷ ظهور" />
          <Tile label="متوسط الترتيب" value={t && t.position ? t.position.toFixed(1) : '—'} icon={ArrowUpDown} accent="#c8a96a" sub="كلما قلّ كان أفضل" />
        </div>
        {noData && (
          <Note>
            جوجل لم يسجّل أي ظهور لهذا الموقع بعد. الفهرسة تستغرق عادةً من بضعة أيام إلى أسبوعين
            بعد النشر — هذه أرقام حقيقية من Search Console وليست تقديرات.
          </Note>
        )}
      </Section>

      {perf?.queries && perf.queries.length > 0 && (
        <Section title="الكلمات التي وجدوك بها" hint="أعلى 10 عبارات">
          <TableWrap>
            <thead className="bg-[#fafaf7]">
              <tr>
                <Th>العبارة</Th>
                <Th align="end">النقرات</Th>
                <Th align="end">الظهور</Th>
                <Th align="end">CTR</Th>
                <Th align="end">الترتيب</Th>
              </tr>
            </thead>
            <tbody>
              {perf.queries.map((q) => (
                <tr key={q.query} className="border-t border-token">
                  <Td><span className="font-medium text-foreground">{q.query}</span></Td>
                  <Td align="end" className="text-foreground">{q.clicks.toLocaleString('ar')}</Td>
                  <Td align="end" className="text-muted">{q.impressions.toLocaleString('ar')}</Td>
                  <Td align="end" className="text-muted">{(q.ctr * 100).toFixed(1)}%</Td>
                  <Td align="end" className="text-muted">{q.position.toFixed(1)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Note>مصدر البيانات: Google Search Console · الحساب {status.email}</Note>
        </Section>
      )}
    </>
  )
}
