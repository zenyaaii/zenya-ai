"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { SERVICE_PRESETS } from '@/utils/services/presets'
import type { ServiceInput } from '@/utils/services/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'
import WizardShell, {
  AddButton, Block, Card, Field, Grid, Handoff, Input, Notice, Presets, Review, Textarea, Toggle, Uploads,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'

type Form = {
  brand_name: string
  category: string
  city: string
  region: string
  owner_name: string
  years_in_business: string
  phone: string
  email: string
  address: string
  emergency_service: boolean
  availability: string
  response_time: string
  services: Array<{ id: string; name: string; description: string; price_from: string; badge: string }>
  areas_served: string
  differentiators: string
  story_brief: string
  owner_title: string
  quote_seed: string
  hero_image_url: string
  team_image_url: string
  before_image_url: string
  after_image_url: string
  gallery_image_urls: string[]
  review_rating: string
  review_count: string
  licenses: string
  guarantees: string
  promo_offer: string
  style_preset: ServiceInput['style_preset']
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

function buildSampleForm(): Form {
  return {
    brand_name: 'إتقان لخدمات المنازل',
    category: 'السباكة والتكييف',
    city: 'الرياض',
    region: 'منطقة الرياض',
    owner_name: 'خالد العتيبي',
    years_in_business: '12 سنة',
    phone: '+966 11 555 0187',
    email: 'hello@itqan.sa',
    address: 'طريق الملك فهد، حي العليا، الرياض',
    emergency_service: true,
    availability: 'السبت–الخميس، 8 ص – 6 م',
    response_time: 'استجابة في نفس اليوم لمعظم مناطق الخدمة',
    services: [
      { id: newId(), name: 'إصلاح التسريبات الطارئ', description: 'نتعامل مع انفجار المواسير وطوارئ خطوط المياه خلال ساعتين، ليلًا أو نهارًا.', price_from: 'يبدأ من 129 ﷼', badge: 'على مدار الساعة' },
      { id: newId(), name: 'تركيب سخّانات المياه', description: 'تركيب سخّانات فورية وتقليدية بضمان 10 سنوات.', price_from: 'يبدأ من 1,490 ﷼', badge: 'الأكثر طلبًا' },
      { id: newId(), name: 'صيانة التكييف', description: 'فحص من 21 نقطة في الربيع أو الخريف ليعمل نظامك بأعلى كفاءة.', price_from: 'يبدأ من 89 ﷼', badge: 'موسمي' },
    ],
    areas_served: 'العليا\nالملقا\nحطين\nالنرجس\nالياسمين',
    differentiators: 'أسعار مقطوعة معلنة مسبقًا — دون مفاجآت\nفنّيون مرخّصون ومعتمدون\nخدمة في نفس اليوم عبر وسط الرياض\nضمان على جودة العمل لسنتين',
    story_brief: 'بدأت «إتقان» عام 2013 بشاحنة واحدة في شرق الرياض. نشأ خالد وهو يصلح الأشياء في مواقع عمل والده — وكانت القاعدة دائمًا «اتركه أنظف مما وجدته». وبعد اثنتي عشرة سنة، لا يزال ذلك معيارنا. نصل في الموعد، ونقدّم أسعارًا مقطوعة، ونعامل كل بيت كأنه بيتنا.',
    owner_title: 'المؤسّس وكبير الفنّيين',
    quote_seed: 'أسعار صادقة وعمل نظيف — هذا هو العمل كله.',
    hero_image_url: '',
    team_image_url: '',
    before_image_url: '',
    after_image_url: '',
    gallery_image_urls: [],
    review_rating: '4.9',
    review_count: '+320',
    licenses: 'رخصة سباكة احترافية رقم M-39817\nشهادة اعتماد فنّي',
    guarantees: 'ضمان على جودة العمل لسنتين\nرضا تام أو نعيد العمل',
    promo_offer: 'فحص مجاني مع أي عرض سعر للتركيب',
    style_preset: 'cobalt',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  category: '',
  city: '',
  region: '',
  owner_name: '',
  years_in_business: '',
  phone: '',
  email: '',
  address: '',
  emergency_service: false,
  availability: 'السبت–الخميس، 8 ص – 6 م',
  response_time: 'استجابة في نفس اليوم لمعظم مناطق الخدمة',
  services: [{ id: newId(), name: '', description: '', price_from: '', badge: '' }],
  areas_served: '',
  differentiators: '',
  story_brief: '',
  owner_title: '',
  quote_seed: '',
  hero_image_url: '',
  team_image_url: '',
  before_image_url: '',
  after_image_url: '',
  gallery_image_urls: [],
  review_rating: '4.9',
  review_count: '+200',
  licenses: '',
  guarantees: '',
  promo_offer: '',
  style_preset: 'cobalt',
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export default function ServicesWizardPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let cancelled = false
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new/services')
        return
      }
      setAuthReady(true)
    })
    return () => { cancelled = true }
  }, [router])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function updateService(id: string, patch: Partial<Form['services'][number]>) {
    setForm((prev) => ({ ...prev, services: prev.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))
  }
  function addService() {
    setForm((prev) => ({ ...prev, services: [...prev.services, { id: newId(), name: '', description: '', price_from: '', badge: '' }] }))
  }
  function removeService(id: string) {
    setForm((prev) => ({ ...prev, services: prev.services.filter((s) => s.id !== id) }))
  }
  function setGalleryAt(idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev.gallery_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, gallery_image_urls: next.filter(Boolean) }
    })
  }

  const validServices = form.services.filter((s) => s.name.trim().length >= 2)
  const ok = {
    basics: form.brand_name.trim().length >= 2 && form.category.trim().length >= 2 && form.city.trim().length >= 2,
    contact: form.phone.trim().length >= 4 && EMAIL_RE.test(form.email.trim()),
    services: validServices.length >= 1,
    story: form.story_brief.trim().length >= 20,
  }
  const required = [
    form.brand_name.trim().length >= 2, form.category.trim().length >= 2, form.city.trim().length >= 2,
    form.phone.trim().length >= 4, EMAIL_RE.test(form.email.trim()), validServices.length >= 1, form.story_brief.trim().length >= 20,
  ]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم النشاط التجاري.'
    if (form.category.trim().length < 2) return 'يرجى إدخال فئة الخدمة.'
    if (form.city.trim().length < 2) return 'يرجى إدخال المدينة الرئيسية.'
    if (form.phone.trim().length < 4) return 'يرجى إدخال رقم هاتف للتواصل.'
    if (!EMAIL_RE.test(form.email.trim())) return 'يرجى إدخال بريد إلكتروني صحيح.'
    if (form.story_brief.trim().length < 20) return 'أخبرنا المزيد عن قصة النشاط.'
    if (validServices.length < 1) return 'أضف خدمة واحدة على الأقل لتوليد الموقع.'
    return null
  }

  function buildPayload(): ServiceInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        category: form.category.trim(),
        city: form.city.trim(),
        region: form.region.trim() || undefined,
        owner_name: form.owner_name.trim() || undefined,
        years_in_business: form.years_in_business.trim() || undefined,
      },
      contact: {
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        emergency_service: form.emergency_service,
        availability: form.availability.trim() || undefined,
        response_time: form.response_time.trim() || undefined,
      },
      services: validServices.map((s) => ({
        name: s.name.trim(),
        description: s.description.trim() || undefined,
        price_from: s.price_from.trim() || undefined,
        badge: s.badge.trim() || undefined,
      })),
      areas_served: splitLines(form.areas_served).slice(0, 12),
      differentiators: splitLines(form.differentiators).slice(0, 8),
      story: {
        brief: form.story_brief.trim(),
        owner_title: form.owner_title.trim() || undefined,
        quote_seed: form.quote_seed.trim() || undefined,
      },
      visuals: {
        hero_image_url: form.hero_image_url.trim() || undefined,
        team_image_url: form.team_image_url.trim() || undefined,
        before_image_url: form.before_image_url.trim() || undefined,
        after_image_url: form.after_image_url.trim() || undefined,
        gallery_image_urls: form.gallery_image_urls.filter((url) => /^https?:\/\//.test(url)).slice(0, 8),
      },
      social_proof: {
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        licenses: splitLines(form.licenses).slice(0, 6),
        guarantees: splitLines(form.guarantees).slice(0, 6),
        promo_offer: form.promo_offer.trim() || undefined,
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
    setError(null)
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
      const generateRes = await fetch('/api/generate-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const generateJson = await generateRes.json()
      if (!generateRes.ok || !generateJson?.content) throw new Error(generateJson?.error || 'فشل التوليد')

      const preset = SERVICE_PRESETS.find((p) => p.id === form.style_preset) || SERVICE_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: { business_type: 'services', style_preset: form.style_preset, services: generateJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/services'); return }
      if (saveRes.status === 402) {
        toast({ type: 'warning', message: 'لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' })
        router.push('/pricing')
        return
      }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      router.push(`/preview/services/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما أثناء توليد موقعك.')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'basics',
      title: 'أساسيات النشاط',
      sub: 'ما نوع نشاط الخدمات المحلية هذا؟',
      complete: ok.basics,
      note: 'أدخل اسم النشاط وفئة الخدمة والمدينة.',
      body: (
        <Grid>
          <Field label="اسم النشاط" required>
            <Input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="إتقان لخدمات المنازل" />
          </Field>
          <Field label="فئة الخدمة" required>
            <Input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="سباكة، تكييف، صالون، تنظيف، وكالة..." />
          </Field>
          <Field label="المدينة" required>
            <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="الرياض" />
          </Field>
          <Field label="المنطقة">
            <Input value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="منطقة الرياض" />
          </Field>
          <Field label="اسم المالك / المسؤول">
            <Input value={form.owner_name} onChange={(e) => update('owner_name', e.target.value)} placeholder="خالد العتيبي" />
          </Field>
          <Field label="سنوات الخبرة">
            <Input value={form.years_in_business} onChange={(e) => update('years_in_business', e.target.value)} placeholder="12 سنة" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'contact',
      title: 'التواصل والتوفّر',
      sub: 'ما الذي ينبغي أن يعرفه العميل قبل الحجز؟',
      complete: ok.contact,
      note: 'أدخل رقم هاتف وبريدًا إلكترونيًا صحيحًا.',
      body: (
        <Grid>
          <Field label="الهاتف" required>
            <Input dir="ltr" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+966 11 555 0187" />
          </Field>
          <Field label="البريد الإلكتروني" required>
            <Input dir="ltr" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="hello@business.com" />
          </Field>
          <Field label="العنوان">
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="طريق الملك فهد، حي العليا، الرياض" />
          </Field>
          <Field label="سطر التوفّر">
            <Input value={form.availability} onChange={(e) => update('availability', e.target.value)} placeholder="السبت–الخميس، 8 ص – 6 م" />
          </Field>
          <Field label="سطر وقت الاستجابة">
            <Input value={form.response_time} onChange={(e) => update('response_time', e.target.value)} placeholder="استجابة في نفس اليوم لمعظم المناطق" />
          </Field>
          <Block>
            <Toggle on={form.emergency_service} onChange={(v) => update('emergency_service', v)}>
              يقدّم هذا النشاط خدمة طارئة أو عاجلة
            </Toggle>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'services',
      title: 'الخدمات',
      sub: 'حتى خدمة واحدة تكفي. أضف المزيد إن كنت تقدّمها — وسنحوّلها إلى قسم خدمات متكامل.',
      complete: ok.services,
      note: 'أضف خدمة واحدة على الأقل.',
      body: (
        <Grid>
          <Block>
            <div className="zb-list">
              {form.services.map((s, i) => (
                <Card key={s.id} title={'الخدمة ' + (i + 1)} onRemove={form.services.length > 1 ? () => removeService(s.id) : undefined} removeLabel={'حذف الخدمة ' + (i + 1)}>
                  <Grid>
                    <Field label="اسم الخدمة">
                      <Input value={s.name} onChange={(e) => updateService(s.id, { name: e.target.value })} placeholder="تركيب سخّانات المياه" />
                    </Field>
                    <Field label="يبدأ من / صيغة عرض السعر">
                      <Input value={s.price_from} onChange={(e) => updateService(s.id, { price_from: e.target.value })} placeholder="يبدأ من 129 ﷼" />
                    </Field>
                    <Field label="وصف موجز" wide>
                      <Input value={s.description} onChange={(e) => updateService(s.id, { description: e.target.value })} placeholder="وصف موجز مبدئي" />
                    </Field>
                    <Field label="شارة">
                      <Input value={s.badge} onChange={(e) => updateService(s.id, { badge: e.target.value })} placeholder="الأكثر طلبًا، استجابة سريعة..." />
                    </Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={addService}>أضف خدمة أخرى</AddButton>
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'trust',
      title: 'منطقة الخدمة والثقة',
      sub: 'كلها اختيارية — كلما أضفت أكثر، بدا الموقع أغنى.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="المناطق المخدومة" wide hint="واحدة في كل سطر.">
            <Textarea rows={4} value={form.areas_served} onChange={(e) => update('areas_served', e.target.value)} placeholder={'العليا\nالملقا\nحطين'} />
          </Field>
          <Field label="عوامل التميّز / نقاط الثقة" wide hint="واحدة في كل سطر.">
            <Textarea rows={4} value={form.differentiators} onChange={(e) => update('differentiators', e.target.value)} placeholder={'أسعار معلنة مسبقًا\nمرخّص ومؤمّن\nعمل نظيف ومتابعة سريعة'} />
          </Field>
          <Field label="الرخص / الشهادات" hint="واحدة في كل سطر.">
            <Textarea value={form.licenses} onChange={(e) => update('licenses', e.target.value)} />
          </Field>
          <Field label="الضمانات / الطمأنة" hint="واحدة في كل سطر.">
            <Textarea value={form.guarantees} onChange={(e) => update('guarantees', e.target.value)} />
          </Field>
          <Field label="متوسط التقييم">
            <Input value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="4.9" />
          </Field>
          <Field label="عدد التقييمات">
            <Input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="+320" />
          </Field>
          <Field label="عرض ترويجي" wide>
            <Input value={form.promo_offer} onChange={(e) => update('promo_offer', e.target.value)} placeholder="فحص مجاني مع عرض سعر التركيب" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'story',
      title: 'قصة النشاط',
      sub: 'بضع جمل تكفي. سنصقلها إلى نصوص موقع فاخرة.',
      complete: ok.story,
      note: 'أخبرنا المزيد عن قصة النشاط (20 حرفًا على الأقل).',
      body: (
        <Grid>
          <Field label="ملخّص القصة" required wide>
            <Textarea rows={5} value={form.story_brief} onChange={(e) => update('story_brief', e.target.value)} placeholder="كيف بدأ النشاط، وما الذي يقدّره العملاء أكثر، وما الذي يجعل التجربة مختلفة." />
          </Field>
          <Field label="لقب المالك">
            <Input value={form.owner_title} onChange={(e) => update('owner_title', e.target.value)} placeholder="المؤسّس" />
          </Field>
          <Field label="بذرة اقتباس">
            <Input value={form.quote_seed} onChange={(e) => update('quote_seed', e.target.value)} placeholder="اقتباس قصير يشبه كلام المالك" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'visuals',
      title: 'الأصول البصرية',
      sub: 'ارفع صورك الخاصة. تخطَّ أي خانة وسنملؤها بصور بديلة جميلة.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Block>
            <p className="zb-note">كل ما ترفعه هنا يُحفَظ في معرضك أيضًا، لتعيد استخدامه لاحقًا عند تعديل موقعك.</p>
            <ImageUploadField label="الصورة الرئيسية" value={form.hero_image_url} onChange={(url) => update('hero_image_url', url)} aspect="wide" helper="الصورة الكبيرة أعلى صفحتك." />
            <Uploads cols={2}>
              <ImageUploadField label="صورة الفريق" value={form.team_image_url} onChange={(url) => update('team_image_url', url)} aspect="square" />
              <ImageUploadField label="قبل" value={form.before_image_url} onChange={(url) => update('before_image_url', url)} aspect="square" helper="تُستخدَم في مقارنة قبل/بعد." />
              <ImageUploadField label="بعد" value={form.after_image_url} onChange={(url) => update('after_image_url', url)} aspect="square" helper="تُستخدَم في مقارنة قبل/بعد." />
            </Uploads>
          </Block>
          <Block title="المعرض (حتى 8)">
            <Uploads>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <ImageUploadField key={'g-' + i} value={form.gallery_image_urls[i] || ''} onChange={(url) => setGalleryAt(i, url)} aspect="square" />
              ))}
            </Uploads>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'style',
      title: 'النمط البصري',
      sub: 'اختر النمط الجاهز الأنسب لهذا النشاط المحلي.',
      complete: true,
      body: <Presets presets={SERVICE_PRESETS} value={form.style_preset} onChange={(id) => update('style_preset', id as Form['style_preset'])} />,
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
              { label: 'الخدمات', value: validServices.length },
              { label: 'النمط', value: SERVICE_PRESETS.find((p) => p.id === form.style_preset)?.name ?? '—' },
            ]}
            recap={[
              { label: 'اسم النشاط', value: form.brand_name },
              { label: 'فئة الخدمة', value: form.category },
              { label: 'المدينة', value: [form.city, form.region].filter(Boolean).join('، ') },
              { label: 'الهاتف', value: form.phone },
              { label: 'البريد الإلكتروني', value: form.email },
              { label: 'الخدمات', value: validServices.map((s) => s.name).join('، ') },
              { label: 'ملخّص القصة', value: form.story_brief },
            ]}
          >
            <Handoff title="جاهز لتوليد قالب الحِرَف." body="سنبني موقع الخدمات المحلية كاملًا وننقلك إلى المعاينة الحيّة." />
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
        eyebrow="قالب الخدمات المحلية · حِرَف"
        title="ابنِ موقع خدمات محلية عصريًا."
        sub="أخبرنا بأساسيات النشاط والخدمات التي تقدّمها ولماذا يثق بك العملاء. ستولّد زينيا بنية الموقع الكاملة والنصوص والأقسام."
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'جارٍ توليد موقعك…' : 'ولّد قالب الحِرَف', slide: 'هيا بنا', onClick: startGenerate, busy: loading }}
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

function splitLines(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter((item) => item.length > 0)
}
