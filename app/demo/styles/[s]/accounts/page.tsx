import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { dashFont } from '@/components/app/dash-font'
import { STYLES } from '@/components/zenya/redesign'

export const metadata: Metadata = { title: 'الحساب، نمط مقترح', robots: { index: false, follow: false } }

export default function Page({ params }: { params: { s: string } }) {
  const A = STYLES[params.s]?.Accounts
  if (!A) notFound()
  return <div className={dashFont.variable}><A /></div>
}
