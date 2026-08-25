"use client"

import MenuImageAnalyzer, { type ExtractedCategory } from "@/components/restaurant/MenuImageAnalyzer"
import { RESTAURANT_PRESETS } from "@/utils/restaurant/presets"
import { SERVICE_PRESETS } from "@/utils/services/presets"

/* ─────────────────────────────────────────────────────────────────────────
   What section two drives.

   One entry per template the section knows how to fill in. Each carries the
   wizard's own cards, in the wizard's own order and with its own titles, the
   sample business that gets typed into them, and the script that does the
   typing. BuildSection owns the frame, the cursor and the clock; everything
   template-shaped lives here.

   The rule for adding one: read its wizard and follow it. The cards are its
   cards, the order is its order, the labels are its labels. A demo that
   invents a form the product does not have is worth nothing.
   ───────────────────────────────────────────────────────────────────────── */

export type Form = Record<string, any>

/** What a template's script can do. BuildSection supplies it. */
export type Ctx = {
  /** Move the cursor to [data-t="key"]. ax/ay are 0..1 across the target. */
  move: (key: string, ax?: number, ay?: number) => Promise<void>
  moveEl: (el: Element | null, ax?: number, ay?: number) => Promise<void>
  /** Press and release. */
  click: () => Promise<void>
  /** Move, click, then type one character per beat into that field. */
  type: (key: string, text: string, ax?: number) => Promise<void>
  /** Move, click, then apply a patch — chips, presets, checkboxes. */
  pick: (key: string, patch: Form) => Promise<void>
  /** The pause between one card finishing and the next arriving. */
  beat: (ms?: number) => Promise<void>
  wait: (ms: number) => Promise<void>
  /** Bring card i forward. */
  card: (i: number) => void
  set: (patch: Form) => void
  frame: () => HTMLElement | null
  analyzer: () => HTMLElement | null
  reduced: boolean
}

export type TemplateDef = {
  /** Matches the picker tile's id, so the cursor knows which one to press. */
  id: string
  /** The path the window reports once the wizard is open. */
  path: string
  /** The wizard's cards, in the wizard's own order. */
  cards: { id: string; title: string; sub: string }[]
  /** Field values the run starts from. */
  empty: Form
  render: (a: RenderArgs) => React.ReactNode
  run: (c: Ctx) => Promise<void>
}

export type RenderArgs = {
  card: string
  f: Form
  focus: string | null
  analyzerRef: React.RefObject<HTMLDivElement>
  applyMenu: (c: ExtractedCategory[]) => { categories: number; items: number }
}

/* ── Shared card furniture ─────────────────────────────────────────────── */

export function Field({ label, t, on, value, ph, wide, ltr, area }: {
  label: string
  t: string
  on?: boolean
  value: string
  ph: string
  wide?: boolean
  ltr?: boolean
  area?: boolean
}) {
  return (
    <label className={`zn-f${wide ? " wide" : ""}`}>
      <span className="lab">{label}</span>
      <span
        data-t={t}
        data-on={on ? "true" : undefined}
        className={`zn-in${area ? " area" : ""}`}
        dir={ltr ? "ltr" : "rtl"}
      >
        {value ? <em>{value}</em> : <i>{ph}</i>}
      </span>
    </label>
  )
}

/**
 * The style card, built the way the wizard builds it — same three swatches in
 * the same order, the vibe in the accent colour, the name in the preset's own
 * heading font, the description in its muted colour, and the "محدّد" badge on
 * the chosen one. The presets themselves are IMPORTED from the wizard's own
 * files, so a palette can never drift between the demo and the real form.
 */
