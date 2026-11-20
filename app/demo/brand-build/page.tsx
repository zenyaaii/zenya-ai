/** The brand-story build questions (links first), open to try in demo mode. */
import type { Metadata } from 'next'
import BrandWizard from '@/components/zenya/build/BrandWizard'
import { LaylProduct } from '@/components/zenya/redesign/layl'

export const metadata: Metadata = {
  title: 'ابنِ موقع علامتك',
  robots: { index: false, follow: false },
}

export default function DemoBrandBuildPage() {
  return <LaylProduct><BrandWizard demo /></LaylProduct>
}
