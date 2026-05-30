"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { STUDIO_PRESETS } from '@/utils/studio/presets'
import type { StudioInput } from '@/utils/studio/input'
import type { StudioStylePresetId } from '@/utils/studio/types'

function uid() { return Math.random().toString(36).slice(2, 9) }

type ValueItem = { id: string; title: string; description: string }
type Milestone = { id: string; year: string; event: string }

type Form = {
  brand_name: string
  brand_tagline: string
  brand_category: string
  brand_founded: string
  mission: string
  founder_story: string
  values: ValueItem[]
  process_description: string
  process_steps: string
  team_size: string
  press_features: string
  milestones: Milestone[]
  customer_count: string
  repeat_rate: string
  avg_rating: string
  style_preset: StudioStylePresetId
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_tagline: '',
  brand_category: '',
  brand_founded: '',
  mission: '',
  founder_story: '',
  values: [
    { id: uid(), title: '', description: '' },
    { id: uid(), title: '', description: '' },
    { id: uid(), title: '', description: '' }
  ],
  process_description: '',
  process_steps: '',
  team_size: '',
  press_features: '',
  milestones: [
    { id: uid(), year: '', event: '' },
    { id: uid(), year: '', event: '' }
  ],
  customer_count: '',
  repeat_rate: '',
  avg_rating: '4.9',
  style_preset: 'ink'
}

