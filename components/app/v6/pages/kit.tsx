'use client'

/**
 * The small helpers the v6 design's pages share (core.js and nav.js in the
 * design file), as React. Same DOM and class names as the design's own
 * helpers, so v6.css draws them unchanged.
 *
 *   Switch     swHTML + bindSwitch
 *   PageHead   the .phead every page opens with
 *   tint, kb   the avatar colour and the file size, as the design writes them
 *   shake      the field that shakes when it is empty
 *   store      a value a sheet's body and its foot share
 */

import { useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { MONTHS, reduceMotion } from '../ui'

/** The --i of a .rv block: the order it rises in. */
export const at = (i: number) => ({ ['--i' as string]: i }) as CSSProperties

export const tint = (name: string) => {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return 't' + (h % 5)
}

/** Kilobytes as the design writes them: «850 ك.ب», «3.1 م.ب». */
export const kb = (n: number) => (n >= 1024 ? (n / 1024).toFixed(1) + ' م.ب' : n + ' ك.ب')
export const kbOf = (bytes: number | null | undefined) => (bytes ? kb(Math.max(1, Math.round(bytes / 1024))) : '—')

export function Switch({ on, label, onChange, id, disabled }: { on: boolean; label: string; onChange: (on: boolean) => void; id?: string; disabled?: boolean }) {
  return (
    <button
      type="button" className="switch" role="switch" aria-checked={on} aria-label={label} id={id} disabled={disabled}
      onClick={() => { try { navigator.vibrate?.(8) } catch {} onChange(!on) }}
    />
  )
}

export function PageHead({ title, sub, acts }: { title: string; sub: ReactNode; acts?: ReactNode }) {
  return (
    <div className="phead">
      <div className="txt">
        <h1 className="t-h1 rv">{title}</h1>
        <p className="rv" style={at(1)}>{sub}</p>
      </div>
      {acts && <div className="acts rv" style={at(2)}>{acts}</div>}
    </div>
  )
}

/** The field shakes and turns red until the owner types in it. */
export function shake(el: HTMLElement | null) {
  if (!el) return
  const f = el.closest('.field')
  f?.classList.add('err')
  el.focus()
  if (!reduceMotion()) {
    el.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }],
      { duration: 420 },
    )
  }
  el.addEventListener('input', () => f?.classList.remove('err'), { once: true })
}

export const byId = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T | null

/**
 * A sheet is drawn by the frame, outside the page that opened it, so its
 * body and its foot cannot share React state with the page. They share one
 * of these instead.
 */
export type Store<T> = { get: () => T; set: (p: Partial<T>) => void; sub: (f: () => void) => () => void }
export function store<T extends object>(init: T): Store<T> {
  let v = init
  const subs = new Set<() => void>()
  return {
    get: () => v,
    set: (p) => { v = { ...v, ...p }; subs.forEach((f) => f()) },
    sub: (f) => { subs.add(f); return () => { subs.delete(f) } },
  }
}
export function useStore<T>(s: Store<T>): T {
  return useSyncExternalStore(s.sub, s.get, s.get)
}

export function copy(text: string) {
  try { navigator.clipboard.writeText(text) } catch {}
}

/** «Ahmad Ali» → «Ahmad». */
export const first = (name: string) => name.trim().split(/\s+/)[0] || name

/** Digits only, for wa.me and tel:. */
export const digits = (phone: string) => phone.replace(/[^\d+]/g, '')

/** «12 أكتوبر 2026», with the digits the design uses. */
export function dateAr(v: string | number | Date | null | undefined, year = true): string {
  if (v == null) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : `${d.getDate()} ${MONTHS[d.getMonth()]}${year ? ' ' + d.getFullYear() : ''}`
}

/** «قبل 3 أيام», with the digits the design uses. */
export function ago(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const diff = (t - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 60) return 'الآن'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return dateAr(iso, new Date(iso).getFullYear() !== new Date().getFullYear())
}
