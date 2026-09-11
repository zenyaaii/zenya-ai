/**
 * The candidate websites pages' stylesheet: the hub's catalogue and the
 * detail page's shape. Shared by both routes.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * THE CARDS STAY CARDS, and that is deliberate. This is a catalogue of eight
 * real preview images, which is the one thing on the marketing site a card
 * grid is actually right for, so the restyle does not force a different
 * layout family on it to look inventive. What changes is everything the
 * house style names:
 *   · The hover lift and its 44px drop shadow become a hairline ring, since
 *     elevation here is stacked rings and never a shadow.
 *   · The label chip goes from white on the template's own accent, which
 *     measures 2.15:1 on #f59e0b, 2.25:1 on #c8a96a, 2.49:1 on #14b8a6,
 *     2.54:1 on #10b981 and 4.47:1 on #6366f1 at 11px (9.35px rendered), to
 *     paper on obsidian at 17.18:1 and 14.5px. Eight accents on one page is
 *     also the COLOR CONSISTENCY LOCK broken eight ways.
 *   · The card body goes from 13px (11.05px rendered) to the floor.
 */

export const CSS = `
/* ---- the catalogue ------------------------------------------------------ */
.zx-cat { padding: clamp(1rem, 3vw, 1.5rem) 0 0; }
.zx-grid { display: grid; gap: clamp(1rem, 2.4vw, 1.25rem); margin: 0; padding: 0; list-style: none; }
@media (min-width: 600px) { .zx-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1000px) { .zx-grid { grid-template-columns: repeat(3, 1fr); } }
/* EIGHT TEMPLATES, SO FOUR COLUMNS RATHER THAN THREE once there is room:
   eight in a three-column grid leaves a ragged two-card last row, and eight
   in four is two full rows. The count comes from the data, so if a ninth
   template is ever added this wants revisiting rather than silently going
   ragged again. */
@media (min-width: 1200px) { .zx-grid { grid-template-columns: repeat(4, 1fr); } }
.zx-card {
  display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  border-radius: var(--r-card); background: var(--card); text-decoration: none;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  transition: box-shadow 260ms var(--ease-out);
}
.zx-card:hover { box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 0 0 4px rgba(250,250,250,0.55); }
.zx-shot { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: var(--field); }
.zx-shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.zx-chip {
  position: absolute; inset-inline-end: 0.625rem; top: 0.625rem;
  border-radius: 999px; padding: 0.25rem 0.625rem;
  background: var(--obsidian); color: var(--ground);
  font-size: 14.5px; font-weight: 700; line-height: 1.4;
}
.zx-card-body { display: flex; flex-direction: column; gap: 0.375rem; padding: clamp(0.875rem, 2.4vw, 1.125rem); min-width: 0; }
.zx-card-h { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin: 0; font-size: clamp(16px, 1.8vw, 17.5px); font-weight: 700; line-height: 1.5; color: var(--obsidian); min-width: 0; }
.zx-card-arrow { flex: 0 0 auto; color: var(--violet); transition: transform 240ms var(--ease-out); }
.zx-card:hover .zx-card-arrow { transform: translateX(-4px); }
.zx-card-p { margin: 0; font-size: clamp(14.5px, 1.6vw, 15px); font-weight: 400; line-height: 1.85; color: var(--stone); min-width: 0; }

/* ---- the detail page ----------------------------------------------------
   Two columns from 1024: the copy and its live preview. Below that the
   preview follows the copy, because the reader came for the words and the
   actions, and the live page already gets this one right (its call to action
   measures 462px down at 390).
------------------------------------------------------------------------- */
.zx-detail { display: grid; gap: clamp(1.75rem, 4vw, 2.5rem); align-items: center; padding-bottom: clamp(2rem, 5vw, 3rem); }
@media (min-width: 1024px) { .zx-detail { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.zx-frame {
  overflow: hidden; border-radius: var(--r-card); background: var(--card); min-width: 0;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.zx-frame img { width: 100%; height: auto; display: block; }
/* The live frame paints a fake browser chrome with three coloured dots. The
   house style has no decorative dots and no traffic-light red/amber/green,
   and a preview of a real page does not need a picture of a window around
   it. The ring is the frame. */

/* ---- what is included --------------------------------------------------- */
.zx-inc { padding: clamp(2.5rem, 6vw, 4rem) 0 0; }
.zx-inclist { display: grid; gap: clamp(0.75rem, 2vw, 1rem); margin: 0; padding: 0; list-style: none; }
@media (min-width: 700px) { .zx-inclist { grid-template-columns: 1fr 1fr; column-gap: clamp(1.5rem, 3vw, 2.5rem); } }
.zx-incitem { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.75rem; align-items: start; }
/* A violet dot, not a green disc. Green reports a state; a list of what a
   template contains reports none. */
.zx-incmark { margin-block-start: 0.62em; width: 6px; height: 6px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
.zx-inctext { font-size: clamp(15px, 1.7vw, 16px); font-weight: 400; line-height: 1.85; color: var(--stone); min-width: 0; }

/* ---- who it is for, and the long-read cross-link ------------------------ */
.zx-note { margin: clamp(2rem, 5vw, 3rem) 0 0; padding: clamp(1.125rem, 3vw, 1.5rem); border-radius: var(--r-card); background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
.zx-note-h { margin: 0 0 0.5rem; font-size: clamp(16px, 1.8vw, 18px); font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zx-note-p { margin: 0; font-size: clamp(14.5px, 1.6vw, 16px); font-weight: 400; line-height: 1.9; color: var(--stone); }
.zx-read {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; align-items: center;
  margin: clamp(1rem, 2.4vw, 1.25rem) 0 0; padding: clamp(1.125rem, 3vw, 1.5rem);
  border-radius: var(--r-card); background: var(--card); text-decoration: none;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08); transition: box-shadow 240ms var(--ease-out);
}
.zx-read:hover { box-shadow: 0 0 0 1px rgba(0,0,0,0.2); }
.zx-read-k { display: block; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2); }
.zx-read-h { display: block; margin-top: 0.25rem; font-size: clamp(16px, 1.8vw, 18px); font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zx-read-p { display: block; margin-top: 0.375rem; font-size: clamp(14.5px, 1.6vw, 15.5px); font-weight: 400; line-height: 1.85; color: var(--stone); }
.zx-read-arrow { flex: 0 0 auto; color: var(--violet); }
`
