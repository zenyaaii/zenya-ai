import type { MetadataRoute } from 'next'

const BASE = 'https://zenyaai.co'

const ROUTES: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  // Marketing
  { path: '/',         priority: 1.0, freq: 'weekly' },
  { path: '/themes',   priority: 0.9, freq: 'weekly' },
  { path: '/pricing',  priority: 0.9, freq: 'monthly' },
  { path: '/contact',  priority: 0.7, freq: 'monthly' },
  { path: '/about',    priority: 0.6, freq: 'monthly' },
  { path: '/faq',      priority: 0.7, freq: 'monthly' },
  // Demos (publicly browsable showcases)
  { path: '/demo',                 priority: 0.7, freq: 'weekly' },
  { path: '/demo/restaurant',      priority: 0.6, freq: 'weekly' },
  { path: '/demo/atlas',           priority: 0.6, freq: 'weekly' },
  { path: '/demo/lookbook',        priority: 0.6, freq: 'weekly' },
  { path: '/demo/collective',      priority: 0.6, freq: 'weekly' },
  { path: '/demo/studio',          priority: 0.6, freq: 'weekly' },
  { path: '/demo/services',        priority: 0.6, freq: 'weekly' },
  { path: '/demo/wellness',        priority: 0.6, freq: 'weekly' },
  // Legal — high priority for App Store reviewers
  { path: '/privacy',         priority: 0.5, freq: 'monthly' },
  { path: '/terms',           priority: 0.5, freq: 'monthly' },
  { path: '/cookies',         priority: 0.4, freq: 'monthly' },
  { path: '/refund',          priority: 0.4, freq: 'monthly' },
  { path: '/subprocessors',   priority: 0.4, freq: 'monthly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))
}
