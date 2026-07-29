'use client'

/**
 * Shared editor panels + field renderers.
 *
 * These presentational pieces are used by BOTH the desktop shell
 * (ThemeEditor.tsx) and the mobile shell (MobileEditor.tsx). They were
 * extracted out of ThemeEditor so the two layouts render identical fields
 * from the same code — the mobile editor is a different *frame* around the
 * exact same panels, not a fork.
 */

import { useState } from 'react'
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
      <div>
        <SectionLabel>{f.label}</SectionLabel>
        <div className="mt-1.5 space-y-2">
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
                    title: `إزالة «${title}»؟`,
                    confirmText: 'إزالة',
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
          <AddRowButton label={`+ إضافة ${f.itemLabel}`} onClick={add} />
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
  const basePreset = config.colorPresets.find((p) => p.id === presetId) || config.colorPresets[0]
  const merged: Record<string, string> = { ...basePreset.colors, ...colorOverrides }
  return (
    <>
      <SmallNote>
        اختر إحدى لوحات الألوان المقترحة، ثم خصّص أي لون. تُعيد «إعادة التعيين» إلى النمط الجاهز.
      </SmallNote>
      <div className="grid grid-cols-2 gap-2">
        {config.colorPresets.map((p) => {
          const selected = presetId === p.id
          const cols = p.colors as any
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={
                'group relative overflow-hidden rounded-lg border-2 p-3 text-start transition ' +
                (selected ? 'border-foreground' : 'border-token hover:border-foreground/40')
              }
              style={{ background: cols.background || '#fff', color: cols.text || '#000' }}
            >
              <div className="mb-2 flex gap-1">
                <span className="h-4 w-4 rounded-full" style={{ background: cols.primary }} />
                <span className="h-4 w-4 rounded-full" style={{ background: cols.accent }} />
                <span className="h-4 w-4 rounded-full border" style={{ background: cols.surface, borderColor: cols.border }} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: cols.accent }}>
                {p.vibe}
              </div>
              <div className="mt-0.5 text-[14px] leading-tight" style={{ fontFamily: p.heading_font, color: cols.text }}>
                {p.name}
              </div>
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-foreground px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white">
                  نشط
                </span>
              )}
            </button>
          )
        })}
      </div>

      <SectionLabel>ألوان مخصّصة</SectionLabel>
      <div className="space-y-1.5">
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
        <button
          type="button"
          onClick={resetOverrides}
          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> إعادة كل الألوان إلى النمط الجاهز
        </button>
      )}
    </>
  )
}

/* ── Typography panel ────────────────────────────────────────────────── */

export function TypographyPanel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mood, setMood] = useState<'all' | typeof TYPOGRAPHY_MOODS[number]>('all')
  const presets = mood === 'all' ? TYPOGRAPHY_PRESETS : TYPOGRAPHY_PRESETS.filter((p) => p.mood === mood)
  return (
    <>
      <SmallNote>اختر زوج خطوط. تتحدّث العناوين والنصوص في كل مكان.</SmallNote>
      <div className="flex flex-wrap gap-1">
        <MoodChip active={mood === 'all'} onClick={() => setMood('all')}>الكل</MoodChip>
        {TYPOGRAPHY_MOODS.map((m) => (
          <MoodChip key={m} active={mood === m} onClick={() => setMood(m)}>{m}</MoodChip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {presets.map((p) => {
          const selected = value === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={
                'relative w-full rounded-lg border-2 px-3 py-2.5 text-start transition ' +
                (selected ? 'border-foreground bg-[rgba(28,28,28,0.03)]' : 'border-token bg-white hover:border-foreground/40')
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[18px] leading-tight text-foreground"
                  style={{
                    fontFamily: p.heading_font,
                    fontWeight: p.heading_weight ?? 600,
                    letterSpacing: p.heading_tracking ?? '-0.02em',
                  }}
                >
                  {p.name}
                </span>
                <span className="rounded bg-[rgba(28,28,28,0.04)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                  {p.mood}
                </span>
              </div>
              <div className="mt-1 text-[11.5px] text-muted" style={{ fontFamily: p.body_font }}>
                {p.vibe}
              </div>
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-foreground px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white">
                  نشط
                </span>
              )}
            </button>
          )
        })}
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')} className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> استخدام الخطوط الافتراضية للنمط
        </button>
      )}
    </>
  )
}

