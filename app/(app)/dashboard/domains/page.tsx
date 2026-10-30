'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { canConnectCustomDomain } from '@/lib/domain-entitlement'
import { publicSiteHost } from '@/lib/portal-urls'
import V6Domains, { type DnsRec, type DomainState, type V6Domain } from '@/components/app/v6/pages/Domains'
import { dateAr } from '@/components/app/v6/pages/kit'
import { useSite } from '@/components/app/v6/site'

type DomainRow = {
  id: string
  domain: string
  theme_id: string
  status: DomainState | 'removed'
  error_message: string | null
}

type Theme = { id: string; product_name: string | null; slug?: string | null; is_published?: boolean | null; template_type?: string | null }

const HOSTED = new Set(['restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services'])
const asRecs = (r: unknown): DnsRec[] => (Array.isArray(r) ? r : []).map((x: any) => ({ type: String(x?.type || ''), name: String(x?.name || '@'), value: String(x?.value || '') }))

/** Domains: the v6 design's domains page, on the owner's real domains. */
export default function DomainsPage() {
  const ctx = useSite()
  const [domains, setDomains] = useState<DomainRow[] | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [expires, setExpires] = useState<Record<string, string | null>>({})
  const [profile, setProfile] = useState<any>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: prof }, d, t, p] = await Promise.all([
      supabase.from('profiles').select('plan, has_hosting, is_pro').eq('id', user.id).maybeSingle(),
      fetch('/api/domains', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { domains: [] })).catch(() => ({ domains: [] })),
      fetch('/api/themes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] })),
      fetch('/api/domains/purchase').then((r) => (r.ok ? r.json() : { purchases: [] })).catch(() => ({ purchases: [] })),
    ])
    setProfile(prof || {})
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

  if (!domains || !profile) return null

  const plan = profile.plan || 'free'
  const isPro = plan === 'pro' || plan === 'admin' || !!profile.is_pro
  const names = Object.fromEntries(themes.map((t) => [t.id, t.product_name || 'موقع']))
  const live = themes.filter((t) => t.is_published && t.slug && HOSTED.has(t.template_type || ''))

  const rows: V6Domain[] = [
    ...domains.filter((d) => d.status !== 'removed').map((d) => ({
      id: d.id,
      domain: d.domain,
      site: names[d.theme_id] || 'موقع',
      state: d.status as DomainState,
      renews: expires[d.domain] ? dateAr(expires[d.domain]) : undefined,
      error: d.error_message,
    })),
    ...live.map((t) => ({ id: 'free:' + t.id, domain: publicSiteHost(t.slug!), site: t.product_name || 'موقع', state: 'live' as const, free: true })),
  ]

  return (
    <V6Domains
      domains={rows}
      sites={live.map((t) => ({ id: t.id, name: t.product_name || 'موقع' }))}
      current={ctx?.siteId || ''}
      canConnect={canConnectCustomDomain(profile) ? true : { href: '/pricing?upgrade=starter' }}
      isPro={isPro}
      connect={async (siteId, domain) => {
        try {
          const r = await fetch('/api/domains', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme_id: siteId, domain }),
          })
          const j = await r.json().catch(() => ({}))
          if (!r.ok) {
            return {
              error: j.error === 'domain_taken' ? 'هذا النطاق مربوط بموقع آخر في بينون.'
                : j.error === 'invalid_domain' ? 'اكتب النطاق هكذا: example.com'
                  : j.error === 'starter_required' ? 'ربط نطاقك الخاص يحتاج باقة Starter أو Pro.'
                    : 'تعذّر إضافة النطاق. حاول مرة أخرى.',
            }
          }
          load()
          ctx?.reload()
          return { records: asRecs(j.required) }
        } catch {
          return { error: 'تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' }
        }
      }}
      check={async (id) => {
        try {
          const r = await fetch(`/api/domains/${id}`)
          const j = await r.json().catch(() => null)
          await load()
          if (!r.ok || !j) return null
          if (j.status === 'live') ctx?.reload()
          return { state: (j.status || 'pending_dns') as DomainState, error: j.error_message }
        } catch {
          return null
        }
      }}
      records={async (id) => {
        const r = await fetch(`/api/domains/${id}`)
        const j = await r.json().catch(() => null)
        return asRecs(j?.required)
      }}
      remove={async (id) => {
        const r = await fetch(`/api/domains/${id}`, { method: 'DELETE' }).catch(() => null)
        if (r?.ok) { setDomains((d) => (d || []).filter((x) => x.id !== id)); ctx?.reload() }
        return !!r?.ok
      }}
      search={async (q) => {
        try {
          const r = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`)
          const j = await r.json().catch(() => ({}))
          if (!r.ok) return { error: 'تعذّر البحث الآن. جرّب بعد قليل.' }
          return { rows: ((j.results || []) as any[]).map((x) => ({ domain: String(x.domain), price: typeof x.retail_usd_year === 'number' ? x.retail_usd_year : null })) }
        } catch {
          return { error: 'تعذّر البحث الآن. جرّب بعد قليل.' }
        }
      }}
      buy={async (domain, siteId) => {
        try {
          const r = await fetch('/api/domains/purchase', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain, theme_id: siteId }),
          })
          const j = await r.json().catch(() => ({}))
          if (r.ok && j.url) return { url: j.url }
          return {
            error: j.error === 'unavailable' ? `${domain} محجوز. اختر نطاقًا آخر.`
              : j.error === 'rate_limited' ? 'نتحقق من النطاقات ببطء لنحترم حدود المسجّل. جرّب بعد عشر ثوانٍ.'
                : 'تعذّر بدء الشراء. حاول مرة أخرى.',
          }
        } catch {
          return { error: 'تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' }
        }
      }}
      links={{ sites: { href: '/dashboard/sites' }, pricing: { href: '/pricing' } }}
    />
  )
}
