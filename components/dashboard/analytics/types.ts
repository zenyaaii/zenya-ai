import type { RangeKey } from '@/lib/analytics-core'

export type Row = { name: string; views: number; sessions: number; visitors: number }

export type SeriesPoint = {
  date: string
  views: number
  sessions: number
  visitors: number
  events: number
}

export type SiteRef = {
  id: string
  name: string
  slug: string | null
  is_published: boolean
  template: string
  url: string | null
}

export type Insight = { tone: 'good' | 'warn' | 'info'; title: string; body: string }

export type AnalyticsPayload = {
  generated_at: string
  is_admin: boolean
  tz: string
  range: {
    key: RangeKey
    from: string
    to: string
    prev_from: string
    prev_to: string
    days: number
  }
  include_bots: boolean
  sites: SiteRef[]
  site_filter: string | null
  sessions_since: string | null
  site_counts: {
    themes: number
    published: number
    live_domains: number
    lifetime_views: number
  }
  totals: Metrics
  previous: Metrics
  delta: Record<keyof Metrics, number | null>
  series: SeriesPoint[]
  prev_series: SeriesPoint[]
  per_site: Array<{
    id: string
    product_name: string
    slug: string | null
    is_published: boolean
    template: string
    views: number
    sessions: number
    visitors: number
    lifetime_views: number
    last_viewed_at: string | null
    created_at: string
  }>
  per_template: Array<{
    template: string
    sites: number
    published: number
    views: number
    visitors: number
    lifetime_views: number
  }>
  pages: Array<{
    path: string
    views: number
    visitors: number
    avg_engaged_ms: number | null
    avg_scroll_pct: number | null
  }>
  channels: Array<Row & { key: string }>
  referrers: Row[]
  countries: Row[]
  devices: Row[]
  browsers: Row[]
  operating_systems: Row[]
  campaigns: Row[]
  utm_sources: Row[]
  hourly: Array<{ dow: number; hour: number; views: number }>
  conversions: {
    total: number
    rate: number
    by_type: Array<{ event_type: string; events: number; sessions: number }>
    by_path: Array<{ path: string; events: number }>
  }
  insights: Insight[]
}

export type Metrics = {
  views: number
  sessions: number
  visitors: number
  bounce_rate: number
  avg_duration_ms: number
  events: number
  conversion_rate: number
}

export type RealtimePayload = {
  generated_at: string
  active: number
  active_window_min: number
  recent: Array<{
    id: number
    at: string
    site_id: string
    site_name: string
    template: string
    slug: string | null
    path: string
    country: string | null
    device: string
    channel: string | null
    source: string | null
    is_bot: boolean
  }>
  active_pages: Array<{ path: string; count: number }>
}

export type TabKey =
  | 'overview'
  | 'audience'
  | 'sources'
  | 'content'
  | 'conversions'
  | 'search'
  | 'realtime'
  | 'insights'
