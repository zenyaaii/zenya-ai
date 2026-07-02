import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'من نحن — قصة زينيا',
  description:
    'زينيا منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي. ثمانية قوالب احترافية لكل نشاط تجاري — مطاعم، أزياء، تطبيقات، عافية، خدمات، متاجر إلكترونية والمزيد. اكتب نبذة، واحصل على موقع كامل خلال دقائق، باستضافة أوروبية متوافقة مع GDPR.',
  keywords: [
    'من نحن زينيا',
    'زينيا',
    'منشئ مواقع بالذكاء الاصطناعي',
    'شركة إنشاء مواقع عربية',
    'about Zenya',
    'AI website builder',
  ],
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'من نحن — قصة زينيا',
    description:
      'منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي: ثمانية قوالب لكل نشاط تجاري، محتوى بالعربية، واستضافة أوروبية.',
    url: 'https://zenyaai.co/about',
  },
}

// AboutPage + Organization structured data so search engines understand who
// Zenya is (an AI website builder), who operates it, and where it's based.
const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'من نحن — زينيا',
  url: 'https://zenyaai.co/about',
  inLanguage: 'ar',
  mainEntity: {
    '@type': 'Organization',
    name: 'زينيا',
    alternateName: 'Zenya',
    url: 'https://zenyaai.co',
    logo: 'https://zenyaai.co/logo.png',
    description:
      'منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي لكل نشاط تجاري — ثمانية قوالب احترافية، محتوى بالعربية، واستضافة أوروبية متوافقة مع GDPR.',
    foundingDate: '2025',
    email: 'zenyaai@outlook.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NL',
      postalCode: '7776 BA',
    },
    knowsLanguage: ['ar', 'en'],
  },
}

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_SCHEMA) }}
      />
      {children}
    </>
  )
}
