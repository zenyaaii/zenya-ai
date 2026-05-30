"use client"

import { useState } from 'react'
import LookbookPreview from '@/components/theme/lookbook/LookbookPreview'
import { LOOKBOOK_MOCK_CONTENT } from '@/utils/lookbook/mock-content'
import { LOOKBOOK_PRESETS } from '@/utils/lookbook/presets'
import type { LookbookStylePresetId } from '@/utils/lookbook/types'

export default function LookbookDemoPage() {
  const [preset, setPreset] = useState<LookbookStylePresetId>('noir')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Preset switcher */}
      <div className="fixed right-4 top-4 z-[100] flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/70 p-2 backdrop-blur-xl">
        {LOOKBOOK_PRESETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition"
            style={{
              background: preset === item.id ? item.colors.badge : 'transparent',
              color: preset === item.id ? item.colors.badgeText : 'rgba(255,255,255,0.65)',
              fontWeight: preset === item.id ? 700 : 400
            }}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
      <LookbookPreview content={LOOKBOOK_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
