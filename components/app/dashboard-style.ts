/**
 * The dashboard's stylesheet — the house style applied to a dense product UI.
 *
 * WHY A MODULE AND NOT globals.css: the marketing site loads globals on every
 * page and pays for every byte in it. This block only concerns the logged-in
 * surface, so it is injected once by AppShell, exactly the way
 * app/demo/access/styles.ts is injected by its view. Keeping it whole and in
 * one file also means the restyle can be read end to end.
 *
 * WHY TOKENS AND NOT TEN RESTYLED PAGES: the dashboard already routes almost
 * every colour through CSS custom properties (--background, --card, --muted,
 * --border, --shadow-card-soft) and every card container through one .zy-card
 * class. Re-pointing those under a .zy-app scope moves all ten routes onto the
 * house style in one diff. Hand-editing 8,600 lines would have drifted.
 *
 * THE ONE-LINE READ: objects on bare paper. A floating rail and a floating
 * work surface on flat #fafafa, elevation as stacked hairlines rather than
 * drop shadows, and violet only where it carries meaning.
 *
 * SCOPE CAVEAT (CLAUDE.md): this is a dashboard, so only the design-taste
 * skill's UNIVERSAL principles apply — kill AI-slop, good typography and
 * spacing, restrained motion. No cinematic motion, no high-variance layout.
 * The UI is meant to stay dense and utilitarian.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const DASHBOARD_CSS = `
/* ======================================================================
   BLOCK A - the token layer and the chrome classes.

   WHY THIS IS NOT WRAPPED IN @layer components, WHICH IS WHERE IT STARTED:
   Tailwind v3 resolves its @layer directives AT BUILD TIME. The compiled
   stylesheet this app ships contains zero @layer at-rules - measured, the
   count is 0 - so preflight and every utility are UNLAYERED. In the cascade
   an unlayered declaration beats a layered one no matter how specific the
   layered one is, so a real @layer components block here loses to preflight
   before specificity is even consulted.

   That is not a theory. The first version of this file was layered, and the
   measurement showed exactly the predicted split: .zy-top-cta's
   background: var(--violet) applied (nothing in preflight sets background on
   an anchor) while its color: #fff did not (preflight's a{color:inherit}
   won), and .zy-top-title's font-size and font-weight lost to preflight's
   h1{font-size:inherit;font-weight:inherit}. Custom properties came through
   either way, because layers only arbitrate between declarations on the SAME
   element and a token inherited from a nearer ancestor wins on proximity.

   So this block is unlayered and wins on specificity instead. Every rule in
   it is scoped to a .zy-* class this restyle owns, so it is not in a
   position to override a page author's utility on anything else.
   ====================================================================== */

/* THE TOKEN BLOCK. Two selectors, because not everything on this surface is
   inside the shell: Radix renders the account menu through a PORTAL, which
   lands at the end of <body> and inherits nothing from .zy-app - so every
   var() in it would resolve to nothing. .zy-tokens is the same declarations
   with none of the shell's own layout, for exactly those escapees. */
.zy-app, .zy-tokens {
  /* ---- the house palette ------------------------------------------
     Measured against the candidate set rather than guessed. Every grey
     below is quoted with its real contrast ratio on the surface it is
     actually used on.
  ------------------------------------------------------------------ */
  --ground: #fafafa;
  --obsidian: #171717;
  --violet: #5e6ad2;
  --onyx: #131316;
  --field: #f4f4f6;

  /* Greys. The dashboard's old --muted (#5f5f5d) already passed at 6.40:1,
     so this is not a rescue - it is bringing the surface onto the same
     three greys the candidate pages use, so a muted label here and a muted
     label on /demo/access are the same colour.
       --stone   #56565a  7.31:1 on white   normal muted text
       --stone-2 #66666e  5.69:1 on white   quieter text, still readable
       --ghost   #6b6b73  4.81:1 on --field placeholders only
     The token that was genuinely broken is --subtle: rgba(28,28,28,0.35)
     renders about 2.9:1, which is not a readable colour for text at any
     size. It becomes --stone-2. */
  --stone: #56565a;
  --stone-2: #66666e;
  --ghost: #6b6b73;

  /* ---- re-pointed product tokens ----------------------------------
     These are the variables the ten dashboard routes already read. */
  --background: #fafafa;   /* was #f7f4ed, the old marketing cream */
  --surface:    #ffffff;
  --surface-2:  #f4f4f6;
  --elevated:   #ffffff;
  --card:       #ffffff;
  --foreground: #171717;   /* was #1c1c1c */
  --muted:      #56565a;
  --subtle:     #66666e;

  --border:        rgba(17,17,17,0.10);
  --border-muted:  rgba(17,17,17,0.06);
  --border-strong: rgba(17,17,17,0.16);

  /* ---- THE STATUS TRIAD -------------------------------------------
     The dashboard carried 31 distinct hex colours, of which roughly
     fourteen were status hues invented one at a time: three greens
     (#15803d #059669 #0d9488), eight ambers and browns (#b45309 #9b6f00
     #b8860b #c8a96a #95440a #8a3c1f #a05a3a #c2410c) and three reds
     (#b91c1c #dc2626 #be123c). A dashboard legitimately needs
     success / warning / danger, so these are not deleted - they are
     reduced to ONE documented triad and applied everywhere.

     Each was picked as the most-used member of its family that also
     passes AA as text on the white card:
       success #15803d  5.02:1   (46 uses, already the de-facto green)
       warning #b45309  5.02:1   (23 uses, already the de-facto amber)
       danger  #b91c1c  6.47:1   (15 uses; beats #dc2626's 4.83:1)

     THE RULE THAT KEEPS THEM FROM BECOMING CONFETTI: a status hue may
     colour the pill or icon that REPORTS a state, and nothing else. Never
     a card fill, never body text, never a heading. The page stays
     achromatic apart from the accent and whatever is currently red. */
  --success: #15803d;
  --warning: #b45309;
  --error:   #b91c1c;
  --success-fill: rgba(21,128,61,0.09);
  --warning-fill: rgba(180,83,9,0.09);
  --error-fill:   rgba(185,28,28,0.08);
  --success-ring: rgba(21,128,61,0.22);
  --warning-ring: rgba(180,83,9,0.22);
  --error-ring:   rgba(185,28,28,0.22);

  /* Accent stays exactly where it was. It was already the one right thing
     about this palette. */
  --primary:     #5e6ad2;
  --primary-600: #4f5ab8;
  --primary-500: #5e6ad2;
  --primary-400: #7170ff;
  --violet-fill: rgba(94,106,210,0.10);
  --violet-ring: rgba(94,106,210,0.15);

  /* ---- elevation ---------------------------------------------------
     THE RING TOKEN. Elevation on this house style is stacked hairlines,
     never a drop shadow. The second stop is a light halo: on the #fafafa
     ground it reads as a moat that separates the card from the paper
     without drawing a line around it.

     Every --shadow-* the dashboard reads is re-pointed, so a page that
     asked for shadow-soft-lg gets a heavier RING rather than a blur. */
  --ring-1: 0 0 0 1px rgba(0,0,0,0.08);
  --ring-2: 0 0 0 4px rgba(250,250,250,0.55);
  --shadow-card-soft: var(--ring-1), var(--ring-2);
  --shadow-card:      var(--ring-1), var(--ring-2);
  --shadow-sm:        0 0 0 1px rgba(0,0,0,0.07);
  --shadow-md:        var(--ring-1), var(--ring-2);
  --shadow-lg:        0 0 0 1px rgba(0,0,0,0.10), 0 0 0 5px rgba(250,250,250,0.60);
  --shadow-xl:        0 0 0 1px rgba(0,0,0,0.12), 0 0 0 6px rgba(250,250,250,0.65);
  --shadow-glow:      0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring);

  /* ---- radius scale ------------------------------------------------
     panel 28 / card 16 / control 10 / pill 999. Held by the mapping in
     BLOCK B below. */
  --r-panel: 28px;
  --r-card: 16px;
  --r-control: 10px;

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}

