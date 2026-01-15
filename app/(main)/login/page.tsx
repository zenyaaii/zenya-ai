"use client"
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    const lastEmail = localStorage.getItem('zenya_last_email')
    if (lastEmail) {
      setEmail(lastEmail)
    }

    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup' || modeParam === 'signin' || modeParam === 'forgot') {
      setMode(modeParam)
    }
  }, [searchParams])

  // Validation Schemas
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
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        })
        if (error) throw error
        setStatus({ type: 'success', message: 'Password reset link sent! Check your email.' })
      } 
      else if (mode === 'signin') {
        if (!email || !password) throw new Error('Please fill in all fields.')
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        
        localStorage.setItem('zenya_last_email', email)
        localStorage.setItem('zenya_email', email)
        router.push(next)
        router.refresh()
      } 
      else {
        // Signup
        if (!fullName) throw new Error('Please enter your full name.')
        if (!validateEmail(email)) throw new Error('Please enter a valid email address.')
        if (!validatePassword(password)) throw new Error('Password must be at least 6 characters.')

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
            data: {
              full_name: fullName,
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

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-token bg-elevated p-8 shadow-soft-xl">
        <div className="text-center">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="mt-2 text-muted">
              {mode === 'signin' ? 'Enter your details to access your themes.' : 
               mode === 'signup' ? 'Sign up to start building amazing themes.' :
               'Enter your email to receive a reset link.'}
            </p>
          </motion.div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
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
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Full Name" 
                  className="w-full rounded-xl border border-token bg-surface px-5 py-4 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input 
              id="email"
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@company.com" 
              className="w-full rounded-xl border border-token bg-surface px-5 py-4 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
            />
          </div>

          <AnimatePresence mode="popLayout">
            {mode !== 'forgot' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <label htmlFor="password" className="sr-only">Password</label>
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Password" 
                  className="w-full rounded-xl border border-token bg-surface px-5 py-4 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.09"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link')}
          </button>
          
          {status && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 text-center text-sm font-medium ${status.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
            >
              {status.message}
            </motion.div>
          )}

          <div className="text-center text-sm text-muted space-y-2">
            {mode === 'signin' && (
              <>
                <div>
                  <button type="button" onClick={() => toggleMode('forgot')} className="text-muted hover:text-foreground transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => toggleMode('signup')} className="font-medium text-primary hover:underline">
                    Sign up
                  </button>
                </div>
              </>
            )}
            
            {mode === 'signup' && (
              <div>
                Already have an account?{' '}
                <button type="button" onClick={() => toggleMode('signin')} className="font-medium text-primary hover:underline">
                  Sign in
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <div>
                Remembered your password?{' '}
                <button type="button" onClick={() => toggleMode('signin')} className="font-medium text-primary hover:underline">
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
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
