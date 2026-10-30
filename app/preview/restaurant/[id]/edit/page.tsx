'use client'

import { useParams } from 'next/navigation'
import Editor from '@/components/editor/v6/Editor'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_EDITOR_CONFIG } from '@/utils/restaurant/editor-config'

export default function RestaurantEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <Editor
      themeId={params.id}
      config={RESTAURANT_EDITOR_CONFIG}
      Preview={RestaurantPreview as any}
      backHref={`/preview/restaurant/${params.id}`}
    />
  )
}
