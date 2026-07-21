import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PublicSiteRenderer from '@/components/PublicSiteRenderer'
import MadeWithZenya from '@/components/MadeWithZenya'
import { sectionStylesToCss } from '@/utils/theme-editor-types'
import { resolveSeo, buildJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 60

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

type LookupResult = {
  id: string
  product_name: string | null
  slug: string
  content: any
  template_type: string
  user_id: string
  owner_has_hosting: boolean
} | null

async function recordView(themeId: string, slug: string) {
  const h = headers()
  const country = h.get('x-vercel-ip-country') || null
  const referrer = h.get('referer') || null
  const userAgent = h.get('user-agent') || null

  const a = admin()
  // Fire-and-forget: insert one row + bump cached view_count + last_viewed_at.
  // Failing silently is fine — analytics shouldn't degrade page rendering.
  try {
    await Promise.all([
      a.from('site_views').insert({
        theme_id: themeId,
        slug,
        country,
        referrer,
        user_agent: userAgent,
      }),
      a.rpc('increment_theme_views', { p_theme_id: themeId }).then(
        () => {},
        // RPC may not exist on first run — fall back to UPDATE.
        async () => {
          await a
            .from('themes')
            .update({ last_viewed_at: new Date().toISOString() })
            .eq('id', themeId)
        }
      ),
    ])
  } catch {
    // intentionally swallow
  }
}

async function lookupPublishedTheme(slug: string): Promise<LookupResult> {
  if (!slug) return null
  const a = admin()
  const { data, error } = await a
    .from('themes')
    .select('id, product_name, slug, content, template_type, user_id, is_published')
    .ilike('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) return null

  // Look up owner's hosting status (drives whether badge shows).
  const { data: profile } = await a
    .from('profiles')
    .select('has_hosting, plan')
    .eq('id', data.user_id)
    .maybeSingle()

  const owner_has_hosting =
    !!profile?.has_hosting || profile?.plan === 'admin'

  return {
    id: data.id,
    product_name: data.product_name,
    slug: data.slug,
    content: data.content,
    template_type: data.template_type,
    user_id: data.user_id,
    owner_has_hosting,
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const theme = await lookupPublishedTheme(params.slug)
  if (!theme) {
    return {
      title: 'الموقع غير موجود',
      robots: { index: false, follow: false },
    }
  }

  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type

  // Auto-derived (or owner-overridden) SEO — title, description, keywords,
  // canonical on the *professional* subdomain URL, OG image, GSC tag.
  const seo = resolveSeo({
    product_name: theme.product_name,
    slug: theme.slug,
    content: theme.content,
    template_type: theme.template_type,
    is_published: true,
  })

  return {
    // `absolute` bypasses the root layout's "%s · زينيا" template so the
    // customer's Google title is clean and unbranded — their site, not ours.
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    metadataBase: new URL(seo.canonical),
    alternates: { canonical: seo.canonical },
    robots: seo.index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    ...(seo.gscVerification
      ? { verification: { google: seo.gscVerification } }
      : {}),
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'website',
      url: seo.canonical,
      siteName: theme.product_name || theme.slug,
      locale: 'ar_AR',
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: seo.ogImage ? 'summary_large_image' : 'summary',
      title: seo.title,
      description: seo.description,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
    other: { 'zenya-template': businessType },
  }
}

export default async function PublicSitePage(
  { params }: { params: { slug: string } }
) {
  const theme = await lookupPublishedTheme(params.slug)
  if (!theme) notFound()

  // Fire-and-forget pageview record. Skipped for bots, slowloris, etc. is
  // best handled at the edge — but a one-INSERT counter is cheap enough that
  // false positives don't matter much at our scale.
  recordView(theme.id, theme.slug).catch(() => {})

  const c = theme.content || {}
  const businessType =
    (typeof c === 'object' && (c as any).business_type) || theme.template_type
  const presetId =
    (typeof c === 'object' && (c as any).style_preset) || undefined
  const typographyPreset =
    (typeof c === 'object' && (c as any).typography_preset) || undefined
  const colorOverrides =
    (typeof c === 'object' && (c as any).color_overrides) || undefined
  const sectionStyles =
    (typeof c === 'object' && (c as any).section_styles) || undefined
  const templateContent =
    (typeof c === 'object' && (c as any)[businessType]) || c

  // Structured data (JSON-LD) so Google can render a rich result for the site.
  const seo = resolveSeo({
    product_name: theme.product_name,
    slug: theme.slug,
    content: theme.content,
    template_type: theme.template_type,
    is_published: true,
  })
  const jsonLd = buildJsonLd(
    { product_name: theme.product_name, slug: theme.slug, content: theme.content, template_type: theme.template_type },
    seo,
  )

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
      {sectionStyles && Object.keys(sectionStyles).length > 0 && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: sectionStylesToCss(sectionStyles) }}
        />
      )}
      <PublicSiteRenderer
        businessType={businessType}
        content={templateContent}
        presetId={presetId}
        typographyPreset={typographyPreset}
        colorOverrides={colorOverrides}
        productName={theme.product_name || undefined}
      />
      <MadeWithZenya hide={theme.owner_has_hosting} />
    </>
  )
}
