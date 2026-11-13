'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { readableOn, type SitePalette } from '@/lib/site-palette'

/**
 * The cookie notice on a site Beynoun generates for a customer.
 *
 * Beynoun's own banner (components/CookieConsent) is about Beynoun: its name, its
 * policies, its colours. On a customer's site it read as a stranger's popup
 * over their design, so the root layout leaves it off customer sites and this
 * one is drawn instead, in the palette and fonts the site itself resolves
 * (lib/site-palette).
 *
 * Every style is inline for the same reason MadeWithZenya's are: none of the
 * house custom properties exist on a customer site.
 *
 * Stored under its own key, so a choice made on beynoun.com is never read as a
 * choice made on a customer's site that happens to share the origin
 * (beynoun.com/s/<slug>).
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

/**
 * A theme's own cut for the notice, so it reads as part of that theme (Anas,
 * 2026-11-13). Colours always come from the site's palette; the skin sets the
 * type, the corners, a solid card instead of glass, and how high it sits on a
 * phone (above the theme's own bottom bar).
 */
export type CookieSkin = { font: string; radius: number; buttonRadius: number; solid: boolean; phoneLift: number }

/** Skins by services kind (content.niche). Kinds without one keep the glass pill. */
export const COOKIE_SKINS: Record<string, CookieSkin> = {
  // components/theme/services/niche/CarFull.tsx: Rubik, 10px cards, 8px buttons, a 72px bar at the bottom on phones.
  car: { font: '"Rubik", system-ui, sans-serif', radius: 12, buttonRadius: 8, solid: true, phoneLift: 84 },
}

export default function SiteCookieBanner({ palette, skin }: { palette: SitePalette; skin?: CookieSkin }) {
  const [visible, setVisible] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (hasChoice()) return
    setVisible(true)
    // Slides up once, a moment after the page settles, so it never lands on the first paint.
    const t = setTimeout(() => setShown(true), 600)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const choose = (accepted: boolean) => {
    saveChoice(accepted)
    setShown(false)
    setTimeout(() => setVisible(false), 280)
  }

  const p = palette
  const ink = readableOn(p.surface, [p.text])
  const soft = readableOn(p.surface, [p.muted, p.text])
  const btnInk = readableOn(p.button, [p.primary, p.text, p.background])

  const font = skin?.font || p.bodyFont
  const btn: CSSProperties = {
    minHeight: 40,
    borderRadius: skin ? skin.buttonRadius : 999,
    fontFamily: font,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    border: 0,
  }

  // A floating glass pill, centred above the bottom edge (and the phone's home
  // bar), in the site's own colours. One line on a laptop; on a phone the
  // second half of the sentence drops so it stays one short line.
  return (
    <div
      role="dialog"
      aria-label="ملفات تعريف الارتباط"
      aria-describedby="site-cookie-desc"
      className="zy-ck"
      style={{
        position: 'fixed',
        zIndex: 2147483001, // one above the Made with Beynoun badge
        left: '50%',
        bottom: 'var(--zy-ck-bottom, calc(16px + env(safe-area-inset-bottom, 0px)))',
        transform: `translate(-50%, ${shown ? '0' : '24px'})`,
        opacity: shown ? 1 : 0,
        transition: 'transform .45s cubic-bezier(.22,1,.36,1), opacity .35s',
        width: 'max-content',
        maxWidth: 'calc(100vw - 24px)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 6,
        paddingInlineStart: 18,
        direction: 'rtl',
        fontFamily: font,
        color: ink,
        borderRadius: skin ? skin.radius : 999,
        ...(skin?.solid
          ? { background: p.surface, border: `1px solid ${p.border || `color-mix(in srgb, ${p.text} 14%, ${p.surface})`}`, borderInlineStart: `3px solid ${p.button}`, boxShadow: '0 12px 32px -14px rgba(0,0,0,.4)' }
          : {
              background: `color-mix(in srgb, ${p.surface} 82%, transparent)`,
              backdropFilter: 'blur(18px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
              border: `1px solid color-mix(in srgb, ${p.button} 35%, transparent)`,
              boxShadow: '0 18px 50px -12px rgba(0,0,0,.45)',
            }),
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: '0 0 auto', color: p.button }}>
        <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zm-3.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4.5-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
      </svg>
      <span id="site-cookie-desc" style={{ fontSize: 13.5, lineHeight: 1.5, minWidth: 0 }}>
        نستخدم ملفات ضرورية فقط <span className="zy-ck-more" style={{ color: soft }}>لعمل الموقع وإحصاءات لا تكشف هويتك.</span>
      </span>
      <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
        <button type="button" onClick={() => choose(false)} style={{ ...btn, padding: '0 14px', background: 'transparent', color: soft }}>
          رفض
        </button>
        <button type="button" onClick={() => choose(true)} style={{ ...btn, padding: '0 20px', background: p.button, color: btnInk }}>
          موافق
        </button>
      </div>
      <style>{`@media (max-width: 520px){ .zy-ck-more{ display:none } }${skin?.phoneLift ? `@media (max-width: 760px){ .zy-ck{ --zy-ck-bottom: calc(${skin.phoneLift}px + env(safe-area-inset-bottom, 0px)) } }` : ''}`}</style>
    </div>
  )
}
