'use client'

import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'

/**
 * Reusable image upload tile. Replaces the legacy "paste an image URL"
 * field — drops a file into /api/upload, gets back a public URL, calls
 * onChange with it. Renders a preview + Replace + Remove once a value is
 * set.
 *
 * Sized to fit any form: pass `aspect` ('square' | 'wide' | 'auto')
 * to control the placeholder dimensions.
 */
type Aspect = 'square' | 'wide' | 'auto' | 'thumb'

export default function ImageUploadField({
  value,
  onChange,
  label,
  aspect = 'wide',
  className = '',
  helper,
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  aspect?: Aspect
  className?: string
  helper?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aspectClass =
    aspect === 'square' ? 'aspect-square'
    : aspect === 'thumb' ? 'h-20 w-20'
    : aspect === 'wide' ? 'aspect-[16/9]'
    : ''

  async function handleFile(file: File | null) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok || !j.url) {
        setError(j?.message || j?.error || 'Upload failed.')
        return
      }
      onChange(j.url)
    } catch (e: any) {
      setError(e?.message || 'Network error.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="hidden"
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-lg border border-token bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label || 'Uploaded image'}
            className={`${aspectClass || 'h-auto w-full'} object-cover`}
            style={aspect === 'auto' ? { maxHeight: 240 } : undefined}
          />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/55 to-transparent p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#b91c1c] hover:bg-white"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={
            `${aspectClass} flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-token bg-surface px-3 py-4 text-muted transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-wait disabled:opacity-60`
          }
        >
          {uploading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-[11.5px] font-medium">Uploading…</span>
            </>
          ) : (
            <>
              {aspect === 'thumb' ? (
                <ImageIcon className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Upload className="h-4 w-4" strokeWidth={1.75} />
              )}
              <span className="text-[11.5px] font-medium">
                {aspect === 'thumb' ? 'Image' : 'Upload image'}
              </span>
            </>
          )}
        </button>
      )}

      {helper && !error && (
        <p className="mt-1 text-[11.5px] text-muted">{helper}</p>
      )}
      {error && (
        <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#b91c1c]">
          <X className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}
