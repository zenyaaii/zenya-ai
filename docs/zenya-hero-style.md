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
  edges. Nothing else is tinted, ever — with **one recorded exception**, the
  ادر panel, which is obsidian with a single accent because it is the inside
  of the product rather than the paper the product is drawn on. See "Section
  three" below; do not take it as licence to tint anything else.

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

## How the light introduces itself

The page opens with the light OFF. Bare paper, three words, nothing else. A
beat later (`REVEAL_WAIT`, 2.4s) the light arrives on its own, fading up over a
second and a half — and its control changes in the same instant.

That simultaneity IS the affordance. Nothing on this page explains itself in
words, so the control teaches itself by being watched: at the moment the paper
takes colour, the swatch replays from nothing, one ring goes out from it, and
the label stops saying اللون and says which light it is for a couple of
seconds. The face control gives the same single ring at the same moment, so a
reader reads the two bottom corners as a pair of controls rather than two
labels.

Four rules hold it together:

- **A stored choice is never overruled.** If the reader has picked before —
  including بلا — theirs is restored and the reveal never runs. The page
  performs for someone who has not chosen, and only once.
- **A pick settles it.** Choosing anything cancels the reveal for that visit.
- **The gradient stays painted through a fade-OUT.** بلا has no gradient of its
  own, so dropping the paint on the frame the fade begins would leave nothing
  to fade and make it a cut — the one thing this page never does. The last real
  gradient is held while the opacity goes down.
- **The face is never changed for the reader**, only ringed. The light can swap
  under someone harmlessly; the type is measured, and swapping the face would
  resize the line they are in the middle of reading.

The ring stays under about 2.4× the mark it grows from: the corner pill clips
its own overflow, so anything larger is cut at the pill's edge and reads as a
bug rather than a beat. It is pure decoration, so `forwards` leaving it gone is
correct — content on this page never does that.

## The floating surfaces

The header pill, both corner controls and the ابن switcher. They are the only
things on this page a reader can press, and they have to look it — on bare
paper, on the light, and on the ground of every screen below.

Six layers, and each is doing a job:

1. a **gradient** ground, not a flat one — real glass catches more light at its
   top than its bottom, and a flat fill is the biggest tell that something is a
   rectangle pretending
2. **blur and saturate** behind it, so it takes the colour of what it is over
   rather than sitting on top of it
3. a bright inset **top rim** — the specular line. This is what the eye reads
   as glass; without it the rest is a translucent box
4. a dark inset **bottom rim**, so the far edge turns away
5. a **hairline** all round, which is what carries it on bare paper where there
   is no colour for the blur to pick up
6. **three stacked drop shadows** — contact, near, far. One blurred shadow
   reads as a blurred edge; three at different radii read as something floating
   above the page. This is the layer that was missing.

**This is the deliberate exception to the no-shadows rule**, and it is scoped to
the controls. Content never does this. It was asked for twice: with hairlines
alone the controls stopped reading as controls at all and looked like loose
words lying on the page.

**Glass needs something to be glass about.** `#zn-deck` carries `data-lit` and
the ground and edge hang off it as two variables on the body: lit, a
half-transparent gradient behind an 11% hairline; unlit, near-opaque and
brighter than the paper behind a 16% one. `data-lit` is not "is the light on"
but **"is there anything behind the floating surfaces"** — every screen below
the hero has a ground of its own, so it stays true down there.

**Never paint over a dark screen's own pill.** The dark panels set
`background-COLOR` and this recipe sets a background-IMAGE, and an image paints
over a colour — so the white gradient sat on top of every dark pill and undid
the per-panel work. They turn the variable off (`--pane-bg: none`) rather than
fighting it with another `!important`.

## The ground under ابن

`rgba(70, 84, 200, 0.095)` — the brand indigo, deepened and pushed a few
degrees toward ادر's violet, because that is the point of the screen: ابن is
the approach to ادر, not a second hero.

Chosen by rendering six candidates on the screen itself and looking at them.
The old value (the same indigo at 4.5%) was so faint that everything visible on
ابن was really the hero's light hanging down — the screen had no colour of its
own. Rejected: **sand** and **rose**, both of which fall into the hero's own
warmth and flatten the screen to one note; **teal**, which is a genuinely
different colour and reads fresh alone, but turns grey exactly where it meets
the warm light coming down, which is the best thing on that screen.

Two rules the value has to obey:

- **Translucent, never a flat hex.** The hero's light hangs down past its own
  foot onto this screen and ادر's hangs up onto it. An opaque ground paints
  over both, and the light crossing is what makes the screens read as one
  surface.
