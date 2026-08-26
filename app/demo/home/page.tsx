"use client"

/**
 * Candidate homepage - one page, one screen. A floating pill header over bare
 * paper, and three words in the middle.
 *
 * NOT the homepage. It ships as a standalone route at /demo/home so it can be
 * reviewed on the real domain; app/(main)/page.tsx remains the homepage and is
 * untouched. Do not wire this into `/`. If it is ever promoted, move the file
 * to app/(main)/page.tsx and restore the nav/footer/consent hiding that the
 * (main) layout needs.
 *
 * Visual language: the Vercel design system per the reference, "typeset
 * terminal on white paper". Light canvas (#fafafa), near-black type (#171717,
 * never pure #000), strict grey ramp, hairline rings instead of shadows. The
 * page carries no rules and no dividers, and every pixel of colour on it
 * belongs to the light at the edges: nothing else is tinted.
 *
 * Two things on the page are the reader's to set, both from one rail on the
 * physical left, both remembered in localStorage: the face the three words are
 * in (50 settings, every Arabic-subset family next/font can serve, Tajawal at
 * 900 by default) and the colour of the light behind them (9 mixes, including
 * one that turns it off). The rail is deliberately plain, a tool sitting on
 * the page rather than part of the composition.
 *
 * The light itself is the background animation from the Claude Design file:
 * a wide bar of oklch colour anchored mostly below the fold, blurred until it
 * is only light, breathing sideways and upward on a 19s cycle. A fainter,
 * slower, counter-running twin hangs off the top edge. Nothing was copied but
 * the motion: the geometry, the blur ratio and the keyframe are the design's,
 * the palettes and the second glow are ours.
 *
 * Over the foot of it sits the one claim the page makes, typed out once on
 * load behind a moving caret.
 *
 * Two rules hold for all 50, because the type is Arabic:
 *   - no negative letter-spacing (the reference asks for -0.06em at display
 *     sizes; Arabic letterforms connect and break apart when tracked in)
 *   - leading stays well above 1.0 so descenders are not clipped, which is
 *     why every setting carries its own line-height and optical scale
 *
 * Header layout splits at md (768px), so tablets get the full laptop bar and
 * only phones fall back to the three-slot arrangement. On the wide bar the
 * pill grows in both directions at once: sideways from the centre, and
 * downward into its tray.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Almarai, IBM_Plex_Sans_Arabic, Alexandria, Alkalami, Amiri, Amiri_Quran, Aref_Ruqaa, Aref_Ruqaa_Ink, Baloo_Bhaijaan_2, Blaka, Blaka_Hollow, Blaka_Ink, Cairo, Cairo_Play, Changa, El_Messiri, Gulzar, Handjet, Harmattan, Jomhuria, Katibeh, Kufam, Lalezar, Lateef, Lemonada, Mada, Marhey, Markazi_Text, Mirza, Noto_Kufi_Arabic, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Noto_Sans_Arabic, Qahiri, Rakkas, Readex_Pro, Reem_Kufi, Reem_Kufi_Fun, Reem_Kufi_Ink, Rubik, Ruwudu, Scheherazade_New, Tajawal, Vazirmatn, Vibes, Zain } from "next/font/google"
import { Menu, Type, X } from "lucide-react"
import ZenyaMark from "@/components/ZenyaMark"
import { createClient } from "@/utils/supabase/client"
import { dashboardUrl, accountsUrl } from "@/lib/portal-urls"
import BuildSection from "./BuildSection"

/* The default face for the three words, and the only one that is preloaded,
   because it is what the page renders before anybody picks anything. Both cuts
   are declared here: the rail offers Tajawal at 900 and at 200. */
const display = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "500", "700", "900"],
  display: "swap",
})

/* The build window's own face. It shows the real wizard, and the real app
   sets Arabic in Tajawal (app/globals.css) — so the window uses what the
   product uses. Plex Sans Arabic is the hero's furniture face and reads thin
   and foreign at wizard sizes; this is the same type a customer sees in the
   form the window is showing. */
const appUi = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
})

/* UI face for the header and the rail: neutral and quiet, so the words stay
   the only thing on the page with any weight. */
const ui = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  display: "swap",
})

/* The 50 faces: every Arabic-subset family next/font can serve, four of them
   twice at opposite weights. preload: false throughout, because declaring a
   family only writes its @font-face rule. The browser fetches a file the
   moment something on the page is actually set in that face, so nothing is
   downloaded for a face nobody picks. */
