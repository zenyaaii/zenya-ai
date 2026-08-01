'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { useBookingContext } from './BookingContext'

/**
 * The one booking form, shared by every template.
 *
 * A template renders <BookingForm/> wherever its "احجز / reserve / request"
 * call-to-action lives and passes a small palette so the form matches the
 * surrounding design. Behaviour is identical everywhere:
 *
 *   - Reads slug + entitlement from BookingContext (provided only on the live
 *     public site). In the editor/preview there is no provider, so a submit is
 *     a harmless no-op that still shows the success state.
 *   - POSTs to /api/bookings, which resolves the site + owner and stores the
 *     row the owner reads at /dashboard/bookings.
 *   - Field set depends on `type`.
 *
 * No fabricated content, no fake confirmation — on success it says the request
 * was sent, nothing more.
 */

export type BookingType = 'reservation' | 'appointment' | 'quote' | 'contact'

export type BookingPalette = {
  /** Primary button / focus colour. */
  accent: string
  /** Text colour on top of `accent`. */
  accentText?: string
  /** Body text colour. */
  text: string
  /** Secondary / label text colour. */
  muted: string
  /** Input + card background. */
  surface: string
  /** Border colour for inputs. */
  border: string
  headingFont?: string
  bodyFont?: string
  /** Corner radius in px (default 12). */
  radius?: number
}

/**
 * The site-relative path, matching the analytics beacon's normalisation: the
 * same page is reachable at slug.zenyaai.co/menu, customdomain.com/menu, and
 * localhost/s/slug/menu — only the last carries the /s/<slug> prefix, which
 * would otherwise show up as "/s/slug" in the owner's inbox. Strip it so the
 * recorded path is always the clean, site-relative one.
 */
function sitePath(slug: string | null): string {
  if (typeof window === 'undefined') return '/'
  const p = window.location.pathname || '/'
  if (!slug) return p
  const prefix = `/s/${slug}`
  if (p === prefix) return '/'
  if (p.startsWith(prefix + '/')) return p.slice(prefix.length) || '/'
  return p
}

const AR = {
  name: 'الاسم',
  phone: 'رقم الجوال',
  email: 'البريد الإلكتروني',
  emailOptional: 'البريد الإلكتروني (اختياري)',
  party: 'عدد الأشخاص',
  date: 'التاريخ المفضّل',
  time: 'الوقت المفضّل',
  message: 'رسالتك',
  messageOptional: 'ملاحظات (اختياري)',
  send: {
    reservation: 'إرسال طلب الحجز',
    appointment: 'إرسال طلب الموعد',
    quote: 'إرسال طلب عرض السعر',
    contact: 'إرسال',
  } as Record<BookingType, string>,
  sending: 'جارٍ الإرسال…',
  successTitle: 'تم استلام طلبك',
  successBody: 'سنعاود التواصل معك في أقرب وقت. شكرًا لك.',
  previewNote: 'معاينة — لن يتم إرسال هذا النموذج فعليًا.',
  errName: 'الرجاء إدخال الاسم.',
  errContact: 'الرجاء إدخال رقم الجوال أو البريد الإلكتروني.',
  errMessage: 'الرجاء كتابة تفاصيل طلبك.',
  errServer: 'تعذّر الإرسال، حاول مرة أخرى.',
}

