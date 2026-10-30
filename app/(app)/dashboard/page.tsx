'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { publicSiteUrl } from '@/lib/portal-urls'
import { bookingAccess } from '@/lib/booking-entitlement'
import { hasReviews, readReviews } from '@/lib/reviews-bank'
import V6Home, { type HomeMetric, type StartStep, type V6Booking, type V6HomeProps } from '@/components/app/v6/Home'
import { MONTHS } from '@/components/app/v6/ui'
import { heroImage, hostOf, useSite } from '@/components/app/v6/site'
import {
  dateAgo, trafficFromDay, trafficFromRange, ymd,
  type TRange, type TrafficData,
} from '@/components/dashboard/screens/traffic'
import { businessTypeOf, editUrlFor, templateLabel } from '@/components/dashboard/site-kinds'
import { useDashboardPath } from '@/components/app/useDashboardPath'

/**
 * The dashboard home on the owner's real account, drawn as the v6 design's
 * home (components/app/v6/Home).
 *
 * The site is the one the frame's switcher shows (v6/site). Loads in waves so
 * the page is never blank for long: the account first (greeting, launch
 * plan), then the site's traffic, bookings and domain, then Google, which is
 * slow and optional. Every number comes from the account; what it does not
 * have yet is offered as a next step instead.
 */

type BookingRow = {
  id: number; name: string; party_size: number | null; preferred_date: string | null
  preferred_time: string | null; status: string; message: string | null
}

const tz = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** Arabic letters people type interchangeably, folded, for matching a query to a name. */
const fold = (s: string) =>
  s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim()

export default function DashboardHomePage() {
  const router = useRouter()
  const { linkTo } = useDashboardPath()
  const account = useSite()
  const siteId = account?.siteId || ''
  const [base, setBase] = useState<{ name: string; entitled: boolean; launchPlan: Record<string, boolean> } | null>(null)
  const [metric, setMetric] = useState<HomeMetric>('views')
  const [range, setRange] = useState<TRange>('30d')
  const [back, setBack] = useState(0)
  const [traffic, setTraffic] = useState<TrafficData | null>(null)
  const [week, setWeek] = useState<number | null>(null)
  const [bookings, setBookings] = useState<{ rows: BookingRow[]; fresh: number } | null>(null)
  const [google, setGoogle] = useState<V6HomeProps['google']>(null)

  // ---- wave 1: the account ---------------------------------------------------
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?next=/dashboard'); return }
      const [{ data: profile }, onboarding] = await Promise.all([
        supabase.from('profiles').select('plan, has_hosting, bookings_trial_started_at, full_name').eq('id', user.id).maybeSingle(),
        fetch('/api/onboarding', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (cancelled) return
      const fullName = (profile as any)?.full_name || user.user_metadata?.full_name || ''
      setBase({
        name: fullName.split(' ')[0] || (user.email ? user.email.split('@')[0] : ''),
        entitled: bookingAccess(profile as any).entitled,
        launchPlan: (onboarding?.launchPlan || {}) as Record<string, boolean>,
      })
    })()
    return () => { cancelled = true }
  }, [router])

  const themes = account?.themes || null
  const domains = useMemo(() => account?.domains || [], [account?.domains])

  // A new site in the switcher starts its numbers fresh.
  useEffect(() => { setTraffic(null); setWeek(null); setBookings(null); setGoogle(null) }, [siteId])

  const theme = themes?.find((t) => t.id === siteId) || null
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

  // The greeting: distinct people over the last 7 days.
  useEffect(() => {
    if (!theme || !live) return
    let cancelled = false
    const q = new URLSearchParams({ tz: tz(), site: theme.id, range: '7d' })
    fetch(`/api/analytics?${q}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j?.totals) setWeek(Number(j.totals.visitors) || 0) })
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

  const props = useMemo<V6HomeProps | null>(() => {
    if (!base || !themes) return null
    const t = theme
    const bt = t ? businessTypeOf(t) : ''
    const dom = t
      ? domains
        .filter((d) => d.theme_id === t.id && d.status !== 'removed')
        .sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live') || Number(!!b.is_primary) - Number(!!a.is_primary))[0]
      : undefined
    const host = t ? hostOf(t, domains) : null
    const url = live && host ? `https://${host}` : live && t?.slug ? publicSiteUrl(t.slug) : null
    const when = t ? new Date(t.updated_at || t.created_at) : null

    let reviews: V6HomeProps['reviews'] = null
    if (t && hasReviews(bt)) {
      const v = readReviews(bt, t.content)
      reviews = v.google && v.google.rating
        ? { rating: Number(v.google.rating), count: Number(v.google.count) || 0, fresh: v.rows.filter((r) => r.isNew).length }
        : 'add'
    }

    const toBooking = (b: BookingRow): V6Booking => ({
      id: String(b.id),
      time: (b.preferred_time || '').slice(0, 5) || '—',
      name: b.name,
      people: b.party_size,
      status: b.status === 'confirmed' ? 'ok' : b.status === 'done' ? 'done' : 'new',
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

    const published = themes.some((x) => x.is_published && x.slug)
    const reviewsHref = linkTo(t ? `/dashboard/reviews?site=${t.id}` : '/dashboard/reviews')
    return {
      name: base.name,
      site: t
        ? {
            id: t.id,
            name: t.product_name || 'موقع بلا اسم',
            live,
            host,
            url,
            updated: when ? `${when.getDate()} ${MONTHS[when.getMonth()]}` : '',
            kind: templateLabel(bt),
            cover: heroImage(t.content),
            edit: { href: editUrlFor(t.id, bt) },
            preview: { href: url || `/preview/${t.id}`, external: true },
          }
        : null,
      newBookings: base.entitled && live ? (bookings ? bookings.fresh : null) : null,
      visitors7: live ? week : null,
      traffic,
      metric, onMetric: setMetric,
      range, onRange: setRange,
      day: back, onDay: setBack,
      today,
      domain: dom ? { host: dom.domain, own: true, live: dom.status === 'live' } : null,
      google,
      reviews,
      start: base.launchPlan.startHidden ? null : {
        edited: !!base.launchPlan.edit,
        domain: dom ? (dom.status === 'live' ? 'live' : 'pending') : null,
        shared: !!base.launchPlan.share,
      },
      onStart,
      launch: [
        { label: 'أنشئ موقعك', done: themes.length > 0 },
        { label: 'خصّص محتواك', done: !!base.launchPlan.edit },
        { label: 'انشر موقعك', done: published },
        { label: 'اربط نطاقك', done: domains.some((d) => d.status === 'live') },
      ],
      links: {
        bookings: { href: linkTo('/dashboard/bookings') },
        analyticsDay1: { href: linkTo('/dashboard/analytics?range=day&back=1') },
        analyticsSearch: { href: linkTo('/dashboard/analytics?tab=search') },
        gallery: { href: linkTo('/dashboard/gallery') },
        seo: { href: linkTo('/dashboard/seo') },
        domains: { href: linkTo('/dashboard/domains') },
        reviews: { href: reviewsHref },
        newSite: { href: '/theme/new' },
        publish: { href: linkTo('/dashboard/sites') },
      },
    }
  }, [base, themes, domains, theme, live, bookings, week, traffic, metric, range, back, google, linkTo, onStart])

  return props ? <V6Home {...props} /> : null
}
