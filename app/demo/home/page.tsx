"use client"

/**
 * Candidate homepage — one page, one screen. A floating pill header over bare
 * paper, and three words in the middle. Nothing else, no dividers anywhere.
 *
 * WORK IN PROGRESS. Lives at /demo/home and is listed in .vercelignore, so it
 * runs on the local dev server but never reaches a deploy. When it is approved,
 * move this file to app/(main)/page.tsx, restore the nav/footer/consent hiding
 * for that layout, and drop the .vercelignore entry.
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
      <style>{`
        body:has(#blank-home) [aria-labelledby="cookie-consent-title"] { display: none !important; }
        body:has(#blank-home) { background: ${PAPER}; overflow: hidden; }

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

        body:has(#blank-home) ::selection { background: #171717; color: #fafafa; }

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
      `}</style>

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

      {/* ── Hero ────────────────────────────────────────────────────────────
          The whole page. Bare paper, no grid, no divider, no background
          shift — the words are centred in the full viewport. */}
      <main
        id="blank-home"
        dir="rtl"
        className="flex h-[100dvh] w-full items-center justify-center"
        style={{ background: PAPER }}
      >
        {/* Revealed in sequence: the order is the product — build, then
            manage, then publish. Slow and short-travelled so it settles
            rather than announces itself. */}
        <h1
          id="hero-words"
          className={`${display.className} flex flex-wrap items-baseline justify-center gap-x-[0.3em] gap-y-1 px-5 text-center`}
          style={{
            color: OBSIDIAN,
            fontWeight: 800,
            lineHeight: 1.24,
          }}
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
      </main>
    </>
  )
}
