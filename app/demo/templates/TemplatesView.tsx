"use client"

/**
 * The candidate templates page. See page.tsx for why this route exists and for
 * the design read.
 *
 * THE COMPOSITION IS TWO MOVEMENTS, the same shape as /demo/pricing. The tiles
 * stand directly on the ground, because the catalogue IS the page rather than
 * one item on it; the floor sits inside a dark soft-cornered panel, because it
 * is a different kind of claim. The tiles are what you choose between, the
 * panel is what is true whichever you choose. Giving the second its own ground
 * is what separates them without drawing a rule across the page, which this
 * style refuses.
 *
 * THE DARK PANEL IS ادر'S INVERSION, deliberately the same values as the
 * pricing page's comparison: #131316 with #97a0ee for type, because the flat
 * primary falls under 4.5:1 on that ground. Two dark objects on one page is a
 * pattern, not an accident; here they are the panel and the footer cap.
 *
 * THE HEADER IS THE SIBLING'S, MECHANIC AND ALL. Sticky so there is something
 * behind it to reflect, a 1fr auto 1fr grid so the words hold the middle while
 * the pill grows, the compact 184px pill on phones, and the deck's inverted
 * glass over dark grounds.
 *
 * ONE CORRECTION TO THAT COPY, and it is why the observer below reads .zf and
 * not .zf-inner: /demo/pricing watches ".zp-compare, .zf-inner", and .zf-inner
 * exists nowhere in the codebase — the footer's element is .zf, renamed when
 * the cap became a ground. Measured on /demo/pricing at 1440x620, scrolled to
 * the true bottom: the footer sits behind the header, data-dark is unset, and
 * the pill stays rgba(238,238,243,0.60) light glass on the obsidian cap. It
 * does not reproduce at 1440x900 because ZoomLock caps real scroll there before
 * the footer ever reaches the header, which is why it survived review. This
 * page watches the class that exists.
 *
 * MOTION IS ON ARRIVAL ONLY, and every resting state is the finished state. The
 * hidden half of each reveal is applied by a class the script adds on mount, so
 * a browser that never runs it reads a finished page. The observer is rebuilt
 * when the layout swaps: it collects its targets once, and the grid's tiles and
 * the deck's are different elements — that exact trap left a whole plan deck at
 * opacity 0 on the sibling.
 */

import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import SwipeStack from "@/components/ui/SwipeStack"
import { themePreview } from "@/lib/theme-previews"
import PricingFooter from "../pricing/PricingFooter"

/* Display and content are the same family at different weights, so the Arabic
   reads as one voice. The header keeps Plex, which is what it was chosen for. */
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/**
 * The eight, in the catalogue's own order.
 *
 * Every field is read from the codebase, not written here: `name` and `label`
 * from lib/template-pages.tsx, `tagline` / `sections` / `presets` / `demo` from
 * the live catalogue at app/(main)/themes/page.tsx, and `shopify` from the same
 * flag that page renders as شوبيفاي / مباشر. Exactly one template carries it.
 */
const TEMPLATES = [
  { id: "one_product", label: "متجر",   name: "متجر بمنتج واحد",           tagline: "متجر شوبيفاي · منتج واحد", sections: 24, presets: 3, demo: "/demo",            shopify: true },
  { id: "restaurant",  label: "مطعم",   name: "موقع مطعم",                 tagline: "مطعم · قائمة · حجوزات",    sections: 13, presets: 4, demo: "/demo/restaurant" },
  { id: "atlas",       label: "تطبيق",  name: "صفحة هبوط لتطبيق",          tagline: "تطبيق · برمجيات · B2B",    sections: 12, presets: 4, demo: "/demo/atlas" },
  { id: "lookbook",    label: "أزياء",  name: "موقع أزياء ولوك بوك",       tagline: "أزياء · ملابس · علامة",    sections: 11, presets: 4, demo: "/demo/lookbook" },
  { id: "collective",  label: "تشكيلة", name: "متجر بمنتجات متعددة",       tagline: "كتالوج · منتجات متعددة",   sections: 10, presets: 4, demo: "/demo/collective" },
  { id: "studio",      label: "ستوديو", name: "موقع علامة تجارية وقصة",    tagline: "قصة علامة · تحرير",        sections: 12, presets: 4, demo: "/demo/studio" },
  { id: "services",    label: "خدمات",  name: "موقع خدمات",                tagline: "خدمات محلية · حِرف",       sections: 13, presets: 4, demo: "/demo/services" },
  { id: "wellness",    label: "عافية",  name: "موقع مركز عافية",           tagline: "سبا · يوغا · عافية",       sections: 12, presets: 3, demo: "/demo/wellness" },
] as const

