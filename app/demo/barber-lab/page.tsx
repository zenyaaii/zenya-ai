import type { Metadata } from 'next'
import BarberLab from './BarberLab'

export const metadata: Metadata = { title: 'تصاميم الحلاق', robots: { index: false, follow: false } }

/** Sample: the barber site's new designs, side by side with the live one, on the same content. */
export default function Page() {
  return <BarberLab />
}
