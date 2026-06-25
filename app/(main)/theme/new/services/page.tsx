"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { SERVICE_PRESETS } from '@/utils/services/presets'
import type { ServiceInput } from '@/utils/services/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'

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
  booking_url: string
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
    booking_url: 'https://book.itqan.sa',
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
  booking_url: '',
  emergency_service: false,
  availability: 'السبت–الخميس، 8 ص – 6 م',
  response_time: 'استجابة في نفس اليوم لمعظم مناطق الخدمة',
  services: [
    { id: newId(), name: '', description: '', price_from: '', badge: '' }
  ],
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
  style_preset: 'cobalt'
}

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

export default function ServicesWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new/services')
        return
      }
      setAuthReady(true)
    }
    checkAuth()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateService(id: string, patch: Partial<Form['services'][number]>) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((service) => (service.id === id ? { ...service, ...patch } : service))
    }))
  }

  function addService() {
    setForm((prev) => ({
      ...prev,
      services: [...prev.services, { id: newId(), name: '', description: '', price_from: '', badge: '' }]
    }))
  }

  function removeService(id: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== id)
    }))
  }

  function setGalleryAt(idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev.gallery_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, gallery_image_urls: next.filter(Boolean) }
    })
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم النشاط التجاري.'
    if (form.category.trim().length < 2) return 'يرجى إدخال فئة الخدمة.'
    if (form.city.trim().length < 2) return 'يرجى إدخال المدينة الرئيسية.'
    if (form.phone.trim().length < 4) return 'يرجى إدخال رقم هاتف للتواصل.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'يرجى إدخال بريد إلكتروني صحيح.'
    if (form.story_brief.trim().length < 20) return 'أخبرنا المزيد عن قصة النشاط.'

    const validServices = form.services.filter((service) => service.name.trim().length >= 2)
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
        years_in_business: form.years_in_business.trim() || undefined
      },
      contact: {
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        booking_url: form.booking_url.trim() || undefined,
        emergency_service: form.emergency_service,
        availability: form.availability.trim() || undefined,
        response_time: form.response_time.trim() || undefined
      },
      services: form.services
        .filter((service) => service.name.trim().length >= 2)
        .map((service) => ({
          name: service.name.trim(),
          description: service.description.trim() || undefined,
          price_from: service.price_from.trim() || undefined,
          badge: service.badge.trim() || undefined
        })),
      areas_served: splitLines(form.areas_served).slice(0, 12),
      differentiators: splitLines(form.differentiators).slice(0, 8),
      story: {
        brief: form.story_brief.trim(),
        owner_title: form.owner_title.trim() || undefined,
        quote_seed: form.quote_seed.trim() || undefined
      },
      visuals: {
        hero_image_url: form.hero_image_url.trim() || undefined,
        team_image_url: form.team_image_url.trim() || undefined,
        before_image_url: form.before_image_url.trim() || undefined,
        after_image_url: form.after_image_url.trim() || undefined,
        gallery_image_urls: form.gallery_image_urls.filter((url) => /^https?:\/\//.test(url)).slice(0, 8)
      },
      social_proof: {
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        licenses: splitLines(form.licenses).slice(0, 6),
        guarantees: splitLines(form.guarantees).slice(0, 6),
        promo_offer: form.promo_offer.trim() || undefined
      },
      style_preset: form.style_preset
    }
  }

  // Entry point from the CTA: validate, then make the user pass the honesty
  // gate once before the build runs.
  function startGenerate() {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!acked) { setDisclaimerOpen(true); return }
    void handleGenerate()
  }

  async function handleGenerate() {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload()
      const generateRes = await fetch('/api/generate-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const generateJson = await generateRes.json()
      if (!generateRes.ok || !generateJson?.content) {
        throw new Error(generateJson?.error || 'فشل التوليد')
      }

      const preset = SERVICE_PRESETS.find((item) => item.id === form.style_preset) || SERVICE_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'services',
            style_preset: form.style_preset,
            services: generateJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) {
        router.push('/login?mode=signup&next=/theme/new/services')
        return
      }
      if (saveRes.status === 402) {
        alert('لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.')
        router.push('/pricing')
        return
      }
      if (!saveRes.ok || !saveJson?.id) {
        throw new Error(saveJson?.error || 'فشل الحفظ')
      }
      router.push(`/preview/services/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما أثناء توليد موقعك.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">جارٍ التحميل...</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[560px] w-[560px] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[520px] w-[520px] translate-x-1/4 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[520px] w-[520px] -translate-x-1/4 translate-y-1/4 rounded-full bg-amber-300/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/50 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <ExampleFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-700">قالب الخدمات المحلية · حِرَف</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            ابنِ موقع خدمات محلية عصريًا.
          </h1>
          <p className="mt-3 max-w-3xl text-muted">
            أخبرنا بأساسيات النشاط والخدمات التي تقدّمها ولماذا يثق بك العملاء. ستولّد زينيا بنية الموقع الكاملة والنصوص والأقسام لعلامة خدمات محلية فاخرة.
          </p>
        </motion.div>

        {error && (
          <div className="mb-8 rounded-3xl border border-red-300 bg-red-50/85 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <Section title="أساسيات النشاط" subtitle="ما نوع نشاط الخدمات المحلية هذا؟">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم النشاط" required>
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="إتقان لخدمات المنازل" />
            </Field>
            <Field label="فئة الخدمة" required>
              <input className={inputCls} value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="سباكة، تكييف، صالون، تنظيف، وكالة..." />
            </Field>
            <Field label="المدينة" required>
              <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="الرياض" />
            </Field>
            <Field label="المنطقة">
              <input className={inputCls} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="منطقة الرياض" />
            </Field>
            <Field label="اسم المالك / المسؤول">
              <input className={inputCls} value={form.owner_name} onChange={(e) => update('owner_name', e.target.value)} placeholder="خالد العتيبي" />
            </Field>
            <Field label="سنوات الخبرة">
              <input className={inputCls} value={form.years_in_business} onChange={(e) => update('years_in_business', e.target.value)} placeholder="12 سنة" />
            </Field>
          </div>
        </Section>

        <Section title="التواصل والتوفّر" subtitle="ما الذي ينبغي أن يعرفه العميل قبل الحجز؟">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الهاتف" required>
              <input className={inputCls} dir="ltr" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+966 11 555 0187" />
            </Field>
            <Field label="البريد الإلكتروني" required>
              <input className={inputCls} dir="ltr" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="hello@business.com" />
            </Field>
            <Field label="العنوان">
              <input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="طريق الملك فهد، حي العليا، الرياض" />
            </Field>
            <Field label="رابط الحجز / الجدولة">
              <input className={inputCls} dir="ltr" value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="سطر التوفّر">
              <input className={inputCls} value={form.availability} onChange={(e) => update('availability', e.target.value)} placeholder="السبت–الخميس، 8 ص – 6 م" />
            </Field>
            <Field label="سطر وقت الاستجابة">
              <input className={inputCls} value={form.response_time} onChange={(e) => update('response_time', e.target.value)} placeholder="استجابة في نفس اليوم لمعظم المناطق" />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-foreground">
            <input type="checkbox" checked={form.emergency_service} onChange={(e) => update('emergency_service', e.target.checked)} />
            يقدّم هذا النشاط خدمة طارئة أو عاجلة.
          </label>
        </Section>

        <Section title="الخدمات" subtitle="حتى خدمة واحدة تكفي. أضف المزيد إن كنت تقدّمها — وسنحوّلها إلى قسم خدمات متكامل.">
          <div className="space-y-5">
            {form.services.map((service, index) => (
              <div key={service.id} className="rounded-3xl border border-token bg-elevated/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-muted">الخدمة 0{index + 1}</p>
                  {form.services.length > 1 && (
                    <button type="button" onClick={() => removeService(service.id)} className="rounded-full border border-token px-3 py-1 text-xs font-semibold text-muted transition hover:text-red-600">
                      إزالة
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={service.name} onChange={(e) => updateService(service.id, { name: e.target.value })} placeholder="اسم الخدمة" />
                  <input className={inputCls} value={service.price_from} onChange={(e) => updateService(service.id, { price_from: e.target.value })} placeholder="يبدأ من / صيغة عرض السعر" />
                  <input className={inputCls + ' sm:col-span-2'} value={service.description} onChange={(e) => updateService(service.id, { description: e.target.value })} placeholder="وصف موجز مبدئي" />
                  <input className={inputCls} value={service.badge} onChange={(e) => updateService(service.id, { badge: e.target.value })} placeholder="شارة (الأكثر طلبًا، استجابة سريعة...)" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addService} className="w-full rounded-2xl border-2 border-dashed border-token py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground">
              + أضف خدمة أخرى
            </button>
          </div>
        </Section>

        <Section title="منطقة الخدمة والثقة" subtitle="كلها اختيارية — كلما أضفت أكثر، بدا الموقع أغنى.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المناطق المخدومة (اختياري — أكثر = أفضل)" className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[110px] resize-y'} value={form.areas_served} onChange={(e) => update('areas_served', e.target.value)} placeholder="واحدة في كل سطر&#10;العليا&#10;الملقا&#10;حطين" />
            </Field>
            <Field label="عوامل التميّز / نقاط الثقة (اختياري — أكثر = أفضل)" className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[120px] resize-y'} value={form.differentiators} onChange={(e) => update('differentiators', e.target.value)} placeholder="واحدة في كل سطر&#10;أسعار معلنة مسبقًا&#10;مرخّص ومؤمّن&#10;عمل نظيف ومتابعة سريعة" />
            </Field>
            <Field label="الرخص / الشهادات">
              <textarea className={inputCls + ' min-h-[90px] resize-y'} value={form.licenses} onChange={(e) => update('licenses', e.target.value)} placeholder="واحدة في كل سطر" />
            </Field>
            <Field label="الضمانات / الطمأنة">
              <textarea className={inputCls + ' min-h-[90px] resize-y'} value={form.guarantees} onChange={(e) => update('guarantees', e.target.value)} placeholder="واحدة في كل سطر" />
            </Field>
            <Field label="متوسط التقييم">
              <input className={inputCls} value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="4.9" />
            </Field>
            <Field label="عدد التقييمات">
              <input className={inputCls} value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="+320" />
            </Field>
            <Field label="عرض ترويجي">
              <input className={inputCls} value={form.promo_offer} onChange={(e) => update('promo_offer', e.target.value)} placeholder="فحص مجاني مع عرض سعر التركيب" />
            </Field>
          </div>
        </Section>

        <Section title="قصة النشاط" subtitle="بضع جمل تكفي. سنصقلها إلى نصوص موقع فاخرة.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ملخّص القصة" required className="sm:col-span-2">
              <textarea className={inputCls + ' min-h-[140px] resize-y'} value={form.story_brief} onChange={(e) => update('story_brief', e.target.value)} placeholder="كيف بدأ النشاط، وما الذي يقدّره العملاء أكثر، وما الذي يجعل التجربة مختلفة." />
            </Field>
            <Field label="لقب المالك">
              <input className={inputCls} value={form.owner_title} onChange={(e) => update('owner_title', e.target.value)} placeholder="المؤسّس" />
            </Field>
            <Field label="بذرة اقتباس">
              <input className={inputCls} value={form.quote_seed} onChange={(e) => update('quote_seed', e.target.value)} placeholder="اقتباس قصير يشبه كلام المالك" />
            </Field>
          </div>
        </Section>

        <Section title="الأصول البصرية" subtitle="ارفع صورك الخاصة. تخطَّ أي خانة وسنملؤها بصور بديلة جميلة.">
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl border border-token bg-elevated/60 p-4 backdrop-blur-md"
            style={{ background: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.25)' }}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]" style={{ background: 'rgba(14,165,233,0.12)' }}>
              ✨
            </div>
            <div className="text-[13px] leading-[1.55] text-foreground">
              <strong>كل ما ترفعه هنا يُحفَظ في معرضك أيضًا،</strong>{' '}
              <span className="text-muted">
                لتعيد استخدامه لاحقًا عند تعديل موقعك. غياب الصورة ليس مشكلة — اترك الخانة فارغة وسنضع صورة بديلة عالية الجودة.
              </span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageUploadField
              label="الصورة الرئيسية"
              value={form.hero_image_url}
              onChange={(url) => update('hero_image_url', url)}
              aspect="wide"
              helper="الصورة الكبيرة أعلى صفحتك."
              className="sm:col-span-2"
            />
            <ImageUploadField
              label="صورة الفريق"
              value={form.team_image_url}
              onChange={(url) => update('team_image_url', url)}
              aspect="square"
            />
            <ImageUploadField
              label="قبل"
              value={form.before_image_url}
              onChange={(url) => update('before_image_url', url)}
              aspect="square"
              helper="تُستخدَم في مقارنة قبل/بعد."
            />
            <ImageUploadField
              label="بعد"
              value={form.after_image_url}
              onChange={(url) => update('after_image_url', url)}
              aspect="square"
              helper="تُستخدَم في مقارنة قبل/بعد."
            />
            <div className="sm:col-span-2">
              <label className="mb-2 block text-[12.5px] font-medium text-foreground">
                المعرض (حتى 8)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <ImageUploadField
                    key={`g-${i}`}
                    value={form.gallery_image_urls[i] || ''}
                    onChange={(url) => setGalleryAt(i, url)}
                    aspect="square"
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="النمط البصري" subtitle="اختر النمط الجاهز الأنسب لهذا النشاط المحلي.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SERVICE_PRESETS.map((preset) => {
              const selected = form.style_preset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update('style_preset', preset.id)}
                  className={`rounded-3xl border-2 p-5 text-left transition ${selected ? 'border-foreground shadow-soft-lg' : 'border-token hover:border-foreground/40'}`}
                  style={{ background: preset.colors.background, color: preset.colors.text }}
                >
                  <div className="mb-4 flex gap-2">
                    <span className="h-6 w-6 rounded-full" style={{ background: preset.colors.primary }} />
                    <span className="h-6 w-6 rounded-full" style={{ background: preset.colors.accent }} />
                    <span className="h-6 w-6 rounded-full border" style={{ background: preset.colors.surface, borderColor: preset.colors.border }} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: preset.colors.accent }}>{preset.vibe}</p>
                  <p className="mt-2 text-2xl font-extrabold" style={{ fontFamily: preset.heading_font }}>{preset.name}</p>
                  <p className="mt-2 text-sm opacity-80">{preset.description}</p>
                </button>
              )
            })}
          </div>
        </Section>

        <div className="sticky bottom-6 z-20 mt-12 rounded-[28px] border border-token bg-foreground p-5 shadow-soft-lg">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-white">
              <p className="text-sm font-semibold">جاهز لتوليد قالب الحِرَف.</p>
              <p className="text-xs opacity-70">سنبني موقع الخدمات المحلية كاملًا وننقلك إلى المعاينة الحيّة.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={startGenerate}
              className="rounded-full bg-sky-400 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? 'جارٍ توليد موقعك...' : 'ولّد قالب الحِرَف'}
            </button>
          </div>
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

const inputCls =
  'w-full rounded-2xl border border-token bg-surface/85 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15'

function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section {...sectionMotion} className="mb-8 rounded-[32px] border border-token bg-surface/65 p-6 shadow-soft-md backdrop-blur-xl sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </motion.section>
  )
}

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
        {required && <span className="ms-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