/**
 * The floor: what is true of all eight.
 *
 * Every line is a fact already stated elsewhere in the product — the shared
 * FAQ answers in lib/template-pages.tsx (AI writes the Arabic, minutes to
 * launch, EU hosting with SSL, custom domain), the per-template `includes`
 * arrays, which say RTL and mobile-responsive for every one of the eight, and
 * the pricing page's own "المعاينة مجانية". No claim here is new.
 */
const FLOOR = [
  { head: "نصوص عربية جاهزة",   body: "تكتب نبذة قصيرة عن نشاطك، ويولّد الذكاء الاصطناعي عناوين الموقع وأوصافه ودعواته بالعربية." },
  { head: "عربي من اليمين",     body: "كل قالب مبني للعربية أصلًا — الاتجاه والخطوط والتباعد — ومتجاوب مع الجوال." },
  { head: "معاينة قبل الدفع",   body: "تصفّح القوالب الثمانية كاملة قبل أن تدفع شيئًا. التوليد وحده هو ما يبدأ بنصف دولار." },
  { head: "استضافة ونطاق",      body: "استضافة داخل الاتحاد الأوروبي مع شهادة SSL، ونطاقك الخاص على الخطط المدفوعة." },
] as const

const NAV: Array<{ href: string; label: string; tray?: boolean; current?: boolean }> = [
  { href: "/demo/templates", label: "القوالب", tray: true, current: true },
  { href: "/demo/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

/* A definite closed width is what makes the sideways growth animatable at all:
   a pill at width:auto gives the transition nothing to move between. */
const PILL_REST = "380px"
const PILL_THEMES = "min(94vw, 720px)"

export default function TemplatesView() {
  const [trayOpen, setTrayOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  /* Which layout the tiles take. Read from matchMedia rather than duplicated as
     a breakpoint in the stylesheet, so the markup and the CSS cannot disagree
     about where the grid becomes a deck. Starts false so the server and the
     first client render agree, then corrects on mount. */
  const [narrow, setNarrow] = useState(false)
  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)
  const [onDark, setOnDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)")
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  /* THE HEADER TAKES THE GROUND IT IS STANDING ON.
     The band this watches is the strip the header actually occupies, in CSS
     pixels. The root ZoomLock writes CSS zoom, so a bounding rect and
     rootMargin are in the SAME space here — the tempting division by the zoom
     is what broke this on the sibling's first attempt. Do not add one.

     The set is what makes two panels safe: leaving one and arriving at the next
     are separate reports, and taking the last one alone would blink the header
     light between them. */
  useEffect(() => {
    const head = headRef.current
    const root = rootRef.current
    if (!head || !root) return
    let io: IntersectionObserver | null = null
    const live = new Set<Element>()
    /* .zf is the footer cap's real class. See the header note in the docstring
       for why this is not .zf-inner. */
    const darks = Array.from(root.querySelectorAll<HTMLElement>(".zt-panel, .zf"))

    const build = () => {
      io?.disconnect()
      live.clear()
      /* The VISIBLE pill, not the first in the DOM: both pills exist at every
         width and one of them is display:none with a zero-height rect. */
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zt-pill, .zt-phone-pill"))
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

    build()
    window.addEventListener("resize", build)
    return () => { io?.disconnect(); window.removeEventListener("resize", build) }
    /* Rebuilt when the layout swaps, because the two pills are different
       heights and the band is measured from whichever one is showing. */
  }, [narrow])

  /* Arrival. Re-run when the layout swaps: the observer collects its targets
     once, and the grid's tiles and the deck's are different elements. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduce) {
      targets.forEach((el) => el.setAttribute("data-in", "true"))
      return
    }
    root.classList.add("zt-js")
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
  }, [narrow])

  /* One tile, so the grid and the deck cannot drift apart. */
  const tile = (t: (typeof TEMPLATES)[number], i: number) => (
    <article key={t.id} className="zt-tile" data-reveal style={{ ["--i" as string]: String(i) }}>
      {/* The cover is the tile's whole top. object-position: top keeps every
          template's own hero intact, which matters because the eight
          screenshots do not share an aspect ratio (measured: 1.07 to 1.71). */}
      <Link href={t.demo} className="zt-shot" aria-label={"معاينة " + t.name}>
        {/* A plain img, deliberately, and the same choice every other
            theme-cover surface makes: themePreview() returns the resolver route
            /api/theme-preview/<id>, which 302s to whichever file is on disk.
            next/image would have to be pointed at the redirect target, which is
            the thing the resolver exists to keep out of the components. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={themePreview(t.id)} alt={"معاينة قالب " + t.name} loading="lazy" decoding="async" />
        {/* The "in" guard, not a bare t.shopify: `as const` makes TEMPLATES a
            union in which only the one Shopify entry carries the key at all.
            Same idiom the sibling uses for its optional badge. */}
        {"shopify" in t && t.shopify ? <span className="zt-flag">شوبيفاي</span> : null}
      </Link>

      <div className="zt-body">
        <p className="zt-tag">{t.tagline}</p>
        <h3 className="zt-name">{t.name}</h3>
        {/* Real counts, from the catalogue's own data. */}
        <p className="zt-meta">
          <span>{t.sections} قسمًا</span>
          <span className="zt-dot" aria-hidden>·</span>
          <span>{t.presets} أنماط جاهزة</span>
        </p>
        <span className="zt-cta">
          <SlideButton href={t.demo} slide="افتح المعاينة" variant="quiet">
            معاينة القالب
          </SlideButton>
        </span>
      </div>
    </article>
  )

  return (
    <main className={"zt-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header
        ref={headRef}
        className={"zt-head " + plex.className}
        data-dark={onDark ? "true" : undefined}
        onMouseLeave={() => setTrayOpen(false)}
      >
        {/* Phone: the compact pill, not the laptop bar squeezed down. */}
        <div
          className="zt-phone-pill"
          data-open={menuOpen ? "true" : undefined}
          style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}
        >
          <div className="zt-phone-bar">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="zt-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              className="zt-round"
            >
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/demo/home" aria-label="زينيا" className="zt-phone-mark">
              {/* Pure black is permitted here: the style reserves #000 for logo
                  marks and graphic glyphs, nowhere else. */}
              <ZenyaMark className="zt-mark-svg-sm" />
            </Link>
            <Link href="/login?mode=signup" className="zt-account zt-account-phone">
              ابدأ
            </Link>
          </div>
          <div
            className="zt-drawer"
            data-open={menuOpen ? "true" : undefined}
            style={{
              gridTemplateRows: menuOpen ? "1fr" : "0fr",
              visibility: menuOpen ? "visible" : "hidden",
            }}
          >
            <div className="zt-drawer-clip">
              <nav id="zt-phone-menu" className="zt-phone-menu">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="zt-tray-row"
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
        <div className="zt-pill" style={{ width: trayOpen ? PILL_THEMES : PILL_REST }}>
          {/* 1fr auto 1fr. The nav is the auto track, so it cannot move; the two
              1fr tracks take the new width equally and the surface opens around
              the words rather than dragging them along. */}
          <div className="zt-bar">
            <span className="zt-side zt-side-start">
              <Link href="/demo/home" className="zt-mark" aria-label="زينيا" onMouseEnter={() => setTrayOpen(false)}>
                <ZenyaMark className="zt-mark-svg" />
              </Link>
            </span>

            <nav className="zt-nav">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="zt-nav-item"
                  data-current={item.current ? "true" : undefined}
                  aria-current={item.current ? "page" : undefined}
                  aria-expanded={item.tray ? trayOpen : undefined}
                  aria-controls={item.tray ? "zt-tray" : undefined}
                  onMouseEnter={() => setTrayOpen(!!item.tray)}
                  onFocus={() => setTrayOpen(!!item.tray)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <span className="zt-side zt-side-end" onMouseEnter={() => setTrayOpen(false)}>
              <span className="zt-sep" aria-hidden />
              <Link href="/login?mode=signup" className="zt-account">ابدأ</Link>
            </span>
          </div>

          <div
            id="zt-tray"
            className="zt-drawer"
            data-open={trayOpen ? "true" : undefined}
            style={{
              gridTemplateRows: trayOpen ? "1fr" : "0fr",
              visibility: trayOpen ? "visible" : "hidden",
            }}
          >
            <div className="zt-drawer-clip">
              <div className="zt-tray-grid">
                {TEMPLATES.map((t) => (
                  <Link key={t.id} href={t.demo} className="zt-tray-row" onClick={() => setTrayOpen(false)}>
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="zt-lede" data-reveal>
        <h1 className="zt-h1">
          ثمانية قوالب.
          <br />
          كلّها جاهزة للنشر.
        </h1>
        <p className="zt-lede-sub">
          كل قالب موقع كامل بالعربية — تختار واحدًا، وتكتب نبذة عن نشاطك، ويكتب
          الذكاء الاصطناعي الباقي. المعاينة مجانية.
        </p>
      </div>

      {/* The tiles stand on the ground. They are the page, not an item on it.
          ONE TILE, TWO LAYOUTS. Wide, they are a contact sheet. On a phone a
          grid of eight becomes eight postage stamps stacked into a very long
          scroll, so they are a deck: one card in front, its neighbours visibly
          behind it, and a finger between them. */}
      {narrow ? (
        <SwipeStack
          className="zt-swipe"
          label="القوالب"
          itemLabels={TEMPLATES.map((t) => t.label)}
        >
          {TEMPLATES.map((t, i) => tile(t, i))}
        </SwipeStack>
      ) : (
        <section className="zt-grid" aria-label="القوالب">
          {TEMPLATES.map((t, i) => tile(t, i))}
        </section>
      )}

      {/* The floor, on its own ground. What is true whichever tile you pick. */}
      <section className="zt-panel" aria-labelledby="zt-panel-h" data-reveal>
        <div className="zt-panel-head">
          <h2 id="zt-panel-h" className="zt-h2">في كل قالب</h2>
          <p className="zt-h2-sub">الاختلاف في الشكل، لا في ما تحصل عليه.</p>
        </div>

        <div className="zt-floor">
          {FLOOR.map((f, i) => (
            <div key={f.head} className="zt-floor-item" data-reveal style={{ ["--i" as string]: String(i) }}>
              <h3 className="zt-floor-head">{f.head}</h3>
              <p className="zt-floor-body">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="zt-panel-cta">
          <SlideButton href="/theme/new" variant="violet" slide="ابدأ الآن">
            ابدأ الإنشاء
          </SlideButton>
        </div>
      </section>

      <PricingFooter />
    </main>
  )
}

/* ---------------------------------------------------------------------------
   No backticks inside this literal: one would end it.
--------------------------------------------------------------------------- */
const CSS = `
.zt-root {
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
  /* No bottom padding: the footer cap is flush with the end of the document. */
  padding: 0 var(--gut) 0;
  /* Arabic never takes negative tracking: the letterforms connect. */
  letter-spacing: 0;
}
/* One flat colour, nothing in it. */
.zt-root::before {
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

.zt-head {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 2rem 0 0;
  pointer-events: none;
}
.zt-pill, .zt-phone-pill { pointer-events: auto; }

.zt-phone-pill {
  width: fit-content; max-width: 100%;
  margin-inline: auto;
  overflow: hidden;
  border-radius: 22px;
  /* Glass, not a key: one flat translucent face, one hairline, over a ring of
     the ground. The light face is greyer and MORE transparent than the dark
     one, because light glass on #fafafa has almost nothing behind it. */
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
.zt-phone-pill[data-open] { transition-delay: 0s; }
@media (prefers-reduced-motion: reduce) { .zt-phone-pill { transition: none; } }
.zt-phone-bar {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; gap: 0.375rem;
  height: 44px; padding-inline: 0.375rem;
}
.zt-phone-mark { display: flex; align-items: center; justify-self: center; padding-inline: 0.375rem; }
.zt-mark-svg-sm { height: 16px; color: #000; }
.zt-round {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 0; background: transparent; cursor: pointer;
  border-radius: 999px; color: var(--obsidian); text-decoration: none;
  transition: background-color 150ms var(--ease-out);
}
.zt-round:hover { background: rgba(0, 0, 0, 0.05); }
.zt-account-phone { justify-self: end; }
.zt-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }

@media (min-width: 768px) { .zt-phone-pill { display: none; } }
@media (max-width: 767px) { .zt-pill { display: none; } }

.zt-pill {
  border-radius: 24px;
  overflow: hidden;
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
  .zt-pill, .zt-phone-pill {
    background: #f2f2f5;
    -webkit-backdrop-filter: none; backdrop-filter: none;
  }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .zt-pill, .zt-phone-pill { background: #f2f2f5; }
}
@media (prefers-reduced-motion: reduce) { .zt-pill { transition: none; } }

/* The deck's own measurements: 48px tall, pe-1.5 ps-3, nav items 10px 12px. */
.zt-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 48px;
  padding-inline-start: 0.75rem;
  padding-inline-end: 0.375rem;
}
.zt-side { display: flex; align-items: center; min-width: 0; }
.zt-side-start { justify-content: flex-start; }
.zt-side-end { justify-content: flex-end; }
.zt-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.zt-mark-svg { height: 17px; color: #000; }

/* ---- the header standing on a dark panel --------------------------------
   The deck's values: rgba(32,32,38,0.72) behind a 12% paper ring and a 4px
   ring of the ground itself, which is what makes the pill read as cut out of
   the screen rather than laid on top of it.
------------------------------------------------------------------------- */
.zt-head[data-dark] .zt-pill,
.zt-head[data-dark] .zt-phone-pill {
  background: rgba(32, 32, 38, 0.72);
  box-shadow:
    0 0 0 1px rgba(250, 250, 250, 0.12),
    0 0 0 4px rgba(19, 19, 22, 0.5);
}
/* Pure black is the rule on paper; on obsidian its counterpart is paper. */
.zt-head[data-dark] .zt-mark-svg,
.zt-head[data-dark] .zt-mark-svg-sm { color: #fafafa; }
.zt-head[data-dark] .zt-nav-item,
.zt-head[data-dark] .zt-tray-row,
.zt-head[data-dark] .zt-round { color: rgba(250, 250, 250, 0.66); }
.zt-head[data-dark] .zt-nav-item:hover,
.zt-head[data-dark] .zt-nav-item[data-current="true"],
.zt-head[data-dark] .zt-tray-row:hover,
.zt-head[data-dark] .zt-tray-row[data-current="true"] { color: #fafafa; }
.zt-head[data-dark] .zt-tray-row:hover,
.zt-head[data-dark] .zt-round:hover { background: rgba(250, 250, 250, 0.08); }
.zt-head[data-dark] .zt-sep { background: rgba(250, 250, 250, 0.16); }
.zt-head[data-dark] .zt-account { background: #fafafa; color: #171717; }
.zt-head[data-dark] .zt-account:hover { background: #fff; }

.zt-nav { display: flex; align-items: center; gap: 0.125rem; }
.zt-nav-item {
  border-radius: 999px;
  padding: 0.625rem 0.75rem;
  font-size: 14px;
  line-height: 1.24;
  white-space: nowrap;
  color: #666666;
  text-decoration: none;
  transition: color 150ms var(--ease-out);
}
.zt-nav-item:hover, .zt-nav-item[data-current="true"] { color: var(--obsidian); }
.zt-nav-item, .zt-tray-row, .zt-round, .zt-sep, .zt-account,
.zt-mark-svg, .zt-mark-svg-sm {
  transition: color 520ms var(--ease-out), background-color 520ms var(--ease-out);
}
/* The one separator the style allows: inside the header pill, before the
   account control. Nothing else on this page draws a line across anything. */
.zt-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0, 0, 0, 0.07); }
.zt-account {
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
.zt-account:hover { opacity: 0.86; }

/* 0fr to 1fr is the one way to transition to an auto height without hard
   coding a pixel the contents will outgrow. */
.zt-drawer {
  display: grid;
  transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms;
}
.zt-drawer[data-open] { transition-delay: 0s, 0s; }
@media (prefers-reduced-motion: reduce) { .zt-drawer { transition: none; } }
.zt-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zt-tray-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0 0.25rem; padding: 0.125rem 0.375rem 0.375rem;
}
.zt-tray-row {
  display: block; border-radius: 6px; padding: 0.5rem 0.75rem;
  font-size: 13.5px; line-height: 1.24; text-decoration: none; color: #666666;
  transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
.zt-tray-row:hover { background: rgba(0, 0, 0, 0.04); color: var(--obsidian); }
.zt-tray-row[data-current="true"] { color: var(--obsidian); }

/* ---- the lede ----------------------------------------------------------- */

.zt-lede { text-align: center; margin: clamp(2.5rem, 6vw, 4rem) auto clamp(2.5rem, 6vw, 3.75rem); max-width: 46rem; }
.zt-h1 {
  margin: 0;
  font-size: clamp(30px, 5vw, 52px);
  font-weight: 900;
  /* Arabic leading stays well above 1.24 so descenders are never clipped. */
  line-height: 1.36;
  letter-spacing: 0;
  color: var(--obsidian);
}
.zt-lede-sub {
  margin: 1.125rem auto 0; max-width: 36rem;
  font-size: 16px; font-weight: 500; line-height: 1.9; color: var(--stone);
}

/* ---- the eight, standing on the ground ----------------------------------
   THREE ACROSS, AND THE MEASUREMENT OVERTURNED THE GUESS. Each cover is a
   screenshot of an Arabic page, so the criterion is set before looking: a tile
   only does its job if the template's own hero type survives at tile size.
   Two across was the prediction. It lost.

   Rendered on this page at 1440 and measured (rendered px, under ZoomLock's
   0.85 zoom), then cropped at native resolution and compared 1:1:

     2 across -> cover 490x306   headline, sub-copy and buttons all legible
     3 across -> cover 318x199   headline crisp, sub-copy and buttons legible
     4 across -> cover 233x146   headline survives, everything else is texture

   Three is the smallest tile at which the cover still communicates, which is
   exactly the thing being chosen. Two clears the bar by a wide margin and
   costs the catalogue its shape: at two, an eight-item index becomes four
   screens of scrolling and stops reading as an index at all. Four is where the
   sub-copy and the button labels go, and a preview nobody can read is
   decoration.

   What is rejected, and why it is worth writing down: the last row is 3 + 3 + 2
   and therefore ragged. Squaring it by going to four costs legibility, which
   is the criterion; squaring it by spanning the last two tiles wider would be
   a bento layout, which is decoration this style refuses. A ragged final row
   is the cheapest of the three costs.
--------------------------------------------------------------------------- */

.zt-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2.4vw, 1.75rem);
  align-items: stretch;
  max-width: 1180px;
  margin: 0 auto;
}
.zt-tile {
  display: flex; flex-direction: column;
  overflow: hidden;
  border-radius: var(--r-card);
  background: var(--card);
  /* Elevation is stacked hairline rings, never a drop shadow. Cards are not
     keys: the six-layer recipe is scoped to what you press. */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 4px rgba(250, 250, 250, 0.55);
}
/* The cover. A fixed ratio because the eight screenshots do not share one
   (measured: 1.07 to 1.71), and cropping from the top is what keeps every
   template's own hero intact. The ground under it is obsidian rather than a
   grey, so a cover that fails to load reads as a deliberate dark plate and
   never as a broken image — there is no Unsplash fallback here on purpose. */
.zt-shot {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--onyx);
}
.zt-shot img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
  display: block;
  transform: scale(1.001);
  transition: transform 620ms var(--ease-out);
}
@media (hover: hover) {
  .zt-tile:hover .zt-shot img { transform: scale(1.03); }
}
@media (prefers-reduced-motion: reduce) {
  .zt-shot img, .zt-tile:hover .zt-shot img { transition: none; transform: none; }
}
/* The one flag on the catalogue, on the one template that carries the flag in
   lib/themes-en.ts. Glass over the shot rather than a filled chip, so it does
   not add a colour to a page whose colour budget belongs to the covers. */
.zt-flag {
  position: absolute; inset-block-start: 0.75rem; inset-inline-start: 0.75rem;
  border-radius: 999px; padding: 0.3125rem 0.6875rem;
  font-size: 11px; font-weight: 700; line-height: 1.4; letter-spacing: 0;
  color: #fafafa;
  background: rgba(32, 32, 38, 0.72);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.16);
}

.zt-body { display: flex; flex-direction: column; flex: 1; padding: 1.375rem 1.375rem 1.25rem; }
.zt-tag {
  margin: 0 0 0.5rem;
  font-size: 11.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0.06em; color: var(--stone);
}
.zt-name {
  margin: 0;
  font-size: clamp(18px, 1.7vw, 21px); font-weight: 900; line-height: 1.45;
  letter-spacing: 0; color: var(--obsidian);
}
.zt-meta {
  margin: 0.5rem 0 0;
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  font-size: 13px; font-weight: 500; line-height: 1.7; color: var(--stone);
}
.zt-dot { color: #b4b4bb; }
.zt-cta { display: block; margin-top: 1.125rem; max-width: 12rem; }

/* ---- the floor, on its own ground --------------------------------------- */

.zt-panel {
  max-width: 1180px;
  margin: clamp(3.5rem, 8vw, 6rem) auto 0;
  padding: clamp(2.25rem, 5vw, 3.5rem) clamp(1.25rem, 3.5vw, 3rem) clamp(2rem, 4vw, 3rem);
  border-radius: var(--r-panel);
  background: var(--onyx);
}
.zt-panel-head { text-align: center; margin-bottom: clamp(1.75rem, 4vw, 2.5rem); }
.zt-h2 {
  margin: 0; font-size: clamp(24px, 3.4vw, 36px); font-weight: 900;
  line-height: 1.36; letter-spacing: 0; color: var(--ground);
}
.zt-h2-sub { margin: 0.75rem 0 0; font-size: 15px; font-weight: 500; line-height: 1.85; color: #a8a8b2; }

.zt-floor {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(1.25rem, 3vw, 2.25rem);
}
.zt-floor-head {
  margin: 0 0 0.5rem;
  font-size: 15px; font-weight: 900; line-height: 1.55;
  letter-spacing: 0; color: var(--violet-lift);
}
.zt-floor-body { margin: 0; font-size: 13.5px; font-weight: 500; line-height: 1.85; color: #a8a8b2; }
.zt-panel-cta {
  display: flex; justify-content: center;
  margin-top: clamp(2rem, 4vw, 2.75rem);
}
.zt-panel-cta > * { max-width: 15rem; width: 100%; }

/* ---- arrival ------------------------------------------------------------
   The hidden half applies only under .zt-js, which the script adds on mount,
   so a browser that never runs it reads a finished page.
------------------------------------------------------------------------- */
.zt-js [data-reveal] { opacity: 0; transform: translateY(18px); }
.zt-js [data-reveal][data-in] {
  opacity: 1; transform: none;
  transition:
    opacity 640ms var(--ease-out) calc(var(--i, 0) * 70ms),
    transform 640ms var(--ease-out) calc(var(--i, 0) * 70ms);
}
@media (prefers-reduced-motion: reduce) {
  .zt-js [data-reveal] { opacity: 1; transform: none; transition: none; }
}

/* ---- narrow ------------------------------------------------------------- */

/* The deck's cards need a definite width to stack against. */
.zt-swipe { margin-inline: auto; }

/* Below about 1060 the third column takes the cover under the 4-across
   measurement above, so the grid drops to two before it drops to a deck. */
@media (max-width: 1060px) {
  .zt-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 800px; }
}
@media (max-width: 980px) {
  .zt-floor { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  /* Inside the deck a tile is one card: it must not also be a grid item. */
  .zt-tile { height: 100%; }
}
@media (max-width: 560px) {
  .zt-root { --r-panel: 20px; }
  .zt-floor { grid-template-columns: minmax(0, 1fr); }
  .zt-body { padding: 1.125rem 1.125rem 1rem; }
}
`
