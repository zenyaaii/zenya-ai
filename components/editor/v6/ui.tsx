'use client'

/**
 * The editor sample's shared controls as React: the icon, the segmented
 * control with its sliding pill, the popover, the dialog and the toast. The
 * markup and class names are the sample's, so editor.css styles them as is.
 */

import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
  type ReactNode,
} from 'react'

export function Ic({ n, c = '' }: { n: string; c?: string }) {
  return <svg className={'i' + (c ? ' ' + c : '')} aria-hidden="true"><use href={`#i-${n}`} /></svg>
}

export const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const fineMouse = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover:hover) and (pointer:fine)').matches
export const isPhoneW = () => typeof window !== 'undefined' && window.innerWidth < 760
const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '')
export const MOD = MAC ? '⌘' : 'Ctrl '
export const SHIFT = MAC ? '⇧' : 'Shift '

/* ── segmented control ─────────────────────────────────────────────────── */
export function Seg<V extends string>({
  items, value, onChange, cls = '', label, attrs,
}: {
  items: Array<[V, string, string?]>
  value: V
  onChange: (v: V) => void
  cls?: string
  label?: string
  attrs?: Record<string, string>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const place = useCallback(() => {
    const el = ref.current, p = pill.current
    if (!el || !p) return
    const on = el.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
    if (!on || !el.offsetParent) { p.style.width = '0'; return }
    p.style.width = on.offsetWidth + 'px'
    p.style.height = on.offsetHeight + 'px'
    p.style.transform = `translate(${on.offsetLeft}px,${on.offsetTop}px)`
  }, [])
  useLayoutEffect(() => { const r = requestAnimationFrame(place); return () => cancelAnimationFrame(r) }, [value, items.length, place])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => ro.disconnect()
  }, [place])
  return (
    <div ref={ref} className={'seg' + (cls ? ' ' + cls : '')} role="group" aria-label={label} {...attrs}>
      <span ref={pill} className="pill-ind" aria-hidden="true" />
      {items.map(([v, t, i]) => (
        <button
          key={v}
          type="button"
          data-v={v}
          aria-pressed={v === value}
          aria-label={i ? t : undefined}
          title={i ? t : undefined}
          onClick={() => { if (v !== value) onChange(v) }}
        >
          {i ? <Ic n={i} /> : t}
        </button>
      ))}
    </div>
  )
}

/* ── textarea that grows with its text ─────────────────────────────────── */
export function autosize(t: HTMLTextAreaElement | null) {
  if (!t) return
  t.style.height = 'auto'
  t.style.height = Math.max(46, t.scrollHeight) + 'px'
}

/* ── popover, dialog, toast: one host for the whole editor ─────────────── */
type PopReq = { anchor: HTMLElement; w?: number; body: (close: (silent?: boolean) => void) => ReactNode }
type DlgReq = {
  title: string
  body: ReactNode
  foot?: ReactNode
  wide?: boolean
  onClose?: () => void
  /** Focus this element's [autofocus] child on a mouse device. */
}
type ToastReq = { msg: string; ok?: boolean; action?: string; run?: () => void }

type Overlay = {
  openPop: (r: PopReq) => void
  closePop: (silent?: boolean) => void
  popOpen: () => boolean
  openDlg: (r: DlgReq) => void
  closeDlg: () => void
  dlgOpen: () => boolean
  toast: (msg: string, o?: Omit<ToastReq, 'msg'>) => void
}
const OverlayCtx = createContext<Overlay | null>(null)
export const useOverlay = () => useContext(OverlayCtx)!

