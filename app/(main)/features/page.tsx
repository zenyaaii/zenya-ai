import type { Metadata } from 'next'
import {
  Sparkles,
  Languages,
  LayoutTemplate,
  Server,
  Globe,
  CreditCard,
  PencilRuler,
  BarChart3,
  Search,
  Gauge,
} from 'lucide-react'
import { Breadcrumbs, CompareHero, FaqList, CtaBand } from '@/components/marketing/CompareParts'
import type { QA } from '@/app/(main)/faq/faq-data'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'ميزات زينيا: محتوى بالذكاء الاصطناعي، استضافة، نطاق، ودفع',
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
    languages: { ar: `${SITE}/features`, en: `${SITE}/en/features`, 'x-default': `${SITE}/features` },
  },
  openGraph: {
    title: 'ميزات زينيا — محتوى بالذكاء الاصطناعي، استضافة، نطاق، ودفع',
    description:
      'محتوى عربي بالذكاء الاصطناعي، 8 قوالب، استضافة أوروبية + SSL + GDPR، نطاق مخصّص، تصدير شوبيفاي مع دفع آمن، محرّر مباشر، وتحليلات.',
    url: `${SITE}/features`,
    type: 'website',
  },
}

type Feature = { icon: typeof Sparkles; title: string; body: string }

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: 'محتوى يكتبه الذكاء الاصطناعي',
    body: 'اكتب نبذة قصيرة عن نشاطك، ويولّد الذكاء الاصطناعي نصوص موقعك كاملة — عناوين، أوصاف، دعوات للفعل — بلغة عربية سليمة ومقنعة، ثم تعدّلها بأوامر بسيطة.',
  },
  {
    icon: Languages,
    title: 'عربي أولًا · اتجاه من اليمين إلى اليسار',
    body: 'زينيا مبنيّة للعربية من الأساس: تخطيط RTL، وخطوط مصمّمة للعربية، ومحتوى أصيل — وليست ترجمة لاحقة لقالب إنجليزي.',
  },
  {
    icon: LayoutTemplate,
    title: 'ثمانية قوالب لكل نوع نشاط',
    body: 'مطعم، لوك بوك أزياء، صفحة هبوط لتطبيق، قصة علامة تجارية، مركز عافية، خدمات، متجر بمنتجات متعددة، ومتجر بمنتج واحد. اختر ما يناسب نشاطك وابدأ.',
  },
  {
    icon: Server,
    title: 'استضافة أوروبية · SSL · GDPR',
    body: 'على خطة Pro تستضيف زينيا موقعك داخل الاتحاد الأوروبي مع شهادة SSL تلقائية والتزام كامل باللائحة العامة لحماية البيانات (GDPR) — دون أي إعداد تقني منك.',
  },
  {
    icon: Globe,
    title: 'نطاق مخصّص مجاني',
    body: 'اربط نطاقك الخاص (مثل mystore.com) على خطة Pro مع شهادة SSL وإزالة شارة زينيا — ونمنحك نطاقًا مخصّصًا مجانيًا لأول شهرين.',
  },
  {
    icon: CreditCard,
    title: 'تجارة إلكترونية ودفع آمن',
    body: 'قالبا المتجر يُصدَّران كثيمات شوبيفاي جاهزة تعمل على متجرك مباشرة، حيث يتولّى شوبيفاي السلة والدفع الآمن وإدارة المنتجات. تحصل على محتوى مكتوب لك، ودفعٍ موثوق.',
  },
  {
    icon: PencilRuler,
    title: 'محرّر مباشر وسهل',
    body: 'عدّل موقعك بنفسك بأوامر بسيطة، مع تراجع/إعادة، وحفظ تلقائي، ومعاينة متجاوبة لكل الشاشات — دون أي كود.',
  },
  {
    icon: BarChart3,
    title: 'تحليلات الزوّار',
    body: 'تابع زوّار موقعك ومصادرهم والأجهزة التي يستخدمونها من لوحة تحكّم بسيطة — لتعرف ما ينجح وتطوّره.',
  },
  {
    icon: Search,
    title: 'جاهز لمحرّكات البحث',
    body: 'كل موقع يخرج ببنية سليمة لمحرّكات البحث: عناوين ووصف تلقائي، بيانات منظّمة، وسرعة تحميل عالية — ليظهر نشاطك على جوجل.',
  },
  {
    icon: Gauge,
    title: 'سريع ومتجاوب',
    body: 'مواقع خفيفة وسريعة تعمل بسلاسة على الجوال والحاسب، لأن سرعة الموقع وتجربته تؤثّران مباشرةً في ثقة الزائر وترتيبك في البحث.',
  },
]

const FEATURE_FAQS: QA[] = [
  {
    q: 'هل تستضيف زينيا موقعي؟',
    a: 'نعم، على خطة Pro. تستضيف زينيا موقعك داخل الاتحاد الأوروبي مع شهادة SSL تلقائية والتزام GDPR، دون أي إعداد تقني منك.',
  },
  {
    q: 'هل يمكنني ربط نطاقي الخاص؟',
    a: 'نعم على خطة Pro، مع شهادة SSL وإزالة شارة زينيا. كما نقدّم نطاقًا مخصّصًا مجانيًا لأول شهرين.',
  },
  {
    q: 'هل يمكن لموقعي قبول المدفوعات؟',
    a: 'للمتاجر، يُصدَّر قالب التجارة إلى شوبيفاي الذي يتولّى السلة والدفع الآمن. أما مواقع العرض (مطاعم، خدمات، عافية) فهي مواقع تعريفية تستضيفها زينيا.',
  },
  {
    q: 'كم تكلفة زينيا؟',
    a: 'تبدأ التجربة مجانًا (عمليتا توليد)، ثم خطة Starter بـ 14.99$ شهريًا، وخطة Pro بـ 24.99$ شهريًا تضيف الاستضافة الكاملة والنطاق المخصّص.',
  },
]

export default function FeaturesPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'الميزات', item: `${SITE}/features` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FEATURE_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'الرئيسية', href: '/' }, { label: 'الميزات' }]} />

        <CompareHero
          kicker="كل ما تحتاجه"
          title={
            <>
              كل شيء لإطلاق موقعك — <span className="gradient-text">مكتوبًا ومستضافًا لك.</span>
            </>
          }
          intro={[
            'زينيا ليست مجرّد قوالب. من المحتوى الذي يكتبه الذكاء الاصطناعي، إلى الاستضافة الأوروبية والنطاق المخصّص والدفع الآمن — كل ما يحتاجه نشاطك ليظهر باحترافية في مكان واحد.',
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-2xl border border-token bg-white p-5">
                <span
                  className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h2 className="mb-1.5 text-[15.5px] font-bold text-foreground">{f.title}</h2>
                <p className="text-[13.5px] leading-[1.8] text-muted">{f.body}</p>
              </div>
            )
          })}
        </div>

        <FaqList title="أسئلة شائعة عن الميزات" faqs={FEATURE_FAQS} />

        <CtaBand />
      </div>
    </main>
  )
}