- **A gradient down from nothing, not a flat wash.** At a tint that actually
  reads, a flat fill starts at the panel's top edge — and that edge IS the seam
  with the hero. It drew a visible step straight across the page, exactly where
  the light was supposed to be crossing. Transparent for the first third (where
  the hero's light lands anyway), full for the rest. The bottom stays flat:
  ادر's glow hangs up over it and does that end's blending already.

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
track inside it is `height: 500%`, and each panel is `height: 20%`. A panel
is therefore exactly one screen at any zoom — which matters, because the root
ZoomLock writes CSS `zoom` and `vh` resolves *before* that scale is applied. At
the 85% cap the travel measures `-1059px` on a 900px window; that is one screen
in CSS pixels, and reading it as "59px too far" is the mistake to avoid.

**Adding a screen is four numbers, and they all live together:** the track's
height, the panel's height, the step in
`transform: translateY(calc(var(--deck) * -20%))`, and `PANELS` in the gesture
handler. Nothing else counts panels. Going from two screens to three touched
those four and nothing else; going from three to four touched the same four
and one more — the header's `data-dark`, which was `deck === 2` and is now
`deck >= 2`, because there are two dark screens and the pill must not flash
back to paper between them. Going from four to five touched the four again,
and `data-panel` — which names *which* dark screen the pill is standing on,
and there are three of them now.

At five screens the track is `500%`, a panel is `20%`, and the step is `-20%`.
Measured after: the five panels sit at exactly 0, 900, 1800, 2700 and 3600 on
a 900px window, down and back up again, with no horizontal overflow and no
page errors on any of them.

**The lock is the whole trick.** A gesture past the threshold moves the deck and
then closes it for the length of the move; every event arriving while it is
closed pushes the reopening further out, so the tail of a trackpad flick is
swallowed rather than counted as a second gesture. An eight-event burst moves
one screen. A reader who wants the next screen stops and gestures again.

Anything with its own overflow keeps its wheel — the rule is
`e.target.closest(".zn-list")`, which is what leaves the fifty-face tray
scrollable inside a page that has taken the wheel over.

**The light belongs to the hero, not to the page.** `#zn-glow` lives inside the
hero's own panel, so the colour travels up and leaves with it rather than
sitting under the whole site for ever. The two corner controls go with it —
the face and the light are what the hero is made of and have nothing to say
about the build section, so they fade out rather than following the reader
down. Section two is bare paper.

**The move is the one moment on this page that has to be perfect**, and three
things were stealing its frames. All three are load-bearing:

1. **The picker's covers must be thumbnails.** The screenshots behind
   `themePreview()` run to 1.2MB apiece, and eight of them decoding as the
   panel arrives was a 600–900ms stall — a single frame swallowing the whole
   transition. `public/theme-previews/thumb/*.webp` at 560px is 108kB for all
   eight. Regenerate them whenever a cover changes.
2. **The window carries no `backdrop-filter`.** It used to blur what was behind
   it, so every frame re-ran a full-surface blur. The light behind it is
   already blurred to 9vh; flat translucent white is indistinguishable.
3. **The light stops breathing for the length of the move.** A 9vh blur over an
   animating box re-rasterises every frame. Nobody can see a nineteen-second
   breath during a one-second move; everybody can see the move stutter.

Section two's script also waits for the deck to land (`settled`) rather than
starting on the gesture, so a cursor animation, a network prefetch and eight
cards of React are not on the same frames as the move.

Measured, GPU-composited, across the move: **11 frames before, 83 after** —
worst frame 933ms down to 117ms.

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

**One stage, layered.** The build word — ابن، تبني، بناء، تحسين — is the
ground, and the window stands on it: the word runs large behind the window and
out past its top and its side, cycling the hero's first column on the hero's
own roll and in the hero's own face.

Three rules the word earned the hard way:

- **Solid, never outlined.** It was hollowed to a hairline edge first, and on
  Arabic that is wrong twice over: the stroke draws the seam where each letter
  joins the next, so a connected word reads as separate letters wired together
  — the opposite of what the script does.
- **Faded as a LAYER, never as a colour.** `opacity` on the element, not alpha
  in `color`. A semi-transparent colour is painted per glyph, and connected
  Arabic letters overlap at every join — so each join composited twice and came
  out visibly darker than the strokes either side of it. Element opacity
  flattens the word first and fades the result: one even tone throughout.
- **Anchored to its start edge, never centred.** The four words share one grid
  cell, so the cell is as wide as the LONGEST of them; centre a three-letter
  word in a six-letter cell and it floats a hundred and fifty pixels off the
  edge it is meant to sit against. Same trap as the hero's columns.
- **Below the header on narrow screens.** On a phone the word and the pill
  share the same strip, and at the top of the panel the word lands on the pill
  and loses its ascenders off the edge.

**The seam is one light, not two.** The foot glow deliberately hangs 22vh below
the hero, and nothing clips it any more: `#zn-glow` is `overflow: visible` and
the panels carry `contain: layout` only, never `paint`. That overhang lands on
the top of section two, so the two screens share the hero's own light and the
join disappears. Clipping either one is what put a ruled line across the page
and made the second screen look guillotined off the first. `#zn-deck` still
clips everything at the viewport, which is the only clip that belongs here.

A second, separately-tuned wash was tried first and is the wrong shape of
answer: two lights that have to be made to match will never quite match. One
light that is allowed to cross always does.

**The animation is per card, never one long take.** A card comes forward, the
cursor moves into it, types or picks, the card finishes, a beat plays, and
only then does the next card arrive. **The cursor never leaves.** It used to be
taken off the page between cards, which read as the pointer blinking out of
existence every few seconds; a person filling in a form does not vanish
between fields. Eight cards, eight
animations, then a ninth beat, about 58 seconds end to end and then round
again — each card between 3.5 and 10 seconds, which is long enough to follow
and short enough not to wait on.

**The ninth beat is the wizard's closing bar**, which is not a card because it
is not one in the wizard either: it is sticky at the foot of the whole form. It
rises into the window once the last card is done, carrying its copy verbatim,
and the cursor presses ولّد موقعي; the button takes its real working label and
the section rests there before going round. Obsidian, which is the one
inversion this page already uses for the account control and a chosen chip.

**Nothing is generated.** A real run is twenty to forty seconds of paid work
per visitor, and showing a site that was never built would misrepresent the
form the reader just watched being filled in.

Three things the composition needs:

- **Cards are centred in the window, not stacked against the top of it.** A
  phone number is one field and the menu is a whole read; anchored to the top,
  the short ones strand above a half-empty frame.
- **Slots take fixed heights, not aspect ratios.** Square upload slots on a
  730px card are 170px tall, and five of them overran the window by a row —
  which, on a centred card, is cut off the bottom.
- **The Visuals card picks real pictures.** Five empty rectangles the cursor
  hovered past read as a card that failed to load, not as an upload step. The
  template ships its own photographs (`utils/restaurant/mock-content`), pulled
  down small to `public/demo/restaurant/*.webp` — 236kB for nine, and no
  third-party request on the page whose whole problem was frame budget.
- **Picker rows size to their contents.** The cover sets the tile height and
  the two lines under it follow; stretched over the frame instead, the eight
  become empty boxes with a label in the corner.

**The picker covers are the one place on the page that carries colour of its
own.** What a template looks like is the information a picker owes the reader,
and eight tiles that only name themselves cannot give it. They come through
`themePreview()`, the same resolver `/themes` uses, so a screenshot dropped
into `public/theme-previews` lands here too. `collective` and `one_product` had
no local file and were resolving to Unsplash stock — one of which was a
photograph of a woman — so both were shot from their own live demos. **Never
let a tile fall back to Unsplash**; shoot the demo instead, with the cookie
banner dismissed and the dev indicator hidden, since those files feed `/themes`
and the dashboard at full size too.

**Two templates, taking turns — and a switcher.** `BuildSection.tsx` is the
stage — the window, the picker, the cursor and the clock. What gets filled in,
and in what order, belongs to each template and lives in `templates.tsx`. Left
alone the runs alternate (restaurant ~73s, services ~80s); the pill pair under
the window lets a reader jump straight to the one they want rather than waiting
a minute for it to come round. A pick advances the take to the next index that
lands on that template, so a run always begins at its picker beat and never
mid-form. It is the only control in the section, and stays as quiet as the rest
of the page.

**Declare the stage's single grid cell.** The window asks for its size in per
cent, and a per cent of an auto-sized row is circular — the row sizes to the
window and the window sizes to the row, so the cap silently stops applying. The
tallest card (the picker, eight tiles) then pushed the window off the bottom of
the screen and it snapped back when a shorter card replaced it, which is what
the first scroll on a phone looked like. `grid-template-rows: minmax(0, 1fr)`,
always.

**The window is a flex BASIS, not a height.** The switcher is its sibling; a
window at `height: 100%` leaves it nothing to stand on.

**Nothing in the window is ever cut — the content is measured and scaled.** The
cards are wildly different sizes: four fields, or a week of opening hours, or
eight template tiles. A window sized for the largest is mostly empty for the
rest; a window sized for the rest slices the largest in half, and on a phone it
sliced both — the picker lost the row the cursor was choosing from, and the
hours card lost four days off the bottom.

So `.zn-fit` does to the card what `--fit` does to the hero's three words: lay
it out at its natural size, read that size, write the ratio that makes it fit.
Three rules make it work:

- **It only ever scales DOWN.** A four-field card is not blown up to fill the
  frame; it sits at its own size, which is what it should do.
- **The child must size to its CONTENT, never stretch.** A card stretched to
  the window measures as the window and the ratio always comes back 1. The
  centring belongs to `.zn-fit` (`align-content: center`), not to the card.
- **Measure against the stage's CONTENT box.** `clientHeight` counts the
  padding, and measuring against that lets the card bleed into it and clip at
  the window's edge.

The observer watches the card's LAYOUT box, which a transform does not touch,
so scaling cannot feed back into the measurement. That is what keeps it from
being a loop. The cursor needs no adjustment: it reads targets by bounding
rect, which already carries the scale.

**One finger, two meanings.** A swipe that travelled further DOWN than across
belongs to the deck and moves a screen; one that travelled further ACROSS
belongs to the window and changes template. Both sides test the same way, so
neither has to know about the other.

**The rule for adding a template: read its wizard and follow it.** The cards
are its cards, the order is its order, the labels are its labels. Services
puts the style preset LAST rather than second, and the animation puts it last
too. A demo that invents a form the product does not have is worth nothing.

Each template needs a centrepiece — the beat that carries its idea. The
restaurant's is the menu photograph being read. The services template's is the
services LIST being built: one service filled in, the cursor pressing "add
another", the next arriving. That growing list is what that wizard is for.

**Nothing is invented to fill a field.** The services wizard asks for an
average rating and a review count; the demo leaves both alone, because that
business has no reviews and typing a number into that box would be making one
up. An optional field left blank is honest; a filled one is not.

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

## The composer

A placement tool at `/demo/home?edit=1`, in `app/demo/home/Composer.tsx`. It
exists so the composition can be found by moving it rather than by describing
it: drag the window or the word, pull a corner to resize, nudge with the arrow
keys, read the numbers, save.

**It works on both built sections.** One component, one set of behaviour; the
section it is composing decides only which two selectors it measures
(`.zn-app`/`.zn-word` for ابن, `.zn3-app`/`.zn3-word` for ادر) and which cell it
saves into. On the obsidian panel the tool inverts with the ground — a dashed
near-black outline on a near-black screen is not a placement tool, it is a
guess.

### Saving is direct, and that is the change

The first version wrote to `localStorage` and printed CSS for a human to paste
into `page.tsx` by hand. That is the saving problem: **nothing done in the tool
ever reached the page**, and a browser that cleared its storage lost the work.

Now the Save button (and ⌘S) POSTs to `/api/demo-layout`, which writes
`app/demo/home/placement.json`. Both sections import that file and apply it
**always**, not only under `?edit=1` — so a save changes the real page, survives
a reload, is committed with the rest of the source, and ships. The button says
which of the three things happened rather than going quiet: saving, saved, or
refused with the reason.

**The route is development-only and says so.** It writes to the filesystem, so a
production build returns 404 as though it did not exist — which is the honest
answer, because a read-only serverless filesystem could not do it anyway. Every
field is validated against a range and clamped before it is written, and the
only path it can write is one module constant. A malformed file on disk is
repaired rather than merged into.

**An untouched cell still changes nothing.** Every value travels as a CSS
variable that the stylesheet already falls back away from, and a zeroed cell
writes no variables at all — verified: a plain visitor has no `.zn-compose` in
the DOM and no inline `style` attribute on either section. That property is what
makes it safe for the tool's output to be load-bearing.

### Four things it had to get right

- **Read the base size ONCE, at pointer-down.** Reading it live each frame is a
  feedback loop — the thing grows, the next frame measures the grown thing and
  grows it again. One small drag took the word from 216px to 863px before this
  was captured.
- **Convert through the zoom.** Rects come back rendered, the offsets written
  back are CSS pixels; the scope's rect over its `offsetWidth` is the bridge —
  the same one the cursor uses. `offsetWidth` and computed `font-size` are
  already CSS pixels and need no conversion.
- **The word lies behind the window**, so where they overlap its outline cannot
  be reached by a pointer. The panel carries an explicit pair of buttons, and
  the picked outline comes forward.
- **The arrow keys are the DECK'S keys.** The first version grabbed them in the
  capture phase, which took the page's navigation away and nudged the layout a
  pixel on every press instead — measured, two presses to reach ادر left the
  window sitting 2px low before anything had been dragged. With two sections
  each mounting their own tool, both would have grabbed the same press as well.
  So a composer is engaged only once something inside it has been touched, and
  it lets go on a click elsewhere or on Escape. Until then the arrows belong to
  the deck, exactly as they do without the tool.

**Layouts are kept per width class**, wide and narrow, because the two are laid
out differently and a number that suits a laptop is wrong on a phone.

## The placement

Composed by hand at `?edit=1`. The nudges below are baked into `page.tsx` as
the DEFAULTS; anything saved in `placement.json` overrides them, because every
rule reads the saved variable first and falls back to these. The window is 1198px
wide and 719px tall, shifted 109px left and 69px down; the word is 308px,
nudged 7px left and 72px down. On a phone the window drops 32px and moves 11px
left and the word moves 2px left and 9px up; both keep their own size.

**The nudges are handed out, never simply applied.** They live as five
variables on `.zn-build` (`--nx --ny --wx --wy --appbasis`) whose defaults are
the SAFE ones — dead centre, nothing pushed — and the media queries give out
the placed values only where there is room:

- **Sideways above 1200px.** The window is capped at 1198px wide, so below
  about 1200 the gutter is all the slack there is; applied flat, the shift put
  the window 53px through the left edge at 1024.
- **Downward above 1200 × 840.** This one needs HEIGHT, not width: on an
  800px-tall laptop the taller window plus the drop put the switcher off the
  bottom of the screen.

Verified at 1728×1080, 1440×900, 1280×800, 1024×768 and 390×844: nothing off
any edge, nothing clipped. A composition made on one screen has to be told
which screens it is allowed on, or it is only correct on the one it was made
on.

## Where this stands, and what is next

The hero, ابن, ادر, انشر and the close are built, at `app/demo/home/`, live
at `zenyaai.co/demo/home`. Five screens. It is NOT the homepage and must not
be wired into `/`.

**The Style card is the wizard's card.** Not a version of it — the presets are
IMPORTED from `utils/restaurant/presets` and `utils/services/presets`, and the
card is built the way those wizards build it: three swatches at the top in
primary / accent / surface order, the vibe in the accent colour, the name in
the preset's own heading font, the description in its muted colour, and the
محدّد badge on the chosen one. A palette can never drift between the demo and
the real form because there is only one copy of it.

The three lines are Latin inside an RTL card and carry their own `dir="ltr"`.
Laid out RTL, every sentence put its full stop on the wrong end.

**The picker tiles carry their real covers**, at full colour — settled, and the
two missing screenshots have been shot. See the section above.

## Section three: ادر

The second of the three words: the manage step, at `app/demo/home/`
(`ManageSection.tsx` is the stage, `surfaces.tsx` is what it drives). It is the
third panel of the same deck, one more gesture down.

**No second set of machinery.** The cursor engine and the fit pass turned out
to be generic, so they moved into `app/demo/home/runner.ts` and both sections
import them. Section two was rewired onto the shared copy rather than left with
its own — two copies of a thing this hard-won drift apart, and the whole point
of the extraction is that they cannot.

### The style break

**Section three is the one panel on this page that is not white paper, and the
break is deliberate.** The hero and ابن are the outside — the paper the site is
drawn on. ادر is where the owner works once the site exists, so it reads as
being *inside* the product. Everywhere else in this document, "the page is
achromatic" still holds; this is the exception, and here is why it is not an
invented palette:

- **The ground is obsidian, `#131316`**, with the window one step lighter at
  `#1a1a1f` — the same lift the white window makes off paper, inverted.
- **The accent is `#c8a96a`, brushed gold, and it was already on the page.**
  Section two's restaurant run picks the **onyx** preset — `#0a0a0c` ground,
  `#c8a96a` accent, `#f4ecd8` text — so the site the reader watches being built
  one screen up *is* a black-and-gold site, and this is its dashboard. The same
  value is what the real analytics dashboard already paints its bookings tile
  with (`accent="#c8a96a"` on the التواصل tile), and it sits inside the رمل
  palette's own hue band.
- **One hue, on live data only**: the row as it arrives, the field being typed,
  the active range and tab. Everything else is paper on obsidian.
- **The accent is the dashboard's own `#5e6ad2`**, chosen by putting both on
  the real page and looking. The fill takes the product's exact primary; text
  and hairlines take a lifted stop of the same hue (`#97a0ee`), because
  `#5e6ad2` as *type* on this ground falls under 4.5:1. `?accent=gold` still
  reaches the brushed-gold alternative, which is worth keeping for as long as
  the choice is worth revisiting.

**The card treatment is `lit`**, switchable at `?cards=ring|fill|well|lit`.
Every surface in the section is one box, so they share one material: a
hairline that is bright along the top edge and fades down, obeying the light
this section already has coming from above. Costs no colour and no shadow.

The **tile grid is the one exception**: six outlined boxes in a row read as a
wireframe whatever the hairline is doing, so the tiles take a solid fill
instead. That is the only per-element override in the set.

Dropping the boxes entirely is what this kind of section usually wants, and it
is deliberately not offered. The product's own dashboard puts its content in
bordered cards, and the section's whole discipline is following the real
screen.

**Type is paper, and the contrast is measured, not judged:** `#fafafa` at
16.5:1 against the window, `rgba(250,250,250,0.66)` at 7.7:1, and the quietest
step at `0.50` for 5.2:1. `0.44` was tried first and measures 4.2:1, which is
under AA — on a dark ground the tertiary step has to be lifted, not lowered.
Tajawal, one weight lighter than the light sections use and with more leading.

**The word is the hero's SECOND column** — ادر / تدير / إدارة / إشراف — on the
same roll and in the same face, paper at `opacity: 0.26`, and `0.30` and much
larger on a phone. `0.12` was tried first on the theory that light ink on a
dark ground carries further than dark ink on paper: the theory is true and it
still came out invisible, because here the word competes with a lit window
rather than with bare paper. Faded as a LAYER, never as alpha in `color`, for
the reason section two already records.

### The light across the seam

The light hangs **upward** out of section three onto the foot of ابن — the
mirror of the hero's foot glow hanging down onto its head. One light that is
allowed to cross, never two that would have to be matched, and nothing clips
it.

**The first attempt went muddy exactly as feared, and the fix is chroma, not
lightness.** Sampled at `x=60` down the seam, the pale رمل stops arrived at the
top of the obsidian as `80,70,58` — a brown-grey with twenty points between its
red and its blue. A light laid over a near-black ground at a third opacity
keeps only a third of what it started with, so a pale stop arrives desaturated;
what survives the mix is *saturation*. Rebuilt from غروب's warm stops in رمل's
hue band, the same measurement reads `104,74,46` — fifty-eight points of
separation, and a real amber. The same change improved the paper side too:
`245,235,222` became `250,221,194`, so the bleed onto ابن now reads instead of
being almost invisible.

Blend modes are the wrong answer here and were rejected: `screen` fixes the
dark side and erases the light entirely on the paper side, which would mean two
lights again.

### The header crosses over

**The pill is on every screen, so it takes the ground it is standing on.** On
ادر it inverts — dark glass, paper type, and the call to action flipped from
obsidian-on-paper to paper-on-obsidian — and it runs on the deck's own 1020ms
clock, so the header, the ground and the light all land together. Arriving
reads as one event rather than a dark box sliding under a white pill.

Everything in that rule is `!important`, because the pill's surface, the mark's
colour and the call to action are inline styles on the elements themselves and
a stylesheet cannot reach past an inline style any other way.

Two things it got wrong first, both worth keeping:

- **Never a descendant wildcard.** The first version transitioned
  `background`, `box-shadow`, `color` and `fill` on `.zn-pill *` — every node
  in the bar — and all of it ran on the frames the deck was travelling.
  Measured, that took the move from 52 frames to 36 and its worst frame from
  153ms to 436ms, and it was slowing the *hero→build* move too, which has
  nothing to do with this section. Only four things actually change colour
  here, so only those four carry a transition. Best of three afterwards:
  hero→build 63 frames / worst 67ms, build→manage 67 / 33.
- **Name the control, do not match its shape.** Inverting
  `a.rounded-full` caught every nav link — they are `rounded-full` too — and
  turned the bar into a row of white pills. The account control carries a
  `data-cta` so the rule can name the one element it means.

### The seam: the ground has to ramp, not start

The glow was not enough. A solid fill begins exactly at the panel's edge, and
an edge between paper and obsidian is a cut whatever is blurred over the top of
it: sampled across the seam, **paper at `250,221,194` met obsidian at
`104,74,46` in a single pixel.**

So the panel is transparent at its own top and reaches full obsidian a tenth of
the way down, and what shows through in between is the deck's paper — the
screen the reader is arriving from. Measured again afterwards, panel two's last
pixel is `249,220,189` and panel three's first is `248,218,188`: the two grounds
now meet at the same value, and the largest step anywhere down the ramp is 30
units across 26 pixels. There is nothing left to see.

The ramp finishes **above the header**, at 10% of the panel rather than 23%. A
longer one put a band of paper light under the pill, which made the inverted
header read as a dark box on a bright sky — the opposite of arriving somewhere.

Percentages of the panel, never `vh`, for the same reason the deck itself is
built in percentages.

### Size: the window came down, not the type alone

**Filling the window is what made the section read as oversized.** The floor
that stretched the short surface out to 500px was the wrong fix for the dead
space around it — in ابن a card sits at its own size in a roomy frame and the
frame is the composition. The floor is gone, the window came down from 719 to
545 (and is capped at 1010px wide, because a dashboard stretched to 1198 is a
wall of small print), and every type size in the section stepped down by the
same 0.87 — applied mechanically across all 57 of them, so a scale stays a
scale and nothing drifts.

Measured after: content 481–502 against 483 of window, fit `0.89`–`1.0` on
every laptop size, `0.795`–`0.87` on a phone. All of it above section two's own
worst-case `0.763`.

**On a phone the window cannot be the lever.** The surfaces stack there, so the
content is ~750px tall, and shrinking the window just makes the fit pass scale
it into type nobody can read — a 500px window measured `0.598`, which renders
ten-pixel type at six. So on a phone the window keeps its height and the
CONTENT comes down instead: furniture first, labels never. That is the only
lever that makes the screen smaller without making it illegible.

### The window is inert

**Nothing inside it can be touched.** The booking form is the product's real
component, with real inputs and a real submit, so on a phone a tap landed in it
and the keyboard came up — a reader found themselves filling in a form that
belongs to a demo. It is something to watch, not something to use.

Three parts, because one is not enough:

- `pointer-events: none` on the **screen**, not on the stage — a touch then
  still reaches the frame underneath, so the sideways swipe that changes
  surface keeps working. Verified: a tap on the name field leaves
  `document.activeElement` as `BODY`, and the swipe still moves
  bookings → analytics.
- **No `focus()` call in the script.** The value setter never needed one, and
  focusing a real input on a phone raises the on-screen keyboard by itself,
  with no tap at all.
- **`tabIndex = -1` on every control** in the subtree, re-applied whenever the
  surface changes. `pointer-events` does not take an input out of the tab
  order, so without this a keyboard could still reach it.

None of it obstructs the script: the value setter and a programmatic `click()`
are not user interaction, and `pointer-events` cannot block either.

Section two is deliberately NOT treated this way. Its picker tiles are real
links to real pages and a reader should be able to follow them.

### The light stays below ابن

The first version hung the glow 21vh up out of this panel, and because panel
three comes after panel two in the DOM and each is its own stacking context,
that overhang painted **over** the foot of the build screen — its window and
its switcher sat in a warm wash belonging to the next screen. Measured, section
two's last two hundred pixels read `249,236,223` instead of paper.

The glow now starts inside its own panel. Section two's foot is `250,250,250`
again down to y=800, with only the last forty pixels — below everything —
carrying any warmth at all. The seam does not need the overhang: the ground
ramp starts transparent at this panel's own top, so what a reader passes
through is paper meeting paper and then darkening. **The colour belongs to ادر,
and it starts where ادر starts.**

### The pictures

**`hero.webp` is not usable and is no longer referenced.** It is the restaurant
template's own Unsplash hero, and it is wrong for this brand twice over: wine
glasses across the whole foreground, and bare arms. The share preview and
section two's Visuals hero slot both take `room-1.webp` — the dining room —
which is also the better cover for a restaurant, since an interior says what
the place is and a plate does not.

**The same photograph is still the template's own hero**, in
`utils/restaurant/mock-content.ts`, which means it is what a generated
restaurant site shows when the owner uploads nothing, what `/demo/restaurant`
shows, and what the picker's own screenshot
(`public/theme-previews/restaurant.webp`) is a picture of. That is a product
problem, not a demo-page one, and it is not fixed.

### The cursor, and physical versus logical

**`left: 0`, never `inset-inline-start: 0`.** The cursor's x is a distance from
the frame's *physical* left edge, so its anchor has to be that same edge. The
logical property resolves to `right` in an RTL container and threw the pointer
clean off the window — measured at x=1468 on a frame ending at 1149, which is
why there was no pointer in this section at all. Section two uses `left: 0` and
this is the reason. **Logical properties are right for content and wrong for a
coordinate system measured in physical pixels.**

The word, the trays and the menus keep their logical properties; they are
content and they should flip.

### Two old traps that bit again

- **A backtick inside the stylesheet ends the stylesheet.** The whole block is
  one template literal. A backtick written into a *comment* closed it, and the
  CSS after it became JavaScript — the page 500'd with "pill is not defined".
  The existing comment in the deck section says this; it is worth saying twice.
- **`.next` corrupts and the page stops hydrating.** Chunks come back 404 as
  HTML, React never hydrates, and the section renders as static markup with no
  animation and no cursor — which looks exactly like a bug in the section. Stop
  the server, delete `.next`, restart, and re-check before believing anything
  measured through it.

### How ادر presents itself: the device

The section does not float a rectangle in the middle of a panel. **A screen
rises from below the fold and comes to rest as a COMPLETE device** — all four
corners, nothing running off an edge. Cropping the body at the bottom was tried
first and reads as a screenshot that did not finish loading rather than as a
product shot.

**Which device depends on the width**, because that is what the reader is
holding, and each one is its real shape. The ASPECT is on the screen and the
width is derived from the height, so the object has real proportions instead of
whatever the container happened to be. The surfaces inside are the same real
screens at every size.

| | aspect | tell | shown | measured |
| --- | --- | --- | --- | --- |
| MacBook Pro | 16:10 | the notch | cut at the bottom | 864x673, 81% of it, 61% of the screen |
| iPad | 4:3 | a camera dot | whole | 746x566, 57% |
| Phone | 9:19.5 | the island | cut, and crossing the left corner | 429x909, 68% of it, 73% of the screen |

**The phone is BIGGER than the page it is on.** Shown whole it had to be 292px
wide to fit the height, which is a toy: the screen was narrower than its own
content wanted. So the machine is half again as large, it runs off the bottom
the way the laptop does, and it crosses the left corner. The word lives
top-right, so the object belongs bottom-left.

The clamp that stops a screen escaping its frame is lifted for the phone and
nowhere else: everywhere else a device wider than its container is the bug from
the section above; here it is the composition. The bias is `-4%` and not more,
because at `-10%` the page edge was taking seventy pixels of screen and the end
of every line with it. What the edge takes now is bezel and a margin.

**On the phone the website is cut WITH the mockup.** The laptop keeps its
content inside the visible part; the phone lets the screen fill the whole
machine, past the cut, which is what a phone lying past the edge of a page
actually looks like. What keeps that honest is where the scrolling aims: the
cursor puts whatever it is working on a quarter of the way down the screen, not
merely "in view", because a screen whose lower half is off the page has plenty
of room that the reader cannot see.

**The laptop is the one that is cut.** A MacBook shown whole has to be small
enough to fit a screen, and small is the one thing an object this size must not
be, so it runs off the bottom edge and the reader sees about sixty per cent of
it. The two smaller devices are shown whole, because at their size they can be.
A base was drawn under the lid while it was whole and is gone with the crop:
drawing a thing below the fold is drawing something nobody sees.

**The laptop holds a true 16:10 at any window height.** Its width is derived
from its height, so a tall window used to push the derived width past the
container and the escape-clamp then squashed the aspect to 1.361 — a fake
16:10 at full size, which is worse than a real one at ninety per cent. The
height is capped by what the WIDTH can afford instead. Two things that cap has
to get right, both learned by measuring: the budget is for the WHOLE screen and
not the visible part, because the screen fills the machine and is cut with it,
so the overhang has to be subtracted; and the section gets a wider box than
section two's 1198 (a wizard card wants that width, a 16:10 machine turns every
pixel of it into height), which is what buys back the presence a true aspect
costs rather than buying it by faking the shape. Measured after: 1.6 at every
size, and the machine came out wider than it was.

