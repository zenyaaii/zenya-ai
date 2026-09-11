/**
 * The candidate auth page's stylesheet.
 *
 * It lives in its own module rather than inline in the view for the reason
 * SlideButton records: a style element inside a component is one identical
 * copy of the whole block per render of that component. This one renders
 * once, so the practical reason here is smaller — the view was 640 lines
 * before the CSS was added to it, and a 400-line template literal in the
 * middle of the JSX makes both halves harder to read.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const CSS = `
.za-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  --stone: #56565a;
  /* A second, quieter grey that still PASSES. The var(--stone-2) this page started
     with — and that /demo/build ships — measures 2.79:1 on white, which is
     not a readable colour for text at any size. This one is 5.69:1. The
     sibling's value is a bug, and a bug does not get copied over. */
  --stone-2: #66666e;
  /* Placeholders sit on the field fill, where this measures 4.81:1. Darker
     than the sibling's for the same reason, and no darker than that: a
     placeholder that reads as a typed value is the other failure mode, and
     this page already made it once with a row of bullets in the password. */
  --ghost: #6b6b73;
  --violet: #5e6ad2;
  --onyx: #131316;
  --field: #f4f4f6;
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
   content, so a short page cannot show the body's own colour under the
   footer. */
.za-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* ---- header: the candidate set's, mechanic and all ---------------------- */
.za-head { position: sticky; top: 0; z-index: 50; display: flex; justify-content: center; padding: 2rem 0 0; pointer-events: none; }
.za-pill, .za-phone-pill { pointer-events: auto; }
.za-phone-pill {
  width: fit-content; max-width: 100%; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: min-width 380ms var(--ease-out) 220ms, background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
}
.za-phone-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.375rem; height: 44px; padding-inline: 0.375rem; }
.za-phone-mark { display: flex; align-items: center; justify-self: center; padding-inline: 0.375rem; }
.za-mark-svg-sm { height: 16px; color: #000; }
.za-round { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
.za-round:hover { background: rgba(0,0,0,0.05); }
.za-account-phone { justify-self: end; }
.za-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
@media (min-width: 768px) { .za-phone-pill { display: none; } }
@media (max-width: 767px) { .za-pill { display: none; } }
.za-pill {
  border-radius: 24px; overflow: hidden; width: 380px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
  contain: layout paint;
}
@media (prefers-reduced-transparency: reduce) { .za-pill, .za-phone-pill { background: #f2f2f5; -webkit-backdrop-filter: none; backdrop-filter: none; } }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .za-pill, .za-phone-pill { background: #f2f2f5; } }
.za-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.za-side { display: flex; align-items: center; min-width: 0; }
.za-side-start { justify-content: flex-start; }
.za-side-end { justify-content: flex-end; }
.za-mark { display: flex; align-items: center; padding: 0 0.375rem; flex-shrink: 0; }
.za-mark-svg { height: 17px; color: #000; }
.za-head[data-dark] .za-pill, .za-head[data-dark] .za-phone-pill {
  background: rgba(32,32,38,0.72);
  box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5);
}
.za-head[data-dark] .za-mark-svg, .za-head[data-dark] .za-mark-svg-sm { color: #fafafa; }
.za-head[data-dark] .za-nav-item, .za-head[data-dark] .za-tray-row, .za-head[data-dark] .za-round { color: rgba(250,250,250,0.66); }
.za-head[data-dark] .za-nav-item:hover, .za-head[data-dark] .za-tray-row:hover { color: #fafafa; }
.za-head[data-dark] .za-sep { background: rgba(250,250,250,0.16); }
.za-head[data-dark] .za-account { background: #fafafa; color: #171717; }
.za-nav { display: flex; align-items: center; gap: 0.125rem; }
.za-nav-item { border-radius: 999px; padding: 0.625rem 0.75rem; font-size: 14px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.za-nav-item:hover { color: var(--obsidian); }
.za-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); transition: background-color 520ms var(--ease-out); }
.za-account { border-radius: 999px; padding: 0.5rem 1rem; font-size: 14px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out), background-color 520ms var(--ease-out), color 520ms var(--ease-out); }
.za-account:hover { opacity: 0.86; }
.za-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.za-drawer[data-open] { transition-delay: 0s, 0s; }
.za-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.za-tray-row { display: block; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 13.5px; line-height: 1.24; text-decoration: none; color: #666; }
.za-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

/* ---- the stage: one object on bare paper -------------------------------
   No min-height in viewport units. The root ZoomLock writes CSS zoom and
   viewport units resolve BEFORE that scale is applied, so a vh-based centring
   parks the card above true centre in exactly the way the hero records.
   Padding, measured, does the job instead.

   Padding-bottom rather than margin-bottom: .zf carries its own margin-top,
   and an adjacent margin here would REPLACE it rather than add to it.
------------------------------------------------------------------------- */
.za-stage {
  display: flex; flex-direction: column; align-items: center;
  /* 112px at 1440. Rendered at 88 / 112 / 136 and compared: 88 leaves the
     card top-heavy with a dead band above the footer, 136 sinks it toward the
     cap. 112 holds it between the two. */
  padding-top: clamp(3rem, 8vw, 7rem);
  padding-bottom: clamp(2rem, 4vw, 3rem);
}

/* ---- the signature ------------------------------------------------------
   Centred on the CARD rather than on the stage: the stage also holds the
   standing note, so centring there drops the mark half a note's height below
   the object it is standing behind.

   It goes away below 900px. At that width the card is nearly the whole
   measure, so the mark would be entirely hidden behind it except for a sliver
   at each end — and a sliver of a wordmark reads as a rendering fault rather
   than as a signature.
------------------------------------------------------------------------- */
.za-well { position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; }
.za-sig {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 0; width: min(78vw, 860px); pointer-events: none;
  opacity: 0.075;
}
.za-sig-svg { display: block; width: 100%; height: auto; color: var(--obsidian); }
@media (max-width: 900px) { .za-sig { display: none; } }

/* ---- the card ----------------------------------------------------------- */
.za-card {
  z-index: 1;
  position: relative;
  width: min(100%, 452px);
  border-radius: var(--r-panel); background: var(--card);
  padding: clamp(1.5rem, 4vw, 2.25rem);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
}
.za-card-mark { display: inline-flex; margin-bottom: clamp(1.25rem, 3vw, 1.75rem); }
.za-card-mark-svg { height: 18px; color: #000; }

/* ---- the switch --------------------------------------------------------
   A two-state choice the whole card reshapes around, so it is a control you
   can see rather than a link under the fold. The indicator is a transform
   between two halves: it MOVES rather than being redrawn, which is the
   difference between a switch and two buttons that change colour.
------------------------------------------------------------------------- */
.za-switch {
  position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  padding: 3px; border-radius: 999px; background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  margin-bottom: clamp(1.25rem, 3vw, 1.625rem);
}
.za-switch-ind {
  position: absolute; z-index: 0; inset-block: 3px; inset-inline-start: 3px;
  width: calc(50% - 3px); border-radius: 999px; background: var(--violet);
  box-shadow: 0 0 0 4px rgba(94,106,210,0.15);
  transition: transform 420ms var(--ease-out), opacity 260ms var(--ease-out);
}
/* The indicator rests on the inline-start half — the RIGHT one here — and the
   view moves it with a NEGATIVE translateX. A transform percentage is always
   physical, never logical: it does not follow dir, so trusting translateX(100%)
   to travel toward the start side sends the indicator off the card in RTL. */
.za-switch[data-off] .za-switch-ind { opacity: 0; }
.za-tab {
  position: relative; z-index: 1; border: 0; background: transparent; cursor: pointer; font: inherit;
  border-radius: 999px; padding: 0.5rem 0.5rem;
  font-size: 13.5px; font-weight: 700; line-height: 1.5; color: var(--stone);
  transition: color 300ms var(--ease-out);
}
.za-tab[data-on] { color: #fff; }
.za-switch[data-off] .za-tab[data-on] { color: var(--stone); }
.za-tab:hover { color: var(--obsidian); }
.za-tab[data-on]:hover { color: #fff; }
.za-switch[data-off] .za-tab:hover { color: var(--obsidian); }

/* ---- the rolls ---------------------------------------------------------
   Faces stacked in ONE grid cell, so the window is as tall as the tallest of
   them: a subline that wraps to two lines on a phone sets the height for all
   four instead of being sliced. The clip gives the movement an edge to arrive
   from — the house rule is that words arrive from an edge rather than fading
   in mid-air — and the block padding is grace for the descenders of
   ج ح خ ع غ م ه ي, pulled back out of the layout by the negative margin.
------------------------------------------------------------------------- */
.za-heads { margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem); }
.za-roll {
  display: grid; overflow: hidden;
  padding-block: 0.24em; margin-block: -0.24em;
  padding-inline: 0.5rem; margin-inline: -0.5rem;
}
.za-roll-face {
  grid-area: 1 / 1; align-self: start;
  transition: transform 480ms var(--ease-out), opacity 320ms var(--ease-out);
}
.za-roll-face[data-side="up"] { transform: translateY(-122%); opacity: 0; transition-timing-function: var(--ease-in); }
.za-roll-face[data-side="down"] { transform: translateY(122%); opacity: 0; transition-timing-function: var(--ease-in); }
.za-roll-h { margin: 0; font-size: clamp(22px, 2.6vw, 27px); font-weight: 900; line-height: 1.36; color: var(--obsidian); }
.za-roll-s { margin-top: 0.5rem; font-size: 14px; font-weight: 500; line-height: 1.8; color: var(--stone); }

/* ---- the form ----------------------------------------------------------- */
.za-form { display: flex; flex-direction: column; }
.za-f { display: flex; flex-direction: column; }
.za-lab { display: block; margin-bottom: 0.4375rem; font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.za-req { color: var(--violet); font-weight: 700; }
.za-in {
  width: 100%; border: 0; border-radius: var(--r-control);
  padding: 0.6875rem 0.875rem;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.7; letter-spacing: 0;
  color: var(--obsidian); background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.za-in::placeholder { color: var(--ghost); }
.za-in:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
/* The violet says "you are here", which is the one thing an accent on a form
   is genuinely for. */
.za-in:focus {
  outline: none; background: #fff;
  box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15);
}
.za-ltr { text-align: start; }
.za-pass { position: relative; }
.za-in-pass { padding-inline-end: 2.875rem; }
.za-eye {
  position: absolute; inset-inline-end: 0.4375rem; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;
  border: 0; background: transparent; cursor: pointer; border-radius: 7px; color: var(--stone);
  transition: color 160ms var(--ease-out), background-color 160ms var(--ease-out);
}
.za-eye:hover { color: var(--obsidian); background: rgba(17,17,17,0.05); }
.za-eye:focus-visible { outline: 2px solid var(--violet); outline-offset: 1px; }

/* ---- the form's rhythm -------------------------------------------------
   THE ROW GAP IS ON THE ROW, NOT ON THE CONTAINER. A flex gap would keep
   spacing a slot that has collapsed to zero height, so signing in would carry
   a ghost of the sign-up rows it is not showing.

   And inside a slot the gap is PADDING ON THE CLIP, never a margin on its
   child. The clip drops back to overflow:visible once it has finished moving
   — that is what keeps it from slicing the focus halo off the field inside —
   and at that instant a child's top margin would stop being contained and
   collapse out through it, which lands as a jump exactly when the motion is
   meant to be settling.
------------------------------------------------------------------------- */
.za-form > .za-f { margin-top: 0.875rem; }
/* The door and the chooser are not form rows; they get a real lead-in. */
.za-accs, .za-hand { margin-top: 1.25rem; }
/* THE GAP GOES ON A WRAPPER INSIDE THE CLIP, NOT ON THE CLIP.
   min-height:0 is what lets a 0fr row actually resolve to zero, and padding
   is not subject to min-height — so a padded clip collapses to exactly its
   own padding and every hidden row leaves a 14px ghost behind. Measured:
   sign-in carried 42px of sign-up it was not showing. Inside the clip the
   same padding is content, so it collapses and is clipped with everything
   else. */
.za-slot-pad { padding-top: var(--za-gap, 0.875rem); }
.za-go { margin-top: 1.25rem; }
.za-alt { margin-top: 1rem; }
/* The meter belongs to the field above it rather than being a row of its own,
   and .za-f no longer carries a flex gap that would space it while collapsed. */
.za-f .za-slot { --za-gap: 0.5rem; }
/* The status row's own gap lives in its slot too, so an empty status is
   genuinely zero-height rather than a 14px band above the action. */
.za-status { margin-top: 0; }

/* ---- the growing slot ---------------------------------------------------
   grid-template-rows 0fr -> 1fr is the one way to transition to an auto
   height without hard-coding a pixel the contents will outgrow.

   THE CLIP IS ONLY ON WHILE IT MOVES: the focus halo is 4px OUTSIDE the
   input, so a slot that stayed clipped would slice the ring off the field
   inside it and take away the one signal that says where the reader is.
   visibility rather than aria-hidden, because a collapsed field must leave
   the tab order as well as the accessibility tree, and a hidden-but-focusable
   control is the standard way that goes wrong.
------------------------------------------------------------------------- */
.za-slot {
  display: grid; grid-template-rows: 0fr; visibility: hidden;
  transition: grid-template-rows 440ms var(--ease-out), opacity 320ms var(--ease-out), visibility 0s linear 440ms;
  opacity: 0;
}
.za-slot[data-on] { grid-template-rows: 1fr; visibility: visible; opacity: 1; transition-delay: 0s, 0s, 0s; }
.za-slot-clip { min-height: 0; }
.za-slot[data-moving] > .za-slot-clip, .za-slot:not([data-on]) > .za-slot-clip { overflow: hidden; }

/* ---- the password rule --------------------------------------------------
   The one rule the product actually enforces, shown while it is being met.
   Violet as progress, which is the accent doing work rather than decorating.
------------------------------------------------------------------------- */
.za-meter { display: flex; align-items: center; gap: 0.5rem; }
.za-meter-track { flex: 1; height: 4px; border-radius: 999px; background: rgba(17,17,17,0.08); overflow: hidden; }
.za-meter-fill {
  display: block; height: 100%; border-radius: 999px; background: var(--violet);
  transform-origin: right center; transition: transform 480ms var(--ease-out), background-color 300ms var(--ease-out);
}
.za-meter-l { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 11.5px; font-weight: 700; line-height: 1.5; color: var(--stone); white-space: nowrap; }
.za-meter[data-met] .za-meter-l { color: var(--violet); }

/* ---- consent ------------------------------------------------------------ */
.za-consent {
  display: flex; align-items: start; gap: 0.625rem; cursor: pointer;
  font-size: 12px; font-weight: 500; line-height: 1.8; color: var(--stone);
}
.za-check { flex: 0 0 auto; margin-top: 0.3125rem; width: 15px; height: 15px; accent-color: #5e6ad2; cursor: pointer; }
.za-link {
  border: 0; background: transparent; padding: 0; font: inherit; cursor: pointer;
  color: var(--violet); font-weight: 700; text-underline-offset: 3px;
}
.za-link:hover { text-decoration: underline; }

/* ---- status -------------------------------------------------------------
   The region is always in the DOM so a screen reader has something to watch;
   it is empty until there is something to say.
------------------------------------------------------------------------- */
.za-status { display: block; }
.za-err {
  margin: 0; border-radius: var(--r-control); padding: 0.625rem 0.75rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.7; color: #c2410c;
  background: rgba(194,65,12,0.07); box-shadow: 0 0 0 1px rgba(194,65,12,0.20);
}

/* ---- the primary action ------------------------------------------------- */
.za-go .sb { width: 100%; }

/* ---- the switchers under the form --------------------------------------- */
.za-alt { display: flex; flex-direction: column; align-items: start; gap: 0.5rem; }
.za-alt-line { margin: 0; font-size: 13px; font-weight: 500; line-height: 1.7; color: var(--stone); }
.za-alt-quiet {
  border: 0; background: transparent; padding: 0; font: inherit; cursor: pointer;
  font-size: 13px; font-weight: 500; line-height: 1.7; color: var(--stone);
  transition: color 160ms var(--ease-out);
}
.za-alt-quiet:hover { color: var(--obsidian); }
.za-back {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border: 0; background: transparent; padding: 0; font: inherit; cursor: pointer;
  margin-bottom: 0.875rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.5; color: var(--stone);
  transition: color 160ms var(--ease-out);
}
.za-back:hover { color: var(--obsidian); }

/* ---- the account chooser ------------------------------------------------
   The portal's own control, restyled. Its rows are the demo's own store and
   nobody else's, which is what the note under them says.
------------------------------------------------------------------------- */
.za-accs { display: flex; flex-direction: column; gap: 0.5rem; }
.za-acc {
  position: relative; display: flex; align-items: center;
  border-radius: var(--r-card); background: var(--card);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.za-acc:hover { background: #fcfcfd; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.12); }
.za-acc:focus-within { box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px rgba(94,106,210,0.15); }
.za-acc-pick {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.6875rem;
  border: 0; background: transparent; cursor: pointer; font: inherit; text-align: start;
  padding: 0.625rem 0.75rem; border-radius: var(--r-card);
}
.za-acc-pick:focus-visible { outline: none; }
.za-acc-av {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 999px;
  background: rgba(94,106,210,0.12); color: var(--violet);
  font-size: 14px; font-weight: 900; line-height: 1;
}
.za-acc-id { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 1px; }
/* The e-mail carries dir="ltr" so its characters order correctly, which also
   moves its "start" edge to the LEFT — left-aligned, it floated away from the
   name stacked above it. For an ltr run, "end" IS the right edge, which is
   where this card's start side is. */
.za-acc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian); }
.za-acc-mail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: end; font-size: 12px; font-weight: 500; line-height: 1.5; color: var(--stone); }
.za-acc-go { flex: 0 0 auto; color: var(--stone); transition: color 200ms var(--ease-out), transform 260ms var(--ease-out); }
.za-acc:hover .za-acc-go { color: var(--violet); }
@media (prefers-reduced-motion: no-preference) {
  .za-acc:hover .za-acc-go { transform: translateX(-3px); }
}
.za-acc-x {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; margin-inline-end: 0.4375rem;
  border: 0; background: transparent; cursor: pointer; border-radius: 7px;
  color: var(--stone-2); opacity: 0;
  transition: opacity 200ms var(--ease-out), color 160ms var(--ease-out), background-color 160ms var(--ease-out);
}
.za-acc:hover .za-acc-x, .za-acc:focus-within .za-acc-x, .za-acc-x:focus-visible { opacity: 1; }
.za-acc-x:hover { color: var(--obsidian); background: rgba(17,17,17,0.06); }
.za-acc-add {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4375rem;
  margin-top: 0.125rem; border: 0; cursor: pointer; font: inherit;
  border-radius: var(--r-control); padding: 0.6875rem 0.875rem;
  font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--stone);
  background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  transition: color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
}
.za-acc-add:hover { color: var(--violet); box-shadow: 0 0 0 1px rgba(94,106,210,0.45); }
.za-acc-note { margin: 0.375rem 0 0; font-size: 11.5px; font-weight: 500; line-height: 1.8; color: var(--stone-2); }

/* ---- the door -----------------------------------------------------------
   Where the real page would call supabase. See the component's docstring for
   why the real success string is quoted rather than asserted.
------------------------------------------------------------------------- */
.za-hand { display: flex; flex-direction: column; }
.za-hand-pass {
  display: inline-flex; align-items: center; gap: 0.4375rem; margin: 0;
  font-size: 13px; font-weight: 700; line-height: 1.6; color: var(--violet);
}
.za-spec {
  margin-top: 0.875rem; border-radius: var(--r-card); padding: 0.875rem 1rem;
  background: var(--field); box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
}
.za-spec-l { margin: 0 0 0.375rem; font-size: 11.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2); }
.za-spec-q { margin: 0; font-size: 13.5px; font-weight: 700; line-height: 1.75; color: var(--obsidian); }
.za-hand-b { margin: 0.875rem 0 0; font-size: 13px; font-weight: 500; line-height: 1.9; color: var(--stone); }
.za-hand-go { display: flex; flex-direction: column; align-items: start; gap: 0.75rem; margin-top: 1.25rem; }
.za-hand-go .sb { width: 100%; }

/* ---- the standing note under the card ----------------------------------- */
.za-foot-note {
  width: min(100%, 452px); margin: 1.125rem 0 0;
  font-size: 12.5px; font-weight: 500; line-height: 1.9; color: var(--stone);
}

/* ---- the corner mark ----------------------------------------------------
   A violet bracket on two OPPOSITE corners of the card, drawn on
   pseudo-elements over the card's own radius so it reads as part of the
   corner rather than as a sticker on top of one. It opens on hover and on
   focus-within, which on this page means it opens the moment the reader puts
   a cursor in a field — the card acknowledging that it is being used.

   Two corners rather than four: a full frame is a border, and the ring token
   is already the border.
------------------------------------------------------------------------- */
.za-card::before, .za-card::after {
  content: "";
  position: absolute;
  width: 26px; height: 26px;
  pointer-events: none;
  border-color: var(--violet);
  border-style: solid;
  border-width: 0;
  opacity: 0.5;
  transition: opacity 320ms var(--ease-out), width 320ms var(--ease-out), height 320ms var(--ease-out);
}
.za-card::before {
  inset-block-start: -1px; inset-inline-start: -1px;
  border-block-start-width: 2px; border-inline-start-width: 2px;
  border-start-start-radius: var(--r-panel);
}
.za-card::after {
  inset-block-end: -1px; inset-inline-end: -1px;
  border-block-end-width: 2px; border-inline-end-width: 2px;
  border-end-end-radius: var(--r-panel);
}
@media (hover: hover) {
  .za-card:hover::before, .za-card:hover::after { opacity: 1; width: 34px; height: 34px; }
}
.za-card:focus-within::before, .za-card:focus-within::after { opacity: 1; width: 34px; height: 34px; }

/* ---- arrival ------------------------------------------------------------
   Under .za-js only, so a browser that never runs the script reads a finished
   card. A surface that rests invisible has shipped on this codebase twice; it
   does not get to happen a third time.
------------------------------------------------------------------------- */
.za-js .za-card { animation: za-rise 520ms var(--ease-out) both; }
.za-js .za-foot-note { animation: za-rise 520ms var(--ease-out) 140ms both; }
@keyframes za-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .za-js .za-card, .za-js .za-foot-note { animation: none; }
  .za-roll-face, .za-switch-ind, .za-slot, .za-meter-fill, .za-acc-go,
  .za-card::before, .za-card::after, .za-phone-pill, .za-drawer { transition: none; }
}

/* ---- narrow ------------------------------------------------------------- */
@media (max-width: 480px) {
  .za-stage { padding-top: clamp(2rem, 8vw, 3rem); }
  .za-roll-s { font-size: 13.5px; }
}
`