export default function BookingForm({
  type = 'contact',
  palette,
  className,
}: {
  type?: BookingType
  palette: BookingPalette
  className?: string
}) {
  const { slug, preview } = useBookingContext()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [partySize, setPartySize] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')

  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const radius = palette.radius ?? 12
  const accentText = palette.accentText ?? '#ffffff'

  const showParty = type === 'reservation'
  const showDateTime = type === 'reservation' || type === 'appointment'
  const showEmail = type === 'quote' || type === 'contact'
  const messageRequired = type === 'quote'

  function validate(): string | null {
    if (!name.trim()) return AR.errName
    if (!phone.trim() && !email.trim()) return AR.errContact
    if (messageRequired && !message.trim()) return AR.errMessage
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      setStatus('error')
      return
    }
    setError(null)

    // Editor / preview: show the outcome without touching the backend.
    if (preview || !slug) {
      setStatus('done')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          type,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          party_size: partySize ? Number(partySize) : undefined,
          date: date || undefined,
          time: time || undefined,
          message: message.trim() || undefined,
          path: sitePath(slug),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        setStatus('done')
      } else {
        setError(AR.errServer)
        setStatus('error')
      }
    } catch {
      setError(AR.errServer)
      setStatus('error')
    }
  }

  const fieldStyle: CSSProperties = {
    width: '100%',
    padding: '0.75rem 0.9rem',
    borderRadius: radius,
    border: `1px solid ${palette.border}`,
    background: palette.surface,
    color: palette.text,
    fontFamily: palette.bodyFont,
    fontSize: '0.95rem',
    outline: 'none',
    appearance: 'none',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '0.35rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: palette.muted,
    fontFamily: palette.bodyFont,
  }

  if (status === 'done') {
    return (
      <div
        dir="rtl"
        className={className}
        style={{
          border: `1px solid ${palette.border}`,
          background: palette.surface,
          borderRadius: radius + 4,
          padding: '2rem 1.75rem',
          textAlign: 'center',
          fontFamily: palette.bodyFont,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: palette.accent,
            color: accentText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
          }}
          aria-hidden
        >
          ✓
        </div>
        <p
          style={{
            fontFamily: palette.headingFont || palette.bodyFont,
            color: palette.text,
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          {AR.successTitle}
        </p>
        <p style={{ color: palette.muted, fontSize: '0.92rem', lineHeight: 1.6 }}>
          {AR.successBody}
        </p>
        {preview && (
          <p style={{ color: palette.muted, fontSize: '0.72rem', marginTop: '0.9rem', opacity: 0.8 }}>
            {AR.previewNote}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      dir="rtl"
      onSubmit={onSubmit}
      className={className}
      noValidate
      style={{
        display: 'grid',
        gap: '0.9rem',
        textAlign: 'right',
        fontFamily: palette.bodyFont,
      }}
    >
      <div>
        <label style={labelStyle} htmlFor="bk-name">{AR.name}</label>
        <input
          id="bk-name"
          style={fieldStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: showEmail ? '1fr 1fr' : '1fr' }}>
        <div>
          <label style={labelStyle} htmlFor="bk-phone">{AR.phone}</label>
          <input
            id="bk-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            style={{ ...fieldStyle, textAlign: 'right' }}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        {showEmail && (
          <div>
            <label style={labelStyle} htmlFor="bk-email">
              {type === 'contact' ? AR.emailOptional : AR.email}
            </label>
            <input
              id="bk-email"
              type="email"
              dir="ltr"
              style={{ ...fieldStyle, textAlign: 'right' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        )}
      </div>

      {showParty && (
        <div>
          <label style={labelStyle} htmlFor="bk-party">{AR.party}</label>
          <select
            id="bk-party"
            style={fieldStyle}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
          >
            <option value="">—</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}{i + 1 === 12 ? '+' : ''}</option>
            ))}
          </select>
        </div>
      )}

      {showDateTime && (
        <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={labelStyle} htmlFor="bk-date">{AR.date}</label>
            <input
              id="bk-date"
              type="date"
              dir="ltr"
              style={{ ...fieldStyle, textAlign: 'right' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bk-time">{AR.time}</label>
            <input
              id="bk-time"
              type="time"
              dir="ltr"
              style={{ ...fieldStyle, textAlign: 'right' }}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="bk-message">
          {messageRequired ? AR.message : AR.messageOptional}
        </label>
        <textarea
          id="bk-message"
          rows={type === 'quote' ? 4 : 3}
          style={{ ...fieldStyle, resize: 'vertical' }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required={messageRequired}
        />
      </div>

      {status === 'error' && error && (
        <p role="alert" style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          marginTop: '0.25rem',
          padding: '0.85rem 1.5rem',
          borderRadius: radius,
          border: 'none',
          background: palette.accent,
          color: accentText,
          fontFamily: palette.headingFont || palette.bodyFont,
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: status === 'sending' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {status === 'sending' ? AR.sending : AR.send[type]}
      </button>
    </form>
  )
}
