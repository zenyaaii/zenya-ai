"use client"

/**
 * Candidate homepage — one page, one screen. A floating pill header over bare
 * paper, and three words in the middle. Nothing else, no dividers anywhere.
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
 * Display type is Almarai: a geometric Kufi-influenced Arabic with flat
 * terminals and square dots. It ran at 800 first; at the current display size
 * that read as a slab, so the weight is back to 400, which also lands where
 * the Vercel spec wants headlines (450 and under).
 *
 * A hairline frame holds the composition: two rules dropping from the top
 * corners, closed by a rule at the foot of the screen. They are the only
 * moving parts, drawn in once on load with one slow gleam travelling down
 * each vertical after that.
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

/* Display face for the three words. Set at 400, not 800: at the size the words
   now run, the heavy cut turned the line into a black slab. The regular cut
   holds the same geometric skeleton while letting the paper through. */
const display = Almarai({
  subsets: ["arabic"],
  weight: ["400"],
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

/* Only القوالب carries a panel. الأسعار and تواصل are single destinations, so
   hovering them closes whatever is open rather than opening an empty tray. */
const NAV: Array<{ href: string; label: string; panel?: PanelId }> = [
  { href: "/themes", label: "القوالب", panel: "themes" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

type PanelId = "themes" | "account"

/* The eight templates, labelled as they are on /themes and pointing at the
   same no-auth live previews. Kept local rather than imported so this demo
   route stays self-contained; the labels track lib/aurora-tints. */
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

/* Shared row inside either panel. */
const ROW =
  "block rounded-[6px] px-3 py-2 text-[13.5px] leading-none transition-colors duration-150 hover:bg-black/[0.04] hover:text-[#171717]"

/* The reference's neutral ramp, used verbatim. */
const PAPER = "#fafafa"
const OBSIDIAN = "#171717"
const STONE = "#666666"

/* The reference's elevation recipe: stacked hairline rings, never a shadow. */
const RING = "0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55)"

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  /* Tablet and up: which tray the pill is currently extended to show. */
  const [panel, setPanel] = useState<PanelId | null>(null)
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

  /* Dismissal, shared by both the phone menu and the desktop trays: Escape, a
     click outside the header, or a breakpoint change (either control is gone
     on the other side of it). */
  useEffect(() => {
    if (!menuOpen && !panel) return
    const close = () => { setMenuOpen(false); setPanel(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    const onDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) close()
    }
    const mq = window.matchMedia("(min-width: 768px)")
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    mq.addEventListener("change", close)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
      mq.removeEventListener("change", close)
    }
  }, [menuOpen, panel])

  /* Which tray to render. On the way closed `panel` is already null, so the
     content is held at whatever was last open and the tray collapses on its
     own contents instead of swapping to the other tray mid-animation. */
  const lastPanel = useRef<PanelId>("themes")
  useEffect(() => { if (panel) lastPanel.current = panel }, [panel])
  const shownPanel = panel ?? lastPanel.current

  const signOut = async () => {
    setPanel(null)
    await createClient().auth.signOut()
    setUser(null)
  }

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

  /* Same control on the wide bar, except that when there is an account behind
     it, it opens the tray instead of jumping straight to the dashboard: the
     reader gets to choose between the dashboard and signing out. Signed out
     there is nothing to choose, so it stays the plain call to action. */
  const desktopAccount = user ? (
    <button
      type="button"
      onClick={() => setPanel((p) => (p === "account" ? null : "account"))}
      aria-expanded={panel === "account"}
      aria-haspopup="menu"
      aria-label="حسابي"
      title={user.email}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-medium leading-none text-white transition-opacity duration-150 hover:opacity-85"
      style={{ background: OBSIDIAN }}
    >
      {initial}
    </button>
  ) : (
    accountControl
  )

  return (
    <>
      {/* /demo/* sits outside the (main) group, so there is no Navbar, Footer
          or review button to hide here — only the consent dialog, which the
          root layout mounts on every route. Suppressed so the page reads as
          genuinely empty; it must be restored if this ever becomes a real
          route that ships. */}
      {/* dangerouslySetInnerHTML, not a text child: React escapes " and ' when
          it serialises text, so an inline <style> ships to the browser with
          &quot; inside its selectors. That both breaks those rules until
          hydration and makes the style block mismatch, which had React
          throwing away the server document and re-rendering the whole page on
          every load. */}
      <style dangerouslySetInnerHTML={{ __html: `
        body:has(#blank-home) [aria-labelledby="cookie-consent-title"] { display: none !important; }
        body:has(#blank-home) { background: ${PAPER}; overflow: hidden; }

        /* One set of measurements for the whole composition, held on the body
           so the header and the hero can both read them: the frame's side
           gutter, and the inset shared by the header at the top and the foot
           rule at the bottom, so the words sit centred between them. On a
           phone the gutter is also the header's padding, which lands the
           pill's two edges exactly on the two vertical rules. */
        body:has(#blank-home) { --gut: clamp(1.25rem, 4.5vw, 4rem); --inset: 2rem; }

        /* Display scale. Two stops rather than one clamp: a single aggressive
           vw ratio that fills a desktop line leaves phones with a few pixels
           of clearance, and the words wrap the moment anything renders wide.
           Both stops sit just inside the frame, so the line reaches for the
           rules without ever touching them. */
        #hero-words {
          font-size: clamp(2.5rem, 14vw, 6.5rem);
          padding-inline: calc(var(--gut) + 1.25rem);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        @media (min-width: 768px) {
          #hero-words { font-size: clamp(6.5rem, 15vw, 20rem); }
        }

        /* ── The frame ──────────────────────────────────────────────────
           Not decoration for its own sake: the two verticals set the page's
           gutter and the foot rule closes the screen, so the words have
           something to be centred inside. All four ends meet. */
        #zn-frame { position: absolute; inset: 0; pointer-events: none; }
        #zn-frame span {
          position: absolute;
          background: rgba(0,0,0,0.07);
          overflow: hidden;
        }
        #zn-frame .v {
          top: 0; bottom: var(--inset); width: 1px;
          transform-origin: top;
          animation: zn-drop 1100ms cubic-bezier(0.22, 1, 0.36, 1) 120ms backwards;
        }
        #zn-frame .v.s { inset-inline-start: var(--gut); }
        #zn-frame .v.e { inset-inline-end: var(--gut); animation-delay: 220ms; }
        #zn-frame .h {
          inset-inline: var(--gut); bottom: var(--inset); height: 1px;
          transform-origin: center;
          animation: zn-draw 900ms cubic-bezier(0.22, 1, 0.36, 1) 700ms backwards;
        }
        @keyframes zn-drop { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes zn-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* The one thing that keeps moving: a short segment of darker rule
           sliding down each vertical, slow enough to read as light rather
           than as an animation. Transform only, so it stays off the main
           thread. */
        #zn-frame .v i {
          position: absolute;
          inset-inline: 0;
          height: 22%;
          background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.20), rgba(0,0,0,0));
          animation: zn-gleam 11s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        #zn-frame .v.e i { animation-delay: -5.5s; }
        @keyframes zn-gleam {
          from { transform: translateY(-110%); }
          to   { transform: translateY(465%); }
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
          #zn-frame .v, #zn-frame .h { animation: none; }
          #zn-frame .v i { display: none; }
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
        className={`${ui.className} fixed inset-x-0 top-[var(--inset)] z-50 flex justify-center px-[var(--gut)]`}
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

          {/* Tablet and up: the same one-surface idea as the phone. The bar
              and its tray share a container, ring and background, so the pill
              extends downward instead of dropping a menu underneath itself.
              24px is the bar's own radius, so the closed shape is unchanged. */}
          <div
            className="hidden overflow-hidden rounded-[24px] backdrop-blur-[12px] md:block"
            style={{ background: "rgba(255,255,255,0.72)", boxShadow: RING }}
            /* Leaving the surface closes a hover-opened tray. A tray the
               reader opened by clicking their account stays put until they
               dismiss it. */
            onMouseLeave={() => setPanel((p) => (p === "themes" ? null : p))}
          >
            <div className="flex h-12 items-center gap-0.5 pe-1.5 ps-3">
              <Link
                href="/?home=1"
                aria-label="زينيا"
                className="flex items-center px-1"
                onMouseEnter={() => setPanel(null)}
              >
                <ZenyaMark className="h-[17px] text-black" />
              </Link>

              <nav className="flex items-center gap-0.5">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setPanel(item.panel ?? null)}
                    onFocus={() => setPanel(item.panel ?? null)}
                    aria-expanded={item.panel ? panel === item.panel : undefined}
                    className="rounded-full px-3 py-2 text-[14px] leading-none transition-colors duration-150 hover:text-[#171717]"
                    style={{ color: panel === item.panel ? OBSIDIAN : STONE }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <span className="mx-1.5 h-5 w-px" style={{ background: "rgba(0,0,0,0.07)" }} aria-hidden />

              {/* Reaching the account control puts the templates tray away,
                  the same as reaching any other item in the bar. Wrapped
                  rather than handled on the control itself, because signed
                  out it is a plain link and signed in it is a button. */}
              <span
                className="flex items-center"
                onMouseEnter={() => setPanel((p) => (p === "themes" ? null : p))}
              >
                {desktopAccount}
              </span>
            </div>

            {/* The tray. Same grid-template-rows technique as the phone menu,
                so the height animates to auto without a hard-coded pixel
                value. `w-0 min-w-full` lets the content fill the pill without
                its own intrinsic width widening the closed bar. */}
            <div
              className="zn-drawer grid"
              style={{
                gridTemplateRows: panel ? "1fr" : "0fr",
                visibility: panel ? "visible" : "hidden",
              }}
            >
              <div className="w-0 min-w-full overflow-hidden">
                {shownPanel === "account" && user ? (
                  <div className="px-1.5 pb-1.5 pt-0.5" role="menu">
                    <div
                      className="truncate px-3 pb-2 pt-1 text-[12px] leading-none"
                      style={{ color: STONE }}
                    >
                      {user.email}
                    </div>
                    <Link
                      href={portal.dash}
                      role="menuitem"
                      onClick={() => setPanel(null)}
                      className={ROW}
                      style={{ color: OBSIDIAN }}
                    >
                      لوحة التحكم
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      className={`${ROW} w-full text-start`}
                      style={{ color: STONE }}
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <div className="px-1.5 pb-1.5 pt-0.5">
                    <div className="grid grid-cols-2 gap-x-1">
                      {TEMPLATES.map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          onClick={() => setPanel(null)}
                          className={ROW}
                          style={{ color: STONE }}
                        >
                          {t.label}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/themes"
                      onClick={() => setPanel(null)}
                      className={`${ROW} mt-1.5 pt-2.5`}
                      style={{ color: OBSIDIAN, borderTop: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      كل القوالب
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────
          The whole page. Bare paper, no grid, no divider, no background
          shift — the words are centred in the full viewport. */}
      <main
        id="blank-home"
        dir="rtl"
        /* Fixed rather than h-[100dvh]. The root ZoomLock writes CSS `zoom` on
           <html>, and viewport units resolve BEFORE that scale is applied: at
           the 85% cap a 720px window gives a 573px "100dvh" box, which parked
           the words a slab above true centre and lifted the foot rule off the
           bottom edge. A fixed layer is measured against the real viewport, so
           the words are centred on the reader's screen at any zoom. Safe here
           because the page is one screen and the body already has
           overflow: hidden. */
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: PAPER }}
      >
        {/* The frame is drawn behind everything and takes no pointer events,
            so it can never sit between the reader and the words. */}
        <div id="zn-frame" aria-hidden>
          <span className="v s"><i /></span>
          <span className="v e"><i /></span>
          <span className="h" />
        </div>

        {/* Revealed in sequence: the order is the product — build, then
            manage, then publish. Slow and short-travelled so it settles
            rather than announces itself. */}
        <h1
          id="hero-words"
          className={`${display.className} relative flex flex-wrap items-baseline justify-center gap-x-[0.3em] gap-y-1 text-center`}
          style={{
            color: OBSIDIAN,
            fontWeight: 400,
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
