"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/* ─────────────────────────────────────────────────────────────────────────
   The composer — a placement tool for either of the two built sections.

   It exists so the composition can be found by moving it rather than by
   describing it: drag the window or the word, pull a corner to resize, nudge
   with the arrow keys, and save when it looks right.

   It is NOT part of the page for a reader: it mounts only at ?edit=1 and
   ships no DOM, no listeners and no state to anyone else.

   WHAT IT SAVES, THOUGH, IS. This is the change from the first version, and
   it is the whole point of the tool now. It used to write to localStorage
   and print CSS for a human to paste into page.tsx by hand — so nothing a
   reader did ever reached the page, and clearing a browser lost the work.
   Save now POSTs to /api/demo-layout, which writes app/demo/home/placement.json;
   the page imports that file, so the placement is the real placement, it
   survives a reload, it is committed with the source, and it ships.

   Every value still travels as a CSS variable that the stylesheet falls back
   away from, so an untouched cell in that file changes nothing at all.
   ───────────────────────────────────────────────────────────────────────── */

export type Layout = {
  appX: number
  appY: number
  appW: number | null   // px; null = leave the stylesheet's own width
  appH: number | null   // px; null = leave the stylesheet's own basis
  wordX: number
  wordY: number
  wordSize: number | null // px; null = leave the stylesheet's clamp()
}

export const EMPTY_LAYOUT: Layout = {
  appX: 0, appY: 0, appW: null, appH: null, wordX: 0, wordY: 0, wordSize: null,
}

/** Which section is being composed. All three are laid out from the same parts. */
export type SectionId = "build" | "manage" | "publish"

/** The selectors the two targets have in each section. */
export const SELECTORS: Record<SectionId, { app: string; word: string }> = {
  build: { app: ".zn-app", word: ".zn-word" },
  manage: { app: ".zn3-app", word: ".zn3-word" },
  publish: { app: ".zn4-app", word: ".zn4-word" },
}

/** What the panel calls the section it is composing. */
const SECTION_AR: Record<SectionId, string> = {
  build: "ابن", manage: "ادر", publish: "انشر",
}

/* Kept per width class, because the two are laid out differently and a number
   that suits a laptop is wrong on a phone. Same split as the stylesheet. */
type Width = "wide" | "narrow"
export type Placement = Record<SectionId, Record<Width, Layout>>

/** Reads one cell out of the saved file, with the stylesheet as the fallback. */
export function pick(store: Placement | undefined, id: SectionId, wide: boolean): Layout {
  const cell = store?.[id]?.[wide ? "wide" : "narrow"]
  return cell ? { ...EMPTY_LAYOUT, ...cell } : EMPTY_LAYOUT
}

/** The CSS variables a layout writes. Anything left null is simply not set. */
export function layoutVars(l: Layout): React.CSSProperties {
  const v: Record<string, string> = {}
  if (l.appX) v["--app-x"] = `${Math.round(l.appX)}px`
  if (l.appY) v["--app-y"] = `${Math.round(l.appY)}px`
  if (l.appW != null) v["--app-w"] = `${Math.round(l.appW)}px`
  if (l.appH != null) v["--app-h"] = `${Math.round(l.appH)}px`
  if (l.wordX) v["--word-x"] = `${Math.round(l.wordX)}px`
  if (l.wordY) v["--word-y"] = `${Math.round(l.wordY)}px`
  if (l.wordSize != null) v["--word-size"] = `${Math.round(l.wordSize)}px`
  return v as React.CSSProperties
}

type Box = { x: number; y: number; w: number; h: number }

/** A re-measure that found nothing new must not cause a render. */
const same = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b &&
    Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y) &&
    Math.round(a.w) === Math.round(b.w) && Math.round(a.h) === Math.round(b.h))
type Target = "app" | "word"
type Drag = {
  target: Target
  mode: "move" | "size"
  px: number
  py: number
  from: Layout
  /* The size the gesture started from, READ ONCE. Reading it live each frame
     is a feedback loop: the thing grows, the next frame measures the grown
     thing and grows it again — one small drag took the word from 216px to
     863px before this was captured. */
  baseW: number
  baseH: number
  baseSize: number
} | null

