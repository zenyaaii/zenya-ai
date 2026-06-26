"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { WELLNESS_PRESETS } from '@/utils/wellness/presets'
import type { WellnessInput } from '@/utils/wellness/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'

type Treatment = { id: string; name: string; category: string; duration: string; price: string; description: string; badge: string }
type TeamMember = { id: string; name: string; title: string; specialty: string; bio: string; image_url: string }
type StudioHour = { day: string; label: string; open: string; close: string; closed?: boolean }

function uid() { return Math.random().toString(36).slice(2, 9) }

const DEFAULT_STUDIO_HOURS: StudioHour[] = [
  { day: 'saturday', label: 'السبت', open: '9:00 ص', close: '8:00 م' },
  { day: 'sunday', label: 'الأحد', open: '9:00 ص', close: '8:00 م' },
  { day: 'monday', label: 'الإثنين', open: '9:00 ص', close: '8:00 م' },
  { day: 'tuesday', label: 'الثلاثاء', open: '9:00 ص', close: '8:00 م' },
  { day: 'wednesday', label: 'الأربعاء', open: '9:00 ص', close: '8:00 م' },
  { day: 'thursday', label: 'الخميس', open: '9:00 ص', close: '6:00 م' },
  { day: 'friday', label: 'الجمعة', open: '2:00 م', close: '9:00 م' }
]

function formatHours(hours: StudioHour[]): string {
  const parts = hours.map((h) => {
    if (h.closed) return `${h.label} مغلق`
    if (!h.open && !h.close) return ''
    return `${h.label} ${h.open}–${h.close}`
  }).filter(Boolean)
  return parts.join(' · ')
}

type Form = {
  brand_name: string
  brand_type: string
  city: string
  region: string
  founded_year: string
  phone: string
  email: string
  address: string
  booking_url: string
  hours: StudioHour[]
  cancellation_policy: string
  philosophy_brief: string
  philosophy_approach: string
  amenities: string
  review_rating: string
  review_count: string
  certifications: string
  hero_image_url: string
  space_image_urls: string[]
  treatments: Treatment[]
  team: TeamMember[]
  style_preset: WellnessInput['style_preset']
}

