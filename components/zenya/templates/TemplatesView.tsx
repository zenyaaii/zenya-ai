"use client"

/**
 * The candidate templates page. See page.tsx for why this route exists and for
 * the design read.
 *
 * THE COMPOSITION IS TWO MOVEMENTS, the same shape as /demo/pricing: the eight
 * stand directly on the ground, because the catalogue IS the page rather than
 * one item on it, and the floor sits inside a dark panel, because it is a
 * different kind of claim. The tiles are what you choose between, the panel is
 * what is true whichever you choose.
 *
 * WHAT THE FIRST BUILD GOT WRONG, all three measured on the live page at 1440
 * before anything here was rewritten:
 *
 *   1. THE DARK PANEL AND THE FOOTER CAP WERE 96px APART. Both obsidian, one
 *      above the other, with a white stripe between them: the last 44% of the
 *      document read as one dark object interrupted by a printing fault. The
 *      old docstring argued that two dark objects are a pattern rather than an
 *      accident, and that is true at a distance and false at 96px. The panel
 *      now carries its own bottom margin so a full band of paper separates the
 *      two, and .zf's own clamp(3.5rem, 8vw, 6rem) is no longer the only gap.
 *
 *   2. THE PANEL WAS A SLAB SIZED FOR SOMETHING BIGGER. Four short columns
 *      centred inside 1003x368, with the rest of it padding. It is a
 *      two-column asymmetric block now — the claim and its call on the start
 *      side, the four facts as a 2x2 on the end side — and 241 tall instead
 *      of 368.
 *
 *      A NOTE ON THE MEASUREMENT, because the obvious number is a trap. Text
 *      density, taken as the union of every text run's client rects over the
 *      section's area, went 8.9% -> 14.3%. That reads like the diagnosis and
 *      it is not one: the same measure on /demo/pricing's comparison, the
 *      dark section on this site that genuinely earns its ground, is 5.9%,
 *      and on the shared footer cap it is 2.2%. Both look fine. So density
 *      alone never explained the fault, and a density target set without
 *      measuring those two first would have been invented. What was actually
 *      wrong is (1) above and the centred four-column layout. Do not tune
 *      this panel against a percentage.
 *
 *   3. THE TILES SPENT 45% OF THEIR HEIGHT ON A PLATE THAT WAS 26% INK, and
 *      the biggest thing on that plate was an outlined button repeated eight
 *      times inside tiles that were already entirely a link to the same URL.
 *      Eight identical buttons is the chrome competing with the covers, which
 *      is the one thing this page's design read forbids. The plate is three
 *      tight lines now and the whole card is the link.
 *
 * THE GRID IS 2 THEN 3, AND IT COMES OUT OF THE OLD MEASUREMENT RATHER THAN
 * OVER IT. Tile scale was chosen on legibility, criterion written down first:
 * a tile only works if the template's own Arabic hero type survives at tile
 * size. Rendered at 1440 and cropped 1:1 (rendered px, under ZoomLock's 0.85):
 *
 *     2 across -> cover 490x306   headline, sub-copy and buttons all legible
 *     3 across -> cover 318x199   headline crisp, sub-copy and buttons legible
 *     4 across -> cover 233x146   headline survives, everything else texture
 *
 * That test names two good sizes, not one. So the first two templates in the
 * catalogue's own order lead at 2-across, where everything in the cover reads,
 * and the remaining six run 3 and 3 beneath them. Eight lands square, the
 * ragged 3+3+2 final row is gone, and the page changes pace once instead of
 * repeating one row three times. The lead pair is the first two in the array,
 * so nothing is re-sorted and no template is ranked.
 *
 * The mechanic is a SIX-column grid: a 3-across tile spans 2 and a 2-across
 * tile spans 3. One track system, so the two sizes cannot drift apart, and the
 * narrow breakpoints collapse it by changing the span rather than the grid.
 *
 * THE DARK PANEL IS ادر'S INVERSION, deliberately the same values as the
 * pricing page's comparison: #131316 with #97a0ee for type, because the flat
 * primary falls under 4.5:1 on that ground.
 *
 * THE HEADER IS THE SIBLING'S, MECHANIC AND ALL. Sticky so there is something
 * behind it to reflect, a 1fr auto 1fr grid so the words hold the middle while
 * the pill grows, the compact 184px pill on phones, and the deck's inverted
 * glass over dark grounds.
 *
 * WHY THE OBSERVER BELOW READS .zf. The footer's element is .zf; .zf-inner was
 * never anything. /demo/pricing asked for the latter and therefore never
 * observed its own footer, so its pill stayed light glass standing on the
 * obsidian cap. Reproduced at the true bottom before the fix, at 1440x620 and
 * at 390x844: footer behind the pill, data-dark unset, pill still
 * rgba(238,238,243,0.60). It does not reproduce at 1440x900, because ZoomLock
 * caps real scroll there before the footer ever reaches the header — which is
 * why it survived review, and why the dark pill visible at that size comes
 * from .zp-compare rather than from the footer.
 *
 * FIXED on the sibling in the same change as this rewrite. Both pages now
 * watch the class the markup actually carries.
 *
 * MOTION IS ON ARRIVAL ONLY, and every resting state is the finished state. The
 * hidden half of each reveal is applied by a class the script adds on mount, so
 * a browser that never runs it reads a finished page. The observer is rebuilt
 * when the layout swaps: it collects its targets once, and the grid's tiles and
 * the deck's are different elements — that exact trap left a whole plan deck at
 * opacity 0 on the sibling.
 */

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Menu, X } from "lucide-react"
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
 *
 * The order is load-bearing now: the first two lead the grid at 2-across. It
 * is the array's existing order, not a ranking.
 *
 * `build` IS READ PER TEMPLATE, NEVER CONSTRUCTED. Seven of the eight are
 * /theme/new/<id>, and one_product is /build — a different route entirely.
 * Deriving the href from the id would have sent the first tile somewhere that
 * does not exist.
 *
 * `candidate` IS THE IN-SET DESTINATION, and it is a separate field on
 * purpose. `build` stays the real route this template's builder lives at, so
 * that field cannot quietly become a lie; `candidate` says "there is a
 * reviewable version of that inside the candidate set, send the reader there
 * instead". Only restaurant has one. The rule it serves is the one already
 * recorded twice on this page: links inside the candidate set point inside the
 * candidate set, never out to the live site mid-review.
 *
 * `soon` MIRRORS WHAT THE LIVE CATALOGUE ACTUALLY SHOWS THE PUBLIC. The
 * one-product builder is being rebuilt: app/(main)/themes/page.tsx gates it on
 * "theme.id === 'one_product' && isAdmin !== true" and renders قريبًا for
 * everyone else, with /build reachable by admins only. This page has no auth
 * and is public, so that tile gets the قريبًا state and no build link. A violet
 * button onto a builder the reader cannot use would be the same class of lie
 * as an Unsplash cover standing in for a template.
 */
