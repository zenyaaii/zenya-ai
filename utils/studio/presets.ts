// UIPro: Luxury/Premium Brand → Exaggerated Minimalism + Motion-Driven + Glassmorphism
// Typography: Cormorant Garamond + Libre Baskerville (Editorial Classic pairing)
import type { StudioColors, StudioStylePresetId } from './types'

export type StudioPreset = {
  id: StudioStylePresetId
  name: string
  description: string
  vibe: string
  colors: StudioColors
  heading_font: string
  body_font: string
  display_font: string
}

export const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'ink',
    name: 'Ink',
    description: 'Pure editorial black on white — maximum impact, Swiss grid, Exaggerated Minimalism.',
    vibe: 'editorial · stark',
    colors: {
      primary: '#0a0a0a',
      accent: '#0a0a0a',
      accentMuted: 'rgba(10,10,10,0.07)',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f4f4f4',
      text: '#0a0a0a',
      muted: '#6b6b6b',
      border: 'rgba(10,10,10,0.1)',
      overlay: 'rgba(10,10,10,0.6)',
      gradient: 'linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 100%)',
      glowAccent: 'rgba(10,10,10,0.08)'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    display_font: '"Cormorant Garamond", "Georgia", serif'
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Warm cream with liquid gold — heritage luxury, Hermès meets Bottega.',
    vibe: 'heritage · warmth',
    colors: {
      primary: '#1a1008',
      accent: '#c9a84c',
      accentMuted: 'rgba(201,168,76,0.12)',
      background: '#faf7f0',
      surface: '#fdf9f1',
      surfaceAlt: '#f2ece0',
      text: '#1a1008',
      muted: '#8a7250',
      border: 'rgba(201,168,76,0.2)',
      overlay: 'rgba(26,16,8,0.6)',
      gradient: 'linear-gradient(135deg, #1a1008 0%, #4a3018 50%, #c9a84c 100%)',
      glowAccent: 'rgba(201,168,76,0.25)'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    display_font: '"Cormorant Garamond", "Georgia", serif'
  },
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Dark editorial with terracotta warmth — after dark luxury, contemporary power.',
    vibe: 'dark editorial · warm',
    colors: {
      primary: '#f0ebe0',
      accent: '#c0674a',
      accentMuted: 'rgba(192,103,74,0.15)',
      background: '#0c0906',
      surface: '#161210',
      surfaceAlt: '#1e1816',
      text: '#f0ebe0',
      muted: '#8a7868',
      border: 'rgba(240,235,224,0.1)',
      overlay: 'rgba(12,9,6,0.7)',
      gradient: 'linear-gradient(135deg, #0c0906 0%, #3a2218 50%, #c0674a 100%)',
      glowAccent: 'rgba(192,103,74,0.3)'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    display_font: '"Cormorant Garamond", "Georgia", serif'
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool grey with cobalt blue — Swiss Modernism 2.0, contemporary corporate brand.',
    vibe: 'swiss · contemporary',
    colors: {
      primary: '#1a2332',
      accent: '#2563eb',
      accentMuted: 'rgba(37,99,235,0.1)',
      background: '#f4f5f7',
      surface: '#ffffff',
      surfaceAlt: '#e8eaed',
      text: '#1a2332',
      muted: '#5c6b7a',
      border: 'rgba(26,35,50,0.1)',
      overlay: 'rgba(26,35,50,0.6)',
      gradient: 'linear-gradient(135deg, #1a2332 0%, #2563eb 100%)',
      glowAccent: 'rgba(37,99,235,0.2)'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif',
    display_font: '"Cormorant Garamond", "Georgia", serif'
  }
]

export function getStudioPreset(id: StudioStylePresetId | string): StudioPreset {
  return STUDIO_PRESETS.find((p) => p.id === id) ?? STUDIO_PRESETS[0]
}
