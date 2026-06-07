/**
 * Shared editor types. The schema-driven editor (components/editor/
 * ThemeEditor.tsx) consumes these to render forms for any theme.
 */

import type { LucideIcon } from 'lucide-react'

/* ────────────────────────────────────────────────────────────────────── *
 * Field definitions                                                      *
 * ────────────────────────────────────────────────────────────────────── */

export type EditorFieldDef =
  | { type: 'text';      path: string; label: string; placeholder?: string }
  | { type: 'textarea';  path: string; label: string; rows?: number; placeholder?: string }
  | { type: 'image';     path: string; label: string; hint?: string }
  | { type: 'number';    path: string; label: string; min?: number; max?: number; step?: number }
  | { type: 'note';      content: string }
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
    }

export type EditorPanel = {
  id: string                           // selection key
  label: string
  icon?: LucideIcon
  /** Optional page id for themes whose preview supports view switching. */
  page?: string
  fields: EditorFieldDef[]
}

export type EditorPage = {
  id: string                           // matches Preview's view ids
  label: string
  icon: LucideIcon
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
