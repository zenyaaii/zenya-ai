'use client'

import { useParams } from 'next/navigation'
import ThemeEditor from '@/components/editor/ThemeEditor'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import { WELLNESS_EDITOR_CONFIG } from '@/utils/wellness/editor-config'

export default function WellnessEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <ThemeEditor
      themeId={params.id}
      config={WELLNESS_EDITOR_CONFIG}
      Preview={WellnessPreview as any}
      backHref={`/preview/wellness/${params.id}`}
    />
  )
}
