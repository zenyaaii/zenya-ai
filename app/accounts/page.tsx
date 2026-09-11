'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
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
  const t = useT()

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
      <div className="zn-card zn-checking">
        <svg className="zn-spin" width="22" height="22" fill="none" viewBox="0 0 24 24" aria-label="جارٍ التحقق">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  const name = user?.user_metadata?.full_name || t.accounts.zenyaUser
  const email = user?.email || ''
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initial = (name?.charAt(0) || email.charAt(0) || '؟').toUpperCase()

  return (
    <div className="zn-card">
      <div className="zn-top">
        <div className="zn-mark">
          <ZenyaMark className="h-6" />
        </div>
        <h1 className="zn-h1">{t.accounts.chooseAccount}</h1>
        <p className="zn-sub">{t.accounts.continueToDashboard}</p>
      </div>

      {/* Continue-as card */}
      <a href={dashboardUrl()} className="zn-account">
        <span className="zn-avatar">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" />
          ) : (
            initial
          )}
        </span>
        <span className="zn-account-text">
          <span className="zn-account-name">{name}</span>
          <span dir="ltr" className="zn-account-mail">{email}</span>
        </span>
        <ArrowRight className="zn-account-go rtl-flip" size={16} strokeWidth={2} />
      </a>

      <div className="zn-rows">
        <Link href="/login" className="zn-quiet">
          <UserPlus size={15} strokeWidth={2} />
          {t.accounts.signInAnother}
        </Link>
        {/* #dc2626 is 4.0:1 on white and was under the floor. The house
            danger step is #b91c1c at 6.47:1. */}
        <button onClick={signOut} disabled={leaving} className="zn-quiet zn-quiet-danger">
          <LogOut size={15} strokeWidth={2} className="rtl-flip" />
          {leaving ? t.accounts.signingOut : t.accounts.signOut}
        </button>
      </div>
    </div>
  )
}
