'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Image as ImageIcon, Loader2, Search, Trash2, Upload } from 'lucide-react'

type GalleryImage = {
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

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const r = await fetch('/api/gallery')
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || 'Failed to load gallery')
      setImages(j.images || [])
    } catch (e: any) {
      setErr(e?.message || 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true); setErr(null)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        const r = await fetch('/api/upload', { method: 'POST', body: form })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.message || j.error || `Upload failed (${file.name})`)
        }
      }
      await load()
    } catch (e: any) {
      setErr(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function remove(img: GalleryImage) {
    if (!confirm(`Delete this image? If any of your sites use it, the site will show a broken image.`)) return
    setDeletingId(img.id)
    try {
      const r = await fetch(`/api/gallery/${img.id}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.message || j.error || 'Delete failed')
      }
      setImages((cur) => cur.filter((i) => i.id !== img.id))
    } catch (e: any) {
      setErr(e?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  async function copy(img: GalleryImage) {
    try {
      await navigator.clipboard.writeText(img.url)
      setCopiedId(img.id)
      setTimeout(() => setCopiedId((c) => (c === img.id ? null : c)), 1500)
    } catch {}
  }

  const filtered = q.trim()
    ? images.filter((i) =>
        (i.name || '').toLowerCase().includes(q.toLowerCase()) ||
        i.url.toLowerCase().includes(q.toLowerCase()),
      )
    : images

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Gallery</h1>
          <p className="mt-1 text-[13px] text-muted">
            Every image you’ve uploaded lives here. Reuse them across any site you build.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search images"
              className="w-56 rounded-full border border-token bg-white py-1.5 pl-7 pr-3 text-[12.5px] outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" strokeWidth={2.5} />}
            {uploading ? 'Uploading…' : 'Upload images'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      {err && (
        <div className="mb-4 rounded-md border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-3 py-2 text-[12.5px] text-[#b91c1c]">
          {err}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          onUpload={() => fileRef.current?.click()}
          hasQuery={!!q.trim()}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-token bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name || 'gallery image'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 opacity-0 transition group-hover:opacity-100">
                <span className="truncate text-[10.5px] font-medium text-white" title={img.name || img.url}>
                  {img.name || 'Untitled'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copy(img)}
                    className="rounded-md bg-white/15 p-1.5 text-white hover:bg-white/30"
                    title={copiedId === img.id ? 'Copied!' : 'Copy URL'}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(img)}
                    disabled={deletingId === img.id}
                    className="rounded-md bg-white/15 p-1.5 text-white hover:bg-[rgba(220,38,38,0.55)] disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === img.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              {copiedId === img.id && (
                <span className="absolute right-2 top-2 rounded-full bg-[#15803d] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white shadow">
                  Copied
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Empty({ onUpload, hasQuery }: { onUpload: () => void; hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="rounded-2xl border border-dashed border-token bg-white p-12 text-center">
        <ImageIcon className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
        <p className="mt-3 text-[13px] text-muted">No images match your search.</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-dashed border-token bg-white p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(94,106,210,0.10)]">
        <ImageIcon className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-[16px] font-semibold text-foreground">Your gallery is empty</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
        Upload your first image — every image you use in any of your sites will collect here so you can reuse it instantly.
      </p>
      <button
        onClick={onUpload}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-primary/25"
      >
        <Upload className="h-3.5 w-3.5" strokeWidth={2.5} />
        Upload your first image
      </button>
    </div>
  )
}