/* ── Undo / redo ──────────────────────────────────────────────────────── */
export function UndoRedo({
  canUndo, canRedo, onUndo, onRedo,
}: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="تراجع (⌘Z)"
        aria-label="تراجع"
        className="inline-flex items-center justify-center rounded-md border border-token bg-white p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="إعادة (⌘⇧Z)"
        aria-label="إعادة"
        className="inline-flex items-center justify-center rounded-md border border-token bg-white p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Redo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  )
}

/* ── Save status pill ─────────────────────────────────────────────────── */

export function StatusPill({
  status, dirty, lastSavedAt, now,
}: { status: Status; dirty: boolean; lastSavedAt: number | null; now: number }) {
  if (status === 'saving') return <span className="text-[12px] font-medium text-muted">جارٍ الحفظ…</span>
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#15803d]">
        <Check className="h-3 w-3" strokeWidth={2.5} /> تم الحفظ
      </span>
    )
  }
  if (status === 'error') return <span className="text-[12px] font-medium text-[#b91c1c]">فشل الحفظ</span>
  if (dirty) return <span className="text-[12px] font-medium text-muted">غير محفوظ · حفظ تلقائي…</span>
  if (lastSavedAt) {
    return <span className="text-[12px] font-medium text-muted">حُفظ {relativeTime(lastSavedAt, now)}</span>
  }
  return <span className="text-[12px] font-medium text-muted">كل التغييرات محفوظة</span>
}

export function relativeTime(from: number, now: number): string {
  const s = Math.max(0, Math.round((now - from) / 1000))
  if (s < 5) return 'الآن'
  if (s < 60) return `قبل ${s} ثانية`
  const m = Math.round(s / 60)
  if (m < 60) return `قبل ${m} دقيقة`
  const h = Math.round(m / 60)
  return `قبل ${h} ساعة`
}

/* ── Per-section text size + alignment header ─────────────────────────── */

export function SectionStyleHeader({
  panelId, value, onPatch, onClear,
}: {
  panelId: string
  value?: SectionStyle
  onPatch: (p: Partial<SectionStyle>) => void
  onClear: () => void
}) {
  const activeScale = value?.text_scale ?? 1
  // No explicit alignment ⇒ none highlighted (the section inherits the theme's
  // own default, which is start/right in RTL). Each button sets its literal value.
  const activeAlign: SectionTextAlign | undefined = value?.text_align
  const hasOverride = (value && (value.text_scale != null || value.text_align != null)) || false

  return (
    <div className="rounded-lg border border-token bg-[rgba(94,106,210,0.04)] p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          نمط القسم
        </span>
        {hasOverride && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10.5px] font-medium text-muted hover:text-foreground"
            title="إعادة تعيين هذا القسم"
          >
            إعادة تعيين
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">الحجم</span>
        <div className="flex flex-1 rounded-md border border-token bg-white p-0.5">
          {SECTION_TEXT_SCALES.map((s) => {
            const selected = Math.abs(activeScale - s.value) < 0.01
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPatch({ text_scale: s.value === 1 ? undefined : s.value })}
                className={
                  'flex-1 rounded text-[11px] font-semibold transition ' +
                  (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')
                }
                style={{ padding: '3px 0' }}
                title={`حجم النص ${s.label}`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">المحاذاة</span>
        <div className="flex flex-1 rounded-md border border-token bg-white p-0.5">
          {(
            [
              { id: 'left' as const,   Icon: AlignLeft   },
              { id: 'center' as const, Icon: AlignCenter },
              { id: 'right' as const,  Icon: AlignRight  },
            ]
          ).map(({ id, Icon }) => {
            const selected = activeAlign === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ text_align: activeAlign === id ? undefined : id })}
                className={
                  'flex flex-1 items-center justify-center rounded transition ' +
                  (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')
                }
                style={{ padding: '4px 0' }}
                title={`محاذاة ${id}`}
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[10.5px] leading-snug text-muted/80">
        يُطبَّق على قسم <strong className="font-semibold text-foreground">{panelId}</strong>.
      </p>
    </div>
  )
}
