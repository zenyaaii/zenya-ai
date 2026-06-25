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
    const msg = json.message || `Porkbun ${r.status}`
    // Porkbun rate-limits checkDomain at 1/10s and surfaces it as
    // "N out of M checks within 10 seconds used". Translate that to a
    // structured error so callers can show a friendly message + retry.
    const isRateLimit =
      /within\s+\d+\s+seconds?\s+used/i.test(msg) ||
      /rate\s*limit/i.test(msg) ||
      /too\s+many/i.test(msg)
    if (isRateLimit) {
      throw new PorkbunError(
        'Registrar is cooling down (1 check / 10s). Try again in a few seconds.',
        429,
        'rate_limited',
      )
    }
    throw new PorkbunError(msg, r.status || 502)
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

/* ── Cached lookups (in-process) ────────────────────────────────────── */

// Porkbun's checkDomain is capped at 1 call per 10 seconds. Two things
// trip on that in the dashboard: a bare-name search firing 4 lookups in
// parallel, and "Buy now" re-checking immediately after the search. We
// cache successful results for 5 minutes so the buy/search interplay
// uses one upstream call, and cache rate-limit failures briefly so the
// UI shows the retry hint without hammering the registrar.

type CheckCacheEntry =
  | { ok: PorkbunDomainCheck; expiresAt: number }
  | { err: PorkbunError; expiresAt: number }

const checkCache = new Map<string, CheckCacheEntry>()
const CHECK_OK_TTL_MS = 5 * 60_000
const CHECK_RATELIMIT_TTL_MS = 8_000

/**
 * checkDomain wrapped with a small in-process cache. Always prefer
 * this in API routes — direct calls to checkDomain() should be reserved
 * for cases that genuinely want a bypass.
 */
export async function checkDomainCached(domain: string): Promise<PorkbunDomainCheck> {
  const lower = domain.trim().toLowerCase()
  const hit = checkCache.get(lower)
  if (hit && hit.expiresAt > Date.now()) {
    if ('ok' in hit) return hit.ok
    throw hit.err
  }
  if (hit) checkCache.delete(lower)
  try {
    const r = await checkDomain(lower)
    checkCache.set(lower, { ok: r, expiresAt: Date.now() + CHECK_OK_TTL_MS })
    return r
  } catch (e) {
    const err = e as PorkbunError
    if (err.code === 'rate_limited') {
      checkCache.set(lower, { err, expiresAt: Date.now() + CHECK_RATELIMIT_TTL_MS })
    }
    throw err
  }
}

/* ── Pricing for all TLDs ───────────────────────────────────────────── */

export type PorkbunTldPricing = {
  /** First-year registration price, USD. Null if Porkbun didn't return it. */
  registration: number | null
  /** Renewal price/year, USD. */
  renewal: number | null
  /** Transfer price, USD. */
  transfer: number | null
}

type PricingRaw = {
  status: 'SUCCESS'
  pricing: Record<string, { registration: string; renewal: string; transfer: string }>
}

let pricingCache: { data: Record<string, PorkbunTldPricing>; expiresAt: number } | null = null
const PRICING_TTL_MS = 60 * 60_000

/**
 * Returns wholesale pricing for every TLD Porkbun sells. Endpoint is
 * unauthenticated and has no documented rate limit, but we still cache
 * for an hour — these numbers change rarely and the response is large.
 */
export async function getPricing(): Promise<Record<string, PorkbunTldPricing>> {
  if (pricingCache && pricingCache.expiresAt > Date.now()) return pricingCache.data
  const j = await pb<PricingRaw>('/pricing/get', {}, { auth: false })
  const out: Record<string, PorkbunTldPricing> = {}
  for (const [tld, p] of Object.entries(j.pricing || {})) {
    const reg = Number(p.registration)
    const ren = Number(p.renewal)
    const tr = Number(p.transfer)
    out[tld.toLowerCase()] = {
      registration: Number.isFinite(reg) ? reg : null,
      renewal: Number.isFinite(ren) ? ren : null,
      transfer: Number.isFinite(tr) ? tr : null,
    }
  }
  pricingCache = { data: out, expiresAt: Date.now() + PRICING_TTL_MS }
  return out
}

/* ── TLD registration requirements ──────────────────────────────────── */

export type PorkbunTldRequirements = {
  tld: string
  /** False for TLDs with registry eligibility the API can't submit. */
  apiRegisterable: boolean
  /** Fixed term (years) the create endpoint registers for — usually 1. */
  registrationDurationYears: number
  maxRegistrationYears: number | null
  whoisPrivacySupported: boolean
  registrantOnly: boolean
}

/**
 * Extract the registry suffix used by getRegistrationRequirements.
 * "musannef.shop" → "shop", "foo.co.uk" → "co.uk".
 */
