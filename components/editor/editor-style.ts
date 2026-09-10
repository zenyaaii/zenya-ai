/**
 * The theme editor's stylesheet — the house style applied to the workbench a
 * customer sits at while they edit their own site.
 *
 * DESIGN READ: a dense product workbench for a business owner editing their
 * site for up to an hour, in the house language — objects on bare #fafafa
 * paper, hairline rings instead of shadows, obsidian Arabic type, and violet
 * only where it means something (the section being edited, the primary
 * action, focus). Dials: DESIGN_VARIANCE 4, MOTION_INTENSITY 3,
 * VISUAL_DENSITY 7.
 *
 * WHY THE DIALS ARE THE OPPOSITE OF THE CHECKOUT'S. The checkout ran at
 * MOTION_INTENSITY 5 because it is one decision on one screen. This is a
 * workbench somebody types into for an hour, which is exactly the surface
 * CLAUDE.md's "universal principles only" caveat is written for. Here
 * responsiveness IS the animation: a panel that opens without jank, a ring
 * that lands on the section under the cursor, a save state that changes
 * without moving anything beside it. There are no reveals, no staggers and no
 * transitions on geometry. Colour and opacity move in 120-180ms, and only in
 * answer to something the customer did.
 *
 * THE SAME PRODUCT AS THE DASHBOARD. The tokens below are the ones
 * components/app/dashboard-style.ts declares on .zy-app, value for value,
 * and the chrome face is the same IBM Plex Sans Arabic (chromeFont). Tajawal
 * carries the content being edited — every input and textarea — and Plex
 * carries the furniture around it.
 *
 * PREFIXED .ze-, scoped under .ze-root. The chrome owns .zx-, the dashboard
 * .zy-, checkout .zk-, contact .zc-. Nothing here is unprefixed except the
 * type selectors inside .ze-root, which only this surface renders.
 *
 * UNLAYERED ON PURPOSE. Tailwind v3 compiles @layer away, so a rule inside
 * @layer components loses to preflight. These win on specificity instead.
 *
 * FLOORS ARE IN RENDERED PIXELS. components/ZoomLock.tsx writes CSS
 * zoom: 0.85 on <html>, so 14.5px CSS renders 12.33px (the 12px type floor)
 * and 38px CSS renders 32.3px (the coarse-pointer tap floor). Nothing on this
 * surface is set below 14.5px, including labels, and every control grows to
 * 38px under (pointer: coarse). A mouse gets the denser 32-34px.
 *
 * THE SELECTION MODEL IS NOT IN THIS FILE. The ring that marks the section
 * being edited is drawn INSIDE the preview's own document by
 * SectionOverlay.tsx, where it scrolls and scales with the site. This file
 * only styles controls, and a control never wears that ring: a pressed
 * control is filled obsidian, a selected rail row is tinted with a bar, and
 * focus is a plain violet outline.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const EDITOR_CSS = `
.ze-root, .ze-tokens {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  --stone: #56565a;
  --stone-2: #66666e;
  --ghost: #6b6b73;
  --violet: #5e6ad2;
  /* Violet as a RUN OF TEXT. #5e6ad2 is 4.28:1 on the field fill; this step
     is 5.77:1 on white and 5.3:1 on the field, so every violet word uses it
     and every violet dot, bar and fill keeps #5e6ad2. */
  --violet-ink: #4f5ab8;
  --violet-fill: rgba(94,106,210,0.10);
  --violet-ring: rgba(94,106,210,0.15);
  --field: #f4f4f6;
  --stage: #ececef;
  --hair: rgba(17,17,17,0.10);
  --hair-2: rgba(17,17,17,0.07);
  --success: #15803d;
  --error: #b91c1c;
  --error-fill: rgba(185,28,28,0.08);
  --ring-1: 0 0 0 1px rgba(0,0,0,0.08);
  --ring-2: 0 0 0 4px rgba(250,250,250,0.55);
  --r-panel: 28px;
  --r-card: 16px;
  --r-control: 10px;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --chrome: var(--font-chrome), Tajawal, system-ui, sans-serif;
  --content: Tajawal, system-ui, sans-serif;
  /* One control height, raised for a finger below. */
  --h-ctl: 34px;
  font-family: var(--chrome);
  font-size: 14.5px;
  line-height: 1.7;
  letter-spacing: 0;
  color: var(--obsidian);
}
/* THE SAME TOKENS, FOR WHAT ESCAPES THE ROOT. The gallery is portalled to
   <body> — inside the phone sheet it would otherwise sit under a transform,
   which makes position: fixed relative to the sheet instead of the screen —
   and a portal inherits nothing from .ze-root. */
