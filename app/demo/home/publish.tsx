"use client"

import {
  AlertCircle, CheckCircle2, Clock, Edit3, ExternalLink, Eye, Globe,
  Lock, RefreshCw, Search, Sparkles,
} from "lucide-react"
import { RESTAURANT_MOCK_CONTENT as MOCK } from "@/utils/restaurant/mock-content"
import { RESTAURANT_PRESETS } from "@/utils/restaurant/presets"
import { type Runner } from "./runner"

/* ─────────────────────────────────────────────────────────────────────────
   What section four drives — انشر.

   The third of the hero's words, and the one that finishes the arc: ابن
   makes the site, ادر runs it, انشر puts it on the internet under an address
   somebody can type. Two surfaces, in the order the owner meets them:

     النطاق   /dashboard/domains — searching for a domain and taking one
     النشر    /dashboard/sites   — publishing the site, and then the SITE

   The split is section three's: PublishSection owns the browser, the cursor
   and the clock; everything surface-shaped is here.

   ── NOTHING HERE IS INVENTED, and the domain screen is where that was hard.

   A domain search screen has three columns of fact on it: which extensions
   exist, whether each one is free, and what it costs. The first two are
   checkable and were checked; the third is a number Porkbun answers with at
   the moment of the search, and this page has no session and no right to
   call that route, so there is no honest way to print a price here.

   The answer is not to make one up and not to leave the column blank. It is
   to show the search that needs no price: the six extensions below are the
   first six of the product's own BARE_TLDS list, every taken one needs no
   figure at all, and both available ones are on the cheap list that Pro's
   free-domain entitlement covers — so their price cell reads what the real
   screen reads for that account, مجاني · سنة, which is an entitlement rather
   than a figure. The reader still sees availability, still sees a price
   column doing its job, and no number on the screen was imagined.

   The availability is real and was checked over RDAP on 2026-09-01:
   .store .online .shop .com registered, .site and .xyz unregistered. A
   domain can of course be taken between then and now — if that matters
   enough to somebody, re-check the six and swap the states. It is two
   minutes of curl, and it is the reason the check date is written here.
   ───────────────────────────────────────────────────────────────────────── */

export type Form = Record<string, any>

export type PublishCtx = Runner & {
  set: (patch: Form) => void
  /** Type into a field this file draws, one character per beat. */
  typeState: (t: string, key: string, text: string) => Promise<void>
  setFocus: (k: string | null) => void
}

export type SurfaceDef = {
  id: string
  /** The switcher's label. */
  label: string
  /** What the address bar reads before the surface changes it. */
  host: string
  path: string
  empty: Form
  render: (a: { f: Form; focus: string | null }) => React.ReactNode
  run: (c: PublishCtx) => Promise<void>
}

/* The business is section two's business, and the site is the one section
   three already takes a booking on: دار نُور, in the onyx preset the wizard
   picks one screen up. The whole page follows one company through. */
const BRAND = MOCK.brand.name
const NAME = "darnoor"
const SUB = NAME + ".zenyaai.co"
const BOUGHT = NAME + ".site"

/* ═══════════════════════════════════════════════════════════════════════
   النطاق — buying the address
   app/(app)/dashboard/domains/page.tsx

   The real screen, in its own order: the search card with the Pro free-domain
   banner, the results table with its four real columns, and — once something
   is taken — the connected-domain row underneath walking its real status
   ladder, بانتظار DNS then جارٍ إصدار SSL then منشور · SSL مفعّل, with the
   product's own icons and its own colours for each.
   ═══════════════════════════════════════════════════════════════════════ */

/* The first six of the route's own BARE_TLDS, in its own order. See the note
   at the top of this file for why these six and no others. */
const TLDS = [
  { tld: "store", free: false },
  { tld: "site", free: true },
  { tld: "online", free: false },
  { tld: "shop", free: false },
  { tld: "xyz", free: true },
  { tld: "com", free: false },
]

/* The status ladder, with the domains page's own labels and its own colours,
   lifted for a dark ground the way every other value in these two sections
   is. The product paints live in #15803d; on obsidian that same green as
   TYPE measures under AA, so the text step is a lifted stop of it and the
   fill keeps the exact product value. */
const LADDER = [
  { id: "dns", label: "بانتظار DNS", icon: Clock, tone: "wait" },
  { id: "ssl", label: "جارٍ إصدار SSL…", icon: RefreshCw, tone: "work" },
  { id: "live", label: "منشور · SSL مفعّل", icon: CheckCircle2, tone: "live" },
] as const

