import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookieDomainForHost } from '@/lib/cookie-domain'

// One browser client per tab. Reusing a single instance guarantees there is
// exactly one GoTrueClient managing the stored session — two instances racing
// over the same (rotating) refresh token is the classic trigger for the
// refresh-token storms seen in the auth logs. Only cached in the browser: on
// the server we must build a fresh client each call so one user's session can
// never leak into another request.
let browserClient: SupabaseClient | undefined

export function createClient() {
  if (typeof window !== 'undefined' && browserClient) return browserClient

  // Scope auth cookies to .zenyaai.co so a session created on
  // accounts.zenyaai.co is shared with dashboard.zenyaai.co and the apex.
  const domain =
    typeof window !== 'undefined'
      ? cookieDomainForHost(window.location.hostname)
      : undefined

  const instance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        sameSite: 'none',
        secure: true,
        // "Remember me" for ~3 months — persist the auth cookie across browser
        // restarts instead of letting it die as a session cookie.
        maxAge: 60 * 60 * 24 * 90, // 90 days
        ...(domain ? { domain } : {}),
      },
      global: {
        // Break refresh-token loops at the source. A 400 on a refresh_token
        // grant means the stored token is dead (stale / already rotated /
        // "not found") — retrying it only storms /auth/v1/token and trips the
        // per-IP rate limiter into 429s. When we see one, clear the session
        // locally (no network round-trip) so the tab settles into a clean
        // signed-out state instead of hammering the endpoint forever.
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          const res = await fetch(input, init)
          try {
            const url = input instanceof Request ? input.url : String(input)
            if (
              res.status === 400 &&
              url.includes('/auth/v1/token') &&
              url.includes('grant_type=refresh_token')
            ) {
              // Defer past the in-flight refresh before tearing the session down.
              setTimeout(() => {
                instance.auth.signOut({ scope: 'local' }).catch(() => {})
              }, 0)
            }
          } catch {
            /* the guard must never break a normal request */
          }
          return res
        },
      },
    }
  )

  if (typeof window !== 'undefined') browserClient = instance
  return instance
}
