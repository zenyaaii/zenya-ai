'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell, CalendarCheck, CircleUser, LayoutGrid, Moon, Pause, Pencil, Play, Plus, Search, Sparkles, X, type LucideIcon,
} from 'lucide-react'
import { useLocale, useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { dashFont } from '../dash-font'

/**
 * The introduction to the dashboard, shown once to every account.
 *
 * A card asks first. If the owner says yes, the tour plays by itself, about
 * 30 seconds: a pointer moves to each control in the frame and uses it — it
 * opens search and types a word, flips the theme and back, opens the phone's
 * More sheet — while a caption says what it is. A progress bar, a pause and a
 * skip sit on the caption. Under reduced motion there is no pointer and
 * nothing is used for the owner: the same stops are walked with Next / Back.
 *
 * Any way out marks it seen, in this browser and on the profile (introSeen on
 * /api/onboarding), so it never plays again on its own. The account menu
 * plays it again (INTRO_REPLAY_EVENT).
 *
 * TARGETS ARE FOUND BY NAME. Each stop looks for [data-tour="…"], which
 * DashFrame and the top-bar tools carry, and uses whichever copy is on screen
 * (the nav is the rail on a laptop and the dock on a phone). A stop whose
 * target is missing still shows its caption, in the middle.
 *
 * It portals to <body>, so it carries .zy-dash and the faces itself.
 */

/** Fire this on window to play the tour again (the account menu does). */
export const INTRO_REPLAY_EVENT = 'beynoun:intro-replay'

// v2: the tour for the 2026-10 dashboard. Owners who saw the old one see this.
const LS_KEY = 'beynoun_intro_v2'

type Stop = {
  key: string
  icon: LucideIcon
  title: (t: Messages, phone: boolean) => string
  body: (t: Messages, phone: boolean) => string
  /** What the tour does at this stop, after the pointer lands. */
  act?: 'search' | 'theme' | 'more'
}

const STOPS: Stop[] = [
  { key: 'nav', icon: LayoutGrid, act: 'more',
    title: (t, p) => (p ? t.intro.navTitlePhone : t.intro.navTitle),
    body: (t, p) => (p ? t.intro.navBodyPhone : t.intro.navBody) },
  { key: 'edit-site', icon: Pencil, title: (t) => t.intro.editTitle, body: (t) => t.intro.editBody },
  { key: 'bookings', icon: CalendarCheck, title: (t) => t.intro.bookingsTitle, body: (t) => t.intro.bookingsBody },
  { key: 'search', icon: Search, act: 'search', title: (t) => t.intro.searchTitle, body: (t) => t.intro.searchBody },
  { key: 'theme', icon: Moon, act: 'theme', title: (t) => t.intro.themeTitle, body: (t) => t.intro.themeBody },
  { key: 'new-site', icon: Plus, title: (t) => t.intro.newSiteTitle, body: (t) => t.intro.newSiteBody },
  { key: 'bell', icon: Bell, title: (t) => t.intro.bellTitle, body: (t) => t.intro.bellBody },
  { key: 'account', icon: CircleUser, title: (t) => t.intro.accountTitle, body: (t) => t.intro.accountBody },
]

/** How long the tour stays on each stop, in ms. Stops that act get longer. */
const DWELL = { plain: 4200, act: 6200 }
const TOTAL = STOPS.reduce((s, x) => s + (x.act ? DWELL.act : DWELL.plain), 0)
const PAD = 6
const GUT = 16
const CARD_W = 330
/** Below this the rail is the dock (DashFrame's lg breakpoint). */
const RAIL_MIN = 1024

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function findTarget(key: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`))
  return all.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
  }) || null
}

/**
 * Bring a target in the page (not the frame) on screen: the site card's edit
 * button sits below the fold on a phone. Returns whether it scrolled.
 */
function reveal(key: string, smooth: boolean): boolean {
  const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)).find((e) => {
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && !e.closest('.zf-top, .zf-side, .zf-dock')
  })
  if (!el) return false
  const r = el.getBoundingClientRect()
  // Clear of the sticky bar at the top and the dock at the bottom.
  if (r.top >= 76 && r.bottom <= window.innerHeight - 100) return false
  el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
  return true
}

const centre = (el: Element) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** Type into a React-controlled input the way a person would. */
function typeInto(input: HTMLInputElement, text: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  set?.call(input, text)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const closeSearch = () =>
  document.querySelector('.zf-pal input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

export default function DashIntro({
  setMore, persist = false, startOpen = false,
}: {
  /** Opens / closes the phone's More sheet. */
  setMore: (open: boolean) => void
  /** The real dashboard: show it once per account and remember it. */
  persist?: boolean
  /** Open on mount whatever was seen (the demo's ?intro). */
  startOpen?: boolean
}) {
  const t = useT()
  const { dir } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [stage, setStage] = useState<'hidden' | 'welcome' | 'tour' | 'done'>('hidden')
  /** A brand-new account is welcomed; one that knew the old dashboard is told what changed. */
  const [fresh, setFresh] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [view, setView] = useState({ w: 1440, h: 900 })
  /** While the tour is using a control (search open, theme flipping, sheet up)
   *  the dim steps aside so the real thing shows. */
  const [live, setLive] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number; tap: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  /** Bumped to stop a running tour: each run checks it is still the latest. */
  const run = useRef(0)
  const [manual, setManual] = useState(false)

  const phone = view.w < RAIL_MIN
  const stop = STOPS[index]

  useEffect(() => {
    setMounted(true)
    setManual(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    setView({ w: window.innerWidth, h: window.innerHeight })

    const replay = () => { setIndex(0); setStage('tour') }
    window.addEventListener(INTRO_REPLAY_EVENT, replay)

    let cancelled = false
    if (startOpen) setStage('welcome')
    else if (persist) {
      let seen = false
      try { seen = !!window.localStorage.getItem(LS_KEY) } catch {}
      // A new browser asks the profile, so another device does not replay it.
      if (!seen) {
        ;(async () => {
          try {
            const r = await fetch('/api/onboarding', { cache: 'no-store' })
            if (cancelled) return
            if (r.ok) {
              const j = await r.json()
              if (j?.introSeen) {
                try { window.localStorage.setItem(LS_KEY, '1') } catch {}
                return
              }
              setFresh(!j?.welcomeSeen)
            }
          } catch {
            if (cancelled) return
          }
          // Offline or API down: show it; this browser still remembers.
          setStage((s) => (s === 'hidden' ? 'welcome' : s))
        })()
      }
    }
    return () => {
      cancelled = true
      window.removeEventListener(INTRO_REPLAY_EVENT, replay)
    }
  }, [persist, startOpen])

  const markSeen = useCallback(() => {
    if (!persist) return
    try { window.localStorage.setItem(LS_KEY, '1') } catch {}
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ introSeen: true, welcomeSeen: true }),
    }).catch(() => {})
  }, [persist])

  const measure = useCallback(() => {
    setView({ w: window.innerWidth, h: window.innerHeight })
    const el = stop ? findTarget(stop.key) : null
    setRect(el ? el.getBoundingClientRect() : null)
  }, [stop])

  useLayoutEffect(() => {
    if (stage !== 'tour') return
    // Step by step (reduced motion), the page jumps to a target below the fold.
    if (manual && stop) reveal(stop.key, false)
    measure()
    // The sheet slides for ~420ms; measure again once it has landed.
    const settle = window.setTimeout(measure, 480)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [stage, index, live, measure, manual, stop])

  const end = useCallback(() => {
    run.current++
    setMore(false)
    setLive(false)
    setCursor(null)
    closeSearch()
    markSeen()
  }, [markSeen, setMore])

  /** The tour is over (finished, skipped, Escape): say where to find it again. */
  const finish = useCallback(() => { end(); setStage('done') }, [end])
  /** Gone without the tour (the X, "later", the backdrop, the last button). */
  const close = useCallback(() => { end(); setStage('hidden') }, [end])

  // ── the tour plays itself ───────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'tour' || manual) return
    const me = ++run.current
    const alive = () => run.current === me
    let theme0: string | null = null
    try { theme0 = localStorage.getItem('beynoun-dash-theme') } catch {}
    pausedRef.current = false
    setPaused(false)
    setProgress(0)

    let spent = 0
    /** Sleep that stands still while paused and moves the progress bar. */
    const wait = async (ms: number) => {
      let left = ms
      while (left > 0 && alive()) {
        const step = Math.min(left, 100)
        await sleep(step)
        if (pausedRef.current) continue
        left -= step
        spent += step
        setProgress(Math.min(1, spent / TOTAL))
      }
      return alive()
    }
    const tap = () => setCursor((c) => c && { ...c, tap: c.tap + 1 })

    ;(async () => {
      window.scrollTo({ top: 0 })
      setCursor({ x: window.innerWidth / 2, y: window.innerHeight * 0.62, tap: 0 })
      for (let i = 0; i < STOPS.length; i++) {
        if (!alive()) return
        const s = STOPS[i]
        const dwell = s.act ? DWELL.act : DWELL.plain
        const target = spent + dwell
        setIndex(i)
        setLive(false)
        await sleep(60)
        if (reveal(s.key, true) && !(await wait(700))) return
        const el = findTarget(s.key)
        if (el) {
          setCursor((c) => ({ ...centre(el), tap: c?.tap ?? 0 }))
          if (!(await wait(1100))) return

          if (s.act === 'search') {
            tap()
            setLive(true)
            el.click()
            if (!(await wait(500))) return
            const input = document.querySelector<HTMLInputElement>('.zf-pal input')
            const word = dir === 'rtl' ? 'حجز' : 'book'
            for (let k = 1; input && k <= word.length; k++) {
              typeInto(input, word.slice(0, k))
              if (!(await wait(260))) return
            }
            if (!(await wait(1700))) return
            closeSearch()
            setLive(false)
          } else if (s.act === 'theme') {
            tap()
            setLive(true)
            el.click()
            if (!(await wait(2200))) return
            tap()
            el.click()
            if (!(await wait(1300))) return
            // Two flips leave the colours as they were; put back "follow the
            // device" too, if that was the owner's setting.
            try {
              if (theme0) localStorage.setItem('beynoun-dash-theme', theme0)
              else localStorage.removeItem('beynoun-dash-theme')
            } catch {}
            setLive(false)
          } else if (s.act === 'more' && window.innerWidth < RAIL_MIN) {
            const more = document.querySelector<HTMLElement>('.zf-dock [data-tour="more"]')
            if (more) {
              if (!(await wait(900))) return
              setCursor((c) => ({ ...centre(more), tap: (c?.tap ?? 0) + 1 }))
              if (!(await wait(700))) return
              setLive(true)
              setMore(true)
              if (!(await wait(2200))) return
              setMore(false)
              setLive(false)
            }
          }
        }
        if (!(await wait(target - spent))) return
      }
      if (alive()) { setProgress(1); finish() }
    })()

    return () => { run.current++ } // eslint-disable-line react-hooks/exhaustive-deps
  }, [stage, manual]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape ends it, like every overlay on the dashboard. While search is open
  // for the tour, Escape is search's.
  useEffect(() => {
    if (stage === 'hidden') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || live) return
      if (stage === 'tour') finish()
      else close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, live, finish, close])

  if (!mounted || stage === 'hidden') return null

  const wrap = (node: React.ReactNode) =>
    createPortal(<div className={`zy-dash ${dashFont.variable} zi-root`} dir={dir}>{node}</div>, document.body)

  // ── the cards before and after ─────────────────────────────────────────
  if (stage === 'welcome' || stage === 'done') {
    const done = stage === 'done'
    return wrap(
      <>
        <div className="zi-scrim" onClick={close} aria-hidden />
        <div className="zi-modal" role="dialog" aria-modal="true" aria-labelledby="zi-title" aria-describedby="zi-lead">
          <button type="button" className="zy-icon-btn zi-x inline-flex" onClick={close} aria-label={t.intro.close}>
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <span className="zi-badge"><Sparkles className="h-4 w-4" strokeWidth={2} />{fresh ? t.intro.eyebrowNew : t.intro.eyebrow}</span>
          <h2 id="zi-title" className="zi-title">{done ? t.intro.doneTitle : fresh ? t.intro.titleNew : t.intro.title}</h2>
          <p id="zi-lead" className="zi-lead">{done ? t.intro.doneBody : fresh ? t.intro.leadNew : t.intro.lead}</p>
          <div className="zi-actions">
            {done ? (
              <button type="button" className="zi-btn" onClick={close} autoFocus>{t.intro.start}</button>
            ) : (
              <>
                <button type="button" className="zi-btn" onClick={() => { setIndex(0); setStage('tour') }} autoFocus>
                  {t.intro.watch}{!manual && <span className="zi-dim-on">&nbsp;· {t.intro.length}</span>}
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
  if (live && stop.act === 'search') {
    // Search opens at the top; the caption waits at the bottom, clear of it.
    tip = phone
      ? { bottom: GUT, left: GUT, width: view.w - GUT * 2 }
      : { bottom: 32, left: '50%', width: CARD_W, transform: 'translateX(-50%)' }
  } else if (phone) {
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
    // Under the target, unless it sits low (the rail's new-site button): then above.
    tip = hole.top + hole.height < view.h * 0.6
      ? { top: hole.top + hole.height + 14, left, width: CARD_W }
      : { bottom: view.h - hole.top + 14, left, width: CARD_W }
  } else {
    tip = { top: '50%', left: '50%', width: CARD_W, transform: 'translate(-50%, -50%)' }
  }

  const Icon = stop.icon
  const last = index >= STOPS.length - 1
  const pause = () => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current) }
  return wrap(
    <>
      {!live && (hole ? <div className="zi-hole" style={hole} /> : <div className="zi-scrim" />)}
      {/* The page under the tour stays still. */}
      {!live && <div className="zi-catch" aria-hidden />}

      {!manual && cursor && (
        <div className="zi-cur" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }} aria-hidden>
          <span key={cursor.tap} className="zi-tap" />
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 8-6 1.6L10 19z" fill="var(--obsidian)" stroke="var(--card)" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
      )}

      <div key={index} className="zi-tip" style={{ position: 'fixed', ...tip }} role="dialog" aria-live="polite" aria-labelledby="zi-step">
        <div className="flex items-center gap-2.5">
          <span className="zi-pt-ico"><Icon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
          <h3 id="zi-step" className="zi-step-t">{stop.title(t, phone)}</h3>
          <span className="zi-count">{t.intro.stepOf.replace('{n}', String(index + 1)).replace('{total}', String(STOPS.length))}</span>
        </div>
        <p className="zi-step-b">{stop.body(t, phone)}</p>
        {manual ? (
          <div className="zi-foot">
            <div className="zi-dots" aria-hidden>
              {STOPS.map((s, i) => <i key={s.key} data-on={i === index ? '' : undefined} data-done={i < index ? '' : undefined} />)}
            </div>
            <div className="flex items-center gap-2">
              {index > 0 && <button type="button" className="zi-btn-q zi-sm" onClick={() => setIndex(index - 1)}>{t.intro.back}</button>}
              <button type="button" className="zi-btn zi-sm" onClick={() => (last ? finish() : setIndex(index + 1))} autoFocus>
                {last ? t.intro.finish : t.intro.next}
              </button>
            </div>
          </div>
        ) : (
          <div className="zi-foot">
            <div className="zi-prog" aria-hidden><i style={{ transform: `scaleX(${progress})` }} /></div>
            <button type="button" className="zy-icon-btn zi-pause inline-flex" onClick={pause} aria-label={paused ? t.intro.resume : t.intro.pause}>
              {paused ? <Play className="h-4 w-4" strokeWidth={2.2} /> : <Pause className="h-4 w-4" strokeWidth={2.2} />}
            </button>
            <button type="button" className="zi-btn-q zi-sm" onClick={finish}>{t.intro.skip}</button>
          </div>
        )}
      </div>
    </>,
  )
}
