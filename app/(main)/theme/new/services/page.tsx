"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { SERVICE_PRESETS } from '@/utils/services/presets'
import type { ServiceInput } from '@/utils/services/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'

type Form = {
  brand_name: string
  category: string
  city: string
  region: string
  owner_name: string
  years_in_business: string
  phone: string
  email: string
  address: string
  booking_url: string
  emergency_service: boolean
  availability: string
  response_time: string
  services: Array<{ id: string; name: string; description: string; price_from: string; badge: string }>
  areas_served: string
  differentiators: string
  story_brief: string
  owner_title: string
  quote_seed: string
  hero_image_url: string
  team_image_url: string
  before_image_url: string
  after_image_url: string
  gallery_image_urls: string[]
  review_rating: string
  review_count: string
  licenses: string
  guarantees: string
  promo_offer: string
  style_preset: ServiceInput['style_preset']
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

function buildSampleForm(): Form {
  return {
    brand_name: 'Northline Home Services',
    category: 'Plumbing & HVAC',
    city: 'Austin',
    region: 'Texas',
    owner_name: 'Daniel Hart',
    years_in_business: '12 years',
    phone: '+1 (512) 555-0187',
    email: 'hello@northlinehome.com',
    address: '1204 W 6th St, Austin, TX 78703',
    booking_url: 'https://book.northlinehome.com',
    emergency_service: true,
    availability: 'Mon–Sat, 8am–6pm',
    response_time: 'Same-day response in most service areas',
    services: [
      { id: newId(), name: 'Emergency Leak Repair', description: 'Burst pipes and water-line emergencies handled within 2 hours, day or night.', price_from: 'From $129', badge: '24/7' },
      { id: newId(), name: 'Water Heater Install', description: 'Tankless and traditional installs with a 10-year warranty.', price_from: 'From $1,490', badge: 'Most popular' },
      { id: newId(), name: 'HVAC Tune-Up', description: '21-point spring or fall inspection so your system runs at peak efficiency.', price_from: 'From $89', badge: 'Seasonal' },
    ],
    areas_served: 'Downtown Austin\nWest Lake Hills\nBee Cave\nCedar Park\nRound Rock',
    differentiators: 'Upfront flat-rate pricing — no surprises\nLicensed master plumbers and EPA-certified techs\nSame-day service across central Austin\n2-year workmanship guarantee',
    story_brief: "Northline started in 2013 out of a single van in East Austin. Daniel grew up fixing things on his dad's job sites — the rule was always 'leave it cleaner than you found it.' Twelve years later, that's still our standard. We show up on time, quote flat rates, and treat every house like it's our own.",
    owner_title: 'Founder & Master Plumber',
    quote_seed: "Honest pricing and clean work — that's the whole job.",
    hero_image_url: '',
    team_image_url: '',
    before_image_url: '',
    after_image_url: '',
    gallery_image_urls: [],
    review_rating: '4.9',
    review_count: '320+',
    licenses: 'Texas Master Plumber #M-39817\nEPA 608 Certified',
    guarantees: '2-year workmanship guarantee\n100% satisfaction or we redo it',
    promo_offer: 'Free inspection with any installation quote',
    style_preset: 'cobalt',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  category: '',
  city: '',
  region: '',
  owner_name: '',
  years_in_business: '',
  phone: '',
  email: '',
  address: '',
  booking_url: '',
  emergency_service: false,
  availability: 'Mon-Sat, 8am-6pm',
  response_time: 'Same-day response in most service areas',
  services: [
    { id: newId(), name: '', description: '', price_from: '', badge: '' }
  ],
  areas_served: '',
  differentiators: '',
  story_brief: '',
  owner_title: '',
  quote_seed: '',
  hero_image_url: '',
  team_image_url: '',
  before_image_url: '',
  after_image_url: '',
  gallery_image_urls: [],
  review_rating: '4.9',
  review_count: '200+',
  licenses: '',
  guarantees: '',
  promo_offer: '',
  style_preset: 'cobalt'
}

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

export default function ServicesWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new/services')
        return
      }
      setAuthReady(true)
    }
    checkAuth()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateService(id: string, patch: Partial<Form['services'][number]>) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((service) => (service.id === id ? { ...service, ...patch } : service))
    }))
  }

  function addService() {
    setForm((prev) => ({
      ...prev,
      services: [...prev.services, { id: newId(), name: '', description: '', price_from: '', badge: '' }]
    }))
  }

  function removeService(id: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== id)
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

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Please enter the business name.'
    if (form.category.trim().length < 2) return 'Please enter the service category.'
    if (form.city.trim().length < 2) return 'Please enter the main city.'
    if (form.phone.trim().length < 4) return 'Please enter a contact phone number.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (form.story_brief.trim().length < 20) return 'Tell us a bit more about the business story.'

    const validServices = form.services.filter((service) => service.name.trim().length >= 2)
    if (validServices.length < 1) return 'Add at least one service to generate the site.'

    return null
  }

  function buildPayload(): ServiceInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        category: form.category.trim(),
        city: form.city.trim(),
        region: form.region.trim() || undefined,
        owner_name: form.owner_name.trim() || undefined,
        years_in_business: form.years_in_business.trim() || undefined
      },
      contact: {
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        booking_url: form.booking_url.trim() || undefined,
        emergency_service: form.emergency_service,
        availability: form.availability.trim() || undefined,
        response_time: form.response_time.trim() || undefined
      },
      services: form.services
        .filter((service) => service.name.trim().length >= 2)
        .map((service) => ({
          name: service.name.trim(),
          description: service.description.trim() || undefined,
          price_from: service.price_from.trim() || undefined,
          badge: service.badge.trim() || undefined
        })),
      areas_served: splitLines(form.areas_served).slice(0, 12),
      differentiators: splitLines(form.differentiators).slice(0, 8),
      story: {
        brief: form.story_brief.trim(),
        owner_title: form.owner_title.trim() || undefined,
        quote_seed: form.quote_seed.trim() || undefined
      },
      visuals: {
        hero_image_url: form.hero_image_url.trim() || undefined,
        team_image_url: form.team_image_url.trim() || undefined,
        before_image_url: form.before_image_url.trim() || undefined,
        after_image_url: form.after_image_url.trim() || undefined,
        gallery_image_urls: form.gallery_image_urls.filter((url) => /^https?:\/\//.test(url)).slice(0, 8)
      },
      social_proof: {
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        licenses: splitLines(form.licenses).slice(0, 6),
        guarantees: splitLines(form.guarantees).slice(0, 6),
        promo_offer: form.promo_offer.trim() || undefined
      },
      style_preset: form.style_preset
    }
  }

  async function handleGenerate() {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload()
      const generateRes = await fetch('/api/generate-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const generateJson = await generateRes.json()
      if (!generateRes.ok || !generateJson?.content) {
        throw new Error(generateJson?.error || 'Generation failed')
      }

      const preset = SERVICE_PRESETS.find((item) => item.id === form.style_preset) || SERVICE_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'services',
            style_preset: form.style_preset,
            services: generateJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) {
        router.push('/login?mode=signup&next=/theme/new/services')
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
      router.push(`/preview/services/${saveJson.id}`)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while generating your site.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[560px] w-[560px] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[520px] w-[520px] translate-x-1/4 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[520px] w-[520px] -translate-x-1/4 translate-y-1/4 rounded-full bg-amber-300/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/50 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-700">Local services theme · Trade</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build a modern local service website.
          </h1>
          <p className="mt-3 max-w-3xl text-muted">
            Tell us the business basics, the services you sell, and why clients trust you. Zenya will generate the full site structure, copy, and sections for a premium local service brand.
          </p>
        </motion.div>

        {error && (
          <div className="mb-8 rounded-3xl border border-red-300 bg-red-50/85 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <Section title="Business basics" subtitle="What kind of local service business is this?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" required>
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="Northline Home Services" />
            </Field>
            <Field label="Service category" required>
              <input className={inputCls} value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Plumbing, HVAC, salon, cleaning, agency..." />
            </Field>
            <Field label="City" required>
              <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Austin" />
            </Field>
            <Field label="State / region">
              <input className={inputCls} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="Texas" />
            </Field>
            <Field label="Owner / lead name">
              <input className={inputCls} value={form.owner_name} onChange={(e) => update('owner_name', e.target.value)} placeholder="Daniel Hart" />
            </Field>
            <Field label="Years in business">
              <input className={inputCls} value={form.years_in_business} onChange={(e) => update('years_in_business', e.target.value)} placeholder="12 years" />
            </Field>
          </div>
        </Section>

        <Section title="Contact and availability" subtitle="What should the customer know before booking?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required>
              <input className={inputCls} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (512) 555-0187" />
            </Field>
            <Field label="Email" required>
              <input className={inputCls} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="hello@business.com" />
            </Field>
            <Field label="Address">
              <input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="1204 W 6th St, Austin, TX" />
            </Field>
            <Field label="Booking / scheduling URL">
              <input className={inputCls} value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Availability line">
              <input className={inputCls} value={form.availability} onChange={(e) => update('availability', e.target.value)} placeholder="Mon-Sat, 8am-6pm" />
            </Field>
            <Field label="Response time line">
              <input className={inputCls} value={form.response_time} onChange={(e) => update('response_time', e.target.value)} placeholder="Same-day response in most areas" />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-foreground">
            <input type="checkbox" checked={form.emergency_service} onChange={(e) => update('emergency_service', e.target.checked)} />
            This business offers emergency or urgent service.
          </label>
        </Section>

        <Section title="Services" subtitle="Even one service is enough. Add more if you offer them — we'll turn them into a complete services section.">
          <div className="space-y-5">
            {form.services.map((service, index) => (
              <div key={service.id} className="rounded-3xl border border-token bg-elevated/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-muted">Service 0{index + 1}</p>
                  {form.services.length > 1 && (
                    <button type="button" onClick={() => removeService(service.id)} className="rounded-full border border-token px-3 py-1 text-xs font-semibold text-muted transition hover:text-red-600">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={service.name} onChange={(e) => updateService(service.id, { name: e.target.value })} placeholder="Service name" />
                  <input className={inputCls} value={service.price_from} onChange={(e) => updateService(service.id, { price_from: e.target.value })} placeholder="Price from / quote label" />
                  <input className={inputCls + ' sm:col-span-2'} value={service.description} onChange={(e) => updateService(service.id, { description: e.target.value })} placeholder="Short rough description" />
                  <input className={inputCls} value={service.badge} onChange={(e) => updateService(service.id, { badge: e.target.value })} placeholder="Badge (Popular, Fast response...)" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addService} className="w-full rounded-2xl border-2 border-dashed border-token py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground">
              + Add another service
            </button>
          </div>
        </Section>

        <Section title="Service area and trust" subtitle="All optional — the more you add, the richer the site feels.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Areas served (optional — more = better)" className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[110px] resize-y'} value={form.areas_served} onChange={(e) => update('areas_served', e.target.value)} placeholder="One per line&#10;Downtown Austin&#10;West Lake Hills&#10;Bee Cave" />
            </Field>
            <Field label="Differentiators / trust points (optional — more = better)" className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[120px] resize-y'} value={form.differentiators} onChange={(e) => update('differentiators', e.target.value)} placeholder="One per line&#10;Upfront pricing&#10;Licensed and insured&#10;Clean work and fast follow-up" />
            </Field>
            <Field label="Licenses / certifications">
              <textarea className={inputCls + ' min-h-[90px] resize-y'} value={form.licenses} onChange={(e) => update('licenses', e.target.value)} placeholder="One per line" />
            </Field>
            <Field label="Guarantees / reassurances">
              <textarea className={inputCls + ' min-h-[90px] resize-y'} value={form.guarantees} onChange={(e) => update('guarantees', e.target.value)} placeholder="One per line" />
            </Field>
            <Field label="Average review rating">
              <input className={inputCls} value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="4.9" />
            </Field>
            <Field label="Review count">
              <input className={inputCls} value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="320+" />
            </Field>
            <Field label="Promo offer">
              <input className={inputCls} value={form.promo_offer} onChange={(e) => update('promo_offer', e.target.value)} placeholder="Free inspection with installation quote" />
            </Field>
          </div>
        </Section>

        <Section title="Business story" subtitle="A few sentences are enough. We will polish them into premium site copy.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Story brief" required className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[140px] resize-y'} value={form.story_brief} onChange={(e) => update('story_brief', e.target.value)} placeholder="How the business started, what clients value most, and what makes the experience different." />
            </Field>
            <Field label="Owner title">
              <input className={inputCls} value={form.owner_title} onChange={(e) => update('owner_title', e.target.value)} placeholder="Founder" />
            </Field>
            <Field label="Quote seed">
              <input className={inputCls} value={form.quote_seed} onChange={(e) => update('quote_seed', e.target.value)} placeholder="A short quote that sounds like the owner" />
            </Field>
          </div>
        </Section>

        <Section title="Visual assets" subtitle="Upload your own photos. Skip any slot and we'll fill it with beautiful fallback imagery.">
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl border border-token bg-elevated/60 p-4 backdrop-blur-md"
            style={{ background: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.25)' }}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]" style={{ background: 'rgba(14,165,233,0.12)' }}>
              ✨
            </div>
            <div className="text-[13px] leading-[1.55] text-foreground">
              <strong>Anything you upload here lands in your gallery too,</strong>{' '}
              <span className="text-muted">
                so you can reuse it later when editing your site. No image is no problem — leave a slot empty and we'll drop in a high-quality fallback.
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
              label="Team photo"
              value={form.team_image_url}
              onChange={(url) => update('team_image_url', url)}
              aspect="square"
            />
            <ImageUploadField
              label="Before"
              value={form.before_image_url}
              onChange={(url) => update('before_image_url', url)}
              aspect="square"
              helper="Used in the before/after comparison."
            />
            <ImageUploadField
              label="After"
              value={form.after_image_url}
              onChange={(url) => update('after_image_url', url)}
              aspect="square"
              helper="Used in the before/after comparison."
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
          </div>
        </Section>

        <Section title="Visual style" subtitle="Choose the preset that fits this local business best.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SERVICE_PRESETS.map((preset) => {
              const selected = form.style_preset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update('style_preset', preset.id)}
                  className={`rounded-3xl border-2 p-5 text-left transition ${selected ? 'border-foreground shadow-soft-lg' : 'border-token hover:border-foreground/40'}`}
                  style={{ background: preset.colors.background, color: preset.colors.text }}
                >
                  <div className="mb-4 flex gap-2">
                    <span className="h-6 w-6 rounded-full" style={{ background: preset.colors.primary }} />
                    <span className="h-6 w-6 rounded-full" style={{ background: preset.colors.accent }} />
                    <span className="h-6 w-6 rounded-full border" style={{ background: preset.colors.surface, borderColor: preset.colors.border }} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: preset.colors.accent }}>{preset.vibe}</p>
                  <p className="mt-2 text-2xl font-extrabold" style={{ fontFamily: preset.heading_font }}>{preset.name}</p>
                  <p className="mt-2 text-sm opacity-80">{preset.description}</p>
                </button>
              )
            })}
          </div>
        </Section>

        <div className="sticky bottom-6 z-20 mt-12 rounded-[28px] border border-token bg-foreground p-5 shadow-soft-lg">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-white">
              <p className="text-sm font-semibold">Ready to generate the Trade theme.</p>
              <p className="text-xs opacity-70">We will build the full local-services site and send you to the live preview.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="rounded-full bg-sky-400 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? 'Generating your site...' : 'Generate Trade theme'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-token bg-surface/85 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15'

function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section {...sectionMotion} className="mb-8 rounded-[32px] border border-token bg-surface/65 p-6 shadow-soft-md backdrop-blur-xl sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </motion.section>
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
