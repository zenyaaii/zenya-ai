'use client'

import { useParams } from 'next/navigation'
import Editor from '@/components/editor/v6/Editor'
import LookbookPreview from '@/components/theme/lookbook/LookbookPreview'
import { LOOKBOOK_EDITOR_CONFIG } from '@/utils/lookbook/editor-config'

export default function LookbookEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <Editor
      themeId={params.id}
      config={LOOKBOOK_EDITOR_CONFIG}
      Preview={LookbookPreview as any}
      backHref={`/preview/lookbook/${params.id}`}
    />
  )
}
