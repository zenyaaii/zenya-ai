import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { cookieDomainForHost } from '@/lib/cookie-domain'

export function createClient() {
  const cookieStore = cookies()
  // Scope auth cookies to .zenyaai.co so the session is shared across the
  // accounts / dashboard / apex subdomains.
  const domain = cookieDomainForHost(headers().get('host'))

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              sameSite: 'none',
              secure: true,
              ...(domain ? { domain } : {}),
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              sameSite: 'none',
              secure: true,
              ...(domain ? { domain } : {}),
            })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