**No growth deltas.** The totals are sample figures and read as "this is what
the screen looks like"; a rate of growth reads as a claim. "+31%" says the
business is growing, which is a thing said about a business that does not
exist. The one is a picture of a product, the other is a boast.

**The screen can never paint outside its frame.** Its width is derived from its
height through the aspect, so on a TALL viewport the derived width outgrows the
container and the display paints straight over the bezel and out past the
corners — measured, that is what a 1440x1200 window did. `max-width: 100%` on
the screen makes the aspect give instead: a slightly tall screen is a rounding
error, a screen hanging outside its own device is a broken picture.

The phone takes nearly all the height left to it, because a phone's own shape
is tall and narrow: any less and the screen gets too narrow for the content to
be read at its natural size, which is the whole point of not scaling it.

**The switcher moved above the device.** It used to sit under the window, and
the device runs off the bottom on purpose, so there is no "under" any more.

**The rise rests in its finished state.** The travelling state is what carries
the attribute (`data-down`), and at rest there is nothing written at all, so a
browser that never runs the transition still finds the screen where it belongs.
It is `transform` only, and it starts once the deck has landed, so it never
shares frames with the move.

**The frame is darker than the screen it holds**, and darker than the room. The
first version had it a step LIGHTER than its own display, which is backwards
for an object and is why it read as a padded box rather than a device: a bezel
is the darkest thing in the picture and the display is the only thing that is
lit. It catches a hairline along its top edge, the screen is seated into it
with one dark line, and a faint sheen runs off the top corner because a display
is a sheet of glass under a light that comes from above. The sheen is 0.055
paper at its strongest, which lifts the surface about nine values and costs the
type nothing.

