'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useNotify } from '@/components/ui/Notify'
import { BookingsScreen, type BookingData } from '@/components/dashboard/screens/bookings'
import { relTime } from '@/components/dashboard/screens/kit'
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
  created_at: string
}

const TYPE_AR: Record<BookingRow['booking_type'], string> = {
  reservation: 'حجز طاولة',
  appointment: 'حجز موعد',
  quote: 'طلب عرض سعر',
  contact: 'طلب تواصل',
}

const STATUS: Record<BookingRow['status'], { label: BookingData['status']; tone: BookingData['tone'] }> = {
  new: { label: 'جديد', tone: 'accent' },
  confirmed: { label: 'مؤكّد', tone: 'ok' },
  done: { label: 'منجز', tone: 'quiet' },
  cancelled: { label: 'ملغى', tone: 'bad' },
}

function party(n: number | null): string {
  if (n == null) return ''
  if (n === 1) return 'شخص واحد'
  if (n === 2) return 'شخصان'
  return `${n} أشخاص`
}

function when(b: BookingRow): string {
  if (b.preferred_date) {
    const d = new Date(b.preferred_date)
    const day = isNaN(d.getTime()) ? b.preferred_date : d.toLocaleDateString('ar', { day: 'numeric', month: 'long' })
    return b.preferred_time ? `${day} · ${b.preferred_time}` : day
  }
  return b.preferred_time || relTime(b.created_at)
}

/** Bookings: the demo's bookings screen, on the owner's real inbox. */
export default function BookingsClient({
  access, bookings, sites,
}: {
  access: BookingAccess
  bookings: BookingRow[]
  sites: SiteMap
}) {
  const router = useRouter()
  const { toast } = useNotify()
  const [filter, setFilter] = useState('all')
  const [starting, setStarting] = useState(false)

  async function startTrial() {
    setStarting(true)
    try {
      const res = await fetch('/api/bookings/trial', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) throw new Error()
      toast({ type: 'success', message: 'بدأت تجربتك المجانية لمدة شهر' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'تعذّر بدء التجربة، حاول مرة أخرى' })
    } finally {
      setStarting(false)
    }
  }

  // The head's state pill: the demo's "مفعّلة", or the real entitlement.
  const aside =
    access.status === 'pro' ? (
      <span className="zy-pill" data-tone="accent"><Sparkles className="h-3 w-3" /> مفعّلة</span>
    ) : access.status === 'trial' ? (
      <>
        <span className="zy-pill" data-tone="accent">تجربة مجانية · {access.daysLeft} يومًا</span>
        <Link href="/checkout?plan=starter" className="zy-btn">الترقية إلى Starter</Link>
      </>
    ) : access.status === 'trial_expired' ? (
      <>
        <span className="zy-pill" data-tone="bad">انتهت التجربة</span>
        <Link href="/checkout?plan=starter" className="zy-btn">الترقية إلى Starter</Link>
      </>
    ) : (
      <button type="button" onClick={startTrial} disabled={starting} className="zy-btn disabled:opacity-60">
        {starting ? 'جارٍ التفعيل…' : 'فعّل الحجوزات · شهر مجاني'}
      </button>
    )

  return (
    <BookingsScreen
      filter={filter}
      setFilter={setFilter}
      aside={aside}
      bookings={bookings.map((b) => ({
        id: String(b.id),
        name: b.name,
        site: sites[b.theme_id] || 'موقع',
        kind: TYPE_AR[b.booking_type] || TYPE_AR.contact,
        when: when(b),
        party: party(b.party_size),
        phone: b.phone || '',
        email: b.email || undefined,
        status: STATUS[b.status].label,
        tone: STATUS[b.status].tone,
        note: b.message || undefined,
      }))}
    />
  )
}
