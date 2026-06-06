import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkDomainAvailability } from '@/lib/vercel-domains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HOSTNAME = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

/**
 * GET /api/domains/search?q=<name>
 *
 * Checks availability and price for a candidate root domain via Vercel's
 * registrar API. Used by the "Find a domain" widget on /dashboard/domains so
 * users can see whether the name they want is real and what it costs.
 *
 * If the user provides a bare label ("mycoolstore") with no TLD, we expand
 * it to a small set of common TLDs (.com, .co, .app) and look up each one
 * so the UX feels like a real domain search.
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

  const results = await Promise.all(valid.map((d) => checkDomainAvailability(d)))
  return NextResponse.json({ query: q, results })
}