export default function Composer({
  layout,
  setLayout,
  scope,
  wide,
  section = "build",
}: {
  layout: Layout
  setLayout: (l: Layout) => void
  /** The element the two targets live inside — the composer measures against it. */
  scope: React.RefObject<HTMLElement>
  wide: boolean
  /** Which section is being composed; decides the selectors and the save cell. */
  section?: SectionId
}) {
  const sel = SELECTORS[section]
  const [boxes, setBoxes] = useState<{ app: Box | null; word: Box | null }>({ app: null, word: null })
  const [picked, setPicked] = useState<Target>("app")
  const drag = useRef<Drag>(null)

  /* Where the two things actually are, in the scope's own coordinates. Read
     from the live elements rather than derived from the numbers, so the
     outlines sit on what is really on screen even when a rule the composer
     does not know about is what put it there. */
  const measure = useCallback(() => {
    const root = scope.current
    if (!root) return
    const r = root.getBoundingClientRect()
    /* The root ZoomLock writes CSS zoom: rects come back rendered, the offsets
       written back are CSS pixels. This ratio is the bridge — the same one the
       cursor uses. */
    const k = root.offsetWidth ? r.width / root.offsetWidth : 1
    const read = (sel: string): Box | null => {
      const el = root.querySelector(sel)
      if (!el) return null
      const b = el.getBoundingClientRect()
      return {
        x: (b.left - r.left) / k, y: (b.top - r.top) / k,
        w: b.width / k, h: b.height / k,
      }
    }
    const next = { app: read(sel.app), word: read(sel.word) }
    setBoxes((prev) => (same(prev.app, next.app) && same(prev.word, next.word) ? prev : next))
  }, [scope, sel])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (scope.current) ro.observe(scope.current)
    const el = scope.current?.querySelector(sel.app)
    if (el) ro.observe(el)
    const id = setInterval(measure, 400)
    window.addEventListener("resize", measure)
    return () => { ro.disconnect(); clearInterval(id); window.removeEventListener("resize", measure) }
  }, [measure, scope, sel])

  /* One pointer capture for the whole gesture, so a fast drag that leaves the
     handle does not drop it. */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      e.preventDefault()
      const root = scope.current
      const k = root && root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1
      const dx = (e.clientX - d.px) / (k || 1)
      const dy = (e.clientY - d.py) / (k || 1)
      const f = d.from
      if (d.target === "app") {
        if (d.mode === "move") setLayout({ ...f, appX: f.appX + dx, appY: f.appY + dy })
        else setLayout({
          ...f,
          /* The window is centred, so a corner pulled one way widens it both
             ways — hence the doubled dx. */
          appW: Math.max(240, d.baseW + dx * 2),
          appH: Math.max(200, d.baseH + dy),
        })
      } else {
        if (d.mode === "move") setLayout({ ...f, wordX: f.wordX + dx, wordY: f.wordY + dy })
        else setLayout({ ...f, wordSize: Math.max(24, d.baseSize + dy) })
      }
    }
    const onUp = () => { drag.current = null }
    window.addEventListener("pointermove", onMove, { passive: false })
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [setLayout, scope])

  /* Whether this composer is the one listening. Arrow keys are the DECK'S
     keys — they are how a reader gets between screens — and a composer that
     grabs them in the capture phase takes the page's navigation away and
     nudges the layout by a pixel on every press instead. With two sections
     each mounting their own tool, they would also both grab the same press.

     So a composer is engaged only once something inside it has been touched,
     and it lets go on a click anywhere else or on Escape. Until then the
     arrows belong to the deck, exactly as they do without the tool. */
  const [engaged, setEngaged] = useState(false)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      const mine = !!el?.closest?.(".zn-compose")
      /* Only this composer's own furniture engages it; another section's
         click releases this one. */
      setEngaged(mine && !!scope.current?.contains(el))
    }
    window.addEventListener("pointerdown", onDown, true)
    return () => window.removeEventListener("pointerdown", onDown, true)
  }, [scope])

  /* Arrow keys nudge the picked thing; shift makes it a bigger step. */
  useEffect(() => {
    if (!engaged) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setEngaged(false); return }
      const step = e.shiftKey ? 10 : 1
      let dx = 0, dy = 0
      if (e.key === "ArrowLeft") dx = -step
      else if (e.key === "ArrowRight") dx = step
      else if (e.key === "ArrowUp") dy = -step
      else if (e.key === "ArrowDown") dy = step
      else return
      e.preventDefault()
      e.stopPropagation()
      if (picked === "app") setLayout({ ...layout, appX: layout.appX + dx, appY: layout.appY + dy })
      else setLayout({ ...layout, wordX: layout.wordX + dx, wordY: layout.wordY + dy })
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [engaged, picked, layout, setLayout])

  const begin = (target: Target, mode: "move" | "size") => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPicked(target)
    const root = scope.current
    const el = root?.querySelector(target === "app" ? sel.app : sel.word) as HTMLElement | null
    drag.current = {
      target, mode, px: e.clientX, py: e.clientY, from: layout,
      /* offsetWidth/Height and the computed font size are CSS pixels, which is
         what gets written back — no zoom conversion needed on these. */
      baseW: layout.appW ?? el?.offsetWidth ?? 640,
      baseH: layout.appH ?? el?.offsetHeight ?? 640,
      baseSize: layout.wordSize ?? (el ? parseFloat(getComputedStyle(el).fontSize) : 200),
    }
  }

  const css = buildCss(layout, wide)
  const [copied, setCopied] = useState(false)

  /* Saving, for real. One POST per press, and the button says which of the
     three things happened rather than going quiet: saved, refused, or still
     going. A refusal here is almost always the route answering 404 because
     the build is a production one — the file cannot be written there and the
     route says so instead of pretending. */
  const [save, setSave] = useState<"idle" | "saving" | "done" | "fail">("idle")
  const [why, setWhy] = useState<string | null>(null)
  const commit = useCallback(async () => {
    setSave("saving"); setWhy(null)
    try {
      const res = await fetch("/api/demo-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, width: wide ? "wide" : "narrow", layout }),
      })
      if (res.status === 404) throw new Error("متاح في التطوير فقط")
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) throw new Error(data?.error || `فشل الحفظ (${res.status})`)
      setSave("done")
      setTimeout(() => setSave("idle"), 1800)
    } catch (e) {
      setWhy(e instanceof Error ? e.message : "فشل الحفظ")
      setSave("fail")
      setTimeout(() => setSave("idle"), 3200)
    }
  }, [layout, section, wide])

  /* Cmd/Ctrl+S saves, because that is the key a person reaches for. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); e.stopPropagation()
        void commit()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [commit])

  return (
    <div className="zn-compose" dir="rtl" data-engaged={engaged || undefined}>
      {(["word", "app"] as Target[]).map((t) => {
        const b = boxes[t]
        if (!b) return null
        return (
          <div
            key={t}
            className="zn-compose-box"
            data-on={picked === t}
            style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            onPointerDown={begin(t, "move")}
          >
            <span className="tag">{t === "app" ? "الإطار" : "الكلمة"}</span>
            <span className="grip" onPointerDown={begin(t, "size")} />
          </div>
        )
      })}

      <div className="zn-compose-panel" dir="rtl" onPointerDown={(e) => e.stopPropagation()}>
        <p className="head">
          تحرير التخطيط · {SECTION_AR[section]} · {wide ? "عريض" : "ضيّق"}
        </p>
        {/* Picking from here rather than only off the canvas: the word sits
            behind the window, so where the two overlap its outline cannot be
            reached by a pointer. */}
        <div className="pick">
          {(["app", "word"] as Target[]).map((t) => (
            <button key={t} type="button" data-on={picked === t} onClick={() => setPicked(t)}>
              {t === "app" ? "الإطار" : "الكلمة"}
            </button>
          ))}
        </div>
        <Row label="الإطار س" v={Math.round(layout.appX)} />
        <Row label="الإطار ص" v={Math.round(layout.appY)} />
        <Row label="العرض" v={layout.appW == null ? "تلقائي" : Math.round(layout.appW)} />
        <Row label="الارتفاع" v={layout.appH == null ? "تلقائي" : Math.round(layout.appH)} />
        <Row label="الكلمة س" v={Math.round(layout.wordX)} />
        <Row label="الكلمة ص" v={Math.round(layout.wordY)} />
        <Row label="حجم الكلمة" v={layout.wordSize == null ? "تلقائي" : Math.round(layout.wordSize)} />
        <div className="acts">
          <button type="button" onClick={() => { setLayout(EMPTY_LAYOUT) }}>إرجاع</button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(css).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1400)
              }).catch(() => { /* clipboard refused; the CSS is on screen anyway */ })
            }}
          >
            {copied ? "نُسخ" : "انسخ CSS"}
          </button>
        </div>
        {/* The one that matters. It writes the placement to the file the page
            reads, so pressing it changes the page rather than the clipboard. */}
        <button type="button" className="save" data-state={save} onClick={() => void commit()}>
          {save === "saving" ? "جارٍ الحفظ…"
            : save === "done" ? "حُفظ ✓"
            : save === "fail" ? (why || "فشل الحفظ")
            : "حفظ"}
        </button>
        <pre>{css}</pre>
        <p className="hint">
          اسحب للتحريك · اسحب الزاوية للحجم · ⌘S للحفظ
          <br />
          {engaged
            ? "الأسهم تضبط · Esc يعيدها للتنقل"
            : "انقر داخل الأداة لتفعيل الأسهم — وإلا فهي للتنقل بين الشاشات"}
        </p>
      </div>
    </div>
  )
}

function Row({ label, v }: { label: string; v: number | string }) {
  return (
    <p className="row"><span>{label}</span><b dir="ltr">{v}</b></p>
  )
}

/** What to paste into page.tsx once the composition is right. */
function buildCss(l: Layout, wide: boolean): string {
  const lines: string[] = []
  if (l.appX || l.appY) {
    lines.push(`.zn-stagebox { transform: translate(${Math.round(l.appX)}px, ${Math.round(l.appY)}px); }`)
  }
  if (l.appW != null) lines.push(`.zn-stagebox { width: ${Math.round(l.appW)}px; }`)
  if (l.appH != null) lines.push(`.zn-app { flex-basis: ${Math.round(l.appH)}px; }`)
  if (l.wordX || l.wordY) {
    lines.push(`.zn-word { transform: translate(${Math.round(l.wordX)}px, ${Math.round(l.wordY)}px); }`)
  }
  if (l.wordSize != null) lines.push(`.zn-word { font-size: ${Math.round(l.wordSize)}px; }`)
  if (!lines.length) return "/* لا تغييرات */"
  const body = lines.map((x) => "  " + x).join("\n")
  return wide
    ? `/* ≥1024px */\n${body}`
    : `@media (max-width: 1023px) {\n${body}\n}`
}
