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

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f4ed]">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
