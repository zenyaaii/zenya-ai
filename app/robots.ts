import type { MetadataRoute } from 'next'
import { ENGLISH_ENABLED } from '@/lib/i18n/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Customer sites live on their own subdomain or domain, with their own
        // robots.txt. zenyaai.co/s/<slug> only 301s there (middleware). Auth +
        // API + preview routes stay out.
        allow: ['/'],
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
