import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const OWN_HOSTS = new Set([
  'zenyaai.co',
  'www.zenyaai.co',
  'dashboard.zenyaai.co',
  'accounts.zenyaai.co',
  'demo.zenyaai.co',
  'localhost',
  'localhost:3000',
])

// Subdomains of zenyaai.co that are reserved for the app (not customer sites)
const ZENYAAI_CO_APP_SUBDOMAINS = new Set([
  'www',
  'dashboard',
  'accounts',
  // Reserved so the candidate pages get their own address. Without this entry
  // the wildcard below claims it: demo.zenyaai.co rewrites to /s/demo, a
  // customer site that does not exist, and the host 404s. Verified before this
  // change — demo.zenyaai.co already resolved to Vercel through the
  // *.zenyaai.co wildcard and returned exactly the same 404 as any random
  // subdomain. Reserving the name is what makes the host ours; no DNS record
  // needs to change.
  'demo',
])

/**
 * What demo.zenyaai.co serves, now that the candidates have been promoted.
 *
 * It used to serve the whole candidate set. That set IS the site now: the
 * house style ships from app/(site), so /pricing, /themes, /about and the
 * rest answer at the apex and there is nothing left here to propose. Every
 * promoted segment was removed from this list in the same commit that
 * promoted it, which is what makes demo.zenyaai.co/pricing send the reader
 * to the real page instead of rewriting to a route that no longer exists.
 *
 * Two entries remain, and they are the two surfaces that are NOT pages of
 * the public site: the dashboard and the editor. app/demo/dashboard and
 * app/demo/editor render them with fixture data at an address that needs no
 * account, which is the only way to look at either one without signing in.
 *
 * The theme demos are still deliberately absent — /demo/restaurant,
 * /demo/atlas, the storefront at /demo and the rest preview what the product
 * generates for a customer, and they keep their addresses under
 * zenyaai.co/demo/*.
 */
const DEMO_SUBDOMAIN_PAGES = new Set([
  'dashboard',
  'editor',
  // The one candidate that did NOT go live, because it was filed under the
  // wrong name. It restyles the restaurant wizard at /theme/new/restaurant,
  // not the Shopify builder at /build, and the wizard it proposes for sits
  // behind an account and runs a generator this public route cannot reach.
  // See app/demo/build/page.tsx.
  'build',
])

/**
 * Emptied by the promotion, kept as the hook it was.
 *
 * These were the candidates that are many addresses by nature — the eight
 * template detail pages under /websites, the seven competitor pages under
 * /compare, and /why. All of them are live routes now, so nothing needs
 * prefix-matching on this host. The mechanism stays because the next surface
 * that gets proposed here may well be another slug family, and re-deriving
 * it from the comment history is worse than leaving an empty array.
 */
const DEMO_SUBDOMAIN_PREFIXES: string[] = []

/**
 * Cheap "is this visitor logged in?" check for routing decisions — looks for
 * the presence of a Supabase auth-token cookie (sb-<ref>-auth-token, possibly
 * chunked). We don't validate it here; middleware just needs a signal to
 * decide whether to send a returning visitor to the accounts portal.
 */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
}

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

const GOOGLE_FILE_RE = /^\/google[a-z0-9]+\.html$/i

/**
 * Serve Google Search Console's "HTML file" verification at the site root
 * (slug.zenyaai.co/google<hash>.html) — but ONLY the exact filename the owner
 * saved (content.seo.gscFile), so nobody can verify someone else's site.
 * Returns a Response when the path is a google-file request (200 if it matches
 * the owner's file, 404 otherwise), or null when the path isn't one.
 */
