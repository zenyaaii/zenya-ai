'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import ZenyaMark from '@/components/ZenyaMark'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(Boolean(user))
      setChecking(false)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)

    if (password.length < 8) {
      setStatus({ type: 'error', message: 'يجب أن تتكوّن كلمة المرور من ٨ أحرف على الأقل.' })
      return
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'كلمتا المرور غير متطابقتين.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    setStatus({ type: 'success', message: 'تم تحديث كلمة المرور. جارٍ إعادة التوجيه…' })
    setTimeout(() => {
      window.location.href = 'https://dashboard.zenyaai.co'
      router.refresh()
    }, 1200)
  }

  const inputClass =
    'w-full rounded-lg border border-token bg-white px-4 py-3 text-[14px] text-foreground placeholder:text-muted ' +
    'outline-none transition-shadow duration-150 ' +
    'focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]'

  return (
    <main className="relative flex min-h-[calc(100vh-68px)] items-center justify-center px-6 py-16">
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-8 sm:p-10"
        style={{
          border: '1px solid #e5e2d9',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 40px -12px rgba(28,28,28,0.10), 0 0 0 1px rgba(94,106,210,0.04)',
        }}
      >
        {/* Logo + header */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center mb-6">
            <ZenyaMark className="h-6 text-[#16171b]" />
          </Link>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground mb-1.5" style={{ letterSpacing: '-0.02em' }}>
            تعيين كلمة مرور جديدة
          </h1>
          <p className="text-[13.5px] text-muted">
            اختر كلمة مرور قوية لم تستخدمها من قبل.
          </p>
        </div>

        {checking ? (
          <div className="h-32 animate-pulse rounded-lg" style={{ background: 'rgba(28,28,28,0.04)' }} />
        ) : !hasSession ? (
          <div
            className="rounded-lg p-4 text-center text-[13.5px] font-medium"
            style={{
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.20)',
              color: '#b91c1c',
            }}
          >
            <p>رابط إعادة التعيين هذا غير صالح أو انتهت صلاحيته.</p>
            <Link
              href="/login?mode=forgot"
              className="mt-3 inline-block font-semibold text-primary underline underline-offset-2"
            >
              طلب رابط إعادة تعيين جديد ←
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <label htmlFor="password" className="sr-only">كلمة المرور الجديدة</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                autoComplete="new-password"
                required
                className={inputClass + ' pl-12'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:bg-[rgba(28,28,28,0.05)] hover:text-foreground"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>

            <div>
              <label htmlFor="confirm" className="sr-only">تأكيد كلمة المرور الجديدة</label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="تأكيد كلمة المرور الجديدة"
                autoComplete="new-password"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-md bg-primary px-4 py-3 text-[14px] font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 btn-shadow-primary"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جارٍ الحفظ…
                </span>
              ) : 'تحديث كلمة المرور'}
            </button>

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg p-3 text-center text-[13px] font-medium"
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
          </form>
        )}
      </div>
    </main>
  )
}
