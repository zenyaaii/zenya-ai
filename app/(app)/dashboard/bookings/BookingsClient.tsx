'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingAccess } from '@/lib/booking-entitlement'
import V6Bookings, { dayOffset, type BkStatus, type V6Booking } from '@/components/app/v6/pages/Bookings'
import { useSite } from '@/components/app/v6/site'
import { useV6 } from '@/components/app/v6/ui'
import { useDashboardPath } from '@/components/app/useDashboardPath'
import { editContent } from '@/components/app/v6/edit-content'
import { bookingsPaused, withSwitch } from '@/lib/site-switches'

export type SiteMap = Record<string, { name: string; bookable: boolean; live: boolean }>

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

const TO_V6: Record<BookingRow['status'], BkStatus> = { new: 'new', confirmed: 'ok', done: 'done', cancelled: 'cancel' }
const FROM_V6: Record<BkStatus, BookingRow['status']> = { new: 'new', ok: 'confirmed', done: 'done', cancel: 'cancelled' }

function asV6(b: BookingRow, sites: SiteMap): V6Booking {
  return {
    id: String(b.id),
    name: b.name || 'زائر',
    phone: b.phone,
    email: b.email,
    note: b.message,
    people: b.party_size,
    d: dayOffset(b.preferred_date, b.created_at),
    time: (b.preferred_time || '').slice(0, 12),
    st: TO_V6[b.status] || 'new',
    kind: TYPE_AR[b.booking_type] || TYPE_AR.contact,
    site: sites[b.theme_id]?.name || 'موقع',
  }
}

/** A day offset as YYYY-MM-DD in the owner's own calendar. */
function isoDay(d: number) {
  const x = new Date(Date.now() + d * 864e5)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

/** Bookings: the v6 design's bookings page, on the owner's real inbox. */
export default function BookingsClient({
  access, bookings, sites,
}: {
  access: BookingAccess
  bookings: BookingRow[]
  sites: SiteMap
}) {
  const router = useRouter()
  const { toast } = useV6()
  const ctx = useSite()
  const { linkTo } = useDashboardPath()
  const list = useMemo(() => bookings.map((b) => asV6(b, sites)), [bookings, sites])

  // New bookings are filed under the current site when it takes bookings,
  // else under the first site that does.
  const ids = Object.keys(sites)
  const target = (ctx?.siteId && sites[ctx.siteId]?.bookable ? ctx.siteId : null)
    || ids.find((id) => sites[id].bookable && sites[id].live) || ids.find((id) => sites[id].bookable) || null

  const t = target ? ctx?.themes?.find((x) => x.id === target) : null
  const [paused, setPaused] = useState<boolean | null>(null)
  const receiving = access.entitled && !(paused ?? bookingsPaused(t?.content))

  async function setReceiving(on: boolean): Promise<string | null> {
    if (!target) return 'لا موقع يستقبل الحجوزات بعد'
    if (on && !access.entitled) {
      if (access.status === 'trial_expired') return 'انتهت التجربة المجانية. اشترك لتفعيل الحجز'
      const res = await fetch('/api/bookings/trial', { method: 'POST' }).catch(() => null)
      const data = res ? await res.json().catch(() => ({})) : {}
      if (!res?.ok || !data?.ok) return 'تعذّر تفعيل الحجز. حاول مرة أخرى.'
      router.refresh()
    }
    const saved = await editContent(target, (c) => withSwitch(c, 'bookings_off', !on))
    if (!saved) return 'تعذّر الحفظ. حاول مرة أخرى.'
    setPaused(!on)
    ctx?.reload()
    return null
  }

  return (
    <V6Bookings
      bookings={list}
      receiving={receiving}
      setReceiving={target ? setReceiving : null}
      siteName={target ? sites[target].name : null}
      setStatus={async (id, st) => {
        const r = await fetch(`/api/bookings/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: FROM_V6[st] }),
        }).catch(() => null)
        return !!r?.ok
      }}
      create={target ? async (b) => {
        const r = await fetch('/api/bookings/manual', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_id: target, name: b.name, phone: b.phone, date: isoDay(b.d), time: b.time, party_size: b.people, message: b.note }),
        }).catch(() => null)
        const j = r?.ok ? await r.json().catch(() => null) : null
        return j?.booking ? asV6(j.booking as BookingRow, sites) : null
      } : null}
      undoCreate={async (id) => {
        const r = await fetch(`/api/bookings/manual?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null)
        return !!r?.ok
      }}
      links={{ settings: { href: linkTo('/dashboard/settings') } }}
    />
  )
}
