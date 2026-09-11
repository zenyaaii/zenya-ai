"use client"

/**
 * The candidate contact page. See page.tsx for why this route exists and
 * which live surface it restyles.
 *
 * THE ADDRESS COMES FIRST. A contact page opened on a phone is usually opened
 * by someone who wants to reach a person, not by someone who wants to fill in
 * a form: they already have a mail client and a dialler in their hand. So the
 * three real channels stand directly under the opening, above the form, and
 * the form is what is there for anyone who would rather type than switch
 * apps. On the live page the channels are a side column, which on a phone
 * means they land below a nine-field card and a 229px consent banner.
 *
 * AND THE PAGE SAYS WHO IT IS. Zenya is owned and operated by Musannef, a
 * Dutch eenmanszaak, and the register that says so is public. The KvK number
 * and the VAT status are printed on the page rather than buried in the legal
 * pages, because "who am I actually writing to" is a contact question. Every
 * one of those values is read from lib/company.ts, the single source the
 * privacy, terms, cookies and refund pages already share, so this page cannot
 * drift from them. The two facts that are NOT in that file, the telephone
 * number and Musannef's own address on the web, are declared once below and
 * marked as what they are.
 *
 * NOTHING HERE IS SUBMITTED. There is no fetch in this file. The form runs
 * the real rules, the zod schema in app/api/contact/route.ts and the two
 * checks app/(main)/contact/page.tsx runs before it posts, and then stops at
 * the door and says so, handing the reader to /contact. The precedent is
 * /demo/access and /demo/review: an honest edge beats a convincing dead end.
 *
 * THE ACCENT IS #5e6ad2 AND IT REPORTS THINGS. The channel marks, the drawn
 * rule under one word of the heading, the met counter, the required mark and
 * the primary action. Nothing else on the page is tinted, there is no wash,
 * and the one green on it is the 40px disc that reports a state.
 *
 * THE HEADER IS THE CANDIDATE SET'S, mechanic and all, and its observer
 * watches ".zf", which is the footer cap's real class.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Clock,
  Globe,
  Info,
  LifeBuoy,
  Mail,
  Menu,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import { z } from "zod"
import ZenyaMark from "@/components/ZenyaMark"
import SlideButton from "@/components/ui/SlideButton"
import { COMPANY } from "@/lib/company"
import PricingFooter from "../pricing/PricingFooter"
import { TikTokIcon, InstagramIcon, XIcon } from "../home/FooterSection"
import { CSS } from "./styles"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/* The candidate set links inside the candidate set, in the set's own order.
   تواصل points at this page, which is why it carries aria-current. */
