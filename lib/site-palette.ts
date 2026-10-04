import { getRestaurantPreset } from '@/utils/restaurant/presets'
import { getAtlasPreset } from '@/utils/atlas/presets'
import { getLookbookPreset } from '@/utils/lookbook/presets'
import { getWellnessPreset } from '@/utils/wellness/presets'
import { getStudioPreset } from '@/utils/studio/presets'
import { getServicePreset } from '@/utils/services/presets'
import { getTypographyPreset } from '@/utils/theme-editor-typography'

/**
 * The colours and fonts a published customer site is actually painted in.
 *
 * Each template resolves its palette inside its own Preview as
 * `{ ...preset.colors, ...colorOverrides }` and keeps it in template-prefixed
 * custom properties (--wl-*, --rs-*, ...). Chrome that sits beside the
 * template rather than inside it, like the cookie banner, cannot read those,
 * so it resolves the same palette the same way here. The seven keys below are
 * the ones every template's colour type shares.
 */
export type SitePalette = {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
  headingFont: string
  bodyFont: string
  /** The colour the template paints its main call-to-action button in. */
  button: string
  /** Corner radius of that button, in px (999 = pill). */
  buttonRadius: number
}

/**
 * How each template draws its main hero button, read from the Preview:
 * atlas and lookbook fill it with primary, the rest with accent; restaurant
 * is the one template with square corners.
 */
const BUTTON_STYLE: Record<string, { ground: 'primary' | 'accent'; radius: number }> = {
  restaurant: { ground: 'accent', radius: 2 },
  atlas: { ground: 'primary', radius: 999 },
  lookbook: { ground: 'primary', radius: 999 },
  wellness: { ground: 'accent', radius: 999 },
  studio: { ground: 'accent', radius: 999 },
  services: { ground: 'accent', radius: 999 },
}

type PresetLike = {
  colors: Record<string, string>
  heading_font: string
  body_font: string
}

const PRESET_LOOKUP: Record<string, (id: string) => PresetLike> = {
  restaurant: getRestaurantPreset as (id: string) => PresetLike,
  atlas: getAtlasPreset as (id: string) => PresetLike,
  lookbook: getLookbookPreset as (id: string) => PresetLike,
  wellness: getWellnessPreset as (id: string) => PresetLike,
  studio: getStudioPreset as (id: string) => PresetLike,
  services: getServicePreset as (id: string) => PresetLike,
}

export function resolveSitePalette(
  businessType: string,
  presetId?: string,
  colorOverrides?: Record<string, string>,
  typographyPreset?: string,
): SitePalette | null {
  const lookup = PRESET_LOOKUP[businessType]
  if (!lookup) return null
  // Every getXPreset falls back to its first preset for an unknown id, and so
  // does each Preview's default, so '' lands where the template itself does.
  const preset = lookup(presetId || '')
  const c = { ...preset.colors, ...(colorOverrides || {}) }
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  return {
    primary: c.primary,
    accent: c.accent,
    background: c.background,
    surface: c.surface,
    text: c.text,
    muted: c.muted,
    border: c.border,
    headingFont: typo?.heading_font ?? preset.heading_font,
    bodyFont: typo?.body_font ?? preset.body_font,
    button: BUTTON_STYLE[businessType].ground === 'primary' ? c.primary : c.accent,
    buttonRadius: BUTTON_STYLE[businessType].radius,
  }
}

/* ── contrast ──────────────────────────────────────────────────────────── */

/** sRGB channels of a #rgb / #rrggbb / rgb() / rgba() colour, alpha ignored. */
function parseColor(input: string): [number, number, number] | null {
  const s = (input || '').trim().toLowerCase()
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('')
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number)
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      return parts as [number, number, number]
    }
  }
  return null
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca || !cb) return 1
  const la = luminance(ca)
  const lb = luminance(cb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * The first candidate that reads on `ground` at 4.5:1, else the one that
 * reads best. Candidates go theme colours first, so a button keeps the site's
 * own ink when it can and only falls back to plain black or white.
 */
export function readableOn(ground: string, candidates: string[]): string {
  const pool = [...candidates, '#ffffff', '#111111']
  const ok = pool.find((c) => contrastRatio(c, ground) >= 4.5)
  if (ok) return ok
  return pool.reduce((best, c) => (contrastRatio(c, ground) > contrastRatio(best, ground) ? c : best))
}
