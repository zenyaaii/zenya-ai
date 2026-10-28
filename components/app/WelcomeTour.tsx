'use client'

/**
 * WelcomeTour — a one-time guided tour on the owner's first dashboard visit.
 *
 * It first asks whether they'd like a quick tour. If yes, it runs a spotlight
 * walkthrough: the page dims and each real control lights up in turn with one
 * plain sentence, so the owner sees *where* each page is. Any exit marks it
 * seen, here and on the profile row, so it never replays on its own. The
 * account menu can replay it (REPLAY_EVENT).
 *
 * TARGETS ARE FOUND BY NAME, NOT POSITION. Each step looks for
 * `[data-tour="<slug>"]` — the rail, dock and sheet rows and the "new site"
 * button, all drawn by frame/DashFrame.tsx. A control that moves or is restyled is still
 * found. A step whose target is gone (a page removed, a row renamed without
 * its slug) is skipped rather than shown pointing at nothing.
 *
 * THE PHONE. Below lg the rail is gone: four pages sit in the dock and the
 * rest in the "More" sheet. A rail step whose page is in the dock points at
 * the dock; any other opens the sheet through `setDrawer`. findTarget picks
 * whichever copy is actually on screen. The old tour
 * measured the hidden copy, got a zero rect and fell back to a card in the
 * middle of an undimmed page.
 *
 * It portals to <body>, outside .zy-app, so the root carries .zy-tokens or
 * every var() in it resolves to nothing.
 */

import { useLocale, useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  X, ArrowLeft, ArrowRight, Home, Plus, Folder, MessageSquareQuote, BarChart3,
  CalendarCheck, Globe, type LucideIcon,
} from 'lucide-react'

// v3 (2026-10-11): the rebuilt tour is shown once more to every owner, so a
// browser that saw the old one must not skip it.
const LS_KEY = 'zenya_welcome_seen_v3'

/** Fire this on window to run the tour again (the account menu does). */
export const REPLAY_EVENT = 'zenya:tour-replay'

type Step = { slug: string; inRail: boolean; icon: LucideIcon; title: string; desc: string }

/** One sentence each, matched to the real controls they highlight. */
function buildTour(t: Messages): Step[] {
  return [
    { slug: 'home',      inRail: true,  icon: Home,               title: t.nav.home,      desc: t.tour.homeBody },
    { slug: 'new-site',  inRail: false, icon: Plus,               title: t.nav.newSite,   desc: t.tour.newSiteBody },
    { slug: 'sites',     inRail: true,  icon: Folder,             title: t.nav.sites,     desc: t.tour.sitesBody },
    { slug: 'reviews',   inRail: true,  icon: MessageSquareQuote, title: t.nav.reviews,   desc: t.tour.reviewsBody },
    { slug: 'analytics', inRail: true,  icon: BarChart3,          title: t.nav.analytics, desc: t.tour.analyticsBody },
    { slug: 'bookings',  inRail: true,  icon: CalendarCheck,      title: t.nav.bookings,  desc: t.tour.bookingsBody },
    { slug: 'domains',   inRail: true,  icon: Globe,              title: t.nav.domains,   desc: t.tour.domainsBody },
  ]
}

/** The copy of a target that is on screen — the rail exists twice. */
function findTarget(slug: string): Element | null {
  const all = Array.from(document.querySelectorAll(`[data-tour="${slug}"]`))
  return all.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }) || null
}

const PAD = 6
const GUTTER = 16
const CARD_W = 320
/** Below this the rail is a drawer (AppShell's lg breakpoint). */
const RAIL_MIN = 1024