function tldOf(domain: string): string {
  const d = domain.trim().toLowerCase().replace(/\.$/, '')
  const dot = d.indexOf('.')
  return dot === -1 ? d : d.slice(dot + 1)
}

/**
 * Ask Porkbun whether a TLD can be registered via the API and on what
 * terms. Call this BEFORE charging — `apiRegisterable: false` means we
 * must not take the customer's money (the registration can only be done
 * on porkbun.com, not via API).
 */
export async function getRegistrationRequirements(
  domainOrTld: string
): Promise<PorkbunTldRequirements> {
  const tld = domainOrTld.includes('.') ? tldOf(domainOrTld) : domainOrTld.toLowerCase()
  const j = await pb<any>(`/domain/getRegistrationRequirements/${encodeURIComponent(tld)}`)
  return {
    tld: j.tld || tld,
    apiRegisterable: !!j.apiRegisterable,
    registrationDurationYears: Number(j.registrationDurationYears) || 1,
    maxRegistrationYears: j.maxRegistrationYears != null ? Number(j.maxRegistrationYears) : null,
    whoisPrivacySupported: !!j.whoisPrivacySupported,
    registrantOnly: !!j.registrantOnly,
  }
}

/* ── Registration ───────────────────────────────────────────────────── */

export type PorkbunRegisterArgs = {
  /** Lowercase root domain, e.g. "mycoolstore.com". */
  domain: string
  /**
   * Registration cost in pennies (USD cents). MUST exactly equal
   * Porkbun's price for the minimum registration term — get it from
   * checkDomain()/checkDomainCached().price (× 100, rounded). A mismatch
   * is rejected by the registry, so we always source it from a fresh
   * price lookup, never a stored value.
   */
  costCents: number
  /**
   * Force WHOIS privacy on/off. Omit to use the account default (enabled
   * on Zenya's Porkbun account), which is what we want for end users.
   */
  whoisPrivacy?: boolean
  /**
   * When true, runs every pre-flight check (availability, price match,
   * eligibility, account funds, monthly spend limit) and returns a
   * preview WITHOUT registering or charging — and without consuming the
   * create rate-limit budget. We use this as a pre-charge gate so we
   * never bill a customer for a registration that would fail.
   */
  dryRun?: boolean
}

export type PorkbunRegisterResult = {
  domain: string
  /** Pennies actually charged (live) or that would be charged (dry run). */
  cost: number
  /** Internal Porkbun order id — present on a live registration only. */
  orderId?: number
  /** True when this was a dry-run preview. */
  dryRun?: boolean
  /** Dry run only: whether it would succeed given funds + spend limit. */
  wouldSucceed?: boolean
  /** Term in years that was / would be registered. */
  duration?: number
  /** Remaining Porkbun account balance in pennies. */
  balance?: number
  message?: string
}

/**
 * Register a domain via Porkbun's current API.
 *
 * Endpoint: POST /domain/create/{domain} (the v3.7 registration API).
 * The legacy /domain/register path this used to call no longer exists
 * and 404s — that was the bug behind "paid but no domain".
 *
 * Requires:
 *   • API domain registration enabled on the account
 *   • `cost` matching Porkbun's current price to the penny
 *   • Sufficient account balance (checked up-front via dryRun)
 *
 * Hard validation failures (unavailable / wrong price / ineligible TLD)
 * come back as a thrown PorkbunError. A soft failure (not enough funds)
 * on a dry run returns `wouldSucceed: false` instead of throwing.
 *
 * On a live success the domain is registered to Zenya's Porkbun account
 * (we are registrant of record; the end user is a soft-tenant), with
 * account-default nameservers — we then point DNS at Vercel separately.
 */
export async function registerDomain(args: PorkbunRegisterArgs): Promise<PorkbunRegisterResult> {
  const domain = args.domain.toLowerCase()
  const body: Record<string, any> = {
    cost: Math.round(args.costCents),
    agreeToTerms: 'yes',
  }
  if (typeof args.whoisPrivacy === 'boolean') body.whoisPrivacy = args.whoisPrivacy
  if (args.dryRun) body.dryRun = true

  const j = await pb<any>(`/domain/create/${encodeURIComponent(domain)}`, body)
  return {
    domain: j.domain || domain,
    cost: typeof j.cost === 'number' ? j.cost : Math.round(args.costCents),
    orderId: typeof j.orderId === 'number' ? j.orderId : undefined,
    dryRun: !!j.dryRun,
    wouldSucceed: typeof j.wouldSucceed === 'boolean' ? j.wouldSucceed : undefined,
    duration: typeof j.duration === 'number' ? j.duration : undefined,
    balance: typeof j.balance === 'number' ? j.balance : undefined,
    message: typeof j.message === 'string' ? j.message : undefined,
  }
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
