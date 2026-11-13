'use client'

import { useMemo, useState } from 'react'
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

/**
 * Car colour sets for Anas to pick from (2026-11-13): three blended sets, and
 * two the build makes from the owner's own photos (a night and a day version
 * of the same colours). The photo sets here were measured from one workshop
 * photo with lib/restaurant-build/palette (measure + paletteOf), the same code
 * the build runs on a shop's Google and Instagram photos.
 */
const CAR_PHOTO = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=2000&q=80&auto=format&fit=crop'
const CAR_LOOKS: { id: string; name: string; note: string; colors: Record<string, string>; hero?: string }[] = [
  { id: 'amber', name: 'غرافيت وكهرمان', note: 'ليلي هادئ', colors: { background: '#121416', surface: '#1a1d20', text: '#eeece7', muted: '#97948d', accent: '#e2a33e', accent2: '#7fa0ad', border: '#2a2d30' } },
  { id: 'service', name: 'أبيض الخدمة', note: 'فاتح ونظيف', colors: { background: '#f3f4f2', surface: '#e8eae7', text: '#15191c', muted: '#5c6469', accent: '#1f4f7a', accent2: '#c97a22', border: '#d7dbd8' } },
  { id: 'sand', name: 'رملي وزيتوني', note: 'فاتح دافئ', colors: { background: '#f2efe8', surface: '#e7e2d8', text: '#1d1c18', muted: '#6b665c', accent: '#2f5a4c', accent2: '#b0682a', border: '#dad4c8' } },
  { id: 'photo-night', name: 'من صور الورشة: ليلي', note: 'من صورة المحل', hero: CAR_PHOTO, colors: { background: '#0f1315', surface: '#192124', text: '#e4ecf1', muted: '#9fb1bc', accent: '#6c98b1', border: '#25323a' } },
  { id: 'photo-day', name: 'من صور الورشة: نهاري', note: 'من صورة المحل', hero: CAR_PHOTO, colors: { background: '#f5f7f8', surface: '#e9eef0', text: '#1b2427', muted: '#52686f', accent: '#497288', border: '#d6dfe2' } },
]

/** A small bar to switch the car colour sets on the live page. */
function CarLooks({ at, set }: { at: number; set: (i: number) => void }) {
  return (
    <div dir="rtl" style={{ position: 'fixed', zIndex: 80, top: 'auto', bottom: 92, insetInline: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div role="radiogroup" aria-label="الألوان" style={{ pointerEvents: 'auto', display: 'flex', gap: 6, padding: 6, borderRadius: 999, background: 'rgba(16,17,18,.86)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 10px 30px -12px rgba(0,0,0,.5)', maxWidth: 'calc(100vw - 24px)', overflowX: 'auto' }}>
        {CAR_LOOKS.map((l, i) => (
          <button key={l.id} type="button" role="radio" aria-checked={at === i} title={l.name} onClick={() => set(i)}
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 8px', borderRadius: 999, background: at === i ? '#f3f1ec' : 'transparent', color: at === i ? '#111' : '#e9e7e2', font: '600 13px system-ui', whiteSpace: 'nowrap' }}>
            <span aria-hidden="true" style={{ display: 'flex' }}>{[l.colors.background, l.colors.accent, l.colors.accent2 || l.colors.text].map((c, j) => <i key={j} style={{ width: 16, height: 16, borderRadius: 99, background: c, marginInlineStart: j ? -5 : 0, boxShadow: '0 0 0 1.5px rgba(255,255,255,.7)' }} />)}</span>
            {i + 1}. {l.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function NicheLab({ k, v, fill, p, look }: { k?: string; v?: string; fill?: string; p?: string; look?: string }) {
  const kind = (k && k in VIEWS ? k : null) as LabKind | null
  const f: Fill = fill === 'low' || fill === 'none' ? fill : 'full'
  const start = kind === 'car' && look ? Math.max(0, CAR_LOOKS.findIndex((l) => l.id === look)) : 0
  const [carAt, setCarAt] = useState(start)
  const carLook = kind === 'car' && v !== 'a' && v !== 'b' ? CAR_LOOKS[carAt] : null
  const data = useMemo(() => {
    if (!kind) return null
    const d = labContent(kind, f)
    if (carLook?.hero && d.c.hero.image) d.c = { ...d.c, hero: { ...d.c.hero, image: carLook.hero } }
    return d
  }, [kind, f, carLook?.hero])
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
        <Full content={data.c} x={data.x} initial={p} colors={carLook ? carLook.colors : look ? LOOKS[look] : undefined} />
        {carLook ? <CarLooks at={carAt} set={setCarAt} /> : null}
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
