/**
 * Shared editor types. The schema-driven editor (components/editor/
 * ThemeEditor.tsx) consumes these to render forms for any theme.
 */

import type { LucideIcon } from 'lucide-react'

/* ────────────────────────────────────────────────────────────────────── *
 * Field definitions                                                      *
 * ────────────────────────────────────────────────────────────────────── */

/**
 * What the v6 editor (components/editor/v6) reads beside a field's kind. All
 * optional: a field without them still edits, it just says less.
 *   hint    the line under the field
 *   max     a character count shown beside the label (and a check when `cut`)
 *   min     too short is a suggestion in the site check
 *   need    empty is a note in the site check — true, or the words to show
 *   tip     empty is a suggestion in the site check (the words to show)
 *   cut     longer than max is a note in the site check (Google cuts it)
 *   suggest the field offers «اقترح صياغة»
 *   when    the field shows only while this holds
 */
export type FieldNeed = boolean | { t: string | ((n: number) => string); d?: string }
export type FieldMeta = {
  hint?: string
  max?: number
  min?: number
  need?: FieldNeed
  tip?: { t: string; d?: string }
  cut?: boolean
  suggest?: boolean
  when?: (content: any) => boolean
}

export type SocialNet = 'instagram' | 'whatsapp' | 'tiktok' | 'facebook' | 'youtube' | 'website' | 'snapchat' | 'x'

export type EditorFieldDef =
  | ({ type: 'text';      path: string; label: string; placeholder?: string } & FieldMeta)
  /** `multi` keeps line breaks (a headline set on two lines). */
  | ({ type: 'textarea';  path: string; label: string; rows?: number; placeholder?: string; multi?: boolean } & FieldMeta)
  /** `optional` offers «إزالة»; `round` draws a portrait circle. */
  | ({ type: 'image';     path: string; label: string; optional?: boolean; round?: boolean } & FieldMeta)
  | ({ type: 'number';    path: string; label: string; min?: number; max?: number; step?: number } & Omit<FieldMeta, 'min' | 'max'>)
  | { type: 'note';      content: string; tone?: 'info' | 'link'; go?: string }
  /** A small heading between a section's fields. */
  | { type: 'group';     label: string }
  /** A price: the owner types the number, the currency the site already uses is added. */
  | ({ type: 'price';    path: string; label: string } & FieldMeta)
  /** Free text with a row of ready answers under it. */
  | ({ type: 'badge';    path: string; label: string; options: string[] } & FieldMeta)
  | ({ type: 'tel';      path: string; label: string; placeholder?: string; placeholderFrom?: string } & FieldMeta)
  | ({ type: 'email';    path: string; label: string } & FieldMeta)
  | ({ type: 'url';      path: string; label: string; placeholder?: string } & FieldMeta)
  /** A handle, a number or a link; it is stored as the link it opens. */
  | ({ type: 'social';   path: string; label: string; net: SocialNet; placeholder?: string } & FieldMeta)
  | { type: 'stars';     path: string; label: string }
  /** 0–5 in tenths, with − and + beside it. */
  | { type: 'rating';    path: string; label: string; hint?: string }
  /** The week: one row a day, open or closed, from and to. */
  | { type: 'hours';     path: string }
  /** How the site reads in Google, drawn from seoTitle/seoDescription paths. */
  | { type: 'snippet';   title: string; description: string; name: string }
  /** One of a few fixed values, shown as a row of chips. An unset value shows `fallback` as chosen.
   *  `when` hides the field while it has nothing to choose between. `hints` is
   *  the line under it for each value. */
  | { type: 'choice';    path: string; label: string; options: { value: string; label: string }[]; fallback: string; hint?: string; hints?: Record<string, string>; when?: (content: any) => boolean }
  /** On or off. Unset reads as `fallback`. */
  | { type: 'toggle';    path: string; label: string; fallback: boolean; hint?: string }
  /** The owner's logo from the dashboard SEO page, shown with a link there to add or change it. */
  | { type: 'logo' }
  /** A card that says where the site's reviews are managed, with a link to the dashboard's Reviews page. */
  | { type: 'reviews';   path: string }
  | {
      type: 'strings'
      path: string
      label: string
      placeholder?: string
      addLabel?: string
    }
  | {
      // Array of objects — each item shows as a Collapsible card with its own
      // sub-fields. `itemTitle` picks which sub-field to show in the card title.
      type: 'array'
      path: string
      label: string
      itemLabel: string                // shown as the add button label
      itemTitle?: string               // dot path to title field inside item
      itemFields: EditorFieldDef[]
      makeItem: () => any              // factory for a fresh item
      /** The add button's object form, when it differs («أضف طبقًا»). */
      itemAcc?: string
      /** The second line of a row: a field of the item. */
      itemSub?: string
      /** The row's picture: an image field of the item. */
      itemThumb?: string
      /** The second line counts this list inside the item instead. */
      itemCount?: { path: string; one: string; two: string; few: string; many: string }
      /** The site shows only the first N. */
      show?: number
    }

export type EditorPanel = {
  id: string                           // selection key
  label: string
  icon?: LucideIcon
  /** The v6 editor's icon (a name in components/editor/v6/sprite.ts). */
  ic?: string
  /** The row's second line when the section has nothing better to say. */
  desc?: string
  /** The row's second line, from the content. */
  summary?: (content: any) => string
  /** The owner can hide it from visitors (content.hidden_sections). */
  hideable?: boolean
  /** The section has nothing in it, so the site leaves it out. */
  empty?: (content: any) => boolean
  /** Optional page id for themes whose preview supports view switching. */
  page?: string
  /** Some sections render on more than one page (e.g. a philosophy block shown
   *  on both Home and About). List every view the section appears in so the
   *  left rail shows it on each, and click-to-edit doesn't force a page switch
   *  for a section that's already visible. Takes precedence over `page`. */
  pages?: string[]
  fields: EditorFieldDef[]
}

