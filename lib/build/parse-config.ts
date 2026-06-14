/**
 * Shared request-body → BuildConfig parsing for /api/build/download and
 * /api/build/publish. Everything is hard-sanitized: the body round-trips
 * through the client, so caps and type coercion here are the trust
 * boundary. The palette is resolved server-side from its id so a client
 * can't smuggle arbitrary colors into the theme settings.
 */
import { getPalette } from './palettes'
import type { BuildConfig, ProductReview } from './theme-generator'

export type ParseResult =
  | { ok: true; config: BuildConfig }
  | { ok: false; error: string; message: string }

export function parseBuildConfig(body: any): ParseResult {
  const productName = String(body?.productName || '').trim()
  const storeName = String(body?.storeName || '').trim()
  const salePrice = Number(body?.salePrice)
  const originalPrice = Number(body?.originalPrice) || 0
  const images = Array.isArray(body?.images)
    ? body.images.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 12)
    : []
  const paletteId = String(body?.paletteId || '')
  const description = String(body?.description || '')
  const highlights = Array.isArray(body?.highlights)
    ? body.highlights.map((s: any) => String(s || '')).filter(Boolean).slice(0, 10)
    : []
  const sourceUrl = String(body?.sourceUrl || '')

  const specs: Record<string, string> = {}
  if (body?.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) {
    for (const [k, v] of Object.entries(body.specs).slice(0, 12)) {
      const key = String(k || '').slice(0, 40).trim()
      const value = String(v || '').slice(0, 120).trim()
      if (key && value) specs[key] = value
    }
  }

  const reviews: ProductReview[] = Array.isArray(body?.reviews)
    ? body.reviews
        .slice(0, 40)
        .map((r: any): ProductReview => ({
          name: String(r?.name || '').slice(0, 60).trim() || 'Verified buyer',
          country: r?.country ? String(r.country).slice(0, 40).trim() : undefined,
          rating: Math.min(5, Math.max(1, Math.round(Number(r?.rating) || 0))),
          text: String(r?.text || '').slice(0, 600).trim(),
          photos: Array.isArray(r?.photos)
            ? r.photos.map((p: any) => String(p || '').trim()).filter((p: string) => /^https:\/\//.test(p)).slice(0, 4)
            : undefined,
          date: r?.date ? String(r.date).slice(0, 20) : undefined,
        }))
        .filter((r: ProductReview) => r.text.length >= 8 && r.rating >= 1)
    : []
  const statsAvg = Number(body?.reviewStats?.average)
  const statsCount = Number(body?.reviewStats?.count)
  const reviewStats =
    Number.isFinite(statsAvg) && statsAvg > 0 && statsAvg <= 5 && Number.isFinite(statsCount) && statsCount > 0
      ? { average: statsAvg, count: Math.min(9_999_999, Math.round(statsCount)) }
      : undefined

  if (!productName || !storeName) {
    return { ok: false, error: 'invalid', message: 'productName and storeName are required.' }
  }
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return { ok: false, error: 'invalid_price', message: 'salePrice must be a positive number.' }
  }
  if (images.length < 5) {
    return { ok: false, error: 'not_enough_images', message: 'Pick at least 5 product images first.' }
  }

  const palette = getPalette(paletteId)
  const config: BuildConfig = {
    productName,
    storeName,
    salePrice,
    originalPrice,
    images,
    paletteId: palette.id,
    paletteName: palette.name,
    paletteVibe: palette.vibe,
    paletteColors: {
      bg: palette.bg, surface: palette.surface, fg: palette.fg, muted: palette.muted,
      primary: palette.primary, primaryFg: palette.primaryFg,
      accent: palette.accent, border: palette.border,
    },
    description: description || undefined,
    highlights: highlights.length ? highlights : undefined,
    specs: Object.keys(specs).length ? specs : undefined,
    sourceUrl: sourceUrl || undefined,
    reviews: reviews.length ? reviews : undefined,
    reviewStats,
  }
  return { ok: true, config }
}
