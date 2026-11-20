"use client"

import StudioPreview from '@/components/theme/studio/StudioPreview'
import { buildBrandContent } from '@/utils/studio/brand'
import { BRAND_LOOKS } from '@/utils/studio/brand-looks'
import { COCOSU_SAMPLE_INPUT } from '@/utils/studio/cocosu-sample'

const content = buildBrandContent(COCOSU_SAMPLE_INPUT)

/** The brand-story design on a real test build (CocoSu), no account needed. */
export default function Demo() {
  return <StudioPreview content={content} colorOverrides={BRAND_LOOKS[0].colors} />
}
