'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Eye, EyeOff, Save, Check, Type, Image as ImageIcon,
  AtSign, Globe, MessageCircle, MapPin, Calendar, Mail, FileText,
  Star, Newspaper, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import type {
  RestaurantContent,
  RestaurantSectionKey,
  RestaurantStylePresetId,
} from '@/utils/restaurant/types'
import { RESTAURANT_SECTION_LABELS } from '@/utils/restaurant/types'

/* ─────────────────────────────────────────────────────────────────────── *
 * Section model                                                            *
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Every entry the user can select in the left rail. Includes the 11
 * toggleable page sections plus the 3 page-level edits that aren't
 * toggleable (footer text, social, gallery attribution).
 */
type SelectionKey =
  | RestaurantSectionKey
  | 'footer_text'
  | 'social'
  | 'gallery_attribution'

type RailItem = {
  key: SelectionKey
  label: string
  icon: typeof Type
  /** Show the eye-toggle on the rail row. False for non-section page-level items. */
  toggleable: boolean
}

const RAIL_GROUPS: { label: string; items: RailItem[] }[] = [
  {
    label: 'PAGE',
    items: [
      { key: 'hero',             label: 'Hero',              icon: Type,       toggleable: true  },
      { key: 'story',            label: 'Our story',         icon: Type,       toggleable: true  },
      { key: 'signature_dishes', label: 'Signature dishes',  icon: Star,       toggleable: true  },
      { key: 'menu',             label: 'Menu',              icon: FileText,   toggleable: true  },
      { key: 'gallery',          label: 'Gallery',           icon: ImageIcon,  toggleable: true  },
      { key: 'hours_location',   label: 'Hours & location',  icon: MapPin,     toggleable: true  },
      { key: 'reservations',     label: 'Reservations',      icon: Calendar,   toggleable: true  },
      { key: 'reviews',          label: 'Reviews',           icon: Star,       toggleable: true  },
      { key: 'press',            label: 'Press',             icon: Newspaper,  toggleable: true  },
      { key: 'newsletter',       label: 'Newsletter',        icon: Mail,       toggleable: true  },
      { key: 'faq',              label: 'FAQ',               icon: FileText,   toggleable: true  },
    ],
  },
  {
    label: 'FOOTER',
    items: [
      { key: 'footer_text',          label: 'Footer text',         icon: Type,      toggleable: false },
      { key: 'social',               label: 'Social links',        icon: AtSign,    toggleable: false },
      { key: 'gallery_attribution',  label: 'Gallery attribution', icon: ImageIcon, toggleable: false },
    ],
  },
]

type Status = 'idle' | 'saving' | 'saved' | 'error'

/* ─────────────────────────────────────────────────────────────────────── *
 * Page                                                                     *
 * ─────────────────────────────────────────────────────────────────────── */