export const domains: SurfaceDef = {
  id: "domains",
  label: "النطاق",
  host: "zenyaai.co",
  path: "/dashboard/domains",
  empty: { q: "", rows: [], searching: false, step: -1 },

  render: ({ f, focus }) => {
    const step = f.step as number
    const rung = step >= 0 ? LADDER[Math.min(step, LADDER.length - 1)] : null

    return (
      <div className="zn4-screen-in">
        <div className="zn4-head">
          <h2><Globe className="ic" /> النطاقات</h2>
          <p>اربط نطاقًا مخصصًا تملكه بالفعل، أو ابحث عن نطاق جديد. شهادة SSL تلقائية.</p>
        </div>

        <div className="zn4-card">
          <div className="zn4-cardhead">
            <Sparkles className="ic acc" />
            <h3>ابحث عن نطاق جديد</h3>
          </div>
          <p className="zn4-sub">
            اكتب اسمًا، وشاهد المتاح، واشترِه بنقرة واحدة — التسجيل وDNS وSSL تُجهَّز لك تلقائيًا.
          </p>

          {/* The entitlement banner the real screen shows a Pro account that
              has not claimed its free domain yet, in its own words. It is
              also what makes the price column below honest: the two available
              rows are on exactly the list this sentence names. */}
          <div className="zn4-gift">
            <Sparkles className="ic" />
            <span>🎁 نطاقك المجاني بانتظارك — سنة كاملة مجانًا مع Pro على الامتدادات الاقتصادية.</span>
          </div>

          <div className="zn4-search">
            <label className="zn4-field" data-on={focus === "q"} data-t="q">
              <Search className="ic" />
              <span dir="ltr" className="val">
                {f.q || <i className="ph">mystore  أو  mystore.com</i>}
                {focus === "q" && <em />}
              </span>
            </label>
            <button type="button" className="zn4-go" data-t="check" data-busy={f.searching}>
              {f.searching ? "جارٍ الفحص…" : "تحقق من التوفّر"}
            </button>
          </div>

          {f.rows.length > 0 && (
            <div className="zn4-table">
              <div className="zn4-tr zn4-th">
                <span>النطاق</span>
                <span>الحالة</span>
                <span className="end">السعر / سنة</span>
                <span />
              </div>
              {f.rows.map((r: any) => (
                <div className="zn4-tr" key={r.domain} data-t={"row-" + r.tld}>
                  <span className="dom" dir="ltr">{r.domain}</span>
                  <span>
                    {r.state === "free" ? (
                      <b className="zn4-pill live"><CheckCircle2 className="ic" /> متاح</b>
                    ) : r.state === "taken" ? (
                      <b className="zn4-pill mute">محجوز</b>
                    ) : r.state === "checking" ? (
                      <b className="zn4-pill work"><RefreshCw className="ic spin" /> جارٍ الفحص…</b>
                    ) : (
                      <b className="zn4-pill idle"><Clock className="ic" /> بالانتظار…</b>
                    )}
                  </span>
                  <span className="end price">
                    {r.state === "free"
                      ? <b className="zn4-free">مجاني · سنة</b>
                      : <i>—</i>}
                  </span>
                  <span className="end">
                    {r.state === "free" ? (
                      <button type="button" className="zn4-buy" data-t={"buy-" + r.tld} data-busy={r.buying}>
                        {r.buying ? "جارٍ التحميل…" : "احصل عليه مجانًا ←"}
                      </button>
                    ) : r.state === "taken" ? (
                      <i className="zn4-muted">محجوز مسبقًا</i>
                    ) : (
                      <i className="zn4-muted">{r.state === "checking" ? "…" : "التالي"}</i>
                    )}
                  </span>
                </div>
              ))}
              <div className="zn4-tf">
                شراء نطاق عبر زينيا يجهّزه تلقائيًا — التسجيل وDNS وSSL. لا سجلّات يدوية للنسخ.
              </div>
            </div>
          )}
        </div>

        {rung && (
          <>
            <h3 className="zn4-label">نطاقاتك المربوطة</h3>
            <div className="zn4-card zn4-domrow" data-t="linked" data-tone={rung.tone}>
              <div className="who">
                <span className="disc" data-tone={rung.tone}>
                  <rung.icon className={"ic" + (rung.tone === "work" ? " spin" : "")} />
                </span>
                <div>
                  <div className="top">
                    <code dir="ltr">{BOUGHT}</code>
                    <b className="zn4-pill" data-tone={rung.tone}>{rung.label}</b>
                  </div>
                  <div className="bot">
                    يشير إلى <strong>{BRAND}</strong> · <span dir="ltr">{SUB}</span>
                  </div>
                </div>
              </div>
              <div className="acts">
                {rung.tone === "live" ? (
                  <i className="zn4-ghost">فتح <ExternalLink className="ic" /></i>
                ) : (
                  <i className="zn4-ghost"><RefreshCw className="ic" /> إعادة فحص</i>
                )}
                <i className="zn4-ghost">إزالة</i>
              </div>
            </div>
          </>
        )}
      </div>
    )
  },

  run: async (c) => {
    const { move, click, beat, wait, set } = c

    /* One name, typed into the real box. */
    await c.typeState("q", "q", NAME)
    await beat(420)

    await move("check")
    await click()
    set({ searching: true })
    await wait(700)

    /* The rows arrive the way the real screen fills them — all six queued,
       then resolving one after another. The real registrar allows one check
       every ten seconds and the screen says so; nothing here claims a
       duration, because a demo that printed the countdown would be printing
       a timing it is not honouring. What is shown is the state that search
       genuinely ends in. */
    set({
      searching: false,
      rows: TLDS.map((t) => ({ ...t, domain: NAME + "." + t.tld, state: "idle", buying: false })),
    })
    await wait(560)

    for (let i = 0; i < TLDS.length; i += 1) {
      set({ rows: (rows: any[]) => rows.map((r, j) => (j === i ? { ...r, state: "checking" } : r)) })
      await wait(330)
      set({
        rows: (rows: any[]) =>
          rows.map((r, j) => (j === i ? { ...r, state: r.free ? "free" : "taken" } : r)),
      })
      /* The cursor drops onto the free one as it lands — the RESULT, while
         the rest of the table is still resolving underneath it. */
      if (TLDS[i].tld === "site") { await move("row-site", 0.5, 0.5); await wait(420) }
      else await wait(300)
    }

    await beat(1100)

    await move("buy-site")
    await click()
    set({ rows: (rows: any[]) => rows.map((r) => (r.tld === "site" ? { ...r, buying: true } : r)) })
    await wait(760)
    set({
      step: 0,
      rows: (rows: any[]) => rows.map((r) => (r.tld === "site" ? { ...r, buying: false } : r)),
    })

    /* And off the button immediately: the thing worth watching is the row
       that just appeared underneath, not the control that made it. */
    await move("linked", 0.5, 0.5)
    await wait(1500)
    set({ step: 1 })
    await wait(1900)
    set({ step: 2 })
    await beat(3400)
  },
}

