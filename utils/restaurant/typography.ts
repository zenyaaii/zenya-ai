/**
 * Typography presets for the restaurant theme.
 *
 * Each preset bundles a heading font + body font + a tracking/weight pair.
 * The editor lets the user pick any of these; the preview applies them via
 * --rb-heading-font / --rb-body-font CSS vars. We also generate a Google
 * Fonts <link> on demand so only the fonts the live site uses are loaded.
 *
 * Adding a preset = add to PRESETS + add the Google Fonts family to
 * GOOGLE_FAMILIES (with the weight range the headings/body will use).
 */

export type TypographyPreset = {
  id: string
  name: string
  /** One-line "vibe" line shown under the preset name in the picker. */
  vibe: string
  /**
   * Mood tag — used by the picker to filter/group presets. Free-form;
   * the picker just renders distinct values as filter chips.
   */
  mood:
    | 'editorial'
    | 'classic'
    | 'modern'
    | 'minimal'
    | 'rustic'
    | 'playful'
    | 'luxury'
    | 'casual'
  heading_font: string
  body_font: string
  /** Override Heading default weight (RestaurantPreview uses 500 by default). */
  heading_weight?: number
  /** Override Heading default letter-spacing. */
  heading_tracking?: string
  /** Override Heading default line-height. */
  heading_leading?: number
  /** Body weight override (default 400). */
  body_weight?: number
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Curated preset library                                                   *
 * ─────────────────────────────────────────────────────────────────────── */

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  // ── Editorial / luxury serifs ─────────────────────────────────────────
  {
    id: 'maison',
    name: 'Maison',
    vibe: 'Couture editorial · serif display',
    mood: 'editorial',
    heading_font: '"Playfair Display", "Times New Roman", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    heading_weight: 500,
  },
  {
    id: 'gazette',
    name: 'Gazette',
    vibe: 'Print broadsheet · tight & long-form',
    mood: 'editorial',
    heading_font: '"DM Serif Display", Georgia, serif',
    body_font: '"DM Sans", sans-serif',
    heading_tracking: '-0.025em',
  },
  {
    id: 'libre',
    name: 'Libre',
    vibe: 'Bookish & literary',
    mood: 'editorial',
    heading_font: '"Libre Caslon Display", Georgia, serif',
    body_font: '"Libre Franklin", system-ui, sans-serif',
  },
  {
    id: 'cormorant',
    name: 'Cormorant',
    vibe: 'High-contrast couture serif',
    mood: 'luxury',
    heading_font: '"Cormorant Garamond", Georgia, serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 500,
  },
  {
    id: 'fraunces',
    name: 'Fraunces',
    vibe: 'Warm variable serif',
    mood: 'editorial',
    heading_font: '"Fraunces", Georgia, serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 500,
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    vibe: 'Old-world calligraphic serif',
    mood: 'luxury',
    heading_font: '"EB Garamond", Garamond, Georgia, serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 600,
  },

  // ── Modern minimalist sans-serif ──────────────────────────────────────
  {
    id: 'helvetique',
    name: 'Helvetique',
    vibe: 'Swiss neutral · all sans',
    mood: 'minimal',
    heading_font: '"Inter", "Helvetica Neue", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    heading_weight: 600,
    heading_tracking: '-0.025em',
  },
  {
    id: 'soft-sans',
    name: 'Soft Sans',
    vibe: 'Friendly rounded sans',
    mood: 'modern',
    heading_font: '"Manrope", system-ui, sans-serif',
    body_font: '"Manrope", system-ui, sans-serif',
    heading_weight: 700,
    heading_tracking: '-0.02em',
  },
  {
    id: 'objectif',
    name: 'Objectif',
    vibe: 'Geometric · architectural',
    mood: 'minimal',
    heading_font: '"Space Grotesk", system-ui, sans-serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 500,
    heading_tracking: '-0.02em',
  },
  {
    id: 'satoshi',
    name: 'Satoshi',
    vibe: 'Modern tech utility',
    mood: 'modern',
    heading_font: '"Plus Jakarta Sans", system-ui, sans-serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 700,
    heading_tracking: '-0.02em',
  },
  {
    id: 'studio',
    name: 'Studio',
    vibe: 'Compact studio sans',
    mood: 'minimal',
    heading_font: '"Outfit", system-ui, sans-serif',
    body_font: '"Outfit", system-ui, sans-serif',
    heading_weight: 700,
    heading_tracking: '-0.02em',
  },

  // ── Display / impact ──────────────────────────────────────────────────
  {
    id: 'impact',
    name: 'Impact',
    vibe: 'Bold condensed display',
    mood: 'modern',
    heading_font: '"Archivo Black", "Inter", system-ui, sans-serif',
    body_font: '"Archivo", system-ui, sans-serif',
    heading_weight: 900,
    heading_tracking: '-0.03em',
  },
  {
    id: 'kanit',
    name: 'Kanit',
    vibe: 'Athletic display',
    mood: 'modern',
    heading_font: '"Bebas Neue", "Inter", sans-serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 400,
    heading_tracking: '0.02em',
  },
  {
    id: 'oswald',
    name: 'Oswald',
    vibe: 'Tall condensed signage',
    mood: 'classic',
    heading_font: '"Oswald", "Inter", sans-serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 500,
    heading_tracking: '0.02em',
  },

  // ── Classic / serif-body ──────────────────────────────────────────────
  {
    id: 'monograph',
    name: 'Monograph',
    vibe: 'Serif heading + serif body',
    mood: 'classic',
    heading_font: '"Playfair Display", Georgia, serif',
    body_font: '"Lora", Georgia, serif',
    heading_weight: 600,
  },
  {
    id: 'trattoria-classic',
    name: 'Trattoria',
    vibe: 'Warm Italian neighborhood serif',
    mood: 'rustic',
    heading_font: '"Lora", Georgia, serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    heading_weight: 600,
  },
  {
    id: 'oxford',
    name: 'Oxford',
    vibe: 'Academic transitional serif',
    mood: 'classic',
    heading_font: '"Crimson Pro", Georgia, serif',
    body_font: '"Crimson Pro", Georgia, serif',
    heading_weight: 600,
  },
  {
    id: 'bistro',
    name: 'Bistro',
    vibe: 'Café signage serif',
    mood: 'rustic',
    heading_font: '"Fraunces", "DM Serif Display", Georgia, serif',
    body_font: '"DM Sans", system-ui, sans-serif',
    heading_weight: 700,
  },

  // ── Playful / casual ──────────────────────────────────────────────────
  {
    id: 'kitchen',
    name: 'Kitchen',
    vibe: 'Handwritten · approachable',
    mood: 'playful',
    heading_font: '"Caveat", "Comic Sans MS", cursive',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 700,
  },
  {
    id: 'patisserie',
    name: 'Pâtisserie',
    vibe: 'Script display + clean body',
    mood: 'playful',
    heading_font: '"Pacifico", "Brush Script MT", cursive',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 400,
  },
  {
    id: 'streetfood',
    name: 'Street food',
    vibe: 'Bold hand-painted feel',
    mood: 'casual',
    heading_font: '"Permanent Marker", "Impact", sans-serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 400,
    heading_tracking: '-0.005em',
  },

  // ── Mono / utility ────────────────────────────────────────────────────
  {
    id: 'mono-spec',
    name: 'Mono spec',
    vibe: 'Technical · machined',
    mood: 'minimal',
    heading_font: '"JetBrains Mono", "Menlo", monospace',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 600,
    heading_tracking: '-0.01em',
  },
  {
    id: 'mono-grotesk',
    name: 'Mono grotesk',
    vibe: 'Mono heading + grotesk body',
    mood: 'modern',
    heading_font: '"IBM Plex Mono", "Menlo", monospace',
    body_font: '"IBM Plex Sans", system-ui, sans-serif',
    heading_weight: 500,
    heading_tracking: '-0.01em',
  },

  // ── Warm / boutique ───────────────────────────────────────────────────
  {
    id: 'noctis',
    name: 'Noctis',
    vibe: 'Late-night cocktail bar',
    mood: 'luxury',
    heading_font: '"Cormorant Garamond", serif',
    body_font: '"Cormorant Garamond", serif',
    heading_weight: 500,
    heading_tracking: '0.015em',
  },
  {
    id: 'farmtable',
    name: 'Farmtable',
    vibe: 'Foraged · seasonal',
    mood: 'rustic',
    heading_font: '"Fraunces", "Lora", serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 600,
    heading_tracking: '-0.015em',
  },
  {
    id: 'noodle-bar',
    name: 'Noodle bar',
    vibe: 'Asian street market energy',
    mood: 'casual',
    heading_font: '"Archivo", system-ui, sans-serif',
    body_font: '"Archivo", system-ui, sans-serif',
    heading_weight: 800,
    heading_tracking: '-0.025em',
  },
  {
    id: 'bordeaux',
    name: 'Bordeaux',
    vibe: 'Wine bar editorial',
    mood: 'luxury',
    heading_font: '"Cormorant Garamond", Georgia, serif',
    body_font: '"Inter", system-ui, sans-serif',
    heading_weight: 400,
    heading_tracking: '0.01em',
  },
]

