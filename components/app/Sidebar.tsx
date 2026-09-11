'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Home, Folder, BarChart3, Search, Globe, Image as ImageIcon,
  CreditCard, Settings, X, CalendarCheck, type LucideIcon,
} from 'lucide-react'
import ZenyaMark from '@/components/ZenyaMark'
import { useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Optional sub-label rendered as a small pill (e.g. "Soon") */
  pill?: string
  /** Slug used by the welcome spotlight tour to target this row */
  tour?: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

/** Labels come from the active locale, so the nav is built per render. */
function buildNav(t: Messages): NavGroup[] {
  return [
    {
      label: t.nav.workspace,
      items: [
        { href: '/dashboard',            label: t.nav.home,      icon: Home,          tour: 'home' },
        { href: '/dashboard/sites',      label: t.nav.sites,     icon: Folder,        tour: 'sites' },
        { href: '/dashboard/gallery',    label: t.nav.gallery,   icon: ImageIcon },
        { href: '/dashboard/analytics',  label: t.nav.analytics, icon: BarChart3,     tour: 'analytics' },
        { href: '/dashboard/bookings',   label: t.nav.bookings,  icon: CalendarCheck, tour: 'bookings' },
        { href: '/dashboard/seo',        label: t.nav.seo,       icon: Search,        tour: 'seo' },
        { href: '/dashboard/domains',    label: t.nav.domains,   icon: Globe,         tour: 'domains' },
      ],
    },
    {
      label: t.nav.account,
      items: [
        { href: '/dashboard/billing',  label: t.nav.billing,  icon: CreditCard },
        { href: '/dashboard/settings', label: t.nav.settings, icon: Settings },
      ],
    },
  ]
}

export default function Sidebar({
  mobileOpen, onMobileClose,
}: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useT()
  const NAV = buildNav(t)

  /**
   * Analytics and Visitors are the same route now, separated only by ?tab —
   * so a path-only check would light both rows at once. When a nav href
   * carries a query, the current tab has to match it too.
   */
  function isActive(href: string) {
    const [path, query] = href.split('?')
    if (path === '/dashboard' && !query) return pathname === '/dashboard'

    const pathMatches = pathname === path || pathname.startsWith(path + '/')
    if (!pathMatches) return false

    const currentTab = searchParams.get('tab')
    const wantedTab = query ? new URLSearchParams(query).get('tab') : null
    return wantedTab ? currentTab === wantedTab : !currentTab
  }

  const body = (
    <>
      {/* Logo */}
      <Link href="/dashboard" className="zy-rail-mark" onClick={onMobileClose}>
        <ZenyaMark className="h-[18px] text-[#171717]" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'zy-rail-group mt-5' : 'zy-rail-group'}>
            <div className="zy-rail-label">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    data-tour={item.tour}
                    className="zy-rail-row"
                    data-on={active ? '' : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className="h-[15px] w-[15px] flex-shrink-0"
                      strokeWidth={active ? 2.25 : 1.9}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.pill && (
                      <span className="zy-pill" data-tone="quiet">
                        {item.pill}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Foot — small marketing link out */}
      <div className="zy-rail-foot">
        {/* Dashboard runs on dashboard.zenyaai.co, so this must be the absolute
            apex URL. ?home=1 tells the apex NOT to bounce a logged-in user back
            to accounts/dashboard — they explicitly want to see the marketing site. */}
        <a href="https://zenyaai.co/?home=1" onClick={onMobileClose}>
          → العودة إلى الموقع التسويقي
        </a>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — always visible at lg+ */}
      <aside className="zy-pane hidden w-[236px] flex-shrink-0 flex-col lg:flex">
        {body}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside
            className="absolute start-0 top-0 flex h-full w-[236px] flex-col bg-white"
            style={{ boxShadow: '0 0 0 1px rgba(17,17,17,0.10)' }}
          >
            <button
              type="button"
              onClick={onMobileClose}
              className="zy-icon-btn absolute end-2 top-2 z-10 inline-flex"
              aria-label={t.nav.closeMenu}
            >
              <X className="h-4 w-4" />
            </button>
            {body}
          </aside>
        </div>
      )}
    </>
  )
}
