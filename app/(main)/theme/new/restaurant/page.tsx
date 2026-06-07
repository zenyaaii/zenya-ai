"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type { RestaurantInput, RestaurantTypeId } from '@/utils/restaurant/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'

/** Restaurant type chips — drives AI copy tone. Optional. */
const RESTAURANT_TYPES: Array<{ id: RestaurantTypeId; label: string; icon: string }> = [
  { id: 'fine_dining',     label: 'Fine dining',         icon: '🍷' },
  { id: 'bistro',          label: 'Bistro',              icon: '🥖' },
  { id: 'cafe',            label: 'Café',                icon: '☕' },
  { id: 'coffee_takeaway', label: 'Coffee · Takeaway',   icon: '🥤' },
  { id: 'bakery',          label: 'Bakery',              icon: '🥐' },
  { id: 'pizzeria',        label: 'Pizzeria',            icon: '🍕' },
  { id: 'bar',             label: 'Bar · Wine bar',      icon: '🍸' },
  { id: 'brunch',          label: 'Brunch · All-day',    icon: '🥞' },
  { id: 'cafeteria',       label: 'Cafeteria · Canteen', icon: '🍱' },
  { id: 'food_truck',      label: 'Food truck',          icon: '🚚' },
  { id: 'dessert',         label: 'Patisserie · Dessert', icon: '🍰' },
  { id: 'other',           label: 'Other',               icon: '🍽️' },
]

type Hour = RestaurantInput['location']['hours'][number]

const DEFAULT_HOURS: Hour[] = [
  { day: 'monday', label: 'Monday', open: '', close: '', closed: true },
  { day: 'tuesday', label: 'Tuesday', open: '5:30pm', close: '10:00pm' },
  { day: 'wednesday', label: 'Wednesday', open: '5:30pm', close: '10:00pm' },
  { day: 'thursday', label: 'Thursday', open: '5:30pm', close: '10:00pm' },
  { day: 'friday', label: 'Friday', open: '5:30pm', close: '11:00pm' },
  { day: 'saturday', label: 'Saturday', open: '5:30pm', close: '11:00pm' },
  { day: 'sunday', label: 'Sunday', open: '5:00pm', close: '9:30pm' }
]

type MenuItem = {
  id: string
  name: string
  description: string
  price: string
  badge: string
  image_url: string
}

