import { NextResponse } from 'next/server'
import { publicSiteUrl } from '@/lib/portal-urls'

/**
 * Per-site robots.txt, served at `slug.zenyaai.co/robots.txt`.
 *
 * Points crawlers at the site's own sitemap so Google can discover it even
 * before the owner submits it manually. Every published customer site is
 * fully crawlable.
 */

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = (params.slug || '').toLowerCase()
  const base = publicSiteUrl(slug)

  const body =
    `User-agent: *\n` +
    `Allow: /\n\n` +
    `Sitemap: ${base}/sitemap.xml\n`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
