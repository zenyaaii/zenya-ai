/**
 * THE BEYNOUN DASHBOARD THEME — palette, faces, frame.
 *
 * Appended to the end of DASHBOARD_CSS, so it re-points every token the
 * stylesheet above reads instead of rewriting the stylesheet. The product
 * token layer in tokens.ts stays as it is for the wizards and the cookie
 * banner; only these two scopes take the Beynoun palette:
 *
 *   .zy-app   the dashboard shell (AppShell, and /demo/dashboard)
 *   .zy-dash  anything the dashboard portals out of the shell — the account
 *             menu, the bell, the search palette. Those land at the end of
 *             <body> and inherit nothing, so they carry the class themselves.
 *
 * LIGHT AND DARK. Paper and ink: a warm cream ground, near-white cards, a
 * brown-black ink and one paprika accent. Dark is the same palette turned
 * over. The choice is a class on <html> (dash-dk), written by useDashTheme,
 * so a portal outside the shell turns with it.
 *
 * THE FACE. Thmanyah is read with local() only and never served — its
 * licence does not allow shipping the files where a visitor can pull them
 * out. Without it the page falls back to Amiri and Markazi Text, which
 * dash-font.ts loads through next/font.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const DASH_THEME_CSS = `
@font-face { font-family: "Thm Display"; font-weight: 400; src: local("thmanyah serif display Regular"), local("thmanyahserifdisplay-Regular"); }
@font-face { font-family: "Thm Display"; font-weight: 500; src: local("thmanyah serif display Medium"), local("thmanyahserifdisplay-Medium"); }
@font-face { font-family: "Thm Display"; font-weight: 600 800; src: local("thmanyah serif display Bold"), local("thmanyahserifdisplay-Bold"); }
@font-face { font-family: "Thm Display"; font-weight: 900; src: local("thmanyah serif display Black"), local("thmanyahserifdisplay-Black"); }
@font-face { font-family: "Thm Text"; font-weight: 300; src: local("thmanyah serif text Light"), local("thmanyahseriftext-Light"); }
@font-face { font-family: "Thm Text"; font-weight: 400; src: local("thmanyah serif text Regular"), local("thmanyahseriftext-Regular"); }
@font-face { font-family: "Thm Text"; font-weight: 500; src: local("thmanyah serif text Medium"), local("thmanyahseriftext-Medium"); }
@font-face { font-family: "Thm Text"; font-weight: 600 800; src: local("thmanyah serif text Bold"), local("thmanyahseriftext-Bold"); }
@font-face { font-family: "Thm Text"; font-weight: 900; src: local("thmanyah serif text Black"), local("thmanyahseriftext-Black"); }

/* ---- the palette, light ---------------------------------------------
   Text greys measured on the card (#FFFDF9) and on the ground (#F4EFE6):
     --stone   #5F574D  6.99 / 6.20
     --stone-2 #6B6257  5.89 / 5.22
     --violet  #B23A17  5.89 / 5.22, and white on it 5.98
   The status triad is darkened the same way, every one over 4.5 on both.

   "html " in front on purpose: the cookie banner, mounted in the root layout,
   injects the product token block again AFTER this stylesheet, and at equal
   specificity the later one wins. One element more keeps this one on top. */
