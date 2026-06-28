import './globals.css'
import { ReactNode } from 'react'
import type { Metadata } from 'next'
import SmoothScroll from '@/components/marketing/SmoothScroll'
import CookieConsent from '@/components/CookieConsent'

const SITE_URL = 'https://zenyaai.co'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'زينيا — منشئ المواقع بالذكاء الاصطناعي. كل قالب. جاهز خلال دقائق.',
    template: '%s · زينيا',
  },
  description:
    'زينيا منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي لكل نشاط تجاري. اختر من بين 8 قوالب احترافية — مطاعم، أزياء، تطبيقات، عافية، خدمات والمزيد — اكتب نبذة قصيرة، وتتكفّل زينيا بكتابة المحتوى ونشر الموقع خلال دقائق. ‎9.99$ مدى الحياة أو 19.99$ شهريًا مع استضافة كاملة.',
  applicationName: 'زينيا',
  generator: 'زينيا',
  keywords: [
    'منشئ مواقع بالذكاء الاصطناعي',
    'إنشاء موقع إلكتروني',
    'منشئ مواقع للشركات الصغيرة',
    'موقع مطعم',
    'صفحة هبوط لتطبيق',
    'موقع مركز عافية',
    'منشئ لوك بوك',
    'متجر شوبيفاي بمنتج واحد',
    'إنشاء موقع بدون برمجة',
    'كاتب محتوى بالذكاء الاصطناعي',
    'أطلق موقعك خلال دقائق',
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
    title: 'زينيا — منشئ المواقع بالذكاء الاصطناعي. كل قالب. جاهز خلال دقائق.',
    description:
      '8 قوالب مواقع احترافية مبنية بالذكاء الاصطناعي للمطاعم والأزياء والتطبيقات والعافية والخدمات ومتاجر شوبيفاي. اكتب نبذة → احصل على موقع كامل: نصوص وتصميم وصور جاهزة للنشر.',
    images: [
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'زينيا — منشئ المواقع بالذكاء الاصطناعي' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'زينيا — منشئ المواقع بالذكاء الاصطناعي. كل قالب. جاهز خلال دقائق.',
    description:
      'اكتب نبذة → احصل على موقع كامل. 8 قوالب مبنية بالذكاء الاصطناعي لكل نشاط تجاري. ‎9.99$ مدى الحياة أو 19.99$ شهريًا مع استضافة.',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: SITE_URL,
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

// JSON-LD: تُعرّف جوجل صراحةً بماهية زينيا — منصّة عربية لإنشاء المواقع
// بالذكاء الاصطناعي، موجَّهة للسوق العربي.
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'زينيا',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي لكل نشاط تجاري. 8 قوالب احترافية من المطاعم إلى متاجر شوبيفاي، جاهزة خلال دقائق.',
    foundingDate: '2025',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@zenyaai.co',
      availableLanguage: ['Arabic'],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'زينيا',
    operatingSystem: 'Web Browser',
    applicationCategory: 'BusinessApplication',
    description:
      'منشئ مواقع بالذكاء الاصطناعي. اختر قالبًا، اكتب نبذة، واحصل على موقع متكامل بالنصوص والتصميم والصور — جاهز للنشر.',
    url: SITE_URL,
    offers: [
      {
        '@type': 'Offer',
        name: 'برو مدى الحياة',
        price: '9.99',
        priceCurrency: 'USD',
        description: 'دفعة واحدة. توليد غير محدود بالذكاء الاصطناعي + تصدير شوبيفاي + ملف المشروع المضغوط.',
      },
      {
        '@type': 'Offer',
        name: 'برو مع الاستضافة',
        price: '19.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '19.99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
          unitText: 'MONTH',
        },
        description:
          'اشتراك شهري. تستضيف زينيا مواقعك، مع نطاق مخصّص وشهادة SSL وتحليلات. يشمل كل ما في باقة برو مدى الحياة.',
      },
      {
        '@type': 'Offer',
        name: 'مجاني',
        price: '0',
        priceCurrency: 'USD',
        description: '3 عمليات توليد بالذكاء الاصطناعي لتجربة زينيا. جميع القوالب الـ8 متاحة.',
      },
    ],
    // No aggregateRating: Zenya is early and we never publish invented ratings.
    // When real, approved reviews exist this can be populated from them.
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'زينيا',
    url: SITE_URL,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/themes?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <SmoothScroll />
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
