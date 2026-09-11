"use client"

/**
 * The candidate auth card. See page.tsx for why this route exists and which
 * of the two live auth surfaces it mirrors.
 *
 * THE CARD IS THE PAGE, and it is one object that REMODELS. Sign-in asks for
 * two things, sign-up for four, and a reset for one, so the card is a
 * different height and a different shape in each mode. That remodel is the
 * animation on this page — not an ornament laid over it. The heading and the
 * subline roll on the deck's own word-roll, the name field and the consent
 * block grow from nothing on grid-template-rows, the tab indicator slides,
 * and the password rule fills as it is met. Nothing moves that is not
 * reporting a change the reader caused.
 *
 * THE ROLL'S GEOMETRY IS SlideButton's, because SlideButton already solved
 * this exact problem in this exact language: clipping Arabic at the element's
 * own height shaves the tails of ج ح خ ع غ م ه ي. So each face owns a whole
 * window, the clip lands in the leading, and the container is sized by the
 * TALLEST face rather than by a hard-coded pixel — which is what keeps
 * "إعادة تعيين كلمة المرور" from being cut off on a phone where it wraps to
 * two lines. The window is padded and the padding is pulled back out with a
 * negative margin, so the grace for descenders costs no layout.
 *
 * MOTION, and the one rule that governs it: a resting state is the finished
 * state. The card's arrival borrows its hidden half from .za-js, which the
 * script adds on mount, so a browser that never runs it reads a finished
 * form. The rolls need no such guard: their faces are positioned from state
 * that exists in the server-rendered HTML, so the resting face is visible
 * with no script at all. Everything collapses under prefers-reduced-motion.
 *
 * A SLOT THAT CLIPS AT REST WOULD EAT THE FOCUS RING. The growing field slots
 * clip on overflow so the arrival has an edge to come from, and the focus
 * halo is 4px OUTSIDE the input — so a slot that stayed clipped would slice
 * the ring off the name field and the reader would lose the one signal that
 * says where they are. The slot clips only while it is moving and goes back
 * to overflow:visible when it settles, on a timer rather than on
 * transitionend: see Slot for why that event cannot be relied on, and why
 * relying on it broke this for reduced-motion readers specifically. Resting
 * state, finished state.
 *
 * NOTHING HERE AUTHENTICATES. There is no supabase import in this file. The
 * validation is real and its strings are the real ones; when it passes, the
 * page stops and says what it is instead of pretending to POST. See handOff.
 *
 * THE HEADER IS THE CANDIDATE SET'S, mechanic and all, and its observer
 * watches ".zf" — the footer cap's real class, not the ".zf-inner" that
 * exists nowhere and left /demo/pricing's header un-inverted over the
 * obsidian.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Menu, UserPlus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import { z } from "zod"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import PricingFooter from "../pricing/PricingFooter"
import { CSS } from "./styles"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/* The candidate set links inside the candidate set, and the set's own three
   items in the set's own order. Reported three times on the other pages; it
   does not get to regress on the fifth. */
const NAV: Array<{ href: string; label: string }> = [
  { href: "/themes", label: "القوالب" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

type Mode = "signin" | "signup" | "forgot"

/** A remembered account: e-mail and display name only, NEVER a password. The
 *  shape is AccountsAuthForm's SavedAccount, because it is mirroring it. */
type SavedAccount = { email: string; name?: string }

/**
 * THE PORTAL'S STORE, shared on purpose.
 *
 * components/accounts/AccountsAuthForm remembers accounts under this key and
 * this page writes the same shape into it, so someone who signs in here finds
 * their account waiting at accounts.zenyaai.co and the other way round. While
 * this page was a proposal it kept a separate key, because writing into the
 * real list would have put a name on the real sign-in screen that nobody had
 * typed there. It is the real sign-in screen now.
 *
 * The cap is the portal's four, not the demo's three, for the same reason:
 * two lists with different lengths would drop an account on whichever screen
 * you happened to use second.
 */
const STORE = "zenya_accounts"
const MAX_SAVED = 4

function loadAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORE)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter((a) => a && typeof a.email === "string").slice(0, MAX_SAVED)
  } catch {
    return []
  }
}

function saveAccounts(list: SavedAccount[]) {
  try { localStorage.setItem(STORE, JSON.stringify(list.slice(0, MAX_SAVED))) } catch {}
}

