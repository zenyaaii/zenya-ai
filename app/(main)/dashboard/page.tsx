'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Plus,
  CreditCard,
  Settings as SettingsIcon,
  BarChart3,
  ArrowRight,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import AIDisclosure from '@/components/AIDisclosure'
import PublishSiteModal from '@/components/PublishSiteModal'
import AddDomainModal from '@/components/AddDomainModal'
import ShopifyAffiliateCallout from '@/components/ShopifyAffiliateCallout'
import SiteCard, {
  HOSTABLE_TYPES,
  SHOPIFY_TYPES,
  type SiteTheme,
} from '@/components/dashboard/SiteCard'

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

type Filter = 'all' | 'drafts' | 'live' | 'shopify'

const PLAN_LABEL: Record<Plan, string> = {
  free:         'Free Plan',
  pro_onetime:  'Pro · Lifetime',
  pro_hosting:  'Pro · Hosting',
  admin:        'Admin',
}

const PLAN_TINT: Record<Plan, { bg: string; ring: string; fg: string }> = {
  free:         { bg: 'rgba(28,28,28,0.06)',   ring: 'rgba(28,28,28,0.18)',  fg: '#6b6b6b' },
  pro_onetime:  { bg: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)', fg: '#5e6ad2' },
  pro_hosting:  { bg: 'rgba(21,128,61,0.10)',  ring: 'rgba(21,128,61,0.30)',  fg: '#15803d' },
  admin:        { bg: 'rgba(200,169,106,0.16)', ring: 'rgba(200,169,106,0.45)', fg: '#9b6f00' },
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [themes, setThemes] = useState<SiteTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [publishingTheme, setPublishingTheme] = useState<SiteTheme | null>(null)
  const [domainTheme, setDomainTheme] = useState<SiteTheme | null>(null)

  const loadAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/dashboard')
      return
    }
    setUser(user)

    const [{ data: profileRow }, themesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'plan, is_pro, has_hosting, trial_themes_limit, trial_themes_used, ' +
          'hosting_status, hosting_current_period_end, full_name, email'
        )
        .eq('id', user.id)
        .maybeSingle(),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })),
    ])

    setProfile((profileRow as unknown as Profile) || null)
    setThemes((themesRes?.themes as SiteTheme[]) || [])
    setLoading(false)
  }, [router, supabase])

  useEffect(() => { loadAll() }, [loadAll])

  const refreshTheme = (id: string, patch: Partial<SiteTheme>) => {
    setThemes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const unpublishTheme = async (theme: SiteTheme) => {
    if (!confirm(`Unpublish "${theme.product_name}"? The site goes offline immediately.`)) return
    const r = await fetch(`/api/themes/${theme.id}/publish`, { method: 'DELETE' })
    if (r.ok) refreshTheme(theme.id, { is_published: false })
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const plan: Plan = profile?.plan || 'free'
  const isPro = !!profile?.is_pro || plan === 'admin'
  const hasHosting = !!profile?.has_hosting || plan === 'admin'
  const trialLimit = profile?.trial_themes_limit ?? 3
  const trialUsed = profile?.trial_themes_used ?? 0
  const trialRemaining = Math.max(0, trialLimit - trialUsed)

  const liveCount = useMemo(
    () => themes.filter((t) => t.is_published && t.slug).length,
    [themes]
  )
  const totalViews = useMemo(
    () => themes.reduce((s, t) => s + (t.view_count ?? 0), 0),
    [themes]
  )
  const hasEcom = useMemo(
    () =>
      themes.some((t) => {
        const bt =
          (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
          t.template_type
        return SHOPIFY_TYPES.has(bt)
      }),
    [themes]
  )

  const visible = useMemo(() => {
    return themes.filter((t) => {
      const bt =
        (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
        t.template_type
      if (filter === 'live')    return t.is_published && t.slug
      if (filter === 'drafts')  return HOSTABLE_TYPES.has(bt) && !t.is_published
      if (filter === 'shopify') return SHOPIFY_TYPES.has(bt)
      return true
    })
  }, [themes, filter])

  const firstName =
    profile?.full_name?.split(' ')?.[0] ||
    user?.user_metadata?.full_name?.split(' ')?.[0] ||
    (user?.email ? user.email.split('@')[0] : 'there')

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* ── Welcome bar ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-start justify-between gap-4 border-b border-token pb-8 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">
            {loading ? 'Welcome back…' : `Welcome back, ${firstName}`}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PlanBadge plan={plan} />
            {profile?.email && (
              <span className="text-[12.5px] text-muted">· {profile.email}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plan === 'admin' && (
            <Link
              href="/dashboard/analytics"
              className="hidden items-center gap-1.5 rounded-full border border-token bg-white px-3 py-2 text-[12.5px] font-medium text-muted hover:bg-black/5 sm:inline-flex"
            >
              <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
              Analytics
            </Link>
          )}
          <Link
            href="/theme/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New site
          </Link>
        </div>
      </motion.section>

      {/* ── Plan / stats row ────────────────────────────────────────────── */}
      {!loading && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlanCard
            plan={plan}
            trialRemaining={trialRemaining}
            trialLimit={trialLimit}
            hostingEnd={profile?.hosting_current_period_end}
          />
          <StatTile
            label="Total sites"
            value={themes.length}
            sublabel={liveCount > 0 ? `${liveCount} live` : 'none live yet'}
          />
          <StatTile
            label="Pageviews"
            value={totalViews.toLocaleString()}
            sublabel="lifetime"
          />
          <StatTile
            label={plan === 'free' ? 'Trial generations' : 'Generations'}
            value={plan === 'free' ? `${trialRemaining}/${trialLimit}` : 'Unlimited'}
            sublabel={plan === 'free' ? 'used in trial' : ''}
            highlight={plan === 'free' && trialRemaining === 0}
          />
        </section>
      )}

      <AIDisclosure variant="banner" className="mt-6" />

      {/* ── Sites section ───────────────────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[22px] font-bold tracking-tight text-foreground">
            Your sites
          </h2>
          {themes.length > 0 && (
            <div className="inline-flex items-center gap-1 rounded-full border border-token bg-white p-1">
              <FilterPill v="all"     cur={filter} onClick={setFilter}>All</FilterPill>
              <FilterPill v="drafts"  cur={filter} onClick={setFilter}>Drafts</FilterPill>
              <FilterPill v="live"    cur={filter} onClick={setFilter}>Live</FilterPill>
              <FilterPill v="shopify" cur={filter} onClick={setFilter}>Shopify</FilterPill>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading ? (
            <SitesGridSkeleton />
          ) : themes.length === 0 ? (
            <EmptyState />
          ) : visible.length === 0 ? (
            <FilteredEmpty filter={filter} onReset={() => setFilter('all')} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((t) => (
                <SiteCard
                  key={t.id}
                  theme={t}
                  hasHosting={hasHosting}
                  isPro={isPro}
                  onPublish={() => setPublishingTheme(t)}
                  onAddDomain={() => setDomainTheme(t)}
                  onUnpublish={() => unpublishTheme(t)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Affiliate callout — only when user has e-com themes ─────────── */}
      {!loading && hasEcom && (
        <section className="mt-12">
          <ShopifyAffiliateCallout placement="dashboard_post_export" />
        </section>
      )}

      {/* ── Quick links footer ──────────────────────────────────────────── */}
      <section className="mt-16 border-t border-token pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted">
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/settings" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <SettingsIcon className="h-3.5 w-3.5" strokeWidth={2} />
              Settings
            </Link>
            {(plan === 'pro_hosting' || plan === 'pro_onetime') && (
              <BillingPortalLink />
            )}
            {plan === 'admin' && (
              <Link href="/dashboard/analytics" className="inline-flex items-center gap-1.5 hover:text-foreground">
                <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                Analytics
              </Link>
            )}
          </div>
          <div className="text-[11.5px] text-muted">
            Signed in as <span className="font-medium text-foreground">{user?.email}</span>
          </div>
        </div>
      </section>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {publishingTheme && (
        <PublishSiteModal
          theme={publishingTheme}
          hasHosting={hasHosting}
          onClose={() => setPublishingTheme(null)}
          onPublished={(slug, url) => {
            refreshTheme(publishingTheme.id, { slug, is_published: true })
            setTimeout(() => alert(`Live: ${url}`), 50)
          }}
        />
      )}
      {domainTheme && (
        <AddDomainModal
          themeId={domainTheme.id}
          onClose={() => setDomainTheme(null)}
          onAdded={() => { /* DomainsList polls — no-op */ }}
        />
      )}
    </main>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Subcomponents                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

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

function PlanCard({
  plan,
  trialRemaining,
  trialLimit,
  hostingEnd,
}: {
  plan: Plan
  trialRemaining: number
  trialLimit: number
  hostingEnd: string | null | undefined
}) {
  if (plan === 'pro_hosting') {
    const renews = hostingEnd ? new Date(hostingEnd) : null
    const formatted = renews
      ? renews.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : '—'
    return (
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#15803d]">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          Hosting active
        </div>
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">
          $19.99 / month
        </div>
        <div className="mt-1 text-[12.5px] text-muted">Renews {formatted}</div>
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
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">
          Unlimited generations
        </div>
        <Link
          href="/checkout?plan=hosting"
          className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
        >
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
        <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">
          All features unlocked
        </div>
        <div className="mt-1 text-[12.5px] text-muted">Hosting + lifetime included</div>
      </div>
    )
  }
  // free
  const pct = trialLimit > 0 ? Math.round((trialRemaining / trialLimit) * 100) : 0
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        Free Plan
      </div>
      <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-foreground">
        {trialRemaining > 0
          ? `${trialRemaining} of ${trialLimit} generations left`
          : 'Trial used'}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct === 0 ? '#dc2626' : '#5e6ad2' }}
        />
      </div>
      <Link
        href="/checkout?plan=onetime"
        className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
      >
        Get Pro · $9.99 once
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
      </Link>
    </div>
  )
}

function StatTile({
  label,
  value,
  sublabel,
  highlight = false,
}: {
  label: string
  value: number | string
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-2xl border border-token bg-white p-5"
      style={highlight ? { background: 'rgba(220,38,38,0.04)', borderColor: 'rgba(220,38,38,0.20)' } : undefined}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1.5 text-[22px] font-bold tracking-tight text-foreground">{value}</div>
      {sublabel && <div className="mt-1 text-[12.5px] text-muted">{sublabel}</div>}
    </div>
  )
}

function FilterPill({
  v, cur, onClick, children,
}: {
  v: Filter
  cur: Filter
  onClick: (v: Filter) => void
  children: React.ReactNode
}) {
  const active = v === cur
  return (
    <button
      onClick={() => onClick(v)}
      className={
        'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ' +
        (active ? 'bg-foreground text-white' : 'text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

function SitesGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-token bg-white"
        >
          <div className="aspect-[16/9] animate-pulse bg-[rgba(28,28,28,0.04)]" />
          <div className="space-y-2.5 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[rgba(28,28,28,0.04)]" />
            <div className="mt-4 flex gap-2">
              <div className="h-7 w-16 animate-pulse rounded-md bg-[rgba(28,28,28,0.04)]" />
              <div className="h-7 w-24 animate-pulse rounded-md bg-[rgba(28,28,28,0.04)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-token bg-white p-12 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 0%, rgba(94,106,210,0.10), transparent 70%)',
        }}
      />
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: 'white',
          boxShadow:
            '0 8px 24px -8px rgba(94,106,210,0.40), 0 0 0 1px rgba(94,106,210,0.20) inset',
        }}
      >
        <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="text-[20px] font-bold tracking-tight text-foreground">
        Build your first site
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted">
        Pick a template, share a quick brief, and Zenya writes the copy and
        designs the page. Live in under a minute.
      </p>
      <Link
        href="/theme/new"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Create new site
      </Link>
      <div className="mt-4">
        <Link href="/themes" className="text-[12.5px] text-muted hover:text-foreground">
          or browse the 8 templates →
        </Link>
      </div>
    </motion.div>
  )
}

function FilteredEmpty({ filter, onReset }: { filter: Filter; onReset: () => void }) {
  const labels: Record<Filter, string> = {
    all: 'any sites',
    drafts: 'draft sites',
    live: 'published sites',
    shopify: 'Shopify sites',
  }
  return (
    <div className="rounded-2xl border border-dashed border-token p-10 text-center">
      <p className="text-[14px] text-muted">No {labels[filter]} yet.</p>
      <button
        onClick={onReset}
        className="mt-3 text-[13px] font-medium text-primary hover:underline"
      >
        Show all sites
      </button>
    </div>
  )
}

/* Wrapped Stripe Customer Portal link — does the fetch + redirect so the
   user never sees a blank tab. */
function BillingPortalLink() {
  const [busy, setBusy] = useState(false)
  return (
    <button
      onClick={async () => {
        if (busy) return
        setBusy(true)
        try {
          const r = await fetch('/api/account/portal', { method: 'POST' })
          if (r.ok) {
            const { url } = await r.json()
            if (url) window.location.href = url
          }
        } finally {
          setBusy(false)
        }
      }}
      className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground"
    >
      <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
      {busy ? 'Opening portal…' : 'Manage billing'}
    </button>
  )
}
