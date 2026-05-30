"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { ATLAS_PRESETS } from '@/utils/atlas/presets'
import type { AtlasInput } from '@/utils/atlas/input'
import type { AtlasStylePresetId } from '@/utils/atlas/types'

function uid() { return Math.random().toString(36).slice(2, 9) }

type Feature = { id: string; title: string; description: string }

type Form = {
  brand_name: string
  brand_tagline: string
  brand_category: string
  target_audience: string
  problem_solved: string
  features: Feature[]
  integrations: string
  free_tier: boolean
  pro_price: string
  enterprise: boolean
  user_count: string
  review_rating: string
  review_count: string
  notable_customers: string
  style_preset: AtlasStylePresetId
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_tagline: '',
  brand_category: '',
  target_audience: '',
  problem_solved: '',
  features: [
    { id: uid(), title: '', description: '' },
    { id: uid(), title: '', description: '' },
    { id: uid(), title: '', description: '' }
  ],
  integrations: '',
  free_tier: true,
  pro_price: '$49/month',
  enterprise: true,
  user_count: '',
  review_rating: '4.9',
  review_count: '',
  notable_customers: '',
  style_preset: 'orbit'
}

const CATEGORY_OPTIONS = [
  'Project Management', 'CRM', 'Marketing', 'Analytics', 'DevOps', 'HR & Recruiting',
  'Finance', 'Customer Support', 'Sales', 'Automation', 'Communication', 'Security',
  'Data / AI', 'E-commerce', 'Education', 'Healthcare', 'Legal', 'Other'
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function AtlasWizardPage() {
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
      if (!user) { router.push('/login?mode=signup&next=/theme/new/atlas'); return }
      setAuthReady(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateFeature(id: string, patch: Partial<Feature>) {
    setForm((prev) => ({ ...prev, features: prev.features.map((f) => f.id === id ? { ...f, ...patch } : f) }))
  }
  function addFeature() {
    if (form.features.length >= 6) return
    setForm((prev) => ({ ...prev, features: [...prev.features, { id: uid(), title: '', description: '' }] }))
  }
  function removeFeature(id: string) {
    if (form.features.length <= 3) return
    setForm((prev) => ({ ...prev, features: prev.features.filter((f) => f.id !== id) }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Please enter your app or product name.'
    if (form.brand_tagline.trim().length < 5) return 'Please enter a tagline or value proposition.'
    if (form.brand_category.trim().length < 2) return 'Please select or enter a product category.'
    if (form.target_audience.trim().length < 10) return 'Describe your target audience (at least 10 characters).'
    if (form.problem_solved.trim().length < 10) return 'Describe the main problem you solve (at least 10 characters).'
    const validFeatures = form.features.filter((f) => f.title.trim().length >= 2)
    if (validFeatures.length < 3) return 'Add at least 3 features so the theme feels complete.'
    return null
  }

  function buildPayload(): AtlasInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        tagline: form.brand_tagline.trim(),
        category: form.brand_category.trim()
      },
      target_audience: form.target_audience.trim(),
      problem_solved: form.problem_solved.trim(),
      features: form.features
        .filter((f) => f.title.trim().length >= 2)
        .map((f) => ({
          title: f.title.trim(),
          description: f.description.trim() || undefined
        })),
      integrations: form.integrations.trim()
        ? form.integrations.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
      pricing: {
        free_tier: form.free_tier,
        pro_price: form.pro_price.trim() || undefined,
        enterprise: form.enterprise
      },
      social_proof: {
        user_count: form.user_count.trim() || undefined,
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        notable_customers: form.notable_customers.trim() || undefined
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
      const genRes = await fetch('/api/generate-atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'Generation failed')

      const preset = ATLAS_PRESETS.find((p) => p.id === form.style_preset) || ATLAS_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'atlas',
            style_preset: form.style_preset,
            atlas: genJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/atlas'); return }
      if (saveRes.status === 402) { alert('Free theme limit reached. Please upgrade to continue.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'Save failed')
      router.push(`/preview/atlas/${saveJson.id}`)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>
  }

  const selectedPreset = ATLAS_PRESETS.find((p) => p.id === form.style_preset) || ATLAS_PRESETS[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[600px] w-[600px] rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-violet-300/10 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/55 backdrop-blur-2xl" />

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-600">Atlas · SaaS theme</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build a premium SaaS landing page.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Tell us about your product and Zenya generates a complete, conversion-optimised SaaS site — hero, features, pricing, integrations, testimonials, and FAQ.
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
            <h2 className="mb-6 text-xl font-black text-foreground">1. Your product</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">App / product name *</label>
                <input
                  value={form.brand_name}
                  onChange={(e) => update('brand_name', e.target.value)}
                  placeholder="e.g. Streamline, Notion, Linear"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Tagline / value proposition *</label>
                <input
                  value={form.brand_tagline}
                  onChange={(e) => update('brand_tagline', e.target.value)}
                  placeholder="e.g. Ship faster, together. / The project tool your team will actually use."
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Product category *</label>
                <select
                  value={form.brand_category}
                  onChange={(e) => update('brand_category', e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                >
                  <option value="">Select category...</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Target audience *</label>
                <input
                  value={form.target_audience}
                  onChange={(e) => update('target_audience', e.target.value)}
                  placeholder="e.g. Product teams at Series A–C startups"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Main problem you solve *</label>
                <textarea
                  value={form.problem_solved}
                  onChange={(e) => update('problem_solved', e.target.value)}
                  placeholder="e.g. Teams waste hours in meetings and Jira instead of building. We replace the chaos with AI-powered planning and real-time collaboration."
                  rows={3}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Features ───────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">2. Key features</h2>
              <span className="text-sm text-muted">{form.features.filter((f) => f.title.trim()).length}/6 features</span>
            </div>
            <p className="mb-5 text-sm text-muted">Add 3–6 features. The AI will expand descriptions and add icons automatically.</p>
            <div className="space-y-3">
              {form.features.map((feat, i) => (
                <div key={feat.id} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={feat.title}
                    onChange={(e) => updateFeature(feat.id, { title: e.target.value })}
                    placeholder={`Feature ${i + 1} name`}
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                  <input
                    value={feat.description}
                    onChange={(e) => updateFeature(feat.id, { description: e.target.value })}
                    placeholder="Brief description (optional — AI will write this)"
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(feat.id)}
                    disabled={form.features.length <= 3}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-token text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {form.features.length < 6 && (
              <button
                type="button"
                onClick={addFeature}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
              >
                + Add another feature
              </button>
            )}
          </motion.section>

          {/* ── Integrations & Pricing ─────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">3. Integrations & pricing</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Integration partners</label>
                <input
                  value={form.integrations}
                  onChange={(e) => update('integrations', e.target.value)}
                  placeholder="Slack, GitHub, Figma, Notion, Jira, Stripe... (comma separated)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
                <p className="mt-1 text-xs text-muted">Leave blank and AI will pick sensible defaults for your category.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Pro plan price</label>
                <input
                  value={form.pro_price}
                  onChange={(e) => update('pro_price', e.target.value)}
                  placeholder="$49/month"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.free_tier}
                    onChange={(e) => update('free_tier', e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  <span className="text-sm font-semibold text-foreground">Include free tier</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enterprise}
                    onChange={(e) => update('enterprise', e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  <span className="text-sm font-semibold text-foreground">Include enterprise tier</span>
                </label>
              </div>
            </div>
          </motion.section>

          {/* ── Social proof ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. Social proof</h2>
            <p className="mb-6 text-sm text-muted">Optional but makes the site much more credible.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">User count</label>
                <input
                  value={form.user_count}
                  onChange={(e) => update('user_count', e.target.value)}
                  placeholder="e.g. 4,200+ teams"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Review count</label>
                <input
                  value={form.review_count}
                  onChange={(e) => update('review_count', e.target.value)}
                  placeholder="e.g. 500+ reviews"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Notable customers</label>
                <input
                  value={form.notable_customers}
                  onChange={(e) => update('notable_customers', e.target.value)}
                  placeholder="e.g. Vercel, Stripe, Notion (leave blank and AI will generate realistic names)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">5. Visual style</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {ATLAS_PRESETS.map((preset) => {
                const selected = form.style_preset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => update('style_preset', preset.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/5' : 'border-token bg-surface hover:border-indigo-300'
                    }`}
                  >
                    {/* Colour swatch */}
                    <div className="mb-3 h-10 w-full overflow-hidden rounded-xl ring-1 ring-black/5" style={{ background: preset.colors.gradient }} />
                    <p className={`text-xs font-black ${selected ? 'text-indigo-600' : 'text-foreground'}`}>{preset.name}</p>
                    <p className="mt-1 text-[11px] text-muted">{preset.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: selected ? preset.colors.primary : '#94a3b8' }}>
                      {preset.vibe}
                    </p>
                  </button>
                )
              })}
            </div>
          </motion.section>

          {/* ── Generate button ────────────────────────────────────── */}
          <motion.div {...sectionMotion} className="flex flex-col items-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-12 py-4 text-base font-black text-white shadow-xl shadow-indigo-500/25 transition hover:scale-105 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Generating your site...
                </>
              ) : (
                <>
                  ✦ Generate Atlas site
                </>
              )}
            </button>
            {loading && (
              <p className="text-sm text-muted">AI is crafting your copy, pricing, and layout — this takes about 15–20 seconds.</p>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
