"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploadField from '@/components/ImageUploadField'
import GenerationOverlay from '@/components/GenerationOverlay'
import { useNotify } from '@/components/ui/Notify'
import WizardShell, {
  AddButton, Block, Card, Chips, Field, Grid, Handoff, Input, Notice, Review, Textarea, Toggle, Uploads,
  type WizardStep,
} from '@/components/zenya/build/WizardShell'
import { DEMO_BUILT_KEY } from '@/utils/services/barber'
import { brandInputSchema, buildBrandContent, type BrandInput } from '@/utils/studio/brand'
import { BRAND_LOOKS, type BrandLook } from '@/utils/studio/brand-looks'

/**
 * The brand-story questions (Anas, 2026-11-20): links first, then the owner
 * checks what we read, then only what the links could not tell us.
 *
 *  1 روابطك          the brand's site, Instagram, catalogue PDF. Skip if none.
 *  2 علامتك          name, what it sells, one line, how people buy, contact.
 *  3 الصور           before anything that needs a picture: the top photo,
 *                    the story photo, the gallery. Products pick from these.
 *  4 قصتك / 5 كيف تصنع / 6 منتجاتك (each product with its photo).
 *  7 ثقة الناس       reviews, press, milestones, team. All optional.
 *  8 الألوان والمراجعة  the brand's own colours first, then build.
 *
 * Everything we read is a suggestion in a field the owner can change. The
 * site is buildBrandContent(answers): no model at build time.
 */

const nid = () => Math.random().toString(36).slice(2, 9)

type Item = { id: string; title: string; text: string; photo: string }
type Product = { id: string; name: string; text: string; size: string; price: string; photo: string }
type Person = { id: string; name: string; role: string; photo: string }
type Rev = { id: string; name: string; text: string; from: string }
type Press = { id: string; name: string; url: string }
type Mile = { id: string; year: string; text: string }

type Form = {
  website: string; instagram: string; tiktok: string; facebook: string; pdf: string
  name: string; kind: string; tagline: string; intro: string; city: string; logo: string
  phone: string; whatsapp: string; email: string; address: string; store: string
  buy: '' | 'whatsapp' | 'call' | 'store' | 'email' | 'instagram'
  heading: string; story: string; quote: string; signature: string; role: string
  values: Item[]; steps: Item[]; benefits: Item[]
  products: Product[]; products_note: string
  hero: string; story_photo: string; noGallery: string[]; uploads: string[]; hidden: string[]
  reviews: Rev[]; press: Press[]; timeline: Mile[]; team: Person[]
  look: string; design: 'tropic' | 'shelf'; checked: boolean; scrape_issue: string
}

const empty = (): Form => ({
  website: '', instagram: '', tiktok: '', facebook: '', pdf: '',
  name: '', kind: '', tagline: '', intro: '', city: '', logo: '',
  phone: '', whatsapp: '', email: '', address: '', store: '', buy: '',
  heading: '', story: '', quote: '', signature: '', role: '',
  values: [], steps: [], benefits: [],
  products: [{ id: nid(), name: '', text: '', size: '', price: '', photo: '' }], products_note: '',
  hero: '', story_photo: '', noGallery: [], uploads: [], hidden: [],
  reviews: [], press: [], timeline: [], team: [],
  look: 'own', design: 'tropic', checked: false, scrape_issue: '',
})

/** The two looks of the brand site (Anas, 2026-11-22: both, «موسم» first). */
const DESIGNS: { id: Form['design']; name: string; note: string }[] = [
  { id: 'tropic', name: 'موسم', note: 'صورة واجهة تملأ الشاشة وخط عريض. أجمل إن كانت عندك صور كثيرة.' },
  { id: 'shelf', name: 'رفّ', note: 'منتجاتك وأحجامها في الأعلى. أوضح للتجار، وجميل حتى بصور قليلة.' },
]

const item = (title = '', text = ''): Item => ({ id: nid(), title, text, photo: '' })
const intl = (v: string) => /^(\+|00)\d[\d\s-]{6,}$/.test(v.trim())
const paras = (v: string) => v.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean).slice(0, 4)

/** A Field that is not a <label>: a label around buttons clicks the first one. */
function PickField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="zb-cell wide"><div className="zb-f"><span className="zb-lab">{label}</span>{children}</div></div>
}

