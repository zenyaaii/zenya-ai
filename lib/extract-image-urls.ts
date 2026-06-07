/**
 * Walk an arbitrary nested object/array and collect every string that
 * looks like an image URL. Used after theme creation so we can seed the
 * user's gallery with the demo imagery shipped in the theme content.
 *
 * Heuristic: http(s):// URL whose path ends in a common image extension,
 * OR which lives under Supabase Storage's public/theme-uploads bucket,
 * OR which comes from a known image CDN (Unsplash, etc).
 */

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(?:\?|$)/i
const KNOWN_HOSTS = [
  'images.unsplash.com',
  'plus.unsplash.com',
  'res.cloudinary.com',
  'cdn.shopify.com',
  'cdn.jsdelivr.net',
]

export function looksLikeImageUrl(s: string): boolean {
  if (typeof s !== 'string') return false
  const t = s.trim()
  if (!/^https?:\/\//i.test(t)) return false
  if (IMAGE_EXT.test(t)) return true
  if (t.includes('/storage/v1/object/public/theme-uploads/')) return true
  try {
    const u = new URL(t)
    if (KNOWN_HOSTS.includes(u.hostname)) return true
  } catch {
    return false
  }
  return false
}

export function extractImageUrls(value: unknown, max = 200): string[] {
  const found = new Set<string>()
  const stack: unknown[] = [value]
  let visited = 0

  while (stack.length && found.size < max) {
    const cur = stack.pop()
    visited++
    if (visited > 5000) break // hard cap on object size

    if (cur == null) continue
    if (typeof cur === 'string') {
      if (looksLikeImageUrl(cur)) found.add(cur)
      continue
    }
    if (Array.isArray(cur)) {
      for (const v of cur) stack.push(v)
      continue
    }
    if (typeof cur === 'object') {
      for (const v of Object.values(cur as Record<string, unknown>)) stack.push(v)
    }
  }

  return Array.from(found)
}
