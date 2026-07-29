'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sparkles, Plus, ArrowRight, Globe, CheckCircle2, Folder,
  BarChart3, Eye, ExternalLink, Image as ImageIcon, AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { publicSiteUrl, publicSiteHost } from '@/lib/portal-urls'

type Plan = 'free' | 'pro_onetime' | 'pro_hosting' | 'starter' | 'pro' | 'admin'

type Profile = {
  plan: Plan
  is_pro: boolean
  has_hosting: boolean
  trial_themes_limit: number
  trial_themes_used: number
  hosting_status: string | null
  hosting_current_period_end: string | null
  hosting_canceled_at?: string | null
  full_name?: string | null
  email?: string | null
}

type Theme = {
  id: string
  product_name: string
  created_at: string
  slug?: string | null
  is_published?: boolean
  template_type?: string | null
  view_count?: number | null
  content?: any
}

// Mirrors the /api/analytics payload for its default (30-day) window. The
// full shape is much larger — this is only what the home cards read.
type AnalyticsSummary = {
  totals: { views: number; visitors: number }
  site_counts: { lifetime_views: number; live_domains: number }
  series: Array<{ date: string; views: number }>
  per_site: Array<{
    id: string; product_name: string; slug: string | null
    views: number; lifetime_views: number; is_published: boolean
  }>
}

const PLAN_LABEL: Record<Plan, string> = {
  free:        'الباقة المجانية',
  pro_onetime: 'برو · مدى الحياة',
  pro_hosting: 'برو · استضافة',
  starter:     'Starter',
  pro:         'Pro',
  admin:       'مشرف',
}

const PLAN_TINT: Record<Plan, { bg: string; ring: string; fg: string }> = {
  free:        { bg: 'rgba(28,28,28,0.06)',   ring: 'rgba(28,28,28,0.18)',   fg: '#6b6b6b' },
  pro_onetime: { bg: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)', fg: '#5e6ad2' },
  pro_hosting: { bg: 'rgba(21,128,61,0.10)',  ring: 'rgba(21,128,61,0.30)',  fg: '#15803d' },
  starter:     { bg: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)', fg: '#5e6ad2' },
  pro:         { bg: 'rgba(21,128,61,0.10)',  ring: 'rgba(21,128,61,0.30)',  fg: '#15803d' },
  admin:       { bg: 'rgba(200,169,106,0.16)', ring: 'rgba(200,169,106,0.45)', fg: '#9b6f00' },
}

