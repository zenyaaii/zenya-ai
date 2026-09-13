"use client"

/**
 * The generator wizard: the /demo/build design, now the real builder.
 *
 * THE DEMO IS THE PRODUCT. The rail-and-stage form that was proposed at
 * /demo/build is what every wizard under app/(main)/theme/new renders now:
 * the steps on the start side with the progress meter, one step at a time on
 * the stage, and a bar underneath that never moves. The wizards keep their own
 * fields, validation and generation; this file only draws them.
 *
 * WHAT A WIZARD HANDS OVER. Its steps, each with a body, whether it is
 * optional, and whether it is complete; the progress over its required
 * fields; and its final action. The shell owns which steps were visited and
 * which were skipped, so the rail can say "skipped" rather than "done" - a
 * step nobody filled is not a finished step.
 *
 * CHROME. Inside the product the wizard sits under ProductShell, which already
 * draws the header pill, so the shell draws none. The public demo at
 * /demo/build has no shell around it and asks for the header and footer.
 *
 * THE VIOLET IS SPENT ON PROGRESS AND ON THE ACTION: the rail's fill, the
 * current step, a focused field's ring, a chosen chip, and the primary button.
 */

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import { ArrowLeft, ArrowRight, Check, Menu, Plus, SkipForward, Trash2, X } from "lucide-react"
import ZenyaMark from "@/components/ZenyaMark"
import AccountControl from "@/components/zenya/chrome/AccountControl"
import SlideButton from "@/components/ui/SlideButton"
import PricingFooter from "@/components/zenya/pricing/PricingFooter"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

export type WizardStep = {
  id: string
  title: string
  sub: string
  optional?: boolean
  complete: boolean
  /** What the bar says while the step is incomplete. */
  note?: string
  body: ReactNode
}

export type WizardFinal =
  | { label: string; slide?: string; href: string }
  | { label: string; slide?: string; onClick: () => void; busy?: boolean }

