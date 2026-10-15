import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Customer sites live on their own subdomain or domain, with their own
        // robots.txt. zenyaai.co/s/<slug> only 301s there (middleware). Auth +
        // API + preview routes stay out. /en is NOT disallowed: while English is
        // off it 301s to Arabic (next.config.js), and a crawler blocked from
        // /en would never see that redirect, so old /en URLs would linger.
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
        ],
      },
    ],
    sitemap: 'https://zenyaai.co/sitemap.xml',
    host: 'https://zenyaai.co',
  }
}
