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
}
