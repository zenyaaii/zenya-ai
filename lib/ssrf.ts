import dns from 'node:dns/promises'
import net from 'node:net'

/**
 * SSRF guard for any endpoint that fetches a *user-supplied* URL server-side
 * (the product scraper, image importers, etc.).
 *
 * Without this, an attacker can point us at internal-only addresses —
 * `http://localhost`, `http://169.254.169.254/` (cloud metadata), private
 * RFC-1918 ranges, link-local — and use our server as a proxy into the
 * private network. zod's `.url()` does NOT catch this: it happily accepts
 * `http://169.254.169.254`.
 *
 * Strategy:
 *   1. Only allow http/https (no file:, ftp:, gopher:, data:, …).
 *   2. Resolve the hostname to its actual IPs and reject if ANY of them is
 *      private/reserved. Resolving defeats DNS-rebinding-style tricks where
 *      a public-looking hostname points at 127.0.0.1.
 *
 * Note: this validates the *initial* URL. Callers that follow redirects
 * should fetch with `redirect: 'manual'` and re-validate the Location, or
 * accept the residual redirect risk (documented at the call site).
 */

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlockedUrlError'
  }
}

function ipIsPrivate(ip: string): boolean {
  const type = net.isIP(ip)
  if (type === 4) {
    const p = ip.split('.').map(Number)
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true
    const [a, b] = p
    if (a === 10) return true // 10.0.0.0/8
    if (a === 127) return true // loopback
    if (a === 0) return true // 0.0.0.0/8
    if (a === 169 && b === 254) return true // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
    if (a === 192 && b === 168) return true // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT 100.64.0.0/10
    if (a >= 224) return true // multicast / reserved
    return false
  }
  if (type === 6) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true // loopback / unspecified
    if (v.startsWith('fe80')) return true // link-local
    if (v.startsWith('fc') || v.startsWith('fd')) return true // unique-local
    // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return ipIsPrivate(mapped[1])
    return false
  }
  return true // not a valid IP — fail closed
}

/**
 * Throws BlockedUrlError if the URL is not a public http(s) URL.
 * Returns the parsed URL on success.
 */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new BlockedUrlError('Invalid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BlockedUrlError(`Unsupported protocol: ${url.protocol}`)
  }

  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets

  // If the host is already a literal IP, check it directly — no DNS needed.
  if (net.isIP(host)) {
    if (ipIsPrivate(host)) throw new BlockedUrlError('URL points to a private address')
    return url
  }

  // Block obvious internal hostnames before paying for a DNS lookup.
  const lower = host.toLowerCase()
  if (lower === 'localhost' || lower.endsWith('.localhost') || lower.endsWith('.internal') || lower.endsWith('.local')) {
    throw new BlockedUrlError('URL points to an internal hostname')
  }

  // Resolve and reject if any answer is a private/reserved IP.
  let addrs: { address: string }[]
  try {
    addrs = await dns.lookup(host, { all: true })
  } catch {
    throw new BlockedUrlError('Could not resolve host')
  }
  if (!addrs.length) throw new BlockedUrlError('Host did not resolve')
  for (const { address } of addrs) {
    if (ipIsPrivate(address)) throw new BlockedUrlError('URL resolves to a private address')
  }

  return url
}
