/**
 * Candidate websites hub — the house style applied to the catalogue of what
 * the product builds.
 *
 * NOT the live page. app/(main)/websites/page.tsx is untouched. noindex.
 *
 * DESIGN READ: a redesign of a catalogue for someone looking for their own
 * business type, in the house language: flat #fafafa, hairline rings instead
 * of hover shadows, one accent, and the eight real preview images doing the
 * work.
 * Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 5. Variance is
 * a step below the other marketing candidates on purpose: a catalogue's job
 * is comparison, and comparison wants a regular grid.
 *
 * MEASURED ON THE LIVE PAGE at 360/390/430/768/1440:
 *   · Five of the eight label chips fail contrast, white on the template's
 *     own accent: 2.15:1 on #f59e0b, 2.25:1 on #c8a96a, 2.49:1 on #14b8a6,
 *     2.54:1 on #10b981, 4.47:1 on #6366f1. All at 11px, 9.35px rendered.
 *   · Eight different accents on one page, which is the COLOR CONSISTENCY
 *     LOCK broken eight ways on a page the house style calls achromatic.
 *   · .kicker at 4.28:1, 9.35px rendered, tracked +1.76px and uppercased on
 *     Arabic, above a linear-gradient hairline. .gradient-text on the
 *     headline.
 *   · Card bodies at 13px (11.05px rendered), breadcrumbs at 10.63px.
 *   · Hover lifts the card and paints a 44px drop shadow.
 *   · The measure is 81.5 Arabic characters a line at 1440.
 *   · The first call to action sits 3194px down at 390, the furthest of the
 *     five pages in this batch.
 *
 * CLEAN: no negative tracking, no horizontal scroll at any width, and
 * nothing rests invisible with JavaScript disabled.
 *
 * THE COPY AND THE IMAGES ARE THE LIVE ONES, read from lib/template-pages and
 * lib/theme-previews rather than copied, so the catalogue cannot drift from
 * what the product actually generates. Nothing here is invented: no counts,
 * no ratings, no testimonials.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TEMPLATE_PAGES } from "@/lib/template-pages"
import { themePreview } from "@/lib/theme-previews"
import Shell from "../_chrome/Shell"
import { Breadcrumbs, Hero, CtaBand } from "../_chrome/Parts"
import { CSS } from "./styles"

export const metadata: Metadata = {
  title: "أنواع المواقع (نسخة تجريبية)",
  robots: { index: false, follow: false },
}

export default function DemoWebsitesHub() {
  return (
    <Shell css={CSS}>
      <Breadcrumbs trail={[{ label: "الرئيسية", href: "/demo/home" }, { label: "أنواع المواقع" }]} />

      <Hero
        eyebrow="قالب لكل نشاط"
        title={<>أيًّا كان نشاطك، لزينيا</>}
        mark={<>قالب له.</>}
        intro={[
          "ثمانية قوالب احترافية، واحد لكل نوع نشاط — يكتب الذكاء الاصطناعي محتواها بالعربية ويجهّزها للنشر خلال دقائق. اختر نوع موقعك لتعرف ما يتضمّنه ولتشاهد نموذجًا حيًّا.",
        ]}
        actions={<Link href="/demo/access?mode=signup" className="zx-act-1">ابدأ الإنشاء مجانًا</Link>}
      />

      <section className="zx-cat zx-wide" data-reveal>
        <ul className="zx-grid">
          {TEMPLATE_PAGES.map((t) => (
            <li key={t.slug} style={{ display: "flex", minWidth: 0 }}>
              <Link href={`/demo/websites/${t.slug}`} className="zx-card" style={{ flex: 1 }}>
                <span className="zx-shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={themePreview(t.key)} alt={`نموذج ${t.name}`} loading="lazy" />
                  <span className="zx-chip">{t.label}</span>
                </span>
                <span className="zx-card-body">
                  <span className="zx-card-h">
                    {t.name}
                    <ArrowLeft className="zx-card-arrow" size={17} strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="zx-card-p">{t.audience}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand />
    </Shell>
  )
}
