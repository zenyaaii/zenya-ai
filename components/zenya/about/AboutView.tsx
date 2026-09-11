"use client"

/**
 * The candidate about page. See page.tsx for why this route exists and which
 * live surface it restyles.
 *
 * THE COPY IS THE LIVE COPY. Every Arabic and English sentence here is the
 * sentence app/(main)/about/page.tsx already ships, moved without a word
 * changed. The em-dashes in it are inherited and left alone; nothing this
 * file authors introduces one.
 *
 * WHAT MOVED, AND WHY. The live page ends with its call to action: measured
 * at 390 the first one sits 2362px down, which is nearly three viewports and
 * well below the 229px consent banner. It is the first thing under the lede
 * here, which is the same answer /demo/contact reached for its channels.
 *
 * THE KvK NUMBER IS READ, NOT RETYPED. The live paragraph hardcodes
 * "KvK رقم 42070030" while lib/company.ts already carries KVK_NUMBER. Same
 * visible sentence, one source, so the about page cannot drift from the five
 * legal pages.
 *
 * ONE ACCENT. #5e6ad2 for marks and #4f5ab8 for runs of text, and nothing
 * else is tinted. The live page's four pillar tiles use three hues, two of
 * which (#d97706 amber, #27a644 green) are the status triad spent on a list
 * of product claims that reports no state at all.
 */

import { useEffect, useRef } from "react"
import Link from "next/link"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import SlideButton from "@/components/ui/SlideButton"
import { COMPANY } from "@/lib/company"
import Header, { useOnDark } from "@/components/zenya/chrome/Header"
import { CHROME_CSS } from "@/components/zenya/chrome/tokens"
import { MARKETING_CSS } from "@/components/zenya/chrome/marketing"
import PricingFooter from "../pricing/PricingFooter"
import { CSS } from "./styles"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

/** The live page's four differentiators, titles and descriptions unchanged.
 *  What is gone is the per-item `color`, which painted three hues across a
 *  list that reports no state. */
const PILLARS = [
  {
    title: "ثمانية قوالب لكل نشاط",
    desc: "مطعم، لوك بوك أزياء، صفحة هبوط لتطبيق، قصة علامة تجارية، مركز عافية، خدمات، متجر بمنتجات متعددة، ومتجر بمنتج واحد. قالب لكل نوع نشاط — لا قالب واحد يحاول أن يناسب الجميع.",
  },
  {
    title: "من الفكرة إلى موقع خلال دقائق",
    desc: "اكتب نبذة قصيرة عن نشاطك، ويتكفّل الذكاء الاصطناعي بكتابة المحتوى واختيار التصميم وترتيب الأقسام. لا حاجة لبرمجة، ولا لمصمّم، ولا لأسابيع من الانتظار.",
  },
  {
    title: "عربية أولًا، حقيقية",
    desc: "زينيا مبنية للسوق العربي — محتوى بلغة عربية سليمة، وتخطيط من اليمين إلى اليسار، وخطوط مصمّمة للعربية. ليست ترجمة لاحقة، بل تصميم عربيّ من الأساس.",
  },
  {
    title: "استضافة أوروبية متوافقة مع GDPR",
    desc: "تُستضاف مواقعك وبياناتك داخل الاتحاد الأوروبي، مع شهادة SSL تلقائية وحماية للخصوصية. أساس موثوق لعلامتك التجارية.",
  },
] as const

/** The live page's four principles, verbatim. */
const VALUES = [
  "الصدق قبل كل شيء — لا أرقام وهمية ولا تقييمات مُختلَقة. ما نعرضه حقيقي أو لا نعرضه.",
  "الجودة ليست رفاهية — كل قالب مبنيّ ليبدو احترافيًا ويبيع، لا مجرّد صفحة جميلة.",
  "في متناول الجميع — أدوات بمستوى الوكالات، بسعر يقدر عليه أي نشاط تجاري ناشئ.",
  "خصوصيتك ملكك — استضافة وبيانات داخل الاتحاد الأوروبي، وامتثال كامل للـ GDPR.",
] as const

