import type { Metadata } from 'next'
import { hreflangAlternates } from '@/lib/i18n/config'
import type { ReactNode } from 'react'
import { AR_FAQS } from '@/lib/faq-data'
import { share } from '@/lib/site-share'

export const metadata: Metadata = {
  title: 'أسئلة شائعة عن إنشاء موقع',
  description:
    'إجابات واضحة عن بينون: كيف تعمل، القوالب الثمانية، الأسعار، الاستضافة، ربط النطاق، والتصدير إلى شوبيفاي.',
  keywords: [
    'أسئلة شائعة بينون',
    'كيف تعمل بينون',
    'منشئ مواقع',
    'أسعار بينون',
    'Beynoun FAQ',
    'website builder questions',
  ],
  alternates: {
    canonical: '/faq',
    languages: hreflangAlternates('https://beynoun.com/faq', 'https://beynoun.com/en/faq'),
  },
  ...share({
    title: 'الأسئلة الشائعة · بينون',
    description: 'إجابات واضحة عن بينون: كيف تعمل، القوالب، الأسعار، الاستضافة، والتصدير.',
    url: 'https://beynoun.com/faq',
  }),
}

// FAQPage structured data — makes the Q&A eligible for rich results in
// Google. Arabic questions only: the English set is claimed by /en/faq, and
// two URLs emitting FAQPage schema for the same questions would compete with
// each other for the same rich result. The visible page still renders both
// languages for bilingual readers.
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'ar',
  mainEntity: AR_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function FaqLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {children}
    </>
  )
}
