/**
 * The candidate long-read's stylesheet.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * ONE ACCENT, NOT EIGHT. The live article tints itself with
 * auroraTints[key].accent, a different hue per template: the kicker pill, the
 * stat figures, the checklist icons, the illustration fills, the hero frame's
 * shadow and the closing band's gradient all take it. On the restaurant
 * article that hue is #c8a96a, and it is the reason the page's three contrast
 * failures are all the same colour: the kicker at 1.94:1, the related-reading
 * label at 1.99:1, and the stat figures at 2.25:1. The stat figures are the
 * "real numbers, with sources" block, so the least readable thing on the page
 * is the part the page is proudest of.
 *
 * The candidate is achromatic with the set's one accent, and the numbers are
 * obsidian. Per-template variety is real and worth having, but the house
 * style's answer to it is the light at the edges, not eight text colours.
 *
 * FOUR GRADIENTS GO: the radial glow behind the whole page, the hero frame's
 * fill, every illustration figure, and the closing band.
 */

export const CSS = `
/* THE LONGEST HEADLINE IN THE CANDIDATE SET. "لماذا يحتاج مطعمك إلى موقع
   احترافي في 2026؟" is 43 characters and broke over three lines at 52px,
   where the skill's hard cap is two and a three-line hero headline is always
   a font-size error rather than a copy-length one. The copy is not this
   restyle's to shorten, so the scale gives way. */
.zx-h1 { font-size: clamp(29px, 4vw, 40px); }

/* ---- the article column ------------------------------------------------- */
.zx-art { padding-bottom: clamp(2rem, 5vw, 3rem); }
.zx-sec { padding: clamp(2.5rem, 6vw, 4rem) 0 0; }
/* Every section keeps the id the live article gives it, so a heading stays
   linkable, and the sticky pill has to be cleared on a jump. */
.zx-sec { scroll-margin-top: 104px; }
.zx-sec p {
  margin: 0 0 1.125rem; font-size: clamp(15.5px, 1.7vw, 16.5px); font-weight: 400;
  line-height: 1.95; color: var(--stone);
}
.zx-sec p:last-child { margin-bottom: 0; }

/* ---- the hero screenshot ------------------------------------------------
   A ring, not a drawn browser window. The live frame paints a fake chrome
   with three traffic-light dots and a tinted URL chip at 10.5px (8.92px
   rendered, the smallest type on the page), over a white gradient fill and a
   90px tinted drop shadow. A screenshot of a real page does not need a
   picture of a window around it.
------------------------------------------------------------------------- */
.zx-hero-shot {
  margin: clamp(1.75rem, 4vw, 2.5rem) 0 0; overflow: hidden; border-radius: var(--r-card);
  background: var(--card);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.zx-hero-shot img { display: block; width: 100%; height: auto; max-height: 520px; object-fit: cover; object-position: top; }

/* ---- the section figures ------------------------------------------------ */
.zx-fig {
  margin: clamp(1.5rem, 3.5vw, 2rem) 0 0; padding: clamp(1.125rem, 3vw, 1.5rem);
  border-radius: var(--r-card); background: var(--card);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
.zx-fig-k {
  display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 0 0.875rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
}
.zx-fig-k svg { color: var(--violet); flex: 0 0 auto; }
.zx-fig-row { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.875rem; align-items: center; }
.zx-fig-num { font-size: clamp(22px, 3vw, 28px); font-weight: 900; line-height: 1.2; color: var(--obsidian); font-variant-numeric: tabular-nums; }
.zx-fig-t { font-size: clamp(15px, 1.7vw, 16px); font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zx-fig-p { margin: 0.25rem 0 0; font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.85; color: var(--stone); }
.zx-fig-mark { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex: 0 0 auto; border-radius: var(--r-control); background: var(--field); color: var(--violet); }
.zx-fig-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
.zx-fig-cell { padding: 0.625rem 0.5rem; border-radius: var(--r-control); background: var(--field); text-align: center; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
/* NOT .zx-bar: that is the header pill's inner row in CHROME_CSS, and naming
   the chart bars the same painted rgba(94,106,210,0.24) behind the navigation
   on every page that loads this file. The nav label fell from 5.18:1 to
   3.85:1 and nothing looked wrong; the contrast audit caught it. */
.zx-chart { display: flex; align-items: flex-end; gap: 0.375rem; height: 96px; }
.zx-chart-bar { flex: 1; border-radius: 6px; background: rgba(94,106,210,0.24); }
.zx-chart-bar[data-lead] { background: var(--violet); }
.zx-fig-note { margin: 0.75rem 0 0; font-size: 14.5px; font-weight: 400; line-height: 1.7; color: var(--stone); }

/* ---- the numbers, with their sources ------------------------------------
   THE FIGURES ARE OBSIDIAN, NOT THE ACCENT. On the live page they are the
   template's own tint, which on restaurant measures 2.25:1 at 30px: the block
   the article is proudest of is the hardest thing on it to read. The source
   line keeps its Latin run in a bdi so it cannot turn the card around, and it
   drops the uppercase and the +0.92px of tracking, neither of which does
   anything useful to a mixed Arabic and Latin line.
------------------------------------------------------------------------- */
.zx-stats { display: grid; gap: clamp(0.875rem, 2.4vw, 1.125rem); margin: clamp(1.5rem, 3.5vw, 2rem) 0 0; }
@media (min-width: 700px) { .zx-stats { grid-template-columns: 1fr 1fr; } }
.zx-stat { padding: clamp(1.125rem, 3vw, 1.5rem); border-radius: var(--r-card); background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.08); min-width: 0; }
.zx-stat-fig { font-size: clamp(28px, 4vw, 36px); font-weight: 900; line-height: 1.15; color: var(--obsidian); font-variant-numeric: tabular-nums; }
.zx-stat-l { margin: 0.625rem 0 0; font-size: clamp(15px, 1.7vw, 16px); font-weight: 500; line-height: 1.7; color: var(--obsidian); }
.zx-stat-s { margin: 0.625rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.6; color: var(--stone); }

/* ---- the checklist ------------------------------------------------------ */
.zx-check { display: grid; gap: clamp(0.875rem, 2.4vw, 1.125rem); margin: clamp(1.5rem, 3.5vw, 2rem) 0 0; padding: 0; list-style: none; }
.zx-check li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.75rem; align-items: start; }
.zx-check-mark { margin-block-start: 0.62em; width: 6px; height: 6px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
.zx-check-t { font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.85; color: var(--stone); min-width: 0; }

/* ---- related reading ---------------------------------------------------- */
.zx-twin {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; align-items: center;
  margin: clamp(2.5rem, 6vw, 4rem) 0 0; padding: clamp(1.125rem, 3vw, 1.5rem);
  border-radius: var(--r-card); background: var(--card); text-decoration: none;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08); transition: box-shadow 240ms var(--ease-out);
}
.zx-twin:hover { box-shadow: 0 0 0 1px rgba(0,0,0,0.2); }
.zx-twin-k { display: block; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2); }
.zx-twin-h { display: block; margin-top: 0.25rem; font-size: clamp(16px, 1.8vw, 18px); font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zx-twin-p { display: block; margin-top: 0.375rem; font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.85; color: var(--stone); }
.zx-twin-arrow { flex: 0 0 auto; color: var(--violet); }
`
