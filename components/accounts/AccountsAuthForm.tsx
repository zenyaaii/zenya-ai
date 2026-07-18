'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, ArrowLeft, LogOut, UserPlus, X } from 'lucide-react'
import Link from 'next/link'
import ZenyaMark from '@/components/ZenyaMark'
import { dashboardUrl } from '@/lib/portal-urls'

type Mode = 'signin' | 'signup' | 'forgot'

/** A previously-used account, remembered locally (email + display name only —
 *  NEVER a password). Powers the one-click account picker. */
type SavedAccount = { email: string; name?: string }

const ACCOUNTS_KEY = 'zenya_accounts'
const MAX_SAVED = 4

function loadSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter((a) => a && typeof a.email === 'string').slice(0, MAX_SAVED)
  } catch {
    return []
  }
}

/** Add/refresh an account at the front of the remembered list (deduped, capped). */
function rememberAccount(acc: SavedAccount) {
  try {
    const existing = loadSavedAccounts().filter(
      (a) => a.email.toLowerCase() !== acc.email.toLowerCase(),
    )
    const next = [acc, ...existing].slice(0, MAX_SAVED)
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next))
  } catch {}
}

function forgetAccount(email: string) {
  try {
    const next = loadSavedAccounts().filter(
      (a) => a.email.toLowerCase() !== email.toLowerCase(),
    )
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next))
  } catch {}
}

function initialsFor(a: SavedAccount): string {
  const src = (a.name || a.email || '?').trim()
  return src.slice(0, 1).toUpperCase()
}

/**
 * The accounts-portal auth card. Same auth logic as the legacy /login page,
 * but headerless, premium-styled, and it lands the user on the dashboard
 * subdomain after success (session is shared via .zenyaai.co cookies).
 */
