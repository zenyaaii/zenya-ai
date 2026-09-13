"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { COLLECTIVE_PRESETS } from '@/utils/collective/presets'
import type { CollectiveInput } from '@/utils/collective/input'
import type { CollectiveStylePresetId } from '@/utils/collective/types'
import ShopifyAffiliateCallout from '@/components/ShopifyAffiliateCallout'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'
import { useWizardDraft, clearWizardDraft } from '@/lib/useWizardDraft'
import WizardShell, {
  AddButton, Block, Card, Field, Grid, Handoff, Input, Notice, Presets, Review, Textarea, Toggle,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'

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
  collections: [{ id: uid(), name: '', tagline: '' }],
  price_min: '',
  price_max: '',
  price_avg: '',
  sustainability: false,
  shipping_perks: '',
  returns_policy: '',
  customer_count: '',
  review_count: '',
  review_rating: '4.9',
  style_preset: 'jade',
}

const CATEGORY_SUGGESTIONS = [
  'المنزل والمعيشة', 'الأزياء والملابس', 'الجمال والعناية بالبشرة', 'العافية', 'المطبخ والطعام',
  'الفن والمقتنيات', 'الإكسسوارات', 'الكتب والقرطاسية', 'الهواء الطلق والسفر', 'أساسيات التقنية',
]

