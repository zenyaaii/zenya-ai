'use client'

/**
 * WelcomeTour — a one-time guided tour on the owner's first dashboard visit.
 *
 * It first asks, in big words, whether they'd like a quick tour. If yes, it
 * runs a spotlight walkthrough: the whole page dims and each real sidebar
 * button lights up one at a time with a one-sentence explanation, so the owner
 * literally sees *where* each page is. Next / Back move through them; any exit
 * marks it seen so it never shows again.
 *
 * Targets are found by the `data-tour="<slug>"` attributes on the sidebar rows
 * (see components/app/Sidebar.tsx). On small screens the sidebar is a hidden
 * drawer, so when a target can't be measured the step falls back to a centered
 * card with the same explanation.
 */

import { useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

const LS_KEY = 'zenya_welcome_seen_v2'

type Step = { slug: string; title: string; desc: string }

/** One sentence each, matched to the real sidebar rows they highlight. */
function buildTour(t: Messages): Step[] {
  return [
    { slug: 'home',      title: t.nav.dashboard, desc: t.tour.dashboardBody },
    { slug: 'sites',     title: t.nav.sites,     desc: t.tour.sitesBody },
    { slug: 'analytics', title: t.nav.analytics, desc: t.tour.analyticsBody },
    { slug: 'seo',       title: t.nav.seo,       desc: t.tour.seoBody },
    { slug: 'bookings',  title: t.nav.bookings,  desc: t.tour.bookingsBody },
    { slug: 'domains',   title: t.nav.domains,   desc: t.tour.domainsBody },
  ]
}

const TIP_W = 300

export default function WelcomeTour() {
  const t = useT()
  const TOUR = buildTour(t)
  const [stage, setStage] = useState<'hidden' | 'ask' | 'tour'>('hidden')
  const [mounted, setMounted] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    setMounted(true)
    // If this browser already saw it, never show again — no flash, no fetch race.
    let seenLocally = false
    try { seenLocally = !!window.localStorage.getItem(LS_KEY) } catch {}
    if (seenLocally) return

    // Fresh browser: the server row is the source of truth, so the tour doesn't
    // replay just because the owner opened the dashboard on a new device.
    let cancelled = false
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
        setStage('ask')
      } catch {
        // Offline / API down — fall back to showing it (localStorage still guards repeats).
        if (!cancelled) setStage('ask')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Measure the highlighted sidebar row for the current step, keeping it in
  // sync on resize / scroll. Null rect → centered fallback.
  useLayoutEffect(() => {
    if (stage !== 'tour') return
    function measure() {
      const el = document.querySelector(`[data-tour="${TOUR[index].slug}"]`)
      const r = el?.getBoundingClientRect()
      setRect(r && r.width > 0 && r.height > 0 ? r : null)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [stage, index])

  function close() {
    try { window.localStorage.setItem(LS_KEY, '1') } catch {}
    // Persist server-side too, so no other device replays the tour.
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ welcomeSeen: true }),
    }).catch(() => {})
    setStage('hidden')
  }

  function next() {
    if (index >= TOUR.length - 1) close()
    else setIndex((i) => i + 1)
  }
  function back() {
    setIndex((i) => Math.max(0, i - 1))
  }

  if (!mounted || stage === 'hidden') return null

  // ── Ask stage: big yes/no modal ──────────────────────────────────────────
  if (stage === 'ask') {
    return createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl"
        >
          <div className="absolute inset-0 bg-[#16171b]/45 backdrop-blur-sm" onClick={close} aria-hidden />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-token bg-white px-8 pb-8 pt-10 text-center shadow-2xl"
            role="dialog" aria-modal="true"
          >
            <button
              type="button" onClick={close}
              className="absolute end-3.5 top-3.5 rounded-full p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground"
              aria-label={t.tour.close}
            >
              <X className="h-4 w-4" />
            </button>
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'white', boxShadow: '0 10px 30px -8px rgba(94,106,210,0.45), 0 0 0 1px rgba(94,106,210,0.2) inset' }}
            >
              <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
            <h2 className="display-ar text-[30px] font-bold leading-tight tracking-tight text-foreground">
              {t.tour.welcomeTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-[15px] leading-[1.6] text-muted">
              {t.tour.welcomeBody}
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row-reverse sm:justify-center">
              <button
                type="button" onClick={() => { setIndex(0); setStage('tour') }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02]"
              >
                {t.tour.welcomeYes}
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button" onClick={close}
                className="rounded-full border border-token px-7 py-3 text-[15px] font-medium text-muted transition hover:bg-black/[0.03] hover:text-foreground"
              >
                {t.tour.welcomeNo}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    )
  }

  // ── Tour stage: spotlight walkthrough ────────────────────────────────────
  const step = TOUR[index]
  const pad = 8
  const hole = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null

  // Tooltip placement: to the inner side of the highlighted row; flips or
  // centers when there's no room (or no target on mobile).
  let tipStyle: React.CSSProperties
  if (hole) {
    let left = hole.left - TIP_W - 14
    if (left < 12) left = hole.left + hole.width + 14
    if (left + TIP_W > window.innerWidth - 12) left = window.innerWidth - TIP_W - 12
    const top = Math.max(12, Math.min(hole.top, window.innerHeight - 210))
    tipStyle = { position: 'fixed', top, left, width: TIP_W }
  } else {
    tipStyle = {
      position: 'fixed', width: TIP_W,
      top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" dir="rtl">
      {/* Dim + spotlight hole (box-shadow paints everything outside the hole). */}
      {hole ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-white/80"
          style={{
            top: hole.top, left: hole.left, width: hole.width, height: hole.height,
            boxShadow: '0 0 0 9999px rgba(22,23,27,0.66)',
            transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#16171b]/66" />
      )}

      {/* Click-catcher over the dim area so the page underneath stays inert. */}
      <div className="absolute inset-0" onClick={next} aria-hidden />

      {/* Tooltip */}
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        style={tipStyle}
        className="z-10 rounded-2xl border border-token bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tabular-nums text-primary">
            {index + 1} / {TOUR.length}
          </span>
          <button
            type="button" onClick={close}
            className="rounded-full p-1 text-muted transition hover:bg-black/5 hover:text-foreground"
            aria-label={t.tour.finishTour}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h3 className="mt-1.5 text-[16px] font-bold tracking-tight text-foreground">{step.title}</h3>
        <p className="mt-1 text-[13px] leading-[1.55] text-muted">{step.desc}</p>

        <div className="mt-3.5 flex items-center justify-between">
          <button
            type="button" onClick={close}
            className="text-[12px] font-medium text-muted transition hover:text-foreground"
          >
            {t.tour.skip}
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button" onClick={back}
                className="inline-flex items-center gap-1 rounded-full border border-token px-3.5 py-1.5 text-[12.5px] font-semibold text-foreground transition hover:bg-black/[0.03]"
              >
                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                {t.tour.previous}
              </button>
            )}
            <button
              type="button" onClick={next}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm shadow-primary/25 transition hover:scale-[1.03]"
            >
              {index >= TOUR.length - 1 ? t.tour.finish : t.tour.next}
              {index < TOUR.length - 1 && <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