function Presets({ list, chosen }: { list: Preset[]; chosen: string }) {
  return (
    <div className="zn-presets">
      {list.map((p) => (
        <span
          key={p.id}
          data-t={`preset-${p.id}`}
          className="zn-preset"
          data-on={chosen === p.id}
          style={{
            background: p.colors.background,
            color: p.colors.text,
            borderColor: chosen === p.id ? p.colors.text : p.colors.border,
          } as React.CSSProperties}
        >
          <span className="dots">
            <em style={{ background: p.colors.primary }} />
            <em style={{ background: p.colors.accent }} />
            <em style={{ background: p.colors.surface, borderColor: p.colors.border }} />
          </span>
          {/* The three lines are Latin inside an RTL card, so they carry
              their own direction — laid out RTL, every sentence put its full
              stop on the wrong end. */}
          <i className="vibe" dir="ltr" style={{ color: p.colors.accent, fontFamily: p.heading_font }}>{p.vibe}</i>
          <b dir="ltr" style={{ fontFamily: p.heading_font, color: p.colors.text }}>{p.name}</b>
          <span className="desc" dir="ltr" style={{ color: p.colors.muted }}>{p.description}</span>
          {chosen === p.id && <span className="picked">محدّد</span>}
        </span>
      ))}
    </div>
  )
}

type Preset = {
  id: string
  name: string
  description: string
  vibe: string
  heading_font: string
  colors: { primary: string; accent: string; background: string; surface: string; text: string; muted: string; border: string }
}

