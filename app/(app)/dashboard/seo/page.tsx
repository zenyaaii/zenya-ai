import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { resolveSeo, readSeoOverrides } from '@/lib/seo'
import { publicSiteUrl, publicSiteHost } from '@/lib/portal-urls'
import SeoManager, { type SeoSite } from '@/components/dashboard/SeoManager'

export const dynamic = 'force-dynamic'

// SEO tooling applies to any site that lives on a real slug.zenyaai.co address.
// That means: every published site (whatever its template — storefront sites
// are hosted on Zenya too), PLUS brochure-type drafts so owners can pre-set SEO
// before publishing. Only pure Shopify installs (no Zenya URL) are left out.
const BROCHURE = new Set(['restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services'])
function isSeoEligible(t: any): boolean {
  if (t.is_published && t.slug) return true       // live on slug.zenyaai.co
  return BROCHURE.has(t.template_type)             // draft that will get a URL
}

export default async function SeoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: themes } = await supabase
    .from('themes')
    .select('id, product_name, slug, content, template_type, is_published, updated_at')
    .eq('user_id', user.id)
    .order('is_published', { ascending: false })
    .order('updated_at', { ascending: false })

  const sites: SeoSite[] = (themes || [])
    .filter(isSeoEligible)
    .map((t: any) => {
      const resolved = resolveSeo(t)
      const slug = (t.slug || '').toLowerCase()
      return {
        id: t.id,
        productName: t.product_name || slug || 'موقع بلا اسم',
        slug: slug || null,
        templateType: t.template_type,
        isPublished: !!t.is_published,
        host: slug ? publicSiteHost(slug) : null,
        url: slug ? publicSiteUrl(slug) : null,
        sitemapUrl: slug ? `${publicSiteUrl(slug)}/sitemap.xml` : null,
        overrides: readSeoOverrides(t),
        resolved: {
          title: resolved.title,
          description: resolved.description,
          keywords: resolved.keywords,
          ogImage: resolved.ogImage || null,
        },
      }
    })

  return <SeoManager sites={sites} />
}
