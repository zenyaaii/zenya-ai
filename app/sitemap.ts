import type { MetadataRoute } from 'next'
import { COMPARISONS } from '@/lib/comparisons'
import { TEMPLATE_PAGES } from '@/lib/template-pages'
import type { BilingualRoute } from '@/lib/i18n-routes'
import { ENGLISH_ENABLED } from '@/lib/i18n/config'

const BASE = 'https://zenyaai.co'

/**
 * One timestamp, captured when the module is first evaluated, rather than a
 * fresh `new Date()` per URL per request.
 *
 * Every URL used to report a lastmod of the exact moment the crawler asked,
 * which says "all 43 pages changed one second ago" on every single fetch.
 * Google treats a lastmod that always reads "now" as noise and stops using it
 * — so the field stopped earning us anything, including on the occasions when
 * a page really had just changed. Pinning it to build time makes the value
 * honest: it moves when a deploy actually could have changed the page, and
 * holds still in between.
 */
const BUILD_DATE = new Date()

type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Arabic-only routes (no English twin). */
const AR_ONLY: { path: string; priority: number; freq: Freq }[] = [
  // One page per template, under the gallery (2026-10-04). These replaced
  // /websites/<slug>, /why/<key> and /demo/<key>, which 301 here from
  // next.config.js. The demos themselves, now at /templates/<slug>/demo, are
  // noindexed and left out on purpose: a sitemap should only list pages we
  // want in Google, and a search for the brand once put a spa demo first.
  // Arabic only for now: the English twins still live at /en/websites/<slug>
  // and the English edition is switched off.
  ...TEMPLATE_PAGES.map((t) => ({ path: `/templates/${t.slug}`, priority: 0.8, freq: 'monthly' as Freq })),
  // The review channel. Arabic only: it writes into the reviews table through
  // app/api/reviews, which has no English counterpart, so there is nothing to
  // pair it with and an hreflang alternate would 404.
  { path: '/review',          priority: 0.5, freq: 'monthly' },
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
  { path: '/compare',  priority: 0.8, freq: 'monthly' },
  { path: '/pricing',  priority: 0.9, freq: 'monthly' },
  { path: '/faq',      priority: 0.8, freq: 'monthly' },
  { path: '/templates',   priority: 0.9, freq: 'weekly'  },
  { path: '/about',    priority: 0.7, freq: 'monthly' },
  { path: '/contact',  priority: 0.7, freq: 'monthly' },
  { path: '/privacy',       priority: 0.5, freq: 'monthly' },
  { path: '/cookies',       priority: 0.4, freq: 'monthly' },
  { path: '/subprocessors', priority: 0.4, freq: 'monthly' },
  { path: '/terms',         priority: 0.5, freq: 'monthly' },
  { path: '/refund',        priority: 0.4, freq: 'monthly' },
]

/** Slug parity for both sections is verified: comparisons.ts / comparisons-en.ts
 *  publish the same slugs. */
const PAIRED: { path: string; priority: number; freq: Freq }[] = [
  ...PAIRED_STATIC,
  ...COMPARISONS.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.75, freq: 'monthly' as Freq })),
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = BUILD_DATE

  const arOnly: MetadataRoute.Sitemap = AR_ONLY.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))

  // While ENGLISH_ENABLED is false the English edition is unpublished: the
  // Arabic URLs still ship, but without their /en twin and without hreflang
  // alternates, so nothing points a crawler at a page that 404s. The pairing
  // logic below is untouched and comes straight back when the flag flips.
  const paired: MetadataRoute.Sitemap = PAIRED.flatMap((r) => {
    const arUrl = `${BASE}${r.path}`
    if (!ENGLISH_ENABLED) {
      return [{ url: arUrl, lastModified: now, changeFrequency: r.freq, priority: r.priority }]
    }
    const enUrl = r.path === '/' ? `${BASE}/en` : `${BASE}/en${r.path}`
    const languages = { ar: arUrl, en: enUrl }
    return [
      { url: arUrl, lastModified: now, changeFrequency: r.freq, priority: r.priority, alternates: { languages } },
      { url: enUrl, lastModified: now, changeFrequency: r.freq, priority: Math.max(0.4, r.priority - 0.1), alternates: { languages } },
    ]
  })

  return [...paired, ...arOnly]
}
