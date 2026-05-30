import type { AtlasColors, AtlasStylePresetId } from './types'

export type AtlasPreset = {
  id: AtlasStylePresetId
  name: string
  description: string
  vibe: string
  colors: AtlasColors
  heading_font: string
  body_font: string
}

export const ATLAS_PRESETS: AtlasPreset[] = [
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'Clean light mode with indigo accents — precise, modern, trustworthy.',
    vibe: 'clean · modern',
    colors: {
      primary: '#6366f1',
      primaryMuted: '#6366f115',
      accent: '#06b6d4',
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceAlt: '#f1f5f9',
      text: '#0f172a',
      muted: '#64748b',
      border: 'rgba(99,102,241,0.14)',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
      glowPrimary: 'rgba(99,102,241,0.25)'
    },
    heading_font: '"Inter", "Helvetica Neue", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep dark mode with violet gradients — bold, focused, premium.',
    vibe: 'dark · bold',
    colors: {
      primary: '#a78bfa',
      primaryMuted: '#a78bfa18',
      accent: '#38bdf8',
      background: '#08080f',
      surface: '#111118',
      surfaceAlt: '#18181f',
      text: '#f1f0ff',
      muted: '#8b8aaa',
      border: 'rgba(167,139,250,0.15)',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #38bdf8 100%)',
      glowPrimary: 'rgba(139,92,246,0.4)'
    },
    heading_font: '"Inter", "Helvetica Neue", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Dark emerald and teal — developer-first, open, powerful.',
    vibe: 'dark · electric',
    colors: {
      primary: '#10b981',
      primaryMuted: '#10b98118',
      accent: '#06b6d4',
      background: '#020b08',
      surface: '#061412',
      surfaceAlt: '#0c1f1b',
      text: '#ecfdf5',
      muted: '#6b8f82',
      border: 'rgba(16,185,129,0.18)',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%)',
      glowPrimary: 'rgba(16,185,129,0.35)'
    },
    heading_font: '"Inter", "Helvetica Neue", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Navy enterprise with sky blue — B2B, secure, institutional.',
    vibe: 'enterprise · professional',
    colors: {
      primary: '#0ea5e9',
      primaryMuted: '#0ea5e915',
      accent: '#38bdf8',
      background: '#020c18',
      surface: '#061424',
      surfaceAlt: '#0c2040',
      text: '#e0f2fe',
      muted: '#5c87a8',
      border: 'rgba(14,165,233,0.18)',
      gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #38bdf8 100%)',
      glowPrimary: 'rgba(14,165,233,0.35)'
    },
    heading_font: '"Inter", "Helvetica Neue", sans-serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  }
]

export function getAtlasPreset(id: AtlasStylePresetId | string): AtlasPreset {
  return ATLAS_PRESETS.find((p) => p.id === id) ?? ATLAS_PRESETS[0]
}
