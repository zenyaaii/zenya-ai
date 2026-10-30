'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { publicSiteHost, publicSiteUrl } from '@/lib/portal-urls'
import { bookingAccess } from '@/lib/booking-entitlement'
import { hasReviews, readReviews } from '@/lib/reviews-bank'
import { HomeScreen, type HomeBooking, type HomeScreenProps, type HomeWidgets, type StartStep } from '@/components/dashboard/screens/home'
import {
  TrafficCard, dateAgo, trafficFromDay, trafficFromRange, ymd,
  type TMetric, type TRange, type TrafficData,
} from '@/components/dashboard/screens/traffic'
import { relTime } from '@/components/dashboard/screens/kit'
import { businessTypeOf, editUrlFor, templateLabel, type ThemeRow } from '@/components/dashboard/site-kinds'
import { useDashboardPath } from '@/components/app/useDashboardPath'

/**
 * The dashboard home on the owner's real account.
 *
 * Loads in three waves so the page is never blank for long: the account and
 * its sites first (greeting, site card, launch plan), then the chosen site's
 * traffic, bookings and domain, then Google, which is slow and optional.
 * Every number comes from the account; what it does not have yet is offered
 * as a next step instead (see HomeScreen).
 */

type Domain = { domain: string; theme_id: string | null; status: string; is_primary?: boolean | null }
type BookingRow = {
  id: number; name: string; party_size: number | null; preferred_date: string | null
  preferred_time: string | null; status: string; message: string | null
}

const tz = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** The site the home is about: the latest published one, else the latest. */
function pickSite(themes: ThemeRow[]): string {
  const by = (t: ThemeRow) => new Date(t.updated_at || t.created_at).getTime()
  const sorted = [...themes].sort((a, b) => by(b) - by(a))
  return (sorted.find((t) => t.is_published && t.slug) || sorted[0])?.id || ''
}

function heroImage(content: any): string | null {
  const h = content && typeof content === 'object' ? content.hero : null
  const img = h?.image
  const url = typeof img === 'string' ? img : typeof img?.url === 'string' ? img.url : null
  return url && /^(https?:)?\/\//.test(url) ? url : url && url.startsWith('/') ? url : null
}

/** Arabic letters people type interchangeably, folded, for matching a query to a name. */
const fold = (s: string) =>
  s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim()