/* The shell's own ground. Only .zy-app - a portalled menu paints its own. */
.zy-app {
  background: var(--ground);
  color: var(--obsidian);
}

/* The root layout paints an animated indigo/amber wash on body::before for
   the marketing site, and it bleeds under the dashboard. The house ground is
   one flat colour with no ambient wash, so an opaque fixed layer is laid over
   it. Same z-index as body::before and later in tree order, so it paints on
   top - the trick app/demo/access uses for the same reason. */
.zy-app::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: var(--ground);
  pointer-events: none;
}

/* ---- the two panels ------------------------------------------------
   The shell stops being an edge-to-edge frame and becomes two objects on
   paper: a rail and a work surface, each on the ring token, with the
   ground showing between and around them.

   DESKTOP ONLY. Phones and tablets keep the shell exactly as it was, for
   the reason AppShell records: a root that is h-screen overflow-hidden
   cannot be panned after a pinch-zoom, so a zoomed-in reader cannot reach
   the content. That behaviour is deliberate and is not touched here.
-------------------------------------------------------------------- */
@media (min-width: 1024px) {
  .zy-pane {
    border-radius: var(--r-panel);
    background: #ffffff;
    box-shadow: var(--ring-1), var(--ring-2);
    /* The work surface scrolls inside itself, so it has to clip its own
       corners or the content squares them off again. */
    overflow: hidden;
  }
}

/* ---- the chrome face ------------------------------------------------
   Tajawal carries content; Plex carries furniture. --font-chrome is set on
   the shell by next/font (see AppShell). The fallback keeps the rail on
   Tajawal rather than on a system face if the variable is ever missing. */
.zy-rail-mark, .zy-rail-label, .zy-rail-row, .zy-rail-foot,
.zy-top, .zy-menu, .zy-pill {
  font-family: var(--font-chrome), Tajawal, system-ui, sans-serif;
}

/* ---- the rail ------------------------------------------------------ */
.zy-rail-mark { display: flex; align-items: center; height: 56px; padding-inline: 1.125rem; }
.zy-rail-group { padding-inline: 0.625rem; }
.zy-rail-label {
  padding: 0 0.625rem 0.5rem;
  font-size: 10.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--stone-2);
}
/* A nav row is a control, so it takes the control radius and the field's
   quiet hover. The CURRENT row is the one place the accent appears in the
   rail, because "you are here" is the single thing an accent on a chrome
   surface is genuinely for. */
.zy-rail-row {
  position: relative;
  display: flex; align-items: center; gap: 0.625rem;
  border-radius: var(--r-control);
  padding: 0.5rem 0.625rem;
  font-size: 13px; font-weight: 500; line-height: 1.5;
  letter-spacing: 0;
  color: var(--stone);
  transition: color 180ms var(--ease-out), background-color 180ms var(--ease-out);
}
.zy-rail-row:hover { color: var(--obsidian); background: rgba(17,17,17,0.045); }
.zy-rail-row[data-on] {
  color: var(--violet);
  font-weight: 700;
  background: var(--violet-fill);
}
/* The marker is a bar on the row's inline-start edge, drawn on the row's own
   radius. It says which row is current at a glance down the rail, which a
   tint alone does not - a tinted row and a hovered row look alike in
   peripheral vision. inset-inline-start so it follows dir; a physical left
   would sit on the wrong edge of an Arabic rail. */
.zy-rail-row[data-on]::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 18px;
  border-radius: 999px;
  background: var(--violet);
}
.zy-rail-foot {
  padding: 0.875rem 1.125rem;
  font-size: 11.5px; font-weight: 500; line-height: 1.7;
  color: var(--stone-2);
}
/* Same reason as .zy-link: this measured 15px. It is the only link in the
   rail and it sits at the very bottom edge, which is the hardest place on a
   phone to hit accurately. */
.zy-rail-foot a {
  display: inline-flex; align-items: center;
  min-height: 32px;
  color: inherit;
  transition: color 180ms var(--ease-out);
}
.zy-rail-foot a:hover { color: var(--violet); }

