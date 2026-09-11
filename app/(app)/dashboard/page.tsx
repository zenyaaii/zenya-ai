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
import PublishingPlan from '@/components/app/PublishingPlan'
import WelcomeTour from '@/components/app/WelcomeTour'
import {
  CheckoutCelebration, EntryWelcomeBanner, EntrySpentBanner,
} from '@/components/app/EntryCelebration'

type Plan = 'free' | 'entry' | 'pro_onetime' | 'pro_hosting' | 'starter' | 'pro' | 'admin'

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
  entry:       'Entry',
  pro_onetime: 'برو · مدى الحياة',
  pro_hosting: 'برو · استضافة',
  starter:     'Starter',
  pro:         'Pro',
  admin:       'مشرف',
}

/**
 * A plan is a state, so it reports through the status pill like every other
 * state on this surface. It used to carry its own seven-entry tint table -
 * five fills, five rings and five foregrounds, including #0d9488, #9b6f00
 * and a #c8a96a gold that appeared nowhere else in the product.
 *
 * The tones are the documented triad plus the accent and a quiet grey:
 *   ok      the plan is paid and current
 *   accent  the plan is paid but has something left to add
 *   quiet   the free tier, which is a state and not an achievement
 */
type Tone = 'ok' | 'accent' | 'quiet'
const PLAN_TONE: Record<Plan, Tone> = {
  free:        'quiet',
  entry:       'accent',
  pro_onetime: 'accent',
  pro_hosting: 'ok',
  starter:     'accent',
  pro:         'ok',
  admin:       'ok',
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
      {/* Post-checkout celebration — self-gates on ?checkout=success */}
      <CheckoutCelebration />
      {/* One-time "get to know Zenya" welcome modal (first visit only) */}
      <WelcomeTour />

      {/* Greeting + plan badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="zy-h1">
          {loading ? 'مرحبًا…' : `مرحبًا بعودتك، ${firstName}`}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <PlanBadge plan={plan} />
          <span className="zy-sub">{profile?.email || ''}</span>
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

      {/* Entry-tier warmth: a one-time welcome, or a gentle "out of generations" nudge */}
      {!loading && plan === 'entry' && trialRemaining > 0 && (
        <EntryWelcomeBanner trialRemaining={trialRemaining} />
      )}
      {!loading && plan === 'entry' && trialRemaining === 0 && <EntrySpentBanner />}

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
            <h2 className="zy-h2">أحدث المواقع</h2>
            <Link href="/dashboard/sites" className="zy-link">
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
                  className="block rounded-2xl px-4 py-3 text-center text-[12.5px] font-bold text-[#56565a] transition-colors hover:text-[#5e6ad2]"
                  style={{ boxShadow: '0 0 0 1px rgba(17,17,17,0.10)' }}
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
          {/* Small launch checklist — manual ticks, sits under Quick Actions */}
          <PublishingPlan />
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
  return (
    <span className="zy-pill" data-tone={PLAN_TONE[plan]}>
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
    <div className="rounded-2xl zy-card p-5">
      <div className="flex items-start justify-between">
        <div className="zy-eyebrow">{label}</div>
        <Icon className="h-3.5 w-3.5 text-[#66666e]" strokeWidth={1.75} />
      </div>
      <div className="zy-num mt-2">{value}</div>
      {sub && <div className="zy-sub mt-1">{sub}</div>}
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
    <div className="zy-banner mt-6" data-tone="warn">
      <AlertTriangle className="zy-banner-ico h-5 w-5" />
      <div className="zy-banner-b">
        <p className="zy-banner-t">
          تنتهي استضافتك {dayWord} ({endStr})
        </p>
        <p className="zy-banner-p">
          عند انتهائها ستتوقف مواقعك المستضافة عن الظهور. جدّد اشتراكك لإبقائها مباشرة — محتواك يبقى محفوظًا.
        </p>
      </div>
      <Link href="/dashboard/billing" className="zy-btn">
        جدّد الاستضافة
      </Link>
    </div>
  )
}

/** Shown to a free user who has spent every free generation. */
function TrialSpentBanner() {
  return (
    <div className="zy-banner mt-6">
      <Sparkles className="zy-banner-ico h-5 w-5" />
      <div className="zy-banner-b">
        <p className="zy-banner-t">استنفدت تجربتك المجانية</p>
        <p className="zy-banner-p">
          اشترك لتوليد مواقع بلا حدود، مع تصدير شوبيفاي وملفات المشاريع. مواقعك الحالية تبقى محفوظة.
        </p>
      </div>
      <Link href="/pricing" className="zy-btn">
        طالع الخطط
      </Link>
    </div>
  )
}

/**
 * The fourth tile in the stat row: what the reader is paying for.
 *
 * It was six near-identical blocks, each with its own eyebrow colour
 * (#15803d, #5e6ad2, #9b6f00, #b8860b) and its own hand-written meter. The
 * shapes are now one, and the only thing a plan chooses is its tone, its
 * lines and whether it has somewhere to upgrade to.
 *
 * THE EYEBROW IS NO LONGER TINTED. A plan name printed in green is the
 * status hue colouring a label rather than reporting a state, which is the
 * rule this restyle is holding: the tone belongs to the pill and the icon.
 * Here it is the small check or spark beside the eyebrow that carries it.
 */