export function OverlayHost({ children }: { children: ReactNode }) {
  const [pop, setPop] = useState<(PopReq & { on: boolean; left: number; top: number; origin: string }) | null>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const [dlg, setDlg] = useState<(DlgReq & { on: boolean }) | null>(null)
  const dlgRef = useRef<HTMLDivElement>(null)
  const dlgFocus = useRef<Element | null>(null)
  const dlgOn = useRef(false)
  const [toast, setToast] = useState<(ToastReq & { on: boolean; n: number }) | null>(null)
  const toastT = useRef<number>(0)

  const closePop = useCallback((silent?: boolean) => {
    const a = anchorRef.current
    anchorRef.current = null
    setPop((p) => (p ? { ...p, on: false } : p))
    if (a) { a.setAttribute('aria-expanded', 'false'); if (!silent && a.isConnected) a.focus({ preventScroll: true }) }
  }, [])

  const openPop = useCallback((r: PopReq) => {
    if (anchorRef.current === r.anchor) { closePop(); return }
    if (anchorRef.current) anchorRef.current.setAttribute('aria-expanded', 'false')
    anchorRef.current = r.anchor
    r.anchor.setAttribute('aria-expanded', 'true')
    setPop({ ...r, on: false, left: -9999, top: -9999, origin: '' })
  }, [closePop])

  // Place the popover once it has its size, then bring it in.
  useLayoutEffect(() => {
    if (!pop || pop.on || !anchorRef.current) return
    const p = popRef.current
    if (!p) return
    const r = anchorRef.current.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight
    let left = r.left + r.width / 2 - pw / 2
    left = Math.max(12, Math.min(innerWidth - 12 - pw, left))
    let top = r.bottom + 8
    if (top + ph > innerHeight - 12 && r.top - 8 - ph > 12) top = r.top - 8 - ph
    top = Math.max(12, Math.min(innerHeight - 12 - ph, top))
    const origin = `${r.left + r.width / 2 - left}px ${top > r.top ? '-8px' : ph + 8 + 'px'}`
    setPop({ ...pop, on: true, left, top, origin })
    window.setTimeout(() => {
      const f = p.querySelector<HTMLElement>('[aria-current="page"],button,a')
      f?.focus({ preventScroll: true })
    }, 30)
  }, [pop])

  useEffect(() => {
    if (!pop?.on) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      closePop(true)
    }
    document.addEventListener('pointerdown', down)
    return () => document.removeEventListener('pointerdown', down)
  }, [pop?.on, closePop])

  const closeDlg = useCallback(() => {
    if (!dlgOn.current) return
    dlgOn.current = false
    setDlg((d) => {
      if (d?.onClose) window.setTimeout(d.onClose, 0)
      return d ? { ...d, on: false } : d
    })
    const f = dlgFocus.current
    if (f && (f as HTMLElement).isConnected) (f as HTMLElement).focus({ preventScroll: true })
  }, [])

  const openDlg = useCallback((r: DlgReq) => {
    closePop(true)
    if (!dlgOn.current) dlgFocus.current = document.activeElement
    dlgOn.current = true
    setDlg({ ...r, on: true })
    window.setTimeout(() => {
      const d = dlgRef.current
      if (!d) return
      const body = d.querySelector('.d-body')
      if (body) body.scrollTop = 0
      const f = (fineMouse() && d.querySelector<HTMLElement>('[autofocus]')) || d.querySelector<HTMLElement>('[data-close]')
      f?.focus({ preventScroll: true })
    }, 80)
  }, [closePop])

  const showToast = useCallback((msg: string, o: Omit<ToastReq, 'msg'> = {}) => {
    window.clearTimeout(toastT.current)
    setToast((t) => ({ msg, ...o, on: false, n: (t?.n || 0) + 1 }))
    requestAnimationFrame(() => setToast((t) => (t ? { ...t, on: true } : t)))
    toastT.current = window.setTimeout(() => setToast((t) => (t ? { ...t, on: false } : t)), o.action ? 5200 : 2400)
  }, [])

  const api: Overlay = {
    openPop, closePop, popOpen: () => !!anchorRef.current,
    openDlg, closeDlg, dlgOpen: () => dlgOn.current,
    toast: showToast,
  }

  return (
    <OverlayCtx.Provider value={api}>
      {children}
      <div
        ref={popRef}
        className={'pop' + (pop?.on ? ' on' : '')}
        dir="rtl"
        style={pop ? { left: pop.left, top: pop.top, transformOrigin: pop.origin, width: pop.w ? `min(${pop.w}px,calc(100vw - 24px))` : undefined } : undefined}
      >
        {pop && anchorRef.current ? pop.body(closePop) : null}
      </div>
      <div className={'scrim' + (dlg?.on ? ' on' : '')} onClick={closeDlg} />
      <div
        ref={dlgRef}
        className={'dlg' + (dlg?.on ? ' on' : '') + (dlg?.wide ? ' wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dTitle"
        aria-hidden={!dlg?.on}
        dir="rtl"
        onClick={(e) => { if ((e.target as Element).closest('[data-close]')) closeDlg() }}
      >
        <div className="grab" aria-hidden="true"><i /></div>
        <div className="d-head">
          <h2 id="dTitle">{dlg?.title}</h2>
          <button type="button" className="ib" data-close aria-label="إغلاق"><Ic n="x" /></button>
        </div>
        <div className="d-body">{dlg?.body}</div>
        <div className="d-foot" hidden={!dlg?.foot}>{dlg?.foot}</div>
      </div>
      <div className={'toast' + (toast?.on ? ' on' : '')} role="status" aria-live="polite" dir="rtl">
        {toast && (
          <>
            {toast.ok !== false && <span className="ok-i"><Ic n="check" /></span>}
            <span className="msg">{toast.msg}</span>
            {toast.action && (
              <button type="button" onClick={() => { setToast((t) => (t ? { ...t, on: false } : t)); toast.run?.() }}>{toast.action}</button>
            )}
          </>
        )}
      </div>
    </OverlayCtx.Provider>
  )
}
