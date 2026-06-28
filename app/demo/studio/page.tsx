"use client"

import { useState } from 'react'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import { STUDIO_MOCK_CONTENT } from '@/utils/studio/mock-content'
import { STUDIO_PRESETS } from '@/utils/studio/presets'
import type { StudioStylePresetId } from '@/utils/studio/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function StudioDemoPage() {
  const [preset, setPreset] = useState<StudioStylePresetId>('ink')

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      <DemoPresetSwitcher presets={STUDIO_PRESETS} active={preset} onChange={setPreset} colorKey="primary" />
      <StudioPreview content={STUDIO_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