async function gscFileResponse(slug: string, pathname: string): Promise<NextResponse | null> {
  if (!GOOGLE_FILE_RE.test(pathname)) return null
  const file = pathname.slice(1).toLowerCase()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !key) return new NextResponse('Not found', { status: 404 })
  try {
    const q = new URL(`${baseUrl}/rest/v1/themes`)
    q.searchParams.set('slug', `ilike.${slug}`)
    q.searchParams.set('is_published', 'eq.true')
    q.searchParams.set('select', 'content')
    q.searchParams.set('limit', '1')
    const r = await fetch(q.toString(), {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!r.ok) return new NextResponse('Not found', { status: 404 })
    const rows = (await r.json()) as Array<{ content?: any }>
    const stored = String(rows?.[0]?.content?.seo?.gscFile || '').toLowerCase()
    if (stored && stored === file) {
      return new NextResponse(`google-site-verification: ${file}`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      })
    }
    return new NextResponse('Not found', { status: 404 })
  } catch {
    return new NextResponse('Not found', { status: 404 })
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
  // whether to inject the Shopify App Bridge script tag for /shopify/*, and
  // whether the document is English (/en/*) or Arabic.
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
    // Google HTML-file verification, served from the site root.
    const gsc = await gscFileResponse(zenyaSlug, pathname)
    if (gsc) return gsc
    const url = request.nextUrl.clone()
    url.pathname = `/s/${zenyaSlug}${pathname === '/' ? '' : pathname}`
    // Mark this as a customer site so the root layout suppresses Zenya's own
    // Organization/SoftwareApplication JSON-LD (which would otherwise tell
    // Google the customer's page is "about Zenya").
    const h = new Headers(request.headers)
    h.set('x-zenya-site', '1')
    return NextResponse.rewrite(url, { request: { headers: h } })
  }

  // ---- demo.zenyaai.co → the two surfaces that are not pages ---------------
  // This host served the whole candidate set while the restyle was being
  // reviewed. The candidates are the site now, so what is left here is the
  // dashboard and the editor:
  //
  //   demo.zenyaai.co/           → /demo/dashboard
  //   demo.zenyaai.co/dashboard  → /demo/dashboard
  //   demo.zenyaai.co/editor     → /demo/editor
  //
  // Both are real product surfaces behind an account, rendered here against
  // fixture data so they can be looked at without signing in.
  //
  // The THEME demos are deliberately NOT here. /demo/restaurant, /demo/atlas,
  // the storefront at /demo and the rest preview what the product generates,
  // and they keep their addresses under zenyaai.co/demo/*.
  //
  // Anything not on the list is SENT TO THE APEX, and after the promotion
  // that is the point rather than a fallback: /pricing, /themes, /about and
  // every other former candidate is a real page at the root now, so a reader
  // arriving on an old demo link lands on the page it became.
  //
  // 307, not 308: the allowlist still moves — a permanent redirect would sit
  // in browser caches contradicting it the day another surface is proposed
  // on this host.
  //
  // Allowlisted paths are REWRITTEN, so the address stays on the subdomain.
  // Both remaining pages are noindex, so this host adds no duplicate.
  if (host === 'demo.zenyaai.co') {
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/s/')
    ) {
      return NextResponse.next()
    }

    const segment = pathname === '/' ? 'dashboard' : pathname.replace(/^\//, '').replace(/\/$/, '')
    if (
      DEMO_SUBDOMAIN_PAGES.has(segment) ||
      DEMO_SUBDOMAIN_PREFIXES.some((p) => segment.startsWith(p))
    ) {
      const url = request.nextUrl.clone()
      url.pathname = `/demo/${segment}`
      return NextResponse.rewrite(url)
    }

    // THE SAME PAGE AT ITS /demo/ ADDRESS STAYS ON THIS HOST.
    //
    // Both remaining pages are reached as /demo/dashboard and /demo/editor on
    // the apex, so those hrefs turn up on this host too. Falling through to
    // the redirect below would walk the reader out of the subdomain on the
    // first click.
    //
    // Redirected to the clean address rather than rewritten, so a page has
    // ONE url on this host and the reader sees demo.zenyaai.co/dashboard,
    // which is the whole point of the subdomain.
    if (segment.startsWith('demo/')) {
      const inner = segment.slice('demo/'.length)
      if (DEMO_SUBDOMAIN_PAGES.has(inner)) {
        const url = request.nextUrl.clone()
        url.pathname = `/${inner}`
        return NextResponse.redirect(url)
      }
    }

    return NextResponse.redirect(
      new URL(pathname + request.nextUrl.search, 'https://zenyaai.co'),
    )
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

    // Paths that already map to top-level routes — serve as-is (no rewrite to
    // /dashboard/*). This keeps the portal self-contained: the theme-creation
    // wizard, template browser, live preview/editor, and pricing/checkout all
    // live under app/(main)/* and would 404 if rewritten to /dashboard/<path>.
    // Serving them as-is lets dashboard.zenyaai.co/theme/new (etc.) render the
    // existing pages so users never bounce back to zenyaai.co.
    const PORTAL_PASSTHROUGH_PREFIXES = [
      '/login',
      '/auth',
      '/sign',
      '/theme',    // /theme/new + per-template wizards (also covers /themes)
      '/themes',   // template browser (explicit for clarity)
      '/demo',      // template demos (/demo, /demo/restaurant, …)
      '/demo-full', // full storefront demo
      '/preview',  // live preview + in-app editor (/preview/[id], /preview/[type]/[id]/edit)
      '/pricing',  // plan comparison / upgrade
      '/checkout', // subscribe flow reached from pricing
      '/build',    // one-product (Shopify) builder
      '/contact',  // support + review flow (/contact?topic=review)
      '/privacy',  // legal pages linked from settings
      '/terms',
      '/refund',
      '/cookies',
      '/subprocessors',
      '/about',
      '/faq',
    ]
    const alreadyRouted =
      pathname.startsWith('/dashboard') ||
      PORTAL_PASSTHROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

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

  // ---- accounts.zenyaai.co → auth portal (login / signup / chooser) ---------
  // Rewrites all paths to /accounts/* internally so the URL bar shows
  // accounts.zenyaai.co/login, accounts.zenyaai.co/signup, etc. These ARE the
  // auth pages, so we never redirect an unauthenticated visitor away.
  if (host === 'accounts.zenyaai.co') {
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/s/')
    ) {
      return NextResponse.next({ request: { headers: forwardedHeaders } })
    }

    // Refresh auth cookies (scoped to .zenyaai.co) so the session carries over
    // to dashboard.zenyaai.co after the user signs in / picks an account.
    const sessionRes = await updateSession(request)

    // Already under /accounts (or framework auth callbacks) — serve as-is.
    // Legal pages are allowed through so the signup consent links resolve on
    // the accounts host instead of 404ing.
    const ACCOUNTS_PASSTHROUGH = ['/terms', '/privacy', '/refund', '/cookies', '/subprocessors']
    const alreadyRouted =
      pathname.startsWith('/accounts') ||
      pathname.startsWith('/auth') ||
      ACCOUNTS_PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(p + '/'))

    if (!alreadyRouted) {
      const url = request.nextUrl.clone()
      url.pathname = pathname === '/' ? '/accounts' : `/accounts${pathname}`
      const rewriteRes = NextResponse.rewrite(url)
      sessionRes.headers.getSetCookie?.().forEach((c) =>
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
      // Google HTML-file verification, served from the domain root.
      const gsc = await gscFileResponse(found.slug, pathname)
      if (gsc) return gsc

      const url = request.nextUrl.clone()
      // sitemap.xml / robots.txt keep their path (per-site handlers); every
      // other path is a real page of the multi-page brochure and keeps its
      // pathname too so slug pages (/menu, /about…) resolve.
      url.pathname = `/s/${found.slug}${pathname === '/' ? '' : pathname}`
      const h = new Headers(request.headers)
      h.set('x-zenya-site', '1')
      return NextResponse.rewrite(url, { request: { headers: h } })
    }
    // Unknown custom host (DNS pointed at us but no `domains` row yet) —
    // fall through to the normal app so they at least see Zenya rather
    // than a generic error.
    return NextResponse.next({ request: { headers: forwardedHeaders } })
  }

  // ---- APEX: returning visitors → accounts portal ------------------------
  // A visitor who has logged in before (auth cookie present) landing on the
  // apex root is sent to accounts.zenyaai.co, which shows "continue as
  // <account>" → dashboard. New visitors (no cookie) get the marketing home.
  //
  // Exception: `?home=1` is the explicit "I actually want to see the marketing
  // site" signal (e.g. the dashboard's "back to marketing site" link). Without
  // it a logged-in user could never reach the homepage — they'd bounce straight
  // to accounts every time.
  if (
    (host === 'zenyaai.co' || host === 'www.zenyaai.co') &&
    pathname === '/' &&
    hasAuthCookie(request) &&
    request.nextUrl.searchParams.get('home') !== '1'
  ) {
    return NextResponse.redirect('https://accounts.zenyaai.co')
  }

  // ---- DIRECT CUSTOMER-SITE ACCESS (zenyaai.co/s/slug) -------------------
  // /s/* is exclusively the published-customer-site namespace. Flag it so the
  // root layout drops Zenya's own brand JSON-LD (subdomain/custom-domain hits
  // are flagged in their own branches above).
  if (pathname.startsWith('/s/')) {
    forwardedHeaders.set('x-zenya-site', '1')
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
  // Marketing path. Pass the augmented headers so `x-pathname` survives to the
  // root layout, which needs it to set lang/dir for the English section.
  return await updateSession(request, forwardedHeaders)
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
