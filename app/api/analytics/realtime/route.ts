import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import { deviceFromUA, referrerHost } from '@/lib/analytics-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ACTIVE_WINDOW_MIN = 5

/**
 * GET /api/analytics/realtime?site=<themeId>
 *
 * Who is on the owner's sites right now, plus the live visit feed. Polled by
 * the dashboard's مباشر tab every few seconds, so it stays deliberately small:
 * one window of raw rows, no rollups, capped at 60 entries.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const a = analyticsAdmin()
  const siteParam = req.nextUrl.searchParams.get('site') || ''
  const includeBots = req.nextUrl.searchParams.get('bots') === '1'

  const { data: themesRaw } = await a
    .from('themes')
    .select('id, product_name, slug, template_type, content')
    .eq('user_id', user.id)

  const themes = themesRaw || []
  const meta = new Map<string, { name: string; template: string; slug: string | null }>()
  for (const t of themes) {
    meta.set(t.id, {
      name: t.product_name || t.slug || 'موقع بلا اسم',
      template:
        (t.content && typeof t.content === 'object' && (t.content as any).business_type) ||
        t.template_type || 'storefront',
      slug: t.slug || null,
    })
  }

  const owned = themes.map((t) => t.id)
  const themeIds = siteParam && owned.includes(siteParam) ? [siteParam] : owned
  if (themeIds.length === 0) {
    return NextResponse.json({
      generated_at: new Date().toISOString(), active: 0, active_window_min: ACTIVE_WINDOW_MIN,
      recent: [], active_pages: [],
    })
  }

  const now = new Date()
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MIN * 60_000)
  const feedSince = new Date(now.getTime() - 24 * 3600_000)

  let qb = a
    .from('site_views')
    .select('id, created_at, theme_id, path, country, referrer, referrer_host, channel, user_agent, device, session_id, visitor_hash, is_bot')
    .in('theme_id', themeIds)
    .gte('created_at', feedSince.toISOString())
    .order('created_at', { ascending: false })
    .limit(60)
  if (!includeBots) qb = qb.eq('is_bot', false)

  const { data: rows } = await qb

  const feed = (rows || []).map((r: any) => {
    const m = meta.get(r.theme_id)
    return {
      id: r.id,
      at: r.created_at,
      site_id: r.theme_id,
      site_name: m?.name || 'موقع محذوف',
      template: m?.template || '—',
      slug: m?.slug || null,
      path: r.path || '/',
      country: r.country || null,
      device: r.device || deviceFromUA(r.user_agent),
      channel: r.channel || null,
      source: r.referrer_host || referrerHost(r.referrer) || null,
      is_bot: !!r.is_bot,
    }
  })

  // "Active now" counts distinct people, not hits — one visitor refreshing
  // four times is one person on the site.
  const activeRows = (rows || []).filter(
    (r: any) => new Date(r.created_at) >= activeSince && (includeBots || !r.is_bot),
  )
  const activeKeys = new Set(
    activeRows.map((r: any) => r.session_id || r.visitor_hash || `id:${r.id}`),
  )

  const pageCounts = new Map<string, number>()
  for (const r of activeRows) {
    const p = r.path || '/'
    pageCounts.set(p, (pageCounts.get(p) || 0) + 1)
  }

  return NextResponse.json({
    generated_at: now.toISOString(),
    active: activeKeys.size,
    active_window_min: ACTIVE_WINDOW_MIN,
    recent: feed,
    active_pages: [...pageCounts.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((x, y) => y.count - x.count)
      .slice(0, 8),
  })
}
