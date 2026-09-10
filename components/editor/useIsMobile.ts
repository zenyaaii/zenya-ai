'use client'

import { useEffect, useState } from 'react'

/**
 * A live media-query match. SSR-safe: starts `false` so the server and the
 * first client render agree, then corrects on mount; `change` events keep it
 * live across rotation and window resizing.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])

  return matches
}

/**
 * Reports whether the editor should use the compact tree (MobileEditor)
 * rather than the three-pane desktop rails.
 *
 * The editor renders a completely different tree for compact vs. desktop
 * rather than CSS-hiding one — so only ONE live theme <iframe> mounts at a
 * time. We therefore need this as a JS signal, not a media query in CSS.
 *
 * The default is Tailwind's `lg` (1024px). ThemeEditor passes 1279px: below
 * that, two rails plus a framed preview do not fit, so tablets in landscape
 * and small laptops get the docked-inspector layout MobileEditor draws at
 * 768px and up, and phones keep the sheet below 768px.
 */
export function useIsMobile(query = '(max-width: 1023px)'): boolean {
  return useMediaQuery(query)
}
