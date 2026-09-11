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
import SlideButton from "@/components/ui/SlideButton"
import ZenyaMark from "@/components/ZenyaMark"
import { COMPANY } from "@/lib/company"
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
      {/* The mark lives INSIDE the cap, as the deck does it: large, paper
          coloured, at a whisper of opacity, so the card below rises in front
          of it rather than a second logo competing with the one inside. */}
      <div className="zf-sig" aria-hidden>
        <ZenyaMark />
      </div>

      <div className="zf-card">
        {/* The wash on its own layer rather than in the background, so the
            hairline stays a hairline instead of being mixed into a gradient.
            Strongest at the top and gone by the middle: a surface is lit from
            one side, not tinted all over. */}
        <span className="zf-sheen" aria-hidden />
        <div className="zf-body">
        <div className="zf-cols">
          <div className="zf-brand">
            <Link href="/" aria-label="زينيا" className="zf-mark">
              <ZenyaMark className="zf-mark-svg" />
            </Link>
            <p className="zf-claim">
              أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي. اكتب نبذة عن
              نشاطك، واحصل على موقع مباشر بعنوانه الخاص.
            </p>
            {/* The deck's footer carries this and it belongs here too: the
                last thing on a pricing page should be a way to start. */}
            <span className="zf-cta">
              <SlideButton href="/build" variant="violet" slide="ابدأ الآن">
                ابدأ الإنشاء
              </SlideButton>
            </span>
            <a className="zf-mail" href={"mailto:" + COMPANY.SUPPORT_EMAIL} dir="ltr">
              {COMPANY.SUPPORT_EMAIL}
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
/* THE CAP IS A GROUND, NOT THE FOOTER. It runs edge to edge, its top corners
   are round and its bottom corners square, and it is flush with the end of the
   document: a cap, not another floating card of the same obsidian the
   comparison panel already is. What stands ON it is the footer.

   The negative inline margin is how it escapes the page's own gutter, which
   .zp-root applies as padding. calc on the same variable, so the two can never
   drift. */
.zf {
  position: relative;
  margin: clamp(3.5rem, 8vw, 6rem) calc(var(--gut) * -1) 0;
  padding: clamp(3rem, 6vw, 5rem) var(--gut) clamp(1.75rem, 3vw, 2.5rem);
  border-radius: var(--r-panel) var(--r-panel) 0 0;
  background: var(--onyx);
  overflow: hidden;
}
/* THE MARK IS IN FLOW, NOT BEHIND THE CARD. It was absolutely positioned and
   overlapping, which is what made this read as cramped: the logo sat ON the
   footer instead of above it and there was no air anywhere. The deck's own
   footer gives it a whole band of its own, and these are its numbers, taken
   by measuring that screen rather than guessed: 660px wide, 11% opacity, and
   92px of clear space between it and the card below. */
.zf-sig {
  display: flex;
  justify-content: center;
  margin-bottom: clamp(2.5rem, 6vw, 5.75rem);
  opacity: 0.11;
  pointer-events: none;
}
.zf-sig svg { width: min(74%, 660px); height: auto; color: #fafafa; }

/* ادر's lit material, which is what the deck's own footer card is made of:
   one hairline bright along the top edge and fading down, obeying a light
   that comes from above. No drop shadow, which this style refuses, and no
   second card grammar, because the dark surfaces are one family. */
.zf-card {
  position: relative;
  max-width: 1180px;
  margin-inline: auto;
  /* The deck's radius. A footer card is a large surface and 26 read tight
     against a 28 cap. */
  border-radius: 34px;
  overflow: hidden;
  background: rgba(250, 250, 250, 0.028);
  box-shadow:
    inset 0 1px 0 rgba(250, 250, 250, 0.17),
    inset 0 0 0 1px rgba(250, 250, 250, 0.065);
}
.zf-sheen {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(250, 250, 250, 0.07) 0%,
    rgba(250, 250, 250, 0.026) 34%,
    rgba(250, 250, 250, 0) 62%
  );
}
.zf-body {
  position: relative;
  /* 34px 36px 28px on the deck. */
  padding: clamp(1.75rem, 3vw, 2.125rem) clamp(1.25rem, 3vw, 2.25rem) clamp(1.5rem, 2.5vw, 1.75rem);
}
.zf-cols {
  display: grid;
  /* The deck's own track sizes and gap. */
  grid-template-columns: 1.55fr repeat(3, minmax(0, 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: start;
}
.zf-mark { display: inline-flex; }
.zf-mark-svg { height: 22px; color: #fafafa; }
.zf-claim { margin: 1rem 0 0; max-width: 30ch; font-size: 13.5px; font-weight: 500; line-height: 1.9; color: #a8a8b2; }
.zf-cta { display: block; margin-top: 1.25rem; max-width: 13rem; }
.zf-mail {
  /* min-height, not padding: the target has to clear 32 RENDERED pixels and
     ZoomLock puts every length through zoom 0.85, so the CSS floor is 38.
     Measured before this: 95 x 16.6 rendered. */
  display: inline-flex; align-items: center; min-height: 38px;
  margin-top: 0.5rem;
  font-size: 13px; font-weight: 500; color: var(--violet-lift); text-decoration: none;
}
.zf-mail:hover { text-decoration: underline; text-underline-offset: 3px; }

.zf-head {
  margin: 0 0 0.5rem;
  /* 11px CSS is 9.35 rendered under zoom 0.85, which is below the 12px floor
     whatever its colour. 14.5px clears it at 12.33. */
  font-size: 14.5px; font-weight: 700; letter-spacing: 0.08em;
  /* #7c7c88 measured 4.26:1 on this ground, under the 4.5 floor for text this
     size. #9a9aa6 is 6.30:1. */
  text-transform: uppercase; color: #9a9aa6;
}
/* The gap comes off the list and goes inside the rows, so the targets grow
   without the column growing with them. Measured before this: 89 x 18.7
   rendered, against a floor of 32. */
.zf-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
.zf-col a {
  display: inline-flex; align-items: center; min-height: 38px;
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
  /* 34px is 28.9 rendered, under the floor. 38 lands on 32.3. */
  width: 38px; height: 38px; border-radius: 999px;
  color: #a8a8b2;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.zf-social a:hover { color: #fff; background: rgba(255, 255, 255, 0.07); }
.zf-social svg { width: 16px; height: 16px; }
/* 12px CSS is 10.2 rendered; 14.5 lands on 12.33. And #7c7c88 measured
   4.26:1 on this ground. */
.zf-legal { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.7; color: #9a9aa6; }

@media (max-width: 860px) {
  .zf-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .zf-brand { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .zf-cols { grid-template-columns: minmax(0, 1fr); gap: 1.75rem; }
  .zf-bottom { flex-direction: column; align-items: flex-start; }
}
`
