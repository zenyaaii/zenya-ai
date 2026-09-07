"use client"

/**
 * The candidate build form. See page.tsx for why this route exists.
 *
 * THE FORM IS THE PAGE. Unlike /demo/templates, which is a catalogue standing
 * on bare paper, this surface has exactly one job, so the composition is a
 * rail and a stage: the eight steps on the start side, one step at a time on
 * the stage, and a bar underneath that never moves. Nothing competes.
 *
 * WHERE THE CONTENT COMES FROM. spec.ts, and every string in it is copied out
 * of app/(main)/theme/new/restaurant/page.tsx. This page invents no field, no
 * label and no placeholder. The presets are IMPORTED from the wizard's own
 * utils/restaurant/presets, so a palette cannot drift between the two.
 *
 * WHAT IT DOES NOT DO, stated plainly because the alternative is a lie: it
 * does not generate anything. The generator lives behind the real wizard and
 * needs an account; this route is public and noindex. So the last step is a
 * review, and its call to action hands the reader to the real builder. A demo
 * that pretends to POST to a generator it cannot reach would be the same class
 * of lie as an Unsplash cover standing in for a template preview.
 *
 * THE VIOLET IS SPENT ON PROGRESS AND ON THE ACTION, nowhere else. On the
 * catalogue the accent had to fight eight screenshots; here there are none, so
 * violet can carry real meaning — the rail's fill, the current step, a focused
 * field's ring, a chosen chip, and the primary button. Type stays obsidian and
 * the ground stays one flat #fafafa.
 *
 * MOTION, and the one rule that governs it: a resting state is the finished
 * state. Every animation borrows its hidden half from a class the script adds
 * on mount, so a browser that never runs it reads a finished form. Steps
 * arrive on a stagger, the rail's fill and its marker are transitions rather
 * than keyframes, and all of it collapses under prefers-reduced-motion.
 *
 * THE HEADER IS THE CANDIDATE SET'S, mechanic and all, and it watches ".zf"
 * — the footer cap's real class. /demo/pricing's .zf-inner bug was fixed in
 * the same set of changes; this page never had it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Menu, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import PricingFooter from "../pricing/PricingFooter"
import { ALL_FIELDS, DEFAULT_HOURS, PLACE_KINDS, PRESETS, STEPS, UPLOADS, type FieldSpec } from "./spec"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/* The candidate set links inside the candidate set. Reported twice on the
   other pages; it does not get to regress here. */
