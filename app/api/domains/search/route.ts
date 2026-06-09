import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkDomain, retailPrice, PorkbunError } from '@/lib/porkbun'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HOSTNAME = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

type SearchResult = {
  domain: string
  available: boolean | null
  /** Wholesale first-year USD price from Porkbun. Null if not surfaced. */
  wholesale_usd_year: number | null
  /** Wholesale renewal USD price/year. Null if not surfaced. */
  renewal_wholesale_usd_year: number | null
  /** Retail price WE charge — wholesale + markup, rounded to .99. */
  retail_usd_year: number | null
  /** Whether this is a registry-premium domain (higher tier). */
  premium: boolean
  /** Porkbun's "first-year promo" flag (lower than renewal). */
  first_year_promo: boolean
  error_code?: string
  message?: string
}

async function lookup(domain: string): Promise<SearchResult> {
  try {
    const r = await checkDomain(domain)
    return {
      domain,
      available: r.available,
      wholesale_usd_year: r.price,
      renewal_wholesale_usd_year: r.regularPrice,
      retail_usd_year: r.price != null ? retailPrice(r.price) : null,
      premium: r.premium,
      first_year_promo: r.firstYearPromo,
    }
  } catch (e: any) {
    const err = e as PorkbunError
    return {
      domain,
      available: null,
      wholesale_usd_year: null,
      renewal_wholesale_usd_year: null,
      retail_usd_year: null,
      premium: false,
      first_year_promo: false,
      error_code: err.code || 'lookup_failed',
      message: err.message || 'Lookup failed',
    }
  }
}

/**
 * GET /api/domains/search?q=<name>
 *
 * Checks availability and retail price for a candidate root domain via
 * Porkbun. Used by the "Find a domain" widget on /dashboard/domains so
 * users can see whether the name they want is real and what it costs
 * (with our markup baked in — see lib/porkbun.ts:retailPrice).
 *
 * If the user provides a bare label ("mycoolstore") with no TLD, we
 * expand it to a small set of common TLDs (.com, .co, .app, .shop) and
 * look up each one so the UX feels like a real domain search.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const q = normalize(new URL(req.url).searchParams.get('q') || '')
  if (!q) {
    return NextResponse.json({ error: 'missing_query' }, { status: 400 })
  }

  const candidates: string[] = q.includes('.')
    ? [q]
    : [`${q}.com`, `${q}.co`, `${q}.app`, `${q}.shop`]

  const valid = candidates.filter((c) => HOSTNAME.test(c))
  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'invalid_domain', message: 'Use the format mycoolstore.com or just mycoolstore.' },
      { status: 400 }
    )
  }

  const results = await Promise.all(valid.map(lookup))

  // If every lookup failed for the same reason (e.g. missing
  // PORKBUN_API_KEY or an upstream auth error), don't silently show a
  // row of yellow pills — surface it as a server error so the operator
  // sees what to fix.
  const allFailed = results.length > 0 && results.every((r) => r.available === null)
  if (allFailed) {
    const first = results[0]
    console.error('[/api/domains/search] all lookups failed:', {
      code: first.error_code, message: first.message,
    })
    return NextResponse.json(
      {
        error: first.error_code || 'lookup_failed',
        message: first.message || 'Domain availability lookup is currently unavailable.',
        results,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ query: q, results })
}
