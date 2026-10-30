'use client'

/**
 * The v6 design's small parts, as React. Each one draws the same DOM, with
 * the same class names, as the helper of the same name in the design file
 * (the v6 dashboard.html), so the design's own stylesheet (v6.css) styles it
 * unchanged. Only the data is real here; the design file's numbers were
 * fixtures.
 *
 *   Ic        ic(name)          an icon from the sprite
 *   Odo       odo(el, n)        the rolling number
 *   Seg       seg / segHTML     the segmented control and its sliding pill
 *   AreaChart areaChart()       the line + area chart, right to left, scrub and tap
 *   Spark     spark()           the small line in a stat tile
 *   Bars      bars()            the bar list that grows in
 *   DayNav    dayNavHTML        the day stepper of the «يوم» range
 *   Stars     stars()
 */

import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'
import type { IconName } from './sprite'

/* ---- words and numbers, as the design writes them ----------------------- */
export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
export const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
export const hh = (h: number) => `${String(h % 24).padStart(2, '0')}:00`
const dateOf = (d: number) => new Date(Date.now() + d * 864e5)
export const dayFull = (d: number) => { const x = dateOf(d); return `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]}` }
/** A past day by how many days ago it was. */
export const agoName = (d: number) => (d === 0 ? 'اليوم' : d === 1 ? 'أمس' : dayFull(-d))
/** «اليوم حتى الآن» / «أمس» / «يوم الأحد 25 أكتوبر»: the day as a note under a number. */
export const dayNote = (d: number) => (d === 0 ? 'اليوم حتى الآن' : d === 1 ? 'أمس' : 'يوم ' + agoName(d))
export const greet = () => { const h = new Date().getHours(); return h >= 5 && h < 12 ? 'صباح الخير' : 'مساء الخير' }
export const people = (n: number | null) => (n == null ? 'طلب' : n === 1 ? 'شخص واحد' : n === 2 ? 'شخصان' : n <= 10 ? `${n} أشخاص` : `${n} شخصًا`)

export type Range = 'day' | '7d' | '30d' | '90d' | '12mo'
export const RANGES: [Range, string, number][] = [['day', 'يوم', 24], ['7d', '7 أيام', 7], ['30d', '30 يومًا', 30], ['90d', '90 يومًا', 90], ['12mo', 'سنة', 12]]

