import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { share } from '@/lib/site-share'

export const metadata: Metadata = {
  title: 'أوّل شركة إسلامية لإنشاء المواقع',
  description:
    'بينون أوّل شركة إسلامية لإنشاء المواقع: منصّة عربية تبني لكل نشاط تجاري موقعًا كاملًا خلال دقائق، باستضافة أوروبية آمنة.',
  keywords: [
    'من نحن بينون',
    'بينون',
    'أول شركة إسلامية لإنشاء المواقع',
    'منشئ مواقع',
    'شركة إنشاء مواقع عربية',
    'about Beynoun',
    'first Muslim website builder',
    'Arabic website builder',
  ],
  alternates: { canonical: '/about' },
  ...share({
    title: 'أوّل شركة إسلامية لإنشاء المواقع',
    description:
      'أوّل شركة إسلامية لإنشاء المواقع، ومنصّة عربية لكل نشاط تجاري: ثمانية قوالب، محتوى بالعربية، واستضافة أوروبية.',
    url: 'https://beynoun.com/about',
  }),
}

// AboutPage + Organization structured data so search engines understand who
// Beynoun is (an AI website builder), who operates it, and where it's based.
const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'من نحن — بينون',
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
    name: 'بينون',
    alternateName: ['Beynoun', 'Beynoun'],
    url: 'https://beynoun.com',
    logo: 'https://beynoun.com/brand/logo-square.png',
    description:
      'أوّل شركة إسلامية لإنشاء المواقع، ومنصّة عربية لكل نشاط تجاري — ثمانية قوالب احترافية، محتوى بالعربية، واستضافة أوروبية متوافقة مع GDPR.',
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
