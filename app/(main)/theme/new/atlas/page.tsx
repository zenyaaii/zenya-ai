"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import WizardShell, {
  AddButton, Block, Card, Field, Grid, Handoff, Input, Notice, Presets, Review, Select, Textarea, Toggle,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'

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
  features: [{ id: uid(), title: '', description: '' }],
  integrations: '',
  free_tier: true,
  pro_price: '49$ شهريًا',
  enterprise: true,
  user_count: '',
  review_rating: '4.9',
  review_count: '',
  notable_customers: '',
  style_preset: 'orbit',
}

const CATEGORY_OPTIONS = [
  'إدارة المشاريع', 'إدارة علاقات العملاء', 'التسويق', 'التحليلات', 'DevOps', 'الموارد البشرية والتوظيف',
  'المالية', 'دعم العملاء', 'المبيعات', 'الأتمتة', 'التواصل', 'الأمان',
  'البيانات / الذكاء الاصطناعي', 'التجارة الإلكترونية', 'التعليم', 'الرعاية الصحية', 'القانون', 'أخرى',
]

export default function AtlasWizardPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('atlas', form, setForm)
  const [loading, setLoading] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let cancelled = false
    // Guests can browse and fill the wizard; generation gates on auth (401 below).
    createClient().auth.getUser().then(() => { if (!cancelled) setAuthReady(true) })
    return () => { cancelled = true }
  }, [])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function updateFeature(id: string, patch: Partial<Feature>) {
    setForm((prev) => ({ ...prev, features: prev.features.map((f) => (f.id === id ? { ...f, ...patch } : f)) }))
  }
  function addFeature() {
    if (form.features.length >= 6) return
    setForm((prev) => ({ ...prev, features: [...prev.features, { id: uid(), title: '', description: '' }] }))
  }
  function removeFeature(id: string) {
    if (form.features.length <= 1) return
    setForm((prev) => ({ ...prev, features: prev.features.filter((f) => f.id !== id) }))
  }

  const validFeatures = form.features.filter((f) => f.title.trim().length >= 2)
  const checks = [
    form.brand_name.trim().length >= 2, form.brand_tagline.trim().length >= 5, form.brand_category.trim().length >= 2,
    form.target_audience.trim().length >= 10, form.problem_solved.trim().length >= 10,
  ]
  const required = [...checks, validFeatures.length >= 1]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم تطبيقك أو منتجك.'
    if (form.brand_tagline.trim().length < 5) return 'يرجى إدخال شعار أو عرض قيمة.'
    if (form.brand_category.trim().length < 2) return 'يرجى اختيار أو إدخال فئة المنتج.'
    if (form.target_audience.trim().length < 10) return 'صِف جمهورك المستهدف (10 أحرف على الأقل).'
    if (form.problem_solved.trim().length < 10) return 'صِف المشكلة الرئيسية التي تحلّها (10 أحرف على الأقل).'
    if (validFeatures.length < 1) return 'أضف ميزة واحدة على الأقل لتوليد الموقع.'
    return null
  }

  function buildPayload(): AtlasInput {
    return {
      brand: { name: form.brand_name.trim(), tagline: form.brand_tagline.trim(), category: form.brand_category.trim() },
      target_audience: form.target_audience.trim(),
      problem_solved: form.problem_solved.trim(),
      features: validFeatures.map((f) => ({ title: f.title.trim(), description: f.description.trim() || undefined })),
      integrations: form.integrations.trim()
        ? form.integrations.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
      pricing: { free_tier: form.free_tier, pro_price: form.pro_price.trim() || undefined, enterprise: form.enterprise },
      social_proof: {
        user_count: form.user_count.trim() || undefined,
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        notable_customers: form.notable_customers.trim() || undefined,
      },
      style_preset: form.style_preset,
    }
  }

  function fail(msg: string) {
    setError(msg)
    setErrorKey((k) => k + 1)
    const idx = steps.findIndex((s) => !s.optional && !s.complete)
    if (idx >= 0) setStep(idx)
  }

  function startGenerate() {
    const err = validate()
    if (err) return fail(err)
    if (!acked) { setDisclaimerOpen(true); return }
    void handleGenerate()
  }

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) return fail(err)
    setLoading(true)
    try {
      const payload = buildPayload()
      const genRes = await fetch('/api/generate-atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          content: { business_type: 'atlas', style_preset: form.style_preset, atlas: genJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/atlas'); return }
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('atlas')
      router.push(`/preview/atlas/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'product',
      title: 'منتجك',
      sub: 'ما المنتج، ولمن، وأي مشكلة يحلّ.',
      complete: checks.every(Boolean),
      note: 'أكمل الاسم والشعار والفئة والجمهور والمشكلة.',
      body: (
        <Grid>
          <Field label="اسم التطبيق / المنتج" required wide>
            <Input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="مثلاً: تدفّق، نُقطة، مدار" />
          </Field>
          <Field label="الشعار / عرض القيمة" required wide>
            <Input value={form.brand_tagline} onChange={(e) => update('brand_tagline', e.target.value)} placeholder="مثلاً: أطلِق أسرع، معًا." />
          </Field>
          <Field label="فئة المنتج" required>
            <Select value={form.brand_category} onChange={(e) => update('brand_category', e.target.value)}>
              <option value="">اختر الفئة...</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="الجمهور المستهدف" required>
            <Input value={form.target_audience} onChange={(e) => update('target_audience', e.target.value)} placeholder="مثلاً: فرق المنتجات في الشركات الناشئة" />
          </Field>
          <Field label="المشكلة الرئيسية التي تحلّها" required wide>
            <Textarea value={form.problem_solved} onChange={(e) => update('problem_solved', e.target.value)} placeholder="مثلاً: تهدر الفرق ساعات في الاجتماعات بدل البناء. نستبدل الفوضى بتخطيط مدعوم بالذكاء الاصطناعي." />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'features',
      title: 'المزايا الرئيسية',
      sub: 'حتى ميزة واحدة تكفي — أضف حتى 6. سيوسّع الذكاء الاصطناعي الأوصاف ويضيف الأيقونات تلقائيًا.',
      complete: validFeatures.length >= 1,
      note: 'أضف ميزة واحدة على الأقل.',
      body: (
        <Grid>
          <Block>
            <div className="zb-list">
              {form.features.map((f, i) => (
                <Card key={f.id} title={'الميزة ' + (i + 1)} onRemove={form.features.length > 1 ? () => removeFeature(f.id) : undefined} removeLabel={'حذف الميزة ' + (i + 1)}>
                  <Grid>
                    <Field label="اسم الميزة">
                      <Input value={f.title} onChange={(e) => updateFeature(f.id, { title: e.target.value })} placeholder="سجلّ تغييرات لحظي" />
                    </Field>
                    <Field label="وصف موجز (اختياري)">
                      <Input value={f.description} onChange={(e) => updateFeature(f.id, { description: e.target.value })} placeholder="سيكتبه الذكاء الاصطناعي إن تُرك فارغًا" />
                    </Field>
                  </Grid>
                </Card>
              ))}
              {form.features.length < 6 ? <AddButton onClick={addFeature}>أضف ميزة أخرى</AddButton> : null}
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'pricing',
      title: 'التكاملات والتسعير',
      sub: 'اتركها كما هي وسيختار الذكاء الاصطناعي قيمًا مناسبة لفئتك.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="شركاء التكامل" wide hint="مفصولة بفواصل. اتركها فارغة وسيختار الذكاء الاصطناعي قيمًا مناسبة.">
            <Input value={form.integrations} onChange={(e) => update('integrations', e.target.value)} placeholder="Slack, GitHub, Figma, Notion, Jira, Stripe" dir="ltr" />
          </Field>
          <Field label="سعر الباقة الاحترافية">
            <Input value={form.pro_price} onChange={(e) => update('pro_price', e.target.value)} placeholder="49$ شهريًا" />
          </Field>
          <Block title="الباقات">
            <div className="zb-chips">
              <Toggle on={form.free_tier} onChange={(v) => update('free_tier', v)}>تضمين باقة مجانية</Toggle>
              <Toggle on={form.enterprise} onChange={(v) => update('enterprise', v)}>تضمين باقة المؤسسات</Toggle>
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'social',
      title: 'الدليل الاجتماعي',
      sub: 'اختياري لكنه يجعل الموقع أكثر مصداقية بكثير.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="عدد المستخدمين">
            <Input value={form.user_count} onChange={(e) => update('user_count', e.target.value)} placeholder="مثلاً: +4,200 فريق" />
          </Field>
          <Field label="عدد التقييمات">
            <Input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="مثلاً: +500 تقييم" />
          </Field>
          <Field label="عملاء بارزون" wide hint="اتركها فارغة إن لم يكن لديك عملاء تذكرهم.">
            <Input value={form.notable_customers} onChange={(e) => update('notable_customers', e.target.value)} placeholder="مثلاً: Vercel, Stripe, Notion" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'style',
      title: 'النمط البصري',
      sub: 'اختر المظهر. يمكنك تغييره لاحقًا.',
      complete: true,
      body: <Presets presets={ATLAS_PRESETS} value={form.style_preset} onChange={(id) => update('style_preset', id as AtlasStylePresetId)} />,
    },
    {
      id: 'review',
      title: 'المراجعة',
      sub: 'كل ما ستبني عليه. راجعه قبل التوليد.',
      complete: required.every(Boolean),
      note: 'ينقص شيء مطلوب في خطوة سابقة.',
      body: (
        <Grid>
          <Review
            facts={[
              { label: 'الحقول المطلوبة', value: `${required.filter(Boolean).length} من ${required.length}` },
              { label: 'المزايا', value: validFeatures.length },
              { label: 'النمط', value: ATLAS_PRESETS.find((p) => p.id === form.style_preset)?.name ?? '—' },
            ]}
            recap={[
              { label: 'اسم المنتج', value: form.brand_name },
              { label: 'الشعار', value: form.brand_tagline },
              { label: 'الفئة', value: form.brand_category },
              { label: 'الجمهور', value: form.target_audience },
              { label: 'المشكلة', value: form.problem_solved },
              { label: 'المزايا', value: validFeatures.map((f) => f.title).join('، ') },
              { label: 'التكاملات', value: form.integrations },
            ]}
          >
            <Handoff title="جاهز لتوليد موقع أطلس." body="يصوغ الذكاء الاصطناعي نصوصك وتسعيرك وتخطيطك — نحو 15 إلى 20 ثانية، ثم ننقلك إلى المعاينة." />
          </Review>
        </Grid>
      ),
    },
  ]

  if (!authReady) {
    return <div className="grid min-h-[60vh] place-items-center text-[14.5px] font-medium text-[#56565a]">جارٍ التحميل…</div>
  }

  return (
    <>
      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <ExampleFillButton onFill={() => setForm(buildSampleForm())} />
      <WizardShell
        eyebrow="أطلس · قالب SaaS"
        title="ابنِ صفحة هبوط SaaS فاخرة."
        sub="أخبرنا عن منتجك وتولّد زينيا موقع SaaS متكاملًا مُحسَّنًا للتحويل — واجهة رئيسية ومزايا وتسعير وتكاملات وأسئلة شائعة."
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'جارٍ توليد موقعك…' : 'ولّد موقع أطلس', slide: 'هيا بنا', onClick: startGenerate, busy: loading }}
      />
      <AiContentDisclaimer
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        onConfirm={() => { setAcked(true); setDisclaimerOpen(false); void handleGenerate() }}
      />
      <GenerationOverlay open={loading} />
    </>
  )
}
