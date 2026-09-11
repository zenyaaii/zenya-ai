# The Zenya site — full handoff prompt

Paste this whole file into a fresh session to pick up the work. It is written
to stand alone: it assumes no memory of the sessions that built it.

---

## What this is

Zenya is an Arabic AI website builder. Its own marketing site was restyled to
the house style recorded in `docs/zenya-hero-style.md`.

The restyle was built as a **candidate programme**: every page shipped first as
a proposal at `app/demo/<segment>/`, reachable at `demo.zenyaai.co/<segment>`,
so the owner could compare it against the live page before anything changed.
**That programme is finished.** The candidates are the site now — they were
promoted into `app/(site)/` and they answer at the apex. What follows describes
the site as it stands, and records the promotion, because the shape of the
codebase is the shape that promotion left behind.

The branch is `claude/new-session-n23qqt`. Never push to `main`.

## The house style, in one line

Typeset terminal on white paper, lit from the edges. Flat `#fafafa` ground,
near-black Arabic type at display size, hairline rings instead of drop
shadows, and the only colour in the composition is blurred light bleeding in
from the top and bottom edges.

Tokens (shared via `components/zenya/chrome/tokens.ts`):

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
- **No rules or dividers** across the page. Two exceptions, both a hairline
  *inside* a surface: the separator in the header pill, and the one above the
  footer's legal line.
- **The page is achromatic.** All colour belongs to the edge light.
- **No gradients** except the light itself and the lit face of a key (the
  `.sb` button faces). `.gradient-text` is neutralised in
  `chrome/marketing.ts`; if a component brings its own, kill it there.
- **No letter-spacing on Arabic, ever — negative or positive.** Arabic
  letterforms join; tracking pulls the joins apart. And no
  `text-transform: uppercase` on Arabic: it has no case, so the rule only ever
  fires on a Latin string that wandered in.
- **No em-dashes introduced into new copy.** Editing the product's *existing*
  copy to remove its dashes is also wrong — the ban is on introducing them.

## Where the code lives

- **`app/(site)/**`** — every public page. The group's layout renders nothing,
  because each page draws its own chrome. Mounting a Navbar or Footer there
  would stack a second set on top.
- **`components/zenya/**`** — the views those pages render, one directory per
  surface, plus `chrome/` for the shared Shell, Header, tokens, marketing CSS
  and parts. `components/site/` is something else entirely — the runtime for
  the sites Zenya *generates* for customers. Keep them apart.
- **`app/(main)/**`** — what has not been restyled: the `/settings` and
  `/account` redirects, the auth callbacks, the Shopify one-product builder at
  `/build`, and the generated-theme previews under `/theme/new`. It still
  mounts the old `components/Navbar` and `components/Footer`.

The grid frame is the load-bearing layout pattern. Content sits in a reading
column; anything that must break out gets `.zx-wide` rather than a negative
margin:

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

## The routes

`/` · `/about` · `/faq` · `/features` · `/pricing` · `/themes` · `/websites` ·
`/websites/[slug]` · `/compare` · `/compare/[slug]` · `/why/[type]` ·
`/privacy` · `/terms` · `/cookies` · `/refund` · `/subprocessors` ·
`/contact` · `/login` · `/review` · `/checkout`

**Metadata lives in the route, not the view.** Every promoted page kept its
original `layout.tsx` or had its original metadata block restored from the
file the promotion deleted — titles, descriptions, keywords, canonicals,
hreflang pairs, JSON-LD. That is the reason the restyle did not cost the site
its search presence. Leave those alone unless the change is about metadata.

**Data modules do not live inside route folders.** `lib/faq-data.ts`,
`lib/pricing-faqs.ts` and `lib/why-copy.ts` were once
`app/(main)/faq/faq-data.ts` and friends; every importer broke the moment
their route group moved.

## What the forms actually do

The candidates validated with the product's real rules and then stopped at the
door — the only honest thing a public proposal could do. They are wired now:

- **`/contact`** → `POST /api/contact`. Five topics; a review is refused here
  because the intake refuses one with no stars, and the topic links to
  `/review`.
- **`/review`** → `POST /api/reviews` (the row is written first, and a failure
  there stops everything), then `/api/contact` for the thank-you code, then
  `/api/promo-codes` best-effort, which 401s for a guest.
- **`/login`** → `supabase.auth.signInWithPassword`, `signUp`,
  `resetPasswordForEmail`. It shares the accounts portal's `zenya_accounts`
  store, capped at four. `?next=` is confined to a path on this origin.
- **`/checkout`** → renders the summary, then a server action in
  `app/(site)/checkout/actions.ts` creates the Stripe session and returns its
  URL. The action re-runs every check the page ran, because an action is a
  public endpoint.

`?mode=`, `?topic=` and `?next=` are read **on the server** and passed down as
props. `useSearchParams` needs a Suspense boundary, and a suspended subtree
carrying a page's inline `<style>` blanks the whole page on a client-side
navigation — which is exactly what the header CTA does from every other page.

## The one candidate that did not go live

`app/demo/build` restyles the **restaurant wizard** at
`/theme/new/restaurant`, not the Shopify one-product builder at `/build`. It
was filed under the wrong name and the promotion nearly took that at face
value. It stays a proposal because the wizard it proposes for sits behind an
account and runs the generator, which a public noindex route cannot reach.

`demo.zenyaai.co` is down to three entries in `DEMO_SUBDOMAIN_PAGES`:
`dashboard`, `editor`, `build`. Everything else there 307s to the apex, which
after the promotion is the right answer — a former candidate address lands on
the page it became.

