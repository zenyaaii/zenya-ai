/**
 * The Beynoun design system as the QA agent measures it.
 *
 * One source: the dashboard's analytics boxes (components/app/v6/v6.css), the
 * design Anas points at when he says «المربعات الحلوة». The public site
 * («ليل», components/zenya/redesign/base.tsx) already paints with the same
 * palette. Nothing in this file is a new opinion: every number is read off
 * those two stylesheets, so when they change, change this with them.
 *
 * Four shapes carry information, and nothing else may:
 *   card    a section box            radius 24 (22 under 700px), padding 20 (16)
 *   stat    a number box             radius 20, padding 16, label · value · note
 *   meter   the «battery»            8px track, radius 9, filled from the start side
 *   ring    the «circle»             56px, 6px stroke, value in the middle
 * Every box draws its edge the same way: a 1px ring in the line colour, a
 * light top highlight, and one soft shadow. No hard border, no gradient.
 */

export const BEYNOUN_PALETTE_LIGHT = {
  bg: '#F4EFE6', bg2: '#EFE9DE', card: '#FFFDF9', card2: '#F1EBE1', card3: '#E6DED0',
  ink: '#16120D', ink2: '#3B342C', mut: '#766D62', mut2: '#9A9083', mutSite: '#5F574D', mut2Site: '#8A8074',
  acc: '#E2532A', accInk: '#C2421D', accInkSite: '#B23A17',
  ok: '#2F8F5B', warn: '#A86C08', bad: '#C0362C', blue: '#2B6CA8',
  white: '#FFFFFF',
} as const

export const BEYNOUN_PALETTE_DARK = {
  bg: '#0F0D0A', bg2: '#13110E', card: '#1A1713', card2: '#24201A', card3: '#2E2922',
  ink: '#F4EFE6', ink2: '#DAD1C4', mut: '#A39A8D', mut2: '#7E766B',
  acc: '#E2532A', accInk: '#F07A52', ok: '#4CB37A', warn: '#E0A43A', bad: '#E36A5F', blue: '#6FA8DD',
  dock: '#16120D',
} as const

/** The house colours: the light and dark sets together (a page may show both, e.g. the dark side menu). */
export const BEYNOUN_PALETTE: Record<string, string> = Object.fromEntries([
  ...Object.entries(BEYNOUN_PALETTE_LIGHT).map(([k, v]) => [`light.${k}`, v]),
  ...Object.entries(BEYNOUN_PALETTE_DARK).map(([k, v]) => [`dark.${k}`, v]),
])

export type BoxKind = 'card' | 'stat' | 'tile' | 'meter' | 'ring' | 'pill' | 'button' | 'control'

export type BoxSpec = {
  kind: BoxKind
  label: string
  /** Allowed corner radii in CSS px. 999 = fully round. */
  radius: number[]
  /** Allowed inner padding in CSS px (block and inline), when it applies. */
  padding?: number[]
  /** Size, when the shape has a fixed one. */
  size?: { w?: number[]; h?: number[] }
  edge: 'ring' | 'none'
  note: string
}

export const BOX_SYSTEM: Record<BoxKind, BoxSpec> = {
  card: { kind: 'card', label: 'مربع', radius: [24, 22, 28], padding: [20, 16, 24, 0], edge: 'ring', note: 'v6 .card — بطاقة القسم: حافة 1px بلون الخط + ظل ناعم واحد' },
  stat: { kind: 'stat', label: 'مربع رقم', radius: [20], padding: [16], edge: 'ring', note: 'v6 .stat — العنوان فوق، الرقم كبير، السطر الصغير تحت' },
  tile: { kind: 'tile', label: 'مربع أيقونة', radius: [13, 15, 16], size: { w: [40, 48, 52], h: [40, 48, 52] }, edge: 'none', note: 'v6 .tile — خلفية ناعمة بلون الحالة' },
  meter: { kind: 'meter', label: 'بطارية', radius: [9], size: { h: [8] }, edge: 'none', note: 'v6 .meter — مسار 8px يمتلئ من بداية السطر' },
  ring: { kind: 'ring', label: 'دائرة', radius: [999], size: { w: [56], h: [56] }, edge: 'none', note: 'v6 .ring — حلقة 6px والقيمة في وسطها' },
  pill: { kind: 'pill', label: 'شارة', radius: [999], size: { h: [26] }, edge: 'none', note: 'v6 .pill' },
  button: { kind: 'button', label: 'زر', radius: [999], size: { h: [44, 48, 40] }, edge: 'none', note: 'v6 .btn — كبسولة' },
  control: { kind: 'control', label: 'حقل', radius: [14, 16], size: { h: [48, 44] }, edge: 'none', note: 'v6 .inp — حقل إدخال' },
}

/** Radii a container box may have and still be one of the system's boxes. */
export const CONTAINER_RADII = [28, 24, 22, 20, 18, 16]

