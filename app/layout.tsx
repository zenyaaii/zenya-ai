import './globals.css'
import { hreflangAlternates } from '@/lib/i18n/config'
import { ReactNode } from 'react'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import SmoothScroll from '@/components/marketing/SmoothScroll'
import PresenceBeacon from '@/components/marketing/PresenceBeacon'
import ZoomLock from '@/components/ZoomLock'
import CookieConsent from '@/components/CookieConsent'
import { NotifyProvider } from '@/components/ui/Notify'
import { resolveLocale } from '@/lib/i18n/server'
import { dirFor } from '@/lib/i18n/config'
import { LocaleProvider } from '@/components/i18n/LocaleProvider'
import { Analytics } from '@vercel/analytics/next'
import { TEMPLATE_PAGES } from '@/lib/template-pages'

const SITE_URL = 'https://zenyaai.co'

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'زينيا — منشئ المواقع العربي بالذكاء الاصطناعي لكل نشاط تجاري',
    template: '%s · زينيا',
  },
  description:
    'زينيا أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي، ومنصّة عربية لكل نشاط تجاري. اختر من بين 8 قوالب احترافية — مطاعم، أزياء، تطبيقات، عافية، خدمات والمزيد — اكتب نبذة قصيرة، وتتكفّل زينيا بكتابة المحتوى ونشر الموقع خلال دقائق. ‎14.99$ شهريًا (Starter) أو 24.99$ شهريًا مع استضافة كاملة (Pro).',
  applicationName: 'زينيا',
  generator: 'زينيا',
  keywords: [
    'منشئ مواقع بالذكاء الاصطناعي',
    'إنشاء موقع إلكتروني',
    'منشئ مواقع عربي',
    'منشئ مواقع للشركات الصغيرة',
    'موقع مطعم',
    'صفحة هبوط لتطبيق',
    'موقع مركز عافية',
    'منشئ لوك بوك',
    'متجر شوبيفاي بمنتج واحد',
    'إنشاء موقع بدون برمجة',
    'كاتب محتوى بالذكاء الاصطناعي',
    'أطلق موقعك خلال دقائق',
    'موقع احترافي بالعربية',
    'إنشاء موقع مجاني',
    'منشئ مواقع مصر',
    'منشئ مواقع السعودية',
    'بناء موقع للتجارة الإلكترونية',
    'أنشئ موقعك في دقائق',
  ],
  authors: [{ name: 'زينيا', url: SITE_URL }],
  creator: 'زينيا',
  publisher: 'زينيا',
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: SITE_URL,
    siteName: 'زينيا',
    title: 'زينيا — منشئ المواقع العربي بالذكاء الاصطناعي لكل نشاط تجاري',
    description:
      '8 قوالب مواقع احترافية مبنية بالذكاء الاصطناعي للمطاعم والأزياء والتطبيقات والعافية والخدمات ومتاجر شوبيفاي. اكتب نبذة → احصل على موقع كامل: نصوص وتصميم وصور جاهزة للنشر.',
    images: [
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'زينيا — منشئ المواقع بالذكاء الاصطناعي' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'زينيا — منشئ المواقع العربي بالذكاء الاصطناعي لكل نشاط تجاري',
    description:
      'اكتب نبذة → احصل على موقع كامل. 8 قوالب مبنية بالذكاء الاصطناعي لكل نشاط تجاري. ‎14.99$ شهريًا (Starter) أو 24.99$ شهريًا مع استضافة (Pro).',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: SITE_URL,
    languages: hreflangAlternates(SITE_URL, `${SITE_URL}/en`),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
}

/**
 * The title template carries the brand wordmark, which differs by script: an
 * English page ending in "· زينيا" looks like a mistake in the browser tab.
 * Everything else about the root metadata describes the Arabic marketing site
 * and is overridden per-page by the English section.
 */
export function generateMetadata(): Metadata {
  const locale = resolveLocale()
  if (locale !== 'en') return baseMetadata
  return {
    ...baseMetadata,
    title: { default: 'Zenya — The Arabic-First AI Website Builder', template: '%s · Zenya' },
  }
}

