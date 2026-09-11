/**
 * The candidate legal set's stylesheet.
 *
 * Its own module for the reason app/demo/contact/styles.ts records: a style
 * element written inside a component is one identical copy of the whole block
 * per render, and a long template literal in the middle of JSX makes both
 * halves harder to read.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * TWO FLOORS ARE HELD HERE, both measured in RENDERED pixels rather than CSS
 * pixels, because components/ZoomLock.tsx writes CSS zoom: 0.85 on the
 * document element and a finger lands on what is rendered, not on what is
 * declared. A control that must be 32px under a coarse pointer is written at
 * 38px; one that must be 24px is written at 30px. Every number here that
 * looks generous is that division, not padding for its own sake.
 *
 * WHY THIS FILE IS MOSTLY ELEMENT SELECTORS. The five documents are the live
 * documents, moved without a word changed. Restyling them by rewriting every
 * tag into a class would have meant editing 791 lines of Arabic legal copy by
 * hand, which is exactly the kind of edit that silently drops a clause. So
 * the copy keeps its own plain markup and .zl-doc styles it by element. That
 * is also why the live pages fail: they carry prose prose-neutral, and
 * @tailwindcss/typography is not installed in this repo, so those two class
 * names compile to nothing and every one of those elements falls back to
 * Preflight.
 */