/** AccountsAuthForm's own initial: first character of the name, else of the
 *  e-mail. Kept identical so the avatar cannot drift between the two. */
function initialFor(a: SavedAccount): string {
  return (a.name || a.email || "؟").trim().slice(0, 1).toUpperCase()
}

/* The two checks the real pages run, and they run them with zod and a length,
   so this file runs them with zod and a length. A demo whose rules are
   stricter or looser than the product's is testing a form the product does
   not have. */
const validateEmail = (v: string) => z.string().email().safeParse(v).success
const validatePassword = (v: string) => v.length >= 6
/** The one number the real pages enforce, named once. */
const MIN_PASS = 6

/* The headings and sublines, in the order the roll stacks them. Faces 0-2 are
   the three modes, verbatim from app/(main)/login/page.tsx. Face 3 is the
   chooser's, and it is the one subline on this page the demo had to write:
   the portal says "اختر حسابًا للمتابعة إلى لوحة التحكم" because it has a
   live session to continue INTO, and this page has none. Promising a reader
   the dashboard and then handing them a prefilled form would be the same
   class of lie as a fake POST. */
const HEADS = ["أهلًا بعودتك", "أنشئ حسابك", "إعادة تعيين كلمة المرور", "أهلًا بعودتك"]
const SUBS = [
  "سجّل الدخول للوصول إلى قوالبك في زينيا.",
  "ابدأ بناء قوالب عالية التحويل اليوم.",
  "أدخل بريدك الإلكتروني لتصلك رابط إعادة التعيين.",
  "اختر حسابًا محفوظًا، أو سجّل الدخول بحساب آخر.",
]

const ACTION: Record<Mode, string> = {
  signin: "تسجيل الدخول",
  signup: "إنشاء حساب",
  forgot: "إرسال رابط التعيين",
}

/* What the reader is told once the call comes back. Sign-in has no string
   because it does not stop here: the session opens and the router leaves for
   ?next=. The other two end on this page and have to say what is now in the
   reader's inbox. */
const SUCCESS: Record<Mode, string | null> = {
  signin: null,
  signup: "تم إنشاء الحساب! يرجى التحقق من بريدك لتأكيده.",
  forgot: "تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك.",
}

/* The line under it: what to do while waiting, since both are waits. */
const SUCCESS_NOTE: Record<Mode, string | null> = {
  signin: null,
  signup: "الرابط صالح لمدة محدودة. إن لم يصلك خلال دقائق، تحقّق من مجلد البريد العشوائي.",
  forgot: "إن لم يصلك بريد، فالغالب أن هذا العنوان ليس مسجّلًا لدينا — أنشئ حسابًا بدلًا من ذلك.",
}

/** The string Supabase does not throw, and the one this page has to notice.
 *  With "Confirm email" on, a duplicate signup returns a user with an empty
 *  identities array and sends no mail, so that it cannot be used to discover
 *  which addresses exist. Left alone, the reader waits for a message that is
 *  never coming. */
const ALREADY_REGISTERED =
  "هذا البريد مسجّل بالفعل. سجّل الدخول، أو أعد تعيين كلمة المرور إن نسيتها."

/**
 * ?mode= DRIVES THE PAGE, exactly as it drives app/(main)/login, because that
 * is how every "ابدأ" on the site links to the auth surface. It arrives as a
 * PROP resolved on the server rather than through useSearchParams, which is
 * what app/accounts/{login,signup} already do with initialMode.
 *
 * That is not a style preference. useSearchParams has to sit inside a
 * Suspense boundary, and a client-side navigation into a suspended subtree
 * that also carries this page's inline <style> is a shape React can fail to
 * reconcile — the first build of this did, blanking the whole page on the
 * very click the header CTA makes. Resolved on the server there is no
 * boundary, no hook, and no client-side transition to get wrong.
 */
