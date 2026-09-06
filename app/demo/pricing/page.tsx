/**
 * Candidate pricing page — the house style applied to the one surface that
 * takes money.
 *
 * NOT the pricing page. It ships as a standalone route at /demo/pricing so it
 * can be reviewed on the real domain; app/(main)/pricing/page.tsx remains the
 * live page and is untouched. It is noindex, because a second pricing page in
 * the index would compete with the real one for the same query.
 *
 * Design read: a price list is a receipt, not a pitch — three keys laid on
 * white paper, and the only colour in the room is on the one you are meant to
 * press. Materials come from docs/zenya-hero-style.md; the theatre does not.
 *
 * Three decisions, all made by rendering candidates on the real page rather
 * than by reasoning about them:
 *
 *   - NO AMBIENT WASH. The live page carries AuroraBackground: three blurred
 *     orbs, fixed, drifting under the whole document. The style refuses
 *     gradients on anything that is not the light itself, and records that the
 *     light belongs to the hero rather than sitting under the whole site for
 *     ever. Rendered as a candidate anyway (a violet band scoped to the card
 *     row) and it tinted the two paper cards lilac so they stopped reading as
 *     paper. There is no wash here. On a page whose job is to mark ONE plan,
 *     an ambient tint is the thing the accent would have to shout over.
 *
 *   - IT SCROLLS, it is not a deck. A deck is a pitch instrument. This is a
 *     reference document people read line by line, deep-link into and search
 *     with Cmd+F. What is borrowed from the deck is its stillness, not its
 *     gesture: one idea per band, generous air, and no entrance animation at
 *     all — every resting state here is the finished state.
 *
 *   - THE MIDDLE CARD IS OBSIDIAN. This is ادر's inversion, which the style
 *     doc records as its ONE exception to the achromatic rule, "because it is
 *     the inside of the product rather than the paper the product is drawn
 *     on". A plan you buy is the inside of the product. Same values as the
 *     manage panel: #131316 ground, #5e6ad2 fill, #97a0ee for type and
 *     hairlines, because the flat primary falls under 4.5:1 on that ground.
 *     Measured here: 7.58:1 on the label, 7.32:1 on secondary type, 15.18:1
 *     on the feature rows.
 *
 * Four candidates were rejected, and the reasons are worth keeping because
 * each cost a render pass:
 *
 *   - Hairline cards with no fill dissolved the two outer plans into the
 *     paper. On a page whose whole job is comparison, losing the column
 *     boundary is a functional loss, not a stylistic one.
 *   - Inverting PRO instead put the black on the most expensive plan while
 *     Starter still carried the badge — two emphases, and a reader who cannot
 *     tell what they are being told.
 *   - A violet rail down the leading edge read as a divider, which the style
 *     refuses as decoration.
 *   - Standing the featured card taller broke the top alignment of the three
 *     prices. That one scan line is the most important comparison on the page.
 *
 * THE KEY RECIPE IS SCOPED TO THE BUTTONS. The doc's six-layer key — gradient
 * ground, lit top rim, 3px front wall, 26% ring, hard 3px base, one contact
 * shadow — is the deliberate exception to the no-shadows rule, and it says
 * plainly that content never does this. So a card is not a key. Cards take the
 * ring token; only the three CTAs are pressable, so only they are keys.
 *
 * THE BADGE SITS INSIDE THE CARD. A pill hovering over the card's top edge is
 * the standard SaaS move and it fights the ring it overlaps — and on a phone,
 * where the recommendation leads the stack, it is clipped at the top of the
 * viewport. Inline above the plan name it costs nothing and breaks no edge.
 *
 * ONE ACCENT, NOT TWO. Pro's free-domain note used to be an amber box, which
 * made the row carry two accent colours for one page. It is the same violet
 * as everything else now, as a hairline ring rather than a filled slab.
 *
 * Every number here is the one the rest of the codebase charges: Entry $0.50
 * once, Starter $14.99/mo, Pro $24.99/mo. Nothing on this page is invented —
 * no counts, no ratings, no "trusted by".
 */

import type { Metadata } from "next"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import ZenyaMark from "@/components/ZenyaMark"

