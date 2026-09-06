"use client"

/**
 * The candidate pricing page. See page.tsx for why this route exists.
 *
 * THE COMPOSITION IS TWO MOVEMENTS, not one panel.
 * The plans stand directly on the ground, because a price list is the page
 * itself and putting it inside a container says it is one item among several.
 * The comparison sits inside a dark soft-cornered panel, because it is a
 * different kind of claim: the plans are what you buy, the table is the
 * argument for buying. Giving the argument its own ground is what separates
 * them without drawing a rule across the page, which this style refuses.
 *
 * THE DARK PANEL IS ادر'S INVERSION AGAIN, and deliberately the same values as
 * the Starter card: #131316 with #5e6ad2, and #97a0ee for type and hairlines
 * because the flat primary falls under 4.5:1 on that ground. Two dark objects
 * on one page is a pattern, not an accident. Every other pixel is paper.
 *
 * THE HEADER GROWS FROM ITS CENTRE. The first version laid the bar out as a
 * flex row with the nav on flex:1, so widening the pill grew the nav box and
 * dragged the three words sideways with it. They are supposed to stay put
 * while the surface opens around them. The bar is a 1fr auto 1fr grid now, the
 * same arrangement the style doc names for the phone pill: the nav is the auto
 * track and cannot move, and the two 1fr tracks absorb the new width equally,
 * so the mark and the account push apart and the words hold the middle.
 * Verified by measuring the nav's centre closed and open.
 *
 * THE ARABIC IS SET IN TAJAWAL, and this is a correction rather than a
 * preference. IBM Plex Sans Arabic is the deck's furniture face and belongs on
 * the header, but app/demo/home/page.tsx already records why it does not
 * belong on content: it "reads thin and foreign at wizard sizes", and the
 * product itself sets Arabic in Tajawal. Plex at 400 across a whole page of
 * cards and a table is exactly that thinness. Content is Tajawal now, weights
 * lifted a step (body 500, feature rows 500, headings 900) and the muted ramp
 * darkened, because Arabic carries its weight in the stroke rather than in the
 * counter and a grey that reads as "secondary" in Latin reads as "faded" here.
 * The header keeps Plex, which is what it was chosen for.
 *
 * MOTION IS ON ARRIVAL ONLY, and every resting state is the finished state.
 * The hidden half of each reveal is applied by a class the script adds on
 * mount, so a browser that never runs it reads a finished page. Position is
 * read with IntersectionObserver, never a scroll listener.
 *
 * THE COMPARISON MAKES NO NEW CLAIMS. Every row is the one already on
 * app/(main)/pricing/page.tsx, verbatim.
 */

import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import CodeStack from "./CodeStack"
import PricingFooter from "./PricingFooter"
import SwipeStack from "@/components/ui/SwipeStack"

/* Display and content are the same family at different weights. Arabic reads
   as one voice that way, and the page stops looking like two fonts arguing. */
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
/* The header's furniture face only, which is what it was chosen for. */
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

const TEMPLATES = [
  { href: "/demo", label: "متجر" },
  { href: "/demo/restaurant", label: "مطعم" },
  { href: "/demo/atlas", label: "تطبيق" },
  { href: "/demo/lookbook", label: "أزياء" },
  { href: "/demo/collective", label: "تشكيلة" },
  { href: "/demo/studio", label: "ستوديو" },
  { href: "/demo/services", label: "خدمات" },
  { href: "/demo/wellness", label: "عافية" },
]

/* A definite closed width is what makes the sideways growth animatable at all:
   a pill at width:auto gives the transition nothing to move between. */
const PILL_REST = "380px"
const PILL_THEMES = "min(94vw, 720px)"

/* A non-breaking space, never a plain one. A lone " " inside the ghosted badge
   collapses, the element loses its line box, and the reserved row comes back
   16px short: measured, that put Starter's price 16px below its neighbours'. */
const NBSP = " "

