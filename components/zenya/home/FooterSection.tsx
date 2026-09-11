"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ZenyaMark from "@/components/ZenyaMark"
import { useFit } from "./runner"

/* ─────────────────────────────────────────────────────────────────────────
   Section five: the close.

   The deck has no free scrolling, so a footer on this page is either a whole
   screen or it does not exist. This is the whole screen — the fifth panel of
   the same deck, one more gesture down from انشر.

   ── IT IS NOT A FOURTH WORD. ابن، ادر، انشر are the three the hero cycles
   and there is no fourth; this screen is where the page comes to rest rather
   than another step in the argument. So it carries no display word behind it,
   no device, no cursor and no script: it is a surface with the real pages on
   it, and every link on it goes somewhere that exists.

   ── THE GROUND IS OBSIDIAN, the same #131316 ادر stands on, and the reason
   is measured. Evergreen to obsidian is 34 units at its widest channel, which
   is the same step انشر hides in 2.2% of a panel — a ramp short enough to
   finish above the header pill. Coming back to paper is a 231-unit step, and
   a ramp long enough to hide that puts a band of light under the pill unless
   there is a light in the band to explain it. ادر has one. This screen has
   none, and inventing one to buy a paper ground would be adding colour to the
   page for the sake of a transition.

   ── NOTHING HERE IS INVENTED. Every route was checked against the app tree,
   the address is the one the product already answers on, the company line is
   the one the real footer carries, and the sentence in the brand column is
   the page's single claim rather than a second one written for the footer.
   ───────────────────────────────────────────────────────────────────────── */

/* The three marks the real footer carries, redrawn here rather than imported:
   components/Footer.tsx is a client module that also pulls in the consent
   dialog, the language switcher and the aurora palette, none of which this
   page has any use for. */
export function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
    </svg>
  )
}
export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}
export function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/* The columns. Every href was checked against the app tree; nothing here
   points at a page that has not been built. */
const COLUMNS: Array<{ head: string; links: Array<{ href: string; label: string }> }> = [
  {
    head: "المنتج",
    links: [
      { href: "/themes", label: "تصفّح القوالب" },
      { href: "/features", label: "الميزات" },
      { href: "/websites", label: "أنواع المواقع" },
      { href: "/pricing", label: "الأسعار" },
      { href: "/compare", label: "المقارنات" },
    ],
  },
  {
    head: "الشركة",
    links: [
      { href: "/about", label: "من نحن" },
      { href: "/faq", label: "الأسئلة الشائعة" },
      { href: "/contact", label: "تواصل معنا" },
    ],
  },
  {
    head: "قانوني",
    links: [
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
      { href: "/cookies", label: "ملفات الارتباط" },
      { href: "/refund", label: "الاسترجاع" },
      { href: "/subprocessors", label: "المعالِجون الفرعيون" },
    ],
  },
]

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@zenyaai.co", Icon: TikTokIcon },
  { label: "Instagram", href: "https://www.instagram.com/zenyaai.co", Icon: InstagramIcon },
  { label: "X", href: "https://x.com/zenyaaico", Icon: XIcon },
]

export default function FooterSection({
  active,
  uiClass,
}: {
  active: boolean
  uiClass: string
}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const fitRef = useRef<HTMLDivElement | null>(null)

  /* The same fit pass the other three sections use: the card is laid out at
     its natural size, measured, and scaled by whatever ratio makes it sit
     inside the screen. Four columns and a bottom bar is the tallest thing on
     this deck on a phone, and nothing on this page is ever cut. */
  useFit(stageRef, fitRef, [])

  /* Formatted at render rather than at module load: the Node build here ships
     a small ICU and answers with a different digit than a browser with a full
     one, which is the trap section three already records. */
  const year = new Date().getFullYear()

  return (
    <div className={`${uiClass} zn-close`} dir="rtl" ref={stageRef}>
      <div className="zn-closebox">
        <div className="zn-fit" ref={fitRef}>
          {/* data-run carries the ARRIVAL, so at rest there is no attribute at
              all and the card is already in its finished state. A browser that
              never runs the animation still reads a complete footer. */}
          <div className="zn5-stack" data-run={active || undefined}>
          {/* The signature. Every other screen on this deck stands a display
              word behind its object; this one has no fourth word, so what
              stands behind it is the name. It says nothing and argues nothing
              — which is the only thing this screen is entitled to do — and it
              is the real footer's own device, where the mark is stretched
              across the foot of the page. Without it the card floats in the
              middle of an empty screen and reads as a card rather than as the
              end of something. */}
          <div className="zn5-sig" aria-hidden style={{ "--d": 0 } as React.CSSProperties}>
            <ZenyaMark />
          </div>

          <footer className="zn5-card">
            {/* The light on the card, which is the one thing the reference
                composition and this page's own dark sections already agree on:
                a surface on a dark ground is lit from above. Painted as a wash
                on its own layer rather than into the background, so the card
                keeps the hairline material ادر settled on. */}
            <span className="zn5-sheen" aria-hidden />

            <div className="zn5-body">
              <div className="zn5-cols">
                <div className="zn5-brand" style={{ "--d": 1 } as React.CSSProperties}>
                  <Link href="/?home=1" aria-label="زينيا" className="zn5-mark">
                    <ZenyaMark className="h-[22px]" />
                  </Link>

                  {/* The page's ONE claim, not a second one written for the
                      foot of it. Nothing else on this page argues, and the
                      footer is not the place to start. */}
                  <p className="zn5-claim">
                    أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي. اكتب نبذة عن
                    نشاطك، واحصل على موقع مباشر بعنوانه الخاص.
                  </p>

                  <Link href="/build" className="zn5-cta">
                    <span>ابدأ الإنشاء</span>
                    <ArrowLeft className="ic" strokeWidth={1.6} aria-hidden />
                  </Link>

                  <a className="zn5-mail" href="mailto:support@zenyaai.co" dir="ltr">
                    support@zenyaai.co
                  </a>
                </div>

                {COLUMNS.map((col, i) => (
                  <div key={col.head} className="zn5-col" style={{ "--d": i + 2 } as React.CSSProperties}>
                    {/* No tracking on the heading. The reference letter-spaces
                        its uppercase labels; Arabic has no upper case and its
                        letters connect, so tracking a heading here pulls the
                        joins apart — the hero's own rule, arriving at a
                        twelve-pixel label. */}
                    <h3>{col.head}</h3>
                    <ul>
                      {col.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href}>{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="zn5-bottom" style={{ "--d": 5 } as React.CSSProperties}>
                <div className="zn5-social">
                  {SOCIALS.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
                <p className="zn5-legal">
                  © {year} زينيا. تُدار كمؤسسة فردية هولندية. جميع الحقوق محفوظة.
                </p>
              </div>
            </div>
          </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