html .zy-app, html .zy-dash {
  --ground: #F4EFE6;
  --background: #F4EFE6;
  --ground-2: #EFE9DE;
  --surface: #FFFDF9;
  --card: #FFFDF9;
  --elevated: #FFFDF9;
  --surface-2: #F1EBE1;
  --field: #F1EBE1;
  --surface-3: #E6DED0;

  --obsidian: #16120D;
  --foreground: #16120D;
  --onyx: #16120D;
  --ink-2: #3B342C;
  --stone: #5F574D;
  --stone-2: #6B6257;
  --ghost: #766D62;
  --muted: #5F574D;
  --subtle: #6B6257;
  --ink-rgb: 22 18 13;

  --border: rgb(22 18 13 / 0.10);
  --border-muted: rgb(22 18 13 / 0.06);
  --border-strong: rgb(22 18 13 / 0.16);

  --violet: #B23A17;
  --primary: #B23A17;
  --primary-600: #9C3214;
  --primary-500: #B23A17;
  --primary-400: #E2532A;
  --acc: #E2532A;
  --acc-rgb: 178 58 23;
  --on-acc: #FFFFFF;
  --violet-fill: rgb(226 83 42 / 0.11);
  --violet-ring: rgb(226 83 42 / 0.20);

  --success: #1F6E44;
  --warning: #8A5A06;
  --error: #B02E25;
  --success-fill: rgb(47 143 91 / 0.10);
  --warning-fill: rgb(201 138 18 / 0.13);
  --error-fill: rgb(192 54 44 / 0.09);
  --success-ring: rgb(31 110 68 / 0.22);
  --warning-ring: rgb(138 90 6 / 0.22);
  --error-ring: rgb(176 46 37 / 0.22);
  --blue: #2B6CA8;
  --blue-fill: rgb(43 108 168 / 0.12);

  --ring-1: 0 0 0 1px rgb(22 18 13 / 0.08);
  --ring-2: 0 18px 40px -30px rgb(22 18 13 / 0.30);
  --shadow-card-soft: var(--ring-1), var(--ring-2);
  --shadow-card: var(--ring-1), var(--ring-2);
  --shadow-sm: 0 0 0 1px rgb(22 18 13 / 0.07);
  --shadow-md: var(--ring-1), var(--ring-2);
  --shadow-lg: 0 0 0 1px rgb(22 18 13 / 0.10), 0 24px 48px -28px rgb(22 18 13 / 0.35);
  --shadow-xl: 0 0 0 1px rgb(22 18 13 / 0.12), 0 28px 60px -24px rgb(22 18 13 / 0.40);
  --shadow-pop: 0 0 0 1px rgb(22 18 13 / 0.08), 0 24px 60px -20px rgb(22 18 13 / 0.35);
  --shadow-glow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring);

  --r-panel: 24px;
  --r-card: 20px;
  --r-control: 12px;

  --dock-bg: rgb(22 18 13 / 0.93);
  --dock-ink: #F4EFE6;

  --font-head: "Thm Display", var(--font-amiri), "Amiri", serif;
  --font-chrome: "Thm Text", var(--font-markazi), "Markazi Text", Tajawal, serif;

  --side: 280px;
  --top: 64px;
  --dock: 64px;
  --gut: 16px;

  color-scheme: light;
}

/* ---- the palette, dark ----------------------------------------------- */
html.dash-dk .zy-app, html.dash-dk .zy-dash {
  --ground: #0F0D0A;
  --background: #0F0D0A;
  --ground-2: #13110E;
  --surface: #1A1713;
  --card: #1A1713;
  --elevated: #1F1B16;
  --surface-2: #24201A;
  --field: #24201A;
  --surface-3: #2E2922;

  --obsidian: #F4EFE6;
  --foreground: #F4EFE6;
  --onyx: #F4EFE6;
  --ink-2: #DAD1C4;
  --stone: #B3AA9D;
  --stone-2: #A39A8D;
  --ghost: #8F877B;
  --muted: #B3AA9D;
  --subtle: #A39A8D;
  --ink-rgb: 244 239 230;

  --border: rgb(244 239 230 / 0.10);
  --border-muted: rgb(244 239 230 / 0.06);
  --border-strong: rgb(244 239 230 / 0.18);

  --violet: #F07A52;
  --primary: #F07A52;
  --primary-600: #F48C68;
  --primary-500: #F07A52;
  --primary-400: #F49A7A;
  --acc: #F07A52;
  --acc-rgb: 240 122 82;
  --on-acc: #16120D;
  --violet-fill: rgb(240 122 82 / 0.16);
  --violet-ring: rgb(240 122 82 / 0.26);

  --success: #4CB37A;
  --warning: #E0A43A;
  --error: #E36A5F;
  --success-fill: rgb(76 179 122 / 0.14);
  --warning-fill: rgb(224 164 58 / 0.14);
  --error-fill: rgb(227 106 95 / 0.14);
  --success-ring: rgb(76 179 122 / 0.30);
  --warning-ring: rgb(224 164 58 / 0.30);
  --error-ring: rgb(227 106 95 / 0.30);
  --blue: #6FA8DD;
  --blue-fill: rgb(111 168 221 / 0.15);

  --ring-1: 0 0 0 1px rgb(244 239 230 / 0.08);
  --ring-2: 0 18px 40px -28px rgb(0 0 0 / 0.80);
  --shadow-sm: 0 0 0 1px rgb(244 239 230 / 0.08);
  --shadow-lg: 0 0 0 1px rgb(244 239 230 / 0.12), 0 24px 48px -24px rgb(0 0 0 / 0.75);
  --shadow-xl: 0 0 0 1px rgb(244 239 230 / 0.14), 0 28px 60px -24px rgb(0 0 0 / 0.80);
  --shadow-pop: 0 0 0 1px rgb(244 239 230 / 0.12), 0 24px 60px -20px rgb(0 0 0 / 0.75);

  --dock-bg: rgb(36 32 26 / 0.94);

  color-scheme: dark;
}
@media (min-width: 700px) { .zy-app { --gut: 24px; } }
@media (min-width: 1280px) { .zy-app { --gut: 40px; } }