function PlanCard({
  plan, trialRemaining, trialLimit, hostingEnd,
}: {
  plan: Plan
  trialRemaining: number
  trialLimit: number
  hostingEnd: string | null | undefined
}) {
  const renews = hostingEnd ? new Date(hostingEnd) : null
  const formatted =
    renews && !isNaN(renews.getTime())
      ? renews.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : '—'

  // A plan that meters generations shows the meter; the rest show a renewal.
  const metered = plan === 'entry' || plan === 'free'
  const pct = trialLimit > 0 ? Math.round((trialRemaining / trialLimit) * 100) : 0

  const spec: Record<Plan, { eyebrow: string; head: string; note?: string; cta?: { href: string; label: string } }> = {
    pro_hosting: { eyebrow: 'الاستضافة نشطة', head: '19.99$ / شهريًا', note: `يتجدّد ${formatted}` },
    pro:         { eyebrow: 'Pro نشط · استضافة مشمولة', head: '24.99$ / شهريًا', note: `يتجدّد ${formatted}` },
    admin:       { eyebrow: 'مشرف', head: 'كل المزايا مفتوحة', note: 'الاستضافة + مدى الحياة مشمولان' },
    pro_onetime: { eyebrow: 'برو مدى الحياة', head: 'توليد غير محدود', cta: { href: '/pricing?upgrade=pro', label: 'أضف الاستضافة · 19.99$ شهريًا' } },
    starter:     { eyebrow: 'Starter نشط', head: 'توليد غير محدود', cta: { href: '/pricing?upgrade=pro', label: 'الترقية إلى Pro · 24.99$ شهريًا' } },
    entry:       { eyebrow: 'خطة Entry', head: trialRemaining > 0 ? `بقي ${trialRemaining} من ${trialLimit}` : 'استخدمت قالبيك', cta: { href: '/pricing?upgrade=starter', label: 'توليد بلا حدود · Starter 14.99$' } },
    free:        { eyebrow: 'الباقة المجانية', head: trialRemaining > 0 ? `بقي ${trialRemaining} من ${trialLimit}` : 'انتهت التجربة', cta: { href: '/pricing?upgrade=starter', label: 'اشترك في Starter · 14.99$ شهريًا' } },
  }
  const it = spec[plan]
  const tone = PLAN_TONE[plan]

  return (
    <div className="rounded-2xl zy-card p-5">
      <div className="flex items-center gap-1.5">
        {tone === 'ok' ? (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-[#15803d]" strokeWidth={2.5} />
        ) : tone === 'accent' ? (
          <Sparkles className="h-3 w-3 shrink-0 text-[#5e6ad2]" strokeWidth={2.5} />
        ) : null}
        <span className="zy-eyebrow truncate">{it.eyebrow}</span>
      </div>
      <div className="mt-1.5 text-[17px] font-black leading-[1.4] text-[#171717]">{it.head}</div>
      {metered && (
        <div className="zy-meter mt-2.5" data-spent={pct === 0 ? '' : undefined}>
          <div className="zy-meter-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
      {it.note && <div className="zy-sub mt-1">{it.note}</div>}
      {it.cta && (
        <Link href={it.cta.href} className="zy-link mt-2.5">
          {it.cta.label}
          <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}


function RecentRow({ theme }: { theme: Theme }) {
  const live = theme.is_published && theme.slug
  return (
    <div className="flex items-center justify-between rounded-2xl zy-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="zy-tile" data-tone={live ? 'ok' : 'warn'}>
          {live ? <Globe className="h-4 w-4" strokeWidth={2} /> : <Folder className="h-4 w-4" strokeWidth={2} />}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold leading-[1.5] text-[#171717]">{theme.product_name}</div>
          <div className="text-[11.5px] font-medium leading-[1.7] text-[#56565a]">
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
        className="zy-btn-q"
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
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl zy-card px-4 py-3">
          <div className="h-[34px] w-[34px] rounded-lg bg-[rgba(17,17,17,0.06)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-[rgba(17,17,17,0.06)]" />
            <div className="h-2.5 w-1/3 rounded bg-[rgba(17,17,17,0.04)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GettingStarted({ hasHosting, isPro }: { hasHosting: boolean; isPro: boolean }) {
  return (
    <div className="zy-empty">
      <div className="zy-empty-ico">
        <Sparkles className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="zy-h2">أنشئ موقعك الأول</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] font-medium leading-[1.8] text-[#56565a]">
        اختر قالبًا، واكتب نبذة سريعة، وتكتب زينيا المحتوى وتصمّم الصفحة.
        جاهز خلال أقل من دقيقة.
      </p>
      <div className="mt-5 flex flex-col items-center gap-3">
        <Link href="/theme/new" className="zy-btn">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          أنشئ موقعًا جديدًا
        </Link>
        <Link href="/themes" className="text-[12px] font-medium text-[#56565a] hover:text-[#171717]">
          أو تصفّح القوالب الثمانية ←
        </Link>
      </div>
    </div>
  )
}

function QuickActions({ hasHosting, plan }: { hasHosting: boolean; plan: Plan }) {
  return (
    <div className="rounded-2xl zy-card p-5">
      <div className="zy-eyebrow">إجراءات سريعة</div>
      <div className="mt-3 space-y-2">
        <Link href="/theme/new" className="zy-rail-row justify-between">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            موقع جديد
          </span>
          <ArrowRight className="h-3 w-3 rtl-flip opacity-50" />
        </Link>
        <Link href="/dashboard/domains" className="zy-rail-row justify-between">
          <span className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" strokeWidth={2.25} />
            إدارة النطاقات
          </span>
          <ArrowRight className="h-3 w-3 rtl-flip opacity-50" />
        </Link>
        <Link href="/dashboard/gallery" className="zy-rail-row justify-between">
          <span className="inline-flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
            افتح معرضي
          </span>
          <ArrowRight className="h-3 w-3 rtl-flip opacity-50" />
        </Link>
        <Link href="/dashboard/analytics" className="zy-rail-row justify-between">
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.25} />
            عرض التحليلات
          </span>
          <ArrowRight className="h-3 w-3 rtl-flip opacity-50" />
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
    <div className="rounded-2xl zy-card p-5">
      <div className="flex items-baseline justify-between">
        <div className="zy-eyebrow">مشاهدات · آخر 30 يومًا</div>
        <Link href="/dashboard/analytics" className="zy-link">
          افتح التحليلات ←
        </Link>
      </div>
      <div className="mt-2 flex items-end gap-3">
        <div className="zy-num">
          {loading ? '—' : views30.toLocaleString()}
        </div>
        <div className="zy-sub pb-1.5">
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
                className="zy-spark-b"
                data-zero={s.views === 0 ? '' : undefined}
                style={{ height: `${Math.max(2, h)}px` }}
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
    <div className="rounded-2xl zy-card p-5">
      <div className="flex items-baseline justify-between">
        <div className="zy-eyebrow">أفضل المواقع أداءً</div>
        <span className="zy-sub">{liveDomains > 0 ? `${liveDomains} نطاق مخصّص` : 'آخر 30 يومًا'}</span>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-[rgba(17,17,17,0.04)]" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="zy-sub mt-4 py-2">
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
                  <span className="truncate font-bold text-[#171717]">
                    <span className="me-1.5 inline-block w-4 text-end font-medium tabular-nums text-[#66666e]">{i + 1}.</span>
                    {s.product_name}
                  </span>
                  <span className="font-medium tabular-nums text-[#56565a]">{v.toLocaleString()}</span>
                </div>
                <div className="zy-meter mt-1.5" style={{ height: 4 }}>
                  <div className="zy-meter-fill" style={{ width: `${pct}%` }} />
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
  // Entry has its own dedicated welcome/meter + PlanCard nudge — no third CTA.
  if (plan === 'entry') return null
  if (plan === 'pro_onetime') {
    return (
      <div className="rounded-2xl zy-card p-5">
        <div className="zy-eyebrow">أضف الاستضافة</div>
        <p className="mt-2 text-[13px] font-medium leading-[1.8] text-[#171717]">
          انشر قوالب العرض على زينيا بنطاق مخصّص. 19.99$ شهريًا، ألغِ في أي وقت.
        </p>
        <Link href="/pricing?upgrade=pro" className="zy-btn mt-3.5">
          ابدأ الاستضافة
          <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  if (plan === 'starter') {
    return (
      <div className="rounded-2xl zy-card p-5">
        <div className="zy-eyebrow">الترقية إلى Pro</div>
        <p className="mt-2 text-[13px] font-medium leading-[1.8] text-[#171717]">
          انشر قوالب العرض على زينيا بنطاق مخصّص. 24.99$ شهريًا، ألغِ في أي وقت.
        </p>
        <Link href="/pricing?upgrade=pro" className="zy-btn mt-3.5">
          الترقية إلى Pro
          <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  // free
  return (
    <div className="rounded-2xl zy-card p-5">
      <div className="zy-eyebrow">
        {trialRemaining === 0 ? 'انتهت التجربة' : 'الترقية إلى Starter'}
      </div>
      <p className="mt-2 text-[13px] font-medium leading-[1.8] text-[#171717]">
        {trialRemaining === 0
          ? 'استخدمت توليدَيك المجانيين. اشترك في Starter لتوليد غير محدود.'
          : 'اشترك شهريًا، واحصل على توليد غير محدود + تصدير شوبيفاي + ملفات المشاريع.'}
      </p>
      <Link href="/pricing?upgrade=starter" className="zy-btn mt-3.5">
        اشترك في Starter · 14.99$
        <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
      </Link>
    </div>
  )
}
