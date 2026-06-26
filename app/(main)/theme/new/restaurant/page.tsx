"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import type { RestaurantInput, RestaurantTypeId } from '@/utils/restaurant/input'
import ImageUploadField from '@/components/ImageUploadField'
import DevFillButton from '@/components/DevFillButton'
import ExampleFillButton from '@/components/ExampleFillButton'
import GenerationOverlay from '@/components/GenerationOverlay'
import AiContentDisclaimer from '@/components/AiContentDisclaimer'

/** Restaurant type chips — drives AI copy tone. Optional. */
const RESTAURANT_TYPES: Array<{ id: RestaurantTypeId; label: string; icon: string }> = [
  { id: 'fine_dining',     label: 'مطعم راقٍ',           icon: '🍽️' },
  { id: 'bistro',          label: 'بيسترو',              icon: '🥖' },
  { id: 'cafe',            label: 'مقهى',                icon: '☕' },
  { id: 'coffee_takeaway', label: 'قهوة · سفري',         icon: '🥤' },
  { id: 'bakery',          label: 'مخبز',                icon: '🥐' },
  { id: 'pizzeria',        label: 'بيتزا',               icon: '🍕' },
  { id: 'bar',             label: 'لاونج · عصائر',        icon: '🧃' },
  { id: 'brunch',          label: 'فطور متأخّر · طوال اليوم', icon: '🥞' },
  { id: 'cafeteria',       label: 'كافيتيريا',           icon: '🍱' },
  { id: 'food_truck',      label: 'عربة طعام',           icon: '🚚' },
  { id: 'dessert',         label: 'حلويات وباتيسري',      icon: '🍰' },
  { id: 'other',           label: 'أخرى',                icon: '🍴' },
]

type Hour = RestaurantInput['location']['hours'][number]

const DEFAULT_HOURS: Hour[] = [
  { day: 'saturday', label: 'السبت', open: '5:30 م', close: '11:00 م' },
  { day: 'sunday', label: 'الأحد', open: '5:00 م', close: '9:30 م' },
  { day: 'monday', label: 'الإثنين', open: '', close: '', closed: true },
  { day: 'tuesday', label: 'الثلاثاء', open: '5:30 م', close: '10:00 م' },
  { day: 'wednesday', label: 'الأربعاء', open: '5:30 م', close: '10:00 م' },
  { day: 'thursday', label: 'الخميس', open: '5:30 م', close: '11:00 م' },
  { day: 'friday', label: 'الجمعة', open: '1:00 م', close: '11:00 م' }
]

type MenuItem = {
  id: string
  name: string
  description: string
  price: string
  badge: string
  image_url: string
}

