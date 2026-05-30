// UIPro: E-commerce Luxury → Liquid Glass + Aurora UI + Motion-Driven
// Typography: Playfair Display + Inter (Classic Elegant pairing)
import type { CollectiveColors, CollectiveStylePresetId } from './types'

export type CollectivePreset = {
  id: CollectiveStylePresetId
  name: string
  description: string
  vibe: string
  colors: CollectiveColors
  heading_font: string
  body_font: string
}

export const COLLECTIVE_PRESETS: CollectivePreset[] = [
  {
    id: 'jade',
    name: 'Jade',
    description: 'Deep emerald with liquid gold — luxury lifestyle, Bottega meets Net-a-Porter.',
    vibe: 'dark luxury · aurora',
    colors: {
      primary: '#10b981',
      primaryLight: '#34d399',
      accent: '#d4af37',
      accentMuted: '#d4af3722',
      background: '#060f0c',
      surface: '#0d1f18',
      surfaceGlass: 'rgba(16,185,129,0.06)',
      surfaceAlt: '#112418',
      text: '#ecfdf5',
      textInverse: '#060f0c',
      muted: '#6b9e84',
      border: 'rgba(16,185,129,0.15)',
      borderGlass: 'rgba(255,255,255,0.08)',
      overlay: 'rgba(6,15,12,0.72)',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #d4af37 100%)',
      auroraA: '#10b981',
      auroraB: '#059669',
      auroraC: '#d4af37',
      glowPrimary: 'rgba(16,185,129,0.4)',
      glowAccent: 'rgba(212,175,55,0.3)'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Warm amber aurora on deep mahogany — artisanal, premium, evocative.',
    vibe: 'warm luxury · glow',
    colors: {
      primary: '#d97706',
      primaryLight: '#f59e0b',
      accent: '#fbbf24',
      accentMuted: '#fbbf2420',
      background: '#0d0800',
      surface: '#1a1005',
      surfaceGlass: 'rgba(217,119,6,0.07)',
      surfaceAlt: '#1f1408',
      text: '#fef9ec',
      textInverse: '#0d0800',
      muted: '#a07840',
      border: 'rgba(217,119,6,0.18)',
      borderGlass: 'rgba(255,255,255,0.07)',
      overlay: 'rgba(13,8,0,0.74)',
      gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #fbbf24 100%)',
      auroraA: '#d97706',
      auroraB: '#92400e',
      auroraC: '#fbbf24',
      glowPrimary: 'rgba(217,119,6,0.45)',
      glowAccent: 'rgba(251,191,36,0.3)'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'pearl',
    name: 'Pearl',
    description: 'Ivory and navy with gold — classic luxury department store, Selfridges meets Ssense.',
    vibe: 'light luxury · classic',
    colors: {
      primary: '#0f172a',
      primaryLight: '#1e3a5f',
      accent: '#c9a84c',
      accentMuted: '#c9a84c18',
      background: '#fafaf7',
      surface: '#ffffff',
      surfaceGlass: 'rgba(201,168,76,0.06)',
      surfaceAlt: '#f5f2eb',
      text: '#0f172a',
      textInverse: '#ffffff',
      muted: '#64748b',
      border: 'rgba(15,23,42,0.1)',
      borderGlass: 'rgba(201,168,76,0.2)',
      overlay: 'rgba(15,23,42,0.55)',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #c9a84c 100%)',
      auroraA: '#c9a84c',
      auroraB: '#0f172a',
      auroraC: '#d4b866',
      glowPrimary: 'rgba(15,23,42,0.15)',
      glowAccent: 'rgba(201,168,76,0.35)'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'iris',
    name: 'Iris',
    description: 'Deep violet aurora — luxury beauty, avant-garde, Comme des Garçons energy.',
    vibe: 'dark violet · aurora',
    colors: {
      primary: '#7c3aed',
      primaryLight: '#9f5cf0',
      accent: '#c084fc',
      accentMuted: '#c084fc18',
      background: '#06040f',
      surface: '#0f0824',
      surfaceGlass: 'rgba(124,58,237,0.07)',
      surfaceAlt: '#140e2e',
      text: '#f5f0ff',
      textInverse: '#06040f',
      muted: '#8b72b5',
      border: 'rgba(124,58,237,0.18)',
      borderGlass: 'rgba(255,255,255,0.07)',
      overlay: 'rgba(6,4,15,0.74)',
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c084fc 100%)',
      auroraA: '#7c3aed',
      auroraB: '#4c1d95',
      auroraC: '#c084fc',
      glowPrimary: 'rgba(124,58,237,0.45)',
      glowAccent: 'rgba(192,132,252,0.3)'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  }
]

export function getCollectivePreset(id: CollectiveStylePresetId | string): CollectivePreset {
  return COLLECTIVE_PRESETS.find((p) => p.id === id) ?? COLLECTIVE_PRESETS[0]
}
