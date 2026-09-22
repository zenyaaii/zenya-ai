"use client"

/**
 * The restaurant wizard — the real builder, drawn in the /demo/build design.
 *
 * ONE COMPONENT, TWO ROUTES. /theme/new/restaurant renders it for a signed-in
 * owner and it generates a site. /demo/build renders it with `demo`: nobody is
 * signed in there, so it keeps no draft, reads the analyzer's bundled sample,
 * cannot upload, and its last step hands the reader to the real builder instead
 * of pretending to reach a generator it cannot call.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { RESTAURANT_PRESETS } from "@/utils/restaurant/presets"
import type { RestaurantInput, RestaurantTypeId } from "@/utils/restaurant/input"
import ImageUploadField from "@/components/ImageUploadField"
import MenuImageAnalyzer, { type ExtractedCategory } from "@/components/restaurant/MenuImageAnalyzer"
import DevFillButton from "@/components/DevFillButton"
import ExampleFillButton from "@/components/ExampleFillButton"
import GenerationOverlay from "@/components/GenerationOverlay"
import AiContentDisclaimer from "@/components/AiContentDisclaimer"
import { useNotify } from "@/components/ui/Notify"
import WizardShell, {
  AddButton, Block, Card, Chips, Field, Grid, Handoff, Hours, Input, Notice, Presets, Review, Textarea, Uploads,
  type WizardStep,
} from "../WizardShell"

/** Restaurant type chips — drives AI copy tone. Optional. */
const RESTAURANT_TYPES: Array<{ id: RestaurantTypeId; label: string }> = [
  { id: "fine_dining", label: "مطعم راقٍ" },
  { id: "bistro", label: "بيسترو" },
  { id: "cafe", label: "مقهى" },
  { id: "coffee_takeaway", label: "قهوة · سفري" },
  { id: "bakery", label: "مخبز" },
  { id: "pizzeria", label: "بيتزا" },
  { id: "bar", label: "لاونج · عصائر" },
  { id: "brunch", label: "فطور متأخّر · طوال اليوم" },
  { id: "cafeteria", label: "كافيتيريا" },
  { id: "food_truck", label: "عربة طعام" },
  { id: "dessert", label: "حلويات وباتيسري" },
  { id: "other", label: "أخرى" },
]

type Hour = RestaurantInput["location"]["hours"][number]

const DEFAULT_HOURS: Hour[] = [
  { day: "saturday", label: "السبت", open: "5:30 م", close: "11:00 م" },
  { day: "sunday", label: "الأحد", open: "5:00 م", close: "9:30 م" },
  { day: "monday", label: "الإثنين", open: "", close: "", closed: true },
  { day: "tuesday", label: "الثلاثاء", open: "5:30 م", close: "10:00 م" },
  { day: "wednesday", label: "الأربعاء", open: "5:30 م", close: "10:00 م" },
  { day: "thursday", label: "الخميس", open: "5:30 م", close: "11:00 م" },
  { day: "friday", label: "الجمعة", open: "1:00 م", close: "11:00 م" },
]

type MenuItem = { id: string; name: string; description: string; price: string; badge: string; image_url: string }

type Form = {
  brand_name: string
  cuisine: string
  city: string
  neighborhood: string
  restaurant_type: RestaurantTypeId | ""
  address: string
  phone: string
  email: string
  map_link: string
  hours: Hour[]
  categories: Array<{ id: string; name: string; description: string; items: MenuItem[] }>
  story_brief: string
  chef_name: string
  chef_title: string
  chef_bio_brief: string
  booking: string
  reservation_note: string
  hero_image_url: string
  chef_photo_url: string
  accent_image_url: string
  gallery_image_urls: string[]
  signature_dish_image_urls: string[]
  press_outlets: string
  style_preset: RestaurantInput["style_preset"]
}

function newId() {
  return Math.random().toString(36).slice(2, 9)
}

// Progressive reveal for long menus: purely visual, every item still submits.
const ITEMS_COLLAPSED = 5
const ITEMS_BATCH = 10

function emptyItem(): MenuItem {
  return { id: newId(), name: "", description: "", price: "", badge: "", image_url: "" }
}