type Form = {
  brand_name: string
  cuisine: string
  city: string
  neighborhood: string
  restaurant_type: RestaurantTypeId | ''
  address: string
  phone: string
  email: string
  map_link: string
  hours: Hour[]
  categories: Array<{
    id: string
    name: string
    description: string
    items: MenuItem[]
  }>
  story_brief: string
  chef_name: string
  chef_title: string
  chef_bio_brief: string
  // Single field — auto-detected to a provider + value at submit time
  booking: string
  reservation_note: string
  hero_image_url: string
  chef_photo_url: string
  accent_image_url: string
  gallery_image_urls: string[]
  signature_dish_image_urls: string[]
  press_outlets: string
  style_preset: RestaurantInput['style_preset']
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

function emptyItem(): MenuItem {
  return { id: newId(), name: '', description: '', price: '', badge: '', image_url: '' }
}

function buildSampleForm(): Form {
  return {
    brand_name: 'Maison Lumière',
    cuisine: 'Modern French',
    city: 'New York',
    neighborhood: 'West Village',
    restaurant_type: 'fine_dining',
    address: '24 Cornelia Street, New York, NY 10014',
    phone: '+1 (212) 555-0140',
    email: 'reservations@maisonlumiere.com',
    map_link: 'https://maps.google.com/?q=24+Cornelia+St+New+York',
    hours: [
      { day: 'monday', label: 'Monday', open: '', close: '', closed: true },
      { day: 'tuesday', label: 'Tuesday', open: '5:30pm', close: '10:00pm' },
      { day: 'wednesday', label: 'Wednesday', open: '5:30pm', close: '10:00pm' },
      { day: 'thursday', label: 'Thursday', open: '5:30pm', close: '10:00pm' },
      { day: 'friday', label: 'Friday', open: '5:30pm', close: '11:00pm' },
      { day: 'saturday', label: 'Saturday', open: '5:30pm', close: '11:00pm' },
      { day: 'sunday', label: 'Sunday', open: '5:00pm', close: '9:30pm' },
    ],
    categories: [
      {
        id: newId(),
        name: 'To begin',
        description: 'Small things, slow openings.',
        items: [
          { id: newId(), name: 'Oysters · Mignonette', description: 'Half dozen, shucked to order.', price: '$24', badge: '', image_url: '' },
          { id: newId(), name: 'Beef tartare', description: 'Hand-cut, smoked yolk, sourdough toast.', price: '$22', badge: 'Signature', image_url: '' },
        ],
      },
      {
        id: newId(),
        name: 'Mains',
        description: '',
        items: [
          { id: newId(), name: 'Duck à l’orange', description: 'Aged 21 days, glazed in bitter orange.', price: '$42', badge: '', image_url: '' },
          { id: newId(), name: 'Whole roasted branzino', description: 'Salt-crusted, lemon, fennel oil.', price: '$48', badge: '', image_url: '' },
        ],
      },
      {
        id: newId(),
        name: 'Desserts',
        description: '',
        items: [
          { id: newId(), name: 'Île flottante', description: 'Vanilla custard, almond praline.', price: '$14', badge: '', image_url: '' },
        ],
      },
    ],
    story_brief: 'Maison Lumière opened in 2019 in a narrow West Village townhouse. Chef Élodie Marchand spent ten years between Paris and Burgundy before bringing her precise, ingredient-led cooking to New York. The room is candlelit, the wine list is short and personal, the music is jazz on vinyl.',
    chef_name: 'Élodie Marchand',
    chef_title: 'Chef · Proprietor',
    chef_bio_brief: 'Trained at L’Arpège in Paris and Maison Pic in Valence. Believes the best dish is the one that tastes like itself.',
    booking: 'https://resy.com/cities/ny/maison-lumiere',
    reservation_note: 'For private dining or parties of 8+, please write to events@maisonlumiere.com.',
    hero_image_url: '',
    chef_photo_url: '',
    accent_image_url: '',
    gallery_image_urls: [],
    signature_dish_image_urls: [],
    press_outlets: 'The New York Times\nMichelin Guide\nEater 38\nBon Appétit',
    style_preset: 'onyx',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  cuisine: '',
  city: '',
  neighborhood: '',
  restaurant_type: '',
  address: '',
  phone: '',
  email: '',
  map_link: '',
  hours: DEFAULT_HOURS,
  // Lean default: one category with one item. User can leave it at one or
  // add more — both work now.
  categories: [
    { id: newId(), name: 'Menu', description: '', items: [emptyItem()] },
  ],
  story_brief: '',
  chef_name: '',
  chef_title: '',
  chef_bio_brief: '',
  booking: '',
  reservation_note: '',
  hero_image_url: '',
  chef_photo_url: '',
  accent_image_url: '',
  gallery_image_urls: [],
  signature_dish_image_urls: [],
  press_outlets: '',
  style_preset: 'onyx',
}

/**
 * Detect reservation provider from a single free-text input.
 * - Resy / OpenTable / SevenRooms URL → that provider
 * - Any other URL → 'resy' (just a link; renderer treats it as a button)
 * - Phone-shaped string → 'phone'
 * - Empty → 'form' (Maison's built-in contact-form path)
 */
function detectBooking(raw: string): {
  type: RestaurantInput['reservations']['provider_type']
  value?: string
} {
  const v = raw.trim()
  if (!v) return { type: 'form' }
  const lower = v.toLowerCase()
  if (lower.includes('resy.com'))       return { type: 'resy', value: v }
  if (lower.includes('opentable.com'))  return { type: 'opentable', value: v }
  if (lower.includes('sevenrooms.com')) return { type: 'sevenrooms', value: v }
  if (/^https?:\/\//i.test(v))          return { type: 'resy', value: v }
  // very loose phone match: 6+ digits across the whole string, ignoring spaces
  const digits = v.replace(/\D/g, '')
  if (digits.length >= 6) return { type: 'phone', value: v }
  return { type: 'form' }
}

/**
 * localStorage draft key for the restaurant form. Scoped per user so
 * different signed-in users don't see each other's drafts on shared
 * devices. Versioned ("v2") so we can bump when the Form shape
 * changes incompatibly.
 */
const DRAFT_KEY_PREFIX = 'zenya:restaurant-form:v2:'

function loadDraft(userId: string): Form | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Light shape check — if the saved blob lacks the categories array
    // we treat it as junk and start fresh rather than crash.
    if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.hours)) {
      return parsed as Form
    }
  } catch {}
  return null
}

