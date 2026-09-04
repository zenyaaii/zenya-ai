"use client"

/**
 * Candidate homepage - a five panel deck. A floating pill header over bare
 * paper, the three words, then one word per screen.
 *
 * The light running behind the panels is DeckLine, a single fixed canvas for
 * the whole deck rather than one canvas per panel. See that file for why: a
 * per-panel field cannot be made continuous, and the break between screens
 * was the visible cost of trying.
 *
 * NOT the homepage. It ships as a standalone route at /demo/home so it can be
 * reviewed on the real domain; app/(main)/page.tsx remains the homepage and is
 * untouched. Do not wire this into `/`. If it is ever promoted, move the file
 * to app/(main)/page.tsx and restore the nav/footer/consent hiding that the
 * (main) layout needs.
 *
 * Visual language: the Vercel design system per the reference — "typeset
 * terminal on white paper". Light canvas (#fafafa), near-black type (#171717,
 * never pure #000), strict grey ramp, hairline rings instead of shadows,
 * 0% colorfulness.
 *
 * Display type is Almarai 800: a geometric Kufi-influenced Arabic with flat
 * terminals and square dots, matching the reference image supplied for the
 * three words. This is a deliberate break from the Vercel spec, which caps
 * headline weight at 450 — the heavy setting was specifically asked for.
 *
 * Two further departures, both because the type is Arabic:
 *   - no negative letter-spacing (the reference asks for -0.06em at display
 *     sizes; Arabic letterforms connect and break apart when tracked in)
 *   - leading stays above 1.0 so descenders are not clipped
 *
 * Header layout splits at md (768px), so tablets get the full laptop bar and
 * only phones fall back to the three-slot arrangement.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Almarai, IBM_Plex_Sans_Arabic } from "next/font/google"
import { Menu, X } from "lucide-react"
import ZenyaMark from "@/components/ZenyaMark"
import DeckLine, { type DeckStop } from "@/components/marketing/DeckLine"
import { createClient } from "@/utils/supabase/client"
import { dashboardUrl, accountsUrl } from "@/lib/portal-urls"

/* Display face for the three words — heavy, geometric, square-dotted. */
const display = Almarai({
  subsets: ["arabic"],
  weight: ["800"],
  display: "swap",
})

/* UI face for the header — neutral and quiet, so the words stay the only
   thing with weight on the page. */
const ui = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  display: "swap",
})

const WORDS = ["ابن", "ادر", "انشر"]