**The cast is physics, not decoration.** A lit display throws light into the
room in FRONT of it, which here is the strip the word lives in. The first one
pooled underneath, where the device covers the whole bottom of the screen and
none of it could ever be seen. `--dev-seen` is declared on the section rather
than on the device so the light knows where the screen's top edge is.

### It is a MacBook, and the screen is full

Above 1024 the device is a **MacBook Pro display: 16:10, a thin frame, rounded
display corners and the notch**. The aspect is on the SCREEN and the width is
derived from it, so the object has real proportions rather than whatever the
container happened to be. The notch sits IN the display, which is where it is
on the real machine, so the top row of the screen clears it.

**Nothing floats in the middle of the glass.** Section two scales a card down
to the room it has and centres it; that is right for a card and wrong for a
display, where the leftover reads as a half-loaded page rather than as air. The
surfaces stretch to the screen instead, and the only space left is the padding
between the frame and where the content starts.

### Scrolling, not scaling

**Section three has no fit pass.** Shrinking has a floor: past a point the type
is simply too small to read, and a phone kept hitting it. Scrolling has no such
floor, and it is also what a person does — you scroll to the field you are
filling in. So a surface is allowed to be TALLER than the display showing it,
and the cursor brings each target into view before it moves to it (`bring()` in
`runner.ts`).

