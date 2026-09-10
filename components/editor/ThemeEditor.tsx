'use client'

/**
 * Schema-driven theme editor — shared shell used by every brochure theme.
 *
 * The page route hands us:
 *   - a themeId + a Preview component for the current theme
 *   - an editor config (sections + fields + color tokens + presets)
 *
 * We handle:
 *   - load + save the theme via /api/themes/[id] (PATCH)
 *   - autosave (debounced) + manual save, with a "saved Xs ago" indicator
 *   - undo / redo across every edit (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z / Ctrl+Y)
 *   - left rail: pages + section panels + global panels
 *   - right rail: render fields from the config, each with inline AI rewrite
 *   - middle: render the Preview inside a responsive device frame (iframe)
 *   - keyboard: Cmd/Ctrl+S to save
 *
 * Color overrides + typography preset live at the wrapper level
 * (content.color_overrides, content.typography_preset, content.style_preset)
 * so every theme stores them in the same place.
 *
 * THREE LAYOUTS, TWO TREES. Below 1280px the editor renders MobileEditor —
 * the phone sheet under 768px, a docked inspector from 768px — and at 1280px
 * and up the three panes below. Only one tree mounts, so only one live theme
 * iframe ever exists. All STATE lives here; both trees are presentation.
 * Styled by ./editor-style.ts; the selection ring is ./SectionOverlay.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Palette, Type as TypeIcon, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { chromeFont } from '@/components/app/chrome-font'
import { SmallNote } from './EditorFields'
import SectionOverlay from './SectionOverlay'
import PreviewFrame, { type PreviewDevice } from './PreviewFrame'
import MobileEditor from './MobileEditor'
import { useIsMobile, useMediaQuery } from './useIsMobile'
import { EditorStyle, RailRow, DeviceToggle } from './chrome'
import { EditorEnvProvider } from './env'
import {
  FieldsRenderer, ColorsPanel, TypographyPanel, SectionStyleHeader,
  UndoRedo, StatusPill, type Status,
} from './panels'
import { AiCopyProvider, type AiCopyContextValue, type AiBrand } from './AiRewrite'
import {
  getPath, setPath, sectionStylesToCss, panelInView, panelViews,
  type EditorConfig, type EditorPage, type EditorPanel,
  type SectionStyles, type SectionStyle,
} from '@/utils/theme-editor-types'

/** The full editable state — what undo/redo snapshots. */
type Doc = {
  content: any
  presetId: string
  typographyPreset: string
  colorOverrides: Record<string, string>
  sectionStyles: SectionStyles
}

export type PreviewProps = {
  content: any
  presetId: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  /** Per-section text scale + alignment. Themes opt in by tagging section
   *  roots with `data-section="<panelId>"`. */
  sectionStyles?: SectionStyles
  view?: string
  onViewChange?: (v: string) => void
}

/**
 * Where the editor reads and writes the theme's wrapper content
 * (theme.content, holding content[config.contentKey] plus the style keys).
 *
 * The live routes pass nothing and get the default: the signed-in user and
 * GET/PATCH /api/themes/[id], exactly as before. A store is only for a
 * surface that must never touch the database — the /demo/editor candidate
 * keeps its edits in memory through one of these, so it runs every real
 * mechanic (autosave, undo, the save indicator) without a session or a row.
 */
export type EditorStore = {
  load: () => Promise<any>
  /** Throw to report a failed save; the editor shows it like a PATCH error. */
  save: (nextContent: any) => Promise<void>
}

