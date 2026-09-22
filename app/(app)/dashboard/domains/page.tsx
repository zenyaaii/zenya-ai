'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import AddDomainModal from '@/components/AddDomainModal'
import { useNotify } from '@/components/ui/Notify'
import { canConnectCustomDomain } from '@/lib/domain-entitlement'
import { DomainsScreen, type DomainData } from '@/components/dashboard/screens/domains'
import { longDate, type Action } from '@/components/dashboard/screens/kit'

type DomainRow = {
  id: string
  domain: string
  theme_id: string
  status: 'pending_dns' | 'pending_ssl' | 'live' | 'error' | 'removed'
  error_message: string | null
}

type Theme = { id: string; product_name: string | null; slug?: string | null; is_published?: boolean | null }

const STATUS: Record<Exclude<DomainRow['status'], 'removed'>, { label: string; tone: DomainData['tone'] }> = {
  live: { label: 'متصل', tone: 'ok' },
  pending_dns: { label: 'بانتظار DNS', tone: 'accent' },
  pending_ssl: { label: 'جارٍ إصدار SSL', tone: 'accent' },
  error: { label: 'خطأ', tone: 'bad' },
}

/** Domains: the demo's domains screen, on the owner's real domains. */
export default function DomainsPage() {
  const { toast } = useNotify()
  const [domains, setDomains] = useState<DomainRow[] | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [expires, setExpires] = useState<Record<string, string | null>>({})
  const [canConnect, setCanConnect] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profile }, d, t, p] = await Promise.all([
      supabase.from('profiles').select('plan, has_hosting, is_pro').eq('id', user.id).maybeSingle(),
      fetch('/api/domains').then((r) => (r.ok ? r.json() : { domains: [] })).catch(() => ({ domains: [] })),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] })),
      fetch('/api/domains/purchase').then((r) => (r.ok ? r.json() : { purchases: [] })).catch(() => ({ purchases: [] })),
    ])
    setCanConnect(canConnectCustomDomain(profile as any))
    setDomains(d.domains || [])
    setThemes(t.themes || [])
    const map: Record<string, string | null> = {}
    for (const row of p.purchases || []) map[row.domain] = row.expires_at
    setExpires(map)
  }, [])

  useEffect(() => { load() }, [load])

  // A domain waiting on DNS or SSL is re-checked every 15s until it settles.
  useEffect(() => {
    if (!domains?.some((x) => x.status === 'pending_dns' || x.status === 'pending_ssl')) return
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [domains, load])

  async function recheck(d: DomainRow) {
    try {
      const r = await fetch(`/api/domains/${d.id}`)
      const j = await r.json().catch(() => ({}))
      await load()
      const status = (j?.domain?.status || j?.status || d.status) as DomainRow['status']
      const label = status === 'removed' ? 'مُزال' : STATUS[status]?.label
      toast({
        type: status === 'live' ? 'success' : status === 'error' ? 'error' : 'info',
        message: `${d.domain}: ${label || 'تم الفحص'}`,
        description: j?.domain?.error_message || d.error_message || undefined,
      })
    } catch {
      toast({ type: 'error', message: `تعذّر فحص ${d.domain}` })
    }
  }

  if (!domains) return null

  const eligible = themes.filter((t) => t.is_published && t.slug)
  const names = Object.fromEntries(themes.map((t) => [t.id, t.product_name || 'موقع']))

  const add: Action = !canConnect
    ? { href: '/pricing?upgrade=starter' }
    : eligible.length === 0
      ? { href: '/dashboard/sites' }
      : eligible.length === 1
        ? { onClick: () => setAdding(eligible[0].id) }
        : { onClick: () => setMenuOpen((v) => !v) }

  const addMenu = menuOpen ? (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} aria-hidden />
      <div className="zy-menu absolute end-0 top-full z-30 mt-2 w-64">
        <p className="zy-sub px-2.5 py-1.5">لأي موقع هذا النطاق؟</p>
        {eligible.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setMenuOpen(false); setAdding(t.id) }}
            className="zy-menu-row hover:bg-[rgba(17,17,17,0.05)] hover:text-[#171717]"
          >
            {t.product_name || 'موقع'}
          </button>
        ))}
      </div>
    </>
  ) : null

  return (
    <>
      <DomainsScreen
        add={add}
        addMenu={addMenu}
        domains={domains
          .filter((d) => d.status !== 'removed')
          .map((d) => {
            const s = STATUS[d.status as keyof typeof STATUS]
            return {
              id: d.id,
              domain: d.domain,
              site: names[d.theme_id] || 'موقع',
              status: s.label,
              tone: s.tone,
              ssl: d.status === 'live',
              renews: expires[d.domain] ? longDate(expires[d.domain]) : '—',
              manage: { onClick: () => recheck(d) },
            }
          })}
      />
      {adding && <AddDomainModal themeId={adding} onClose={() => setAdding(null)} onAdded={() => load()} />}
    </>
  )
}
