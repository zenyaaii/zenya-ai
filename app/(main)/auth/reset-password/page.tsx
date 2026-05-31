'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

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
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' })
      return
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    setStatus({ type: 'success', message: 'Password updated. Redirecting…' })
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1200)
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
    <main className="relative flex min-h-[calc(100vh-68px)] items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="aurora-orb-1 absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="aurora-orb-2 absolute -bottom-20 right-1/4 h-64 w-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#06b6d4,transparent 70%)', filter: 'blur(80px)' }}
        />
        <div className="absolute inset-0 dot-grid opacity-25" />
      </div>

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
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }} />
            <span className="text-lg font-black gradient-text">Zenya</span>
          </Link>
          <h1 className="text-2xl font-black mb-2" style={{ color: '#f1f0ff', letterSpacing: '-0.02em' }}>
            Set a new password
          </h1>
          <p className="text-sm" style={{ color: '#8b8aad' }}>
            Choose a strong password you haven&apos;t used before.
          </p>
        </div>

        {checking ? (
          <div className="h-32 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ) : !hasSession ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
          >
            <p>This reset link is invalid or has expired.</p>
            <Link
              href="/login?mode=forgot"
              className="mt-3 inline-block font-semibold underline"
              style={{ color: '#a78bfa' }}
            >
              Request a new reset link →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="password" className="sr-only">New password</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                required
                style={{ ...inputStyle, paddingRight: '3rem' }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#5e5d7a' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            <div>
              <label htmlFor="confirm" className="sr-only">Confirm new password</label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-4 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 24px -4px rgba(124,58,237,0.55)' }}
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>

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
          </form>
        )}
      </div>
    </main>
  )
}
