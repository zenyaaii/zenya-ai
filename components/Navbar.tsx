"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('zenya_email')
    localStorage.removeItem('zenya_last_email')
    setUser(null)
    setDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  // Navigation Items Logic
  const guestNav = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/demo', label: 'Demo' },
  ]

  const userNav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/theme/new', label: 'New Theme' },
  ]

  const navItems = user ? userNav : guestNav

  return (
    <header className="sticky top-0 z-50 glass-panel border-b-0 border-b-white/0">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-primary/10 transition-transform group-hover:scale-105">
                <Image src="/logo.png" alt="Zenya Logo" fill className="object-cover" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-primary bg-clip-text text-transparent">Zenya</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 rounded-full border border-token bg-surface/50 p-1 backdrop-blur-sm">
              {navItems.map(item => {
                const active = pathname === item.href
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                      active 
                        ? 'bg-elevated shadow-sm text-foreground' 
                        : 'text-muted hover:text-foreground hover:bg-surface'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-full bg-slate-200"></div>
            ) : !user ? (
              <>
                <Link href="/login" className="hidden sm:block rounded-full border border-token px-4 py-2 text-sm font-medium transition ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-surface">Log in</Link>
                <Link href="/login?mode=signup" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-soft-md transition ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 hover:shadow-lg">Sign Up</Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-token bg-surface p-1 pr-4 transition hover:bg-elevated hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground max-w-[100px] truncate hidden sm:block">
                    {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-token bg-white p-2 shadow-xl"
                    >
                      <div className="mb-2 px-3 py-2 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Link 
                          href="/dashboard" 
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                          Dashboard
                        </Link>
                        <Link 
                          href="/settings" 
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          Settings
                        </Link>
                      </div>

                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <button 
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
