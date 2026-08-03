"use client"

import { useEffect, useState } from 'react'
import { Icon } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { STUDIO_PRESETS } from '@/utils/studio/presets'
import type { StudioInput } from '@/utils/studio/input'
import type { StudioStylePresetId } from '@/utils/studio/types'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'
import { useWizardDraft, clearWizardDraft } from '@/lib/useWizardDraft'

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

function buildSampleForm(): Form {
  return {
    brand_name: 'صَنعة',
    brand_tagline: 'صُنع باليد. خُلق ليدوم.',
    brand_category: 'مفروشات حرفية',
    brand_founded: '2017',
    mission: 'نبني حجّةً ضد ثقافة الاستهلاك العابر — قطعةً يدويةً تلو الأخرى. كل قطعة مصنوعة لتعيش في البيت عقودًا، لا مواسم.',
    founder_story: 'بدأت «صَنعة» في شقة صغيرة حين ورث مؤسّسنا خالد مشغل الخزف عن جدّه. نفدت أول 200 قطعة في عطلة أسبوع واحدة. وبعد ثماني سنوات ما زلنا نعمل مع الفرن نفسه، والخزّافين أنفسهم، والقاعدة نفسها: إن لم تكن تستحق الاقتناء، فلن نصنعها.',
    values: [
      { id: uid(), title: 'بطء عن قصد', description: 'نرفض إطلاق أكثر من أربع تشكيلات سنويًا. الأشياء تأخذ وقتها لأنها تستحق الوقت.' },
      { id: uid(), title: 'مصدر صادق', description: 'كل مادة تعود إلى مشغل أو فرن أو مصنع باسمٍ معروف. لا سلاسل توريد غامضة.' },
      { id: uid(), title: 'صُنعت لتدوم بعدنا', description: 'نصمّم أشياء تُصلِحها بدل أن تستبدلها. ونبيع قطع الغيار إلى الأبد.' },
    ],
    process_description: 'كل قطعة تستغرق أسابيع. نزور كل مشغل، ونفحص كل دفعة، ونرفض كل ما ليس مثاليًا. لا أرضية مصنع — بل فرن في الريف، ومشغل صغير، وأتيليه متواضع.',
    process_steps: 'التوريد، التصميم، الصنع، الفحص، التغليف، الشحن',
    team_size: '9 أشخاص موزّعون على ثلاث ورش',
    press_features: 'The New York Times, Wallpaper*, Monocle, Vogue Living, Cereal',
    milestones: [
      { id: uid(), year: '2017', event: 'إطلاق أول تشكيلة من شقة صغيرة' },
      { id: uid(), year: '2019', event: 'افتتاح ورشة الفرن' },
      { id: uid(), year: '2022', event: 'ظهور ضمن قائمة Wallpaper للتصميم' },
      { id: uid(), year: '2024', event: 'القطعة الأربعون ألفًا في بيتٍ ما' },
    ],
    customer_count: '+42,000 قطعة في البيوت',
    repeat_rate: '82%',
    avg_rating: '4.97★',
    style_preset: 'ink',
  }
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
  'مفروشات حرفية', 'الأزياء والملابس', 'الجمال والعناية بالبشرة', 'الأطعمة والمشروبات',
  'الفن والمطبوعات', 'المجوهرات', 'الكتب والنشر', 'الهواء الطلق والمغامرة',
  'الأثاث والتصميم', 'الخزف والفخار', 'المنسوجات والكتّان', 'أخرى'
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function StudioWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('studio', form, setForm)
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
    if (form.brand_name.trim().length < 2) return 'أدخل اسم علامتك التجارية.'
    if (form.brand_tagline.trim().length < 5) return 'أدخل شعار العلامة.'
    if (form.brand_category.trim().length < 2) return 'اختر فئة العلامة.'
    if (form.mission.trim().length < 20) return 'صِف رسالتك (20 حرفًا على الأقل).'
    const validValues = form.values.filter((v) => v.title.trim().length >= 2)
    if (validValues.length < 1) return 'أضف قيمة جوهرية واحدة على الأقل.'
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
      const genRes = await fetch('/api/generate-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

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
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('studio')
      router.push(`/preview/studio/${saveJson.id}?created=1`)
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
        <div className="absolute -top-32 right-1/4 h-[600px] w-[600px] rounded-full bg-stone-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-[500px] w-[500px] -translate-x-1/3 rounded-full bg-amber-200/10 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/55 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <ExampleFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">ستوديو · قالب قصة العلامة</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            ابنِ صفحة قصة علامتك.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            أخبرنا قصتك وتصوغ زينيا صفحة علامة تحريرية فاخرة — واجهة بيان وغاية ورسالة المؤسّس وخط زمني وقيم وأسلوب عمل وفريق واقتباسات صحفية.
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
            <h2 className="mb-6 text-xl font-black text-foreground">1. علامتك التجارية</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">اسم العلامة *</label>
                <input
                  value={form.brand_name}
                  onChange={(e) => update('brand_name', e.target.value)}
                  placeholder="مثلاً: صَنعة، أصالة، دار الحِرَف"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الشعار *</label>
                <input
                  value={form.brand_tagline}
                  onChange={(e) => update('brand_tagline', e.target.value)}
                  placeholder="مثلاً: صُنع باليد. خُلق ليدوم."
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">الفئة *</label>
                <select
                  value={form.brand_category}
                  onChange={(e) => update('brand_category', e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                >
                  <option value="">اختر الفئة...</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">سنة التأسيس</label>
                <input
                  value={form.brand_founded}
                  onChange={(e) => update('brand_founded', e.target.value)}
                  placeholder="مثلاً: 2017"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">بيان الرسالة *</label>
                <textarea
                  value={form.mission}
                  onChange={(e) => update('mission', e.target.value)}
                  placeholder="مثلاً: نبني حجّةً ضد ثقافة الاستهلاك العابر — قطعةً يدويةً تلو الأخرى."
                  rows={3}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">قصة المؤسّس</label>
                <textarea
                  value={form.founder_story}
                  onChange={(e) => update('founder_story', e.target.value)}
                  placeholder="كيف بدأت العلامة؟ ما المشكلة التي كنت تحلّها؟ سيكتب الذكاء الاصطناعي رسالةً مؤثّرة من هذا."
                  rows={3}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Values ─────────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">2. القيم الجوهرية</h2>
              <span className="text-sm text-muted">{form.values.filter(v => v.title.trim()).length}/5</span>
            </div>
            <p className="mb-5 text-sm text-muted">ما الذي ترفض علامتك المساومة عليه؟ من 1 إلى 5 قيم.</p>
            <div className="space-y-3">
              {form.values.map((val, i) => (
                <div key={val.id} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={val.title}
                    onChange={(e) => updateValue(val.id, { title: e.target.value })}
                    placeholder={`القيمة ${i + 1}`}
                    className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                  />
                  <input
                    value={val.description}
                    onChange={(e) => updateValue(val.id, { description: e.target.value })}
                    placeholder="وصف موجز (اختياري)"
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
                + أضف قيمة
              </button>
            )}
          </motion.section>

          {/* ── Process & Timeline ─────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">3. أسلوب العمل والمحطّات</h2>
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">كيف تصنع أشياءك</label>
                <textarea
                  value={form.process_description}
                  onChange={(e) => update('process_description', e.target.value)}
                  placeholder="مثلاً: كل قطعة تستغرق أسابيع. نزور كل مشغل، ونفحص كل دفعة، ونرفض كل ما ليس مثاليًا."
                  rows={2}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">خطوات العمل</label>
                <input
                  value={form.process_steps}
                  onChange={(e) => update('process_steps', e.target.value)}
                  placeholder="التوريد، التصميم، الصنع, الفحص، الشحن (مفصولة بفواصل)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-4 block text-sm font-bold text-foreground">المحطّات البارزة (السنة + الحدث)</label>
                <div className="space-y-3">
                  {form.milestones.map((m, i) => (
                    <div key={m.id} className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                      <input
                        value={m.year}
                        onChange={(e) => updateMilestone(m.id, { year: e.target.value })}
                        placeholder="السنة"
                        className="rounded-xl border border-token bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                      />
                      <input
                        value={m.event}
                        onChange={(e) => updateMilestone(m.id, { event: e.target.value })}
                        placeholder={`مثلاً: افتتحنا أول ستوديو لنا`}
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
                    + أضف محطّة
                  </button>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── Credibility ────────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-2 text-xl font-black text-foreground">4. المصداقية</h2>
            <p className="mb-6 text-sm text-muted">الظهور الصحفي وحجم الفريق وأدلّة العملاء تبني الثقة.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-foreground">ظهور في الصحافة</label>
                <input
                  value={form.press_features}
                  onChange={(e) => update('press_features', e.target.value)}
                  placeholder="The New York Times, Wallpaper*, Monocle, Vogue Living... (مفصولة بفواصل)"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">حجم الفريق</label>
                <input
                  value={form.team_size}
                  onChange={(e) => update('team_size', e.target.value)}
                  placeholder="مثلاً: 9 أشخاص"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">القطع / المنتجات المباعة</label>
                <input
                  value={form.customer_count}
                  onChange={(e) => update('customer_count', e.target.value)}
                  placeholder="مثلاً: +42,000 قطعة في البيوت"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">نسبة العملاء المتكرّرين</label>
                <input
                  value={form.repeat_rate}
                  onChange={(e) => update('repeat_rate', e.target.value)}
                  placeholder="مثلاً: 82%"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">متوسط التقييم</label>
                <input
                  value={form.avg_rating}
                  onChange={(e) => update('avg_rating', e.target.value)}
                  placeholder="مثلاً: 4.97★"
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
                />
              </div>
            </div>
          </motion.section>

          {/* ── Style preset ───────────────────────────────────────── */}
          <motion.section {...sectionMotion} className="rounded-3xl border border-token bg-elevated/70 p-8 shadow-soft-md backdrop-blur-md">
            <h2 className="mb-6 text-xl font-black text-foreground">5. النمط البصري</h2>
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
              onClick={startGenerate}
              disabled={loading}
              className="flex items-center gap-3 rounded-full bg-gradient-to-r from-stone-800 to-stone-600 px-12 py-4 text-base font-black text-white shadow-xl shadow-stone-500/25 transition hover:scale-105 hover:shadow-stone-500/40 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <><Icon name="loading" size={16} animation="none" hover={false} className="animate-spin" /> جارٍ صياغة قصتك...</>
              ) : (
                <><Icon name="sparkles" size={16} animation="none" hover={false} /> ولّد صفحة علامة ستوديو</>
              )}
            </button>
            {loading && (
              <p className="text-sm text-muted">يكتب الذكاء الاصطناعي بيانك ورسالة المؤسّس وقيمك واقتباساتك الصحفية — نحو 15 إلى 20 ثانية.</p>
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
