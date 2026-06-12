/**
 * Curated color palettes for the dropshipping theme builder.
 *
 * Each palette is a complete look — backgrounds, surfaces, foreground,
 * primary CTA, accent, and muted text — calibrated to read as a real
 * brand instead of "pick a hex and pray". Grouped into vibes so the
 * picker can stack three of each side-by-side ("Bold", "Premium",
 * "Dark", "Warm") and the user can compare apples to apples.
 *
 * These are NOT arbitrary. The CTA contrast is targeted at WCAG AA
 * against `surface`, and the surface/foreground pair clears AA for
 * body text. The phone mockup applies them as CSS custom properties.
 */

export type PaletteVibe = 'bold' | 'premium' | 'dark' | 'warm'

export type Palette = {
  id: string
  name: string
  vibe: PaletteVibe
  /** One-line description shown under the swatch. */
  blurb: string
  /** Page background. Behind everything. */
  bg: string
  /** Card/section background. Where copy and image cards sit. */
  surface: string
  /** Primary text. Headings, body, prices. */
  fg: string
  /** Muted text. Captions, secondary info, struck-through prices. */
  muted: string
  /** The CTA button colour. Must pop hard against `surface`. */
  primary: string
  /** Text on the primary button. */
  primaryFg: string
  /** Accent tint — used for ribbons, badges, "save 40%" pills. */
  accent: string
  /** Subtle border colour for cards. */
  border: string
}

export const PALETTES: Palette[] = [
  // ─── BOLD ────────────────────────────────────────────────────────
  {
    id: 'crimson-cream',
    name: 'Crimson Cream',
    vibe: 'bold',
    blurb: 'High-energy red on a warm cream base. Converts.',
    bg: '#FAF5EE', surface: '#FFFFFF', fg: '#1A1311', muted: '#7A6F6A',
    primary: '#D92D1F', primaryFg: '#FFFFFF', accent: '#F4A261', border: '#EEE3D3',
  },
  {
    id: 'electric-mint',
    name: 'Electric Mint',
    vibe: 'bold',
    blurb: 'Punchy mint over off-white. Fresh, modern, scroll-stopping.',
    bg: '#F5FBF7', surface: '#FFFFFF', fg: '#0E1A14', muted: '#5C7A6D',
    primary: '#10B981', primaryFg: '#FFFFFF', accent: '#FBBF24', border: '#E2F0E9',
  },
  {
    id: 'sunset-pop',
    name: 'Sunset Pop',
    vibe: 'bold',
    blurb: 'Tangerine CTA with a soft peach canvas. Feels playful.',
    bg: '#FFF6EE', surface: '#FFFFFF', fg: '#221610', muted: '#7A5F4A',
    primary: '#F2683C', primaryFg: '#FFFFFF', accent: '#FF3D6E', border: '#FBE5D2',
  },

  // ─── PREMIUM ─────────────────────────────────────────────────────
  {
    id: 'ivory-onyx',
    name: 'Ivory Onyx',
    vibe: 'premium',
    blurb: 'Heritage black on ivory. Reads as "$$$".',
    bg: '#F7F3EC', surface: '#FFFFFF', fg: '#0F0F0F', muted: '#6E6862',
    primary: '#111111', primaryFg: '#FFFFFF', accent: '#C9A66B', border: '#EAE2D2',
  },
  {
    id: 'porcelain-rose',
    name: 'Porcelain Rose',
    vibe: 'premium',
    blurb: 'Whisper-light pink with a deep rose CTA. Skincare-ready.',
    bg: '#FDF5F4', surface: '#FFFFFF', fg: '#2A1A1F', muted: '#8A6A75',
    primary: '#B53658', primaryFg: '#FFFFFF', accent: '#E9B7C2', border: '#F2DDE1',
  },
  {
    id: 'sage-stone',
    name: 'Sage Stone',
    vibe: 'premium',
    blurb: 'Eucalyptus green over stone. Calm, wellness, premium.',
    bg: '#F0EFE7', surface: '#FAFAF5', fg: '#1F2620', muted: '#6D7D71',
    primary: '#3F6F52', primaryFg: '#FFFFFF', accent: '#C5A572', border: '#E1E3D6',
  },

  // ─── DARK ────────────────────────────────────────────────────────
  {
    id: 'midnight-volt',
    name: 'Midnight Volt',
    vibe: 'dark',
    blurb: 'Pitch black with an electric lime CTA. Gym, tech, gear.',
    bg: '#0A0A0A', surface: '#141414', fg: '#FAFAFA', muted: '#9A9A9A',
    primary: '#D4F538', primaryFg: '#0A0A0A', accent: '#FF4F70', border: '#222222',
  },
  {
    id: 'navy-amber',
    name: 'Navy Amber',
    vibe: 'dark',
    blurb: 'Deep navy with warm amber accents. Premium electronics.',
    bg: '#0B1B2E', surface: '#142844', fg: '#F2F5FA', muted: '#8FA0BA',
    primary: '#F4A300', primaryFg: '#0B1B2E', accent: '#34D399', border: '#1F3556',
  },
  {
    id: 'graphite-coral',
    name: 'Graphite Coral',
    vibe: 'dark',
    blurb: 'Charcoal with a coral CTA. Modern and approachable.',
    bg: '#1A1A1F', surface: '#26262E', fg: '#F4F4F7', muted: '#9C9CA8',
    primary: '#FF6B5B', primaryFg: '#FFFFFF', accent: '#7CD4FF', border: '#34343F',
  },

  // ─── WARM ────────────────────────────────────────────────────────
  {
    id: 'terracotta',
    name: 'Terracotta',
    vibe: 'warm',
    blurb: 'Earthy clay with a sand canvas. Home, decor, lifestyle.',
    bg: '#F5EBDC', surface: '#FBF3E6', fg: '#3A2418', muted: '#85675A',
    primary: '#C44829', primaryFg: '#FFFFFF', accent: '#7A8B5F', border: '#E8D7BE',
  },
  {
    id: 'butter-mocha',
    name: 'Butter Mocha',
    vibe: 'warm',
    blurb: 'Buttery cream with cocoa accents. Food, coffee, gourmet.',
    bg: '#F8EFDE', surface: '#FFFAF0', fg: '#2A1810', muted: '#8B6F5A',
    primary: '#7A4625', primaryFg: '#FFFFFF', accent: '#E8B14C', border: '#EDDDC0',
  },
  {
    id: 'desert-rose',
    name: 'Desert Rose',
    vibe: 'warm',
    blurb: 'Dusty rose on linen with a deep berry CTA. Beauty-coded.',
    bg: '#FAF0EB', surface: '#FFF7F2', fg: '#2E1A1D', muted: '#9A7268',
    primary: '#9A2A4A', primaryFg: '#FFFFFF', accent: '#E6A893', border: '#F1DCD0',
  },
]

export const VIBE_LABELS: Record<PaletteVibe, { name: string; blurb: string }> = {
  bold:    { name: 'Bold & Punchy',     blurb: 'High contrast, conversion-tilted.' },
  premium: { name: 'Premium & Refined', blurb: 'Quiet luxury, soft surfaces.' },
  dark:    { name: 'Dark & Modern',     blurb: 'Tech, gear, late-night browsing.' },
  warm:    { name: 'Warm & Cozy',       blurb: 'Lived-in, lifestyle, hospitality.' },
}

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) || PALETTES[0]
}
