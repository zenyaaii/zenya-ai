"use client"

/**
 * The candidate legal shell. One shell, five routes over it.
 *
 * WHY FIVE ROUTES AND NOT ONE PAGE WITH A SWITCHER. The live site keeps
 * /privacy, /terms, /cookies, /refund and /subprocessors as five separate
 * indexed URLs, and it has to: they are cited from the cookie banner, from
 * Stripe's checkout, from the Shopify app listing and from every footer on
 * the site, and the design-taste skill's section 11.C forbids changing slugs
 * and IA silently. A single tabbed page would have shown the owner a style
 * applied to policy while quietly proposing an IA nobody asked for. So the
 * candidate is five real addresses, the switcher changes the address, and
 * the restyle itself lives in exactly one place: this file plus styles.ts.
 * The five route files are eight lines each.
 *
 * WHAT THIS SHELL ADDS THAT THE LIVE PAGES DO NOT HAVE.
 *   · A measure. 33rem, which is 62 Arabic characters a line instead of 95.
 *   · A spine. The clause list, sticky at 1024 and up, a closed disclosure
 *     below that, and it knows which clause the reader is in.
 *   · The date as an object rather than a grey line, read from
 *     COMPANY.LAST_UPDATED.
 *   · Heading ids, so a clause can be linked from an e-mail. The live pages
 *     have none: measured, 16 headings on /privacy and 0 ids.
 *
 * NOTHING HERE IS A LEGAL FACT OF ITS OWN. Every value the documents print
 * comes from lib/company.ts, which the five live pages already read, so this
 * candidate cannot drift from them. The shell itself prints exactly one
 * value, COMPANY.LAST_UPDATED, and it prints it once.
 *
 * THE HEADER IS THE CANDIDATE SET'S, mechanic and all, and its observer
 * watches ".zf", which is the footer cap's real class.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import ZenyaMark from "@/components/ZenyaMark"
import { COMPANY } from "@/lib/company"
import PricingFooter from "../pricing/PricingFooter"
import { CSS } from "./styles"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/* The candidate set links inside the candidate set, in the set's own order. */
const NAV: Array<{ href: string; label: string }> = [
  { href: "/themes", label: "القوالب" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل" },
]

/**
 * The five documents, with the titles they already carry on the live pages.
 * Nothing here is a new name for an existing thing: the switcher says what
 * each document says about itself, and `real` is the live address the
 * candidate proposes for.
 */
export const DOCS = [
  { slug: "privacy", title: "سياسة الخصوصية", real: "/privacy" },
  { slug: "terms", title: "شروط الخدمة", real: "/terms" },
  { slug: "cookies", title: "سياسة ملفات تعريف الارتباط", real: "/cookies" },
  { slug: "refund", title: "سياسة الإلغاء والاسترداد", real: "/refund" },
  { slug: "subprocessors", title: "المعالجون الفرعيون", real: "/subprocessors" },
] as const

export type DocSlug = (typeof DOCS)[number]["slug"]
export type Section = { readonly id: string; readonly level: number; readonly text: string }

export default function LegalShell({
  slug,
  sections,
  children,
}: {
  slug: DocSlug
  sections: readonly Section[]
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [onDark, setOnDark] = useState(false)
  const [here, setHere] = useState<string | null>(null)

  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)

  const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0]

  /* Arrival. The hidden half lives under .zl-js so a browser that never runs
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
    root.classList.add("zl-js")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute("data-in", "true")
          io.unobserve(entry.target)
        })
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* The header takes the ground it is standing on. Same mechanic as the
     seven sibling pages: the band is the strip the pill occupies. The root
     ZoomLock writes CSS zoom, so a rect and a rootMargin are already in the
     same space; do not divide either by the zoom. It watches ".zf", which is
     the footer cap's real class. */
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
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zl-pill, .zl-phone-pill"))
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
  }, [])

  /* WHICH CLAUSE THE READER IS IN.
     The band is the top of the reading area: everything from just under the
     sticky pill down to 62% of the viewport. The current clause is the LAST
     heading whose top has passed into or above that band, which is what a
     reader means by "where am I" when a long clause fills the screen and no
     heading is on it at all. An IntersectionObserver alone cannot answer
     that, because a heading scrolled far above the band is not intersecting
     anything, so the positions are read from the headings themselves on a
     rAF-throttled scroll. No window scroll listener does layout work: the
     handler only schedules a frame. */
  useEffect(() => {
    const root = rootRef.current
    if (!root || sections.length === 0) return
    const heads = sections
      .map((s) => root.querySelector<HTMLElement>("#" + CSS_ESCAPE(s.id)))
      .filter((el): el is HTMLElement => Boolean(el))
    if (heads.length === 0) return

    let raf = 0
    const read = () => {
      raf = 0
      const line = window.innerHeight * 0.28
      let current: string | null = null
      for (const el of heads) {
        if (el.getBoundingClientRect().top <= line) current = el.id
        else break
      }
      /* Above the first clause the spine reports nothing rather than
         guessing, so the dot never claims a section the reader has not
         reached. */
      setHere(current)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read) }
    read()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [sections])

  return (
    <main className={"zl-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header ref={headRef} className={"zl-head " + plex.className} data-dark={onDark ? "true" : undefined}>
        <div className="zl-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
          <div className="zl-phone-bar">
            <button type="button" className="zl-round" aria-expanded={menuOpen} aria-controls="zl-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/" aria-label="زينيا" className="zl-phone-mark"><ZenyaMark className="zl-mark-svg-sm" /></Link>
            <Link href="/login?mode=signup" className="zl-account zl-account-phone">ابدأ</Link>
          </div>
          <div className="zl-drawer" data-open={menuOpen ? "true" : undefined}
            style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", visibility: menuOpen ? "visible" : "hidden" }}>
            <div className="zl-drawer-clip">
              <nav id="zl-phone-menu" className="zl-phone-menu">
                {NAV.map((i) => (
                  <Link key={i.href} href={i.href} className="zl-tray-row" onClick={() => setMenuOpen(false)}>
                    {i.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="zl-pill">
          <div className="zl-bar">
            <span className="zl-side zl-side-start">
              <Link href="/" className="zl-mark" aria-label="زينيا"><ZenyaMark className="zl-mark-svg" /></Link>
            </span>
            <nav className="zl-nav">
              {NAV.map((i) => (
                <Link key={i.href} href={i.href} className="zl-nav-item">{i.label}</Link>
              ))}
            </nav>
            <span className="zl-side zl-side-end">
              <span className="zl-sep" aria-hidden />
              <Link href="/login?mode=signup" className="zl-account">ابدأ</Link>
            </span>
          </div>
        </div>
      </header>

      <div className="zl-wrap">
        <section className="zl-open" data-reveal>
          <h1 className="zl-h1">{doc.title}</h1>
          <p className="zl-stamp">
            <span className="zl-stamp-dot" aria-hidden />
            آخر تحديث: <b><bdi dir="ltr">{COMPANY.LAST_UPDATED}</bdi></b>
          </p>
          <p className="zl-lede">
            هذه نسخة تصميم مُقترحة. النص هو نص الصفحة الحيّة كما هو، بندًا ببند؛ ما تغيّر هو
            شكله وحده.
          </p>
        </section>

        {/* THE SWITCHER SITS ABOVE THE DOCUMENT AT EVERY WIDTH. Putting it in
            the sidebar would have meant a phone reaches it only after 1280
            lines of clauses, which is the same mistake the live contact page
            makes with its channels. One row, one behaviour, both columns. */}
        <nav className="zl-switch" aria-label="المستندات القانونية" data-reveal>
          <div className="zl-switch-rail">
            {DOCS.map((d) => (
              <Link key={d.slug} href={"/" + d.slug} className="zl-doc-link"
                aria-current={d.slug === slug ? "page" : undefined}>
                {d.title}
              </Link>
            ))}
          </div>
        </nav>

        <div className="zl-body">
          {/* THE SPINE ON A PHONE IS A SIBLING OF THE DOCUMENT, NOT A CHILD OF
              IT, and that is load-bearing rather than tidy. .zl-doc styles the
              moved legal copy by element selector (see styles.ts), so a list
              of links nested inside it inherits the document's own disc
              markers and underlined violet links, and the table of contents
              renders as fifteen bulleted body paragraphs. Above 1024 this
              whole element is display:none and the grid is back to two
              columns. */}
          <details className="zl-spine-panel zl-spine-phone">
            <summary className={"zl-spine-sum " + plex.className}>
              <ChevronDown className="zl-chev" size={16} strokeWidth={2} aria-hidden />
              في هذه الصفحة
              <span className="zl-spine-count">{sections.length}</span>
            </summary>
            <Toc sections={sections} here={here} className={plex.className} />
          </details>

          <div className="zl-doc" data-reveal>
            {children}
          </div>

          <aside className="zl-spine" aria-label="بنود هذه الصفحة">
            <div className="zl-spine-panel">
              <Toc sections={sections} here={here} className={plex.className} />
            </div>
          </aside>
        </div>

        <p className="zl-foot-note">
          صفحة تصميم مُقترحة لـ <Link href={doc.real} className="zl-link"><bdi dir="ltr">{doc.real}</bdi></Link>.
          لا شيء هنا يُرسل أو يُحفظ، والصفحة الحيّة هي المرجع القانوني.
        </p>
      </div>

      <PricingFooter />
    </main>
  )
}

function Toc({ sections, here, className }: { sections: readonly Section[]; here: string | null; className: string }) {
  return (
    <ul className={"zl-toc " + className}>
      {sections.map((s) => (
        <li key={s.id} data-l={s.level}>
          <a href={"#" + s.id} data-here={s.id === here ? "true" : undefined}>{s.text}</a>
        </li>
      ))}
    </ul>
  )
}

/** The ids are ASCII by construction (s-2-1, s-x1), written by the codegen
 *  in documents/. Stripping anything else is enough, and it avoids reaching
 *  for a global named CSS in a module that already imports one. */
function CSS_ESCAPE(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "")
}