const REAL = "/about"

export default function AboutView() {
  const rootRef = useRef<HTMLElement | null>(null)
  const { headRef, onDark } = useOnDark(rootRef)

  /* Arrival. The hidden half lives under .zx-js so a browser that never runs
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
    root.classList.add("zx-js")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.setAttribute("data-in", "true")
          io.unobserve(e.target)
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main className={"zx-root " + tajawal.className} dir="rtl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CHROME_CSS + MARKETING_CSS + CSS }} />
      <Header headRef={headRef} onDark={onDark} uiClass={plex.className} />

      <div className="zx-wrap">
        {/* 1. THE OPENING. Four text elements, which is the cap: eyebrow,
            headline, lede, actions. Left-aligned, and the actions are here
            rather than three viewports down. */}
        <section className="zx-open" data-reveal>
          <p className={"zx-eyebrow " + plex.className}>
            <span className="zx-eyebrow-dot" aria-hidden />
            من نحن
          </p>
          <h1 className="zx-h1">
            نُحوّل فكرتك إلى <span className="zx-h1-mark">موقع احترافي.</span>
          </h1>
          {/* THE FULL LEDE, NOT A TRIMMED ONE. It runs to about 35 words,
              where the skill caps hero subtext at 20, and an earlier draft of
              this page quietly cut the second sentence to meet that. Cutting
              the product's own copy is not a restyle. So the sentence is back
              and the design absorbs the length instead: the lede is set a
              step smaller than the other candidates' and the actions still
              measure inside the first viewport at 360, 390 and 430. That the
              copy is over the cap is a finding for the owner, not an edit to
              make on his behalf. */}
          <p className="zx-lede">
            زينيا <strong>أوّل شركة إسلامية</strong> لإنشاء المواقع بالذكاء الاصطناعي — منصّة عربية
            لكل نشاط تجاري. نؤمن أن كل نشاط — مهما كان صغيرًا — يستحقّ موقعًا يبدو احترافيًا ويكسب
            ثقة العملاء، دون أن يدفع آلاف الدولارات لوكالة أو ينتظر أسابيع.
          </p>
          <div className="zx-acts">
            <SlideButton href="/login?mode=signup">ابدأ الإنشاء مجانًا</SlideButton>
            <Link href="/themes" className="zx-act-2">شاهد القوالب الثمانية</Link>
          </div>
        </section>

        {/* 2. THE STORY. An editorial column, used once on this page. */}
        <section className="zx-story" data-reveal>
          <h2 className="zx-h2">قصتنا</h2>
          <p className="zx-p zx-p-lead">
            بدأت زينيا من ملاحظة بسيطة: أصحاب الأنشطة التجارية الصغيرة في العالم العربي أمام
            خيارَين سيّئَين — إمّا موقع يبدو مبنيًا بالهواة يُبعد العملاء، أو فاتورة وكالة باهظة
            وأسابيع من التعديلات. أردنا خيارًا ثالثًا: مواقع بجودة الوكالات، بسرعة الذكاء
            الاصطناعي، وبسعر في متناول أي نشاط.
          </p>
          <p className="zx-p">
            اليوم، لم نعد نصنع قالبًا واحدًا. صرنا نصنع <strong>ثمانية قوالب</strong> — واحدًا لكل
            نوع نشاط تجاري — كلٌّ منها مبنيّ حول ما يحتاجه ذلك النشاط فعلًا لتحويل الزائر إلى
            عميل. تكتب نبذة، ويكتب الذكاء الاصطناعي الباقي.
          </p>
        </section>

        {/* 3. WHAT DISTINGUISHES US. An indexed list, not the live page's
            two-by-two grid of four equal cards in three hues. */}
        <section className="zx-pillars zx-wide" data-reveal>
          <h2 className="zx-h2">ما الذي يميّزنا</h2>
          <ol className="zx-plist">
            {PILLARS.map((p, i) => (
              <li className="zx-pitem" key={p.title}>
                <span className="zx-pnum" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="zx-ptitle">{p.title}</h3>
                <p className="zx-pdesc">{p.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. PRINCIPLES. A hanging-mark rhythm, no card and no green discs. */}
        <section className="zx-values" data-reveal>
          <h2 className="zx-h2">مبادئنا</h2>
          <ul className="zx-vlist">
            {VALUES.map((v) => (
              <li className="zx-vitem" key={v}>
                <span className="zx-vmark" aria-hidden />
                <span className="zx-vtext">{v}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. WHO IS BEHIND IT. A record card: the live paragraph, unchanged,
            with the KvK number read from lib/company.ts rather than retyped
            into the sentence. */}
        <section className="zx-who" data-reveal>
          <h2 className="zx-h2">من يقف خلف زينيا</h2>
          <div className="zx-record">
            <p className="zx-p">
              زينيا هي <strong>أوّل شركة إسلامية</strong> متخصّصة في بناء المواقع بالذكاء الاصطناعي.
              تُشغّلها <strong>{COMPANY.LEGAL_NAME}</strong>، مؤسسة فردية مسجّلة في هولندا لدى الغرفة
              التجارية الهولندية (KvK رقم <bdi dir="ltr">{COMPANY.KVK_NUMBER}</bdi>). هذا يعني بنية
              أوروبية موثوقة لاستضافة مواقعك وحماية بياناتك، مع التزام كامل بلوائح حماية البيانات
              الأوروبية.
            </p>
          </div>
        </section>

        {/* 6. THE ENGLISH MIRROR. Crawlable LTR content the live page earns
            traffic with, so it stays. Quieter, and opened by a hairline. */}
        <section className="zx-mirror" dir="ltr" data-reveal>
            <p className={"zx-eyebrow " + plex.className}>
              <span className="zx-eyebrow-dot" aria-hidden />
              About Zenya (English)
            </p>
            <h2>We turn your idea into a professional website.</h2>
            <p>
              Zenya is the <strong>first Muslim company</strong> to build AI websites — an AI
              website builder made for the Arab market. We believe every business — no matter how
              small — deserves a site that looks professional and earns customer trust, without
              paying thousands to an agency or waiting weeks. You write a short brief; our AI
              writes the copy, picks the design, and lays out the sections.
            </p>
            <p>
              Instead of one generic template, Zenya ships <strong>eight templates</strong> — one
              per business type: restaurant, fashion lookbook, app landing page, brand story,
              wellness center, services, multi-product store, and single-product storefront. Each
              is built around what that business actually needs to convert visitors into
              customers. Content is Arabic-first and right-to-left by design, and every site is
              hosted in the EU with automatic SSL and full GDPR compliance.
            </p>
            <p>
              Zenya is the first Muslim company dedicated to building AI websites. It is operated
              by <strong>{COMPANY.LEGAL_NAME}</strong>, a Dutch sole proprietorship registered
              with the Netherlands Chamber of Commerce (KvK no.{" "}
              <bdi dir="ltr">{COMPANY.KVK_NUMBER}</bdi>).
            </p>
            {/* The live mirror ends with these two, and an earlier draft of
                this page dropped them along with the Arabic call to action it
                had moved into the hero. Dropping a section is an edit, not a
                restyle, so they are back. The label is the one the Arabic
                half uses, translated as the live page translates it, which is
                the skill's one-label-per-intent rule rather than a second
                intent. */}
            <div className="zx-acts zx-acts-en">
              <SlideButton href="/login?mode=signup">Start building free</SlideButton>
              <Link href="/pricing" className="zx-act-2">See pricing</Link>
            </div>
        </section>

        <p className="zx-foot-note">
          صفحة تصميم مُقترحة لـ <Link href={REAL} className="zx-link"><bdi dir="ltr">{REAL}</bdi></Link>.
          النص هو نص الصفحة الحيّة كما هو؛ ما تغيّر هو شكله وحده.
        </p>
      </div>

      <PricingFooter />
    </main>
  )
}
