/**
 * Typed wrapper around the Porkbun JSON API.
 *
 * Porkbun is our domain registration backend — users buy new domains
 * through Zenya, we mark up the wholesale price, attach the result to
 * the user's Vercel project, and point DNS at Vercel automatically.
 *
 * Env required:
 *   PORKBUN_API_KEY        — `pk1_…` from porkbun.com/account/api
 *   PORKBUN_SECRET_API_KEY — `sk1_…` from the same page
 *
 * Notes:
 *   • All endpoints are POST. Auth goes in the JSON body, not headers
 *     (unusual but that's Porkbun's spec).
 *   • Pricing/availability calls don't need an enabled-API account.
 *     Register/listAll/DNS calls DO — flip "API Access" ON in the
 *     account settings, and top up an account balance for registers.
 *   • Base URL is intentionally hard-coded; Porkbun has never moved it
 *     and the docs say it's stable.
 *
 * Reference: https://porkbun.com/api/json/v3/documentation
 */

const PORKBUN_BASE = 'https://api.porkbun.com/api/json/v3'

export class PorkbunError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function creds() {
  const apikey = process.env.PORKBUN_API_KEY
  const secretapikey = process.env.PORKBUN_SECRET_API_KEY
  if (!apikey) throw new PorkbunError('PORKBUN_API_KEY is not set', 500, 'missing_key')
  if (!secretapikey) throw new PorkbunError('PORKBUN_SECRET_API_KEY is not set', 500, 'missing_secret')
  return { apikey, secretapikey }
}

type PorkbunOk<T> = { status: 'SUCCESS' } & T
type PorkbunErr = { status: 'ERROR'; message: string }
type PorkbunResp<T> = PorkbunOk<T> | PorkbunErr