export default function AccountsAuthForm({ initialMode = 'signin' }: { initialMode?: Mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [mode, setMode] = useState<Mode>(initialMode)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  // ── Saved-login state ──────────────────────────────────────────────────
  // `sessionAccount` = an already-signed-in session on this device (one-click
  // continue). `savedAccounts` = previously-used accounts to quick-pick. When
  // `showForm` is true the user has chosen to type credentials (another
  // account / fresh login) so we bypass the chooser.
  const [sessionAccount, setSessionAccount] = useState<SavedAccount | null>(null)
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([])
  const [showForm, setShowForm] = useState(false)
  const [ready, setReady] = useState(false)
  const [continuing, setContinuing] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    let active = true
    setSavedAccounts(loadSavedAccounts())
    // Prefill the most recent email for the typed-login path.
    try {
      const lastEmail = localStorage.getItem('zenya_last_email')
      if (lastEmail) setEmail(lastEmail)
    } catch {}
    // Is there a live session on this device? If so we can offer one-click.
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      const u = data.user
      if (u?.email) {
        const name = (u.user_metadata?.full_name as string) || undefined
        setSessionAccount({ email: u.email, name })
      }
      setReady(true)
    })
    return () => { active = false }
  }, [supabase])

  /** Persist the just-authenticated account for next time. */
  function persistAccount(userEmail: string, name?: string) {
    try {
      localStorage.setItem('zenya_last_email', userEmail)
      localStorage.setItem('zenya_email', userEmail)
    } catch {}
    rememberAccount({ email: userEmail, name })
  }

  /** One-click: session already valid → straight to the dashboard. */
  function continueToDashboard() {
    setContinuing(true)
    window.location.href = dashboardUrl()
  }

  /** "Not you?" — drop the local session and fall back to the login form. */
  async function switchAccount() {
    setContinuing(true)
    try { await supabase.auth.signOut() } catch {}
    setSessionAccount(null)
    setContinuing(false)
    setShowForm(true)
  }

  /** Quick-pick a remembered account → prefill and focus the password. */
  function pickAccount(acc: SavedAccount) {
    setEmail(acc.email)
    setPassword('')
    setMode('signin')
    setStatus(null)
    setShowForm(true)
    setTimeout(() => {
      const el = document.getElementById('password') as HTMLInputElement | null
      el?.focus()
    }, 60)
  }

  function removeSaved(email: string) {
    forgetAccount(email)
    setSavedAccounts((prev) => prev.filter((a) => a.email.toLowerCase() !== email.toLowerCase()))
  }

  // Show the account chooser (instead of the raw form) when we're in sign-in
  // mode, the user hasn't opted into typing, and we actually have something to
  // offer — a live session or at least one remembered account.
  const showChooser =
    mode === 'signin' &&
    !showForm &&
    (!!sessionAccount || savedAccounts.length > 0)

  const validateEmail = (v: string) => z.string().email().safeParse(v).success
  const validatePassword = (v: string) => v.length >= 6

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    try {
      if (mode === 'forgot') {
        if (!validateEmail(email)) throw new Error('يرجى إدخال بريد إلكتروني صالح.')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) throw error
        setStatus({ type: 'success', message: 'تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك.' })
      } else if (mode === 'signin') {
        if (!email || !password) throw new Error('يرجى تعبئة جميع الحقول.')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const nm = (data.user?.user_metadata?.full_name as string) || undefined
        persistAccount(email, nm)
        window.location.href = dashboardUrl()
      } else {
        if (!fullName) throw new Error('يرجى إدخال اسمك الكامل.')
        if (!validateEmail(email)) throw new Error('يرجى إدخال بريد إلكتروني صالح.')
        if (!validatePassword(password)) throw new Error('يجب ألّا تقلّ كلمة المرور عن 6 أحرف.')
        if (!acceptTerms) throw new Error('يرجى الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(dashboardUrl())}`,
            data: {
              full_name: fullName,
              consent_terms_v: '1',
              consent_terms_at: new Date().toISOString(),
            },
          },
        })
        if (error) throw error
        // Supabase returns a user with empty identities for a duplicate signup
        // when email confirmation is on — guide them to sign in instead.
        const alreadyRegistered =
          !!data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0
        if (alreadyRegistered) {
          setStatus({
            type: 'error',
            message: 'هذا البريد مسجّل بالفعل. سجّل الدخول، أو أعد تعيين كلمة المرور إن نسيتها.',
          })
          return
        }
        if (data.session) {
          persistAccount(email, fullName || undefined)
          window.location.href = dashboardUrl()
        } else {
          rememberAccount({ email, name: fullName || undefined })
          try { localStorage.setItem('zenya_last_email', email) } catch {}
          setStatus({ type: 'success', message: 'تم إنشاء الحساب! يرجى التحقق من بريدك لتأكيده.' })
        }
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'حدث خطأ ما.' })
    } finally {
      setLoading(false)
    }
  }

  const toggle = (m: Mode) => { setMode(m); setStatus(null) }

  const inputClass =
    'w-full rounded-xl border border-token bg-white/80 px-4 py-3 text-[14px] text-foreground placeholder:text-muted ' +
    'outline-none backdrop-blur-sm transition-shadow duration-150 ' +
    'focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]'

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
      {/* Logo + heading */}
      <div className="mb-7 text-center">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 inline-flex"
        >
          <ZenyaMark className="h-6 text-[#16171b]" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <h1 className="mb-1.5 text-[26px] font-semibold tracking-tight text-foreground" style={{ letterSpacing: '-0.02em' }}>
              {mode === 'signin' ? 'أهلًا بعودتك' : mode === 'signup' ? 'أنشئ حسابك' : 'إعادة تعيين كلمة المرور'}
            </h1>
            <p className="text-[13.5px] text-muted">
              {mode === 'signin'
                ? showChooser
                  ? 'اختر حسابًا للمتابعة إلى لوحة التحكم.'
                  : 'سجّل الدخول للوصول إلى مواقعك في زينيا.'
                : mode === 'signup'
                ? 'ابدأ ببناء موقعك الاحترافي اليوم.'
                : 'أدخل بريدك الإلكتروني لتصلك رابط إعادة التعيين.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {!ready && mode === 'signin' ? (
        /* Brief skeleton while we check for an existing session — avoids a
           flash of the empty form before the account chooser appears. */
        <div className="space-y-2.5" aria-hidden>
          <div className="h-[54px] animate-pulse rounded-xl bg-black/[0.04]" />
          <div className="h-[54px] animate-pulse rounded-xl bg-black/[0.04]" />
        </div>
      ) : showChooser ? (
        <div className="space-y-2.5">
          {/* Live session → one-click continue */}
          {sessionAccount && (
            <>
              <button
                type="button"
                onClick={continueToDashboard}
                disabled={continuing}
                className="group flex w-full items-center gap-3 rounded-2xl border border-token bg-white/80 p-3 text-start transition-all duration-150 hover:border-primary hover:shadow-[0_0_0_3px_rgba(94,106,210,0.10)] disabled:opacity-60"
              >
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6b78e0 0%, #5e6ad2 55%, #4954c9 100%)' }}
                >
                  {initialsFor(sessionAccount)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-foreground">
                    {sessionAccount.name || sessionAccount.email}
                  </span>
                  <span className="block truncate text-[12.5px] text-muted" dir="ltr">
                    {sessionAccount.email}
                  </span>
                </span>
                {continuing ? (
                  <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ArrowLeft className="h-4 w-4 flex-shrink-0 text-muted transition-colors group-hover:text-primary rtl-flip" strokeWidth={2.5} />
                )}
              </button>
              <button
                type="button"
                onClick={switchAccount}
                disabled={continuing}
                className="flex w-full items-center justify-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-foreground disabled:opacity-60"
              >
                <LogOut className="h-3 w-3" strokeWidth={2} />
                ليس أنت؟ تسجيل الخروج
              </button>
            </>
          )}

          {/* Remembered accounts (excluding the live-session one) */}
          {savedAccounts.filter((a) => a.email.toLowerCase() !== sessionAccount?.email.toLowerCase()).length > 0 && (
            <>
              {sessionAccount && (
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-token" />
                  <span className="text-[11px] font-medium text-muted">أو اختر حسابًا آخر</span>
                  <span className="h-px flex-1 bg-token" />
                </div>
              )}
              {savedAccounts
                .filter((a) => a.email.toLowerCase() !== sessionAccount?.email.toLowerCase())
                .map((a) => (
                  <div
                    key={a.email}
                    className="group flex items-center gap-3 rounded-2xl border border-token bg-white/70 p-3 transition-all duration-150 hover:border-primary hover:shadow-[0_0_0_3px_rgba(94,106,210,0.10)]"
                  >
                    <button
                      type="button"
                      onClick={() => pickAccount(a)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-start"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(94,106,210,0.12)] text-[15px] font-bold text-primary">
                        {initialsFor(a)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-foreground">
                          {a.name || a.email}
                        </span>
                        <span className="block truncate text-[12px] text-muted" dir="ltr">{a.email}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSaved(a.email)}
                      aria-label="إزالة هذا الحساب من القائمة"
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted/50 opacity-0 transition hover:bg-black/5 hover:text-foreground group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </div>
                ))}
            </>
          )}

          <button
            type="button"
            onClick={() => { setShowForm(true); setEmail(''); setPassword(''); setStatus(null) }}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-token bg-white/40 px-4 py-3 text-[13px] font-medium text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={2} />
            تسجيل الدخول بحساب آخر
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Back to the account chooser when there's something to go back to. */}
        {mode === 'signin' && (sessionAccount || savedAccounts.length > 0) && (
          <button
            type="button"
            onClick={() => { setShowForm(false); setStatus(null) }}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.25} />
            العودة إلى الحسابات المحفوظة
          </button>
        )}
        <AnimatePresence>
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label htmlFor="fullName" className="sr-only">الاسم الكامل</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                className={inputClass}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label htmlFor="email" className="sr-only">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            dir="ltr"
            className={inputClass + ' text-start'}
          />
        </div>

        <AnimatePresence>
          {mode !== 'forgot' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
            >
              <label htmlFor="password" className="sr-only">كلمة المرور</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className={inputClass + ' pe-12'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:bg-[rgba(28,28,28,0.05)] hover:text-foreground"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode === 'signup' && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex cursor-pointer items-start gap-2.5 overflow-hidden pt-1 text-[12.5px] leading-relaxed text-muted"
            >
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ accentColor: '#5e6ad2' }}
              />
              <span>
                أوافق على{' '}
                <Link href="/terms" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">شروط الخدمة</Link>{' '}
                و{' '}
                <Link href="/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">سياسة الخصوصية</Link>
                ، وأوافق على الوصول الفوري للخدمة.
              </span>
            </motion.label>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || (mode === 'signup' && !acceptTerms)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 btn-shadow-primary"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جارٍ المعالجة…
            </span>
          ) : (
            <>
              {mode === 'signin' ? 'تسجيل الدخول' : mode === 'signup' ? 'إنشاء حساب' : 'إرسال رابط التعيين'}
              <ArrowRight className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.5} />
            </>
          )}
        </button>

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-3 text-center text-[13px] font-medium"
              style={{
                background: status.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(220,38,38,0.06)',
                border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(220,38,38,0.20)'}`,
                color: status.type === 'success' ? '#15803d' : '#b91c1c',
              }}
            >
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2 pt-2 text-center text-[13px]">
          {mode === 'signin' && (
            <>
              <div>
                <button type="button" onClick={() => toggle('forgot')} className="text-muted transition-colors hover:text-foreground">
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="text-muted">
                ليس لديك حساب؟{' '}
                <button type="button" onClick={() => toggle('signup')} className="font-medium text-primary underline-offset-2 hover:underline">
                  أنشئ حسابًا مجانًا
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div className="text-muted">
              لديك حساب بالفعل؟{' '}
              <button type="button" onClick={() => toggle('signin')} className="font-medium text-primary underline-offset-2 hover:underline">
                تسجيل الدخول
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <div className="text-muted">
              تذكّرتها؟{' '}
              <button type="button" onClick={() => toggle('signin')} className="font-medium text-primary underline-offset-2 hover:underline">
                العودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </form>
      )}
    </motion.div>
  )
}