export default function DashboardHomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/dashboard')
      return
    }
    setUser(user)
    const [{ data: profileRow }, themesRes, analyticsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting, trial_themes_limit, trial_themes_used, hosting_status, hosting_current_period_end, hosting_canceled_at, full_name, email')
        .eq('id', user.id)
        .maybeSingle(),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })),
      fetch('/api/analytics').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
    setProfile((profileRow as unknown as Profile) || null)
    setThemes((themesRes?.themes as Theme[]) || [])
    setAnalytics((analyticsRes as AnalyticsSummary) || null)
    setLoading(false)
  }, [router, supabase])

  useEffect(() => { load() }, [load])

  const plan: Plan = profile?.plan || 'free'
  const isPro = !!profile?.is_pro || plan === 'admin'
  const hasHosting = !!profile?.has_hosting || plan === 'admin'
  const trialLimit = profile?.trial_themes_limit ?? 2
  const trialUsed = profile?.trial_themes_used ?? 0
  const trialRemaining = Math.max(0, trialLimit - trialUsed)

  const liveCount = useMemo(() => themes.filter((t) => t.is_published && t.slug).length, [themes])
  const totalViews = useMemo(() => themes.reduce((s, t) => s + (t.view_count ?? 0), 0), [themes])

  const firstName =
    profile?.full_name?.split(' ')?.[0] ||
    user?.user_metadata?.full_name?.split(' ')?.[0] ||
    (user?.email ? user.email.split('@')[0] : 'صديقي')

  const recent = themes.slice(0, 3)

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Greeting + plan badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          {loading ? 'مرحبًا…' : `مرحبًا بعودتك، ${firstName}`}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PlanBadge plan={plan} />
          <span className="text-[12.5px] text-muted">· {profile?.email || ''}</span>
        </div>
      </motion.div>

      {/* Proactive warnings — hosting about to lapse, or trial spent */}
      {!loading && (
        <HostingExpiryBanner
          hasHosting={hasHosting}
          status={profile?.hosting_status}
          canceledAt={profile?.hosting_canceled_at}
          periodEnd={profile?.hosting_current_period_end}
        />
      )}
      {!loading && plan === 'free' && trialRemaining === 0 && <TrialSpentBanner />}

      {/* Stat grid */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="إجمالي المواقع"  value={loading ? '—' : themes.length} sub={liveCount > 0 ? `${liveCount} مباشر` : 'لا شيء مباشر بعد'} icon={Folder} />
        <StatTile label="مواقع مباشرة"   value={loading ? '—' : liveCount}     sub={liveCount > 0 ? 'مباشرة على zenya.app' : 'انشر واحدًا للبدء'} icon={Globe} />
        <StatTile label="مشاهدات الصفحات"    value={loading ? '—' : totalViews.toLocaleString()} sub="مدى الحياة" icon={Eye} />
        <PlanCard plan={plan} trialRemaining={trialRemaining} trialLimit={trialLimit} hostingEnd={profile?.hosting_current_period_end} />
      </section>

      {/* Analytics quick-look — pulled live from /api/analytics */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2">
        <TrafficCard analytics={analytics} loading={loading} />
        <TopSiteCard analytics={analytics} loading={loading} />
      </section>

      {/* Two-column layout */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Recent sites */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">أحدث المواقع</h2>
            <Link href="/dashboard/sites" className="text-[12.5px] font-medium text-primary hover:underline">
              عرض الكل ←
            </Link>
          </div>

          {loading ? (
            <RecentSkeleton />
          ) : themes.length === 0 ? (
            <GettingStarted hasHosting={hasHosting} isPro={isPro} />
          ) : (
            <div className="space-y-2">
              {recent.map((t) => (
                <RecentRow key={t.id} theme={t} />
              ))}
              {themes.length > 3 && (
                <Link
                  href="/dashboard/sites"
                  className="block rounded-2xl border border-dashed border-token px-4 py-3 text-center text-[12.5px] font-medium text-muted hover:bg-black/[0.02]"
                >
                  + {themes.length - 3} أخرى · افتح المواقع
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Quick actions + getting started */}
        <aside className="space-y-4">
          <QuickActions hasHosting={hasHosting} plan={plan} />
          <UpgradeNudge plan={plan} trialRemaining={trialRemaining} />
        </aside>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Subcomponents                                                            *
 * ─────────────────────────────────────────────────────────────────────── */

function PlanBadge({ plan }: { plan: Plan }) {
  const tint = PLAN_TINT[plan]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ background: tint.bg, color: tint.fg, border: `1px solid ${tint.ring}` }}
    >
      {plan !== 'free' && <Sparkles className="h-3 w-3" strokeWidth={2.5} />}
      {PLAN_LABEL[plan]}
    </span>
  )
}

function StatTile({
  label, value, sub, icon: Icon,
}: {
  label: string
  value: number | string
  sub?: string
  icon: typeof Folder
}) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
        <Icon className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} />
      </div>
      <div className="mt-2 text-[24px] font-bold tracking-tight text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
    </div>
  )
}

/**
 * Warns when a hosting subscription is set to lapse — canceled + still active,
 * with the paid period ending within 14 days. Silent otherwise (auto-renewing
 * subscriptions and non-hosting plans show nothing).
 */
