'use client'

import { useId, useState } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import {
  ChevronRight, ImageIcon, RotateCcw, Trash2,
  Upload,
} from 'lucide-react'
import GalleryPicker from './GalleryPicker'
import { useAiRewrite } from './AiRewrite'

/* ────────────────────────────────────────────────────────────────────── *
 * Shared editor field components — used by every theme's editor.        *
 * All inputs are uncontrolled-friendly: value/onChange pair, fast    *
 * rerenders, no internal state besides UI affordances.                  *
 *                                                                        *
 * Styled by editor-style.ts. The label sits ABOVE its field and is tied *
 * to it with htmlFor, so tapping a label focuses the field. Labels are  *
 * 14.5px sentence case with no tracking: they are Arabic, and uppercase *
 * tracking on Arabic pulls the joins apart. The input carries Tajawal,  *
 * the content face; everything around it carries the chrome face.      *
 * ────────────────────────────────────────────────────────────────────── */

export function FieldText({
  label, value, onChange, placeholder, panelLabel,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; panelLabel?: string }) {
  const id = useId()
  const ai = useAiRewrite({ fieldLabel: label, panelLabel, multiline: false, current: value, onChange })
  return (
    <div className="ze-field">
      <div className="ze-label-row">
        <label className="ze-label" htmlFor={id}>{label}</label>
        {ai.trigger}
      </div>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="auto"
        className="ze-input"
      />
      {ai.panel}
    </div>
  )
}

export function FieldTextArea({
  label, value, onChange, placeholder, rows = 3, panelLabel,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; panelLabel?: string }) {
  const id = useId()
  const ai = useAiRewrite({ fieldLabel: label, panelLabel, multiline: true, current: value, onChange })
  return (
    <div className="ze-field">
      <div className="ze-label-row">
        <label className="ze-label" htmlFor={id}>{label}</label>
        {ai.trigger}
      </div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="auto"
        wrap="soft"
        className="ze-textarea"
      />
      {ai.panel}
    </div>
  )
}

