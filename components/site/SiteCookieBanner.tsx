'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { readableOn, type SitePalette } from '@/lib/site-palette'

/**
 * The cookie notice on a site Zenya generates for a customer.
 *
 * Zenya's own banner (components/CookieConsent) is about Zenya: its name, its
 * policies, its colours. On a customer's site it read as a stranger's popup
 * over their design, so the root layout leaves it off customer sites and this
 * one is drawn instead, in the palette and fonts the site itself resolves
 * (lib/site-palette).
 *
 * Every style is inline for the same reason MadeWithZenya's are: none of the
 * house custom properties exist on a customer site.
 *
 * Stored under its own key, so a choice made on zenyaai.co is never read as a
 * choice made on a customer's site that happens to share the origin
 * (zenyaai.co/s/<slug>).
 */

const STORAGE_KEY = 'zy_site_consent'

function hasChoice(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

function saveChoice(accepted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, accepted, ts: Date.now() }))
  } catch {
    /* storage blocked: the banner closes for this visit anyway */
  }
}

export default function SiteCookieBanner({ palette }: { palette: SitePalette }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasChoice()) setVisible(true)
  }, [])

  if (!visible) return null

  const choose = (accepted: boolean) => {
    saveChoice(accepted)
    setVisible(false)
  }

  const p = palette
  const ink = readableOn(p.surface, [p.text])
  const soft = readableOn(p.surface, [p.muted, p.text])
  const btnInk = readableOn(p.button, [p.primary, p.text, p.background])
  // Square-cornered templates (restaurant) get a square-cornered box too.
  const radius = p.buttonRadius >= 999 ? 14 : 4

  const btn: CSSProperties = {
    minHeight: 44,
    padding: '0 18px',
    borderRadius: p.buttonRadius,
    fontFamily: p.bodyFont,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      role="dialog"
      aria-labelledby="site-cookie-title"
      aria-describedby="site-cookie-desc"
      style={{
        position: 'fixed',
        zIndex: 2147483001, // one above the Made with Zenya badge
        bottom: 16,
        // Physical left: the badge holds the bottom-right corner. On a phone
        // the box is full width and sits over the badge until it is closed.
        left: 16,
        width: 'min(340px, calc(100vw - 32px))',
        boxSizing: 'border-box',
        padding: 16,
        direction: 'rtl',
        fontFamily: p.bodyFont,
        color: ink,
        background: p.surface,
        borderRadius: radius,
        border: `1px solid ${p.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <div
        id="site-cookie-title"
        style={{ fontFamily: p.headingFont, fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}
      >
        ملفات تعريف الارتباط
      </div>
      <p id="site-cookie-desc" style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.7, color: soft }}>
        نستخدم ما يلزم لعمل الموقع فقط، وإحصاءات زيارات لا تكشف هويتك.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button
          type="button"
          onClick={() => choose(true)}
          style={{ ...btn, background: p.button, color: btnInk, border: `1px solid ${p.button}` }}
        >
          موافق
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          style={{ ...btn, background: 'transparent', color: ink, border: `1px solid ${p.border}` }}
        >
          رفض
        </button>
      </div>
    </div>
  )
}