/* ---- the topbar ---------------------------------------------------- */
.zy-top {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; flex-shrink: 0;
  padding-inline: 1rem;
  background: #ffffff;
  /* A hairline, not the old warm #f0ede6 line. It separates the chrome from
     the work surface and does nothing else. */
  box-shadow: 0 1px 0 rgba(17,17,17,0.07);
}
.zy-top-title {
  margin: 0;
  font-size: 14.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  color: var(--obsidian);
}
/* A quiet square control: the hamburger, the bell, the eye.
   NO display HERE, DELIBERATELY. Block A is unlayered, so a display in a
   skin class outranks a Tailwind utility - and this class is worn by the
   hamburger (lg:hidden) and the bell (hidden sm:inline-flex). The first
   version set display:inline-flex and the measurement caught it at once:
   the hamburger rendered on desktop, where it is meant to be gone. A skin
   class sets skin; layout stays with the utilities.

   THE OTHER FIX FOR THIS DOES NOT WORK, AND IT SHIPPED FOR ONE SCREENSHOT.
   A general guard - .zy-app .hidden{display:none} - looks like it puts the
   utility back on top, and instead it outranks lg:flex and sm:block too,
   because those are one class each against its two. It hid the entire
   desktop rail (hidden ... lg:flex), the bell, the account name and the
   label inside the new-site button, all at once. There is no safety net
   here: the rule is simply that a .zy-* class does not set display. */
.zy-icon-btn {
  align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 0; background: transparent; cursor: pointer;
  border-radius: var(--r-control);
  color: var(--stone);
  transition: color 160ms var(--ease-out), background-color 160ms var(--ease-out);
}
.zy-icon-btn:hover { color: var(--obsidian); background: rgba(17,17,17,0.055); }
.zy-icon-btn:focus-visible { outline: 2px solid var(--violet); outline-offset: 1px; }

/* The account control. Obsidian-on-white at rest with a hairline, so the one
   filled violet object in the bar stays the primary action next to it. */