export function FieldNumber({
  label, value, onChange, min, max, step,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  const id = useId()
  return (
    <div className="ze-field">
      <label className="ze-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="ze-input"
      />
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="ze-card-t">{children}</div>
}

export function SmallNote({ children }: { children: React.ReactNode }) {
  return <p className="ze-note">{children}</p>
}

export function Collapsible({
  title, defaultOpen = false, children, onRemove,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode; onRemove?: () => void }) {
  const t = useT()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="ze-item">
      <div className="ze-item-h">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ze-item-toggle"
        >
          <ChevronRight strokeWidth={2.25} aria-hidden />
          <span className="ze-row-t">{title}</span>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title={t.editor.remove}
            aria-label={`${t.editor.remove}: ${title}`}
            className="ze-icon"
            data-tone="bad"
          >
            <Trash2 strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
      {open && <div className="ze-item-body">{children}</div>}
    </div>
  )
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ze-add">
      {label}
    </button>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Image fields                                                           *
 * ────────────────────────────────────────────────────────────────────── */

export function FieldImage({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const t = useT()
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="ze-field">
      <div className="ze-label-row">
        <span className="ze-label">{label}</span>
        {value && (
          <button type="button" onClick={() => onChange('')} className="ze-link" data-tone="bad">
            {t.editor.clear}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="ze-img"
        aria-label={`${value ? t.editor.changeImage : t.editor.chooseImage}: ${label}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <span className="ze-img-empty">
            <Upload strokeWidth={2} aria-hidden />
            {t.editor.chooseImage}
          </span>
        )}
      </button>
      <button type="button" onClick={() => setPickerOpen(true)} className="ze-btn" data-tone="quiet">
        <ImageIcon strokeWidth={2} aria-hidden />
        {value ? t.editor.changeImage : t.editor.openGallery}
      </button>
      {hint && <p className="ze-hint">{hint}</p>}
      <GalleryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => onChange(url)}
        currentUrl={value || undefined}
      />
    </div>
  )
}

export function InlineImage({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const t = useT()
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="ze-row2">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="ze-swatch"
        style={{ background: 'var(--field)' }}
        title={value ? t.editor.clickToChange : t.editor.chooseImage}
        aria-label={value ? t.editor.changeImage : t.editor.chooseImage}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageIcon strokeWidth={2} aria-hidden style={{ width: 16, height: 16, margin: 'auto' }} />
        )}
      </button>
      <button type="button" onClick={() => setPickerOpen(true)} className="ze-btn" data-tone="quiet" style={{ flex: '1 1 auto', minWidth: 0, justifyContent: 'space-between' }}>
        <span className="ze-row-t" style={{ textAlign: 'start' }}>{value ? truncateUrl(value) : label}</span>
        <Upload strokeWidth={2} aria-hidden />
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} className="ze-icon" data-tone="bad" title={t.editor.clear} aria-label={t.editor.clear}>
          <Trash2 strokeWidth={2} aria-hidden />
        </button>
      )}
      <GalleryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => onChange(url)}
        currentUrl={value || undefined}
      />
    </div>
  )
}

function truncateUrl(u: string): string {
  if (u.length <= 36) return u
  const last = u.split('/').pop() || ''
  return last.length <= 36 ? last : `…${last.slice(-32)}`
}

/** Legacy export — kept for back-compat with any caller still using it. */
export function UploadButton({
  label, small = false, onUploaded,
}: { label?: string; small?: boolean; onUploaded: (url: string) => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const buttonLabel = label ?? t.editor.upload
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="ze-btn" data-tone="quiet" data-small={small ? '' : undefined}>
        <Upload strokeWidth={2} aria-hidden />
        {buttonLabel}
      </button>
      <GalleryPicker open={open} onClose={() => setOpen(false)} onPick={(url) => onUploaded(url)} />
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * String list (simple list of strings — used for things like areas,      *
 * trust-bar logos, security bullets, etc.)                               *
 * ────────────────────────────────────────────────────────────────────── */

export function StringList({
  label, value, onChange, placeholder, addLabel,
}: {
  label?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  const t = useT()
  function update(i: number, v: string) {
    onChange(value.map((s, idx) => (idx === i ? v : s)))
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }
  return (
    <div className="ze-field">
      {label && <SectionLabel>{label}</SectionLabel>}
      <div className="ze-items">
        {value.map((s, i) => (
          <div key={i} className="ze-row2">
            <input
              value={s}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              aria-label={label ? `${label} ${i + 1}` : undefined}
              dir="auto"
              className="ze-input"
            />
            <button type="button" onClick={() => remove(i)} className="ze-icon" data-tone="bad" title={t.editor.remove} aria-label={t.editor.remove}>
              <Trash2 strokeWidth={2} aria-hidden />
            </button>
          </div>
        ))}
        <AddRowButton label={addLabel ?? t.editor.addItem} onClick={() => onChange([...value, ''])} />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Color override row                                                     *
 * ────────────────────────────────────────────────────────────────────── */

export function ColorRow({
  label, value, overridden, onChange, onReset,
}: {
  label: string
  value: string
  overridden: boolean
  onChange: (v: string) => void
  onReset: () => void
}) {
  const t = useT()
  const isHex = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(value)
  return (
    <div className="ze-color">
      {/* The swatch IS the colour picker when the value is a hex, so the
          control a finger aims at is the size of the colour it shows. */}
      <span className="ze-swatch" style={{ background: value }}>
        {isHex && (
          <input
            type="color"
            value={value.length === 4 ? '#' + value.slice(1).split('').map((c) => c + c).join('') : value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
          />
        )}
      </span>
      <div className="ze-color-m">
        <span className="ze-color-l">
          {label}
          {overridden && <span className="ze-tag">{t.editor.custom}</span>}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          spellCheck={false}
          data-mono
          className="ze-input"
        />
      </div>
      {overridden && (
        <button
          type="button"
          onClick={onReset}
          title={t.editor.backToPreset}
          aria-label={t.editor.backToPreset}
          className="ze-icon"
        >
          <RotateCcw strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  )
}

export function MoodChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="ze-chip">
      {children}
    </button>
  )
}