/** Which views a panel should appear in. A panel with neither `page` nor
 *  `pages` is global to every view (e.g. Brand). */
export function panelViews(panel: EditorPanel): string[] | null {
  if (panel.pages && panel.pages.length) return panel.pages
  if (panel.page) return [panel.page]
  return null // null ⇒ visible on every page
}

/** Is this panel shown in the given view? */
export function panelInView(panel: EditorPanel, view: string): boolean {
  const views = panelViews(panel)
  return views === null || views.includes(view)
}

export type EditorPage = {
  id: string                           // matches Preview's view ids
  label: string
  icon: LucideIcon
  /** The v6 editor's icon (a name in components/editor/v6/sprite.ts). */
  ic?: string
}

export type EditorConfig = {
  /** Key inside content.<key> where this theme's content lives (e.g. 'atlas'). */
  contentKey: string
  /** Pretty name of the theme (shown in the top bar). */
  themeName: string
  /** Pages — leave empty for single-page themes. */
  pages?: EditorPage[]
  /** Per-section editor panels. */
  panels: EditorPanel[]
  /** Global panels (typography, palette, footer, social, etc.). */
  globalPanels: EditorPanel[]
  /** Color preset list to show in the palette picker. */
  colorPresets: Array<{
    id: string
    name: string
    vibe: string
    colors: Record<string, string>
    heading_font?: string
  }>
  /** Editable color tokens for this theme. */
  colorTokens: Array<{ key: string; label: string }>
  /** Default style preset id. */
  defaultPresetId: string
  /** Default brand name on save fallback. */
  brandNamePath?: string
  /** What one colour token does, under its name in the design tab. */
  colorHints?: Record<string, string>
  /** Global panels pinned under the page's sections («في كل الصفحات»).
   *  The rest are only in the «الموقع» tab. Default: the first global panel. */
  pinned?: string[]
  /** The phone number a local WhatsApp number borrows its country code from. */
  phonePath?: string
}

/* ────────────────────────────────────────────────────────────────────── *
 * Path helpers — schema fields point at deep paths like                  *
 *   "hero.headline" or "features.items.0.title".                         *
 * ────────────────────────────────────────────────────────────────────── */

export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export function setPath<T>(obj: T, path: string, value: any): T {
  const parts = path.split('.')
  const root = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) }
  let cur: any = root
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const next = cur[key]
    cur[key] = Array.isArray(next) ? [...next] : { ...(next || {}) }
    cur = cur[key]
  }
  cur[parts[parts.length - 1]] = value
  return root
}

/* ────────────────────────────────────────────────────────────────────── *
 * Style overrides (wrapper-level, shared by every theme)                 *
 * ────────────────────────────────────────────────────────────────────── */

export type ColorOverrides = Record<string, string>

export type WrapperStyleState = {
  style_preset?: string
  typography_preset?: string
  color_overrides?: ColorOverrides
  section_styles?: SectionStyles
}

/* ────────────────────────────────────────────────────────────────────── *
 * Per-section style overrides — text scale + alignment.                  *
 *                                                                        *
 * Themes opt into these by putting `data-section="<panelId>"` on each    *
 * top-level section element. The editor injects a scoped <style> block   *
 * with rules like:                                                       *
 *   [data-section="hero"] { font-size: 1.15em; text-align: center; }     *
 * so themes that haven't been retrofitted simply don't apply them.       *
 * ────────────────────────────────────────────────────────────────────── */

export type SectionTextAlign = 'left' | 'center' | 'right'

export type SectionStyle = {
  /** 0.85 / 1.0 / 1.15 / 1.3 — applied as `font-size: <scale>em` on the section root. */
  text_scale?: number
  /** Default body text alignment for the section. */
  text_align?: SectionTextAlign
}

export type SectionStyles = Record<string, SectionStyle>

export const SECTION_TEXT_SCALES: Array<{ id: string; label: string; value: number }> = [
  { id: 'sm', label: 'S',  value: 0.85 },
  { id: 'md', label: 'M',  value: 1.0  },
  { id: 'lg', label: 'L',  value: 1.15 },
  { id: 'xl', label: 'XL', value: 1.3  },
]

export function sectionStylesToCss(styles?: SectionStyles): string {
  if (!styles) return ''
  const rules: string[] = []
  // Targets every text-bearing tag inside a section. We use a `:where()`
  // pseudo-class to keep specificity flat; the !important still wins.
  const TEXT_SELECTOR =
    ':where(h1,h2,h3,h4,h5,h6,p,span,a,li,blockquote,strong,em,b,i,small,label,button)'

  for (const [panelId, s] of Object.entries(styles)) {
    if (!panelId) continue
    const sel = `[data-section="${panelId.replace(/"/g, '\\"')}"]`

    // Text scale: use CSS `zoom` on the section root. Unlike font-size:em,
    // zoom scales the absolute Tailwind text-{size} classes (rem-based),
    // so the user actually sees the size change. Supported in every modern
    // browser including Safari 12+ and Firefox 126+.
    if (typeof s.text_scale === 'number' && s.text_scale > 0 && s.text_scale !== 1) {
      rules.push(`${sel}{zoom:${s.text_scale}}`)
    }

    // Alignment: setting text-align on the section root alone gets overridden
    // by descendant utilities (text-left, text-center, mx-auto-on-flex, etc.).
    // Apply it with !important on every text-bearing descendant so the user's
    // choice actually takes effect.
    if (s.text_align) {
      rules.push(
        `${sel},${sel} ${TEXT_SELECTOR}{text-align:${s.text_align} !important}`
      )
    }
  }
  return rules.join('\n')
}
