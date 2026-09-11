'use client'

/**
 * The editor chrome both trees share: the stylesheet, the rail row and the
 * device toggle. In a module of their own so ThemeEditor and MobileEditor
 * each import them from here rather than from one another.
 */

import { ChevronRight, Monitor, Tablet, Smartphone, type LucideIcon } from 'lucide-react'
import { useT } from '@/components/i18n/LocaleProvider'
import { EDITOR_CSS } from './editor-style'
import type { PreviewDevice } from './PreviewFrame'

/** The editor's stylesheet. Each tree renders it once at its root. */
export function EditorStyle() {
  return <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />
}

/* ── A rail row — a control that stands for a section or a global panel. ── */
export function RailRow({
  icon: Icon, label, active, onClick, go = false,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  /** Show a forward chevron: the row opens a panel rather than switching one. */
  go?: boolean
}) {
  return (
    <button type="button" onClick={onClick} className="ze-row" aria-current={active ? 'true' : undefined}>
      <Icon strokeWidth={active ? 2.25 : 1.9} aria-hidden />
      <span className="ze-row-t">{label}</span>
      {go && <ChevronRight className="ze-row-go rtl-flip" strokeWidth={2} aria-hidden />}
    </button>
  )
}

/* ── Device toggle — responsive preview viewport ─────────────────────── */
export function DeviceToggle({
  device, onChange,
}: { device: PreviewDevice; onChange: (d: PreviewDevice) => void }) {
  const t = useT()
  const items: Array<{ id: PreviewDevice; Icon: typeof Monitor; label: string }> = [
    { id: 'desktop', Icon: Monitor,    label: t.editor.desktop },
    { id: 'tablet',  Icon: Tablet,     label: t.editor.tablet },
    { id: 'mobile',  Icon: Smartphone, label: t.editor.mobile },
  ]
  return (
    <div className="ze-seg" role="group">
      {items.map(({ id, Icon, label }) => {
        const active = device === id
        const name = t.editor.previewLabel.replace('{label}', label)
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={name}
            aria-label={name}
            aria-pressed={active}
            className="ze-seg-b"
            data-icon
          >
            <Icon strokeWidth={2} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
