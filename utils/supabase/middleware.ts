import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Force SameSite=None and Secure=true for Shopify embedded apps
          const cookieOptions = {
            ...options,
            sameSite: 'none' as const,
            secure: true,
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

  await supabase.auth.getUser()

  // Allow Shopify embedding
  response.headers.delete('X-Frame-Options')
  response.headers.set('Content-Security-Policy', "frame-ancestors https://admin.shopify.com https://*.myshopify.com https://*.spin.dev;")

  return response
}
