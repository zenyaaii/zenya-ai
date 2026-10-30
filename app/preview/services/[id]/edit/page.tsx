'use client'

import { useParams } from 'next/navigation'
import Editor from '@/components/editor/v6/Editor'
import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { SERVICES_EDITOR_CONFIG } from '@/utils/services/editor-config'

export default function ServicesEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <Editor
      themeId={params.id}
      config={SERVICES_EDITOR_CONFIG}
      Preview={ServicesPreview as any}
      backHref={`/preview/services/${params.id}`}
    />
  )
}