export default function WelcomeTour({ setDrawer }: { setDrawer: (open: boolean) => void }) {
  const t = useT()
  const { dir } = useLocale()
  const reduce = useReducedMotion()
  const TOUR = buildTour(t)
  const [stage, setStage] = useState<'hidden' | 'ask' | 'tour'>('hidden')
  const [mounted, setMounted] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [view, setView] = useState({ w: 1440, h: 900 })
  /** Which way the owner is walking, so a missing step is skipped the same way. */
  const direction = useRef<1 | -1>(1)

  useEffect(() => {
    setMounted(true)
    function replay() {
      direction.current = 1
      setIndex(0)
      setStage('tour')
    }
    window.addEventListener(REPLAY_EVENT, replay)

    // If this browser already saw it, never show again — no flash, no fetch race.
    let seenLocally = false
    try { seenLocally = !!window.localStorage.getItem(LS_KEY) } catch {}

    // Fresh browser: the server row is the source of truth, so the tour doesn't
    // replay just because the owner opened the dashboard on a new device.
    let cancelled = false
    if (!seenLocally) {
      ;(async () => {
        try {
          const r = await fetch('/api/onboarding', { cache: 'no-store' })
          if (cancelled) return
          if (r.ok) {
            const j = await r.json()
            if (j?.welcomeSeen) {
              try { window.localStorage.setItem(LS_KEY, '1') } catch {}
              return
            }
          }
          setStage((s) => (s === 'hidden' ? 'ask' : s))
        } catch {
          // Offline / API down — fall back to showing it (localStorage still guards repeats).
          if (!cancelled) setStage((s) => (s === 'hidden' ? 'ask' : s))
        }
      })()
    }
    return () => {
      cancelled = true
      window.removeEventListener(REPLAY_EVENT, replay)
    }
  }, [])

  const step = TOUR[index]
  const phone = view.w < RAIL_MIN

  // Rail steps on a phone need the "More" sheet open, unless the page sits in
  // the dock, which is on screen already; everything else needs it shut.
  useEffect(() => {
    if (stage !== 'tour') return
    const inDock = !!document.querySelector(`.zf-dock [data-tour="${step.slug}"]`)
    setDrawer(phone && step.inRail && !inDock)
  }, [stage, index, phone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Measure the current target and keep it in sync on resize / scroll. The
  // drawer mounts a frame after setDrawer, so measure again after two frames;
  // a target still missing after that is skipped.
  useLayoutEffect(() => {
    if (stage !== 'tour') return
    let raf = 0
    let skip = 0
    function measure() {
      setView({ w: window.innerWidth, h: window.innerHeight })
      const r = findTarget(step.slug)?.getBoundingClientRect()
      setRect(r ?? null)
      return !!r
    }
    measure()
    // The sheet slides up over ~420ms; measure once more when it has landed.
    const settle = window.setTimeout(measure, 480)
    raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (measure()) return
      skip = window.setTimeout(() => {
        if (measure()) return
        const nextIndex = index + direction.current
        if (nextIndex < 0 || nextIndex >= TOUR.length) close()
        else setIndex(nextIndex)
      }, 250)
    }))
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(skip)
      window.clearTimeout(settle)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [stage, index]) // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    try { window.localStorage.setItem(LS_KEY, '1') } catch {}
    // Persist server-side too, so no other device replays the tour.
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ welcomeSeen: true }),
    }).catch(() => {})
    setDrawer(false)
    setStage('hidden')
  }

  function next() {
    direction.current = 1
    if (index >= TOUR.length - 1) close()
    else setIndex((i) => i + 1)
  }
  function back() {
    direction.current = -1
    setIndex((i) => Math.max(0, i - 1))
  }

  // Escape ends the tour, like every other overlay on the dashboard.
  useEffect(() => {
    if (stage === 'hidden') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || stage === 'hidden') return null

  // Arrows point the way the reader travels: left in Arabic, right in English.
  const Forward = dir === 'rtl' ? ArrowLeft : ArrowRight
  const Backward = dir === 'rtl' ? ArrowRight : ArrowLeft

  // ── Ask stage ─────────────────────────────────────────────────────────────
  if (stage === 'ask') {
    return createPortal(
      <div className="zy-tokens fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" dir={dir}>
        <div className="zy-tour-scrim absolute inset-0" onClick={close} aria-hidden />
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="zy-tour-card relative w-full max-w-[420px] p-6 sm:p-7"
          role="dialog" aria-modal="true" aria-labelledby="zy-tour-ask"
        >
          <button type="button" onClick={close} className="zy-icon-btn absolute end-3 top-3 inline-flex" aria-label={t.tour.close}>
            <X className="h-4 w-4" />
          </button>
          <div className="zy-eyebrow">{t.tour.welcomeEyebrow}</div>
          <h2 id="zy-tour-ask" className="zy-h1 mt-2">{t.tour.welcomeTitle}</h2>
          <p className="zy-tour-body mt-2.5">
            {t.tour.welcomeBody}
            <span className="block text-[var(--ghost)]">{t.tour.welcomeSteps.replace('{n}', String(TOUR.length))}</span>
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button" className="zy-btn justify-center sm:flex-1"
              onClick={() => { direction.current = 1; setIndex(0); setStage('tour') }}
            >
              {t.tour.welcomeYes} <Forward className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button type="button" className="zy-btn-q justify-center sm:flex-1" onClick={close}>
              {t.tour.welcomeNo}
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    )
  }

  // ── Tour stage: spotlight walkthrough ────────────────────────────────────
  const hole = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  // Card placement. Phone: full width, under the target when it sits in the
  // top half, above it otherwise. Wider: beside a rail row (on whichever side
  // has room, so it works in both directions), or under a top-bar control.
  let tipStyle: React.CSSProperties
  if (phone) {
    const width = view.w - GUTTER * 2
    if (hole && hole.top + hole.height < view.h * 0.5) tipStyle = { top: hole.top + hole.height + 12, left: GUTTER, width }
    else if (hole) tipStyle = { bottom: view.h - hole.top + 12, left: GUTTER, width }
    else tipStyle = { bottom: GUTTER, left: GUTTER, width }
  } else if (hole && !step.inRail) {
    const left = Math.max(GUTTER, Math.min(hole.left + hole.width / 2 - CARD_W / 2, view.w - CARD_W - GUTTER))
    tipStyle = { top: hole.top + hole.height + 12, left, width: CARD_W }
  } else if (hole) {
    let left = hole.left - CARD_W - 16
    if (left < GUTTER) left = hole.left + hole.width + 16
    left = Math.max(GUTTER, Math.min(left, view.w - CARD_W - GUTTER))
    const top = Math.max(GUTTER, Math.min(hole.top - 8, view.h - 240))
    tipStyle = { top, left, width: CARD_W }
  } else {
    tipStyle = { top: '50%', left: '50%', width: CARD_W, transform: 'translate(-50%, -50%)' }
  }

  const Icon = step.icon
  const last = index >= TOUR.length - 1
  return createPortal(
    <div className="zy-tokens fixed inset-0 z-[100]" dir={dir}>
      {/* Dim + spotlight hole (the outer shadow paints everything outside it). */}
      {hole ? (
        <div
          className="zy-tour-hole pointer-events-none absolute"
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
        />
      ) : (
        <div className="zy-tour-scrim absolute inset-0" />
      )}

      {/* Click-catcher so the page underneath stays inert. */}
      <div className="absolute inset-0" aria-hidden />

      <motion.div
        key={index}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', ...tipStyle }}
        className="zy-tour-card p-4"
        role="dialog" aria-modal="true" aria-labelledby="zy-tour-step"
      >
        <div className="flex items-center gap-2.5">
          <span className="zy-tile"><Icon className="h-4 w-4" strokeWidth={2} /></span>
          <h3 id="zy-tour-step" className="zy-h3 flex-1">{step.title}</h3>
          <button type="button" onClick={close} className="zy-icon-btn inline-flex" aria-label={t.tour.finishTour}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="zy-tour-body mt-2">{step.desc}</p>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-1" role="img"
            aria-label={t.tour.stepOf.replace('{n}', String(index + 1)).replace('{total}', String(TOUR.length))}
          >
            {TOUR.map((s, i) => (
              <span key={s.slug} className="zy-tour-dot" data-on={i === index ? '' : undefined} data-done={i < index ? '' : undefined} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button type="button" onClick={back} className="zy-btn-q">
                <Backward className="h-3.5 w-3.5" strokeWidth={2.5} /> {t.tour.previous}
              </button>
            )}
            <button type="button" onClick={next} className="zy-btn" autoFocus>
              {last ? t.tour.finish : t.tour.next}
              {!last && <Forward className="h-3.5 w-3.5" strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
