/**
 * Colour maths for «فاحص بينون» (the QA agent).
 *
 * Everything here is pure, so the agent, a test or an API route can use it.
 * Colours are compared in CIE Lab with ΔE2000, the difference a person sees,
 * not the distance between hex codes: #1b1712 and #16120d are the same ink to
 * the eye (ΔE ≈ 1.6), #c4a35a and #d9b33a are not (ΔE ≈ 9).
 *
 * The rule the agent enforces with these: every colour painted on a page must
 * be explained by the reference palette, either as one of its colours or as a
 * blend of two of them (a template's color-mix(), or a colour with alpha over
 * the page). A colour that nothing explains was put there by hand.
 */

export type RGB = { r: number; g: number; b: number; a: number }
export type Lab = { L: number; a: number; b: number }

const clamp = (v: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, v))

/** #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), color(srgb …), oklab(), oklch(), lab(), lch(). */
export function parseColor(input: string | null | undefined): RGB | null {
  if (!input) return null
  const s = input.trim().toLowerCase()
  if (!s || s === 'transparent' || s === 'none' || s === 'currentcolor') return null
  let m = /^#([0-9a-f]{3,8})$/.exec(s)
  if (m) {
    const h = m[1]
    if (h.length === 3 || h.length === 4) {
      const [r, g, b, a = 'f'] = h.split('')
      return { r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16), a: parseInt(a + a, 16) / 255 }
    }
    if (h.length === 6 || h.length === 8) {
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }
    }
    return null
  }
  const nums = (body: string) => body.replace(/[,/]/g, ' ').split(/\s+/).filter(Boolean)
  const num = (v: string, scale = 1) => (v.endsWith('%') ? (parseFloat(v) / 100) * scale : parseFloat(v))
  m = /^rgba?\((.*)\)$/.exec(s)
  if (m) {
    const p = nums(m[1])
    if (p.length < 3) return null
    return { r: clamp(num(p[0], 255)), g: clamp(num(p[1], 255)), b: clamp(num(p[2], 255)), a: p[3] !== undefined ? clamp(num(p[3], 1), 0, 1) : 1 }
  }
  m = /^color\(srgb\s+(.*)\)$/.exec(s)
  if (m) {
    const p = nums(m[1])
    if (p.length < 3) return null
    return { r: clamp(num(p[0], 1) * 255), g: clamp(num(p[1], 1) * 255), b: clamp(num(p[2], 1) * 255), a: p[3] !== undefined ? clamp(num(p[3], 1), 0, 1) : 1 }
  }
  m = /^(oklab|oklch|lab|lch)\((.*)\)$/.exec(s)
  if (m) {
    const p = nums(m[2])
    if (p.length < 3) return null
    const alpha = p[3] !== undefined ? clamp(num(p[3], 1), 0, 1) : 1
    let rgb: [number, number, number]
    if (m[1] === 'oklab' || m[1] === 'oklch') {
      const L = num(p[0], 1)
      let A: number, B: number
      if (m[1] === 'oklab') { A = num(p[1], 0.4); B = num(p[2], 0.4) } else {
        const C = num(p[1], 0.4), h = (parseFloat(p[2]) * Math.PI) / 180
        A = C * Math.cos(h); B = C * Math.sin(h)
      }
      rgb = oklabToSrgb(L, A, B)
    } else {
      const L = num(p[0], 100)
      let A: number, B: number
      if (m[1] === 'lab') { A = num(p[1], 125); B = num(p[2], 125) } else {
        const C = num(p[1], 150), h = (parseFloat(p[2]) * Math.PI) / 180
        A = C * Math.cos(h); B = C * Math.sin(h)
      }
      rgb = labToSrgb({ L, a: A, b: B })
    }
    return { r: clamp(rgb[0]), g: clamp(rgb[1]), b: clamp(rgb[2]), a: alpha }
  }
  return null
}

export const hex = (c: RGB) => '#' + [c.r, c.g, c.b].map((v) => Math.round(clamp(v)).toString(16).padStart(2, '0')).join('')

/** Paint `top` (with its alpha) over an opaque `under`. */
export function over(top: RGB, under: RGB): RGB {
  const a = top.a
  return { r: top.r * a + under.r * (1 - a), g: top.g * a + under.g * (1 - a), b: top.b * a + under.b * (1 - a), a: 1 }
}

const lin = (v: number) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
const unlin = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

export function toLab(c: RGB): Lab {
  const r = lin(c.r), g = lin(c.g), b = lin(c.b)
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29)
  const fx = f(X), fy = f(Y), fz = f(Z)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

function labToSrgb(l: Lab): [number, number, number] {
  const fy = (l.L + 16) / 116, fx = fy + l.a / 500, fz = fy - l.b / 200
  const inv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (108 / 841) * (t - 4 / 29))
  const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z
  const g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z
  const b = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
  return [unlin(r), unlin(g), unlin(b)]
}

