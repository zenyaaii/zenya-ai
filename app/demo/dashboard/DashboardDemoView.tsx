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
 * ── THE PHONE GETS A REAL NAV, AND IT DID NOT BEFORE ──────────────────────
 * The rail is lg:flex, so below 1024px it is simply not there. The first
 * version of this page shipped with nothing in its place: measured at 390px,
 * the number of reachable nav rows was ZERO, which meant a phone reader landed
 * on the home view and could never leave it. That is not a styling nit, it is
 * two thirds of the candidate being unreachable on the device most people
 * would open a link on.
 *
 * So the bar carries a hamburger below lg and it opens a drawer holding the
 * same nav the rail holds. The drawer is the product's own pattern — Sidebar
 * does exactly this — and it closes on pick, on scrim tap, and on Escape,
 * because a drawer that only closes one way strands whoever guessed wrong.
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
import {
  BarChart3, Bell, CalendarCheck, ChevronDown, CreditCard, Folder, Globe,
  Home, Image as ImageIcon, Menu, Plus, Search, Settings, X, type LucideIcon,
} from 'lucide-react'
import { DASHBOARD_CSS } from '@/components/app/dashboard-style'
import { chromeFont } from '@/components/app/chrome-font'
import ZenyaMark from '@/components/ZenyaMark'
import {
  AnalyticsView, BillingView, BookingsView, DomainsView, GalleryView,
  HomeView, SeoView, SettingsView, SitesView,
} from './views'

type ViewKey =
  | 'home' | 'sites' | 'gallery' | 'analytics' | 'bookings'
  | 'seo' | 'domains' | 'billing' | 'settings'

const NAV: Array<{ key: ViewKey; label: string; icon: LucideIcon; group: 'work' | 'account' }> = [
  { key: 'home',      label: 'الرئيسية',  icon: Home,          group: 'work' },
  { key: 'sites',     label: 'المواقع',   icon: Folder,        group: 'work' },
  { key: 'gallery',   label: 'المعرض',    icon: ImageIcon,     group: 'work' },
  { key: 'analytics', label: 'التحليلات', icon: BarChart3,     group: 'work' },
  { key: 'bookings',  label: 'الحجوزات',  icon: CalendarCheck, group: 'work' },
  { key: 'seo',       label: 'السيو',     icon: Search,        group: 'work' },
  { key: 'domains',   label: 'النطاقات',  icon: Globe,         group: 'work' },
  { key: 'billing',   label: 'الفوترة',   icon: CreditCard,    group: 'account' },
  { key: 'settings',  label: 'الإعدادات', icon: Settings,      group: 'account' },
]

const TITLE = Object.fromEntries(NAV.map((n) => [n.key, n.label])) as Record<ViewKey, string>