export default function AccessView({
  initialMode = "signin",
  next = "/dashboard",
}: {
  initialMode?: Mode
  /** Where a completed sign-in goes. Read from ?next= on the server. */
  next?: string
}) {
  const initial = initialMode
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<Mode>(initial)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Set when a call came back and the page has something to report: an
   *  account awaiting confirmation, or a reset link on its way. Signing in
   *  never sets it, because signing in leaves. */
  const [handed, setHanded] = useState<Mode | null>(null)
  /** A call is in flight. Blocks a second submit and dims the action. */
  const [busy, setBusy] = useState(false)
  const [accounts, setAccounts] = useState<SavedAccount[]>([])
  /** The reader has asked to type credentials, so the chooser stands aside. */
  const [typing, setTyping] = useState(initial !== "signin")
  const [onDark, setOnDark] = useState(false)

  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)
  const passRef = useRef<HTMLInputElement | null>(null)

  /* The chooser stands in for the form on the same terms the portal sets:
     sign-in mode, the reader has not opted into typing, and there is actually
     something to offer. */
  const chooser = mode === "signin" && !typing && !handed && accounts.length > 0

  useEffect(() => { setAccounts(loadAccounts()) }, [])

  /* Arrival. The hidden half lives under .za-js so a browser that never runs
     the script reads a finished card rather than an invisible one. */
  useEffect(() => { rootRef.current?.classList.add("za-js") }, [])

  /* The header takes the ground it is standing on. Same mechanic as the four
     sibling pages: the band is the strip the pill occupies, in CSS pixels.
     The root ZoomLock writes CSS zoom, so a rect and a rootMargin are already
     in the same space — do not divide by the zoom.

     It watches ".zf", which is the footer cap's real class. */
  useEffect(() => {
    const head = headRef.current
    const root = rootRef.current
    if (!head || !root) return
    let io: IntersectionObserver | null = null
    const live = new Set<Element>()
    const darks = Array.from(root.querySelectorAll<HTMLElement>(".zf"))
    const build = () => {
      io?.disconnect()
      live.clear()
      /* The first match in DOM order is whichever pill is hidden at this
         width, and a hidden element has a zero rect. Filter by height. */
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".za-pill, .za-phone-pill"))
        .find((el) => el.getBoundingClientRect().height > 0)
      if (!pill) return
      const r = pill.getBoundingClientRect()
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)))
          setOnDark(live.size > 0)
        },
        { rootMargin: -r.top + "px 0px " + -(window.innerHeight - r.bottom) + "px 0px", threshold: 0 }
      )
      darks.forEach((el) => io!.observe(el))
    }
    build()
    window.addEventListener("resize", build)
    return () => { io?.disconnect(); window.removeEventListener("resize", build) }
  }, [])

  const go = useCallback((m: Mode) => {
    setMode(m)
    setError(null)
    setHanded(null)
    if (m !== "signin") setTyping(true)
  }, [])

  /**
   * Remember the address, so the chooser is there next time.
   *
   * Signing in carries no name in the form, so a name this address is already
   * remembered under is KEPT rather than overwritten by the empty string —
   * otherwise signing up and then signing in turns a chooser row from a
   * person's name back into a bare e-mail. When Supabase hands back a display
   * name of its own it wins, which is what the portal does too.
   */
  const remember = useCallback(
    (addr: string, name?: string) => {
      const known = accounts.find((a) => a.email.toLowerCase() === addr.toLowerCase())
      const label = (name || "").trim() || known?.name
      const list = [
        { email: addr, name: label || undefined },
        ...accounts.filter((a) => a.email.toLowerCase() !== addr.toLowerCase()),
      ].slice(0, MAX_SAVED)
      setAccounts(list)
      saveAccounts(list)
      try {
        localStorage.setItem("zenya_last_email", addr)
      } catch {}
    },
    [accounts],
  )

  /**
   * SIGN IN, SIGN UP, OR SEND THE RESET LINK.
   *
   * The checks run first, in the order the product enforces them and throwing
   * the product's own strings, so a six-character rule or a missing consent
   * box is caught before any network call. Then the mode decides which of the
   * three Supabase calls runs.
   *
   * THE DUPLICATE-SIGNUP CASE IS THE ONE THAT NEEDS CODE. With "Confirm
   * email" on, signing up with an address that already exists does not error
   * — that would let anyone enumerate the user table — it returns a user with
   * an empty identities array and sends nothing. Without the check below the
   * reader sits waiting for a confirmation mail that was never sent.
   */
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    try {
      if (mode === "forgot") {
        if (!validateEmail(email)) throw new Error("يرجى إدخال بريد إلكتروني صالح.")
      } else if (mode === "signin") {
        if (!email || !password) throw new Error("يرجى تعبئة جميع الحقول.")
      } else {
        if (!fullName) throw new Error("يرجى إدخال اسمك الكامل.")
        if (!validateEmail(email)) throw new Error("يرجى إدخال بريد إلكتروني صالح.")
        if (!validatePassword(password)) throw new Error("يجب ألّا تقلّ كلمة المرور عن 6 أحرف.")
        if (!acceptTerms) throw new Error("يرجى الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما.")
      return
    }

    setBusy(true)
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (err) throw err
        setHanded("forgot")
        return
      }

      if (mode === "signin") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        remember(email, (data.user?.user_metadata?.full_name as string) || undefined)
        try {
          localStorage.setItem("zenya_email", email)
        } catch {}
        router.push(next)
        router.refresh()
        return
      }

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
          data: {
            full_name: fullName.trim(),
            consent_terms_v: "1",
            consent_terms_at: new Date().toISOString(),
          },
        },
      })
      if (err) throw err

      const alreadyRegistered =
        !!data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0
      if (alreadyRegistered) {
        setError(ALREADY_REGISTERED)
        return
      }

      remember(email, fullName)
      if (data.session) {
        try {
          localStorage.setItem("zenya_email", email)
        } catch {}
        router.push(next)
        router.refresh()
        return
      }
      setHanded("signup")
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما.")
    } finally {
      setBusy(false)
    }
  }

  /** The portal's own pickAccount: prefill, clear the password, focus it. */
  function pick(a: SavedAccount) {
    setEmail(a.email)
    setPassword("")
    setMode("signin")
    setError(null)
    setTyping(true)
    window.setTimeout(() => passRef.current?.focus(), 60)
  }

  function forget(addr: string) {
    const next = accounts.filter((a) => a.email.toLowerCase() !== addr.toLowerCase())
    setAccounts(next)
    saveAccounts(next)
    if (next.length === 0) setTyping(false)
  }

  /* Which face each roll is showing. The chooser gets the fourth subline but
     keeps the sign-in heading, because it IS the sign-in screen. */
  const headFace = mode === "signin" ? 0 : mode === "signup" ? 1 : 2
  const subFace = chooser ? 3 : headFace
  const tab = mode === "signup" ? 1 : 0
  const passStrength = Math.min(password.length / MIN_PASS, 1)

  return (
    <main className={"za-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header ref={headRef} className={"za-head " + plex.className} data-dark={onDark ? "true" : undefined}>
        <div className="za-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
          <div className="za-phone-bar">
            <button type="button" className="za-round" aria-expanded={menuOpen} aria-controls="za-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/" aria-label="زينيا" className="za-phone-mark"><ZenyaMark className="za-mark-svg-sm" /></Link>
            {/* The set's own end control, unchanged. On this page it doubles as
                the exit to the real thing, which is where it already pointed. */}
            <Link href="/login?mode=signup" className="za-account za-account-phone">ابدأ</Link>
          </div>
          <div className="za-drawer" data-open={menuOpen ? "true" : undefined}
            style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", visibility: menuOpen ? "visible" : "hidden" }}>
            <div className="za-drawer-clip">
              <nav id="za-phone-menu" className="za-phone-menu">
                {NAV.map((i) => (
                  <Link key={i.href} href={i.href} className="za-tray-row" onClick={() => setMenuOpen(false)}>{i.label}</Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="za-pill">
          <div className="za-bar">
            <span className="za-side za-side-start">
              <Link href="/" className="za-mark" aria-label="زينيا"><ZenyaMark className="za-mark-svg" /></Link>
            </span>
            <nav className="za-nav">
              {NAV.map((i) => (
                <Link key={i.href} href={i.href} className="za-nav-item">{i.label}</Link>
              ))}
            </nav>
            <span className="za-side za-side-end">
              <span className="za-sep" aria-hidden />
              <Link href="/login?mode=signup" className="za-account">ابدأ</Link>
            </span>
          </div>
        </div>
      </header>

      <div className="za-stage">
        {/* THE SIGNATURE, and it is not decoration.
            Section five of the house style records this exact problem and
            this exact answer: without something standing behind it, a card
            centred on an empty screen "reads as a card rather than as the end
            of something". That page stands the name behind its card at 11%
            paper on obsidian; this one inverts it — obsidian on paper, and
            fainter, because a white card on light paper has far less to hide
            behind than a dark one on obsidian.

            Faded as a LAYER, never as alpha in the colour. The mark is 27
            rectangles that meet at their edges, and a semi-transparent fill
            composites every one of those seams twice. */}
        <div className="za-well">
          <span className="za-sig" aria-hidden><ZenyaMark className="za-sig-svg" /></span>
        <section className="za-card" aria-labelledby="za-h1">
          <Link href="/" className="za-card-mark" aria-label="زينيا">
            <ZenyaMark className="za-card-mark-svg" />
          </Link>

          {/* THE SWITCH. The real pages change mode through small links under
              the form, and those links are still here — but a two-state
              choice that the whole card reshapes around deserves a control
              you can see before you have read to the bottom. The indicator is
              a transform between two halves, so it moves rather than
              redrawing, and it retracts in reset mode because neither tab is
              true there. */}
          <div className="za-switch" role="tablist" aria-label="نوع الدخول" data-off={mode === "forgot" ? "true" : undefined}>
            <span className="za-switch-ind" aria-hidden style={{ transform: "translateX(" + (tab === 1 ? "-100%" : "0%") + ")" }} />
            <button type="button" role="tab" className="za-tab" aria-selected={mode === "signin"}
              data-on={mode === "signin" ? "true" : undefined} onClick={() => { setTyping(false); go("signin") }}>
              تسجيل الدخول
            </button>
            <button type="button" role="tab" className="za-tab" aria-selected={mode === "signup"}
              data-on={mode === "signup" ? "true" : undefined} onClick={() => go("signup")}>
              حساب جديد
            </button>
          </div>

          <div className="za-heads">
            <RollH list={HEADS} face={headFace} />
            <RollP list={SUBS} face={subFace} />
          </div>

          {handed ? (
            <HandOff mode={handed} email={email} onBack={() => setHanded(null)} />
          ) : chooser ? (
            <div className="za-accs">
              {accounts.map((a) => (
                <div key={a.email} className="za-acc">
                  <button type="button" className="za-acc-pick" onClick={() => pick(a)}>
                    <span className="za-acc-av" aria-hidden>{initialFor(a)}</span>
                    <span className="za-acc-id">
                      <span className="za-acc-name">{a.name || a.email}</span>
                      <span className="za-acc-mail" dir="ltr">{a.email}</span>
                    </span>
                    <ArrowLeft className="za-acc-go" size={15} strokeWidth={2.25} aria-hidden />
                  </button>
                  <button type="button" className="za-acc-x" aria-label={"إزالة " + a.email + " من القائمة"}
                    onClick={() => forget(a.email)}>
                    <X size={13} strokeWidth={2.5} aria-hidden />
                  </button>
                </div>
              ))}
              <button type="button" className="za-acc-add" onClick={() => { setTyping(true); setEmail(""); setPassword(""); setError(null) }}>
                <UserPlus size={14} strokeWidth={2} aria-hidden />
                تسجيل الدخول بحساب آخر
              </button>
              <p className="za-acc-note">
                هذه الأسماء محفوظة في متصفحك أنت وحدك لتسهيل الدخول — لا كلمات مرور ولا جلسات، والحذف يمحوها من هنا فقط.
              </p>
            </div>
          ) : (
            <form className="za-form" onSubmit={submit} noValidate>
              {accounts.length > 0 && mode === "signin" ? (
                <button type="button" className="za-back" onClick={() => { setTyping(false); setError(null) }}>
                  <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
                  العودة إلى الحسابات المحفوظة
                </button>
              ) : null}

              <Slot on={mode === "signup"}>
                <Field id="za-name" label="الاسم الكامل" required>
                  <input id="za-name" className="za-in" type="text" value={fullName} autoComplete="name"
                    placeholder="محمد النجار" onChange={(e) => setFullName(e.target.value)} />
                </Field>
              </Slot>

              <Field id="za-email" label="البريد الإلكتروني" required>
                <input id="za-email" className="za-in za-ltr" type="email" value={email} autoComplete="email"
                  dir="ltr" placeholder="name@company.com" onChange={(e) => setEmail(e.target.value)} />
              </Field>

              <Slot on={mode !== "forgot"}>
                <Field id="za-pass" label="كلمة المرور" required>
                  <div className="za-pass">
                    <input id="za-pass" ref={passRef} className="za-in za-in-pass"
                      type={showPassword ? "text" : "password"} value={password}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="za-eye" onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                      {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                    </button>
                  </div>
                  {/* THE ONE RULE THE PRODUCT ACTUALLY HAS, shown while it is
                      being met rather than after it is broken. It is a length,
                      not a strength score: scoring entropy here would invent a
                      password policy the product does not enforce. Sign-up
                      only, because sign-in checks presence and nothing else. */}
                  <Slot on={mode === "signup"}>
                    <div className="za-meter" data-met={validatePassword(password) ? "true" : undefined}>
                      <span className="za-meter-track">
                        <span className="za-meter-fill" style={{ transform: "scaleX(" + passStrength + ")" }} />
                      </span>
                      <span className="za-meter-l">
                        {validatePassword(password) ? (
                          <><Check size={12} strokeWidth={3} aria-hidden /> الحد الأدنى مستوفى</>
                        ) : (
                          <>الحد الأدنى {MIN_PASS} أحرف</>
                        )}
                      </span>
                    </div>
                  </Slot>
                </Field>
              </Slot>

              <Slot on={mode === "signup"}>
                <label className="za-consent">
                  <input type="checkbox" className="za-check" checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)} />
                  <span>
                    أوافق على{" "}
                    <Link href="/terms" target="_blank" className="za-link">شروط الخدمة</Link>{" "}
                    و{" "}
                    <Link href="/privacy" target="_blank" className="za-link">سياسة الخصوصية</Link>
                    ، وأوافق على الوصول الفوري للخدمة (متنازلًا عن حق الانسحاب خلال 14 يومًا للمحتوى الذي أُنشئه).
                  </span>
                </label>
              </Slot>

              {/* The status region is always in the DOM so a screen reader has
                  something to watch; it is empty until there is something to
                  say. An error is a real error: the reader's input genuinely
                  failed the product's real rule. */}
              <div className="za-status" role="status" aria-live="polite">
                <Slot on={!!error}>
                  <p className="za-err">{error}</p>
                </Slot>
              </div>

              <div className="za-go">
                <SlideButton type="submit" variant="violet" slide={ACTION[mode]} disabled={busy}>
                  {busy ? "لحظة…" : ACTION[mode]}
                </SlideButton>
              </div>

              {/* The real pages' own switchers, kept because they are where a
                  reader who scans the foot of a form looks, and because the
                  reset mode is reachable from nowhere else. */}
              <div className="za-alt">
                {mode === "signin" ? (
                  <>
                    <button type="button" className="za-alt-quiet" onClick={() => go("forgot")}>نسيت كلمة المرور؟</button>
                    <p className="za-alt-line">
                      ليس لديك حساب؟{" "}
                      <button type="button" className="za-link" onClick={() => go("signup")}>أنشئ حسابًا مجانًا</button>
                    </p>
                  </>
                ) : mode === "signup" ? (
                  <p className="za-alt-line">
                    لديك حساب بالفعل؟{" "}
                    <button type="button" className="za-link" onClick={() => { setTyping(false); go("signin") }}>تسجيل الدخول</button>
                  </p>
                ) : (
                  <p className="za-alt-line">
                    تذكّرتها؟{" "}
                    <button type="button" className="za-link" onClick={() => { setTyping(false); go("signin") }}>العودة لتسجيل الدخول</button>
                  </p>
                )}
              </div>
            </form>
          )}
        </section>
        </div>

        {/* The consent line, standing under the card so it is read BEFORE the
            form is filled. Sign-up also has its own checkbox, because consent
            recorded in user metadata has to be an act rather than a notice. */}
        <p className="za-foot-note">
          بالمتابعة أنت توافق على{" "}
          <Link href="/terms" className="za-link">شروط الخدمة</Link> و
          <Link href="/privacy" className="za-link">سياسة الخصوصية</Link>. تعذّر الدخول؟{" "}
          <Link href="/contact" className="za-link">راسِلنا</Link>.
        </p>
      </div>

      <PricingFooter />
    </main>
  )
}

/* -------------------------------------------------------------------------
   The roll. Faces are stacked in ONE grid cell, so the window is as tall as
   the tallest of them and a line that wraps on a phone sets the height for
   all of them instead of being cut. The clip gives the movement an edge to
   arrive from; the padding gives Arabic descenders their grace and the
   negative margin gives the layout it back.
------------------------------------------------------------------------- */
function faces(list: string[], face: number) {
  return list.map((f, i) => (
    <span
      key={i}
      className="za-roll-face"
      data-on={i === face ? "true" : undefined}
      /* A face above the current one leaves upward and a face below arrives
         from below, so the stack always travels the short way round rather
         than looping past every face between the two. */
      data-side={i === face ? undefined : i < face ? "up" : "down"}
      aria-hidden={i !== face}
    >
      {f}
    </span>
  ))
}

function RollH({ list, face }: { list: string[]; face: number }) {
  return <h1 id="za-h1" className="za-roll za-roll-h">{faces(list, face)}</h1>
}

function RollP({ list, face }: { list: string[]; face: number }) {
  return <p className="za-roll za-roll-s">{faces(list, face)}</p>
}

/* -------------------------------------------------------------------------
   A slot that grows. grid-template-rows 0fr -> 1fr is the one way to
   transition to an auto height without hard-coding a pixel the contents will
   outgrow, and it is the mechanic the house style already names.

   THE CLIP IS ONLY ON WHILE IT MOVES. A slot that stayed clipped would slice
   the 4px focus halo off whatever is inside it.
------------------------------------------------------------------------- */
function Slot({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [moving, setMoving] = useState(false)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    setMoving(true)
    /* A TIMER, NOT transitionend.
       transitionend is not guaranteed to arrive, and the case that matters is
       not an edge one: under prefers-reduced-motion the transition is none, so
       the event never fires at all and the clip would stay hidden for ever —
       slicing the focus halo off every field inside it for exactly the readers
       least able to afford a missing focus ring. It also never fires for a
       slot whose row size did not actually change, and it BUBBLES, so a
       nested slot finishing would clear its parent's flag early. One timer,
       slightly longer than the 440ms transition, has none of those problems. */
    const t = window.setTimeout(() => setMoving(false), 520)
    return () => window.clearTimeout(t)
  }, [on])
  return (
    <div className="za-slot" data-on={on ? "true" : undefined} data-moving={moving ? "true" : undefined}>
      <div className="za-slot-clip"><div className="za-slot-pad">{children}</div></div>
    </div>
  )
}

/** Label ABOVE the input, which is what /demo/build does and what the real
 *  pages do not: both of them use the placeholder as the label, so the name
 *  of the field disappears the moment the field has anything in it. */
function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="za-f">
      <label className="za-lab" htmlFor={id}>
        {label}
        {required ? <span className="za-req" aria-hidden> *</span> : null}
      </label>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------
   THE DOOR.

   Everything the reader typed passed the product's real rules, and this is
   where the real page would call supabase. Saying "تم إنشاء الحساب" here
   would be a lie — no account exists, no mail was sent — so the real string
   is QUOTED as the specimen it is, inside a panel that says plainly what did
   and did not happen, and the reader is handed to the real page in the mode
   they were already in.

   Sign-in gets no quote because the real page prints none: it routes to the
   dashboard. Inventing a message to fill that slot would be the same lie in a
   smaller font.
------------------------------------------------------------------------- */
function HandOff({ mode, email, onBack }: { mode: Mode; email: string; onBack: () => void }) {
  const done = SUCCESS[mode]
  const note = SUCCESS_NOTE[mode]
  /* Sign-in never reaches this panel: it routes away. The guard is here so a
     future fourth mode cannot render an empty card. */
  if (!done) return null
  return (
    <div className="za-hand">
      <p className="za-hand-pass">
        <Check size={14} strokeWidth={3} aria-hidden />
        {done}
      </p>

      <div className="za-spec">
        <p className="za-spec-l">أُرسل إلى:</p>
        <p className="za-spec-q"><bdi dir="ltr">{email}</bdi></p>
      </div>

      {note ? <p className="za-hand-b">{note}</p> : null}

      <div className="za-hand-go">
        <button type="button" className="za-alt-quiet" onClick={onBack}>العودة إلى النموذج</button>
      </div>
    </div>
  )
}
