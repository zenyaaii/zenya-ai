'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const DEFAULT_DEV_EMAILS = [
  'anasalmusannef@outlook.com',
  'musannef@outlook.com',
]

function devEmailSet(): Set<string> {
  const env = (process.env.NEXT_PUBLIC_DEV_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return new Set<string>([
    ...DEFAULT_DEV_EMAILS.map((e) => e.toLowerCase()),
    ...env,
  ])
}

/**
 * true when the signed-in user's email is in the dev allowlist.
 * Returns null until the auth check resolves so the UI doesn't flicker.
 * Extend the allowlist with NEXT_PUBLIC_DEV_EMAILS=a@x,b@y.
 */
export function useIsDev(): boolean | null {
  const [isDev, setIsDev] = useState<boolean | null>(null)
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      const email = (user?.email || '').toLowerCase()
      setIsDev(email ? devEmailSet().has(email) : false)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return isDev
}
