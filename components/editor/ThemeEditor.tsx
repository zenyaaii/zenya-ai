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
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Check, Palette, Type as TypeIcon, RotateCcw, Settings,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Monitor, Tablet, Smartphone,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  FieldText, FieldTextArea, FieldNumber, FieldImage, SectionLabel,
  SmallNote, Collapsible, AddRowButton, StringList, ColorRow, MoodChip,
} from './EditorFields'
import ClickToEditOverlay from './ClickToEditOverlay'
import PreviewFrame, { type PreviewDevice } from './PreviewFrame'
import { useNotify } from '@/components/ui/Notify'
import { AiCopyProvider, type AiCopyContextValue, type AiBrand } from './AiRewrite'
import {
  getPath, setPath, sectionStylesToCss, SECTION_TEXT_SCALES, panelInView, panelViews,
  type EditorConfig, type EditorFieldDef, type EditorPage, type EditorPanel,
  type SectionStyles, type SectionStyle, type SectionTextAlign,
} from '@/utils/theme-editor-types'
import {
  TYPOGRAPHY_PRESETS, TYPOGRAPHY_MOODS,
} from '@/utils/theme-editor-typography'

type Status = 'idle' | 'saving' | 'saved' | 'error'

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
  const router = useRouter()
  const supabase = createClient()

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
        setError(r.status === 404 ? 'القالب غير موجود.' : 'لا تملك صلاحية الوصول إلى هذا القالب.')
        setLoading(false)
        return
      }
      const j = await r.json()
      const c = j?.theme?.content
      const inner = c?.[config.contentKey]
      if (!inner) {
        setError(`هذا القالب ليس قالب ${config.themeName} — لا يوجد محرّر متاح.`)
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
        throw new Error(j?.message || j?.error || `فشل الحفظ (${r.status})`)
      }
      setOriginal(snapshot(content, presetId, typographyPreset, colorOverrides, sectionStyles))
      setLastSavedAt(Date.now())
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1600)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'فشل الحفظ.')
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
        جارٍ تحميل المحرّر…
      </main>
    )
  }
  if (error && !content) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-foreground">{error}</p>
        <Link href="/dashboard/sites" className="mt-4 inline-block text-sm text-primary hover:underline">
          → العودة إلى المواقع
        </Link>
      </main>
    )
  }
  if (!content) return null

  const themeName = config.brandNamePath
    ? (getPath(content, config.brandNamePath) || config.themeName)
    : config.themeName

  // Resolve which panel to render in the right rail
  const allPanels: EditorPanel[] = [...config.panels, ...config.globalPanels]
  const activePanel = allPanels.find((p) => p.id === selected)
  const activePanelLabel =
    selected === '__style__' ? 'الألوان واللوحة' :
    selected === '__typography__' ? 'الطباعة' :
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
            العودة إلى لوحة التحكم
          </Link>
          <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          <span className="hidden truncate text-[13px] text-muted xl:inline">
            تحرير <strong className="font-semibold text-foreground">{themeName}</strong>
          </span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {config.pages && config.pages.length > 0 && (
            <PageSwitcher pages={config.pages} view={view} onChange={(v) => setView(v)} />
          )}
          <DeviceToggle device={device} onChange={setDevice} />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
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
            حفظ
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        {/* Left rail */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-e border-token bg-white">
          <div className="border-b border-token px-3 py-3">
            <div className="flex items-baseline justify-between px-1.5 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">الأقسام</span>
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
            <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">عام · كل الصفحات</div>
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
                <span className="text-[13px]">الألوان واللوحة</span>
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
                <span className="text-[13px]">الطباعة</span>
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
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">قيد التحرير</div>
            <div className="mt-0.5 text-[15px] font-semibold text-foreground">
              {activePanelLabel || 'القسم'}
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
              <SmallNote>اختر قسمًا من الجهة لبدء التحرير.</SmallNote>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 text-center lg:hidden">
        <div className="max-w-sm">
          <p className="text-[15px] font-semibold text-foreground">يحتاج المحرّر إلى شاشة أكبر.</p>
          <p className="mt-2 text-[13px] text-muted">
            افتحه على حاسوب محمول أو مكتبي للتحرير. يمكنك معاينة تخطيط الجوال من هناك عبر مبدّل الأجهزة.
          </p>
          <Link href={backHref} className="mt-5 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white">
            العودة إلى المعاينة
          </Link>
        </div>
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

/* ────────────────────────────────────────────────────────────────────── *
 * Panels                                                                  *
 * ────────────────────────────────────────────────────────────────────── */

function FieldsRenderer({
  fields, content, patchPath, panelLabel,
}: { fields: EditorFieldDef[]; content: any; patchPath: (p: string, v: any) => void; panelLabel?: string }) {
  return (
    <>
      {fields.map((f, i) => (
        <RenderField key={i} field={f} content={content} patchPath={patchPath} panelLabel={panelLabel} />
      ))}
    </>
  )
}

function RenderField({
  field, content, patchPath, panelLabel,
}: { field: EditorFieldDef; content: any; patchPath: (p: string, v: any) => void; panelLabel?: string }) {
  const { confirm } = useNotify()
  if (field.type === 'note') {
    return <SmallNote>{field.content}</SmallNote>
  }
  if (field.type === 'text') {
    return (
      <FieldText
        label={field.label}
        value={getPath(content, field.path) ?? ''}
        onChange={(v) => patchPath(field.path, v)}
        placeholder={field.placeholder}
        panelLabel={panelLabel}
      />
    )
  }
  if (field.type === 'textarea') {
    return (
      <FieldTextArea
        label={field.label}
        rows={field.rows}
        value={getPath(content, field.path) ?? ''}
        onChange={(v) => patchPath(field.path, v)}
        placeholder={field.placeholder}
        panelLabel={panelLabel}
      />
    )
  }
  if (field.type === 'number') {
    return (
      <FieldNumber
        label={field.label}
        value={Number(getPath(content, field.path)) || 0}
        onChange={(v) => patchPath(field.path, v)}
        min={field.min} max={field.max} step={field.step}
      />
    )
  }
  if (field.type === 'image') {
    return (
      <FieldImage
        label={field.label}
        value={getPath(content, field.path) ?? ''}
        onChange={(v) => patchPath(field.path, v)}
        hint={field.hint}
      />
    )
  }
  if (field.type === 'strings') {
    const value = (getPath(content, field.path) as string[]) || []
    return (
      <StringList
        label={field.label}
        value={value}
        onChange={(v) => patchPath(field.path, v)}
        placeholder={field.placeholder}
        addLabel={field.addLabel}
      />
    )
  }
  if (field.type === 'array') {
    // Capture narrowed field so inner closures keep the type.
    const f = field
    const arr: any[] = (getPath(content, f.path) as any[]) || []
    const update = (idx: number, item: any) => {
      patchPath(f.path, arr.map((it, i) => (i === idx ? item : it)))
    }
    const remove = (idx: number) => {
      patchPath(f.path, arr.filter((_, i) => i !== idx))
    }
    const add = () => {
      patchPath(f.path, [...arr, f.makeItem()])
    }
    return (
      <div>
        <SectionLabel>{f.label}</SectionLabel>
        <div className="mt-1.5 space-y-2">
          {arr.map((item, i) => {
            const title =
              (f.itemTitle ? getPath(item, f.itemTitle) : '') || `${f.itemLabel} ${i + 1}`
            return (
              <Collapsible
                key={i}
                title={title}
                defaultOpen={arr.length === 1}
                onRemove={async () => {
                  const { confirmed } = await confirm({
                    title: `إزالة «${title}»؟`,
                    confirmText: 'إزالة',
                    tone: 'danger',
                  })
                  if (confirmed) remove(i)
                }}
              >
                <FieldsRenderer
                  fields={f.itemFields}
                  content={item}
                  patchPath={(p, v) => update(i, setPath(item, p, v))}
                  panelLabel={panelLabel}
                />
              </Collapsible>
            )
          })}
          <AddRowButton label={`+ إضافة ${f.itemLabel}`} onClick={add} />
        </div>
      </div>
    )
  }
  return null
}

/* ── Style / colors panel ────────────────────────────────────────────── */

function ColorsPanel({
  presetId, setPresetId, colorOverrides, setOverride, resetOverrides, config,
}: {
  presetId: string
  setPresetId: (p: string) => void
  colorOverrides: Record<string, string>
  setOverride: (k: string, v: string | undefined) => void
  resetOverrides: () => void
  config: EditorConfig
}) {
  const basePreset = config.colorPresets.find((p) => p.id === presetId) || config.colorPresets[0]
  const merged: Record<string, string> = { ...basePreset.colors, ...colorOverrides }
  return (
    <>
      <SmallNote>
        اختر إحدى لوحات الألوان المقترحة، ثم خصّص أي لون. تُعيد «إعادة التعيين» إلى النمط الجاهز.
      </SmallNote>
      <div className="grid grid-cols-2 gap-2">
        {config.colorPresets.map((p) => {
          const selected = presetId === p.id
          const cols = p.colors as any
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={
                'group relative overflow-hidden rounded-lg border-2 p-3 text-start transition ' +
                (selected ? 'border-foreground' : 'border-token hover:border-foreground/40')
              }
              style={{ background: cols.background || '#fff', color: cols.text || '#000' }}
            >
              <div className="mb-2 flex gap-1">
                <span className="h-4 w-4 rounded-full" style={{ background: cols.primary }} />
                <span className="h-4 w-4 rounded-full" style={{ background: cols.accent }} />
                <span className="h-4 w-4 rounded-full border" style={{ background: cols.surface, borderColor: cols.border }} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: cols.accent }}>
                {p.vibe}
              </div>
              <div className="mt-0.5 text-[14px] leading-tight" style={{ fontFamily: p.heading_font, color: cols.text }}>
                {p.name}
              </div>
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-foreground px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white">
                  نشط
                </span>
              )}
            </button>
          )
        })}
      </div>

      <SectionLabel>ألوان مخصّصة</SectionLabel>
      <div className="space-y-1.5">
        {config.colorTokens.map((tok) => (
          <ColorRow
            key={tok.key}
            label={tok.label}
            value={merged[tok.key] || ''}
            overridden={colorOverrides[tok.key] != null}
            onChange={(v) => setOverride(tok.key, v)}
            onReset={() => setOverride(tok.key, undefined)}
          />
        ))}
      </div>

      {Object.keys(colorOverrides).length > 0 && (
        <button
          type="button"
          onClick={resetOverrides}
          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> إعادة كل الألوان إلى النمط الجاهز
        </button>
      )}
    </>
  )
}

