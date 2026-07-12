import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Timer,
  Layers,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react'
import { ARTICLES, type Article } from './copy'
import { auroraTints } from '@/lib/aurora-tints'
import { themePreview, themePreviewFallback } from '@/lib/theme-previews'

/**
 * /why/[type] — the SEO editorial page linked from ShowcaseSection's
 * "اقرأ المزيد" button. Server-rendered, no client JS unless a section
 * needs it. Each of the 8 templates gets its own long-form article about
 * why an owner in that category needs a professional site.
 *
 * The page is intentionally NOT linked from nav / footer / any listing —
 * it's reachable only from the arc-carousel card and (for Google) from
 * sitemap.xml. This is the user's ask: orphan for humans, indexed for
 * search.
 */

const SITE = 'https://zenyaai.co'

type Params = { params: { type: string } }

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((type) => ({ type }))
}

export function generateMetadata({ params }: Params): Metadata {
  const article = ARTICLES[params.type as Article['key']]
  if (!article) return { title: 'زينيا' }
  return {
    title: article.meta.title,
    description: article.meta.description,
    keywords: article.meta.keywords,
    alternates: { canonical: `${SITE}/why/${article.key}` },
    openGraph: {
      title: article.meta.title,
      description: article.meta.description,
      url: `${SITE}/why/${article.key}`,
      type: 'article',
    },
    robots: { index: true, follow: true },
  }
}

