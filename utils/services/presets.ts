import type { ServiceColors, ServiceStylePresetId } from './types'

export type ServicePreset = {
  id: ServiceStylePresetId
  name: string
  description: string
  vibe: string
  colors: ServiceColors
  heading_font: string
  body_font: string
}

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'cobalt',
    name: 'Cobalt',
    description: 'Crisp, trustworthy, modern local-business design with electric blue accents.',
    vibe: 'trusted modern',
    colors: {
      primary: '#0f4c81',
      accent: '#22c7f2',
      background: '#f4f8fc',
      surface: '#ffffff',
      text: '#10233c',
      muted: '#62748b',
      border: 'rgba(15, 76, 129, 0.14)'
    },
    heading_font: '"Sora", "Inter", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Dark premium aesthetic for ambitious service brands and upscale trades.',
    vibe: 'premium dark',
    colors: {
      primary: '#111827',
      accent: '#f59e0b',
      background: '#090c12',
      surface: '#131926',
      text: '#f8fafc',
      muted: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.18)'
    },
    heading_font: '"Plus Jakarta Sans", "Inter", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Warm, polished service style for home upgrades, wellness, and hospitality.',
    vibe: 'warm premium',
    colors: {
      primary: '#8a4b12',
      accent: '#f7b23b',
      background: '#fbf5ec',
      surface: '#ffffff',
      text: '#332016',
      muted: '#7a6757',
      border: 'rgba(138, 75, 18, 0.14)'
    },
    heading_font: '"Manrope", "Inter", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Calm and elevated look for premium care, cleaning, and service brands.',
    vibe: 'calm elevated',
    colors: {
      primary: '#0f5f55',
      accent: '#37c9a8',
      background: '#eef9f6',
      surface: '#ffffff',
      text: '#15312d',
      muted: '#5d7670',
      border: 'rgba(15, 95, 85, 0.14)'
    },
    heading_font: '"Outfit", "Inter", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  }
]

export function getServicePreset(id: ServiceStylePresetId | string): ServicePreset {
  return SERVICE_PRESETS.find((preset) => preset.id === id) ?? SERVICE_PRESETS[0]
}