/* The page behind the shell: overscroll and the moment before paint. */
html.dash-on, html.dash-on body { background: #F4EFE6; }
html.dash-on.dash-dk, html.dash-on.dash-dk body { background: #0F0D0A; color-scheme: dark; }

/* ---- the faces --------------------------------------------------------- */
.zy-app, .zy-dash {
  font-family: var(--font-chrome);
  -webkit-font-smoothing: antialiased;
}
.zy-app h1, .zy-app h2, .zy-dash h2,
.zy-app .zy-h1, .zy-app .zy-h2, .zy-app .zy-num, .zy-app .zy-stat-v {
  font-family: var(--font-head);
}
/* Figures line up in columns, so a number that ticks does not shift. */
.zy-app .zy-num, .zy-app .zy-stat-v { font-variant-numeric: tabular-nums lining-nums; }

/* ---- hardcoded colours in the screens ---------------------------------
   The screens still carry a few dozen literal Tailwind colours from the
   light-only restyle: text-[#171717], bg-white and friends. Until each
   screen is rebuilt they are mapped onto the tokens here, so the cream and
   the dark palette both reach them. Attribute selectors, so the class
   names need no escaping and the rule (two parts) outranks the utility. */
:is(.zy-app, .zy-dash) [class~="text-[#171717]"] { color: var(--obsidian); }
:is(.zy-app, .zy-dash) :is([class~="text-[#56565a]"], [class~="text-[#3a3a40]"]) { color: var(--stone); }
:is(.zy-app, .zy-dash) :is([class~="text-[#66666e]"], [class~="text-[#8a8a92]"], [class~="text-[#8f8f8f]"]) { color: var(--stone-2); }
:is(.zy-app, .zy-dash) [class~="text-[#5e6ad2]"] { color: var(--violet); }
:is(.zy-app, .zy-dash) :is([class~="text-[#15803d]"], [class~="text-[#1f8a4c]"]) { color: var(--success); }
:is(.zy-app, .zy-dash) :is([class~="text-[#d6453d]"], [class~="text-[#c0362c]"], [class~="text-[#b91c1c]"]) { color: var(--error); }
:is(.zy-app, .zy-dash) [class~="text-[#b45309]"] { color: var(--warning); }
:is(.zy-app, .zy-dash) [class~="text-[#b9c0ff]"] { color: var(--acc); }
:is(.zy-app, .zy-dash) :is([class~="text-[rgba(17,17,17,0.18)]"], [class~="text-[rgba(17,17,17,0.17)]"]) { color: rgb(var(--ink-rgb) / 0.2); }
html.dash-dk :is(.zy-app, .zy-dash) [class~="text-[#1a0dab]"] { color: #8AB4F8; }

:is(.zy-app, .zy-dash) [class~="bg-white"] { background-color: var(--card); }
:is(.zy-app, .zy-dash) [class~="bg-white/85"] { background-color: color-mix(in srgb, var(--card) 85%, transparent); }
:is(.zy-app, .zy-dash) :is([class~="bg-[#f4f4f6]"], [class~="bg-[#fafaf7]"], [class~="bg-[#fafafa]"]) { background-color: var(--surface-2); }
:is(.zy-app, .zy-dash) [class~="bg-[rgba(28,28,28,0.04)]"] { background-color: rgb(var(--ink-rgb) / 0.04); }
:is(.zy-app, .zy-dash) :is([class~="bg-[rgba(28,28,28,0.06)]"], [class~="bg-[rgba(17,17,17,0.05)]"], [class~="bg-black/5"], [class~="bg-black/[0.05]"], [class~="bg-black/[0.04]"]) { background-color: rgb(var(--ink-rgb) / 0.06); }
:is(.zy-app, .zy-dash) [class~="bg-[rgba(28,28,28,0.18)]"] { background-color: rgb(var(--ink-rgb) / 0.18); }
:is(.zy-app, .zy-dash) :is([class~="bg-[rgba(94,106,210,0.10)]"], [class~="bg-[rgba(94,106,210,0.08)]"]) { background-color: var(--violet-fill); }
:is(.zy-app, .zy-dash) :is([class~="bg-[rgba(21,128,61,0.10)]"], [class~="bg-[#e8f5ec]"]) { background-color: var(--success-fill); }
:is(.zy-app, .zy-dash) [class~="bg-[rgba(217,119,6,0.10)]"] { background-color: var(--warning-fill); }
:is(.zy-app, .zy-dash) [class~="bg-[#fdecea]"] { background-color: var(--error-fill); }
:is(.zy-app, .zy-dash) [class~="bg-[#15803d]"] { background-color: var(--success); }
:is(.zy-app, .zy-dash) [class~="bg-[#d6453d]"] { background-color: var(--acc); }
:is(.zy-app, .zy-dash) [class~="bg-[#171717]"] { background-color: var(--obsidian); }
:is(.zy-app, .zy-dash) :is([class~="bg-[#171717]"], [class~="bg-[#15803d]"])[class~="text-white"] { color: var(--ground); }
:is(.zy-app, .zy-dash) [class~="border-[#15803d]"] { border-color: var(--success); }
:is(.zy-app, .zy-dash) [class~="border-[#d4d4d8]"] { border-color: var(--border-strong); }
:is(.zy-app, .zy-dash) :is([class~="border-[rgba(17,17,17,0.07)]"], [class~="border-black/5"]) { border-color: rgb(var(--ink-rgb) / 0.08); }
:is(.zy-app, .zy-dash) [class~="border-[rgba(17,17,17,0.14)]"] { border-color: rgb(var(--ink-rgb) / 0.14); }
:is(.zy-app, .zy-dash) [class~="border-[rgba(28,28,28,0.25)]"] { border-color: rgb(var(--ink-rgb) / 0.25); }
:is(.zy-app, .zy-dash) :is([class~="divide-[rgba(17,17,17,0.07)]"], [class~="divide-[rgba(17,17,17,0.06)]"]) > * + * { border-color: rgb(var(--ink-rgb) / 0.08); }
:is(.zy-app, .zy-dash) [class~="ring-[#171717]"] { --tw-ring-color: var(--obsidian); }
@media (hover: hover) {
  :is(.zy-app, .zy-dash) :is([class~="hover:bg-[#f4f4f6]"], [class~="hover:bg-black/5"], [class~="hover:bg-black/[0.04]"]):hover { background-color: rgb(var(--ink-rgb) / 0.06); }
}
:is(.zy-app, .zy-dash) [class~="focus-visible:bg-[#f4f4f6]"]:focus-visible { background-color: rgb(var(--ink-rgb) / 0.06); }

/* The chrome controls take the ink, not the accent: one filled ink pill
   is the primary action, the accent is kept for "you are here". */
.zy-app .zy-top-cta, .zy-dash .zy-top-cta {
  color: var(--ground); background: var(--obsidian);
  box-shadow: none;
}
@media (hover: hover) {
  .zy-app .zy-top-cta:hover { background: var(--ink-2); box-shadow: none; }
}
.zy-app .zy-top-acct { padding: 2px; background: transparent; box-shadow: none; }
.zy-app .zy-top-av { width: 36px; height: 36px; font-size: 16px; }
.zy-app .zy-top-acct[data-state="open"] { box-shadow: 0 0 0 2px var(--violet); }
.zy-dash .zy-menu-row { font-size: 15px; min-height: 40px; }
.zy-app .zy-icon-btn { width: 40px; height: 40px; border-radius: 999px; }
.zy-app .zy-icon-btn svg { width: 19px; height: 19px; }

/* ======================================================================
   THE FRAME
   Laptop (1024+): a dark panel floating on the inline-start edge, round
   cornered and inset from the window, the page beside it. It stays ink in
   both themes, the way the phone dock does. Phone and tablet: a sticky top bar and a floating dock at the
   bottom with the four most-used pages and "More", which opens a sheet
   holding the full list. The document scrolls in both, so pinch-zoom pans.
   Layers: header 30 · dock and rail 40 · popover 50 · scrim 60 · sheet 61 ·
   search 62.
   ====================================================================== */
.zf-shell { min-height: 100dvh; background: var(--ground); color: var(--obsidian); }
.zf-shell svg { flex: none; }

/* ---- the rail -------------------------------------------------------- */
.zf-side {
  --rail-bg: #16120D;
  --rail-fg: rgb(244 239 230 / 0.66);
  --rail-fg-hi: #F4EFE6;
  --rail-soft: rgb(244 239 230 / 0.08);
  --rail-on: #F4EFE6;
  --rail-on-fg: #16120D;
  position: fixed; z-index: 40;
  inset-block: 14px; inset-inline-start: 14px;
  width: calc(var(--side) - 28px);
  display: none; flex-direction: column;
  padding: 20px 12px 14px;
  border-radius: 28px;
  color: var(--rail-fg);
  background: var(--rail-bg);
  box-shadow: 0 24px 48px -24px rgb(22 18 13 / 0.55);
}
/* On the dark ground the panel lifts by a shade and a hairline. */
html.dash-dk .zf-side {
  --rail-bg: #221E19;
  box-shadow: 0 0 0 1px rgb(244 239 230 / 0.08), 0 24px 48px -24px rgb(0 0 0 / 0.8);
}
@media (min-width: 1024px) { .zf-side { display: flex; } }

.zf-logo { display: flex; align-items: center; height: 40px; padding-inline: 10px; color: var(--obsidian); }
.zf-side .zf-logo { color: var(--rail-fg-hi); }
.zf-logo svg { height: 22px; width: auto; }
.zf-scroll { flex: 1; min-height: 0; overflow-y: auto; margin: 8px -6px 0; padding: 0 6px; scrollbar-width: none; }
.zf-scroll::-webkit-scrollbar { display: none; }
.zf-label { padding: 18px 12px 6px; font-size: 13px; font-weight: 700; line-height: 1.4; color: var(--stone-2); }
.zf-side .zf-label { color: rgb(244 239 230 / 0.52); }
.zf-nav { display: flex; flex-direction: column; gap: 2px; }
.zf-row {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  width: 100%; min-height: 44px; padding: 0 12px;
  border-radius: 14px;
  font-size: 16px; font-weight: 600; line-height: 1.3;
  color: var(--ink-2);
  text-align: start;
  transition: color 200ms var(--ease-out), background-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}
.zf-row svg { width: 19px; height: 19px; color: var(--stone-2); transition: color 200ms var(--ease-out); }
@media (hover: hover) {
  .zf-row:hover { color: var(--obsidian); background: rgb(var(--ink-rgb) / 0.045); }
}
.zf-row[aria-current="page"] {
  color: var(--obsidian);
  background: var(--card);
  box-shadow: 0 0 0 1px rgb(var(--ink-rgb) / 0.08), 0 6px 16px -10px rgb(var(--ink-rgb) / 0.30);
}
html.dash-dk .zf-row[aria-current="page"] { box-shadow: 0 0 0 1px rgb(var(--ink-rgb) / 0.10); }
.zf-row[aria-current="page"] svg { color: var(--acc); }
/* The rail's rows: cream on ink, and "you are here" is a cream pill. */
.zf-side .zf-row { color: var(--rail-fg); }
.zf-side .zf-row svg { color: currentColor; }
.zf-side .zf-row[aria-current="page"] { color: var(--rail-on-fg); background: var(--rail-on); box-shadow: none; }
.zf-side .zf-row[aria-current="page"] svg { color: var(--acc); }
@media (hover: hover) {
  .zf-side .zf-row:not([aria-current="page"]):hover { color: var(--rail-fg-hi); background: var(--rail-soft); }
}
.zf-row:focus-visible, .zf-dock-b:focus-visible, .zf-search:focus-visible, .zf-back:focus-visible {
  outline: 2px solid var(--violet); outline-offset: 2px;
}
.zf-foot { display: flex; flex-direction: column; gap: 6px; padding-top: 12px; }
.zf-new {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 46px; border-radius: 999px;
  font-size: 16px; font-weight: 700;
  color: var(--ground); background: var(--obsidian);
  transition: background-color 200ms var(--ease-out), transform 300ms var(--ease-out);
}
.zf-new svg { width: 18px; height: 18px; }
@media (hover: hover) { .zf-new:hover { background: var(--ink-2); } }
.zf-new:active { transform: scale(0.98); }
.zf-new:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; }
.zf-back {
  display: inline-flex; align-items: center; min-height: 40px; padding-inline: 12px;
  border-radius: 10px;
  font-size: 14.5px; font-weight: 500; color: var(--stone-2);
}
@media (hover: hover) { .zf-back:hover { color: var(--obsidian); } }
.zf-side .zf-new { color: var(--rail-on-fg); background: var(--rail-on); }
.zf-side .zf-back { color: rgb(244 239 230 / 0.56); }
@media (hover: hover) {
  .zf-side .zf-new:hover { background: #fff; }
  .zf-side .zf-back:hover { color: var(--rail-fg-hi); }
}
/* The report bubble is ink, like the rail it sits on: flip it to cream. */
.zf-side [class~="bg-[#171717]"] { --obsidian: #F4EFE6; --ground: #16120D; }

/* ---- the page column --------------------------------------------------- */
.zf-main { min-width: 0; padding-bottom: calc(var(--dock) + 40px + env(safe-area-inset-bottom)); }
@media (min-width: 1024px) { .zf-main { margin-inline-start: var(--side); padding-bottom: 48px; } }

/* ---- the top bar ------------------------------------------------------- */
.zf-top {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; gap: 10px;
  height: var(--top);
  padding-inline: var(--gut);
  background: color-mix(in srgb, var(--ground) 86%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4);
  transition: box-shadow 250ms var(--ease-out);
}
.zf-top[data-scrolled] { box-shadow: 0 1px 0 rgb(var(--ink-rgb) / 0.08); }
.zf-top .zf-logo { padding-inline: 0; }
.zf-top .zf-logo svg { height: 20px; }
@media (min-width: 1024px) { .zf-top .zf-logo { display: none; } }
.zf-title {
  margin: 0; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: var(--font-head);
  font-size: 20px; font-weight: 700; line-height: 1.3;
  color: var(--obsidian);
}
@media (max-width: 1023px) { .zf-title { font-size: 18px; } }
@media (max-width: 420px) { .zf-title { display: none; } }
.zf-tools { margin-inline-start: auto; display: flex; align-items: center; gap: 6px; }
.zf-search {
  display: inline-flex; align-items: center; gap: 10px;
  height: 40px; padding-inline: 14px 8px;
  border-radius: 999px;
  font-size: 14.5px; font-weight: 500; color: var(--stone-2);
  background: var(--card);
  box-shadow: 0 0 0 1px rgb(var(--ink-rgb) / 0.08);
  transition: box-shadow 200ms var(--ease-out), color 200ms var(--ease-out);
}
.zf-search svg { width: 18px; height: 18px; }
.zf-search kbd {
  font: inherit; font-size: 12px; font-weight: 600; direction: ltr;
  padding: 2px 7px; border-radius: 8px;
  color: var(--stone-2); background: var(--surface-2);
}
@media (hover: hover) { .zf-search:hover { color: var(--obsidian); box-shadow: 0 0 0 1px rgb(var(--ink-rgb) / 0.16); } }
.zf-search .zf-search-t { min-width: 170px; text-align: start; }
@media (max-width: 1023px) {
  .zf-search { width: 40px; padding: 0; justify-content: center; background: transparent; box-shadow: none; }
  .zf-search .zf-search-t, .zf-search kbd { display: none; }
}
@media (max-width: 1023px) { .zf-tools .zy-top-cta .zf-cta-t { display: none; } .zf-tools .zy-top-cta { width: 40px; padding: 0; justify-content: center; } }
@media (max-width: 359px) { .zf-theme { display: none; } }

/* ---- the dock (phone and tablet) ----------------------------------------- */
.zf-dock {
  position: fixed; z-index: 40;
  left: 50%; bottom: calc(12px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(calc(100vw - 24px), 440px); height: var(--dock);
  display: grid; grid-template-columns: repeat(5, 1fr);
  padding: 5px; border-radius: 24px;
  background: var(--dock-bg);
  -webkit-backdrop-filter: blur(20px) saturate(1.6); backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.06), 0 18px 40px -16px rgb(0 0 0 / 0.55);
}
@media (min-width: 1024px) { .zf-dock { display: none; } }
.zf-dock-b {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  min-width: 0; border-radius: 19px;
  font-size: 12px; font-weight: 600; line-height: 1.1;
  color: rgb(244 239 230 / 0.66);
  transition: color 250ms var(--ease-out), background-color 300ms var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}
.zf-dock-b span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-inline: 2px; }
.zf-dock-b svg { width: 21px; height: 21px; }
.zf-dock-b[aria-current="page"] { color: #16120D; background: #F4EFE6; }
.zf-dock-b[aria-expanded="true"] { color: #F4EFE6; background: rgb(244 239 230 / 0.12); }

/* ---- the sheet (More) ---------------------------------------------------- */
.zf-scrim {
  position: fixed; inset: 0; z-index: 60;
  background: rgb(15 13 10 / 0.42);
  opacity: 0; transition: opacity 280ms var(--ease-out);
}
.zf-scrim[data-open] { opacity: 1; }
.zf-sheet {
  position: fixed; z-index: 61; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column;
  max-height: min(88dvh, 760px);
  background: var(--card);
  border-radius: 28px 28px 0 0;
  box-shadow: 0 -20px 50px -20px rgb(0 0 0 / 0.40);
  transform: translateY(104%);
  transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1);
}
.zf-sheet[data-open] { transform: none; }
.zf-sheet-grab { display: flex; justify-content: center; padding: 10px 0 4px; }
.zf-sheet-grab i { width: 40px; height: 5px; border-radius: 9px; background: var(--surface-3); }
.zf-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 16px 4px 20px; padding-inline: 20px 12px; }
.zf-sheet-head h2 { margin: 0; font-family: var(--font-head); font-size: 20px; font-weight: 700; color: var(--obsidian); }
.zf-sheet-body { overflow-y: auto; padding: 0 12px 8px; }
.zf-sheet-body .zf-label { padding-top: 12px; }
.zf-sheet-foot { display: flex; flex-direction: column; gap: 6px; padding: 10px 16px calc(14px + env(safe-area-inset-bottom)); box-shadow: 0 -1px 0 rgb(var(--ink-rgb) / 0.08); }
.zf-sheet .zf-row[aria-current="page"] { background: var(--surface-2); box-shadow: none; }
@media (min-width: 1024px) { .zf-sheet, .zf-scrim { display: none; } }

/* ---- the search palette -------------------------------------------------- */
.zf-pal-scrim { position: fixed; inset: 0; z-index: 62; background: rgb(15 13 10 / 0.36); }
.zf-pal {
  position: fixed; z-index: 62;
  left: 50%; top: max(12px, 12vh);
  width: min(600px, calc(100vw - 24px));
  overflow: hidden;
  border-radius: 24px;
  background: var(--card);
  box-shadow: var(--shadow-pop);
  transform: translateX(-50%);
  animation: zfPal 380ms cubic-bezier(0.32, 0.72, 0, 1) both;
}
@keyframes zfPal { from { opacity: 0; transform: translateX(-50%) scale(0.96); } }
.zf-pal-in { display: flex; align-items: center; gap: 12px; height: 60px; padding-inline: 18px; box-shadow: 0 1px 0 rgb(var(--ink-rgb) / 0.08); }
.zf-pal-in svg { width: 20px; height: 20px; color: var(--stone-2); }
.zf-pal-in input {
  flex: 1; min-width: 0; height: 100%;
  border: 0 !important; outline: 0; background: transparent !important; box-shadow: none !important;
  font: inherit; font-size: 18px; font-weight: 500; color: var(--obsidian);
}
.zf-pal-in input::placeholder { color: var(--ghost); }
.zf-pal ul { list-style: none; margin: 0; padding: 8px; max-height: min(56dvh, 420px); overflow-y: auto; }
.zf-pal-grp { padding: 10px 12px 4px; font-size: 13px; font-weight: 700; color: var(--stone-2); }
.zf-pal-i {
  display: flex; align-items: center; gap: 12px;
  width: 100%; min-height: 46px; padding: 0 12px;
  border-radius: 14px;
  font-size: 16px; font-weight: 600; color: var(--ink-2); text-align: start;
}
.zf-pal-i svg { width: 19px; height: 19px; color: var(--stone-2); }
.zf-pal-i[aria-selected="true"] { background: var(--surface-2); color: var(--obsidian); }
.zf-pal-i[aria-selected="true"] svg { color: var(--acc); }
.zf-pal-empty { padding: 22px 12px; text-align: center; font-size: 15px; color: var(--stone-2); }

/* ---- the theme switch -----------------------------------------------------
   A curtain: the new colours come down from the top with a soft, feathered
   edge (a linear mask grown by animating a registered percentage).
   Without view transitions the colours ease instead of jumping. */
@property --zf-p { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
html[data-zf-tt]::view-transition-new(root) {
  -webkit-mask: linear-gradient(to bottom, #000 calc(var(--zf-p) - 35%), transparent var(--zf-p));
  mask: linear-gradient(to bottom, #000 calc(var(--zf-p) - 35%), transparent var(--zf-p));
  animation: zfCurtain 900ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes zfCurtain { from { --zf-p: 0%; } to { --zf-p: 135%; } }
html.zf-ease, html.zf-ease * {
  transition: background-color 500ms ease, color 500ms ease, border-color 500ms ease, box-shadow 500ms ease, fill 500ms ease, stroke 500ms ease !important;
}

/* ── Intro (DashIntro). It sits over everything, sheet and search included. */
.zi-root { position: relative; z-index: 100; font-family: var(--font-chrome); color: var(--obsidian); }
.zi-scrim { position: fixed; inset: 0; z-index: 100; background: rgb(15 13 10 / 0.5); animation: ziFade 260ms ease both; }
.zi-catch { position: fixed; inset: 0; z-index: 101; }
.zi-hole {
  position: fixed; z-index: 100; border-radius: 14px; pointer-events: none;
  box-shadow: 0 0 0 2px var(--violet), 0 0 0 9999px rgb(15 13 10 / 0.5);
  transition: top 520ms cubic-bezier(0.4,0,0.2,1), left 520ms cubic-bezier(0.4,0,0.2,1), width 520ms cubic-bezier(0.4,0,0.2,1), height 520ms cubic-bezier(0.4,0,0.2,1);
}
.zi-modal {
  position: fixed; z-index: 102; inset-inline: 16px; top: 50%; transform: translateY(-50%);
  margin-inline: auto; max-width: 440px; padding: 28px 24px 22px; border-radius: 22px;
  background: var(--card); box-shadow: var(--shadow-pop); animation: ziRise 380ms cubic-bezier(0.2,0.8,0.2,1) both;
}
.zi-x { position: absolute; inset-inline-end: 12px; top: 12px; width: 40px; height: 40px; border-radius: 999px; }
.zi-pause { flex: none; width: 36px; height: 36px; border-radius: 999px; }
.zi-badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px;
  background: rgb(var(--acc-rgb) / 0.1); color: var(--violet); font-size: 14px; font-weight: 600;
}
.zi-title { margin-top: 14px; font-family: var(--font-head); font-size: 30px; line-height: 1.25; font-weight: 700; }
.zi-lead { margin-top: 8px; font-size: 18px; line-height: 1.75; color: var(--stone); }
.zi-pt-ico {
  flex: none; display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px;
  background: rgb(var(--ink-rgb) / 0.06); color: var(--obsidian);
}
.zi-actions { margin-top: 22px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.zi-btn {
  display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 22px; border-radius: 999px;
  background: var(--obsidian); color: var(--card); font-size: 17px; font-weight: 600;
}
.zi-btn-q {
  display: inline-flex; align-items: center; min-height: 46px; padding: 0 16px; border-radius: 999px;
  color: var(--obsidian); font-size: 17px; font-weight: 600;
}
.zi-btn-q:hover { background: rgb(var(--ink-rgb) / 0.06); }
.zi-btn:focus-visible, .zi-btn-q:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.zi-sm { min-height: 38px; padding-inline: 14px; font-size: 15.5px; }
.zi-dim-on { opacity: 0.7; font-weight: 500; }
.zi-tip {
  z-index: 103; padding: 16px 16px 12px; border-radius: 18px; background: var(--card); box-shadow: var(--shadow-pop);
  animation: ziRise 340ms cubic-bezier(0.2,0.8,0.2,1) both;
}
.zi-step-t { flex: 1; min-width: 0; font-family: var(--font-head); font-size: 20px; font-weight: 700; line-height: 1.35; }
.zi-count { flex: none; font-size: 13.5px; color: var(--stone); font-variant-numeric: tabular-nums; }
.zi-step-b { margin-top: 8px; font-size: 16.5px; line-height: 1.75; color: var(--stone); }
.zi-foot { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.zi-prog { flex: 1; height: 4px; border-radius: 4px; background: rgb(var(--ink-rgb) / 0.1); overflow: hidden; }
.zi-prog i { display: block; height: 100%; background: var(--violet); transform-origin: right; transition: transform 120ms linear; }
[dir="ltr"] .zi-prog i { transform-origin: left; }
.zi-dots { display: flex; gap: 5px; }
.zi-dots i { width: 6px; height: 6px; border-radius: 6px; background: rgb(var(--ink-rgb) / 0.16); transition: width 240ms ease, background 240ms ease; }
.zi-dots i[data-done] { background: rgb(var(--ink-rgb) / 0.4); }
.zi-dots i[data-on] { width: 18px; background: var(--violet); }
.zi-cur {
  position: fixed; left: 0; top: 0; z-index: 104; pointer-events: none;
  transition: transform 1000ms cubic-bezier(0.45,0,0.2,1);
}
.zi-cur svg { position: absolute; left: -4px; top: -2px; filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.25)); }
.zi-tap { position: absolute; left: -14px; top: -14px; width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--violet); opacity: 0; animation: ziTap 620ms ease-out; }
@keyframes ziFade { from { opacity: 0; } }
@keyframes ziRise { from { opacity: 0; transform: translateY(10px); } }
.zi-modal { animation-name: ziRiseC; }
@keyframes ziRiseC { from { opacity: 0; transform: translateY(calc(-50% + 12px)); } }
@keyframes ziTap { 0% { opacity: 0.9; transform: scale(0.4); } 100% { opacity: 0; transform: scale(1.6); } }

@media (prefers-reduced-motion: reduce) {
  .zf-sheet, .zf-scrim, .zf-row, .zf-dock-b { transition: none; }
  .zf-pal { animation: none; }
  .zi-hole, .zi-cur, .zi-prog i { transition: none; }
  .zi-modal, .zi-tip, .zi-scrim { animation: ziFade 200ms ease both; }
}
`
