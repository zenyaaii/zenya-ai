"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type { RestaurantInput } from '@/utils/restaurant/input'

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

type Form = {
  brand_name: string
  cuisine: string
  city: string
  neighborhood: string
  address: string
  phone: string
  email: string
  map_link: string
  hours: Hour[]
  categories: Array<{
    id: string
    name: string
    description: string
    items: Array<{ id: string; name: string; description: string; price: string; badge: string }>
  }>
  story_brief: string
  chef_name: string
  chef_title: string
  chef_bio_brief: string
  reservation_provider: RestaurantInput['reservations']['provider_type']
  reservation_value: string
  reservation_note: string
  hero_image_url: string
  chef_photo_url: string
  accent_image_url: string
  gallery_image_urls: string
  signature_dish_image_urls: string
  press_outlets: string
  style_preset: RestaurantInput['style_preset']
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

const INITIAL_FORM: Form = {
  brand_name: '',
  cuisine: '',
  city: '',
  neighborhood: '',
  address: '',
  phone: '',
  email: '',
  map_link: '',
  hours: DEFAULT_HOURS,
  categories: [
    {
      id: newId(),
      name: 'Starters',
      description: '',
      items: [{ id: newId(), name: '', description: '', price: '', badge: '' }]
    },
    {
      id: newId(),
      name: 'Mains',
      description: '',
      items: [{ id: newId(), name: '', description: '', price: '', badge: '' }]
    },
    {
      id: newId(),
      name: 'Desserts',
      description: '',
      items: [{ id: newId(), name: '', description: '', price: '', badge: '' }]
    }
  ],
  story_brief: '',
  chef_name: '',
  chef_title: '',
  chef_bio_brief: '',
  reservation_provider: 'resy',
  reservation_value: '',
  reservation_note: '',
  hero_image_url: '',
  chef_photo_url: '',
  accent_image_url: '',
  gallery_image_urls: '',
  signature_dish_image_urls: '',
  press_outlets: '',
  style_preset: 'onyx'
}

export default function RestaurantWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new/restaurant')
        return
      }
      setUser(user)
      setAuthReady(true)
    }
    check()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateHour(idx: number, patch: Partial<Hour>) {
    setForm((prev) => ({
      ...prev,
      hours: prev.hours.map((h, i) => (i === idx ? { ...h, ...patch } : h))
    }))
  }

  function addCategory() {
    setForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id: newId(), name: '', description: '', items: [{ id: newId(), name: '', description: '', price: '', badge: '' }] }
      ]
    }))
  }

  function removeCategory(catId: string) {
    setForm((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== catId) }))
  }

  function updateCategory(catId: string, patch: Partial<{ name: string; description: string }>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c))
    }))
  }

  function addItem(catId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId
          ? { ...c, items: [...c.items, { id: newId(), name: '', description: '', price: '', badge: '' }] }
          : c
      )
    }))
  }

  function removeItem(catId: string, itemId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      )
    }))
  }

  function updateItem(catId: string, itemId: string, patch: Partial<{ name: string; description: string; price: string; badge: string }>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : c
      )
    }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Please enter the restaurant name.'
    if (form.cuisine.trim().length < 2) return 'Please enter the cuisine type.'
    if (form.city.trim().length < 2) return 'Please enter the city.'
    if (form.address.trim().length < 4) return 'Please enter the full address.'
    if (form.phone.trim().length < 4) return 'Please enter a contact phone number.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (form.story_brief.trim().length < 10) return 'Tell us a sentence or two about the restaurant story.'
    const validCats = form.categories.filter((c) => c.name.trim().length >= 2)
    if (validCats.length === 0) return 'Add at least one menu category.'
    let totalItems = 0
    for (const cat of validCats) {
      for (const item of cat.items) {
        if (item.name.trim().length >= 2 && item.price.trim().length >= 1) totalItems++
      }
    }
    if (totalItems < 4) return 'Add at least 4 menu items so we can generate a real menu.'
    return null
  }

  function buildPayload(): RestaurantInput {
    const splitUrls = (s: string) =>
      s
        .split(/\s+|,/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//.test(u))

    return {
      brand: {
        name: form.brand_name.trim(),
        cuisine: form.cuisine.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || undefined
      },
      location: {
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        map_link: form.map_link.trim() || undefined,
        hours: form.hours
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
                badge: i.badge.trim() || undefined
              }))
          }))
          .filter((c) => c.items.length > 0)
      },
      story: {
        brief: form.story_brief.trim(),
        chef_name: form.chef_name.trim() || undefined,
        chef_title: form.chef_title.trim() || undefined,
        chef_bio_brief: form.chef_bio_brief.trim() || undefined
      },
      reservations: {
        provider_type: form.reservation_provider,
        provider_value: form.reservation_value.trim() || undefined,
        note: form.reservation_note.trim() || undefined
      },
      visuals: {
        hero_image_url: form.hero_image_url.trim() || undefined,
        chef_photo_url: form.chef_photo_url.trim() || undefined,
        accent_image_url: form.accent_image_url.trim() || undefined,
        gallery_image_urls: splitUrls(form.gallery_image_urls),
        signature_dish_image_urls: splitUrls(form.signature_dish_image_urls)
      },
      press_outlets: form.press_outlets
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2)
        .slice(0, 8),
      style_preset: form.style_preset
    }
  }

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) {
      setError(err)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setLoading(true)
    try {
      const payload = buildPayload()

      const genRes = await fetch('/api/generate-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
            input: payload
          }
        })
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
      router.push(`/preview/restaurant/${saveJson.id}`)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong while generating your site.')
      setLoading(false)
    }
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

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Restaurant theme · Maison</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Tell us about your restaurant.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            The more specific you are, the better the AI can write copy that sounds like you. Required fields are marked. Everything else is optional but recommended.
          </p>
        </div>

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
        <Section title="The menu" subtitle="At least 4 items across one or more categories. Descriptions are optional — AI will polish or generate them.">
          <div className="space-y-5">
            {form.categories.map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-token bg-elevated/60 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <input
                    className={inputCls + ' flex-1 font-semibold'}
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    placeholder="Category name (Starters, Mains…)"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(cat.id)}
                    className="rounded-full border border-token bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-300 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <input
                  className={inputCls + ' mb-4 text-sm'}
                  value={cat.description}
                  onChange={(e) => updateCategory(cat.id, { description: e.target.value })}
                  placeholder="Optional category note (e.g. 'To begin slowly.')"
                />
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <div key={item.id} className="grid gap-2 sm:grid-cols-[1.2fr_1.8fr_100px_90px_auto]">
                      <input className={inputCls + ' py-2 text-sm'} value={item.name} onChange={(e) => updateItem(cat.id, item.id, { name: e.target.value })} placeholder="Item name" />
                      <input className={inputCls + ' py-2 text-sm'} value={item.description} onChange={(e) => updateItem(cat.id, item.id, { description: e.target.value })} placeholder="Short description (optional)" />
                      <input className={inputCls + ' py-2 text-sm'} value={item.price} onChange={(e) => updateItem(cat.id, item.id, { price: e.target.value })} placeholder="$24" />
                      <input className={inputCls + ' py-2 text-sm'} value={item.badge} onChange={(e) => updateItem(cat.id, item.id, { badge: e.target.value })} placeholder="Badge" />
                      <button
                        type="button"
                        onClick={() => removeItem(cat.id, item.id)}
                        className="rounded-lg border border-token bg-surface px-2 py-1 text-xs text-muted hover:border-red-300 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
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

        {/* Section: Reservations */}
        <Section title="Reservations" subtitle="How guests book a table.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reservation provider" required>
              <select className={inputCls} value={form.reservation_provider} onChange={(e) => update('reservation_provider', e.target.value as RestaurantInput['reservations']['provider_type'])}>
                <option value="resy">Resy</option>
                <option value="opentable">OpenTable</option>
                <option value="sevenrooms">SevenRooms</option>
                <option value="phone">Phone only</option>
                <option value="form">Contact form</option>
              </select>
            </Field>
            <Field label={form.reservation_provider === 'phone' ? 'Reservation phone number' : form.reservation_provider === 'form' ? 'No URL needed' : 'Booking page URL'}>
              <input
                className={inputCls}
                value={form.reservation_value}
                onChange={(e) => update('reservation_value', e.target.value)}
                placeholder={form.reservation_provider === 'phone' ? '+1 (212) 555-0140' : 'https://resy.com/cities/ny/your-restaurant'}
                disabled={form.reservation_provider === 'form'}
              />
            </Field>
            <Field label="Booking note (optional)" className="sm:col-span-2">
              <textarea
                className={inputCls + ' min-h-[80px] resize-y'}
                value={form.reservation_note}
                onChange={(e) => update('reservation_note', e.target.value)}
                placeholder="e.g. 'For private dining or 8+, please write to events@...'"
              />
            </Field>
          </div>
        </Section>

        {/* Section: Visuals */}
        <Section title="Visuals" subtitle="Paste image URLs. If you skip these, AI uses tasteful defaults you can swap later.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hero image URL" className="sm:col-span-2">
              <input className={inputCls} value={form.hero_image_url} onChange={(e) => update('hero_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Chef photo URL">
              <input className={inputCls} value={form.chef_photo_url} onChange={(e) => update('chef_photo_url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Story accent image URL">
              <input className={inputCls} value={form.accent_image_url} onChange={(e) => update('accent_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Gallery image URLs (one per line, max 8)" className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[100px] resize-y'} value={form.gallery_image_urls} onChange={(e) => update('gallery_image_urls', e.target.value)} placeholder="https://...\nhttps://..." />
            </Field>
            <Field label="Signature dish image URLs (one per line, max 4)" className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[100px] resize-y'} value={form.signature_dish_image_urls} onChange={(e) => update('signature_dish_image_urls', e.target.value)} placeholder="https://...\nhttps://..." />
            </Field>
          </div>
        </Section>

        {/* Section: Press */}
        <Section title="Press & awards" subtitle="Optional. One per line.">
          <textarea
            className={inputCls + ' min-h-[100px] resize-y'}
            value={form.press_outlets}
            onChange={(e) => update('press_outlets', e.target.value)}
            placeholder="The New York Times\nMichelin Guide\nEater 38"
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
