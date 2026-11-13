import { measure, paletteOf, toHsl, withL, rgbOf } from '@/lib/restaurant-build/palette'
import type { Look } from '@/utils/services/kinds'

/**
 * Two colour sets taken from the owner's own photos (Anas, 2026-11-13, beauty
 * & spa: «من صور المركز» is the default look). No model is called: the photos'
 * real colours are measured, the strongest one becomes the main colour and a
 * second, different one the quiet second colour.
 *
 *   light — a paper background tinted by the main colour, the main colour as
 *           the buttons (deepened until white text reads on it)
 *   dark  — a deep background from the main colour, the second colour lit up
 *           as the buttons
 *
 * Fewer than two usable photos, or photos with no real colour in them (grey
 * rooms, white product shots): no sets, and the kind's own first look stays.
 */

type RGB = [number, number, number]
const hex = (c: RGB) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')

/** Main and second colour from photos' measured clusters, or null. */
export function identityOf(perPhoto: { c: RGB; share: number }[][]): [RGB, RGB] | null {
  if (perPhoto.length < 2) return null
  const all = perPhoto.flatMap((m) => m.map((x) => ({ c: x.c, share: x.share / perPhoto.length })))
  const col = all.filter((m) => { const [, s, l] = toHsl(m.c); return s > 0.18 && l > 0.12 && l < 0.88 && m.share > 0.01 })
  if (!col.length) return null
  col.sort((a, b) => b.share * toHsl(b.c)[1] - a.share * toHsl(a.c)[1])
  const main = col[0].c
  const hd = (a: RGB, b: RGB) => { const d = Math.abs(toHsl(a)[0] - toHsl(b)[0]); return Math.min(d, 360 - d) }
  const second = (col.find((m) => hd(m.c, main) > 18 || Math.abs(toHsl(m.c)[2] - toHsl(main)[2]) > 0.25) || col[1] || col[0]).c
  return [main, second]
}

/** The two looks from a main and a second colour. */
export function looksOf([main, second]: [RGB, RGB]): Look[] {
  const light = paletteOf([main, main], 'light')
  const dark = paletteOf([main, second], 'dark')
  return [
    { id: 'photo-light', name: 'من صورك، فاتح', colors: { ...light, accent2: hex(withL(second, Math.min(Math.max(toHsl(second)[2], 0.42), 0.5))) } },
    { id: 'photo-dark', name: 'من صورك، داكن', colors: { ...dark, accent2: hex(withL(main, 0.62)) } },
  ]
}

/** Looks from photo bytes (the wizard's Google photos). */
export async function photoLooks(bufs: Buffer[]): Promise<Look[]> {
  const measured = (await Promise.all(bufs.slice(0, 8).map((b) => measure(b, 6).catch(() => null)))).filter((m): m is { c: RGB; share: number }[] => !!m)
  const id = identityOf(measured)
  return id ? looksOf(id) : []
}

/** Looks from identity colours already found (a lead build's photo judge). */
export function looksFromIdentity(identity: string[]): Look[] {
  const c = identity.map(rgbOf).filter((x): x is RGB => !!x)
  if (!c.length) return []
  return looksOf([c[0], c[1] || c[0]])
}
