import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Is this user the founder/admin? Mirrors the check in /api/analytics —
 * `profiles.plan === 'admin'`. Read with the service-role client so it
 * doesn't depend on the caller's RLS view of their own row.
 *
 * Used to keep the one-product Shopify builder open for the admin while the
 * feature shows a "coming soon" screen to everyone else. Fail CLOSED (return
 * false) if anything is misconfigured — the safe default is "not admin".
 */
export async function userIsAdmin(userId: string | null | undefined): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !userId) return false
  try {
    const admin = createAdminClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data } = await admin.from('profiles').select('plan').eq('id', userId).maybeSingle()
    return data?.plan === 'admin'
  } catch {
    return false
  }
}