/** The label of point i of n on a range's chart. */
export function rangeLabel(range: Range, i: number, n: number) {
  if (range === 'day') return `من ${hh(i)} إلى ${hh(i + 1)}`
  if (range === '12mo') { const now = new Date(); const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
  if (i === n - 1) return 'اليوم'
  const d = dateOf(-(n - 1 - i))
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** Change against the comparison line; today's partial hours meet the same hours a week earlier. */
export function deltaOf(v: number[], p: number[] | null | undefined): number | null {
  if (!p) return null
  const a = sum(v), b = sum(p.slice(0, v.length))
  if (!b) return null
  return Math.round((a / b - 1) * 100)
}
export const deltaTxt = (x: number | null) => (x == null ? '' : x < 0 ? `▼ ${-x}%` : `▲ ${x}%`)

export const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---- the icon ------------------------------------------------------------ */
export function Ic({ n, className = '', style }: { n: IconName; className?: string; style?: CSSProperties }) {
  return <svg className={`i ${className}`} aria-hidden style={style}><use href={`#i-${n}`} /></svg>
}

/* ---- the frame's services: sheet, popover, toast, search ---------------- */
export type SheetSpec = { title: string; body: ReactNode; foot?: ReactNode; wide?: boolean; onClose?: () => void }
export type ToastOpts = { ok?: boolean; undo?: () => void }
export type V6Api = {
  openSheet: (s: SheetSpec) => void
  closeSheet: () => void
  /** Opens a popover under (or above) the element; a second call on the same anchor closes it. */
  openPop: (anchor: HTMLElement, body: ReactNode, width?: number) => void
  closePop: () => void
  toast: (msg: string, o?: ToastOpts) => void
  openPal: () => void
  dark: boolean
  toggleTheme: () => void
  /** The saved choice: light, dark, or follow the device. */
  mode: 'light' | 'dark' | 'auto'
  setMode: (m: 'light' | 'dark' | 'auto') => void
}
export const V6Ctx = createContext<V6Api | null>(null)
export function useV6(): V6Api {
  const c = useContext(V6Ctx)
  if (!c) throw new Error('useV6 outside the v6 frame')
  return c
}

/* ---- the rolling number --------------------------------------------------- */
export function Odo({ value, id }: { value: number; id?: string }) {
  const s = fmt(value)
  const [shown, setShown] = useState<string | null>(null)
  // The digits roll to their place a frame after they are drawn.
  useEffect(() => { const r = requestAnimationFrame(() => setShown(s)); return () => cancelAnimationFrame(r) }, [s])
  return (
    <div className="odo" id={id} aria-label={s} role="img">
      {[...s].map((ch, k) => /\d/.test(ch)
        ? <span key={k}><i style={{ transform: `translateY(-${(shown && /\d/.test(shown[k] ?? '') && shown.length === s.length ? +shown[k] : 0) * 10}%)` }}>{'0123456789'.split('').map((d) => <b key={d}>{d}</b>)}</i></span>
        : <span key={k} className="sep">{ch}</span>)}
    </div>
  )
}

/* ---- the segmented control ------------------------------------------------ */
export function Seg<V extends string>({
  items, value, onChange, className = '', label, id,
}: {
  items: [V, ReactNode, (number | string)?][]
  value: V
  onChange: (v: V) => void
  className?: string
  label?: string
  id?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const ind = useRef<HTMLSpanElement>(null)
  const place = useCallback(() => {
    const el = box.current, p = ind.current
    const on = el?.querySelector<HTMLElement>('button[aria-pressed="true"]')
    if (!el || !p || !on || !el.offsetParent) return
    p.style.width = on.offsetWidth + 'px'
    p.style.height = on.offsetHeight + 'px'
    p.style.transform = `translate(${on.offsetLeft}px,${on.offsetTop}px)`
  }, [])
  useLayoutEffect(() => { place() }, [place, value, items.length])
  useEffect(() => {
    const r = () => place()
    window.addEventListener('resize', r)
    document.fonts?.ready.then(r)
    const t = setTimeout(r, 300)
    return () => { window.removeEventListener('resize', r); clearTimeout(t) }
  }, [place])
  return (
    <div className={`seg ${className}`} ref={box} role="group" aria-label={label} id={id}>
      <span className="pill-ind" aria-hidden ref={ind} />
      {items.map(([v, t, n]) => (
        <button
          key={v} type="button" data-v={v} aria-pressed={v === value}
          onClick={(e) => {
            if (v === value) return
            const sc = (e.currentTarget.closest('.seg-scroll') as HTMLElement | null) || box.current
            if (sc && sc.scrollWidth > sc.clientWidth) e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' })
            onChange(v)
          }}
        >
          {t}{n != null && <span className="n num">{n}</span>}
        </button>
      ))}
    </div>
  )
}

/* ---- the chart --------------------------------------------------------------- */
const smoothPath = (P: [number, number][]) => P.map((q, i) => {
  if (!i) return `M${q[0].toFixed(1)},${q[1].toFixed(1)}`
  const a = P[i - 1], cx = (a[0] + q[0]) / 2
  return `C${cx.toFixed(1)},${a[1].toFixed(1)} ${cx.toFixed(1)},${q[1].toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}`
}).join(' ')
const springE = (t: number) => (t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(8.4 * t))

/**
 * Time runs right to left, like the page around it: the first point sits on
 * the right. `slots` is how many places the x-axis has; today's hours fill
 * only part of a 24-hour day.
 */
export function AreaChart({
  values, prev, slots, pick, onScrub, onLeave, onPick, id,
}: {
  values: number[]
  prev?: number[] | null
  slots?: number
  /** A tap on a point does something (a day opens its hours). */
  pick?: boolean
  onScrub?: (i: number, v: number) => void
  onLeave?: () => void
  onPick?: (i: number) => void
  id?: string
}) {
  const W = 600, H = 220
  const el = useRef<HTMLDivElement>(null)
  const st = useRef<{ y: number[] | null; p: number[] | null; slots: number; raf: number; draw: number; vals: number[] }>({ y: null, p: null, slots: 0, raf: 0, draw: 0, vals: [] })
  const down = useRef<{ x: number; t: number } | null>(null)

  const X = (i: number, n: number) => W - (i * W) / Math.max(1, n - 1)
  const paint = useCallback((y: number[], p: number[] | null) => {
    const root = el.current
    if (!root) return
    const n = st.current.slots
    const L = smoothPath(y.map((v, i) => [X(i, n), v]))
    root.querySelector('.ln')!.setAttribute('d', L)
    root.querySelector('.ar')!.setAttribute('d', `${L} L${X(y.length - 1, n).toFixed(1)},${H} L${W},${H}Z`)
    root.querySelector('.pv')!.setAttribute('d', p ? smoothPath(p.map((v, i) => [X(i, n), v])) : '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = el.current
    if (!root) return
    const s = st.current
    const n = slots || values.length
    s.vals = values
    const mx = Math.max(...values, ...(prev || [0])) * 1.08 || 1
    const ys = (arr: number[]) => arr.map((v) => H - 6 - (v / mx) * (H - 20))
    const ty = ys(values), tp = prev ? ys(prev) : null
    // Two frames so the hidden line is painted before it draws. A re-run that
    // only re-tweens (a new range of the same length; dev's double effects)
    // still draws a line that has not drawn yet.
    const drawIn = () => {
      cancelAnimationFrame(s.draw)
      s.draw = requestAnimationFrame(() => { s.draw = requestAnimationFrame(() => root.classList.add('drawn')) })
    }
    if (s.y && s.slots === n && s.y.length === ty.length && (!tp || (s.p && s.p.length === tp.length)) && !reduceMotion()) {
      const fy = s.y.slice(), fp = (s.p || tp || ty).slice(), t0 = performance.now()
      cancelAnimationFrame(s.raf)
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 760), e = springE(k)
        s.y = fy.map((v, i) => v + (ty[i] - v) * e)
        s.p = tp ? fp.map((v, i) => v + (tp[i] - v) * e) : null
        paint(s.y, s.p)
        if (k < 1) s.raf = requestAnimationFrame(step)
      }
      s.raf = requestAnimationFrame(step)
      if (!root.classList.contains('drawn')) drawIn()
      return
    }
    cancelAnimationFrame(s.raf)
    s.slots = n; s.y = ty; s.p = tp
    paint(ty, tp)
    root.classList.remove('drawn')
    const ln = root.querySelector<SVGPathElement>('.ln')!
    ln.style.setProperty('--len', String(Math.ceil((ln.getTotalLength?.() || 2000) * 3)))
    drawIn()
  }, [values, prev, slots, paint])

  useEffect(() => () => { cancelAnimationFrame(st.current.raf); cancelAnimationFrame(st.current.draw) }, [])

  const at = (x: number) => {
    const r = el.current!.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (r.right - x) / r.width))
    return Math.min(st.current.vals.length - 1, Math.round(f * (st.current.slots - 1)))
  }
  const scrub = (x: number) => {
    const s = st.current
    if (!s.vals.length || !s.y || !el.current) return
    const i = at(x)
    const c = el.current.querySelector<HTMLElement>('.cur')!
    c.style.left = 100 - (i / Math.max(1, s.slots - 1)) * 100 + '%'
    c.style.setProperty('--y', (s.y[i] / H) * 100 + '%')
    onScrub?.(i, s.vals[i])
  }
  const lift = () => { el.current?.classList.remove('touch'); onLeave?.() }

  return (
    <div
      ref={el} id={id} className={`chart${pick ? ' pick' : ''}`}
      onPointerMove={(e) => scrub(e.clientX)}
      onPointerDown={(e) => { down.current = { x: e.clientX, t: performance.now() }; el.current?.classList.add('touch'); scrub(e.clientX) }}
      onClick={(e) => {
        if (!onPick || !st.current.vals.length) return
        const d = down.current
        if (d && (Math.abs(e.clientX - d.x) > 10 || performance.now() - d.t > 650)) return
        onPick(at(e.clientX))
      }}
      onPointerLeave={lift}
      onPointerUp={(e) => { if (e.pointerType !== 'mouse') lift() }}
      onPointerCancel={lift}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} className="gl" x1="0" x2={W} y1={H * f} y2={H * f} />)}
        <path className="ar" /><path className="pv" /><path className="ln" />
      </svg>
      <span className="cur" />
    </div>
  )
}

