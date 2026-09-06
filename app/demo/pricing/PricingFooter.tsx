/**
 * The footer for the candidate pricing page.
 *
 * SAME CONTENT AS THE DECK'S FOOTER, different container. The columns, the
 * claim, the address and the three brand marks are imported or copied from
 * app/demo/home/FooterSection.tsx rather than rewritten, because a second
 * footer that drifts from the first is worse than no footer. The brand marks
 * in particular are imported: redrawing an SVG logo by hand is how two
 * versions of a logo end up on one site.
 *
 * What is NOT reused is the container. That footer is a deck panel: it is one
 * of five screens, it sizes itself with .zn-fit, and its reveal is driven by
 * the deck's own "active" flag. None of that exists on a page that scrolls,
 * and dragging it across would have meant either breaking the deck or
 * carrying a dead animation flag. So this is the same footer's content in a
 * plain block that a scrolling page can end on.
 *
 * The claim is the one claim the site makes, and it is quoted exactly.
 */

import Link from "next/link"
import ZenyaMark from "@/components/ZenyaMark"
import { TikTokIcon, InstagramIcon, XIcon } from "../home/FooterSection"

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

export default function PricingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="zf" data-reveal>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* The mark over the footer, as the deck does it: large, at a whisper of
          opacity, so it reads as a watermark the panel rises in front of
          rather than a second logo competing with the one inside. */}
      <div className="zf-sig" aria-hidden>
        <ZenyaMark />
      </div>
      <div className="zf-inner">
        <div className="zf-cols">
          <div className="zf-brand">
            <Link href="/demo/home" aria-label="زينيا" className="zf-mark">
              <ZenyaMark className="zf-mark-svg" />
            </Link>
            <p className="zf-claim">
              أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي. اكتب نبذة عن
              نشاطك، واحصل على موقع مباشر بعنوانه الخاص.
            </p>
            <a className="zf-mail" href="mailto:support@zenyaai.co" dir="ltr">
              support@zenyaai.co
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.head} className="zf-col" aria-label={col.head}>
              <p className="zf-head">{col.head}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="zf-bottom">
          <div className="zf-social">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon />
              </a>
            ))}
          </div>
          <p className="zf-legal">
            © {year} زينيا. تُدار كمؤسسة فردية هولندية. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}

/* No backticks inside this literal: one would end it. */
const CSS = `
/* FULL BLEED, AND IT ENDS THE PAGE. The footer was a floating rounded card of
   the same obsidian, the same radius and nearly the same width as the
   comparison panel directly above it, so the page finished on two almost
   identical dark rectangles. It is a different KIND of object now: it runs
   edge to edge, its top corners are round and its bottom corners are square,
   and it sits flush against the bottom of the document. A cap, not another
   card.

   The negative inline margin is how it escapes the page's own gutter, which
   .zp-root applies as padding. calc on the same variable, so the two can
   never drift. */
.zf {
  position: relative;
  margin: clamp(3.5rem, 8vw, 6rem) calc(var(--gut) * -1) 0;
}
.zf-sig {
  display: flex;
  justify-content: center;
  opacity: 0.06;
  margin-bottom: -2.25rem;
  pointer-events: none;
}
.zf-sig svg { width: min(52%, 420px); height: auto; color: #171717; }
.zf-inner {
  position: relative;
  border-radius: var(--r-panel) var(--r-panel) 0 0;
  background: var(--onyx);
  padding: clamp(2.5rem, 4vw, 3.25rem) clamp(1.5rem, 4vw, 3.5rem) clamp(1.75rem, 3vw, 2.25rem);
}
.zf-cols {
  display: grid;
  grid-template-columns: 1.6fr repeat(3, minmax(0, 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem);
}
.zf-mark { display: inline-flex; }
.zf-mark-svg { height: 22px; color: #fafafa; }
.zf-claim { margin: 1rem 0 0; max-width: 30ch; font-size: 13.5px; font-weight: 500; line-height: 1.9; color: #a8a8b2; }
.zf-mail {
  display: inline-block; margin-top: 1rem;
  font-size: 13px; font-weight: 500; color: var(--violet-lift); text-decoration: none;
}
.zf-mail:hover { text-decoration: underline; text-underline-offset: 3px; }

.zf-head {
  margin: 0 0 0.875rem;
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: #7c7c88;
}
.zf-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.625rem; }
.zf-col a {
  font-size: 13.5px; font-weight: 500; line-height: 1.6;
  color: #d2d2da; text-decoration: none;
  transition: color 150ms var(--ease-out);
}
.zf-col a:hover { color: #fff; }

.zf-bottom {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
  margin-top: clamp(2rem, 4vw, 2.75rem);
  padding-top: 1.25rem;
  /* The one rule this page draws, and it is inside a panel rather than across
     the page. A footer's legal line is the one place a hairline is doing work
     rather than decorating. */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.zf-social { display: flex; align-items: center; gap: 0.375rem; }
.zf-social a {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 999px;
  color: #a8a8b2;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.zf-social a:hover { color: #fff; background: rgba(255, 255, 255, 0.07); }
.zf-social svg { width: 16px; height: 16px; }
.zf-legal { margin: 0; font-size: 12px; font-weight: 500; line-height: 1.7; color: #7c7c88; }

@media (max-width: 860px) {
  .zf-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .zf-brand { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .zf-cols { grid-template-columns: minmax(0, 1fr); gap: 1.75rem; }
  .zf-bottom { flex-direction: column; align-items: flex-start; }
}
`
