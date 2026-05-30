"use client"

import { useState } from 'react'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type { RestaurantStylePresetId } from '@/utils/restaurant/types'

export default function RestaurantDemoPage() {
  const [preset, setPreset] = useState<RestaurantStylePresetId>('onyx')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0c' }}>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-2 rounded-full bg-black/80 backdrop-blur border border-white/15 shadow-2xl">
        {RESTAURANT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className="px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] rounded-full transition"
            style={{
              background: preset === p.id ? p.colors.accent : 'transparent',
              color: preset === p.id ? '#0a0a0c' : 'rgba(255,255,255,0.7)',
              fontWeight: preset === p.id ? 600 : 400
            }}
            title={p.description}
          >
            {p.name}
          </button>
        ))}
      </div>
      <RestaurantPreview content={RESTAURANT_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
