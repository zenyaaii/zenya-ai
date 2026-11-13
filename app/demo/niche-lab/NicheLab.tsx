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
import PhotoFull from '@/components/theme/services/niche/PhotoFull'
import BeautyFull from '@/components/theme/services/niche/BeautyFull'
import { PHOTO_LOOKS } from '@/components/theme/services/niche/photo-looks'
import { labContent, type Fill, type LabKind } from '@/components/theme/services/niche/lab-content'

/** The heavy, many-page themes (2026-11-13). The short samples stay at &v=a / &v=b. */
const FULL: Partial<Record<LabKind, typeof GymFull>> = { gym: GymFull, car: CarFull, photo: PhotoFull, beauty: BeautyFull }
const VIEWS = { beauty: [BeautyA, BeautyB], car: [CarA, CarB], photo: [PhotoA, PhotoB], gym: [GymA, GymB] } as const
const NAMES: Record<LabKind, [string, string, string]> = {
  beauty: ['تجميل وسبا', 'أ: قائمة العناية', 'ب: جلسات'],
  car: ['خدمات السيارات', 'أ: لوحة الورشة', 'ب: تقرير الفحص'],
  photo: ['استوديو تصوير', 'أ: المعرض أولًا', 'ب: الشريط'],
  gym: ['نادٍ رياضي', 'أ: الطاقة', 'ب: الجدول'],
}

/** Colour sets for the gym sample: the theme's own, a light one, and one as it would come from a gym's photos with a second colour. */
const LOOKS: Record<string, Record<string, string>> = {
  day: { background: '#f3f3ef', surface: '#e8e8e2', text: '#121314', muted: '#5f6368', accent: '#1f45d6', border: '#d9d9d2', accent2: '#ff5b24' },
  photo: { background: '#111518', surface: '#192024', text: '#eef1ee', muted: '#8a9396', accent: '#c9f23a', border: '#263035', accent2: '#3fb6a8' },
}

export default function NicheLab({ k, v, fill, p, look }: { k?: string; v?: string; fill?: string; p?: string; look?: string }) {
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
        <Full content={data.c} x={data.x} initial={p} colors={look ? (kind === 'photo' ? PHOTO_LOOKS[look] : undefined) ?? LOOKS[look] : undefined} />
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
