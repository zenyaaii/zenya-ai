import type { auroraTints } from '@/lib/aurora-tints'

/**
 * English copy for the eight templates, for /en/themes.
 *
 * Mirrors the THEMES map in app/(main)/themes/page.tsx — the Arabic page keeps
 * its own copy, and this module carries the English equivalent, matching the
 * pattern already used by comparisons-en.ts and template-pages-en.tsx.
 *
 * KEEP IN SYNC with the Arabic page: `presets`, `sections`, and the hrefs are
 * facts about the product, not translations. If a template gains a section or
 * a preset, both files need the new number.
 */

export type ThemeEn = {
  id: keyof typeof auroraTints
  /** English template name. */
  name: string
  /** Short business descriptor shown above the title. */
  tagline: string
  /** One-line description for the card body. */
  description: string
  /** Number of style presets the wizard offers. */
  presets: number
  /** Number of pre-built sections in the template. */
  sections: number
  /** No-auth live preview URL. The demos themselves are in Arabic. */
  demoHref: string
  /** The real wizard / builder for this template. */
  createHref: string
  /** True for the Shopify-exportable template, false for Zenya-hosted sites. */
  shopify?: boolean
}

export const THEMES_EN: ThemeEn[] = [
  {
    id: 'one_product',
    name: 'Storefront',
    tagline: 'Shopify · single product',
    description:
      'A conversion-focused single-product Shopify theme: a sales path, a sticky add-to-cart, bundles, comparison, FAQs, and urgency. Exports as a ready Shopify theme.',
    presets: 3,
    sections: 24,
    demoHref: '/demo',
    createHref: '/build',
    shopify: true,
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    tagline: 'Restaurant · menu · reservations',
    description:
      'A refined editorial restaurant site: a tabbed menu, a photo gallery, opening hours, reservations, a press wall, and the chef story. Fully responsive.',
    presets: 4,
    sections: 13,
    demoHref: '/demo/restaurant',
    createHref: '/theme/new/restaurant',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    tagline: 'App · software · B2B',
    description:
      'A modern software landing page: a product interface, a feature grid, pricing tiers, integrations, a security trust bar, and a demo call to action.',
    presets: 4,
    sections: 12,
    demoHref: '/demo/atlas',
    createHref: '/theme/new/atlas',
  },
  {
    id: 'lookbook',
    name: 'Lookbook',
    tagline: 'Fashion · clothing · brand',
    description:
      'An elevated fashion template with a full-screen editorial lookbook, a drop banner, a best-sellers grid, a brand story, a press wall, and a newsletter.',
    presets: 4,
    sections: 11,
    demoHref: '/demo/lookbook',
    createHref: '/theme/new/lookbook',
  },
  {
    id: 'collective',
    name: 'Collective',
    tagline: 'Catalogue · multi-product',
    description:
      'A premium multi-brand store with a bright storefront, a curated collections grid, new arrivals, best sellers, a brand promise, and a newsletter.',
    presets: 4,
    sections: 10,
    demoHref: '/demo/collective',
    createHref: '/theme/new/collective',
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Brand story · editorial',
    description:
      'An editorial brand-story page with oversized display type, a founder letter, a timeline, values, methodology, the team, a press wall, and community numbers.',
    presets: 4,
    sections: 12,
    demoHref: '/demo/studio',
    createHref: '/theme/new/studio',
  },
  {
    id: 'services',
    name: 'Services',
    tagline: 'Local services · trades',
    description:
      'A premium services site: a hero, services, proof, before and after, service areas, reviews, FAQs, and a request-a-quote path.',
    presets: 4,
    sections: 13,
    demoHref: '/demo/services',
    createHref: '/theme/new/services',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    tagline: 'Spa · yoga · wellness',
    description:
      'A calm template for spas, yoga studios, and wellness brands: a session menu, booking, instructors, schedules, and gift cards.',
    presets: 3,
    sections: 12,
    demoHref: '/demo/wellness',
    createHref: '/theme/new/wellness',
  },
]