## The rendering work — what was wrong and what fixed it

The owner reported the mobile editing sheet as laggy and the Arabic as
"pixeled, not deep". Three compounding causes, all measured:

**1. Greyscale antialiasing forced app-wide.** Tailwind's `antialiased`
utility on `<body>` was overriding the `html` rule from a more specific
selector. Greyscale AA thins stems by about half a pixel, which destroys i'jam
dots and letter joins at small sizes. Fixed by removing it and setting
`-webkit-font-smoothing: auto`.

**2. Fractional device pixels.** `components/ZoomLock.tsx` writes CSS
`zoom: 0.85` on the document element **always**, so an integer CSS translate
lands on a fraction of a device pixel. The sheet rested at top `533.756`.
Fixed by snapping in **device** space — `round(v * zoom) / zoom` — and
self-correcting after every spring settles.

**3. Type below the floor.** 14.5px CSS × 0.85 = 12.32px rendered, under the
12px floor.

**The ZoomLock corollary, which governs every surface in this app:** all
floors are held in **rendered** pixels. 38px CSS clears the 32px coarse
tap-target floor. 14.2px CSS clears the 12px type floor.

**The compositor corollary:** text on a permanently composited layer loses
subpixel AA. A permanent `will-change: transform` or an ancestor
`backdrop-filter` is enough. The cookie banner's `backdrop-blur` was removed
for exactly this reason — it is the first Arabic a first-time visitor reads.

## The sheet gestures

```
tap on the grab handle    → full (top), not middle
gentle swipe              → one detent up or down
strong throw              → all the way to full or peek
```

```ts
const PEEK_PX = 84
const FLICK_SOFT = 320
const FLICK_HARD = 1200
const DRAG_STEP_PX = 44
const THROW_FRACTION = 0.45
```

Each tier reads **speed OR distance**, not speed alone: measured velocities
are counter-intuitive (a 300px throw reported −53px/s, a 70px swipe −257px/s).

A pre-existing bug was found and fixed here: when a gesture resolved to the
detent already active, `setDetent` was a no-op, the effect never re-ran, and
the sheet stranded wherever the finger let go.

Verified rest positions at dpr 2 **and** 3: `533 / 242 / 48` exactly.

## Environment traps — read these before writing a test

- **Playwright headless reports `outerWidth ≠ innerWidth`**, so ZoomLock
  computes `0.663` instead of `0.85` and every measurement is wrong:
  ```js
  await page.addInitScript(() =>
    Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
  ```
- **`getBoundingClientRect()` already carries the zoom; `fontSize` does not.**
  A 100px box measures 85 under `zoom: 0.85`, while `getComputedStyle` reports
  the authored `13px` on the same element. Multiply type by the zoom, never
  rects. Getting this backwards scales every number silently and the audit
  still looks like it ran.
- **A transform scales text that `fontSize` still reports at full size.** The
  homepage fits each section to one screen with `scale()`; 12px inside a
  0.885 fit reaches the eye at 9.
- **Google Fonts is unreachable from the sandbox**, so `waitUntil:
  'networkidle'` never settles. Abort those routes.
- **The bundled Chromium may not match Playwright's expected build.** Launch
  with `executablePath: '/opt/pw-browsers/chromium'`.
- **Scripts must run from the repo root**, or `require('playwright')` fails
  with `MODULE_NOT_FOUND`.
- **A synthetic mouse drag in a touch context produces no `pointerup`.** Drive
  gestures with CDP `Input.dispatchTouchEvent`.
- **Two dev servers racing on port 3000** plus a stale `.next` gives
  `Cannot find module './vendor-chunks/framer-motion.js'`.
- **`ch` caps resolve against the element's own font-size.** Put measure caps
  in `rem`.
- **Class-name collisions are invisible until the contrast audit.** A chart
  bar sharing `.zx-bar` with the header pill's inner row painted violet behind
  the navigation and dropped the nav label to 3.85:1.

## Honesty rules that govern this work

- **Never invent testimonials, logos, counts, or ratings.** The review wall
  holds labelled placeholders and says what they are waiting for.
- **Never silently rewrite the product's copy.** If a page needs different
  words, say so.
- Settled company facts (as of 2026-09-09): contact `zenyaai@outlook.com`,
  telephone `+31 6 8450 8903`, KvK `42070030`, BTW still "قيد التسجيل" —
  **do not print a VAT number until the owner gives one**. Entity is Musannef,
  a Dutch eenmanszaak. **The registered street address is deliberately not
  published.**
- **Prices are read from `lib/company.ts`, never retyped.** They were once in
  nineteen places in four shapes, including two structured-data offers that
  publish the number to Google.
- Report what was measured, not what was hoped.

## Known open, and deliberately so

1. **The English edition is paused.** `ENGLISH_ENABLED` is `false` in
   `lib/i18n/config.ts`, so every `/en/*` route 404s and `hreflangAlternates`
   returns `undefined`. The five English legal pages were rendering as bare
   Preflight because `@tailwindcss/typography` was never installed; the plugin
   is installed and registered now, so they are correct for whenever English
   is switched on. They are not live today.
2. **`/build` is the Shopify one-product builder, unrestyled**, in
   `app/(main)` with the old chrome.
3. **Several pages carry their own copy of the header** (`zp-`, `zt-`, `za-`,
   `zr-`, `zc-`, `zl-` prefixes) rather than using `chrome/Header`. It works
   and it is audited, but a change to the header is six edits.