const TEMPLATES = [
  { id: "one_product", label: "متجر",   name: "متجر بمنتج واحد",           tagline: "متجر شوبيفاي · منتج واحد", sections: 24, presets: 3, demo: "/demo",            build: "/build",                  shopify: true, soon: true },
  { id: "restaurant",  label: "مطعم",   name: "موقع مطعم",                 tagline: "مطعم · قائمة · حجوزات",    sections: 13, presets: 4, demo: "/demo/restaurant", build: "/theme/new/restaurant", candidate: "/build" },
  { id: "atlas",       label: "تطبيق",  name: "صفحة هبوط لتطبيق",          tagline: "تطبيق · برمجيات · B2B",    sections: 12, presets: 4, demo: "/demo/atlas",      build: "/theme/new/atlas" },
  { id: "lookbook",    label: "أزياء",  name: "موقع أزياء ولوك بوك",       tagline: "أزياء · ملابس · علامة",    sections: 11, presets: 4, demo: "/demo/lookbook",   build: "/theme/new/lookbook" },
  { id: "collective",  label: "تشكيلة", name: "متجر بمنتجات متعددة",       tagline: "كتالوج · منتجات متعددة",   sections: 10, presets: 4, demo: "/demo/collective", build: "/theme/new/collective" },
  { id: "studio",      label: "ستوديو", name: "موقع علامة تجارية وقصة",    tagline: "قصة علامة · تحرير",        sections: 12, presets: 4, demo: "/demo/studio",     build: "/theme/new/studio" },
  { id: "services",    label: "خدمات",  name: "موقع خدمات",                tagline: "خدمات محلية · حِرف",       sections: 13, presets: 4, demo: "/demo/services",   build: "/theme/new/services" },
  { id: "wellness",    label: "عافية",  name: "موقع مركز عافية",           tagline: "سبا · يوغا · عافية",       sections: 12, presets: 3, demo: "/demo/wellness",   build: "/theme/new/wellness" },
] as const

