/**
 * Aurora Atelier — per-business-type tint signatures.
 *
 * Each business type carries its own pair of soft, desaturated orb colors
 * for the AuroraBackground component, plus its brand accent. This is how we
 * signal "variety across 8 templates" without losing the warm cream / indigo
 * core identity.
 *
 * All tints are intentionally low-opacity and light-warm — never dark, never
 * fully saturated. They sit on top of the cream #f7f4ed page background.
 */

export type AuroraTint = {
  /** Display name shown in marketing copy. */
  label: string
  /** Brand accent color (CTAs, badges, hover states). */
  accent: string
  /** Foreground orb (top-left or top-right of section). */
  orb1: string
  /** Secondary orb (bottom or off-center). */
  orb2: string
  /** Optional third orb for richer scenes (hero, featured). */
  orb3?: string
}

/** The 8 business-type generators. Keys match `content.business_type` in DB. */
export const auroraTints: Record<string, AuroraTint> = {
  /** The original Shopify path — URL → AI → downloadable ZIP. */
  one_product: {
    label: 'متجر',
    accent: '#6366f1',
    orb1: 'rgba(99,102,241,0.18)',
    orb2: 'rgba(167,139,250,0.14)',
    orb3: 'rgba(125,211,252,0.10)',
  },

  /** Fine-dining / restaurant — warm amber + rose. */
  restaurant: {
    label: 'مطعم',
    accent: '#c8a96a',
    orb1: 'rgba(200,169,106,0.20)',
    orb2: 'rgba(244,114,91,0.12)',
    orb3: 'rgba(255,237,213,0.16)',
  },

  /** SaaS / software — Linear indigo + sky. */
  atlas: {
    label: 'تطبيق',
    accent: '#5e6ad2',
    orb1: 'rgba(94,106,210,0.18)',
    orb2: 'rgba(125,211,252,0.14)',
    orb3: 'rgba(167,139,250,0.10)',
  },

  /** Local services / trades — amber + warm gold. */
  services: {
    label: 'خدمات',
    accent: '#f59e0b',
    orb1: 'rgba(245,158,11,0.18)',
    orb2: 'rgba(251,191,36,0.14)',
    orb3: 'rgba(254,215,170,0.12)',
  },

  /** Catalog / multi-product — emerald + mint. */
  collective: {
    label: 'تشكيلة',
    accent: '#10b981',
    orb1: 'rgba(16,185,129,0.18)',
    orb2: 'rgba(110,231,183,0.14)',
    orb3: 'rgba(187,247,208,0.12)',
  },

  /** Brand story / editorial — ink + gold accent on cream. */
  studio: {
    label: 'ستوديو',
    accent: '#1c1c1c',
    orb1: 'rgba(217,164,79,0.18)',
    orb2: 'rgba(255,237,213,0.20)',
    orb3: 'rgba(94,106,210,0.08)',
  },

  /** Fashion / apparel — ink + blush. */
  lookbook: {
    label: 'أزياء',
    accent: '#1c1c1c',
    orb1: 'rgba(252,165,165,0.16)',
    orb2: 'rgba(252,231,243,0.18)',
    orb3: 'rgba(94,106,210,0.08)',
  },

  /** Wellness / spa / yoga — teal + soft sage. */
  wellness: {
    label: 'عافية',
    accent: '#14b8a6',
    orb1: 'rgba(20,184,166,0.18)',
    orb2: 'rgba(167,243,208,0.14)',
    orb3: 'rgba(207,250,254,0.12)',
  },
}

/**
 * Default aurora — used for global marketing pages (home, pricing, themes
 * showcase chrome, etc.). Indigo primary + warm amber accent, matching the
 * existing Linear × Lovable body::before gradient.
 */
export const defaultTint: AuroraTint = {
  label: 'زينيا',
  accent: '#5e6ad2',
  // Purple/indigo dialled way down — only a whisper of colour remains on the
  // cream page (per request: keep just a very light touch, no purple wash).
  orb1: 'rgba(94,106,210,0.06)',
  orb2: 'rgba(217,119,6,0.07)',
  orb3: 'rgba(113,112,255,0.03)',
}

/** Helper: safely fetch a tint by business_type key, falling back to default. */
export function getAuroraTint(key?: string | null): AuroraTint {
  if (!key) return defaultTint
  return auroraTints[key] ?? defaultTint
}

/** Ordered list of the 8 business types — useful for marketing iteration. */
export const BUSINESS_TYPE_ORDER: Array<keyof typeof auroraTints> = [
  'one_product',
  'restaurant',
  'atlas',
  'lookbook',
  'collective',
  'studio',
  'services',
  'wellness',
]