export const DEFAULT_TYPOGRAPHY_PRESET_ID = 'maison'

export function getTypographyPreset(id?: string): TypographyPreset {
  if (!id) return TYPOGRAPHY_PRESETS[0]
  return TYPOGRAPHY_PRESETS.find((p) => p.id === id) ?? TYPOGRAPHY_PRESETS[0]
}

export const TYPOGRAPHY_MOODS: Array<TypographyPreset['mood']> = [
  'editorial', 'classic', 'modern', 'minimal',
  'rustic', 'playful', 'luxury', 'casual',
]

/* ─────────────────────────────────────────────────────────────────────── *
 * Google Fonts loader                                                      *
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Map of family display name → "css2 family fragment" (weights + axes).
 * Keep weights minimal — only what the theme actually renders at.
 */
const GOOGLE_FAMILIES: Record<string, string> = {
  'Playfair Display':     'Playfair+Display:wght@400;500;600;700;800',
  'DM Serif Display':     'DM+Serif+Display:wght@400',
  'DM Sans':              'DM+Sans:wght@400;500;700',
  'Libre Caslon Display': 'Libre+Caslon+Display',
  'Libre Franklin':       'Libre+Franklin:wght@400;500;700',
  'Cormorant Garamond':   'Cormorant+Garamond:wght@400;500;600;700',
  'Fraunces':             'Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700',
  'EB Garamond':          'EB+Garamond:wght@400;500;600;700',
  'Inter':                'Inter:wght@300;400;500;600;700',
  'Manrope':              'Manrope:wght@400;500;700;800',
  'Space Grotesk':        'Space+Grotesk:wght@400;500;700',
  'Plus Jakarta Sans':    'Plus+Jakarta+Sans:wght@400;500;700;800',
  'Outfit':               'Outfit:wght@400;500;700;800',
  'Archivo Black':        'Archivo+Black',
  'Archivo':              'Archivo:wght@400;500;700;800;900',
  'Bebas Neue':           'Bebas+Neue',
  'Oswald':               'Oswald:wght@400;500;600;700',
  'Lora':                 'Lora:wght@400;500;600;700',
  'Crimson Pro':          'Crimson+Pro:wght@400;500;600;700',
  'Caveat':               'Caveat:wght@400;500;700',
  'Pacifico':             'Pacifico',
  'Permanent Marker':     'Permanent+Marker',
  'JetBrains Mono':       'JetBrains+Mono:wght@400;500;600;700',
  'IBM Plex Mono':        'IBM+Plex+Mono:wght@400;500;600;700',
  'IBM Plex Sans':        'IBM+Plex+Sans:wght@400;500;600;700',
}

/** Extract the first quoted family name from a CSS font-family string. */
function familyFromStack(stack: string): string | null {
  const m = stack.match(/"([^"]+)"/)
  return m ? m[1] : null
}

/**
 * Build the Google Fonts css2 URL for an arbitrary set of typography
 * presets. We always include "Inter" since it's used as the fallback
 * across most presets and the editor UI itself.
 */
export function buildGoogleFontsUrl(presets: TypographyPreset[] = TYPOGRAPHY_PRESETS): string {
  const families = new Set<string>()
  families.add('Inter')
  for (const p of presets) {
    const h = familyFromStack(p.heading_font)
    const b = familyFromStack(p.body_font)
    if (h) families.add(h)
    if (b) families.add(b)
  }
  const fragments: string[] = []
  for (const family of families) {
    const fragment = GOOGLE_FAMILIES[family]
    if (fragment) fragments.push(`family=${fragment}`)
  }
  return `https://fonts.googleapis.com/css2?${fragments.join('&')}&display=swap`
}
