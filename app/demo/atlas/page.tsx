"use client"

import { useState } from 'react'
import AtlasPreview from '@/components/theme/atlas/AtlasPreview'
import { ATLAS_MOCK_CONTENT } from '@/utils/atlas/mock-content'
import { ATLAS_PRESETS } from '@/utils/atlas/presets'
import type { AtlasStylePresetId } from '@/utils/atlas/types'

export default function AtlasDemoPage() {
  const [preset, setPreset] = useState<AtlasStylePresetId>('orbit')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Preset switcher */}
      <div className="fixed right-4 top-4 z-50 flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/70 p-2 backdrop-blur-xl">
        {ATLAS_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition"
            style={{
              background: preset === item.id ? item.colors.primary : 'transparent',
              color: preset === item.id ? '#ffffff' : 'rgba(255,255,255,0.65)',
              fontWeight: preset === item.id ? 700 : 400
            }}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
      <AtlasPreview content={ATLAS_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
