/**
 * The candidate contact page's stylesheet.
 *
 * Its own module for the reason app/demo/access/styles.ts and
 * app/demo/review/styles.ts both record: a style element written inside a
 * component is one identical copy of the whole block per render, and a
 * 600-line template literal in the middle of JSX makes both halves harder to
 * read.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * TWO FLOORS ARE HELD HERE, and both are measured in RENDERED pixels rather
 * than CSS pixels, because components/ZoomLock.tsx writes CSS zoom: 0.85 on
 * the document element and a finger lands on what is rendered, not on what is
 * declared. So a control that must be 32px under a coarse pointer is written
 * at 38px, and one that must be 24px is written at 30px. Every number in this
 * file that looks generous is that division, not padding for its own sake.
 */

export const CSS = `
.zc-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  /* The three greys that PASS, carried over from /demo/review unchanged.
     Measured on the ground and on the field fill: 7:1, 5.45:1 and 4.81:1.
     The live contact page's thinned greys (a #9ca3af placeholder at 2.31:1 on
     its own field, text-muted/35 stars at 1.69:1) are not copied over. */
  --stone: #56565a;
  --stone-2: #66666e;
  --ghost: #6b6b73;
  --violet: #5e6ad2;
  /* THE ACCENT'S TEXT WEIGHT, and it is not a second hue: #4f5ab8 is
     --primary-600 in app/globals.css, the same brand violet one step down.
     #5e6ad2 is a mark colour, not a reading colour: measured 4.28:1 on the
     field fill, which is under the floor for 12.5px text. The darker step is
     5.48:1 there and 5.77:1 on the ground, so every violet RUN OF TEXT uses
     it while every violet DOT, RULE, ICON and FILL keeps #5e6ad2. */
  --violet-ink: #4f5ab8;
  --field: #f4f4f6;
  /* THE FOOTER READS THESE OFF THE HOST PAGE'S ROOT, and it is not optional.
     PricingFooter paints its cap with background: var(--onyx) and colours its
     mail link with var(--violet-lift) while declaring neither. Without them
     the cap falls back to transparent, the footer's #a8a8b2 body text stands
     on white paper at 2.36:1 instead of 7.87:1 on obsidian, and the header
     has no dark ground left to invert over. Measured, not guessed. */
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
  /* Arabic letterforms connect. Nothing on this page tracks in or out. */
  letter-spacing: 0;
}
/* The ground is painted behind the whole viewport as well as behind the
   content, so a short page cannot show the body's own warm paper under the
   cap. */
.zc-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* ---- header: the candidate set's, mechanic and all ---------------------- */
.zc-head { position: sticky; top: 0; z-index: 50; display: flex; justify-content: center; padding: 2rem 0 0; pointer-events: none; }
.zc-pill, .zc-phone-pill { pointer-events: auto; }
.zc-phone-pill {
  width: fit-content; max-width: 100%; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: min-width 380ms var(--ease-out) 220ms, background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
}
.zc-phone-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.375rem; height: 48px; padding-inline: 0.375rem; }
/* 38px of hit box around a 16px mark. The link was as tall as its own SVG,
   which measured 13.6px rendered: a logo is still a target. */
.zc-phone-mark { display: flex; align-items: center; justify-content: center; justify-self: center; min-height: 38px; padding-inline: 0.5rem; }
.zc-mark-svg-sm { height: 16px; color: #000; }
/* 38px, not 32: rendered under the root zoom that is 32.3px, which is the
   floor a coarse pointer is owed. */
.zc-round { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
.zc-round:hover { background: rgba(0,0,0,0.05); }
.zc-account-phone { justify-self: end; }
.zc-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
@media (min-width: 768px) { .zc-phone-pill { display: none; } }
@media (max-width: 767px) { .zc-pill { display: none; } }
.zc-pill {
  border-radius: 24px; overflow: hidden; width: 380px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
  contain: layout paint;
}
@media (prefers-reduced-transparency: reduce) { .zc-pill, .zc-phone-pill { background: #f2f2f5; -webkit-backdrop-filter: none; backdrop-filter: none; } }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .zc-pill, .zc-phone-pill { background: #f2f2f5; } }
.zc-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.zc-side { display: flex; align-items: center; min-width: 0; }
.zc-side-start { justify-content: flex-start; }
.zc-side-end { justify-content: flex-end; }
.zc-mark { display: flex; align-items: center; min-height: 30px; padding: 0 0.5rem; flex-shrink: 0; }
.zc-mark-svg { height: 17px; color: #000; }
.zc-head[data-dark] .zc-pill, .zc-head[data-dark] .zc-phone-pill {
  background: rgba(32,32,38,0.72);
  box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5);
}
.zc-head[data-dark] .zc-mark-svg, .zc-head[data-dark] .zc-mark-svg-sm { color: #fafafa; }
.zc-head[data-dark] .zc-nav-item, .zc-head[data-dark] .zc-tray-row, .zc-head[data-dark] .zc-round { color: rgba(250,250,250,0.66); }
.zc-head[data-dark] .zc-nav-item:hover, .zc-head[data-dark] .zc-tray-row:hover { color: #fafafa; }
.zc-head[data-dark] .zc-sep { background: rgba(250,250,250,0.16); }
.zc-head[data-dark] .zc-account { background: #fafafa; color: #171717; }
.zc-nav { display: flex; align-items: center; gap: 0.125rem; }
.zc-nav-item { border-radius: 999px; padding: 0.625rem 0.75rem; font-size: 14px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.zc-nav-item:hover { color: var(--obsidian); }
.zc-nav-item[aria-current] { color: var(--obsidian); font-weight: 700; }
.zc-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); transition: background-color 520ms var(--ease-out); }
.zc-account { border-radius: 999px; padding: 0.6875rem 1rem; font-size: 14px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out), background-color 520ms var(--ease-out), color 520ms var(--ease-out); }
.zc-account:hover { opacity: 0.86; }
.zc-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.zc-drawer[data-open] { transition-delay: 0s, 0s; }
.zc-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zc-tray-row { display: block; border-radius: 8px; padding: 0.6875rem 0.75rem; font-size: 14px; line-height: 1.24; text-decoration: none; color: #666; }
.zc-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

/* ---- the measure -------------------------------------------------------
   The same 1120px column the rest of the candidate set is laid out in, so
   the opening, the channels, the form and the cap line up on two edges.
------------------------------------------------------------------------- */
.zc-wrap { width: min(100%, 1120px); margin-inline: auto; }

/* ---- the opening -------------------------------------------------------- */
.zc-open { padding-top: clamp(3rem, 8vw, 6.5rem); padding-bottom: clamp(1.5rem, 3.5vw, 2.25rem); }
.zc-eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 0 1rem;
  font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
}
.zc-eyebrow-dot { width: 5px; height: 5px; border-radius: 999px; background: var(--violet); }
.zc-h1 {
  margin: 0; max-width: 16ch;
  font-size: clamp(32px, 5.6vw, 54px); font-weight: 900; line-height: 1.3; color: var(--obsidian);
}
/* The one word the page is about, underlined by a violet rule that draws
   itself once. The accent reports the subject; it does not decorate the
   heading. */
.zc-h1-mark { position: relative; white-space: nowrap; }
.zc-h1-mark::after {
  content: ""; position: absolute; inset-inline: -0.06em; bottom: 0.02em; height: 0.075em;
  border-radius: 999px; background: var(--violet); transform-origin: right center;
}
.zc-js .zc-h1-mark::after { transform: scaleX(0); }
.zc-js [data-in] .zc-h1-mark::after { transform: none; transition: transform 720ms var(--ease-out) 260ms; }
.zc-lede {
  margin: clamp(0.875rem, 2vw, 1.25rem) 0 0; max-width: 54ch;
  font-size: clamp(14.5px, 1.6vw, 16.5px); font-weight: 500; line-height: 1.95; color: var(--stone);
}
.zc-promise {
  display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.25rem;
  border-radius: 999px; padding: 0.5rem 0.875rem;
  background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.07);
  font-size: 13px; font-weight: 700; line-height: 1.6; color: var(--stone);
}
.zc-promise svg { color: var(--violet); flex: 0 0 auto; }

/* ---- the channels ------------------------------------------------------
   FIRST ON A PHONE, AND DELIBERATELY SO. Most people who open a contact page
   on a phone want the address, not the form: they are already holding a mail
   client. So the three real ways to reach Zenya stand above the form rather
   than in a column beside it, where a phone would have pushed them below a
   nine-field card.

   Each row is one link, 68px tall, which is 58px rendered under the root
   zoom. min-width: 0 on the text column and an ellipsis on the value, which
   is the rule this page cannot skip: a long address in a flex child with the
   default min-width: auto widens the row past the screen and takes the whole
   document with it.
------------------------------------------------------------------------- */
.zc-ch { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
@media (min-width: 640px) { .zc-ch { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.zc-ch-row {
  display: flex; align-items: center; gap: 0.75rem; min-width: 0;
  min-height: 68px; padding: 0.75rem 0.875rem;
  border-radius: var(--r-card); background: var(--card); text-decoration: none;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  transition: box-shadow 220ms var(--ease-out), transform 220ms var(--ease-out);
}
.zc-ch-row:hover { box-shadow: 0 0 0 1px rgba(94,106,210,0.35), 0 0 0 4px rgba(94,106,210,0.10); }
.zc-ch-row:focus-visible { outline: none; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.20); }
.zc-ch-ico {
  display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  width: 38px; height: 38px; border-radius: var(--r-control);
  background: var(--field); color: var(--violet);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.06);
}
.zc-ch-t { min-width: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.zc-ch-l { font-size: 12.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2); }
.zc-ch-v {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 14.5px; font-weight: 700; line-height: 1.6; color: var(--obsidian);
}
/* The mark at the far end of the row. A full-width row with its content
   hugging one side leaves the other side reading as dead space rather than as
   a target, so the affordance is put where the space is. It leans a little on
   hover, and not at all under reduced motion. */
.zc-ch-go { margin-inline-start: auto; flex: 0 0 auto; display: flex; color: var(--stone-2); transition: color 200ms var(--ease-out), transform 260ms var(--ease-out); }
.zc-ch-row:hover .zc-ch-go { color: var(--violet); transform: translate(-2px, -2px); }
@media (prefers-reduced-motion: reduce) { .zc-ch-go { transition: none; } .zc-ch-row:hover .zc-ch-go { transform: none; } }
.zc-ch-note { margin: 0.75rem 0 0; font-size: 12.5px; font-weight: 500; line-height: 1.85; color: var(--stone-2); }

/* ---- the well ----------------------------------------------------------
   1.55fr / 1fr rather than two halves, the split /demo/review settled on: the
   form is the object and the column beside it is the note.
------------------------------------------------------------------------- */
.zc-well { display: grid; grid-template-columns: 1fr; gap: clamp(1rem, 2.5vw, 1.5rem); align-items: start; margin-top: clamp(1.5rem, 4vw, 2.5rem); }
@media (min-width: 1024px) { .zc-well { grid-template-columns: 1.55fr 1fr; } }

.zc-card {
  position: relative; min-width: 0;
  border-radius: var(--r-panel); background: var(--card);
  padding: clamp(1.25rem, 3.5vw, 2rem);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
/* The bracket from /demo/access and /demo/review: two opposite corners that
   open when the reader puts a cursor in the card. Two rather than four,
   because a full frame is a border and the ring token is already the border. */
.zc-card::before, .zc-card::after {
  content: ""; position: absolute; width: 24px; height: 24px; pointer-events: none;
  border-color: var(--violet); border-style: solid; border-width: 0; opacity: 0;
  transition: opacity 320ms var(--ease-out), width 320ms var(--ease-out), height 320ms var(--ease-out);
}
.zc-card::before {
  inset-block-start: -1px; inset-inline-start: -1px;
  border-block-start-width: 2px; border-inline-start-width: 2px;
  border-start-start-radius: var(--r-panel);
}
.zc-card::after {
  inset-block-end: -1px; inset-inline-end: -1px;
  border-block-end-width: 2px; border-inline-end-width: 2px;
  border-end-end-radius: var(--r-panel);
}
.zc-card:focus-within::before, .zc-card:focus-within::after { opacity: 1; width: 34px; height: 34px; }

/* ---- the topic, which is the first thing the form asks ------------------
   Five values, one of which is set: a radiogroup, not five buttons. The
   chosen chip is obsidian rather than a violet tint, because the accent on
   this page belongs to the things that carry meaning and "which of five" is
   a selection, not a subject. It also keeps the chosen state legible at
   4.5:1 instead of the live page's violet-on-violet-wash at 3.89:1.
------------------------------------------------------------------------- */
.zc-topic-l { margin: 0 0 0.625rem; font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.zc-chips { display: flex; flex-wrap: wrap; gap: 0.4375rem; }
.zc-chip {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  min-height: 38px; padding: 0.4375rem 0.875rem;
  border: 0; border-radius: 999px; cursor: pointer; font: inherit;
  font-size: 13.5px; font-weight: 700; line-height: 1.5; letter-spacing: 0;
  color: var(--stone); background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  transition: color 200ms var(--ease-out), background-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
}
.zc-chip svg { flex: 0 0 auto; color: var(--stone-2); transition: color 200ms var(--ease-out); }
.zc-chip:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.20); color: var(--obsidian); }
.zc-chip:focus-visible { outline: none; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.20); }
.zc-chip[data-on] { background: var(--obsidian); color: var(--ground); box-shadow: none; }
.zc-chip[data-on] svg { color: var(--violet-lift); }
@media (pointer: coarse) { .zc-chip { min-height: 42px; } }

/* ---- the fields --------------------------------------------------------- */
.zc-rule { height: 1px; background: rgba(17,17,17,0.07); margin: clamp(1.25rem, 3vw, 1.5rem) 0; }
.zc-form { display: flex; flex-direction: column; }
.zc-pair { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
@media (min-width: 560px) { .zc-pair { grid-template-columns: 1fr 1fr; } }
.zc-f { display: flex; flex-direction: column; min-width: 0; }
.zc-form > .zc-f, .zc-form > .zc-pair { margin-top: 0.875rem; }
.zc-form > .zc-pair:first-child, .zc-form > .zc-f:first-child { margin-top: 0; }
.zc-lab { display: flex; align-items: baseline; gap: 0.375rem; margin-bottom: 0.4375rem; font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
/* margin-INLINE-start. The live page writes ml-1 on this asterisk, which in
   an RTL document puts the gap on the far side of the mark instead of
   between the mark and the label it belongs to. Measured there: 4px left,
   0px right. */
.zc-req { margin-inline-start: 0; color: var(--violet); font-weight: 700; }
.zc-opt { font-size: 12px; font-weight: 500; color: var(--stone-2); }
.zc-in {
  width: 100%; border: 0; border-radius: var(--r-control);
  padding: 0.6875rem 0.875rem;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.7; letter-spacing: 0;
  color: var(--obsidian); background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zc-in::placeholder { color: var(--ghost); opacity: 1; }
.zc-in:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.zc-in:focus { outline: none; background: #fff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15); }
.zc-ltr { text-align: start; }
.zc-area { resize: vertical; min-height: 132px; line-height: 1.9; }
.zc-count {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  margin-top: 0.4375rem; font-size: 12px; font-weight: 700; line-height: 1.6; color: var(--stone-2);
}
.zc-count-n { font-variant-numeric: tabular-nums; flex: 0 0 auto; }
.zc-count[data-met] .zc-count-n { color: var(--violet); }
.zc-count[data-near] .zc-count-n { color: #b45309; }

/* ---- the review hand-off ----------------------------------------------
   The one topic this form cannot carry. The real channel refuses a review
   without a star rating, and the star instrument already exists one route
   away at /demo/review, so choosing this topic opens a note that says where
   the rating lives rather than growing a second set of stars here.
------------------------------------------------------------------------- */
.zc-hand {
  display: flex; align-items: flex-start; gap: 0.5625rem;
  margin-top: 0.875rem; border-radius: var(--r-card);
  padding: 0.8125rem 1rem; background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
}
.zc-hand svg { flex: 0 0 auto; margin-top: 0.25rem; color: var(--violet); }
.zc-hand p { margin: 0; font-size: 12.5px; font-weight: 500; line-height: 1.9; color: var(--stone); }

/* ---- status + action ---------------------------------------------------- */
.zc-status { display: block; margin-top: 0.875rem; }
.zc-err {
  margin: 0; border-radius: var(--r-control); padding: 0.625rem 0.75rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.7; color: #b45309;
  background: rgba(180,83,9,0.07); box-shadow: 0 0 0 1px rgba(180,83,9,0.20);
}
.zc-go { display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem; margin-top: 1.25rem; }
.zc-go .sb { flex: 1 1 220px; }
.zc-go-note { flex: 1 1 200px; min-width: 0; margin: 0; font-size: 12px; font-weight: 500; line-height: 1.8; color: var(--stone-2); }

/* ---- the receipt -------------------------------------------------------
   The screen a sender is guaranteed to read, and the live one is a 48px
   #27a644 disc (3.17:1 on white, 2.85:1 on its own tint) under a heading
   tracked to -0.6px on Arabic. Here the hue is the status triad's #15803d at
   4.81:1, it colours ONLY the mark that reports the state, the heading is
   untracked, and the paragraph under it is the product's own words for the
   topic that was chosen.
------------------------------------------------------------------------- */
.zc-done { display: flex; flex-direction: column; align-items: flex-start; }
.zc-tick {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 999px; flex: 0 0 auto;
  background: rgba(21,128,61,0.08); color: #15803d;
  box-shadow: 0 0 0 1px rgba(21,128,61,0.18);
}
.zc-tick svg { width: 19px; height: 19px; }
/* The check DRAWS. 26 is the path's own length, measured rather than
   guessed. A mark that fades in is a picture of a confirmation. */
.zc-js .zc-tick-p { stroke-dasharray: 26; stroke-dashoffset: 26; animation: zc-draw 460ms var(--ease-out) 120ms forwards; }
@keyframes zc-draw { to { stroke-dashoffset: 0; } }
.zc-done-h { margin: 0.875rem 0 0; font-size: clamp(20px, 2.6vw, 25px); font-weight: 900; line-height: 1.4; color: var(--obsidian); letter-spacing: 0; }
.zc-done-b { margin: 0.875rem 0 0; max-width: 46ch; font-size: 14px; font-weight: 500; line-height: 1.95; color: var(--stone); }
/* What the reader actually typed, read back. A receipt that does not show
   the message it received is a picture of a receipt. */
.zc-slip { width: 100%; margin-top: 1.25rem; border-radius: var(--r-card); padding: clamp(0.875rem, 2.5vw, 1.125rem); background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.08); }
.zc-slip dl { margin: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.5rem 0.75rem; }
.zc-slip dt { margin: 0; font-size: 12px; font-weight: 700; line-height: 1.7; color: var(--stone-2); white-space: nowrap; }
.zc-slip dd { margin: 0; min-width: 0; overflow-wrap: anywhere; font-size: 13px; font-weight: 700; line-height: 1.7; color: var(--obsidian); }
.zc-slip-msg { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-weight: 500 !important; }
.zc-demo {
  display: flex; align-items: flex-start; gap: 0.5625rem;
  width: 100%; margin-top: 1.25rem; border-radius: var(--r-card);
  padding: 0.8125rem 1rem; background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
}
/* THE STANDING NOTE IS NOT A STATUS, so it is not tinted like one: the panel
   is the same field fill as every other panel and the one amber thing on it
   is the 14px mark that flags it. The rule /demo/review records. */
.zc-demo svg { flex: 0 0 auto; margin-top: 0.25rem; color: #b45309; }
.zc-demo p { margin: 0; font-size: 12px; font-weight: 500; line-height: 1.9; color: var(--stone); }
.zc-done-go { display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem; margin-top: 1.25rem; width: 100%; }
.zc-done-go .sb { flex: 1 1 220px; }
/* The hit box is padded and the padding is pulled straight back out, so the
   target clears the floor without the label moving off the baseline it
   shares with the action beside it. */
.zc-quiet {
  border: 0; background: transparent; font: inherit; cursor: pointer;
  padding: 0.5rem 0.375rem; margin: -0.5rem -0.375rem;
  font-size: 13px; font-weight: 500; line-height: 1.7; color: var(--stone);
  border-radius: 8px;
  transition: color 160ms var(--ease-out), background-color 160ms var(--ease-out);
}
.zc-quiet:hover { color: var(--obsidian); background: rgba(17,17,17,0.04); }
.zc-quiet:focus-visible { outline: 2px solid var(--violet); outline-offset: 1px; }
@media (pointer: coarse) { .zc-quiet { padding-block: 0.8125rem; margin-block: -0.8125rem; } }

/* The receipt arrives in sequence rather than as a block: mark, heading,
   message, slip, note. Under .zc-js only, off entirely for reduced motion. */
.zc-js .zc-done > * { animation: zc-rise 520ms var(--ease-out) both; animation-delay: calc(var(--i, 0) * 90ms); }
@keyframes zc-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* ---- the aside ---------------------------------------------------------- */
.zc-aside { display: flex; flex-direction: column; gap: clamp(1rem, 2.5vw, 1.5rem); min-width: 0; }
.zc-note-card {
  min-width: 0;
  border-radius: var(--r-panel); background: var(--card);
  padding: clamp(1.25rem, 3.5vw, 1.625rem);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.zc-note-head { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem; font-size: 13.5px; font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zc-note-head svg { color: var(--violet); flex: 0 0 auto; }
.zc-note-b { margin: 0; font-size: 13px; font-weight: 500; line-height: 1.95; color: var(--stone); }
.zc-note-b strong { font-weight: 900; color: var(--obsidian); }

/* ---- the register ------------------------------------------------------
   Who you are actually writing to. A description list, because that is what
   a register entry is: a term and its value. Two columns on a phone would
   put an eight-digit number under a four-word label and wrap both, so the
   rows stack until there is room for them not to.
------------------------------------------------------------------------- */
.zc-reg { margin: 0; display: grid; grid-template-columns: 1fr; gap: 0; }
.zc-reg-row { display: contents; }
.zc-reg dt {
  margin: 0; padding-top: 0.75rem;
  font-size: 12.5px; font-weight: 500; line-height: 1.7; color: var(--stone-2);
}
.zc-reg dd {
  margin: 0 0 0.75rem; min-width: 0; overflow-wrap: anywhere;
  font-size: 14px; font-weight: 700; line-height: 1.7; color: var(--obsidian);
  font-variant-numeric: tabular-nums;
}
.zc-reg > dt:first-of-type { padding-top: 0; }
.zc-reg dd:last-of-type { margin-bottom: 0; }
@media (min-width: 420px) {
  .zc-reg { grid-template-columns: auto minmax(0, 1fr); align-items: baseline; column-gap: 1rem; }
  .zc-reg dt { padding-top: 0; margin-bottom: 0.75rem; white-space: nowrap; }
  .zc-reg dt:last-of-type, .zc-reg dd:last-of-type { margin-bottom: 0; }
}
.zc-reg-pending { font-weight: 500; color: var(--stone); }
.zc-owner {
  display: flex; align-items: center; gap: 0.625rem; min-width: 0;
  margin-bottom: 1rem; padding-bottom: 1rem;
  box-shadow: inset 0 -1px 0 rgba(17,17,17,0.07);
  text-decoration: none;
}
.zc-owner-badge {
  display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  width: 38px; height: 38px; border-radius: var(--r-control);
  background: var(--obsidian); color: var(--ground);
  font-size: 15px; font-weight: 900; line-height: 1;
}
.zc-owner-t { min-width: 0; }
.zc-owner-n { display: flex; align-items: center; gap: 0.375rem; font-size: 14.5px; font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zc-owner-n svg { flex: 0 0 auto; color: var(--stone-2); transition: color 200ms var(--ease-out); }
.zc-owner:hover .zc-owner-n svg { color: var(--violet); }
.zc-owner-r { margin: 0; font-size: 12.5px; font-weight: 500; line-height: 1.6; color: var(--stone-2); }
.zc-owner:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; border-radius: 4px; }

/* ---- the social row ----------------------------------------------------- */
.zc-soc { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; margin-top: 0.875rem; }
.zc-soc a {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 999px;
  color: var(--stone); background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.07);
  transition: color 180ms var(--ease-out), box-shadow 180ms var(--ease-out);
}
.zc-soc a:hover { color: var(--obsidian); box-shadow: 0 0 0 1px rgba(17,17,17,0.20); }
.zc-soc a:focus-visible { outline: none; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.20); }
.zc-soc svg { width: 15px; height: 15px; }

/* ---- the standing note -------------------------------------------------- */
.zc-foot-note {
  width: min(100%, 640px); margin: clamp(2rem, 5vw, 3.25rem) 0 clamp(2rem, 5vw, 3rem);
  font-size: 12.5px; font-weight: 500; line-height: 1.9; color: var(--stone);
}
.zc-link { color: var(--violet-ink); font-weight: 700; text-underline-offset: 3px; }
.zc-link:hover { text-decoration: underline; }

/* ---- arrival -----------------------------------------------------------
   The hidden half lives under .zc-js, which the script adds on mount, so a
   browser that never runs it reads a finished page. A resting state is the
   finished state. The live contact page ships the opposite: its three blocks
   are server-rendered with style="opacity:0;transform:translateY(20px)" and
   the whole page is blank with JavaScript off. Measured, not assumed.
------------------------------------------------------------------------- */
.zc-js [data-reveal] { opacity: 0; transform: translateY(18px); }
.zc-js [data-reveal][data-in] {
  opacity: 1; transform: none;
  transition:
    opacity 640ms var(--ease-out) calc(var(--i, 0) * 70ms),
    transform 640ms var(--ease-out) calc(var(--i, 0) * 70ms);
}
@media (prefers-reduced-motion: reduce) {
  .zc-js [data-reveal] { opacity: 1; transform: none; transition: none; }
  .zc-js .zc-h1-mark::after { transform: none; }
  .zc-chip, .zc-in, .zc-ch-row, .zc-soc a { transition: none; }
  .zc-js .zc-done > * { animation: none; }
  .zc-js .zc-tick-p { stroke-dashoffset: 0; animation: none; }
}

/* ---- the remodel -------------------------------------------------------
   ONE CARD THAT CHANGES STATE, not two cards that swap. Asking for the
   message and confirming it are the same surface at two moments, so the form
   collapses on grid-template-rows while the receipt grows in the same
   motion. The mechanic /demo/access and /demo/review both use, and the one
   way to transition to an auto height without hard-coding a pixel the
   contents will outgrow.

   VISIBILITY, NOT JUST OPACITY: a collapsed form has to leave the tab order
   as well as the page.

   AND THE CLIP IS ONLY ON WHILE IT MOVES, on a TIMER. The focus halo is 4px
   OUTSIDE the input, so a slot that stayed clipped would slice the ring off
   every field in it. transitionend never fires under prefers-reduced-motion,
   which is exactly the reader who can least afford a missing focus ring.
------------------------------------------------------------------------- */
.zc-grow {
  display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden;
  transition: grid-template-rows 440ms var(--ease-out), opacity 320ms var(--ease-out), visibility 0s linear 440ms;
}
.zc-grow[data-on] { grid-template-rows: 1fr; opacity: 1; visibility: visible; transition-delay: 0s, 0s, 0s; }
.zc-grow-clip { min-height: 0; }
.zc-grow[data-moving] > .zc-grow-clip, .zc-grow:not([data-on]) > .zc-grow-clip { overflow: hidden; }

/* ---- narrow ------------------------------------------------------------- */
@media (max-width: 480px) {
  .zc-open { padding-top: clamp(2rem, 8vw, 3rem); }
}
`
