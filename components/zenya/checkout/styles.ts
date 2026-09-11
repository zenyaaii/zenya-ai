/**
 * The checkout candidate's own stylesheet, composed after CHROME_CSS,
 * MARKETING_CSS and PARTS_CSS.
 *
 * PREFIXED .zk-, AND THE PREFIX IS NOT COSMETIC. The shared chrome owns
 * .zx-bar as the header pill's inner row; a stylesheet in this set once named
 * its own bars .zx-bar and painted rgba(94,106,210,0.24) behind the navigation
 * on every page that loaded it, dropping the nav label from 5.18:1 to 3.85:1.
 * Nothing looked wrong and only the contrast audit caught it. Contact owns
 * .zc-. This page owns .zk- and nothing else.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * FLOORS ARE IN RENDERED PIXELS. components/ZoomLock.tsx writes CSS
 * zoom: 0.85 on the document element, so 38px CSS renders 32.3px and clears
 * the coarse-pointer floor, and 14.5px CSS renders 12.33px and clears the type
 * floor. Nothing here is under 14.5px, including the numerals.
 *
 * MOTION, AS NUMBERS RATHER THAN AS A VIBE:
 *   - Two curves only. --ease-out cubic-bezier(.22,1,.36,1) for anything
 *     arriving, --ease-in cubic-bezier(.55,.085,.68,.53) for anything leaving.
 *     Arriving is always the slower of the two.
 *   - Step and panel transitions 380-520ms. Micro-feedback 120-200ms. The
 *     longest thing on the page is the tick at 620ms. Nothing reaches 720ms.
 *   - ONE THING MOVES AT A TIME. Where two move they are 70ms apart and the
 *     second is a consequence of the first: the price settles, then the list
 *     under it follows.
 *   - Height animates by grid-template-rows: 0fr -> 1fr. There is not a
 *     hard-coded pixel height in this file.
 *   - A RESTING STATE IS THE FINISHED STATE. Every hidden half lives behind
 *     .zx-js, which Shell adds on mount, so a browser that never runs the
 *     script reads a finished page rather than an invisible one.
 */