The stage is `overflow: hidden` rather than `auto`: the reader is watching, not
driving, so there is no scrollbar and no gesture to hijack. Programmatic
scrolling still works, which is the only kind this screen does.

**Finding the thing that scrolls is two tests, not one.** It has to overflow
AND be a scroll container. Overflowing alone finds the stretched content box
first, and `scrollBy` on an element whose overflow is `visible` does nothing at
all — the scroll silently never happens, which is exactly how this failed the
first time and measured `scrollTop: 0` on a screen with 290px of travel in it.

**The share preview is back on phones.** It had been hidden to buy a fit ratio,
and that trade no longer exists. Nothing is hidden on a phone now; it is just
further down, which is where it is on the real screen too. The SEO run ends by
moving to the Google result rather than to the save button, because the preview
is the reason that screen exists — and on a phone that is the beat that scrolls
down to it.

### What the sizing learned

`--dev-seen` is the device's height as a share of the box the section lays out
in, and it is now the only number: the device is whole, so there is no crop to
express. Two things got this wrong on the way here:

- **A percentage margin resolves against the containing block's WIDTH, not its
  height.** While the device was still cropped, `margin-bottom: -12%` took
  122px off a desktop and 35px off a phone, because those are the widths, and
  the device looked right on exactly one screen. Any overhang has to be a
  length.
- **A saved placement does not survive a change of shape.** `--app-h` was
  composed against the old window and, once the device existed, it sized the
  device instead: 520px, which showed a third of an iPad. The height was
  cleared out of `placement.json` for this section; the width, the nudges and
  the word size were composed against things that still exist and were kept.

### The three surfaces

The switcher, the sideways swipe and the auto-rotation are section two's, in
this section's own values. Each surface is the real screen, in its own order,
with its own labels.

**الحجوزات — the centrepiece.** Two panes: the owner's inbox and the guest's
side of the published site, and a reservation crossing between them while the
reader watches. The form is the product's own `components/site/BookingForm` —
the one every template ships — **mounted rather than reproduced**, and
deliberately mounted *without* a `BookingProvider`. That is the path the editor
and the preview already take: with no slug a submit is a no-op that still shows
the component's real success state. So the reader sees the real form behave
exactly as it does on a live site, **nothing is posted, no row is written, and
`/api/bookings` is never called from this page.** The cursor types into it
through the prototype's own value setter and a bubbling event — what React's
`onChange` is built over — the same move section two makes to hand the analyzer
its file. Then the row lands, the counts tick, and the owner sets it to مؤكّد
through the status control the inbox actually has.

Every value on that row is a value the reader just watched being typed. That is
the line this section draws: a guest's name in a name field is sample content
of the same class as the wizard's demo business; a visitor total is a statistic
about a business that does not exist.

**التحليلات — SAMPLE FIGURES, by the owner's decision.** This surface used to
be the honest empty state and is no longer. The owner asked twice, explicitly,
for a populated dashboard after the empty version was built and shown, and that
is their call to make about their own marketing. What follows is the shape that
decision took, and the guardrails that came with it:

- **The numbers are not measured and are not anybody's traffic.** They are
  sample data for a restaurant that does not exist, in a demo where the
  business name, the guest and the phone number are already sample data.
- **Everything derives from ONE series** in `surfaces.tsx`, so the six tiles
  and the chart can never disagree: views come from the series, sessions and
  visitors from views, the conversion rate is computed. Six figures picked
  separately is how a demo ends up claiming more conversions than sessions.
- **The dashboard's own line about "showing zeros instead of invented numbers"
  is GONE from this surface.** Printing that sentence above invented numbers
  would have been the one genuinely dishonest thing on the page.
- **Putting it back is deleting one constant.** Remove `DAILY`/`HOURLY`, set
  the tiles to zero, restore the note; nothing else on the surface depends on
  it.

**The range drives the data.** There are three of them and each has its own
series: thirty days, the last seven of it, and that last day hour by hour. The
hourly series sums to exactly the last daily figure, so the ranges agree with
each other and a reader who switches and adds up is not caught out. Switching
range changes all six tiles, the conversion rate and the axis at once — a
dashboard showing month figures under a button marked "24 hours" is the tell
that it is a picture rather than a screen.

**The figures roll to their new values and the curve draws itself.** The tiles
hold a NUMBER and a formatter rather than a finished string, because a string
cannot be counted toward; the count runs 760ms on the page's own arriving
curve, and collapses under reduced motion. The curve is keyed on the range so
its draw-in replays, and rests fully drawn.

**Trace the cursor before believing the path.** Sampling `.zn3-cursor` every
140ms through a run and drawing the result over a screenshot is the only way
to see what it actually does. It caught this: the tiles were visited far-left
then far-right, which is an eight-hundred-pixel dash straight across all six
with a climb back up to the pill after it. The tiles go in reading order now,
right to left, and the path never doubles back over itself. Eight stops in
twenty-four seconds, two of them clicks, the longest hold five seconds.

**The path is 7 أيام, then البحث, then 24 ساعة, then الجلسات** — a control,
then something to read, then a control, then something to read. That
alternation is what stops it reading as a tour of the buttons.

**البحث is a real tab with a real panel behind it**, showing what the product
shows an account that has not connected Search Console, verbatim. It is worth
having: it is the one screen in the section that still says "بيانات حقيقية من
جوجل مباشرة" and means it. The tiles stay put across tabs exactly as they do on
the real dashboard, which is why the second range change is visible from the
search tab at all.

**The chart is READ, not looked at.** The cursor runs along the curve right to
left and the crosshair follows it — the line, the dot on the point, and the
reading, exactly as `TrendChart` raises them on a real pointer. This turned the
longest hold in the run, five seconds resting on the chart, from its only idle
moment into the beat that shows what the chart is for: nobody stares at a
chart, they run along it.

The stops are invisible anchors at the real curve points, so the cursor travels
to them through the same engine as every other target rather than through a
second mechanism that would have to be kept in step with it. Two things the
reading had to learn:

- **It moves out of its own way.** Pinned to the top of the plot, a peak put
  the tooltip exactly over the dot it belonged to. It goes to the foot when its
  point is in the top of the plot.
- **Clamp in MIXED units, not per cent.** The reading is centred on its point,
  so what has to stay inside the plot is half its own width, which is a fixed
  number of pixels. A percentage clamp that holds on a thousand-pixel chart
  lets it hang out of a two-hundred-and-seventy-pixel one — measured, 15px
  outside on a phone. `clamp(76px, X%, calc(100% - 76px))` takes both units and
  one rule covers every width.

**One control, and then time to look.** The run used to work seven of them in
twenty-six seconds — ranges, the site select, the metric, the export menu — and
a cursor hopping between buttons is not somebody using a dashboard, it is
somebody demonstrating that the buttons exist. Nothing stayed on screen long
enough to read. There is one change now, a week to a day, and the cursor moves
OFF the control while the numbers roll and the curve redraws, because that is
what the reader is meant to be watching.

The rule itself still stands everywhere else on this page and in the product —
ratings, review counts and the services wizard's empty rating field are all
still left alone. This is a recorded exception on one marketing surface, not a
change of policy.

The paragraph below describes the version that was replaced, and is kept
because it is the argument for going back:

**التحليلات — the surface that cannot carry a figure, and says so.** There is
no real number for a business that does not exist and `/api/analytics` is
behind a session, so this shows the state a site published today is genuinely
in: the real six tiles in the real order reading `0` and `—`, the dashboard's
own Delta with no baseline ("— جديد", because "+100%" against nothing would be
a lie), the chart's own empty line, and the dashboard's own sentence about
showing zeros **بدل أرقام مُختلَقة**, verbatim. The refusal is the point rather
than a shortfall: every competitor's marketing shot has an invented number on
it. The beat is the owner working the real controls — ranges, the site select,
the metric, the export menu and its seven real datasets — and then reading the
line that explains the zeros.