function HostingExpiryBanner({
  hasHosting, status, canceledAt, periodEnd,
}: {
  hasHosting: boolean
  status: string | null | undefined
  canceledAt: string | null | undefined
  periodEnd: string | null | undefined
}) {
  if (!hasHosting || status !== 'active' || !canceledAt || !periodEnd) return null
  const end = new Date(periodEnd)
  if (isNaN(end.getTime())) return null
  const daysUntil = Math.round((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0 || daysUntil > 14) return null

  const dayWord = daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'خلال يوم واحد' : daysUntil === 2 ? 'خلال يومين' : `خلال ${daysUntil} أيام`
  const endStr = end.toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(180,83,9,0.28)] bg-[rgba(180,83,9,0.06)] px-4 py-3.5">
      <AlertTriangle className="h-5 w-5 shrink-0 text-[#b45309]" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-[#8a3c1f]">
          تنتهي استضافتك {dayWord} ({endStr})
        </p>
        <p className="mt-0.5 text-[12.5px] leading-[1.55] text-[#a05a3a]">
          عند انتهائها ستتوقف مواقعك المستضافة عن الظهور. جدّد اشتراكك لإبقائها مباشرة — محتواك يبقى محفوظًا.
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="shrink-0 rounded-full bg-[#b45309] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#95440a]"
      >
        جدّد الاستضافة
      </Link>
    </div>
  )
}

/** Shown to a free user who has spent every free generation. */
function TrialSpentBanner() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(94,106,210,0.28)] bg-[rgba(94,106,210,0.06)] px-4 py-3.5">
      <Sparkles className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground">استنفدت تجربتك المجانية</p>
        <p className="mt-0.5 text-[12.5px] leading-[1.55] text-muted">
          اشترك لتوليد مواقع بلا حدود، مع تصدير شوبيفاي وملفات المشاريع. مواقعك الحالية تبقى محفوظة.
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white transition hover:opacity-90"
      >
        طالع الخطط
      </Link>
    </div>
  )
}

function PlanCard({
  plan, trialRemaining, trialLimit, hostingEnd,
}: {
  plan: Plan
  trialRemaining: number
  trialLimit: number
  hostingEnd: string | null | undefined
}) {
  if (plan === 'pro_hosting') {
    const renews = hostingEnd ? new Date(hostingEnd) : null
    const formatted = renews ? renews.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#15803d]">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          الاستضافة نشطة
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">19.99$ / شهريًا</div>
        <div className="mt-1 text-[12px] text-muted">يتجدّد {formatted}</div>
      </div>
    )
  }
  if (plan === 'pro_onetime') {
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          برو مدى الحياة
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">توليد غير محدود</div>
        <Link href="/pricing?upgrade=pro" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
          أضف الاستضافة · 19.99$ شهريًا
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  if (plan === 'starter') {
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Starter نشط
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">توليد غير محدود</div>
        <Link href="/pricing?upgrade=pro" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
          الترقية إلى Pro · 24.99$ شهريًا
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  if (plan === 'pro') {
    const renews = hostingEnd ? new Date(hostingEnd) : null
    const formatted = renews ? renews.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#15803d]">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          Pro نشط · استضافة مشمولة
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">24.99$ / شهريًا</div>
        <div className="mt-1 text-[12px] text-muted">يتجدّد {formatted}</div>
      </div>
    )
  }
  if (plan === 'admin') {
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9b6f00]">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          مشرف
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">كل المزايا مفتوحة</div>
        <div className="mt-1 text-[12px] text-muted">الاستضافة + مدى الحياة مشمولان</div>
      </div>
    )
  }
  // free
  const pct = trialLimit > 0 ? Math.round((trialRemaining / trialLimit) * 100) : 0
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الباقة المجانية</div>
      <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">
        {trialRemaining > 0 ? `بقي ${trialRemaining} من ${trialLimit}` : 'انتهت التجربة'}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 0 ? '#dc2626' : '#5e6ad2' }} />
      </div>
      <Link href="/pricing?upgrade=starter" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
        اشترك في Starter · 14.99$ شهريًا
        <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
      </Link>
    </div>
  )
}

