"use client"

import { useEffect, useState } from 'react'
import { Icon } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { ATLAS_PRESETS } from '@/utils/atlas/presets'
import type { AtlasInput } from '@/utils/atlas/input'
import type { AtlasStylePresetId } from '@/utils/atlas/types'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'
import { useWizardDraft, clearWizardDraft } from '@/lib/useWizardDraft'

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

function buildSampleForm(): Form {
  return {
    brand_name: 'تدفّق',
    brand_tagline: 'أداة المشاريع التي سيستخدمها فريقك فعلًا.',
    brand_category: 'إدارة المشاريع',
    target_audience: 'فرق المنتجات في الشركات الناشئة بمراحل التمويل A–C، من 10 إلى 80 شخصًا، يطلقون أسبوعيًا.',
    problem_solved: 'تهدر الفرق ساعات في إعادة كتابة تحديثات الحالة على Slack وJira وLinear. يجمع «تدفّق» كل إشارة — الالتزامات وطلبات الدمج وملفات التصميم — في خط زمني واحد، فيتوقّف مديرو المنتجات عن المطاردة ويتوقّف المهندسون عن الترجمة.',
    features: [
      { id: uid(), title: 'خارطة طريق مدعومة بالذكاء الاصطناعي', description: 'تخطيط بالسحب والإفلات يستمدّ السرعة الحقيقية من سجلّ Git.' },
      { id: uid(), title: 'سجلّ تغييرات لحظي', description: 'كل طلب دمج مُدمَج يُصنَّف تلقائيًا في ملاحظة إصدار موجّهة للعملاء.' },
      { id: uid(), title: 'اجتماعات يومية داخل Slack', description: 'اجتماعات يومية غير متزامنة داخل المحادثات — دون تطبيق إضافي.' },
      { id: uid(), title: 'مؤشّر صحّة السبرنت', description: 'رقم واحد يخبرك إن كان هذا السبرنت متعثّرًا قبل المراجعة.' },
      { id: uid(), title: 'الاعتماديات بين الفرق', description: 'اعرف من يعيق من، تلقائيًا، عبر الفرق والمستودعات.' },
    ],
    integrations: 'Slack, GitHub, Figma, Notion, Linear, Vercel, Sentry',
    free_tier: true,
    pro_price: '49$ شهريًا لكل مستخدم',
    enterprise: true,
    user_count: '+4,200 فريق',
    review_rating: '4.9',
    review_count: '+620 تقييم',
    notable_customers: 'Vercel, Stripe, Notion, Linear, Anthropic',
    style_preset: 'orbit',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_tagline: '',
  brand_category: '',
  target_audience: '',
  problem_solved: '',
  features: [
    { id: uid(), title: '', description: '' }
  ],
  integrations: '',
  free_tier: true,
  pro_price: '49$ شهريًا',
  enterprise: true,
  user_count: '',
  review_rating: '4.9',
  review_count: '',
  notable_customers: '',
  style_preset: 'orbit'
}

const CATEGORY_OPTIONS = [
  'إدارة المشاريع', 'إدارة علاقات العملاء', 'التسويق', 'التحليلات', 'DevOps', 'الموارد البشرية والتوظيف',
  'المالية', 'دعم العملاء', 'المبيعات', 'الأتمتة', 'التواصل', 'الأمان',
  'البيانات / الذكاء الاصطناعي', 'التجارة الإلكترونية', 'التعليم', 'الرعاية الصحية', 'القانون', 'أخرى'
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function AtlasWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('atlas', form, setForm)
  const [loading, setLoading] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      // Guests can browse and fill the wizard; the save/generate action gates on auth (401 handler below).
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
    if (form.features.length <= 1) return
    setForm((prev) => ({ ...prev, features: prev.features.filter((f) => f.id !== id) }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم تطبيقك أو منتجك.'
    if (form.brand_tagline.trim().length < 5) return 'يرجى إدخال شعار أو عرض قيمة.'
    if (form.brand_category.trim().length < 2) return 'يرجى اختيار أو إدخال فئة المنتج.'
    if (form.target_audience.trim().length < 10) return 'صِف جمهورك المستهدف (10 أحرف على الأقل).'
    if (form.problem_solved.trim().length < 10) return 'صِف المشكلة الرئيسية التي تحلّها (10 أحرف على الأقل).'
    const validFeatures = form.features.filter((f) => f.title.trim().length >= 2)
    if (validFeatures.length < 1) return 'أضف ميزة واحدة على الأقل لتوليد الموقع.'
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
      const genRes = await fetch('/api/generate-atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

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
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('atlas')
      router.push(`/preview/atlas/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">جارٍ التحميل...</div>
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

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <ExampleFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-600">أطلس · قالب SaaS</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            ابنِ صفحة هبوط SaaS فاخرة.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            أخبرنا عن منتجك وتولّد زينيا موقع SaaS متكاملًا مُحسَّنًا للتحويل — واجهة رئيسية ومزايا وتسعير وتكاملات وشهادات وأسئلة شائعة.
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
            <h2 className="mb-6 text-xl font-black text-foreground">1. منتجك</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">اسم التطبيق / المنتج *</label>
                <input
                  value={form.brand_name}
                  onChange={(e) => update('brand_name', e.target.value)}
                  placeholder="مثلاً: تدفّق، نُقطة، مدار"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">الشعار / عرض القيمة *</label>
                <input
                  value={form.brand_tagline}
                  onChange={(e) => update('brand_tagline', e.target.value)}
                  placeholder="مثلاً: أطلِق أسرع، معًا. / أداة المشاريع التي سيستخدمها فريقك فعلًا."
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">فئة المنتج *</label>
                <select
                  value={form.brand_category}
                  onChange={(e) => update('brand_category', e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                >
                  <option value="">اختر الفئة...</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الجمهور المستهدف *</label>
                <input
                  value={form.target_audience}
                  onChange={(e) => update('target_audience', e.target.value)}
                  placeholder="مثلاً: فرق المنتجات في الشركات الناشئة بمراحل A–C"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">المشكلة الرئيسية التي تحلّها *</label>
                <textarea
                  value={form.problem_solved}
                  onChange={(e) => update('problem_solved', e.target.value)}
                  placeholder="مثلاً: تهدر الفرق ساعات في الاجتماعات وJira بدل البناء. نستبدل الفوضى بتخطيط مدعوم بالذكاء الاصطناعي وتعاون لحظي."
                  rows={3}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Features ───────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">2. المزايا الرئيسية</h2>
              <span className="text-sm text-muted">{form.features.filter((f) => f.title.trim()).length}/6 ميزة</span>
            </div>
            <p className="mb-5 text-sm text-muted">حتى ميزة واحدة تكفي — أضف حتى 6. كلما أضفت أكثر، بدت الصفحة أغنى. سيوسّع الذكاء الاصطناعي الأوصاف ويضيف الأيقونات تلقائيًا.</p>
            <div className="space-y-3">
              {form.features.map((feat, i) => (
                <div key={feat.id} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={feat.title}
                    onChange={(e) => updateFeature(feat.id, { title: e.target.value })}
                    placeholder={`اسم الميزة ${i + 1}`}
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                  <input
                    value={feat.description}
                    onChange={(e) => updateFeature(feat.id, { description: e.target.value })}
                    placeholder="وصف موجز (اختياري — سيكتبه الذكاء الاصطناعي)"
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(feat.id)}
                    disabled={form.features.length <= 1}
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
                + أضف ميزة أخرى
              </button>
            )}
          </motion.section>

          {/* ── Integrations & Pricing ─────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">3. التكاملات والتسعير</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">شركاء التكامل</label>
                <input
                  value={form.integrations}
                  onChange={(e) => update('integrations', e.target.value)}
                  placeholder="Slack, GitHub, Figma, Notion, Jira, Stripe... (مفصولة بفواصل)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
                <p className="mt-1 text-xs text-muted">اتركها فارغة وسيختار الذكاء الاصطناعي قيمًا افتراضية مناسبة لفئتك.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">سعر الباقة الاحترافية</label>
                <input
                  value={form.pro_price}
                  onChange={(e) => update('pro_price', e.target.value)}
                  placeholder="49$ شهريًا"
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
                  <span className="text-sm font-semibold text-foreground">تضمين باقة مجانية</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enterprise}
                    onChange={(e) => update('enterprise', e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  <span className="text-sm font-semibold text-foreground">تضمين باقة المؤسسات</span>
                </label>
              </div>
            </div>
          </motion.section>

          {/* ── Social proof ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. الدليل الاجتماعي</h2>
            <p className="mb-6 text-sm text-muted">اختياري لكنه يجعل الموقع أكثر مصداقية بكثير.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">عدد المستخدمين</label>
                <input
                  value={form.user_count}
                  onChange={(e) => update('user_count', e.target.value)}
                  placeholder="مثلاً: +4,200 فريق"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">عدد التقييمات</label>
                <input
                  value={form.review_count}
                  onChange={(e) => update('review_count', e.target.value)}
                  placeholder="مثلاً: +500 تقييم"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">عملاء بارزون</label>
                <input
                  value={form.notable_customers}
                  onChange={(e) => update('notable_customers', e.target.value)}
                  placeholder="مثلاً: Vercel, Stripe, Notion (اتركها فارغة وسيولّد الذكاء الاصطناعي أسماء واقعية)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">5. النمط البصري</h2>
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
              onClick={startGenerate}
              disabled={loading}
              className="flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-12 py-4 text-base font-black text-white shadow-xl shadow-indigo-500/25 transition hover:scale-105 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Icon name="loading" size={16} animation="none" hover={false} className="animate-spin" /> جارٍ توليد موقعك...
                </>
              ) : (
                <>
                  <Icon name="sparkles" size={16} animation="none" hover={false} /> ولّد موقع أطلس
                </>
              )}
            </button>
            {loading && (
              <p className="text-sm text-muted">يصوغ الذكاء الاصطناعي نصوصك وتسعيرك وتخطيطك — يستغرق ذلك نحو 15 إلى 20 ثانية.</p>
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
