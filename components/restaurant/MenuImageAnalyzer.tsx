'use client'

import { useRef, useState } from 'react'
import { Camera, X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'

/**
 * MenuImageAnalyzer — "upload your menu, we'll type it for you".
 *
 * The owner snaps 1–3 photos of their printed menu (front/back/pages OK). We
 * prepare each on the client and post them to /api/analyze-menu, which reads
 * them with GPT-4o vision and returns the extracted categories. The wizard
 * pre-fills its normal category/item fields, which the owner reviews + edits.
 *
 * Real restaurant menus are often WIDE tri-folds with 3–4 dense columns. If we
 * send the whole page, the text ends up too small for the model to read (the
 * vision API also shrinks wide images internally). So for wide photos we split
 * each page into overlapping left/right halves — that roughly doubles the
 * effective text size the model sees and is what makes dense menus readable.
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

type Shot = { id: string; preview: string; parts: string[]; name: string }

const MAX_SHOTS = 3
// Per-part long-edge cap + JPEG quality. Halves of a wide menu stay well under
// the request-body limit at these settings (~0.5–0.8 MB each).
const MAX_DIM = 1800
const JPEG_QUALITY = 0.82
// Cap on image parts sent. Each part is its own isolated request now, so this
// is only a cost guard — a 3-page tri-fold → 6 halves still fits.
const MAX_PARTS = 6
// If a photo is wider than this ratio, treat it as a multi-column spread and
// split it into left/right halves.
const WIDE_RATIO = 1.2

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

/** Loose key for de-duping names across overlapping halves. Mirrors the server. */
function normKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[ـ\s]+/g, ' ')
    .replace(/[.،؛:_-]+/g, '')
    .trim()
}

/**
 * Merge categories returned by several per-image calls into one clean menu.
 * Categories fold by loose name; items de-dupe within a category, keeping the
 * richer copy (fills a missing price/description from a duplicate). This is
 * what lets overlapping halves reinforce each other instead of duplicating.
 */
function mergeExtracted(lists: ExtractedCategory[]): ExtractedCategory[] {
  const cats = new Map<
    string,
    { name: string; description?: string; items: Map<string, ExtractedItem> }
  >()
  for (const cat of lists) {
    const ck = normKey(cat?.name || '')
    if (!ck) continue
    let entry = cats.get(ck)
    if (!entry) {
      entry = { name: cat.name, description: cat.description, items: new Map() }
      cats.set(ck, entry)
    } else if (!entry.description && cat.description) {
      entry.description = cat.description
    }
    for (const item of Array.isArray(cat.items) ? cat.items : []) {
      const ik = normKey(item?.name || '')
      if (!ik) continue
      const existing = entry.items.get(ik)
      if (!existing) {
        entry.items.set(ik, { ...item })
      } else {
        if (!existing.price && item.price) existing.price = item.price
        if (!existing.description && item.description) existing.description = item.description
        if (!existing.badge && item.badge) existing.badge = item.badge
      }
    }
  }
  return Array.from(cats.values()).map((e) => ({
    name: e.name,
    description: e.description,
    items: Array.from(e.items.values()),
  }))
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image_decode_failed'))
    }
    img.src = url
  })
}

/**
 * Draw a source-rectangle of an image onto a canvas, scaled so its long edge
 * is at most `maxDim`, and return a JPEG data URL.
 */
function cropToDataUrl(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  maxDim: number,
  quality: number
): string {
  const scale = Math.min(1, maxDim / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unsupported')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Turn a picked file into: a small preview + the hi-res part(s) we'll send.
 * Wide photos are split into two overlapping halves; tall/square photos stay
 * whole.
 */
async function fileToShot(file: File): Promise<Shot> {
  const img = await loadImage(file)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const aspect = w / h

  const preview = cropToDataUrl(img, 0, 0, w, h, 360, 0.7)

  let parts: string[]
  if (aspect > WIDE_RATIO) {
    // 56% wide each → ~12% overlap in the middle so nothing on the fold is lost.
    const halfW = Math.round(w * 0.56)
    const rightX = w - halfW
    parts = [
      cropToDataUrl(img, 0, 0, halfW, h, MAX_DIM, JPEG_QUALITY),
      cropToDataUrl(img, rightX, 0, halfW, h, MAX_DIM, JPEG_QUALITY),
    ]
  } else {
    parts = [cropToDataUrl(img, 0, 0, w, h, MAX_DIM, JPEG_QUALITY)]
  }

  return { id: newId(), preview, parts, name: file.name || 'menu' }
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
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
          next.push(await fileToShot(f))
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

  /** Read one image-part in its own request. Small + isolated → can't time out. */
  async function readPart(image: string): Promise<{
    categories: ExtractedCategory[]
    unauth?: boolean
    message?: string
  }> {
    try {
      const r = await fetch('/api/analyze-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [image], cuisine: cuisine || undefined }),
      })
      if (r.status === 401) return { categories: [], unauth: true }
      const j = await r.json().catch(() => ({}))
      return {
        categories: Array.isArray(j?.categories) ? j.categories : [],
        message: typeof j?.message === 'string' ? j.message : undefined,
      }
    } catch {
      return { categories: [], message: undefined }
    } finally {
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
    }
  }

  async function analyze() {
    if (shots.length === 0 || analyzing) return
    setError(null)
    setResult(null)
    setAnalyzing(true)
    const parts = shots.flatMap((s) => s.parts).slice(0, MAX_PARTS)
    setProgress({ done: 0, total: parts.length })
    try {
      // Every part goes out as its own parallel request. One slow/failed part
      // doesn't sink the others — we merge whatever comes back.
      const settled = await Promise.all(parts.map((p) => readPart(p)))

      if (settled.some((s) => s.unauth)) {
        setError('انتهت جلستك. أعد تسجيل الدخول ثم حاول مجددًا.')
        return
      }

      const merged = mergeExtracted(settled.flatMap((s) => s.categories))
      if (merged.length === 0) {
        const msg = settled.find((s) => s.message)?.message
        setError(msg || 'لم نجد أصنافًا في الصور. جرّب صورة أوضح أو أدخل الأصناف يدويًا.')
        return
      }
      const applied = onExtract(merged)
      setResult(applied)
    } catch {
      setError('حدث خطأ في الشبكة أثناء قراءة القائمة. يمكنك إدخال الأصناف يدويًا.')
    } finally {
      setAnalyzing(false)
      setProgress(null)
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
            صوّر قائمة مطعمك (حتى {MAX_SHOTS} صور — وجه وظهر أو صفحات) وسنستخرج الفئات والأصناف
            والأسعار تلقائيًا. تراجعها وتعدّلها قبل التوليد. لا نضيف أي صور — نقرأ النص فقط.
          </p>
          <p className="mt-1 text-[11px] leading-[1.5] text-muted/80">
            نصيحة: كلما كانت الصورة أوضح وأقرب، كانت القراءة أدقّ. القوائم العريضة نقسمها تلقائيًا
            لنقرأ كل عمود بدقّة.
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
            <div key={s.id} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-token bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.preview} alt={s.name} className="h-full w-full object-cover" />
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
            {analyzing
              ? progress && progress.total > 1
                ? `جارٍ قراءة الصفحة ${Math.min(progress.done + 1, progress.total)} من ${progress.total}…`
                : 'جارٍ قراءة قائمتك…'
              : 'اقرأ القائمة تلقائيًا'}
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
