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
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import CodeStack from "./CodeStack"

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
  const rootRef = useRef<HTMLElement | null>(null)

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
  }, [])

  return (
    <main className={"zp-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className={"zp-head " + plex.className} onMouseLeave={() => setTrayOpen(false)}>
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
              <Link href="/dashboard" className="zp-account">
                حسابي
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
      <section className="zp-row" aria-label="الخطط">
        {PLANS.map((plan, i) => {
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
        })}
      </section>

      <p className="zp-tail" data-reveal>
        عندك كود خصم؟ أدخِله في خانة «Promotion code» عند الدفع.
      </p>

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

      {/* What comes off the price, after the argument for the price. */}
      <CodeStack />
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

.zp-head { display: flex; justify-content: center; padding: 2rem 0 clamp(2.5rem, 6vw, 4rem); }
.zp-pill {
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(246, 245, 242, 0.96) 100%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -3px 0 rgba(17, 17, 17, 0.10),
    0 0 0 1px rgba(17, 17, 17, 0.28),
    0 3px 0 rgba(17, 17, 17, 0.12),
    0 8px 16px rgba(17, 17, 17, 0.11);
  transition: width 440ms var(--ease-out);
  /* Resizing a box that also carries a backdrop filter is the expensive half;
     containment stops the work at the pill's own border. */
  contain: layout paint;
  will-change: width;
}
@media (prefers-reduced-transparency: reduce) {
  .zp-pill { -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@media (prefers-reduced-motion: reduce) { .zp-pill { transition: none; } }

/* The words hold the middle and the surface opens around them. */
.zp-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.3125rem 0.5rem;
}
.zp-side { display: flex; align-items: center; min-width: 0; }
.zp-side-start { justify-content: flex-start; }
.zp-side-end { justify-content: flex-end; }
.zp-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.zp-mark-svg { height: 17px; color: #000; }
.zp-nav { display: flex; align-items: center; gap: 0.125rem; }
.zp-nav-item {
  border-radius: 999px;
  padding: 0.5rem 0.75rem;
  font-size: 14px;
  line-height: 1.24;
  white-space: nowrap;
  color: #666666;
  text-decoration: none;
  transition: color 150ms var(--ease-out);
}
.zp-nav-item:hover, .zp-nav-item[data-current="true"] { color: var(--obsidian); }
/* The one separator the style allows: inside the header pill, before the
   account control. Nothing else on this page draws a line across anything. */
.zp-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0, 0, 0, 0.07); }
.zp-account {
  border-radius: 999px;
  padding: 0.5rem 0.875rem;
  font-size: 14px;
  line-height: 1.24;
  font-weight: 500;
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

.zp-lede { text-align: center; margin: 0 auto clamp(2.5rem, 6vw, 3.75rem); max-width: 46rem; }
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

.zp-table-wrap { overflow-x: auto; }
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
/* THE TABLE STOPS BEING A TABLE ON A PHONE. At 390px the matrix is 640px
   wide, so two of its four columns sit off-screen behind a horizontal scroll
   with nothing to say they are there: measured, a reader sees الميزة, زينيا
   and a 5px sliver of the third. A comparison nobody can see both sides of is
   not a comparison. Each row becomes its own block instead, with the column
   names printed per value from data-label. The roles are declared explicitly
   in the markup because display:block strips a table's implicit ones. */
@media (max-width: 700px) {
  .zp-table, .zp-table tbody, .zp-table tr, .zp-table th, .zp-table td { display: block; }
  .zp-table { min-width: 0; }
  .zp-table thead { display: none; }
  .zp-table-wrap { overflow-x: visible; }

  .zp-table tbody tr {
    padding: 0.875rem 0;
    box-shadow: none;
  }
  .zp-table tbody tr + tr { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08); }

  .zp-td { padding: 0; text-align: start; }
  .zp-td-feature { font-size: 15px; margin-bottom: 0.625rem; }

  /* The three values sit in a row of their own, Zenya first and lit. */
  .zp-table tbody tr { display: grid; grid-template-columns: 1.15fr 1fr 1fr; gap: 0.5rem; align-items: stretch; }
  .zp-td-feature { grid-column: 1 / -1; }
  .zp-table tbody tr .zp-td:not(.zp-td-feature) {
    display: flex; flex-direction: column; gap: 0.25rem;
    padding: 0.5rem 0.625rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    font-size: 12.5px; text-align: start;
  }
  .zp-table tbody tr .zp-td-zenya { background: rgba(94, 106, 210, 0.18); border-radius: 8px; }
  .zp-table tbody tr:last-child .zp-td-zenya { border-radius: 8px; }
  .zp-td:not(.zp-td-feature)::before {
    content: attr(data-label);
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: #8a8a94;
  }
  .zp-td-zenya::before { color: var(--violet-lift); }
}

@media (max-width: 560px) {
  .zp-root { --r-panel: 20px; }
  .zp-head { padding-top: 1.25rem; }
  .zp-card { padding: 1.5rem 1.25rem 1.375rem; }
  .zp-amount { font-size: 40px; }
  .zp-compare { padding-inline: 1rem; }
}
`
