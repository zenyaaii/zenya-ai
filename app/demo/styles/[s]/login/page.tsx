import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { dashFont } from '@/components/app/dash-font'
import { STYLES } from '@/components/zenya/redesign'

export const metadata: Metadata = { title: 'الدخول، نمط مقترح', robots: { index: false, follow: false } }

export default function Page({ params, searchParams }: { params: { s: string }; searchParams: { mode?: string } }) {
  const L = STYLES[params.s]?.Login
  if (!L) notFound()
  const mode = searchParams.mode === 'signup' || searchParams.mode === 'forgot' ? searchParams.mode : 'signin'
  return <div className={dashFont.variable}><L mode={mode} /></div>
}
