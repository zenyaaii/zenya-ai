/**
 * Cross-subdomain cookie scoping for zenyaai.co.
 *
 * Auth cookies are host-only by default, which means a session created on
 * accounts.zenyaai.co would NOT be sent to dashboard.zenyaai.co (or the apex).
 * To make one login work across every zenyaai.co surface, we scope the auth
 * cookies to the registrable domain `.zenyaai.co` in production.
 *
 * We deliberately return `undefined` for localhost and *.vercel.app preview
 * deployments so cookies stay host-only there (a `.zenyaai.co` domain would be
 * rejected by the browser on any other host, silently breaking auth).
 */
export function cookieDomainForHost(host?: string | null): string | undefined {
  if (!host) return undefined
  const h = host.split(':')[0].trim().toLowerCase()
  if (h === 'zenyaai.co' || h.endsWith('.zenyaai.co')) return '.zenyaai.co'
  return undefined
}
