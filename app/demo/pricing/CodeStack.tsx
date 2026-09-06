"use client"

/**
 * The discount stack: a fan of cards for what a reader can actually get off
 * the price, with the one real code revealed by a flip once it is earned.
 *
 * Adapted from Kokonut UI's Card Stack (MIT, kokonutui.com). The fan and the
 * spring are theirs. Four things had to change, and they are the same class of
 * problem as the slide button:
 *
 *   1. It imports "motion/react", which is not installed here. framer-motion
 *      is, and is what the rest of this app already uses.
 *   2. It wraps every card in ONE <button>. These cards contain a link and a
 *      copy button, and a button inside a button is invalid HTML that no
 *      screen reader reads correctly. The toggle is a sibling hit-layer here:
 *      it takes the click while the stack is closed and gets out of the way
 *      once the cards are live.
 *   3. Its cards are photographs from Unsplash. This project has a standing
 *      rule against Unsplash fallbacks, and a discount is not a photograph
 *      anyway. These cards are typographic.
 *   4. Glass and stacked drop shadows. This style refuses drop shadows on
 *      content; elevation is the ring token, and the earned card is obsidian
 *      because that is what this page already means by "yours".
 *
 * WHAT IS ON THE CARDS IS THE HARD PART, and it is not a design question.
 * Zenya hands out exactly ONE code a person can type: the review code in
 * lib/review-reward.ts, allowlisted at app/api/promo-codes/route.ts. The other two
 * discounts are real but are NOT codes: lib/domain-entitlement.ts applies them
 * server-side at checkout and says in as many words that they are "never
 * exposed as public promotion codes". So the cards are labelled by kind, and
 * only the one that is a code has a code on its back. Filling the other two
 * with invented codes would have made a better-looking stack and a dishonest
 * one.
 *
 * THE FLIP IS EARNED, NOT DECORATIVE. It fires when the section comes into
 * view and only if the reader actually has the code, which is read the same
 * way the live page reads it: the localStorage key ReviewOffer writes, plus
 * the saved list at /api/promo-codes for a signed-in caller. Nobody sees a
 * card turn over to reveal something they have not got.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import SlideButton from "@/components/ui/SlideButton"
import { REVIEW_REWARD_CODE, REVIEW_REWARD_PCT } from "@/lib/review-reward"

/* The same key ReviewOffer writes, so a reader who unlocked the code anywhere
   else on the site arrives here already holding it. */
const UNLOCK_KEY = "zenya:review-code-unlocked"
const REVIEW_CODE = REVIEW_REWARD_CODE
const REVIEW_URL = "/contact?topic=review"

type Card = {
  id: string
  /* "code" is a string you type at checkout. "auto" is applied server-side and
     has nothing to copy. The distinction is the honest part of this section. */
  kind: "code" | "auto"
  chip: string
  figure: string
  figureSub: string
  body: string
  cta?: { label: string; href: string }
}

const CARDS: Card[] = [
  {
    id: "review",
    kind: "code",
    chip: "كود تُدخِله بنفسك",
    figure: REVIEW_REWARD_PCT + "%",
    figureSub: "على أول شهر",
    body: "شاركنا رأيك الصادق عن زينيا. الكود لك مهما كان رأيك، ودقيقة واحدة تكفي.",
    cta: { label: "قيّمنا واحصل عليه", href: REVIEW_URL },
  },
  {
    id: "free-domain",
    kind: "auto",
    chip: "يُطبَّق تلقائيًا",
    figure: "نطاق مجاني",
    figureSub: "لسنة كاملة",
    body: "مع خطة Pro، على الامتدادات الاقتصادية. يُخصم عند الشراء دون أي كود.",
  },
  {
    id: "other-domains",
    kind: "auto",
    chip: "يُطبَّق تلقائيًا",
    figure: "30%",
    figureSub: "على بقية النطاقات",
    body: "مع خطة Pro، على أي نطاق آخر تشتريه بعد المجاني. يُخصم عند الشراء.",
  },
]

