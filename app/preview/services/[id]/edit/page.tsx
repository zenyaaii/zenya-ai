'use client'

import { useParams } from 'next/navigation'
import ThemeEditor from '@/components/editor/ThemeEditor'
import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { SERVICES_EDITOR_CONFIG } from '@/utils/services/editor-config'

export default function ServicesEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <ThemeEditor
      themeId={params.id}
      config={SERVICES_EDITOR_CONFIG}
      Preview={ServicesPreview as any}
      backHref={`/preview/services/${params.id}`}
    />
  )
}
