/**
 * The house style for accounts.zenyaai.co — the sign-in card, the sign-up
 * card, the reset card, and the account chooser.
 *
 * DESIGN READ: a redesign-preserve of the portal door for returning
 * customers, in the house flat-paper language, leaning on the chrome tokens
 * the rest of the product already reads.
 * Dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 3, VISUAL_DENSITY 3 — the same
 * three /login shipped with, because this is the same door on a second host
 * and two doors that disagree are a bug the customer sees.
 *
 * WHAT THIS RETIRES. The portal was the last surface carrying the aurora:
 * components/accounts/AccountsBackground drifted three blurred orbs — violet,
 * amber and teal — plus a moving mesh and two sparkles over a cream
 * #f7f4ed → #f2eee4 gradient, and the auth card floated over it on
 * backdrop-filter: blur(18px) at 72% white with a 70px drop shadow. The
 * marketing site dropped that language; the dashboard dropped it; this was
 * the one place it was still running, on the screen every customer passes
 * through to sign in.
 *
 * It is replaced by the thing underneath it: flat #fafafa, a white card, one
 * hairline ring. No blur, no orbs, no gradient. Six animated elements that
 * ran forever on the page a person is trying to read a password field on
 * become none.
 *
 * WHY THE PORTAL KEEPS ITS OWN STYLESHEET rather than rendering
 * components/zenya/access/AccessView, which is this same door already built
 * in the house style: AccessView's header links /themes, /pricing and
 * /contact. On this host middleware rewrites every unrouted path under
 * /accounts, so those three links resolve to /accounts/themes and friends and
 * 404. Only /terms, /privacy, /refund, /cookies and /subprocessors are
 * allowed through. Dropping AccessView in here would have restyled the portal
 * and broken three links in the header doing it.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const ACCOUNTS_CSS = `
.zn-ground {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem var(--gut, clamp(1rem, 4vw, 3rem));
  background: var(--ground);
  color: var(--obsidian);
}

.zn-card {
  width: 100%;
  max-width: 27rem;
  background: var(--card);
  border-radius: var(--r-panel);
  /* One ring. The old card stacked an inset white highlight, a 70px drop and
     a violet-tinted ring, which is how a card ends up looking like it is
     hovering over paper instead of lying on it. */
  box-shadow: 0 0 0 1px rgba(23, 23, 23, 0.08);
  padding: clamp(1.75rem, 5vw, 2.5rem);
}

.zn-top { text-align: center; margin-bottom: 1.75rem; }
.zn-mark { display: inline-flex; margin-bottom: 1.5rem; color: var(--obsidian); }
.zn-h1 {
  margin: 0 0 0.375rem;
  font-size: clamp(1.375rem, 1.1rem + 1.1vw, 1.625rem);
  font-weight: 700;
  /* No negative tracking. Arabic letterforms connect and -0.02em pulls the
     joins into each other. */
  line-height: 1.35;
  color: var(--obsidian);
}
.zn-sub { margin: 0; font-size: 0.875rem; line-height: 1.7; color: var(--stone); }

.zn-stack { display: grid; gap: 0.625rem; }

.zn-skeleton {
  height: 3.375rem;
  border-radius: var(--r-control);
  background: var(--field);
  animation: zn-pulse 1.6s var(--ease-out) infinite;
}
@keyframes zn-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }

