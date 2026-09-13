'use client'

import type { ReactNode } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import { EmptyHint, Page, PageHead, type Tone } from './kit'

export type BookingData = {
  id: string
  name: string
  site: string
  kind: string
  when: string
  party: string
  phone: string
  /** A booking can arrive with an email and no phone; it is still a way back. */
  email?: string
  status: 'جديد' | 'مؤكّد' | 'منجز' | 'ملغى'
  tone: Tone
  note?: string
}

const STATUSES = ['جديد', 'مؤكّد', 'منجز', 'ملغى'] as const

export function BookingsScreen({
  bookings, filter, setFilter, aside,
}: {
  bookings: BookingData[]
  filter: string
  setFilter: (f: string) => void
  /** The state pill in the head: مفعّلة on the demo, the real entitlement here. */
  aside?: ReactNode
}) {
  const rows = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)
  const count = (s: string) => bookings.filter((b) => b.status === s).length
  return (
    <Page>
      <PageHead
        title="الحجوزات"
        sub="كل طلبات الحجز والمواعيد التي يرسلها زوّار مواقعك تصلك هنا."
        icon={CalendarCheck}
        aside={aside}
      />
      <Segmented
        className="mb-4"
        label="تصفية حسب الحالة"
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'all', label: `الكل ${bookings.length}` },
          ...STATUSES.map((s) => ({ key: s, label: `${s} ${count(s)}` })),
        ]}
      />
      <ul className="space-y-3">
        {rows.map((b) => (
          <li key={b.id} className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-black leading-[1.5] text-[#171717]">{b.name}</span>
                  <span className="zy-pill" data-tone="quiet">{b.kind}</span>
                </div>
                <p className="mt-1 truncate text-[14.5px] font-medium leading-[1.7] text-[#66666e]">{b.site}</p>
              </div>
              <span className="zy-pill shrink-0" data-tone={b.tone}>{b.status}</span>
            </div>
            {/* Wraps rather than scrolls: three facts, each of which must stay
                whole, on a screen that can only hold two of them per line. */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[14.5px] font-medium text-[#171717]">
              {b.phone && (
                <a href={`tel:${b.phone}`} dir="ltr" className="tabular-nums hover:text-[#5e6ad2]">{b.phone}</a>
              )}
              {b.email && (
                <a href={`mailto:${b.email}`} dir="ltr" className="min-w-0 truncate hover:text-[#5e6ad2]">{b.email}</a>
              )}
              {b.party && <span>{b.party}</span>}
              {b.when && <span>{b.when}</span>}
            </div>
            {b.note && (
              <p className="mt-3 rounded-[10px] bg-[#f4f4f6] px-3 py-2.5 text-[14.5px] font-medium leading-[1.8] text-[#56565a]">
                {b.note}
              </p>
            )}
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <EmptyHint>{bookings.length === 0 ? 'لا حجوزات بعد. تصلك هنا فور أن يرسلها زوّار مواقعك.' : 'لا حجوزات في هذه الحالة.'}</EmptyHint>
      )}
    </Page>
  )
}