function buildSampleForm(): Form {
  return {
    brand_name: "دار نُور",
    cuisine: "مأكولات شامية عصرية",
    city: "بيروت",
    neighborhood: "الجميزة",
    restaurant_type: "fine_dining",
    address: "شارع غورو، الجميزة، بيروت",
    phone: "+961 1 555 0140",
    email: "reservations@darnoor.com",
    map_link: "https://maps.google.com/?q=Gouraud+St+Beirut",
    hours: DEFAULT_HOURS.map((h) => ({ ...h })),
    categories: [
      {
        id: newId(), name: "للبداية", description: "أشياء صغيرة، بدايات على مهل.",
        items: [
          { id: newId(), name: "مقبّلات باردة · مشكّل", description: "حمّص ومتبّل وورق عنب، تُحضَّر طازجة.", price: "$24", badge: "", image_url: "" },
          { id: newId(), name: "كبة نية", description: "لحم مفروم طازج، برغل ناعم، زيت زيتون.", price: "$22", badge: "الطبق المميّز", image_url: "" },
        ],
      },
      {
        id: newId(), name: "الأطباق الرئيسية", description: "",
        items: [
          { id: newId(), name: "مشاوي مشكّلة", description: "كباب وشيش طاووق وريش، تُشوى على الفحم.", price: "$42", badge: "", image_url: "" },
          { id: newId(), name: "سمك مشوي كامل", description: "بقشرة ملح، ليمون، وزيت الشمر.", price: "$48", badge: "", image_url: "" },
        ],
      },
      {
        id: newId(), name: "الحلويات", description: "",
        items: [{ id: newId(), name: "كنافة بالجبن", description: "عجينة ذهبية، قطر بماء الزهر.", price: "$14", badge: "", image_url: "" }],
      },
    ],
    story_brief: "افتُتح «دار نُور» عام 2019 في منزل قديم بحي الجميزة. أمضى الشيف سامي خوري عشر سنوات بين دمشق وبيروت قبل أن يقدّم مطبخه الدقيق القائم على المكوّن الطازج. القاعة مضاءة بالشموع، وقائمة العصائر الطازجة قصيرة وشخصية، والموسيقى عودٌ شرقي.",
    chef_name: "الشيف سامي خوري",
    chef_title: "الشيف · المالك",
    chef_bio_brief: "تدرّب في كبرى مطابخ الشام. يؤمن بأن أفضل طبق هو الذي يبقى صادقًا لنكهته.",
    booking: "",
    reservation_note: "للمناسبات الخاصة أو المجموعات من 8 أشخاص فأكثر، يُرجى المراسلة على events@darnoor.com.",
    hero_image_url: "",
    chef_photo_url: "",
    accent_image_url: "",
    gallery_image_urls: [],
    signature_dish_image_urls: [],
    press_outlets: "النهار\nدليل ميشلان\nتايم آوت بيروت\nالشرق الأوسط",
    style_preset: "onyx",
  }
}

const initialForm = (): Form => ({
  brand_name: "", cuisine: "", city: "", neighborhood: "", restaurant_type: "",
  address: "", phone: "", email: "", map_link: "",
  hours: DEFAULT_HOURS.map((h) => ({ ...h })),
  categories: [{ id: newId(), name: "القائمة", description: "", items: [emptyItem()] }],
  story_brief: "", chef_name: "", chef_title: "", chef_bio_brief: "",
  booking: "", reservation_note: "",
  hero_image_url: "", chef_photo_url: "", accent_image_url: "",
  gallery_image_urls: [], signature_dish_image_urls: [],
  press_outlets: "",
  style_preset: "onyx",
})

/**
 * Reservations always run through Zenya's own booking system. A phone-shaped
 * value is the fallback call-to-reserve number; anything else is the form.
 */
function detectBooking(raw: string): { type: RestaurantInput["reservations"]["provider_type"]; value?: string } {
  const v = raw.trim()
  if (!v) return { type: "form" }
  if (v.replace(/\D/g, "").length >= 6) return { type: "phone", value: v }
  return { type: "form" }
}

/** Draft key, per user and versioned for incompatible Form changes. */
const DRAFT_KEY_PREFIX = "zenya:restaurant-form:v2:"