function RecentRow({ theme }: { theme: Theme }) {
  const live = theme.is_published && theme.slug
  return (
    <div className="flex items-center justify-between rounded-2xl border border-token bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: live ? 'rgba(21,128,61,0.10)' : 'rgba(217,119,6,0.10)' }}
        >
          {live ? <Globe className="h-4 w-4 text-[#15803d]" strokeWidth={2} /> : <Folder className="h-4 w-4 text-[#b45309]" strokeWidth={2} />}
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-foreground">{theme.product_name}</div>
          <div className="text-[11.5px] text-muted">
            {live ? (
              <a href={publicSiteUrl(theme.slug!)} target="_blank" rel="noreferrer" className="hover:text-primary">
                {publicSiteHost(theme.slug!)} <ExternalLink className="inline-block h-2.5 w-2.5 opacity-70" />
              </a>
            ) : (
              <>مسودّة — أُنشئت {new Date(theme.created_at).toLocaleDateString()}</>
            )}
          </div>
        </div>
      </div>
      <a
        href={live ? publicSiteUrl(theme.slug!) : `/preview/${theme.id}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-black/5"
      >
        فتح
        <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={2.25} />
      </a>
    </div>
  )
}

function RecentSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-token bg-white px-4 py-3">
          <div className="h-9 w-9 rounded-lg bg-[rgba(28,28,28,0.06)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-[rgba(28,28,28,0.06)]" />
            <div className="h-2.5 w-1/3 rounded bg-[rgba(28,28,28,0.04)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GettingStarted({ hasHosting, isPro }: { hasHosting: boolean; isPro: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-dashed border-token bg-white p-8 text-center"
      style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(94,106,210,0.08), transparent 70%)' }}
    >
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'white', boxShadow: '0 8px 24px -8px rgba(94,106,210,0.40), 0 0 0 1px rgba(94,106,210,0.20) inset' }}
      >
        <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="text-[18px] font-bold tracking-tight text-foreground">أنشئ موقعك الأول</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
        اختر قالبًا، واكتب نبذة سريعة، وتكتب زينيا المحتوى وتصمّم الصفحة.
        جاهز خلال أقل من دقيقة.
      </p>
      <Link
        href="/theme/new"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        أنشئ موقعًا جديدًا
      </Link>
      <div className="mt-3">
        <Link href="/themes" className="text-[12px] text-muted hover:text-foreground">
          أو تصفّح القوالب الثمانية ←
        </Link>
      </div>
    </div>
  )
}

function QuickActions({ hasHosting, plan }: { hasHosting: boolean; plan: Plan }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">إجراءات سريعة</div>
      <div className="mt-3 space-y-2">
        <Link href="/theme/new" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            موقع جديد
          </span>
          <ArrowRight className="h-3 w-3 text-muted rtl-flip" />
        </Link>
        <Link href="/dashboard/domains" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            إدارة النطاقات
          </span>
          <ArrowRight className="h-3 w-3 text-muted rtl-flip" />
        </Link>
        <Link href="/dashboard/gallery" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            افتح معرضي
          </span>
          <ArrowRight className="h-3 w-3 text-muted rtl-flip" />
        </Link>
        <Link href="/dashboard/analytics" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            عرض التحليلات
          </span>
          <ArrowRight className="h-3 w-3 text-muted rtl-flip" />
        </Link>
      </div>
    </div>
  )
}

function TrafficCard({ analytics, loading }: { analytics: AnalyticsSummary | null; loading: boolean }) {
  const series = analytics?.series ?? []
  const views30 = analytics?.totals.views ?? 0
  // The API returns one bucket per day, so the last week is the tail of the
  // series — no second request needed.
  const views7 = series.slice(-7).reduce((s, p) => s + p.views, 0)
  const maxV = Math.max(1, ...series.map((s) => s.views))
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">مشاهدات · آخر 30 يومًا</div>
        <Link href="/dashboard/analytics" className="text-[11.5px] font-medium text-primary hover:underline">
          افتح التحليلات ←
        </Link>
      </div>
      <div className="mt-2 flex items-end gap-3">
        <div className="text-[28px] font-bold tracking-tight text-foreground tabular-nums">
          {loading ? '—' : views30.toLocaleString()}
        </div>
        <div className="pb-1.5 text-[11.5px] text-muted">
          {views7 > 0 ? `${views7.toLocaleString()} هذا الأسبوع` : 'لا مشاهدات هذا الأسبوع'}
        </div>
      </div>
      {/* Sparkline */}
      <div
        className="mt-3 grid items-end gap-px"
        style={{ gridTemplateColumns: `repeat(${Math.max(series.length, 1)}, minmax(0, 1fr))`, height: 56 }}
      >
        {(series.length > 0 ? series : Array.from({ length: 30 }, () => ({ date: '', views: 0 }))).map((s, i) => {
          const h = (s.views / maxV) * 52
          return (
            <div key={i} className="flex h-full items-end justify-center">
              <div
                className="w-full rounded-t-[2px]"
                style={{
                  height: `${Math.max(2, h)}px`,
                  background: s.views === 0 ? 'rgba(28,28,28,0.06)' : '#5e6ad2',
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopSiteCard({ analytics, loading }: { analytics: AnalyticsSummary | null; loading: boolean }) {
  const top = analytics?.per_site.slice(0, 3) ?? []
  const liveDomains = analytics?.site_counts.live_domains ?? 0
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">أفضل المواقع أداءً</div>
        <span className="text-[11.5px] text-muted">{liveDomains > 0 ? `${liveDomains} نطاق مخصّص` : 'آخر 30 يومًا'}</span>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-[rgba(28,28,28,0.04)]" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="mt-4 py-2 text-[12.5px] text-muted">
          لا مشاهدات بعد. انشر موقعًا لتبدأ جمع الزيارات.
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {top.map((s, i) => {
            const max = top[0].views || top[0].lifetime_views || 1
            const v = s.views || s.lifetime_views
            const pct = Math.max(4, Math.round((v / max) * 100))
            return (
              <li key={s.id} className="rounded-md px-1 py-1">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="truncate font-medium text-foreground">
                    <span className="me-1.5 inline-block w-4 text-end text-muted tabular-nums">{i + 1}.</span>
                    {s.product_name}
                  </span>
                  <span className="tabular-nums text-muted">{v.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function UpgradeNudge({ plan, trialRemaining }: { plan: Plan; trialRemaining: number }) {
  if (plan === 'pro_hosting' || plan === 'pro' || plan === 'admin') return null
  if (plan === 'pro_onetime') {
    return (
      <div className="rounded-2xl border border-token bg-[rgba(94,106,210,0.04)] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">أضف الاستضافة</div>
        <p className="mt-2 text-[13px] leading-[1.55] text-foreground">
          انشر قوالب العرض على زينيا بنطاق مخصّص. 19.99$ شهريًا، ألغِ في أي وقت.
        </p>
        <Link href="/pricing?upgrade=pro" className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
          ابدأ الاستضافة
          <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  if (plan === 'starter') {
    return (
      <div className="rounded-2xl border border-token bg-[rgba(94,106,210,0.04)] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">الترقية إلى Pro</div>
        <p className="mt-2 text-[13px] leading-[1.55] text-foreground">
          انشر قوالب العرض على زينيا بنطاق مخصّص. 24.99$ شهريًا، ألغِ في أي وقت.
        </p>
        <Link href="/pricing?upgrade=pro" className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
          الترقية إلى Pro
          <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  // free
  return (
    <div className="rounded-2xl border border-token bg-[rgba(94,106,210,0.04)] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        {trialRemaining === 0 ? 'انتهت التجربة' : 'الترقية إلى Starter'}
      </div>
      <p className="mt-2 text-[13px] leading-[1.55] text-foreground">
        {trialRemaining === 0
          ? 'استخدمت توليدَيك المجانيين. اشترك في Starter لتوليد غير محدود.'
          : 'اشترك شهريًا، واحصل على توليد غير محدود + تصدير شوبيفاي + ملفات المشاريع.'}
      </p>
      <Link href="/pricing?upgrade=starter" className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
        اشترك في Starter · 14.99$
        <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
      </Link>
    </div>
  )
}
