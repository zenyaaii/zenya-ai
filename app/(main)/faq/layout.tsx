import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AR_FAQS, EN_FAQS } from './faq-data'

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
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'الأسئلة الشائعة — زينيا',
    description: 'إجابات واضحة عن زينيا: كيف تعمل، القوالب، الأسعار، الاستضافة، والتصدير.',
    url: 'https://zenyaai.co/faq',
  },
}

// FAQPage structured data — makes the Q&A eligible for rich results in
// Google. Combines the Arabic and English questions from the shared data
// module so the markup always matches the visible page.
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [...AR_FAQS, ...EN_FAQS].map((f) => ({
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
