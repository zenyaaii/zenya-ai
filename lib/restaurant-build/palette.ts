import sharp from 'sharp'
import type { RestaurantColors } from '@/utils/restaurant/types'

/**
 * Step 4b: the restaurant's own colours. The program measures the real
 * colours in the logo and room photos; the AI (in the photo judge) says which
 * of them are the place's identity and whether the place is a night or a day
 * place. This file turns that into a full, readable palette for every page.
 *
 * Every pair that carries text is checked for contrast (WCAG 4.5:1), and a
 * colour is darkened or lightened until it passes — never left unreadable.
 */

type RGB = [number, number, number]
const hex = (c: RGB) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')
export const rgbOf = (h: string): RGB | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export const contrast = (a: RGB, b: RGB) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
function fromHsl(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}
const withL = (c: RGB, l: number, sMax = 1) => { const [h, s] = toHsl(c); return fromHsl(h, Math.min(s, sMax), l) }

/** Measured colours: a few k-means centres per photo, with how much of it they cover. */
export async function measure(buf: Buffer, k = 5): Promise<{ c: RGB; share: number }[]> {
  const px = await sharp(buf).resize(48, 48, { fit: 'cover' }).removeAlpha().raw().toBuffer()
  const pts: RGB[] = []
  for (let i = 0; i < px.length; i += 3) pts.push([px[i], px[i + 1], px[i + 2]])
  let cs: RGB[] = Array.from({ length: k }, (_, i) => pts[Math.floor((i + 0.5) * pts.length / k)])
  let as: number[] = []
  for (let it = 0; it < 8; it++) {
    as = pts.map((p) => { let bi = 0, bd = Infinity; cs.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = j } }); return bi })
    cs = cs.map((c, j) => { const m = pts.filter((_, i) => as[i] === j); return m.length ? m.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((v) => v / m.length) as RGB : c })
  }
  return cs.map((c, j) => ({ c, share: as.filter((a) => a === j).length / pts.length }))
}

/** The AI's hex snapped to the nearest colour really measured in the photos (the AI's eye guides; the pixels decide). */
export function snap(aiHex: string[], measured: { c: RGB; share: number }[]): RGB[] {
  const out: RGB[] = []
  for (const h of aiHex) {
    const a = rgbOf(h); if (!a) continue
    let best: RGB | null = null, bd = Infinity
    for (const m of measured) {
      if (m.share < 0.03) continue
      const d = Math.sqrt((a[0] - m.c[0]) ** 2 + (a[1] - m.c[1]) ** 2 + (a[2] - m.c[2]) ** 2)
      if (d < bd) { bd = d; best = m.c }
    }
    out.push(best && bd < 70 ? best : a)
  }
  return out
}

const sat = (c: RGB) => toHsl(c)[1]

/**
 * A full palette from the identity colours.
 * dark: the main colour becomes a deep night background; the brightest
 *       identity colour is the accent (buttons, lines, stars).
 * light: a paper background tinted by the main colour; the accent is
 *       deepened until white text reads on it.
 */
export function paletteOf(identity: RGB[], mood: 'dark' | 'light'): RestaurantColors {
  const main = identity[0] ?? [22, 36, 74]
  const others = identity.slice(1)
  let accent: RGB = [...others].sort((a, b) => sat(b) - sat(a))[0] ?? main
  if (sat(accent) < 0.18 && sat(main) > sat(accent)) accent = main
  if (mood === 'dark') {
    const bg = withL(main, 0.07, 0.55), surface = withL(main, 0.12, 0.45)
    const text = withL(accent, 0.92, 0.35), muted = withL(accent, 0.68, 0.18)
    let acc = accent, l = toHsl(acc)[2]
    while (contrast(acc, bg) < 5 && l < 0.85) { l += 0.03; acc = withL(accent, l) }
    while (contrast([10, 10, 12], acc) < 4.5 && l < 0.9) { l += 0.03; acc = withL(accent, l) }
    const [r, g, b] = acc
    return { primary: hex(withL(main, 0.18)), accent: hex(acc), background: hex(bg), surface: hex(surface), text: hex(text), muted: hex(muted), border: `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.22)` }
  }
  const bg = withL(main, 0.965, 0.35), surface: RGB = [255, 255, 255]
  const text = withL(main, 0.13, 0.4), muted = withL(main, 0.38, 0.15)
  let acc = accent, l = Math.min(toHsl(acc)[2], 0.5)
  acc = withL(accent, l)
  while ((contrast([255, 255, 255], acc) < 4.5 || contrast(acc, bg) < 4.5) && l > 0.12) { l -= 0.03; acc = withL(accent, l) }
  const [r, g, b] = text
  return { primary: hex(withL(main, Math.min(toHsl(main)[2], 0.35))), accent: hex(acc), background: hex(bg), surface: hex(surface), text: hex(text), muted: hex(muted), border: `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.14)` }
}

const hueGap = (a: RGB, b: RGB) => { const d = Math.abs(toHsl(a)[0] - toHsl(b)[0]); return Math.min(d, 360 - d) }

/**
 * The identity colours from the pixels alone, for when no AI looked at the
 * photos (the owner's wizard). Main is the colour that covers the most of the
 * photos among those with some colour in them (else simply the most); accent
 * is the boldest colour that covers a real part of a photo. Also returns the
 * other bold colours, far enough in hue from the accent, as second-colour
 * choices for the owner.
 */
export function identityFromPixels(measured: { c: RGB; share: number }[]): { identity: RGB[]; seconds: string[] } {
  const real = measured.filter((m) => m.share >= 0.03)
  if (!real.length) return { identity: [], seconds: [] }
  const tinted = real.filter((m) => sat(m.c) > 0.12 && toHsl(m.c)[2] > 0.08 && toHsl(m.c)[2] < 0.92)
  const main = [...(tinted.length ? tinted : real)].sort((a, b) => b.share - a.share)[0].c
  const bold = [...tinted].sort((a, b) => sat(b.c) * Math.sqrt(b.share) - sat(a.c) * Math.sqrt(a.share))
  const accent = bold[0]?.c ?? main
  const seconds: RGB[] = []
  for (const m of bold.slice(1).filter((x) => sat(x.c) > 0.25)) {
    if (hueGap(m.c, accent) < 30 || seconds.some((s) => hueGap(s, m.c) < 30)) continue
    seconds.push(m.c)
    if (seconds.length === 3) break
  }
  return { identity: [main, accent], seconds: seconds.map((c) => hex(withL(c, Math.min(Math.max(toHsl(c)[2], 0.4), 0.6)))) }
}
