"use client"

import { useEffect, useMemo, useState } from 'react'
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
import { DAYS_AR, DEMO_BUILT_KEY, barberInputSchema, buildBarberContent, hoursFromGoogle, type BarberGoogle } from '@/utils/services/barber'
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
  terms: { label: string; text: string }[]
  look: string
}

const WEEK: ServiceHoursDay[] = DAYS_AR.map((_, day) => ({ day, closed: false, periods: [{ open: '10:00', close: '22:00' }] }))

function initial(k: KindText): Form {
  return {
    name: '', latin: '', city: '', area: '', address: '', audience: k.audiences?.[0] || '',
    phone: '', whatsapp: '', email: '', maps_url: '', instagram: '', no_instagram: false,
    links: [], logo: '',
    barbers: [{ id: nid(), name: '', role: k.ownerRole, photo: '', tags: [] }],
    services: k.defaults.map((s) => ({ ...s, price: '', id: nid() })), currency: '',
    mode: 'both', wait: '', busy: '',
    hours: WEEK, hours_touched: false,
    google_photos: [], hidden: [], hero: '', uploads: [],
    faq: k.faqs.map((q) => ({ id: nid(), q, a: '' })),
    terms: (k.terms || []).map((t) => ({ label: t.label, text: '' })),
    look: k.looks[0].id,
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
      kind,
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
      terms: f.terms.filter((t) => t.text.trim()).map((t) => ({ label: t.label, text: t.text.trim() })),
      faq: f.faq.filter((q) => q.q.trim() && q.a.trim()).map((q) => ({ q: q.q.trim(), a: q.a.trim() })),
      logo: f.logo || undefined,
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
      maps_url: p.maps_url.length >= 8 ? p.maps_url : 'https://maps.google.com/',
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
    if (!ok.basics) return fail('أكمل الأساسيات: الاسم، المدينة، الهاتف، رابط خرائط جوجل، وإنستغرام (أو «ليس عندي حساب»). رقم واتساب يُكتب بمفتاح الدولة.', 0)
    if (!ok.services) return fail('اختر خدمة واحدة على الأقل.', 2)
    const parsed = barberInputSchema.safeParse(payload())
    if (!parsed.success) return fail('بعض الحقول غير صحيحة. راجع الأساسيات والخدمات.')
    setLoading(true)
    try {
      const content = buildBarberContent(parsed.data, g || { maps_url: parsed.data.maps_url })
      const look = LOOKS.find((l) => l.id === f.look) || LOOKS[0]
      if (demo) {
        const site = { business_type: 'services', niche: kind, style_preset: 'graphite', color_overrides: look.colors, services: content, input: parsed.data }
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
            color_overrides: look.colors, services: content, input: parsed.data, google: g ? { place_id: g.place_id, rating: g.rating, count: g.count } : undefined,
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
  const filledFaq = f.faq.filter((q) => q.q.trim() && q.a.trim()).length
  const priced = services.filter((s) => s.price.trim()).length

  const steps: WizardStep[] = [
    {
      id: 'basics', title: `${k.place} وروابطه`, sub: `من رابط خرائط جوجل نجلب التقييمات والصور والأوقات. ومن إنستغرام نقرأ صور ${mine}.`,
      complete: ok.basics, note: 'الاسم، المدينة، الهاتف، رابط الخرائط، وإنستغرام مطلوبة.',
      body: (
        <Grid>
          <Block title="ابدأ من جوجل" hint={`افتح ${mine} في خرائط جوجل، اضغط «مشاركة»، وانسخ الرابط. نجلب منه الاسم والهاتف والعنوان والأوقات والتقييمات والصور.`}>
            <div className="bw-g">
              <Input dir="ltr" aria-label={`رابط ${k.place} على خرائط جوجل`} value={f.maps_url} onChange={(e) => { up('maps_url', e.target.value); setGState('idle') }} onBlur={() => gState === 'idle' && f.maps_url.trim().length > 8 && fetchGoogle()} placeholder="https://maps.app.goo.gl/…" />
              <button type="button" className="zb-chip bw-gbtn" onClick={fetchGoogle} disabled={gState === 'busy' || f.maps_url.trim().length < 9}>
                {gState === 'busy' ? 'نجلب…' : gState === 'ok' ? 'أعد الجلب' : 'اجلب من جوجل'}
              </button>
            </div>
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
            {gMsg ? <div style={{ marginTop: 10 }}><Notice tone={gState === 'fail' ? 'bad' : 'accent'}>{gMsg}</Notice></div> : null}
          </Block>
          <Block title={k.place}>
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
            </Grid>
          </Block>
          <Block title="التواصل">
            <Grid>
              <Field label="الهاتف" required>
                <Input dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => up('phone', e.target.value)} placeholder="+962 79 752 7688" />
              </Field>
              <Field label="واتساب" hint="بمفتاح الدولة، مثل ‎+962. يصل إليه طلب الحجز وسؤال السعر.">
                <Input dir="ltr" inputMode="tel" value={f.whatsapp} onChange={(e) => up('whatsapp', e.target.value)} placeholder="+962 79 752 7688" />
              </Field>
              <Field label="إنستغرام" required={!f.no_instagram} wide hint={f.no_instagram ? 'لا بأس. نبني من صور جوجل وصورك.' : `نقرأ منه صور ${mine} وأعمالك.`}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Input dir="ltr" value={f.instagram} disabled={f.no_instagram} onChange={(e) => up('instagram', e.target.value)} placeholder="@yourname" style={{ flex: '1 1 220px' }} />
                  <Toggle on={f.no_instagram} onChange={(v) => up('no_instagram', v)}>ليس عندي حساب</Toggle>
                </div>
              </Field>
            </Grid>
          </Block>
          {k.audiences?.length ? (
            <Block title={`لمن ${k.place}؟`}>
              <Chips options={k.audiences.map((a) => ({ id: a, label: a }))} value={f.audience} onChange={(v) => up('audience', v || k.audiences![0])} allowNone={false} />
            </Block>
          ) : null}
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
          <Block title="الشعار" optional hint={`إن كان لـ${mine} شعار. بدونه يظهر الاسم وحده.`}>
            <div className="bw-logo"><ImageUploadField local={demo} value={f.logo} onChange={(u) => up('logo', u)} aspect="square" /></div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'barbers', title: k.team, sub: `الزبون يطلب ${k.one} بالاسم. أضف كل واحد، وصورته إن أردت. بدون صورة يظهر الاسم بخط كبير، ولا نضع وجهًا غريبًا مكانه.`,
      complete: barbers.length > 0, optional: true,
      body: (
        <Grid>
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
      id: 'photos', title: `صور ${k.place}`, sub: 'هذه صورك على جوجل. أخفِ ما لا تريده، واختر صورة الواجهة، وأضف صورًا من عندك.',
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
              { label: k.team, value: barbers.length },
              { label: 'الخدمات', value: `${services.length}${priced ? ` · ${priced} بسعر` : ''}` },
              { label: 'تقييمات جوجل', value: g?.reviews?.length || 0 },
              { label: 'الصور', value: photos.length },
            ]}
            recap={[
              { label: bare, value: [f.name, f.area, f.city].filter(Boolean).join('، ') },
              { label: 'الهاتف', value: f.phone },
              { label: 'إنستغرام', value: f.no_instagram ? 'لا يوجد' : f.instagram },
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

  const required = [ok.basics, ok.services]
  const pct = Math.round((steps.filter((s) => s.complete).length / steps.length) * 100)

  return (
    <>
      <WizardShell
        eyebrow={`قالب الخدمات · ${k.label}`}
        title={`ابنِ موقع ${mine}.`}
        sub={<>سبع خطوات قصيرة. نبني الموقع من إجاباتك وما يقوله زبائنك على جوجل. {onBack ? <button type="button" onClick={onBack} style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>ليس {k.label}؟</button> : null}</>}
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
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
      <style dangerouslySetInnerHTML={{ __html: '.bw-g{display:flex;gap:8px}.bw-gbtn{flex:0 0 auto}.bw-found{display:flex;gap:12px;align-items:center;margin-top:12px;padding:10px;border-radius:14px;border:1px solid var(--line,rgba(127,127,127,.2));background:rgba(127,127,127,.06)}.bw-found img,.bw-found-ph{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:0 0 auto;display:grid;place-items:center;font-size:26px;background:rgba(127,127,127,.15)}.bw-found div{display:grid;gap:2px;min-width:0}.bw-found b{font-size:16.5px}.bw-found small{opacity:.75;font-size:14.5px}.bw-stars{color:#E8B04B;font-size:15px}.bw-logo{width:120px}.bw-peek{position:fixed;z-index:60;inset-inline-start:50%;transform:translateX(50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));display:inline-flex;gap:8px;align-items:center;min-height:46px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:#16130f;color:#f6f1ea;font:600 15px inherit;box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer}[dir=ltr] .bw-peek{transform:translateX(-50%)}.bw-peek span{color:#E2532A}.bw-sheet{position:fixed;inset:0;z-index:2147483000;background:#0b0b0b;overflow:auto;overscroll-behavior:contain}.bw-sheet-top{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px max(14px,env(safe-area-inset-left,0px));background:#16130f;color:#f6f1ea;font-size:14.5px;border-bottom:1px solid rgba(255,255,255,.12)}.bw-sheet-top button{min-height:40px;padding:0 16px;border-radius:999px;border:0;background:#f6f1ea;color:#16130f;font-weight:700;cursor:pointer}.bw-sheet-site{position:relative}.zb-root{padding-bottom:72px}.bw-svc{display:grid;grid-template-columns:auto minmax(0,1.4fr) minmax(0,1.6fr) auto;gap:8px;align-items:center}.bw-pd{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bw-svc .zb-chip.zb-toggle{padding-inline:10px}@media(max-width:640px){.bw-svc{grid-template-columns:auto minmax(0,1fr) auto;row-gap:6px;padding-bottom:10px;border-bottom:1px solid var(--line,rgba(127,127,127,.15))}.bw-pd{grid-column:2/3;grid-row:2}}' }} />
    </>
  )
}
