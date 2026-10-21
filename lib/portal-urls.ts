import { ROOT_DOMAIN, SITE_URL, isCompanyHost, siteHost, siteUrl as customerSiteUrl } from './domain'

/**
 * Cross-subdomain navigation helpers.
 *
 * In production the portals live on real subdomains (accounts.beynoun.com,
 * dashboard.beynoun.com). On localhost / preview deployments there are no
 * subdomains, so we fall back to path-based routes (/accounts, /dashboard)
 * which the same code serves. Call these from the browser only.
 */
function isZenyaHost(): boolean {
  return typeof window !== 'undefined' && isCompanyHost(window.location.hostname)
}

export function dashboardUrl(path = ''): string {
  return isZenyaHost() ? `https://dashboard.${ROOT_DOMAIN}${path}` : `/dashboard${path}`
}

export const DASHBOARD_HOST = `dashboard.${ROOT_DOMAIN}`

/** "/dashboard" as a whole segment — not "/dashboard-foo". */
const DASHBOARD_PREFIX = /^\/dashboard(?=[/?#]|$)/

export function hasDashboardPrefix(path: string): boolean {
  return DASHBOARD_PREFIX.test(path)
}

/**
 * The address a dashboard page has on dashboard.beynoun.com.
 *
 * Every dashboard link in the code is written /dashboard/<page> because that
 * is the route, and on localhost it is also the address. On the portal host
 * the prefix is the host's job (middleware rewrites /sites → /dashboard/sites),
 * so spelling it again gives dashboard.beynoun.com/dashboard/sites.
 *
 *   /dashboard/sites?tab=x → /sites?tab=x      /dashboard → /
 */
export function dashboardPortalPath(path: string): string {
  if (!hasDashboardPrefix(path)) return path
  const rest = path.replace(DASHBOARD_PREFIX, '')
  return rest.startsWith('/') ? rest : `/${rest}`
}

/**
 * The inverse, for matching against route paths: the browser path on the
 * portal host (/sites) back to the route (/dashboard/sites). Paths that
 * already carry the prefix — localhost, the apex — come back unchanged.
 */
export function dashboardRoutePath(pathname: string): string {
  if (hasDashboardPrefix(pathname)) return pathname
  return pathname === '/' ? '/dashboard' : `/dashboard${pathname}`
}

export function accountsUrl(path = ''): string {
  return isZenyaHost() ? `https://accounts.${ROOT_DOMAIN}${path}` : `/accounts${path}`
}

/**
 * The public marketing site, for links drawn on a portal host.
 *
 * accounts.beynoun.com rewrites every unrouted path under /accounts (see
 * middleware.ts), so a relative <Link href="/pricing"> in the portal's header
 * resolves to /accounts/pricing and 404s. The header therefore needs the apex
 * spelled out. On localhost and preview deployments there are no subdomains
 * and the same app serves everything, so the relative path is correct there.
 */
export function siteUrl(path = ''): string {
  return isZenyaHost() ? `${SITE_URL}${path || '/'}` : path || '/'
}

/**
 * The public address of a published customer site: slug.beynoun.com.
 * This is the real live URL (a Vercel wildcard subdomain) regardless of which
 * host the dashboard is being viewed on — never the internal /s/<slug> path.
 */
export function publicSiteUrl(slug: string): string {
  return customerSiteUrl(slug)
}

/** Bare host form for display, e.g. "sidelong.beynoun.com". */
export function publicSiteHost(slug: string): string {
  return siteHost(slug)
}