/** The picture slots, filling one at a time as the cursor presses them. */
function Shots({ list, filled }: { list: { id: string; src: string }[]; filled: string[] }) {
  return (
    <div className="zn-shots">
      {list.map((s) => (
        <span
          key={s.id}
          className={`zn-shot${s.id === "hero" ? " hero" : ""}`}
          data-t={`shot-${s.id}`}
          data-filled={filled.includes(s.id)}
        >
          {filled.includes(s.id) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.src} alt="" loading="lazy" decoding="async" />
          )}
        </span>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   المطاعم — the restaurant wizard
   app/(main)/theme/new/restaurant/page.tsx
   ═══════════════════════════════════════════════════════════════════════ */

const R_PRESETS: Preset[] = RESTAURANT_PRESETS

const R_KINDS = [
  { id: "fine_dining", label: "مطعم راقٍ" },
  { id: "bistro",      label: "بيسترو" },
  { id: "cafe",        label: "مقهى" },
  { id: "bakery",      label: "مخبز" },
  { id: "pizzeria",    label: "بيتزا" },
]

const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]

/* The template's own photographs, from utils/restaurant/mock-content, pulled
   down small so the card costs no third-party request. */
const R_SHOTS = [
  { id: "hero", src: "/demo/restaurant/hero.webp" },
  { id: "2", src: "/demo/restaurant/dish-1.webp" },
  { id: "3", src: "/demo/restaurant/chef.webp" },
  { id: "4", src: "/demo/restaurant/room-1.webp" },
  { id: "5", src: "/demo/restaurant/dish-3.webp" },
]

const R = {
  brand_name: "دار نُور",
  cuisine: "مأكولات شامية عصرية",
  city: "بيروت",
  neighborhood: "الجميزة",
  address: "شارع غورو، الجميزة، بيروت",
  phone: "+961 1 555 0140",
  email: "reservations@darnoor.com",
  story: "بيت من القرن التاسع عشر، فتح مطعمًا عام ٢٠١٤. مطبخ شامي بمكوّنات من مزارع البقاع.",
  chefName: "الشيف سامي خوري",
  chefTitle: "الشيف · المالك",
  press: "النهار\nدليل ميشلان\nتايم آوت بيروت",
}

export const restaurant: TemplateDef = {
  id: "restaurant",
  path: "/theme/new/restaurant",
  cards: [
    { id: "basics",  title: "الأساسيات",           sub: "من أنت وماذا تقدّم." },
    { id: "style",   title: "النمط البصري",         sub: "اختر المظهر. يمكنك تغييره لاحقًا." },
    { id: "place",   title: "الموقع وساعات العمل",  sub: "أين يجدك الضيوف، ومتى تفتح." },
    { id: "menu",    title: "القائمة",              sub: "حتى صنف واحد يكفي." },
    { id: "story",   title: "قصتك",                 sub: "ملخّص قصير. سيحوّله الذكاء الاصطناعي إلى نص تحريري." },
    { id: "booking", title: "الحجوزات",             sub: "تصل الحجوزات مباشرةً إلى لوحة تحكّمك في زينيا — بلا منصّات خارجية." },
    { id: "visuals", title: "الصور",                sub: "ارفع صورك الخاصة. أو تخطَّ — نحن نتكفّل بذلك." },
    { id: "press",   title: "الصحافة والجوائز",     sub: "اختياري. واحدة في كل سطر." },
  ],
  empty: {
    brand_name: "", cuisine: "", city: "", neighborhood: "", kind: "", preset: "",
    address: "", phone: "", email: "", closed: false, cats: [],
    story: "", chef_name: "", chef_title: "", booking: "", press: "", shots: [],
  },

  render: ({ card, f, focus, analyzerRef, applyMenu }) => {
    switch (card) {
      case "basics":
        return (
          <>
            <div className="zn-row">
              <Field label="اسم المطعم" t="brand_name" on={focus === "brand_name"} value={f.brand_name} ph="دار نُور" />
              <Field label="المطبخ" t="cuisine" on={focus === "cuisine"} value={f.cuisine} ph="مأكولات شامية عصرية" />
              <Field label="المدينة" t="city" on={focus === "city"} value={f.city} ph="بيروت" />
              <Field label="الحي" t="neighborhood" on={focus === "neighborhood"} value={f.neighborhood} ph="الجميزة" />
            </div>
            <p className="zn-lab">ما نوع المكان؟ <span>· اختياري</span></p>
            <div className="zn-chips">
              {R_KINDS.map((k) => (
                <span key={k.id} data-t={`kind-${k.id}`} className="zn-chip" data-on={f.kind === k.id}>
                  {k.label}
                </span>
              ))}
            </div>
          </>
        )

      case "style":
        return <Presets list={R_PRESETS} chosen={f.preset} />

      case "place":
        return (
          <>
            <div className="zn-row">
              <Field label="العنوان الكامل" t="address" on={focus === "address"} value={f.address} ph="شارع غورو، الجميزة، بيروت" wide />
              <Field label="الهاتف" t="phone" on={focus === "phone"} value={f.phone} ph="+961 1 555 0140" ltr />
              <Field label="البريد الإلكتروني" t="email" on={focus === "email"} value={f.email} ph="reservations@restaurant.com" ltr />
            </div>
            <p className="zn-lab">ساعات العمل</p>
            <div className="zn-hours">
              {DAYS.map((d, i) => (
                <span key={d} className="zn-hour" data-off={i === 2 && f.closed}>
                  <b>{d}</b>
                  <i>{i === 2 && f.closed ? "مغلق" : "5:30 م — 11:00 م"}</i>
                  <u data-t={`closed-${i}`} data-on={i === 2 && f.closed} />
                </span>
              ))}
            </div>
          </>
        )

      case "menu":
        return (
          <>
            {/* The product's own component, mounted rather than reproduced. */}
            <div className="zn-analyzer" ref={analyzerRef}>
              <MenuImageAnalyzer demo cuisine={f.cuisine || R.cuisine} onExtract={applyMenu} />
            </div>
            {f.cats.length > 0 && (
              <div className="zn-menu" data-done="true">
                {f.cats.map((c: any) => (
                  <div key={c.name} className="zn-cat">
                    <b>{c.name}</b>
                    {c.items.map((it: any) => (
                      <span key={it.name} className="zn-dish">
                        <em>{it.name}</em>
                        <i dir="ltr">{it.price}</i>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )

      case "story":
        return (
          <>
            <Field label="عن المطعم" t="story" on={focus === "story"} value={f.story} area wide
              ph="بضع جمل. متى افتتحت، وما الفلسفة، ومن أين تستورد؟" />
            <div className="zn-row">
              <Field label="اسم الشيف" t="chef_name" on={focus === "chef_name"} value={f.chef_name} ph="الشيف سامي خوري" />
              <Field label="لقب الشيف" t="chef_title" on={focus === "chef_title"} value={f.chef_title} ph="الشيف · المالك" />
            </div>
          </>
        )

      case "booking":
        return (
          <Field label="رقم هاتف للحجز (احتياطي، اختياري)" t="booking" on={focus === "booking"}
            value={f.booking} ph="+961 1 555 0140" ltr wide />
        )

      case "visuals":
        return (
          <>
            <p className="zn-note">
              <b>لا صور؟ لا تقلق.</b> اترك أي خانة فارغة وسنملؤها بصور جميلة خالية من الحقوق.
            </p>
            <Shots list={R_SHOTS} filled={f.shots} />
          </>
        )

      case "press":
        return (
          <Field label="الصحافة والجوائز" t="press" on={focus === "press"} value={f.press} area wide
            ph={"النهار\nدليل ميشلان\nتايم آوت بيروت"} />
        )

      default:
        return null
    }
  },

  run: async (c) => {
    /* 1 · الأساسيات */
    await c.type("brand_name", R.brand_name)
    await c.type("cuisine", R.cuisine)
    await c.type("city", R.city)
    await c.type("neighborhood", R.neighborhood)
    await c.pick("kind-fine_dining", { kind: "fine_dining" })
    await c.beat()

    /* 2 · النمط البصري */
    c.card(1); await c.wait(600)
    await c.move("preset-coastal", 0.5, 0.5)
    await c.wait(260)
    await c.move("preset-onyx", 0.5, 0.5)
    await c.click()
    c.set({ preset: "onyx" })
    await c.beat()

    /* 3 · الموقع وساعات العمل */
    c.card(2); await c.wait(600)
    await c.type("address", R.address)
    await c.type("phone", R.phone, 0.14)
    await c.type("email", R.email, 0.14)
    await c.pick("closed-2", { closed: true })
    await c.beat()

    /* 4 · القائمة — the beat that carries the idea. */
    c.card(3); await c.wait(660)
    await runMenuCard(c)
    await c.beat()

    /* 5 · قصتك */
    c.card(4); await c.wait(600)
    await c.type("story", R.story)
    await c.type("chef_name", R.chefName)
    await c.type("chef_title", R.chefTitle)
    await c.beat()

    /* 6 · الحجوزات */
    c.card(5); await c.wait(600)
    await c.type("booking", R.phone, 0.14)
    await c.beat()

    /* 7 · الصور */
    c.card(6); await c.wait(620)
    for (const s of R_SHOTS) {
      await c.move(`shot-${s.id}`, 0.5, 0.5)
      await c.click()
      c.set({ shots: (prev: string[]) => [...prev, s.id] })
      await c.wait(300)
    }
    await c.beat()

    /* 8 · الصحافة والجوائز */
    c.card(7); await c.wait(600)
    await c.type("press", R.press)
    await c.beat(520)
  },
}

/**
 * The Menu card, driven through the product's own component rather than
 * around it: a real JPEG is handed to the real file input, the component's
 * real preparation runs on it, and its real read button is pressed.
 */
async function runMenuCard(c: Ctx) {
  const box = c.analyzer()
  if (!box) { await c.wait(900); return }
  const input = box.querySelector<HTMLInputElement>('input[type="file"]')
  const byText = (needle: string) =>
    Array.from(box.querySelectorAll("button")).find((b) => (b.textContent || "").includes(needle))

  await c.moveEl(byText("ارفع") || box, 0.5, 0.5)
  await c.click()

  /* The file dialog has no scripted equivalent, so the sample goes onto the
     input exactly as a picked file does: a real File on a real DataTransfer,
     and a real bubbling change event — the event React's onChange listens for. */
  try {
    const blob = await fetch("/demo/menu-sample.jpg").then((r) => r.blob())
    if (input) {
      const dt = new DataTransfer()
      dt.items.add(new File([blob], "menu-sample.jpg", { type: "image/jpeg" }))
      input.files = dt.files
      input.dispatchEvent(new Event("change", { bubbles: true }))
    }
  } catch {
    /* No sample to hand over. The card still reads, it is just empty. */
  }
  await c.wait(1000)

  const read = byText("اقرأ")
  await c.moveEl(read || box, 0.5, 0.5)
  await c.click()
  if (read) read.click()

  /* Held until the read has come back, watched from the FRAME — what the read
     produces renders beside the analyzer, not inside it. */
  const until = Date.now() + 25000
  for (;;) {
    await c.wait(200)
    if (c.frame()?.querySelector('[data-done="true"]')) break
    if (Date.now() > until) break
  }
  await c.moveEl(c.frame()?.querySelector(".zn-menu") ?? null, 0.5, 0.4)
  await c.wait(1100)
}

/* ═══════════════════════════════════════════════════════════════════════
   الخدمات — the local-services wizard
   app/(main)/theme/new/services/page.tsx

   Seven cards, and the style preset is the LAST of them rather than the
   second: that is the order this wizard asks in, and the animation follows
   the template rather than the other way round.
   ═══════════════════════════════════════════════════════════════════════ */

const S_PRESETS: Preset[] = SERVICE_PRESETS

const S_SHOTS = [
  { id: "hero", src: "/demo/services/hero.webp" },
  { id: "2", src: "/demo/services/team.webp" },
  { id: "3", src: "/demo/services/work-1.webp" },
  { id: "4", src: "/demo/services/work-2.webp" },
  { id: "5", src: "/demo/services/work-3.webp" },
]

/* The services the demo business offers. Three, because the wizard's own
   subtitle says one is enough and more becomes a full services section —
   watching the list grow IS this template's centrepiece, the way the menu
   read is the restaurant's. */
const S_SERVICES = [
  { name: "تركيب مكيّفات سبليت", price: "يبدأ من 450 ﷼",
    desc: "تركيب كامل مع اختبار التشغيل وضمان سنة.", badge: "الأكثر طلبًا" },
  { name: "صيانة دورية وتنظيف", price: "يبدأ من 180 ﷼",
    desc: "تنظيف الفلاتر والمواسير وفحص غاز التبريد.", badge: "" },
  { name: "كشف تسرّب وإصلاح", price: "يبدأ من 250 ﷼",
    desc: "كشف بالأجهزة وإصلاح في الزيارة نفسها.", badge: "استجابة سريعة" },
]

const S = {
  business_name: "مؤسسة الإتقان للتكييف",
  category: "تكييف وتبريد",
  city: "الرياض",
  area: "الملقا",
  owner_name: "عبدالله الحربي",
  years: "12",
  phone: "+966 11 555 0142",
  email: "hello@aletqan.sa",
  availability: "من السبت إلى الخميس، 8 صباحًا — 8 مساءً",
  response: "نرد خلال ساعة في أوقات العمل",
  areas_served: "العليا\nالملقا\nحطين\nالنرجس",
  differentiators: "أسعار معلنة مسبقًا\nفنيّون معتمدون\nضمان سنة على التركيب",
  promo: "فحص مجاني مع عرض سعر التركيب",
  story: "بدأت المؤسسة عام ٢٠١٢ بورشة صغيرة في الملقا، وتخدم اليوم شمال الرياض بفريق من ثمانية فنيّين.",
  owner_title: "المؤسّس · فنّي معتمد",
  quote: "نصلح ما نركّبه، ونأتي في الموعد.",
}

export const services: TemplateDef = {
  id: "services",
  path: "/theme/new/services",
  cards: [
    { id: "basics",   title: "أساسيات النشاط",      sub: "ما نوع نشاط الخدمات المحلية هذا؟" },
    { id: "contact",  title: "التواصل والتوفّر",     sub: "ما الذي ينبغي أن يعرفه العميل قبل الحجز؟" },
    { id: "services", title: "الخدمات",             sub: "حتى خدمة واحدة تكفي. أضف المزيد إن كنت تقدّمها." },
    { id: "trust",    title: "منطقة الخدمة والثقة", sub: "كلها اختيارية — كلما أضفت أكثر، بدا الموقع أغنى." },
    { id: "story",    title: "قصة النشاط",          sub: "بضع جمل تكفي. سنصقلها إلى نصوص موقع فاخرة." },
    { id: "visuals",  title: "الأصول البصرية",       sub: "ارفع صورك الخاصة. تخطَّ أي خانة وسنملؤها بصور بديلة جميلة." },
    { id: "style",    title: "النمط البصري",         sub: "اختر النمط الجاهز الأنسب لهذا النشاط المحلي." },
  ],
  empty: {
    business_name: "", category: "", city: "", area: "", owner_name: "", years: "",
    phone: "", email: "", availability: "", response: "",
    services: [], areas_served: "", differentiators: "", promo: "",
    story: "", owner_title: "", quote: "", preset: "", shots: [],
  },

  render: ({ card, f, focus }) => {
    switch (card) {
      case "basics":
        return (
          <div className="zn-row">
            <Field label="اسم النشاط" t="business_name" on={focus === "business_name"} value={f.business_name} ph="مؤسسة الإتقان للتكييف" />
            <Field label="فئة الخدمة" t="category" on={focus === "category"} value={f.category} ph="تكييف وتبريد" />
            <Field label="المدينة" t="city" on={focus === "city"} value={f.city} ph="الرياض" />
            <Field label="المنطقة" t="area" on={focus === "area"} value={f.area} ph="الملقا" />
            <Field label="اسم المالك / المسؤول" t="owner_name" on={focus === "owner_name"} value={f.owner_name} ph="عبدالله الحربي" />
            <Field label="سنوات الخبرة" t="years" on={focus === "years"} value={f.years} ph="12" ltr />
          </div>
        )

      case "contact":
        return (
          <div className="zn-row">
            <Field label="الهاتف" t="phone" on={focus === "phone"} value={f.phone} ph="+966 11 555 0142" ltr />
            <Field label="البريد الإلكتروني" t="email" on={focus === "email"} value={f.email} ph="hello@business.sa" ltr />
            <Field label="سطر التوفّر" t="availability" on={focus === "availability"} value={f.availability} wide
              ph="من السبت إلى الخميس، 8 صباحًا — 8 مساءً" />
            <Field label="سطر وقت الاستجابة" t="response" on={focus === "response"} value={f.response} wide
              ph="نرد خلال ساعة في أوقات العمل" />
          </div>
        )

      case "services":
        return (
          <div className="zn-services">
            {f.services.map((s: any, i: number) => (
              <div key={s.name} className="zn-service">
                <p className="no">الخدمة 0{i + 1}</p>
                <div className="body">
                  <b>{s.name}</b>
                  <i dir="rtl">{s.price}</i>
                  <span className="desc">{s.desc}</span>
                  {s.badge && <span className="badge">{s.badge}</span>}
                </div>
              </div>
            ))}
            <span className="zn-addservice" data-t="add-service">+ أضف خدمة أخرى</span>
          </div>
        )

      case "trust":
        return (
          <div className="zn-row">
            <Field label="المناطق المخدومة" t="areas_served" on={focus === "areas_served"} value={f.areas_served} area
              ph={"واحدة في كل سطر\nالعليا\nالملقا"} />
            <Field label="عوامل التميّز / نقاط الثقة" t="differentiators" on={focus === "differentiators"} value={f.differentiators} area
              ph={"واحدة في كل سطر\nأسعار معلنة مسبقًا\nمرخّص ومؤمّن"} />
            <Field label="عرض ترويجي" t="promo" on={focus === "promo"} value={f.promo} wide
              ph="فحص مجاني مع عرض سعر التركيب" />
          </div>
        )

      case "story":
        return (
          <>
            <Field label="ملخّص القصة" t="story" on={focus === "story"} value={f.story} area wide
              ph="بضع جمل. متى بدأت، ومن تخدم، وما الذي يميّز شغلك؟" />
            <div className="zn-row">
              <Field label="لقب المالك" t="owner_title" on={focus === "owner_title"} value={f.owner_title} ph="المؤسّس · فنّي معتمد" />
              <Field label="بذرة اقتباس" t="quote" on={focus === "quote"} value={f.quote} ph="نصلح ما نركّبه، ونأتي في الموعد." />
            </div>
          </>
        )

      case "visuals":
        return (
          <>
            <p className="zn-note">
              <b>لا صور؟ لا تقلق.</b> تخطَّ أي خانة وسنملؤها بصور بديلة جميلة.
            </p>
            <Shots list={S_SHOTS} filled={f.shots} />
          </>
        )

      case "style":
        return <Presets list={S_PRESETS} chosen={f.preset} />

      default:
        return null
    }
  },

  run: async (c) => {
    /* 1 · أساسيات النشاط */
    await c.type("business_name", S.business_name)
    await c.type("category", S.category)
    await c.type("city", S.city)
    await c.type("area", S.area)
    await c.type("owner_name", S.owner_name)
    await c.type("years", S.years, 0.14)
    await c.beat()

    /* 2 · التواصل والتوفّر */
    c.card(1); await c.wait(600)
    await c.type("phone", S.phone, 0.14)
    await c.type("email", S.email, 0.14)
    await c.type("availability", S.availability)
    await c.type("response", S.response)
    await c.beat()

    /* 3 · الخدمات — the beat that carries this template.
       The list is built rather than shown: one service is filled in, the
       cursor presses "add another", and the next arrives. That growing list
       is what this wizard is for, the way the menu read is the restaurant's. */
    c.card(2); await c.wait(660)
    for (let i = 0; i < S_SERVICES.length; i += 1) {
      if (i > 0) {
        await c.move("add-service", 0.5, 0.5)
        await c.click()
        await c.wait(220)
      }
      c.set({ services: (prev: any[]) => [...prev, S_SERVICES[i]] })
      await c.wait(900)
    }
    await c.beat()

    /* 4 · منطقة الخدمة والثقة.
       The wizard also asks for an average rating and a review count. Those
       are left alone on purpose: this business has no reviews to show, and
       typing a number into that box would be inventing one. */
    c.card(3); await c.wait(600)
    await c.type("areas_served", S.areas_served)
    await c.type("differentiators", S.differentiators)
    await c.type("promo", S.promo)
    await c.beat()

    /* 5 · قصة النشاط */
    c.card(4); await c.wait(600)
    await c.type("story", S.story)
    await c.type("owner_title", S.owner_title)
    await c.type("quote", S.quote)
    await c.beat()

    /* 6 · الأصول البصرية */
    c.card(5); await c.wait(620)
    for (const s of S_SHOTS) {
      await c.move(`shot-${s.id}`, 0.5, 0.5)
      await c.click()
      c.set({ shots: (prev: string[]) => [...prev, s.id] })
      await c.wait(300)
    }
    await c.beat()

    /* 7 · النمط البصري — last here, because that is where this wizard puts it. */
    c.card(6); await c.wait(600)
    await c.move("preset-amber", 0.5, 0.5)
    await c.wait(260)
    await c.move("preset-cobalt", 0.5, 0.5)
    await c.click()
    c.set({ preset: "cobalt" })
    await c.beat(520)
  },
}

/** Every template section two knows how to fill, in the order it runs them. */
export const TEMPLATE_RUNS: TemplateDef[] = [restaurant, services]
