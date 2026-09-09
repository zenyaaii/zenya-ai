/**
 * THE CANDIDATE SET'S SHARED CHROME, as CSS.
 *
 * Seven candidate pages each carry their own copy of this block, which is how
 * a floor fixed on one page stays broken on the other six: the 14px header
 * type that renders 11.9px, and the 31.8px nav item against a 32px coarse
 * floor, were fixed in app/demo/legal/styles.ts and nowhere else. This module
 * is that corrected version, lifted verbatim, so the pages built from here on
 * share one definition instead of eight.
 *
 * Everything is prefixed .zx- and scoped under .zx-root. A page composes it
 * with its own stylesheet: CHROME_CSS first, then the page's own rules.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * FLOORS ARE IN RENDERED PIXELS, not CSS pixels, because
 * components/ZoomLock.tsx writes CSS zoom: 0.85 on the document element and a
 * finger lands on what is rendered. 38px CSS clears the 32px coarse floor;
 * 30px CSS clears the 24px one; 14.2px CSS clears the 12px type floor.
 */

export const CHROME_CSS = `
.zx-root {
  --ground: #fafafa;
  --card: #ffffff;
  --obsidian: #171717;
  /* The three greys that PASS, carried from /demo/contact unchanged.
     Measured on the ground: 7:1, 5.45:1 and 4.81:1. */
  --stone: #56565a;
  --stone-2: #66666e;
  --ghost: #6b6b73;
  --violet: #5e6ad2;
  /* THE ACCENT'S TEXT WEIGHT. #5e6ad2 is a mark colour, not a reading
     colour: 4.28:1 on a field fill, under the floor. The darker step is
     5.77:1 on the ground, so every violet RUN OF TEXT uses it while every
     violet DOT, RULE and FILL keeps #5e6ad2. A legal page is nothing but
     runs of text and links, so this token matters more here than anywhere
     else in the candidate set: every one of the 60+ links on these five
     documents is painted with it. */
  --violet-ink: #4f5ab8;
  --field: #f4f4f6;
  /* THE FOOTER READS THESE OFF THE HOST PAGE'S ROOT, and it is not optional.
     PricingFooter paints its cap with background: var(--onyx) and colours
     its mail link with var(--violet-lift) while declaring neither. Without
     them the cap falls back to transparent, the footer's #a8a8b2 body text
     stands on white paper at 2.36:1 instead of 7.87:1 on obsidian, and the
     header has no dark ground left to invert over. */
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
.zx-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* Legal copy is full of e-mails, URLs and eight-digit registration numbers,
   and one of them is all it takes to push a 390px document wider than the
   phone. Held on the root so it reaches every clause, every table cell and
   every list item without being repeated. */
.zx-root, .zx-root * { overflow-wrap: anywhere; }
/* A flex or grid child holding text refuses to shrink below its longest
   word unless it is told it may. */
.zx-root :where(.zl-flex, .zl-grid) > * { min-width: 0; }

.zl-a11y { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

/* ---- header: the candidate set's, mechanic and all ---------------------- */
.zx-head { position: sticky; top: 0; z-index: 50; display: flex; justify-content: center; padding: 2rem 0 0; pointer-events: none; }
.zx-pill, .zx-phone-pill { pointer-events: auto; }
.zx-phone-pill {
  width: fit-content; max-width: 100%; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: min-width 380ms var(--ease-out) 220ms, background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
}
.zx-phone-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.375rem; height: 48px; padding-inline: 0.375rem; }
.zx-phone-mark { display: flex; align-items: center; justify-content: center; justify-self: center; min-height: 38px; padding-inline: 0.5rem; }
.zx-mark-svg-sm { height: 16px; color: #000; }
/* 38px, not 32: rendered under the root zoom that is 32.3px, which is the
   floor a coarse pointer is owed. */
.zx-round { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
.zx-round:hover { background: rgba(0,0,0,0.05); }
.zx-account-phone { justify-self: end; }
.zx-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
@media (min-width: 768px) { .zx-phone-pill { display: none; } }
@media (max-width: 767px) { .zx-pill { display: none; } }
.zx-pill {
  border-radius: 24px; overflow: hidden; width: 396px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
  contain: layout paint;
}
@media (prefers-reduced-transparency: reduce) { .zx-pill, .zx-phone-pill { background: #f2f2f5; -webkit-backdrop-filter: none; backdrop-filter: none; } }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .zx-pill, .zx-phone-pill { background: #f2f2f5; } }
.zx-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.zx-side { display: flex; align-items: center; min-width: 0; }
.zx-side-start { justify-content: flex-start; }
.zx-side-end { justify-content: flex-end; }
.zx-mark { display: flex; align-items: center; min-height: 38px; padding: 0 0.5rem; flex-shrink: 0; }
.zx-mark-svg { height: 17px; color: #000; }
.zx-head[data-dark] .zx-pill, .zx-head[data-dark] .zx-phone-pill {
  background: rgba(32,32,38,0.72);
  box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5);
}
.zx-head[data-dark] .zx-mark-svg, .zx-head[data-dark] .zx-mark-svg-sm { color: #fafafa; }
.zx-head[data-dark] .zx-nav-item, .zx-head[data-dark] .zx-tray-row, .zx-head[data-dark] .zx-round { color: rgba(250,250,250,0.66); }
.zx-head[data-dark] .zx-nav-item:hover, .zx-head[data-dark] .zx-tray-row:hover { color: #fafafa; }
.zx-head[data-dark] .zx-sep { background: rgba(250,250,250,0.16); }
.zx-head[data-dark] .zx-account { background: #fafafa; color: #171717; }
.zx-nav { display: flex; align-items: center; gap: 0.125rem; }
/* 14.5px, NOT THE SET'S 14px, and it fixes two floors with one number.
   Measured on the sibling candidates: a 14px nav item renders 11.9px under
   the root zoom, below the 12px type floor, and stands 31.8px tall, below
   the 32px a coarse pointer is owed. 14.5px * 1.24 + 20px of padding is
   38.0px CSS, which renders 32.3px, and the type renders 12.33px. The other
   seven candidate pages carry the 14px version and have the same two
   numbers; that is a finding for the set, not a divergence invented here. */
.zx-nav-item { border-radius: 999px; padding: 0.625rem 0.75rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.zx-nav-item:hover { color: var(--obsidian); }
.zx-nav-item[aria-current] { color: var(--obsidian); font-weight: 700; }
.zx-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); transition: background-color 520ms var(--ease-out); }
.zx-account { border-radius: 999px; padding: 0.6875rem 1rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out), background-color 520ms var(--ease-out), color 520ms var(--ease-out); }
.zx-account:hover { opacity: 0.86; }
.zx-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.zx-drawer[data-open] { transition-delay: 0s, 0s; }
.zx-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zx-tray-row { display: block; border-radius: 8px; padding: 0.6875rem 0.75rem; font-size: 14.5px; line-height: 1.24; text-decoration: none; color: #666; }
.zx-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

`
