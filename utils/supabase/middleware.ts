import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookieDomainForHost } from '@/lib/cookie-domain'

// "Remember me" for ~3 months. The auth cookie is written with this Max-Age so
// it survives browser restarts (a cookie with no Max-Age is a session cookie
// that dies when the browser closes — which is what forces users to log in
// again). The access token still rotates hourly; this only governs how long the
// refresh-token cookie is kept, i.e. how long the user stays signed in.
const SESSION_MAX_AGE = 60 * 60 * 24 * 90 // 90 days, in seconds

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Scope auth cookies to .zenyaai.co so the session is shared across the
  // accounts / dashboard / apex subdomains (host-only on localhost/preview).
  const cookieDomain = cookieDomainForHost(request.headers.get('host'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Force SameSite=None and Secure=true for Shopify embedded apps.
          // maxAge keeps the user signed in for ~3 months (see SESSION_MAX_AGE).
          const cookieOptions = {
            ...options,
            sameSite: 'none' as const,
            secure: true,
            maxAge: SESSION_MAX_AGE,
            ...(cookieDomain ? { domain: cookieDomain } : {}),
          }

          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Force SameSite=None and Secure=true for Shopify embedded apps
          const cookieOptions = {
            ...options,
            sameSite: 'none' as const,
            secure: true,
            ...(cookieDomain ? { domain: cookieDomain } : {}),
          }

          request.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  // Refresh the session. This can throw an AuthApiError when the stored refresh
  // token is stale or already rotated (refresh_token_already_used /
  // refresh_token_not_found) — a race that happens when the browser client and
  // this middleware both try to refresh the same session across the shared
  // .zenyaai.co cookie. Swallow it: a transient rotation race must NOT 500 the
  // navigation or bounce the user to login. supabase-ssr has already written
  // any fresh cookie it obtained; the next request settles on the new token.
  try {
    await supabase.auth.getUser()
  } catch {
    /* stale refresh token — leave the request untouched, don't crash */
  }

  // Allow Shopify embedding and self-embedding for previews
  response.headers.delete('X-Frame-Options')
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com https://*.spin.dev;")

  return response
}
