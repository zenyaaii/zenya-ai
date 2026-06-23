"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { LOOKBOOK_PRESETS } from '@/utils/lookbook/presets'
import type { LookbookStylePresetId } from '@/utils/lookbook/types'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'

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
  'نسائي عصري', 'رجالي عصري', 'للجنسين',
  'فاخر / كوتور', 'ستريت وير', 'ملابس رياضية', 'عبايات', 'أوشحة وحجاب',
  'إكسسوارات', 'أحذية', 'ملابس أطفال', 'أزياء زفاف', 'دينيم', 'تريكو', 'أخرى'
]

const PRODUCT_CATEGORIES = ['فساتين', 'قطع علوية', 'قطع سفلية', 'ملابس خارجية', 'تريكو', 'إكسسوارات', 'أحذية', 'حقائب', 'عبايات', 'ملابس رياضية', 'أخرى']

function buildSampleForm(): Form {
  return {
    brand_name: 'وَقار',
    brand_tagline: 'ارتدي ما يليق بك.',
    brand_category: 'نسائي عصري',
    style_direction: 'فخامة محتشمة وعصرية. خطوط نظيفة وأقمشة طبيعية، أناقة خالدة لا موسمية. لوحة الألوان من درجات محايدة دافئة وعاجية وأخضر غابي عميق.',
    target_customer: 'نساء محترفات بين 28 و45 يقدّرن الجودة على الكمية ويردن خزانة من قطع أقل وأفضل.',
    collection_name: 'تشكيلة الوقار',
    collection_season: 'ربيع/صيف 25',
    products: [
      { id: uid(), name: 'عباية حريرية · عاجية', price: '345$', category: 'عبايات' },
      { id: uid(), name: 'بنطال كتّاني مفصّل', price: '245$', category: 'قطع سفلية' },
      { id: uid(), name: 'بليزر صوفي', price: '595$', category: 'ملابس خارجية' },
      { id: uid(), name: 'كنزة كشمير', price: '285$', category: 'تريكو' },
    ],
    brand_story: 'بدأت «وَقار» عام 2021 بسؤال واحد: لماذا لا تزال الخزانة المدروسة جيّدة الصنع نادرة؟ نعمل مباشرةً مع مشاغل صغيرة، ونشحن من ستوديو واحد، ولا نُقيم تخفيضات أبدًا — السعر هو السعر.',
    sustainability_focus: true,
    press_features: 'ڤوغ العربية، هي، سيدتي، الجميلة',
    review_rating: '4.9',
    review_count: '+2,400 تقييم',
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
  collection_season: 'ربيع/صيف 25',
  products: [
    { id: uid(), name: '', price: '', category: 'فساتين' }
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
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
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
    setForm((p) => ({ ...p, products: [...p.products, { id: uid(), name: '', price: '', category: 'أخرى' }] }))
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
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم علامتك التجارية.'
    if (form.brand_tagline.trim().length < 3) return 'يرجى إدخال شعار.'
    if (form.brand_category.trim().length < 2) return 'يرجى اختيار فئة العلامة.'
    if (form.style_direction.trim().length < 10) return 'صِف توجّهك التصميمي (10 أحرف على الأقل).'
    if (form.target_customer.trim().length < 10) return 'صِف عميلك المستهدف (10 أحرف على الأقل).'
    const validProducts = form.products.filter((p) => p.name.trim().length >= 2)
    if (validProducts.length < 1) return 'أضف منتجًا واحدًا على الأقل لملء اللوك بوك.'
    return null
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
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

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
      if (saveRes.status === 402) { alert('بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      router.push(`/preview/lookbook/${saveJson.id}?created=1`)
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-[400px] w-[400px] -translate-x-1/3 rounded-full bg-amber-100/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-stone-200/30 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sm} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">لوك بوك · قالب الأزياء المحتشمة</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            ابنِ موقع أزياء فاخرًا.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            أخبرنا عن علامتك وتشكيلتك. تولّد زينيا موقعًا تحريريًا كاملًا — واجهة رئيسية وشبكة لوك بوك ومتجر منتجات وقصة العلامة وجدار صحافة وتقييمات ونشرة بريدية.
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
            <h2 className="mb-6 text-xl font-black text-foreground">1. علامتك التجارية</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">اسم العلامة *</label>
                <input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="مثلاً: وَقار، نُهى، صفاء" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الشعار *</label>
                <input value={form.brand_tagline} onChange={(e) => update('brand_tagline', e.target.value)} placeholder="مثلاً: ارتدي ما يليق بك." className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">فئة العلامة *</label>
                <select value={form.brand_category} onChange={(e) => update('brand_category', e.target.value)} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20">
                  <option value="">اختر الفئة...</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">العميل المستهدف *</label>
                <input value={form.target_customer} onChange={(e) => update('target_customer', e.target.value)} placeholder="مثلاً: نساء محترفات بين 28 و45 يقدّرن الجودة على الكمية" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">التوجّه التصميمي *</label>
                <textarea value={form.style_direction} onChange={(e) => update('style_direction', e.target.value)} placeholder="مثلاً: فخامة محتشمة وعصرية — خطوط نظيفة وأقمشة طبيعية، أناقة خالدة لا موسمية. لوحة ألوان محايدة دافئة وعاجية وأخضر غابي." rows={3} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">قصة العلامة</label>
                <textarea value={form.brand_story} onChange={(e) => update('brand_story', e.target.value)} placeholder="أخبرنا قصة البداية أو القيم التأسيسية أو ما يميّز العلامة. سيستخدم الذكاء الاصطناعي هذا لكتابة قسم «قصتنا»." rows={4} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
            </div>
          </motion.section>

          {/* ── Collection ─────────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">2. التشكيلة</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">اسم التشكيلة</label>
                <input value={form.collection_name} onChange={(e) => update('collection_name', e.target.value)} placeholder="مثلاً: تشكيلة الوقار" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الموسم</label>
                <select value={form.collection_season} onChange={(e) => update('collection_season', e.target.value)} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20">
                  {['ربيع/صيف 25', 'خريف/شتاء 25', 'ربيع/صيف 26', 'خريف/شتاء 26', 'ما قبل الخريف 2025', 'ريزورت 2025', 'أعياد 2025'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </motion.section>

          {/* ── Products ───────────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">3. المنتجات</h2>
              <span className="text-sm text-muted">{form.products.filter((p) => p.name.trim()).length}/8</span>
            </div>
            <p className="mb-5 text-sm text-muted">حتى منتج واحد يكفي — أضف حتى 8. ستظهر في اللوك بوك وشبكة الأكثر مبيعًا.</p>
            <div className="space-y-3">
              {form.products.map((product, i) => (
                <div key={product.id} className="grid gap-3 sm:grid-cols-[2fr_1fr_1.2fr_auto]">
                  <input value={product.name} onChange={(e) => updateProduct(product.id, { name: e.target.value })} placeholder={`اسم المنتج ${i + 1}`} className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
                  <input value={product.price} onChange={(e) => updateProduct(product.id, { price: e.target.value })} placeholder="السعر (مثلاً: 245$)" className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
                  <select value={product.category} onChange={(e) => updateProduct(product.id, { category: e.target.value })} className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none">
                    {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => removeProduct(product.id)} disabled={form.products.length <= 1} className="flex h-10 w-10 items-center justify-center rounded-xl border border-token text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30">×</button>
                </div>
              ))}
            </div>
            {form.products.length < 8 && (
              <button type="button" onClick={addProduct} className="mt-4 text-sm font-semibold text-stone-600 hover:underline">
                + أضف منتجًا آخر
              </button>
            )}
          </motion.section>

          {/* ── Visual assets ──────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. الأصول البصرية</h2>
            <p className="mb-5 text-sm text-muted">ارفع صورك التحريرية وصور المنتجات — ستظهر في اللوك بوك وتُحفَظ أيضًا في معرضك لإعادة استخدامها لاحقًا. تخطَّ أي خانة وسنملؤها بصورة بديلة منتقاة.</p>
            <div className="grid gap-5">
              <ImageUploadField
                label="الصورة الرئيسية"
                value={form.hero_image_url}
                onChange={(url) => update('hero_image_url', url)}
                aspect="wide"
                helper="الصورة الكبيرة أعلى الصفحة."
              />
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">معرض اللوك بوك (حتى 8)</label>
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
            <h2 className="mb-6 text-xl font-black text-foreground">5. المصداقية</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">عدد التقييمات</label>
                <input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="مثلاً: +2,400 تقييم" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">متوسط التقييم</label>
                <select value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none">
                  {['5.0', '4.9', '4.8', '4.7'].map((r) => <option key={r} value={r}>{r} ★</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">ظهور في الصحافة</label>
                <input value={form.press_features} onChange={(e) => update('press_features', e.target.value)} placeholder="مثلاً: ڤوغ العربية، هي، سيدتي، الجميلة" className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none" />
                <p className="mt-1 text-xs text-muted">مفصولة بفواصل. اتركها فارغة وسيستخدم الذكاء الاصطناعي قيمًا افتراضية ملائمة للأزياء.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={form.sustainability_focus} onChange={(e) => update('sustainability_focus', e.target.checked)} className="h-4 w-4 rounded text-stone-600" />
                  <span className="text-sm font-semibold text-foreground">أبرِز الاستدامة / الإنتاج الأخلاقي في قصة العلامة</span>
                </label>
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────── */}
          <motion.section {...sm} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">6. النمط البصري</h2>
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
            <button type="button" onClick={startGenerate} disabled={loading}
              className="flex items-center gap-3 rounded-full bg-stone-900 px-12 py-4 text-base font-black text-white shadow-xl shadow-stone-900/20 transition hover:scale-105 hover:bg-stone-800 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> جارٍ توليد موقعك...</>
              ) : (
                <>✦ ولّد موقع اللوك بوك</>
              )}
            </button>
            {loading && <p className="text-sm text-muted">يصوغ الذكاء الاصطناعي نصوصك التحريرية وتشكيلتك — نحو 15 إلى 20 ثانية.</p>}
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
