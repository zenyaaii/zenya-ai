import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description:
    'تواصل مع فريق زينيا — أسئلة عن القوالب، أو الفوترة، أو الدعم، أو شارك تجربتك. نردّ بأسرع ما يمكن.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'تواصل مع زينيا',
    description: 'أسئلة عن القوالب أو الفوترة أو الدعم؟ راسلنا.',
    url: 'https://zenyaai.co/contact',
  },
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
