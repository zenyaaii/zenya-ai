/**
 * Sufra (سُفرة) — colour + type presets for the Middle-East restaurant template.
 *
 * "Sufra" is the spread everyone gathers around — the right frame for a regional
 * dining brand, not a borrowed European one.
 *
 * PALETTE DISCIPLINE (deliberate, do not "simplify" back):
 * The generic AI restaurant palette is warm cream + brass/ochre + espresso
 * (#f5ebd8 / #d4915a / #b89968 …). Every AI-built premium-food site lands there,
 * which is exactly why the brand disappears. None of the five below use it.
 * Each preset commits to a DIFFERENT colour family and a DIFFERENT accent hue,
 * so five sites built from this template never read as the same site:
 *
 *   basalt   → off-black + wheat-tan   (black-and-tan, sharp contrast)
 *   zellige  → cool porcelain + cobalt (saturated blue on one neutral)
 *   sumac    → cool slate + brick rust (warm rust against cold grey)
 *   nakhil   → deep palm green + amber (forest family, bone text)
 *   rukham   → pearl grey + graphite   (cold luxury, chrome/smoke)
 *
 * Typography is Arabic-first: the display face carries the character (Kufic,
 * Ruqaa, Naskh) and the body face stays quiet and legible. Latin names are
 * fallbacks only — these sites are read in Arabic.
 */

export type SufraPresetId = 'basalt' | 'zellige' | 'sumac' | 'nakhil' | 'rukham'

export type SufraColors = {
  /** Page background. */
  background: string
  /** Raised panels / cards on top of the background. */
  surface: string
  /** Primary body + heading text. */
  text: string
  /** Secondary text, captions, de-emphasised copy. */
  muted: string
  /** THE single accent. One per preset — never a second competing hue. */
  accent: string
  /** Readable text placed on top of `accent` (buttons). */
  onAccent: string
  /** Deep contrast band used for the visit/reservation section. */
  contrast: string
  /** Text on the contrast band. */
  onContrast: string
  /** Hairlines and dividers. */
  border: string
}

export type SufraPreset = {
  id: SufraPresetId
  /** Arabic display name — what the owner actually picks in the UI. */
  name: string
  /** Latin id shown as a small caption in the switcher. */
  latin: string
  description: string
  /** Whether the base surface is dark (drives image treatment + scrims). */
  dark: boolean
  colors: SufraColors
  heading_font: string
  body_font: string
}

export const SUFRA_PRESETS: SufraPreset[] = [
  {
    id: 'basalt',
    name: 'بازلت',
    latin: 'Basalt',
    description: 'حجر بازلتي أسود ولون القمح. تباين حاد ومسائي.',
    dark: true,
    colors: {
      background: '#0b0b0d',
      surface: '#141417',
      text: '#efece7',
      muted: '#9b978f',
      accent: '#d8a54a',
      onAccent: '#0b0b0d',
      contrast: '#141417',
      onContrast: '#efece7',
      border: 'rgba(239,236,231,0.14)',
    },
    heading_font: '"Reem Kufi", "Tajawal", sans-serif',
    body_font: '"IBM Plex Sans Arabic", "Tajawal", sans-serif',
  },
  {
    id: 'zellige',
    name: 'زليج',
    latin: 'Zellige',
    description: 'أزرق فاس المشبع على خزف بارد. أندلسي حديث.',
    dark: false,
    colors: {
      background: '#f1f3f7',
      surface: '#ffffff',
      text: '#11151f',
      muted: '#5b6273',
      accent: '#1f43c9',
      onAccent: '#ffffff',
      contrast: '#11203f',
      onContrast: '#eef1f8',
      border: 'rgba(17,21,31,0.12)',
    },
    heading_font: '"Aref Ruqaa", "Amiri", serif',
    body_font: '"Almarai", "Tajawal", sans-serif',
  },
  {
    id: 'sumac',
    name: 'سُمّاق',
    latin: 'Sumac',
    description: 'قرميد شامي دافئ على رمادي بارد. مطبخ بلاد الشام.',
    dark: false,
    colors: {
      background: '#e9eaec',
      surface: '#ffffff',
      text: '#1b1d20',
      muted: '#61656c',
      accent: '#b23a1c',
      onAccent: '#ffffff',
      contrast: '#232629',
      onContrast: '#ececee',
      border: 'rgba(27,29,32,0.13)',
    },
    heading_font: '"IBM Plex Sans Arabic", "Tajawal", sans-serif',
    body_font: '"IBM Plex Sans Arabic", "Tajawal", sans-serif',
  },
  {
    id: 'nakhil',
    name: 'نخيل',
    latin: 'Nakhil',
    description: 'أخضر النخيل العميق وعنبر التمر. واحة مسائية.',
    dark: true,
    colors: {
      background: '#0f1e18',
      surface: '#16291f',
      text: '#e7e3d6',
      muted: '#9aa396',
      accent: '#dfa32a',
      onAccent: '#0f1e18',
      contrast: '#16291f',
      onContrast: '#e7e3d6',
      border: 'rgba(231,227,214,0.15)',
    },
    heading_font: '"Amiri", "Reem Kufi", serif',
    body_font: '"Tajawal", "Almarai", sans-serif',
  },
  {
    id: 'rukham',
    name: 'رخام',
    latin: 'Rukham',
    description: 'رخام لؤلؤي وجرافيت. فخامة باردة وهادئة.',
    dark: false,
    colors: {
      background: '#eceef0',
      surface: '#ffffff',
      text: '#1d2124',
      muted: '#666d73',
      accent: '#3c464d',
      onAccent: '#ffffff',
      contrast: '#1d2124',
      onContrast: '#eceef0',
      border: 'rgba(29,33,36,0.14)',
    },
    heading_font: '"Reem Kufi", "Tajawal", sans-serif',
    body_font: '"Tajawal", "Almarai", sans-serif',
  },
]

export function getSufraPreset(id: SufraPresetId | string): SufraPreset {
  return SUFRA_PRESETS.find((p) => p.id === id) ?? SUFRA_PRESETS[0]
}
