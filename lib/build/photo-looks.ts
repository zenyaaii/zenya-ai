import { measure, paletteOf } from '@/lib/restaurant-build/palette'

/**
 * Two colour looks taken from a shop's own photos: a night one and a day one
 * of the same colours (Anas, 2026-11-13: car sites start from the colours of
 * the workshop's photos). No AI: the photos are measured with the same code
 * that reads a restaurant's colours, and the identity is the most common
 * coloured area plus the most vivid colour that covers enough of a photo.
 *
 * Returns null when the photos are too grey to give a colour of their own;
 * the wizard then keeps the kind's first look.
 */

type RGB = [number, number, number]
export type PhotoLook = { id: 'photo-night' | 'photo-day'; name: string; colors: { background: string; surface: string; text: string; muted: string; accent: string; primary: string; border: string } }

function hsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Colours too grey, too dark or too pale to stand for a shop. */
const usable = (c: RGB) => { const [, s, l] = hsl(c); return s >= 0.16 && l >= 0.14 && l <= 0.86 }

/** Opaque border from a palette's rgba() border, so the editor's colour field can show it. */
function solid(border: string, bg: string): string {
  const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(border.replace(/\s/g, ''))
  const b = /^#([0-9a-f]{6})$/i.exec(bg)
  if (!m || !b) return border
  const n = parseInt(b[1], 16), base = [n >> 16, (n >> 8) & 255, n & 255], a = Number(m[4])
  return '#' + [1, 2, 3].map((i, j) => Math.round(Number(m[i]) * a + base[j] * (1 - a)).toString(16).padStart(2, '0')).join('')
}

export async function photoLooks(photos: Buffer[]): Promise<PhotoLook[] | null> {
  const all: { c: RGB; share: number }[] = []
  let light = 0
  for (const buf of photos.slice(0, 6)) {
    const m = await measure(buf, 6).catch(() => null)
    if (!m) continue
    for (const x of m) { all.push({ c: x.c as RGB, share: x.share / Math.min(photos.length, 6) }); light += hsl(x.c as RGB)[2] * x.share }
  }
  if (!all.length) return null
  // Merge near colours across photos, then keep the coloured ones.
  const merged: { c: RGB; share: number }[] = []
  for (const x of all) {
    const near = merged.find((m) => dist(m.c, x.c) < 38)
    if (near) { const t = near.share + x.share; near.c = near.c.map((v, i) => (v * near.share + x.c[i] * x.share) / t) as RGB; near.share = t }
    else merged.push({ ...x })
  }
  const coloured = merged.filter((m) => usable(m.c) && m.share >= 0.03)
  if (!coloured.length) return null
  const main = [...coloured].sort((a, b) => b.share - a.share)[0]
  const vivid = [...coloured].sort((a, b) => hsl(b.c)[1] * Math.sqrt(b.share) - hsl(a.c)[1] * Math.sqrt(a.share))[0]
  const identity: RGB[] = vivid === main ? [main.c] : [main.c, vivid.c]
  const night = paletteOf(identity, 'dark'), day = paletteOf(identity, 'light')
  const look = (id: PhotoLook['id'], name: string, p: typeof night): PhotoLook => ({
    id, name,
    colors: { background: p.background, surface: p.surface, text: p.text, muted: p.muted, accent: p.accent, primary: p.accent, border: solid(p.border, p.background) },
  })
  const out = [look('photo-night', 'من صور محلك: ليلي', night), look('photo-day', 'من صور محلك: نهاري', day)]
  // Bright photos open on the day look, dark photos on the night one.
  const avg = light / Math.max(1, Math.min(photos.length, 6))
  return avg > 0.55 ? out.reverse() : out
}
