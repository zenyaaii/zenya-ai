'use client'

import { useParams } from 'next/navigation'
import ThemeEditor from '@/components/editor/ThemeEditor'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_EDITOR_CONFIG } from '@/utils/restaurant/editor-config'

export default function RestaurantEditPage() {
  const params = useParams<{ id: string }>()
  return (
    <ThemeEditor
      themeId={params.id}
      config={RESTAURANT_EDITOR_CONFIG}
      Preview={RestaurantPreview as any}
      backHref={`/preview/restaurant/${params.id}`}
    />
  )
}
