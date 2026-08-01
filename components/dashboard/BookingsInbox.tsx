'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarCheck, Phone, Mail, Users, Clock, MapPin, Sparkles, Lock, ArrowUpRight,
} from 'lucide-react'
import { useNotify } from '@/components/ui/Notify'
import type { BookingAccess } from '@/lib/booking-entitlement'

export type SiteMap = Record<string, string>

export type BookingRow = {
  id: number
  theme_id: string
  booking_type: 'reservation' | 'appointment' | 'quote' | 'contact'
  name: string
  phone: string | null
  email: string | null
  message: string | null
  party_size: number | null
  preferred_date: string | null
  preferred_time: string | null
  status: 'new' | 'confirmed' | 'cancelled' | 'done'
  source_path: string | null
  country: string | null
  created_at: string
}

type StatusKey = BookingRow['status']

const TYPE_AR: Record<BookingRow['booking_type'], string> = {
  reservation: 'حجز طاولة',
  appointment: 'حجز موعد',
  quote: 'طلب عرض سعر',
  contact: 'طلب تواصل',
}

const STATUS_AR: Record<StatusKey, string> = {
  new: 'جديد',
  confirmed: 'مؤكّد',
  cancelled: 'ملغى',
  done: 'منجز',
}

const STATUS_STYLE: Record<StatusKey, { bg: string; fg: string }> = {
  new:       { bg: 'rgba(94,106,210,0.12)', fg: '#4954c9' },
  confirmed: { bg: 'rgba(39,166,68,0.12)',  fg: '#15803d' },
  cancelled: { bg: 'rgba(220,38,38,0.10)',  fg: '#b91c1c' },
  done:      { bg: 'rgba(28,28,28,0.07)',   fg: '#57534e' },
}

const STATUS_ORDER: StatusKey[] = ['new', 'confirmed', 'done', 'cancelled']

