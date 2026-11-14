/**
 * Matching a dish seen in a photo to a menu item by name. Pure, so the
 * wizard (client) and the menu finder (server) share it.
 */

/** Loose Arabic/Latin key: no diacritics, alef/taa/yaa folded, no «ال», no punctuation. */
export function dishKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/(^|\s)ال/g, '$1')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sameDish(a: string, b: string): boolean {
  const x = dishKey(a), y = dishKey(b)
  if (x.length < 3 || y.length < 3) return false
  return x === y || x.includes(y) || y.includes(x)
}
