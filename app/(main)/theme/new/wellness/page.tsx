"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { WELLNESS_PRESETS } from '@/utils/wellness/presets'
import type { WellnessInput } from '@/utils/wellness/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'
import { useWizardDraft, clearWizardDraft } from '@/lib/useWizardDraft'
import WizardShell, {
  AddButton, Block, Card, Field, Grid, Handoff, Hours, Input, Notice, Presets, Review, Select, Textarea, Uploads,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'

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
  { day: 'friday', label: 'الجمعة', open: '2:00 م', close: '9:00 م' },
]

function formatHours(hours: StudioHour[]): string {
  return hours
    .map((h) => {
      if (h.closed) return `${h.label} مغلق`
      if (!h.open && !h.close) return ''
      return `${h.label} ${h.open}–${h.close}`
    })
    .filter(Boolean)
    .join(' · ')
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
    hours: DEFAULT_STUDIO_HOURS.map((h) => ({ ...h })),
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
  treatments: [{ id: uid(), name: '', category: 'تدليك', duration: '60 دقيقة', price: '', description: '', badge: '' }],
  team: [],
  style_preset: 'zen',
}

const TREATMENT_CATEGORIES = ['تدليك', 'عناية بالوجه', 'يوغا', 'يقظة ذهنية', 'علاج جسدي', 'للأزواج', 'الشعر والتجميل', 'العناية بالأظافر', 'ساونا وبخار', 'طفو', 'أخرى']

const EMAIL_RE = /^\S+@\S+\.\S+$/