/* How many tiles lead the grid at 2-across. Two, because eight minus two is
   six and six divides by three: the ragged final row exists or does not exist
   on this one number. */
const LEAD = 2

/**
 * The lede's three totals, summed from the array above rather than typed out,
 * so they cannot drift when a template's counts change. They are the only
 * numbers on the page that are not already on a tile, and they are arithmetic
 * on real data, not a claim.
 */
const TOTAL_SECTIONS = TEMPLATES.reduce((n, t) => n + t.sections, 0)
const TOTAL_PRESETS = TEMPLATES.reduce((n, t) => n + t.presets, 0)

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
  { href: "/themes", label: "القوالب", tray: true, current: true },
  { href: "/pricing", label: "الأسعار" },
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

  /**
   * One tile, so the grid and the deck cannot drift apart.
   *
   * `lead` is the 2-across size, and it is a data attribute rather than a
   * second component: the two sizes differ by a column span and two type
   * steps, and everything else about them has to stay identical or the grid
   * stops reading as one set of things.
   *
   * THE WHOLE CARD IS ONE LINK, AND EXACTLY ONE TAB STOP. The cover is inert
   * and the name carries the href; the name's ::after is stretched over the
   * card, so a pointer can press anywhere and a keyboard gets one focusable
   * element with the template's own name as its accessible name. The previous
   * build had two links per tile to the same URL, which is sixteen tab stops
   * for eight destinations.
   */
  const tile = (t: (typeof TEMPLATES)[number], i: number) => (
    <article
      key={t.id}
      className="zt-tile"
      data-lead={i < LEAD ? "true" : undefined}
      data-reveal
      style={{ ["--i" as string]: String(i) }}
    >
      {/* The cover is the tile's whole top. object-position: top keeps every
          template's own hero intact, which matters because the eight
          screenshots do not share an aspect ratio (measured: 1.07 to 1.71). */}
      <div className="zt-shot">
        {/* A plain img, deliberately, and the same choice every other
            theme-cover surface makes: themePreview() returns the resolver route
            /api/theme-preview/<id>, which 302s to whichever file is on disk.
            next/image would have to be pointed at the redirect target, which is
            the thing the resolver exists to keep out of the components. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={themePreview(t.id)} alt={"معاينة قالب " + t.name} loading="lazy" decoding="async" />
        {/* The screenshots are not all dark at the top: atlas, studio and
            lookbook open on near-white, and against a white card they lose
            their own top edge. A hairline drawn OVER the image gives every
            cover the same definite boundary. It has to be a pseudo-element:
            an inset shadow on the box sits under the img that fills it. */}
        <span className="zt-edge" aria-hidden />
        {/* The "in" guard, not a bare t.shopify: `as const` makes TEMPLATES a
            union in which only the one Shopify entry carries the key at all.
            Same idiom the sibling uses for its optional badge. */}
        {"shopify" in t && t.shopify ? <span className="zt-flag">شوبيفاي</span> : null}
      </div>

      <div className="zt-body">
        <p className="zt-tag">{t.tagline}</p>
        {/* RTL: forward is left, so the arrow follows the name rather than
            leading it. It sits NEXT TO the name and not at the far end of the
            row: pushed to the edge by space-between it was 200px of empty
            plate away from the word it belongs to and read as a stray glyph. */}
        <h3 className="zt-name">
          <Link href={t.demo} className="zt-name-link">{t.name}</Link>
          <ArrowLeft className="zt-arrow" size={16} strokeWidth={1.75} aria-hidden />
        </h3>
        {/* Real counts on the start, the build control on the end. One row, so
            the action costs the plate a line of height rather than a band. */}
        <div className="zt-foot">
          <p className="zt-meta">
            <span>{t.sections} قسمًا</span>
            <span className="zt-dot" aria-hidden>·</span>
            <span>{t.presets} أنماط جاهزة</span>
          </p>

          {/* THE BUILD CONTROL MUST BE RAISED ABOVE THE STRETCHED LINK.
              .zt-name-link::after covers the whole card so the tile is
              clickable anywhere; without a stacking context of its own this
              button sits UNDER that overlay and every press opens the preview
              instead. .zt-act carries position/z-index for exactly that. */}
          <span className="zt-act">
            {"soon" in t && t.soon ? (
              /* What the live catalogue shows the public for this one. Not a
                 button: there is nothing behind it to press. */
              <span className="zt-soon" title="نعمل على نسخة جديدة كليًا — قريبًا">
                قريبًا
              </span>
            ) : (
              /* SlideButton takes no aria-label — it builds the accessible
                 name from children, into its own visually-hidden .sb-a11y
                 copy. Left as bare "ابنِ" that is eight links with identical
                 names in one list, so the template rides along hidden: the
                 visible face still reads ابنِ, the name reads ابنِ بقالب مطعم.
                 Same shape as the live catalogue's aria-label. */
              <SlideButton href={"candidate" in t ? t.candidate : t.build} variant="violet" slide="هيا بنا" className="zt-build">
                ابنِ<span className="sr-only">{" بقالب " + t.label}</span>
              </SlideButton>
            )}
          </span>
        </div>
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
            <Link href="/" aria-label="زينيا" className="zt-phone-mark">
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
              <Link href="/" className="zt-mark" aria-label="زينيا" onMouseEnter={() => setTrayOpen(false)}>
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

      {/* THE LEDE IS NOT CENTRED. A centred display line over a centred subline
          is the safest possible opening and it made the catalogue read as a
          brochure; start-aligned, it hangs off the same edge as the grid below
          it, so the two share one margin and the page has a spine. The totals
          take the far end of the same row: real arithmetic on the array, and
          the one place on the page that states the size of the catalogue. */}
      <div className="zt-lede" data-reveal>
        <div className="zt-lede-say">
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
        {/* "107 قسمًا" on its own reads as a count PER template, which would
            be a false claim: it is the sum across all eight. The caption is
            what makes the three numbers honest, and it costs one line. */}
        <div className="zt-tally">
          <p className="zt-tally-cap">في المجموع</p>
          <dl className="zt-tally-row">
            <div className="zt-tally-item">
              <dt>قوالب</dt>
              <dd>{TEMPLATES.length}</dd>
            </div>
            <div className="zt-tally-item">
              <dt>أقسام</dt>
              <dd>{TOTAL_SECTIONS}</dd>
            </div>
            <div className="zt-tally-item">
              <dt>أنماط جاهزة</dt>
              <dd>{TOTAL_PRESETS}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* The tiles stand on the ground. They are the page, not an item on it.
          ONE TILE, TWO LAYOUTS. Wide, they are a contact sheet with a lead
          pair. On a phone a grid of eight becomes eight postage stamps stacked
          into a very long scroll, so they are a deck: one card in front, its
          neighbours visibly behind it, and a finger between them. */}
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

      {/* The floor, on its own ground. What is true whichever tile you pick.
          Two columns, uneven: the claim and its call on the start side, the
          four facts as a 2x2 on the end side. Centring all of it inside a slab
          is what left the first build at 8.9% ink. */}
      <section className="zt-panel" aria-labelledby="zt-panel-h" data-reveal>
        <div className="zt-panel-grid">
          <div className="zt-panel-say">
            <h2 id="zt-panel-h" className="zt-h2">في كل قالب</h2>
            <p className="zt-h2-sub">الاختلاف في الشكل، لا في ما تحصل عليه.</p>
            <div className="zt-panel-cta">
              <SlideButton href="/build" variant="violet" slide="ابدأ الآن">
                ابدأ الإنشاء
              </SlideButton>
            </div>
          </div>

          <div className="zt-floor">
            {FLOOR.map((f, i) => (
              <div key={f.head} className="zt-floor-item" data-reveal style={{ ["--i" as string]: String(i) }}>
                <h3 className="zt-floor-head">{f.head}</h3>
                <p className="zt-floor-body">{f.body}</p>
              </div>
            ))}
          </div>
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
  /* The card's internal margin. The cover and every line of type hang off it,
     which is the whole reason the plate looks aligned rather than inset. */
  --inset: 10px;

  /* The measure everything on this page hangs off. The lede, the grid and the
     panel all take it, which is what gives the composition one spine. */
  --page: 1180px;

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
  font-size: 14.5px;
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
  font-size: 14.5px;
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
  font-size: 14.5px; line-height: 1.24; text-decoration: none; color: #666666;
  transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
