# «فاحص بينون» — the site-quality agent

A headless visitor that opens a site the way a customer's customer does (an
iPhone at 390 and a laptop at 1440, Arabic, no account, no preview link), scrolls
every page, and compares what it was given with what it was supposed to get.

It judges against a **reference**, never against taste. The reference is built
from the site's own data (the props the page was rendered from), the template's
rules, and the house design system. Anything the agent calls wrong, it can name
the rule for.

```
lib/qa/                      reference layer (TypeScript, real app code, bundled by esbuild)
  color.ts                   colour parsing (hex/rgb/color()/oklab/oklch/lab/lch), CIE Lab, ΔE2000, blends, WCAG contrast
  design-system.ts           Beynoun's palette and box system, read off components/app/v6/v6.css
  reference.ts               what each template MUST and MUST NOT show, built from a site's props
  flight.ts                  recovers those props from the page's RSC flight data (no DB, no login)
scripts/qa/
  probe.js                   in-page measurement, plain browser JS (works on any site, ours or not)
  agent.mjs                  crawls, judges, writes one JSON per site + summary.json
  wizard.mjs                 gate 6: walks the build wizards in and out (never presses «ابنِ»)
  shared.mjs                 browser context, probe loader, network watcher
  own-pages.json             the beynoun.com pages own mode checks
```

## Running it

Against a live host (the default is production; pass `--base` for a preview):

```bash
node scripts/qa/agent.mjs --url https://hamoudasalon.beynoun.com          # one customer site
node scripts/qa/agent.mjs --sites targets.json --concurrency 4 --google   # many: [{ "slug": "…" }]
node scripts/qa/agent.mjs --own [--only /,/pricing]                       # beynoun.com itself
node scripts/qa/agent.mjs --sites competitors.json                        # [{ "id","url","facts":{name,phone,address,…} }]
node scripts/qa/wizard.mjs [--storage state.json]                         # demo wizards; real ones with a signed-in test account
```

Output goes to `qa-report/<date>/` (ignored by git): `<id>.json` with gates,
findings and the pages it opened, `summary.json`, and JPEG screenshots under
`shots/`. `--google` checks each site against Google Places (rating, phone,
open/closed) using `GOOGLE_PLACES_API_KEY` or `google_places_api_key`, whichever
answers — in the cloud environment the upper-case one is refused by Places (New).

## The gates

| Gate | What it measures | Reference |
|---|---|---|
| 1 Colours | Every painted colour, weighted by area, explained by the site's palette (exactly, or as a blend towards its grounds/ink). Whether the palette is the business's own (`colorOverrides` measured from its photos) or one of ours (stock preset, template default). | `reference.ts` STOCK, `design-system.ts` |
| 2 Design | Horizontal scroll, text under 12 rendered px, Arabic letter-spacing, tap targets (32 coarse / 24 fine), a word broken across two lines inside a button, covered text, contrast (4.5 / 3 large), fixed bars covering the phone screen, font count. In own mode also: boxes outside the v6 box system, gradients. | `docs/zenya-theme-check.md` floors |
| 3 Information | Each fact in the data (name, phone, services, menu items, prices, reviews…) shows on the site; sections that exist without data; forbidden copy; numbers no source backs; content a phone visitor never sees; duplicate pages; template English. Optional Google truth. | `reference.ts` |
| 4 Requests | Pages that do not open, failed requests (ours high, third party low), page errors, hydration mismatches, broken images, preview-host requests, mixed content. | — |
| 5 Actions | WhatsApp/call/map/email links exist and go to the number/address in the data; dead links; unlabelled buttons; every internal link opens. | `reference.ts` actions |
| 6 Entry & exit | Every wizard: steps advance, «السابق» keeps answers, the rail jumps, a reload restores the draft, «رجوع» leaves to a page that opens, the cookie layer does not block «التالي». Probe on every step against the house system. | `wizard.mjs` |
| 7 Fill | How full each section is against a floor per kind (3 services, 8 menu items, 6 photos…). | `agent.mjs` `want` |

Scores are 0–100 per gate; overall weights information 1.5 and actions 1.2.
A finding is one per *kind* of problem per site, with every page it is on and
up to twelve examples; the penalty grows with distinct offenders and is capped.

