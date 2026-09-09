/**
 * THE MARKETING PRIMITIVES the candidates in this batch share: the page
 * frame, the opening (eyebrow, headline, the rule under the marked word,
 * lede, actions), the note at the foot that says the page is a proposal, the
 * arrival, and the focus ring.
 *
 * Split out rather than copied into the next page, for the same reason the
 * header was: the candidate set already carries eight copies of its chrome,
 * and a floor fixed in one of them stays broken in the other seven.
 *
 * Composed after CHROME_CSS and before the page's own stylesheet.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const MARKETING_CSS = `
/* ---- the frame ---------------------------------------------------------
   A READING COLUMN THAT IS CENTRED, WITH A LANE TO BREAK OUT INTO.

   The reading measure is not negotiable: 34rem is 450px rendered under the
   root zoom, which holds 62 to 66 Arabic characters a line. Anything wider
   and the page reads worse. But a 34rem column left-aligned inside a
   1060px wrap leaves 40% of a 1440 screen empty on one side, which reads as
   a broken layout rather than as margin.

   So the wrap is the canonical full-bleed grid: a centred main lane at the
   reading measure, and a full lane either side that a section can claim when
   it genuinely has a wide shape to fill. Text stays aligned to the inline
   start of its own column; the column itself is centred on the page.
------------------------------------------------------------------------- */
.zx-wrap {
  display: grid;
  max-width: 76rem; margin-inline: auto;
  grid-template-columns:
    [full-start] minmax(0, 1fr)
    [main-start] min(100%, 34rem)
    [main-end] minmax(0, 1fr)
    [full-end];
}
.zx-wrap > * { grid-column: main-start / main-end; min-width: 0; }
/* THE BREAKOUT IS ASYMMETRIC ON PURPOSE. A lane centred on the page is
   wider than the reading column on BOTH sides, so its heading starts further
   out than the paragraph above it and the two read as misaligned. This one
   starts on the reading column's own inline start and grows the other way,
   so every heading on the page shares one edge and only the extra width
   moves. Grid line names are logical, so this is correct in RTL and would be
   correct in LTR without a second rule. */
.zx-wide { grid-column: main-start / full-end; }

/* ---- the opening -------------------------------------------------------
   LEFT-ALIGNED, NOT CENTRED. The live marketing heroes are centred, and at
   DESIGN_VARIANCE 7 a centred stack is the default the skill asks you to
   reach past. It also buys the thing those pages most need: the primary
   action moves into the first screen. Measured on the live /about at 390,
   the first call to action sits 2362px down, nearly three viewports, and
   below the 229px consent banner.

   FOUR TEXT ELEMENTS, WHICH IS THE CAP: eyebrow, headline, lede, actions.
------------------------------------------------------------------------- */
.zx-open { padding-top: clamp(3.5rem, 9vw, 6rem); padding-bottom: clamp(2rem, 5vw, 3.5rem); }
.zx-eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 0 1.25rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
}
/* 14.5px, not the live page's 12px. That eyebrow renders 10.2px under the
   root zoom and measures 4.28:1 on its own rgba(94,106,210,0.08) fill, so it
   fails the type floor and the contrast floor at once. This one is text on
   the ground at 5.45:1, with the accent spent on the dot beside it. */
.zx-eyebrow-dot { width: 5px; height: 5px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
/* THE CAP IS IN rem, NOT ch. A ch cap on this element would be measured in
   the headline's own 52px and a ch cap on its parent in the parent's 16px;
   both are traps. 32rem holds this headline on two lines at every width, and
   the skill's hard rule is two.
   The top padding is capped at 6rem, which is the skill's pt-24. */
.zx-h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px); font-weight: 900; line-height: 1.28; color: var(--obsidian);
}
/* The one word the page is about, underlined by a violet rule that draws
   itself once. The accent reports the subject; it does not fill the word
   with a gradient the way .gradient-text does. */
.zx-h1-mark { position: relative; white-space: nowrap; }
.zx-h1-mark::after {
  content: ""; position: absolute; inset-inline: -0.06em; bottom: 0.02em; height: 0.07em;
  border-radius: 999px; background: var(--violet); transform-origin: right center;
}
.zx-js .zx-h1-mark::after { transform: scaleX(0); }
.zx-js [data-in] .zx-h1-mark::after { transform: none; transition: transform 720ms var(--ease-out) 260ms; }
.zx-lede {
  margin: clamp(1rem, 2.4vw, 1.5rem) 0 0;
  font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 500; line-height: 1.85; color: var(--stone);
}
.zx-lede strong { color: var(--obsidian); font-weight: 700; }
.zx-lede a { color: var(--violet-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.zx-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin: clamp(1.5rem, 3.5vw, 2.25rem) 0 0; }
/* SlideButton declares width: 100% on .sb in globals.css, so in a flex row
   it takes the whole line however the flex item is sized. That is right on a
   phone, where a full-width primary is the easiest thing in the layout to
   hit with a thumb, and wrong from 520 up, where it stretched a 544px
   button across the reading column. So the width is conditional and the
   ghost beside it, which is inline-flex and never stretched, is not. */
.zx-acts > * { flex: 0 0 auto; }
.zx-acts > .sb { width: 100%; }
@media (min-width: 520px) { .zx-acts > .sb { width: fit-content; } }
.zx-act-2 {
  display: inline-flex; align-items: center; gap: 0.5rem; min-height: 38px; padding: 0 1.125rem;
  border-radius: var(--r-control); background: var(--card); color: var(--obsidian);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.10); text-decoration: none;
  font-size: 15px; font-weight: 500; line-height: 1.5;
  transition: box-shadow 240ms var(--ease-out);
}
.zx-act-2:hover { box-shadow: 0 0 0 1px rgba(0,0,0,0.22); }

/* ---- shared section type ------------------------------------------------ */
.zx-h2 {
  margin: 0 0 clamp(1rem, 2.4vw, 1.5rem);
  font-size: clamp(23px, 3vw, 30px); font-weight: 900; line-height: 1.45; color: var(--obsidian);
}
.zx-p {
  margin: 0 0 1.125rem; font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.95; color: var(--stone);
}
.zx-p:last-child { margin-bottom: 0; }
.zx-p strong { color: var(--obsidian); font-weight: 700; }

/* ---- the note that says this is a proposal ------------------------------ */
.zx-foot-note {
  margin: 0 0 clamp(2rem, 5vw, 3rem);
  font-size: 14.5px; font-weight: 500; line-height: 1.9; color: var(--stone);
}
.zx-link { color: var(--violet-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.zx-link:hover { color: var(--obsidian); }

/* ---- arrival -----------------------------------------------------------
   MOTION_INTENSITY 4: one fade per section on the way in, and the rule under
   the marked word. The hidden half lives under .zx-js, which the script adds
   on mount, so a browser that never runs it reads a finished page. The live
   pages ship the opposite: framer-motion's initial={{opacity:0}} is
   server-rendered as style="opacity:0", nine blocks of it on /about and
   three on /faq, so both are blank with JavaScript disabled.
------------------------------------------------------------------------- */
.zx-js [data-reveal] { opacity: 0; transform: translateY(16px); }
.zx-js [data-reveal][data-in] {
  opacity: 1; transform: none;
  transition: opacity 620ms var(--ease-out), transform 620ms var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
  .zx-js [data-reveal] { opacity: 1; transform: none; transition: none; }
  .zx-js .zx-h1-mark::after { transform: none; }
}
.zx-root :where(a, button, summary):focus-visible {
  outline: 2px solid var(--violet-ink); outline-offset: 3px; border-radius: 6px;
}
`
