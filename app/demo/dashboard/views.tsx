'use client'

/**
 * The demo dashboard's nine views.
 *
 * These are not drawings of the dashboard any more - they ARE the dashboard.
 * Each view renders the real screen from components/dashboard/screens, the
 * same component app/(app)/dashboard/** renders for a signed-in owner, and
 * hands it the sample data in data.ts instead of a live account. Actions
 * switch views or do nothing: this page signs nobody in.
 */

import { HomeScreen } from '@/components/dashboard/screens/home'
import { SitesScreen, type SiteFilter } from '@/components/dashboard/screens/sites'
import { GalleryScreen } from '@/components/dashboard/screens/gallery'
import { AnalyticsScreen, type MetricKey, type RangeKey } from '@/components/dashboard/screens/analytics'
import { BookingsScreen, type BookingData } from '@/components/dashboard/screens/bookings'
import { SeoScreen } from '@/components/dashboard/screens/seo'
import { DomainsScreen } from '@/components/dashboard/screens/domains'
import { BillingScreen } from '@/components/dashboard/screens/billing'
import { SettingsScreen } from '@/components/dashboard/screens/settings'
import { ReviewsScreen, ReviewsSheet, type ReviewRow } from '@/components/dashboard/screens/reviews'
import { useState } from 'react'
import {
  ASSETS, BOOKINGS, CHANNELS, DOMAINS, INVOICES, PAGES, PLAN_INCLUDES,
  PREV_SERIES, SERIES, SEO_SITE, SITES, TOTALS,
} from './data'

export function HomeView({ go }: { go: (v: string) => void }) {
  const to = (v: string) => ({ onClick: () => go(v) })
  return (
    <HomeScreen
      name="نادية"
      planLabel="Pro"
      planTone="ok"
      email="nadia@almadina.co"
      stats={{
        sites: SITES.length,
        live: SITES.filter((s) => s.live).length,
        views: SITES.reduce((a, s) => a + s.views, 0),
        bookings: BOOKINGS.length,
      }}
      recent={SITES.map((s) => ({ id: s.id, name: s.name, host: s.host, live: s.live }))}
      allSites={to('sites')}
      quick={{ newSite: to('sites'), domains: to('domains'), gallery: to('gallery'), analytics: to('analytics') }}
      launch={[
        { label: 'أنشئ موقعك', done: true },
        { label: 'خصّص محتواك', done: true },
        { label: 'انشُر موقعك', done: true },
        { label: 'اربط نطاقك', done: false },
      ]}
    />
  )
}

export function SitesView({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const [sheet, setSheet] = useState<string | null>(null)
  const panel = useReviewsPanel()
  const site = SITES.find((s) => s.id === sheet)
  return (
    <>
    {site && <ReviewsSheet siteName={site.name} onClose={() => setSheet(null)} {...panel} />}
    <SitesScreen
      filter={filter as SiteFilter}
      setFilter={setFilter}
      sites={SITES.map((s) => ({
        id: s.id, name: s.name, kind: s.kind, host: s.host, live: s.live, updated: s.updated,
        primary: { label: s.live ? 'أضف نطاقًا' : 'انشر' },
        reviews: s.id === 's5' ? undefined : { onClick: () => setSheet(s.id) },
      }))}
    />
    </>
  )
}

/* Sample reviews: two the owner typed, and what the Google fetch returns. */
const SAMPLE_REVIEWS: ReviewRow[] = [
  { id: 'm1', name: 'سارة القحطاني', rating: 5, source: 'manual', shown: true, text: 'جلسة المساج كانت ممتازة، والمكان هادئ ونظيف. أنصح فيه بقوة.' },
  { id: 'm2', name: 'ريم', rating: 4, source: 'manual', shown: false, text: 'التعامل راقي والمواعيد مضبوطة، بس المواقف قليلة.' },
]
const GOOGLE_REVIEWS: ReviewRow[] = [
  { id: 'g1', name: 'Noura A.', rating: 5, source: 'google', when: 'قبل أسبوع', shown: true, text: 'أفضل مركز جربته في الرياض. الأخصائية فاهمة شغلها وتسمع لك قبل ما تبدأ.' },
  { id: 'g2', name: 'منى الشهري', rating: 5, source: 'google', when: 'قبل شهر', shown: true, text: 'نظافة وراحة وأسعار معقولة. رجعت له ثلاث مرات.' },
  { id: 'g3', name: 'Lama', rating: 3, source: 'google', when: 'قبل شهرين', shown: false, text: 'الخدمة حلوة لكن انتظرت ٢٠ دقيقة بعد موعدي.' },
  { id: 'g4', name: 'هيفاء', rating: 5, source: 'google', when: 'قبل 3 أشهر', shown: true, text: 'جلسة الحجامة كانت مريحة جدًا والموظفات لطيفات.' },
]

function useReviewsPanel() {
  const [link, setLink] = useState('')
  const [fetching, setFetching] = useState(false)
  const [google, setGoogle] = useState<{ rating: number; count: number } | null>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>(SAMPLE_REVIEWS)
  return {
    link, setLink, fetching, google, reviews,
    onFetch: {
      onClick: () => {
        if (!link) setLink('https://maps.app.goo.gl/waha-riyadh')
        setFetching(true)
        setTimeout(() => {
          setFetching(false)
          setGoogle({ rating: 4.8, count: 212 })
          setReviews((rs) => [...GOOGLE_REVIEWS.filter((g) => !rs.some((r) => r.id === g.id)), ...rs])
        }, 900)
      },
    },
    onToggle: (id: string) => setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, shown: !r.shown } : r))),
    onAdd: { onClick: () => {} },
    onEdit: () => {},
  }
}

