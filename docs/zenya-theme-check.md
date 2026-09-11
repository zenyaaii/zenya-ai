# The Zenya theme check

The pre-flight audit. Run it over the whole candidate set before anything is
merged or promoted. It is written as a prompt: paste it into a session, let it
run, and take the report.

A check that cannot be measured is not in this document. Every gate below
either passes or names the element that failed it.

---

## Scope

All 23 candidate routes, at five widths: **360 / 390 / 430 / 768 / 1440**.

```
home  pricing  templates  build  access  review  dashboard  contact
about  faq  features  websites  compare  checkout  editor
legal/privacy  legal/terms  legal/cookies  legal/refund  legal/subprocessors
websites/<each slug from lib/template-pages>
compare/<each slug from lib/comparisons>
why/<each type>
```

Plus, separately flagged because they are live code and not proposals:
`/dashboard` (the real one under `app/(app)`) and the editor
(`components/editor/**`).

## The harness — set this up first, it is not optional

`components/ZoomLock.tsx` writes CSS `zoom: 0.85` on the document element
always. Headless Chromium reports `outerWidth ≠ innerWidth`, so ZoomLock
computes `0.663` and **every measurement in the run is wrong**. Stub it
before the first navigation:

```js
await page.addInitScript(() =>
  Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
```

Run the script from the repo root, not `/tmp` — Playwright resolves from cwd
and fails with `MODULE_NOT_FOUND` otherwise.

Read the real zoom once per page and convert every CSS measurement to
rendered pixels before comparing it to a floor:

```js
const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1
const rendered = cssValue * zoom
```

For touch gestures use CDP `Input.dispatchTouchEvent`. A synthetic mouse drag
produces no `pointerup` on a surface with `touch-action: pan-x`.

---

## Gate 1 — no horizontal scroll

At each of the five widths: `document.scrollingElement.scrollWidth` must not
exceed `clientWidth` by more than 1 device pixel.

On failure, report the widest offending element and its computed width — do
not just report the page. The usual causes are a `min-width` on a grid child
that should carry `min-width: 0`, and a `.zx-wide` breakout that escaped its
`full-start / full-end` track.

## Gate 2 — tap targets, in rendered pixels

Every `a`, `button`, `[role="button"]`, `input`, `select`, and `summary` in a
coarse-pointer context must measure **≥ 32 rendered px** on both axes.

`32 / 0.85 = 37.6`, so the CSS floor is **38px**. Anything smaller in CSS
fails before it is measured.

Report `tag.class` and both rendered dimensions. Known failure: three targets
in `PricingFooter` at 89×18.7, 95×16.6 and 29×28.9.

## Gate 3 — type floor, in rendered pixels

No text node under **12 rendered px**. `12 / 0.85 = 14.12`, so the CSS floor
is **14.2px**. Walk text nodes, not elements, so inherited sizes are caught.

Known: the editor sheet was raised from 14.5px CSS (12.32 rendered) to 15.5px
CSS (13.18 rendered) across 34 declarations.

## Gate 4 — Arabic tracking

`letter-spacing` must compute to `normal` or `0px` on every element whose
text contains a character in `؀-ۿ`. **Negative and positive both
fail.** Arabic letterforms join; any tracking breaks the join.

Check the computed value, not the declaration — a Tailwind `tracking-tight`
three ancestors up inherits down.

## Gate 5 — no gradients

`background-image` must not contain `gradient(` on any element except the two
edge-light bars. `-webkit-background-clip: text` paired with a transparent
fill is the same violation wearing a different hat — `.gradient-text` is
neutralised in `_chrome/marketing.ts`, so a survivor means a component brought
its own.

Include `<header>` elements in the selector. A previous run of this audit
filtered "shared chrome" by tag and silently skipped `CompareHero`, which
renders a `<header>` and carried a headline gradient the whole time.

## Gate 6 — contrast, alpha composited

Every painted text colour against its **composited** background. This is the
gate that is easiest to get wrong.

- Resolve `rgba()` against the full ancestor chain, not the immediate parent.
  A previous run reported violet-on-violet as 1:1 because it stopped at the
  first ancestor with a non-transparent background.
- Body text and anything under 18.66px rendered: **4.5:1**.
- Large text (≥ 24px rendered, or ≥ 18.66px bold): **3:1**.
- Non-text UI boundaries that carry meaning: **3:1**.

Known failure: `PricingFooter`, `#7c7c88` on `#19191c` = 4.25:1, twice.

## Gate 7 — class-name collisions

