"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import ImageUploadField from '@/components/ImageUploadField'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import WizardShell, {
  AddButton, Block, Card, Chips, Field, Grid, Handoff, Input, Notice, Review, Textarea, Toggle, Uploads,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'
import { DAYS_AR, DEMO_BUILT_KEY, barberInputSchema, buildBarberContent, completeness, hoursFromGoogle, type BarberGoogle } from '@/utils/services/barber'
import { countryOfPhone, exampleFor, faqExample, tipFor } from '@/utils/services/wizard-help'
import { KIND, type KindText, type NicheKind } from '@/utils/services/kinds'
import type { ServiceHoursDay } from '@/utils/services/types'

// The real site component, loaded only when the owner opens the live preview.
const ServicesPreview = dynamic(() => import('@/components/theme/services/ServicesPreview'), { ssr: false })

type GoogleFound = BarberGoogle & { photos?: string[]; name?: string; contact?: { phone?: string; address?: string; city?: string; area?: string } }

/**
 * The barber's questions: the seven steps Anas approved on 2026-11-10
 * (sample «أسئلة الحلاق»). Reached from /theme/new/services after the owner
 * picks «صالون حلاقة» in the kind sheet.
 *
 * Links first (Anas, 2026-11-13): the owner pastes his Maps link and his
 * accounts, or skips. On «التالي» we read them, fill the questions, and show
 * him what we found to correct and confirm. What he says we read wrong goes
 * into content.meta.scrape_issue.
 *
 * Required: name, city, phone, one service. When links were read, his OK on
 * what we found.
 *
 * Social accounts are optional (spec 2026-11-12 §4.1). Instagram is read for
 * its photos, which are offered, never placed: the owner taps the ones to use.
 * Every question carries an example to take and, where the reviews showed
 * one, a tip (utils/services/wizard-help.ts). The review step shows how
 * complete the site is and what came from Google or Instagram, and the build
 * records which questions were answered (content.meta) so the questions can
 * be reordered by how often they are answered.
 *
 * Nothing here calls a model. The site is built from the answers and Google's
 * facts by buildBarberContent(), so a press of «ابنِ» costs nothing and two
 * presses give the same site.
 */

const nid = () => Math.random().toString(36).slice(2, 9)

type Barber = { id: string; name: string; role: string; photo: string; tags: string[] }
type Svc = { id: string; on: boolean; name: string; price: string; duration: string }
type Faq = { id: string; q: string; a: string; own?: boolean }
type Link = { id: string; label: string; url: string }

type Form = {
  name: string; latin: string; city: string; area: string; address: string; audience: string
  phone: string; whatsapp: string; email: string; maps_url: string; instagram: string; tiktok: string; snapchat: string; facebook: string
  ig_photos: string[]; ig_bio: string; extra: string
  links: Link[]; logo: string
  barbers: Barber[]
  services: Svc[]; currency: string
  mode: 'appointment' | 'walkin' | 'both'; wait: string; busy: string
  hours: ServiceHoursDay[]; hours_touched: boolean
  google_photos: string[]; hidden: string[]; hero: string; uploads: string[]
  faq: Faq[]
  terms: { label: string; text: string }[]
  look: string
  /** The owner said what we read from his links is right. */
  checked: boolean
  /** What the owner says we read wrong, kept for us to fix the reader. */
  scrape_issue: string
}

const WEEK: ServiceHoursDay[] = DAYS_AR.map((_, day) => ({ day, closed: false, periods: [{ open: '10:00', close: '22:00' }] }))

function initial(k: KindText): Form {
  return {
    name: '', latin: '', city: '', area: '', address: '', audience: k.audiences?.[0] || '',
    phone: '', whatsapp: '', email: '', maps_url: '', instagram: '', tiktok: '', snapchat: '', facebook: '',
    ig_photos: [], ig_bio: '', extra: '',
    links: [], logo: '',
    barbers: [{ id: nid(), name: '', role: k.ownerRole, photo: '', tags: [] }],
    services: k.defaults.map((s) => ({ ...s, price: '', id: nid() })), currency: '',
    mode: 'both', wait: '', busy: '',
    hours: WEEK, hours_touched: false,
    google_photos: [], hidden: [], hero: '', uploads: [],
    faq: k.faqs.map((q) => ({ id: nid(), q, a: '' })),
    terms: (k.terms || []).map((t) => ({ label: t.label, text: '' })),
    look: k.looks[0].id,
    checked: false, scrape_issue: '',
  }
}

const intl = (v: string) => /^(\+|00)\d[\d\s-]{6,}$/.test(v.trim())

/**
 * `demo`: the public try-it page (/demo/barber-build). Nobody is signed in,
 * so pictures stay in the page and «ابنِ» saves nothing: it builds the same
 * content with the same function and opens it in the demo editor.
 */