/**
 * beynoun.com's own boxes as they stand on 2026-11-27. Anas looked at the
 * sample that moved them onto the dashboard's box system and decided to keep
 * them as they are, so these exact measurements are accepted: a box is only
 * reported when its class is new, or when it no longer measures what it did
 * that day (a different radius, a new border). Keyed by the last step of the
 * box's selector; the values are the problems boxProblems() gave it then.
 */
export const ACCEPTED_OWN_BOXES: Record<string, string[]> = {
  'article.s1-card.glass': ['زاوية 30px (النظام: 24 للمربع، 20 لمربع الرقم)', 'حد صلب غامق (النظام: خط شفاف بلون الحبر 8%)'],
  'article.s11-dc.glass': ['زاوية 26px (النظام: 24 للمربع، 20 لمربع الرقم)', 'حد صلب غامق (النظام: خط شفاف بلون الحبر 8%)'],
  'article.s11-tile.glass': ['زاوية 26px (النظام: 24 للمربع، 20 لمربع الرقم)'],
  'div.s1-fbase': ['قسم مفصول بخط بدل أن يكون في مربع'],
  'div.s11-band': ['زاوية 36px (النظام: 24 للمربع، 20 لمربع الرقم)'],
  'div.s11-floor.glass': ['زاوية 32px (النظام: 24 للمربع، 20 لمربع الرقم)'],
  'li.zx-fitem': ['قسم مفصول بخط بدل أن يكون في مربع'],
  'li.zx-pitem': ['قسم مفصول بخط بدل أن يكون في مربع'],
  'section.zx-band': ['زاوية 32px (النظام: 24 للمربع، 20 لمربع الرقم)'],
  'section.zx-close': ['زاوية 32px (النظام: 24 للمربع، 20 لمربع الرقم)'],
  'section.zx-mirror': ['قسم مفصول بخط بدل أن يكون في مربع'],
  'span.b': ['حد صلب غامق (النظام: خط شفاف بلون الحبر 8%)'],
}

/** The night's lights and glows that were on the same pages that day, accepted with the boxes. */
export const ACCEPTED_OWN_GRADIENTS = ['div.dv-base', 'i.b1', 'i.b2', 'i.b3', 'i.g1', 'i.g2', 'i.g3', 'i.o1', 'i.o2', 'i.o3', 'span.lab']

const lastStep = (sel: string) => sel.split(' > ').pop() || sel

/** True when a box on beynoun.com is one of the accepted ones, measuring exactly what it did. */
export function acceptedOwnBox(sel: string, problems: string[]): boolean {
  const ok = ACCEPTED_OWN_BOXES[lastStep(sel)]
  return !!ok && problems.every((p) => ok.includes(p))
}

/** True when a gradient on beynoun.com is one of the accepted lights. */
export function acceptedOwnGradient(sel: string): boolean {
  return ACCEPTED_OWN_GRADIENTS.includes(lastStep(sel))
}

/**
 * Classify a measured box. A container (bigger than a control) must be a card
 * or a stat: one of the system radii, the 1px ring edge, no hard border, no
 * gradient. Returns what is wrong in Arabic, or [] when it conforms.
 */
export function boxProblems(b: {
  w: number; h: number; radius: number; borderWidth: number; borderAlpha: number;
  ringShadow: boolean; gradient: boolean; dashed: boolean; borderSides?: number; edgeSides?: number; filled?: boolean
}): string[] {
  const out: string[] = []
  const near = (v: number, set: number[], tol = 1.5) => set.some((s) => Math.abs(s - v) <= tol)
  // a rule on one side over no ground of its own is a divider: the section is not in a box at all
  if (b.filled === false && b.edgeSides === 1 && !b.ringShadow) return ['قسم مفصول بخط بدل أن يكون في مربع']
  // a capsule (the header pill, a chip, a search field, a dock) is the system's pill shape, not a box;
  // its edge is how it shows it is selected
  const capsule = b.h <= 80 && b.radius >= b.h / 2 - 1
  if (capsule) return b.gradient ? ['خلفية متدرجة (النظام: لون واحد)'] : []
  if (!near(b.radius, CONTAINER_RADII)) out.push(`زاوية ${Math.round(b.radius)}px (النظام: 24 للمربع، 20 لمربع الرقم)`)
  if (b.gradient) out.push('خلفية متدرجة (النظام: لون واحد)')
  if (b.dashed) out.push('حد متقطع')
  // a thick edge on one side only is the status stripe v6 draws on a booking slot, not a frame
  if (b.borderWidth > 1.5 && (b.borderSides ?? 4) >= 2) out.push(`حد سميك ${b.borderWidth}px (النظام: خط 1px)`)
  if (b.borderWidth >= 1 && b.borderAlpha > 0.35) out.push('حد صلب غامق (النظام: خط شفاف بلون الحبر 8%)')
  return out
}
