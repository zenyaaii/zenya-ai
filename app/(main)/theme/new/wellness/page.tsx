"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { WELLNESS_PRESETS } from '@/utils/wellness/presets'
import type { WellnessInput } from '@/utils/wellness/input'

type Treatment = { id: string; name: string; category: string; duration: string; price: string; description: string; badge: string }
type TeamMember = { id: string; name: string; title: string; specialty: string; bio: string; image_url: string }

function uid() { return Math.random().toString(36).slice(2, 9) }

type Form = {
  brand_name: string
  brand_type: string
  city: string
  region: string
  founded_year: string
  phone: string
  email: string
  address: string
  booking_url: string
  hours: string
  cancellation_policy: string
  philosophy_brief: string
  philosophy_approach: string
  amenities: string
  review_rating: string
  review_count: string
  certifications: string
  hero_image_url: string
  space_image_urls: string
  treatments: Treatment[]
  team: TeamMember[]
  style_preset: WellnessInput['style_preset']
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_type: '',
  city: '',
  region: '',
  founded_year: '',
  phone: '',
  email: '',
  address: '',
  booking_url: '',
  hours: 'Mon–Sat 9am–8pm · Sun 10am–5pm',
  cancellation_policy: '24 hours notice required',
  philosophy_brief: '',
  philosophy_approach: '',
  amenities: '',
  review_rating: '5.0',
  review_count: '100+',
  certifications: '',
  hero_image_url: '',
  space_image_urls: '',
  treatments: [
    { id: uid(), name: '', category: 'Massage', duration: '60 min', price: '', description: '', badge: '' },
    { id: uid(), name: '', category: 'Facial', duration: '60 min', price: '', description: '', badge: '' },
    { id: uid(), name: '', category: 'Yoga', duration: '60 min', price: '', description: '', badge: '' }
  ],
  team: [],
  style_preset: 'zen'
}

