"use client"

import { useEffect, useRef, useState } from "react"
import { Lock } from "lucide-react"
import { HALT, KEY, makeRunner, type Cursor } from "./runner"
import { SURFACES, type Form, type PublishCtx } from "./publish"
import Composer, { layoutVars, pick, type Layout, type Placement } from "./Composer"
import placement from "./placement.json"

/* ─────────────────────────────────────────────────────────────────────────
   Section four: انشر — the publish step.

   The last of the hero's three words, and the one that closes the arc. ابن
   fills in the wizard, ادر runs the dashboard, انشر puts the thing on the
   internet: an address is searched for and taken, the site is published, and
   then the browser goes to that address and the SITE is on the other side of
   it. That last beat is the payoff the page has owed since ابن — seventy
   seconds of a form being filled in and never the website that comes out.

   This file is the stage; ./publish.tsx is the two surfaces. The cursor
   engine is the shared one in ./runner, exactly as section three uses it —
   there is one copy of that machinery on this page and there will go on
   being one.

   ── THE OBJECT IS A BROWSER, and that is the whole argument for it.

   Section three rises a device, because what it shows is a screen somebody
   works on. What this section shows is an ADDRESS: the line at the top of the
   window is the subject, not the furniture. So the object here is a browser
   window with a real address bar, the address is state rather than a label,
   and the last thing the cursor does in the section is type in it.
   ───────────────────────────────────────────────────────────────────────── */

/* The publish word, cycling the hero's THIRD column on the hero's own roll. */
const WORDS = ["انشر", "تنشر", "نشر", "زبائن"]
const WORD_HOLD = 4600

