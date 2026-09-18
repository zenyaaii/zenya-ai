"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LOOKBOOK_PRESETS } from '@/utils/lookbook/presets'
import type { LookbookStylePresetId } from '@/utils/lookbook/types'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'
import { useWizardDraft, clearWizardDraft } from '@/lib/useWizardDraft'
import WizardShell, {
  AddButton, Block, Card, Field, Grid, Handoff, Input, Notice, Presets, Review, Select, Textarea, Toggle, Uploads,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'

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
  'إكسسوارات', 'أحذية', 'ملابس أطفال', 'أزياء زفاف', 'دينيم', 'تريكو', 'أخرى',
]

const PRODUCT_CATEGORIES = ['فساتين', 'قطع علوية', 'قطع سفلية', 'ملابس خارجية', 'تريكو', 'إكسسوارات', 'أحذية', 'حقائب', 'عبايات', 'ملابس رياضية', 'أخرى']

const SEASONS = ['ربيع/صيف 25', 'خريف/شتاء 25', 'ربيع/صيف 26', 'خريف/شتاء 26', 'ما قبل الخريف 2025', 'ريزورت 2025', 'أعياد 2025']

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
  products: [{ id: uid(), name: '', price: '', category: 'فساتين' }],
  brand_story: '',
  sustainability_focus: false,
  press_features: '',
  review_rating: '4.9',
  review_count: '',
  hero_image_url: '',
  gallery_image_urls: [],
  style_preset: 'noir',
}