export default function BookingsInbox({
  access,
  bookings: initial,
  sites,
  hasSites,
}: {
  access: BookingAccess
  bookings: BookingRow[]
  sites: SiteMap
  hasSites: boolean
}) {
  const router = useRouter()
  const notify = useNotify()
  const [bookings, setBookings] = useState<BookingRow[]>(initial)
  const [filter, setFilter] = useState<StatusKey | 'all'>('all')
  const [starting, setStarting] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length, new: 0, confirmed: 0, cancelled: 0, done: 0 }
    for (const b of bookings) c[b.status] = (c[b.status] || 0) + 1
    return c
  }, [bookings])

  const visible = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  async function startTrial() {
    setStarting(true)
    try {
      const res = await fetch('/api/bookings/trial', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        notify.toast({ type: 'success', message: 'بدأت تجربتك المجانية لمدة شهر' })
        router.refresh()
      } else {
        notify.toast({ type: 'error', message: 'تعذّر بدء التجربة، حاول مرة أخرى' })
      }
    } catch {
      notify.toast({ type: 'error', message: 'تعذّر بدء التجربة، حاول مرة أخرى' })
    } finally {
      setStarting(false)
    }
  }

  async function changeStatus(id: number, status: StatusKey) {
    const prev = bookings
    setSavingId(id)
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)))
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) throw new Error()
    } catch {
      setBookings(prev) // roll back
      notify.toast({ type: 'error', message: 'تعذّر تحديث الحالة' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <CalendarCheck className="h-5 w-5 text-primary" />
            الحجوزات
          </h1>
          <p className="mt-1 text-sm text-muted">
            كل طلبات الحجز والمواعيد التي يرسلها زوّار مواقعك تصلك هنا.
          </p>
        </div>
        {access.status === 'pro' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(94,106,210,0.10)] px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Pro
          </span>
        )}
      </div>

      <AccessBanner access={access} starting={starting} onStart={startTrial} />

      {/* Locked with no trial started: show the feature pitch, nothing else. */}
      {access.status === 'locked' ? null : (
        <>
          {/* Filter chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', ...STATUS_ORDER] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={
                  'rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ' +
                  (filter === k
                    ? 'bg-[rgba(94,106,210,0.12)] text-primary'
                    : 'text-muted hover:bg-[rgba(28,28,28,0.04)]')
                }
              >
                {k === 'all' ? 'الكل' : STATUS_AR[k]}
                <span className="ms-1.5 opacity-60">{counts[k] || 0}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState hasAny={bookings.length > 0} hasSites={hasSites} />
          ) : (
            <ul className="space-y-3">
              {visible.map((b) => (
                <BookingCard
                  key={b.id}
                  b={b}
                  siteName={sites[b.theme_id] || 'موقع'}
                  saving={savingId === b.id}
                  onStatus={(s) => changeStatus(b.id, s)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function AccessBanner({
  access, starting, onStart,
}: {
  access: BookingAccess
  starting: boolean
  onStart: () => void
}) {
  if (access.status === 'pro') return null

  if (access.status === 'trial') {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-token bg-[rgba(94,106,210,0.05)] px-4 py-3">
        <p className="text-sm text-foreground">
          <span className="font-semibold">تجربة مجانية</span> — تبقّى{' '}
          <span className="font-bold text-primary">{access.daysLeft}</span> يومًا. الحجوزات ميزة في باقة Pro.
        </p>
        <Link href="/pricing" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">
          الترقية إلى Pro <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  if (access.status === 'trial_expired') {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.05)] px-4 py-3">
        <p className="text-sm text-foreground">
          <span className="font-semibold">انتهت تجربتك المجانية.</span>{' '}
          توقّف استقبال الحجوزات الجديدة على مواقعك — رقِّ إلى Pro لإعادة تفعيلها.
        </p>
        <Link href="/pricing" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">
          الترقية إلى Pro <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  // locked — never started
  return (
    <div className="mb-6 rounded-2xl border border-token bg-white p-6 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(94,106,210,0.10)]">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-foreground">فعّل الحجوزات على مواقعك</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        استقبل حجوزات الطاولات والمواعيد وطلبات عروض الأسعار مباشرة من زوّار مواقعك، وتابعها كلها من هنا.
        الحجوزات ميزة في باقة Pro — وتحصل على <span className="font-semibold text-foreground">شهر مجاني</span> لتجربتها.
      </p>
      <button
        onClick={onStart}
        disabled={starting}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {starting ? 'جارٍ التفعيل…' : 'ابدأ الشهر المجاني'}
      </button>
    </div>
  )
}

function BookingCard({
  b, siteName, saving, onStatus,
}: {
  b: BookingRow
  siteName: string
  saving: boolean
  onStatus: (s: StatusKey) => void
}) {
  const st = STATUS_STYLE[b.status]
  const created = new Date(b.created_at)
  const createdLabel = isNaN(created.getTime())
    ? ''
    : created.toLocaleDateString('ar', { day: 'numeric', month: 'short' }) +
      ' · ' +
      created.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })

  return (
    <li className="rounded-xl border border-token bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-foreground">{b.name}</span>
            <span className="rounded-full bg-[rgba(28,28,28,0.05)] px-2 py-0.5 text-[11px] font-medium text-muted">
              {TYPE_AR[b.booking_type]}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {siteName}{createdLabel ? ` · ${createdLabel}` : ''}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: st.bg, color: st.fg }}
        >
          {STATUS_AR[b.status]}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-foreground">
        {b.phone && (
          <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary" dir="ltr">
            <Phone className="h-3.5 w-3.5 text-muted" /> {b.phone}
          </a>
        )}
        {b.email && (
          <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 hover:text-primary" dir="ltr">
            <Mail className="h-3.5 w-3.5 text-muted" /> {b.email}
          </a>
        )}
        {b.party_size != null && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted" /> {b.party_size} أشخاص
          </span>
        )}
        {(b.preferred_date || b.preferred_time) && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted" />
            {[b.preferred_date, b.preferred_time].filter(Boolean).join(' · ')}
          </span>
        )}
        {b.source_path && b.source_path !== '/' && (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <MapPin className="h-3.5 w-3.5" /> {b.source_path}
          </span>
        )}
      </div>

      {b.message && (
        <p className="mt-3 rounded-lg bg-[rgba(28,28,28,0.03)] px-3 py-2 text-[13px] leading-relaxed text-foreground">
          {b.message}
        </p>
      )}

      {/* Status control */}
      <div className="mt-3.5 flex items-center gap-2 border-t border-token pt-3">
        <span className="text-[11.5px] text-muted">الحالة</span>
        <select
          value={b.status}
          disabled={saving}
          onChange={(e) => onStatus(e.target.value as StatusKey)}
          className="rounded-md border border-token bg-white px-2 py-1 text-[12.5px] text-foreground outline-none focus:border-primary disabled:opacity-60"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_AR[s]}</option>
          ))}
        </select>
      </div>
    </li>
  )
}

function EmptyState({ hasAny, hasSites }: { hasAny: boolean; hasSites: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-token bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(28,28,28,0.04)]">
        <CalendarCheck className="h-5 w-5 text-muted" />
      </div>
      <p className="text-sm font-semibold text-foreground">
        {hasAny ? 'لا توجد حجوزات بهذه الحالة' : 'لا توجد حجوزات بعد'}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
        {hasAny
          ? 'جرّب تبديل الفلتر بالأعلى لعرض حجوزات بحالة أخرى.'
          : hasSites
            ? 'بمجرد أن يرسل أحد زوّار موقعك طلب حجز، سيظهر هنا فورًا.'
            : 'انشر موقعًا أولًا، وسيبدأ استقبال الحجوزات من زوّارك.'}
      </p>
    </div>
  )
}