export default function WizardShell({
  eyebrow, title, sub, ledeExtra, steps, step, onStep, progress, final, notice, scrollKey, chrome = false,
}: {
  eyebrow: string
  title: ReactNode
  sub: ReactNode
  ledeExtra?: ReactNode
  steps: WizardStep[]
  step: number
  onStep: (i: number) => void
  progress: { pct: number; label?: string }
  final: WizardFinal
  /** A banner above the step card: a restored draft, a validation error. */
  notice?: ReactNode
  /** Change it to bring the stage back into view (e.g. after an error). */
  scrollKey?: string | number
  /** Draw the header and footer: only the public demo, which has no shell. */
  chrome?: boolean
}) {
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]))
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const rootRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const spec = steps[Math.min(step, steps.length - 1)]
  const last = step === steps.length - 1

  const go = (i: number) => {
    const n = Math.max(0, Math.min(steps.length - 1, i))
    setVisited((p) => new Set(p).add(n))
    onStep(n)
  }

  /* A jump from outside (a validation error sending the owner back) counts as
     a visit too, so the rail marks it. */
  useEffect(() => {
    setVisited((p) => (p.has(step) ? p : new Set(p).add(step)))
  }, [step])

  /* The hidden half of every arrival lives under .zb-js, so a browser that
     never runs the script reads a finished form. */
  useEffect(() => { rootRef.current?.classList.add("zb-js") }, [])

  const scrollToStage = () => {
    const el = stageRef.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const y = el.getBoundingClientRect().top + window.scrollY - 116
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" })
  }

  /* Moving between steps brings the stage back under the header. Not on first
     paint: an unprompted scroll on load is a page fighting you. */
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    scrollToStage()
  }, [step])

  useEffect(() => {
    if (scrollKey) scrollToStage()
  }, [scrollKey])

  const note = spec.complete
    ? spec.optional ? "هذه الخطوة اختيارية بالكامل."
      : last ? "راجع ما فوق، ثم ابدأ."
      : "لا ينقص شيء في هذه الخطوة."
    : spec.note || "أكمل الحقول المطلوبة في هذه الخطوة."

  return (
    <main className={"zb-root " + tajawal.className} dir="rtl" ref={rootRef} data-chrome={chrome ? "true" : undefined}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {chrome ? <DemoHeader rootRef={rootRef} /> : null}

      <div className="zb-lede">
        <p className="zb-eyebrow">{eyebrow}</p>
        <h1 className="zb-h1">{title}</h1>
        <p className="zb-sub">{sub}</p>
        {ledeExtra}
      </div>

      <div className="zb-shell" ref={stageRef}>
        {/* ---- the rail: where you are, and what is left ---------------- */}
        <aside className="zb-rail" aria-label="خطوات النموذج">
          <div className="zb-meter">
            <div className="zb-meter-top">
              <span className="zb-meter-n">{progress.pct}<i>%</i></span>
              <span className="zb-meter-l">{progress.label ?? "من الحقول المطلوبة"}</span>
            </div>
            <div className="zb-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}
              aria-label="نسبة اكتمال الحقول المطلوبة">
              <span className="zb-fill" style={{ transform: "scaleX(" + progress.pct / 100 + ")" }} />
            </div>
          </div>

          <ol className="zb-steps">
            {steps.map((s, i) => {
              const wasSkipped = skipped.has(i) && i !== step
              const done = i !== step && !wasSkipped && visited.has(i) && s.complete
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="zb-step"
                    data-on={i === step ? "true" : undefined}
                    data-done={done ? "true" : undefined}
                    data-skipped={wasSkipped ? "true" : undefined}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => go(i)}
                  >
                    <span className="zb-step-n" aria-hidden>
                      {done ? <Check size={12} strokeWidth={3} /> : wasSkipped ? <SkipForward size={11} strokeWidth={2.5} /> : i + 1}
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
          {notice ? <div className="zb-notices">{notice}</div> : null}

          {/* key on the step id re-runs the arrival: React replaces the node. */}
          <div className="zb-card" key={spec.id}>
            <div className="zb-card-head">
              <p className="zb-count">خطوة {step + 1} من {steps.length}</p>
              <h2 className="zb-h2">{spec.title}</h2>
              <p className="zb-h2-sub">{spec.sub}</p>
            </div>
            <div className="zb-body">{spec.body}</div>
          </div>

          <div className="zb-nav-bar">
            <button type="button" className="zb-back" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
              السابق
            </button>

            <p className="zb-nav-note" data-warn={spec.complete ? undefined : "true"}>{note}</p>

            {/* Skip, only where skipping is honest: the steps the wizard itself
                calls optional. */}
            {spec.optional && !last ? (
              <button
                type="button"
                className="zb-skip"
                onClick={() => { setSkipped((p) => new Set(p).add(step)); go(step + 1) }}
              >
                <SkipForward size={15} strokeWidth={1.75} aria-hidden />
                تخطَّ هذه الخطوة
              </button>
            ) : null}

            {last ? (
              <span className="zb-go">
                {"href" in final ? (
                  <SlideButton href={final.href} variant="violet" slide={final.slide ?? final.label}>
                    {final.label}
                  </SlideButton>
                ) : (
                  <SlideButton onClick={final.onClick} disabled={final.busy} variant="violet" slide={final.slide ?? final.label}>
                    {final.label}
                  </SlideButton>
                )}
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

      {chrome ? <PricingFooter /> : null}
    </main>
  )
}

/* ---------------------------------------------------------------------------
   The public demo's header: the site pill, taking the ground it stands on.
--------------------------------------------------------------------------- */

const NAV = [
  { href: "/templates", label: "القوالب" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

function DemoHeader({ rootRef }: { rootRef: React.MutableRefObject<HTMLElement | null> }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [onDark, setOnDark] = useState(false)
  const headRef = useRef<HTMLElement | null>(null)

  /* The band is the strip the pill occupies, in CSS pixels. The root ZoomLock
     writes CSS zoom, so a rect and rootMargin share a space — no division. */
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
  }, [rootRef])

  return (
    <header ref={headRef} className={"zb-head " + plex.className} data-dark={onDark ? "true" : undefined}>
      <div className="zb-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
        <div className="zb-phone-bar">
          <button type="button" className="zb-round" aria-expanded={menuOpen} aria-controls="zb-phone-menu"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
          </button>
          <Link href="/" aria-label="زينيا" className="zb-phone-mark"><ZenyaMark className="zb-mark-svg-sm" /></Link>
          <AccountControl className="zb-account zb-account-phone" />
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
            <Link href="/" className="zb-mark" aria-label="زينيا"><ZenyaMark className="zb-mark-svg" /></Link>
          </span>
          <nav className="zb-nav">
            {NAV.map((i) => (
              <Link key={i.href} href={i.href} className="zb-nav-item">{i.label}</Link>
            ))}
          </nav>
          <span className="zb-side zb-side-end">
            <span className="zb-sep" aria-hidden />
            <AccountControl className="zb-account" />
          </span>
        </div>
      </div>
    </header>
  )
}

/* ---------------------------------------------------------------------------
   The form parts. Every wizard builds its steps out of these, so a field in
   the restaurant wizard and a field in the studio wizard cannot disagree.
--------------------------------------------------------------------------- */

/** The step body's two-column grid. Children are Fields and Blocks. */
export function Grid({ children }: { children: ReactNode }) {
  return <div className="zb-grid">{children}</div>
}

/** One labelled control. The label sits ABOVE the control, never inside it. */
export function Field({
  label, required, wide, hint, children,
}: { label: string; required?: boolean; wide?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className={"zb-cell" + (wide ? " wide" : "")}>
      <label className="zb-f">
        <span className="zb-lab">
          {label}
          {required ? <b className="zb-req" aria-hidden> *</b> : null}
        </span>
        {children}
        {hint ? <span className="zb-fhint">{hint}</span> : null}
      </label>
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"zb-in " + (props.className ?? "")} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={"zb-in " + (props.className ?? "")} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={"zb-in zb-select " + (props.className ?? "")} />
}

/** A full-width region inside a step: a heading, its controls, a hint. */
export function Block({
  title, optional, hint, children,
}: { title?: string; optional?: boolean; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="zb-cell wide">
      <div className="zb-block">
        {title ? (
          <p className="zb-block-h">
            {title}{optional ? <span className="zb-opt"> · اختياري</span> : null}
          </p>
        ) : null}
        {children}
        {hint ? <p className="zb-hint">{hint}</p> : null}
      </div>
    </div>
  )
}

/** One-of-many chips. Pressing the chosen chip again clears it when allowed. */
export function Chips({
  options, value, onChange, allowNone = true,
}: {
  options: ReadonlyArray<{ id: string; label: string }>
  value: string
  onChange: (id: string) => void
  allowNone?: boolean
}) {
  return (
    <div className="zb-chips">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="zb-chip"
          data-on={value === o.id ? "true" : undefined}
          aria-pressed={value === o.id}
          onClick={() => onChange(value === o.id && allowNone ? "" : o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** A yes/no, drawn as a chip that carries its own tick. */
export function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" className="zb-chip zb-toggle" data-on={on ? "true" : undefined} aria-pressed={on} onClick={() => onChange(!on)}>
      <span className="zb-box" aria-hidden>{on ? <Check size={13} strokeWidth={3} /> : null}</span>
      {children}
    </button>
  )
}

export type PresetLike = {
  id: string
  name: string
  vibe?: string
  description?: string
  heading_font?: string
  colors: {
    background?: string; text?: string; border?: string; primary?: string
    accent?: string; surface?: string; muted?: string; gradient?: string
  }
}

/** The style presets, each drawn in its own colours. */
export function Presets({ presets, value, onChange }: { presets: ReadonlyArray<PresetLike>; value: string; onChange: (id: string) => void }) {
  return (
    <div className="zb-presets">
      {presets.map((p) => {
        const c = p.colors
        const on = value === p.id
        const fg = c.text || "#171717"
        return (
          <button
            key={p.id}
            type="button"
            className="zb-preset"
            data-on={on ? "true" : undefined}
            aria-pressed={on}
            onClick={() => onChange(p.id)}
            style={{ background: c.background || "#ffffff", color: fg, borderColor: on ? (c.text || "#5e6ad2") : (c.border || "rgba(17,17,17,0.12)") }}
          >
            {c.gradient ? (
              <span className="zb-sw-bar" style={{ background: c.gradient }} />
            ) : (
              <span className="zb-sw">
                {[c.primary, c.accent, c.surface].filter(Boolean).map((col, i) => (
                  <em key={i} style={{ background: col, borderColor: c.border }} />
                ))}
              </span>
            )}
            <span className="zb-preset-name" dir="auto" style={{ fontFamily: p.heading_font }}>{p.name}</span>
            {p.vibe ? <span className="zb-preset-vibe" dir="auto" style={{ color: c.accent || c.primary }}>{p.vibe}</span> : null}
            {p.description ? <span className="zb-preset-desc" dir="auto" style={{ color: c.muted || fg }}>{p.description}</span> : null}
            {on ? <span className="zb-preset-on"><Check size={13} strokeWidth={2.5} /> محدّد</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export type HourRow = { day: string; label: string; open: string; close: string; closed?: boolean }

/** The week: an open and a close time per day, and a closed switch. */
export function Hours({
  hours, onChange, openPh = "9:00 ص", closePh = "10:00 م",
}: { hours: HourRow[]; onChange: (i: number, patch: Partial<HourRow>) => void; openPh?: string; closePh?: string }) {
  return (
    <div className="zb-hours">
      {hours.map((h, i) => (
        <div key={h.day} className="zb-hrow" data-closed={h.closed ? "true" : undefined}>
          <span className="zb-hday">{h.label}</span>
          <input
            className="zb-in zb-htime" dir="rtl" value={h.open} placeholder={openPh} aria-label={"وقت الفتح — " + h.label}
            disabled={h.closed} onChange={(e) => onChange(i, { open: e.target.value })}
          />
          <span className="zb-hsep" aria-hidden>—</span>
          <input
            className="zb-in zb-htime" dir="rtl" value={h.close} placeholder={closePh} aria-label={"وقت الإغلاق — " + h.label}
            disabled={h.closed} onChange={(e) => onChange(i, { close: e.target.value })}
          />
          <button
            type="button" className="zb-hclosed" data-on={h.closed ? "true" : undefined} aria-pressed={!!h.closed}
            onClick={() => onChange(i, h.closed ? { closed: false } : { closed: true, open: "", close: "" })}
          >
            مغلق
          </button>
        </div>
      ))}
    </div>
  )
}

/** One entry in a repeating list: a service, a feature, a menu category. */
export function Card({
  title, onRemove, removeLabel = "إزالة", children,
}: { title: ReactNode; onRemove?: () => void; removeLabel?: string; children: ReactNode }) {
  return (
    <div className="zb-cat">
      <div className="zb-cat-head">
        <span className="zb-cat-t">{title}</span>
        {onRemove ? (
          <button type="button" className="zb-icon" aria-label={removeLabel} onClick={onRemove}>
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      <div className="zb-cat-body">{children}</div>
    </div>
  )
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="zb-add" onClick={onClick}>
      <Plus size={14} strokeWidth={2} /> {children}
    </button>
  )
}

/** Upload slots: ImageUploadField instances, laid out as a grid. */
export function Uploads({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 4 }) {
  return <div className="zb-ups" data-cols={cols}>{children}</div>
}

/** The review step: a few counts, then everything that was typed. */
export function Review({
  facts, recap, children,
}: {
  facts: Array<{ label: string; value: ReactNode }>
  recap: Array<{ label: string; value: string }>
  children?: ReactNode
}) {
  const filled = recap.filter((r) => r.value.trim())
  return (
    <div className="zb-cell wide">
      <div className="zb-block">
        <dl className="zb-sum">
          {facts.map((f) => (
            <div key={f.label} className="zb-sum-row"><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
        {filled.length ? (
          <dl className="zb-recap">
            {filled.map((r) => (
              <div key={r.label} className="zb-recap-row"><dt>{r.label}</dt><dd>{r.value}</dd></div>
            ))}
          </dl>
        ) : (
          <p className="zb-hint">لم تملأ شيئًا بعد. ارجع خطوة وابدأ بالأساسيات.</p>
        )}
        {children}
      </div>
    </div>
  )
}

/** The dark closing note on the review step. */
export function Handoff({ title, body }: { title: string; body: string }) {
  return (
    <div className="zb-handoff">
      <p className="zb-handoff-h">{title}</p>
      <p className="zb-handoff-b">{body}</p>
    </div>
  )
}

/** A banner above the step card. */
export function Notice({
  tone = "accent", children, action,
}: { tone?: "accent" | "bad"; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="zb-notice" data-tone={tone} role={tone === "bad" ? "alert" : undefined}>
      <div className="zb-notice-b">{children}</div>
      {action}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   No backticks inside this literal: one would end it.
--------------------------------------------------------------------------- */
const CSS = `
/* THE TWO FLOORS, IN RENDERED PIXELS. ZoomLock writes zoom: 0.85 from the root
   layout, so 14.5px CSS reaches the eye at 12.33 and 38px CSS reaches the
   finger at 32.3. Nothing below goes under either number. */
.zb-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  --stone: #56565a;
  --stone-2: #66666e;
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
  padding: 0 var(--gut) clamp(3rem, 7vw, 5rem);
  letter-spacing: 0;
}
.zb-root[data-chrome] { padding-bottom: 0; }
.zb-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* ---- header (public demo only) ------------------------------------------ */
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
.zb-phone-mark { display: flex; align-items: center; justify-self: center; min-height: 38px; padding-inline: 0.375rem; }
.zb-mark-svg-sm { height: 16px; color: #000; }
.zb-round { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
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
.zb-bar { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.zb-side { display: flex; align-items: center; flex-shrink: 0; }
.zb-side-start { justify-content: flex-start; }
.zb-side-end { justify-content: flex-end; }
.zb-mark { display: flex; align-items: center; min-height: 38px; padding: 0 0.25rem; flex-shrink: 0; }
.zb-mark-svg { height: 17px; color: #000; }
.zb-head[data-dark] .zb-pill, .zb-head[data-dark] .zb-phone-pill { background: rgba(32,32,38,0.72); box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5); }
.zb-head[data-dark] .zb-mark-svg, .zb-head[data-dark] .zb-mark-svg-sm { color: #fafafa; }
.zb-head[data-dark] .zb-nav-item, .zb-head[data-dark] .zb-tray-row, .zb-head[data-dark] .zb-round { color: rgba(250,250,250,0.66); }
.zb-head[data-dark] .zb-sep { background: rgba(250,250,250,0.16); }
.zb-head[data-dark] .zb-account { background: #fafafa; color: #171717; }
.zb-nav { display: flex; align-items: center; gap: 0.125rem; }
.zb-nav-item { border-radius: 999px; padding: 0.6875rem 0.75rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.zb-nav-item:hover { color: var(--obsidian); }
.zb-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); }
.zb-account { border-radius: 999px; padding: 0.6875rem 1rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out); }
.zb-account:hover { opacity: 0.86; }
.zb-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.zb-drawer[data-open] { transition-delay: 0s, 0s; }
.zb-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zb-tray-row { display: flex; align-items: center; min-height: 38px; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 14.5px; line-height: 1.24; text-decoration: none; color: #666; }
.zb-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

/* ---- lede ---------------------------------------------------------------- */
.zb-lede { max-width: var(--page); margin: clamp(2rem, 5vw, 3.5rem) auto clamp(1.75rem, 4vw, 2.75rem); }
.zb-eyebrow { margin: 0 0 0.75rem; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--violet); }
.zb-h1 { margin: 0; font-size: clamp(28px, 4vw, 46px); font-weight: 900; line-height: 1.3; color: var(--obsidian); }
.zb-sub { margin: 1.125rem 0 0; max-width: 52ch; font-size: 15.5px; font-weight: 500; line-height: 1.9; color: var(--stone); }

/* ---- shell: rail + stage ------------------------------------------------- */
.zb-shell {
  display: grid; grid-template-columns: 248px minmax(0, 1fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  max-width: var(--page); margin: 0 auto;
  align-items: start;
}
.zb-root[data-chrome] .zb-shell { margin-bottom: clamp(3.5rem, 8vw, 6rem); }
.zb-rail { position: sticky; top: 116px; display: flex; flex-direction: column; gap: 1.25rem; }
.zb-meter { border-radius: var(--r-card); background: var(--card); padding: 1rem 1.125rem 1.125rem; box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55); }
.zb-meter-top { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem; }
.zb-meter-n { font-size: 28px; font-weight: 900; line-height: 1.24; color: var(--obsidian); font-variant-numeric: tabular-nums; }
.zb-meter-n i { font-style: normal; font-size: 15px; margin-inline-start: 1px; color: var(--stone); }
.zb-meter-l { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: var(--stone); }
.zb-track { height: 5px; border-radius: 999px; background: rgba(17,17,17,0.07); overflow: hidden; }
.zb-fill { display: block; height: 100%; border-radius: 999px; background: var(--violet); transform-origin: right center; transition: transform 620ms var(--ease-out); }
@media (prefers-reduced-motion: reduce) { .zb-fill { transition: none; } }

.zb-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.zb-step {
  width: 100%; display: flex; align-items: center; gap: 0.625rem;
  border: 0; background: transparent; cursor: pointer; text-align: start;
  border-radius: var(--r-control); padding: 0.5rem 0.625rem; min-height: 38px;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.5; color: var(--stone);
  transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out);
}
.zb-step:hover { background: rgba(17,17,17,0.04); color: var(--obsidian); }
.zb-step[data-on] { background: rgba(94,106,210,0.09); color: var(--obsidian); font-weight: 700; }
.zb-step-n {
  flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 999px;
  font-size: 14.5px; font-weight: 700; font-variant-numeric: tabular-nums;
  background: rgba(17,17,17,0.06); color: var(--stone);
  transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out);
}
.zb-step[data-on] .zb-step-n { background: var(--violet); color: #fff; }
.zb-step[data-done] .zb-step-n { background: rgba(94,106,210,0.16); color: var(--violet); }
.zb-step[data-skipped] .zb-step-n { background: rgba(17,17,17,0.06); color: var(--stone-2); }
.zb-step[data-skipped] .zb-step-t { color: var(--stone-2); }
.zb-step-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---- the stage ----------------------------------------------------------- */
.zb-notices { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.zb-notice {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;
  border-radius: var(--r-card); padding: 0.875rem 1rem;
  background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  border-inline-start: 3px solid var(--violet);
  font-size: 14.5px; font-weight: 500; line-height: 1.75; color: var(--obsidian);
}
.zb-notice[data-tone="bad"] { border-inline-start-color: #b91c1c; color: #b91c1c; font-weight: 700; }
.zb-notice-b { min-width: 0; flex: 1 1 16rem; }
.zb-notice button { border: 0; cursor: pointer; font: inherit; border-radius: 999px; min-height: 38px; padding: 0 0.875rem; font-size: 14.5px; font-weight: 700; color: var(--obsidian); background: #f0f0f3; box-shadow: 0 0 0 1px rgba(17,17,17,0.10); }

.zb-card { border-radius: var(--r-panel); background: var(--card); padding: clamp(1.25rem, 3vw, 2.25rem); box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55); }
.zb-card-head { margin-bottom: clamp(1.25rem, 3vw, 2rem); }
.zb-count { margin: 0 0 0.5rem; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--violet); }
.zb-h2 { margin: 0; font-size: clamp(21px, 2.4vw, 27px); font-weight: 900; line-height: 1.36; color: var(--obsidian); }
.zb-h2-sub { margin: 0.625rem 0 0; max-width: 60ch; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone); }
.zb-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.125rem; }
.zb-cell.wide { grid-column: 1 / -1; }
.zb-cell.wide + .zb-cell.wide, .zb-cell:not(.wide) + .zb-cell.wide { margin-top: 0.5rem; }

/* ---- fields -------------------------------------------------------------- */
.zb-f { display: flex; flex-direction: column; gap: 0.4375rem; }
.zb-lab { font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zb-req { color: var(--violet); font-weight: 700; }
.zb-fhint { font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone-2); }
.zb-in {
  width: 100%; border: 0; border-radius: var(--r-control);
  padding: 0.6875rem 0.875rem; min-height: 44px;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.7; letter-spacing: 0;
  color: var(--obsidian); background: #f4f4f6;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zb-in::placeholder { color: #86868e; }
.zb-in:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.zb-in:focus { outline: none; background: #fff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15); }
.zb-in:disabled { opacity: 0.45; cursor: not-allowed; }
textarea.zb-in { resize: vertical; min-height: 96px; }
.zb-select { appearance: auto; cursor: pointer; }

/* ---- blocks -------------------------------------------------------------- */
.zb-block { display: flex; flex-direction: column; gap: 0.75rem; }
.zb-block-h { margin: 0; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zb-opt { color: var(--stone-2); font-weight: 500; }
.zb-hint { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.75; color: var(--stone); }

.zb-chips { display: flex; flex-wrap: wrap; gap: 0.4375rem; }
.zb-chip {
  border: 0; cursor: pointer; font: inherit;
  border-radius: 999px; padding: 0 0.875rem; min-height: 38px;
  display: inline-flex; align-items: center; gap: 0.4375rem;
  font-size: 14.5px; font-weight: 500; line-height: 1.4; color: var(--obsidian);
  background: #f4f4f6; box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: background-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), color 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.zb-chip:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.22); }
.zb-chip[data-on] { background: var(--violet); color: #fff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15); }
@media (prefers-reduced-motion: no-preference) { .zb-chip:active { transform: scale(0.96); } }
.zb-toggle { align-self: flex-start; }
.zb-box { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 5px; background: #fff; box-shadow: inset 0 0 0 1.5px rgba(17,17,17,0.28); color: var(--violet); }
.zb-toggle[data-on] .zb-box { box-shadow: none; }

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
.zb-sw-bar { display: block; height: 34px; border-radius: var(--r-control); margin-bottom: 0.5rem; box-shadow: inset 0 0 0 1px rgba(17,17,17,0.06); }
.zb-preset-name { font-size: 16px; font-weight: 700; line-height: 1.4; }
.zb-preset-vibe { font-size: 14.5px; font-weight: 700; line-height: 1.5; }
.zb-preset-desc { font-size: 14.5px; font-weight: 500; line-height: 1.65; }
.zb-preset-on {
  position: absolute; inset-block-start: 0.75rem; inset-inline-end: 0.75rem;
  display: inline-flex; align-items: center; gap: 0.25rem;
  border-radius: 999px; padding: 0.25rem 0.5rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.3;
  background: var(--violet); color: #fff;
}

/* hours */
.zb-hours { display: flex; flex-direction: column; gap: 0.4375rem; }
.zb-hrow { display: grid; grid-template-columns: 5.5rem minmax(0,1fr) auto minmax(0,1fr) auto; align-items: center; gap: 0.5rem; }
.zb-hday { font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zb-htime { padding: 0.5rem 0.625rem; }
.zb-hsep { color: #9a9aa2; font-size: 14.5px; }
.zb-hrow[data-closed] .zb-hday { color: var(--stone); }
.zb-hclosed {
  border: 0; cursor: pointer; font: inherit; border-radius: 999px;
  min-height: 38px; padding: 0 0.875rem; font-size: 14.5px; font-weight: 700; line-height: 1.4;
  background: #f4f4f6; color: var(--stone); box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out);
}
.zb-hclosed[data-on] { background: var(--obsidian); color: var(--ground); box-shadow: none; }

/* repeating entries */
.zb-list { display: flex; flex-direction: column; gap: 0.75rem; }
.zb-cat { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; border-radius: var(--r-card); background: #f7f7f9; box-shadow: 0 0 0 1px rgba(17,17,17,0.07); }
.zb-cat .zb-in { background: #fff; }
.zb-cat-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-height: 38px; }
.zb-cat-t { min-width: 0; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone); }
.zb-cat-body { display: flex; flex-direction: column; gap: 0.75rem; }
.zb-cat-body > .zb-grid { gap: 0.75rem; }
.zb-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; flex-shrink: 0; border: 0; cursor: pointer;
  border-radius: var(--r-control); background: transparent; color: var(--stone);
  transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out);
}
.zb-icon:hover { background: rgba(185,28,28,0.08); color: #b91c1c; }
.zb-add {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 0.375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: 999px; min-height: 38px; padding: 0 0.875rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.4;
  color: var(--violet); background: rgba(94,106,210,0.10);
  transition: background-color 180ms var(--ease-out);
}
.zb-add:hover { background: rgba(94,106,210,0.18); }
.zb-quiet { align-self: flex-start; border: 0; cursor: pointer; font: inherit; border-radius: 999px; min-height: 38px; padding: 0 0.875rem; font-size: 14.5px; font-weight: 700; color: var(--stone); background: transparent; }
.zb-quiet:hover { color: var(--obsidian); background: rgba(17,17,17,0.04); }

/* menu items */
.zb-mi { display: grid; grid-template-columns: 96px minmax(0,1fr); gap: 0.75rem; padding: 0.75rem; border-radius: var(--r-control); background: #fff; box-shadow: 0 0 0 1px rgba(17,17,17,0.07); }
.zb-mi-row { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(0,0.8fr) minmax(0,0.8fr) auto; gap: 0.5rem; align-items: center; }
.zb-mi-f { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.zb-mi-state { font-size: 14.5px; font-weight: 700; line-height: 1.6; }
.zb-mi-state[data-ok] { color: #15803d; }
.zb-mi-state:not([data-ok]) { color: #b45309; }

/* uploads */
.zb-ups { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 0.75rem; }
.zb-ups[data-cols="2"] { grid-template-columns: repeat(2, minmax(0,1fr)); }

/* analyzer: the shared component paints an amber panel inline; recoloured
   here, inside the wizard only, by matching the inline value. */
.zb-analyzer [style*="217, 119, 6"] { background: rgba(94, 106, 210, 0.07) !important; border-color: rgba(94, 106, 210, 0.28) !important; }
.zb-note { margin: 0.75rem 0 0; border-radius: var(--r-control); padding: 0.625rem 0.75rem; font-size: 14.5px; font-weight: 500; line-height: 1.75; color: #4f5ab8; background: rgba(94, 106, 210, 0.08); }

/* review */
.zb-sum { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 0.75rem; }
.zb-sum-row { border-radius: var(--r-control); background: #f7f7f9; padding: 0.75rem 0.875rem; box-shadow: 0 0 0 1px rgba(17,17,17,0.07); }
.zb-sum-row dt { font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone); }
.zb-sum-row dd { margin: 0.25rem 0 0; font-size: 16px; font-weight: 900; line-height: 1.4; color: var(--obsidian); }
.zb-recap { margin: 1.25rem 0 0; display: flex; flex-direction: column; gap: 0.625rem; }
.zb-recap-row { display: grid; grid-template-columns: 10rem minmax(0,1fr); gap: 0.75rem; align-items: baseline; }
.zb-recap-row dt { font-size: 14.5px; font-weight: 700; line-height: 1.6; color: var(--stone); }
.zb-recap-row dd { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--obsidian); white-space: pre-wrap; overflow-wrap: anywhere; }
.zb-handoff { margin-top: 1.5rem; border-radius: var(--r-card); background: var(--onyx); padding: 1.125rem 1.25rem; }
.zb-handoff-h { margin: 0; font-size: 15px; font-weight: 900; line-height: 1.6; color: var(--violet-lift); }
.zb-handoff-b { margin: 0.375rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.8; color: #b4b4bd; }

/* ---- the bar ------------------------------------------------------------- */
.zb-nav-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: 1.125rem; }
.zb-nav-note { margin: 0; flex: 1 1 auto; text-align: center; font-size: 14.5px; font-weight: 500; line-height: 1.6; color: var(--stone); }
.zb-nav-note[data-warn] { color: #4f5ab8; font-weight: 700; }
.zb-back, .zb-next {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: var(--r-control); padding: 0.625rem 1.125rem; min-height: 38px;
  font-size: 14.5px; font-weight: 700; line-height: 1.4;
  transition: background-color 180ms var(--ease-out), opacity 180ms var(--ease-out);
}
.zb-back { background: #f0f0f3; color: var(--obsidian); box-shadow: 0 0 0 1px rgba(17,17,17,0.10); }
.zb-back:hover:not(:disabled) { background: #e8e8ec; }
.zb-back:disabled { opacity: 0.4; cursor: not-allowed; }
/* Violet on every step, so the last step's action reads as the same gesture. */
.zb-next { background: var(--violet); color: #fff; box-shadow: 0 1px 2px rgba(94,106,210,0.30); }
.zb-next:hover { background: #5561c8; }
.zb-back:focus-visible, .zb-next:focus-visible, .zb-step:focus-visible, .zb-chip:focus-visible,
.zb-preset:focus-visible, .zb-add:focus-visible, .zb-hclosed:focus-visible, .zb-icon:focus-visible, .zb-skip:focus-visible {
  outline: 2px solid var(--violet); outline-offset: 3px;
}
.zb-go { flex: 0 0 auto; width: 12.5rem; }
.zb-skip {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: var(--r-control); padding: 0 1rem; min-height: 38px;
  font-size: 14.5px; font-weight: 700; line-height: 1.4;
  color: #4f5ab8; background: rgba(94, 106, 210, 0.09);
  box-shadow: inset 0 0 0 1px rgba(94, 106, 210, 0.30);
}
.zb-skip:hover { background: rgba(94, 106, 210, 0.16); }

/* ---- the corner mark ----------------------------------------------------- */
.zb-card, .zb-meter { position: relative; }
.zb-card::before, .zb-card::after, .zb-meter::before, .zb-meter::after {
  content: ""; position: absolute; width: 26px; height: 26px; pointer-events: none;
  border-color: var(--violet); border-style: solid; border-width: 0; opacity: 0.5;
  transition: opacity 320ms var(--ease-out), width 320ms var(--ease-out), height 320ms var(--ease-out);
}
.zb-card::before, .zb-meter::before { inset-block-start: -1px; inset-inline-start: -1px; border-block-start-width: 2px; border-inline-start-width: 2px; border-start-start-radius: var(--r-panel); }
.zb-card::after, .zb-meter::after { inset-block-end: -1px; inset-inline-end: -1px; border-block-end-width: 2px; border-inline-end-width: 2px; border-end-end-radius: var(--r-panel); }
.zb-meter::before, .zb-meter::after { width: 18px; height: 18px; }
.zb-meter::before { border-start-start-radius: var(--r-card); }
.zb-meter::after { border-end-end-radius: var(--r-card); }
@media (hover: hover) { .zb-card:hover::before, .zb-card:hover::after { opacity: 1; width: 34px; height: 34px; } }
.zb-card:focus-within::before, .zb-card:focus-within::after { opacity: 1; }

/* ---- arrival ------------------------------------------------------------- */
.zb-js .zb-card { animation: zb-rise 460ms var(--ease-out) both; }
.zb-js .zb-card .zb-cell { animation: zb-rise 420ms var(--ease-out) both; animation-delay: 90ms; }
@keyframes zb-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .zb-js .zb-card, .zb-js .zb-card .zb-cell { animation: none; }
  .zb-card::before, .zb-card::after, .zb-meter::before, .zb-meter::after { transition: none; }
}

/* ---- narrow -------------------------------------------------------------- */
@media (max-width: 900px) {
  .zb-shell { grid-template-columns: minmax(0, 1fr); }
  .zb-rail { position: static; }
  .zb-steps { flex-direction: row; overflow-x: auto; gap: 0.375rem; padding-bottom: 0.25rem; scrollbar-width: none; }
  .zb-steps::-webkit-scrollbar { display: none; }
  .zb-step { width: auto; white-space: nowrap; }
  .zb-step-t { max-width: 9rem; }
  .zb-ups { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 680px) {
  .zb-skip { order: 4; flex-basis: 100%; justify-content: center; }
  .zb-grid { grid-template-columns: minmax(0, 1fr); }
  .zb-presets { grid-template-columns: minmax(0, 1fr); }
  .zb-sum { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .zb-recap-row { grid-template-columns: minmax(0,1fr); gap: 0.125rem; }
  .zb-hrow { grid-template-columns: 4.5rem minmax(0,1fr) auto minmax(0,1fr); row-gap: 0.375rem; }
  .zb-hclosed { grid-column: 2 / -1; justify-self: start; }
  .zb-nav-note { order: 3; flex-basis: 100%; text-align: start; }
  .zb-go { width: 100%; }
  .zb-mi { grid-template-columns: minmax(0,1fr); }
  .zb-mi-row { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
}
@media (max-width: 480px) {
  .zb-sum { grid-template-columns: minmax(0,1fr); }
}
`
