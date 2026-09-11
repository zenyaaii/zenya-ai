"use client"

/**
 * The checkout candidate's view.
 *
 * NOTHING HERE TAKES MONEY AND NOTHING HERE CALLS STRIPE. There is no
 * createCheckoutSession, no POST, no fetch to /api/checkout, and no card
 * field anywhere in this tree. The page runs the live route's real rules,
 * shows the real summary built from lib/company.ts, and then STOPS AT THE
 * DOOR, says plainly that it is a design proposal, and hands the reader to
 * the real /checkout. An honest edge beats a convincing dead end, and on a
 * page about paying, a handoff screen that reads as real IS the thing that
 * would mislead.
 *
 * EVERY PRICE COMES FROM lib/company.ts AND IS NEVER RETYPED. Two of the five
 * plans lib/checkout.ts declares have a display constant there
 * (STARTER_PRICE_DISPLAY, PRO_PRICE_DISPLAY). The other three — entry,
 * onetime, hosting — do not, so this page PRINTS NO NUMBER FOR THEM and says
 * so. Their prices do exist in the product's published copy (Entry at the
 * pricing page, the two legacy plans in Terms clause 4), but printing them
 * here would be a fourth retyping of a price that has no single source, and
 * the module's own rule is read, never retype.
 *
 * THE REASSURING FACTS ARE PROVABLE, not invented. Every claim this page
 * makes about the payment is read out of lib/checkout.ts:
 *   - Stripe takes the card, not Zenya. app/(main)/checkout/page.tsx only
 *     ever calls redirect(session.url); there is no card field on this side.
 *   - Tax is calculated at Stripe: automatic_tax: { enabled: true }.
 *   - A discount code is accepted there: allow_promotion_codes: true.
 *   - A billing address is required: billing_address_collection: 'required'.
 *   - The charge may be taken in euros: pickPriceId() picks the EUR price for
 *     the EU/EEA/UK list before falling back to USD.
 * No VAT line, no trial, no guarantee, no badge, no rating and no security
 * logo is invented. The cancellation terms are the ones app/(main)/refund
 * already publishes.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Check, CalendarClock, RefreshCw, ShieldCheck, Receipt, TicketPercent,
  Landmark, ArrowLeft, CircleAlert, LogIn, KeyRound, Link2Off, TriangleAlert,
} from "lucide-react"
import type { PlanId } from "@/lib/checkout"
import { COMPANY } from "@/lib/company"
import Shell from "@/components/zenya/chrome/Shell"
import { CSS } from "./styles"

/* -------------------------------------------------------------------------
   THE PLANS, as lib/checkout.ts declares them.

   `price` is the display constant or null. NOTHING FILLS IN A NULL. `mode` is
   read off createCheckoutSession: 'onetime' and 'entry' take mode: 'payment',
   the other three take mode: 'subscription', which is what decides whether
   this page may say the word "renews" at all.
------------------------------------------------------------------------- */
type Plan = {
  id: PlanId
  name: string
  kind: string
  price: string | null
  recurring: boolean
  /** Offered to a new buyer, or reachable only by a grandfathered account. */
  legacy: boolean
  includes: string[]
}

