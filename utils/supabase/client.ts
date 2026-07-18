import { createBrowserClient } from '@supabase/ssr'
import { cookieDomainForHost } from '@/lib/cookie-domain'

export function createClient() {
  // Scope auth cookies to .zenyaai.co so a session created on
  // accounts.zenyaai.co is shared with dashboard.zenyaai.co and the apex.
  const domain =
    typeof window !== 'undefined'
      ? cookieDomainForHost(window.location.hostname)
      : undefined

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        sameSite: 'none',
        secure: true,
        ...(domain ? { domain } : {}),
      },
    }
  )
}