.ze-root {
  /* FIXED, NOT h-screen. ZoomLock's zoom scales a 100vh box to 85% of the
     window, which is what left a blank band under the old editor on every
     desktop. A fixed box with inset 0 is sized by the viewport itself. */
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--ground);
  color: var(--obsidian);
  font-family: var(--chrome);
  font-size: 14.5px;
  line-height: 1.7;
  letter-spacing: 0;
  overflow: hidden;
}
@media (pointer: coarse) { .ze-root { --h-ctl: 38px; } }
.ze-root *, .ze-root *::before, .ze-root *::after { letter-spacing: 0; }
.ze-root :where(button) { font: inherit; color: inherit; }
.ze-a11y { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); clip-path: inset(50%); white-space: nowrap; border: 0; }
.ze-root :focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

/* ---- the top bar -------------------------------------------------------- */
.ze-bar {
  display: flex; align-items: center; gap: 0.5rem;
  flex: 0 0 auto;
  height: 56px;
  padding-inline: 0.625rem;
  background: #ffffff;
  box-shadow: 0 1px 0 var(--hair-2);
  position: relative; z-index: 20;
  min-width: 0;
}
.ze-bar-start { display: flex; align-items: center; gap: 0.375rem; min-width: 0; flex: 1 1 0; }
.ze-bar-mid { display: flex; align-items: center; gap: 0.5rem; flex: 0 1 auto; min-width: 0; }
.ze-bar-end { display: flex; align-items: center; justify-content: flex-end; gap: 0.375rem; min-width: 0; flex: 1 1 0; }
@media (max-width: 767px) { .ze-bar { height: 52px; padding-inline: 0.375rem; } }

.ze-title {
  min-width: 0; margin: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 15px; font-weight: 700; line-height: 1.7; color: var(--obsidian);
}
.ze-title-q { font-weight: 500; color: var(--stone); }

/* A quiet control: back, undo, redo, expand, close. */
.ze-icon {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem;
  flex: 0 0 auto;
  min-width: var(--h-ctl); height: var(--h-ctl);
  padding: 0; border: 0; border-radius: var(--r-control);
  background: transparent; color: var(--stone);
  cursor: pointer; text-decoration: none;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.ze-icon:hover { color: var(--obsidian); background: rgba(17,17,17,0.055); }
.ze-icon:active { background: rgba(17,17,17,0.09); }
.ze-icon:disabled { cursor: default; color: rgba(17,17,17,0.28); background: transparent; }
.ze-icon[data-label] { padding-inline: 0.625rem 0.75rem; font-size: 14.5px; font-weight: 500; }
.ze-icon svg { width: 17px; height: 17px; flex: 0 0 auto; }
.ze-sep { width: 1px; height: 20px; background: var(--hair); flex: 0 0 auto; margin-inline: 0.25rem; }

/* ---- the save state -----------------------------------------------------
   IT CHANGES WITHOUT MOVING ANYTHING. The slot has a fixed width, so going
   from "saving" to "saved" to "saved 2 minutes ago" swaps the words in place
   and the save button beside it never shifts by a pixel. */
.ze-status {
  display: inline-flex; align-items: center; justify-content: flex-end; gap: 0.4375rem;
  width: 12rem; min-width: 0; flex: 0 1 auto;
  font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone);
  white-space: nowrap;
}
.ze-status-t { overflow: hidden; text-overflow: ellipsis; }
.ze-status-dot { width: 8px; height: 8px; border-radius: 999px; flex: 0 0 auto; background: rgba(17,17,17,0.22); transition: background-color 180ms var(--ease-out); }
.ze-status[data-s="dirty"] .ze-status-dot,
.ze-status[data-s="saving"] .ze-status-dot { background: var(--violet); }
.ze-status[data-s="saved"] { color: var(--success); }
.ze-status[data-s="saved"] .ze-status-dot { background: var(--success); }
.ze-status[data-s="error"] { color: var(--error); }
.ze-status[data-s="error"] .ze-status-dot { background: var(--error); }
.ze-status[data-compact] { width: auto; justify-content: flex-start; }

/* The one filled action. It grows a halo rather than scaling: a control that
   changes size on hover nudges the whole bar. */
