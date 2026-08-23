"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import MenuImageAnalyzer, { type ExtractedCategory } from "@/components/restaurant/MenuImageAnalyzer"
import { themePreview, themePreviewFallback } from "@/lib/theme-previews"

/* ─────────────────────────────────────────────────────────────────────────
   Section two: ابن — the build step.

   The first of the hero's three words, shown rather than described. The
   section drives the product's own path: the eight templates as /themes
   lists them, the real wizard behind the one that is picked, and the real
   form filling itself in.

   The animation is PER CARD, never one long take. A card comes forward, a
   cursor moves into it, types or picks, the card finishes, a beat of
   thinking plays, and only then does the next card arrive with its own
   animation. One card, one animation, in sequence.

   The Menu card is the one that carries the idea, and it is the smallest:
   it mounts the product's real MenuImageAnalyzer, hands it a real sample
   photograph through the real file input, and lets it make its real
   request. Four categories, two dishes each — the sample is drawn to that
   shape, so nothing has to be trimmed on the way in.
   ───────────────────────────────────────────────────────────────────────── */

/* The reference's neutral ramp. Nothing in this section is tinted: the only
   colour on the page belongs to the light at the edges, which this sits on
   top of rather than beside. */
const OBSIDIAN = "#171717"

/* The eight, in the order /themes lists them and with the same Arabic
   labels (lib/aurora-tints), the same taglines and the same createHref. The
   template the cursor picks is the one a reader clicking here would land on. */
const TEMPLATES = [
  { id: "one_product", label: "متجر",   tag: "متجر شوبيفاي · منتج واحد", href: "/build" },
  { id: "restaurant",  label: "مطعم",   tag: "مطعم · قائمة · حجوزات",     href: "/theme/new/restaurant" },
  { id: "atlas",       label: "تطبيق",  tag: "تطبيق · برمجيات · B2B",     href: "/theme/new/atlas" },
  { id: "lookbook",    label: "أزياء",  tag: "أزياء · ملابس · علامة",     href: "/theme/new/lookbook" },
  { id: "collective",  label: "تشكيلة", tag: "كتالوج · منتجات متعددة",    href: "/theme/new/collective" },
  { id: "studio",      label: "ستوديو", tag: "قصة علامة · تحرير",         href: "/theme/new/studio" },
  { id: "services",    label: "خدمات",  tag: "خدمات محلية · حِرف",         href: "/theme/new/services" },
  { id: "wellness",    label: "عافية",  tag: "سبا · يوغا · عافية",        href: "/theme/new/wellness" },
]

/* The wizard's eight cards, titled and subtitled as
   app/(main)/theme/new/restaurant/page.tsx titles them. Two subtitles are
   cut to their first sentence to fit the card; the rest are verbatim. */
const CARDS = [
  { id: "basics",  title: "الأساسيات",           sub: "من أنت وماذا تقدّم." },
  { id: "style",   title: "النمط البصري",         sub: "اختر المظهر. يمكنك تغييره لاحقًا." },
  { id: "place",   title: "الموقع وساعات العمل",  sub: "أين يجدك الضيوف، ومتى تفتح." },
  { id: "menu",    title: "القائمة",              sub: "حتى صنف واحد يكفي." },
  { id: "story",   title: "قصتك",                 sub: "ملخّص قصير. سيحوّله الذكاء الاصطناعي إلى نص تحريري." },
  { id: "booking", title: "الحجوزات",             sub: "تصل الحجوزات مباشرةً إلى لوحة تحكّمك في زينيا — بلا منصّات خارجية." },
  { id: "visuals", title: "الصور",                sub: "ارفع صورك الخاصة. أو تخطَّ — نحن نتكفّل بذلك." },
  { id: "press",   title: "الصحافة والجوائز",     sub: "اختياري. واحدة في كل سطر." },
]

/* The four style presets the wizard offers, with the palettes they actually
   name, from utils/restaurant/presets. This card is the one place in the
   window that has to carry colour: a style picker whose styles are all the
   same colour is not showing the reader anything. */
