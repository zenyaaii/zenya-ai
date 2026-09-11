/**
 * Candidate website-type detail page.
 *
 * BUILT AGAINST restaurant, AND IT IS THE RIGHT SLUG TO BUILD AGAINST: it is
 * the first record in TEMPLATE_PAGES, the one with the fullest data (six
 * includes, four FAQs, two intro paragraphs), and the only one whose slug and
 * key match, so a shell that renders it correctly is exercising every field
 * the type declares. The other seven render through the same component with
 * no second design pass; generateStaticParams below builds all of them.
 *
 * NOT the live page. app/(main)/websites/[slug]/page.tsx is untouched.
 * noindex.
 *
 * MEASURED ON THE LIVE /websites/restaurant:
 *   · The headline is stored in the data as JSX containing a
 *     .gradient-text span, so the fill travels with the copy. It is
 *     overridden inside .zx-root rather than edited out of lib/template-pages.
 *   · The includes list marks each item with a #27a644 check in a tinted
 *     disc. Green reports a state; a list of what a template contains
 *     reports none.
 *   · The preview sits in a drawn browser chrome with three coloured dots and
 *     a 70px tinted drop shadow.
 *   · "مقال مطوّل" is 11px (9.35px rendered) uppercased with +1.32px of
 *     tracking, on Arabic.
 *   · The FAQ summaries stand 18.5px tall; the breadcrumb links 37x19.7 and
 *     56x19.7.
 *
 * CLEAN, and worth saying: this page already puts its call to action 462px
 * down at 390, the only one of the five in this batch that does. The
 * candidate keeps that shape rather than inventing a new one. No negative
 * tracking, no horizontal scroll, nothing invisible with JavaScript off.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Eye } from "lucide-react"
import { TEMPLATE_PAGES } from "@/lib/template-pages"
import { themePreview } from "@/lib/theme-previews"
import Shell from "@/components/zenya/chrome/Shell"
import { Breadcrumbs, FaqList, CtaBand } from "@/components/zenya/chrome/Parts"
import { CSS } from "@/components/zenya/websites/styles"

export function generateStaticParams() {
  return TEMPLATE_PAGES.map((t) => ({ slug: t.slug }))
}

export const metadata: Metadata = {
  title: "نوع موقع (نسخة تجريبية)",
  robots: { index: false, follow: false },
}

export default function DemoWebsiteType({ params }: { params: { slug: string } }) {
  const t = TEMPLATE_PAGES.find((x) => x.slug === params.slug)
  if (!t) notFound()
  const others = TEMPLATE_PAGES.filter((x) => x.slug !== t.slug)

  return (
    <Shell css={CSS}>
      <Breadcrumbs
        trail={[
          { label: "الرئيسية", href: "/demo/home" },
          { label: "أنواع المواقع", href: "/demo/websites" },
          { label: t.name },
        ]}
      />

      <section className="zx-detail zx-wide" data-reveal>
        <div className="zx-open" style={{ paddingTop: 0 }}>
          <p className="zx-eyebrow">
            <span className="zx-eyebrow-dot" aria-hidden />
            {`قالب ${t.label}`}
          </p>
          <h1 className="zx-h1">{t.h1}</h1>
          {t.intro.map((p, i) => (
            <p className="zx-lede" key={i}>{p}</p>
          ))}
          <div className="zx-acts">
            <Link href="/demo/access?mode=signup" className="zx-act-1">{`أنشئ ${t.name} مجانًا`}</Link>
            <Link href={t.demoHref} className="zx-act-2">
              <Eye size={16} strokeWidth={2} aria-hidden />
              شاهد نموذجًا حيًّا
            </Link>
          </div>
        </div>

        <div className="zx-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={themePreview(t.key)} alt={`نموذج ${t.name} من زينيا`} loading="eager" />
        </div>
      </section>

      <section className="zx-inc zx-wide" data-reveal>
        <h2 className="zx-h2">{`ماذا يتضمّن ${t.name}؟`}</h2>
        <ul className="zx-inclist">
          {t.includes.map((item) => (
            <li className="zx-incitem" key={item}>
              <span className="zx-incmark" aria-hidden />
              <span className="zx-inctext">{item}</span>
            </li>
          ))}
        </ul>

        <div className="zx-note">
          <h3 className="zx-note-h">لمن هذا القالب؟</h3>
          <p className="zx-note-p">{t.audience}</p>
        </div>

        {/* The editorial cross-link the live page added so each /why article
            has a parent that a crawler can actually reach. Kept, because
            removing it would quietly undo that. */}
        <Link href={`/demo/why/${t.key}`} className="zx-read">
          <span>
            <span className="zx-read-k">مقال مطوّل</span>
            <span className="zx-read-h">{`لماذا يحتاج نشاطك إلى ${t.name}؟`}</span>
            <span className="zx-read-p">
              دليل مفصّل بالأرقام والمصادر عمّا يكسبه صاحب النشاط من موقع احترافي — وما يخسره بدونه.
            </span>
          </span>
          <ArrowLeft className="zx-read-arrow" size={19} strokeWidth={2.25} aria-hidden />
        </Link>
      </section>

      <FaqList title={`أسئلة شائعة عن ${t.name}`} faqs={t.faqs} />

      <section className="zx-faq" data-reveal>
        <h2 className="zx-h2">أنواع مواقع أخرى</h2>
        <div className="zx-pills">
          {others.map((o) => (
            <Link key={o.slug} href={`/demo/websites/${o.slug}`} className="zx-pill-link">
              {o.name}
              <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <CtaBand title={`أنشئ ${t.name} خلال دقائق`} />
    </Shell>
  )
}
