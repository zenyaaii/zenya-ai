'use client'

/**
 * Floating "try an example" pill, shown to every user on the theme
 * builder pages. One click fills the form with a ready sample via
 * [onFill] so a first-timer gets an instant, editable starting point
 * instead of a blank form — then they tweak the name/details and
 * generate as normal (so it still counts against their quota).
 *
 * Sits bottom-right so it never collides with the dev-only fill pill
 * (bottom-left). On-brand amber, always visible while the long form
 * scrolls.
 */
export default function ExampleFillButton({
  onFill,
  label = 'جرّب مثالاً جاهزًا',
}: {
  onFill: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onFill}
      title="املأ النموذج بمثال جاهز يمكنك تعديله ثم توليده."
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-black shadow-xl shadow-amber-500/30 ring-2 ring-white/70 transition hover:scale-[1.03]"
    >
      <span aria-hidden>✨</span>
      {label}
    </button>
  )
}
