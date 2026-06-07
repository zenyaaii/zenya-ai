"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { LOOKBOOK_PRESETS } from '@/utils/lookbook/presets'
import type { LookbookStylePresetId } from '@/utils/lookbook/types'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'

function uid() { return Math.random().toString(36).slice(2, 9) }

type Product = { id: string; name: string; price: string; category: string }

type Form = {
  brand_name: string
  brand_tagline: string
  brand_category: string
  style_direction: string
  target_customer: string
  collection_name: string
  collection_season: string
  products: Product[]
  brand_story: string
  sustainability_focus: boolean
  press_features: string
  review_rating: string
  review_count: string
  hero_image_url: string
  gallery_image_urls: string[]
  style_preset: LookbookStylePresetId
}

const CATEGORY_OPTIONS = [
  'Contemporary Women\'s', 'Contemporary Men\'s', 'Unisex / Gender-neutral',
  'Luxury / Couture', 'Streetwear', 'Activewear', 'Swimwear', 'Lingerie',
  'Accessories', 'Footwear', 'Kidswear', 'Bridal', 'Denim', 'Knitwear', 'Other'
]

const PRODUCT_CATEGORIES = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Knitwear', 'Accessories', 'Shoes', 'Bags', 'Swimwear', 'Activewear', 'Other']