const PRESETS = [
  { id: "onyx",      name: "Onyx",      vibe: "cinematic luxury",
    dots: ["#0e0e10", "#c8a96a", "#f4ecd8"], paper: "#0a0a0c", ink: "#f4ecd8" },
  { id: "trattoria", name: "Trattoria", vibe: "rustic warm",
    dots: ["#a8323a", "#d4915a", "#ffffff"], paper: "#f5ebd8", ink: "#2a1d18" },
  { id: "coastal",   name: "Coastal",   vibe: "breezy refined",
    dots: ["#1e5566", "#d8a657", "#ffffff"], paper: "#f4ede0", ink: "#172a30" },
  { id: "forest",    name: "Forest",    vibe: "earthy elevated",
    dots: ["#3f5d3a", "#b89968", "#ffffff"], paper: "#ebe6d8", ink: "#1f2a1d" },
]

/* The build word, cycling the hero's first column on the hero's own roll. */
const WORDS = ["ابن", "تبني", "بناء", "تحسين"]
const WORD_HOLD = 4600

/* Five of the wizard's twelve type chips — the card only needs enough of the
   row to be picked from. */
const KINDS = [
  { id: "fine_dining", label: "مطعم راقٍ" },
  { id: "bistro",      label: "بيسترو" },
  { id: "cafe",        label: "مقهى" },
  { id: "bakery",      label: "مخبز" },
  { id: "pizzeria",    label: "بيتزا" },
]

/* The days, as the wizard seeds them. Monday is the one that gets closed. */
const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]

/* What the demo restaurant types in — the same imaginary place the wizard's
   own example fill describes, so the two surfaces never disagree. */
