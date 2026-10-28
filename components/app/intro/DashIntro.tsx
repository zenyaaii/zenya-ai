'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell, CircleUser, LayoutGrid, Moon, Palette, Plus, Search, Sparkles, X, type LucideIcon,
} from 'lucide-react'
import { useLocale, useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { dashFont } from '../dash-font'

/**
 * The introduction to the new dashboard, in three forms while the owner
 * picks one:
 *
 *   story  plays by itself: a pointer moves to each control and uses it —
 *          it opens search and types, flips the theme and back, opens the
 *          phone's More sheet — with a caption and a progress bar. Skip any
 *          time.
 *   steps  the same stops, walked with Next / Back.
 *   card   one "What's new" card with four lines, and a button that plays
 *          the story for whoever wants it.
 *
 * Targets are found by [data-tour="…"], which DashFrame and the top-bar
 * tools carry, and whichever copy is on screen is used (the nav exists as
 * the laptop rail and as the phone dock). A stop whose target is missing is
 * passed over.
 *
 * It portals to <body>, so it carries .zy-dash and the faces itself.
 */

export type IntroVariant = 'story' | 'steps' | 'card'

type Stop = {
  key: string
  icon: LucideIcon
  title: (t: Messages, phone: boolean) => string
  body: (t: Messages, phone: boolean) => string
  /** What the story does at this stop, after the pointer lands. */
  act?: 'search' | 'theme' | 'more'
}

const STOPS: Stop[] = [
  { key: 'nav', icon: LayoutGrid, act: 'more',
    title: (t, p) => (p ? t.intro.navTitlePhone : t.intro.navTitle),
    body: (t, p) => (p ? t.intro.navBodyPhone : t.intro.navBody) },
  { key: 'search', icon: Search, act: 'search', title: (t) => t.intro.searchTitle, body: (t) => t.intro.searchBody },
  { key: 'theme', icon: Moon, act: 'theme', title: (t) => t.intro.themeTitle, body: (t) => t.intro.themeBody },
  { key: 'new-site', icon: Plus, title: (t) => t.intro.newSiteTitle, body: (t) => t.intro.newSiteBody },
  { key: 'bell', icon: Bell, title: (t) => t.intro.bellTitle, body: (t) => t.intro.bellBody },
  { key: 'account', icon: CircleUser, title: (t) => t.intro.accountTitle, body: (t) => t.intro.accountBody },
]

/** How long the story stays on each stop, in ms. Acting stops get longer. */
const DWELL = { plain: 4200, act: 6200 }
const PAD = 6
const GUT = 16
const CARD_W = 330
const PHONE_MAX = 1023

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function findTarget(key: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`))
  return all.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
  }) || null
}

/** Type into a React-controlled input the way a person would. */
function typeInto(input: HTMLInputElement, text: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  set?.call(input, text)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

export default function DashIntro({
  variant, onClose, setMore,
}: {
  variant: IntroVariant
  onClose: () => void
  /** Opens / closes the phone's More sheet. */
  setMore: (open: boolean) => void
}) {
  const t = useT()
  const { dir } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [stage, setStage] = useState<'welcome' | 'tour' | 'done'>('welcome')
  const [mode, setMode] = useState<'story' | 'steps'>(variant === 'steps' ? 'steps' : 'story')
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [view, setView] = useState({ w: 1440, h: 900 })
  /** While the story is using a control (search open, theme flipping) the dim
   *  steps aside so the real thing shows. */
  const [live, setLive] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number; tap: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const run = useRef(0)
  const reduce = useRef(false)

  const phone = view.w <= PHONE_MAX
  const stops = STOPS
  const stop = stops[index]

  useEffect(() => {
    setMounted(true)
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setView({ w: window.innerWidth, h: window.innerHeight })
  }, [])

  const measure = useCallback(() => {
    setView({ w: window.innerWidth, h: window.innerHeight })
    const el = stop ? findTarget(stop.key) : null
    setRect(el ? el.getBoundingClientRect() : null)
    return el
  }, [stop])

  useLayoutEffect(() => {
    if (stage !== 'tour') return
    measure()
    const settle = window.setTimeout(measure, 480)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [stage, index, measure])

  const finish = useCallback(() => {
    run.current++
    setMore(false)
    setLive(false)
    setCursor(null)
    // Close search if the story left it open.
    document.querySelector('.zf-pal input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    setStage('done')
  }, [setMore])

  const close = useCallback(() => {
    run.current++
    setMore(false)
    onClose()
  }, [onClose, setMore])

  // ── the story: plays itself ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'tour' || mode !== 'story') return
    const me = ++run.current
    const alive = () => run.current === me
    const theme0 = (() => { try { return localStorage.getItem('beynoun-dash-theme') } catch { return null } })()

    ;(async () => {
      const total = stops.reduce((s, x) => s + (x.act ? DWELL.act : DWELL.plain), 0)
      let spent = 0
      for (let i = 0; i < stops.length; i++) {
        if (!alive()) return
        setIndex(i)
        setLive(false)
        await sleep(60)
        const el = findTarget(stops[i].key)
        const dwell = stops[i].act ? DWELL.act : DWELL.plain
        const startAt = spent
        const tick = window.setInterval(() => {
          setProgress(Math.min(1, (startAt + (performance.now() - t0)) / total))
        }, 100)
        const t0 = performance.now()
        if (el) {
          const r = el.getBoundingClientRect()
          setCursor((c) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2, tap: c?.tap ?? 0 }))
          await sleep(1100)
          if (!alive()) { window.clearInterval(tick); return }
          const act = stops[i].act
          if (act === 'search') {
            setCursor((c) => c && { ...c, tap: c.tap + 1 })
            setLive(true)
            el.click()
            await sleep(500)
            const input = document.querySelector<HTMLInputElement>('.zf-pal input')
            const word = dir === 'rtl' ? 'حجز' : 'book'
            for (let k = 1; input && k <= word.length && alive(); k++) {
              typeInto(input, word.slice(0, k))
              await sleep(260)
            }
            await sleep(1700)
            input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            setLive(false)
          } else if (act === 'theme') {
            setCursor((c) => c && { ...c, tap: c.tap + 1 })
            setLive(true)
            el.click()
            await sleep(2200)
            if (!alive()) { window.clearInterval(tick); return }
            setCursor((c) => c && { ...c, tap: c.tap + 1 })
            el.click()
            await sleep(1300)
            try {
              if (theme0) localStorage.setItem('beynoun-dash-theme', theme0)
              else localStorage.removeItem('beynoun-dash-theme')
            } catch {}
            setLive(false)
          } else if (act === 'more' && phone) {
            const more = document.querySelector<HTMLElement>('.zf-dock-b[data-tour="more"]')
            if (more) {
              const m = more.getBoundingClientRect()
              await sleep(900)
              setCursor((c) => ({ x: m.left + m.width / 2, y: m.top + m.height / 2, tap: (c?.tap ?? 0) + 1 }))
              await sleep(700)
              setLive(true)
              setMore(true)
              await sleep(2200)
              setMore(false)
              setLive(false)
            }
          }
        }
        const left = dwell - (performance.now() - t0)
        if (left > 0) await sleep(left)
        window.clearInterval(tick)
        spent += dwell
      }
      if (alive()) { setProgress(1); finish() }
    })()

    return () => { run.current++ }
  }, [stage, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape ends it, like every overlay on the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || live) return
      if (stage === 'tour') finish()
      else close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, live, finish, close])

  if (!mounted) return null

  const wrap = (node: React.ReactNode) =>
    createPortal(
      <div className={`zy-dash ${dashFont.variable} zi-root`} dir={dir}>{node}</div>,
      document.body,
    )

  // ── welcome / card ─────────────────────────────────────────────────────
  if (stage === 'welcome' || stage === 'done') {
    const done = stage === 'done'
    const points: [LucideIcon, string][] = [
      [LayoutGrid, t.intro.pointNav],
      [Search, t.intro.pointSearch],
      [Moon, t.intro.pointTheme],
      [Palette, t.intro.pointLook],
    ]
    return wrap(
      <>
        <div className="zi-scrim" onClick={close} aria-hidden />
        <div className="zi-modal" role="dialog" aria-modal="true" aria-labelledby="zi-title">
          <button type="button" className="zy-icon-btn zi-x inline-flex" onClick={close} aria-label={t.intro.close}>
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <span className="zi-badge"><Sparkles className="h-4 w-4" strokeWidth={2} />{t.intro.eyebrow}</span>
          <h2 id="zi-title" className="zi-title">{done ? t.intro.doneTitle : variant === 'card' ? t.intro.whatsNew : t.intro.title}</h2>
          <p className="zi-lead">{done ? t.intro.doneBody : t.intro.lead}</p>
          {!done && variant === 'card' && (
            <ul className="zi-points">
              {points.map(([Icon, text], i) => (
                <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
                  <span className="zi-pt-ico"><Icon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
                  {text}
                </li>
              ))}
            </ul>
          )}
          <div className="zi-actions">
            {done ? (
              <button type="button" className="zi-btn" onClick={close} autoFocus>{t.intro.start}</button>
            ) : variant === 'card' ? (
              <>
                <button type="button" className="zi-btn" onClick={close} autoFocus>{t.intro.start}</button>
                <button type="button" className="zi-btn-q" onClick={() => { setMode('story'); setIndex(0); setStage('tour') }}>
                  {t.intro.watch} <span className="zi-dim">&nbsp;· {t.intro.length}</span>
                </button>
              </>
            ) : (
              <>
                <button type="button" className="zi-btn" onClick={() => { setIndex(0); setStage('tour') }} autoFocus>
                  {t.intro.watch}{variant === 'story' && <span className="zi-dim-on">&nbsp;· {t.intro.length}</span>}
                </button>
                <button type="button" className="zi-btn-q" onClick={close}>{t.intro.later}</button>
              </>
            )}
          </div>
        </div>
      </>,
    )
  }

  // ── the tour ───────────────────────────────────────────────────────────
  const hole = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  let tip: React.CSSProperties
  if (phone) {
    const width = view.w - GUT * 2
    if (hole && hole.top + hole.height < view.h * 0.5) tip = { top: hole.top + hole.height + 14, left: GUT, width }
    else if (hole) tip = { bottom: view.h - hole.top + 14, left: GUT, width }
    else tip = { bottom: GUT, left: GUT, width }
  } else if (hole && hole.height > view.h * 0.4) {
    // The rail: beside it, on whichever side has room.
    let left = hole.left - CARD_W - 18
    if (left < GUT) left = hole.left + hole.width + 18
    tip = { top: Math.min(hole.top + 80, view.h - 260), left, width: CARD_W }
  } else if (hole) {
    const left = Math.max(GUT, Math.min(hole.left + hole.width / 2 - CARD_W / 2, view.w - CARD_W - GUT))
    tip = { top: hole.top + hole.height + 14, left, width: CARD_W }
  } else {
    tip = { top: '50%', left: '50%', width: CARD_W, transform: 'translate(-50%, -50%)' }
  }
  // While search is open the caption moves to the bottom, clear of it.
  if (live && stop?.act === 'search') tip = { bottom: phone ? GUT : 32, left: phone ? GUT : '50%', width: phone ? view.w - GUT * 2 : CARD_W, transform: phone ? undefined : 'translateX(-50%)' }

  const Icon = stop.icon
  const last = index >= stops.length - 1
  return wrap(
    <>
      {!live && (hole
        ? <div className="zi-hole" style={hole} />
        : <div className="zi-scrim" />)}
      {/* The page under the tour stays still. */}
      {!live && <div className="zi-catch" aria-hidden />}

      {mode === 'story' && cursor && !reduce.current && (
        <div className="zi-cur" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }} aria-hidden>
          <span key={cursor.tap} className="zi-tap" />
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 8-6 1.6L10 19z" fill="var(--obsidian)" stroke="var(--card)" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
      )}

      <div key={index} className="zi-tip" style={{ position: 'fixed', ...tip }} role="dialog" aria-live="polite" aria-labelledby="zi-step">
        <div className="flex items-center gap-2.5">
          <span className="zi-pt-ico"><Icon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
          <h3 id="zi-step" className="zi-step-t">{stop.title(t, phone)}</h3>
          <span className="zi-count">{t.intro.stepOf.replace('{n}', String(index + 1)).replace('{total}', String(stops.length))}</span>
        </div>
        <p className="zi-step-b">{stop.body(t, phone)}</p>
        {mode === 'story' ? (
          <div className="zi-foot">
            <div className="zi-prog" aria-hidden><i style={{ transform: `scaleX(${progress})` }} /></div>
            <button type="button" className="zi-btn-q zi-sm" onClick={finish}>{t.intro.skip}</button>
          </div>
        ) : (
          <div className="zi-foot">
            <div className="zi-dots" aria-hidden>
              {stops.map((s, i) => <i key={s.key} data-on={i === index ? '' : undefined} data-done={i < index ? '' : undefined} />)}
            </div>
            <div className="flex items-center gap-2">
              {index > 0 && <button type="button" className="zi-btn-q zi-sm" onClick={() => setIndex(index - 1)}>{t.intro.back}</button>}
              <button type="button" className="zi-btn zi-sm" onClick={() => (last ? finish() : setIndex(index + 1))} autoFocus>
                {last ? t.intro.start : t.intro.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
  )
}
