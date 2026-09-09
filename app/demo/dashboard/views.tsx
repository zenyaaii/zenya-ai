'use client'

/**
 * The candidate dashboard's nine surfaces.
 *
 * EVERY LAYOUT HERE IS MOBILE-FIRST AND EVERY EDGE IS LOGICAL. The base
 * declaration is the phone; sm: and lg: add columns. Nothing uses left/right,
 * so all of it follows dir. Three rules hold across the file because they are
 * the three ways a dense product UI breaks on a 390px screen:
 *
 *   1. A GRID NEVER GOES BELOW TWO COLUMNS FOR STAT TILES, and never above one
 *      for anything with a sentence in it. Four full-width stat cards on a
 *      phone is four screens of scrolling for four numbers.
 *   2. A ROW THAT CANNOT FIT WRAPS, IT DOES NOT SCROLL SIDEWAYS. The only
 *      horizontal scrollers are the ones that are meant to be: the segmented
 *      controls, the tab bar, and any real table, each of which owns its own
 *      overflow so the PAGE never gets one.
 *   3. min-w-0 ON EVERY FLEX CHILD THAT HOLDS TEXT. A flex item defaults to
 *      min-width:auto, which is its longest unbreakable run - one long domain
 *      or e-mail then pushes the row wider than the screen and takes the whole
 *      document with it.
 *
 * The components imported from components/dashboard/analytics are the ones the
 * product ships. Nothing here reimplements them.
 */

import {
  ArrowRight, ArrowUpRight, BarChart3, CalendarCheck, CheckCircle2, CreditCard,
  Download, ExternalLink, Eye, Folder, Globe, Image as ImageIcon, LogOut,
  MousePointerClick, Plus, Search, Settings, ShieldCheck, Sparkles, Timer,
  Trash2, Upload, Users, type LucideIcon,
} from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import TrendChart from '@/components/dashboard/analytics/TrendChart'
import { BarList, Delta, Tile } from '@/components/dashboard/analytics/primitives'
import {
  ASSETS, BOOKINGS, CHANNELS, DOMAINS, INVOICES, PAGES, PLAN_INCLUDES,
  PREV_SERIES, SERIES, SEO_SITE, SITES, TOTALS,
  type BookingTone, type DemoBooking,
} from './data'

/* ── shared page furniture ───────────────────────────────────────────────── */

/**
 * The page frame. px-4 on a phone rather than px-6: at 390px, twelve extra
 * pixels of gutter is a word of Arabic on every line of every card.
 */
export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
}

export function PageHead({
  title, sub, icon: Icon, aside,
}: {
  title: string
  sub: string
  icon?: LucideIcon
  aside?: React.ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pb-5" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.08)' }}>
      <div className="min-w-0 flex-1">
        <h2 className="zy-h1 flex items-center gap-2.5">
          {Icon && <Icon className="h-[22px] w-[22px] shrink-0 text-[#5e6ad2]" strokeWidth={2} />}
          <span className="min-w-0">{title}</span>
        </h2>
        <p className="mt-1.5 text-[13px] font-medium leading-[1.8] text-[#56565a]">{sub}</p>
      </div>
      {aside && <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>}
    </header>
  )
}

export function StatCard({
  label, value, sub, icon: Icon,
}: { label: string; value: string; sub?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl zy-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="zy-eyebrow min-w-0">{label}</div>
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#66666e]" strokeWidth={1.75} />
      </div>
      <div className="zy-num mt-2">{value}</div>
      {sub && <div className="zy-sub mt-1">{sub}</div>}
    </div>
  )
}

/** Two up on a phone, four up from sm. Never one up — see rule 1. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</section>
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="zy-sub px-1 py-6 text-center">{children}</p>
}

/* ── 1. home ─────────────────────────────────────────────────────────────── */