export default function CollectiveWizardPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('collective', form, setForm)
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
  function updateCollection(id: string, patch: Partial<CollectionItem>) {
    setForm((prev) => ({ ...prev, collections: prev.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }
  function addCollection() {
    if (form.collections.length >= 6) return
    setForm((prev) => ({ ...prev, collections: [...prev.collections, { id: uid(), name: '', tagline: '' }] }))
  }
  function removeCollection(id: string) {
    if (form.collections.length <= 1) return
    setForm((prev) => ({ ...prev, collections: prev.collections.filter((c) => c.id !== id) }))
  }

  const currentCategories = form.categories.split(/[،,]/).map((s) => s.trim()).filter(Boolean)
  function toggleCategory(cat: string) {
    const next = currentCategories.includes(cat) ? currentCategories.filter((c) => c !== cat) : [...currentCategories, cat]
    update('categories', next.join('، '))
  }

  const validCollections = form.collections.filter((c) => c.name.trim().length >= 2)
  const storeChecks = [
    form.brand_name.trim().length >= 2, form.brand_tagline.trim().length >= 5,
    form.brand_description.trim().length >= 10, form.categories.trim().length >= 2,
  ]
  const required = [...storeChecks, validCollections.length >= 1]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'أدخل اسم متجرك أو علامتك.'
    if (form.brand_tagline.trim().length < 5) return 'أدخل شعارًا لمتجرك.'
    if (form.brand_description.trim().length < 10) return 'صِف متجرك (10 أحرف على الأقل).'
    if (form.categories.trim().length < 2) return 'أدخل فئة منتجات واحدة على الأقل.'
    if (validCollections.length < 1) return 'أضف تشكيلة واحدة على الأقل لتوليد المتجر.'
    return null
  }

  function buildPayload(): CollectiveInput {
    return {
      brand: { name: form.brand_name.trim(), tagline: form.brand_tagline.trim(), description: form.brand_description.trim() },
      categories: form.categories.split(/[\n,،]/).map((s) => s.trim()).filter(Boolean),
      collections: validCollections.map((c) => ({ name: c.name.trim(), tagline: c.tagline.trim() || undefined })),
      price_range: {
        min: form.price_min.trim() || undefined,
        max: form.price_max.trim() || undefined,
        average: form.price_avg.trim() || undefined,
      },
      curation_story: form.curation_story.trim() || undefined,
      sustainability: form.sustainability,
      shipping_perks: form.shipping_perks.trim() || undefined,
      returns_policy: form.returns_policy.trim() || undefined,
      social_proof: {
        review_count: form.review_count.trim() || undefined,
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        customer_count: form.customer_count.trim() || undefined,
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
      const genRes = await fetch('/api/generate-collective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

      const preset = COLLECTIVE_PRESETS.find((p) => p.id === form.style_preset) || COLLECTIVE_PRESETS[0]
      const saveRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: { business_type: 'collective', style_preset: form.style_preset, collective: genJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/collective'); return }
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('collective')
      router.push(`/preview/collective/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'store',
      title: 'متجرك',
      sub: 'الاسم والشعار وما يبيعه المتجر.',
      complete: storeChecks.every(Boolean),
      note: 'أكمل الاسم والشعار والوصف وفئة واحدة على الأقل.',
      body: (
        <Grid>
          <Field label="اسم المتجر" required>
            <Input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="مثلاً: نُخبة، المختارات، دار الشمال" />
          </Field>
          <Field label="الشعار" required>
            <Input value={form.brand_tagline} onChange={(e) => update('brand_tagline', e.target.value)} placeholder="مثلاً: منتقاة لحياة تُعاش بإتقان." />
          </Field>
          <Field label="وصف المتجر" required wide>
            <Textarea value={form.brand_description} onChange={(e) => update('brand_description', e.target.value)} placeholder="مثلاً: سوق منتقى متعدد العلامات للمنزل والخزانة والعافية — 400 منتج، كلٌّ منها مُختبَر." />
          </Field>
          <Field label="فئات المنتجات" required wide hint="مفصولة بفواصل، أو اختر من الاقتراحات أدناه.">
            <Input value={form.categories} onChange={(e) => update('categories', e.target.value)} placeholder="المنزل والمعيشة، الأزياء، الجمال، العافية" />
          </Field>
          <Block title="اقتراحات">
            <div className="zb-chips">
              {CATEGORY_SUGGESTIONS.map((cat) => {
                const on = currentCategories.includes(cat)
                return (
                  <button key={cat} type="button" className="zb-chip" data-on={on ? 'true' : undefined} aria-pressed={on} onClick={() => toggleCategory(cat)}>
                    {cat}
                  </button>
                )
              })}
            </div>
          </Block>
          <Field label="قصة الانتقاء" wide>
            <Textarea value={form.curation_story} onChange={(e) => update('curation_story', e.target.value)} placeholder="كيف تقرّر ما تعرضه؟ مثلاً: نشتري كل شيء بأنفسنا ولا نعرض إلا ما نشتريه ثانيةً." />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'collections',
      title: 'التشكيلات',
      sub: 'حتى تشكيلة واحدة تكفي — أضف حتى 6. سيكتب الذكاء الاصطناعي الشعارات ويبني شبكات المنتجات.',
      complete: validCollections.length >= 1,
      note: 'أضف تشكيلة واحدة على الأقل.',
      body: (
        <Grid>
          <Block>
            <div className="zb-list">
              {form.collections.map((c, i) => (
                <Card key={c.id} title={'التشكيلة ' + (i + 1)} onRemove={form.collections.length > 1 ? () => removeCollection(c.id) : undefined} removeLabel={'حذف التشكيلة ' + (i + 1)}>
                  <Grid>
                    <Field label="اسم التشكيلة">
                      <Input value={c.name} onChange={(e) => updateCollection(c.id, { name: e.target.value })} placeholder="غرفة المعيشة" />
                    </Field>
                    <Field label="شعار التشكيلة (اختياري)">
                      <Input value={c.tagline} onChange={(e) => updateCollection(c.id, { tagline: e.target.value })} placeholder="أشياء تعيش حولها." />
                    </Field>
                  </Grid>
                </Card>
              ))}
              {form.collections.length < 6 ? <AddButton onClick={addCollection}>أضف تشكيلة</AddButton> : null}
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'pricing',
      title: 'التسعير والمزايا',
      sub: 'نطاق الأسعار والشحن والإرجاع.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="نطاق السعر (الأدنى)">
            <Input value={form.price_min} onChange={(e) => update('price_min', e.target.value)} placeholder="مثلاً: 45$" />
          </Field>
          <Field label="نطاق السعر (الأعلى)">
            <Input value={form.price_max} onChange={(e) => update('price_max', e.target.value)} placeholder="مثلاً: 495$" />
          </Field>
          <Field label="الشحن">
            <Input value={form.shipping_perks} onChange={(e) => update('shipping_perks', e.target.value)} placeholder="مثلاً: مجاني فوق 150$، خلال 3 إلى 5 أيام" />
          </Field>
          <Field label="سياسة الإرجاع">
            <Input value={form.returns_policy} onChange={(e) => update('returns_policy', e.target.value)} placeholder="مثلاً: إرجاع مجاني خلال 14 يومًا" />
          </Field>
          <Block>
            <Toggle on={form.sustainability} onChange={(v) => update('sustainability', v)}>منتجات مُدقَّقة للاستدامة</Toggle>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'social',
      title: 'الدليل الاجتماعي',
      sub: 'يضيف تقييمات وأعداد عملاء إلى التصميم.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="عدد العملاء">
            <Input value={form.customer_count} onChange={(e) => update('customer_count', e.target.value)} placeholder="مثلاً: +28,000" />
          </Field>
          <Field label="عدد التقييمات">
            <Input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="مثلاً: +6,800 تقييم" />
          </Field>
          <Field label="متوسط التقييم">
            <Input value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="4.9" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'style',
      title: 'النمط البصري',
      sub: 'اختر المظهر. يمكنك تغييره لاحقًا.',
      complete: true,
      body: <Presets presets={COLLECTIVE_PRESETS} value={form.style_preset} onChange={(id) => update('style_preset', id as CollectiveStylePresetId)} />,
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
              { label: 'التشكيلات', value: validCollections.length },
              { label: 'النمط', value: COLLECTIVE_PRESETS.find((p) => p.id === form.style_preset)?.name ?? '—' },
            ]}
            recap={[
              { label: 'اسم المتجر', value: form.brand_name },
              { label: 'الشعار', value: form.brand_tagline },
              { label: 'الوصف', value: form.brand_description },
              { label: 'الفئات', value: form.categories },
              { label: 'التشكيلات', value: validCollections.map((c) => c.name).join('، ') },
            ]}
          >
            <Handoff title="جاهز لتوليد متجرك." body="يكتب الذكاء الاصطناعي النصوص ويبني التشكيلات وينسّق كتالوجك — نحو 15 إلى 20 ثانية، ثم ننقلك إلى المعاينة." />
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
        eyebrow="نُخبة · قالب الكتالوج"
        title="ابنِ متجرًا منتقى متعدد العلامات."
        sub="أخبرنا عن كتالوجك وتولّد زينيا واجهة متجر متعددة العلامات — واجهة رئيسية وتشكيلات والأكثر مبيعًا وقصة العلامة."
        ledeExtra={<div style={{ marginTop: '1.25rem' }}><ShopifyAffiliateCallout placement="theme_new_ecom_picker" variant="banner" /></div>}
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'جارٍ توليد متجرك…' : 'ولّد متجر نُخبة', slide: 'هيا بنا', onClick: startGenerate, busy: loading }}
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
