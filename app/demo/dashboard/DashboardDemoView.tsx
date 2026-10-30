'use client'

/**
 * The candidate dashboard's shell. See page.tsx for why this route exists and
 * what is real in it; views.tsx holds the older surfaces and data.ts the
 * fixtures.
 *
 * TEN SURFACES, ONE PAGE. The side menu switches the view rather than
 * navigating, so the whole dashboard can be read here without an account.
 *
 * ── ONE FRAME WITH THE PRODUCT ────────────────────────────────────────────
 * The side menu, the top bar, the phone dock and its "More" sheet, search,
 * the site switcher and the light/dark switch are components/app/v6/Frame —
 * the same frame AppShell draws, in the v6 design's own stylesheet. Home and
 * Analytics are the product's v6 pages too (V6Home, V6Analytics): Home gets
 * the sample numbers as props, Analytics reads the same API paths the real
 * page reads and data.ts answers them.
 *
 * ── dir ───────────────────────────────────────────────────────────────────
 * dir="rtl" is hardcoded: the candidate set is Arabic-only copy.
 *
 * ── NOTHING HERE IS A DOOR INTO THE PRODUCT ───────────────────────────────
 * No link to the real dashboard, no sign-in. «عدّل الموقع» opens the editor
 * demo, the account menu's rows switch views, and sign-out says there is no
 * account. The one outbound link is the marketing apex.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DASHBOARD_CSS } from '@/components/app/dashboard-style'
import { dashFont } from '@/components/app/dash-font'
import TopTools from '@/components/app/TopTools'
import Frame from '@/components/app/v6/Frame'
import V6Home, { type StartStep, type V6HomeProps } from '@/components/app/v6/Home'
import V6Analytics, { type AnalyticsGet } from '@/components/app/v6/Analytics'
import { SiteCtx, frameSites, type AccountSites } from '@/components/app/v6/site'
import { PAGE_ROUTE, buildPages, type PageKey } from '@/components/app/frame/nav'
import { useT } from '@/components/i18n/LocaleProvider'
import DashIntro from '@/components/app/intro/DashIntro'
import type { ThemeRow } from '@/components/dashboard/site-kinds'
import type { TMetric, TRange } from '@/components/dashboard/screens/traffic'
import '@/components/app/v6/v6.css'
import '@/components/app/v6/v6-frame.css'
import {
  BillingView, BookingsView, DomainsView, GalleryView, ReviewsView, SeoView, SettingsView, SitesView,
} from './views'
import { GSC_TOTALS, HOME_TODAY, SITES, demoAnalyticsGet, demoTraffic } from './data'

type ViewKey = PageKey
const VIEWS = Object.keys(PAGE_ROUTE) as ViewKey[]

/** The views are one page, so ?view= gives each one an address. It is read
 *  once on mount and written with replaceState: switching views is not a
 *  navigation, so it should not push history the back button walks through. */
function viewFromLocation(): ViewKey {
  if (typeof window === 'undefined') return 'home'
  const v = new URLSearchParams(window.location.search).get('view')
  return VIEWS.includes(v as ViewKey) ? (v as ViewKey) : 'home'
}

/* The fixture sites carry a label, not a template id. */
const KIND: Record<string, string> = {
  'مطعم': 'restaurant', 'تطبيق': 'atlas', 'عافية': 'wellness', 'أزياء': 'lookbook', 'شوبيفاي': 'collective',
}
const UPDATED: Record<string, string> = { s1: '28 أكتوبر', s2: '24 أكتوبر', s3: '16 أكتوبر', s4: '30 سبتمبر', s5: '30 أغسطس' }

/** The sample sites as the account's rows, so the frame's switcher and the
 *  analytics page read them exactly as they read a real account's. */
