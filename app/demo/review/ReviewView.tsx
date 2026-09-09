"use client"

/**
 * The candidate review page. See page.tsx for why this route exists and which
 * live surface it restyles.
 *
 * THE STARS ARE THE PAGE. Rating is one gesture, so the instrument that takes
 * it is the largest object on the screen and everything else is the sentence
 * around it. The row fills in a cascade rather than switching on, the verdict
 * under it rolls on the deck's own word-roll, and the row lights lightly
 * while it is only being pointed at. Nothing moves here that is not
 * reporting something the reader just did — which is the house rule, and the
 * reason there is no ambient drift anywhere on this page.
 *
 * THE ACCENT IS THE RATING. #5e6ad2 is the filled star, the met counter, the
 * live step of the pipeline and the primary action, and nothing else on the
 * page is tinted. No gold was invented for the stars: the house style is
 * achromatic apart from an accent that carries meaning, and "the value you
 * are setting" is meaning.
 *
 * NOTHING HERE IS SUBMITTED. There is no fetch in this file. The form runs
 * the real rules — the zod schema in app/api/reviews/route.ts and the two
 * extra checks app/(main)/contact/page.tsx runs before it posts — and then
 * stops at the door and says so, handing the reader to /contact?topic=review.
 * The precedent is /demo/access: an honest edge beats a convincing dead end.
 * It matters more here than there, because a POST from a design page would
 * put a row in the production reviews table that no customer ever wrote.
 *
 * AND THE WALL IS EMPTY ON PURPOSE. components/Testimonials.tsx refuses to
 * ship invented testimonials while Zenya is early; filling this page with
 * three plausible founders would be that same refusal broken in a nicer
 * typeface. The wall holds labelled placeholders instead.
 *
 * THE HEADER IS THE CANDIDATE SET'S, mechanic and all, and its observer
 * watches ".zf" — the footer cap's real class.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Copy, Gift, Info, Menu, ShieldCheck, X } from "lucide-react"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import { z } from "zod"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import PricingFooter from "../pricing/PricingFooter"
import { REVIEW_REWARD_CODE, REVIEW_REWARD_AR_SHORT, REVIEW_REWARD_PCT } from "@/lib/review-reward"
import { CSS } from "./styles"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/* The candidate set links inside the candidate set, in the set's own order. */
const NAV: Array<{ href: string; label: string }> = [
  { href: "/demo/templates", label: "القوالب" },
  { href: "/demo/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

/* The real channel, and the real page this one is a proposal for. */
const REAL = "/contact?topic=review"

/**
 * The verdicts, one per star, plus the resting face at index 0.
 *
 * They are the demo's own words — the live page prints no verdict at all, it
 * just colours stars — so they are written to describe the READER'S rating
 * rather than to grade the product: "استثنائية" is what five stars means, not
 * a claim Zenya is making about itself.
 */
const VERDICTS = [
  "اختر عدد النجوم",
  "تجربة سيّئة",
  "دون التوقّع",
  "تجربة جيّدة",
  "تجربة ممتازة",
  "تجربة استثنائية",
]

/* The three checks the real flow runs, in the order it runs them.

   The first two are app/(main)/contact/page.tsx: it will not submit without an
   e-mail and a message (the button is disabled), and it refuses a review with
   no stars, with this exact string. The third is the zod schema in
   app/api/reviews/route.ts, which is the only thing that states a minimum
   length. A demo whose rules are stricter or looser than the product's is
   testing a form the product does not have. */
const NO_STARS = "يرجى اختيار عدد النجوم لتقييم تجربتك."
const BAD_EMAIL = "يرجى إدخال بريد إلكتروني صالح."
const SHORT_BODY = "يرجى إدخال تقييم (نجمة واحدة على الأقل) ونص المراجعة."
const NO_NAME = "يرجى إدخال اسمك."

/** The schema's own bounds, named once so the counter and the check agree. */
const MAX_BODY = 4000
const MIN_BODY = 3
const MAX_NAME = 120

const validateEmail = (v: string) => z.string().email().safeParse(v).success

/** The paragraph the real channel prints on success, verbatim from
 *  TOPIC_SUCCESS.review in app/(main)/contact/page.tsx. Not rewritten: the
 *  words are the product's, and this page is restyling the moment, not
 *  rewording it. */
const REAL_SUCCESS =
  "شكرًا جزيلًا على مشاركتك تجربتك الصادقة! سنراجعها، وسنرسل إليك رمز خصم كشكرٍ على وقتك. رأيك يساعد مؤسّسين آخرين على الثقة بزينيا."

/**
 * The heading, and it is the ONE string on this screen the demo changed.
 *
 * The live panel prints "تمّ استلام رسالتك." because that card is shared by
 * all five contact topics and cannot know which one it just sent. This page
 * is the review channel and nothing else, so it can name what arrived. The
 * paragraph under it stays the product's, word for word.
 */
const THANKS_H = "تمّ استلام مراجعتك."

/** The pipeline a review actually travels, from the route's own docstring. */
const STEPS: Array<{ h: string; b: string }> = [
  {
    h: "تكتب مراجعتك",
    b: "نجومك ونصّك، باسمك كما تريده أن يظهر. لا يُطلب منك شيء آخر.",
  },
  {
    h: "نقرأها قبل نشرها",
    b: "تصل المراجعة بحالة (قيد المراجعة)، ولا تظهر للعامّة حتى يعتمدها أحد مؤسّسي زينيا.",
  },
  {
    h: "تُنشر كما كتبتها",
    b: "لا نحرّر نصّك ولا نختار منه ما يعجبنا. تُنشر كاملة، أو لا تُنشر.",
  },
]

/** One star path, drawn once and used at three sizes. */
const STAR_D =
  "M12 2.4l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.45l-5.9 3.11 1.13-6.57L2.45 9.34l6.6-.96z"

function Star({ className, filled, off }: { className?: string; filled?: boolean; off?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false" data-off={off ? "true" : undefined}>
      <path
        d={STAR_D}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ReviewView() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [onDark, setOnDark] = useState(false)

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  /** The star that was just set, so it can pop once and stop. */
  const [popped, setPopped] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [site, setSite] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  /** The door: set when every real rule passes. Nothing else changes. */
  const [handed, setHanded] = useState(false)

  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)
  const starsRef = useRef<HTMLDivElement | null>(null)

  /* Arrival. The hidden half lives under .zr-js so a browser that never runs
     the script reads a finished page rather than an invisible one. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduce) {
      targets.forEach((el) => el.setAttribute("data-in", "true"))
      return
    }
    root.classList.add("zr-js")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute("data-in", "true")
          io.unobserve(entry.target)
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* The header takes the ground it is standing on. Same mechanic as the five
     sibling pages: the band is the strip the pill occupies, in CSS pixels.
     The root ZoomLock writes CSS zoom, so a rect and a rootMargin are already
     in the same space — do not divide by the zoom. It watches ".zf", which is
     the footer cap's real class. */
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
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zr-pill, .zr-phone-pill"))
        .find((el) => el.getBoundingClientRect().height > 0)
      if (!pill) return
      const r = pill.getBoundingClientRect()
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)))
          setOnDark(live.size > 0)
        },
        { rootMargin: -r.top + "px 0px " + -(window.innerHeight - r.bottom) + "px 0px", threshold: 0 },
      )
      darks.forEach((el) => io!.observe(el))
    }
    build()
    window.addEventListener("resize", build)
    return () => { io?.disconnect(); window.removeEventListener("resize", build) }
  }, [])

  /* The pop is a one-shot, so it has to be taken off again or the star never
     animates a second time. */
  useEffect(() => {
    if (!popped) return
    const t = window.setTimeout(() => setPopped(0), 500)
    return () => window.clearTimeout(t)
  }, [popped])

  const setStars = useCallback((n: number) => {
    setRating(n)
    setPopped(n)
    setError(null)
  }, [])

  /**
   * THE DOOR.
   *
   * The real flow validates, POSTs to /api/reviews, POSTs to /api/contact and
   * prints a reward code. This one runs the same checks in the same order,
   * throwing the same strings, and then stops. No row is written, no mail is
   * sent, no code is issued — and no code is shown, because a discount the
   * reader has not earned is the same class of lie as a fake success message.
   */
  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (!name.trim()) throw new Error(NO_NAME)
      if (!validateEmail(email)) throw new Error(BAD_EMAIL)
      if (rating < 1) throw new Error(NO_STARS)
      if (body.trim().length < MIN_BODY) throw new Error(SHORT_BODY)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما.")
      return
    }
    setHanded(true)
  }

  const shown = hover || rating
  /* The preview engages only when the cursor is on a DIFFERENT value than the
     one that is set. Without that test, the star you just clicked stays under
     the cursor, so the row you deliberately set sat at a third of its weight
     until you moved the mouse away — a click that does not land. */
  const previewing = hover > 0 && hover !== rating
  const count = body.length
  const met = body.trim().length >= MIN_BODY
  const near = count > MAX_BODY - 400

  return (
    <main className={"zr-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header ref={headRef} className={"zr-head " + plex.className} data-dark={onDark ? "true" : undefined}>
        <div className="zr-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
          <div className="zr-phone-bar">
            <button type="button" className="zr-round" aria-expanded={menuOpen} aria-controls="zr-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/demo/home" aria-label="زينيا" className="zr-phone-mark"><ZenyaMark className="zr-mark-svg-sm" /></Link>
            <Link href="/demo/access?mode=signup" className="zr-account zr-account-phone">ابدأ</Link>
          </div>
          <div className="zr-drawer" data-open={menuOpen ? "true" : undefined}
            style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", visibility: menuOpen ? "visible" : "hidden" }}>
            <div className="zr-drawer-clip">
              <nav id="zr-phone-menu" className="zr-phone-menu">
                {NAV.map((i) => (
                  <Link key={i.href} href={i.href} className="zr-tray-row" onClick={() => setMenuOpen(false)}>{i.label}</Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="zr-pill">
          <div className="zr-bar">
            <span className="zr-side zr-side-start">
              <Link href="/demo/home" className="zr-mark" aria-label="زينيا"><ZenyaMark className="zr-mark-svg" /></Link>
            </span>
            <nav className="zr-nav">
              {NAV.map((i) => (
                <Link key={i.href} href={i.href} className="zr-nav-item">{i.label}</Link>
              ))}
            </nav>
            <span className="zr-side zr-side-end">
              <span className="zr-sep" aria-hidden />
              <Link href="/demo/access?mode=signup" className="zr-account">ابدأ</Link>
            </span>
          </div>
        </div>
      </header>

      <div className="zr-wrap">
        <section className="zr-open" data-reveal>
          <p className={"zr-eyebrow " + plex.className}>
            <span className="zr-eyebrow-dot" aria-hidden />
            آراء العملاء
          </p>
          <h1 className="zr-h1">
            قيّم <span className="zr-h1-mark">تجربتك</span> مع زينيا.
          </h1>
          <p className="zr-lede">
            خمس نجمات وبضعة أسطر. مراجعتك تصل إلينا كما كتبتها، ونقرؤها قبل أن تُنشر،
            ونشكرك عليها بخصم {REVIEW_REWARD_AR_SHORT} — سواء كانت في صالحنا أو لم تكن.
          </p>
          <p className="zr-refuse">
            <ShieldCheck size={14} strokeWidth={2.25} aria-hidden />
            لا نعرض شهادات مُختلَقة — الجدار فارغ حتى تصل الأولى.
          </p>
        </section>

        <div className="zr-well">
          {/* ---- the instrument -------------------------------------------- */}
          <section className="zr-card" aria-labelledby="zr-inst-q" data-reveal style={{ ["--i" as string]: "1" }}>
            <Grow on={!handed}>
              <div className="zr-inst">
                <p className="zr-inst-q" id="zr-inst-q">كيف كانت تجربتك مع زينيا؟</p>

                {/* A radiogroup, because that is what five mutually exclusive
                    values are. The arrows move it, so the whole instrument is
                    reachable without a pointer — and in RTL the physical left
                    key is the NEXT star, which is why the two are swapped
                    against their Latin meaning here.

                    POINTING AT THE ROW REPLACES WHAT IS SHOWN, it does not add
                    to it. Painting the hover over the set value put four solid
                    stars under a verdict reading "تجربة سيّئة" the moment a
                    reader who had chosen four ran the cursor back to one. So a
                    hover shows the hovered value alone, at a third of the
                    weight, and leaving the row restores the set one. Focus
                    never previews: the arrows SET, so a preview there would
                    wash out the value the reader just chose. */}
                <div
                  ref={starsRef}
                  className="zr-stars"
                  role="radiogroup"
                  aria-label="تقييمك بالنجوم"
                  onMouseLeave={() => setHover(0)}
                  onKeyDown={(e) => {
                    let next = 0
                    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.min(5, (rating || 0) + 1)
                    else if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.max(1, (rating || 1) - 1)
                    else if (e.key === "Home") next = 1
                    else if (e.key === "End") next = 5
                    if (!next) return
                    e.preventDefault()
                    setStars(next)
                    /* Selection and focus travel together, which is what a
                       radiogroup does: the roving tabindex has just moved to
                       the new star, and leaving the focus ring on the old one
                       would point at a value that is no longer set. */
                    const btns = starsRef.current?.querySelectorAll<HTMLButtonElement>(".zr-star")
                    btns?.[next - 1]?.focus()
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={n + " من 5"}
                      tabIndex={rating === n || (rating === 0 && n === 1) ? 0 : -1}
                      className="zr-star"
                      style={{ ["--i" as string]: String(n - 1) }}
                      data-on={!previewing && rating >= n ? "true" : undefined}
                      data-hover={previewing && hover >= n ? "true" : undefined}
                      data-pop={popped === n ? "true" : undefined}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setStars(n)}
                    >
                      <svg className="zr-star-svg" viewBox="0 0 24 24" aria-hidden focusable="false">
                        <path className="zr-star-out" d={STAR_D} />
                        <path className="zr-star-in" d={STAR_D} />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* The verdict rolls: faces stacked in one grid cell, so the
                    window is as tall as the tallest and the card cannot resize
                    under the reader when a longer word arrives. */}
                <p className="zr-verdict" aria-live="polite">
                  {VERDICTS.map((v, i) => (
                    <span
                      key={i}
                      className="zr-verdict-face"
                      data-empty={i === 0 ? "true" : undefined}
                      data-side={i === shown ? undefined : i < shown ? "up" : "down"}
                      aria-hidden={i !== shown}
                    >
                      {v}
                    </span>
                  ))}
                </p>
                <p className="zr-inst-hint">
                  {rating > 0 ? "يمكنك تغيير تقييمك في أي وقت قبل الإرسال." : "اضغط على نجمة، أو استخدم الأسهم."}
                </p>
              </div>

              <div className="zr-rule" aria-hidden />

                <form className="zr-form" onSubmit={submit} noValidate>
                  <div className="zr-pair">
                    <Field id="zr-name" label="الاسم" required>
                      <input id="zr-name" className="zr-in" type="text" value={name} autoComplete="name"
                        maxLength={MAX_NAME} placeholder="كما تريده أن يظهر"
                        onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <Field id="zr-email" label="البريد الإلكتروني" required>
                      <input id="zr-email" className="zr-in zr-ltr" type="email" value={email} autoComplete="email"
                        dir="ltr" placeholder="name@company.com"
                        onChange={(e) => setEmail(e.target.value)} />
                    </Field>
                  </div>

                  <Field id="zr-site" label="موقعك في زينيا" hint="اختياري">
                    <input id="zr-site" className="zr-in zr-ltr" type="text" value={site} dir="ltr"
                      placeholder="myshop.zenyaai.co" onChange={(e) => setSite(e.target.value)} />
                  </Field>

                  <Field id="zr-body" label="مراجعتك" required>
                    <textarea id="zr-body" className="zr-in zr-area" value={body} maxLength={MAX_BODY}
                      placeholder="ما الذي بنيته؟ وما الذي كان جيّدًا أو ناقصًا فيه؟"
                      onChange={(e) => setBody(e.target.value)} />
                    <p className="zr-count" data-met={met ? "true" : undefined} data-near={near ? "true" : undefined}>
                      <span>تُنشر كما كتبتها، دون تحرير.</span>
                      <span className="zr-count-n" dir="ltr">{count} / {MAX_BODY}</span>
                    </p>
                  </Field>

                  <div className="zr-status" role="status" aria-live="polite">
                    {error ? <p className="zr-err">{error}</p> : null}
                  </div>

                  <div className="zr-go">
                    <SlideButton type="submit" variant="violet" slide="راجِع قبل الإرسال">
                      أرسل مراجعتي
                    </SlideButton>
                    <p className="zr-go-note">
                      لا يُنشر بريدك ولا عنوان موقعك. الاسم والنجوم والنصّ فقط هي ما يظهر على الجدار.
                    </p>
                  </div>
                </form>
            
            </Grow>

            <Grow on={handed}>
              {handed ? <Thanks rating={rating} onBack={() => setHanded(false)} /> : null}
            </Grow>
          </section>

          {/* ---- the column that explains it ------------------------------- */}
          <aside className="zr-aside">
            <section className="zr-note-card" aria-labelledby="zr-reward-h" data-reveal style={{ ["--i" as string]: "2" }}>
              <p className="zr-note-head" id="zr-reward-h">
                <Gift size={15} strokeWidth={2} aria-hidden />
                شكرًا على وقتك
              </p>
              <p className="zr-reward">
                <span className="zr-reward-n" dir="ltr">{REVIEW_REWARD_PCT}%</span>
                <span className="zr-reward-l">على أول شهر</span>
              </p>
              <p className="zr-note-b">
                يصلك رمز الخصم على بريدك بعد إرسال مراجعتك في القناة الحقيقية، ويظهر أيضًا في
                إعدادات حسابك ضمن أكواد الخصم. الرمز مقابل وقتك، لا مقابل نجومك — تقييم بنجمة
                واحدة يستحقّه تمامًا كتقييم بخمس.
              </p>
            </section>

            <section className="zr-note-card" aria-labelledby="zr-steps-h" data-reveal style={{ ["--i" as string]: "3" }}>
              <p className="zr-note-head" id="zr-steps-h">
                <ShieldCheck size={15} strokeWidth={2} aria-hidden />
                ما يحدث لمراجعتك
              </p>
              <ol className="zr-steps">
                {STEPS.map((s, i) => (
                  /* The spine reports where the review actually is: the first
                     beat lights as soon as there is a rating to send, and it
                     hands over to the second the moment the review is sent.
                     The panel beside it says the same thing in words; this is
                     the page keeping one state, not two. */
                  <li key={s.h} className="zr-step" data-live={(handed ? i === 1 : i === 0 && rating > 0) ? "true" : undefined}>
                    <span className="zr-step-n" aria-hidden>{i + 1}</span>
                    <div className="zr-step-t">
                      <h3 className="zr-step-h">{s.h}</h3>
                      <p className="zr-step-b">{s.b}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        {/* ---- the wall --------------------------------------------------- */}
        <section className="zr-wall" aria-labelledby="zr-wall-h">
          <div className="zr-wall-head" data-reveal>
            <h2 className="zr-h2" id="zr-wall-h">الجدار</h2>
            <p className="zr-wall-count">لا مراجعات معتمدة بعد</p>
          </div>
          <div className="zr-slots">
            {[0, 1, 2].map((i) => (
              <article
                key={i}
                className="zr-slot"
                data-first={i === 0 ? "true" : undefined}
                data-reveal
                style={{ ["--i" as string]: String(i) }}
                aria-label={i === 0 ? "مكان المراجعة الأولى، لا يزال فارغًا" : "مكان محجوز لمراجعة قادمة"}
              >
                <span className="zr-slot-tag">{i === 0 ? "الأولى" : "قادمة"}</span>
                <div className="zr-slot-stars" aria-hidden>
                  {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="zr-slot-star" />)}
                </div>
                <div aria-hidden>
                  <span className="zr-line" style={{ width: "92%" }} />
                  <span className="zr-line" style={{ width: "78%" }} />
                  <span className="zr-line" style={{ width: "56%" }} />
                </div>
                <div className="zr-slot-who" aria-hidden>
                  <span className="zr-slot-av" />
                  <span className="zr-line" style={{ width: "34%", marginBottom: 0 }} />
                </div>
              </article>
            ))}
          </div>
          <p className="zr-wall-b" data-reveal>
            زينيا منصّة جديدة، ونؤمن بأن نعرض آراءً حقيقية فقط — لا شهادات مُختلَقة. هذه الأماكن
            تبقى فارغة إلى أن تصل مراجعات حقيقية ويعتمدها أحد المؤسّسين، وعندها تحلّ محلّها كما
            كُتبت تمامًا.
          </p>
        </section>

        <p className="zr-foot-note">
          صفحة تصميم مُقترحة. النموذج يتحقق من مدخلاتك بالقواعد الحقيقية، لكنه لا يحفظ مراجعتك ولا
          يرسل رمز خصم —{" "}
          <Link href={REAL} className="zr-link">شارك تجربتك فعليًا من هنا</Link>.
        </p>
      </div>

      <PricingFooter />
    </main>
  )
}

/* -------------------------------------------------------------------------
   A slot that grows, and the timer that un-clips it.

   A TIMER, NOT transitionend. transitionend is not guaranteed to arrive, and
   the case that matters is not an edge one: under prefers-reduced-motion the
   transition is none, so the event never fires at all and the clip would stay
   on for ever — slicing the focus halo off every field inside it for exactly
   the readers least able to afford a missing focus ring. It also bubbles, so
   a nested transition finishing would clear the flag early. One timer,
   slightly longer than the 440ms transition, has none of those problems.
------------------------------------------------------------------------- */
function Grow({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [moving, setMoving] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setMoving(true)
    const t = window.setTimeout(() => setMoving(false), 520)
    return () => window.clearTimeout(t)
  }, [on])
  return (
    <div className="zr-slot-grow" data-on={on ? "true" : undefined} data-moving={moving ? "true" : undefined}>
      <div className="zr-slot-grow-clip">{children}</div>
    </div>
  )
}

/** Label ABOVE the input: the placeholder is a hint, never the field's name. */
function Field({
  id, label, required, hint, children,
}: { id: string; label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="zr-f">
      <label className="zr-lab" htmlFor={id}>
        {label}
        {required ? <span className="zr-req" aria-hidden>*</span> : null}
        {hint ? <span className="zr-opt">{hint}</span> : null}
      </label>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------
   THE THANK-YOU, and it is the screen this page exists to get right.

   It is the one panel a reviewer is guaranteed to read to the end, and on the
   live channel it is the least designed thing in the flow. Everything here is
   the real moment, restyled: the product's own paragraph, the product's own
   reward, the rating read back, and the state the review is now in.

   WHAT IT DOES NOT DO is claim any of it happened. No row was written, no
   mail was sent, and the strip at the foot says so in place rather than in a
   footnote three sections down — because a thank-you screen that reads as
   real IS the thing that would mislead, and it is exactly the screen being
   designed here. That is the tension, and the answer is to build the screen
   honestly and label it, not to build a worse screen.

   THE CODE IS SHOWN, and that is a reversal from this page's first commit,
   for a reason found by reading the site rather than by changing my mind:
   SHUKRAN20 is not a secret. components/ReviewOffer.tsx reveals the same
   string to anyone who clicks it on the marketing site, the pricing page
   carries it, and Stripe restricts it to first-time customers on a first
   month. Withholding it here protected nothing and left the panel that most
   needed designing as a grey rectangle. What the copy DOES change is the
   claim attached to it: the live panel says "هذا كودك" because you earned it
   by submitting; this one says where the code came from.
------------------------------------------------------------------------- */
function Thanks({ rating, onBack }: { rating: number; onBack: () => void }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(t)
  }, [copied])

  /* The live page's copyCode, including its silent catch: a clipboard write
     is refused in plenty of ordinary situations (no permission, an insecure
     origin), and an error toast for a failed copy of a string the reader can
     see and select is noise. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(REVIEW_REWARD_CODE)
      setCopied(true)
    } catch {}
  }

  return (
    <div className="zr-thanks">
      <span className="zr-tick" style={{ ["--i" as string]: "0" }} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" focusable="false">
          <path className="zr-tick-p" d="M5 12.6l4.6 4.6L19 7.8" stroke="currentColor" strokeWidth={2.4}
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h2 className="zr-thanks-h" style={{ ["--i" as string]: "1" }}>{THANKS_H}</h2>

      <p className="zr-thanks-stars" style={{ ["--i" as string]: "2" }} aria-label={"تقييمك: " + rating + " من 5"}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className="zr-thanks-star" filled={n <= rating} off={n > rating} />
        ))}
      </p>

      <p className="zr-thanks-b" style={{ ["--i" as string]: "3" }}>{REAL_SUCCESS}</p>

      <div className="zr-code" style={{ ["--i" as string]: "4" }}>
        <p className="zr-code-head">
          <Gift size={14} strokeWidth={2} aria-hidden />
          رمز الشكر — {REVIEW_REWARD_AR_SHORT}
        </p>
        <button type="button" className="zr-code-row" data-copied={copied ? "true" : undefined}
          onClick={copy} aria-label={copied ? "تم نسخ رمز الخصم" : "نسخ رمز الخصم"}>
          <span className="zr-code-str" dir="ltr">{REVIEW_REWARD_CODE}</span>
          <span className="zr-code-ico" aria-hidden>
            {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
          </span>
        </button>
        <p className="zr-code-note">
          أدخِله في خانة «Promotion code» عند الاشتراك. صالح للعملاء الجدد على أول شهر. هذا هو الرمز
          نفسه المعروض في صفحة الأسعار، لا رمزًا صادرًا عن هذه الصفحة.
        </p>
      </div>

      <p className="zr-next" style={{ ["--i" as string]: "5" }}>
        <ShieldCheck size={14} strokeWidth={2.25} aria-hidden />
        مراجعتك الآن في الخطوة الثانية: نقرأها قبل نشرها، ولا تظهر على الجدار حتى يعتمدها أحد المؤسّسين.
      </p>

      <div className="zr-demo" style={{ ["--i" as string]: "6" }}>
        <Info size={14} strokeWidth={2.25} aria-hidden />
        <p>
          ما سبق هو شكل الرسالة الحقيقية. أمّا هنا فلم تُحفظ مراجعتك ولم يُرسل بريد — هذه صفحة تصميم
          مُقترحة لا تتصل بأي خادم.
        </p>
      </div>

      <div className="zr-thanks-go" style={{ ["--i" as string]: "7" }}>
        <SlideButton href={REAL} variant="violet" slide="إلى القناة الحقيقية">
          شارك تجربتك في زينيا
        </SlideButton>
        <button type="button" className="zr-quiet" onClick={onBack}>العودة إلى النموذج</button>
      </div>
    </div>
  )
}