/* ═══════════════════════════════════════════════════════════════════════
   النشر — the publish, and then the site
   app/(app)/dashboard/sites · components/dashboard/SiteCard.tsx

   The real card, with its real status pill, its real draft line and its real
   buttons. The cursor presses انشر على زينيا, the pill turns مباشر with the
   product's own pulsing dot, the free subdomain appears where SiteCard puts
   it — and then the ADDRESS BAR takes over.

   That last beat is the point of the whole section, and it is the one thing
   this page has never shown: seventy seconds of ابن fills in a form and never
   shows the website that comes out. Here the browser goes to the address the
   reader just watched being bought, and the site is on the other side of it.
   ═══════════════════════════════════════════════════════════════════════ */

/* The onyx preset — the palette the wizard picks in section two and the one
   section three's booking form is already painted in. One company, one site,
   one set of colours, across three screens. */
const ONYX = RESTAURANT_PRESETS.find((p) => p.id === "onyx")!.colors

/* The hero photograph is room-1, NOT the template's own hero: that file is
   Unsplash stock with wine glasses across the foreground and bare arms, and
   is wrong for this brand. An interior also says what a restaurant is in a
   way a plate does not. */
const SHOT = "/demo/restaurant/room-1.webp"

export const publish: SurfaceDef = {
  id: "publish",
  label: "النشر",
  host: "zenyaai.co",
  path: "/dashboard/sites",
  empty: { live: false, busy: false, url: "", loading: 0, site: false },

  render: ({ f }) => {
    if (f.site) return <LiveSite />

    return (
      <div className="zn4-screen-in">
        <div className="zn4-head">
          <h2>مواقعك</h2>
          <p>كل موقع بنيته يعيش هنا. انشره على زينيا، أو اربطه بنطاقك.</p>
        </div>

        <div className="zn4-site" data-t="card">
          <div className="cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/theme-previews/thumb/restaurant.webp" alt="" />
            <span className="stripe" />
            <span className="status" data-live={f.live} data-t="status">
              {f.live ? <><i className="dot" /> مباشر</> : "مسودّة"}
            </span>
          </div>

          <div className="body">
            <h3>{BRAND}</h3>
            <p className="kind">مطعم · مبني بزينيا</p>

            {f.live ? (
              <span className="host" data-t="host">
                <Globe className="ic" />
                <span dir="ltr">{SUB}</span>
              </span>
            ) : (
              <span className="draft">مسودّة · غير مباشر بعد</span>
            )}

            <div className="acts">
              <i className="zn4-ghost"><Edit3 className="ic" /> تعديل</i>
              <i className="zn4-ghost"><Eye className="ic" /> معاينة</i>
              {f.live ? (
                <button type="button" className="zn4-go" data-t="adddomain">
                  <Globe className="ic" /> أضف نطاقًا
                </button>
              ) : (
                <button type="button" className="zn4-go" data-t="publish" data-busy={f.busy}>
                  {f.busy ? "جارٍ النشر…" : "انشر على زينيا"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="zn4-note">
          <Lock className="ic" />
          كل موقع منشور يحصل على نطاق <span dir="ltr">اسمك.zenyaai.co</span> مجانًا، بشهادة SSL.
        </div>
      </div>
    )
  },

  run: async (c) => {
    const { move, click, beat, wait, set } = c

    await move("card", 0.5, 0.3)
    await beat(900)

    await move("publish")
    await click()
    set({ busy: true })
    await wait(1150)
    set({ busy: false, live: true })

    /* Off the button and onto what it did — the pill, then the address the
       site just got. The rule this page keeps: the cursor rests on the
       result, never on the control that caused it. */
    await move("status", 0.5, 0.5)
    await wait(1200)
    await move("host", 0.5, 0.5)
    await beat(1600)

    /* And now the address bar. The browser goes to the domain the other
       surface bought, and the dashboard gives way to the site. */
    await move("url", 0.5, 0.5)
    await click()
    if (c.reduced) {
      set({ url: BOUGHT })
    } else {
      for (let i = 1; i <= BOUGHT.length; i += 1) {
        set({ url: BOUGHT.slice(0, i) })
        await wait(52)
      }
    }
    await wait(420)

    /* The load. A thin line across the top of the window, exactly as long as
       the swap takes, and then the site. */
    set({ loading: 1 })
    await wait(760)
    set({ site: true, loading: 0 })
    await wait(900)

    /* Rest inside the site, on the thing a guest would press. */
    await move("book", 0.5, 0.5)
    await beat(4200)
  },
}

/** The published site: the real template's own content, at its own address. */
function LiveSite() {
  const s = {
    "--s-bg": ONYX.background,
    "--s-txt": ONYX.text,
    "--s-mut": ONYX.muted,
    "--s-acc": ONYX.accent,
    "--s-line": ONYX.border,
  } as React.CSSProperties

  return (
    <div className="zn4-live" style={s}>
      <header>
        <span className="mark">{BRAND}</span>
        <nav>
          <i>القائمة</i><i>قصتنا</i><i>الزيارة</i>
          <b data-t="book">{MOCK.hero.primary_cta}</b>
        </nav>
      </header>

      <div className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SHOT} alt="" />
        <div className="over">
          <span className="eyebrow">{MOCK.hero.eyebrow}</span>
          <h1>{MOCK.hero.headline}</h1>
          <p>{MOCK.hero.subheadline}</p>
          <span className="ctas">
            <b>{MOCK.hero.primary_cta}</b>
            <i>{MOCK.hero.secondary_cta}</i>
          </span>
        </div>
      </div>

      <div className="dishes">
        <span className="eyebrow">{MOCK.signature_dishes_heading}</span>
        <div className="grid">
          {MOCK.signature_dishes.slice(0, 3).map((d: any, i: number) => (
            <div className="dish" key={d.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/demo/restaurant/dish-${i + 1}.webp`} alt="" />
              <div className="cap">
                <b>{d.name}</b>
                <u>{d.price}</u>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const SURFACES: SurfaceDef[] = [domains, publish]
