"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import WizardShell, {
  AddButton, Block, Card, Field, Grid, Handoff, Input, Notice, Presets, Review, Select, Textarea,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'

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
    { id: uid(), title: '', description: '' },
  ],
  process_description: '',
  process_steps: '',
  team_size: '',
  press_features: '',
  milestones: [
    { id: uid(), year: '', event: '' },
    { id: uid(), year: '', event: '' },
  ],
  customer_count: '',
  repeat_rate: '',
  avg_rating: '4.9',
  style_preset: 'ink',
}

const CATEGORY_OPTIONS = [
  'مفروشات حرفية', 'الأزياء والملابس', 'الجمال والعناية بالبشرة', 'الأطعمة والمشروبات',
  'الفن والمطبوعات', 'المجوهرات', 'الكتب والنشر', 'الهواء الطلق والمغامرة',
  'الأثاث والتصميم', 'الخزف والفخار', 'المنسوجات والكتّان', 'أخرى',
]

export default function StudioWizardPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('studio', form, setForm)
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
  function updateValue(id: string, patch: Partial<ValueItem>) {
    setForm((prev) => ({ ...prev, values: prev.values.map((v) => (v.id === id ? { ...v, ...patch } : v)) }))
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
    setForm((prev) => ({ ...prev, milestones: prev.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }
  function addMilestone() {
    if (form.milestones.length >= 6) return
    setForm((prev) => ({ ...prev, milestones: [...prev.milestones, { id: uid(), year: '', event: '' }] }))
  }
  function removeMilestone(id: string) {
    if (form.milestones.length <= 1) return
    setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }))
  }

  const validValues = form.values.filter((v) => v.title.trim().length >= 2)
  const brandChecks = [
    form.brand_name.trim().length >= 2, form.brand_tagline.trim().length >= 5,
    form.brand_category.trim().length >= 2, form.mission.trim().length >= 20,
  ]
  const required = [...brandChecks, validValues.length >= 1]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'أدخل اسم علامتك التجارية.'
    if (form.brand_tagline.trim().length < 5) return 'أدخل شعار العلامة.'
    if (form.brand_category.trim().length < 2) return 'اختر فئة العلامة.'
    if (form.mission.trim().length < 20) return 'صِف رسالتك (20 حرفًا على الأقل).'
    if (validValues.length < 1) return 'أضف قيمة جوهرية واحدة على الأقل.'
    return null
  }

  function buildPayload(): StudioInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        tagline: form.brand_tagline.trim(),
        category: form.brand_category.trim(),
        founded: form.brand_founded.trim() || undefined,
      },
      mission: form.mission.trim(),
      founder_story: form.founder_story.trim() || undefined,
      values: validValues.map((v) => ({ title: v.title.trim(), description: v.description.trim() || undefined })),
      process: {
        description: form.process_description.trim() || undefined,
        steps: form.process_steps.trim() ? form.process_steps.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : undefined,
      },
      team_size: form.team_size.trim() || undefined,
      press_features: form.press_features.trim() || undefined,
      milestones: form.milestones.filter((m) => m.year.trim() && m.event.trim()).map((m) => ({ year: m.year.trim(), event: m.event.trim() })),
      social_proof: {
        customer_count: form.customer_count.trim() || undefined,
        repeat_rate: form.repeat_rate.trim() || undefined,
        avg_rating: form.avg_rating.trim() || undefined,
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
      const genRes = await fetch('/api/generate-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          content: { business_type: 'studio', style_preset: form.style_preset, studio: genJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/studio'); return }
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('studio')
      router.push(`/preview/studio/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'brand',
      title: 'علامتك التجارية',
      sub: 'الاسم والشعار والرسالة التي تقوم عليها العلامة.',
      complete: brandChecks.every(Boolean),
      note: 'أكمل الاسم والشعار والفئة وبيان الرسالة.',
      body: (
        <Grid>
          <Field label="اسم العلامة" required>
            <Input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="مثلاً: صَنعة، أصالة، دار الحِرَف" />
          </Field>
          <Field label="الشعار" required>
            <Input value={form.brand_tagline} onChange={(e) => update('brand_tagline', e.target.value)} placeholder="مثلاً: صُنع باليد. خُلق ليدوم." />
          </Field>
          <Field label="الفئة" required>
            <Select value={form.brand_category} onChange={(e) => update('brand_category', e.target.value)}>
              <option value="">اختر الفئة...</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="سنة التأسيس">
            <Input value={form.brand_founded} onChange={(e) => update('brand_founded', e.target.value)} placeholder="مثلاً: 2017" />
          </Field>
          <Field label="بيان الرسالة" required wide>
            <Textarea value={form.mission} onChange={(e) => update('mission', e.target.value)} placeholder="مثلاً: نبني حجّةً ضد ثقافة الاستهلاك العابر — قطعةً يدويةً تلو الأخرى." />
          </Field>
          <Field label="قصة المؤسّس" wide hint="سيكتب الذكاء الاصطناعي رسالةً مؤثّرة من هذا.">
            <Textarea rows={4} value={form.founder_story} onChange={(e) => update('founder_story', e.target.value)} placeholder="كيف بدأت العلامة؟ ما المشكلة التي كنت تحلّها؟" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'values',
      title: 'القيم الجوهرية',
      sub: 'ما الذي ترفض علامتك المساومة عليه؟ من 1 إلى 5 قيم.',
      complete: validValues.length >= 1,
      note: 'أضف قيمة جوهرية واحدة على الأقل.',
      body: (
        <Grid>
          <Block>
            <div className="zb-list">
              {form.values.map((v, i) => (
                <Card key={v.id} title={'القيمة ' + (i + 1)} onRemove={form.values.length > 1 ? () => removeValue(v.id) : undefined} removeLabel={'حذف القيمة ' + (i + 1)}>
                  <Grid>
                    <Field label="القيمة">
                      <Input value={v.title} onChange={(e) => updateValue(v.id, { title: e.target.value })} placeholder="بطء عن قصد" />
                    </Field>
                    <Field label="وصف موجز (اختياري)">
                      <Input value={v.description} onChange={(e) => updateValue(v.id, { description: e.target.value })} />
                    </Field>
                  </Grid>
                </Card>
              ))}
              {form.values.length < 5 ? <AddButton onClick={addValue}>أضف قيمة</AddButton> : null}
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'process',
      title: 'أسلوب العمل والمحطّات',
      sub: 'كيف تُصنع أشياؤك، وأبرز ما مرّت به العلامة.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="كيف تصنع أشياءك" wide>
            <Textarea value={form.process_description} onChange={(e) => update('process_description', e.target.value)} placeholder="مثلاً: كل قطعة تستغرق أسابيع. نزور كل مشغل، ونفحص كل دفعة." />
          </Field>
          <Field label="خطوات العمل" wide hint="مفصولة بفواصل.">
            <Input value={form.process_steps} onChange={(e) => update('process_steps', e.target.value)} placeholder="التوريد، التصميم، الصنع، الفحص، الشحن" />
          </Field>
          <Block title="المحطّات البارزة">
            <div className="zb-list">
              {form.milestones.map((m, i) => (
                <Card key={m.id} title={'المحطّة ' + (i + 1)} onRemove={form.milestones.length > 1 ? () => removeMilestone(m.id) : undefined} removeLabel={'حذف المحطّة ' + (i + 1)}>
                  <Grid>
                    <Field label="السنة">
                      <Input value={m.year} onChange={(e) => updateMilestone(m.id, { year: e.target.value })} placeholder="2019" />
                    </Field>
                    <Field label="الحدث">
                      <Input value={m.event} onChange={(e) => updateMilestone(m.id, { event: e.target.value })} placeholder="افتتحنا أول ستوديو لنا" />
                    </Field>
                  </Grid>
                </Card>
              ))}
              {form.milestones.length < 6 ? <AddButton onClick={addMilestone}>أضف محطّة</AddButton> : null}
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'credibility',
      title: 'المصداقية',
      sub: 'الظهور الصحفي وحجم الفريق وأدلّة العملاء تبني الثقة.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="ظهور في الصحافة" wide hint="مفصولة بفواصل.">
            <Input value={form.press_features} onChange={(e) => update('press_features', e.target.value)} placeholder="The New York Times, Wallpaper*, Monocle" />
          </Field>
          <Field label="حجم الفريق">
            <Input value={form.team_size} onChange={(e) => update('team_size', e.target.value)} placeholder="مثلاً: 9 أشخاص" />
          </Field>
          <Field label="القطع / المنتجات المباعة">
            <Input value={form.customer_count} onChange={(e) => update('customer_count', e.target.value)} placeholder="مثلاً: +42,000 قطعة في البيوت" />
          </Field>
          <Field label="نسبة العملاء المتكرّرين">
            <Input value={form.repeat_rate} onChange={(e) => update('repeat_rate', e.target.value)} placeholder="مثلاً: 82%" />
          </Field>
          <Field label="متوسط التقييم">
            <Input value={form.avg_rating} onChange={(e) => update('avg_rating', e.target.value)} placeholder="مثلاً: 4.9★" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'style',
      title: 'النمط البصري',
      sub: 'اختر المظهر. يمكنك تغييره لاحقًا.',
      complete: true,
      body: <Presets presets={STUDIO_PRESETS} value={form.style_preset} onChange={(id) => update('style_preset', id as StudioStylePresetId)} />,
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
              { label: 'القيم', value: validValues.length },
              { label: 'النمط', value: STUDIO_PRESETS.find((p) => p.id === form.style_preset)?.name ?? '—' },
            ]}
            recap={[
              { label: 'اسم العلامة', value: form.brand_name },
              { label: 'الشعار', value: form.brand_tagline },
              { label: 'الفئة', value: form.brand_category },
              { label: 'الرسالة', value: form.mission },
              { label: 'قصة المؤسّس', value: form.founder_story },
              { label: 'القيم', value: validValues.map((v) => v.title).join('، ') },
            ]}
          >
            <Handoff title="جاهز لصياغة صفحة علامتك." body="يكتب الذكاء الاصطناعي بيانك ورسالة المؤسّس وقيمك — نحو 15 إلى 20 ثانية، ثم ننقلك إلى المعاينة." />
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
        eyebrow="ستوديو · قالب قصة العلامة"
        title="ابنِ صفحة قصة علامتك."
        sub="أخبرنا قصتك وتصوغ زينيا صفحة علامة تحريرية — واجهة بيان ورسالة المؤسّس وخط زمني وقيم وأسلوب عمل."
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'جارٍ صياغة قصتك…' : 'ولّد صفحة علامة ستوديو', slide: 'هيا بنا', onClick: startGenerate, busy: loading }}
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
