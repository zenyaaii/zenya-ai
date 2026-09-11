/**
 * The long-read — the house style applied to the eight /why articles.
 *
 * BUILT AGAINST restaurant, AND IT IS THE RIGHT ARTICLE TO BUILD AGAINST: it
 * is the first record in ARTICLES, it is the one whose sections use four of
 * the five illustration variants, and its accent (#c8a96a) is the palest of
 * the eight, so every contrast problem the tint causes shows at its worst
 * here. A shell that holds this one holds the other seven;
 * generateStaticParams builds all eight.
 *
 * DESIGN READ: a redesign of a long editorial argument for a business owner
 * deciding whether a website is worth it, in the house language: flat
 * #fafafa, near-black Arabic, hairline rings, real numbers in obsidian, and
 * the accent only on the mark.
 * Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 5. Variance is
 * a step below the marketing pages because this is a read, not a pitch, and
 * an argument that changes shape every screen is harder to follow.
 *
 * MEASURED ON THE LIVE /why/restaurant at 360/390/430/768/1440:
 *   · Six h2 carry tracking-[-0.4px] on Arabic. Arabic letterforms connect.
 *   · Positive tracking and uppercase on Arabic in three places: +1.56px at
 *     13px, +1.44px at 12px, and the source lines at +0.92px at 11.5px.
 *   · Eight distinct runs of type under the floor, down to 8.92px for the
 *     fake URL chip in the drawn browser frame.
 *   · The back link measures 96x15.9, less than half the 32px a coarse
 *     pointer is owed.
 *   · Four gradients: a radial glow behind the whole page, the hero frame's
 *     fill, every illustration figure, and the closing band.
 *   · Three contrast failures, all the template's own accent: the kicker at
 *     1.94:1, the related-reading label at 1.99:1, and the stat figures at
 *     2.25:1. The stat figures are the "real numbers, with sources" block, so
 *     the least readable thing on the page is the part it is proudest of.
 *   · The measure is 88 Arabic characters a line at 1440.
 *
 * CLEAN: no horizontal scroll at any width, and the article is a server
 * component with no framer-motion, so nothing rests invisible with
 * JavaScript disabled.
 *
 * AND ONE THING WORTH SAYING PLAINLY: the numbers on this page are real and
 * carry their sources, and the bar chart says in its own caption that it is
 * illustrative rather than data. That is the honesty rule already kept, and
 * the candidate keeps it: no figure here was invented, moved between
 * articles, or separated from its source.
 *
 * THE COPY IS THE LIVE COPY, read from ./copy rather than retyped, including
 * the labels inside the five illustration variants, which live in the page
 * component rather than in the data and are moved here word for word.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, CheckCircle2, Layers, ShieldCheck, Timer, TrendingUp } from "lucide-react"
import { ARTICLES, type Article } from "@/lib/why-copy"
import { TEMPLATE_PAGES } from "@/lib/template-pages"
import { themePreview } from "@/lib/theme-previews"
import Shell from "@/components/zenya/chrome/Shell"
import { Breadcrumbs, CtaBand } from "@/components/zenya/chrome/Parts"
import { CSS } from "@/components/zenya/why/styles"

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((type) => ({ type }))
}

const SITE = 'https://zenyaai.co'

export function generateMetadata({ params }: { params: { type: string } }): Metadata {
  const article = ARTICLES[params.type as Article['key']]
  if (!article) return { title: 'زينيا' }
  return {
    // `absolute` on purpose: every meta.title already ends in the wordmark, and
    // the root layout's template appends it a second time. The live pages were
    // shipping it twice, which Google truncates and readers read as a bug.
    // absolute suppresses the template and the copy keeps its own wordmark.
    title: { absolute: article.meta.title },
    description: article.meta.description,
    keywords: article.meta.keywords,
    alternates: { canonical: `${SITE}/why/${article.key}` },
    openGraph: {
      title: article.meta.title,
      description: article.meta.description,
      url: `${SITE}/why/${article.key}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta.title,
      description: article.meta.description,
    },
    robots: { index: true, follow: true },
  }
}

export default function WhyPage({ params }: { params: { type: string } }) {
  const article = ARTICLES[params.type as Article["key"]]
  if (!article) notFound()
  const twin = TEMPLATE_PAGES.find((t) => t.key === article.key)
  const siblings = Object.values(ARTICLES).filter((a) => a.key !== article.key)

  return (
    <Shell css={CSS}>
      <Breadcrumbs
        trail={[
          { label: "الرئيسية", href: "/" },
          { label: "القوالب", href: "/themes" },
          { label: article.templateName },
        ]}
      />

      <section className="zx-open" data-reveal>
        <p className="zx-eyebrow">
          <span className="zx-eyebrow-dot" aria-hidden />
          {article.hero.kicker}
        </p>
        <h1 className="zx-h1">{article.hero.h1}</h1>
        <p className="zx-lede">{article.hero.lead}</p>
        <div className="zx-acts">
          <Link href={article.buildHref} className="zx-act-1">ابدأ الآن مجانًا</Link>
          <Link href={article.demoHref} className="zx-act-2">
            شاهد العرض الحي
            <ArrowUpRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="zx-hero-shot zx-wide" data-reveal>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={themePreview(article.key)} alt={`مثال حقيقي لقالب ${article.templateName} من زينيا`} loading="eager" />
      </div>

      <article className="zx-art">
        {article.sections.map((s) => (
          <section key={s.id} id={s.id} className="zx-sec" aria-labelledby={`${s.id}-h`} data-reveal>
            <h2 id={`${s.id}-h`} className="zx-h2">{s.title}</h2>
            {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {s.illustration ? <Figure kind={s.illustration} /> : null}
          </section>
        ))}

        <section id="stats" className="zx-sec zx-wide" aria-labelledby="stats-h" data-reveal>
          <h2 id="stats-h" className="zx-h2">أرقام من الواقع (بمصادرها)</h2>
          <p>كل رقم أدناه من مصدر بحثي معروف — لا أرقام مُختلقة. راجع اسم المصدر تحت كل إحصاءة.</p>
          <div className="zx-stats">
            {article.stats.map((st, i) => (
              <div className="zx-stat" key={i}>
                <div className="zx-stat-fig"><bdi dir="ltr">{st.figure}</bdi></div>
                <p className="zx-stat-l">{st.label}</p>
                {/* THE LABEL IS THE LIVE LABEL. An earlier draft translated
                    "Source ·" to "المصدر:", which is a rewrite of the
                    product's copy rather than a restyle of it. What this page
                    changes is the styling around it: the live line is 11.5px
                    (9.78px rendered), uppercased, and tracked +0.92px, none of
                    which helps a mixed Arabic and Latin line. */}
                <p className="zx-stat-s">
                  <bdi dir="ltr">{`Source · ${st.source}`}</bdi>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="checklist" className="zx-sec" aria-labelledby="checklist-h" data-reveal>
          <h2 id="checklist-h" className="zx-h2">قائمة التحقّق قبل الإطلاق</h2>
          <ul className="zx-check">
            {article.checklist.map((item, i) => (
              <li key={i}>
                <span className="zx-check-mark" aria-hidden />
                <span className="zx-check-t">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* The cluster the live article built: the commercial page for the
            same vertical, then the seven siblings. Kept, because removing it
            would put these eight articles back to being dead ends. */}
        {twin ? (
          <Link href={`/websites/${twin.slug}`} className="zx-twin" data-reveal>
            <span>
              <span className="zx-twin-k">القالب نفسه</span>
              <span className="zx-twin-h">{`${twin.name} من زينيا`}</span>
              <span className="zx-twin-p">
                ما الذي يشمله القالب، ولمن هو، وكيف تنشئه — مع عرض حيّ قابل للتصفّح.
              </span>
            </span>
            <ArrowLeft className="zx-twin-arrow" size={19} strokeWidth={2.25} aria-hidden />
          </Link>
        ) : null}

        <section className="zx-sec" data-reveal>
          <h2 className="zx-h2">اقرأ أيضًا</h2>
          <div className="zx-pills">
            {siblings.map((s) => (
              <Link key={s.key} href={`/why/${s.key}`} className="zx-pill-link">
                {s.templateName}
                <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      </article>

      <CtaBand
        eyebrow="جاهز خلال دقائق"
        title={`أنشئ قالب ${article.templateName} مع زينيا`}
        subtitle="اكتب نبذة قصيرة عن نشاطك، ويبني لك الذكاء الاصطناعي موقعًا عربيًا احترافيًا بمحتوى مصمَّم لتحويل الزوّار إلى عملاء."
        primaryLabel="ابدأ الآن مجانًا"
        secondaryLabel="شاهد العرض الحي"
        secondaryHref={article.demoHref}
      />
    </Shell>
  )
}

/**
 * The five section figures. Their labels live in the live page component
 * rather than in ./copy, so they are moved here word for word: "انطباع أول",
 * "50 ms", "بنية القالب", the six structure cells, "أثر التسويق الجيّد", the
 * caption that says the bars are illustrative, "إشارات ثقة" and "اختبِر قبل
 * النشر". What changed is the drawing: a hairline-ringed card in one accent
 * instead of a tinted gradient panel.
 */
function Figure({ kind }: { kind: NonNullable<Article["sections"][number]["illustration"]> }) {
  if (kind === "firstImpression") {
    return (
      <figure className="zx-fig">
        <div className="zx-fig-row">
          <span className="zx-fig-mark"><Timer size={22} strokeWidth={2} aria-hidden /></span>
          <div>
            <p className="zx-fig-k">انطباع أول</p>
            <div className="zx-fig-num"><bdi dir="ltr">50 ms</bdi></div>
            <p className="zx-fig-p">الوقت الذي يحتاجه الزائر ليُكوِّن حكمه على موقعك</p>
          </div>
        </div>
      </figure>
    )
  }
  if (kind === "featureGrid") {
    return (
      <figure className="zx-fig">
        <p className="zx-fig-k"><Layers size={16} strokeWidth={2.25} aria-hidden />بنية القالب</p>
        <div className="zx-fig-grid">
          {["بطل", "ميزات", "ثقة", "شهادات", "باقات", "دعوة"].map((label) => (
            <span className="zx-fig-cell" key={label}>{label}</span>
          ))}
        </div>
      </figure>
    )
  }
  if (kind === "trend") {
    return (
      <figure className="zx-fig">
        <p className="zx-fig-k"><TrendingUp size={16} strokeWidth={2.25} aria-hidden />أثر التسويق الجيّد</p>
        {/* Abstract rhythm, not data, and the caption below says so. */}
        <div className="zx-chart" aria-hidden>
          {[35, 48, 42, 62, 55, 74, 88].map((h, i) => (
            <span className="zx-chart-bar" key={i} data-lead={i >= 5 ? "true" : undefined} style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="zx-fig-note">الأرقام أعلاه توضيحية لإيقاع النمو، لا لبيانات محدّدة.</p>
      </figure>
    )
  }
  if (kind === "trust") {
    return (
      <figure className="zx-fig">
        <div className="zx-fig-row">
          <span className="zx-fig-mark"><ShieldCheck size={22} strokeWidth={2} aria-hidden /></span>
          <div>
            <p className="zx-fig-t">إشارات ثقة</p>
            <p className="zx-fig-p">شارات، تقييمات، ضمان استرداد</p>
          </div>
        </div>
      </figure>
    )
  }
  return (
    <figure className="zx-fig">
      <div className="zx-fig-row">
        <span className="zx-fig-mark"><CheckCircle2 size={22} strokeWidth={2} aria-hidden /></span>
        <div>
          <p className="zx-fig-t">اختبِر قبل النشر</p>
          <p className="zx-fig-p">قائمة تحقّق قصيرة تحمي المشروع من أخطاء الإطلاق</p>
        </div>
      </div>
    </figure>
  )
}
