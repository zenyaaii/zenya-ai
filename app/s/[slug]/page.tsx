import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PublicSiteRenderer from '@/components/PublicSiteRenderer'
import MadeWithZenya from '@/components/MadeWithZenya'

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
  product_name: string | null
  slug: string
  content: any
  template_type: string
  user_id: string
  owner_has_hosting: boolean
} | null

async function lookupPublishedTheme(slug: string): Promise<LookupResult> {
  if (!slug) return null
  const a = admin()
  const { data, error } = await a
    .from('themes')
    .select('product_name, slug, content, template_type, user_id, is_published')
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
      title: 'Site not found',
      robots: { index: false, follow: false },
    }
  }

  const name = theme.product_name || theme.slug
  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type

  return {
    title: name,
    description: `${name} — built and hosted on Zenya.`,
    alternates: { canonical: `/s/${theme.slug}` },
    openGraph: {
      title: name,
      description: `${name} — built and hosted on Zenya.`,
      type: 'website',
      url: `https://zenyaai.co/s/${theme.slug}`,
    },
    other: { 'zenya-template': businessType },
  }
}

export default async function PublicSitePage(
  { params }: { params: { slug: string } }
) {
  const theme = await lookupPublishedTheme(params.slug)
  if (!theme) notFound()

  const c = theme.content || {}
  const businessType =
    (typeof c === 'object' && (c as any).business_type) || theme.template_type
  const presetId =
    (typeof c === 'object' && (c as any).style_preset) || undefined
  const templateContent =
    (typeof c === 'object' && (c as any)[businessType]) || c

  return (
    <>
      <PublicSiteRenderer
        businessType={businessType}
        content={templateContent}
        presetId={presetId}
        productName={theme.product_name || undefined}
      />
      <MadeWithZenya hide={theme.owner_has_hosting} />
    </>
  )
}
