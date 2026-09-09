/**
 * The candidate compare pages' stylesheet: the hub's list of comparisons and
 * the summary block. The table, the choose blocks and the FAQ come from
 * PARTS_CSS, which both the hub and the detail page share.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const CSS = `
/* ---- the comparisons ----------------------------------------------------
   Seven records, hairline-separated rather than seven white cards with a
   40px hover shadow. Each names the competitor in Arabic and in Latin, and
   the Latin run is bdi so it cannot flip the row around it.
------------------------------------------------------------------------- */
.zx-cmps { padding: clamp(1rem, 3vw, 1.5rem) 0 0; }
.zx-cmplist { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.zx-cmp {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.375rem 1rem; align-items: center;
  padding: clamp(1.125rem, 3vw, 1.5rem) 0; border-top: 1px solid rgba(0,0,0,0.08);
  text-decoration: none; min-width: 0;
}
.zx-cmp:last-child { border-bottom: 1px solid rgba(0,0,0,0.08); }
.zx-cmp-h { margin: 0; font-size: clamp(16.5px, 1.9vw, 19px); font-weight: 700; line-height: 1.5; color: var(--obsidian); min-width: 0; }
/* 0.82em of a 16.5px heading is 13.53px, which renders 11.5px and is under
   the floor. The floor wins; the ratio applies above it. */
.zx-cmp-latin { margin-inline-start: 0.5rem; font-size: max(14.2px, 0.82em); font-weight: 500; color: var(--stone-2); }
.zx-cmp-p { grid-column: 1; margin: 0; font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.9; color: var(--stone); min-width: 0; }
.zx-cmp-arrow { grid-row: span 2; align-self: center; flex: 0 0 auto; color: var(--violet); transition: transform 240ms var(--ease-out); }
.zx-cmp:hover .zx-cmp-h { color: var(--violet-ink); }
.zx-cmp:hover .zx-cmp-arrow { transform: translateX(-4px); }
@media (min-width: 900px) {
  .zx-cmplist { grid-template-columns: 1fr 1fr; column-gap: clamp(2rem, 4vw, 3.5rem); }
  .zx-cmp:nth-child(-n+2) { border-top: 0; }
  .zx-cmp:last-child { border-bottom: 0; }
}

/* ---- the one-line summary ----------------------------------------------- */
.zx-sum { padding: clamp(2.5rem, 6vw, 4rem) 0 0; }
.zx-sumlist { display: grid; gap: clamp(0.875rem, 2.4vw, 1.125rem); margin: clamp(1rem, 2.4vw, 1.25rem) 0 0; padding: 0; list-style: none; }
.zx-sumitem { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.75rem; align-items: start; }
.zx-summark { margin-block-start: 0.62em; width: 6px; height: 6px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
.zx-sumtext { font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.9; color: var(--stone); min-width: 0; }
.zx-sumtext b { color: var(--obsidian); font-weight: 700; }
`
