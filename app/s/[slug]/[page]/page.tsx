import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupPublishedTheme, recordView, buildSiteMetadata, PublicSiteBody } from '@/lib/public-site'
import { pageBySlug } from '@/lib/site-pages'

/**
 * A single content page of a customer site, e.g. slug.zenyaai.co/menu.
 *
 * Reuses the exact same generated content and themed renderer as the home
 * page — it just tells the template which `view` to render, and gives the page
 * its own URL + metadata so Google indexes it as a distinct page.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 60

function resolve(theme: Awaited<ReturnType<typeof lookupPublishedTheme>>, slug: string) {
  if (!theme) return null
  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type
  const page = pageBySlug(businessType, slug)
  // Unknown page, or the home page hitting this route by mistake → 404.
  if (!page || page.slug === '') return null
  return { theme, page }
}

export async function generateMetadata(
  { params }: { params: { slug: string; page: string } },
): Promise<Metadata> {
  const theme = await lookupPublishedTheme(params.slug)
  const r = resolve(theme, params.page)
  if (!r) return { title: 'الصفحة غير موجودة', robots: { index: false, follow: false } }
  return buildSiteMetadata(r.theme, r.page)
}

export default async function PublicSiteSubPage(
  { params }: { params: { slug: string; page: string } },
) {
  const theme = await lookupPublishedTheme(params.slug)
  const r = resolve(theme, params.page)
  if (!r) notFound()

  recordView(r.theme.id, `${r.theme.slug}/${r.page.slug}`).catch(() => {})

  return <PublicSiteBody theme={r.theme} view={r.page.view} />
}
