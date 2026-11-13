'use client'

import { useMemo } from 'react'
import { BookingProvider } from '@/components/site/BookingContext'
import BeautyA from '@/components/theme/services/niche/BeautyA'
import BeautyB from '@/components/theme/services/niche/BeautyB'
import CarA from '@/components/theme/services/niche/CarA'
import CarB from '@/components/theme/services/niche/CarB'
import PhotoA from '@/components/theme/services/niche/PhotoA'
import PhotoB from '@/components/theme/services/niche/PhotoB'
import GymA from '@/components/theme/services/niche/GymA'
import GymB from '@/components/theme/services/niche/GymB'
import GymFull from '@/components/theme/services/niche/GymFull'
import CarFull from '@/components/theme/services/niche/CarFull'
import { labContent, type Fill, type LabKind } from '@/components/theme/services/niche/lab-content'

/** The heavy, many-page themes (2026-11-13). The short samples stay at &v=a / &v=b. */
const FULL: Partial<Record<LabKind, typeof GymFull>> = { gym: GymFull, car: CarFull }
const VIEWS = { beauty: [BeautyA, BeautyB], car: [CarA, CarB], photo: [PhotoA, PhotoB], gym: [GymA, GymB] } as const
const NAMES: Record<LabKind, [string, string, string]> = {
  beauty: ['تجميل وسبا', 'أ: قائمة العناية', 'ب: جلسات'],
  car: ['خدمات السيارات', 'أ: لوحة الورشة', 'ب: تقرير الفحص'],
  photo: ['استوديو تصوير', 'أ: المعرض أولًا', 'ب: الشريط'],
  gym: ['نادٍ رياضي', 'أ: الطاقة', 'ب: الجدول'],
}

export default function NicheLab({ k, v, fill, p }: { k?: string; v?: string; fill?: string; p?: string }) {
  const kind = (k && k in VIEWS ? k : null) as LabKind | null
  const f: Fill = fill === 'low' || fill === 'none' ? fill : 'full'
  const data = useMemo(() => (kind ? labContent(kind, f) : null), [kind, f])
  if (!kind || !data) {
    return (
      <main dir="rtl" style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 720, margin: '0 auto', lineHeight: 1.9 }}>
        <h1>عينة القوالب</h1>
        {(Object.keys(VIEWS) as LabKind[]).map((key) => (
          <p key={key}><b>{NAMES[key][0]}:</b> {FULL[key] ? <a href={`?k=${key}`} style={{ marginInlineStart: 12 }}>الثيم الكامل</a> : null} {[0, 1].map((i) => <a key={i} href={`?k=${key}&v=${i ? 'b' : 'a'}`} style={{ marginInlineStart: 12 }}>{NAMES[key][i + 1]}</a>)}</p>
        ))}
        <p>أضف <code>&fill=low</code> أو <code>&fill=none</code> لترى الموقع حين يجيب صاحب المحل عن القليل أو لا شيء.</p>
      </main>
    )
  }
  const Full = FULL[kind]
  if (Full && v !== 'a' && v !== 'b') {
    return (
      <BookingProvider slug="" enabled preview>
        <Full content={data.c} x={data.x} initial={p} />
      </BookingProvider>
    )
  }
  const View = VIEWS[kind][v === 'b' ? 1 : 0]
  return (
    <BookingProvider slug="" enabled preview>
      <View content={data.c} x={data.x} />
    </BookingProvider>
  )
}