/** Tap a picture to use it here. The chosen one carries a ring. */
function Pick({ photos, value, onChange, onUpload, demo, none = 'بدون صورة' }: { photos: string[]; value: string; onChange: (u: string) => void; onUpload: (u: string) => void; demo: boolean; none?: string }) {
  return (
    <div className="bw-pick" role="listbox">
      <div className="bw-up"><ImageUploadField local={demo} value="" aspect="thumb" onChange={(u) => { if (u) { onUpload(u); onChange(u) } }} /></div>
      <button type="button" className="bw-none" data-on={!value || undefined} onClick={() => onChange('')}>{none}</button>
      {photos.map((u) => (
        <button key={u} type="button" data-on={value === u || undefined} aria-pressed={value === u} onClick={() => onChange(value === u ? '' : u)}>
          <img src={u} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  )
}

export default function BrandWizard({ demo = false, onBack }: { demo?: boolean; onBack?: () => void }) {
  const router = useRouter()
  const { toast } = useNotify()
  const [f, setF] = useState<Form>(empty)
  const [step, setStep] = useState(0)
  const [read, setRead] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle')
  const [readMsg, setReadMsg] = useState('')
  const [readKey, setReadKey] = useState('')
  const [found, setFound] = useState<string[]>([])
  const [siteLogo, setSiteLogo] = useState('')
  const [others, setOthers] = useState<string[]>([])
  const [igPhotos, setIgPhotos] = useState<string[]>([])
  const [own, setOwn] = useState<BrandLook | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const moves = useRef<{ step: string; at: number }[]>([])
  const started = useRef(Date.now())

  const addUpload = (u: string) => setF((p) => (p.uploads.includes(u) ? p : { ...p, uploads: [...p.uploads, u] }))
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  type ListKey = 'values' | 'steps' | 'benefits' | 'products' | 'reviews' | 'press' | 'timeline' | 'team'
  const patch = <T extends { id: string }>(k: ListKey, id: string, v: Partial<T>) =>
    setF((p) => ({ ...p, [k]: (p[k] as unknown as T[]).map((x) => (x.id === id ? { ...x, ...v } : x)) }))
  const drop = (k: ListKey, id: string) => setF((p) => ({ ...p, [k]: (p[k] as { id: string }[]).filter((x) => x.id !== id) }))

  const linkKey = [f.website, f.pdf, f.instagram].map((x) => x.trim()).join('|')
  const readable = !!(f.website.trim() || f.pdf.trim() || f.instagram.trim())

  /** Reads the links once per set of links, when the owner leaves the first step. */
  async function readLinks() {
    if (!readable || read === 'busy' || readKey === linkKey) return
    setRead('busy'); setReadMsg(''); setReadKey(linkKey)
    let bio = ''
    let ig: string[] = []
    let caps: string[] = []
    let igName = ''
    if (f.instagram.trim().length >= 2) {
      try {
        const r = await fetch('/api/niche/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instagram: f.instagram.trim(), demo }) })
        const j = await r.json().catch(() => ({}))
        if (r.ok) { bio = j.bio || ''; ig = j.photos || []; caps = Array.isArray(j.captions) ? j.captions : []; igName = j.name || ''; setIgPhotos(ig) }
      } catch { /* Instagram is a bonus; the site and catalogue carry on */ }
    }
    // Instagram alone: its bio and captions still fill the questions.
    if (!f.website.trim() && !f.pdf.trim() && !bio && !caps.length) {
      setRead(ig.length || bio ? 'ok' : 'fail')
      setFound(ig.length ? [`${ig.length.toLocaleString('ar')} صور من إنستغرام`] : [])
      setReadMsg(ig.length || bio ? '' : 'لم نستطع قراءة حساب إنستغرام. اكتب بياناتك تحت.')
      return
    }
    try {
      const r = await fetch('/api/brand/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website: f.website.trim(), pdf: f.pdf.trim(), instagram_bio: bio, instagram_captions: caps, instagram_name: igName, demo }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setRead('fail')
        setReadMsg(j?.error === 'site_unreachable' ? 'لم نستطع فتح موقعك. تأكد من الرابط، أو اكتب بياناتك تحت.'
          : j?.error === 'too_many' ? 'محاولات كثيرة. انتظر قليلًا، أو اكتب بياناتك تحت.'
          : j?.error === 'sign_in' ? 'سجّل الدخول لنقرأ روابطك.'
          : 'تعذّرت القراءة الآن. اكتب بياناتك تحت، ونحفظ كل ما تكتبه.')
        return
      }
      const a = j.answers || {}
      const S = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
      const list = (v: unknown) => (Array.isArray(v) ? v : []).filter((x) => x && S(x.title)).map((x) => item(S(x.title), S(x.text)))
      const prods = (Array.isArray(a.products) ? a.products : []).filter((x: any) => x && S(x.name)).map((x: any) => ({ id: nid(), name: S(x.name), text: S(x.text), size: S(x.size).slice(0, 40), price: S(x.price).slice(0, 40), photo: S(x.photo) }))
      const socials = j.socials || {}
      setF((p) => ({
        ...p,
        name: p.name || S(a.name).slice(0, 60), kind: p.kind || S(a.kind).slice(0, 60), tagline: p.tagline || S(a.tagline).slice(0, 140), intro: p.intro || S(a.intro).slice(0, 400), city: p.city || S(a.city).slice(0, 80),
        logo: p.logo || j.logo || '',
        phone: p.phone || S(a.contact?.phone), whatsapp: p.whatsapp || S(a.contact?.whatsapp), email: p.email || S(a.contact?.email), address: p.address || S(a.contact?.address),
        instagram: p.instagram || socials.instagram || '', tiktok: p.tiktok || socials.tiktok || '', facebook: p.facebook || socials.facebook || '',
        pdf: p.pdf || j.pdf || '',
        // A brand that already sells online: its own site is where people buy.
        store: p.store || (j.sells && f.website.trim() ? f.website.trim() : ''),
        heading: p.heading || S(a.story?.heading), story: p.story || (Array.isArray(a.story?.paragraphs) ? a.story.paragraphs.map(S).filter(Boolean).join('\n\n') : ''), quote: p.quote || S(a.story?.quote),
        values: p.values.length ? p.values : list(a.values),
        steps: p.steps.length ? p.steps : list(a.steps),
        benefits: p.benefits.length ? p.benefits : list(a.benefits),
        // When the reader matched no picture to any product (one catalogue shot), that shot goes on each; never a wrong picture beside matched ones.
        products: (p.products.some((x) => x.name.trim()) ? p.products : prods.length ? prods : p.products)
          .map((x: Product) => (x.photo || !j.product_images?.[0] || prods.some((q: Product) => q.photo) ? x : { ...x, photo: j.product_images[0] })),
        products_note: p.products_note || S(a.products_note),
        hero: p.hero || j.hero || '',
        checked: false,
      }))
      if (j.logo) setSiteLogo(j.logo)
      setOthers(Array.isArray(j.other_images) ? j.other_images : [])
      setFound([...(j.images || []), ...ig].filter((u: string, i: number, all: string[]) => all.indexOf(u) === i))
      const got = [
        S(a.name) && 'الاسم', S(a.tagline) && 'جملتك', a.story?.paragraphs?.length && 'قصتك', prods.length && `${prods.length.toLocaleString('ar')} منتجات`,
        a.benefits?.length && 'الفوائد', a.steps?.length && 'طريقة الصنع', (a.contact?.phone || a.contact?.email) && 'التواصل', j.images?.length && `${j.images.length.toLocaleString('ar')} صور`,
      ].filter(Boolean)
      setRead('ok')
      setReadMsg(`قرأنا ${[f.website.trim() && 'موقعك', j.pdf && (j.pdf_from_site ? 'الكتالوج الذي وجدناه في موقعك' : 'الكتالوج'), ig.length && 'إنستغرام'].filter(Boolean).join(' و')}، وملأنا: ${got.join('، ')}. كل شيء قابل للتعديل.`)
    } catch {
      setRead('fail'); setReadMsg('تعذّرت القراءة الآن. اكتب بياناتك تحت.')
    }
  }

  useEffect(() => {
    const id = steps[step]?.id
    if (id && moves.current[moves.current.length - 1]?.step !== id) moves.current.push({ step: id, at: Date.now() - started.current })
    if (id === 'brand') void readLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const photos = useMemo(() => {
    const all = [...found.filter((u) => !f.hidden.includes(u)), ...f.uploads]
    return all.filter((u, i) => all.indexOf(u) === i)
  }, [found, f.hidden, f.uploads])

  // The brand's own colours: measured from its logo and top photo, no AI.
  const measure = [f.logo, f.hero, ...photos.slice(0, 2)].filter(Boolean).slice(0, 4).join('|')
  useEffect(() => {
    if (!measure) return
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch('/api/niche/colors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photos: measure.split('|').filter((u, i, a) => u !== f.logo || a.length === 1), logo: f.logo || undefined }), signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (j?.day) setOwn({ id: 'own', name: 'ألوان علامتك', colors: j.day }) })
        .catch(() => { /* the fixed looks stay */ })
    }, 600)
    return () => { clearTimeout(t); ctl.abort() }
  }, [measure])

  const looks = own ? [own, ...BRAND_LOOKS] : BRAND_LOOKS
  const look = looks.find((l) => l.id === f.look) || looks[0]

  const channels = [
    f.whatsapp.trim() && { id: 'whatsapp', label: 'رسالة واتساب' }, f.phone.trim() && { id: 'call', label: 'اتصال' },
    f.store.trim() && { id: 'store', label: 'متجري الإلكتروني' }, f.email.trim() && { id: 'email', label: 'البريد' }, f.instagram.trim() && { id: 'instagram', label: 'رسالة إنستغرام' },
  ].filter(Boolean) as { id: string; label: string }[]
  const buyNow = (channels.some((c) => c.id === f.buy) ? f.buy : channels[0]?.id || '') as Form['buy']
  const contactOk = !!(f.phone.trim() || f.whatsapp.trim() || f.email.trim() || f.store.trim() || f.instagram.trim())
  const ok = {
    brand: f.name.trim().length >= 2 && contactOk && (!f.whatsapp.trim() || intl(f.whatsapp)) && (read !== 'ok' || f.checked),
    products: f.products.some((p) => p.name.trim()),
  }

  function input(): BrandInput {
    const T = (v: string) => v.trim() || undefined
    const items = (xs: Item[]) => xs.filter((x) => x.title.trim()).map((x) => ({ title: x.title.trim(), text: T(x.text), photo: T(x.photo) }))
    // A product's own picture is already on its card; the gallery holds the rest, at most the 16 a site shows.
    const onProducts = new Set(f.products.map((p) => p.photo).filter(Boolean))
    const gallery = photos.filter((u) => u !== f.hero && u !== f.story_photo && !f.noGallery.includes(u) && !onProducts.has(u)).slice(0, 16)
    return {
      name: f.name.trim(), kind: T(f.kind), tagline: T(f.tagline), intro: T(f.intro), city: T(f.city),
      story: { heading: T(f.heading), paragraphs: paras(f.story), quote: T(f.quote), signature: T(f.signature), role: T(f.role) },
      values: items(f.values), steps: items(f.steps), benefits: items(f.benefits),
      products: f.products.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), text: T(p.text), size: T(p.size), price: T(p.price), photo: T(p.photo) })),
      products_note: T(f.products_note),
      timeline: f.timeline.filter((t) => t.year.trim() && t.text.trim()).map((t) => ({ year: t.year.trim(), text: t.text.trim() })),
      team: f.team.filter((t) => t.name.trim()).map((t) => ({ name: t.name.trim(), role: T(t.role), photo: T(t.photo) })),
      reviews: f.reviews.filter((r) => r.name.trim() && r.text.trim()).map((r) => ({ name: r.name.trim(), text: r.text.trim(), from: T(r.from) })),
      press: f.press.filter((x) => x.name.trim() && /^https?:\/\//.test(x.url.trim())).map((x) => ({ name: x.name.trim(), url: x.url.trim() })),
      contact: { phone: T(f.phone), whatsapp: T(f.whatsapp), email: T(f.email), address: T(f.address) },
      links: { instagram: T(f.instagram), tiktok: T(f.tiktok), facebook: T(f.facebook), website: T(f.website), store: T(f.store) },
      buy: buyNow || undefined,
      design: f.design,
      photos: { hero: T(f.hero), story: T(f.story_photo), gallery },
      logo: T(f.logo),
    }
  }

  function fail(msg: string, at?: number) { setError(msg); setErrorKey((k) => k + 1); if (at != null) setStep(at) }

  async function build() {
    setError(null)
    const at = (id: string) => Math.max(0, steps.findIndex((x) => x.id === id))
    if (f.name.trim().length < 2) return fail('اكتب اسم علامتك.', at('brand'))
    if (!contactOk) return fail('أضف طريقة واحدة على الأقل يصل بها الناس إليك: واتساب، هاتف، بريد، رابط متجر، أو إنستغرام.', at('brand'))
    if (f.whatsapp.trim() && !intl(f.whatsapp)) return fail('اكتب رقم واتساب بمفتاح الدولة، مثل ‎+90…', at('brand'))
    if (read === 'ok' && !f.checked) return fail('راجع ما قرأناه من روابطك، ثم أكّد أنه صحيح.', at('brand'))
    if (!ok.products) return fail('أضف منتجًا واحدًا على الأقل.', at('products'))
    const parsed = brandInputSchema.safeParse(input())
    if (!parsed.success) {
      // Point at the answer that broke, not at "the steps".
      const path = parsed.error.issues[0]?.path || []
      const top = String(path[0] || '')
      const where = ['story'].includes(top) ? 'story' : ['values', 'steps'].includes(top) ? 'make' : ['products', 'products_note', 'benefits'].includes(top) ? 'products'
        : ['photos', 'logo'].includes(top) ? 'photos' : ['reviews', 'press', 'team', 'timeline'].includes(top) ? 'trust' : 'brand'
      const what = top === 'photos' && path[1] === 'gallery' ? 'صور المعرض كثيرة: اختر ١٦ صورة على الأكثر.'
        : top === 'products' && typeof path[1] === 'number' ? `المنتج رقم ${(path[1] + 1).toLocaleString('ar')} فيه إجابة أطول من اللازم.`
        : 'إحدى الإجابات هنا أطول من اللازم.'
      if (process.env.NODE_ENV === 'development') console.warn('[brand wizard]', parsed.error.issues.slice(0, 3))
      return fail(what, at(where))
    }
    setLoading(true)
    try {
      const studio = buildBrandContent(parsed.data)
      const meta = { version: 2, moves: moves.current, ms: Date.now() - started.current, links_read: read, checked: f.checked, scrape_issue: f.scrape_issue.trim() || undefined, photos_found: found.length }
      const content = { business_type: 'studio', style_preset: 'ink', color_overrides: look.colors, studio, input: parsed.data, meta, ...(parsed.data.logo ? { seo: { logo: parsed.data.logo } } : {}) }
      if (demo) {
        try { sessionStorage.setItem(DEMO_BUILT_KEY, JSON.stringify(content)) } catch { /* private mode */ }
        router.push('/demo/editor?type=brand&built=1')
        return
      }
      const res = await fetch('/api/themes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: parsed.data.name, images: [studio.hero.photo, ...studio.gallery.images].filter(Boolean), primaryColor: look.colors.accent, secondaryColor: look.colors.background, content }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) { router.push('/login?mode=signup&next=/theme/new/studio'); return }
      if (res.status === 402) { toast({ type: 'warning', message: 'لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.' }); router.push('/pricing'); return }
      if (!res.ok || !j?.id) throw new Error(j?.error || 'فشل الحفظ')
      router.push(`/preview/studio/${j.id}?created=1`)
    } catch (e: any) {
      setLoading(false)
      fail(e?.message || 'حدث خطأ أثناء بناء موقعك.')
    }
  }

  const filled = {
    story: paras(f.story).length, values: f.values.filter((x) => x.title.trim()).length, steps: f.steps.filter((x) => x.title.trim()).length,
    benefits: f.benefits.filter((x) => x.title.trim()).length, products: f.products.filter((x) => x.name.trim()).length,
    withPhoto: f.products.filter((x) => x.name.trim() && x.photo).length,
  }
  const pct = Math.round(100 * [f.name.trim(), contactOk, f.tagline.trim(), filled.story, filled.values || filled.steps, filled.products, f.hero, f.logo].filter(Boolean).length / 8)

  const listEditor = (k: 'values' | 'steps' | 'benefits', label: string, addLabel: string, ph: [string, string], max: number, withPhoto = false) => (
    <div className="zb-list">
      {f[k].map((x, i) => (
        <Card key={x.id} title={x.title || `${label} ${(i + 1).toLocaleString('ar')}`} onRemove={() => drop(k, x.id)}>
          <Grid>
            <Field label="العنوان"><Input value={x.title} onChange={(e) => patch<Item>(k, x.id, { title: e.target.value })} placeholder={ph[0]} /></Field>
            <Field label="سطر يشرحه" wide><Input value={x.text} onChange={(e) => patch<Item>(k, x.id, { text: e.target.value })} placeholder={ph[1]} /></Field>
            {withPhoto ? <PickField label="صورة لهذه الخطوة (اختياري)"><Pick photos={photos} demo={demo} onUpload={addUpload} value={x.photo} onChange={(u) => patch<Item>(k, x.id, { photo: u })} /></PickField> : null}
          </Grid>
        </Card>
      ))}
      {f[k].length < max ? <AddButton onClick={() => up(k, [...f[k], item()])}>{addLabel}</AddButton> : null}
    </div>
  )

  const steps: WizardStep[] = [
    {
      id: 'links', title: 'روابطك أولًا', optional: true, complete: true,
      sub: 'ألصق روابط علامتك. نقرأها ونملأ الأسئلة عنك: الاسم، والقصة، والمنتجات، والتواصل، والصور. ليس عندك روابط؟ اضغط «تخطَّ» واكتبها بنفسك.',
      body: (
        <Grid>
          <Block title="موقعك الحالي" optional hint="إن كان لعلامتك موقع، ولو بسيط. نقرأ نصوصه وصوره، والكتالوج إن كان فيه رابط له.">
            <Input dir="ltr" aria-label="رابط موقعك" value={f.website} onChange={(e) => up('website', e.target.value)} placeholder="https://yourbrand.com" />
          </Block>
          <Block title="إنستغرام" optional hint="نقرأ نبذة الحساب وآخر الصور، ونعرضها عليك لتختار منها.">
            <Input dir="ltr" aria-label="حساب إنستغرام" value={f.instagram} onChange={(e) => up('instagram', e.target.value)} placeholder="@yourbrand" />
          </Block>
          <Block title="كتالوج أو ملف تعريفي (PDF)" optional hint="رابط ملف PDF عن منتجاتك. نقرأ نصوصه ونترجمها إلى العربية. الصور داخل الملف لا نستطيع أخذها بعد، فارفعها في خطوة الصور.">
            <Input dir="ltr" aria-label="رابط الكتالوج" value={f.pdf} onChange={(e) => up('pdf', e.target.value)} placeholder="https://…/catalogue.pdf" />
          </Block>
          {readable ? <Notice tone="accent">اضغط «التالي». نقرأ روابطك ونعرض عليك ما وجدناه لتراجعه.</Notice> : null}
        </Grid>
      ),
    },
    {
      id: 'brand', title: read === 'ok' ? 'راجع ما قرأناه' : 'علامتك',
      sub: read === 'busy' ? 'نقرأ روابطك الآن… يأخذ هذا حتى دقيقة إن كان هناك كتالوج.' : read === 'ok' ? 'هذا ما قرأناه من روابطك. صحّح ما يلزم، ثم أكّد.' : 'اسم علامتك، وما تبيعه، وكيف يصل إليك الناس.',
      complete: ok.brand,
      note: read === 'ok' && !f.checked ? 'أكّد أن ما قرأناه صحيح.' : 'الاسم، وطريقة تواصل واحدة على الأقل.',
      body: (
        <Grid>
          {read === 'busy' ? <Notice tone="accent">نقرأ موقعك{f.pdf || f.website ? ' والكتالوج' : ''}{f.instagram ? ' وإنستغرام' : ''}…</Notice> : null}
          {read === 'ok' && readMsg ? <Notice tone="accent">{readMsg}</Notice> : null}
          {read === 'fail' && readMsg ? <Notice tone="bad">{readMsg}</Notice> : null}
          <Field label="اسم العلامة" required><Input value={f.name} onChange={(e) => up('name', e.target.value)} placeholder="كما يعرفك الناس" /></Field>
          <Field label="ماذا تبيع، في كلمات" hint="يظهر صغيرًا فوق العنوان. مثل: عطور وبخور · الرياض"><Input value={f.kind} onChange={(e) => up('kind', e.target.value)} placeholder="ماء جوز هند طبيعي" /></Field>
          <Field label="جملتك" wide hint="العنوان الكبير أعلى الموقع. جملة واحدة يتذكرها الزائر."><Input value={f.tagline} onChange={(e) => up('tagline', e.target.value)} placeholder="صُنع باليد، ليبقى." /></Field>
          <Field label="سطران عنك" wide><Textarea rows={2} value={f.intro} onChange={(e) => up('intro', e.target.value)} placeholder="ما الذي تصنعه، ولمن." /></Field>
          <Field label="المدينة"><Input value={f.city} onChange={(e) => up('city', e.target.value)} placeholder="اختياري" /></Field>
          <Block title="الشعار" optional hint={f.logo && f.logo === siteLogo ? 'وجدناه في موقعك. غيّره إن لم يكن هو.' : 'إن رفعته نأخذ منه ألوان موقعك.'}>
            <div className="bw-logo"><ImageUploadField local={demo} value={f.logo} onChange={(u) => up('logo', u)} aspect="square" /></div>
          </Block>
          <Block title="كيف يصل إليك الناس؟" hint="طريقة واحدة على الأقل. واتساب بمفتاح الدولة.">
            <Grid>
              <Field label="واتساب"><Input dir="ltr" value={f.whatsapp} onChange={(e) => up('whatsapp', e.target.value)} placeholder="+966…" /></Field>
              <Field label="الهاتف"><Input dir="ltr" value={f.phone} onChange={(e) => up('phone', e.target.value)} placeholder="+90…" /></Field>
              <Field label="البريد"><Input dir="ltr" value={f.email} onChange={(e) => up('email', e.target.value)} placeholder="hello@…" /></Field>
              <Field label="رابط المتجر"><Input dir="ltr" value={f.store} onChange={(e) => up('store', e.target.value)} placeholder="متجر سلة، زد، أمازون…" /></Field>
              <Field label="العنوان" wide><Input value={f.address} onChange={(e) => up('address', e.target.value)} placeholder="اختياري، إن كان لك مكان يزوره الناس" /></Field>
            </Grid>
          </Block>
          {channels.length > 1 ? (
            <Block title="أيّها الزر الرئيسي في موقعك؟" hint="يظهر أعلى الموقع وفي شريط الجوال. الباقي يظهر في قسم التواصل.">
              <Chips allowNone={false} value={buyNow} onChange={(v) => up('buy', v as Form['buy'])} options={channels} />
            </Block>
          ) : null}
          <Block title="حساباتك" optional>
            <Grid>
              <Field label="إنستغرام"><Input dir="ltr" value={f.instagram} onChange={(e) => up('instagram', e.target.value)} placeholder="@" /></Field>
              <Field label="تيك توك"><Input dir="ltr" value={f.tiktok} onChange={(e) => up('tiktok', e.target.value)} placeholder="@" /></Field>
              <Field label="فيسبوك"><Input dir="ltr" value={f.facebook} onChange={(e) => up('facebook', e.target.value)} placeholder="facebook.com/…" /></Field>
            </Grid>
          </Block>
          {read === 'ok' ? (
            <Block title="هل ما قرأناه صحيح؟">
              <Toggle on={f.checked} onChange={(v) => up('checked', v)}>راجعت ما قرأناه، وهو صحيح</Toggle>
              <Field label="شيء قرأناه خطأ؟ أخبرنا (اختياري)" wide><Input value={f.scrape_issue} onChange={(e) => up('scrape_issue', e.target.value)} placeholder="مثل: الهاتف قديم" /></Field>
            </Block>
          ) : null}
        </Grid>
      ),
    },
    {
      id: 'photos', title: 'الصور', optional: true, complete: true,
      sub: found.length ? 'هذه الصور من روابطك. اختر صورة الواجهة وصورة القصة. كل صورة تظهر في المعرض إلا ما تُخرجه منه أو تخفيه.' : 'ارفع صور منتجك وعلامتك. أول صورة تصبح الواجهة، وتغيّرها متى شئت.',
      body: (
        <Grid>
          {photos.length ? (
            <div className="zb-cell wide">
              <div className="bw-grid">
                {photos.map((u) => (
                  <div key={u} className="bw-ph">
                    <img src={u} alt="" loading="lazy" />
                    <div className="bw-roles">
                      <button type="button" data-on={f.hero === u || undefined} onClick={() => up('hero', f.hero === u ? '' : u)}>الواجهة</button>
                      <button type="button" data-on={f.story_photo === u || undefined} onClick={() => up('story_photo', f.story_photo === u ? '' : u)}>القصة</button>
                      <button type="button" data-on={!f.noGallery.includes(u) || undefined} onClick={() => up('noGallery', f.noGallery.includes(u) ? f.noGallery.filter((x) => x !== u) : [...f.noGallery, u])}>في المعرض</button>
                      {found.includes(u) ? <button type="button" className="bw-hide" onClick={() => setF((p) => ({ ...p, hidden: [...p.hidden, u], hero: p.hero === u ? '' : p.hero, story_photo: p.story_photo === u ? '' : p.story_photo }))}>إخفاء</button> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {others.length ? (
            <Block title={`صور أخرى من موقعك (${others.length.toLocaleString('ar')})`} optional hint="فيها كتابة أو رسوم، فأبعدناها عن المعرض. اضغط على صورة لتضيفها.">
              <div className="bw-pick">
                {others.map((u) => (
                  <button key={u} type="button" onClick={() => { setOthers((o) => o.filter((x) => x !== u)); setFound((x) => [...x, u]) }}><img src={u} alt="" loading="lazy" /></button>
                ))}
              </div>
            </Block>
          ) : null}
          <Block title="صور من عندك" optional hint="صور منتجك على خلفية نظيفة تبدو أفضل في فصل المنتجات.">
            <Uploads>
              {[...f.uploads, ''].slice(0, 16).map((u, i) => (
                <ImageUploadField local={demo} key={i + ':' + u} value={u} aspect="square" label={`صورة ${(i + 1).toLocaleString('ar')}`}
                  onChange={(nu) => setF((p) => {
                    const uploads = nu ? (u ? p.uploads.map((x) => (x === u ? nu : x)) : [...p.uploads, nu]) : p.uploads.filter((x) => x !== u)
                    return { ...p, uploads, hero: p.hero || (nu && !u ? nu : p.hero) }
                  })} />
              ))}
            </Uploads>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'story', title: 'قصتك', optional: true, complete: filled.story > 0,
      sub: 'كيف بدأت علامتك؟ اكتبها كما تحكيها لصديق. فقرة لكل جزء. لا نضيف عليها شيئًا.',
      body: (
        <Grid>
          <Field label="عنوان القصة" wide hint="اختياري. بدونه نكتب «كيف بدأت» واسم علامتك."><Input value={f.heading} onChange={(e) => up('heading', e.target.value)} placeholder="بدأت من مطبخ البيت." /></Field>
          <Field label="القصة" wide hint="متى وأين بدأتم؟ من بدأها ولماذا؟ لحظة لا تنسونها؟ سطر فارغ بين الفقرات (حتى أربع)."><Textarea rows={7} value={f.story} onChange={(e) => up('story', e.target.value)} placeholder="بدأنا سنة… حين…" /></Field>
          <Field label="جملة تلخّص وعدك" wide hint="تظهر بخط كبير بجانب القصة."><Input value={f.quote} onChange={(e) => up('quote', e.target.value)} placeholder="إن لم نستعمله نحن، لا نبيعه لك." /></Field>
          <Field label="من يوقّعها" hint="اسمك، أو «المؤسسان»."><Input value={f.signature} onChange={(e) => up('signature', e.target.value)} placeholder="اختياري" /></Field>
          <Field label="صفته"><Input value={f.role} onChange={(e) => up('role', e.target.value)} placeholder="المؤسس" /></Field>
        </Grid>
      ),
    },
    {
      id: 'make', title: 'ما يميّزك وكيف تصنع', optional: true, complete: filled.values + filled.steps > 0,
      sub: 'ما الذي لا تتنازل عنه، وكيف يُصنع منتجك. اختر ما تعرفه فقط؛ ما تتركه فارغًا لا يظهر.',
      body: (
        <Grid>
          <Block title="ما لا تتنازل عنه" optional hint="من قيمة إلى أربع.">{listEditor('values', 'قيمة', 'أضف قيمة', ['طبيعي 100٪', 'بلا سكر مضاف ولا مواد حافظة'], 4)}</Block>
          <Block title="كيف تصنعه" optional hint="الخطوات بالترتيب. نرقّمها لك.">{listEditor('steps', 'خطوة', 'أضف خطوة', ['نختار الثمار', 'من مزارع جنوب شرق آسيا'], 6, true)}</Block>
        </Grid>
      ),
    },
    {
      id: 'products', title: 'منتجاتك', complete: ok.products,
      note: 'أضف منتجًا واحدًا على الأقل.',
      sub: 'كل منتج أو حجم بصورته. السعر اختياري: بدونه يظهر زر «اسأل» على الطريقة التي اخترتها.',
      body: (
        <Grid>
          <div className="zb-cell wide">
            <div className="zb-list">
              {f.products.map((x, i) => (
                <Card key={x.id} title={x.name || `منتج ${(i + 1).toLocaleString('ar')}`} onRemove={f.products.length > 1 ? () => drop('products', x.id) : undefined}>
                  <Grid>
                    <Field label="الاسم" required><Input value={x.name} onChange={(e) => patch<Product>('products', x.id, { name: e.target.value })} placeholder="ماء جوز الهند" /></Field>
                    <Field label="الحجم أو النوع"><Input value={x.size} onChange={(e) => patch<Product>('products', x.id, { size: e.target.value })} placeholder="330 مل" /></Field>
                    <Field label="سطر عنه" wide><Input value={x.text} onChange={(e) => patch<Product>('products', x.id, { text: e.target.value })} placeholder="انتعاش في كل مكان" /></Field>
                    <Field label="السعر"><Input value={x.price} onChange={(e) => patch<Product>('products', x.id, { price: e.target.value })} placeholder="اختياري" /></Field>
                    <PickField label="صورته"><Pick photos={photos} demo={demo} onUpload={addUpload} value={x.photo} onChange={(u) => patch<Product>('products', x.id, { photo: u })} /></PickField>
                  </Grid>
                </Card>
              ))}
              {f.products.length < 24 ? <AddButton onClick={() => up('products', [...f.products, { id: nid(), name: '', text: '', size: '', price: '', photo: '' }])}>أضف منتجًا</AddButton> : null}
            </div>
          </div>
          <Block title="ماذا يقدّم منتجك لمن يستعمله؟" optional hint="فوائده كما تقولها أنت. تظهر في فصل «فوائده».">{listEditor('benefits', 'فائدة', 'أضف فائدة', ['يرطّب أفضل من الماء', 'غني بالأملاح الطبيعية'], 10)}</Block>
          <Field label="ملاحظة تحت المنتجات" wide hint="مثل: الشحن، الجملة، مدة الصلاحية."><Input value={f.products_note} onChange={(e) => up('products_note', e.target.value)} placeholder="اختياري" /></Field>
        </Grid>
      ),
    },
    {
      id: 'trust', title: 'ما يقوله الناس عنك', optional: true,
      complete: f.reviews.length + f.press.length + f.timeline.length + f.team.length > 0,
      sub: 'كلها اختيارية، ولا يظهر منها إلا ما تكتبه. لا نكتب تقييمات أو أرقامًا من عندنا.',
      body: (
        <Grid>
          <Block title="آراء زبائنك" optional hint="انسخ ما كتبوه لك على إنستغرام أو واتساب، باسم صاحبه.">
            <div className="zb-list">
              {f.reviews.map((r) => (
                <Card key={r.id} title={r.name || 'رأي'} onRemove={() => drop('reviews', r.id)}>
                  <Grid>
                    <Field label="الاسم"><Input value={r.name} onChange={(e) => patch<Rev>('reviews', r.id, { name: e.target.value })} /></Field>
                    <Field label="من أين"><Input value={r.from} onChange={(e) => patch<Rev>('reviews', r.id, { from: e.target.value })} placeholder="اختياري" /></Field>
                    <Field label="ما قاله" wide><Textarea rows={2} value={r.text} onChange={(e) => patch<Rev>('reviews', r.id, { text: e.target.value })} /></Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={() => up('reviews', [...f.reviews, { id: nid(), name: '', text: '', from: '' }])}>أضف رأيًا</AddButton>
            </div>
          </Block>
          <Block title="محطات علامتك" optional hint="سنة وحدث. مثل: 2021 · أول متجر.">
            <div className="zb-list">
              {f.timeline.map((t) => (
                <Card key={t.id} title={t.year || 'محطة'} onRemove={() => drop('timeline', t.id)}>
                  <Grid>
                    <Field label="السنة"><Input dir="ltr" value={t.year} onChange={(e) => patch<Mile>('timeline', t.id, { year: e.target.value })} placeholder="2021" /></Field>
                    <Field label="ماذا حدث" wide><Input value={t.text} onChange={(e) => patch<Mile>('timeline', t.id, { text: e.target.value })} /></Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={() => up('timeline', [...f.timeline, { id: nid(), year: '', text: '' }])}>أضف محطة</AddButton>
            </div>
          </Block>
          <Block title="من وراء العلامة" optional hint="بدون صورة يظهر الحرف الأول من الاسم.">
            <div className="zb-list">
              {f.team.map((t) => (
                <Card key={t.id} title={t.name || 'شخص'} onRemove={() => drop('team', t.id)}>
                  <ImageUploadField local={demo} value={t.photo} onChange={(u) => patch<Person>('team', t.id, { photo: u })} aspect="square" label="الصورة" />
                  <Grid>
                    <Field label="الاسم"><Input value={t.name} onChange={(e) => patch<Person>('team', t.id, { name: e.target.value })} /></Field>
                    <Field label="دوره"><Input value={t.role} onChange={(e) => patch<Person>('team', t.id, { role: e.target.value })} /></Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={() => up('team', [...f.team, { id: nid(), name: '', role: '', photo: '' }])}>أضف شخصًا</AddButton>
            </div>
          </Block>
          <Block title="ذُكرت في" optional hint="صحيفة أو برنامج تحدّث عنك، برابط الخبر.">
            <div className="zb-list">
              {f.press.map((x) => (
                <Card key={x.id} title={x.name || 'خبر'} onRemove={() => drop('press', x.id)}>
                  <Grid>
                    <Field label="اسم الجهة"><Input value={x.name} onChange={(e) => patch<Press>('press', x.id, { name: e.target.value })} /></Field>
                    <Field label="رابط الخبر"><Input dir="ltr" value={x.url} onChange={(e) => patch<Press>('press', x.id, { url: e.target.value })} placeholder="https://…" /></Field>
                  </Grid>
                </Card>
              ))}
              <AddButton onClick={() => up('press', [...f.press, { id: nid(), name: '', url: '' }])}>أضف خبرًا</AddButton>
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: 'review', title: 'الشكل والألوان', complete: ok.brand && ok.products,
      sub: own ? 'اختر شكل موقعك. ألوان علامتك أولًا: أخذناها من شعارك وصورك. ثم راجع ما سيظهر في موقعك.' : 'اختر شكل موقعك وألوانه، ثم راجع ما سيظهر فيه. إن رفعت شعارك أو صورك أخذنا منها ألوانك.',
      body: (
        <Grid>
          <Block title="شكل الموقع" hint="الصفحات والمحتوى نفسها في الاثنين. تستطيع تغييره لاحقًا من المحرر.">
            <div className="bw-looks">
              {DESIGNS.map((d) => (
                <button key={d.id} type="button" data-on={f.design === d.id || undefined} onClick={() => up('design', d.id)} style={{ maxWidth: 260 }}>
                  <b style={{ fontSize: 15 }}>{d.name}</b>
                  <span style={{ fontSize: 13, opacity: .75, textAlign: 'start' }}>{d.note}</span>
                </button>
              ))}
            </div>
          </Block>
          <Block title="الألوان">
            <div className="bw-looks">
              {looks.map((l) => (
                <button key={l.id} type="button" data-on={look.id === l.id || undefined} onClick={() => up('look', l.id)}>
                  <span className="bw-sw" style={{ background: l.colors.background, borderColor: l.colors.border }}>
                    <i style={{ background: l.colors.accent }} /><i style={{ background: l.colors.primary }} /><i style={{ background: l.colors.text }} />
                  </span>
                  {l.name}
                </button>
              ))}
            </div>
          </Block>
          <Review
            facts={[
              { label: 'المنتجات', value: `${filled.products.toLocaleString('ar')}${filled.products ? ` · ${filled.withPhoto.toLocaleString('ar')} بصورة` : ''}` },
              { label: 'القصة', value: filled.story ? `${filled.story.toLocaleString('ar')} فقرات` : 'لن تظهر' },
              { label: 'كيف تصنع', value: filled.values + filled.steps ? `${filled.values.toLocaleString('ar')} قيم · ${filled.steps.toLocaleString('ar')} خطوات` : 'لن يظهر' },
              { label: 'الفوائد', value: filled.benefits ? filled.benefits.toLocaleString('ar') : 'لن تظهر' },
              { label: 'الصور', value: `${(photos.length).toLocaleString('ar')}${f.hero ? ' · الواجهة مختارة' : ' · بلا صورة واجهة'}` },
            ]}
            recap={[
              { label: 'الاسم', value: f.name }, { label: 'جملتك', value: f.tagline }, { label: 'الزر الرئيسي', value: channels.find((c) => c.id === buyNow)?.label || '' },
              { label: 'التواصل', value: [f.whatsapp, f.phone, f.email].filter(Boolean).join(' · ') },
            ]}
          />
          {!f.hero ? <Notice tone="bad">لم تختر صورة للواجهة. الموقع يعمل بدونها، لكنه أجمل بها. اختر واحدة في خطوة «الصور».</Notice> : null}
          <Handoff title="بعد البناء" body="كل نص وصورة ولون يتغيّر في المحرر، ولا يظهر في الموقع إلا ما كتبته أو أكّدته." />
        </Grid>
      ),
    },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BW_CSS }} />
      <GenerationOverlay open={loading} />
      <WizardShell
        onExit={onBack}
        chrome={demo}
        eyebrow="قالب علامة تجارية وقصة"
        title="ابنِ موقع علامتك."
        sub="ابدأ بروابطك. نقرأها ونملأ الأسئلة عنك، وأنت تراجع وتؤكد."
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct, label: 'اكتمال موقعك' }}
        scrollKey={errorKey || undefined}
        notice={error ? <Notice tone="bad">{error}</Notice> : undefined}
        final={{ label: loading ? 'نبني موقعك…' : demo ? 'ابنِ وافتح المحرر' : 'ابنِ موقع علامتك', slide: 'هيا بنا', onClick: build, busy: loading }}
      />
    </>
  )
}

const BW_CSS = `
.bw-pick{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:thin}
.bw-pick{align-items:center}
.bw-pick button{flex:none;width:72px;height:72px;border-radius:10px;border:2px solid transparent;padding:0;background:var(--card2,#f1f1f1);color:inherit;overflow:hidden;cursor:pointer}
.bw-up{flex:none;width:80px}
.bw-pick button img{width:100%;height:100%;object-fit:cover}
.bw-pick button[data-on]{border-color:var(--violet,#5e6ad2);box-shadow:0 0 0 2px rgba(94,106,210,.25)}
.bw-pick .bw-none{font:inherit;font-size:12px;color:var(--stone,#56565a);width:72px;box-shadow:inset 0 0 0 1px var(--line2,#e1e1e1)}
.bw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.bw-ph{border:1px solid var(--line2,#e6e6e6);border-radius:12px;overflow:hidden;background:var(--card2,#fff)}
.bw-ph img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#f3f3f3}
.bw-roles{display:flex;flex-wrap:wrap;gap:4px;padding:6px}
.bw-roles button{font:inherit;font-size:12.5px;color:inherit;border:1px solid var(--line2,#e1e1e1);background:transparent;border-radius:99px;padding:4px 9px;cursor:pointer;min-height:30px}
.bw-roles button[data-on]{background:var(--violet,#5e6ad2);border-color:var(--violet,#5e6ad2);color:#fff}
.bw-roles .bw-hide{color:#e5484d;margin-inline-start:auto}
.bw-logo{max-width:160px}
.bw-logo img{object-fit:contain!important;background:#fff;padding:6px}
.bw-looks{display:flex;flex-wrap:wrap;gap:10px}
.bw-looks button{font:inherit;font-size:14px;color:inherit;display:grid;gap:6px;justify-items:start;border:1px solid var(--line2,#e1e1e1);background:var(--card2,#fff);border-radius:12px;padding:10px;cursor:pointer;min-width:132px}
.bw-looks button[data-on]{border-color:var(--violet,#5e6ad2);box-shadow:0 0 0 2px rgba(94,106,210,.25)}
.bw-sw{display:flex;gap:4px;border:1px solid;border-radius:8px;padding:8px;width:100%}
.bw-sw i{width:18px;height:18px;border-radius:50%}
`
