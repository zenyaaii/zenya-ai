"use client"

import { useState } from 'react'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import { WELLNESS_MOCK_CONTENT } from '@/utils/wellness/mock-content'
import { WELLNESS_PRESETS } from '@/utils/wellness/presets'
import type { WellnessStylePresetId } from '@/utils/wellness/types'

export default function WellnessDemoPage() {
  const [preset, setPreset] = useState<WellnessStylePresetId>('zen')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Preset switcher */}
      <div className="fixed right-4 top-4 z-50 flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/70 p-2 backdrop-blur-xl">
        {WELLNESS_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition"
            style={{
              background: preset === item.id ? item.colors.accent : 'transparent',
              color: preset === item.id ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
              fontWeight: preset === item.id ? 700 : 400
            }}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
      <WellnessPreview content={WELLNESS_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
