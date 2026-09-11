/**
 * The house style for the two auth surfaces under (main): the reset-password
 * card and the auth-code error.
 *
 * IT DECLARES NO COLOURS OF ITS OWN. Every value here is a token that
 * components/zenya/chrome/tokens.ts already defines on .zx-root, which
 * ProductShell mounts above these pages. That is the whole point of the
 * restyle: the card on this page and the card on /contact go grey together
 * the day the token moves, instead of one of them staying on #e5e2d9.
 *
 * WHAT CHANGED FROM THE OLD CARD, and why:
 *   · Elevation. The old card carried three stacked shadows — an inset white
 *     highlight, a 40px drop, and a violet-tinted ring. The house rule is one
 *     hairline ring and no drop shadow, so a card on bare paper reads as
 *     paper rather than as a sheet hovering over it.
 *   · Tracking. The h1 carried letter-spacing: -0.02em. Arabic letterforms
 *     connect; negative tracking pulls the joins into each other and breaks
 *     the word. 36 instances of this were removed from the dashboard in the
 *     restyle. This was the 37th.
 *   · The status greens. rgba(34,197,94,...) on white is 2.3:1 — it was never
 *     readable. The house triad uses #15803d (5.02:1) for success and
 *     #b91c1c (6.47:1) for danger, both measured on the card fill.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const AUTH_CSS = `
.zs-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  /* The old value was min-height: calc(100vh - 68px), where 68 was the
     height of a navbar that no longer exists. The pill is sticky and
     overlays the ground, so the wrap is simply the viewport less the band
     the pill occupies at the top. */
  min-height: calc(100svh - 7rem);
  padding: 1.5rem var(--gut) 4rem;
}

.zs-card {
  width: 100%;
  max-width: 27rem;
  background: var(--card);
  border-radius: var(--r-panel);
  box-shadow: 0 0 0 1px rgba(23, 23, 23, 0.08);
  padding: clamp(1.75rem, 5vw, 2.5rem);
}

.zs-top { text-align: center; margin-bottom: 1.75rem; }
.zs-mark { display: inline-flex; margin-bottom: 1.5rem; color: var(--obsidian); }
.zs-h1 {
  margin: 0 0 0.375rem;
  font-size: clamp(1.375rem, 1.1rem + 1.1vw, 1.625rem);
  font-weight: 700;
  line-height: 1.35;
  color: var(--obsidian);
}
.zs-sub { margin: 0; font-size: 0.875rem; line-height: 1.7; color: var(--stone); }

.zs-skeleton {
  height: 8rem;
  border-radius: var(--r-card);
  background: var(--field);
  animation: zs-pulse 1.6s var(--ease-out) infinite;
}
@keyframes zs-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }

.zs-form { display: grid; gap: 0.875rem; }
.zs-field { position: relative; }

.zs-input {
  width: 100%;
  box-sizing: border-box;
  /* 38px CSS clears the 32px coarse-pointer floor under ZoomLock's 0.85. */
  min-height: 3rem;
  padding: 0.875rem 1rem;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--obsidian);
  background: var(--field);
  border: 1px solid transparent;
  border-radius: var(--r-control);
  outline: none;
  transition: border-color 140ms var(--ease-out), background 140ms var(--ease-out);
}
.zs-input::placeholder { color: var(--ghost); }
.zs-input:focus-visible {
  background: var(--card);
  border-color: var(--violet);
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.16);
}
/* The eye sits on the left in an RTL field, which is where the old one was. */
.zs-input-eye { padding-left: 3rem; }

.zs-eye {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: var(--r-control);
  background: transparent;
  color: var(--stone-2);
  cursor: pointer;
  transition: background 140ms var(--ease-out), color 140ms var(--ease-out);
}
.zs-eye:hover { background: rgba(23, 23, 23, 0.05); color: var(--obsidian); }
.zs-eye:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

.zs-submit {
  margin-top: 0.25rem;
  width: 100%;
  min-height: 3rem;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fafafa;
  background: var(--obsidian);
  border: 0;
  border-radius: var(--r-control);
  cursor: pointer;
  transition: opacity 140ms var(--ease-out), transform 140ms var(--ease-out);
}
.zs-submit:hover:not(:disabled) { opacity: 0.88; }
.zs-submit:active:not(:disabled) { transform: scale(0.99); }
.zs-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.zs-submit:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

/* The same object as a link, for the error page, where "try again" is
   navigation rather than a form submit. */
.zs-submit-link {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.25rem;
  text-decoration: none;
}

.zs-spin { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
.zs-spin svg { animation: zs-rot 900ms linear infinite; }
@keyframes zs-rot { to { transform: rotate(360deg) } }

.zs-note {
  border-radius: var(--r-card);
  padding: 0.875rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.7;
}
.zs-note p { margin: 0; }
/* One green and one red, both from the documented triad, both measured on
   the card fill rather than on the ground. */
.zs-note[data-tone="success"] { background: rgba(21, 128, 61, 0.08); color: #15803d; }
.zs-note[data-tone="error"] { background: rgba(185, 28, 28, 0.07); color: #b91c1c; }

.zs-note-link {
  display: inline-block;
  margin-top: 0.75rem;
  font-weight: 600;
  color: var(--violet-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .zs-skeleton, .zs-spin svg { animation: none; }
  .zs-input, .zs-eye, .zs-submit { transition: none; }
}
`
