import type { Metadata } from 'next'
import NicheLab from './NicheLab'

export const metadata: Metadata = { title: 'عينة القوالب', robots: { index: false, follow: false } }

/** Sample for Anas (2026-11-12): two options per niche, at three amounts of content. Not linked from anywhere. */
export default function Page({ searchParams }: { searchParams: { k?: string; v?: string; fill?: string; p?: string; look?: string } }) {
  return <NicheLab k={searchParams.k} v={searchParams.v} fill={searchParams.fill} p={searchParams.p} look={searchParams.look} />
}