const NAV: Array<{ href: string; label: string; current?: boolean }> = [
  { href: "/demo/templates", label: "القوالب" },
  { href: "/demo/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

/** The real builder, for the hand-off on the last step. */
const REAL_BUILDER = "/theme/new/restaurant"

type Values = Record<string, string>
type MenuCat = { id: string; name: string; items: { id: string; name: string; price: string }[] }
type Hours = typeof DEFAULT_HOURS

let seq = 0
const uid = () => "r" + ++seq

export default function BuildFormView() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [step, setStep] = useState(0)
  /* Which steps the reader has left, so a required field only turns red once
     they have actually been past it. A form that shouts before you have typed
     anything is a form that reads as broken. */
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]))
  /* Which fields the reader has actually left. A required field only goes red
     once they have been in and out of it — a form that shouts before you have
     typed anything reads as broken rather than as helpful. */
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [values, setValues] = useState<Values>({})
  const [kind, setKind] = useState("")
  const [preset, setPreset] = useState("")
  const [hours, setHours] = useState<Hours>(() => DEFAULT_HOURS.map((h) => ({ ...h })))
  const [cats, setCats] = useState<MenuCat[]>(() => [
    { id: uid(), name: "", items: [{ id: uid(), name: "", price: "" }] },
  ])
  const [shots, setShots] = useState<Record<string, string[]>>({ gallery: [], dishes: [] })
  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [onDark, setOnDark] = useState(false)

  const spec = STEPS[step]

  const set = useCallback((k: string, v: string) => setValues((p) => ({ ...p, [k]: v })), [])

  /* ---- progress -------------------------------------------------------
     Counted over the REQUIRED fields only. Counting every optional field
     would mean a form that is honestly finished still reads as 60% done,
     which is a progress bar that lies to make itself look busy. */
  const required = useMemo(() => ALL_FIELDS.filter((f) => f.required), [])
  const doneCount = required.filter((f) => (values[f.key] ?? "").trim()).length
  const pct = Math.round((doneCount / required.length) * 100)

  /* Named items across every menu category, which is what "حتى صنف واحد
     يكفي" actually asks for. Declared here because the step status below
     needs it. */
  const menuItems = cats.reduce((n, c) => n + c.items.filter((i) => i.name.trim()).length, 0)

  /**
   * ONE ANSWER PER STEP, FOR BOTH THE RAIL AND THE BAR.
   *
   * These were two separate rules and they disagreed: the tick counted only
   * required FIELDS, so a step whose whole content is a widget — the style
   * presets, the menu — came back complete while it was empty. The rail put a
   * tick on القائمة with nothing in it, and the bar said "لا ينقص شيء" on the
   * style step before a preset had been chosen. A form that reports itself
   * finished when it is not is worse than one that says nothing.
   */
  const stepStatus = useCallback(
    (i: number): { complete: boolean; note: string } => {
      const s = STEPS[i]
      const missing = (s.fields ?? []).filter((f) => f.required && !(values[f.key] ?? "").trim())
      if (missing.length) return { complete: false, note: "ينقص " + missing.length + " من الحقول المطلوبة" }
      if (s.widget === "presets" && !preset) return { complete: false, note: "اختر نمطًا للمتابعة." }
      if (s.widget === "menu" && menuItems === 0) return { complete: false, note: "أضف صنفًا واحدًا على الأقل." }
      if (s.widget === "review") return { complete: true, note: "راجع ما فوق، ثم ابدأ." }
      if (s.optional) return { complete: true, note: "هذه الخطوة اختيارية بالكامل." }
      return { complete: true, note: "لا ينقص شيء في هذه الخطوة." }
    },
    [values, preset, menuItems]
  )

  /* The header takes the ground it is standing on. Same mechanic as the
     sibling pages: the band is the strip the pill occupies, in CSS pixels.
     The root ZoomLock writes CSS zoom, so a rect and rootMargin are in the
     same space — do not divide by the zoom. */
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
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zb-pill, .zb-phone-pill"))
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

  /* Arrival, and the stagger on every step change. The hidden half lives
     under .zb-js, which the script adds on mount, so a browser that never
     runs it reads a finished form. */
  useEffect(() => {
    rootRef.current?.classList.add("zb-js")
  }, [])

  /* Moving between steps scrolls the stage back under the header rather than
     leaving the reader halfway down a step they have not read. Not on first
     paint: an unprompted scroll on load is the tell of a page fighting you. */
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const el = stageRef.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const y = el.getBoundingClientRect().top + window.scrollY - 116
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" })
  }, [step])

  const go = (i: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i))
    setVisited((p) => new Set(p).add(n))
    setStep(n)
  }

  const field = (f: FieldSpec) => {
    const v = values[f.key] ?? ""
    const bad = f.required && visited.has(step) && !v.trim() && touched.has(f.key)
    return (
      <label
        key={f.key}
        className={"zb-f" + (f.wide ? " wide" : "") + (f.area ? " area" : "")}
        data-bad={bad ? "true" : undefined}
      >
        <span className="zb-lab">
          {f.label}
          {f.required ? <b className="zb-req" aria-hidden> *</b> : null}
        </span>
        {f.area ? (
          <textarea
            className="zb-in"
            value={v}
            rows={f.key === "story_brief" || f.key === "press_outlets" ? 4 : 3}
            dir={f.ltr ? "ltr" : "rtl"}
            placeholder={f.ph}
            onChange={(e) => set(f.key, e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add(f.key))}
            required={f.required}
          />
        ) : (
          <input
            className="zb-in"
            value={v}
            dir={f.ltr ? "ltr" : "rtl"}
            placeholder={f.ph}
            onChange={(e) => set(f.key, e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add(f.key))}
            required={f.required}
          />
        )}
        {bad ? <span className="zb-err">هذا الحقل مطلوب</span> : null}
      </label>
    )
  }

  /* ---- the purpose-built steps ---------------------------------------- */

  const chips = (
    <div className="zb-block">
      <p className="zb-block-h">
        ما نوع المكان؟ <span className="zb-opt">· اختياري</span>
      </p>
      <div className="zb-chips">
        {PLACE_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className="zb-chip"
            data-on={kind === k.id ? "true" : undefined}
            aria-pressed={kind === k.id}
            onClick={() => setKind(kind === k.id ? "" : k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <p className="zb-hint">
        يساعد الذكاء الاصطناعي على كتابة نصوص تناسب أجواء مكانك. تخطَّ إن لم يناسبك شيء.
      </p>
    </div>
  )

  const presets = (
    <div className="zb-presets">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="zb-preset"
          data-on={preset === p.id ? "true" : undefined}
          aria-pressed={preset === p.id}
          onClick={() => setPreset(p.id)}
          style={{ background: p.colors.background, color: p.colors.text, borderColor: preset === p.id ? p.colors.text : p.colors.border }}
        >
          <span className="zb-sw">
            <em style={{ background: p.colors.primary }} />
            <em style={{ background: p.colors.accent }} />
            <em style={{ background: p.colors.surface, borderColor: p.colors.border }} />
          </span>
          {/* The three lines are Latin inside an RTL card, so they carry their
              own direction rather than inheriting the page's. */}
          <span className="zb-preset-name" dir="ltr" style={{ fontFamily: p.heading_font }}>{p.name}</span>
          <span className="zb-preset-vibe" dir="ltr" style={{ color: p.colors.accent }}>{p.vibe}</span>
          <span className="zb-preset-desc" dir="ltr" style={{ color: p.colors.muted }}>{p.description}</span>
          {preset === p.id ? <span className="zb-preset-on"><Check size={13} strokeWidth={2.5} /> محدّد</span> : null}
        </button>
      ))}
    </div>
  )

  const hoursBlock = (
    <div className="zb-block">
      <p className="zb-block-h">ساعات العمل</p>
      <div className="zb-hours">
        {hours.map((h, i) => (
          <div key={h.day} className="zb-hrow" data-closed={h.closed ? "true" : undefined}>
            <span className="zb-hday">{h.label}</span>
            <input
              className="zb-in zb-htime" dir="rtl" value={h.open} placeholder="5:30 م" aria-label={"وقت الفتح — " + h.label}
              disabled={h.closed}
              onChange={(e) => setHours((p) => p.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))}
            />
            <span className="zb-hsep" aria-hidden>—</span>
            <input
              className="zb-in zb-htime" dir="rtl" value={h.close} placeholder="11:00 م" aria-label={"وقت الإغلاق — " + h.label}
              disabled={h.closed}
              onChange={(e) => setHours((p) => p.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))}
            />
            <button
              type="button" className="zb-hclosed" data-on={h.closed ? "true" : undefined} aria-pressed={h.closed}
              onClick={() => setHours((p) => p.map((x, j) => (j === i ? { ...x, closed: !x.closed } : x)))}
            >
              مغلق
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const menu = (
    <div className="zb-block">
      {cats.map((c, ci) => (
        <div key={c.id} className="zb-cat">
          <div className="zb-cat-head">
            <input
              className="zb-in zb-cat-name" value={c.name} placeholder="المقبّلات"
              aria-label={"اسم القسم " + (ci + 1)}
              onChange={(e) => setCats((p) => p.map((x, j) => (j === ci ? { ...x, name: e.target.value } : x)))}
            />
            {cats.length > 1 ? (
              <button type="button" className="zb-icon" aria-label={"حذف القسم " + (ci + 1)}
                onClick={() => setCats((p) => p.filter((_, j) => j !== ci))}>
                <Trash2 size={15} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
          <div className="zb-items">
            {c.items.map((it, ii) => (
              <div key={it.id} className="zb-item">
                <input
                  className="zb-in" value={it.name} placeholder="حمّص بالصنوبر" aria-label={"اسم الصنف " + (ii + 1)}
                  onChange={(e) => setCats((p) => p.map((x, j) => j === ci
                    ? { ...x, items: x.items.map((y, k) => (k === ii ? { ...y, name: e.target.value } : y)) } : x))}
                />
                <input
                  className="zb-in zb-price" value={it.price} placeholder="٨٫٠٠" dir="ltr" aria-label={"سعر الصنف " + (ii + 1)}
                  onChange={(e) => setCats((p) => p.map((x, j) => j === ci
                    ? { ...x, items: x.items.map((y, k) => (k === ii ? { ...y, price: e.target.value } : y)) } : x))}
                />
                {c.items.length > 1 ? (
                  <button type="button" className="zb-icon" aria-label={"حذف الصنف " + (ii + 1)}
                    onClick={() => setCats((p) => p.map((x, j) => j === ci
                      ? { ...x, items: x.items.filter((_, k) => k !== ii) } : x))}>
                    <Trash2 size={15} strokeWidth={1.75} />
                  </button>
                ) : <span aria-hidden />}
              </div>
            ))}
          </div>
          <button type="button" className="zb-add"
            onClick={() => setCats((p) => p.map((x, j) => j === ci
              ? { ...x, items: [...x.items, { id: uid(), name: "", price: "" }] } : x))}>
            <Plus size={14} strokeWidth={2} /> صنف آخر
          </button>
        </div>
      ))}
      <button type="button" className="zb-add zb-add-cat"
        onClick={() => setCats((p) => [...p, { id: uid(), name: "", items: [{ id: uid(), name: "", price: "" }] }])}>
        <Plus size={14} strokeWidth={2} /> قسم آخر
      </button>
    </div>
  )

  /* Local previews only. Nothing is uploaded anywhere: object URLs live in the
     reader's own tab and are revoked when a shot is removed. */
  const takeFiles = (key: string, max: number, files: FileList | null) => {
    if (!files) return
    const room = max - (shots[key]?.length ?? 0)
    const next = Array.from(files).slice(0, Math.max(0, room)).map((f) => URL.createObjectURL(f))
    if (next.length) setShots((p) => ({ ...p, [key]: [...(p[key] ?? []), ...next] }))
  }

  const uploads = (
    <div className="zb-block">
      {UPLOADS.map((u) => (
        <div key={u.key} className="zb-up">
          <p className="zb-block-h">
            {u.label} <span className="zb-opt">· {(shots[u.key]?.length ?? 0)}/{u.max}</span>
          </p>
          <div className="zb-shots">
            {(shots[u.key] ?? []).map((src) => (
              <span key={src} className="zb-shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <button type="button" className="zb-shot-x" aria-label="إزالة الصورة"
                  onClick={() => setShots((p) => {
                    URL.revokeObjectURL(src)
                    return { ...p, [u.key]: (p[u.key] ?? []).filter((s) => s !== src) }
                  })}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))}
            {(shots[u.key]?.length ?? 0) < u.max ? (
              <label className="zb-drop">
                <input type="file" accept="image/*" multiple
                  onChange={(e) => { takeFiles(u.key, u.max, e.target.files); e.target.value = "" }} />
                <Plus size={16} strokeWidth={2} />
                <span>أضف صورة</span>
              </label>
            ) : null}
          </div>
        </div>
      ))}
      <p className="zb-hint">
        الصور تبقى في متصفحك على هذه الصفحة — لا تُرفع إلى أي مكان. الرفع الحقيقي يتم داخل المنشئ.
      </p>
    </div>
  )

  const filled = ALL_FIELDS.filter((f) => (values[f.key] ?? "").trim())
  const chosenPreset = PRESETS.find((p) => p.id === preset)

  const review = (
    <div className="zb-block">
      <div className="zb-sum">
        <div className="zb-sum-row"><dt>حقول مملوءة</dt><dd>{filled.length} من {ALL_FIELDS.length}</dd></div>
        <div className="zb-sum-row"><dt>النمط</dt><dd>{chosenPreset ? chosenPreset.name : "لم يُختر بعد"}</dd></div>
        <div className="zb-sum-row"><dt>نوع المكان</dt><dd>{PLACE_KINDS.find((k) => k.id === kind)?.label ?? "—"}</dd></div>
        <div className="zb-sum-row"><dt>أصناف القائمة</dt><dd>{menuItems}</dd></div>
        <div className="zb-sum-row"><dt>أيام مفتوحة</dt><dd>{hours.filter((h) => !h.closed).length} من 7</dd></div>
        <div className="zb-sum-row"><dt>الصور</dt><dd>{(shots.gallery?.length ?? 0) + (shots.dishes?.length ?? 0)}</dd></div>
      </div>

      {filled.length ? (
        <dl className="zb-recap">
          {filled.map((f) => (
            <div key={f.key} className="zb-recap-row">
              <dt>{f.label}</dt>
              <dd>{values[f.key]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="zb-hint">لم تملأ شيئًا بعد. ارجع خطوة وابدأ بالأساسيات.</p>
      )}

      {/* The honest edge of this page, said once and in place. */}
      <div className="zb-handoff">
        <p className="zb-handoff-h">هذه الصفحة نموذج تصميم، ولا تولّد موقعًا.</p>
        <p className="zb-handoff-b">
          التوليد يحتاج حسابًا ويتم داخل المنشئ الحقيقي — نحو 20 إلى 40 ثانية، ثم تنتقل إلى معاينتك الحيّة.
        </p>
      </div>
    </div>
  )

  const widget =
    spec.widget === "chips" ? chips
    : spec.widget === "presets" ? presets
    : spec.widget === "hours" ? hoursBlock
    : spec.widget === "menu" ? menu
    : spec.widget === "uploads" ? uploads
    : spec.widget === "review" ? review
    : null

  const last = step === STEPS.length - 1

  return (
    <main className={"zb-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header
        ref={headRef}
        className={"zb-head " + plex.className}
        data-dark={onDark ? "true" : undefined}
      >
        <div className="zb-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
          <div className="zb-phone-bar">
            <button type="button" className="zb-round" aria-expanded={menuOpen} aria-controls="zb-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/demo/home" aria-label="زينيا" className="zb-phone-mark"><ZenyaMark className="zb-mark-svg-sm" /></Link>
            <Link href="/login?mode=signup" className="zb-account zb-account-phone">ابدأ</Link>
          </div>
          <div className="zb-drawer" data-open={menuOpen ? "true" : undefined}
            style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", visibility: menuOpen ? "visible" : "hidden" }}>
            <div className="zb-drawer-clip">
              <nav id="zb-phone-menu" className="zb-phone-menu">
                {NAV.map((i) => (
                  <Link key={i.href} href={i.href} className="zb-tray-row" onClick={() => setMenuOpen(false)}>{i.label}</Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="zb-pill">
          <div className="zb-bar">
            <span className="zb-side zb-side-start">
              <Link href="/demo/home" className="zb-mark" aria-label="زينيا"><ZenyaMark className="zb-mark-svg" /></Link>
            </span>
            <nav className="zb-nav">
              {NAV.map((i) => (
                <Link key={i.href} href={i.href} className="zb-nav-item" data-current={i.current ? "true" : undefined}>{i.label}</Link>
              ))}
            </nav>
            <span className="zb-side zb-side-end">
              <span className="zb-sep" aria-hidden />
              <Link href="/login?mode=signup" className="zb-account">ابدأ</Link>
            </span>
          </div>
        </div>
      </header>

      <div className="zb-lede">
        <p className="zb-eyebrow">موقع مطعم</p>
        <h1 className="zb-h1">املأ ما تعرفه.<br />الذكاء الاصطناعي يكتب الباقي.</h1>
        {/* No literal step count here. It said "ثمانية" while the rail showed
            nine, because the review step was added after the sentence was
            written. The two numbers that remain are both computed. */}
        <p className="zb-sub">
          خطوات قصيرة، ولا واحدة منها طويلة. المطلوب {required.length} حقول فقط من أصل {ALL_FIELDS.length} — وكل ما عداها اختياري.
        </p>
      </div>

      <div className="zb-shell" ref={stageRef}>
        {/* ---- the rail: where you are, and what is left ---------------- */}
        <aside className="zb-rail" aria-label="خطوات النموذج">
          <div className="zb-meter">
            <div className="zb-meter-top">
              <span className="zb-meter-n">{pct}<i>%</i></span>
              <span className="zb-meter-l">من الحقول المطلوبة</span>
            </div>
            <div className="zb-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
              aria-label="نسبة اكتمال الحقول المطلوبة">
              <span className="zb-fill" style={{ transform: "scaleX(" + pct / 100 + ")" }} />
            </div>
          </div>

          <ol className="zb-steps">
            {STEPS.map((s, i) => {
              const done = i !== step && visited.has(i) && stepStatus(i).complete
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="zb-step"
                    data-on={i === step ? "true" : undefined}
                    data-done={done ? "true" : undefined}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => go(i)}
                  >
                    <span className="zb-step-n" aria-hidden>
                      {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="zb-step-t">{s.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>

        {/* ---- the stage: one step ------------------------------------- */}
        <section className="zb-stage" aria-live="polite">
          {/* key on the step id is what makes the arrival re-run: React
              replaces the node rather than updating it, so the animation
              starts again instead of being a no-op on a live element. */}
          <div className="zb-card" key={spec.id}>
            <div className="zb-card-head">
              <p className="zb-count">خطوة {step + 1} من {STEPS.length}</p>
              <h2 className="zb-h2">{spec.title}</h2>
              <p className="zb-h2-sub">{spec.sub}</p>
            </div>

            <div className="zb-body">
              {spec.fields?.length ? (
                <div className="zb-grid">
                  {spec.fields.map((f, i) => (
                    <div key={f.key} className={"zb-cell" + (f.wide ? " wide" : "")} style={{ ["--i" as string]: String(i) }}>
                      {field(f)}
                    </div>
                  ))}
                </div>
              ) : null}
              {widget ? (
                <div className="zb-cell" style={{ ["--i" as string]: String(spec.fields?.length ?? 0) }}>
                  {widget}
                </div>
              ) : null}
            </div>
          </div>

          <div className="zb-nav-bar">
            <button type="button" className="zb-back" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
              السابق
            </button>

            <p className="zb-nav-note" data-warn={stepStatus(step).complete ? undefined : "true"}>
              {stepStatus(step).note}
            </p>

            {last ? (
              <span className="zb-go">
                <SlideButton href={REAL_BUILDER} variant="violet" slide="إلى المنشئ">
                  ابدأ التوليد
                </SlideButton>
              </span>
            ) : (
              <button type="button" className="zb-next" onClick={() => go(step + 1)}>
                التالي
                <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>
        </section>
      </div>

      <PricingFooter />
    </main>
  )
}

/* ---------------------------------------------------------------------------
   No backticks inside this literal: one would end it.
--------------------------------------------------------------------------- */
const CSS = `
.zb-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  --stone: #56565a;
  --violet: #5e6ad2;
  --violet-lift: #97a0ee;
  --onyx: #131316;
  --gut: clamp(1rem, 4vw, 3rem);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --r-panel: 28px;
  --r-card: 16px;
  --r-control: 10px;
  --page: 1180px;

  position: relative;
  min-height: 100%;
  background: var(--ground);
  color: var(--obsidian);
  padding: 0 var(--gut) 0;
  letter-spacing: 0;
}
.zb-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* ---- header, the candidate set's ---------------------------------------- */
.zb-head { position: sticky; top: 0; z-index: 50; display: flex; justify-content: center; padding: 2rem 0 0; pointer-events: none; }
.zb-pill, .zb-phone-pill { pointer-events: auto; }
.zb-phone-pill {
  width: fit-content; max-width: 100%; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: min-width 380ms var(--ease-out) 220ms, background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
}
.zb-phone-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.375rem; height: 44px; padding-inline: 0.375rem; }
.zb-phone-mark { display: flex; align-items: center; justify-self: center; padding-inline: 0.375rem; }
.zb-mark-svg-sm { height: 16px; color: #000; }
.zb-round { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
.zb-round:hover { background: rgba(0,0,0,0.05); }
.zb-account-phone { justify-self: end; }
.zb-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
@media (min-width: 768px) { .zb-phone-pill { display: none; } }
@media (max-width: 767px) { .zb-pill { display: none; } }
.zb-pill {
  border-radius: 24px; overflow: hidden; width: 380px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
  contain: layout paint;
}
@media (prefers-reduced-transparency: reduce) { .zb-pill, .zb-phone-pill { background: #f2f2f5; -webkit-backdrop-filter: none; backdrop-filter: none; } }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .zb-pill, .zb-phone-pill { background: #f2f2f5; } }
.zb-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.zb-side { display: flex; align-items: center; min-width: 0; }
.zb-side-start { justify-content: flex-start; }
.zb-side-end { justify-content: flex-end; }
.zb-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.zb-mark-svg { height: 17px; color: #000; }
.zb-head[data-dark] .zb-pill, .zb-head[data-dark] .zb-phone-pill {
  background: rgba(32,32,38,0.72);
  box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5);
}
.zb-head[data-dark] .zb-mark-svg, .zb-head[data-dark] .zb-mark-svg-sm { color: #fafafa; }
.zb-head[data-dark] .zb-nav-item, .zb-head[data-dark] .zb-tray-row, .zb-head[data-dark] .zb-round { color: rgba(250,250,250,0.66); }
.zb-head[data-dark] .zb-nav-item:hover, .zb-head[data-dark] .zb-tray-row:hover { color: #fafafa; }
.zb-head[data-dark] .zb-sep { background: rgba(250,250,250,0.16); }
.zb-head[data-dark] .zb-account { background: #fafafa; color: #171717; }
.zb-nav { display: flex; align-items: center; gap: 0.125rem; }
.zb-nav-item { border-radius: 999px; padding: 0.625rem 0.75rem; font-size: 14px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.zb-nav-item:hover, .zb-nav-item[data-current] { color: var(--obsidian); }
.zb-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); transition: background-color 520ms var(--ease-out); }
.zb-account { border-radius: 999px; padding: 0.5rem 1rem; font-size: 14px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out), background-color 520ms var(--ease-out), color 520ms var(--ease-out); }
.zb-account:hover { opacity: 0.86; }
.zb-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.zb-drawer[data-open] { transition-delay: 0s, 0s; }
.zb-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zb-tray-row { display: block; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 13.5px; line-height: 1.24; text-decoration: none; color: #666; }
.zb-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

/* ---- lede ---------------------------------------------------------------- */
.zb-lede { max-width: var(--page); margin: clamp(2.5rem, 6vw, 4rem) auto clamp(2rem, 4vw, 3rem); }
.zb-eyebrow { margin: 0 0 0.75rem; font-size: 11.5px; font-weight: 700; line-height: 1.5; letter-spacing: 0.06em; color: var(--violet); }
.zb-h1 { margin: 0; font-size: clamp(28px, 4vw, 46px); font-weight: 900; line-height: 1.3; color: var(--obsidian); }
.zb-sub { margin: 1.125rem 0 0; max-width: 44ch; font-size: 15.5px; font-weight: 500; line-height: 1.9; color: var(--stone); }

/* ---- shell: rail + stage ------------------------------------------------- */
.zb-shell {
  display: grid; grid-template-columns: 248px minmax(0, 1fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  max-width: var(--page); margin: 0 auto clamp(3.5rem, 8vw, 6rem);
  align-items: start;
}

/* The rail sticks under the header, so the step you are on and the ones left
   stay in view through a long step. 116px is the header's own strip plus its
   ring, measured, not guessed. */
.zb-rail { position: sticky; top: 116px; display: flex; flex-direction: column; gap: 1.25rem; }
.zb-meter {
  border-radius: var(--r-card); background: var(--card); padding: 1rem 1.125rem 1.125rem;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.zb-meter-top { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem; }
.zb-meter-n { font-size: 28px; font-weight: 900; line-height: 1.24; color: var(--obsidian); font-variant-numeric: tabular-nums; }
.zb-meter-n i { font-style: normal; font-size: 15px; margin-inline-start: 1px; color: var(--stone); }
.zb-meter-l { font-size: 12px; font-weight: 500; line-height: 1.5; color: var(--stone); }
.zb-track { height: 5px; border-radius: 999px; background: rgba(17,17,17,0.07); overflow: hidden; }
.zb-fill {
  display: block; height: 100%; border-radius: 999px; background: var(--violet);
  transform-origin: right center;
  transition: transform 620ms var(--ease-out);
}
@media (prefers-reduced-motion: reduce) { .zb-fill { transition: none; } }

.zb-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.zb-step {
  width: 100%; display: flex; align-items: center; gap: 0.625rem;
  border: 0; background: transparent; cursor: pointer; text-align: start;
  border-radius: var(--r-control); padding: 0.5rem 0.625rem;
  font: inherit; font-size: 13.5px; font-weight: 500; line-height: 1.5; color: var(--stone);
  transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out);
}
.zb-step:hover { background: rgba(17,17,17,0.04); color: var(--obsidian); }
.zb-step[data-on] { background: rgba(94,106,210,0.09); color: var(--obsidian); font-weight: 700; }
.zb-step-n {
  flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
  width: 21px; height: 21px; border-radius: 999px;
  font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums;
  background: rgba(17,17,17,0.06); color: var(--stone);
  transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out);
}
.zb-step[data-on] .zb-step-n { background: var(--violet); color: #fff; }
.zb-step[data-done] .zb-step-n { background: rgba(94,106,210,0.16); color: var(--violet); }
.zb-step-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---- the stage ----------------------------------------------------------- */
.zb-card {
  border-radius: var(--r-panel); background: var(--card);
  padding: clamp(1.5rem, 3vw, 2.25rem);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.zb-card-head { margin-bottom: clamp(1.5rem, 3vw, 2rem); }
.zb-count { margin: 0 0 0.5rem; font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; line-height: 1.5; color: var(--violet); }
.zb-h2 { margin: 0; font-size: clamp(21px, 2.4vw, 27px); font-weight: 900; line-height: 1.36; color: var(--obsidian); }
.zb-h2-sub { margin: 0.625rem 0 0; max-width: 56ch; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone); }
.zb-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.125rem; }
.zb-cell.wide, .zb-body > .zb-cell { grid-column: 1 / -1; }
.zb-body > .zb-cell { margin-top: 1.5rem; }
.zb-body > .zb-cell:only-child { margin-top: 0; }

/* ---- fields -------------------------------------------------------------- */
.zb-f { display: flex; flex-direction: column; gap: 0.4375rem; }
.zb-lab { font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zb-req { color: var(--violet); font-weight: 700; }
.zb-in {
  width: 100%; border: 0; border-radius: var(--r-control);
  padding: 0.6875rem 0.875rem;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.7; letter-spacing: 0;
  color: var(--obsidian); background: #f4f4f6;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zb-in::placeholder { color: #9a9aa2; }
.zb-in:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
/* The violet says "you are here", which is the one thing an accent on a form
   is genuinely for. */
.zb-in:focus {
  outline: none; background: #fff;
  box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15);
}
.zb-in:disabled { opacity: 0.45; cursor: not-allowed; }
textarea.zb-in { resize: vertical; min-height: 84px; }
.zb-f[data-bad] .zb-in { box-shadow: 0 0 0 1px #c2410c, 0 0 0 4px rgba(194,65,12,0.12); }
.zb-err { font-size: 12px; font-weight: 500; line-height: 1.5; color: #c2410c; }

/* ---- blocks -------------------------------------------------------------- */
.zb-block { display: flex; flex-direction: column; gap: 0.75rem; }
.zb-block-h { margin: 0; font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; line-height: 1.5; color: var(--stone); }
.zb-opt { color: #9a9aa2; font-weight: 500; letter-spacing: 0; }
.zb-hint { margin: 0; font-size: 12.5px; font-weight: 500; line-height: 1.75; color: var(--stone); }

.zb-chips { display: flex; flex-wrap: wrap; gap: 0.4375rem; }
.zb-chip {
  border: 0; cursor: pointer; font: inherit;
  border-radius: 999px; padding: 0.4375rem 0.875rem;
  font-size: 12.5px; font-weight: 500; line-height: 1.4; color: var(--obsidian);
  background: #f4f4f6; box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: background-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), color 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.zb-chip:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.22); }
.zb-chip[data-on] { background: var(--violet); color: #fff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15); }
@media (prefers-reduced-motion: no-preference) { .zb-chip:active { transform: scale(0.96); } }

.zb-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.875rem; }
.zb-preset {
  position: relative; cursor: pointer; font: inherit; text-align: start;
  display: flex; flex-direction: column; gap: 0.3125rem;
  border-radius: var(--r-card); border: 2px solid; padding: 1rem;
  transition: transform 240ms var(--ease-out), box-shadow 240ms var(--ease-out);
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) { .zb-preset:hover { transform: translateY(-2px); } }
.zb-preset[data-on] { box-shadow: 0 0 0 4px rgba(94,106,210,0.22); }
.zb-sw { display: flex; gap: 0.375rem; margin-bottom: 0.5rem; }
.zb-sw em { width: 22px; height: 22px; border-radius: 999px; border: 1px solid transparent; }
.zb-preset-name { font-size: 16px; font-weight: 700; line-height: 1.4; }
.zb-preset-vibe { font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; line-height: 1.5; text-transform: uppercase; }
.zb-preset-desc { font-size: 12px; font-weight: 500; line-height: 1.6; }
.zb-preset-on {
  position: absolute; inset-block-start: 0.75rem; inset-inline-start: 0.75rem;
  display: inline-flex; align-items: center; gap: 0.25rem;
  border-radius: 999px; padding: 0.25rem 0.5rem;
  font-size: 11px; font-weight: 700; line-height: 1.3;
  background: var(--violet); color: #fff;
}

/* hours */
.zb-hours { display: flex; flex-direction: column; gap: 0.4375rem; }
.zb-hrow { display: grid; grid-template-columns: 5.5rem minmax(0,1fr) auto minmax(0,1fr) auto; align-items: center; gap: 0.5rem; }
.zb-hday { font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zb-htime { padding: 0.5rem 0.625rem; font-size: 13.5px; }
.zb-hsep { color: #b4b4bb; font-size: 12px; }
.zb-hrow[data-closed] .zb-hday { color: var(--stone); }
.zb-hclosed {
  border: 0; cursor: pointer; font: inherit; border-radius: 999px;
  padding: 0.375rem 0.75rem; font-size: 12px; font-weight: 700; line-height: 1.4;
  background: #f4f4f6; color: var(--stone); box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out);
}
.zb-hclosed[data-on] { background: var(--obsidian); color: var(--ground); box-shadow: none; }

/* menu */
.zb-cat { display: flex; flex-direction: column; gap: 0.625rem; padding: 1rem; border-radius: var(--r-card); background: #f7f7f9; box-shadow: 0 0 0 1px rgba(17,17,17,0.07); }
.zb-cat + .zb-cat { margin-top: 0.75rem; }
.zb-cat-head { display: flex; align-items: center; gap: 0.5rem; }
.zb-cat-name { font-weight: 700; }
.zb-items { display: flex; flex-direction: column; gap: 0.5rem; }
.zb-item { display: grid; grid-template-columns: minmax(0,1fr) 7rem auto; gap: 0.5rem; align-items: center; }
.zb-price { text-align: start; }
.zb-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0; border: 0; cursor: pointer;
  border-radius: var(--r-control); background: transparent; color: var(--stone);
  transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out);
}
.zb-icon:hover { background: rgba(194,65,12,0.10); color: #c2410c; }
.zb-add {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 0.375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: 999px; padding: 0.4375rem 0.875rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.4;
  color: var(--violet); background: rgba(94,106,210,0.10);
  transition: background-color 180ms var(--ease-out);
}
.zb-add:hover { background: rgba(94,106,210,0.18); }
.zb-add-cat { margin-top: 0.75rem; }

/* uploads */
.zb-up + .zb-up { margin-top: 1.25rem; }
.zb-shots { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.zb-shot { position: relative; width: 84px; height: 84px; border-radius: var(--r-control); overflow: hidden; background: var(--onyx); }
.zb-shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
.zb-shot-x {
  position: absolute; inset-block-start: 4px; inset-inline-start: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: 0; cursor: pointer; border-radius: 999px;
  background: rgba(19,19,22,0.72); color: #fff;
}
.zb-drop {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem;
  width: 84px; height: 84px; cursor: pointer; border-radius: var(--r-control);
  color: var(--stone); background: #f4f4f6;
  box-shadow: inset 0 0 0 1px rgba(17,17,17,0.12);
  font-size: 11px; font-weight: 700; line-height: 1.3;
  transition: box-shadow 180ms var(--ease-out), color 180ms var(--ease-out), background-color 180ms var(--ease-out);
}
.zb-drop:hover { color: var(--violet); background: rgba(94,106,210,0.07); box-shadow: inset 0 0 0 1px rgba(94,106,210,0.45); }
.zb-drop input { display: none; }

/* review */
.zb-sum { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 0.75rem; }
.zb-sum-row { border-radius: var(--r-control); background: #f7f7f9; padding: 0.75rem 0.875rem; box-shadow: 0 0 0 1px rgba(17,17,17,0.07); }
.zb-sum-row dt { font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; line-height: 1.5; color: var(--stone); }
.zb-sum-row dd { margin: 0.25rem 0 0; font-size: 16px; font-weight: 900; line-height: 1.4; color: var(--obsidian); }
.zb-recap { margin: 1.25rem 0 0; display: flex; flex-direction: column; gap: 0.625rem; }
.zb-recap-row { display: grid; grid-template-columns: 10rem minmax(0,1fr); gap: 0.75rem; align-items: baseline; }
.zb-recap-row dt { font-size: 12.5px; font-weight: 700; line-height: 1.6; color: var(--stone); }
.zb-recap-row dd { margin: 0; font-size: 14px; font-weight: 500; line-height: 1.7; color: var(--obsidian); white-space: pre-wrap; }
.zb-handoff { margin-top: 1.5rem; border-radius: var(--r-card); background: var(--onyx); padding: 1.125rem 1.25rem; }
.zb-handoff-h { margin: 0; font-size: 14px; font-weight: 900; line-height: 1.6; color: var(--violet-lift); }
.zb-handoff-b { margin: 0.375rem 0 0; font-size: 13px; font-weight: 500; line-height: 1.8; color: #a8a8b2; }

/* ---- the bar ------------------------------------------------------------- */
.zb-nav-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  margin-top: 1.125rem;
}
.zb-nav-note { margin: 0; flex: 1 1 auto; text-align: center; font-size: 12.5px; font-weight: 500; line-height: 1.6; color: var(--stone); transition: color 200ms var(--ease-out); }
.zb-nav-note[data-warn] { color: var(--violet); font-weight: 700; }
.zb-back, .zb-next {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: var(--r-control); padding: 0.625rem 1.125rem;
  font-size: 14px; font-weight: 700; line-height: 1.4;
  transition: background-color 180ms var(--ease-out), opacity 180ms var(--ease-out), box-shadow 180ms var(--ease-out);
}
.zb-back { background: #f0f0f3; color: var(--obsidian); box-shadow: 0 0 0 1px rgba(17,17,17,0.10); }
.zb-back:hover:not(:disabled) { background: #e8e8ec; }
.zb-back:disabled { opacity: 0.4; cursor: not-allowed; }
/* The primary action is violet on EVERY step, not obsidian until the last
   one. A form has exactly one thing you are meant to press at any moment, and
   the accent naming it the whole way through is what makes the last step's
   call to action read as the same gesture rather than a new one. */
.zb-next { background: var(--violet); color: #fff; box-shadow: 0 1px 2px rgba(94,106,210,0.30); }
.zb-next:hover { background: #5561c8; }
.zb-next:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; }
.zb-back:focus-visible, .zb-step:focus-visible, .zb-chip:focus-visible,
.zb-preset:focus-visible, .zb-add:focus-visible, .zb-hclosed:focus-visible,
.zb-icon:focus-visible, .zb-drop:focus-within {
  outline: 2px solid var(--violet); outline-offset: 3px;
}
.zb-go { flex: 0 0 auto; width: 12.5rem; }

/* ---- arrival ------------------------------------------------------------
   Under .zb-js only, so a browser that never runs the script reads a
   finished form. A card that rests invisible has shipped on this codebase
   twice; it does not get to happen a third time.
------------------------------------------------------------------------- */
.zb-js .zb-card { animation: zb-rise 460ms var(--ease-out) both; }
.zb-js .zb-cell { animation: zb-rise 420ms var(--ease-out) both; animation-delay: calc(90ms + var(--i, 0) * 55ms); }
@keyframes zb-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .zb-js .zb-card, .zb-js .zb-cell { animation: none; }
}

/* ---- narrow -------------------------------------------------------------- */
@media (max-width: 900px) {
  .zb-shell { grid-template-columns: minmax(0, 1fr); }
  /* The rail stops sticking and becomes a strip: at this width it would eat
     a third of a short viewport and push the step off the screen. */
  .zb-rail { position: static; }
  .zb-steps { flex-direction: row; overflow-x: auto; gap: 0.375rem; padding-bottom: 0.25rem; scrollbar-width: none; }
  .zb-steps::-webkit-scrollbar { display: none; }
  .zb-step { width: auto; white-space: nowrap; }
  .zb-step-t { max-width: 9rem; }
}
@media (max-width: 680px) {
  .zb-grid { grid-template-columns: minmax(0, 1fr); }
  .zb-presets { grid-template-columns: minmax(0, 1fr); }
  .zb-sum { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .zb-recap-row { grid-template-columns: minmax(0,1fr); gap: 0.125rem; }
  .zb-hrow { grid-template-columns: 4.5rem minmax(0,1fr) auto minmax(0,1fr); row-gap: 0.375rem; }
  .zb-hclosed { grid-column: 2 / -1; justify-self: start; }
  .zb-nav-note { order: 3; flex-basis: 100%; text-align: start; }
  .zb-go { width: 100%; }
}
@media (max-width: 480px) {
  .zb-item { grid-template-columns: minmax(0,1fr) 5.5rem auto; }
  .zb-sum { grid-template-columns: minmax(0,1fr); }
}
`
