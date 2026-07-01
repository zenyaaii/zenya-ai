'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Star, X } from 'lucide-react'

/**
 * Persistent "rate Zenya" launcher.
 *
 * Pinned to the bottom-start corner on every public page (mounted from the
 * marketing layout, so it never appears inside a generated/customer theme).
 * It links to our one honest review channel — /contact?topic=review — the same
 * destination as the homepage "share your experience" invite. We do NOT fake
 * reviews, so this simply makes the invitation reachable from anywhere.
 *
 * - Dismissible; the choice is remembered in localStorage so it won't nag.
 * - Collapses to a single star FAB once the user has seen the label once.
 * - A gentle, infrequent wiggle draws the eye without being obnoxious.
 */

const DISMISS_KEY = 'zenya:review-cta-dismissed'
const SEEN_KEY = 'zenya:review-cta-seen'

// Routes where the CTA is redundant or in the way.
const HIDDEN_PREFIXES = ['/contact', '/login', '/checkout', '/auth', '/dashboard', '/theme', '/editor', '/builder']

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
      // After the first visit we keep it compact so it stays out of the way.
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
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
          className="fixed bottom-5 start-5 z-40 print:hidden"
        >
          <Link
            href="/contact?topic=review"
            onClick={markSeen}
            onMouseEnter={() => setExpanded(true)}
            aria-label="قيّم تجربتك مع زينيا"
            className="group flex items-center gap-2.5 rounded-full bg-foreground py-2.5 ps-2.5 pe-4 text-white shadow-[0_14px_38px_-10px_rgba(28,28,28,0.55)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_-12px_rgba(94,106,210,0.6)]"
          >
            <motion.span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #f6c453 0%, #d97706 100%)' }}
              animate={reduce ? undefined : { rotate: [0, -12, 12, -8, 0] }}
              transition={reduce ? undefined : { duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
            >
              <Star className="h-4 w-4 fill-white text-white" strokeWidth={2} />
            </motion.span>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden whitespace-nowrap text-[13.5px] font-semibold"
                >
                  قيّم تجربتك
                </motion.span>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={dismiss}
              aria-label="إخفاء"
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
