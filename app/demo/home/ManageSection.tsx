"use client"

import { useEffect, useRef, useState } from "react"
import { HALT, KEY, makeRunner, writeValue, type Cursor } from "./runner"
import { SURFACES, type Form, type ManageCtx } from "./surfaces"
import Composer, { layoutVars, pick, type Layout, type Placement } from "./Composer"
import placement from "./placement.json"

/* ─────────────────────────────────────────────────────────────────────────
   Section three: ادر — the manage step.

   The second of the hero's three words. Where ابن shows the wizard that
   builds the site, ادر shows the three dashboard surfaces the owner lives in
   afterwards: the reservations inbox, the analytics, and the search settings.
   Each is the real screen, with its own labels in its own order.

   This file is the stage — the window, the cursor and the clock. What each
   surface holds, and what happens on it, lives in ./surfaces.tsx. The cursor
   engine and the fit pass are section two's, imported rather than rebuilt.

   The one thing that is deliberately not section two's is the ground. ابن is
   white paper — the outside, the making. ادر is where the owner works, so it
   is the inside of the product: obsidian, one accent, and paper type.
   ───────────────────────────────────────────────────────────────────────── */

/* The manage word, cycling the hero's SECOND column on the hero's own roll. */
const WORDS = ["ادر", "تدير", "إدارة", "إشراف"]
const WORD_HOLD = 4600

