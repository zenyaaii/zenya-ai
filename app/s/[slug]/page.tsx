import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupPublishedTheme, recordView, buildSiteMetadata, PublicSiteBody } from '@/lib/public-site'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const theme = await lookupPublishedTheme(params.slug)
  if (!theme) {
    return { title: 'الموقع غير موجود', robots: { index: false, follow: false } }
  }
  return buildSiteMetadata(theme)
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const theme = await lookupPublishedTheme(params.slug)
  if (!theme) notFound()

  // Fire-and-forget pageview record.
  recordView(theme.id, theme.slug).catch(() => {})

  return <PublicSiteBody theme={theme} view="home" />
}