export default function Page({ params }: Params) {
  const article = ARTICLES[params.type as Article['key']]
  if (!article) notFound()
  const tint = auroraTints[article.key]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.meta.title,
    description: article.meta.description,
    mainEntityOfPage: `${SITE}/why/${article.key}`,
    author: { '@type': 'Organization', name: 'زينيا', url: SITE },
    publisher: {
      '@type': 'Organization',
      name: 'زينيا',
      logo: { '@type': 'ImageObject', url: `${SITE}/icon.png` },
    },
    inLanguage: 'ar',
  }

  return (
    <main className="relative overflow-hidden pb-24">
      {/* JSON-LD Article schema for Google */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Accent glow — subtle template-tinted radial behind the whole page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{
          background: `radial-gradient(60% 50% at 50% 20%, ${tint.orb1}, transparent 78%)`,
        }}
      />

      <article className="mx-auto max-w-3xl px-6">
        {/* Breadcrumb / back to arc */}
        <nav aria-label="مسار التصفّح" className="pt-10">
          <Link
            href="/#showcase-heading"
            className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl-flip transition-transform group-hover:-translate-x-0.5" strokeWidth={2.25} />
            رجوع إلى القوالب
          </Link>
        </nav>

        {/* Hero: kicker + h1 + lead */}
        <header className="mt-6">
          <p
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: `${tint.accent}14`, color: tint.accent }}
          >
            <Sparkles className="h-3 w-3" strokeWidth={2.25} />
            {article.hero.kicker}
          </p>
          <h1 className="heading-ar text-[clamp(32px,5.5vw,50px)] leading-[1.15] text-foreground">
            {article.hero.h1}
          </h1>
          <p className="lead-ar mt-5 text-[17.5px] leading-[1.85] text-muted">
            {article.hero.lead}
          </p>
        </header>

        {/* Hero image — real template screenshot in a browser frame */}
        <HeroImage article={article} tint={tint} />

        {/* Body sections */}
        <div className="prose-ar mt-14 space-y-14">
          {article.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
              <h2
                id={`${s.id}-h`}
                className="text-[26px] font-[600] leading-[1.25] tracking-[-0.4px] text-foreground sm:text-[30px]"
              >
                {s.title}
              </h2>
              <div className="mt-4 space-y-4 text-[16.5px] leading-[1.95] text-foreground/85">
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {s.illustration && (
                <div className="mt-7">
                  <SectionIllustration kind={s.illustration} tint={tint} />
                </div>
              )}
            </section>
          ))}

          {/* Stats — the "real numbers" block */}
          <section aria-labelledby="stats-h" className="scroll-mt-24">
            <h2
              id="stats-h"
              className="text-[26px] font-[600] leading-[1.25] tracking-[-0.4px] text-foreground sm:text-[30px]"
            >
              أرقام من الواقع (بمصادرها)
            </h2>
            <p className="mt-3 text-[15px] leading-[1.85] text-muted">
              كل رقم أدناه من مصدر بحثي معروف — لا أرقام مُختلقة. راجع اسم المصدر تحت كل إحصاءة.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {article.stats.map((st, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-token bg-white p-5"
                  style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.03)' }}
                >
                  <div
                    className="font-latin text-[30px] font-[700] leading-none tracking-[-0.5px]"
                    style={{ color: tint.accent }}
                    dir="ltr"
                  >
                    {st.figure}
                  </div>
                  <p className="mt-2 text-[14px] leading-[1.65] text-foreground/85">
                    {st.label}
                  </p>
                  <p className="mt-2.5 text-[11.5px] font-medium uppercase tracking-[0.08em] text-muted" dir="ltr">
                    Source · {st.source}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Checklist */}
          <section aria-labelledby="checklist-h" className="scroll-mt-24">
            <h2
              id="checklist-h"
              className="text-[26px] font-[600] leading-[1.25] tracking-[-0.4px] text-foreground sm:text-[30px]"
            >
              قائمة التحقّق قبل الإطلاق
            </h2>
            <ul className="mt-6 space-y-2.5">
              {article.checklist.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-token bg-white/70 p-3.5 backdrop-blur"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                    strokeWidth={2}
                    style={{ color: tint.accent }}
                  />
                  <span className="text-[15px] leading-[1.6] text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* CTA */}
        <section
          className="mt-16 overflow-hidden rounded-3xl border border-token p-8 sm:p-10"
          style={{
            background: `linear-gradient(140deg, ${tint.orb1} 0%, rgba(255,255,255,0.85) 55%, ${tint.orb2} 100%)`,
            backdropFilter: 'blur(18px)',
          }}
        >
          <p
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: `${tint.accent}18`, color: tint.accent }}
          >
            <Sparkles className="h-3 w-3" strokeWidth={2.25} />
            جاهز خلال دقائق
          </p>
          <h3 className="text-[26px] font-[590] leading-[1.2] tracking-[-0.4px] text-foreground sm:text-[32px]">
            أنشئ قالب {article.templateName} مع زينيا
          </h3>
          <p className="mt-3 max-w-lg text-[15.5px] leading-[1.75] text-foreground/80">
            اكتب نبذة قصيرة عن نشاطك، ويبني لك الذكاء الاصطناعي موقعًا عربيًا احترافيًا
            بمحتوى مصمَّم لتحويل الزوّار إلى عملاء.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={article.buildHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white btn-shadow-primary transition hover:-translate-y-0.5"
            >
              ابدأ الآن مجانًا
              <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.5} />
            </Link>
            <Link
              href={article.demoHref}
              className="inline-flex items-center gap-2 rounded-lg border border-token bg-white/70 px-6 py-3 text-[14px] font-semibold text-foreground backdrop-blur transition hover:bg-white"
            >
              شاهد العرض الحي
              <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </article>
    </main>
  )
}

/* ────────────────── hero + section illustrations ────────────────── */

function HeroImage({ article, tint }: { article: Article; tint: { accent: string; orb1: string; orb2: string } }) {
  return (
    <div
      className="mt-10 overflow-hidden rounded-3xl border border-token"
      style={{
        boxShadow: `0 40px 90px -34px ${tint.accent}44`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
      }}
    >
      {/* mini browser chrome */}
      <div
        className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ background: '#faf8f3', borderBottom: '1px solid #f0ede6' }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: '#fca5a5' }} />
        <span className="h-2 w-2 rounded-full" style={{ background: '#fcd34d' }} />
        <span className="h-2 w-2 rounded-full" style={{ background: '#86efac' }} />
        <span
          className="ms-3 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
          style={{ background: `${tint.accent}18`, color: tint.accent }}
          dir="ltr"
        >
          zenyaai.co/demo/{article.key}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={themePreview(article.key)}
        alt={`مثال حقيقي لقالب ${article.templateName} من زينيا`}
        loading="eager"
        className="block h-auto w-full"
        style={{ objectFit: 'cover', maxHeight: 520 }}
      />
    </div>
  )
}