function buildSampleForm(): Form {
  return {
    brand_name: 'VELA',
    brand_tagline: 'Wear what matters.',
    brand_category: 'Contemporary Women\'s',
    style_direction: 'Minimal European luxury. Think The Row meets Reformation — clean lines, natural fabrics, timeless not trendy. Palette is warm neutrals, ivory, deep forest green.',
    target_customer: 'Professional women 28–45 who value quality over quantity and want a wardrobe of fewer, better pieces.',
    collection_name: 'The Cortège Edit',
    collection_season: 'SS25',
    products: [
      { id: uid(), name: 'Silk Slip Dress · Ivory', price: '$345', category: 'Dresses' },
      { id: uid(), name: 'Linen Tailored Trouser', price: '$245', category: 'Bottoms' },
      { id: uid(), name: 'Wool Crepe Blazer', price: '$595', category: 'Outerwear' },
      { id: uid(), name: 'Cashmere Crew', price: '$285', category: 'Knitwear' },
    ],
    brand_story: 'VELA started in 2021 with one question: why is the considered, well-made wardrobe still so rare? We work directly with small mills in Portugal and Italy, ship from a single studio in Lisbon, and never run sales — the price is the price.',
    sustainability_focus: true,
    press_features: 'Vogue, Harper\'s Bazaar, The Cut, Refinery29',
    review_rating: '4.9',
    review_count: '2,400+ reviews',
    hero_image_url: '',
    gallery_image_urls: [],
    style_preset: 'noir',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_tagline: '',
  brand_category: '',
  style_direction: '',
  target_customer: '',
  collection_name: '',
  collection_season: 'SS25',
  products: [
    { id: uid(), name: '', price: '', category: 'Dresses' }
  ],
  brand_story: '',
  sustainability_focus: false,
  press_features: '',
  review_rating: '4.9',
  review_count: '',
  hero_image_url: '',
  gallery_image_urls: [],
  style_preset: 'noir'
}

const sm = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function LookbookWizardPage() {
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
      if (!user) { router.push('/login?mode=signup&next=/theme/new/lookbook'); return }
      setAuthReady(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function updateProduct(id: string, patch: Partial<Product>) {
    setForm((p) => ({ ...p, products: p.products.map((pr) => pr.id === id ? { ...pr, ...patch } : pr) }))
  }
  function addProduct() {
    if (form.products.length >= 8) return
    setForm((p) => ({ ...p, products: [...p.products, { id: uid(), name: '', price: '', category: 'Other' }] }))
  }
  function removeProduct(id: string) {
    if (form.products.length <= 1) return
    setForm((p) => ({ ...p, products: p.products.filter((pr) => pr.id !== id) }))
  }
  function setGalleryAt(idx: number, url: string) {
    setForm((p) => {
      const next = [...p.gallery_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...p, gallery_image_urls: next.filter(Boolean) }
    })
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'Please enter your brand name.'
    if (form.brand_tagline.trim().length < 3) return 'Please enter a tagline.'
    if (form.brand_category.trim().length < 2) return 'Please select a brand category.'
    if (form.style_direction.trim().length < 10) return 'Describe your style direction (at least 10 characters).'
    if (form.target_customer.trim().length < 10) return 'Describe your target customer (at least 10 characters).'
    const validProducts = form.products.filter((p) => p.name.trim().length >= 2)
    if (validProducts.length < 1) return 'Add at least one product to populate the lookbook.'
    return null
  }

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setLoading(true)
    try {
      const payload = {
        brand: {
          name: form.brand_name.trim(),
          tagline: form.brand_tagline.trim(),
          category: form.brand_category.trim()
        },
        style_direction: form.style_direction.trim(),
        target_customer: form.target_customer.trim(),
        collection_name: form.collection_name.trim() || undefined,
        collection_season: form.collection_season.trim() || undefined,
        products: form.products
          .filter((p) => p.name.trim().length >= 2)
          .map((p) => ({
            name: p.name.trim(),
            price: p.price.trim() || undefined,
            category: p.category.trim() || undefined
          })),
        brand_story: form.brand_story.trim() || undefined,
        sustainability_focus: form.sustainability_focus,
        press_features: form.press_features.trim() || undefined,
        social_proof: {
          review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
          review_count: form.review_count.trim() || undefined
        },
        visuals: {
          hero_image_url: form.hero_image_url.trim() || undefined,
          gallery_image_urls: form.gallery_image_urls.filter(Boolean).slice(0, 8)
        },
        style_preset: form.style_preset
      }

      const genRes = await fetch('/api/generate-lookbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'Generation failed')

      const preset = LOOKBOOK_PRESETS.find((p) => p.id === form.style_preset) || LOOKBOOK_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: form.gallery_image_urls.filter(Boolean),
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'lookbook',
            style_preset: form.style_preset,
            lookbook: genJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/lookbook'); return }
      if (saveRes.status === 402) { alert('Free theme limit reached. Please upgrade to continue.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'Save failed')
      router.push(`/preview/lookbook/${saveJson.id}`)
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-[400px] w-[400px] -translate-x-1/3 rounded-full bg-amber-100/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-stone-200/30 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sm} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Lookbook · Fashion theme</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build a premium fashion site.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Tell us about your brand and collection. Zenya generates a full editorial site — hero, lookbook grid, product shop, brand story, press wall, reviews, and newsletter.
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800">
            {error}
          </motion.div>
        )}

        <div className="space-y-8">

          {/* ── Brand ──────────────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">1. Your brand</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Brand name *</label>
                <input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="e.g. VELA, MAEVE, ARCA" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Tagline *</label>
                <input value={form.brand_tagline} onChange={(e) => update('brand_tagline', e.target.value)} placeholder="e.g. Wear what matters." className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Brand category *</label>
                <select value={form.brand_category} onChange={(e) => update('brand_category', e.target.value)} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20">
                  <option value="">Select category...</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Target customer *</label>
                <input value={form.target_customer} onChange={(e) => update('target_customer', e.target.value)} placeholder="e.g. Professional women 28–45 who value quality over quantity" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Style direction *</label>
                <textarea value={form.style_direction} onChange={(e) => update('style_direction', e.target.value)} placeholder="e.g. Minimal European luxury. Think The Row meets Reformation — clean lines, natural fabrics, timeless not trendy. Palette is warm neutrals, ivory, deep forest." rows={3} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Brand story</label>
                <textarea value={form.brand_story} onChange={(e) => update('brand_story', e.target.value)} placeholder="Tell us the origin story, founding values, or what makes the brand different. AI will use this to write the 'Our story' section." rows={4} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
            </div>
          </motion.section>

          {/* ── Collection ─────────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">2. Collection</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Collection name</label>
                <input value={form.collection_name} onChange={(e) => update('collection_name', e.target.value)} placeholder="e.g. The Cortège Edit" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Season</label>
                <select value={form.collection_season} onChange={(e) => update('collection_season', e.target.value)} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20">
                  {['SS25', 'AW25', 'SS26', 'AW26', 'Pre-Fall 2025', 'Resort 2025', 'Holiday 2025'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </motion.section>

          {/* ── Products ───────────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">3. Products</h2>
              <span className="text-sm text-muted">{form.products.filter((p) => p.name.trim()).length}/8</span>
            </div>
            <p className="mb-5 text-sm text-muted">Even one product is enough — add up to 8. These will appear in the lookbook and bestsellers grid.</p>
            <div className="space-y-3">
              {form.products.map((product, i) => (
                <div key={product.id} className="grid gap-3 sm:grid-cols-[2fr_1fr_1.2fr_auto]">
                  <input value={product.name} onChange={(e) => updateProduct(product.id, { name: e.target.value })} placeholder={`Product ${i + 1} name`} className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
                  <input value={product.price} onChange={(e) => updateProduct(product.id, { price: e.target.value })} placeholder="Price (e.g. $245)" className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
                  <select value={product.category} onChange={(e) => updateProduct(product.id, { category: e.target.value })} className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none">
                    {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => removeProduct(product.id)} disabled={form.products.length <= 1} className="flex h-10 w-10 items-center justify-center rounded-xl border border-token text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30">×</button>
                </div>
              ))}
            </div>
            {form.products.length < 8 && (
              <button type="button" onClick={addProduct} className="mt-4 text-sm font-semibold text-stone-600 hover:underline">
                + Add another product
              </button>
            )}
          </motion.section>

          {/* ── Visual assets ──────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. Visual assets</h2>
            <p className="mb-5 text-sm text-muted">Upload your editorial and product shots — they'll appear in your lookbook and also land in your gallery for reuse later. Skip any slot and we'll fill it with a curated fallback.</p>
            <div className="grid gap-5">
              <ImageUploadField
                label="Hero image"
                value={form.hero_image_url}
                onChange={(url) => update('hero_image_url', url)}
                aspect="wide"
                helper="The big image at the top of the page."
              />
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Lookbook gallery (up to 8)</label>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <ImageUploadField
                      key={`lg-${i}`}
                      value={form.gallery_image_urls[i] || ''}
                      onChange={(url) => setGalleryAt(i, url)}
                      aspect="square"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Social proof & Press ───────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">5. Credibility</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Review count</label>
                <input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="e.g. 2,400+ reviews" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Average rating</label>
                <select value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none">
                  {['5.0', '4.9', '4.8', '4.7'].map((r) => <option key={r} value={r}>{r} ★</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">Press features</label>
                <input value={form.press_features} onChange={(e) => update('press_features', e.target.value)} placeholder="e.g. Vogue, Harper's Bazaar, The Cut, Refinery29" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
                <p className="mt-1 text-xs text-muted">Comma-separated. Leave blank and AI will use fashion-relevant defaults.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={form.sustainability_focus} onChange={(e) => update('sustainability_focus', e.target.checked)} className="h-4 w-4 rounded text-stone-600" />
                  <span className="text-sm font-semibold text-foreground">Highlight sustainability / ethical production in brand story</span>
                </label>
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">6. Visual style</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {LOOKBOOK_PRESETS.map((preset) => {
                const selected = form.style_preset === preset.id
                return (
                  <button key={preset.id} type="button" onClick={() => update('style_preset', preset.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${selected ? 'border-stone-800 ring-1 ring-stone-800 bg-stone-50' : 'border-token bg-surface hover:border-stone-400'}`}
                  >
                    <div className="mb-3 h-12 w-full overflow-hidden rounded-xl" style={{ background: preset.colors.background, border: `2px solid ${preset.colors.border}` }}>
                      <div className="flex h-full">
                        <div className="h-full w-2/3" style={{ background: preset.colors.background }} />
                        <div className="h-full w-1/3" style={{ background: preset.colors.primary }} />
                      </div>
                    </div>
                    <p className={`text-xs font-black ${selected ? 'text-stone-900' : 'text-foreground'}`}>{preset.name}</p>
                    <p className="mt-1 text-[11px] text-muted">{preset.description}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{preset.vibe}</p>
                  </button>
                )
              })}
            </div>
          </motion.section>

          {/* ── Generate ───────────────────────────────────────── */}
          <motion.div {...sm} className="flex flex-col items-center gap-4 pt-4">
            <button type="button" onClick={handleGenerate} disabled={loading}
              className="flex items-center gap-3 rounded-full bg-stone-900 px-12 py-4 text-base font-black text-white shadow-xl shadow-stone-900/20 transition hover:scale-105 hover:bg-stone-800 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Generating your site...</>
              ) : (
                <>✦ Generate Lookbook site</>
              )}
            </button>
            {loading && <p className="text-sm text-muted">AI is crafting your editorial copy and collection — about 15–20 seconds.</p>}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
