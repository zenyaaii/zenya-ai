'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Star, X } from 'lucide-react'

/**
 * Persistent "rate Zenya" launcher — refined, premium styling.
 *
 * Pinned to the bottom-start corner on every public page (mounted from the
 * marketing layout, so it never appears inside a generated/customer theme).
 * Links to our one honest review channel — /contact?topic=review. We do NOT
 * fake reviews; this simply makes the invitation reachable from anywhere.
 *
 * - Dismissible; remembered in localStorage so it won't nag.
 * - Collapses to a compact medallion once the label has been seen.
 * - A slow shimmer + soft glow draw the eye without being obnoxious.
 */

const DISMISS_KEY = 'zenya:review-cta-dismissed'
const SEEN_KEY = 'zenya:review-cta-seen'

// Routes where the CTA is redundant or in the way.
const HIDDEN_PREFIXES = ['/contact', '/login', '/checkout', '/auth', '/dashboard', '/accounts', '/theme', '/editor', '/builder']

export default function ReviewFloatingButton() {
  const pathname = usePathname() || '/'
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(true) // assume hidden until we read storage (avoids flash)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    setMounted(true)
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
      setExpanded(localStorage.getItem(SEEN_KEY) !== '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
  }

  function dismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  const hidden =
    !mounted ||
    dismissed ||
    HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.9 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          onMouseEnter={() => setExpanded(true)}
          className="fixed bottom-5 start-5 z-40 print:hidden"
        >
          <Link
            href="/contact?topic=review"
            onClick={markSeen}
            aria-label="قيّم تجربتك مع زينيا"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl py-2.5 ps-2.5 pe-4 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(94,106,210,0.22)',
              boxShadow:
                '0 10px 30px -10px rgba(94,106,210,0.45), 0 2px 6px rgba(28,28,28,0.06), 0 0 0 1px rgba(255,255,255,0.6) inset',
            }}
          >
            {/* Slow shimmer sweep */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -inset-x-1/2 w-1/2 skew-x-[-18deg]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(94,106,210,0.14), transparent)' }}
                animate={{ x: ['-30%', '260%'] }}
                transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.6 }}
              />
            )}

            {/* Medallion with soft pulsing glow */}
            <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(94,106,210,0.45), transparent 70%)' }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                />
              )}
              <span
                className="relative flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #6b78e0 0%, #5e6ad2 55%, #4954c9 100%)',
                  boxShadow: '0 4px 12px -2px rgba(73,84,201,0.55), 0 0 0 1px rgba(255,255,255,0.25) inset',
                }}
              >
                <Star className="h-4 w-4 fill-white text-white" strokeWidth={2} />
              </span>
            </span>

            {/* Label */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col overflow-hidden whitespace-nowrap leading-tight"
                >
                  <span className="text-[13.5px] font-semibold text-foreground">قيّم تجربتك</span>
                  <span className="text-[11px] font-medium text-primary">واحصل على خصم</span>
                </motion.span>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={dismiss}
              aria-label="إخفاء"
              className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-muted/60 transition hover:bg-[rgba(28,28,28,0.06)] hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
