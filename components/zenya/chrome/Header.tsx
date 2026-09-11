"use client"

/**
 * The candidate set's header pill, and the mechanic that inverts it over a
 * dark ground.
 *
 * WHY THIS IS A MODULE AND NOT AN EIGHTH COPY. /demo/home, /demo/pricing,
 * /demo/templates, /demo/build, /demo/access, /demo/review, /demo/contact and
 * /demo/legal each carry their own copy of this component and its observer.
 * That is how the two floors fixed in the legal stylesheet (14px type
 * rendering 11.9px, a 31.8px nav item against a 32px coarse floor) stayed
 * broken on the other seven. From here the pages share one definition.
 *
 * THE OBSERVER WATCHES ".zf", which is the footer cap's real class. The root
 * ZoomLock writes CSS zoom, so a rect and a rootMargin are already in the
 * same space: do not divide either by the zoom.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import ZenyaMark from "@/components/ZenyaMark"

export type NavItem = { href: string; label: string; here?: boolean }

/** The candidate set links inside the candidate set, in the set's own order. */
export const NAV: NavItem[] = [
  { href: "/themes", label: "القوالب" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

/**
 * Reports whether the pill is currently standing on a dark ground, by
 * watching every ".zf" in the tree through the band the pill occupies.
 * Returns the ref to put on the header and the flag to put in data-dark.
 */
export function useOnDark(rootRef: React.MutableRefObject<HTMLElement | null>) {
  const headRef = useRef<HTMLElement>(null)
  const [onDark, setOnDark] = useState(false)

  useEffect(() => {
    const head = headRef.current
    const root = rootRef.current
    if (!head || !root) return
    let io: IntersectionObserver | null = null
    const live = new Set<Element>()
    const darks = Array.from(root.querySelectorAll<HTMLElement>(".zf"))
    const build = () => {
      io?.disconnect()
      live.clear()
      /* The first match in DOM order is whichever pill is hidden at this
         width, and a hidden element has a zero rect. Filter by height. */
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zx-pill, .zx-phone-pill"))
        .find((el) => el.getBoundingClientRect().height > 0)
      if (!pill) return
      const r = pill.getBoundingClientRect()
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)))
          setOnDark(live.size > 0)
        },
        { rootMargin: -r.top + "px 0px " + -(window.innerHeight - r.bottom) + "px 0px", threshold: 0 },
      )
      darks.forEach((el) => io!.observe(el))
    }
    build()
    window.addEventListener("resize", build)
    return () => { io?.disconnect(); window.removeEventListener("resize", build) }
  }, [rootRef])

  return { headRef, onDark }
}

export default function Header({
  headRef,
  onDark,
  uiClass,
  nav = NAV,
}: {
  headRef: React.RefObject<HTMLElement>
  onDark: boolean
  /** The UI face (IBM Plex Sans Arabic). The pill is chrome, not display. */
  uiClass: string
  nav?: NavItem[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header ref={headRef} className={"zx-head " + uiClass} data-dark={onDark ? "true" : undefined}>
      <div className="zx-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
        <div className="zx-phone-bar">
          <button type="button" className="zx-round" aria-expanded={menuOpen} aria-controls="zx-phone-menu"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
          </button>
          <Link href="/" aria-label="زينيا" className="zx-phone-mark"><ZenyaMark className="zx-mark-svg-sm" /></Link>
          <Link href="/login?mode=signup" className="zx-account zx-account-phone">ابدأ</Link>
        </div>
        <div className="zx-drawer" data-open={menuOpen ? "true" : undefined}
          style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", visibility: menuOpen ? "visible" : "hidden" }}>
          <div className="zx-drawer-clip">
            <nav id="zx-phone-menu" className="zx-phone-menu">
              {nav.map((i) => (
                <Link key={i.href} href={i.href} className="zx-tray-row"
                  aria-current={i.here ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                  {i.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="zx-pill">
        <div className="zx-bar">
          <span className="zx-side zx-side-start">
            <Link href="/" className="zx-mark" aria-label="زينيا"><ZenyaMark className="zx-mark-svg" /></Link>
          </span>
          <nav className="zx-nav">
            {nav.map((i) => (
              <Link key={i.href} href={i.href} className="zx-nav-item" aria-current={i.here ? "page" : undefined}>
                {i.label}
              </Link>
            ))}
          </nav>
          <span className="zx-side zx-side-end">
            <span className="zx-sep" aria-hidden />
            <Link href="/login?mode=signup" className="zx-account">ابدأ</Link>
          </span>
        </div>
      </div>
    </header>
  )
}
