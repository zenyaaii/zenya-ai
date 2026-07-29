'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Cpu, DollarSign, RefreshCw, Repeat, Users } from 'lucide-react'
import {
  BarList, Panel, PanelWithTitle, Section, SkeletonTile, Tile, rise,
} from './analytics/primitives'

/**
 * Founder-only business dashboard.
 *
 * Previously this was a mode toggle inside the customer-facing analytics page,
 * which meant the two audiences (a shop owner looking at their traffic, and
 * the founder looking at MRR) shared one route and one component. Split out so
 * neither has to carry the other's concerns.
 */
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

export default function AdminDashboard() {
  const [d, setD] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(silent = false) {
    if (silent) setRefreshing(true)
    try {
      const r = await fetch('/api/admin/analytics', { cache: 'no-store' })
      if (!r.ok) { setErr(r.status === 403 ? 'للإدارة فقط.' : `تعذّر التحميل (${r.status})`); return }
      setD(await r.json())
      setErr(null)
    } catch (e: any) {
      setErr(e?.message || 'فشل التحميل')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  useEffect(() => { load() }, [])

  const usd = (cents: number) => '$' + (cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <motion.header
        {...rise}
        className="flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5"
      >
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
            الإدارة · الأعمال
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            مسار التحويل والإيرادات واقتصاديات الوحدة على مستوى المنصة · عرض المؤسس.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-black/5"
          >
            تحليلات مواقعي
            <ArrowRight className="h-3 w-3 rtl-flip" />
          </Link>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-black/5 disabled:opacity-60"
          >
            <RefreshCw className={'h-3 w-3 ' + (refreshing ? 'animate-spin' : '')} />
            {refreshing ? 'جارٍ التحديث…' : 'تحديث'}
          </button>
        </div>
      </motion.header>

      {loading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonTile key={i} />)}
        </div>
      ) : err || !d ? (
        <Panel className="mt-8 p-8 text-center text-[13px] text-muted">{err || 'لا بيانات'}</Panel>
      ) : (
        <AdminBody d={d} usd={usd} />
      )}
    </div>
  )
}

function AdminBody({ d, usd }: { d: AdminData; usd: (c: number) => string }) {
  const maxFunnel = Math.max(1, ...d.funnel.map((f) => f.users))
  const topUsers = d.funnel[0]?.users || 0
  const planItems = Object.entries(d.plan_breakdown)
    .map(([name, count]) => ({ name, views: count, sessions: 0, visitors: 0 }))
    .sort((a, b) => b.views - a.views)
  const eventItems = Object.entries(d.event_counts_30d)
    .map(([name, count]) => ({ name, views: count, sessions: 0, visitors: 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
  const maxOpCost = Math.max(0.0001, ...d.ai_usage.by_operation.map((o) => o.cost_usd))

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="الإيرادات (الإجمالي)" value={usd(d.revenue.gross_all_time_cents)}
          sub={`${d.revenue.paying_users} مشترك مدفوع · ${usd(d.revenue.gross_30d_cents)} خلال 30 يومًا`}
          icon={DollarSign} accent="#15803d"
        />
        <Tile
          label="الإيراد الشهري المتكرر" value={usd(d.revenue.mrr_cents)}
          sub={`${d.revenue.hosting_active} نشط · ${d.revenue.churned_30d} ملغى خلال 30 يومًا`}
          icon={Repeat} accent="#5e6ad2"
        />
        <Tile
          label="إنفاق الذكاء الاصطناعي" value={`$${d.ai_usage.cost_total_usd.toFixed(2)}`}
          sub={`$${d.ai_usage.cost_30d_usd.toFixed(2)} آخر 30 يومًا`}
          icon={Cpu} accent="#9b6f00"
        />
        <Tile
          label="المستخدمون" value={d.totals.users.toLocaleString('ar')}
          sub={`${d.engagement.active_30d} نشط خلال 30 يومًا · ${d.engagement.signups_30d} جديد`}
          icon={Users} accent="#c8a96a"
        />
      </section>

      <Section title="مسار التفعيل" hint="٪ من إجمالي التسجيلات">
        <Panel className="space-y-3 p-5">
          {d.funnel.map((f) => {
            const conv = topUsers ? Math.round((f.users / topUsers) * 100) : 0
            return (
              <div key={f.step}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="font-medium text-foreground">{f.step}</span>
                  <span className="tabular-nums text-muted">{f.users.toLocaleString('ar')} · {conv}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(f.users / maxFunnel) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </Panel>
      </Section>

      <Section title="اقتصاديات الوحدة">
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel className="p-5">
            <div className="space-y-2 text-[12.5px]">
              <Row label="الإيرادات (الإجمالي)" value={usd(d.revenue.gross_all_time_cents)} />
              <Row label="إنفاق الذكاء الاصطناعي (الإجمالي)" value={`$${d.ai_usage.cost_total_usd.toFixed(2)}`} />
              <Row label="هامش الذكاء الاصطناعي من الإيراد" value={d.ai_usage.margin_vs_revenue_pct == null ? '—' : `${d.ai_usage.margin_vs_revenue_pct}%`} />
              <Row label="تكلفة الذكاء الاصطناعي / مستخدم" value={`$${d.ai_usage.cost_per_user_usd.toFixed(2)}`} />
              <Row label="إجمالي الرموز" value={d.ai_usage.tokens_total.toLocaleString('ar')} />
            </div>
            {d.ai_usage.by_operation.length > 0 && (
              <div className="mt-3 border-t border-token pt-3">
                <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                  الإنفاق حسب العملية
                </div>
                <ul className="space-y-2">
                  {d.ai_usage.by_operation.map((o) => (
                    <li key={o.operation} className="text-[12.5px]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium text-foreground">{o.operation}</span>
                        <span className="shrink-0 tabular-nums text-muted">${o.cost_usd.toFixed(2)} · {o.calls}×</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(o.cost_usd / maxOpCost) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <div className="space-y-5">
            <PanelWithTitle title="توزيع الباقات" hint="مستخدمون">
              <BarList rows={planItems} />
            </PanelWithTitle>
            <Panel className="p-5">
              <div className="space-y-2 text-[12.5px]">
                <Row label="المشاهدات (30 يومًا)" value={d.pageviews_30d.toLocaleString('ar')} />
                <Row label="النشطون (7 / 30 يومًا)" value={`${d.engagement.active_7d} / ${d.engagement.active_30d}`} />
                <Row label="المبالغ المستردة (30 يومًا)" value={String(d.revenue.refunded_30d)} />
              </div>
            </Panel>
          </div>
        </div>
      </Section>

      {eventItems.length > 0 && (
        <Section title="النشاط (30 يومًا)" hint="أحداث مسجّلة">
          <PanelWithTitle title="الأحداث">
            <BarList rows={eventItems} />
          </PanelWithTitle>
        </Section>
      )}

      <p className="mt-10 text-center text-[11.5px] text-muted">
        تم التوليد {new Date(d.generated_at).toLocaleString('ar')} · تكلفة الذكاء الاصطناعي مقدّرة بسعر القائمة
      </p>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="shrink-0 font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}
