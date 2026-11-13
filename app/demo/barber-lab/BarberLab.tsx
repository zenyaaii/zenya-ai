'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import NicheView from '@/components/theme/services/NicheView'
import BarberA from '@/components/theme/services/barber/BarberA'
import BarberB from '@/components/theme/services/barber/BarberB'
import { barberDemoContent } from '@/utils/services/niche-demo'
import { buildBarberContent } from '@/utils/services/barber'
import { KIND } from '@/utils/services/kinds'

/** A shop that answered almost nothing: name, city, phone, one service. Every design must still stand. */
function lowContent() {
  return buildBarberContent({
    kind: 'barber', name: 'صالون الأستاذ', city: 'عمّان', phone: '+962 79 000 0000', whatsapp: '+962790000000',
    links: [], barbers: [], services: [{ name: 'قص شعر' }], booking: { mode: 'both' },
    hours: [], photos: {}, faq: [], terms: [],
  } as never, {})
}

function Lab() {
  const q = useSearchParams()
  const v = q.get('v') || 'a'
  const lookId = q.get('look')
  const fill = q.get('fill') || 'full'
  const content = useMemo(() => (fill === 'low' ? lowContent() : barberDemoContent()), [fill])
  const looks = KIND.barber.looks
  // A light look for design B: the sample proposes it as a new choice in the colour list.
  const forest = { background: '#f4f4f1', surface: '#e8e9e4', text: '#121413', muted: '#5d615d', accent: '#1f4d3a', primary: '#1f4d3a', border: '#d8dad4' }
  const look = looks.find((l) => l.id === lookId) || (lookId === 'forest' || (!lookId && v === 'b') ? { colors: forest } : looks[0])
  const View = v === 'b' ? BarberB : v === 'now' ? NicheView : BarberA
  return <View content={content} colors={look.colors} />
}

export default function BarberLab() {
  return <Suspense fallback={null}><Lab /></Suspense>
}
