/**
 * The comparison detail page.
 *
 * BUILT AGAINST wix, AND IT IS THE RIGHT SLUG TO BUILD AGAINST: it is the
 * first record in COMPARISONS, it has the longest rows array (nine), and it
 * is the comparison the page's own keyword list leads with, so a shell that
 * renders it is exercising the widest table this data can produce. The other
 * six render through the same component with no second design pass;
 * generateStaticParams below builds all of them.
 *
 * MEASURED ON THE LIVE /compare/wix:
 *   · The measure is 100.5 Arabic characters a line at 1440, the widest in
 *     the batch and a third over the top of the band.
 *   · Violet on a tinted fill fails twice: #5e6ad2 at 4.16:1 in the table
 *     header and 4.03:1 in the choose blocks, against a 4.5 floor. Both take
 *     the accent's reading step here, #4f5ab8, which measures 5.48:1 and
 *     5.77:1.
 *   · A Zenya win is marked with a #27a644 check in a tinted disc. Green
 *     reports a state; an opinion about a feature is not one.
 *   · The table header cells are 12.5px and 13.5px (10.63px and 11.47px
 *     rendered) and the body cells 13px.
 *   · The FAQ summaries stand 18.5px tall; two breadcrumb links measure
 *     37x19.7 and 42x19.7.
 *   · The first call to action sits 2178px down at 390.
 *
 * THE TABLE IS THE HARD PART ON A PHONE. Three columns of Arabic prose in
 * 349px is not a table, so below 768 each row becomes a record with the two
 * answers labelled, from the same one DOM with explicit ARIA roles, and the
 * wrapper owns the only horizontal scroll on the page.
 *
 * CLEAN: no negative tracking, no horizontal page scroll at any width, and
 * nothing rests invisible with JavaScript disabled.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { hreflangAlternates } from "@/lib/i18n/config"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { COMPARISONS, getComparison } from "@/lib/comparisons"
import Shell from "@/components/zenya/chrome/Shell"
import { Breadcrumbs, Hero, CompareTable, ChooseBlocks, FaqList, CtaBand } from "@/components/zenya/chrome/Parts"
import { CSS } from "@/components/zenya/compare/styles"

const SITE = 'https://zenyaai.co'

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getComparison(params.slug)
  if (!c) return {}
  const url = `${SITE}/compare/${c.slug}`
  return {
    title: c.title,
    description: c.metaDescription,
    keywords: [
      `زينيا مقابل ${c.them}`,
      `Zenya vs ${c.themLatin}`,
      `${c.them} بديل`,
      `أفضل من ${c.them}`,
      'منشئ مواقع بالذكاء الاصطناعي',
      'منشئ مواقع عربي',
    ],
    alternates: {
      canonical: url,
      languages: hreflangAlternates(url, `${SITE}/en/compare/${c.slug}`),
    },
    openGraph: {
      title: c.title,
      description: c.metaDescription,
      url,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: c.title, description: c.metaDescription },
  }
}

export default function ComparisonPage({ params }: { params: { slug: string } }) {
  const c = COMPARISONS.find((x) => x.slug === params.slug)
  if (!c) notFound()
  const others = COMPARISONS.filter((x) => x.slug !== c.slug)

  return (
    <Shell css={CSS}>
      <Breadcrumbs
        trail={[
          { label: "الرئيسية", href: "/" },
          { label: "المقارنات", href: "/compare" },
          { label: `زينيا مقابل ${c.them}` },
        ]}
      />

      <Hero
        eyebrow="مقارنة صريحة"
        title={<>زينيا مقابل</>}
        mark={c.them}
        intro={c.intro}
        actions={<Link href="/login?mode=signup" className="zx-act-1">ابدأ الإنشاء مجانًا</Link>}
      />

      <section className="zx-wide" data-reveal>
        <CompareTable themName={c.them} rows={c.rows} />
        <ChooseBlocks themName={c.them} chooseZenya={c.chooseZenya} chooseThem={c.chooseThem} />
      </section>

      <FaqList title={`أسئلة شائعة — زينيا مقابل ${c.them}`} faqs={c.faqs} />

      <section className="zx-faq" data-reveal>
        <h2 className="zx-h2">مقارنات أخرى</h2>
        <div className="zx-pills">
          {others.map((o) => (
            <Link key={o.slug} href={`/compare/${o.slug}`} className="zx-pill-link">
              {`زينيا مقابل ${o.them}`}
              <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </Shell>
  )
}