function saveDraft(userId: string, form: Form) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY_PREFIX + userId, JSON.stringify(form))
  } catch {
    // QuotaExceeded etc. — silently drop. Only impact is back-nav loses state.
  }
}

function clearDraft(userId: string) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(DRAFT_KEY_PREFIX + userId) } catch {}
}

export default function RestaurantWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Auth + draft restore ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new/restaurant')
        return
      }
      setUserId(user.id)
      // Try to restore a prior in-progress draft for this user.
      const draft = loadDraft(user.id)
      if (draft) {
        setForm(draft)
        setRestoredDraft(true)
      }
      setAuthReady(true)
    }
    check()
    return () => { cancelled = true }
  }, [router, supabase])

  // ── Persist on every change ─────────────────────────────────────────
  useEffect(() => {
    if (!authReady || !userId) return
    saveDraft(userId, form)
  }, [authReady, userId, form])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateHour(idx: number, patch: Partial<Hour>) {
    setForm((prev) => ({
      ...prev,
      hours: prev.hours.map((h, i) => (i === idx ? { ...h, ...patch } : h)),
    }))
  }

  function addCategory() {
    setForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id: newId(), name: '', description: '', items: [emptyItem()] },
      ],
    }))
  }
  function removeCategory(catId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== catId),
    }))
  }
  function updateCategory(catId: string, patch: Partial<{ name: string; description: string }>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)),
    }))
  }
  function addItem(catId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, emptyItem()] } : c
      ),
    }))
  }
  function removeItem(catId: string, itemId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      ),
    }))
  }
  function updateItem(catId: string, itemId: string, patch: Partial<MenuItem>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : c
      ),
    }))
  }
  function setGalleryAt(idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev.gallery_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, gallery_image_urls: next.filter(Boolean) }
    })
  }
  function setSignatureAt(idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev.signature_dish_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, signature_dish_image_urls: next.filter(Boolean) }
    })
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Please enter the restaurant name.'
    if (form.cuisine.trim().length < 2)    return 'Please enter the cuisine type.'
    if (form.city.trim().length < 2)       return 'Please enter the city.'
    if (form.address.trim().length < 4)    return 'Please enter the full address.'
    if (form.phone.trim().length < 4)      return 'Please enter a contact phone number.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (form.story_brief.trim().length < 10) {
      return 'Tell us a sentence or two about the restaurant story.'
    }
    // Relaxed: just need ONE valid menu item to generate.
    let validItems = 0
    for (const cat of form.categories) {
      if (cat.name.trim().length < 2) continue
      for (const item of cat.items) {
        if (item.name.trim().length >= 2 && item.price.trim().length >= 1) validItems++
      }
    }
    if (validItems < 1) return 'Add at least one menu item with a name and a price.'
    return null
  }

  function buildPayload(): RestaurantInput {
    const detected = detectBooking(form.booking)
    return {
      brand: {
        name: form.brand_name.trim(),
        cuisine: form.cuisine.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        restaurant_type: form.restaurant_type || undefined,
      },
      location: {
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        map_link: form.map_link.trim() || undefined,
        hours: form.hours,
      },
      menu: {
        categories: form.categories
          .filter((c) => c.name.trim().length >= 2)
          .map((c) => ({
            name: c.name.trim(),
            description: c.description.trim() || undefined,
            items: c.items
              .filter((i) => i.name.trim().length >= 2 && i.price.trim().length >= 1)
              .map((i) => ({
                name: i.name.trim(),
                description: i.description.trim() || undefined,
                price: i.price.trim(),
                badge: i.badge.trim() || undefined,
                image_url: i.image_url.trim() || undefined,
              })),
          }))
          .filter((c) => c.items.length > 0),
      },
      story: {
        brief: form.story_brief.trim(),
        chef_name: form.chef_name.trim() || undefined,
        chef_title: form.chef_title.trim() || undefined,
        chef_bio_brief: form.chef_bio_brief.trim() || undefined,
      },
      reservations: {
        provider_type: detected.type,
        provider_value: detected.value || undefined,
        note: form.reservation_note.trim() || undefined,
      },
      visuals: {
        hero_image_url: form.hero_image_url.trim() || undefined,
        chef_photo_url: form.chef_photo_url.trim() || undefined,
        accent_image_url: form.accent_image_url.trim() || undefined,
        gallery_image_urls: form.gallery_image_urls.filter(Boolean),
        signature_dish_image_urls: form.signature_dish_image_urls.filter(Boolean),
      },
      press_outlets: form.press_outlets
        .split(/[\n,]/).map((s) => s.trim()).filter((s) => s.length >= 2).slice(0, 8),
      style_preset: form.style_preset,
    }
  }

  // ── Counts (used by the confirm step + per-row badges) ───────────────
  const counts = (() => {
    let total = 0
    let valid = 0
    for (const cat of form.categories) {
      if (cat.name.trim().length < 2) continue
      for (const item of cat.items) {
        total++
        if (item.name.trim().length >= 2 && item.price.trim().length >= 1) valid++
      }
    }
    return { total, valid, dropped: total - valid }
  })()

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) {
      setError(err)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // If we'll silently drop any rows, surface that to the user.
    if (counts.dropped > 0) {
      const ok = window.confirm(
        `${counts.dropped} of your ${counts.total} menu items will be skipped because they're missing a name or a price.\n\nGenerate anyway?`
      )
      if (!ok) return
    }
    setLoading(true)
    try {
      const payload = buildPayload()

      const genRes = await fetch('/api/generate-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) {
        throw new Error(genJson?.error || 'Generation failed')
      }
      const content = genJson.content

      const preset = RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]

      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name,
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'restaurant',
            style_preset: form.style_preset,
            restaurant: content,
            input: payload,
          },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) {
        router.push('/login?mode=signup&next=/theme/new/restaurant')
        return
      }
      if (saveRes.status === 402) {
        alert('You have reached your free theme limit. Please upgrade to continue.')
        router.push('/pricing')
        return
      }
      if (!saveRes.ok || !saveJson?.id) {
        throw new Error(saveJson?.error || 'Save failed')
      }
      // Keep the draft in localStorage so the user can come back and
      // tweak / regenerate — we don't clear it until they explicitly
      // hit "Start fresh".
      router.push(`/preview/restaurant/${saveJson.id}`)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong while generating your site.')
      setLoading(false)
    }
  }

  function startFresh() {
    if (!confirm('Clear this form and start over? Your draft will be deleted.')) return
    if (userId) clearDraft(userId)
    setForm(INITIAL_FORM)
    setRestoredDraft(false)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      {/* gradient bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[560px] w-[560px] rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[520px] w-[520px] translate-x-1/4 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/50 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Restaurant theme · Maison</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Tell us about your restaurant.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Only a few fields are required — the rest is optional. Even one menu item is enough to generate. AI fills in any gaps.
          </p>
        </div>

        {restoredDraft && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-[rgba(94,106,210,0.06)] p-4 text-sm text-foreground backdrop-blur">
            <div>
              <strong>We saved your draft.</strong>{' '}
              <span className="text-muted">Picking up where you left off.</span>
            </div>
            <button
              type="button"
              onClick={startFresh}
              className="rounded-full border border-token bg-white px-3 py-1.5 text-[12px] font-semibold text-muted hover:bg-black/5"
            >
              Start fresh
            </button>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-300 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur">
            {error}
          </div>
        )}

        {/* Section: Basics */}
        <Section title="The basics" subtitle="Who you are and what you serve.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Restaurant name" required>
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="Maison Lumière" />
            </Field>
            <Field label="Cuisine" required>
              <input className={inputCls} value={form.cuisine} onChange={(e) => update('cuisine', e.target.value)} placeholder="Modern French" />
            </Field>
            <Field label="City" required>
              <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="New York" />
            </Field>
            <Field label="Neighborhood">
              <input className={inputCls} value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} placeholder="West Village" />
            </Field>
          </div>

          {/* What kind of place is it? Drives AI copy tone — café gets
              lighter, morning-energy copy; fine dining is precise and
              quiet; a food truck is direct and punchy. */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              What kind of place is it? <span className="text-muted/60">· optional</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {RESTAURANT_TYPES.map((t) => {
                const selected = form.restaurant_type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update('restaurant_type', selected ? '' : t.id)}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                      selected
                        ? 'border-foreground bg-foreground text-white shadow-sm'
                        : 'border-token bg-surface text-foreground hover:border-foreground/40'
                    }`}
                  >
                    <span className="text-[14px] leading-none">{t.icon}</span>
                    {t.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11.5px] text-muted">
              Helps the AI write copy that matches the energy of your place. Skip if nothing fits.
            </p>
          </div>
        </Section>

        {/* Section: Style */}
        <Section title="Visual style" subtitle="Choose the look. You can change this later.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RESTAURANT_PRESETS.map((p) => {
              const selected = form.style_preset === p.id
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => update('style_preset', p.id)}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition ${
                    selected ? 'border-foreground shadow-soft-lg' : 'border-token hover:border-foreground/40'
                  }`}
                  style={{ background: p.colors.background, color: p.colors.text }}
                >
                  <div className="mb-4 flex gap-1.5">
                    <span className="h-6 w-6 rounded-full" style={{ background: p.colors.primary }} />
                    <span className="h-6 w-6 rounded-full" style={{ background: p.colors.accent }} />
                    <span className="h-6 w-6 rounded-full border" style={{ background: p.colors.surface, borderColor: p.colors.border }} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: p.colors.accent, fontFamily: p.heading_font }}>
                    {p.vibe}
                  </p>
                  <p className="mt-1 text-xl" style={{ fontFamily: p.heading_font, color: p.colors.text }}>
                    {p.name}
                  </p>
                  <p className="mt-2 text-xs opacity-80" style={{ color: p.colors.muted }}>
                    {p.description}
                  </p>
                  {selected && (
                    <span className="absolute right-3 top-3 rounded-full bg-foreground px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                      Selected
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Section: Location & Hours */}
        <Section title="Location & hours" subtitle="Where guests find you, and when you're open.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full address" required className="sm:col-span-2">
              <input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="24 Cornelia Street, New York, NY 10014" />
            </Field>
            <Field label="Phone" required>
              <input className={inputCls} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (212) 555-0140" />
            </Field>
            <Field label="Email" required>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="reservations@restaurant.com" />
            </Field>
            <Field label="Google Maps link" className="sm:col-span-2">
              <input className={inputCls} value={form.map_link} onChange={(e) => update('map_link', e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-token bg-elevated/60 p-5 backdrop-blur-md">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted">Hours</p>
            <div className="divide-y divide-token">
              {form.hours.map((h, idx) => (
                <div key={h.day} className="grid grid-cols-[110px_1fr_1fr_80px] items-center gap-3 py-3">
                  <span className="text-sm font-medium text-foreground">{h.label}</span>
                  <input
                    className={inputCls + ' py-2'}
                    placeholder="5:30pm"
                    value={h.open}
                    onChange={(e) => updateHour(idx, { open: e.target.value })}
                    disabled={h.closed}
                  />
                  <input
                    className={inputCls + ' py-2'}
                    placeholder="10:00pm"
                    value={h.close}
                    onChange={(e) => updateHour(idx, { close: e.target.value })}
                    disabled={h.closed}
                  />
                  <label className="flex items-center justify-end gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={!!h.closed}
                      onChange={(e) => updateHour(idx, { closed: e.target.checked, ...(e.target.checked ? { open: '', close: '' } : {}) })}
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Section: Menu */}
        <Section title="The menu" subtitle="Even one item is enough. Add an image to any item — it shows next to the name on your live site.">
          <div className="space-y-5">
            {form.categories.map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-token bg-elevated/60 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <input
                    className={inputCls + ' flex-1 font-semibold'}
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    placeholder="Category name (Menu, Mains, Desserts…)"
                  />
                  {form.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      className="rounded-full border border-token bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-300 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  className={inputCls + ' mb-4 text-sm'}
                  value={cat.description}
                  onChange={(e) => updateCategory(cat.id, { description: e.target.value })}
                  placeholder="Optional category note (e.g. 'To begin slowly.')"
                />

                <div className="space-y-4">
                  {cat.items.map((item) => {
                    const itemValid =
                      item.name.trim().length >= 2 && item.price.trim().length >= 1
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 gap-3 rounded-xl border bg-surface/40 p-4 sm:grid-cols-[100px_1fr]"
                        style={{
                          borderColor: itemValid
                            ? 'rgba(21,128,61,0.25)'
                            : 'rgba(217,119,6,0.30)',
                        }}
                      >
                        {/* Per-item image upload */}
                        <ImageUploadField
                          value={item.image_url}
                          onChange={(url) => updateItem(cat.id, item.id, { image_url: url })}
                          aspect="thumb"
                        />
                        <div className="space-y-2">
                          <div className="grid gap-2 sm:grid-cols-[1.5fr_90px_90px_auto]">
                            <input className={inputCls + ' py-2 text-sm'} value={item.name} onChange={(e) => updateItem(cat.id, item.id, { name: e.target.value })} placeholder="Item name (required)" />
                            <input className={inputCls + ' py-2 text-sm'} value={item.price} onChange={(e) => updateItem(cat.id, item.id, { price: e.target.value })} placeholder="$24 (required)" />
                            <input className={inputCls + ' py-2 text-sm'} value={item.badge} onChange={(e) => updateItem(cat.id, item.id, { badge: e.target.value })} placeholder="Badge" />
                            {cat.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(cat.id, item.id)}
                                className="rounded-lg border border-token bg-surface px-2 py-1 text-xs text-muted hover:border-red-300 hover:text-red-600"
                                aria-label="Remove item"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <input
                            className={inputCls + ' py-2 text-sm'}
                            value={item.description}
                            onChange={(e) => updateItem(cat.id, item.id, { description: e.target.value })}
                            placeholder="Short description (optional — AI will polish)"
                          />
                          {/* Status — explicit so users see why an item may not save */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            {itemValid ? (
                              <span className="inline-flex items-center gap-1 text-[#15803d]">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#15803d]" />
                                Will be saved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#b45309]">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#b45309]" />
                                Needs both <strong className="font-semibold">name</strong> and <strong className="font-semibold">price</strong> to save
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => addItem(cat.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-token bg-surface px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-elevated"
                >
                  + Add item
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCategory}
              className="w-full rounded-2xl border-2 border-dashed border-token bg-transparent py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground"
            >
              + Add menu category
            </button>
          </div>
        </Section>

        {/* Section: Story */}
        <Section title="Your story" subtitle="A short brief. AI will turn this into editorial copy.">
          <Field label="About the restaurant" required>
            <textarea
              className={inputCls + ' min-h-[140px] resize-y'}
              value={form.story_brief}
              onChange={(e) => update('story_brief', e.target.value)}
              placeholder="A few sentences. When did you open, what's the philosophy, where do you source from, what makes the room feel like itself?"
            />
          </Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Chef name">
              <input className={inputCls} value={form.chef_name} onChange={(e) => update('chef_name', e.target.value)} placeholder="Élodie Marchand" />
            </Field>
            <Field label="Chef title">
              <input className={inputCls} value={form.chef_title} onChange={(e) => update('chef_title', e.target.value)} placeholder="Chef · Proprietor" />
            </Field>
            <Field label="Chef bio brief" className="sm:col-span-2">
              <textarea
                className={inputCls + ' min-h-[100px] resize-y'}
                value={form.chef_bio_brief}
                onChange={(e) => update('chef_bio_brief', e.target.value)}
                placeholder="Training, background, what brought them here — AI will polish."
              />
            </Field>
          </div>
        </Section>

        {/* Section: Reservations — single input, auto-detected */}
        <Section
          title="Reservations"
          subtitle="Paste your Resy / OpenTable / SevenRooms link, a phone number, or leave blank. We figure it out."
        >
          <Field label="Booking URL or phone (optional)">
            <input
              className={inputCls}
              value={form.booking}
              onChange={(e) => update('booking', e.target.value)}
              placeholder="https://resy.com/cities/ny/your-restaurant  ·  or  ·  +1 (212) 555-0140"
            />
          </Field>
          <Field label="Booking note (optional)" className="mt-4">
            <textarea
              className={inputCls + ' min-h-[80px] resize-y'}
              value={form.reservation_note}
              onChange={(e) => update('reservation_note', e.target.value)}
              placeholder="e.g. 'For private dining or 8+, please write to events@...'"
            />
          </Field>
        </Section>

        {/* Section: Visuals — uploads everywhere */}
        <Section title="Visuals" subtitle="Upload your own photos. Or skip — we've got you.">
          {/* Reassurance banner — explicit: no photos? not a problem. */}
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl border border-token bg-elevated/60 p-4 backdrop-blur-md"
            style={{ background: 'rgba(94,106,210,0.06)', borderColor: 'rgba(94,106,210,0.25)' }}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]"
              style={{ background: 'rgba(94,106,210,0.12)' }}
            >
              ✨
            </div>
            <div className="text-[13px] leading-[1.55] text-foreground">
              <strong>No photos? Don&rsquo;t worry.</strong>{' '}
              <span className="text-muted">
                Leave any image slot empty and we&rsquo;ll fill it with beautiful,
                royalty-free photos from Unsplash that match your{' '}
                {form.restaurant_type
                  ? <span className="font-medium text-foreground">{RESTAURANT_TYPES.find((t) => t.id === form.restaurant_type)?.label.toLowerCase()}</span>
                  : 'restaurant type'}
                . You can always come back and replace them later.
              </span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageUploadField
              label="Hero image"
              value={form.hero_image_url}
              onChange={(url) => update('hero_image_url', url)}
              aspect="wide"
              helper="Big image at the top of your page."
              className="sm:col-span-2"
            />
            <ImageUploadField
              label="Chef photo"
              value={form.chef_photo_url}
              onChange={(url) => update('chef_photo_url', url)}
              aspect="square"
            />
            <ImageUploadField
              label="Story accent image"
              value={form.accent_image_url}
              onChange={(url) => update('accent_image_url', url)}
              aspect="square"
              helper="Shows next to the chef story."
            />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-[12.5px] font-medium text-foreground">
                Gallery (up to 8)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <ImageUploadField
                    key={`g-${i}`}
                    value={form.gallery_image_urls[i] || ''}
                    onChange={(url) => setGalleryAt(i, url)}
                    aspect="square"
                  />
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-[12.5px] font-medium text-foreground">
                Signature dish photos (up to 4)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <ImageUploadField
                    key={`s-${i}`}
                    value={form.signature_dish_image_urls[i] || ''}
                    onChange={(url) => setSignatureAt(i, url)}
                    aspect="square"
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Press */}
        <Section title="Press & awards" subtitle="Optional. One per line.">
          <textarea
            className={inputCls + ' min-h-[100px] resize-y'}
            value={form.press_outlets}
            onChange={(e) => update('press_outlets', e.target.value)}
            placeholder={'The New York Times\nMichelin Guide\nEater 38'}
          />
        </Section>

        {/* Submit */}
        <div className="sticky bottom-6 z-20 mt-12 rounded-3xl border border-token bg-foreground p-5 shadow-soft-lg backdrop-blur-xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-white">
              <p className="text-sm font-semibold">Ready when you are.</p>
              <p className="text-xs opacity-70">Takes about 20–40 seconds. We&rsquo;ll redirect you to your live preview.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="rounded-full bg-amber-400 px-8 py-3.5 text-sm font-bold text-black shadow-soft-md transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? 'Generating your site…' : 'Generate my site'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-token bg-surface/80 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 backdrop-blur-md focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15'

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-3xl border border-token bg-surface/60 p-6 shadow-soft-md backdrop-blur-xl sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
