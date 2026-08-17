import type { Metadata } from 'next'
import type { ReactNode } from 'react'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Zenya about support, sales, or requesting a new template. Email support@zenyaai.co or use the form, and we reply from the European Union.',
  keywords: ['contact Zenya', 'Zenya support', 'Zenya sales'],
  alternates: {
    canonical: `${SITE}/en/contact`,
    languages: { en: `${SITE}/en/contact`, ar: `${SITE}/contact`, 'x-default': `${SITE}/contact` },
  },
  openGraph: {
    title: 'Contact Zenya',
    description: 'Support, sales, or a template request. We reply from the EU.',
    url: `${SITE}/en/contact`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