/**
 * Section illustrations — CSS/SVG-only, no external images. Each variant
 * is a small conceptual mockup (icon + shape composition) matched to the
 * section it belongs under.
 */
function SectionIllustration({
  kind,
  tint,
}: {
  kind: 'firstImpression' | 'featureGrid' | 'checklistIcon' | 'trend' | 'trust'
  tint: { accent: string; orb1: string; orb2: string }
}) {
  const wrap = 'rounded-2xl border border-token p-6'
  const wrapStyle = {
    background: `linear-gradient(140deg, ${tint.orb1} 0%, rgba(255,255,255,0.9) 55%, ${tint.orb2} 100%)`,
    boxShadow: `0 20px 40px -30px ${tint.accent}55`,
  } as React.CSSProperties

  if (kind === 'firstImpression') {
    return (
      <figure className={wrap} style={wrapStyle}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: tint.accent }}
          >
            <Timer className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: tint.accent }}>
              انطباع أول
            </div>
            <div className="mt-1 font-latin text-[22px] font-[700] text-foreground" dir="ltr">
              50 ms
            </div>
            <div className="mt-1 text-[13px] text-muted">
              الوقت الذي يحتاجه الزائر ليُكوِّن حكمه على موقعك
            </div>
          </div>
        </div>
      </figure>
    )
  }

  if (kind === 'featureGrid') {
    return (
      <figure className={wrap} style={wrapStyle}>
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: tint.accent }} strokeWidth={2.25} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: tint.accent }}>
            بنية القالب
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['بطل', 'ميزات', 'ثقة', 'شهادات', 'باقات', 'دعوة'].map((label, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/85 p-3 text-center text-[12px] font-semibold text-foreground/85"
              style={{ border: '1px solid rgba(28,28,28,0.06)' }}
            >
              {label}
            </div>
          ))}
        </div>
      </figure>
    )
  }

  if (kind === 'trend') {
    return (
      <figure className={wrap} style={wrapStyle}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: tint.accent }} strokeWidth={2.25} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: tint.accent }}>
            أثر التسويق الجيّد
          </span>
        </div>
        {/* neutral abstract bar chart — no invented figures, just visual rhythm */}
        <div className="flex h-24 items-end gap-1.5">
          {[35, 48, 42, 62, 55, 74, 88].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-md"
              style={{
                height: `${h}%`,
                background:
                  i >= 5 ? tint.accent : `${tint.accent}44`,
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted">
          الأرقام أعلاه توضيحية لإيقاع النمو، لا لبيانات محدّدة.
        </p>
      </figure>
    )
  }

  if (kind === 'trust') {
    return (
      <figure className={wrap} style={wrapStyle}>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6" style={{ color: tint.accent }} strokeWidth={2} />
          <div>
            <div className="text-[13px] font-semibold text-foreground">إشارات ثقة</div>
            <div className="text-[12px] text-muted">شارات، تقييمات، ضمان استرداد</div>
          </div>
        </div>
      </figure>
    )
  }

  // checklistIcon
  return (
    <figure className={wrap} style={wrapStyle}>
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6" style={{ color: tint.accent }} strokeWidth={2} />
        <div>
          <div className="text-[13px] font-semibold text-foreground">اختبِر قبل النشر</div>
          <div className="text-[12px] text-muted">قائمة تحقّق قصيرة تحمي المشروع من أخطاء الإطلاق</div>
        </div>
      </div>
    </figure>
  )
}
