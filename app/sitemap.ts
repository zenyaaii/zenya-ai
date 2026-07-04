import type { MetadataRoute } from 'next'
import { COMPARISONS } from '@/lib/comparisons'
import { TEMPLATE_PAGES } from '@/lib/template-pages'

const BASE = 'https://zenyaai.co'

const ROUTES: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  // Marketing
  { path: '/',         priority: 1.0, freq: 'weekly' },
  { path: '/themes',   priority: 0.9, freq: 'weekly' },
  { path: '/pricing',  priority: 0.9, freq: 'monthly' },
  { path: '/features', priority: 0.9, freq: 'monthly' },
  { path: '/websites', priority: 0.9, freq: 'monthly' },
  { path: '/compare',  priority: 0.8, freq: 'monthly' },
  { path: '/about',    priority: 0.7, freq: 'monthly' },
  { path: '/faq',      priority: 0.8, freq: 'monthly' },
  { path: '/contact',  priority: 0.7, freq: 'monthly' },
  // Competitor comparisons (high-intent SEO + AI-answer surfaces)
  ...COMPARISONS.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.75, freq: 'monthly' as const })),
  // Per-template landing pages (long-tail vertical search)
  ...TEMPLATE_PAGES.map((t) => ({ path: `/websites/${t.slug}`, priority: 0.75, freq: 'monthly' as const })),
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
