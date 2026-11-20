/**
 * Colour looks for the brand-story template. The wizard puts the brand's own
 * colours first (measured from its logo and photos by /api/niche/colors);
 * these are the fixed choices after it. Keys match the niche palettes, and
 * BrandStoryView maps them onto its paper / ink / brand / sea / shelf / rule.
 */
export type BrandColors = { background: string; surface: string; text: string; muted: string; accent: string; primary: string; border: string }
export type BrandLook = { id: string; name: string; colors: BrandColors }

export const BRAND_LOOKS: BrandLook[] = [
  { id: 'paper', name: 'ورق وحبر', colors: { background: '#F7F6F1', surface: '#ECEAE2', text: '#1B1D1A', muted: '#5F655E', accent: '#2F5D46', primary: '#2C6E70', border: '#E1E3DC' } },
  { id: 'sea', name: 'بحر', colors: { background: '#F3F7F7', surface: '#D9E7E4', text: '#12262A', muted: '#4E6468', accent: '#1F6F78', primary: '#0E4C59', border: '#D6E2E2' } },
  { id: 'clay', name: 'طين', colors: { background: '#F8F3EC', surface: '#EEDFCF', text: '#2A1E16', muted: '#6E5C4E', accent: '#A4532B', primary: '#6B3A22', border: '#E8DCCD' } },
  { id: 'night', name: 'ليل', colors: { background: '#14161A', surface: '#1E2228', text: '#F1EFE9', muted: '#A7A9A6', accent: '#E0B15A', primary: '#8DB8A8', border: '#2B3038' } },
]
