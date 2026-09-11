# The Zenya theme check

The audit that stands between a change to the public site and a deploy. Twelve
gates, each one measurable, each one naming the element that failed it.

The harness is `scripts/theme-check.cjs`. Run it against a dev server:

```
npm run dev
node ./scripts/theme-check.cjs /tmp/audit.json
```

A check that cannot be measured is not in this document.

---

## Scope

Nineteen routes, at five widths — **360 / 390 / 430 / 768 / 1440**:

```
/  /about  /faq  /features  /pricing  /themes
/websites  /websites/[slug]  /compare  /compare/[slug]  /why/[type]
/privacy  /terms  /cookies  /refund  /subprocessors
/contact  /login  /review
```

`/checkout` is not in the list: it redirects to `/login` without a session, so
there is nothing to measure until one exists. Audit it by hand when it
changes.

## Before the first gate: make the harness tell the truth

Four things silently scale or hide what is being measured. Each of them, got
wrong, produces a run that looks clean and means nothing. All four are handled
in `scripts/theme-check.cjs`; this is why.

**1. ZoomLock.** `components/ZoomLock.tsx` writes CSS `zoom: 0.85` on the
document element always. Headless Chromium reports `outerWidth ≠ innerWidth`,
so ZoomLock computes `0.663` and every number in the run is wrong. Stub it
before the first navigation:

```js
await page.addInitScript(() =>
  Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
```

**2. Rects already carry the zoom; `fontSize` does not.** Calibrated in the
browser rather than assumed: a `div` declared 100px tall measures **85**
through `getBoundingClientRect()` under `zoom: 0.85`, while
`getComputedStyle().fontSize` on the same element reports the authored
`13px`. So **type is multiplied by the zoom and rects never are.** An earlier
run of this audit multiplied both, reported every target 15% small, and looked
exactly like a real result.

**3. A transform scales text that `fontSize` still reports at full size.** The
homepage lays each section out as one screen and fits it with `scale()` —
`.zn-fit` is `0.885` at 360 and `0.613` inside the build deck. A 12px line
inside a 0.885 fit reaches the eye at 9.03. The type gate multiplies by the
cumulative ancestor transform.

**4. A ground can be a gradient, or a sibling.** Walking ancestors for
`backgroundColor` alone finds nothing opaque under the footer cap, the
SlideButton or the deck's panels — all gradients — falls through to the paper,
and reports white-on-white at 1:1 for every light-on-dark element on the site.
That run produced **131 phantom failures**. And the login page's mode switch
paints its selected pill as a positioned *sibling* of the labels, so the
ancestor walk found only the light track and called white-on-violet 1.1:1.
Both shapes are handled.

Run the script from the repo root (`require('playwright')` fails otherwise),
launch with `executablePath: '/opt/pw-browsers/chromium'`, and abort
`fonts.googleapis.com` — it is unreachable from the sandbox, so
`waitUntil: 'networkidle'` never settles.

## What is deliberately not measured

Three exclusions. Each is in the harness, and each is a judgement worth
disagreeing with out loud rather than burying.

- **Inline links inside a sentence.** WCAG 2.5.8 exempts them, and it has to:
  an inline link inherits the line box of the prose around it, so a 32px
  target on one means a 32px line height on every paragraph that contains a
  link. "In a sentence" is tested as *the parent holds prose beyond this
  link* — a link wrapped in `<bdi>` has no adjacent text node and was being
  reported on every legal page.