export function HomeView({ go }: { go: (v: string) => void }) {
  const live = SITES.filter((s) => s.live).length
  const totalViews = SITES.reduce((a, s) => a + s.views, 0)
  return (
    <Page>
      <h2 className="zy-h1">مرحبًا بعودتك، نادية</h2>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="zy-pill" data-tone="ok">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Pro
        </span>
        <span className="zy-sub">nadia@almadina.co</span>
      </div>

      <div className="mt-6">
        <StatGrid>
          <StatCard label="إجمالي المواقع" value={String(SITES.length)} sub={`${live} مباشر`} icon={Folder} />
          <StatCard label="مواقع مباشرة" value={String(live)} sub="على zenyaai.co" icon={Globe} />
          <StatCard label="المشاهدات" value={totalViews.toLocaleString('ar')} sub="مدى الحياة" icon={Eye} />
          <StatCard label="الحجوزات" value={String(BOOKINGS.length)} sub="هذا الشهر" icon={CalendarCheck} />
        </StatGrid>
      </div>

      {/* One column on a phone and a tablet; the aside only earns its own
          column once there is room for two real measures side by side. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:gap-6">
        <section className="min-w-0 lg:col-span-2">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 className="zy-h2">أحدث المواقع</h3>
            <button type="button" onClick={() => go('sites')} className="zy-link shrink-0">
              عرض الكل ←
            </button>
          </div>
          <div className="space-y-2">
            {SITES.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl zy-card px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="zy-tile" data-tone={s.live ? 'ok' : 'warn'}>
                    {s.live ? <Globe className="h-4 w-4" strokeWidth={2} /> : <Folder className="h-4 w-4" strokeWidth={2} />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-bold leading-[1.5] text-[#171717]">{s.name}</div>
                    <div className="truncate text-[11.5px] font-medium leading-[1.7] text-[#56565a]">
                      {s.live ? s.host : 'مسوّدة · غير منشورة بعد'}
                    </div>
                  </div>
                </div>
                <span className="zy-btn-q shrink-0">
                  فتح <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={2.25} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="zy-eyebrow">إجراءات سريعة</div>
            <div className="mt-3 space-y-1">
              {([
                { label: 'موقع جديد', icon: Plus, to: 'sites' },
                { label: 'إدارة النطاقات', icon: Globe, to: 'domains' },
                { label: 'افتح معرضي', icon: ImageIcon, to: 'gallery' },
                { label: 'عرض التحليلات', icon: BarChart3, to: 'analytics' },
              ] as const).map(({ label, icon: Icon, to }) => (
                <button key={label} type="button" onClick={() => go(to)} className="zy-rail-row w-full justify-between">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                    <span className="truncate">{label}</span>
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 rtl-flip opacity-50" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="zy-eyebrow">خطة الإطلاق</div>
            <ul className="mt-3 space-y-2.5">
              {[['أنشئ موقعك', true], ['خصّص محتواك', true], ['انشُر موقعك', true], ['اربط نطاقك', false]].map(([label, done]) => (
                <li key={String(label)} className="flex items-center gap-2.5 text-[13px] font-medium text-[#171717]">
                  <CheckCircle2
                    className={'h-4 w-4 shrink-0 ' + (done ? 'text-[#15803d]' : 'text-[rgba(17,17,17,0.18)]')}
                    strokeWidth={2.25}
                  />
                  <span className={done ? 'text-[#56565a] line-through' : ''}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Page>
  )
}

/* ── 2. sites ────────────────────────────────────────────────────────────── */

export function SitesView({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const rows =
    filter === 'live' ? SITES.filter((s) => s.live)
      : filter === 'draft' ? SITES.filter((s) => !s.live)
        : SITES
  return (
    <Page>
      <PageHead
        title="مواقعك"
        sub={`${SITES.length} مواقع · ${SITES.filter((s) => s.live).length} مباشر · ${SITES.filter((s) => !s.live).length} مسوّدات`}
        icon={Folder}
        aside={<span className="zy-btn"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} />موقع جديد</span>}
      />
      <Segmented
        className="mb-4"
        label="تصفية المواقع"
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'all', label: `الكل ${SITES.length}` },
          { key: 'live', label: `مباشر ${SITES.filter((s) => s.live).length}` },
          { key: 'draft', label: `مسوّدات ${SITES.filter((s) => !s.live).length}` },
        ]}
      />

      {/* One column on a phone: a site card carries a name, an address and
          three actions, and none of that survives a 180px column. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <article key={s.id} className="flex flex-col overflow-hidden rounded-2xl zy-card">
            {/* Stands in for the site's own screenshot. It carries the site's
                initial rather than a lone icon in an empty box: at 390px a
                16:9 field of flat grey with a 34px glyph in the middle reads
                as an image that failed to load, not as a placeholder. 16:10
                rather than 16:9 for the same reason - it is 40px less dead
                space on a phone, where the card is the full measure. */}
            <div className="relative flex aspect-[16/10] items-center justify-center bg-[#f4f4f6] sm:aspect-[16/9]">
              <span className="select-none text-[56px] font-black leading-none text-[rgba(17,17,17,0.17)]">
                {s.name.trim().charAt(0)}
              </span>
              <span className="absolute top-3" style={{ insetInlineStart: '0.75rem' }}>
                <span className="zy-pill" data-tone={s.live ? 'ok' : 'warn'}>{s.live ? 'مباشر' : 'مسوّدة'}</span>
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="truncate text-[14.5px] font-black leading-[1.5] text-[#171717]">{s.name}</h3>
              <p className="mt-0.5 text-[11.5px] font-medium leading-[1.7] text-[#66666e]">{s.kind} · {s.updated}</p>
              {s.host && (
                <p className="mt-2 truncate text-[12px] font-medium text-[#5e6ad2]" dir="ltr">{s.host}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="zy-btn-q">تعديل</span>
                <span className="zy-btn-q">معاينة</span>
                <span className="zy-btn">{s.live ? 'أضف نطاقًا' : 'انشر'}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {rows.length === 0 && <EmptyHint>لا مواقع في هذا التصنيف.</EmptyHint>}
    </Page>
  )
}

/* ── 3. gallery ──────────────────────────────────────────────────────────── */

export function GalleryView() {
  return (
    <Page>
      <PageHead
        title="المعرض"
        sub="كل الصور والملفات التي تستخدمها مواقعك، في مكان واحد."
        icon={ImageIcon}
        aside={<span className="zy-btn"><Upload className="h-3.5 w-3.5" strokeWidth={2.5} />ارفع ملفًا</span>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="zy-pill" data-tone="quiet">{ASSETS.length} ملفًا</span>
        <span className="zy-pill" data-tone="quiet">3.1 م.ب مستخدمة</span>
      </div>

      {/* Two up on a phone, six up on a wide screen. A thumbnail grid is the
          one place a phone can carry more than one column comfortably. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {ASSETS.map((a) => (
          <figure key={a.id} className="group overflow-hidden rounded-2xl zy-card">
            <div className="aspect-square w-full" style={{ background: a.tint }} aria-hidden />
            <figcaption className="min-w-0 p-2.5">
              <div className="truncate text-[12px] font-bold leading-[1.5] text-[#171717]">{a.name}</div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate text-[10.5px] font-medium text-[#66666e]">{a.site}</span>
                <span className="shrink-0 text-[10.5px] font-medium tabular-nums text-[#66666e]">{a.size}</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Page>
  )
}

/* ── 4. analytics ────────────────────────────────────────────────────────── */

type MetricKey = 'views' | 'visitors' | 'sessions' | 'events'

export function AnalyticsView({
  metric, setMetric, range, setRange,
}: {
  metric: MetricKey; setMetric: (m: MetricKey) => void
  range: string; setRange: (r: string) => void
}) {
  return (
    <Page>
      <PageHead
        title="التحليلات"
        sub="كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا."
        icon={BarChart3}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
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

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="الزوّار" value={TOTALS.visitors.toLocaleString('ar')} icon={Users}
          delta={16.3} sub="أشخاص مختلفون" spark={SERIES.map((s) => s.visitors)}
          active={metric === 'visitors'} onClick={() => setMetric('visitors')} />
        <Tile label="الجلسات" value={TOTALS.sessions.toLocaleString('ar')} icon={LogOut}
          delta={19.8} sub="زيارات منفصلة"
          active={metric === 'sessions'} onClick={() => setMetric('sessions')} />
        <Tile label="المشاهدات" value={TOTALS.views.toLocaleString('ar')} icon={Eye}
          delta={24.7} sub="صفحات مفتوحة"
          active={metric === 'views'} onClick={() => setMetric('views')} />
        <Tile label="التواصل" value={TOTALS.events.toLocaleString('ar')} icon={MousePointerClick}
          delta={31.2} sub="واتساب · هاتف · حجز"
          active={metric === 'events'} onClick={() => setMetric('events')} />
      </section>

      <div className="mt-5">
        <TrendChart
          series={SERIES} prevSeries={PREV_SERIES}
          metric={metric} onMetricChange={setMetric}
          showPrev compareLabel="المدة السابقة"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl zy-card">
          <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-4">
            <h3 className="zy-h3">من أين يأتون</h3>
            <span className="shrink-0 text-[11.5px] font-medium text-[#66666e]">آخر 30 يومًا</span>
          </div>
          <BarList rows={CHANNELS} />
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl zy-card">
          <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-4">
            <h3 className="zy-h3">أهم الصفحات</h3>
            <span className="shrink-0 text-[11.5px] font-medium text-[#66666e]">5 صفحات</span>
          </div>
          <BarList rows={PAGES} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl zy-card p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-2">
          <Timer className="h-4 w-4 shrink-0 text-[#66666e]" strokeWidth={2} />
          <span className="zy-sub">متوسط المدة 1 د 36 ث</span>
        </div>
        <Delta value={8.1} />
      </div>
    </Page>
  )
}

/* ── 5. bookings ─────────────────────────────────────────────────────────── */

export function BookingsView({
  filter, setFilter,
}: { filter: string; setFilter: (f: string) => void }) {
  const rows = filter === 'all' ? BOOKINGS : BOOKINGS.filter((b) => b.status === filter)
  const count = (s: string) => BOOKINGS.filter((b) => b.status === s).length
  return (
    <Page>
      <PageHead
        title="الحجوزات"
        sub="كل طلبات الحجز والمواعيد التي يرسلها زوّار مواقعك تصلك هنا."
        icon={CalendarCheck}
        aside={<span className="zy-pill" data-tone="accent"><Sparkles className="h-3 w-3" /> مفعّلة</span>}
      />
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
        {rows.map((b: DemoBooking) => (
          <li key={b.name} className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-black leading-[1.5] text-[#171717]">{b.name}</span>
                  <span className="zy-pill" data-tone="quiet">{b.kind}</span>
                </div>
                <p className="mt-1 truncate text-[11.5px] font-medium leading-[1.7] text-[#66666e]">{b.site}</p>
              </div>
              <span className="zy-pill shrink-0" data-tone={b.tone}>{b.status}</span>
            </div>
            {/* Wraps rather than scrolls: three facts, each of which must stay
                whole, on a screen that can only hold two of them per line. */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] font-medium text-[#171717]">
              <span dir="ltr" className="tabular-nums">{b.phone}</span>
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
      {rows.length === 0 && <EmptyHint>لا حجوزات في هذه الحالة.</EmptyHint>}
    </Page>
  )
}

/* ── 6. seo ──────────────────────────────────────────────────────────────── */

export function SeoView() {
  return (
    <Page>
      <PageHead
        title="السيو"
        sub="تحكّم في شكل موقعك داخل جوجل — العنوان، الوصف، ومعاينة النتيجة الحيّة."
        icon={Search}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SITES.filter((s) => s.live).map((s, i) => (
          <span key={s.id} className="zy-pill" data-tone={i === 0 ? 'accent' : 'quiet'}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: '#15803d' }} />
            {s.name}
          </span>
        ))}
      </div>

      {/* The preview comes FIRST on a phone and second on a desktop: on a
          narrow screen the reader wants to see what the change looks like
          before a column of fields, and order-first is the only honest way
          to do that without duplicating the markup. */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="min-w-0 lg:order-2 lg:col-span-2">
          <div className="rounded-2xl zy-card p-4">
            <h3 className="zy-h3 mb-3">معاينة نتيجة جوجل</h3>
            <div className="rounded-[10px] bg-[#f4f4f6] p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#5e6ad2]">م</span>
                <div className="min-w-0">
                  <div className="truncate text-[11.5px] font-bold text-[#171717]">{SEO_SITE.name}</div>
                  <div className="truncate text-[10.5px] text-[#56565a]" dir="ltr">{SEO_SITE.host}</div>
                </div>
              </div>
              <p className="mt-2 text-[15px] font-medium leading-[1.5] text-[#1a0dab]">{SEO_SITE.title}</p>
              <p className="mt-1 text-[12px] font-medium leading-[1.7] text-[#56565a]">{SEO_SITE.description}</p>
            </div>
            <p className="zy-sub mt-3">هكذا يظهر موقعك عند البحث عنه.</p>
          </div>
        </section>

        <section className="min-w-0 lg:order-1 lg:col-span-3">
          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">بيانات البحث</h3>
            <p className="zy-sub mt-1.5">اترك الحقل فارغًا لاستخدام النص التلقائي من محتوى موقعك.</p>

            <div className="mt-4 space-y-4">
              <Field label="عنوان الصفحة (Title)" counter="58/60" value={SEO_SITE.title}
                hint="ما يظهر كسطر أزرق كبير في نتيجة جوجل. ابدأ باسم النشاط." />
              <Field label="وصف مبنى (Description)" counter="112/160" value={SEO_SITE.description} area
                hint="السطر الرمادي تحت العنوان. اجعله دعوة واضحة ومحدّدة." />
              <Field label="كلمات مفتاحية (اختياري)" value={SEO_SITE.keywords}
                hint="افصل بينها بفاصلة." />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="zy-btn">احفظ التغييرات</span>
              <span className="zy-btn-q">إعادة تعيين</span>
            </div>
          </div>
        </section>
      </div>
    </Page>
  )
}

function Field({
  label, value, hint, counter, area,
}: { label: string; value: string; hint: string; counter?: string; area?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className="text-[12.5px] font-bold text-[#171717]">{label}</label>
        {counter && <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#66666e]">{counter}</span>}
      </div>
      {area
        ? <textarea readOnly rows={3} defaultValue={value} className="w-full px-3 py-2.5 text-[13px] font-medium leading-[1.7]" />
        : <input readOnly defaultValue={value} className="w-full px-3 py-2.5 text-[13px] font-medium" />}
      <p className="mt-1.5 text-[11.5px] font-medium leading-[1.7] text-[#66666e]">{hint}</p>
    </div>
  )
}

/* ── 7. domains ──────────────────────────────────────────────────────────── */

export function DomainsView() {
  return (
    <Page>
      <PageHead
        title="النطاقات"
        sub="اربط نطاقك الخاص بموقعك، وتتكفّل زينيا بشهادة SSL والتجديد."
        icon={Globe}
        aside={<span className="zy-btn"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} />أضف نطاقًا</span>}
      />
      <ul className="space-y-3">
        {DOMAINS.map((d) => (
          <li key={d.domain} className="rounded-2xl zy-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[14px] font-black text-[#171717]" dir="ltr">{d.domain}</span>
                  <span className="zy-pill shrink-0" data-tone={d.tone}>{d.status}</span>
                </div>
                <p className="mt-1 truncate text-[11.5px] font-medium leading-[1.7] text-[#66666e]">
                  {d.site} · يتجدّد {d.renews}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.ssl && (
                  <span className="zy-pill" data-tone="ok">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2.25} /> SSL
                  </span>
                )}
                <span className="zy-btn-q">إدارة</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl zy-card p-4 sm:p-5">
        <div className="zy-eyebrow">كيف يعمل الربط</div>
        <ol className="mt-3 space-y-2.5">
          {['أضف النطاق هنا', 'انسخ سجلّي DNS إلى مزوّد النطاق', 'انتظر حتى 24 ساعة للتفعيل'].map((t, i) => (
            <li key={t} className="flex items-start gap-2.5 text-[13px] font-medium leading-[1.8] text-[#171717]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(94,106,210,0.10)] text-[11px] font-black text-[#5e6ad2]">
                {i + 1}
              </span>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </Page>
  )
}

/* ── 8. billing ──────────────────────────────────────────────────────────── */

export function BillingView() {
  return (
    <Page>
      <PageHead
        title="الفوترة"
        sub="باقتك، وسجلّ الدفع، وطرق الدفع المحفوظة."
        icon={CreditCard}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-2xl zy-card p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-[#15803d]" strokeWidth={2.5} />
                <span className="zy-eyebrow">Pro نشط · استضافة مشمولة</span>
              </div>
              <div className="mt-1.5 text-[22px] font-black leading-[1.35] text-[#171717]">24.99$ / شهريًا</div>
              <div className="zy-sub mt-1">يتجدّد 14 أكتوبر 2026</div>
            </div>
            <span className="zy-btn-q shrink-0">إدارة الاشتراك</span>
          </div>
          <div className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {PLAN_INCLUDES.map((t) => (
              <div key={t} className="flex items-start gap-2 text-[12.5px] font-medium leading-[1.7] text-[#171717]">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803d]" strokeWidth={2.25} />
                <span className="min-w-0">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl zy-card p-4 sm:p-5">
          <div className="zy-eyebrow">طريقة الدفع</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="zy-tile"><CreditCard className="h-4 w-4" strokeWidth={2} /></div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-[#171717]" dir="ltr">•••• 4242</div>
              <div className="zy-sub">تنتهي 08/29</div>
            </div>
          </div>
          <span className="zy-btn-q mt-4">تحديث البطاقة</span>
        </div>
      </div>

      <h3 className="zy-h2 mb-2.5 mt-6">الفواتير</h3>
      {/* The table owns its own overflow so the PAGE never gets one. On a
          phone it scrolls sideways inside its card, which is the honest
          answer for tabular data — a table that reflows into cards stops
          being comparable column by column. */}
      <div className="overflow-hidden rounded-2xl zy-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-start">
            <thead>
              <tr>
                {['الفاتورة', 'التاريخ', 'المبلغ', 'الحالة', ''].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-2.5 text-start text-[11px] font-bold uppercase tracking-[0.1em] text-[#66666e]" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.07)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-[12.5px] font-bold text-[#171717]" dir="ltr">{inv.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium text-[#56565a]">{inv.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium tabular-nums text-[#171717]">{inv.amount}</td>
                  <td className="whitespace-nowrap px-4 py-3"><span className="zy-pill" data-tone={inv.tone}>{inv.status}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-end">
                    <span className="zy-link"><Download className="h-3 w-3" strokeWidth={2.25} />تحميل</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  )
}

/* ── 9. settings ─────────────────────────────────────────────────────────── */

export function SettingsView() {
  return (
    <Page>
      <PageHead title="الإعدادات" sub="حسابك، ولغتك، وما تريد أن تصلك عنه رسائل." icon={Settings} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl zy-card p-4 sm:p-5">
          <h3 className="zy-h3">الحساب</h3>
          <div className="mt-4 space-y-4">
            <Field label="الاسم" value="نادية العامري" hint="يظهر في لوحة التحكم وفي رسائل البريد." />
            <Field label="البريد الإلكتروني" value="nadia@almadina.co" hint="لتسجيل الدخول والإشعارات." />
          </div>
          <span className="zy-btn mt-5">احفظ</span>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">اللغة</h3>
            <p className="zy-sub mt-1.5">لوحة التحكم تعمل بالعربية والإنجليزية.</p>
            <div className="mt-3.5">
              <Segmented
                label="لغة اللوحة"
                value="ar"
                onChange={() => {}}
                items={[{ key: 'ar', label: 'العربية' }, { key: 'en', label: 'English' }]}
              />
            </div>
          </div>

          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">الإشعارات</h3>
            <ul className="mt-3 space-y-3">
              {[['حجز جديد', true], ['تقرير أسبوعي', true], ['تحديثات المنتج', false], ['عروض وتخفيضات', false]].map(([label, on]) => (
                <li key={String(label)} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] font-medium text-[#171717]">{label}</span>
                  <span className="zy-switch shrink-0" data-on={on ? '' : undefined} aria-hidden>
                    <span className="zy-switch-knob" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">منطقة الخطر</h3>
            <p className="zy-sub mt-1.5">حذف الحساب يزيل كل مواقعك ولا يمكن التراجع عنه.</p>
            <span className="zy-btn-q mt-3.5" style={{ color: '#b91c1c' }}>
              <Trash2 className="h-3 w-3" strokeWidth={2.25} />احذف الحساب
            </span>
          </div>
        </div>
      </div>
    </Page>
  )
}

/* Re-exported so the shell can render an icon per nav row without a second
   import list. */
export const VIEW_ICONS = { ArrowUpRight }
