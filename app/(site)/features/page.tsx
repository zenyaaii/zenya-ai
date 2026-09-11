/**
 * Candidate features page — the house style applied to what the product does.
 *
 * NOT the live page. It ships at /demo/features; app/(main)/features/page.tsx
 * is untouched. No API, no schema, no live route. noindex.
 *
 * DESIGN READ: a redesign of a capability page for someone deciding whether
 * the product covers their case, in the house language: flat #fafafa,
 * near-black Arabic at display size, hairlines instead of ten white cards,
 * and the accent only on the mark.
 * Dials: DESIGN_VARIANCE 7, MOTION_INTENSITY 4, VISUAL_DENSITY 5.
 *
 * MEASURED ON THE LIVE PAGE at 360/390/430/768/1440:
 *   · .gradient-text fills the headline.
 *   · .kicker prints "كل ما تحتاجه" at 11px (9.35px rendered), tracked
 *     +1.76px and uppercased on Arabic, at 4.28:1 against a 4.5 floor, above
 *     a 26px linear-gradient hairline.
 *   · The FAQ summaries stand 18.5px tall against the 32px a coarse pointer
 *     is owed, and the breadcrumb links 37x19.7.
 *   · Type under the floor: breadcrumbs at 10.63px, the ten feature bodies
 *     and the FAQ answers at 11.47px.
 *   · The measure is 83.5 Arabic characters a line at 1440.
 *   · The first call to action sits 2685px down at 390.
 *   · Ten identical white cards, each with a violet tinted tile.
 *
 * WHAT CAME BACK CLEAN, and it is worth saying because the doc predicted it:
 * NO NEGATIVE TRACKING anywhere in this batch. .display-ar and .heading-ar
 * both set letter-spacing: 0 !important, so the headings are honest about
 * Arabic. No horizontal scroll at any width. Nothing rests invisible with
 * JavaScript disabled: these are server components with no framer-motion, and
 * the FAQ is already native details. This corner of the marketing site got
 * the resting-state rule right, and the candidate keeps it rather than
 * regressing it.
 *
 * THE COPY IS THE LIVE COPY. FEATURES and FEATURE_FAQS are the live arrays,
 * moved without a word changed. Two things in them are findings rather than
 * edits: the FAQ retypes the prices ("14.99$", "24.99$") where
 * lib/company.ts carries STARTER_PRICE_DISPLAY and PRO_PRICE_DISPLAY, and the
 * copy carries inherited em-dashes. Neither is rewritten here.
 */

import type { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles, Languages, LayoutTemplate, Server, Globe, CreditCard,
  PencilRuler, BarChart3, Search, Gauge,
} from "lucide-react"
import Shell from "@/components/zenya/chrome/Shell"
import { Breadcrumbs, Hero, FaqList, CtaBand } from "@/components/zenya/chrome/Parts"
import type { QA } from "@/lib/faq-data"
import { CSS } from "@/components/zenya/features/styles"

import { hreflangAlternates } from '@/lib/i18n/config'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'المزايا: محتوى بالذكاء الاصطناعي، استضافة ونطاق',
  description:
    'كل ما تقدّمه زينيا: محتوى عربي يكتبه الذكاء الاصطناعي، 8 قوالب لكل نشاط، استضافة داخل الاتحاد الأوروبي مع SSL وGDPR، نطاق مخصّص مجاني على Pro، تصدير إلى شوبيفاي مع دفع آمن، محرّر مباشر، تحليلات، وجاهزية كاملة لمحرّكات البحث.',
  keywords: [
    'ميزات زينيا',
    'استضافة مواقع عربية',
    'ربط نطاق مخصّص',
    'قبول المدفوعات موقع',
    'محرّر مواقع بالذكاء الاصطناعي',
    'استضافة GDPR أوروبا',
    'تصدير شوبيفاي',
  ],
  alternates: {
    canonical: `${SITE}/features`,
    languages: hreflangAlternates(`${SITE}/features`, `${SITE}/en/features`),
  },
  openGraph: {
    title: 'ميزات زينيا — محتوى بالذكاء الاصطناعي، استضافة، نطاق، ودفع',
    description:
      'محتوى عربي بالذكاء الاصطناعي، 8 قوالب، استضافة أوروبية + SSL + GDPR، نطاق مخصّص، تصدير شوبيفاي مع دفع آمن، محرّر مباشر، وتحليلات.',
    url: `${SITE}/features`,
    type: 'website',
  },
}