const NAV: Array<{ href: string; label: string; here?: boolean }> = [
  { href: "/themes", label: "القوالب" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/contact", label: "تواصل", here: true },
]

/** The real channel this page is a proposal for. */
const REAL = "/contact"

/* ---------------------------------------------------------------------------
   THE FACTS.

   Everything the register card prints comes from lib/company.ts, which the
   privacy, terms, cookies, refund and subprocessors pages already read. Two
   values are not in it and are declared here instead of being invented:

   · The telephone number, given by the owner for this page. It belongs in
     lib/company.ts the day a live surface prints it too; putting it there now
     would change a module five legal pages render from, and this page is a
     restyle.
   · Musannef's own address on the web. lib/company.ts names the entity but
     carries no URL for it.

   No third number, no street, no opening hours and no support SLA beyond the
   one the live page already promises are printed anywhere on this page.
--------------------------------------------------------------------------- */
const PHONE_E164 = "+31684508903"
/** The same number, grouped for reading. Dutch mobile: country, 6, subscriber. */
const PHONE_READ = "+31 6 8450 8903"
const OWNER_SITE = "https://musannef.com"
const OWNER_SITE_LABEL = "musannef.com"
const SITE_LABEL = "zenyaai.co"

type Topic = "support" | "request" | "sales" | "review" | "other"

/* The five topics, their labels and their icons, taken from
   app/(main)/contact/page.tsx unchanged. The labels are the product's words
   and the icons are the ones a returning reader already recognises; a restyle
   that renames the choices is a content change wearing a design brief. */
const TOPICS: Array<{ id: Topic; label: string; icon: LucideIcon }> = [
  { id: "support", label: "الدعم", icon: LifeBuoy },
  { id: "request", label: "طلب قالب", icon: Sparkles },
  { id: "review", label: "مشاركة تجربة", icon: MessageSquareQuote },
  { id: "sales", label: "المبيعات", icon: Briefcase },
  { id: "other", label: "شيء آخر", icon: MessageCircle },
]

/** The paragraph the real channel prints on success, per topic, verbatim from
 *  TOPIC_SUCCESS in app/(main)/contact/page.tsx. Not rewritten: the words are
 *  the product's, and this page is restyling the moment, not rewording it. */
const TOPIC_SUCCESS: Record<Topic, string> = {
  support:
    "شكرًا لك — سنردّ خلال يوم عمل واحد، وغالبًا أسرع. تحقّق من مجلد البريد العشوائي إن لم تجد ردًّا.",
  request:
    "تمّ استلام طلبك. نراجع طلبات القوالب كل يوم اثنين ونرفع الفئات الأكثر طلبًا إلى أعلى خارطة الطريق. سنراسلك عند إطلاق قالبك.",
  sales:
    "شكرًا لك — سيتواصل معك أحد أعضاء الفريق خلال يوم عمل واحد لمناقشة احتياجاتك.",
  review:
    "شكرًا جزيلًا على مشاركتك تجربتك الصادقة! سنراجعها، وسنرسل إليك رمز خصم كشكرٍ على وقتك. رأيك يساعد مؤسّسين آخرين على الثقة بزينيا.",
  other: "شكرًا لك — تمّ استلام رسالتك. سنردّ عليك قريبًا.",
}

/* The rules the real flow runs, in the order it runs them.

   app/(main)/contact/page.tsx will not submit without an e-mail and a message
   (its button is disabled until both are present) and refuses a review with
   no stars, with the exact string quoted below. app/api/contact/route.ts is
   the only thing that states lengths: message min 5, max 8000, name optional
   up to 120. A demo whose rules are stricter or looser than the product's is
   testing a form the product does not have. */
const MIN_MESSAGE = 5
const MAX_MESSAGE = 8000
const MAX_NAME = 120
const NO_STARS = "يرجى اختيار عدد النجوم لتقييم تجربتك."
const BAD_EMAIL = "يرجى إدخال بريد إلكتروني صالح."
const SHORT_MESSAGE = "يرجى كتابة رسالتك، خمسة أحرف على الأقل."

const validateEmail = (v: string) => z.string().email().safeParse(v).success

/** The heading on the receipt, verbatim from the live success panel. */
const DONE_H = "تمّ استلام رسالتك."

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@zenyaai.co", Icon: TikTokIcon },
  { label: "Instagram", href: "https://www.instagram.com/zenyaai.co", Icon: InstagramIcon },
  { label: "X", href: "https://x.com/zenyaaico", Icon: XIcon },
]

