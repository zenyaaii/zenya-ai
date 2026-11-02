import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ROOT_DOMAIN, isCompanyHost } from '@/lib/domain'
import type { PortalUser } from '@/components/zenya/redesign/s11'

/**
 * Who is signed in on this device, read on the server so the chooser paints
 * with the right account, and where «continue» goes: dashboard.beynoun.com on
 * our own hosts, /dashboard on localhost and previews (the same rule as
 * dashboardUrl() in lib/portal-urls, which only runs in the browser).
 */
export async function portalUser(): Promise<{ user: PortalUser | null; dash: string }> {
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const dash = isCompanyHost(host) ? `https://dashboard.${ROOT_DOMAIN}` : '/dashboard'
  try {
    const { data } = await createClient().auth.getUser()
    const u = data.user
    if (!u?.email) return { user: null, dash }
    const meta = (u.user_metadata || {}) as Record<string, unknown>
    const name = typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : 'مستخدم بينون'
    const avatar = typeof meta.avatar_url === 'string' && /^https:\/\//.test(meta.avatar_url) ? meta.avatar_url : undefined
    return { user: { name, email: u.email, avatar }, dash }
  } catch {
    return { user: null, dash }
  }
}