## Measurement traps (each one produced false reports before it was fixed)

1. **Reveal-on-scroll.** Content is transparent until it enters the screen and
   some fades out again when it leaves. The probe sweeps the page a screen at a
   time first and counts anything opaque at any point as seen. Content that is
   laid out but never opaque on a phone is reported (usually hover-only).
2. **Rotating sets and closed accordions are not hidden content.** A list whose
   on-show item changes within five seconds is rotating; an ancestor clipped to
   nothing is a closed accordion. Both are skipped.
3. **Contrast from the paint stack, not the parents.** A selected tab's pill, a
   badge tint and a card under a floating label are siblings. Ground is read
   from `elementsFromPoint` under the word with `pointer-events` forced on
   (pills are usually `pointer-events: none`), starting at the word's own
   element — anything above it is a bar passing over, not the ground. Words
   still animating are measured at a later stop. Text over a photo is counted,
   not scored.
4. **Covered text.** Measure the word's rect at test time (marquees move);
   ignore words clipped out of their own window; a see-through link stretched
   over a card hides nothing; a card under its neighbour in a fanned deck is the
   deck. The geometric pass only looks at what hit-testing cannot see (SVG
   icons, `pointer-events: none` layers) and never at fixed/sticky layers.
5. **Smooth scroll (Lenis).** `scrollTo` glides; the probe waits until
   `scrollY` arrives before measuring.
6. **`ERR_ABORTED`** is the browser cancelling (lazy frames, page close), not a
   failure.
7. **Latin words the business gave us** (reviewers' names, English reviews) are
   its own; only Latin from the template is reported.
8. **Headline numbers** are backed when the same number appears anywhere else in
   the data or is the length of a list there.
9. ZoomLock (`zoom: 0.85`) — `outerWidth` is stubbed and type is multiplied by
   the zoom, rects are not (see `docs/zenya-theme-check.md`, traps 1–2).
10. **Tabs draw their panel only when pressed.** The restaurant menu shows one
    category and renders the others on tap, so their dishes are in the props but
    not in the DOM. Before facts are compared, the agent presses every in-page
    button group (two or more short sibling buttons outside forms, dialogs, the
    header, the footer and navigation) and counts what each one shows. Customer
    sites have no `<main>`, and a `<button>` with no `type` reports `submit`, so
    neither can be part of the test. Without this, 12 of 14 restaurants were
    reported as hiding their own menu.
11. **A wizard can open on a «مشروعك أيّ واحد؟» sheet.** The walker answers it with
    the first choice that keeps the visitor in the wizard and records where the
    others go. Restaurant stays (`?kind=restaurant`); every wellness choice leads
    to the services wizard and closing returns to `/templates`, which is reported
    as «لا أحد يصل إلى أسئلة العافية نفسها», not as a stuck step.
12. **A rule on one side is a divider, not a box.** A list whose items are
    separated by a top border, over no ground of their own, is reported as a
    section that is not in a box («قسم مفصول بخط»), not as a box with radius 0. A
    capsule (header pill, chip) is the pill shape; its accent edge is how it shows
    it is selected, so its border is not judged.

Checks that only a person had caught before they were added: a word broken
across two lines inside a button («اح / جز» when a long shop name squeezes the
restaurant header; «احج / ز / جلس / تك» when it squeezes the wellness one into
a circle), empty photo frames for dishes without a photo, and a kind picker
whose every choice leaves the wizard.

## Competitors

`facts` for a competitor come from Google Places, never from us: name, phone,
address. Their inner pages are discovered from the home page (menu, category,
product, about, contact first). Gate 7 is not scored for them (we do not know
their data); colour discipline (`colorStats`: distinct colours covering 95% of
the paint) is measured the same way on every site so the two can be compared.

Self-serve sign-up, as of 2026-11-26: Zyda asks for a store link first (like
ours) and then a Kuwaiti WhatsApp number (+965, fixed); Mnasati is a sales form
behind Turnstile and reCAPTCHA. Neither can be completed without a GCC number,
so the comparison is against their live customer sites.

## What it does not do

It never submits a form, presses a final build button, pastes a link into a
wizard (that would scrape and spend), or changes anything. The real wizards are
walked with a disposable test account.
