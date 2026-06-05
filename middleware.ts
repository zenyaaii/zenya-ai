import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const OWN_HOSTS = new Set([
  'zenyaai.co',
  'www.zenyaai.co',
  'localhost',
  'localhost:3000',
])

function isOwnHost(host: string) {
  if (!host) return true // safety: treat unknown host as own to avoid blank rewrite loops
  if (OWN_HOSTS.has(host)) return true
  if (host.endsWith('.vercel.app')) return true
  if (host.startsWith('localhost:')) return true
  return false
}

type LookupResult = { slug: string } | null

/**
 * Resolve a custom domain to its bound theme slug via Supabase PostgREST.
 * Uses the service-role key — required because the `domains` table is
 * RLS-locked. Cached at the edge for 60s; once a domain goes live this
 * rarely changes.
 */
async function lookupCustomDomain(host: string): Promise<LookupResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !key) return null

  const q = new URL(`${baseUrl}/rest/v1/domains`)
  q.searchParams.set('domain', `eq.${host}`)
  q.searchParams.set('status', 'eq.live')
  q.searchParams.set('select', 'theme_id,themes(slug,is_published)')
  q.searchParams.set('limit', '1')

  try {
    const r = await fetch(q.toString(), {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    })
    if (!r.ok) return null
    const rows = (await r.json()) as Array<{
      theme_id: string
      themes: { slug: string; is_published: boolean } | null
    }>
    const row = rows?.[0]
    if (!row?.themes?.slug || !row.themes.is_published) return null
    return { slug: row.themes.slug }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase()
  const pathname = request.nextUrl.pathname

  // ---- CUSTOM DOMAIN PATH ------------------------------------------------
  if (!isOwnHost(host)) {
    // Don't recurse / interfere with framework + API plumbing.
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/s/')
    ) {
      return NextResponse.next()
    }
    const found = await lookupCustomDomain(host)
    if (found) {
      const url = request.nextUrl.clone()
      url.pathname = `/s/${found.slug}`
      return NextResponse.rewrite(url)
    }
    // Unknown custom host (DNS pointed at us but no `domains` row yet) —
    // fall through to the normal app so they at least see Zenya rather
    // than a generic error.
    return NextResponse.next()
  }

  // ---- OWN-HOST PATH (existing behaviour) --------------------------------
  if (
    pathname.startsWith('/app') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/shopify')
  ) {
    const response = NextResponse.next({
      request: { headers: request.headers },
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
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - common image static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
