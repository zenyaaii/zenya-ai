import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { dashFont } from '@/components/app/dash-font'
import { STYLES } from '@/components/zenya/redesign'

export const metadata: Metadata = { title: 'الأسعار، نمط مقترح', robots: { index: false, follow: false } }

export default function Page({ params }: { params: { s: string } }) {
  const S = STYLES[params.s]
  if (!S) notFound()
  return <div className={dashFont.variable}><S.Pricing /></div>
}
