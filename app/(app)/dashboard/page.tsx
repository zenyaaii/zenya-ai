'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sparkles, Plus, ArrowRight, Globe, CheckCircle2, Folder,
  BarChart3, Eye, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Plan = 'free' | 'pro_onetime' | 'pro_hosting' | 'admin'

type Profile = {
  plan: Plan
  is_pro: boolean
  has_hosting: boolean
  trial_themes_limit: number
  trial_themes_used: number
  hosting_status: string | null
  hosting_current_period_end: string | null
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

const PLAN_LABEL: Record<Plan, string> = {
  free:        'Free Plan',
  pro_onetime: 'Pro · Lifetime',
  pro_hosting: 'Pro · Hosting',
  admin:       'Admin',
}

const PLAN_TINT: Record<Plan, { bg: string; ring: string; fg: string }> = {
  free:        { bg: 'rgba(28,28,28,0.06)',   ring: 'rgba(28,28,28,0.18)',   fg: '#6b6b6b' },
  pro_onetime: { bg: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)', fg: '#5e6ad2' },
  pro_hosting: { bg: 'rgba(21,128,61,0.10)',  ring: 'rgba(21,128,61,0.30)',  fg: '#15803d' },
  admin:       { bg: 'rgba(200,169,106,0.16)', ring: 'rgba(200,169,106,0.45)', fg: '#9b6f00' },
}

export default function DashboardHomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/dashboard')
      return
    }
    setUser(user)
    const [{ data: profileRow }, themesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting, trial_themes_limit, trial_themes_used, hosting_status, hosting_current_period_end, full_name, email')
        .eq('id', user.id)
        .maybeSingle(),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })),
    ])
    setProfile((profileRow as unknown as Profile) || null)
    setThemes((themesRes?.themes as Theme[]) || [])
    setLoading(false)
  }, [router, supabase])

  useEffect(() => { load() }, [load])

  const plan: Plan = profile?.plan || 'free'
  const isPro = !!profile?.is_pro || plan === 'admin'
  const hasHosting = !!profile?.has_hosting || plan === 'admin'
  const trialLimit = profile?.trial_themes_limit ?? 3
  const trialUsed = profile?.trial_themes_used ?? 0
  const trialRemaining = Math.max(0, trialLimit - trialUsed)

  const liveCount = useMemo(() => themes.filter((t) => t.is_published && t.slug).length, [themes])
  const totalViews = useMemo(() => themes.reduce((s, t) => s + (t.view_count ?? 0), 0), [themes])

  const firstName =
    profile?.full_name?.split(' ')?.[0] ||
    user?.user_metadata?.full_name?.split(' ')?.[0] ||
    (user?.email ? user.email.split('@')[0] : 'there')

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
          {loading ? 'Welcome…' : `Welcome back, ${firstName}`}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PlanBadge plan={plan} />
          <span className="text-[12.5px] text-muted">· {profile?.email || ''}</span>
        </div>
      </motion.div>

      {/* Stat grid */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total sites"  value={loading ? '—' : themes.length} sub={liveCount > 0 ? `${liveCount} live` : 'none live yet'} icon={Folder} />
        <StatTile label="Live sites"   value={loading ? '—' : liveCount}     sub={liveCount > 0 ? 'live on zenya.app' : 'publish one to get started'} icon={Globe} />
        <StatTile label="Pageviews"    value={loading ? '—' : totalViews.toLocaleString()} sub="lifetime" icon={Eye} />
        <PlanCard plan={plan} trialRemaining={trialRemaining} trialLimit={trialLimit} hostingEnd={profile?.hosting_current_period_end} />
      </section>

      {/* Two-column layout */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Recent sites */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Recent sites</h2>
            <Link href="/dashboard/sites" className="text-[12.5px] font-medium text-primary hover:underline">
              View all →
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
                  + {themes.length - 3} more · open Sites
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
          Hosting active
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">$19.99 / month</div>
        <div className="mt-1 text-[12px] text-muted">Renews {formatted}</div>
      </div>
    )
  }
  if (plan === 'pro_onetime') {
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Pro Lifetime
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">Unlimited generations</div>
        <Link href="/checkout?plan=hosting" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
          Add hosting · $19.99/mo
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  if (plan === 'admin') {
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9b6f00]">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Admin
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">All features unlocked</div>
        <div className="mt-1 text-[12px] text-muted">Hosting + lifetime included</div>
      </div>
    )
  }
  // free
  const pct = trialLimit > 0 ? Math.round((trialRemaining / trialLimit) * 100) : 0
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Free Plan</div>
      <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">
        {trialRemaining > 0 ? `${trialRemaining} of ${trialLimit} left` : 'Trial used'}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 0 ? '#dc2626' : '#5e6ad2' }} />
      </div>
      <Link href="/checkout?plan=onetime" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
        Get Pro · $9.99 once
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
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
              <a href={`/s/${theme.slug}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                zenyaai.co/s/{theme.slug} <ExternalLink className="inline-block h-2.5 w-2.5 opacity-70" />
              </a>
            ) : (
              <>Draft — created {new Date(theme.created_at).toLocaleDateString()}</>
            )}
          </div>
        </div>
      </div>
      <Link
        href={`/preview/${theme.id}`}
        className="rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-black/5"
      >
        Open
      </Link>
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
      <h3 className="text-[18px] font-bold tracking-tight text-foreground">Build your first site</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
        Pick a template, share a quick brief, and Zenya writes the copy and designs
        the page. Live in under a minute.
      </p>
      <Link
        href="/theme/new"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Create new site
      </Link>
      <div className="mt-3">
        <Link href="/themes" className="text-[12px] text-muted hover:text-foreground">
          or browse the 8 templates →
        </Link>
      </div>
    </div>
  )
}

function QuickActions({ hasHosting, plan }: { hasHosting: boolean; plan: Plan }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Quick actions</div>
      <div className="mt-3 space-y-2">
        <Link href="/theme/new" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            New site
          </span>
          <ArrowRight className="h-3 w-3 text-muted" />
        </Link>
        <Link href="/dashboard/domains" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            Manage domains
          </span>
          <ArrowRight className="h-3 w-3 text-muted" />
        </Link>
        <Link href="/dashboard/analytics" className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] font-medium text-foreground hover:bg-black/[0.04]">
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
            View analytics
          </span>
          <ArrowRight className="h-3 w-3 text-muted" />
        </Link>
      </div>
    </div>
  )
}

function UpgradeNudge({ plan, trialRemaining }: { plan: Plan; trialRemaining: number }) {
  if (plan === 'pro_hosting' || plan === 'admin') return null
  if (plan === 'pro_onetime') {
    return (
      <div className="rounded-2xl border border-token bg-[rgba(94,106,210,0.04)] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Add hosting</div>
        <p className="mt-2 text-[13px] leading-[1.55] text-foreground">
          Publish your brochure templates on Zenya at a custom domain. $19.99/month, cancel anytime.
        </p>
        <Link href="/checkout?plan=hosting" className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
          Start hosting
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }
  // free
  return (
    <div className="rounded-2xl border border-token bg-[rgba(94,106,210,0.04)] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        {trialRemaining === 0 ? 'Trial complete' : 'Upgrade to Pro'}
      </div>
      <p className="mt-2 text-[13px] leading-[1.55] text-foreground">
        {trialRemaining === 0
          ? 'You used your 3 free generations. Get unlimited for a single $9.99.'
          : 'Pay once, get unlimited generations + Shopify ZIP export + project ZIPs forever.'}
      </p>
      <Link href="/checkout?plan=onetime" className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
        Get Pro · $9.99
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
      </Link>
    </div>
  )
}
