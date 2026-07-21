import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { publicSiteUrl } from '@/lib/portal-urls'
import { getValidAccessToken, listSites, matchProperty, querySearchAnalytics } from '@/lib/gsc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * GET /api/gsc/performance?themeId=...
 * Returns REAL Search Console data for the site (last 28 days): totals + top
 * queries. No fabrication — if there's no data or the site isn't added as a
 * property yet, we say so honestly with a `reason`.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const themeId = req.nextUrl.searchParams.get('themeId')
  if (!themeId) return NextResponse.json({ error: 'missing_theme' }, { status: 400 })

  const a = admin()

  // Ownership + slug lookup.
  const { data: theme } = await a
    .from('themes')
    .select('id, user_id, slug, is_published')
    .eq('id', themeId)
    .maybeSingle()
  if (!theme || theme.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!theme.slug || !theme.is_published) {
    return NextResponse.json({ connected: true, reason: 'not_published', rows: [] })
  }

  const accessToken = await getValidAccessToken(a, user.id)
  if (!accessToken) {
    return NextResponse.json({ connected: false, reason: 'not_connected' })
  }

  const siteUrl = publicSiteUrl(theme.slug) + '/'
  const properties = await listSites(accessToken)
  const property = matchProperty(siteUrl, properties)
  if (!property) {
    // They connected Google but haven't added this exact site as a property.
    return NextResponse.json({
      connected: true,
      reason: 'property_not_found',
      expectedProperty: siteUrl,
      availableProperties: properties,
    })
  }

  const end = new Date()
  const start = new Date(Date.now() - 28 * 24 * 3600 * 1000)
  const range = { startDate: ymd(start), endDate: ymd(end) }

  // Totals (no dimensions) + top queries (dimension=query).
  const [totalsRes, queriesRes] = await Promise.all([
    querySearchAnalytics(accessToken, property, { ...range, dimensions: [] }),
    querySearchAnalytics(accessToken, property, { ...range, dimensions: ['query'], rowLimit: 10 }),
  ])

  const t = totalsRes.rows[0]
  const totals = t
    ? { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position }
    : { clicks: 0, impressions: 0, ctr: 0, position: 0 }

  const queries = queriesRes.rows.map((r) => ({
    query: r.keys?.[0] ?? '',
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }))

  return NextResponse.json({
    connected: true,
    reason: totals.impressions === 0 ? 'no_data_yet' : 'ok',
    property,
    range,
    totals,
    queries,
  })
}
