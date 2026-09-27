"use client"

import { useState } from 'react'

export type GoogleFound = { name: string; rating: number; text: string; when: string }
export type GoogleResult = { place: { name: string; rating: number | null; count: number | null; url: string }; reviews: GoogleFound[] }

const GOOGLE_ERRORS: Record<string, string> = {
  not_configured: 'جلب التقييمات من Google غير مفعّل بعد. أضف تقييماتك بيدك تحت.',
  sign_in: 'سجّل دخولك أولًا حتى نجلب تقييماتك.',
  not_google_link: 'هذا ليس رابطًا من Google. انسخ الرابط من خرائط Google.',
  not_found: 'لم نجد نشاطك على Google. تأكد من الرابط.',
  too_many: 'حاولت كثيرًا. جرّب بعد ساعة.',
}

/** Looks the business up on Google and shows its reviews with a tick box on
 *  each, so the owner picks which go on the site. */
export default function GoogleReviewsImport({ url, name, city, onPlace, onImport }: {
  url: string; name: string; city: string
  /** Fills the rating and count the moment Google answers, before any pick. */
  onPlace: (r: GoogleResult) => void
  onImport: (r: GoogleResult, chosen: GoogleFound[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [found, setFound] = useState<GoogleResult | null>(null)
  const [keep, setKeep] = useState<boolean[]>([])
  const [done, setDone] = useState('')

  async function run() {
    setBusy(true); setError(''); setDone(''); setFound(null)
    try {
      const res = await fetch('/api/reviews/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, city }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(GOOGLE_ERRORS[json.error] || 'لم نقدر نجلب التقييمات الآن. جرّب مرة ثانية.'); return }
      const r = json as GoogleResult
      setFound(r); setKeep(r.reviews.map(() => true))
      onPlace(r)
    } catch {
      setError('لم نقدر نجلب التقييمات الآن. جرّب مرة ثانية.')
    } finally {
      setBusy(false)
    }
  }

  function add() {
    if (!found) return
    const chosen = found.reviews.filter((_, i) => keep[i])
    onImport(found, chosen)
    setFound(null)
    setDone(chosen.length ? 'أضفنا ' + chosen.length + ' تقييمات تحت. تقدر تعدّلها الآن أو من لوحة التحكم.' : 'أخذنا التقييم والعدد من Google.')
  }

  const count = keep.filter(Boolean).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <button type="button" className="zb-add" onClick={run} disabled={busy || (!url.trim() && !name.trim())}>
        {busy ? 'نبحث على Google…' : 'اجلب تقييماتي من Google'}
      </button>
      {error ? <p className="zb-note" role="alert" style={{ margin: 0, color: '#b45309', background: 'rgba(217,119,6,0.08)' }}>{error}</p> : null}
      {done ? <p className="zb-note" style={{ margin: 0 }}>{done}</p> : null}
      {found ? (
        <div className="zb-list" style={{ padding: '0.75rem', borderRadius: 12, boxShadow: '0 0 0 1px rgba(17,17,17,0.08)', background: '#fff' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {found.place.name || 'نشاطك'}
            {found.place.rating != null ? ' · ' + found.place.rating.toFixed(1) + ' ★' : ''}
            {found.place.count != null ? ' · ' + found.place.count + ' تقييم' : ''}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#6b6b6b' }}>
            {found.reviews.length ? 'هذه كل التقييمات التي تعطينا إياها Google (5 على الأكثر). أخذنا التقييم والعدد، واختر ما تريد عرضه.' : 'Google لم تعطنا نصوص تقييمات. سنأخذ التقييم والعدد فقط.'}
          </p>
          {found.reviews.map((r, i) => (
            <label key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.625rem', alignItems: 'start', padding: '0.625rem', borderRadius: 10, background: keep[i] ? 'rgba(94,106,210,0.06)' : 'transparent', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!keep[i]} onChange={(e) => setKeep((k) => k.map((v, j) => (j === i ? e.target.checked : v)))} style={{ marginTop: 5, width: 18, height: 18, accentColor: '#5e6ad2' }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span dir="auto" style={{ fontWeight: 700 }}>{r.name} <span style={{ color: '#b7791f', fontWeight: 400 }}>{'★'.repeat(r.rating)}</span>{r.when ? <span style={{ color: '#8a8a8a', fontWeight: 400, fontSize: 13 }}> · {r.when}</span> : null}</span>
                <span dir="auto" style={{ fontSize: 14.5, lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</span>
              </span>
            </label>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="zb-add" onClick={add}>{found.reviews.length ? 'أضف المختارة (' + count + ')' : 'خذ التقييم والعدد'}</button>
            <button type="button" className="zb-quiet" onClick={() => setFound(null)}>إلغاء</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