function buildSampleForm(): Form {
  return {
    brand_name: 'سَكينة للعافية',
    brand_type: 'سبا شامل ويوغا',
    city: 'جدة',
    region: 'منطقة مكة المكرمة',
    founded_year: '2018',
    phone: '+966 12 555 0182',
    email: 'hello@sakeena.sa',
    address: 'طريق الكورنيش، حي الشاطئ، جدة',
    booking_url: 'https://book.sakeena.sa',
    hours: [
      { day: 'saturday', label: 'السبت', open: '9:00 ص', close: '8:00 م' },
      { day: 'sunday', label: 'الأحد', open: '9:00 ص', close: '8:00 م' },
      { day: 'monday', label: 'الإثنين', open: '9:00 ص', close: '8:00 م' },
      { day: 'tuesday', label: 'الثلاثاء', open: '9:00 ص', close: '8:00 م' },
      { day: 'wednesday', label: 'الأربعاء', open: '9:00 ص', close: '9:00 م' },
      { day: 'thursday', label: 'الخميس', open: '9:00 ص', close: '6:00 م' },
      { day: 'friday', label: 'الجمعة', open: '2:00 م', close: '9:00 م' },
    ],
    cancellation_policy: 'يلزم إشعار قبل 24 ساعة، وإلا تُطبَّق رسوم 50٪.',
    philosophy_brief: 'سَكينة ملاذ هادئ بُني حول فكرة واحدة: الراحة مهارة، لا ترف. نمزج ممارسات شرقية وغربية — علاجًا جسديًا وتنفّسًا وأعشابًا — بلا مبالغات. الجلسات على مهل، والموسيقى خافتة، وهناك دائمًا شاي.',
    philosophy_approach: 'تكاملي، مراعٍ للراحة النفسية، أقلّ تدخّلًا',
    amenities: 'ساونا بالأشعة تحت الحمراء\nغرف علاج خاصة\nصالة شاي\nكبسولة طفو\nحوض ماء بارد\nحديقة تأمّل',
    review_rating: '4.9',
    review_count: '+480',
    certifications: 'ABMP، AMTA، 500 ساعة RYT، IAYT',
    hero_image_url: '',
    space_image_urls: [],
    treatments: [
      { id: uid(), name: 'تدليك الأنسجة العميقة', category: 'تدليك', duration: '60 دقيقة', price: 'يبدأ من 145 ﷼', description: 'ضغط بطيء ومتواصل يحرّر ما خلّفه الأسبوع من توتّر.', badge: 'الأكثر طلبًا' },
      { id: uid(), name: 'عناية الوجه المميّزة', category: 'عناية بالوجه', duration: '75 دقيقة', price: 'يبدأ من 180 ﷼', description: 'تدليك ليمفاوي وغوا شا وأمصال نباتية مُصمّمة لبشرتك في يومها.', badge: 'مميّزة' },
      { id: uid(), name: 'يوغا استشفائية · خاصة', category: 'يوغا', duration: '60 دقيقة', price: 'يبدأ من 120 ﷼', description: 'وضعيات ثابتة وتمارين تنفّس ووسائد — لجهاز عصبي يحتاج راحة.', badge: '' },
      { id: uid(), name: 'علاج الطفو', category: 'طفو', duration: '60 دقيقة', price: '95 ﷼', description: 'أملاح إبسوم في ماء بحرارة الجسم. سكون بلا أي مؤثّرات.', badge: 'جديد' },
    ],
    team: [
      { id: uid(), name: 'يوسف الحربي', title: 'المؤسّس · كبير المعالجين', specialty: 'الأنسجة العميقة · الاسترخاء · ريكي', bio: 'اثنتا عشرة سنة من العلاج الجسدي بين عدّة مدن. يؤمن بأن الجسد يعرف.', image_url: '' },
      { id: uid(), name: 'خالد منصور', title: 'أخصائي عناية أول', specialty: 'غوا شا · البشرة الحساسة · حب الشباب', bio: 'تدرّب في عدّة دول. يتعامل مع البشرة كأنها حوار هادئ.', image_url: '' },
    ],
    style_preset: 'zen',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  brand_type: '',
  city: '',
  region: '',
  founded_year: '',
  phone: '',
  email: '',
  address: '',
  booking_url: '',
  hours: DEFAULT_STUDIO_HOURS,
  cancellation_policy: 'يلزم إشعار قبل 24 ساعة',
  philosophy_brief: '',
  philosophy_approach: '',
  amenities: '',
  review_rating: '5.0',
  review_count: '+100',
  certifications: '',
  hero_image_url: '',
  space_image_urls: [],
  treatments: [
    { id: uid(), name: '', category: 'تدليك', duration: '60 دقيقة', price: '', description: '', badge: '' }
  ],
  team: [],
  style_preset: 'zen'
}

const TREATMENT_CATEGORIES = ['تدليك', 'عناية بالوجه', 'يوغا', 'يقظة ذهنية', 'علاج جسدي', 'للأزواج', 'الشعر والتجميل', 'العناية بالأظافر', 'ساونا وبخار', 'طفو', 'أخرى']

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
}

