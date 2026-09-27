'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronDown } from 'lucide-react'

/**
 * AiContentDisclaimer — the honesty gate every generator shows once before the
 * first build. It lists only what the owner left empty and the AI will write
 * in their place, so an owner who typed in their own reviews is not told the
 * reviews are invented. When nothing is left for the AI, the box is skipped.
 * Shared by every generator so the wording, and the legal text, never drift.
 */

export type AiFill = 'reviews' | 'people' | 'rating' | 'certs' | 'prices' | 'text'

const LABELS: Record<AiFill, string> = {
  reviews: 'آراء العملاء',
  people: 'أسماء الفريق وسيرهم',
  rating: 'متوسط التقييم وعدد المراجعات',
  certs: 'الشهادات والجوائز',
  prices: 'الأسعار وتفاصيل الخدمات',
  text: 'الأوصاف والنصوص التي تركتها فارغة',
}

const ORDER: AiFill[] = ['reviews', 'rating', 'people', 'certs', 'prices', 'text']

const LEGAL =
  'بالمتابعة، تُقرّ بأن هذه التفاصيل أمثلة مولَّدة لإكمال تصميم الموقع فقط، وأن مسؤوليتك مراجعتها واستبدالها بمحتواك وتقييماتك الحقيقية قبل النشر. زينيا غير مسؤولة — أمام الله ولا أمام أي عميل يشتري منك — عن أي ضرر ينتج عن نشر معلومات أو مراجعات غير صحيحة.'

export default function AiContentDisclaimer({
  open,
  onClose,
  onConfirm,
  items,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  /** What the owner left empty. Omitted: assume only free text. */
  items?: AiFill[]
}) {
  const [more, setMore] = useState(false)
  const list = ORDER.filter((k) => (items ?? ['text']).includes(k))
  const nothing = list.length === 0

  // Everything was filled in by the owner: nothing to warn about.
  useEffect(() => {
    if (open && nothing) onConfirm()
  }, [open, nothing, onConfirm])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || nothing) return null
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(17,17,17,0.42)] p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-fill-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_0_0_1px_rgba(17,17,17,0.08),0_24px_60px_-20px_rgba(17,17,17,0.35)]"
        dir="rtl"
      >
        <div className="flex items-start gap-3 border-b border-[rgba(17,17,17,0.08)] px-6 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#171717] text-white"><Sparkles size={18} strokeWidth={2} aria-hidden /></span>
          <div>
            <h2 id="ai-fill-title" className="text-[18px] font-extrabold leading-snug text-[#171717]">لم تضف هذه، فسنكتب لها أمثلة</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-[#56565a]">حتى يكتمل تصميم موقعك. ليست معلومات حقيقية، فاستبدلها بمعلوماتك قبل النشر.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          <ul className="divide-y divide-[rgba(17,17,17,0.07)]">
            {list.map((k) => (
              <li key={k} className="flex items-center gap-3 py-3 text-[14.5px] font-medium text-[#171717]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[rgba(94,106,210,0.12)] text-[#5e6ad2]"><Sparkles size={11} strokeWidth={2.4} aria-hidden /></span>
                {LABELS[k]}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            className="mt-2 inline-flex items-center gap-1 rounded-md text-[13.5px] font-bold text-[#56565a] hover:text-[#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5e6ad2]"
          >
            المسؤولية
            <ChevronDown size={15} className={more ? 'rotate-180 transition' : 'transition'} aria-hidden />
          </button>
          {more ? <p className="mt-2 rounded-xl bg-[#f4f4f6] p-3 text-[13px] leading-[1.8] text-[#56565a]">{LEGAL}</p> : null}
        </div>

        <div className="flex gap-2 border-t border-[rgba(17,17,17,0.08)] px-6 py-4">
          <button type="button" onClick={onConfirm} className="min-h-[46px] flex-1 rounded-full bg-[#171717] px-6 text-[14.5px] font-bold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e6ad2]">
            فهمت، أكمل التوليد
          </button>
          <button type="button" onClick={onClose} className="min-h-[46px] rounded-full px-5 text-[14.5px] font-bold text-[#171717] shadow-[0_0_0_1px_rgba(17,17,17,0.12)] hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5e6ad2]">
            رجوع
          </button>
        </div>
      </motion.div>
    </div>
  )
}
