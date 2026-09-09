"use client"

/**
 * The candidate FAQ page. See page.tsx for why this route exists and which
 * live surface it restyles.
 *
 * THE QUESTIONS ARE THE LIVE QUESTIONS. Both lists are imported straight from
 * app/(main)/faq/faq-data, the module the live page already reads, so the
 * eleven Arabic and eleven English entries cannot drift from it and no
 * sentence was retyped. The em-dashes inside them are inherited and left
 * alone; nothing this file authors introduces one.
 *
 * WHAT CHANGED IS THE MECHANISM, NOT THE CONTENT. The live page opens its
 * answers with @radix-ui/react-accordion, which needs JavaScript, and wraps
 * the whole thing in framer-motion blocks that are server-rendered with
 * style="opacity:0". With JavaScript disabled that leaves 827 characters of
 * an eleven-question FAQ reachable. These are native details/summary: they
 * open with no script, keep keyboard and screen-reader behaviour for free,
 * and rest in their finished state.
 *
 * THE PRIMARY ACTION MOVED INTO THE FIRST SCREEN, for the reason /demo/about
 * and /demo/contact both moved theirs: measured at 390 the live page's call
 * to action sits 1846px down, below the 229px consent banner.
 */

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google"
import SlideButton from "@/components/ui/SlideButton"
import { AR_FAQS, EN_FAQS, type QA } from "@/app/(main)/faq/faq-data"
import Header, { useOnDark } from "../_chrome/Header"
import { CHROME_CSS } from "../_chrome/tokens"
import { MARKETING_CSS } from "../_chrome/marketing"
import PricingFooter from "../pricing/PricingFooter"
import { CSS } from "./styles"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "900"], display: "swap" })
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], display: "swap" })

const REAL = "/faq"

/** One question. A native disclosure, so it works with no script at all. */
function Question({ item, id }: { item: QA; id: string }) {
  return (
    <details className="zx-q" name={id}>
      <summary className="zx-qsum">
        <span>{item.q}</span>
        <ChevronDown className="zx-qchev" size={17} strokeWidth={2} aria-hidden />
      </summary>
      <div className="zx-qa">{item.a}</div>
    </details>
  )
}

export default function FaqView() {
  const rootRef = useRef<HTMLElement | null>(null)
  const { headRef, onDark } = useOnDark(rootRef)

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
        <section className="zx-open" data-reveal>
          <p className={"zx-eyebrow " + plex.className}>
            <span className="zx-eyebrow-dot" aria-hidden />
            الأسئلة الشائعة
          </p>
          <h1 className="zx-h1">
            أسئلة <span className="zx-h1-mark">وأجوبة.</span>
          </h1>
          <p className="zx-lede">
            كل ما تحتاج معرفته عن زينيا. لم تجد سؤالك؟{" "}
            <Link href="/demo/contact">تواصل معنا</Link>.
          </p>
          <div className="zx-acts">
            <SlideButton href="/demo/access?mode=signup">ابدأ الإنشاء مجانًا</SlideButton>
          </div>
        </section>

        {/* The eleven Arabic questions, from the live data module. */}
        <section className="zx-qs" data-reveal>
          {AR_FAQS.map((item, i) => (
            <Question key={item.q} item={item} id={"ar-" + i} />
          ))}
        </section>

        {/* The English mirror. Crawlable LTR content the live page earns
            traffic with, so it stays: same eleven questions, same mechanism,
            a quieter scale and a hairline above it. */}
        <section className="zx-mirror" dir="ltr" data-reveal>
          <p className={"zx-eyebrow " + plex.className}>
            <span className="zx-eyebrow-dot" aria-hidden />
            FAQ (English)
          </p>
          <h2>Frequently asked questions</h2>
          <div className="zx-qs">
            {EN_FAQS.map((item, i) => (
              <Question key={item.q} item={item} id={"en-" + i} />
            ))}
          </div>
        </section>

        {/* THE CLOSING BLOCK IS THE LIVE PAGE'S, RESTORED. An earlier draft
            of this page moved the call to action into the hero and dropped
            this section with it, which deletes two runs of the product's own
            copy. Both are back. The action carries the same label as the
            hero's, which is what the skill's one-label-per-intent rule asks
            for: it bans two different labels for one intent, not the same
            label appearing where a long page needs it. */}
        <section className="zx-close" data-reveal>
          <h2 className="zx-h2">جاهز لتجربة زينيا؟</h2>
          <p className="zx-p">ابدأ مجانًا — بلا بطاقة ائتمان.</p>
          <div className="zx-acts">
            <SlideButton href="/demo/access?mode=signup">ابدأ الإنشاء مجانًا</SlideButton>
          </div>
        </section>

        <p className="zx-foot-note">
          صفحة تصميم مُقترحة لـ <Link href={REAL} className="zx-link"><bdi dir="ltr">{REAL}</bdi></Link>.
          الأسئلة والأجوبة هي نفسها المنشورة على الصفحة الحيّة؛ ما تغيّر هو شكلها وطريقة فتحها.
        </p>
      </div>

      <PricingFooter />
    </main>
  )
}
