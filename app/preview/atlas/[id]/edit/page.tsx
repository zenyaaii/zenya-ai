'use client'

import { useParams } from 'next/navigation'
import Editor from '@/components/editor/v6/Editor'
import AtlasPreview from '@/components/theme/atlas/AtlasPreview'
import { ATLAS_EDITOR_CONFIG } from '@/utils/atlas/editor-config'

export default function AtlasEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <Editor
      themeId={params.id}
      config={ATLAS_EDITOR_CONFIG}
      Preview={AtlasPreview as any}
      backHref={`/preview/atlas/${params.id}`}
    />
  )
}
