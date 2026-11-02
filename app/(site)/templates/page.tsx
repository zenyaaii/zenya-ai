/**
 * The templates catalogue, in the «ليل» style (2026-11-01).
 *
 * The view is Templates in components/zenya/redesign/s11.tsx. Names, labels,
 * covers and the preview / build links are the real ones; the one-product
 * store stays «قريبًا». Metadata stays in ./layout.tsx.
 *
 * The previous view, components/zenya/templates/TemplatesView.tsx, is kept.
 */

import { dashFont } from '@/components/app/dash-font'
import { Templates } from '@/components/zenya/redesign/s11'

export default function ThemesPage() {
  return <div className={dashFont.variable}><Templates /></div>
}
