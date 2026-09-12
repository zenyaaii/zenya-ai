/**
 * Cross-subdomain navigation helpers.
 *
 * In production the portals live on real subdomains (accounts.zenyaai.co,
 * dashboard.zenyaai.co). On localhost / preview deployments there are no
 * subdomains, so we fall back to path-based routes (/accounts, /dashboard)
 * which the same code serves. Call these from the browser only.
 */
function isZenyaHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('zenyaai.co')
}

export function dashboardUrl(path = ''): string {
  return isZenyaHost() ? `https://dashboard.zenyaai.co${path}` : `/dashboard${path}`
}

export function accountsUrl(path = ''): string {
  return isZenyaHost() ? `https://accounts.zenyaai.co${path}` : `/accounts${path}`
}

/**
 * The public marketing site, for links drawn on a portal host.
 *
 * accounts.zenyaai.co rewrites every unrouted path under /accounts (see
 * middleware.ts), so a relative <Link href="/pricing"> in the portal's header
 * resolves to /accounts/pricing and 404s. The header therefore needs the apex
 * spelled out. On localhost and preview deployments there are no subdomains
 * and the same app serves everything, so the relative path is correct there.
 */
export function siteUrl(path = ''): string {
  return isZenyaHost() ? `https://zenyaai.co${path || '/'}` : path || '/'
}

/**
 * The public address of a published customer site: slug.zenyaai.co.
 * This is the real live URL (a Vercel wildcard subdomain) regardless of which
 * host the dashboard is being viewed on — never the internal /s/<slug> path.
 */
export function publicSiteUrl(slug: string): string {
  return `https://${slug}.zenyaai.co`
}

/** Bare host form for display, e.g. "sidelong.zenyaai.co". */
export function publicSiteHost(slug: string): string {
  return `${slug}.zenyaai.co`
}
