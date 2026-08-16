import type { MetadataRoute } from 'next'
import { COMPARISONS } from '@/lib/comparisons'
import { TEMPLATE_PAGES } from '@/lib/template-pages'
import { BILINGUAL_PAIRS, type BilingualRoute } from '@/lib/i18n-routes'

const BASE = 'https://zenyaai.co'

type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Arabic-only routes (no English twin). */
const AR_ONLY: { path: string; priority: number; freq: Freq }[] = [
  // Demos (publicly browsable showcases)
  { path: '/demo',            priority: 0.7, freq: 'weekly' },
  { path: '/demo/restaurant', priority: 0.6, freq: 'weekly' },
  { path: '/demo/atlas',      priority: 0.6, freq: 'weekly' },
  { path: '/demo/lookbook',   priority: 0.6, freq: 'weekly' },
  { path: '/demo/collective', priority: 0.6, freq: 'weekly' },
  { path: '/demo/studio',     priority: 0.6, freq: 'weekly' },
  { path: '/demo/services',   priority: 0.6, freq: 'weekly' },
  { path: '/demo/wellness',   priority: 0.6, freq: 'weekly' },
  // All legal pages are bilingual and live in PAIRED_STATIC below.
]

/** Bilingual routes — Arabic at `path`, English at `/en{path}` (or `/en` for
 *  the home). Each emits both URLs with hreflang alternates so Google serves
 *  the right language and never treats them as duplicates.
 *
 *  `path` is typed as BilingualRoute on purpose: an hreflang alternate that
 *  404s is worse than no alternate at all, so a page can only be listed here
 *  once it is registered in lib/i18n-routes (which means `app/en{path}` exists
 *  and the language switcher knows about it). */
const PAIRED_STATIC: { path: BilingualRoute; priority: number; freq: Freq }[] = [
  { path: '/',         priority: 1.0, freq: 'weekly' },
  { path: '/features', priority: 0.9, freq: 'monthly' },
  { path: '/websites', priority: 0.9, freq: 'monthly' },
  { path: '/compare',  priority: 0.8, freq: 'monthly' },
  { path: '/pricing',  priority: 0.9, freq: 'monthly' },
  { path: '/faq',      priority: 0.8, freq: 'monthly' },
  { path: '/themes',   priority: 0.9, freq: 'weekly'  },
  { path: '/about',    priority: 0.7, freq: 'monthly' },
  { path: '/contact',  priority: 0.7, freq: 'monthly' },
  { path: '/privacy',       priority: 0.5, freq: 'monthly' },
  { path: '/cookies',       priority: 0.4, freq: 'monthly' },
  { path: '/subprocessors', priority: 0.4, freq: 'monthly' },
  { path: '/terms',         priority: 0.5, freq: 'monthly' },
  { path: '/refund',        priority: 0.4, freq: 'monthly' },
]

/** Slug parity for both sections is verified: comparisons.ts / comparisons-en.ts
 *  and template-pages.tsx / template-pages-en.tsx publish the same slugs. */
const PAIRED: { path: string; priority: number; freq: Freq }[] = [
  ...PAIRED_STATIC,
  ...COMPARISONS.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.75, freq: 'monthly' as Freq })),
  ...TEMPLATE_PAGES.map((t) => ({ path: `/websites/${t.slug}`, priority: 0.75, freq: 'monthly' as Freq })),
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const arOnly: MetadataRoute.Sitemap = AR_ONLY.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))

  const paired: MetadataRoute.Sitemap = PAIRED.flatMap((r) => {
    const arUrl = `${BASE}${r.path}`
    const enUrl = r.path === '/' ? `${BASE}/en` : `${BASE}/en${r.path}`
    const languages = { ar: arUrl, en: enUrl }
    return [
      { url: arUrl, lastModified: now, changeFrequency: r.freq, priority: r.priority, alternates: { languages } },
      { url: enUrl, lastModified: now, changeFrequency: r.freq, priority: Math.max(0.4, r.priority - 0.1), alternates: { languages } },
    ]
  })

  // The /why articles are bilingual but do NOT share a slug (Arabic uses the
  // business_type key, English uses a keyword slug), so they pair via the
  // explicit map in lib/i18n-routes rather than the /en{path} rule above.
  const whyArticles: MetadataRoute.Sitemap = Object.entries(BILINGUAL_PAIRS).flatMap(([ar, en]) => {
    const arUrl = `${BASE}${ar}`
    const enUrl = `${BASE}${en}`
    const languages = { ar: arUrl, en: enUrl }
    return [
      { url: arUrl, lastModified: now, changeFrequency: 'monthly' as Freq, priority: 0.65, alternates: { languages } },
      { url: enUrl, lastModified: now, changeFrequency: 'monthly' as Freq, priority: 0.6, alternates: { languages } },
    ]
  })

  return [...paired, ...whyArticles, ...arOnly]
}
