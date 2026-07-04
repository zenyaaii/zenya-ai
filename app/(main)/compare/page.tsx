import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { COMPARISONS } from '@/lib/comparisons'
import { Breadcrumbs, CompareHero, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'زينيا مقابل المنافسين: ويكس، شوبيفاي، ووردبريس، سكوير سبيس والوكالات',
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
    languages: { ar: `${SITE}/compare`, en: `${SITE}/en/compare`, 'x-default': `${SITE}/compare` },
  },
  openGraph: {
    title: 'زينيا مقابل المنافسين — مقارنات صريحة',
    description:
      'مقارنات صريحة بين زينيا وويكس وشوبيفاي وووردبريس وسكوير سبيس والوكالات: اللغة العربية، الذكاء الاصطناعي، السعر، والاستضافة.',
    url: `${SITE}/compare`,
    type: 'website',
  },
}

export default function CompareHub() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'المقارنات', item: `${SITE}/compare` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'مقارنات زينيا مقابل المنافسين',
      itemListElement: COMPARISONS.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `زينيا مقابل ${c.them}`,
        url: `${SITE}/compare/${c.slug}`,
      })),
    },
  ]

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'الرئيسية', href: '/' }, { label: 'المقارنات' }]} />

        <CompareHero
          kicker="زينيا مقابل غيرها"
          title={
            <>
              لماذا يختار الناس <span className="gradient-text">زينيا</span>؟
            </>
          }
          intro={[
            'معظم منشئات المواقع عالمية وإنجليزية أولًا: تمنحك أدوات، لكنك تصمّم وتكتب كل شيء بنفسك. زينيا عربية أولًا، والذكاء الاصطناعي يكتب موقعك ويرتّب أقسامه من نبذة قصيرة — فتنطلق خلال دقائق.',
            'قارنّا زينيا بصدق مع أشهر البدائل. لكل مقارنة صفحة تشرح الفروق بالتفصيل، وتقول بوضوح متى يكون المنافس هو الخيار الأنسب لك.',
          ]}
        />

        {/* Comparison cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group flex flex-col rounded-2xl border border-token bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_16px_40px_-20px_rgba(28,28,28,0.25)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-foreground">
                  زينيا مقابل {c.them}
                  <span className="ms-1.5 font-latin text-[13px] font-medium text-subtle" dir="ltr">
                    {c.themLatin}
                  </span>
                </h2>
                <ArrowLeft
                  className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:-translate-x-1"
                  strokeWidth={2.25}
                />
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">{c.summary}</p>
            </Link>
          ))}
        </div>

        {/* Compact "at a glance" positioning — the honest one-liner */}
        <section className="mt-14 rounded-2xl border border-token bg-[var(--surface-2)] p-6 sm:p-8">
          <h2 className="heading-ar mb-4 text-[20px] text-foreground">الخلاصة في سطر</h2>
          <ul className="space-y-3 text-[14px] leading-[1.9] text-muted">
            <li>
              <span className="font-semibold text-foreground">عربية أولًا:</span> تخطيط RTL وخطوط ومحتوى مصمّم
              للعربية — لا ترجمة لاحقة.
            </li>
            <li>
              <span className="font-semibold text-foreground">الذكاء الاصطناعي يكتب لك:</span> من نبذة قصيرة إلى
              موقع كامل بالنصوص والتصميم.
            </li>
            <li>
              <span className="font-semibold text-foreground">جاهز خلال دقائق:</span> لا أسابيع انتظار ولا صيانة.
            </li>
            <li>
              <span className="font-semibold text-foreground">مُدار بالكامل:</span> استضافة أوروبية + SSL + GDPR،
              ونطاق مخصّص على Pro.
            </li>
            <li>
              <span className="font-semibold text-foreground">بسعر معقول:</span> مجانًا للتجربة، ثم 14.99$–24.99$
              شهريًا.
            </li>
          </ul>
        </section>

        <CtaBand />
      </div>
    </main>
  )
}
