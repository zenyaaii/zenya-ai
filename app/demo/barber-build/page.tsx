/**
 * The barber's build questions, open to anyone (2026-11-11, Anas: "give me
 * the website"). THE REAL WIZARD: the same NicheWizard /theme/new/services
 * mounts after «صالون حلاقة», in its `demo` mode. Google's facts are fetched
 * for real; pictures stay in the page; «ابنِ» builds the site with the same
 * buildBarberContent and opens it in the demo editor, saving nothing.
 */
import type { Metadata } from 'next'
import NicheWizard from '@/components/zenya/build/NicheWizard'
import { LaylProduct } from '@/components/zenya/redesign/layl'

export const metadata: Metadata = {
  title: 'ابنِ موقع صالون حلاقة',
  robots: { index: false, follow: false },
}

export default function DemoBarberBuildPage() {
  return <LaylProduct><NicheWizard kind="barber" demo /></LaylProduct>
}
