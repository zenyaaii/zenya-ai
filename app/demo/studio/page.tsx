"use client"

import { useState } from 'react'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import { STUDIO_MOCK_CONTENT } from '@/utils/studio/mock-content'
import { STUDIO_PRESETS } from '@/utils/studio/presets'
import type { StudioStylePresetId } from '@/utils/studio/types'

export default function StudioDemoPage() {
  const [preset, setPreset] = useState<StudioStylePresetId>('ink')

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Preset switcher */}
      <div className="fixed right-4 top-4 z-[100] flex flex-wrap items-center gap-2 rounded-full border border-black/15 bg-white/80 p-2 backdrop-blur-xl">
        {STUDIO_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition"
            style={{
              background: preset === item.id ? item.colors.primary : 'transparent',
              color: preset === item.id ? item.colors.background : 'rgba(0,0,0,0.55)',
              fontWeight: preset === item.id ? 700 : 400
            }}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
      <StudioPreview content={STUDIO_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
