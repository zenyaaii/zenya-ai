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

/* The default face for the three words, and the only one that is preloaded,
   because it is what the page renders before anybody picks anything. Both cuts
   are declared here: the rail offers Tajawal at 900 and at 200. */
const display = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "900"],
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
  /** Optical correction: these families do not agree on what 1em looks like. */
  scale: number
}

/* Ordered by kind rather than alphabet: contemporary sans first, then the kufi
   and display faces, then naskh, with nastaliq last. */
const STYLES: TypeStyle[] = [
  { id: "almarai-400", name: "Almarai", cls: fAlmarai.className, weight: 400, lh: 1.24, scale: 1.15 },
  { id: "cairo-900", name: "Cairo", cls: fCairo.className, weight: 900, lh: 1.3, scale: 1.09 },
  { id: "cairo-200", name: "Cairo", cls: fCairo.className, weight: 200, lh: 1.3, scale: 1.38 },
  { id: "tajawal-900", name: "Tajawal", cls: display.className, weight: 900, lh: 1.28, scale: 1.02 },
  { id: "tajawal-200", name: "Tajawal", cls: display.className, weight: 200, lh: 1.28, scale: 1.29 },
  { id: "ibm-plex-sans-arabic-500", name: "IBM Plex Sans Arabic", cls: ui.className, weight: 500, lh: 1.3, scale: 1.29 },
  { id: "noto-sans-arabic-500", name: "Noto Sans Arabic", cls: fNotoSansArabic.className, weight: 500, lh: 1.3, scale: 1.19 },
  { id: "noto-kufi-arabic-900", name: "Noto Kufi Arabic", cls: fNotoKufiArabic.className, weight: 900, lh: 1.34, scale: 0.92 },
  { id: "noto-kufi-arabic-200", name: "Noto Kufi Arabic", cls: fNotoKufiArabic.className, weight: 200, lh: 1.34, scale: 1.29 },
  { id: "alexandria-800", name: "Alexandria", cls: fAlexandria.className, weight: 800, lh: 1.28, scale: 0.98 },
  { id: "alexandria-100", name: "Alexandria", cls: fAlexandria.className, weight: 100, lh: 1.28, scale: 1.35 },
  { id: "readex-pro-400", name: "Readex Pro", cls: fReadexPro.className, weight: 400, lh: 1.3, scale: 1.09 },
  { id: "vazirmatn-400", name: "Vazirmatn", cls: fVazirmatn.className, weight: 400, lh: 1.3, scale: 1.24 },
  { id: "rubik-500", name: "Rubik", cls: fRubik.className, weight: 500, lh: 1.28, scale: 1.15 },
  { id: "mada-500", name: "Mada", cls: fMada.className, weight: 500, lh: 1.28, scale: 1.27 },
  { id: "changa-500", name: "Changa", cls: fChanga.className, weight: 500, lh: 1.28, scale: 1.17 },
  { id: "zain-300", name: "Zain", cls: fZain.className, weight: 300, lh: 1.28, scale: 1.18 },
  { id: "reem-kufi-500", name: "Reem Kufi", cls: fReemKufi.className, weight: 500, lh: 1.3, scale: 1.32 },
  { id: "reem-kufi-fun-500", name: "Reem Kufi Fun", cls: fReemKufiFun.className, weight: 500, lh: 1.3, scale: 1.32 },
  { id: "reem-kufi-ink-400", name: "Reem Kufi Ink", cls: fReemKufiInk.className, weight: 400, lh: 1.3, scale: 1.35 },
  { id: "kufam-600", name: "Kufam", cls: fKufam.className, weight: 600, lh: 1.32, scale: 1.03 },
  { id: "qahiri-400", name: "Qahiri", cls: fQahiri.className, weight: 400, lh: 1.24, scale: 1.22 },
  { id: "el-messiri-600", name: "El Messiri", cls: fElMessiri.className, weight: 600, lh: 1.32, scale: 1.17 },
  { id: "marhey-500", name: "Marhey", cls: fMarhey.className, weight: 500, lh: 1.32, scale: 1.17 },
  { id: "lemonada-500", name: "Lemonada", cls: fLemonada.className, weight: 500, lh: 1.34, scale: 0.96 },
  { id: "cairo-play-600", name: "Cairo Play", cls: fCairoPlay.className, weight: 600, lh: 1.3, scale: 1.24 },
  { id: "baloo-bhaijaan-2-600", name: "Baloo Bhaijaan 2", cls: fBalooBhaijaan2.className, weight: 600, lh: 1.36, scale: 1.19 },
  { id: "lalezar-400", name: "Lalezar", cls: fLalezar.className, weight: 400, lh: 1.26, scale: 1.35 },
  { id: "rakkas-400", name: "Rakkas", cls: fRakkas.className, weight: 400, lh: 1.32, scale: 1.48 },
  { id: "handjet-500", name: "Handjet", cls: fHandjet.className, weight: 500, lh: 1.3, scale: 1.48 },
  { id: "blaka-400", name: "Blaka", cls: fBlaka.className, weight: 400, lh: 1.34, scale: 1.63 },
  { id: "blaka-ink-400", name: "Blaka Ink", cls: fBlakaInk.className, weight: 400, lh: 1.34, scale: 1.63 },
  { id: "blaka-hollow-400", name: "Blaka Hollow", cls: fBlakaHollow.className, weight: 400, lh: 1.34, scale: 1.63 },
  { id: "jomhuria-400", name: "Jomhuria", cls: fJomhuria.className, weight: 400, lh: 1.16, scale: 1.77 },
  { id: "vibes-400", name: "Vibes", cls: fVibes.className, weight: 400, lh: 1.38, scale: 1.86 },
  { id: "amiri-400", name: "Amiri", cls: fAmiri.className, weight: 400, lh: 1.52, scale: 1.46 },
  { id: "amiri-quran-400", name: "Amiri Quran", cls: fAmiriQuran.className, weight: 400, lh: 1.7, scale: 1.48 },
  { id: "scheherazade-new-400", name: "Scheherazade New", cls: fScheherazadeNew.className, weight: 400, lh: 1.56, scale: 1.34 },
  { id: "lateef-400", name: "Lateef", cls: fLateef.className, weight: 400, lh: 1.52, scale: 1.78 },
  { id: "harmattan-400", name: "Harmattan", cls: fHarmattan.className, weight: 400, lh: 1.46, scale: 1.53 },
  { id: "markazi-text-600", name: "Markazi Text", cls: fMarkaziText.className, weight: 600, lh: 1.42, scale: 1.42 },
  { id: "mirza-500", name: "Mirza", cls: fMirza.className, weight: 500, lh: 1.5, scale: 1.59 },
  { id: "katibeh-400", name: "Katibeh", cls: fKatibeh.className, weight: 400, lh: 1.46, scale: 1.69 },
  { id: "noto-naskh-arabic-500", name: "Noto Naskh Arabic", cls: fNotoNaskhArabic.className, weight: 500, lh: 1.52, scale: 1.29 },
  { id: "ruwudu-500", name: "Ruwudu", cls: fRuwudu.className, weight: 500, lh: 1.46, scale: 1.29 },
  { id: "alkalami-400", name: "Alkalami", cls: fAlkalami.className, weight: 400, lh: 1.54, scale: 1.54 },
  { id: "aref-ruqaa-400", name: "Aref Ruqaa", cls: fArefRuqaa.className, weight: 400, lh: 1.6, scale: 1.48 },
  { id: "aref-ruqaa-ink-400", name: "Aref Ruqaa Ink", cls: fArefRuqaaInk.className, weight: 400, lh: 1.6, scale: 1.48 },
  { id: "gulzar-400", name: "Gulzar", cls: fGulzar.className, weight: 400, lh: 1.8, scale: 1.53 },
  { id: "noto-nastaliq-urdu-500", name: "Noto Nastaliq Urdu", cls: fNotoNastaliqUrdu.className, weight: 500, lh: 2.1, scale: 1.3 },
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

const WORDS = ["ابن", "ادر", "انشر"]

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
          /* Width sets the size, until height would lose. The second term caps
             the rendered line at 60vh whatever the setting asks for, which is
             what keeps a nastaliq at 2.1 leading on the screen when the window
             is wide and short. */
          font-size: min(
            calc(var(--display) * var(--scale, 1)),
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
        /* The light. Straight off the design file: a wide bar of oklch colour
           sitting mostly below the fold, blurred until it is only light, and
           breathing sideways and upward on a 19s cycle. The blur and the
           opacity live on the outer box, the colour and the movement on the
           inner one, so the filter is rasterised once instead of every frame.
           A fainter, slower, counter-running twin hangs off the top edge so
           the screen is lit from both ends. */
        #zn-glow { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
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
        #zn-claim { position: absolute; inset-inline: 0; bottom: calc(var(--inset) + 3.5rem); display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        @media (min-width: 768px) { #zn-claim { bottom: calc(var(--inset) + 0.4rem); } }
        #zn-claim .line { position: relative; white-space: nowrap; }
        #zn-claim .line > .text {
          display: inline-block;
          animation: zn-type 3.6s steps(50, end) 900ms backwards;
        }
        #zn-claim .line > .caret {
          position: absolute;
          top: 0.1em; bottom: 0.1em; left: 0;
          width: 1px;
          background: currentColor;
          animation: zn-type-caret 3.6s steps(50, end) 900ms backwards,
                     zn-blink 1.05s steps(1) infinite;
        }
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
        @keyframes zn-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

        /* The pill grows on two axes at once. Width is a layout property and
           normally off limits, but this is a single fixed-position element
           with nothing below it in flow, and it is the only way the bar can
           open outward from its own centre. The curve is shared with the
           height so the two read as one movement. */
        .zn-pill { transition: width 520ms cubic-bezier(0.22, 1, 0.36, 1); }

        /* The height half. Animating grid-template-rows between 0fr and 1fr
           is the one way to transition to an auto height in CSS without
           hard-coding a pixel value the contents would eventually outgrow.
           Visibility is stepped so tray links leave the focus order only once
           the tray has finished closing. */
        .zn-drawer {
          transition: grid-template-rows 520ms cubic-bezier(0.22, 1, 0.36, 1),
                      visibility 0s linear 520ms;
        }
        .zn-drawer[data-open="true"] { transition-delay: 0s, 0s; }

        /* The two corner controls. Anchored to the bottom of the screen, so
           height added by the tray pushes the surface upward, out of the
           corner; width is animated on the same curve as the header pill so
           every surface on the page opens the same way. */
        .zn-corner { transition: width 460ms cubic-bezier(0.22, 1, 0.36, 1); }

        /* The phone header's links, opening sideways with the pill around
           them. Visibility is stepped, so the links are out of the focus
           order until the row has finished opening. */
        .zn-inline-nav {
          transition: max-width 520ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 220ms ease 60ms,
                      visibility 0s linear 520ms;
        }
        .zn-inline-nav[data-open="true"] { transition-delay: 0s, 140ms, 0s; }

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

        @media (prefers-reduced-motion: reduce) {
          .zn-words > span { animation: none; }
          .zn-pill, .zn-drawer, .zn-corner, .zn-inline-nav { transition: none; }
          #zn-glow i { animation: none; }
          #zn-claim .line > .text { animation: none; clip-path: none; }
          #zn-claim .line > .caret { display: none; }
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
              inside it, rather than dropping a panel down over the page. The
              nav is what animates: max-width is the only thing a row of links
              can be opened with, since their real width is not known here. */}
          <div
            className="zn-pill mx-auto overflow-hidden rounded-full backdrop-blur-[12px] md:hidden"
            style={{
              background: "rgba(255,255,255,0.72)",
              boxShadow: RING,
              width: menuOpen ? "min(100%, 356px)" : "158px",
            }}
          >
            <div className="flex h-11 items-center gap-1 px-1.5">
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

              <Link href="/?home=1" aria-label="زينيا" className="flex shrink-0 items-center px-1.5">
                {/* Pure black is permitted here: the reference reserves #000 for
                    logo marks and graphic glyphs, nowhere else. */}
                <ZenyaMark className="h-[16px] text-black" />
              </Link>

              <nav
                id="pill-menu"
                className="zn-inline-nav flex items-center overflow-hidden"
                data-open={menuOpen}
                style={{
                  maxWidth: menuOpen ? "190px" : "0px",
                  opacity: menuOpen ? 1 : 0,
                  visibility: menuOpen ? "visible" : "hidden",
                }}
              >
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="whitespace-nowrap rounded-full px-1.5 py-2 text-[12.5px] leading-none"
                    style={{ color: STONE }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <span className="ms-auto flex shrink-0 items-center">{accountControl}</span>
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
      <div
        ref={typeRef}
        dir="rtl"
        className={`${ui.className} fixed bottom-[var(--inset)] left-[var(--gut)] z-40`}
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
        className={`${ui.className} fixed bottom-[var(--inset)] right-[var(--gut)] z-40`}
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
      <main
        id="blank-home"
        dir="rtl"
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: PAPER }}
      >
        {/* The light, behind everything and taking no pointer events. */}
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
          className={`${type.cls} zn-words relative z-[1] flex flex-wrap items-baseline justify-center gap-x-[0.3em] gap-y-1 text-center`}
          style={{
            color: OBSIDIAN,
            fontWeight: type.weight,
            lineHeight: type.lh,
            "--scale": type.scale,
            "--lh": type.lh,
          } as React.CSSProperties}
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

        {/* The claim, typed once over the light. Real content, not decoration,
            so it is in the document and readable with animation off. */}
        <p id="zn-claim" className={`${ui.className} text-[12px] md:text-[13px]`} style={{ color: STONE }}>
          <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: OBSIDIAN }} aria-hidden />
          <span className="line leading-none">
            <span className="text">أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي</span>
            <span className="caret" aria-hidden />
          </span>
        </p>
      </main>
    </>
  )
}
