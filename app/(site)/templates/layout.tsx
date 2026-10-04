import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { share } from '@/lib/site-share'

export const metadata: Metadata = {
  title: '8 قوالب مواقع احترافية جاهزة بالعربية',
  description:
    'ثمانية قوالب مواقع بالعربية: مطعم، أزياء، تطبيق، علامة تجارية، عافية، خدمات، متجر، ومنتج واحد. اختر قالبًا، اكتب نبذة، وانشر خلال دقائق.',
  alternates: { canonical: '/templates' },
  ...share({
    title: 'قوالب زينيا الثمانية — مواقع احترافية بالذكاء الاصطناعي',
    description:
      'ثمانية قوالب لكل نوع نشاط تجاري. اختر قالبًا، اكتب نبذة، وتتكفّل زينيا بكتابة المحتوى وبناء الموقع.',
    url: 'https://zenyaai.co/templates',
  }),
}

export default function ThemesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
