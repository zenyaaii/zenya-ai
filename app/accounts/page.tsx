'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, ArrowRight, UserPlus } from 'lucide-react'
import Link from 'next/link'
import ZenyaMark from '@/components/ZenyaMark'
import { createClient } from '@/utils/supabase/client'
import { dashboardUrl } from '@/lib/portal-urls'

/**
 * Account chooser — the landing page of accounts.zenyaai.co.
 *
 *  • Signed in  → "continue as <account>" card (name + avatar) → dashboard,
 *    plus "use another account" and "sign out".
 *  • Signed out → hop to the login card.
 */
export default function AccountsChooserPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        // No session → straight to the login card.
        window.location.replace('/login')
        return
      }
      setUser(user)
      setChecking(false)
    })()
    return () => { mounted = false }
  }, [supabase])

  async function signOut() {
    setLeaving(true)
    try { await supabase.auth.signOut() } catch {}
    try {
      localStorage.removeItem('zenya_email')
      localStorage.removeItem('zenya_last_email')
    } catch {}
    window.location.replace('/login')
  }

  if (checking) {
    return (
      <div
        className="flex h-[360px] w-full max-w-md items-center justify-center rounded-3xl"
        style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.6)' }}
      >
        <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  const name = user?.user_metadata?.full_name || 'مستخدم زينيا'
  const email = user?.email || ''
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initial = (name?.charAt(0) || email.charAt(0) || '؟').toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md rounded-3xl p-8 sm:p-10"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.8) inset, 0 24px 70px -20px rgba(28,28,28,0.28), 0 0 0 1px rgba(94,106,210,0.06)',
      }}
    >
      <div className="mb-7 text-center">
        <div className="mb-6 inline-flex">
          <ZenyaMark className="h-6 text-[#16171b]" />
        </div>
        <h1 className="mb-1.5 text-[24px] font-semibold tracking-tight text-foreground" style={{ letterSpacing: '-0.02em' }}>
          اختر حسابك
        </h1>
        <p className="text-[13.5px] text-muted">تابع إلى لوحة التحكم بالحساب الذي تريده.</p>
      </div>

      {/* Continue-as card */}
      <motion.a
        href={dashboardUrl()}
        whileHover={{ y: -2 }}
        className="flex items-center gap-3 rounded-2xl border border-token bg-white/80 p-3.5 text-start transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(94,106,210,0.5)]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #5e6ad2 0%, #4954c9 100%)' }}
          >
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-foreground">{name}</div>
          <div dir="ltr" className="truncate text-start text-[12.5px] text-muted">{email}</div>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary rtl-flip" strokeWidth={2.5} />
      </motion.a>

      <div className="mt-3 space-y-1.5">
        <Link
          href="/login"
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-muted transition-colors hover:bg-[rgba(28,28,28,0.04)] hover:text-foreground"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2} />
          الدخول بحساب آخر
        </Link>
        <button
          onClick={signOut}
          disabled={leaving}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-start text-[13.5px] font-medium text-[#dc2626] transition-colors hover:bg-[rgba(220,38,38,0.06)] disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 rtl-flip" strokeWidth={2} />
          {leaving ? 'جارٍ تسجيل الخروج…' : 'تسجيل الخروج'}
        </button>
      </div>
    </motion.div>
  )
}
