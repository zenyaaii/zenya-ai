"use client"

/**
 * The house chrome for PRODUCT surfaces — the wizards under /theme/new, the
 * Shopify builder at /build, and the auth pages.
 *
 * WHY THIS EXISTS SEPARATELY FROM Shell. Shell is the marketing shell: it
 * owns the ground, mounts the reveal observer, wraps the content in .zx-wrap
 * and caps the page with the obsidian PricingFooter. None of that belongs on
 * a wizard. A generator flow is not a page someone reads to the bottom; it is
 * a form with somewhere to go next, and a 270-line marketing footer under it
 * is chrome that earns nothing and pushes the primary action off the fold.
 *
 * So this is the pill and the tokens, and nothing else:
 *   · CHROME_CSS, so every surface under (main) inherits the same ground,
 *     greys, accent, radii and easings as the site and the dashboard.
 *   · The same Header pill the (site) pages draw, with the same inversion
 *     mechanic, so moving from /pricing into /theme/new/restaurant does not
 *     change the object in the top-left.
 *
 * IT ROOTS A <div>, NOT A <main>, and that is not a detail. Every page under
 * (main) already renders its own <main> — the restaurant wizard, the builder,
 * the reset-password card, the /theme/new redirect stub. Rooting this in
 * <main> too would nest one landmark inside another, which is invalid and
 * which screen readers report as two mains on one page.
 *
 * WHAT IT REPLACES: components/Navbar (410 lines, framer-motion, Radix
 * dropdown, the language switcher) and components/Footer (270 lines) which
 * wrapped these surfaces until now. The old pair is still the marketing
 * chrome of nothing — (site) draws its own and (main) now draws this — so
 * both files are left in the tree rather than deleted, because a component
 * that nothing imports is cheap and a wrong delete is not.
 */

import { useRef } from "react"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import Header, { useOnDark, type NavItem } from "./Header"
import { CHROME_CSS } from "./tokens"
import { PRODUCT_TOKENS_CSS } from "@/components/app/tokens"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

export default function ProductShell({
  children,
  css = "",
  nav,
}: {
  children: React.ReactNode
  /** The surface's own stylesheet, composed after the tokens. */
  css?: string
  nav?: NavItem[]
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { headRef, onDark } = useOnDark(rootRef as React.MutableRefObject<HTMLElement | null>)

  return (
    <div className={"zx-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: PRODUCT_TOKENS_CSS + CHROME_CSS + css }} />
      <Header headRef={headRef} onDark={onDark} uiClass={plex.className} nav={nav} />
      {children}
    </div>
  )
}
