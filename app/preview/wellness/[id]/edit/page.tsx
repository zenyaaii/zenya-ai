'use client'

import { useParams } from 'next/navigation'
import Editor from '@/components/editor/v6/Editor'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import { WELLNESS_EDITOR_CONFIG } from '@/utils/wellness/editor-config'

export default function WellnessEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <Editor
      themeId={params.id}
      config={WELLNESS_EDITOR_CONFIG}
      Preview={WellnessPreview as any}
      backHref={`/preview/wellness/${params.id}`}
    />
  )
}
