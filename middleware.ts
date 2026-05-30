import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/app') || pathname.startsWith('/dashboard') || pathname.startsWith('/api/shopify')) {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    response.headers.delete('X-Frame-Options')
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com https://*.spin.dev;"
    )
    return response
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