function oklabToSrgb(L: number, A: number, B: number): [number, number, number] {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B
  const s_ = L - 0.0894841775 * A - 1.291485548 * B
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [unlin(r), unlin(g), unlin(b)]
}

/** CIEDE2000. Under 2.3 is "the same colour" to most people; over 10 is plainly different. */
export function deltaE(x: Lab, y: Lab): number {
  const rad = Math.PI / 180
  const C1 = Math.hypot(x.a, x.b), C2 = Math.hypot(y.a, y.b)
  const Cb = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
  const a1 = (1 + G) * x.a, a2 = (1 + G) * y.a
  const c1 = Math.hypot(a1, x.b), c2 = Math.hypot(a2, y.b)
  const h = (b: number, a: number) => { if (a === 0 && b === 0) return 0; const t = Math.atan2(b, a) / rad; return t < 0 ? t + 360 : t }
  const h1 = h(x.b, a1), h2 = h(y.b, a2)
  const dL = y.L - x.L, dC = c2 - c1
  let dh = 0
  if (c1 * c2 !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360 }
  const dH = 2 * Math.sqrt(c1 * c2) * Math.sin((dh / 2) * rad)
  const Lb = (x.L + y.L) / 2, cb = (c1 + c2) / 2
  let hb = h1 + h2
  if (c1 * c2 !== 0) { if (Math.abs(h1 - h2) > 180) hb += h1 + h2 < 360 ? 360 : -360; hb /= 2 }
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad)
  const dTheta = 30 * Math.exp(-(((hb - 275) / 25) ** 2))
  const Rc = 2 * Math.sqrt(cb ** 7 / (cb ** 7 + 25 ** 7))
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2)
  const Sc = 1 + 0.045 * cb, Sh = 1 + 0.015 * cb * T
  const Rt = -Math.sin(2 * dTheta * rad) * Rc
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh))
}

export const dE = (x: RGB, y: RGB) => deltaE(toLab(x), toLab(y))

/** Distance from c to the straight blend between p and q, in Lab — how color-mix() and alpha paint. */
function toSegment(c: Lab, p: Lab, q: Lab): number {
  const v = [q.L - p.L, q.a - p.a, q.b - p.b]
  const w = [c.L - p.L, c.a - p.a, c.b - p.b]
  const vv = v[0] ** 2 + v[1] ** 2 + v[2] ** 2
  const t = vv ? Math.max(0, Math.min(1, (w[0] * v[0] + w[1] * v[1] + w[2] * v[2]) / vv)) : 0
  const pt: Lab = { L: p.L + t * v[0], a: p.a + t * v[1], b: p.b + t * v[2] }
  return deltaE(c, pt)
}

export type Explained =
  | { ok: true; how: 'palette'; token: string; dE: number }
  | { ok: true; how: 'blend'; tokens: [string, string]; dE: number }
  | { ok: false; nearest: string; dE: number }

/**
 * Is `c` one of the palette's colours, or a blend of two of them?
 * `tol` is the ΔE allowed for a direct match; blends get the same tolerance.
 */
export function explain(c: RGB, palette: Record<string, string>, tol = 6, blendEnds: RegExp | null = /background|surface|text|white|black|bg|card|ink|border|muted/i): Explained {
  const lab = toLab(c)
  const entries = Object.entries(palette)
    .map(([k, v]) => [k, parseColor(v)] as const)
    .filter((e): e is readonly [string, RGB] => !!e[1] && e[1].a > 0.98)
    .map(([k, v]) => [k, toLab(v)] as const)
  let best = { token: '', d: Infinity }
  for (const [k, l] of entries) { const d = deltaE(lab, l); if (d < best.d) best = { token: k, d } }
  if (best.d <= tol) return { ok: true, how: 'palette', token: best.token, dE: round(best.d) }
  let blend = { a: '', b: '', d: Infinity }
  if (blendEnds) for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
    // a blend is a colour mixed toward a ground or the ink (color-mix, alpha) — never two accents into a third
    if (!blendEnds.test(entries[i][0]) && !blendEnds.test(entries[j][0])) continue
    const d = toSegment(lab, entries[i][1], entries[j][1])
    if (d < blend.d) blend = { a: entries[i][0], b: entries[j][0], d }
  }
  if (blend.d <= tol) return { ok: true, how: 'blend', tokens: [blend.a, blend.b], dE: round(blend.d) }
  return { ok: false, nearest: best.token, dE: round(best.d) }
}

const round = (v: number) => Math.round(v * 10) / 10

/** WCAG relative luminance and contrast. */
export function contrast(x: RGB, y: RGB): number {
  const L = (c: RGB) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
  const a = L(x), b = L(y)
  return round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 10) / 10
}

/** How colourful a colour is (Lab chroma). Under ~8 reads as a grey. */
export const chroma = (c: RGB) => { const l = toLab(c); return Math.hypot(l.a, l.b) }
