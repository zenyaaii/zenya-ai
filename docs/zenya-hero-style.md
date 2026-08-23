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

## The deck

The hero does not scroll away by degrees. One downward gesture — wheel, swipe
or key — lifts the whole of it and brings section two up in its place as a
single move, and the same going back. There is no free scrolling on this page
at all: the body has been `overflow: hidden` since the hero was one screen, and
the deck moves by transform instead.

**Percentages, never viewport units.** `#zn-deck` is `fixed; inset: 0`, the
track inside it is `height: 200%`, and each panel is `height: 50%`. A panel is
therefore exactly one screen at any zoom — which matters, because the root
ZoomLock writes CSS `zoom` and `vh` resolves *before* that scale is applied. At
the 85% cap the travel measures `-1059px` on a 900px window; that is one screen
in CSS pixels, and reading it as "59px too far" is the mistake to avoid.

**The lock is the whole trick.** A gesture past the threshold moves the deck and
then closes it for the length of the move; every event arriving while it is
closed pushes the reopening further out, so the tail of a trackpad flick is
swallowed rather than counted as a second gesture. An eight-event burst moves
one screen. A reader who wants the next screen stops and gestures again.

Anything with its own overflow keeps its wheel — the rule is
`e.target.closest(".zn-list")`, which is what leaves the fifty-face tray
scrollable inside a page that has taken the wheel over.

The light belongs to the page, not to the hero: `#zn-glow` sits at deck level
and holds still while the two screens travel over it.

## Section two: ابن

The first of the three words, shown rather than argued for. It drives the
product's own path — the eight templates as `/themes` lists them, the real
wizard behind the one that is picked, and that wizard's form filling itself in.
It lives in `app/demo/home/BuildSection.tsx`.

A window on the same lit paper, built from the same three values as everything
else: the header pill's surface, the header pill's hairline ring, nothing more.
The path line at the top is the only thing on the surface that reports rather
than asks, and it is there because the change from `/themes` to
`/theme/new/restaurant` is what says the picker really did open the wizard.

**The animation is per card, never one long take.** A card comes forward, the
cursor moves into it, types or picks, the card finishes, the cursor leaves, a
beat plays, and only then does the next card arrive. Eight cards, eight
animations, about 54 seconds end to end and then round again — each card
between 3.5 and 10 seconds, which is long enough to follow and short enough
not to wait on.

Three things the composition needs:

- **Cards are centred in the window, not stacked against the top of it.** A
  phone number is one field and the menu is a whole read; anchored to the top,
  the short ones strand above a half-empty frame.
- **Slots take fixed heights, not aspect ratios.** Square upload slots on a
  730px card are 170px tall, and five of them overran the window by a row —
  which, on a centred card, is cut off the bottom.
- **Picker rows size to their contents.** Stretched over the frame, eight
  templates become eight empty boxes with a label in the corner, which reads as
  a picture that failed to load.

Typing is real typing — one more character per beat into a field the cursor is
sitting in, and the caret belongs to that field alone. Arabic reshaping as it
connects is what a reader typing here would see, so unlike the claim there is
nothing to clip around at this size.

The cursor measures its targets against the frame's own rect over its
`offsetWidth`. That ratio is the zoom, and dividing by it is what keeps rendered
pixels and CSS pixels from mixing — the same trap the hero's columns hit.

## The Menu card

The card that carries the idea, and the smallest of the eight. It mounts the
product's own `components/restaurant/MenuImageAnalyzer` rather than reproducing
it: a real JPEG is put on the real file input through a `DataTransfer` and a
real bubbling `change` event, the component's real preparation runs on it, and
its real read button is pressed. What fills the card came back from that
request.

`public/demo/menu-sample.jpg` is drawn to yield **four categories of two dishes**
— the shape the brief asks for — so nothing has to be trimmed on the way in. A
real menu returns a dozen categories and forty items, which is too much to
watch fill and makes the beat unpredictable.

`/api/analyze-menu` is login-gated, and this page is public, so a demo read
announces itself with `demo: true` and is bounded twice over: it reads the
**bundled sample and never the posted image** (the answer is shared, so
honouring what arrived would let one caller's photograph become what everyone
watches fill in), and it is **memoised per server instance** (so the flag is
worth at most one model call however hard it is hammered). The section warms
the route as it arrives, twenty seconds before the card needs it. A signed-in
caller's path through that route is untouched.

The completion beat watches the frame, not the analyzer — what the read
produces renders beside the analyzer, so looking inside its subtree finds
nothing and sits out the whole timeout every time.

## Where this stands, and what is next

The hero and section two are built, at `app/demo/home/`, live at
`zenyaai.co/demo/home`. It is NOT the homepage and must not be wired into `/`.

Two open questions on section two, both deliberately left for a decision:

- **The picker tiles carry no preview.** `/themes` shows a cover image in each
  card and `lib/theme-previews` would serve them, but they are colour
  photographs and this page has no colour but the light. The tiles are compact
  text for now.
- **The Style card shows no colour.** The wizard's four presets are swatches of
  the palette they name; here they are the name and the vibe only, for the same
  reason.

Next are the other two words — ادر and انشر — which are not built.

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
- **The dev server is what to check, not `next start`.** Port 3000 has been
  found serving a stale production build more than once; hashed chunk names in
  the HTML (`webpack-<hash>.js`) are the tell. Dev and start cannot share
  `.next` — stop one before starting the other.
- **The route is slow to compile.** Fifty `next/font` families means the first
  request after a cold start can take minutes, and next/font will retry Google
  three times before giving up. Warm it with `curl` before driving the page, or
  a browser will fire its gesture before React has hydrated and nothing will
  move.
