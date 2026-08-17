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
import { useT } from '@/components/i18n/LocaleProvider'
import LanguageSwitcher from '@/components/marketing/LanguageSwitcher'
import type { Messages } from '@/lib/i18n/messages'

/** Map known dashboard routes to a page title, in the active locale. */
function titlesFor(t: Messages): Record<string, string> {
  return {
    '/dashboard':            t.nav.home,
    '/dashboard/sites':      t.nav.sites,
    '/dashboard/analytics':  t.nav.analytics,
    '/dashboard/admin':      t.nav.admin,
    '/dashboard/seo':        t.nav.seo,
    '/dashboard/domains':    t.nav.domains,
    '/dashboard/billing':    t.nav.billing,
    '/dashboard/settings':   t.nav.settings,
  }
}

function titleFor(pathname: string, t: Messages): string {
  const titles = titlesFor(t)
  if (titles[pathname]) return titles[pathname]
  // /dashboard/sites/abc → "Sites"
  for (const path of Object.keys(titles)) {
    if (path !== '/dashboard' && pathname.startsWith(path)) return titles[path]
  }
  return t.nav.dashboard
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
  const t = useT()

  const title = titleFor(pathname, t)
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

  // Sticky on phones/tablets, where the document (not <main>) scrolls — without
  // this the bar scrolls away and the menu becomes unreachable. On lg+ the shell
  // is fixed-height so it stays put anyway.
  return (
    <header
      className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center justify-between border-b border-token bg-white px-4 lg:static"
      style={{ boxShadow: '0 1px 0 #f0ede6' }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="rounded-md p-1.5 text-muted hover:bg-black/5 lg:hidden"
          aria-label={t.nav.openMenu}
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
          <span className="hidden sm:inline">{t.nav.newSite}</span>
        </Link>

        {/* Language. Flips the locale in place rather than navigating, so the
            user keeps whatever page and state they were on. */}
        <LanguageSwitcher variant="inline" className="hidden sm:inline-flex" />

        {/* Notifications — placeholder, no inbox yet */}
        <button
          type="button"
          className="relative hidden rounded-md p-1.5 text-muted hover:bg-black/5 sm:block"
          aria-label={t.nav.notifications}
          title={t.nav.noNotifications}
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Profile dropdown */}
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 rounded-md border border-token bg-white px-2 py-1.5 transition-colors hover:bg-black/[0.04]"
              aria-label={t.nav.accountMenu}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: '#5e6ad2' }}
              >
                {initial}
              </div>
              <span className="hidden text-[12.5px] font-medium text-foreground sm:block">
                {firstName || t.nav.account}
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
                        {fullName || t.nav.yourAccount}
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
                        {t.nav.home}
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted outline-none transition-colors data-[highlighted]:bg-[rgba(28,28,28,0.05)] data-[highlighted]:text-foreground"
                      >
                        <Settings className="h-3.5 w-3.5" strokeWidth={2} />
                        {t.nav.settings}
                      </Link>
                    </DropdownMenu.Item>

                    <div className="mt-1 border-t border-[#f0ede6] pt-1">
                      <DropdownMenu.Item asChild>
                        <button
                          onClick={signOut}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#dc2626] outline-none transition-colors data-[highlighted]:bg-[rgba(220,38,38,0.06)]"
                        >
                          <LogOut className="h-3.5 w-3.5 rtl-flip" strokeWidth={2} />
                          {t.accounts.signOut}
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
