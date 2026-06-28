"use client"

import { useState } from 'react'
import CollectivePreview from '@/components/theme/collective/CollectivePreview'
import { COLLECTIVE_MOCK_CONTENT } from '@/utils/collective/mock-content'
import { COLLECTIVE_PRESETS } from '@/utils/collective/presets'
import type { CollectiveStylePresetId } from '@/utils/collective/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function CollectiveDemoPage() {
  const [preset, setPreset] = useState<CollectiveStylePresetId>('jade')

  return (
    <div className="min-h-screen" style={{ background: '#060f0c' }}>
      <DemoPresetSwitcher presets={COLLECTIVE_PRESETS} active={preset} onChange={setPreset} colorKey="primary" />
      <CollectivePreview content={COLLECTIVE_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
