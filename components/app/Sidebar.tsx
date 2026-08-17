'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Home, Folder, BarChart3, Search, Globe, Image as ImageIcon,
  CreditCard, Settings, X, CalendarCheck, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ZenyaMark from '@/components/ZenyaMark'

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

const NAV: NavGroup[] = [
  {
    label: 'مساحة العمل',
    items: [
      { href: '/dashboard',            label: 'الرئيسية',  icon: Home,          tour: 'home' },
      { href: '/dashboard/sites',      label: 'المواقع',   icon: Folder,        tour: 'sites' },
      { href: '/dashboard/gallery',    label: 'المعرض',    icon: ImageIcon },
      { href: '/dashboard/analytics',  label: 'التحليلات', icon: BarChart3,     tour: 'analytics' },
      { href: '/dashboard/bookings',   label: 'الحجوزات',  icon: CalendarCheck, tour: 'bookings' },
      { href: '/dashboard/seo',        label: 'السيو',     icon: Search,        tour: 'seo' },
      { href: '/dashboard/domains',    label: 'النطاقات',  icon: Globe,         tour: 'domains' },
    ],
  },
  {
    label: 'الحساب',
    items: [
      { href: '/dashboard/billing',  label: 'الفوترة',    icon: CreditCard },
      { href: '/dashboard/settings', label: 'الإعدادات',  icon: Settings },
    ],
  },
]

export default function Sidebar({
  mobileOpen, onMobileClose,
}: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
      <Link
        href="/dashboard"
        className="flex h-14 items-center border-b border-token px-4"
        onClick={onMobileClose}
      >
        <ZenyaMark className="h-5 text-[#16171b]" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-6' : ''}>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
              {group.label}
            </div>
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
                    className={cn(
                      'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors duration-150',
                      active
                        ? 'bg-[rgba(94,106,210,0.10)] text-primary'
                        : 'text-muted hover:bg-[rgba(28,28,28,0.04)] hover:text-foreground'
                    )}
                  >
                    <Icon
                      className="h-3.5 w-3.5 flex-shrink-0"
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.pill && (
                      <span className="rounded-full bg-[rgba(28,28,28,0.06)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-muted">
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
      <div className="border-t border-token p-3 text-[11.5px] text-muted">
        <Link href="/" className="hover:text-foreground" onClick={onMobileClose}>
          → العودة إلى الموقع التسويقي
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — always visible at lg+ */}
      <aside
        className="hidden w-60 flex-shrink-0 flex-col border-e border-token bg-white lg:flex"
        style={{ boxShadow: '1px 0 0 #f0ede6' }}
      >
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
            className="absolute start-0 top-0 flex h-full w-60 flex-col border-e border-token bg-white"
            style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.10)' }}
          >
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute end-2 top-2 z-10 rounded-md p-1.5 text-muted hover:bg-black/5"
              aria-label="إغلاق القائمة"
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