export default function PublishSection({
  active,
  uiClass,
  wordClass,
  wordWeight,
  wordLh,
  edit = false,
}: {
  active: boolean
  uiClass: string
  wordClass: string
  wordWeight: number
  wordLh: number
  /** ?edit=1 only. The composer never mounts for an ordinary visitor. */
  edit?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  const [take, setTake] = useState(0)
  const sf = SURFACES[take % SURFACES.length]

  /* The placement composed at ?edit=1, read from the file the composer saves
     into and applied always. An untouched cell writes no variables at all. */
  const [wide, setWide] = useState(true)
  const [layout, setLayout] = useState<Layout>(() => pick(placement as Placement, "publish", true))
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => { setWide(mq.matches); setLayout(pick(placement as Placement, "publish", mq.matches)) }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const choose = (id: string) => {
    const want = SURFACES.findIndex((s) => s.id === id)
    if (want < 0) return
    setTake((prev) => {
      const next = prev + 1
      const rounds = SURFACES.length
      return next + ((want - (next % rounds)) + rounds) % rounds
    })
  }

  /* The state is held WITH the id of the surface it belongs to and reconciled
     during render rather than in an effect — an effect runs after the paint,
     so for exactly one frame the new surface is handed the previous one's
     fields, which is a screen reading a key that is not on it. Section three
     records this the hard way. */
  const [held, setForm] = useState<{ id: string; f: Form }>({ id: sf.id, f: sf.empty })
  const form = held.id === sf.id ? held.f : sf.empty
  const [focus, setFocus] = useState<string | null>(null)
  const [cursor, setCursor] = useState<Cursor>(null)

  /* The publish word's own clock, on the hero's hold and the hero's roll. */
  const [word, setWord] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null })
  useEffect(() => {
    if (!active) { setWord({ cur: 0, prev: null }); return }
    const id = setInterval(
      () => setWord((w) => ({ cur: (w.cur + 1) % WORDS.length, prev: w.cur })),
      WORD_HOLD,
    )
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    if (!active) {
      setForm({ id: sf.id, f: sf.empty }); setFocus(null); setCursor(null)
      return
    }
    let dead = false
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const r = makeRunner({ frameRef, setCursor, setFocus, reduced, alive: () => !dead })
    const { click, wait } = r

    const set = (patch: Form) =>
      setForm((prev) => {
        const f = prev.id === sf.id ? prev.f : sf.empty
        const next: Form = { ...f }
        for (const [k, v] of Object.entries(patch)) {
          next[k] = typeof v === "function" ? (v as (p: any) => any)(f[k]) : v
        }
        return { id: sf.id, f: next }
      })

    /* Typing into a field this section draws itself: one more character per
       beat into the field the cursor is sitting in, and the caret belongs to
       that field alone. */
    const typeState = async (t: string, key: string, text: string) => {
      await r.move(t, 0.88)
      await click()
      setFocus(t)
      if (reduced) { set({ [key]: text }); await wait(140); setFocus(null); return }
      for (let i = 1; i <= text.length; i += 1) {
        set({ [key]: text.slice(0, i) })
        await wait(KEY + Math.random() * 30)
      }
      await wait(190)
      setFocus(null)
    }

    const ctx: PublishCtx = { ...r, set, typeState, setFocus }

    const run = async () => {
      await wait(520)
      await sf.run(ctx)
      await wait(900)
      if (!dead) setTake((t) => t + 1)
    }

    run().catch((e) => { if (e !== HALT) throw e })
    return () => { dead = true }
  }, [active, take, sf])

  /* Swipe sideways on the window to change surface. The deck owns the
     VERTICAL swipe and stands down on the same test, so one finger carries
     two meanings decided by which way it actually travelled. */
  useEffect(() => {
    const box = frameRef.current
    if (!box) return
    let x0 = 0, y0 = 0
    const start = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      x0 = t.clientX; y0 = t.clientY
    }
    const end = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - x0
      const dy = t.clientY - y0
      if (Math.abs(dx) < 46 || Math.abs(dx) <= Math.abs(dy)) return
      /* RTL: a swipe that travels LEFT goes forward through the list. */
      const dir = dx < 0 ? 1 : -1
      const here = SURFACES.findIndex((s) => s.id === sf.id)
      const n = SURFACES.length
      choose(SURFACES[(here + dir + n) % n].id)
    }
    box.addEventListener("touchstart", start, { passive: true })
    box.addEventListener("touchend", end, { passive: true })
    return () => {
      box.removeEventListener("touchstart", start)
      box.removeEventListener("touchend", end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sf])

  /* Nothing in the window is reachable. pointer-events takes the pointer
     away but not the tab order, so every control in the subtree is marked
     unreachable whenever the screen is rebuilt. */
  useEffect(() => {
    const box = frameRef.current
    if (!box) return
    for (const el of box.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href]")) {
      el.tabIndex = -1
    }
  }, [sf, form.site, form.live, form.rows?.length])

  /* ── The window moves to its size, it does not snap to it ──────────────
     The window is sized by the page inside it, and that page changes height
     four times a cycle: the results table lands, the bought domain appears
     under it, the surface changes, the published site loads. Each of those
     was a single-frame jolt, because height: auto cannot be transitioned.

     So the height is MEASURED and written as a pixel value, which the
     stylesheet then eases — the same move --fit and the hero's column matrix
     make, for the same reason.

     It cannot loop. The observer watches the SCREEN, whose height is its
     content's (align-self: start, and the min-height that used to tie it to
     the window is gone), and writes onto the WINDOW. Content does not read
     back from the window, so there is nothing to feed back. This is the trap
     runner.ts's fit pass documents, avoided the same way. */
  useEffect(() => {
    const app = frameRef.current
    const screen = screenRef.current
    if (!app || !screen) return
    const measure = () => {
      const chrome = app.querySelector<HTMLElement>(".zn4-chrome")
      const load = app.querySelector<HTMLElement>(".zn4-load")
      const h = screen.offsetHeight
      if (!h) return
      const furniture = (chrome?.offsetHeight ?? 0) + (load?.offsetHeight ?? 0)
      app.style.setProperty("--app-measured", (h + furniture) + "px")
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(screen)
    return () => ro.disconnect()
  }, [])

  /* The address the browser is showing. The surface owns it once it starts
     typing in it; until then it is the surface's own path. */
  const url = form.url || sf.host + sf.path

  return (
    <div
      className={`${uiClass} zn-publish`}
      dir="rtl"
      ref={rootRef}
      data-edit={edit || undefined}
      style={layoutVars(layout)}
    >
      {/* The publish word: the ground the browser stands on. Paper on the
          green, faded as a LAYER rather than as alpha in the colour. */}
      <h2
        className={`${wordClass} zn4-word`}
        style={{ fontWeight: wordWeight, lineHeight: wordLh } as React.CSSProperties}
      >
        {WORDS.map((w, i) => (
          <span
            key={w}
            data-state={i === word.cur ? "in" : i === word.prev ? "out" : "idle"}
            aria-hidden={i !== word.cur}
          >
            {w}
          </span>
        ))}
      </h2>

      <div className="zn-stagebox">
        {/* The browser. A complete window — all four corners — because what
            it is showing is an address, and an address bar cut off at an edge
            is not an address bar. data-down carries the arrival, so at rest
            nothing is written and a browser that never animates still finds
            the window where it belongs. */}
        <div className="zn4-win" data-down={!active || undefined}>
          {/* INSIDE the window's box, not above it in the column. Left as a
              sibling it pinned to the top of the stage while the window
              centred in what was left, so on a short page the two pills sat
              275px clear of the thing they switch and read as unrelated
              furniture. They travel in together now, which is also one
              arrival instead of two. */}
          <div className="zn4-switch" role="tablist" aria-label="الشاشة المعروضة">
            {SURFACES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={s.id === sf.id}
                data-on={s.id === sf.id}
                onClick={() => choose(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="zn4-app" ref={frameRef}>
            <div className="zn4-chrome">
              <span className="lights" aria-hidden><i /><i /><i /></span>
              {/* The address bar, and it is the subject of this section
                  rather than its furniture: the cursor types in it, and what
                  it reads at the end is the domain the reader watched being
                  bought two beats earlier. */}
              <span className="zn4-url" data-t="url" data-typing={form.url ? true : undefined} dir="ltr">
                <Lock className="ic" />
                <b>{url}</b>
              </span>
              <span className="pad" aria-hidden />
            </div>

            {/* The load. Only ever on while a page is actually being swapped,
                and gone the moment the new one is there. */}
            <span className="zn4-load" data-on={form.loading ? true : undefined} aria-hidden />

            <div className="zn4-stage">
              {/* The screen is NOT keyed and the entrance moved inside it. It
                  has to survive every surface change, because it is what the
                  window measures itself against — an element that remounts
                  takes its observer with it. */}
              <div className="zn4-screen" data-simulated ref={screenRef}>
                {/* Keyed on the surface AND on whether the site has arrived,
                    so the swap into the published site replays the entrance
                    the same way a change of surface does. */}
                <div className="zn4-in" key={sf.id + (form.site ? "-site" : "")}>
                  {sf.render({ f: form, focus })}
                </div>
              </div>
            </div>

            {cursor && (
              <span
                className="zn4-cursor"
                data-press={cursor.press}
                aria-hidden
                style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
              >
                <svg width="15" height="18" viewBox="0 0 12 15">
                  <path
                    d="M1 1 L1 12.2 L4.05 9.35 L6.1 13.9 L8.15 13 L6.15 8.55 L10.3 8.4 Z"
                    fill="#fafafa"
                    stroke="#0a2018"
                    strokeWidth="1.1"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>

      {edit && (
        <Composer layout={layout} setLayout={setLayout} scope={rootRef} wide={wide} section="publish" />
      )}
    </div>
  )
}
