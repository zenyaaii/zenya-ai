"use client"

import { useState } from 'react'
import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { SERVICE_MOCK_CONTENT } from '@/utils/services/mock-content'
import { SERVICE_PRESETS } from '@/utils/services/presets'
import type { ServiceStylePresetId } from '@/utils/services/types'

export default function ServicesDemoPage() {
  const [preset, setPreset] = useState<ServiceStylePresetId>('cobalt')

  return (
    <div className="min-h-screen" style={{ background: '#0b1220' }}>
      <div className="fixed right-4 top-4 z-50 flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/70 p-2 backdrop-blur-xl">
        {SERVICE_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition"
            style={{
              background: preset === item.id ? item.colors.accent : 'transparent',
              color: preset === item.id ? '#08111d' : 'rgba(255,255,255,0.76)',
              fontWeight: preset === item.id ? 700 : 500
            }}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
      <ServicesPreview content={SERVICE_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