const fAlexandria = Alexandria({ subsets: ["arabic"], display: "swap", preload: false })
const fAlmarai = Almarai({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fAlkalami = Alkalami({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fAmiri = Amiri({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fAmiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fArefRuqaa = Aref_Ruqaa({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fArefRuqaaInk = Aref_Ruqaa_Ink({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fBalooBhaijaan2 = Baloo_Bhaijaan_2({ subsets: ["arabic"], display: "swap", preload: false })
const fBlaka = Blaka({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fBlakaHollow = Blaka_Hollow({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fBlakaInk = Blaka_Ink({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fCairo = Cairo({ subsets: ["arabic"], display: "swap", preload: false })
const fCairoPlay = Cairo_Play({ subsets: ["arabic"], display: "swap", preload: false })
const fChanga = Changa({ subsets: ["arabic"], display: "swap", preload: false })
const fElMessiri = El_Messiri({ subsets: ["arabic"], display: "swap", preload: false })
const fGulzar = Gulzar({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fHandjet = Handjet({ subsets: ["arabic"], display: "swap", preload: false })
const fHarmattan = Harmattan({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fJomhuria = Jomhuria({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fKatibeh = Katibeh({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fKufam = Kufam({ subsets: ["arabic"], display: "swap", preload: false })
const fLalezar = Lalezar({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fLateef = Lateef({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fLemonada = Lemonada({ subsets: ["arabic"], display: "swap", preload: false })
const fMada = Mada({ subsets: ["arabic"], display: "swap", preload: false })
const fMarhey = Marhey({ subsets: ["arabic"], display: "swap", preload: false })
const fMarkaziText = Markazi_Text({ subsets: ["arabic"], display: "swap", preload: false })
const fMirza = Mirza({ subsets: ["arabic"], weight: ["500"], display: "swap", preload: false })
const fNotoKufiArabic = Noto_Kufi_Arabic({ subsets: ["arabic"], display: "swap", preload: false })
const fNotoNaskhArabic = Noto_Naskh_Arabic({ subsets: ["arabic"], display: "swap", preload: false })
const fNotoNastaliqUrdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], display: "swap", preload: false })
const fNotoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic"], display: "swap", preload: false })
const fQahiri = Qahiri({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fRakkas = Rakkas({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fReadexPro = Readex_Pro({ subsets: ["arabic"], display: "swap", preload: false })
const fReemKufi = Reem_Kufi({ subsets: ["arabic"], display: "swap", preload: false })
const fReemKufiFun = Reem_Kufi_Fun({ subsets: ["arabic"], display: "swap", preload: false })
const fReemKufiInk = Reem_Kufi_Ink({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fRubik = Rubik({ subsets: ["arabic"], display: "swap", preload: false })
const fRuwudu = Ruwudu({ subsets: ["arabic"], weight: ["500"], display: "swap", preload: false })
const fScheherazadeNew = Scheherazade_New({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fVazirmatn = Vazirmatn({ subsets: ["arabic"], display: "swap", preload: false })
const fVibes = Vibes({ subsets: ["arabic"], weight: ["400"], display: "swap", preload: false })
const fZain = Zain({ subsets: ["arabic"], weight: ["300"], display: "swap", preload: false })

type TypeStyle = {
  id: string
  /** The family's own name, shown beside its preview. */
  name: string
  cls: string
  weight: number
  /** Leading. The naskh and nastaliq faces need far more of it than the sans. */
  lh: number
}

/* Ordered by kind rather than alphabet: contemporary sans first, then the kufi
   and display faces, then naskh, with nastaliq last. */
const STYLES: TypeStyle[] = [
  { id: "almarai-400", name: "Almarai", cls: fAlmarai.className, weight: 400, lh: 1.24 },
  { id: "cairo-900", name: "Cairo", cls: fCairo.className, weight: 900, lh: 1.3 },
  { id: "cairo-200", name: "Cairo", cls: fCairo.className, weight: 200, lh: 1.3 },
  { id: "tajawal-900", name: "Tajawal", cls: display.className, weight: 900, lh: 1.28 },
  { id: "tajawal-200", name: "Tajawal", cls: display.className, weight: 200, lh: 1.28 },
  { id: "ibm-plex-sans-arabic-500", name: "IBM Plex Sans Arabic", cls: ui.className, weight: 500, lh: 1.3 },
  { id: "noto-sans-arabic-500", name: "Noto Sans Arabic", cls: fNotoSansArabic.className, weight: 500, lh: 1.3 },
  { id: "noto-kufi-arabic-900", name: "Noto Kufi Arabic", cls: fNotoKufiArabic.className, weight: 900, lh: 1.34 },
  { id: "noto-kufi-arabic-200", name: "Noto Kufi Arabic", cls: fNotoKufiArabic.className, weight: 200, lh: 1.34 },
  { id: "alexandria-800", name: "Alexandria", cls: fAlexandria.className, weight: 800, lh: 1.28 },
  { id: "alexandria-100", name: "Alexandria", cls: fAlexandria.className, weight: 100, lh: 1.28 },
  { id: "readex-pro-400", name: "Readex Pro", cls: fReadexPro.className, weight: 400, lh: 1.3 },
  { id: "vazirmatn-400", name: "Vazirmatn", cls: fVazirmatn.className, weight: 400, lh: 1.3 },
  { id: "rubik-500", name: "Rubik", cls: fRubik.className, weight: 500, lh: 1.28 },
  { id: "mada-500", name: "Mada", cls: fMada.className, weight: 500, lh: 1.28 },
  { id: "changa-500", name: "Changa", cls: fChanga.className, weight: 500, lh: 1.28 },
  { id: "zain-300", name: "Zain", cls: fZain.className, weight: 300, lh: 1.28 },
  { id: "reem-kufi-500", name: "Reem Kufi", cls: fReemKufi.className, weight: 500, lh: 1.3 },
  { id: "reem-kufi-fun-500", name: "Reem Kufi Fun", cls: fReemKufiFun.className, weight: 500, lh: 1.3 },
  { id: "reem-kufi-ink-400", name: "Reem Kufi Ink", cls: fReemKufiInk.className, weight: 400, lh: 1.3 },
  { id: "kufam-600", name: "Kufam", cls: fKufam.className, weight: 600, lh: 1.32 },
  { id: "qahiri-400", name: "Qahiri", cls: fQahiri.className, weight: 400, lh: 1.24 },
  { id: "el-messiri-600", name: "El Messiri", cls: fElMessiri.className, weight: 600, lh: 1.32 },
  { id: "marhey-500", name: "Marhey", cls: fMarhey.className, weight: 500, lh: 1.32 },
  { id: "lemonada-500", name: "Lemonada", cls: fLemonada.className, weight: 500, lh: 1.34 },
  { id: "cairo-play-600", name: "Cairo Play", cls: fCairoPlay.className, weight: 600, lh: 1.3 },
  { id: "baloo-bhaijaan-2-600", name: "Baloo Bhaijaan 2", cls: fBalooBhaijaan2.className, weight: 600, lh: 1.36 },
  { id: "lalezar-400", name: "Lalezar", cls: fLalezar.className, weight: 400, lh: 1.26 },
  { id: "rakkas-400", name: "Rakkas", cls: fRakkas.className, weight: 400, lh: 1.32 },
  { id: "handjet-500", name: "Handjet", cls: fHandjet.className, weight: 500, lh: 1.3 },
  { id: "blaka-400", name: "Blaka", cls: fBlaka.className, weight: 400, lh: 1.34 },
  { id: "blaka-ink-400", name: "Blaka Ink", cls: fBlakaInk.className, weight: 400, lh: 1.34 },
  { id: "blaka-hollow-400", name: "Blaka Hollow", cls: fBlakaHollow.className, weight: 400, lh: 1.34 },
  { id: "jomhuria-400", name: "Jomhuria", cls: fJomhuria.className, weight: 400, lh: 1.16 },
  { id: "vibes-400", name: "Vibes", cls: fVibes.className, weight: 400, lh: 1.38 },
  { id: "amiri-400", name: "Amiri", cls: fAmiri.className, weight: 400, lh: 1.52 },
  { id: "amiri-quran-400", name: "Amiri Quran", cls: fAmiriQuran.className, weight: 400, lh: 1.7 },
  { id: "scheherazade-new-400", name: "Scheherazade New", cls: fScheherazadeNew.className, weight: 400, lh: 1.56 },
  { id: "lateef-400", name: "Lateef", cls: fLateef.className, weight: 400, lh: 1.52 },
  { id: "harmattan-400", name: "Harmattan", cls: fHarmattan.className, weight: 400, lh: 1.46 },
  { id: "markazi-text-600", name: "Markazi Text", cls: fMarkaziText.className, weight: 600, lh: 1.42 },
  { id: "mirza-500", name: "Mirza", cls: fMirza.className, weight: 500, lh: 1.5 },
  { id: "katibeh-400", name: "Katibeh", cls: fKatibeh.className, weight: 400, lh: 1.46 },
  { id: "noto-naskh-arabic-500", name: "Noto Naskh Arabic", cls: fNotoNaskhArabic.className, weight: 500, lh: 1.52 },
  { id: "ruwudu-500", name: "Ruwudu", cls: fRuwudu.className, weight: 500, lh: 1.46 },
  { id: "alkalami-400", name: "Alkalami", cls: fAlkalami.className, weight: 400, lh: 1.54 },
  { id: "aref-ruqaa-400", name: "Aref Ruqaa", cls: fArefRuqaa.className, weight: 400, lh: 1.6 },
  { id: "aref-ruqaa-ink-400", name: "Aref Ruqaa Ink", cls: fArefRuqaaInk.className, weight: 400, lh: 1.6 },
  { id: "gulzar-400", name: "Gulzar", cls: fGulzar.className, weight: 400, lh: 1.8 },
  { id: "noto-nastaliq-urdu-500", name: "Noto Nastaliq Urdu", cls: fNotoNastaliqUrdu.className, weight: 500, lh: 2.1 },
]

/* Remembered across reloads, so a face someone liked is still there when they
   come back to look at it again. */
const STORE_KEY = "zenya-demo-type"
const STORE_GLOW = "zenya-demo-glow"

/* What the page opens with. */
const DEFAULT_TYPE = "tajawal-900"
const DEFAULT_GLOW = "aurora"

type Glow = {
  id: string
  name: string
  /** The four stops the light is mixed from, in oklch so the ramps stay even. */
  grad: string
}

/* The colour behind the words. The first is the one the design was drawn with;
   the rest keep its shape, four stops walking around the hue wheel, and only
   move where they start. "بلا" is the way back to bare paper. */
const GLOWS: Glow[] = [
  { id: "aurora", name: "شفق", grad: "linear-gradient(100deg, oklch(.74 .13 252) 0%, oklch(.72 .15 330) 34%, oklch(.75 .15 42) 68%, oklch(.78 .12 92) 100%)" },
  { id: "dawn", name: "فجر", grad: "linear-gradient(100deg, oklch(.82 .10 28) 0%, oklch(.76 .13 350) 36%, oklch(.74 .12 300) 70%, oklch(.84 .09 62) 100%)" },
  { id: "sea", name: "بحر", grad: "linear-gradient(100deg, oklch(.80 .10 198) 0%, oklch(.73 .12 232) 38%, oklch(.68 .13 262) 72%, oklch(.82 .08 186) 100%)" },
  { id: "palm", name: "نخيل", grad: "linear-gradient(100deg, oklch(.82 .11 128) 0%, oklch(.76 .12 158) 35%, oklch(.72 .10 190) 70%, oklch(.85 .11 108) 100%)" },
  { id: "dusk", name: "غروب", grad: "linear-gradient(100deg, oklch(.77 .16 42) 0%, oklch(.70 .17 20) 34%, oklch(.66 .16 350) 68%, oklch(.81 .13 72) 100%)" },
  { id: "berry", name: "توت", grad: "linear-gradient(100deg, oklch(.73 .15 330) 0%, oklch(.68 .16 300) 36%, oklch(.70 .14 268) 70%, oklch(.79 .12 348) 100%)" },
  { id: "sand", name: "رمل", grad: "linear-gradient(100deg, oklch(.86 .07 82) 0%, oklch(.80 .09 62) 36%, oklch(.76 .08 40) 70%, oklch(.88 .06 96) 100%)" },
  { id: "ash", name: "رماد", grad: "linear-gradient(100deg, oklch(.74 0 0) 0%, oklch(.60 0 0) 34%, oklch(.78 0 0) 68%, oklch(.55 0 0) 100%)" },
  { id: "none", name: "بلا", grad: "none" },
]

/* Three columns, four rows. The line cycles down the rows and each column
   changes on its own beat, so the reader reads a sentence that keeps
   rewriting itself rather than three words blinking at once. */
const WORD_SETS = [
  ["ابن", "ادر", "انشر"],
  ["تبني", "تدير", "تنشر"],
  ["بناء", "إدارة", "نشر"],
  ["تحسين", "إشراف", "زبائن"],
]

/* How long a row rests before the next one rolls up. The change itself runs
   about 1.5s end to end, because the three columns go one at a time rather than
   together, so the rest is set well clear of it. */
const WORD_HOLD = 4600

/* The one claim the page makes, in both languages. It types itself out, holds
   long enough to be read twice over, then retypes in the other language. */
const CLAIMS = [
  { id: "ar", dir: "rtl" as const, text: "أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي" },
  { id: "en", dir: "ltr" as const, text: "The first Muslim company building websites with AI" },
]

/* One full turn of the claim: it types, holds long enough to be read twice,
   then the sentence rolls away while the dot walks to the middle, the dot
   blinks out, and the other language starts from the opposite side. */
const CLAIM_TYPE = 3600
const CLAIM_HOLD = 10000
const CLAIM_EXIT = 440
const CLAIM_GAP = 280

/* Only القوالب carries a tray. الأسعار and تواصل are single destinations, so
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

/* The deck: how long one screen takes to replace the other, and how long the
   page stays deaf afterwards. The quiet is what a trackpad needs — one flick
   keeps sending wheel events for the better part of a second, and without a
   window of silence the deck would run twice on a single gesture. */
const DECK_MOVE = 1020
const DECK_QUIET = 320
/* Past this much of a wheel notch or a swipe, the gesture counts. Below it,
   nothing happens: a graze should not move the page a whole screen. */
const DECK_WHEEL = 14
const DECK_SWIPE = 44

/* Shared row inside either tray. */
const ROW =
  "block rounded-[6px] px-3 py-2 text-[13.5px] leading-none transition-colors duration-150 hover:bg-black/[0.04] hover:text-[#171717]"

/* The reference's neutral ramp, used verbatim. */
const PAPER = "#fafafa"
const OBSIDIAN = "#171717"
const STONE = "#666666"

/* The reference's elevation recipe: stacked hairline rings, never a shadow. */
const RING = "0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55)"

/* How wide the wide bar sits at rest, and how far it reaches for each tray.
   A definite closed width is what makes the sideways growth animatable at
   all: `width: auto` gives the transition nothing to move between. */
const PILL_REST = "380px"
const PILL_THEMES = "min(94vw, 720px)"
const PILL_ACCOUNT = "min(94vw, 470px)"

/**
 * The shell both corner controls are built from: one glass surface holding its
 * own button, with the tray stacked above it so the surface grows upward out
 * of the corner rather than off the bottom of the screen.
 *
 * `w-0 min-w-full` on the tray is what keeps the closed width honest: the
 * contents fill whatever width the surface is currently at without their own
 * intrinsic width deciding it.
 */
function Corner({
  open,
  restWidth,
  openWidth,
  onEnter,
  onLeave,
  button,
  children,
}: {
  open: boolean
  restWidth: string
  openWidth: string
  onEnter: () => void
  onLeave: () => void
  button: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="zn-corner zn-glass overflow-hidden rounded-[20px]"
      data-open={open}
      style={{ width: open ? openWidth : restWidth }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className="zn-drawer grid"
        data-open={open}
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <div className="w-0 min-w-full overflow-hidden">{children}</div>
      </div>
      {button}
    </div>
  )
}

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  /* Tablet and up: which tray the pill is currently extended to show. */
  const [panel, setPanel] = useState<PanelId | null>(null)
  /* The two corner controls: which one is extended, and whether a click
     pinned it there. Hovering opens; leaving closes again unless the reader
     committed to it with a click, which is also the only way in on a phone. */
  const [corner, setCorner] = useState<null | "type" | "glow">(null)
  const [pinned, setPinned] = useState(false)
  const [styleId, setStyleId] = useState(DEFAULT_TYPE)
  const [glowId, setGlowId] = useState(DEFAULT_GLOW)
  const headerRef = useRef<HTMLElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const type = STYLES.find((s) => s.id === styleId) ?? STYLES[0]
  const glow = GLOWS.find((g) => g.id === glowId) ?? GLOWS[0]

  /* Portal URLs resolve to real subdomains in prod, relative on dev. Start
     relative to match SSR, then upgrade after mount to avoid a hydration
     mismatch, the same approach the shared Navbar uses. */
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

  /* Remembered choices are restored after mount, never during render: the
     server has no localStorage, and the first paint has to match it. */
  useEffect(() => {
    try {
      const face = localStorage.getItem(STORE_KEY)
      if (face && STYLES.some((s) => s.id === face)) setStyleId(face)
      const light = localStorage.getItem(STORE_GLOW)
      if (light && GLOWS.some((g) => g.id === light)) setGlowId(light)
    } catch { /* private mode; the defaults are fine */ }
  }, [])

  /* One line, always. The type scale is measured rather than tuned: the line is
     laid out at its natural size, and --fit is set to the ratio that makes it
     fill the width it actually has. Fifty hand-tuned per-face numbers could
     not survive a change to the words; this survives any words, any face, any
     window. flex-nowrap keeps the browser from solving an overflow by breaking
     the line, so the only way out is the size.

     It re-runs when the face changes, when the window resizes and once the
     webfont has landed, since a fallback face measures differently. */
  const wordsRef = useRef<HTMLHeadingElement>(null)
  /* Every word's width at the fitted size: [column][row]. The columns are
     driven from this, so a row change is a width the browser can animate to
     rather than a reflow it does instantly. */
  const wordWidths = useRef<number[][]>([])
  /* The row on screen, and the way back into the width writer, both held in
     refs so the measuring effect does not have to re-run on every row. */
  const phaseRef = useRef(0)
  const applyRef = useRef<() => void>(() => {})
  useEffect(() => {
    const el = wordsRef.current
    if (!el) return
    let frame: ReturnType<typeof setTimeout>
    /* offsetWidth, not a bounding rect. The root ZoomLock writes CSS `zoom`, so
       a rect comes back in rendered pixels while clientWidth, the gap and any
       width written back are CSS pixels. Mixing the two shrinks every column by
       the zoom factor. offsetWidth is CSS pixels, like everything else here. */
    const measure = (slots: NodeListOf<HTMLElement>) =>
      Array.from(slots, (slot) =>
        Array.from(slot.querySelectorAll<HTMLElement>(".zn-w"), (w) => w.offsetWidth),
      )
    const fit = () => {
      const parent = el.parentElement
      if (!parent) return
      el.style.setProperty("--fit", "1")
      /* Columns go back to auto for the measurement, or the last fit's widths
         would be measured instead of the type's own. */
      const slots = el.querySelectorAll<HTMLElement>(".zn-slot")
      if (!slots.length) return
      slots.forEach((slot) => { slot.style.width = "" })
      const cs = getComputedStyle(el)
      const gap = parseFloat(cs.columnGap) || 0
      const avail =
        parent.clientWidth -
        (parseFloat(cs.paddingInlineStart) || 0) -
        (parseFloat(cs.paddingInlineEnd) || 0)

      /* The type is sized against the WIDEST row, not the row on screen, so a
         row change never has to resize the type to stay on one line. */
      const raw = measure(slots)
      const rows = raw[0]?.length ?? 0
      let natural = 0
      for (let r = 0; r < rows; r += 1) {
        let row = gap * (slots.length - 1)
        for (let c = 0; c < raw.length; c += 1) row += raw[c][r] ?? 0
        natural = Math.max(natural, row)
      }
      if (natural <= 0 || avail <= 0) return
      /* 0.86 leaves real air at both ends rather than filling the line to the
         gutters, and the ceiling stops a narrow face being blown up past the
         clamp it was given. */
      el.style.setProperty("--fit", String(Math.min(1.05, (avail * 0.86) / natural)))
      /* Re-read at the size it will actually run at: metrics scale with the
         font size, but reading them beats trusting that they do. */
      wordWidths.current = measure(slots)
      applyWidths()
    }
    /* Measured straight away, not on the next animation frame: a page opened in
       a background tab never gets one, and the line would sit at its small
       default until something else moved. Later passes are merely debounced,
       on a timer for the same reason. */
    function applyWidths() {
      const el2 = wordsRef.current
      const widths = wordWidths.current
      if (!el2 || !widths.length) return
      el2.querySelectorAll<HTMLElement>(".zn-slot").forEach((slot, c) => {
        const w = widths[c]?.[phaseRef.current]
        /* offsetWidth rounds down, so the column gets a pixel back: a column a
           fraction narrower than its word would shave a stem. */
        if (w) slot.style.width = `${w + 1}px`
      })
    }
    applyRef.current = applyWidths
    const schedule = () => {
      clearTimeout(frame)
      frame = setTimeout(fit, 90)
    }
    fit()
    /* The viewport is what is observed, never the line itself: fitting changes
       the line's own width, and observing that is a loop. */
    const stage = document.getElementById("blank-home")
    const ro = stage ? new ResizeObserver(schedule) : null
    if (stage && ro) ro.observe(stage)
    document.fonts?.ready.then(fit).catch(() => { /* no font API */ })
    return () => {
      clearTimeout(frame)
      ro?.disconnect()
    }
  }, [styleId])

  /* The claim's own clock. Three beats per language: the sentence types and
     holds with the dot at its own edge, then the sentence rolls away and the
     dot walks to the middle, then the dot blinks out and the other language
     starts from the opposite side. The dot only ever changes sides while it is
     invisible, so it never slides across the sentence it is introducing. */
  const [claim, setClaim] = useState(0)
  const [beat, setBeat] = useState<"read" | "leave" | "between">("read")
  useEffect(() => {
    const leave = setTimeout(() => setBeat("leave"), CLAIM_TYPE + CLAIM_HOLD)
    const between = setTimeout(() => setBeat("between"), CLAIM_TYPE + CLAIM_HOLD + CLAIM_EXIT)
    const next = setTimeout(() => {
      setClaim((c) => (c + 1) % CLAIMS.length)
      setBeat("read")
    }, CLAIM_TYPE + CLAIM_HOLD + CLAIM_EXIT + CLAIM_GAP)
    return () => {
      clearTimeout(leave)
      clearTimeout(between)
      clearTimeout(next)
    }
  }, [claim])

  /* Right for Arabic, left for English. It walks to the middle as the sentence
     leaves, then takes the far side during the dark beat — while it is still
     invisible and carries no transition on the move, so it jumps rather than
     sliding back across the sentence it is about to introduce. */
  const sideOf = (i: number) => (CLAIMS[i].dir === "rtl" ? "right" : "left")
  const dotSide =
    beat === "read" ? sideOf(claim)
      : beat === "leave" ? "middle"
        : sideOf((claim + 1) % CLAIMS.length)

  /* Which row is showing, and which one is on its way out. Both live in one
     piece of state so the updater stays pure: React can call it twice in
     development and the pair still moves together. */
  const [phase, setPhase] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null })
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => ({ cur: (p.cur + 1) % WORD_SETS.length, prev: p.cur })),
      WORD_HOLD,
    )
    return () => clearInterval(id)
  }, [])

  /* Each row hands its columns their new widths, and the browser animates the
     way there: a short word lets its neighbours close in, a long one pushes
     them apart, and the line stays centred throughout because it is centred by
     its container rather than by anything measured. */
  useEffect(() => {
    phaseRef.current = phase.cur
    applyRef.current()
  }, [phase.cur])

  /* ── The deck ──────────────────────────────────────────────────────────
     The hero does not scroll away by degrees. One downward gesture — wheel,
     swipe or key — lifts the whole of it and brings the build section up in
     its place, as a single move from one screen to the next, and the same
     going back up. There is no free scrolling on this page at all: the body
     has been overflow: hidden since the hero was one screen, and the deck
     moves by transform instead.

     The lock is the whole trick. A gesture past the threshold moves the deck
     and then closes it for the length of the move; every event that arrives
     while it is closed pushes the reopening further out, so the tail of a
     trackpad flick is swallowed rather than counted as a second gesture. A
     reader who wants the next screen has to stop and gesture again, which is
     what "one gesture, one screen" means. */
  const [deck, setDeck] = useState(0)
  /* Whether the deck has finished travelling. Section two's script waits for
     this: the move is the one moment on the page that has to be perfect, and
     it should not be sharing its frames with anything. */
  const [settled, setSettled] = useState(true)
  const deckAt = useRef(0)
  const deckShut = useRef(0)
  useEffect(() => {
    setSettled(false)
    const id = setTimeout(() => setSettled(true), DECK_MOVE + 60)
    return () => clearTimeout(id)
  }, [deck])
  useEffect(() => {
    const PANELS = 2
    const go = (dir: number) => {
      const now = Date.now()
      if (now < deckShut.current) {
        /* Still inside a gesture. Keep the door shut until it truly stops. */
        deckShut.current = now + DECK_QUIET
        return
      }
      const next = Math.min(PANELS - 1, Math.max(0, deckAt.current + dir))
      if (next === deckAt.current) return
      deckAt.current = next
      setDeck(next)
      deckShut.current = now + DECK_MOVE + DECK_QUIET
    }

    const onWheel = (e: WheelEvent) => {
      /* The one thing on the page that legitimately scrolls is the list of
         fifty faces inside the type tray. Anything with its own overflow
         keeps its wheel; everything else belongs to the deck. */
      const el = e.target as HTMLElement | null
      if (el?.closest?.(".zn-list")) return
      e.preventDefault()
      if (Math.abs(e.deltaY) < DECK_WHEEL) return
      go(e.deltaY > 0 ? 1 : -1)
    }

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1) }
      else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1) }
      else if (e.key === "Home") { e.preventDefault(); go(-1) }
      else if (e.key === "End") { e.preventDefault(); go(1) }
    }

    /* A swipe is measured from where the finger went down to where it came
       up, so the deck moves once at the end of the gesture rather than
       chasing the finger. Moving is prevented throughout, or iOS answers the
       drag with its own rubber band over a page that cannot scroll. */
    let startY: number | null = null
    let startX = 0
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? null
      startX = e.touches[0]?.clientX ?? 0
    }
    const onMove = (e: TouchEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest?.(".zn-list")) return
      if (e.cancelable) e.preventDefault()
    }
    const onEnd = (e: TouchEvent) => {
      if (startY == null) return
      const endY = e.changedTouches[0]?.clientY ?? startY
      const endX = e.changedTouches[0]?.clientX ?? startX
      const travel = startY - endY
      const across = endX - startX
      startY = null
      /* A gesture that went further across than down belongs to the build
         window, which uses it to change template. One finger, two meanings,
         decided by which way it actually travelled — and both sides agree on
         the same test. */
      if (Math.abs(across) > Math.abs(travel)) return
      if (Math.abs(travel) < DECK_SWIPE) return
      go(travel > 0 ? 1 : -1)
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKey)
    window.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onEnd, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
    }
  }, [])

  const pickType = (id: string) => {
    setStyleId(id)
    try { localStorage.setItem(STORE_KEY, id) } catch { /* ignore */ }
  }

  const pickGlow = (id: string) => {
    setGlowId(id)
    try { localStorage.setItem(STORE_GLOW, id) } catch { /* ignore */ }
  }

  /* Hover extends, leaving retracts, a click holds it open. Toggling the same
     control that is already pinned puts it away. */
  const enterCorner = (id: "type" | "glow") => setCorner(id)
  const leaveCorner = () => { if (!pinned) setCorner(null) }
  const toggleCorner = (id: "type" | "glow") => {
    if (corner === id && pinned) { setPinned(false); setCorner(null); return }
    setCorner(id)
    setPinned(true)
  }

  /* Dismissal, shared by the phone menu, the desktop trays and the rail:
     Escape, a click outside the thing, or a breakpoint change (the header
     controls do not exist on the other side of it). */
  useEffect(() => {
    if (!menuOpen && !panel && !corner) return
    const closeCorners = () => { setCorner(null); setPinned(false) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setMenuOpen(false)
      setPanel(null)
      closeCorners()
    }
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (headerRef.current && !headerRef.current.contains(target)) {
        setMenuOpen(false)
        setPanel(null)
      }
      const inCorner =
        (typeRef.current?.contains(target) ?? false) ||
        (glowRef.current?.contains(target) ?? false)
      if (!inCorner) closeCorners()
    }
    const closeHeader = () => { setMenuOpen(false); setPanel(null) }
    const mq = window.matchMedia("(min-width: 768px)")
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    mq.addEventListener("change", closeHeader)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
      mq.removeEventListener("change", closeHeader)
    }
  }, [menuOpen, panel, corner, pinned])

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
          or review button to hide here, only the consent dialog, which the
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

        /* Two measurements, held on the body so the header, the rail and the
           hero all read the same ones: the side gutter everything hangs off,
           and the inset the header floats at. */
        body:has(#blank-home) { --gut: clamp(1.25rem, 4.5vw, 4rem); --inset: 2rem; }

        /* Display scale. Two stops rather than one clamp: a single aggressive
           vw ratio that fills a desktop line leaves phones with a few pixels
           of clearance, and the words wrap the moment anything renders wide.
           --scale is the per-setting optical correction, since a nastaliq and
           a geometric kufi do not occupy the same space at the same em. */
        .zn-words {
          --display: clamp(2.5rem, 14vw, 6.5rem);
          /* --fit is measured, not guessed: the effect below reads the line's
             natural width and sets the ratio that makes it fill the space it
             actually has. Its default is deliberately small, so the line is
             narrow rather than broken before the measurement lands. The second
             term caps the rendered line at 60vh whatever the first asks for,
             which is what keeps a nastaliq at 2.1 leading on screen when the
             window is wide and short. */
          font-size: min(
            calc(var(--display) * var(--fit, 0.5)),
            calc(60vh / var(--lh, 1.24))
          );
          padding-inline: calc(var(--gut) + 1.25rem);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        @media (min-width: 768px) {
          .zn-words { --display: clamp(6.5rem, 15vw, 20rem); }
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
        .zn-words > span {
          animation: zn-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }

        /* The word change, borrowed wholesale from the Ventriloc button: the
           outgoing word rolls up out of the clip on the fast ease-in curve
           while the incoming one rises from 130% below on the slower ease-out,
           and each column is delayed by its own index so the line rewrites
           itself left to right rather than all at once.

           The clip is what sells it. Padding buys the slot enough room for
           Arabic ascenders and descenders and the negative margin takes that
           room back out of the layout, so glyphs are never cut while the words
           in the wings still are. */
        .zn-slot {
          display: inline-grid;
          /* The track has to follow the column, not the widest word in it. An
             auto track is sized to max-content, so every word sat centred in a
             track as wide as the longest of the four no matter what width the
             column itself was given, hanging a hundred pixels out each side.
             That is what was being cut, and what was landing on the neighbours.
             minmax(0, 1fr) makes the track the column. */
          grid-template-columns: minmax(0, 1fr);
          padding-block: 0.2em;
          margin-block: -0.2em;
          /* Cut above and below, never at the sides. The words waiting in the
             wings have to be hidden, but a side cut takes letters off the word
             being read, and a clipped letter is worse than anything it was
             protecting against. Nothing needs cutting sideways any more: the
             sequence below means a word is only ever visible while its column
             is already at that word's width, so there is no overhang to trim.
             The padding above and below keeps ascenders and descenders clear of
             the vertical cut. */
          clip-path: inset(0 -100vw);
          /* Never shrink. flex-nowrap stops the LINE breaking, but flex items
             still shrink below their content by default, and a squeezed column
             breaks its word across two lines instead. It also corrupted the
             measurement below, which read the squeezed width as natural and so
             fitted the type too large, every time. */
          flex: 0 0 auto;
          white-space: nowrap;
          /* The column re-spaces in the gap between the two words, while it is
             empty. Overlapping the two was the mistake: the incoming word is
             fully opaque long before it finishes rising, so a column still
             widening under it clipped the word, and a clipped word reads as two
             words running together. The order per column is now strict: the old
             word leaves, the column moves, the new word arrives. */
          transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: calc(var(--i) * var(--beat) + 260ms);
        }
        /* The distance between one column changing and the next. Long enough
           that a reader sees one word change, then the next, then the next,
           instead of three words changing at once in slightly different
           places. */
        .zn-words { --beat: 320ms; }
        .zn-w {
          grid-area: 1 / 1;
          /* Each word keeps its own width rather than stretching to the column,
             which is what lets the column be measured against it. */
          justify-self: center;
          white-space: nowrap;
          /* Long and soft on the way in, with the fade riding the whole travel
             rather than snapping on at the start. That is most of what makes
             the arrival read as smooth rather than as a swap. */
          transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 300ms cubic-bezier(0.33, 1, 0.68, 1);
        }
        /* Arrives after its column has finished making room. */
        .zn-w[data-state="in"] {
          transition-delay: calc(var(--i) * var(--beat) + 520ms);
        }
        /* Leaves first, before its column moves, gathering speed as it goes. */
        .zn-w[data-state="out"] {
          opacity: 0;
          transform: translateY(-130%);
          transition: transform 300ms cubic-bezier(0.55, 0.055, 0.675, 0.19),
                      opacity 220ms cubic-bezier(0.55, 0.055, 0.675, 0.19);
          transition-delay: calc(var(--i) * var(--beat));
          pointer-events: none;
        }
        /* Everything not on stage waits below, out of the clip. The row that
           is showing has no rule of its own, so its resting state is visible:
           a browser that never runs a transition still reads the line. */
        .zn-w[data-state="idle"] {
          opacity: 0;
          transform: translateY(130%);
          pointer-events: none;
        }
        /* The light. Straight off the design file: a wide bar of oklch colour
           sitting mostly below the fold, blurred until it is only light, and
           breathing sideways and upward on a 19s cycle. The blur and the
           opacity live on the outer box, the colour and the movement on the
           inner one, so the filter is rasterised once instead of every frame.
           A fainter, slower, counter-running twin hangs off the top edge so
           the screen is lit from both ends. */
        /* No overflow clip. The foot glow deliberately hangs 22vh BELOW the
           hero, and clipping it there is what made the second screen look
           guillotined off the first. Unclipped, that overhang lands on the top
           of section two and the two screens share one light — which is what
           they are: one light, not two that have to be matched. #zn-deck still
           clips everything at the viewport. */
        #zn-glow { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
        #zn-glow > div { position: absolute; left: -8%; right: -8%; }
        #zn-glow .foot { bottom: -22vh; height: 34vh; filter: blur(9vh); opacity: 0.72; }
        #zn-glow .head { top: -24vh; height: 28vh; filter: blur(10vh); opacity: 0.3; }
        #zn-glow i {
          position: absolute;
          inset: 0;
          background: var(--glow, none);
          animation: zn-breathe 19s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        #zn-glow .head i { animation-duration: 26s; animation-direction: reverse; }
        @keyframes zn-breathe {
          0%, 100% { transform: translateX(-4%) scaleY(1);    opacity: 0.7; }
          50%      { transform: translateX(4%)  scaleY(1.22); opacity: 1; }
        }

        /* The line over the light. It types itself once, right to left, by
           uncovering a box that never changes size, so nothing on the page
           shifts while it runs. The caret is a separate hairline walking the
           same steps, which is why the two stay in lockstep. */
        #zn-claim { position: absolute; inset-inline: 0; bottom: calc(var(--inset) + 3.5rem); display: flex; align-items: center; justify-content: center; }
        @media (min-width: 768px) { #zn-claim { bottom: calc(var(--inset) + 0.4rem); } }
        #zn-claim .wrap { position: relative; display: inline-block; }
        #zn-claim .line { position: relative; display: inline-block; white-space: nowrap; }

        #zn-claim .line[data-state="leave"],
        #zn-claim .line[data-state="between"] {
          opacity: 0;
          transform: translateY(-130%);
          transition: transform 300ms cubic-bezier(0.55, 0.085, 0.68, 0.53),
                      opacity 180ms linear;
          pointer-events: none;
        }
        /* Typing only runs for the sentence being read: the animation starts
           because the rule starts matching, so no remount is needed. */
        #zn-claim .line[data-state="read"] > .text {
          display: inline-block;
          animation: zn-type 3.6s steps(50, end) 500ms backwards;
        }
        #zn-claim .line > .caret {
          position: absolute;
          top: 0.1em; bottom: 0.1em; left: 0;
          width: 1px;
          background: currentColor;
          opacity: 0;
        }
        #zn-claim .line[data-state="read"] > .caret {
          animation: zn-type-caret 3.6s steps(50, end) 500ms backwards,
                     zn-blink 1.05s steps(1) infinite;
        }

        /* The dot's three anchors. It crosses to the far side only while it is
           out, so it never travels over the sentence. */
        #zn-claim .dot {
          position: absolute;
          top: 50%;
          width: 5px; height: 5px;
          border-radius: 999px;
          background: #171717;
          transform: translate(-50%, -50%);
          transition: left 420ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 220ms linear;
        }
        #zn-claim .dot[data-side="right"] { left: calc(100% + 11px); }
        #zn-claim .dot[data-side="middle"] { left: 50%; }
        #zn-claim .dot[data-side="left"] { left: -11px; }
        #zn-claim .dot[data-lit="false"] { opacity: 0; transition: opacity 200ms linear; }
        /* Uncovered, never covered: the resting state of both is the finished
           one, and the keyframes borrow the hidden state for their own
           duration. A browser that never runs the animation shows the line in
           full rather than clipping it away forever. The words are built the
           same way, for the same reason. */
        @keyframes zn-type {
          from { clip-path: inset(0 0 0 100%); }
          to   { clip-path: inset(0 0 0 0); }
        }
        @keyframes zn-type-caret {
          from { left: 100%; }
          to   { left: 0; }
        }
        /* Latin types the other way round: the reveal starts at the left edge
           and the caret walks right. */
        #zn-claim .line[dir="ltr"][data-state="read"] > .text { animation-name: zn-type-ltr; }
        #zn-claim .line[dir="ltr"][data-state="read"] > .caret { animation-name: zn-type-caret-ltr, zn-blink; }
        @keyframes zn-type-ltr {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }
        @keyframes zn-type-caret-ltr {
          from { left: 0; }
          to   { left: 100%; }
        }
        @keyframes zn-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

        /* The pill grows on two axes at once. Width is a layout property and
           normally off limits, but this is a single fixed-position element
           with nothing below it in flow, and it is the only way the bar can
           open outward from its own centre. The curve is shared with the
           height so the two read as one movement. */
        .zn-pill { transition: width 440ms cubic-bezier(0.22, 1, 0.36, 1); }

        /* Animating a box's size is layout work, and these boxes also carry a
           backdrop filter, which is the expensive half. Containment stops the
           work at the pill's own border and keeps the rest of the page out of
           it; will-change warns the compositor before the first frame rather
           than during it. Both are scoped to the two surfaces that actually
           resize, never applied page-wide. */
        .zn-pill, .zn-phone-pill {
          contain: layout paint;
          will-change: width, min-width;
        }

        /* The height half. Animating grid-template-rows between 0fr and 1fr
           is the one way to transition to an auto height in CSS without
           hard-coding a pixel value the contents would eventually outgrow.
           Visibility is stepped so tray links leave the focus order only once
           the tray has finished closing. */
        .zn-drawer {
          transition: grid-template-rows 440ms cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0s linear 440ms;
        }
        .zn-drawer[data-open="true"] { transition-delay: 0s, 0s; }

        /* The two corner controls. Anchored to the bottom of the screen, so
           height added by the tray pushes the surface upward, out of the
           corner; width is animated on the same curve as the header pill so
           every surface on the page opens the same way. */
        .zn-corner { transition: width 460ms cubic-bezier(0.22, 1, 0.36, 1); }

        /* The phone header opens in two beats: out to the sides first, then
           down. Closing runs it backwards, the pages folding away before the
           pill narrows, so the two movements never fight over the same
           moment. The delays are what sequence them: on the way open the
           width goes first and the tray waits; on the way closed the tray
           goes first and the width waits.

           min-width rather than width, so the closed size is still whatever
           the contents measure and only the opening is a number. */
        .zn-phone-pill { transition: min-width 380ms cubic-bezier(0.22, 1, 0.36, 1) 220ms; }
        .zn-phone-pill[data-open="true"] { transition-delay: 0s; }
        .zn-phone-drawer {
          transition: grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0s linear 300ms;
        }
        .zn-phone-drawer[data-open="true"] { transition-delay: 200ms, 200ms; }

        /* Glass, and it means it: the light behind the page is what tints
           these. saturate pulls the colour out of whatever the blur picked up,
           so the control in the bottom corner takes on the animation rather
           than sitting on top of it. */
        .zn-glass {
          background: rgba(255, 255, 255, 0.5);
          -webkit-backdrop-filter: blur(22px) saturate(190%);
          backdrop-filter: blur(22px) saturate(190%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5),
                      0 0 0 1px rgba(0, 0, 0, 0.05),
                      0 10px 34px rgba(17, 17, 17, 0.07);
        }
        /* Backdrop filters are a stated accessibility preference for some
           readers, and unsupported in a few engines. Both land here. */
        @media (prefers-reduced-transparency: reduce) {
          .zn-glass { background: rgba(255, 255, 255, 0.94); -webkit-backdrop-filter: none; backdrop-filter: none; }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .zn-glass { background: rgba(255, 255, 255, 0.92); }
        }

        .zn-list { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .zn-list::-webkit-scrollbar { width: 6px; }
        .zn-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.16); border-radius: 3px; }

        /* ── The deck ─────────────────────────────────────────────────────
           Percentages, never viewport units. The root ZoomLock writes CSS
           zoom and vh resolves BEFORE that scale is applied, so a "100dvh"
           panel in an 85%-zoomed window is short by a seventh and the two
           screens would never line up. The deck is a fixed box measured
           against the real viewport; a panel at half of a track at twice
           the deck is exactly one screen at any zoom. */
        #zn-deck { position: fixed; inset: 0; overflow: hidden; }
        #zn-track {
          position: absolute; inset: 0; height: 200%;
          transform: translateY(calc(var(--deck, 0) * -50%));
          transition: transform 1020ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        /* Each panel is its own compositing layer. Without this the move is a
           repaint of two full screens per frame — one of them carrying a 9vh
           blur — instead of two ready-made layers being slid.

           Layout containment only, never paint: paint containment clips a
           panel's contents to its own box, which cut the hero's light dead
           along the seam and left a ruled line between the two screens. The
           light has to be allowed to cross. (No backticks in here — this
           whole block is a template literal, and one would end it.) */
        .zn-panel {
          position: relative; height: 50%;
          transform: translateZ(0);
          contain: layout;
        }
        /* The light is the single most expensive thing on the page to paint,
           and it now travels. Rasterise it once and move the result. */
        #zn-glow { will-change: transform; transform: translateZ(0); }
        /* Its breathing stops for the length of the move. A 9vh blur over an
           animating box has to be re-rasterised on every frame, and doing that
           while the deck is also travelling is what dragged the move down to a
           dozen frames. Nobody can see a nineteen-second breath during a
           one-second move; everybody can see the move stutter. */
        #zn-deck[data-moving="true"] #zn-glow i { animation-play-state: paused; }

        /* The face and the light: hero furniture, gone once the hero is. Kept
           in the document and faded rather than unmounted, so the trays do not
           have to rebuild themselves on the way back up. */
        .zn-hero-only {
          transition: opacity 380ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0s linear 0s;
        }
        .zn-hero-only[data-lit="false"] {
          opacity: 0; visibility: hidden; pointer-events: none;
          transform: translateY(14px);
          transition-delay: 0s, 0s, 380ms;
        }

        /* ── Section two ──────────────────────────────────────────────────
           A window onto the product, on the same lit paper as the hero and
           built out of the same three values: the header pill's surface, the
           header pill's hairline ring, and nothing else. Every rule below is
           achromatic; the only colour on this page is still the light. */
        /* Two columns. The window is the left one and the word the right —
           dir is rtl here, so the word is the FIRST child and the window the
           second. The word takes the top of its column rather than its middle,
           so it reads against the head of the window rather than its waist. */

        /* One stage, layered. The window sits ON the word rather than beside
           it: the word is the ground and the product is what stands on it. */
        /* The single cell is declared, never left to auto. The window inside
           asks for a height in per cent, and a per cent of an auto-sized row
           is circular: the row sizes to the window and the window sizes to the
           row, so the cap stops applying and the tallest card — the picker,
           with eight tiles — pushes the window off the bottom of the screen
           and then snaps back when a shorter card replaces it. That snap is
           what the first scroll looked like. */
        .zn-build {
          position: absolute; inset: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          place-items: center;
          padding: calc(var(--inset) + 3.4rem) var(--gut) calc(var(--inset) + 0.4rem);
        }
        .zn-stagebox {
          position: relative; z-index: 1;
          width: min(100%, 960px); height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px;
        }

        /* The only control in the section. Two real choices instead of a
           minute of waiting for the other template to come round, and quiet
           enough to belong on this page: a hairline pill, obsidian when it is
           the one being watched. */
        .zn-switch { display: flex; gap: 6px; flex: 0 0 auto; }
        .zn-switch button {
          padding: 7px 16px; border-radius: 999px;
          font-size: 11.5px; line-height: 1; color: ${STONE};
          background: rgba(255, 255, 255, 0.6);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: background 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-switch button:hover { color: ${OBSIDIAN}; }
        .zn-switch button[data-on="true"] {
          background: ${OBSIDIAN}; color: ${PAPER}; box-shadow: none;
        }

        /* The build word, in the hero's own face and cycling the same four
           forms on the same roll. Behind the window, running out past its top
           and its side.

           Solid, and one piece. It was hollowed to a hairline edge first, and
           on Arabic that is wrong twice over: the stroke draws the seam where
           each letter joins the next, so a connected word reads as separate
           letters wired together — the opposite of what the script does. A
           single soft fill is one continuous shape, which is what the word is. */
        .zn-word {
          position: absolute; z-index: 0; pointer-events: none;
          top: clamp(0.5rem, 3vh, 2.5rem); inset-inline-start: clamp(0.5rem, 2vw, 3rem);
          display: inline-grid; grid-template-columns: minmax(0, 1fr);
          padding-block: 0.2em; margin-block: -0.2em;
          clip-path: inset(0 -100vw);
          font-size: clamp(5.5rem, 15vw, 15rem);
          line-height: 1.24; white-space: nowrap;
          /* Solid ink, faded as a LAYER. A semi-transparent colour is painted
             per glyph, and connected Arabic letters overlap at every join — so
             each join composited twice and came out visibly darker than the
             strokes either side of it. Element opacity flattens the word first
             and fades the result, which is one even tone throughout. */
          color: ${OBSIDIAN};
          opacity: 0.20;
          -webkit-font-smoothing: antialiased;
        }
        /* Anchored to the start edge, never centred. The four words share one
           grid cell, so the cell is as wide as the LONGEST of them — centre a
           three-letter word in a six-letter cell and it floats a hundred and
           fifty pixels off the edge it is supposed to be sitting against.
           Same trap the hero's columns hit, and the same tell. */
        .zn-word > span {
          grid-area: 1 / 1; justify-self: start; white-space: nowrap;
          transition: transform 780ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-word > span[data-state="idle"] { opacity: 0; transform: translateY(130%); pointer-events: none; }
        .zn-word > span[data-state="out"] {
          opacity: 0; transform: translateY(-130%);
          transition: transform 420ms cubic-bezier(0.55, 0.085, 0.68, 0.53),
                      opacity 260ms linear;
        }
        .zn-word > span[data-state="in"] { opacity: 1; transform: none; }
        .zn-app {
          position: relative;
          /* Basis, not height. The switcher is its sibling now, and a window
             at height:100% leaves it nothing to stand on. */
          width: 100%; flex: 0 1 640px; min-height: 0;
          border-radius: 26px;
          /* No backdrop-filter. The window used to blur what was behind it,
             which meant every frame of the deck move re-ran a full-surface
             blur — the single biggest cause of the lag going down. The light
             behind it was already blurred to 9vh, so a flat translucent white
             is indistinguishable and costs nothing. */
          background: rgba(255, 255, 255, 0.78);
          box-shadow: ${RING};
          overflow: hidden;
          contain: layout paint;
          display: grid; grid-template-rows: auto minmax(0, 1fr);
        }
        /* Where this is. Not chrome for its own sake: the path is what says
           the picker really did open the wizard, and it is the only thing on
           the surface that reports rather than asks. */
        .zn-path {
          padding: 15px 22px 9px;
          font-size: 11px; line-height: 1; color: ${STONE};
        }
        .zn-path b { font-weight: 500; color: ${OBSIDIAN}; }
        .zn-stage { position: relative; min-height: 0; padding: 6px 22px 22px; display: grid; }
        /* The measured fit. Content is laid out at its natural size, read, and
           scaled by the ratio that makes it sit inside the window — so nothing
           is ever cut, whatever the card holds or how small the screen is.
           align-content: center rather than a stretched child, because a child
           stretched to the window measures as the window and the ratio would
           always come back 1. */
        .zn-fit {
          min-height: 0; display: grid; align-content: center; justify-items: stretch;
          transform: scale(var(--fit, 1));
          transform-origin: center center;
        }

        /* The eight. This is also what the section rests as: if nothing ever
           runs, a reader still sees every template the product offers. */
        .zn-picker { display: flex; flex-direction: column; }
        .zn-picker h2 { font-size: 15px; font-weight: 500; color: ${OBSIDIAN}; margin: 0 2px 14px; }
        /* Rows sized to their contents, not stretched to fill the window: the
           cover sets the height and the two lines under it follow. */
        .zn-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }
        .zn-tile {
          position: relative; border-radius: 13px; padding: 9px 9px 12px;
          display: flex; flex-direction: column; gap: 2px;
          text-decoration: none; overflow: hidden;
          background: rgba(255, 255, 255, 0.46);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
          transition: box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      background 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* The one place on the page that carries colour of its own. What a
           template looks like is the information a picker owes the reader, and
           eight tiles that only name themselves cannot give it. Ringed rather
           than shadowed, like every other surface here. */
        .zn-tile .cover {
          display: block; width: 100%; height: 96px;
          object-fit: cover; object-position: top center;
          border-radius: 8px; margin-bottom: 8px;
          background: rgba(0, 0, 0, 0.04);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
        }
        .zn-tile[data-on="true"] {
          background: rgba(255, 255, 255, 0.88);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.32);
        }
        .zn-tile .name { display: block; font-size: 15px; font-weight: 500; line-height: 1.3; color: ${OBSIDIAN}; }
        .zn-tile .tag { display: block; font-size: 10px; line-height: 1.5; color: ${STONE}; }
        /* A hover affordance, so its hidden state is a state and not an
           entrance: with no pointer on the tile there is nothing to show. It
           takes the row it is given rather than floating over the name. */
        .zn-tile .go {
          display: block; margin-top: 8px;
          font-size: 10.5px; line-height: 1; color: ${OBSIDIAN};
          opacity: 0; transform: translateY(-3px);
          transition: opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-tile[data-on="true"] .go { opacity: 1; transform: none; }

        /* One card, forward. The keyframe borrows the hidden state for its
           own duration and rests visible, the same rule the words and the
           claim are built on. */
        /* Centred in the window, not stacked against the top of it. The eight
           cards are wildly different heights — a phone number is one field and
           the menu is a whole read — and anchoring them to the top leaves the
           short ones stranded above a half-empty frame. Centred, every card
           sits in the same place and the window reads as roomy rather than
           unfinished. */
        .zn-card { display: flex; flex-direction: column;
                   animation: zn-card-in 620ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
        @keyframes zn-card-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: none; }
        }
        .zn-head { padding: 2px 2px 15px; }
        .zn-head h2 { font-size: 16px; font-weight: 500; color: ${OBSIDIAN}; }
        .zn-head p { margin-top: 4px; font-size: 11.5px; line-height: 1.6; color: ${STONE}; }
        .zn-body { flex: 0 0 auto; }

        .zn-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .zn-f { display: block; }
        .zn-f.wide { grid-column: 1 / -1; }
        .zn-f .lab {
          display: block; margin-bottom: 5px;
          /* No tracking. The house rule bans NEGATIVE letter-spacing on Arabic
             because the letterforms connect — and positive tracking breaks the
             same joins from the other side, which is exactly what made these
             labels read as amateur. Arabic is set solid, at every size. */
          font-size: 10.5px; font-weight: 500; color: ${STONE};
        }
        .zn-in {
          display: block; min-height: 37px; padding: 9px 12px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.6);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          font-size: 12.5px; line-height: 1.5; color: ${OBSIDIAN};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-in.area { min-height: 76px; white-space: pre-wrap; }
        .zn-in[data-on="true"] { box-shadow: inset 0 0 0 1.5px rgba(0, 0, 0, 0.42); }
        .zn-in i { font-style: normal; color: rgba(102, 102, 102, 0.5); }
        .zn-in em { font-style: normal; }
        /* The caret belongs to the field being written and to no other, and
           it is the only thing on the page besides the claim that blinks. */
        .zn-in[data-on="true"] em::after {
          content: ""; display: inline-block;
          width: 1px; height: 1em; margin-inline-start: 1px;
          vertical-align: -0.14em; background: ${OBSIDIAN};
          animation: zn-blink 1.05s steps(1) infinite;
        }

        .zn-lab { margin: 17px 0 8px; font-size: 10.5px; font-weight: 500; color: ${STONE}; }
        .zn-lab span { opacity: 0.6; }
        .zn-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .zn-chip {
          padding: 6px 12px; border-radius: 999px;
          font-size: 11.5px; line-height: 1; color: ${OBSIDIAN};
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          transition: background 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-chip[data-on="true"] { background: ${OBSIDIAN}; color: ${PAPER}; box-shadow: none; }

        /* The style card, built the way the WIZARD builds it: three swatches
           at the top in primary / accent / surface order, the vibe in the
           accent colour and the preset's own heading font, the name under it
           in that same face, the description in the preset's muted colour,
           and a "محدّد" badge on the chosen one. Same card in both templates,
           because it is the same card in both wizards. */
        .zn-presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .zn-preset {
          position: relative; overflow: hidden;
          min-height: 150px; padding: 14px; border-radius: 16px;
          display: flex; flex-direction: column; align-items: flex-start;
          border: 2px solid transparent;
          transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-preset[data-on="true"] { transform: translateY(-3px); }
        .zn-preset .dots { display: flex; gap: 5px; margin-bottom: 14px; }
        .zn-preset .dots em {
          display: block; width: 20px; height: 20px; border-radius: 999px;
          border: 1px solid transparent;
        }
        /* Latin, in the preset's own display face — tracking is allowed here
           and nowhere else on this surface, because none of it is Arabic. */
        .zn-preset .vibe, .zn-preset b, .zn-preset .desc { text-align: left; align-self: stretch; }
        .zn-preset .vibe {
          font-style: normal; font-size: 9.5px; line-height: 1.2;
          text-transform: uppercase; letter-spacing: 0.2em;
        }
        .zn-preset b { margin-top: 3px; font-size: 17px; font-weight: 400; line-height: 1.2; }
        .zn-preset .desc { margin-top: 6px; font-size: 10px; line-height: 1.45; opacity: 0.85; }
        .zn-preset .picked {
          position: absolute; inset-inline-end: 10px; top: 10px;
          padding: 2px 7px; border-radius: 999px;
          background: ${OBSIDIAN}; color: ${PAPER};
          font-size: 8.5px; line-height: 1.4;
        }

        .zn-hours { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 20px; }
        .zn-hour {
          display: grid; grid-template-columns: 58px 1fr 14px;
          align-items: center; gap: 10px; padding: 5px 2px; font-size: 11.5px;
        }
        .zn-hour b { font-weight: 500; color: ${OBSIDIAN}; }
        .zn-hour i { font-style: normal; color: ${STONE}; }
        .zn-hour[data-off="true"] i { color: ${OBSIDIAN}; }
        .zn-hour u {
          width: 14px; height: 14px; border-radius: 4px; text-decoration: none;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);
          transition: background 240ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-hour u[data-on="true"] { background: ${OBSIDIAN}; box-shadow: none; }

        /* What came back from the read. The rows arrive in order rather than
           all at once, so the menu is watched filling rather than found full. */
        .zn-menu { margin-top: 15px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px 22px; }
        .zn-cat { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .zn-cat > b { margin-bottom: 2px; font-size: 11.5px; font-weight: 500; color: ${OBSIDIAN}; }
        .zn-dish {
          display: flex; justify-content: space-between; gap: 12px;
          font-size: 11.5px; line-height: 1.5; color: ${STONE}; min-width: 0;
          animation: zn-dish-in 440ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn-dish em { font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .zn-dish i { font-style: normal; color: ${OBSIDIAN}; }
        .zn-cat:nth-child(2) .zn-dish { animation-delay: 90ms; }
        .zn-cat:nth-child(3) .zn-dish { animation-delay: 180ms; }
        .zn-cat:nth-child(4) .zn-dish { animation-delay: 270ms; }
        @keyframes zn-dish-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }

        /* The services list. This template's centrepiece is the list being
           built rather than a photograph being read, so each service arrives
           as its own small block and the "add another" control stays under
           them the whole time — the cursor really does press it. */
        .zn-services { display: flex; flex-direction: column; gap: 8px; }
        .zn-service {
          display: grid; grid-template-columns: 64px minmax(0, 1fr);
          align-items: start; gap: 12px;
          padding: 11px 13px; border-radius: 13px;
          background: rgba(255, 255, 255, 0.6);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          animation: zn-service-in 480ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes zn-service-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .zn-service .no { font-size: 9.5px; color: ${STONE}; padding-top: 3px; }
        .zn-service .body {
          display: grid; grid-template-columns: minmax(0, 1fr) auto;
          align-items: baseline; gap: 2px 10px; min-width: 0;
        }
        .zn-service b { font-size: 12.5px; font-weight: 500; color: ${OBSIDIAN}; }
        .zn-service i { font-style: normal; font-size: 11.5px; color: ${OBSIDIAN}; }
        .zn-service .desc {
          grid-column: 1 / -1; font-size: 11px; line-height: 1.5; color: ${STONE};
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .zn-service .badge {
          grid-column: 1 / -1; justify-self: start; margin-top: 4px;
          padding: 3px 8px; border-radius: 999px;
          font-size: 9.5px; line-height: 1; color: ${OBSIDIAN};
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
        }
        .zn-addservice {
          display: block; padding: 11px; border-radius: 13px; text-align: center;
          font-size: 11.5px; color: ${STONE};
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
        }

        .zn-note { margin-bottom: 15px; font-size: 11.5px; line-height: 1.6; color: ${STONE}; }
        .zn-note b { font-weight: 500; color: ${OBSIDIAN}; }
        .zn-shots { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        /* Fixed heights, not an aspect ratio. A square slot on a 730px card is
           170px tall, and five of them plus the banner overran the window by
           about the height of one row — which, on a centred card, gets cut off
           the bottom. */
        .zn-shot {
          position: relative; overflow: hidden;
          height: 94px; border-radius: 12px;
          background: rgba(255, 255, 255, 0.4);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          transition: box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-shot.hero { grid-column: 1 / -1; height: 132px; }
        .zn-shot[data-filled="true"] { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16); }
        /* The picture lands rather than blinks: it rests visible, and the
           keyframe borrows the hidden state for its own duration only. */
        .zn-shot img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
          animation: zn-shot-in 520ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes zn-shot-in {
          from { opacity: 0; transform: scale(1.05); }
          to   { opacity: 1; transform: none; }
        }

        /* The product's own analyzer, mounted whole rather than reproduced.
           The page takes the wizard's amber off it and changes nothing else:
           that palette belongs to the wizard, and this page has no colour but
           the light. Its emoji tile and its second tip go with the colour —
           the card has to stay small. */
        .zn-analyzer > div {
          margin-bottom: 0 !important; padding: 15px !important;
          border-radius: 14px !important; border-color: rgba(0, 0, 0, 0.1) !important;
          background: rgba(255, 255, 255, 0.55) !important;
          -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
        }
        .zn-analyzer > div > div:first-child > div:first-child { display: none !important; }
        .zn-analyzer > div > div:first-child > div:last-child > p:nth-child(3) { display: none !important; }
        .zn-analyzer p { color: ${STONE} !important; font-size: 11.5px !important; line-height: 1.6 !important; }
        .zn-analyzer p:first-child { color: ${OBSIDIAN} !important; font-weight: 500 !important; }
        .zn-analyzer > div > p { color: ${OBSIDIAN} !important; }
        .zn-analyzer button {
          border-color: transparent !important;
          background: rgba(255, 255, 255, 0.82) !important; color: ${OBSIDIAN} !important;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12) !important;
        }
        .zn-analyzer button.bg-foreground {
          background: ${OBSIDIAN} !important; color: ${PAPER} !important; box-shadow: none !important;
        }
        .zn-analyzer img { filter: saturate(0.15); }

        /* The wizard's closing bar. Obsidian, which is the one place on this
           page the ramp inverts — the same inversion the account control and a
           chosen chip already use, so it reads as the end of the form rather
           than as a new colour. Rises into the window and rests there. */
        .zn-finish {
          position: absolute; inset-inline: 22px; bottom: 20px; z-index: 4;
          display: flex; align-items: center; justify-content: space-between; gap: 18px;
          padding: 14px 16px; border-radius: 18px;
          background: ${OBSIDIAN}; color: ${PAPER};
          animation: zn-finish-in 560ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes zn-finish-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        .zn-finish .head { font-size: 12px; font-weight: 500; line-height: 1.3; }
        .zn-finish .sub { margin-top: 3px; font-size: 10.5px; line-height: 1.4; opacity: 0.62; }
        .zn-finish .go {
          flex: 0 0 auto; padding: 9px 20px; border-radius: 999px;
          background: ${PAPER}; color: ${OBSIDIAN};
          font-size: 11.5px; font-weight: 500; line-height: 1;
          transition: opacity 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-finish[data-going="true"] .go { opacity: 0.6; }

        /* The pointer. Obsidian on a paper outline, so it reads over a field,
           over a chip and over the analyzer's own dark button alike. */
        .zn-cursor {
          position: absolute; left: 0; top: 0; z-index: 5; pointer-events: none;
          transition: transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-cursor svg {
          display: block; transform-origin: 1px 1px;
          transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-cursor[data-press="true"] svg { transform: scale(0.78); }

        /* Below the laptop the two columns stack: the word takes the top and
           the window sits under it, smaller, because at this width a window
           sized to the screen is the whole screen and the word has nowhere to
           be. Same order either way — word first, window second. */
        @media (max-width: 1023px) {
          /* The window drops well below the word rather than sitting on it.
             At this width the two are fighting over the same strip of screen,
             and the word — which is the point of the section — was losing. The
             padding buys it that strip outright. */
          .zn-build { padding-top: calc(var(--inset) + 6rem); }
          .zn-stagebox { width: 100%; justify-content: flex-end; }
          .zn-app { flex-basis: 520px; }
          /* Narrower screens have no room beside the window, so the word runs
             behind it rather than out past it — still one piece, still the
             ground the window stands on, just further under. It starts below
             the header rather than at the top of the panel: on a phone the two
             share the same strip of screen, and the word was landing on the
             pill and losing its own ascenders off the top edge. */
          .zn-word {
            font-size: clamp(4.5rem, 22vw, 9rem);
            top: calc(var(--inset) + 2.4rem);
          }
        }
        @media (max-width: 767px) {
          .zn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .zn-row, .zn-hours, .zn-menu { grid-template-columns: minmax(0, 1fr); }
          .zn-presets { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .zn-shots { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          /* Tall enough to reach up under the word and just touch it. Nothing
             can be cut any more — the fit pass scales whatever is inside to
             the room it has — so the window is free to take the space. */
          .zn-app { flex-basis: 660px; }
          .zn-path { padding: 12px 16px 7px; }
          .zn-stage { padding: 4px 16px 16px; }
          /* The cards have to fit a phone-sized window, so the furniture that
             only exists to be looked at gives up its room first. */
          .zn-preset { min-height: 96px; padding: 12px; }
          .zn-shot { height: 66px; }
          .zn-shot.hero { height: 92px; }
          .zn-in.area { min-height: 62px; }
        }

        @media (prefers-reduced-motion: reduce) {
          #zn-track { transition: none; }
          .zn-card, .zn-dish, .zn-finish, .zn-service, .zn-shot img { animation: none; }
          .zn-finish .go, .zn-word > span, .zn-hero-only { transition: none; }
          .zn-cursor, .zn-cursor svg, .zn-tile, .zn-tile .go, .zn-chip,
          .zn-preset, .zn-hour u, .zn-in { transition: none; }
          .zn-in[data-on="true"] em::after { animation: none; }
          .zn-words > span { animation: none; }
          .zn-w, .zn-slot { transition: none; }
          .zn-pill, .zn-drawer, .zn-corner, .zn-phone-pill, .zn-phone-drawer { transition: none; }
          #zn-glow i { animation: none; }
          #zn-claim .line[data-state="read"] > .text { animation: none; clip-path: none; }
          #zn-claim .line > .caret { display: none; }
          #zn-claim .line, #zn-claim .dot { transition: none; }
        }
      ` }} />

      {/* Header. A floating pill rather than a bar: it sits on the paper with
          a hairline ring and no underline, so nothing divides the page.
          Fixed, so it costs the hero no vertical space and the words stay
          dead centre in the viewport. */}
      <header
        id="pill-header"
        ref={headerRef}
        dir="rtl"
        className={`${ui.className} fixed inset-x-0 top-[var(--inset)] z-50 flex justify-center px-[var(--gut)]`}
      >
        <div className="w-full max-w-full md:w-auto">

          {/* Phone: a small pill, not a bar across the top. Closed it is the
              menu, the mark and the account and nothing else; tapping the menu
              widens the same surface sideways and the pages arrive in a row
              inside it, rather than dropping a panel down over the page.

              It opens on both axes at once: min-width pushes the pill wider
              from the middle, so it reaches out to the left and the right
              together, while the tray underneath takes the pages down.

              Width comes from the contents, never from a number: the pill is
              `fit-content` with min-width doing the opening, so the closed
              state is exactly as wide as the mark, the menu and the account
              actually measure. Pinning a closed width here instead is what
              clipped the call to action into the mark, since that measurement
              changes with the account state and with the font. */}
          <div
            className="zn-phone-pill mx-auto w-fit max-w-full overflow-hidden rounded-[22px] backdrop-blur-[12px] md:hidden"
            data-open={menuOpen}
            style={{
              background: "rgba(255,255,255,0.72)",
              boxShadow: RING,
              minWidth: menuOpen ? "min(86vw, 268px)" : "184px",
            }}
          >
            <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-1.5">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="pill-menu"
                aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/[0.05]"
                style={{ color: OBSIDIAN }}
              >
                {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
              </button>

              <Link href="/?home=1" aria-label="زينيا" className="flex shrink-0 items-center justify-self-center px-1.5">
                {/* Pure black is permitted here: the reference reserves #000 for
                    logo marks and graphic glyphs, nowhere else. */}
                <ZenyaMark className="h-[16px] text-black" />
              </Link>

              <span className="flex shrink-0 items-center justify-self-end">{accountControl}</span>
            </div>

            {/* The pages, taken down rather than squeezed into the row. Same
                grid-rows technique as every other tray on the page, but on its
                own timing so it waits for the width. */}
            <div
              className="zn-phone-drawer grid"
              data-open={menuOpen}
              style={{
                gridTemplateRows: menuOpen ? "1fr" : "0fr",
                visibility: menuOpen ? "visible" : "hidden",
              }}
            >
              <div className="w-0 min-w-full overflow-hidden">
                <nav id="pill-menu" className="px-1.5 pb-1.5 pt-0.5">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-[10px] px-3 py-2.5 text-[14px] leading-none transition-colors duration-150 hover:bg-black/[0.04] hover:text-[#171717]"
                      style={{ color: STONE }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Tablet and up: the same one surface, growing on both axes. The
              bar keeps a definite resting width so the sideways movement has
              something to animate, and justify-between hands the slack to the
              gaps: opening pushes the mark and the account apart while the
              tray comes down. */}
          <div
            className="zn-pill hidden overflow-hidden rounded-[24px] backdrop-blur-[12px] md:block"
            style={{
              background: "rgba(255,255,255,0.72)",
              boxShadow: RING,
              width: panel === "themes" ? PILL_THEMES : panel === "account" ? PILL_ACCOUNT : PILL_REST,
            }}
            /* Leaving the surface closes a hover-opened tray. A tray the
               reader opened by clicking their account stays put until they
               dismiss it. */
            onMouseLeave={() => setPanel((p) => (p === "themes" ? null : p))}
          >
            <div className="flex h-12 items-center justify-between gap-2 pe-1.5 ps-3">
              <Link
                href="/?home=1"
                aria-label="زينيا"
                className="flex shrink-0 items-center px-1"
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
                    aria-controls={item.panel ? "pill-tray" : undefined}
                    className="rounded-full px-3 py-2 text-[14px] leading-none transition-colors duration-150 hover:text-[#171717]"
                    style={{ color: panel === item.panel ? OBSIDIAN : STONE }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Reaching the account control puts the templates tray away,
                  the same as reaching any other item in the bar. Wrapped
                  rather than handled on the control itself, because signed
                  out it is a plain link and signed in it is a button. */}
              <span
                className="flex shrink-0 items-center"
                onMouseEnter={() => setPanel((p) => (p === "themes" ? null : p))}
              >
                <span className="me-1.5 h-5 w-px" style={{ background: "rgba(0,0,0,0.07)" }} aria-hidden />
                {desktopAccount}
              </span>
            </div>

            {/* `w-0 min-w-full` lets the tray fill whatever width the pill is
                currently at, without its own contents deciding that width. */}
            <div
              id="pill-tray"
              className="zn-drawer grid"
              data-open={!!panel}
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
                    <div className="grid grid-cols-2 gap-1">
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
                  </div>
                ) : (
                  <div className="px-1.5 pb-1.5 pt-0.5">
                    <div className="grid grid-cols-4 gap-x-1">
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

      {/* Two controls, one in each bottom corner: the face on the left, the
          light on the right. Each is a glass surface that grows out of its own
          button, upward and inward, because the surface is anchored to the
          corner it sits in. Same curve as the header pill, so everything on
          the page opens the same way. */}
      {/* Both controls belong to the hero: the face and the light are what the
          hero is made of, and neither has anything to say about the build
          section. They go out with the light rather than following the reader
          down the page. */}
      <div
        ref={typeRef}
        dir="rtl"
        data-lit={deck === 0}
        className={`${ui.className} zn-hero-only fixed bottom-[var(--inset)] left-[var(--gut)] z-40`}
      >
        <Corner
          open={corner === "type"}
          restWidth="104px"
          openWidth="min(78vw, 246px)"
          onEnter={() => enterCorner("type")}
          onLeave={leaveCorner}
          button={
            <button
              type="button"
              onClick={() => toggleCorner("type")}
              aria-expanded={corner === "type"}
              aria-controls="type-tray"
              className="flex h-10 w-full items-center gap-1.5 whitespace-nowrap px-3.5 text-[12.5px] leading-none"
              style={{ color: OBSIDIAN }}
            >
              <Type size={14} strokeWidth={1.6} />
              الخط
            </button>
          }
        >
          {/* Every row previews itself, which is the only honest way to pick a
              face. That does mean extending this pulls all 50 files; they are
              small, they cache, and none of them load until it is opened. */}
          <div id="type-tray" className="zn-list max-h-[min(52vh,340px)] overflow-y-auto px-1.5 pb-1 pt-1.5">
            {STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => pickType(st.id)}
                aria-pressed={st.id === styleId}
                className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5 transition-colors duration-150 hover:bg-black/[0.06]"
                style={{ background: st.id === styleId ? "rgba(0,0,0,0.06)" : "transparent" }}
              >
                <span
                  className={st.cls}
                  style={{ fontWeight: st.weight, color: OBSIDIAN, fontSize: 19, lineHeight: 1.6 }}
                >
                  ابن
                </span>
                <span
                  dir="ltr"
                  className="truncate text-[10px] leading-none"
                  style={{ color: st.id === styleId ? OBSIDIAN : STONE }}
                >
                  {st.name}
                </span>
              </button>
            ))}
          </div>
        </Corner>
      </div>

      <div
        ref={glowRef}
        dir="rtl"
        data-lit={deck === 0}
        className={`${ui.className} zn-hero-only fixed bottom-[var(--inset)] right-[var(--gut)] z-40`}
      >
        <Corner
          open={corner === "glow"}
          restWidth="112px"
          openWidth="min(72vw, 216px)"
          onEnter={() => enterCorner("glow")}
          onLeave={leaveCorner}
          button={
            <button
              type="button"
              onClick={() => toggleCorner("glow")}
              aria-expanded={corner === "glow"}
              aria-controls="glow-tray"
              className="flex h-10 w-full items-center gap-2 whitespace-nowrap px-3.5 text-[12.5px] leading-none"
              style={{ color: OBSIDIAN }}
            >
              {/* The button wears the mix it is currently set to. */}
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{
                  background: glow.grad === "none" ? "transparent" : glow.grad,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                }}
                aria-hidden
              />
              اللون
            </button>
          }
        >
          <div id="glow-tray" className="px-1.5 pb-1 pt-1.5">
            {GLOWS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => pickGlow(g.id)}
                aria-pressed={g.id === glowId}
                className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-2 transition-colors duration-150 hover:bg-black/[0.06]"
                style={{ background: g.id === glowId ? "rgba(0,0,0,0.06)" : "transparent" }}
              >
                <span
                  className="text-[13px] leading-none"
                  style={{ color: g.id === glowId ? OBSIDIAN : STONE }}
                >
                  {g.name}
                </span>
                <span
                  className="h-4 w-[68px] shrink-0 rounded-full"
                  style={{
                    background: g.grad === "none" ? "transparent" : g.grad,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                  }}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </Corner>
      </div>

      {/* The hero is the whole page: bare paper, no rules, no grid, nothing
          but the words.

          Fixed rather than h-[100dvh]. The root ZoomLock writes CSS `zoom` on
          <html>, and viewport units resolve BEFORE that scale is applied: at
          the 85% cap a 720px window gives a 573px "100dvh" box, which parked
          the words a slab above true centre. A fixed layer is measured
          against the real viewport, so they are centred on the reader's
          screen at any zoom. Safe here because the page is one screen and the
          body already has overflow: hidden. */}
      {/* The deck. Two screens on one track, a gesture apart. Fixed rather
          than any height in viewport units, for the reason below; the track
          is twice the deck and each panel is half the track, so a panel is
          exactly one screen whatever zoom the root is writing. */}
      <div id="zn-deck" data-moving={!settled} style={{ background: PAPER }}>
        <div id="zn-track" style={{ "--deck": deck } as React.CSSProperties}>
        <div className="zn-panel">
      <main
        id="blank-home"
        dir="rtl"
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden={deck !== 0}
      >
        {/* The light belongs to the hero, not to the page. It sits inside the
            hero's own panel so it travels up with it: the colour leaves when
            the hero does, rather than sitting under the whole site for ever.
            Promoted to its own layer, or the deck would have to re-rasterise
            a 9vh blur on every frame of the move. */}
        <div id="zn-glow" aria-hidden style={{ "--glow": glow.grad } as React.CSSProperties}>
          <div className="foot"><i /></div>
          <div className="head"><i /></div>
        </div>

        {/* Revealed in sequence on the first load: the order is the product,
            build then manage then publish. Slow and short-travelled so it
            settles rather than announces itself. Changing the face swaps the
            type in place, with no movement of its own. */}
        <h1
          id="hero-words"
          ref={wordsRef}
          className={`${type.cls} zn-words relative z-[1] flex flex-nowrap items-baseline justify-center gap-x-[0.22em] text-center`}
          style={{
            color: OBSIDIAN,
            fontWeight: type.weight,
            lineHeight: type.lh,
            "--lh": type.lh,
          } as React.CSSProperties}
        >
          {[0, 1, 2].map((col) => (
            <span
              key={col}
              className="zn-slot"
              style={{
                animationDelay: `${0.15 + col * 0.18}s`,
                "--i": col,
              } as React.CSSProperties}
            >
              {/* All four words for this column are stacked in one grid cell,
                  so the column is always as wide as its widest word and the
                  line never reflows mid-change. Only one of them is ever in
                  view; the rest wait below the clip. */}
              {WORD_SETS.map((row, r) => (
                <span
                  key={r}
                  className="zn-w"
                  data-state={r === phase.cur ? "in" : r === phase.prev ? "out" : "idle"}
                  aria-hidden={r !== phase.cur}
                >
                  {row[col]}
                </span>
              ))}
            </span>
          ))}
        </h1>

        {/* The claim, typed once over the light. Real content, not decoration,
            so it is in the document and readable with animation off. */}
        {/* The wrapper runs ltr so the dot is physically on the left in both
            languages; the sentence carries its own direction. */}
        <p
          id="zn-claim"
          dir="ltr"
          className={`${ui.className} text-[12px] md:text-[13px]`}
          style={{ color: STONE }}
        >
          {/* Only the sentence being read is on the page, so the box is its
              width: the caret ends where the words end, and the dot sits
              against the sentence rather than against a box sized for the
              other language. The key restarts the typing on each change. */}
          <span className="wrap">
            <span
              key={CLAIMS[claim].id}
              className="line leading-none"
              dir={CLAIMS[claim].dir}
              data-state={beat}
            >
              <span className="text">{CLAIMS[claim].text}</span>
              <span className="caret" aria-hidden />
            </span>
            <span className="dot" data-side={dotSide} data-lit={beat !== "between"} aria-hidden />
          </span>
        </p>
      </main>
        </div>

        {/* Section two: ابن, the first of the three words, shown rather than
            argued for. It drives the product's own path — the eight
            templates, the wizard behind the one that is picked, and that
            wizard's own form filling itself in, one card at a time. */}
        <div className="zn-panel" aria-hidden={deck !== 1}>
          {/* Held until the deck has actually landed. Starting the script on
              the gesture put a cursor animation, a network prefetch and eight
              cards' worth of React on the same frames as the move, which is
              what the move was competing with. */}
          <BuildSection
            active={deck === 1 && settled}
            uiClass={appUi.className}
            /* Tajawal 500, not the hero's chosen face and not its 900. The
               hero's line is sized to fill a screen, where 900 reads as
               authority; the same cut blown up to 200px behind a window is a
               slab, and Arabic at that scale wants stroke contrast rather than
               mass. The face rail is hero furniture and is hidden here anyway,
               so this word is not its to set. */
            wordClass={display.className}
            wordWeight={500}
            wordLh={1.28}
          />
        </div>
        </div>
      </div>
    </>
  )
}
