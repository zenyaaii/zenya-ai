'use client'

/* ─────────────────────────────────────────────────────────────────────── *
 * MobileEditor — the compact layouts for the theme editor.                 *
 *                                                                          *
 * Desktop uses three panes (sections rail · preview · fields). Below       *
 * 1280px they do not fit, so ThemeEditor renders this tree instead, in    *
 * one of two forms:                                                        *
 *                                                                          *
 *   PHONE (below 768px)                                                    *
 *   • a full-bleed live preview (the phone IS the device); tap any section  *
 *     to edit it (SectionOverlay), and                                      *
 *   • a draggable bottom sheet that snaps between peek → ~60% → full and     *
 *     holds the SAME fields/colors/typography panels the desktop rail uses   *
 *     (imported from ./panels — zero fork).                                  *
 *                                                                          *
 *   DOCKED (768–1279px: an iPad either way up, a small laptop)             *
 *   • the preview on a stage with the device toggle, and the same panels in *
 *     a docked inspector beside it. An iPad in portrait used to get the     *
 *     phone sheet stretched to 834px — a 92%-tall sheet over a preview it   *
 *     could not see — and in landscape the three desktop panes, with 730px  *
 *     left for "desktop". Neither was designed for it.                      *
 *                                                                          *
 * All editing STATE lives in ThemeEditor; this component is pure            *
 * presentation and receives it via props. That's why save/undo/autosave/AI  *
 * "just work" here without being re-implemented.                            *
 *                                                                          *
 * Two things break the sheet if unhandled, so we handle both:              *
 *   • the on-screen keyboard covering the fields → we track visualViewport   *
 *     and keep the sheet's scrollable body sized above the keyboard;         *
 *   • sheet-drag fighting inner scroll → the sheet only starts dragging when  *
 *     its body is scrolled to the top (guarded in the drag handlers).        *
 * And one more, found while restyling: the cookie banner (229px on a       *
 * phone) sat over the sheet's head, the one place the save lives. While it *
 * is on screen the sheet stands on top of it instead.                      *
 * ─────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import Link from 'next/link'
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'
import {
  ArrowLeft, Save, Palette, Type as TypeIcon, Settings, ChevronLeft,
  ChevronUp, ChevronDown, X,
} from 'lucide-react'
import { chromeFont } from '@/components/app/chrome-font'
import type { PreviewProps } from './ThemeEditor'
import { EditorStyle, RailRow, DeviceToggle } from './chrome'
import PreviewFrame, { type PreviewDevice } from './PreviewFrame'
import SectionOverlay from './SectionOverlay'
import { useMediaQuery } from './useIsMobile'
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
  /** A strip under the bar (the candidate says there that nothing is kept). */
  notice?: ReactNode
  /** Docked-inspector form (768px and up). ThemeEditor passes it already
   *  settled; mounted on its own, the component reads it itself. */
  docked?: boolean
}

/**
 * How much of the bottom of the screen the cookie banner holds, in CSS px.
 * CookieConsent is shared chrome and exposes no state, but it announces a
 * choice with `zenya:consent-change` and a reopen with `zenya:open-consent`,
 * so this measures on mount and on those two events only.
 */
function useConsentInset(): number {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('[aria-labelledby="cookie-consent-title"]') as HTMLElement | null
      if (!el) { setInset(0); return }
      // The rect is in rendered pixels; the sheet's `bottom` is in CSS pixels
      // and is zoomed again by ZoomLock, so divide the root zoom back out.
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1
      const r = el.getBoundingClientRect()
      setInset(Math.max(0, Math.round((window.innerHeight - r.top) / zoom)))
    }
    const later = () => window.setTimeout(measure, 60)
    const first = window.setTimeout(measure, 120)
    window.addEventListener('zenya:consent-change', later)
    window.addEventListener('zenya:open-consent', later)
    window.addEventListener('resize', later)
    return () => {
      window.clearTimeout(first)
      window.removeEventListener('zenya:consent-change', later)
      window.removeEventListener('zenya:open-consent', later)
      window.removeEventListener('resize', later)
    }
  }, [])
  return inset
}

