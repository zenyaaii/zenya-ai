import type { Metadata } from 'next'
import { hreflangAlternates } from '@/lib/i18n/config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TEMPLATE_PAGES } from '@/lib/template-pages'
import { themePreview } from '@/lib/theme-previews'
import { Breadcrumbs, CompareHero, CtaBand } from '@/components/marketing/CompareParts'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'أنواع المواقع: مطعم، تطبيق، متجر، خدمات، عافية والمزيد',
  description:
    'أيًّا كان نشاطك، لزينيا قالب له: موقع مطعم، صفحة هبوط لتطبيق، متجر إلكتروني، موقع أزياء، موقع خدمات، مركز عافية، قصة علامة، أو متجر بمنتج واحد. اختر نوعك وأطلق موقعك بالذكاء الاصطناعي خلال دقائق.',
  keywords: [
    'أنواع المواقع',
    'إنشاء موقع مطعم',
    'صفحة هبوط تطبيق',
    'إنشاء متجر إلكتروني',
    'موقع خدمات',
    'موقع مركز عافية',
    'منشئ مواقع بالذكاء الاصطناعي',
  ],
  alternates: {
    canonical: `${SITE}/websites`,
    languages: hreflangAlternates(`${SITE}/websites`, `${SITE}/en/websites`),
  },
  openGraph: {
    title: 'أنواع المواقع التي تبنيها زينيا',
    description:
      'قالب لكل نشاط: مطعم، تطبيق، متجر، أزياء، خدمات، عافية، علامة تجارية، ومنتج واحد — بالذكاء الاصطناعي وبالعربية.',
    url: `${SITE}/websites`,
    type: 'website',
  },
}

export default function WebsitesHub() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'أنواع المواقع', item: `${SITE}/websites` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'أنواع المواقع في زينيا',
      itemListElement: TEMPLATE_PAGES.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        url: `${SITE}/websites/${t.slug}`,
      })),
    },
  ]

  return (
    <main className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Breadcrumbs trail={[{ label: 'الرئيسية', href: '/' }, { label: 'أنواع المواقع' }]} />

        <CompareHero
          kicker="قالب لكل نشاط"
          title={
            <>
              أيًّا كان نشاطك، لزينيا <span className="gradient-text">قالب له.</span>
            </>
          }
          intro={[
            'ثمانية قوالب احترافية، واحد لكل نوع نشاط — يكتب الذكاء الاصطناعي محتواها بالعربية ويجهّزها للنشر خلال دقائق. اختر نوع موقعك لتعرف ما يتضمّنه ولتشاهد نموذجًا حيًّا.',
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_PAGES.map((t) => (
            <Link
              key={t.slug}
              href={`/websites/${t.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-token bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)] hover:shadow-[0_18px_44px_-22px_rgba(28,28,28,0.28)]"
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={themePreview(t.key)}
                  alt={`نموذج ${t.name}`}
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <span
                  className="absolute end-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{ background: t.accent }}
                >
                  {t.label}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="flex items-center justify-between gap-2 text-[15.5px] font-bold text-foreground">
                  {t.name}
                  <ArrowLeft
                    className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:-translate-x-1"
                    strokeWidth={2.25}
                  />
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.75] text-muted">{t.audience}</p>
              </div>
            </Link>
          ))}
        </div>

        <CtaBand />
      </div>
    </main>
  )
}
