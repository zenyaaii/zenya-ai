# Zenya — project instructions for Claude

## Design & styling: always use the Taste skill (`design-taste-frontend`)

An anti-slop frontend skill is installed at `.claude/skills/design-taste-frontend`
(→ `.agents/skills/design-taste-frontend/SKILL.md`). **Use it automatically —
without being asked — whenever the work touches visual design.**

**Always load and follow it for** any styling/layout/UI work on the design-facing
surfaces:
- the public site (`app/(site)/**`, `components/zenya/**`)
- the generated site templates (`components/theme/**`, restaurant/atlas/lookbook/wellness/studio/services/storefront, and their previews)
- any new landing page, portfolio, hero, or redesign

How: at the start of such a task, read the SKILL.md and apply it — state the
one-line "Design Read", set the three dials (VARIANCE / MOTION / DENSITY) from the
brief, and honor its anti-slop rules (no AI-purple gradients, no generic centered
3-card hero, no default Inter+slate, real design systems when applicable).

**Scope caveat (from the skill itself):** it is built for landing pages,
portfolios, and redesigns — **not** dashboards, data tables, or dense product UI.
For internal dashboard surfaces (`app/(app)/dashboard/**`, `components/dashboard/**`,
`components/app/**`) apply only its *universal* principles (kill AI-slop aesthetics,
good typography/spacing, restrained motion) — do **not** impose its high-variance /
cinematic-motion presets there; that UI is intentionally dense and utilitarian.

If a design task is ambiguous, follow the skill's rule: state the design read and
proceed; ask at most one clarifying question only when the direction genuinely
diverges.

## Where the public site lives

The house style recorded in `docs/zenya-hero-style.md` is the live site. It is
laid out in two halves and the split is load-bearing:

- **`app/(site)/**`** — every public page. The group's layout renders nothing.
  Each page draws its own chrome by wrapping its content in
  `components/zenya/chrome/Shell`, which supplies the header pill, the token
  block and the obsidian footer cap. **Do not mount a Navbar or a Footer in
  `app/(site)/layout.tsx`** — it would stack a second set on top of the one
  every page already draws.
- **`components/zenya/**`** — the views those pages render, one directory per
  surface, plus `chrome/` for the shared header, tokens, marketing CSS and
  parts. Note that `components/site/` is something else entirely: the runtime
  for the sites Zenya *generates* for customers. Keep them apart.

`app/(main)/**` is the **product**, not the marketing site: the `/settings` and
`/account` redirects, the auth callbacks, the Shopify one-product builder at
`/build`, and the seven generator wizards under `/theme/new`.

It is on the house style too now. Its layout mounts
`components/zenya/chrome/ProductShell`, which is the tokens and the header pill
and deliberately **no** marketing footer — a generator flow is a form with
somewhere to go next, not a page read to the bottom. `ProductShell` roots a
`<div>`, not a `<main>`, because every page under `(main)` renders its own.

The old `components/Navbar` and `components/Footer` are **gone**; nothing
imports them. A page moving between the groups swaps `ProductShell` for `Shell`
or the reverse — `Shell` adds the obsidian footer cap and the reveal observer,
which is what separates a public page from a product one.

**One token layer feeds all of it.** `components/app/tokens.ts` exports
`PRODUCT_TOKENS_CSS`, scoped to `.zy-app, .zy-tokens, .zx-root`, and it is what
`--background`, `--surface`, `--card`, `--muted`, `--border`, the status triad
and the elevation rings resolve to on every product surface. The dashboard
stylesheet composes it; so does `ProductShell`; so does the cookie banner, which
is mounted in the root layout and is inside no shell at all. If a surface is
painting the old cream, it is outside those three selectors — add `.zy-tokens`,
do not write a fourth copy of the palette.

**Metadata lives in the route, not the view.** Every promoted page kept its
original `layout.tsx` — title, description, canonical, hreflang and JSON-LD —
and those files are the reason the restyle did not cost the site its search
presence. When you edit a page under `app/(site)`, leave its `layout.tsx`
alone unless the change is specifically about metadata.

**Data modules do not live inside route folders.** `lib/faq-data.ts`,
`lib/pricing-faqs.ts` and `lib/why-copy.ts` were once
`app/(main)/faq/faq-data.ts` and friends, and every importer broke the moment
their route group moved. New shared content goes in `lib/`.

## `demo.zenyaai.co` is retired

The subdomain held the candidate set while the restyle was under review. That
set is the site, so a second host was being kept correct for three pages. It is
gone: **every path on `demo.zenyaai.co` now 307s to the same path on the apex**,
and `DEMO_SUBDOMAIN_PAGES` no longer exists. There is no registration step when
you add a page under `app/demo/` any more — it is reachable at
`zenyaai.co/demo/<segment>` the moment the route exists.

The three pages themselves are **not** retired. They are the surfaces that are
not pages of the public site, and they keep the addresses they always had:

- `zenyaai.co/demo/dashboard` — the dashboard against fixture data, so it can
  be looked at without an account
- `zenyaai.co/demo/editor` — the theme editor, likewise
- `zenyaai.co/demo/build` — the restyle proposal for the restaurant wizard at
  `/theme/new/restaurant`. It is a public route, so it cannot reach the
  generator it proposes for; its last step is a review that hands the reader to
  the real builder

`RETIRED_DEMO_SEGMENTS` in `middleware.ts` is the only trace left, and it exists
for one reason: `demo.zenyaai.co/dashboard` was an alias for `/demo/dashboard`,
so an old link has to be mapped back rather than handed to the apex as
`/dashboard`, which is the real logged-in dashboard.

The generated-site theme previews — restaurant, atlas, lookbook, wellness,
studio, services, collective, sufra, thread, ribbon, and the storefront at
`/demo` — are unaffected. They preview what the product *generates*, not
Zenya's own site, and they were never on the subdomain.

## Two documents to read before large work here

- `docs/zenya-site.md` — what was built, the tokens, what the forms call, the
  rendering traps (ZoomLock's `zoom: 0.85` means every floor is held in
  *rendered* pixels), and the honesty rules.
- `docs/zenya-theme-check.md` — the audit, what each gate measures, and the
  measurement traps that make a harness lie. The harness itself is
  `scripts/theme-check.cjs`; run it against a dev server.