export default function MobileEditor(props: MobileEditorProps) {
  const t = useT()
  const {
    themeName, backHref, config, Preview,
    content, presetId, colorOverrides, typographyPreset, sectionStyles,
    selected, setSelected, view, setView,
    status, dirty, lastSavedAt, save, undo, redo, canUndo, canRedo,
    patchPath, setPresetId, setOverride, resetOverrides, setTypographyPreset,
    patchSectionStyle, clearSectionStyle, error, notice,
  } = props

  const dockedMq = useMediaQuery('(min-width: 768px)')
  const docked = props.docked ?? dockedMq
  const [device, setDevice] = useState<PreviewDevice>('tablet')

  // The iframe document for the selection overlay.
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null)

  // Sheet: 'picker' shows the section list, 'fields' edits the selected one.
  const [sheetMode, setSheetMode] = useState<'picker' | 'fields'>('picker')

  const bottomInset = useConsentInset()

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

  // The visual viewport is in screen pixels; the sheet is laid out in CSS
  // pixels, which ZoomLock's root zoom scales down. Divide it back out, or
  // the sheet is sized for a screen 15% shorter than the one it is on.
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    setZoom(parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1)
  }, [vh])

  // The head of the sheet at rest: the handle, the title, the save state and
  // the save itself — everything a thumb needs without opening anything.
  const PEEK_PX = 84
  /* Pixels per second. Below SOFT a gesture is a nudge and the sheet stays
     where it is; above HARD it is a throw and the sheet goes the whole way.
     Between them it is a swipe and moves exactly one detent. */
  const FLICK_SOFT = 320
  const FLICK_HARD = 1200
  /* A drag this long is deliberate whatever its speed. */
  const DRAG_STEP_PX = 44
  /* And a drag across this much of the sheet's whole travel is a throw. */
  const THROW_FRACTION = 0.45
  const avail = Math.max(0, vh / zoom - bottomInset)
  const sheetHeight = Math.max(240, Math.round(avail * 0.92))

  /**
   * SNAP A CSS OFFSET SO IT LANDS ON A WHOLE DEVICE PIXEL.
   *
   * This is the difference between crisp Arabic and mushy Arabic, and it is
   * not obvious. ZoomLock writes `zoom: 0.85` on the document element, so a
   * translate of a round 571 CSS pixels puts the sheet at 485.35 real ones.
   * Every glyph inside it then straddles a pixel row, the rasteriser
   * resamples, and 12px Arabic turns to grey mush: measured before this
   * change, the sheet sat at top 533.756 and its first label at 609.241.
   *
   * Rounding in DEVICE space and dividing back gives an offset that is whole
   * where it counts. Rounding the CSS value instead, which is the obvious
   * thing to do, is exactly what produced the fractional result.
   */
  const snap = useCallback(
    (v: number) => (zoom ? Math.round(v * zoom) / zoom : Math.round(v)),
    [zoom],
  )

  const detents = useMemo(() => ({
    // y = translateY of the sheet; 0 = fully expanded.
    peek: snap(Math.max(0, sheetHeight - PEEK_PX)),
    mid: snap(Math.max(0, sheetHeight - avail * 0.6)),
    full: 0,
  }), [sheetHeight, avail, snap])

  const [detent, setDetent] = useState<Detent>('peek')
  const y = useMotionValue(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Animate to a detent whenever it (or the geometry) changes — unless the
  // user is mid-drag.
  const draggingRef = useRef(false)

  /**
   * IS THE SHEET MOVING RIGHT NOW?
   *
   * It drives `will-change`, and the point is that it goes back off. A sheet
   * that carries `will-change: transform` for ever keeps its own compositor
   * layer for ever, and text on a composited layer loses subpixel
   * antialiasing permanently: smooth to drag, soft to read, which is the
   * worst of both. Promoting only for the length of the gesture buys the
   * cheap frames while they are needed and hands the text back to the main
   * layer the moment it stops.
   */
  const [moving, setMoving] = useState(false)

  /**
   * NUDGE THE RESTING SHEET ONTO A WHOLE DEVICE PIXEL.
   *
   * Snapping the translate is necessary but not sufficient. The sheet is
   * anchored with `bottom`, so its resting top is
   * viewportHeight - inset - height + y, and the viewport height in CSS
   * pixels is itself fractional once the root zoom divides it: measured
   * 992.94, not 993. A perfectly snapped translate therefore still lands the
   * box, and every glyph in it, a third of a pixel off the grid. Deriving the
   * correction algebraically means re-deriving it every time the layout
   * changes; measuring it does not.
   *
   * So once the sheet is at rest, read where it actually is, and take the
   * remainder back out. One read and one write, only when it has stopped.
   */
  const sheetRef = useRef<HTMLDivElement>(null)
  const settle = useCallback(() => {
    const el = sheetRef.current
    if (!el || !zoom) return
    const top = el.getBoundingClientRect().top
    const frac = top - Math.round(top)
    if (Math.abs(frac) > 0.001) y.set(y.get() - frac / zoom)
  }, [y, zoom])

  /* One spring, and both the detent effect and the end of a drag go through
     it. They have to: if a gesture resolves to the detent the sheet is
     already on, setDetent changes nothing, the effect below does not re-run,
     and without this the sheet stays stranded wherever the finger left it
     instead of settling back. That was a real bug, and it is why this is a
     function rather than an effect body. */
  const springTo = useCallback((target: Detent) => {
    setMoving(true)
    return animate(y, detents[target], {
      type: 'spring', stiffness: 520, damping: 44, mass: 0.9,
      // Land exactly on the detent rather than within a spring epsilon of
      // it: the snapped value is whole in device space and a resting offset
      // a third of a pixel away from it is not.
      restDelta: 0.001,
      onComplete: () => { y.set(detents[target]); setMoving(false); settle() },
    })
  }, [y, detents, settle])

  const detentRef = useRef(detent)
  detentRef.current = detent

  useEffect(() => {
    if (draggingRef.current || docked) return
    const controls = springTo(detent)
    return () => { controls.stop(); setMoving(false) }
  }, [detent, detents, docked, springTo])

  const openTo = useCallback((d: Detent) => setDetent(d), [])

  // Tapping a section (in the preview or the picker) → edit it at mid height.
  const pickSection = useCallback((id: string) => {
    setSelected(id)
    setSheetMode('fields')
    setDetent('full')
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
  /* A tap and a drag arrive through the same handlers, so the only way to
     tell them apart is whether the finger travelled. Anything under four
     pixels is a tap. */
  const movedRef = useRef(false)
  /* Which detent the gesture set off from. Stepping one stop is measured
     from here rather than from wherever the finger happened to let go, so a
     swipe moves exactly one stop however far it slid. */
  const fromRef = useRef<Detent>('peek')
  const onDragStart = useCallback(() => {
    draggingRef.current = true
    movedRef.current = false
    fromRef.current = detentRef.current
    setMoving(true)
  }, [])
  const onDrag = useCallback((_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 4) movedRef.current = true
    // If dragging up but body isn't at the top, cancel by snapping y back.
    if (bodyRef.current && bodyRef.current.scrollTop > 2 && info.delta.y < 0) {
      canDragRef.current = false
    }
  }, [])
  const onDragEnd = useCallback((_: unknown, info: PanInfo) => {
    draggingRef.current = false
    // (the release position is no longer needed: stepping is measured from
    // the detent the gesture started at, not from where the finger let go)
    const v = info.velocity.y
    /**
     * TWO SPEEDS, NOT ONE.
     *
     * A sheet with a single velocity threshold can only answer one question:
     * was that a flick or not. So a nudge and a throw did the same thing and
     * the sheet always stopped in the middle. These are the three gestures a
     * thumb actually makes, and they get three answers:
     *
     *   nudge     under FLICK_SOFT and under DRAG_STEP_PX   stay
     *   swipe     over either one                           one stop along
     *   throw     over FLICK_HARD                           all the way
     *
     * DISTANCE COUNTS AS WELL AS SPEED, and that is not belt and braces. A
     * slow, long drag is unmistakably deliberate and reports almost no
     * velocity, so on velocity alone it would be read as a nudge and snap
     * back under the finger that just dragged it half the screen.
     *
     * Stepping is measured from the detent the gesture STARTED at, so one
     * swipe is always exactly one stop.
     */
    const openness: Detent[] = ['peek', 'mid', 'full']
    const from = openness.indexOf(fromRef.current)
    const step = (by: number) => openness[Math.min(openness.length - 1, Math.max(0, from + by))]

    const dy = info.offset.y                 // positive downward
    const up = (Math.abs(v) > 40 ? v : dy) < 0
    const span = Math.max(1, detents.peek - detents.full)

    /* EACH TIER IS READ FROM SPEED **OR** DISTANCE, and that is not
       redundancy. Velocity is the better signal when the hardware reports it
       honestly and a useless one when it does not: driven through synthetic
       touch events, a 300px throw here reports 53px/s while a 70px swipe
       reports 257, which is backwards. A gesture that crosses nearly half
       the sheet is a throw whatever the clock says it was, and a gesture
       that crosses a couple of finger-widths is a swipe. */
    const threw = Math.abs(v) >= FLICK_HARD || Math.abs(dy) >= span * THROW_FRACTION
    const swiped = Math.abs(v) >= FLICK_SOFT || Math.abs(dy) >= DRAG_STEP_PX

    let target: Detent
    if (threw) target = up ? 'full' : 'peek'
    else if (swiped) target = step(up ? 1 : -1)
    else target = fromRef.current

    canDragRef.current = true
    // Always drive the spring from here. Where the target IS the current
    // detent, setDetent is a no-op and the effect never fires, which is what
    // used to leave the sheet stranded mid-screen after a nudge.
    if (target === detentRef.current) springTo(target)
    else setDetent(target)
  }, [y, detents, springTo])

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

  // The same memo ThemeEditor builds, for the same reason: the iframe root
  // re-renders only when what the preview reads changes. MobileEditor is also
  // mounted on its own by app/mobile-editor-demo, so it builds its own.
  const previewNode = useMemo(() => (
    <Preview
      content={content}
      presetId={presetId}
      colorOverrides={colorOverrides}
      typographyPreset={typographyPreset || undefined}
      sectionStyles={sectionStyles}
      view={view}
      onViewChange={setView}
    />
  ), [Preview, content, presetId, colorOverrides, typographyPreset, sectionStyles, view, setView])

  const sectionStylesCss = useMemo(
    () => (Object.keys(sectionStyles).length ? sectionStylesToCss(sectionStyles) : ''),
    [sectionStyles],
  )
  const onPreviewReady = useCallback((d: Document) => { setIframeDoc(d) }, [])

  // What of the preview the sheet covers, so a picked section is scrolled into
  // the part that is still visible. Read from the TARGET detent, which changes
  // in the same render as the selection, not from the animated position.
  const obscured = docked ? 0 : (sheetHeight - detents[detent]) + bottomInset

  const saveButton = (
    <button
      type="button"
      onClick={save}
      disabled={!dirty || status === 'saving'}
      title={t.editor.saveTitle}
      className="ze-save"
    >
      <Save strokeWidth={2.25} aria-hidden />
      {t.editor.save}
    </button>
  )

  // The panel for the selected section — identical in the sheet and the dock.
  const body = sheetMode === 'picker' ? (
    <Picker
      config={config}
      view={view}
      setView={setView}
      selected={selected}
      onPick={pickSection}
    />
  ) : selected === STYLE_ID ? (
    <div className="ze-insp-body" style={{ padding: 0 }}>
      <ColorsPanel
        presetId={presetId}
        setPresetId={setPresetId}
        colorOverrides={colorOverrides}
        setOverride={setOverride}
        resetOverrides={resetOverrides}
        config={config}
      />
    </div>
  ) : selected === TYPO_ID ? (
    <div className="ze-insp-body" style={{ padding: 0 }}>
      <TypographyPanel value={typographyPreset} onChange={setTypographyPreset} />
    </div>
  ) : activePanel ? (
    <div className="ze-insp-body" style={{ padding: 0 }}>
      <SectionStyleHeader
        panelId={activePanel.id}
        panelLabel={activePanel.label}
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
  )

  const backToList = (
    <button
      type="button"
      onClick={() => { setSheetMode('picker'); if (!docked) openTo('full') }}
      className="ze-icon"
      aria-label={t.editor.sections}
      title={t.editor.sections}
    >
      <ChevronLeft className="rtl-flip" strokeWidth={2.25} aria-hidden />
    </button>
  )

  return (
    <div className={'ze-root ' + chromeFont.variable}>
      <EditorStyle />

      {/* ── The bar ── */}
      <header className="ze-bar">
        <div className="ze-bar-start">
          <Link href={backHref} className="ze-icon" aria-label={t.editor.back} data-label={docked ? '' : undefined}>
            <ArrowLeft className="rtl-flip" strokeWidth={2} aria-hidden />
            {docked && <span>{t.editor.back}</span>}
          </Link>
          <h1 className="ze-title">
            {docked && <span className="ze-title-q">{t.editor.edit} </span>}{brandName}
          </h1>
        </div>
        {docked && (
          <div className="ze-bar-mid">
            <DeviceToggle device={device} onChange={setDevice} />
          </div>
        )}
        <div className="ze-bar-end" style={docked ? undefined : { flex: '0 0 auto' }}>
          <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          {docked && (
            <>
              <span className="ze-sep" aria-hidden />
              <StatusPill status={status} dirty={dirty} lastSavedAt={lastSavedAt} />
              {saveButton}
            </>
          )}
        </div>
      </header>

      {notice}

      {docked ? (
        /* ── DOCKED: stage + inspector ── */
        <div className="ze-body">
          <main className="ze-stage">
            <PreviewFrame
              device={device}
              sectionStylesCss={sectionStylesCss}
              onReady={onPreviewReady}
              preview={previewNode}
            />
            <SectionOverlay
              doc={iframeDoc}
              selectedPanelId={selected}
              onPick={pickSection}
              panelToViews={panelToViews}
              currentView={view}
              onViewChange={setView}
            />
          </main>
          <aside className="ze-pane ze-dock" aria-label={t.editor.editing}>
            <div className="ze-insp-head">
              {sheetMode === 'fields' && backToList}
              <div style={{ minWidth: 0 }}>
                <span className="ze-insp-kick">{sheetMode === 'fields' ? t.editor.editing : t.editor.sections}</span>
                <h2 className="ze-insp-t">{sheetMode === 'fields' ? activeLabel : brandName}</h2>
              </div>
            </div>
            <div className="ze-scroll">
              <div style={{ padding: '1rem' }}>{body}</div>
            </div>
          </aside>
        </div>
      ) : (
        /* ── PHONE: full-bleed preview + sheet ── */
        <>
          <main className="ze-stage" data-bleed>
            <PreviewFrame
              device="mobile"
              fullBleed
              sectionStylesCss={sectionStylesCss}
              onReady={onPreviewReady}
              preview={previewNode}
            />
            <SectionOverlay
              doc={iframeDoc}
              selectedPanelId={selected}
              onPick={pickSection}
              panelToViews={panelToViews}
              currentView={view}
              onViewChange={setView}
              obscuredBottom={obscured}
            />
          </main>

          {/* At mid the site above the sheet stays live and tappable — that is
              where the reader watches their edit land. Only a full sheet dims
              what little of the site is left, and a tap there lowers it. */}
          {detent === 'full' && (
            <button
              aria-hidden
              tabIndex={-1}
              onClick={() => openTo('mid')}
              className="ze-sheet-scrim"
            />
          )}

          <motion.div
            ref={sheetRef}
            className="ze-sheet"
            data-moving={moving ? 'true' : undefined}
            style={{ height: sheetHeight, y, bottom: bottomInset, willChange: moving ? 'transform' : 'auto' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: detents.peek }}
            dragElastic={0.02}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
          >
            {/* Grab handle + head — the whole head is the drag surface, and
                also the tap target. A TAP OPENS ALL THE WAY: a finger that
                lands and lifts without travelling is not asking for one stop,
                it is asking to see the panel. Buttons inside the head are
                excluded, or the save and the close would both expand the
                sheet on their way to doing their own job. */}
            <div
              className="ze-sheet-grab"
              onClick={(e) => {
                if (movedRef.current) return
                if ((e.target as HTMLElement).closest('button')) return
                openTo('full')
              }}
            >
              <div className="ze-handle" aria-hidden />
              <div className="ze-sheet-head">
                {sheetMode === 'fields' && backToList}
                <div className="ze-sheet-titles">
                  <span className="ze-sheet-t">
                    <span>{sheetMode === 'fields' ? activeLabel : t.editor.editBrand.replace('{name}', brandName)}</span>
                  </span>
                  <StatusPill status={status} dirty={dirty} lastSavedAt={lastSavedAt} compact />
                </div>
                {detent !== 'full' ? (
                  <button type="button" onClick={() => openTo('full')} className="ze-icon" aria-label={t.editor.expand} title={t.editor.expand}>
                    <ChevronUp strokeWidth={2.25} aria-hidden />
                  </button>
                ) : (
                  <button type="button" onClick={() => openTo('mid')} className="ze-icon" aria-label={t.editor.shrink} title={t.editor.shrink}>
                    <ChevronDown strokeWidth={2.25} aria-hidden />
                  </button>
                )}
                {detent !== 'peek' && (
                  <button type="button" onClick={() => openTo('peek')} className="ze-icon" aria-label={t.editor.close} title={t.editor.close}>
                    <X strokeWidth={2.25} aria-hidden />
                  </button>
                )}
                {saveButton}
              </div>
            </div>

            {/* Body — scrolls independently of the sheet drag */}
            <div ref={bodyRef} onFocusCapture={onSheetFocus} className="ze-sheet-body">
              {body}
            </div>
          </motion.div>
        </>
      )}

      {error && content && <div className="ze-toast" role="alert">{error}</div>}
    </div>
  )
}

/* ── Section picker — the list in the sheet and the dock ───────────────── */

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
    <div className="ze-pick">
      {/* The hint lives in the list now. As a bubble floating over the
          preview it sat on top of the site's own buttons. */}
      <p className="ze-note">{t.editor.tapAnySection}</p>

      {config.pages && config.pages.length > 0 && (
        <div className="ze-pages" role="group">
          {config.pages.map((p) => {
            const Icon = p.icon
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setView(p.id)}
                aria-pressed={view === p.id}
                className="ze-chip"
              >
                <Icon strokeWidth={2} aria-hidden style={{ width: 15, height: 15 }} />
                {p.label}
              </button>
            )
          })}
        </div>
      )}

      <div>
        <div className="ze-pick-h">{t.editor.sections}</div>
        <div className="ze-rows">
          {pagePanels.map((p) => (
            <RailRow key={p.id} icon={p.icon || Settings} label={p.label}
              active={selected === p.id} onClick={() => onPick(p.id)} go />
          ))}
        </div>
      </div>

      <div>
        <div className="ze-pick-h">{t.editor.globalAllPages}</div>
        <div className="ze-rows">
          <RailRow icon={Palette} label={t.editor.colorsPalette} active={selected === STYLE_ID} onClick={() => onPick(STYLE_ID)} go />
          <RailRow icon={TypeIcon} label={t.editor.typography} active={selected === TYPO_ID} onClick={() => onPick(TYPO_ID)} go />
          {config.globalPanels.map((p) => (
            <RailRow key={p.id} icon={p.icon || Settings} label={p.label}
              active={selected === p.id} onClick={() => onPick(p.id)} go />
          ))}
        </div>
      </div>
    </div>
  )
}
