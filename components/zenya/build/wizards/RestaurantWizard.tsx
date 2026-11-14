"use client"

/**
 * The restaurant wizard — the real builder, drawn in the /demo/build design.
 *
 * ONE COMPONENT, TWO ROUTES. /theme/new/restaurant renders it for a signed-in
 * owner and it generates a site. /demo/build renders it with `demo`: nobody is
 * signed in there, so it keeps no draft, reads the analyzer's bundled sample,
 * cannot upload, and its last step hands the reader to the real builder instead
 * of pretending to reach a generator it cannot call.
 *
 * LINKS FIRST (Anas, 2026-11-14), the order the other niches use: 1 the
 * owner's links (Google Maps, Instagram) → 2 check what we read → 3 menu →
 * 4 story and chef → 5 booking and hours → 6 photos → 7 reviews and press →
 * 8 review with the colours (his own photo colours first). The site the
 * generator draws is unchanged; every answer lands in the same input and
 * stays editable in the editor, and the colours go to content.color_overrides.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { generateErrorText } from '@/lib/generate-error'
import { ratingOf } from '@/lib/rating'
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { RESTAURANT_PRESETS } from "@/utils/restaurant/presets"
import type { RestaurantColors } from "@/utils/restaurant/types"
import { hoursFromGoogle, type BarberGoogle } from "@/utils/services/barber"
import type { RestaurantInput, RestaurantTypeId } from "@/utils/restaurant/input"
import ImageUploadField from "@/components/ImageUploadField"
import MenuImageAnalyzer, { mergeExtracted, type ExtractedCategory, type MenuApplyMode } from "@/components/restaurant/MenuImageAnalyzer"
import { sameDish } from "@/lib/menu-match"
import DevFillButton from "@/components/DevFillButton"
import ExampleFillButton from "@/components/ExampleFillButton"
import GenerationOverlay from "@/components/GenerationOverlay"
import AiContentDisclaimer from "@/components/AiContentDisclaimer"
import { useNotify } from "@/components/ui/Notify"
import WizardShell, {
  AddButton, Block, Card, Chips, Field, Grid, Handoff, Hours, Input, Notice, Presets, Review, Textarea, Toggle, Uploads,
  type WizardStep,
} from "../WizardShell"
import OwnerReviewsFields, { reviewsPayload, reviewsUrlOf, validReviewsOf, type ReviewDraft, type ReviewsForm } from "../OwnerReviewsFields"

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
  review_rating: string
  review_count: string
  reviews: ReviewDraft[]
  reviews_url: string
  style_preset: RestaurantInput["style_preset"]
  /** Links first. */
  instagram: string
  ig_photos: string[]
  /** Photos Google holds for the place, copied to our storage. */
  google_photos: string[]
  /** The owner said what we read from his links is right. */
  checked: boolean
  /** What he says we read wrong, kept so the reader can be fixed. */
  scrape_issue: string
  /** His own photo colours: '' = the preset's colours. */
  own_look: "" | "night" | "day"
  /** Instagram captions: a priced list there can be the menu. */
  ig_captions: string[]
  /** The sources the menu was already looked for in («قلب المنيو» runs once per set). */
  menu_flip: string
  /** Google's id for the place: its «Menu» tab on Maps holds every page of the menu. */
  place_id: string
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
    review_rating: "4.8",
    review_count: "+630",
    reviews: [
      { id: newId(), name: "رنا ك.", text: "الكبة النية طازجة فعلًا، والخدمة هادئة بلا استعجال. رجعنا الأسبوع اللي بعده.", detail: "كبة نية", rating: "5" },
    ],
    reviews_url: "",
    style_preset: "onyx",
    instagram: "", ig_photos: [], google_photos: [], checked: false, scrape_issue: "", own_look: "", ig_captions: [], menu_flip: "", place_id: "",
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
  review_rating: "", review_count: "", reviews: [], reviews_url: "",
  style_preset: "onyx",
  instagram: "", ig_photos: [], google_photos: [], checked: false, scrape_issue: "", own_look: "", ig_captions: [], menu_flip: "", place_id: "",
})

