'use client'

import { useParams } from 'next/navigation'
import ThemeEditor from '@/components/editor/ThemeEditor'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import { STUDIO_EDITOR_CONFIG } from '@/utils/studio/editor-config'

export default function StudioEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <ThemeEditor
      themeId={params.id}
      config={STUDIO_EDITOR_CONFIG}
      Preview={StudioPreview as any}
      backHref={`/preview/studio/${params.id}`}
    />
  )
}
