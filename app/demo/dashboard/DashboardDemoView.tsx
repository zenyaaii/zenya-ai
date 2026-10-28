'use client'

/**
 * The candidate dashboard's shell. See page.tsx for why this route exists and
 * what is real in it; views.tsx holds the nine surfaces and data.ts the
 * fixtures.
 *
 * NINE SURFACES, ONE PAGE. The rail switches the view rather than navigating,
 * because /dashboard/* is not on the demo host's allowlist and a real nav link
 * would bounce the reader to the apex on their first click.
 *
 * ── ONE FRAME WITH THE PRODUCT ────────────────────────────────────────────
 * The rail, the top bar, the phone dock and its "More" sheet, search and the
 * light/dark switch are components/app/frame/DashFrame — the same frame
 * AppShell draws. Here each row switches the view instead of linking.
 *
 * ── dir ───────────────────────────────────────────────────────────────────
 * dir="rtl" is hardcoded, like the other five candidates. The REAL dashboard
 * is bilingual and must not do this — it runs on lib/i18n and serves English —
 * but the candidate set is Arabic-only copy. Every layout underneath is
 * written with logical properties anyway, so it would follow either.
 *
 * ── NOTHING HERE IS A DOOR INTO THE PRODUCT ───────────────────────────────
 * No link to the real dashboard, no sign-in, no control that navigates
 * anywhere a session would be asked for: the header's "موقع جديد" and the
 * account chip are spans with role="presentation". A candidate page's job is
 * to be looked at. The one outbound link is the marketing apex, which every
 * candidate in the set carries.
 */

import { useCallback, useEffect, useState } from 'react'
import { DASHBOARD_CSS } from '@/components/app/dashboard-style'
import { dashFont } from '@/components/app/dash-font'
import { ReportProblem } from '@/components/app/ReportProblem'
import { NotificationsBell } from '@/components/app/NotificationsBell'
import DashFrame from '@/components/app/frame/DashFrame'
import { PAGE_ROUTE, buildNav, type PageKey } from '@/components/app/frame/nav'
import { useT } from '@/components/i18n/LocaleProvider'
import DashIntro, { type IntroVariant } from '@/components/app/intro/DashIntro'
import {
  AnalyticsView, BillingView, BookingsView, DomainsView, GalleryView,
  HomeView, ReviewsView, SeoView, SettingsView, SitesView,
} from './views'

type ViewKey = PageKey
const VIEWS = Object.keys(PAGE_ROUTE) as ViewKey[]

/** The nine screens are one page with a rail, so without this the eight that
 *  are not 'home' had no address at all — they could be reached by clicking
 *  and by no other means, which makes them impossible to link to, to send to
 *  somebody, or to reopen. ?view= gives each one a URL.
 *
 *  It is read once on mount and written with replaceState rather than through
 *  the router: switching views is not a navigation (no data is fetched and
 *  the page does not change), so it should not push a history entry the back
 *  button then has to walk through. */
function viewFromLocation(): ViewKey {
  if (typeof window === 'undefined') return 'home'
  const v = new URLSearchParams(window.location.search).get('view')
  return VIEWS.includes(v as ViewKey) ? (v as ViewKey) : 'home'
}

const INTRO: Record<string, IntroVariant> = { a: 'story', b: 'steps', c: 'card' }

export default function DashboardDemoView() {
  const [view, setView] = useState<ViewKey>('home')
  const t = useT()
  const [drawer, setDrawer] = useState(false)
  const [metric, setMetric] = useState<'views' | 'visitors' | 'sessions' | 'events'>('views')
  const [range, setRange] = useState('30d')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  /** ?intro=a|b|c shows one of the three intro samples. */
  const [intro, setIntro] = useState<IntroVariant | null>(null)
  const fakeSend = () => new Promise<void>((r) => setTimeout(r, 700))

  /* Read the address on mount. Deliberately in an effect rather than in the
     useState initialiser: the initialiser also runs on the server, where
     there is no location, and the two renders would disagree. */
  useEffect(() => {
    const v = viewFromLocation()
    if (v !== 'home') setView(v)
    const i = new URLSearchParams(window.location.search).get('intro')
    if (i && i in INTRO) setIntro(INTRO[i])
  }, [])

  const go = useCallback((v: string) => {
    setView(v as ViewKey)
    setDrawer(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (v === 'home') url.searchParams.delete('view')
      else url.searchParams.set('view', v)
      window.history.replaceState(null, '', url)
    }
    // A view change is a page change to the reader, so it starts at the top.
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  const groups = buildNav(t, view, (k) => ({ onSelect: () => go(k) }))

  return (
    <div dir="rtl" className={`zy-app ${dashFont.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      <DashFrame
        dir="rtl"
        groups={groups}
        title={groups.flatMap((g) => g.items).find((i) => i.active)?.label || ''}
        onHome={() => go('home')}
        newSite={{ onSelect: () => {} }}
        tools={
          <>
            <NotificationsBell items={[{ id: 'r1', title: 'تقييمان جديدان من Google', site: 'واحة العافية', when: 'اليوم 9:12 ص', onOpen: () => go('reviews') }]} />
            <span className="zy-top-acct" role="presentation" data-tour="account"><span className="zy-top-av">ن</span></span>
          </>
        }
        foot={<ReportProblem email="nadia@example.com" onSend={fakeSend} />}
        moreOpen={drawer}
        setMoreOpen={setDrawer}
      >
      <main>
        {view === 'home' && <HomeView go={go} />}
        {view === 'sites' && <SitesView filter={siteFilter} setFilter={setSiteFilter} />}
        {view === 'gallery' && <GalleryView />}
        {view === 'analytics' && (
          <AnalyticsView metric={metric} setMetric={setMetric} range={range} setRange={setRange} />
        )}
        {view === 'bookings' && <BookingsView filter={bookingFilter} setFilter={setBookingFilter} />}
        {view === 'reviews' && <ReviewsView />}
        {view === 'seo' && <SeoView />}
        {view === 'domains' && <DomainsView />}
        {view === 'billing' && <BillingView />}
        {view === 'settings' && <SettingsView />}

        <p className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-center text-[14.5px] font-medium leading-[1.9] text-[#66666e] sm:px-6">
          نسخة تجريبية من لوحة التحكم. الأرقام والمواقع والحجوزات هنا كلها بيانات
          تجريبية، ولا تسجّل هذه الصفحة دخول أحد ولا تقرأ حسابًا حقيقيًا. لوحة
          التحكم الفعلية سطح خاص يحتاج تسجيل دخول، وليس جزءًا من هذه المعاينة.
        </p>
      </main>
      </DashFrame>
      {intro && <DashIntro key={intro} variant={intro} onClose={() => setIntro(null)} setMore={setDrawer} />}
    </div>
  )
}
