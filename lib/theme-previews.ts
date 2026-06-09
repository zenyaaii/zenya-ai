/**
 * Single source of truth for theme card cover images.
 *
 * Every surface that lists templates (the public /themes catalog, the
 * /theme/new wizard picker, the marketing TemplateStackSection on the
 * landing page, the dashboard SiteCard) reads from this map so swapping
 * a screenshot only requires touching one file.
 *
 * ── HOW IT RESOLVES ───────────────────────────────────────────────────
 * `themePreview(id)` returns a URL like `/api/theme-preview/<id>`. The
 * route handler at `app/api/theme-preview/[id]/route.ts` checks the file
 * system on every request:
 *   • file at `public/theme-previews/<id>.{png,jpg,jpeg,webp}` exists
 *     → 302 to it
 *   • otherwise → 302 to the curated Unsplash fallback
 *
 * That means dropping a real screenshot into `public/theme-previews/`
 * automatically replaces the stock photo on every theme card in the app.
 * No code change, no list to maintain, no 404s.
 *
 * ── HOW TO ADD A REAL SCREENSHOT ───────────────────────────────────────
 * Save the file as `public/theme-previews/<id>.png` (jpg/jpeg/webp also
 * accepted) where `<id>` is one of: restaurant, atlas, services,
 * collective, studio, lookbook, wellness, one_product, storefront.
 * Refresh — done.
 */

export type ThemeId =
  | 'restaurant'
  | 'one_product'
  | 'storefront'
  | 'atlas'
  | 'services'
  | 'collective'
  | 'studio'
  | 'lookbook'
  | 'wellness'

const FALLBACKS: Record<ThemeId, string> = {
  restaurant:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
  one_product:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
  storefront:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
  atlas:
    'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80',
  services:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80',
  collective:
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
  studio:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80',
  lookbook:
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
  wellness:
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80',
}

/**
 * The cover URL for a theme card. Goes through the resolver route so the
 * file system is the source of truth — present file beats fallback.
 */
export function themePreview(id: string): string {
  return `/api/theme-preview/${encodeURIComponent(id)}`
}

/**
 * The Unsplash fallback URL for a theme. Useful as a defensive `onError`
 * target on <img> tags so a transient resolver outage never breaks the UI.
 */
export function themePreviewFallback(id: string): string {
  const key = id as ThemeId
  return FALLBACKS[key] || FALLBACKS.one_product
}

/**
 * Kept for backwards compatibility — callers used to branch on this to
 * pick a screenshot vs. icon layout. With the resolver in place every
 * card always resolves to *something* (local file → curated Unsplash
 * fallback), so every theme we ship gets the screenshot variant.
 */
const SCREENSHOT_THEMES = new Set<ThemeId>([
  'restaurant', 'atlas', 'services', 'studio', 'lookbook', 'wellness',
  'one_product', 'storefront', 'collective',
])
export function hasLocalThemePreview(id: string): boolean {
  return SCREENSHOT_THEMES.has(id as ThemeId)
}
