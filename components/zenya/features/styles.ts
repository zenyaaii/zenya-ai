/**
 * The candidate features page's own stylesheet.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * TEN FEATURES ARE NOT TEN CARDS. The live page lays them out as a
 * three-column grid of ten identical white cards, each opened by a violet
 * tinted tile, which is the AI default the skill names and which the house
 * style refuses twice over: it tints ten tiles on a page that is meant to be
 * achromatic, and it sets the body at 13.5px, which renders 11.47px.
 *
 * This is a hairline-separated list in two columns, the icon drawn as a
 * stroke rather than sat in a tinted tile, and nothing between the rows but
 * the rule. It is a different layout family from /demo/about's numbered list
 * on purpose: that one is opened by an index, this one by a mark.
 */

export const CSS = `
/* SEVEN WORDS, SO A STEP DOWN. The other candidates' headlines are three to
   five words and sit on two lines at 52px; this one broke over three, and
   the skill is explicit that a three-line hero headline is always a
   font-size error and never a copy-length one. The copy is not this
   restyle's to shorten, so the scale gives way. */
.zx-h1 { font-size: clamp(30px, 4.2vw, 42px); }

.zx-feats { padding: clamp(1rem, 3vw, 1.5rem) 0 0; }
.zx-flist { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.zx-fitem {
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.25rem 0.875rem;
  padding: clamp(1.125rem, 3vw, 1.5rem) 0;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.zx-ficon { grid-row: span 2; align-self: start; margin-block-start: 0.15em; color: var(--violet); }
.zx-ftitle { margin: 0; font-size: clamp(16px, 1.8vw, 18px); font-weight: 700; line-height: 1.55; color: var(--obsidian); min-width: 0; }
.zx-fbody {
  margin: 0.375rem 0 0; grid-column: 2; min-width: 0;
  font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.9; color: var(--stone);
}
@media (min-width: 900px) {
  .zx-flist { grid-template-columns: 1fr 1fr; column-gap: clamp(2rem, 4vw, 3.5rem); }
  .zx-fitem:nth-child(-n+2) { border-top: 0; }
}
`