.zy-top-acct {
  display: flex; align-items: center; gap: 0.5rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: 999px;
  padding: 0.25rem 0.625rem 0.25rem 0.25rem;
  padding-inline: 0.25rem 0.625rem;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zy-top-acct:hover { background: #fcfcfd; box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.zy-top-acct[data-state="open"] { box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring); }
.zy-top-av {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 999px;
  background: var(--violet); color: #fff;
  font-size: 11.5px; font-weight: 700; line-height: 1;
}
.zy-top-name { font-size: 12.5px; font-weight: 500; line-height: 1.5; color: var(--obsidian); }

/* The one filled action in the chrome. */
.zy-top-cta {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border-radius: 999px;
  padding: 0.4375rem 0.875rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  color: #fff; background: var(--violet);
  box-shadow: 0 0 0 1px rgba(94,106,210,0.60), 0 0 0 4px rgba(94,106,210,0);
  transition: box-shadow 240ms var(--ease-out), background-color 200ms var(--ease-out);
}
/* It grows a halo rather than scaling. A control that changes size on hover
   nudges everything beside it, which on a chrome bar is the whole row. */
.zy-top-cta:hover { background: #5462cb; box-shadow: 0 0 0 1px rgba(94,106,210,0.70), 0 0 0 4px var(--violet-ring); }
.zy-top-cta:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; }

/* ---- the menu ------------------------------------------------------ */
.zy-menu {
  border-radius: var(--r-card);
  background: #ffffff;
  padding: 0.375rem;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.10), 0 0 0 4px rgba(250,250,250,0.60);
}
.zy-menu-head { padding: 0.5rem 0.625rem 0.625rem; border-bottom: 1px solid rgba(17,17,17,0.07); margin-bottom: 0.375rem; }
.zy-menu-row {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  border: 0; background: transparent; cursor: pointer; font: inherit;
  border-radius: var(--r-control);
  padding: 0.5rem 0.625rem;
  font-size: 13px; font-weight: 500; line-height: 1.5;
  color: var(--stone); text-decoration: none;
  outline: none;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.zy-menu-row[data-highlighted] { background: rgba(17,17,17,0.05); color: var(--obsidian); }
.zy-menu-row[data-tone="danger"] { color: var(--error); }
.zy-menu-row[data-tone="danger"][data-highlighted] { background: var(--error-fill); color: var(--error); }

/* ======================================================================
   THE PAGE PRIMITIVES. Written once here so the ten routes stop inventing
   a heading, a banner and a meter each. Everything below is a .zy-* class
   this restyle owns, so nothing here can collide with a page's utilities.
   ====================================================================== */

/* The page title. Weight 900 is the house display weight; the old
   text-[28px] font-bold tracking-tight was 700 with -0.025em tracking on
   Arabic, which pulls the joins apart. */
.zy-h1 {
  margin: 0;
  font-size: clamp(22px, 2.2vw, 26px); font-weight: 900; line-height: 1.4;
  letter-spacing: 0;
  color: var(--obsidian);
}
.zy-h2 {
  margin: 0;
  font-size: 15px; font-weight: 900; line-height: 1.5;
  letter-spacing: 0;
  color: var(--obsidian);
}
/* The heading inside a card, above a preview or a field group. */
.zy-h3 {
  margin: 0;
  font-size: 13px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  color: var(--obsidian);
}
/* The small uppercase label above a number. Positive tracking is right here
   and only here: these are set in Latin caps, which genuinely need it. */
.zy-eyebrow {
  font-size: 10.5px; font-weight: 700; line-height: 1.6;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--stone-2);
}
.zy-num {
  font-size: 25px; font-weight: 900; line-height: 1.3;
  letter-spacing: 0;
  color: var(--obsidian);
  font-variant-numeric: tabular-nums;
}
.zy-sub { font-size: 12px; font-weight: 500; line-height: 1.7; color: var(--stone); }

/* ---- the banner -----------------------------------------------------
   One shape for every "something needs your attention" row: hosting about
   to lapse, trial spent, entry welcome. Each of those invented its own
   border, fill, heading colour and body colour before this - eleven values
   across three components, of which the hosting banner alone used four
   different browns (#b45309 #8a3c1f #a05a3a #95440a).

   The tone colours the RULE and the icon. The heading and the body stay
   obsidian and stone, because a warning is not more readable for being
   printed in brown - it is less. */
.zy-banner {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem;
  border-radius: var(--r-card);
  padding: 0.875rem 1rem;
  background: #ffffff;
  box-shadow: var(--ring-1), var(--ring-2);
  /* The tone lives on an inline-start rule rather than a full tinted box:
     a page can carry two banners at once, and two tinted boxes shout. */
  border-inline-start: 3px solid var(--tone, var(--violet));
}
.zy-banner[data-tone="warn"] { --tone: var(--warning); }
.zy-banner[data-tone="bad"]  { --tone: var(--error); }
.zy-banner[data-tone="ok"]   { --tone: var(--success); }
.zy-banner-ico { flex-shrink: 0; color: var(--tone, var(--violet)); }
.zy-banner-b { min-width: 0; flex: 1; }
.zy-banner-t { margin: 0; font-size: 13.5px; font-weight: 700; line-height: 1.6; color: var(--obsidian); }
.zy-banner-p { margin: 0.1875rem 0 0; font-size: 12.5px; font-weight: 500; line-height: 1.7; color: var(--stone); }

/* ---- the actions ----------------------------------------------------
   The filled violet button is the PRIMARY action and there is one per
   region. It is the accent doing work, which is the only reason the accent
   is allowed on a product surface. */
.zy-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  flex-shrink: 0;
  border: 0; cursor: pointer; font: inherit;
  border-radius: 999px;
  padding: 0.5rem 0.9375rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  color: #ffffff; background: var(--violet);
  text-decoration: none;
  box-shadow: 0 0 0 1px rgba(94,106,210,0.60), 0 0 0 4px rgba(94,106,210,0);
  transition: box-shadow 240ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zy-btn:hover { background: #5462cb; box-shadow: 0 0 0 1px rgba(94,106,210,0.70), 0 0 0 4px var(--violet-ring); }
.zy-btn:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; }
/* The quiet sibling: same shape, no fill. For "open", "preview", "cancel". */
.zy-btn-q {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: var(--r-control);
  padding: 0.4375rem 0.75rem;
  font-size: 12px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  color: var(--obsidian); background: var(--field);
  text-decoration: none;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  transition: box-shadow 200ms var(--ease-out), color 200ms var(--ease-out);
}
.zy-btn-q:hover { color: var(--violet); box-shadow: 0 0 0 1px rgba(94,106,210,0.45); }
/* A text link that is an action rather than prose. */
.zy-link {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.6;
  letter-spacing: 0;
  color: var(--violet); text-decoration: none;
  text-underline-offset: 3px;
}
.zy-link:hover { text-decoration: underline; }
/* A LINK IS A TAP TARGET, NOT JUST TEXT. As bare inline text this measured
   17px tall, which is under half a fingertip. The padding is pulled back out
   of the layout with a negative margin so adding it does not move the thing
   the link sits beside - the row keeps its baseline, the finger gets its
   target. */
.zy-link {
  min-height: 24px;
  padding-block: 0.3125rem;
  margin-block: -0.3125rem;
}
@media (pointer: coarse) {
  .zy-link { min-height: 32px; padding-block: 0.5rem; margin-block: -0.5rem; }
}

/* ---- the meter ------------------------------------------------------
   Violet as PROGRESS, which is the accent doing work rather than
   decorating - the same job it has on /demo/access's password rule. It
   turns to the danger token only when the thing it measures has run out. */
.zy-meter { height: 5px; border-radius: 999px; background: rgba(17,17,17,0.07); overflow: hidden; }
.zy-meter-fill { height: 100%; border-radius: 999px; background: var(--violet); transition: width 480ms var(--ease-out); }
.zy-meter[data-spent] .zy-meter-fill { background: var(--error); }

/* ---- the icon tile --------------------------------------------------
   The 34px square beside a row's title. It reports state, so it is one of
   the two places a status hue is allowed (the other is the pill). */
.zy-tile {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  width: 34px; height: 34px;
  border-radius: var(--r-control);
  color: var(--tone, var(--violet));
  background: var(--tone-fill, var(--violet-fill));
}
.zy-tile[data-tone="ok"]   { --tone: var(--success); --tone-fill: var(--success-fill); }
.zy-tile[data-tone="warn"] { --tone: var(--warning); --tone-fill: var(--warning-fill); }
.zy-tile[data-tone="bad"]  { --tone: var(--error);   --tone-fill: var(--error-fill); }

/* ---- the empty state ------------------------------------------------
   Dashed, because dashed is what says "nothing here yet" rather than
   decoration. No radial wash behind it and no coloured drop shadow on the
   glyph: the house ground carries no ambient light, and elevation is
   hairlines. Both were on this card and both are gone. */
.zy-empty {
  border-radius: var(--r-card);
  padding: 2rem 1.5rem;
  text-align: center;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10), 0 0 0 4px rgba(250,250,250,0.55);
}
.zy-empty-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; margin-bottom: 0.875rem;
  border-radius: var(--r-control);
  color: var(--violet); background: var(--violet-fill);
  box-shadow: 0 0 0 1px rgba(94,106,210,0.20);
}

/* ---- the sparkline --------------------------------------------------
   The bars were flat #5e6ad2 at full strength, which made a 30-bar block
   the heaviest object on the home page - more weight than the number it
   is annotating. At 0.55 it is still unmistakably the accent and it reads
   as the number's shadow rather than as its own headline. The day with no
   views keeps a grey stub so the axis stays legible. */
.zy-spark-b { width: 100%; border-radius: 2px 2px 0 0; background: rgba(94,106,210,0.55); }
.zy-spark-b[data-zero] { background: rgba(17,17,17,0.07); }

/* ---- the segmented control ------------------------------------------
   The range picker, the metric picker, the tab bar. Everywhere the reader
   chooses one of a few options, it is THE SAME OBJECT.

   THE INDICATOR MOVES, IT IS NOT REDRAWN. That is the whole difference
   between a switch and a row of buttons that change colour: the eye
   follows one object across the row and understands that the options are
   alternatives. Redrawing a fill on the new button and clearing it on the
   old is two events the reader has to connect.

   THE TRANSFORM IS COMPUTED IN PHYSICAL PIXELS, NEVER A PERCENTAGE. A
   transform percentage is physical and does not follow dir, so
   translateX(100%) sends the indicator off the wrong edge in RTL. The
   component measures offsetLeft/offsetWidth - also physical - so the two
   agree in both directions.

   Width is transitioned as well as transform. It normally would not be
   (layout properties are not free), but this element is absolutely
   positioned, so its width cannot reflow anything beside it, and the
   labels here are Arabic words of genuinely different lengths - a
   fixed-width indicator would either overhang the short ones or clip
   the long ones. */
