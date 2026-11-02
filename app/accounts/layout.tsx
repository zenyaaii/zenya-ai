import { ReactNode } from 'react'
import { getT } from '@/lib/i18n/server'

/** Title follows the viewer's locale; the portal is noindex either way. */
export function generateMetadata() {
  const { t } = getT()
  return {
    title: t.accounts.title,
    robots: { index: false, follow: false },
  }
}

/**
 * accounts.beynoun.com — since 2026-11-02 the portal is in the «ليل» style.
 *
 * Each page draws the whole screen itself (Portal in
 * components/zenya/redesign/s11.tsx): the night ground, the light, the card.
 * So this layout no longer lays a ground of its own; the flat #fafafa one it
 * drew, with CHROME_CSS and ACCOUNTS_CSS (./styles, kept), would sit under the
 * night page as a second background. It keeps the metadata.
 *
 * Still no header, for the reason the previous version gave: this host has
 * one job, and a row of links out of it is an invitation to leave.
 */
export default function AccountsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
