'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Menu, Plus, Bell, ChevronDown,
  LayoutDashboard, Settings, LogOut,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

/** Map known dashboard routes to a page title. Fallback is the last segment. */
const TITLES: Record<string, string> = {
  '/dashboard':            'Home',
  '/dashboard/sites':      'Sites',
  '/dashboard/analytics':  'Analytics',
  '/dashboard/visitors':   'Visitors',
  '/dashboard/seo':        'SEO',
  '/dashboard/domains':    'Domains',
  '/dashboard/billing':    'Billing',
  '/dashboard/settings':   'Settings',
}

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]
  // /dashboard/sites/abc → "Sites"
  for (const path of Object.keys(TITLES)) {
    if (path !== '/dashboard' && pathname.startsWith(path)) return TITLES[path]
  }
  return 'Dashboard'
}

const DROPDOWN_EASE = [0.22, 1, 0.36, 1] as const

export default function Topbar({
  user, onMobileMenuOpen,
}: {
  user: { id: string; email?: string | null; user_metadata?: any } | null
  onMobileMenuOpen: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const title = titleFor(pathname)
  const fullName = user?.user_metadata?.full_name as string | undefined
  const firstName = fullName?.split(' ')[0]
  const email = user?.email || ''
  const initial = (firstName || email)[0]?.toUpperCase() || '?'

  async function signOut() {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('zenya_email')
      localStorage.removeItem('zenya_last_email')
    } catch {}
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between border-b border-token bg-white px-4"
      style={{ boxShadow: '0 1px 0 #f0ede6' }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="rounded-md p-1.5 text-muted hover:bg-black/5 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick action — New site */}
        <Link
          href="/theme/new"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02]"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          <span className="hidden sm:inline">New site</span>
        </Link>

        {/* Notifications — placeholder, no inbox yet */}
        <button
          type="button"
          className="relative hidden rounded-md p-1.5 text-muted hover:bg-black/5 sm:block"
          aria-label="Notifications"
          title="No new notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Profile dropdown */}
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 rounded-md border border-token bg-white px-2 py-1.5 transition-colors hover:bg-black/[0.04]"
              aria-label="Account menu"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: '#5e6ad2' }}
              >
                {initial}
              </div>
              <span className="hidden text-[12.5px] font-medium text-foreground sm:block">
                {firstName || 'Account'}
              </span>
              <ChevronDown className="hidden h-3 w-3 text-muted sm:block" strokeWidth={2.5} />
            </button>
          </DropdownMenu.Trigger>

          <AnimatePresence>
            {menuOpen && (
              <DropdownMenu.Portal forceMount>
                <DropdownMenu.Content
                  asChild
                  forceMount
                  align="end"
                  sideOffset={6}
                  className="z-50"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: DROPDOWN_EASE }}
                    className="w-56 overflow-hidden rounded-xl border border-token bg-white p-1.5"
                    style={{ boxShadow: '0 8px 24px rgba(28,28,28,0.10), 0 0 0 1px #e5e2d9' }}
                  >
                    <div className="mb-1 px-2.5 py-2" style={{ borderBottom: '1px solid #f0ede6' }}>
                      <p className="text-[13px] font-semibold text-foreground">
                        {fullName || 'Your account'}
                      </p>
                      <p className="truncate text-[12px] text-muted">{email}</p>
                    </div>

                    <DropdownMenu.Item asChild>
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted outline-none transition-colors data-[highlighted]:bg-[rgba(28,28,28,0.05)] data-[highlighted]:text-foreground"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} />
                        Home
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted outline-none transition-colors data-[highlighted]:bg-[rgba(28,28,28,0.05)] data-[highlighted]:text-foreground"
                      >
                        <Settings className="h-3.5 w-3.5" strokeWidth={2} />
                        Settings
                      </Link>
                    </DropdownMenu.Item>

                    <div className="mt-1 border-t border-[#f0ede6] pt-1">
                      <DropdownMenu.Item asChild>
                        <button
                          onClick={signOut}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#dc2626] outline-none transition-colors data-[highlighted]:bg-[rgba(220,38,38,0.06)]"
                        >
                          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                          Sign out
                        </button>
                      </DropdownMenu.Item>
                    </div>
                  </motion.div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            )}
          </AnimatePresence>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
