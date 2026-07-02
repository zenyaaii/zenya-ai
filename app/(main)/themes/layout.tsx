import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'قوالب المواقع الثمانية',
  description:
    'ثمانية قوالب مواقع احترافية مبنية بالذكاء الاصطناعي — مطعم، لوك بوك أزياء، صفحة هبوط لتطبيق، قصة علامة تجارية، مركز عافية، خدمات، متجر بمنتجات متعددة، ومتجر شوبيفاي بمنتج واحد. اختر قالبًا، اكتب نبذة، واحصل على موقع كامل خلال دقائق.',
  alternates: { canonical: '/themes' },
  openGraph: {
    title: 'قوالب زينيا الثمانية — مواقع احترافية بالذكاء الاصطناعي',
    description:
      'ثمانية قوالب لكل نوع نشاط تجاري. اختر قالبًا، اكتب نبذة، وتتكفّل زينيا بكتابة المحتوى وبناء الموقع.',
    url: 'https://zenyaai.co/themes',
  },
}

export default function ThemesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
