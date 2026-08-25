"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { type ExtractedCategory } from "@/components/restaurant/MenuImageAnalyzer"
import { themePreview, themePreviewFallback } from "@/lib/theme-previews"
import { TEMPLATE_RUNS, type Ctx, type Form } from "./templates"

/* ─────────────────────────────────────────────────────────────────────────
   Section two: ابن — the build step.

   The first of the hero's three words, shown rather than described. The
   section drives the product's own path: the eight templates as /themes
   lists them, the real wizard behind the one that is picked, and the real
   form filling itself in.

   This file is the stage — the window, the picker, the cursor and the clock.
   What gets filled in, and in what order, belongs to each template and lives
   in ./templates.tsx. A run picks a template, opens its wizard, and walks its
   cards; the next run picks the next template, so the picker really does lead
   somewhere different.

   The animation is PER CARD, never one long take. A card comes forward, the
   cursor moves into it, types or picks, the card finishes, a beat plays, and
   only then does the next card arrive. The cursor never leaves.
   ───────────────────────────────────────────────────────────────────────── */

const OBSIDIAN = "#171717"

/* The eight, in the order /themes lists them and with the same Arabic
   labels (lib/aurora-tints), the same taglines and the same createHref. The
   template the cursor picks is the one a reader clicking here would land on. */
const TEMPLATES = [
  { id: "one_product", label: "متجر",   tag: "متجر شوبيفاي · منتج واحد", href: "/build" },
  { id: "restaurant",  label: "مطعم",   tag: "مطعم · قائمة · حجوزات",     href: "/theme/new/restaurant" },
  { id: "atlas",       label: "تطبيق",  tag: "تطبيق · برمجيات · B2B",     href: "/theme/new/atlas" },
  { id: "lookbook",    label: "أزياء",  tag: "أزياء · ملابس · علامة",     href: "/theme/new/lookbook" },
  { id: "collective",  label: "تشكيلة", tag: "كتالوج · منتجات متعددة",    href: "/theme/new/collective" },
  { id: "studio",      label: "ستوديو", tag: "قصة علامة · تحرير",         href: "/theme/new/studio" },
  { id: "services",    label: "خدمات",  tag: "خدمات محلية · حِرف",         href: "/theme/new/services" },
  { id: "wellness",    label: "عافية",  tag: "سبا · يوغا · عافية",        href: "/theme/new/wellness" },
]

/* The build word, cycling the hero's first column on the hero's own roll. */
const WORDS = ["ابن", "تبني", "بناء", "تحسين"]
const WORD_HOLD = 4600

/* Timings. The cursor is slow enough to be followed and the typing slow
   enough to read as a person rather than a machine. */
const MOVE = 620
const PRESS = 170
const SETTLE = 260
const KEY = 46
const THINK = 900

/* Thrown to unwind a run when the section goes off screen or unmounts.
   Caught by the runner itself, and means nothing else. */
const HALT = Symbol("halt")