/* The display face, as the hero sets it. */
const display = Tajawal({ subsets: ["arabic"], weight: ["500", "700", "900"], display: "swap" })

/* UI face for the header and the cards: neutral and quiet, so the prices stay
   the only thing on the page carrying weight. */
const ui = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], display: "swap" })

export const metadata: Metadata = {
  title: "الأسعار — نسخة تجريبية",
  robots: { index: false, follow: false },
}

const PLANS = [
  {
    id: "entry",
    name: "Entry",
    amount: "$0.50",
    per: "/لمرة واحدة",
    sub: "ابنِ، أدِر، وانشر — جرّب زينيا بأقل تكلفة.",
    cta: "ابدأ بـ 0.50$",
    href: "/checkout?plan=entry",
    /* Entry needs a foot line of its own, and not for symmetry: the features
       list is flex:1, so a card with no foot pushes its button 30px below its
       neighbours' — measured. This one is also the truest thing about the
       plan, since Entry is the only one that is not a subscription. */
    foot: "دفعة واحدة — بلا اشتراك",
    features: [
      "توليد قالبين (٢) بالذكاء الاصطناعي — دفعة واحدة",
      "جميع القوالب الثمانية للمعاينة",
      "انشر موقعك على اسمك.zenyaai.co",
      "كل أدوات التحرير والإدارة",
      "شهر تجربة للحجوزات وتحليلات الموقع",
      "دعم المجتمع",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    amount: "$14.99",
    per: "/شهريًا",
    sub: "ابنِ، أدِر، وانشر — بلا حدود، على نطاقك الخاص.",
    cta: "اشترك في Starter",
    href: "/checkout?plan=starter",
    badge: "الأكثر شيوعًا",
    foot: "ألغِ في أي وقت",
    features: [
      "توليد غير محدود — يشمل تحديثات القوالب",
      "جميع القوالب الثمانية الاحترافية",
      "انشر على نطاقك الخاص",
      "شهادة SSL تلقائية + CDN سريع",
      "الحجوزات وتحليلات الموقع — كاملة",
      "ملف ثيم شوبيفاي جاهز (المتجر + التشكيلة)",
      "وصول مبكر للقوالب الجديدة",
      "دعم ذو أولوية",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    amount: "$24.99",
    per: "/شهريًا",
    sub: "ابنِ، أدِر، وانشر — كل شيء مشمول، بنطاق مجاني.",
    cta: "اشترك في Pro",
    href: "/checkout?plan=pro",
    foot: "ألغِ في أي وقت · يبقى الموقع مباشرًا حتى نهاية الشهر",
    note: {
      title: "نطاق مجاني لسنة",
      body: "على الامتدادات الاقتصادية — والأغلى (مثل .com) بخصم 30%.",
    },
    features: [
      "كل ما في خطة Starter، بالإضافة إلى:",
      "نطاق مخصّص مجاني لسنة — ‏.store، .site، .online، .shop",
      "خصم 30% على النطاقات الأغلى (.com وأمثالها)",
      "إزالة شارة «صُنع بزينيا»",
      "إدارة كاملة لموقعك ونطاقك",
      "دعم أولوية قصوى",
    ],
  },
] as const

/* The header's three destinations, as /demo/home lists them. The mark goes
   back to the deck rather than to /, because inside the demo that is where a
   reader came from. */
const NAV = [
  { href: "/themes", label: "القوالب" },
  { href: "/demo/pricing", label: "الأسعار", current: true },
  { href: "/contact", label: "تواصل" },
]

function Tick({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.2 6.3 4.6 8.8 9.8 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DemoPricingPage() {
  return (
    <main className={"zp-root " + ui.className} dir="rtl">
      {/* dangerouslySetInnerHTML, not a text child. A string child of <style>
          is escaped on the server and re-read by the parser on the client, and
          the two do not agree — measured: seven "Text content does not match"
          errors and the entire root falling back to client rendering. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* The header, on the same recipe as the deck's: one surface, a hairline
          separator before the account side, and the key's geometry under it. */}
      <header className="zp-head">
        <div className="zp-pill">
          <Link href="/demo/home" className="zp-mark" aria-label="زينيا">
            <ZenyaMark className="zp-mark-svg" />
          </Link>
          <nav className="zp-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="zp-nav-item"
                data-current={item.current ? "true" : undefined}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="zp-sep" aria-hidden />
          <Link href="/dashboard" className="zp-account">
            حسابي
          </Link>
        </div>
      </header>

      <div className="zp-body">
        {/* One line, and one line under it. The style's rule is that a page
            makes one claim; here the claim is the price itself, so the type
            says the plainest true thing and gets out of the way. */}
        <div className="zp-lede">
          <h1 className={"zp-h1 " + display.className}>
            المعاينة مجانية.
            <br />
            التوليد يبدأ بنصف دولار.
          </h1>
          <p className="zp-lede-sub">
            خطة تُدفع مرّة واحدة، وخطّتان شهريتان. الاشتراك يُلغى متى شئت.
          </p>
        </div>

        <section className="zp-row" aria-label="الخطط">
          {PLANS.map((plan) => {
            const marked = plan.id === "starter"
            return (
              <article
                key={plan.id}
                className="zp-card"
                data-plan={plan.id}
                data-mark={marked ? "true" : undefined}
              >
                <header className="zp-card-head">
                  {/* The badge is ALWAYS rendered, ghosted on the two plans
                      that do not carry one. Rendering it only where it exists
                      pushed Starter's name and price 33px below its
                      neighbours' — measured — and the top alignment of the
                      three prices is the single most important scan line on
                      the page. A reserved row sized by the real element beats
                      a magic number that the copy can outgrow. */}
                  <b
                    className="zp-badge"
                    data-ghost={"badge" in plan && plan.badge ? undefined : "true"}
                    aria-hidden={"badge" in plan && plan.badge ? undefined : true}
                  >
                    {"badge" in plan && plan.badge ? plan.badge : " "}
                  </b>
                  <p className="zp-name">{plan.name}</p>
                  <div className="zp-price">
                    <span className={"zp-amount " + display.className} dir="ltr">
                      {plan.amount}
                    </span>
                    <span className="zp-per">{plan.per}</span>
                  </div>
                  <p className="zp-sub">{plan.sub}</p>
                </header>

                {"note" in plan && plan.note ? (
                  <div className="zp-note">
                    <span className="zp-note-title">{plan.note.title}</span>
                    <span className="zp-note-body">{plan.note.body}</span>
                  </div>
                ) : null}

                <ul className="zp-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Tick className="zp-tick" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="zp-cta">
                  {plan.cta}
                </Link>

                <p className="zp-foot">{plan.foot}</p>
              </article>
            )
          })}
        </section>

        <p className="zp-tail">
          عندك كود خصم؟ أدخِله في خانة «Promotion code» عند الدفع.
        </p>
      </div>
    </main>
  )
}

/* ---------------------------------------------------------------------------
   No backticks inside this literal: one would end it.

   The gutter and the inset are the two measurements the style holds
   everything off. Percentages and rem throughout, never vh — the root
   ZoomLock writes CSS zoom, and viewport units resolve before that scale is
   applied.
--------------------------------------------------------------------------- */
const CSS = `
.zp-root {
  --paper: #fafafa;
  --obsidian: #171717;
  --stone: #666666;
  --ink-soft: #3a3a38;
  --violet: #5e6ad2;
  --violet-lift: #97a0ee;
  --onyx: #131316;
  --gut: clamp(1.25rem, 4.5vw, 4rem);
  --inset: 2rem;
  --ring: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 4px rgba(250, 250, 250, 0.55);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);

  position: relative;
  min-height: 100%;
  background: var(--paper);
  color: var(--obsidian);
  padding: 0 var(--gut) 6rem;
}
/* The route stands alone, so it paints its own ground rather than borrowing
   the marketing shell's cream. */
.zp-root::before {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--paper);
  z-index: -1;
}

/* ---- the header ---------------------------------------------------------- */

.zp-head {
  display: flex;
  justify-content: center;
  padding-top: var(--inset);
  padding-bottom: clamp(3rem, 9vw, 6rem);
}
.zp-pill {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  width: fit-content;
  padding: 0.3125rem 0.5rem;
  border-radius: 24px;
  /* The key, exactly as the deck builds it: a gradient ground rather than a
     flat one, a lit top rim, a 3px front wall, a firm 26% ring, a hard 3px
     base with no blur, and one short contact shadow. */
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(246, 245, 242, 0.96) 100%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -3px 0 rgba(17, 17, 17, 0.10),
    0 0 0 1px rgba(17, 17, 17, 0.28),
    0 3px 0 rgba(17, 17, 17, 0.12),
    0 8px 16px rgba(17, 17, 17, 0.11);
}
@media (prefers-reduced-transparency: reduce) {
  .zp-pill { -webkit-backdrop-filter: none; backdrop-filter: none; }
}
.zp-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.zp-mark-svg { height: 17px; color: #000; }
.zp-nav { display: flex; align-items: center; gap: 0.125rem; }
.zp-nav-item {
  border-radius: 999px;
  padding: 0.5rem 0.75rem;
  font-size: 14px;
  line-height: 1.24;
  color: var(--stone);
  text-decoration: none;
  transition: color 150ms var(--ease-out);
}
.zp-nav-item:hover { color: var(--obsidian); }
.zp-nav-item[data-current="true"] { color: var(--obsidian); }
/* The one separator the style allows: inside the header pill, before the
   account control. Nothing else on this page draws a line. */
.zp-sep {
  width: 1px;
  height: 20px;
  margin-inline-start: 0.375rem;
  background: rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
}
.zp-account {
  margin-inline-start: 0.375rem;
  border-radius: 999px;
  padding: 0.5rem 0.875rem;
  font-size: 14px;
  line-height: 1.24;
  font-weight: 500;
  text-decoration: none;
  background: var(--obsidian);
  color: var(--paper);
  transition: opacity 150ms var(--ease-out);
}
.zp-account:hover { opacity: 0.86; }

/* ---- the lede ------------------------------------------------------------ */

.zp-body { max-width: 1040px; margin: 0 auto; }
.zp-lede { text-align: center; margin-bottom: clamp(2.75rem, 6vw, 4.25rem); }
.zp-h1 {
  margin: 0;
  font-size: clamp(30px, 5.4vw, 52px);
  font-weight: 900;
  /* Arabic: leading well above 1.24, and letter-spacing is never negative. */
  line-height: 1.34;
  letter-spacing: 0;
  color: var(--obsidian);
}
.zp-lede-sub {
  margin: 1rem auto 0;
  max-width: 34rem;
  font-size: 15px;
  line-height: 1.85;
  color: var(--stone);
}

/* ---- the row ------------------------------------------------------------- */

.zp-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: stretch;
}
.zp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.875rem 1.75rem 1.75rem;
  border-radius: 14px;
  background: #fff;
  /* Elevation is stacked hairline rings, never a drop shadow. */
  box-shadow: var(--ring);
}
.zp-card[data-mark] {
  background: var(--onyx);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55), 0 0 0 4px rgba(250, 250, 250, 0.55);
}

.zp-badge {
  display: inline-block;
  align-self: flex-start;
  margin-bottom: 0.75rem;
  padding: 0.1875rem 0.6875rem;
  border-radius: 999px;
  background: var(--violet);
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
/* The reserved row. visibility rather than display, so the box is still laid
   out and still measures exactly what a real badge measures. */
.zp-badge[data-ghost] { visibility: hidden; }
.zp-card-head { display: flex; flex-direction: column; align-items: flex-start; }
.zp-name {
  margin: 0 0 0.875rem;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--stone);
}
.zp-card[data-mark] .zp-name { color: var(--violet-lift); }

.zp-price { display: flex; align-items: baseline; gap: 0.375rem; margin-bottom: 0.5625rem; }
.zp-amount {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.24;
  letter-spacing: 0;
  color: var(--obsidian);
}
.zp-card[data-mark] .zp-amount { color: var(--paper); }
.zp-per { font-size: 14px; line-height: 1.6; color: var(--stone); }
.zp-card[data-mark] .zp-per { color: #a2a2ab; }

.zp-sub { margin: 0; font-size: 13.5px; line-height: 1.7; color: var(--stone); }
.zp-card[data-mark] .zp-sub { color: #a2a2ab; }

/* Pro's entitlement note. A hairline-ringed box in the page's one accent,
   not a filled slab in a second one. */
.zp-note {
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  margin-top: 1.125rem;
  padding: 0.6875rem 0.8125rem;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(94, 106, 210, 0.28);
}
.zp-note-title { font-size: 12px; font-weight: 600; line-height: 1.6; color: var(--violet); }
.zp-note-body { font-size: 11.5px; line-height: 1.7; color: #55557a; }

.zp-features {
  list-style: none;
  margin: 1.375rem 0 1.625rem;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6875rem;
}
.zp-features li {
  display: flex;
  align-items: flex-start;
  gap: 0.5625rem;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.zp-card[data-mark] .zp-features li { color: #e8e8ec; }
.zp-tick { width: 14px; height: 14px; flex: 0 0 14px; margin-top: 3px; color: #8a8a86; }
.zp-card[data-mark] .zp-tick { color: var(--violet-lift); }

/* ---- the keys ------------------------------------------------------------ */

.zp-cta {
  display: block;
  padding: 0.75rem;
  border-radius: 10px;
  text-align: center;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(246, 245, 242, 0.96) 100%);
  color: var(--obsidian);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -3px 0 rgba(17, 17, 17, 0.10),
    0 0 0 1px rgba(17, 17, 17, 0.26),
    0 3px 0 rgba(17, 17, 17, 0.12),
    0 8px 16px rgba(17, 17, 17, 0.11);
  transition: transform 120ms var(--ease-out), box-shadow 120ms var(--ease-out);
}
.zp-card[data-mark] .zp-cta {
  background: linear-gradient(180deg, #6b76d8 0%, #5460c9 100%);
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -3px 0 rgba(26, 30, 72, 0.34),
    0 0 0 1px rgba(52, 60, 150, 0.55),
    0 3px 0 rgba(52, 60, 150, 0.30),
    0 8px 16px rgba(94, 106, 210, 0.26);
}
/* A key that is pressed loses its base and moves down by exactly the base it
   lost. One that sinks is a switch; one that keeps its base is a picture. */
.zp-cta:active {
  transform: translateY(3px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -1px 0 rgba(17, 17, 17, 0.10),
    0 0 0 1px rgba(17, 17, 17, 0.26),
    0 2px 6px rgba(17, 17, 17, 0.10);
}
.zp-card[data-mark] .zp-cta:active {
  transform: translateY(3px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(26, 30, 72, 0.34),
    0 0 0 1px rgba(52, 60, 150, 0.55),
    0 2px 6px rgba(94, 106, 210, 0.22);
}

/* Two lines' worth, reserved on every card. Pro's line is longer than the
   other two and wraps at narrow card widths; without the reservation that
   wrap alone moves Pro's button up while its neighbours' stay put. The dead
   space costs nothing, because this is the last element in the card. */
.zp-foot {
  margin: 0.625rem 0 0;
  min-height: 2.45rem;
  text-align: center;
  font-size: 11.5px;
  line-height: 1.7;
  color: #8a8a86;
}
.zp-card[data-mark] .zp-foot { color: #a2a2ab; }

.zp-tail {
  margin: clamp(2.5rem, 5vw, 3.5rem) auto 0;
  text-align: center;
  font-size: 13px;
  line-height: 1.8;
  color: var(--stone);
}

/* ---- narrow -------------------------------------------------------------- */

/* One column, and the recommendation leads. A reader on a phone scrolls past
   the first card to reach the others, so the first card should be the one
   being recommended rather than the cheapest by accident of source order. */
@media (max-width: 860px) {
  .zp-row { grid-template-columns: minmax(0, 1fr); gap: 1rem; max-width: 26rem; margin: 0 auto; }
  .zp-card[data-plan="starter"] { order: -1; }
}
@media (max-width: 520px) {
  .zp-root { padding-bottom: 4rem; }
  .zp-head { padding-bottom: 2.5rem; }
  .zp-card { padding: 1.625rem 1.375rem 1.5rem; }
  .zp-amount { font-size: 40px; }
}

/* Nothing here animates on arrival, so there is no entrance to collapse — but
   the key's press is motion, and it goes with everything else. */
@media (prefers-reduced-motion: reduce) {
  .zp-cta { transition: none; }
  .zp-cta:active { transform: none; }
}
`
