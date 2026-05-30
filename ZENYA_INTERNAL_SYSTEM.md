# ZENYA AI — INTERNAL SYSTEM & ARCHITECTURE WIKI

> Internal source of truth for what Zenya is, what it generates, how the backend works, and what services the platform is connected to.
> Rebuilt from a direct read of the codebase (not the previous draft). Reflects the current multi-business-type reality.

Runtime: Node `22.x`, Next.js 14 App Router, React 18, Tailwind, Framer Motion.

---

## 1. Core Identity

Zenya AI is an **AI website + theme generator** for commerce and small business.

It started as a **one-product Shopify theme generator**, and has since expanded into a **multi-business-type site generator**. Today the product offers **8 generators**. One of them still produces a downloadable Shopify theme; the other seven produce **AI-written, hosted website previews** on the Zenya domain.

So the accurate one-liner is:

**Zenya turns a product URL or a short business brief into AI-written content rendered as either a downloadable Shopify theme (one-product) or a live hosted website (the other 7 business types).**

---

## 2. The 8 Generators (Business Types)

The entry point is the **Business Type Picker** at `/theme/new` (`app/(main)/theme/new/page.tsx`). Picking a type routes to that type's wizard.

| # | Type (UI name) | Internal id | Input mode | Output | Wizard | Generate route | Preview route |
|---|---|---|---|---|---|---|---|
| 1 | One-Product Store | `one_product` | Product **URL scrape** | **Downloadable Shopify OS 2.0 theme (ZIP)** + Shopify publish | `theme/new/page.tsx` | `/api/scrape` + `/api/generate-content` | `/preview/[id]` |
| 2 | Restaurant (Maison) | `restaurant` | Structured **form** | Hosted React site | `theme/new/restaurant` | `/api/generate-restaurant` | `/preview/restaurant/[id]` |
| 3 | Wellness Studio | `wellness` | Structured form | Hosted React site | `theme/new/wellness` | `/api/generate-wellness` | `/preview/wellness/[id]` |
| 4 | SaaS / Software (Atlas) | `atlas` | Structured form | Hosted React site | `theme/new/atlas` | `/api/generate-atlas` | `/preview/atlas/[id]` |
| 5 | Fashion / Apparel (Lookbook) | `lookbook` | Structured form | Hosted React site | `theme/new/lookbook` | `/api/generate-lookbook` | `/preview/lookbook/[id]` |
| 6 | Catalog Store (Collective) | `collective` | Structured form | Hosted React site | `theme/new/collective` | `/api/generate-collective` | `/preview/collective/[id]` |
| 7 | Brand Story (Studio) | `studio` | Structured form | Hosted React site | `theme/new/studio` | `/api/generate-studio` | `/preview/studio/[id]` |
| 8 | Local Services | `services` | Structured form | Hosted React site | `theme/new/services` | `/api/generate-services` | `/preview/services/[id]` |

**Critical distinction:**

- **One-Product** is the only path that scrapes a URL and produces a **downloadable Shopify theme** and can **publish to a real Shopify store**.
- The **other 7** are **form-driven, preview-only hosted sites**. They are **not Shopify themes**, there is **no ZIP/download**, and **no Shopify publish**. The preview action bar only offers "Edit details" and "Dashboard".

---

## 3. Two Output Models

### Model A — One-Product Shopify Theme (the original)

1. Paste a product URL.
2. `/api/scrape` extracts product data (title, images, prices, highlights, specs, JSON-LD).
3. `/api/generate-content` writes a large conversion-copy object via OpenAI.
4. Content + colors + images saved to Supabase `themes`.
5. Preview rendered by React (`FullScreenPreview` / `ThemePreview`).
6. **Export**: `generateShopifyTheme()` → `generateShopifyThemeV3OneProduct()` builds a Shopify OS 2.0 theme ZIP with JSZip (`ThemeActions` → download).
7. **Publish**: `/api/shopify/themes` creates a Shopify product and stores design JSON in a `zenya.design` product metafield.

### Model B — Hosted Business-Type Sites (the expansion)

Every one of the 7 types follows the **same shape**:

1. A multi-section **form wizard** collects a structured brief (e.g. restaurant: menu, hours, story, reservations, visuals).
2. The wizard `POST`s the brief to `/api/generate-{type}`.
3. The route validates with a zod schema, calls **OpenAI (`gpt-4o-mini`, JSON mode)**, and **merges AI output over a mock fallback** into a strongly-typed content object. On any error / missing key, it returns the mock fallback so generation never hard-fails.
4. The wizard saves to the shared `themes` table with a **`content.business_type`** discriminator (plus `content.style_preset`, the typed content under `content.{type}`, and the raw `content.input`).
5. Redirect to `/preview/{type}/[id]`, which loads the row, checks `business_type`, and renders the type's `*Preview` React component with the chosen style preset.

