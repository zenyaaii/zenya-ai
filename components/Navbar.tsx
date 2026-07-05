'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LayoutDashboard, Settings, LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import ZenyaMark from '@/components/ZenyaMark'

type NavItem = { href: string; label: string }

const GUEST_NAV: NavItem[] = [
  { href: '/',         label: 'الرئيسية' },
  { href: '/features', label: 'الميزات'  },
  { href: '/themes',   label: 'القوالب'  },
  { href: '/pricing',  label: 'الأسعار'  },
  { href: '/compare',  label: 'المقارنات' },
]

const USER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم' },
  { href: '/themes',    label: 'القوالب'     },
]

const DROPDOWN_EASE = [0.22, 1, 0.36, 1] as const

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  /* ── Auth subscription ── */
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(session?.user || null)
      setLoading(false)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  /* ── Scroll-aware glass ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Auto-close mobile menu on route change ── */
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('zenya_email')
      localStorage.removeItem('zenya_last_email')
    } catch { /* ignore storage errors (private mode, etc.) */ }
    setUser(null)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const navItems = user ? USER_NAV : GUEST_NAV
  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '؟'
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'الحساب'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        'backdrop-blur-[20px] backdrop-saturate-[160%]'
      )}
      style={{
        background: scrolled ? 'rgba(247,244,237,0.95)' : 'rgba(247,244,237,0.72)',
        borderBottom: scrolled ? '1px solid #e5e2d9' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 0 #e5e2d9' : 'none',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* ── Brand — logged-in users land in the dashboard;
                 guests stay on the marketing site ── */}
          <Link
            href={user ? '/dashboard' : '/'}
            className="group flex items-center"
            aria-label={user ? 'الذهاب إلى لوحة التحكم' : 'الصفحة الرئيسية لزينيا'}
          >
            <ZenyaMark className="h-5 text-[#16171b] transition-transform duration-200 group-hover:scale-[1.03]" />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-md px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-150',
                    active ? 'text-foreground' : 'text-muted hover:text-foreground'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md bg-[rgba(28,28,28,0.06)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-[rgba(28,28,28,0.06)]" />
            ) : !user ? (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-md px-3.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:text-foreground sm:block"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-md bg-primary px-4 py-2 text-[13.5px] font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98] btn-shadow-primary"
                >
                  ابدأ الآن
                </Link>
              </>
            ) : (
              <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="hidden items-center gap-2 rounded-md border border-token px-2.5 py-1.5 transition-colors hover:bg-[rgba(28,28,28,0.05)] md:flex"
                    aria-label="فتح قائمة الحساب"
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{ background: '#5e6ad2' }}
                    >
                      {userInitial}
                    </div>
                    <span
                      className="hidden text-[13px] font-medium text-foreground sm:block max-w-[80px] truncate"
                    >
                      {userName}
                    </span>
                    <motion.span
                      animate={{ rotate: menuOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-muted"
                    >
                      <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
                    </motion.span>
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
                          className="w-56 overflow-hidden rounded-xl border border-token bg-white p-1.5 shadow-soft-lg"
                          style={{
                            boxShadow:
                              '0 8px 24px rgba(28,28,28,0.10), 0 0 0 1px #e5e2d9',
                          }}
                        >
                          <DropdownMenu.Label className="mb-1 px-2.5 py-2" style={{ borderBottom: '1px solid #f0ede6' }}>
                            <p className="text-[13px] font-semibold text-foreground">
                              {user.user_metadata?.full_name || 'مستخدم'}
                            </p>
                            <p className="truncate text-[12px] text-muted">{user.email}</p>
                          </DropdownMenu.Label>

                          <div className="space-y-0.5">
                            <DropdownMenuLink href="/dashboard" icon={LayoutDashboard} label="لوحة التحكم" onSelect={() => setMenuOpen(false)} />
                            <DropdownMenuLink href="/settings"  icon={Settings}         label="الإعدادات"  onSelect={() => setMenuOpen(false)} />
                          </div>

                          <div className="mt-1 border-t border-[#f0ede6] pt-1">
                            <DropdownMenu.Item asChild>
                              <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#dc2626] outline-none transition-colors data-[highlighted]:bg-[rgba(220,38,38,0.06)]"
                              >
                                <LogOut className="h-3.5 w-3.5 rtl-flip" strokeWidth={2} />
                                تسجيل الخروج
                              </button>
                            </DropdownMenu.Item>
                          </div>
                        </motion.div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  )}
                </AnimatePresence>
              </DropdownMenu.Root>
            )}

            {/* ── Mobile burger ── */}
            <button
              className="flex items-center justify-center rounded-md p-2 text-muted transition-colors hover:bg-[rgba(28,28,28,0.05)] md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex"
                  >
                    <Menu className="h-5 w-5" strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: DROPDOWN_EASE }}
              className="overflow-hidden md:hidden"
            >
              <nav className="mt-3 flex flex-col gap-0.5 border-t border-[#f0ede6] pb-4 pt-3">
                {navItems.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors',
                        active
                          ? 'bg-[rgba(28,28,28,0.05)] text-foreground'
                          : 'text-muted hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 rounded-md border border-token px-4 py-3 text-center text-[14px] font-medium text-foreground transition-colors hover:bg-[rgba(28,28,28,0.04)]"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      href="/login?mode=signup"
                      onClick={() => setMobileOpen(false)}
                      className="mt-1.5 rounded-md bg-primary px-4 py-3 text-center text-[14px] font-semibold text-white btn-shadow-primary"
                    >
                      ابدأ مجانًا
                    </Link>
                  </>
                ) : (
                  <div className="mt-2 border-t border-[#f0ede6] pt-2">
                    {/* Account block — folded into the menu on mobile so the
                        header stays just logo + menu. */}
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                        style={{ background: '#5e6ad2' }}
                      >
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {user.user_metadata?.full_name || 'مستخدم'}
                        </p>
                        <p className="truncate text-[12px] text-muted">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-[14px] font-medium text-muted transition-colors hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" strokeWidth={2} />
                      الإعدادات
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-start text-[14px] font-medium text-[#dc2626] transition-colors hover:bg-[rgba(220,38,38,0.06)]"
                    >
                      <LogOut className="h-4 w-4 rtl-flip" strokeWidth={2} />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

/**
 * DropdownMenuLink — small helper that wraps a Next Link inside a
 * Radix DropdownMenu.Item with consistent styling. Keeping it local since
 * it's only used here and tightly coupled to the menu's visual language.
 */
function DropdownMenuLink({
  href,
  icon: Icon,
  label,
  onSelect,
}: {
  href: string
  icon: LucideIcon
  label: string
  onSelect: () => void
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        onClick={onSelect}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted outline-none transition-colors data-[highlighted]:bg-[rgba(28,28,28,0.05)] data-[highlighted]:text-foreground"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </Link>
    </DropdownMenu.Item>
  )
}
