/**
 * The v6 editor's model: what is edited, how a path finds its field, what
 * changed since the last publish, and the site check. Ported from the editor
 * sample's core.js and panel.js; the schema is the template's EditorConfig.
 */

import {
  getPath, setPath,
  type EditorConfig, type EditorFieldDef, type EditorPanel, type SectionStyles, type SocialNet,
} from '@/utils/theme-editor-types'

/** Everything the owner can change — what history snapshots and a save writes. */
export type Doc = {
  content: any
  presetId: string
  typographyPreset: string
  colorOverrides: Record<string, string>
  sectionStyles: SectionStyles
}

export type Hist = { s: string; doc: Doc; label: string; t: number; key: string | null }

export const gp = (o: any, p: string): any => (p ? getPath(o, p) : o)
export const sp = <T,>(o: T, p: string, v: any): T => setPath(o, p, v)
export const snap = (d: Doc) => JSON.stringify(d)
export const join = (base: string, p: string) => (p ? base + p : base.replace(/\.$/, ''))

/* ── words ─────────────────────────────────────────────────────────────── */
export const plural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 0 ? `لا ${many}` : n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`
export const norm = (s: string) => String(s).toLowerCase()
  .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
export const cut = (t: string, n: number) => {
  t = String(t || '')
  return [...t].length > n ? [...t].slice(0, n - 1).join('').trimEnd() + '…' : t
}
export const len = (v: any) => [...String(v ?? '')].length
export const notes = (n: number) => (n === 1 ? 'ملاحظة' : plural(n, '', 'ملاحظتان', 'ملاحظات', 'ملاحظة'))

/* ── panels and fields ─────────────────────────────────────────────────── */
export const allPanels = (c: EditorConfig): EditorPanel[] => [...c.panels, ...c.globalPanels]
export const isGlobal = (c: EditorConfig, id: string) => c.globalPanels.some((p) => p.id === id)
export function panelPage(p: EditorPanel): string | null {
  return p.pages && p.pages.length ? p.pages[0] : p.page || null
}

type ListDef = Extract<EditorFieldDef, { type: 'array' }> | Extract<EditorFieldDef, { type: 'strings' }>
export type ListItem = { list: string; i: number; def: ListDef }
export type Resolved = { panel: string; def: EditorFieldDef | null; items: ListItem[]; abs: string }

/** A strings list edits each string as a one-field item. */
export function itemFields(d: ListDef): EditorFieldDef[] {
  return d.type === 'array' ? d.itemFields : [{ type: 'text', path: '', label: d.label }]
}
export const hasPath = (d: EditorFieldDef): d is Extract<EditorFieldDef, { path: string }> =>
  'path' in d && typeof (d as any).path === 'string'

function walk(fields: EditorFieldDef[], prefix: string, path: string, items: ListItem[]): Omit<Resolved, 'panel'> | null {
  for (const f of fields) {
    if (!hasPath(f)) continue
    const abs = join(prefix, f.path)
    if (path === abs) return { def: f, items, abs }
    if (!path.startsWith(abs + '.')) continue
    if (f.type === 'array' || f.type === 'strings') {
      const m = path.slice(abs.length + 1).match(/^(\d+)(?:\.(.+))?$/)
      if (!m) continue
      const it = items.concat([{ list: abs, i: +m[1], def: f }])
      if (m[2] === undefined) {
        if (f.type === 'strings') return { def: itemFields(f)[0], items: it, abs: path }
        return { def: null, items: it, abs: path }
      }
      const r = walk(itemFields(f), abs + '.' + m[1] + '.', path, it)
      if (r) return r
    } else return { def: f, items, abs }
  }
  return null
}

export function resolve(c: EditorConfig, path: string | null | undefined): Resolved | null {
  if (!path) return null
  for (const p of allPanels(c)) {
    const r = walk(p.fields, '', path, [])
    if (r) return { panel: p.id, ...r }
  }
  return null
}
export const labelOf = (d: EditorFieldDef | null | undefined) => (d && 'label' in d ? String((d as any).label || '') : '')

export function itemTitle(d: ListDef, obj: any, i: number): string {
  if (d.type === 'strings') return String(obj ?? '').trim() || `${d.label} ${i + 1}`
  const v = obj && d.itemTitle ? String(getPath(obj, d.itemTitle) ?? '').trim() : ''
  return v || `${d.itemLabel} ${i + 1}`
}
export const itemName = (d: ListDef) => (d.type === 'array' ? d.itemLabel : d.label)

/** Every text the owner can search, with where it lives. */
export function allTexts(c: EditorConfig, content: any) {
  const out: { panel: string; path: string; label: string; val: string; ctx: string[] }[] = []
  const TEXT = new Set(['text', 'textarea', 'price', 'badge', 'tel', 'email', 'url', 'social'])
  const go = (fields: EditorFieldDef[], base: string, panel: string, ctx: string[]) => {
    for (const d of fields) {
      if (!hasPath(d)) continue
      const path = join(base, d.path)
      if (d.type === 'array' || d.type === 'strings') {
        ;(gp(content, path) || []).forEach((it: any, i: number) =>
          go(itemFields(d), `${path}.${i}.`, panel, ctx.concat([itemTitle(d, it, i)])))
      } else if (TEXT.has(d.type)) out.push({ panel, path, label: labelOf(d), val: String(gp(content, path) ?? ''), ctx })
    }
  }
  for (const p of allPanels(c)) go(p.fields, '', p.id, [p.label])
  return out
}

/** The roots of content a panel edits, for "what changed" and for re-picking. */
export function panelRoots(p: EditorPanel): string[] {
  const out = new Set<string>()
  for (const f of p.fields) {
    if (f.type === 'snippet') { out.add(f.title.split('.')[0]); out.add(f.description.split('.')[0]); continue }
    if (hasPath(f) && f.path) out.add(f.path.split('.')[0])
  }
  return [...out]
}

/** The colour presets' mood lines are English (the marketing site shows them
 *  as written); the editor shows the owner the Arabic. Unknown lines pass. */
const PRESET_VIBE_AR: Record<string, string> = {
  'clean · modern': 'نظيف · حديث',
  'dark · bold': 'داكن · جريء',
  'dark · electric': 'داكن · نابض',
  'enterprise · professional': 'مؤسسي · احترافي',
  'dark luxury · aurora': 'فخامة داكنة · وهج',
  'warm luxury · glow': 'فخامة دافئة · توهّج',
  'light luxury · classic': 'فخامة فاتحة · كلاسيكي',
  'dark violet · aurora': 'بنفسجي داكن · وهج',
  'editorial · minimal': 'تحريري · بسيط',
  'warm · feminine': 'دافئ · ناعم',
  'natural · conscious': 'طبيعي · هادئ',
  'dark · avant-garde': 'داكن · جريء',
  'cinematic luxury': 'فخامة سينمائية',
  'rustic warm': 'ريفي دافئ',
  'breezy refined': 'خفيف وراقٍ',
  'earthy elevated': 'ترابي راقٍ',
  'trusted modern': 'حديث وموثوق',
  'premium dark': 'داكن فاخر',
  'warm premium': 'دافئ فاخر',
  'calm elevated': 'هادئ وراقٍ',
  'editorial · stark': 'تحريري · حادّ',
  'heritage · warmth': 'تراثي · دافئ',
  'dark editorial · warm': 'تحريري داكن · دافئ',
  'swiss · contemporary': 'سويسري · معاصر',
  'serene · natural': 'هادئ · طبيعي',
  'feminine · romantic': 'ناعم · رومانسي',
  'premium · earthy': 'فاخر · ترابي',
  'dark · ultra-luxury': 'داكن · فخم جدًا',
}
export const vibeAr = (v: string) => PRESET_VIBE_AR[v] ?? v

/* ── colour ────────────────────────────────────────────────────────────── */
export function rgb(c: string): number[] {
  c = String(c).trim()
  let m
  if ((m = c.match(/^#([0-9a-f]{3})$/i))) return [...m[1]].map((x) => parseInt(x + x, 16))
  if ((m = c.match(/^#([0-9a-f]{6})$/i))) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16))
  if ((m = c.match(/rgba?\(([^)]+)\)/i))) return m[1].split(',').slice(0, 3).map((x) => parseFloat(x))
  return [0, 0, 0]
}
export function alphaOf(c: string) {
  const m = String(c).match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i)
  return m ? +m[1] : 1
}
export const hex = (a: number[]) => '#' + a.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')
function lum(c: string) {
  return rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)
}
export function contrast(a: string, b: string) {
  const x = lum(a), y = lum(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
export const validHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim())
export function colorsOf(c: EditorConfig, d: Doc): Record<string, string> {
  const p = c.colorPresets.find((x) => x.id === d.presetId) || c.colorPresets[0]
  return { ...(p?.colors || {}), ...d.colorOverrides }
}

/* ── checking what is typed ────────────────────────────────────────────── */
export const telOK = (v: string) => /^\+?[\d\s\-()]{7,}$/.test(String(v || '').trim()) && String(v).replace(/\D/g, '').length >= 8
export const mailOK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim())
export const urlOK = (v: string) => /^https?:\/\/\S+\.\S+/i.test(v || '')

/** A handle, a number or a link, as the link it opens. A local WhatsApp
 *  number borrows the country code of the business's own phone. */
export function socialURL(net: SocialNet, raw: string, phone?: string): string {
  const v = String(raw || '').trim()
  if (!v) return ''
  if (net === 'whatsapp') {
    if (/^https?:\/\//i.test(v)) return v
    let d = v.replace(/[^\d+]/g, '')
    if (d.startsWith('+')) d = d.slice(1)
    else if (d.startsWith('00')) d = d.slice(2)
    else if (d.startsWith('0')) {
      const cc = (String(phone || '').match(/^\s*\+(\d{1,3})/) || [])[1]
      if (cc) d = cc + d.slice(1)
    }
    d = d.replace(/\D/g, '')
    return d.length >= 8 ? `https://wa.me/${d}` : ''
  }
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v) && !v.startsWith('@')) return 'https://' + v
  const h = v.replace(/^@/, '').replace(/\s+/g, '')
  const base: Record<SocialNet, string> = {
    instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', tiktok: 'https://tiktok.com/@',
    youtube: 'https://youtube.com/@', website: 'https://', snapchat: 'https://snapchat.com/add/', x: 'https://x.com/', whatsapp: '',
  }
  return base[net] + h
}

