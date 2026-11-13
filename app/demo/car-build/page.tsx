/** The car build questions (links first), open to try in demo mode. */
import type { Metadata } from 'next'
import NicheWizard from '@/components/zenya/build/NicheWizard'
import { LaylProduct } from '@/components/zenya/redesign/layl'

export const metadata: Metadata = {
  title: 'ابنِ موقعك',
  robots: { index: false, follow: false },
}

export default function DemoCarBuildPage() {
  return <LaylProduct><NicheWizard kind="car" demo /></LaylProduct>
}
