/**
 * The candidate review page's stylesheet.
 *
 * Its own module for the reason app/demo/access/styles.ts records: a style
 * element inside a component is one identical copy of the whole block per
 * render, and a 500-line template literal in the middle of JSX makes both
 * halves harder to read.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const CSS = `
.zr-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  /* The three greys that PASS. Measured on white and on the field fill; the
     2.8:1 pair some older surfaces still carry does not get copied over. */
  --stone: #56565a;
  --stone-2: #66666e;
  --ghost: #6b6b73;
  --violet: #5e6ad2;
  --field: #f4f4f6;
  /* THE FOOTER READS THESE OFF THE HOST PAGE'S ROOT, and it is not optional.
     PricingFooter's own CSS paints the cap with background: var(--onyx) and
     colours its mail link with var(--violet-lift), but declares neither — the
     candidate page it was written for declares both. Rendered here without
     them, the cap fell back to transparent: an obsidian footer's #a8a8b2 and
     #7c7c88 text stood on bare white paper at about 2:1, and the header had
     no dark ground left to invert over, so its mechanic silently stopped
     working on this page. Measured before the fix, not guessed. */
  --onyx: #131316;
  --violet-lift: #97a0ee;
  --gut: clamp(1rem, 4vw, 3rem);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.55, 0.085, 0.68, 0.53);
  --r-panel: 28px;
  --r-card: 16px;
  --r-control: 10px;

  position: relative;
  min-height: 100%;
  background: var(--ground);
  color: var(--obsidian);
  padding: 0 var(--gut);
  letter-spacing: 0;
}
/* The ground is painted behind the whole viewport as well as behind the
   content, so a short page cannot show the body's own colour under the cap. */
