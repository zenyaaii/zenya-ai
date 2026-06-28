"use client"

import { useState } from 'react'
import AtlasPreview from '@/components/theme/atlas/AtlasPreview'
import { ATLAS_MOCK_CONTENT } from '@/utils/atlas/mock-content'
import { ATLAS_PRESETS } from '@/utils/atlas/presets'
import type { AtlasStylePresetId } from '@/utils/atlas/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function AtlasDemoPage() {
  const [preset, setPreset] = useState<AtlasStylePresetId>('orbit')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <DemoPresetSwitcher presets={ATLAS_PRESETS} active={preset} onChange={setPreset} colorKey="primary" />
      <AtlasPreview content={ATLAS_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