These sites are **rendered live on the Zenya domain**, not exported.

---

## 4. Per-Type Code Layout (the repeating pattern)

Each business type owns a parallel slice across four folders:

```
utils/{type}/
  input.ts         # zod input schema + RestaurantInput-style TS type (the brief)
  types.ts         # the generated content shape (e.g. RestaurantContent)
  mock-content.ts  # full fallback content (used when AI is unavailable/invalid)
  presets.ts       # style presets: colors, fonts, vibe (4 presets per type)

app/(main)/theme/new/{type}/page.tsx   # the form wizard
app/api/generate-{type}/route.ts        # AI generation + mock-merge + fallback
app/preview/{type}/[id]/page.tsx        # loads theme row, renders preview
components/theme/{type}/*Preview.tsx     # the rendered website component
```

**Style presets per type** (4 each, chosen in the wizard):

- atlas: `orbit`, `midnight`, `aurora`, `carbon`
- collective: `jade`, `dusk`, `pearl`, `iris`
- lookbook: `noir`, `blush`, `earth`, `void`
- restaurant: `onyx`, `trattoria`, `coastal`, `forest`
- services: `cobalt`, `graphite`, `amber`, `emerald`
- studio: `ink`, `gold`, `dusk`, `slate`
- wellness: `zen`, `bloom`, `forest`, `noir`

---

## 5. The One-Product Theme Engine

The Shopify theme builder lives in `utils/`:

