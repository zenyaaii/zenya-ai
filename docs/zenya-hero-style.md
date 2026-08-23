# The Zenya hero style

The house style for Zenya's front page, as built at `app/demo/home/page.tsx`
and live at `zenyaai.co/demo/home`. This is the reference: when a new surface
should feel like Zenya, it follows what is written here.

Read this before changing the page, and update it when a rule really changes.

## The one-line read

Typeset terminal on white paper, lit from the edges. Bare canvas, near-black
Arabic type at display size, hairline rings instead of shadows, and the only
colour in the whole composition is a blurred field of light bleeding in from
the top and bottom edges.

## Surface and colour

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#fafafa` | the canvas, and the only background |
| Obsidian | `#171717` | all type, the account control, the dot |
| Stone | `#666666` | secondary type, tray rows, the claim |
| Ring | `0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55)` | every floating surface |

Rules that hold:

- **Pure `#000` is for logo glyphs only.** Type never gets it.
- **No shadows.** Elevation is stacked hairline rings, never a drop shadow.
- **No rules, no dividers.** Nothing draws a line across the page. The one
  exception is the 1px separator inside the header pill, between the nav and
  the account control.
- **The page is achromatic.** Every pixel of colour belongs to the light at the
  edges. Nothing else is tinted, ever.

## The light

The background animation, rebuilt from the Claude Design file rather than
copied. Two bars of `oklch` colour, blurred until they are only light:

- **Foot:** `left/right -8%`, `bottom -22vh`, `34vh` tall, `blur(9vh)`, opacity
  `0.72`. Mostly below the fold, so what reaches the page is the top of a glow.
- **Head:** a fainter twin off the top edge — `28vh`, `blur(10vh)`, opacity
  `0.3`, running 26s in reverse so the two never pulse together.

Both breathe on one keyframe: `translateX(-4% → 4%)` with `scaleY(1 → 1.22)`
over 19s on `cubic-bezier(.4, 0, .6, 1)`. Blur and opacity live on the outer
box, colour and movement on the inner one, so the filter rasterises once
instead of every frame.

Nine palettes ship, each four `oklch` stops walking the hue wheel with the same
lightness and chroma discipline: شفق (the original), فجر، بحر، نخيل، غروب، توت،
رمل، رماد, and بلا, which turns the light off and gives back bare paper.

## Type

- **Display:** Tajawal 900 by default. Fifty settings are offered — every
  Arabic-subset family `next/font` can serve, four of them twice at opposite
  weights. All are declared `preload: false`, so a face is fetched only when
  something is actually set in it.
- **UI:** IBM Plex Sans Arabic, 400 and 500, for the header, the trays and the
  claim. Quiet on purpose, so the three words are the only thing on the page
  carrying weight.

Two rules hold for all fifty, because the type is Arabic:

- **No negative letter-spacing.** The reference calls for `-0.06em` at display
  sizes; Arabic letterforms connect, and tracking in breaks them apart.
- **Leading stays well above 1.0**, per face, so descenders are never clipped.
  It runs from 1.24 on the geometric sans to 2.1 on Nastaliq.

**Size is measured, never tuned.** The line is laid out at its natural size and
a `--fit` ratio scales it to fill 86% of the width it actually has, re-run on
face change, on resize, and once the webfont lands. `flex-nowrap` means the
browser cannot answer an overflow by breaking the line, so the only way out is
the size. A second term caps the rendered line at `60vh / leading`, which is
what keeps a Nastaliq on screen in a wide, short window. The size is set
against the WIDEST row, so changing row never resizes the type.

Fifty hand-tuned per-face numbers were tried first and are the wrong shape of
solution: they cannot survive a change to the words, and did not.

## The three words

Three columns, four rows, cycling. The rows are `ابن ادر انشر`, `تبني تدير
تنشر`, `بناء إدارة نشر`, `تحسين إشراف زبائن`. All four words of a column live
stacked in one grid cell; only one is ever on stage.

Each column is exactly as wide as the word currently in it, written from a
measured matrix of every word at the fitted size, and animates to the next
width. A short word lets its neighbours close in, a long one pushes them apart,
and the line stays centred because its container centres it.

Per column the order is strict, and the reason is hard-won: **the old word
leaves, then the column re-spaces while it is empty, then the new word
arrives.** Overlapping any two of those is what produced every bug in this
section. Columns are `320ms` apart (`--beat`), so a reader sees one word
change, then the next, then the next, rather than one blurred event. The whole
change runs 1540ms inside a 4600ms hold.

Four traps, all of which shipped at least once:

- **The grid track must be `minmax(0, 1fr)`.** An `auto` track is sized to
  max-content, so every word sat centred in a track as wide as the longest of
  that column's four words, hanging ~110px past its own column. Clipped, that
  sliced letters off; unclipped, it put words on top of each other. Neither
  symptom was the disease.
- **Columns must not shrink** (`flex: 0 0 auto`). `flex-nowrap` stops the line
  wrapping but flex items still shrink below their content, which breaks a word
  across two lines and corrupts the measurement that reads it.
- **Clip vertically only.** The words in the wings must be hidden, but a side
  cut takes letters off the word being read. Nothing needs cutting sideways
  once the sequence above holds.
- **Measure with `offsetWidth`, never a bounding rect.** The root ZoomLock
  writes CSS `zoom`; a rect is in rendered pixels while `clientWidth`, the gap
  and any width written back are CSS pixels. Mixing them shrinks every column
  by the zoom factor.

## The claim

