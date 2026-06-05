"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import AIDisclosure from '@/components/AIDisclosure'
import PublishSiteModal from '@/components/PublishSiteModal'

type Theme = {
  id: string
  product_name: string
  created_at: string
  slug?: string | null
  is_published?: boolean
  template_type?: string | null
}

const HOSTABLE_TYPES = new Set([
  'restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services',
])

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)
  const [plan, setPlan] = useState<'free' | 'pro_onetime' | 'pro_hosting' | 'admin'>('free')
  const [hasHosting, setHasHosting] = useState(false)
  const [publishingTheme, setPublishingTheme] = useState<Theme | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const r = await fetch('/api/themes')
      if (r.ok) {
        const j = await r.json()
        setThemes(j.themes || [])
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.plan) setPlan(profile.plan as any)
      setHasHosting(!!profile?.has_hosting || profile?.plan === 'admin')

      setLoading(false)
    }
    load()
  }, [router, supabase])

  async function startCheckout(plan: 'onetime' | 'hosting') {
    setSubLoading(true)
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const j = await r.json()
    setSubLoading(false)
    if (j.url) window.location.href = j.url
  }

  function refreshThemeRow(themeId: string, patch: Partial<Theme>) {
    setThemes((prev) => prev.map((t) => (t.id === themeId ? { ...t, ...patch } : t)))
  }

  async function unpublish(theme: Theme) {
    if (!confirm(`Unpublish ${theme.product_name}? The site will go offline immediately.`)) return
    const r = await fetch(`/api/themes/${theme.id}/publish`, { method: 'DELETE' })
    if (r.ok) refreshThemeRow(theme.id, { is_published: false })
  }

  const planLabel =
    plan === 'pro_hosting' ? 'Pro · Hosting' :
    plan === 'pro_onetime' ? 'Pro · Lifetime' :
    plan === 'admin'       ? 'Admin' :
                             'Free Plan'

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-token pb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${plan === 'free' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
              {planLabel}
            </div>
            {plan === 'free' && (
              <button onClick={() => startCheckout('onetime')} disabled={subLoading} className="text-sm font-medium text-primary hover:underline">
                {subLoading ? '...' : 'Get Lifetime Pro ($9.99)'}
              </button>
            )}
            {plan === 'pro_onetime' && (
              <button onClick={() => startCheckout('hosting')} disabled={subLoading} className="text-sm font-medium text-primary hover:underline">
                {subLoading ? '...' : 'Add hosting ($19.99/mo)'}
              </button>
            )}
            {plan === 'free' && (
              <button onClick={() => startCheckout('hosting')} disabled={subLoading} className="text-xs font-medium text-muted hover:underline">
                or start hosting ($19.99/mo)
              </button>
            )}
          </div>
        </div>

        <Link
          href="/theme/new"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 hover:shadow-xl"
        >
          <span>+</span> Create New Theme
        </Link>
      </div>

      <AIDisclosure variant="banner" className="mt-6" />

      {loading ? (
        <div className="mt-12 text-center text-muted">Loading your themes...</div>
      ) : themes.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-token p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-2xl">✨</div>
          <h3 className="mt-4 text-lg font-medium text-foreground">No themes yet</h3>
          <p className="mt-2 text-muted">Create your first high-converting store theme.</p>
          <Link href="/theme/new" className="mt-6 inline-block text-primary hover:underline">Create Theme &rarr;</Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map(t => {
            const bt = (t as any).content?.business_type || t.template_type || 'storefront'
            const isHostable = HOSTABLE_TYPES.has(bt)
            return (
              <div
                key={t.id}
                className="group relative overflow-hidden rounded-2xl border border-token bg-elevated p-6 shadow-soft-sm transition hover:-translate-y-1 hover:shadow-soft-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Link href={`/preview/${t.id}`} className="block">
                    <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary">
                      {t.product_name}
                    </h3>
                  </Link>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                    {t.is_published ? (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        Live at{' '}
                        <a
                          href={`/s/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          /s/{t.slug}
                        </a>
                      </>
                    ) : (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                        Draft — ready to publish
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/preview/${t.id}`}
                      className="rounded-md border border-token px-3 py-1.5 text-xs font-medium text-muted hover:bg-black/5"
                    >
                      Preview
                    </Link>
                    {isHostable ? (
                      t.is_published ? (
                        <button
                          onClick={() => unpublish(t)}
                          className="rounded-md border border-token px-3 py-1.5 text-xs font-medium text-muted hover:bg-black/5"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => setPublishingTheme(t)}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                        >
                          Publish to Zenya
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] uppercase tracking-wider text-muted">
                        Ships to Shopify
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {publishingTheme && (
        <PublishSiteModal
          theme={publishingTheme}
          hasHosting={hasHosting}
          onClose={() => setPublishingTheme(null)}
          onPublished={(slug, url) => {
            refreshThemeRow(publishingTheme.id, { slug, is_published: true })
            // Light "you're live" feedback. Real toast goes in Phase 2b.
            alert(`Live: ${url}`)
          }}
        />
      )}
    </main>
  )
}
