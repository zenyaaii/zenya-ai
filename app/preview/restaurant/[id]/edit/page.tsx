'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Eye, EyeOff, Save, Check, Type, Image as ImageIcon,
  AtSign, Globe, MessageCircle, MapPin, Calendar, Mail, FileText,
  Star, Newspaper, ChevronDown, ChevronRight, Palette, Home as HomeIcon,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import RestaurantPreview, { type RestaurantView } from '@/components/theme/restaurant/RestaurantPreview'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type {
  RestaurantContent,
  RestaurantSectionKey,
  RestaurantStylePresetId,
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
  | 'gallery_attribution'
  | 'style_preset'

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
  { key: 'style_preset',         label: 'Style preset',        icon: Palette },
  { key: 'footer_text',          label: 'Footer text',         icon: Type },
  { key: 'social',               label: 'Social links',        icon: AtSign },
  { key: 'gallery_attribution',  label: 'Gallery attribution', icon: ImageIcon },
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
    selected === 'gallery_attribution' ? 'Gallery attribution' :
    selected === 'style_preset' ? 'Style preset' :
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
        {selected === 'hero' && <HeroFields content={content} patchContent={patchContent} />}
        {selected === 'story' && <StoryFields content={content} patchContent={patchContent} />}
        {selected === 'menu' && <MenuFields content={content} patchContent={patchContent} />}
        {selected === 'gallery' && <GalleryFields content={content} patchContent={patchContent} />}
        {selected === 'hours_location' && <HoursLocationFields content={content} patchContent={patchContent} />}
        {selected === 'reservations' && <ReservationsFields content={content} patchContent={patchContent} />}
        {selected === 'newsletter' && <NewsletterFields content={content} patchContent={patchContent} />}
        {selected === 'footer_text' && <FooterTextFields content={content} patchContent={patchContent} />}
        {selected === 'social' && <SocialFields content={content} patchContent={patchContent} />}
        {selected === 'gallery_attribution' && <GalleryAttributionFields content={content} patchContent={patchContent} />}
        {selected === 'style_preset' && <StylePresetFields presetId={presetId} onPresetChange={onPresetChange} />}
        {(selected === 'signature_dishes' || selected === 'reviews' ||
          selected === 'press' || selected === 'faq') && (
          <RegenerateNotice label={headerLabel} />
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
    </>
  )
}

function MenuFields({ content, patchContent }: FieldProps) {
  const m = content.menu
  return (
    <>
      <FieldText label="Heading"    value={m.heading}    onChange={(v) => patchContent((c) => ({ ...c, menu: { ...c.menu, heading: v } }))} />
      <FieldTextArea label="Subheading" value={m.subheading} onChange={(v) => patchContent((c) => ({ ...c, menu: { ...c.menu, subheading: v } }))} />
      <SmallNote>Menu items aren’t editable here yet. Use <strong>Edit details</strong> to change items, prices, or photos.</SmallNote>
    </>
  )
}

function GalleryFields({ content, patchContent }: FieldProps) {
  const g = content.gallery
  return (
    <>
      <FieldText label="Heading"    value={g.heading}    onChange={(v) => patchContent((c) => ({ ...c, gallery: { ...c.gallery, heading: v } }))} />
      <FieldTextArea label="Subheading" value={g.subheading} onChange={(v) => patchContent((c) => ({ ...c, gallery: { ...c.gallery, subheading: v } }))} />
      <SmallNote>Gallery photos aren’t editable here yet. Use <strong>Edit details</strong> to swap images.</SmallNote>
    </>
  )
}

function HoursLocationFields({ content, patchContent }: FieldProps) {
  const h = content.hours_location
  return (
    <>
      <FieldText label="Heading"    value={h.heading}    onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, heading: v } }))} />
      <FieldTextArea label="Subheading" value={h.subheading} onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, subheading: v } }))} />
      <FieldText label="Address"  value={h.address}  onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, address: v } }))} />
      <FieldText label="Phone"    value={h.phone}    onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, phone: v } }))} />
      <FieldText label="Email"    value={h.email}    onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, email: v } }))} />
      <FieldText label="Map link" value={h.map_link || ''} onChange={(v) => patchContent((c) => ({ ...c, hours_location: { ...c.hours_location, map_link: v } }))} />
      <SmallNote>Edit the daily hours from <strong>Edit details</strong>.</SmallNote>
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

function GalleryAttributionFields({ content, patchContent }: FieldProps) {
  const current = content.gallery.attribution || 'from_unsplash'
  function set(value: 'from_venue' | 'from_unsplash') {
    patchContent((c) => ({ ...c, gallery: { ...c.gallery, attribution: value } }))
  }
  return (
    <>
      <SmallNote>The small note shown under your photo gallery on the live site.</SmallNote>
      <RadioRow checked={current === 'from_venue'} onClick={() => set('from_venue')}
        label='"Photography by the venue."'
        hint="Choose this if the gallery photos are your own." />
      <RadioRow checked={current === 'from_unsplash'} onClick={() => set('from_unsplash')}
        label='"Photography sourced from Unsplash."'
        hint="Choose this if you used stock images. Honest and clear." />
    </>
  )
}

function StylePresetFields({
  presetId, onPresetChange,
}: {
  presetId: RestaurantStylePresetId
  onPresetChange: (p: RestaurantStylePresetId) => void
}) {
  return (
    <>
      <SmallNote>
        Switching presets changes the whole site’s palette + typography. Try a few — the preview reflows immediately.
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
    </>
  )
}

function RegenerateNotice({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-token bg-surface px-3 py-3 text-[12.5px] leading-[1.55] text-muted">
      <strong className="text-foreground">{label}</strong> content was generated by AI from the
      details you entered. To change it, click <strong>Edit details</strong> on the preview and
      re-generate.
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Reusable inputs                                                          *
 * ─────────────────────────────────────────────────────────────────────── */

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
