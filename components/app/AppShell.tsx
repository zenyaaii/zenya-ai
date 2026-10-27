'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useT } from '@/components/i18n/LocaleProvider'
import TopTools from './TopTools'
import { ReportProblem } from './ReportProblem'
import WelcomeTour from './WelcomeTour'
import { DASHBOARD_CSS } from './dashboard-style'
import { dashFont } from './dash-font'
import DashFrame from './frame/DashFrame'
import { PAGE_ROUTE, buildNav, pageFor } from './frame/nav'
import { useDashboardPath } from './useDashboardPath'

/**
 * Logged-in app surface.
 *
 * Auth gate: if no session, bounces to /login?next=<current>.
 * Layout: DashFrame — a side rail on a laptop, a top bar, and on a phone a
 * dock at the bottom with a "More" sheet. The document scrolls at every
 * width, so pinch-zoom pans and the rail stays put by being fixed.
 *
 * Palette and faces: DASHBOARD_CSS, which ends with the Beynoun theme
 * (dash-theme.ts) — cream and ink, a dark version, Thmanyah when the device
 * has it and Amiri / Markazi Text when it does not.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const t = useT()
  const { pathname, linkTo } = useDashboardPath()
  const [user, setUser] = useState<any>(null)
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
    }
    check()
    return () => { cancelled = true }
  }, [router, supabase])

  // A page change closes the More sheet.
  useEffect(() => { setMoreOpen(false) }, [pathname])

  if (!authChecked) {
    return (
      <div className={`zy-app ${dashFont.variable} flex min-h-screen items-center justify-center text-[var(--stone)]`}>
        <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
        Loading…
      </div>
    )
  }

  const current = pageFor(pathname)
  const groups = buildNav(t, current, (k) => ({ href: linkTo(PAGE_ROUTE[k]) }))
  const title = pathname.startsWith('/dashboard/admin')
    ? t.nav.admin
    : groups.flatMap((g) => g.items).find((i) => i.active)?.label || t.nav.dashboard

  return (
    <div className={`zy-app ${dashFont.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      <DashFrame
        groups={groups}
        title={title}
        homeHref={linkTo('/dashboard')}
        newSite={{ href: '/theme/new' }}
        tools={<TopTools user={user} />}
        foot={<ReportProblem />}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
      >
        <main>{children}</main>
      </DashFrame>

      {/* First-visit tour. It sits on the shell, not a page, because it points
          at the shell's own controls and has to open the phone sheet. */}
      <WelcomeTour setDrawer={setMoreOpen} />
    </div>
  )
}
