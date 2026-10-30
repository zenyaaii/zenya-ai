'use client'

/**
 * The current site, shared by the whole dashboard.
 *
 * The v6 design has one site switcher (the card under the logo, the pill in
 * the phone's bar) and every page follows it. The shell loads the account's
 * sites and domains once, keeps the choice in this browser
 * (beynoun-dash-site) and hands it down; Home and Analytics read it here
 * instead of each choosing a site of their own.
 *
 * Without a saved choice the current site is the latest published one, else
 * the latest.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ThemeRow } from '@/components/dashboard/site-kinds'
import { publicSiteHost } from '@/lib/portal-urls'
import type { FrameSite } from './Frame'

export type SiteDomain = { domain: string; theme_id: string | null; status: string; is_primary?: boolean | null }

export type AccountSites = {
  /** null until the first load ends. */
  themes: ThemeRow[] | null
  domains: SiteDomain[]
  siteId: string
  setSiteId: (id: string) => void
  reload: () => void
}

const KEY = 'beynoun-dash-site'

export function pickSite(themes: ThemeRow[]): string {
  const by = (t: ThemeRow) => new Date(t.updated_at || t.created_at).getTime()
  const sorted = [...themes].sort((a, b) => by(b) - by(a))
  return (sorted.find((t) => t.is_published && t.slug) || sorted[0])?.id || ''
}

/** The site's own domain when it is live, else its free beynoun address. */
export function hostOf(t: ThemeRow, domains: SiteDomain[]): string | null {
  const own = domains
    .filter((d) => d.theme_id === t.id && d.status === 'live')
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary))[0]
  return own ? own.domain : t.slug ? publicSiteHost(t.slug) : null
}

/** The hero photo of a site, for the phone picture and the switcher's thumb. */
export function heroImage(content: any): string | null {
  const h = content && typeof content === 'object' ? content.hero : null
  const img = h?.image
  const url = typeof img === 'string' ? img : typeof img?.url === 'string' ? img.url : null
  return url && /^(https?:)?\/\//.test(url) ? url : url && url.startsWith('/') ? url : null
}

export function frameSites(themes: ThemeRow[] | null, domains: SiteDomain[]): FrameSite[] {
  return (themes || []).map((t) => ({
    id: t.id,
    name: t.product_name || 'موقع بلا اسم',
    live: !!(t.is_published && t.slug),
    host: hostOf(t, domains),
    cover: heroImage(t.content),
  }))
}

/** For the shell: load the account's sites once and remember the choice. */
export function useAccountSites(enabled: boolean): AccountSites {
  const [themes, setThemes] = useState<ThemeRow[] | null>(null)
  const [domains, setDomains] = useState<SiteDomain[]>([])
  const [siteId, setSite] = useState('')
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    Promise.all([
      fetch('/api/themes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] })),
      fetch('/api/domains', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { domains: [] })).catch(() => ({ domains: [] })),
    ]).then(([t, d]) => {
      if (cancelled) return
      const list: ThemeRow[] = t?.themes || []
      setThemes(list)
      setDomains(d?.domains || [])
      setSite((cur) => {
        if (cur && list.some((x) => x.id === cur)) return cur
        let saved = ''
        try { saved = localStorage.getItem(KEY) || '' } catch {}
        return list.some((x) => x.id === saved) ? saved : pickSite(list)
      })
    })
    return () => { cancelled = true }
  }, [enabled, n])

  const setSiteId = useCallback((id: string) => {
    setSite(id)
    try { localStorage.setItem(KEY, id) } catch {}
  }, [])
  const reload = useCallback(() => setN((x) => x + 1), [])

  return useMemo(() => ({ themes, domains, siteId, setSiteId, reload }), [themes, domains, siteId, setSiteId, reload])
}

export const SiteCtx = createContext<AccountSites | null>(null)

/** For a page: the account's sites and the current one. Null outside the shell. */
export function useSite(): AccountSites | null {
  return useContext(SiteCtx)
}
