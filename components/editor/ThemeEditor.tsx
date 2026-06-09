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
 *   - left rail: pages + section panels + global panels
 *   - right rail: render fields from the config
 *   - middle: render the Preview with live overrides applied
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
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  FieldText, FieldTextArea, FieldNumber, FieldImage, SectionLabel,
  SmallNote, Collapsible, AddRowButton, StringList, ColorRow, MoodChip,
} from './EditorFields'
import ClickToEditOverlay from './ClickToEditOverlay'
import {
  getPath, setPath, sectionStylesToCss, SECTION_TEXT_SCALES,
  type EditorConfig, type EditorFieldDef, type EditorPage, type EditorPanel,
  type SectionStyles, type SectionStyle, type SectionTextAlign,
} from '@/utils/theme-editor-types'
import {
  TYPOGRAPHY_PRESETS, TYPOGRAPHY_MOODS,
} from '@/utils/theme-editor-typography'

type Status = 'idle' | 'saving' | 'saved' | 'error'

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
  const previewRef = useRef<HTMLDivElement>(null)

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

  // Selection state
  const [view, setView] = useState<string>(config.pages?.[0]?.id || 'home')
  const [selected, setSelected] = useState<string>(config.panels[0]?.id || '')

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
        setError(r.status === 404 ? 'Theme not found.' : 'You don’t have access to this theme.')
        setLoading(false)
        return
      }
      const j = await r.json()
      const c = j?.theme?.content
      const inner = c?.[config.contentKey]
      if (!inner) {
        setError(`This theme isn’t a ${config.themeName} theme — no editor available.`)
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
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [themeId, supabase, router, config, backHref])

  // ── Dirty detection + save ──────────────────────────────────────────
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
        throw new Error(j?.message || j?.error || `Save failed (${r.status})`)
      }
      setOriginal(snapshot(content, presetId, typographyPreset, colorOverrides, sectionStyles))
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1800)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Save failed.')
    }
  }, [content, presetId, typographyPreset, colorOverrides, sectionStyles, themeId, config.contentKey])

  // Cmd+S
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty && status !== 'saving') void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, status, save])

  // When the user switches pages, the currently selected section may no
  // longer belong to the new page. Re-pick the first visible section so the
  // right rail never shows a section that isn't in the left rail.
  useEffect(() => {
    if (selected === '__style__' || selected === '__typography__') return
    if (config.globalPanels.some((p) => p.id === selected)) return
    const visiblePanels = config.panels.filter((p) => !p.page || p.page === view)
    if (visiblePanels.some((p) => p.id === selected)) return
    if (visiblePanels.length > 0) setSelected(visiblePanels[0].id)
  }, [view, selected, config.panels, config.globalPanels])

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
        Loading editor…
      </main>
    )
  }
  if (error && !content) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-foreground">{error}</p>
        <Link href="/dashboard/sites" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to sites
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      {/* Top bar */}
      <header
        className="flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-token bg-white px-4"
        style={{ boxShadow: '0 1px 0 #f0ede6' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-muted hover:bg-black/5"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2.25} />
            Back to preview
          </Link>
          <span className="hidden truncate text-[13px] text-muted sm:inline">
            Editing <strong className="font-semibold text-foreground">{themeName}</strong>
          </span>
        </div>

        {config.pages && config.pages.length > 0 && (
          <PageSwitcher
            pages={config.pages}
            view={view}
            onChange={(v) => setView(v)}
          />
        )}

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <StatusPill status={status} dirty={dirty} />
          <span className="hidden text-[11px] text-muted/70 sm:inline">
            <kbd className="rounded border border-token bg-surface px-1 py-px text-[10px]">⌘S</kbd> to save
          </span>
          <button
            onClick={save}
            disabled={!dirty || status === 'saving'}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Save className="h-3 w-3" strokeWidth={2.5} />
            Save
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        {/* Left rail */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-token bg-white">
          <div className="border-b border-token px-3 py-3">
            <div className="flex items-baseline justify-between px-1.5 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">Sections</span>
              {config.pages && config.pages.length > 0 && (
                <span className="text-[10px] text-muted/60">
                  {config.pages.find((p) => p.id === view)?.label || ''}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {config.panels
                .filter((p) => !p.page || p.page === view)
                .map((p) => {
                  const Icon = p.icon || Settings
                  const active = selected === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ' +
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
            <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">Global · every page</div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setSelected('__style__')}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ' +
                  (selected === '__style__' ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <Palette className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="text-[13px]">Colors & palette</span>
              </button>
              <button
                type="button"
                onClick={() => setSelected('__typography__')}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ' +
                  (selected === '__typography__' ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="text-[13px]">Typography</span>
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
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ' +
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
          ref={previewRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: '#0a0a0c' }}
        >
          {/* Per-section text scale + alignment. Themes opt in by tagging
              section roots with data-section="<panelId>". Themes that
              haven't been retrofitted simply ignore this. */}
          {Object.keys(sectionStyles).length > 0 && (
            <style
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: sectionStylesToCss(sectionStyles) }}
            />
          )}
          <Preview
            content={content}
            presetId={presetId}
            colorOverrides={colorOverrides}
            typographyPreset={typographyPreset || undefined}
            sectionStyles={sectionStyles}
            view={view}
            onViewChange={(v) => setView(v)}
          />
          <ClickToEditOverlay
            containerRef={previewRef}
            onPick={setSelected}
            panelToView={Object.fromEntries(
              config.panels.filter((p) => p.page).map((p) => [p.id, p.page as string])
            )}
            onViewChange={(v) => setView(v)}
          />
        </main>

        {/* Right rail — fields */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-l border-token bg-white" style={{ boxShadow: '-1px 0 0 #f0ede6' }}>
          <div className="sticky top-0 z-10 border-b border-token bg-white px-4 py-3" style={{ boxShadow: '0 1px 0 #f0ede6' }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Editing</div>
            <div className="mt-0.5 text-[15px] font-semibold text-foreground">
              {selected === '__style__' ? 'Colors & palette' :
               selected === '__typography__' ? 'Typography' :
               activePanel?.label || 'Section'}
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
                />
              </>
            ) : (
              <SmallNote>Select a section on the left to start editing.</SmallNote>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 text-center lg:hidden">
        <div className="max-w-sm">
          <p className="text-[15px] font-semibold text-foreground">The editor needs a bigger screen.</p>
          <p className="mt-2 text-[13px] text-muted">
            Open on a laptop or desktop to edit.
          </p>
          <Link href={backHref} className="mt-5 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white">
            Back to preview
          </Link>
        </div>
      </div>

      {error && content && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-[#fca5a5] bg-[#fee2e2] px-3 py-2 text-[12.5px] font-medium text-[#b91c1c] shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Panels                                                                  *
 * ────────────────────────────────────────────────────────────────────── */

function FieldsRenderer({
  fields, content, patchPath,
}: { fields: EditorFieldDef[]; content: any; patchPath: (p: string, v: any) => void }) {
  return (
    <>
      {fields.map((f, i) => (
        <RenderField key={i} field={f} content={content} patchPath={patchPath} />
      ))}
    </>
  )
}

function RenderField({
  field, content, patchPath,
}: { field: EditorFieldDef; content: any; patchPath: (p: string, v: any) => void }) {
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
                onRemove={() => {
                  if (confirm(`Remove "${title}"?`)) remove(i)
                }}
              >
                <FieldsRenderer
                  fields={f.itemFields}
                  content={item}
                  patchPath={(p, v) => update(i, setPath(item, p, v))}
                />
              </Collapsible>
            )
          })}
          <AddRowButton label={`+ Add ${f.itemLabel.toLowerCase()}`} onClick={add} />
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
        Pick one of the recommended palettes, then customise any colour. Reset reverts to the preset.
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
                'group relative overflow-hidden rounded-lg border-2 p-3 text-left transition ' +
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
                  Active
                </span>
              )}
            </button>
          )
        })}
      </div>

      <SectionLabel>Custom colors</SectionLabel>
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
          <RotateCcw className="h-3 w-3" /> Reset all colours to preset
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
      <SmallNote>Pick a font pair. Headings + body update everywhere.</SmallNote>
      <div className="flex flex-wrap gap-1">
        <MoodChip active={mood === 'all'} onClick={() => setMood('all')}>All</MoodChip>
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
                'relative w-full rounded-lg border-2 px-3 py-2.5 text-left transition ' +
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
                  Active
                </span>
              )}
            </button>
          )
        })}
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')} className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Use preset’s default fonts
        </button>
      )}
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Page switcher — top-bar control for multi-page themes.                  *
 * Pages live in the URL of the rendered theme, so they're not "sections"  *
 * the user edits — they're the high-level page the editor is currently    *
 * focused on. We keep them out of the left rail and surface them here so  *
 * the user always knows which page they're editing.                       *
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
            title={`Edit ${p.label} page`}
          >
            <Icon className="h-3 w-3" strokeWidth={2.25} />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

