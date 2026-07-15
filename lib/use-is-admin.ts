'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

/**
 * Client hook: is the signed-in user the founder/admin (`profiles.plan === 'admin'`)?
 *
 * Returns `null` while loading, then `boolean`. Logged-out users resolve to
 * `false`. Used to keep the one-product Shopify builder visible/working for the
 * admin while showing "coming soon" everywhere else. Treat `null` (loading) as
 * "not admin" at call sites so a build CTA never flashes for regular users.
 */
export function useIsAdmin(): boolean | null {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!alive) return
        if (!user) { setIsAdmin(false); return }
        const { data: prof } = await supabase
          .from('profiles').select('plan').eq('id', user.id).maybeSingle()
        if (!alive) return
        setIsAdmin(prof?.plan === 'admin')
      } catch {
        if (alive) setIsAdmin(false)
      }
    })()
    return () => { alive = false }
  }, [])
  return isAdmin
}