export function Spark({ values }: { values: number[] }) {
  const W = 72, H = 28
  const mx = Math.max(...values, 0) || 1, mn = Math.min(...values, 0)
  const p = values.map((v, i): [number, number] => [W - (i * W) / Math.max(1, values.length - 1), H - 3 - ((v - mn) / (mx - mn || 1)) * (H - 6)])
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden><path d={values.length ? smoothPath(p) : ''} /></svg>
}

/** The bar list; the bars grow in when it is drawn and when its rows change. */
export function Bars({ rows, tone = '' }: { rows: [string, number][]; tone?: '' | 'blue' | 'ok' }) {
  const ref = useRef<HTMLDivElement>(null)
  const key = rows.map((r) => r.join(':')).join('|')
  useEffect(() => {
    const b = ref.current
    if (!b) return
    b.classList.remove('on')
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => b.classList.add('on')) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [key])
  const mx = Math.max(...rows.map((r) => r[1]), 0) || 1
  return (
    <div ref={ref} className={`bars ${tone}`}>
      {rows.map((r) => (
        <div key={r[0]} className="b" style={{ '--w': `${((r[1] / mx) * 100).toFixed(1)}%` } as CSSProperties}>
          <span>{r[0]}</span><b className="num">{fmt(r[1])}</b>
        </div>
      ))}
    </div>
  )
}

