"use client"

import {
  Bot, CalendarCheck, Check, Clock, Download, ExternalLink, Eye, LogOut,
  MousePointerClick, Phone, RefreshCw, RotateCcw, Search, Sparkles, Timer, Users,
} from "lucide-react"
import BookingForm from "@/components/site/BookingForm"
import { RESTAURANT_PRESETS } from "@/utils/restaurant/presets"
import { formatDuration } from "@/lib/analytics-core"
import { SEO_DESC_MAX, SEO_TITLE_MAX } from "@/lib/seo"
import { useEffect, useRef, useState } from "react"
import { type Runner } from "./runner"

/* ─────────────────────────────────────────────────────────────────────────
   What section three drives.

   One entry per surface of the dashboard the section knows how to work. Each
   carries that surface's own path, its own labels in its own order, and the
   script that drives it. ManageSection owns the window, the cursor and the
   clock; everything surface-shaped lives here — the same split templates.tsx
   makes for section two.

   The rule is the same one ابن follows: read the surface and follow it. The
   labels are its labels, the order is its order. A demo that invents a screen
   the product does not have is worth nothing.

   And the rule that matters most on a dashboard: NOTHING here invents a
   figure. Every value on the bookings surface is a value the reader watched
   being typed into the form beside it; the analytics surface shows the state
   a site published today is actually in, which is the empty one, in the
   product's own words.
   ───────────────────────────────────────────────────────────────────────── */

export type Form = Record<string, any>

export type ManageCtx = Runner & {
  set: (patch: Form) => void
  /** Type into one of the product's own inputs, one character per beat. */
  typeInto: (sel: string, text: string) => Promise<void>
  /** Type into a field this file draws itself, one character per beat. */
  typeState: (t: string, key: string, text: string) => Promise<void>
  /** Move, click, and write a value into a real control in one go. */
  setValue: (sel: string, value: string) => Promise<void>
  /** The mounted booking form's subtree. */
  site: () => HTMLElement | null
  setFocus: (k: string | null) => void
}

export type SurfaceDef = {
  id: string
  /** The switcher's label, and the tab a reader jumps to. */
  label: string
  /** The path the window reports. */
  path: string
  empty: Form
  render: (a: { f: Form; focus: string | null; siteRef: React.RefObject<HTMLDivElement> }) => React.ReactNode
  run: (c: ManageCtx) => Promise<void>
}

/* ═══════════════════════════════════════════════════════════════════════
   الحجوزات — the reservations inbox
   app/(app)/dashboard/bookings · components/dashboard/BookingsInbox.tsx

   The centrepiece, and the one beat in the section that shows a cause and
   its effect at the same time: the guest's side of the site on one half, the
   owner's inbox on the other, and a reservation crossing between them while
   the reader watches.

   The form is the product's own <BookingForm/>, mounted rather than
   reproduced — the same component every template ships. It is deliberately
   mounted WITHOUT a BookingProvider, which is the path the editor and the
   preview already take: with no slug the submit is a no-op that still shows
   the component's real success state. So the reader sees the real form
   behave exactly as it does on a live site, and nothing is posted, no row is
   written, and /api/bookings is never called from this page.
   ═══════════════════════════════════════════════════════════════════════ */

/* The onyx palette, from the wizard's own presets — the preset the cursor
   picks in section two. The site taking this booking is the site the reader
   watched being built one screen up. */
const ONYX = RESTAURANT_PRESETS.find((p) => p.id === "onyx")!.colors

const SITE_PALETTE = {
  accent: ONYX.accent,
  accentText: ONYX.background,
  text: ONYX.text,
  muted: ONYX.muted,
  surface: "rgba(255,255,255,0.04)",
  border: ONYX.border,
  headingFont: '"Playfair Display", "Times New Roman", serif',
  radius: 4,
}

/* The guest, and what they ask for. Sample content of exactly the class the
   wizard's own demo business is — a name typed into a name field — never a
   statistic about a business that does not exist. */
const GUEST = {
  name: "فيصل الحربي",
  phone: "+961 3 555 0198",
  party: "4",
  time: "20:30",
  message: "طاولة بجانب النافذة إن أمكن. لدينا مناسبة.",
}

/* Tomorrow, so the requested date is always a date the guest could ask for. */
function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/* The four statuses, in the inbox's own order and with its own words. */
const STATUS_AR: Record<string, string> = {
  new: "جديد", confirmed: "مؤكّد", cancelled: "ملغى", done: "منجز",
}
const STATUS_ORDER = ["new", "confirmed", "done", "cancelled"]

