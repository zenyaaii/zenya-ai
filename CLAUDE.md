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

`app/(main)/**` is what has not been restyled yet: the `/settings` and
`/account` redirects, the auth callbacks, the Shopify one-product builder at
`/build`, and the generated-theme previews under `/theme/new`.
It still mounts the old `components/Navbar` and `components/Footer`. A page
moved out of `(main)` and into `(site)` loses that chrome and must gain
`Shell`; a page that keeps the old chrome must stay in `(main)`.

**Metadata lives in the route, not the view.** Every promoted page kept its
original `layout.tsx` — title, description, canonical, hreflang and JSON-LD —
and those files are the reason the restyle did not cost the site its search
presence. When you edit a page under `app/(site)`, leave its `layout.tsx`
alone unless the change is specifically about metadata.

**Data modules do not live inside route folders.** `lib/faq-data.ts`,
`lib/pricing-faqs.ts` and `lib/why-copy.ts` were once
`app/(main)/faq/faq-data.ts` and friends, and every importer broke the moment
their route group moved. New shared content goes in `lib/`.

## What `demo.zenyaai.co` is for now

It served the candidate set while the restyle was under review. That set is
the site, so the subdomain is down to three entries in `DEMO_SUBDOMAIN_PAGES`
in `middleware.ts`:

```ts
const DEMO_SUBDOMAIN_PAGES = new Set([
  'dashboard', 'editor', 'build',
])
```

`dashboard` and `editor` are product surfaces that normally sit behind an
account, rendered against fixture data so they can be looked at without
signing in. `build` is the one candidate that did **not** go live: it restyles
the restaurant wizard at `/theme/new/restaurant`, not the Shopify builder at
`/build`, and the wizard it proposes for runs a generator a public route
cannot reach. Everything else on that host 307s to the apex, which is now the
right answer rather than a fallback — a former candidate address lands on the
page it became.

**If you add a page under `app/demo/`, register its segment in that Set in the
same commit.** An unregistered segment 307s to the apex, so from the owner's
side the page simply does not exist. The segment is the directory name under
`app/demo/`.

**The standing exception:** the generated-site theme previews — restaurant,
atlas, lookbook, wellness, studio, services, collective, sufra, thread, ribbon,
and the storefront at `/demo` itself — are deliberately NOT on the allowlist.
They preview what the product *generates*, not Zenya's own site, and they keep
their addresses under `zenyaai.co/demo/*`.

## Two documents to read before large work here

- `docs/zenya-site.md` — what was built, the tokens, what the forms call, the
  rendering traps (ZoomLock's `zoom: 0.85` means every floor is held in
  *rendered* pixels), and the honesty rules.
- `docs/zenya-theme-check.md` — the audit, what each gate measures, and the
  measurement traps that make a harness lie. The harness itself is
  `scripts/theme-check.cjs`; run it against a dev server.
