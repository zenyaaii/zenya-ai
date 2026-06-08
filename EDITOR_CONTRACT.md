# Editor contract

Every brochure theme in Zenya is edited through one shared shell:
[`components/editor/ThemeEditor.tsx`](components/editor/ThemeEditor.tsx). That
shell handles loading, saving, pages, panels, click-to-edit, autosave,
Cmd+S, dirty detection, color presets, typography presets, and per-section
text scale + alignment. **Themes do not ship their own editors.**

In exchange, every theme MUST honor this contract. Drift from any of these
rules is the difference between "user has a smooth editing experience" and
"the editor feels inconsistent / buggy".

## The five rules

### 1. Content lives at `content.<themeKey>`

The theme's data blob sits one level deep inside `content`. The wrapper
keys (managed by the shared editor) sit at the top:

```ts
content = {
  business_type:     '<themeKey>',
  style_preset:      'onyx',          // wrapper-managed
  typography_preset: 'editorial',     // wrapper-managed, optional
  color_overrides:   { primary: '…' },// wrapper-managed, optional
  section_styles:    { hero: { … } }, // wrapper-managed, optional
  <themeKey>: {                       // <-- THIS is what your fields edit
    brand: { name: '…', … },
    hero:  { headline: '…', … },
    // …
  },
}
```

`contentKey` in your `EditorConfig` must match `<themeKey>`.

### 2. Ship an `EditorConfig`

Located at `utils/<theme>/editor-config.ts`. Exports a single
`EditorConfig` object describing:

- `contentKey` — the key under `content` (rule 1).
- `themeName` — pretty name shown in the editor top bar.
- `pages` — array of `{ id, label, icon }`. Omit for single-page themes.
- `panels` — section panels. Each has `id`, `label`, `icon`, optional
  `page` (to scope it to a page), and `fields[]`.
- `globalPanels` — panels that appear on every page (footer, social,
  SEO, brand-wide settings).
- `colorPresets` — the theme's palette options.
- `colorTokens` — editable color tokens (`primary`, `accent`, `text`, …).
- `defaultPresetId` — fallback palette.
- `brandNamePath` — dot path inside `content.<themeKey>` to the brand
  name (used in the top bar).

Available field types (from `utils/theme-editor-types.ts`):
`text`, `textarea`, `image`, `number`, `note`, `strings`, `array`
(arrays can nest).

### 3. Preview implements `PreviewProps`

Located at `components/theme/<theme>/<Theme>Preview.tsx`. The component's
props type must accept everything in `PreviewProps`:

```ts
type PreviewProps = {
  content: any
  presetId: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  sectionStyles?: SectionStyles
  view?: string
  onViewChange?: (v: string) => void
}
```

Themes may *ignore* `colorOverrides`/`typographyPreset`/`sectionStyles`
internally (and read them off `content.*` instead) — but the props must
be accepted so TypeScript doesn't complain when `ThemeEditor` passes
them.

### 4. Tag every section root with `data-section="<panelId>"`

So the editor's per-section overrides can apply. The `panelId` matches
the `id` of the corresponding panel in `EditorConfig.panels`.

```tsx
<section data-section="hero">…</section>
<section data-section="signature_dishes">…</section>
```

Themes that skip this still load fine — per-section size/align overrides
just silently no-op. But for full contract compliance, tag the roots.

### 5. Edit route is an 18-line stub

`app/preview/<theme>/[id]/edit/page.tsx` must be exactly this shape:

```tsx
'use client'

import { useParams } from 'next/navigation'
import ThemeEditor from '@/components/editor/ThemeEditor'
import MyThemePreview from '@/components/theme/<theme>/<Theme>Preview'
import { MY_THEME_EDITOR_CONFIG } from '@/utils/<theme>/editor-config'

export default function MyThemeEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <ThemeEditor
      themeId={params.id}
      config={MY_THEME_EDITOR_CONFIG}
      Preview={MyThemePreview as any}
      backHref={`/preview/<theme>/${params.id}`}
    />
  )
}
```

No bespoke editor code anywhere. If you find yourself wanting custom
editor UI for a theme, the right move is to extend the **shared editor**
(or the `EditorFieldDef` type) — not to fork it.

## Checklist for adding a new theme

- [ ] Generator writes `content = { business_type, style_preset, <themeKey>: { … } }`.
- [ ] `utils/<theme>/editor-config.ts` exists and exports an `EditorConfig`.
- [ ] `components/theme/<theme>/<Theme>Preview.tsx` accepts `PreviewProps`.
- [ ] Every top-level section root has `data-section="<panelId>"`.
- [ ] `app/preview/<theme>/[id]/edit/page.tsx` is the 18-line stub.
- [ ] Run the editor on a generated theme — every panel saves, click-to-edit
      jumps to the right section, color preset + typography preset apply,
      per-section size/align overrides take effect.

## Why the contract exists

Before Pass 1 (2026-06-08), restaurant had a bespoke 1,783-line editor
while the other six themes used the shared shell. Two different editing
experiences, doubled maintenance, drift on every Stripe-style follow-up
feature. Pass 1 collapsed restaurant onto the shared editor; this
contract is the rule that prevents the next theme from re-introducing the
divergence.

If you find a real reason the contract isn't enough, **change the
contract** (extend `EditorConfig` / `EditorFieldDef` / `ThemeEditor`).
Don't fork an editor.
