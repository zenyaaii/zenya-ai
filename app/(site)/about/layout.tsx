import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { share } from '@/lib/site-share'

export const metadata: Metadata = {
  title: 'أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي',
  description:
    'زينيا أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي: منصّة عربية تبني لكل نشاط تجاري موقعًا كاملًا خلال دقائق، باستضافة أوروبية آمنة.',
  keywords: [
    'من نحن زينيا',
    'زينيا',
    'أول شركة إسلامية لإنشاء المواقع',
    'منشئ مواقع بالذكاء الاصطناعي',
    'شركة إنشاء مواقع عربية',
    'about Zenya',
    'first Muslim AI website builder',
    'AI website builder',
  ],
  alternates: { canonical: '/about' },
  ...share({
    title: 'أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي',
    description:
      'أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي، ومنصّة عربية لكل نشاط تجاري: ثمانية قوالب، محتوى بالعربية، واستضافة أوروبية.',
    url: 'https://beynoun.com/about',
  }),
}

// AboutPage + Organization structured data so search engines understand who
// Zenya is (an AI website builder), who operates it, and where it's based.
const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'من نحن — زينيا',
  url: 'https://beynoun.com/about',
  inLanguage: 'ar',
  mainEntity: {
    '@type': 'Organization',
    // Same @id as the node in app/layout.tsx on purpose. Without it this page
    // announced a SECOND organization that merely happened to share a name —
    // which is the exact splitting we are trying to undo. Matching ids tells a
    // consumer these are one entity described twice, so the address and email
    // here enrich the root node instead of competing with it.
    '@id': 'https://beynoun.com/#organization',
    name: 'زينيا',
    alternateName: ['Zenya', 'Zenya AI'],
    url: 'https://beynoun.com',
    logo: 'https://beynoun.com/brand/logo-square.png',
    description:
      'أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي، ومنصّة عربية لكل نشاط تجاري — ثمانية قوالب احترافية، محتوى بالعربية، واستضافة أوروبية متوافقة مع GDPR.',
    foundingDate: '2025',
    email: 'team@beynoun.com',
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
