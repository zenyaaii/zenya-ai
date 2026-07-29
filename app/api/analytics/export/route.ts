import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyticsAdmin } from '@/lib/analytics-server'
import {
  CHANNEL_LABEL_AR, EVENT_LABEL_AR, countryNameAr, deviceLabelAr,
  formatDuration, isEventType, resolveRange, type Channel, type RangeKey,
} from '@/lib/analytics-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Dataset = 'daily' | 'pages' | 'sources' | 'countries' | 'devices' | 'conversions' | 'sites'
const DATASETS: Dataset[] = ['daily', 'pages', 'sources', 'countries', 'devices', 'conversions', 'sites']

/**
 * GET /api/analytics/export?dataset=daily&range=30d&site=&bots=&tz=
 *
 * Downloadable CSV of whatever the owner is looking at. Same scoping and the
 * same rollups as the dashboard, so an exported number always matches the
 * number on screen.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams
  const dataset = (q.get('dataset') || 'daily') as Dataset
  if (!DATASETS.includes(dataset)) {
    return NextResponse.json({ error: 'unknown_dataset' }, { status: 400 })
  }

  const rangeKey = (q.get('range') || '30d') as RangeKey
  const includeBots = q.get('bots') === '1'
  const tz = safeTz(q.get('tz'))
  const { from, to } = resolveRange(rangeKey, new Date(), { from: q.get('from'), to: q.get('to') })

  const a = analyticsAdmin()
  const { data: themesRaw } = await a
    .from('themes')
    .select('id, product_name, slug, template_type, is_published, view_count, content')
    .eq('user_id', user.id)

  const themes = themesRaw || []
  const owned = themes.map((t) => t.id)
  const siteParam = q.get('site') || ''
  const themeIds = siteParam && owned.includes(siteParam) ? [siteParam] : owned

  if (themeIds.length === 0) return csv('zenya-analytics', [['لا توجد بيانات']])

  const base = {
    p_theme_ids: themeIds,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_include_bots: includeBots,
  }

  let rows: string[][]

  switch (dataset) {
    case 'daily': {
      const { data } = await a.rpc('analytics_daily', { ...base, p_tz: tz })
      rows = [['التاريخ', 'المشاهدات', 'الجلسات', 'الزوّار']]
      for (const r of data || []) {
        rows.push([String((r as any).day).slice(0, 10), num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      break
    }
    case 'pages': {
      const { data } = await a.rpc('analytics_pages', { ...base, p_limit: 500 })
      rows = [['الصفحة', 'المشاهدات', 'الزوّار', 'متوسط المدة', 'متوسط التمرير %']]
      for (const r of data || []) {
        const eng = (r as any).avg_engaged
        rows.push([
          (r as any).path, num(r, 'views'), num(r, 'visitors'),
          eng == null ? '—' : formatDuration(Number(eng)),
          (r as any).avg_scroll == null ? '—' : String((r as any).avg_scroll),
        ])
      }
      break
    }
    case 'sources': {
      const [ch, refs, camps] = await Promise.all([
        a.rpc('analytics_breakdown', { ...base, p_dimension: 'channel', p_limit: 20 }),
        a.rpc('analytics_breakdown', { ...base, p_dimension: 'referrer_host', p_limit: 200 }),
        a.rpc('analytics_breakdown', { ...base, p_dimension: 'utm_campaign', p_limit: 200 }),
      ])
      rows = [['النوع', 'المصدر', 'المشاهدات', 'الجلسات', 'الزوّار']]
      for (const r of ch.data || []) {
        const key = (r as any).name as Channel
        rows.push(['قناة', CHANNEL_LABEL_AR[key] || key, num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      for (const r of refs.data || []) {
        rows.push(['موقع محيل', (r as any).name, num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      for (const r of camps.data || []) {
        if ((r as any).name === 'unknown') continue
        rows.push(['حملة', (r as any).name, num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      break
    }
    case 'countries': {
      const { data } = await a.rpc('analytics_breakdown', { ...base, p_dimension: 'country', p_limit: 300 })
      rows = [['الدولة', 'الرمز', 'المشاهدات', 'الجلسات', 'الزوّار']]
      for (const r of data || []) {
        const code = (r as any).name
        rows.push([countryNameAr(code), code, num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      break
    }
    case 'devices': {
      const [dev, br, os] = await Promise.all([
        a.rpc('analytics_breakdown', { ...base, p_dimension: 'device', p_limit: 20 }),
        a.rpc('analytics_breakdown', { ...base, p_dimension: 'browser', p_limit: 40 }),
        a.rpc('analytics_breakdown', { ...base, p_dimension: 'os', p_limit: 40 }),
      ])
      rows = [['الفئة', 'القيمة', 'المشاهدات', 'الجلسات', 'الزوّار']]
      for (const r of dev.data || []) {
        rows.push(['الجهاز', deviceLabelAr((r as any).name), num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      for (const r of br.data || []) {
        rows.push(['المتصفح', (r as any).name, num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      for (const r of os.data || []) {
        rows.push(['نظام التشغيل', (r as any).name, num(r, 'views'), num(r, 'sessions'), num(r, 'visitors')])
      }
      break
    }
    case 'conversions': {
      const [types, paths] = await Promise.all([
        a.rpc('analytics_events', { p_theme_ids: themeIds, p_from: base.p_from, p_to: base.p_to }),
        a.rpc('analytics_events_by_path', { p_theme_ids: themeIds, p_from: base.p_from, p_to: base.p_to, p_limit: 200 }),
      ])
      rows = [['الفئة', 'القيمة', 'العدد', 'الجلسات']]
      for (const r of types.data || []) {
        const t = (r as any).event_type
        rows.push(['إجراء', isEventType(t) ? EVENT_LABEL_AR[t] : t, num(r, 'events'), num(r, 'sessions')])
      }
      for (const r of paths.data || []) {
        rows.push(['صفحة', (r as any).path, num(r, 'events'), ''])
      }
      break
    }
    case 'sites': {
      const { data } = await a.rpc('analytics_by_site_range', base)
      const stats = new Map<string, any>()
      for (const r of data || []) stats.set((r as any).theme_id, r)
      rows = [['الموقع', 'الرابط', 'القالب', 'الحالة', 'المشاهدات', 'الجلسات', 'الزوّار', 'الإجمالي الكلي']]
      for (const t of themes) {
        if (!themeIds.includes(t.id)) continue
        const s = stats.get(t.id)
        rows.push([
          t.product_name || t.slug || 'موقع بلا اسم',
          t.slug ? `${t.slug}.zenyaai.co` : '—',
          (t.content && typeof t.content === 'object' && (t.content as any).business_type) || t.template_type || '—',
          t.is_published ? 'منشور' : 'مسودة',
          num(s, 'views'), num(s, 'sessions'), num(s, 'visitors'),
          String(t.view_count ?? 0),
        ])
      }
      break
    }
  }

  const stamp = from.toISOString().slice(0, 10) + '_' + to.toISOString().slice(0, 10)
  return csv(`zenya-${dataset}-${stamp}`, rows)
}

function num(r: any, key: string): string {
  return String(Number(r?.[key]) || 0)
}

function safeTz(tz: string | null): string {
  if (!tz || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) return 'UTC'
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

function csv(filename: string, rows: string[][]): NextResponse {
  const escape = (v: string) => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = rows.map((r) => r.map(escape).join(',')).join('\r\n')
  // Excel only reads UTF-8 CSV as Arabic if it sees the BOM; without it every
  // exported file opens as mojibake on Windows.
  return new NextResponse('﻿' + body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
