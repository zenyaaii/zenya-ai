'use client'

import { useEffect, useRef, useState } from 'react'
import { suggestSlugFrom, validateSlug, slugErrorMessage, normalizeSlug } from '@/lib/slug'

type Theme = {
  id: string
  product_name: string
  slug?: string | null
  is_published?: boolean
}

type Availability =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'taken' }
  | { state: 'invalid'; message: string }

export default function PublishSiteModal({
  theme,
  hasHosting,
  onClose,
  onPublished,
}: {
  theme: Theme
  hasHosting: boolean
  onClose: () => void
  onPublished: (slug: string, url: string) => void
}) {
  const [slug, setSlug] = useState(theme.slug || suggestSlugFrom(theme.product_name))
  const [availability, setAvailability] = useState<Availability>({ state: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced availability check
  useEffect(() => {
    const trimmed = slug.trim().toLowerCase()
    if (!trimmed) {
      setAvailability({ state: 'idle' })
      return
    }
    const v = validateSlug(trimmed)
    if (!v.ok) {
      setAvailability({ state: 'invalid', message: slugErrorMessage(v.reason) })
      return
    }
    setAvailability({ state: 'checking' })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/slug/check?slug=${encodeURIComponent(trimmed)}`)
        const j = await r.json()
        if (j.available) setAvailability({ state: 'ok' })
        else if (j.reason) setAvailability({ state: 'invalid', message: slugErrorMessage(j.reason as any) || 'غير متاح' })
        else setAvailability({ state: 'taken' })
      } catch {
        setAvailability({ state: 'invalid', message: 'فشل الفحص — حاول مجددًا' })
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [slug])

  async function publish() {
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch(`/api/themes/${theme.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase() }),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 402) {
          setError(j.message || 'باقة الاستضافة مطلوبة.')
        } else if (r.status === 409) {
          setAvailability({ state: 'taken' })
          setError(j.message || 'المُعرّف محجوز بالفعل.')
        } else {
          setError(j.message || j.error || 'تعذّر النشر.')
        }
        return
      }
      onPublished(j.slug, j.url)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'خطأ في الشبكة')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = availability.state === 'ok' && hasHosting && !submitting

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="انشر موقعك"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(15,15,18,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'white', borderRadius: 16,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.30)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1c1c1c' }}>
          النشر على زينيا
        </h2>
        <p style={{ margin: '6px 0 18px', fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.55 }}>
          اختر معرّفًا للرابط. سيكون موقعك منشورًا على{' '}
          <code dir="ltr" style={{ background: '#f3f0e8', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>
            zenyaai.co/s/{slug || 'your-slug'}
          </code>
          .
        </p>

        <label htmlFor="slug-input" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b6b6b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          معرّف الرابط
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="slug-input"
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(normalizeSlug(e.target.value))}
            autoFocus
            placeholder="my-cool-site"
            style={{
              width: '100%',
              padding: '11px 13px',
              fontSize: 14,
              border: '1px solid #e5e2d9',
              borderRadius: 8,
              outline: 'none',
              fontFamily: 'inherit',
              color: '#1c1c1c',
            }}
          />
          <AvailabilityHint state={availability} />
        </div>

        {!hasHosting && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              background: 'rgba(94,106,210,0.08)',
              border: '1px solid rgba(94,106,210,0.18)',
              borderRadius: 8,
              fontSize: 13,
              color: '#5e6ad2',
              lineHeight: 1.55,
            }}
          >
            يتطلّب النشر <strong>باقة الاستضافة (19.99$ شهريًا)</strong>.{' '}
            <a href="/checkout?plan=hosting" style={{ color: '#5e6ad2', textDecoration: 'underline' }}>
              الترقية ←
            </a>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.20)', borderRadius: 8, fontSize: 13, color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 14px', fontSize: 13.5, fontWeight: 500,
              background: 'transparent', color: '#6b6b6b',
              border: '1px solid #e5e2d9', borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!canSubmit}
            style={{
              padding: '9px 16px', fontSize: 13.5, fontWeight: 600,
              background: canSubmit ? '#5e6ad2' : '#c5c2bb',
              color: 'white',
              border: 'none', borderRadius: 8,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 4px 14px rgba(94,106,210,0.25)' : 'none',
            }}
          >
            {submitting ? 'جارٍ النشر…' : 'نشر الموقع'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AvailabilityHint({ state }: { state: Availability }) {
  if (state.state === 'idle') return null
  const styles: React.CSSProperties = {
    position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)',
    fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
  }
  if (state.state === 'checking') {
    return <span style={{ ...styles, color: '#9b9b9b' }}>جارٍ الفحص…</span>
  }
  if (state.state === 'ok') {
    return <span style={{ ...styles, color: '#15803d' }}>متاح ✓</span>
  }
  if (state.state === 'taken') {
    return <span style={{ ...styles, color: '#b91c1c' }}>محجوز</span>
  }
  return <span style={{ ...styles, color: '#b91c1c' }} title={state.message}>غير صالح</span>
}