.zt-tray-row:hover { background: rgba(0, 0, 0, 0.04); color: var(--obsidian); }
.zt-tray-row[data-current="true"] { color: var(--obsidian); }

/* ---- the lede -----------------------------------------------------------
   Start-aligned, on the grid's own edge, with the totals at the far end of the
   same row. The baseline rule is what makes the row read as one line of
   information rather than two blocks that happen to be adjacent: the tally's
   first row sits on the h1's first baseline.
------------------------------------------------------------------------- */

.zt-lede {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  /* Top-aligned, not bottom. Bottom-aligned put the totals under the subline
     with the whole end-top corner empty above them, which stranded them in the
     middle of the page. Against the top they answer the display line. */
  align-items: start;
  gap: clamp(1.5rem, 4vw, 3.5rem);
  max-width: var(--page);
  margin: clamp(3rem, 7vw, 5rem) auto clamp(2.5rem, 5vw, 3.5rem);
}
.zt-h1 {
  margin: 0;
  font-size: clamp(30px, 4.4vw, 50px);
  font-weight: 900;
  /* Arabic leading stays well above 1.24 so descenders are never clipped. */
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--obsidian);
}
.zt-lede-sub {
  margin: 1.125rem 0 0; max-width: 40ch;
  font-size: 16px; font-weight: 500; line-height: 1.9; color: var(--stone);
}
/* Three totals, summed from the array. Tabular figures so the three numbers
   sit on one optical grid instead of three different widths, and the number
   above its own label so the row scans as figures rather than as a sentence. */