const THEMES: ThemeRow[] = SITES.map((s) => ({
  id: s.id,
  product_name: s.name,
  created_at: '2026-08-01T10:00:00Z',
  is_published: s.live,
  slug: s.host ? s.host.split('.')[0] : null,
  template_type: KIND[s.kind] || null,
  content: KIND[s.kind] && KIND[s.kind] !== 'collective' ? { hero: { image: `/theme-previews/thumb/${KIND[s.kind]}.webp` } } : null,
}))

export default function DashboardDemoView() {
  const [view, setView] = useState<ViewKey>('home')
  const t = useT()
  const [more, setMore] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [siteId, setSiteId] = useState('s1')
  /** ?intro opens the dashboard tour, so it can be seen without an account. */
  const [intro, setIntro] = useState(false)

  useEffect(() => {
    const v = viewFromLocation()
    if (v !== 'home') setView(v)
    if (new URLSearchParams(window.location.search).has('intro')) setIntro(true)
  }, [])

  /** 'analytics:search' opens a tab; 'analytics:day1' opens yesterday by hour. */
  const go = useCallback((to: string) => {
    const [v, sub] = to.split(':') as [ViewKey, string | undefined]
    if (!VIEWS.includes(v)) return
    setView(v)
    setMore(false)
    const url = new URL(window.location.href)
    if (v === 'home') url.searchParams.delete('view')
    else url.searchParams.set('view', v)
    url.searchParams.delete('tab')
    url.searchParams.delete('range')
    url.searchParams.delete('back')
    if (v === 'analytics' && sub) {
      if (sub.startsWith('day')) { url.searchParams.set('range', 'day'); url.searchParams.set('back', sub.slice(3) || '0') }
      else url.searchParams.set('tab', sub)
    }
    window.history.replaceState(window.history.state, '', url)
    window.scrollTo(0, 0)
  }, [])

  const sites: AccountSites = useMemo(
    () => ({ themes: THEMES, domains: [], siteId, setSiteId, reload: () => {} }),
    [siteId],
  )
  const pages = buildPages(t, view, (k) => ({ onSelect: () => go(k) }), { bookings: siteId === 's1' ? 2 : 0, reviews: siteId === 's3' ? 2 : 0 })
  const v6Page = view === 'home' || view === 'analytics'

  return (
    <div dir="rtl" className={`zy-app ${dashFont.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      <SiteCtx.Provider value={sites}>
        <Frame
          dir="rtl"
          pages={pages}
          title={pages.find((p) => p.active)?.label || ''}
          home={{ onSelect: () => go('home') }}
          newSite={{ onSelect: () => go('sites') }}
          sites={frameSites(THEMES, [])}
          siteId={siteId}
          onSite={setSiteId}
          go={go}
          tools={
            <TopTools
              user={null}
              plan={{ label: 'Pro', tone: 'ok' }}
              demo={{
                name: 'نادية العامري',
                email: 'nadia@almadina.co',
                go,
                bell: [{ id: 'r1', title: 'تقييمان جديدان من Google', site: 'واحة العافية', when: 'اليوم 9:12 ص', onOpen: () => { setSiteId('s3'); go('reviews') } }],
              }}
            />
          }
          help={{ email: 'nadia@almadina.co', onSend: () => new Promise<void>((r) => setTimeout(r, 700)) }}
          moreOpen={more}
          setMoreOpen={setMore}
          legacy={!v6Page}
          pageKey={view}
        >
          {view === 'home' && <HomeView siteId={siteId} go={go} />}
          {view === 'analytics' && <V6Analytics get={demoAnalyticsGet as AnalyticsGet} demo nav={go} />}
          {view === 'sites' && <SitesView filter={siteFilter} setFilter={setSiteFilter} />}
          {view === 'gallery' && <GalleryView />}
          {view === 'bookings' && <BookingsView filter={bookingFilter} setFilter={setBookingFilter} />}
          {view === 'reviews' && <ReviewsView />}
          {view === 'seo' && <SeoView />}
          {view === 'domains' && <DomainsView />}
          {view === 'billing' && <BillingView />}
          {view === 'settings' && <SettingsView />}

          <p className="t-small" style={{ textAlign: 'center', padding: '28px 8px 8px', maxWidth: 640, marginInline: 'auto' }}>
            نسخة تجريبية من لوحة التحكم. الأرقام والمواقع والحجوزات هنا كلها بيانات
            تجريبية، ولا تسجّل هذه الصفحة دخول أحد ولا تقرأ حسابًا حقيقيًا.
          </p>
        </Frame>
      </SiteCtx.Provider>
      <DashIntro startOpen={intro} setMore={setMore} />
    </div>
  )
}

/** Home, on the sample account: the v6 page with the fixtures as its props. */
function HomeView({ siteId, go }: { siteId: string; go: (to: string) => void }) {
  const s = SITES.find((x) => x.id === siteId) || SITES[0]
  const kind = KIND[s.kind]
  const [metric, setMetric] = useState<Extract<TMetric, 'views' | 'visitors' | 'events'>>('views')
  const [range, setRange] = useState<TRange>('30d')
  const [day, setDay] = useState(0)
  const traffic = useMemo(() => (s.live ? demoTraffic(range, day) : null), [s.live, range, day])
  const week = useMemo(() => demoTraffic('7d', 0).totals.visitors, [])
  // «ابدأ من هنا» on the sample account: ticks live for this visit only.
  const [ticks, setTicks] = useState<Record<string, boolean>>({})
  const to = (v: string) => ({ onSelect: () => go(v) })
  const main = s.id === 's1'
  const book = (b: (typeof HOME_TODAY.list)[number] | (typeof HOME_TODAY.tomorrow)[number]) => ({
    id: b.id, time: b.time, name: b.name, people: b.people,
    status: b.status === 'confirmed' ? 'ok' as const : 'new' as const, hasNote: 'hasNote' in b && !!b.hasNote,
  })
  const props: V6HomeProps = {
    name: 'نادية',
    site: {
      id: s.id, name: s.name, live: s.live, host: s.host, url: s.host ? `https://${s.host}` : null,
      updated: UPDATED[s.id] || '', kind: s.kind,
      cover: kind && kind !== 'collective' ? `/theme-previews/phone/${kind}.webp` : null,
      edit: { href: '/demo/editor' }, preview: {},
    },
    newBookings: main ? 2 : 0,
    visitors7: s.live ? week : null,
    traffic, metric, onMetric: setMetric, range, onRange: setRange, day, onDay: setDay,
    today: main ? { list: HOME_TODAY.list.map(book), tomorrow: HOME_TODAY.tomorrow.map(book), week: HOME_TODAY.week } : { list: [], tomorrow: [], week: 0 },
    domain: main ? { host: 'almadina.ae', own: true, live: true } : s.host ? { host: s.host, own: false, live: true } : null,
    google: main ? { clicks: GSC_TOTALS.clicks, position: 1.2, query: 'مطعم المدينة' } : 'connect',
    reviews: main ? { rating: 4.7, count: 128, fresh: 1 } : 'add',
    start: ticks.hide ? null : { edited: !!ticks.edit, domain: main ? 'live' : null, shared: !!ticks.share },
    onStart: (step: StartStep) => setTicks((x) => ({ ...x, [step]: true })),
    launch: [
      { label: 'أنشئ موقعك', done: true },
      { label: 'خصّص محتواك', done: true },
      { label: 'انشر موقعك', done: s.live },
      { label: 'اربط نطاقك', done: false },
    ],
    links: {
      bookings: to('bookings'), analyticsDay1: to('analytics:day1'), analyticsSearch: to('analytics:search'),
      gallery: to('gallery'), seo: to('seo'), domains: to('domains'), reviews: to('reviews'),
      newSite: to('sites'), publish: to('sites'),
    },
  }
  return <V6Home {...props} />
}
