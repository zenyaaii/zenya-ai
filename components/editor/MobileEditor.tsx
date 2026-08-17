'use client'

/* ─────────────────────────────────────────────────────────────────────── *
 * MobileEditor — the phone layout for the theme editor.                    *
 *                                                                          *
 * Desktop uses three panes (sections rail · preview · fields rail). None    *
 * of that fits a phone, so here we render:                                  *
 *                                                                          *
 *   • a full-bleed live preview (the phone IS the device); tap any section  *
 *     to edit it (TapToEditOverlay), and                                    *
 *   • a draggable bottom sheet that snaps between peek → ~60% → full and     *
 *     holds the SAME fields/colors/typography panels the desktop rail uses   *
 *     (imported from ./panels — zero fork).                                  *
 *                                                                          *
 * All editing STATE lives in ThemeEditor; this component is pure            *
 * presentation and receives it via props. That's why save/undo/autosave/AI  *
 * "just work" here without being re-implemented.                            *
 *                                                                          *
 * Two things break this pattern if unhandled, so we handle both:            *
 *   • the on-screen keyboard covering the fields → we track visualViewport   *
 *     and keep the sheet's scrollable body sized above the keyboard;         *
 *   • sheet-drag fighting inner scroll → the sheet only starts dragging when  *
 *     its body is scrolled to the top (guarded in the drag handlers).        *
 * ─────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import Link from 'next/link'
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'
import {
  ArrowLeft, Save, Palette, Type as TypeIcon, Settings, ChevronRight,
  LayoutGrid, X, type LucideIcon,
} from 'lucide-react'
import type { PreviewProps } from './ThemeEditor'
import PreviewFrame from './PreviewFrame'
import TapToEditOverlay from './TapToEditOverlay'
import {
  FieldsRenderer, ColorsPanel, TypographyPanel, SectionStyleHeader,
  UndoRedo, StatusPill, type Status,
} from './panels'
import { SmallNote } from './EditorFields'
import {
  getPath, panelInView, panelViews, sectionStylesToCss,
  type EditorConfig, type EditorPanel, type SectionStyle, type SectionStyles,
} from '@/utils/theme-editor-types'

const STYLE_ID = '__style__'
const TYPO_ID = '__typography__'

type Detent = 'peek' | 'mid' | 'full'

export type MobileEditorProps = {
  themeName: string
  backHref: string
  config: EditorConfig
  Preview: ComponentType<PreviewProps>

  // Preview content + style state
  content: any
  presetId: string
  colorOverrides: Record<string, string>
  typographyPreset: string
  sectionStyles: SectionStyles

  // Selection + navigation
  selected: string
  setSelected: (id: string) => void
  view: string
  setView: (v: string) => void

  // Save / history status
  status: Status
  dirty: boolean
  lastSavedAt: number | null
  now: number
  save: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Editing mutations
  patchPath: (path: string, value: any) => void
  setPresetId: (p: string) => void
  setOverride: (k: string, v: string | undefined) => void
  resetOverrides: () => void
  setTypographyPreset: (v: string) => void
  patchSectionStyle: (panelId: string, patch: Partial<SectionStyle>) => void
  clearSectionStyle: (panelId: string) => void

  error: string | null
}

export default function MobileEditor(props: MobileEditorProps) {
  const t = useT()
  const {
    themeName, backHref, config, Preview,
    content, presetId, colorOverrides, typographyPreset, sectionStyles,
    selected, setSelected, view, setView,
    status, dirty, lastSavedAt, now, save, undo, redo, canUndo, canRedo,
    patchPath, setPresetId, setOverride, resetOverrides, setTypographyPreset,
    patchSectionStyle, clearSectionStyle, error,
  } = props

  // Iframe handles for the tap overlay.
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null)
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null)

  // Sheet: 'picker' shows the section list, 'fields' edits the selected one.
  const [sheetMode, setSheetMode] = useState<'picker' | 'fields'>('picker')

  // ── Sheet geometry (detent offsets in px, measured from the top of the
  //    fully-expanded sheet). Recomputed against the *visual* viewport so the
  //    keyboard doesn't push the sheet off-screen. ─────────────────────────
  const [vh, setVh] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    const read = () => setVh(vv?.height ?? window.innerHeight)
    read()
    vv?.addEventListener('resize', read)
    window.addEventListener('resize', read)
    return () => {
      vv?.removeEventListener('resize', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  const PEEK_PX = 68
  const sheetHeight = Math.max(240, Math.round(vh * 0.92))
  const detents = useMemo(() => ({
    // y = translateY of the sheet; 0 = fully expanded.
    peek: Math.max(0, sheetHeight - PEEK_PX),
    mid: Math.max(0, Math.round(sheetHeight - vh * 0.6)),
    full: 0,
  }), [sheetHeight, vh])

  const [detent, setDetent] = useState<Detent>('peek')
  const y = useMotionValue(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Animate to a detent whenever it (or the geometry) changes — unless the
  // user is mid-drag.
  const draggingRef = useRef(false)
  useEffect(() => {
    if (draggingRef.current) return
    const controls = animate(y, detents[detent], {
      type: 'spring', stiffness: 520, damping: 44, mass: 0.9,
    })
    return controls.stop
  }, [detent, detents, y])

  const openTo = useCallback((d: Detent) => setDetent(d), [])

  // Tapping a section (in the preview or the picker) → edit it at mid height.
  const pickSection = useCallback((id: string) => {
    setSelected(id)
    setSheetMode('fields')
    setDetent((cur) => (cur === 'peek' ? 'mid' : cur))
  }, [setSelected])

  // When a field gains focus and the keyboard opens, make sure the sheet is
  // full so the inputs sit above the keyboard, and scroll the field into view.
  const onSheetFocus = useCallback((e: React.FocusEvent) => {
    const t = e.target as HTMLElement
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      setDetent('full')
      setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)
    }
  }, [])

  // ── Drag: only let the sheet drag when its body is scrolled to the top,
  //    otherwise the gesture belongs to the inner scroll. ──────────────────
  const canDragRef = useRef(true)
  const onDragStart = useCallback(() => {
    draggingRef.current = true
  }, [])
  const onDrag = useCallback((_: unknown, info: PanInfo) => {
    // If dragging up but body isn't at the top, cancel by snapping y back.
    if (bodyRef.current && bodyRef.current.scrollTop > 2 && info.delta.y < 0) {
      canDragRef.current = false
    }
  }, [])
  const onDragEnd = useCallback((_: unknown, info: PanInfo) => {
    draggingRef.current = false
    const cur = y.get()
    const v = info.velocity.y
    // Order detents by y position (full=0 < mid < peek).
    const ordered: Array<[Detent, number]> = [
      ['full', detents.full], ['mid', detents.mid], ['peek', detents.peek],
    ]
    let target: Detent
    if (v > 600) {
      // Fast flick down → next lower detent.
      target = cur < detents.mid - 1 ? 'mid' : 'peek'
    } else if (v < -600) {
      // Fast flick up → next higher detent.
      target = cur > detents.mid + 1 ? 'mid' : 'full'
    } else {
      // Nearest by position.
      target = ordered.reduce((best, [name, val]) =>
        Math.abs(val - cur) < Math.abs(detents[best] - cur) ? name : best, 'peek' as Detent)
    }
    setDetent(target)
    canDragRef.current = true
  }, [y, detents])

  // ── Resolve the active panel for the fields view. ────────────────────────
  const allPanels: EditorPanel[] = [...config.panels, ...config.globalPanels]
  const activePanel = allPanels.find((p) => p.id === selected)
  const activeLabel =
    selected === STYLE_ID ? t.editor.colorsPalette :
    selected === TYPO_ID ? t.editor.typography :
    activePanel?.label || t.editor.section

  const panelToViews = useMemo(() => Object.fromEntries(
    config.panels
      .map((p) => [p.id, panelViews(p)] as const)
      .filter(([, v]) => v !== null) as Array<[string, string[]]>
  ), [config.panels])

  const brandName = config.brandNamePath
    ? (getPath(content, config.brandNamePath) || themeName)
    : themeName

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0a0a0c]">
      {/* Top bar */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between gap-2 border-b border-token bg-white px-3">
        <Link
          href={backHref}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-token bg-white px-2 py-1.5 text-[12px] font-medium text-muted active:bg-black/5"
          aria-label={t.editor.back}
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.25} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <StatusPill status={status} dirty={dirty} lastSavedAt={lastSavedAt} now={now} />
        </div>

        <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
        <button
          onClick={save}
          disabled={!dirty || status === 'saving'}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Save className="h-3 w-3" strokeWidth={2.5} />
          {t.editor.save}
        </button>
      </header>

      {/* Live preview — full-bleed. Sits under the sheet. */}
      <div className="relative flex-1 overflow-hidden">
        <PreviewFrame
          device="mobile"
          fullBleed
          sectionStylesCss={Object.keys(sectionStyles).length ? sectionStylesToCss(sectionStyles) : ''}
          onReady={(d, el) => { setIframeDoc(d); setIframeEl(el) }}
          render={() => (
            <Preview
              content={content}
              presetId={presetId}
              colorOverrides={colorOverrides}
              typographyPreset={typographyPreset || undefined}
              sectionStyles={sectionStyles}
              view={view}
              onViewChange={setView}
            />
          )}
        />
        <TapToEditOverlay
          doc={iframeDoc}
          iframe={iframeEl}
          selectedPanelId={sheetMode === 'fields' ? selected : undefined}
          onPick={pickSection}
          panelToViews={panelToViews}
          currentView={view}
          onViewChange={setView}
        />
        {/* Hint bubble above the peek bar */}
        {detent === 'peek' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[76px] flex justify-center">
            <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
              {t.editor.tapAnySection}
            </span>
          </div>
        )}
      </div>

      {/* Scrim when the sheet is expanded */}
      {detent !== 'peek' && (
        <button
          aria-hidden
          tabIndex={-1}
          onClick={() => openTo('peek')}
          className="fixed inset-0 z-30 bg-black/30"
          style={{ backdropFilter: 'blur(1px)' }}
        />
      )}

      {/* Draggable bottom sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-white shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.4)]"
        style={{ height: sheetHeight, y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: detents.peek }}
        dragElastic={0.02}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      >
        {/* Grab handle + header — the whole header is the drag surface */}
        <div className="flex-shrink-0 cursor-grab select-none px-4 pt-2 active:cursor-grabbing">
          <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />
          <div className="mt-2 flex items-center justify-between gap-2 pb-2">
            {sheetMode === 'fields' ? (
              <button
                type="button"
                onClick={() => { setSheetMode('picker'); openTo('mid') }}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground"
              >
                <ChevronRight className="h-4 w-4 text-muted" strokeWidth={2.25} />
                {activeLabel}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <LayoutGrid className="h-4 w-4 text-muted" strokeWidth={2} />
                {t.editor.editBrand.replace('{name}', brandName)}
              </span>
            )}
            <div className="flex items-center gap-1">
              {detent !== 'full' ? (
                <button
                  type="button"
                  onClick={() => openTo('full')}
                  className="rounded-md px-2 py-1 text-[11.5px] font-medium text-muted active:bg-black/5"
                >
                  {t.editor.expand}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openTo('mid')}
                  className="rounded-md px-2 py-1 text-[11.5px] font-medium text-muted active:bg-black/5"
                >
                  {t.editor.shrink}
                </button>
              )}
              <button
                type="button"
                onClick={() => openTo('peek')}
                aria-label={t.editor.close}
                className="rounded-md p-1 text-muted active:bg-black/5"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>

        {/* Body — scrolls independently of the sheet drag */}
        <div
          ref={bodyRef}
          onFocusCapture={onSheetFocus}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-token px-4 pb-24 pt-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sheetMode === 'picker' ? (
            <Picker
              config={config}
              view={view}
              setView={setView}
              selected={selected}
              onPick={pickSection}
            />
          ) : selected === STYLE_ID ? (
            <ColorsPanel
              presetId={presetId}
              setPresetId={setPresetId}
              colorOverrides={colorOverrides}
              setOverride={setOverride}
              resetOverrides={resetOverrides}
              config={config}
            />
          ) : selected === TYPO_ID ? (
            <TypographyPanel value={typographyPreset} onChange={setTypographyPreset} />
          ) : activePanel ? (
            <div className="space-y-4">
              <SectionStyleHeader
                panelId={activePanel.id}
                value={sectionStyles[activePanel.id]}
                onPatch={(p) => patchSectionStyle(activePanel.id, p)}
                onClear={() => clearSectionStyle(activePanel.id)}
              />
              <FieldsRenderer
                fields={activePanel.fields}
                content={content}
                patchPath={patchPath}
                panelLabel={activePanel.label}
              />
            </div>
          ) : (
            <SmallNote>{t.editor.pickSectionToEdit}</SmallNote>
          )}
        </div>
      </motion.div>

      {error && content && (
        <div className="fixed bottom-2 left-1/2 z-50 -translate-x-1/2 rounded-md border border-[#fca5a5] bg-[#fee2e2] px-3 py-2 text-[12.5px] font-medium text-[#b91c1c] shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}

/* ── Section picker — the list shown in the sheet ────────────────────────── */

function Picker({
  config, view, setView, selected, onPick,
}: {
  config: EditorConfig
  view: string
  setView: (v: string) => void
  selected: string
  onPick: (id: string) => void
}) {
  const t = useT()
  const pagePanels = config.panels.filter((p) => panelInView(p, view))
  return (
    <div className="space-y-4">
      {/* Page chips */}
      {config.pages && config.pages.length > 0 && (
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {config.pages.map((p) => {
            const Icon = p.icon
            const active = view === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setView(p.id)}
                className={
                  'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ' +
                  (active ? 'bg-foreground text-white' : 'border border-token text-muted active:bg-black/5')
                }
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
                {p.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Sections on this page */}
      <div>
        <PickerLabel>{t.editor.sections}</PickerLabel>
        <div className="grid grid-cols-1 gap-1.5">
          {pagePanels.map((p) => (
            <PickerRow
              key={p.id}
              icon={p.icon || Settings}
              label={p.label}
              active={selected === p.id}
              onClick={() => onPick(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Global + style */}
      <div>
        <PickerLabel>{t.editor.globalAllPages}</PickerLabel>
        <div className="grid grid-cols-1 gap-1.5">
          <PickerRow icon={Palette} label={t.editor.colorsPalette} active={selected === STYLE_ID} onClick={() => onPick(STYLE_ID)} />
          <PickerRow icon={TypeIcon} label={t.editor.typography} active={selected === TYPO_ID} onClick={() => onPick(TYPO_ID)} />
          {config.globalPanels.map((p) => (
            <PickerRow
              key={p.id}
              icon={p.icon || Settings}
              label={p.label}
              active={selected === p.id}
              onClick={() => onPick(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PickerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-0.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
      {children}
    </div>
  )
}

function PickerRow({
  icon: Icon, label, active, onClick,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-3 text-start transition ' +
        (active ? 'border-foreground bg-[rgba(28,28,28,0.04)]' : 'border-token active:bg-black/[0.03]')
      }
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={2} />
        <span className="text-[14px] text-foreground">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 rotate-180 text-muted/50" strokeWidth={2.25} />
    </button>
  )
}
