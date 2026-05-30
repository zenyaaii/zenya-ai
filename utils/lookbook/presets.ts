import type { LookbookColors, LookbookStylePresetId } from './types'

export type LookbookPreset = {
  id: LookbookStylePresetId
  name: string
  description: string
  vibe: string
  colors: LookbookColors
  heading_font: string
  body_font: string
}

export const LOOKBOOK_PRESETS: LookbookPreset[] = [
  {
    id: 'noir',
    name: 'Noir',
    description: 'Pure black and white editorial — haute couture, The Row, Celine.',
    vibe: 'editorial · minimal',
    colors: {
      primary: '#0a0a0a',
      accent: '#0a0a0a',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f4f4f4',
      text: '#0a0a0a',
      muted: '#6b6b6b',
      border: 'rgba(10,10,10,0.1)',
      overlay: 'rgba(10,10,10,0.55)',
      badge: '#0a0a0a',
      badgeText: '#ffffff'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'blush',
    name: 'Blush',
    description: 'Warm terracotta and cream — Jacquemus, Skims, Mediterranean warmth.',
    vibe: 'warm · feminine',
    colors: {
      primary: '#b5694a',
      accent: '#d4956e',
      background: '#fdf7f2',
      surface: '#ffffff',
      surfaceAlt: '#f5ede4',
      text: '#251510',
      muted: '#9a7060',
      border: 'rgba(181,105,74,0.14)',
      overlay: 'rgba(37,21,16,0.52)',
      badge: '#b5694a',
      badgeText: '#ffffff'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'earth',
    name: 'Earth',
    description: 'Warm sand and sage — Reformation, Everlane, slow fashion.',
    vibe: 'natural · conscious',
    colors: {
      primary: '#5c4a32',
      accent: '#8a7055',
      background: '#f5f0e6',
      surface: '#fdfaf4',
      surfaceAlt: '#ede8da',
      text: '#2a2216',
      muted: '#7a6a54',
      border: 'rgba(92,74,50,0.14)',
      overlay: 'rgba(42,34,22,0.54)',
      badge: '#5c4a32',
      badgeText: '#fdf8ef'
    },
    heading_font: '"Playfair Display", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  },
  {
    id: 'void',
    name: 'Void',
    description: 'Deep dark editorial — Rick Owens, Acne Studios, avant-garde.',
    vibe: 'dark · avant-garde',
    colors: {
      primary: '#e8e0d4',
      accent: '#c0a882',
      background: '#0a0a0a',
      surface: '#141414',
      surfaceAlt: '#1e1e1e',
      text: '#e8e0d4',
      muted: '#888070',
      border: 'rgba(232,224,212,0.12)',
      overlay: 'rgba(0,0,0,0.65)',
      badge: '#e8e0d4',
      badgeText: '#0a0a0a'
    },
    heading_font: '"Cormorant Garamond", "Georgia", serif',
    body_font: '"Inter", "Helvetica Neue", sans-serif'
  }
]

export function getLookbookPreset(id: LookbookStylePresetId | string): LookbookPreset {
  return LOOKBOOK_PRESETS.find((p) => p.id === id) ?? LOOKBOOK_PRESETS[0]
}
