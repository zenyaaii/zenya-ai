import type { RestaurantColors, RestaurantStylePresetId } from './types'

export type RestaurantPreset = {
  id: RestaurantStylePresetId
  name: string
  description: string
  vibe: string
  colors: RestaurantColors
  heading_font: string
  body_font: string
}

export const RESTAURANT_PRESETS: RestaurantPreset[] = [
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Michelin-tier fine dining. Black, brushed gold, ivory.',
    vibe: 'cinematic luxury',
    colors: {
      primary: '#0e0e10',
      accent: '#c8a96a',
      background: '#0a0a0c',
      surface: '#15151a',
      text: '#f4ecd8',
      muted: '#a09587',
      border: 'rgba(200, 169, 106, 0.25)'
    },
    heading_font: '"Playfair Display", "Times New Roman", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'trattoria',
    name: 'Trattoria',
    description: 'Warm neighborhood Italian. Cream, terracotta, charcoal.',
    vibe: 'rustic warm',
    colors: {
      primary: '#a8323a',
      accent: '#d4915a',
      background: '#f5ebd8',
      surface: '#ffffff',
      text: '#2a1d18',
      muted: '#7c5b4a',
      border: 'rgba(168, 50, 58, 0.18)'
    },
    heading_font: '"Lora", Georgia, serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Seafood, oysters, sun-drenched. Teal, sand, white.',
    vibe: 'breezy refined',
    colors: {
      primary: '#1e5566',
      accent: '#d8a657',
      background: '#f4ede0',
      surface: '#ffffff',
      text: '#172a30',
      muted: '#5e7a82',
      border: 'rgba(30, 85, 102, 0.18)'
    },
    heading_font: '"Cormorant Garamond", Georgia, serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Farm-to-table, foraged, seasonal. Moss, oat, espresso.',
    vibe: 'earthy elevated',
    colors: {
      primary: '#3f5d3a',
      accent: '#b89968',
      background: '#ebe6d8',
      surface: '#ffffff',
      text: '#1f2a1d',
      muted: '#6b7563',
      border: 'rgba(63, 93, 58, 0.18)'
    },
    heading_font: '"Fraunces", Georgia, serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  }
]

export function getRestaurantPreset(id: RestaurantStylePresetId | string): RestaurantPreset {
  return RESTAURANT_PRESETS.find((p) => p.id === id) ?? RESTAURANT_PRESETS[0]
}
