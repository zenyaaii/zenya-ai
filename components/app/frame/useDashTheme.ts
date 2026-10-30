'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Light or dark for the dashboard.
 *
 * The choice lives on <html> as two classes: dash-on while a dashboard is
 * mounted (so the page behind it, and its overscroll, take the cream) and
 * dash-dk for dark. On <html> rather than on the shell because the menus,
 * the bell and the search palette portal out of the shell, and they have to
 * turn with it. Both classes come off when the shell unmounts, so a wizard
 * opened from the dashboard is not left dark.
 *
 * No saved choice means "follow the device". Picking one saves it.
 */

const KEY = 'beynoun-dash-theme'

function saved(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

function paint(dark: boolean) {
  const r = document.documentElement
  r.classList.add('dash-on')
  r.classList.toggle('dash-dk', dark)
}

export type DashMode = 'light' | 'dark' | 'auto'

export function useDashTheme() {
  const [dark, setDark] = useState(false)
  const [mode, setModeState] = useState<DashMode>('auto')

  useEffect(() => {
    const first = saved()
    const d = first ? first === 'dark' : systemDark()
    paint(d)
    setDark(d)
    setModeState(first || 'auto')

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      if (saved()) return
      paint(mq.matches)
      setDark(mq.matches)
    }
    mq.addEventListener('change', follow)
    return () => {
      mq.removeEventListener('change', follow)
      document.documentElement.classList.remove('dash-on', 'dash-dk')
    }
  }, [])

  /** Flip the theme. The new colours come down from the top like a curtain. */
  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dash-dk')
    try { localStorage.setItem(KEY, next ? 'dark' : 'light') } catch {}
    setModeState(next ? 'dark' : 'light')
    setDark(next)
    curtain(next)
  }, [])

  /** Light, dark, or follow the device (the settings page's three tiles). */
  const setMode = useCallback((m: DashMode) => {
    try { if (m === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, m) } catch {}
    setModeState(m)
    const next = m === 'auto' ? systemDark() : m === 'dark'
    if (next !== document.documentElement.classList.contains('dash-dk')) { setDark(next); curtain(next) }
  }, [])

  return { dark, toggle, mode, setMode }
}

/** Paint the new theme; the new colours come down from the top like a curtain. */
function curtain(next: boolean) {
  const r = document.documentElement
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }
  if (reduce) { paint(next); return }
  if (!doc.startViewTransition) {
    r.classList.add('zf-ease')
    paint(next)
    window.setTimeout(() => r.classList.remove('zf-ease'), 600)
    return
  }
  r.dataset.zfTt = ''
  const t = doc.startViewTransition(() => paint(next))
  t.finished.finally(() => { delete r.dataset.zfTt })
}
