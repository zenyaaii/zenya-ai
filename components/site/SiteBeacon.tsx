'use client'

import { useEffect } from 'react'
import { classifyLink } from '@/lib/analytics-core'

/**
 * The customer-site analytics beacon.
 *
 * Rendered once inside every published Zenya site. It exists because the
 * server cannot see three things that decide whether the owner's site is
 * working: where the visitor actually came from (the `referer` header is
 * stripped on most social and in-app navigations — it was NULL on 100% of
 * live rows), how long they stayed, and whether they tapped WhatsApp.
 *
 * Design constraints:
 *   - No cookies and no localStorage. The session id lives in sessionStorage
 *     and dies with the tab; visitor identity is derived server-side from a
 *     salted hash that rotates daily.
 *   - sendBeacon only, so nothing blocks navigation or paint.
 *   - One delegated click listener covers every template. No template file
 *     needs to know analytics exists — `tel:`, `wa.me`, booking and outbound
 *     links are classified by URL shape in classifyLink().
 */

const ENDPOINT = '/api/insight'
const SESSION_KEY = 'zy_sid'
const SESSION_TS_KEY = 'zy_sid_ts'
const SESSION_IDLE_MS = 30 * 60 * 1000 // a 30-minute gap starts a new session

/**
 * Last pageview sent, at MODULE scope so it survives an effect remount.
 *
 * React StrictMode double-invokes effects in dev (mount → unmount → remount),
 * and bfcache restores or a fast client remount can do the same in prod. A
 * dedup guard living inside the effect resets on every remount and lets a
 * second identical pageview through — which then can't enrich the already
 * claimed server row and inserts a duplicate, doubling the owner's counts.
 * Module scope persists for the life of the page; a genuine full reload gets a
 * fresh module and is correctly counted again.
 */
let lastPvKey = ''
let lastPvAt = 0

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    } else {
      // Older Safari: keepalive fetch still survives the unload.
      fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {})
    }
  } catch {
    /* analytics must never break the customer's site */
  }
}

function sessionId(): string {
  try {
    const now = Date.now()
    const last = Number(sessionStorage.getItem(SESSION_TS_KEY) || 0)
    const stored = sessionStorage.getItem(SESSION_KEY)
    let sid: string
    if (stored && last && now - last <= SESSION_IDLE_MS) {
      sid = stored
    } else {
      sid =
        (crypto as any)?.randomUUID?.() ??
        `${now.toString(36)}${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now))
    return sid
  } catch {
    // Private mode with storage disabled — still send, just unsessioned.
    return ''
  }
}

function utmFromSearch(): { s?: string; m?: string; c?: string } | undefined {
  try {
    const q = new URLSearchParams(location.search)
    const s = q.get('utm_source') || undefined
    const m = q.get('utm_medium') || undefined
    const c = q.get('utm_campaign') || undefined
    return s || m || c ? { s, m, c } : undefined
  } catch {
    return undefined
  }
}

export default function SiteBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    // Never measure the editor's preview iframe as if it were a real visitor.
    if (typeof window === 'undefined' || window.top !== window.self) return
    if (!slug) return

    /**
     * The same page has three possible URLs: zina.zenyaai.co/menu (subdomain),
     * customdomain.com/menu, and zenyaai.co/s/zina/menu (direct). Only the
     * last carries the /s/<slug> prefix. Left in, it would split one page into
     * two rows AND break the match against the server-written row, which
     * records "/menu" — so the beacon would insert a duplicate instead of
     * enriching. Normalise to the site-relative path everywhere.
     */
    const sitePath = (p: string): string => {
      const prefix = `/s/${slug}`
      if (p === prefix) return '/'
      if (p.startsWith(prefix + '/')) return p.slice(prefix.length) || '/'
      return p || '/'
    }

    let currentPath = sitePath(location.pathname)
    let engagedMs = 0
    let maxScroll = 0
    let lastTick = Date.now()
    let visible = document.visibilityState === 'visible'
    let sid = sessionId()

    const measureScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const pct = scrollable <= 0 ? 100 : Math.round(((window.scrollY || 0) / scrollable) * 100)
      if (pct > maxScroll) maxScroll = Math.min(100, Math.max(0, pct))
    }

    const accrue = () => {
      const now = Date.now()
      if (visible) engagedMs += now - lastTick
      lastTick = now
    }

    /** Close out the page we're leaving, then reset counters for the next one. */
    const flush = (path: string) => {
      accrue()
      measureScroll()
      if (sid && (engagedMs > 500 || maxScroll > 0)) {
        send({ k: 'end', i: sid, p: path, ms: engagedMs, sc: maxScroll })
      }
      engagedMs = 0
      maxScroll = 0
      lastTick = Date.now()
    }

    const pageview = (path: string) => {
      sid = sessionId()
      const key = `${sid}|${path}`
      const now = Date.now()
      if (key === lastPvKey && now - lastPvAt < 2000) return
      lastPvKey = key
      lastPvAt = now
      send({
        k: 'pv',
        s: slug,
        p: path,
        i: sid,
        r: document.referrer || undefined,
        q: utmFromSearch(),
      })
    }

    pageview(currentPath)
    measureScroll()

    // ---- SPA navigation -----------------------------------------------------
    // The templates switch pages client-side via history.pushState, so a plain
    // popstate listener would miss most navigations.
    const onRouteChange = () => {
      const next = sitePath(location.pathname)
      if (next === currentPath) return
      flush(currentPath)
      currentPath = next
      pageview(currentPath)
    }

    const origPush = history.pushState
    const origReplace = history.replaceState
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      origPush.apply(this, args)
      onRouteChange()
    }
    history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
      origReplace.apply(this, args)
      onRouteChange()
    }
    window.addEventListener('popstate', onRouteChange)

    // ---- engagement ---------------------------------------------------------
    const onVisibility = () => {
      accrue()
      visible = document.visibilityState === 'visible'
      lastTick = Date.now()
      if (!visible) flush(currentPath)
    }
    const onScroll = () => measureScroll()
    const onLeave = () => flush(currentPath)

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onLeave)

    // ---- conversions --------------------------------------------------------
    // One delegated listener for all eight templates. Capture phase so it still
    // fires when a template calls preventDefault or stopPropagation.
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      const type = classifyLink(href)
      if (!type) return
      // Same-origin links are internal navigation, not an outbound conversion.
      if (type === 'outbound_click') {
        try {
          if (new URL(anchor.href, location.href).host === location.host) return
        } catch {
          return
        }
      }
      send({
        k: 'ev',
        s: slug,
        i: sid,
        e: type,
        p: currentPath,
        l: (anchor.textContent || '').trim().slice(0, 120) || href?.slice(0, 120),
      })
    }

    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null
      if (!form || form.tagName !== 'FORM') return
      send({
        k: 'ev',
        s: slug,
        i: sid,
        e: 'form_submit',
        p: currentPath,
        l: form.getAttribute('name') || form.getAttribute('id') || undefined,
      })
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)

    return () => {
      flush(currentPath)
      history.pushState = origPush
      history.replaceState = origReplace
      window.removeEventListener('popstate', onRouteChange)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onLeave)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
    }
  }, [slug])

  return null
}