.zt-tally { padding-top: 0.625rem; }
.zt-tally-cap {
  margin: 0 0 0.875rem;
  /* Arabic: no tracking (it measured 0.69px and Arabic letterforms join), and
     11.5px is 9.78 rendered against a 12 floor. */
  font-size: 14.5px; font-weight: 700; line-height: 1.5;
  color: var(--stone, #666666);
}
.zt-tally-row {
  display: flex; align-items: flex-start; gap: clamp(1.25rem, 2.6vw, 2.25rem);
  margin: 0; padding: 0;
}
.zt-tally-item { display: flex; flex-direction: column; gap: 0.1875rem; }
.zt-tally dt {
  order: 2;
  font-size: 14.5px; font-weight: 500; line-height: 1.6;
  letter-spacing: 0; color: var(--stone);
}
.zt-tally dd {
  order: 1; margin: 0;
  font-size: clamp(26px, 2.4vw, 32px); font-weight: 900; line-height: 1.24;
  color: var(--obsidian);
  font-variant-numeric: tabular-nums;
}

/* ---- the eight, standing on the ground ----------------------------------
   SIX TRACKS, TWO SPANS. A lead tile spans 3 of 6 (two across), the rest span
   2 of 6 (three across). One track system rather than two grids, so the two
   sizes share a gutter and cannot drift apart.

   The scale is the old measurement, used rather than replaced. Rendered on
   this page at 1440 (rendered px, under ZoomLock's 0.85 zoom), cropped at
   native resolution and compared 1:1:

     2 across -> cover 490x306   headline, sub-copy and buttons all legible
     3 across -> cover 318x199   headline crisp, sub-copy and buttons legible
     4 across -> cover 233x146   headline survives, everything else is texture

   The test names TWO good sizes. The first build picked one of them and paid
   for it with a ragged 3 + 3 + 2 final row, which it accepted as the cheapest
   of three costs. Using both sizes is cheaper still: eight is 2 + 3 + 3, the
   last row is square, and the page changes pace once. Four across is still
   rejected, on the same evidence as before — a preview nobody can read is
   decoration.
--------------------------------------------------------------------------- */

.zt-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(1rem, 2.2vw, 1.75rem);
  align-items: stretch;
  max-width: var(--page);
  margin: 0 auto;
}
.zt-tile { grid-column: span 2; }
.zt-tile[data-lead] { grid-column: span 3; }