// JSON-LD: تُعرّف جوجل صراحةً بماهية زينيا — أوّل شركة إسلامية لإنشاء المواقع
// بالذكاء الاصطناعي، ومنصّة عربية موجَّهة للسوق العربي.
//
// البنية هنا رسم بياني (@id) وليست ثلاث بطاقات منفصلة: المؤسسة عقدة واحدة
// يشير إليها كلٌّ من التطبيق والموقع كـ publisher. هكذا تفهم جوجل أنها كيان
// واحد بثلاثة أوجه، بدل ثلاثة كيانات متشابهة الاسم — وهذا شرط ظهور بطاقة
// المعرفة (Knowledge Panel) لاسم العلامة.
const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

// حسابات حقيقية فقط. sameAs هو أقوى إشارة تربط اسم العلامة بكيانٍ واحد لدى
// جوجل، ويجب أن تطابق الروابط الظاهرة في التذييل (components/Footer.tsx).
const SOCIAL_PROFILES = [
  'https://www.tiktok.com/@zenyaai.co',
  'https://www.instagram.com/zenyaai.co',
  'https://x.com/zenyaaico',
]

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'زينيا',
    // النطق الإنجليزي للاسم. هذا ما يجعل جوجل تعرف أن "Zenya" و"Zenya AI"
    // — الاسم الذي ما زال مفهرسًا من الإصدار السابق — هما نفس الكيان الذي
    // يُسمّى اليوم "زينيا"، فتُدمج الإشارتان بدل أن تتنافسا.
    alternateName: ['Zenya', 'Zenya AI', 'زينيا للذكاء الاصطناعي', 'Zenya AI Website Builder'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      caption: 'زينيا',
    },
    image: `${SITE_URL}/opengraph-image`,
    description:
      'أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي، ومنصّة عربية لكل نشاط تجاري. 8 قوالب احترافية من المطاعم إلى متاجر شوبيفاي، جاهزة خلال دقائق.',
    // schema.org's purpose-built field for telling apart entities that share a
    // name. "Zenya" is crowded — a Dutch healthcare-quality company, a Taiwanese
    // network-equipment distributor, an investment firm — and the name is one
    // letter from Xenia and Zenia. So this states what THIS Zenya is, in the
    // terms a reader would use to tell it from the others: the language, the
    // market, the domain, and the fact that it builds sites for every kind of
    // business rather than one kind.
    disambiguatingDescription:
      'زينيا (Zenya AI) منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي على النطاق zenyaai.co. تُنشئ وتدير وتنشر مواقع كاملة لكل أنواع الأنشطة التجارية — مطاعم، علامات أزياء، تطبيقات، مراكز عافية، شركات خدمات، ومتاجر إلكترونية — وليست متجرًا إلكترونيًا ولا أداة لإنشاء متاجر المنتج الواحد فقط.',
    slogan: 'اكتب نبذة، واحصل على موقع.',
    foundingDate: '2025',
    knowsLanguage: ['ar', 'en'],
    knowsAbout: [
      'إنشاء المواقع بالذكاء الاصطناعي',
      'قوالب المواقع العربية',
      'التجارة الإلكترونية',
      'تحسين محركات البحث',
      'استضافة المواقع',
    ],
    // Every business type Zenya builds for, as a machine-readable catalogue.
    // The single strongest correction available for the category Google
    // currently has on file: an index entry still calls this a "One-Product
    // Store Builder", and a list of eight distinct verticals is a much harder
    // signal to misread than prose saying "for any business".
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'أنواع المواقع التي تبنيها زينيا',
      itemListElement: TEMPLATE_PAGES.map((t) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: t.name,
          serviceType: 'إنشاء موقع إلكتروني بالذكاء الاصطناعي',
          url: `${SITE_URL}/websites/${t.slug}`,
          provider: { '@id': ORG_ID },
          areaServed: 'الوطن العربي',
          availableLanguage: ['ar', 'en'],
        },
      })),
    },
    sameAs: SOCIAL_PROFILES,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@zenyaai.co',
      url: `${SITE_URL}/contact`,
      availableLanguage: ['Arabic', 'English'],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: 'زينيا',
    alternateName: ['Zenya', 'Zenya AI'],
    operatingSystem: 'Web Browser',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Website Builder',
    inLanguage: 'ar',
    publisher: { '@id': ORG_ID },
    description:
      'منشئ مواقع بالذكاء الاصطناعي. اختر قالبًا، اكتب نبذة، واحصل على موقع متكامل بالنصوص والتصميم والصور — جاهز للنشر.',
    url: SITE_URL,
    screenshot: `${SITE_URL}/opengraph-image`,
    featureList: [
      'توليد نصوص الموقع بالعربية بالذكاء الاصطناعي',
      '8 قوالب احترافية جاهزة',
      'محرّر مباشر بدون برمجة',
      'استضافة داخل الاتحاد الأوروبي مع شهادة SSL',
      'ربط نطاق مخصّص',
      'تصدير قالب شوبيفاي',
      'تحليلات زوّار بدون كوكيز',
      'أدوات تحسين محركات البحث وربط Search Console',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '14.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '14.99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
          unitText: 'MONTH',
        },
        description: 'اشتراك شهري. توليد غير محدود بالذكاء الاصطناعي + تصدير شوبيفاي + ملف المشروع المضغوط.',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '24.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '24.99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
          unitText: 'MONTH',
        },
        description:
          'اشتراك شهري. تستضيف زينيا مواقعك، مع نطاق مخصّص وشهادة SSL وتحليلات. يشمل كل ما في باقة Starter.',
      },
      {
        '@type': 'Offer',
        name: 'مجاني',
        price: '0',
        priceCurrency: 'USD',
        description: 'توليدان مجانيان بالذكاء الاصطناعي لتجربة زينيا. جميع القوالب الـ8 متاحة.',
      },
    ],
    // No aggregateRating: Zenya is early and we never publish invented ratings.
    // When real, approved reviews exist this can be populated from them.
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: 'زينيا',
    alternateName: ['Zenya', 'Zenya AI'],
    url: SITE_URL,
    inLanguage: 'ar',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/themes?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  // Shopify App Bridge must be the FIRST <script> in <head>, with no async
  // or defer attributes — otherwise app-bridge.js throws on load. Inject a
  // raw <script> only on /shopify/* so we don't ship it on the marketing
  // site. Pathname comes from middleware via the x-pathname header.
  const hdrs = headers()
  const pathname = hdrs.get('x-pathname') || ''
  const isShopifyRoute = pathname.startsWith('/shopify')
  // Customer sites (slug.zenyaai.co / custom domains) must NOT carry Zenya's
  // own brand JSON-LD — that would tell Google their page is about Zenya.
  // Middleware flags these requests; they inject their own correct schema.
  const isCustomerSite = hdrs.get('x-zenya-site') === '1' || pathname.startsWith('/s/')
  const shopifyApiKey = process.env.SHOPIFY_API_KEY || ''

  // Only the root layout may render <html>, so the document language is decided
  // here. A wrapper div cannot fix it, and getting it wrong makes screen readers
  // read English with Arabic pronunciation rules and weakens the hreflang signal.
  //
  // resolveLocale takes an /en/* path as English outright and otherwise honours
  // the user's saved choice, defaulting to Arabic. Customer sites are excluded:
  // a published site's language is a property of its content, not of whoever is
  // browsing it, so a visitor's dashboard preference must never flip it.
  const locale = isCustomerSite ? 'ar' : resolveLocale()
  const dir = dirFor(locale)

  return (
    <html lang={locale} dir={dir}>
      <head>
        {isShopifyRoute && shopifyApiKey && (
          <>
            <meta name="shopify-api-key" content={shopifyApiKey} />
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key={shopifyApiKey} />
          </>
        )}
        {!isCustomerSite && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {/* Caps the base UI at ~85% on touch devices and holds it there under
            Safari page-zoom, so the site magnifies (pinch) instead of reflowing
            — Apple-style. Zenya's own surfaces only; a customer's published site
            keeps its own untouched zoom behaviour. */}
        {!isCustomerSite && <ZoomLock />}
        <SmoothScroll />
        {/* Presence heartbeat feeds the live-users globe — anyone on a Zenya
            surface counts. Customer sites report via /api/insight instead. */}
        {!isCustomerSite && <PresenceBeacon surface={pathname.startsWith('/dashboard') ? 'app' : 'marketing'} />}
        <LocaleProvider locale={locale}>
          <NotifyProvider>
            {children}
          </NotifyProvider>
        </LocaleProvider>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
