import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep auth & API routes out of indexes — they're either useless to
        // crawlers (JSON) or potentially confusing (auth screens).
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard',
          '/settings',
          '/account',
          '/checkout',
          '/preview/',
          '/shopify/',
        ],
      },
    ],
    sitemap: 'https://zenyaai.co/sitemap.xml',
    host: 'https://zenyaai.co',
  }
}
