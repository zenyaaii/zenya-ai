'use client'

import { motion } from 'framer-motion'

/**
 * AiContentDisclaimer — the honesty gate every generator shows once before the
 * first build. Generated sites lean on invented copy (bios, testimonials,
 * ratings, certifications); the merchant must own verifying/replacing it before
 * publishing, and Zenya disclaims responsibility for inaccurate info that gets
 * shipped. Shared across all eight template generators so the wording — and the
 * legal disclaimer — never drift.
 */

const DEFAULT_ITEMS = [
  'التقييمات وآراء العملاء والشهادات',
  'الأسماء والسيَر والمسمّيات (الفريق، الطهاة، المختصّون)',
  'متوسط التقييم وعدد المراجعات',
  'الشهادات والجوائز والعضويات',
  'الأسعار وتفاصيل المنتجات والخدمات',
  'أي وصف أو نصّ يُترك فارغًا فيكتبه الذكاء الاصطناعي',
]

export default function AiContentDisclaimer({
  open,
  onClose,
  onConfirm,
  items = DEFAULT_ITEMS,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  items?: string[]
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="تنبيه بمحتوى مولَّد بالذكاء الاصطناعي"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        dir="rtl"
      >
        <div className="border-b border-token bg-amber-50 px-6 py-5">
          <h2 className="text-base font-bold text-foreground">
            تنبيه — بعض محتوى القالب من إنشاء الذكاء الاصطناعي
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            نملأ الفراغات بأمثلة واقعية حتى يكتمل تصميم موقعك — لكنها ليست معلومات حقيقية.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[13px] text-muted">قد يشمل المحتوى المولَّد:</p>
          <ul className="mt-3 space-y-2">
            {items.map((t) => (
              <li
                key={t}
                className="flex items-start gap-2.5 rounded-xl border border-token bg-surface/60 p-3 text-[13px] text-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-token px-6 py-4">
          <p className="mb-3 text-[12px] leading-relaxed text-muted">
            بالمتابعة، تُقرّ بأن هذه التفاصيل وآراء العملاء أمثلة مولَّدة لإكمال تصميم الموقع
            فقط، وأن مسؤوليتك مراجعتها واستبدالها بمحتواك وتقييماتك الحقيقية قبل النشر. زينيا
            غير مسؤولة — أمام الله ولا أمام أي عميل يشتري منك — عن أي ضرر ينتج عن نشر معلومات
            أو مراجعات غير صحيحة.
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-black/5"
            >
              رجوع
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-foreground px-6 py-2.5 text-[13.5px] font-semibold text-white transition hover:scale-[1.02]"
            >
              فهمت — أكمل التوليد
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