/* ── Typography panel ────────────────────────────────────────────────── */

function TypographyPanel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mood, setMood] = useState<'all' | typeof TYPOGRAPHY_MOODS[number]>('all')
  const presets = mood === 'all' ? TYPOGRAPHY_PRESETS : TYPOGRAPHY_PRESETS.filter((p) => p.mood === mood)
  return (
    <>
      <SmallNote>اختر زوج خطوط. تتحدّث العناوين والنصوص في كل مكان.</SmallNote>
      <div className="flex flex-wrap gap-1">
        <MoodChip active={mood === 'all'} onClick={() => setMood('all')}>الكل</MoodChip>
        {TYPOGRAPHY_MOODS.map((m) => (
          <MoodChip key={m} active={mood === m} onClick={() => setMood(m)}>{m}</MoodChip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {presets.map((p) => {
          const selected = value === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={
                'relative w-full rounded-lg border-2 px-3 py-2.5 text-start transition ' +
                (selected ? 'border-foreground bg-[rgba(28,28,28,0.03)]' : 'border-token bg-white hover:border-foreground/40')
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[18px] leading-tight text-foreground"
                  style={{
                    fontFamily: p.heading_font,
                    fontWeight: p.heading_weight ?? 600,
                    letterSpacing: p.heading_tracking ?? '-0.02em',
                  }}
                >
                  {p.name}
                </span>
                <span className="rounded bg-[rgba(28,28,28,0.04)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                  {p.mood}
                </span>
              </div>
              <div className="mt-1 text-[11.5px] text-muted" style={{ fontFamily: p.body_font }}>
                {p.vibe}
              </div>
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-foreground px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white">
                  نشط
                </span>
              )}
            </button>
          )
        })}
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')} className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> استخدام الخطوط الافتراضية للنمط
        </button>
      )}
    </>
  )
}

