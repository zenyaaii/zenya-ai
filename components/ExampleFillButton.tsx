'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

export default function ExampleFillButton({
  onFill,
  label = 'جرّب مثالًا جاهزًا',
}: {
  onFill: () => void
  label?: string
}) {
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    setOpen(false)
    onFill()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-3 rounded-[18px] bg-white py-2 pe-4 ps-2 text-start shadow-[0_0_0_1px_rgba(17,17,17,0.08),0_12px_30px_-12px_rgba(17,17,17,0.30)] transition hover:shadow-[0_0_0_1px_rgba(94,106,210,0.35),0_12px_30px_-12px_rgba(17,17,17,0.30)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e6ad2] active:scale-[0.98]"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5e6ad2] text-white"><Wand2 size={17} strokeWidth={2.2} aria-hidden /></span>
        <span className="flex flex-col leading-tight">
          <span className="text-[14.5px] font-bold text-[#171717]">{label}</span>
          <span className="text-[12.5px] font-medium text-[#56565a]">يملأ النموذج لتراه كاملًا</span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(17,17,17,0.42)] p-3 backdrop-blur-[2px] sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="example-fill-title"
            className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-[0_0_0_1px_rgba(17,17,17,0.08),0_24px_60px_-20px_rgba(17,17,17,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgba(94,106,210,0.10)] text-[#5e6ad2]"><Wand2 size={18} aria-hidden /></span>
            <p id="example-fill-title" className="mt-4 text-[17px] font-extrabold text-[#171717]">نملأ النموذج بمثال جاهز</p>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#56565a]">
              تقدر تعدّل كل شيء بعدها. عند التوليد يُحسب طلب واحد من حصتك.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={handleConfirm} className="min-h-[46px] flex-1 rounded-full bg-[#171717] text-[14.5px] font-bold text-white transition hover:bg-black">
                املأ المثال
              </button>
              <button type="button" onClick={() => setOpen(false)} className="min-h-[46px] rounded-full px-5 text-[14.5px] font-bold text-[#171717] shadow-[0_0_0_1px_rgba(17,17,17,0.12)] hover:bg-black/[0.03]">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
