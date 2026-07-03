'use client'

import { useRef, useState } from 'react'
import { Camera, X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'

/**
 * MenuImageAnalyzer — "upload your menu, we'll type it for you".
 *
 * The owner snaps 1–4 photos of their printed menu (multiple pages OK). We
 * downscale each on the client (keeps the request small + OCR sharp), post
 * them to /api/analyze-menu, and hand the extracted categories back to the
 * wizard via onExtract. The wizard then pre-fills its normal category/item
 * fields, which the owner reviews and edits before generating.
 *
 * No dish images are ever attached — extraction is text only. Photos stay
 * opt-in and owner-provided elsewhere in the form.
 */

export type ExtractedItem = {
  name: string
  price?: string
  description?: string
  badge?: string
}
export type ExtractedCategory = {
  name: string
  description?: string
  items: ExtractedItem[]
}

type Shot = { id: string; dataUrl: string; name: string }

const MAX_SHOTS = 4
const MAX_DIM = 1500
const JPEG_QUALITY = 0.72

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

/**
 * Load a File, draw it onto a canvas scaled to fit MAX_DIM on its long edge,
 * and export a JPEG data URL. Downscaling here means the POST body stays a
 * few hundred KB per page instead of multi-MB phone originals.
 */
function downscaleToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, MAX_DIM / Math.max(width, height))
      const w = Math.max(1, Math.round(width * scale))
      const h = Math.max(1, Math.round(height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas_unsupported'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image_decode_failed'))
    }
    img.src = url
  })
}

export default function MenuImageAnalyzer({
  cuisine,
  onExtract,
}: {
  cuisine?: string
  /** Called with the parsed categories. Returns how many items were applied. */
  onExtract: (categories: ExtractedCategory[]) => { categories: number; items: number }
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [shots, setShots] = useState<Shot[]>([])
  const [preparing, setPreparing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ categories: number; items: number } | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setResult(null)
    setPreparing(true)
    try {
      const room = MAX_SHOTS - shots.length
      const picked = Array.from(files).slice(0, Math.max(0, room))
      const next: Shot[] = []
      for (const f of picked) {
        if (!f.type.startsWith('image/')) continue
        try {
          const dataUrl = await downscaleToDataUrl(f)
          next.push({ id: newId(), dataUrl, name: f.name || 'menu' })
        } catch {
          /* skip an unreadable file, keep the rest */
        }
      }
      if (next.length === 0) {
        setError('تعذّر تجهيز الصور. جرّب صورًا بصيغة JPG أو PNG.')
      } else {
        setShots((prev) => [...prev, ...next].slice(0, MAX_SHOTS))
      }
    } finally {
      setPreparing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeShot(id: string) {
    setShots((prev) => prev.filter((s) => s.id !== id))
    setResult(null)
  }

  async function analyze() {
    if (shots.length === 0 || analyzing) return
    setError(null)
    setResult(null)
    setAnalyzing(true)
    try {
      const r = await fetch('/api/analyze-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: shots.map((s) => s.dataUrl), cuisine: cuisine || undefined }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.status === 401) {
        setError('انتهت جلستك. أعد تسجيل الدخول ثم حاول مجددًا.')
        return
      }
      const categories: ExtractedCategory[] = Array.isArray(j?.categories) ? j.categories : []
      if (!r.ok && categories.length === 0) {
        setError(j?.message || 'تعذّرت قراءة القائمة. يمكنك إدخال الأصناف يدويًا.')
        return
      }
      if (categories.length === 0) {
        setError(j?.message || 'لم نجد أصنافًا في الصورة. جرّب صورة أوضح أو أدخل الأصناف يدويًا.')
        return
      }
      const applied = onExtract(categories)
      setResult(applied)
    } catch (e: any) {
      setError('حدث خطأ في الشبكة أثناء قراءة القائمة. يمكنك إدخال الأصناف يدويًا.')
    } finally {
      setAnalyzing(false)
    }
  }

  const busy = preparing || analyzing

  return (
    <div
      className="mb-6 rounded-2xl border p-5 backdrop-blur-md"
      style={{ background: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.28)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]"
          style={{ background: 'rgba(217,119,6,0.14)' }}
        >
          📸
        </div>
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold text-foreground">
            عندك قائمة كبيرة؟ ارفع صورتها ودعنا نكتبها لك.
          </p>
          <p className="mt-0.5 text-[12px] leading-[1.55] text-muted">
            صوّر قائمة مطعمك (حتى {MAX_SHOTS} صور للصفحات المتعدّدة) وسنستخرج الفئات والأصناف والأسعار
            تلقائيًا. تراجعها وتعدّلها قبل التوليد. لا نضيف أي صور — نقرأ النص فقط.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Selected page thumbnails */}
      {shots.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {shots.map((s) => (
            <div key={s.id} className="group relative h-24 w-20 overflow-hidden rounded-lg border border-token bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.dataUrl} alt={s.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeShot(s.id)}
                disabled={busy}
                className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:opacity-50"
                aria-label="إزالة الصورة"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {shots.length < MAX_SHOTS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-token bg-surface px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-elevated disabled:opacity-60"
          >
            {preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {shots.length === 0 ? 'ارفع صورة القائمة' : 'أضف صفحة أخرى'}
          </button>
        )}

        {shots.length > 0 && (
          <button
            type="button"
            onClick={analyze}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {analyzing ? 'جارٍ قراءة قائمتك…' : 'اقرأ القائمة تلقائيًا'}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#b45309]">
          <X className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {result && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#15803d]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          أضفنا {result.categories} فئة و{result.items} صنفًا من صورتك. راجعها وعدّلها بالأسفل.
        </p>
      )}
    </div>
  )
}