export default function DashboardHomePage() {
  const router = useRouter()
  const { linkTo } = useDashboardPath()
  const [base, setBase] = useState<{
    name: string; themes: ThemeRow[]; domains: Domain[]; entitled: boolean; launchPlan: Record<string, boolean>
  } | null>(null)
  const [siteId, setSiteId] = useState('')
  const [metric, setMetric] = useState<TMetric>('views')
  const [range, setRange] = useState<TRange>('30d')
  const [back, setBack] = useState(0)
  const [traffic, setTraffic] = useState<TrafficData | null>(null)
  const [yesterday, setYesterday] = useState<number | null>(null)
  const [bookings, setBookings] = useState<{ rows: BookingRow[]; fresh: number } | null>(null)
  const [google, setGoogle] = useState<HomeWidgets['google']>(null)

  // ---- wave 1: the account and its sites ----------------------------------
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?next=/dashboard'); return }
      const [{ data: profile }, themesRes, domainsRes, onboarding] = await Promise.all([
        supabase.from('profiles').select('plan, has_hosting, bookings_trial_started_at, full_name').eq('id', user.id).maybeSingle(),
        fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] })),
        fetch('/api/domains').then((r) => (r.ok ? r.json() : { domains: [] })).catch(() => ({ domains: [] })),
        fetch('/api/onboarding', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (cancelled) return
      const themes: ThemeRow[] = themesRes?.themes || []
      const fullName = (profile as any)?.full_name || user.user_metadata?.full_name || ''
      setBase({
        name: fullName.split(' ')[0] || (user.email ? user.email.split('@')[0] : ''),
        themes,
        domains: domainsRes?.domains || [],
        entitled: bookingAccess(profile as any).entitled,
        launchPlan: (onboarding?.launchPlan || {}) as Record<string, boolean>,
      })
      setSiteId((cur) => cur || pickSite(themes))
    })()
    return () => { cancelled = true }
  }, [router])

  const theme = base?.themes.find((t) => t.id === siteId) || null
  const live = !!(theme?.is_published && theme.slug)

  // ---- wave 2: traffic for the chosen site and range ----------------------
  useEffect(() => {
    if (!theme || !live) return
    let cancelled = false
    const q = new URLSearchParams({ tz: tz(), site: theme.id })
    const url = range === 'day'
      ? `/api/analytics/day?${q}&date=${ymd(dateAgo(back))}`
      : `/api/analytics?${q}&range=${range}`
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => { if (!cancelled) setTraffic(range === 'day' ? trafficFromDay(j) : trafficFromRange(j)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [theme?.id, live, range, back]) // eslint-disable-line react-hooks/exhaustive-deps

  // The greeting's "visited yesterday": distinct people on the owner's own yesterday.
  useEffect(() => {
    if (!theme || !live) return
    let cancelled = false
    const q = new URLSearchParams({ tz: tz(), site: theme.id, date: ymd(dateAgo(1)) })
    fetch(`/api/analytics/day?${q}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j?.totals) setYesterday(j.totals.visitors) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [theme?.id, live]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- wave 2: this week's bookings ---------------------------------------
  useEffect(() => {
    if (!theme || !live || !base?.entitled) { setBookings(null); return }
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      // RLS scopes site_bookings to the owner's own sites.
      const [week, fresh] = await Promise.all([
        supabase
          .from('site_bookings')
          .select('id, name, party_size, preferred_date, preferred_time, status, message')
          .eq('theme_id', theme.id)
          .eq('is_bot', false)
          .neq('status', 'cancelled')
          .gte('preferred_date', ymd(dateAgo(0)))
          .lte('preferred_date', ymd(dateAgo(-6)))
          .limit(300),
        supabase
          .from('site_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('theme_id', theme.id)
          .eq('is_bot', false)
          .eq('status', 'new'),
      ])
      if (!cancelled) setBookings({ rows: (week.data || []) as BookingRow[], fresh: fresh.count || 0 })
    })()
    return () => { cancelled = true }
  }, [theme?.id, live, base?.entitled]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- wave 3: Google (slow, optional) ------------------------------------
  useEffect(() => {
    if (!theme || !live) return
    let cancelled = false
    setGoogle(null)
    ;(async () => {
      try {
        const st = await fetch('/api/gsc/status', { cache: 'no-store' }).then((r) => r.json())
        if (cancelled || !st?.configured) return
        if (!st.connected) { setGoogle('connect'); return }
        const p = await fetch(`/api/gsc/performance?themeId=${encodeURIComponent(theme.id)}`, { cache: 'no-store' }).then((r) => r.json())
        if (cancelled) return
        if (p?.connected === false || p?.reason === 'property_not_found') { setGoogle('connect'); return }
        if (p?.reason !== 'ok' || !p.totals) return
        const name = fold(theme.product_name || '')
        const hit = name
          ? (p.queries || []).find((q: any) => { const f = fold(q.query || ''); return f && (f.includes(name) || name.includes(f)) })
          : null
        setGoogle(hit
          ? { clicks: p.totals.clicks, position: hit.position, query: hit.query }
          : { clicks: p.totals.clicks, position: p.totals.position })
      } catch { /* the card stays off */ }
    })()
    return () => { cancelled = true }
  }, [theme?.id, live]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSite = useCallback((id: string) => {
    setSiteId(id)
    setTraffic(null)
    setYesterday(null)
    setBookings(null)
  }, [])

  // «ابدأ من هنا»: a step the owner took (or hiding the card) is a key in the
  // launch plan, so it follows them to every device.
  const onStart = useCallback((step: StartStep) => {
    const key = step === 'hide' ? 'startHidden' : step
    if (!base || base.launchPlan[key]) return
    const launchPlan = { ...base.launchPlan, [key]: true }
    setBase({ ...base, launchPlan })
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ launchPlan }),
      keepalive: true,
    }).catch(() => {})
  }, [base])

  const props = useMemo<HomeScreenProps | null>(() => {
    if (!base) return null
    const t = theme
    const bt = t ? businessTypeOf(t) : ''
    const dom = t
      ? base.domains
        .filter((d) => d.theme_id === t.id && d.status !== 'removed')
        .sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live') || Number(!!b.is_primary) - Number(!!a.is_primary))[0]
      : undefined
    const ownHost = dom && dom.status === 'live' ? dom.domain : null
    const host = t?.slug ? ownHost || publicSiteHost(t.slug) : null
    const url = live && t?.slug ? (ownHost ? `https://${ownHost}` : publicSiteUrl(t.slug)) : null

    let reviews: HomeWidgets['reviews'] = null
    if (t && hasReviews(bt)) {
      const v = readReviews(bt, t.content)
      reviews = v.google && v.google.rating
        ? { rating: Number(v.google.rating), count: Number(v.google.count) || 0, fresh: v.rows.filter((r) => r.isNew).length }
        : 'add'
    }

    const toBooking = (b: BookingRow): HomeBooking => ({
      id: String(b.id),
      time: (b.preferred_time || '').slice(0, 5) || '—',
      name: b.name,
      people: b.party_size,
      status: b.status === 'confirmed' ? 'confirmed' : b.status === 'done' ? 'done' : 'new',
      hasNote: !!(b.message && b.message.trim()),
    })
    const byTime = (a: BookingRow, b: BookingRow) => (a.preferred_time || '').localeCompare(b.preferred_time || '')
    const rows = bookings?.rows || []
    const today = base.entitled && live
      ? {
          list: rows.filter((b) => b.preferred_date === ymd(dateAgo(0))).sort(byTime).map(toBooking),
          tomorrow: rows.filter((b) => b.preferred_date === ymd(dateAgo(-1))).sort(byTime).map(toBooking),
          week: rows.length,
        }
      : null

    const published = base.themes.some((x) => x.is_published && x.slug)
    return {
      name: base.name,
      sites: base.themes.map((x) => ({ id: x.id, name: x.product_name || 'موقع بلا اسم' })),
      site: t
        ? {
            id: t.id,
            name: t.product_name || 'موقع بلا اسم',
            live,
            host,
            url,
            updated: relTime(t.updated_at || t.created_at),
            kind: templateLabel(bt),
            image: heroImage(t.content),
            edit: { href: editUrlFor(t.id, bt) },
            open: { href: url || `/preview/${t.id}`, external: true },
          }
        : null,
      onSite,
      newBookings: base.entitled && live ? (bookings ? bookings.fresh : null) : null,
      yesterdayVisitors: live ? yesterday : null,
      traffic: (
        <TrafficCard
          data={traffic}
          metric={metric} onMetric={setMetric}
          range={range} onRange={setRange}
          back={back} onBack={setBack}
        />
      ),
      today,
      widgets: {
        domain: dom ? { host: dom.domain, state: dom.status === 'live' ? 'live' : 'pending' } : null,
        google,
        reviews,
      },
      start: base.launchPlan.startHidden ? null : {
        edited: !!base.launchPlan.edit,
        domain: dom ? (dom.status === 'live' ? 'live' : 'pending') : null,
        shared: !!base.launchPlan.share,
      },
      onStart,
      launch: [
        { label: 'أنشئ موقعك', done: base.themes.length > 0 },
        { label: 'خصّص محتواك', done: !!base.launchPlan.edit },
        { label: 'انشر موقعك', done: published },
        { label: 'اربط نطاقك', done: base.domains.some((d) => d.status === 'live') },
      ],
      links: {
        bookings: { href: linkTo('/dashboard/bookings') },
        analytics: { href: linkTo('/dashboard/analytics') },
        gallery: { href: linkTo('/dashboard/gallery') },
        seo: { href: linkTo('/dashboard/seo') },
        domains: { href: linkTo('/dashboard/domains') },
        reviews: { href: linkTo(t ? `/dashboard/reviews?site=${t.id}` : '/dashboard/reviews') },
        newSite: { href: '/theme/new' },
        publish: { href: linkTo('/dashboard/sites') },
      },
    }
  }, [base, theme, live, bookings, yesterday, traffic, metric, range, back, google, onSite, linkTo, onStart])

  return props ? <HomeScreen {...props} /> : null
}
