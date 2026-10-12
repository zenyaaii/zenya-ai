import { randomBytes } from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { publicSiteUrl } from '@/lib/portal-urls'

/**
 * Site handovers: the notice that tells a customer the site Zenya built for
 * them, its address and their plan are now in their own account, with a
 * yes / no receipt. Rows live in public.site_handovers and are written only
 * through the service role.
 */

export type HandoverStatus = 'pending' | 'yes' | 'no'

export function serviceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** The secret behind the "no" page, and the only key that page has. */
export function handoverToken(): string {
  return randomBytes(24).toString('base64url')
}

/** Tokens are base64url; anything else is not one of ours. */
export function isHandoverToken(t: unknown): t is string {
  return typeof t === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(t)
}

export type ThemeForHandover = {
  id: string
  slug: string | null
  product_name: string | null
  published_url: string | null
}

export function handoverSiteName(t: ThemeForHandover): string {
  return t.product_name || t.slug || 'موقعك'
}

export function handoverSiteUrl(t: ThemeForHandover): string {
  return t.published_url || (t.slug ? publicSiteUrl(t.slug) : 'https://zenyaai.co/dashboard')
}
