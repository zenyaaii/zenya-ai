"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploadField from '@/components/ImageUploadField'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import WizardShell, {
  AddButton, Block, Card, Chips, Field, Grid, Handoff, Input, Notice, Review, Textarea, Toggle, Uploads,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'
import { DAYS_AR, barberInputSchema, buildBarberContent, hoursFromGoogle, type BarberGoogle } from '@/utils/services/barber'
import type { ServiceHoursDay } from '@/utils/services/types'

/**
 * The barber's questions: the seven steps Anas approved on 2026-11-10
 * (sample «أسئلة الحلاق»). Reached from /theme/new/services after the owner
 * picks «صالون حلاقة» in the kind sheet.
 *
 * What is required and why:
 *  - the Google Maps link: it brings the rating, the five reviews, the hours
 *    and the photos, so the site starts from facts, not from blanks
 *  - Instagram, unless the owner says the shop has none: the lead builder
 *    reads it for photos and voice
 *  - one service and a phone number
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

const TAGS = ['قص كلاسيكي', 'تدريج', 'لحية', 'أطفال', 'عرسان', 'بروتين', 'صبغة', 'تنظيف بشرة']

const SERVICES: Omit<Svc, 'id'>[] = [
  { on: true, name: 'قص شعر', price: '', duration: '30 د' },
  { on: true, name: 'تحديد اللحية', price: '', duration: '15 د' },
  { on: true, name: 'شعر ولحية', price: '', duration: '45 د' },
  { on: false, name: 'حلاقة أطفال', price: '', duration: '20 د' },
  { on: false, name: 'تنظيف بشرة', price: '', duration: '30 د' },
  { on: false, name: 'بروتين للشعر', price: '', duration: '90 د' },
  { on: false, name: 'صبغة شعر أو لحية', price: '', duration: '40 د' },
  { on: false, name: 'تجهيز عريس', price: '', duration: '' },
]

const FAQS = [
  'هل أحتاج موعدًا، أم أحضر مباشرة؟',
  'كم أنتظر عادة؟',
  'هل السعر المكتوب هو ما أدفعه؟',
  'هل تحلقون للأطفال؟',
  'هل يوجد موقف سيارات قريب؟',
  'هل تقبلون الدفع بالبطاقة؟',
]

/** Three looks, each tuned on the approved sample. The build measures the shop's own colours later (lead builder). */
const LOOKS = [
  { id: 'brass', name: 'نحاسي ليلي', colors: { background: '#0d0c0a', surface: '#151310', text: '#f2ede3', muted: '#958d80', accent: '#c4a35a', primary: '#c4a35a', border: '#2a2722' } },
  { id: 'oxblood', name: 'أحمر عتيق', colors: { background: '#100b0a', surface: '#1a1210', text: '#f3ebe6', muted: '#a1918a', accent: '#b8483a', primary: '#b8483a', border: '#2e2220' } },
  { id: 'paper', name: 'ورقي فاتح', colors: { background: '#f3efe7', surface: '#e9e3d8', text: '#1b1712', muted: '#6c6458', accent: '#1b1712', primary: '#1b1712', border: '#d8d0c2' } },
] as const

type Form = {
  name: string; latin: string; city: string; area: string; address: string; audience: string
  phone: string; whatsapp: string; email: string; maps_url: string; instagram: string; no_instagram: boolean
  links: Link[]; logo: string
  barbers: Barber[]
  services: Svc[]; currency: string
  mode: 'appointment' | 'walkin' | 'both'; wait: string; busy: string
  hours: ServiceHoursDay[]; hours_touched: boolean
  google_photos: string[]; hidden: string[]; hero: string; uploads: string[]
  faq: Faq[]
  look: (typeof LOOKS)[number]['id']
}

const WEEK: ServiceHoursDay[] = DAYS_AR.map((_, day) => ({ day, closed: false, periods: [{ open: '10:00', close: '22:00' }] }))