.zy-seg {
  position: relative;
  display: inline-flex; align-items: center;
  padding: 3px;
  border-radius: 999px;
  background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  font-family: var(--font-chrome), Tajawal, system-ui, sans-serif;
  /* The row scrolls rather than wrapping when the viewport cannot hold it.
     A wrapped segmented control reads as two controls, and the indicator
     would have to jump a line. */
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.zy-seg::-webkit-scrollbar { display: none; }
.zy-seg-ind {
  position: absolute;
  z-index: 0;
  inset-block: 3px;
  left: 0;
  border-radius: 999px;
  background: var(--violet);
  box-shadow: 0 0 0 3px rgba(94,106,210,0.14);
  transition: transform 400ms var(--ease-out), width 400ms var(--ease-out);
  will-change: transform, width;
}
/* Before the first measurement the indicator has no place to be, so it is
   not painted at all - a 0-width pill parked at the start edge would flash
   across the row on hydration. */
.zy-seg-ind[data-idle] { opacity: 0; transition: none; }
.zy-seg-b {
  position: relative; z-index: 1;
  flex: 0 0 auto;
  border: 0; background: transparent; cursor: pointer; font: inherit;
  border-radius: 999px;
  padding: 0.375rem 0.8125rem;
  font-size: 12px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  white-space: nowrap;
  color: var(--stone);
  transition: color 260ms var(--ease-out);
}
.zy-seg-b:hover { color: var(--obsidian); }
.zy-seg-b[data-on] { color: #ffffff; }
.zy-seg-b:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

/* ---- the underline tab bar ------------------------------------------
   Used where there are too many options for a pill row (the analytics
   dashboard has eight). Same mechanic: one indicator that MOVES. */
.zy-tabs {
  position: relative;
  display: flex; align-items: center; gap: 0.125rem;
  overflow-x: auto;
  scrollbar-width: none;
  font-family: var(--font-chrome), Tajawal, system-ui, sans-serif;
  box-shadow: inset 0 -1px 0 rgba(17,17,17,0.08);
}
.zy-tabs::-webkit-scrollbar { display: none; }
.zy-tab {
  flex: 0 0 auto;
  border: 0; background: transparent; cursor: pointer; font: inherit;
  padding: 0.5rem 0.75rem 0.625rem;
  font-size: 12.5px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  white-space: nowrap;
  color: var(--stone);
  transition: color 220ms var(--ease-out);
}
.zy-tab:hover { color: var(--obsidian); }
.zy-tab[data-on] { color: var(--violet); }
.zy-tab:focus-visible { outline: 2px solid var(--violet); outline-offset: -2px; border-radius: 6px; }
.zy-tab-ind {
  position: absolute;
  left: 0; bottom: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--violet);
  transition: transform 400ms var(--ease-out), width 400ms var(--ease-out);
  will-change: transform, width;
}
.zy-tab-ind[data-idle] { opacity: 0; transition: none; }

/* ---- the chart ------------------------------------------------------
   Marks follow the house data-viz specs: a 2px line, an ~8px marker with a
   2px surface ring so it stays legible where it crosses the line, an area
   wash rather than a saturated block, and hairline SOLID gridlines one step
   off the surface. Nothing here is dashed except the comparison series,
   where dashing is the convention for "the period before this one".

   AXIS TEXT WEARS TEXT TOKENS, NEVER THE SERIES COLOUR. The violet belongs
   to the marks; a violet tick label would make the chrome look like data.
------------------------------------------------------------------------- */
/* THE PLOT IS LTR AND THE CARD AROUND IT IS NOT. The dashboard is RTL and
   the SVG inherited it, which flips what text-anchor: end means - every axis
   label was anchored on the wrong side and hung outside the plot box.
   Measured on the real page at 1440 before the fix: two y ticks 9.4px past
   the right edge, one x tick 6.9px past it and another 12.3px past the left.
   The geometry here runs left to right on purpose (time does), so the
   drawing surface says so and the anchors mean what they say. */
.zy-chart { direction: ltr; outline: none; }
.zy-chart:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; border-radius: 8px; }
.zy-chart-tick {
  fill: var(--stone-2);
  font-family: var(--font-chrome), Tajawal, system-ui, sans-serif;
  font-size: 10.5px;
  font-weight: 500;
  /* Ticks are a column of numbers that must line up, which is the one place
     tabular figures are right. The big standalone values on the stat tiles
     deliberately do NOT use them. */
  font-variant-numeric: tabular-nums;
}

/* THE REVEAL. transform-box: fill-box makes the scale origin the rect's own
   left edge rather than the SVG origin, which is what lets one keyframe work
   at any chart width. It is a transform, so it composites - no layout, no
   repaint of the paths underneath. */
.zy-chart-wipe {
  fill: #fff;
  transform-box: fill-box;
  transform-origin: left center;
  animation: zy-wipe 820ms var(--ease-out) both;
}
@keyframes zy-wipe { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* The crosshair glides between days. transform only. */
.zy-chart-cursor { transition: transform 220ms var(--ease-out); }

/* ---- the chart tooltip ----------------------------------------------
   Values lead, labels follow: the reader already knows which series they
   are on and wants the number. The series is keyed with a short stroke
   rather than a filled box - at this density a box is data-weight ink
   doing a label's job. */
.zy-chart-tip {
  position: absolute; top: 2px; z-index: 10;
  pointer-events: none;
  min-width: 132px;
  border-radius: var(--r-control);
  padding: 0.5rem 0.625rem;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.10), 0 0 0 4px rgba(250,250,250,0.60);
  font-family: var(--font-chrome), Tajawal, system-ui, sans-serif;
}
.zy-chart-tip-d { font-size: 11px; font-weight: 500; line-height: 1.5; color: var(--stone-2); }
.zy-chart-tip-v { margin-top: 0.1875rem; display: flex; align-items: baseline; gap: 0.375rem; }
/* Tabular here on purpose: the number is re-rendered on every pointer move,
   and proportional figures make it jitter sideways as the digits change. */
