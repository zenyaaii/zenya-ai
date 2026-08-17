import type { Metadata } from 'next'
import { hreflangAlternates } from '@/lib/i18n/config'
import type { ReactNode } from 'react'
import { AR_FAQS } from './faq-data'

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة',
  description:
    'كل ما تريد معرفته عن زينيا — كيف تعمل، القوالب الثمانية، الأسعار، الاستضافة الأوروبية، ربط النطاق، التصدير إلى شوبيفاي، ولغة المحتوى. إجابات واضحة بالعربية والإنجليزية.',
  keywords: [
    'أسئلة شائعة زينيا',
    'كيف تعمل زينيا',
    'منشئ مواقع بالذكاء الاصطناعي',
    'أسعار زينيا',
    'Zenya FAQ',
    'AI website builder questions',
  ],
  alternates: {
    canonical: '/faq',
    languages: hreflangAlternates('https://zenyaai.co/faq', 'https://zenyaai.co/en/faq'),
  },
  openGraph: {
    title: 'الأسئلة الشائعة — زينيا',
    description: 'إجابات واضحة عن زينيا: كيف تعمل، القوالب، الأسعار، الاستضافة، والتصدير.',
    url: 'https://zenyaai.co/faq',
  },
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