.zt-tile {
  position: relative;
  display: flex; flex-direction: column;
  border-radius: var(--r-card);
  background: var(--card);
  /* Elevation is stacked hairline rings, never a drop shadow. Cards are not
     keys: the six-layer recipe is scoped to what you press. The ring firms up
     on hover instead of the card lifting, because nothing on this page floats. */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 4px rgba(250, 250, 250, 0.55);
  transition: box-shadow 320ms var(--ease-out);
}
@media (hover: hover) {
  /* The violet arrives on the ring only while the card is pointed at, so the
     resting page keeps its colour budget on the covers. */
  .zt-tile:hover { box-shadow: 0 0 0 1px rgba(94, 106, 210, 0.42), 0 0 0 4px rgba(250, 250, 250, 0.55); }
}
.zt-tile:focus-within { box-shadow: 0 0 0 1px rgba(94, 106, 210, 0.42), 0 0 0 4px rgba(250, 250, 250, 0.55); }
/* The cover. A fixed ratio because the eight screenshots do not share one
   (measured: 1.07 to 1.71), and cropping from the top is what keeps every
   template's own hero intact. The ground under it is obsidian rather than a
   grey, so a cover that fails to load reads as a deliberate dark plate and
   never as a broken image — there is no Unsplash fallback here on purpose. */
/* ONE INSET, AND EVERYTHING INSIDE THE CARD HANGS OFF IT. The cover is framed
   rather than flush, decided by rendering both at 1:1 and looking:

     flush  - the screenshot runs into the card's own top corners, so it reads
              as the card's lid, and the type below it is inset from an edge
              the image ignores. At lead size that misalignment is plain.
     inset  - the cover is an object ON the card, its edge is defined on all
              four sides (which the pale-topped covers need), and the type's
              edge lines up with the cover's.

   It costs cover width: 301 at 3-across rather than 318. That is still inside
   the legible band the scale was chosen from, well clear of the 233 at which
   the Arabic collapses to texture, and re-cropped 1:1 to confirm it. */
.zt-shot {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--onyx);
  margin: var(--inset) var(--inset) 0;
  border-radius: var(--r-control);
}
.zt-shot img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
  display: block;
  transform: scale(1.001);
  transition: transform 620ms var(--ease-out);
}
/* Drawn over the image, so the pale-topped covers keep a definite edge. */
.zt-edge {
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.10);
  pointer-events: none;
}
@media (hover: hover) {
  .zt-tile:hover .zt-shot img { transform: scale(1.035); }
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
  font-size: 14.5px; font-weight: 700; line-height: 1.4; letter-spacing: 0;
  color: #fafafa;
  background: rgba(32, 32, 38, 0.72);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.16);
}

/* ---- the corner mark ----------------------------------------------------
   A violet bracket on two opposite corners of every tile, drawn on the card's
   own radius so it reads as part of the corner rather than a sticker on one,
   and opening on hover. Two corners rather than four, because a full frame is
   a border and the ring token is already the border.

   It is the one piece of chrome on this page that carries colour at rest, and
   that is a real cost against the page's design read — the eight screenshots
   were meant to be the only colour in the room. It is here because it was
   asked for, and it is kept to a hairline on two corners so it marks the card
   without competing with what is inside it.
------------------------------------------------------------------------- */
.zt-tile::before, .zt-tile::after {
  content: "";
  position: absolute;
  width: 24px; height: 24px;
  pointer-events: none;
  z-index: 2;
  border-color: var(--violet);
  border-style: solid;
  border-width: 0;
  opacity: 0.5;
  transition: opacity 320ms var(--ease-out), width 320ms var(--ease-out), height 320ms var(--ease-out);
}
.zt-tile::before {
  inset-block-start: -1px; inset-inline-start: -1px;
  border-block-start-width: 2px; border-inline-start-width: 2px;
  border-start-start-radius: var(--r-card);
}
.zt-tile::after {
  inset-block-end: -1px; inset-inline-end: -1px;
  border-block-end-width: 2px; border-inline-end-width: 2px;
  border-end-end-radius: var(--r-card);
}
@media (hover: hover) {
  .zt-tile:hover::before, .zt-tile:hover::after { opacity: 1; width: 32px; height: 32px; }
}
.zt-tile:focus-within::before, .zt-tile:focus-within::after { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .zt-tile::before, .zt-tile::after { transition: none; }
}