.ze-save {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem;
  flex: 0 0 auto;
  height: var(--h-ctl); padding-inline: 1rem;
  border: 0; border-radius: 999px; cursor: pointer;
  font-size: 14.5px; font-weight: 700; line-height: 1.7;
  color: #ffffff; background: var(--violet);
  box-shadow: 0 0 0 1px rgba(94,106,210,0.6), 0 0 0 4px rgba(94,106,210,0);
  transition: box-shadow 200ms var(--ease-out), background-color 160ms var(--ease-out), color 160ms var(--ease-out);
}
.ze-save:hover { background: #5462cb; box-shadow: 0 0 0 1px rgba(94,106,210,0.7), 0 0 0 4px var(--violet-ring); }
.ze-save:active { background: #4f5ab8; }
/* Nothing to save is a resting state, not a broken button: a quiet field
   with a legible label, 6.4:1, rather than a washed-out violet slab. */
.ze-save:disabled { cursor: default; color: var(--stone); background: var(--field); box-shadow: 0 0 0 1px var(--hair-2); }
.ze-save svg { width: 15px; height: 15px; }

/* ---- the segmented control: pages, devices, size, alignment --------------
   A pressed option is FILLED OBSIDIAN. That is the control language on this
   surface, and it is deliberately nothing like the section ring. */
.ze-seg {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 3px; border-radius: 999px;
  background: var(--field);
  box-shadow: 0 0 0 1px var(--hair-2);
  max-width: 100%; min-width: 0;
  overflow-x: auto; scrollbar-width: none;
}
.ze-seg::-webkit-scrollbar { display: none; }
.ze-seg[data-fill] { display: flex; width: 100%; border-radius: var(--r-control); }
.ze-seg-b {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem;
  flex: 0 0 auto;
  height: calc(var(--h-ctl) - 6px); min-width: calc(var(--h-ctl) - 6px);
  padding-inline: 0.6875rem;
  border: 0; border-radius: 999px; background: transparent; cursor: pointer;
  font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone);
  white-space: nowrap;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
@media (pointer: coarse) { .ze-seg-b { height: 38px; min-width: 38px; } .ze-seg { padding: 2px; } }
.ze-seg[data-fill] .ze-seg-b { flex: 1 1 0; border-radius: 8px; }
.ze-seg-b:hover { color: var(--obsidian); background: rgba(17,17,17,0.05); }
.ze-seg-b[aria-pressed="true"] { color: #ffffff; background: var(--obsidian); font-weight: 700; }
.ze-seg-b svg { width: 16px; height: 16px; flex: 0 0 auto; }
.ze-seg-b[data-icon] { padding-inline: 0.5rem; }

/* ---- the demo notice --------------------------------------------------- */
.ze-demo {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem;
  flex: 0 0 auto;
  padding: 0.3125rem 0.875rem;
  background: #ffffff;
  box-shadow: 0 1px 0 var(--hair-2);
  font-size: 14.5px; line-height: 1.7; color: var(--stone);
  position: relative; z-index: 19;
}
.ze-demo strong { color: var(--obsidian); font-weight: 700; }
.ze-demo-t { min-width: 0; }
.ze-demo-short { display: none; }
/* On a phone: one line of notice, and the template row scrolls sideways
   rather than wrapping into three rows above the preview. */
@media (max-width: 767px) {
  .ze-demo { flex-wrap: nowrap; flex-direction: column; align-items: stretch; gap: 0.125rem; padding: 0.25rem 0.625rem; }
  .ze-demo-long { display: none; }
  .ze-demo-short { display: inline; }
  /* Two classes, so these win over the base .ze-demo-types rule, which is
     declared further down this sheet. */
  .ze-demo .ze-demo-types { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-inline: -0.25rem; padding-inline: 0.25rem; }
  .ze-demo .ze-demo-types::-webkit-scrollbar { display: none; }
  .ze-demo .ze-demo-types a, .ze-demo .ze-demo-types span { flex: 0 0 auto; white-space: nowrap; }
}
.ze-demo-types { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
.ze-demo-types a {
  display: inline-flex; align-items: center; min-height: 30px; padding-inline: 0.625rem;
  border-radius: 999px; text-decoration: none; color: var(--stone);
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
@media (pointer: coarse) { .ze-demo-types a { min-height: 38px; } }
.ze-demo-types a:hover { color: var(--obsidian); background: rgba(17,17,17,0.05); }
.ze-demo-types a[aria-current] { color: #ffffff; background: var(--obsidian); font-weight: 700; }

/* ---- the body: rails, stage, inspector ---------------------------------- */
.ze-body { display: flex; flex: 1 1 auto; min-height: 0; min-width: 0; gap: 8px; padding: 8px; }
.ze-pane {
  display: flex; flex-direction: column; flex: 0 0 auto;
  min-height: 0;
  background: #ffffff;
  border-radius: var(--r-panel);
  box-shadow: var(--ring-1), var(--ring-2);
  overflow: hidden;
}
.ze-rail { width: 248px; }
.ze-insp { width: 340px; }
.ze-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
/* THE STAGE IS ROUNDED BUT DOES NOT CLIP. Measured on the production build,
   40 keystrokes into the hero headline at 1440: with the stage clipping its
   rounded corners and the device frame clipping its own, key-to-paint was
   p50 56ms / p95 104ms. Two nested rounded clips around a live iframe push
   Chrome off its fast rounded-corner path, so every keystroke's repaint of
   the site went through a mask. With neither clip it was 40/56ms; with this
   rule and the square frame below, 48/64ms — the same p95 as before the
   restyle. Nothing needs the stage to clip: the frame clips the scaled
   iframe itself, with a plain rectangle. */
.ze-stage {
  position: relative;
  flex: 1 1 auto; min-width: 0; min-height: 0;
  border-radius: var(--r-panel);
  background: var(--stage);
  box-shadow: inset 0 0 0 1px var(--hair-2);
}

/* ---- the rail ----------------------------------------------------------- */
.ze-group { padding: 0.875rem 0.625rem 0.25rem; }
.ze-group + .ze-group { box-shadow: inset 0 1px 0 var(--hair-2); margin-top: 0.5rem; }
.ze-group-h { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; padding: 0 0.625rem 0.375rem; font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--obsidian); }
.ze-group-h span + span { font-weight: 500; color: var(--stone-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ze-rows { display: grid; gap: 2px; }

/* A rail row is a CONTROL that stands for a section. Selected, it is tinted
   and carries a bar on its inline-start edge — the chrome twin of the ring
   on the canvas, in a different form so the two can never be confused. */
.ze-row {
  position: relative;
  display: flex; align-items: center; gap: 0.625rem;
  width: 100%; min-height: var(--h-ctl);
  padding: 0 0.75rem;
  border: 0; border-radius: var(--r-control); background: transparent; cursor: pointer;
  font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone);
  text-align: start;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.ze-row:hover { color: var(--obsidian); background: rgba(17,17,17,0.045); }
.ze-row:active { background: rgba(17,17,17,0.08); }
.ze-row[aria-current] { color: var(--violet-ink); font-weight: 700; background: var(--violet-fill); }
.ze-row[aria-current]::before {
  content: ""; position: absolute; inset-inline-start: 0; top: 50%;
  width: 3px; height: 18px; margin-top: -9px; border-radius: 999px; background: var(--violet);
}
.ze-row svg { width: 16px; height: 16px; flex: 0 0 auto; }
.ze-row-t { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ze-row-go { color: rgba(17,17,17,0.32); }

/* ---- the inspector ------------------------------------------------------ */
.ze-insp-head {
  display: flex; align-items: center; gap: 0.5rem;
  flex: 0 0 auto;
  min-height: 60px; padding: 0.5rem 1rem;
  box-shadow: 0 1px 0 var(--hair-2);
}
.ze-insp-kick { display: block; font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--stone); }
.ze-insp-t { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.7; color: var(--obsidian); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ze-insp-body { display: grid; gap: 1.125rem; padding: 1rem; }

/* ---- notes -------------------------------------------------------------- */
.ze-note { margin: 0; padding: 0.625rem 0.75rem; border-radius: var(--r-control); background: var(--field); font-size: 14.5px; line-height: 1.7; color: var(--stone); }
.ze-note[data-tone="door"] { background: var(--violet-fill); color: var(--obsidian); box-shadow: 0 0 0 1px rgba(94,106,210,0.20); }

/* ---- fields ------------------------------------------------------------- */
.ze-field { display: grid; gap: 0.375rem; min-width: 0; }
.ze-label-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-height: 26px; }
.ze-label { font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--stone); }
.ze-hint { margin: 0; font-size: 14.5px; line-height: 1.7; color: var(--stone-2); }
.ze-input, .ze-textarea {
  display: block; width: 100%; min-width: 0;
  min-height: var(--h-ctl);
  padding: 0.3125rem 0.6875rem;
  border: 0; border-radius: var(--r-control);
  background: var(--field);
  box-shadow: 0 0 0 1px var(--hair);
  font-family: var(--content); font-size: 15px; line-height: 1.7; color: var(--obsidian);
  outline: none;
  transition: box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.ze-textarea { resize: vertical; overflow-wrap: anywhere; }
.ze-input::placeholder, .ze-textarea::placeholder { color: var(--ghost); }
.ze-input:hover, .ze-textarea:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.ze-input:focus, .ze-textarea:focus { background: #ffffff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring); }
.ze-input[data-mono] { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14.5px; direction: ltr; text-align: left; }

/* A text action: clear, reset, reset all. */
.ze-link {
  display: inline-flex; align-items: center; gap: 0.3125rem;
  min-height: 28px; padding: 0 0.25rem;
  border: 0; background: transparent; cursor: pointer;
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--violet-ink);
  border-radius: 6px;
}
/* A short word ("clear") is narrower than a fingertip: the target holds its
   width as well as its height. Measured: the clear-image link was 31.7px
   wide at 38px CSS tall before this. */
.ze-link { min-width: 28px; justify-content: center; }
@media (pointer: coarse) { .ze-link { min-height: 38px; min-width: 38px; } }
.ze-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.ze-link[data-tone="bad"] { color: var(--error); }
.ze-link svg { width: 14px; height: 14px; }

/* ---- the AI trigger and panel ------------------------------------------ */
.ze-ai {
  display: inline-flex; align-items: center; gap: 0.3125rem;
  height: 28px; padding-inline: 0.5rem;
  border: 0; border-radius: 999px; cursor: pointer;
  background: transparent; box-shadow: 0 0 0 1px var(--hair);
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--stone);
  transition: color 150ms var(--ease-out), box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
@media (pointer: coarse) { .ze-ai { height: 38px; padding-inline: 0.75rem; } }
.ze-ai:hover { color: var(--violet-ink); box-shadow: 0 0 0 1px rgba(94,106,210,0.45); }
.ze-ai[aria-expanded="true"] { color: var(--violet-ink); background: var(--violet-fill); box-shadow: 0 0 0 1px rgba(94,106,210,0.35); }
.ze-ai svg { width: 14px; height: 14px; }
.ze-aipanel { display: grid; gap: 0.625rem; padding: 0.75rem; border-radius: var(--r-card); background: #ffffff; box-shadow: 0 0 0 1px rgba(94,106,210,0.28), 0 0 0 4px rgba(94,106,210,0.06); }
.ze-aipanel-h { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 14.5px; font-weight: 700; color: var(--violet-ink); }
.ze-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.ze-chip {
  display: inline-flex; align-items: center; gap: 0.3125rem;
  min-height: 30px; padding-inline: 0.75rem;
  border: 0; border-radius: 999px; cursor: pointer;
  background: #ffffff; box-shadow: 0 0 0 1px var(--hair);
  font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--obsidian);
  white-space: nowrap;
  transition: color 150ms var(--ease-out), box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
@media (pointer: coarse) { .ze-chip { min-height: 38px; } }
.ze-chip:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.24); }
.ze-chip:disabled { cursor: default; color: var(--stone); background: var(--field); box-shadow: 0 0 0 1px var(--hair-2); }
.ze-chip[aria-pressed="true"] { color: #ffffff; background: var(--obsidian); box-shadow: none; font-weight: 700; }
.ze-row2 { display: flex; align-items: stretch; gap: 0.375rem; }
.ze-row2 > .ze-input { flex: 1 1 auto; }
.ze-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem;
  flex: 0 0 auto;
  min-height: var(--h-ctl); padding-inline: 0.875rem;
  border: 0; border-radius: var(--r-control); cursor: pointer;
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: #ffffff; background: var(--obsidian);
  text-decoration: none;
  transition: opacity 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.ze-btn:hover { background: #2a2a2e; }
.ze-btn:disabled { cursor: default; color: var(--stone); background: var(--field); }
.ze-btn[data-tone="accent"] { background: var(--violet); }
.ze-btn[data-tone="accent"]:hover { background: #5462cb; }
.ze-btn[data-tone="quiet"] { color: var(--obsidian); background: var(--field); box-shadow: 0 0 0 1px var(--hair-2); }
.ze-btn[data-tone="quiet"]:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.2); }
.ze-btn svg { width: 15px; height: 15px; }
.ze-variant {
  display: block; width: 100%;
  padding: 0.5rem 0.75rem;
  border: 0; border-radius: var(--r-control); cursor: pointer;
  background: var(--field); box-shadow: 0 0 0 1px var(--hair-2);
  font-family: var(--content); font-size: 15px; line-height: 1.7; color: var(--obsidian);
  text-align: start; white-space: pre-line; overflow-wrap: anywhere;
  transition: box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.ze-variant:hover { background: #ffffff; box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring); }
.ze-err { margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--r-control); background: var(--error-fill); box-shadow: inset 3px 0 0 var(--error); font-size: 14.5px; line-height: 1.7; color: var(--error); }
[dir="rtl"] .ze-err { box-shadow: inset -3px 0 0 var(--error); }
.ze-spin { width: 14px; height: 14px; border-radius: 999px; border: 2px solid currentColor; border-inline-end-color: transparent; animation: ze-spin 700ms linear infinite; }
@keyframes ze-spin { to { transform: rotate(360deg); } }

/* ---- the section style card -------------------------------------------- */
.ze-card { display: grid; gap: 0.625rem; padding: 0.75rem; border-radius: var(--r-card); background: #ffffff; box-shadow: 0 0 0 1px var(--hair); }
.ze-card-h { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.ze-card-t { font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--obsidian); }
.ze-kv { display: grid; grid-template-columns: 5.25rem minmax(0, 1fr); align-items: center; gap: 0.5rem; }
.ze-kv > span { font-size: 14.5px; color: var(--stone); }

/* ---- repeating items ---------------------------------------------------- */
.ze-items { display: grid; gap: 0.5rem; }
.ze-item { border-radius: var(--r-card); background: #ffffff; box-shadow: 0 0 0 1px var(--hair); }
.ze-item-h { display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem; }
.ze-item-toggle {
  display: flex; align-items: center; gap: 0.5rem; flex: 1 1 auto; min-width: 0;
  min-height: var(--h-ctl); padding: 0 0.5rem;
  border: 0; border-radius: var(--r-control); background: transparent; cursor: pointer;
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--obsidian); text-align: start;
}
.ze-item-toggle:hover { background: rgba(17,17,17,0.04); }
.ze-item-toggle svg { width: 16px; height: 16px; flex: 0 0 auto; color: var(--stone); transition: transform 180ms var(--ease-out); }
.ze-item-toggle[aria-expanded="true"] svg { transform: rotate(90deg); }
[dir="rtl"] .ze-item-toggle[aria-expanded="false"] svg { transform: scaleX(-1); }
.ze-item-body { display: grid; gap: 0.875rem; padding: 0.75rem; box-shadow: inset 0 1px 0 var(--hair-2); }
.ze-icon[data-tone="bad"]:hover { color: var(--error); background: var(--error-fill); }
.ze-add {
  display: flex; align-items: center; justify-content: center; gap: 0.375rem;
  width: 100%; min-height: var(--h-ctl);
  border: 1px dashed rgba(17,17,17,0.24); border-radius: var(--r-control);
  background: transparent; cursor: pointer;
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--violet-ink);
  transition: background-color 150ms var(--ease-out), border-color 150ms var(--ease-out);
}
.ze-add:hover { background: var(--violet-fill); border-color: rgba(94,106,210,0.45); }
.ze-add svg { width: 15px; height: 15px; }

/* ---- images ------------------------------------------------------------- */
.ze-img {
  position: relative; display: block; width: 100%; padding: 0; overflow: hidden;
  border: 0; border-radius: var(--r-control); cursor: pointer; background: var(--field);
  box-shadow: 0 0 0 1px var(--hair);
  transition: box-shadow 150ms var(--ease-out);
}
.ze-img:hover { box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring); }
.ze-img img { display: block; width: 100%; height: 8rem; object-fit: cover; }
.ze-img-empty { display: grid; place-items: center; gap: 0.25rem; height: 6rem; color: var(--stone); font-size: 14.5px; font-weight: 700; }
.ze-img-empty svg { width: 18px; height: 18px; }

/* ---- colours ------------------------------------------------------------ */
.ze-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
/* A preset card is painted in the preset's own colours, so the card itself
   is the sample. Selected, it takes an OBSIDIAN ring and a check — the
   control language — never the violet section ring. */
.ze-preset {
  position: relative; display: grid; gap: 0.375rem; align-content: start;
  min-width: 0; padding: 0.75rem;
  border: 0; border-radius: var(--r-card); cursor: pointer; text-align: start;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.14);
  transition: box-shadow 150ms var(--ease-out);
}
.ze-preset:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.34); }
.ze-preset[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--obsidian), 0 0 0 5px rgba(23,23,23,0.10); }
.ze-preset-dots { display: flex; gap: 4px; }
.ze-preset-dots span { width: 14px; height: 14px; border-radius: 999px; box-shadow: 0 0 0 1px rgba(127,127,127,0.35); }
.ze-preset-n { font-size: 15px; font-weight: 700; line-height: 1.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ze-preset-v { font-size: 14.5px; line-height: 1.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ze-check { position: absolute; inset-block-start: 8px; inset-inline-end: 8px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 999px; background: var(--obsidian); color: #ffffff; box-shadow: 0 0 0 2px #ffffff; }
.ze-check svg { width: 13px; height: 13px; }
.ze-colors { display: grid; gap: 0.375rem; }
.ze-color { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem; border-radius: var(--r-control); background: #ffffff; box-shadow: 0 0 0 1px var(--hair-2); }
.ze-swatch { position: relative; flex: 0 0 auto; width: var(--h-ctl); height: var(--h-ctl); border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(17,17,17,0.14); overflow: hidden; }
.ze-swatch input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: 0; padding: 0; }
.ze-color-m { display: grid; gap: 0.125rem; flex: 1 1 auto; min-width: 0; }
.ze-color-l { display: flex; align-items: center; gap: 0.375rem; font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--obsidian); }
.ze-tag { display: inline-flex; align-items: center; padding: 0 0.4375rem; border-radius: 999px; font-size: 14.5px; font-weight: 500; line-height: 1.7; color: var(--violet-ink); background: var(--violet-fill); }
.ze-color .ze-input { min-height: 30px; padding-block: 0.125rem; }
@media (pointer: coarse) { .ze-color .ze-input { min-height: 38px; } }

/* ---- type pairs --------------------------------------------------------- */
.ze-types { display: grid; gap: 0.375rem; }
.ze-type {
  position: relative; display: grid; gap: 0.125rem;
  width: 100%; padding: 0.625rem 0.75rem; padding-inline-end: 2.5rem;
  border: 0; border-radius: var(--r-card); cursor: pointer; text-align: start;
  background: #ffffff; box-shadow: 0 0 0 1px var(--hair);
  transition: box-shadow 150ms var(--ease-out);
}
.ze-type:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.26); }
.ze-type[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--obsidian), 0 0 0 5px rgba(23,23,23,0.08); }
.ze-type-n { display: flex; align-items: baseline; gap: 0.5rem; font-size: 19px; line-height: 1.7; color: var(--obsidian); }
.ze-type-m { font-family: var(--chrome); font-size: 14.5px; font-weight: 500; color: var(--stone); }
.ze-type-v { font-size: 14.5px; line-height: 1.7; color: var(--stone); }
.ze-type .ze-check { inset-block-start: 50%; margin-top: -11px; }

/* ---- the preview stage -------------------------------------------------- */
.ze-frame-wrap { position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: center; padding: 12px; }
.ze-frame-wrap[data-bleed] { padding: 0; }
/* The device is an object on the stage: white, a hairline and a white halo —
   the house ring, not a drop shadow. SQUARE ON PURPOSE: it must clip the
   scaled iframe, and a rectangular clip is free where a rounded one costs a
   mask on every repaint of the site (see .ze-stage above). */
.ze-frame { position: relative; flex: 0 0 auto; overflow: hidden; background: #ffffff; border-radius: 0; box-shadow: 0 0 0 1px rgba(17,17,17,0.16), 0 0 0 5px rgba(255,255,255,0.65); }
.ze-frame-wrap[data-bleed] .ze-frame { border-radius: 0; box-shadow: none; }
.ze-frame iframe { position: absolute; top: 0; left: 0; display: block; border: 0; background: #ffffff; transform-origin: 0 0; }

/* ---- the phone sheet ---------------------------------------------------- */
.ze-sheet {
  position: fixed; inset-inline: 0; z-index: 40;
  display: flex; flex-direction: column;
  background: #ffffff;
  border-radius: var(--r-panel) var(--r-panel) 0 0;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.14), 0 -1px 0 4px rgba(250,250,250,0.35);
}
/* On a phone the device IS the device: the stage is the whole screen under
   the bar, with no margin, radius or frame. */
.ze-stage[data-bleed] { border-radius: 0; box-shadow: none; background: #ffffff; }
/* The demo notice, when it sits at the top of the section list rather than
   under the bar. */
.ze-pick .ze-demo { border-radius: var(--r-card); background: var(--field); box-shadow: none; padding: 0.625rem 0.75rem; }
.ze-sheet-grab { flex: 0 0 auto; padding: 0.375rem 0.75rem 0.5rem; cursor: grab; user-select: none; -webkit-user-select: none; }
.ze-sheet-grab:active { cursor: grabbing; }
.ze-handle { width: 40px; height: 5px; margin: 0 auto 0.375rem; border-radius: 999px; background: rgba(17,17,17,0.2); }
.ze-sheet-head { display: flex; align-items: center; gap: 0.375rem; min-height: 46px; }
.ze-sheet-titles { display: grid; flex: 1 1 auto; min-width: 0; }
.ze-sheet-t { display: flex; align-items: center; gap: 0.25rem; min-width: 0; font-size: 16px; font-weight: 700; line-height: 1.7; color: var(--obsidian); }
.ze-sheet-t > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ze-sheet-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0.75rem 1rem 6rem; box-shadow: inset 0 1px 0 var(--hair-2); -webkit-overflow-scrolling: touch; }
.ze-sheet-scrim { position: fixed; inset: 0; z-index: 30; border: 0; padding: 0; background: rgba(17,17,17,0.28); }

/* The picker inside the sheet or the docked inspector: bigger rows, because a
   thumb is the pointer here. */
.ze-pick { display: grid; gap: 1.125rem; }
.ze-pick .ze-row { min-height: 46px; padding-inline: 0.875rem; background: var(--field); }
.ze-pick .ze-row:hover { background: #ececef; }
.ze-pick .ze-row[aria-current] { background: var(--violet-fill); }
.ze-pick-h { padding: 0 0.25rem 0.375rem; font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--obsidian); }
.ze-pages { display: flex; gap: 0.375rem; overflow-x: auto; scrollbar-width: none; padding: 2px; margin: -2px; }
.ze-pages::-webkit-scrollbar { display: none; }

/* ---- the docked inspector (tablet and small laptop) -------------------- */
.ze-dock { width: 360px; }

/* ---- loading and errors ------------------------------------------------- */
.ze-skel { flex: 1 1 auto; display: flex; gap: 8px; padding: 8px; min-height: 0; }
.ze-skel > div { border-radius: var(--r-panel); background: #ffffff; box-shadow: var(--ring-1), var(--ring-2); }
.ze-skel-mid { flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 1rem; text-align: center; background: var(--stage) !important; box-shadow: inset 0 0 0 1px var(--hair-2) !important; color: var(--stone); font-size: 14.5px; }
.ze-empty { margin: auto; display: grid; justify-items: center; gap: 0.75rem; max-width: 26rem; padding: 2rem 1.5rem; text-align: center; border-radius: var(--r-card); background: #ffffff; box-shadow: var(--ring-1), var(--ring-2); }
.ze-empty p { margin: 0; font-size: 15px; line-height: 1.7; color: var(--obsidian); }
.ze-toast {
  position: fixed; inset-inline: 0; bottom: 1rem; z-index: 60;
  width: fit-content; max-width: calc(100% - 2rem); margin-inline: auto;
  padding: 0.625rem 0.875rem;
  border-radius: var(--r-control); background: #ffffff;
  box-shadow: 0 0 0 1px rgba(185,28,28,0.28), 0 0 0 4px rgba(250,250,250,0.7);
  font-size: 14.5px; font-weight: 700; line-height: 1.7; color: var(--error);
}

/* ---- the gallery -------------------------------------------------------- */
.ze-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.ze-modal-scrim { position: absolute; inset: 0; background: rgba(17,17,17,0.42); }
.ze-modal-box {
  position: relative; display: flex; flex-direction: column;
  width: 100%; max-width: 64rem; height: min(80vh, 44rem);
  overflow: hidden; border-radius: var(--r-panel); background: #ffffff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.10), 0 0 0 6px rgba(250,250,250,0.35);
  font-family: var(--chrome); font-size: 14.5px; line-height: 1.7; color: var(--obsidian);
}
.ze-modal-h { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.75rem 1rem; box-shadow: 0 1px 0 var(--hair-2); }
.ze-modal-t { margin: 0; font-size: 16px; font-weight: 700; }
.ze-modal-grid { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 1rem; background: var(--ground); }
.ze-thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr)); gap: 0.625rem; }
.ze-thumb { position: relative; aspect-ratio: 1; padding: 0; overflow: hidden; border: 0; border-radius: var(--r-control); cursor: pointer; background: #ffffff; box-shadow: 0 0 0 1px var(--hair); }
.ze-thumb:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.3); }
.ze-thumb[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--obsidian), 0 0 0 5px rgba(23,23,23,0.10); }
.ze-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ze-modal-f { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.625rem 1rem; box-shadow: 0 -1px 0 var(--hair-2); color: var(--stone); }
.ze-modal .ze-input { min-width: 0; }

/* ---- a short screen: a phone on its side ---------------------------------
   844x390 is wide enough for the docked layout and not tall enough for its
   chrome: the bar and a two-line notice took 110px of 390 and left the stage
   264px. On a short screen the notice drops to its one-line form and the
   bar and gutters tighten, so the preview keeps the height. */
@media (max-height: 500px) {
  .ze-bar { height: 46px; }
  .ze-body { gap: 6px; padding: 6px; }
  .ze-demo { flex-wrap: nowrap; gap: 0.5rem; padding-block: 0.125rem; }
  .ze-demo-long { display: none; }
  .ze-demo-short { display: inline; }
  .ze-demo-t { flex: 0 0 auto; white-space: nowrap; }
  .ze-demo .ze-demo-types { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; min-width: 0; }
  .ze-demo .ze-demo-types a, .ze-demo .ze-demo-types span { flex: 0 0 auto; white-space: nowrap; }
  .ze-insp-head { min-height: 52px; padding-block: 0.25rem; }
}

/* ---- restraint ---------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .ze-root *, .ze-root *::before, .ze-root *::after,
  .ze-modal *, .ze-modal *::before, .ze-modal *::after {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}
`
