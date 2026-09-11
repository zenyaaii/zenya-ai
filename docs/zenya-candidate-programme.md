# The Zenya candidate programme — full handoff prompt

Paste this whole file into a fresh session to pick up the work. It is written
to stand alone: it assumes no memory of the sessions that built the branch.

---

## What this is

Zenya is an Arabic AI website builder. Its own marketing site is being
restyled to the house style recorded in `docs/zenya-hero-style.md`. The
restyle does **not** edit the live pages. Every restyled page ships as a
**candidate** — a proposal at `app/demo/<segment>/` reachable at
`demo.zenyaai.co/<segment>` — so the owner can compare it against the live
page at `zenyaai.co/<segment>` before anything changes.

The branch is `claude/new-session-n23qqt`. Never push to `main`.

## The house style, in one line

Typeset terminal on white paper, lit from the edges. Flat `#fafafa` ground,
near-black Arabic type at display size, hairline rings instead of drop
shadows, and the only colour in the composition is blurred light bleeding in
from the top and bottom edges.

Tokens (all candidates share these via `app/demo/_chrome/tokens.ts`):

| Token | Value | Role |
| --- | --- | --- |
| `--ground` | `#fafafa` | the canvas, and the only background |
| `--obsidian` | `#171717` | all type |
| `--stone` | `#666666` | secondary type |
| `--onyx` | `#131316` | the one dark surface (footer cap, product insides) |
| `--violet` | `#5e6ad2` | accent, only where it carries meaning |
| `--violet-ink` | `#4f5ab8` | accent on light, when contrast demands it |
| `--violet-lift` | `#97a0ee` | accent on onyx |

Radii `28 / 16 / 10 / 999`. Two easing curves, no third.

Rules that hold without exception:

- **Pure `#000` is for logo glyphs only.** Type never gets it.
- **No drop shadows.** Elevation is stacked hairline rings.
- **No rules or dividers** across the page. One exception: the 1px separator
  inside the header pill.
- **The page is achromatic.** All colour belongs to the edge light.
- **No gradients** except the light itself. `.gradient-text` is neutralised
  in `_chrome/marketing.ts`; if a component brings its own, kill it there.
- **No negative letter-spacing on Arabic, ever.** Arabic letterforms join;
  tightening breaks the join. Positive tracking is equally wrong.
- **No em-dashes introduced into new copy.** Editing the product's *existing*
  copy to remove its dashes is also wrong — the ban is on introducing them.

## The shared chrome module — `app/demo/_chrome/`

Every candidate imports from here. Do not re-implement any of it per page.

