'use client'

/* ─────────────────────────────────────────────────────────────────────────
 * Entry-tier warmth: a post-checkout celebration overlay, a one-time welcome
 * banner, and a gentle "you're out of generations" nudge — all carrying real
 * Arabic du'a (بارك الله فيك / أعانك الله / رزقك الله / وفقك الله / ما شاء الله).
 *
 * Restraint by design: slow gold shimmer (not confetti), no audio, no imagery
 * of people, and every animation collapses to a calm static state under
 * `prefers-reduced-motion`. Blessings are used sincerely, matched to the
 * moment — thanks on payment, encouragement on start, barakah on the work.
 * ───────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Sparkles, ArrowLeft, X } from 'lucide-react'

const GOLD = '#b8860b'
const GOLD_SOFT = 'rgba(200,169,106,0.16)'
const GOLD_RING = 'rgba(200,169,106,0.45)'

const LS_WELCOME = 'zenya_entry_welcome_seen'

/* Plan-specific headline for the post-checkout moment. Entry is the star,
 * but the same success_url serves every plan, so keep them all graceful. */
function planCopy(plan: string): { head: string; body: string } {
  switch (plan) {
    case 'entry':
      return {
        head: 'تم فتح التوليد',
        body: 'معك الآن قالبان لبناء موقعك بالذكاء الاصطناعي. أعانك الله ورزقك التوفيق في مشروعك.',
      }
    case 'starter':
      return { head: 'تم تفعيل Starter', body: 'توليد بلا حدود بين يديك الآن. أعانك الله على البناء.' }
    case 'pro':
      return { head: 'تم تفعيل Pro', body: 'التوليد والاستضافة مفتوحان بالكامل. رزقك الله التوفيق.' }
    default:
      return { head: 'تم تفعيل خطتك', body: 'كل شيء جاهز للبدء. أعانك الله ووفقك.' }
  }
}

