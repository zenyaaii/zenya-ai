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
import ManageSection from "./ManageSection"
import PublishSection from "./PublishSection"
import FooterSection from "./FooterSection"

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

/* What the page opens with, and what it stays as: the light is OFF. Bare
   paper, the three words, and nothing else — and it does not change on its
   own. There was an auto-reveal here that lit the page after 2.4s to teach the
   control by demonstration; it is gone. The hero is uncoloured unless a reader
   asks for colour. */
const DEFAULT_TYPE = "tajawal-900"
const DEFAULT_GLOW = "none"
/* How long the control wears the light's NAME before going back to "اللون". */
const NAME_HOLD = 2600

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
  /* The demo's own pricing screen, not the live one. Both exist: /pricing is
     the page that takes money today and is untouched; /demo/pricing is the
     candidate in this deck's style, reviewable on the real domain without
     changing what a customer pays. Point this back at /pricing if the
     candidate is ever promoted. */
  { href: "/demo/pricing", label: "الأسعار" },
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
  /* Whether the light's control is wearing the palette's name. Set by any
     change to the light, which now only ever means a deliberate pick. */
  const [glowNamed, setGlowNamed] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const type = STYLES.find((s) => s.id === styleId) ?? STYLES[0]
  const glow = GLOWS.find((g) => g.id === glowId) ?? GLOWS[0]
  /* The last light that was actually a light. بلا has no gradient of its own,
     so without this the paint would vanish on the frame the fade-out starts
     and there would be nothing left to fade. */
  const lastGrad = useRef(GLOWS[0].grad)
  useEffect(() => { if (glow.grad !== "none") lastGrad.current = glow.grad }, [glow.grad])
  const lit = glow.grad !== "none"
  const paintGrad = lit ? glow.grad : lastGrad.current

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

  /* Whenever the light changes, its control says so: the swatch replays, a
     single ring goes out from the button, and the label wears the palette's
     name for a moment before going back to "اللون". This is what teaches the
     control — not a tooltip, the thing itself moving at the moment the page
     changes colour. It runs once per change and rests, like everything here. */
  useEffect(() => {
    if (glowId === DEFAULT_GLOW) return
    setGlowNamed(true)
    const id = setTimeout(() => setGlowNamed(false), NAME_HOLD)
    return () => clearTimeout(id)
  }, [glowId])

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
  /* ?edit=1 turns on the composer. Read after mount, never during render: the
     server has no query string to look at and the first paint has to match it.
     Without it nothing about the composer reaches the browser. */
  const [edit, setEdit] = useState(false)
  /* Section three carries the page's one deliberate colour, and it is the
     dashboard's own primary. Chosen by looking at both on the real page;
     ?accent=gold still reaches the other one, which is worth keeping for as
     long as the choice is worth revisiting. */
  const [accent, setAccent] = useState<"gold" | "violet">("violet")
  /* How a card is made on the dark ground. The product's own dashboard uses a
     bordered card, so dropping the boxes entirely would drift from the screen
     this section is imitating; what changes is how the same card is
     materialised. ?cards=fill|well|lit to compare on the real page. */
  const [cards, setCards] = useState<"ring" | "fill" | "well" | "lit">("lit")
  /* Section four's ground — the page's second and last deliberate colour, and
     the only one that is a whole screen rather than an accent on one. Three
     depths of the same evergreen were built so the choice could be made by
     looking at them on the real page rather than in the abstract, which is
     how ادر's accent was settled; ?ground=pine|deep reaches the darker two. */
  const [ground, setGround] = useState<"emerald" | "pine" | "deep">("emerald")
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      setEdit(q.get("edit") === "1")
      if (q.get("accent") === "gold") setAccent("gold")
      const c = q.get("cards")
      if (c === "fill" || c === "well" || c === "lit" || c === "ring") setCards(c)
      const g = q.get("ground")
      if (g === "deep" || g === "emerald" || g === "pine") setGround(g)
    } catch { /* ignore */ }
  }, [])

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
    const PANELS = 5
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
      data-cta="1"
      title={user.email}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-medium leading-none text-white transition-opacity duration-150 hover:opacity-85"
      style={{ background: OBSIDIAN }}
    >
      {initial}
    </Link>
  ) : (
    <Link
      href={portal.signup}
      data-cta="1"
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
      data-cta="1"
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

        /* ── The floating surfaces ────────────────────────────────────
           The header pill and both corner controls. They are the only things
           on this page a reader can press, and they have to look it — on bare
           paper, on the light, and on the ground of every screen below.

           These were glass first: three stacked shadows at widening radii, a
           soft edge, the whole thing hovering. It read as a cloud. A cloud is
           a lovely object and a bad button, because nothing about it says
           where the surface stops. So they are KEYS now — pressable things
           with a definite edge, sitting ON the page rather than above it:

             1. a GRADIENT ground, still: a lit face catches more light at its
                top than its bottom, and a flat fill is the single biggest tell
                that something is a rectangle pretending
             2. blur and saturate behind it. Kept from the glass, and the one
                thing worth keeping: it is why the control takes on the colour
                of the animation instead of sitting on top of it
             3. a bright inset TOP rim — the lit top face of the key
             4. a dark inset BOTTOM rim, 3px, which is the key's front wall
                seen from slightly above. This is the layer doing the work
             5. a firm ring all round at 0.26, not a 0.14 hairline. It is the
                edge of the key and it is meant to be seen
             6. a hard 3px offset under it — no blur — which is the base the
                key stands on, and then ONE short soft shadow for contact.

           A blurred shadow says "floating, somewhere up there". A hard offset
           says "this tall, right here", and that is the thing that was
           missing. The house rule elsewhere is hairline rings and no drop
           shadows; the controls are the deliberate exception, and the owner
           has now asked for more of it three times. */
        body:has(#blank-home) {
          --pane-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(245, 244, 241, 0.88) 100%);
          --pane-edge: rgba(17, 17, 17, 0.26);
        }
        /* Off the light, on bare paper, there is no colour behind the key for
           the blur to pick up — so it leans on being brighter than the paper
           and on a firmer edge still, and the base does the rest. */
        body:has(#zn-deck[data-lit="false"]) {
          --pane-bg: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(246, 245, 242, 0.96) 100%);
          --pane-edge: rgba(17, 17, 17, 0.28);
        }

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
        /* The light ARRIVES. The page opens bare and this comes up a beat
           later, over a second and a half, on the same ease-out everything
           else here uses. The gradient stays painted through a fade-OUT too:
           swapping it away at the instant بلا is chosen would make that a cut
           rather than a fade, which is the one thing this page never does. */
        #zn-glow {
          position: absolute; inset: 0; overflow: visible; pointer-events: none;
          opacity: 0;
          transition: opacity 1500ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        #zn-glow[data-on="true"] { opacity: 1; }
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
        .zn-pill { transition: width 440ms cubic-bezier(0.22, 1, 0.36, 1),
                                background 900ms cubic-bezier(0.22, 1, 0.36, 1),
                                box-shadow 900ms cubic-bezier(0.22, 1, 0.36, 1); }

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
        .zn-corner { transition: width 460ms cubic-bezier(0.22, 1, 0.36, 1),
                                  background 900ms cubic-bezier(0.22, 1, 0.36, 1),
                                  box-shadow 900ms cubic-bezier(0.22, 1, 0.36, 1); }

        /* The light's own control, and how a reader learns it is one.

           Nothing here explains itself in words. At the moment the light
           changes, the swatch replays from nothing, one ring goes out from it,
           and the label stops saying "اللون" and says which light it is for a
           couple of seconds. Three small things at the same instant as the
           page changing colour, which is enough to join the two together
           without a tooltip, a caption or an arrow.

           The ring stays modest on purpose: the pill clips its own overflow,
           so anything bigger than about two and a half times the swatch is cut
           off at the pill's edge and reads as a bug rather than a beat. */
        .zn-swatch {
          position: relative;
          height: 14px; width: 14px; flex: 0 0 auto; border-radius: 999px;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
          animation: zn-swatch-in 620ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes zn-swatch-in {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        /* Pure decoration, so its finished state really is gone — which is
           what forwards leaves it as. Content on this page never does this. */
        .zn-swatch i {
          position: absolute; inset: 0; border-radius: 999px;
          box-shadow: 0 0 0 1px rgba(23, 23, 23, 0.42);
          animation: zn-ring 1400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes zn-ring {
          from { transform: scale(1);   opacity: 0.5; }
          to   { transform: scale(2.4); opacity: 0; }
        }
        /* Both words share one cell, so the pill never changes width when the
           label swaps — the corner control is a fixed 112px at rest and a
           reflowing label would shove the swatch about. */
        .zn-glowlabel { display: inline-grid; }
        .zn-glowlabel > span {
          grid-area: 1 / 1; justify-self: start; white-space: nowrap;
          transition: opacity 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-glowlabel > span[data-on="false"] { opacity: 0; }

        /* The phone header opens in two beats: out to the sides first, then
           down. Closing runs it backwards, the pages folding away before the
           pill narrows, so the two movements never fight over the same
           moment. The delays are what sequence them: on the way open the
           width goes first and the tray waits; on the way closed the tray
           goes first and the width waits.

           min-width rather than width, so the closed size is still whatever
           the contents measure and only the opening is a number. */
        .zn-phone-pill { transition: min-width 380ms cubic-bezier(0.22, 1, 0.36, 1) 220ms,
                                     background 900ms cubic-bezier(0.22, 1, 0.36, 1),
                                     box-shadow 900ms cubic-bezier(0.22, 1, 0.36, 1); }
        .zn-phone-pill[data-open="true"] { transition-delay: 0s; }
        .zn-phone-drawer {
          transition: grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0s linear 300ms;
        }
        .zn-phone-drawer[data-open="true"] { transition-delay: 200ms, 200ms; }

        /* The key. saturate pulls the colour out of whatever the blur picked
           up, so the control in the bottom corner still takes on the animation
           rather than sitting on top of it — that part survived the move away
           from glass. Everything below it is the key's own geometry. */
        .zn-glass, .zn-pill, .zn-phone-pill {
          background: var(--pane-bg);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          backdrop-filter: blur(18px) saturate(180%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 -3px 0 rgba(17, 17, 17, 0.10),
            0 0 0 1px var(--pane-edge),
            0 3px 0 rgba(17, 17, 17, 0.12),
            0 8px 16px rgba(17, 17, 17, 0.11);
        }
        /* Backdrop filters are a stated accessibility preference for some
           readers, and unsupported in a few engines. Both land here. */
        /* Backdrop filters are a stated accessibility preference for some
           readers, and unsupported in a few engines. Both land here — and both
           keep every layer except the blur, because the depth is what makes
           these read as controls, not the transparency. */
        @media (prefers-reduced-transparency: reduce) {
          .zn-glass, .zn-pill, .zn-phone-pill {
            background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(245, 244, 241, 0.97) 100%);
            -webkit-backdrop-filter: none; backdrop-filter: none;
          }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .zn-glass, .zn-pill, .zn-phone-pill {
            background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(245, 244, 241, 0.96) 100%);
          }
        }

        .zn-list { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .zn-list::-webkit-scrollbar { width: 6px; }
        .zn-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.16); border-radius: 3px; }

        /* ── The deck ─────────────────────────────────────────────────────
           Percentages, never viewport units. The root ZoomLock writes CSS
           zoom and vh resolves BEFORE that scale is applied, so a "100dvh"
           panel in an 85%-zoomed window is short by a seventh and the two
           screens would never line up. The deck is a fixed box measured
           against the real viewport; a panel at a fifth of a track at five
           times the deck is exactly one screen at any zoom. Adding a screen
           means three numbers, all here — the track's height, the panel's,
           and the step the transform takes — plus PANELS in the gesture
           handler, and nothing else on the page counts panels. (Four screens
           read 400% / 25% / -25%; the footer made it five.) */
        #zn-deck { position: fixed; inset: 0; overflow: hidden; }
        #zn-track {
          position: absolute; inset: 0; height: 500%;
          transform: translateY(calc(var(--deck, 0) * -20%));
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
          position: relative; height: 20%;
          transform: translateZ(0);
          contain: layout;
        }
        /* ابن has no ground of its own. It had one — a 9.5% indigo wash, then
           an opaque #bfcfe4 — and the owner asked for both to go. The screen
           is the hero's bare paper again, and the wizard is the only thing on
           it. Nothing is left behind on purpose — not an empty rule and not
           the .zn2-panel class that carried it. A selector with no declarations
           reads as a placeholder someone forgot to fill in. */
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
          /* The composed placement, held as four nudges and a height so that a
             screen without the room for them can decline them one at a time.
             The defaults here are the SAFE ones — dead centre, nothing pushed
             — and the queries below hand out the placed values only where they
             actually fit. Straight px nudges pushed the window 53px off the
             left edge at 1024 and the switcher off the bottom at 800 tall. */
          --nx: 0px; --ny: 0px; --wx: 0px; --wy: 0px; --appbasis: 640px;
          position: absolute; inset: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          place-items: center;
          padding: calc(var(--inset) + 3.4rem) var(--gut) calc(var(--inset) + 0.4rem);
        }
        .zn-stagebox {
          position: relative; z-index: 1;
          /* Every number the composer can move is read through a variable that
             falls back to what is here today, so a page with no composer on it
             renders exactly as it did before the composer existed. */
          /* Composed by hand at ?edit=1 and baked here. The width is capped
             rather than fixed, so a laptop narrower than the one it was placed
             on shrinks the window instead of pushing it off the gutter. */
          width: var(--app-w, min(100%, 1198px)); height: 100%;
          transform: translate(var(--app-x, var(--nx)), var(--app-y, var(--ny)));
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px;
        }

        /* The only control in the section. Two real choices instead of a
           minute of waiting for the other template to come round, and quiet
           enough to belong on this page: a hairline pill, obsidian when it is
           the one being watched. */
        .zn-switch { display: flex; gap: 6px; flex: 0 0 auto; }
        /* The same key the header and the corner controls are made of, at the
           smaller scale this one is: a flat pill next to a standing one reads
           as a label, not a second control. Its chosen state is genuinely
           PRESSED — obsidian, its base gone, an inset shadow where the lit rim
           was, and moved down by the 2px of base it just lost. A toggle whose
           on-state is only a colour change is a colour swatch; one that sinks
           is a switch. */
        .zn-switch button {
          padding: 7px 16px; border-radius: 999px;
          font-size: 11.5px; line-height: 1; color: ${STONE};
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(245, 244, 241, 0.88) 100%);
          -webkit-backdrop-filter: blur(14px) saturate(170%);
          backdrop-filter: blur(14px) saturate(170%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 -2px 0 rgba(17, 17, 17, 0.09),
            0 0 0 1px rgba(17, 17, 17, 0.24),
            0 2px 0 rgba(17, 17, 17, 0.11),
            0 5px 11px rgba(17, 17, 17, 0.09);
          cursor: pointer;
          transition: background 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-switch button:hover { color: ${OBSIDIAN}; }
        .zn-switch button[data-on="true"] {
          background: ${OBSIDIAN}; color: ${PAPER};
          box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.4),
                      0 1px 2px rgba(17, 17, 17, 0.18);
          transform: translateY(2px);
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
          /* 308px is the placed size; the vw term only ever takes over on a
             screen too narrow to carry it, so the composition holds on the
             laptop it was made for and degrades rather than overflows below. */
          font-size: var(--word-size, min(308px, 24vw));
          transform: translate(var(--word-x, var(--wx)), var(--word-y, var(--wy)));
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
          width: 100%; flex: 0 1 var(--app-h, var(--appbasis)); min-height: 0;
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
        /* Sideways first: the window is capped at 1198px, so below about
           1200 the gutter is all the slack there is and shifting it left puts
           it through the edge. */
        @media (min-width: 1200px) { .zn-build { --nx: -109px; --wx: -7px; } }
        /* Then downward, which needs height rather than width: on a short
           laptop the taller window plus the drop put the switcher off the
           bottom of the screen. */
        @media (min-width: 1200px) and (min-height: 840px) {
          .zn-build { --ny: 69px; --wy: 72px; --appbasis: 719px; }
        }

        @media (max-width: 1023px) {
          /* The window drops well below the word rather than sitting on it.
             At this width the two are fighting over the same strip of screen,
             and the word — which is the point of the section — was losing. The
             padding buys it that strip outright. */
          /* Its own placement — a number that suits a laptop is wrong here. */
          .zn-build {
            padding-top: calc(var(--inset) + 6rem);
            --nx: -11px; --ny: 32px; --wx: -2px; --wy: -9px;
          }
          /* Placed separately at ?edit=1 — a number that suits a laptop is
             wrong here, and the wide nudges have to be undone rather than
             inherited. */
          .zn-stagebox { width: 100%; justify-content: flex-end; }
          .zn-app { flex-basis: var(--app-h, 520px); }
          /* Narrower screens have no room beside the window, so the word runs
             behind it rather than out past it — still one piece, still the
             ground the window stands on, just further under. It starts below
             the header rather than at the top of the panel: on a phone the two
             share the same strip of screen, and the word was landing on the
             pill and losing its own ascenders off the top edge. */
          .zn-word {
            font-size: var(--word-size, clamp(4.5rem, 22vw, 9rem));
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
          .zn-app { flex-basis: var(--app-h, 660px); }
          .zn-path { padding: 12px 16px 7px; }
          .zn-stage { padding: 4px 16px 16px; }
          /* The cards have to fit a phone-sized window, so the furniture that
             only exists to be looked at gives up its room first. */
          .zn-preset { min-height: 96px; padding: 12px; }
          .zn-shot { height: 66px; }
          .zn-shot.hero { height: 92px; }
          .zn-in.area { min-height: 62px; }
        }

        /* ── The header, crossing into ادر ────────────────────────────────
           The pill is the one thing on this page that is on every screen, so
           it takes the ground it is standing on. Everything here is
           !important because the pill's surface, the mark's colour and the
           call to action are inline styles on the elements themselves — a
           stylesheet cannot reach past an inline style any other way.

           It runs on the deck's own clock (1020ms) rather than a shorter one,
           so the header, the ground and the light all land together: one
           event, not a dark box arriving under a white pill. */
        /* Named elements, never a descendant wildcard. A ".zn-pill *" rule
           put a 1020ms transition on box-shadow and background across every node in
           the bar, and all of it ran on the frames the deck was travelling —
           measured, the move dropped from 52 frames to 36 and its worst frame
           went from 153ms to 436ms. Only four things actually change colour
           here, so only those four carry a transition. */
        #pill-header .zn-pill,
        #pill-header .zn-phone-pill {
          transition-property: background-color, box-shadow, width, min-width;
          transition-duration: 1020ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        #pill-header svg,
        #pill-header nav a,
        #pill-header [data-cta],
        #pill-header .zn-drawer a,
        #pill-header .zn-phone-drawer a {
          transition-property: color, background-color;
          transition-duration: 1020ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* The dark screens set background-COLOR and the glass recipe sets a
           background-IMAGE, and an image paints over a colour — so without
           this the white gradient sat on top of every dark pill and undid the
           work below. The variable is turned off rather than the rule being
           fought with another !important. */
        #pill-header[data-dark="true"] .zn-pill,
        #pill-header[data-dark="true"] .zn-phone-pill { --pane-bg: none; }

        #pill-header[data-dark="true"] .zn-pill,
        #pill-header[data-dark="true"] .zn-phone-pill {
          background-color: rgba(32, 32, 38, 0.72) !important;
          box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.12),
                      0 0 0 4px rgba(19, 19, 22, 0.5) !important;
        }
        /* WHICH dark panel, not merely that it is dark. Both dark screens
           shared one grey glass, which is right on obsidian and visibly wrong
           on the green: a neutral pill over a coloured ground reads as a bar
           belonging to some other page, floating above this one. So the pill
           takes the ground it is standing on, and each value below is that
           panel's own ground lifted by the same step.

           The attribute is data-panel and not data-ground because .zn4-panel
           already spends that name on the choice of evergreen, and one
           attribute meaning two things in one file is how a stylesheet this
           size starts lying.

           ادر: obsidian #131316, lifted 13 values. This is what the rule above
           always was; it is named now so its neighbour can differ. The footer
           stands on the same obsidian, so it takes the same lift — listed by
           its own name rather than folded into "manage", because it is a
           different panel and a name that means two panels is the same lie in
           a smaller place. */
        #pill-header[data-panel="manage"] .zn-pill,
        #pill-header[data-panel="manage"] .zn-phone-pill,
        #pill-header[data-panel="close"] .zn-pill,
        #pill-header[data-panel="close"] .zn-phone-pill {
          background-color: rgba(32, 32, 38, 0.72) !important;
          box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.12),
                      0 0 0 4px rgba(19, 19, 22, 0.5) !important;
        }
        /* انشر: the evergreen #0f3527, lifted by the SAME step so the pill
           sits off its ground exactly as far as it does on obsidian. The
           outer ring takes the ground itself, which is what makes the pill
           read as cut out of the screen rather than laid on top of it. */
        #pill-header[data-panel="publish"] .zn-pill,
        #pill-header[data-panel="publish"] .zn-phone-pill {
          background-color: rgba(28, 66, 55, 0.72) !important;
          box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.12),
                      0 0 0 4px rgba(15, 53, 39, 0.5) !important;
        }
        /* The mark fills with currentColor. Pure black is the rule on paper;
           on obsidian its counterpart is paper, not a grey. */
        #pill-header[data-dark="true"] svg { color: #fafafa !important; }
        /* The pages, and the 1px separator the pill carries between the nav
           and the account control. */
        #pill-header[data-dark="true"] nav a,
        #pill-header[data-dark="true"] .zn-phone-drawer a,
        #pill-header[data-dark="true"] .zn-drawer a,
        #pill-header[data-dark="true"] .zn-drawer span,
        #pill-header[data-dark="true"] button[aria-label="القائمة"] {
          color: rgba(250, 250, 250, 0.66) !important;
          background: transparent !important;
        }
        #pill-header[data-dark="true"] nav a:hover,
        #pill-header[data-dark="true"] .zn-phone-drawer a:hover,
        #pill-header[data-dark="true"] .zn-drawer a:hover {
          background: rgba(250, 250, 250, 0.07) !important;
          color: #fafafa !important;
        }
        /* The call to action, and ONLY it. Matching a.rounded-full instead
           caught every nav link — they are rounded-full too — and turned the
           bar into a row of white pills. The control carries a data-cta so
           the rule can name the thing it means. */
        #pill-header[data-dark="true"] [data-cta] {
          background: #fafafa !important;
          color: #171717 !important;
        }
        #pill-header[data-dark="true"] .zn-drawer,
        #pill-header[data-dark="true"] .zn-phone-drawer { color: rgba(250, 250, 250, 0.66); }
        /* The one hairline this style allows: the separator between the nav
           and the account control. */
        #pill-header[data-dark="true"] .zn-pill [class*="border-"],
        #pill-header[data-dark="true"] .zn-phone-pill [class*="border-"] {
          border-color: rgba(250, 250, 250, 0.16) !important;
        }

        /* ── Section three: ادر ───────────────────────────────────────────
           The one panel on this page that is not white paper, and the break
           is deliberate. The hero and ابن are the outside — the paper the
           site is drawn on. ادر is where the owner works once it exists, so
           it reads as being INSIDE the product: obsidian, one accent, paper
           type.

           It is not an invented palette either. Section two's restaurant run
           picks the onyx preset — #0a0a0c ground, #c8a96a brushed gold — so
           the site the reader watched being built one screen up is a black
           and gold site, and this is its dashboard. The gold also sits inside
           the رمل palette's own hue band, and the real analytics dashboard
           already paints its bookings tile with this exact value.

           Every colour here is a variable and there is exactly one hue in the
           set: ?accent=violet swaps it for the dashboard's own primary, so
           the two can be compared on the page rather than in the abstract. */
        .zn3-panel {
          /* Type. Well clear of AA at every step — 16.5:1, 7.7:1 and 5.2:1
             against the window — which is what "very good text visibility"
             costs on a dark ground. */
          --ink: #fafafa;
          --ink2: rgba(250, 250, 250, 0.66);
          --ink3: rgba(250, 250, 250, 0.50);
          /* Hairline rings, inverted. Still rings, still never a shadow. */
          --hair: rgba(250, 250, 250, 0.11);
          --hair2: rgba(250, 250, 250, 0.2);
          /* The window lifts off the ground the way the white one lifts off
             paper — a step, not a border. */
          --lift: #1a1a1f;
          --lift2: #212127;
          --acc: #c8a96a;
          --acc-txt: #d8bd85;
          --acc-on: #241b06;
          --acc-soft: rgba(200, 169, 106, 0.14);
          --acc-line: rgba(200, 169, 106, 0.5);
          /* CHROMA, not lightness. The pale رمل stops were tried first and
             came back as mud: measured at the top edge they landed on
             80,70,58 — a brown-grey with barely twenty points between its red
             and its blue. A light laid over a near-black ground at a third
             opacity keeps only a third of what it started with, so a pale
             stop arrives desaturated; what survives the mix is saturation.
             These are غروب's own warm stops, in رمل's hue band — an existing
             palette either way, and the same light on both sides of the seam
             rather than one tuned per ground. */
          --acc-glow: linear-gradient(100deg, oklch(.81 .13 72) 0%, oklch(.77 .16 42) 38%, oklch(.79 .14 62) 72%, oklch(.84 .12 88) 100%);
          /* THE GROUND RAMPS, it does not start. A solid fill begins exactly
             at the panel's edge, and an edge between paper and obsidian is a
             cut — measured across the seam, 250,221,194 met 104,74,46 in a
             single pixel, and no amount of glow over the top softens a step
             that size. So the panel is transparent at its own top and reaches
             full obsidian a fifth of the way down; what shows through is the
             deck's paper, which is the screen the reader is arriving from.
             Percentages of the panel, never vh, for the reason the deck
             itself is built in percentages. */
          background: linear-gradient(
            to bottom,
            rgba(19, 19, 22, 0) 0%,
            rgba(19, 19, 22, 0.62) 3%,
            rgba(19, 19, 22, 0.93) 6.5%,
            #131316 10%
          );
          color: var(--ink);
        }
        .zn3-panel[data-accent="violet"] {
          --acc: #5e6ad2;
          /* The fill can be the product's exact primary; text and hairlines
             at that value fall under 4.5:1 on this ground, so those take the
             lifted stop of the same hue instead. */
          --acc-txt: #97a0ee;
          --acc-on: #ffffff;
          --acc-soft: rgba(94, 106, 210, 0.2);
          --acc-line: rgba(127, 138, 228, 0.55);
          --acc-glow: linear-gradient(100deg, oklch(.71 .17 300) 0%, oklch(.68 .18 285) 38%, oklch(.72 .16 268) 72%, oklch(.75 .15 320) 100%);
        }

        /* The seam. This light hangs UPWARD out of the panel onto the foot of
           ابن, the mirror of the hero's foot glow hanging down onto its head:
           one light that is allowed to cross, never two that would have to be
           made to match. The panels carry layout containment only, so nothing
           clips it — clipping a light at a panel edge is what once put a ruled
           line across this page. */
        /* IT STAYS BELOW ابن. The light used to hang 21vh up out of this
           panel, and because panel three comes after panel two in the DOM and
           both are their own stacking contexts, that overhang painted OVER
           the foot of the build screen — its window and its switcher sat in a
           warm wash that belonged to the next screen. Measured, section two's
           last two hundred pixels were 249,220,189 instead of paper.

           The blend across the seam does not need it: the ground ramp below
           starts transparent at this panel's own top, so what a reader sees
           on the way down is paper meeting paper and then darkening. The
           colour belongs to ادر, and it starts where ادر starts. */
        .zn3-glow {
          position: absolute; left: -8%; right: -8%; top: 2vh; height: 32vh;
          filter: blur(9vh); opacity: 0.42; pointer-events: none; z-index: 0;
          will-change: transform; transform: translateZ(0);
        }
        .zn3-glow i {
          position: absolute; inset: 0; background: var(--acc-glow);
          animation: zn-breathe 21s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        /* Same rule as the hero's: a 9vh blur over an animating box is
           re-rasterised every frame, and nobody can see a breath during a
           one-second move. */
        #zn-deck[data-moving="true"] .zn3-glow i { animation-play-state: paused; }

        .zn-manage {
          --nx: 0px; --ny: 0px; --appbasis: 508px;
          position: absolute; inset: 0; z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          place-items: center;
          padding: calc(var(--inset) + 3.4rem) var(--gut) calc(var(--inset) + 0.4rem);
        }

        /* The manage word: the hero's SECOND column, on the hero's roll and
           in the hero's face, inverted for the ground. Paper, faded as a
           LAYER via opacity — never as alpha in the colour, because connected
           Arabic letters overlap at every join and a translucent colour
           composites each join twice, which shows as dark patches down the
           word. */
        .zn3-word {
          position: absolute; z-index: 0; pointer-events: none;
          top: clamp(0.5rem, 3vh, 2.5rem); inset-inline-start: clamp(0.5rem, 2vw, 3rem);
          display: inline-grid; grid-template-columns: minmax(0, 1fr);
          padding-block: 0.2em; margin-block: -0.2em;
          clip-path: inset(0 -100vw);
          font-size: var(--word-size, min(308px, 24vw));
          transform: translate(var(--word-x, 0px), var(--word-y, 0px));
          line-height: 1.24; white-space: nowrap;
          color: #fafafa;
          /* 0.12 was tried first and is invisible in practice: the theory
             that light ink on a dark ground carries further than dark ink on
             paper is true, but it does not survive a bright window sitting in
             front of it. Section two's own value is 0.20; this sits a step
             above it, because here the word competes with a lit surface
             rather than with bare paper. */
          opacity: 0.26;
          -webkit-font-smoothing: antialiased;
        }
        /* Anchored to the start edge, never centred — the four words share one
           grid cell, so the cell is as wide as the longest of them. */
        .zn3-word > span {
          grid-area: 1 / 1; justify-self: start; white-space: nowrap;
          transition: transform 780ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-word > span[data-state="idle"] { opacity: 0; transform: translateY(130%); pointer-events: none; }
        .zn3-word > span[data-state="out"] {
          opacity: 0; transform: translateY(-130%);
          transition: transform 420ms cubic-bezier(0.55, 0.085, 0.68, 0.53),
                      opacity 260ms linear;
        }
        .zn3-word > span[data-state="in"] { opacity: 1; transform: none; }

        /* The window. Same grammar as section two's — one step lighter than
           its ground instead of one step whiter than paper, ringed rather
           than shadowed. No backdrop-filter, for the same reason: the move
           cannot afford a full-surface blur on every frame. */
        .zn3-app {
          position: relative;
          width: 100%; max-width: 1010px; flex: 0 1 var(--app-h, var(--appbasis)); min-height: 0;
          margin-inline: auto;
          border-radius: 26px;
          background: var(--lift);
          box-shadow: 0 0 0 1px var(--hair), 0 0 0 4px rgba(19, 19, 22, 0.55);
          overflow: hidden;
          contain: layout paint;
          display: grid; grid-template-rows: auto minmax(0, 1fr);
        }
        .zn3-path {
          padding: 15px 22px 9px;
          font-size: 10px; line-height: 1; color: var(--ink3);
        }
        .zn3-path b { font-weight: 500; color: var(--ink); }
        .zn3-stage { position: relative; min-height: 0; padding: 6px 22px 22px; display: grid; }
        /* NOTHING FLOATS IN THE MIDDLE OF THE DISPLAY. The fit pass centred
           the content and left whatever was over as empty screen, which on a
           real device reads as a half-loaded page rather than as air. The
           surfaces stretch to the glass instead, and the only space left is
           the padding between the frame and where the content starts. */
        .zn-manage .zn-fit { align-content: stretch; transform: none; }
        /* Hidden, not auto: the reader is watching, not driving, so there is
           no scrollbar and no gesture to hijack. Programmatic scrolling still
           works, which is the only kind this screen does.

           THE VIEWPORT IS THE PART ON THE PAGE. The screen fills the whole
           machine and is cut with it, which is what a device running off an
           edge looks like — but the content is bounded to the part a reader
           can actually see, and scrolls inside that. Filling the whole screen
           instead was tried and is worse than either: the content stretched
           to the machine, so nothing ever overflowed, nothing ever scrolled,
           and the last 120 pixels of every surface sat below the cut where
           nobody could ever reach them. 100% minus the overhang IS the
           visible part, exactly. */
        .zn-manage .zn3-stage {
          overflow: hidden;
          max-height: calc(100% - var(--dev-body));
        }
        /* min-height, not height: a short surface still fills the screen so
           there is no empty space, and a tall one is allowed to be tall and
           scroll instead of being squeezed. */
        .zn-manage .zn3-screen { min-height: 100%; align-self: stretch; }
        .zn3-two { height: 100%; }
        /* The chart takes whatever the tiles and the tabs do not. */
        .zn3-analytics { height: 100%; grid-template-rows: auto auto auto auto auto minmax(0, 1fr); }
        .zn3-analytics .zn3-chart { display: grid; grid-template-rows: auto minmax(0, 1fr); }
        .zn3-analytics .zn3-chart .plot { height: 100%; }
        .zn3-analytics .zn3-chart svg { height: 100%; }
        /* The inbox and the site fill their halves. */
        .zn3-pane, .zn3-site { height: 100%; }
        .zn3-two.seo .zn3-pane > .zn3-card:last-child { flex: 1 1 auto; }
        /* One surface, forward. The keyframe borrows the hidden state for its
           own duration and rests visible. */
        /* Measured, not guessed: the three surfaces lay out at 357, 520 and
           513 CSS pixels, so the window is sized to the two tall ones and the
           short one is given a floor to reach rather than being left in the
           middle of an empty frame. Section two has the opposite problem and
           the opposite answer — there the cards are wildly different and the
           fit pass scales them; here they are within twenty pixels of each
           other, so a floor is the cheaper fix and it keeps every surface at
           full size, which is what "very good text visibility" needs. */
        /* NOTHING IN THIS WINDOW IS TOUCHABLE. The booking form is the
           product's real component, with real inputs and a real submit — so
           on a phone a tap landed in it, the keyboard came up, and a reader
           found themselves filling in a form that belongs to a demo. It is
           something to watch, not something to use.

           pointer-events is on the SCREEN and not on the stage, so a touch
           still reaches the frame underneath and the sideways swipe that
           changes surface keeps working. The script drives the form through
           the value setter and a programmatic click, neither of which
           pointer-events can block. */
        .zn3-screen {
          pointer-events: none;
          display: grid;
          /* align-self, and it is load-bearing. The fit pass measures THIS
             box, and a grid item defaults to stretching to its track — so
             with the floor below it the box measured 610 while its content
             was 825, the ratio came back 1, nothing was scaled and the form
             was sliced off the bottom of a phone. offsetHeight has to equal
             scrollHeight here or the fit pass is measuring the frame instead
             of the card. Exactly the trap section two's notes describe; it
             arrived by a different door. */
          align-self: start;
          animation: zn-card-in 620ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        /* No floor. It was added so the short surface would fill the window
           instead of floating in it, and filling the window is exactly what
           made the section read as oversized next to ابن — where a card sits
           at its own size in a roomy frame and the frame is the composition.
           The window came down instead, which is the same fix from the other
           end and costs the type nothing. */

        /* Two panes: the owner's side and the guest's side of the same event. */
        .zn3-two { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr); gap: 18px; }
        .zn3-two.seo { grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr); }
        .zn3-pane { min-width: 0; display: flex; flex-direction: column; }

        .zn3-head h2 {
          display: flex; align-items: center; gap: 7px;
          font-size: 15px; font-weight: 500; line-height: 1.35; color: var(--ink);
        }
        .zn3-head p { margin-top: 5px; font-size: 10.5px; line-height: 1.7; color: var(--ink2); }
        .zn3-head .ic { width: 15px; height: 15px; color: var(--acc-txt); }

        /* The filter chips, with the inbox's own counts. */
        .zn3-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 14px 0 11px; }
        .zn3-chip {
          padding: 5px 11px; border-radius: 999px;
          font-size: 10px; line-height: 1.4; color: var(--ink2);
          transition: background 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-chip i { font-style: normal; margin-inline-start: 6px; opacity: 0.6; }
        .zn3-chip[data-on="true"] { background: var(--acc-soft); color: var(--acc-txt); }

        /* The empty state, which is the honest state of a site published a
           minute ago — and its words are the inbox's own. */
        .zn3-empty {
          flex: 1; display: grid; align-content: center; justify-items: center; gap: 9px;
          border-radius: 16px; padding: 30px 20px;
          box-shadow: inset 0 0 0 1px var(--hair);
        }
        .zn3-empty .disc {
          display: grid; place-items: center; width: 40px; height: 40px;
          border-radius: 999px; background: rgba(250, 250, 250, 0.06);
        }
        .zn3-empty .ic { width: 17px; height: 17px; color: var(--ink3); }
        .zn3-empty b { font-size: 11.5px; font-weight: 500; color: var(--ink); }
        .zn3-empty p { max-width: 26ch; text-align: center; font-size: 10px; line-height: 1.7; color: var(--ink2); }

        /* The row as it lands. The only thing in the section that arrives
           while the reader is watching, so it is the only thing that gets the
           accent — and it rests in its finished state like everything else. */
        .zn3-rows { display: grid; gap: 9px; }
        .zn3-row {
          border-radius: 14px; padding: 13px 14px;
          background: var(--lift2);
          box-shadow: inset 0 0 0 1px var(--acc-line);
          animation: zn3-land 720ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes zn3-land {
          from { opacity: 0; transform: translateY(-14px) scale(0.985); }
          to   { opacity: 1; transform: none; }
        }
        .zn3-row .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .zn3-row .nm { font-size: 12px; font-weight: 500; color: var(--ink); }
        .zn3-row .kind {
          margin-inline-start: 7px; padding: 2px 8px; border-radius: 999px;
          font-size: 9px; color: var(--ink2); background: rgba(250, 250, 250, 0.07);
        }
        .zn3-row .meta { margin-top: 4px; font-size: 9.5px; color: var(--ink3); }
        .zn3-row .st {
          flex: 0 0 auto; padding: 4px 10px; border-radius: 999px;
          font-size: 9px; background: var(--acc-soft); color: var(--acc-txt);
          transition: background 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-row .det {
          display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 11px;
          font-size: 10px; line-height: 1.5; color: var(--ink);
        }
        .zn3-row .det span { display: inline-flex; align-items: center; gap: 6px; }
        .zn3-row .det .ic { width: 13px; height: 13px; color: var(--ink3); }
        .zn3-row .msg {
          margin-top: 11px; border-radius: 10px; padding: 9px 11px;
          background: rgba(250, 250, 250, 0.05);
          font-size: 10px; line-height: 1.7; color: var(--ink);
        }
        .zn3-row .ctl {
          display: flex; align-items: center; gap: 9px; margin-top: 12px; padding-top: 11px;
          box-shadow: inset 0 1px 0 var(--hair);
        }
        .zn3-row .ctl .lab { font-size: 9.5px; color: var(--ink3); }
        /* The status control is a select in the inbox, so what a click on it
           opens is the four statuses it actually offers. */
        .zn3-row .sel {
          position: relative; display: inline-flex; align-items: center; gap: 8px;
          border-radius: 8px; padding: 5px 10px;
          font-size: 10px; color: var(--ink);
          box-shadow: inset 0 0 0 1px var(--hair2);
        }
        .zn3-row .sel > em {
          width: 0; height: 0; border-inline: 3.5px solid transparent;
          border-top: 4px solid var(--ink3);
        }
        .zn3-row .sel .menu {
          position: absolute; top: calc(100% + 5px); inset-inline-start: 0; z-index: 3;
          display: grid; min-width: 104px; padding: 4px; border-radius: 10px;
          background: #26262d; box-shadow: 0 0 0 1px var(--hair);
          animation: zn3-pop 200ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn3-row .sel .menu b {
          padding: 6px 9px; border-radius: 6px;
          font-size: 10px; font-weight: 400; color: var(--ink2);
        }
        .zn3-row .sel .menu b[data-on="true"] { color: var(--acc-txt); background: var(--acc-soft); }
        @keyframes zn3-pop {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: none; }
        }

        /* The guest's side: the published site, in the palette section two
           chose for it. Its own ground, because it is a different surface —
           the reader is looking at two screens at once and they must not read
           as one screen. */
        .zn3-site {
          flex: 1; display: flex; flex-direction: column;
          border-radius: 14px; overflow: hidden;
          background: #0a0a0c;
          box-shadow: inset 0 0 0 1px rgba(200, 169, 106, 0.22);
        }
        .zn3-sitebar {
          padding: 9px 13px; font-size: 9px; color: #a09587;
          box-shadow: inset 0 -1px 0 rgba(200, 169, 106, 0.16);
        }
        /* The section keeps its height when the form is replaced by its
           success card, and the card centres in what is left rather than
           hanging from the top of a suddenly empty box. */
        .zn3-sitebody { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 15px 15px 17px; }
        .zn3-sitebody .eyebrow {
          display: block; font-size: 9px; letter-spacing: 0.02em; color: #c8a96a;
        }
        .zn3-sitebody h3 {
          margin: 6px 0 13px;
          font-family: "Playfair Display", "Times New Roman", serif;
          font-size: 18.5px; font-weight: 400; line-height: 1.35; color: #f4ecd8;
        }
        /* The product's own form, at the size this window can carry. It is
           mounted, not reproduced, so everything below is size only — never a
           colour and never a word. */
        .zn3-sitebody form { gap: 0.55rem !important; }
        .zn3-sitebody form label { font-size: 9px !important; margin-bottom: 0.2rem !important; }
        .zn3-sitebody form input,
        .zn3-sitebody form select,
        .zn3-sitebody form textarea {
          padding: 0.45rem 0.55rem !important; font-size: 10px !important;
        }
        .zn3-sitebody form textarea { min-height: 46px; }
        .zn3-sitebody form button { padding: 0.6rem 1rem !important; font-size: 10.5px !important; }
        /* The native date and time pickers paint their own indicator in the
           engine's colour, which on this ground is a black icon on black. */
        .zn3-sitebody form input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }

        /* ── التحليلات ────────────────────────────────────────────────────
           The one surface here that cannot carry a figure, and the figures
           are not the point of it: what a reader learns is that everything
           the site does is measured and this is where it lives. The tiles are
           the real six in the real order; they read zero because a site
           published today has had no visitors, and the dashboard says so
           itself rather than making a number up. */
        .zn3-analytics { display: grid; gap: 0; }
        .zn3-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 14px 0 0; }
        .zn3-pills {
          display: inline-flex; gap: 2px; padding: 2px; border-radius: 999px;
          box-shadow: inset 0 0 0 1px var(--hair);
        }
        .zn3-pills b {
          padding: 4px 10px; border-radius: 999px;
          font-size: 9.5px; font-weight: 400; color: var(--ink2);
          transition: background 280ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-pills b[data-on="true"] { background: var(--acc); color: var(--acc-on); }
        .zn3-sel2, .zn3-tog, .zn3-out {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 8px;
          font-size: 9.5px; color: var(--ink2);
          box-shadow: inset 0 0 0 1px var(--hair);
        }
        .zn3-sel2 > em {
          width: 0; height: 0; border-inline: 3.5px solid transparent;
          border-top: 4px solid var(--ink3);
        }
        .zn3-tog[data-on="true"] { color: var(--acc-txt); box-shadow: inset 0 0 0 1px var(--acc-line); }
        .zn3-bar .ic { width: 12px; height: 12px; }
        .zn3-out { position: relative; }
        .zn3-out.ref { margin-inline-start: auto; }
        .zn3-out .menu {
          position: absolute; top: calc(100% + 6px); inset-inline-end: 0; z-index: 4;
          display: grid; width: 176px; padding: 4px; border-radius: 11px;
          background: #26262d; box-shadow: 0 0 0 1px var(--hair);
          animation: zn3-pop 220ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn3-out .menu b {
          padding: 6px 9px; border-radius: 6px;
          font-size: 10px; font-weight: 400; color: var(--ink); text-align: start;
        }
        .zn3-out .menu i {
          padding: 7px 9px 4px; font-style: normal; font-size: 9px; line-height: 1.6;
          color: var(--ink3); box-shadow: inset 0 1px 0 var(--hair);
        }

        .zn3-tiles { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
        .zn3-tile {
          display: grid; align-content: start; gap: 6px;
          border-radius: 14px; padding: 11px 11px 12px;
          box-shadow: inset 0 0 0 1px var(--hair);
        }
        .zn3-tile .t { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
        .zn3-tile .t em {
          font-style: normal; font-size: 9px; letter-spacing: 0.1em; color: var(--ink2);
        }
        .zn3-tile .chip {
          flex: 0 0 auto; display: grid; place-items: center;
          width: 20px; height: 20px; border-radius: 6px; background: var(--acc-soft);
        }
        .zn3-tile .chip .ic { width: 11px; height: 11px; color: var(--acc-txt); }
        .zn3-tile .v {
          display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;
          font-size: 18.5px; font-weight: 500; line-height: 1.1; color: var(--ink);
        }
        /* The dashboard's own Delta with no baseline to compare against: a
           dash and the word "new". "+100%" against nothing would be a lie,
           and the product already refuses to print it. */
        /* The delta. Green when the number moved the way the owner wants and
           red when it did not — and bounce rate is the one metric where down
           is the good direction, which is why the caller decides the colour
           and not the sign. */
        .zn3-tile .v u { text-decoration: none; font-size: 9px; font-weight: 400; color: var(--ink3); }
        .zn3-tile .v u[data-good="true"] { color: #6fbf8b; }
        .zn3-tile .v u[data-good="false"] { color: #f08a8a; }
        .zn3-tile .s { font-size: 9px; line-height: 1.5; color: var(--ink3); }

        .zn3-note {
          margin-top: 11px; border-radius: 10px; padding: 9px 11px;
          font-size: 9.5px; line-height: 1.8; color: var(--ink2);
          box-shadow: inset 0 0 0 1px var(--hair);
        }

        .zn3-tabs { display: flex; gap: 2px; margin-top: 15px; box-shadow: inset 0 -1px 0 var(--hair); }
        .zn3-tabs b {
          position: relative; padding: 7px 10px 9px;
          font-size: 10px; font-weight: 400; color: var(--ink3); white-space: nowrap;
        }
        .zn3-tabs b[data-on="true"] { color: var(--ink); }
        .zn3-tabs b[data-on="true"]::after {
          content: ""; position: absolute; inset-inline: 6px; bottom: -1px; height: 2px;
          border-radius: 999px; background: var(--acc);
        }

        /* The search tab's panel. Same furniture as the inbox's empty state,
           because it is the same kind of thing: a real screen with nothing in
           it yet and a way to change that. */
        .zn3-search { margin-top: 15px; display: grid; align-content: start; gap: 10px; }
        .zn3-search h3 { font-size: 12px; font-weight: 500; color: var(--ink); }
        .zn3-search .zn3-empty { padding: 22px 18px; }
        /* The inbox's empty state holds one short line; this one holds a
           sentence, and 26ch wrapped it into five. */
        .zn3-search .zn3-empty p { max-width: 46ch; }
        .zn3-search .cta {
          margin-top: 4px; padding: 6px 14px; border-radius: 999px;
          font-size: 10.5px; background: var(--acc); color: var(--acc-on);
        }

        .zn3-chart { margin-top: 14px; border-radius: 14px; padding: 12px; box-shadow: inset 0 0 0 1px var(--hair); }
        .zn3-pills.small b { font-size: 9px; padding: 3px 9px; }
        .zn3-chart .plot { position: relative; margin-top: 10px; }
        .zn3-chart svg { display: block; width: 100%; height: 150px; }
        .zn3-chart svg line { stroke: rgba(250, 250, 250, 0.09); stroke-width: 1; }
        /* The curve draws itself when the range changes. Keyed on the range,
           so it replays; backwards fill, so the resting state is the finished
           one and a browser that never runs it still shows the whole line. */
        .zn3-chart .line {
          stroke-dashoffset: 0;
          animation: zn3-draw 980ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn3-chart .area { animation: zn3-fade 980ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
        @keyframes zn3-draw {
          from { stroke-dasharray: 1400; stroke-dashoffset: 1400; }
          to   { stroke-dasharray: 1400; stroke-dashoffset: 0; }
        }
        @keyframes zn3-fade { from { opacity: 0; } to { opacity: 1; } }
        .zn3-chart .ys {
          position: absolute; inset-block: 0; right: 2px;
          display: flex; flex-direction: column; justify-content: space-between;
          padding-block: 8px 26px;
        }
        .zn3-chart .ys i { font-style: normal; font-size: 9px; color: var(--ink3); }

        /* The crosshair. The anchors carry no ink at all — they exist so the
           cursor has a real target to travel to at each point on the curve. */
        .zn3-chart .pt {
          position: absolute; width: 1px; height: 1px;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .zn3-chart .cross {
          position: absolute; top: 0; bottom: 18px; width: 1px;
          background: var(--acc-line);
          transform: translateX(-50%);
          transition: left 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-chart .dot {
          position: absolute; width: 8px; height: 8px; border-radius: 999px;
          background: var(--acc-txt);
          box-shadow: 0 0 0 2px #1a1a1f;
          transform: translate(-50%, -50%);
          transition: left 420ms cubic-bezier(0.22, 1, 0.36, 1),
                      top 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* The reading. It follows the point rather than sitting in a corner,
           and it is clamped away from the edges so it never leaves the plot. */
        .zn3-chart .tip {
          position: absolute; top: 2px;
          display: grid; justify-items: end; gap: 1px;
          min-width: 74px; padding: 7px 9px; border-radius: 9px;
          background: #26262d;
          box-shadow: 0 0 0 1px var(--hair);
          transform: translateX(-50%);
          transition: left 420ms cubic-bezier(0.22, 1, 0.36, 1);
          animation: zn3-pop 220ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn3-chart .tip[data-low] { top: auto; bottom: 26px; }
        .zn3-chart .tip i { font-style: normal; font-size: 9px; color: var(--ink3); }
        .zn3-chart .tip b { font-size: 13px; font-weight: 500; color: var(--ink); }
        .zn3-chart .tip u { text-decoration: none; font-size: 9px; color: var(--ink2); }
        /* The chart's own empty line, which is the true one here. */
        .zn3-chart .none {
          position: absolute; inset: 0; display: grid; place-content: center;
          max-width: 34ch; margin: 0 auto; text-align: center;
          font-size: 10px; line-height: 1.7; color: var(--ink2);
        }

        /* ── SEO ─────────────────────────────────────────────────────────
           Its own centrepiece, and it invents nothing: the Google result is
           written from the fields as they are typed, and the counters are
           counting characters the reader is watching arrive. */
        .zn3-card { border-radius: 16px; padding: 15px 16px 16px; box-shadow: inset 0 0 0 1px var(--hair); }
        .zn3-cardhead { display: flex; align-items: center; gap: 7px; }
        .zn3-cardhead h3 { font-size: 12px; font-weight: 500; color: var(--ink); }
        .zn3-cardhead .ic { width: 14px; height: 14px; color: var(--acc-txt); }
        .zn3-cardhead .side { margin-inline-start: auto; font-size: 9px; color: var(--ink3); }
        .zn3-cardsub { margin-top: 6px; font-size: 10px; line-height: 1.75; color: var(--ink2); }
        .zn3-cardnote { margin-top: 11px; font-size: 9px; line-height: 1.7; color: var(--ink3); }

        .zn3-field { margin-top: 14px; }
        .zn3-field .lab { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
        .zn3-field label { font-size: 10px; font-weight: 500; color: var(--ink); }
        .zn3-field .right { display: inline-flex; align-items: center; gap: 8px; }
        .zn3-field .auto { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 400; color: var(--acc-txt); }
        .zn3-field .auto .ic { width: 10px; height: 10px; }
        .zn3-field .count { font-size: 9px; font-weight: 400; color: var(--ink3); }
        .zn3-field .count[data-state="near"] { color: #e0a44a; }
        .zn3-field .count[data-state="over"] { color: #f08a8a; }
        .zn3-field .hint { margin-top: 5px; font-size: 9px; line-height: 1.6; color: var(--ink3); }
        .zn3-inp {
          display: block; min-height: 32px; border-radius: 9px; padding: 8px 10px;
          font-size: 10.5px; line-height: 1.6; color: var(--ink);
          background: rgba(250, 250, 250, 0.04);
          box-shadow: inset 0 0 0 1px var(--hair);
          transition: box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-inp.area { min-height: 56px; }
        .zn3-inp[data-on="true"] { box-shadow: inset 0 0 0 1.5px var(--acc-line); }
        .zn3-inp i { font-style: normal; color: var(--ink3); }
        .zn3-inp em { font-style: normal; }
        /* The caret belongs to the field being written, and to no other. */
        .zn3-inp[data-on="true"] em::after {
          content: ""; display: inline-block; width: 1px; height: 1em;
          margin-inline-start: 1px; vertical-align: -0.14em;
          background: var(--ink); animation: zn-blink 1s steps(1) infinite;
        }

        .zn3-check { display: flex; gap: 10px; margin-top: 15px; border-radius: 12px; padding: 11px; box-shadow: inset 0 0 0 1px var(--hair); }
        .zn3-check u { flex: 0 0 auto; width: 14px; height: 14px; margin-top: 2px; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--hair2); }
        .zn3-check b { display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 400; color: var(--ink); }
        .zn3-check .ic { width: 13px; height: 13px; }
        .zn3-check .ic.ok { color: #6fbf8b; }
        .zn3-check i { display: block; margin-top: 4px; font-style: normal; font-size: 9px; line-height: 1.6; color: var(--ink3); }

        .zn3-save { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 15px; }
        .zn3-save span { font-size: 9px; color: var(--ink3); }
        .zn3-save b {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 9px;
          font-size: 10.5px; font-weight: 500;
          background: var(--acc); color: var(--acc-on);
          opacity: 0.4;
          transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-save b[data-on="true"] { opacity: 1; }
        .zn3-save .ic { width: 13px; height: 13px; }

        /* A real Google result is a white card with a blue link, so this one
           is too. It is the single surface in the section that keeps its own
           colours: recoloured to the accent it would stop being a preview of
           anything, and the preview is the whole reason the screen exists. */
        .zn3-serp {
          margin-top: 12px; border-radius: 12px; padding: 13px 14px;
          background: #ffffff; font-family: Arial, sans-serif;
        }
        .zn3-serp .who { display: flex; align-items: center; gap: 9px; }
        .zn3-serp .fav {
          display: grid; place-items: center; width: 22px; height: 22px; border-radius: 999px;
          background: #131316; color: #fafafa; font-size: 9px;
        }
        .zn3-serp .nm { font-size: 10px; line-height: 1.35; color: #202124; }
        .zn3-serp .host { font-size: 10px; line-height: 1.35; color: #4d5156; }
        .zn3-serp .ttl {
          margin-top: 7px; font-size: 15px; line-height: 1.3; color: #1a0dab;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .zn3-serp .dsc { margin-top: 4px; font-size: 11px; line-height: 1.45; color: #4d5156; }

        .zn3-card.social { margin-top: 14px; }
        .zn3-social { margin-top: 12px; border-radius: 12px; overflow: hidden; box-shadow: inset 0 0 0 1px var(--hair); }
        .zn3-social img { display: block; width: 100%; height: 116px; object-fit: cover; }
        .zn3-social .cap { padding: 10px 12px 12px; }
        .zn3-social .host { font-size: 9px; letter-spacing: 0.06em; color: var(--ink3); }
        .zn3-social .ttl {
          margin-top: 3px; font-size: 11px; font-weight: 500; color: var(--ink);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .zn3-social .dsc {
          margin-top: 3px; font-size: 9.5px; line-height: 1.5; color: var(--ink2);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── How a card is made ───────────────────────────────────────────
           Every surface in this section is one of these boxes: the analytics
           tiles, the chart, the note, the SEO cards, the share preview, the
           inbox's empty state. They share one treatment so the section reads
           as one material, and the treatment is switchable at ?cards= so it
           can be chosen by looking rather than by arguing.

           Dropping the boxes altogether is the move this kind of section
           usually wants, and it is deliberately NOT offered: the product's own
           dashboard puts its content in bordered cards, and a demo that
           invents a screen the product does not have is worth nothing. What
           varies is the material, never the structure.

           Rings, never shadows, in all four. */
        .zn3-panel {
          /* ring — the default: a hairline on nothing. */
          --card-bg: transparent;
          --card-ring: inset 0 0 0 1px var(--hair);
        }
        /* fill — elevation by VALUE rather than by outline. Six outlined boxes
           in a tile grid read as a wireframe; six filled ones read as a
           product. No line at all, which is the point. */
        .zn3-panel[data-cards="fill"] {
          --card-bg: #1f1f25;
          --card-ring: none;
        }
        /* well — the card is cut INTO the window rather than laid on it:
           darker than its surround, with a single lit pixel along the top
           edge where a real recess would catch the light. */
        .zn3-panel[data-cards="well"] {
          --card-bg: #151519;
          --card-ring: inset 0 1px 0 rgba(250, 250, 250, 0.07);
        }
        /* lit — the hairline, but obeying the light this section already has
           coming from above: bright along the top edge and fading to almost
           nothing at the bottom. Costs no colour and no shadow. */
        .zn3-panel[data-cards="lit"] {
          --card-bg: rgba(250, 250, 250, 0.022);
          --card-ring: inset 0 1px 0 rgba(250, 250, 250, 0.16),
                       inset 0 0 0 1px rgba(250, 250, 250, 0.06);
        }

        .zn3-tile, .zn3-note, .zn3-chart, .zn3-card, .zn3-empty, .zn3-social {
          background: var(--card-bg);
          box-shadow: var(--card-ring);
        }
        /* The tile grid is the one place the outline fails: six of them in a
           row read as a wireframe whatever the hairline is doing. Under the
           default treatment they take the filled material instead, which is
           the only per-element exception in the set. */
        .zn3-panel[data-cards="lit"] .zn3-tile {
          background: #1f1f25;
          box-shadow: inset 0 1px 0 rgba(250, 250, 250, 0.05);
        }
        /* The arriving booking keeps the accent ring in every mode. It is the
           one thing on the screen that is live, and that is what the accent
           is for. */
        .zn3-row { background: var(--lift2); box-shadow: inset 0 0 0 1px var(--acc-line); }
        .zn3-panel[data-cards="fill"] .zn3-row { background: #24242b; }

        /* ── The device ───────────────────────────────────────────────────
           ادر shows a whole object. A screen rises from below the fold and
           comes to rest as a COMPLETE device: all four corners, nothing
           running off an edge. The first version cropped the body at the
           bottom of the viewport, which reads as a screenshot that did not
           finish loading rather than as a product shot.

           Which device depends on the width, because that is what the reader
           is holding, and each one is its real shape: a MacBook Pro display
           is 16:10, an iPad is 4:3, a phone is 9:19.5. The ASPECT is on the
           screen and the width is derived from the height, so the object has
           real proportions instead of whatever the container happened to be.

           Heights are a per cent of the box the section lays out in, never
           vh: the panel is a third of a track at three times the deck, so a
           per cent here is a per cent of one screen at any zoom, and vh
           resolves before the root ZoomLock's scale. */
        .zn-manage {
          align-items: end;
          justify-items: center;
          /* Room under the device, because there is a bottom edge to see now. */
          padding-bottom: calc(var(--inset) + 0.5rem);
          --dev-seen: 67%;
          --dev-body: 0px;
        }
        .zn-manage .zn-stagebox {
          position: relative;
          justify-content: flex-end;
          gap: 0;
        }
        .zn3-switch { margin-bottom: 20px; position: relative; z-index: 2; }

        .zn3-device {
          position: relative;
          z-index: 1;
          /* Width comes from the screen's aspect, so this only ever shrinks
             to the container and never stretches to it. */
          width: auto;
          max-width: 100%;
          height: var(--dev-seen);
          flex: 0 0 auto;
          border-radius: 22px;
          padding: 7px;
          /* THE FRAME IS DARKER THAN THE SCREEN IT HOLDS, and darker than the
             room as well: a bezel is the darkest thing in the picture and the
             display is the only thing that is lit. Lit along its own top edge,
             because the light in this section comes from above. */
          background: linear-gradient(180deg, #16161c 0%, #0d0d11 100%);
          box-shadow: inset 0 1px 0 rgba(250, 250, 250, 0.17),
                      inset 0 0 0 1px rgba(250, 250, 250, 0.055),
                      0 0 0 1px rgba(0, 0, 0, 0.62);
          /* The rise. Long, arriving slowly, on the page's own curve, and
             transform only so it composites. */
          transition: transform 1180ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        /* The travelling state is the one that carries an attribute; at rest
           there is nothing written, so a browser that never runs the
           transition still finds the screen where it belongs. */
        .zn3-device { transform: translateX(var(--dev-x, 0px)); }
        .zn3-device[data-down] { transform: translateX(var(--dev-x, 0px)) translateY(128%); }

        .zn3-device .zn3-app {
          height: 100%;
          width: auto;
          flex: 1 1 auto;
          /* NEVER WIDER THAN THE FRAME. The width is derived from the height
             through the aspect, so on a tall viewport the derived width
             outgrows the container and the screen paints straight over the
             bezel and out past the corners. The aspect gives a little in that
             case, which is the right thing to give: a slightly tall screen is
             a rounding error, a screen hanging outside its own device is a
             broken picture. */
          max-width: 100%;
          margin-inline: 0;
          border-radius: 15px;
          /* Seated INSIDE the frame rather than sitting on it. */
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.55);
        }
        /* Glass. A display is a sheet of it, and a sheet of glass under a
           light coming from above catches that light near the top and nowhere
           else. 0.055 paper at its strongest, which lifts the surface about
           nine values and costs the type nothing. */
        .zn3-device .zn3-app::after {
          content: "";
          position: absolute; inset: 0; z-index: 30;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(
            166deg,
            rgba(250, 250, 250, 0.055) 0%,
            rgba(250, 250, 250, 0.014) 24%,
            rgba(250, 250, 250, 0) 44%
          );
        }

        .zn3-cam { display: none; }

        /* The light the screen throws into the room in FRONT of it, which
           here is the strip the word lives in. */
        .zn3-cast {
          position: absolute;
          left: 4%; right: 4%; bottom: calc(var(--dev-seen) + 10px);
          height: 26%;
          border-radius: 50%;
          background: var(--acc);
          opacity: 0.17;
          filter: blur(11vh);
          pointer-events: none;
          z-index: 0;
          will-change: transform;
          transform: translateZ(0);
          transition: opacity 1180ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-cast[data-down] { opacity: 0; }

        /* ── The laptop ── */
        @media (min-width: 1024px) {
          /* THE LAPTOP IS CUT AT THE BOTTOM. A MacBook shown whole has to be
             small enough to fit a screen, and small is the one thing this
             object must not be — so it runs off the bottom edge and the
             reader sees about sixty per cent of it, which is how a machine
             this size actually meets a page.

             --dev-seen is what shows; --dev-body is the rest of the frame,
             in PIXELS, because a percentage margin resolves against the
             containing block's width and would crop by a different amount on
             every screen. The screen's content box is the visible part, so
             nothing readable is ever below the cut. */
          /* A TRUE 16:10 AT ANY HEIGHT.

             The screen's width is derived from its height, so on a tall
             window the derived width outgrew the container; the clamp that
             stops it escaping the frame then squashed the aspect to 1.38, and
             a fake 16:10 at full size is worse than a real one at ninety per
             cent. So the height is capped by what the WIDTH can afford:
             whatever the stagebox is, divided by the aspect. Below that cap
             nothing changes, and above it the machine simply sits smaller and
             stays a MacBook.

             The vw term under-reads by the ZoomLock's factor, which makes the
             cap slightly conservative — the safe direction. */
          .zn-manage {
            /* The budget is for the WHOLE screen, not the visible part of it.
               The screen fills the machine and is cut with it, so it is
               --dev-seen PLUS --dev-body tall, and sizing the cap against
               only what shows left the hidden third to blow the width out
               again: measured, 1.361 instead of 1.6. Subtracting the overhang
               is what makes the sum fit. */
            --dev-seen: min(66%, calc(
              min(100vw - 2 * var(--gut), 1320px) / 1.62 + 18px - var(--dev-body)
            ));
            --dev-body: 150px;
            padding-bottom: 0;
          }
          /* A wider box than section two gets. Its window holds a wizard card
             and 1198 is right for that; this holds a 16:10 machine, and the
             aspect turns every pixel of width into height it can use. Raising
             the cap is what buys back the presence a true aspect costs,
             instead of buying it by faking the shape. */
          .zn-manage .zn-stagebox { width: var(--app-w, min(100%, 1320px)); }
          .zn3-device {
            height: calc(var(--dev-seen) + var(--dev-body));
            margin-bottom: calc(-1 * var(--dev-body));
            /* Uniform, so the screen fills the whole machine and is cut with
               it rather than stopping at the fold. What keeps the content
               reachable is the stage's max-height above, not this padding. */
            padding: 9px;
            border-radius: 17px;
          }
          .zn3-device .zn3-app {
            aspect-ratio: 16 / 10;
            border-radius: 9px;
          }
          /* The notch sits IN the display, so the top row of the screen has
             to clear it. */
          .zn3-cam {
            display: block;
            position: absolute; top: 9px; left: 50%;
            width: 148px; margin-left: -74px; height: 19px;
            border-radius: 0 0 10px 10px;
            background: #0b0b0e;
            z-index: 4;
          }
          .zn-manage .zn3-path { padding-top: 21px; }
          /* No base. The machine is cut well above where it would be, and
             drawing one below the fold is drawing something nobody sees. */
        }

        /* ── iPad ── */
        @media (max-width: 1023px) and (min-width: 768px) {
          .zn-manage { --dev-seen: 66%; }
          .zn3-device {
            border-radius: 30px;
            padding: 14px;
          }
          .zn3-device .zn3-app { aspect-ratio: 4 / 3; border-radius: 18px; }
          .zn3-cam {
            display: block;
            position: absolute; top: 5px; left: 50%;
            width: 5px; height: 5px; margin-left: -2.5px;
            border-radius: 999px;
            background: rgba(250, 250, 250, 0.24);
          }
        }

        /* ── Phone ── */
        @media (max-width: 767px) {
          /* A BIG phone, crossing the corner. Shown whole it had to be 292px
             wide to fit the height, which is a toy: the screen inside was
             narrower than the content wanted and everything had to scroll for
             it. So the machine is half again as large, it runs off the bottom
             the way the laptop does, and it is pushed left so it crosses that
             corner rather than sitting in the middle of the panel. The word
             lives top-right, so the object belongs bottom-left.

             Unlike the laptop, the screen fills the WHOLE device here, past
             the cut: the website is cut with the mockup, which is what a
             phone lying past the edge of a page actually looks like. What
             keeps that honest is the scrolling — the cursor puts whatever it
             is working on into the top quarter of the screen, which is the
             part still on the page. */
          .zn-manage { --dev-seen: 82%; --dev-body: 360px; padding-bottom: 0; }
          .zn3-device {
            height: calc(var(--dev-seen) + var(--dev-body));
            margin-bottom: calc(-1 * var(--dev-body));
            /* Biased left, but only far enough that what the page edge takes
               is bezel and a margin rather than words. At -10% it was eating
               seventy pixels of the screen and the ends of every line with
               it; the object still crosses the corner at -4%, and nothing
               readable is on the wrong side of the edge. */
            --dev-x: -4%;
            /* The page edge does not chop the machine, it takes it. A mask
               ramp along the leading edge means the object goes off the page
               instead of stopping dead against it — the same reason the light
               at the seam is blurred rather than ruled. */
            -webkit-mask-image: linear-gradient(to right, transparent 0, rgba(0,0,0,0.55) 38px, #000 104px);
            mask-image: linear-gradient(to right, transparent 0, rgba(0,0,0,0.55) 38px, #000 104px);
            border-radius: 46px;
            padding: 10px;
          }
          /* The clamp that stops the screen escaping its frame is lifted
             HERE and only here. Everywhere else a device wider than its
             container is a bug; on a phone it is the composition — the
             machine is meant to be bigger than the page and to cross the
             corner, so its true shape wins over the container's width. The
             deck still clips at the viewport, so nothing scrolls sideways. */
          .zn3-device { max-width: none; }
          .zn3-device .zn3-app { aspect-ratio: 9 / 19.5; max-width: none; border-radius: 37px; }
          /* The island, and the path line clears it. */
          .zn3-cam {
            display: block;
            position: absolute; top: 14px; left: 50%;
            width: 58px; height: 14px; margin-left: -29px;
            border-radius: 999px;
            background: #0b0b0e;
            z-index: 4;
          }
          .zn-manage .zn3-path { padding-top: 34px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .zn3-device { transition: none; }
          .zn3-device[data-down] { transform: none; }
          .zn3-cast { transition: none; }
          .zn3-cast[data-down] { opacity: 0.17; }
        }

        /* The cursor. Paper on obsidian rather than obsidian on paper — the
           same shape, inverted, so it stays visible on this ground. */
        /* left, PHYSICALLY, never inset-inline-start. The cursor's x is a
           distance from the frame's physical left edge, so its anchor has to
           be that same edge; the logical property resolves to right in an RTL
           container and threw the pointer clean off the window — measured at
           x=1468 on a frame ending at 1149. Logical properties are right for
           content and wrong for a coordinate system measured in physical
           pixels. Section two uses left: 0 for exactly this reason. */
        .zn3-cursor {
          position: absolute; top: 0; left: 0; z-index: 20;
          pointer-events: none; will-change: transform;
          transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-cursor svg {
          display: block; transform-origin: 1px 1px;
          transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-cursor[data-press="true"] svg { transform: scale(0.78); }

        /* The switcher, in this section's own values. */
        .zn3-switch { display: flex; gap: 6px; flex: 0 0 auto; }
        .zn3-switch button {
          padding: 7px 16px; border-radius: 999px;
          font-size: 10px; line-height: 1; color: var(--ink2);
          box-shadow: inset 0 0 0 1px var(--hair);
          cursor: pointer;
          transition: background 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn3-switch button:hover { color: var(--ink); }
        .zn3-switch button[data-on="true"] {
          background: var(--acc); color: var(--acc-on); box-shadow: none;
        }

        @media (min-width: 1200px) and (min-height: 840px) {
          .zn-manage { --appbasis: 545px; }
        }
        @media (max-width: 1023px) {
          .zn-manage { padding-top: calc(var(--inset) + 6rem); }
          .zn-manage .zn-stagebox { width: 100%; }
          .zn3-app { flex-basis: var(--app-h, 470px); }
          .zn3-word {
            font-size: var(--word-size, clamp(4.5rem, 22vw, 9rem));
            top: calc(var(--inset) + 2.4rem);
          }
          .zn3-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
          /* The window was taking 660 of an 844px phone, which left the word
             nowhere to be and made the whole screen read as one dense slab.
             Smaller window, bigger word: on a phone the word is the thing
             that says which of the three steps this is, and it was the thing
             that had been squeezed out. */
          /* A phone is the one place where the window cannot simply be made
             smaller: the surfaces stack, so the content is 753px tall, and a
             small window means the fit pass scales it into type nobody can
             read. Measured, a 500px window put it at 0.598 — ten-pixel type
             rendered at six. So the window keeps its height here and the
             CONTENT is what comes down, which is the only lever that makes
             the screen smaller without making it illegible. The word gets its
             room from the trim rather than from the window. */
          .zn3-app { flex-basis: var(--app-h, 640px); }
          .zn3-word {
            font-size: var(--word-size, clamp(5.5rem, 30vw, 11rem));
            opacity: 0.3;
          }
          /* Furniture first, labels never. */
          .zn3-chips { margin: 9px 0 8px; }
          .zn3-empty { padding: 16px 14px; gap: 6px; }
          .zn3-empty .disc { width: 32px; height: 32px; }
          .zn3-sitebody h3 { margin: 3px 0 7px; }
          .zn3-sitebody form { gap: 0.4rem !important; }
          .zn3-sitebody form label { margin-bottom: 0.12rem !important; }
          .zn3-sitebody form input,
          .zn3-sitebody form select,
          .zn3-sitebody form textarea { padding: 0.36rem 0.5rem !important; }
          .zn3-sitebody form textarea { min-height: 30px; }
          .zn3-sitebody form button { padding: 0.5rem 1rem !important; }
          .zn3-row .det { margin-top: 8px; }
          .zn3-row .msg { margin-top: 8px; padding: 7px 9px; }
          .zn3-row .ctl { margin-top: 9px; padding-top: 8px; }
          .zn3-path { padding: 12px 16px 7px; }
          .zn3-stage { padding: 4px 16px 16px; }
          /* The two panes stop being two: on a phone they are 150px each and
             neither is readable. Stacked, the inbox is on top because it is
             what the path says this screen is. */
          .zn3-two, .zn3-two.seo { grid-template-columns: minmax(0, 1fr); gap: 14px; }
          .zn3-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }

          /* Stacked, every surface is taller than the window and the fit pass
             scales it — so what matters here is the RATIO, because that is
             what decides whether the type can still be read. Section two's
             own floor on a phone is 0.763 (the eight-tile picker), so that is
             the bar: measured, these three came back 0.739, 0.786 and 0.583,
             and the trims below put all of them at or above it.

             THE SHARE PREVIEW IS BACK. It was hidden here to buy back a fit
             ratio, and that trade does not exist any more: the screen scrolls
             instead of scaling, so a surface is allowed to be taller than the
             display and the cursor brings each field into view as it reaches
             it. Nothing is hidden on a phone now; it is just further down,
             which is where it is on the real screen too. */
          .zn3-sitebody { padding: 12px 13px 13px; }
          .zn3-sitebody h3 { font-size: 15px; margin: 5px 0 10px; }
          .zn3-sitebody form { gap: 0.45rem !important; }
          .zn3-sitebody form textarea { min-height: 38px; }
        }

        /* ── The composer ─────────────────────────────────────────────────
           A placement tool at ?edit=1, not part of the page. It deliberately
           looks like a tool — dashed outlines, a mono readout — so it can
           never be mistaken for something that ships. */
        .zn-compose { position: absolute; inset: 0; z-index: 60; pointer-events: none; }
        .zn-compose-box {
          position: absolute; pointer-events: auto; cursor: grab;
          outline: 1px dashed rgba(23, 23, 23, 0.45); outline-offset: 2px;
          border-radius: 4px;
        }
        .zn-compose-box:active { cursor: grabbing; }
        /* The picked one comes forward, so its grip is reachable even where
           the two overlap — the word lies behind the window. */
        .zn-compose-box[data-on="true"] { outline-color: #171717; outline-width: 1.5px; z-index: 2; }
        .zn-compose-box .tag {
          position: absolute; inset-inline-start: 0; top: -19px;
          padding: 2px 7px; border-radius: 5px;
          background: #171717; color: #fafafa;
          font-size: 10px; line-height: 1.4; white-space: nowrap;
        }
        .zn-compose-box .grip {
          position: absolute; inset-inline-end: -7px; bottom: -7px;
          width: 14px; height: 14px; border-radius: 3px;
          background: #fafafa; box-shadow: inset 0 0 0 1.5px #171717;
          cursor: nwse-resize;
        }
        .zn-compose-panel {
          position: absolute; inset-inline-start: 12px; bottom: 12px;
          width: 216px; padding: 12px; border-radius: 12px;
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
          font-size: 11px; color: #171717;
        }
        .zn-compose-panel .head { font-weight: 500; margin-bottom: 8px; }
        .zn-compose-panel .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; color: #666666; }
        .zn-compose-panel .row b { font-weight: 500; color: #171717; }
        .zn-compose-panel .pick { display: flex; gap: 6px; margin-bottom: 9px; }
        .zn-compose-panel .pick button {
          flex: 1; padding: 5px; border-radius: 7px; cursor: pointer;
          font-size: 10.5px; color: #666666;
          background: #fafafa; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
        }
        .zn-compose-panel .pick button[data-on="true"] { background: #171717; color: #fafafa; box-shadow: none; }
        .zn-compose-panel .acts { display: flex; gap: 6px; margin: 10px 0 8px; }
        .zn-compose-panel .acts button {
          flex: 1; padding: 6px; border-radius: 7px; cursor: pointer;
          font-size: 10.5px; color: #171717;
          background: #fafafa; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
        }
        .zn-compose-panel pre {
          max-height: 132px; overflow: auto; padding: 8px; border-radius: 7px;
          background: #171717; color: #fafafa;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9.5px; line-height: 1.5; white-space: pre-wrap;
          direction: ltr; text-align: left;
        }
        .zn-compose-panel .hint { margin-top: 8px; color: #666666; line-height: 1.5; }

        /* Save, and it is the only control in the panel that changes the
           page rather than the clipboard — so it is the only one with a
           fill. It reports what happened instead of going quiet: a refusal
           here is almost always the route answering 404 on a production
           build, where the file cannot be written at all. */
        .zn-compose-panel .save {
          width: 100%; margin-top: 2px; padding: 8px; border-radius: 7px;
          font-size: 11px; font-weight: 500; cursor: pointer;
          background: #171717; color: #fafafa; box-shadow: none;
          transition: background 200ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 200ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn-compose-panel .save[data-state="saving"] { opacity: 0.6; }
        .zn-compose-panel .save[data-state="done"] { background: #15803d; }
        .zn-compose-panel .save[data-state="fail"] { background: #b91c1c; }

        /* On ادر the tool is standing on obsidian, so it inverts with
           everything else — a dashed near-black outline on a near-black
           ground is not a placement tool, it is a guess. */
        .zn-manage .zn-compose-box { outline-color: rgba(250, 250, 250, 0.5); }
        .zn-manage .zn-compose-box[data-on="true"] { outline-color: #fafafa; }
        .zn-manage .zn-compose-box .tag { background: #fafafa; color: #131316; }
        .zn-manage .zn-compose-box .grip { background: #fafafa; }
        .zn-manage .zn-compose-panel {
          background: rgba(26, 26, 31, 0.94); color: #fafafa;
          box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.14);
        }
        .zn-manage .zn-compose-panel .row { color: rgba(250, 250, 250, 0.6); }
        .zn-manage .zn-compose-panel .row b { color: #fafafa; }
        .zn-manage .zn-compose-panel .hint { color: rgba(250, 250, 250, 0.5); }
        .zn-manage .zn-compose-panel .pick button,
        .zn-manage .zn-compose-panel .acts button {
          background: rgba(250, 250, 250, 0.08); color: #fafafa;
          box-shadow: inset 0 0 0 1px rgba(250, 250, 250, 0.16);
        }
        .zn-manage .zn-compose-panel .pick button[data-on="true"] {
          background: #fafafa; color: #131316; box-shadow: none;
        }
        .zn-manage .zn-compose-panel pre {
          background: #0c0c0e; color: #fafafa;
          box-shadow: inset 0 0 0 1px rgba(250, 250, 250, 0.1);
        }
        .zn-manage .zn-compose-panel .save { background: #fafafa; color: #131316; }
        .zn-manage .zn-compose-panel .save[data-state="done"] { background: #4ade80; color: #08240f; }
        .zn-manage .zn-compose-panel .save[data-state="fail"] { background: #f08a8a; color: #2a0808; }

        /* ══ Section four: انشر ═════════════════════════════════════════
           The publish step, and the page's SECOND deliberate colour — the
           only one that is a whole screen rather than an accent on one.

           The argument is the same one ادر's break rests on, and it is not an
           invented palette. What this section is about is a site going LIVE,
           and the product already has a colour for that: #15803d is what the
           dashboard paints منشور · SSL مفعّل, what the site card's مباشر pill
           is, what the free-subdomain block is, and what the Pro free-domain
           banner is. It was on the page before this section existed. So the
           ground is that hue taken down to near-black, and the accent is the
           product's exact value.

           ONE COLOUR, and it means one: there is no glow in this section, no
           second wash, no tint on anything. The only gradient in the whole
           panel is the seam ramp below, which exists because an edge is a cut
           and for no other reason.

           Three depths were built so the choice could be made by looking at
           them on the real page, which is how ادر's accent was settled, and
           it was settled by measuring the pixel rather than by arguing about
           it. ?ground=pine samples 12,42,30 and ?ground=deep is darker still;
           both are green on a chart and BLACK on a screen, and a third
           near-black after obsidian is not a colour, it is one more absence
           of one. The default samples 15,53,39 — thirty-eight points between
           its green and its red, which is a green a reader sees from across a
           room, and still dark enough that paper type on it measures 12.9:1
           and the section reads as serious rather than as a brand block. */
        .zn4-panel {
          /* Type. The same three steps ادر measures, on a ground of almost
             the same value, so the same numbers hold: paper at 16:1, the
             second step at 7.5:1, the quietest at 5:1. */
          --ink: #fafafa;
          --ink2: rgba(250, 250, 250, 0.66);
          --ink3: rgba(250, 250, 250, 0.52);
          --hair: rgba(250, 250, 250, 0.11);
          --hair2: rgba(250, 250, 250, 0.2);
          --g: #0f3527;
          --prev: #131316;
          --lift: #14211b;
          --lift2: #1a2822;
          /* The fill takes the product's exact live green. As TYPE on this
             ground #15803d measures 2.6:1, well under AA, so text and
             hairlines take a lifted stop of the same hue instead — exactly
             the split ادر makes between #5e6ad2 and #97a0ee. */
          --acc: #15803d;
          --acc-txt: #62d391;
          --acc-on: #ffffff;
          --acc-soft: rgba(21, 128, 61, 0.18);
          --acc-line: rgba(98, 211, 145, 0.42);
          /* The two other states the domain ladder has. The product uses
             #b45309 for waiting and #5e6ad2 for working; both are lifted
             here for the same reason the accent is. */
          --wait: #e2a44a;
          --wait-soft: rgba(226, 164, 74, 0.14);
          --work: #97a0ee;
          --work-soft: rgba(94, 106, 210, 0.2);
          /* The card material is ادر's lit treatment, unchanged. The two dark
             sections are one family and the ground hue is the only thing that
             separates them; giving this one its own card grammar as well
             would make it a different product rather than a different room. */
          --card-bg: rgba(250, 250, 250, 0.022);
          --card-ring: inset 0 1px 0 rgba(250, 250, 250, 0.16),
                       inset 0 0 0 1px rgba(250, 250, 250, 0.06);
          /* THE SEAM. It ramps FROM THE PREVIOUS GROUND, not from transparent:
             transparent shows the deck through, and the deck is paper — which
             would put a white band across the top of this panel, between two
             dark screens. ادر ramps from transparent because the screen above
             it really is paper. Here the screen above is obsidian, so that is
             where the ramp starts.

             IT FINISHES ABOVE THE HEADER, and 8% was not above it. The pill
             sits at --inset, which is 27 rendered pixels down with 38 more of
             its own, so it spans roughly y=27 to y=65 on a 900px window; a
             ramp settling around y=72 is BEHIND the pill, not above it.
             Measured at rest, this panel's top pixel read 19,20,22 — full
             obsidian — and did not reach the green until y=70, so the screen
             wore a dark bar across its head and the pill floated on it. ادر
             gets away with a long ramp because it has a light in exactly that
             band and the gradient reads as sky; this panel has no glow at all,
             so the same ramp reads as dirt.

             2.2% settles by y=20, clear of the pill. It can be this short
             because the step it hides is small: obsidian to evergreen is 34
             units at its widest channel, and 34 units over 20 pixels is under
             two per pixel, which is below what an eye reads as an edge. ادر
             needs ten times the distance because it is hiding 231. */
          background: linear-gradient(
            to bottom,
            var(--prev) 0%,
            color-mix(in oklab, var(--prev), var(--g) 62%) 0.9%,
            color-mix(in oklab, var(--prev), var(--g) 90%) 1.5%,
            var(--g) 2.2%
          );
          color: var(--ink);
        }
        .zn4-panel[data-ground="pine"] { --g: #0c2a1e; }
        .zn4-panel[data-ground="deep"] { --g: #081d15; }

        .zn-publish {
          --nx: 0px; --ny: 0px; --appbasis: 660px;
          position: absolute; inset: 0; z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          place-items: center;
          padding: calc(var(--inset) + 3.4rem) var(--gut) calc(var(--inset) + 0.6rem);
        }
        .zn-publish .zn-stagebox {
          position: relative;
          display: flex; flex-direction: column;
          /* STRETCH, not centre. The shared stagebox centres its children on
             the cross axis, which makes a flex child shrink to fit — and a
             window whose width is 100% of a shrink-to-fit box resolves to its
             own content. Measured, that brought a 1200px browser back to 408
             twice over, once through this and once through the basis. */
          align-items: stretch;
          width: var(--app-w, min(100%, 1200px));
          height: 100%;
          min-height: 0;
        }

        /* The publish word: the hero's THIRD column, on the hero's roll and
           in the hero's face. Paper, faded as a LAYER via opacity — never as
           alpha in the colour, because connected Arabic letters overlap at
           every join and a translucent colour composites each join twice. */
        .zn4-word {
          position: absolute; z-index: 0; pointer-events: none;
          /* Lower than ادر's word, and the reason is the word itself: انشر
             carries the dots of ن and ش at the top of the line, and at ادر's
             offset the panel edge took them off. Measured against the glyphs,
             not against the other section's number. */
          top: clamp(1rem, 6vh, 4.2rem); inset-inline-start: clamp(0.5rem, 2vw, 3rem);
          display: inline-grid; grid-template-columns: minmax(0, 1fr);
          padding-block: 0.2em; margin-block: -0.2em;
          clip-path: inset(0 -100vw);
          font-size: var(--word-size, min(258px, 21vw));
          transform: translate(var(--word-x, 0px), var(--word-y, 0px));
          line-height: 1.24; white-space: nowrap;
          color: #fafafa;
          opacity: 0.24;
          -webkit-font-smoothing: antialiased;
        }
        .zn4-word > span {
          grid-area: 1 / 1; justify-self: start; white-space: nowrap;
          transition: transform 780ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn4-word > span[data-state="idle"] { opacity: 0; transform: translateY(130%); pointer-events: none; }
        .zn4-word > span[data-state="out"] {
          opacity: 0; transform: translateY(-130%);
          transition: transform 420ms cubic-bezier(0.55, 0.085, 0.68, 0.53),
                      opacity 260ms linear;
        }
        .zn4-word > span[data-state="in"] { opacity: 1; transform: none; }

        .zn4-switch { display: flex; gap: 6px; flex: 0 0 auto; margin-bottom: 16px; position: relative; z-index: 2; }
        .zn4-win > .zn4-app { flex: 0 1 auto; }
        .zn4-switch button {
          border-radius: 999px; padding: 5px 13px; font-size: 11.5px; font-weight: 500;
          color: var(--ink3); background: transparent;
          box-shadow: inset 0 0 0 1px var(--hair);
          transition: color 240ms, background-color 240ms, box-shadow 240ms;
        }
        .zn4-switch button:hover { color: var(--ink); }
        .zn4-switch button[data-on="true"] {
          color: var(--ink); background: rgba(250, 250, 250, 0.08);
          box-shadow: inset 0 0 0 1px var(--hair2);
        }

        /* ── The browser ──────────────────────────────────────────────────
           A COMPLETE window: all four corners, nothing running off an edge.
           ادر rises a device that is cut, because what it shows is a screen
           somebody works on and a machine that size meets a page by running
           past it. What this section shows is an ADDRESS, and an address bar
           cut off at an edge is not an address bar.

           The arrival is a short rise, and the state that travels is the one
           carrying the attribute: at rest nothing is written, so a browser
           that never runs the transition still finds the window here. */
        .zn4-win {
          position: relative; z-index: 1;
          /* The BASIS IS A HEIGHT, because this is the item in the stagebox's
             column. Putting it on the window inside instead made the basis a
             WIDTH — that container is a row — and a 560px basis with shrink
             brought a 1200px browser back to 408. */
          /* THE WINDOW FITS THE PAGE INSIDE IT, up to the cap, and the cap is
             on the WINDOW rather than on this box. Fixed at the cap, the
             domains screen filled it and the sites screen left three hundred
             pixels of dead dark under a single card — which reads as a window
             that failed to load rather than as a short page. Carrying the cap
             here instead just moved the void: this box stayed 660 tall and
             the short window sat at the top of it, measured as 500 empty
             pixels under the published site on a tablet. So this box takes
             the column and the window is centred in it. */
          flex: 1 1 auto; min-height: 0;
          width: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          /* The composed nudge belongs to the stagebox, which already applies
             it; repeating it here would move the window twice. What travels
             here is the arrival and nothing else. */
          transition: transform 1180ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 900ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .zn4-win[data-down] { opacity: 0; transform: translateY(7%); }
        .zn4-app {
          position: relative;
          width: 100%; max-width: 1200px;
          flex: 0 1 auto;
          min-height: 0;
          /* THE WINDOW MOVES TO ITS NEW SIZE, it does not snap to it.
             Sized by its content, the window changed height four times a
             cycle with nothing easing it: measured, +245px when the results
             table lands, +48 when the bought domain appears under it, -272
             on the change of surface and +206 when the published site loads.
             Each one was one frame wide, which is not a resize, it is a jolt.

             height: auto cannot be transitioned, so the height is MEASURED
             off the content and written here as a pixel value — the same
             move --fit and the hero's column matrix make, for the same
             reason. The fallback is auto, so with the script dead the window
             still fits its page; it just arrives there instantly, which is
             exactly today's behaviour. */
          height: var(--app-measured, auto);
          max-height: min(100%, var(--app-h, var(--appbasis)));
          transition: height 520ms cubic-bezier(0.22, 1, 0.36, 1);
          margin-inline: auto;
          border-radius: 16px;
          background: var(--lift);
          box-shadow: 0 0 0 1px var(--hair), 0 0 0 4px rgba(8, 24, 18, 0.5);
          overflow: hidden;
          contain: layout paint;
          display: grid; grid-template-rows: auto auto minmax(0, 1fr);
        }
        /* Glass, the same sheet ادر's display catches: a light from above
           lands near the top and nowhere else. */
        .zn4-app::after {
          content: "";
          position: absolute; inset: 0; z-index: 30;
          pointer-events: none; border-radius: inherit;
          background: linear-gradient(
            166deg,
            rgba(250, 250, 250, 0.05) 0%,
            rgba(250, 250, 250, 0.012) 22%,
            rgba(250, 250, 250, 0) 42%
          );
        }

        .zn4-chrome {
          display: grid; grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center; gap: 12px;
          padding: 9px 13px;
          background: rgba(250, 250, 250, 0.035);
          box-shadow: inset 0 -1px 0 var(--hair);
        }
        .zn4-chrome .lights { display: flex; gap: 5px; }
        .zn4-chrome .lights i {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(250, 250, 250, 0.16);
        }
        .zn4-chrome .pad { width: 34px; }
        /* The address bar. The SUBJECT of this section, not its furniture:
           the cursor types in it, and what it reads at the end is the domain
           the reader watched being bought two beats earlier. */
        .zn4-url {
          justify-self: center;
          display: inline-flex; align-items: center; gap: 6px;
          min-width: min(340px, 60%);
          padding: 4px 12px; border-radius: 999px;
          background: rgba(0, 0, 0, 0.24);
          box-shadow: inset 0 0 0 1px var(--hair);
          font-size: 11.5px; color: var(--ink2);
          transition: box-shadow 320ms, background-color 320ms;
        }
        .zn4-url .ic { width: 10px; height: 10px; color: var(--acc-txt); flex: 0 0 auto; }
        .zn4-url b { font-weight: 500; color: var(--ink); letter-spacing: 0.01em; }
        .zn4-url[data-typing] {
          background: rgba(0, 0, 0, 0.34);
          box-shadow: inset 0 0 0 1px var(--acc-line);
        }

        /* The load. On only while a page is actually being swapped. */
        .zn4-load { height: 2px; background: transparent; }
        .zn4-load[data-on] {
          background: linear-gradient(90deg, var(--acc) 0%, var(--acc-txt) 100%);
          animation: zn4-load 760ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform-origin: right center;
        }
        @keyframes zn4-load { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* Hidden, not auto: the reader is watching, not driving, so there is
           no scrollbar and no gesture to hijack. Programmatic scrolling still
           works, which is the only kind this window does — the cursor brings
           each target into view before it moves to it. */
        .zn4-stage { position: relative; min-height: 0; overflow: hidden; display: grid; }
        /* NOTHING IN THIS WINDOW IS TOUCHABLE. pointer-events is on the
           SCREEN and not on the stage, so a touch still reaches the frame
           underneath and the sideways swipe that changes surface keeps
           working. */
        /* NO min-height HERE. It was 100%, which is 100% of the stage, which
           is what is left of the window — so the content's height depended on
           the window's height, and the window is about to be sized FROM the
           content. That is a loop, and it is the same loop the fit pass in
           runner.ts is carefully built to avoid. The content is content; the
           window is measured from it. */
        .zn4-screen {
          pointer-events: none;
          display: grid; align-self: start;
        }
        /* The entrance lives on the keyed child, so the measured element above
           can stay put across a change of surface. */
        .zn4-in {
          display: grid;
          animation: zn-card-in 620ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn4-screen-in {
          display: flex; flex-direction: column; gap: 13px;
          padding: 20px 22px 22px;
        }

        .zn4-cursor {
          position: absolute; left: 0; top: 0; z-index: 40; pointer-events: none;
          transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .zn4-cursor svg { display: block; transition: transform 170ms cubic-bezier(0.22, 1, 0.36, 1); }
        .zn4-cursor[data-press="true"] svg { transform: scale(0.78); }

        /* ── The dashboard, on the green ─────────────────────────────────
           The real screens, in ادر's material. Same cards, same hairlines,
           same three steps of paper type. */
        .zn4-head h2 {
          display: flex; align-items: center; gap: 7px;
          font-size: 15px; font-weight: 700; color: var(--ink);
        }
        .zn4-head p { margin-top: 4px; font-size: 11.5px; color: var(--ink2); }
        .zn4-head .ic { width: 14px; height: 14px; }
        .zn4-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--ink3); margin-top: 2px;
        }
        .zn4-card {
          border-radius: 13px; padding: 15px 16px;
          background: var(--card-bg); box-shadow: var(--card-ring);
        }
        .zn4-cardhead { display: flex; align-items: center; gap: 6px; }
        .zn4-cardhead h3 { font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .zn4-cardhead .ic { width: 12px; height: 12px; }
        .ic.acc { color: var(--acc-txt); }
        .zn4-sub { margin-top: 4px; font-size: 11px; color: var(--ink2); }

        .zn4-gift {
          margin-top: 11px; display: flex; align-items: center; gap: 7px;
          border-radius: 9px; padding: 8px 10px;
          background: var(--acc-soft);
          box-shadow: inset 0 0 0 1px var(--acc-line);
          font-size: 11px; color: var(--acc-txt);
        }
        .zn4-gift .ic { width: 12px; height: 12px; flex: 0 0 auto; }

        .zn4-search { margin-top: 12px; display: flex; align-items: center; gap: 8px; }
        .zn4-field {
          position: relative; flex: 1 1 auto; min-width: 0;
          display: flex; align-items: center; gap: 7px;
          border-radius: 999px; padding: 7px 12px;
          background: rgba(0, 0, 0, 0.2);
          box-shadow: inset 0 0 0 1px var(--hair);
          font-size: 12px; color: var(--ink);
          transition: box-shadow 240ms;
        }
        .zn4-field[data-on="true"] { box-shadow: inset 0 0 0 1px var(--acc-line); }
        .zn4-field .ic { width: 12px; height: 12px; color: var(--ink3); flex: 0 0 auto; }
        .zn4-field .val { min-height: 15px; display: inline-flex; align-items: center; }
        .zn4-field .ph { color: var(--ink3); font-style: normal; }
        .zn4-field em {
          display: inline-block; width: 1px; height: 13px; margin-inline-start: 1px;
          background: var(--acc-txt);
          animation: zn-caret 1s steps(1) infinite;
        }
        .zn4-go {
          flex: 0 0 auto;
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 999px; padding: 7px 15px;
          background: var(--ink); color: #0f3527;
          font-size: 11.5px; font-weight: 600;
          transition: opacity 240ms;
        }
        .zn4-go[data-busy="true"] { opacity: 0.6; }
        .zn4-go .ic { width: 11px; height: 11px; }

        .zn4-table {
          margin-top: 13px; border-radius: 10px; overflow: hidden;
          box-shadow: inset 0 0 0 1px var(--hair);
        }
        .zn4-tr {
          display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.2fr) auto auto;
          align-items: center; gap: 10px;
          padding: 8px 12px; font-size: 11.5px;
          box-shadow: inset 0 1px 0 var(--hair);
          animation: zn-card-in 420ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn4-tr:first-child { box-shadow: none; }
        .zn4-tr .end { text-align: end; justify-self: end; }
        .zn4-th {
          background: rgba(0, 0, 0, 0.18);
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--ink3);
        }
        .zn4-tr .dom { color: var(--ink); font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; }
        .zn4-tr .price i { color: var(--ink3); font-style: normal; }
        .zn4-tf {
          padding: 8px 12px; font-size: 10.5px; color: var(--ink3);
          background: rgba(0, 0, 0, 0.18);
          box-shadow: inset 0 1px 0 var(--hair);
        }
        .zn4-muted { color: var(--ink3); font-style: normal; }

        .zn4-pill {
          display: inline-flex; align-items: center; gap: 4px;
          border-radius: 999px; padding: 2px 8px;
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(250, 250, 250, 0.06); color: var(--ink3);
        }
        .zn4-pill .ic { width: 10px; height: 10px; }
        .zn4-pill.live, .zn4-pill[data-tone="live"] { background: var(--acc-soft); color: var(--acc-txt); }
        .zn4-pill.work, .zn4-pill[data-tone="work"] { background: var(--work-soft); color: var(--work); }
        .zn4-pill[data-tone="wait"] { background: var(--wait-soft); color: var(--wait); }
        .zn4-free {
          display: inline-block; border-radius: 999px; padding: 2px 8px;
          background: var(--acc-soft); color: var(--acc-txt);
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
        }
        .zn4-buy {
          border-radius: 999px; padding: 4px 11px;
          background: var(--acc); color: var(--acc-on);
          font-size: 10.5px; font-weight: 600; white-space: nowrap;
          transition: opacity 240ms;
        }
        .zn4-buy[data-busy="true"] { opacity: 0.55; }
        .spin { animation: zn4-spin 1.1s linear infinite; }
        @keyframes zn4-spin { to { transform: rotate(360deg); } }

        /* The connected domain, walking the product's own status ladder. */
        .zn4-domrow {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
          animation: zn-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn4-domrow .who { display: flex; align-items: center; gap: 10px; }
        .zn4-domrow .disc {
          width: 30px; height: 30px; flex: 0 0 auto;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: rgba(250, 250, 250, 0.06); color: var(--ink2);
          transition: background-color 520ms, color 520ms;
        }
        .zn4-domrow .disc .ic { width: 14px; height: 14px; }
        .zn4-domrow .disc[data-tone="wait"] { background: var(--wait-soft); color: var(--wait); }
        .zn4-domrow .disc[data-tone="work"] { background: var(--work-soft); color: var(--work); }
        .zn4-domrow .disc[data-tone="live"] { background: var(--acc-soft); color: var(--acc-txt); }
        .zn4-domrow .top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .zn4-domrow code {
          font-size: 13px; font-weight: 600; color: var(--ink);
          font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
        }
        .zn4-domrow .bot { margin-top: 3px; font-size: 10.5px; color: var(--ink2); }
        .zn4-domrow .bot strong { color: var(--ink); font-weight: 600; }
        .zn4-domrow .acts { display: flex; gap: 6px; }
        .zn4-ghost {
          display: inline-flex; align-items: center; gap: 4px;
          border-radius: 7px; padding: 4px 9px;
          font-size: 10.5px; font-style: normal; color: var(--ink2);
          background: var(--card-bg); box-shadow: var(--card-ring);
        }
        .zn4-ghost .ic { width: 10px; height: 10px; opacity: 0.75; }

        /* ── The site card, from SiteCard.tsx ───────────────────────────── */
        .zn4-site {
          max-width: 760px;
          display: grid; grid-template-columns: minmax(0, 290px) minmax(0, 1fr);
          border-radius: 13px; overflow: hidden;
          background: var(--card-bg); box-shadow: var(--card-ring);
        }
        .zn4-site .cover { position: relative; aspect-ratio: 16 / 9; overflow: hidden; }
        .zn4-site .cover img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .zn4-site .cover .stripe {
          position: absolute; inset-inline: 0; top: 0; height: 3px; background: var(--acc);
        }
        .zn4-site .status {
          position: absolute; inset-inline-end: 10px; top: 10px;
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 999px; padding: 3px 9px;
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          background: rgba(10, 20, 16, 0.72); color: rgba(250, 250, 250, 0.8);
          transition: background-color 420ms, color 420ms;
        }
        .zn4-site .status[data-live="true"] {
          background: rgba(21, 128, 61, 0.88); color: #ffffff;
        }
        .zn4-site .status .dot {
          width: 5px; height: 5px; border-radius: 50%; background: #ffffff;
          animation: zn4-pulse 1.6s ease-in-out infinite;
        }
        @keyframes zn4-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .zn4-site .body { padding: 14px 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
        .zn4-site .body h3 { font-size: 15px; font-weight: 700; color: var(--ink); }
        .zn4-site .kind { font-size: 11px; color: var(--ink2); margin-top: -4px; }
        .zn4-site .draft {
          display: inline-block; border-radius: 7px; padding: 3px 8px;
          background: var(--wait-soft); color: var(--wait);
          font-size: 11px; font-weight: 500;
        }
        .zn4-site .host {
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 7px; padding: 3px 8px;
          background: var(--acc-soft); color: var(--acc-txt);
          font-size: 11px; font-weight: 500;
          animation: zn-card-in 460ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        .zn4-site .host .ic { width: 11px; height: 11px; }
        .zn4-site .acts { margin-top: auto; padding-top: 6px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .zn4-site .acts .zn4-go { background: var(--acc); color: var(--acc-on); }

        .zn4-note {
          display: flex; align-items: center; gap: 7px;
          font-size: 10.5px; color: var(--ink3);
        }
        .zn4-note .ic { width: 11px; height: 11px; }

        /* ── The published site ──────────────────────────────────────────
           The payoff, and the one thing this page has never shown: ابن fills
           in a form for seventy seconds and never shows the website that
           comes out. It is the real template's own content in the real
           template's own preset — the onyx palette the wizard picks one
           screen up and the same one ادر's booking form is painted in, so
           the site the reader watched being built, run and published is one
           site throughout.

           The photograph is room-1, NOT the template's own hero: that file is
           Unsplash stock with wine glasses across the foreground and bare
           arms, and is wrong for this brand. */
        .zn4-live {
          background: var(--s-bg); color: var(--s-txt);
        }
        .zn4-live header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 22px;
          box-shadow: inset 0 -1px 0 var(--s-line);
        }
        .zn4-live .mark {
          font-size: 14px; font-weight: 600; letter-spacing: 0.04em; color: var(--s-txt);
        }
        .zn4-live nav { display: flex; align-items: center; gap: 16px; font-size: 11px; }
        .zn4-live nav i { font-style: normal; color: var(--s-mut); }
        .zn4-live nav b {
          border-radius: 2px; padding: 5px 13px;
          background: var(--s-acc); color: var(--s-bg);
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em;
        }
        /* Measured, not chosen: at 21:9 the hero alone was 571px of a 660px
           window and the dishes below it were cut off the bottom — the page
           the reader just published, showing one screen of itself. */
        .zn4-live .hero { position: relative; aspect-ratio: 3.4 / 1; min-height: 190px; overflow: hidden; }
        .zn4-live .hero img { width: 100%; height: 100%; object-fit: cover; }
        .zn4-live .hero .over {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          gap: 9px; text-align: center; padding: 0 8%;
          /* The photograph is already a dark room. At 0.28 to 0.72 the wash
             took what was left of it and the hero read as a black rectangle
             with type on it; this is as much as the type needs and no more. */
          background: linear-gradient(180deg, rgba(10, 10, 12, 0.30) 0%, rgba(10, 10, 12, 0.62) 100%);
        }
        .zn4-live .eyebrow {
          font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--s-acc);
        }
        .zn4-live h1 {
          font-family: "Playfair Display", "Times New Roman", serif;
          font-size: clamp(22px, 3.4vw, 40px); line-height: 1.22; font-weight: 500;
          white-space: pre-line; color: var(--s-txt);
        }
        .zn4-live .hero p {
          max-width: 58ch; font-size: 11px; line-height: 1.7; color: rgba(250, 250, 250, 0.72);
        }
        .zn4-live .ctas { display: flex; gap: 9px; margin-top: 3px; }
        .zn4-live .ctas b {
          border-radius: 2px; padding: 7px 18px;
          background: var(--s-acc); color: var(--s-bg);
          font-size: 11px; font-weight: 600;
        }
        .zn4-live .ctas i {
          border-radius: 2px; padding: 7px 18px;
          box-shadow: inset 0 0 0 1px var(--s-line);
          font-style: normal; font-size: 11px; color: var(--s-txt);
        }
        .zn4-live .dishes { padding: 24px 22px 28px; display: flex; flex-direction: column; gap: 15px; align-items: center; }
        .zn4-live .dishes .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; width: 100%; }
        .zn4-live .dish { padding-top: 11px; box-shadow: inset 0 1px 0 var(--s-line); }
        .zn4-live .dish .cap { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .zn4-live .dish b { font-size: 12px; font-weight: 500; color: var(--s-txt); }
        .zn4-live .dish u { text-decoration: none; font-size: 11.5px; color: var(--s-acc); }
        .zn4-live .dish p { margin-top: 5px; font-size: 10.5px; line-height: 1.65; color: var(--s-mut); }

        /* ── Narrow ─────────────────────────────────────────────────────── */
        @media (max-width: 1023px) {
          .zn-publish { --appbasis: 100%; }
          .zn-publish .zn-stagebox { width: 100%; }
          .zn4-site { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 767px) {
          .zn-publish { padding-top: calc(var(--inset) + 6rem); }
          .zn4-word { font-size: var(--word-size, min(150px, 34vw)); opacity: 0.28; }
          .zn4-screen-in { padding: 14px 14px 16px; gap: 10px; }
          .zn4-chrome { padding: 7px 10px; gap: 8px; }
          .zn4-url { min-width: 0; font-size: 10px; padding: 3px 9px; }
          .zn4-search { flex-wrap: wrap; }
          .zn4-tr { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto; gap: 6px; padding: 7px 9px; font-size: 10.5px; }
          .zn4-tr > *:nth-child(3) { display: none; }
          .zn4-live .dishes .grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
          .zn4-live .dish:last-child { display: none; }
          .zn4-domrow .acts { display: none; }
          /* The published site, at phone width. Three things had to give, and
             what gives is furniture — never a label, which is section three's
             rule and holds here. The nav links ran straight out of the header
             at 356px; the hero at 3.4:1 was 104px tall with 210px of type
             centred in it, so the type spilled past the photograph; and the
             subheadline is the one line on that hero a phone can do without,
             because the headline and the CTA are what it is for. */
          .zn4-live header { padding: 11px 14px; }
          .zn4-live nav i { display: none; }
          .zn4-live nav { gap: 10px; }
          .zn4-live .hero { aspect-ratio: auto; min-height: 232px; }
          .zn4-live .hero p { display: none; }
          .zn4-live .hero .over { padding: 0 16px; gap: 7px; }
          .zn4-live h1 { font-size: 22px; }
          .zn4-live .ctas b, .zn4-live .ctas i { padding: 6px 14px; font-size: 10.5px; }
          .zn4-live .dishes { padding: 16px 14px 18px; }
        }

        /* The composer inverts with the ground, exactly as it does on ادر: a
           dashed near-black outline on a near-black screen is not a placement
           tool, it is a guess. */
        .zn-publish .zn-compose-box { outline-color: rgba(250, 250, 250, 0.5); }
        .zn-publish .zn-compose-box[data-on="true"] { outline-color: #fafafa; }
        .zn-publish .zn-compose-box .tag { background: #fafafa; color: #0f3527; }
        .zn-publish .zn-compose-box .grip { background: #fafafa; }
        .zn-publish .zn-compose-panel {
          background: rgba(15, 53, 39, 0.92);
          box-shadow: 0 0 0 1px rgba(250, 250, 250, 0.14);
        }
        .zn-publish .zn-compose-panel .row { color: rgba(250, 250, 250, 0.6); }
        .zn-publish .zn-compose-panel .row b { color: #fafafa; }
        .zn-publish .zn-compose-panel .hint { color: rgba(250, 250, 250, 0.5); }
        .zn-publish .zn-compose-panel .pick button,
        .zn-publish .zn-compose-panel .acts button {
          color: rgba(250, 250, 250, 0.75);
          box-shadow: inset 0 0 0 1px rgba(250, 250, 250, 0.2);
        }
        .zn-publish .zn-compose-panel .pick button[data-on="true"] {
          background: rgba(250, 250, 250, 0.14); color: #fafafa;
        }
        .zn-publish .zn-compose-panel pre {
          background: rgba(0, 0, 0, 0.3); color: rgba(250, 250, 250, 0.7);
        }
        .zn-publish .zn-compose-panel .save { background: #fafafa; color: #0f3527; }
        .zn-publish .zn-compose-panel .save[data-state="done"] { background: #4ade80; color: #08240f; }
        .zn-publish .zn-compose-panel .save[data-state="fail"] { background: #f08a8a; color: #2a0808; }


        /* ── Section five: the close ──────────────────────────────────────
           The fifth panel, and the only one that is not a step in the
           argument. There is no fourth word behind it, no device and no
           script: it is the mark, the one claim, the real pages and the real
           company line, at rest.

           THE GROUND IS ادر'S OBSIDIAN. The seam above it comes down from
           انشر's evergreen, and evergreen to obsidian is 34 units at its
           widest channel — the same step انشر itself hides, and short enough
           that 2.2% of a panel settles it by y=20, clear of a pill that
           begins at y=27. Going back to paper is a 231-unit step; ادر needs
           ten times the ramp for exactly that reason, and gets away with it
           only because it has a light sitting in the band the ramp lands in.
           This screen has no light, so the same ramp would read as dirt
           across its head. A ramp is invisible at rest ONLY if it finishes
           before the header starts. */
        .zn5-panel {
          /* ادر's three measured steps of paper on a near-black ground:
             16.5:1, 7.7:1 and 5.2:1. The ground here is the same value, so
             the same numbers hold. */
          --ink: #fafafa;
          --ink2: rgba(250, 250, 250, 0.66);
          --ink3: rgba(250, 250, 250, 0.52);
          --hair: rgba(250, 250, 250, 0.11);
          --g: #131316;
          --prev: #0f3527;
          /* Shorter than انشر's 2.2% even though the step is the same size,
             and the reason is the direction rather than the distance: انشر's
             band is a NEUTRAL at the top of a coloured screen, this one is a
             SATURATED green at the top of a neutral one, and the eye reads
             chroma against grey harder than grey against chroma. Measured on
             both: 2.2% settles at y=16 with a worst single-pixel step of 3,
             1.5% settles at y=12 with a step of 4, and 1% settles at 8 with a
             step of 6 — which is the edge of what reads. 1.5% keeps the step
             invisible and takes a quarter off the band. Still finishes fifteen
             pixels above a pill that begins at y=27. */
          background: linear-gradient(
            to bottom,
            var(--prev) 0%,
            color-mix(in oklab, var(--prev), var(--g) 62%) 0.61%,
            color-mix(in oklab, var(--prev), var(--g) 90%) 1.02%,
            var(--g) 1.5%
          );
          color: var(--ink);
        }

        .zn-close {
          position: absolute; inset: 0; z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          place-items: center;
          padding: calc(var(--inset) + 3.4rem) var(--gut) calc(var(--inset) + 0.6rem);
        }
        /* Capped rather than fixed, so a narrow laptop shrinks the card
           instead of pushing it through the gutter. */
        .zn-closebox { width: min(100%, 1180px); height: 100%; display: grid; align-content: center; }
        .zn-close .zn-fit { width: 100%; }

        /* The measured child: the signature and the card as ONE object, so
           the fit pass scales the composition rather than the card alone and
           the two never drift apart on a small screen. */
        .zn5-stack { display: grid; gap: 92px; align-self: start; }

        /* The signature. The other three screens each stand a display word
           behind their object; this one has no fourth word, so the name
           stands behind it instead — quiet enough to be a signature and not a
           headline. Faded as a LAYER, never as alpha in the colour: the mark
           is 27 rectangles that meet at their edges, and a semi-transparent
           fill composites every one of those seams twice. */
        .zn5-sig { display: flex; justify-content: center; opacity: 0.11; }
        .zn5-sig svg { width: min(74%, 660px); height: auto; color: #fafafa; }

        /* The card. ادر's lit material at a larger radius: one hairline that
           is bright along the top edge and fades down, obeying a light that
           comes from above — no drop shadow, which this style refuses, and no
           second card grammar, because the dark screens are one family. */
        .zn5-card {
          position: relative;
          border-radius: 34px;
          overflow: hidden;
          background: rgba(250, 250, 250, 0.028);
          box-shadow: inset 0 1px 0 rgba(250, 250, 250, 0.17),
                      inset 0 0 0 1px rgba(250, 250, 250, 0.065);
        }
        /* The wash, on its own layer rather than in the background, so the
           hairline above stays a hairline instead of being mixed into a
           gradient. Strongest at the top and gone by the middle: a surface is
           lit from one side, not tinted all over. */
        .zn5-sheen {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(
            to bottom,
            rgba(250, 250, 250, 0.07) 0%,
            rgba(250, 250, 250, 0.026) 34%,
            rgba(250, 250, 250, 0) 62%
          );
        }
        .zn5-body { position: relative; padding: 34px 36px 28px; }

        .zn5-cols {
          display: grid;
          grid-template-columns: 1.55fr 1fr 1fr 1fr;
          gap: 40px;
          align-items: start;
        }

        .zn5-brand { display: flex; flex-direction: column; align-items: flex-start; }
        .zn5-mark { display: block; color: var(--ink); }
        .zn5-claim {
          margin: 16px 0 0; max-width: 34ch;
          font-size: 13px; line-height: 1.85; color: var(--ink2);
        }
        /* The one inversion this page already uses, taken the other way: on
           paper the call to action is obsidian, on a dark ground it is paper.
           Same control, same reading. */
        .zn5-cta {
          margin-top: 18px;
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 15px; border-radius: 999px;
          background: #fafafa; color: #131316;
          font-size: 12.5px; line-height: 1; text-decoration: none;
          transition: background 260ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn5-cta:hover { background: #ffffff; transform: translateX(-2px); }
        .zn5-cta .ic { width: 14px; height: 14px; }
        .zn5-mail {
          margin-top: 14px;
          font-size: 12px; color: var(--ink3); text-decoration: none;
          transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn5-mail:hover { color: var(--ink2); }

        /* No tracking on the headings. The reference letter-spaces its
           uppercase labels; Arabic has no upper case and its letters connect,
           so tracking here draws the joins apart. Same rule the display line
           keeps, arriving at a twelve-pixel label. */
        .zn5-col h3 {
          margin: 0 0 14px; font-size: 12px; font-weight: 500;
          line-height: 1; color: var(--ink3);
        }
        .zn5-col ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 11px; }
        .zn5-col a {
          font-size: 13px; line-height: 1.4; color: var(--ink2); text-decoration: none;
          transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn5-col a:hover { color: var(--ink); }

        /* The one rule on this page besides the separator inside the header
           pill, and it is the same exception: a hairline INSIDE a surface,
           never a line drawn across the page. */
        .zn5-bottom {
          margin-top: 30px; padding-top: 22px;
          border-top: 1px solid var(--hair);
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .zn5-social { display: flex; gap: 8px; }
        .zn5-social a {
          width: 32px; height: 32px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--ink3);
          box-shadow: inset 0 0 0 1px rgba(250, 250, 250, 0.1);
          transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      background 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .zn5-social a:hover {
          color: var(--ink);
          background: rgba(250, 250, 250, 0.05);
          box-shadow: inset 0 0 0 1px rgba(250, 250, 250, 0.2);
        }
        .zn5-social svg { width: 14px; height: 14px; }
        .zn5-legal { margin: 0; font-size: 11.5px; line-height: 1.6; color: var(--ink3); }

        /* The arrival. data-run carries it, so at REST there is no attribute
           written at all and the finished state is the resting state — the
           rule this page has broken twice and does not break again. */
        @keyframes zn5-rise {
          from { opacity: 0; transform: translateY(18px); }
        }
        @keyframes zn5-lift {
          from { opacity: 0; transform: translateY(10px); }
        }
        .zn5-stack[data-run] .zn5-card {
          animation: zn5-rise 640ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
          animation-delay: 90ms;
        }
        .zn5-stack[data-run] .zn5-sig,
        .zn5-stack[data-run] .zn5-brand,
        .zn5-stack[data-run] .zn5-col,
        .zn5-stack[data-run] .zn5-bottom {
          animation: zn5-lift 560ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
          animation-delay: calc(140ms + var(--d, 0) * 70ms);
        }

        /* Narrow. The brand takes the full width and the three lists pair up
           beneath it, which is what the reference does at its own breakpoint;
           three Arabic lists side by side on a phone wrap every label. */
        /* Below 900 the three lists pair up and the stack gets tall, so the
           signature and the gap come down with it. The bar is section two's
           own worst fit ratio, 0.763: at 900x700 this composition first
           measured 0.751, which is under it, and what gave way is furniture
           — the signature and the gap — never a label. 0.767 after. */
        @media (max-width: 900px) {
          .zn5-stack { gap: 44px; }
          .zn5-sig svg { width: min(72%, 360px); }
          .zn5-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px 24px; }
          .zn5-brand { grid-column: 1 / -1; }
          .zn5-claim { max-width: 46ch; }
        }
        /* A phone is the one place the composition has to give something up,
           and what gives is furniture rather than a label: the signature comes
           down and the gap with it, so the fit pass never has to scale the
           links into type nobody can read. */
        /* Three lists fit side by side down to about 640; below that the
           longest label wraps every row, so they pair up and the odd one out
           takes the second row. A phone footer looks like that everywhere; a
           TABLET with a lone column and 170px of dead card beside it does
           not, which is what two columns at 768 gave. */
        @media (max-width: 640px) {
          .zn5-stack { gap: 34px; }
          .zn5-sig svg { width: min(66%, 300px); }
          .zn5-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .zn5-card { border-radius: 26px; }
          .zn5-body { padding: 26px 22px 22px; }
          .zn5-cols { gap: 24px 18px; }
          .zn5-bottom { margin-top: 24px; padding-top: 18px; }
        }


        @media (prefers-reduced-motion: reduce) {
          #zn-track { transition: none; }
          .zn-card, .zn-dish, .zn-finish, .zn-service, .zn-shot img { animation: none; }
          .zn-finish .go, .zn-word > span, .zn-hero-only { transition: none; }
          .zn-cursor, .zn-cursor svg, .zn-tile, .zn-tile .go, .zn-chip,
          .zn-preset, .zn-hour u, .zn-in { transition: none; }
          .zn-in[data-on="true"] em::after { animation: none; }
          .zn-words > span { animation: none; }
          .zn3-chart .line, .zn3-chart .area, .zn3-chart .tip { animation: none; }
          .zn3-chart .cross, .zn3-chart .dot, .zn3-chart .tip { transition: none; }
          .zn-w, .zn-slot { transition: none; }
          .zn-pill, .zn-drawer, .zn-corner, .zn-phone-pill, .zn-phone-drawer { transition: none; }
          #zn-glow i { animation: none; }
          #zn-glow { transition: none; }
          .zn-swatch, .zn-swatch i { animation: none; }
          .zn-glowlabel > span { transition: none; }
          #zn-claim .line[data-state="read"] > .text { animation: none; clip-path: none; }
          #zn-claim .line > .caret { display: none; }
          #zn-claim .line, #zn-claim .dot { transition: none; }
          .zn4-win, .zn4-cursor, .zn4-cursor svg, .zn4-word > span,
          .zn4-site .status, .zn4-domrow .disc, .zn4-switch button { transition: none; }
          .zn4-in, .zn4-tr, .zn4-domrow, .zn4-site .host { animation: none; }
          .zn4-load[data-on], .zn4-site .status .dot, .spin { animation: none; }
          .zn4-win[data-down] { transform: none; opacity: 1; }
          .zn4-app { transition: none; }
          .zn5-stack[data-run] .zn5-card,
          .zn5-stack[data-run] .zn5-sig,
          .zn5-stack[data-run] .zn5-brand,
          .zn5-stack[data-run] .zn5-col,
          .zn5-stack[data-run] .zn5-bottom { animation: none; }
          .zn5-cta, .zn5-mail, .zn5-col a, .zn5-social a { transition: none; }
        }
      ` }} />

      {/* Header. A floating pill rather than a bar: it sits on the paper with
          a hairline ring and no underline, so nothing divides the page.
          Fixed, so it costs the hero no vertical space and the words stay
          dead centre in the viewport. */}
      {/* The header crosses every screen, so it takes the ground it is
          standing on. On ادر it inverts with the panel and on the same clock
          as the move, which is what makes arriving there read as one event
          rather than a dark box sliding under a white pill. */}
      <header
        id="pill-header"
        ref={headerRef}
        dir="rtl"
        data-dark={deck >= 2}
        /* Which dark screen, so the pill lifts THAT ground rather than
           wearing one neutral glass across three different rooms. The footer
           stands on ادر's obsidian, so it takes ادر's lift — a separate name
           because it is a separate panel, not because the values differ. */
        data-panel={
          deck === 4 ? "close" : deck === 3 ? "publish" : deck === 2 ? "manage" : undefined
        }
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
            className="zn-phone-pill mx-auto w-fit max-w-full overflow-hidden rounded-[22px] md:hidden"
            data-open={menuOpen}
            style={{
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
            className="zn-pill hidden overflow-hidden rounded-[24px] md:block"
            style={{
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
              <Type size={14} strokeWidth={1.6} aria-hidden />
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
              {/* The button wears the mix it is currently set to, and says so
                  when it changes. Keyed on the light, so React remounts it and
                  the arrival replays — that replay, landing on the same frame
                  as the page changing colour, is what tells a reader the two
                  belong to each other. */}
              <span key={glowId} className="zn-swatch" style={{ background: lit ? glow.grad : "transparent" }} aria-hidden>
                {lit && <i />}
              </span>
              <span className="zn-glowlabel">
                <span data-on={!glowNamed}>اللون</span>
                <span data-on={glowNamed} aria-hidden={!glowNamed}>{glow.name}</span>
              </span>
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
      {/* The deck. Five screens on one track, a gesture apart. Fixed rather
          than any height in viewport units, for the reason below; the track
          is four times the deck and each panel a quarter of the track, so a
          panel is exactly one screen whatever zoom the root is writing. */}
      {/* data-lit is not "is the light on" but "is there anything behind the
          floating surfaces", which is what decides how hard the controls have
          to work to read as controls. It counted every screen but the hero
          while ابن had a ground; ابن is bare paper again, so the first two
          screens are both unlit and only ادر and انشر count. */}
      <div id="zn-deck" data-moving={!settled} data-lit={lit || deck >= 2} style={{ background: PAPER }}>
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
        <div
          id="zn-glow"
          aria-hidden
          data-on={lit}
          style={{ "--glow": paintGrad } as React.CSSProperties}
        >
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
            edit={edit}
          />
        </div>

        {/* Section three: ادر, the manage step — the three dashboard surfaces
            the owner lives in once the site exists. The one panel on this
            page that is not white paper: it is the inside of the product, so
            it is obsidian, and it carries the page's single accent. */}
        <div className="zn-panel zn3-panel" data-accent={accent} data-cards={cards} aria-hidden={deck !== 2}>
          {/* The light for the seam. It hangs UPWARD past the top of this
              panel onto the foot of ابن, exactly the way the hero's foot glow
              hangs down onto the head of it — one light allowed to cross,
              never two that have to be made to match. */}
          <div className="zn3-glow" aria-hidden><i /></div>
          <ManageSection
            active={deck === 2 && settled}
            uiClass={appUi.className}
            wordClass={display.className}
            wordWeight={500}
            wordLh={1.28}
            edit={edit}
          />
        </div>

        {/* Section four: انشر, the publish step — the address being bought,
            the site going live under it, and then the site itself. The one
            panel with a colour of its own: still the inside of the product,
            but a different room, and the hue is the one the product already
            paints a live site in. */}
        <div className="zn-panel zn4-panel" data-ground={ground} aria-hidden={deck !== 3}>
          <PublishSection
            active={deck === 3 && settled}
            uiClass={appUi.className}
            wordClass={display.className}
            wordWeight={500}
            wordLh={1.28}
            edit={edit}
          />
        </div>

        {/* Section five: the close. Not a fourth word — the hero cycles three
            and there is no fourth — but the place the page comes to rest: the
            mark, the one claim, the real pages and the real company line.
            The deck has no free scrolling, so a footer here is either a whole
            screen or it does not exist.

            It stands on ادر's obsidian rather than going back to paper.
            Evergreen to obsidian is 34 units, the same step انشر hides in a
            ramp short enough to finish above the header pill; paper is 231,
            and a ramp long enough for that lands a band of light under the
            pill unless something in the band explains it. */}
        <div className="zn-panel zn5-panel" aria-hidden={deck !== 4}>
          <FooterSection active={deck === 4 && settled} uiClass={appUi.className} />
        </div>
        </div>
      </div>
    </>
  )
}
