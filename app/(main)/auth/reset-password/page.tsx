'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import ZenyaMark from '@/components/ZenyaMark'
import { AUTH_CSS } from '../styles'

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

  return (
    <main className="zs-wrap">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

      <div className="zs-card">
        <div className="zs-top">
          <Link href="/" className="zs-mark" aria-label="زينيا">
            <ZenyaMark className="h-6" />
          </Link>
          <h1 className="zs-h1">تعيين كلمة مرور جديدة</h1>
          <p className="zs-sub">اختر كلمة مرور قوية لم تستخدمها من قبل.</p>
        </div>

        {checking ? (
          <div className="zs-skeleton" />
        ) : !hasSession ? (
          <div className="zs-note" data-tone="error">
            <p>رابط إعادة التعيين هذا غير صالح أو انتهت صلاحيته.</p>
            <Link href="/login?mode=forgot" className="zs-note-link">
              طلب رابط إعادة تعيين جديد ←
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="zs-form">
            <div className="zs-field">
              <label htmlFor="password" className="sr-only">كلمة المرور الجديدة</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                autoComplete="new-password"
                required
                className="zs-input zs-input-eye"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="zs-eye"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>

            <div className="zs-field">
              <label htmlFor="confirm" className="sr-only">تأكيد كلمة المرور الجديدة</label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="تأكيد كلمة المرور الجديدة"
                autoComplete="new-password"
                required
                className="zs-input"
              />
            </div>

            <button type="submit" disabled={loading} className="zs-submit">
              {loading ? (
                <span className="zs-spin">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جارٍ الحفظ…
                </span>
              ) : 'تحديث كلمة المرور'}
            </button>

            {/* The status line is announced, not just painted: a password
                rejected for length is the one message a sighted user reads
                and a screen-reader user used to miss entirely. */}
            <div role="status" aria-live="polite">
              {status && (
                <div className="zs-note" data-tone={status.type}>
                  <p>{status.message}</p>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
