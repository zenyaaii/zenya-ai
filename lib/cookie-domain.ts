import { LEGACY_DOMAIN, ROOT_DOMAIN, isLegacyHost, isRootDomainHost } from './domain'

/**
 * Cross-subdomain cookie scoping for beynoun.com.
 *
 * Auth cookies are host-only by default, which means a session created on
 * accounts.beynoun.com would NOT be sent to dashboard.beynoun.com (or the
 * apex). To make one login work across every surface, we scope the auth
 * cookies to the registrable domain `.beynoun.com` in production.
 *
 * The old domain, beynoun.com, still answers its API and auth paths (see
 * middleware.ts), so a request there keeps scoping to `.beynoun.com` — a
 * `.beynoun.com` cookie would be rejected by the browser on that host.
 *
 * We deliberately return `undefined` for localhost and *.vercel.app preview
 * deployments so cookies stay host-only there (a foreign domain would be
 * rejected by the browser on any other host, silently breaking auth).
 */
export function cookieDomainForHost(host?: string | null): string | undefined {
  if (isRootDomainHost(host)) return `.${ROOT_DOMAIN}`
  if (isLegacyHost(host)) return `.${LEGACY_DOMAIN}`
  return undefined
}
