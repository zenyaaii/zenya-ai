'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/components/i18n/LocaleProvider'
import { ImageIcon, Search, Trash2, Upload, X, Link as LinkIcon } from 'lucide-react'
import { useNotify } from '@/components/ui/Notify'
import { useEditorEnv } from './env'

/* ────────────────────────────────────────────────────────────────────── *
 * GalleryPicker — modal that lets the user pick an image from their       *
 * personal gallery (or upload a new one). Used by every image field in    *
 * the editor: instead of pasting a URL, click "Upload" → this opens.      *
 *                                                                        *
 * PORTALLED TO <body>. On a phone the field that opens this lives inside *
 * the editor's bottom sheet, which is moved with a transform — and a     *
 * transformed ancestor makes position: fixed relative to IT, so the      *
 * modal used to open inside the sheet's box instead of over the screen.  *
 * The portal carries .ze-tokens so the editor's colours come with it.    *
 *                                                                        *
 * OFFLINE (the /demo/editor candidate, see ./env): nothing is fetched,   *
 * uploaded or deleted. The grid is replaced by a note that says so, and  *
 * pasting a link still works — it only sets the field, it stores nothing. *
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
  const t = useT()
  const { confirm } = useNotify()
  const { offline } = useEditorEnv()
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
      if (!r.ok) throw new Error(j.message || j.error || t.editor.galleryLoadFailed)
      setImages(j.images || [])
    } catch (e: any) {
      setErr(e?.message || t.editor.galleryLoadFailed)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && !offline) load()
  }, [open, offline, load])

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
    if (offline) return
    setUploading(true); setErr(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: form })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || t.editor.uploadFailed)
      // Optimistically prepend, then re-sync from server
      onPick(j.url)
      await load()
      onClose()
    } catch (e: any) {
      setErr(e?.message || t.editor.uploadFailed)
    } finally {
      setUploading(false)
    }
  }

  async function remove(img: GalleryImage) {
    if (offline) return
    const { confirmed } = await confirm({
      title: t.editor.deleteImageConfirm,
      message: t.editor.deleteImageWarning,
      confirmText: t.editor.deleteImage,
      tone: 'danger',
    })
    if (!confirmed) return
    setDeletingId(img.id)
    try {
      const r = await fetch(`/api/gallery/${img.id}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.message || j.error || t.editor.deleteFailed)
      }
      setImages((cur) => cur.filter((i) => i.id !== img.id))
    } catch (e: any) {
      setErr(e?.message || t.editor.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  function pasteUrl() {
    const v = urlInput.trim()
    if (!v || !/^https?:\/\//i.test(v)) {
      setErr(t.editor.urlMustStart)
      return
    }
    // Persist to gallery so it appears next time too, but don't block.
    if (!offline) {
      fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: v, source: 'external' }),
      }).catch(() => null)
    }
    onPick(v)
    onClose()
  }

  if (!open || typeof document === 'undefined') return null

  const filtered = q.trim()
    ? images.filter((i) => (i.name || '').toLowerCase().includes(q.toLowerCase()) || i.url.toLowerCase().includes(q.toLowerCase()))
    : images

  return createPortal(
    <div className="ze-modal ze-tokens" dir={document.documentElement.dir || undefined}>
      <div className="ze-modal-scrim" onClick={onClose} aria-hidden />

      <div className="ze-modal-box" role="dialog" aria-modal="true" aria-label={t.editor.chooseImage}>
        {/* Header */}
        <div className="ze-modal-h">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <h2 className="ze-modal-t">{t.editor.yourGallery}</h2>
            {!offline && <span className="ze-hint">{images.length} {t.editor.image}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
            {!offline && (
              <>
                <div style={{ position: 'relative' }}>
                  <Search aria-hidden style={{ position: 'absolute', insetInlineStart: 10, top: '50%', width: 14, height: 14, marginTop: -7, color: 'var(--stone)' }} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.editor.search}
                    aria-label={t.editor.search}
                    className="ze-input"
                    style={{ width: '11rem', paddingInlineStart: '2rem' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="ze-btn"
                  data-tone="accent"
                  aria-busy={uploading}
                >
                  {uploading ? <span className="ze-spin" aria-hidden /> : <Upload strokeWidth={2} aria-hidden />}
                  {uploading ? t.editor.uploading : t.editor.uploadNew}
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="ze-icon" aria-label={t.editor.close}>
              <X strokeWidth={2} aria-hidden />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
        </div>

        {err && <p className="ze-err" style={{ margin: '0.75rem 1rem 0' }}>{err}</p>}

        {/* Grid */}
        <div className="ze-modal-grid">
          {offline ? (
            <p className="ze-note" data-tone="door" style={{ maxWidth: '36rem' }}>{t.editor.galleryOffline}</p>
          ) : loading ? (
            <div className="ze-thumbs" aria-busy="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="ze-thumb" style={{ cursor: 'default', background: 'var(--field)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onUpload={() => fileRef.current?.click()} hasQuery={!!q.trim()} />
          ) : (
            <div className="ze-thumbs">
              {filtered.map((img) => {
                const selected = img.url === currentUrl
                return (
                  <div key={img.id} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => { onPick(img.url); onClose() }}
                      aria-pressed={selected}
                      className="ze-thumb"
                      style={{ width: '100%' }}
                      title={img.name || img.url}
                      aria-label={img.name || t.editor.untitled}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" loading="lazy" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(img)}
                      disabled={deletingId === img.id}
                      className="ze-icon"
                      data-tone="bad"
                      title={t.editor.delete}
                      aria-label={`${t.editor.delete}: ${img.name || t.editor.untitled}`}
                      style={{ position: 'absolute', insetBlockEnd: 6, insetInlineEnd: 6, background: '#ffffff', boxShadow: '0 0 0 1px var(--hair)' }}
                    >
                      {deletingId === img.id ? <span className="ze-spin" aria-hidden /> : <Trash2 strokeWidth={2} aria-hidden />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: paste URL escape hatch */}
        <div className="ze-modal-f">
          {showUrl ? (
            <div className="ze-row2" style={{ flex: '1 1 auto' }}>
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') pasteUrl() }}
                placeholder="https://…"
                aria-label={t.editor.orPasteUrl}
                dir="ltr"
                className="ze-input"
                autoFocus
              />
              <button type="button" onClick={pasteUrl} className="ze-btn">{t.editor.useUrl}</button>
              <button type="button" onClick={() => { setShowUrl(false); setUrlInput('') }} className="ze-btn" data-tone="quiet">
                {t.editor.cancel}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowUrl(true)} className="ze-link">
              <LinkIcon aria-hidden /> {t.editor.orPasteUrl}
            </button>
          )}
          {!offline && <span>{t.editor.fileTypes}</span>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function EmptyState({ onUpload, hasQuery }: { onUpload: () => void; hasQuery: boolean }) {
  const t = useT()
  if (hasQuery) {
    return <p className="ze-note" style={{ textAlign: 'center' }}>{t.editor.noSearchMatch}</p>
  }
  return (
    <div className="ze-empty">
      <ImageIcon strokeWidth={1.75} aria-hidden style={{ width: 28, height: 28, color: 'var(--violet)' }} />
      <h3 className="ze-card-t" style={{ margin: 0 }}>{t.editor.galleryEmpty}</h3>
      <p>{t.editor.galleryEmptyBody}</p>
      <button type="button" onClick={onUpload} className="ze-btn" data-tone="accent">
        <Upload strokeWidth={2} aria-hidden /> {t.editor.uploadImage}
      </button>
    </div>
  )
}
