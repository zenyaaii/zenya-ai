'use client'

import { useState } from 'react'
import './sufra-fonts.css'
import SufraPreview from '@/components/theme/sufra/SufraPreview'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { SUFRA_PRESETS } from '@/utils/sufra/presets'
import type { SufraPresetId } from '@/utils/sufra/presets'
import DemoPresetSwitcher from '@/components/DemoPresetSwitcher'

/**
 * Local preview for the Sufra template. Reuses the restaurant mock content, so
 * what renders here is exactly what a generated site gets.
 */
export default function SufraDemoPage() {
  const [preset, setPreset] = useState<SufraPresetId>('basalt')

  return (
    <div className="min-h-screen">
      <DemoPresetSwitcher presets={SUFRA_PRESETS} active={preset} onChange={setPreset} colorKey="accent" />
      <SufraPreview content={RESTAURANT_MOCK_CONTENT} presetId={preset} />
    </div>
  )
}