export default function BuildSection({
  active,
  uiClass,
  wordClass,
  wordWeight,
  wordLh,
}: {
  active: boolean
  uiClass: string
  wordClass: string
  wordWeight: number
  wordLh: number
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const analyzerRef = useRef<HTMLDivElement>(null)

  /* Which run we are on. Each run is one template, and they take turns. */
  const [take, setTake] = useState(0)
  const tpl = TEMPLATE_RUNS[take % TEMPLATE_RUNS.length]

  const [view, setView] = useState<"picker" | "wizard">("picker")
  const [card, setCard] = useState(0)
  const [hover, setHover] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(tpl.empty)
  /* Which field is being typed into. A caret belongs to exactly one field at
     a time, and only while it is being written. */
  const [focus, setFocus] = useState<string | null>(null)
  /* The cursor is the one thing here that is decoration, so it stays out of
     the document until a run is actually driving one. */
  const [cursor, setCursor] = useState<{ x: number; y: number; press: boolean } | null>(null)
  /* The wizard's closing bar, and whether its button has been pressed. */
  const [finish, setFinish] = useState<false | "ready" | "going">(false)

  /* The build word's own clock, on the hero's hold and the hero's roll. */
  const [word, setWord] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null })
  useEffect(() => {
    if (!active) { setWord({ cur: 0, prev: null }); return }
    const id = setInterval(
      () => setWord((w) => ({ cur: (w.cur + 1) % WORDS.length, prev: w.cur })),
      WORD_HOLD,
    )
    return () => clearInterval(id)
  }, [active])

  /* Where the analyzer hands its result back: the wizard's own
     applyExtractedMenu, narrowed to what the Menu card shows. */
  const applyMenu = useCallback((extracted: ExtractedCategory[]) => {
    const mapped = extracted
      .map((c) => ({
        name: (c.name || "").trim().slice(0, 40),
        items: (Array.isArray(c.items) ? c.items : [])
          .map((it) => ({
            name: (it.name || "").trim().slice(0, 80),
            price: (it.price || "").trim().slice(0, 30),
          }))
          .filter((it) => it.name.length >= 1),
      }))
      .filter((c) => c.name.length >= 2 && c.items.length > 0)
    setForm((f) => ({ ...f, cats: mapped }))
    return { categories: mapped.length, items: mapped.reduce((n, c) => n + c.items.length, 0) }
  }, [])

  useEffect(() => {
    if (!active) {
      /* Back to the state the section rests in when nothing has run: the
         eight templates, which are real content on their own. */
      setView("picker"); setCard(0); setForm(tpl.empty)
      setHover(null); setCursor(null); setFocus(null); setFinish(false)
      return
    }
    let dead = false
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    /* Warm the menu read the moment the section arrives, well before the
       Menu card asks for it. The route answers a demo read from one memo per
       server instance, so this is the same work started early. */
    void fetch("/api/analyze-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true }),
    }).catch(() => { /* the card will ask again */ })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms))
    const wait = async (ms: number) => { await sleep(ms); if (dead) throw HALT }

    /* Where a target sits inside the frame. Rects come back in RENDERED
       pixels, because the root ZoomLock writes CSS zoom, while the offset
       written onto the cursor is in CSS pixels. The frame's own rect against
       its offsetWidth is the ratio between the two, so the two are never
       mixed — the same trap the hero's column measurement fell into. */
    const at = (el: Element | null, ax = 0.5, ay = 0.55) => {
      const frame = frameRef.current
      if (!frame || !el) return null
      const f = frame.getBoundingClientRect()
      const t = el.getBoundingClientRect()
      const scale = frame.offsetWidth ? f.width / frame.offsetWidth : 1
      if (!scale) return null
      return {
        x: (t.left + t.width * ax - f.left) / scale,
        y: (t.top + t.height * ay - f.top) / scale,
      }
    }

    const find = (key: string) => frameRef.current?.querySelector(`[data-t="${key}"]`) ?? null

    const moveEl = async (el: Element | null, ax?: number, ay?: number) => {
      const p = at(el, ax, ay)
      if (p) setCursor((c) => ({ x: p.x, y: p.y, press: c ? c.press : false }))
      await wait(reduced ? 0 : MOVE)
    }
    const move = (key: string, ax?: number, ay?: number) => moveEl(find(key), ax, ay)

    const click = async () => {
      setCursor((c) => (c ? { ...c, press: true } : c))
      await wait(PRESS)
      setCursor((c) => (c ? { ...c, press: false } : c))
      await wait(SETTLE)
    }

    /* A patch whose value is a function is applied to that key's previous
       value, so a script can append to a list without holding it. */
    const set = (patch: Form) =>
      setForm((f) => {
        const next: Form = { ...f }
        for (const [k, v] of Object.entries(patch)) {
          next[k] = typeof v === "function" ? (v as (p: any) => any)(f[k]) : v
        }
        return next
      })

    /* Typing is typing: one more character per beat into the field the cursor
       is sitting in. Arabic reshapes as its letters connect, which is exactly
       what a reader typing into this field would see. */
    const type = async (key: string, text: string, ax = 0.88) => {
      await move(key, ax)
      await click()
      setFocus(key)
      if (reduced) {
        set({ [key]: text })
        await wait(140)
        setFocus(null)
        return
      }
      for (let i = 1; i <= text.length; i += 1) {
        set({ [key]: text.slice(0, i) })
        await wait(KEY + Math.random() * 30)
      }
      await wait(190)
      setFocus(null)
    }

    const pick = async (key: string, patch: Form) => {
      await move(key)
      await click()
      set(patch)
      await wait(260)
    }

    /* The beat between one card finishing and the next arriving. The cursor
       STAYS — a person filling in a form does not vanish between fields. */
    const beat = async (ms = THINK) => {
      setFocus(null)
      setCursor((c) => (c ? { ...c, press: false } : c))
      await wait(ms)
    }

    const ctx: Ctx = {
      move, moveEl, click, type, pick, beat, wait, set, reduced,
      card: (i: number) => setCard(i),
      frame: () => frameRef.current,
      analyzer: () => analyzerRef.current,
    }

    const run = async () => {
      /* The picker: eight templates, and this run's one gets chosen. */
      await wait(760)
      await move(`tpl-${tpl.id}`, 0.5, 0.5)
      setHover(tpl.id)
      await wait(340)
      await move("tpl-go", 0.5, 0.5)
      await click()
      setHover(null)
      setView("wizard")
      setCard(0)
      await beat(640)

      /* The template's own cards, in the template's own order. */
      await tpl.run(ctx)

      /* The ninth beat: the wizard's closing bar. Not a card — in the wizard
         it is sticky at the foot of the whole form. */
      setFinish("ready")
      await wait(760)
      await move("generate", 0.5, 0.5)
      await click()
      setFinish("going")
      /* Held on the button's real working label. Nothing is generated: a run
         takes the wizard twenty to forty seconds of paid work per visitor,
         and showing a site that was never built would be a lie about what the
         reader just watched being filled in. */
      await beat(2600)

      /* Round again, on the next template. */
      setView("picker"); setCard(0); setFinish(false)
      await wait(1500)
      if (!dead) setTake((t) => t + 1)
    }

    run().catch((e) => { if (e !== HALT) throw e })
    return () => { dead = true }
  }, [active, take, tpl])

  /* A new run means a new template, so the form starts from that one's
     fields rather than the last one's. */
  useEffect(() => { setForm(tpl.empty) }, [tpl])

  const T = tpl.cards[Math.min(card, tpl.cards.length - 1)]

  return (
    <div className={`${uiClass} zn-build`} dir="rtl">
      {/* The build word: the ground the window stands on. Four forms of the
          one word this section is, on the hero's own roll — the old one
          leaves upward before the next rises, never together. */}
      <h2
        className={`${wordClass} zn-word`}
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
      <div className="zn-app" ref={frameRef}>
        {/* Where this is. The path changes on the click, which is the point of
            the first beat: the picker really does open the wizard. */}
        <div className="zn-path" dir="ltr">
          <span>zenyaai.co</span>
          <b>{view === "picker" ? "/themes" : tpl.path}</b>
        </div>

        <div className="zn-stage">
          {view === "picker" ? (
            <div className="zn-picker">
              <h2>اختر قالبًا.</h2>
              <div className="zn-grid">
                {TEMPLATES.map((t) => (
                  <a key={t.id} href={t.href} data-t={`tpl-${t.id}`} className="zn-tile" data-on={hover === t.id}>
                    {/* The template's real cover, served from the 560px
                        thumbnails rather than the full screenshots behind
                        themePreview(): the originals run to 1.2MB apiece and
                        eight of them decoding as the panel arrives was a
                        600–900ms stall on the one frame budget this page
                        cannot afford. The resolver is still the fallback.
                        eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="cover"
                      src={`/theme-previews/thumb/${t.id}.webp`}
                      alt=""
                      width={560}
                      height={350}
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement
                        el.src = el.dataset.tried ? themePreviewFallback(t.id) : themePreview(t.id)
                        el.dataset.tried = "1"
                      }}
                    />
                    <span className="tag">{t.tag}</span>
                    <span className="name">{t.label}</span>
                    <span className="go" data-t={hover === t.id ? "tpl-go" : undefined}>ابنِ بهذا</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            /* One card at a time. The key restarts the arrival on each change;
               the card rests visible and the keyframe only borrows the hidden
               state for its own duration. */
            <div className="zn-card" key={`${tpl.id}-${T.id}`}>
              <div className="zn-head">
                <h2>{T.title}</h2>
                <p>{T.sub}</p>
              </div>
              <div className="zn-body">
                {tpl.render({ card: T.id, f: form, focus, analyzerRef, applyMenu })}
              </div>
            </div>
          )}
        </div>

        {/* The wizard's closing bar, verbatim. It arrives once the last card
            is done and rests visible, like everything else here. */}
        {finish && (
          <div className="zn-finish" data-going={finish === "going"}>
            <div>
              <p className="head">جاهزون متى كنت مستعدًّا.</p>
              <p className="sub">يستغرق نحو 20 إلى 40 ثانية. سننقلك إلى معاينتك الحيّة.</p>
            </div>
            <span className="go" data-t="generate">
              {finish === "going" ? "جارٍ توليد موقعك…" : "ولّد موقعي"}
            </span>
          </div>
        )}

        {cursor && (
          <span
            className="zn-cursor"
            data-press={cursor.press}
            aria-hidden
            style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
          >
            <svg width="15" height="18" viewBox="0 0 12 15">
              <path
                d="M1 1 L1 12.2 L4.05 9.35 L6.1 13.9 L8.15 13 L6.15 8.55 L10.3 8.4 Z"
                fill={OBSIDIAN}
                stroke="#fafafa"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
      </div>
    </div>
  )
}