One sentence at the foot of the light, alternating Arabic and English, each
typed out. Three beats: it reads with the dot on its own side (right for
Arabic, left for English), then the sentence rolls away upward while the dot
walks to the middle, then the dot blinks out and the other language types in
from the opposite side. The dot only ever crosses sides while invisible and
with no transition on the move, so it never slides across the sentence it is
introducing.

## Motion

One curve does nearly all the work: `cubic-bezier(0.22, 1, 0.36, 1)` —
ease-out, arriving slowly. Its counterpart for anything leaving is
`cubic-bezier(0.55, 0.085, 0.68, 0.53)`, faster and sharper, so things go away
quicker than they arrive.

Three patterns:

1. **Surfaces grow, they do not appear.** Every tray shares one surface with
   the control that opens it: the header pill, both corner controls, the phone
   menu. Height animates by `grid-template-rows: 0fr → 1fr`, the one way to
   transition to an auto height without hard-coding a pixel the contents will
   outgrow. Width animates from a definite resting value, so the movement has
   something to interpolate.
2. **The word roll**, taken from Ventriloc's call-to-action button: the
   outgoing word leaves upward on the fast ease-in curve while the incoming one
   rises from 130% below on the slower ease-out, each column delayed by its own
   index so a line rewrites itself in sequence. A clip is what sells it — the
   words arrive from an edge rather than fading in mid-air.
3. **Typing by clip, not by character.** The claim reveals with an animated
   `clip-path` behind a caret walking the same `steps()`. Arabic letters change
   shape as they connect, so appending characters visibly reflows the line;
   clipping does not.

**The rule that governs all of it:** a resting state is the finished state.
Every animation borrows the hidden state for its own duration via `backwards`
fill and rests visible, so a browser that never runs it still reads the page.
This is not a preference — it is a bug that has already shipped here twice.

Everything collapses under `prefers-reduced-motion: reduce`.

## Layout

- **Full-viewport, fixed.** The hero is `position: fixed; inset: 0`, not
  `100dvh`. The root ZoomLock writes CSS `zoom`, and viewport units resolve
  *before* that scale is applied, so `100dvh` in an 85%-zoomed 720px window is
  573px — which parks everything above true centre.
- **Two measurements** govern the whole composition, held on the body:
  `--gut: clamp(1.25rem, 4.5vw, 4rem)` and `--inset: 2rem`. The header floats at
  the inset, the corner controls sit at it, the gutter is what everything hangs
  off.
- **Surfaces size to their contents.** Pinning a width is what clipped the call
  to action into the mark; `fit-content` with a `min-width` for the opening
  keeps the closed state honest at any account state, any font.
- **The header splits at `md` (768px).** Tablets get the laptop bar; phones get
  a compact pill that opens sideways first and then down, with the mark centred
  by `1fr auto 1fr`.

## Chrome

Two glass controls, one per bottom corner: the face on the left, the light on
the right. `backdrop-filter: blur(22px) saturate(190%)` — the saturation is the
point, since it pulls the colour of the light through the glass so the control
takes on the animation rather than sitting over it. Solid fallbacks for
`prefers-reduced-transparency` and for engines without `backdrop-filter`.

Both open on hover, retract on leave, and hold on a click, which is also the
only way in on a phone.

## Voice

Arabic first, MSA, no colloquial spellings. The claim alternates between
Arabic and English, typed out each time.

The page makes exactly one claim: أوّل شركة إسلامية لإنشاء المواقع بالذكاء
الاصطناعي. One dot, one sentence. Nothing else on the page argues for anything.

## What this style refuses

- Gradients on anything that is not the light itself
- Drop shadows
- Rules and dividers as decoration
- Inter, and slate-900 as a neutral
- Any motion whose resting state is invisible

## Where this stands, and what is next

The hero is done and lives at `app/demo/home/page.tsx`, live at
`zenyaai.co/demo/home`. It is NOT the homepage and must not be wired into `/`.

Next is the second section, which is not built.

**Movement.** The hero does not scroll away by degrees. One downward gesture
lifts the whole hero up and brings section two in as a single move, one screen
to the next. The same going back up.

**The section is `ابن`**, the first of the three words: the build step. It is
the real generator, not a mock. The path is the real one a customer takes.

1. Pick a template from the eight (`app/(main)/themes/page.tsx` holds the
   canonical list and each one's `createHref`).
2. That opens the real wizard, e.g. `/theme/new/restaurant`.
3. The real form appears, and the animation drives it.

**The animation is per card, never one long take.** The restaurant wizard is
eight cards: Basics, Style, Location and Hours, Menu, Story, Reservations,
Visuals, Press. Each card gets its own short animation: a cursor moves in,
types or picks, the card completes, the animation ends, a thinking or
confirmation beat plays, and only then does the next card come forward with its
own animation. One card, one animation, in sequence.

**The Menu card is the one worth building well.** It carries
`components/restaurant/MenuImageAnalyzer.tsx`, which reads a photo of a real
menu and extracts the categories and dishes into the form. Its animation should
show that: choosing an image, uploading it, and the whole menu filling itself
in from the photo. That is the moment the product sells itself, so the image
selection and the fill are both worth animating properly.

## Working notes

- **Check localhost after every change.** Reasoning about this layout has been
  wrong more often than measuring it. The browser pane used for checking never
  advances CSS transitions, so states can be verified but motion cannot.
- **Editing this file auto-deploys.** A Write/Edit marks a deploy and the Stop
  hook ships `vercel --prod` from the local tree, so fetch and merge origin
  first or the deploy reverts production.
- **If the page renders as raw unstyled HTML**, the dev server's `.next` cache
  has corrupted (`Cannot find module './NNNN.js'`), usually from a build
  running while the dev server was live. Stop the server, delete `.next`,
  restart.
