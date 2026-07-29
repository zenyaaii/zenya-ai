'use client'

import { useEffect, useState } from 'react'

/**
 * Reports whether the viewport is phone-sized (below Tailwind's `lg`, 1024px).
 *
 * The editor renders a completely different tree for phones vs. desktop
 * (draggable sheet vs. 3-pane rails) rather than CSS-hiding one — so only ONE
 * live theme <iframe> mounts at a time. We therefore need this as a JS signal,
 * not a media query in CSS.
 *
 * SSR-safe: starts `false` so the server + first client render agree, then
 * corrects on mount. `matchMedia` change events keep it live across rotation
 * and desktop window resizing.
 */
export function useIsMobile(query = '(max-width: 1023px)'): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])

  return isMobile
}
