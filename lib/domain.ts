/**
 * The one place the company's domain is spelled.
 *
 * The business is Beynoun, at beynoun.com. It was Zenya, at zenyaai.co, and
 * that domain is kept: every link already sent out (customer sites, WhatsApp
 * messages, Google's index) points at it. middleware.ts sends each page on
 * the old domain to the same page on the new one, subdomain and all, so
 * slug.zenyaai.co/menu lands on slug.beynoun.com/menu.
 *
 * Safe for the edge runtime and the browser: no imports.
 */
export const ROOT_DOMAIN = 'beynoun.com'

/** The old domain. Hosts on it redirect; nothing new is ever minted on it. */
export const LEGACY_DOMAIN = 'zenyaai.co'

export const SITE_URL = `https://${ROOT_DOMAIN}`

/** A customer site's address: `slug.beynoun.com`. */
export function siteHost(slug: string): string {
  return `${slug}.${ROOT_DOMAIN}`
}

export function siteUrl(slug: string): string {
  return `https://${siteHost(slug)}`
}

function bare(host?: string | null): string {
  return (host || '').split(':')[0].trim().toLowerCase()
}

/** The apex or any subdomain of the given domain. */
function onDomain(host: string | null | undefined, domain: string): boolean {
  const h = bare(host)
  return h === domain || h.endsWith(`.${domain}`)
}

export function isRootDomainHost(host?: string | null): boolean {
  return onDomain(host, ROOT_DOMAIN)
}

export function isLegacyHost(host?: string | null): boolean {
  return onDomain(host, LEGACY_DOMAIN)
}

/** One of ours, on either domain. */
export function isCompanyHost(host?: string | null): boolean {
  return isRootDomainHost(host) || isLegacyHost(host)
}

/**
 * The same host on the new domain: `slug.zenyaai.co` → `slug.beynoun.com`,
 * `zenyaai.co` → `beynoun.com`. Null for any host not on the old domain.
 */
export function rootHostFor(legacyHost: string): string | null {
  const h = bare(legacyHost)
  if (h === LEGACY_DOMAIN) return ROOT_DOMAIN
  if (h.endsWith(`.${LEGACY_DOMAIN}`)) return `${h.slice(0, -LEGACY_DOMAIN.length)}${ROOT_DOMAIN}`
  return null
}