/* ── Gold shimmer field ──────────────────────────────────────────────────── */
function Shimmer() {
  const reduce = useReducedMotion()
  // Stable per-mount so the dots don't reshuffle on re-render.
  const dots = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 61) % 100,
        delay: (i % 8) * 0.45,
        dur: 5.5 + (i % 5) * 0.9,
        size: 4 + (i % 3) * 2,
        drift: (i % 2 ? 1 : -1) * (8 + (i % 4) * 6),
      })),
    []
  )
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <span
          key={i}
          className="zenya-shimmer-dot"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
            ['--drift' as any]: `${d.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Post-checkout celebration overlay ───────────────────────────────────── */
export function CheckoutCelebration() {
  const reduce = useReducedMotion()
  const [state, setState] = useState<{ open: boolean; plan: string }>({ open: false, plan: 'entry' })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') !== 'success') return
    const plan = params.get('plan') || 'entry'
    setState({ open: true, plan })
    // A grandfathered/paid Entry account has already seen the welcome — the
    // overlay is a stronger moment, so don't double up with the banner later.
    try { localStorage.setItem(LS_WELCOME, '1') } catch { /* ignore */ }
    // Strip the query so a refresh doesn't replay the celebration.
    const clean = window.location.pathname + window.location.hash
    window.history.replaceState(null, '', clean)
  }, [])

  const close = () => setState((s) => ({ ...s, open: false }))
  const { head, body } = planCopy(state.plan)

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-[rgba(20,18,12,0.55)] backdrop-blur-[3px]" />

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border bg-white px-8 pb-8 pt-10 text-center shadow-[0_30px_80px_-24px_rgba(120,90,10,0.45)]"
            style={{ borderColor: GOLD_RING }}
          >
            {/* Warm radial wash + shimmer */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'radial-gradient(90% 70% at 50% 0%, rgba(200,169,106,0.16), transparent 68%)' }}
            />
            <Shimmer />

            <button
              onClick={close}
              aria-label="إغلاق"
              className="absolute left-4 top-4 z-10 rounded-full p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2.25} />
            </button>

            <div className="relative">
              {/* Crest */}
              <motion.div
                initial={reduce ? {} : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: GOLD_SOFT, boxShadow: `0 0 0 1px ${GOLD_RING} inset, 0 12px 30px -10px rgba(200,169,106,0.55)` }}
              >
                <Sparkles className="h-8 w-8" strokeWidth={1.75} style={{ color: GOLD }} />
              </motion.div>

              <div className="text-[12px] font-bold tracking-[0.16em]" style={{ color: GOLD }}>
                بارك الله فيك
              </div>
              <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-tight text-foreground">
                {head}
              </h2>
              <p className="mx-auto mt-2.5 max-w-xs text-[13.5px] leading-[1.65] text-muted">
                {body}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/theme/new"
                  onClick={close}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold text-white transition hover:scale-[1.02]"
                  style={{ background: 'var(--primary, #5e6ad2)', boxShadow: '0 12px 30px -10px rgba(94,106,210,0.6)' }}
                >
                  ابدأ أول قالب
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                </Link>
                <button
                  onClick={close}
                  className="rounded-full px-5 py-2 text-[12.5px] font-medium text-muted transition hover:text-foreground"
                >
                  إلى لوحتي
                </button>
              </div>

              <div className="mt-5 border-t border-black/5 pt-3 text-[11.5px] font-medium" style={{ color: GOLD }}>
                وفقك الله في مشروعك
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── One-time Entry welcome banner (dismissible, persists via localStorage) ─ */
export function EntryWelcomeBanner({ trialRemaining }: { trialRemaining: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_WELCOME) !== '1') setShow(true)
    } catch { /* ignore */ }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(LS_WELCOME, '1') } catch { /* ignore */ }
    setShow(false)
  }

  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-6 overflow-hidden rounded-2xl border px-5 py-4"
      style={{ borderColor: GOLD_RING, background: 'linear-gradient(90deg, rgba(200,169,106,0.12), rgba(200,169,106,0.04))' }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: GOLD_SOFT, boxShadow: `0 0 0 1px ${GOLD_RING} inset` }}
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.9} style={{ color: GOLD }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold tracking-[0.14em]" style={{ color: GOLD }}>
            أعانك الله
          </div>
          <p className="mt-0.5 text-[13.5px] font-semibold text-foreground">ابدأ رحلتك مع زينيا</p>
          <p className="mt-0.5 text-[12.5px] leading-[1.55] text-muted">
            {trialRemaining > 0
              ? `معك ${trialRemaining} ${trialRemaining === 2 ? 'قالبان' : 'قالب'} لتوليدهما بالذكاء الاصطناعي. المعاينة والتعديل غير محدودين ومجّانيان.`
              : 'التعديل والمعاينة على مواقعك غير محدودين. للتوليد من جديد انتقل إلى Starter.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/theme/new"
            onClick={dismiss}
            className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--primary, #5e6ad2)' }}
          >
            أنشئ موقعك الأول
          </Link>
          <button
            onClick={dismiss}
            aria-label="إخفاء"
            className="rounded-full p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Entry "out of generations" nudge — warm, not scolding ────────────────── */
export function EntrySpentBanner() {
  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{ borderColor: GOLD_RING, background: GOLD_SOFT }}
    >
      <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: GOLD }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground">استخدمت قالبيك — رزقك الله التوفيق فيهما</p>
        <p className="mt-0.5 text-[12.5px] leading-[1.55] text-muted">
          مواقعك محفوظة، والتعديل عليها يبقى مجّانيًا. للتوليد بلا حدود انتقل إلى Starter.
        </p>
      </div>
      <Link
        href="/pricing?upgrade=starter"
        className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition hover:opacity-90"
        style={{ background: 'var(--primary, #5e6ad2)' }}
      >
        الترقية إلى Starter · 14.99$
      </Link>
    </div>
  )
}
