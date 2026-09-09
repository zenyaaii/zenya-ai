/**
 * The restyled equivalent of components/marketing/CompareParts.tsx.
 *
 * SERVER COMPONENTS, DELIBERATELY, exactly as the live parts module is.
 * Everything here is plain HTML so the content lives in the initial markup,
 * which is what a crawler and an assistant reading the page both need, and
 * the disclosures are native details so they open with no script at all.
 * Measured on the live pages: /features, /websites and /compare/wix all rest
 * fully visible with JavaScript disabled and none of them carries a
 * framer-motion opacity:0. That is the one thing this corner of the
 * marketing site already gets right, and the candidate keeps it rather than
 * regressing it into a client component for the sake of a fade.
 */

import Link from "next/link"
import { ChevronDown } from "lucide-react"
import type { CompareRow } from "@/lib/comparisons"
import type { QA } from "@/app/(main)/faq/faq-data"

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="مسار التنقّل" className="zx-crumbs">
      <ol>
        {trail.map((t, i) => (
          <li key={i}>
            {t.href ? <Link href={t.href}>{t.label}</Link> : <span aria-current="page">{t.label}</span>}
            {i < trail.length - 1 && <span aria-hidden className="zx-crumb-sep">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * The opening. The live CompareHero prints its kicker through .kicker, which
 * is 11px (9.35px rendered), tracked +1.76px, uppercased, on Arabic, at
 * 4.28:1, above a gradient hairline. This one is the candidate set's eyebrow:
 * 14.5px on the ground at 5.45:1, with the accent spent on the dot.
 *
 * `mark` is the word the headline is about. It takes the violet rule the rest
 * of the candidate set uses, in place of .gradient-text.
 */
export function Hero({
  eyebrow, title, mark, intro, actions,
}: {
  eyebrow: string
  title: React.ReactNode
  mark?: React.ReactNode
  intro: string[]
  /** THE PRIMARY ACTION BELONGS IN THE FIRST SCREEN. Measured on the live
   *  pages at 390, the first call to action sits 3194px down on /websites,
   *  2685px on /features, 2178px on /compare/wix and 1603px on /compare, all
   *  of them below the 229px consent banner. The label is the set's one
   *  label for this intent, so the band at the foot is not a second intent. */
  actions?: React.ReactNode
}) {
  return (
    <section className="zx-open" data-reveal>
      <p className="zx-eyebrow">
        <span className="zx-eyebrow-dot" aria-hidden />
        {eyebrow}
      </p>
      <h1 className="zx-h1">
        {title}
        {mark ? <> <span className="zx-h1-mark">{mark}</span></> : null}
      </h1>
      {intro.map((t, i) => (
        <p className="zx-lede" key={i}>{t}</p>
      ))}
      {actions ? <div className="zx-acts">{actions}</div> : null}
    </section>
  )
}

/** Head-to-head table. A record list below 768, a real table above it. */
export function CompareTable({ themName, rows }: { themName: string; rows: CompareRow[] }) {
  return (
    <div className="zx-tw">
      <table role="table">
        <caption className="zx-a11y">{`مقارنة زينيا مقابل ${themName}`}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col">البند</th>
            <th role="columnheader" scope="col" className="zx-th-us">زينيا</th>
            <th role="columnheader" scope="col">{themName}</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((r, i) => (
            <tr role="row" key={i}>
              <th role="rowheader" scope="row">{r.label}</th>
              <td role="cell" data-label="زينيا" className="zx-td-us">
                {r.zenyaWins ? (
                  <span className="zx-win">
                    <span className="zx-win-dot" aria-hidden />
                    <span>{r.zenya}</span>
                  </span>
                ) : (
                  r.zenya
                )}
              </td>
              <td role="cell" data-label={themName}>{r.them}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The honest two-up, so the page never reads as a one-sided advertisement. */
export function ChooseBlocks({
  themName, chooseZenya, chooseThem,
}: { themName: string; chooseZenya: string; chooseThem: string }) {
  return (
    <div className="zx-choose">
      <section className="zx-choose-card zx-choose-us">
        <h3 className="zx-choose-h">متى تختار زينيا</h3>
        <p className="zx-choose-p">{chooseZenya}</p>
      </section>
      <section className="zx-choose-card">
        <h3 className="zx-choose-h">{`متى تختار ${themName}`}</h3>
        <p className="zx-choose-p">{chooseThem}</p>
      </section>
    </div>
  )
}

export function FaqList({ title, faqs }: { title: string; faqs: QA[] }) {
  return (
    <section className="zx-faq" data-reveal>
      <h2 className="zx-h2">{title}</h2>
      {faqs.map((f, i) => (
        <details className="zx-q" key={i}>
          <summary className="zx-qsum">
            <span>{f.q}</span>
            <ChevronDown className="zx-qchev" size={17} strokeWidth={2} aria-hidden />
          </summary>
          <div className="zx-qa">{f.a}</div>
        </details>
      ))}
    </section>
  )
}

/**
 * The closing band. The live CtaBand centres a card with two buttons; this
 * one is a left-aligned band opened by a hairline, so it is not a fourth
 * white card in a page that already has card grids.
 *
 * THE LABEL IS THE SET'S ONE LABEL FOR THIS INTENT: ابدأ الإنشاء مجانًا,
 * which is what /demo/about and /demo/faq use. One label per intent is the
 * rule; one instance per page is not.
 */
export function CtaBand({
  eyebrow,
  title = "جرّب زينيا مجانًا الآن",
  subtitle = "اختر قالبًا، اكتب نبذة، واحصل على موقع عربي احترافي خلال دقائق. بلا بطاقة.",
  primaryLabel = "ابدأ الإنشاء مجانًا",
  secondaryLabel = "شاهد الأسعار",
  secondaryHref = "/demo/pricing",
  children,
}: {
  /** Some closing bands carry their own label. The live /why band prints
   *  "جاهز خلال دقائق" above its heading, and dropping it would delete a run
   *  of the product's copy along with the pill it was printed in. */
  eyebrow?: string
  title?: string
  subtitle?: string
  primaryLabel?: string
  secondaryLabel?: string
  secondaryHref?: string
  children?: React.ReactNode
}) {
  return (
    <section className="zx-band" data-reveal>
      {eyebrow ? (
        <p className="zx-eyebrow">
          <span className="zx-eyebrow-dot" aria-hidden />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="zx-band-h">{title}</h2>
      <p className="zx-band-p">{subtitle}</p>
      {children}
      <div className="zx-acts">
        <Link href="/demo/access?mode=signup" className="zx-act-1">{primaryLabel}</Link>
        <Link href={secondaryHref} className="zx-act-2">{secondaryLabel}</Link>
      </div>
    </section>
  )
}
