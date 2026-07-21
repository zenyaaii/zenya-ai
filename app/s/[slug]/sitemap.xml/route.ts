import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { publicSiteUrl } from '@/lib/portal-urls'
import { extractImageUrls } from '@/lib/extract-image-urls'
import { pagesFor } from '@/lib/site-pages'

/**
 * Per-site sitemap, served at `slug.zenyaai.co/sitemap.xml`.
 *
 * The middleware rewrites `slug.zenyaai.co/sitemap.xml` → `/s/<slug>/sitemap.xml`,
 * so this handler owns every published customer site's sitemap. It lists the
 * homepage PLUS every real page of the multi-page brochure (menu, about, …),
 * and emits an **image sitemap** (Google's `image:` extension) on the homepage
 * so the site's imagery can rank in Google Images too.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 300

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = (params.slug || '').toLowerCase()
  const base = publicSiteUrl(slug)

  let lastmod = new Date().toISOString()
  let published = false
  let images: string[] = []
  let businessType = ''
  try {
    const { data } = await admin()
      .from('themes')
      .select('is_published, updated_at, content, template_type')
      .ilike('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (data) {
      published = true
      if (data.updated_at) lastmod = new Date(data.updated_at).toISOString()
      businessType =
        (data.content && typeof data.content === 'object' && (data.content as any).business_type) ||
        data.template_type || ''
      // Google allows up to 1000 images per URL — list every real image the
      // site uses (deduped by extractImageUrls) so Google Images can index them.
      images = extractImageUrls((data as any).content, 1000)
    }
  } catch {
    // fall through — emit a minimal valid sitemap rather than 500
  }

  const imageXml = images
    .map((u) => `      <image:image>\n        <image:loc>${xmlEscape(u)}</image:loc>\n      </image:image>`)
    .join('\n')

  // Home carries the image sitemap; every other real page gets its own <url>.
  // Non-brochure sites (storefront/collective) have no page map → home only.
  const templatePages = pagesFor(businessType)
  const pages = !published
    ? []
    : templatePages.length > 0
      ? templatePages
      : [{ view: 'home', slug: '', label: '' }]
  const urlBlock = pages
    .map((p) => {
      const isHome = p.slug === ''
      const loc = isHome ? `${base}/` : `${base}/${p.slug}`
      return (
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>weekly</changefreq>\n    <priority>${isHome ? '1.0' : '0.8'}</priority>\n` +
        (isHome && imageXml ? imageXml + '\n' : '') +
        `  </url>\n`
      )
    })
    .join('')

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urlBlock +
    `</urlset>\n`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