For every class introduced by the candidate CSS modules
(`_chrome/tokens.ts`, `_chrome/marketing.ts`, `_chrome/parts-css.ts`, and
each page's `styles.ts`), confirm the selector matches only what it was
written for.

The specific failure this gate exists for: a chart bar and the header pill's
inner row both used `.zx-bar`, which painted `rgba(94,106,210,0.24)` behind
the navigation and dropped the nav label from 5.18:1 to 3.85:1. Nothing
caught it except contrast.

## Gate 8 — the resting state without JS, and with reduced motion

Load each route with JavaScript disabled and confirm the page is readable:
content present, no element stranded at `opacity: 0` waiting for an arrival
animation that will never fire.

Then load with `prefers-reduced-motion: reduce` and confirm every animation
and transition resolves to its end state immediately — not that it plays
faster.

## Gate 9 — device-pixel rest

For any element that animates on a transform and then stops — the mobile
editor sheet, the preview frame — read `getBoundingClientRect().top` after
the animation settles. It must be a whole number at dpr 2 **and** dpr 3.

Verified good: the sheet rests at 533 / 242 / 48 exactly, all three detents,
both dprs.

Confirm `will-change` returns to `auto` at rest. A permanent `will-change:
transform`, a permanent `transform`, or an ancestor `backdrop-filter` all put
the text on a composited layer, which costs subpixel antialiasing. Known:
the cookie consent banner carries `backdrop-filter: blur(12px)` and loses AA
on its own text.

## Gate 10 — copy, against the live page

Diff each candidate's copy against the live page it proposes to replace.
Every difference must be intentional and listed in the report.

The rule: **the candidate restyles, it does not rewrite.** Truncating a lede,
dropping an English CTA, dropping a closing block, removing an eyebrow,
translating a label, swapping em-dashes for commas — each of those was done
silently in an earlier pass and each had to be reverted. The em-dash ban
applies to *new* copy; the product's own existing copy keeps its dashes.

Verify against `lib/company.ts` rather than against memory: contact
`zenyaai@outlook.com`, telephone `+31 6 8450 8903`, KvK `42070030`, BTW
"قيد التسجيل" — **no VAT number is printed until the owner gives one** — and
no street address anywhere. Flag every price that is retyped rather than read
from `lib/company.ts`; there are at least three.

## Gate 11 — routing

For each segment under `app/demo/`, assert membership in
`DEMO_SUBDOMAIN_PAGES` or a match against `DEMO_SUBDOMAIN_PREFIXES` in
`middleware.ts`. `segment` is the whole path, so `legal/privacy` is the key,
not `legal`.

An unregistered segment 307s to the apex, which does not fail loudly — from
the owner's side the page simply does not exist.

**Expected exceptions, which must stay unregistered:** the ten generated-site
theme previews — restaurant, atlas, lookbook, wellness, studio, services,
collective, sufra, thread, ribbon — and the storefront demo at `/demo`
itself. They are previews of what the product generates, and they keep their
`zenyaai.co/demo/*` addresses on purpose.

Then walk every internal `href` on every candidate and confirm it resolves on
the demo host. A candidate linking to a live-host-only path is a dead link
for anyone browsing the proposal.

## Gate 12 — the build

```
npx tsc --noEmit
npx eslint . -f json
npm run build
```

All three clean. `eslint -f json` rather than the default formatter so the
report can count by rule instead of by line.

Two compile traps that have bitten this codebase twice each, both inside the
CSS-in-template-literal modules:

- **A backtick inside a template literal** — writing a class name in
  backticks inside a CSS string — gives `TS1005`.
- **`{/* */}` in JSX attribute position** gives `TS1005`. Put the comment
  above the element.

---

## The report

One table, one row per route, one column per gate, and a findings list under
it. For each finding: the route, the width, the selector, the measured value,
the threshold, and the fix.

Then three explicit statements, because these are the things a reader will
assume wrongly:

1. **Which findings are pre-existing on `main`** and which the branch
   introduced. Verify by `git stash` or by checking the file out at the merge
   base — do not infer.
2. **Which changed files are live code rather than proposals.** On this
   branch that is the dashboard restyle (`app/(app)/dashboard/**`,
   `components/app/**`, `components/dashboard/**`), the editor refactor
   (`components/editor/**`), and three app-wide files: `app/layout.tsx`,
   `app/globals.css`, `lib/i18n/messages.ts`. These go live on merge. The 23
   candidates do not.
3. **What merging actually publishes.** Merging puts the candidates on
   `demo.zenyaai.co`. It does **not** change `zenyaai.co`. Replacing
   `app/(main)/*` is a separate job that is not on this branch.

## Gates that block, and gates that only report

**Block a merge:** 1, 2, 3, 4, 11, 12. These are correctness — a page that
scrolls sideways, cannot be tapped, cannot be read, breaks Arabic
letterforms, does not resolve, or does not compile.

**Report but do not block:** 5, 6, 7, 8, 9, 10. These are judgement. A
contrast failure inherited from `main` is a real finding and still not this
branch's to fix on the way past — say so, and say where it is.

Never report a gate as passing because it was not run. Say it was not run.

---

## Last run — 2026-09-11, on `claude/new-session-n23qqt` @ `6e1cd16`

Gates 11 and 12 were run in full. Gates 1–10 were **not** run in this pass;
they need the browser harness and are the reason this document exists.

**Gate 11 — routing: pass.**
23 candidate routes under `app/demo/`, all 23 registered. 20 exact entries in
`DEMO_SUBDOMAIN_PAGES`, three prefixes (`websites/`, `compare/`, `why/`)
covering the slug families. No unregistered segment, and no allowlist entry
pointing at a page that does not exist. The ten theme previews and the
storefront at `/demo` are off the allowlist, as intended.

**Gate 12 — build: pass.**
`npx tsc --noEmit` clean. `npm run build` succeeds; `why/[type]` and
`websites/[slug]` prerender their slug sets. `npx eslint . -f json`: 0 errors,
6 warnings — five `react-hooks/exhaustive-deps`, one
`@next/next/no-img-element`.
