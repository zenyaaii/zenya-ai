/**
 * The candidate about page's own stylesheet. Composed after CHROME_CSS
 * (tokens plus the header pill) and MARKETING_CSS (the frame, the opening,
 * the shared section type, the arrival), both from components/zenya/chrome.
 *
 * Only this page's four section families live here.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * WHAT THIS PAGE REFUSES, all of it measured on the live surface:
 *   · The three aurora orbs. rgba(94,106,210,0.06), rgba(217,119,6,0.07) and
 *     rgba(113,112,255,0.03), each blur(64px) at opacity 0.7, over a #f7f4ed
 *     ground. The house style is a flat #fafafa on which every pixel of
 *     colour belongs to the light at the edges.
 *   · .gradient-text on the headline, which computes to
 *     linear-gradient(120deg, #4f5ab8 10%, #7170ff 100%). The house style
 *     refuses gradients on anything that is not the light itself, and this is
 *     the LILA RULE's AI-purple headline exactly.
 *   · Six Arabic elements tracked between -0.6px and -2px. Arabic letterforms
 *     connect; nothing here tracks.
 *   · Four pillar tiles in three decorative hues. The status triad reports a
 *     state or it is not used, and a list of product claims reports none.
 */

export const CSS = `
/* ---- 1. the story: an editorial column, used once ----------------------- */
.zx-story { padding: clamp(2.5rem, 6vw, 4.5rem) 0; }
/* The first paragraph carries the weight, so the section has a way in
   without a second heading or a pull quote. */
.zx-p-lead { font-size: clamp(16.5px, 2vw, 19px); font-weight: 500; line-height: 1.85; color: var(--obsidian); }

/* ---- 2. what distinguishes: an indexed list, not a 2x2 card grid --------
   Four equal cards in a two-by-two grid is the AI default the skill names,
   and the live version paints each tile in its own hue. This is one column
   of records separated by hairlines, each opened by its own index. Nothing
   is tinted but the index.
------------------------------------------------------------------------- */
.zx-pillars { padding: clamp(2.5rem, 6vw, 4rem) 0; }
.zx-plist { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.zx-pitem {
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.25rem 1rem;
  padding: clamp(1.25rem, 3vw, 1.75rem) 0;
}
.zx-pitem + .zx-pitem { border-top: 1px solid rgba(0,0,0,0.08); }
.zx-pnum {
  grid-row: span 2; align-self: start;
  /* --violet-ink, not --violet. The index is a RUN OF TEXT, and the token
     block's own rule is that violet text takes the darker step: #5e6ad2
     measures exactly 4.5:1 on the ground at this size, which passes with no
     margin at all, and #4f5ab8 measures 5.77:1. Dots, rules and fills keep
     #5e6ad2. */
  font-size: clamp(15px, 1.8vw, 17px); font-weight: 900; line-height: 1.6; color: var(--violet-ink);
  font-variant-numeric: tabular-nums; min-width: 1.6em;
}
.zx-ptitle { margin: 0; font-size: clamp(16.5px, 1.9vw, 19px); font-weight: 700; line-height: 1.55; color: var(--obsidian); min-width: 0; }
.zx-pdesc {
  margin: 0.375rem 0 0; grid-column: 2; min-width: 0;
  font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.9; color: var(--stone);
}
@media (min-width: 900px) {
  /* Two columns of records on a wide screen, still hairline-separated, so it
     is not one long ribbon. The first row owns no rule. */
  .zx-plist { grid-template-columns: 1fr 1fr; column-gap: clamp(2rem, 4vw, 3.5rem); }
  .zx-pitem:nth-child(-n+2) { border-top: 0; }
}

/* ---- 3. principles: a hanging-mark rhythm, no card, no discs ------------ */
.zx-values { padding: clamp(2.5rem, 6vw, 4rem) 0; }
.zx-vlist { display: grid; gap: clamp(1rem, 2.4vw, 1.375rem); margin: 0; padding: 0; list-style: none; }
.zx-vitem { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.75rem; align-items: start; }
/* One accent, and it is the page's accent. The live page marks these with a
   green disc, and green here reports nothing: it is a principle, not a
   state. */
.zx-vmark { margin-block-start: 0.62em; width: 6px; height: 6px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
.zx-vtext { font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.9; color: var(--stone); min-width: 0; }

/* ---- 4. who is behind it: a record card --------------------------------- */
.zx-who { padding: clamp(2.5rem, 6vw, 4rem) 0; }
.zx-record {
  padding: clamp(1.25rem, 3vw, 1.75rem);
  border-radius: var(--r-card); background: var(--card);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}

/* ---- 5. the English mirror ---------------------------------------------
   Kept, because it is crawlable content the live page earns traffic with and
   section 11.C forbids removing it silently. Quieter than the Arabic, set
   LTR, opened by a hairline rather than a second hero.
------------------------------------------------------------------------- */
.zx-mirror { padding: clamp(3rem, 7vw, 5rem) 0 clamp(2rem, 5vw, 3rem); border-top: 1px solid rgba(0,0,0,0.08); }
.zx-mirror h2 { margin: 0 0 clamp(0.875rem, 2vw, 1.25rem); font-size: clamp(21px, 2.6vw, 27px); font-weight: 900; line-height: 1.35; color: var(--obsidian); letter-spacing: 0; }
.zx-mirror p { margin: 0 0 1rem; font-size: clamp(14.5px, 1.6vw, 16px); font-weight: 400; line-height: 1.85; color: var(--stone); }
.zx-mirror p strong { color: var(--obsidian); font-weight: 700; }
.zx-mirror .zx-eyebrow { margin-bottom: 1rem; }
.zx-acts-en { margin-top: clamp(1.25rem, 3vw, 1.75rem); }
`
