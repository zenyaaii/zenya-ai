'use client'

import { useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, ImageIcon, Plus, RotateCcw, Trash2,
  Upload,
} from 'lucide-react'
import GalleryPicker from './GalleryPicker'

/* ────────────────────────────────────────────────────────────────────── *
 * Shared editor field components — used by every theme's editor.        *
 * All inputs are uncontrolled-friendly: value/onChange pair, fast    *
 * rerenders, no internal state besides UI affordances.                  *
 * ────────────────────────────────────────────────────────────────────── */

export function FieldText({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-token bg-white px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
      />
    </label>
  )
}

export function FieldTextArea({
  label, value, onChange, placeholder, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        wrap="soft"
        className="block w-full resize-y break-words rounded-md border border-token bg-white px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
      />
    </label>
  )
}

export function FieldNumber({
  label, value, onChange, min, max, step,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-md border border-token bg-white px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
      />
    </label>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </div>
  )
}

export function SmallNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-[rgba(94,106,210,0.06)] px-2.5 py-2 text-[11.5px] leading-[1.55] text-muted">
      {children}
    </p>
  )
}

export function Collapsible({
  title, defaultOpen = false, children, onRemove,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode; onRemove?: () => void }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-token bg-white">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-muted" />}
          <span className="truncate text-[13px] font-medium text-foreground">{title}</span>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove"
            className="rounded border border-token bg-white p-1 text-muted hover:bg-[rgba(220,38,38,0.06)] hover:text-[#b91c1c]"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="space-y-2 border-t border-token px-2.5 py-2.5">
          {children}
        </div>
      )}
    </div>
  )
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-2 text-[12.5px] font-medium text-primary hover:bg-[rgba(94,106,210,0.04)]"
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Image fields                                                           *
 * ────────────────────────────────────────────────────────────────────── */

export function FieldImage({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[10.5px] text-[#b91c1c] hover:underline">
            Clear
          </button>
        )}
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="group mb-1.5 block w-full overflow-hidden rounded-md border border-token transition hover:border-primary"
          title="Click to change"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="block h-32 w-full object-cover" />
          <span className="block bg-black/60 px-2 py-1 text-center text-[10.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
            Click to change
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mb-1.5 grid h-24 w-full place-items-center rounded-md border border-dashed border-token bg-surface text-muted transition hover:border-primary hover:text-primary"
        >
          <div className="flex flex-col items-center gap-1">
            <Upload className="h-4 w-4" strokeWidth={2} />
            <span className="text-[11.5px] font-medium">Choose image</span>
          </div>
        </button>
      )}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
        >
          <ImageIcon className="h-3 w-3" strokeWidth={2.25} />
          {value ? 'Change image' : 'Open gallery'}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
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
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="group relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-token bg-white transition hover:border-primary"
        title={value ? 'Click to change' : 'Choose image'}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="inline-flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
      >
        <span className="truncate text-left text-muted">{value ? truncateUrl(value) : label}</span>
        <Upload className="h-3 w-3 flex-shrink-0 text-muted" strokeWidth={2.25} />
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} className="rounded border border-token bg-white p-1 text-muted hover:bg-black/5" title="Clear">
          <Trash2 className="h-3 w-3" />
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
  label = 'Upload', small = false, onUploaded,
}: { label?: string; small?: boolean; onUploaded: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          small
            ? 'inline-flex items-center gap-1 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-muted hover:bg-black/5'
            : 'inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-black/5'
        }
      >
        <Upload className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.25} />
        {label}
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
  label, value, onChange, placeholder, addLabel = 'Add item',
}: {
  label?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  function update(i: number, v: string) {
    onChange(value.map((s, idx) => (idx === i ? v : s)))
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }
  return (
    <div>
      {label && <SectionLabel>{label}</SectionLabel>}
      <div className="mt-1 space-y-1">
        {value.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={s}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-md border border-token bg-white px-2 py-1 text-[12.5px] outline-none focus:border-primary"
            />
            <button type="button" onClick={() => remove(i)} className="rounded border border-token bg-white p-1 text-muted hover:bg-[rgba(220,38,38,0.06)] hover:text-[#b91c1c]">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <AddRowButton label={addLabel} onClick={() => onChange([...value, ''])} />
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
  const isHex = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(value)
  return (
    <div className="flex items-center gap-2 rounded-md border border-token bg-white px-2 py-1.5">
      <span
        className="h-6 w-6 flex-shrink-0 rounded border border-token"
        style={{ background: value }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">{label}</span>
          {overridden && (
            <span className="rounded bg-primary/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-primary">
              custom
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          {isHex && (
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded border border-token bg-white"
              aria-label={`${label} color`}
            />
          )}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded border border-token bg-white px-1.5 py-0.5 font-mono text-[11px] outline-none focus:border-primary"
          />
        </div>
      </div>
      {overridden && (
        <button
          type="button"
          onClick={onReset}
          title="Revert to preset"
          className="rounded border border-token bg-white p-1 text-muted hover:bg-black/5"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export function MoodChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider transition ' +
        (active ? 'bg-foreground text-white' : 'bg-[rgba(28,28,28,0.06)] text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}