- `tokens.ts` — `CHROME_CSS`: the token block plus the header pill.
- `Header.tsx` — the header pill and the `useOnDark()` hook, an
  IntersectionObserver watching `.zf` (the footer cap's real class) so the
  pill inverts when it crosses the dark band.
- `marketing.ts` — `MARKETING_CSS`: the full-bleed grid frame, the opening
  block (eyebrow / h1 / lede / actions), `.gradient-text` neutralisation, the
  arrival animation, and the focus ring.
- `parts-css.ts` + `Parts.tsx` — `PARTS_CSS` and the server components:
  `Breadcrumbs`, `Hero`, `CompareTable`, `ChooseBlocks`, `FaqList`, `CtaBand`.
- `Shell.tsx` — the client shell. It takes `children`, so page content stays
  server-rendered; only the chrome is a client component.

The grid frame is the load-bearing pattern. Content sits in a reading column;
anything that must break out gets `.zx-wide` rather than a negative margin:

```css
.zx-wrap {
  display: grid;
  max-width: 76rem; margin-inline: auto;
  grid-template-columns:
    [full-start] minmax(0, 1fr)
    [main-start] min(100%, 34rem)
    [main-end] minmax(0, 1fr)
    [full-end];
}
.zx-wrap > * { grid-column: main-start / main-end; min-width: 0; }
.zx-wide { grid-column: main-start / full-end; }
```

## The candidate set — 23 routes

Registered in `DEMO_SUBDOMAIN_PAGES` in `middleware.ts` (20 exact entries)
plus `DEMO_SUBDOMAIN_PREFIXES = ['websites/', 'compare/', 'why/']`:

`home` · `pricing` · `templates` · `build` · `access` · `review` ·
`dashboard` · `contact` · `about` · `faq` · `features` · `websites` ·
`compare` · `legal/privacy` · `legal/terms` · `legal/cookies` ·
`legal/refund` · `legal/subprocessors` · `checkout` · `editor`

Plus the two slug families: `websites/[slug]` (eight template detail pages)
and `compare/[slug]` (seven competitor pages), and `why/[type]`.

**The registration rule, from `CLAUDE.md`: a new page under `app/demo/` ships
its `middleware.ts` line in the same commit.** A segment that is not on the
allowlist 307s to the apex — from the owner's side the page does not exist.
`segment` is the whole path, so a nested candidate is allowlisted by its full
path (`legal/privacy`, not `legal`).

**The one recorded exception:** the generated-site theme previews —
restaurant, atlas, lookbook, wellness, studio, services, collective, sufra,
thread, ribbon, and the storefront demo at `/demo` itself — are deliberately
**off** the allowlist.
They preview what the product *generates*; they are not candidates for
Zenya's own site, and they keep their addresses under `zenyaai.co/demo/*`.

## The two live-code changes riding on this branch

These are **not** candidates. They edit shipped product surfaces and go live
the moment the branch merges:

1. **The dashboard restyle** — `app/(app)/dashboard/page.tsx`,
   `components/app/*` (`AppShell`, `Sidebar`, `Topbar`, new `Segmented`,
   `chrome-font`, `dashboard-style`), `components/dashboard/**`.
2. **The editor refactor** — `components/editor/**`: `MobileEditor`
   rewritten, `ClickToEditOverlay` + `TapToEditOverlay` replaced by one
   `SectionOverlay`, new `editor-style.ts`, `chrome.tsx`, `env.ts`,
   `PreviewFrame` pixel-snapping.

Plus three app-wide files: `app/layout.tsx`, `app/globals.css`,
`lib/i18n/messages.ts`.

Treat them as a separate review from the candidates.

## The rendering work — what was wrong and what fixed it

The owner reported the mobile editing sheet as laggy and the Arabic as
"pixeled, not deep". Three compounding causes, all measured:

**1. Greyscale antialiasing forced app-wide.** Tailwind's `antialiased`
utility on `<body>` in `app/layout.tsx` was overriding the `html` rule from a
more specific selector, so the whole app rendered with
`-webkit-font-smoothing: antialiased`. Greyscale AA thins stems by about half
a pixel, which destroys i'jam dots and letter joins at small sizes.

Fix: remove `antialiased` from the body class; set
`-webkit-font-smoothing: auto` / `-moz-osx-font-smoothing: auto` in
`app/globals.css`.

**2. Fractional device pixels.** `components/ZoomLock.tsx` writes CSS
`zoom: 0.85` on the document element **always**. An integer CSS translate
therefore lands on a fraction of a device pixel. The sheet rested at top
`533.756`; its labels at `609.241`.

Fix: snap in **device** space, not CSS space —
`round(v * zoom) / zoom` — and self-correct after every spring settles by
reading `getBoundingClientRect().top` and subtracting the residual fraction.

**3. Type below the floor.** 14.5px CSS × 0.85 zoom = 12.32px rendered, under
the 12px floor. Raised to 15.5px CSS = 13.18px rendered across 34
declarations in `editor-style.ts`.

**The ZoomLock corollary, which applies to every surface in this app:** all
floors must be held in **rendered** pixels. 38px CSS clears the 32px coarse
tap-target floor. 14.2px CSS clears the 12px type floor.

**The compositor corollary:** text on a permanently composited layer loses
subpixel AA. A permanent `will-change: transform` or a `backdrop-filter` on
an ancestor is enough to do it. `will-change` is set only while moving and
returned to `auto` at rest.

## The sheet gestures

Three tiers, as the owner asked for them:

```
tap on the grab handle    → full (top), not middle
gentle swipe              → one detent up or down
strong throw              → all the way to full or peek
```

Constants in `components/editor/MobileEditor.tsx`:

```ts
const PEEK_PX = 84
const FLICK_SOFT = 320
const FLICK_HARD = 1200
const DRAG_STEP_PX = 44
const THROW_FRACTION = 0.45
```

Each tier reads **speed OR distance**, not speed alone. Measured velocities
are counter-intuitive — a 300px throw reported −53px/s and a 70px swipe
reported −257px/s — so tuning against velocity alone is tuning against noise.

**A pre-existing bug was found and fixed here.** When a gesture resolved to
the detent already active, `setDetent` was a no-op, the effect never re-ran,
and the sheet stranded wherever the finger let go. Verified present on
pristine `cae5225`. The fix is one spring helper shared by both the effect
and the drag-end handler, called directly when the target equals the current
detent.

Verified resting positions, real CDP touch, at dpr 2 **and** 3:

```
peek (rest)           = 533   whole:true   will-change:auto
nudge  up  12px       = 533
swipe  up  70px       = 242
throw  up 300px       = 48
tap                   = 48
  then swipe down 70  = 242
  then throw down 300 = 533
```

## Environment traps — read these before writing a test

- **Playwright headless reports `outerWidth ≠ innerWidth`**, so ZoomLock
  computes `0.663` instead of `0.85` and every measurement is wrong. Stub it:
  ```js
  await page.addInitScript(() =>
    Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
  ```
- **Playwright scripts in `/tmp` fail** with `MODULE_NOT_FOUND`. Run them
  from the repo root.
- **A synthetic mouse drag in a touch context produces no `pointerup`.** With
  `touch-action: pan-x` on the sheet, nothing after `pointerdown` reaches it.
  Drive gestures with CDP `Input.dispatchTouchEvent`.
- **Two dev servers racing on port 3000** plus a stale `.next` gives
  `Cannot find module './vendor-chunks/framer-motion.js'`. Kill by PID,
  `rm -rf .next`, restart.
- **`ch` caps resolve against the element's own font-size**, so a `30ch` cap
  on a section measures against 16px and breaks a display headline over four
  lines. Put measure caps in `rem`.
- **Class-name collisions are invisible until the contrast audit.** A chart
  bar sharing `.zx-bar` with the header pill's inner row painted
  `rgba(94,106,210,0.24)` behind the navigation and dropped the nav label
  from 5.18:1 to 3.85:1. Namespace every new class.

## Honesty rules that govern this work

- **Never invent testimonials, logos, counts, or ratings.**
- **A demo page never POSTs** and never changes an API, a schema, or a live
  route.
- **Never silently rewrite the product's copy.** If a candidate needs
  different words, say so; do not edit in passing.
- Settled company facts (as of 2026-09-09): contact `zenyaai@outlook.com`,
  telephone `+31 6 8450 8903`, KvK `42070030`, BTW still "قيد التسجيل" —
  **do not print a VAT number until the owner gives one**. Entity is
  Musannef, a Dutch eenmanszaak; Musannef fully owns Zenya AI at
  musannef.com. **The registered street address is deliberately not
  published.**
- Report what was measured, not what was hoped. Only about 20% of text boxes
  rest on a whole device row — that is normal web rendering, not a defect,
  and chasing it would be chasing a metric.

## Known open issues — not fixed, deliberately

1. **`@tailwindcss/typography` is not installed.** `prose prose-neutral`
   compiles to nothing, so the five **live** legal pages render bare
   Preflight right now. This is a live bug, independent of this branch.
2. **`PricingFooter` fails contrast twice** (`#7c7c88` on `#19191c`, 4.25:1)
   and has three tap targets under the coarse floor (89×18.7, 95×16.6,
   29×28.9 rendered).
3. **The cookie consent banner carries `backdrop-filter: blur(12px)`**, so it
   loses subpixel AA on its own text.
4. **`CheckoutError` links to `mailto:support@zenya.app`** — a third address,
   neither `zenyaai@outlook.com` nor `support@zenyaai.co`.
5. **Prices are retyped in three places** (features FAQ, compare summary,
   `AccountSettings.tsx` around line 481) instead of being read from
   `lib/company.ts`.
6. **Marketing-host `/settings`** is cited by privacy and terms as the GDPR
   Article 17 deletion path, and `/account` is orphaned. Both need a decision.

## "Make it live" is two different jobs

This is the thing to be clear about before anything is merged:

**Job one — publish the proposals.** Merging this branch puts 23 candidates on
`demo.zenyaai.co`. The live marketing site at `zenyaai.co` **does not
change**. This is low-risk and is what the branch was built for. The one
caveat is the two live-code changes above, which *do* go live on merge.

**Job two — the actual go-live.** Replacing `app/(main)/*` with the candidate
styling. This is a separate and much larger change: it rewrites the real
routes, their metadata, their sitemap entries and their internal links. None
of that work is on this branch.

Do not conflate them, and do not do job two without the owner saying so
explicitly, page by page.
