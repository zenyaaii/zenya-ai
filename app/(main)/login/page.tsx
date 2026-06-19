"use client"
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import ZenyaWordmark from '@/components/ZenyaWordmark'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    const lastEmail = localStorage.getItem('zenya_last_email')
    if (lastEmail) setEmail(lastEmail)
    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup' || modeParam === 'signin' || modeParam === 'forgot') {
      setMode(modeParam)
    }
  }, [searchParams])

  const validateEmail = (email: string) => z.string().email().safeParse(email).success
  const validatePassword = (pass: string) => pass.length >= 6

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      if (mode === 'forgot') {
        if (!validateEmail(email)) throw new Error('يرجى إدخال بريد إلكتروني صالح.')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) throw error
        setStatus({ type: 'success', message: 'تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك.' })
      } else if (mode === 'signin') {
        if (!email || !password) throw new Error('يرجى تعبئة جميع الحقول.')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        localStorage.setItem('zenya_last_email', email)
        localStorage.setItem('zenya_email', email)
        router.push(next)
        router.refresh()
      } else {
        if (!fullName) throw new Error('يرجى إدخال اسمك الكامل.')
        if (!validateEmail(email)) throw new Error('يرجى إدخال بريد إلكتروني صالح.')
        if (!validatePassword(password)) throw new Error('يجب ألّا تقلّ كلمة المرور عن 6 أحرف.')
        if (!acceptTerms) throw new Error('يرجى الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
            data: {
              full_name: fullName,
              consent_terms_v: '1',
              consent_terms_at: new Date().toISOString(),
            },
          },
        })
        if (error) throw error
        localStorage.setItem('zenya_last_email', email)
        if (data.session) {
          localStorage.setItem('zenya_email', email)
          router.push(next)
          router.refresh()
        } else {
          setStatus({ type: 'success', message: 'تم إنشاء الحساب! يرجى التحقق من بريدك لتأكيده.' })
        }
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'حدث خطأ ما.' })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode)
    setStatus(null)
  }

  const inputClass =
    'w-full rounded-lg border border-token bg-white px-4 py-3 text-[14px] text-foreground placeholder:text-muted ' +
    'outline-none transition-shadow duration-150 ' +
    'focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]'

  return (
    <div
      className="w-full max-w-md rounded-2xl bg-surface p-8 sm:p-10"
      style={{
        border: '1px solid #e5e2d9',
        boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 40px -12px rgba(28,28,28,0.10), 0 0 0 1px rgba(94,106,210,0.04)',
      }}
    >
      {/* Logo */}
      <div className="text-center mb-7">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div
            className="relative h-7 w-7 overflow-hidden rounded-lg"
            style={{
              background: '#5e6ad2',
              boxShadow:
                'rgba(255,255,255,0.20) 0px 0.5px 0px inset, rgba(94,106,210,0.35) 0px 0px 0px 0.5px inset',
            }}
          >
            <Image src="/logo.png" alt="زينيا" fill className="object-cover" />
          </div>
          <ZenyaWordmark className="text-[17px]" />
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground mb-1.5" style={{ letterSpacing: '-0.02em' }}>
              {mode === 'signin' ? 'أهلًا بعودتك' : mode === 'signup' ? 'أنشئ حسابك' : 'إعادة تعيين كلمة المرور'}
            </h1>
            <p className="text-[13.5px] text-muted">
              {mode === 'signin' ? 'سجّل الدخول للوصول إلى قوالبك في زينيا.' :
               mode === 'signup' ? 'ابدأ بناء قوالب عالية التحويل اليوم.' :
               'أدخل بريدك الإلكتروني لتصلك رابط إعادة التعيين.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full name (signup only) */}
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
                onChange={e => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                className={inputClass}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div>
          <label htmlFor="email" className="sr-only">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            dir="ltr"
            className={inputClass + ' text-start'}
          />
        </div>

        {/* Password */}
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
                onChange={e => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className={inputClass + ' pe-12'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:text-foreground hover:bg-[rgba(28,28,28,0.05)]"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ToS / Privacy consent (signup only) */}
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
                <Link href="/terms" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                  شروط الخدمة
                </Link>{' '}
                و{' '}
                <Link href="/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                  سياسة الخصوصية
                </Link>
                ، وأوافق على الوصول الفوري للخدمة (متنازلًا عن حق الانسحاب خلال 14 يومًا للمحتوى الذي أُنشئه).
              </span>
            </motion.label>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (mode === 'signup' && !acceptTerms)}
          className="mt-1 w-full rounded-md bg-primary px-4 py-3 text-[14px] font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 btn-shadow-primary"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              جارٍ المعالجة…
            </span>
          ) : mode === 'signin' ? 'تسجيل الدخول' : mode === 'signup' ? 'إنشاء حساب' : 'إرسال رابط التعيين'}
        </button>

        {/* Status message */}
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

        {/* Mode switchers */}
        <div className="pt-2 text-center text-[13px] space-y-2">
          {mode === 'signin' && (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => toggleMode('forgot')}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="text-muted">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => toggleMode('signup')}
                  className="font-medium text-primary hover:underline underline-offset-2"
                >
                  أنشئ حسابًا مجانًا
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div className="text-muted">
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                تسجيل الدخول
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <div className="text-muted">
              تذكّرتها؟{' '}
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-68px)] items-center justify-center px-6 py-16">
      <Suspense fallback={
        <div
          className="h-[480px] w-full max-w-md animate-pulse rounded-2xl"
          style={{ background: 'rgba(28,28,28,0.04)', border: '1px solid #e5e2d9' }}
        />
      }>
        <LoginForm />
      </Suspense>
    </main>
  )
}