/** Older day on the right, newer on the left, like the charts. */
export const DAY_MAX = 89
export function DayNav({ day, onDay, hidden, id }: { day: number; onDay: (d: number) => void; hidden?: boolean; id?: string }) {
  return (
    <div className="daynav" id={id} hidden={hidden}>
      <button type="button" className="st" aria-label="اليوم السابق" disabled={day >= DAY_MAX} onClick={() => onDay(Math.min(DAY_MAX, day + 1))}><Ic n="chev" className="flip" /></button>
      <b className="dn-t" aria-live="polite">{agoName(day)}</b>
      <button type="button" className="st" aria-label="اليوم التالي" disabled={day === 0} onClick={() => onDay(Math.max(0, day - 1))}><Ic n="chev" /></button>
      <button type="button" className="btn sm line dn-today" hidden={day === 0} onClick={() => onDay(0)}><span className="dn-l">العودة إلى </span>اليوم</button>
    </div>
  )
}

export function Stars({ n, lg }: { n: number; lg?: boolean }) {
  return (
    <span className={`stars ${lg ? 'lg' : ''}`} role="img" aria-label={`${n} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => <svg key={i} className={i <= Math.round(n) ? 'f' : ''}><use href="#i-starf" /></svg>)}
    </span>
  )
}

/** A page's cards rise in one after another (the design's .rv, under .page.in). */
export const rv = (i: number) => ({ className: 'rv', style: { '--i': i } as CSSProperties })
