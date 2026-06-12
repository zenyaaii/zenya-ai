import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  checkDomainCached,
  getPricing,
  retailPrice,
  PorkbunError,
  type PorkbunTldPricing,
} from '@/lib/porkbun'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HOSTNAME = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

/**
 * TLDs offered to a bare-name search. Ordered by relevance for a
 * Shopify/storefront audience: .com first, then store-friendly
 * extensions, then tech/personal-brand ones. Porkbun's 1-check/10-sec
 * rate limit means we DON'T pre-check all of these — we render them
 * with prices and let the user click "Check" per row.
 */
const BARE_TLDS = [
  'com', 'co', 'shop', 'store',
  'net', 'io', 'app', 'ai',
  'dev', 'me',
]

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

type SearchResult = {
  domain: string
  /**
   * Tri-state availability:
   *   true  = Porkbun confirmed available
   *   false = Porkbun confirmed registered
   *   null  = not checked yet OR lookup failed (see `checked`)
   */
  available: boolean | null
  /** True if we actually attempted a checkDomain call. Distinguishes
   *  "we haven't asked yet" (false) from "we asked and it failed" (true + null). */
  checked: boolean
  wholesale_usd_year: number | null
  renewal_wholesale_usd_year: number | null
  retail_usd_year: number | null
  premium: boolean
  first_year_promo: boolean
  error_code?: string
  message?: string
}

function priceRow(domain: string, pricing: Record<string, PorkbunTldPricing>): SearchResult {
  const tld = domain.split('.').slice(-1)[0]
  const p = pricing[tld]
  const wholesale = p?.registration ?? null
  return {
    domain,
    available: null,
    checked: false,
    wholesale_usd_year: wholesale,
    renewal_wholesale_usd_year: p?.renewal ?? null,
    retail_usd_year: wholesale != null ? retailPrice(wholesale) : null,
    premium: false,
    first_year_promo: false,
  }
}

async function lookup(domain: string, pricing: Record<string, PorkbunTldPricing>): Promise<SearchResult> {
  try {
    const r = await checkDomainCached(domain)
    return {
      domain,
      available: r.available,
      checked: true,
      wholesale_usd_year: r.price,
      renewal_wholesale_usd_year: r.regularPrice,
      retail_usd_year: r.price != null ? retailPrice(r.price) : null,
      premium: r.premium,
      first_year_promo: r.firstYearPromo,
    }
  } catch (e) {
    const err = e as PorkbunError
    // Rate-limit → fall back to pricing-only row so the UI shows the
    // price and a Check button instead of a scary "couldn't check".
    if (err.code === 'rate_limited') {
      const row = priceRow(domain, pricing)
      row.error_code = 'rate_limited'
      row.message = err.message
      return row
    }
    return {
      ...priceRow(domain, pricing),
      checked: true,
      error_code: err.code || 'lookup_failed',
      message: err.message || 'Lookup failed',
    }
  }
}

/**
 * GET /api/domains/search?q=<name>
 *
 * Returns candidate domains with retail prices. Behaviour depends on
 * the query shape:
 *
 *   • Dotted (`mysite.com`)  — checks that specific domain via Porkbun.
 *   • Bare (`mysite`)         — expands to a curated TLD list, pulls
 *     wholesale prices from Porkbun's unlimited /pricing/get, and
 *     pre-checks ONLY the .com so the user has at least one row with a
 *     confirmed status. The rest come back `checked: false` so the
 *     frontend can render a per-row "Check" button — that respects the
 *     1-per-10s rate limit naturally (one click → one call).
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const q = normalize(new URL(req.url).searchParams.get('q') || '')
  if (!q) {
    return NextResponse.json({ error: 'missing_query' }, { status: 400 })
  }

  const dotted = q.includes('.')
  // Pricing is best-effort — if Porkbun is down or the env keys aren't
  // wired up, we still render the search with null prices rather than
  // crashing the page.
  let pricing: Record<string, PorkbunTldPricing> = {}
  try { pricing = await getPricing() } catch (e) {
    console.warn('[/api/domains/search] pricing/get failed:', (e as Error).message)
  }

  if (dotted) {
    if (!HOSTNAME.test(q)) {
      return NextResponse.json(
        { error: 'invalid_domain', message: 'That doesn’t look like a domain. Try mycoolstore.com or just mycoolstore.' },
        { status: 400 }
      )
    }
    const result = await lookup(q, pricing)
    return NextResponse.json({ query: q, results: [result] })
  }

  const candidates = BARE_TLDS.map((tld) => `${q}.${tld}`).filter((c) => HOSTNAME.test(c))
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: 'invalid_query', message: 'Use letters, numbers, and hyphens — no spaces.' },
      { status: 400 }
    )
  }

  // Return all candidates with retail prices and `checked: false`. The
  // dashboard runs availability lookups one-at-a-time from the browser,
  // paced to Porkbun's 1-check-per-10-seconds budget. We deliberately
  // do NOT pre-check anything here — the server response would consume
  // the budget the client is about to use for the first row.
  const results: SearchResult[] = candidates.map((c) => priceRow(c, pricing))
  return NextResponse.json({ query: q, results })
}
