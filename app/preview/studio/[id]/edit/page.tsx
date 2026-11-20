'use client'

import { useParams } from 'next/navigation'
import Editor from '@/components/editor/v6/Editor'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import { STUDIO_EDITOR_CONFIG } from '@/utils/studio/editor-config'
import { studioConfigFor } from '@/utils/studio/brand-editor-config'

export default function StudioEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <Editor
      themeId={params.id}
      config={STUDIO_EDITOR_CONFIG}
      configFor={studioConfigFor}
      Preview={StudioPreview as any}
      backHref={`/preview/studio/${params.id}`}
    />
  )
}
