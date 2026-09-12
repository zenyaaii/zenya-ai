/**
 * THE PRODUCT TOKEN LAYER — one definition, read by every product surface.
 *
 * This block was written for the dashboard restyle and lived inside
 * components/app/dashboard-style.ts. It is lifted out here unchanged except
 * for one added selector, because the seven generator wizards under
 * /theme/new and the Shopify builder at /build read exactly the same
 * variables through exactly the same Tailwind classes — bg-surface,
 * border-token, text-muted, shadow-card-soft — and were still resolving them
 * to the old marketing palette: the #f7f4ed cream ground, the #e5e2d9 border,
 * and the layered drop shadows.
 *
 * RE-POINTING THE TOKENS IS THE WHOLE RESTYLE for those eight pages. The
 * alternative was hand-editing roughly 7,000 lines across eight files to
 * swap classes one at a time, which is how six of them end up correct and
 * two do not. The wizards keep their own composition; what changes is the
 * palette, the elevation and the radii they resolve to.
 *
 * THE THREE SELECTORS:
 *   .zy-app     the dashboard shell
 *   .zy-tokens  for Radix portals, which land at the end of <body> and
 *               inherit nothing from the shell
 *   .zx-root    the house chrome root, which components/zenya/chrome/Shell
 *               and ProductShell both put on their outermost element
 *
 * CHROME_CSS also declares --ground, --obsidian, --violet, --field and the
 * three greys on .zx-root. Those declarations are identical to the ones
 * here, so the two blocks agree rather than fight; what this adds on top is
 * the product half — --background, --surface, --card, --foreground, --muted,
 * --border, the status triad, the elevation rings and the radius scale.
 *
 * NO BACKTICKS ANYWHERE IN THE LITERAL: one would end it.
 */

export const PRODUCT_TOKENS_CSS = `
/* THE TOKEN BLOCK. Two selectors, because not everything on this surface is
   inside the shell: Radix renders the account menu through a PORTAL, which
   lands at the end of <body> and inherits nothing from .zy-app - so every
   var() in it would resolve to nothing. .zy-tokens is the same declarations
   with none of the shell's own layout, for exactly those escapees. */
.zy-app, .zy-tokens, .zx-root {
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
  /* 0.09 put the ok pill's own #15803d at 4.27:1 against it, under the 4.5 a
     label is owed — measured by scripts/theme-check.cjs on /demo/dashboard.
     0.055 clears the floor and still reads as a tinted pill. */
  --success-fill: rgba(21,128,61,0.03);
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

`
