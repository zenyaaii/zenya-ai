"use client"

import { useState } from 'react'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type { RestaurantStylePresetId } from '@/utils/restaurant/types'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

export default function RestaurantDemoPage() {
  const [preset, setPreset] = useState<RestaurantStylePresetId>('onyx')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0c' }}>
      <DemoPresetSwitcher presets={RESTAURANT_PRESETS} active={preset} onChange={setPreset} colorKey="accent" />
      <RestaurantPreview content={RESTAURANT_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
