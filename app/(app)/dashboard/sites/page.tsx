'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sparkles, Plus, Search, LayoutGrid, List,
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
import { useNotify } from '@/components/ui/Notify'
import { publicSiteUrl } from '@/lib/portal-urls'

type Plan = 'free' | 'pro_onetime' | 'pro_hosting' | 'starter' | 'pro' | 'admin'
type Profile = {
  plan: Plan
  is_pro: boolean
  has_hosting: boolean
  created_at: string
}

// First 30 days: hosting is free on every plan (kept in sync with the publish API).
const TRIAL_DAYS = 30

type Filter = 'all' | 'drafts' | 'live' | 'shopify'
type ViewMode = 'grid' | 'list'

export default function SitesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { confirm, toast } = useNotify()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [themes, setThemes] = useState<SiteTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [query, setQuery] = useState('')
  const [publishingTheme, setPublishingTheme] = useState<SiteTheme | null>(null)
  const [domainTheme, setDomainTheme] = useState<SiteTheme | null>(null)

  const loadAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/dashboard/sites')
      return
    }

    const [{ data: profileRow }, themesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting, created_at')
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
    const name = theme.product_name || 'موقعك'
    const { confirmed } = await confirm({
      title: `إلغاء نشر «${name}»؟`,
      message: 'سيتوقّف الموقع عن العمل مباشرةً على الإنترنت. يمكنك نشره مجددًا في أي وقت.',
      confirmText: 'إلغاء النشر',
      tone: 'danger',
    })
    if (!confirmed) return
    const r = await fetch(`/api/themes/${theme.id}/publish`, { method: 'DELETE' })
    if (r.ok) {
      refreshTheme(theme.id, { is_published: false })
      toast({ type: 'success', message: 'تم إلغاء نشر الموقع.' })
    } else {
      toast({ type: 'error', message: 'تعذّر إلغاء النشر. حاول مجددًا.' })
    }
  }

  const deleteTheme = async (theme: SiteTheme) => {
    const name = theme.product_name || 'موقعك'
    const { confirmed, checked } = await confirm({
      title: `حذف «${name}» نهائيًا؟`,
      message:
        'سيُلغى النشر إن كان مباشرًا، ويُحذف الموقع من حسابك. لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف نهائيًا',
      tone: 'danger',
      checkbox: {
        label: 'احذف أيضًا الصور التي استُخدمت في هذا الموقع من معرض الصور (ما لم تكن مستخدمة في موقع آخر).',
      },
    })
    if (!confirmed) return
    const r = await fetch(
      `/api/themes/${theme.id}${checked ? '?deleteImages=1' : ''}`,
      { method: 'DELETE' },
    )
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      toast({ type: 'error', message: j?.message || 'تعذّر الحذف. حاول مجددًا.' })
      return
    }
    setThemes((prev) => prev.filter((t) => t.id !== theme.id))
    const j = await r.json().catch(() => ({} as any))
    toast({
      type: 'success',
      message: 'تم حذف الموقع.',
      description:
        checked && typeof j?.deletedImages === 'number' && j.deletedImages > 0
          ? `وحُذفت ${j.deletedImages} صورة من معرضك.`
          : undefined,
    })
  }

  const plan: Plan = profile?.plan || 'free'
  const isPro =
    !!profile?.is_pro ||
    plan === 'admin' ||
    plan === 'pro_onetime' ||
    plan === 'pro_hosting' ||
    plan === 'starter' ||
    plan === 'pro'
  // Belt-and-suspenders: trust plan first, then the cached flag. If a
  // Stripe webhook ever races the column out of sync, the user still sees
  // the entitlement they paid for. `pro` and `pro_hosting` include hosting;
  // `starter` and `pro_onetime` do NOT.
  const hasHosting =
    plan === 'admin' ||
    plan === 'starter' ||
    plan === 'pro_hosting' ||
    plan === 'pro' ||
    !!profile?.has_hosting

  // Free 30-day hosting trial: new accounts can publish on any plan (incl.
  // free) until the window closes. `trialHosting` = live only *because* of the
  // trial (no paid hosting yet) — those sites get a "تجربة مجانية" badge.
  const inTrial =
    !!profile?.created_at &&
    Date.now() < new Date(profile.created_at).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  const canPublish = hasHosting || inTrial
  const trialHosting = inTrial && !hasHosting

  const counts = useMemo(() => {
    const live    = themes.filter((t) => t.is_published && t.slug).length
    const drafts  = themes.filter((t) => {
      const bt = (t.content && (t.content as any).business_type) || t.template_type
      return HOSTABLE_TYPES.has(bt) && !t.is_published
    }).length
    const shopify = themes.filter((t) => {
      const bt = (t.content && (t.content as any).business_type) || t.template_type
      return SHOPIFY_TYPES.has(bt)
    }).length
    return { all: themes.length, live, drafts, shopify }
  }, [themes])

  const hasEcom = counts.shopify > 0

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return themes.filter((t) => {
      const bt =
        (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
        t.template_type
      if (filter === 'live'    && !(t.is_published && t.slug)) return false
      if (filter === 'drafts'  && !(HOSTABLE_TYPES.has(bt) && !t.is_published)) return false
      if (filter === 'shopify' && !SHOPIFY_TYPES.has(bt)) return false
      if (q) {
        const haystack = `${t.product_name || ''} ${bt || ''} ${t.slug || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [themes, filter, query])

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5"
      >
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">مواقعك</h1>
          <p className="mt-1 text-[13px] text-muted">
            {loading
              ? 'جارٍ التحميل…'
              : counts.all === 0
                ? 'أنشئ موقعك الأول لتراه هنا.'
                : `${counts.all} موقع · ${counts.live} مباشر · ${counts.drafts} مسودّة${counts.shopify ? ` · ${counts.shopify} شوبيفاي` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/themes"
            className="hidden items-center gap-1.5 rounded-full border border-token bg-white px-3 py-2 text-[12.5px] font-medium text-muted hover:bg-black/5 sm:inline-flex"
          >
            تصفّح القوالب
          </Link>
          <Link
            href="/theme/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            موقع جديد
          </Link>
        </div>
      </motion.header>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {counts.all > 0 && (
        <section className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في المواقع"
              className="w-full rounded-full border border-token bg-white py-1.5 ps-9 pe-3 text-[13px] text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-token bg-white p-1">
            <FilterPill v="all"     cur={filter} onClick={setFilter}>الكل <Pill n={counts.all} /></FilterPill>
            <FilterPill v="live"    cur={filter} onClick={setFilter}>مباشر <Pill n={counts.live} /></FilterPill>
            <FilterPill v="drafts"  cur={filter} onClick={setFilter}>مسودّات <Pill n={counts.drafts} /></FilterPill>
            {counts.shopify > 0 && (
              <FilterPill v="shopify" cur={filter} onClick={setFilter}>شوبيفاي <Pill n={counts.shopify} /></FilterPill>
            )}
          </div>

          <div className="ms-auto inline-flex items-center gap-1 rounded-full border border-token bg-white p-1">
            <ViewBtn cur={view} v="grid" onClick={setView} title="عرض شبكي"><LayoutGrid className="h-3.5 w-3.5" /></ViewBtn>
            <ViewBtn cur={view} v="list" onClick={setView} title="عرض قائمة"><List className="h-3.5 w-3.5" /></ViewBtn>
          </div>
        </section>
      )}

      <AIDisclosure variant="banner" className="mt-6" />

      {/* ── Grid / list ──────────────────────────────────────────────────── */}
      <section className="mt-6">
        {loading ? (
          <SitesGridSkeleton />
        ) : themes.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <FilteredEmpty filter={filter} query={query} onReset={() => { setFilter('all'); setQuery('') }} />
        ) : view === 'grid' ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <SiteCard
                key={t.id}
                theme={t}
                hasHosting={hasHosting}
                canPublish={canPublish}
                trialHosting={trialHosting}
                isPro={isPro}
                plan={plan}
                onPublish={() => setPublishingTheme(t)}
                onAddDomain={() => setDomainTheme(t)}
                onUnpublish={() => unpublishTheme(t)}
                onDelete={() => deleteTheme(t)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-token bg-white">
            {visible.map((t, i) => (
              <SiteRow
                key={t.id}
                theme={t}
                isFirst={i === 0}
                hasHosting={hasHosting}
                canPublish={canPublish}
                trialHosting={trialHosting}
                isPro={isPro}
                onPublish={() => setPublishingTheme(t)}
                onAddDomain={() => setDomainTheme(t)}
                onUnpublish={() => unpublishTheme(t)}
                onDelete={() => deleteTheme(t)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Shopify affiliate callout when relevant ──────────────────────── */}
      {!loading && hasEcom && (
        <section className="mt-12">
          <ShopifyAffiliateCallout placement="dashboard_post_export" />
        </section>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {publishingTheme && (
        <PublishSiteModal
          theme={publishingTheme}
          hasHosting={hasHosting}
          trialActive={inTrial}
          isPro={isPro}
          onClose={() => setPublishingTheme(null)}
          onPublished={(slug, url) => {
            refreshTheme(publishingTheme.id, { slug, is_published: true })
            toast({ type: 'success', message: 'موقعك الآن مباشر! 🎉', description: url })
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
/* Tiny pieces                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

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
        'flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ' +
        (active ? 'bg-foreground text-white' : 'text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

function ViewBtn({
  v, cur, onClick, children, title,
}: {
  v: ViewMode
  cur: ViewMode
  onClick: (v: ViewMode) => void
  children: React.ReactNode
  title: string
}) {
  const active = v === cur
  return (
    <button
      onClick={() => onClick(v)}
      title={title}
      aria-pressed={active}
      className={
        'rounded-full px-2 py-1 transition-colors ' +
        (active ? 'bg-foreground text-white' : 'text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

function Pill({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-[rgba(28,28,28,0.06)] px-1.5 py-0.5 text-[10px] font-bold text-muted">
      {n}
    </span>
  )
}

/** Marks a site that's live only via the free 30-day hosting trial. */
function TrialBadge() {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
      style={{
        background: 'rgba(217,119,6,0.10)',
        color: '#b45309',
        border: '1px solid rgba(217,119,6,0.20)',
      }}
      title="موقعك مباشر مجانًا خلال الشهر الأول. بعده تحتاج خطة Starter للإبقاء عليه."
    >
      تجربة مجانية
    </span>
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
        أنشئ موقعك الأول
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted">
        اختر قالبًا، واكتب نبذة سريعة، وتكتب زينيا المحتوى وتصمّم الصفحة.
        جاهز خلال أقل من دقيقة.
      </p>
      <Link
        href="/theme/new"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        أنشئ موقعًا جديدًا
      </Link>
      <div className="mt-4">
        <Link href="/themes" className="text-[12.5px] text-muted hover:text-foreground">
          أو تصفّح القوالب الثمانية ←
        </Link>
      </div>
    </motion.div>
  )
}

function FilteredEmpty({
  filter, query, onReset,
}: { filter: Filter; query: string; onReset: () => void }) {
  const labels: Record<Filter, string> = {
    all: 'مواقع',
    drafts: 'مسودّات',
    live: 'مواقع منشورة',
    shopify: 'مواقع شوبيفاي',
  }
  return (
    <div className="rounded-2xl border border-dashed border-token p-10 text-center">
      <p className="text-[14px] text-muted">
        لا توجد {labels[filter]} تطابق{query ? ` «${query}»` : ' الفلتر الحالي'}.
      </p>
      <button
        onClick={onReset}
        className="mt-3 text-[13px] font-medium text-primary hover:underline"
      >
        مسح الفلاتر
      </button>
    </div>
  )
}

/* ─── List-view row — denser alt layout ─────────────────────────────────── */

function SiteRow({
  theme, isFirst, hasHosting, canPublish, trialHosting, isPro, onPublish, onAddDomain, onUnpublish, onDelete,
}: {
  theme: SiteTheme
  isFirst: boolean
  hasHosting: boolean
  canPublish: boolean
  trialHosting: boolean
  isPro: boolean
  onPublish: () => void
  onAddDomain: () => void
  onUnpublish: () => void
  onDelete: () => void
}) {
  const bt =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type ||
    'storefront'
  const isHostable = HOSTABLE_TYPES.has(bt)
  const isEcom = SHOPIFY_TYPES.has(bt)
  const live = !!theme.is_published && !!theme.slug

  return (
    <div className={'flex flex-wrap items-center justify-between gap-3 px-5 py-3 ' + (isFirst ? '' : 'border-t border-token')}>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-bold uppercase"
          style={{ background: live ? 'rgba(21,128,61,0.10)' : isEcom ? 'rgba(94,106,210,0.10)' : 'rgba(217,119,6,0.10)', color: live ? '#15803d' : isEcom ? '#5e6ad2' : '#b45309' }}
        >
          {(theme.product_name || '?').slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-foreground">{theme.product_name || 'Untitled'}</span>
            {live && trialHosting && <TrialBadge />}
          </div>
          <div className="truncate text-[11.5px] text-muted">
            {live ? `${theme.slug}.zenyaai.co` : bt + (isEcom ? ' · Shopify' : ' · draft')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href={editUrlFor(theme.id, bt)}
          className="rounded-md border border-token bg-white px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
        >
          Edit
        </Link>
        <a
          href={live ? publicSiteUrl(theme.slug!) : `/preview/${theme.id}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-token bg-white px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
        >
          {live ? 'زيارة' : 'معاينة'}
        </a>
        {isHostable && canPublish && !live && (
          <button onClick={onPublish} className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white">
            Publish
          </button>
        )}
        {isHostable && live && hasHosting && (
          <button onClick={onAddDomain} className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white">
            Add domain
          </button>
        )}
        {isEcom && isPro && (
          <a
            href={`/api/themes/${theme.id}/export-shopify`}
            className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white"
          >
            Shopify ZIP
          </a>
        )}
        {live && (
          <button
            onClick={onUnpublish}
            className="rounded-md border border-token bg-white px-2.5 py-1 text-[11.5px] font-medium text-muted hover:bg-black/5"
          >
            Unpublish
          </button>
        )}
        <button
          onClick={onDelete}
          className="rounded-md border border-[rgba(220,38,38,0.20)] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#b91c1c] hover:bg-[rgba(220,38,38,0.06)]"
          title="حذف الموقع نهائيًا"
        >
          حذف
        </button>
      </div>
    </div>
  )
}

const BROCHURE_TYPES = new Set([
  'restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services',
])
function editUrlFor(id: string, bt: string): string {
  if (BROCHURE_TYPES.has(bt)) return `/preview/${bt}/${id}/edit`
  return `/preview/${id}`
}
