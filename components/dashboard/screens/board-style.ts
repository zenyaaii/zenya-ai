/**
 * BOARD_CSS — the cards of the 2026-10 dashboard design ("v6"), as the home
 * and analytics screens draw them: the greeting, the traffic card with its
 * metric tabs, odometer and area chart, the day timeline, the site card, the
 * quick actions, the small widgets, the stat tiles and the bar lists.
 *
 * Everything is a `zb-` class under .zy-app, and every colour is a product
 * token (dash-theme.ts), so dark mode and the cream palette come for free.
 * Composed into DASHBOARD_CSS before the theme layer.
 *
 * Motion: springs are linear() curves sampled from a real spring, so a pill or
 * a tab overshoots a hair and settles. Under reduced motion the dashboard's
 * global rule stops every animation and transition, and the reveal ends in
 * place: nothing slides, nothing is hidden.
 */
export const BOARD_CSS = `
.zy-app {
  --zb-spring: linear(0, .02, .0721, .1458, .2326, .3257, .4199, .5113, .5971, .6756, .7457, .807, .8594, .9033, .9393, .968, .9904, 1.0073, 1.0194, 1.0275, 1.0325, 1.0349, 1.0353, 1.0343, 1.0322, 1.0295, 1.0263, 1.023, 1.0197, 1.0165, 1.0135, 1.0108, 1.0084, 1.0063, 1.0046, 1.0031, 1.0019, 1.0009, 1.0002, .9996, .9992, .999, .9988, .9988, .9988, .9988, .9989, 1);
  --zb-out: cubic-bezier(.22, 1, .36, 1);
  --zb-card-shadow: inset 0 1px 0 rgb(255 255 255 / .9), 0 0 0 1px var(--border-muted), 0 1px 2px rgb(22 18 13 / .05), 0 18px 40px -28px rgb(22 18 13 / .32);
}
html.dash-dk .zy-app {
  --zb-card-shadow: inset 0 1px 0 rgb(255 255 255 / .04), 0 0 0 1px rgb(244 239 230 / .08), 0 18px 40px -28px rgb(0 0 0 / .8);
}

/* ---- reveal: each card rises in after the one before it ---------------- */
.zy-app .zb-rv { animation: zbRise .85s var(--zb-out) both; animation-delay: calc(var(--i, 0) * 55ms); }
@keyframes zbRise { from { opacity: 0; transform: translateY(14px); } }

/* ---- the card ----------------------------------------------------------- */
.zy-app .zb-card {
  position: relative; min-width: 0;
  background: var(--card); border-radius: 24px; padding: 20px;
  box-shadow: var(--zb-card-shadow);
  transition: transform .7s var(--zb-spring), box-shadow .35s var(--zb-out);
}
@media (max-width: 699px) { .zy-app .zb-card { padding: 16px; border-radius: 22px; } }
@media (hover: hover) {
  .zy-app a.zb-card:hover, .zy-app .zb-card.zb-lift:hover {
    transform: translateY(-2px);
    box-shadow: var(--zb-card-shadow), 0 0 0 1px var(--border-strong);
  }
}
.zy-app .zb-card-h { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; margin-bottom: 14px; }
.zy-app .zb-h2 { font-family: var(--font-head); font-size: 19px; line-height: 1.4; font-weight: 700; color: var(--obsidian); min-width: 0; }
.zy-app .zb-link {
  display: inline-flex; align-items: center; gap: 6px; min-height: 32px; white-space: nowrap;
  font-size: 14.5px; font-weight: 700; color: var(--violet);
}
.zy-app .zb-link svg { width: 16px; height: 16px; }
.zy-app .zb-link:focus-visible, .zy-app .zb-chip:focus-visible, .zy-app .zb-q:focus-visible,
.zy-app a.zb-card:focus-visible, .zy-app .zb-btn:focus-visible, .zy-app .zb-mtab:focus-visible,
.zy-app .zb-seg button:focus-visible, .zy-app .zb-st:focus-visible {
  outline: 2px solid var(--violet); outline-offset: 2px;
}
.zy-app .zb-muted { color: var(--stone); }
.zy-app .zb-small { font-size: 14px; color: var(--stone); line-height: 1.6; }
.zy-app .zb-num { font-variant-numeric: tabular-nums lining-nums; }

/* ---- buttons, pills, tiles --------------------------------------------- */
.zy-app .zb-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex: none;
  height: 40px; padding: 0 16px; border-radius: 999px; white-space: nowrap;
  background: var(--surface-2); color: var(--obsidian); font-size: 15px; font-weight: 700;
  transition: transform .5s var(--zb-spring), background-color .25s;
}
.zy-app .zb-btn svg { width: 17px; height: 17px; }
.zy-app .zb-btn-ink { background: var(--obsidian); color: var(--card); }
.zy-app .zb-btn-acc { background: var(--violet); color: var(--on-acc); }
@media (hover: hover) {
  .zy-app .zb-btn:hover { background: var(--surface-3); }
  .zy-app .zb-btn-ink:hover { background: var(--ink-2); }
  .zy-app .zb-btn-acc:hover { background: var(--violet); filter: brightness(1.08); }
}
.zy-app .zb-btn:active, .zy-app .zb-q:active, .zy-app .zb-chip:active { transform: scale(.96); transition-duration: .12s; }
.zy-app .zb-pill {
  display: inline-flex; align-items: center; gap: 5px; flex: none; height: 26px; padding: 0 10px;
  border-radius: 999px; white-space: nowrap; font-size: 13px; font-weight: 700;
  background: var(--surface-2); color: var(--ink-2);
}
.zy-app .zb-pill svg { width: 13px; height: 13px; }
.zy-app .zb-pill[data-tone="ok"] { background: var(--success-fill); color: var(--success); }
.zy-app .zb-pill[data-tone="warn"] { background: var(--warning-fill); color: var(--warning); }
.zy-app .zb-pill[data-tone="acc"] { background: var(--violet-fill); color: var(--violet); }
.zy-app .zb-pill[data-tone="bad"] { background: var(--error-fill); color: var(--error); }
.zy-app .zb-pill[data-tone="solid-acc"] { background: var(--violet); color: var(--on-acc); }
.zy-app .zb-pill[data-tone="solid-ok"] { background: var(--success); color: var(--card); }
.zy-app .zb-tile {
  width: 40px; height: 40px; border-radius: 13px; flex: none;
  display: grid; place-items: center; background: var(--surface-2); color: var(--ink-2);
}
.zy-app .zb-tile svg { width: 19px; height: 19px; }
.zy-app .zb-tile[data-tone="ok"] { background: var(--success-fill); color: var(--success); }
.zy-app .zb-tile[data-tone="acc"] { background: var(--violet-fill); color: var(--violet); }
.zy-app .zb-tile[data-tone="warn"] { background: var(--warning-fill); color: var(--warning); }
.zy-app .zb-tile[data-tone="blue"] { background: var(--blue-fill); color: var(--blue); }

/* ---- the greeting ------------------------------------------------------- */
.zy-app .zb-hello { padding: 6px 0 24px; }
.zy-app .zb-date { font-size: 15px; color: var(--stone); font-weight: 500; }
.zy-app .zb-display {
  margin-top: 10px; font-family: var(--font-head); color: var(--obsidian);
  font-size: clamp(32px, 4.6vw, 48px); line-height: 1.2; font-weight: 700; letter-spacing: -.01em;
}
.zy-app .zb-say { margin-top: 12px; max-width: 54ch; font-size: clamp(17px, 1.7vw, 20px); line-height: 2; color: var(--ink-2); }
.zy-app .zb-chip {
  display: inline-flex; align-items: center; gap: 7px; vertical-align: baseline;
  height: 34px; padding-inline: 5px 12px; margin: 0 2px; border-radius: 999px; white-space: nowrap;
  background: var(--card); box-shadow: 0 0 0 1px var(--border); color: var(--obsidian);
  font-weight: 700; line-height: 1; transition: transform .5s var(--zb-spring), box-shadow .2s;
}
@media (hover: hover) { .zy-app .zb-chip:hover { box-shadow: 0 0 0 1px var(--border-strong); } }
.zy-app .zb-chip i {
  width: 26px; height: 26px; border-radius: 999px; display: grid; place-items: center;
  font-style: normal; font-size: 13.5px; font-weight: 800;
}
.zy-app .zb-chip i[data-tone="acc"] { background: var(--violet); color: var(--on-acc); }
.zy-app .zb-chip i[data-tone="ok"] { background: var(--success-fill); color: var(--success); }
.zy-app .zb-chip svg { width: 16px; height: 16px; }

/* One site of several: which one the home is about. */
.zy-app .zb-sites { display: flex; flex-wrap: wrap; gap: 8px; margin: -8px 0 20px; }
.zy-app .zb-sites button {
  height: 36px; padding: 0 14px; border-radius: 999px; font-size: 14.5px; font-weight: 700;
  background: var(--surface-2); color: var(--stone); transition: background-color .2s, color .2s;
}
.zy-app .zb-sites button[aria-pressed="true"] { background: var(--obsidian); color: var(--card); }

/* ---- the home grid ------------------------------------------------------ */
.zy-app .zb-grid { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
.zy-app .zb-grid > * { min-width: 0; }
.zy-app .zb-widgets { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 700px) {
  .zy-app .zb-widgets { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
}
@media (min-width: 700px) and (max-width: 1023px) {
  .zy-app .zb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .zy-app .zb-g-stats, .zy-app .zb-g-day, .zy-app .zb-g-wide { grid-column: 1 / -1; }
}
@media (min-width: 1024px) {
  .zy-app .zb-grid { grid-template-columns: repeat(12, minmax(0, 1fr)); }
  .zy-app .zb-g-stats { grid-column: span 8; }
  .zy-app .zb-g-day { grid-column: span 4; grid-row: span 2; }
  .zy-app .zb-g-site, .zy-app .zb-g-quick { grid-column: span 4; }
  .zy-app .zb-g-wide { grid-column: 1 / -1; }
}
/* On a phone, what needs doing today comes first. */
@media (max-width: 699px) { .zy-app .zb-g-day[data-first] { order: -1; } }

/* ---- metric tabs and the range control --------------------------------- */
.zy-app .zb-statbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.zy-app .zb-mtabs {
  position: relative; isolation: isolate; flex: 1 1 340px;
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px;
}
.zy-app .zb-mp {
  position: absolute; z-index: -1; top: 0; left: 0; border-radius: 16px; background: var(--obsidian);
  transition: transform .72s var(--zb-spring), width .72s var(--zb-spring), height .3s;
}
.zy-app .zb-mtab { min-width: 0; text-align: start; padding: 10px 12px; border-radius: 16px; color: var(--obsidian); transition: color .35s; }
.zy-app .zb-mtab small { display: block; font-size: 13.5px; font-weight: 700; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.zy-app .zb-mtab b { display: block; font-family: var(--font-head); font-size: 22px; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums lining-nums; }
.zy-app .zb-mtab em { display: block; width: max-content; font-style: normal; font-size: 13px; font-weight: 700; color: var(--success); direction: ltr; }
.zy-app .zb-mtab em[data-dn] { color: var(--error); }
.zy-app .zb-mtab[aria-pressed="true"] { color: var(--card); }
.zy-app .zb-mtab[aria-pressed="true"] em { color: #8FD3A9; }
.zy-app .zb-mtab[aria-pressed="true"] em[data-dn] { color: #F4A28C; }
html.dash-dk .zy-app .zb-mtab[aria-pressed="true"] em { color: #1F6E44; }
html.dash-dk .zy-app .zb-mtab[aria-pressed="true"] em[data-dn] { color: #B02E25; }

.zy-app .zb-seg {
  position: relative; isolation: isolate; display: inline-flex; max-width: 100%; flex: none;
  padding: 4px; border-radius: 999px; background: var(--surface-2); overflow-x: auto; scrollbar-width: none;
}
.zy-app .zb-seg::-webkit-scrollbar { display: none; }
.zy-app .zb-seg-ind {
  position: absolute; z-index: -1; top: 0; left: 0; border-radius: 999px; background: var(--card);
  box-shadow: 0 1px 3px rgb(22 18 13 / .14), 0 0 0 .5px var(--border);
  transition: transform .7s var(--zb-spring), width .7s var(--zb-spring), height .4s;
}
html.dash-dk .zy-app .zb-seg-ind { background: var(--surface-3); }
.zy-app .zb-seg button {
  position: relative; flex: none; height: 36px; padding: 0 14px; border-radius: 999px;
  font-size: 14.5px; font-weight: 600; color: var(--stone); white-space: nowrap; transition: color .25s;
}
.zy-app .zb-seg button[aria-pressed="true"] { color: var(--obsidian); }

/* ---- the big number, the chart ----------------------------------------- */
.zy-app .zb-bigline { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px 16px; margin-top: 18px; }
.zy-app .zb-lab { margin-top: 6px; font-size: 15px; color: var(--stone); }
.zy-app .zb-scrub { min-height: 24px; font-size: 15px; color: var(--stone); }
.zy-app .zb-scrub b { color: var(--obsidian); }
.zy-app .zb-odo {
  display: inline-flex; direction: ltr; height: 1em; overflow: hidden; color: var(--obsidian);
  font-family: var(--font-head); font-variant-numeric: tabular-nums lining-nums;
  font-size: clamp(46px, 6vw, 66px); font-weight: 700; line-height: 1; letter-spacing: -.02em;
}
.zy-app .zb-odo > span { display: inline-block; height: 1em; overflow: hidden; }
.zy-app .zb-odo > span > i { display: block; font-style: normal; transition: transform 1.1s var(--zb-out); }
.zy-app .zb-odo > span > i > b { display: block; height: 1em; text-align: center; font-weight: 700; }
.zy-app .zb-odo > .zb-sep { width: .28em; text-align: center; }

.zy-app .zb-chart { position: relative; height: 220px; margin-top: 8px; touch-action: pan-y; cursor: crosshair; }
.zy-app .zb-chart[data-pick] { cursor: pointer; }
.zy-app .zb-chart, .zy-app .zb-chart *, .zy-app .zb-mtabs, .zy-app .zb-seg, .zy-app .zb-bigline,
.zy-app .zb-legend, .zy-app .zb-axis, .zy-app .zb-bars, .zy-app .zb-spark {
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;
}
.zy-app .zb-chart svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.zy-app .zb-chart .zb-ln {
  fill: none; stroke: var(--acc); stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: var(--len, 0); stroke-dashoffset: var(--len, 0); transition: stroke-dashoffset 1.4s var(--zb-out);
}
.zy-app .zb-chart[data-drawn] .zb-ln { stroke-dashoffset: 0; }
.zy-app .zb-chart .zb-ar { fill: var(--acc); fill-opacity: .09; opacity: 0; transition: opacity .9s .35s; }
.zy-app .zb-chart[data-drawn] .zb-ar { opacity: 1; }
.zy-app .zb-chart .zb-pv { fill: none; stroke: var(--stone); stroke-opacity: .55; stroke-width: 1.5; stroke-dasharray: 3 5; vector-effect: non-scaling-stroke; }
.zy-app .zb-chart .zb-gl { stroke: var(--border-muted); stroke-width: 1; vector-effect: non-scaling-stroke; }
.zy-app .zb-cur { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--obsidian); opacity: 0; transition: opacity .15s; pointer-events: none; }
.zy-app .zb-cur::after {
  content: ""; position: absolute; left: -6px; top: calc(var(--y, 50%) - 6px);
  width: 12px; height: 12px; border-radius: 9px; background: var(--acc); box-shadow: 0 0 0 3px var(--card);
}
.zy-app .zb-chart[data-touch] .zb-cur { opacity: 1; }
.zy-app .zb-axis { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: var(--stone); }
.zy-app .zb-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 13.5px; color: var(--stone); }
.zy-app .zb-legend i { display: inline-block; width: 16px; height: 2px; margin-inline-end: 6px; vertical-align: middle; border-radius: 2px; background: var(--acc); }
.zy-app .zb-legend i[data-prev] { background: none; border-top: 2px dashed var(--stone); opacity: .6; }

/* The day stepper: older day on the right, newer on the left, like the chart. */
.zy-app .zb-daynav { display: flex; align-items: center; gap: 8px; min-width: 0; margin-top: 16px; }
.zy-app .zb-st {
  width: 40px; height: 40px; border-radius: 14px; flex: none; display: grid; place-items: center;
  background: var(--surface-2); color: var(--obsidian); transition: background-color .2s;
}
.zy-app .zb-st svg { width: 18px; height: 18px; }
@media (hover: hover) { .zy-app .zb-st:not(:disabled):hover { background: var(--surface-3); } }
.zy-app .zb-st:disabled { opacity: .35; }
.zy-app .zb-dn-t { min-width: 0; padding: 0 4px; font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--obsidian); }
.zy-app .zb-dn-today { margin-inline-start: auto; }

/* ---- today: the bookings timeline -------------------------------------- */
.zy-app .zb-g-day { display: flex; flex-direction: column; }
.zy-app .zb-day { display: flex; flex-direction: column; gap: 10px; }
.zy-app .zb-slot { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; align-items: stretch; width: 100%; text-align: start; }
.zy-app .zb-slot .zb-t { padding-top: 12px; font-size: 14.5px; font-weight: 700; color: var(--stone); }
.zy-app .zb-slot .zb-b {
  min-width: 0; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 16px;
  background: var(--surface-2); border-inline-start: 3px solid var(--surface-3);
  transition: transform .5s var(--zb-spring), background-color .3s;
}
@media (hover: hover) { .zy-app a.zb-slot:hover .zb-b { transform: translateX(-2px); } }
.zy-app .zb-slot .zb-b b { font-size: 15.5px; font-weight: 700; color: var(--obsidian); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zy-app .zb-slot .zb-b > span:not(.zb-pill) { font-size: 14px; color: var(--stone); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zy-app .zb-slot .zb-pill { align-self: flex-start; height: 22px; margin-top: 4px; font-size: 12.5px; }
.zy-app .zb-b[data-st="new"] { background: var(--violet-fill); border-color: var(--acc); }
.zy-app .zb-b[data-st="confirmed"] { background: var(--success-fill); border-color: var(--success); }
.zy-app .zb-now { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--violet); }
.zy-app .zb-now::after { content: ""; flex: 1; height: 2px; border-radius: 2px; background: var(--acc); }
.zy-app .zb-day-sub { display: flex; align-items: center; gap: 10px; margin: 6px 0 -2px; font-size: 13.5px; font-weight: 700; color: var(--stone); }
.zy-app .zb-day-sub::after { content: ""; flex: 1; height: 1px; background: var(--border-muted); }
.zy-app .zb-day-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 14px; font-size: 14.5px; color: var(--stone); }
.zy-app .zb-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 24px 8px; text-align: center; color: var(--stone); font-size: 15px; }
.zy-app .zb-empty .zb-tile { width: 52px; height: 52px; border-radius: 16px; }

/* ---- the site card ------------------------------------------------------ */
.zy-app .zb-sitecard { display: grid; grid-template-columns: minmax(0, 1fr) 112px; gap: 16px; align-items: start; }
.zy-app .zb-sitecard .zb-meta { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.zy-app .zb-sitecard h3 { font-family: var(--font-head); font-size: 21px; font-weight: 700; line-height: 1.35; color: var(--obsidian); overflow-wrap: anywhere; }
.zy-app .zb-addr { font-size: 15px; color: var(--stone); direction: ltr; text-align: end; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zy-app .zb-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.zy-app .zb-live { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: var(--success); }
.zy-app .zb-live::before { content: ""; width: 8px; height: 8px; border-radius: 9px; background: var(--success); animation: zbBeat 2.4s infinite; }
@keyframes zbBeat { 0% { box-shadow: 0 0 0 0 var(--success-ring); } 70%, 100% { box-shadow: 0 0 0 7px transparent; } }
.zy-app .zb-ph {
  position: relative; width: 112px; aspect-ratio: 9 / 19; border-radius: 20px; overflow: hidden; background: #0B0A08;
  box-shadow: 0 0 0 4px #16120D, 0 0 0 5px var(--border-strong), 0 18px 30px -18px rgb(0 0 0 / .6);
}
.zy-app .zb-ph img { width: 100%; height: 100%; object-fit: cover; }
.zy-app .zb-ph[data-blank] {
  display: flex; flex-direction: column; gap: 7px; padding: 16px 10px; background: var(--card);
  box-shadow: 0 0 0 4px var(--surface-3), 0 0 0 5px var(--border-strong);
}
.zy-app .zb-ph[data-blank] i { display: block; height: 7px; border-radius: 4px; background: var(--surface-3); }
.zy-app .zb-ph[data-blank] i:nth-child(1) { width: 50%; margin-bottom: 4px; }
.zy-app .zb-ph[data-blank] i:nth-child(2) { height: 56px; border-radius: 9px; }
.zy-app .zb-ph[data-blank] i:nth-child(4) { width: 70%; }
.zy-app .zb-ph[data-blank] i:nth-child(5) { width: 42%; height: 18px; margin-top: 4px; border-radius: 999px; background: color-mix(in oklab, var(--acc) 30%, var(--surface-3)); }

/* ---- quick actions ------------------------------------------------------ */
.zy-app .zb-qgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.zy-app .zb-q {
  min-width: 0; min-height: 96px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
  padding: 14px; border-radius: 18px; background: var(--surface-2); text-align: start;
  transition: transform .55s var(--zb-spring), background-color .2s;
}
@media (hover: hover) { .zy-app .zb-q:hover { background: var(--surface-3); } }
.zy-app .zb-q .zb-tile { width: 36px; height: 36px; border-radius: 11px; background: var(--card); }
.zy-app .zb-q b { font-size: 15px; font-weight: 700; line-height: 1.4; color: var(--obsidian); }

/* ---- the small widgets -------------------------------------------------- */
.zy-app .zb-w { display: flex; flex-direction: column; gap: 10px; min-height: 168px; color: inherit; }
.zy-app .zb-w-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.zy-app .zb-w p { font-size: 15px; line-height: 1.6; color: var(--stone); }
.zy-app .zb-w-v { margin-top: auto; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px; }
.zy-app .zb-big { font-family: var(--font-head); font-size: clamp(28px, 3vw, 34px); font-weight: 700; line-height: 1.1; color: var(--obsidian); font-variant-numeric: tabular-nums lining-nums; }
.zy-app .zb-host { font-size: 18px; font-weight: 800; color: var(--obsidian); direction: ltr; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.zy-app .zb-stars { display: inline-flex; gap: 2px; direction: ltr; flex: none; }
.zy-app .zb-stars svg { width: 18px; height: 18px; fill: var(--surface-3); stroke: none; }
.zy-app .zb-stars svg[data-f] { fill: #D9902A; }

/* ---- the launch plan (no site published yet) ---------------------------- */
.zy-app .zb-ring { position: relative; width: 56px; height: 56px; flex: none; }
.zy-app .zb-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.zy-app .zb-ring circle { fill: none; stroke-width: 6; }
.zy-app .zb-ring .zb-bg { stroke: var(--surface-2); }
.zy-app .zb-ring .zb-fg { stroke: var(--success); stroke-linecap: round; stroke-dasharray: 138.2; transition: stroke-dashoffset 1.3s var(--zb-out); }
.zy-app .zb-ring b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 14.5px; font-weight: 800; color: var(--obsidian); }
.zy-app .zb-steps { display: flex; flex-direction: column; gap: 10px; }
.zy-app .zb-steps > div { display: flex; align-items: center; gap: 10px; font-size: 15.5px; font-weight: 600; color: var(--stone); }
.zy-app .zb-steps i {
  width: 26px; height: 26px; border-radius: 999px; flex: none; display: grid; place-items: center;
  font-style: normal; font-size: 13px; font-weight: 800; background: var(--surface-2); color: var(--stone);
}
.zy-app .zb-steps i svg { width: 14px; height: 14px; }
.zy-app .zb-steps [data-done] { color: var(--obsidian); }
.zy-app .zb-steps [data-done] i { background: var(--success); color: var(--card); }
.zy-app .zb-steps [data-on] { color: var(--obsidian); font-weight: 700; }
.zy-app .zb-steps [data-on] i { background: var(--obsidian); color: var(--card); }
/* «ابدأ من هنا»: the first three steps, side by side on a laptop, stacked on a phone. */
.zy-app .zb-start { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .zy-app .zb-start { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.zy-app .zb-start li { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 12px 14px; border-radius: 16px; background: var(--surface-2); }
.zy-app .zb-start i {
  width: 26px; height: 26px; border-radius: 999px; flex: none; display: grid; place-items: center;
  font-style: normal; font-size: 13px; font-weight: 800; background: var(--card); color: var(--stone);
}
.zy-app .zb-start i svg { width: 14px; height: 14px; }
.zy-app .zb-start [data-on] i { background: var(--obsidian); color: var(--card); }
.zy-app .zb-start [data-done] i { background: var(--success); color: var(--card); }
.zy-app .zb-start-t { flex: 1; min-width: 0; }
.zy-app .zb-start-t b { display: block; font-size: 15.5px; font-weight: 700; line-height: 1.4; color: var(--obsidian); }
.zy-app .zb-start-t span { display: block; font-size: 13.5px; line-height: 1.55; color: var(--stone); }
.zy-app .zb-start [data-done] .zb-start-t b { color: var(--stone); }
.zy-app .zb-start .zb-btn, .zy-app .zb-start .zb-pill { flex: none; }
/* The row is surface-2 already: the button sits on the card, and the next step's is ink. */
.zy-app .zb-start .zb-btn { background: var(--card); }
.zy-app .zb-start [data-on] .zb-btn { background: var(--obsidian); color: var(--card); }
.zy-app .zb-rows { display: flex; flex-direction: column; }
.zy-app .zb-rows > div { display: flex; align-items: center; gap: 14px; padding: 12px 0; }
.zy-app .zb-rows > div + div { border-top: 1px solid var(--border-muted); }
.zy-app .zb-rows b { display: block; font-size: 15.5px; color: var(--obsidian); }
.zy-app .zb-rows span:not(.zb-tile) { display: block; font-size: 14px; color: var(--stone); }

/* ---- stat tiles (analytics) -------------------------------------------- */
.zy-app .zb-tiles { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 900px) { .zy-app .zb-tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; } }
.zy-app .zb-stat {
  min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 20px; text-align: start;
  background: var(--card); color: var(--obsidian); box-shadow: var(--zb-card-shadow);
  transition: transform .6s var(--zb-spring), box-shadow .3s, background-color .35s, color .35s;
}
.zy-app .zb-stat:active { transform: scale(.97); transition-duration: .12s; }
.zy-app .zb-stat:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.zy-app .zb-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 24px; font-size: 14px; font-weight: 700; color: var(--stone); }
.zy-app .zb-stat-v { font-family: var(--font-head); font-size: clamp(26px, 2.6vw, 32px); font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums lining-nums; }
.zy-app .zb-stat-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; min-width: 0; }
.zy-app .zb-stat small { display: block; font-size: 13.5px; line-height: 1.5; color: var(--stone); }
.zy-app .zb-delta { font-size: 13.5px; font-weight: 700; color: var(--success); white-space: nowrap; direction: ltr; }
.zy-app .zb-delta[data-dn] { color: var(--error); }
.zy-app .zb-stat[aria-pressed="true"] { background: var(--obsidian); color: var(--card); }
.zy-app .zb-stat[aria-pressed="true"] .zb-stat-top, .zy-app .zb-stat[aria-pressed="true"] small { color: color-mix(in oklab, var(--card) 72%, transparent); }
.zy-app .zb-stat[aria-pressed="true"] .zb-delta { color: #8FD3A9; }
.zy-app .zb-stat[aria-pressed="true"] .zb-delta[data-dn] { color: #F4A28C; }
html.dash-dk .zy-app .zb-stat[aria-pressed="true"] .zb-delta { color: #1F6E44; }
html.dash-dk .zy-app .zb-stat[aria-pressed="true"] .zb-delta[data-dn] { color: #B02E25; }
/* The number keeps its line; the little line gives way to it on a narrow tile. */
.zy-app .zb-stat-v { white-space: nowrap; }
.zy-app .zb-spark { width: 64px; min-width: 0; height: 28px; flex: 0 1 64px; margin-bottom: 2px; }
.zy-app .zb-spark path { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; opacity: .6; }
@media (hover: hover) { .zy-app button.zb-stat:not([aria-pressed="true"]):hover { box-shadow: var(--zb-card-shadow), 0 0 0 1px var(--border-strong); } }

/* ---- bar lists ---------------------------------------------------------- */
.zy-app .zb-bars { display: flex; flex-direction: column; gap: 6px; }
.zy-app .zb-bars > div {
  position: relative; isolation: isolate; min-width: 0; height: 42px; padding: 0 12px; border-radius: 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 15px; color: var(--obsidian);
}
.zy-app .zb-bars > div::before {
  content: ""; position: absolute; z-index: -1; inset-block: 0; inset-inline-start: 0; width: var(--w); border-radius: 12px;
  background: var(--violet-fill); transform-origin: right; animation: zbGrow 1.1s var(--zb-out) both;
  animation-delay: calc(var(--k, 0) * 60ms);
}
[dir="ltr"] .zy-app .zb-bars > div::before { transform-origin: left; }
.zy-app .zb-bars[data-tone="blue"] > div::before { background: var(--blue-fill); }
@keyframes zbGrow { from { transform: scaleX(0); } }
.zy-app .zb-bars span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.zy-app .zb-bars b { flex: none; font-weight: 700; font-variant-numeric: tabular-nums lining-nums; }
/* Its own bidi island: two numbers side by side would otherwise merge into one run. */
.zy-app .zb-bars small { unicode-bidi: isolate; margin-inline-start: 8px; font-size: 13px; font-weight: 600; color: var(--stone); }

/* ---- figures inside a card (Google search) ------------------------------ */
.zy-app .zb-card .zb-sites { margin: 0; }
.zy-app .zb-sites button:disabled { cursor: default; }
.zy-app .zb-figs { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 900px) { .zy-app .zb-figs { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.zy-app .zb-figs > div { min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: 16px; background: var(--surface-2); }
.zy-app .zb-figs span { font-size: 14px; font-weight: 700; color: var(--stone); }
.zy-app .zb-figs b { font-family: var(--font-head); font-size: clamp(22px, 2.2vw, 28px); line-height: 1.15; font-weight: 700; color: var(--obsidian); }
.zy-app .zb-figs small { font-size: 13px; line-height: 1.5; color: var(--stone); }
`
