"use client"

/**
 * The candidate page shell: the ground, the stylesheets, the header pill and
 * its inversion mechanic, the arrival, and the footer cap.
 *
 * IT TAKES CHILDREN SO THE CONTENT CAN STAY ON THE SERVER. Only the header
 * and the arrival observer need to be a client component; the blocks in
 * Parts.tsx are plain HTML and are rendered by a server parent and passed in,
 * which is how the live pages keep their SEO content in the initial markup.
 * Wrapping the content in the client component instead would have pulled all
 * of it into the bundle for a fade.
 */

import { useEffect, useRef } from "react"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import Header, { useOnDark, type NavItem } from "./Header"
import { CHROME_CSS } from "./tokens"
import { MARKETING_CSS } from "./marketing"
import { PARTS_CSS } from "./parts-css"
import PricingFooter from "../pricing/PricingFooter"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

export default function Shell({
  children,
  css = "",
  nav,
}: {
  children: React.ReactNode
  /** The page's own stylesheet, composed last. */
  css?: string
  nav?: NavItem[]
}) {
  const rootRef = useRef<HTMLElement | null>(null)
  const { headRef, onDark } = useOnDark(rootRef)

  /* Arrival. The hidden half lives under .zx-js so a browser that never runs
     the script reads a finished page rather than an invisible one. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduce) {
      targets.forEach((el) => el.setAttribute("data-in", "true"))
      return
    }
    root.classList.add("zx-js")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.setAttribute("data-in", "true")
          io.unobserve(e.target)
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main className={"zx-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CHROME_CSS + MARKETING_CSS + PARTS_CSS + css }} />
      <Header headRef={headRef} onDark={onDark} uiClass={plex.className} nav={nav} />
      <div className="zx-wrap">{children}</div>
      <PricingFooter />
    </main>
  )
}