export default function WellnessWizardPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [authReady, setAuthReady] = useState(false)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  useWizardDraft('wellness', form, setForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  // Honesty gate: acknowledge that parts of the site are AI-written placeholders.
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
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
  function updateHour(idx: number, patch: Partial<StudioHour>) {
    setForm((prev) => ({ ...prev, hours: prev.hours.map((h, i) => (i === idx ? { ...h, ...patch } : h)) }))
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
    setForm((prev) => ({ ...prev, treatments: prev.treatments.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }
  function addTreatment() {
    setForm((prev) => ({ ...prev, treatments: [...prev.treatments, { id: uid(), name: '', category: 'تدليك', duration: '60 دقيقة', price: '', description: '', badge: '' }] }))
  }
  function removeTreatment(id: string) {
    setForm((prev) => ({ ...prev, treatments: prev.treatments.filter((t) => t.id !== id) }))
  }
  function updateTeam(id: string, patch: Partial<TeamMember>) {
    setForm((prev) => ({ ...prev, team: prev.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }
  function addTeamMember() {
    setForm((prev) => ({ ...prev, team: [...prev.team, { id: uid(), name: '', title: '', specialty: '', bio: '', image_url: '' }] }))
  }
  function removeTeamMember(id: string) {
    setForm((prev) => ({ ...prev, team: prev.team.filter((m) => m.id !== id) }))
  }

  const validTreatments = form.treatments.filter((t) => t.name.trim().length >= 2)
  const ok = {
    basics: form.brand_name.trim().length >= 2 && form.brand_type.trim().length >= 2 && form.city.trim().length >= 2,
    contact: form.phone.trim().length >= 4 && EMAIL_RE.test(form.email.trim()),
    treatments: validTreatments.length >= 1,
    philosophy: form.philosophy_brief.trim().length >= 20,
  }
  const required = [
    form.brand_name.trim().length >= 2, form.brand_type.trim().length >= 2, form.city.trim().length >= 2,
    form.phone.trim().length >= 4, EMAIL_RE.test(form.email.trim()), ok.treatments, ok.philosophy,
  ]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم الاستوديو.'
    if (form.brand_type.trim().length < 2) return 'يرجى إدخال نوع الاستوديو (مثلاً: سبا شامل، استوديو يوغا).'
    if (form.city.trim().length < 2) return 'يرجى إدخال المدينة.'
    if (form.phone.trim().length < 4) return 'يرجى إدخال رقم هاتف.'
    if (!EMAIL_RE.test(form.email.trim())) return 'يرجى إدخال بريد إلكتروني صحيح.'
    if (form.philosophy_brief.trim().length < 20) return 'أخبرنا المزيد عن فلسفة الاستوديو أو قصته (20 حرفًا على الأقل).'
    if (validTreatments.length < 1) return 'أضف جلسة واحدة على الأقل لتوليد الموقع.'
    return null
  }

  function buildPayload(): WellnessInput {
    return {
      brand: {
        name: form.brand_name.trim(),
        type: form.brand_type.trim(),
        city: form.city.trim(),
        region: form.region.trim() || undefined,
        founded_year: form.founded_year.trim() || undefined,
      },
      contact: {
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        booking_url: form.booking_url.trim() || undefined,
        hours: formatHours(form.hours) || undefined,
        cancellation_policy: form.cancellation_policy.trim() || undefined,
      },
      treatments: validTreatments.map((t) => ({
        name: t.name.trim(),
        category: t.category.trim() || undefined,
        duration: t.duration.trim() || undefined,
        price: t.price.trim() || undefined,
        description: t.description.trim() || undefined,
        badge: t.badge.trim() || undefined,
      })),
      team: form.team
        .filter((m) => m.name.trim().length >= 2)
        .map((m) => ({
          name: m.name.trim(),
          title: m.title.trim() || undefined,
          specialty: m.specialty.trim() || undefined,
          bio: m.bio.trim() || undefined,
          image_url: /^https?:\/\//.test(m.image_url) ? m.image_url.trim() : undefined,
        })),
      philosophy: { brief: form.philosophy_brief.trim(), approach: form.philosophy_approach.trim() || undefined },
      amenities: form.amenities.trim() || undefined,
      social_proof: {
        review_rating: Number.isFinite(Number(form.review_rating)) ? Number(form.review_rating) : undefined,
        review_count: form.review_count.trim() || undefined,
        certifications: form.certifications.trim() || undefined,
      },
      visuals: {
        hero_image_url: /^https?:\/\//.test(form.hero_image_url) ? form.hero_image_url.trim() : undefined,
        space_image_urls: form.space_image_urls.filter(Boolean).join('\n') || undefined,
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
      const genRes = await fetch('/api/generate-wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || 'فشل التوليد')

      const preset = WELLNESS_PRESETS.find((p) => p.id === form.style_preset) || WELLNESS_PRESETS[0]
      const saveRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name.trim(),
          images: form.space_image_urls.filter(Boolean),
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: { business_type: 'wellness', style_preset: form.style_preset, wellness: genJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push('/login?mode=signup&next=/theme/new/wellness'); return }
      if (saveRes.status === 402) { toast({ type: 'warning', message: 'بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || 'فشل الحفظ')
      clearWizardDraft('wellness')
      router.push(`/preview/wellness/${saveJson.id}?created=1`)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ ما. يرجى المحاولة مجددًا.')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'basics',
      title: 'أساسيات الاستوديو',
      sub: 'أساس هوية علامتك وحضورك المحلي.',
      complete: ok.basics,
      note: 'أدخل اسم الاستوديو ونوعه والمدينة.',
      body: (
        <Grid>
          <Field label="اسم الاستوديو" required>
            <Input value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="سَكينة للعافية" />
          </Field>
          <Field label="نوع الاستوديو" required>
            <Input value={form.brand_type} onChange={(e) => update('brand_type', e.target.value)} placeholder="سبا شامل، استوديو يوغا، مركز عافية..." />
          </Field>
          <Field label="المدينة" required>
            <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="جدة" />
          </Field>
          <Field label="المنطقة">
            <Input value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="منطقة مكة المكرمة" />
          </Field>
          <Field label="سنة التأسيس">
            <Input value={form.founded_year} onChange={(e) => update('founded_year', e.target.value)} placeholder="2018" />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'contact',
      title: 'التواصل والحجز',
      sub: 'كيف يصل إليك العملاء ويحجزون جلساتهم؟',
      complete: ok.contact,
      note: 'أدخل رقم هاتف وبريدًا إلكترونيًا صحيحًا.',
      body: (
        <Grid>
          <Field label="الهاتف" required>
            <Input dir="ltr" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+966 12 555 0182" />
          </Field>
          <Field label="البريد الإلكتروني" required>
            <Input dir="ltr" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="hello@yourstudio.com" />
          </Field>
          <Field label="العنوان">
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="طريق الكورنيش، حي الشاطئ، جدة" />
          </Field>
          <Field label="رابط الحجز الإلكتروني (اختياري)">
            <Input dir="ltr" value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="سياسة الإلغاء" wide>
            <Input value={form.cancellation_policy} onChange={(e) => update('cancellation_policy', e.target.value)} placeholder="يلزم إشعار قبل 24 ساعة" />
          </Field>
          <Block title="ساعات العمل" hint="أشِّر على «مغلق» للأيام التي تكون فيها مغلقًا.">
            <Hours hours={form.hours} onChange={updateHour} openPh="9:00 ص" closePh="8:00 م" />
          </Block>
        </Grid>
      ),
    },
    {
      id: 'treatments',
      title: 'الجلسات والخدمات',
      sub: 'حتى جلسة واحدة تكفي. أضف المدّة والسعر حيثما أمكن.',
      complete: ok.treatments,
      note: 'أضف جلسة واحدة على الأقل.',
      body: (
        <Grid>
          <Block>
            <div className="zb-list">
              {form.treatments.map((t, i) => (
                <Card key={t.id} title={'الجلسة ' + (i + 1)} onRemove={form.treatments.length > 1 ? () => removeTreatment(t.id) : undefined} removeLabel={'حذف الجلسة ' + (i + 1)}>
                  <Grid>
                    <Field label="اسم الجلسة">
                      <Input value={t.name} onChange={(e) => updateTreatment(t.id, { name: e.target.value })} placeholder="تدليك الأنسجة العميقة" />
                    </Field>
                    <Field label="الفئة">
                      <Select value={t.category} onChange={(e) => updateTreatment(t.id, { category: e.target.value })}>
                        {TREATMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </Field>
                    <Field label="المدّة">
                      <Input value={t.duration} onChange={(e) => updateTreatment(t.id, { duration: e.target.value })} placeholder="60 دقيقة" />
                    </Field>
                    <Field label="السعر">
                      <Input value={t.price} onChange={(e) => updateTreatment(t.id, { price: e.target.value })} placeholder="يبدأ من 120 ﷼" />
                    </Field>
                    <Field label="وصف موجز (اختياري)" wide>
                      <Input value={t.description} onChange={(e) => updateTreatment(t.id, { description: e.target.value })} placeholder="سيكتبه الذكاء الاصطناعي إن تُرك فارغًا" />
                    </Field>
                    <Field label="شارة">
                      <Input value={t.badge} onChange={(e) => updateTreatment(t.id, { badge: e.target.value })} placeholder="الأكثر طلبًا، جديد، مميّزة..." />
                    </Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={addTreatment}>أضف جلسة أخرى</AddButton>
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'philosophy',
      title: 'قصة الاستوديو وفلسفته',
      sub: 'روح الاستوديو في بضع جمل — سيصقلها الذكاء الاصطناعي.',
      complete: ok.philosophy,
      note: 'أخبرنا المزيد عن فلسفة الاستوديو (20 حرفًا على الأقل).',
      body: (
        <Grid>
          <Field label="ملخّص الفلسفة / القصة" required wide>
            <Textarea rows={5} value={form.philosophy_brief} onChange={(e) => update('philosophy_brief', e.target.value)} placeholder="ما الذي ألهمك لافتتاح هذا الاستوديو؟ بماذا يشعر العملاء عند دخولهم؟" />
          </Field>
          <Field label="النهج الأساسي (اختياري)" wide>
            <Input value={form.philosophy_approach} onChange={(e) => update('philosophy_approach', e.target.value)} placeholder="مثلاً: قائم على الأدلّة، مراعٍ للراحة النفسية، تكاملي..." />
          </Field>
          <Field label="المرافق" wide hint="واحدة في كل سطر أو مفصولة بفواصل.">
            <Textarea rows={4} value={form.amenities} onChange={(e) => update('amenities', e.target.value)} placeholder={'ساونا بالأشعة تحت الحمراء\nغرف علاج خاصة\nصالة شاي'} />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'team',
      title: 'أعضاء الفريق',
      sub: 'أضف أبرز مختصّيك — سيكتب الذكاء الاصطناعي سيرهم إن أعطيتنا تفاصيلهم.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Block hint={form.team.length === 0 ? 'لم تُضف أعضاء فريق بعد. تخطَّ هذه الخطوة، أو أضف فريقك الحقيقي.' : undefined}>
            <div className="zb-list">
              {form.team.map((m, i) => (
                <Card key={m.id} title={'المختصّ ' + (i + 1)} onRemove={() => removeTeamMember(m.id)} removeLabel={'حذف المختصّ ' + (i + 1)}>
                  <Grid>
                    <Field label="الاسم الكامل">
                      <Input value={m.name} onChange={(e) => updateTeam(m.id, { name: e.target.value })} />
                    </Field>
                    <Field label="اللقب">
                      <Input value={m.title} onChange={(e) => updateTeam(m.id, { title: e.target.value })} placeholder="كبير المعالجين، المؤسّس" />
                    </Field>
                    <Field label="التخصّصات" wide>
                      <Input value={m.specialty} onChange={(e) => updateTeam(m.id, { specialty: e.target.value })} placeholder="الأنسجة العميقة · الاسترخاء · ريكي" />
                    </Field>
                    <Field label="سيرة موجزة" wide>
                      <Textarea value={m.bio} onChange={(e) => updateTeam(m.id, { bio: e.target.value })} placeholder="سيصقلها الذكاء الاصطناعي" />
                    </Field>
                    <Field label="رابط الصورة (اختياري)" wide>
                      <Input dir="ltr" value={m.image_url} onChange={(e) => updateTeam(m.id, { image_url: e.target.value })} placeholder="https://..." />
                    </Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={addTeamMember}>أضف عضو فريق</AddButton>
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'social',
      title: 'الدليل الاجتماعي',
      sub: 'التقييمات والشهادات المهنية.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="متوسط التقييم">
            <Input value={form.review_rating} onChange={(e) => update('review_rating', e.target.value)} placeholder="5.0" />
          </Field>
          <Field label="عدد التقييمات">
            <Input value={form.review_count} onChange={(e) => update('review_count', e.target.value)} placeholder="+340" />
          </Field>
          <Field label="الشهادات / العضويات" wide>
            <Input value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="ABMP، AMTA، 200 ساعة RYT..." />
          </Field>
        </Grid>
      ),
    },
    {
      id: 'visuals',
      title: 'الأصول البصرية',
      sub: 'ارفع صورك الخاصة. تخطَّ خانة وسنملؤها بصور بديلة جميلة.',
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Block>
            <p className="zb-note">كل ما ترفعه هنا يُحفَظ في معرضك لإعادة استخدامه لاحقًا.</p>
            <ImageUploadField label="الصورة الرئيسية" value={form.hero_image_url} onChange={(url) => update('hero_image_url', url)} aspect="wide" helper="الصورة الكبيرة أعلى صفحتك." />
          </Block>
          <Block title="صور الاستوديو / المكان (حتى 8)">
            <Uploads>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <ImageUploadField key={'sp-' + i} value={form.space_image_urls[i] || ''} onChange={(url) => setSpaceAt(i, url)} aspect="square" />
              ))}
            </Uploads>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'style',
      title: 'النمط البصري',
      sub: 'اختر الأسلوب الذي يناسب طاقة استوديوك.',
      complete: true,
      body: <Presets presets={WELLNESS_PRESETS} value={form.style_preset} onChange={(id) => update('style_preset', id as Form['style_preset'])} />,
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
              { label: 'الجلسات', value: validTreatments.length },
              { label: 'الفريق', value: form.team.filter((m) => m.name.trim().length >= 2).length },
              { label: 'أيام مفتوحة', value: `${form.hours.filter((h) => !h.closed).length} من 7` },
              { label: 'النمط', value: WELLNESS_PRESETS.find((p) => p.id === form.style_preset)?.name ?? '—' },
            ]}
            recap={[
              { label: 'اسم الاستوديو', value: form.brand_name },
              { label: 'النوع', value: form.brand_type },
              { label: 'المدينة', value: [form.city, form.region].filter(Boolean).join('، ') },
              { label: 'الهاتف', value: form.phone },
              { label: 'البريد الإلكتروني', value: form.email },
              { label: 'الجلسات', value: validTreatments.map((t) => t.name).join('، ') },
              { label: 'الفلسفة', value: form.philosophy_brief },
            ]}
          >
            <Handoff title="جاهز لتوليد موقع العافية الخاص بك." body="سنبني الموقع الفاخر كاملًا وننقلك إلى المعاينة الحيّة." />
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
        eyebrow="قالب استوديو العافية"
        title="ابنِ موقع استوديو عافية فاخرًا."
        sub="أخبرنا عن استوديوك وجلساتك وفريقك. تولّد زينيا موقعًا متكاملًا — واجهة رئيسية وقائمة جلسات وملفات الفريق ومسار حجز."
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'جارٍ توليد موقعك…' : 'ولّد قالب العافية', slide: 'هيا بنا', onClick: startGenerate, busy: loading }}
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
