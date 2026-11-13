/**
 * The gym's build questions, links first (Anas, 2026-11-13), open to try.
 * The same NicheWizard the barber uses, in its `demo` mode, with the gym's
 * own questions (KIND.gym.extras). Not live: /theme/new still gives a gym
 * the current wellness questions until the gym design ships.
 */
import type { Metadata } from 'next'
import NicheWizard from '@/components/zenya/build/NicheWizard'
import { LaylProduct } from '@/components/zenya/redesign/layl'

export const metadata: Metadata = {
  title: 'ابنِ موقع نادٍ رياضي',
  robots: { index: false, follow: false },
}

export default function DemoGymBuildPage() {
  return <LaylProduct><NicheWizard kind="gym" demo /></LaylProduct>
}