.zr-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* ---- header: the candidate set's, mechanic and all ---------------------- */
.zr-head { position: sticky; top: 0; z-index: 50; display: flex; justify-content: center; padding: 2rem 0 0; pointer-events: none; }
.zr-pill, .zr-phone-pill { pointer-events: auto; }
.zr-phone-pill {
  width: fit-content; max-width: 100%; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: min-width 380ms var(--ease-out) 220ms, background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
}
.zr-phone-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.375rem; height: 44px; padding-inline: 0.375rem; }
.zr-phone-mark { display: flex; align-items: center; justify-self: center; padding-inline: 0.375rem; }
.zr-mark-svg-sm { height: 16px; color: #000; }
.zr-round { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
.zr-round:hover { background: rgba(0,0,0,0.05); }
.zr-account-phone { justify-self: end; }
.zr-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
@media (min-width: 768px) { .zr-phone-pill { display: none; } }
@media (max-width: 767px) { .zr-pill { display: none; } }
.zr-pill {
  border-radius: 24px; overflow: hidden; width: 380px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
  contain: layout paint;
}
@media (prefers-reduced-transparency: reduce) { .zr-pill, .zr-phone-pill { background: #f2f2f5; -webkit-backdrop-filter: none; backdrop-filter: none; } }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .zr-pill, .zr-phone-pill { background: #f2f2f5; } }
.zr-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.zr-side { display: flex; align-items: center; min-width: 0; }
.zr-side-start { justify-content: flex-start; }
.zr-side-end { justify-content: flex-end; }
.zr-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.zr-mark-svg { height: 17px; color: #000; }
.zr-head[data-dark] .zr-pill, .zr-head[data-dark] .zr-phone-pill {
  background: rgba(32,32,38,0.72);
  box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5);
}
.zr-head[data-dark] .zr-mark-svg, .zr-head[data-dark] .zr-mark-svg-sm { color: #fafafa; }
.zr-head[data-dark] .zr-nav-item, .zr-head[data-dark] .zr-tray-row, .zr-head[data-dark] .zr-round { color: rgba(250,250,250,0.66); }
.zr-head[data-dark] .zr-nav-item:hover, .zr-head[data-dark] .zr-tray-row:hover { color: #fafafa; }
.zr-head[data-dark] .zr-sep { background: rgba(250,250,250,0.16); }
.zr-head[data-dark] .zr-account { background: #fafafa; color: #171717; }
.zr-nav { display: flex; align-items: center; gap: 0.125rem; }
.zr-nav-item { border-radius: 999px; padding: 0.625rem 0.75rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.zr-nav-item:hover { color: var(--obsidian); }
.zr-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); transition: background-color 520ms var(--ease-out); }
.zr-account { border-radius: 999px; padding: 0.5rem 1rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out), background-color 520ms var(--ease-out), color 520ms var(--ease-out); }
.zr-account:hover { opacity: 0.86; }
.zr-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.zr-drawer[data-open] { transition-delay: 0s, 0s; }
.zr-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zr-tray-row { display: block; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 14.5px; line-height: 1.24; text-decoration: none; color: #666; }
.zr-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

/* ---- the measure -------------------------------------------------------
   One column of 1120px holds the whole page, and every band inside it is
   measured against that rather than against the viewport, so the opening,
   the instrument and the wall line up on the same two edges.
------------------------------------------------------------------------- */
.zr-wrap { width: min(100%, 1120px); margin-inline: auto; }

/* ---- the opening -------------------------------------------------------- */
.zr-open { padding-top: clamp(3rem, 8vw, 6.5rem); padding-bottom: clamp(1.75rem, 4vw, 2.75rem); }
.zr-eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 0 1rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
}
.zr-eyebrow-dot { width: 5px; height: 5px; border-radius: 999px; background: var(--violet); }
.zr-h1 {
  margin: 0; max-width: 18ch;
  font-size: clamp(30px, 5.6vw, 54px); font-weight: 900; line-height: 1.3; color: var(--obsidian);
}
/* The one word the page is about. Underlined by a violet rule that draws
   itself once, which is the accent reporting the subject rather than
   decorating a heading. */
.zr-h1-mark { position: relative; white-space: nowrap; }
.zr-h1-mark::after {
  content: ""; position: absolute; inset-inline: -0.06em; bottom: 0.02em; height: 0.075em;
  border-radius: 999px; background: var(--violet); transform-origin: right center;
}
.zr-js .zr-h1-mark::after { transform: scaleX(0); }
.zr-js [data-in] .zr-h1-mark::after { transform: none; transition: transform 720ms var(--ease-out) 260ms; }
.zr-lede {
  margin: clamp(0.875rem, 2vw, 1.25rem) 0 0; max-width: 56ch;
  font-size: clamp(14.5px, 1.6vw, 16.5px); font-weight: 500; line-height: 1.95; color: var(--stone);
}
.zr-refuse {
  display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.25rem;
  border-radius: 999px; padding: 0.4375rem 0.875rem;
  background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.07);
  font-size: 14.5px; font-weight: 700; line-height: 1.6; color: var(--stone);
}
.zr-refuse svg { color: var(--violet); flex: 0 0 auto; }

/* ---- the well: the instrument, and the column that explains it ----------
   1.55fr / 1fr rather than two equal halves. The form is the object on the
   page and the aside is the note beside it; equal columns would make them
   read as a pair of choices.
------------------------------------------------------------------------- */
.zr-well { display: grid; grid-template-columns: 1fr; gap: clamp(1rem, 2.5vw, 1.5rem); align-items: start; }
@media (min-width: 1024px) { .zr-well { grid-template-columns: 1.55fr 1fr; } }

.zr-card {
  position: relative; min-width: 0;
  border-radius: var(--r-panel); background: var(--card);
  padding: clamp(1.25rem, 3.5vw, 2rem);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
/* The bracket from /demo/access: two opposite corners, opening when the
   reader puts a cursor in the card. Two rather than four, because a full
   frame is a border and the ring token is already the border. */
.zr-card::before, .zr-card::after {
  content: ""; position: absolute; width: 24px; height: 24px; pointer-events: none;
  border-color: var(--violet); border-style: solid; border-width: 0; opacity: 0;
  transition: opacity 320ms var(--ease-out), width 320ms var(--ease-out), height 320ms var(--ease-out);
}
.zr-card::before {
  inset-block-start: -1px; inset-inline-start: -1px;
  border-block-start-width: 2px; border-inline-start-width: 2px;
  border-start-start-radius: var(--r-panel);
}
.zr-card::after {
  inset-block-end: -1px; inset-inline-end: -1px;
  border-block-end-width: 2px; border-inline-end-width: 2px;
  border-end-end-radius: var(--r-panel);
}
.zr-card:focus-within::before, .zr-card:focus-within::after { opacity: 1; width: 34px; height: 34px; }

/* ---- the instrument ----------------------------------------------------
   The stars are the largest thing on the page because rating is the single
   gesture it exists for. They carry the accent because they are DATA — the
   value the reader is setting — and no gold is invented for them.
------------------------------------------------------------------------- */
.zr-inst { display: flex; flex-direction: column; align-items: center; text-align: center; padding-bottom: clamp(1.25rem, 3vw, 1.75rem); }
.zr-inst-q { margin: 0 0 clamp(0.875rem, 2vw, 1.125rem); font-size: clamp(15px, 1.8vw, 17px); font-weight: 700; line-height: 1.6; color: var(--obsidian); }
.zr-stars {
  display: flex; align-items: center; justify-content: center;
  gap: clamp(0.125rem, 1vw, 0.4375rem);
  --star: clamp(36px, 9vw, 54px);
}
.zr-star {
  display: flex; align-items: center; justify-content: center;
  width: calc(var(--star) + 0.5rem); height: calc(var(--star) + 0.5rem);
  border: 0; background: transparent; padding: 0; cursor: pointer; border-radius: 12px;
  color: var(--violet);
  transition: transform 280ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zr-star:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.zr-star-svg { width: var(--star); height: var(--star); display: block; overflow: visible; }
/* Two paths, one shape: the outline is always there so an unrated row is
   still five stars, and the fill grows into it. Scaling the fill from the
   star's own centre is what makes a rating land rather than switch on. */
.zr-star-out { fill: none; stroke: rgba(17,17,17,0.22); stroke-width: 1.5; stroke-linejoin: round; transition: stroke 260ms var(--ease-out); }
.zr-star-in {
  fill: currentColor; transform-origin: 50% 52%; transform: scale(0.34); opacity: 0;
  transition: transform 420ms var(--ease-out), opacity 260ms var(--ease-out);
}
.zr-star[data-on] .zr-star-in { transform: none; opacity: 1; transition-delay: calc(var(--i) * 55ms); }
.zr-star[data-on] .zr-star-out { stroke: var(--violet); transition-delay: calc(var(--i) * 55ms); }
/* The row is being pointed at rather than set: lighter, and it does not
   inherit the cascade delay, so a hover reads instantly. */
.zr-star[data-hover] .zr-star-in { transform: none; opacity: 0.34; transition-delay: 0s; }
.zr-star[data-hover] .zr-star-out { stroke: rgba(94,106,210,0.5); transition-delay: 0s; }
@media (hover: hover) {
  .zr-star:hover { background: rgba(94,106,210,0.07); }
}
@media (prefers-reduced-motion: no-preference) {
  .zr-star[data-pop] { animation: zr-pop 460ms var(--ease-out); }
}
@keyframes zr-pop {
  0% { transform: scale(1); }
  38% { transform: scale(1.16); }
  100% { transform: scale(1); }
}
/* The verdict. Six faces stacked in ONE grid cell, so the window is as tall
   as the tallest and a long word cannot resize the card under the reader. */
.zr-verdict {
  display: grid; overflow: hidden; margin-top: clamp(0.75rem, 2vw, 1rem);
  padding-block: 0.28em; margin-block: -0.28em;
}
.zr-verdict-face {
  grid-area: 1 / 1; justify-self: center;
  font-size: clamp(17px, 2.2vw, 21px); font-weight: 900; line-height: 1.5; color: var(--obsidian);
  transition: transform 460ms var(--ease-out), opacity 300ms var(--ease-out);
}
.zr-verdict-face[data-side="up"] { transform: translateY(-124%); opacity: 0; transition-timing-function: var(--ease-in); }
.zr-verdict-face[data-side="down"] { transform: translateY(124%); opacity: 0; transition-timing-function: var(--ease-in); }
.zr-verdict-face[data-empty] { color: var(--stone-2); font-weight: 700; }
.zr-inst-hint { margin: 0.375rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone-2); }

/* ---- the fields --------------------------------------------------------- */
.zr-rule { height: 1px; background: rgba(17,17,17,0.07); margin-bottom: clamp(1.25rem, 3vw, 1.5rem); }
.zr-form { display: flex; flex-direction: column; }
.zr-pair { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
@media (min-width: 560px) { .zr-pair { grid-template-columns: 1fr 1fr; } }
.zr-f { display: flex; flex-direction: column; min-width: 0; }
.zr-form > .zr-f, .zr-form > .zr-pair { margin-top: 0.875rem; }
.zr-form > .zr-pair:first-child, .zr-form > .zr-f:first-child { margin-top: 0; }
.zr-lab { display: flex; align-items: baseline; gap: 0.375rem; margin-bottom: 0.4375rem; font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zr-req { color: var(--violet); font-weight: 700; }
.zr-opt { font-size: 14.5px; font-weight: 500; color: var(--stone-2); }
.zr-in {
  width: 100%; border: 0; border-radius: var(--r-control);
  padding: 0.6875rem 0.875rem;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.7; letter-spacing: 0;
  color: var(--obsidian); background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zr-in::placeholder { color: var(--ghost); }
.zr-in:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.zr-in:focus { outline: none; background: #fff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15); }
.zr-ltr { text-align: start; }
.zr-area { resize: vertical; min-height: 132px; line-height: 1.9; }
.zr-count {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  margin-top: 0.4375rem; font-size: 14.5px; font-weight: 700; line-height: 1.6; color: var(--stone-2);
}
.zr-count-n { font-variant-numeric: tabular-nums; }
.zr-count[data-met] .zr-count-n { color: var(--violet); }
.zr-count[data-near] .zr-count-n { color: #b45309; }

/* ---- status + action ---------------------------------------------------- */
.zr-status { display: block; margin-top: 0.875rem; }
.zr-err {
  margin: 0; border-radius: var(--r-control); padding: 0.625rem 0.75rem;
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: #b45309;
  background: rgba(180,83,9,0.07); box-shadow: 0 0 0 1px rgba(180,83,9,0.20);
}
.zr-go { display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem; margin-top: 1.25rem; }
.zr-go .sb { flex: 1 1 220px; }
.zr-go-note { flex: 1 1 200px; min-width: 0; margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.8; color: var(--stone-2); }

/* ---- the thank-you -----------------------------------------------------
   THE MOMENT THE REVIEW IS SENT, which is the one screen the reader is
   guaranteed to read to the end — and the one the live channel styles least.

   What it replaces: a 48px green disc at #27a644 (about 2.9:1 on white), a
   heading with -0.6px tracking on Arabic, and a reward card built as a
   violet-to-amber GRADIENT behind a DASHED violet border. That is four house
   rules broken in one panel: a gradient on something that is not the light, a
   second accent hue with no meaning, a green outside the status triad, and
   negative letter-spacing on letterforms that connect.

   Here: the ground stays flat, the ring stays a hairline, the success hue is
   the triad's #15803d and it colours ONLY the mark that reports the state,
   and the accent stays on the thing the accent is for — the rating, and the
   code the rating earned.
------------------------------------------------------------------------- */
.zr-thanks { display: flex; flex-direction: column; align-items: flex-start; }
.zr-tick {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 999px; flex: 0 0 auto;
  background: rgba(21,128,61,0.08); color: #15803d;
  box-shadow: 0 0 0 1px rgba(21,128,61,0.18);
}
.zr-tick svg { width: 19px; height: 19px; }
/* The check DRAWS. A mark that fades in is a picture of a confirmation; one
   that is drawn is the confirmation happening. 26 is the path's own length,
   measured rather than guessed. */
.zr-js .zr-tick-p { stroke-dasharray: 26; stroke-dashoffset: 26; animation: zr-draw 460ms var(--ease-out) 120ms forwards; }
@keyframes zr-draw { to { stroke-dashoffset: 0; } }
.zr-thanks-h {
  margin: 0.875rem 0 0; font-size: clamp(20px, 2.6vw, 25px); font-weight: 900;
  line-height: 1.4; color: var(--obsidian); letter-spacing: 0;
}
/* The rating, read back. The reader set it three fields ago and the panel
   that thanks them for it should show what they actually said. */
.zr-thanks-stars { display: flex; align-items: center; gap: 0.25rem; margin: 0.75rem 0 0; color: var(--violet); }
.zr-thanks-star { width: 17px; height: 17px; }
.zr-thanks-star[data-off] { color: rgba(17,17,17,0.16); }
.zr-thanks-b { margin: 0.875rem 0 0; max-width: 46ch; font-size: 14.5px; font-weight: 500; line-height: 1.95; color: var(--stone); }

/* ---- the reward --------------------------------------------------------
   A flat panel on the field fill behind one hairline: the same object as
   every other panel on the page, which is the point. The code is the only
   Latin run in the card, so it gets the tracking and the accent and nothing
   else does.
------------------------------------------------------------------------- */
.zr-code { width: 100%; margin-top: 1.25rem; border-radius: var(--r-card); padding: clamp(0.875rem, 2.5vw, 1.125rem); background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.08); }
.zr-code-head { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem; font-size: 14.5px; font-weight: 900; line-height: 1.6; color: var(--obsidian); }
.zr-code-head svg { color: var(--violet); flex: 0 0 auto; }
.zr-code-row {
  display: inline-flex; align-items: center; gap: 0.875rem; max-width: 100%;
  border: 0; cursor: pointer; font: inherit; text-align: start;
  border-radius: var(--r-control); padding: 0.5625rem 0.875rem;
  background: var(--card); box-shadow: 0 0 0 1px rgba(94,106,210,0.28);
  transition: box-shadow 220ms var(--ease-out);
}
.zr-code-row:hover { box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.12); }
.zr-code-row:focus-visible { outline: none; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.20); }
.zr-code-row[data-copied] { box-shadow: 0 0 0 1px #15803d, 0 0 0 4px rgba(21,128,61,0.12); }
.zr-code-str { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 16px; font-weight: 900; line-height: 1.5; letter-spacing: 0.14em; color: var(--violet); }
.zr-code-ico { flex: 0 0 auto; display: flex; color: var(--stone-2); transition: color 200ms var(--ease-out); }
.zr-code-row[data-copied] .zr-code-ico { color: #15803d; }
.zr-code-note { margin: 0.75rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone-2); }

/* ---- what happens next, and the honest edge ----------------------------- */
.zr-next { display: flex; align-items: flex-start; gap: 0.5rem; margin: 1.25rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.9; color: var(--stone); }
.zr-next svg { flex: 0 0 auto; margin-top: 0.3125rem; color: var(--violet); }
/* THE STANDING NOTE IS NOT A STATUS, so it is not tinted like one. It was
   built as an amber panel — amber fill, amber hairline, amber bold text — and
   that breaks the rule this house keeps about the status triad: a status hue
   may colour the pill or the icon that REPORTS a state, never a card fill and
   never body text. Nothing here is reporting a state; the page is telling the
   reader what it is. So the panel is the same field fill and hairline as every
   other panel on the page, the text is the same grey as every other note, and
   the one amber thing on it is the 14px mark that flags it. */
.zr-demo {
  display: flex; align-items: flex-start; gap: 0.5625rem;
  width: 100%; margin-top: 1.25rem; border-radius: var(--r-card);
  padding: 0.8125rem 1rem; background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
}
.zr-demo svg { flex: 0 0 auto; margin-top: 0.25rem; color: #b45309; }
.zr-demo p { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.9; color: var(--stone); }
.zr-thanks-go { display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem; margin-top: 1.25rem; width: 100%; }
.zr-thanks-go .sb { flex: 1 1 220px; }
/* The hit box is padded and the padding is pulled straight back out, so the
   target clears the 24px floor (32 under a coarse pointer) without the label
   moving a pixel off the baseline it shares with the action beside it.
   Measured at 390: it was 15px tall rendered before this. */
.zr-quiet {
  border: 0; background: transparent; font: inherit; cursor: pointer;
  padding: 0.5rem 0.375rem; margin: -0.5rem -0.375rem;
  font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone);
  border-radius: 8px;
  transition: color 160ms var(--ease-out), background-color 160ms var(--ease-out);
}
.zr-quiet:hover { color: var(--obsidian); background: rgba(17,17,17,0.04); }
.zr-quiet:focus-visible { outline: 2px solid var(--violet); outline-offset: 1px; }
@media (pointer: coarse) {
  .zr-quiet { padding-block: 0.6875rem; margin-block: -0.6875rem; }
}

/* The panel arrives in sequence rather than as a block: mark, then heading,
   then rating, then message, then reward. It reads in the order it is meant
   to be read. Under .zr-js only, and off entirely for reduced motion. */
.zr-js .zr-thanks > * { animation: zr-rise 520ms var(--ease-out) both; animation-delay: calc(var(--i, 0) * 90ms); }
@keyframes zr-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* ---- the aside ---------------------------------------------------------- */
.zr-aside { display: flex; flex-direction: column; gap: clamp(1rem, 2.5vw, 1.5rem); min-width: 0; }
.zr-note-card {
  border-radius: var(--r-panel); background: var(--card);
  padding: clamp(1.25rem, 3.5vw, 1.625rem);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.zr-note-head { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem; font-size: 14.5px; font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zr-note-head svg { color: var(--violet); flex: 0 0 auto; }
.zr-note-b { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.95; color: var(--stone); }
.zr-reward {
  display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;
  margin-bottom: 0.625rem;
}
.zr-reward-n { font-size: clamp(26px, 3.4vw, 34px); font-weight: 900; line-height: 1.24; color: var(--violet); font-variant-numeric: tabular-nums; }
.zr-reward-l { font-size: 14.5px; font-weight: 700; line-height: 1.6; color: var(--obsidian); }

/* ---- the pipeline ------------------------------------------------------
   Three beats on one spine, not three cards. A card each would say they are
   three separate things a reader chooses between; they are one sequence a
   review actually travels.
------------------------------------------------------------------------- */
.zr-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.zr-step { position: relative; display: flex; gap: 0.75rem; padding-bottom: 1.125rem; }
.zr-step:last-child { padding-bottom: 0; }
/* The spine runs BETWEEN the marks, so it stops at the last one instead of
   trailing off under the final line. */
.zr-step:not(:last-child)::before {
  content: ""; position: absolute; top: 26px; bottom: 4px;
  inset-inline-start: 12px; width: 1px; background: rgba(17,17,17,0.10);
}
.zr-step-n {
  position: relative; z-index: 1; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  width: 25px; height: 25px; border-radius: 999px;
  background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  font-size: 14.5px; font-weight: 900; line-height: 1; color: var(--stone);
  font-variant-numeric: tabular-nums;
}
.zr-step[data-live] .zr-step-n { background: var(--violet); color: #fff; box-shadow: 0 0 0 4px rgba(94,106,210,0.15); }
.zr-step-t { min-width: 0; }
.zr-step-h { margin: 0.1875rem 0 0.25rem; font-size: 14.5px; font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zr-step-b { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.9; color: var(--stone); }

/* ---- the wall ----------------------------------------------------------
   Where approved reviews will stand. It holds PLACEHOLDERS, clearly labelled
   as placeholders: the site refuses to print invented testimonials, and a
   demo that fills the gap with three plausible founders would be exactly the
   thing being refused, in a nicer typeface.
------------------------------------------------------------------------- */
.zr-wall { padding-top: clamp(3rem, 7vw, 5.5rem); padding-bottom: clamp(1rem, 3vw, 2rem); }
.zr-wall-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.75rem; margin-bottom: clamp(1rem, 2.5vw, 1.5rem); }
.zr-h2 { margin: 0; font-size: clamp(22px, 3.2vw, 32px); font-weight: 900; line-height: 1.36; color: var(--obsidian); }
.zr-wall-count { margin: 0; font-size: 14.5px; font-weight: 700; line-height: 1.6; color: var(--stone-2); }
.zr-slots { display: grid; grid-template-columns: 1fr; gap: clamp(0.75rem, 2vw, 1rem); }
@media (min-width: 720px) { .zr-slots { grid-template-columns: repeat(3, 1fr); } }
.zr-slot {
  position: relative; min-width: 0; overflow: hidden;
  border-radius: var(--r-card); padding: clamp(1rem, 2.5vw, 1.25rem);
  background: rgba(255,255,255,0.5);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.07);
}
.zr-slot-stars { display: flex; gap: 0.1875rem; margin-bottom: 0.75rem; color: rgba(17,17,17,0.13); }
.zr-slot-star { width: 14px; height: 14px; }
.zr-line { display: block; height: 9px; border-radius: 999px; background: rgba(17,17,17,0.06); margin-bottom: 0.5rem; }
.zr-line:last-of-type { margin-bottom: 0; }
.zr-slot-who { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; }
.zr-slot-av { width: 24px; height: 24px; border-radius: 999px; background: rgba(17,17,17,0.06); flex: 0 0 auto; }
.zr-slot-tag {
  position: absolute; inset-inline-end: clamp(1rem, 2.5vw, 1.25rem); inset-block-start: clamp(1rem, 2.5vw, 1.25rem);
  font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
}
.zr-slot[data-first] { background: var(--card); box-shadow: 0 0 0 1px rgba(94,106,210,0.30), 0 0 0 4px rgba(94,106,210,0.08); }
.zr-slot[data-first] .zr-slot-tag { color: var(--violet); }
/* One slow sweep across the placeholders, so the wall reads as WAITING
   rather than as three cards that failed to load. It runs once per slot on a
   long cycle and is off entirely for reduced motion. */
@media (prefers-reduced-motion: no-preference) {
  .zr-slot::after {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(100deg, transparent 40%, rgba(94,106,210,0.06) 50%, transparent 60%);
    transform: translateX(-100%);
    animation: zr-sweep 4.8s var(--ease-out) infinite calc(var(--i, 0) * 900ms);
  }
}
@keyframes zr-sweep {
  0% { transform: translateX(-100%); }
  55%, 100% { transform: translateX(100%); }
}
.zr-wall-b { margin: clamp(1rem, 2.5vw, 1.5rem) 0 0; max-width: 62ch; font-size: 14.5px; font-weight: 500; line-height: 1.95; color: var(--stone); }

/* ---- the standing note -------------------------------------------------- */
.zr-foot-note {
  width: min(100%, 640px); margin: clamp(2rem, 5vw, 3.25rem) 0 clamp(2rem, 5vw, 3rem);
  font-size: 14.5px; font-weight: 500; line-height: 1.9; color: var(--stone);
}
.zr-link { color: var(--violet); font-weight: 700; text-underline-offset: 3px; }
.zr-link:hover { text-decoration: underline; }

/* ---- arrival -----------------------------------------------------------
   The hidden half lives under .zr-js, which the script adds on mount, so a
   browser that never runs it reads a finished page. A resting state is the
   finished state; this codebase has shipped the opposite twice.
------------------------------------------------------------------------- */
.zr-js [data-reveal] { opacity: 0; transform: translateY(18px); }
.zr-js [data-reveal][data-in] {
  opacity: 1; transform: none;
  transition:
    opacity 640ms var(--ease-out) calc(var(--i, 0) * 70ms),
    transform 640ms var(--ease-out) calc(var(--i, 0) * 70ms);
}
@media (prefers-reduced-motion: reduce) {
  .zr-js [data-reveal] { opacity: 1; transform: none; transition: none; }
  .zr-js .zr-h1-mark::after { transform: none; }
  .zr-star, .zr-star-in, .zr-star-out, .zr-verdict-face, .zr-in, .zr-slot-grow { transition: none; }
  /* The confirmation still has to BE there, so the mark rests drawn and the
     panel rests visible rather than animating into place. */
  .zr-js .zr-thanks > * { animation: none; }
  .zr-js .zr-tick-p { stroke-dashoffset: 0; animation: none; }
}

/* ---- the remodel -------------------------------------------------------
   THE CARD IS ONE OBJECT THAT CHANGES STATE, not two cards that swap. Asking
   for the review and thanking for it are the same surface at two moments, so
   the instrument and the form collapse on grid-template-rows while the
   thank-you grows in the same motion — the mechanic /demo/access uses for the
   same reason, and the one way to transition to an auto height without
   hard-coding a pixel the contents will outgrow.

   VISIBILITY, NOT JUST OPACITY: a collapsed form has to leave the tab order
   as well as the page, and a hidden-but-focusable control is the standard way
   that goes wrong.

   AND THE CLIP IS ONLY ON WHILE IT MOVES. The focus halo is 4px OUTSIDE the
   input, so a slot that stayed clipped would slice the ring off every field
   in it and take away the one signal that says where the reader is. This bug
   is recorded on /demo/access; it does not get to ship again here.
------------------------------------------------------------------------- */
.zr-slot-grow {
  display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden;
  transition: grid-template-rows 440ms var(--ease-out), opacity 320ms var(--ease-out), visibility 0s linear 440ms;
}
.zr-slot-grow[data-on] { grid-template-rows: 1fr; opacity: 1; visibility: visible; transition-delay: 0s, 0s, 0s; }
.zr-slot-grow-clip { min-height: 0; }
.zr-slot-grow[data-moving] > .zr-slot-grow-clip, .zr-slot-grow:not([data-on]) > .zr-slot-grow-clip { overflow: hidden; }

/* ---- narrow ------------------------------------------------------------- */
@media (max-width: 480px) {
  .zr-open { padding-top: clamp(2rem, 8vw, 3rem); }
  .zr-inst-q { font-size: 14.5px; }
}
/* A coarse pointer gets a bigger target than a mouse does, on the one
   control the whole page turns on. */
@media (pointer: coarse) {
  .zr-star { width: calc(var(--star) + 0.75rem); height: calc(var(--star) + 0.75rem); }
}


/* ---------------------------------------------------------------------------
   TARGET FLOOR.

   Every control on this page has to measure at least 32 RENDERED pixels on
   both axes. components/ZoomLock.tsx writes zoom: 0.85 on the document
   element always, so a length authored in CSS reaches the screen at 85% of
   itself: the CSS floor is 38, not 32. Measured before this block, at 360 to
   1440: .zr-round 27.2x27.2, .zr-phone-mark 75x13.6, .zr-mark 79x14.4, .zr-account 41.8x28.3.

   Inline links inside a sentence are deliberately not here. WCAG 2.5.8
   exempts them, and it has to - an inline link inherits the line box of the
   prose around it, so giving one a 32px target means giving every paragraph
   that contains a link a 32px line height.
--------------------------------------------------------------------------- */
.zr-round {
  min-width: 38px;
  min-height: 38px;
}
.zr-phone-mark,
.zr-mark,
.zr-account,
.zr-account-phone,
.zr-nav-item,
.zr-tray-row,
.zr-star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
}
`