const PLANS: Plan[] = [
  {
    id: "entry",
    name: "Entry",
    kind: "دفعة واحدة — بوّابة الدخول إلى التوليد",
    price: null,
    recurring: false,
    legacy: false,
    includes: [
      "توليد قالبين بالذكاء الاصطناعي",
      "النشر على نطاق فرعي من zenyaai.co",
      "أدوات التحرير كاملة",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    kind: "اشتراك شهري",
    price: COMPANY.STARTER_PRICE_DISPLAY,
    recurring: true,
    legacy: false,
    includes: [
      "توليد وتصدير غير محدودين بالذكاء الاصطناعي",
      "النشر على نطاقك الخاص",
      "الحجوزات والتحليلات",
      "تصدير ثيم شوبيفاي",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    kind: "اشتراك شهري",
    price: COMPANY.PRO_PRICE_DISPLAY,
    recurring: true,
    legacy: false,
    includes: [
      "كل ما في خطة Starter",
      "استضافة زينيا الكاملة",
      "نطاق مخصّص وشهادة SSL",
      "التحليلات",
    ],
  },
  {
    id: "onetime",
    name: "الخطة السابقة لمرة واحدة",
    kind: "دفعة واحدة — لحسابات سابقة فقط",
    price: null,
    recurring: false,
    legacy: true,
    includes: ["تبقى كما هي لمن اشتراها قبل تحوّل الأسعار إلى الاشتراك"],
  },
  {
    id: "hosting",
    name: "خطة الاستضافة السابقة",
    kind: "اشتراك شهري — لحسابات سابقة فقط",
    price: null,
    recurring: true,
    legacy: true,
    includes: ["تبقى كما هي لمن اشتراها قبل تحوّل الأسعار إلى الاشتراك"],
  },
]

/** The three the reader can actually pick today. The two legacy plans stay
 *  reachable through ?plan=, exactly as the live route accepts them, but they
 *  are not offered as a choice, because offering them would be an invitation
 *  to buy something that is not on sale. */
const OFFERED: PlanId[] = ["entry", "starter", "pro"]

const findPlan = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[0]

/* THE SPINE. Four steps, and the honest shape of the journey rather than a
   flattering one: Zenya owns the first two and the return, and the third —
   the one where the money moves — belongs to Stripe and is named as theirs. */
const STEPS = [
  { n: 1, label: "اختر خطتك" },
  { n: 2, label: "أنشئ حسابك" },
  { n: 3, label: "الدفع عبر Stripe" },
  { n: 4, label: "ابدأ البناء" },
]
const CURRENT = 3

export default function CheckoutView({ initialPlan }: { initialPlan: PlanId }) {
  const [plan, setPlan] = useState<PlanId>(initialPlan)
  /* The figure and the list are swapped out and back on a plan change, so the
     card reports a change the reader caused instead of cutting to it. */
  const [out, setOut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [atDoor, setAtDoor] = useState(false)
  /* Computed after mount, never on the server: a date rendered on both sides
     of a hydration boundary is a mismatch waiting for midnight. */
  const [renews, setRenews] = useState<string | null>(null)

  const current = findPlan(plan)

  useEffect(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    setRenews(new Intl.DateTimeFormat("ar", { day: "numeric", month: "long", year: "numeric" }).format(d))
  }, [])

  function pick(next: PlanId) {
    if (next === plan) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) { setPlan(next); return }
    setOut(true)
    window.setTimeout(() => { setPlan(next); setOut(false) }, 180)
  }

  /* THE DOOR. The live route would decide here; this one waits the length of
     a decision so the button reports that it did something, then stops. It
     does not call Stripe, and there is nothing in this function that could. */
  const doorRef = useRef<HTMLDivElement | null>(null)

  function knock() {
    if (busy) return
    if (atDoor) { doorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); return }
    setBusy(true)
    window.setTimeout(() => { setBusy(false); setAtDoor(true) }, 520)
  }

  return (
    <Shell css={CSS}>
      <section className="zx-open zk-open" data-reveal>
        <p className="zx-eyebrow">
          <span className="zx-eyebrow-dot" aria-hidden />
          الدفع
        </p>
        <h1 className="zx-h1">
          خطوة واحدة، ثم <span className="zx-h1-mark">يبدأ موقعك</span>
        </h1>
        <p className="zx-lede">
          تعرف ما تدفعه قبل أن تدفعه: الخطة، والمبلغ، ومتى يتجدّد، وماذا يحدث لو ألغيت.
          ثم تنتقل إلى <bdi dir="ltr">Stripe</bdi> لإتمام الدفع.
        </p>
        <p className="zx-lede">
          <strong>زينيا لا ترى بطاقتك.</strong> بيانات البطاقة تُدخَل في صفحة{" "}
          <bdi dir="ltr">Stripe</bdi> وحدها، ولا يمرّ منها شيء عبر خوادم زينيا.
        </p>
      </section>

      <section data-reveal>
        <ol className="zk-spine">
          {STEPS.map((s) => {
            const state = s.n < CURRENT ? "done" : s.n === CURRENT ? "now" : "next"
            return (
              <li key={s.n} className="zk-step" data-state={state}
                  aria-current={state === "now" ? "step" : undefined}>
                <span className="zk-num" aria-hidden>
                  {state === "done"
                    ? <Check className="zk-tickmini" strokeWidth={3} />
                    : s.n}
                </span>
                <span className="zk-lab">
                  {s.label}
                  {state === "done" ? <span className="zl-a11y"> — تمّت</span> : null}
                  {state === "now" ? <span className="zl-a11y"> — الخطوة الحالية</span> : null}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="zk-picker" role="group" aria-label="اختيار الخطة">
          {OFFERED.map((id) => {
            const p = findPlan(id)
            return (
              <button key={id} type="button" className="zk-chip"
                      aria-pressed={plan === id} onClick={() => pick(id)}>
                <span className="zk-chip-dot" aria-hidden />
                <bdi dir="ltr">{p.name}</bdi>
              </button>
            )
          })}
        </div>

        <Summary plan={current} out={out} renews={renews} busy={busy}
                 atDoor={atDoor} onGo={knock} doorRef={doorRef} />
      </section>

      <StateGallery />

      <section className="zk-tail" data-reveal>
        <p className="zx-foot-note">
          هذه صفحة <strong>تصميم مقترح</strong> لواجهة الدفع، وليست الدفع نفسه. صفحة الدفع
          الحقيقية هي <Link className="zx-link" href="/checkout">/checkout</Link>، والأسعار
          الكاملة على <Link className="zx-link" href="/pricing">صفحة الأسعار</Link>، وشروط
          الإلغاء والاسترداد في <Link className="zx-link" href="/refund">سياسة الاسترداد</Link>.
        </p>
      </section>
    </Shell>
  )
}

/* -------------------------------------------------------------------------
   THE ORDER SUMMARY. The centre of the page, not a sidebar afterthought.
------------------------------------------------------------------------- */
function Summary({
  plan, out, renews, busy, atDoor, onGo, doorRef,
}: {
  plan: Plan; out: boolean; renews: string | null
  busy: boolean; atDoor: boolean; onGo: () => void
  doorRef: React.MutableRefObject<HTMLDivElement | null>
}) {
  return (
    <div className="zk-sum">
      <div className="zk-sum-top">
        <div style={{ minWidth: 0 }}>
          <h2 className="zk-sum-name"><bdi dir="ltr">{plan.name}</bdi></h2>
          <p className="zk-sum-kind">{plan.kind}</p>
        </div>
        {plan.legacy ? <span className="zk-badge">خطة سابقة</span> : null}
      </div>

      <div className="zk-price zk-swap" data-out={out ? "true" : undefined}>
        {plan.price ? (
          <p className="zk-fig" style={{ margin: 0 }}>
            <span className="zk-amt">{plan.price}</span>
          </p>
        ) : (
          <p className="zk-noprice" style={{ margin: 0 }}>
            السعر غير معروض هنا
          </p>
        )}
      </div>

      <div className="zk-rows zk-swap zk-swap-2" data-out={out ? "true" : undefined}>
        {!plan.price ? (
          <Row icon={<CircleAlert className="zk-row-ic" strokeWidth={2} />}>
            <strong>لا يحمل <bdi dir="ltr">lib/company.ts</bdi> سعرًا معروضًا لهذه الخطة</strong>، ولن
            تُكتب هنا قيمة من خارجه. السعر المعتمد على{" "}
            <Link className="zx-link" href="/pricing">صفحة الأسعار</Link>.
          </Row>
        ) : null}

        {plan.recurring ? (
          <>
            <Row icon={<RefreshCw className="zk-row-ic" strokeWidth={2} />}>
              <strong>اشتراك شهري يتجدّد تلقائيًا</strong> في نهاية كل دورة فوترة حتى تُلغيه.
            </Row>
            <Row icon={<CalendarClock className="zk-row-ic" strokeWidth={2} />}>
              لو أتممت الدفع اليوم، يتجدّد في{" "}
              <strong>{renews ?? "أول يوم بعد شهر من الدفع"}</strong>.
            </Row>
            <Row icon={<Landmark className="zk-row-ic" strokeWidth={2} />}>
              <strong>الإلغاء في أي وقت من لوحة التحكم</strong>، دون رسوم إلغاء. ويبقى اشتراكك
              فعّالًا حتى نهاية الدورة المدفوعة الحالية.
            </Row>
          </>
        ) : (
          <Row icon={<Receipt className="zk-row-ic" strokeWidth={2} />}>
            <strong>دفعة واحدة، بلا تجديد.</strong> لا يتحوّل هذا الشراء إلى اشتراك ولا تُخصم
            منك رسوم متكرّرة بعده.
          </Row>
        )}

        <Row icon={<Receipt className="zk-row-ic" strokeWidth={2} />}>
          تُحسب الضريبة المستحقّة في صفحة <bdi dir="ltr">Stripe</bdi> بحسب بلد الفوترة الذي
          تُدخله، فقد يختلف المجموع النهائي عن الرقم أعلاه.
        </Row>
        <Row icon={<TicketPercent className="zk-row-ic" strokeWidth={2} />}>
          يمكنك إدخال <strong>رمز خصم</strong> في صفحة <bdi dir="ltr">Stripe</bdi> إن كان معك واحد.
        </Row>
        <Row icon={<Landmark className="zk-row-ic" strokeWidth={2} />}>
          قد يُخصم المبلغ <strong>باليورو</strong> إن كنت في الاتحاد الأوروبي أو المملكة
          المتحدة، وبالدولار فيما عدا ذلك.
        </Row>
      </div>

      <ul className="zk-inc zk-swap zk-swap-2" data-out={out ? "true" : undefined}>
        {plan.includes.map((t) => (
          <li key={t}>
            <Check strokeWidth={3} aria-hidden />
            <span style={{ minWidth: 0 }}>{t}</span>
          </li>
        ))}
      </ul>

      {/* ---- the handoff ------------------------------------------------ */}
      <div className="zk-hand">
        <p className="zk-hand-t">
          <ShieldCheck size={15} strokeWidth={2} aria-hidden
                       style={{ display: "inline", verticalAlign: "-2px", color: "var(--violet)", marginInlineEnd: "0.375rem" }} />
          الخطوة التالية تفتح صفحة <bdi dir="ltr">Stripe</bdi> الآمنة.{" "}
          <strong>هي من يستقبل بيانات بطاقتك، لا زينيا.</strong>
        </p>
        {/* ONCE SPENT IT IS NOT A DEAD GREY SLAB. A disabled control the reader
            just pressed reads as a page that broke rather than one that
            answered, so the button stays live and its second job is to take
            them to the panel it opened. */}
        <button type="button" className="zk-go" onClick={onGo}
                disabled={busy} aria-busy={busy}>
          {busy ? (
            <>
              <span className="zk-spin" aria-hidden />
              <span>جارٍ التحضير…</span>
            </>
          ) : (
            <span>{atDoor ? "اذهب إلى التفاصيل" : "المتابعة إلى الدفع"}</span>
          )}
        </button>
        <p className="zk-fine">
          هذه واجهة مقترحة ولا تُنفّذ أي عملية دفع. للدفع فعليًا:{" "}
          <Link href={"/checkout?plan=" + plan.id}>
            <bdi dir="ltr">/checkout?plan={plan.id}</bdi>
          </Link>
        </p>
      </div>

      <Grow on={atDoor}>
        <Door plan={plan} doorRef={doorRef} />
      </Grow>
    </div>
  )
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="zk-row">
      {icon}
      <p className="zk-row-t" style={{ margin: 0 }}>{children}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------
   THE DOOR. Where the demo stops and says so.
------------------------------------------------------------------------- */
function Door({ plan, doorRef }: {
  plan: Plan; doorRef: React.MutableRefObject<HTMLDivElement | null>
}) {
  return (
    <div className="zk-door" data-in="true" ref={doorRef}>
      <span className="zk-tick" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" focusable="false" width="100%" height="100%">
          <path className="zk-tick-p" d="M5 12.6l4.6 4.6L19 7.8" stroke="currentColor"
                strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="zk-door-h">هنا يقف العرض</h3>
      <p className="zk-door-p">
        على الصفحة الحقيقية، هذه هي اللحظة التي تنتقل فيها إلى{" "}
        <bdi dir="ltr">Stripe</bdi> لإتمام الدفع. وهذه صفحة تصميم، فهي{" "}
        <strong>لا تفتح صفحة دفع ولا تُنشئ عملية شراء ولا تتصل بـ <bdi dir="ltr">Stripe</bdi> إطلاقًا</strong>.
      </p>
      <p className="zk-dua">بارك الله لك فيما اخترت.</p>

      <div className="zk-door-acts">
        <Link href={"/checkout?plan=" + plan.id} className="zx-act-1">
          إتمام الدفع على الصفحة الحقيقية
        </Link>
        <Link href="/pricing" className="zx-act-2">
          <ArrowLeft size={15} strokeWidth={2} aria-hidden />
          العودة إلى الأسعار
        </Link>
      </div>

      <div className="zk-strip">
        <p>
          <strong>لم يُخصم منك شيء ولم يُنشأ أي اشتراك.</strong> لا يوجد في هذه الصفحة حقل بطاقة
          ولا طلب واحد إلى <bdi dir="ltr">Stripe</bdi>. وأي مشكلة تواجهك في الدفع الحقيقي،
          راسلنا على{" "}
          <a href={"mailto:" + COMPANY.SUPPORT_EMAIL}>
            <bdi dir="ltr">{COMPANY.SUPPORT_EMAIL}</bdi>
          </a>{" "}
          — أعانك الله، ونحن في خدمتك.
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
   THE GROW. Height by grid-template-rows, never a hard-coded pixel.

   THE CLIP IS ON A TIMER AND NOT ON transitionend: under reduced motion the
   transition never runs, the event never fires, and a clip waiting for it
   stays on forever and eats the 4px focus halo of the links inside.
------------------------------------------------------------------------- */
function Grow({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [moving, setMoving] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setMoving(true)
    const t = window.setTimeout(() => setMoving(false), 520)
    return () => window.clearTimeout(t)
  }, [on])
  return (
    <div className="zk-grow" data-on={on ? "true" : undefined}
         data-moving={moving ? "true" : undefined}>
      <div className="zk-grow-clip">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------
   EVERY STATE THE LIVE ROUTE CAN REACH.

   Read out of app/(main)/checkout/page.tsx rather than imagined. Nine
   outcomes: two of them render a card, six redirect, and one is the moment
   between the click and the redirect that nothing has ever designed. The
   condition beside each is the one in the file that produces it.
------------------------------------------------------------------------- */
type State = {
  name: string
  tag: string
  body: string
  cond: string
  icon: React.ReactNode
  flag?: string
}

const STATES: State[] = [
  {
    name: "قيد التحضير",
    tag: "لحظة",
    icon: <RefreshCw size={16} strokeWidth={2} aria-hidden />,
    body: "المسار الحقيقي مكوّن خادم: يقرأ الحساب ثم يُحوّل. بين الضغطة والانتقال لا تُرسم اليوم أي واجهة، وهذا هو ما يملأه الزر أعلاه.",
    cond: "createCheckoutSession() -> redirect(session.url)",
  },
  {
    name: "غير مسجّل الدخول",
    tag: "تحويل",
    icon: <LogIn size={16} strokeWidth={2} aria-hidden />,
    body: "الزائر الذي لا يملك جلسة يُرسَل إلى صفحة الإنشاء، ويعود إلى الدفع بعدها ومعه الخطة نفسها.",
    cond: "if (!user) redirect('/login?mode=signup&next=/checkout?plan=...')",
  },
  {
    name: "مفتاح Stripe غير مهيّأ",
    tag: "بطاقة خطأ",
    icon: <KeyRound size={16} strokeWidth={2} aria-hidden />,
    body: "لو غاب مفتاح Stripe من البيئة، تُرسم بطاقة الخطأ نفسها التي في أسفل هذه القائمة.",
    cond: "if (!process.env.STRIPE_SECRET_KEY)",
  },
  {
    name: "التوليد مفتوح سلفًا",
    tag: "تحويل",
    icon: <Check size={16} strokeWidth={2.5} aria-hidden />,
    body: "من فتح خطة Entry من قبل، أو كان على أي خطة مدفوعة، لا يدفع ثمنها مرّة ثانية.",
    cond: "plan === 'entry' && (entry_unlocked || is_pro || plan in {entry, starter, pro, ...}) -> ?already_unlocked=1",
  },
  {
    name: "Pro مملوكة سلفًا",
    tag: "تحويل",
    icon: <Check size={16} strokeWidth={2.5} aria-hidden />,
    body: "شراء لمرة واحدة لحساب هو أصلًا Pro لا يمرّ إلى Stripe.",
    cond: "plan === 'onetime' && profile.is_pro -> ?already_pro=1",
  },
  {
    name: "الاستضافة مملوكة سلفًا",
    tag: "تحويل",
    icon: <Check size={16} strokeWidth={2.5} aria-hidden />,
    body: "حساب عليه استضافة قائمة لا يشتريها ثانية.",
    cond: "plan === 'hosting' && profile.has_hosting -> ?already_hosting=1",
  },
  {
    name: "Starter أو Pro قائمة",
    tag: "تحويل",
    icon: <Check size={16} strokeWidth={2.5} aria-hidden />,
    body: "طلب Starter من حساب على Starter أو Pro، وطلب Pro من حساب على Pro، كلاهما يعود إلى لوحة التحكم.",
    cond: "plan === 'starter' && profile.plan in {starter, pro}   |   plan === 'pro' && profile.plan === 'pro'",
  },
  {
    name: "Stripe لم تُرجِع رابطًا",
    tag: "بطاقة خطأ",
    icon: <Link2Off size={16} strokeWidth={2} aria-hidden />,
    body: "أُنشئت الجلسة لكنها عادت بلا رابط دفع. بطاقة الخطأ نفسها.",
    cond: "if (!session.url)",
  },
  {
    name: "خطأ من Stripe",
    tag: "بطاقة خطأ",
    icon: <TriangleAlert size={16} strokeWidth={2} aria-hidden />,
    body: "أي استثناء آخر — ومنه غياب معرّف السعر للخطة المطلوبة — يصل إلى القارئ كنصّ الخطأ كما هو.",
    cond: "catch (e) -> CheckoutError(e.message)",
  },
]

function StateGallery() {
  return (
    <section className="zk-sec" data-reveal>
      <h2 className="zx-h2">كل حالة، لا الحالة السعيدة وحدها</h2>
      <p className="zk-sec-p">
        مسار الدفع الحقيقي يمكن أن ينتهي إلى <strong>تسع نهايات</strong>، ستّ منها تحويل
        وحالتان بطاقة خطأ. هذه هي، مقروءة من الملف لا مُتخيَّلة، ومعها الشرط الذي يُنتج
        كلًّا منها.
      </p>
      <ul className="zk-states">
        {STATES.map((s) => (
          <li key={s.name} className="zk-state">
            <div className="zk-state-h">
              <span style={{ color: "var(--violet)", display: "flex", flex: "0 0 auto" }}>{s.icon}</span>
              <h3 className="zk-state-n">{s.name}</h3>
              <span className="zk-tag">{s.tag}</span>
            </div>
            <p className="zk-state-p">{s.body}</p>
            <p className="zk-cond"><code><bdi dir="ltr">{s.cond}</bdi></code></p>
          </li>
        ))}

        {/* THE ERROR CARD, AND THE ADDRESS ON IT.
            The live card links to mailto:support@zenya.app, which is a THIRD
            address: not zenyaai@outlook.com, which lib/company.ts carries as
            SUPPORT_EMAIL and every legal page prints, and not
            support@zenyaai.co either. It is reported here and left alone in
            the live file, which is not this candidate's to edit. */}
        <li className="zk-state" data-flag>
          <div className="zk-state-h">
            <span style={{ color: "var(--violet)", display: "flex", flex: "0 0 auto" }}>
              <CircleAlert size={16} strokeWidth={2} aria-hidden />
            </span>
            <h3 className="zk-state-n">بطاقة الخطأ، وعنوان الدعم المكتوب عليها</h3>
            <span className="zk-tag">ملاحظة</span>
          </div>
          <p className="zk-state-p">
            بطاقة الخطأ هي الشيء الوحيد الذي يرسمه المسار الحقيقي على الإطلاق. زرّ الدعم
            فيها يشير إلى عنوان ثالث لا يطابق العنوان المعتمد في{" "}
            <bdi dir="ltr">lib/company.ts</bdi> ولا العنوان الظاهر في مواضع أخرى من الموقع.
          </p>
          <p className="zk-cond">
            <code><bdi dir="ltr">href=&quot;mailto:support@zenya.app&quot;</bdi></code>
          </p>
          <p className="zk-flag">
            <strong>العنوان المعتمد هو{" "}
            <bdi dir="ltr">{COMPANY.SUPPORT_EMAIL}</bdi></strong>. لم يُغيَّر الملف الحقيقي من
            هنا؛ هذه ملاحظة للمراجعة لا تعديل.
          </p>
        </li>
      </ul>
    </section>
  )
}
