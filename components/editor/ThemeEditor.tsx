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
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Palette, Type as TypeIcon, Settings,
  Monitor, Tablet, Smartphone,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { SmallNote } from './EditorFields'
import ClickToEditOverlay from './ClickToEditOverlay'
import PreviewFrame, { type PreviewDevice } from './PreviewFrame'
import MobileEditor from './MobileEditor'
import { useIsMobile } from './useIsMobile'
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

export default function ThemeEditor({
  themeId,
  config,
  Preview,
  backHref,
}: {
  themeId: string
  config: EditorConfig
  Preview: ComponentType<PreviewProps>
  backHref: string
}) {
  const t = useT()
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

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
  const [nowTs, setNowTs] = useState<number>(() => Date.now())

  // Responsive preview device + the iframe handles for click-to-edit.
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null)
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null)

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
      const { data: { user } } = await supabase.auth.getUser()
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
      const c = j?.theme?.content
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
  }, [themeId, supabase, router, config, backHref])

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
      const getRes = await fetch(`/api/themes/${themeId}`)
      const getJson = await getRes.json()
      const fullContent = (getJson?.theme?.content as any) || {}
      const cleanSections = pruneSectionStyles(sectionStyles)
      const nextContent = {
        ...fullContent,
        [config.contentKey]: content,
        style_preset: presetId,
        typography_preset: typographyPreset || undefined,
        color_overrides: Object.keys(colorOverrides).length ? colorOverrides : undefined,
        section_styles: Object.keys(cleanSections).length ? cleanSections : undefined,
      }
      const r = await fetch(`/api/themes/${themeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: nextContent }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.message || j?.error || t.editor.saveFailedStatus.replace('{status}', String(r.status)))
      }
      setOriginal(snapshot(content, presetId, typographyPreset, colorOverrides, sectionStyles))
      setLastSavedAt(Date.now())
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1600)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || t.editor.saveFailedDot)
    }
  }, [content, presetId, typographyPreset, colorOverrides, sectionStyles, themeId, config.contentKey])

  // Autosave — fires ~1.4s after edits settle.
  useEffect(() => {
    if (!dirty || status === 'saving') return
    const t = setTimeout(() => { void save() }, 1400)
    return () => clearTimeout(t)
  }, [dirty, status, save])

  // Tick the "saved Xs ago" label.
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

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
  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center text-[13px] text-muted">
        {t.editor.loadingEditor}
      </main>
    )
  }
  if (error && !content) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-foreground">{error}</p>
        <Link href="/dashboard/sites" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t.editor.backToSites}
        </Link>
      </main>
    )
  }
  if (!content) return null

  const themeName = config.brandNamePath
    ? (getPath(content, config.brandNamePath) || config.themeName)
    : config.themeName

  // ── Phone layout ─────────────────────────────────────────────────────
  // Below `lg` we render a completely different tree (full-bleed preview +
  // draggable sheet) instead of CSS-hiding the desktop rails, so only ONE
  // live theme <iframe> mounts. All state above is shared — MobileEditor is
  // pure presentation.
  if (isMobile) {
    return (
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
          now={nowTs}
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
        />
      </AiCopyProvider>
    )
  }

  // Resolve which panel to render in the right rail
  const allPanels: EditorPanel[] = [...config.panels, ...config.globalPanels]
  const activePanel = allPanels.find((p) => p.id === selected)
  const activePanelLabel =
    selected === '__style__' ? t.editor.colorsPalette :
    selected === '__typography__' ? t.editor.typography :
    activePanel?.label || ''

  return (
    <AiCopyProvider value={aiCopyValue}>
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      {/* Top bar */}
      <header
        className="flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-token bg-white px-4"
        style={{ boxShadow: '0 1px 0 #f0ede6' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/dashboard/sites"
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-muted hover:bg-black/5"
          >
            <ArrowLeft className="h-3 w-3 rtl-flip" strokeWidth={2.25} />
            <span className="hidden sm:inline">{t.editor.backToDashboard}</span>
          </Link>
          <div className="hidden lg:flex">
            <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          </div>
          <span className="hidden truncate text-[13px] text-muted xl:inline">
            {t.editor.edit} <strong className="font-semibold text-foreground">{themeName}</strong>
          </span>
        </div>

        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
          {config.pages && config.pages.length > 0 && (
            <PageSwitcher pages={config.pages} view={view} onChange={(v) => setView(v)} />
          )}
          <DeviceToggle device={device} onChange={setDevice} />
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex">
          <StatusPill status={status} dirty={dirty} lastSavedAt={lastSavedAt} now={nowTs} />
          <span className="hidden text-[11px] text-muted/70 sm:inline">
            <kbd className="rounded border border-token bg-surface px-1 py-px text-[10px]">⌘S</kbd> to save
          </span>
          <button
            onClick={save}
            disabled={!dirty || status === 'saving'}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Save className="h-3 w-3" strokeWidth={2.5} />
            {t.editor.save}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        {/* Left rail */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-e border-token bg-white">
          <div className="border-b border-token px-3 py-3">
            <div className="flex items-baseline justify-between px-1.5 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">{t.editor.sections}</span>
              {config.pages && config.pages.length > 0 && (
                <span className="text-[10px] text-muted/60">
                  {config.pages.find((p) => p.id === view)?.label || ''}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {config.panels
                .filter((p) => panelInView(p, view))
                .map((p) => {
                  const Icon = p.icon || Settings
                  const active = selected === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition ' +
                        (active ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                      }
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                      <span className="truncate text-[13px]">{p.label}</span>
                    </button>
                  )
                })}
            </div>
          </div>

          <div className="px-3 py-3">
            <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">{t.editor.globalAllPages}</div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setSelected('__style__')}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition ' +
                  (selected === '__style__' ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <Palette className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="text-[13px]">{t.editor.colorsPalette}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelected('__typography__')}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition ' +
                  (selected === '__typography__' ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="text-[13px]">{t.editor.typography}</span>
              </button>
              {config.globalPanels.map((p) => {
                const Icon = p.icon || Settings
                const active = selected === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition ' +
                      (active ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                    }
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span className="truncate text-[13px]">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Live preview */}
        <main
          className="relative flex-1 overflow-hidden"
          style={{ background: '#0a0a0c' }}
        >
          <PreviewFrame
            device={device}
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
                onViewChange={(v) => setView(v)}
              />
            )}
          />
          <ClickToEditOverlay
            doc={iframeDoc}
            iframe={iframeEl}
            currentView={view}
            onPick={setSelected}
            panelToViews={Object.fromEntries(
              config.panels
                .map((p) => [p.id, panelViews(p)] as const)
                .filter(([, v]) => v !== null) as Array<[string, string[]]>
            )}
            onViewChange={(v) => setView(v)}
          />
        </main>

        {/* Right rail — fields */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-s border-token bg-white">
          <div className="sticky top-0 z-10 border-b border-token bg-white px-4 py-3" style={{ boxShadow: '0 1px 0 #f0ede6' }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{t.editor.editing}</div>
            <div className="mt-0.5 text-[15px] font-semibold text-foreground">
              {activePanelLabel || t.editor.section}
            </div>
          </div>

          <div className="space-y-4 px-4 py-4">
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
        </aside>
      </div>

      {error && content && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-[#fca5a5] bg-[#fee2e2] px-3 py-2 text-[12.5px] font-medium text-[#b91c1c] shadow-lg">
          {error}
        </div>
      )}
    </div>
    </AiCopyProvider>
  )
}

/* ── Device toggle — responsive preview viewport ─────────────────────── */
function DeviceToggle({
  device, onChange,
}: { device: PreviewDevice; onChange: (d: PreviewDevice) => void }) {
  const t = useT()
  const items: Array<{ id: PreviewDevice; Icon: typeof Monitor; label: string }> = [
    { id: 'desktop', Icon: Monitor,    label: t.editor.desktop },
    { id: 'tablet',  Icon: Tablet,     label: t.editor.tablet },
    { id: 'mobile',  Icon: Smartphone, label: t.editor.mobile },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-token bg-surface/60 p-0.5">
      {items.map(({ id, Icon, label }) => {
        const active = device === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={t.editor.previewLabel.replace('{label}', label)}
            aria-label={t.editor.previewLabel.replace('{label}', label)}
            aria-pressed={active}
            className={
              'inline-flex items-center justify-center rounded-full px-2.5 py-1 transition ' +
              (active ? 'bg-foreground text-white shadow-sm' : 'text-muted hover:bg-black/[0.04] hover:text-foreground')
            }
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
          </button>
        )
      })}
    </div>
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
    <div className="hidden min-w-0 max-w-full flex-shrink items-center gap-0.5 overflow-x-auto rounded-full border border-token bg-surface/60 p-0.5 md:flex">
      {pages.map((p) => {
        const Icon = p.icon
        const active = view === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={
              'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition ' +
              (active
                ? 'bg-foreground text-white shadow-sm'
                : 'text-muted hover:bg-black/[0.04] hover:text-foreground')
            }
            title={t.editor.editPage.replace('{label}', p.label)}
          >
            <Icon className="h-3 w-3" strokeWidth={2.25} />
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