/* ── Device toggle — responsive preview viewport ─────────────────────── */
function DeviceToggle({
  device, onChange,
}: { device: PreviewDevice; onChange: (d: PreviewDevice) => void }) {
  const items: Array<{ id: PreviewDevice; Icon: typeof Monitor; label: string }> = [
    { id: 'desktop', Icon: Monitor,    label: 'سطح المكتب' },
    { id: 'tablet',  Icon: Tablet,     label: 'لوحي' },
    { id: 'mobile',  Icon: Smartphone, label: 'جوال' },
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
            title={`معاينة ${label}`}
            aria-label={`معاينة ${label}`}
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

/* ── Undo / redo ──────────────────────────────────────────────────────── */
function UndoRedo({
  canUndo, canRedo, onUndo, onRedo,
}: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="تراجع (⌘Z)"
        aria-label="تراجع"
        className="inline-flex items-center justify-center rounded-md border border-token bg-white p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="إعادة (⌘⇧Z)"
        aria-label="إعادة"
        className="inline-flex items-center justify-center rounded-md border border-token bg-white p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Redo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Page switcher — top-bar control for multi-page themes.                  *
 * ────────────────────────────────────────────────────────────────────── */
function PageSwitcher({
  pages, view, onChange,
}: {
  pages: EditorPage[]
  view: string
  onChange: (id: string) => void
}) {
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
            title={`تحرير صفحة ${p.label}`}
          >
            <Icon className="h-3 w-3" strokeWidth={2.25} />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

function StatusPill({
  status, dirty, lastSavedAt, now,
}: { status: Status; dirty: boolean; lastSavedAt: number | null; now: number }) {
  if (status === 'saving') return <span className="text-[12px] font-medium text-muted">جارٍ الحفظ…</span>
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#15803d]">
        <Check className="h-3 w-3" strokeWidth={2.5} /> تم الحفظ
      </span>
    )
  }
  if (status === 'error') return <span className="text-[12px] font-medium text-[#b91c1c]">فشل الحفظ</span>
  if (dirty) return <span className="text-[12px] font-medium text-muted">غير محفوظ · حفظ تلقائي…</span>
  if (lastSavedAt) {
    return <span className="text-[12px] font-medium text-muted">حُفظ {relativeTime(lastSavedAt, now)}</span>
  }
  return <span className="text-[12px] font-medium text-muted">كل التغييرات محفوظة</span>
}

function relativeTime(from: number, now: number): string {
  const s = Math.max(0, Math.round((now - from) / 1000))
  if (s < 5) return 'الآن'
  if (s < 60) return `قبل ${s} ثانية`
  const m = Math.round(s / 60)
  if (m < 60) return `قبل ${m} دقيقة`
  const h = Math.round(m / 60)
  return `قبل ${h} ساعة`
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

/* ── Per-section text size + alignment header ─────────────────────────── */

function SectionStyleHeader({
  panelId, value, onPatch, onClear,
}: {
  panelId: string
  value?: SectionStyle
  onPatch: (p: Partial<SectionStyle>) => void
  onClear: () => void
}) {
  const activeScale = value?.text_scale ?? 1
  // No explicit alignment ⇒ none highlighted (the section inherits the theme's
  // own default, which is start/right in RTL). Each button sets its literal value.
  const activeAlign: SectionTextAlign | undefined = value?.text_align
  const hasOverride = (value && (value.text_scale != null || value.text_align != null)) || false

  return (
    <div className="rounded-lg border border-token bg-[rgba(94,106,210,0.04)] p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          نمط القسم
        </span>
        {hasOverride && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10.5px] font-medium text-muted hover:text-foreground"
            title="إعادة تعيين هذا القسم"
          >
            إعادة تعيين
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">الحجم</span>
        <div className="flex flex-1 rounded-md border border-token bg-white p-0.5">
          {SECTION_TEXT_SCALES.map((s) => {
            const selected = Math.abs(activeScale - s.value) < 0.01
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPatch({ text_scale: s.value === 1 ? undefined : s.value })}
                className={
                  'flex-1 rounded text-[11px] font-semibold transition ' +
                  (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')
                }
                style={{ padding: '3px 0' }}
                title={`حجم النص ${s.label}`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">المحاذاة</span>
        <div className="flex flex-1 rounded-md border border-token bg-white p-0.5">
          {(
            [
              { id: 'left' as const,   Icon: AlignLeft   },
              { id: 'center' as const, Icon: AlignCenter },
              { id: 'right' as const,  Icon: AlignRight  },
            ]
          ).map(({ id, Icon }) => {
            const selected = activeAlign === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ text_align: activeAlign === id ? undefined : id })}
                className={
                  'flex flex-1 items-center justify-center rounded transition ' +
                  (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')
                }
                style={{ padding: '4px 0' }}
                title={`محاذاة ${id}`}
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[10.5px] leading-snug text-muted/80">
        يُطبَّق على قسم <strong className="font-semibold text-foreground">{panelId}</strong>.
      </p>
    </div>
  )
}
