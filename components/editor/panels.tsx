'use client'

/**
 * Shared editor panels + field renderers.
 *
 * These presentational pieces are used by BOTH the desktop shell
 * (ThemeEditor.tsx) and the compact shell (MobileEditor.tsx). They were
 * extracted out of ThemeEditor so the two layouts render identical fields
 * from the same code — the compact editor is a different *frame* around the
 * exact same panels, not a fork.
 *
 * Styled by editor-style.ts (.ze-). A pressed or chosen control on this
 * surface is filled or ringed in OBSIDIAN; the violet ring belongs to the
 * section being edited and never appears on a control.
 */

import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import {
  RotateCcw, AlignLeft, AlignCenter, AlignRight, Check, Undo2, Redo2,
} from 'lucide-react'
import {
  FieldText, FieldTextArea, FieldNumber, FieldImage, SectionLabel,
  SmallNote, Collapsible, AddRowButton, StringList, ColorRow, MoodChip,
} from './EditorFields'
import { useNotify } from '@/components/ui/Notify'
import {
  getPath, setPath, SECTION_TEXT_SCALES,
  type EditorConfig, type EditorFieldDef, type SectionStyle, type SectionTextAlign,
} from '@/utils/theme-editor-types'
import {
  TYPOGRAPHY_PRESETS, TYPOGRAPHY_MOODS,
} from '@/utils/theme-editor-typography'

export type Status = 'idle' | 'saving' | 'saved' | 'error'

/* ────────────────────────────────────────────────────────────────────── *
 * Field renderer                                                          *
 * ────────────────────────────────────────────────────────────────────── */

export function FieldsRenderer({
  fields, content, patchPath, panelLabel,
}: { fields: EditorFieldDef[]; content: any; patchPath: (p: string, v: any) => void; panelLabel?: string }) {
  return (
    <>
      {fields.map((f, i) => (
        <RenderField key={i} field={f} content={content} patchPath={patchPath} panelLabel={panelLabel} />
      ))}
    </>
  )
}

function RenderField({
  field, content, patchPath, panelLabel,
}: { field: EditorFieldDef; content: any; patchPath: (p: string, v: any) => void; panelLabel?: string }) {
  const t = useT()
  const { confirm } = useNotify()
  if (field.type === 'note') {
    return <SmallNote>{field.content}</SmallNote>
  }
  if (field.type === 'text') {
    return (
      <FieldText
        label={field.label}
        value={getPath(content, field.path) ?? ''}
        onChange={(v) => patchPath(field.path, v)}
        placeholder={field.placeholder}
        panelLabel={panelLabel}
      />
    )
  }
  if (field.type === 'textarea') {
    return (
      <FieldTextArea
        label={field.label}
        rows={field.rows}
        value={getPath(content, field.path) ?? ''}
        onChange={(v) => patchPath(field.path, v)}
        placeholder={field.placeholder}
        panelLabel={panelLabel}
      />
    )
  }
  if (field.type === 'number') {
    return (
      <FieldNumber
        label={field.label}
        value={Number(getPath(content, field.path)) || 0}
        onChange={(v) => patchPath(field.path, v)}
        min={field.min} max={field.max} step={field.step}
      />
    )
  }
  if (field.type === 'image') {
    return (
      <FieldImage
        label={field.label}
        value={getPath(content, field.path) ?? ''}
        onChange={(v) => patchPath(field.path, v)}
        hint={field.hint}
      />
    )
  }
  if (field.type === 'strings') {
    const value = (getPath(content, field.path) as string[]) || []
    return (
      <StringList
        label={field.label}
        value={value}
        onChange={(v) => patchPath(field.path, v)}
        placeholder={field.placeholder}
        addLabel={field.addLabel}
      />
    )
  }
  if (field.type === 'array') {
    // Capture narrowed field so inner closures keep the type.
    const f = field
    const arr: any[] = (getPath(content, f.path) as any[]) || []
    const update = (idx: number, item: any) => {
      patchPath(f.path, arr.map((it, i) => (i === idx ? item : it)))
    }
    const remove = (idx: number) => {
      patchPath(f.path, arr.filter((_, i) => i !== idx))
    }
    const add = () => {
      patchPath(f.path, [...arr, f.makeItem()])
    }
    return (
      <div className="ze-field">
        <SectionLabel>{f.label}</SectionLabel>
        <div className="ze-items">
          {arr.map((item, i) => {
            const title =
              (f.itemTitle ? getPath(item, f.itemTitle) : '') || `${f.itemLabel} ${i + 1}`
            return (
              <Collapsible
                key={i}
                title={title}
                defaultOpen={arr.length === 1}
                onRemove={async () => {
                  const { confirmed } = await confirm({
                    title: t.editor.removeConfirm.replace('{title}', title),
                    confirmText: t.editor.remove,
                    tone: 'danger',
                  })
                  if (confirmed) remove(i)
                }}
              >
                <FieldsRenderer
                  fields={f.itemFields}
                  content={item}
                  patchPath={(p, v) => update(i, setPath(item, p, v))}
                  panelLabel={panelLabel}
                />
              </Collapsible>
            )
          })}
          <AddRowButton label={t.editor.addItemNamed.replace('{item}', f.itemLabel)} onClick={add} />
        </div>
      </div>
    )
  }
  return null
}

