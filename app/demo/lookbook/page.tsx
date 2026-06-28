"use client"

import { useState } from 'react'
import LookbookPreview from '@/components/theme/lookbook/LookbookPreview'
import { LOOKBOOK_MOCK_CONTENT } from '@/utils/lookbook/mock-content'
import { LOOKBOOK_PRESETS } from '@/utils/lookbook/presets'
import type { LookbookStylePresetId } from '@/utils/lookbook/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function LookbookDemoPage() {
  const [preset, setPreset] = useState<LookbookStylePresetId>('noir')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <DemoPresetSwitcher presets={LOOKBOOK_PRESETS} active={preset} onChange={setPreset} colorKey="badge" />
      <LookbookPreview content={LOOKBOOK_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
