import type { MetadataRoute } from 'next'
import { ENGLISH_ENABLED } from '@/lib/i18n/config'

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
          // English edition is paused and 404s; keep crawlers off it.
          ...(ENGLISH_ENABLED ? [] : ['/en']),
        ],
      },
    ],
    sitemap: 'https://zenyaai.co/sitemap.xml',
    host: 'https://zenyaai.co',
  }
}