export default function ContactView() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [onDark, setOnDark] = useState(false)

  const [topic, setTopic] = useState<Topic>("support")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  /** The door: set when every real rule passes. Nothing else changes. */
  const [handed, setHanded] = useState(false)
  /** The topic the receipt is for, frozen when the door opened, so changing
   *  the chips behind a finished receipt cannot rewrite what it says. */
  const [sentTopic, setSentTopic] = useState<Topic>("support")

  const rootRef = useRef<HTMLElement | null>(null)
  const headRef = useRef<HTMLElement | null>(null)

  /* Arrival. The hidden half lives under .zc-js so a browser that never runs
     the script reads a finished page rather than an invisible one. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduce) {
      targets.forEach((el) => el.setAttribute("data-in", "true"))
      return
    }
    root.classList.add("zc-js")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute("data-in", "true")
          io.unobserve(entry.target)
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* The header takes the ground it is standing on. Same mechanic as the five
     sibling pages: the band is the strip the pill occupies. The root ZoomLock
     writes CSS zoom, so a rect and a rootMargin are already in the same
     space; do not divide either by the zoom. It watches ".zf", which is the
     footer cap's real class. */
  useEffect(() => {
    const head = headRef.current
    const root = rootRef.current
    if (!head || !root) return
    let io: IntersectionObserver | null = null
    const live = new Set<Element>()
    const darks = Array.from(root.querySelectorAll<HTMLElement>(".zf"))
    const build = () => {
      io?.disconnect()
      live.clear()
      /* The first match in DOM order is whichever pill is hidden at this
         width, and a hidden element has a zero rect. Filter by height. */
      const pill = Array.from(head.querySelectorAll<HTMLElement>(".zc-pill, .zc-phone-pill"))
        .find((el) => el.getBoundingClientRect().height > 0)
      if (!pill) return
      const r = pill.getBoundingClientRect()
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)))
          setOnDark(live.size > 0)
        },
        { rootMargin: -r.top + "px 0px " + -(window.innerHeight - r.bottom) + "px 0px", threshold: 0 },
      )
      darks.forEach((el) => io!.observe(el))
    }
    build()
    window.addEventListener("resize", build)
    return () => { io?.disconnect(); window.removeEventListener("resize", build) }
  }, [])

  const pick = useCallback((id: Topic) => {
    setTopic(id)
    setError(null)
  }, [])

  /**
   * THE DOOR.
   *
   * The real flow validates, POSTs to /api/contact, and for a review also
   * POSTs to /api/reviews and /api/promo-codes. This one runs the same checks
   * in the same order, throws the same strings, and then stops. No row is
   * written, no mail is sent, and no reward code is shown, because a discount
   * the reader has not earned is the same class of lie as a fake success
   * message.
   */
  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (!validateEmail(email)) throw new Error(BAD_EMAIL)
      if (message.trim().length < MIN_MESSAGE) throw new Error(SHORT_MESSAGE)
      /* The live page refuses a review with no rating, and this form has no
         rating to give it. The action row has already turned into a link to
         the channel that does; this is the belt to that brace, so a keyboard
         submit cannot slip past it. */
      if (topic === "review") throw new Error(NO_STARS)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما.")
      return
    }
    setSentTopic(topic)
    setHanded(true)
  }

  const count = message.length
  const met = message.trim().length >= MIN_MESSAGE
  const near = count > MAX_MESSAGE - 400
  const isReview = topic === "review"

  return (
    <main className={"zc-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header ref={headRef} className={"zc-head " + plex.className} data-dark={onDark ? "true" : undefined}>
        <div className="zc-phone-pill" style={{ minWidth: menuOpen ? "min(86vw, 268px)" : "184px" }}>
          <div className="zc-phone-bar">
            <button type="button" className="zc-round" aria-expanded={menuOpen} aria-controls="zc-phone-menu"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
            <Link href="/" aria-label="زينيا" className="zc-phone-mark"><ZenyaMark className="zc-mark-svg-sm" /></Link>
            <Link href="/login?mode=signup" className="zc-account zc-account-phone">ابدأ</Link>
          </div>
          <div className="zc-drawer" data-open={menuOpen ? "true" : undefined}
            style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", visibility: menuOpen ? "visible" : "hidden" }}>
            <div className="zc-drawer-clip">
              <nav id="zc-phone-menu" className="zc-phone-menu">
                {NAV.map((i) => (
                  <Link key={i.href} href={i.href} className="zc-tray-row"
                    aria-current={i.here ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                    {i.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="zc-pill">
          <div className="zc-bar">
            <span className="zc-side zc-side-start">
              <Link href="/" className="zc-mark" aria-label="زينيا"><ZenyaMark className="zc-mark-svg" /></Link>
            </span>
            <nav className="zc-nav">
              {NAV.map((i) => (
                <Link key={i.href} href={i.href} className="zc-nav-item" aria-current={i.here ? "page" : undefined}>
                  {i.label}
                </Link>
              ))}
            </nav>
            <span className="zc-side zc-side-end">
              <span className="zc-sep" aria-hidden />
              <Link href="/login?mode=signup" className="zc-account">ابدأ</Link>
            </span>
          </div>
        </div>
      </header>

      <div className="zc-wrap">
        <section className="zc-open" data-reveal>
          <p className={"zc-eyebrow " + plex.className}>
            <span className="zc-eyebrow-dot" aria-hidden />
            تواصل معنا
          </p>
          <h1 className="zc-h1">
            أخبِرنا بما <span className="zc-h1-mark">تبنيه</span>.
          </h1>
          <p className="zc-lede">
            الدعم، أو طلبات القوالب، أو المبيعات، أو حتى مجرّد تحية. راسِلنا مباشرةً،
            أو اكتب لنا من هنا واختر موضوعك.
          </p>
          <p className="zc-promise">
            <Clock size={14} strokeWidth={2.25} aria-hidden />
            نردّ خلال يوم عمل واحد، ولمشتركي Pro الأولوية.
          </p>
        </section>

        {/* ---- the three real channels, above the form on every width ----- */}
        <section aria-label="طرق التواصل المباشر" data-reveal style={{ ["--i" as string]: "1" }}>
          <div className="zc-ch">
            <a className="zc-ch-row" href={"mailto:" + COMPANY.SUPPORT_EMAIL}>
              <span className="zc-ch-ico" aria-hidden><Mail size={17} strokeWidth={1.75} /></span>
              <span className="zc-ch-t">
                <span className="zc-ch-l">البريد الإلكتروني</span>
                <span className="zc-ch-v"><bdi dir="ltr">{COMPANY.SUPPORT_EMAIL}</bdi></span>
              </span>
              <span className="zc-ch-go" aria-hidden><ArrowUpRight size={16} strokeWidth={2} /></span>
            </a>
            <a className="zc-ch-row" href={"tel:" + PHONE_E164}>
              <span className="zc-ch-ico" aria-hidden><Phone size={17} strokeWidth={1.75} /></span>
              <span className="zc-ch-t">
                <span className="zc-ch-l">الهاتف</span>
                <span className="zc-ch-v"><bdi dir="ltr">{PHONE_READ}</bdi></span>
              </span>
              <span className="zc-ch-go" aria-hidden><ArrowUpRight size={16} strokeWidth={2} /></span>
            </a>
            <a className="zc-ch-row" href={COMPANY.WEBSITE_URL} target="_blank" rel="noopener noreferrer">
              <span className="zc-ch-ico" aria-hidden><Globe size={17} strokeWidth={1.75} /></span>
              <span className="zc-ch-t">
                <span className="zc-ch-l">الموقع</span>
                <span className="zc-ch-v"><bdi dir="ltr">{SITE_LABEL}</bdi></span>
              </span>
              <span className="zc-ch-go" aria-hidden><ArrowUpRight size={16} strokeWidth={2} /></span>
            </a>
          </div>
          <p className="zc-ch-note">
            البريد والهاتف يصلان إلى المالك مباشرةً. لا يوجد مركز اتصال ولا نظام تذاكر،
            وما يصل يُقرأ كما كُتب.
          </p>
        </section>

        <div className="zc-well">
          {/* ---- the form ------------------------------------------------- */}
          <section className="zc-card" aria-labelledby="zc-form-h" data-reveal style={{ ["--i" as string]: "2" }}>
            <Grow on={!handed}>
              <div>
                <p className="zc-topic-l" id="zc-form-h">ما موضوع رسالتك؟</p>
                <div className="zc-chips" role="radiogroup" aria-labelledby="zc-form-h">
                  {TOPICS.map((t) => {
                    const Icon = t.icon
                    const on = topic === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        tabIndex={on ? 0 : -1}
                        className="zc-chip"
                        data-on={on ? "true" : undefined}
                        onClick={() => pick(t.id)}
                        onKeyDown={(e) => {
                          /* Arrows move a radiogroup. In RTL the physical left
                             key is the NEXT chip, which is why the two are
                             swapped against their Latin meaning here. */
                          const i = TOPICS.findIndex((x) => x.id === topic)
                          let next = -1
                          if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = (i + 1) % TOPICS.length
                          else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = (i - 1 + TOPICS.length) % TOPICS.length
                          if (next < 0) return
                          e.preventDefault()
                          pick(TOPICS[next].id)
                          const btns = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(".zc-chip")
                          btns?.[next]?.focus()
                        }}
                      >
                        <Icon size={14} strokeWidth={2.25} aria-hidden />
                        {t.label}
                      </button>
                    )
                  })}
                </div>

                {/* The one topic this form cannot carry, and where it goes. */}
                <Grow on={isReview}>
                  <div className="zc-hand">
                    <MessageSquareQuote size={14} strokeWidth={2.25} aria-hidden />
                    <p>
                      القناة الحقيقية ترفض مراجعة بلا نجوم، وتقول ذلك بهذه الكلمات:
                      «{NO_STARS}» لذلك تُكتب المراجعة حيث تُختار النجوم أولًا، في{" "}
                      <Link href="/review" className="zc-link">قناة التقييم</Link>.
                    </p>
                  </div>
                </Grow>

                <div className="zc-rule" aria-hidden />

                <form className="zc-form" onSubmit={submit} noValidate>
                  <div className="zc-pair">
                    <Field id="zc-name" label="الاسم" hint="اختياري">
                      <input id="zc-name" className="zc-in" type="text" value={name} autoComplete="name"
                        maxLength={MAX_NAME} placeholder="كما تحبّ أن نناديك"
                        onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <Field id="zc-email" label="البريد الإلكتروني" required>
                      <input id="zc-email" className="zc-in zc-ltr" type="email" value={email} autoComplete="email"
                        dir="ltr" placeholder="name@company.com"
                        onChange={(e) => setEmail(e.target.value)} />
                    </Field>
                  </div>

                  <Field id="zc-message" label="الرسالة" required>
                    <textarea id="zc-message" className="zc-in zc-area" value={message} maxLength={MAX_MESSAGE}
                      placeholder={
                        topic === "request"
                          ? "أي نوع من قوالب الأعمال سيساعد عملك؟ كن محدّدًا: «قالب صالون حلاقة» أفضل من «قالب خدمات»."
                          : topic === "sales"
                          ? "ما حجم نشاطك، وما الذي تحتاجه من زينيا؟"
                          : "أخبرنا قليلًا عمّا تحتاجه."
                      }
                      onChange={(e) => setMessage(e.target.value)} />
                    <p className="zc-count" data-met={met ? "true" : undefined} data-near={near ? "true" : undefined}>
                      <span>يصلنا نصّك كما كتبته.</span>
                      <span className="zc-count-n" dir="ltr">{count} / {MAX_MESSAGE}</span>
                    </p>
                  </Field>

                  <div className="zc-status" role="status" aria-live="polite">
                    {error ? <p className="zc-err">{error}</p> : null}
                  </div>

                  <div className="zc-go">
                    {isReview ? (
                      <SlideButton href="/review" variant="violet" slide="اختر نجومك هناك">
                        إلى قناة التقييم
                      </SlideButton>
                    ) : (
                      <SlideButton type="submit" variant="violet" slide="راجِع قبل الإرسال">
                        أرسل الرسالة
                      </SlideButton>
                    )}
                    <p className="zc-go-note">
                      نستخدم بريدك للردّ عليك فقط. لا قوائم بريدية، ولا مشاركة مع طرف ثالث.
                    </p>
                  </div>
                </form>
              </div>
            </Grow>

            <Grow on={handed}>
              {handed ? (
                <Receipt
                  topic={sentTopic}
                  email={email}
                  message={message}
                  onBack={() => setHanded(false)}
                />
              ) : null}
            </Grow>
          </section>

          {/* ---- who you are writing to ----------------------------------- */}
          <aside className="zc-aside">
            <section className="zc-note-card" aria-labelledby="zc-reg-h" data-reveal style={{ ["--i" as string]: "3" }}>
              <p className="zc-note-head" id="zc-reg-h">
                <Building2 size={15} strokeWidth={2} aria-hidden />
                الجهة التي تراسلها
              </p>

              <a className="zc-owner" href={OWNER_SITE} target="_blank" rel="noopener noreferrer">
                <span className="zc-owner-badge" aria-hidden>M</span>
                <span className="zc-owner-t">
                  <span className="zc-owner-n">
                    <bdi dir="ltr">{OWNER_SITE_LABEL}</bdi>
                    <ArrowUpRight size={13} strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="zc-owner-r">المالك الكامل لزينيا</span>
                </span>
              </a>

              <dl className="zc-reg">
                <dt>الاسم القانوني</dt>
                <dd><bdi dir="ltr">{COMPANY.LEGAL_NAME}</bdi></dd>
                <dt>الشكل القانوني</dt>
                <dd>{COMPANY.ENTITY_TYPE}</dd>
                <dt>رقم الغرفة التجارية (KvK)</dt>
                <dd><bdi dir="ltr">{COMPANY.KVK_NUMBER}</bdi></dd>
                <dt>الرقم الضريبي (BTW)</dt>
                <dd className="zc-reg-pending">{COMPANY.VAT_NUMBER}</dd>
                <dt>الدولة</dt>
                <dd>{COMPANY.COUNTRY}</dd>
              </dl>

              <p className="zc-note-b" style={{ marginTop: "1rem" }}>
                زينيا منتج تملكه وتشغّله {COMPANY.LEGAL_NAME}. العنوان المسجَّل كامل متاح في
                السجل العام للغرفة التجارية الهولندية برقم KvK أعلاه، أو بطلب خطّي على البريد
                نفسه.
              </p>
            </section>

            <section className="zc-note-card" aria-labelledby="zc-soc-h" data-reveal style={{ ["--i" as string]: "4" }}>
              <p className="zc-note-head" id="zc-soc-h">
                <Globe size={15} strokeWidth={2} aria-hidden />
                على المنصّات
              </p>
              <p className="zc-note-b">
                نحن على ثلاث منصّات فقط، والحسابات الثلاثة هي الوحيدة الرسمية.
                أي حساب آخر باسم زينيا ليس منّا.
              </p>
              <div className="zc-soc">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon />
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <p className="zc-foot-note">
          صفحة تصميم مُقترحة. النموذج يتحقق من مدخلاتك بالقواعد الحقيقية، لكنه لا يرسل رسالتك ولا
          يحفظها في أي مكان.{" "}
          <Link href={REAL} className="zc-link">راسِلنا فعليًا من هنا</Link>، أو استخدم البريد
          والهاتف في الأعلى.
        </p>
      </div>

      <PricingFooter />
    </main>
  )
}

/* -------------------------------------------------------------------------
   A slot that grows, and the timer that un-clips it.

   A TIMER, NOT transitionend. transitionend is not guaranteed to arrive, and
   the case that matters is not an edge one: under prefers-reduced-motion the
   transition is none, so the event never fires at all and the clip would stay
   on for ever, slicing the 4px focus halo off every field inside it for
   exactly the readers least able to afford a missing focus ring. It also
   bubbles, so a nested transition finishing would clear the flag early. One
   timer, slightly longer than the 440ms transition, has none of those
   problems. Recorded on /demo/access, kept on /demo/review, kept here.
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
    <div className="zc-grow" data-on={on ? "true" : undefined} data-moving={moving ? "true" : undefined}>
      <div className="zc-grow-clip">{children}</div>
    </div>
  )
}

/** Label ABOVE the input: the placeholder is a hint, never the field's name. */
function Field({
  id, label, required, hint, children,
}: { id: string; label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="zc-f">
      <label className="zc-lab" htmlFor={id}>
        {label}
        {required ? <span className="zc-req" aria-hidden>*</span> : null}
        {hint ? <span className="zc-opt">{hint}</span> : null}
      </label>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------
   THE RECEIPT.

   The live panel is a green disc, a tracked heading and the topic's
   paragraph. Two of those three are style problems and the third is the good
   part, so the paragraph stays exactly as the product writes it and the rest
   is rebuilt: the success hue is the triad's #15803d at 4.81:1 and it colours
   only the mark, the heading carries no tracking, and the message the reader
   typed is read back to them, because a confirmation that does not show what
   it received is a picture of a confirmation.

   WHAT IT DOES NOT DO is claim any of it happened. The strip at the foot says
   so in place rather than in a footnote three sections down, because a
   receipt that reads as real IS the thing that would mislead, and it is
   exactly the screen being designed here.
------------------------------------------------------------------------- */
function Receipt({
  topic, email, message, onBack,
}: { topic: Topic; email: string; message: string; onBack: () => void }) {
  const label = TOPICS.find((t) => t.id === topic)?.label ?? ""
  return (
    <div className="zc-done">
      <span className="zc-tick" style={{ ["--i" as string]: "0" }} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" focusable="false">
          <path className="zc-tick-p" d="M5 12.6l4.6 4.6L19 7.8" stroke="currentColor" strokeWidth={2.4}
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h2 className="zc-done-h" style={{ ["--i" as string]: "1" }}>{DONE_H}</h2>

      <p className="zc-done-b" style={{ ["--i" as string]: "2" }}>{TOPIC_SUCCESS[topic]}</p>

      <div className="zc-slip" style={{ ["--i" as string]: "3" }}>
        <dl>
          <dt>الموضوع</dt>
          <dd>{label}</dd>
          <dt>الردّ إلى</dt>
          <dd><bdi dir="ltr">{email}</bdi></dd>
          <dt>رسالتك</dt>
          <dd className="zc-slip-msg">{message}</dd>
        </dl>
      </div>

      <div className="zc-demo" style={{ ["--i" as string]: "4" }}>
        <Info size={14} strokeWidth={2.25} aria-hidden />
        <p>
          ما سبق هو شكل الرسالة الحقيقية. أمّا هنا فلم تُرسَل رسالتك ولم تُحفظ، فهذه صفحة تصميم
          مُقترحة لا تتصل بأي خادم.
        </p>
      </div>

      <div className="zc-done-go" style={{ ["--i" as string]: "5" }}>
        <SlideButton href={REAL} variant="violet" slide="إلى القناة الحقيقية">
          أرسِلها فعليًا
        </SlideButton>
        <button type="button" className="zc-quiet" onClick={onBack}>العودة إلى النموذج</button>
      </div>
    </div>
  )
}
