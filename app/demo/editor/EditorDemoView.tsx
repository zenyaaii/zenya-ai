'use client'

/**
 * The editor candidate's view: the real editor, fed from memory.
 *
 * WHAT IS REAL. The editor (components/editor/v6), every panel and field,
 * the live site in its frame, the selection, the draft, undo and redo and
 * the publish dialog are what the six live edit routes mount. The config,
 * the Preview and the content are each theme's own
 * (utils/<type>/editor-config.ts, components/theme/<type>, and the mock
 * content the /demo/<type> previews already render).
 *
 * WHAT IS NOT. The store. It keeps the wrapper content in a closure, so
 * reloading the page loses every edit, and the editor says so when it opens.
 * With a store the editor fetches nothing: an uploaded picture stays in the
 * browser and «اقترح صياغة» is not offered.
 */

import { useMemo, type ComponentType } from 'react'
import Editor, { type EditorStore, type PreviewProps } from '@/components/editor/v6/Editor'
import type { EditorConfig } from '@/utils/theme-editor-types'
import AtlasPreview from '@/components/theme/atlas/AtlasPreview'
import LookbookPreview from '@/components/theme/lookbook/LookbookPreview'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import ServicesPreview from '@/components/theme/services/ServicesPreview'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import { ATLAS_EDITOR_CONFIG } from '@/utils/atlas/editor-config'
import { LOOKBOOK_EDITOR_CONFIG } from '@/utils/lookbook/editor-config'
import { RESTAURANT_EDITOR_CONFIG } from '@/utils/restaurant/editor-config'
import { SERVICES_EDITOR_CONFIG } from '@/utils/services/editor-config'
import { STUDIO_EDITOR_CONFIG } from '@/utils/studio/editor-config'
import { WELLNESS_EDITOR_CONFIG } from '@/utils/wellness/editor-config'
import { ATLAS_MOCK_CONTENT } from '@/utils/atlas/mock-content'
import { LOOKBOOK_MOCK_CONTENT } from '@/utils/lookbook/mock-content'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { SERVICE_MOCK_CONTENT } from '@/utils/services/mock-content'
import { STUDIO_MOCK_CONTENT } from '@/utils/studio/mock-content'
import { WELLNESS_MOCK_CONTENT } from '@/utils/wellness/mock-content'
import { DEMO_TYPES, type DemoType } from './types'

type Theme = { config: EditorConfig; Preview: ComponentType<PreviewProps>; content: unknown }

// The live routes cast their Preview the same way (Preview={X as any}): each
// theme types its own props more narrowly than the shared PreviewProps.
const THEMES: Record<DemoType, Theme> = {
  restaurant: { config: RESTAURANT_EDITOR_CONFIG, Preview: RestaurantPreview as any, content: RESTAURANT_MOCK_CONTENT },
  atlas:      { config: ATLAS_EDITOR_CONFIG,      Preview: AtlasPreview as any,      content: ATLAS_MOCK_CONTENT },
  lookbook:   { config: LOOKBOOK_EDITOR_CONFIG,   Preview: LookbookPreview as any,   content: LOOKBOOK_MOCK_CONTENT },
  services:   { config: SERVICES_EDITOR_CONFIG,   Preview: ServicesPreview as any,   content: SERVICE_MOCK_CONTENT },
  studio:     { config: STUDIO_EDITOR_CONFIG,     Preview: StudioPreview as any,     content: STUDIO_MOCK_CONTENT },
  wellness:   { config: WELLNESS_EDITOR_CONFIG,   Preview: WellnessPreview as any,   content: WELLNESS_MOCK_CONTENT },
}

/** A store that lives exactly as long as the page. */
function memoryStore(contentKey: string, content: unknown): EditorStore {
  let saved: any = { [contentKey]: structuredClone(content) }
  return {
    load: async () => structuredClone(saved),
    save: async (next) => {
      // Long enough for the indicator to be read in its saving state, short
      // enough that autosave never queues behind itself.
      await new Promise((r) => setTimeout(r, 420))
      saved = structuredClone(next)
    },
  }
}

const NAMES: Record<DemoType, string> = {
  restaurant: 'موقع مطعم',
  atlas: 'صفحة هبوط لتطبيق',
  lookbook: 'موقع أزياء ولوك بوك',
  services: 'موقع خدمات',
  studio: 'موقع علامة تجارية وقصة',
  wellness: 'موقع مركز عافية',
}

export default function EditorDemoView({ type }: { type: DemoType }) {
  const theme = THEMES[type]
  const store = useMemo(() => memoryStore(theme.config.contentKey, theme.content), [theme])
  const demo = useMemo(() => ({
    note: 'نسخة تجريبية: لا يُحفظ شيء، وتضيع تعديلاتك عند إعادة تحميل الصفحة.',
    types: DEMO_TYPES.map((k) => ({ href: '/demo/editor?type=' + k, label: NAMES[k], current: k === type })),
  }), [type])
  return (
    <Editor
      key={type}
      themeId={'demo-' + type}
      config={theme.config}
      Preview={theme.Preview}
      backHref="/demo/dashboard"
      exitHref="/demo/dashboard"
      store={store}
      demo={demo}
    />
  )
}