.zy-chart-tip-n { font-size: 16px; font-weight: 900; line-height: 1.4; color: var(--obsidian); font-variant-numeric: tabular-nums; }
.zy-chart-tip-l { display: inline-flex; align-items: center; gap: 0.3125rem; font-size: 11px; font-weight: 500; color: var(--stone); }
.zy-chart-tip-p { margin-top: 0.125rem; display: flex; align-items: center; gap: 0.3125rem; font-size: 11px; font-weight: 500; line-height: 1.6; color: var(--stone); font-variant-numeric: tabular-nums; }
.zy-chart-key { display: inline-block; width: 10px; height: 2px; border-radius: 2px; background: var(--violet); }
.zy-chart-key[data-prev] { background: rgba(17,17,17,0.34); }

/* ---- the two-state toggle -------------------------------------------
   "Compare", "no bots". Not a segmented control: there is no row of
   alternatives to slide an indicator across, just one thing that is on or
   off. It reports the state it is IN, which is why the label changes with
   it rather than describing the action. */
.zy-toggle {
  display: inline-flex; align-items: center; gap: 0.375rem;
  border: 0; cursor: pointer; font: inherit;
  border-radius: var(--r-control);
  padding: 0.4375rem 0.6875rem;
  font-size: 12px; font-weight: 700; line-height: 1.5;
  letter-spacing: 0;
  white-space: nowrap;
  color: var(--stone);
  background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.08);
  font-family: var(--font-chrome), Tajawal, system-ui, sans-serif;
  transition: color 200ms var(--ease-out), box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zy-toggle:hover { color: var(--obsidian); box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.zy-toggle[data-on] {
  color: var(--violet);
  background: var(--violet-fill);
  box-shadow: 0 0 0 1px rgba(94,106,210,0.35);
}
.zy-toggle:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

/* ---- the stat tile --------------------------------------------------
   A number with a label. Where the tile is also a CONTROL - the analytics
   KPI row picks what the chart plots - being selected is what colours it,
   and the ring is what shows it, because the card has no border to tint.

   IT IS .zy-stat AND NOT .zy-tile, AND THAT NAME COST A DEBUGGING PASS.
   .zy-tile was already taken, further up this file, by the 34x34 icon square
   beside a row title - complete with a fixed width and height. Reusing the
   name meant the analytics stat tile inherited height: 34px, so a flex column
   with four rows of content had no room for any of it: the children shrank
   (flex-shrink is 1 by default in a column, which is what turned a 20px
   sparkline into a 0px one), the labels broke to one glyph per line, and the
   whole KPI row collapsed to 36px and overlapped the control bar above it.
   Two components, two names. */
.zy-stat {
  position: relative;
  width: 100%;
  min-width: 0;
  /* THE LAYOUT IS DECLARED, NOT INHERITED. A <button> is not a plain block:
     the UA lays its content out in an anonymous centred box, so dropping the
     old w-full/p-4 utilities for this class left the four rows running
     ACROSS the tile as flex items - each about 36px wide, with the Arabic
     labels breaking to one glyph per line and the whole row collapsing to
     36px tall. Measured, not guessed: the tile came back
     display=flex flexDirection=row height=35.99 with children 36px wide.
     A column with stretched items is what the content always assumed. */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border: 0; cursor: pointer; font: inherit;
  text-align: start;
  border-radius: var(--r-card);
  padding: 1rem;
  background: #ffffff;
  box-shadow: var(--ring-1), var(--ring-2);
  transition: box-shadow 220ms var(--ease-out);
}
@media (min-width: 640px) { .zy-stat { padding: 1.125rem 1.25rem; } }
.zy-stat[data-static] { cursor: default; }
.zy-stat:not([data-static]):hover { box-shadow: 0 0 0 1px rgba(94,106,210,0.40), 0 0 0 4px rgba(94,106,210,0.10); }
.zy-stat[data-on] { box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring); }
.zy-stat:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; }
.zy-stat-chip {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: var(--r-control);
  color: var(--stone-2);
  background: rgba(17,17,17,0.05);
  transition: color 220ms var(--ease-out), background-color 220ms var(--ease-out);
}
.zy-stat[data-on] .zy-stat-chip { color: var(--violet); background: var(--violet-fill); }
.zy-stat:not([data-static]):hover .zy-stat-chip { color: var(--violet); }
.zy-stat-v {
  font-size: 22px; font-weight: 900; line-height: 1.35;
  letter-spacing: 0;
  color: var(--obsidian);
}
@media (min-width: 640px) { .zy-stat-v { font-size: 24px; } }
.zy-stat-sub { margin-top: 0.375rem; font-size: 12px; font-weight: 500; line-height: 1.7; color: var(--stone); }

/* ---- the screen-reader-only block -----------------------------------
   The chart ships a table of its own numbers so the tooltip enhances rather
   than gates. Tailwind's sr-only did NOT hold it: measured on the real page,
   the table rendered at its natural 807x687 and hung 687px out of the bottom
   of the chart card. Owning the recipe here removes the dependency on a
   utility being generated and on nothing else in this scope outranking it.

   clip-path AND the legacy clip: the old one is what actually applies in
   several engines, and the pair is the long-standing accessible recipe.
   Never display:none or visibility:hidden - both take the content out of the
   accessibility tree, which is the one thing this element exists to be in. */
