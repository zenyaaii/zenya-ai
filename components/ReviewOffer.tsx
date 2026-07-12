'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Copy, Check, ArrowLeft } from 'lucide-react'

/**
 * ReviewOffer — shown on the generation waiting screen: while the AI builds the
 * site, invite the user to share feedback and, as a thank-you, reveal a promo
 * code for 30% off their first month.
 *
 * IMPORTANT (honest by design): the reward is for SHARING FEEDBACK, never
 * conditional on a positive or public review — so it stays compliant with
 * review-platform policies and with Zenya's "no fake data" principle. Opening
 * the feedback page happens in a NEW TAB so the in-progress generation is never
 * interrupted. The code itself is a real Stripe promotion code restricted to
 * first-time customers, so it only ever discounts a genuine first month.
 */

const PROMO_CODE = process.env.NEXT_PUBLIC_REVIEW_PROMO_CODE || 'SHUKRAN30'
const UNLOCK_KEY = 'zenya:review-code-unlocked'
const REVIEW_URL = '/contact?topic=review'

export default function ReviewOffer() {
  const [unlocked, setUnlocked] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(UNLOCK_KEY) === '1') setUnlocked(true)
    } catch {}
  }, [])

  function share() {
    try {
      window.open(REVIEW_URL, '_blank', 'noopener,noreferrer')
    } catch {}
    setUnlocked(true)
    try { localStorage.setItem(UNLOCK_KEY, '1') } catch {}
    // Persist the code to the user's account (best-effort) so it lives in
    // Settings → "أكواد الخصم" and survives this overlay being dismissed.
    // Silently no-ops for logged-out visitors (401).
    try {
      fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: PROMO_CODE }),
        keepalive: true,
      }).catch(() => {})
    } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="mx-6 w-full max-w-sm overflow-hidden rounded-2xl border bg-white p-5 text-center"
      style={{ borderColor: 'rgba(94,106,210,0.28)', boxShadow: '0 24px 60px -28px rgba(94,106,210,0.45)' }}
    >
      <span
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }}
      >
        <Gift className="h-5 w-5" strokeWidth={2} />
      </span>

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="pitch" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <h3 className="text-[15.5px] font-bold text-foreground">
              شاركنا رأيك، واحصل على خصم <span className="gradient-text">30% على أول شهر.</span>
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-[1.8] text-muted">
              بينما نجهّز موقعك، أخبرنا بتجربتك بصراحة — رأيك يساعدنا على التحسّن. نشكرك بكود خصم فورًا،
              مهما كان رأيك.
            </p>
            <button
              type="button"
              onClick={share}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-[13.5px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
            >
              شاركنا رأيك
              <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.5} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="text-[15.5px] font-bold text-foreground">شكرًا لك 💛 هذا كودك:</h3>
            <button
              type="button"
              onClick={copy}
              aria-label="نسخ كود الخصم"
              className="mx-auto mt-3 flex items-center gap-3 rounded-xl border border-dashed px-4 py-2.5 transition-colors hover:bg-[rgba(94,106,210,0.04)]"
              style={{ borderColor: 'rgba(94,106,210,0.5)' }}
            >
              <span className="font-latin text-[18px] font-extrabold tracking-[0.12em] text-primary" dir="ltr">
                {PROMO_CODE}
              </span>
              {copied ? (
                <Check className="h-4 w-4 text-[#27a644]" strokeWidth={2.5} />
              ) : (
                <Copy className="h-4 w-4 text-muted" strokeWidth={2} />
              )}
            </button>
            <p className="mx-auto mt-3 max-w-xs text-[12.5px] leading-[1.7] text-muted">
              أدخِله عند الدفع لتحصل على 30% خصم على أول شهر من اشتراكك.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
