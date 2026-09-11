'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { DASHBOARD_CSS } from './dashboard-style'
import { chromeFont } from './chrome-font'

/**
 * Logged-in app surface.
 *
 * Auth gate: if no session, bounces to /login?next=<current>.
 * Layout: a rail (desktop) + drawer (mobile) + topbar + scrollable content.
 *
 * Ground: flat #fafafa - the house ground, shared with the five candidate
 * pages at demo.zenyaai.co. It replaces the old #f7f4ed marketing cream,
 * which was the single biggest visual break between this surface and the
 * rest of Zenya. See components/app/dashboard-style.ts for the whole
 * token layer and the reasoning behind each value.
 */


export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-[#56565a]">
        <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
        Loading…
      </div>
    )
  }

  /*
   * Shell height/scroll is deliberately responsive:
   *
   * Desktop (lg+) keeps the classic app frame — the shell is exactly one screen
   * tall and only <main> scrolls, so the sidebar stays put.
   *
   * Phones/tablets must NOT do that. A root that is `h-screen overflow-hidden`
   * cannot be panned once the reader pinch-zooms in: the content they zoomed
   * toward is unreachable, so they have to zoom back out to see the page at all.
   * On small screens the document itself scrolls (min-h, no clipping) and
   * pinch-zoom pans anywhere, the way any normal web page behaves.
   *
   * THE FRAME, lg+ ONLY: the shell gains a small gutter and the rail and the
   * work surface become two panels floating on the ground, each on the ring
   * token. That is the house language — objects on bare paper — applied to a
   * shell, and it is what stops this reading as the same edge-to-edge chrome
   * every dashboard ships with. Below lg the gutter, the radii and the rings
   * are all off (see the @media in dashboard-style.ts): on a phone a panel
   * inset from both edges only narrows an already narrow measure, and the
   * document-scroll behaviour above stays exactly as it was.
   */
  return (
    <div
      className={`zy-app ${chromeFont.variable} flex min-h-[100dvh] lg:h-screen lg:gap-2 lg:overflow-hidden lg:p-2`}
    >
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      {/* The base-UI zoom cap now lives globally in the root layout (ZoomLock),
          so it covers the marketing site too — not just this dashboard. */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="zy-pane flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <Topbar user={user} onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
