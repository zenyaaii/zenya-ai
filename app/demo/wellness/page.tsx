"use client"

import { useState } from 'react'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import { WELLNESS_MOCK_CONTENT } from '@/utils/wellness/mock-content'
import { WELLNESS_PRESETS } from '@/utils/wellness/presets'
import type { WellnessStylePresetId } from '@/utils/wellness/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function WellnessDemoPage() {
  const [preset, setPreset] = useState<WellnessStylePresetId>('zen')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <DemoPresetSwitcher presets={WELLNESS_PRESETS} active={preset} onChange={setPreset} colorKey="accent" />
      <WellnessPreview content={WELLNESS_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