function StatusPill({ status, dirty }: { status: Status; dirty: boolean }) {
  if (status === 'saving') return <span className="text-[12px] font-medium text-muted">Saving…</span>
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#15803d]">
        <Check className="h-3 w-3" strokeWidth={2.5} /> Saved
      </span>
    )
  }
  if (status === 'error') return <span className="text-[12px] font-medium text-[#b91c1c]">Save failed</span>
  return <span className="text-[12px] font-medium text-muted">{dirty ? 'Unsaved changes' : 'All saved'}</span>
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

function pruneSectionStyles(s: SectionStyles): SectionStyles {
  const out: SectionStyles = {}
  for (const [k, v] of Object.entries(s)) {
    const next: SectionStyle = {}
    if (typeof v.text_scale === 'number' && v.text_scale > 0 && v.text_scale !== 1) {
      next.text_scale = v.text_scale
    }
    if (v.text_align && v.text_align !== 'left') {
      next.text_align = v.text_align
    }
    if (Object.keys(next).length > 0) out[k] = next
  }
  return out
}

/* ── Per-section text size + alignment header ─────────────────────────── *
 * Shown at the top of every section panel. Lets the user dial up the     *
 * text size for that section and shift the alignment without leaving     *
 * the panel. Themes opt in by tagging section roots with                 *
 * data-section="<panelId>"; themes that haven't been retrofitted just    *
 * ignore the overrides.                                                  *
 * ────────────────────────────────────────────────────────────────────── */

function SectionStyleHeader({
  panelId, value, onPatch, onClear,
}: {
  panelId: string
  value?: SectionStyle
  onPatch: (p: Partial<SectionStyle>) => void
  onClear: () => void
}) {
  const activeScale = value?.text_scale ?? 1
  const activeAlign: SectionTextAlign = value?.text_align ?? 'left'
  const hasOverride = (value && (value.text_scale != null || value.text_align != null)) || false

  return (
    <div className="rounded-lg border border-token bg-[rgba(94,106,210,0.04)] p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          Section style
        </span>
        {hasOverride && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10.5px] font-medium text-muted hover:text-foreground"
            title="Reset this section"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">Size</span>
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
                title={`Text size ${s.label}`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">Align</span>
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
                onClick={() => onPatch({ text_align: id === 'left' ? undefined : id })}
                className={
                  'flex flex-1 items-center justify-center rounded transition ' +
                  (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')
                }
                style={{ padding: '4px 0' }}
                title={`Align ${id}`}
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[10.5px] leading-snug text-muted/80">
        Applies to the <strong className="font-semibold text-foreground">{panelId}</strong> section.
      </p>
    </div>
  )
}