export default function DashboardDemoView() {
  const [view, setView] = useState<ViewKey>('home')
  const [drawer, setDrawer] = useState(false)
  const [metric, setMetric] = useState<'views' | 'visitors' | 'sessions' | 'events'>('views')
  const [range, setRange] = useState('30d')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')

  const go = useCallback((v: string) => {
    setView(v as ViewKey)
    setDrawer(false)
    // A view change is a page change to the reader, so it starts at the top.
    // The scroller is <main> on desktop and the document on a phone, so both
    // are reset rather than guessing which one is live at this width.
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
      document.getElementById('zy-main')?.scrollTo(0, 0)
    }
  }, [])

  // Escape closes the drawer. A drawer that only closes by finding the small
  // X, or by hitting a scrim you cannot see the edge of, strands people.
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    document.addEventListener('keydown', onKey)
    // The page behind a modal drawer must not scroll under it.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawer])

  const navRows = (onPick: () => void) =>
    (['work', 'account'] as const).map((g, gi) => (
      <div key={g} className={gi > 0 ? 'zy-rail-group mt-5' : 'zy-rail-group'}>
        <div className="zy-rail-label">{g === 'work' ? 'مساحة العمل' : 'الحساب'}</div>
        <div className="space-y-0.5">
          {NAV.filter((n) => n.group === g).map((n) => {
            const Icon = n.icon
            const on = n.key === view
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => { go(n.key); onPick() }}
                className="zy-rail-row w-full"
                data-on={on ? '' : undefined}
                aria-current={on ? 'page' : undefined}
              >
                <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={on ? 2.25 : 1.9} />
                <span className="flex-1 truncate text-start">{n.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    ))

  return (
    <div dir="rtl" className={`zy-app ${chromeFont.variable} flex min-h-[100dvh] lg:h-screen lg:gap-2 lg:overflow-hidden lg:p-2`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />

      {/* ── the rail, desktop only ── */}
      <aside className="zy-pane hidden w-[236px] flex-shrink-0 flex-col lg:flex">
        <div className="zy-rail-mark">
          <ZenyaMark className="h-[18px] text-[#171717]" />
        </div>
        <nav className="flex-1 overflow-y-auto py-3">{navRows(() => {})}</nav>
        <div className="zy-rail-foot">
          <a href="https://zenyaai.co/?home=1">→ العودة إلى الموقع التسويقي</a>
        </div>
      </aside>

      {/* ── the drawer, below lg ── */}
      {drawer && (
        <>
          <div className="zy-scrim" data-open onClick={() => setDrawer(false)} aria-hidden />
          <aside className="zy-drawer" data-open role="dialog" aria-modal="true" aria-label="التنقّل">
            <div className="zy-drawer-head">
              <ZenyaMark className="h-[18px] text-[#171717]" />
              <button type="button" onClick={() => setDrawer(false)} className="zy-icon-btn inline-flex" aria-label="أغلق القائمة">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">{navRows(() => setDrawer(false))}</nav>
            <div className="zy-rail-foot">
              <a href="https://zenyaai.co/?home=1">→ العودة إلى الموقع التسويقي</a>
            </div>
          </aside>
        </>
      )}

      {/* ── the work surface ── */}
      <div className="zy-pane flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="zy-top sticky top-0 z-30 lg:static">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="zy-icon-btn inline-flex lg:hidden"
              aria-label="افتح القائمة"
              aria-expanded={drawer}
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <h1 className="zy-top-title truncate">{TITLE[view]}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="zy-top-cta" role="presentation">
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span className="hidden sm:inline">موقع جديد</span>
            </span>
            <span className="zy-icon-btn relative hidden sm:inline-flex" aria-hidden>
              <Bell className="h-4 w-4" />
            </span>
            <span className="zy-top-acct" role="presentation">
              <span className="zy-top-av">ن</span>
              <span className="zy-top-name hidden sm:block">نادية</span>
              <ChevronDown className="hidden h-3 w-3 text-[#66666e] sm:block" strokeWidth={2.25} />
            </span>
          </div>
        </header>

        <main id="zy-main" className="flex-1 lg:overflow-y-auto">
          {view === 'home' && <HomeView go={go} />}
          {view === 'sites' && <SitesView filter={siteFilter} setFilter={setSiteFilter} />}
          {view === 'gallery' && <GalleryView />}
          {view === 'analytics' && (
            <AnalyticsView metric={metric} setMetric={setMetric} range={range} setRange={setRange} />
          )}
          {view === 'bookings' && <BookingsView filter={bookingFilter} setFilter={setBookingFilter} />}
          {view === 'seo' && <SeoView />}
          {view === 'domains' && <DomainsView />}
          {view === 'billing' && <BillingView />}
          {view === 'settings' && <SettingsView />}

          <p className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-center text-[11.5px] font-medium leading-[1.9] text-[#66666e] sm:px-6">
            نسخة تجريبية من لوحة التحكم. الأرقام والمواقع والحجوزات هنا كلها بيانات
            تجريبية، ولا تسجّل هذه الصفحة دخول أحد ولا تقرأ حسابًا حقيقيًا. لوحة
            التحكم الفعلية سطح خاص يحتاج تسجيل دخول، وليس جزءًا من هذه المعاينة.
          </p>
        </main>
      </div>
    </div>
  )
}
