"use client"
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
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
            // Record consent timestamp + version on the auth user so we can
            // prove acceptance later (GDPR Art. 7(1)).
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '0.875rem',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    padding: '0.875rem 1.25rem',
    color: '#f1f0ff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div
      className="w-full max-w-md"
      style={{
        borderRadius: '1.5rem',
        border: '1px solid rgba(139,92,246,0.2)',
        background: 'rgba(13,13,26,0.9)',
        backdropFilter: 'blur(40px)',
        boxShadow: '0 40px 120px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.08)',
        padding: '2.5rem',
      }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }} />
          <span className="text-lg font-black gradient-text">Zenya</span>
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <h1 className="text-2xl font-black mb-2" style={{ color: '#f1f0ff', letterSpacing: '-0.02em' }}>
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h1>
            <p className="text-sm" style={{ color: '#8b8aad' }}>
              {mode === 'signin' ? 'Sign in to access your Zenya themes.' :
               mode === 'signup' ? 'Start building high-converting themes today.' :
               'Enter your email to receive a reset link.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Full Name"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
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
            style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
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
                style={{ ...inputStyle, paddingRight: '3rem' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#5e5d7a' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5e5d7a'; }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.09"/><line x1="2" x2="22" y1="2" y2="22"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
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
              className="flex cursor-pointer items-start gap-2.5 overflow-hidden text-xs leading-relaxed"
              style={{ color: '#8b8aad' }}
            >
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#7c3aed]"
                style={{ accentColor: '#7c3aed' }}
              />
              <span>
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold underline"
                  style={{ color: '#a78bfa' }}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold underline"
                  style={{ color: '#a78bfa' }}
                >
                  Privacy Policy
                </Link>
                , and I consent to immediate access to the Service (waiving the
                14-day withdrawal right for content I generate).
              </span>
            </motion.label>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (mode === 'signup' && !acceptTerms)}
          className="w-full rounded-full py-4 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 24px -4px rgba(124,58,237,0.55)' }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Processing…
            </span>
          ) : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </button>

        {/* Status message */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-4 text-center text-sm font-medium"
              style={{
                background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: status.type === 'success' ? '#22c55e' : '#ef4444',
              }}
            >
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode switchers */}
        <div className="text-center text-sm space-y-2">
          {mode === 'signin' && (
            <>
              <div>
                <button type="button" onClick={() => toggleMode('forgot')}
                  className="transition-colors" style={{ color: '#5e5d7a' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5e5d7a'; }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ color: '#5e5d7a' }}>
                No account?{' '}
                <button type="button" onClick={() => toggleMode('signup')}
                  className="font-semibold transition-colors" style={{ color: '#a78bfa' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c4b5fd'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
                >
                  Sign up free
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div style={{ color: '#5e5d7a' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => toggleMode('signin')}
                className="font-semibold transition-colors" style={{ color: '#a78bfa' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c4b5fd'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
              >
                Sign in
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <div style={{ color: '#5e5d7a' }}>
              Remembered it?{' '}
              <button type="button" onClick={() => toggleMode('signin')}
                className="font-semibold transition-colors" style={{ color: '#a78bfa' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c4b5fd'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
              >
                Back to Sign In
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
      {/* Background aurora */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-orb-1 absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="aurora-orb-2 absolute -bottom-20 right-1/4 h-64 w-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#06b6d4,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 dot-grid opacity-25" />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md h-96 rounded-2xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
      }>
        <LoginForm />
      </Suspense>
    </main>
  )
}
