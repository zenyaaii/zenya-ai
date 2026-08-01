import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PublicSiteRenderer from '@/components/PublicSiteRenderer'
import MadeWithZenya from '@/components/MadeWithZenya'
import SiteBeacon from '@/components/site/SiteBeacon'
import { BookingProvider } from '@/components/site/BookingContext'
import { bookingAccess } from '@/lib/booking-entitlement'
import { sectionStylesToCss } from '@/utils/theme-editor-types'
import { resolveSeo, buildJsonLd } from '@/lib/seo'
import type { SitePage } from '@/lib/site-pages'
import {
  browserFromUA, deviceFromUA, isBotUA, osFromUA, pathFromLegacySlug, referrerHost,
} from '@/lib/analytics-core'
import { clientIpFrom, visitorHash } from '@/lib/analytics-server'

/**
 * Shared server helpers for the public customer site. Used by both the home
 * route (`app/s/[slug]/page.tsx`) and the per-page route
 * (`app/s/[slug]/[page]/page.tsx`) so lookup, metadata, and rendering never
 * drift between them.
 */

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export type PublicTheme = {
  id: string
  product_name: string | null
  slug: string
  content: any
  template_type: string
  user_id: string
  owner_has_hosting: boolean
  /** Whether the owner may run the interactive booking form (Pro or in the
   *  one-month free trial). When false the templates fall back to their plain
   *  CTA so the site still works. */
  bookings_enabled: boolean
}

export async function lookupPublishedTheme(slug: string): Promise<PublicTheme | null> {
  if (!slug) return null
  const a = admin()
  const { data, error } = await a
    .from('themes')
    .select('id, product_name, slug, content, template_type, user_id, is_published')
    .ilike('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) return null

  const { data: profile } = await a
    .from('profiles')
    .select('has_hosting, plan, bookings_trial_started_at')
    .eq('id', data.user_id)
    .maybeSingle()

  const owner_has_hosting = !!profile?.has_hosting || profile?.plan === 'admin'
  const bookings_enabled = bookingAccess(profile).entitled

  return {
    id: data.id,
    product_name: data.product_name,
    slug: data.slug,
    content: data.content,
    template_type: data.template_type,
    user_id: data.user_id,
    owner_has_hosting,
    bookings_enabled,
  }
}

/**
 * Server-side pageview record.
 *
 * This fires on every render, including for visitors with JavaScript off, so
 * it stays the reliable floor. It cannot see the referrer (stripped on most
 * social/in-app navigations) or the session — the browser beacon fills those
 * in afterwards by enriching this exact row rather than inserting a second
 * one; see analytics_ingest_view().
 *
 * `slug` arrives as either "my-site" or "my-site/menu"; the page path is
 * derived from it so per-page analytics works without a schema change at the
 * call sites.
 */
export async function recordView(themeId: string, slug: string) {
  const h = headers()
  const country = h.get('x-vercel-ip-country') || null
  const referrer = h.get('referer') || null
  const userAgent = h.get('user-agent') || null
  const bot = isBotUA(userAgent)

  const a = admin()
  try {
    const writes: PromiseLike<unknown>[] = [
      a.from('site_views').insert({
        theme_id: themeId,
        slug,
        path: pathFromLegacySlug(slug),
        country,
        referrer,
        referrer_host: referrerHost(referrer),
        user_agent: userAgent,
        is_bot: bot,
        device: deviceFromUA(userAgent),
        browser: browserFromUA(userAgent),
        os: osFromUA(userAgent),
        visitor_hash: visitorHash({ ip: clientIpFrom(h), userAgent, themeId }),
      }),
    ]

    // Only humans move the public view counter. Googlebot hitting the site
    // forty times is not forty customers, and that counter is shown to the
    // owner as "المشاهدات".
    if (!bot) {
      writes.push(
        a.rpc('increment_theme_views', { p_theme_id: themeId }).then(
          () => {},
          async () => {
            await a.from('themes').update({ last_viewed_at: new Date().toISOString() }).eq('id', themeId)
          },
        ),
      )
    }

    await Promise.all(writes)
  } catch {
    // intentionally swallow — analytics must never break rendering
  }
}

function businessTypeOf(theme: PublicTheme): string {
  const c = theme.content
  return (c && typeof c === 'object' && (c as any).business_type) || theme.template_type
}

/**
 * Page-aware metadata. Pass `page` for a sub-page (menu, about, …) to get a
 * unique title/description/canonical; omit it (or pass the home page) for the
 * root. Every page stays on the clean subdomain URL.
 */
export function buildSiteMetadata(theme: PublicTheme, page?: SitePage | null): Metadata {
  const businessType = businessTypeOf(theme)
  const seo = resolveSeo({
    product_name: theme.product_name,
    slug: theme.slug,
    content: theme.content,
    template_type: theme.template_type,
    is_published: true,
  })
  const siteName = theme.product_name || theme.slug
  const isSub = !!page && page.slug !== ''
  const canonical = isSub ? `${seo.canonical}/${page!.slug}` : seo.canonical
  const title = isSub ? `${page!.label} — ${siteName}` : seo.title
  const description = isSub
    ? `${page!.label} — ${siteName}. ${seo.description}`.slice(0, 160)
    : seo.description

  return {
    title: { absolute: title },
    description,
    keywords: seo.keywords,
    metadataBase: new URL(seo.canonical),
    alternates: { canonical },
    robots: seo.index ? { index: true, follow: true } : { index: false, follow: false },
    ...(seo.gscVerification ? { verification: { google: seo.gscVerification } } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName,
      locale: 'ar_AR',
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: seo.ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
    other: { 'zenya-template': businessType },
  }
}

/**
 * The site body — JSON-LD + section styles + the themed renderer + footer.
 * `view` selects which page the template renders (home by default). Client
 * nav between pages is wired via PublicSiteRenderer's routing.
 */
export function PublicSiteBody({ theme, view }: { theme: PublicTheme; view: string }) {
  const c = theme.content || {}
  const businessType = businessTypeOf(theme)
  const presetId = (typeof c === 'object' && (c as any).style_preset) || undefined
  const typographyPreset = (typeof c === 'object' && (c as any).typography_preset) || undefined
  const colorOverrides = (typeof c === 'object' && (c as any).color_overrides) || undefined
  const sectionStyles = (typeof c === 'object' && (c as any).section_styles) || undefined
  const templateContent = (typeof c === 'object' && (c as any)[businessType]) || c

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
      <BookingProvider slug={theme.slug} enabled={theme.bookings_enabled}>
        <PublicSiteRenderer
          businessType={businessType}
          content={templateContent}
          presetId={presetId}
          typographyPreset={typographyPreset}
          colorOverrides={colorOverrides}
          productName={theme.product_name || undefined}
          view={view}
          enableRouting
        />
      </BookingProvider>
      <MadeWithZenya hide={theme.owner_has_hosting} />
      <SiteBeacon slug={theme.slug} />
    </>
  )
}
