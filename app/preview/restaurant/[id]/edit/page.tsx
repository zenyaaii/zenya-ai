'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Eye, EyeOff, Save, Check, Type, Image as ImageIcon,
  AtSign, Globe, MessageCircle, MapPin, Calendar, Mail, FileText,
  Star, Newspaper, ChevronDown, ChevronRight, Palette, Home as HomeIcon,
  Upload, Trash2, Plus, RotateCcw,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import GalleryPicker from '@/components/editor/GalleryPicker'
import ClickToEditOverlay from '@/components/editor/ClickToEditOverlay'
import {
  SECTION_TEXT_SCALES, sectionStylesToCss,
  type SectionStyle, type SectionStyles, type SectionTextAlign,
} from '@/utils/theme-editor-types'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import RestaurantPreview, { type RestaurantView } from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_PRESETS, getRestaurantPreset } from '@/utils/restaurant/presets'
import {
  TYPOGRAPHY_PRESETS,
  TYPOGRAPHY_MOODS,
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  getTypographyPreset,
} from '@/utils/restaurant/typography'
import type {
  RestaurantContent,
  RestaurantSectionKey,
  RestaurantStylePresetId,
  RestaurantColors,
  RestaurantMenuItem,
  RestaurantMenuCategory,
  RestaurantSignatureDish,
  RestaurantGalleryImage,
  RestaurantTestimonial,
  RestaurantPressItem,
  RestaurantFaqItem,
  RestaurantHours,
} from '@/utils/restaurant/types'
import { RESTAURANT_SECTION_LABELS } from '@/utils/restaurant/types'

/* ─────────────────────────────────────────────────────────────────────── *
 * Page model — Maison theme is a multi-page site (Home, Menu, Gallery,    *
 * Visit, About, Reviews). Each page has its own subset of sections. The  *
 * editor walks the user page by page; the middle preview switches in    *
 * sync; the right panel shows fields for whichever section is selected.  *
 * ─────────────────────────────────────────────────────────────────────── */

type SelectionKey =
  | RestaurantSectionKey
  | 'footer_text'
  | 'social'
  | 'style_preset'
  | 'typography_preset'

type PageDef = {
  view: RestaurantView
  label: string
  icon: typeof HomeIcon
  sections: RestaurantSectionKey[]
}

const PAGES: PageDef[] = [
  { view: 'home',    label: 'Home',    icon: HomeIcon,  sections: ['hero', 'signature_dishes', 'press', 'newsletter'] },
  { view: 'menu',    label: 'Menu',    icon: FileText,  sections: ['menu'] },
  { view: 'gallery', label: 'Gallery', icon: ImageIcon, sections: ['gallery'] },
  { view: 'visit',   label: 'Visit',   icon: MapPin,    sections: ['hours_location', 'reservations'] },
  { view: 'about',   label: 'About',   icon: Type,      sections: ['story'] },
  { view: 'reviews', label: 'Reviews', icon: Star,      sections: ['reviews', 'faq'] },
]

const SECTION_ICONS: Record<RestaurantSectionKey, typeof HomeIcon> = {
  hero:             Type,
  story:            Type,
  signature_dishes: Star,
  menu:             FileText,
  gallery:          ImageIcon,
  hours_location:   MapPin,
  reservations:     Calendar,
  reviews:          Star,
  press:            Newspaper,
  newsletter:       Mail,
  faq:              FileText,
}

const GLOBAL_ITEMS: { key: SelectionKey; label: string; icon: typeof HomeIcon }[] = [
  { key: 'style_preset',         label: 'Colors & palette',    icon: Palette },
  { key: 'typography_preset',    label: 'Typography',          icon: Type },
  { key: 'footer_text',          label: 'Footer text',         icon: Type },
  { key: 'social',               label: 'Social links',        icon: AtSign },
]

type Status = 'idle' | 'saving' | 'saved' | 'error'

/* ─────────────────────────────────────────────────────────────────────── *
 * Page                                                                     *
 * ─────────────────────────────────────────────────────────────────────── */

