import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { dashFont } from '@/components/app/dash-font'
import { STYLES } from '@/components/zenya/redesign'

export const metadata: Metadata = { title: 'القوالب، نمط مقترح', robots: { index: false, follow: false } }

export default function Page({ params }: { params: { s: string } }) {
  const T = STYLES[params.s]?.Templates
  if (!T) notFound()
  return <div className={dashFont.variable}><T /></div>
}
