"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { COLLECTIVE_PRESETS } from '@/utils/collective/presets'
import type { CollectiveInput } from '@/utils/collective/input'
import type { CollectiveStylePresetId } from '@/utils/collective/types'
import ShopifyAffiliateCallout from '@/components/ShopifyAffiliateCallout'
import DevFillButton from '@/components/DevFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'

function uid() { return Math.random().toString(36).slice(2, 9) }

type CollectionItem = { id: string; name: string; tagline: string }

type Form = {
  brand_name: string
  brand_tagline: string
  brand_description: string
  categories: string
  curation_story: string
  collections: CollectionItem[]
  price_min: string
  price_max: string
  price_avg: string
  sustainability: boolean
  shipping_perks: string
  returns_policy: string
  customer_count: string
  review_count: string
  review_rating: string
  style_preset: CollectiveStylePresetId
}

function buildSampleForm(): Form {
  return {
    brand_name: 'نُخبة',
    brand_tagline: 'منتقاة لحياة تُعاش بإتقان.',
    brand_description: 'واجهة متجر متعددة العلامات للمنزل والخزانة والعافية. 400 منتج، كلٌّ منها مُختبَر في ستوديونا قبل عرضه. نشتري ما نشتريه ثانيةً.',
    categories: 'المنزل والمعيشة، الأزياء والملابس، الجمال والعناية بالبشرة، العافية، المطبخ والطعام',
    curation_story: 'لا نقبل الطلبات المفتوحة. مرّتين سنويًا يزور فريقنا أكثر من 200 ستوديو ومشغل ومختبر حول العالم. وإن لم تصمد قطعة ستة أشهر من الاستخدام الشخصي، فلن تصل إلى المتجر.',
    collections: [
      { id: uid(), name: 'غرفة المعيشة', tagline: 'أشياء تعيش حولها.' },
      { id: uid(), name: 'الخزانة اليومية', tagline: 'خزانة صغيرة، منتقاة بعناية.' },
      { id: uid(), name: 'الحمّام والجسد', tagline: 'لساعات التمهّل.' },
      { id: uid(), name: 'المطبخ', tagline: 'أدوات تستحق مكانها.' },
    ],
    price_min: '45$',
    price_max: '895$',
    price_avg: '185$',
    sustainability: true,
    shipping_perks: 'شحن مجاني فوق 150$ · توصيل خلال 3 إلى 5 أيام',
    returns_policy: 'إرجاع مجاني خلال 14 يومًا، دون أسئلة',
    customer_count: '+28,000 أسرة',
    review_count: '+6,800 تقييم',
    review_rating: '4.9',
    style_preset: 'jade',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_tagline: '',
  brand_description: '',
  categories: '',
  curation_story: '',
  collections: [
    { id: uid(), name: '', tagline: '' }
  ],
  price_min: '',
  price_max: '',
  price_avg: '',
  sustainability: false,
  shipping_perks: '',
  returns_policy: '',
  customer_count: '',
  review_count: '',
  review_rating: '4.9',
  style_preset: 'jade'
}

const CATEGORY_SUGGESTIONS = [
  'المنزل والمعيشة', 'الأزياء والملابس', 'الجمال والعناية بالبشرة', 'العافية', 'المطبخ والطعام',
  'الفن والمقتنيات', 'الإكسسوارات', 'الكتب والقرطاسية', 'الهواء الطلق والسفر', 'أساسيات التقنية'
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function CollectiveWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push('/login?mode=signup&next=/theme/new/collective'); return }
      setAuthReady(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateCollection(id: string, patch: Partial<CollectionItem>) {
    setForm((prev) => ({ ...prev, collections: prev.collections.map((c) => c.id === id ? { ...c, ...patch } : c) }))
  }
  function addCollection() {
    if (form.collections.length >= 6) return
    setForm((prev) => ({ ...prev, collections: [...prev.collections, { id: uid(), name: '', tagline: '' }] }))
  }
  function removeCollection(id: string) {
    if (form.collections.length <= 1) return
    setForm((prev) => ({ ...prev, collections: prev.collections.filter((c) => c.id !== id) }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'أدخل اسم متجرك أو علامتك.'
    if (form.brand_tagline.trim().length < 5) return 'أدخل شعارًا لمتجرك.'
    if (form.brand_description.trim().length < 10) return 'صِف متجرك (10 أحرف على الأقل).'
    if (form.categories.trim().length < 2) return 'أدخل فئة منتجات واحدة على الأقل.'
    const validCols = form.collections.filter((c) => c.name.trim().length >= 2)
    if (validCols.length < 1) return 'أضف تشكيلة واحدة على الأقل لتوليد المتجر.'
    return null
  }

  function buildPayload(): CollectiveInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        tagline: form.brand_tagline.trim(),
        description: form.brand_description.trim()
      },
      categories: form.categories.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      collections: form.collections
        .filter((c) => c.name.trim().length >= 2)
        .map((c) => ({ name: c.name.trim(), tagline: c.tagline.trim() || undefined })),
      price_range: {
        min: form.price_min.trim() || undefined,
        max: form.price_max.trim() || undefined,
        average: form.price_avg.trim() || undefined
      },
      curation_story: form.curation_story.trim() || undefined,
      sustainability: form.sustainability,
      shipping_perks: form.shipping_perks.trim() || undefined,
      returns_policy: form.returns_policy.trim() || undefined,
      social_proof: {
        review_count: form.review_count.trim() || undefined,
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        customer_count: form.customer_count.trim() || undefined
      },
      style_preset: form.style_preset
    }
  }

  // Entry from the CTA: validate, then pass the AI-content honesty gate once.
  function startGenerate() {
    const err = validate()
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (!acked) { setDisclaimerOpen(true); return }
    void handleGenerate()
  }

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setLoading(true)
    try {
      const payload = buildPayload()
      const genRes = await fetch('/api/generate-collective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

      const preset = COLLECTIVE_PRESETS.find((p) => p.id === form.style_preset) || COLLECTIVE_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'collective',
            style_preset: form.style_preset,
            collective: genJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/collective'); return }
      if (saveRes.status === 402) { alert('بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      router.push(`/preview/collective/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">جارٍ التحميل...</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[600px] w-[600px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-violet-300/8 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/55 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">نُخبة · قالب الكتالوج</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            ابنِ متجرًا منتقى متعدد العلامات.
          </h1>
          <ShopifyAffiliateCallout
            placement="theme_new_ecom_picker"
            variant="banner"
            className="mt-6"
          />

          <p className="mt-3 max-w-2xl text-muted">
            أخبرنا عن كتالوجك وتولّد زينيا واجهة متجر فاخرة متعددة العلامات — واجهة رئيسية وتشكيلات ووافد جديد والأكثر مبيعًا وقصة العلامة وشهادات ونشرة بريدية.
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
            <h2 className="mb-6 text-xl font-black text-foreground">1. متجرك</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">اسم المتجر *</label>
                <input
                  value={form.brand_name}
                  onChange={(e) => update('brand_name', e.target.value)}
                  placeholder="مثلاً: نُخبة، المختارات، دار الشمال"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الشعار *</label>
                <input
                  value={form.brand_tagline}
                  onChange={(e) => update('brand_tagline', e.target.value)}
                  placeholder="مثلاً: منتقاة لحياة تُعاش بإتقان."
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">وصف المتجر *</label>
                <textarea
                  value={form.brand_description}
                  onChange={(e) => update('brand_description', e.target.value)}
                  placeholder="مثلاً: سوق منتقى متعدد العلامات للمنزل والخزانة والعافية — 400 منتج، كلٌّ منها مُختبَر."
                  rows={2}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">فئات المنتجات *</label>
                <input
                  value={form.categories}
                  onChange={(e) => update('categories', e.target.value)}
                  placeholder="المنزل والمعيشة، الأزياء، الجمال، العافية، المطبخ... (مفصولة بفواصل)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const current = form.categories ? form.categories.split(',').map(s => s.trim()) : []
                        if (!current.includes(cat)) update('categories', [...current, cat].join(', '))
                      }}
                      className="rounded-full border border-token bg-surface px-3 py-1 text-[11px] text-muted transition hover:border-emerald-400 hover:text-emerald-600"
                    >
                      + {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">قصة الانتقاء</label>
                <textarea
                  value={form.curation_story}
                  onChange={(e) => update('curation_story', e.target.value)}
                  placeholder="كيف تقرّر ما تعرضه؟ مثلاً: نشتري كل شيء بأنفسنا ولا نعرض إلا ما نشتريه ثانيةً فعلًا."
                  rows={2}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Collections ────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">2. التشكيلات</h2>
              <span className="text-sm text-muted">{form.collections.filter(c => c.name.trim()).length}/6</span>
            </div>
            <p className="mb-5 text-sm text-muted">حتى تشكيلة واحدة تكفي — أضف حتى 6. كلما أضفت أكثر، بدت واجهة المتجر أغنى. سيكتب الذكاء الاصطناعي الشعارات ويبني شبكات المنتجات تلقائيًا.</p>
            <div className="space-y-3">
              {form.collections.map((col, i) => (
                <div key={col.id} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={col.name}
                    onChange={(e) => updateCollection(col.id, { name: e.target.value })}
                    placeholder={`التشكيلة ${i + 1}`}
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <input
                    value={col.tagline}
                    onChange={(e) => updateCollection(col.id, { tagline: e.target.value })}
                    placeholder="شعار التشكيلة (اختياري)"
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeCollection(col.id)}
                    disabled={form.collections.length <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-token text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {form.collections.length < 6 && (
              <button type="button" onClick={addCollection} className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline">
                + أضف تشكيلة
              </button>
            )}
          </motion.section>

          {/* ── Pricing & Perks ────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">3. التسعير والمزايا</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">نطاق السعر (الأدنى)</label>
                <input
                  value={form.price_min}
                  onChange={(e) => update('price_min', e.target.value)}
                  placeholder="مثلاً: 45$"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">نطاق السعر (الأعلى)</label>
                <input
                  value={form.price_max}
                  onChange={(e) => update('price_max', e.target.value)}
                  placeholder="مثلاً: 495$"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الشحن</label>
                <input
                  value={form.shipping_perks}
                  onChange={(e) => update('shipping_perks', e.target.value)}
                  placeholder="مثلاً: مجاني فوق 150$، خلال 3 إلى 5 أيام"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">سياسة الإرجاع</label>
                <input
                  value={form.returns_policy}
                  onChange={(e) => update('returns_policy', e.target.value)}
                  placeholder="مثلاً: إرجاع مجاني خلال 14 يومًا"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.sustainability}
                    onChange={(e) => update('sustainability', e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  <span className="text-sm font-semibold text-foreground">منتجات مُدقَّقة للاستدامة</span>
                </label>
              </div>
            </div>
          </motion.section>

          {/* ── Social proof ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. الدليل الاجتماعي</h2>
            <p className="mb-6 text-sm text-muted">اختياري — يضيف تقييمات وأعداد عملاء إلى التصميم.</p>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">عدد العملاء</label>
                <input
                  value={form.customer_count}
                  onChange={(e) => update('customer_count', e.target.value)}
                  placeholder="مثلاً: +28,000"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">عدد التقييمات</label>
                <input
                  value={form.review_count}
                  onChange={(e) => update('review_count', e.target.value)}
                  placeholder="مثلاً: +6,800 تقييم"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">متوسط التقييم</label>
                <input
                  value={form.review_rating}
                  onChange={(e) => update('review_rating', e.target.value)}
                  placeholder="4.9"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">5. النمط البصري</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {COLLECTIVE_PRESETS.map((preset) => {
                const selected = form.style_preset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => update('style_preset', preset.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/5' : 'border-token bg-surface hover:border-emerald-300'
                    }`}
                  >
                    <div className="mb-3 h-10 w-full overflow-hidden rounded-xl ring-1 ring-black/5" style={{ background: preset.colors.gradient }} />
                    <p className={`text-xs font-black ${selected ? 'text-emerald-600' : 'text-foreground'}`}>{preset.name}</p>
                    <p className="mt-1 text-[11px] text-muted">{preset.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: selected ? preset.colors.primary : '#94a3b8' }}>
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
              onClick={startGenerate}
              disabled={loading}
              className="flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-12 py-4 text-base font-black text-white shadow-xl shadow-emerald-500/25 transition hover:scale-105 hover:shadow-emerald-500/40 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> جارٍ توليد متجرك...</>
              ) : (
                <>✦ ولّد متجر نُخبة</>
              )}
            </button>
            {loading && (
              <p className="text-sm text-muted">يكتب الذكاء الاصطناعي النصوص ويبني التشكيلات ويُنسّق كتالوجك — نحو 15 إلى 20 ثانية.</p>
            )}
          </motion.div>
        </div>
      </main>

      <AiContentDisclaimer
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        onConfirm={() => { setAcked(true); setDisclaimerOpen(false); void handleGenerate() }}
      />
      <GenerationOverlay open={loading} />
    </div>
  )
}
