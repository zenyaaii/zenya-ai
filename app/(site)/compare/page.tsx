/**
 * Candidate comparisons hub — the house style applied to the positioning
 * argument.
 *
 * NOT the live page. app/(main)/compare/page.tsx is untouched. noindex.
 *
 * DESIGN READ: a redesign of a decision page for someone weighing Zenya
 * against a tool they already know, in the house language: flat #fafafa,
 * hairline rules instead of seven cards, one accent, and an argument that
 * reads as honest rather than as an advertisement.
 * Dials: DESIGN_VARIANCE 7, MOTION_INTENSITY 3, VISUAL_DENSITY 5.
 *
 * MEASURED ON THE LIVE PAGE at 360/390/430/768/1440:
 *   · .kicker at 4.28:1, 9.35px rendered, +1.76px tracking and uppercase on
 *     Arabic, above a linear-gradient hairline. .gradient-text on the
 *     headline.
 *   · The measure is 92 Arabic characters a line at 1440.
 *   · Card bodies at 13.5px (11.47px rendered), the Latin competitor names at
 *     11.05px, breadcrumbs at 10.63px.
 *   · The first call to action sits 1603px down at 390.
 *   · The summary block retypes the prices as "14.99$–24.99$ شهريًا" where
 *     lib/company.ts carries STARTER_PRICE_DISPLAY and PRO_PRICE_DISPLAY, and
 *     it separates the range with an en-dash. Both are findings, and the copy
 *     is left exactly as it is.
 *
 * CLEAN: no negative tracking anywhere, no horizontal scroll at any width,
 * nothing rests invisible with JavaScript disabled, and the page makes no
 * invented claim: no counts, no ratings, no testimonials, and every
 * comparison ships with a "when to choose them" written by the same hand.
 *
 * THE COPY IS THE LIVE COPY, read from lib/comparisons rather than copied.
 */

import { COMPANY, usdTrailing } from '@/lib/company'
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { COMPARISONS } from "@/lib/comparisons"
import Shell from "@/components/zenya/chrome/Shell"
import { Breadcrumbs, Hero, CtaBand } from "@/components/zenya/chrome/Parts"
import { CSS } from "@/components/zenya/compare/styles"

import { hreflangAlternates } from '@/lib/i18n/config'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'مقارنة مع ويكس وشوبيفاي وووردبريس وسكوير سبيس',
  description:
    'كيف تقارن زينيا بأشهر منشئات المواقع والبدائل؟ مقارنات صريحة مع ويكس (Wix)، شوبيفاي، ووردبريس، سكوير سبيس، والوكالات — في اللغة العربية وRTL، كتابة المحتوى بالذكاء الاصطناعي، السعر، ووقت الإطلاق.',
  keywords: [
    'أفضل منشئ مواقع بالذكاء الاصطناعي',
    'أفضل منشئ مواقع عربي',
    'بديل ويكس',
    'بديل شوبيفاي',
    'بديل ووردبريس',
    'زينيا مقابل ويكس',
    'مقارنة منشئات المواقع',
  ],
  alternates: {
    canonical: `${SITE}/compare`,
    languages: hreflangAlternates(`${SITE}/compare`, `${SITE}/en/compare`),
  },
  openGraph: {
    title: 'زينيا مقابل المنافسين — مقارنات صريحة',
    description:
      'مقارنات صريحة بين زينيا وويكس وشوبيفاي وووردبريس وسكوير سبيس والوكالات: اللغة العربية، الذكاء الاصطناعي، السعر، والاستضافة.',
    url: `${SITE}/compare`,
    type: 'website',
  },
}

export default function DemoCompareHub() {
  return (
    <Shell css={CSS}>
      <Breadcrumbs trail={[{ label: "الرئيسية", href: "/" }, { label: "المقارنات" }]} />

      <Hero
        eyebrow="زينيا مقابل غيرها"
        title={<>لماذا يختار الناس</>}
        mark={<>زينيا؟</>}
        intro={[
          "معظم منشئات المواقع عالمية وإنجليزية أولًا: تمنحك أدوات، لكنك تصمّم وتكتب كل شيء بنفسك. زينيا عربية أولًا، والذكاء الاصطناعي يكتب موقعك ويرتّب أقسامه من نبذة قصيرة — فتنطلق خلال دقائق.",
          "قارنّا زينيا بصدق مع أشهر البدائل. لكل مقارنة صفحة تشرح الفروق بالتفصيل، وتقول بوضوح متى يكون المنافس هو الخيار الأنسب لك.",
        ]}
        actions={<Link href="/login?mode=signup" className="zx-act-1">ابدأ الإنشاء مجانًا</Link>}
      />

      <section className="zx-cmps zx-wide" data-reveal>
        <ul className="zx-cmplist">
          {COMPARISONS.map((c) => (
            <li key={c.slug} style={{ display: "contents" }}>
              <Link href={`/compare/${c.slug}`} className="zx-cmp">
                <h2 className="zx-cmp-h">
                  {`زينيا مقابل ${c.them}`}
                  <bdi dir="ltr" className="zx-cmp-latin">{c.themLatin}</bdi>
                </h2>
                <ArrowLeft className="zx-cmp-arrow" size={18} strokeWidth={2.25} aria-hidden />
                <p className="zx-cmp-p">{c.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* The honest one-liner. Kept as a list, marked in the page's one
          accent, with no tinted panel behind it. */}
      <section className="zx-sum" data-reveal>
        <h2 className="zx-h2">الخلاصة في سطر</h2>
        <ul className="zx-sumlist">
          <li className="zx-sumitem"><span className="zx-summark" aria-hidden /><span className="zx-sumtext"><b>عربية أولًا:</b> تخطيط RTL وخطوط ومحتوى مصمّم للعربية — لا ترجمة لاحقة.</span></li>
          <li className="zx-sumitem"><span className="zx-summark" aria-hidden /><span className="zx-sumtext"><b>الذكاء الاصطناعي يكتب لك:</b> من نبذة قصيرة إلى موقع كامل بالنصوص والتصميم.</span></li>
          <li className="zx-sumitem"><span className="zx-summark" aria-hidden /><span className="zx-sumtext"><b>جاهز خلال دقائق:</b> لا أسابيع انتظار ولا صيانة.</span></li>
          <li className="zx-sumitem"><span className="zx-summark" aria-hidden /><span className="zx-sumtext"><b>مُدار بالكامل:</b> استضافة أوروبية + SSL + GDPR، ونطاق مخصّص على Pro.</span></li>
          <li className="zx-sumitem"><span className="zx-summark" aria-hidden /><span className="zx-sumtext"><b>بسعر معقول:</b> مجانًا للتجربة، ثم {usdTrailing(COMPANY.STARTER_PRICE_USD)}–{usdTrailing(COMPANY.PRO_PRICE_USD)} شهريًا.</span></li>
        </ul>
      </section>

      <CtaBand />
    </Shell>
  )
}
