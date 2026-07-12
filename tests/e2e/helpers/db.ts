import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('E2E: Supabase service-role env missing')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Resolve an auth user id by email, retrying transient upstream errors. */
export async function getUserIdByEmail(email: string): Promise<string> {
  const admin = adminDb()
  let lastErr: unknown = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      for (let page = 1; page <= 5; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
        if (error) throw error
        const hit = data.users.find((u) => u.email === email)
        if (hit) return hit.id
        if (data.users.length < 200) break
      }
      throw new Error(`user not found: ${email}`)
    } catch (e) {
      lastErr = e
      await sleep(1000 * attempt)
    }
  }
  throw new Error(`getUserIdByEmail failed: ${(lastErr as any)?.message || lastErr}`)
}

/** Overwrite entitlement-relevant profile fields for a test user. */
export async function setProfile(
  userId: string,
  fields: Partial<{
    plan: string
    is_pro: boolean
    has_hosting: boolean
    trial_themes_used: number
    trial_themes_limit: number
    free_domain_claimed_at: string | null
  }>
): Promise<void> {
  const { error } = await adminDb().from('profiles').update(fields).eq('id', userId)
  if (error) throw new Error(`setProfile failed: ${error.message}`)
}

/** Delete every theme this user owns whose product_name starts with prefix. */
export async function deleteThemesByPrefix(userId: string, prefix: string): Promise<void> {
  await adminDb().from('themes').delete().eq('user_id', userId).like('product_name', `${prefix}%`)
}

/** Create (or fetch) a second auth user for cross-user isolation tests. */
export async function createOrGetUser(email: string, password: string): Promise<string> {
  const admin = adminDb()
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (!error && data.user) return data.user.id
  // Already exists → resolve id.
  return getUserIdByEmail(email)
}

export async function deleteUserById(userId: string): Promise<void> {
  try { await adminDb().auth.admin.deleteUser(userId) } catch { /* best-effort */ }
}

/** Insert a theme owned by userId; returns its id. */
export async function insertTheme(userId: string, productName: string): Promise<string> {
  const { data, error } = await adminDb()
    .from('themes')
    .insert({ user_id: userId, product_name: productName, content: { e2e: true } })
    .select('id')
    .single()
  if (error) throw new Error(`insertTheme failed: ${error.message}`)
  return data.id
}

/** Insert a domain owned by userId; returns its id. */
export async function insertDomain(userId: string, domain: string, themeId?: string): Promise<string> {
  const { data, error } = await adminDb()
    .from('domains')
    .insert({ user_id: userId, domain, theme_id: themeId ?? null, status: 'pending_ssl' })
    .select('id')
    .single()
  if (error) throw new Error(`insertDomain failed: ${error.message}`)
  return data.id
}

/** Read the current quota counters for assertions. */
export async function getProfile(userId: string) {
  const { data } = await adminDb()
    .from('profiles')
    .select('plan, is_pro, has_hosting, trial_themes_used, trial_themes_limit')
    .eq('id', userId)
    .maybeSingle()
  return data
}
