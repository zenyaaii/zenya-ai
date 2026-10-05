import type { Metadata } from 'next'
import { hreflangAlternates } from '@/lib/i18n/config'
import type { ReactNode } from 'react'
import { FAQS } from '@/lib/pricing-faqs'
import { COMPANY, usdTrailing } from '@/lib/company'
import { share } from '@/lib/site-share'

/**
 * This route is the ARABIC pricing page — /en/pricing is the English twin.
 * Its title, description and FAQ markup were all still English, so the Arabic
 * SERP entry read as a foreign-language page and the FAQPage schema described
 * questions no visitor could find on the page. Both are Arabic now, and the
 * schema is generated from the same array the accordion renders.
 */

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: `الأسعار — باقة مجانية، Starter بـ ${usdTrailing(COMPANY.STARTER_PRICE_USD)} شهريًا، Pro بـ ${usdTrailing(COMPANY.PRO_PRICE_USD)}`,
  description:
    `ابدأ مجانًا بقالبين بالذكاء الاصطناعي، ثم Starter بـ ${usdTrailing(COMPANY.STARTER_PRICE_USD)} شهريًا، وPro بـ ${usdTrailing(COMPANY.PRO_PRICE_USD)} شهريًا مع نطاق مجاني لسنة. ألغِ متى شئت.`,
  keywords: [
    'أسعار منشئ المواقع',
    'كم تكلفة إنشاء موقع',
    'اشتراك منشئ مواقع بالذكاء الاصطناعي',
    'أرخص طريقة لعمل موقع',
    'تكلفة تصميم موقع إلكتروني',
    'استضافة موقع بالعربية',
  ],
  alternates: {
    canonical: `${SITE}/pricing`,
    languages: hreflangAlternates(`${SITE}/pricing`, `${SITE}/en/pricing`),
  },
  ...share({
    title: `أسعار زينيا — من باقة مجانية إلى ${usdTrailing(COMPANY.PRO_PRICE_USD)} شهريًا مع الاستضافة`,
    description:
      'ثلاث خطط واضحة: باقة مجانية للبداية، Starter للتوليد غير المحدود، Pro مع الاستضافة والنطاق المجاني. لا عقود، والإلغاء في أي وقت.',
    url: `${SITE}/pricing`,
  }),
}

// Built from FAQS so the markup can never describe a question the page does
// not show — that mismatch is what disqualifies a page from FAQ rich results.
const PRICING_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'ar',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
}

// The three plans as machine-readable offers, so a price can surface directly
// in the result instead of only inside the page body.
const PRICING_OFFER_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'زينيا — منشئ المواقع بالذكاء الاصطناعي',
  description:
    'منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي: 8 قوالب احترافية، توليد المحتوى بالعربية، نشر واستضافة ونطاق مخصّص.',
  brand: { '@type': 'Brand', name: 'زينيا' },
  url: `${SITE}/pricing`,
  offers: [
    {
      '@type': 'Offer',
      name: 'الباقة المجانية',
      price: '0.00',
      priceCurrency: 'USD',
      url: `${SITE}/pricing`,
      availability: 'https://schema.org/InStock',
      description: 'مجانًا: توليد قالبين بالذكاء الاصطناعي والنشر على نطاق فرعي.',
    },
    {
      '@type': 'Offer',
      name: 'Starter',
      price: String(COMPANY.STARTER_PRICE_USD),
      priceCurrency: 'USD',
      url: `${SITE}/pricing`,
      availability: 'https://schema.org/InStock',
      description: 'اشتراك شهري: توليد غير محدود، نطاقك الخاص، حجوزات وتحليلات، وتصدير شوبيفاي.',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: String(COMPANY.PRO_PRICE_USD),
      priceCurrency: 'USD',
      url: `${SITE}/pricing`,
      availability: 'https://schema.org/InStock',
      description: 'كل ما في Starter، مع نطاق مخصّص مجاني لسنة وإزالة شارة زينيا.',
    },
  ],
}

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([PRICING_FAQ_SCHEMA, PRICING_OFFER_SCHEMA]) }}
      />
      {children}
    </>
  )
}