**SEO — its own centrepiece, and it invents nothing.** The Google result and
the share preview are both written from the fields as they are typed, and the
character counters are counting characters the reader is watching arrive
(`38/60`, `100/160`, from `SEO_TITLE_MAX` / `SEO_DESC_MAX`). **The SERP card
keeps its own colours** — white, `#1a0dab` — and is the single surface in the
section that does: recoloured to the accent it would stop being a preview of
anything, and the preview is the whole reason the screen exists.

### The rule the three runs share

**The cursor rests on the RESULT, never on the control that caused it.** Every
one of the three broke this the same way before it was traced:

- analytics parked on the range pill while the figures rolled elsewhere;
- bookings sat on the submit it had just pressed while the reservation appeared
  on the other half of the screen — the reader is looking at the wrong side —
  and then ended with six seconds on a filter chip;
- SEO already did it right, and is why the pattern was noticeable: it ends on
  the Google preview rather than the save button.

Traced afterwards: bookings went from 12 stops and 2628px of travel to 9 and
2220, and its longest hold moved from a filter chip to the row itself.

**Trace before believing.** Sampling `.zn3-cursor` every 140-200ms through a
run and drawing the path over a screenshot is the only way to see what an
animation does. Reading the code will not show it — all three of these runs
were written by someone who thought they were fine.

### What this section learned

- **`className="ring"` is a Tailwind utility.** A bare semantic class name can
  collide with the global stylesheet: `ring` paints
  `box-shadow: 0 0 0 3px rgb(59 130 246 / .5)`, so the empty state's icon wore
  a blue focus ring that no computed style of mine explained. Renamed to
  `disc`. The bare utilities worth avoiding as class names are `ring`,
  `border`, `shadow`, `blur`, `filter`, `transform`, `transition`, `outline`,
  `block`, `flex`, `grid`, `table`, `container`, `truncate`, `visible`,
  `hidden`, `static`, `fixed`, `absolute`, `relative`, `sticky`.