const TREATMENT_CATEGORIES = ['Massage', 'Facial', 'Yoga', 'Mindfulness', 'Bodywork', 'Couples', 'Hair & Beauty', 'Nail Care', 'Sauna & Steam', 'Float', 'Other']

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function WellnessWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push('/login?mode=signup&next=/theme/new/wellness'); return }
      setAuthReady(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateTreatment(id: string, patch: Partial<Treatment>) {
    setForm((prev) => ({ ...prev, treatments: prev.treatments.map((t) => t.id === id ? { ...t, ...patch } : t) }))
  }
  function addTreatment() {
    setForm((prev) => ({ ...prev, treatments: [...prev.treatments, { id: uid(), name: '', category: 'Massage', duration: '60 min', price: '', description: '', badge: '' }] }))
  }
  function removeTreatment(id: string) {
    setForm((prev) => ({ ...prev, treatments: prev.treatments.filter((t) => t.id !== id) }))
  }

  function updateTeam(id: string, patch: Partial<TeamMember>) {
    setForm((prev) => ({ ...prev, team: prev.team.map((m) => m.id === id ? { ...m, ...patch } : m) }))
  }
  function addTeamMember() {
    setForm((prev) => ({ ...prev, team: [...prev.team, { id: uid(), name: '', title: '', specialty: '', bio: '', image_url: '' }] }))
  }
  function removeTeamMember(id: string) {
    setForm((prev) => ({ ...prev, team: prev.team.filter((m) => m.id !== id) }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Please enter the studio name.'
    if (form.brand_type.trim().length < 2) return 'Please enter the studio type (e.g. Holistic Spa, Yoga Studio).'
    if (form.city.trim().length < 2) return 'Please enter the city.'
    if (form.phone.trim().length < 4) return 'Please enter a phone number.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email.'
    if (form.philosophy_brief.trim().length < 20) return 'Tell us more about the studio philosophy or story (at least 20 characters).'
    const valid = form.treatments.filter((t) => t.name.trim().length >= 2)
    if (valid.length < 3) return 'Add at least 3 treatments so the theme feels complete.'
    return null
  }

  function buildPayload(): WellnessInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        type: form.brand_type.trim(),
        city: form.city.trim(),
        region: form.region.trim() || undefined,
        founded_year: form.founded_year.trim() || undefined
      },
      contact: {
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        booking_url: form.booking_url.trim() || undefined,
        hours: form.hours.trim() || undefined,
        cancellation_policy: form.cancellation_policy.trim() || undefined
      },
      treatments: form.treatments
        .filter((t) => t.name.trim().length >= 2)
        .map((t) => ({
          name: t.name.trim(),
          category: t.category.trim() || undefined,
          duration: t.duration.trim() || undefined,
          price: t.price.trim() || undefined,
          description: t.description.trim() || undefined,
          badge: t.badge.trim() || undefined
        })),
      team: form.team
        .filter((m) => m.name.trim().length >= 2)
        .map((m) => ({
          name: m.name.trim(),
          title: m.title.trim() || undefined,
          specialty: m.specialty.trim() || undefined,
          bio: m.bio.trim() || undefined,
          image_url: /^https?:\/\//.test(m.image_url) ? m.image_url.trim() : undefined
        })),
      philosophy: {
        brief: form.philosophy_brief.trim(),
        approach: form.philosophy_approach.trim() || undefined
      },
      amenities: form.amenities.trim() || undefined,
      social_proof: {
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        certifications: form.certifications.trim() || undefined
      },
      visuals: {
        hero_image_url: /^https?:\/\//.test(form.hero_image_url) ? form.hero_image_url.trim() : undefined,
        space_image_urls: form.space_image_urls.trim() || undefined
      },
      style_preset: form.style_preset
    }
  }

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setLoading(true)
    try {
      const payload = buildPayload()
      const genRes = await fetch('/api/generate-wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'Generation failed')

      const preset = WELLNESS_PRESETS.find((p) => p.id === form.style_preset) || WELLNESS_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'wellness',
            style_preset: form.style_preset,
            wellness: genJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/wellness'); return }
      if (saveRes.status === 402) { alert('Free theme limit reached. Please upgrade to continue.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'Save failed')
      router.push(`/preview/wellness/${saveJson.id}`)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>
  }

  const selectedPreset = WELLNESS_PRESETS.find((p) => p.id === form.style_preset) || WELLNESS_PRESETS[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[600px] w-[600px] rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-rose-300/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-amber-200/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/55 backdrop-blur-2xl" />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-teal-700">Wellness Studio theme</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build a premium wellness studio site.
          </h1>
          <p className="mt-3 max-w-3xl text-muted">
            Tell us about your studio, treatments, and team. Zenya generates a complete premium site — hero, treatment menu, team profiles, gallery, testimonials, and booking flow.
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800">
            {error}
          </motion.div>
        )}

        {/* Studio basics */}
        <Section title="Studio basics" subtitle="The foundation of your brand identity and local presence.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Studio name" required>
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="Sōla Wellness Studio" />
            </Field>
            <Field label="Studio type" required>
              <input className={inputCls} value={form.brand_type} onChange={(e) => update('brand_type', e.target.value)} placeholder="Holistic Spa, Yoga Studio, Med Spa, Wellness Center..." />
            </Field>
            <Field label="City" required>
              <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Austin" />
            </Field>
            <Field label="State / region">
              <input className={inputCls} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="Texas" />
            </Field>
            <Field label="Year founded">
              <input className={inputCls} value={form.founded_year} onChange={(e) => update('founded_year', e.target.value)} placeholder="2018" />
            </Field>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact and booking" subtitle="How do clients reach you and reserve their sessions?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required>
              <input className={inputCls} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (512) 555-0182" />
            </Field>
            <Field label="Email" required>
              <input className={inputCls} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="hello@yourstudio.com" />
            </Field>
            <Field label="Address">
              <input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="2210 South Lamar Blvd, Austin TX" />
            </Field>
            <Field label="Online booking URL">
              <input className={inputCls} value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} placeholder="https://mindbodyonline.com/..." />
            </Field>
            <Field label="Studio hours">
              <input className={inputCls} value={form.hours} onChange={(e) => update('hours', e.target.value)} placeholder="Mon–Sat 9am–8pm · Sun 10am–5pm" />
            </Field>
            <Field label="Cancellation policy">
              <input className={inputCls} value={form.cancellation_policy} onChange={(e) => update('cancellation_policy', e.target.value)} placeholder="24 hours notice required" />
            </Field>
          </div>
        </Section>

        {/* Treatments */}
        <Section title="Treatments & services" subtitle="Add at least 3 treatments. Include duration and price where possible.">
          <div className="space-y-5">
            {form.treatments.map((t, index) => (
              <div key={t.id} className="rounded-3xl border border-token bg-elevated/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Treatment {String(index + 1).padStart(2, '0')}</p>
                  <button type="button" onClick={() => removeTreatment(t.id)} className="rounded-full border border-token px-3 py-1 text-xs font-semibold text-muted transition hover:text-red-500">
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={t.name} onChange={(e) => updateTreatment(t.id, { name: e.target.value })} placeholder="Treatment name (e.g. Deep Tissue Massage)" />
                  <select className={inputCls} value={t.category} onChange={(e) => updateTreatment(t.id, { category: e.target.value })}>
                    {TREATMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className={inputCls} value={t.duration} onChange={(e) => updateTreatment(t.id, { duration: e.target.value })} placeholder="Duration (e.g. 60 min)" />
                  <input className={inputCls} value={t.price} onChange={(e) => updateTreatment(t.id, { price: e.target.value })} placeholder="Price (e.g. From $120)" />
                  <input className={inputCls + ' sm:col-span-2'} value={t.description} onChange={(e) => updateTreatment(t.id, { description: e.target.value })} placeholder="Short description (optional — AI will write it if blank)" />
                  <input className={inputCls} value={t.badge} onChange={(e) => updateTreatment(t.id, { badge: e.target.value })} placeholder="Badge (Most popular, New, Signature...)" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addTreatment} className="w-full rounded-2xl border-2 border-dashed border-token py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground">
              + Add another treatment
            </button>
          </div>
        </Section>

        {/* Philosophy */}
        <Section title="Studio story & philosophy" subtitle="Tell us the spirit behind the studio. A few sentences is enough — AI will polish it.">
          <div className="grid gap-4">
            <Field label="Philosophy / story brief" required>
              <textarea className={inputCls + ' min-h-[140px] resize-y'} value={form.philosophy_brief} onChange={(e) => update('philosophy_brief', e.target.value)} placeholder="What inspired you to open this studio? What do clients feel when they walk in? What makes the experience different?" />
            </Field>
            <Field label="Core approach (optional)">
              <input className={inputCls} value={form.philosophy_approach} onChange={(e) => update('philosophy_approach', e.target.value)} placeholder="e.g. evidence-based, trauma-informed, integrative Eastern and Western..." />
            </Field>
            <Field label="Amenities (one per line or comma separated)">
              <textarea className={inputCls + ' min-h-[100px] resize-y'} value={form.amenities} onChange={(e) => update('amenities', e.target.value)} placeholder="Infrared sauna&#10;Private treatment rooms&#10;Tea lounge&#10;Float pod" />
            </Field>
          </div>
        </Section>

        {/* Team */}
        <Section title="Team members" subtitle="Optional. Add your key practitioners — AI will write their bios if you give us their details.">
          {form.team.length === 0 && (
            <p className="mb-4 text-sm text-muted">No team members added yet. Skip this and AI will create placeholder bios, or add your real team below.</p>
          )}
          <div className="space-y-5">
            {form.team.map((m, index) => (
              <div key={m.id} className="rounded-3xl border border-token bg-elevated/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Practitioner {String(index + 1).padStart(2, '0')}</p>
                  <button type="button" onClick={() => removeTeamMember(m.id)} className="rounded-full border border-token px-3 py-1 text-xs font-semibold text-muted transition hover:text-red-500">
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={m.name} onChange={(e) => updateTeam(m.id, { name: e.target.value })} placeholder="Full name" />
                  <input className={inputCls} value={m.title} onChange={(e) => updateTeam(m.id, { title: e.target.value })} placeholder="Title (e.g. Lead Therapist, Founder)" />
                  <input className={inputCls + ' sm:col-span-2'} value={m.specialty} onChange={(e) => updateTeam(m.id, { specialty: e.target.value })} placeholder="Specialties (e.g. Deep tissue · Prenatal massage · Reiki)" />
                  <textarea className={inputCls + ' sm:col-span-2 min-h-[80px] resize-y'} value={m.bio} onChange={(e) => updateTeam(m.id, { bio: e.target.value })} placeholder="Short bio or background (AI will polish this)" />
                  <input className={inputCls + ' sm:col-span-2'} value={m.image_url} onChange={(e) => updateTeam(m.id, { image_url: e.target.value })} placeholder="Photo URL (optional)" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addTeamMember} className="w-full rounded-2xl border-2 border-dashed border-token py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground">
              + Add a team member
            </button>
          </div>
        </Section>

        {/* Social proof */}
        <Section title="Social proof" subtitle="Even approximate numbers make the theme feel credible.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Average review rating">
              <input className={inputCls} value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="5.0" />
            </Field>
            <Field label="Review count">
              <input className={inputCls} value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="340+" />
            </Field>
            <Field label="Certifications / associations">
              <input className={inputCls} value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="ABMP, AMTA, 200hr RYT..." />
            </Field>
          </div>
        </Section>

        {/* Visuals */}
        <Section title="Visual assets" subtitle="Optional image URLs. Leave blank and the preview will use beautiful fallback photography.">
          <div className="grid gap-4">
            <Field label="Hero / main image URL" className="sm:col-span-2">
              <input className={inputCls} value={form.hero_image_url} onChange={(e) => update('hero_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Studio / space photos (one URL per line)">
              <textarea className={inputCls + ' min-h-[110px] resize-y'} value={form.space_image_urls} onChange={(e) => update('space_image_urls', e.target.value)} placeholder="One URL per line" />
            </Field>
          </div>
        </Section>

        {/* Style preset */}
        <Section title="Visual style" subtitle="Pick the aesthetic that matches your studio's energy.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {WELLNESS_PRESETS.map((preset) => {
              const selected = form.style_preset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update('style_preset', preset.id)}
                  className={`rounded-3xl border-2 p-5 text-left transition ${selected ? 'border-foreground shadow-soft-lg scale-[1.02]' : 'border-token hover:border-foreground/40'}`}
                  style={{ background: preset.colors.background, color: preset.colors.text }}
                >
                  <div className="mb-4 flex gap-2">
                    <span className="h-5 w-5 rounded-full shadow-sm" style={{ background: preset.colors.primary }} />
                    <span className="h-5 w-5 rounded-full shadow-sm" style={{ background: preset.colors.accent }} />
                    <span className="h-5 w-5 rounded-full border shadow-sm" style={{ background: preset.colors.surface, borderColor: preset.colors.border }} />
                  </div>
                  <p className="text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: preset.colors.accent }}>{preset.vibe}</p>
                  <p className="mt-2 text-xl font-extrabold" style={{ fontFamily: preset.heading_font }}>{preset.name}</p>
                  <p className="mt-2 text-xs opacity-75">{preset.description}</p>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Sticky CTA */}
        <div className="sticky bottom-6 z-20 mt-12 overflow-hidden rounded-[28px] border border-token shadow-soft-lg"
          style={{ background: selectedPreset.colors.primary }}
        >
          <div className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
            <div style={{ color: selectedPreset.colors.surface }}>
              <p className="text-sm font-semibold">Ready to generate your wellness site.</p>
              <p className="text-xs opacity-70">We will build the full premium site and take you to the live preview.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="whitespace-nowrap rounded-full px-8 py-3.5 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60"
              style={{ background: selectedPreset.colors.accent, color: selectedPreset.id === 'noir' ? '#0e0e0e' : selectedPreset.colors.text }}
            >
              {loading ? 'Generating your site...' : 'Generate Wellness theme →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-token bg-surface/85 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15'

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
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
