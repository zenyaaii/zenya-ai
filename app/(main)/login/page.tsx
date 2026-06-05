"use client"
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

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
        if (!validateEmail(email)) throw new Error('Please enter a valid email address.')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) throw error
        setStatus({ type: 'success', message: 'Password reset link sent! Check your email.' })
      } else if (mode === 'signin') {
        if (!email || !password) throw new Error('Please fill in all fields.')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        localStorage.setItem('zenya_last_email', email)
        localStorage.setItem('zenya_email', email)
        router.push(next)
        router.refresh()
      } else {
        if (!fullName) throw new Error('Please enter your full name.')
        if (!validateEmail(email)) throw new Error('Please enter a valid email address.')
        if (!validatePassword(password)) throw new Error('Password must be at least 6 characters.')
        if (!acceptTerms) throw new Error('Please accept the Terms of Service and Privacy Policy to continue.')
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
          setStatus({ type: 'success', message: 'Account created! Please check your email to confirm.' })
        }
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'An error occurred.' })
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
            <Image src="/logo.png" alt="Zenya" fill className="object-cover" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Zenya</span>
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
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
            </h1>
            <p className="text-[13.5px] text-muted">
              {mode === 'signin' ? 'Sign in to access your Zenya themes.' :
               mode === 'signup' ? 'Start building high-converting themes today.' :
               'Enter your email to receive a reset link.'}
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
              <label htmlFor="fullName" className="sr-only">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            className={inputClass}
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
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className={inputClass + ' pr-12'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:text-foreground hover:bg-[rgba(28,28,28,0.05)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                , and I consent to immediate access to the Service (waiving the 14-day withdrawal right for content I generate).
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
              Processing…
            </span>
          ) : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
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
                  Forgot password?
                </button>
              </div>
              <div className="text-muted">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode('signup')}
                  className="font-medium text-primary hover:underline underline-offset-2"
                >
                  Sign up free
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div className="text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                Sign in
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <div className="text-muted">
              Remembered it?{' '}
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                Back to sign in
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