.zy-app .zy-sr {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* ---- the mobile drawer ----------------------------------------------
   THE RAIL IS lg:flex, SO BELOW 1024px THERE IS NO NAV AT ALL UNLESS
   SOMETHING ELSE CARRIES IT. On the product that something is Sidebar's own
   drawer; a surface that renders the rail itself has to bring one too, or a
   phone reader is locked on whatever view loaded first. Measured on the
   candidate before this existed: zero reachable nav rows at 390px.

   The panel slides from the INLINE-START edge, which is the right in Arabic
   and the left in English. translateX is physical and does not follow dir,
   so the closed position is set per-direction rather than with one
   percentage - the trap the house style records.
------------------------------------------------------------------------- */
.zy-scrim {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(17,17,17,0.42);
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 260ms var(--ease-out);
}
.zy-scrim[data-open] { opacity: 1; }
.zy-drawer {
  position: fixed; z-index: 61;
  inset-block: 0; inset-inline-start: 0;
  width: min(282px, 86vw);
  display: flex; flex-direction: column;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  transition: transform 320ms var(--ease-out);
  /* Closed: pushed off the START edge. LTR start is the left, so it goes
     negative; RTL start is the right, so it goes positive. */
  transform: translateX(-100%);
}
[dir="rtl"] .zy-drawer { transform: translateX(100%); }
.zy-drawer[data-open] { transform: translateX(0); }
[dir="rtl"] .zy-drawer[data-open] { transform: translateX(0); }
.zy-drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding-inline: 1.125rem 0.625rem;
  flex-shrink: 0;
  box-shadow: inset 0 -1px 0 rgba(17,17,17,0.07);
}
@media (min-width: 1024px) { .zy-scrim, .zy-drawer { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .zy-scrim, .zy-drawer { transition: none; }
}

/* ---- mobile chrome --------------------------------------------------
   The bar is the only chrome a phone gets, so it has to hold the page
   title, the way back to the nav, and the primary action without any of
   them shrinking to an unlabelled circle. 44px is the hit-target floor;
   at 390px the CTA keeps its icon and drops its label, which is the one
   place a bare glyph is acceptable because the icon is a plus. */
@media (max-width: 1023px) {
  .zy-top { padding-inline: 0.75rem; gap: 0.5rem; }
  .zy-top-title { font-size: 15px; }
  .zy-icon-btn { width: 38px; height: 38px; }
  .zy-top-cta { padding: 0.5rem 0.75rem; min-height: 38px; }
  .zy-top-acct { padding-inline: 0.25rem 0.5rem; min-height: 38px; }
}
@media (max-width: 400px) {
  .zy-top { padding-inline: 0.625rem; }
  .zy-top-cta { padding: 0.5rem 0.625rem; }
}

/* ---- the switch -----------------------------------------------------
   A binary preference. The knob MOVES between the two ends rather than the
   track being redrawn, for the same reason the segmented indicator does.
   Sized 40x24 with a 20px knob: the whole control clears the 24px minimum
   for a touch target on its short axis and is comfortably over it on the
   long one. */
.zy-switch {
  position: relative;
  display: inline-block;
  width: 40px; height: 24px;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(17,17,17,0.14);
  transition: background-color 240ms var(--ease-out);
}
.zy-switch[data-on] { background: var(--violet); }
.zy-switch-knob {
  position: absolute;
  top: 2px; inset-inline-start: 2px;
  width: 20px; height: 20px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(17,17,17,0.20);
  transition: transform 240ms var(--ease-out);
}
/* Physical transform, so the two directions get their own sign. */
.zy-switch[data-on] .zy-switch-knob { transform: translateX(16px); }
[dir="rtl"] .zy-switch[data-on] .zy-switch-knob { transform: translateX(-16px); }

/* ---- the status pill ------------------------------------------------
   One shape for every state the dashboard reports. The hue comes from the
   triad above and appears on the pill and nowhere else. */
.zy-pill {
  display: inline-flex; align-items: center; gap: 0.3125rem;
  border-radius: 999px;
  padding: 0.1875rem 0.5625rem;
  font-size: 11.5px; font-weight: 700; line-height: 1.6;
  letter-spacing: 0;
  white-space: nowrap;
}
.zy-pill[data-tone="ok"]      { color: var(--success); background: var(--success-fill); box-shadow: 0 0 0 1px var(--success-ring); }
.zy-pill[data-tone="warn"]    { color: var(--warning); background: var(--warning-fill); box-shadow: 0 0 0 1px var(--warning-ring); }
.zy-pill[data-tone="bad"]     { color: var(--error);   background: var(--error-fill);   box-shadow: 0 0 0 1px var(--error-ring); }
.zy-pill[data-tone="accent"]  { color: var(--violet);  background: var(--violet-fill);  box-shadow: 0 0 0 1px rgba(94,106,210,0.22); }
.zy-pill[data-tone="quiet"]   { color: var(--stone);   background: rgba(17,17,17,0.05); box-shadow: 0 0 0 1px rgba(17,17,17,0.08); }



/* ======================================================================
   BLOCK B - the rules that deliberately OVERRIDE Tailwind utilities inside
   .zy-app, and only inside it.

   Block A owns classes this restyle invented, so it never collides with a
   page author. These four do collide, on purpose: they redefine what
   rounded-lg, tracking-tight and a bare <input> mean on this surface. Each
   is narrow enough that it cannot break a page - one changes only
   border-radius, one only letter-spacing and line-height, one only the look
   of a text field, one only adds a pseudo-element - and each wins on the
   .zy-app scope, which is two classes against a utility's one.
   ====================================================================== */

/* ---- 1. HOLD ONE RADIUS SCALE --------------------------------------
   panel 28 / card 16 / control 10 / pill 999.

   The dashboard was on Tailwind's default 6 / 8 / 12 / 16 / 24 across 195
   uses, which is five radii doing the work of four and none of them the
   house numbers. Re-mapping the utilities inside the scope moves every
   route onto the scale at once; hand-editing 195 class names would have
   drifted on the first new component.

   rounded-full and rounded-none are left alone - a pill is already 999 and
   a square edge is a decision. */
.zy-app .rounded-md  { border-radius: var(--r-control); }
.zy-app .rounded-lg  { border-radius: var(--r-control); }
.zy-app .rounded-xl  { border-radius: var(--r-card); }
.zy-app .rounded-2xl { border-radius: var(--r-card); }
.zy-app .rounded-3xl { border-radius: var(--r-panel); }

/* ---- 2. NO NEGATIVE LETTER-SPACING ---------------------------------
   THE HIGHEST-LEVERAGE TYPE FIX ON THIS SURFACE. tracking-tight is
   -0.025em and the dashboard wrote it 35 times, plus one tracking-[-0.5px],
   almost all of them on Arabic headings. Arabic letterforms CONNECT:
   tracking in does not tighten the line, it pulls the joins apart and
   breaks the word. The house style bans it outright.

   Positive tracking is untouched - the uppercase Latin eyebrows the
   dashboard uses it on genuinely need it. */
.zy-app .tracking-tight,
.zy-app .tracking-tighter,
.zy-app .tracking-\\[-0\\.5px\\] { letter-spacing: 0; }

/* Leading floor. Arabic descenders (ج ح خ ع غ م ه ي) clip below about 1.24,
   and the dashboard sets several headings on leading-none / leading-tight. */
.zy-app .leading-none  { line-height: 1.24; }
.zy-app .leading-tight { line-height: 1.3; }

/* ---- 3. THE FIELD ---------------------------------------------------
   Copied from app/demo/access/styles.ts, which is the settled vocabulary
   for a Zenya form control: fill #f4f4f6, control radius, a hairline at
   rest, and on focus the violet ring plus a 4px halo. The violet says
   "you are here", which is the one thing an accent on a form is for.

   Type selectors rather than a class, because the fields live across ten
   pages and a dozen components that were never going to be edited by hand.
   The excluded types are controls that are not text boxes - a checkbox
   styled as a field is a bug, and accent-color already handles them. */
.zy-app input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]):not([type="submit"]):not([type="button"]),
.zy-app textarea,
.zy-app select {
  border: 0;
  border-radius: var(--r-control);
  color: var(--obsidian);
  background: var(--field);
  box-shadow: 0 0 0 1px rgba(17,17,17,0.10);
  letter-spacing: 0;
  transition: box-shadow 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.zy-app input::placeholder,
.zy-app textarea::placeholder { color: var(--ghost); }
.zy-app input:not([type="checkbox"]):not([type="radio"]):hover,
.zy-app textarea:hover,
.zy-app select:hover { box-shadow: 0 0 0 1px rgba(17,17,17,0.18); }
.zy-app input:not([type="checkbox"]):not([type="radio"]):focus,
.zy-app textarea:focus,
.zy-app select:focus {
  outline: none;
  background: #ffffff;
  box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring);
}
.zy-app input[type="checkbox"],
.zy-app input[type="radio"] { accent-color: var(--violet); }