function loadDraft(userId: string): Form | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.hours)) return parsed as Form
  } catch {}
  return null
}
function saveDraft(userId: string, form: Form) {
  try { localStorage.setItem(DRAFT_KEY_PREFIX + userId, JSON.stringify(form)) } catch {}
}
function clearDraft(userId: string) {
  try { localStorage.removeItem(DRAFT_KEY_PREFIX + userId) } catch {}
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export default function RestaurantWizard({ demo = false }: { demo?: boolean }) {
  const router = useRouter()
  const { confirm, toast } = useNotify()
  const [authReady, setAuthReady] = useState(demo)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(initialForm)
  const [visibleByCat, setVisibleByCat] = useState<Record<string, number>>({})
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [step, setStep] = useState(0)

  // ── Auth + draft restore (not on the public demo) ─────────────────────
  useEffect(() => {
    if (demo) return
    let cancelled = false
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      if (!user) {
        router.push("/login?mode=signup&next=/theme/new/restaurant")
        return
      }
      setUserId(user.id)
      const draft = loadDraft(user.id)
      if (draft) {
        setForm(draft)
        setRestoredDraft(true)
      }
      setAuthReady(true)
    })
    return () => { cancelled = true }
  }, [demo, router])

  useEffect(() => {
    if (demo || !authReady || !userId) return
    saveDraft(userId, form)
  }, [demo, authReady, userId, form])

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function updateHour(idx: number, patch: Partial<Hour>) {
    setForm((prev) => ({ ...prev, hours: prev.hours.map((h, i) => (i === idx ? { ...h, ...patch } : h)) }))
  }
  function addCategory() {
    setForm((prev) => ({ ...prev, categories: [...prev.categories, { id: newId(), name: "", description: "", items: [emptyItem()] }] }))
  }
  function removeCategory(catId: string) {
    setForm((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== catId) }))
  }
  function updateCategory(catId: string, patch: Partial<{ name: string; description: string }>) {
    setForm((prev) => ({ ...prev, categories: prev.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) }))
  }
  function addItem(catId: string) {
    setForm((prev) => {
      const cat = prev.categories.find((c) => c.id === catId)
      if (cat) setVisibleByCat((v) => ({ ...v, [catId]: cat.items.length + 1 }))
      return { ...prev, categories: prev.categories.map((c) => (c.id === catId ? { ...c, items: [...c.items, emptyItem()] } : c)) }
    })
  }
  function removeItem(catId: string, itemId: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)),
    }))
  }
  function updateItem(catId: string, itemId: string, patch: Partial<MenuItem>) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : c
      ),
    }))
  }

  /**
   * Categories read from a menu photo. An untouched default menu is replaced;
   * otherwise they are appended, so hand-typed work is never wiped.
   */
  function applyExtractedMenu(extracted: ExtractedCategory[]): { categories: number; items: number } {
    const mapped = extracted
      .map((c) => ({
        id: newId(),
        name: (c.name || "").trim().slice(0, 40),
        description: (c.description || "").trim().slice(0, 160),
        items: (Array.isArray(c.items) ? c.items : [])
          .map((it) => ({
            id: newId(),
            name: (it.name || "").trim().slice(0, 80),
            description: (it.description || "").trim().slice(0, 220),
            price: (it.price || "").trim().slice(0, 30),
            badge: (it.badge || "").trim().slice(0, 20),
            image_url: "",
          }))
          .filter((it) => it.name.length >= 1),
      }))
      .filter((c) => c.name.length >= 2 && c.items.length > 0)
    if (mapped.length === 0) return { categories: 0, items: 0 }
    setForm((prev) => {
      const isDefaultEmpty = prev.categories.every(
        (c) => c.name.trim() === "" || (c.name.trim() === "القائمة" && c.items.every((i) => i.name.trim() === "" && i.price.trim() === ""))
      )
      return { ...prev, categories: isDefaultEmpty ? mapped : [...prev.categories, ...mapped] }
    })
    return { categories: mapped.length, items: mapped.reduce((n, c) => n + c.items.length, 0) }
  }

  function setListAt(key: "gallery_image_urls" | "signature_dish_image_urls", idx: number, url: string) {
    setForm((prev) => {
      const next = [...prev[key]]
      if (url) next[idx] = url
      else next.splice(idx, 1)
      return { ...prev, [key]: next.filter(Boolean) }
    })
  }

  // ── Counts ────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
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
  }, [form.categories])

  // ── Per-step completeness, from the same thresholds validate() uses ────
  const ok = {
    basics: form.brand_name.trim().length >= 2 && form.cuisine.trim().length >= 2 && form.city.trim().length >= 2,
    place: form.address.trim().length >= 4 && form.phone.trim().length >= 4 && EMAIL_RE.test(form.email.trim()),
    menu: counts.valid >= 1,
    story: form.story_brief.trim().length >= 10,
  }
  const required = [
    form.brand_name.trim().length >= 2, form.cuisine.trim().length >= 2, form.city.trim().length >= 2,
    form.address.trim().length >= 4, form.phone.trim().length >= 4, EMAIL_RE.test(form.email.trim()),
    counts.valid >= 1, form.story_brief.trim().length >= 10,
  ]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (form.brand_name.trim().length < 2) return "يرجى إدخال اسم المطعم."
    if (form.cuisine.trim().length < 2) return "يرجى إدخال نوع المطبخ."
    if (form.city.trim().length < 2) return "يرجى إدخال المدينة."
    if (form.address.trim().length < 4) return "يرجى إدخال العنوان الكامل."
    if (form.phone.trim().length < 4) return "يرجى إدخال رقم هاتف للتواصل."
    if (!EMAIL_RE.test(form.email.trim())) return "يرجى إدخال بريد إلكتروني صحيح."
    if (form.story_brief.trim().length < 10) return "أخبرنا جملةً أو جملتين عن قصة المطعم."
    if (counts.valid < 1) return "أضف صنفًا واحدًا على الأقل باسم وسعر."
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
      press_outlets: form.press_outlets.split(/[\n,]/).map((s) => s.trim()).filter((s) => s.length >= 2).slice(0, 8),
      style_preset: form.style_preset,
    }
  }

  /** Send the owner back to the first step that stops generation. */
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
    if (counts.dropped > 0) {
      const { confirmed } = await confirm({
        title: "بعض الأصناف ستُتخطّى",
        message: `سيُتخطّى ${counts.dropped} من أصناف قائمتك الـ ${counts.total} لأنها تفتقد اسمًا أو سعرًا. هل تريد التوليد على أي حال؟`,
        confirmText: "توليد على أي حال",
      })
      if (!confirmed) return
    }
    setLoading(true)
    try {
      const payload = buildPayload()
      const genRes = await fetch("/api/generate-restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const genJson = await genRes.json()
      if (!genRes.ok || !genJson?.content) throw new Error(genJson?.error || "فشل التوليد")

      const preset = RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]
      const saveRes = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.brand_name,
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: preset.colors.primary,
          secondaryColor: preset.colors.accent,
          content: { business_type: "restaurant", style_preset: form.style_preset, restaurant: genJson.content, input: payload },
        }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.status === 401) { router.push("/login?mode=signup&next=/theme/new/restaurant"); return }
      if (saveRes.status === 402) {
        toast({ type: "warning", message: "لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة." })
        router.push("/pricing")
        return
      }
      if (!saveRes.ok || !saveJson?.id) throw new Error(saveJson?.error || "فشل الحفظ")
      // The draft stays, so the owner can come back and regenerate.
      router.push(`/preview/restaurant/${saveJson.id}?created=1`)
    } catch (e: any) {
      setError(e?.message || "حدث خطأ ما أثناء توليد موقعك.")
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  async function startFresh() {
    const { confirmed } = await confirm({
      title: "مسح النموذج والبدء من جديد؟",
      message: "ستُحذف مسوّدتك الحالية.",
      confirmText: "ابدأ من جديد",
      tone: "danger",
    })
    if (!confirmed) return
    if (userId) clearDraft(userId)
    setForm(initialForm())
    setRestoredDraft(false)
    setError(null)
    setStep(0)
  }

  const typeLabel = RESTAURANT_TYPES.find((t) => t.id === form.restaurant_type)?.label
  const photoCount =
    [form.hero_image_url, form.chef_photo_url, form.accent_image_url].filter(Boolean).length +
    form.gallery_image_urls.length + form.signature_dish_image_urls.length

  const steps: WizardStep[] = [
    {
      id: "basics",
      title: "الأساسيات",
      sub: "من أنت وماذا تقدّم.",
      complete: ok.basics,
      note: "أدخل اسم المطعم والمطبخ والمدينة.",
      body: (
        <Grid>
          <Field label="اسم المطعم" required>
            <Input value={form.brand_name} onChange={(e) => update("brand_name", e.target.value)} placeholder="دار نُور" />
          </Field>
          <Field label="المطبخ" required>
            <Input value={form.cuisine} onChange={(e) => update("cuisine", e.target.value)} placeholder="مأكولات شامية عصرية" />
          </Field>
          <Field label="المدينة" required>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="بيروت" />
          </Field>
          <Field label="الحي">
            <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} placeholder="الجميزة" />
          </Field>
          <Block title="ما نوع المكان؟" optional hint="يساعد الذكاء الاصطناعي على كتابة نصوص تناسب أجواء مكانك. تخطَّ إن لم يناسبك شيء.">
            <Chips options={RESTAURANT_TYPES} value={form.restaurant_type} onChange={(id) => update("restaurant_type", id as RestaurantTypeId | "")} />
          </Block>
        </Grid>
      ),
    },
    {
      id: "style",
      title: "النمط البصري",
      sub: "اختر المظهر. يمكنك تغييره لاحقًا.",
      complete: true,
      body: (
        <Presets presets={RESTAURANT_PRESETS} value={form.style_preset} onChange={(id) => update("style_preset", id as Form["style_preset"])} />
      ),
    },
    {
      id: "place",
      title: "الموقع وساعات العمل",
      sub: "أين يجدك الضيوف، ومتى تفتح.",
      complete: ok.place,
      note: "أدخل العنوان والهاتف وبريدًا إلكترونيًا صحيحًا.",
      body: (
        <Grid>
          <Field label="العنوان الكامل" required wide>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="شارع غورو، الجميزة، بيروت" />
          </Field>
          <Field label="الهاتف" required>
            <Input dir="ltr" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+961 1 555 0140" />
          </Field>
          <Field label="البريد الإلكتروني" required>
            <Input type="email" dir="ltr" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="reservations@restaurant.com" />
          </Field>
          <Field label="رابط خرائط Google" wide>
            <Input dir="ltr" value={form.map_link} onChange={(e) => update("map_link", e.target.value)} placeholder="https://maps.google.com/..." />
          </Field>
          <Block title="ساعات العمل">
            <Hours hours={form.hours} onChange={(i, patch) => updateHour(i, patch as Partial<Hour>)} openPh="5:30 م" closePh="10:00 م" />
          </Block>
        </Grid>
      ),
    },
    {
      id: "menu",
      title: "القائمة",
      sub: "حتى صنف واحد يكفي. أضف صورة لأي صنف — تظهر بجانب الاسم في موقعك المنشور.",
      complete: ok.menu,
      note: "أضف صنفًا واحدًا على الأقل باسم وسعر.",
      body: (
        <Grid>
          <Block>
            <div className="zb-analyzer">
              <MenuImageAnalyzer cuisine={form.cuisine} demo={demo} onExtract={applyExtractedMenu} />
              {demo ? (
                <p className="zb-note">
                  على هذه الصفحة العامة يقرأ التحليل قائمة نموذجية جاهزة، لا الصورة التي ترفعها. داخل المنشئ الحقيقي يُقرأ ملفك أنت.
                </p>
              ) : null}
            </div>
            <div className="zb-list">
              {form.categories.map((cat, ci) => {
                const shown = Math.min(visibleByCat[cat.id] ?? ITEMS_COLLAPSED, cat.items.length)
                const hidden = cat.items.length - shown
                return (
                  <Card
                    key={cat.id}
                    title={"قسم " + (ci + 1)}
                    onRemove={form.categories.length > 1 ? () => removeCategory(cat.id) : undefined}
                    removeLabel={"حذف القسم " + (ci + 1)}
                  >
                    <Grid>
                      <Field label="اسم القسم">
                        <Input value={cat.name} onChange={(e) => updateCategory(cat.id, { name: e.target.value })} placeholder="الأطباق الرئيسية" />
                      </Field>
                      <Field label="ملاحظة القسم (اختياري)">
                        <Input value={cat.description} onChange={(e) => updateCategory(cat.id, { description: e.target.value })} placeholder="لنبدأ على مهل." />
                      </Field>
                    </Grid>
                    {cat.items.slice(0, shown).map((item, ii) => {
                      const valid = item.name.trim().length >= 2 && item.price.trim().length >= 1
                      return (
                        <div key={item.id} className="zb-mi">
                          {demo ? (
                            <span aria-hidden />
                          ) : (
                            <ImageUploadField value={item.image_url} onChange={(url) => updateItem(cat.id, item.id, { image_url: url })} aspect="thumb" />
                          )}
                          <div className="zb-mi-f">
                            <div className="zb-mi-row">
                              <Input value={item.name} onChange={(e) => updateItem(cat.id, item.id, { name: e.target.value })} placeholder="اسم الصنف" aria-label={"اسم الصنف " + (ii + 1)} />
                              <Input value={item.price} onChange={(e) => updateItem(cat.id, item.id, { price: e.target.value })} placeholder="$24" aria-label={"سعر الصنف " + (ii + 1)} dir="ltr" />
                              <Input value={item.badge} onChange={(e) => updateItem(cat.id, item.id, { badge: e.target.value })} placeholder="شارة" aria-label={"شارة الصنف " + (ii + 1)} />
                              {cat.items.length > 1 ? (
                                <button type="button" className="zb-icon" aria-label={"حذف الصنف " + (ii + 1)} onClick={() => removeItem(cat.id, item.id)}>
                                  <TrashGlyph />
                                </button>
                              ) : <span aria-hidden />}
                            </div>
                            <Input value={item.description} onChange={(e) => updateItem(cat.id, item.id, { description: e.target.value })} placeholder="وصف موجز (اختياري — سيصقله الذكاء الاصطناعي)" aria-label={"وصف الصنف " + (ii + 1)} />
                            <span className="zb-mi-state" data-ok={valid ? "true" : undefined}>
                              {valid ? "سيُحفَظ" : "يحتاج اسمًا وسعرًا ليُحفَظ"}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {hidden > 0 || shown > ITEMS_COLLAPSED ? (
                      <div className="zb-chips">
                        {hidden > 0 ? (
                          <button type="button" className="zb-quiet" onClick={() => setVisibleByCat((v) => ({ ...v, [cat.id]: Math.min(shown + ITEMS_BATCH, cat.items.length) }))}>
                            عرض {Math.min(ITEMS_BATCH, hidden)} صنفًا آخر ({hidden} مخفية)
                          </button>
                        ) : null}
                        {shown > ITEMS_COLLAPSED ? (
                          <button type="button" className="zb-quiet" onClick={() => setVisibleByCat((v) => ({ ...v, [cat.id]: ITEMS_COLLAPSED }))}>طيّ</button>
                        ) : null}
                      </div>
                    ) : null}
                    <AddButton onClick={() => addItem(cat.id)}>صنف آخر</AddButton>
                  </Card>
                )
              })}
              <AddButton onClick={addCategory}>قسم آخر</AddButton>
            </div>
          </Block>
        </Grid>
      ),
    },
    {
      id: "story",
      title: "قصتك",
      sub: "ملخّص قصير. سيحوّله الذكاء الاصطناعي إلى نص تحريري.",
      complete: ok.story,
      note: "أخبرنا جملةً أو جملتين عن قصة المطعم.",
      body: (
        <Grid>
          <Field label="عن المطعم" required wide>
            <Textarea rows={4} value={form.story_brief} onChange={(e) => update("story_brief", e.target.value)} placeholder="بضع جمل. متى افتتحت، وما الفلسفة، ومن أين تستورد، وما الذي يمنح القاعة طابعها الخاص؟" />
          </Field>
          <Field label="اسم الشيف">
            <Input value={form.chef_name} onChange={(e) => update("chef_name", e.target.value)} placeholder="الشيف سامي خوري" />
          </Field>
          <Field label="لقب الشيف">
            <Input value={form.chef_title} onChange={(e) => update("chef_title", e.target.value)} placeholder="الشيف · المالك" />
          </Field>
          <Field label="نبذة عن الشيف" wide>
            <Textarea value={form.chef_bio_brief} onChange={(e) => update("chef_bio_brief", e.target.value)} placeholder="التدريب والخلفية وما الذي أتى به إلى هنا — سيصقله الذكاء الاصطناعي." />
          </Field>
        </Grid>
      ),
    },
    {
      id: "booking",
      title: "الحجوزات",
      sub: "تصل الحجوزات مباشرةً إلى لوحة تحكّمك في زينيا — بلا منصّات خارجية.",
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="رقم هاتف للحجز (احتياطي، اختياري)" wide hint="يظهر كزر «اتصل للحجز» للزوّار على الباقة المجانية.">
            <Input dir="ltr" value={form.booking} onChange={(e) => update("booking", e.target.value)} placeholder="+961 1 555 0140" />
          </Field>
          <Field label="ملاحظة الحجز (اختياري)" wide>
            <Textarea value={form.reservation_note} onChange={(e) => update("reservation_note", e.target.value)} placeholder="مثلاً: «للمناسبات الخاصة أو 8 أشخاص فأكثر، يُرجى المراسلة على events@...»" />
          </Field>
        </Grid>
      ),
    },
    {
      id: "visuals",
      title: "الصور",
      sub: "ارفع صورك الخاصة. أو تخطَّ — نحن نتكفّل بذلك.",
      optional: true,
      complete: true,
      body: demo ? (
        <Grid>
          <Block hint="رفع الصور يحتاج حسابًا، ويتم داخل المنشئ الحقيقي: الصورة الرئيسية، وصورة الشيف، ومعرض حتى 8 صور، وصور الأطباق المميّزة حتى 4.">
            <p className="zb-note">لا صور؟ لا تقلق. اترك أي خانة فارغة وسنملؤها بصور خالية من الحقوق تناسب نوع مطعمك.</p>
          </Block>
        </Grid>
      ) : (
        <Grid>
          <Block>
            <p className="zb-note">
              لا صور؟ لا تقلق. اترك أي خانة فارغة وسنملؤها بصور جميلة خالية من الحقوق تناسب {typeLabel || "نوع مطعمك"}. يمكنك دائمًا العودة واستبدالها لاحقًا.
            </p>
            <ImageUploadField label="الصورة الرئيسية" value={form.hero_image_url} onChange={(url) => update("hero_image_url", url)} aspect="wide" helper="الصورة الكبيرة أعلى صفحتك." />
            <Uploads cols={2}>
              <ImageUploadField label="صورة الشيف" value={form.chef_photo_url} onChange={(url) => update("chef_photo_url", url)} aspect="square" />
              <ImageUploadField label="صورة مرافقة للقصة" value={form.accent_image_url} onChange={(url) => update("accent_image_url", url)} aspect="square" helper="تظهر بجانب قصة الشيف." />
            </Uploads>
          </Block>
          <Block title="المعرض (حتى 8)">
            <Uploads>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <ImageUploadField key={"g-" + i} value={form.gallery_image_urls[i] || ""} onChange={(url) => setListAt("gallery_image_urls", i, url)} aspect="square" />
              ))}
            </Uploads>
          </Block>
          <Block title="صور الأطباق المميّزة (حتى 4)">
            <Uploads>
              {[0, 1, 2, 3].map((i) => (
                <ImageUploadField key={"s-" + i} value={form.signature_dish_image_urls[i] || ""} onChange={(url) => setListAt("signature_dish_image_urls", i, url)} aspect="square" />
              ))}
            </Uploads>
          </Block>
        </Grid>
      ),
    },
    {
      id: "press",
      title: "الصحافة والجوائز",
      sub: "اختياري. واحدة في كل سطر.",
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Field label="الصحافة والجوائز" wide>
            <Textarea rows={4} value={form.press_outlets} onChange={(e) => update("press_outlets", e.target.value)} placeholder={"النهار\nدليل ميشلان\nتايم آوت بيروت"} />
          </Field>
        </Grid>
      ),
    },
    {
      id: "review",
      title: "المراجعة",
      sub: "كل ما ستبني عليه. راجعه قبل التوليد.",
      complete: required.every(Boolean),
      note: "ينقص شيء مطلوب في خطوة سابقة.",
      body: (
        <Grid>
          <Review
            facts={[
              { label: "الحقول المطلوبة", value: `${required.filter(Boolean).length} من ${required.length}` },
              { label: "النمط", value: RESTAURANT_PRESETS.find((p) => p.id === form.style_preset)?.name ?? "—" },
              { label: "نوع المكان", value: typeLabel ?? "—" },
              { label: "أصناف القائمة", value: counts.dropped ? `${counts.valid} (+${counts.dropped} ناقصة)` : counts.valid },
              { label: "أيام مفتوحة", value: `${form.hours.filter((h) => !h.closed).length} من 7` },
              { label: "الصور", value: photoCount },
            ]}
            recap={[
              { label: "اسم المطعم", value: form.brand_name },
              { label: "المطبخ", value: form.cuisine },
              { label: "المدينة", value: [form.city, form.neighborhood].filter(Boolean).join("، ") },
              { label: "العنوان", value: form.address },
              { label: "الهاتف", value: form.phone },
              { label: "البريد الإلكتروني", value: form.email },
              { label: "عن المطعم", value: form.story_brief },
              { label: "الشيف", value: [form.chef_name, form.chef_title].filter(Boolean).join(" · ") },
              { label: "الصحافة والجوائز", value: form.press_outlets },
            ]}
          >
            {demo ? (
              <Handoff
                title="هذه الصفحة نموذج، ولا تولّد موقعًا."
                body="التوليد يحتاج حسابًا ويتم داخل المنشئ الحقيقي — نحو 20 إلى 40 ثانية، ثم تنتقل إلى معاينتك الحيّة."
              />
            ) : (
              <Handoff title="جاهزون متى كنت مستعدًّا." body="يستغرق نحو 20 إلى 40 ثانية. سننقلك بعدها إلى معاينتك الحيّة." />
            )}
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
      {!demo ? (
        <>
          <DevFillButton onFill={() => setForm(buildSampleForm())} />
          <ExampleFillButton onFill={() => { setForm(buildSampleForm()); setRestoredDraft(false); setError(null) }} />
        </>
      ) : null}

      <WizardShell
        chrome={demo}
        eyebrow="موقع مطعم"
        title={<>املأ ما تعرفه.<br />الذكاء الاصطناعي يكتب الباقي.</>}
        sub={`خطوات قصيرة، ولا واحدة منها طويلة. المطلوب ${required.length} فقط — وكل ما عداها اختياري.`}
        steps={steps}
        step={step}
        onStep={setStep}
        progress={{ pct }}
        scrollKey={errorKey || undefined}
        notice={
          error || restoredDraft ? (
            <>
              {restoredDraft ? (
                <Notice action={<button type="button" onClick={startFresh}>ابدأ من جديد</button>}>
                  <strong>حفظنا مسوّدتك.</strong> نُكمل من حيث توقّفت.
                </Notice>
              ) : null}
              {error ? <Notice tone="bad">{error}</Notice> : null}
            </>
          ) : undefined
        }
        final={
          demo
            ? { label: "ابدأ التوليد", slide: "إلى المنشئ", href: "/theme/new/restaurant" }
            : { label: loading ? "جارٍ توليد موقعك…" : "ولّد موقعي", slide: "هيا بنا", onClick: startGenerate, busy: loading }
        }
      />

      {!demo ? (
        <>
          <AiContentDisclaimer
            open={disclaimerOpen}
            onClose={() => setDisclaimerOpen(false)}
            onConfirm={() => { setAcked(true); setDisclaimerOpen(false); void handleGenerate() }}
          />
          <GenerationOverlay open={loading} />
        </>
      ) : null}
    </>
  )
}

/** The trash glyph at the menu row's size; the Card's own remove uses the same. */
function TrashGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  )
}