export default function ManageSection({
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
  const stageRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const siteRef = useRef<HTMLDivElement>(null)

  /* Which run we are on. Left alone the three take turns; the switcher lets a
     reader jump straight to the one they want rather than waiting for it to
     come round. */
  const [take, setTake] = useState(0)
  const sf = SURFACES[take % SURFACES.length]

  /* The placement this section was composed at, read from the file the
     composer saves into. Applied always, exactly as section two applies its
     own: an untouched cell writes no variables and the stylesheet's numbers
     stand. */
  const [wide, setWide] = useState(true)
  const [layout, setLayout] = useState<Layout>(() => pick(placement as Placement, "manage", true))
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => { setWide(mq.matches); setLayout(pick(placement as Placement, "manage", mq.matches)) }
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

  /* A new run means a new surface, and its state starts from that one's
     fields rather than the last one's. The surface it belongs to is held
     WITH the state and reconciled during render rather than in an effect: an
     effect runs after the paint, so for exactly one frame the new surface was
     handed the old one's fields — which is a screen reading a key that is not
     on it. The key on the stage remounts the product's own booking form along
     with it, which is how that form is put back to empty without reaching
     inside it. */
  const [held, setForm] = useState<{ id: string; f: Form }>({ id: sf.id, f: sf.empty })
  const form = held.id === sf.id ? held.f : sf.empty
  const [focus, setFocus] = useState<string | null>(null)
  const [cursor, setCursor] = useState<Cursor>(null)

  /* The manage word's own clock, on the hero's hold and the hero's roll. */
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
    const { moveEl, click, wait } = r

    const set = (patch: Form) =>
      setForm((prev) => {
        const f = prev.id === sf.id ? prev.f : sf.empty
        const next: Form = { ...f }
        for (const [k, v] of Object.entries(patch)) {
          next[k] = typeof v === "function" ? (v as (p: any) => any)(f[k]) : v
        }
        return { id: sf.id, f: next }
      })

    /* Typing into a field this page draws itself. */
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

    /* Typing into one of the PRODUCT'S OWN inputs. The value goes through the
       prototype's setter and a bubbling event, which is what React's onChange
       is built over — the component cannot tell it from a keystroke, and it
       is the same move section two makes to hand the analyzer its file. */
    const el = (sel: string) => siteRef.current?.querySelector<HTMLInputElement>(sel) ?? null
    const typeInto = async (sel: string, text: string) => {
      const node = el(sel)
      await moveEl(node, 0.86, 0.5)
      await click()
      if (!node) return
      /* No focus() call. The value setter does not need one, and focusing a
         real input on a phone raises the on-screen keyboard over a form the
         reader is only meant to be watching. */
      if (reduced) { writeValue(node, text); await wait(140); return }
      for (let i = 1; i <= text.length; i += 1) {
        writeValue(node, text.slice(0, i))
        await wait(KEY + Math.random() * 30)
      }
      await wait(190)
    }
    const setValue = async (sel: string, value: string) => {
      const node = el(sel)
      await moveEl(node, 0.5, 0.5)
      await click()
      if (node) writeValue(node, value)
      await wait(300)
    }

    const ctx: ManageCtx = {
      ...r, set, typeState, typeInto, setValue, setFocus,
      site: () => siteRef.current,
    }

    const run = async () => {
      await wait(520)
      await sf.run(ctx)
      /* Round again, on the next surface. */
      await wait(900)
      if (!dead) setTake((t) => t + 1)
    }

    run().catch((e) => { if (e !== HALT) throw e })
    return () => { dead = true }
  }, [active, take, sf])

  /* Swipe sideways on the window to change surface. The deck owns the
     VERTICAL swipe and stands down on the same test, so one finger carries
     two meanings decided by which way it actually went. */
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

  /* The product's own form ships real inputs, and pointer-events alone does
     not take them out of the tab order — a reader could still reach them with
     a keyboard and start typing into the demo. Marked unreachable whenever the
     surface changes, which is the only time the subtree is rebuilt. */
  useEffect(() => {
    const box = frameRef.current
    if (!box) return
    for (const el of box.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href]")) {
      el.tabIndex = -1
    }
  }, [sf, form.rows?.length])

  /* NO FIT PASS HERE. Section two scales a card down to the room it has;
     this section fills the screen instead and scrolls when a surface is
     taller than the display showing it — which is what a person does, and
     unlike scaling it has no floor past which the type stops being readable.
     The scrolling lives in the cursor: it brings each target into view
     before it moves to it. See bring() in ./runner. */

  return (
    <div
      className={`${uiClass} zn-manage`}
      dir="rtl"
      ref={rootRef}
      data-edit={edit || undefined}
      style={layoutVars(layout)}
    >
      {/* The manage word: the ground the window stands on. Paper on obsidian,
          faded as a LAYER rather than as alpha in the colour — connected
          Arabic letters overlap at every join, and a translucent colour
          composites each join twice. */}
      <h2
        className={`${wordClass} zn3-word`}
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
        {/* The switcher sits ABOVE the screen here, not under it: the device
            runs off the bottom of the viewport, so there is no "under". */}
        <div className="zn3-switch" role="tablist" aria-label="الشاشة المعروضة">
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

        {/* The light the screen throws into the room. It is the accent, and
            it is the one thing here that is physically motivated: a lit
            display in a dark room casts. */}
        <div className="zn3-cast" data-down={!active || undefined} aria-hidden />

        {/* The device. Which device depends on the width: a display on a
            laptop, an iPad on a tablet, a phone on a phone. data-down rather
            than data-up, so the RESTING state in the stylesheet is the
            finished one and a browser that never animates still shows the
            screen where it belongs. */}
        <div className="zn3-device" data-down={!active || undefined}>
          <span className="zn3-cam" aria-hidden />
          <div className="zn3-app" ref={frameRef}>
            <div className="zn3-path" dir="ltr">
              <span>zenyaai.co</span>
              <b>{sf.path}</b>
            </div>

            <div className="zn3-stage" ref={stageRef}>
              <div className="zn-fit" ref={fitRef}>
                {/* Keyed on the surface, so an entrance replays and the
                    product's own form comes back empty on the way round. */}
                <div className="zn3-screen" key={sf.id}>
                  {sf.render({ f: form, focus, siteRef })}
                </div>
              </div>
            </div>

            {cursor && (
              <span
                className="zn3-cursor"
                data-press={cursor.press}
                aria-hidden
                style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
              >
                <svg width="15" height="18" viewBox="0 0 12 15">
                  <path
                    d="M1 1 L1 12.2 L4.05 9.35 L6.1 13.9 L8.15 13 L6.15 8.55 L10.3 8.4 Z"
                    fill="#fafafa"
                    stroke="#131316"
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
        <Composer layout={layout} setLayout={setLayout} scope={rootRef} wide={wide} section="manage" />
      )}
    </div>
  )
}
