import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkDomainCached, retailPrice, PorkbunError } from '@/lib/porkbun'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HOSTNAME = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

/**
 * GET /api/domains/check?domain=foo.com
 *
 * One-shot availability check for a single domain. The "Find a domain"
 * widget calls this when the user clicks the "Check" button on a
 * specific row. Backed by the shared in-process cache so a buy-now
 * click moments later reuses the same lookup.
 *
 * Always responds with 200 + a result object. Rate-limit failures are
 * conveyed via `error_code: 'rate_limited'` rather than HTTP 429 so the
 * frontend can render an inline "cooling down, retry in Ns" hint
 * without falling into generic error UX.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const raw = (new URL(req.url).searchParams.get('domain') || '').trim().toLowerCase()
  if (!raw || !HOSTNAME.test(raw)) {
    return NextResponse.json({ error: 'invalid_domain' }, { status: 400 })
  }

  try {
    const r = await checkDomainCached(raw)
    return NextResponse.json({
      domain: raw,
      available: r.available,
      checked: true,
      wholesale_usd_year: r.price,
      renewal_wholesale_usd_year: r.regularPrice,
      retail_usd_year: r.price != null ? retailPrice(r.price) : null,
      premium: r.premium,
      first_year_promo: r.firstYearPromo,
    })
  } catch (e) {
    const err = e as PorkbunError
    return NextResponse.json({
      domain: raw,
      available: null,
      checked: err.code !== 'rate_limited',
      wholesale_usd_year: null,
      renewal_wholesale_usd_year: null,
      retail_usd_year: null,
      premium: false,
      first_year_promo: false,
      error_code: err.code || 'lookup_failed',
      message: err.message || 'Lookup failed',
      retry_after_seconds: err.code === 'rate_limited' ? 10 : undefined,
    })
  }
}
