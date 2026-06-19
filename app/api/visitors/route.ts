import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/** Coarse device class from a user-agent string. */
function deviceFromUA(ua: string | null): string {
  if (!ua) return 'Unknown'
  const s = ua.toLowerCase()
  if (/ipad|tablet|playbook|silk|kindle|(android(?!.*mobile))/.test(s)) return 'Tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(s)) return 'Mobile'
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/.test(s)) return 'Bot'
  return 'Desktop'
}

function refHost(referrer: string | null): string {
  if (!referrer) return 'Direct'
  try { return new URL(referrer).hostname.replace(/^www\./, '') } catch { return referrer }
}

/**
 * GET /api/visitors?site=<themeId>&limit=150
 *
 * Per-visit detail for the signed-in user's Zenya-hosted sites. Each row in
 * site_views is one pageview; without cookies we treat a pageview as a visit
 * (an honest proxy). Powers /dashboard/visitors.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const siteFilter = url.searchParams.get('site') || ''
  const limit = Math.min(500, Math.max(10, Number(url.searchParams.get('limit')) || 150))

  const a = admin()
  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const since7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  // The user's themes → id → { name, template, slug }
  const { data: themesRaw } = await a
    .from('themes')
    .select('id, product_name, slug, template_type, content, is_published')
    .eq('user_id', user.id)
  const themes = themesRaw || []
  const meta: Record<string, { name: string; template: string; slug: string | null }> = {}
  for (const t of themes) {
    meta[t.id] = {
      name: t.product_name || t.slug || 'Untitled',
      template:
        (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
        t.template_type || 'storefront',
      slug: t.slug || null,
    }
  }

  let themeIds = themes.map((t) => t.id)
  if (siteFilter && meta[siteFilter]) themeIds = [siteFilter]

  let rows: Array<{ id: number; created_at: string; theme_id: string | null; country: string | null; referrer: string | null; user_agent: string | null }> = []
  if (themeIds.length > 0) {
    const { data } = await a
      .from('site_views')
      .select('id, created_at, theme_id, country, referrer, user_agent')
      .in('theme_id', themeIds)
      .gte('created_at', since30.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)
    rows = data || []
  }

  // For summary stats over the full 30d window (not just the page slice), pull a
  // lightweight count set. Reuse `rows` when it already covers everything.
  let statRows = rows
  if (rows.length >= limit && themeIds.length > 0) {
    const { data } = await a
      .from('site_views')
      .select('created_at, country, referrer, user_agent')
      .in('theme_id', themeIds)
      .gte('created_at', since30.toISOString())
      .limit(10000)
    statRows = (data as any) || rows
  }

  const recent = rows.map((r) => {
    const m = r.theme_id ? meta[r.theme_id] : undefined
    return {
      id: r.id,
      at: r.created_at,
      site_name: m?.name || 'Unknown site',
      template: m?.template || '—',
      slug: m?.slug || null,
      country: r.country || null,
      device: deviceFromUA(r.user_agent),
      source: refHost(r.referrer),
    }
  })

  const tally = (key: 'country' | 'source' | 'device') => {
    const out: Record<string, number> = {}
    for (const r of statRows) {
      let v: string
      if (key === 'country') v = (r.country as string) || 'Unknown'
      else if (key === 'source') v = refHost((r as any).referrer)
      else v = deviceFromUA((r as any).user_agent)
      if (!v) continue
      out[v] = (out[v] || 0) + 1
    }
    return Object.entries(out).sort(([, a2], [, b2]) => b2 - a2).map(([name, count]) => ({ name, count }))
  }

  const visits7d = statRows.filter((r) => new Date(r.created_at) >= since7).length
  const visits30d = statRows.length
  const byCountry = tally('country')
  const bySource = tally('source')
  const byDevice = tally('device')

  const sites = themes
    .filter((t) => t.is_published && t.slug)
    .map((t) => ({ id: t.id, name: meta[t.id].name }))

  return NextResponse.json({
    generated_at: now.toISOString(),
    summary: {
      visits_7d: visits7d,
      visits_30d: visits30d,
      top_country: byCountry[0]?.name || null,
      top_source: bySource[0]?.name || null,
    },
    by_country: byCountry.slice(0, 10),
    by_source: bySource.slice(0, 10),
    by_device: byDevice,
    recent,
    sites,
    site_filter: siteFilter && meta[siteFilter] ? siteFilter : null,
  })
}