- **A `min-height` floor turned into a cap, and the fit pass measured the
  frame.** The short surface was given `min-height: 500px` so it would fill the
  window instead of floating in it — and because the measured child is a grid
  item, it then *stretched*: `offsetHeight` 610 while `scrollHeight` was 825,
  so the ratio came back 1, nothing scaled, and the form was sliced off the
  bottom of a phone. This is the trap section two already records ("the child
  must size to its CONTENT, never stretch"), arriving through a different door.
  Two fixes: `align-self: start` on the measured child, and the floor scoped to
  `min-width: 1024px`, where there is actually room for it. **The invariant to
  check is `offsetHeight === scrollHeight` on whatever `.zn-fit` measures.**

- **Match the existing bar rather than inventing one.** Section two's own worst
  fit ratio on a phone is `0.763` (the eight-tile picker). Section three came
  back at `0.739 / 0.786 / 0.583`, so the phone rules trim until all three sit
  at or above it — now `0.762 / 0.786 / 0.797`. What gives up its room is
  furniture, never a label: the share preview is the third card on that column
  and the one the real screen also puts last.

- **Format at render, never at module load.** `(0).toLocaleString("ar")` as a
  module constant is evaluated on the server too, and the Node build here ships
  a small ICU that answers with a different digit than a browser with a full
  one. The dashboard is a client component and formats in the browser, so this
  does too — the demo then shows whatever the real screen would show on that
  same browser, rather than a digit baked at the wrong end.

- **Reconcile per-surface state during render, not in an effect.** An effect
  runs after the paint, so for exactly one frame the new surface was handed the
  previous one's fields — which crashed the SEO screen reading `.trim()` on a
  key the bookings state does not have. The state is held *with* the id of the
  surface it belongs to and reconciled in render instead.

- **The measured numbers.** Verified at 1440×900, 1280×800, 1024×768 and
  390×844, both accents: nothing stretched, nothing cut, no horizontal
  overflow, no page errors, and the cursor inside the window on every surface.
  Fit ratios `0.89`–`1.0` on a laptop and `0.795`–`0.87` on a phone. The deck
  move into the new panel measures level with the existing one — best of three,
  hero→build 63 frames / worst 67ms against build→manage 67 / 33 — so the third
  screen costs the second one nothing. (Dev-build, headed-Playwright numbers,
  not comparable to the 83 recorded above; only the two measured side by side
  are, and that harness is noisy enough that a single reading means little.)

## Section four: انشر

The last of the three words, and the one that closes the arc. ابن makes the
site, ادر runs it, انشر puts it on the internet under an address somebody can
type. It lives in `app/demo/home/` — `PublishSection.tsx` is the stage,
`publish.tsx` is what it drives — and it is the fourth panel of the same deck,
one more gesture down.

No third set of machinery. The cursor engine and `writeValue` come from
`runner.ts` exactly as ادر takes them; there is one copy of that code on this
page and there goes on being one.

### The colour, and why there is one

**Section four is the page's SECOND deliberate colour, and the only one that is
a whole screen rather than an accent on one.** The argument is the same one
ادر's break rests on, and it is again not an invented palette:

- **What this section is about is a site going LIVE, and the product already
  has a colour for that.** `#15803d` is what the dashboard paints
  منشور · SSL مفعّل, what the site card's مباشر pill is, what the free
  subdomain block is, and what the Pro free-domain banner is. It was on the
  page before this section existed.
- **So the ground is that hue taken down to near-black, and the accent is the
  product's exact value.** `#15803d` as a fill; text and hairlines take the
  lifted stop `#62d391`, because the product value as *type* on this ground
  measures 2.6:1 — the same split ادر makes between `#5e6ad2` and `#97a0ee`.
- **One colour, and it means one.** There is no glow in this section, no second
  wash, no tint on anything else. The only gradient in the whole panel is the
  seam ramp below, and it exists because an edge is a cut.

**The depth was measured, not argued about.** Three were built and reachable at
`?ground=`, the way ادر's accent was: `pine` samples `12,42,30` and `deep` is
darker still. Both are green on a chart and BLACK on a screen — a third
near-black after obsidian is not a colour, it is one more absence of one. The
default samples **`15,53,39`**: thirty-eight points between its green and its
red, which is a green a reader sees from across a room, and still dark enough
that paper type on it measures **12.9:1** and the section reads as serious
rather than as a brand block.

The card material is ادر's `lit` treatment, unchanged, and the three steps of
paper type are ادر's. **The two dark sections are one family and the ground hue
is the only thing that separates them** — giving this one its own card grammar
as well would make it a different product rather than a different room.

### The seam ramps from OBSIDIAN, not from transparent

ادر's panel starts transparent at its own top and lets the deck's paper show
through, because the screen above it really is paper. **The screen above انشر
is obsidian, so that is where its ramp starts.** Left transparent, the ramp
would have shown the deck through — and the deck is paper — putting a white
band across the top of a panel sitting between two dark screens.

Measured mid-move, sampling the column at `x=40` down the whole seam: obsidian
`19,19,22` reaches the green with **a worst single-pixel step of 3 units**.
There is nothing to see.

**"Above the header" has to be measured, not assumed.** The ramp finished at 8%
of the panel first, on the reasoning that ادر's finishes at 10% and shorter is
safer. It is not: the pill sits at `--inset`, twenty-seven rendered pixels down
with thirty-eight more of its own, so it spans roughly y=27 to y=65 on a 900px
window — and a ramp settling near y=72 is **behind** the pill, not above it.
Measured at rest, this panel's top pixel read `19,20,22`, full obsidian, and did
not reach the green until y=70. The screen wore a dark bar across its head and
the pill floated on it.

ادر gets away with a long ramp because it has a light in exactly that band, so
the gradient reads as sky. This panel has no glow at all, so the same ramp reads
as dirt. **A ramp is invisible at rest only if it finishes before the header
starts.**

It is now `2.2%`, which settles by y=20. It can be that short because the step
it hides is small: obsidian to evergreen is 34 units at its widest channel, and
34 units over 20 pixels is under two per pixel. ادر needs ten times the distance
because it is hiding 231.

### The header takes the ground it is standing on

`data-dark={deck >= 2}` was not enough. It is the right switch for the four
things that invert the same way on any dark ground — the mark, the pages, the
separator, the call to action — but it made both dark screens share one grey
glass, and **a neutral pill over a coloured ground reads as a bar belonging to
some other page, floating above this one.**

So the header also carries `data-panel`, which names *which* dark screen it is
on, and each one lifts its own ground by the same step: obsidian `19,19,22` to
`rgba(32,32,38,.72)`, evergreen `15,53,39` to `rgba(28,66,55,.72)`, with the
outer ring taking the ground itself so the pill reads as cut out of the screen
rather than laid on it. Measured, the pill went from a neutral `51,51,67` on the
green to `25,58,49` against an `18,46,36` ground.

It is `data-panel` and not `data-ground` because `.zn4-panel` already spends that
name on the choice of evergreen, and one attribute meaning two things in one
file is how a stylesheet this size starts lying.

### The window moves to its size, it does not snap to it

The window is sized by the page inside it, and that page changes height four
times a cycle. Measured: **+245px** when the results table lands, **+48** when
the bought domain appears under it, **-272** on the change of surface, **+206**
when the published site loads. Every one of them was a single frame wide, which
is not a resize, it is a jolt — and it is the most visible motion defect the
section had.

`height: auto` cannot be transitioned, so the height is **measured off the
content and written as a pixel value** the stylesheet then eases over 520ms on
the page's own curve. The same move `--fit` and the hero's column matrix make,
for the same reason. The fallback is `auto`, so with the script dead the window
still fits its page and simply arrives instantly.

**The loop it would have been.** `.zn4-screen` carried `min-height: 100%`, which
is 100% of the stage, which is what is left of the window — so the content's
height depended on the window's height, and the window was about to be sized
from the content. That is exactly the feedback the fit pass in `runner.ts` is
built to avoid. The `min-height` chain is gone; the content is content, the
window is measured from it, and nothing reads back.

The observer also has to watch an element that **survives a change of surface**.
The screen used to be keyed on the surface id, so it remounted and took its
observer with it; the key moved to a child (`.zn4-in`), which is also where the
entrance animation now lives.

### The switcher belongs to the window

It was a sibling of the window in the stage's column, so it pinned to the top
while the window centred in what was left — and on a short page the two pills
sat **275px clear of the thing they switch**, reading as unrelated furniture. It
is inside the window's box now, so the pair centres together and travels in as
one arrival instead of two. Measured after: a consistent 37px gap at every size
from 1728 down to 360.

### Measure the deck HEADED, or do not measure it

Headless Chromium reports roughly **a third of the frames** for the same move.
The same harness, same build, same three moves:

| | headless | headed |
| --- | --- | --- |
| hero → ابن | 14 frames / 133ms worst | 65 / 50 |
| ابن → ادر | 17 / 100 | 67 / 33 |
| ادر → انشر | 25 / 133 | 66 / 33 |

The headed numbers match what this document already recorded for the first two
moves, and they say the fourth screen costs the deck nothing. The headless ones
say the whole deck runs at fifteen frames a second, which is false, and would
have been filed as a regression in the new section. **Best of three, headed, and
compare the moves against each other rather than against a number in a file.**

### The object is a BROWSER

ادر rises a device that is cut at the bottom, because what it shows is a screen
somebody works on. **What this section shows is an ADDRESS**, so the object is a
browser window — complete, all four corners, with the address bar as the
subject rather than the furniture. The address is state, the cursor types in
it, and what it reads at the end is the domain the reader watched being bought
two beats earlier.

Three sizing traps, all measured, all of which shipped here first:

- **A flex-basis is a WIDTH in a row container.** The window was given ادر's
  `flex: 0 1 var(--app-h)` while sitting inside a row, so a 560px basis with
  shrink brought a 1200px browser back to **408px**. The basis belongs to the
  item in the COLUMN.
- **The shared `.zn-stagebox` centres its children on the cross axis**, which
  makes a flex child shrink to fit — and a window whose width is `100%` of a
  shrink-to-fit box resolves to its own content. That is the same 408px
  arriving through a second door. `align-items: stretch`.
- **The cap belongs to the WINDOW, not to the box holding it.** Fixed at the
  cap, the domains screen filled it and the sites screen left three hundred
  pixels of dead dark under a single card. Moving the cap to the outer box just
  moved the void — that box stayed 660 tall and the short window sat at the top
  of it, measured as **500 empty pixels** under the published site on a tablet.
  The box takes the column; the window is capped and centred in it.

Verified at 1728×1080, 1440×900, 1280×800, 1024×768, 1024×900, 900×700,
768×1024, 430×932, 390×844 and 360×780, on both surfaces: no horizontal
overflow anywhere, the window inside every edge at every size, the cursor
inside the frame at every size, and no page errors.

### The two surfaces

**النطاق — buying the address** (`/dashboard/domains`). The real screen in its
own order: the search card, the Pro free-domain banner in its own words, the
results table with its four real columns, and — once something is taken — the
connected-domain row underneath walking the product's real status ladder,
بانتظار DNS → جارٍ إصدار SSL… → منشور · SSL مفعّل, with its own icons and its
own colour for each rung, lifted for a dark ground.

**النشر — publishing, and then the site** (`/dashboard/sites`). The real card,
its real status pill, its real draft line, its real buttons. The cursor presses
**انشر على زينيا**, the pill turns مباشر with the product's own pulsing dot, the
free subdomain appears where SiteCard puts it — and then the address bar takes
over, the browser goes to `darnoor.site`, and the SITE is on the other side of
it. **That is the payoff this page has owed since ابن**, which shows seventy
seconds of a form being filled in and never the website that comes out.

The published site is the real template's own content in the onyx preset — the
palette the wizard picks one screen up and the same one ادر's booking form is
painted in. **One company, one site, across three screens.**

### The price column is where "invent nothing" was hard

A domain search screen carries three columns of fact: which extensions exist,
whether each is free, and what it costs. The first two are checkable and were
checked. **The third is a number Porkbun answers with at the moment of the
search**, and this page has no session and no right to call that route, so
there is no honest way to print a price on it.

The answer is not to make one up and not to leave the column blank. It is to
show **the search that needs no price**: the six extensions are the first six of
the route's own `BARE_TLDS`, in its order; every *taken* row needs no figure at
all; and both *available* rows are on the cheap list that Pro's free-domain
entitlement covers, so their price cell reads what the real screen reads for
that account — **مجاني · سنة**, which is an entitlement rather than a figure,
and the button reads its real label, احصل عليه مجانًا. The reader sees
availability, sees a price column doing its job, and **no number on that screen
was imagined.**

**The availability is real** and was checked over RDAP on 2026-09-01:
`.store .online .shop .com` registered, `.site` and `.xyz` unregistered. A
domain can be taken between then and now; re-check the six and swap the states
if it matters. That is two minutes of `curl`, and it is why the check date is
written into the file.

**The published site carries no dish photographs, and that is a correction
rather than a shortfall.** `public/demo/restaurant/dish-N.webp` are generic food
pictures pulled down for section two's upload slots, where they are only ever
shown as "some photographs" — they do **not** correspond to this template's
signature dishes. Checked: `dish-1` is a pizza and `signature_dishes[0]` is
hand-dived scallops. A name under a picture of something else is inventing, in
the one way this page never does, so the list is typeset instead — real names,
real descriptions, real prices, correctly paired.

The site card's cover is `room-1.webp`, **not** the picker's own screenshot:
that file is a picture of the restaurant template's live demo, whose hero is
the Unsplash stock this document rules out twice over, so using it would put
that photograph back on the page by the side door.

### What the trace caught this time

**Sampling `.zn4-cursor` every 150ms and reading the path is again the only
thing that showed what the animation does.** Two findings, neither visible in
the code:

- **A move issued in the same tick as the state that renders its target finds
  nothing.** `find` returns null, the cursor does not move, and it costs the
  beat anyway — so after pressing احصل عليه مجانًا the cursor sat on the buy
  button for **nine seconds**, through the entire status ladder. That is the
  longest hold in the run, on a control, which is exactly the rule this page
  keeps. A `wait` before the move is load-bearing.
- **The cursor sat on تحقق من التوفّر for two and a half seconds** while the
  table it had just summoned filled in somewhere else — the reader looking at
  the wrong half of the screen. It moves onto the table as the rows arrive now.

Traced afterwards, النطاق: 6 stops, 2871px of travel, the longest hold **7.5s
on the linked domain row** while the ladder runs — the result. النشر: 8 stops,
2340px, the longest hold **4.2s on the published site**. Neither path doubles
back over itself, and every click is followed by a move OFF the control.

The published site fits the window with **no scroll at all**, so its own header
stays on screen — a scroll to a dish had been cutting the headline in half.

### Open

- ادر shows three surfaces; the editor (`ThemeEditor.tsx`, click-to-edit and
  inline AI rewrite) is the strongest beat not built.
- **The site card cover on انشر is `room-1.webp` rather than the template's
  own screenshot**, which is the right call for this page and does not fix the
  underlying thing: `utils/restaurant/mock-content.ts` still ships the Unsplash
  hero, so it is still what a generated restaurant site shows, still what
  `/demo/restaurant` shows, and still what `public/theme-previews/restaurant.webp`
  is a picture of. A product problem, and not fixed.

### Still on the list

1. **A scroll cue on the hero. This is now the only thing standing between the
   page and a reader.** There is still no affordance anywhere that a second
   screen exists — the body is `overflow: hidden`, the wheel is hijacked, there
   is no scrollbar — and there are **five** screens behind it now. Three of them
   are the whole argument the page makes and the fifth is the footer, which a
   reader has every reason to expect and no way to know is there. Nothing on
   the hero says any of it exists. It is the highest-value item left by a
   distance, and each screen added makes it worse.
2. **The finished site as the payoff for ابن.** انشر now ends on the published
   site at its own address, so the page as a whole does show the output — but
   ابن itself still shows seventy seconds of input and never what comes out of
   it, and it is the section where the gap is felt. `/demo/restaurant` and
   `/demo/services` are live and need no login.

## Section five: the close

The footer, and the fifth panel of the same deck. It lives in
`app/demo/home/FooterSection.tsx`; there is no second file, because there is
no script — no cursor, no device, nothing from `runner.ts` but the fit pass.

**A footer here is a whole screen or it does not exist.** The deck has no free
scrolling at all: the body has been `overflow: hidden` since the hero was one
screen and the wheel is hijacked, so there is no foot of a page for a footer
to sit at. Either it is a panel or there is nowhere to put it.

**It is NOT a fourth word.** The hero cycles three — ابن، ادر، انشر — and there
is no fourth. This screen is where the page comes to rest rather than another
step in the argument, so it carries no display word, no object rising from
below the fold and nothing being demonstrated.

### The ground is ادر's obsidian, and going back to paper was the alternative

Returning to paper closes the loop and is the composition this screen wanted.
It was rejected on the seam, and the arithmetic is the whole argument:

- Evergreen `15,53,39` to obsidian `19,19,22` is **34 units** at its widest
  channel — the same step انشر hides, in a ramp short enough to finish above
  the header pill.
- Evergreen to paper `250,250,250` is **231**, which is what ادر hides, and ادر
  needs **ten times the ramp** to do it. A ramp that long lands a band of light
  in the strip the pill floats in, and reads as sky only because ادر has a
  light sitting in exactly that band. This screen has no glow, so the same ramp
  would read as dirt across its head.

Buying a paper ground would therefore have meant inventing a light for this
panel — adding colour to the page for the sake of a transition, on the one
screen whose whole job is to stop arguing. The obsidian is already on the page,
the two dark sections are already declared one family, and the pill already
knows how to stand on it.

**The ramp is 1.5%, shorter than انشر's 2.2% even though the step is the same
size, and the reason is direction rather than distance.** انشر's band is a
NEUTRAL at the top of a coloured screen; this one is a SATURATED green at the
top of a neutral one, and the eye reads chroma against grey harder than grey
against chroma. Measured on both, a pixel at a time down a 900px panel:

| ramp | settles at | worst single-pixel step |
| --- | --- | --- |
| 2.2% | y=16 | 3 |
| 1.5% | y=12 | 4 |
| 1.0% | y=8 | 6 |

The pill begins at y=27. 1.5% keeps the step invisible, finishes fifteen pixels
clear of it, and takes a quarter off the visible band. 1% is the edge of what
reads as an edge and buys four pixels.

### The header takes a third ground

`data-panel` now names three screens, not two: `manage`, `publish`, `close`.
The footer stands on ادر's obsidian and takes ادر's exact lift, and it is still
listed under its own name rather than folded into `manage` — a panel name that
means two panels is the same lie `data-ground` would have been, in a smaller
place.

### The card is the reference, translated rather than copied

The composition came in as a Tailwind footer: a `rounded-[40px]` black card
with a white rim, a top-down white wash, four columns, and a bottom bar over a
hairline. Four things had to change to be this page:

- **No drop shadow.** The reference stacks three. Elevation here is stacked
  hairline rings, and the card takes ادر's `lit` material unchanged — bright
  along the top edge, fading down, obeying a light that comes from above.
- **The card is LIGHTER than its ground, not darker.** `bg-black/80` is a dark
  card on a dark page; on this page a surface lifts off its ground the way
  ادر's window lifts off obsidian, so it is `rgba(250,250,250,0.028)` over
  `#131316`.
- **The wash is a LAYER, not a background.** Painted into the background it
  mixes with the hairline and the hairline stops being one. It is its own
  absolutely-positioned span, strongest at the top and gone by 62%.
- **No tracking on the headings.** The reference letter-spaces its uppercase
  labels. Arabic has no upper case and its letters connect, so tracking a
  heading pulls the joins apart — the hero's own rule, arriving at a
  twelve-pixel label.

The one rule drawn across a surface is the hairline above the bottom bar, and
it is the same exception the header pill already carries: a line INSIDE a
surface, never one across the page.

### The signature

Every other screen on this deck stands a display word behind its object. This
one has none, so what stands behind it is the name — `ZenyaMark` at
`min(74%, 660px)`, paper at `opacity: 0.11`.

It is not decoration and it is not a second claim: it is the real footer's own
device, where the mark is stretched across the foot of the page, and it says
nothing. **Without it the card floats dead centre in an empty screen and reads
as a card rather than as the end of something** — measured, 310px of card in a
900px screen with 300 above it and 260 below.

Faded as a LAYER, never as alpha in the colour, for the reason section two
records: the mark is 27 rectangles that meet at their edges, and a
semi-transparent fill composites every one of those seams twice.

### The signature and the card are ONE measured object

`.zn5-stack` is what `.zn-fit` measures — signature, gap and card together — so
the fit pass scales the composition rather than the card alone and the two
cannot drift apart on a small screen. The invariant the fit pass needs is
`offsetHeight === scrollHeight` on whatever it measures, and it holds at every
size.

**The bar is section two's own worst ratio, 0.763.** At 900x700 this
composition first measured **0.751**, under it. Two things were wrong with the
narrow layout and only one of them was size: below 900px the signature and the
gap came down (furniture, never a label), which reached 0.768 — and then the
LISTS went from two columns to three, which is what actually fixed it. Three
lists side by side fit down to about 640, and the stack came from 924 to 678 at
that window. **Fit is now 1 at every size measured**, so nothing on this screen
is scaled at all.

**Two columns was a tablet bug, not only a height one.** At 768x1024 the three
lists paired up, قانوني sat alone in the right cell, and 170px of card was dead
beside it. A phone footer looks like that everywhere and a tablet must not, so
the two-column rule moved down to 640 where a phone actually needs it.

### Nothing on it is invented

- Every `href` was checked against the app tree: thirteen links, all built.
- The address is `support@zenyaai.co`, which is the one the product already
  answers on.
- The company line is the real footer's own — تُدار كمؤسسة فردية هولندية — and
  the year is formatted at render rather than at module load, for the ICU
  reason section three records.
- The sentence in the brand column is **the page's single claim**, not a second
  one written for the foot of it, followed by the real footer's own description
  of what the product does.
- The three social accounts are the three the real footer links.

### Measured

Verified at 1728x1080, 1440x900, 1280x800, 1024x900, 1024x768, 900x700,
768x1024, 430x932, 390x844 and 360x780: nothing stretched, nothing cut, no
horizontal overflow, everything inside every edge, and no page errors. Fit
comes back `1` at every one of them (`0.999` on the tablet, which is the same
thing rounded), so the fit pass is a guard here rather than a lever — it exists
because the invariant has to hold, not because anything needs shrinking.

**The move, headed, best of three** — and headed is the only way, for a reason
worth adding to the one this document already records: the Browser pane freezes
`requestAnimationFrame` while it is hidden, which stops CSS transitions AND
**ResizeObserver callbacks**, so every fit ratio read through it comes back `1`
whether it should or not. A composition that overflows its screen by a quarter
measures as fitting perfectly.

| | frames | worst |
| --- | --- | --- |
| hero to ابن | 58 | 217ms |
| ابن to ادر | 56 | 166 |
| ادر to انشر | 61 | 147 |
| انشر to the close | **64** | **83** |

The new move is the best of the four. The fifth screen costs the deck nothing.

**The rest state was verified twice over:** a page that has never travelled to
the fifth panel has no `data-run` written anywhere, and the card, the
signature, the brand block and the bottom bar all read `opacity: 1` and
`transform: none` — as does the same page under
`prefers-reduced-motion: reduce`, before and after arriving.

## Working notes

- **Check localhost after every change.** Reasoning about this layout has been
  wrong more often than measuring it. The browser pane used for checking never
  advances CSS transitions, so states can be verified but motion cannot.
- **Editing this file auto-deploys.** A Write/Edit marks a deploy and the Stop
  hook ships `vercel --prod` from the local tree, so fetch and merge origin
  first or the deploy reverts production.
- **If the page renders as raw unstyled HTML**, the dev server's `.next` cache
  has corrupted (`Cannot find module './NNNN.js'`, or `UNKNOWN: unknown error,
  open .next\static\chunkspp\layout.js`). Stop the server, delete `.next`,
  restart.

  **The cause was the deploy hook, and it is fixed.** `.vercelignore` did not
  exclude `.next`, so every turn-end `vercel --prod` walked and uploaded the
  dev cache at the moment the dev server was writing to it. On Windows that
  fails with the UNKNOWN error above and leaves the cache broken, which is why
  this kept happening right after a deploy and cost a six-minute rebuild each
  time. Vercel builds from source on its own builders and never needs the
  directory. `.next` is in `.vercelignore` now.

- **Never run two dev servers.** The second one takes port 3001 and both then
  write to the same `.next`, which corrupts it the same way. If a start says
  "Port 3000 is in use, trying 3001", stop it: something is already serving.
- **The dev server is what to check, not `next start`.** Port 3000 has been
  found serving a stale production build more than once; hashed chunk names in
  the HTML (`webpack-<hash>.js`) are the tell. Dev and start cannot share
  `.next` — stop one before starting the other.
- **The route is slow to compile.** Fifty `next/font` families means the first
  request after a cold start can take minutes, and next/font will retry Google
  three times before giving up. Warm it with `curl` before driving the page, or
  a browser will fire its gesture before React has hydrated and nothing will
  move.
