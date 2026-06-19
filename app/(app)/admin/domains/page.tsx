import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock, ExternalLink,
  TrendingUp, DollarSign, Globe, Calendar, XCircle,
} from 'lucide-react'
import RefundButton from './RefundButton'

/**
 * Admin-only operational view of every domain ever bought through
 * Zenya. Renders server-side because the data is sensitive (margins,
 * Stripe IDs, errors) and we don't want anything leaking client-side.
 *
 * Access gate: profile.plan === 'admin'. Non-admins get redirected to
 * /dashboard so they don't even learn this URL exists.
 */
export const dynamic = 'force-dynamic'

type Row = {
  id: string
  user_id: string
  theme_id: string | null
  domain: string
  years: number
  status: 'pending_payment' | 'paid' | 'registering' | 'active' | 'failed' | 'refunded'
  wholesale_usd: number | null
  retail_usd_charged: number | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  registered_at: string | null
  expires_at: string | null
  error_message: string | null
  created_at: string
}

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

const STATUS_TINT: Record<Row['status'], { bg: string; fg: string; ring: string; label: string }> = {
  pending_payment: { bg: 'rgba(28,28,28,0.06)',  fg: '#5f5f5d', ring: 'rgba(28,28,28,0.14)', label: 'بانتظار الدفع' },
  paid:            { bg: 'rgba(94,106,210,0.10)', fg: '#5e6ad2', ring: 'rgba(94,106,210,0.28)', label: 'مدفوع · جارٍ التسجيل' },
  registering:     { bg: 'rgba(94,106,210,0.10)', fg: '#5e6ad2', ring: 'rgba(94,106,210,0.28)', label: 'جارٍ التسجيل…' },
  active:          { bg: 'rgba(21,128,61,0.10)',  fg: '#15803d', ring: 'rgba(21,128,61,0.28)',  label: 'نشط' },
  failed:          { bg: 'rgba(220,38,38,0.10)',  fg: '#b91c1c', ring: 'rgba(220,38,38,0.30)',  label: 'فشل' },
  refunded:        { bg: 'rgba(217,119,6,0.10)',  fg: '#b45309', ring: 'rgba(217,119,6,0.28)',  label: 'مُسترد' },
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return '—'
  return `$${Number(n).toFixed(2)}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ar-u-nu-latn', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export default async function AdminDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/domains')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.plan !== 'admin') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const filterStatus = (params?.status || '').trim()

  const db = adminDb()
  const q = db
    .from('domain_purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (filterStatus) q.eq('status', filterStatus)

  const { data: rows } = await q
  const all = (rows || []) as Row[]

  // Stats — counted from the unfiltered set so the totals don't shift
  // when the operator picks a filter.
  const { data: allForStats } = await db
    .from('domain_purchases')
    .select('status, wholesale_usd, retail_usd_charged, expires_at')

  const stats = computeStats((allForStats || []) as Row[])

  // For the "owner" column, look up emails in one round-trip.
  const userIds = Array.from(new Set(all.map((r) => r.user_id)))
  const emailMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: emails } = await db
      .from('profiles')
      .select('id, email')
      .in('id', userIds)
    for (const e of emails || []) emailMap[(e as any).id] = (e as any).email
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الإدارة</div>
          <h1 className="mt-0.5 text-[24px] font-bold tracking-tight text-foreground">النطاقات</h1>
          <p className="mt-1 text-[13px] text-muted">
            كل نطاق اشتُري عبر زينيا. استردّ هنا إن فشل تسجيل أو طلب المستخدم ذلك.
          </p>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-foreground">
          <ArrowLeft className="h-3 w-3 rtl-flip" /> العودة للوحة التحكم
        </Link>
      </header>

      {/* ── KPI strip ───────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi icon={Globe}       label="نشط"             value={String(stats.active)} />
        <Kpi icon={DollarSign}  label="إجمالي الإيراد"   value={fmtUsd(stats.revenue)} sub={`${stats.paidCount} مدفوع`} />
        <Kpi icon={TrendingUp}  label="الهامش"          value={fmtUsd(stats.margin)} sub={stats.revenue > 0 ? `${((stats.margin / stats.revenue) * 100).toFixed(1)}%` : '—'} />
        <Kpi icon={Calendar}    label="ينتهي خلال 30 يومًا" value={String(stats.expiring30)} />
        <Kpi icon={AlertCircle} label="فشل / مُسترد"     value={String(stats.failed + stats.refunded)} />
      </div>

      {/* ── Filter chips ────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <FilterChip current={filterStatus} value="" label={`الكل (${stats.total})`} />
        {(['active', 'registering', 'paid', 'pending_payment', 'failed', 'refunded'] as const).map((s) => (
          <FilterChip
            key={s}
            current={filterStatus}
            value={s}
            label={`${STATUS_TINT[s].label} (${stats.byStatus[s] || 0})`}
            tint={STATUS_TINT[s]}
          />
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      {all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-token bg-white p-12 text-center">
          <Globe className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
          <h3 className="mt-4 text-[16px] font-semibold text-foreground">لا عمليات شراء نطاقات بعد</h3>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
            بمجرد أن يشتري المستخدمون نطاقات عبر أداة البحث عن نطاق، ستظهر هنا. جرّب واحدًا بنفسك من <Link href="/dashboard/domains" className="text-primary hover:underline">/dashboard/domains</Link>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-token bg-white">
          <table className="w-full text-start text-[12.5px]">
            <thead className="bg-[#fafaf7]">
              <tr>
                <Th>النطاق</Th>
                <Th>المالك</Th>
                <Th>الحالة</Th>
                <Th className="text-end">المبلغ المحصَّل</Th>
                <Th className="text-end">سعر الجملة</Th>
                <Th className="text-end">الهامش</Th>
                <Th>ينتهي في</Th>
                <Th className="text-end">إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {all.map((r) => {
                const tint = STATUS_TINT[r.status]
                const days = daysUntil(r.expires_at)
                const margin = (r.retail_usd_charged ?? 0) - (r.wholesale_usd ?? 0)
                const Icon = r.status === 'active' ? CheckCircle2
                          : r.status === 'failed' ? XCircle
                          : Clock
                return (
                  <tr key={r.id} className="border-t border-token align-top">
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-foreground">{r.domain}</div>
                      <div className="mt-0.5 text-[11px] text-muted">
                        {r.years} سنة · اشتُري {fmtDate(r.created_at)}
                      </div>
                      {r.error_message && (
                        <div className="mt-1 max-w-[24rem] break-words rounded bg-[rgba(220,38,38,0.06)] px-1.5 py-1 text-[11px] text-[#b91c1c]">
                          {r.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="truncate text-foreground">{emailMap[r.user_id] || '—'}</div>
                      <div className="text-[11px] text-muted font-mono">{r.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                        style={{ background: tint.bg, color: tint.fg, border: `1px solid ${tint.ring}` }}
                      >
                        <Icon className="h-3 w-3" />
                        {tint.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-end tabular-nums">{fmtUsd(r.retail_usd_charged)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums text-muted">{fmtUsd(r.wholesale_usd)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums" style={{ color: margin > 0 ? '#15803d' : '#5f5f5d' }}>
                      {fmtUsd(margin || null)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-foreground">{fmtDate(r.expires_at)}</div>
                      {days != null && r.status === 'active' && (
                        <div className={`text-[11px] ${days < 30 ? 'text-[#b45309]' : 'text-muted'}`}>
                          {days < 0 ? `قبل ${-days} يومًا` : `خلال ${days} يومًا`}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'active' && (
                          <a
                            href={`https://${r.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2 py-1 text-[11px] font-medium text-muted hover:bg-black/5"
                          >
                            فتح <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                          </a>
                        )}
                        {r.stripe_payment_intent_id && (r.status === 'failed' || r.status === 'active' || r.status === 'paid') && (
                          <RefundButton purchaseId={r.id} domain={r.domain} amount={r.retail_usd_charged ?? 0} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function computeStats(rows: Row[]) {
  const byStatus: Record<Row['status'], number> = {
    pending_payment: 0, paid: 0, registering: 0, active: 0, failed: 0, refunded: 0,
  }
  let revenue = 0
  let margin = 0
  let expiring30 = 0
  const now = Date.now()
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1
    if (r.status === 'active' || r.status === 'paid' || r.status === 'registering') {
      revenue += Number(r.retail_usd_charged) || 0
      margin += (Number(r.retail_usd_charged) || 0) - (Number(r.wholesale_usd) || 0)
    }
    if (r.status === 'active' && r.expires_at) {
      const days = (new Date(r.expires_at).getTime() - now) / (1000 * 60 * 60 * 24)
      if (days >= 0 && days <= 30) expiring30 += 1
    }
  }
  return {
    total: rows.length,
    byStatus,
    active: byStatus.active,
    paidCount: byStatus.active + byStatus.paid + byStatus.registering,
    failed: byStatus.failed,
    refunded: byStatus.refunded,
    revenue: +revenue.toFixed(2),
    margin: +margin.toFixed(2),
    expiring30,
  }
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </th>
  )
}

function Kpi({
  icon: Icon, label, value, sub,
}: {
  icon: any; label: string; value: string; sub?: string
}) {
  return (
    <div className="rounded-2xl border border-token bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        <Icon className="h-3 w-3" strokeWidth={2} />
        {label}
      </div>
      <div className="mt-1.5 text-[20px] font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-muted">{sub}</div>}
    </div>
  )
}

function FilterChip({
  current, value, label, tint,
}: {
  current: string; value: string; label: string
  tint?: { bg: string; fg: string; ring: string }
}) {
  const active = current === value
  const href = value ? `/admin/domains?status=${value}` : '/admin/domains'
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium transition"
      style={{
        background: active ? (tint?.bg || '#1c1c1c') : 'transparent',
        color: active ? (tint?.fg || '#fff') : '#5f5f5d',
        border: `1px solid ${active ? (tint?.ring || '#1c1c1c') : 'rgba(28,28,28,0.14)'}`,
      }}
    >
      {label}
    </Link>
  )
}