- `shopify-generator-v3.ts` — **the active builder**. `generateShopifyThemeV3OneProduct(content, colors)` assembles a complete Shopify OS 2.0 theme in memory (JSZip): `layout/`, JSON templates, header/footer groups, all `v3-*` Liquid sections (hero-video, benefits, featured-product, feature-grid, comparison, social-proof, FAQ, product buybox with bundle radios + sticky ATC, etc.), `config/settings_schema.json` + `settings_data.json`, locales, and a single self-contained `assets/base.css` design system with 4 design directions (`modern-minimal`, `premium`, `editorial`, `shopify-dark`).
- `shopify-generator.ts` — **mostly legacy** (~7.4k lines). Only two parts are live: `mapLegacyContentToV2()` (maps the AI content object → v3's `NovaThemeContent`) and the `generateShopifyTheme()` entry that forwards to v3. `prepareThemeZip` / `prepareThemeZipFromZero` are legacy.
- `shopify-generator-v2.ts` — earlier "from scratch" generator. Superseded by v3; not on the live path.

**Important behavior:** export maps only a **subset** of AI content (brand, hero, features→highlights, testimonials, faq, guarantee). The React preview shows much more (slideshow, timeline, stats, comparison, SEO, pages, policies, cart copy) that is **dropped at ZIP time**. Also, `images` is passed to the builder but **ignored** — the exported theme carries no baked-in product images and relies on Shopify product media.

---

## 6. Backend / API Routes

All under `app/api` (Next.js route handlers). Acts as the orchestration layer.

**Generation**
- `POST /api/scrape` — one-product scraper: tries Shopify `.js` endpoint → direct fetch → ScraperAPI fallback; parses JSON-LD + regex for prices/images; AliExpress/Shopify image cleanup; logs to `scrape_history`.
- `POST /api/generate-content` — one-product AI copy. Time-budgeted (~70s) two-step pipeline: analysis (`gpt-4o-mini`) → content (`gpt-4o-mini`, JSON mode) → model JSON-repair → rich procedural fallback. Heavy normalization (`normalizeGeneratedContent`).
- `POST /api/generate-name` — short premium product name.
- `POST /api/generate-{restaurant|wellness|atlas|lookbook|collective|studio|services}` — per-type AI generation; all use **`gpt-4o-mini`**, JSON mode, zod-validated input, mock-merge fallback.

**Persistence**
- `POST /api/themes` — auth check, free-plan limit (≥3 themes blocks non-subscribers), insert into `themes`. Used by **all 8 types**.
- `GET /api/themes` — current user's themes.

**Billing**
- `POST /api/checkout` — Stripe subscription checkout session.
- `POST /api/webhook` — Stripe webhook → updates `subscriptions`.
- `GET /api/subscription` — subscription state.

**Shopify (one-product only)**
- `GET /api/shopify/auth` — start OAuth.
- `GET /api/shopify/callback` — finish OAuth, store session.
- `POST /api/shopify/themes` — load merchant session, create product, store design metafield, return admin/storefront links.
- `POST /api/webhooks/shopify` — HMAC verify; uninstall/GDPR webhooks.

---

## 7. Persistence & Data Model

### Supabase (Postgres + Auth, RLS on)

All generated work — **every business type** — is stored in one table:

- **`themes`** — `id`, `user_id`, `product_url`, `product_name`, `images[]`, `primary_color`, `secondary_color`, `content jsonb`, `is_published`, `created_at`.
  - For one-product: `content` is the legacy copy object (hero/features/faq/…) plus `price`, `originalPrice`, `shopName`, `stylePreset`, `_preview`.
  - For the 7 site types: `content = { business_type, style_preset, {type}: <generated content>, input: <raw brief> }`.
- `profiles` — synced from auth; `credits` (default 3), `is_subscribed`.
- `subscriptions` — Stripe subscription state (`status` drives Pro gating).
- `scrape_history` — every scrape attempt (one-product).
- `activity_logs`, `brand_assets`, `theme_feedback`, `user_segmentation` — present in schema; light/forward-looking use.

Plans: non-subscribers are capped at **3 themes**; an active/`trialing` subscription = Pro/unlimited.

### Prisma / Postgres (Shopify sessions only)

- A single `Session` model stores Shopify OAuth sessions (`lib/shopify.ts` with a lazy Prisma/file fallback). Unrelated to Supabase.

---

## 8. Preview Systems

There are **two** distinct preview mechanisms:

1. **One-product live wizard preview** — iframe at `/preview/live` synced via `postMessage` (`UPDATE_PREVIEW`) from `components/wizard/MobilePreview.tsx`. Renders `ThemePreview` and updates live as the user changes name/colors/prices/images. The saved one-product preview at `/preview/[id]` renders `FullScreenPreview` + `ThemeActions` (download/publish).
2. **Business-type hosted previews** — `/preview/{type}/[id]` is a full React page that loads the `themes` row, validates `business_type`, and renders that type's `*Preview` component (e.g. `components/theme/restaurant/RestaurantPreview.tsx`) with the selected style preset. This **is** the deliverable for those types.

---

## 9. External Services

- **OpenAI** — all copy generation, every business type, model `gpt-4o-mini` (JSON mode). Plus one-product naming.
- **Supabase** — auth, theme storage, subscriptions, history.
- **Prisma + Postgres** — Shopify session storage only.
- **ScraperAPI** — fallback scraping for one-product when direct fetch is blocked.
- **Stripe** — subscription checkout + webhook-driven status.
- **Shopify Admin API** — embedded app auth, product creation, metafields (one-product only).
- **JSZip** — builds the one-product theme ZIP in memory.
- **ColorThief** — extracts a palette from a product image in the one-product wizard ("Magic Match").

---

## 10. Current Reality & Known Issues

The repo is mid-expansion. Things to keep in mind before editing:

1. **Dashboard routing bug** — `app/(main)/dashboard/page.tsx` links **every** theme to `/preview/${id}` (the one-product preview) regardless of `content.business_type`. Restaurant/wellness/atlas/etc. themes opened from the dashboard land on the wrong preview. They should route to `/preview/{business_type}/${id}`.
2. **One-product export drops content** — `mapLegacyContentToV2` forwards only a subset to v3; much of the generated/previewed content is not in the downloaded ZIP. `images` is ignored by the builder.
3. **Mojibake in generated themes** — v3 ships `icon: '?'` and `stars: '?????'` defaults (corrupted emoji/star glyphs) into real themes.
4. **Double AI call (one-product)** — the wizard calls `/api/generate-content` twice (preview step and save step), doubling cost/latency.
5. **Download not gated by Pro** — `ThemeActions` shows an "Upgrade to Export" link when not Pro but the Download button still runs.
6. **Untracked files** — `shopify-generator-v2.ts`, `shopify-generator-v3.ts`, all 7 business-type folders/wizards/routes/components, and the new preview routes are present on disk but not committed.
7. **Legacy weight** — `shopify-generator.ts` (~7.4k lines) is largely dead; only the mapper + entry are live.

---

## 11. Mental Model (TL;DR)

- **Zenya = 8 AI generators behind one wizard.**
- **One-Product** = URL → scrape → AI copy → **downloadable Shopify theme** (v3 ZIP) + Shopify publish.
- **7 business types** (Restaurant, Wellness, SaaS/Atlas, Fashion/Lookbook, Catalog/Collective, Brand Story/Studio, Local Services) = **form → AI copy (gpt-4o-mini) → hosted React preview** on the Zenya domain. No ZIP, no Shopify.
- Everything persists in the Supabase **`themes`** table, discriminated by **`content.business_type`**.
