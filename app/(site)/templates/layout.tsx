import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { share } from '@/lib/site-share'

export const metadata: Metadata = {
  title: '8 قوالب مواقع احترافية جاهزة بالعربية',
  description:
    'ثمانية قوالب مواقع بالعربية: مطعم، أزياء، تطبيق، علامة تجارية، عافية، خدمات، متجر، ومنتج واحد. اختر قالبًا، اكتب نبذة، وانشر خلال دقائق.',
  alternates: { canonical: '/templates' },
  ...share({
    title: 'قوالب بينون الثمانية — مواقع احترافية',
    description:
      'ثمانية قوالب لكل نوع نشاط تجاري. اختر قالبًا، اكتب نبذة، وتتكفّل بينون بكتابة المحتوى وبناء الموقع.',
    url: 'https://beynoun.com/templates',
  }),
}

export default function ThemesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