export const bookings: SurfaceDef = {
  id: "bookings",
  label: "الحجوزات",
  path: "/dashboard/bookings",
  empty: { rows: [], filter: "all", statusOpen: false },

  render: ({ f, siteRef }) => {
    const counts: Record<string, number> = { all: f.rows.length, new: 0, confirmed: 0, cancelled: 0, done: 0 }
    for (const r of f.rows) counts[r.status] = (counts[r.status] || 0) + 1

    return (
      <div className="zn3-two">
        {/* The owner's side. */}
        <div className="zn3-pane">
          <div className="zn3-head">
            <h2><CalendarCheck className="ic" /> الحجوزات</h2>
            <p>كل طلبات الحجز والمواعيد التي يرسلها زوّار مواقعك تصلك هنا.</p>
          </div>

          <div className="zn3-chips">
            {(["all", ...STATUS_ORDER] as const).map((k) => (
              <span key={k} className="zn3-chip" data-on={f.filter === k} data-t={`filter-${k}`}>
                {k === "all" ? "الكل" : STATUS_AR[k]}
                <i>{counts[k] || 0}</i>
              </span>
            ))}
          </div>

          {f.rows.length === 0 ? (
            /* The inbox's own empty state, verbatim — and the true state of a
               site that was published a minute ago. */
            <div className="zn3-empty">
              <span className="disc"><CalendarCheck className="ic" /></span>
              <b>لا توجد حجوزات بعد</b>
              <p>بمجرد أن يرسل أحد زوّار موقعك طلب حجز، سيظهر هنا فورًا.</p>
            </div>
          ) : (
            <ul className="zn3-rows">
              {f.rows.map((b: any) => (
                <li key={b.id} className="zn3-row" data-t="booking-row">
                  <div className="top">
                    <div>
                      <span className="nm">{b.name}</span>
                      <span className="kind">حجز طاولة</span>
                      <p className="meta">دار نُور · {b.at}</p>
                    </div>
                    <span className="st" data-status={b.status}>{STATUS_AR[b.status]}</span>
                  </div>
                  <div className="det">
                    <span dir="ltr"><Phone className="ic" /> {b.phone}</span>
                    <span><Users className="ic" /> {b.party} أشخاص</span>
                    <span><Clock className="ic" /> {b.date} · {b.time}</span>
                  </div>
                  {b.message && <p className="msg">{b.message}</p>}
                  <div className="ctl">
                    <span className="lab">الحالة</span>
                    <span className="sel" data-t="status-select" data-open={f.statusOpen}>
                      {STATUS_AR[b.status]}
                      <em />
                      {f.statusOpen && (
                        <span className="menu">
                          {STATUS_ORDER.map((s) => (
                            <b key={s} data-t={`status-${s}`} data-on={s === b.status}>{STATUS_AR[s]}</b>
                          ))}
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The guest's side: the published site, and the form on it. */}
        <div className="zn3-site" ref={siteRef} data-t="site">
          <div className="zn3-sitebar" dir="ltr">darnoor.zenyaai.co</div>
          <div className="zn3-sitebody">
            <span className="eyebrow">الحجوزات</span>
            <h3>احجز طاولتك</h3>
            <BookingForm type="reservation" palette={SITE_PALETTE} />
          </div>
        </div>
      </div>
    )
  },

  run: async (c) => {
    const site = c.site()
    if (!site) { await c.wait(1200); return }
    const q = <T extends HTMLElement>(sel: string) => site.querySelector<T>(sel)

    await c.wait(560)

    /* The guest fills the form in. Real typing into the product's own
       inputs — the value goes through the prototype's setter and a bubbling
       event, which is what React's onChange is built over, so the component
       cannot tell this from a keystroke. */
    await c.typeInto("#bk-name", GUEST.name)
    await c.typeInto("#bk-phone", GUEST.phone)
    await c.setValue("#bk-party", GUEST.party)
    await c.setValue("#bk-date", tomorrow())
    await c.setValue("#bk-time", GUEST.time)
    await c.typeInto("#bk-message", GUEST.message)
    await c.beat(420)

    /* Send. No provider, no slug: the component shows its real success state
       and nothing leaves the browser. */
    const btn = Array.from(site.querySelectorAll("button")).find((b) => (b.textContent || "").includes("إرسال"))
    await c.moveEl(btn ?? site, 0.5, 0.5)
    await c.click()
    btn?.click()
    await c.wait(760)

    /* And it lands. Every field on the row is the value the reader just
       watched being typed; the time is the real clock. */
    const now = new Date()
    c.set({
      rows: [{
        id: 1,
        name: GUEST.name,
        phone: GUEST.phone,
        party: GUEST.party,
        date: tomorrow(),
        time: GUEST.time,
        message: GUEST.message,
        status: "new",
        at: now.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }),
      }],
    })

    /* OFF THE BUTTON BEFORE THE ROW LANDS. The cursor used to sit on the
       submit it had just pressed while the reservation appeared on the other
       side of the screen — the reader is looking at the wrong half, and the
       pointer is parked on the cause instead of pointing at the effect. The
       whole beat of this surface is that one thing makes the other happen, so
       the cursor has to cross with it. */
    await c.move("booking-row", 0.5, 0.28)
    await c.wait(2400)
    await c.move("status-select", 0.5, 0.5)
    await c.click()
    c.set({ statusOpen: true })
    await c.wait(520)
    await c.move("status-confirmed", 0.5, 0.5)
    await c.click()
    c.set({ statusOpen: false, rows: (p: any[]) => p.map((r) => ({ ...r, status: "confirmed" })) })
    await c.wait(700)

    /* And it rests on the row, not on a filter chip. The run used to end with
       six seconds parked on a control while the thing it had just done sat
       elsewhere unlooked at — the same mistake the analytics run made and the
       reason its longest hold was also its emptiest. */
    await c.move("filter-confirmed", 0.5, 0.5)
    await c.wait(1100)
    await c.move("booking-row", 0.5, 0.45)
    await c.beat(2600)
  },
}

/* ═══════════════════════════════════════════════════════════════════════
   التحليلات — the unified analytics
   app/(app)/dashboard/analytics · components/dashboard/analytics/*

   The one surface here that cannot carry a figure. There is no real number
   for a business that does not exist, /api/analytics is behind a session,
   and a dashboard is nothing but boxes that want one — so this shows the
   state a site published today is genuinely in, which is the empty one, and
   says so in the dashboard's own sentence.

   That refusal is the point rather than a shortfall. The tiles, the ranges,
   the tabs and the chart are the real ones; what is missing is missing
   because it has not happened yet.
   ═══════════════════════════════════════════════════════════════════════ */

const RANGES = [
  { id: "24h", label: "24 ساعة" },
  { id: "7d", label: "7 أيام" },
  { id: "30d", label: "30 يومًا" },
  { id: "90d", label: "90 يومًا" },
  { id: "12mo", label: "سنة" },
]

const TABS = [
  "نظرة عامة", "الزوّار", "المصادر", "المحتوى", "التحويلات", "البحث", "مباشر", "رؤى",
]

const METRICS = [
  { id: "views", label: "المشاهدات" },
  { id: "visitors", label: "الزوّار" },
  { id: "sessions", label: "الجلسات" },
  { id: "events", label: "التواصل" },
]

/* ── SAMPLE FIGURES ────────────────────────────────────────────────────────
   READ THIS BEFORE CHANGING ANYTHING HERE.

   These numbers are SAMPLE DATA for a restaurant that does not exist. They
   are not measured, they are not anybody's traffic, and they are not a claim
   about what a Zenya site earns. They are here because the owner asked for a
   populated dashboard rather than an empty one, twice and explicitly, after
   the honest-empty-state version was built and shown.

   That decision reverses this page's standing rule against invented figures,
   so two things go with it and must stay:

   1. The dashboard's own line about "showing zeros instead of invented
      numbers" is GONE from this surface. Printing that sentence above
      invented numbers would be worse than either choice on its own.
   2. Everything is derived from ONE series below, so the six tiles and the
      chart can never disagree with each other. Six figures picked separately
      is how a demo ends up claiming more conversions than sessions.

   If this ever needs to be honest again, delete SERIES and put the tiles back
   to zero with the note; nothing else on the surface depends on it. */

/* Thirty days of page views, with the weekly rhythm a restaurant actually
   has: quiet at the start of the week, heaviest on Thursday and Friday. */
const DAILY = [
  248, 262, 231, 274, 318, 396, 371,
  289, 267, 244, 281, 333, 425, 388,
  302, 276, 259, 298, 344, 441, 402,
  311, 288, 271, 305, 357, 468, 419,
  329, 296,
]

/* The last day of that, hour by hour, with a restaurant's evening. It sums to
   exactly the last daily figure, so the ranges agree with each other: a
   reader who switches from a day to a month and adds up is not caught out. */
const HOURLY = [
  2, 1, 1, 0, 1, 2, 4, 7, 9, 11, 12, 14,
  17, 15, 13, 12, 14, 18, 24, 29, 31, 27, 19, 13,
]

/* One range's worth of everything, derived from its own series. Views come
   from the series and every other total comes from views, so the six tiles
   and the curve can never disagree — and switching range changes all of it
   at once, which is the point: a dashboard that shows month figures under a
   button marked "24 hours" is the tell that it is a picture. */
function rangeData(series: number[], bounce: number, durationMs: number, deltas: number[]) {
  const views = series.reduce((a, b) => a + b, 0)
  const sessions = Math.round(views / 2.28)
  const visitors = Math.round(sessions / 1.21)
  const events = Math.round(sessions * 0.064)
  return {
    series, views, sessions, visitors, events, bounce, durationMs,
    conversion: ((events / sessions) * 100).toFixed(1),
    deltas,
  }
}

const RANGE_DATA: Record<string, ReturnType<typeof rangeData>> = {
  "30d": rangeData(DAILY, 41, 107_000, [18, 12, 21, -4, 9, 23]),
  "7d": rangeData(DAILY.slice(-7), 39, 114_000, [14, 9, 16, -3, 6, 19]),
  "24h": rangeData(HOURLY, 36, 126_000, [27, 22, 31, -6, 11, 34]),
}

/* The six tiles, in the dashboard's own order and with its own sub-lines.
   Every value is a NUMBER with a formatter beside it rather than a finished
   string, because they animate: a tile that rolls from one figure to the next
   is what says the screen just recalculated, and a string cannot be counted
   toward. */
function tilesFor(range: string) {
  const d = RANGE_DATA[range] ?? RANGE_DATA["7d"]
  const ar = (v: number) => v.toLocaleString("ar")
  return [
    { k: "visitors", label: "الزوّار", n: d.visitors, fmt: ar, d: d.deltas[0], sub: "أشخاص مختلفون", Icon: Users },
    { k: "sessions", label: "الجلسات", n: d.sessions, fmt: ar, d: d.deltas[1], sub: "زيارات منفصلة", Icon: LogOut },
    { k: "views", label: "المشاهدات", n: d.views, fmt: ar, d: d.deltas[2], sub: "صفحات مفتوحة", Icon: Eye },
    { k: "bounce", label: "معدل المغادرة", n: d.bounce, fmt: (v: number) => `${v}%`, d: d.deltas[3], sub: "غادروا بعد صفحة", Icon: LogOut },
    { k: "dur", label: "متوسط المدة", n: d.durationMs, fmt: formatDuration, d: d.deltas[4], sub: "وقت فعلي على الصفحة", Icon: Timer },
    { k: "events", label: "التواصل", n: d.events, fmt: ar, d: d.deltas[5], sub: `${d.conversion}% من الجلسات`, Icon: MousePointerClick },
  ]
}

/**
 * A figure that counts to its new value instead of jumping to it.
 *
 * Driven by rAF against a motion value rather than by React state per frame,
 * except that it IS state here — the number is text, so there is nothing to
 * transform and a re-render per frame is the only way. It is one short string
 * in six tiles, which is cheap; the rule against state-per-frame is about
 * continuous input, not about a 760ms roll that happens twice a minute.
 */
function Count({ n, fmt }: { n: number; fmt: (v: number) => string }) {
  const [shown, setShown] = useState(n)
  const from = useRef(n)
  useEffect(() => {
    const a = from.current
    const b = n
    if (a === b) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = b
      setShown(b)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 760)
      /* The page's own arriving-slowly curve, as a number rather than a
         cubic-bezier: fast at first, settling onto the value. */
      const e = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(a + (b - a) * e))
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = b
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = b }
  }, [n])
  return <>{fmt(shown)}</>
}

/* The chart's own axis maths, from components/dashboard/analytics/TrendChart:
   the top of the scale is rounded up to something readable rather than to the
   raw peak, so the gridlines land on numbers a person would say out loud. */
function niceCeil(n: number): number {
  if (n <= 5) return 5
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  return Math.ceil(n / (mag / 2)) * (mag / 2)
}

/* The path for one range. 620x150 with the same padding TrendChart uses, so
   the curve sits off the gridlines the way it does on the real screen. */
function chartFor(range: string) {
  const series = (RANGE_DATA[range] ?? RANGE_DATA["7d"]).series
  const W = 620, H = 150, PAD_T = 12, PAD_B = 18
  const top = niceCeil(Math.max(...series))
  const x = (i: number) => (i / (series.length - 1)) * W
  const y = (v: number) => H - PAD_B - (v / top) * (H - PAD_T - PAD_B)
  const line = series.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  return {
    line, series, W, H, PAD_B,
    area: `${line} L${W},${H - PAD_B} L0,${H - PAD_B} Z`,
    ticks: [top, Math.round(top / 2), 0],
    /* Where each point sits as a share of the plot, so the cursor has
       somewhere real to travel to. preserveAspectRatio is none, so the SVG
       maps linearly onto the box in both axes and a per cent is a per cent. */
    at: (i: number) => ({ left: (x(i) / W) * 100, top: (y(series[i]) / H) * 100 }),
  }
}

/* The label under a point, which is a date on the daily ranges and an hour on
   the day. Built at RENDER for the same reason the figures are: this file is
   evaluated on the server too, against an ICU that formats Arabic
   differently. */
function pointLabel(range: string, i: number, n: number): string {
  if (range === "24h") {
    const h = i % 24
    return `${String(h).padStart(2, "0")}:00`
  }
  const d = new Date()
  d.setDate(d.getDate() - (n - 1 - i))
  try {
    return d.toLocaleDateString("ar", { weekday: "short", day: "numeric", month: "short" })
  } catch {
    return ""
  }
}

/* Where the cursor stops along the curve. Fractions rather than indices, so
   the same five stops work on a thirty-day series and a twenty-four-hour one.
   They run right to left, which is the direction this page reads. */
const HOVER_STOPS = [0.86, 0.62, 0.4, 0.17]

const EXPORTS = [
  "الزيارات اليومية", "الصفحات", "المصادر", "الدول", "الأجهزة والمتصفحات", "التحويلات", "المواقع",
]

export const analytics: SurfaceDef = {
  id: "analytics",
  label: "التحليلات",
  path: "/dashboard/analytics",
  empty: { range: "7d", metric: "views", tab: 0, site: "", exportOpen: false, hover: null },

  render: ({ f }) => (
    <div className="zn3-pane zn3-analytics">
      <div className="zn3-head">
        <h2>التحليلات</h2>
        <p>كل ما يحدث على مواقعك المنشورة — الزوّار، ومن أين أتوا، وماذا فعلوا.</p>
      </div>

      <div className="zn3-bar">
        <span className="zn3-pills">
          {RANGES.map((r) => (
            <b key={r.id} data-t={`range-${r.id}`} data-on={f.range === r.id}>{r.label}</b>
          ))}
        </span>
        <span className="zn3-sel2" data-t="site-select">
          {f.site === "darnoor" ? "دار نُور" : "كل المواقع (1)"}<em />
        </span>
        <span className="zn3-tog" data-on="true">مقارنة</span>
        <span className="zn3-tog"><Bot className="ic" /> بلا روبوتات</span>
        <span className="zn3-out" data-t="export" data-open={f.exportOpen}>
          <Download className="ic" /> تصدير
          {f.exportOpen && (
            <span className="menu">
              {EXPORTS.map((x) => <b key={x}>{x}</b>)}
              <i>ملف CSV يفتح مباشرة في Excel بالعربية.</i>
            </span>
          )}
        </span>
        <span className="zn3-out ref"><RefreshCw className="ic" /> تحديث</span>
      </div>

      <div className="zn3-tiles">
        {tilesFor(f.range).map(({ k, label, n, fmt, sub, Icon }) => (
          <span key={k} className="zn3-tile" data-t={`tile-${k}`}>
            <span className="t">
              <em>{label}</em>
              <i className="chip"><Icon className="ic" /></i>
            </span>
            {/* NO GROWTH DELTA. The totals are sample figures and are read as
                "this is what the screen looks like"; a rate of growth is read
                as a claim — "+31%" says the business is growing, which is a
                thing said about a business that does not exist. The one is a
                picture of a product, the other is a boast. The tiles keep the
                figure and drop the arrow. */}
            <span className="v">
              <Count n={n} fmt={fmt} />
            </span>
            <span className="s">{sub}</span>
          </span>
        ))}
      </div>

      {/* The zeros note lived here and is gone with the zeros: see the block
          at the top of this file. Printing "we show zeros rather than invented
          numbers" above invented numbers would be the one genuinely dishonest
          thing on the page. */}

      <div className="zn3-tabs">
        {TABS.map((t, i) => (
          <b key={t} data-t={`tab-${i}`} data-on={f.tab === i}>{t}</b>
        ))}
      </div>

      {/* البحث is a real tab with a real panel behind it, and this is what it
          shows for an account that has not connected Search Console — which
          is most accounts, and is the product's own screen, verbatim. The
          tiles stay put across tabs exactly as they do on the real
          dashboard. */}
      {f.tab === 5 ? (
        <div className="zn3-search" data-t="search">
          <h3>أداء البحث</h3>
          <div className="zn3-empty">
            <span className="disc"><Search className="ic" /></span>
            <b>اربط حساب Google الخاص بك</b>
            <p>
              اربط Search Console لترى عدد مرات ظهور موقعك في نتائج جوجل، والنقرات،
              وأهم الكلمات التي وجدك بها الناس — بيانات حقيقية من جوجل مباشرة.
            </p>
            <span className="cta">ربط Search Console</span>
          </div>
        </div>
      ) : (
      <div className="zn3-chart">
        <span className="zn3-pills small">
          {METRICS.map((m) => (
            <b key={m.id} data-t={`metric-${m.id}`} data-on={f.metric === m.id}>{m.label}</b>
          ))}
        </span>
        <div className="plot" data-t="chart" key={f.range}>
          {/* Drawn the way TrendChart draws it: the line over a fading area,
              the axis rounded up to a readable top, and the same three
              gridlines. preserveAspectRatio is none because the box is fluid
              and the shape of the curve, not its slope, is what is being
              read. */}
          <svg viewBox="0 0 620 150" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="zn3-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--acc)" stopOpacity="0.26" />
                <stop offset="100%" stopColor="var(--acc)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((g) => (
              <line key={g} x1="0" x2="620" y1={132 - g * 116} y2={132 - g * 116} />
            ))}
            <path className="area" d={chartFor(f.range).area} fill="url(#zn3-area)" />
            <path
              className="line"
              d={chartFor(f.range).line}
              fill="none"
              stroke="var(--acc-txt)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="ys">
            {chartFor(f.range).ticks.map((n) => <i key={n}>{n.toLocaleString("ar")}</i>)}
          </span>

          {/* THE CROSSHAIR. The chart is the one thing here the cursor rests
              on for whole seconds, and until now nothing happened while it
              did — the longest hold in the run was also its only idle moment.
              The real TrendChart raises a line, a dot and a reading as the
              pointer crosses it, which is what a person actually does with a
              chart: they do not stare at it, they run along it.

              The anchors are invisible spans at the real curve points, so the
              cursor travels to them through the same engine as every other
              target rather than through a second mechanism that would have to
              be kept in step with it. */}
          {HOVER_STOPS.map((frac) => {
            const ch = chartFor(f.range)
            const i = Math.round(frac * (ch.series.length - 1))
            const pos = ch.at(i)
            return (
              <span
                key={frac}
                className="pt"
                data-t={`pt-${frac}`}
                style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              />
            )
          })}

          {f.hover != null && (() => {
            const ch = chartFor(f.range)
            const i = Math.min(ch.series.length - 1, Math.max(0, f.hover as number))
            const pos = ch.at(i)
            return (
              <>
                <span className="cross" style={{ left: `${pos.left}%` }} />
                <span className="dot" style={{ left: `${pos.left}%`, top: `${pos.top}%` }} />
                {/* The reading sits at the top of the plot, except when the
                    point it belongs to is ALSO at the top — a peak put the
                    tooltip exactly over its own dot. Then it goes to the
                    foot instead. */}
                <span
                  className="tip"
                  data-low={pos.top < 42 || undefined}
                  /* Clamped in MIXED units, not per cent. The reading is
                     centred on the point, so what has to stay inside the plot
                     is half its own width — a fixed number of pixels — and a
                     percentage clamp that holds on a thousand-pixel chart
                     lets it hang out of a two-hundred-and-seventy-pixel one.
                     clamp() takes both, so one rule covers every width. */
                  style={{ left: `clamp(76px, ${pos.left}%, calc(100% - 76px))` }}
                >
                  <i>{pointLabel(f.range, i, ch.series.length)}</i>
                  <b>{ch.series[i].toLocaleString("ar")}</b>
                  <u>المشاهدات</u>
                </span>
              </>
            )
          })()}
        </div>
      </div>
      )}
    </div>
  ),

  /* THE PATH, IN THE ORDER THE OWNER ASKED FOR:
     7 أيام, then البحث, then 24 ساعة, then الجلسات.

     It alternates a control with something to read, which is what stops it
     reading as a tour of the buttons: change the range, go and look at a
     different tab, change the range again, come back and read a figure. The
     tiles stay put across tabs on the real dashboard, so the second range
     change is visible from the search tab — that is why the order works. */
  run: async (c) => {
    await c.wait(1000)

    /* Read what is already on the screen before touching anything. */
    await c.move("chart", 0.46, 0.42)
    await c.wait(3000)

    /* 1 · seven days. */
    await c.move("range-7d", 0.5, 0.5)
    await c.click()
    c.set({ range: "7d" })
    await c.wait(500)
    await c.move("chart", 0.58, 0.4)
    await c.wait(3400)

    /* 2 · البحث. A real tab with the product's own not-connected panel
       behind it. */
    await c.move("tab-5", 0.5, 0.5)
    await c.click()
    c.set({ tab: 5 })
    await c.wait(600)
    await c.move("search", 0.5, 0.45)
    await c.wait(3600)

    /* 3 · twenty-four hours. The tiles carry across tabs, so the figures
       roll while the search panel is still the one on screen. */
    await c.move("range-24h", 0.5, 0.5)
    await c.click()
    c.set({ range: "24h" })
    await c.wait(520)

    /* 4 · الجلسات, and time to watch it settle. */
    await c.move("tile-sessions", 0.5, 0.55)
    await c.wait(3800)

    /* And then the curve is READ rather than looked at. The cursor runs
       along it right to left and the crosshair follows, which is what turns
       the longest hold in the run from an idle pause into the beat that
       shows what the chart is for. */
    await c.move("tab-0", 0.5, 0.5)
    await c.click()
    c.set({ tab: 0 })
    await c.wait(700)
    for (const [k, frac] of [["pt-0.86", 0.86], ["pt-0.62", 0.62], ["pt-0.4", 0.4], ["pt-0.17", 0.17]] as const) {
      await c.move(k, 0.5, 0.5)
      c.set({ hover: Math.round(frac * 23) })
      await c.wait(1250)
    }
    await c.wait(900)
    c.set({ hover: null })

    /* Back to where it started for the next time round. */
    await c.move("range-7d", 0.5, 0.5)
    await c.click()
    c.set({ range: "7d", hover: null })
    await c.wait(600)
    await c.move("chart", 0.5, 0.45)
    await c.beat(2400)
  },


}

