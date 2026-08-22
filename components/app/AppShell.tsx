'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * Logged-in app surface.
 *
 * Auth gate: if no session, bounces to /login?next=<current>.
 * Layout: sidebar (desktop) + drawer (mobile) + topbar + scrollable content.
 * Background: cream — matches the marketing palette so the brand still feels
 * coherent, but no Navbar/Footer marketing chrome.
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
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
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
   */
  return (
    <div className="flex min-h-[100dvh] bg-[#f7f4ed] lg:h-screen lg:overflow-hidden">
      {/* The base-UI zoom cap now lives globally in the root layout (ZoomLock),
          so it covers the marketing site too — not just this dashboard. */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <Topbar user={user} onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