const INITIAL: Form = {
  name: '', latin: '', city: '', area: '', address: '', audience: 'رجال',
  phone: '', whatsapp: '', email: '', maps_url: '', instagram: '', no_instagram: false,
  links: [], logo: '',
  barbers: [{ id: nid(), name: '', role: 'صاحب الصالون', photo: '', tags: [] }],
  services: SERVICES.map((s) => ({ ...s, id: nid() })), currency: '',
  mode: 'both', wait: '', busy: '',
  hours: WEEK, hours_touched: false,
  google_photos: [], hidden: [], hero: '', uploads: [],
  faq: FAQS.map((q) => ({ id: nid(), q, a: '' })),
  look: 'brass',
}

const intl = (v: string) => /^(\+|00)\d[\d\s-]{6,}$/.test(v.trim())

export default function BarberWizard({ onBack }: { onBack?: () => void }) {
  const router = useRouter()
  const { toast } = useNotify()
  const [f, setF] = useState<Form>(INITIAL)
  const [step, setStep] = useState(0)
  const [g, setG] = useState<(BarberGoogle & { photos?: string[]; name?: string }) | null>(null)
  const [gState, setGState] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle')
  const [gMsg, setGMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [loading, setLoading] = useState(false)

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
        body: JSON.stringify({ url: f.maps_url.trim(), name: f.name, city: f.city }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGState('fail')
        setGMsg(j?.error === 'not_google_link' ? 'هذا ليس رابط خرائط جوجل. انسخه من زر «مشاركة» في الخرائط.'
          : j?.error === 'not_found' ? 'لم نجد المكان من هذا الرابط. جرّب رابط «مشاركة» من صفحة الصالون.'
          : j?.error === 'too_many' ? 'محاولات كثيرة. انتظر قليلًا ثم أعد.'
          : 'تعذّر الوصول إلى جوجل الآن. يمكنك المتابعة، ونعيد المحاولة عند البناء.')
        return
      }
      setG(j)
      setGState('ok')
      setF((p) => ({
        ...p,
        name: p.name || j.name || '',
        maps_url: j.maps_url || p.maps_url,
        google_photos: j.photos || [],
        hero: p.hero || j.photos?.[0] || '',
        hours: !p.hours_touched && j.periods?.length ? hoursFromGoogle(j.periods) : p.hours,
      }))
      const bits = [
        j.rating ? `${Number(j.rating).toFixed(1)} من ${Number(j.count || 0).toLocaleString('ar')} تقييم` : null,
        j.reviews?.length ? `${j.reviews.length} تقييمات مكتوبة` : null,
        j.periods?.length ? 'أوقات الدوام' : null,
        j.photos?.length ? `${j.photos.length} صور` : null,
      ].filter(Boolean)
      setGMsg(bits.length ? `وجدنا ${j.name ? '«' + j.name + '»' : 'المكان'}: ${bits.join(' · ')}.` : 'وجدنا المكان، لكن جوجل لا يحمل عنه تقييمات أو صورًا بعد.')
    } catch {
      setGState('fail'); setGMsg('تعذّر الوصول إلى جوجل الآن. يمكنك المتابعة.')
    }
  }

  const services = f.services.filter((s) => s.on && s.name.trim())
  const barbers = f.barbers.filter((b) => b.name.trim())
  const ok = {
    basics: f.name.trim().length >= 2 && f.city.trim().length >= 2 && f.phone.trim().length >= 4
      && f.maps_url.trim().length > 8 && (f.no_instagram || f.instagram.trim().length > 1)
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
      name: f.name.trim(), latin: f.latin.trim() || undefined, city: f.city.trim(), area: f.area.trim() || undefined,
      address: f.address.trim() || undefined, audience: f.audience || undefined, phone: f.phone.trim(),
      whatsapp: f.whatsapp.trim() || (intl(f.phone) ? f.phone.trim() : undefined), email: f.email.trim() || undefined,
      maps_url: f.maps_url.trim(), instagram: f.no_instagram ? undefined : f.instagram.trim(),
      links: f.links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim(), url: /^https?:\/\//.test(l.url.trim()) ? l.url.trim() : 'https://' + l.url.trim() })),
      barbers: barbers.map((b) => ({ name: b.name.trim(), role: b.role.trim() || undefined, photo: b.photo || undefined, tags: b.tags })),
      services: services.map((s) => ({ name: s.name.trim(), price: s.price.trim() || undefined, duration: s.duration.trim() || undefined })),
      currency: f.currency.trim() || undefined,
      booking: { mode: f.mode, wait: f.wait.trim() || undefined, busy: f.busy.trim() || undefined },
      hours: f.hours.map((d) => ({ ...d, periods: d.closed ? [] : d.periods.filter((p) => p.open && p.close) })),
      photos: { hero, side: rest[0], gallery: rest.slice(1) },
      faq: f.faq.filter((q) => q.q.trim() && q.a.trim()).map((q) => ({ q: q.q.trim(), a: q.a.trim() })),
      logo: f.logo || undefined,
    }
  }

  function fail(msg: string, at?: number) {
    setError(msg); setErrorKey((k) => k + 1)
    if (at != null) setStep(at)
  }

  async function build() {
    setError(null)
    if (!ok.basics) return fail('أكمل الأساسيات: الاسم، المدينة، الهاتف، رابط خرائط جوجل، وإنستغرام (أو «ليس عندي حساب»). رقم واتساب يُكتب بمفتاح الدولة.', 0)
    if (!ok.services) return fail('اختر خدمة واحدة على الأقل.', 2)
    const parsed = barberInputSchema.safeParse(payload())
    if (!parsed.success) return fail('بعض الحقول غير صحيحة. راجع الأساسيات والخدمات.')
    setLoading(true)
    try {
      const content = buildBarberContent(parsed.data, g || { maps_url: parsed.data.maps_url })
      const look = LOOKS.find((l) => l.id === f.look) || LOOKS[0]
      const res = await fetch('/api/themes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: parsed.data.name,
          images: content.gallery.images.map((i) => i.url),
          primaryColor: look.colors.accent,
          secondaryColor: look.colors.background,
          content: {
            business_type: 'services', niche: 'barber', style_preset: 'graphite',
            color_overrides: look.colors, services: content, input: parsed.data, google: g ? { place_id: g.place_id, rating: g.rating, count: g.count } : undefined,
            ...(parsed.data.logo ? { seo: { logo: parsed.data.logo } } : {}),
          },
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) { router.push('/login?mode=signup&next=/theme/new/services?kind=barber'); return }
      if (res.status === 402) { toast({ type: 'warning', message: 'لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!res.ok || !j?.id) throw new Error(j?.error || 'فشل الحفظ')
      router.push(`/preview/services/${j.id}?created=1`)
    } catch (e: any) {
      setLoading(false)
      fail(e?.message || 'حدث خطأ أثناء بناء موقعك.')
    }
  }

  const reviewSnips = (g?.reviews || []).slice(0, 5)
  const filledFaq = f.faq.filter((q) => q.q.trim() && q.a.trim()).length
  const priced = services.filter((s) => s.price.trim()).length

  const steps: WizardStep[] = [
    {
      id: 'basics', title: 'الصالون وروابطه', sub: 'من رابط خرائط جوجل نجلب التقييمات والصور والأوقات. ومن إنستغرام نقرأ صور صالونك.',
      complete: ok.basics, note: 'الاسم، المدينة، الهاتف، رابط الخرائط، وإنستغرام مطلوبة.',
      body: (
        <Grid>
          <Field label="رابط الصالون على خرائط جوجل" required wide hint="افتح صالونك في خرائط جوجل، اضغط «مشاركة»، وانسخ الرابط.">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input dir="ltr" value={f.maps_url} onChange={(e) => { up('maps_url', e.target.value); setGState('idle') }} onBlur={() => gState === 'idle' && f.maps_url.trim().length > 8 && fetchGoogle()} placeholder="https://maps.app.goo.gl/…" />
              <button type="button" className="zb-chip" onClick={fetchGoogle} disabled={gState === 'busy' || f.maps_url.trim().length < 9} style={{ flex: '0 0 auto' }}>
                {gState === 'busy' ? 'نجلب…' : gState === 'ok' ? 'أعد الجلب' : 'اجلب من جوجل'}
              </button>
            </div>
          </Field>
          {gMsg ? <Block><Notice tone={gState === 'fail' ? 'bad' : 'accent'}>{gMsg}</Notice></Block> : null}
          <Field label="اسم الصالون" required>
            <Input value={f.name} onChange={(e) => up('name', e.target.value)} placeholder="صالون حمودة للرجال" />
          </Field>
          <Field label="الاسم بالإنجليزية" hint="إن كان على اللافتة.">
            <Input dir="ltr" value={f.latin} onChange={(e) => up('latin', e.target.value)} placeholder="Hamuda Barber" />
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
          <Field label="إنستغرام" required={!f.no_instagram} wide hint={f.no_instagram ? 'لا بأس. نبني من صور جوجل وصورك.' : 'نقرأ منه صور صالونك وأعمالك.'}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Input dir="ltr" value={f.instagram} disabled={f.no_instagram} onChange={(e) => up('instagram', e.target.value)} placeholder="@hamuda.barber" style={{ flex: '1 1 220px' }} />
              <Toggle on={f.no_instagram} onChange={(v) => up('no_instagram', v)}>ليس عندي حساب</Toggle>
            </div>
          </Field>
          <Block title="لمن الصالون؟">
            <Chips options={[{ id: 'رجال', label: 'رجال' }, { id: 'رجال وأطفال', label: 'رجال وأطفال' }]} value={f.audience} onChange={(v) => up('audience', v || 'رجال')} allowNone={false} />
          </Block>
          <Block title="روابط أخرى" optional hint="أي صفحة لك: تيك توك، سناب، تطبيق حجز، موقع قديم، تصميم تحبه.">
            <div className="zb-list">
              {f.links.map((l) => (
                <Card key={l.id} title={l.label || 'رابط'} onRemove={() => drop('links', l.id)} removeLabel="حذف الرابط">
                  <Grid>
                    <Field label="اسمه"><Input value={l.label} onChange={(e) => patch<Link>('links', l.id, { label: e.target.value })} placeholder="تيك توك" /></Field>
                    <Field label="الرابط"><Input dir="ltr" value={l.url} onChange={(e) => patch<Link>('links', l.id, { url: e.target.value })} placeholder="https://…" /></Field>
                  </Grid>
                </Card>
              ))}
            </div>
            <AddButton onClick={() => up('links', [...f.links, { id: nid(), label: '', url: '' }])}>أضف رابطًا</AddButton>
          </Block>
          <Block title="الشعار" optional hint="إن كان لصالونك شعار. بدونه يظهر الاسم وحده.">
            <Uploads cols={4}><ImageUploadField value={f.logo} onChange={(u) => up('logo', u)} aspect="square" label="الشعار" /></Uploads>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'barbers', title: 'الحلاقون', sub: 'الزبون يطلب الحلاق بالاسم. أضف كل حلاق، وصورته إن أردت. بدون صورة يظهر اسمه بخط كبير، ولا نضع وجهًا غريبًا مكانه.',
      complete: barbers.length > 0, optional: true,
      body: (
        <Grid>
          {reviewSnips.length ? (
            <Block title="من تقييماتك على جوجل" hint="الأسماء التي يذكرها زبائنك. سنضع كلام الزبون تحت اسم الحلاق.">
              <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
                {reviewSnips.map((r, i) => <li key={i} style={{ fontSize: 14.5, opacity: 0.85 }}>«{r.text.length > 160 ? r.text.slice(0, 157) + '…' : r.text}» · {r.name}</li>)}
              </ul>
            </Block>
          ) : null}
          <Block>
            <div className="zb-list">
              {f.barbers.map((b, i) => (
                <Card key={b.id} title={b.name || `الحلاق ${i + 1}`} onRemove={f.barbers.length > 1 ? () => drop('barbers', b.id) : undefined} removeLabel="حذف الحلاق">
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,120px) minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
                    <ImageUploadField value={b.photo} onChange={(u) => patch<Barber>('barbers', b.id, { photo: u })} aspect="square" label="صورته" />
                    <Grid>
                      <Field label="الاسم"><Input value={b.name} onChange={(e) => patch<Barber>('barbers', b.id, { name: e.target.value })} placeholder="عمار" /></Field>
                      <Field label="صفته"><Input value={b.role} onChange={(e) => patch<Barber>('barbers', b.id, { role: e.target.value })} placeholder="حلاق" /></Field>
                    </Grid>
                  </div>
                  <p className="zb-lab" style={{ margin: '12px 0 6px' }}>بماذا يشتهر؟</p>
                  <div className="zb-chips">
                    {TAGS.map((t) => {
                      const on = b.tags.includes(t)
                      return <button key={t} type="button" className="zb-chip" data-on={on ? 'true' : undefined} aria-pressed={on} onClick={() => patch<Barber>('barbers', b.id, { tags: on ? b.tags.filter((x) => x !== t) : [...b.tags, t].slice(0, 6) })}>{t}</button>
                    })}
                  </div>
                </Card>
              ))}
            </div>
            <AddButton onClick={() => up('barbers', [...f.barbers, { id: nid(), name: '', role: 'حلاق', photo: '', tags: [] }])}>أضف حلاقًا</AddButton>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'services', title: 'الخدمات والأسعار', sub: 'اختر ما تقدّمه، وأضف ما ليس في القائمة. السعر اختياري: بدونه يسألك الزبون على واتساب.',
      complete: ok.services, note: 'اختر خدمة واحدة على الأقل.',
      body: (
        <Grid>
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
          <Field label="كم ينتظر الزبون عادة؟"><Input value={f.wait} onChange={(e) => up('wait', e.target.value)} placeholder="10 إلى 20 دقيقة مساء الخميس" /></Field>
          <Field label="متى تكون الزحمة؟"><Input value={f.busy} onChange={(e) => up('busy', e.target.value)} placeholder="الخميس والجمعة بعد المغرب" /></Field>
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
      id: 'photos', title: 'صور الصالون', sub: 'هذه صورك على جوجل. أخفِ ما لا تريده، واختر صورة الواجهة، وأضف صورًا من عندك.',
      complete: photos.length > 0, optional: true,
      body: (
        <Grid>
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
            <Block><Notice>{gState === 'ok' ? 'لم نجد صورًا لصالونك على جوجل. أضف صورك هنا.' : 'ضع رابط خرائط جوجل في الخطوة الأولى لنجلب صورك، أو أضفها هنا.'}</Notice></Block>
          )}
          <Block title="صور من عندك" optional hint="الكراسي، الواجهة، قصّات من شغلكم. صور حقيقية فقط.">
            <Uploads cols={4}>
              {[...f.uploads, ''].slice(0, 8).map((u, i) => (
                <ImageUploadField key={i + ':' + u} value={u} aspect="square" label={`صورة ${i + 1}`}
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
          <Block>
            <div className="zb-list">
              {f.faq.map((q) => (
                <Card key={q.id} title={q.own ? (q.q || 'سؤالك') : q.q} onRemove={() => drop('faq', q.id)} removeLabel="حذف السؤال">
                  {q.own ? <Field label="السؤال" wide><Input value={q.q} onChange={(e) => patch<Faq>('faq', q.id, { q: e.target.value })} placeholder="هل عندكم عروض للطلاب؟" /></Field> : null}
                  <Field label="الجواب" wide><Textarea rows={2} value={q.a} onChange={(e) => patch<Faq>('faq', q.id, { a: e.target.value })} placeholder="جوابك بكلامك" /></Field>
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
          <Block title="الألوان" hint="تستطيع تغييرها لاحقًا من المحرر.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
              {LOOKS.map((l) => (
                <button key={l.id} type="button" onClick={() => up('look', l.id)} aria-pressed={f.look === l.id}
                  style={{ background: l.colors.background, color: l.colors.text, border: `2px solid ${f.look === l.id ? l.colors.accent : l.colors.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'start', display: 'grid', gap: 8 }}>
                  <span style={{ display: 'flex', gap: 6 }}>{[l.colors.background, l.colors.surface, l.colors.accent].map((c) => <i key={c} style={{ width: 18, height: 18, borderRadius: 99, background: c, border: `1px solid ${l.colors.border}` }} />)}</span>
                  <b style={{ fontSize: 16 }}>{l.name}</b>
                </button>
              ))}
            </div>
          </Block>
          <Review
            facts={[
              { label: 'الحلاقون', value: barbers.length },
              { label: 'الخدمات', value: `${services.length}${priced ? ` · ${priced} بسعر` : ''}` },
              { label: 'تقييمات جوجل', value: g?.reviews?.length || 0 },
              { label: 'الصور', value: photos.length },
            ]}
            recap={[
              { label: 'الصالون', value: [f.name, f.area, f.city].filter(Boolean).join('، ') },
              { label: 'الهاتف', value: f.phone },
              { label: 'إنستغرام', value: f.no_instagram ? 'لا يوجد' : f.instagram },
              { label: 'الحلاقون', value: barbers.map((b) => b.name).join('، ') },
              { label: 'الخدمات', value: services.map((s) => s.name + (s.price ? ` (${s.price}${f.currency ? ' ' + f.currency : ''})` : '')).join('، ') },
              { label: 'أسئلة مُجابة', value: filledFaq ? String(filledFaq) : '' },
            ]}
          >
            <Handoff title="جاهز لبناء موقع الصالون." body="نبنيه من إجاباتك وتقييماتك على جوجل، بلا كلام مخترع. ثم تعدّل أي شيء من المحرر." />
          </Review>
        </Grid>
      ),
    },
  ]

  function setDay(i: number, v: Partial<ServiceHoursDay>) {
    setF((p) => ({ ...p, hours_touched: true, hours: p.hours.map((d, x) => (x === i ? { ...d, ...v } : d)) }))
  }
  function setHour(i: number, pi: number, v: Partial<{ open: string; close: string }>) {
    setF((p) => ({ ...p, hours_touched: true, hours: p.hours.map((d, x) => (x === i ? { ...d, periods: d.periods.map((q, y) => (y === pi ? { ...q, ...v } : q)) } : d)) }))
  }

  const required = [ok.basics, ok.services]
  const pct = Math.round((steps.filter((s) => s.complete).length / steps.length) * 100)

  return (
    <>
      <WizardShell
        eyebrow="قالب الخدمات · صالون حلاقة"
        title="ابنِ موقع صالونك."
        sub={<>سبع خطوات قصيرة. نبني الموقع من إجاباتك وما يقوله زبائنك على جوجل. {onBack ? <button type="button" onClick={onBack} style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>ليس صالون حلاقة؟</button> : null}</>}
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'نبني موقعك…' : 'ابنِ موقع الصالون', slide: 'هيا بنا', onClick: build, busy: loading }}
      />
      <GenerationOverlay open={loading} />
      <style dangerouslySetInnerHTML={{ __html: '.bw-svc{display:grid;grid-template-columns:auto minmax(0,1.4fr) minmax(0,1.6fr) auto;gap:8px;align-items:center}.bw-pd{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bw-svc .zb-chip.zb-toggle{padding-inline:10px}@media(max-width:640px){.bw-svc{grid-template-columns:auto minmax(0,1fr) auto;row-gap:6px;padding-bottom:10px;border-bottom:1px solid var(--line,rgba(127,127,127,.15))}.bw-pd{grid-column:2/3;grid-row:2}}' }} />
    </>
  )
}
