'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useT } from '@/components/i18n/LocaleProvider'
import { asPlan, PLAN_LABEL } from '@/components/dashboard/plans'
import TopTools from './TopTools'
import { DASHBOARD_CSS } from './dashboard-style'
import { dashFont } from './dash-font'
import Frame from './v6/Frame'
import { SiteCtx, frameSites, useAccountSites } from './v6/site'
import DashIntro from './intro/DashIntro'
import { PAGE_ROUTE, buildPages, pageFor, type PageKey } from './frame/nav'
import { useDashboardPath } from './useDashboardPath'
import './v6/v6.css'
import './v6/v6-frame.css'

/**
 * Logged-in app surface.
 *
 * Auth gate: if no session, bounces to /login?next=<current>.
 * Layout: the v6 design's frame (v6/Frame) — the side menu on a laptop, the
 * top bar with the site switcher, and on a phone a dock at the bottom with a
 * "More" sheet. The design's own stylesheet (v6/v6.css) draws it.
 *
 * The shell also owns the current site (v6/site): the switcher sets it, and
 * Home and Analytics read it, so every page is about the same site.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const t = useT()
  const { pathname, linkTo } = useDashboardPath()
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<{ label: string; tone: 'ok' | 'acc' | '' } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        const here = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
        router.push(`/login?next=${encodeURIComponent(here)}`)
        return
      }
      setUser(user)
      setAuthChecked(true)
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle()
      if (cancelled) return
      const p = asPlan((profile as any)?.plan)
      setPlan(p === 'free' || p === 'entry' ? { label: 'مجانية', tone: '' } : { label: PLAN_LABEL[p], tone: 'ok' })
    }
    check()
    return () => { cancelled = true }
  }, [router, supabase])

  const sites = useAccountSites(authChecked)
  const { siteId } = sites

  // The badges: bookings waiting on the current site, and its unseen Google reviews.
  const [counts, setCounts] = useState<{ bookings?: number; reviews?: number }>({})
  useEffect(() => {
    if (!authChecked || !siteId) return
    let cancelled = false
    Promise.all([
      supabase.from('site_bookings').select('id', { count: 'exact', head: true })
        .eq('theme_id', siteId).eq('is_bot', false).eq('status', 'new')
        .then((r) => r.count || 0, () => 0),
      fetch('/api/reviews/new').then((r) => (r.ok ? r.json() : { sites: [] })).catch(() => ({ sites: [] })),
    ]).then(([b, rv]) => {
      if (cancelled) return
      const mine = (rv?.sites || []).find((s: { id: string }) => s.id === siteId)
      setCounts({ bookings: b, reviews: mine?.count || 0 })
    })
    return () => { cancelled = true }
  }, [authChecked, siteId, pathname, supabase])

  // A page change closes the More sheet.
  useEffect(() => { setMoreOpen(false) }, [pathname])

  const go = useCallback((to: string) => {
    const [page, tab] = to.split(':')
    const route = PAGE_ROUTE[page as PageKey] || '/dashboard'
    router.push(linkTo(route) + (tab ? `?tab=${tab}` : ''))
  }, [router, linkTo])

  if (!authChecked) {
    return (
      <div className={`zy-app ${dashFont.variable} flex min-h-screen items-center justify-center text-[var(--stone)]`}>
        <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
        Loading…
      </div>
    )
  }

  const current = pageFor(pathname)
  const pages = buildPages(t, current, (k) => ({ href: linkTo(PAGE_ROUTE[k]) }), counts)
  const title = pathname.startsWith('/dashboard/admin')
    ? t.nav.admin
    : pages.find((p) => p.active)?.label || t.nav.dashboard
  // Every page in the menu is drawn in the v6 design's own markup; only the
  // admin screen is older and brings its own gutters.
  const v6Page = current !== null

  return (
    <div className={`zy-app ${dashFont.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      <SiteCtx.Provider value={sites}>
        <Frame
          pages={pages}
          title={title}
          home={{ href: linkTo('/dashboard') }}
          newSite={{ href: '/theme/new' }}
          sites={frameSites(sites.themes, sites.domains)}
          siteId={siteId}
          onSite={sites.setSiteId}
          go={go}
          tools={<TopTools user={user} plan={plan} />}
          help={{ email: user?.email || '' }}
          moreOpen={moreOpen}
          setMoreOpen={setMoreOpen}
          legacy={!v6Page}
          pageKey={pathname}
        >
          {children}
        </Frame>
      </SiteCtx.Provider>

      {/* The dashboard tour, once per account. It sits on the shell, not a
          page, because it points at the shell's own controls and has to open
          the phone sheet. */}
      <DashIntro setMore={setMoreOpen} persist />
    </div>
  )
}