/* ── Style / colors panel ────────────────────────────────────────────── */

export function ColorsPanel({
  presetId, setPresetId, colorOverrides, setOverride, resetOverrides, config,
}: {
  presetId: string
  setPresetId: (p: string) => void
  colorOverrides: Record<string, string>
  setOverride: (k: string, v: string | undefined) => void
  resetOverrides: () => void
  config: EditorConfig
}) {
  const t = useT()
  const basePreset = config.colorPresets.find((p) => p.id === presetId) || config.colorPresets[0]
  const merged: Record<string, string> = { ...basePreset.colors, ...colorOverrides }
  return (
    <>
      <SmallNote>{t.editor.paletteHelp}</SmallNote>
      {/* Each card is painted in its own preset, so the card IS the sample.
          Name and vibe are both set in the preset's text colour on its own
          background: the accent is shown as a dot, never as small type on a
          ground it was not chosen to be read against. */}
      <div className="ze-presets">
        {config.colorPresets.map((p) => {
          const selected = presetId === p.id
          const cols = p.colors as any
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              aria-pressed={selected}
              data-preset={p.id}
              className="ze-preset"
              style={{ background: cols.background || '#fff', color: cols.text || '#000' }}
            >
              <span className="ze-preset-dots" aria-hidden>
                <span style={{ background: cols.primary }} />
                <span style={{ background: cols.accent }} />
                <span style={{ background: cols.surface }} />
              </span>
              <span className="ze-preset-n" style={{ fontFamily: p.heading_font }}>{p.name}</span>
              <span className="ze-preset-v">{p.vibe}</span>
              {selected && (
                <span className="ze-check">
                  <Check strokeWidth={3} aria-hidden />
                  <span className="ze-a11y">{t.editor.active}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="ze-field">
        <SectionLabel>{t.editor.customColors}</SectionLabel>
        <div className="ze-colors">
          {config.colorTokens.map((tok) => (
            <ColorRow
              key={tok.key}
              label={tok.label}
              value={merged[tok.key] || ''}
              overridden={colorOverrides[tok.key] != null}
              onChange={(v) => setOverride(tok.key, v)}
              onReset={() => setOverride(tok.key, undefined)}
            />
          ))}
        </div>
        {Object.keys(colorOverrides).length > 0 && (
          <div>
            <button type="button" onClick={resetOverrides} className="ze-link">
              <RotateCcw aria-hidden /> {t.editor.resetAllColors}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Typography panel ────────────────────────────────────────────────── */

export function TypographyPanel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT()
  const [mood, setMood] = useState<'all' | typeof TYPOGRAPHY_MOODS[number]>('all')
  const presets = mood === 'all' ? TYPOGRAPHY_PRESETS : TYPOGRAPHY_PRESETS.filter((p) => p.mood === mood)
  return (
    <>
      <SmallNote>{t.editor.fontsHelp}</SmallNote>
      <div className="ze-chips" role="group">
        <MoodChip active={mood === 'all'} onClick={() => setMood('all')}>{t.editor.all}</MoodChip>
        {TYPOGRAPHY_MOODS.map((m) => (
          <MoodChip key={m} active={mood === m} onClick={() => setMood(m)}>{m}</MoodChip>
        ))}
      </div>
      <div className="ze-types">
        {presets.map((p) => {
          const selected = value === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              aria-pressed={selected}
              className="ze-type"
            >
              {/* The sample is the pair's face and weight. Its tracking is
                  left at zero: the house never tracks type in or out, and a
                  sample that did would teach the reader otherwise. */}
              <span className="ze-type-n">
                <span style={{ fontFamily: p.heading_font, fontWeight: p.heading_weight ?? 600 }}>{p.name}</span>
                <span className="ze-type-m">{p.mood}</span>
              </span>
              <span className="ze-type-v" style={{ fontFamily: p.body_font }}>{p.vibe}</span>
              {selected && (
                <span className="ze-check">
                  <Check strokeWidth={3} aria-hidden />
                  <span className="ze-a11y">{t.editor.active}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {value && (
        <div>
          <button type="button" onClick={() => onChange('')} className="ze-link">
            <RotateCcw aria-hidden /> {t.editor.usePresetFonts}
          </button>
        </div>
      )}
    </>
  )
}

/* ── Undo / redo ──────────────────────────────────────────────────────── */
export function UndoRedo({
  canUndo, canRedo, onUndo, onRedo,
}: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  const t = useT()
  // Undo points back along the reading direction, so the pair flips in RTL.
  return (
    <>
      <button type="button" onClick={onUndo} disabled={!canUndo} title={t.editor.undoTitle} aria-label={t.editor.undo} className="ze-icon">
        <Undo2 className="rtl-flip" strokeWidth={2} aria-hidden />
      </button>
      <button type="button" onClick={onRedo} disabled={!canRedo} title={t.editor.redoTitle} aria-label={t.editor.redo} className="ze-icon">
        <Redo2 className="rtl-flip" strokeWidth={2} aria-hidden />
      </button>
    </>
  )
}

/* ── Save status ──────────────────────────────────────────────────────── */

/**
 * "Saved 2 minutes ago" keeps itself current. The clock lives HERE, in the one
 * leaf that prints it, and only while it is on screen — it used to be a
 * setInterval in ThemeEditor that re-rendered the whole editor (and, through
 * the preview, the customer's whole site) every 15 seconds, forever.
 */
function SavedAgo({ at }: { at: number }) {
  const t = useT()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])
  return <>{t.editor.savedAgo.replace('{time}', relativeTime(at, now, t))}</>
}

/**
 * The save state. It lives in a fixed-width slot (.ze-status), so a change of
 * state swaps the words in place and moves nothing beside it. The dot carries
 * the state as well as the words, and role=status announces it.
 */
export function StatusPill({
  status, dirty, lastSavedAt, compact = false,
}: { status: Status; dirty: boolean; lastSavedAt: number | null; compact?: boolean }) {
  const t = useT()
  let s: string
  let text: React.ReactNode
  if (status === 'saving') { s = 'saving'; text = t.editor.saving }
  else if (status === 'saved') { s = 'saved'; text = t.editor.saved }
  else if (status === 'error') { s = 'error'; text = t.editor.saveFailed }
  else if (dirty) { s = 'dirty'; text = t.editor.unsaved }
  else if (lastSavedAt) { s = 'idle'; text = <SavedAgo at={lastSavedAt} /> }
  else { s = 'idle'; text = t.editor.allSaved }
  return (
    <span className="ze-status" data-s={s} data-compact={compact ? '' : undefined} role="status" aria-live="polite">
      <span className="ze-status-dot" aria-hidden />
      <span className="ze-status-t">{text}</span>
    </span>
  )
}

export function relativeTime(from: number, now: number, t: Messages): string {
  const s = Math.max(0, Math.round((now - from) / 1000))
  if (s < 5) return t.editor.now
  if (s < 60) return t.editor.secondsAgo.replace('{n}', String(s))
  const m = Math.round(s / 60)
  if (m < 60) return t.editor.minutesAgo.replace('{n}', String(m))
  const h = Math.round(m / 60)
  return t.editor.hoursAgo.replace('{n}', String(h))
}

/* ── Per-section text size + alignment header ─────────────────────────── */

export function SectionStyleHeader({
  panelId, panelLabel, value, onPatch, onClear,
}: {
  panelId: string
  /** The section's name as the rails show it; the id is only a fallback. */
  panelLabel?: string
  value?: SectionStyle
  onPatch: (p: Partial<SectionStyle>) => void
  onClear: () => void
}) {
  const t = useT()
  const activeScale = value?.text_scale ?? 1
  // No explicit alignment ⇒ none highlighted (the section inherits the theme's
  // own default, which is start/right in RTL). Each button sets its literal value.
  const activeAlign: SectionTextAlign | undefined = value?.text_align
  const hasOverride = (value && (value.text_scale != null || value.text_align != null)) || false
  const alignName: Record<SectionTextAlign, string> = {
    left: t.editor.alignLeft, center: t.editor.alignCenter, right: t.editor.alignRight,
  }

  return (
    <div className="ze-card">
      <div className="ze-card-h">
        <span className="ze-card-t">{t.editor.sectionStyle}</span>
        {hasOverride && (
          <button type="button" onClick={onClear} className="ze-link" title={t.editor.resetThisSection}>
            {t.editor.reset}
          </button>
        )}
      </div>

      <div className="ze-kv">
        <span>{t.editor.size}</span>
        <div className="ze-seg" data-fill role="group" aria-label={t.editor.size}>
          {SECTION_TEXT_SCALES.map((s) => {
            const selected = Math.abs(activeScale - s.value) < 0.01
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPatch({ text_scale: s.value === 1 ? undefined : s.value })}
                aria-pressed={selected}
                className="ze-seg-b"
                title={t.editor.textSize.replace('{label}', s.label)}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="ze-kv">
        <span>{t.editor.alignment}</span>
        {/* Physical left/centre/right on purpose: these are the literal CSS
            values the section receives, so the icons must not flip in RTL. */}
        <div className="ze-seg" data-fill role="group" aria-label={t.editor.alignment} dir="ltr">
          {(
            [
              { id: 'left' as const,   Icon: AlignLeft   },
              { id: 'center' as const, Icon: AlignCenter },
              { id: 'right' as const,  Icon: AlignRight  },
            ]
          ).map(({ id, Icon }) => {
            const selected = activeAlign === id
            const label = t.editor.alignTo.replace('{id}', alignName[id])
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ text_align: activeAlign === id ? undefined : id })}
                aria-pressed={selected}
                aria-label={label}
                title={label}
                className="ze-seg-b"
                data-icon
              >
                <Icon strokeWidth={2} aria-hidden />
              </button>
            )
          })}
        </div>
      </div>

      <p className="ze-hint">
        {t.editor.appliesToSection} <strong>{panelLabel || panelId}</strong>
      </p>
    </div>
  )
}
