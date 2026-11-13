import type { Colors } from './kit'

/**
 * Colour sets for the photo studio theme (sample, 2026-11-13).
 *
 * Three are drawn by hand to sit quietly behind photographs: the work carries
 * the colour, the page only frames it. Two come from the studio's own photos
 * through lib/restaurant-build/palette.ts (measure → identity → paletteOf),
 * the same path the restaurant build uses, so a real studio gets its own.
 * The "own" values here are what that code returned for the sample studio's
 * nine work photos (teal place + terracotta dish, dark; walnut room + olive, light).
 */
export const PHOTO_LOOKS: Record<string, Colors & { name: string; note: string }> = {
  darkroom: {
    name: 'الغرفة المظلمة', note: 'فحم دافئ ونحاس هادئ',
    background: '#0e0d0c', surface: '#181614', text: '#f0ece4', muted: '#9a948a', accent: '#d8b47a', accent2: '#8f9e8b', border: '#2a2622',
  },
  paper: {
    name: 'ورق الطباعة', note: 'ورق عاجي وحبر وأحمر قاتم',
    background: '#f4f1ea', surface: '#ebe6dc', text: '#1b1a17', muted: '#6b665c', accent: '#7c2d24', accent2: '#b08a4f', border: '#ddd7cb',
  },
  daylight: {
    name: 'ضوء النهار', note: 'رمادي خلفية الاستوديو وأزرق حجري',
    background: '#e7e9e7', surface: '#dde0dd', text: '#141617', muted: '#5c6266', accent: '#2f4b5c', accent2: '#b7795a', border: '#cdd1ce',
  },
  'own-dark': {
    name: 'من صوره: ليلي', note: 'أزرق بترولي من صورة المكان، وبرتقالي من طبق',
    background: '#08161c', surface: '#11252c', text: '#f2e8e3', muted: '#bca89f', accent: '#e15e1f', accent2: '#b8af9c', border: 'rgba(225,94,31,0.22)',
  },
  'own-light': {
    name: 'من صوره: نهاري', note: 'بني الخشب وزيتوني من صور الاستوديو',
    background: '#f7f6f5', surface: '#ffffff', text: '#261f1c', muted: '#6f5b52', accent: '#627140', accent2: '#6c5850', border: 'rgba(38,31,28,0.14)',
  },
}