/** The live page's ten features, titles and bodies unchanged. */
const FEATURES = [
  { icon: Sparkles, title: 'محتوى يكتبه الذكاء الاصطناعي', body: 'اكتب نبذة قصيرة عن نشاطك، ويولّد الذكاء الاصطناعي نصوص موقعك كاملة — عناوين، أوصاف، دعوات للفعل — بلغة عربية سليمة ومقنعة، ثم تعدّلها بأوامر بسيطة.' },
  { icon: Languages, title: 'عربي أولًا · اتجاه من اليمين إلى اليسار', body: 'زينيا مبنيّة للعربية من الأساس: تخطيط RTL، وخطوط مصمّمة للعربية، ومحتوى أصيل — وليست ترجمة لاحقة لقالب إنجليزي.' },
  { icon: LayoutTemplate, title: 'ثمانية قوالب لكل نوع نشاط', body: 'مطعم، لوك بوك أزياء، صفحة هبوط لتطبيق، قصة علامة تجارية، مركز عافية، خدمات، متجر بمنتجات متعددة، ومتجر بمنتج واحد. اختر ما يناسب نشاطك وابدأ.' },
  { icon: Server, title: 'استضافة أوروبية · SSL · GDPR', body: 'على خطة Pro تستضيف زينيا موقعك داخل الاتحاد الأوروبي مع شهادة SSL تلقائية والتزام كامل باللائحة العامة لحماية البيانات (GDPR) — دون أي إعداد تقني منك.' },
  { icon: Globe, title: 'نطاق مخصّص مجاني', body: 'اربط نطاقك الخاص (مثل mystore.com) على خطة Pro مع شهادة SSL وإزالة شارة زينيا — ونمنحك نطاقًا مخصّصًا مجانيًا لسنة كاملة (نطاق قياسي).' },
  { icon: CreditCard, title: 'تجارة إلكترونية ودفع آمن', body: 'قالبا المتجر يُصدَّران كثيمات شوبيفاي جاهزة تعمل على متجرك مباشرة، حيث يتولّى شوبيفاي السلة والدفع الآمن وإدارة المنتجات. تحصل على محتوى مكتوب لك، ودفعٍ موثوق.' },
  { icon: PencilRuler, title: 'محرّر مباشر وسهل', body: 'عدّل موقعك بنفسك بأوامر بسيطة، مع تراجع/إعادة، وحفظ تلقائي، ومعاينة متجاوبة لكل الشاشات — دون أي كود.' },
  { icon: BarChart3, title: 'تحليلات الزوّار', body: 'تابع زوّار موقعك ومصادرهم والأجهزة التي يستخدمونها من لوحة تحكّم بسيطة — لتعرف ما ينجح وتطوّره.' },
  { icon: Search, title: 'جاهز لمحرّكات البحث', body: 'كل موقع يخرج ببنية سليمة لمحرّكات البحث: عناوين ووصف تلقائي، بيانات منظّمة، وسرعة تحميل عالية — ليظهر نشاطك على جوجل.' },
  { icon: Gauge, title: 'سريع ومتجاوب', body: 'مواقع خفيفة وسريعة تعمل بسلاسة على الجوال والحاسب، لأن سرعة الموقع وتجربته تؤثّران مباشرةً في ثقة الزائر وترتيبك في البحث.' },
] as const

/** The live page's four FAQs, verbatim. */
const FEATURE_FAQS: QA[] = [
  { q: 'هل تستضيف زينيا موقعي؟', a: 'نعم، على خطة Pro. تستضيف زينيا موقعك داخل الاتحاد الأوروبي مع شهادة SSL تلقائية والتزام GDPR، دون أي إعداد تقني منك.' },
  { q: 'هل يمكنني ربط نطاقي الخاص؟', a: 'نعم على خطة Pro، مع شهادة SSL وإزالة شارة زينيا. كما نقدّم نطاقًا مخصّصًا مجانيًا لسنة كاملة (نطاق قياسي)، وخصم 30% على النطاقات الأخرى.' },
  { q: 'هل يمكن لموقعي قبول المدفوعات؟', a: 'للمتاجر، يُصدَّر قالب التجارة إلى شوبيفاي الذي يتولّى السلة والدفع الآمن. أما مواقع العرض (مطاعم، خدمات، عافية) فهي مواقع تعريفية تستضيفها زينيا.' },
  { q: 'كم تكلفة زينيا؟', a: 'تبدأ التجربة مجانًا (عمليتا توليد)، ثم خطة Starter بـ 14.99$ شهريًا، وخطة Pro بـ 24.99$ شهريًا تضيف الاستضافة الكاملة والنطاق المخصّص.' },
]

export default function DemoFeaturesPage() {
  return (
    <Shell css={CSS}>
      <Breadcrumbs trail={[{ label: "الرئيسية", href: "/" }, { label: "الميزات" }]} />

      {/* THE HEADLINE IS THE LIVE HEADLINE, em-dash and all: "كل شيء لإطلاق
          موقعك — مكتوبًا ومستضافًا لك." An earlier draft of this file swapped
          that dash for a comma, which is the skill's em-dash rule applied to
          somebody else's sentence. The rule bans INTRODUCING one; it does not
          license editing the product's copy to remove one.

          One action in the hero, and its label is one the page already
          carries in the band at the foot, so this is the set's single label
          for the intent rather than a second intent. An earlier draft put a
          second link beside it labelled "شاهد أنواع المواقع", which is a
          string this file would have invented rather than moved. */}
      <Hero
        eyebrow="كل ما تحتاجه"
        title={<>{"كل شيء لإطلاق موقعك —"}</>}
        mark={<>مكتوبًا ومستضافًا لك.</>}
        intro={[
          "زينيا ليست مجرّد قوالب. من المحتوى الذي يكتبه الذكاء الاصطناعي، إلى الاستضافة الأوروبية والنطاق المخصّص والدفع الآمن — كل ما يحتاجه نشاطك ليظهر باحترافية في مكان واحد.",
        ]}
        actions={<Link href="/login?mode=signup" className="zx-act-1">ابدأ الإنشاء مجانًا</Link>}
      />

      <section className="zx-feats zx-wide" data-reveal>
        <ul className="zx-flist">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <li className="zx-fitem" key={f.title}>
                <Icon className="zx-ficon" size={19} strokeWidth={1.9} aria-hidden />
                <h2 className="zx-ftitle">{f.title}</h2>
                <p className="zx-fbody">{f.body}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <FaqList title="أسئلة شائعة عن الميزات" faqs={FEATURE_FAQS} />
      <CtaBand />
    </Shell>
  )
}