const NAV = [
  { href: "/themes", label: "القوالب" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

/* The reference's neutral ramp, used verbatim. */
const PAPER = "#fafafa"
const OBSIDIAN = "#171717"
const STONE = "#666666"

/* The reference's elevation recipe: stacked hairline rings, never a shadow. */
const RING = "0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55)"

/* One accent per screen, and the ground each one stands on. DeckLine reads
   these in document order and crossfades between neighbours as the deck
   moves, so the colour arrives with the screen instead of snapping at its
   edge. */
const STOPS: DeckStop[] = [
  { accent: [94, 106, 210], dark: 0 },
  { accent: [113, 112, 255], dark: 0 },
  { accent: [139, 134, 255], dark: 1 },
  { accent: [74, 222, 128], dark: 1 },
  { accent: [200, 169, 106], dark: 1 },
]

const GROUND = [PAPER, PAPER, "#131316", "#0f3527", "#0a0a0c"]

/* The three verbs, one to a screen, in the order the product happens in. */
const STEPS = [
  { word: "ابن", line: "اختر قالبًا، واكتب نبذة عن نشاطك." },
  { word: "ادر", line: "منتجاتك وطلباتك وعملاؤك في مكان واحد." },
  { word: "انشر", line: "اشترِ عنوانك، وانشر موقعك في دقائق." },
]

const ON_DARK = "rgba(250,250,250,0.62)"

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  /* Portal URLs resolve to real subdomains in prod, relative on dev. Start
     relative to match SSR, then upgrade after mount to avoid a hydration
     mismatch — same approach the shared Navbar uses. */
  const [portal, setPortal] = useState({ login: "/login", signup: "/login?mode=signup", dash: "/dashboard" })
  useEffect(() => {
    setPortal({ login: accountsUrl("/login"), signup: accountsUrl("/signup"), dash: dashboardUrl() })
  }, [])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUser(session?.user || null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /* Dismissal: Escape, a click outside the header, or growing past the phone
     breakpoint (where the menu button no longer exists). */
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    const onDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const mq = window.matchMedia("(min-width: 768px)")
    const onMq = () => { if (mq.matches) setMenuOpen(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    mq.addEventListener("change", onMq)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
      mq.removeEventListener("change", onMq)
    }
  }, [menuOpen])

  const initial = user?.email?.charAt(0).toUpperCase() ?? "؟"

  /* The single account control. Signed in it is the account's own initial,
     not a generic glyph; signed out it is the one call to action. White on
     #171717 clears WCAG AA comfortably either way. */
  const accountControl = user ? (
    <Link
      href={portal.dash}
      aria-label="حسابي"
      title={user.email}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-medium leading-none text-white transition-opacity duration-150 hover:opacity-85"
      style={{ background: OBSIDIAN }}
    >
      {initial}
    </Link>
  ) : (
    <Link
      href={portal.signup}
      className="rounded-full px-4 py-2 text-[14px] leading-none text-white transition-opacity duration-150 hover:opacity-85"
      style={{ background: OBSIDIAN }}
    >
      ابدأ
    </Link>
  )

  return (
    <>
      {/* /demo/* sits outside the (main) group, so there is no Navbar, Footer
          or review button to hide here — only the consent dialog, which the
          root layout mounts on every route. Suppressed so the page reads as
          genuinely empty; it must be restored if this ever becomes a real
          route that ships. */}
      {/* Injected as raw html, not as a text child. React escapes quotes
          inside a <style> child when it renders on the server, so the
          attribute selector below came back as &quot; and every load
          failed hydration and fell back to client rendering. */}
      <style dangerouslySetInnerHTML={{ __html: `
        body:has(#zn-deck) [aria-labelledby="cookie-consent-title"] { display: none !important; }
        /* The deck scrolls, so no overflow lock here. The ground under the
           last panel matches it, so an overscroll bounce shows obsidian
           rather than paper. */
        body:has(#zn-deck) { background: ${GROUND[4]}; }

        /* Display scale. Two stops rather than one clamp: a single aggressive
           vw ratio that fills a desktop line leaves phones with a few pixels
           of clearance, and the words wrap the moment anything renders wide. */
        #hero-words {
          font-size: clamp(2.25rem, 12.5vw, 6rem);
          /* At 800 weight the strokes bulk up under Windows' default stem
             darkening; smoothing keeps the counters open at display size. */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        @media (min-width: 768px) {
          #hero-words { font-size: clamp(6rem, 14vw, 13rem); }
        }

        /* One word per screen, a step down from the hero so the deck reads as
           the hero first and its chapters after. */
        .zn-word {
          font-size: clamp(3rem, 18vw, 7rem);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        @media (min-width: 768px) {
          .zn-word { font-size: clamp(5rem, 12vw, 11rem); }
        }
        .zn-say {
          margin-top: 1.1rem;
          max-width: 32ch;
          font-size: 15px;
          line-height: 1.7;
        }
        @media (min-width: 768px) {
          .zn-say { font-size: 17px; }
        }

        body:has(#zn-deck) ::selection { background: #171717; color: #fafafa; }

        /* Entrances are CSS, not JS. The words are the only content on the
           page, so they must never depend on a rAF loop to become visible:
           base state is opacity 1 and the keyframe only borrows the hidden
           state during its own delay. If animation is unavailable for any
           reason the page still reads. Same reasoning as the globe fix. */
        @keyframes zn-rise {
          from { opacity: 0; transform: translateY(0.09em); }
          to   { opacity: 1; transform: translateY(0); }
        }
        #hero-words > span {
          animation: zn-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        /* The header extending. Visibility is stepped so the links leave the
           focus order only once the drawer has finished closing. */
        .zn-drawer {
          transition: grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0s linear 320ms;
        }
        .zn-drawer[style*="1fr"] { transition-delay: 0s, 0s; }
        @media (prefers-reduced-motion: reduce) {
          #hero-words > span { animation: none; }
          .zn-drawer { transition: none; }
        }
` }} />

      {/* ── Header ──────────────────────────────────────────────────────────
          A floating pill rather than a bar: it sits on the paper with a
          hairline ring and no underline, so nothing divides the page. Fixed,
          so it costs the hero no vertical space and the words stay dead
          centre in the viewport. */}
      <header
        id="pill-header"
        ref={headerRef}
        dir="rtl"
        className={`${ui.className} fixed inset-x-0 top-8 z-50 flex justify-center px-4`}
      >
        <div className="w-full max-w-[520px] md:w-auto md:max-w-none">

          {/* Phone: one surface. The bar and the menu share a single
              container, ring and background, so opening extends the pill
              downward instead of dropping a second object beneath it.
              24px is the pill's own radius (half of its 48px height), so the
              shape is unchanged when closed and merely taller when open. */}
          <div
            className="overflow-hidden rounded-[24px] backdrop-blur-[12px] md:hidden"
            style={{ background: "rgba(255,255,255,0.72)", boxShadow: RING }}
          >
            {/* Three slots. Menu physically left, mark centred, account
                physically right. */}
            <div className="grid h-12 grid-cols-3 items-center px-2">
              <div className="flex justify-start">{accountControl}</div>

              <Link href="/?home=1" aria-label="زينيا" className="flex justify-center">
                {/* Pure black is permitted here: the reference reserves #000 for
                    logo marks and graphic glyphs, nowhere else. */}
                <ZenyaMark className="h-[17px] text-black" />
              </Link>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-controls="pill-menu"
                  aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/[0.05]"
                  style={{ color: OBSIDIAN }}
                >
                  {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* The extension. Animating grid-template-rows between 0fr and 1fr
                is the one way to transition to an auto height in CSS without
                hard-coding a pixel value the links would eventually outgrow.
                visibility carries the collapsed state to focus order and
                screen readers. */}
            <div
              className="zn-drawer grid"
              style={{
                gridTemplateRows: menuOpen ? "1fr" : "0fr",
                visibility: menuOpen ? "visible" : "hidden",
              }}
            >
              <div className="overflow-hidden">
                <nav id="pill-menu" className="px-1.5 pb-1.5 pt-0.5">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-[6px] px-3 py-2.5 text-[15px] leading-none transition-colors duration-150 hover:bg-black/[0.04] hover:text-[#171717]"
                      style={{ color: STONE }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Tablet and up: the full bar. */}
          <div
            className="hidden h-12 items-center gap-0.5 rounded-full pe-1.5 ps-3 backdrop-blur-[12px] md:flex"
            style={{ background: "rgba(255,255,255,0.72)", boxShadow: RING }}
          >
            <Link href="/?home=1" aria-label="زينيا" className="flex items-center px-1">
              <ZenyaMark className="h-[17px] text-black" />
            </Link>

            <nav className="flex items-center gap-0.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-[14px] leading-none transition-colors duration-150 hover:text-[#171717]"
                  style={{ color: STONE }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <span className="mx-1.5 h-5 w-px" style={{ background: "rgba(0,0,0,0.07)" }} aria-hidden />

            {accountControl}
          </div>

          {/* Phone menu. 6px radius: the reference allows full-round only for
              pill-shaped nav actions, everything rectangular stays at 6px. */}
        </div>
      </header>

      {/* Deck. Five screens, each on its own ground, with one field of
          light running behind all of them. Panels carry data-panel so
          DeckLine can measure a real panel instead of trusting innerHeight. */}
      <div id="zn-deck" dir="rtl">
        <DeckLine stops={STOPS} />

        {/* Screen one: the hero. Bare paper, the three words centred, no
            divider anywhere. Revealed in sequence, because the order is the
            product: build, then manage, then publish. */}
        <section
          data-panel
          className="relative flex h-[100svh] w-full items-center justify-center"
          style={{ background: GROUND[0] }}
        >
          <h1
            id="hero-words"
            className={`${display.className} relative z-10 flex flex-wrap items-baseline justify-center gap-x-[0.3em] gap-y-1 px-5 text-center`}
            style={{ color: OBSIDIAN, fontWeight: 800, lineHeight: 1.24 }}
          >
            {WORDS.map((word, i) => (
              <span
                key={word}
                className="inline-block"
                style={{ animationDelay: `${0.15 + i * 0.18}s` }}
              >
                {word}
              </span>
            ))}
          </h1>
        </section>

        {/* Screens two to four: one verb to a screen. */}
        {STEPS.map((step, i) => {
          const idx = i + 1
          const onDark = STOPS[idx].dark === 1
          return (
            <section
              key={step.word}
              data-panel
              className="relative flex h-[100svh] w-full items-center justify-center"
              style={{ background: GROUND[idx] }}
            >
              <div className="relative z-10 flex flex-col items-center px-5 text-center">
                <h2
                  className={`${display.className} zn-word`}
                  style={{ color: onDark ? PAPER : OBSIDIAN, fontWeight: 800, lineHeight: 1.24 }}
                >
                  {step.word}
                </h2>
                <p className={`${ui.className} zn-say`} style={{ color: onDark ? ON_DARK : STONE }}>
                  {step.line}
                </p>
              </div>
            </section>
          )
        })}

        {/* Screen five: the close, standing on obsidian. */}
        <section
          data-panel
          className="relative flex h-[100svh] w-full items-center justify-center"
          style={{ background: GROUND[4] }}
        >
          <div className="relative z-10 flex flex-col items-center gap-8 px-5 text-center">
            <ZenyaMark className="h-[26px] text-[#fafafa]" />
            <Link
              href="/theme/new"
              className={`${ui.className} rounded-full px-5 py-2.5 text-[15px] leading-none transition-opacity duration-150 hover:opacity-85`}
              style={{ background: PAPER, color: OBSIDIAN }}
            >
              ابدأ الإنشاء
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
