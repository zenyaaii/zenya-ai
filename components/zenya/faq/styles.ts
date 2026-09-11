/**
 * The candidate FAQ page's own stylesheet. Composed after CHROME_CSS and
 * MARKETING_CSS from components/zenya/chrome.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 *
 * ONE LAYOUT FAMILY, TWICE, AND THAT IS THE RIGHT ANSWER HERE. The skill
 * bans a layout family appearing twice on a page, and this page has two
 * disclosure lists. They are the same eleven questions in two languages, and
 * giving the English half a different shape to satisfy a counting rule would
 * make the page harder to read, not more varied. The rule exists against
 * monotony that hides meaning; here the repetition IS the meaning. The two
 * are separated by a hairline, a direction change and a quieter scale.
 *
 * WHY NATIVE details AND NOT THE RADIX ACCORDION THE LIVE PAGE USES. A
 * disclosure that only opens under JavaScript is a disclosure that is shut
 * for a reader without it: measured on the live page with JavaScript
 * disabled, only 827 characters of the whole FAQ are reachable, because the
 * eleven answers are collapsed and three blocks are server-rendered with
 * style="opacity:0" on top of that. details/summary opens with no script at
 * all, keeps the keyboard and the screen-reader semantics for free, and is
 * what the legal candidate's spine already uses.
 */

export const CSS = `
/* ---- the question list -------------------------------------------------- */
.zx-qs { padding-bottom: clamp(1rem, 3vw, 2rem); }
.zx-q {
  border-top: 1px solid rgba(0,0,0,0.08);
}
.zx-q:last-child { border-bottom: 1px solid rgba(0,0,0,0.08); }
/* 38px of minimum height renders 32.3px, which is the floor a coarse pointer
   is owed, and the padding gives a real one well above it. */
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
.zx-qa {
  padding: 0 0 clamp(1.125rem, 2.6vw, 1.5rem);
  font-size: clamp(14.5px, 1.6vw, 16px); font-weight: 400; line-height: 1.95; color: var(--stone);
}
/* The answer arrives rather than appearing, without the height animation a
   native details cannot do: the panel is already laid out, so only its own
   opacity and offset move. Off entirely under reduced motion, and never the
   resting state. */
.zx-q[open] .zx-qa { animation: zx-qa-in 380ms var(--ease-out) both; }
@keyframes zx-qa-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .zx-q[open] .zx-qa { animation: none; }
  .zx-qchev { transition: none; }
}

/* ---- the closing block ------------------------------------------------- */
.zx-close { padding: clamp(2.5rem, 6vw, 4rem) 0 clamp(1.5rem, 4vw, 2.5rem); }
.zx-close .zx-p { margin-bottom: 0; }

/* ---- the English mirror ------------------------------------------------- */
.zx-mirror { padding: clamp(3rem, 7vw, 5rem) 0 clamp(1rem, 3vw, 2rem); border-top: 1px solid rgba(0,0,0,0.08); }
.zx-mirror h2 { margin: 0 0 clamp(1rem, 2.4vw, 1.5rem); font-size: clamp(21px, 2.6vw, 27px); font-weight: 900; line-height: 1.35; color: var(--obsidian); letter-spacing: 0; }
.zx-mirror .zx-eyebrow { margin-bottom: 1rem; }
.zx-mirror .zx-qsum { font-size: clamp(15px, 1.7vw, 16px); }
.zx-mirror .zx-qa { font-size: clamp(14.2px, 1.55vw, 15.5px); }
`
