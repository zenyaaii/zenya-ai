"use client"

import { useEffect, useState } from 'react'
import BrandHouseView, { type HouseLook } from '@/components/theme/studio/BrandHouseView'
import { buildBrandContent, isBrandV2, type BrandContent } from '@/utils/studio/brand'
import { COCOSU_COLORS, COCOSU_PHOTOS_INPUT } from '@/utils/studio/cocosu-sample'
import { DEMO_BUILT_KEY } from '@/utils/services/barber'
import { COCOSU_BUILT } from '@/utils/studio/cocosu-built'

const sample = buildBrandContent(COCOSU_PHOTOS_INPUT)

/**
 * The multi-page brand site on its own, no account needed.
 *  ?look=tropic | shelf   the CocoSu sample in either look
 *  ?built=1               the site the brand questions just built in this tab (/demo/brand-build)
 *  ?built=cocosu          CocoSu as the questions built it on 2026-11-22, defaults kept
 */
export default function Demo() {
  const [state, setState] = useState<{ c: BrandContent; colors: Record<string, string>; look: HouseLook }>({ c: sample, colors: COCOSU_COLORS, look: 'tropic' })
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    let c = sample, colors: Record<string, string> = COCOSU_COLORS
    if (q.get('built') === 'cocosu') { c = COCOSU_BUILT.studio; colors = COCOSU_BUILT.colors }
    else if (q.get('built')) {
      try {
        const s = JSON.parse(sessionStorage.getItem(DEMO_BUILT_KEY) || 'null')
        if (s && isBrandV2(s.studio)) { c = s.studio; colors = s.color_overrides || {} }
      } catch { /* keep the sample */ }
    }
    const l = q.get('look')
    setState({ c, colors, look: l === 'shelf' || l === 'tropic' ? l : c.design === 'shelf' ? 'shelf' : 'tropic' })
  }, [])
  return <BrandHouseView content={state.c} colorOverrides={state.colors} look={state.look} />
}
