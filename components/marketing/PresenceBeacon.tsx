'use client'

import { useEffect } from 'react'

/**
 * PresenceBeacon — pings /api/presence a few times a minute so the live-users
 * globe knows this person is currently online. Mounted on every Zenya-owned
 * surface (marketing + dashboard), NOT on customer sites (those already report
 * via the /api/insight beacon). Renders nothing.
 */
export default function PresenceBeacon({ surface = 'web' }: { surface?: string }) {
  useEffect(() => {
    const ping = () => {
      try {
        const body = JSON.stringify({ s: surface })
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/presence', new Blob([body], { type: 'text/plain' }))
        } else {
          fetch('/api/presence', { method: 'POST', body, keepalive: true }).catch(() => {})
        }
      } catch { /* presence is best-effort */ }
    }
    ping()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') ping()
    }, 25_000)
    const onVis = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [surface])

  return null
}