export default function ThemeEditor({
  themeId,
  config,
  Preview,
  backHref,
  exitHref = '/dashboard/sites',
  store,
  notice,
}: {
  themeId: string
  config: EditorConfig
  Preview: ComponentType<PreviewProps>
  backHref: string
  /** The top bar's way out. The live routes keep /dashboard/sites. */
  exitHref?: string
  store?: EditorStore
  /** A strip under the top bar (desktop) or atop the section list (compact).
   *  The candidate uses it to say that nothing is stored. */
  notice?: ReactNode
}) {
  const t = useT()
  const router = useRouter()
  // No store means the live path, which needs the browser client. With a
  // store there is no session to read, so no client is created at all.
  const supabase = useMemo(() => (store ? null : createClient()), [store])
  const isMobile = useIsMobile('(max-width: 1279px)')
  // Settled by the time loading ends, so MobileEditor opens in the right form
  // at once instead of mounting the phone tree's iframe and then the dock's.
  const wide = useMediaQuery('(min-width: 768px)')
  const env = useMemo(() => ({ offline: !!store }), [store])

  // ── State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  // Inner content (e.g. content.atlas) — what most fields edit.
  const [content, setContent] = useState<any>(null)
  // Wrapper-level style state.
  const [presetId, setPresetId] = useState<string>(config.defaultPresetId)
  const [typographyPreset, setTypographyPreset] = useState<string>('')
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({})
  const [sectionStyles, setSectionStyles] = useState<SectionStyles>({})

  const [original, setOriginal] = useState<string>('')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  // Responsive preview device + the iframe document for the selection overlay.
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null)

  // Selection state
  const [view, setView] = useState<string>(config.pages?.[0]?.id || 'home')
  const [selected, setSelected] = useState<string>(config.panels[0]?.id || '')

  // Undo / redo history.
  const historyRef = useRef<{ stack: Doc[]; index: number }>({ stack: [], index: 0 })
  const restoringRef = useRef(false)
  const [, setHistVer] = useState(0)
  const canUndo = historyRef.current.index > 0
  const canRedo = historyRef.current.index < historyRef.current.stack.length - 1

  // Live content ref so the AI context getters always read the latest copy
  // without re-creating the context value on every keystroke.
  const liveContentRef = useRef<any>(null)
  liveContentRef.current = content

  // ── Load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      let c: any
      if (store) {
        c = await store.load()
        if (cancelled) return
      } else {
        const { data: { user } } = await supabase!.auth.getUser()
        if (cancelled) return
        if (!user) {
          router.push(`/login?next=${backHref}/edit`)
          return
        }
        const r = await fetch(`/api/themes/${themeId}`)
        if (!r.ok) {
          setError(r.status === 404 ? t.editor.themeNotFound : t.editor.noAccess)
          setLoading(false)
          return
        }
        const j = await r.json()
        c = j?.theme?.content
      }
      const inner = c?.[config.contentKey]
      if (!inner) {
        setError(t.editor.notThisTemplate.replace('{name}', config.themeName))
        setLoading(false)
        return
      }
      const nextContent = inner
      const nextPreset = c.style_preset || config.defaultPresetId
      const nextTypo = c.typography_preset || ''
      const nextOverrides = (c.color_overrides as Record<string, string>) || {}
      const nextSections = (c.section_styles as SectionStyles) || {}

      setContent(nextContent)
      setPresetId(nextPreset)
      setTypographyPreset(nextTypo)
      setColorOverrides(nextOverrides)
      setSectionStyles(nextSections)
      setOriginal(snapshot(nextContent, nextPreset, nextTypo, nextOverrides, nextSections))

      // Seed the undo history with the loaded state.
      historyRef.current = {
        stack: [{
          content: nextContent, presetId: nextPreset, typographyPreset: nextTypo,
          colorOverrides: nextOverrides, sectionStyles: nextSections,
        }],
        index: 0,
      }
      setHistVer((v) => v + 1)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [themeId, supabase, router, config, backHref, store])

  // ── Dirty detection ──────────────────────────────────────────────────
  const dirty = useMemo(() => {
    if (!content) return false
    return snapshot(content, presetId, typographyPreset, colorOverrides, sectionStyles) !== original
  }, [content, presetId, typographyPreset, colorOverrides, sectionStyles, original])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ── Save ───────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!content) return
    setStatus('saving'); setError(null)
    try {
      let fullContent: any
      if (store) {
        fullContent = (await store.load()) || {}
      } else {
        const getRes = await fetch(`/api/themes/${themeId}`)
        const getJson = await getRes.json()
        fullContent = (getJson?.theme?.content as any) || {}
      }
      const cleanSections = pruneSectionStyles(sectionStyles)
      const nextContent = {
        ...fullContent,
        [config.contentKey]: content,
        style_preset: presetId,
        typography_preset: typographyPreset || undefined,
        color_overrides: Object.keys(colorOverrides).length ? colorOverrides : undefined,
        section_styles: Object.keys(cleanSections).length ? cleanSections : undefined,
      }
      if (store) {
        await store.save(nextContent)
      } else {
        const r = await fetch(`/api/themes/${themeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: nextContent }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j?.message || j?.error || t.editor.saveFailedStatus.replace('{status}', String(r.status)))
        }
      }
      setOriginal(snapshot(content, presetId, typographyPreset, colorOverrides, sectionStyles))
      setLastSavedAt(Date.now())
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1600)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || t.editor.saveFailedDot)
    }
  }, [content, presetId, typographyPreset, colorOverrides, sectionStyles, themeId, config.contentKey, store])

  // Autosave — fires ~1.4s after edits settle.
  useEffect(() => {
    if (!dirty || status === 'saving') return
    const t = setTimeout(() => { void save() }, 1400)
    return () => clearTimeout(t)
  }, [dirty, status, save])

  // "Saved Xs ago" keeps its own clock — see SavedAgo in ./panels. A ticker
  // here re-rendered the whole editor, and the site, every 15 seconds.

  // ── Undo / redo ──────────────────────────────────────────────────────
  function applyDoc(d: Doc) {
    restoringRef.current = true
    setContent(d.content)
    setPresetId(d.presetId)
    setTypographyPreset(d.typographyPreset)
    setColorOverrides(d.colorOverrides)
    setSectionStyles(d.sectionStyles)
  }

  const undo = useCallback(() => {
    const h = historyRef.current
    if (h.index <= 0) return
    const idx = h.index - 1
    historyRef.current = { stack: h.stack, index: idx }
    applyDoc(h.stack[idx])
    setHistVer((v) => v + 1)
  }, [])

  const redo = useCallback(() => {
    const h = historyRef.current
    if (h.index >= h.stack.length - 1) return
    const idx = h.index + 1
    historyRef.current = { stack: h.stack, index: idx }
    applyDoc(h.stack[idx])
    setHistVer((v) => v + 1)
  }, [])

  // Push edits onto the history stack (debounced so a burst of typing collapses
  // into one undo step). Restores skip the push.
  useEffect(() => {
    if (loading || !content) return
    if (restoringRef.current) { restoringRef.current = false; return }
    const t = setTimeout(() => {
      const h = historyRef.current
      const curDoc: Doc = { content, presetId, typographyPreset, colorOverrides, sectionStyles }
      const top = h.stack[h.index]
      if (top && snapshotDoc(top) === snapshotDoc(curDoc)) return
      const stack = h.stack.slice(0, h.index + 1)
      stack.push(curDoc)
      if (stack.length > 80) stack.shift()
      historyRef.current = { stack, index: stack.length - 1 }
      setHistVer((v) => v + 1)
    }, 400)
    return () => clearTimeout(t)
  }, [content, presetId, typographyPreset, colorOverrides, sectionStyles, loading])

  // ── Keyboard: save + undo/redo ───────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 's') {
        e.preventDefault()
        if (dirty && status !== 'saving') void save()
        return
      }
      const tgt = e.target as HTMLElement | null
      const inField = !!tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)
      if (k === 'z' && !e.shiftKey) {
        if (inField) return // let native text undo win while typing in a field
        e.preventDefault(); undo(); return
      }
      if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault(); redo(); return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, status, save, undo, redo])

  // When the user switches pages, the currently selected section may no
  // longer belong to the new page. Re-pick the first visible section so the
  // right rail never shows a section that isn't in the left rail.
  useEffect(() => {
    if (selected === '__style__' || selected === '__typography__') return
    if (config.globalPanels.some((p) => p.id === selected)) return
    const visiblePanels = config.panels.filter((p) => panelInView(p, view))
    if (visiblePanels.some((p) => p.id === selected)) return
    if (visiblePanels.length > 0) setSelected(visiblePanels[0].id)
  }, [view, selected, config.panels, config.globalPanels])

  // ── AI copy context — stable value, getters read the live content. ─────
  const aiCopyValue = useMemo<AiCopyContextValue>(() => ({
    themeName: config.themeName,
    businessType: config.contentKey,
    getBrand: () => extractBrand(liveContentRef.current, config),
    getVoiceSample: () => extractVoiceSample(liveContentRef.current),
  }), [config])

  // ── The preview, memoised on exactly the state it reads. ───────────────
  // PreviewFrame re-renders the iframe root when this element changes
  // identity and at no other time, so a status change, an undo-history
  // tick or a rail click re-renders the editor chrome and never the site.
  // setView is a state setter, so it is stable; an inline (v) => setView(v)
  // would hand the preview a new prop every render and defeat the memo.
  const previewNode = useMemo(() => (content ? (
    <Preview
      content={content}
      presetId={presetId}
      colorOverrides={colorOverrides}
      typographyPreset={typographyPreset || undefined}
      sectionStyles={sectionStyles}
      view={view}
      onViewChange={setView}
    />
  ) : null), [Preview, content, presetId, colorOverrides, typographyPreset, sectionStyles, view])

  const sectionStylesCss = useMemo(
    () => (Object.keys(sectionStyles).length ? sectionStylesToCss(sectionStyles) : ''),
    [sectionStyles],
  )

  // Stable so the overlay's listeners are bound once per iframe document, not
  // re-bound on every keystroke (it was built inline, a new object each render).
  const panelToViews = useMemo(() => Object.fromEntries(
    config.panels
      .map((p) => [p.id, panelViews(p)] as const)
      .filter(([, v]) => v !== null) as Array<[string, string[]]>
  ), [config.panels])

  const onPreviewReady = useCallback((d: Document) => { setIframeDoc(d) }, [])

  // ── Helpers ──────────────────────────────────────────────────────────
  function patchPath(path: string, value: any) {
    setContent((c: any) => setPath(c, path, value))
  }
  function setOverride(key: string, value: string | undefined) {
    setColorOverrides((cur) => {
      const next = { ...cur }
      if (value === undefined || value === '') delete next[key]
      else next[key] = value
      return next
    })
  }
  function resetOverrides() { setColorOverrides({}) }

  function patchSectionStyle(panelId: string, patch: Partial<SectionStyle>) {
    setSectionStyles((cur) => {
      const next = { ...cur }
      const cur1 = { ...(next[panelId] || {}), ...patch }
      // Strip empty values so we don't persist no-ops.
      if (cur1.text_scale == null || cur1.text_scale === 1) delete cur1.text_scale
      if (!cur1.text_align) delete cur1.text_align
      if (Object.keys(cur1).length === 0) {
        delete next[panelId]
      } else {
        next[panelId] = cur1
      }
      return next
    })
  }

  function clearSectionStyle(panelId: string) {
    setSectionStyles((cur) => {
      if (!(panelId in cur)) return cur
      const next = { ...cur }
      delete next[panelId]
      return next
    })
  }

  // ── Render gates ─────────────────────────────────────────────────────
  // A skeleton in the shape of the workbench rather than a line of text on a
  // blank page, so the layout does not jump when the theme arrives.
  if (loading) {
    return (
      <div className={'ze-root ' + chromeFont.variable} aria-busy="true">
        <EditorStyle />
        <div className="ze-bar" />
        <div className="ze-skel">
          {!isMobile && <div style={{ width: 248 }} />}
          <div className="ze-skel-mid">
            <span role="status" className="ze-loading">{t.editor.loadingEditor}</span>
            {/* The editor is an application; without scripts it cannot load,
                and a loading line that never resolves would say otherwise —
                so without scripts the line is withdrawn and this says why. */}
            <noscript>
              <style>{'.ze-loading{display:none}'}</style>
              <p className="ze-note">{t.editor.needsJs}</p>
            </noscript>
          </div>
          {!isMobile && <div style={{ width: 340 }} />}
        </div>
      </div>
    )
  }
  if (error && !content) {
    return (
      <div className={'ze-root ' + chromeFont.variable}>
        <EditorStyle />
        <div className="ze-empty" role="alert">
          <p>{error}</p>
          <Link href={exitHref} className="ze-btn" data-tone="quiet">
            {t.editor.backToSites}
          </Link>
        </div>
      </div>
    )
  }
  if (!content) return null

  const themeName = config.brandNamePath
    ? (getPath(content, config.brandNamePath) || config.themeName)
    : config.themeName

  // ── Compact layouts (phone sheet, docked inspector) ─────────────────────
  // Below 1280px we render a different tree instead of CSS-hiding the rails,
  // so only ONE live theme <iframe> mounts. All state above is shared —
  // MobileEditor is pure presentation.
  if (isMobile) {
    return (
      <EditorEnvProvider value={env}>
      <AiCopyProvider value={aiCopyValue}>
        <MobileEditor
          themeName={themeName}
          backHref={backHref}
          config={config}
          Preview={Preview}
          content={content}
          presetId={presetId}
          colorOverrides={colorOverrides}
          typographyPreset={typographyPreset}
          sectionStyles={sectionStyles}
          selected={selected}
          setSelected={setSelected}
          view={view}
          setView={setView}
          status={status}
          dirty={dirty}
          lastSavedAt={lastSavedAt}
          save={save}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          patchPath={patchPath}
          setPresetId={setPresetId}
          setOverride={setOverride}
          resetOverrides={resetOverrides}
          setTypographyPreset={setTypographyPreset}
          patchSectionStyle={patchSectionStyle}
          clearSectionStyle={clearSectionStyle}
          error={error}
          notice={notice}
          docked={wide}
        />
      </AiCopyProvider>
      </EditorEnvProvider>
    )
  }

  // Resolve which panel to render in the inspector.
  const allPanels: EditorPanel[] = [...config.panels, ...config.globalPanels]
  const activePanel = allPanels.find((p) => p.id === selected)
  const activePanelLabel =
    selected === '__style__' ? t.editor.colorsPalette :
    selected === '__typography__' ? t.editor.typography :
    activePanel?.label || ''

  return (
    <EditorEnvProvider value={env}>
    <AiCopyProvider value={aiCopyValue}>
    <div className={'ze-root ' + chromeFont.variable}>
      <EditorStyle />

      {/* ── The bar: the way out, the page and the device, the save. ── */}
      <header className="ze-bar">
        <div className="ze-bar-start">
          <Link href={exitHref} className="ze-icon" data-label>
            <ArrowLeft className="rtl-flip" strokeWidth={2} aria-hidden />
            <span>{t.editor.back}</span>
          </Link>
          <span className="ze-sep" aria-hidden />
          <h1 className="ze-title">
            <span className="ze-title-q">{t.editor.edit} </span>{themeName}
          </h1>
        </div>

        <div className="ze-bar-mid">
          {config.pages && config.pages.length > 0 && (
            <PageSwitcher pages={config.pages} view={view} onChange={setView} />
          )}
          <DeviceToggle device={device} onChange={setDevice} />
        </div>

        <div className="ze-bar-end">
          <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          <span className="ze-sep" aria-hidden />
          <StatusPill status={status} dirty={dirty} lastSavedAt={lastSavedAt} />
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
        </div>
      </header>

      {notice}

      <div className="ze-body">
        {/* ── The rail: what there is to edit. ── */}
        <aside className="ze-pane ze-rail" aria-label={t.editor.sections}>
          <div className="ze-scroll">
            <div className="ze-group">
              <div className="ze-group-h">
                <span>{t.editor.sections}</span>
                {config.pages && config.pages.length > 0 && (
                  <span>{config.pages.find((p) => p.id === view)?.label || ''}</span>
                )}
              </div>
              <div className="ze-rows">
                {config.panels
                  .filter((p) => panelInView(p, view))
                  .map((p) => (
                    <RailRow key={p.id} icon={p.icon || Settings} label={p.label}
                      active={selected === p.id} onClick={() => setSelected(p.id)} />
                  ))}
              </div>
            </div>

            <div className="ze-group">
              <div className="ze-group-h"><span>{t.editor.globalAllPages}</span></div>
              <div className="ze-rows">
                <RailRow icon={Palette} label={t.editor.colorsPalette}
                  active={selected === '__style__'} onClick={() => setSelected('__style__')} />
                <RailRow icon={TypeIcon} label={t.editor.typography}
                  active={selected === '__typography__'} onClick={() => setSelected('__typography__')} />
                {config.globalPanels.map((p) => (
                  <RailRow key={p.id} icon={p.icon || Settings} label={p.label}
                    active={selected === p.id} onClick={() => setSelected(p.id)} />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── The stage: the site itself, and the ring on what is edited. ── */}
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
            onPick={setSelected}
            panelToViews={panelToViews}
            currentView={view}
            onViewChange={setView}
          />
        </main>

        {/* ── The inspector: the fields of the one thing selected. ── */}
        <aside className="ze-pane ze-insp" aria-label={t.editor.editing}>
          <div className="ze-insp-head">
            <div style={{ minWidth: 0 }}>
              <span className="ze-insp-kick">{t.editor.editing}</span>
              <h2 className="ze-insp-t">{activePanelLabel || t.editor.section}</h2>
            </div>
          </div>

          <div className="ze-scroll">
            <div className="ze-insp-body">
              {selected === '__style__' ? (
                <ColorsPanel
                  presetId={presetId}
                  setPresetId={setPresetId}
                  colorOverrides={colorOverrides}
                  setOverride={setOverride}
                  resetOverrides={resetOverrides}
                  config={config}
                />
              ) : selected === '__typography__' ? (
                <TypographyPanel
                  value={typographyPreset}
                  onChange={setTypographyPreset}
                />
              ) : activePanel ? (
                <>
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
                </>
              ) : (
                <SmallNote>{t.editor.pickSectionFromSide}</SmallNote>
              )}
            </div>
          </div>
        </aside>
      </div>

      {error && content && <div className="ze-toast" role="alert">{error}</div>}
    </div>
    </AiCopyProvider>
    </EditorEnvProvider>
  )
}

/* ── Page switcher — top-bar control for multi-page themes. ───────────── */
function PageSwitcher({
  pages, view, onChange,
}: {
  pages: EditorPage[]
  view: string
  onChange: (id: string) => void
}) {
  const t = useT()
  return (
    <div className="ze-seg" role="group">
      {pages.map((p) => {
        const Icon = p.icon
        const active = view === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            aria-pressed={active}
            className="ze-seg-b"
            title={t.editor.editPage.replace('{label}', p.label)}
          >
            <Icon strokeWidth={2} aria-hidden />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

function snapshot(
  content: any,
  preset: string,
  typography: string,
  overrides: Record<string, string>,
  sections: SectionStyles,
) {
  return JSON.stringify({ content, preset, typography, overrides, sections })
}

function snapshotDoc(d: Doc): string {
  return snapshot(d.content, d.presetId, d.typographyPreset, d.colorOverrides, d.sectionStyles)
}

function pruneSectionStyles(s: SectionStyles): SectionStyles {
  const out: SectionStyles = {}
  for (const [k, v] of Object.entries(s)) {
    const next: SectionStyle = {}
    if (typeof v.text_scale === 'number' && v.text_scale > 0 && v.text_scale !== 1) {
      next.text_scale = v.text_scale
    }
    // Keep every explicit alignment — including 'left'. In an RTL theme the
    // inherited default is right, so 'left' is a real override that must persist.
    if (v.text_align) {
      next.text_align = v.text_align
    }
    if (Object.keys(next).length > 0) out[k] = next
  }
  return out
}

/* ── AI copy context extractors ──────────────────────────────────────── *
 * Pull the brand identity + a sample of the site's existing copy so the   *
 * inline AI rewriter can match the theme's established voice.             *
 * ────────────────────────────────────────────────────────────────────── */

function extractBrand(content: any, config: EditorConfig): AiBrand {
  if (!content || typeof content !== 'object') return {}
  const rawName = config.brandNamePath ? getPath(content, config.brandNamePath) : content?.brand?.name
  const b = (content.brand && typeof content.brand === 'object') ? content.brand : {}
  return {
    name: typeof rawName === 'string' ? rawName : (typeof b.name === 'string' ? b.name : undefined),
    tagline: typeof b.tagline === 'string' ? b.tagline : undefined,
    category: typeof b.category === 'string' ? b.category : undefined,
  }
}

function extractVoiceSample(content: any): string[] {
  if (!content || typeof content !== 'object') return []
  const out: string[] = []
  const push = (v: any) => {
    if (typeof v !== 'string') return
    const t = v.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()
    if (t.length > 2 && t.length <= 180) out.push(t)
  }
  push(content?.brand?.tagline)
  push(content?.hero?.headline)
  push(content?.hero?.subheadline)
  for (const key of Object.keys(content)) {
    const sec = (content as any)[key]
    if (sec && typeof sec === 'object' && !Array.isArray(sec)) {
      push(sec.heading); push(sec.subheading); push(sec.description); push(sec.tagline)
      if (Array.isArray(sec.items)) {
        for (const it of sec.items.slice(0, 2)) { push(it?.title); push(it?.description); push(it?.quote) }
      }
    }
  }
  return Array.from(new Set(out)).slice(0, 8)
}
