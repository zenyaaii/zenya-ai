'use client'

/**
 * The candidate dashboard's view. See page.tsx for why this route exists and
 * what is real in it.
 *
 * THREE SURFACES, ONE PAGE. The rail switches between the home, the analytics
 * and the bookings views rather than navigating, because /dashboard/* is not
 * on the demo host's allowlist and a real nav link would bounce the reader to
 * the apex on their first click. The rows that are not built out are present
 * and disabled: leaving them out would misrepresent the product's nav, and
 * making them look live would promise a page that is not here.
 *
 * dir="rtl" is hardcoded, like the other five candidates. The REAL dashboard
 * is bilingual and must not do this — it runs on lib/i18n and serves English —
 * but the candidate set is Arabic-only copy, and pinning the direction here
 * keeps it off the root layout's locale.
 */

import { useState } from 'react'
import {
  Home, Folder, BarChart3, Search, Globe, Image as ImageIcon, CreditCard,
  Settings, CalendarCheck, Plus, Bell, ChevronDown, Eye, Users, LogOut,
  Timer, MousePointerClick, ExternalLink, ArrowRight, Sparkles, CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { DASHBOARD_CSS } from '@/components/app/dashboard-style'
import { chromeFont } from '@/components/app/chrome-font'
import { Segmented } from '@/components/app/Segmented'
import TrendChart from '@/components/dashboard/analytics/TrendChart'
import { BarList, Delta, Tile } from '@/components/dashboard/analytics/primitives'
import ZenyaMark from '@/components/ZenyaMark'
import type { SeriesPoint } from '@/components/dashboard/analytics/types'

/* ── sample data ─────────────────────────────────────────────────────────
   Invented, and the standing note under the page says so. The shapes are the
   product's own (SeriesPoint, Row), so the real components render it exactly
   as they render a live payload.
------------------------------------------------------------------------- */

const DAYS = 30
const SERIES: SeriesPoint[] = Array.from({ length: DAYS }, (_, i) => {
  const views = Math.round(120 + 90 * Math.sin(i / 3.1) + (i % 5) * 18 + (i > 22 ? 60 : 0))
  return {
    date: new Date(Date.now() - (DAYS - 1 - i) * 864e5).toISOString().slice(0, 10),
    views,
    sessions: Math.round(views * 0.62),
    visitors: Math.round(views * 0.44),
    events: Math.round(views * 0.19),
  }
})
const PREV_SERIES: SeriesPoint[] = SERIES.map((p, i) => ({
  ...p,
  views: Math.round(p.views * 0.82 + (i % 7) * 4),
  sessions: Math.round(p.sessions * 0.79 + (i % 5) * 3),
  visitors: Math.round(p.visitors * 0.84 + (i % 6) * 2),
  events: Math.round(p.events * 0.71 + (i % 4) * 2),
}))

const row = (name: string, views: number) => ({
  name, views, sessions: Math.round(views * 0.6), visitors: Math.round(views * 0.42),
})

const CHANNELS = [
  row('بحث عضوي', 2740), row('مباشر', 1980), row('شبكات اجتماعية', 1240),
  row('إحالات', 560), row('بريد', 303),
]
const PAGES = [
  row('/', 3120), row('/menu', 1488), row('/reservations', 902),
  row('/about', 613), row('/contact', 402),
]

const SITES = [
  { name: 'مطعم المدينة', host: 'al-madina.zenyaai.co', live: true, views: 4821 },
  { name: 'أطلس ستوديو', host: 'atlas-studio.zenyaai.co', live: true, views: 1264 },
  { name: 'واحة العافية', host: 'waha.zenyaai.co', live: true, views: 738 },
  { name: 'لوك بوك ٢٦', host: null, live: false, views: 0 },
]

type BookingTone = 'accent' | 'ok' | 'quiet' | 'bad'
const BOOKINGS: Array<{
  name: string; site: string; when: string; party: string; phone: string
  status: string; tone: BookingTone; note?: string
}> = [
  { name: 'سارة الحمادي', site: 'مطعم المدينة', when: '2026-09-06 · 19:00', party: '2 أشخاص', phone: '+971501234510', status: 'جديد', tone: 'accent', note: 'نفضّل طاولة بجانب النافذة إن أمكن، ولدينا طفل صغير.' },
  { name: 'خالد بن راشد', site: 'واحة العافية', when: '2026-09-07 · 13:30', party: '3 أشخاص', phone: '+971501234511', status: 'مؤكّد', tone: 'ok' },
  { name: 'ليلى منصور', site: 'مطعم المدينة', when: '2026-09-08 · 20:30', party: '4 أشخاص', phone: '+971501234512', status: 'جديد', tone: 'accent' },
  { name: 'عمر الشريف', site: 'مطعم المدينة', when: '2026-09-04 · 21:00', party: '2 أشخاص', phone: '+971501234513', status: 'منجز', tone: 'quiet' },
  { name: 'هدى العتيبي', site: 'أطلس ستوديو', when: '2026-09-03 · 11:00', party: '5 أشخاص', phone: '+971501234514', status: 'ملغى', tone: 'bad' },
]

/* ── the views ───────────────────────────────────────────────────────────── */

type ViewKey = 'home' | 'analytics' | 'bookings'

const NAV: Array<{ key: ViewKey | null; label: string; icon: LucideIcon; group: 'work' | 'account' }> = [
  { key: 'home', label: 'الرئيسية', icon: Home, group: 'work' },
  { key: null, label: 'المواقع', icon: Folder, group: 'work' },
  { key: null, label: 'المعرض', icon: ImageIcon, group: 'work' },
  { key: 'analytics', label: 'التحليلات', icon: BarChart3, group: 'work' },
  { key: 'bookings', label: 'الحجوزات', icon: CalendarCheck, group: 'work' },
  { key: null, label: 'السيو', icon: Search, group: 'work' },
  { key: null, label: 'النطاقات', icon: Globe, group: 'work' },
  { key: null, label: 'الفوترة', icon: CreditCard, group: 'account' },
  { key: null, label: 'الإعدادات', icon: Settings, group: 'account' },
]

const TITLE: Record<ViewKey, string> = {
  home: 'الرئيسية',
  analytics: 'التحليلات',
  bookings: 'الحجوزات',
}

export default function DashboardDemoView() {
  const [view, setView] = useState<ViewKey>('home')
  const [metric, setMetric] = useState<'views' | 'visitors' | 'sessions' | 'events'>('views')
  const [range, setRange] = useState('30d')
  const [bookingFilter, setBookingFilter] = useState('all')

  const visibleBookings =
    bookingFilter === 'all' ? BOOKINGS : BOOKINGS.filter((b) => b.status === bookingFilter)

  return (
    <div dir="rtl" className={`zy-app ${chromeFont.variable} flex min-h-[100dvh] lg:h-screen lg:gap-2 lg:overflow-hidden lg:p-2`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />

      {/* ── the rail ── */}
      <aside className="zy-pane hidden w-[236px] flex-shrink-0 flex-col lg:flex">
        <div className="zy-rail-mark">
          <ZenyaMark className="h-[18px] text-[#171717]" />
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {(['work', 'account'] as const).map((g, gi) => (
            <div key={g} className={gi > 0 ? 'zy-rail-group mt-5' : 'zy-rail-group'}>
              <div className="zy-rail-label">{g === 'work' ? 'مساحة العمل' : 'الحساب'}</div>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map((n) => {
                  const Icon = n.icon
                  const on = n.key !== null && n.key === view
                  return (
                    <button
                      key={n.label}
                      type="button"
                      disabled={n.key === null}
                      onClick={() => n.key && setView(n.key)}
                      className="zy-rail-row w-full disabled:cursor-default disabled:opacity-45"
                      data-on={on ? '' : undefined}
                      aria-current={on ? 'page' : undefined}
                      title={n.key === null ? 'غير مشمولة في النسخة التجريبية' : undefined}
                    >
                      <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={on ? 2.25 : 1.9} />
                      <span className="flex-1 truncate text-start">{n.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="zy-rail-foot">
          <a href="https://zenyaai.co/?home=1">→ العودة إلى الموقع التسويقي</a>
        </div>
      </aside>

      {/* ── the work surface ── */}
      <div className="zy-pane flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="zy-top sticky top-0 z-30 lg:static">
          <div className="flex items-center gap-3">
            <h1 className="zy-top-title">{TITLE[view]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="zy-top-cta" role="presentation">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
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

        <main className="flex-1 lg:overflow-y-auto">
          {view === 'home' && <HomeView />}
          {view === 'analytics' && (
            <AnalyticsView
              metric={metric} setMetric={setMetric}
              range={range} setRange={setRange}
            />
          )}
          {view === 'bookings' && (
            <BookingsView
              filter={bookingFilter} setFilter={setBookingFilter}
              rows={visibleBookings}
            />
          )}

          <StandingNote />
        </main>
      </div>
    </div>
  )
}

/* ── home ────────────────────────────────────────────────────────────────── */

function HomeView() {
  const live = SITES.filter((s) => s.live).length
  const totalViews = SITES.reduce((s, x) => s + x.views, 0)
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="zy-h1">مرحبًا بعودتك، نادية</h2>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="zy-pill" data-tone="ok">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> PRO
        </span>
        <span className="zy-sub">nadia@almadina.co</span>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي المواقع" value={String(SITES.length)} sub={`${live} مباشر`} icon={Folder} />
        <StatCard label="مواقع مباشرة" value={String(live)} sub="مباشرة على zenyaai.co" icon={Globe} />
        <StatCard label="مشاهدات الصفحات" value={totalViews.toLocaleString('ar')} sub="مدى الحياة" icon={Eye} />
        <div className="rounded-2xl zy-card p-5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-[#15803d]" strokeWidth={2.5} />
            <span className="zy-eyebrow truncate">Pro نشط · استضافة مشمولة</span>
          </div>
          <div className="mt-1.5 text-[17px] font-black leading-[1.4] text-[#171717]">24.99$ / شهريًا</div>
          <div className="zy-sub mt-1">يتجدّد 14 أكتوبر 2026</div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h3 className="zy-h2">أحدث المواقع</h3>
            <span className="zy-link">عرض الكل ←</span>
          </div>
          <div className="space-y-2">
            {SITES.slice(0, 3).map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-2xl zy-card px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="zy-tile" data-tone={s.live ? 'ok' : 'warn'}>
                    {s.live ? <Globe className="h-4 w-4" strokeWidth={2} /> : <Folder className="h-4 w-4" strokeWidth={2} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-bold leading-[1.5] text-[#171717]">{s.name}</div>
                    <div className="text-[11.5px] font-medium leading-[1.7] text-[#56565a]">
                      {s.live ? s.host : 'مسوّدة · غير منشورة بعد'}
                    </div>
                  </div>
                </div>
                <span className="zy-btn-q">
                  فتح <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={2.25} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl zy-card p-5">
            <div className="zy-eyebrow">إجراءات سريعة</div>
            <div className="mt-3 space-y-1">
              {[
                { label: 'موقع جديد', icon: Plus },
                { label: 'إدارة النطاقات', icon: Globe },
                { label: 'افتح معرضي', icon: ImageIcon },
                { label: 'عرض التحليلات', icon: BarChart3 },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="zy-rail-row justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {label}
                  </span>
                  <ArrowRight className="h-3 w-3 rtl-flip opacity-50" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl zy-card p-5">
            <div className="zy-eyebrow">الترقية</div>
            <p className="mt-2 text-[13px] font-medium leading-[1.8] text-[#171717]">
              أضف نطاقك المخصّص واربطه بموقعك خلال دقائق.
            </p>
            <span className="zy-btn mt-3.5">
              إدارة النطاقات
              <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, icon: Icon,
}: { label: string; value: string; sub: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl zy-card p-5">
      <div className="flex items-start justify-between">
        <div className="zy-eyebrow">{label}</div>
        <Icon className="h-3.5 w-3.5 text-[#66666e]" strokeWidth={1.75} />
      </div>
      <div className="zy-num mt-2">{value}</div>
      <div className="zy-sub mt-1">{sub}</div>
    </div>
  )
}

/* ── analytics ───────────────────────────────────────────────────────────── */

function AnalyticsView({
  metric, setMetric, range, setRange,
}: {
  metric: 'views' | 'visitors' | 'sessions' | 'events'
  setMetric: (m: 'views' | 'visitors' | 'sessions' | 'events') => void
  range: string
  setRange: (r: string) => void
}) {
  const totals = SERIES.reduce(
    (a, s) => ({
      views: a.views + s.views, sessions: a.sessions + s.sessions,
      visitors: a.visitors + s.visitors, events: a.events + s.events,
    }),
    { views: 0, sessions: 0, visitors: 0, events: 0 },
  )
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="pb-5" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.08)' }}>
        <h2 className="zy-h1">التحليلات</h2>
        <p className="mt-1.5 text-[13px] font-medium leading-[1.8] text-[#56565a]">
          كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Segmented
          label="اختر المدة"
          value={range}
          onChange={setRange}
          items={[
            { key: '24h', label: '24 ساعة' }, { key: '7d', label: '7 أيام' },
            { key: '30d', label: '30 يومًا' }, { key: '90d', label: '90 يومًا' },
            { key: '12mo', label: 'سنة' },
          ]}
        />
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile
          label="الزوّار" value={totals.visitors.toLocaleString('ar')} icon={Users}
          delta={0.163} sub="أشخاص مختلفون" spark={SERIES.map((s) => s.visitors)}
          active={metric === 'visitors'} onClick={() => setMetric('visitors')}
        />
        <Tile
          label="الجلسات" value={totals.sessions.toLocaleString('ar')} icon={LogOut}
          delta={0.198} sub="زيارات منفصلة"
          active={metric === 'sessions'} onClick={() => setMetric('sessions')}
        />
        <Tile
          label="المشاهدات" value={totals.views.toLocaleString('ar')} icon={Eye}
          delta={0.247} sub="صفحات مفتوحة"
          active={metric === 'views'} onClick={() => setMetric('views')}
        />
        <Tile
          label="التواصل" value={totals.events.toLocaleString('ar')} icon={MousePointerClick}
          delta={0.312} sub="واتساب · هاتف · حجز"
          active={metric === 'events'} onClick={() => setMetric('events')}
        />
      </section>

      <div className="mt-6">
        <TrendChart
          series={SERIES}
          prevSeries={PREV_SERIES}
          metric={metric}
          onMetricChange={setMetric}
          showPrev
          compareLabel="المدة السابقة"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl zy-card">
          <div className="flex items-baseline justify-between px-4 pb-1 pt-4">
            <h3 className="zy-h3">من أين يأتون</h3>
            <span className="text-[11.5px] font-medium text-[#66666e]">آخر 30 يومًا</span>
          </div>
          <BarList rows={CHANNELS} />
        </div>
        <div className="rounded-2xl zy-card">
          <div className="flex items-baseline justify-between px-4 pb-1 pt-4">
            <h3 className="zy-h3">أهم الصفحات</h3>
            <span className="text-[11.5px] font-medium text-[#66666e]">5 صفحات</span>
          </div>
          <BarList rows={PAGES} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl zy-card p-5">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-[#66666e]" strokeWidth={2} />
          <span className="zy-sub">متوسط المدة 1 د 36 ث</span>
        </div>
        <Delta value={0.081} />
      </div>
    </div>
  )
}

/* ── bookings ────────────────────────────────────────────────────────────── */

function BookingsView({
  filter, setFilter, rows,
}: {
  filter: string
  setFilter: (f: string) => void
  rows: typeof BOOKINGS
}) {
  const count = (s: string) => BOOKINGS.filter((b) => b.status === s).length
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="zy-h1 flex items-center gap-2.5">
            <CalendarCheck className="h-[22px] w-[22px] shrink-0 text-[#5e6ad2]" strokeWidth={2} />
            الحجوزات
          </h2>
          <p className="mt-1.5 text-[13px] font-medium leading-[1.8] text-[#56565a]">
            كل طلبات الحجز والمواعيد التي يرسلها زوّار مواقعك تصلك هنا.
          </p>
        </div>
        <span className="zy-pill" data-tone="accent">
          <Sparkles className="h-3 w-3" /> مفعّلة
        </span>
      </div>

      <Segmented
        className="mb-4"
        label="تصفية حسب الحالة"
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'all', label: `الكل ${BOOKINGS.length}` },
          { key: 'جديد', label: `جديد ${count('جديد')}` },
          { key: 'مؤكّد', label: `مؤكّد ${count('مؤكّد')}` },
          { key: 'منجز', label: `منجز ${count('منجز')}` },
          { key: 'ملغى', label: `ملغى ${count('ملغى')}` },
        ]}
      />

      <ul className="space-y-3">
        {rows.map((b) => (
          <li key={b.name} className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-black leading-[1.5] text-[#171717]">{b.name}</span>
                  <span className="zy-pill" data-tone="quiet">حجز طاولة</span>
                </div>
                <p className="mt-1 text-[11.5px] font-medium leading-[1.7] text-[#66666e]">{b.site}</p>
              </div>
              <span className="zy-pill shrink-0" data-tone={b.tone}>{b.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] font-medium text-[#171717]">
              <span dir="ltr">{b.phone}</span>
              <span>{b.party}</span>
              <span>{b.when}</span>
            </div>
            {b.note && (
              <p className="mt-3 rounded-[10px] bg-[#f4f4f6] px-3 py-2.5 text-[12.5px] font-medium leading-[1.8] text-[#56565a]">
                {b.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── the standing note ───────────────────────────────────────────────────── */

function StandingNote() {
  return (
    <p className="mx-auto max-w-7xl px-6 pb-10 pt-2 text-center text-[11.5px] font-medium leading-[1.9] text-[#66666e]">
      نسخة تجريبية من لوحة التحكم. الأرقام والمواقع والحجوزات هنا كلها بيانات
      تجريبية، ولا تسجّل هذه الصفحة دخول أحد ولا تقرأ حسابًا حقيقيًا. لوحة
      التحكم الفعلية على{' '}
      <a href="https://zenyaai.co/dashboard" className="zy-link" style={{ display: 'inline' }}>
        zenyaai.co/dashboard
      </a>{' '}
      وتحتاج تسجيل دخول.
    </p>
  )
}
