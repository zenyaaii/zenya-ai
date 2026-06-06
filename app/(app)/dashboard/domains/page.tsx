'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Globe, Plus, ExternalLink, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Trash2, Lock,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import AddDomainModal from '@/components/AddDomainModal'

type DomainRow = {
  id: string
  domain: string
  theme_id: string
  status: 'pending_dns' | 'pending_ssl' | 'live' | 'error' | 'removed'
  verified_at: string | null
  last_checked_at: string | null
  error_message: string | null
  is_primary: boolean
  created_at: string
}

type Theme = {
  id: string
  product_name: string
  slug?: string | null
  is_published?: boolean
}

const STATUS: Record<DomainRow['status'], {
  label: string; tint: string; ring: string; fg: string; icon: typeof Globe
}> = {
  pending_dns: { label: 'Waiting on DNS', tint: 'rgba(217,119,6,0.10)', ring: 'rgba(217,119,6,0.30)', fg: '#b45309', icon: Clock },
  pending_ssl: { label: 'Issuing SSL…',  tint: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)', fg: '#5e6ad2', icon: Clock },
  live:        { label: '🔒 Live',        tint: 'rgba(21,128,61,0.10)',  ring: 'rgba(21,128,61,0.30)',  fg: '#15803d', icon: CheckCircle2 },
  error:       { label: 'Error',          tint: 'rgba(220,38,38,0.10)',  ring: 'rgba(220,38,38,0.30)',  fg: '#b91c1c', icon: AlertCircle },
  removed:     { label: 'Removed',        tint: 'rgba(0,0,0,0.05)',      ring: 'rgba(0,0,0,0.15)',      fg: '#6b6b6b', icon: Trash2 },
}

export default function DomainsPage() {
  const supabase = createClient()
  const [hasHosting, setHasHosting] = useState(false)
  const [hostingChecked, setHostingChecked] = useState(false)
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [themes, setThemes] = useState<Record<string, Theme>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null) // theme_id to add for

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, domainsRes, themesRes] = await Promise.all([
      supabase.from('profiles').select('plan, has_hosting').eq('id', user.id).maybeSingle(),
      fetch('/api/domains').then((r) => (r.ok ? r.json() : { domains: [] })),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })),
    ])

    const profile = profileRes.data as any
    setHasHosting(!!profile?.has_hosting || profile?.plan === 'admin')
    setHostingChecked(true)
    setDomains(domainsRes.domains || [])
    const map: Record<string, Theme> = {}
    for (const t of (themesRes.themes || [])) map[t.id] = t
    setThemes(map)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Auto-poll non-live rows every 15s
  useEffect(() => {
    const hasPending = domains.some((d) => d.status === 'pending_dns' || d.status === 'pending_ssl')
    if (!hasPending) return
    const id = setInterval(async () => {
      for (const d of domains) {
        if (d.status === 'pending_dns' || d.status === 'pending_ssl') {
          try { await fetch(`/api/domains/${d.id}`) } catch {}
        }
      }
      load()
    }, 15_000)
    return () => clearInterval(id)
  }, [domains, load])

  async function recheck(id: string) {
    setBusyId(id)
    try { await fetch(`/api/domains/${id}`); await load() } finally { setBusyId(null) }
  }
  async function remove(id: string, domain: string) {
    if (!confirm(`Disconnect ${domain}? Your site stops resolving on that domain.`)) return
    setBusyId(id)
    try { await fetch(`/api/domains/${id}`, { method: 'DELETE' }); await load() } finally { setBusyId(null) }
  }

  // Eligible themes — published + hostable
  const eligibleThemes = useMemo(() => {
    return Object.values(themes).filter((t) => t.is_published && t.slug)
  }, [themes])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Domains</h1>
          <p className="mt-1 text-[13px] text-muted">
            Connect a custom domain to any of your published Zenya-hosted sites. SSL is automatic.
          </p>
        </div>
        {eligibleThemes.length > 0 && hasHosting && (
          <select
            onChange={(e) => { if (e.target.value) setAdding(e.target.value) }}
            value=""
            className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02]"
            style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
          >
            <option value="">+ Add domain to…</option>
            {eligibleThemes.map((t) => (
              <option key={t.id} value={t.id}>{t.product_name}</option>
            ))}
          </select>
        )}
      </header>

      {hostingChecked && !hasHosting && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(94,106,210,0.10)' }}>
              <Lock className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-foreground">Custom domains need the Hosting plan</div>
              <p className="mt-1 text-[12.5px] text-muted">$19.99/month. Point any domain at your Zenya site.</p>
            </div>
          </div>
          <Link href="/checkout?plan=hosting" className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
            Start hosting →
          </Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-token bg-white p-5">
              <div className="h-9 w-9 rounded-lg bg-[rgba(28,28,28,0.06)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-[rgba(28,28,28,0.06)]" />
                <div className="h-2.5 w-1/3 rounded bg-[rgba(28,28,28,0.04)]" />
              </div>
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <EmptyState hasHosting={hasHosting} hasEligible={eligibleThemes.length > 0} onAdd={() => eligibleThemes[0] && setAdding(eligibleThemes[0].id)} />
      ) : (
        <div className="space-y-2">
          {domains.map((d) => {
            const s = STATUS[d.status]
            const Icon = s.icon
            const theme = themes[d.theme_id]
            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: s.tint }}>
                    <Icon className="h-4 w-4" strokeWidth={2} style={{ color: s.fg }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-[14px] font-semibold text-foreground">{d.domain}</code>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                            style={{ background: s.tint, color: s.fg, border: `1px solid ${s.ring}` }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-muted">
                      Points at <strong className="text-foreground">{theme?.product_name || 'unknown site'}</strong>
                      {theme?.slug && <> · zenyaai.co/s/{theme.slug}</>}
                    </div>
                    {d.error_message && (
                      <div className="mt-1 text-[12px] text-[#b91c1c]">{d.error_message}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.status === 'live' && (
                    <a href={`https://${d.domain}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-black/5">
                      Open <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                  )}
                  {d.status !== 'live' && (
                    <button onClick={() => recheck(d.id)} disabled={busyId === d.id}
                            className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:bg-black/5">
                      <RefreshCw className={'h-3 w-3 ' + (busyId === d.id ? 'animate-spin' : '')} />
                      Recheck
                    </button>
                  )}
                  <button onClick={() => remove(d.id, d.domain)} disabled={busyId === d.id}
                          className="rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:bg-black/5">
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && (
        <AddDomainModal themeId={adding} onClose={() => setAdding(null)} onAdded={() => load()} />
      )}
    </div>
  )
}

function EmptyState({ hasHosting, hasEligible, onAdd }: { hasHosting: boolean; hasEligible: boolean; onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-token bg-white p-12 text-center">
      <Globe className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
      <h3 className="mt-4 text-[16px] font-semibold text-foreground">No domains connected yet</h3>
      {hasHosting && hasEligible ? (
        <>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
            Point your domain at Zenya — we add it to the hosting layer, you add two DNS records,
            SSL issues automatically.
          </p>
          <button onClick={onAdd} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add your first domain
          </button>
        </>
      ) : !hasHosting ? (
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
          Upgrade to the Hosting plan and publish a site, then connect any domain you own.
        </p>
      ) : (
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
          Publish a Zenya-hosted site first, then come back to connect a custom domain to it.
        </p>
      )}
    </div>
  )
}
