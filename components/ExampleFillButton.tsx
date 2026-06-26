'use client'

import { useState } from 'react'

export default function ExampleFillButton({
  onFill,
  label = 'جرّب مثالاً جاهزًا',
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
        title="ملء النموذج بمثال جاهز يمكنك تعديله."
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-black shadow-xl shadow-amber-500/30 ring-2 ring-white/70 transition hover:scale-[1.03]"
      >
        <span aria-hidden>✨</span>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center pb-6 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[15px] font-semibold text-foreground">ملاحظة: سيُحسب من حصتك</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              توليد هذا المثال يستهلك طلبًا واحدًا من حصتك. يمكنك تعديل التفاصيل قبل التوليد
              أو بعده.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-full bg-amber-400 py-2.5 text-[13.5px] font-bold text-black transition hover:bg-amber-500"
              >
                فهمت — استمر ✨
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-token bg-background px-4 py-2.5 text-[13.5px] font-medium text-foreground transition hover:bg-black/5"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