export const CSS = `
/* ---- the step spine ----------------------------------------------------
   IT WRAPS. It is never a horizontal scroller. Four steps at 360 fall into
   two rows of two and the page keeps its single column; a stepper that
   scrolls sideways hides the step the reader has not reached, which is the
   one piece of information a spine exists to give.

   NO CONNECTOR RULES. The house style refuses rules and dividers as
   decoration, and a connector drawn between four items that wrap has to be
   redrawn or hidden at every breakpoint. The numerals carry the sequence.
------------------------------------------------------------------------- */
.zk-spine { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin: 0 0 clamp(1.75rem, 4vw, 2.5rem); padding: 0; list-style: none; }
.zk-step { display: flex; align-items: center; gap: 0.5rem; min-height: 38px; min-width: 0; }
.zk-num {
  display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  width: 26px; height: 26px; border-radius: 999px;
  font-size: 14.5px; font-weight: 700; line-height: 1;
  background: var(--card); color: var(--ghost); box-shadow: 0 0 0 1px rgba(0,0,0,0.10);
  transition: background-color 380ms var(--ease-out), color 380ms var(--ease-out), box-shadow 380ms var(--ease-out);
}
.zk-step[data-state="done"] .zk-num { background: var(--card); color: #15803d; box-shadow: 0 0 0 1px rgba(21,128,61,0.28); }
.zk-step[data-state="now"] .zk-num { background: var(--obsidian); color: var(--ground); box-shadow: none; }
.zk-lab { font-size: 14.5px; font-weight: 500; line-height: 1.75; color: var(--ghost); min-width: 0; }
.zk-step[data-state="done"] .zk-lab { color: var(--stone); }
/* The current step is the only one named in full weight. */
.zk-step[data-state="now"] .zk-lab { color: var(--obsidian); font-weight: 700; }
.zk-tickmini { width: 13px; height: 13px; }

/* ---- the plan switcher -------------------------------------------------- */
.zk-picker { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 1.25rem; }
.zk-chip {
  display: inline-flex; align-items: center; gap: 0.5rem;
  min-height: 38px; padding: 0 0.9375rem; border: 0; border-radius: 999px;
  font: inherit; font-size: 14.5px; font-weight: 500; line-height: 1.5;
  background: var(--card); color: var(--stone); box-shadow: 0 0 0 1px rgba(0,0,0,0.10);
  cursor: pointer;
  transition: box-shadow 160ms var(--ease-out), color 160ms var(--ease-out), background-color 160ms var(--ease-out);
}
.zk-chip:hover { box-shadow: 0 0 0 1px rgba(0,0,0,0.24); color: var(--obsidian); }
.zk-chip[aria-pressed="true"] { background: var(--obsidian); color: var(--ground); box-shadow: none; font-weight: 700; }
.zk-chip-dot { width: 5px; height: 5px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
.zk-chip[aria-pressed="true"] .zk-chip-dot { background: var(--violet-lift); }

/* ---- the order summary: the centre of the page, not a sidebar -----------
   VISUAL_DENSITY 4. One card, hairline ring, no shadow, no tint. It is the
   widest object in the reading column because it is what the reader came to
   check.
------------------------------------------------------------------------- */
.zk-sum { border-radius: var(--r-panel); background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.09); padding: clamp(1.25rem, 4vw, 1.875rem); }
.zk-sum-top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem 1rem; }
.zk-sum-name { margin: 0; font-size: clamp(19px, 2.4vw, 23px); font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zk-sum-kind { margin: 0.25rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.75; color: var(--stone); }
.zk-badge {
  display: inline-flex; align-items: center; gap: 0.4375rem; flex: 0 0 auto;
  min-height: 30px; padding: 0 0.75rem; border-radius: 999px;
  font-size: 14.5px; font-weight: 700; line-height: 1.5;
  color: var(--stone); box-shadow: 0 0 0 1px rgba(0,0,0,0.10);
}

/* THE PRICE. It moves alone: on a plan change the figure settles first and
   the list below follows 70ms later, which is the only two-part move on the
   page. 420ms in, on the out-curve. */
.zk-price { margin: clamp(1rem, 2.5vw, 1.375rem) 0 0; }
.zk-fig { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; }
/* THE WHOLE STRING COMES FROM lib/company.ts AND IS NOT SPLIT. Retyping the
   numeral to set it larger is how a price drifts: the module is already
   retyped in the features FAQ, the compare summary and AccountSettings
   line 481, and this would have been the fourth. 30px holds
   STARTER_PRICE_DISPLAY on ONE line at 360, which a 38px figure did not. */
.zk-amt { font-size: clamp(23px, 3.4vw, 30px); font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zk-per { font-size: 14.5px; font-weight: 500; line-height: 1.75; color: var(--stone); }
/* No display price in lib/company.ts for this plan, and none invented here. */
.zk-noprice { font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 700; line-height: 1.85; color: var(--obsidian); }
.zk-swap { transition: opacity 420ms var(--ease-out), transform 420ms var(--ease-out); }
.zk-swap[data-out] { opacity: 0; transform: translateY(6px); transition: opacity 180ms var(--ease-in), transform 180ms var(--ease-in); }
.zk-swap-2 { transition-delay: 70ms; }
.zk-swap-2[data-out] { transition-delay: 0ms; }

/* ---- the terms rows: what recurs, when, what cancelling does ------------ */
.zk-rows { margin: clamp(1.125rem, 3vw, 1.5rem) 0 0; display: grid; gap: 0.875rem; }
.zk-row { display: flex; align-items: flex-start; gap: 0.625rem; }
.zk-row-ic { flex: 0 0 auto; margin-top: 0.25rem; color: var(--violet); width: 15px; height: 15px; }
.zk-row-t { min-width: 0; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone); }
.zk-row-t strong { color: var(--obsidian); font-weight: 700; }
.zk-inc { margin: clamp(1.125rem, 3vw, 1.5rem) 0 0; padding: 0; list-style: none; display: grid; gap: 0.625rem; }
.zk-inc li { display: flex; align-items: flex-start; gap: 0.5625rem; font-size: 14.5px; font-weight: 500; line-height: 1.8; color: var(--stone); min-width: 0; }
.zk-inc svg { flex: 0 0 auto; margin-top: 0.3125rem; width: 14px; height: 14px; color: #15803d; }

/* ---- the handoff: Stripe takes the card, Zenya never sees it ------------ */
.zk-hand { margin: clamp(1.25rem, 3vw, 1.625rem) 0 0; padding: clamp(1rem, 3vw, 1.25rem) 0 0; box-shadow: inset 0 1px 0 rgba(0,0,0,0.07); }
.zk-hand-t { margin: 0 0 0.875rem; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone); }
.zk-hand-t strong { color: var(--obsidian); font-weight: 700; }
.zk-go {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;
  min-height: 46px; padding: 0 1.25rem; border: 0; border-radius: var(--r-control);
  font: inherit; font-size: 15px; font-weight: 700; line-height: 1.5;
  background: var(--obsidian); color: var(--ground); cursor: pointer;
  transition: opacity 160ms var(--ease-out);
}
.zk-go:hover { opacity: 0.88; }
.zk-go[disabled] { cursor: default; opacity: 0.72; }
.zk-spin { width: 15px; height: 15px; border-radius: 999px; border: 2px solid rgba(250,250,250,0.34); border-top-color: #fafafa; animation: zk-turn 620ms linear infinite; }
@keyframes zk-turn { to { transform: rotate(360deg); } }
.zk-fine { margin: 0.875rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--ghost); }
.zk-fine a { color: var(--violet-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }

/* ---- the grow: every reveal on this page, height by fr ------------------
   THE CLIP IS ON A TIMER, NOT ON transitionend. Under reduced motion the
   transition never runs and the event never fires, so a clip waiting on it
   stays on forever and eats the 4px focus halo of whatever is inside. It is
   applied while moving and while closed, and removed at rest.
------------------------------------------------------------------------- */
.zk-grow {
  display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden;
  transition: grid-template-rows 460ms var(--ease-out), opacity 320ms var(--ease-out), visibility 0s linear 460ms;
}
.zk-grow[data-on] { grid-template-rows: 1fr; opacity: 1; visibility: visible; transition-delay: 0s, 0s, 0s; }
.zk-grow-clip { min-height: 0; }
.zk-grow[data-moving] > .zk-grow-clip, .zk-grow:not([data-on]) > .zk-grow-clip { overflow: hidden; }

/* ---- the door ----------------------------------------------------------
   Where the demo stops. It runs the real rules, shows the real summary, and
   then says plainly that it is a design proposal and hands the reader to the
   real /checkout. It never calls Stripe.
------------------------------------------------------------------------- */
.zk-door { margin: 1rem 0 0; border-radius: var(--r-panel); background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.09); padding: clamp(1.25rem, 4vw, 1.875rem); }
.zk-tick { display: block; width: 34px; height: 34px; color: #15803d; }
/* The door only ever opens on a failure, so its mark is a warning rather than
   a tick. Amber, not the status red: nothing was charged and nothing is
   broken, the session simply did not start. */
.zk-tick-bad { color: #b45309; }
.zk-tick-p { stroke-dasharray: 26; stroke-dashoffset: 0; }
.zx-js .zk-door[data-in] .zk-tick-p { animation: zk-draw 620ms var(--ease-out) both; }
@keyframes zk-draw { from { stroke-dashoffset: 26; } to { stroke-dashoffset: 0; } }
.zk-door-h { margin: 0.875rem 0 0; font-size: clamp(19px, 2.4vw, 23px); font-weight: 900; line-height: 1.5; color: var(--obsidian); }
.zk-door-p { margin: 0.625rem 0 0; font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 500; line-height: 1.9; color: var(--stone); }
.zk-door-p strong { color: var(--obsidian); font-weight: 700; }
/* The blessing. Warm, and it is not a commercial claim. */
.zk-dua { margin: 1rem 0 0; font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 700; line-height: 1.9; color: var(--violet-ink); }
.zk-door-acts { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.25rem 0 0; }
.zk-door-acts > * { flex: 1 1 auto; }

/* THE STRIP THAT SAYS THIS DID NOT HAPPEN. In place, not in a footnote three
   sections down: a handoff screen that reads as real IS the thing that would
   mislead, and it is exactly the screen being designed here. */
.zk-strip { margin: 1.25rem 0 0; padding: 0.875rem 1rem; border-radius: var(--r-card); background: var(--field); }
.zk-strip p { margin: 0; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone); }
.zk-strip strong { color: var(--obsidian); font-weight: 700; }
.zk-strip a { color: var(--violet-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }

/* ---- the state gallery -------------------------------------------------
   Every outcome the live route can reach, read out of the file rather than
   imagined, each one shown as the object it actually is with the condition
   that produces it printed beside it.
------------------------------------------------------------------------- */
.zk-states { display: grid; gap: 0.875rem; margin: 0; padding: 0; list-style: none; }
.zk-state { border-radius: var(--r-card); background: var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,0.09); padding: clamp(1rem, 3vw, 1.25rem); }
.zk-state-h { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; }
.zk-state-n { margin: 0; font-size: clamp(16px, 1.9vw, 17.5px); font-weight: 700; line-height: 1.65; color: var(--obsidian); min-width: 0; }
.zk-tag { display: inline-flex; align-items: center; flex: 0 0 auto; min-height: 30px; padding: 0 0.6875rem; border-radius: 999px; background: var(--field); font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2); }
.zk-state-p { margin: 0.5rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--stone); }
/* THE CONDITION, QUOTED FROM THE ROUTE, AND IT IS A BLOCK OF CODE RATHER
   THAN A LATIN RUN INSIDE A SENTENCE. The rule that a Latin run wants
   <bdi dir="ltr"> and never dir on its box is about a run embedded in Arabic
   prose. This element is not that: it is wholly LTR source, so it takes the
   direction on the box and isolates itself from the RTL paragraph flow. Left
   without it the lines centred and a wrapped condition read back-to-front. */
.zk-cond {
  margin: 0.625rem 0 0; padding: 0.625rem 0.8125rem; border-radius: var(--r-control);
  background: var(--field); font-size: 14.5px; font-weight: 500; line-height: 1.8; color: var(--stone-2);
  direction: ltr; text-align: left; unicode-bidi: isolate;
  overflow-wrap: anywhere;
}
.zk-cond code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14.5px; color: var(--obsidian); }
/* The one state whose copy is wrong on the live route today. */
.zk-state[data-flag] { box-shadow: 0 0 0 1px rgba(94,106,210,0.34); }
.zk-flag { margin: 0.625rem 0 0; font-size: 14.5px; font-weight: 500; line-height: 1.85; color: var(--violet-ink); }
.zk-flag strong { font-weight: 700; }

/* ---- sections ----------------------------------------------------------- */
.zk-sec { padding: clamp(2.25rem, 6vw, 3.5rem) 0 0; }
.zk-sec-p { margin: 0 0 clamp(1rem, 2.4vw, 1.5rem); font-size: clamp(15px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.95; color: var(--stone); }
.zk-sec-p strong { color: var(--obsidian); font-weight: 700; }
.zk-tail { padding: clamp(2.25rem, 6vw, 3.5rem) 0 clamp(2.5rem, 6vw, 3.5rem); }

@media (max-width: 480px) { .zk-open { padding-top: clamp(2rem, 8vw, 3rem); } }
`