/* Three tight lines, not four stacked bands with a button under them. */
.zt-body {
  display: flex; flex-direction: column;
  padding: 0.8125rem var(--inset) 0.9375rem;
}
.zt-tag {
  margin: 0;
  /* Same as .zt-tally-cap: Arabic takes no tracking, and the floor is 14.2. */
  font-size: 14.5px; font-weight: 700; line-height: 1.5;
  color: var(--stone, #666666);
}
.zt-name {
  display: flex; align-items: center; gap: 0.4375rem;
  margin: 0.3125rem 0 0; min-width: 0;
  font-size: 18px; font-weight: 900; line-height: 1.45;
  letter-spacing: 0; color: var(--obsidian);
}
.zt-tile[data-lead] .zt-name { font-size: clamp(19px, 1.6vw, 22px); }
.zt-name-link { color: inherit; text-decoration: none; }
/* The whole card, from one link. One tab stop per tile, named by the template. */
.zt-name-link::after {
  content: "";
  position: absolute; inset: 0;
  border-radius: var(--r-card);
}
.zt-name-link:focus-visible::after {
  outline: 2px solid var(--violet);
  outline-offset: 3px;
}
.zt-arrow {
  flex: 0 0 auto; color: #b4b4bb;
  transition: transform 320ms var(--ease-out), color 320ms var(--ease-out);
}
@media (hover: hover) {
  .zt-tile:hover .zt-arrow { transform: translateX(-4px); color: var(--obsidian); }
}
@media (prefers-reduced-motion: reduce) {
  .zt-arrow, .zt-tile:hover .zt-arrow { transition: none; transform: none; }
}
/* Counts on the start, the build control on the end, on one baseline. */
.zt-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.625rem; margin-top: 0.4375rem;
}
.zt-meta {
  margin: 0; min-width: 0;
  display: flex; align-items: center; gap: 0.4375rem; flex-wrap: wrap;
  font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone);
}
/* A separator between two labels is still text. #b4b4bb measured 2.06:1. */
.zt-dot { color: #6e6e78; }

/* ---- the build control -------------------------------------------------
   THE ONE PIECE OF COLOUR THE CHROME IS ALLOWED. The page's design read is
   that the eight screenshots are the only colour in the room, and eight
   violet controls are a real cost against it — they are here because the
   owner asked for them. So the accent is spent on the ACTION and nowhere
   else: no violet text, no violet borders on the cards at rest, no tinted
   eyebrows. The card picks up a violet ring only while it is being pointed
   at, which is a state, not a decoration.

   RAISED ABOVE THE STRETCHED LINK. .zt-name-link::after covers the card, so
   without this the button is under the overlay and every press opens the
   preview instead of the builder. Verified by clicking rather than by
   reading: elementFromPoint at the button's centre returns .sb-face, a real
   press lands on /theme/new/atlas, and a press anywhere else on the plate or
   the cover still lands on /demo/atlas.

   WHAT IT COSTS, measured at 1440: the cover's share of a 3-across tile goes
   66.5% -> 63.6% and the tile grows 283 -> 296. The plate is still the
   smaller half, but this is the second-largest thing on it after the name,
   and on a page whose whole argument is that the screenshots do the talking
   that is a real trade rather than a free addition.
------------------------------------------------------------------------- */
.zt-act { position: relative; z-index: 1; flex: 0 0 auto; }

/* A local scale-down of the shared button. The component is width:100% at
   14px with a 2.75em window, which is a page-level CTA; in a tile it has to
   sit on the same line as a 12.5px count without becoming the loudest thing
   on the card. Nothing about SlideButton itself changes. */
.zt-build.sb {
  --sb-win: 2.1em;
  width: auto;
  /* The tile's button was shrunk to sit on one line with a small count, which
     took it to 28.3 rendered against a 32 floor and its label to 11.05
     against a 12 one. It keeps the tighter side padding and gets the height
     back. */
  min-height: 38px;
  padding: 0.1875rem 0.875rem;
  font-size: 14.5px;
}
.zt-tile[data-lead] .zt-build.sb { font-size: 14.5px; padding: 0.25rem 1rem; }

/* The one that has no builder to open. Quiet, not violet: nothing to press. */
.zt-soon {
  display: inline-flex; align-items: center;
  border-radius: var(--r-control);
  padding: 0.4375rem 0.75rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.35;
  color: var(--stone);
  background: rgba(17, 17, 17, 0.04);
  box-shadow: 0 0 0 1px rgba(17, 17, 17, 0.07);
}

/* ---- the floor, on its own ground ---------------------------------------
   TWO COLUMNS, UNEVEN, AND A BAND OF PAPER UNDER IT. The margin-bottom is not
   taste: .zf carries margin-top clamp(3.5rem, 8vw, 6rem), which is 96 CSS px,
   and two obsidian objects 96px apart read as one object with a fault through
   it rather than as two claims.

   THE MARGIN DOES NOT ADD TO .zf'S, IT REPLACES IT. The panel and the footer
   are adjacent siblings, so their vertical margins COLLAPSE to the larger of
   the two — the first build of this rule set 10rem here, measured the gap, and
   got 158 CSS px rather than the 256 it expected. The number below is
   therefore the WHOLE gap, not an addition to one. Measured after: 237 CSS px.

   It is deliberately wider than the 96px above the panel. The panel is about
   the eight, so it belongs to the catalogue; the footer is site chrome and
   belongs to nothing on this page.
------------------------------------------------------------------------- */

.zt-panel {
  max-width: var(--page);
  margin: clamp(3.5rem, 8vw, 6rem) auto clamp(7rem, 17vw, 15rem);
  padding: clamp(2rem, 4vw, 3rem) clamp(1.5rem, 3vw, 2.75rem);
  border-radius: var(--r-panel);
  background: var(--onyx);
}
.zt-panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.5fr);
  gap: clamp(1.75rem, 4vw, 3.25rem);
  align-items: start;
}
.zt-h2 {
  margin: 0; font-size: clamp(24px, 3vw, 34px); font-weight: 900;
  line-height: 1.32; letter-spacing: 0; color: var(--ground);
}
.zt-h2-sub { margin: 0.75rem 0 0; font-size: 15px; font-weight: 500; line-height: 1.8; color: #a8a8b2; }
.zt-panel-cta { margin-top: clamp(1.25rem, 2.5vw, 1.75rem); max-width: 15rem; }

.zt-floor {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.25rem, 2.6vw, 1.875rem) clamp(1.5rem, 3vw, 2.5rem);
}
.zt-floor-head {
  margin: 0 0 0.375rem;
  font-size: 15px; font-weight: 900; line-height: 1.5;
  letter-spacing: 0; color: var(--violet-lift);
}
.zt-floor-body { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.8; color: #a8a8b2; }

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

@media (max-width: 1180px) {
  .zt-lede { grid-template-columns: minmax(0, 1fr); align-items: start; }
  .zt-tally { justify-content: flex-start; }
}
/* Below about 1060 a 3-across tile takes the cover under the 4-across
   measurement above, so every tile goes to two across before it goes to a
   deck: spans change, the six tracks do not. */
@media (max-width: 1060px) {
  .zt-tile, .zt-tile[data-lead] { grid-column: span 3; }
  .zt-grid { max-width: 820px; }
}
@media (max-width: 980px) {
  .zt-panel-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 760px) {
  /* Inside the deck a tile is one card: it must not also be a grid item. */
  .zt-tile { height: 100%; }
}
@media (max-width: 560px) {
  .zt-root { --r-panel: 20px; }
  .zt-floor { grid-template-columns: minmax(0, 1fr); }
  .zt-body { padding: 0.6875rem var(--inset) 0.8125rem; }
  /* Under ~560 the count and the button stop fitting one line together. */
  .zt-foot { flex-wrap: wrap; gap: 0.5rem 0.625rem; }
}

/* ---------------------------------------------------------------------------
   TARGET FLOOR.

   Every control here has to measure at least 32 RENDERED pixels on both axes.
   components/ZoomLock.tsx writes zoom: 0.85 on the document element always,
   so a length authored in CSS reaches the screen at 85 per cent of itself:
   the CSS floor is 38, not 32. Measured before this block, at 360 to 1440:
   .zt-phone-mark 88.2x16, .zt-mark 93x17, .zt-name-link 103.6x26.1.

   Inline links inside a sentence are deliberately not here - WCAG 2.5.8
   exempts them, and enforcing a target on one would mean setting a 32px line
   height on every paragraph that contains a link.
--------------------------------------------------------------------------- */
.zt-round {
  min-width: 38px;
  min-height: 38px;
}
.zt-phone-mark,
.zt-mark,
.zt-account,
.zt-account-phone,
.zt-nav-item,
.zt-tray-row,
.zt-name-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
}

`