export default function NicheWizard({ kind = 'barber', onBack, demo = false }: { kind?: NicheKind; onBack?: () => void; demo?: boolean }) {
  const k = KIND[kind]
  const bare = k.place.replace(/^ال/, '')
  const mine = bare.replace(/ة$/, 'ت') + 'ك'
  const addOne = /ة$/.test(k.role) ? k.role : k.role + 'ًا'
  const LOOKS = k.looks
  const router = useRouter()
  const { toast } = useNotify()
  const [f, setF] = useState<Form>(() => initial(k))
  const [step, setStep] = useState(0)
  const [g, setG] = useState<GoogleFound | null>(null)
  const [peek, setPeek] = useState(false)
  const [gState, setGState] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle')
  const [gMsg, setGMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [skill, setSkill] = useState<Record<string, string>>({})
  const [igState, setIgState] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle')
  const [igMsg, setIgMsg] = useState('')
  // How the owner moves through the questions: first visit and time spent per step.
  const moves = useRef<{ step: string; at: number }[]>([])
  const started = useRef(Date.now())

  const up = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  const patch = <T extends { id: string }>(k: 'barbers' | 'services' | 'faq' | 'links', id: string, v: Partial<T>) =>
    setF((p) => ({ ...p, [k]: (p[k] as unknown as T[]).map((x) => (x.id === id ? { ...x, ...v } : x)) }))
  const drop = (k: 'barbers' | 'services' | 'faq' | 'links', id: string) =>
    setF((p) => ({ ...p, [k]: (p[k] as { id: string }[]).filter((x) => x.id !== id) }))

  async function fetchGoogle() {
    if (!f.maps_url.trim()) return
    setGState('busy'); setGMsg('')
    try {
      const res = await fetch('/api/niche/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: f.maps_url.trim(), name: f.name, city: f.city, demo }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGState('fail')
        setGMsg(j?.error === 'not_google_link' ? 'هذا ليس رابط خرائط جوجل. انسخه من زر «مشاركة» في الخرائط.'
          : j?.error === 'not_found' ? `لم نجد المكان من هذا الرابط. جرّب رابط «مشاركة» من صفحة ${k.place} في الخرائط، أو اكتب اسم ${k.place} والمدينة تحت ثم اضغط «اجلب من جوجل».`
          : j?.error === 'too_many' ? 'محاولات كثيرة. انتظر قليلًا ثم أعد.'
          : j?.error === 'sign_in' ? 'سجّل الدخول لنجلب بياناتك من جوجل.'
          : 'تعذّر الوصول إلى جوجل الآن. يمكنك المتابعة، ونعيد المحاولة عند البناء.')
        return
      }
      setG(j)
      setGState('ok')
      setF((p) => ({
        ...p,
        name: p.name || j.name || '',
        phone: p.phone || j.contact?.phone || '',
        whatsapp: p.whatsapp || (j.contact?.phone && /^\+/.test(j.contact.phone) ? j.contact.phone : ''),
        address: p.address || j.contact?.address || '',
        city: p.city || j.contact?.city || '',
        area: p.area || j.contact?.area || '',
        google_photos: j.photos || [],
        hero: p.hero || j.photos?.[0] || '',
        hours: !p.hours_touched && j.periods?.length ? hoursFromGoogle(j.periods) : p.hours,
      }))
      const bits = [
        j.rating ? `${Number(j.rating).toFixed(1)} من ${Number(j.count || 0).toLocaleString('ar')} تقييم` : null,
        j.reviews?.length ? `${j.reviews.length} تقييمات مكتوبة` : null,
        j.periods?.length ? 'أوقات الدوام' : null,
        j.photos?.length ? `${j.photos.length} صور` : null,
        j.contact?.phone ? 'الهاتف' : null,
        j.contact?.address ? 'العنوان' : null,
      ].filter(Boolean)
      setGMsg(bits.length ? `جلبنا من جوجل: ${bits.join(' · ')}. راجعها تحت، وعدّل ما تشاء.` : 'وجدنا المكان، لكن جوجل لا يحمل عنه تقييمات أو صورًا بعد.')
    } catch {
      setGState('fail'); setGMsg('تعذّر الوصول إلى جوجل الآن. يمكنك المتابعة.')
    }
  }

  async function fetchInstagram() {
    if (f.instagram.trim().length < 2 || igState === 'busy') return
    setIgState('busy'); setIgMsg('')
    try {
      const res = await fetch('/api/niche/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instagram: f.instagram.trim(), demo }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setIgState('fail')
        setIgMsg(j?.error === 'not_found' ? 'لم نجد هذا الحساب. تأكد من الاسم، أو تابع بدونه.'
          : j?.error === 'not_instagram' ? 'اكتب اسم الحساب مثل @yourname أو الصق رابطه.'
          : j?.error === 'too_many' ? 'محاولات كثيرة. تابع، ونقرأ الحساب عند البناء.'
          : 'تعذّر قراءة الحساب الآن. تابع، ونعيد المحاولة عند البناء.')
        return
      }
      setIgState('ok')
      setF((p) => ({ ...p, ig_photos: j.photos || [], ig_bio: j.bio || '' }))
      setIgMsg(j.photos?.length ? `وجدنا ${j.photos.length} صور في حسابك. اختر منها في خطوة الصور.` : 'وجدنا الحساب، لكن بلا صور نستطيع استعمالها.')
    } catch { setIgState('fail'); setIgMsg('تعذّر قراءة الحساب الآن. تابع بدونه.') }
  }

  useEffect(() => {
    const id = steps[step]?.id
    if (id && moves.current[moves.current.length - 1]?.step !== id) moves.current.push({ step: id, at: Date.now() - started.current })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    if (steps[step]?.id !== 'check') return
    if (gState === 'idle' && f.maps_url.trim().length > 8) fetchGoogle()
    if (igState === 'idle' && f.instagram.trim().length >= 2) fetchInstagram()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const country = countryOfPhone(f.phone || f.whatsapp)
  const tip = (q: string) => { const t = tipFor(kind, q, country); return t ? <TipLine text={t} /> : null }

  const services = f.services.filter((s) => s.on && s.name.trim())
  const barbers = f.barbers.filter((b) => b.name.trim())
  const ok = {
    basics: f.name.trim().length >= 2 && f.city.trim().length >= 2 && f.phone.trim().length >= 4
      && (!f.whatsapp.trim() || intl(f.whatsapp)),
    services: services.length > 0,
  }

  const photos = useMemo(() => {
    const all = [...f.google_photos.filter((u) => !f.hidden.includes(u)), ...f.uploads]
    return all.filter((u, i) => all.indexOf(u) === i)
  }, [f.google_photos, f.hidden, f.uploads])

  function payload() {
    const hero = photos.includes(f.hero) ? f.hero : photos[0]
    const rest = photos.filter((u) => u !== hero)
    return {
      kind,
      name: f.name.trim(), latin: f.latin.trim() || undefined, city: f.city.trim(), area: f.area.trim() || undefined,
      address: f.address.trim() || undefined, audience: f.audience || undefined, phone: f.phone.trim(),
      whatsapp: f.whatsapp.trim() || (intl(f.phone) ? f.phone.trim() : undefined), email: f.email.trim() || undefined,
      maps_url: f.maps_url.trim() || undefined, instagram: f.instagram.trim() || undefined,
      links: [...socialLinks(f), ...f.links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim(), url: /^https?:\/\//.test(l.url.trim()) ? l.url.trim() : 'https://' + l.url.trim() }))].slice(0, 10),
      barbers: barbers.map((b) => ({ name: b.name.trim(), role: b.role.trim() || undefined, photo: b.photo || undefined, tags: b.tags })),
      services: services.map((s) => ({ name: s.name.trim(), price: s.price.trim() || undefined, duration: s.duration.trim() || undefined })),
      currency: f.currency.trim() || undefined,
      booking: { mode: f.mode, wait: f.wait.trim() || undefined, busy: f.busy.trim() || undefined },
      hours: f.hours.map((d) => ({ ...d, periods: d.closed ? [] : d.periods.filter((p) => p.open && p.close) })),
      photos: { hero, side: rest[0], gallery: rest.slice(1) },
      terms: f.terms.filter((t) => t.text.trim()).map((t) => ({ label: t.label, text: t.text.trim() })),
      faq: f.faq.filter((q) => q.q.trim() && q.a.trim()).map((q) => ({ q: q.q.trim(), a: q.a.trim() })),
      logo: f.logo || undefined,
      extra: f.extra.trim() || undefined,
    }
  }

  /** The site as it stands now, for the live preview: blanks get a stand-in so it always draws. */
  const draft = useMemo(() => {
    if (!peek) return null
    const p = payload()
    const parsed = barberInputSchema.safeParse({
      ...p,
      name: p.name.length >= 2 ? p.name : `اسم ${k.place}`,
      city: p.city.length >= 2 ? p.city : 'مدينتك',
      phone: p.phone.length >= 4 ? p.phone : '0000',
      
      services: p.services.length ? p.services : [{ name: k.defaults[0]?.name || 'خدمة' }],
      faq: p.faq.filter((q) => q.q.length >= 4),
    })
    if (!parsed.success) return null
    const look = LOOKS.find((l) => l.id === f.look) || LOOKS[0]
    return { content: buildBarberContent(parsed.data, g || {}), colors: look.colors }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peek, f, g])

  useEffect(() => {
    if (!peek) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPeek(false) }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc) }
  }, [peek])

  function fail(msg: string, at?: number) {
    setError(msg); setErrorKey((k) => k + 1)
    if (at != null) setStep(at)
  }

  async function build() {
    setError(null)
    const at = (id: string) => Math.max(0, steps.findIndex((x) => x.id === id))
    if (!ok.basics) return fail('أكمل الأساسيات: الاسم، المدينة، والهاتف. رقم واتساب يُكتب بمفتاح الدولة.', at('check'))
    if (found && !f.checked) return fail('راجع ما جلبناه من روابطك، ثم أكّد أنه صحيح.', at('check'))
    if (!ok.services) return fail('اختر خدمة واحدة على الأقل.', at('services'))
    const parsed = barberInputSchema.safeParse(payload())
    if (!parsed.success) return fail('بعض الحقول غير صحيحة. راجع الأساسيات والخدمات.')
    setLoading(true)
    try {
      const content = buildBarberContent(parsed.data, g || { maps_url: parsed.data.maps_url })
      const look = LOOKS.find((l) => l.id === f.look) || LOOKS[0]
      const meta = { answered: answeredMap(), completeness: done.pct, moves: moves.current, ms: Date.now() - started.current, country, version: 2, links_read: { google: gState, instagram: igState }, checked: f.checked, scrape_issue: f.scrape_issue.trim() || undefined }
      if (demo) {
        const site = { business_type: 'services', niche: kind, style_preset: 'graphite', color_overrides: look.colors, services: content, input: parsed.data, meta }
        try { sessionStorage.setItem(DEMO_BUILT_KEY, JSON.stringify(site)) } catch { /* private mode: the editor opens the sample */ }
        router.push('/demo/editor?type=' + kind + '&built=1')
        return
      }
      const res = await fetch('/api/themes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: parsed.data.name,
          images: content.gallery.images.map((i) => i.url),
          primaryColor: look.colors.accent,
          secondaryColor: look.colors.background,
          content: {
            business_type: 'services', niche: kind, style_preset: 'graphite',
            color_overrides: look.colors, services: content, input: parsed.data, meta, google: g ? { place_id: g.place_id, rating: g.rating, count: g.count } : undefined,
            ...(parsed.data.logo ? { seo: { logo: parsed.data.logo } } : {}),
          },
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) { router.push('/login?mode=signup&next=/theme/new/services?kind=' + kind); return }
      if (res.status === 402) { toast({ type: 'warning', message: 'لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!res.ok || !j?.id) throw new Error(j?.error || 'فشل الحفظ')
      router.push(`/preview/services/${j.id}?created=1`)
    } catch (e: any) {
      setLoading(false)
      fail(e?.message || 'حدث خطأ أثناء بناء موقعك.')
    }
  }

  const reviewSnips = (g?.reviews || []).slice(0, 5)
  const sources: { from: string; what: string }[] = []
  if (gState === 'ok' && g) {
    const bits = [
      g.name ? 'الاسم' : '', g.contact?.phone ? 'الهاتف' : '', g.contact?.address ? 'العنوان' : '', g.periods?.length ? 'أوقات الدوام' : '',
      g.reviews?.length ? `${g.reviews.length.toLocaleString('ar')} تقييمات بأسماء كاتبيها` : '',
      f.google_photos.filter((u) => !f.hidden.includes(u)).length ? `${f.google_photos.filter((u) => !f.hidden.includes(u)).length.toLocaleString('ar')} صور` : '',
    ].filter(Boolean)
    if (bits.length) sources.push({ from: 'من جوجل', what: bits.join('، ') })
  }
  const igUsed = f.uploads.filter((u) => f.ig_photos.includes(u)).length
  if (igUsed) sources.push({ from: 'من إنستغرام', what: `${igUsed.toLocaleString('ar')} صور اخترتها` })
  const filledFaq = f.faq.filter((q) => q.q.trim() && q.a.trim()).length
  const priced = services.filter((s) => s.price.trim()).length
  const touchedServices = f.services.some((s) => s.price.trim() || !k.defaults.some((d) => d.name === s.name && d.on === s.on))
  const photoCount = photos.length
  const done = completeness(
    { services: services.map((s) => ({ name: s.name, price: s.price || undefined })), barbers: barbers.map((b) => ({ name: b.name, tags: [] })),
      booking: { mode: f.mode, wait: f.wait || undefined, busy: f.busy || undefined }, hours: f.hours_touched ? f.hours : [], faq: f.faq.filter((q) => q.a.trim()).map((q) => ({ q: q.q, a: q.a })), extra: f.extra },
    g || {}, { photos: photoCount, suggestedOnly: !touchedServices },
  )
  function answeredMap(): Record<string, number> {
    return {
      maps: gState === 'ok' ? 1 : f.maps_url.trim() ? 0.5 : 0,
      socials: [f.instagram, f.tiktok, f.snapchat, f.facebook].filter((x) => x.trim()).length,
      barbers: barbers.length,
      services_touched: touchedServices ? 1 : 0,
      prices: priced,
      wait: f.wait.trim() ? 1 : 0,
      busy: f.busy.trim() ? 1 : 0,
      hours_touched: f.hours_touched ? 1 : 0,
      uploads: f.uploads.length,
      faq: filledFaq,
      extra: f.extra.trim() ? 1 : 0,
      logo: f.logo ? 1 : 0,
    }
  }

  const readable = !!(f.maps_url.trim().length > 8 || f.instagram.trim().length >= 2)
  const reading = gState === 'busy' || igState === 'busy'
  const found = gState === 'ok' || igState === 'ok'
  const readList: { what: string; from: string; where: string }[] = []
  if (gState === 'ok' && g) {
    const gp = f.google_photos.length
    if (g.name) readList.push({ what: 'الاسم', from: 'من جوجل', where: 'تحت في «بيانات ' + k.place + '»' })
    if (g.contact?.phone) readList.push({ what: 'الهاتف', from: 'من جوجل', where: g.contact.phone })
    if (g.contact?.address) readList.push({ what: 'العنوان', from: 'من جوجل', where: g.contact.address })
    if (g.periods?.length) readList.push({ what: 'أوقات الدوام', from: 'من جوجل', where: 'في خطوة الحجز والأوقات، عدّلها هناك' })
    if (g.reviews?.length) readList.push({ what: `${g.reviews.length.toLocaleString('ar')} تقييمات بأسماء كاتبيها`, from: 'من جوجل', where: 'في قسم آراء الزبائن' })
    if (gp) readList.push({ what: `${gp.toLocaleString('ar')} صور`, from: 'من جوجل', where: 'في خطوة الصور، احذف ما لا يناسبك' })
  }
  if (igState === 'ok') {
    if (f.ig_photos.length) readList.push({ what: `${f.ig_photos.length.toLocaleString('ar')} صور`, from: 'من إنستغرام', where: 'في خطوة الصور، اختر منها ما تريد' })
    if (f.ig_bio) readList.push({ what: 'نبذة الحساب', from: 'من إنستغرام', where: f.ig_bio.length > 120 ? f.ig_bio.slice(0, 117) + '…' : f.ig_bio })
  }

  const steps: WizardStep[] = [
    {
      id: 'links', title: 'روابطك أولًا', optional: true,
      sub: `ألصق روابط ${mine}: خرائط جوجل، وحساباتك. نقرأها ونملأ الأسئلة عنك: الاسم والهاتف والعنوان والأوقات والتقييمات والصور. ليس عندك روابط؟ اضغط «تخطَّ» واكتبها بنفسك.`,
      complete: true,
      body: (
        <Grid>
          <Block title="خرائط جوجل" optional hint={`افتح ${mine} في خرائط جوجل، اضغط «مشاركة»، وانسخ الرابط. منه نأخذ أكثر شيء.`}>
            <Input dir="ltr" aria-label={`رابط ${k.place} على خرائط جوجل`} value={f.maps_url} onChange={(e) => { up('maps_url', e.target.value); setGState('idle'); up('checked', false) }} placeholder="https://maps.app.goo.gl/…" />
          </Block>
          <Block title="حساباتك" optional hint={`إن كان لـ${mine} حسابات. نقرأ صور إنستغرام ونعرضها عليك لتختار منها.`}>
            {tip('socials')}
            <Grid>
              <Field label="إنستغرام"><Input dir="ltr" value={f.instagram} onChange={(e) => { up('instagram', e.target.value); setIgState('idle'); up('checked', false) }} placeholder="@yourname" /></Field>
              <Field label="تيك توك"><Input dir="ltr" value={f.tiktok} onChange={(e) => up('tiktok', e.target.value)} placeholder="@yourname" /></Field>
              <Field label="سناب شات"><Input dir="ltr" value={f.snapchat} onChange={(e) => up('snapchat', e.target.value)} placeholder="yourname" /></Field>
              <Field label="فيسبوك"><Input dir="ltr" value={f.facebook} onChange={(e) => up('facebook', e.target.value)} placeholder="facebook.com/yourpage" /></Field>
            </Grid>
          </Block>
          <Block title="روابط أخرى" optional hint="أي صفحة لك: تطبيق حجز، موقع قديم، تصميم تحبه.">
            <div className="zb-list">
              {f.links.map((l) => (
                <Card key={l.id} title={l.label || 'رابط'} onRemove={() => drop('links', l.id)} removeLabel="حذف الرابط">
                  <Grid>
                    <Field label="اسمه"><Input value={l.label} onChange={(e) => patch<Link>('links', l.id, { label: e.target.value })} placeholder="تطبيق الحجز" /></Field>
                    <Field label="الرابط"><Input dir="ltr" value={l.url} onChange={(e) => patch<Link>('links', l.id, { url: e.target.value })} placeholder="https://…" /></Field>
                  </Grid>
                </Card>
              ))}
            </div>
            <AddButton onClick={() => up('links', [...f.links, { id: nid(), label: '', url: '' }])}>أضف رابطًا</AddButton>
          </Block>
          {readable ? <Notice tone="accent">اضغط «التالي». نقرأ روابطك ونعرض عليك ما وجدناه لتراجعه.</Notice> : null}
        </Grid>
      ),
    },
    {
      id: 'check', title: found ? 'راجع ما وجدناه' : `بيانات ${k.place}`,
      sub: found ? 'هذا ما قرأناه من روابطك، وبه ملأنا الأسئلة. راجعه، وصحّح ما يلزم، ثم أكّد.' : reading ? 'نقرأ روابطك الآن…' : `اكتب بيانات ${k.place}. نضعها في الموقع كما هي.`,
      complete: ok.basics && (!found || f.checked),
      note: found && !f.checked ? 'أكّد أن ما جلبناه صحيح.' : 'الاسم، والمدينة، والهاتف مطلوبة.',
      body: (
        <Grid>
          {reading ? <Notice tone="accent">{gState === 'busy' ? 'نقرأ خرائط جوجل… ' : ''}{igState === 'busy' ? 'نقرأ إنستغرام… ' : ''}يأخذ هذا ثواني.</Notice> : null}
          {gMsg && gState === 'fail' ? <Notice tone="bad">{gMsg}</Notice> : null}
          {igMsg && igState === 'fail' ? <Notice tone="bad">{igMsg}</Notice> : null}
          {gState === 'fail' && f.maps_url.trim() ? <button type="button" className="zb-chip" onClick={fetchGoogle}>أعد قراءة رابط جوجل</button> : null}
          {found ? (
            <Block title="ما وجدناه">
              {gState === 'ok' && g ? (
                <div className="bw-found">
                  {g.photos?.[0] ? <img src={g.photos[0]} alt="" /> : <span className="bw-found-ph" aria-hidden>{(f.name || g.name || k.place).slice(0, 1)}</span>}
                  <div>
                    <b>{g.name || f.name}</b>
                    {g.rating ? <span className="bw-stars">★ {Number(g.rating).toFixed(1)} <small>· {Number(g.count || 0).toLocaleString('ar')} تقييم</small></span> : null}
                    {g.contact?.address ? <small>{g.contact.address}</small> : null}
                  </div>
                </div>
              ) : null}
              <ul className="bw-src" style={{ marginTop: 12 }}>
                {readList.map((s) => <li key={s.what}><b>{s.what} <small className="bw-from">{s.from}</small></b><span>{s.where}</span></li>)}
              </ul>
              {[...f.google_photos, ...f.ig_photos].length ? (
                <div className="bw-strip" aria-label="صور وجدناها">
                  {[...f.google_photos, ...f.ig_photos].slice(0, 10).map((u) => <img key={u} src={u} alt="" loading="lazy" />)}
                </div>
              ) : null}
            </Block>
          ) : null}
          <Block title={`بيانات ${k.place}`} hint={gState === 'ok' ? 'جلبناها من جوجل. عدّل ما يلزم.' : undefined}>
            <Grid>
              <Field label={`اسم ${k.place}`} required>
                <Input value={f.name} onChange={(e) => up('name', e.target.value)} placeholder={k.label} />
              </Field>
              <Field label="الاسم بالإنجليزية" hint="إن كان على اللافتة.">
                <Input dir="ltr" value={f.latin} onChange={(e) => up('latin', e.target.value)} placeholder="Name on the sign" />
              </Field>
              <Field label="المدينة" required>
                <Input value={f.city} onChange={(e) => up('city', e.target.value)} placeholder="عمّان" />
              </Field>
              <Field label="الحي أو المنطقة">
                <Input value={f.area} onChange={(e) => up('area', e.target.value)} placeholder="تلاع العلي" />
              </Field>
              <Field label="العنوان" wide>
                <Input value={f.address} onChange={(e) => up('address', e.target.value)} placeholder="شارع عبدالله العزب، تلاع العلي" />
              </Field>
              <Field label="الهاتف" required>
                <Input dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => up('phone', e.target.value)} placeholder="+962 79 752 7688" />
              </Field>
              <Field label="واتساب" hint="بمفتاح الدولة، مثل ‎+962. يصل إليه طلب الحجز وسؤال السعر.">
                <Input dir="ltr" inputMode="tel" value={f.whatsapp} onChange={(e) => up('whatsapp', e.target.value)} placeholder="+962 79 752 7688" />
              </Field>
            </Grid>
          </Block>
          {k.audiences?.length ? (
            <Block title={`لمن ${k.place}؟`}>
              <Chips options={k.audiences.map((a) => ({ id: a, label: a }))} value={f.audience} onChange={(v) => up('audience', v || k.audiences![0])} allowNone={false} />
            </Block>
          ) : null}
          <Block title="الشعار" optional hint={`إن كان لـ${mine} شعار. بدونه يظهر الاسم وحده.`}>
            <div className="bw-logo"><ImageUploadField local={demo} value={f.logo} onChange={(u) => up('logo', u)} aspect="square" /></div>
          </Block>
          {found ? (
            <Block title="هل ما جلبناه صحيح؟">
              <Toggle on={f.checked} onChange={(v) => up('checked', v)}>راجعت ما جلبناه، وهو صحيح</Toggle>
              <div style={{ marginTop: 12 }}>
                <Field label="في شيء خطأ فيما قرأناه؟" hint="اكتبه لنا. نصلحه في موقعك، ونحسّن طريقة القراءة.">
                  <Textarea rows={3} value={f.scrape_issue} onChange={(e) => up('scrape_issue', e.target.value)} placeholder="مثال: الصور ليست لمحلي، أو الأوقات قديمة." />
                </Field>
              </div>
            </Block>
          ) : null}
        </Grid>
      ),
    },
    {
      id: 'barbers', title: k.team, sub: `الزبون يطلب ${k.one} بالاسم. أضف كل واحد، وصورته إن أردت. بدون صورة يظهر الاسم بخط كبير، ولا نضع وجهًا غريبًا مكانه.`,
      complete: barbers.length > 0, optional: true,
      body: (
        <Grid>
          {tip('barbers')}
          {reviewSnips.length ? (
            <Block title="من تقييماتك على جوجل" hint={`الأسماء التي يذكرها زبائنك. سنضع كلام الزبون تحت اسم ${k.one}.`}>
              <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
                {reviewSnips.map((r, i) => <li key={i} style={{ fontSize: 14.5, opacity: 0.85 }}>«{r.text.length > 160 ? r.text.slice(0, 157) + '…' : r.text}» · {r.name}</li>)}
              </ul>
            </Block>
          ) : null}
          <Block>
            <div className="zb-list">
              {f.barbers.map((b, i) => (
                <Card key={b.id} title={b.name || `${k.one} ${i + 1}`} onRemove={f.barbers.length > 1 ? () => drop('barbers', b.id) : undefined} removeLabel="حذف">
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,120px) minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
                    <ImageUploadField local={demo} value={b.photo} onChange={(u) => patch<Barber>('barbers', b.id, { photo: u })} aspect="square" label="الصورة" />
                    <Grid>
                      <Field label="الاسم"><Input value={b.name} onChange={(e) => patch<Barber>('barbers', b.id, { name: e.target.value })} placeholder="الاسم الأول" /></Field>
                      <Field label="صفته"><Input value={b.role} onChange={(e) => patch<Barber>('barbers', b.id, { role: e.target.value })} placeholder={k.role} /></Field>
                    </Grid>
                  </div>
                  <p className="zb-lab" style={{ margin: '12px 0 6px' }}>بماذا يشتهر؟</p>
                  <div className="zb-chips">
                    {[...k.tags, ...b.tags.filter((t) => !k.tags.includes(t))].map((t) => {
                      const on = b.tags.includes(t)
                      return <button key={t} type="button" className="zb-chip" data-on={on ? 'true' : undefined} aria-pressed={on} onClick={() => patch<Barber>('barbers', b.id, { tags: on ? b.tags.filter((x) => x !== t) : [...b.tags, t].slice(0, 6) })}>{t}</button>
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Input value={skill[b.id] || ''} maxLength={24} placeholder="مهارة أخرى، مثل: قص بالمقص" aria-label={`مهارة أخرى لـ${b.name || k.one}`}
                      onChange={(e) => setSkill((p) => ({ ...p, [b.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(b) } }} />
                    <button type="button" className="zb-chip" style={{ flex: '0 0 auto' }} disabled={!(skill[b.id] || '').trim() || b.tags.length >= 6} onClick={() => addSkill(b)}>أضف</button>
                  </div>
                  {b.tags.length >= 6 ? <p style={{ fontSize: 13.5, opacity: 0.7, margin: '6px 0 0' }}>ست مهارات كحد أقصى لكل {k.one}.</p> : null}
                </Card>
              ))}
            </div>
            <AddButton onClick={() => up('barbers', [...f.barbers, { id: nid(), name: '', role: k.role, photo: '', tags: [] }])}>أضف {addOne}</AddButton>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'services', title: `${k.services} والأسعار`, sub: `اختر ما تقدّمه، وأضف ما ليس في القائمة. السعر اختياري: بدونه يسألك الزبون على واتساب.${k.priceHint ? ' اكتب ' + k.priceHint + '.' : ''}`,
      complete: ok.services, note: 'اختر خدمة واحدة على الأقل.',
      body: (
        <Grid>
          {tip('services')}
          <Block>
            <div className="zb-list">
              {f.services.map((s) => (
                <div key={s.id} className="bw-svc">
                  <Toggle on={s.on} onChange={(v) => patch<Svc>('services', s.id, { on: v })}><span className="sr-only">{s.name}</span></Toggle>
                  <Input value={s.name} onChange={(e) => patch<Svc>('services', s.id, { name: e.target.value, on: true })} placeholder="اسم الخدمة" aria-label="اسم الخدمة" />
                  <div className="bw-pd">
                    <Input value={s.price} inputMode="decimal" onChange={(e) => patch<Svc>('services', s.id, { price: e.target.value, on: true })} placeholder="السعر" aria-label={`سعر ${s.name}`} disabled={!s.on} />
                    <Input value={s.duration} onChange={(e) => patch<Svc>('services', s.id, { duration: e.target.value })} placeholder="المدة" aria-label={`مدة ${s.name}`} disabled={!s.on} />
                  </div>
                  <button type="button" className="zb-icon" aria-label={`حذف ${s.name || 'الخدمة'}`} onClick={() => drop('services', s.id)}>×</button>
                </div>
              ))}
            </div>
            <AddButton onClick={() => up('services', [...f.services, { id: nid(), on: true, name: '', price: '', duration: '' }])}>أضف خدمة</AddButton>
          </Block>
          <Field label="العملة" hint="تُكتب بعد كل سعر.">
            <Input value={f.currency} onChange={(e) => up('currency', e.target.value)} placeholder="د.أ" />
          </Field>
          {f.terms.length ? (
            <Block title="الشروط" optional hint="ما يسأل عنه الزبون قبل أن يدفع. الفارغ لا يظهر.">
              <Grid>
                {f.terms.map((t, i) => (
                  <Field key={t.label} label={t.label}>
                    <Input value={t.text} onChange={(e) => setF((p) => ({ ...p, terms: p.terms.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) }))} placeholder={k.terms?.[i]?.placeholder} />
                  </Field>
                ))}
              </Grid>
            </Block>
          ) : null}
        </Grid>
      ),
    },
    {
      id: 'booking', title: 'الحجز والأوقات', sub: 'كيف يأتيك الزبون، ومتى تفتح. جلبنا أوقاتك من جوجل إن وُجدت؛ عدّلها كما تشاء.',
      complete: true,
      body: (
        <Grid>
          <Block title="كيف يأتيك الزبون؟">
            <Chips allowNone={false} value={f.mode} onChange={(v) => up('mode', v as Form['mode'])}
              options={[{ id: 'both', label: 'بموعد وبدون موعد' }, { id: 'appointment', label: 'بموعد فقط' }, { id: 'walkin', label: 'بدون موعد، بالدور' }]} />
          </Block>
          {tip('booking')}
          <Field label="كم ينتظر الزبون عادة؟"><Input value={f.wait} onChange={(e) => up('wait', e.target.value)} placeholder="اكتب بكلامك" /><Example text={exampleFor(kind, 'wait')} on={!f.wait} onUse={(v) => up('wait', v)} /></Field>
          <Field label="متى تكون الزحمة؟"><Input value={f.busy} onChange={(e) => up('busy', e.target.value)} placeholder="اكتب بكلامك" /><Example text={exampleFor(kind, 'busy')} on={!f.busy} onUse={(v) => up('busy', v)} /></Field>
          <Block title="أوقات الدوام" hint="لكل يوم فترة أو أكثر. «مغلق» يخفي اليوم من الحجز.">
            <div style={{ display: 'grid', gap: 10 }}>
              {f.hours.map((d, di) => (
                <div key={d.day} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', opacity: d.closed ? 0.6 : 1 }}>
                  <span style={{ width: 76, fontWeight: 600 }}>{DAYS_AR[d.day]}</span>
                  {d.closed ? <span style={{ flex: '1 1 auto' }}>مغلق</span> : d.periods.map((p, pi) => (
                    <span key={pi} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <Input type="time" value={p.open} onChange={(e) => setHour(di, pi, { open: e.target.value })} aria-label={`يفتح ${DAYS_AR[d.day]}`} style={{ width: 118 }} />
                      <span aria-hidden>–</span>
                      <Input type="time" value={p.close === '24:00' ? '00:00' : p.close} onChange={(e) => setHour(di, pi, { close: e.target.value === '00:00' ? '24:00' : e.target.value })} aria-label={`يغلق ${DAYS_AR[d.day]}`} style={{ width: 118 }} />
                      {pi > 0 ? <button type="button" className="zb-icon" aria-label="حذف الفترة" onClick={() => setDay(di, { periods: d.periods.filter((_, x) => x !== pi) })}>×</button> : null}
                    </span>
                  ))}
                  {!d.closed && d.periods.length < 3 ? <button type="button" className="zb-chip" onClick={() => setDay(di, { periods: [...d.periods, { open: '16:00', close: '22:00' }] })}>+ فترة</button> : null}
                  <button type="button" className="zb-chip" data-on={d.closed ? 'true' : undefined} aria-pressed={!!d.closed} onClick={() => setDay(di, d.closed ? { closed: false, periods: d.periods.length ? d.periods : [{ open: '10:00', close: '22:00' }] } : { closed: true })}>{d.closed ? 'مفتوح؟' : 'مغلق'}</button>
                </div>
              ))}
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'photos', title: `صور ${k.place}`, sub: 'هذه صورك على جوجل. أخفِ ما لا تريده، واختر صورة الواجهة، وأضف صورًا من عندك.',
      complete: photos.length > 0, optional: true,
      body: (
        <Grid>
          {tip('photos')}
          {f.ig_photos.length ? (
            <Block title="من إنستغرام" hint="وجدناها في حسابك. اضغط الصورة التي تريدها في موقعك، ثم اختر منها صورة الواجهة.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8 }}>
                {f.ig_photos.map((u) => {
                  const on = f.uploads.includes(u)
                  return (
                    <button key={u} type="button" aria-pressed={on} onClick={() => up('uploads', on ? f.uploads.filter((x) => x !== u) : [...f.uploads, u].slice(0, 12))}
                      style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', outline: on ? '3px solid var(--violet,#E2532A)' : 'none', outlineOffset: 2 }}>
                      <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: on ? 1 : 0.8 }} />
                      {on ? <span style={{ position: 'absolute', insetInlineStart: 6, top: 6, background: 'var(--violet,#E2532A)', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 99 }}>في موقعك</span> : null}
                    </button>
                  )
                })}
              </div>
            </Block>
          ) : null}
          {f.google_photos.length ? (
            <Block title="من جوجل" hint="اضغط صورة لتجعلها صورة الواجهة. «إخفاء» يبعدها عن الموقع.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                {f.google_photos.map((u) => {
                  const hid = f.hidden.includes(u)
                  const hero = f.hero === u && !hid
                  return (
                    <div key={u} style={{ display: 'grid', gap: 6 }}>
                      <button type="button" onClick={() => !hid && up('hero', u)} aria-label={hero ? 'صورة الواجهة' : 'اجعلها صورة الواجهة'} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', outline: hero ? '3px solid var(--violet,#E2532A)' : 'none', outlineOffset: 2, opacity: hid ? 0.35 : 1 }}>
                        <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {hero ? <span style={{ position: 'absolute', insetInlineStart: 6, top: 6, background: 'var(--violet,#E2532A)', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 99 }}>الواجهة</span> : null}
                      </button>
                      <Toggle on={hid} onChange={(v) => up('hidden', v ? [...f.hidden, u] : f.hidden.filter((x) => x !== u))}>إخفاء</Toggle>
                    </div>
                  )
                })}
              </div>
            </Block>
          ) : (
            <Block><Notice>{gState === 'ok' ? `لم نجد صورًا لـ${mine} على جوجل. أضف صورك هنا.` : 'ضع رابط خرائط جوجل في الخطوة الأولى لنجلب صورك، أو أضفها هنا.'}</Notice></Block>
          )}
          <Block title="صور من عندك" optional hint="الكراسي، الواجهة، قصّات من شغلكم. صور حقيقية فقط.">
            <Uploads cols={4}>
              {[...f.uploads, ''].slice(0, 8).map((u, i) => (
                <ImageUploadField local={demo} key={i + ':' + u} value={u} aspect="square" label={`صورة ${i + 1}`}
                  onChange={(nu) => up('uploads', nu ? (u ? f.uploads.map((x) => (x === u ? nu : x)) : [...f.uploads, nu]) : f.uploads.filter((x) => x !== u))} />
              ))}
            </Uploads>
          </Block>
          {f.uploads.length ? (
            <Block title="صورة الواجهة من صورك">
              <div className="zb-chips">{f.uploads.map((u, i) => <button key={u} type="button" className="zb-chip" data-on={f.hero === u ? 'true' : undefined} onClick={() => up('hero', u)}>صورة {i + 1}</button>)}</div>
            </Block>
          ) : null}
        </Grid>
      ),
    },
    {
      id: 'faq', title: 'أسئلة زبائنك', sub: 'أجب عمّا تعرف. السؤال بلا جواب لا يظهر في الموقع. أضف أي سؤال يسأله زبائنك.',
      complete: filledFaq > 0, optional: true,
      body: (
        <Grid>
          {tip('faq')}
          <Block>
            <div className="zb-list">
              {f.faq.map((q) => (
                <Card key={q.id} title={q.own ? (q.q || 'سؤالك') : q.q} onRemove={() => drop('faq', q.id)} removeLabel="حذف السؤال">
                  {q.own ? <Field label="السؤال" wide><Input value={q.q} onChange={(e) => patch<Faq>('faq', q.id, { q: e.target.value })} placeholder="هل عندكم عروض للطلاب؟" /></Field> : null}
                  <Field label="الجواب" wide><Textarea rows={2} value={q.a} onChange={(e) => patch<Faq>('faq', q.id, { a: e.target.value })} placeholder="جوابك بكلامك" /><Example text={faqExample(kind, q.q)} on={!q.a} onUse={(v) => patch<Faq>('faq', q.id, { a: v })} /></Field>
                </Card>
              ))}
            </div>
            <AddButton onClick={() => up('faq', [...f.faq, { id: nid(), q: '', a: '', own: true }])}>أضف سؤالًا آخر</AddButton>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'review', title: 'المراجعة', sub: 'اختر شكل الألوان، وراجع ما سنبني عليه.',
      complete: ok.basics && ok.services, note: 'ينقص شيء مطلوب في خطوة سابقة.',
      body: (
        <Grid>
          <Block title={`موقعك مكتمل ${done.pct.toLocaleString('ar')}٪`} hint={done.next ? `${done.next.label} ليرتفع إلى ${Math.min(100, done.pct + done.next.gain).toLocaleString('ar')}٪. الموقع يعمل ويبدو كاملًا الآن أيضًا، وتستطيع الإضافة لاحقًا من المحرر.` : 'كل شيء جاهز.'}>
            <div className="bw-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={done.pct} aria-label="اكتمال الموقع"><i style={{ width: `${done.pct}%` }} /></div>
          </Block>
          {sources.length ? (
            <Block title="ما أخذناه من حساباتك" hint="استعملناه في موقعك. عدّل أي شيء منه هنا أو من المحرر بعد البناء.">
              <ul className="bw-src">{sources.map((x) => <li key={x.from}><b>{x.from}</b><span>{x.what}</span></li>)}</ul>
            </Block>
          ) : null}
          <Block title="هل تريد أن تضيف شيئًا آخر؟" optional hint="اكتب بكلامك أي شيء يميّز محلك. نرتّبه ونضعه في المكان المناسب، ويبقى في المحرر لتعدّله.">
            <Textarea rows={3} value={f.extra} onChange={(e) => up('extra', e.target.value)} placeholder="اكتب بكلامك" />
            <Example text={exampleFor(kind, 'extra')} on={!f.extra} onUse={(v) => up('extra', v)} />
          </Block>
          <Block title="الألوان" hint="تستطيع تغييرها لاحقًا من المحرر.">
            <div className="bw-lrow" role="radiogroup" aria-label="الألوان">
              {LOOKS.map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={f.look === l.id} onClick={() => up('look', l.id)} className="bw-lr">
                  <span className="bw-lr-dots" aria-hidden>{[l.colors.background, l.colors.text, l.colors.accent].map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                  <b>{l.name}</b>
                  <span className="bw-lr-tick" aria-hidden>{f.look === l.id ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Block>
          <Review
            facts={[
              { label: k.team, value: barbers.length },
              { label: 'الخدمات', value: `${services.length}${priced ? ` · ${priced} بسعر` : ''}` },
              { label: 'تقييمات جوجل', value: g?.reviews?.length || 0 },
              { label: 'الصور', value: photos.length },
            ]}
            recap={[
              { label: bare, value: [f.name, f.area, f.city].filter(Boolean).join('، ') },
              { label: 'الهاتف', value: f.phone },
              { label: 'الحسابات', value: [f.instagram, f.tiktok, f.snapchat, f.facebook].filter((x) => x.trim()).join('، ') },
              { label: k.team, value: barbers.map((b) => b.name).join('، ') },
              { label: 'الخدمات', value: services.map((s) => s.name + (s.price ? ` (${s.price}${f.currency ? ' ' + f.currency : ''})` : '')).join('، ') },
              { label: 'أسئلة مُجابة', value: filledFaq ? String(filledFaq) : '' },
            ]}
          >
            <Handoff title={`جاهز لبناء موقع ${k.place}.`} body={demo ? 'هذه تجربة: نبني الموقع من إجاباتك وتقييماتك على جوجل، ثم يفتح في المحرر لتجرّب التعديل. لا يُحفظ شيء.' : 'نبنيه من إجاباتك وتقييماتك على جوجل، بلا كلام مخترع. ثم تعدّل أي شيء من المحرر.'} />
          </Review>
        </Grid>
      ),
    },
  ]

  function addSkill(b: Barber) {
    const t = (skill[b.id] || '').trim().slice(0, 24)
    if (!t || b.tags.includes(t) || b.tags.length >= 6) return
    patch<Barber>('barbers', b.id, { tags: [...b.tags, t] })
    setSkill((p) => ({ ...p, [b.id]: '' }))
  }
  function setDay(i: number, v: Partial<ServiceHoursDay>) {
    setF((p) => ({ ...p, hours_touched: true, hours: p.hours.map((d, x) => (x === i ? { ...d, ...v } : d)) }))
  }
  function setHour(i: number, pi: number, v: Partial<{ open: string; close: string }>) {
    setF((p) => ({ ...p, hours_touched: true, hours: p.hours.map((d, x) => (x === i ? { ...d, periods: d.periods.map((q, y) => (y === pi ? { ...q, ...v } : q)) } : d)) }))
  }


  return (
    <>
      <WizardShell
        eyebrow={`قالب الخدمات · ${k.label}`}
        title={`ابنِ موقع ${mine}.`}
        sub={<>ابدأ بروابطك. نقرأها ونملأ الأسئلة عنك، وأنت تراجع وتؤكد. {onBack ? <button type="button" onClick={onBack} style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>ليس {k.label}؟</button> : null}</>}
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct: done.pct, label: 'اكتمال موقعك' }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'نبني موقعك…' : demo ? 'ابنِ وافتح المحرر' : `ابنِ موقع ${k.place}`, slide: 'هيا بنا', onClick: build, busy: loading }}
      />
      <GenerationOverlay open={loading} />
      <button type="button" className="bw-peek" onClick={() => setPeek(true)} aria-haspopup="dialog">
        <span aria-hidden>◉</span> شاهد موقعك الآن
      </button>
      {peek ? createPortal(
        <div className="bw-sheet" role="dialog" aria-modal="true" aria-label="معاينة موقعك">
          <div className="bw-sheet-top">
            <span>معاينة حيّة · تتغيّر مع كل إجابة</span>
            <button type="button" onClick={() => setPeek(false)} autoFocus>رجوع إلى الأسئلة</button>
          </div>
          <div className="bw-sheet-site">
            {draft ? <ServicesPreview content={draft.content as any} colorOverrides={draft.colors} logo={f.logo || undefined} /> : <p style={{ padding: 24 }}>أكمل الاسم والخدمات لنرسم موقعك.</p>}
          </div>
        </div>, document.body,
      ) : null}
      <style dangerouslySetInnerHTML={{ __html: '.bw-g{display:flex;gap:8px}.bw-gbtn{flex:0 0 auto}.bw-found{display:flex;gap:12px;align-items:center;margin-top:12px;padding:10px;border-radius:14px;border:1px solid var(--line,rgba(127,127,127,.2));background:rgba(127,127,127,.06)}.bw-found img,.bw-found-ph{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:0 0 auto;display:grid;place-items:center;font-size:26px;background:rgba(127,127,127,.15)}.bw-found div{display:grid;gap:2px;min-width:0}.bw-found b{font-size:16.5px}.bw-found small{opacity:.75;font-size:14.5px}.bw-stars{color:#E8B04B;font-size:15px}.bw-logo{width:120px}.bw-from{font-weight:500;opacity:.7;font-size:12.5px;margin-inline-start:6px}.bw-strip{display:flex;gap:8px;overflow-x:auto;margin-top:12px;padding-bottom:4px}.bw-strip img{width:84px;height:84px;object-fit:cover;border-radius:10px;flex:0 0 auto}.bw-tip{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:12px;background:color-mix(in srgb,var(--violet,#E2532A) 9%,transparent);border:1px solid color-mix(in srgb,var(--violet,#E2532A) 22%,transparent);font-size:14.5px;line-height:1.7}.bw-tip b{flex:0 0 auto}.bw-ex{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;font-size:13.5px;opacity:.85}.bw-ex button{all:unset;cursor:pointer;font-weight:700;color:var(--violet,#E2532A);text-decoration:underline;text-underline-offset:3px}.bw-ex button:focus-visible{outline:2px solid var(--violet,#E2532A);outline-offset:2px}.bw-meter{height:10px;border-radius:99px;background:rgba(127,127,127,.18);overflow:hidden}.bw-meter i{display:block;height:100%;border-radius:99px;background:var(--violet,#E2532A);transition:width .4s}.bw-src{list-style:none;margin:0;padding:0;display:grid;gap:8px}.bw-src li{display:grid;gap:2px;padding:10px 14px;border-radius:12px;border:1px solid var(--line,rgba(127,127,127,.22))}.bw-src b{font-size:14.5px}.bw-src span{font-size:14px;opacity:.8}.bw-lr-tick{color:var(--acc,#E2532A);font-weight:700}.bw-lrow{display:grid;gap:8px}.bw-lr{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;min-height:56px;padding:10px 16px;border-radius:14px;border:1px solid var(--line,rgba(127,127,127,.22));background:var(--card2,rgba(127,127,127,.05))}.bw-lr[aria-checked=true]{border-color:var(--acc,#E2532A);box-shadow:0 0 0 1px var(--acc,#E2532A)}.bw-lr-dots{display:flex}.bw-lr-dots i{width:26px;height:26px;border-radius:99px;border:2px solid var(--card,#fff);margin-inline-start:-8px;box-shadow:0 0 0 1px rgba(127,127,127,.25)}.bw-lr-dots i:first-child{margin-inline-start:0}.bw-peek{position:fixed;z-index:60;inset-inline-start:50%;transform:translateX(50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));display:inline-flex;gap:8px;align-items:center;min-height:46px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:#16130f;color:#f6f1ea;font:600 15px inherit;box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer}[dir=ltr] .bw-peek{transform:translateX(-50%)}.bw-peek span{color:#E2532A}.bw-sheet{position:fixed;inset:0;z-index:2147483000;background:#0b0b0b;overflow:auto;overscroll-behavior:contain}.bw-sheet-top{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px max(14px,env(safe-area-inset-left,0px));background:#16130f;color:#f6f1ea;font-size:14.5px;border-bottom:1px solid rgba(255,255,255,.12)}.bw-sheet-top button{min-height:40px;padding:0 16px;border-radius:999px;border:0;background:#f6f1ea;color:#16130f;font-weight:700;cursor:pointer}.bw-sheet-site{position:relative}.zb-root{padding-bottom:72px}.bw-svc{display:grid;grid-template-columns:auto minmax(0,1.4fr) minmax(0,1.6fr) auto;gap:8px;align-items:center}.bw-pd{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bw-svc .zb-chip.zb-toggle{padding-inline:10px}@media(max-width:640px){.bw-svc{grid-template-columns:auto minmax(0,1fr) auto;row-gap:6px;padding-bottom:10px;border-bottom:1px solid var(--line,rgba(127,127,127,.15))}.bw-pd{grid-column:2/3;grid-row:2}}' }} />
    </>
  )
}

/** A tip from real reviews, under a question. */
function TipLine({ text }: { text: string }) {
  return <p className="bw-tip"><b aria-hidden>💡</b><span>{text}</span></p>
}

/** «مثال: …» under a field, with one tap to take it and then edit it. */
function Example({ text, on, onUse }: { text?: string; on: boolean; onUse: (v: string) => void }) {
  if (!text || !on) return null
  return <span className="bw-ex"><span>مثال: {text}</span><button type="button" onClick={() => onUse(text)}>استعمل المثال</button></span>
}

/** TikTok, Snapchat and Facebook as the site's extra links. */
function socialLinks(f: { tiktok: string; snapchat: string; facebook: string }): { label: string; url: string }[] {
  const h = (v: string) => v.trim().replace(/^@/, '')
  const out: { label: string; url: string }[] = []
  if (f.tiktok.trim()) out.push({ label: 'تيك توك', url: /tiktok\.com/i.test(f.tiktok) ? (/^https?:/.test(f.tiktok.trim()) ? f.tiktok.trim() : 'https://' + f.tiktok.trim()) : `https://www.tiktok.com/@${h(f.tiktok)}` })
  if (f.snapchat.trim()) out.push({ label: 'سناب شات', url: /snapchat\.com/i.test(f.snapchat) ? (/^https?:/.test(f.snapchat.trim()) ? f.snapchat.trim() : 'https://' + f.snapchat.trim()) : `https://www.snapchat.com/add/${h(f.snapchat)}` })
  if (f.facebook.trim()) out.push({ label: 'فيسبوك', url: /^https?:/.test(f.facebook.trim()) ? f.facebook.trim() : /facebook\.com|fb\.com/i.test(f.facebook) ? 'https://' + f.facebook.trim() : `https://www.facebook.com/${h(f.facebook)}` })
  return out
}