export default function WellnessWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Honesty gate: the user must acknowledge that parts of the generated site
  // are AI-invented placeholders before we build it.
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push('/login?mode=signup&next=/theme/new/wellness'); return }
      setAuthReady(true)
    }
    checkAuth()
    return () => { cancelled = true }
  }, [router, supabase])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateHour(idx: number, patch: Partial<StudioHour>) {
    setForm((prev) => ({
      ...prev,
      hours: prev.hours.map((h, i) => (i === idx ? { ...h, ...patch } : h))
    }))
  }

  function setSpaceAt(idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev.space_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, space_image_urls: next.filter(Boolean) }
    })
  }

  function updateTreatment(id: string, patch: Partial<Treatment>) {
    setForm((prev) => ({ ...prev, treatments: prev.treatments.map((t) => t.id === id ? { ...t, ...patch } : t) }))
  }
  function addTreatment() {
    setForm((prev) => ({ ...prev, treatments: [...prev.treatments, { id: uid(), name: '', category: 'تدليك', duration: '60 دقيقة', price: '', description: '', badge: '' }] }))
  }
  function removeTreatment(id: string) {
    setForm((prev) => ({ ...prev, treatments: prev.treatments.filter((t) => t.id !== id) }))
  }

  function updateTeam(id: string, patch: Partial<TeamMember>) {
    setForm((prev) => ({ ...prev, team: prev.team.map((m) => m.id === id ? { ...m, ...patch } : m) }))
  }
  function addTeamMember() {
    setForm((prev) => ({ ...prev, team: [...prev.team, { id: uid(), name: '', title: '', specialty: '', bio: '', image_url: '' }] }))
  }
  function removeTeamMember(id: string) {
    setForm((prev) => ({ ...prev, team: prev.team.filter((m) => m.id !== id) }))
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم الاستوديو.'
    if (form.brand_type.trim().length < 2) return 'يرجى إدخال نوع الاستوديو (مثلاً: سبا شامل، استوديو يوغا).'
    if (form.city.trim().length < 2) return 'يرجى إدخال المدينة.'
    if (form.phone.trim().length < 4) return 'يرجى إدخال رقم هاتف.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'يرجى إدخال بريد إلكتروني صحيح.'
    if (form.philosophy_brief.trim().length < 20) return 'أخبرنا المزيد عن فلسفة الاستوديو أو قصته (20 حرفًا على الأقل).'
    const valid = form.treatments.filter((t) => t.name.trim().length >= 2)
    if (valid.length < 1) return 'أضف جلسة واحدة على الأقل لتوليد الموقع.'
    return null
  }

  function buildPayload(): WellnessInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        type: form.brand_type.trim(),
        city: form.city.trim(),
        region: form.region.trim() || undefined,
        founded_year: form.founded_year.trim() || undefined
      },
      contact: {
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        booking_url: form.booking_url.trim() || undefined,
        hours: formatHours(form.hours) || undefined,
        cancellation_policy: form.cancellation_policy.trim() || undefined
      },
      treatments: form.treatments
        .filter((t) => t.name.trim().length >= 2)
        .map((t) => ({
          name: t.name.trim(),
          category: t.category.trim() || undefined,
          duration: t.duration.trim() || undefined,
          price: t.price.trim() || undefined,
          description: t.description.trim() || undefined,
          badge: t.badge.trim() || undefined
        })),
      team: form.team
        .filter((m) => m.name.trim().length >= 2)
        .map((m) => ({
          name: m.name.trim(),
          title: m.title.trim() || undefined,
          specialty: m.specialty.trim() || undefined,
          bio: m.bio.trim() || undefined,
          image_url: /^https?:\/\//.test(m.image_url) ? m.image_url.trim() : undefined
        })),
      philosophy: {
        brief: form.philosophy_brief.trim(),
        approach: form.philosophy_approach.trim() || undefined
      },
      amenities: form.amenities.trim() || undefined,
      social_proof: {
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        certifications: form.certifications.trim() || undefined
      },
      visuals: {
        hero_image_url: /^https?:\/\//.test(form.hero_image_url) ? form.hero_image_url.trim() : undefined,
        space_image_urls: form.space_image_urls.filter(Boolean).join('\n') || undefined
      },
      style_preset: form.style_preset
    }
  }

  // Entry point from the CTA: validate first, then make the user pass the
  // honesty gate once before the build runs.
  function startGenerate() {
    setError(null)
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
      const genRes = await fetch('/api/generate-wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

      const preset = WELLNESS_PRESETS.find((p) => p.id === form.style_preset) || WELLNESS_PRESETS[0]
      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: form.space_image_urls.filter(Boolean),
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'wellness',
            style_preset: form.style_preset,
            wellness: genJson.content,
            input: payload
          }
        })
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/wellness'); return }
      if (saveRes.status === 402) { alert('بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.'); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      router.push(`/preview/wellness/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setLoading(false)
    }
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-muted">جارٍ التحميل...</div>
  }

  const selectedPreset = WELLNESS_PRESETS.find((p) => p.id === form.style_preset) || WELLNESS_PRESETS[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[600px] w-[600px] rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-rose-300/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-amber-200/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/55 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <ExampleFillButton onFill={() => setForm(buildSampleForm())} />
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-14">
        <motion.div {...sectionMotion} className="mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-teal-700">قالب استوديو العافية</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            ابنِ موقع استوديو عافية فاخرًا.
          </h1>
          <p className="mt-3 max-w-3xl text-muted">
            أخبرنا عن استوديوك وجلساتك وفريقك. تولّد زينيا موقعًا فاخرًا متكاملًا — واجهة رئيسية وقائمة جلسات وملفات الفريق ومعرض صور وشهادات ومسار حجز.
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800">
            {error}
          </motion.div>
        )}

        {/* Studio basics */}
        <Section title="أساسيات الاستوديو" subtitle="أساس هوية علامتك وحضورك المحلي.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الاستوديو" required>
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="سَكينة للعافية" />
            </Field>
            <Field label="نوع الاستوديو" required>
              <input className={inputCls} value={form.brand_type} onChange={(e) => update('brand_type', e.target.value)} placeholder="سبا شامل، استوديو يوغا، سبا طبي، مركز عافية..." />
            </Field>
            <Field label="المدينة" required>
              <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="جدة" />
            </Field>
            <Field label="المنطقة">
              <input className={inputCls} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="منطقة مكة المكرمة" />
            </Field>
            <Field label="سنة التأسيس">
              <input className={inputCls} value={form.founded_year} onChange={(e) => update('founded_year', e.target.value)} placeholder="2018" />
            </Field>
          </div>
        </Section>

        {/* Contact */}
        <Section title="التواصل والحجز" subtitle="كيف يصل إليك العملاء ويحجزون جلساتهم؟">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الهاتف" required>
              <input className={inputCls} dir="ltr" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+966 12 555 0182" />
            </Field>
            <Field label="البريد الإلكتروني" required>
              <input className={inputCls} dir="ltr" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="hello@yourstudio.com" />
            </Field>
            <Field label="العنوان">
              <input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="طريق الكورنيش، حي الشاطئ، جدة" />
            </Field>
            <Field label="رابط الحجز الإلكتروني (اختياري)">
              <input className={inputCls} dir="ltr" value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} placeholder="https://... — اتركه فارغًا إن لم يكن لديك" />
            </Field>
            <Field label="سياسة الإلغاء" className="sm:col-span-2">
              <input className={inputCls} value={form.cancellation_policy} onChange={(e) => update('cancellation_policy', e.target.value)} placeholder="يلزم إشعار قبل 24 ساعة" />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-token bg-elevated/60 p-5 backdrop-blur-md">
            <p className="mb-1 text-xs uppercase tracking-[0.22em] text-muted">ساعات العمل</p>
            <p className="mb-4 text-xs text-muted/80">حدّد أوقات الفتح / الإغلاق لكل يوم. أشِّر على «مغلق» للأيام التي تكون فيها مغلقًا.</p>
            <div className="divide-y divide-token">
              {form.hours.map((h, idx) => (
                <div key={h.day} className="flex flex-col gap-2 py-3 sm:grid sm:grid-cols-[110px_1fr_1fr_80px] sm:items-center sm:gap-3">
                  {/* Day + closed toggle: same row on mobile, separate grid cells on sm+ */}
                  <div className="flex items-center justify-between sm:contents">
                    <span className="text-sm font-medium text-foreground">{h.label}</span>
                    <label className="flex items-center gap-2 text-xs text-muted sm:order-last sm:justify-end">
                      <input
                        type="checkbox"
                        checked={!!h.closed}
                        onChange={(e) => updateHour(idx, { closed: e.target.checked, ...(e.target.checked ? { open: '', close: '' } : {}) })}
                      />
                      مغلق
                    </label>
                  </div>
                  {/* Open / close inputs: side-by-side on mobile, inline on sm+ */}
                  <div className="grid grid-cols-2 gap-3 sm:contents">
                    <input
                      className={inputCls + ' py-2'}
                      placeholder="9:00 ص"
                      value={h.open}
                      onChange={(e) => updateHour(idx, { open: e.target.value })}
                      disabled={h.closed}
                    />
                    <input
                      className={inputCls + ' py-2'}
                      placeholder="8:00 م"
                      value={h.close}
                      onChange={(e) => updateHour(idx, { close: e.target.value })}
                      disabled={h.closed}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Treatments */}
        <Section title="الجلسات والخدمات" subtitle="حتى جلسة واحدة تكفي. أضف المدّة والسعر حيثما أمكن.">
          <div className="space-y-5">
            {form.treatments.map((t, index) => (
              <div key={t.id} className="rounded-3xl border border-token bg-elevated/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">الجلسة {String(index + 1).padStart(2, '0')}</p>
                  {form.treatments.length > 1 && (
                    <button type="button" onClick={() => removeTreatment(t.id)} className="rounded-full border border-token px-3 py-1 text-xs font-semibold text-muted transition hover:text-red-500">
                      إزالة
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={t.name} onChange={(e) => updateTreatment(t.id, { name: e.target.value })} placeholder="اسم الجلسة (مثلاً: تدليك الأنسجة العميقة)" />
                  <select className={inputCls} value={t.category} onChange={(e) => updateTreatment(t.id, { category: e.target.value })}>
                    {TREATMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className={inputCls} value={t.duration} onChange={(e) => updateTreatment(t.id, { duration: e.target.value })} placeholder="المدّة (مثلاً: 60 دقيقة)" />
                  <input className={inputCls} value={t.price} onChange={(e) => updateTreatment(t.id, { price: e.target.value })} placeholder="السعر (مثلاً: يبدأ من 120 ﷼)" />
                  <input className={inputCls + ' sm:col-span-2'} value={t.description} onChange={(e) => updateTreatment(t.id, { description: e.target.value })} placeholder="وصف موجز (اختياري — سيكتبه الذكاء الاصطناعي إن تُرك فارغًا)" />
                  <input className={inputCls} value={t.badge} onChange={(e) => updateTreatment(t.id, { badge: e.target.value })} placeholder="شارة (الأكثر طلبًا، جديد، مميّزة...)" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addTreatment} className="w-full rounded-2xl border-2 border-dashed border-token py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground">
              + أضف جلسة أخرى
            </button>
          </div>
        </Section>

        {/* Philosophy */}
        <Section title="قصة الاستوديو وفلسفته" subtitle="أخبرنا روح الاستوديو. بضع جمل تكفي — سيصقلها الذكاء الاصطناعي.">
          <div className="grid gap-4">
            <Field label="ملخّص الفلسفة / القصة" required>
              <textarea className={inputCls + ' min-h-[140px] resize-y'} value={form.philosophy_brief} onChange={(e) => update('philosophy_brief', e.target.value)} placeholder="ما الذي ألهمك لافتتاح هذا الاستوديو؟ بماذا يشعر العملاء عند دخولهم؟ ما الذي يجعل التجربة مختلفة؟" />
            </Field>
            <Field label="النهج الأساسي (اختياري)">
              <input className={inputCls} value={form.philosophy_approach} onChange={(e) => update('philosophy_approach', e.target.value)} placeholder="مثلاً: قائم على الأدلّة، مراعٍ للراحة النفسية، تكاملي شرقي وغربي..." />
            </Field>
            <Field label="المرافق (واحدة في كل سطر أو مفصولة بفواصل)">
              <textarea className={inputCls + ' min-h-[100px] resize-y'} value={form.amenities} onChange={(e) => update('amenities', e.target.value)} placeholder="ساونا بالأشعة تحت الحمراء&#10;غرف علاج خاصة&#10;صالة شاي&#10;كبسولة طفو" />
            </Field>
          </div>
        </Section>

        {/* Team */}
        <Section title="أعضاء الفريق" subtitle="اختياري. أضف أبرز مختصّيك — سيكتب الذكاء الاصطناعي سيرهم إن أعطيتنا تفاصيلهم.">
          {form.team.length === 0 && (
            <p className="mb-4 text-sm text-muted">لم تُضف أعضاء فريق بعد. تخطَّ هذا وسينشئ الذكاء الاصطناعي سيرًا مبدئية، أو أضف فريقك الحقيقي أدناه.</p>
          )}
          <div className="space-y-5">
            {form.team.map((m, index) => (
              <div key={m.id} className="rounded-3xl border border-token bg-elevated/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">المختصّ {String(index + 1).padStart(2, '0')}</p>
                  <button type="button" onClick={() => removeTeamMember(m.id)} className="rounded-full border border-token px-3 py-1 text-xs font-semibold text-muted transition hover:text-red-500">
                    إزالة
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={m.name} onChange={(e) => updateTeam(m.id, { name: e.target.value })} placeholder="الاسم الكامل" />
                  <input className={inputCls} value={m.title} onChange={(e) => updateTeam(m.id, { title: e.target.value })} placeholder="اللقب (مثلاً: كبير المعالجين، المؤسّس)" />
                  <input className={inputCls + ' sm:col-span-2'} value={m.specialty} onChange={(e) => updateTeam(m.id, { specialty: e.target.value })} placeholder="التخصّصات (مثلاً: الأنسجة العميقة · الاسترخاء · ريكي)" />
                  <textarea className={inputCls + ' sm:col-span-2 min-h-[80px] resize-y'} value={m.bio} onChange={(e) => updateTeam(m.id, { bio: e.target.value })} placeholder="سيرة موجزة أو خلفية (سيصقلها الذكاء الاصطناعي)" />
                  <input className={inputCls + ' sm:col-span-2'} dir="ltr" value={m.image_url} onChange={(e) => updateTeam(m.id, { image_url: e.target.value })} placeholder="رابط الصورة (اختياري)" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addTeamMember} className="w-full rounded-2xl border-2 border-dashed border-token py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground">
              + أضف عضو فريق
            </button>
          </div>
        </Section>

        {/* Social proof */}
        <Section title="الدليل الاجتماعي" subtitle="حتى الأرقام التقريبية تجعل القالب أكثر مصداقية.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="متوسط التقييم">
              <input className={inputCls} value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="5.0" />
            </Field>
            <Field label="عدد التقييمات">
              <input className={inputCls} value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="+340" />
            </Field>
            <Field label="الشهادات / العضويات">
              <input className={inputCls} value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="ABMP، AMTA، 200 ساعة RYT..." />
            </Field>
          </div>
        </Section>

        {/* Visuals */}
        <Section title="الأصول البصرية" subtitle="ارفع صورك الخاصة. كل ما ترفعه هنا يُحفَظ في معرضك لإعادة استخدامه لاحقًا. تخطَّ خانة وسنملؤها بصور بديلة جميلة.">
          <div className="grid gap-5">
            <ImageUploadField
              label="الصورة الرئيسية"
              value={form.hero_image_url}
              onChange={(url) => update('hero_image_url', url)}
              aspect="wide"
              helper="الصورة الكبيرة أعلى صفحتك."
            />
            <div>
              <label className="mb-2 block text-[12.5px] font-medium text-foreground">
                صور الاستوديو / المكان (حتى 8)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <ImageUploadField
                    key={`sp-${i}`}
                    value={form.space_image_urls[i] || ''}
                    onChange={(url) => setSpaceAt(i, url)}
                    aspect="square"
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Style preset */}
        <Section title="النمط البصري" subtitle="اختر الأسلوب الذي يناسب طاقة استوديوك.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {WELLNESS_PRESETS.map((preset) => {
              const selected = form.style_preset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update('style_preset', preset.id)}
                  className={`rounded-3xl border-2 p-5 text-left transition ${selected ? 'border-foreground shadow-soft-lg scale-[1.02]' : 'border-token hover:border-foreground/40'}`}
                  style={{ background: preset.colors.background, color: preset.colors.text }}
                >
                  <div className="mb-4 flex gap-2">
                    <span className="h-5 w-5 rounded-full shadow-sm" style={{ background: preset.colors.primary }} />
                    <span className="h-5 w-5 rounded-full shadow-sm" style={{ background: preset.colors.accent }} />
                    <span className="h-5 w-5 rounded-full border shadow-sm" style={{ background: preset.colors.surface, borderColor: preset.colors.border }} />
                  </div>
                  <p className="text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: preset.colors.accent }}>{preset.vibe}</p>
                  <p className="mt-2 text-xl font-extrabold" style={{ fontFamily: preset.heading_font }}>{preset.name}</p>
                  <p className="mt-2 text-xs opacity-75">{preset.description}</p>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Sticky CTA */}
        <div className="sticky bottom-6 z-20 mt-12 overflow-hidden rounded-[28px] border border-token shadow-soft-lg"
          style={{ background: selectedPreset.colors.primary }}
        >
          <div className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
            <div style={{ color: selectedPreset.colors.surface }}>
              <p className="text-sm font-semibold">جاهز لتوليد موقع العافية الخاص بك.</p>
              <p className="text-xs opacity-70">سنبني الموقع الفاخر كاملًا وننقلك إلى المعاينة الحيّة.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={startGenerate}
              className="whitespace-nowrap rounded-full px-8 py-3.5 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60"
              style={{ background: selectedPreset.colors.accent, color: selectedPreset.id === 'noir' ? '#0e0e0e' : selectedPreset.colors.text }}
            >
              {loading ? 'جارٍ توليد موقعك...' : 'ولّد قالب العافية ←'}
            </button>
          </div>
        </div>
      </main>

      {/* Honesty gate — shown once before the first build. */}
      <AiContentDisclaimer
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        onConfirm={() => { setAcked(true); setDisclaimerOpen(false); void handleGenerate() }}
      />

      {/* Building animation — sections mix into a dot while we generate. */}
      <GenerationOverlay open={loading} />
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-token bg-surface/85 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15'

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
        {label}{required && <span className="ms-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