- **Anything that cannot be read or tapped**: screen-reader-only text (clipped
  to 1px), cards a swipe stack has marked `aria-hidden` (the ones carrying the
  deck's scale and tilt — the card being read is at scale 1), and anything
  under `pointer-events: none`.
- **Simulated screens.** The homepage draws the dashboard, the publish flow
  and the template wizard inside a laptop and a phone, at the size they are
  inside a laptop and a phone, and marks those subtrees `data-simulated`. They
  are a picture of the product. Holding them to the floors would mean drawing
  the product at a size that stops looking like the product. Before this
  exclusion they were the largest source of findings in every run, with real
  ones buried underneath.

---

## Gate 1 — no horizontal scroll

`document.scrollingElement.scrollWidth` must not exceed `clientWidth` by more
than 1 device pixel. On failure the harness names the widest offending element
and its computed width.

Usual causes: a `min-width` on a grid child that should carry `min-width: 0`,
and a `.zx-wide` breakout that escaped its `full-start / full-end` track.

## Gate 2 — tap targets, in rendered pixels

**Coarse pointer: 32.** `32 / 0.85 = 37.6`, so the CSS floor is **38px**.
**Fine pointer: 24**, which is the WCAG 2.5.8 AA minimum.

The harness emulates touch up to 768 and a fine pointer at 1440. Several
surfaces raise their targets inside `@media (pointer: coarse)`; a run without
`hasTouch` reports those as failures that do not exist on any device that can
tap them.

Where a section is transform-scaled the CSS floor has to absorb that too: the
homepage footer sits inside a `0.885` fit and needs `min-height: 44px` to
clear 32 rendered.

## Gate 3 — type floor, in rendered pixels

No text under **12 rendered px**. `12 / 0.85 = 14.12`, so the CSS floor is
**14.2px** — and the house style's small size is 14.5px, which is why that
number is everywhere. Walk text nodes, not elements, so inherited sizes are
caught, and multiply by both the zoom and the ancestor transform.

## Gate 4 — Arabic tracking

`letter-spacing` must compute to `normal` or `0px` on every element whose text
contains `؀-ۿ`. **Negative and positive both fail.** Arabic
letterforms join; any tracking breaks the join.

Check the computed value, not the declaration — a `tracking-tight` three
ancestors up inherits down. And watch for `text-transform: uppercase` on the
same rules: Arabic has no case, so it only ever fires on a Latin string that
wandered in. Both were live on the footer's column heads, the pricing table's
headers and the template tags.

## Gate 5 — gradients

`background-image` must not contain `gradient(` except on the two edge-light
bars and the lit faces of the `.sb` key buttons, which are a deliberate part
of that control. `-webkit-background-clip: text` with a transparent fill is
the same violation wearing a different hat.

Include `<header>` elements in the selector: an earlier version of this audit
filtered "shared chrome" by tag, silently skipped a component that renders a
`<header>`, and missed a headline gradient for weeks.

## Gate 6 — contrast, alpha composited

Every painted text colour against its composited ground, at the **worst** stop
when the ground is a gradient. Body text and anything under 18.66px rendered:
**4.5:1**. Large text (≥ 24px rendered, or ≥ 18.66 bold): **3:1**. Meaningful
non-text boundaries: **3:1**.

A ground in `oklch`/`oklab` is reported as **indeterminate**, not guessed at.

This is the gate that earns its keep. It caught the primary call to action at
4.03:1 on every page of the site, and it caught a support address rendering
#171717 on a #131316 cap — 1.02:1 — because the footer read five custom
properties it does not declare, and an invalid `var()` is not an error, it is
nothing.

## Gate 7 — class-name collisions

For every class introduced by the style modules (`chrome/tokens.ts`,
`chrome/marketing.ts`, `chrome/parts-css.ts`, and each surface's own
`styles.ts`), confirm the selector matches only what it was written for.

The failure this gate exists for: a chart bar and the header pill's inner row
both used `.zx-bar`, which painted violet behind the navigation and dropped
the nav label from 5.18:1 to 3.85:1. Nothing caught it except contrast.

## Gate 8 — the resting state without JS, and with reduced motion

Load each route with JavaScript disabled: content present, nothing stranded at
`opacity: 0` waiting for an arrival that will never fire. The pages are built
so the hidden half of every animation lives under a class the script adds on
mount, which is why this currently passes with **zero** server-rendered
`opacity:0` across the set.

Then load with `prefers-reduced-motion: reduce` and confirm every animation
resolves to its end state immediately — not that it plays faster.

## Gate 9 — device-pixel rest

For anything that animates on a transform and stops — the mobile editor sheet,
the preview frame — read `getBoundingClientRect().top` after it settles. Whole
number at dpr 2 **and** 3. Verified: the sheet rests at 533 / 242 / 48 exactly.

Confirm `will-change` returns to `auto` at rest. A permanent `will-change:
transform`, a permanent `transform`, or an ancestor `backdrop-filter` all put
text on a composited layer, which costs subpixel antialiasing — half a pixel
of stem weight, which on Arabic takes the i'jam dots with it.

## Gate 10 — copy and facts

Verify against `lib/company.ts`, never against memory: contact
`zenyaai@outlook.com`, telephone `+31 6 8450 8903`, KvK `42070030`, BTW
"قيد التسجيل" — **no VAT number until the owner gives one** — and no street
address anywhere.

**Every price is read, never retyped.** `STARTER_PRICE_USD` /
`PRO_PRICE_USD` / `ENTRY_PRICE_USD` with `usd()` and `usdTrailing()`. They
were once in nineteen places in four shapes, including two structured-data
offers that publish the number to Google.

And no invented proof: no testimonial, no logo wall, no counts, no ratings.

## Gate 11 — routing

Every segment under `app/demo/` is in `DEMO_SUBDOMAIN_PAGES` or matches
`DEMO_SUBDOMAIN_PREFIXES` in `middleware.ts`. An unregistered segment 307s to
the apex, which does not fail loudly — from the owner's side the page simply
does not exist.

**Expected exceptions:** the ten generated-site theme previews — restaurant,
atlas, lookbook, wellness, studio, services, collective, sufra, thread,
ribbon — and the storefront demo at `/demo` itself.

Then walk every internal `href` on every page and confirm it resolves.

## Gate 12 — the build

```
npx tsc --noEmit
npx eslint . -f json
npm run build
```

Two compile traps, both inside the CSS-in-template-literal modules: a backtick
inside a template literal gives `TS1005`, and so does `{/* */}` in JSX
attribute position.

---

## Gates that block, and gates that only report

**Block:** 1, 2, 3, 4, 11, 12 — correctness. A page that scrolls sideways,
cannot be tapped, cannot be read, breaks Arabic letterforms, does not resolve,
or does not compile.

**Report:** 5, 6, 7, 8, 9, 10 — judgement.

Never report a gate as passing because it was not run. Say it was not run.

---

## Last run — 2026-09-11, `claude/new-session-n23qqt`

**Gates 1, 2, 3, 4, 6: PASS**, 95 route×width records, zero findings.

**Gate 5:** 11 distinct gradients, all accounted for — the edge light, the
`.sb` key faces, the footer's sheen, and the palette swatches on the homepage,
which are literally swatches of the light's colours.

**Gate 8:** zero server-rendered `opacity:0` across the set.

**Gate 11: PASS.** Three registered demo segments (`dashboard`, `editor`,
`build`), ten theme previews plus the storefront deliberately off the
allowlist, no unregistered segment, no allowlist entry pointing at nothing.

**Gate 12: PASS.** `tsc --noEmit` clean. `npm run build` succeeds, 138 pages.
`eslint`: 0 errors, 6 warnings — five `react-hooks/exhaustive-deps`, one
`@next/next/no-img-element`.

**Not run:** gates 7, 9 and 10 were not re-measured in this pass. Gate 9's
figures are carried from the session that fixed the sheet.
