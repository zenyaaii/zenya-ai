"use client"

import { useState } from 'react'
import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { SERVICE_MOCK_CONTENT } from '@/utils/services/mock-content'
import { SERVICE_PRESETS } from '@/utils/services/presets'
import type { ServiceStylePresetId } from '@/utils/services/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function ServicesDemoPage() {
  const [preset, setPreset] = useState<ServiceStylePresetId>('cobalt')

  return (
    <div className="min-h-screen" style={{ background: '#0b1220' }}>
      <DemoPresetSwitcher presets={SERVICE_PRESETS} active={preset} onChange={setPreset} colorKey="accent" />
      <ServicesPreview content={SERVICE_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