/** The currency the site's prices already use. */
export function currencyOf(content: any): string {
  const cnt: Record<string, number> = {}
  const look = (o: any) => {
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o)) { o.forEach(look); return }
    for (const [k, v] of Object.entries(o)) {
      if (k === 'price' && typeof v === 'string') {
        const m = v.match(/^\s*([^\d\s.,]+)/) || v.match(/([^\d\s.,]+)\s*$/)
        if (m) cnt[m[1]] = (cnt[m[1]] || 0) + 1
      } else look(v)
    }
  }
  look(content)
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || '$'
}

/* ── what changed since the last publish ───────────────────────────────── */
export type Change = { panel: string; label: string; ic?: string; icon?: EditorPanel['icon']; what: string }
export function changes(c: EditorConfig, pub: Doc, cur: Doc, fontName: (id: string) => string): Change[] {
  const out: Change[] = []
  const ph = new Set<string>(pub.content?.hidden_sections || []), ch = new Set<string>(cur.content?.hidden_sections || [])
  for (const p of allPanels(c)) {
    const roots = panelRoots(p)
    const a = JSON.stringify(roots.map((r) => pub.content?.[r])) + JSON.stringify(pub.sectionStyles[p.id] || {})
    const b = JSON.stringify(roots.map((r) => cur.content?.[r])) + JSON.stringify(cur.sectionStyles[p.id] || {})
    const vis = ph.has(p.id) !== ch.has(p.id)
    if (a !== b || vis) out.push({ panel: p.id, label: p.label, ic: p.ic, icon: p.icon, what: vis ? (ch.has(p.id) ? 'أُخفي' : 'أُظهر') : 'عُدّل' })
  }
  if (pub.presetId !== cur.presetId || JSON.stringify(pub.colorOverrides) !== JSON.stringify(cur.colorOverrides))
    out.push({ panel: '__colors', label: 'الألوان', ic: 'palette', what: 'تغيّرت' })
  if (pub.typographyPreset !== cur.typographyPreset)
    out.push({ panel: '__fonts', label: 'الخط', ic: 'type', what: fontName(cur.typographyPreset) })
  return out
}

