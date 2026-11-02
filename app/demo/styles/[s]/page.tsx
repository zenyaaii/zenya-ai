/**
 * Redesign samples, 2026-10-31: five directions for the public site, shown
 * to Anas so he can pick one. noindex; nothing links here.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { dashFont } from '@/components/app/dash-font'
import { STYLES } from '@/components/zenya/redesign'

export const metadata: Metadata = { title: 'نمط مقترح للموقع', robots: { index: false, follow: false } }

export default function Page({ params }: { params: { s: string } }) {
  const S = STYLES[params.s]
  if (!S) notFound()
  return <div className={dashFont.variable}><S.Home /></div>
}