const PLANS = [
  {
    id: "entry",
    name: "Entry",
    amount: "$0.50",
    per: "/لمرة واحدة",
    sub: "ابنِ، أدِر، وانشر — جرّب زينيا بأقل تكلفة.",
    cta: "ابدأ بـ 0.50$",
    /* The arriving label says what the plan hands over, so the movement
       carries a second piece of information rather than repeating the first. */
    ctaSlide: "ولّد أول موقع",
    href: "/checkout?plan=entry",
    foot: "دفعة واحدة — بلا اشتراك",
    features: [
      "توليد قالبين (٢) بالذكاء الاصطناعي — دفعة واحدة",
      "جميع القوالب الثمانية للمعاينة",
      "انشر موقعك على اسمك.zenyaai.co",
      "كل أدوات التحرير والإدارة",
      "شهر تجربة للحجوزات وتحليلات الموقع",
      "دعم المجتمع",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    amount: "$14.99",
    per: "/شهريًا",
    sub: "ابنِ، أدِر، وانشر — بلا حدود، على نطاقك الخاص.",
    cta: "اشترك في Starter",
    ctaSlide: "ابنِ بلا حدود",
    href: "/checkout?plan=starter",
    badge: "الأكثر شيوعًا",
    foot: "ألغِ في أي وقت",
    features: [
      "توليد غير محدود — يشمل تحديثات القوالب",
      "جميع القوالب الثمانية الاحترافية",
      "انشر على نطاقك الخاص",
      "شهادة SSL تلقائية + CDN سريع",
      "الحجوزات وتحليلات الموقع — كاملة",
      "ملف ثيم شوبيفاي جاهز (المتجر + التشكيلة)",
      "وصول مبكر للقوالب الجديدة",
      "دعم ذو أولوية",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    amount: "$24.99",
    per: "/شهريًا",
    sub: "ابنِ، أدِر، وانشر — كل شيء مشمول، بنطاق مجاني.",
    cta: "اشترك في Pro",
    ctaSlide: "خذ نطاقك مجانًا",
    href: "/checkout?plan=pro",
    foot: "ألغِ في أي وقت · يبقى الموقع مباشرًا حتى نهاية الشهر",
    note: {
      title: "نطاق مجاني لسنة",
      body: "على الامتدادات الاقتصادية — والأغلى (مثل .com) بخصم 30%.",
    },
    features: [
      "كل ما في خطة Starter، بالإضافة إلى:",
      "نطاق مخصّص مجاني لسنة — ‏.store، .site، .online، .shop",
      "خصم 30% على النطاقات الأغلى (.com وأمثالها)",
      "إزالة شارة «صُنع بزينيا»",
      "إدارة كاملة لموقعك ونطاقك",
      "دعم أولوية قصوى",
    ],
  },
] as const

/* Verbatim from app/(main)/pricing/page.tsx. Nothing has been added: a claim
   about a competitor that nobody has checked is not a design decision. The one
   edit is "1-2" for "1–2", because an en dash as a range separator is banned
   by the project's design skill. */
const COMPARE = [
  { feature: "السعر", zenya: "0.50$ / 14.99$ / 24.99$", other: "+29$ شهريًا", agency: "+2,000$" },
  { feature: "وقت الإعداد", zenya: "أقل من 60 ثانية", other: "دقائق", agency: "أسابيع" },
  { feature: "القوالب", zenya: "8 قوالب", other: "1-2", agency: "مخصّص" },
  { feature: "النشر مشمول", zenya: "من خطة Entry", other: "في معظمها", agency: "تتولّاها بنفسك" },
  { feature: "نطاق مخصّص", zenya: "من خطة Starter", other: "في معظمها", agency: "نعم" },
  { feature: "تصدير شوبيفاي", zenya: "من خطة Starter", other: "نادر", agency: "مخصّص" },
  { feature: "الارتباط بالمنصّة", zenya: "لا يوجد", other: "مرتفع", agency: "لا يوجد" },
]

const NAV: Array<{ href: string; label: string; tray?: boolean; current?: boolean }> = [
  { href: "/themes", label: "القوالب", tray: true },
  { href: "/demo/pricing", label: "الأسعار", current: true },
  { href: "/contact", label: "تواصل" },
]

function Tick({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.2 6.3 4.6 8.8 9.8 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PricingView() {
  const [trayOpen, setTrayOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  /* Which layout the plans take. Read from matchMedia rather than duplicated
     as a breakpoint in the stylesheet, so the markup and the CSS cannot
     disagree about where the row becomes a deck. Starts false so the server
     and the first client render agree, then corrects on mount. */
  const [narrow, setNarrow] = useState(false)
  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)
  /* Whether a dark panel is currently behind the header. */
  const [onDark, setOnDark] = useState(false)

  /* THE HEADER TAKES THE GROUND IT IS STANDING ON, which is what the deck
     does and what was missing here. Two things had to be true before the
     blur could show anything at all: the header had to be sticky, so that
     content passes behind it rather than scrolling away with it, and its own
     ground had to stop being opaque. A backdrop-filter under a solid white
     fill is work the compositor does for nothing.

     Over the dark panels it inverts to the deck's own values rather than
     staying a white bar floating over obsidian.

     The band this watches is the strip the header actually occupies, in CSS
     pixels. The root ZoomLock writes CSS zoom, so a bounding rect comes back
     in rendered pixels while rootMargin is read as CSS pixels; dividing by the
     zoom is what keeps the two from being mixed. */
  useEffect(() => {
    const head = headRef.current
    const root = rootRef.current
    if (!head || !root) return
    let io: IntersectionObserver | null = null

    /* A rootMargin band the height of the header, and threshold 0, so each
       dark panel reports exactly as its edge crosses the header rather than
       at intervals along the way.

       A threshold ladder was tried first and is not accurate enough: it fires
       when a share of the TARGET becomes visible, so the last report during a
       scroll lands wherever the final threshold happened to fall. Measured, it
       last saw the panel at 71px while the panel settled at 60px, four pixels
       past the header, and the header stayed light with obsidian behind it.

       And a note worth keeping, because it cost the first attempt: rects and
       rootMargin are in the SAME space here. The root ZoomLock writes CSS
       zoom, which tempts a division; the first version divided and the band
       never matched. Verified by planting this exact observer: false at the
       top, true on the comparison, true on the footer, false back at the top.

       The set is what makes two panels safe. Leaving one and arriving at the
       next are separate reports, and taking the last one alone would blink
       the header light between them. */
    const live = new Set<Element>()

    const build = () => {
      io?.disconnect()
      live.clear()
      /* The visible pill, not the first one in the DOM: the phone pill and the
         wide bar both exist at every width and one of them is display:none
         with a zero-height rect. */
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zp-pill, .zp-phone-pill"))
        .find((el) => el.getBoundingClientRect().height > 0)
      if (!pill) return
      const r = pill.getBoundingClientRect()
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) live.add(e.target)
            else live.delete(e.target)
          })
          setOnDark(live.size > 0)
        },
        {
          rootMargin: -r.top + "px 0px " + -(window.innerHeight - r.bottom) + "px 0px",
          threshold: 0,
        }
      )
      darks.forEach((el) => io!.observe(el))
    }

    const darks = Array.from(root.querySelectorAll<HTMLElement>(".zp-compare, .zf-inner"))
    build()
    window.addEventListener("resize", build)
    return () => { io?.disconnect(); window.removeEventListener("resize", build) }
    /* Rebuilt when the layout swaps, because the two pills are different
       heights and the band is measured from whichever one is showing. */
  }, [narrow])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  /* THE TABLE SAYS THAT IT SCROLLS BY SCROLLING. A matrix wider than the
     screen with no affordance reads as a matrix with three columns, and the
     reader never learns the other two are there. When it arrives it slides a
     little and comes back, once.

     The direction is measured, not assumed: RTL browsers disagree about the
     sign of scrollLeft, so this tries one way, checks whether the box actually
     moved, and takes the other way if it did not. */
  useEffect(() => {
    const wrap = rootRef.current?.querySelector<HTMLElement>(".zp-table-wrap")
    if (!wrap) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const max = wrap.scrollWidth - wrap.clientWidth
        if (max < 24) return
        /* Probe the direction with smooth scrolling OFF. With it on, the
           assignment starts an animation and reading scrollLeft back on the
           same tick returns the old value, so the check always said "did not
           move" and immediately undid itself. Measured: the box went through
           exactly one position. */
        const prev = wrap.style.scrollBehavior
        wrap.style.scrollBehavior = "auto"
        const home = wrap.scrollLeft
        wrap.scrollLeft = home - 64
        const delta = wrap.scrollLeft !== home ? -64 : 64
        wrap.scrollLeft = home
        wrap.style.scrollBehavior = prev
        window.setTimeout(() => {
          wrap.scrollLeft = home + delta
          window.setTimeout(() => { wrap.scrollLeft = home }, 640)
        }, 280)
      })
    }, { threshold: 0.35 })
    io.observe(wrap)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduce) {
      targets.forEach((el) => el.setAttribute("data-in", "true"))
      return
    }
    root.classList.add("zp-js")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute("data-in", "true")
          io.unobserve(entry.target)
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
    /* Re-run when the layout swaps. The observer collects its targets once,
       and the plans are a different set of elements in the row and in the
       deck: mounting collected the row's cards, the media query then replaced
       them with the deck's, and nothing was left observing the new ones. They
       kept the hidden half of the reveal for ever. Measured: on a phone the
       whole plan deck rendered at opacity 0 with only its dots showing. */
  }, [narrow])

  /* The card itself, so the deck and the row cannot drift apart. */
  const planCard = (plan: (typeof PLANS)[number], i: number) => {
    const marked = plan.id === "starter"
    return (
            <article
              key={plan.id}
              className="zp-card"
              data-plan={plan.id}
              data-mark={marked ? "true" : undefined}
              data-reveal
              style={{ ["--i" as string]: String(i) }}
            >
              <header className="zp-card-head">
                {/* Always rendered, ghosted where there is no badge: showing it
                    only on Starter pushed that card's name and price below its
                    neighbours', and the top alignment of the three prices is
                    the most important scan line on the page. */}
                <b
                  className="zp-badge"
                  data-ghost={"badge" in plan && plan.badge ? undefined : "true"}
                  aria-hidden={"badge" in plan && plan.badge ? undefined : true}
                >
                  {"badge" in plan && plan.badge ? plan.badge : NBSP}
                </b>
                <p className="zp-name">{plan.name}</p>
                <div className="zp-price">
                  <span className="zp-amount" dir="ltr">{plan.amount}</span>
                  <span className="zp-per">{plan.per}</span>
                </div>
                <p className="zp-sub">{plan.sub}</p>
              </header>

              {"note" in plan && plan.note ? (
                <div className="zp-note">
                  <span className="zp-note-title">{plan.note.title}</span>
                  <span className="zp-note-body">{plan.note.body}</span>
                </div>
              ) : null}

              <ul className="zp-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Tick className="zp-tick" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <SlideButton
                href={plan.href}
                slide={plan.ctaSlide}
                variant={marked ? "violet" : "key"}
              >
                {plan.cta}
              </SlideButton>

              <p className="zp-foot">{plan.foot}</p>
            </article>
    )
  }

  return (
    <main className={"zp-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header
        ref={headRef}
        className={"zp-head " + plex.className}
        data-dark={onDark ? "true" : undefined}
        onMouseLeave={() => setTrayOpen(false)}
      >
        {/* Phone: a small pill, not the laptop bar squeezed onto a phone.
            Measured before this existed: the wide bar was rendering at 380px
            on a 390px screen while the deck's own phone pill is 184px closed.
            Closed it is the menu, the mark and the account; opening widens the
            same surface from the middle and takes the pages down underneath,
            which is the deck's arrangement exactly. */}
        <div
          className="zp-phone-pill"
          data-open={menuOpen ? "true" : undefined}
          style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}
        >
          <div className="zp-phone-bar">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="zp-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              className="zp-round"
            >
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/demo/home" aria-label="زينيا" className="zp-phone-mark">
              {/* Pure black is permitted here: the style reserves #000 for
                  logo marks and graphic glyphs, nowhere else. */}
              <ZenyaMark className="zp-mark-svg-sm" />
            </Link>
            {/* The deck's own signed-out control, verbatim: an obsidian pill
                reading ابدأ, not an icon. It is what makes the closed pill
                measure what the deck's measures. */}
            <Link href="/login?mode=signup" className="zp-account zp-account-phone">
              ابدأ
            </Link>
          </div>
          <div
            className="zp-drawer"
            data-open={menuOpen ? "true" : undefined}
            style={{
              gridTemplateRows: menuOpen ? "1fr" : "0fr",
              visibility: menuOpen ? "visible" : "hidden",
            }}
          >
            <div className="zp-drawer-clip">
              <nav id="zp-phone-menu" className="zp-phone-menu">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="zp-tray-row"
                    data-current={item.current ? "true" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Tablet and up: the deck's bar, at the deck's measurements. */}
        <div className="zp-pill" style={{ width: trayOpen ? PILL_THEMES : PILL_REST }}>
          {/* 1fr auto 1fr. The nav is the auto track, so it cannot move; the
              two 1fr tracks take the new width equally and the surface opens
              around the words rather than dragging them along. */}
          <div className="zp-bar">
            <span className="zp-side zp-side-start">
              <Link
                href="/demo/home"
                className="zp-mark"
                aria-label="زينيا"
                onMouseEnter={() => setTrayOpen(false)}
              >
                <ZenyaMark className="zp-mark-svg" />
              </Link>
            </span>

            <nav className="zp-nav">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="zp-nav-item"
                  data-current={item.current ? "true" : undefined}
                  aria-current={item.current ? "page" : undefined}
                  aria-expanded={item.tray ? trayOpen : undefined}
                  aria-controls={item.tray ? "zp-tray" : undefined}
                  onMouseEnter={() => setTrayOpen(!!item.tray)}
                  onFocus={() => setTrayOpen(!!item.tray)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <span className="zp-side zp-side-end" onMouseEnter={() => setTrayOpen(false)}>
              <span className="zp-sep" aria-hidden />
              <Link href="/login?mode=signup" className="zp-account">
                ابدأ
              </Link>
            </span>
          </div>

          <div
            id="zp-tray"
            className="zp-drawer"
            data-open={trayOpen ? "true" : undefined}
            style={{
              gridTemplateRows: trayOpen ? "1fr" : "0fr",
              visibility: trayOpen ? "visible" : "hidden",
            }}
          >
            <div className="zp-drawer-clip">
              <div className="zp-tray-grid">
                {TEMPLATES.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="zp-tray-row"
                    onClick={() => setTrayOpen(false)}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="zp-lede" data-reveal>
        <h1 className="zp-h1">
          المعاينة مجانية.
          <br />
          التوليد يبدأ بنصف دولار.
        </h1>
        <p className="zp-lede-sub">
          خطة تُدفع مرّة واحدة، وخطّتان شهريتان. الاشتراك يُلغى متى شئت.
        </p>
      </div>

      {/* The plans stand on the ground. They are the page, not an item on it. */}
      {/* ONE CARD, TWO LAYOUTS. Wide, the three stand side by side and the
          prices share a scan line. On a phone they were a column, which meant
          a reader met the recommendation and then scrolled past two more of
          the same shape without ever seeing them together. They are a deck
          now: the recommendation in front, its neighbours visibly behind it,
          and a finger between them. */}
      {narrow ? (
        <SwipeStack
          className="zp-swipe"
          label="الخطط"
          initialIndex={PLANS.findIndex((p) => p.id === "starter")}
          itemLabels={PLANS.map((p) => p.name)}
        >
          {PLANS.map((plan, i) => planCard(plan, i))}
        </SwipeStack>
      ) : (
        <section className="zp-row" aria-label="الخطط">
          {PLANS.map((plan, i) => planCard(plan, i))}
        </section>
      )}

      <p className="zp-tail" data-reveal>
        عندك كود خصم؟ أدخِله في خانة «Promotion code» عند الدفع.
      </p>

      {/* What comes off the price first, then the argument for the price.
          The comparison moved below the stack: it is the longest block on the
          page and the least urgent, so it was standing between the plans and
          the thing that makes them cheaper. */}
      <CodeStack />

      {/* The argument, on its own ground.

          The stage exists to clip: the panel is scaled UP while it is below
          the fold, and a scaled box paints outside its layout width even
          though it does not take up more of it. Without a clip that overhang
          becomes a horizontal scrollbar on any window narrower than about
          1250px. overflow-x: clip and not hidden, because hidden would make
          this a scroll container and steal the panel's own sticky behaviour
          if it ever gets any. */}
      <div className="zp-compare-stage">
      <section className="zp-compare" aria-labelledby="zp-compare-h">
        <div className="zp-compare-head">
          <h2 id="zp-compare-h" className="zp-h2">لماذا زينيا</h2>
          <p className="zp-h2-sub">نفس الموقع، وثلاث طرق لدفع ثمنه.</p>
        </div>

        {/* A real table, because this is a matrix and a screen reader should
            hear it as one. The Zenya column is one standing surface through the
            whole thing rather than a hairline drawn under every row. */}
        <div className="zp-table-wrap">
          <table className="zp-table" role="table">
            <caption className="sr-only">
              مقارنة زينيا بمنشئات الذكاء الاصطناعي العامة وبالوكالات
            </caption>
            <thead>
              <tr>
                <th scope="col" className="zp-th zp-th-feature">الميزة</th>
                <th scope="col" className="zp-th zp-th-zenya">زينيا</th>
                <th scope="col" className="zp-th">ذكاء اصطناعي آخر</th>
                <th scope="col" className="zp-th">وكالة</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.feature} role="row" style={{ ["--i" as string]: String(i) }} data-reveal>
                  <th scope="row" role="rowheader" className="zp-td zp-td-feature">{row.feature}</th>
                  {/* data-label is what the stacked layout prints in place of
                      the header row it has to hide on a phone. */}
                  <td role="cell" className="zp-td zp-td-zenya" data-label="زينيا">{row.zenya}</td>
                  <td role="cell" className="zp-td" data-label="ذكاء اصطناعي آخر">{row.other}</td>
                  <td role="cell" className="zp-td" data-label="وكالة">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      <PricingFooter />
    </main>
  )
}

