import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // /s/ is the published-sites namespace and should be crawled. Auth +
        // API + preview routes stay out.
        allow: ['/', '/s/'],
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