export const CSS = `
.zl-root {
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
.zl-root::before { content: ""; position: fixed; inset: 0; background: var(--ground); z-index: -1; }

/* Legal copy is full of e-mails, URLs and eight-digit registration numbers,
   and one of them is all it takes to push a 390px document wider than the
   phone. Held on the root so it reaches every clause, every table cell and
   every list item without being repeated. */
.zl-root, .zl-root * { overflow-wrap: anywhere; }
/* A flex or grid child holding text refuses to shrink below its longest
   word unless it is told it may. */
.zl-root :where(.zl-flex, .zl-grid) > * { min-width: 0; }

.zl-a11y { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

/* ---- header: the candidate set's, mechanic and all ---------------------- */
.zl-head { position: sticky; top: 0; z-index: 50; display: flex; justify-content: center; padding: 2rem 0 0; pointer-events: none; }
.zl-pill, .zl-phone-pill { pointer-events: auto; }
.zl-phone-pill {
  width: fit-content; max-width: 100%; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: min-width 380ms var(--ease-out) 220ms, background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
}
.zl-phone-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.375rem; height: 48px; padding-inline: 0.375rem; }
.zl-phone-mark { display: flex; align-items: center; justify-content: center; justify-self: center; min-height: 38px; padding-inline: 0.5rem; }
.zl-mark-svg-sm { height: 16px; color: #000; }
/* 38px, not 32: rendered under the root zoom that is 32.3px, which is the
   floor a coarse pointer is owed. */
.zl-round { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; border-radius: 999px; color: var(--obsidian); }
.zl-round:hover { background: rgba(0,0,0,0.05); }
.zl-account-phone { justify-self: end; }
.zl-phone-menu { display: grid; padding: 0.125rem 0.375rem 0.375rem; }
@media (min-width: 768px) { .zl-phone-pill { display: none; } }
@media (max-width: 767px) { .zl-pill { display: none; } }
.zl-pill {
  border-radius: 24px; overflow: hidden; width: 396px;
  background: rgba(238, 238, 243, 0.60);
  -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.18), 0 0 0 4px rgba(250,250,250,0.5);
  transition: background-color 520ms var(--ease-out), box-shadow 520ms var(--ease-out);
  contain: layout paint;
}
@media (prefers-reduced-transparency: reduce) { .zl-pill, .zl-phone-pill { background: #f2f2f5; -webkit-backdrop-filter: none; backdrop-filter: none; } }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .zl-pill, .zl-phone-pill { background: #f2f2f5; } }
.zl-bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 48px; padding-inline-start: 0.75rem; padding-inline-end: 0.375rem; }
.zl-side { display: flex; align-items: center; min-width: 0; }
.zl-side-start { justify-content: flex-start; }
.zl-side-end { justify-content: flex-end; }
.zl-mark { display: flex; align-items: center; min-height: 38px; padding: 0 0.5rem; flex-shrink: 0; }
.zl-mark-svg { height: 17px; color: #000; }
.zl-head[data-dark] .zl-pill, .zl-head[data-dark] .zl-phone-pill {
  background: rgba(32,32,38,0.72);
  box-shadow: 0 0 0 1px rgba(250,250,250,0.12), 0 0 0 4px rgba(19,19,22,0.5);
}
.zl-head[data-dark] .zl-mark-svg, .zl-head[data-dark] .zl-mark-svg-sm { color: #fafafa; }
.zl-head[data-dark] .zl-nav-item, .zl-head[data-dark] .zl-tray-row, .zl-head[data-dark] .zl-round { color: rgba(250,250,250,0.66); }
.zl-head[data-dark] .zl-nav-item:hover, .zl-head[data-dark] .zl-tray-row:hover { color: #fafafa; }
.zl-head[data-dark] .zl-sep { background: rgba(250,250,250,0.16); }
.zl-head[data-dark] .zl-account { background: #fafafa; color: #171717; }
.zl-nav { display: flex; align-items: center; gap: 0.125rem; }
/* 14.5px, NOT THE SET'S 14px, and it fixes two floors with one number.
   Measured on the sibling candidates: a 14px nav item renders 11.9px under
   the root zoom, below the 12px type floor, and stands 31.8px tall, below
   the 32px a coarse pointer is owed. 14.5px * 1.24 + 20px of padding is
   38.0px CSS, which renders 32.3px, and the type renders 12.33px. The other
   seven candidate pages carry the 14px version and have the same two
   numbers; that is a finding for the set, not a divergence invented here. */
.zl-nav-item { border-radius: 999px; padding: 0.625rem 0.75rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; color: #666; text-decoration: none; transition: color 520ms var(--ease-out); }
.zl-nav-item:hover { color: var(--obsidian); }
.zl-nav-item[aria-current] { color: var(--obsidian); font-weight: 700; }
.zl-sep { width: 1px; height: 20px; margin-inline-end: 0.375rem; background: rgba(0,0,0,0.07); transition: background-color 520ms var(--ease-out); }
.zl-account { border-radius: 999px; padding: 0.6875rem 1rem; font-size: 14.5px; line-height: 1.24; white-space: nowrap; text-decoration: none; background: var(--obsidian); color: var(--ground); transition: opacity 150ms var(--ease-out), background-color 520ms var(--ease-out), color 520ms var(--ease-out); }
.zl-account:hover { opacity: 0.86; }
.zl-drawer { display: grid; transition: grid-template-rows 440ms var(--ease-out), visibility 0s linear 440ms; }
.zl-drawer[data-open] { transition-delay: 0s, 0s; }
.zl-drawer-clip { width: 0; min-width: 100%; overflow: hidden; }
.zl-tray-row { display: block; border-radius: 8px; padding: 0.6875rem 0.75rem; font-size: 14.5px; line-height: 1.24; text-decoration: none; color: #666; }
.zl-tray-row:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }

/* ---- the page frame ----------------------------------------------------- */
/* NARROWER THAN THE REST OF THE CANDIDATE SET, and deliberately. The other
   seven pages lay out in 1120px because they are decks: rows of cards that
   want the width. A legal page is a column plus its index, which measures
   33rem + 4rem + 268px = 860px, so a 1120 wrap leaves 260px of slack inside
   itself and the whole composition drifts to the inline-start edge with a
   420px void opposite it. 960 centres the pair. The header pill is centred
   on its own and is unaffected, so the two pages still line up on the mark. */
.zl-wrap { width: min(100%, 960px); margin-inline: auto; }

/* ---- the opening --------------------------------------------------------
   No eyebrow. The candidate set uses one above a heading, and the skill caps
   them at one per three sections; a legal document has one section, so the
   budget is one and the document's own title spends it better than a label
   repeating the word "legal" above it.
------------------------------------------------------------------------- */
.zl-open { padding-top: clamp(3rem, 8vw, 6.5rem); padding-bottom: clamp(1.25rem, 3vw, 2rem); }
.zl-h1 {
  margin: 0; max-width: 18ch;
  font-size: clamp(30px, 5vw, 46px); font-weight: 900; line-height: 1.35; color: var(--obsidian);
}
/* THE DATE IS A FACT, NOT A FOOTNOTE. On the live pages it is a 14px grey
   line under the title, indistinguishable from body copy. Here it is an
   object with a ring, because "is this the version I agreed to" is the first
   question anyone opening a policy actually has. The value is
   COMPANY.LAST_UPDATED; nothing on this page retypes it. */
.zl-stamp {
  display: inline-flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  margin: clamp(1rem, 2.4vw, 1.5rem) 0 0; padding: 0.5rem 0.875rem;
  border-radius: 999px; background: var(--card);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
  font-size: 14.5px; font-weight: 500; line-height: 1.6; color: var(--stone);
}
.zl-stamp b { color: var(--obsidian); font-weight: 700; font-variant-numeric: tabular-nums; }
.zl-stamp-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--violet); flex: 0 0 auto; }
.zl-lede {
  margin: clamp(0.875rem, 2vw, 1.25rem) 0 0; max-width: 52ch;
  font-size: clamp(14.5px, 1.6vw, 16px); font-weight: 500; line-height: 1.9; color: var(--stone);
}

/* ---- the two columns ----------------------------------------------------
   PHONE FIRST: one column, and the spine is a disclosure above the document.
   The sidebar is what the wide screen ADDS, not what the phone loses.
------------------------------------------------------------------------- */
.zl-body { display: block; padding-bottom: clamp(2.5rem, 6vw, 4rem); }
/* THE DOCUMENT COLUMN IS SIZED, THE SPINE COLUMN ABSORBS THE REST. A 1fr
   document column next to a fixed sidebar looks right until the 33rem
   measure caps it: the column stays 788px wide, the text stops at 528, and
   the 260px left over opens as a void between the last word and the spine.
   Sizing the document column instead puts the spine directly across the
   gutter from it and moves the slack to the outer edge, where it reads as
   page margin. */
@media (min-width: 1024px) {
  .zl-body {
    display: grid; grid-template-columns: minmax(0, 33rem) minmax(0, 1fr);
    gap: clamp(2rem, 4vw, 4rem); align-items: start;
  }
}

/* ---- the switcher -------------------------------------------------------
   Five real routes, not five tabs. The live site keeps /privacy, /terms,
   /cookies, /refund and /subprocessors as five separate indexed URLs and has
   to keep them, so the switcher is five links and the address changes when
   you use it.

   On a phone it is a scroll-snap row, which is the one deliberate scroller
   on this page. The document itself never scrolls sideways.
------------------------------------------------------------------------- */
.zl-switch { margin: 0 0 clamp(1.5rem, 3.5vw, 2rem); }
.zl-switch-rail {
  display: flex; gap: 0.5rem; overflow-x: auto; scroll-snap-type: x proximity;
  padding: 0.25rem 0.25rem 0.75rem; margin: -0.25rem -0.25rem 0;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
}
.zl-switch-rail::-webkit-scrollbar { display: none; }
.zl-doc-link {
  scroll-snap-align: start; flex: 0 0 auto;
  display: inline-flex; align-items: center; min-height: 38px; padding: 0 0.875rem;
  border-radius: 999px; background: var(--card); color: var(--stone);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  font-size: 14.5px; font-weight: 500; line-height: 1.5; white-space: nowrap; text-decoration: none;
  transition: color 240ms var(--ease-out), box-shadow 240ms var(--ease-out);
}
.zl-doc-link:hover { color: var(--obsidian); box-shadow: 0 0 0 1px rgba(0,0,0,0.16); }
.zl-doc-link[aria-current] { background: var(--obsidian); color: var(--ground); font-weight: 700; box-shadow: none; }
/* At 1120 the five titles fit the row; below that the row scrolls, which is
   the one deliberate scroller on this page. */

/* ---- the spine ----------------------------------------------------------
   1280 lines of clauses need a way in. At 1024 and up it is a sticky
   sidebar that knows where the reader is. Below that it is a disclosure,
   closed: a 15-entry list opened by default would push the first clause off
   a 390px screen, and the reader came for the clause.
------------------------------------------------------------------------- */
.zl-spine { min-width: 0; }
.zl-spine-panel {
  border-radius: var(--r-card); background: var(--card);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55);
  margin: 0 0 clamp(1.75rem, 4vw, 2.5rem);
}
.zl-spine-sum {
  display: flex; align-items: center; gap: 0.5rem; min-height: 38px;
  padding: 0.5rem 0.875rem; cursor: pointer; list-style: none;
  font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--obsidian);
}
.zl-spine-sum::-webkit-details-marker { display: none; }
.zl-spine-count { margin-inline-start: auto; font-size: 14.5px; font-weight: 500; color: var(--stone); font-variant-numeric: tabular-nums; }
.zl-chev { flex: 0 0 auto; color: var(--stone); transition: transform 320ms var(--ease-out); }
.zl-spine-panel[open] .zl-chev { transform: rotate(180deg); }
/* The three overrides are belt to the brace of keeping the spine outside
   .zl-doc: if this list ever ends up inside the document column again, it
   still refuses the document's markers and link decoration rather than
   quietly turning into bulleted body copy. */
.zl-toc { display: grid; padding: 0 0.5rem 0.5rem; margin: 0; list-style: none; }
.zl-toc li { margin: 0; list-style: none; }
.zl-toc li::marker { content: none; }
.zl-toc a { text-decoration: none; }
.zl-toc a {
  display: block; border-radius: 8px; padding: 0.5rem 0.625rem; min-height: 30px;
  font-size: 14.5px; font-weight: 500; line-height: 1.55; color: var(--stone); text-decoration: none;
  transition: color 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zl-toc a:hover { background: rgba(0,0,0,0.04); color: var(--obsidian); }
/* 38px CSS renders 32.3px, which is the floor a finger is owed. Only under a
   coarse pointer: on a mouse the 30px above already clears the 24px floor,
   and a 15-row list of 38px rows is taller than it needs to be. */
@media (pointer: coarse) { .zl-toc a { min-height: 38px; } }
.zl-toc li[data-l="3"] a { padding-inline-start: 1.5rem; font-size: 14.5px; color: var(--stone-2); }
/* The current clause is reported by the accent, which is what the accent is
   for. The mark is a filled dot on the inline-start edge, not a background
   wash: a wash on a list of 15 rows repaints a quarter of the sidebar. */
.zl-toc a[data-here] { color: var(--violet-ink); font-weight: 700; }
.zl-toc a[data-here]::before {
  content: ""; float: inline-start; width: 5px; height: 5px; margin-block-start: 0.55em;
  margin-inline-end: 0.5rem; border-radius: 999px; background: var(--violet);
}
/* One list, two homes. Below 1024 it is the disclosure inside the document
   column; at 1024 and up that disclosure is gone and the sidebar carries it,
   sticky, with its own scroll when the clause list is longer than the
   window. Each is display:none at the other width, so a screen reader is
   never read the same fifteen rows twice. */
.zl-spine { display: none; }
@media (min-width: 1024px) {
  .zl-spine-phone { display: none; }
  .zl-spine {
    display: block; max-width: 268px; position: sticky; top: 96px;
    max-height: calc(100vh - 120px); overflow-y: auto; overscroll-behavior: contain;
  }
  .zl-spine .zl-spine-panel { background: transparent; box-shadow: none; margin: 0; }
  .zl-toc { padding: 0; }
}

/* ---- the document -------------------------------------------------------
   THE MEASURE. 33rem at the widest, which measures 62 Arabic characters per
   line at the body size and 47 on a 390px phone. The live pages run the same
   copy at 95 characters on a 1440 screen, because max-w-3xl is a Latin
   measure and Arabic glyphs are narrower than a Latin zero, so the same
   column holds half as many words again.

   Everything below is an element selector on purpose: see the note at the
   top of this file.
------------------------------------------------------------------------- */
.zl-doc { min-width: 0; max-width: 33rem; }
/* Every clause is a link target, and the header is sticky, so a jump has to
   clear it or the clause lands underneath the pill. */
.zl-doc :where(h2, h3) { scroll-margin-top: 104px; }

.zl-doc h2 {
  margin: clamp(2.5rem, 5vw, 3.25rem) 0 0;
  font-size: clamp(21px, 2.6vw, 25px); font-weight: 900; line-height: 1.5; color: var(--obsidian);
}
.zl-doc h2:first-child { margin-top: 0; }
.zl-doc h3 {
  margin: clamp(1.75rem, 3.5vw, 2.25rem) 0 0;
  font-size: clamp(16.5px, 1.9vw, 18px); font-weight: 700; line-height: 1.6; color: var(--obsidian);
}
/* 15.5px at the floor renders 13.2px under the root zoom, and leading is
   1.95 because a legal clause is read slowly and Arabic descenders need the
   room. Nothing here tracks. */
.zl-doc p {
  margin: clamp(0.75rem, 1.8vw, 1rem) 0 0;
  font-size: clamp(15.5px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.95; color: var(--stone);
}
.zl-doc strong { color: var(--obsidian); font-weight: 700; }
.zl-doc em { font-style: normal; font-weight: 700; color: var(--obsidian); }

/* A LINK IN A LEGAL DOCUMENT HAS TO LOOK LIKE ONE. On the live pages every
   anchor is #1c1c1c with text-decoration: none, which is the body colour
   exactly: 60-odd links across the five documents, none of them visible.
   Colour alone would not fix it either, so these carry an underline as well
   as the accent's reading weight. */
.zl-doc a {
  color: var(--violet-ink); font-weight: 500;
  text-decoration: underline; text-decoration-thickness: from-font; text-underline-offset: 3px;
  border-radius: 3px;
}
.zl-doc a:hover { color: var(--obsidian); }

/* Preflight strips the marker and the indent from every list, so on the live
   pages a bulleted clause is a run of text. These get the marker back, in
   the accent, at the size the copy is set in. */
.zl-doc ul, .zl-doc ol { margin: clamp(0.75rem, 1.8vw, 1rem) 0 0; padding-inline-start: 1.375rem; }
.zl-doc ul { list-style: disc; }
.zl-doc ol { list-style: arabic-indic; }
.zl-doc li {
  margin: 0.5rem 0 0;
  font-size: clamp(15.5px, 1.7vw, 16.5px); font-weight: 400; line-height: 1.95; color: var(--stone);
}
.zl-doc li::marker { color: var(--violet); }
.zl-doc li > p:first-child { margin-top: 0; }

.zl-doc code {
  padding: 0.1em 0.4em; border-radius: 6px; background: var(--field); color: var(--obsidian);
  /* 0.92em of a 14.5px table cell is 13.34px, which renders 11.34px and is
     under the floor. The floor wins; the ratio applies above it. */
  font-size: max(14.2px, 0.94em); font-weight: 500;
}

/* ---- tables -------------------------------------------------------------
   THE TABLE OWNS THE OVERFLOW, THE DOCUMENT NEVER DOES. Below 768 the six
   column subprocessors table is a record list instead, because a scroller
   that starts 22px wide is not a table, it is a puzzle. See the note in
   documents/subprocessors.tsx.

   The hairlines here are structure, not decoration: a table with no rules is
   what the live pages ship, and it reads as six paragraphs stacked sideways.
------------------------------------------------------------------------- */
.zl-tw { margin: clamp(1rem, 2.4vw, 1.5rem) 0 0; }
.zl-tw table { width: 100%; border-collapse: collapse; }
.zl-tw th, .zl-tw td {
  font-size: clamp(14.5px, 1.6vw, 15.5px); line-height: 1.8; text-align: start; vertical-align: top;
}
.zl-tw th { font-weight: 700; color: var(--obsidian); }
.zl-tw td { font-weight: 400; color: var(--stone); }
.zl-tw a { color: var(--violet-ink); font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }

/* Phone: every row is a record card, every cell wears its own column name. */
@media (max-width: 767px) {
  .zl-tw thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .zl-tw table, .zl-tw tbody, .zl-tw tr, .zl-tw td { display: block; }
  .zl-tw tr {
    margin-top: 0.75rem; padding: 0.875rem 1rem; border-radius: var(--r-card); background: var(--card);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  }
  .zl-tw td { padding: 0; }
  .zl-tw td + td { margin-top: 0.625rem; }
  .zl-tw td[data-label]::before {
    content: attr(data-label); display: block;
    font-size: 14.5px; font-weight: 700; line-height: 1.5; color: var(--stone-2);
  }
  .zl-tw .zl-td-name { font-size: 17px; font-weight: 700; color: var(--obsidian); }
  /* The two-column tables in privacy and cookies have no data-label, so they
     keep a labelled pair layout driven by the first cell instead. */
  .zl-tw tr > td:first-child { font-weight: 700; color: var(--obsidian); }
}
/* From 768 it is a real table, and the wrapper is the only thing on the page
   allowed to scroll sideways. */
@media (min-width: 768px) {
  .zl-tw { overflow-x: auto; }
  .zl-tw th, .zl-tw td { padding: 0.75rem 0.875rem 0.75rem 0; }
  .zl-tw thead th { border-bottom: 1px solid rgba(0,0,0,0.14); padding-top: 0; }
  .zl-tw tbody tr + tr td { border-top: 1px solid rgba(0,0,0,0.06); }
  .zl-tw td[data-label]::before { content: none; }
}

/* ---- the note this page is a candidate --------------------------------- */
.zl-foot-note {
  max-width: 33rem; margin: clamp(2rem, 5vw, 3rem) 0 clamp(2rem, 5vw, 3rem);
  font-size: 14.5px; font-weight: 500; line-height: 1.9; color: var(--stone);
}
.zl-link { color: var(--violet-ink); font-weight: 700; text-underline-offset: 3px; text-decoration: underline; }
.zl-link:hover { color: var(--obsidian); }

/* ---- arrival ------------------------------------------------------------
   The hidden half lives under .zl-js, which the script adds on mount, so a
   browser that never runs it reads a finished page. A resting state is the
   finished state, and the live /contact page is the counter-example: its
   blocks are server-rendered with style="opacity:0", so it is blank with
   JavaScript off.

   MOTION_INTENSITY is 2 here. One fade on arrival, and the spine's dot. A
   legal document should not move while somebody is reading a clause.
------------------------------------------------------------------------- */
.zl-js [data-reveal] { opacity: 0; transform: translateY(12px); }
.zl-js [data-reveal][data-in] {
  opacity: 1; transform: none;
  transition: opacity 560ms var(--ease-out), transform 560ms var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
  .zl-js [data-reveal] { opacity: 1; transform: none; transition: none; }
  .zl-chev { transition: none; }
  .zl-root * { scroll-behavior: auto !important; }
}

/* Focus is never removed, only shaped. 4px of halo needs 4px of room, so
   nothing that can hold focus sits inside a permanent clip. */
.zl-root :where(a, button, summary):focus-visible {
  outline: 2px solid var(--violet-ink); outline-offset: 3px; border-radius: 6px;
}


/* ---------------------------------------------------------------------------
   TARGET FLOOR.

   Every control on this page has to measure at least 32 RENDERED pixels on
   both axes. components/ZoomLock.tsx writes zoom: 0.85 on the document
   element always, so a length authored in CSS reaches the screen at 85% of
   itself: the CSS floor is 38, not 32. Measured before this block, at 360 to
   1440: .zl-doc-link 81.8x27.5, .zl-spine-sum 282.9x27.5.

   Inline links inside a sentence are deliberately not here. WCAG 2.5.8
   exempts them, and it has to - an inline link inherits the line box of the
   prose around it, so giving one a 32px target means giving every paragraph
   that contains a link a 32px line height.
--------------------------------------------------------------------------- */
.zl-round {
  min-width: 38px;
  min-height: 38px;
}
/* The subprocessor table's policy links are the word "رابط" in a cell: a
   control, not prose, and they measured 23.5x12. The word is narrow, so they
   need the width floor as well as the height one. */
.zl-doc td a { min-width: 38px; justify-content: center; }
.zl-doc td a,
.zl-phone-mark,
.zl-mark,
.zl-account,
.zl-account-phone,
.zl-nav-item,
.zl-tray-row,
.zl-doc-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
}
`
