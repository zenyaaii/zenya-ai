'use client'

import { useIsDev } from '@/utils/dev/use-is-dev'

/**
 * Floating "Dev: fill form" pill. Only renders for accounts in the
 * dev-emails allowlist (see [useIsDev]). One click hands a complete
 * sample payload back to the form via [onFill], so theme generation
 * can be smoke-tested without hand-typing every field.
 */
export default function DevFillButton({
  onFill,
  label = 'Dev: fill form',
}: {
  onFill: () => void
  label?: string
}) {
  const isDev = useIsDev()
  if (!isDev) return null
  return (
    <button
      type="button"
      onClick={onFill}
      aria-label={label}
      title="Fill this form with realistic sample data so you can generate quickly."
      className="fixed bottom-6 left-6 z-30 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-fuchsia-500/30 ring-2 ring-white/70 transition hover:scale-[1.03]"
    >
      <span aria-hidden>⚡</span>
      {label}
    </button>
  )
}
