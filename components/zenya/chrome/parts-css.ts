/**
 * The restyled equivalent of components/marketing/CompareParts.tsx.
 *
 * The live SEO pages already share one parts module, so the candidate does
 * too: features, the websites hub and its detail page, and the compare hub
 * and its detail page are five routes over these six blocks.
 *
 * Composed after CHROME_CSS and MARKETING_CSS.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * WHAT THESE BLOCKS FIX, all measured on the live pages:
 *   · .kicker is 11px, which renders 9.35px under the root zoom, with
 *     letter-spacing +1.76px and text-transform: uppercase applied to Arabic.
 *     Uppercase does nothing to Arabic letterforms and positive tracking
 *     breaks their joins. It also measures 4.28:1 on the ground, under 4.5.
 *     Its ::before is a 26px linear-gradient hairline.
 *   · .gradient-text fills every one of the five headlines with
 *     linear-gradient(120deg, #4f5ab8 10%, #7170ff 100%).
 *   · A native details summary stands 18.5px tall against the 32px a coarse
 *     pointer is owed.
 *   · The breadcrumb links measure 37x19.7 and 10.63px.
 *   · Violet at #5e6ad2 on a tinted fill measures 4.16:1 in the comparison
 *     table header and 4.03:1 in the choose blocks. Both need 4.5.
 */

