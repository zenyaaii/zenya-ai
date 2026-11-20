import { inflateSync } from 'zlib'
import sharp from 'sharp'

/**
 * The pictures inside a PDF (a brand's catalogue), with no PDF library: the
 * image XObjects are read straight from the file. Covers what design tools
 * export: JPEG streams (DCTDecode) and Flate-compressed pixels, PNG
 * predictors, a soft mask for transparency, RGB / grey / CMYK. Anything else
 * (JPX, JBIG2, indexed colour, object streams) is skipped, never guessed.
 *
 * Returns PNGs (transparent where the PDF had a mask) or JPEGs, largest first,
 * one per distinct picture.
 */

type Obj = { dict: string; data: Buffer }
export type PdfImage = { buf: Buffer; type: 'png' | 'jpeg'; w: number; h: number }

const num = (d: string, k: string) => { const m = new RegExp('/' + k + '\\s+(\\d+)').exec(d); return m ? +m[1] : undefined }
const ref = (d: string, k: string) => { const m = new RegExp('/' + k + '\\s+(\\d+)\\s+\\d+\\s+R').exec(d); return m ? +m[1] : undefined }

function objects(pdf: Buffer): Map<number, Obj> {
  const out = new Map<number, Obj>()
  const s = pdf.toString('latin1')
  const re = /(\d+)\s+0\s+obj\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    const id = +m[1]
    const start = m.index + m[0].length
    const end = s.indexOf('endobj', start)
    if (end < 0) break
    const body = s.slice(start, end)
    const si = body.indexOf('stream')
    if (si < 0) { out.set(id, { dict: body, data: Buffer.alloc(0) }); re.lastIndex = end; continue }
    const dict = body.slice(0, si)
    let ds = start + si + 6
    if (s[ds] === '\r') ds++
    if (s[ds] === '\n') ds++
    const len = num(dict, 'Length')
    const lenIsRef = /\/Length\s+\d+\s+\d+\s+R/.test(dict)
    let de = !lenIsRef && len != null && s.slice(ds + len, ds + len + 12).includes('endstream') ? ds + len : s.lastIndexOf('endstream', end)
    if (de < ds) de = ds
    out.set(id, { dict, data: pdf.subarray(ds, de) })
    re.lastIndex = end
  }
  return out
}

/** Undo the PNG row filters (Predictor 10–15). */
function unpredict(raw: Buffer, w: number, comps: number, bpc: number): Buffer | null {
  const bpp = Math.max(1, (comps * bpc) >> 3)
  const row = Math.ceil((w * comps * bpc) / 8)
  const rows = Math.floor(raw.length / (row + 1))
  const out = Buffer.alloc(rows * row)
  for (let y = 0; y < rows; y++) {
    const f = raw[y * (row + 1)]
    const src = raw.subarray(y * (row + 1) + 1, (y + 1) * (row + 1))
    const o = y * row
    for (let x = 0; x < row; x++) {
      const a = x >= bpp ? out[o + x - bpp] : 0
      const b = y ? out[o - row + x] : 0
      const c = y && x >= bpp ? out[o - row + x - bpp] : 0
      let v = src[x]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      else if (f !== 0) return null
      out[o + x] = v & 255
    }
  }
  return out
}

function compsOf(dict: string, all: Map<number, Obj>): number | undefined {
  if (/\/ColorSpace\s*\/DeviceRGB/.test(dict)) return 3
  if (/\/ColorSpace\s*\/DeviceGray/.test(dict)) return 1
  if (/\/ColorSpace\s*\/DeviceCMYK/.test(dict)) return 4
  // [/ICCBased 12 0 R], directly or through a reference to that array
  let cs = /\/ColorSpace\s*\[\s*\/ICCBased\s+(\d+)\s+\d+\s+R\s*\]/.exec(dict)?.[1]
  if (!cs) { const r = ref(dict, 'ColorSpace'); const o = r != null ? all.get(r) : undefined; cs = o ? /\/ICCBased\s+(\d+)\s+\d+\s+R/.exec(o.dict)?.[1] : undefined }
  if (cs) return num(all.get(+cs)?.dict || '', 'N')
  return undefined
}

/** Raw pixels of one image object, or null when it is not a kind we read. */
function pixels(o: Obj, all: Map<number, Obj>, comps?: number): { data: Buffer; w: number; h: number; c: number } | null {
  const w = num(o.dict, 'Width'), h = num(o.dict, 'Height'), bpc = num(o.dict, 'BitsPerComponent') || 8
  if (!w || !h || bpc !== 8 || !/\/FlateDecode/.test(o.dict) || /\/(DCT|JPX|JBIG2)Decode/.test(o.dict)) return null
  const c = comps ?? compsOf(o.dict, all)
  if (!c) return null
  let raw: Buffer
  try { raw = inflateSync(o.data) } catch { return null }
  const pred = num(o.dict, 'Predictor') || 1
  const data = pred >= 10 ? unpredict(raw, w, c, 8) : raw
  if (!data || data.length < w * h * c) return null
  return { data: data.subarray(0, w * h * c), w, h, c }
}

export async function pdfImages(pdf: Buffer, opts: { min?: number; max?: number } = {}): Promise<PdfImage[]> {
  const min = opts.min ?? 300, max = opts.max ?? 24
  const all = objects(pdf)
  const masks = new Set<number>()
  for (const o of all.values()) { const r = ref(o.dict, 'SMask'); if (r != null) masks.add(r) }
  const seen = new Set<string>()
  const out: PdfImage[] = []
  for (const [id, o] of all) {
    if (masks.has(id) || !/\/Subtype\s*\/Image/.test(o.dict)) continue
    const w = num(o.dict, 'Width') || 0, h = num(o.dict, 'Height') || 0
    if (Math.min(w, h) < min) continue
    const key = `${w}x${h}:${o.data.length}:${o.data.subarray(0, 64).toString('hex')}`
    if (seen.has(key)) continue
    seen.add(key)
    try {
      if (/\/DCTDecode/.test(o.dict) && !/\/FlateDecode/.test(o.dict)) {
        const cmyk = compsOf(o.dict, all) === 4
        const buf = cmyk ? await sharp(o.data).toColourspace('srgb').jpeg({ quality: 85 }).toBuffer() : Buffer.from(o.data)
        out.push({ buf, type: 'jpeg', w, h })
        continue
      }
      const px = pixels(o, all)
      if (!px) continue
      let img = sharp(px.data, { raw: { width: px.w, height: px.h, channels: px.c as 1 | 3 | 4 } })
      if (px.c === 4) img = img.toColourspace('srgb')
      const m = ref(o.dict, 'SMask')
      const mo = m != null ? all.get(m) : undefined
      const mp = mo ? pixels(mo, all, 1) : null
      if (mp && mp.w === px.w && mp.h === px.h && px.c === 3) {
        const rgba = Buffer.alloc(px.w * px.h * 4)
        for (let i = 0, j = 0; i < px.w * px.h; i++, j += 3) { rgba[i * 4] = px.data[j]; rgba[i * 4 + 1] = px.data[j + 1]; rgba[i * 4 + 2] = px.data[j + 2]; rgba[i * 4 + 3] = mp.data[i] }
        img = sharp(rgba, { raw: { width: px.w, height: px.h, channels: 4 } })
      }
      out.push({ buf: await img.png().toBuffer(), type: 'png', w, h })
    } catch { /* one bad picture never stops the rest */ }
  }
  return out.sort((a, b) => b.w * b.h - a.w * a.h).slice(0, max)
}
