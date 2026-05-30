import type { WellnessColors, WellnessStylePresetId } from './types'

export type WellnessPreset = {
  id: WellnessStylePresetId
  name: string
  description: string
  vibe: string
  colors: WellnessColors
  heading_font: string
  body_font: string
}

export const WELLNESS_PRESETS: WellnessPreset[] = [
  {
    id: 'zen',
    name: 'Zen',
    description: 'Warm ivory and soft sage — serene spa minimalism with organic warmth.',
    vibe: 'serene · natural',
    colors: {
      primary: '#5c6e5b',
      accent: '#a8c5a0',
      background: '#faf8f4',
      surface: '#ffffff',
      text: '#2c2c2c',
      muted: '#8a8579',
      border: 'rgba(92, 110, 91, 0.15)',
      overlay: 'rgba(44, 44, 40, 0.48)'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Lato", "Helvetica Neue", sans-serif'
  },
  {
    id: 'bloom',
    name: 'Bloom',
    description: 'Soft blush and rose gold — feminine, floral, luxuriously soft.',
    vibe: 'feminine · romantic',
    colors: {
      primary: '#a0596a',
      accent: '#e8b4bc',
      background: '#fdf6f7',
      surface: '#ffffff',
      text: '#2e1f25',
      muted: '#9b7e85',
      border: 'rgba(160, 89, 106, 0.15)',
      overlay: 'rgba(46, 31, 37, 0.52)'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Raleway", "Helvetica Neue", sans-serif'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep forest green and warm gold — premium retreat, editorial darkness.',
    vibe: 'premium · earthy',
    colors: {
      primary: '#1b3a2d',
      accent: '#c9a84c',
      background: '#f2ede6',
      surface: '#faf7f2',
      text: '#1b2a22',
      muted: '#6b7c6e',
      border: 'rgba(27, 58, 45, 0.16)',
      overlay: 'rgba(14, 28, 20, 0.58)'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Dark luxury — deep charcoal and champagne gold for ultra-premium studios.',
    vibe: 'dark · ultra-luxury',
    colors: {
      primary: '#1a1a1a',
      accent: '#d4af72',
      background: '#0e0e0e',
      surface: '#1a1a1a',
      text: '#f0ebe0',
      muted: '#a09880',
      border: 'rgba(212, 175, 114, 0.18)',
      overlay: 'rgba(0, 0, 0, 0.62)'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  }
]

export function getWellnessPreset(id: WellnessStylePresetId | string): WellnessPreset {
  return WELLNESS_PRESETS.find((p) => p.id === id) ?? WELLNESS_PRESETS[0]
}