async function pb<T>(path: string, body: Record<string, any> = {}, opts?: { auth?: boolean }): Promise<T> {
  const withAuth = opts?.auth !== false
  const fullBody = withAuth ? { ...creds(), ...body } : body

  const r = await fetch(`${PORKBUN_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullBody),
    cache: 'no-store',
  })
  const text = await r.text()
  let json: PorkbunResp<T>
  try {
    json = text ? JSON.parse(text) : ({ status: 'ERROR', message: 'empty response' } as PorkbunErr)
  } catch {
    throw new PorkbunError(`Porkbun returned non-JSON: ${text.slice(0, 200)}`, r.status)
  }

  if (json.status === 'ERROR') {
    throw new PorkbunError(json.message || `Porkbun ${r.status}`, r.status || 502)
  }
  if (!r.ok) {
    throw new PorkbunError(`Porkbun ${r.status}`, r.status)
  }
  return json as T
}

/* ── Connectivity test ───────────────────────────────────────────────── */

/**
 * Cheapest call that exercises auth. Returns the public IP Porkbun sees,
 * which is useful when debugging "why does my API key 403" — Porkbun lets
 * you optionally bind keys to specific IPs.
 */
export async function ping(): Promise<{ yourIp: string }> {
  return pb<{ status: 'SUCCESS'; yourIp: string }>('/ping')
}

/* ── Availability + pricing ─────────────────────────────────────────── */

export type PorkbunDomainCheck = {
  /** True if the domain is registrable right now. */
  available: boolean
  /** First-year wholesale price in USD (string from Porkbun, parsed to number here). */
  price: number | null
  /** Renewal price/year in USD. */
  regularPrice: number | null
  /** Some TLDs (especially new ones) have premium tiers — surface that. */
  premium: boolean
  /** True if this is in the registry's reserved/blocklist range. */
  firstYearPromo: boolean
}

type CheckDomainRaw = {
  status: 'SUCCESS'
  response: {
    avail: 'yes' | 'no'
    price: string
    regularPrice: string
    premium: 'yes' | 'no'
    firstYearPromo: 'yes' | 'no'
  }
  limits: { TTL: number; used: number; naturalLanguage: string }
}

/**
 * Check a single domain. Doesn't require API access to be enabled —
 * the check endpoint works on read-only credentials. Returns `null`
 * prices when Porkbun didn't give us a usable number.
 */
export async function checkDomain(domain: string): Promise<PorkbunDomainCheck> {
  const lower = domain.trim().toLowerCase()
  const raw = await pb<CheckDomainRaw>(`/domain/checkDomain/${encodeURIComponent(lower)}`)
  const r = raw.response
  const price = Number(r.price)
  const reg = Number(r.regularPrice)
  return {
    available: r.avail === 'yes',
    price: Number.isFinite(price) ? price : null,
    regularPrice: Number.isFinite(reg) ? reg : null,
    premium: r.premium === 'yes',
    firstYearPromo: r.firstYearPromo === 'yes',
  }
}

/* ── Registration ───────────────────────────────────────────────────── */

export type PorkbunRegisterArgs = {
  /** Lowercase root domain, e.g. "mycoolstore.com". */
  domain: string
  /** Years to register for. Porkbun max is 10. */
  years: number
  /** Optional WHOIS contacts; if omitted, Porkbun uses your account default. */
  contacts?: {
    registrant?: PorkbunContact
    admin?: PorkbunContact
    tech?: PorkbunContact
    billing?: PorkbunContact
  }
  /**
   * Nameservers to set immediately on registration. Pass Vercel's NS
   * here so the domain is ready to attach as soon as it registers.
   * Vercel's NS: ns1.vercel-dns.com, ns2.vercel-dns.com
   */
  nameservers?: string[]
}

export type PorkbunContact = {
  firstName: string
  lastName: string
  organization?: string
  email: string
  phone: string
  address1: string
  city: string
  state?: string
  country: string  // ISO-2
  zipcode: string
}

/**
 * Register a domain. Requires:
 *   • API access enabled on the account
 *   • Sufficient account balance to cover Porkbun's wholesale price
 * On success, the domain is registered to the Porkbun account that
 * owns the API key — we are the registrant of record, the end user is
 * a soft-tenant.
 */
export async function registerDomain(args: PorkbunRegisterArgs): Promise<{ domain: string }> {
  const body: Record<string, any> = {
    domain: args.domain.toLowerCase(),
    years: args.years,
  }
  if (args.nameservers && args.nameservers.length) {
    args.nameservers.slice(0, 4).forEach((ns, i) => {
      body[`ns${i + 1}`] = ns
    })
  }
  if (args.contacts) {
    // Porkbun flattens contact fields into `<type>FirstName`, etc.
    const types: (keyof NonNullable<PorkbunRegisterArgs['contacts']>)[] = [
      'registrant', 'admin', 'tech', 'billing',
    ]
    for (const t of types) {
      const c = args.contacts[t]
      if (!c) continue
      const prefix = t
      for (const [k, v] of Object.entries(c)) {
        body[`${prefix}${k.charAt(0).toUpperCase()}${k.slice(1)}`] = v
      }
    }
  }
  return pb<{ status: 'SUCCESS' } & { domain: string }>('/domain/register', body)
}

/* ── Listing / inventory ────────────────────────────────────────────── */

export type PorkbunOwnedDomain = {
  domain: string
  status: string
  tld: string
  createDate: string
  expireDate: string
  securityLock: '0' | '1'
  whoisPrivacy: '0' | '1'
  autoRenew: 0 | 1
  notLocal: 0 | 1
}

export async function listAllDomains(start = 0): Promise<PorkbunOwnedDomain[]> {
  const j = await pb<{ status: 'SUCCESS'; domains: PorkbunOwnedDomain[] }>(
    '/domain/listAll',
    { start: String(start), includeLabels: 'no' }
  )
  return j.domains
}

/* ── Nameservers ────────────────────────────────────────────────────── */

export async function getNameservers(domain: string): Promise<string[]> {
  const j = await pb<{ status: 'SUCCESS'; ns: string[] }>(
    `/domain/getNs/${encodeURIComponent(domain.toLowerCase())}`
  )
  return j.ns
}

export async function updateNameservers(domain: string, ns: string[]): Promise<void> {
  await pb(`/domain/updateNs/${encodeURIComponent(domain.toLowerCase())}`, { ns })
}

/* ── DNS records ────────────────────────────────────────────────────── */

export type PorkbunDnsRecord = {
  name: string  // subdomain — empty string for apex
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'ALIAS' | 'CAA'
  content: string
  ttl?: number  // seconds; default 600
  prio?: number // MX records
}

export async function createDnsRecord(domain: string, rec: PorkbunDnsRecord): Promise<{ id: number }> {
  const body: Record<string, any> = {
    name: rec.name,
    type: rec.type,
    content: rec.content,
  }
  if (rec.ttl) body.ttl = String(rec.ttl)
  if (rec.prio != null) body.prio = String(rec.prio)
  const j = await pb<{ status: 'SUCCESS'; id: number }>(
    `/dns/create/${encodeURIComponent(domain.toLowerCase())}`,
    body
  )
  return { id: j.id }
}

export async function retrieveDnsRecords(domain: string): Promise<Array<PorkbunDnsRecord & { id: string }>> {
  const j = await pb<{
    status: 'SUCCESS'
    records: Array<{ id: string; name: string; type: string; content: string; ttl: string; prio?: string }>
  }>(`/dns/retrieve/${encodeURIComponent(domain.toLowerCase())}`)
  return j.records.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as PorkbunDnsRecord['type'],
    content: r.content,
    ttl: Number(r.ttl) || 600,
    prio: r.prio != null ? Number(r.prio) : undefined,
  }))
}

export async function deleteDnsRecord(domain: string, recordId: string | number): Promise<void> {
  await pb(`/dns/delete/${encodeURIComponent(domain.toLowerCase())}/${recordId}`)
}

/* ── Retail pricing helpers ─────────────────────────────────────────── */

/**
 * Convert Porkbun's wholesale first-year price into the price we charge
 * the end user. Strategy: fixed markup ($4) plus a small percentage
 * (10%), rounded to the nearest .99 to look like a real retail price.
 *
 * Tuned so a wholesale $10.13 .com becomes $15.99/year, leaving ~$5.86
 * gross margin per registration. Renewals follow the same rule.
 *
 * Override by setting PORKBUN_RETAIL_MARKUP_USD / PORKBUN_RETAIL_MARGIN
 * in env — useful for promotional periods.
 */
export function retailPrice(wholesale: number): number {
  const flat = Number(process.env.PORKBUN_RETAIL_MARKUP_USD ?? '4')
  const pct = Number(process.env.PORKBUN_RETAIL_MARGIN ?? '0.10')
  const raw = wholesale * (1 + pct) + flat
  // Round up to next .99 — feels like a price, not a number.
  return Math.ceil(raw) - 0.01
}
