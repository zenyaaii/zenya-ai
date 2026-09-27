/**
 * Turns the wizard's "average rating" box into a number the generators accept.
 * An empty box used to become 0 (Number('') is 0), which the wellness schema
 * rejects and every template would print as a zero-star rating. Accepts Arabic
 * digits and a comma or Arabic decimal mark, as owners type "٤٫٨" or "4,8".
 */
export function ratingOf(raw: string | undefined | null): number | undefined {
  const s = String(raw ?? '')
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[٫,]/g, '.')
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n * 10) / 10 : undefined
}