const SAMPLE = {
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

/* Timings. The cursor is slow enough to be followed and the typing fast
   enough not to be waited on; the beat between cards is what makes this read
   as eight short animations rather than one long take. */
const MOVE = 620
const PRESS = 170
const SETTLE = 260
/* Milliseconds a keystroke. It ran at 26 and read as a machine filling a form
   rather than a person typing into one; the beats around it were tight for the
   same reason. Everything here is deliberately unhurried. */
const KEY = 46
const THINK = 900

type Item = { name: string; price: string }
type Cat = { name: string; items: Item[] }

type Form = {
  brand_name: string
  cuisine: string
  city: string
  neighborhood: string
  kind: string
  preset: string
  address: string
  phone: string
  email: string
  closed: boolean
  cats: Cat[]
  story: string
  chef_name: string
  chef_title: string
  booking: string
  press: string
}

const EMPTY: Form = {
  brand_name: "", cuisine: "", city: "", neighborhood: "", kind: "", preset: "",
  address: "", phone: "", email: "", closed: false, cats: [],
  story: "", chef_name: "", chef_title: "", booking: "", press: "",
}

/* Thrown to unwind the script when the section goes off screen or unmounts.
   Caught by the runner itself, and means nothing else. */
const HALT = Symbol("halt")

export default function BuildSection({
  active,
  uiClass,
  wordClass,
  wordWeight,
  wordLh,
}: {
  active: boolean
  uiClass: string
  /* The hero's chosen face, so the build word changes with it. */
  wordClass: string
  wordWeight: number
  wordLh: number
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const analyzerRef = useRef<HTMLDivElement>(null)

  const [view, setView] = useState<"picker" | "wizard">("picker")
  const [card, setCard] = useState(0)
  const [hover, setHover] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  /* Which field is being typed into. A caret belongs to exactly one field at
     a time, and only while it is being written — a caret left standing in a
     finished field reads as a form waiting for someone. */
  const [focus, setFocus] = useState<string | null>(null)
  /* The cursor is the one thing here that is decoration, so it stays out of
     the document until a card is actually being driven. */
  const [cursor, setCursor] = useState<{ x: number; y: number; press: boolean } | null>(null)
  /* The wizard's own closing bar, and whether its button has been pressed.
     It is the ninth beat rather than a card: in the wizard it is sticky at
     the foot of the whole form, not a section of it. */
  const [finish, setFinish] = useState<false | "ready" | "going">(false)
  /* Bumped to run the sequence again from the picker. */
  const [take, setTake] = useState(0)

  /* The build word's own clock, on the hero's hold and the hero's roll: the
     word leaving goes up on the fast curve while the next rises from below. */
  const [word, setWord] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null })
  useEffect(() => {
    if (!active) { setWord({ cur: 0, prev: null }); return }
    const id = setInterval(
      () => setWord((w) => ({ cur: (w.cur + 1) % WORDS.length, prev: w.cur })),
      WORD_HOLD,
    )
    return () => clearInterval(id)
  }, [active])

  /* Where the analyzer hands its result back: the wizard's own
     applyExtractedMenu, narrowed to what this card shows. What it returns is
     what the analyzer prints in its confirmation line. */
  const applyMenu = useCallback((extracted: ExtractedCategory[]) => {
    const mapped: Cat[] = extracted
      .map((c) => ({
        name: (c.name || "").trim().slice(0, 40),
        items: (Array.isArray(c.items) ? c.items : [])
          .map((it) => ({
            name: (it.name || "").trim().slice(0, 80),
            price: (it.price || "").trim().slice(0, 30),
          }))
          .filter((it) => it.name.length >= 1),
      }))
      .filter((c) => c.name.length >= 2 && c.items.length > 0)
    setForm((f) => ({ ...f, cats: mapped }))
    return { categories: mapped.length, items: mapped.reduce((n, c) => n + c.items.length, 0) }
  }, [])

  useEffect(() => {
    if (!active) {
      /* Back to the state the section rests in when nothing has run: the
         eight templates, which are real content on their own. */
      setView("picker"); setCard(0); setForm(EMPTY); setHover(null); setCursor(null); setFocus(null)
      setFinish(false)
      return
    }
    let dead = false
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    /* Warm the read the moment the section arrives, some twenty seconds
       before the Menu card asks for it. The route answers a demo read from
       one memo per server instance, so this is the same work the card is
       about to ask for, started early: the first visitor on a cold instance
       watches the cursor rather than a spinner, and every visitor after them
       is answered from the memo either way. Fire and forget — if it fails,
       the card's own read simply does the work itself. */
    void fetch("/api/analyze-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true }),
    }).catch(() => { /* the card will ask again */ })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms))
    const wait = async (ms: number) => { await sleep(ms); if (dead) throw HALT }

    /* Where a target sits inside the frame. Rects come back in RENDERED
       pixels, because the root ZoomLock writes CSS zoom, while the offset
       written onto the cursor is in CSS pixels. The frame's own rect against
       its offsetWidth is the ratio between the two, so the two are never
       mixed — the same trap the hero's column measurement fell into. */
    const at = (el: Element | null, ax = 0.5, ay = 0.55) => {
      const frame = frameRef.current
      if (!frame || !el) return null
      const f = frame.getBoundingClientRect()
      const t = el.getBoundingClientRect()
      const scale = frame.offsetWidth ? f.width / frame.offsetWidth : 1
      if (!scale) return null
      return {
        x: (t.left + t.width * ax - f.left) / scale,
        y: (t.top + t.height * ay - f.top) / scale,
      }
    }

    const find = (key: string) => frameRef.current?.querySelector(`[data-t="${key}"]`) ?? null

    const moveEl = async (el: Element | null, ax?: number, ay?: number) => {
      const p = at(el, ax, ay)
      if (p) setCursor((c) => ({ x: p.x, y: p.y, press: c ? c.press : false }))
      await wait(reduced ? 0 : MOVE)
    }
    const move = (key: string, ax?: number, ay?: number) => moveEl(find(key), ax, ay)

    const click = async () => {
      setCursor((c) => (c ? { ...c, press: true } : c))
      await wait(PRESS)
      setCursor((c) => (c ? { ...c, press: false } : c))
      await wait(SETTLE)
    }

    /* Typing is typing: one more character per beat into the field the cursor
       is sitting in. Arabic reshapes as its letters connect, which is exactly
       what a reader typing into this field would see, so there is nothing to
       clip around at this size — unlike the claim, which is display type. */
    const type = async (key: keyof Form, text: string, ax = 0.88) => {
      await move(key as string, ax)
      await click()
      setFocus(key as string)
      if (reduced) {
        setForm((f) => ({ ...f, [key]: text }))
        await wait(140)
        setFocus(null)
        return
      }
      for (let i = 1; i <= text.length; i += 1) {
        setForm((f) => ({ ...f, [key]: text.slice(0, i) }))
        await wait(KEY + Math.random() * 30)
      }
      await wait(190)
      setFocus(null)
    }

    const pick = async (key: string, patch: Partial<Form>) => {
      await move(key)
      await click()
      setForm((f) => ({ ...f, ...patch }))
      await wait(260)
    }

    /* The beat between one card finishing and the next arriving.

       The cursor STAYS. It used to be taken off the page here, which read as
       the pointer blinking out of existence every few seconds — a person
       filling a form does not vanish between fields. It drifts to where the
       next card will want it instead, and the card changes underneath it. */
    const beat = async (ms = THINK) => {
      setFocus(null)
      setCursor((c) => (c ? { ...c, press: false } : c))
      await wait(ms)
    }

    /* The Menu card, driven through the product's own component rather than
       around it: a real JPEG is handed to the real file input, the component's
       real preparation runs on it, and its real read button is pressed.
       Everything the card shows afterwards came back from that request. */
    const runMenu = async () => {
      const box = analyzerRef.current
      if (!box) { await wait(900); return }
      const input = box.querySelector<HTMLInputElement>('input[type="file"]')
      const byText = (needle: string) =>
        Array.from(box.querySelectorAll("button")).find((b) => (b.textContent || "").includes(needle))

      await moveEl(byText("ارفع") || box, 0.5, 0.5)
      await click()

      /* The file dialog a person would see has no scripted equivalent, so the
         sample is put on the input exactly as a picked file is: a real File on
         a real DataTransfer, and a real bubbling change event, which is the
         event React's own onChange is listening for. */
      try {
        const blob = await fetch("/demo/menu-sample.jpg").then((r) => r.blob())
        if (dead) throw HALT
        if (input) {
          const dt = new DataTransfer()
          dt.items.add(new File([blob], "menu-sample.jpg", { type: "image/jpeg" }))
          input.files = dt.files
          input.dispatchEvent(new Event("change", { bubbles: true }))
        }
      } catch (e) {
        if (e === HALT) throw e
        /* No sample to hand over. The card still reads, it is just empty. */
      }
      await wait(1000)

      const read = byText("اقرأ")
      await moveEl(read || box, 0.5, 0.5)
      await click()
      if (read) read.click()

      /* Held until the read has actually come back, so the beat is the
         request's own length rather than a number written here.

         Watched from the FRAME, not from the analyzer: what the read produces
         is rendered beside the analyzer rather than inside it, so looking for
         it in the analyzer's own subtree finds nothing and sits out the whole
         timeout every time. */
      const until = Date.now() + 25000
      for (;;) {
        await wait(200)
        if (frameRef.current?.querySelector('[data-done="true"]')) break
        if (Date.now() > until) break
      }
      /* The cursor stays and moves off the button rather than disappearing;
         the menu filling in below is what the reader should be watching. */
      await moveEl(frameRef.current?.querySelector(".zn-menu") ?? null, 0.5, 0.4)
      await wait(1100)
    }

    const run = async () => {
      /* ── The picker: eight templates, one of them chosen. ─────────────── */
      await wait(760)
      await move("tpl-restaurant", 0.5, 0.5)
      setHover("restaurant")
      await wait(340)
      await move("tpl-go", 0.5, 0.5)
      await click()
      setHover(null)
      setView("wizard")
      setCard(0)
      await beat(640)

      /* ── 1 · الأساسيات ───────────────────────────────────────────────── */
      await type("brand_name", SAMPLE.brand_name)
      await type("cuisine", SAMPLE.cuisine)
      await type("city", SAMPLE.city)
      await type("neighborhood", SAMPLE.neighborhood)
      await pick("kind-fine_dining", { kind: "fine_dining" })
      await beat()

      /* ── 2 · النمط البصري ────────────────────────────────────────────── */
      setCard(1); await wait(600)
      await move("preset-coastal", 0.5, 0.5)
      await wait(260)
      await move("preset-onyx", 0.5, 0.5)
      await click()
      setForm((f) => ({ ...f, preset: "onyx" }))
      await beat()

      /* ── 3 · الموقع وساعات العمل ─────────────────────────────────────── */
      setCard(2); await wait(600)
      await type("address", SAMPLE.address)
      await type("phone", SAMPLE.phone, 0.14)
      await type("email", SAMPLE.email, 0.14)
      await pick("closed-2", { closed: true })
      await beat()

      /* ── 4 · القائمة ─────────────────────────────────────────────────── */
      setCard(3); await wait(660)
      await runMenu()
      await beat()

      /* ── 5 · قصتك ────────────────────────────────────────────────────── */
      setCard(4); await wait(600)
      await type("story", SAMPLE.story)
      await type("chef_name", SAMPLE.chefName)
      await type("chef_title", SAMPLE.chefTitle)
      await beat()

      /* ── 6 · الحجوزات ────────────────────────────────────────────────── */
      setCard(5); await wait(600)
      await type("booking", SAMPLE.phone, 0.14)
      await beat()

      /* ── 7 · الصور ───────────────────────────────────────────────────── */
      /* The one card with nothing to do. Its own subtitle says a blank slot
         gets filled for you, so the cursor reads the slots and moves on —
         which is the real path for an owner with no photographs yet. */
      setCard(6); await wait(600)
      await move("shot-hero", 0.5, 0.5)
      await wait(440)
      await move("shot-3", 0.5, 0.5)
      await wait(400)
      await beat()

      /* ── 8 · الصحافة والجوائز ────────────────────────────────────────── */
      setCard(7); await wait(600)
      await type("press", SAMPLE.press)
      await beat(520)

      /* ── The ninth beat: the wizard's closing bar. ───────────────────── */
      /* Not a card. In the wizard this bar is sticky at the foot of the whole
         form, so here it rises into the window once the last card is done. */
      setFinish("ready")
      await wait(760)
      await move("generate", 0.5, 0.5)
      await click()
      setFinish("going")
      /* Held on the button's real working label. Nothing is generated: a run
         takes the wizard twenty to forty seconds of paid work per visitor,
         and showing a site that was never built would be a lie about what
         the reader just watched being filled in. */
      await beat(2600)

      /* Round again, from the eight. */
      setView("picker"); setCard(0); setForm(EMPTY); setFinish(false)
      await wait(1500)
      if (!dead) setTake((t) => t + 1)
    }

    run().catch((e) => { if (e !== HALT) throw e })
    return () => { dead = true }
  }, [active, take])

  const T = CARDS[card]

  return (
    <div className={`${uiClass} zn-build`} dir="rtl">
      {/* The word first, because dir is rtl and the word belongs on the right.
          Four forms of the one word this section is, on the hero's own roll —
          the old one leaves upward before the next rises, never together. */}
      <h2
        className={`${wordClass} zn-word`}
        style={{ fontWeight: wordWeight, lineHeight: wordLh } as React.CSSProperties}
      >
        {WORDS.map((w, i) => (
          <span
            key={w}
            data-state={i === word.cur ? "in" : i === word.prev ? "out" : "idle"}
            aria-hidden={i !== word.cur}
          >
            {w}
          </span>
        ))}
      </h2>

      <div className="zn-stagebox">
      <div className="zn-app" ref={frameRef}>
        {/* Where this is. The path changes on the click, which is the point of
            the first beat: the picker really does open the wizard. */}
        <div className="zn-path" dir="ltr">
          <span>zenyaai.co</span>
          <b>{view === "picker" ? "/themes" : "/theme/new/restaurant"}</b>
        </div>

        <div className="zn-stage">
          {view === "picker" ? (
            <div className="zn-picker">
              <h2>اختر قالبًا.</h2>
              <div className="zn-grid">
                {TEMPLATES.map((t) => (
                  <a key={t.id} href={t.href} data-t={`tpl-${t.id}`} className="zn-tile" data-on={hover === t.id}>
                    {/* The template's real cover. What a template looks like is
                        the information a picker owes the reader, and eight
                        tiles that only name themselves cannot give it.

                        Served from the 560px thumbnails, NOT from the full
                        screenshots behind themePreview(). The originals run to
                        1.2MB apiece and eight of them decoding as the panel
                        arrives was a 600–900ms stall on the one frame budget
                        this page cannot afford — the whole reason the move
                        felt like it lagged. Regenerate them whenever a cover
                        changes; the resolver is still the fallback, so a
                        missing thumbnail degrades rather than breaks.
                        eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="cover"
                      src={`/theme-previews/thumb/${t.id}.webp`}
                      alt=""
                      width={560}
                      height={350}
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement
                        el.src = el.dataset.tried ? themePreviewFallback(t.id) : themePreview(t.id)
                        el.dataset.tried = "1"
                      }}
                    />
                    <span className="tag">{t.tag}</span>
                    <span className="name">{t.label}</span>
                    <span className="go" data-t={hover === t.id ? "tpl-go" : undefined}>ابنِ بهذا</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            /* One card at a time. The key restarts the arrival on each change;
               the card rests visible and the keyframe only borrows the hidden
               state for its own duration, so a browser that never runs it
               still reads the card. */
            <div className="zn-card" key={T.id}>
              <div className="zn-head">
                <h2>{T.title}</h2>
                <p>{T.sub}</p>
              </div>
              <div className="zn-body">{renderCard(T.id, form, focus, analyzerRef, applyMenu)}</div>
            </div>
          )}
        </div>

        {/* The wizard's closing bar, verbatim. It arrives once the eighth
            card is done and rests visible, like everything else here. */}
        {finish && (
          <div className="zn-finish" data-going={finish === "going"}>
            <div>
              <p className="head">جاهزون متى كنت مستعدًّا.</p>
              <p className="sub">يستغرق نحو 20 إلى 40 ثانية. سننقلك إلى معاينتك الحيّة.</p>
            </div>
            <span className="go" data-t="generate">
              {finish === "going" ? "جارٍ توليد موقعك…" : "ولّد موقعي"}
            </span>
          </div>
        )}

        {cursor && (
          <span
            className="zn-cursor"
            data-press={cursor.press}
            aria-hidden
            style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
          >
            <svg width="15" height="18" viewBox="0 0 12 15">
              <path
                d="M1 1 L1 12.2 L4.05 9.35 L6.1 13.9 L8.15 13 L6.15 8.55 L10.3 8.4 Z"
                fill={OBSIDIAN}
                stroke="#fafafa"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
      </div>
    </div>
  )
}

/* ── The cards ─────────────────────────────────────────────────────────── */

function Field({ label, t, on, value, ph, wide, ltr, area }: {
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

function renderCard(
  id: string,
  f: Form,
  focus: string | null,
  analyzerRef: React.RefObject<HTMLDivElement>,
  applyMenu: (c: ExtractedCategory[]) => { categories: number; items: number },
) {
  switch (id) {
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
            {KINDS.map((k) => (
              <span key={k.id} data-t={`kind-${k.id}`} className="zn-chip" data-on={f.kind === k.id}>
                {k.label}
              </span>
            ))}
          </div>
        </>
      )

    case "style":
      return (
        <div className="zn-presets">
          {PRESETS.map((p) => (
            <span
              key={p.id}
              data-t={`preset-${p.id}`}
              className="zn-preset"
              data-on={f.preset === p.id}
              style={{ background: p.paper, color: p.ink } as React.CSSProperties}
            >
              <span className="dots">
                {p.dots.map((d) => (
                  <em key={d} style={{ background: d }} />
                ))}
              </span>
              <b>{p.name}</b>
              <i>{p.vibe}</i>
            </span>
          ))}
        </div>
      )

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
          {/* The product's own component, mounted rather than reproduced. The
              page imposes its palette on it from the outside so it reads as
              part of this surface; everything it does is its own. */}
          <div className="zn-analyzer" ref={analyzerRef}>
            <MenuImageAnalyzer demo cuisine={f.cuisine || SAMPLE.cuisine} onExtract={applyMenu} />
          </div>
          {f.cats.length > 0 && (
            <div className="zn-menu" data-done="true">
              {f.cats.map((c) => (
                <div key={c.name} className="zn-cat">
                  <b>{c.name}</b>
                  {c.items.map((it) => (
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
          <Field
            label="عن المطعم"
            t="story" on={focus === "story"}
            value={f.story}
            area
            wide
            ph="بضع جمل. متى افتتحت، وما الفلسفة، ومن أين تستورد؟"
          />
          <div className="zn-row">
            <Field label="اسم الشيف" t="chef_name" on={focus === "chef_name"} value={f.chef_name} ph="الشيف سامي خوري" />
            <Field label="لقب الشيف" t="chef_title" on={focus === "chef_title"} value={f.chef_title} ph="الشيف · المالك" />
          </div>
        </>
      )

    case "booking":
      return (
        <Field
          label="رقم هاتف للحجز (احتياطي، اختياري)"
          t="booking" on={focus === "booking"}
          value={f.booking}
          ph="+961 1 555 0140"
          ltr
          wide
        />
      )

    case "visuals":
      return (
        <>
          <p className="zn-note">
            <b>لا صور؟ لا تقلق.</b> اترك أي خانة فارغة وسنملؤها بصور جميلة خالية من الحقوق.
          </p>
          <div className="zn-shots">
            <span className="zn-shot hero" data-t="shot-hero" />
            {[2, 3, 4, 5].map((n) => (
              <span key={n} className="zn-shot" data-t={`shot-${n}`} />
            ))}
          </div>
        </>
      )

    case "press":
      return (
        <Field
          label="الصحافة والجوائز"
          t="press" on={focus === "press"}
          value={f.press}
          area
          wide
          ph={"النهار\nدليل ميشلان\nتايم آوت بيروت"}
        />
      )

    default:
      return null
  }
}