/* ═══════════════════════════════════════════════════════════════════════
   SEO — the search settings and the live result preview
   app/(app)/dashboard/seo · components/dashboard/SeoManager.tsx

   Its own centrepiece, and it needs no invented anything: the Google result
   on the right is written from the fields on the left as they are typed, and
   the counters are counting the characters the reader is watching arrive.
   ═══════════════════════════════════════════════════════════════════════ */

const SEO = {
  title: "دار نُور — مطعم شامي في الجميزة، بيروت",
  description: "مطبخ شامي عصري في بيت من القرن التاسع عشر بالجميزة. احجز طاولتك في دار نُور مساء كل يوم عدا الإثنين.",
  keywords: "مطعم شامي بيروت، عشاء الجميزة، حجز طاولة",
}

const AUTO_TITLE = "دار نُور"
const AUTO_DESC = "مأكولات شامية عصرية في بيروت."

export const seo: SurfaceDef = {
  id: "seo",
  label: "SEO",
  path: "/dashboard/seo",
  empty: { title: "", description: "", keywords: "", saved: false },

  render: ({ f, focus }) => {
    const effTitle = f.title.trim() || AUTO_TITLE
    const effDesc = f.description.trim() || AUTO_DESC
    const dirty = !!(f.title || f.description || f.keywords) && !f.saved
    return (
      <div className="zn3-two seo">
        <div className="zn3-pane">
          <div className="zn3-card">
            <div className="zn3-cardhead">
              <Sparkles className="ic" />
              <h3>بيانات البحث</h3>
            </div>
            <p className="zn3-cardsub">
              زينيا يكتب هذه الحقول تلقائيًا من محتوى موقعك. اترك الحقل فارغًا لاستخدام النص التلقائي، أو اكتب نصك للتحكّم الكامل.
            </p>

            <SeoField
              t="seo-title" on={focus === "seo-title"}
              label="عنوان الصفحة (Title)"
              hint="ما يظهر كسطر أزرق كبير في نتيجة جوجل. ابدأ باسم النشاط."
              value={f.title} ph={AUTO_TITLE} max={SEO_TITLE_MAX}
            />
            <SeoField
              t="seo-desc" on={focus === "seo-desc"}
              label="وصف ميتا (Description)"
              hint="السطر الرمادي تحت العنوان. اجعله دعوة واضحة ومحدّدة الموقع."
              value={f.description} ph={AUTO_DESC} max={SEO_DESC_MAX} area
            />
            <SeoField
              t="seo-kw" on={focus === "seo-kw"}
              label="كلمات مفتاحية (اختياري)"
              hint="افصل بينها بفاصلة. تساعد في التنظيم — جوجل يعتمد أساسًا على المحتوى."
              value={f.keywords} ph="مطعم، بيروت"
            />

            <div className="zn3-check">
              <u />
              <div>
                <b><Eye className="ic ok" /> إخفاء الموقع من محرّكات البحث</b>
                <i>فعّلها إذا كان الموقع قيد الإعداد ولا تريد ظهوره في جوجل بعد. الوضع الافتراضي: مرئي.</i>
              </div>
            </div>

            <div className="zn3-save">
              <span>{dirty ? "لديك تغييرات غير محفوظة" : "كل شيء محفوظ"}</span>
              <b data-t="seo-save" data-on={dirty}>حفظ <Check className="ic" /></b>
            </div>
          </div>
        </div>

        {/* The live preview. It is written from the fields as they are typed,
            which is the whole reason this screen exists. */}
        <div className="zn3-pane">
          <div className="zn3-card">
            <div className="zn3-cardhead">
              <Search className="ic" />
              <h3>معاينة نتيجة جوجل</h3>
              <span className="side">حاسوب</span>
            </div>
            {/* A real Google result is a white card with a blue link, so this
                one is too. It is the one surface in the section that keeps its
                own colours: recoloured, it stops being a preview. */}
            <div className="zn3-serp" data-t="serp" dir="ltr">
              <div className="who">
                <span className="fav">د</span>
                <div>
                  <p className="nm">دار نُور</p>
                  <p className="host">darnoor.zenyaai.co</p>
                </div>
              </div>
              <p className="ttl" dir="auto">{effTitle}</p>
              <p className="dsc" dir="auto">{effDesc}</p>
            </div>
            <p className="zn3-cardnote">
              هكذا يظهر موقعك عند البحث عنه. النتائج الفعلية تحدّثها جوجل خلال أيام من النشر.
            </p>
          </div>

          {/* The second preview on that column, and it is written from the
              same two fields. The picture is the site's own hero photograph,
              which is exactly what the OG field's hint says happens when it
              is left empty. */}
          <div className="zn3-card social">
            <div className="zn3-cardhead">
              <ExternalLink className="ic" />
              <h3>معاينة المشاركة (واتساب · تويتر)</h3>
            </div>
            <div className="zn3-social">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/restaurant/room-1.webp" alt="" loading="lazy" decoding="async" />
              <div className="cap">
                <p className="host" dir="ltr">darnoor.zenyaai.co</p>
                <p className="ttl" dir="auto">{effTitle}</p>
                <p className="dsc" dir="auto">{effDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },

  run: async (c) => {
    await c.wait(640)
    await c.typeState("seo-title", "title", SEO.title)
    await c.wait(760)
    await c.typeState("seo-desc", "description", SEO.description)
    await c.wait(700)
    await c.typeState("seo-kw", "keywords", SEO.keywords)
    await c.wait(520)
    await c.move("seo-save", 0.5, 0.5)
    await c.click()
    c.set({ saved: true })
    await c.beat(800)

    /* And then the owner looks at what they just wrote. The preview is the
       reason this screen exists, so the run ends on it rather than on the
       save button — and on a phone, where the preview is below the fold, this
       is the beat that scrolls the screen down to it. */
    await c.move("serp", 0.5, 0.45)
    await c.beat(2400)
  },
}

function SeoField({ label, hint, value, ph, max, t, on, area }: {
  label: string; hint: string; value: string; ph: string
  max?: number; t: string; on?: boolean; area?: boolean
}) {
  const len = value.trim().length
  const over = max ? len > max : false
  const near = max ? len > max * 0.9 : false
  return (
    <div className="zn3-field">
      <div className="lab">
        <label>{label}</label>
        <span className="right">
          {value && <b className="auto"><RotateCcw className="ic" /> تلقائي</b>}
          {max != null && (
            <b className="count" data-state={over ? "over" : near ? "near" : "ok"}>{len}/{max}</b>
          )}
        </span>
      </div>
      <span className={`zn3-inp${area ? " area" : ""}`} data-t={t} data-on={on ? "true" : undefined}>
        {value ? <em>{value}</em> : <i>{ph}</i>}
      </span>
      <p className="hint">{hint}</p>
    </div>
  )
}

/** Every surface section three knows how to work, in the order it runs them. */
export const SURFACES: SurfaceDef[] = [bookings, analytics, seo]
