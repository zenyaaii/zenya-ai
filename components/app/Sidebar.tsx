'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home, Folder, BarChart3, Users, Search, Globe,
  CreditCard, Settings, X, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Optional sub-label rendered as a small pill (e.g. "Soon") */
  pill?: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard',            label: 'Home',       icon: Home },
      { href: '/dashboard/sites',      label: 'Sites',      icon: Folder },
      { href: '/dashboard/analytics',  label: 'Analytics',  icon: BarChart3 },
      { href: '/dashboard/visitors',   label: 'Visitors',   icon: Users, pill: 'Soon' },
      { href: '/dashboard/seo',        label: 'SEO',        icon: Search },
      { href: '/dashboard/domains',    label: 'Domains',    icon: Globe },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/billing',  label: 'Billing',  icon: CreditCard },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
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

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const body = (
    <>
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex h-14 items-center gap-2 border-b border-token px-4"
        onClick={onMobileClose}
      >
        <div
          className="relative h-7 w-7 overflow-hidden rounded-lg"
          style={{
            background: '#5e6ad2',
            boxShadow: 'rgba(255,255,255,0.20) 0px 0.5px 0px inset, rgba(94,106,210,0.35) 0px 0px 0px 0.5px inset',
          }}
        >
          <Image src="/logo.png" alt="Zenya" fill className="object-cover" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">Zenya</span>
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
          ← Back to marketing site
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — always visible at lg+ */}
      <aside
        className="hidden w-60 flex-shrink-0 flex-col border-r border-token bg-white lg:flex"
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
            className="absolute left-0 top-0 flex h-full w-60 flex-col border-r border-token bg-white"
            style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.10)' }}
          >
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-muted hover:bg-black/5"
              aria-label="Close menu"
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