type Form = {
  brand_name: string
  cuisine: string
  city: string
  neighborhood: string
  restaurant_type: RestaurantTypeId | ''
  address: string
  phone: string
  email: string
  map_link: string
  hours: Hour[]
  categories: Array<{
    id: string
    name: string
    description: string
    items: MenuItem[]
  }>
  story_brief: string
  chef_name: string
  chef_title: string
  chef_bio_brief: string
  // Single field — auto-detected to a provider + value at submit time
  booking: string
  reservation_note: string
  hero_image_url: string
  chef_photo_url: string
  accent_image_url: string
  gallery_image_urls: string[]
  signature_dish_image_urls: string[]
  press_outlets: string
  style_preset: RestaurantInput['style_preset']
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

function emptyItem(): MenuItem {
  return { id: newId(), name: '', description: '', price: '', badge: '', image_url: '' }
}

function buildSampleForm(): Form {
  return {
    brand_name: 'دار نُور',
    cuisine: 'مأكولات شامية عصرية',
    city: 'بيروت',
    neighborhood: 'الجميزة',
    restaurant_type: 'fine_dining',
    address: 'شارع غورو، الجميزة، بيروت',
    phone: '+961 1 555 0140',
    email: 'reservations@darnoor.com',
    map_link: 'https://maps.google.com/?q=Gouraud+St+Beirut',
    hours: [
      { day: 'saturday', label: 'السبت', open: '5:30 م', close: '11:00 م' },
      { day: 'sunday', label: 'الأحد', open: '5:00 م', close: '9:30 م' },
      { day: 'monday', label: 'الإثنين', open: '', close: '', closed: true },
      { day: 'tuesday', label: 'الثلاثاء', open: '5:30 م', close: '10:00 م' },
      { day: 'wednesday', label: 'الأربعاء', open: '5:30 م', close: '10:00 م' },
      { day: 'thursday', label: 'الخميس', open: '5:30 م', close: '11:00 م' },
      { day: 'friday', label: 'الجمعة', open: '1:00 م', close: '11:00 م' },
    ],
    categories: [
      {
        id: newId(),
        name: 'للبداية',
        description: 'أشياء صغيرة، بدايات على مهل.',
        items: [
          { id: newId(), name: 'مقبّلات باردة · مشكّل', description: 'حمّص ومتبّل وورق عنب، تُحضَّر طازجة.', price: '$24', badge: '', image_url: '' },
          { id: newId(), name: 'كبة نية', description: 'لحم مفروم طازج، برغل ناعم، زيت زيتون.', price: '$22', badge: 'الطبق المميّز', image_url: '' },
        ],
      },
      {
        id: newId(),
        name: 'الأطباق الرئيسية',
        description: '',
        items: [
          { id: newId(), name: 'مشاوي مشكّلة', description: 'كباب وشيش طاووق وريش، تُشوى على الفحم.', price: '$42', badge: '', image_url: '' },
          { id: newId(), name: 'سمك مشوي كامل', description: 'بقشرة ملح، ليمون، وزيت الشمر.', price: '$48', badge: '', image_url: '' },
        ],
      },
      {
        id: newId(),
        name: 'الحلويات',
        description: '',
        items: [
          { id: newId(), name: 'كنافة بالجبن', description: 'عجينة ذهبية، قطر بماء الزهر.', price: '$14', badge: '', image_url: '' },
        ],
      },
    ],
    story_brief: 'افتُتح «دار نُور» عام 2019 في منزل قديم بحي الجميزة. أمضى الشيف سامي خوري عشر سنوات بين دمشق وبيروت قبل أن يقدّم مطبخه الدقيق القائم على المكوّن الطازج. القاعة مضاءة بالشموع، وقائمة العصائر الطازجة قصيرة وشخصية، والموسيقى عودٌ شرقي.',
    chef_name: 'الشيف سامي خوري',
    chef_title: 'الشيف · المالك',
    chef_bio_brief: 'تدرّب في كبرى مطابخ الشام. يؤمن بأن أفضل طبق هو الذي يبقى صادقًا لنكهته.',
    booking: 'https://book.darnoor.com',
    reservation_note: 'للمناسبات الخاصة أو المجموعات من 8 أشخاص فأكثر، يُرجى المراسلة على events@darnoor.com.',
    hero_image_url: '',
    chef_photo_url: '',
    accent_image_url: '',
    gallery_image_urls: [],
    signature_dish_image_urls: [],
    press_outlets: 'النهار\nدليل ميشلان\nتايم آوت بيروت\nالشرق الأوسط',
    style_preset: 'onyx',
  }
}

const INITIAL_FORM: Form = {
  brand_name: '',
  cuisine: '',
  city: '',
  neighborhood: '',
  restaurant_type: '',
  address: '',
  phone: '',
  email: '',
  map_link: '',
  hours: DEFAULT_HOURS,
  // Lean default: one category with one item. User can leave it at one or
  // add more — both work now.
  categories: [
    { id: newId(), name: 'القائمة', description: '', items: [emptyItem()] },
  ],
  story_brief: '',
  chef_name: '',
  chef_title: '',
  chef_bio_brief: '',
  booking: '',
  reservation_note: '',
  hero_image_url: '',
  chef_photo_url: '',
  accent_image_url: '',
  gallery_image_urls: [],
  signature_dish_image_urls: [],
  press_outlets: '',
  style_preset: 'onyx',
}

/**
 * Detect reservation provider from a single free-text input.
 * - Resy / OpenTable / SevenRooms URL → that provider
 * - Any other URL → 'resy' (just a link; renderer treats it as a button)
 * - Phone-shaped string → 'phone'
 * - Empty → 'form' (Maison's built-in contact-form path)
 */
function detectBooking(raw: string): {
  type: RestaurantInput['reservations']['provider_type']
  value?: string
} {
  const v = raw.trim()
  if (!v) return { type: 'form' }
  const lower = v.toLowerCase()
  if (lower.includes('resy.com'))       return { type: 'resy', value: v }
  if (lower.includes('opentable.com'))  return { type: 'opentable', value: v }
  if (lower.includes('sevenrooms.com')) return { type: 'sevenrooms', value: v }
  if (/^https?:\/\//i.test(v))          return { type: 'resy', value: v }
  // very loose phone match: 6+ digits across the whole string, ignoring spaces
  const digits = v.replace(/\D/g, '')
  if (digits.length >= 6) return { type: 'phone', value: v }
  return { type: 'form' }
}

/**
 * localStorage draft key for the restaurant form. Scoped per user so
 * different signed-in users don't see each other's drafts on shared
 * devices. Versioned ("v2") so we can bump when the Form shape
 * changes incompatibly.
 */
const DRAFT_KEY_PREFIX = 'zenya:restaurant-form:v2:'

function loadDraft(userId: string): Form | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Light shape check — if the saved blob lacks the categories array
    // we treat it as junk and start fresh rather than crash.
    if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.hours)) {
      return parsed as Form
    }
  } catch {}
  return null
}

