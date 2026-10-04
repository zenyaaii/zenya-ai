import type { Metadata } from 'next'

/**
 * What every page of Zenya's own site tells search engines and link previews about itself.
 *
 * Modelled on how shopify.com does it: every page carries its own title and
 * description into the share card (og:* and twitter:*), every page carries a
 * picture, and the picture is a plain file on disk rather than one drawn on
 * request. The drawn one (app/opengraph-image.tsx) threw on a CSS background
 * its renderer does not support and served an empty PNG with a 200, which no
 * check catches.
 *
 * WHY A HELPER: Next.js replaces a parent's `openGraph` and `twitter` objects
 * wholesale when a page sets its own, it does not merge them. So a page that
 * wrote `openGraph: { title, description, url }` silently dropped the image,
 * the site name and the locale, and a page that set no `twitter` showed the
 * homepage's title on X. `share()` fills both from one call so neither can
 * happen again.
 */

export const SITE_URL = 'https://zenyaai.co'
export const SITE_NAME = 'زينيا'

/** 2400x1260 like Shopify's, so it stays sharp on high-density screens. The
 *  declared size is the 1.91:1 frame every network crops to. */
export const SHARE_IMAGE = {
  url: '/brand/share.jpg',
  width: 2400,
  height: 1260,
  alt: 'زينيا: منشئ المواقع العربي بالذكاء الاصطناعي',
  type: 'image/jpeg',
}

/** The square logo Google shows in the company panel and next to results. */
export const LOGO_URL = `${SITE_URL}/brand/logo-square.png`

export const X_HANDLE = '@zenyaaico'

type ShareInput = {
  title: string
  description: string
  /** Absolute, or a path from the site root. Leave it out on a layout: every
   *  page under it would inherit it and claim to be that one URL. */
  url?: string
  type?: 'website' | 'article'
  /** A page-specific picture. Defaults to the site's share image. */
  images?: { url: string; width?: number; height?: number; alt?: string }[]
}

export function share({ title, description, url, type = 'website', images }: ShareInput): Pick<Metadata, 'openGraph' | 'twitter'> {
  const pics = images ?? [SHARE_IMAGE]
  return {
    openGraph: {
      type,
      locale: 'ar_SA',
      siteName: SITE_NAME,
      title,
      description,
      ...(url ? { url } : {}),
      images: pics,
    },
    twitter: {
      card: 'summary_large_image',
      site: X_HANDLE,
      title,
      description,
      images: pics.map((p) => p.url),
    },
  }
}