export default function RestaurantEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const previewRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<RestaurantContent | null>(null)
  const [original, setOriginal] = useState<string>('')
  const [presetId, setPresetId] = useState<RestaurantStylePresetId>('onyx')
  const [originalPreset, setOriginalPreset] = useState<RestaurantStylePresetId>('onyx')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [view, setView] = useState<RestaurantView>('home')
  const [selected, setSelected] = useState<SelectionKey>('hero')

  // ── Load theme ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push(`/login?next=/preview/restaurant/${params.id}/edit`)
        return
      }
      const r = await fetch(`/api/themes/${params.id}`)
      if (!r.ok) {
        setError(r.status === 404 ? 'Theme not found.' : 'You don’t have access to this theme.')
        setLoading(false)
        return
      }
      const j = await r.json()
      const c = j?.theme?.content?.restaurant as RestaurantContent | undefined
      const preset = (j?.theme?.content?.style_preset as RestaurantStylePresetId) || 'onyx'
      if (!c) {
        setError('This theme isn’t a restaurant theme — no editor available.')
        setLoading(false)
        return
      }
      const normalised: RestaurantContent = {
        ...c,
        hidden_sections: c.hidden_sections ?? [],
        social_links: c.social_links ?? {},
      }
      setContent(normalised)
      setOriginal(JSON.stringify(normalised))
      setPresetId(preset)
      setOriginalPreset(preset)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  // ── Dirty + unload warning ────────────────────────────────────────────
  const dirty = useMemo(() => {
    if (!content) return false
    if (JSON.stringify(content) !== original) return true
    if (presetId !== originalPreset) return true
    return false
  }, [content, original, presetId, originalPreset])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ── Cmd/Ctrl+S save ─────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty && status !== 'saving') void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, status, content, presetId])

  // ── Mutation helpers ──────────────────────────────────────────────────
  function patchContent(updater: (c: RestaurantContent) => RestaurantContent) {
    setContent((c) => (c ? updater(c) : c))
  }
  function toggleSection(key: RestaurantSectionKey) {
    patchContent((c) => {
      const hidden = new Set(c.hidden_sections || [])
      if (hidden.has(key)) hidden.delete(key)
      else hidden.add(key)
      return { ...c, hidden_sections: Array.from(hidden) }
    })
  }
  function isHidden(key: RestaurantSectionKey) {
    return (content?.hidden_sections || []).includes(key)
  }

  // Picking a page from the rail switches the preview to that page.
  // Picking a section from the rail also switches view if needed AND
  // scrolls the preview to the section.
  function selectPage(v: RestaurantView) {
    setView(v)
    // Auto-select the first visible section on that page
    const page = PAGES.find((p) => p.view === v)
    if (page) {
      const first = page.sections.find((s) => !isHidden(s)) || page.sections[0]
      if (first) setSelected(first)
    }
  }

  function selectSection(key: SelectionKey) {
    setSelected(key)
    // Find which page this section belongs to and switch if needed
    if (typeof key === 'string') {
      const page = PAGES.find((p) => (p.sections as string[]).includes(key))
      if (page && page.view !== view) setView(page.view)
      // Scroll into view (timeout lets the view-switch render first)
      setTimeout(() => {
        const el = previewRef.current?.querySelector(`[data-section="${key}"]`) as HTMLElement | null
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 60)
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function save() {
    if (!content) return
    setStatus('saving')
    setError(null)
    try {
      const getRes = await fetch(`/api/themes/${params.id}`)
      const getJson = await getRes.json()
      const fullContent = (getJson?.theme?.content as any) || {}
      const nextContent = {
        ...fullContent,
        restaurant: content,
        style_preset: presetId,
      }

      const r = await fetch(`/api/themes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: nextContent }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.message || j?.error || `Save failed (${r.status})`)
      }
      setOriginal(JSON.stringify(content))
      setOriginalPreset(presetId)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1800)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Save failed.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return <CenteredMessage>Loading editor…</CenteredMessage>
  }
  if (error && !content) {
    return (
      <CenteredMessage>
        <p className="text-foreground">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </CenteredMessage>
    )
  }
  if (!content) return null

  const currentPage = PAGES.find((p) => p.view === view)!

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <TopBar
        themeId={params.id}
        themeName={content.brand.name}
        status={status}
        dirty={dirty}
        onSave={save}
      />

      <div className="hidden flex-1 overflow-hidden lg:flex">
        <LeftPanel
          currentView={view}
          currentPage={currentPage}
          selected={selected}
          content={content}
          onSelectPage={selectPage}
          onSelectSection={selectSection}
          isHidden={isHidden}
          onToggleVisibility={toggleSection}
        />

        <main
          ref={previewRef}
          className="flex-1 overflow-y-auto"
          style={{ background: '#0a0a0c', scrollbarWidth: 'thin' }}
        >
          {content.section_styles && Object.keys(content.section_styles).length > 0 && (
            <style
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: sectionStylesToCss(content.section_styles) }}
            />
          )}
          <RestaurantPreview
            content={content}
            presetId={presetId}
            view={view}
            onViewChange={(v) => {
              setView(v)
              // Mirror the page-select behaviour — auto-select first section
              const page = PAGES.find((p) => p.view === v)
              if (page) {
                const first = page.sections.find((s) => !isHidden(s)) || page.sections[0]
                if (first) setSelected(first)
              }
            }}
          />
          <ClickToEditOverlay
            containerRef={previewRef}
            onPick={(panelId) => setSelected(panelId as SelectionKey)}
            panelToView={Object.fromEntries(
              PAGES.flatMap((p) => p.sections.map((s) => [s, p.view]))
            )}
            onViewChange={(v) => setView(v as RestaurantView)}
          />
        </main>

        <RightPanel
          selected={selected}
          content={content}
          presetId={presetId}
          patchContent={patchContent}
          onPresetChange={setPresetId}
        />
      </div>

      <div className="flex flex-1 items-center justify-center p-6 text-center lg:hidden">
        <div className="max-w-sm">
          <p className="text-[15px] font-semibold text-foreground">The editor needs a bigger screen.</p>
          <p className="mt-2 text-[13px] text-muted">
            Open on a laptop or desktop to edit. Phone preview still works at <code>/preview/restaurant/{params.id}</code>.
          </p>
          <Link href={`/preview/restaurant/${params.id}`} className="mt-5 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white">
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

/* ─────────────────────────────────────────────────────────────────────── *
 * Top bar                                                                  *
 * ─────────────────────────────────────────────────────────────────────── */

function TopBar({ themeId, themeName, status, dirty, onSave }: {
  themeId: string; themeName: string; status: Status; dirty: boolean; onSave: () => void
}) {
  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between border-b border-token bg-white px-4"
      style={{ boxShadow: '0 1px 0 #f0ede6' }}
    >
      <div className="flex items-center gap-3">
        <Link
          href={`/preview/restaurant/${themeId}`}
          className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-muted hover:bg-black/5"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.25} />
          Back to preview
        </Link>
        <span className="hidden text-[13px] text-muted sm:inline">
          Editing <strong className="font-semibold text-foreground">{themeName}</strong>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill status={status} dirty={dirty} />
        <span className="hidden text-[11px] text-muted/70 sm:inline">
          <kbd className="rounded border border-token bg-surface px-1 py-px text-[10px]">⌘S</kbd>
          {' '}to save
        </span>
        <button
          onClick={onSave}
          disabled={!dirty || status === 'saving'}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <Save className="h-3 w-3" strokeWidth={2.5} />
          Save
        </button>
      </div>
    </header>
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

/* ─────────────────────────────────────────────────────────────────────── *
 * Left rail — pages + sections-on-current-page + global                    *
 * ─────────────────────────────────────────────────────────────────────── */

function LeftPanel({
  currentView, currentPage, selected, content,
  onSelectPage, onSelectSection, isHidden, onToggleVisibility,
}: {
  currentView: RestaurantView
  currentPage: PageDef
  selected: SelectionKey
  content: RestaurantContent
  onSelectPage: (v: RestaurantView) => void
  onSelectSection: (k: SelectionKey) => void
  isHidden: (k: RestaurantSectionKey) => boolean
  onToggleVisibility: (k: RestaurantSectionKey) => void
}) {
  return (
    <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-token bg-white">
      {/* PAGES */}
      <div className="border-b border-token px-3 py-3">
        <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
          Pages
        </div>
        <div className="space-y-0.5">
          {PAGES.map((p) => {
            const Icon = p.icon
            const active = p.view === currentView
            const visibleCount = p.sections.filter((s) => !isHidden(s)).length
            const totalCount = p.sections.length
            const allHidden = visibleCount === 0
            return (
              <button
                key={p.view}
                type="button"
                onClick={() => onSelectPage(p.view)}
                className={
                  'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ' +
                  (active ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                <span className="flex-1 text-[13px] font-medium">{p.label}</span>
                <span
                  className={
                    'text-[10.5px] font-semibold ' +
                    (active ? 'text-white/70' : allHidden ? 'text-[#b45309]' : 'text-muted/70')
                  }
                >
                  {visibleCount}/{totalCount}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SECTIONS ON CURRENT PAGE */}
      <div className="border-b border-token px-3 py-3">
        <div className="flex items-center justify-between px-1.5 pb-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
            Sections on {currentPage.label}
          </div>
        </div>
        <div className="space-y-0.5">
          {currentPage.sections.map((key) => {
            const Icon = SECTION_ICONS[key]
            const active = selected === key
            const hidden = isHidden(key)
            const label = RESTAURANT_SECTION_LABELS[key]
            return (
              <div
                key={key}
                onClick={() => onSelectSection(key)}
                className={
                  'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ' +
                  (active ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                <span className={'flex-1 truncate ' + (hidden ? 'line-through opacity-60' : '')}>{label}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(key) }}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted hover:bg-black/[0.05] hover:text-foreground"
                  title={hidden ? 'Show on live site' : 'Hide on live site'}
                  aria-label={hidden ? 'Show section' : 'Hide section'}
                >
                  {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* GLOBAL */}
      <div className="px-3 py-3">
        <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
          Global · every page
        </div>
        <div className="space-y-0.5">
          {GLOBAL_ITEMS.map((item) => {
            const Icon = item.icon
            const active = selected === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectSection(item.key)}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition ' +
                  (active ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                }
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Right rail                                                               *
 * ─────────────────────────────────────────────────────────────────────── */

function RightPanel({
  selected, content, presetId, patchContent, onPresetChange,
}: {
  selected: SelectionKey
  content: RestaurantContent
  presetId: RestaurantStylePresetId
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void
  onPresetChange: (p: RestaurantStylePresetId) => void
}) {
  const headerLabel =
    selected === 'footer_text' ? 'Footer text' :
    selected === 'social' ? 'Social links' :
    selected === 'style_preset' ? 'Colors & palette' :
    selected === 'typography_preset' ? 'Typography' :
    RESTAURANT_SECTION_LABELS[selected as RestaurantSectionKey] || selected

  return (
    <aside
      className="w-80 flex-shrink-0 overflow-y-auto border-l border-token bg-white"
      style={{ boxShadow: '-1px 0 0 #f0ede6' }}
    >
      <div className="sticky top-0 z-10 border-b border-token bg-white px-4 py-3" style={{ boxShadow: '0 1px 0 #f0ede6' }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Editing</div>
        <div className="mt-0.5 text-[15px] font-semibold text-foreground">{headerLabel}</div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {SECTION_ICONS[selected as RestaurantSectionKey] && (
          <SectionStyleHeader
            panelId={selected}
            value={content.section_styles?.[selected]}
            onPatch={(p) => patchSectionStyle(content, patchContent, selected, p)}
            onClear={() => clearSectionStyle(content, patchContent, selected)}
          />
        )}
        {selected === 'hero' && <HeroFields content={content} patchContent={patchContent} />}
        {selected === 'story' && <StoryFields content={content} patchContent={patchContent} />}
        {selected === 'menu' && <MenuFields content={content} patchContent={patchContent} />}
        {selected === 'gallery' && <GalleryFields content={content} patchContent={patchContent} />}
        {selected === 'signature_dishes' && <SignatureDishesFields content={content} patchContent={patchContent} />}
        {selected === 'hours_location' && <HoursLocationFields content={content} patchContent={patchContent} />}
        {selected === 'reservations' && <ReservationsFields content={content} patchContent={patchContent} />}
        {selected === 'reviews' && <ReviewsFields content={content} patchContent={patchContent} />}
        {selected === 'press' && <PressFields content={content} patchContent={patchContent} />}
        {selected === 'faq' && <FaqFields content={content} patchContent={patchContent} />}
        {selected === 'newsletter' && <NewsletterFields content={content} patchContent={patchContent} />}
        {selected === 'footer_text' && <FooterTextFields content={content} patchContent={patchContent} />}
        {selected === 'social' && <SocialFields content={content} patchContent={patchContent} />}
        {selected === 'style_preset' && (
          <StylePresetFields
            presetId={presetId}
            onPresetChange={onPresetChange}
            content={content}
            patchContent={patchContent}
          />
        )}
        {selected === 'typography_preset' && (
          <TypographyPresetFields content={content} patchContent={patchContent} />
        )}
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Per-section editors                                                      *
 * ─────────────────────────────────────────────────────────────────────── */

type FieldProps = {
  content: RestaurantContent
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void
}

function HeroFields({ content, patchContent }: FieldProps) {
  const h = content.hero
  return (
    <>
      <FieldText label="Eyebrow"        value={h.eyebrow}       onChange={(v) => patchContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: v } }))} />
      <FieldTextArea label="Headline"   value={h.headline}      onChange={(v) => patchContent((c) => ({ ...c, hero: { ...c.hero, headline: v } }))} />
      <FieldTextArea label="Subheadline" value={h.subheadline} onChange={(v) => patchContent((c) => ({ ...c, hero: { ...c.hero, subheadline: v } }))} />
      <FieldText label="Primary CTA"    value={h.primary_cta}   onChange={(v) => patchContent((c) => ({ ...c, hero: { ...c.hero, primary_cta: v } }))} />
      <FieldText label="Secondary CTA"  value={h.secondary_cta} onChange={(v) => patchContent((c) => ({ ...c, hero: { ...c.hero, secondary_cta: v } }))} />
      <FieldImage
        label="Hero image"
        value={h.image}
        onChange={(v) => patchContent((c) => ({ ...c, hero: { ...c.hero, image: v } }))}
        hint="Background image behind the hero. Wide landscape works best."
      />
    </>
  )
}

function StoryFields({ content, patchContent }: FieldProps) {
  const s = content.story
  return (
    <>
      <FieldText label="Section heading" value={s.heading} onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, heading: v } }))} />
      <FieldTextArea label="Story body" rows={5} value={s.body || ''} onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, body: v } }))} />
      <FieldText label="Chef name"  value={s.chef_name || ''}  onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, chef_name: v } }))} />
      <FieldText label="Chef title" value={s.chef_title || ''} onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, chef_title: v } }))} />
      <FieldTextArea label="Chef bio (short)" rows={3} value={s.chef_bio || ''} onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, chef_bio: v } }))} />
      <FieldImage
        label="Chef photo"
        value={s.chef_photo || ''}
        onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, chef_photo: v } }))}
      />
      <FieldImage
        label="Accent image (optional)"
        value={s.accent_image || ''}
        onChange={(v) => patchContent((c) => ({ ...c, story: { ...c.story, accent_image: v } }))}
        hint="Smaller image shown next to the story copy."
      />
    </>
  )
}

function MenuFields({ content, patchContent }: FieldProps) {
  const m = content.menu

  function setCategories(next: RestaurantMenuCategory[]) {
    patchContent((c) => ({ ...c, menu: { ...c.menu, categories: next } }))
  }
  function updateCategory(idx: number, patch: Partial<RestaurantMenuCategory>) {
    setCategories(m.categories.map((cat, i) => (i === idx ? { ...cat, ...patch } : cat)))
  }
  function removeCategory(idx: number) {
    if (!confirm(`Remove the "${m.categories[idx].name}" category and its items?`)) return
    setCategories(m.categories.filter((_, i) => i !== idx))
  }
  function addCategory() {
    setCategories([
      ...m.categories,
      { id: `cat-${Date.now()}`, name: 'New section', description: '', items: [] },
    ])
  }
  function updateItem(catIdx: number, itemIdx: number, patch: Partial<RestaurantMenuItem>) {
    const cat = m.categories[catIdx]
    const items = cat.items.map((it, i) => (i === itemIdx ? { ...it, ...patch } : it))
    updateCategory(catIdx, { items })
  }
  function removeItem(catIdx: number, itemIdx: number) {
    const cat = m.categories[catIdx]
    if (!confirm(`Remove "${cat.items[itemIdx].name}" from ${cat.name}?`)) return
    updateCategory(catIdx, { items: cat.items.filter((_, i) => i !== itemIdx) })
  }
  function addItem(catIdx: number) {
    const cat = m.categories[catIdx]
    updateCategory(catIdx, {
      items: [...cat.items, { name: 'New item', description: '', price: '$0' }],
    })
  }

  return (
    <>
      <FieldText    label="Heading"    value={m.heading}    onChange={(v) => patchContent((c) => ({ ...c, menu: { ...c.menu, heading: v } }))} />
      <FieldTextArea label="Subheading" value={m.subheading} onChange={(v) => patchContent((c) => ({ ...c, menu: { ...c.menu, subheading: v } }))} />

      <SectionLabel>Categories</SectionLabel>
      <div className="space-y-3">
        {m.categories.map((cat, ci) => (
          <Collapsible key={cat.id || ci} title={cat.name || 'Untitled'} defaultOpen={ci === 0}>
            <FieldText  label="Category name" value={cat.name} onChange={(v) => updateCategory(ci, { name: v })} />
            <FieldText  label="Description (optional)" value={cat.description || ''} onChange={(v) => updateCategory(ci, { description: v })} />

            <div className="mt-3 space-y-2">
              {cat.items.map((it, ii) => (
                <div key={ii} className="rounded-md border border-token bg-white px-2.5 py-2">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                      placeholder="Dish name"
                      className="rounded-md border border-token bg-white px-2 py-1 text-[12.5px] outline-none focus:border-primary"
                    />
                    <input
                      value={it.price}
                      onChange={(e) => updateItem(ci, ii, { price: e.target.value })}
                      placeholder="$0"
                      className="w-20 rounded-md border border-token bg-white px-2 py-1 text-[12.5px] outline-none focus:border-primary"
                    />
                  </div>
                  <textarea
                    value={it.description}
                    onChange={(e) => updateItem(ci, ii, { description: e.target.value })}
                    placeholder="Short description"
                    rows={2}
                    className="mt-1.5 w-full rounded-md border border-token bg-white px-2 py-1 text-[12px] outline-none focus:border-primary"
                  />
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <input
                      value={it.badge || ''}
                      onChange={(e) => updateItem(ci, ii, { badge: e.target.value })}
                      placeholder="Badge (e.g. New)"
                      className="rounded-md border border-token bg-white px-2 py-1 text-[11.5px] outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(ci, ii)}
                      className="rounded-md border border-token bg-white px-2 py-1 text-[11.5px] text-[#b91c1c] hover:bg-[rgba(220,38,38,0.06)]"
                    >
                      <Trash2 className="inline-block h-3 w-3" /> Remove
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <InlineImage
                      label="Item photo (optional)"
                      value={it.image || ''}
                      onChange={(v) => updateItem(ci, ii, { image: v })}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(ci)}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-1.5 text-[12px] font-medium text-muted hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> Add item
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeCategory(ci)}
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-[#b91c1c] hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Remove category
            </button>
          </Collapsible>
        ))}
        <button
          type="button"
          onClick={addCategory}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-2 text-[12.5px] font-medium text-primary hover:bg-[rgba(94,106,210,0.04)]"
        >
          <Plus className="h-3 w-3" /> Add menu category
        </button>
      </div>
    </>
  )
}

function PhotoRow({
  img, onPick, onAlt, onUp, onDown, onRemove,
}: {
  img: RestaurantGalleryImage
  onPick: (url: string) => void
  onAlt: (alt: string) => void
  onUp: () => void
  onDown: () => void
  onRemove: () => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="flex gap-2 rounded-md border border-token bg-white p-2">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-token bg-surface transition hover:border-primary"
        title={img.url ? 'Click to change' : 'Choose image'}
      >
        {img.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <ImageIcon className="h-4 w-4" />
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/55 text-center text-[9px] font-medium text-white opacity-0 transition group-hover:opacity-100">
          Change
        </span>
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <input
          value={img.alt || ''}
          onChange={(e) => onAlt(e.target.value)}
          placeholder="Alt text"
          className="w-full rounded-md border border-token bg-white px-2 py-1 text-[12px] outline-none focus:border-primary"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-muted hover:bg-black/5"
          >
            <Upload className="h-3 w-3" strokeWidth={2.25} />
            Upload
          </button>
          <button type="button" onClick={onUp} className="rounded border border-token bg-white px-1.5 py-0.5 text-[11px] text-muted hover:bg-black/5">↑</button>
          <button type="button" onClick={onDown} className="rounded border border-token bg-white px-1.5 py-0.5 text-[11px] text-muted hover:bg-black/5">↓</button>
          <button type="button" onClick={onRemove} className="ml-auto rounded border border-token bg-white px-1.5 py-0.5 text-[11px] text-[#b91c1c] hover:bg-[rgba(220,38,38,0.06)]">
            <Trash2 className="inline-block h-3 w-3" />
          </button>
        </div>
      </div>
      <GalleryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onPick}
        currentUrl={img.url || undefined}
      />
    </div>
  )
}

function GalleryFields({ content, patchContent }: FieldProps) {
  const g = content.gallery
  function setImages(next: RestaurantGalleryImage[]) {
    patchContent((c) => ({ ...c, gallery: { ...c.gallery, images: next } }))
  }
  function updateImage(idx: number, patch: Partial<RestaurantGalleryImage>) {
    setImages(g.images.map((img, i) => (i === idx ? { ...img, ...patch } : img)))
  }
  function removeImage(idx: number) {
    setImages(g.images.filter((_, i) => i !== idx))
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...g.images]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setImages(next)
  }
  function addImage(url: string) {
    setImages([...(g.images || []), { url, alt: '' }])
  }

  return (
    <>
      <FieldText    label="Heading"    value={g.heading}    onChange={(v) => patchContent((c) => ({ ...c, gallery: { ...c.gallery, heading: v } }))} />
      <FieldTextArea label="Subheading" value={g.subheading} onChange={(v) => patchContent((c) => ({ ...c, gallery: { ...c.gallery, subheading: v } }))} />

      <SectionLabel>Photos ({g.images.length})</SectionLabel>
      <div className="space-y-2">
        {g.images.map((img, i) => (
          <PhotoRow
            key={i}
            img={img}
            onPick={(url) => updateImage(i, { url })}
            onAlt={(alt) => updateImage(i, { alt })}
            onUp={() => move(i, -1)}
            onDown={() => move(i, 1)}
            onRemove={() => removeImage(i)}
          />
        ))}

        <div className="rounded-md border border-dashed border-token bg-white p-2">
          <UploadButton
            label={g.images.length === 0 ? 'Add your first photo' : 'Add photo'}
            onUploaded={(url) => addImage(url)}
          />
        </div>
      </div>
    </>
  )
}

function SignatureDishesFields({ content, patchContent }: FieldProps) {
  const dishes = content.signature_dishes || []
  function setDishes(next: RestaurantSignatureDish[]) {
    patchContent((c) => ({ ...c, signature_dishes: next }))
  }
  function update(idx: number, patch: Partial<RestaurantSignatureDish>) {
    setDishes(dishes.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }
  function remove(idx: number) {
    if (!confirm(`Remove "${dishes[idx].name}"?`)) return
    setDishes(dishes.filter((_, i) => i !== idx))
  }
  function add() {
    setDishes([...dishes, { name: 'New dish', description: '', price: '$0', image: '' }])
  }

  return (
    <>
      <SmallNote>The 3-6 dishes that show up on the homepage and signal the cuisine.</SmallNote>
      <div className="space-y-2">
        {dishes.map((d, i) => (
          <Collapsible key={i} title={d.name || `Dish ${i + 1}`}>
            <FieldText label="Name" value={d.name} onChange={(v) => update(i, { name: v })} />
            <FieldTextArea label="Description" rows={2} value={d.description} onChange={(v) => update(i, { description: v })} />
            <FieldText label="Price" value={d.price} onChange={(v) => update(i, { price: v })} />
            <FieldImage label="Dish photo" value={d.image} onChange={(v) => update(i, { image: v })} />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-[#b91c1c] hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Remove dish
            </button>
          </Collapsible>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-2 text-[12.5px] font-medium text-primary hover:bg-[rgba(94,106,210,0.04)]"
        >
          <Plus className="h-3 w-3" /> Add signature dish
        </button>
      </div>
    </>
  )
}

function HoursLocationFields({ content, patchContent }: FieldProps) {
  const h = content.hours_location
  function updateDay(idx: number, patch: Partial<RestaurantHours>) {
    const next = h.hours.map((d, i) => (i === idx ? { ...d, ...patch } : d))
    patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, hours: next } }))
  }
  return (
    <>
      <FieldText label="Heading"    value={h.heading}    onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, heading: v } }))} />
      <FieldTextArea label="Subheading" value={h.subheading} onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, subheading: v } }))} />
      <FieldText label="Address"  value={h.address}  onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, address: v } }))} />
      <FieldText label="Phone"    value={h.phone}    onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, phone: v } }))} />
      <FieldText label="Email"    value={h.email}    onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, email: v } }))} />
      <FieldText label="Map link" value={h.map_link || ''} onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, map_link: v } }))} />

      <SectionLabel>Hours</SectionLabel>
      <div className="space-y-1">
        {h.hours.map((d, i) => (
          <div key={d.day + i} className="flex items-center gap-1.5 rounded-md border border-token bg-white px-2 py-1.5 text-[12px]">
            <input
              value={d.label}
              onChange={(e) => updateDay(i, { label: e.target.value })}
              placeholder="Mon"
              className="w-16 rounded border border-token bg-white px-1.5 py-0.5 outline-none focus:border-primary"
            />
            {d.closed ? (
              <span className="flex-1 text-center text-muted">Closed</span>
            ) : (
              <>
                <input
                  value={d.open}
                  onChange={(e) => updateDay(i, { open: e.target.value })}
                  placeholder="6 pm"
                  className="w-20 rounded border border-token bg-white px-1.5 py-0.5 outline-none focus:border-primary"
                />
                <span className="text-muted">–</span>
                <input
                  value={d.close}
                  onChange={(e) => updateDay(i, { close: e.target.value })}
                  placeholder="11 pm"
                  className="w-20 rounded border border-token bg-white px-1.5 py-0.5 outline-none focus:border-primary"
                />
              </>
            )}
            <label className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted">
              <input
                type="checkbox"
                checked={!!d.closed}
                onChange={(e) => updateDay(i, { closed: e.target.checked })}
              />
              Closed
            </label>
          </div>
        ))}
      </div>
    </>
  )
}

function ReservationsFields({ content, patchContent }: FieldProps) {
  const r = content.reservations
  return (
    <>
      <FieldText label="Heading"    value={r.heading}    onChange={(v) => patchContent((c) => ({ ...c, reservations: { ...c.reservations, heading: v } }))} />
      <FieldTextArea label="Subheading" value={r.subheading} onChange={(v) => patchContent((c) => ({ ...c, reservations: { ...c.reservations, subheading: v } }))} />
      <FieldText label="CTA label"  value={r.cta_label}  onChange={(v) => patchContent((c) => ({ ...c, reservations: { ...c.reservations, cta_label: v } }))} />
      <FieldTextArea label="Note (optional)" value={r.note || ''} onChange={(v) => patchContent((c) => ({ ...c, reservations: { ...c.reservations, note: v } }))} />
    </>
  )
}

function NewsletterFields({ content, patchContent }: FieldProps) {
  const n = content.newsletter
  return (
    <>
      <FieldText label="Heading"    value={n.heading}    onChange={(v) => patchContent((c) => ({ ...c, newsletter: { ...c.newsletter, heading: v } }))} />
      <FieldTextArea label="Subheading" value={n.subheading} onChange={(v) => patchContent((c) => ({ ...c, newsletter: { ...c.newsletter, subheading: v } }))} />
      <FieldText label="Button label" value={n.button_label} onChange={(v) => patchContent((c) => ({ ...c, newsletter: { ...c.newsletter, button_label: v } }))} />
    </>
  )
}

function ReviewsFields({ content, patchContent }: FieldProps) {
  const r = content.reviews
  function setItems(next: RestaurantTestimonial[]) {
    patchContent((c) => ({ ...c, reviews: { ...c.reviews, testimonials: next } }))
  }
  function update(idx: number, patch: Partial<RestaurantTestimonial>) {
    setItems(r.testimonials.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }
  function remove(idx: number) {
    if (!confirm('Remove this review?')) return
    setItems(r.testimonials.filter((_, i) => i !== idx))
  }
  function add() {
    setItems([...r.testimonials, { name: 'Diner', text: 'Wonderful evening.', rating: 5, source: '' }])
  }

  return (
    <>
      <FieldText    label="Heading"    value={r.heading}    onChange={(v) => patchContent((c) => ({ ...c, reviews: { ...c.reviews, heading: v } }))} />
      <FieldTextArea label="Subheading" value={r.subheading} onChange={(v) => patchContent((c) => ({ ...c, reviews: { ...c.reviews, subheading: v } }))} />
      <div className="grid grid-cols-2 gap-2">
        <FieldText label="Overall rating" value={String(r.overall_rating)} onChange={(v) => patchContent((c) => ({ ...c, reviews: { ...c.reviews, overall_rating: Number(v) || 0 } }))} />
        <FieldText label="Review count" value={r.review_count} onChange={(v) => patchContent((c) => ({ ...c, reviews: { ...c.reviews, review_count: v } }))} />
      </div>

      <SectionLabel>Testimonials</SectionLabel>
      <div className="space-y-2">
        {r.testimonials.map((t, i) => (
          <Collapsible key={i} title={t.name || `Review ${i + 1}`}>
            <FieldText label="Reviewer name" value={t.name} onChange={(v) => update(i, { name: v })} />
            <FieldTextArea label="Quote" rows={3} value={t.text} onChange={(v) => update(i, { text: v })} />
            <div className="grid grid-cols-2 gap-2">
              <FieldText label="Source (optional)" value={t.source || ''} onChange={(v) => update(i, { source: v })} placeholder="Yelp" />
              <FieldText label="Rating (1-5)" value={String(t.rating)} onChange={(v) => update(i, { rating: Math.max(1, Math.min(5, Number(v) || 5)) })} />
            </div>
            <button type="button" onClick={() => remove(i)} className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-[#b91c1c] hover:underline">
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </Collapsible>
        ))}
        <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-2 text-[12.5px] font-medium text-primary hover:bg-[rgba(94,106,210,0.04)]">
          <Plus className="h-3 w-3" /> Add testimonial
        </button>
      </div>
    </>
  )
}

function PressFields({ content, patchContent }: FieldProps) {
  const p = content.press
  function setItems(next: RestaurantPressItem[]) {
    patchContent((c) => ({ ...c, press: { ...c.press, items: next } }))
  }
  function update(idx: number, patch: Partial<RestaurantPressItem>) {
    setItems(p.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function remove(idx: number) {
    if (!confirm('Remove this press mention?')) return
    setItems(p.items.filter((_, i) => i !== idx))
  }
  function add() {
    setItems([...p.items, { outlet: 'Outlet', quote: '' }])
  }
  return (
    <>
      <FieldText label="Heading" value={p.heading} onChange={(v) => patchContent((c) => ({ ...c, press: { ...c.press, heading: v } }))} />
      <SectionLabel>Press mentions</SectionLabel>
      <div className="space-y-2">
        {p.items.map((it, i) => (
          <div key={i} className="rounded-md border border-token bg-white p-2.5">
            <FieldText label="Outlet" value={it.outlet} onChange={(v) => update(i, { outlet: v })} />
            <FieldTextArea label="Quote (optional)" rows={2} value={it.quote || ''} onChange={(v) => update(i, { quote: v })} />
            <button type="button" onClick={() => remove(i)} className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-[#b91c1c] hover:underline">
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-2 text-[12.5px] font-medium text-primary hover:bg-[rgba(94,106,210,0.04)]">
          <Plus className="h-3 w-3" /> Add press mention
        </button>
      </div>
    </>
  )
}

function FaqFields({ content, patchContent }: FieldProps) {
  const f = content.faq
  function setItems(next: RestaurantFaqItem[]) {
    patchContent((c) => ({ ...c, faq: { ...c.faq, items: next } }))
  }
  function update(idx: number, patch: Partial<RestaurantFaqItem>) {
    setItems(f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function remove(idx: number) {
    if (!confirm('Remove this FAQ?')) return
    setItems(f.items.filter((_, i) => i !== idx))
  }
  function add() {
    setItems([...f.items, { q: 'New question?', a: 'Answer.' }])
  }
  return (
    <>
      <FieldText label="Heading" value={f.heading} onChange={(v) => patchContent((c) => ({ ...c, faq: { ...c.faq, heading: v } }))} />
      <SectionLabel>FAQ items</SectionLabel>
      <div className="space-y-2">
        {f.items.map((it, i) => (
          <div key={i} className="rounded-md border border-token bg-white p-2.5">
            <FieldText label="Question" value={it.q} onChange={(v) => update(i, { q: v })} />
            <FieldTextArea label="Answer" rows={3} value={it.a} onChange={(v) => update(i, { a: v })} />
            <button type="button" onClick={() => remove(i)} className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-[#b91c1c] hover:underline">
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-token bg-white py-2 text-[12.5px] font-medium text-primary hover:bg-[rgba(94,106,210,0.04)]">
          <Plus className="h-3 w-3" /> Add FAQ
        </button>
      </div>
    </>
  )
}

function FooterTextFields({ content, patchContent }: FieldProps) {
  const f = content.footer
  return (
    <>
      <FieldText label="Tagline"    value={f.tagline} onChange={(v) => patchContent((c) => ({ ...c, footer: { ...c.footer, tagline: v } }))} />
      <FieldText label="Legal line" value={f.legal}   onChange={(v) => patchContent((c) => ({ ...c, footer: { ...c.footer, legal: v } }))} />
    </>
  )
}

function SocialFields({ content, patchContent }: FieldProps) {
  const s = content.social_links || {}
  const set = (k: keyof NonNullable<RestaurantContent['social_links']>) => (v: string) =>
    patchContent((c) => ({ ...c, social_links: { ...(c.social_links || {}), [k]: v } }))
  return (
    <>
      <SmallNote>Empty fields don’t render on the live site.</SmallNote>
      <FieldText label="Instagram URL"     value={s.instagram || ''} onChange={set('instagram')} placeholder="https://instagram.com/…" />
      <FieldText label="Facebook URL"      value={s.facebook  || ''} onChange={set('facebook')}  placeholder="https://facebook.com/…" />
      <FieldText label="TikTok URL"        value={s.tiktok    || ''} onChange={set('tiktok')}    placeholder="https://tiktok.com/@…" />
      <FieldText label="WhatsApp"          value={s.whatsapp  || ''} onChange={set('whatsapp')}  placeholder="https://wa.me/… or +1 212 555 0140" />
      <FieldText label="YouTube URL"       value={s.youtube   || ''} onChange={set('youtube')}   placeholder="https://youtube.com/@…" />
      <FieldText label="Website / other"   value={s.website   || ''} onChange={set('website')}   placeholder="https://yourwebsite.com" />
    </>
  )
}

function StylePresetFields({
  presetId, onPresetChange, content, patchContent,
}: {
  presetId: RestaurantStylePresetId
  onPresetChange: (p: RestaurantStylePresetId) => void
  content: RestaurantContent
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void
}) {
  const overrides = content.color_overrides || {}
  const basePreset = getRestaurantPreset(presetId)
  const merged: RestaurantColors = { ...basePreset.colors, ...overrides }

  function setOverride(key: keyof RestaurantColors, value: string | undefined) {
    patchContent((c) => {
      const next = { ...(c.color_overrides || {}) }
      if (value === undefined || value === '') delete next[key]
      else next[key] = value
      return { ...c, color_overrides: Object.keys(next).length ? next : undefined }
    })
  }
  function resetOverrides() {
    patchContent((c) => ({ ...c, color_overrides: undefined }))
  }

  return (
    <>
      <SmallNote>
        Pick one of the four recommended palettes, then customise any colour. Reset reverts to the preset.
      </SmallNote>
      <div className="grid grid-cols-2 gap-2">
        {RESTAURANT_PRESETS.map((p) => {
          const selected = presetId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              className={
                'group relative overflow-hidden rounded-lg border-2 p-3 text-left transition ' +
                (selected ? 'border-foreground shadow-soft-sm' : 'border-token hover:border-foreground/40')
              }
              style={{ background: p.colors.background, color: p.colors.text }}
            >
              <div className="mb-2 flex gap-1">
                <span className="h-4 w-4 rounded-full" style={{ background: p.colors.primary }} />
                <span className="h-4 w-4 rounded-full" style={{ background: p.colors.accent }} />
                <span className="h-4 w-4 rounded-full border" style={{ background: p.colors.surface, borderColor: p.colors.border }} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: p.colors.accent, fontFamily: p.heading_font }}>
                {p.vibe}
              </div>
              <div className="mt-0.5 text-[14px] leading-tight" style={{ fontFamily: p.heading_font, color: p.colors.text }}>
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
        {(['primary', 'accent', 'background', 'surface', 'text', 'muted', 'border'] as Array<keyof RestaurantColors>).map((k) => (
          <ColorRow
            key={k}
            label={COLOR_LABELS[k]}
            value={merged[k]}
            overridden={overrides[k] != null}
            onChange={(v) => setOverride(k, v)}
            onReset={() => setOverride(k, undefined)}
          />
        ))}
      </div>

      {Object.keys(overrides).length > 0 && (
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

const COLOR_LABELS: Record<keyof RestaurantColors, string> = {
  primary:    'Primary',
  accent:     'Accent · highlight',
  background: 'Background',
  surface:    'Surface · cards',
  text:       'Text',
  muted:      'Muted text',
  border:     'Border',
}

function ColorRow({
  label, value, overridden, onChange, onReset,
}: {
  label: string
  value: string
  overridden: boolean
  onChange: (v: string) => void
  onReset: () => void
}) {
  // <input type="color"> needs #RRGGBB. Token like 'rgba(...)' shows the
  // preview swatch but disables the picker for that row.
  const isHex = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(value)
  return (
    <div className="flex items-center gap-2 rounded-md border border-token bg-white px-2 py-1.5">
      <span
        className="h-6 w-6 flex-shrink-0 rounded border border-token"
        style={{ background: value }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">{label}</span>
          {overridden && <span className="rounded bg-primary/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-primary">custom</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          {isHex && (
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded border border-token bg-white"
              aria-label={`${label} color`}
            />
          )}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded border border-token bg-white px-1.5 py-0.5 font-mono text-[11px] outline-none focus:border-primary"
          />
        </div>
      </div>
      {overridden && (
        <button
          type="button"
          onClick={onReset}
          title="Revert to preset"
          className="rounded border border-token bg-white p-1 text-muted hover:bg-black/5"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function TypographyPresetFields({ content, patchContent }: FieldProps) {
  const currentId = content.typography_preset || ''
  const [moodFilter, setMoodFilter] = useState<'all' | typeof TYPOGRAPHY_MOODS[number]>('all')

  function pick(id: string | null) {
    patchContent((c) => ({ ...c, typography_preset: id || undefined }))
  }

  const presets = moodFilter === 'all'
    ? TYPOGRAPHY_PRESETS
    : TYPOGRAPHY_PRESETS.filter((p) => p.mood === moodFilter)

  return (
    <>
      <SmallNote>
        Pick a font pair. Headings + body update everywhere on the site. Clear to fall back to the colour preset’s fonts.
      </SmallNote>

      <div className="flex flex-wrap gap-1">
        <MoodChip active={moodFilter === 'all'} onClick={() => setMoodFilter('all')}>All</MoodChip>
        {TYPOGRAPHY_MOODS.map((m) => (
          <MoodChip key={m} active={moodFilter === m} onClick={() => setMoodFilter(m)}>{m}</MoodChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {presets.map((p) => {
          const selected = currentId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p.id)}
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
              <div
                className="mt-1 text-[11.5px] text-muted"
                style={{ fontFamily: p.body_font }}
              >
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

      {currentId && (
        <button
          type="button"
          onClick={() => pick(null)}
          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Use preset’s default fonts
        </button>
      )}
    </>
  )
}

function MoodChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider transition ' +
        (active ? 'bg-foreground text-white' : 'bg-[rgba(28,28,28,0.06)] text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Reusable inputs                                                          *
 * ─────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </div>
  )
}

function Collapsible({
  title, defaultOpen = false, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-token bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-muted" />}
        <span className="truncate text-[13px] font-medium text-foreground">{title}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-token px-2.5 py-2.5">
          {children}
        </div>
      )}
    </div>
  )
}

function FieldImage({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[10.5px] text-[#b91c1c] hover:underline">
            Clear
          </button>
        )}
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mb-1.5 block w-full overflow-hidden rounded-md border border-token transition hover:border-primary"
          title="Click to change"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="block h-32 w-full object-cover" />
          <span className="block bg-black/60 px-2 py-1 text-center text-[10.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
            Click to change
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-1.5 grid h-24 w-full place-items-center rounded-md border border-dashed border-token bg-surface text-muted transition hover:border-primary hover:text-primary"
        >
          <div className="flex flex-col items-center gap-1">
            <Upload className="h-4 w-4" strokeWidth={2} />
            <span className="text-[11.5px] font-medium">Choose image</span>
          </div>
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
      >
        <ImageIcon className="h-3 w-3" strokeWidth={2.25} />
        {value ? 'Change image' : 'Open gallery'}
      </button>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      <GalleryPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(url) => onChange(url)}
        currentUrl={value || undefined}
      />
    </div>
  )
}

function InlineImage({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-token bg-white transition hover:border-primary"
        title={value ? 'Click to change' : 'Choose image'}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-foreground hover:bg-black/5"
      >
        <span className="truncate text-left text-muted">{value ? 'Image set' : label}</span>
        <Upload className="h-3 w-3 flex-shrink-0 text-muted" strokeWidth={2.25} />
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} className="rounded border border-token bg-white p-1 text-muted hover:bg-black/5" title="Clear">
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      <GalleryPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(url) => onChange(url)}
        currentUrl={value || undefined}
      />
    </div>
  )
}

function UploadButton({
  label = 'Upload', small = false, onUploaded,
}: { label?: string; small?: boolean; onUploaded: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          small
            ? 'inline-flex items-center gap-1 rounded-md border border-token bg-white px-2 py-1 text-[11.5px] font-medium text-muted hover:bg-black/5'
            : 'inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-black/5'
        }
      >
        <Upload className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.25} />
        {label}
      </button>
      <GalleryPicker open={open} onClose={() => setOpen(false)} onPick={(url) => onUploaded(url)} />
    </>
  )
}

function FieldText({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-token bg-white px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
      />
    </label>
  )
}

function FieldTextArea({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-token bg-white px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
      />
    </label>
  )
}

function RadioRow({ checked, onClick, label, hint }: {
  checked: boolean; onClick: () => void; label: string; hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition ' +
        (checked ? 'border-primary bg-[rgba(94,106,210,0.06)]' : 'border-token bg-white hover:bg-black/[0.02]')
      }
    >
      <span className={'mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border ' + (checked ? 'border-primary bg-primary' : 'border-token bg-white')}>
        {checked && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-[12.5px] font-medium text-foreground">{label}</span>
        {hint && <span className="block text-[11.5px] text-muted">{hint}</span>}
      </span>
    </button>
  )
}

function SmallNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-[rgba(94,106,210,0.06)] px-2.5 py-2 text-[11.5px] leading-[1.55] text-muted">
      {children}
    </p>
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      {children}
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Per-section text size + alignment header                                *
 * Shown above each section's editor fields so the user can dial up        *
 * text size / shift alignment without leaving the panel.                  *
 * ─────────────────────────────────────────────────────────────────────── */

function patchSectionStyle(
  content: RestaurantContent,
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void,
  panelId: string,
  patch: Partial<SectionStyle>,
) {
  patchContent((c) => {
    const cur: SectionStyles = { ...(c.section_styles || {}) }
    const merged: SectionStyle = { ...(cur[panelId] || {}), ...patch }
    if (merged.text_scale == null || merged.text_scale === 1) delete merged.text_scale
    if (!merged.text_align || merged.text_align === 'left') delete merged.text_align
    if (Object.keys(merged).length === 0) {
      delete cur[panelId]
    } else {
      cur[panelId] = merged
    }
    return { ...c, section_styles: Object.keys(cur).length ? cur : undefined }
  })
}

function clearSectionStyle(
  content: RestaurantContent,
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void,
  panelId: string,
) {
  patchContent((c) => {
    if (!c.section_styles?.[panelId]) return c
    const cur = { ...c.section_styles }
    delete cur[panelId]
    return { ...c, section_styles: Object.keys(cur).length ? cur : undefined }
  })
}

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
  const hasOverride = !!(value && (value.text_scale != null || value.text_align != null))

  return (
    <div className="rounded-lg border border-token bg-[rgba(94,106,210,0.04)] p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Section style</span>
        {hasOverride && (
          <button type="button" onClick={onClear} className="text-[10.5px] font-medium text-muted hover:text-foreground">
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
                className={'flex-1 rounded text-[11px] font-semibold transition ' + (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')}
                style={{ padding: '3px 0' }}
                title={`Text size ${s.label}`}
              >{s.label}</button>
            )
          })}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[10.5px] text-muted">Align</span>
        <div className="flex flex-1 rounded-md border border-token bg-white p-0.5">
          {([{ id: 'left' as const, Icon: AlignLeft }, { id: 'center' as const, Icon: AlignCenter }, { id: 'right' as const, Icon: AlignRight }]).map(({ id, Icon }) => {
            const selected = activeAlign === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ text_align: id === 'left' ? undefined : id })}
                className={'flex flex-1 items-center justify-center rounded transition ' + (selected ? 'bg-foreground text-white' : 'text-muted hover:bg-black/[0.04]')}
                style={{ padding: '4px 0' }}
                title={`Align ${id}`}
              ><Icon className="h-3 w-3" strokeWidth={2.25} /></button>
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
