"use client"

import { useState } from 'react'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type { RestaurantContent, RestaurantStylePresetId } from '@/utils/restaurant/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'
import { BookingProvider } from '@/components/site/BookingContext'

// The demo shows what a generated site shows: the booking form (drawn as on a
// live site, never sent) and the moving wall of photos and reviews.
const DEMO: RestaurantContent = {
  ...RESTAURANT_MOCK_CONTENT,
  reservations: { ...RESTAURANT_MOCK_CONTENT.reservations, provider: { type: 'form' } },
  google_wall: RESTAURANT_MOCK_CONTENT.google_wall ?? {
    photos: [
      ...RESTAURANT_MOCK_CONTENT.gallery.images.map((g) => g.url),
      ...RESTAURANT_MOCK_CONTENT.signature_dishes.map((d) => d.image).filter(Boolean) as string[],
    ],
    reviews: RESTAURANT_MOCK_CONTENT.reviews.testimonials.map((t) => ({ name: t.name, rating: t.rating, text: t.text })),
  },
}

export default function RestaurantDemoPage() {
  const [preset, setPreset] = useState<RestaurantStylePresetId>('onyx')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0c' }}>
      <DemoPresetSwitcher presets={RESTAURANT_PRESETS} active={preset} onChange={setPreset} colorKey="accent" />
      <BookingProvider slug="demo" enabled preview>
        <RestaurantPreview content={DEMO} presetId={preset} />
      </BookingProvider>
    </div>
  )
}
