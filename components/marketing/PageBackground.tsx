'use client'

import AuroraBackground from '@/components/marketing/AuroraBackground'

/**
 * PageBackground — one continuous backdrop for an entire marketing page.
 *
 * It lifts the hero's own backdrop (the fine "boxes" grid + the aurora orb
 * wash) out to the page level and *fixes* it to the viewport, so every section
 * scrolls over the same texture instead of each one painting its own. The
 * result reads as a single unified background top-to-bottom.
 *
 * Sits at -z-10, pointer-events:none, so it never intercepts clicks. Sections
 * stay transparent (most already are) and show through; only opaque section
 * backgrounds would cover it.
 */
export default function PageBackground() {
  return (
    <>
      {/* Aurora orb wash, pinned to the viewport so coverage is uniform. */}
      <AuroraBackground fixed intensity={0.7} />
      {/* The fine grid — the same "boxes" as the hero, across the whole page. */}
      <div
        aria-hidden
        className="grid-fade-page pointer-events-none fixed inset-0 -z-10 opacity-70"
      />
    </>
  )
}