/* ── the account chooser ─────────────────────────────────────────────── */
.zn-account {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 3.5rem;
  padding: 0.75rem;
  text-align: start;
  font: inherit;
  color: var(--obsidian);
  background: var(--card);
  border: 1px solid rgba(23, 23, 23, 0.10);
  border-radius: var(--r-card);
  cursor: pointer;
  transition: border-color 140ms var(--ease-out), background 140ms var(--ease-out);
}
.zn-account:hover:not(:disabled) { border-color: var(--violet); background: #fcfcfd; }
.zn-account:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.zn-account:disabled { opacity: 0.55; cursor: not-allowed; }

.zn-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: var(--field);
  color: var(--violet-ink);
  font-size: 0.9375rem;
  font-weight: 700;
  overflow: hidden;
}
.zn-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* min-width: 0 so a long address truncates instead of pushing the row wide. */
.zn-account-text { min-width: 0; display: grid; gap: 0.125rem; }
.zn-account-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--obsidian);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zn-account-mail {
  font-size: 0.8125rem;
  color: var(--stone-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zn-account-go { margin-inline-start: auto; flex: none; color: var(--ghost); }

/* ── fields ──────────────────────────────────────────────────────────── */
.zn-field { position: relative; }
.zn-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 3.375rem;
  padding: 0.9375rem 1rem;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--obsidian);
  background: var(--field);
  border: 1px solid transparent;
  border-radius: var(--r-control);
  outline: none;
  transition: border-color 140ms var(--ease-out), background 140ms var(--ease-out);
}
.zn-input::placeholder { color: var(--ghost); }
.zn-input:focus-visible {
  background: var(--card);
  border-color: var(--violet);
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.16);
}
.zn-input-eye { padding-left: 3rem; }

.zn-eye {
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
.zn-eye:hover { background: rgba(23, 23, 23, 0.05); color: var(--obsidian); }
.zn-eye:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

/* ── actions ─────────────────────────────────────────────────────────── */
.zn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 3.25rem;
  margin-top: 0.25rem;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fafafa;
  background: var(--obsidian);
  border: 0;
  border-radius: var(--r-control);
  cursor: pointer;
  text-decoration: none;
  transition: opacity 140ms var(--ease-out), transform 140ms var(--ease-out);
}
.zn-primary:hover:not(:disabled) { opacity: 0.88; }
.zn-primary:active:not(:disabled) { transform: scale(0.99); }
.zn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.zn-primary:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

.zn-quiet {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 3rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--stone);
  background: transparent;
  border: 1px solid rgba(23, 23, 23, 0.10);
  border-radius: var(--r-control);
  cursor: pointer;
  text-decoration: none;
  transition: border-color 140ms var(--ease-out), color 140ms var(--ease-out);
}
.zn-quiet:hover:not(:disabled) { border-color: rgba(23, 23, 23, 0.24); color: var(--obsidian); }
.zn-quiet:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.zn-quiet:disabled { opacity: 0.55; cursor: not-allowed; }

.zn-checking { display: grid; place-items: center; min-height: 22.5rem; color: var(--violet); }
.zn-rows { display: grid; gap: 0.5rem; margin-top: 0.75rem; }
.zn-quiet-danger { color: #b91c1c; border-color: rgba(185, 28, 28, 0.22); }
.zn-quiet-danger:hover:not(:disabled) { color: #b91c1c; border-color: rgba(185, 28, 28, 0.45); }

.zn-spin { animation: zn-rot 900ms linear infinite; }
@keyframes zn-rot { to { transform: rotate(360deg) } }

/* ── state ───────────────────────────────────────────────────────────── */
.zn-note {
  border-radius: var(--r-card);
  padding: 0.8125rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.7;
  text-align: center;
}
.zn-note p { margin: 0; }
/* The documented triad, measured on the card fill: 5.02:1 and 6.47:1. The
   values these replace were rgba(34,197,94) and rgba(220,38,38) at 6-8%
   alpha with the same hue as the text on top of them. */
.zn-note[data-tone="success"] { background: rgba(21, 128, 61, 0.08); color: #15803d; }
.zn-note[data-tone="error"] { background: rgba(185, 28, 28, 0.07); color: #b91c1c; }

.zn-foot {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.8125rem;
  line-height: 1.8;
  color: var(--stone-2);
}
.zn-link {
  color: var(--violet-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.zn-link:hover { color: var(--violet); }

.zn-switch {
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--violet-ink);
  background: none;
  border: 0;
  padding: 0.25rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.zn-switch:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .zn-skeleton, .zn-spin { animation: none; }
  .zn-account, .zn-input, .zn-eye, .zn-primary, .zn-quiet { transition: none; }
}
`
