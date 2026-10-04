/**
 * One page per template, at /templates/<slug>.
 *
 * THIS PAGE USED TO BE THREE. Each template had /websites/<slug> (what it
 * includes), /why/<key> (the long article) and /demo/<key> (the live preview),
 * all indexed, all about the same thing, and Google could not tell which one
 * mattered: searching the brand once returned the wellness demo first. The
 * owner chose one address per template (2026-10-04). The top of this page is
 * the old /websites page, the middle is the /why article word for word, and
 * the demo is still reachable at /templates/<slug>/demo, noindexed. The old
 * addresses 301 here from next.config.js.
 *
 * What follows is the original note for the /websites half.
 *
 * BUILT AGAINST restaurant, AND IT IS THE RIGHT SLUG TO BUILD AGAINST: it is
 * the first record in TEMPLATE_PAGES, the one with the fullest data (six
 * includes, four FAQs, two intro paragraphs), and the only one whose slug and
 * key match, so a shell that renders it correctly is exercising every field
 * the type declares. The other seven render through the same component with
 * no second design pass; generateStaticParams below builds all of them.
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
import { hreflangAlternates } from "@/lib/i18n/config"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Eye, Layers, ShieldCheck, Timer, TrendingUp } from "lucide-react"
import { TEMPLATE_PAGES, getTemplatePage } from "@/lib/template-pages"
import { ARTICLES, type Article } from "@/lib/why-copy"
import { themePreview } from "@/lib/theme-previews"
import Shell from "@/components/zenya/chrome/Shell"
import { Breadcrumbs, FaqList, CtaBand } from "@/components/zenya/chrome/Parts"
import { CSS as TEMPLATE_CSS } from "@/components/zenya/websites/styles"
import { CSS as ARTICLE_CSS } from "@/components/zenya/why/styles"
import { share } from '@/lib/site-share'

const SITE = 'https://zenyaai.co'

// The article stylesheet opens by shrinking .zx-h1 for its long question
// headline. Here the h1 is the template's own short one, so that rule is cut
// and only the article's own classes come along.
const CSS = TEMPLATE_CSS + ARTICLE_CSS.replace(/\.zx-h1 \{[^}]*\}/, "")

export function generateStaticParams() {
  return TEMPLATE_PAGES.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = getTemplatePage(params.slug)
  if (!t) return {}
  const url = `${SITE}/templates/${t.slug}`
  const article = ARTICLES[t.key as Article["key"]]
  return {
    // absolute, with the wordmark written out: templates/layout.tsx sets a
    // plain title, which stops the root "· زينيا" template from reaching
    // this page, and every other page of the site ends in the name.
    title: { absolute: `${t.title} · زينيا` },
    description: t.metaDescription,
    keywords: Array.from(new Set([...t.keywords, ...(article?.meta.keywords ?? [])])),
    alternates: {
      canonical: url,
      languages: hreflangAlternates(url, `${SITE}/en/websites/${t.slug}`),
    },
    ...share({
      title: t.title,
      description: t.metaDescription,
      url,
    }),
  }
}

export default function TemplatePage({ params }: { params: { slug: string } }) {
  const t = TEMPLATE_PAGES.find((x) => x.slug === params.slug)
  if (!t) notFound()
  const article = ARTICLES[t.key as Article["key"]]
  const others = TEMPLATE_PAGES.filter((x) => x.slug !== t.slug)

  return (
    <Shell css={CSS}>
      <Breadcrumbs
        trail={[
          { label: "الرئيسية", href: "/" },
          { label: "القوالب", href: "/templates" },
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
            <Link href={t.buildHref} className="zx-act-1">ابدأ ببناء موقعك</Link>
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

      </section>

      {article ? (
        <article className="zx-art" aria-labelledby="guide-h">
          <section className="zx-sec" data-reveal>
            <h2 id="guide-h" className="zx-h2">{article.hero.h1}</h2>
            <p>{article.hero.lead}</p>
          </section>

          {article.sections.map((s) => (
            <section key={s.id} id={s.id} className="zx-sec" aria-labelledby={`${s.id}-h`} data-reveal>
              <h3 id={`${s.id}-h`} className="zx-h2">{s.title}</h3>
              {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              {s.illustration ? <Figure kind={s.illustration} /> : null}
            </section>
          ))}

          <section id="stats" className="zx-sec zx-wide" aria-labelledby="stats-h" data-reveal>
            <h3 id="stats-h" className="zx-h2">أرقام من الواقع (بمصادرها)</h3>
            <p>كل رقم أدناه من مصدر بحثي معروف — لا أرقام مُختلقة. راجع اسم المصدر تحت كل إحصاءة.</p>
            <div className="zx-stats">
              {article.stats.map((st, i) => (
                <div className="zx-stat" key={i}>
                  <div className="zx-stat-fig"><bdi dir="ltr">{st.figure}</bdi></div>
                  <p className="zx-stat-l">{st.label}</p>
                  <p className="zx-stat-s">
                    <bdi dir="ltr">{`Source · ${st.source}`}</bdi>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Not id="checklist": the article already has a section with that id. */}
          <section id="launch-list" className="zx-sec" aria-labelledby="launch-list-h" data-reveal>
            <h3 id="launch-list-h" className="zx-h2">قائمة التحقّق قبل الإطلاق</h3>
            <ul className="zx-check">
              {article.checklist.map((item, i) => (
                <li key={i}>
                  <span className="zx-check-mark" aria-hidden />
                  <span className="zx-check-t">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>
      ) : null}

      <FaqList title={`أسئلة شائعة عن ${t.name}`} faqs={t.faqs} />

      <section className="zx-faq" data-reveal>
        <h2 className="zx-h2">قوالب أخرى</h2>
        <div className="zx-pills">
          {others.map((o) => (
            <Link key={o.slug} href={`/templates/${o.slug}`} className="zx-pill-link">
              {o.name}
              <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <CtaBand
        title={`أنشئ ${t.name} خلال دقائق`}
        subtitle="اكتب نبذة قصيرة عن نشاطك، ويبني لك الذكاء الاصطناعي موقعًا عربيًا احترافيًا. المعاينة مجانية."
        primaryLabel="ابدأ ببناء موقعك"
        primaryHref={t.buildHref}
        secondaryLabel="شاهد نموذجًا حيًّا"
        secondaryHref={t.demoHref}
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