function saveDraft(userId: string, form: Form) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY_PREFIX + userId, JSON.stringify(form))
  } catch {
    // QuotaExceeded etc. — silently drop. Only impact is back-nav loses state.
  }
}

function clearDraft(userId: string) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(DRAFT_KEY_PREFIX + userId) } catch {}
}

export default function RestaurantWizardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Auth + draft restore ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new/restaurant')
        return
      }
      setUserId(user.id)
      // Try to restore a prior in-progress draft for this user.
      const draft = loadDraft(user.id)
      if (draft) {
        setForm(draft)
        setRestoredDraft(true)
      }
      setAuthReady(true)
    }
    check()
    return () => { cancelled = true }
  }, [router, supabase])

  // ── Persist on every change ─────────────────────────────────────────
  useEffect(() => {
    if (!authReady || !userId) return
    saveDraft(userId, form)
  }, [authReady, userId, form])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateHour(idx: number, patch: Partial<Hour>) {
    setForm((prev) => ({
      ...prev,
      hours: prev.hours.map((h, i) => (i === idx ? { ...h, ...patch } : h)),
    }))
  }

  function addCategory() {
    setForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id: newId(), name: '', description: '', items: [emptyItem()] },
      ],
    }))
  }
  function removeCategory(catId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== catId),
    }))
  }
  function updateCategory(catId: string, patch: Partial<{ name: string; description: string }>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)),
    }))
  }
  function addItem(catId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, emptyItem()] } : c
      ),
    }))
  }
  function removeItem(catId: string, itemId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      ),
    }))
  }
  function updateItem(catId: string, itemId: string, patch: Partial<MenuItem>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : c
      ),
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
  function setSignatureAt(idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev.signature_dish_image_urls]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, signature_dish_image_urls: next.filter(Boolean) }
    })
  }

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return 'يرجى إدخال اسم المطعم.'
    if (form.cuisine.trim().length < 2)    return 'يرجى إدخال نوع المطبخ.'
    if (form.city.trim().length < 2)       return 'يرجى إدخال المدينة.'
    if (form.address.trim().length < 4)    return 'يرجى إدخال العنوان الكامل.'
    if (form.phone.trim().length < 4)      return 'يرجى إدخال رقم هاتف للتواصل.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'يرجى إدخال بريد إلكتروني صحيح.'
    if (form.story_brief.trim().length < 10) {
      return 'أخبرنا جملةً أو جملتين عن قصة المطعم.'
    }
    // Relaxed: just need ONE valid menu item to generate.
    let validItems = 0
    for (const cat of form.categories) {
      if (cat.name.trim().length < 2) continue
      for (const item of cat.items) {
        if (item.name.trim().length >= 2 && item.price.trim().length >= 1) validItems++
      }
    }
    if (validItems < 1) return 'أضف صنفًا واحدًا على الأقل باسم وسعر.'
    return null
  }

  function buildPayload(): RestaurantInput {
    const detected = detectBooking(form.booking)
    return {
      brand: {
        name: form.brand_name.trim(),
        cuisine: form.cuisine.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        restaurant_type: form.restaurant_type || undefined,
      },
      location: {
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        map_link: form.map_link.trim() || undefined,
        hours: form.hours,
      },
      menu: {
        categories: form.categories
          .filter((c) => c.name.trim().length >= 2)
          .map((c) => ({
            name: c.name.trim(),
            description: c.description.trim() || undefined,
            items: c.items
              .filter((i) => i.name.trim().length >= 2 && i.price.trim().length >= 1)
              .map((i) => ({
                name: i.name.trim(),
                description: i.description.trim() || undefined,
                price: i.price.trim(),
                badge: i.badge.trim() || undefined,
                image_url: i.image_url.trim() || undefined,
              })),
          }))
          .filter((c) => c.items.length > 0),
      },
      story: {
        brief: form.story_brief.trim(),
        chef_name: form.chef_name.trim() || undefined,
        chef_title: form.chef_title.trim() || undefined,
        chef_bio_brief: form.chef_bio_brief.trim() || undefined,
      },
      reservations: {
        provider_type: detected.type,
        provider_value: detected.value || undefined,
        note: form.reservation_note.trim() || undefined,
      },
      visuals: {
        hero_image_url: form.hero_image_url.trim() || undefined,
        chef_photo_url: form.chef_photo_url.trim() || undefined,
        accent_image_url: form.accent_image_url.trim() || undefined,
        gallery_image_urls: form.gallery_image_urls.filter(Boolean),
        signature_dish_image_urls: form.signature_dish_image_urls.filter(Boolean),
      },
      press_outlets: form.press_outlets
        .split(/[\n,]/).map((s) => s.trim()).filter((s) => s.length >= 2).slice(0, 8),
      style_preset: form.style_preset,
    }
  }

  // ── Counts (used by the confirm step + per-row badges) ───────────────
  const counts = (() => {
    let total = 0
    let valid = 0
    for (const cat of form.categories) {
      if (cat.name.trim().length < 2) continue
      for (const item of cat.items) {
        total++
        if (item.name.trim().length >= 2 && item.price.trim().length >= 1) valid++
      }
    }
    return { total, valid, dropped: total - valid }
  })()

  // Entry from the CTA: validate, then pass the AI-content honesty gate once.
  function startGenerate() {
    const err = validate()
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (!acked) { setDisclaimerOpen(true); return }
    void handleGenerate()
  }

  async function handleGenerate() {
    setError(null)
    const err = validate()
    if (err) {
      setError(err)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // If we'll silently drop any rows, surface that to the user.
    if (counts.dropped > 0) {
      const ok = window.confirm(
        `سيُتخطّى ${counts.dropped} من أصناف قائمتك الـ ${counts.total} لأنها تفتقد اسمًا أو سعرًا.\n\nهل تريد التوليد على أي حال؟`
      )
      if (!ok) return
    }
    setLoading(true)
    try {
      const payload = buildPayload()

      const genRes = await fetch('/api/generate-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) {
        throw new Error(genJson?.error || 'فشل التوليد')
      }
      const content = genJson.content

      const preset = RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]

      const saveRes = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.brand_name,
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: {
            business_type: 'restaurant',
            style_preset: form.style_preset,
            restaurant: content,
            input: payload,
          },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) {
        router.push('/login?mode=signup&next=/theme/new/restaurant')
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
      // Keep the draft in localStorage so the user can come back and
      // tweak / regenerate — we don't clear it until they explicitly
      // hit "Start fresh".
      router.push(`/preview/restaurant/${saveJson.id}?created=1`)
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ ما أثناء توليد موقعك.')
      setLoading(false)
    }
  }

  function startFresh() {
    if (!confirm('مسح هذا النموذج والبدء من جديد؟ ستُحذف مسوّدتك.')) return
    if (userId) clearDraft(userId)
    setForm(INITIAL_FORM)
    setRestoredDraft(false)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // "Try an example" — fills the whole form with a ready sample restaurant
  // so a first-time user gets an instant starting point to tweak (change
  // the name, prices, a dish or two) instead of facing a blank form.
  // Generation still goes through the normal flow, so it counts against the
  // user's quota exactly like a hand-typed build.
  function fillExample() {
    const hasContent =
      form.brand_name.trim().length > 0 ||
      form.story_brief.trim().length > 0 ||
      form.categories.some((c) => c.items.some((i) => i.name.trim().length > 0))
    if (
      hasContent &&
      !confirm('سيُملأ النموذج بمثال جاهز (مطعم «دار نُور») ويستبدل ما أدخلته. هل تريد المتابعة؟')
    ) {
      return
    }
    setForm(buildSampleForm())
    setRestoredDraft(false)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">جارٍ التحميل…</div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      {/* gradient bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[560px] w-[560px] rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[520px] w-[520px] translate-x-1/4 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/50 backdrop-blur-2xl" />

      <DevFillButton onFill={() => setForm(buildSampleForm())} />
      <ExampleFillButton onFill={fillExample} />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">قالب المطاعم · دار</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            أخبرنا عن مطعمك.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            بضعة حقول فقط مطلوبة — والباقي اختياري. حتى صنف واحد يكفي للتوليد. يملأ الذكاء الاصطناعي أي فراغات.
          </p>
        </div>

        {restoredDraft && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-[rgba(94,106,210,0.06)] p-4 text-sm text-foreground backdrop-blur">
            <div>
              <strong>حفظنا مسوّدتك.</strong>{' '}
              <span className="text-muted">نُكمل من حيث توقّفت.</span>
            </div>
            <button
              type="button"
              onClick={startFresh}
              className="rounded-full border border-token bg-white px-3 py-1.5 text-[12px] font-semibold text-muted hover:bg-black/5"
            >
              ابدأ من جديد
            </button>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-300 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur">
            {error}
          </div>
        )}

        {/* Section: Basics */}
        <Section title="الأساسيات" subtitle="من أنت وماذا تقدّم.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المطعم" required>
              <input className={inputCls} value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="دار نُور" />
            </Field>
            <Field label="المطبخ" required>
              <input className={inputCls} value={form.cuisine} onChange={(e) => update('cuisine', e.target.value)} placeholder="مأكولات شامية عصرية" />
            </Field>
            <Field label="المدينة" required>
              <input className={inputCls} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="بيروت" />
            </Field>
            <Field label="الحي">
              <input className={inputCls} value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} placeholder="الجميزة" />
            </Field>
          </div>

          {/* What kind of place is it? Drives AI copy tone — café gets
              lighter, morning-energy copy; fine dining is precise and
              quiet; a food truck is direct and punchy. */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              ما نوع المكان؟ <span className="text-muted/60">· اختياري</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {RESTAURANT_TYPES.map((t) => {
                const selected = form.restaurant_type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update('restaurant_type', selected ? '' : t.id)}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                      selected
                        ? 'border-foreground bg-foreground text-white shadow-sm'
                        : 'border-token bg-surface text-foreground hover:border-foreground/40'
                    }`}
                  >
                    <span className="text-[14px] leading-none">{t.icon}</span>
                    {t.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11.5px] text-muted">
              يساعد الذكاء الاصطناعي على كتابة نصوص تناسب أجواء مكانك. تخطَّ إن لم يناسبك شيء.
            </p>
          </div>
        </Section>

        {/* Section: Style */}
        <Section title="النمط البصري" subtitle="اختر المظهر. يمكنك تغييره لاحقًا.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RESTAURANT_PRESETS.map((p) => {
              const selected = form.style_preset === p.id
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => update('style_preset', p.id)}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition ${
                    selected ? 'border-foreground shadow-soft-lg' : 'border-token hover:border-foreground/40'
                  }`}
                  style={{ background: p.colors.background, color: p.colors.text }}
                >
                  <div className="mb-4 flex gap-1.5">
                    <span className="h-6 w-6 rounded-full" style={{ background: p.colors.primary }} />
                    <span className="h-6 w-6 rounded-full" style={{ background: p.colors.accent }} />
                    <span className="h-6 w-6 rounded-full border" style={{ background: p.colors.surface, borderColor: p.colors.border }} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: p.colors.accent, fontFamily: p.heading_font }}>
                    {p.vibe}
                  </p>
                  <p className="mt-1 text-xl" style={{ fontFamily: p.heading_font, color: p.colors.text }}>
                    {p.name}
                  </p>
                  <p className="mt-2 text-xs opacity-80" style={{ color: p.colors.muted }}>
                    {p.description}
                  </p>
                  {selected && (
                    <span className="absolute end-3 top-3 rounded-full bg-foreground px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                      محدّد
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Section: Location & Hours */}
        <Section title="الموقع وساعات العمل" subtitle="أين يجدك الضيوف، ومتى تفتح.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان الكامل" required className="sm:col-span-2">
              <input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="شارع غورو، الجميزة، بيروت" />
            </Field>
            <Field label="الهاتف" required>
              <input className={inputCls} dir="ltr" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+961 1 555 0140" />
            </Field>
            <Field label="البريد الإلكتروني" required>
              <input type="email" dir="ltr" className={inputCls} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="reservations@restaurant.com" />
            </Field>
            <Field label="رابط خرائط Google" className="sm:col-span-2">
              <input className={inputCls} dir="ltr" value={form.map_link} onChange={(e) => update('map_link', e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-token bg-elevated/60 p-5 backdrop-blur-md">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted">ساعات العمل</p>
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
                      placeholder="5:30 م"
                      value={h.open}
                      onChange={(e) => updateHour(idx, { open: e.target.value })}
                      disabled={h.closed}
                    />
                    <input
                      className={inputCls + ' py-2'}
                      placeholder="10:00 م"
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

        {/* Section: Menu */}
        <Section title="القائمة" subtitle="حتى صنف واحد يكفي. أضف صورة لأي صنف — تظهر بجانب الاسم في موقعك المنشور.">
          <div className="space-y-5">
            {form.categories.map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-token bg-elevated/60 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <input
                    className={inputCls + ' flex-1 font-semibold'}
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    placeholder="اسم الفئة (القائمة، الأطباق الرئيسية، الحلويات…)"
                  />
                  {form.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      className="rounded-full border border-token bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-300 hover:text-red-600"
                    >
                      إزالة
                    </button>
                  )}
                </div>
                <input
                  className={inputCls + ' mb-4 text-sm'}
                  value={cat.description}
                  onChange={(e) => updateCategory(cat.id, { description: e.target.value })}
                  placeholder="ملاحظة اختيارية للفئة (مثلاً: «لنبدأ على مهل».)"
                />

                <div className="space-y-4">
                  {cat.items.map((item) => {
                    const itemValid =
                      item.name.trim().length >= 2 && item.price.trim().length >= 1
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 gap-3 rounded-xl border bg-surface/40 p-4 sm:grid-cols-[100px_1fr]"
                        style={{
                          borderColor: itemValid
                            ? 'rgba(21,128,61,0.25)'
                            : 'rgba(217,119,6,0.30)',
                        }}
                      >
                        {/* Per-item image upload */}
                        <ImageUploadField
                          value={item.image_url}
                          onChange={(url) => updateItem(cat.id, item.id, { image_url: url })}
                          aspect="thumb"
                        />
                        <div className="space-y-2">
                          <div className="grid gap-2 sm:grid-cols-[1.5fr_90px_90px_auto]">
                            <input className={inputCls + ' py-2 text-sm'} value={item.name} onChange={(e) => updateItem(cat.id, item.id, { name: e.target.value })} placeholder="اسم الصنف (مطلوب)" />
                            <input className={inputCls + ' py-2 text-sm'} value={item.price} onChange={(e) => updateItem(cat.id, item.id, { price: e.target.value })} placeholder="$24 (مطلوب)" />
                            <input className={inputCls + ' py-2 text-sm'} value={item.badge} onChange={(e) => updateItem(cat.id, item.id, { badge: e.target.value })} placeholder="شارة" />
                            {cat.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(cat.id, item.id)}
                                className="rounded-lg border border-token bg-surface px-2 py-1 text-xs text-muted hover:border-red-300 hover:text-red-600"
                                aria-label="إزالة الصنف"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <input
                            className={inputCls + ' py-2 text-sm'}
                            value={item.description}
                            onChange={(e) => updateItem(cat.id, item.id, { description: e.target.value })}
                            placeholder="وصف موجز (اختياري — سيصقله الذكاء الاصطناعي)"
                          />
                          {/* Status — explicit so users see why an item may not save */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            {itemValid ? (
                              <span className="inline-flex items-center gap-1 text-[#15803d]">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#15803d]" />
                                سيُحفَظ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#b45309]">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#b45309]" />
                                يحتاج <strong className="font-semibold">اسمًا</strong> و<strong className="font-semibold">سعرًا</strong> ليُحفَظ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => addItem(cat.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-token bg-surface px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-elevated"
                >
                  + أضف صنفًا
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCategory}
              className="w-full rounded-2xl border-2 border-dashed border-token bg-transparent py-4 text-sm font-semibold text-muted transition hover:border-foreground/40 hover:text-foreground"
            >
              + أضف فئة للقائمة
            </button>
          </div>
        </Section>

        {/* Section: Story */}
        <Section title="قصتك" subtitle="ملخّص قصير. سيحوّله الذكاء الاصطناعي إلى نص تحريري.">
          <Field label="عن المطعم" required>
            <textarea
              className={inputCls + ' min-h-[140px] resize-y'}
              value={form.story_brief}
              onChange={(e) => update('story_brief', e.target.value)}
              placeholder="بضع جمل. متى افتتحت، وما الفلسفة، ومن أين تستورد، وما الذي يمنح القاعة طابعها الخاص؟"
            />
          </Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="اسم الشيف">
              <input className={inputCls} value={form.chef_name} onChange={(e) => update('chef_name', e.target.value)} placeholder="الشيف سامي خوري" />
            </Field>
            <Field label="لقب الشيف">
              <input className={inputCls} value={form.chef_title} onChange={(e) => update('chef_title', e.target.value)} placeholder="الشيف · المالك" />
            </Field>
            <Field label="نبذة عن الشيف" className="sm:col-span-2">
              <textarea
                className={inputCls + ' min-h-[100px] resize-y'}
                value={form.chef_bio_brief}
                onChange={(e) => update('chef_bio_brief', e.target.value)}
                placeholder="التدريب والخلفية وما الذي أتى به إلى هنا — سيصقله الذكاء الاصطناعي."
              />
            </Field>
          </div>
        </Section>

        {/* Section: Reservations — single input, auto-detected */}
        <Section
          title="الحجوزات"
          subtitle="الصق رابط منصّة الحجز، أو رقم هاتف، أو اتركه فارغًا. سنكتشفه تلقائيًا."
        >
          <Field label="رابط الحجز أو الهاتف (اختياري)">
            <input
              className={inputCls}
              dir="ltr"
              value={form.booking}
              onChange={(e) => update('booking', e.target.value)}
              placeholder="https://book.your-restaurant.com  ·  أو  ·  +961 1 555 0140"
            />
          </Field>
          <Field label="ملاحظة الحجز (اختياري)" className="mt-4">
            <textarea
              className={inputCls + ' min-h-[80px] resize-y'}
              value={form.reservation_note}
              onChange={(e) => update('reservation_note', e.target.value)}
              placeholder="مثلاً: «للمناسبات الخاصة أو 8 أشخاص فأكثر، يُرجى المراسلة على events@...»"
            />
          </Field>
        </Section>

        {/* Section: Visuals — uploads everywhere */}
        <Section title="الصور" subtitle="ارفع صورك الخاصة. أو تخطَّ — نحن نتكفّل بذلك.">
          {/* Reassurance banner — explicit: no photos? not a problem. */}
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl border border-token bg-elevated/60 p-4 backdrop-blur-md"
            style={{ background: 'rgba(94,106,210,0.06)', borderColor: 'rgba(94,106,210,0.25)' }}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]"
              style={{ background: 'rgba(94,106,210,0.12)' }}
            >
              ✨
            </div>
            <div className="text-[13px] leading-[1.55] text-foreground">
              <strong>لا صور؟ لا تقلق.</strong>{' '}
              <span className="text-muted">
                اترك أي خانة صورة فارغة وسنملؤها بصور جميلة خالية من الحقوق تناسب{' '}
                {form.restaurant_type
                  ? <span className="font-medium text-foreground">{RESTAURANT_TYPES.find((t) => t.id === form.restaurant_type)?.label}</span>
                  : 'نوع مطعمك'}
                . يمكنك دائمًا العودة واستبدالها لاحقًا.
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
              label="صورة الشيف"
              value={form.chef_photo_url}
              onChange={(url) => update('chef_photo_url', url)}
              aspect="square"
            />
            <ImageUploadField
              label="صورة مرافقة للقصة"
              value={form.accent_image_url}
              onChange={(url) => update('accent_image_url', url)}
              aspect="square"
              helper="تظهر بجانب قصة الشيف."
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

            <div className="sm:col-span-2">
              <label className="mb-2 block text-[12.5px] font-medium text-foreground">
                صور الأطباق المميّزة (حتى 4)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <ImageUploadField
                    key={`s-${i}`}
                    value={form.signature_dish_image_urls[i] || ''}
                    onChange={(url) => setSignatureAt(i, url)}
                    aspect="square"
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Press */}
        <Section title="الصحافة والجوائز" subtitle="اختياري. واحدة في كل سطر.">
          <textarea
            className={inputCls + ' min-h-[100px] resize-y'}
            value={form.press_outlets}
            onChange={(e) => update('press_outlets', e.target.value)}
            placeholder={'النهار\nدليل ميشلان\nتايم آوت بيروت'}
          />
        </Section>

        {/* Submit */}
        <div className="sticky bottom-6 z-20 mt-12 rounded-3xl border border-token bg-foreground p-5 shadow-soft-lg backdrop-blur-xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-white">
              <p className="text-sm font-semibold">جاهزون متى كنت مستعدًّا.</p>
              <p className="text-xs opacity-70">يستغرق نحو 20 إلى 40 ثانية. سننقلك إلى معاينتك الحيّة.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={startGenerate}
              className="rounded-full bg-amber-400 px-8 py-3.5 text-sm font-bold text-black shadow-soft-md transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? 'جارٍ توليد موقعك…' : 'ولّد موقعي'}
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
  'w-full rounded-xl border border-token bg-surface/80 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 backdrop-blur-md focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15'

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-3xl border border-token bg-surface/60 p-6 shadow-soft-md backdrop-blur-xl sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
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
