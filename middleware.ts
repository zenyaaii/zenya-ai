import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const OWN_HOSTS = new Set([
  'zenyaai.co',
  'www.zenyaai.co',
  'dashboard.zenyaai.co',
  'localhost',
  'localhost:3000',
])

// Subdomains of zenyaai.co that are reserved for the app (not customer sites)
const ZENYAAI_CO_APP_SUBDOMAINS = new Set([
  'www',
  'dashboard',
])

function isOwnHost(host: string) {
  if (!host) return true // safety: treat unknown host as own to avoid blank rewrite loops
  if (OWN_HOSTS.has(host)) return true
  if (host.endsWith('.vercel.app')) return true
  if (host.startsWith('localhost:')) return true
  return false
}

/**
 * If the host is a *.zenyaai.co wildcard subdomain (not a reserved one),
 * return the subdomain slug so we can route to /s/[slug].
 * e.g. "myrestaurant.zenyaai.co" → "myrestaurant"
 */
function getZenyaCoSlug(host: string): string | null {
  if (!host.endsWith('.zenyaai.co')) return null
  const sub = host.slice(0, -'.zenyaai.co'.length)
  if (!sub || ZENYAAI_CO_APP_SUBDOMAINS.has(sub)) return null
  return sub
}

// ── Rate limiting ──────────────────────────────────────────────────────────
// Expensive endpoints that call paid APIs (OpenAI / ScraperAPI). Without a
// throttle, anyone can loop these and run up the bill. Enforced here at the
// edge, before the route runs, keyed by client IP.
const RATE_LIMITED_PREFIXES = [
  '/api/scrape',
  '/api/generate-',
  '/api/ai/',
]
const RATE_LIMIT_MAX = 60       // requests
const RATE_LIMIT_WINDOW = 60    // seconds

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return (request as any).ip || request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Returns true if the request is allowed, false if it has blown the limit.
 * Fails OPEN: if the limiter itself errors (DB hiccup, missing env), we let
 * the request through rather than take legit users down — abuse protection
 * is best-effort, availability isn't.
 */
async function rateLimitOk(key: string): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !svcKey) return true
  try {
    const r = await fetch(`${baseUrl}/rest/v1/rpc/check_rate_limit`, {
      method: 'POST',
      headers: {
        apikey: svcKey,
        Authorization: `Bearer ${svcKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key: key,
        p_limit: RATE_LIMIT_MAX,
        p_window_seconds: RATE_LIMIT_WINDOW,
      }),
    })
    if (!r.ok) return true
    const allowed = await r.json()
    return allowed !== false
  } catch {
    return true
  }
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

  // Expose the pathname to server components so the root layout can decide
  // whether to inject the Shopify App Bridge script tag for /shopify/*.
  const forwardedHeaders = new Headers(request.headers)
  forwardedHeaders.set('x-pathname', pathname)

  // ---- RATE LIMIT (paid endpoints) ---------------------------------------
  if (
    request.method === 'POST' &&
    RATE_LIMITED_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const ok = await rateLimitOk(`mw:${clientIp(request)}`)
    if (!ok) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests. Slow down and try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW) } }
      )
    }
  }

  // ---- WILDCARD *.zenya.co → customer site by slug -----------------------
  // e.g. myrestaurant.zenya.co → /s/myrestaurant (no DB lookup needed)
  const zenyaSlug = getZenyaCoSlug(host)
  if (zenyaSlug) {
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/s/')
    ) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = `/s/${zenyaSlug}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // ---- dashboard.zenyaai.co → dashboard portal (like Shopify admin) ---------
  // Rewrites all paths to /dashboard/* internally so the URL bar shows
  // dashboard.zenyaai.co/sites — never dashboard.zenyaai.co/dashboard/sites.
  if (host === 'dashboard.zenyaai.co') {
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/s/')
    ) {
      return NextResponse.next({ request: { headers: forwardedHeaders } })
    }

    // Refresh auth cookies so Supabase session stays alive
    const sessionRes = await updateSession(request)

    // If updateSession issued a redirect (e.g. unauthenticated → /login), honour it
    if (sessionRes.headers.get('location')) return sessionRes

    // Paths that already map to top-level routes (auth pages) — serve as-is
    const alreadyRouted =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/sign')

    if (!alreadyRouted) {
      // Rewrite: dashboard.zenyaai.co/       → /dashboard
      //          dashboard.zenyaai.co/sites   → /dashboard/sites
      const url = request.nextUrl.clone()
      url.pathname = pathname === '/' ? '/dashboard' : `/dashboard${pathname}`
      const rewriteRes = NextResponse.rewrite(url)
      // Forward session cookies onto the rewrite response
      sessionRes.headers.getSetCookie?.().forEach(c =>
        rewriteRes.headers.append('set-cookie', c)
      )
      return rewriteRes
    }

    return sessionRes
  }

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
    return NextResponse.next({ request: { headers: forwardedHeaders } })
  }

  // ---- OWN-HOST PATH (existing behaviour) --------------------------------
  if (
    pathname.startsWith('/app') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/shopify') ||
    pathname.startsWith('/api/shopify')
  ) {
    const response = NextResponse.next({
      request: { headers: forwardedHeaders },
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