export const PARTS_CSS = `
/* ---- breadcrumbs -------------------------------------------------------- */
.zx-crumbs { margin: 0 0 clamp(1.25rem, 3vw, 1.75rem); }
.zx-crumbs ol { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; margin: 0; padding: 0; list-style: none; }
.zx-crumbs li { display: flex; align-items: center; gap: 0.5rem; }
/* 30px CSS renders 25.5px, which clears the 24px floor a fine pointer is
   owed; under a coarse pointer it goes to 38px, which renders 32.3px. The
   padding is pulled back out with a negative margin so the trail does not
   move. */
.zx-crumbs a, .zx-crumbs span[aria-current] {
  display: inline-flex; align-items: center; min-height: 30px;
  font-size: 14.5px; font-weight: 500; line-height: 1.5; color: var(--stone);
  text-decoration: none;
}
.zx-crumbs a { color: var(--stone); text-decoration: underline; text-underline-offset: 3px; }
.zx-crumbs a:hover { color: var(--obsidian); }
.zx-crumbs span[aria-current] { color: var(--obsidian); font-weight: 700; }
.zx-crumbs .zx-crumb-sep { color: var(--ghost); font-size: 14.5px; }
@media (pointer: coarse) { .zx-crumbs a { min-height: 38px; } }

/* ---- the comparison table ----------------------------------------------
   THE TABLE OWNS THE OVERFLOW, THE DOCUMENT NEVER DOES, and below 768 three
   columns of Arabic prose is not a table at all: each row becomes a record
   with the two answers labelled. Same one DOM, explicit ARIA roles, because
   display:block on a table element drops the native semantics.
------------------------------------------------------------------------- */
.zx-tw { margin: clamp(1.5rem, 3.5vw, 2rem) 0 0; }
.zx-tw table { width: 100%; border-collapse: collapse; }
.zx-tw th, .zx-tw td { text-align: start; vertical-align: top; font-size: clamp(14.5px, 1.6vw, 15.5px); line-height: 1.85; }
.zx-tw thead th { font-weight: 700; color: var(--obsidian); }
/* The Zenya column is named in the accent, and the accent's READING step:
   #5e6ad2 measures 4.16:1 on this fill and #4f5ab8 measures 5.48:1. */
.zx-tw .zx-th-us { color: var(--violet-ink); }
.zx-tw tbody th { font-weight: 700; color: var(--obsidian); }
.zx-tw tbody td { font-weight: 400; color: var(--stone); }
.zx-tw .zx-td-us { color: var(--obsidian); }
.zx-win { display: inline-flex; align-items: center; gap: 0.375rem; }
/* A DOT, NOT A GREEN DISC. The live table marks a Zenya win with a #27a644
   check in a tinted circle, and green here reports no state: it is an
   opinion about a feature, not a status. The page has one accent. */
.zx-win-dot { flex: 0 0 auto; width: 5px; height: 5px; border-radius: 999px; background: var(--violet); margin-block-start: 0.62em; align-self: flex-start; }
@media (max-width: 767px) {
  .zx-tw thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .zx-tw table, .zx-tw tbody, .zx-tw tr, .zx-tw th, .zx-tw td { display: block; }
  .zx-tw tbody tr {
    margin-top: 0.75rem; padding: clamp(0.875rem, 2.4vw, 1.125rem); border-radius: var(--r-card);
    background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  }
  .zx-tw tbody th { font-size: 16px; margin-bottom: 0.625rem; }
  .zx-tw tbody td { padding: 0; }
  .zx-tw tbody td + td { margin-top: 0.625rem; }
  .zx-tw tbody td::before {
    content: attr(data-label); display: block;
    font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
  }
}
@media (min-width: 768px) {
  .zx-tw { overflow-x: auto; }
  .zx-tw th, .zx-tw td { padding: 0.875rem 1rem 0.875rem 0; }
  .zx-tw thead th { border-bottom: 1px solid rgba(0,0,0,0.14); padding-top: 0; }
  .zx-tw tbody tr + tr th, .zx-tw tbody tr + tr td { border-top: 1px solid rgba(0,0,0,0.06); }
  .zx-tw tbody td::before { content: none; }
}

/* ---- when to choose which ---------------------------------------------- */
.zx-choose { display: grid; gap: clamp(0.875rem, 2.4vw, 1.25rem); margin: clamp(2rem, 5vw, 3rem) 0 0; }
@media (min-width: 768px) { .zx-choose { grid-template-columns: 1fr 1fr; } }
.zx-choose-card {
  padding: clamp(1.125rem, 3vw, 1.5rem); border-radius: var(--r-card); background: var(--card);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
.zx-choose-h { margin: 0 0 0.625rem; font-size: clamp(16px, 1.8vw, 18px); font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zx-choose-us .zx-choose-h { color: var(--violet-ink); }
.zx-choose-p { margin: 0; font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.9; color: var(--stone); }

/* ---- the FAQ list ------------------------------------------------------- */
.zx-faq { padding: clamp(2.5rem, 6vw, 4rem) 0 0; }
.zx-q { border-top: 1px solid rgba(0,0,0,0.08); }
.zx-q:last-child { border-bottom: 1px solid rgba(0,0,0,0.08); }
/* The live summary stands 18.5px tall. This one is 38px minimum, which
   renders 32.3px, and the padding takes it well past that. */
.zx-qsum {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 1rem;
  min-height: 38px; padding: clamp(1rem, 2.4vw, 1.25rem) 0; cursor: pointer; list-style: none;
  font-size: clamp(15.5px, 1.8vw, 17px); font-weight: 700; line-height: 1.6; color: var(--obsidian);
}
.zx-qsum::-webkit-details-marker { display: none; }
.zx-qsum:hover { color: var(--violet-ink); }
.zx-qchev { flex: 0 0 auto; color: var(--stone-2); transition: transform 300ms var(--ease-out), color 200ms var(--ease-out); }
.zx-q[open] .zx-qchev { transform: rotate(180deg); color: var(--violet); }
.zx-q[open] .zx-qsum { color: var(--violet-ink); }
.zx-qa { padding: 0 0 clamp(1.125rem, 2.6vw, 1.5rem); font-size: clamp(14.5px, 1.6vw, 16px); font-weight: 400; line-height: 1.95; color: var(--stone); }
.zx-q[open] .zx-qa { animation: zx-qa-in 380ms var(--ease-out) both; }
@keyframes zx-qa-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .zx-q[open] .zx-qa { animation: none; } .zx-qchev { transition: none; } }

/* ---- the closing band --------------------------------------------------- */
.zx-band { padding: clamp(3rem, 7vw, 4.5rem) 0 clamp(1.5rem, 4vw, 2.5rem); border-top: 1px solid rgba(0,0,0,0.08); margin-top: clamp(2.5rem, 6vw, 4rem); }
.zx-band-h { margin: 0 0 0.75rem; font-size: clamp(23px, 3vw, 30px); font-weight: 900; line-height: 1.4; color: var(--obsidian); }
.zx-band-p { margin: 0; font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.9; color: var(--stone); }

/* ---- pill cross-links --------------------------------------------------- */
.zx-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: clamp(1.25rem, 3vw, 1.5rem) 0 0; }
.zx-pill-link {
  display: inline-flex; align-items: center; gap: 0.5rem; min-height: 38px; padding: 0 0.875rem;
  border-radius: 999px; background: var(--card); color: var(--stone); text-decoration: none;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  font-size: 14.5px; font-weight: 500; line-height: 1.5;
  transition: color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
}
.zx-pill-link:hover { color: var(--obsidian); box-shadow: 0 0 0 1px rgba(0,0,0,0.2); }
`