export default function LookbookWizardPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('lookbook', form, setForm)
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
    setForm((p) => ({ ...p, [key]: value }))
  }
  function updateProduct(id: string, patch: Partial<Product>) {
    setForm((p) => ({ ...p, products: p.products.map((pr) => (pr.id === id ? { ...pr, ...patch } : pr)) }))
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

  const validProducts = form.products.filter((p) => p.name.trim().length >= 2)
  const brandChecks = [
    form.brand_name.trim().length >= 2, form.brand_tagline.trim().length >= 3, form.brand_category.trim().length >= 2,
    form.style_direction.trim().length >= 10, form.target_customer.trim().length >= 10,
  ]
  const required = [...brandChecks, validProducts.length >= 1]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم علامتك التجارية.'
    if (form.brand_tagline.trim().length < 3) return 'يرجى إدخال شعار.'
    if (form.brand_category.trim().length < 2) return 'يرجى اختيار فئة العلامة.'
    if (form.style_direction.trim().length < 10) return 'صِف توجّهك التصميمي (10 أحرف على الأقل).'
    if (form.target_customer.trim().length < 10) return 'صِف عميلك المستهدف (10 أحرف على الأقل).'
    if (validProducts.length < 1) return 'أضف منتجًا واحدًا على الأقل لملء اللوك بوك.'
    return null
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
      const payload = {
        brand: { name: form.brand_name.trim(), tagline: form.brand_tagline.trim(), category: form.brand_category.trim() },
        style_direction: form.style_direction.trim(),
        target_customer: form.target_customer.trim(),
        collection_name: form.collection_name.trim() || undefined,
        collection_season: form.collection_season.trim() || undefined,
        products: validProducts.map((p) => ({ name: p.name.trim(), price: p.price.trim() || undefined, category: p.category.trim() || undefined })),
        brand_story: form.brand_story.trim() || undefined,
        sustainability_focus: form.sustainability_focus,
        press_features: form.press_features.trim() || undefined,
        social_proof: {
          review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
          review_count: form.review_count.trim() || undefined,
        },
        visuals: {
          hero_image_url: form.hero_image_url.trim() || undefined,
          gallery_image_urls: form.gallery_image_urls.filter(Boolean).slice(0, 8),
        },
        style_preset: form.style_preset,
      }

      const genRes = await fetch('/api/generate-lookbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

      const preset = LOOKBOOK_PRESETS.find((p) => p.id === form.style_preset) || LOOKBOOK_PRESETS[0]
      const saveRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: form.gallery_image_urls.filter(Boolean),
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: { business_type: 'lookbook', style_preset: form.style_preset, lookbook: genJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/lookbook'); return }
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('lookbook')
      router.push(`/preview/lookbook/${saveJson.id}?created=1`)
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
      sub: 'الاسم والشعار ولمن تصمّم.',
      complete: brandChecks.every(Boolean),
      note: 'أكمل الاسم والشعار والفئة والعميل والتوجّه التصميمي.',
      body: (
        <Grid>
          <Field label="اسم العلامة" required>
            <Input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="مثلاً: وَقار، نُهى، صفاء" />
          </Field>
          <Field label="الشعار" required>
            <Input value={form.brand_tagline} onChange={(e) => update('brand_tagline', e.target.value)} placeholder="مثلاً: ارتدي ما يليق بك." />
          </Field>
          <Field label="فئة العلامة" required>
            <Select value={form.brand_category} onChange={(e) => update('brand_category', e.target.value)}>
              <option value="">اختر الفئة...</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="العميل المستهدف" required>
            <Input value={form.target_customer} onChange={(e) => update('target_customer', e.target.value)} placeholder="مثلاً: نساء محترفات بين 28 و45" />
          </Field>
          <Field label="التوجّه التصميمي" required wide>
            <Textarea value={form.style_direction} onChange={(e) => update('style_direction', e.target.value)} placeholder="مثلاً: فخامة محتشمة وعصرية — خطوط نظيفة وأقمشة طبيعية، أناقة خالدة لا موسمية." />
          </Field>
          <Field label="قصة العلامة" wide hint="سيستخدم الذكاء الاصطناعي هذا لكتابة قسم «قصتنا».">
            <Textarea rows={4} value={form.brand_story} onChange={(e) => update('brand_story', e.target.value)} placeholder="قصة البداية أو القيم التأسيسية أو ما يميّز العلامة." />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'collection',
      title: 'التشكيلة',
      sub: 'اسم التشكيلة وموسمها.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="اسم التشكيلة">
            <Input value={form.collection_name} onChange={(e) => update('collection_name', e.target.value)} placeholder="مثلاً: تشكيلة الوقار" />
          </Field>
          <Field label="الموسم">
            <Select value={form.collection_season} onChange={(e) => update('collection_season', e.target.value)}>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </Grid>
      ),
    },
    {
      id: 'products',
      title: 'المنتجات',
      sub: 'حتى منتج واحد يكفي — أضف حتى 8. ستظهر في اللوك بوك وشبكة الأكثر مبيعًا.',
      complete: validProducts.length >= 1,
      note: 'أضف منتجًا واحدًا على الأقل.',
      body: (
        <Grid>
          <Block>
            <div className="zb-list">
              {form.products.map((p, i) => (
                <Card key={p.id} title={'المنتج ' + (i + 1)} onRemove={form.products.length > 1 ? () => removeProduct(p.id) : undefined} removeLabel={'حذف المنتج ' + (i + 1)}>
                  <Grid>
                    <Field label="اسم المنتج" wide>
                      <Input value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} placeholder="عباية حريرية · عاجية" />
                    </Field>
                    <Field label="السعر">
                      <Input value={p.price} onChange={(e) => updateProduct(p.id, { price: e.target.value })} placeholder="245$" />
                    </Field>
                    <Field label="الفئة">
                      <Select value={p.category} onChange={(e) => updateProduct(p.id, { category: e.target.value })}>
                        {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </Field>
                  </Grid>
                </Card>
              ))}
              {form.products.length < 8 ? <AddButton onClick={addProduct}>أضف منتجًا آخر</AddButton> : null}
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'visuals',
      title: 'الأصول البصرية',
      sub: 'صورك التحريرية وصور المنتجات. تخطَّ أي خانة وسنملؤها بصورة بديلة منتقاة.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Block>
            <p className="zb-note">كل ما ترفعه يُحفَظ أيضًا في معرضك لإعادة استخدامه لاحقًا.</p>
            <ImageUploadField label="الصورة الرئيسية" value={form.hero_image_url} onChange={(url) => update('hero_image_url', url)} aspect="wide" helper="الصورة الكبيرة أعلى الصفحة." />
          </Block>
          <Block title="معرض اللوك بوك (حتى 8)">
            <Uploads>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <ImageUploadField key={'lg-' + i} value={form.gallery_image_urls[i] || ''} onChange={(url) => setGalleryAt(i, url)} aspect="square" />
              ))}
            </Uploads>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'credibility',
      title: 'المصداقية',
      sub: 'التقييمات والظهور الصحفي والاستدامة.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="عدد التقييمات">
            <Input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="مثلاً: +2,400 تقييم" />
          </Field>
          <Field label="متوسط التقييم">
            <Select value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)}>
              {['5.0', '4.9', '4.8', '4.7'].map((r) => <option key={r} value={r}>{r} ★</option>)}
            </Select>
          </Field>
          <Field label="ظهور في الصحافة" wide hint="مفصولة بفواصل. اتركها فارغة إن لم يكن لديك ظهور تذكره.">
            <Input value={form.press_features} onChange={(e) => update('press_features', e.target.value)} placeholder="مثلاً: ڤوغ العربية، هي، سيدتي" />
          </Field>
          <Block>
            <Toggle on={form.sustainability_focus} onChange={(v) => update('sustainability_focus', v)}>
              أبرِز الاستدامة / الإنتاج الأخلاقي في قصة العلامة
            </Toggle>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'style',
      title: 'النمط البصري',
      sub: 'اختر المظهر. يمكنك تغييره لاحقًا.',
      complete: true,
      body: <Presets presets={LOOKBOOK_PRESETS} value={form.style_preset} onChange={(id) => update('style_preset', id as LookbookStylePresetId)} />,
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
              { label: 'المنتجات', value: validProducts.length },
              { label: 'النمط', value: LOOKBOOK_PRESETS.find((p) => p.id === form.style_preset)?.name ?? '—' },
            ]}
            recap={[
              { label: 'اسم العلامة', value: form.brand_name },
              { label: 'الشعار', value: form.brand_tagline },
              { label: 'الفئة', value: form.brand_category },
              { label: 'العميل المستهدف', value: form.target_customer },
              { label: 'التوجّه التصميمي', value: form.style_direction },
              { label: 'التشكيلة', value: [form.collection_name, form.collection_season].filter(Boolean).join(' · ') },
              { label: 'المنتجات', value: validProducts.map((p) => p.name).join('، ') },
            ]}
          >
            <Handoff title="جاهز لتوليد موقع اللوك بوك." body="يصوغ الذكاء الاصطناعي نصوصك التحريرية وتشكيلتك — نحو 15 إلى 20 ثانية، ثم ننقلك إلى المعاينة." />
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
        eyebrow="لوك بوك · قالب الأزياء المحتشمة"
        title="ابنِ موقع أزياء فاخرًا."
        sub="أخبرنا عن علامتك وتشكيلتك. تولّد زينيا موقعًا تحريريًا كاملًا — واجهة رئيسية وشبكة لوك بوك ومتجر منتجات وقصة العلامة."
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'جارٍ توليد موقعك…' : 'ولّد موقع اللوك بوك', slide: 'هيا بنا', onClick: startGenerate, busy: loading }}
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