export default function RestaurantEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<RestaurantContent | null>(null)
  const [original, setOriginal] = useState<string>('')
  const [presetId, setPresetId] = useState<RestaurantStylePresetId>('onyx')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
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
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  // ── Dirty + unload warning ────────────────────────────────────────────
  const dirty = useMemo(
    () => !!content && JSON.stringify(content) !== original,
    [content, original]
  )
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ── Mutation helper ───────────────────────────────────────────────────
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

  // ── Save ──────────────────────────────────────────────────────────────
  async function save() {
    if (!content) return
    setStatus('saving')
    setError(null)
    try {
      const getRes = await fetch(`/api/themes/${params.id}`)
      const getJson = await getRes.json()
      const fullContent = (getJson?.theme?.content as any) || {}
      const nextContent = { ...fullContent, restaurant: content }

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      {/* Top bar */}
      <TopBar
        themeId={params.id}
        themeName={content.brand.name}
        status={status}
        dirty={dirty}
        onSave={save}
      />

      {/* Desktop: 3-panel */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        <LeftPanel
          selected={selected}
          onSelect={setSelected}
          isHidden={isHidden}
          onToggleVisibility={toggleSection}
        />
        <MiddlePanel content={content} presetId={presetId} />
        <RightPanel selected={selected} content={content} patchContent={patchContent} />
      </div>

      {/* Mobile: notice */}
      <div className="flex flex-1 items-center justify-center p-6 text-center lg:hidden">
        <div className="max-w-sm">
          <p className="text-[15px] font-semibold text-foreground">
            The editor needs a bigger screen.
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Open this page on a laptop or desktop to edit your site. Phone and tablet
            previewing works — just the editor surface is desktop-only for now.
          </p>
          <Link
            href={`/preview/restaurant/${params.id}`}
            className="mt-5 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
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

function TopBar({
  themeId, themeName, status, dirty, onSave,
}: {
  themeId: string
  themeName: string
  status: Status
  dirty: boolean
  onSave: () => void
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
      <div className="flex items-center gap-2">
        <StatusPill status={status} dirty={dirty} />
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
 * Left rail — section tree                                                 *
 * ─────────────────────────────────────────────────────────────────────── */

function LeftPanel({
  selected, onSelect, isHidden, onToggleVisibility,
}: {
  selected: SelectionKey
  onSelect: (k: SelectionKey) => void
  isHidden: (k: RestaurantSectionKey) => boolean
  onToggleVisibility: (k: RestaurantSectionKey) => void
}) {
  return (
    <aside className="w-60 flex-shrink-0 overflow-y-auto border-r border-token bg-white">
      <div className="px-3 py-3">
        <div className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Home page
        </div>
        {RAIL_GROUPS.map((group) => (
          <div key={group.label} className="mt-3">
            <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = selected === item.key
                const hidden = item.toggleable && isHidden(item.key as RestaurantSectionKey)
                return (
                  <div
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    className={
                      'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ' +
                      (active ? 'bg-[rgba(28,28,28,0.06)] text-foreground' : 'text-muted hover:bg-black/[0.03] hover:text-foreground')
                    }
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                    <span className={'flex-1 truncate ' + (hidden ? 'line-through opacity-60' : '')}>
                      {item.label}
                    </span>
                    {item.toggleable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleVisibility(item.key as RestaurantSectionKey)
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted hover:bg-black/[0.05] hover:text-foreground"
                        title={hidden ? 'Show on live site' : 'Hide on live site'}
                        aria-label={hidden ? 'Show section' : 'Hide section'}
                      >
                        {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Middle — live preview                                                    *
 * ─────────────────────────────────────────────────────────────────────── */

function MiddlePanel({
  content, presetId,
}: {
  content: RestaurantContent
  presetId: RestaurantStylePresetId
}) {
  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{
        background: '#0a0a0c',
        scrollbarWidth: 'thin',
      }}
    >
      <RestaurantPreview content={content} presetId={presetId} />
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Right rail — per-section editor                                          *
 * ─────────────────────────────────────────────────────────────────────── */

function RightPanel({
  selected, content, patchContent,
}: {
  selected: SelectionKey
  content: RestaurantContent
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void
}) {
  const headerLabel =
    selected === 'footer_text' ? 'Footer text' :
    selected === 'social' ? 'Social links' :
    selected === 'gallery_attribution' ? 'Gallery attribution' :
    RESTAURANT_SECTION_LABELS[selected as RestaurantSectionKey] ||
    selected

  return (
    <aside
      className="w-80 flex-shrink-0 overflow-y-auto border-l border-token bg-white"
      style={{ boxShadow: '-1px 0 0 #f0ede6' }}
    >
      <div className="border-b border-token px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Editing
        </div>
        <div className="mt-0.5 text-[15px] font-semibold text-foreground">{headerLabel}</div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {selected === 'hero' && (
          <HeroFields content={content} patchContent={patchContent} />
        )}
        {selected === 'story' && (
          <StoryFields content={content} patchContent={patchContent} />
        )}
        {selected === 'menu' && (
          <MenuFields content={content} patchContent={patchContent} />
        )}
        {selected === 'gallery' && (
          <GalleryFields content={content} patchContent={patchContent} />
        )}
        {selected === 'hours_location' && (
          <HoursLocationFields content={content} patchContent={patchContent} />
        )}
        {selected === 'reservations' && (
          <ReservationsFields content={content} patchContent={patchContent} />
        )}
        {selected === 'newsletter' && (
          <NewsletterFields content={content} patchContent={patchContent} />
        )}
        {selected === 'footer_text' && (
          <FooterTextFields content={content} patchContent={patchContent} />
        )}
        {selected === 'social' && (
          <SocialFields content={content} patchContent={patchContent} />
        )}
        {selected === 'gallery_attribution' && (
          <GalleryAttributionFields content={content} patchContent={patchContent} />
        )}
        {(selected === 'signature_dishes' || selected === 'reviews' ||
          selected === 'press' || selected === 'faq') && (
          <RegenerateNotice label={headerLabel} />
        )}
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Per-section editor field groups                                          *
 * ─────────────────────────────────────────────────────────────────────── */

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
      <SmallNote>
        Menu items aren’t editable here yet. Use <strong>Edit details</strong> to change items, prices, or photos.
      </SmallNote>
    </>
  )
}

function GalleryFields({ content, patchContent }: FieldProps) {
  const g = content.gallery
  return (
    <>
      <FieldText label="Heading"    value={g.heading}    onChange={(v) => patchContent((c) => ({ ...c, gallery: { ...c.gallery, heading: v } }))} />
      <FieldTextArea label="Subheading" value={g.subheading} onChange={(v) => patchContent((c) => ({ ...c, gallery: { ...c.gallery, subheading: v } }))} />
      <SmallNote>
        Gallery photos aren’t editable here yet. Use <strong>Edit details</strong> to swap images.
      </SmallNote>
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
      <RadioRow
        checked={current === 'from_venue'}
        onClick={() => set('from_venue')}
        label='"Photography by the venue."'
        hint="Choose this if the gallery photos are your own."
      />
      <RadioRow
        checked={current === 'from_unsplash'}
        onClick={() => set('from_unsplash')}
        label='"Photography sourced from Unsplash."'
        hint="Choose this if you used stock images. Honest and clear."
      />
    </>
  )
}

function RegenerateNotice({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-token bg-surface px-3 py-3 text-[12.5px] leading-[1.55] text-muted">
      <strong className="text-foreground">{label}</strong> content was generated by AI from the
      details you entered. To change it, click <strong>Edit details</strong> at the top of
      your preview and re-generate.
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── *
 * Reusable inputs                                                          *
 * ─────────────────────────────────────────────────────────────────────── */

type FieldProps = {
  content: RestaurantContent
  patchContent: (u: (c: RestaurantContent) => RestaurantContent) => void
}

function FieldText({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-token bg-white px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
      />
    </label>
  )
}

function FieldTextArea({
  label, value, onChange, placeholder, rows = 2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
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

function RadioRow({
  checked, onClick, label, hint,
}: {
  checked: boolean
  onClick: () => void
  label: string
  hint?: string
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