/* ---------------------------------------------------------------------------
   No backticks inside this literal: one would end it.
--------------------------------------------------------------------------- */
const CSS = `
.zp-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  /* Darkened a step from the deck's stone. Arabic carries its weight in the
     stroke rather than the counter, so a grey that reads as "secondary" in
     Latin reads as "faded" here. */
  --stone: #56565a;
  --ink-soft: #2f2f2e;
  --violet: #5e6ad2;
  --violet-lift: #97a0ee;
  --onyx: #131316;
  --gut: clamp(1rem, 4vw, 3rem);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);

  /* ONE radius scale, stated so it can be checked. */
  --r-panel: 28px;
  --r-card: 16px;
  --r-control: 10px;

  position: relative;
  min-height: 100%;
  background: var(--ground);
  color: var(--obsidian);
  padding: 0 var(--gut) clamp(3rem, 7vw, 6rem);
  /* Arabic never takes negative tracking: the letterforms connect. */
  letter-spacing: 0;
}
/* One flat colour, nothing in it. The fixed layer is what keeps it under the
   whole document at any scroll position. */
.zp-root::before {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--ground);
  z-index: -1;
}
.sr-only {
  position: absolute; width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}

/* ---- the header, on the deck's own mechanic ----------------------------- */

/* Sticky, so there is something behind it to reflect. The strip is
   pointer-transparent and only the pills take clicks, or a full-width bar
   would swallow taps on whatever is passing underneath. */
.zp-head {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 2rem 0 0;
  pointer-events: none;
}
.zp-pill, .zp-phone-pill { pointer-events: auto; }

/* The header splits at md (768px), the same place the deck splits it: tablets
   get the laptop bar, phones get the compact pill. */
.zp-phone-pill {
  width: fit-content; max-width: 100%;
  margin-inline: auto;
  overflow: hidden;
  border-radius: 22px;
  /* Glass, not a key. The dark state's two layers with the values inverted:
     one flat translucent face, one hairline, over a ring of the ground. The
     five-layer key this replaces (lit rim, front wall, hard base, contact
     shadow) said "an object sitting ON the page"; this says "a pane over it".
     See app/demo/home/page.tsx for why the light face is greyer and MORE
     transparent than the dark one. */
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow:
    0 0 0 1px rgba(17, 17, 17, 0.18),
    0 0 0 4px rgba(250, 250, 250, 0.5);
  /* Sideways first, then down, so the two do not fight for the same frames. */
  transition:
    min-width 380ms var(--ease-out) 220ms,
    background-color 520ms var(--ease-out),
    box-shadow 520ms var(--ease-out);
}
.zp-phone-pill[data-open] { transition-delay: 0s; }
@media (prefers-reduced-motion: reduce) { .zp-phone-pill { transition: none; } }
.zp-phone-bar {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; gap: 0.375rem;
  height: 44px; padding-inline: 0.375rem;
}
.zp-phone-mark { display: flex; align-items: center; justify-self: center; padding-inline: 0.375rem; }
.zp-mark-svg-sm { height: 16px; color: #000; }
.zp-round {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 0; background: transparent; cursor: pointer;
  border-radius: 999px; color: var(--obsidian); text-decoration: none;
  transition: background-color 150ms var(--ease-out);
}
.zp-round:hover { background: rgba(0, 0, 0, 0.05); }
.zp-account-phone { justify-self: end; }
.zp-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
.zp-tray-row[data-current="true"] { color: var(--obsidian); }

@media (min-width: 768px) { .zp-phone-pill { display: none; } }
@media (max-width: 767px) { .zp-pill { display: none; } }
.zp-pill {
  border-radius: 24px;
  overflow: hidden;
  /* Glass, not a key. The dark state's two layers with the values inverted:
     one flat translucent face, one hairline, over a ring of the ground. The
     five-layer key this replaces (lit rim, front wall, hard base, contact
     shadow) said "an object sitting ON the page"; this says "a pane over it".
     See app/demo/home/page.tsx for why the light face is greyer and MORE
     transparent than the dark one. */
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow:
    0 0 0 1px rgba(17, 17, 17, 0.18),
    0 0 0 4px rgba(250, 250, 250, 0.5);
  transition:
    width 440ms var(--ease-out),
    background-color 520ms var(--ease-out),
    box-shadow 520ms var(--ease-out);
  /* Resizing a box that also carries a backdrop filter is the expensive half;
     containment stops the work at the pill's own border. */
  contain: layout paint;
  will-change: width;
}
/* Without a blur behind it a 60% face is not glass, it is a washed-out
   rectangle, so both fallbacks go opaque and let the hairline carry the edge. */
@media (prefers-reduced-transparency: reduce) {
  .zp-pill, .zp-phone-pill {
    background: #f2f2f5;
    -webkit-backdrop-filter: none; backdrop-filter: none;
  }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .zp-pill, .zp-phone-pill { background: #f2f2f5; }
}
@media (prefers-reduced-motion: reduce) { .zp-pill { transition: none; } }

/* The words hold the middle and the surface opens around them. */
/* The deck's own measurements, taken from app/demo/home/page.tsx rather than
   guessed: h-12 (48px), pe-1.5 ps-3, and nav items at 10px 12px. Measured
   before this: the pill here stood 43.3px against the deck's 48px, because
   the bar was sized by its contents instead of being given the height. */
.zp-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 48px;
  padding-inline-start: 0.75rem;
  padding-inline-end: 0.375rem;
}
.zp-side { display: flex; align-items: center; min-width: 0; }
.zp-side-start { justify-content: flex-start; }
.zp-side-end { justify-content: flex-end; }
.zp-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.zp-mark-svg { height: 17px; color: #000; }

/* ---- the header standing on a dark panel --------------------------------
   The deck's values, not a new set: rgba(32,32,38,0.72) behind a 12% paper
   ring and a 4px ring of the ground itself, which is what makes the pill read
   as cut out of the screen rather than laid on top of it. The alpha is the
   point. At 0.72 the blur underneath is doing visible work.
------------------------------------------------------------------------- */
.zp-head[data-dark] .zp-pill,
.zp-head[data-dark] .zp-phone-pill {
  background: rgba(32, 32, 38, 0.72);
  box-shadow:
    0 0 0 1px rgba(250, 250, 250, 0.12),
    0 0 0 4px rgba(19, 19, 22, 0.5);
}
/* The mark fills with currentColor. Pure black is the rule on paper; on
   obsidian its counterpart is paper, not a grey. */
.zp-head[data-dark] .zp-mark-svg,
.zp-head[data-dark] .zp-mark-svg-sm { color: #fafafa; }
.zp-head[data-dark] .zp-nav-item,
.zp-head[data-dark] .zp-tray-row,
.zp-head[data-dark] .zp-round { color: rgba(250, 250, 250, 0.66); }
.zp-head[data-dark] .zp-nav-item:hover,
.zp-head[data-dark] .zp-nav-item[data-current="true"],
.zp-head[data-dark] .zp-tray-row:hover { color: #fafafa; }
.zp-head[data-dark] .zp-tray-row:hover,
.zp-head[data-dark] .zp-round:hover { background: rgba(250, 250, 250, 0.08); }
.zp-head[data-dark] .zp-sep { background: rgba(250, 250, 250, 0.16); }
/* The account control inverts with the pill: obsidian on paper becomes paper
   on obsidian, so it stays the one solid thing in the bar. */
.zp-head[data-dark] .zp-account { background: #fafafa; color: #171717; }
.zp-head[data-dark] .zp-account:hover { background: #fff; }
.zp-nav { display: flex; align-items: center; gap: 0.125rem; }
.zp-nav-item {
  border-radius: 999px;
  padding: 0.625rem 0.75rem;
  font-size: 14px;
  line-height: 1.24;
  white-space: nowrap;
  color: #666666;
  text-decoration: none;
  transition: color 150ms var(--ease-out);
}
.zp-nav-item:hover, .zp-nav-item[data-current="true"] { color: var(--obsidian); }
.zp-nav-item, .zp-tray-row, .zp-round, .zp-sep, .zp-account,
.zp-mark-svg, .zp-mark-svg-sm {
  transition: color 520ms var(--ease-out), background-color 520ms var(--ease-out);
}
/* The one separator the style allows: inside the header pill, before the
   account control. Nothing else on this page draws a line across anything. */
.zp-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0, 0, 0, 0.07); }
/* The deck's control: rounded-full, px-4 py-2, 14px, obsidian. */
.zp-account {
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 14px;
  line-height: 1.24;
  font-weight: 400;
  white-space: nowrap;
  text-decoration: none;
  background: var(--obsidian);
  color: var(--ground);
  transition: opacity 150ms var(--ease-out);
}
.zp-account:hover { opacity: 0.86; }

/* 0fr to 1fr is the one way to transition to an auto height without hard
   coding a pixel the contents will outgrow. Visibility is stepped so the
   tray's links leave the focus order only once it has finished closing. */
.zp-drawer {
  display: grid;
  transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms;
}
.zp-drawer[data-open] { transition-delay: 0s, 0s; }
@media (prefers-reduced-motion: reduce) { .zp-drawer { transition: none; } }
.zp-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zp-tray-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0 0.25rem; padding: 0.125rem 0.375rem 0.375rem;
}
.zp-tray-row {
  display: block; border-radius: 6px; padding: 0.5rem 0.75rem;
  font-size: 13.5px; line-height: 1.24; text-decoration: none; color: #666666;
  transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
.zp-tray-row:hover { background: rgba(0, 0, 0, 0.04); color: var(--obsidian); }

/* ---- the lede ----------------------------------------------------------- */

.zp-lede { text-align: center; margin: clamp(2.5rem, 6vw, 4rem) auto clamp(2.5rem, 6vw, 3.75rem); max-width: 46rem; }
.zp-h1 {
  margin: 0;
  font-size: clamp(30px, 5vw, 52px);
  font-weight: 900;
  /* Arabic leading stays well above 1.24 so descenders are never clipped. */
  line-height: 1.36;
  letter-spacing: 0;
  color: var(--obsidian);
}
.zp-lede-sub {
  margin: 1.125rem auto 0; max-width: 34rem;
  font-size: 16px; font-weight: 500; line-height: 1.9; color: var(--stone);
}

/* ---- the plans, standing on the ground ---------------------------------- */

.zp-row {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem; align-items: stretch;
  max-width: 1080px; margin: 0 auto;
}
.zp-card {
  position: relative; display: flex; flex-direction: column;
  padding: 1.75rem 1.625rem 1.625rem;
  border-radius: var(--r-card);
  background: var(--card);
  /* Elevation is stacked hairline rings, never a drop shadow. */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 4px rgba(250, 250, 250, 0.55);
}
.zp-card[data-mark] {
  background: var(--onyx);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55), 0 0 0 4px rgba(250, 250, 250, 0.55);
}

.zp-badge {
  display: inline-block; align-self: flex-start;
  margin-bottom: 0.75rem; padding: 0.1875rem 0.6875rem;
  border-radius: 999px; background: var(--violet); color: #fff;
  font-size: 11px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0; white-space: nowrap;
}
/* visibility, not display: the box still lays out and still measures exactly
   what a real badge measures. */
.zp-badge[data-ghost] { visibility: hidden; }
.zp-card-head { display: flex; flex-direction: column; align-items: flex-start; }
.zp-name {
  margin: 0 0 0.875rem;
  font-size: 11.5px; font-weight: 700; line-height: 1.4;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--stone);
}
.zp-card[data-mark] .zp-name { color: var(--violet-lift); }
.zp-price { display: flex; align-items: baseline; gap: 0.375rem; margin-bottom: 0.5625rem; }
.zp-amount { font-size: 46px; font-weight: 900; line-height: 1.24; letter-spacing: 0; }
.zp-card[data-mark] .zp-amount { color: var(--ground); }
.zp-per { font-size: 14px; font-weight: 500; line-height: 1.6; color: var(--stone); }
.zp-card[data-mark] .zp-per { color: #a8a8b2; }
.zp-sub { margin: 0; font-size: 14px; font-weight: 500; line-height: 1.75; color: var(--stone); }
.zp-card[data-mark] .zp-sub { color: #a8a8b2; }

/* Pro's entitlement note: a hairline-ringed box in the page's one accent, not
   a filled slab in a second one. */
.zp-note {
  display: flex; flex-direction: column; gap: 0.1875rem;
  margin-top: 1.125rem; padding: 0.6875rem 0.8125rem;
  border-radius: var(--r-control);
  box-shadow: inset 0 0 0 1px rgba(94, 106, 210, 0.28);
}
.zp-note-title { font-size: 12.5px; font-weight: 700; line-height: 1.6; color: var(--violet); }
.zp-note-body { font-size: 12px; font-weight: 500; line-height: 1.75; color: #4b4b73; }

.zp-features {
  list-style: none; margin: 1.375rem 0 1.625rem; padding: 0; flex: 1;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.zp-features li {
  display: flex; align-items: flex-start; gap: 0.5625rem;
  font-size: 13.5px; font-weight: 500; line-height: 1.7; color: var(--ink-soft);
}
.zp-card[data-mark] .zp-features li { color: #eaeaef; }
.zp-tick { width: 14px; height: 14px; flex: 0 0 14px; margin-top: 4px; color: #7c7c86; }
.zp-card[data-mark] .zp-tick { color: var(--violet-lift); }

/* Two lines reserved on every card. Pro's line wraps at narrow card widths,
   and without the reservation that wrap alone moves Pro's button while its
   neighbours' stay put. */
.zp-foot {
  margin: 0.625rem 0 0; min-height: 2.45rem; text-align: center;
  font-size: 12px; font-weight: 500; line-height: 1.7; color: #7c7c86;
}
.zp-card[data-mark] .zp-foot { color: #a8a8b2; }

.zp-tail {
  margin: clamp(2rem, 4vw, 3rem) auto 0; text-align: center;
  font-size: 13.5px; font-weight: 500; line-height: 1.8; color: var(--stone);
}

/* ---- the comparison, on its own ground ---------------------------------- */

/* ---- the panel arrives by shrinking -------------------------------------
   It sits scaled up while it is below the fold, so the first thing a reader
   meets at the bottom of the screen is a big dark shape, and it settles to
   its resting size as it scrolls into view.

   Driven by a CSS scroll-driven timeline, for three reasons that all matter:
   a scroll listener is banned here and would run on every frame; a transform
   on a scroll timeline is composited off the main thread, which a JS-driven
   one is not; and the resting state stays the finished state, because a
   browser without view() support simply never runs it and the panel is
   already at scale 1 in its base rule. That is the house rule this page has
   broken twice before, and it is why the effect is not written in JS.

   Uniform scale rather than an animated width: width is layout work on every
   frame, and this style animates transform and opacity only.
--------------------------------------------------------------------------- */
.zp-compare-stage { overflow-x: clip; }

@keyframes zp-settle {
  from { transform: scale(var(--settle-from, 1.14)); }
  to { transform: scale(1); }
}
/* WIDE SCREENS ONLY, and that is a correction. The entry range ends when the
   panel's BOTTOM edge enters the viewport, so it only behaves when the panel
   is shorter than the viewport. It was, at every width, until the table began
   stacking on phones: measured after that change, 1267px of panel against an
   844px viewport. The shrink then stretches across the whole read and the
   table sits visibly oversized the entire time someone is trying to compare
   rows in it. Below 701px the panel simply rests at its size, which is also
   where the effect was worth least: at that width the panel is nearly the
   full screen already, so scaling it up mostly pushes it under the clip. */
@media (min-width: 701px) {
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .zp-compare {
        transform-origin: 50% 50%;
        animation: zp-settle linear both;
        animation-timeline: view();
        animation-range: entry 0% entry 100%;
        will-change: transform;
      }
    }
  }
}

.zp-compare {
  /* How big it starts. One number, and the only one worth touching to make
     the arrival stronger or quieter. Above about 1.22 the panel's own text
     is visibly soft while it is scaled, which is the ceiling on this. */
  --settle-from: 1.14;
  max-width: 1080px;
  margin: clamp(3.5rem, 8vw, 6rem) auto 0;
  padding: clamp(2.25rem, 5vw, 3.5rem) clamp(1.25rem, 3.5vw, 3rem) clamp(2rem, 4vw, 3rem);
  border-radius: var(--r-panel);
  background: var(--onyx);
}
.zp-compare-head { text-align: center; margin-bottom: clamp(1.75rem, 4vw, 2.5rem); }
.zp-h2 {
  margin: 0; font-size: clamp(24px, 3.4vw, 36px); font-weight: 900;
  line-height: 1.36; letter-spacing: 0; color: var(--ground);
}
.zp-h2-sub { margin: 0.75rem 0 0; font-size: 15px; font-weight: 500; line-height: 1.85; color: #a8a8b2; }

.zp-table { width: 100%; min-width: 640px; border-collapse: separate; border-spacing: 0; text-align: start; }
.zp-th {
  padding: 0 1rem 0.9375rem;
  font-size: 11.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: #9a9aa4; text-align: center;
}
.zp-th-feature { text-align: start; }
/* The Zenya column is one surface running the height of the table, which is
   what makes it an argument rather than a spec sheet. The rounding is on the
   header and the last row, so the column reads as a single standing object. */
.zp-th-zenya {
  color: var(--violet-lift);
  background: rgba(94, 106, 210, 0.16);
  border-radius: var(--r-control) var(--r-control) 0 0;
  padding-top: 0.9375rem;
}
.zp-td {
  padding: 1rem; font-size: 14px; font-weight: 500; line-height: 1.75;
  text-align: center; color: #a8a8b2;
}
.zp-td-feature { text-align: start; font-weight: 700; color: #e4e4ea; }
.zp-td-zenya { background: rgba(94, 106, 210, 0.16); font-weight: 700; color: #ffffff; }
.zp-table tbody tr:last-child .zp-td-zenya { border-radius: 0 0 var(--r-control) var(--r-control); }
/* One hairline between rows, never a rule under every cell. */
.zp-table tbody tr + tr .zp-td { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07); }
.zp-table tbody tr + tr .zp-td-zenya { box-shadow: inset 0 1px 0 rgba(151, 160, 238, 0.20); }

/* ---- arrival ------------------------------------------------------------
   The hidden half applies only under .zp-js, which the script adds on mount,
   so a browser that never runs it reads a finished page. Stagger rides a
   custom property, so no element carries a hand-written delay.
------------------------------------------------------------------------- */
.zp-js [data-reveal] { opacity: 0; transform: translateY(18px); }
.zp-js [data-reveal][data-in] {
  opacity: 1; transform: none;
  transition:
    opacity 640ms var(--ease-out) calc(var(--i, 0) * 90ms),
    transform 640ms var(--ease-out) calc(var(--i, 0) * 90ms);
}
.zp-js tr[data-reveal] { opacity: 0; transform: translateY(10px); }
.zp-js tr[data-reveal][data-in] {
  opacity: 1; transform: none;
  transition:
    opacity 500ms var(--ease-out) calc(var(--i, 0) * 55ms),
    transform 500ms var(--ease-out) calc(var(--i, 0) * 55ms);
}
@media (prefers-reduced-motion: reduce) {
  .zp-js [data-reveal], .zp-js tr[data-reveal] { opacity: 1; transform: none; transition: none; }
}

/* ---- narrow ------------------------------------------------------------- */

@media (max-width: 900px) {
  .zp-row { grid-template-columns: minmax(0, 1fr); gap: 1rem; max-width: 26rem; }
  /* The recommendation leads the stack: a reader on a phone should meet the
     plan being recommended, not the cheapest by accident of source order. */
  .zp-card[data-plan="starter"] { order: -1; }
}
/* THE TABLE STAYS A TABLE ON A PHONE. It was restacked into blocks for a
   while, and that was the wrong trade: a comparison is read across, and
   stacking it turned one matrix into seven little ones. It keeps its columns
   and scrolls sideways inside its own box, and the page tells the reader that
   by moving it a little when it arrives. See nudgeTable().

   The wrapper is the only thing on this page that scrolls horizontally, and it
   is overscroll-contained so flicking to the end of the table does not start
   dragging the page behind it. */
.zp-table-wrap {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-behavior: smooth;
}
.zp-table-wrap::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) { .zp-table-wrap { scroll-behavior: auto; } }

@media (max-width: 560px) {
  .zp-root { --r-panel: 20px; }
  .zp-card { padding: 1.5rem 1.25rem 1.375rem; }
  .zp-amount { font-size: 40px; }
  .zp-compare { padding-inline: 1rem; }
}
`
