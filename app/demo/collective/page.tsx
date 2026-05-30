"use client"

import { useState } from 'react'
import CollectivePreview from '@/components/theme/collective/CollectivePreview'
import { COLLECTIVE_MOCK_CONTENT } from '@/utils/collective/mock-content'
import { COLLECTIVE_PRESETS } from '@/utils/collective/presets'
import type { CollectiveStylePresetId } from '@/utils/collective/types'

export default function CollectiveDemoPage() {
  const [preset, setPreset] = useState<CollectiveStylePresetId>('jade')

  return (
    <div className="min-h-screen" style={{ background: '#060f0c' }}>
      {/* Preset switcher */}
      <div className="fixed right-4 top-4 z-[100] flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/70 p-2 backdrop-blur-xl">
        {COLLECTIVE_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition"
            style={{
              background: preset === item.id ? item.colors.primary : 'transparent',
              color: preset === item.id ? item.colors.textInverse : 'rgba(255,255,255,0.65)',
              fontWeight: preset === item.id ? 700 : 400
            }}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
      <CollectivePreview content={COLLECTIVE_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