const CARD_W = 300
/* How much of each card the next one covers when the fan is open. The Kokonut
   original hides 75% of every card behind its neighbour, which works there
   because each card is a photograph and a sliver of a photograph is still
   recognisable. These cards are typography: at that overlap the other two read
   as the fragments "نطاق" and "30%" and the section says nothing. 56px keeps
   the stacked feel and leaves all three legible. */
const OVERLAP = 56

export default function CodeStack() {
  const [open, setOpen] = useState(false)
  const [earned, setEarned] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion() ?? false

  /* Read the entitlement exactly as the rest of the site does. The API answers
     401 for a signed-out caller, which is not an error here: it just means the
     only evidence available is the local one. */
  useEffect(() => {
    let cancelled = false
    try {
      if (localStorage.getItem(UNLOCK_KEY) === "1") setEarned(true)
    } catch {}
    /* A preview flag, and only on this demo route: it lets the owner see the
       earned side without going and leaving a review first. It reveals nothing
       private, because the live pricing page already prints this code in the
       open with a copy button. */
    try {
      if (new URLSearchParams(window.location.search).get("earned") === "1") setEarned(true)
    } catch {}
    ;(async () => {
      try {
        /* Ask whether there is a session BEFORE calling the endpoint. The
           route answers 401 to an anonymous caller, and this page is public,
           so calling it unconditionally printed a red 401 in the console of
           every signed-out visitor. getUser() short-circuits with no request
           when there is no stored session, so the common case now costs
           nothing and says nothing. */
        const { createClient } = await import("@/utils/supabase/client")
        const { data: { user } } = await createClient().auth.getUser()
        if (!user) return
        const res = await fetch("/api/promo-codes")
        if (!res.ok) return
        const data = await res.json()
        const has = Array.isArray(data?.codes) && data.codes.some(
          (c: { code?: string }) => String(c?.code || "").toUpperCase() === REVIEW_CODE.toUpperCase()
        )
        if (!cancelled && has) setEarned(true)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  /* The flip is the section's arrival, so it waits for the section to arrive.
     Observer, never a scroll listener. */
  useEffect(() => {
    const el = stageRef.current
    if (!el || !earned) return
    if (reduce) { setFlipped(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          window.setTimeout(() => setFlipped(true), 520)
          io.disconnect()
        })
      },
      { threshold: 0.45 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [earned, reduce])

  async function copy() {
    try {
      await navigator.clipboard.writeText(REVIEW_CODE)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  /* The fan is a wide-screen flourish. Opened on a phone it spreads 472px
     across a 390px window, and the honest answer is not to squeeze it: below
     900px the three become a plain column, which is what a reader wants there
     anyway. 900 and not 720 because the open fan is 788px wide, so anything
     narrower than about 900 cannot hold it once the page gutters are taken
     off. Measured with matchMedia rather than guessed at in two places. */
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const total = CARDS.length
  const spreadWidth = CARD_W + (total - 1) * (CARD_W - OVERLAP)

  const face = (card: Card) => {
    const isCode = card.kind === "code"
    const showBack = isCode && earned && flipped
    const live = narrow || open
    return (
      <div className="cs-flip" data-flipped={showBack ? "true" : undefined}>
        <div className="cs-face cs-front">
          <span className="cs-chip" data-kind={card.kind}>{card.chip}</span>
          <p className="cs-figure">{card.figure}</p>
          <p className="cs-figure-sub">{card.figureSub}</p>
          <p className="cs-body">{card.body}</p>
          {card.cta && !earned ? (
            <span className="cs-cta-slot" data-live={live ? "true" : undefined}>
              <SlideButton href={card.cta.href} variant="violet" slide="دقيقة واحدة">
                {card.cta.label}
              </SlideButton>
            </span>
          ) : null}
          {isCode && earned ? <p className="cs-earned-hint">هذا الكود لك بالفعل</p> : null}
        </div>

        {/* Built only for the one card that actually has a code. */}
        {isCode ? (
          <div className="cs-face cs-back">
            <span className="cs-chip" data-kind="code">كودك جاهز</span>
            <button
              type="button"
              className="cs-code"
              onClick={copy}
              tabIndex={live && showBack ? undefined : -1}
              aria-label={"نسخ كود الخصم " + REVIEW_CODE}
            >
              <span dir="ltr" className="cs-code-text">{REVIEW_CODE}</span>
              <span className="cs-code-hint">{copied ? "تم النسخ" : "انسخ"}</span>
            </button>
            <p className="cs-body">
              أدخِله في خانة «Promotion code» عند الدفع. صالح لأول شهر وللعملاء الجدد.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  if (narrow) {
    return (
      <section className="cs" aria-labelledby="cs-h" ref={stageRef}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="cs-head">
          <h2 id="cs-h" className="cs-h2">ما الذي يخفّض الحساب</h2>
          <p className="cs-sub">
            خصم واحد تُدخِله بنفسك، واثنان يُطبَّقان عند الدفع دون أن تفعل شيئًا.
          </p>
        </div>
        <div className="cs-panel cs-panel-flow">
        <div className="cs-column">
          {CARDS.map((card) => (
            <article
              key={card.id}
              className="cs-card cs-card-flow"
              data-kind={card.kind}
              data-earned={card.kind === "code" && earned ? "true" : undefined}
            >
              {face(card)}
            </article>
          ))}
        </div>
        </div>
      </section>
    )
  }

  return (
    <section className="cs" aria-labelledby="cs-h">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="cs-head">
        <h2 id="cs-h" className="cs-h2">ما الذي يخفّض الحساب</h2>
        <p className="cs-sub">
          خصم واحد تُدخِله بنفسك، واثنان يُطبَّقان عند الدفع دون أن تفعل شيئًا.
        </p>
      </div>

      <div className="cs-panel">
      <div className="cs-stage" ref={stageRef} data-open={open ? "true" : undefined}>
        {/* The hit layer. It takes the click while the stack is closed, and
            stops taking it the moment the cards are live, so the link and the
            copy button inside them are reachable. */}
        <button
          type="button"
          className="cs-hit"
          aria-expanded={open}
          aria-controls="cs-cards"
          onClick={() => setOpen(true)}
          hidden={open}
        >
          <span className="sr-only">افرد بطاقات الخصم</span>
        </button>

        <div className="cs-cards" id="cs-cards">
          {CARDS.map((card, i) => {
            const centre = (total - 1) * 5
            const closed = { x: i * 10 - centre, y: i * 3, rotate: reduce ? 0 : i * 1.6 }
            const openPose = {
              x: i * (CARD_W - OVERLAP) - spreadWidth / 2 + CARD_W / 2,
              y: 0,
              rotate: reduce ? 0 : i * 4.5 - (total - 1) * 2.25,
            }
            const isCode = card.kind === "code"
            return (
              <motion.article
                key={card.id}
                className="cs-card"
                data-kind={card.kind}
                data-earned={isCode && earned ? "true" : undefined}
                /* The resting state is the closed fan, so the mount pose IS
                   the finished pose and nothing rests invisible. */
                initial={closed}
                animate={{ ...(open ? openPose : closed), zIndex: total - i }}
                transition={
                  reduce
                    ? { duration: 0.2, ease: "easeOut" }
                    : { type: "spring", stiffness: 220, damping: 28, mass: 1, delay: open ? i * 0.05 : 0 }
                }
                style={{ width: CARD_W, marginInlineStart: -CARD_W / 2 }}
                aria-hidden={!open && i > 0 ? true : undefined}
              >
                {face(card)}
              </motion.article>
            )
          })}
        </div>
      </div>

        <div className="cs-foot">
          {!open ? (
            <p className="cs-hint">اضغط البطاقات لفردها</p>
          ) : (
            <span className="cs-collapse">
              <SlideButton onClick={() => setOpen(false)} variant="quiet" slide="أعِدها كما كانت">
                اطوِ البطاقات
              </SlideButton>
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   No backticks inside this literal: one would end it. Tokens are inherited
   from .zp-root, so this section cannot drift from the rest of the page.
--------------------------------------------------------------------------- */
const CSS = `
.cs { max-width: 1080px; margin: clamp(3.5rem, 8vw, 6rem) auto 0; }
.cs-head { text-align: center; margin-bottom: clamp(1.75rem, 4vw, 2.5rem); }
.cs-h2 { margin: 0; font-size: clamp(24px, 3.4vw, 36px); font-weight: 900; line-height: 1.36; letter-spacing: 0; color: var(--obsidian); }
.cs-sub { margin: 0.75rem auto 0; max-width: 34rem; font-size: 15px; font-weight: 500; line-height: 1.85; color: var(--stone); }

/* ---- the panel, and how it arrives --------------------------------------
   A square of its own, like the comparison has, but a HALF STEP off the
   ground rather than an inversion: two obsidian panels in a row would make
   the page bottom-heavy and would stop the dark meaning anything.

   Its arrival is deliberately NOT the comparison's. That one scales down.
   This one rises and unrotates, which is a card being set down rather than a
   surface being framed, and it is the motion this section is about. Same
   discipline as the other: a scroll-driven timeline, transform only, and a
   base rule already at the finished state so a browser without view() support
   reads a settled page.
--------------------------------------------------------------------------- */
.cs-panel {
  position: relative;
  border-radius: var(--r-panel);
  background: #f1f0ec;
  padding: clamp(1.5rem, 3vw, 2.25rem) clamp(1rem, 2.5vw, 2rem);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}
.cs-panel-flow { padding-block: 1.25rem; }

@keyframes cs-place {
  from { transform: translateY(42px) rotate(-0.7deg); }
  to { transform: none; }
}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .cs-panel {
      animation: cs-place linear both;
      animation-timeline: view();
      /* Ends at 60% of the entry rather than 90%, so the move completes early
         even where the panel is taller than the window: the column layout on
         a phone is about 950px of cards, and a range tied to the bottom edge
         would leave it drifting for most of the scroll. */
      animation-range: entry 0% entry 60%;
      will-change: transform;
    }
  }
}

.cs-stage {
  position: relative;
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cs-hit {
  position: absolute; inset: 0; z-index: 40;
  appearance: none; border: 0; background: transparent; padding: 0;
  cursor: pointer; border-radius: var(--r-card);
}
.cs-hit:focus-visible { outline: 2px solid var(--violet); outline-offset: 4px; }
.cs-cards { position: absolute; inset: 0; }

.cs-card {
  position: absolute; top: 50%; inset-inline-start: 50%;
  margin-top: -155px;
  height: 310px;
  border-radius: var(--r-card);
  transform-origin: 50% 100%;
  /* Without this the turn is a mirror, not a card: rotateY on a flat plane
     squashes to zero width and comes back with no sense of an object having
     depth. The perspective is what makes the near edge travel toward the
     reader as the far edge goes away. */
  perspective: 1400px;
}

/* The flip lives on an inner box so the spring on the card and the turn on the
   face never fight over one transform. */
.cs-flip {
  position: relative; width: 100%; height: 100%;
  transform-style: preserve-3d;
  transition: transform 760ms cubic-bezier(0.22, 1, 0.36, 1);
}
.cs-flip[data-flipped] { transform: rotateY(180deg); }
.cs-face {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: flex-start;
  padding: 1.5rem 1.375rem;
  border-radius: var(--r-card);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  background: var(--card);
  /* Elevation is stacked hairline rings, never a drop shadow. */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 4px rgba(250, 250, 250, 0.55);
}
.cs-back { transform: rotateY(180deg); background: var(--onyx); box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 0 4px rgba(250,250,250,0.55); }
/* The one card that carries a real code reads as the page's "yours" object
   once it is earned, the same obsidian the Starter card uses. */
.cs-card[data-earned] .cs-front { background: var(--onyx); box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 0 4px rgba(250,250,250,0.55); }

.cs-chip {
  display: inline-block; margin-bottom: 1.125rem;
  padding: 0.25rem 0.6875rem; border-radius: 999px;
  font-size: 11px; font-weight: 700; line-height: 1.5; white-space: nowrap;
}
.cs-chip[data-kind="code"] { background: var(--violet); color: #fff; }
.cs-chip[data-kind="auto"] { background: rgba(0, 0, 0, 0.05); color: var(--stone); }

.cs-figure { margin: 0; font-size: 38px; font-weight: 900; line-height: 1.28; letter-spacing: 0; color: var(--obsidian); }
.cs-figure-sub { margin: 0.125rem 0 0; font-size: 16px; font-weight: 700; line-height: 1.5; color: var(--stone); }
.cs-body { margin: 0.875rem 0 0; font-size: 13px; font-weight: 500; line-height: 1.8; color: var(--stone); }
.cs-card[data-earned] .cs-front .cs-figure { color: var(--ground); }
.cs-card[data-earned] .cs-front .cs-figure-sub,
.cs-card[data-earned] .cs-front .cs-body { color: #a8a8b2; }
.cs-back .cs-body { color: #a8a8b2; }

/* The CTA is the shared SlideButton. The slot only owns its placement: the
   button owns everything about how it looks and how it moves, so this page
   cannot drift away from the rest of the site's buttons. */
.cs-cta-slot { margin-top: auto; align-self: stretch; width: 100%; }
.cs-cta-slot:not([data-live]) .sb { pointer-events: none; }
.cs-earned-hint { margin: auto 0 0; font-size: 12px; font-weight: 700; color: var(--violet-lift); }

.cs-code {
  margin-top: 0.25rem; align-self: stretch;
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 0.75rem 0.875rem; border-radius: var(--r-control);
  border: 0; cursor: pointer;
  background: rgba(94, 106, 210, 0.18);
  box-shadow: inset 0 0 0 1px rgba(151, 160, 238, 0.45);
}
.cs-code-text { font-size: 19px; font-weight: 900; letter-spacing: 0.08em; color: #fff; }
.cs-code-hint { font-size: 11.5px; font-weight: 700; color: var(--violet-lift); }
.cs-code:focus-visible { outline: 2px solid var(--violet-lift); outline-offset: 3px; }

.cs-foot { display: flex; justify-content: center; margin-top: 0.5rem; min-height: 2.5rem; }
.cs-hint { margin: 0; font-size: 12.5px; font-weight: 500; color: #8a8a94; }
.cs-collapse { display: inline-block; width: auto; }
.cs-collapse .sb { width: auto; padding-inline: 1rem; font-size: 12.5px; }
.cs-collapse .sb { --sb-win: 2.2em; }
/* Closed, the cards behind the top one are decoration and must not be read or
   tabbed into. Open, they are all live. */
.cs-stage:not([data-open]) .cs-card:not(:first-child) { pointer-events: none; }

@media (prefers-reduced-motion: reduce) {
  .cs-flip { transition: none; }
  .cs-cta:active { transform: none; }
}

/* Below 720px the fan becomes a column, because a 472px spread does not go
   into a 390px window and squeezing it would make three unreadable cards
   instead of one honest list. */
.cs-column { display: grid; gap: 1rem; max-width: 26rem; margin: 0 auto; }
.cs-card-flow {
  position: static;
  width: auto;
  height: 300px;
  margin: 0;
  transform: none;
  perspective: 1400px;
}
`
