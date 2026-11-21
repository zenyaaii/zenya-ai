"use client"

import { useEffect, useState } from 'react'
import BrandHouseView, { type HouseLook } from '@/components/theme/studio/BrandHouseView'
import { buildBrandContent } from '@/utils/studio/brand'
import { COCOSU_COLORS, COCOSU_PHOTOS_INPUT } from '@/utils/studio/cocosu-sample'

const content = buildBrandContent(COCOSU_PHOTOS_INPUT)

/** SAMPLE (2026-11-21): the multi-page brand site on CocoSu. ?look=tropic | shelf */
export default function Demo() {
  const [look, setLook] = useState<HouseLook>('tropic')
  useEffect(() => { if (new URLSearchParams(window.location.search).get('look') === 'shelf') setLook('shelf') }, [])
  return <BrandHouseView content={content} colorOverrides={COCOSU_COLORS} look={look} />
}