export function ReviewsView() {
  const [siteId, setSiteId] = useState('s3')
  const panel = useReviewsPanel()
  return (
    <ReviewsScreen
      sites={SITES.filter((s) => s.id !== 's5').map((s) => ({ id: s.id, name: s.name }))}
      siteId={siteId}
      setSiteId={setSiteId}
      {...panel}
    />
  )
}

export function GalleryView() {
  return <GalleryScreen assets={ASSETS} usedLabel="3.1 م.ب مستخدمة" />
}

export function AnalyticsView({
  metric, setMetric, range, setRange,
}: {
  metric: MetricKey; setMetric: (m: MetricKey) => void
  range: string; setRange: (r: string) => void
}) {
  return (
    <AnalyticsScreen
      metric={metric} setMetric={setMetric}
      range={range as RangeKey} setRange={setRange}
      totals={TOTALS}
      deltas={{ visitors: 16.3, sessions: 19.8, views: 24.7, events: 31.2 }}
      series={SERIES} prevSeries={PREV_SERIES}
      channels={CHANNELS} pages={PAGES}
      avgDuration="1 د 36 ث" avgDurationDelta={8.1}
    />
  )
}

export function BookingsView({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  return (
    <BookingsScreen
      filter={filter}
      setFilter={setFilter}
      aside={<span className="zy-pill" data-tone="accent">مفعّلة</span>}
      bookings={BOOKINGS.map((b, i) => ({ ...b, id: String(i), status: b.status as BookingData['status'] }))}
    />
  )
}

export function SeoView() {
  const live = SITES.filter((s) => s.live)
  return (
    <SeoScreen
      sites={live.map((s) => ({ id: s.id, name: s.name, live: s.live }))}
      selectedId={live[0].id}
      site={{ name: SEO_SITE.name, host: SEO_SITE.host }}
      title={SEO_SITE.title}
      description={SEO_SITE.description}
      keywords={SEO_SITE.keywords}
      titleMax={60}
      descMax={160}
    />
  )
}

export function DomainsView() {
  return <DomainsScreen domains={DOMAINS.map((d) => ({ ...d, id: d.domain }))} />
}

export function BillingView() {
  return (
    <BillingScreen
      planLabel="Pro نشط · استضافة مشمولة"
      price="24.99$ / شهريًا"
      renews="يتجدّد 14 أكتوبر 2026"
      includes={PLAN_INCLUDES}
      card={{ label: '•••• 4242', expires: 'تنتهي 08/29' }}
      invoices={INVOICES}
    />
  )
}

export function SettingsView() {
  return (
    <SettingsScreen
      name="نادية العامري"
      email="nadia@almadina.co"
      language="ar"
      notifications={[
        { key: 'booking', label: 'حجز جديد', on: true },
        { key: 'product', label: 'تحديثات المنتج', on: false },
        { key: 'offers', label: 'عروض وتخفيضات', on: false },
      ]}
    />
  )
}
