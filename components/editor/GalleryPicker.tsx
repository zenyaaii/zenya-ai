'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageIcon, Loader2, Search, Trash2, Upload, X, Link as LinkIcon } from 'lucide-react'
import { useNotify } from '@/components/ui/Notify'

/* ────────────────────────────────────────────────────────────────────── *
 * GalleryPicker — modal that lets the user pick an image from their       *
 * personal gallery (or upload a new one). Used by every image field in    *
 * the editor: instead of pasting a URL, click "Upload" → this opens.      *
 * ────────────────────────────────────────────────────────────────────── */

export type GalleryImage = {
  id: string
  url: string
  path: string | null
  name: string | null
  mime: string | null
  bytes: number | null
  width: number | null
  height: number | null
  source: 'upload' | 'theme' | 'external'
  created_at: string
}

export default function GalleryPicker({
  open,
  onClose,
  onPick,
  currentUrl,
}: {
  open: boolean
  onClose: () => void
  onPick: (url: string) => void
  currentUrl?: string
}) {
  const { confirm } = useNotify()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const r = await fetch('/api/gallery')
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || 'فشل تحميل المعرض')
      setImages(j.images || [])
    } catch (e: any) {
      setErr(e?.message || 'فشل تحميل المعرض')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Esc closes
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleFile(file: File) {
    setUploading(true); setErr(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: form })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || 'فشل الرفع')
      // Optimistically prepend, then re-sync from server
      onPick(j.url)
      await load()
      onClose()
    } catch (e: any) {
      setErr(e?.message || 'فشل الرفع')
    } finally {
      setUploading(false)
    }
  }

  async function remove(img: GalleryImage) {
    const { confirmed } = await confirm({
      title: 'حذف هذه الصورة من معرضك؟',
      message: 'إن كانت مستخدمة في أي موقع، سيُظهر الموقع صورة معطوبة.',
      confirmText: 'حذف الصورة',
      tone: 'danger',
    })
    if (!confirmed) return
    setDeletingId(img.id)
    try {
      const r = await fetch(`/api/gallery/${img.id}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.message || j.error || 'فشل الحذف')
      }
      setImages((cur) => cur.filter((i) => i.id !== img.id))
    } catch (e: any) {
      setErr(e?.message || 'فشل الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  function pasteUrl() {
    const v = urlInput.trim()
    if (!v || !/^https?:\/\//i.test(v)) {
      setErr('يجب أن يبدأ الرابط بـ http:// أو https://')
      return
    }
    // Persist to gallery so it appears next time too, but don't block.
    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: v, source: 'external' }),
    }).catch(() => null)
    onPick(v)
    onClose()
  }

  if (!open) return null

  const filtered = q.trim()
    ? images.filter((i) => (i.name || '').toLowerCase().includes(q.toLowerCase()) || i.url.toLowerCase().includes(q.toLowerCase()))
    : images

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-token bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="اختر صورة"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-token px-5 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" strokeWidth={2.25} />
            <h2 className="text-[15px] font-semibold text-foreground">معرضك</h2>
            <span className="text-[11.5px] text-muted">{images.length} {images.length === 1 ? 'صورة' : 'صورة'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث"
                className="w-44 rounded-md border border-token bg-white py-1.5 pl-7 pr-2 text-[12px] outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" strokeWidth={2.5} />}
              {uploading ? 'جارٍ الرفع…' : 'رفع جديد'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-token bg-white p-1.5 text-muted hover:bg-black/5"
              aria-label="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
        </div>

        {err && (
          <div className="flex-shrink-0 border-b border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-5 py-2 text-[12.5px] text-[#b91c1c]">
            {err}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto bg-surface p-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-black/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onUpload={() => fileRef.current?.click()} hasQuery={!!q.trim()} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((img) => {
                const selected = img.url === currentUrl
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => { onPick(img.url); onClose() }}
                    className={
                      'group relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition ' +
                      (selected ? 'border-primary ring-2 ring-primary/30' : 'border-token hover:border-foreground/40')
                    }
                    title={img.name || img.url}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name || 'gallery image'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/65 to-transparent px-2 py-1.5 opacity-0 transition group-hover:opacity-100">
                      <span className="truncate text-[10.5px] font-medium text-white">{img.name || 'بلا عنوان'}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); remove(img) }}
                        disabled={deletingId === img.id}
                        className="rounded-md bg-white/15 p-1 text-white hover:bg-white/30 disabled:opacity-50"
                        title="حذف"
                      >
                        {deletingId === img.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                        الحالية
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: paste URL escape hatch */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-token bg-white px-5 py-2.5">
          {showUrl ? (
            <div className="flex flex-1 items-center gap-2">
              <LinkIcon className="h-3 w-3 text-muted" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') pasteUrl() }}
                placeholder="https://…"
                className="flex-1 rounded-md border border-token bg-white px-2 py-1 text-[12.5px] outline-none focus:border-primary"
                autoFocus
              />
              <button
                type="button"
                onClick={pasteUrl}
                className="rounded-md bg-foreground px-2.5 py-1 text-[11.5px] font-semibold text-white"
              >
                استخدام الرابط
              </button>
              <button
                type="button"
                onClick={() => { setShowUrl(false); setUrlInput('') }}
                className="text-[11.5px] text-muted hover:text-foreground"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground"
            >
              <LinkIcon className="h-3 w-3" />
أو الصق رابط صورة
            </button>
          )}
          <span className="text-[10.5px] text-muted/70">JPG · PNG · WebP · GIF · AVIF · بحدّ أقصى 5 ميجابايت</span>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onUpload, hasQuery }: { onUpload: () => void; hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <ImageIcon className="h-8 w-8 text-muted/60" strokeWidth={1.5} />
        <p className="mt-3 text-[13px] text-muted">لا توجد صور تطابق هذا البحث.</p>
      </div>
    )
  }
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(94,106,210,0.10)]">
        <ImageIcon className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-foreground">معرضك فارغ</h3>
      <p className="mt-1 max-w-xs text-[12.5px] text-muted">
        ارفع أول صورة لك — ستظهر هنا في كل موقع تبنيه.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white"
      >
        <Upload className="h-3 w-3" strokeWidth={2.5} /> رفع صورة
      </button>
    </div>
  )
}