/* ---- 4. THE VIOLET CORNER BRACKET -----------------------------------
   The mark from the candidate set: a hairline on two OPPOSITE corners,
   drawn on the card's own radius. Two corners rather than four, because a
   full frame is a border and the ring token is already the border.

   WHERE IT EARNS ITS PLACE, AND WHY IT RESTS AT ZERO. On /demo/access there
   is exactly one card and the bracket sits at 0.5 opacity all the time.
   This surface puts up to twenty cards on a page, so six resting variants
   were rendered on the real stat row and composited before choosing:
   0 / 0.35 / 0.55 opacity, a 14px short bracket, a single corner, and a
   violet top border.

     0.35  invisible enough to read as a rendering artifact, not a mark
     0.55  legible, but four cards wearing it reads as a repeating pattern
           that competes with the numbers for first read
     14px  shorter than the 16px corner arc, so it sits inside the curve
           and looks like a mistake
     one corner  reads as a dog-ear rather than a frame gesture
     top border  a rule across the card, which the house style bans outright
           and which the ring token already does properly

   And the calibration that settled it: on /dashboard/sites, the worst case
   at twenty cards, a resting bracket is not even visible - those cards open
   with a 16:9 thumbnail, and violet hairlines over a photograph read as
   nothing at all. A mark that is noise where the cards are few and invisible
   where they are many is not a mark.

   So the bracket here is a RESPONSE rather than a decoration: nothing at
   rest, open on hover and on focus-within. That makes density irrelevant
   (only ever one card is marked) and gives the mark a job the static one
   never had - it says which card the pointer or the keyboard is on, which
   on a dense grid of near-identical cards is real information. The violet
   the reader sees at REST on this surface is the violet that means
   something: the current nav row, the progress in a meter, the traffic
   bars, the primary action.

   It is drawn with an inset overlay rather than on .zy-card itself because
   several dashboard cards clip their own overflow for a thumbnail, and a
   pseudo-element at -1px would be sliced off by that clip. */
.zy-app .zy-card { position: relative; }
.zy-app .zy-card::before,
.zy-app .zy-card::after {
  content: "";
  position: absolute;
  z-index: 2;
  width: 22px; height: 22px;
  pointer-events: none;
  border-color: var(--violet);
  border-style: solid;
  border-width: 0;
  opacity: 0;
  transition: opacity 300ms var(--ease-out), width 300ms var(--ease-out), height 300ms var(--ease-out);
}
.zy-app .zy-card::before {
  inset-block-start: 0; inset-inline-start: 0;
  border-block-start-width: 2px; border-inline-start-width: 2px;
  border-start-start-radius: var(--r-card);
}
.zy-app .zy-card::after {
  inset-block-end: 0; inset-inline-end: 0;
  border-block-end-width: 2px; border-inline-end-width: 2px;
  border-end-end-radius: var(--r-card);
}
@media (hover: hover) {
  .zy-app .zy-card:hover::before,
  .zy-app .zy-card:hover::after { opacity: 1; width: 30px; height: 30px; }
  /* The RING answers with the bracket, so the whole card responds rather
     than just its two corners. Measured against the alternative of tinting
     the card fill: a violet wash makes twenty cards look selected, a violet
     ring makes one card look pointed at. */
  .zy-app .zy-card:hover { box-shadow: 0 0 0 1px rgba(94,106,210,0.40), 0 0 0 4px rgba(94,106,210,0.10); }
}
.zy-app .zy-card:focus-within::before,
.zy-app .zy-card:focus-within::after { opacity: 1; width: 30px; height: 30px; }
/* Keyboard gets the full ring, not the softened hover one: focus has to be
   findable on a grid of twenty, and it is the one state that must never be
   subtle. */
.zy-app .zy-card:focus-within { box-shadow: 0 0 0 1px var(--violet), 0 0 0 4px var(--violet-ring); }

/* ---- 5. RESTRAINT ---------------------------------------------------
   Motion on a product surface is feedback, not choreography. Everything
   above transitions colour, opacity and a 8px growth; nothing moves the
   layout. Under reduced motion it all stops. */
@media (prefers-reduced-motion: reduce) {
  .zy-app *,
  .zy-app *::before,
  .zy-app *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  /* The wipe is a "both" animation, so squashing its duration still lands it
     on the TO frame - the chart is drawn, just instantly. Stated explicitly
     because the failure mode of getting this wrong is a permanently blank
     chart for exactly the readers who cannot afford one. */
  .zy-chart-wipe { animation: none !important; transform: scaleX(1) !important; }
}
`