/* ── the site check ────────────────────────────────────────────────────── */
export type Check = { lvl: 'warn' | 'tip'; t: string; d: string; panel: string; path: string | null }

const has = (content: any, p: string) => { const v = gp(content, p); return v != null && String(v).trim() !== '' }
const needText = (need: any, label: string, n: number) =>
  typeof need === 'object' && need ? (typeof need.t === 'function' ? need.t(n) : need.t) : `«${label}» فارغ`

export function runChecks(c: EditorConfig, d: Doc): Check[] {
  const o: Check[] = []
  const content = d.content
  const hidden = new Set<string>(content?.hidden_sections || [])
  const phone = c.phonePath ? String(gp(content, c.phonePath) || '') : ''
  type Agg = Map<string, { n: number; first: string; label: string; need: any; title: string }>
  for (const p of allPanels(c)) {
    if (hidden.has(p.id)) continue
    // Inside a list, the same empty field on many items is one note with a count.
    const go = (fields: EditorFieldDef[], base: string, list: { agg: Agg; title: string } | null) => {
      for (const f of fields) {
        if (!hasPath(f)) continue
        const meta = f as any
        if (meta.when && !meta.when(content)) continue
        const path = join(base, f.path)
        if (f.type === 'array' || f.type === 'strings') {
          const agg: Agg = new Map()
          ;(gp(content, path) || []).forEach((it: any, i: number) =>
            go(itemFields(f), `${path}.${i}.`, { agg, title: itemTitle(f, it, i) }))
          for (const [, x] of agg) {
            const obj = typeof x.need === 'object' && x.need
            const t = obj ? needText(x.need, x.label, x.n)
              : x.n === 1 ? `«${x.title}» بلا «${x.label}»` : `${x.n} عناصر بلا «${x.label}»`
            o.push({ lvl: 'warn', t, d: obj ? x.need.d || '' : '', panel: p.id, path: x.first })
          }
          continue
        }
        const v = String(gp(content, path) ?? '').trim()
        if (meta.need && !v) {
          if (list) {
            const cur = list.agg.get(f.path)
            if (cur) cur.n++
            else list.agg.set(f.path, { n: 1, first: path, label: labelOf(f), need: meta.need, title: list.title })
            continue
          }
          o.push({ lvl: 'warn', t: needText(meta.need, labelOf(f), 1), d: typeof meta.need === 'object' ? meta.need.d || '' : '', panel: p.id, path })
          continue
        }
        if (v && f.type === 'tel' && !telOK(v)) o.push({ lvl: 'warn', t: `«${labelOf(f)}» غير واضح`, d: 'اكتبه مع رمز الدولة، مثل +966 11 555 0140.', panel: p.id, path })
        if (v && f.type === 'email' && !mailOK(v)) o.push({ lvl: 'warn', t: 'البريد الإلكتروني غير صحيح', d: '', panel: p.id, path })
        if (v && meta.cut && meta.max && len(v) > meta.max) o.push({ lvl: 'warn', t: `«${labelOf(f)}» طويل (${len(v)} حرفًا)`, d: `يظهر مقطوعًا بعد ${meta.max} حرفًا تقريبًا.`, panel: p.id, path })
        else if (v && meta.min && len(v) < meta.min) o.push({ lvl: 'tip', t: `«${labelOf(f)}» قصير`, d: 'جملتان عن عملك ومكانك تكفيان.', panel: p.id, path })
        if (!v && meta.tip) o.push({ lvl: 'tip', t: meta.tip.t, d: meta.tip.d || '', panel: p.id, path })
        if (f.type === 'social' && f.net === 'whatsapp' && v && !socialURL('whatsapp', v, phone)) o.push({ lvl: 'warn', t: 'رقم واتساب غير مكتمل', d: 'اكتبه مع رمز الدولة.', panel: p.id, path })
      }
    }
    go(p.fields, '', null)
  }
  const col = colorsOf(c, d)
  if (col.text && col.background) {
    const r1 = contrast(col.text, col.background)
    if (r1 < 4.5) o.push({ lvl: 'warn', t: 'النص صعب القراءة على الخلفية', d: `التباين ${r1.toFixed(1)} من 21، والمطلوب 4.5 على الأقل.`, panel: '__colors', path: null })
    if (col.muted) {
      const r2 = contrast(col.muted, col.background)
      if (r2 < 3) o.push({ lvl: 'warn', t: 'النص الثانوي باهت', d: `التباين ${r2.toFixed(1)}. الأوصاف والملاحظات تصعب قراءتها.`, panel: '__colors', path: null })
    }
    if (col.accent) {
      const r3 = contrast(col.accent, col.background)
      if (r3 < 2.2) o.push({ lvl: 'warn', t: 'اللون المميز لا يظهر على الخلفية', d: 'الأزرار والأسعار تختفي تقريبًا.', panel: '__colors', path: null })
    }
  }
  return o
}
export { has as hasValue }