/** "17:30" → "5:30 م", the way the restaurant's hours are written. */
function to12(hm: string): string {
  const [h0, m] = hm.split(":").map((x) => parseInt(x, 10))
  const h = (h0 || 0) % 24
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "ص" : "م"}`
}

/** Google's weekly periods as the restaurant's seven days (Saturday first). */
function restaurantHours(periods: NonNullable<BarberGoogle["periods"]>): Hour[] | null {
  const days = hoursFromGoogle(periods)
  if (!days.length) return null
  return DEFAULT_HOURS.map((d, i) => {
    const g = days[i]
    if (!g || g.closed || !g.periods.length) return { ...d, open: "", close: "", closed: true }
    return { ...d, open: to12(g.periods[0].open), close: to12(g.periods[g.periods.length - 1].close), closed: false }
  })
}

type GoogleFound = BarberGoogle & { place_id?: string; name?: string; photos?: string[]; contact?: { phone?: string; address?: string; city?: string; area?: string } }

/** «مثال» lines per kind of place: one tap takes it, then the owner edits it. */
const EXAMPLES: Record<"restaurant" | "cafe" | "sweets", { story: string; chef: string; note: string; press: string }> = {
  restaurant: {
    story: "افتتحنا المطعم عام 2015 في وسط المدينة. نطبخ أكل البيت كما تعلّمناه من أمهاتنا، ونشتري الخضار كل صباح من السوق.",
    chef: "تعلّم الطبخ في مطعم والده، ثم عمل عشر سنوات في فنادق عمّان ودبي قبل أن يفتح مطبخه.",
    note: "للمجموعات من 8 أشخاص فأكثر، احجز قبل يوم على الأقل.",
    press: "دليل المطاعم المحلي 2024",
  },
  cafe: {
    story: "بدأنا المقهى عام 2019 بآلة قهوة واحدة وطاولتين. نحمّص البن بأنفسنا كل أسبوع، والجلسة هادئة تناسب العمل والقراءة.",
    chef: "باريستا منذ 2014، تدرّب على التحميص في إسطنبول، ويختار كل حبة بن بنفسه.",
    note: "الجلسة الخارجية لا تُحجز، وهي لمن يأتي أولًا.",
    press: "أفضل مقهى في الحي، تصويت الزبائن 2024",
  },
  sweets: {
    story: "بدأنا من مطبخ البيت عام 2012، ثم فتحنا المحل. نصنع الحلويات كل يوم بالسمن البلدي، ونقبل طلبات الأعراس والمناسبات.",
    chef: "معلّم حلويات منذ 25 سنة، تعلّم الصنعة في نابلس.",
    note: "طلبات المناسبات قبل ثلاثة أيام على الأقل.",
    press: "",
  },
}

/** «مثال: …» under a field, with one tap to take it and then edit it. */
function Example({ text, on, onUse }: { text?: string; on: boolean; onUse: (v: string) => void }) {
  if (!text || !on) return null
  return <span className="rw-ex"><span>مثال: {text}</span><button type="button" onClick={() => onUse(text)}>استعمل المثال</button></span>
}

/**
 * Reservations always run through Beynoun's own booking system. A phone-shaped
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
    // Over the defaults: a draft saved before a field existed still loads.
    if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.hours)) return { ...initialForm(), ...parsed } as Form
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

export default function RestaurantWizard({ demo = false, kind, onBack }: { demo?: boolean; kind?: string; onBack?: () => void }) {
  const router = useRouter()
  const { confirm, toast } = useNotify()
  const [authReady, setAuthReady] = useState(demo)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(() => {
    const f = initialForm()
    // The kind picked in the sheet after «ابنِ» starts the place's type.
    if (kind === 'cafe') return { ...f, restaurant_type: 'cafe', cuisine: 'قهوة ومشروبات' }
    if (kind === 'sweets') return { ...f, restaurant_type: 'dessert', cuisine: 'حلويات ومعجنات' }
    return f
  })
  const [visibleByCat, setVisibleByCat] = useState<Record<string, number>>({})
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState(0)
  const [step, setStep] = useState(0)
  // Links first: what Google and Instagram gave us.
  const [g, setG] = useState<GoogleFound | null>(null)
  const [gState, setGState] = useState<"idle" | "busy" | "ok" | "fail">("idle")
  const [gMsg, setGMsg] = useState("")
  const [igState, setIgState] = useState<"idle" | "busy" | "ok" | "fail">("idle")
  const [igMsg, setIgMsg] = useState("")
  type Pal = RestaurantColors
  const [own, setOwn] = useState<{ day: Pal; night: Pal } | null>(null)
  const lookTouched = useRef(false)

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
  function patchReviews(fn: (prev: ReviewsForm) => Partial<ReviewsForm>) {
    setForm((prev) => ({ ...prev, ...fn(prev) }))
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
   * Categories read from a menu photo. An untouched default menu is replaced.
   * When the form already holds dishes, the analyzer asks the owner first and
   * passes their answer as `mode`, so a menu is never wiped or merged unasked.
   */
  function applyExtractedMenu(extracted: ExtractedCategory[], mode?: MenuApplyMode): { categories: number; items: number } {
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
            // A dish photo the finder matched to this item (our storage only).
            image_url: typeof it.image_url === "string" ? it.image_url : "",
          }))
          .filter((it) => it.name.length >= 1),
      }))
      .filter((c) => c.name.length >= 2 && c.items.length > 0)
    if (mapped.length === 0) return { categories: 0, items: 0 }
    setForm((prev) => {
      const isDefaultEmpty = prev.categories.every(
        (c) => c.name.trim() === "" || (c.name.trim() === "القائمة" && c.items.every((i) => i.name.trim() === "" && i.price.trim() === ""))
      )
      const replace = isDefaultEmpty || mode === "replace"
      return { ...prev, categories: replace ? mapped : [...prev.categories, ...mapped] }
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

  // ── Links first: read Google and Instagram, fill the questions ─────────
  const place = kind === "cafe" ? "المقهى" : kind === "sweets" ? "المحل" : "المطعم"
  // «مطعمك / مقهاك / محلك» and «ليس مطعمًا؟», written out: Arabic does not take a suffix by rule here.
  const mine = kind === "cafe" ? "مقهاك" : kind === "sweets" ? "محلك" : "مطعمك"
  const notThis = kind === "cafe" ? "ليس مقهى؟" : kind === "sweets" ? "ليس محل حلويات؟" : "ليس مطعمًا؟"
  const ex = EXAMPLES[kind === "cafe" || kind === "sweets" ? kind : "restaurant"]

  async function fetchGoogle() {
    if (!form.map_link.trim()) return
    setGState("busy"); setGMsg("")
    try {
      const res = await fetch("/api/niche/google", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.map_link.trim(), name: form.brand_name, city: form.city, demo }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGState("fail")
        setGMsg(j?.error === "not_google_link" ? "هذا ليس رابط خرائط جوجل. انسخه من زر «مشاركة» في الخرائط."
          : j?.error === "not_found" ? `لم نجد ${place} من هذا الرابط. جرّب رابط «مشاركة» من صفحته في الخرائط.`
          : j?.error === "too_many" ? "محاولات كثيرة. انتظر قليلًا ثم أعد."
          : j?.error === "sign_in" ? "سجّل الدخول لنجلب بياناتك من جوجل."
          : "تعذّر الوصول إلى جوجل الآن. اكتب البيانات بنفسك وتابع.")
        return
      }
      const found = j as GoogleFound
      setG(found)
      setGState("ok")
      setForm((p) => {
        const photos = found.photos || []
        const hours = found.periods?.length ? restaurantHours(found.periods) : null
        const fromGoogle: ReviewDraft[] = (found.reviews || []).map((r) => ({ id: newId(), name: r.name, text: r.text, rating: String(r.rating || 5), origin: "google", when: r.when }))
        return {
          ...p,
          brand_name: p.brand_name || found.name || "",
          phone: p.phone || found.contact?.phone || "",
          address: p.address || found.contact?.address || "",
          city: p.city || found.contact?.city || "",
          neighborhood: p.neighborhood || found.contact?.area || "",
          hours: hours || p.hours,
          google_photos: photos,
          hero_image_url: p.hero_image_url || photos[0] || "",
          gallery_image_urls: p.gallery_image_urls.length ? p.gallery_image_urls : photos.slice(1, 7),
          review_rating: p.review_rating || (found.rating ? Number(found.rating).toFixed(1) : ""),
          review_count: p.review_count || (found.count ? String(found.count) : ""),
          reviews: p.reviews.some((r) => r.origin === "google") ? p.reviews : [...p.reviews, ...fromGoogle],
          reviews_url: p.reviews_url || found.maps_url || p.map_link,
          place_id: found.place_id || "",
        }
      })
    } catch {
      setGState("fail"); setGMsg("تعذّر الوصول إلى جوجل الآن. اكتب البيانات بنفسك وتابع.")
    }
  }

  async function fetchInstagram() {
    if (form.instagram.trim().length < 2 || igState === "busy") return
    setIgState("busy"); setIgMsg("")
    try {
      const res = await fetch("/api/niche/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram: form.instagram.trim(), demo }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setIgState("fail")
        setIgMsg(j?.error === "not_found" ? "لم نجد هذا الحساب. تأكد من الاسم، أو تابع بدونه."
          : j?.error === "not_instagram" ? "اكتب اسم الحساب مثل @yourname أو الصق رابطه."
          : "تعذّر قراءة الحساب الآن. تابع بدونه.")
        return
      }
      setIgState("ok")
      setForm((p) => ({
        ...p,
        ig_photos: Array.isArray(j.photos) ? j.photos : [],
        ig_captions: Array.isArray(j.captions) ? j.captions.filter((c: unknown) => typeof c === "string").slice(0, 12) : [],
      }))
    } catch { setIgState("fail"); setIgMsg("تعذّر قراءة الحساب الآن. تابع بدونه.") }
  }

  // ── «جاري قلب المنيو»: the menu, found among the links' photos ──────────
  // We find and read it, then SHOW him the photos first: is this your menu,
  // is it clear? Only what he confirms fills the menu (Anas, 2026-11-14).
  type Page = { url: string; clear: boolean; why?: string; categories: ExtractedCategory[] }
  type Flip = {
    state: "idle" | "busy" | "ask" | "pending" | "filled" | "none" | "declined" | "fail"
    pages: Page[]
    captions: ExtractedCategory[]
    dishes: { url: string; dish: string }[]
    picked: string[]
    items: number
    from?: "photos" | "captions" | "sample"
    pending: ExtractedCategory[] | null
  }
  const NO_FLIP: Flip = { state: "idle", pages: [], captions: [], dishes: [], picked: [], items: 0, pending: null }
  const [flip, setFlip] = useState<Flip>(NO_FLIP)
  const [flipPhase, setFlipPhase] = useState(0)
  const [flipCount, setFlipCount] = useState(0)
  const formRef = useRef(form)
  formRef.current = form

  const menuIsEmpty = (cats: Form["categories"]) =>
    cats.every((c) => c.name.trim() === "" || (c.name.trim() === "القائمة" && c.items.every((i) => i.name.trim() === "" && i.price.trim() === "")))
  const itemsIn = (c: ExtractedCategory[]) => c.reduce((n, x) => n + (Array.isArray(x.items) ? x.items.length : 0), 0)

  async function flipMenu(key: string, photos: string[]) {
    setFlip({ ...NO_FLIP, state: "busy" })
    setFlipPhase(0)
    setFlipCount(0)
    try {
      let j: any
      if (demo) {
        // The public page cannot buy vision calls: it reads the bundled sample menu.
        const r = await fetch("/api/analyze-menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demo: true, cuisine: formRef.current.cuisine || undefined }) })
        const a = await r.json().catch(() => ({}))
        const cats = Array.isArray(a?.categories) ? a.categories : []
        j = { pages: cats.length ? [{ url: "/demo/menu-sample.jpg", clear: true, categories: cats }] : [], captions: [], dishes: [], photos: [] }
      } else {
        // Every page in the place's Google «Menu» tab, then read them all.
        let menuTab: string[] = []
        const pid = formRef.current.place_id
        if (pid) {
          const t = await fetch("/api/menu/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ place_id: pid }) })
            .then((x) => (x.ok ? x.json() : null)).catch(() => null)
          menuTab = Array.isArray(t?.photos) ? t.photos.filter((u: unknown) => typeof u === "string") : []
          setFlipCount(menuTab.length)
        }
        const r = await fetch("/api/menu/find", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos, menu_tab: menuTab, captions: formRef.current.ig_captions, cuisine: formRef.current.cuisine || undefined }),
        })
        if (!r.ok) { setFlip({ ...NO_FLIP, state: "fail" }); return }
        j = await r.json().catch(() => null)
        if (!j) { setFlip({ ...NO_FLIP, state: "fail" }); return }
      }
      // The photos the visitor's eye turned down (a woman, a face, a tattoo, a
      // 3D render, a poster) or that are the menu itself leave the photos we
      // picked for the site on our own; the owner can still add them back.
      const bad = new Set<string>((Array.isArray(j.photos) ? j.photos : []).filter((x: any) => x && (!x.ok || x.kind === "menu")).map((x: any) => String(x.url)))
      setForm((p) => {
        let gallery = p.gallery_image_urls.filter((u) => !bad.has(u))
        let hero = p.hero_image_url
        if (hero && bad.has(hero)) hero = typeof j.hero === "string" && !bad.has(j.hero) ? j.hero : gallery[0] || ""
        gallery = gallery.filter((u) => u !== hero)
        return { ...p, menu_flip: key, gallery_image_urls: gallery, hero_image_url: hero }
      })
      const pages: Page[] = (Array.isArray(j.pages) ? j.pages : []).filter((x: any) => x && typeof x.url === "string" && Array.isArray(x.categories))
      const captions: ExtractedCategory[] = Array.isArray(j.captions) ? j.captions : []
      const dishes = Array.isArray(j.dishes) ? j.dishes.filter((d: any) => d && typeof d.url === "string" && typeof d.dish === "string") : []
      if (!pages.length && !captions.length) { setFlip({ ...NO_FLIP, state: "none" }); return }
      setFlip({
        ...NO_FLIP, state: "ask", pages, captions, dishes,
        // The clear pages start ticked; an unclear one only when he ticks it.
        picked: pages.filter((x) => x.clear).map((x) => x.url),
        from: demo ? "sample" : pages.length ? "photos" : "captions",
      })
    } catch {
      setFlip({ ...NO_FLIP, state: "fail" })
    }
  }

  /** He said yes: the menu from the pages he kept, each dish beside its own photo. */
  function fillFromFlip() {
    const chosen = flip.from === "captions" ? flip.captions : mergeExtracted(flip.pages.filter((x) => flip.picked.includes(x.url)).flatMap((x) => x.categories))
    const taken = new Set<string>()
    const dressed = chosen.map((c) => ({
      ...c,
      items: c.items.map((it) => {
        if (it.image_url) return it
        const hit = flip.dishes.find((d) => !taken.has(d.url) && sameDish(d.dish, it.name))
        if (!hit) return it
        taken.add(hit.url)
        return { ...it, image_url: hit.url }
      }),
    }))
    if (!itemsIn(dressed)) return
    if (menuIsEmpty(formRef.current.categories)) {
      const n = applyExtractedMenu(dressed)
      setFlip((f) => ({ ...f, state: "filled", items: n.items }))
    } else {
      // He already wrote his menu: ask before touching it.
      setFlip((f) => ({ ...f, state: "pending", pending: dressed, items: itemsIn(dressed) }))
    }
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
  const found = gState === "ok" || (igState === "ok" && form.ig_photos.length > 0)
  const reading = gState === "busy" || igState === "busy"
  const ok = {
    basics: form.brand_name.trim().length >= 2 && form.cuisine.trim().length >= 2 && form.city.trim().length >= 2,
    place: form.address.trim().length >= 4 && form.phone.trim().length >= 4 && EMAIL_RE.test(form.email.trim()),
    menu: counts.valid >= 1,
    story: form.story_brief.trim().length >= 10,
  }

  // Every photo we found, Google first; the owner picks which ones show.
  const foundPhotos = useMemo(() => {
    const all = [...form.google_photos, ...form.ig_photos]
    return all.filter((u, i) => all.indexOf(u) === i)
  }, [form.google_photos, form.ig_photos])

  // His own colours, measured from the photos he kept (hero first). The pixels
  // decide; no AI is called. Same endpoint as the other niches.
  const measureKey = [form.hero_image_url, ...form.gallery_image_urls].filter(Boolean).slice(0, 4).join("|")
  useEffect(() => {
    if (!measureKey) return
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch("/api/niche/colors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: measureKey.split("|") }), signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!j?.day || !j?.night) return
          const pick = (x: any): Pal => ({ primary: x.primary, accent: x.accent, background: x.background, surface: x.surface, text: x.text, muted: x.muted, border: x.border })
          setOwn({ day: pick(j.day), night: pick(j.night) })
          if (!lookTouched.current) {
            const bg = (RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]).colors.background.replace("#", "")
            const n = parseInt(bg, 16)
            const light = ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) > 384
            setForm((p) => ({ ...p, own_look: light ? "day" : "night" }))
          }
        })
        .catch(() => { /* no own colours: the presets stay */ })
    }, 600)
    return () => { clearTimeout(t); ctl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureKey])

  const ownColors = own && form.own_look ? own[form.own_look] : null
  const shownColors: Pal = ownColors || (RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]).colors
  const required = [
    form.brand_name.trim().length >= 2, form.cuisine.trim().length >= 2, form.city.trim().length >= 2,
    form.address.trim().length >= 4, form.phone.trim().length >= 4, EMAIL_RE.test(form.email.trim()),
    counts.valid >= 1, form.story_brief.trim().length >= 10,
  ]
  const pct = Math.round((required.filter(Boolean).length / required.length) * 100)

  function validate(): string | null {
    if (found && !form.checked) return "راجع ما جلبناه من روابطك وأكّد أنه صحيح."
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
      social_proof: {
        review_rating: ratingOf(form.review_rating),
        review_count: form.review_count.trim() || undefined,
        reviews: reviewsPayload(form.reviews),
        reviews_url: reviewsUrlOf(form.reviews_url),
      },
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
      if (!genRes.ok || !genJson?.content) throw new Error(generateErrorText(genJson))

      const preset = RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]
      const saveRes = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.brand_name,
          images: payload.visuals.gallery_image_urls || [],
          primaryColor: (ownColors || preset.colors).primary,
          secondaryColor: (ownColors || preset.colors).accent,
          content: {
            business_type: "restaurant", style_preset: form.style_preset, restaurant: genJson.content, input: payload,
            ...(ownColors ? { color_overrides: ownColors } : {}),
            meta: { links_first: true, instagram: form.instagram.trim() || undefined, checked: form.checked, scrape_issue: form.scrape_issue.trim() || undefined },
          },
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

  const readList: { what: string; from: string; where: string }[] = []
  if (gState === "ok" && g) {
    if (g.name) readList.push({ what: "الاسم", from: "من جوجل", where: g.name })
    if (g.contact?.phone) readList.push({ what: "الهاتف", from: "من جوجل", where: g.contact.phone })
    if (g.contact?.address) readList.push({ what: "العنوان", from: "من جوجل", where: g.contact.address })
    if (g.periods?.length) readList.push({ what: "أوقات العمل", from: "من جوجل", where: "في خطوة «الحجز والأوقات»، عدّلها هناك" })
    if (g.reviews?.length) readList.push({ what: `${g.reviews.length.toLocaleString("ar")} تقييمات بأسماء كاتبيها`, from: "من جوجل", where: "في خطوة «التقييمات والجوائز»" })
    if (form.google_photos.length) readList.push({ what: `${form.google_photos.length.toLocaleString("ar")} صور`, from: "من جوجل", where: "في خطوة «الصور»، اختر منها ما تريد" })
  }
  if (igState === "ok" && form.ig_photos.length) readList.push({ what: `${form.ig_photos.length.toLocaleString("ar")} صور`, from: "من إنستغرام", where: "في خطوة «الصور»، اختر منها ما تريد" })

  const inGallery = (u: string) => form.gallery_image_urls.includes(u)
  function togglePhoto(u: string) {
    setForm((p) => {
      if (p.gallery_image_urls.includes(u)) return { ...p, gallery_image_urls: p.gallery_image_urls.filter((x) => x !== u), hero_image_url: p.hero_image_url === u ? "" : p.hero_image_url }
      if (p.hero_image_url === u) return { ...p, hero_image_url: "" }
      return { ...p, gallery_image_urls: [...p.gallery_image_urls, u].slice(0, 8) }
    })
  }
  function makeHero(u: string) {
    setForm((p) => ({ ...p, hero_image_url: u, gallery_image_urls: p.gallery_image_urls.filter((x) => x !== u) }))
  }

  const steps: WizardStep[] = [
    {
      id: "links",
      title: "روابطك أولًا",
      sub: `ألصق رابط ${place} على خرائط جوجل وحساب إنستغرام. نقرؤها ونملأ الأسئلة عنك: الاسم والهاتف والعنوان والأوقات والتقييمات والصور. ليس عندك روابط؟ اضغط «تخطَّ».`,
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Block title="خرائط جوجل" optional hint={`افتح ${place} في خرائط جوجل، اضغط «مشاركة»، وانسخ الرابط. منه نأخذ أكثر شيء.`}>
            <Input dir="ltr" aria-label={`رابط ${place} على خرائط جوجل`} value={form.map_link} onChange={(e) => { update("map_link", e.target.value); setGState("idle"); update("checked", false) }} placeholder="https://maps.app.goo.gl/…" />
          </Block>
          <Block title="إنستغرام" optional hint="نقرأ صور الحساب ونعرضها عليك في خطوة الصور لتختار منها.">
            <Input dir="ltr" aria-label="حساب إنستغرام" value={form.instagram} onChange={(e) => { update("instagram", e.target.value); setIgState("idle"); update("checked", false) }} placeholder="@yourname" />
          </Block>
          <Block title="القائمة" optional>
            <p className="zb-note">نبحث عن قائمتك بين صورك على جوجل وإنستغرام، ونقرؤها ونملأ الأصناف والأسعار. ليست هناك؟ ارفع صورتها في خطوة «القائمة».</p>
          </Block>
          {form.map_link.trim().length > 8 || form.instagram.trim().length >= 2 ? <Notice>اضغط «التالي». نقرأ روابطك ونعرض عليك ما وجدناه لتراجعه.</Notice> : null}
        </Grid>
      ),
    },
    {
      id: "check",
      title: found ? "راجع ما وجدناه" : `بيانات ${place}`,
      sub: found ? "هذا ما قرأناه من روابطك، وبه ملأنا الأسئلة. راجعه، وصحّح ما يلزم، ثم أكّد." : reading ? "نقرأ روابطك الآن…" : `اكتب بيانات ${place}. نضعها في الموقع كما هي.`,
      complete: ok.basics && ok.place && (!found || form.checked),
      note: found && !form.checked ? "أكّد أن ما جلبناه صحيح." : "الاسم والمطبخ والمدينة والعنوان والهاتف والبريد مطلوبة.",
      body: (
        <Grid>
          {reading ? <Notice>{gState === "busy" ? "نقرأ خرائط جوجل… " : ""}{igState === "busy" ? "نقرأ إنستغرام… " : ""}يأخذ هذا ثواني.</Notice> : null}
          {gMsg && gState === "fail" ? <Notice tone="bad" action={form.map_link.trim() ? <button type="button" onClick={fetchGoogle}>أعد المحاولة</button> : undefined}>{gMsg}</Notice> : null}
          {igMsg && igState === "fail" ? <Notice tone="bad">{igMsg}</Notice> : null}
          {found ? (
            <Block title="ما وجدناه">
              {gState === "ok" && g ? (
                <div className="rw-found">
                  {g.photos?.[0] ? <img src={g.photos[0]} alt="" /> : <span className="rw-found-ph" aria-hidden>{(form.brand_name || g.name || place).slice(0, 1)}</span>}
                  <div>
                    <b>{g.name || form.brand_name}</b>
                    {g.rating ? <span className="rw-stars">★ {Number(g.rating).toFixed(1)} <small>· {Number(g.count || 0).toLocaleString("ar")} تقييم</small></span> : null}
                    {g.contact?.address ? <small>{g.contact.address}</small> : null}
                  </div>
                </div>
              ) : null}
              <ul className="rw-src">
                {readList.map((x) => <li key={x.what + x.from}><b>{x.what} <small className="rw-from">{x.from}</small></b><span>{x.where}</span></li>)}
              </ul>
              {foundPhotos.length ? (
                <div className="rw-strip" aria-label="صور وجدناها">
                  {foundPhotos.slice(0, 10).map((u) => <img key={u} src={u} alt="" loading="lazy" />)}
                </div>
              ) : null}
            </Block>
          ) : null}
          <Block title={`بيانات ${place}`} hint={gState === "ok" ? "جلبناها من جوجل. عدّل ما يلزم." : undefined}>
            <Grid>
              <Field label={`اسم ${place}`} required>
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
              <Field label="العنوان الكامل" required wide>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="شارع غورو، الجميزة، بيروت" />
              </Field>
              <Field label="الهاتف" required>
                <Input dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+961 1 555 0140" />
              </Field>
              <Field label="البريد الإلكتروني" required hint="تصلك عليه رسائل الحجز.">
                <Input type="email" dir="ltr" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="reservations@restaurant.com" />
              </Field>
            </Grid>
          </Block>
          <Block title="ما نوع المكان؟" optional hint="تساعدنا على كتابة نصوص تناسب أجواء مكانك.">
            <Chips options={RESTAURANT_TYPES} value={form.restaurant_type} onChange={(id) => update("restaurant_type", id as RestaurantTypeId | "")} />
          </Block>
          {found ? (
            <Block title="هل ما جلبناه صحيح؟">
              <Toggle on={form.checked} onChange={(v) => update("checked", v)}>راجعت ما جلبناه، وهو صحيح</Toggle>
              <div style={{ marginTop: 12 }}>
                <Field label="في شيء خطأ فيما قرأناه؟" wide hint="اكتبه لنا. نصلحه في موقعك، ونحسّن طريقة القراءة.">
                  <Textarea rows={3} value={form.scrape_issue} onChange={(e) => update("scrape_issue", e.target.value)} placeholder="مثال: الصور ليست لمطعمي، أو الأوقات قديمة." />
                </Field>
              </div>
            </Block>
          ) : null}
        </Grid>
      ),
    },
    {
      id: "menu",
      title: "القائمة",
      sub: found
        ? "نبحث عن قائمتك بين صور روابطك ونقرؤها لك. أو صوّرها أو اكتبها بنفسك. حتى صنف واحد يكفي، وكل صنف يبقى قابلًا للتعديل."
        : "صوّر قائمتك الورقية فنقرؤها ونملأ الأصناف، أو اكتبها بنفسك. حتى صنف واحد يكفي، وكل صنف يبقى قابلًا للتعديل.",
      complete: ok.menu,
      note: "أضف صنفًا واحدًا على الأقل باسم وسعر.",
      body: (
        <Grid>
          {flip.state === "busy" || (reading && !form.menu_flip) ? (
            <div className="rw-flip" role="status" aria-live="polite">
              <span className="rw-flip-book" aria-hidden><i /><i /><i /></span>
              <div>
                <b>جاري قلب المنيو…</b>
                <small>{reading ? "نقرأ روابطك أولًا…" : flipCount ? `وجدنا صفحات القائمة في جوجل (العدد: ${flipCount.toLocaleString("ar")}). نقرؤها كلها، وقد يأخذ هذا دقيقة…` : FLIP_PHASES[flipPhase]}</small>
              </div>
            </div>
          ) : flip.state === "ask" ? (
            <div className="rw-ask" role="group" aria-label="تأكيد القائمة">
              <b className="rw-ask-h">{flip.from === "captions" ? `وجدنا أسعارًا في منشوراتك على إنستغرام. هل هي قائمة ${mine}؟` : `هل هذه قائمة ${mine}؟ وهل هي واضحة؟`}</b>
              <p className="rw-ask-p">
                {flip.from === "sample"
                  ? "على هذه الصفحة العامة نعرض قائمة نموذجية. في المنشئ الحقيقي نعرض عليك صور قائمتك أنت التي وجدناها في روابطك."
                  : flip.from === "captions"
                    ? `قرأنا منها أصنافًا بأسعارها (العدد: ${itemsIn(flip.captions).toLocaleString("ar")}). إن كانت قائمتك فاملأ منها، وإلا فارفع صورة قائمتك تحت.`
                    : flip.pages.some((x) => x.clear)
                      ? "وجدناها بين صورك. أبقِ الصور التي هي قائمتك فعلًا، ثم املأ منها. صورة غير واضحة؟ بدّلها بصورة أوضح ترفعها تحت."
                      : "وجدناها بين صورك، لكنها غير واضحة كلها، فقد نخطئ في اسم أو سعر. الأفضل أن تبدلها بصورة أوضح ترفعها تحت."}
              </p>
              {flip.from !== "captions" && flip.pages.length > 1 ? (
                <div className="rw-ask-bar">
                  <span>اخترت {flip.picked.length.toLocaleString("ar")} من {flip.pages.length.toLocaleString("ar")}</span>
                  <button type="button" onClick={() => setFlip((f) => ({ ...f, picked: f.picked.length === f.pages.length ? [] : f.pages.map((x) => x.url) }))}>
                    {flip.picked.length === flip.pages.length ? "ألغِ اختيار الكل" : "اختر الكل"}
                  </button>
                </div>
              ) : null}
              {flip.from !== "captions" ? (
                <div className="rw-ask-g">
                  {flip.pages.map((x, i) => {
                    const on = flip.picked.includes(x.url)
                    return (
                      <div key={x.url} className="rw-ask-i">
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`صورة القائمة ${i + 1}${x.clear ? "، واضحة" : "، غير واضحة"}`}
                          onClick={() => setFlip((f) => ({ ...f, picked: on ? f.picked.filter((u) => u !== x.url) : [...f.picked, x.url] }))}
                        >
                          <img src={x.url} alt="" />
                          <span className="rw-ask-tick" aria-hidden>{on ? "✓" : ""}</span>
                        </button>
                        <span className="rw-ask-st" data-clear={x.clear ? "true" : undefined}>
                          {x.clear ? `واضحة · الأصناف: ${itemsIn(x.categories).toLocaleString("ar")}` : `غير واضحة: ${x.why || "بعض النص غير مقروء"}`}
                        </span>
                        <a href={x.url} target="_blank" rel="noreferrer" className="rw-ask-zoom">كبّر الصورة</a>
                      </div>
                    )
                  })}
                </div>
              ) : null}
              <div className="rw-ask-acts">
                <button type="button" className="rw-ask-yes" disabled={flip.from !== "captions" && !flip.picked.length} onClick={fillFromFlip}>
                  نعم، املأ القائمة منها{flip.from !== "captions" && flip.picked.length ? ` (الأصناف: ${itemsIn(mergeExtracted(flip.pages.filter((x) => flip.picked.includes(x.url)).flatMap((x) => x.categories))).toLocaleString("ar")})` : ""}
                </button>
                <button type="button" className="rw-ask-no" onClick={() => setFlip((f) => ({ ...f, state: "declined" }))}>لا، سأرفع صورًا أوضح</button>
              </div>
              {flip.from !== "captions" && flip.pages.some((x) => !x.clear && flip.picked.includes(x.url)) ? (
                <small className="rw-ask-warn">اخترت صورة غير واضحة: راجع الأسماء والأسعار جيدًا بعد التعبئة.</small>
              ) : null}
            </div>
          ) : flip.state === "pending" && flip.pending ? (
            <Notice action={
              <span className="rw-flip-acts">
                <button type="button" onClick={() => { const n = applyExtractedMenu(flip.pending!, "append"); setFlip((f) => ({ ...f, state: "filled", pending: null, items: n.items })) }}>أضفها إلى قائمتك</button>
                <button type="button" onClick={() => { const n = applyExtractedMenu(flip.pending!, "replace"); setFlip((f) => ({ ...f, state: "filled", pending: null, items: n.items })) }}>استبدل قائمتك بها</button>
              </span>
            }>
              <strong>قرأنا قائمتك (الأصناف: {flip.items.toLocaleString("ar")}).</strong> عندك أصناف كتبتها، فلم نغيّرها. ماذا نفعل بما قرأناه؟
            </Notice>
          ) : flip.state === "filled" ? (
            <Notice action={<button type="button" onClick={() => setFlip((f) => ({ ...f, state: "ask" }))}>اختر صورًا أخرى</button>}>
              <strong>قلبنا المنيو.</strong> ملأنا الأصناف تحت (العدد: {flip.items.toLocaleString("ar")}). راجعها وعدّل ما يلزم.
            </Notice>
          ) : flip.state === "declined" ? (
            <Notice action={flip.pages.length || flip.captions.length ? <button type="button" onClick={() => setFlip((f) => ({ ...f, state: "ask" }))}>اعرض ما وجدناه مرة أخرى</button> : undefined}>
              ارفع صور قائمتك الأوضح هنا تحت فنقرؤها، أو اكتب الأصناف بنفسك.
            </Notice>
          ) : flip.state === "none" ? (
            <Notice>لم نجد قائمتك بين صور روابطك. صوّرها وارفعها هنا فنقرؤها، أو اكتب الأصناف بنفسك.</Notice>
          ) : flip.state === "fail" ? (
            <Notice tone="bad" action={<button type="button" onClick={() => void flipMenu(flipKey(), foundPhotos.slice(0, 22))}>أعد المحاولة</button>}>
              تعذّر قلب المنيو الآن. أعد المحاولة، أو ارفع صورة قائمتك، أو اكتب الأصناف.
            </Notice>
          ) : null}
          <Block>
            <div className="zb-analyzer">
              <MenuImageAnalyzer
                cuisine={form.cuisine}
                demo={demo}
                existingItems={form.categories.reduce((n, c) => n + c.items.filter((i) => i.name.trim()).length, 0)}
                onExtract={applyExtractedMenu}
              />
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
                            <Input value={item.description} onChange={(e) => updateItem(cat.id, item.id, { description: e.target.value })} placeholder="وصف موجز (اختياري — ستصقله بينون)" aria-label={"وصف الصنف " + (ii + 1)} />
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
      title: "قصتك والشيف",
      sub: "جملتان أو ثلاث تكفي. نحوّلها إلى نص للموقع، وتبقى قابلة للتعديل.",
      complete: ok.story,
      note: `أخبرنا جملةً أو جملتين عن قصة ${place}.`,
      body: (
        <Grid>
          <Field label={`عن ${place}`} required wide>
            <Textarea rows={4} value={form.story_brief} onChange={(e) => update("story_brief", e.target.value)} placeholder="متى افتتحت، وما الذي يميّز أكلك، ومن أين تشتري، وما أجواء المكان؟" />
            <Example text={ex.story} on={!form.story_brief.trim()} onUse={(v) => update("story_brief", v)} />
          </Field>
          <Field label="اسم الشيف">
            <Input value={form.chef_name} onChange={(e) => update("chef_name", e.target.value)} placeholder="الشيف سامي خوري" />
          </Field>
          <Field label="لقب الشيف">
            <Input value={form.chef_title} onChange={(e) => update("chef_title", e.target.value)} placeholder="الشيف · المالك" />
          </Field>
          <Field label="نبذة عن الشيف" wide>
            <Textarea value={form.chef_bio_brief} onChange={(e) => update("chef_bio_brief", e.target.value)} placeholder="أين تعلّم، وما الذي أتى به إلى هنا." />
            <Example text={ex.chef} on={!form.chef_bio_brief.trim()} onUse={(v) => update("chef_bio_brief", v)} />
          </Field>
        </Grid>
      ),
    },
    {
      id: "booking",
      title: "الحجز والأوقات",
      sub: `متى تفتح، وكيف يحجز الضيف. تصل الحجوزات إلى لوحة تحكّمك في بينون.${gState === "ok" && g?.periods?.length ? " جلبنا أوقاتك من جوجل؛ عدّلها كما تشاء." : ""}`,
      optional: true,
      complete: true,
      body: (
        <Grid>
          <Block title="ساعات العمل">
            <Hours hours={form.hours} onChange={(i, patch) => updateHour(i, patch as Partial<Hour>)} openPh="5:30 م" closePh="10:00 م" />
          </Block>
          <Field label="رقم هاتف للحجز (اختياري)" wide hint="يظهر كزر «اتصل للحجز» للزوّار على الباقة المجانية.">
            <Input dir="ltr" value={form.booking} onChange={(e) => update("booking", e.target.value)} placeholder="+961 1 555 0140" />
          </Field>
          <Field label="ملاحظة الحجز (اختياري)" wide>
            <Textarea value={form.reservation_note} onChange={(e) => update("reservation_note", e.target.value)} placeholder="شرط أو تنبيه للضيف قبل الحجز" />
            <Example text={ex.note} on={!form.reservation_note.trim()} onUse={(v) => update("reservation_note", v)} />
          </Field>
        </Grid>
      ),
    },
    {
      id: "visuals",
      title: "الصور",
      sub: foundPhotos.length ? "هذه صورك من جوجل وإنستغرام. اضغط الصورة لتضعها في موقعك أو تبعدها، واختر صورة الواجهة، وأضف صورًا من عندك." : "ارفع صورك. بدون صور نضع صورًا خالية من الحقوق تناسب مكانك، وتستبدلها متى شئت.",
      optional: true,
      complete: true,
      body: (
        <Grid>
          {foundPhotos.length ? (
            <Block title="صور وجدناها" hint="المحدّدة تظهر في موقعك. «الواجهة» هي الصورة الكبيرة أعلى الصفحة.">
              <div className="rw-pick">
                {foundPhotos.map((u) => {
                  const hero = form.hero_image_url === u
                  const on = hero || inGallery(u)
                  return (
                    <div key={u} className="rw-pick-i">
                      <button type="button" aria-pressed={on} aria-label={on ? "أبعدها عن الموقع" : "ضعها في الموقع"} onClick={() => togglePhoto(u)} data-on={on ? "true" : undefined}>
                        <img src={u} alt="" loading="lazy" />
                        {hero ? <span>الواجهة</span> : on ? <span>في موقعك</span> : null}
                      </button>
                      {!hero ? <button type="button" className="rw-hero-btn" onClick={() => makeHero(u)}>اجعلها الواجهة</button> : <span className="rw-hero-btn" aria-hidden>✓ الواجهة</span>}
                    </div>
                  )
                })}
              </div>
            </Block>
          ) : null}
          {demo ? (
            <Block hint="رفع الصور يحتاج حسابًا، ويتم داخل المنشئ الحقيقي: الصورة الرئيسية، وصورة الشيف، ومعرض حتى 8 صور، وصور الأطباق المميّزة حتى 4.">
              <p className="zb-note">لا صور؟ اترك أي خانة فارغة ونملؤها بصور خالية من الحقوق تناسب نوع مطعمك.</p>
            </Block>
          ) : (
            <>
              <Block title="صور من عندك" optional>
                <p className="zb-note">
                  اترك أي خانة فارغة ونملؤها بصور خالية من الحقوق تناسب {typeLabel || "نوع مكانك"}. تستطيع استبدالها لاحقًا من المحرر.
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
                    <ImageUploadField key={"g-" + i + ":" + (form.gallery_image_urls[i] || "")} value={form.gallery_image_urls[i] || ""} onChange={(url) => setListAt("gallery_image_urls", i, url)} aspect="square" />
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
            </>
          )}
        </Grid>
      ),
    },
    {
      id: "social",
      title: "التقييمات والجوائز",
      sub: g?.reviews?.length ? "جلبنا تقييماتك من جوجل. احذف ما لا تريده، وأضف ما تشاء. لا نكتب تقييمات من عندنا." : "تقييمات حقيقية من ضيوفك فقط. لا نكتب تقييمات من عندنا.",
      optional: true,
      complete: true,
      body: (
        <Grid>
          <OwnerReviewsFields form={form} patch={patchReviews} name={form.brand_name} city={form.city} detail={{ label: "الطبق (اختياري)", placeholder: "كبة نية" }} />
          <Field label="الصحافة والجوائز" wide hint="اختياري. واحدة في كل سطر.">
            <Textarea rows={3} value={form.press_outlets} onChange={(e) => update("press_outlets", e.target.value)} placeholder={"النهار\nدليل ميشلان"} />
            <Example text={ex.press} on={!form.press_outlets.trim()} onUse={(v) => update("press_outlets", v)} />
          </Field>
        </Grid>
      ),
    },
    {
      id: "review",
      title: "المراجعة والألوان",
      sub: "اختر الألوان، وراجع ما سنبني عليه.",
      complete: required.every(Boolean) && (!found || form.checked),
      note: "ينقص شيء مطلوب في خطوة سابقة.",
      body: (
        <Grid>
          <Block title="الألوان" hint="تستطيع تغييرها لاحقًا من المحرر.">
            {own ? (
              <div className="rw-lrow" role="radiogroup" aria-label={`ألوان ${place}`}>
                {(["night", "day"] as const).map((id) => {
                  const c = own[id]
                  const on = form.own_look === id
                  return (
                    <button key={id} type="button" role="radio" aria-checked={on} className="rw-lr" onClick={() => { lookTouched.current = true; update("own_look", id) }}>
                      <span className="rw-lr-dots" aria-hidden>{[c.background, c.text, c.accent].map((x, i) => <i key={i} style={{ background: x }} />)}</span>
                      <b>ألوان {mine} · {id === "night" ? "ليلي" : "نهاري"}</b>
                      <span className="rw-lr-tick" aria-hidden>{on ? "✓" : ""}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
            {own ? <p className="zb-note" style={{ margin: "8px 0 14px" }}>أوّل لونين أخذناهما من صورك. أو اختر شكلًا جاهزًا:</p> : null}
            <Presets presets={RESTAURANT_PRESETS} value={form.own_look ? "" : form.style_preset} onChange={(id) => { lookTouched.current = true; setForm((p) => ({ ...p, style_preset: id as Form["style_preset"], own_look: "" })) }} />
          </Block>
          <Block title="معاينة الألوان" hint="هكذا تبدو الألوان في موقعك. الموقع كاملًا يفتح بعد البناء.">
            <div className="rw-live" style={{ background: shownColors.background, color: shownColors.text, borderColor: shownColors.border }}>
              <span className="rw-live-eye" style={{ color: shownColors.accent }}>{form.cuisine || "مأكولات شامية"} · {form.city || "بيروت"}</span>
              <b className="rw-live-h" style={{ fontFamily: (RESTAURANT_PRESETS.find((p) => p.id === form.style_preset) || RESTAURANT_PRESETS[0]).heading_font }}>{form.brand_name || "اسم مطعمك"}</b>
              <div className="rw-live-card" style={{ background: shownColors.surface, borderColor: shownColors.border }}>
                <span>{form.categories[0]?.items[0]?.name || "طبق اليوم"}</span>
                <span style={{ color: shownColors.accent }}>{form.categories[0]?.items[0]?.price || "$24"}</span>
              </div>
              <span className="rw-live-btn" style={{ background: shownColors.accent, color: shownColors.background }}>احجز طاولة</span>
            </div>
          </Block>
          <Review
            facts={[
              { label: "الحقول المطلوبة", value: `${required.filter(Boolean).length} من ${required.length}` },
              { label: "الألوان", value: form.own_look ? `ألوان ${mine} · ${form.own_look === "night" ? "ليلي" : "نهاري"}` : RESTAURANT_PRESETS.find((p) => p.id === form.style_preset)?.name ?? "—" },
              { label: "نوع المكان", value: typeLabel ?? "—" },
              { label: "أصناف القائمة", value: counts.dropped ? `${counts.valid} (+${counts.dropped} ناقصة)` : counts.valid },
              { label: "أيام مفتوحة", value: `${form.hours.filter((h) => !h.closed).length} من 7` },
              { label: "الصور", value: photoCount },
              { label: "التقييمات", value: validReviewsOf(form.reviews).length },
            ]}
            recap={[
              { label: `اسم ${place}`, value: form.brand_name },
              { label: "المطبخ", value: form.cuisine },
              { label: "المدينة", value: [form.city, form.neighborhood].filter(Boolean).join("، ") },
              { label: "العنوان", value: form.address },
              { label: "الهاتف", value: form.phone },
              { label: "البريد الإلكتروني", value: form.email },
              { label: `عن ${place}`, value: form.story_brief },
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
              <Handoff title="جاهزون متى كنت مستعدًّا." body="يستغرق نحو 20 إلى 40 ثانية. سننقلك بعدها إلى معاينتك الحيّة، وكل شيء يبقى قابلًا للتعديل من المحرر." />
            )}
          </Review>
        </Grid>
      ),
    },
  ]

  // The first time he lands on «القائمة», flip through what the links gave us.
  // Once per set of sources: new links, a new flip; the same ones, never twice.
  function flipKey() {
    return demo ? "demo" : ["p" + form.place_id, ...foundPhotos.slice(0, 22), "c" + form.ig_captions.length].join("|")
  }
  useEffect(() => {
    if (step !== 2 || flip.state === "busy" || reading) return
    const photos = foundPhotos.slice(0, 22)
    if (demo ? !found : !photos.length && !form.ig_captions.length && !form.place_id) return
    const key = flipKey()
    if (form.menu_flip === key) return
    void flipMenu(key, photos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reading, foundPhotos, form.ig_captions.length, form.menu_flip])
  useEffect(() => {
    if (flip.state !== "busy") return
    const t = setInterval(() => setFlipPhase((n) => Math.min(n + 1, FLIP_PHASES.length - 1)), 3200)
    return () => clearInterval(t)
  }, [flip.state])

  // Entering «راجع ما وجدناه» reads the links pasted on the first step.
  useEffect(() => {
    if (step !== 1) return
    if (gState === "idle" && form.map_link.trim().length > 8) void fetchGoogle()
    if (igState === "idle" && form.instagram.trim().length >= 2) void fetchInstagram()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

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

      {/* No `chrome` on the demo any more: /demo/build stands in the «ليل»
          product frame like the real builder, which draws the header. */}
      <WizardShell
        onExit={onBack}
        eyebrow={`قالب المطعم${typeLabel ? " · " + typeLabel : ""}`}
        title={<>ابدأ بروابطك.<br />بينون تكتب الباقي.</>}
        sub={<>نقرأ روابطك ونملأ الأسئلة عنك، وأنت تراجع وتؤكد. {onBack ? <button type="button" onClick={onBack} style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>{notThis}</button> : null}</>}
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
            items={[
              ...(form.chef_name.trim() && !form.chef_bio_brief.trim() ? ["people" as const] : []),
              ...(form.categories.some((c) => c.items.some((i) => i.name.trim() && !i.description.trim())) ? ["text" as const] : []),
            ]}
          />
          <GenerationOverlay open={loading} />
        </>
      ) : null}
      <style dangerouslySetInnerHTML={{ __html: RW_CSS }} />
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

const FLIP_PHASES = ["نبحث عن قائمتك بين صورك…", "نقرأ الأصناف والأسعار…", "نتأكد أن كل اسم وسعر مقروء…", "نرتّب الأقسام…"]

const RW_CSS = `.rw-flip{display:flex;gap:16px;align-items:center;padding:16px 18px;border-radius:16px;border:1px solid var(--line,rgba(127,127,127,.22));background:rgba(127,127,127,.06)}.rw-flip b{display:block;font-size:16.5px}.rw-flip small{display:block;font-size:14.5px;opacity:.78;margin-top:2px}.rw-flip-book{position:relative;width:40px;height:46px;flex:0 0 auto;perspective:160px}.rw-flip-book i{position:absolute;inset:0;border-radius:4px 8px 8px 4px;border:1.5px solid var(--acc,#E2532A);background:var(--card,#fff);transform-origin:100% 50%;animation:rw-page 2.4s cubic-bezier(.45,.05,.3,1) infinite}.rw-flip-book i:nth-child(2){animation-delay:.8s}.rw-flip-book i:nth-child(3){animation-delay:1.6s}.rw-flip-book i::before,.rw-flip-book i::after{content:"";position:absolute;inset-inline:7px;height:2px;border-radius:2px;background:var(--acc,#E2532A);opacity:.45;top:12px}.rw-flip-book i::after{top:22px;inset-inline-end:14px}@keyframes rw-page{0%,20%{transform:rotateY(0)}60%,100%{transform:rotateY(-170deg);opacity:0}}@media(prefers-reduced-motion:reduce){.rw-flip-book i{animation:none}.rw-flip-book i:nth-child(n+2){display:none}}.rw-flip-acts{display:flex;flex-wrap:wrap;gap:8px}.rw-ask{display:grid;gap:12px;padding:18px;border-radius:16px;border:1px solid var(--acc,#E2532A);background:rgba(127,127,127,.06)}.rw-ask-h{font-size:17px;line-height:1.5}.rw-ask-p{margin:0;font-size:14.5px;line-height:1.75;opacity:.85}.rw-ask-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14.5px}.rw-ask-bar button{all:unset;cursor:pointer;min-height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--line,rgba(127,127,127,.35));font-weight:700;font-size:14px;display:inline-flex;align-items:center}.rw-ask-bar button:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:2px}.rw-ask-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;max-height:min(70vh,640px);overflow-y:auto;padding:4px}@media(min-width:900px){.rw-ask-g{grid-template-columns:repeat(auto-fill,minmax(170px,220px))}}.rw-ask-i{display:grid;gap:6px;align-content:start}.rw-ask-i>button{all:unset;box-sizing:border-box;cursor:pointer;position:relative;aspect-ratio:3/4;border-radius:12px;overflow:hidden;opacity:.5;outline:1px solid var(--line,rgba(127,127,127,.25));transition:opacity .2s}.rw-ask-i>button[aria-pressed=true]{opacity:1;outline:3px solid var(--acc,#E2532A);outline-offset:2px}.rw-ask-i>button:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:3px}.rw-ask-i img{width:100%;height:100%;object-fit:cover;display:block}.rw-ask-tick{position:absolute;top:8px;inset-inline-start:8px;width:28px;height:28px;border-radius:99px;display:grid;place-items:center;font-weight:700;background:var(--acc,#E2532A);color:#fff;font-size:15px}.rw-ask-i>button[aria-pressed=false] .rw-ask-tick{background:rgba(0,0,0,.45);box-shadow:inset 0 0 0 2px #fff}.rw-ask-st{font-size:13.5px;line-height:1.5;color:#c2410c}.rw-ask-st[data-clear]{color:inherit;opacity:.8}.rw-ask-zoom{font-size:13.5px;text-decoration:underline;text-underline-offset:3px;opacity:.8;min-height:32px;display:inline-flex;align-items:center}.rw-ask-acts{display:flex;flex-wrap:wrap;gap:10px}.rw-ask-acts button{all:unset;box-sizing:border-box;cursor:pointer;min-height:44px;padding:0 18px;border-radius:999px;font-weight:700;font-size:15px;display:inline-flex;align-items:center}.rw-ask-acts .rw-ask-yes{background:var(--acc,#E2532A);color:#fff}.rw-ask-acts .rw-ask-yes:disabled{opacity:.45;cursor:not-allowed}.rw-ask-acts .rw-ask-no{border:1px solid var(--line,rgba(127,127,127,.35))}.rw-ask-acts button:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:3px}.rw-ask-warn{font-size:13.5px;color:#c2410c}.rw-found{display:flex;gap:12px;align-items:center;margin-bottom:12px;padding:10px;border-radius:14px;border:1px solid var(--line,rgba(127,127,127,.2));background:rgba(127,127,127,.06)}.rw-found img,.rw-found-ph{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:0 0 auto;display:grid;place-items:center;font-size:26px;background:rgba(127,127,127,.15)}.rw-found div{display:grid;gap:2px;min-width:0}.rw-found b{font-size:16.5px}.rw-found small{opacity:.75;font-size:14.5px}.rw-stars{color:#E8B04B;font-size:15px}.rw-src{list-style:none;margin:0;padding:0;display:grid;gap:8px}.rw-src li{display:grid;gap:2px;padding:10px 14px;border-radius:12px;border:1px solid var(--line,rgba(127,127,127,.22))}.rw-src b{font-size:14.5px}.rw-src span{font-size:14px;opacity:.8}.rw-from{font-weight:500;opacity:.7;font-size:12.5px;margin-inline-start:6px}.rw-strip{display:flex;gap:8px;overflow-x:auto;margin-top:12px;padding-bottom:4px}.rw-strip img{width:84px;height:84px;object-fit:cover;border-radius:10px;flex:0 0 auto}.rw-ex{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;font-size:13.5px;opacity:.85;line-height:1.6}.rw-ex button{all:unset;cursor:pointer;font-weight:700;color:var(--acc,#E2532A);text-decoration:underline;text-underline-offset:3px}.rw-ex button:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:2px}.rw-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}.rw-pick-i{display:grid;gap:6px}.rw-pick-i>button:first-child{all:unset;cursor:pointer;position:relative;aspect-ratio:4/3;border-radius:10px;overflow:hidden;opacity:.55;transition:opacity .2s}.rw-pick-i>button[data-on=true]{opacity:1;outline:3px solid var(--acc,#E2532A);outline-offset:2px}.rw-pick-i>button:first-child:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:3px}.rw-pick-i img{width:100%;height:100%;object-fit:cover;display:block}.rw-pick-i>button span{position:absolute;inset-inline-start:6px;top:6px;background:var(--acc,#E2532A);color:#fff;font-size:12px;padding:2px 8px;border-radius:99px}.rw-hero-btn{all:unset;cursor:pointer;font-size:13px;text-align:center;min-height:32px;display:grid;place-items:center;border-radius:99px;border:1px solid var(--line,rgba(127,127,127,.25))}span.rw-hero-btn{cursor:default;color:var(--acc,#E2532A);font-weight:700}.rw-lrow{display:grid;gap:8px}.rw-lr{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;min-height:56px;padding:10px 16px;border-radius:14px;border:1px solid var(--line,rgba(127,127,127,.22));background:var(--card2,rgba(127,127,127,.05))}.rw-lr[aria-checked=true]{border-color:var(--acc,#E2532A);box-shadow:0 0 0 1px var(--acc,#E2532A)}.rw-lr:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:3px}.rw-lr-tick{color:var(--acc,#E2532A);font-weight:700}.rw-lr-dots{display:flex}.rw-lr-dots i{width:26px;height:26px;border-radius:99px;border:2px solid var(--card,#fff);margin-inline-start:-8px;box-shadow:0 0 0 1px rgba(127,127,127,.25)}.rw-lr-dots i:first-child{margin-inline-start:0}.rw-live{display:grid;gap:12px;padding:22px;border-radius:18px;border:1px solid;transition:background .3s,color .3s}.rw-live-eye{font-size:13.5px;font-weight:600}.rw-live-h{font-size:28px;line-height:1.2}.rw-live-card{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:12px;border:1px solid;font-size:15px}.rw-live-btn{justify-self:start;padding:10px 18px;border-radius:999px;font-weight:700;font-size:14.5px}`