const CATEGORY_OPTIONS = [
  'Artisan Homeware', 'Fashion & Apparel', 'Beauty & Skincare', 'Food & Beverage',
  'Art & Prints', 'Jewellery', 'Books & Publishing', 'Outdoor & Adventure',
  'Furniture & Design', 'Ceramics & Pottery', 'Textiles & Linen', 'Other'
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function StudioWizardPage() {
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
      if (!user) { router.push('/login?mode=signup&next=/theme/new/studio'); return }
      setAuthReady(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateValue(id: string, patch: Partial<ValueItem>) {
    setForm((prev) => ({ ...prev, values: prev.values.map((v) => v.id === id ? { ...v, ...patch } : v) }))
  }
  function addValue() {
    if (form.values.length >= 5) return
    setForm((prev) => ({ ...prev, values: [...prev.values, { id: uid(), title: '', description: '' }] }))
  }
  function removeValue(id: string) {
    if (form.values.length <= 1) return
    setForm((prev) => ({ ...prev, values: prev.values.filter((v) => v.id !== id) }))
  }

  function updateMilestone(id: string, patch: Partial<Milestone>) {
    setForm((prev) => ({ ...prev, milestones: prev.milestones.map((m) => m.id === id ? { ...m, ...patch } : m) }))
  }
  function addMilestone() {
    if (form.milestones.length >= 6) return
    setForm((prev) => ({ ...prev, milestones: [...prev.milestones, { id: uid(), year: '', event: '' }] }))
  }
  function removeMilestone(id: string) {
    if (form.milestones.length <= 1) return
    setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Enter your brand name.'
    if (form.brand_tagline.trim().length < 5) return 'Enter a brand tagline.'
    if (form.brand_category.trim().length < 2) return 'Select a brand category.'
    if (form.mission.trim().length < 20) return 'Describe your mission (at least 20 characters).'
    const validValues = form.values.filter((v) => v.title.trim().length >= 2)
    if (validValues.length < 1) return 'Add at least one core value.'
    return null
  }

  function buildPayload(): StudioInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        tagline: form.brand_tagline.trim(),
        category: form.brand_category.trim(),
        founded: form.brand_founded.trim() || undefined
      },
      mission: form.mission.trim(),
      founder_story: form.founder_story.trim() || undefined,
      values: form.values
        .filter((v) => v.title.trim().length >= 2)
        .map((v) => ({ title: v.title.trim(), description: v.description.trim() || undefined })),
      process: {
        description: form.process_description.trim() || undefined,
        steps: form.process_steps.trim()
          ? form.process_steps.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
          : undefined
      },
      team_size: form.team_size.trim() || undefined,
      press_features: form.press_features.trim() || undefined,
      milestones: form.milestones
        .filter((m) => m.year.trim() && m.event.trim())
        .map((m) => ({ year: m.year.trim(), event: m.event.trim() })),
      social_proof: {
        customer_count: form.customer_count.trim() || undefined,
        repeat_rate: form.repeat_rate.trim() || undefined,
        avg_rating: form.avg_rating.trim() || undefined
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
      const genRes = await fetch('/api/generate-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'Generation failed')

      const preset = STUDIO_PRESETS.find((p) => p.id === form.style_preset) || STUDIO_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'studio',
            style_preset: form.style_preset,
            studio: genJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/studio'); return }
      if (saveRes.status === 402) { alert('Free theme limit reached. Please upgrade to continue.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'Save failed')
      router.push(`/preview/studio/${saveJson.id}`)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[600px] w-[600px] rounded-full bg-stone-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-[500px] w-[500px] -translate-x-1/3 rounded-full bg-amber-200/10 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/55 backdrop-blur-2xl" />

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Studio · Brand story theme</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build your brand story page.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Tell us your story and Zenya crafts a premium editorial brand page — manifesto hero, mission, founder letter, timeline, values, process, team, and press quotes.
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800">
            {error}
          </motion.div>
        )}

        <div className="space-y-8">

          {/* ── Brand ──────────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">1. Your brand</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Brand name *</label>
                <input
                  value={form.brand_name}
                  onChange={(e) => update('brand_name', e.target.value)}
                  placeholder="e.g. ARCANA, Marlowe & Co, The Still Life"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Tagline *</label>
                <input
                  value={form.brand_tagline}
                  onChange={(e) => update('brand_tagline', e.target.value)}
                  placeholder="e.g. Made by hand. Meant to last."
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Category *</label>
                <select
                  value={form.brand_category}
                  onChange={(e) => update('brand_category', e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                >
                  <option value="">Select category...</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Year founded</label>
                <input
                  value={form.brand_founded}
                  onChange={(e) => update('brand_founded', e.target.value)}
                  placeholder="e.g. 2017"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Mission statement *</label>
                <textarea
                  value={form.mission}
                  onChange={(e) => update('mission', e.target.value)}
                  placeholder="e.g. We are building an argument against the disposable — one handmade object at a time."
                  rows={3}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Founder story</label>
                <textarea
                  value={form.founder_story}
                  onChange={(e) => update('founder_story', e.target.value)}
                  placeholder="How did the brand start? What problem were you solving? The AI will write a compelling letter from this."
                  rows={3}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Values ─────────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">2. Core values</h2>
              <span className="text-sm text-muted">{form.values.filter(v => v.title.trim()).length}/5</span>
            </div>
            <p className="mb-5 text-sm text-muted">What does your brand refuse to compromise on? 1–5 values.</p>
            <div className="space-y-3">
              {form.values.map((val, i) => (
                <div key={val.id} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={val.title}
                    onChange={(e) => updateValue(val.id, { title: e.target.value })}
                    placeholder={`Value ${i + 1}`}
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                  />
                  <input
                    value={val.description}
                    onChange={(e) => updateValue(val.id, { description: e.target.value })}
                    placeholder="Brief description (optional)"
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeValue(val.id)}
                    disabled={form.values.length <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-token text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {form.values.length < 5 && (
              <button type="button" onClick={addValue} className="mt-4 flex items-center gap-2 text-sm font-semibold text-stone-600 hover:underline">
                + Add value
              </button>
            )}
          </motion.section>

          {/* ── Process & Timeline ─────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">3. Process & milestones</h2>
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">How you make things</label>
                <textarea
                  value={form.process_description}
                  onChange={(e) => update('process_description', e.target.value)}
                  placeholder="e.g. Every piece takes weeks to make. We visit every workshop, inspect every batch, and reject anything that isn't perfect."
                  rows={2}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Process steps</label>
                <input
                  value={form.process_steps}
                  onChange={(e) => update('process_steps', e.target.value)}
                  placeholder="Source, Design, Make, Inspect, Ship (comma separated)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-4 block text-sm font-bold text-foreground">Key milestones (year + event)</label>
                <div className="space-y-3">
                  {form.milestones.map((m, i) => (
                    <div key={m.id} className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                      <input
                        value={m.year}
                        onChange={(e) => updateMilestone(m.id, { year: e.target.value })}
                        placeholder="Year"
                        className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                      />
                      <input
                        value={m.event}
                        onChange={(e) => updateMilestone(m.id, { event: e.target.value })}
                        placeholder={`e.g. Opened our first studio in Lisbon`}
                        className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeMilestone(m.id)}
                        disabled={form.milestones.length <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-token text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {form.milestones.length < 6 && (
                  <button type="button" onClick={addMilestone} className="mt-3 flex items-center gap-2 text-sm font-semibold text-stone-600 hover:underline">
                    + Add milestone
                  </button>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── Credibility ────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. Credibility</h2>
            <p className="mb-6 text-sm text-muted">Press features, team size, and customer proof build trust.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Press features</label>
                <input
                  value={form.press_features}
                  onChange={(e) => update('press_features', e.target.value)}
                  placeholder="The New York Times, Wallpaper*, Monocle, Vogue Living... (comma separated)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Team size</label>
                <input
                  value={form.team_size}
                  onChange={(e) => update('team_size', e.target.value)}
                  placeholder="e.g. 9 people"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Objects / products sold</label>
                <input
                  value={form.customer_count}
                  onChange={(e) => update('customer_count', e.target.value)}
                  placeholder="e.g. 42,000+ objects in homes"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Repeat customer rate</label>
                <input
                  value={form.repeat_rate}
                  onChange={(e) => update('repeat_rate', e.target.value)}
                  placeholder="e.g. 82%"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Average rating</label>
                <input
                  value={form.avg_rating}
                  onChange={(e) => update('avg_rating', e.target.value)}
                  placeholder="e.g. 4.97★"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">5. Visual style</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {STUDIO_PRESETS.map((preset) => {
                const selected = form.style_preset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => update('style_preset', preset.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected ? 'border-stone-500 ring-1 ring-stone-500 bg-stone-500/5' : 'border-token bg-surface hover:border-stone-300'
                    }`}
                  >
                    <div className="mb-3 h-10 w-full overflow-hidden rounded-xl ring-1 ring-black/5" style={{ background: preset.colors.gradient }} />
                    <p className={`text-xs font-black ${selected ? 'text-stone-700' : 'text-foreground'}`}>{preset.name}</p>
                    <p className="mt-1 text-[11px] text-muted">{preset.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: selected ? preset.colors.accent : '#94a3b8' }}>
                      {preset.vibe}
                    </p>
                  </button>
                )
              })}
            </div>
          </motion.section>

          {/* ── Generate ───────────────────────────────────────────── */}
          <motion.div {...sectionMotion} className="flex flex-col items-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-3 rounded-full bg-gradient-to-r from-stone-800 to-stone-600 px-12 py-4 text-base font-black text-white shadow-xl shadow-stone-500/25 transition hover:scale-105 hover:shadow-stone-500/40 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Crafting your story...</>
              ) : (
                <>✦ Generate Studio brand page</>
              )}
            </button>
            {loading && (
              <p className="text-sm text-muted">AI is writing your manifesto, founder letter, values, and press quotes — about 15–20 seconds.</p>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
