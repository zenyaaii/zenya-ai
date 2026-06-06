'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  Check,
  Globe,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Type,
  AtSign,
  Image as ImageIcon,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { RestaurantContent, RestaurantSectionKey } from '@/utils/restaurant/types'
import { RESTAURANT_SECTION_LABELS } from '@/utils/restaurant/types'

const SECTION_ORDER: RestaurantSectionKey[] = [
  'hero',
  'story',
  'signature_dishes',
  'menu',
  'gallery',
  'hours_location',
  'reservations',
  'reviews',
  'press',
  'newsletter',
  'faq',
]

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function RestaurantEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<RestaurantContent | null>(null)
  const [original, setOriginal] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    visibility: true,
    hero: true,
    story: false,
    menu: false,
    gallery: false,
    reservations: false,
    footer: false,
    social: false,
  })

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
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  const dirty = useMemo(
    () => !!content && JSON.stringify(content) !== original,
    [content, original]
  )

  // ── Mutation helpers ──────────────────────────────────────────────────
  function patchHero(patch: Partial<RestaurantContent['hero']>) {
    setContent((c) => (c ? { ...c, hero: { ...c.hero, ...patch } } : c))
  }
  function patchStory(patch: Partial<RestaurantContent['story']>) {
    setContent((c) => (c ? { ...c, story: { ...c.story, ...patch } } : c))
  }
  function patchFooter(patch: Partial<RestaurantContent['footer']>) {
    setContent((c) => (c ? { ...c, footer: { ...c.footer, ...patch } } : c))
  }
  function patchSocial(key: keyof NonNullable<RestaurantContent['social_links']>, value: string) {
    setContent((c) => (c ? { ...c, social_links: { ...(c.social_links || {}), [key]: value } } : c))
  }
  function patchGalleryAttribution(value: 'from_venue' | 'from_unsplash') {
    setContent((c) => (c ? { ...c, gallery: { ...c.gallery, attribution: value } } : c))
  }
  function toggleSection(key: RestaurantSectionKey) {
    setContent((c) => {
      if (!c) return c
      const hidden = new Set(c.hidden_sections || [])
      if (hidden.has(key)) hidden.delete(key)
      else hidden.add(key)
      return { ...c, hidden_sections: Array.from(hidden) }
    })
  }
  function isHidden(key: RestaurantSectionKey) {
    return (content?.hidden_sections || []).includes(key)
  }
  function toggleCard(key: string) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }))
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function save() {
    if (!content) return
    setStatus('saving')
    setError(null)
    try {
      // Pull the existing full theme to merge — we only want to patch the
      // `restaurant` slice inside content; everything else (business_type,
      // style_preset, input, etc.) is preserved.
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
      setTimeout(() => setStatus('idle'), 1500)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Save failed.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted">Loading editor…</main>
    )
  }
  if (error && !content) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-foreground">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </main>
    )
  }
  if (!content) return null

  return (
    <main className="min-h-screen bg-surface pb-24">
      {/* ── Sticky save bar ──────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: 'rgba(247,244,237,0.92)',
          borderBottom: '1px solid #e5e2d9',
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/preview/restaurant/${params.id}`}
              className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-3 py-1.5 text-[12.5px] font-medium text-muted hover:bg-black/5"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.25} />
              Back to preview
            </Link>
            <span className="text-[12.5px] text-muted truncate max-w-[240px]">
              Editing <strong className="font-semibold text-foreground">{content.brand.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={status} dirty={dirty} />
            <button
              onClick={save}
              disabled={!dirty || status === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2.25} />
              Save changes
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-[#fca5a5] bg-[#fee2e2]/80 p-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        )}

        {/* Section visibility — at the top because it's the most-used edit */}
        <EditorCard
          icon={<Eye className="h-4 w-4" />}
          title="Show or hide sections"
          subtitle="Toggle any section off and it disappears from your live site."
          expanded={expanded.visibility}
          onToggle={() => toggleCard('visibility')}
        >
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SECTION_ORDER.map((key) => {
              const hidden = isHidden(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key)}
                  className={
                    'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ' +
                    (hidden
                      ? 'border-token bg-surface text-muted'
                      : 'border-[rgba(21,128,61,0.20)] bg-[rgba(21,128,61,0.06)] text-foreground')
                  }
                >
                  <span className="text-[13px] font-medium">{RESTAURANT_SECTION_LABELS[key]}</span>
                  {hidden ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                      <EyeOff className="h-3 w-3" /> Hidden
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803d]">
                      <Eye className="h-3 w-3" /> Visible
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </EditorCard>

        {/* Hero text */}
        <EditorCard
          icon={<Type className="h-4 w-4" />}
          title="Hero"
          subtitle="The big top-of-page block. Hidden if you turned the section off above."
          expanded={expanded.hero}
          onToggle={() => toggleCard('hero')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldText label="Eyebrow"        value={content.hero.eyebrow}       onChange={(v) => patchHero({ eyebrow: v })} />
            <FieldText label="Primary CTA"    value={content.hero.primary_cta}   onChange={(v) => patchHero({ primary_cta: v })} />
            <FieldTextArea label="Headline"   value={content.hero.headline}      onChange={(v) => patchHero({ headline: v })} className="sm:col-span-2" />
            <FieldTextArea label="Subheadline" value={content.hero.subheadline} onChange={(v) => patchHero({ subheadline: v })} className="sm:col-span-2" />
            <FieldText label="Secondary CTA"  value={content.hero.secondary_cta} onChange={(v) => patchHero({ secondary_cta: v })} />
          </div>
        </EditorCard>

        {/* Story text */}
        <EditorCard
          icon={<Type className="h-4 w-4" />}
          title="Our story"
          subtitle="The chef's bio + story copy."
          expanded={expanded.story}
          onToggle={() => toggleCard('story')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldText label="Section heading" value={content.story.heading} onChange={(v) => patchStory({ heading: v })} className="sm:col-span-2" />
            <FieldTextArea label="Story body" value={content.story.body || ''} onChange={(v) => patchStory({ body: v })} className="sm:col-span-2" rows={4} />
            <FieldText label="Chef name"  value={content.story.chef_name || ''}  onChange={(v) => patchStory({ chef_name: v })} />
            <FieldText label="Chef title" value={content.story.chef_title || ''} onChange={(v) => patchStory({ chef_title: v })} />
            <FieldTextArea label="Chef bio (short)" value={content.story.chef_bio || ''} onChange={(v) => patchStory({ chef_bio: v })} className="sm:col-span-2" rows={3} />
          </div>
        </EditorCard>

        {/* Gallery attribution */}
        <EditorCard
          icon={<ImageIcon className="h-4 w-4" />}
          title="Gallery attribution"
          subtitle="The small note under the photo gallery on your live site."
          expanded={expanded.gallery}
          onToggle={() => toggleCard('gallery')}
        >
          <div className="space-y-2">
            <RadioRow
              checked={(content.gallery.attribution || 'from_unsplash') === 'from_venue'}
              onClick={() => patchGalleryAttribution('from_venue')}
              label='"Photography by the venue."'
              hint="Choose this if the gallery photos are your own."
            />
            <RadioRow
              checked={(content.gallery.attribution || 'from_unsplash') === 'from_unsplash'}
              onClick={() => patchGalleryAttribution('from_unsplash')}
              label='"Photography sourced from Unsplash."'
              hint="Choose this if you used stock images. Honest and clear."
            />
          </div>
        </EditorCard>

        {/* Footer text */}
        <EditorCard
          icon={<Type className="h-4 w-4" />}
          title="Footer"
          subtitle="Tagline + legal line at the bottom."
          expanded={expanded.footer}
          onToggle={() => toggleCard('footer')}
        >
          <div className="grid gap-3">
            <FieldText label="Tagline" value={content.footer.tagline} onChange={(v) => patchFooter({ tagline: v })} />
            <FieldText label="Legal line" value={content.footer.legal} onChange={(v) => patchFooter({ legal: v })} />
          </div>
        </EditorCard>

        {/* Social media — only icons with URLs render on the live site */}
        <EditorCard
          icon={<AtSign className="h-4 w-4" />}
          title="Social media"
          subtitle="Add any links you want in the footer. Empty fields don't show on the live site."
          expanded={expanded.social}
          onToggle={() => toggleCard('social')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SocialField icon={<AtSign className="h-3.5 w-3.5" />} label="Instagram"
              value={content.social_links?.instagram || ''}
              onChange={(v) => patchSocial('instagram', v)}
              placeholder="https://instagram.com/yourplace" />
            <SocialField icon={<AtSign className="h-3.5 w-3.5" />} label="Facebook"
              value={content.social_links?.facebook || ''}
              onChange={(v) => patchSocial('facebook', v)}
              placeholder="https://facebook.com/yourplace" />
            <SocialField icon={<AtSign className="h-3.5 w-3.5" />} label="TikTok"
              value={content.social_links?.tiktok || ''}
              onChange={(v) => patchSocial('tiktok', v)}
              placeholder="https://tiktok.com/@yourplace" />
            <SocialField icon={<MessageCircle className="h-3.5 w-3.5" />} label="WhatsApp"
              value={content.social_links?.whatsapp || ''}
              onChange={(v) => patchSocial('whatsapp', v)}
              placeholder="https://wa.me/12125550140 or +1 212 555 0140" />
            <SocialField icon={<AtSign className="h-3.5 w-3.5" />} label="YouTube"
              value={content.social_links?.youtube || ''}
              onChange={(v) => patchSocial('youtube', v)}
              placeholder="https://youtube.com/@yourplace" />
            <SocialField icon={<Globe className="h-3.5 w-3.5" />} label="Website / other"
              value={content.social_links?.website || ''}
              onChange={(v) => patchSocial('website', v)}
              placeholder="https://yourwebsite.com" />
          </div>
        </EditorCard>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Subcomponents                                                            */
/* ─────────────────────────────────────────────────────────────────────── */

function EditorCard({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <motion.section
      layout
      className="mb-3 overflow-hidden rounded-2xl border border-token bg-white shadow-soft-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-primary"
            style={{ background: 'rgba(94,106,210,0.10)' }}
          >
            {icon}
          </span>
          <div>
            <div className="text-[14px] font-semibold text-foreground">{title}</div>
            {subtitle && <div className="text-[12px] text-muted">{subtitle}</div>}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-token bg-surface/40 px-5 py-5"
        >
          {children}
        </motion.div>
      )}
    </motion.section>
  )
}

function FieldText({
  label, value, onChange, className = '', placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-token bg-white px-3 py-2 text-[14px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
      />
    </label>
  )
}

function FieldTextArea({
  label, value, onChange, className = '', placeholder, rows = 2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  rows?: number
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-token bg-white px-3 py-2 text-[14px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
      />
    </label>
  )
}

function SocialField({
  icon, label, value, onChange, placeholder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {icon}
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-token bg-white px-3 py-2 text-[13.5px] text-foreground placeholder:text-muted/60 outline-none transition-shadow duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(94,106,210,0.15)]"
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
        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ' +
        (checked
          ? 'border-primary bg-[rgba(94,106,210,0.08)]'
          : 'border-token bg-white hover:bg-black/[0.02]')
      }
    >
      <span
        className={
          'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ' +
          (checked ? 'border-primary bg-primary' : 'border-token bg-white')
        }
      >
        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-[13.5px] font-medium text-foreground">{label}</span>
        {hint && <span className="block text-[12px] text-muted">{hint}</span>}
      </span>
    </button>
  )
}

function StatusPill({ status, dirty }: { status: Status; dirty: boolean }) {
  if (status === 'saving') {
    return <span className="text-[12px] font-medium text-muted">Saving…</span>
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#15803d]">
        <Check className="h-3 w-3" strokeWidth={2.5} /> Saved
      </span>
    )
  }
  if (status === 'error') {
    return <span className="text-[12px] font-medium text-[#b91c1c]">Save failed</span>
  }
  return (
    <span className="text-[12px] font-medium text-muted">
      {dirty ? 'Unsaved changes' : 'All saved'}
    </span>
  )
}

