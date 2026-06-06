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

type Plan = 'free' | 'pro_onetime' | 'pro_hosting' | 'admin'
type Profile = {
  plan: Plan
  is_pro: boolean
  has_hosting: boolean
}

type Filter = 'all' | 'drafts' | 'live' | 'shopify'
type ViewMode = 'grid' | 'list'

export default function SitesPage() {
  const router = useRouter()
  const supabase = createClient()

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
        .select('plan, is_pro, has_hosting')
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

  const plan: Plan = profile?.plan || 'free'
  const isPro = !!profile?.is_pro || plan === 'admin'
  const hasHosting = !!profile?.has_hosting || plan === 'admin'

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
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Your sites</h1>
          <p className="mt-1 text-[13px] text-muted">
            {loading
              ? 'Loading…'
              : counts.all === 0
                ? 'Generate your first site to see it here.'
                : `${counts.all} site${counts.all === 1 ? '' : 's'} · ${counts.live} live · ${counts.drafts} draft${counts.drafts === 1 ? '' : 's'}${counts.shopify ? ` · ${counts.shopify} Shopify` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/themes"
            className="hidden items-center gap-1.5 rounded-full border border-token bg-white px-3 py-2 text-[12.5px] font-medium text-muted hover:bg-black/5 sm:inline-flex"
          >
            Browse templates
          </Link>
          <Link
            href="/theme/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            New site
          </Link>
        </div>
      </motion.header>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {counts.all > 0 && (
        <section className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites"
              className="w-full rounded-full border border-token bg-white py-1.5 pl-9 pr-3 text-[13px] text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-token bg-white p-1">
            <FilterPill v="all"     cur={filter} onClick={setFilter}>All <Pill n={counts.all} /></FilterPill>
            <FilterPill v="live"    cur={filter} onClick={setFilter}>Live <Pill n={counts.live} /></FilterPill>
            <FilterPill v="drafts"  cur={filter} onClick={setFilter}>Drafts <Pill n={counts.drafts} /></FilterPill>
            {counts.shopify > 0 && (
              <FilterPill v="shopify" cur={filter} onClick={setFilter}>Shopify <Pill n={counts.shopify} /></FilterPill>
            )}
          </div>

          <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-token bg-white p-1">
            <ViewBtn cur={view} v="grid" onClick={setView} title="Grid view"><LayoutGrid className="h-3.5 w-3.5" /></ViewBtn>
            <ViewBtn cur={view} v="list" onClick={setView} title="List view"><List className="h-3.5 w-3.5" /></ViewBtn>
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
                isPro={isPro}
                onPublish={() => setPublishingTheme(t)}
                onAddDomain={() => setDomainTheme(t)}
                onUnpublish={() => unpublishTheme(t)}
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
                isPro={isPro}
                onPublish={() => setPublishingTheme(t)}
                onAddDomain={() => setDomainTheme(t)}
                onUnpublish={() => unpublishTheme(t)}
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

function FilteredEmpty({
  filter, query, onReset,
}: { filter: Filter; query: string; onReset: () => void }) {
  const labels: Record<Filter, string> = {
    all: 'sites',
    drafts: 'draft sites',
    live: 'published sites',
    shopify: 'Shopify sites',
  }
  return (
    <div className="rounded-2xl border border-dashed border-token p-10 text-center">
      <p className="text-[14px] text-muted">
        No {labels[filter]} match{query ? ` “${query}”` : ' the current filter'}.
      </p>
      <button
        onClick={onReset}
        className="mt-3 text-[13px] font-medium text-primary hover:underline"
      >
        Clear filters
      </button>
    </div>
  )
}

/* ─── List-view row — denser alt layout ─────────────────────────────────── */

function SiteRow({
  theme, isFirst, hasHosting, isPro, onPublish, onAddDomain, onUnpublish,
}: {
  theme: SiteTheme
  isFirst: boolean
  hasHosting: boolean
  isPro: boolean
  onPublish: () => void
  onAddDomain: () => void
  onUnpublish: () => void
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
          <div className="truncate text-[13.5px] font-semibold text-foreground">{theme.product_name || 'Untitled'}</div>
          <div className="truncate text-[11.5px] text-muted">
            {live ? `zenyaai.co/s/${theme.slug}` : bt + (isEcom ? ' · Shopify' : ' · draft')}
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
        <Link
          href={`/preview/${theme.id}`}
          className="rounded-md border border-token bg-white px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
        >
          Preview
        </Link>
        {isHostable && hasHosting && !live && (
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
      </div>
    </div>
  )
}

function editUrlFor(id: string, bt: string): string {
  // Restaurant ships with a real per-section editor today; everything else
  // sends the user to the preview surface which links onward to /theme/new
  // for full regeneration.
  if (bt === 'restaurant') return `/preview/restaurant/${id}/edit`
  return `/preview/${id}`
}
