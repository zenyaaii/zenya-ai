/**
 * Online Store 2.0 dropshipping theme generator.
 *
 * Takes a BuildConfig (palette, product, store, prices, images) and
 * returns a complete file map of a Shopify-compatible theme. The map
 * keys are theme-relative paths (`layout/theme.liquid`, etc.); the
 * values are the file contents.
 *
 * The output is consumed by:
 *   • /api/build/download — zips the map and streams it back
 *   • Phase 3 preview — server-renders the index template
 *
 * Architectural notes:
 *   • All editable copy is wired through section schema settings so
 *     merchants can rewrite in the Shopify theme editor without code.
 *   • The user's chosen palette becomes the theme defaults in
 *     settings_schema.json AND the current values in settings_data.json.
 *     A merchant who opens the editor sees their palette already
 *     applied, and can change it.
 *   • The homepage template (index.json) renders the product page by
 *     default — this is the classic one-product dropshipping pattern.
 *     A `product.json` template handles direct /products/:handle URLs.
 *   • No Hydrogen / no app blocks — pure Liquid. The theme is uploadable
 *     to any Shopify store from the Themes page.
 *
 * Validated against Shopify docs (Online Store 2.0 architecture,
 * sections schema, product form requirements). See README.md inside the
 * generated theme for the merchant-facing summary.
 */

import { buildTemplate, collectClaims, includeSection } from './seed'

/** A real product review scraped from the source listing. */
export type ProductReview = {
  /** Reviewer display name as shown on the source site. */
  name: string
  /** Buyer country code or name, e.g. "US". */
  country?: string
  /** Star rating 1-5. */
  rating: number
  /** Review text. */
  text: string
  /** Absolute photo URLs attached to the review. */
  photos?: string[]
  /** Review date if available (display only). */
  date?: string
}

export type BuildConfig = {
  /** The product name the merchant chose / generated. */
  productName: string
  /** Brand / store name. Shown in header + footer + browser tab. */
  storeName: string
  /** Currency-agnostic sale price as a number, e.g. 49.99. */
  salePrice: number
  /** "Was" price for the strike-through, e.g. 99.99. 0 means no compare-at. */
  originalPrice: number
  /** Absolute image URLs the merchant selected (min 5). First = hero. */
  images: string[]
  /** Selected palette ID — used in the README only, the palette itself
   *  is passed through paletteColors. */
  paletteId: string
  paletteName: string
  paletteVibe: 'bold' | 'premium' | 'dark' | 'warm'
  /** Resolved hex colours from the palette. */
  paletteColors: {
    bg: string
    surface: string
    fg: string
    muted: string
    primary: string
    primaryFg: string
    accent: string
    border: string
  }
  /** Optional product description from the scrape. */
  description?: string
  /** Optional product highlights (bullet points). */
  highlights?: string[]
  /** Real spec rows scraped from the source listing (label → value). */
  specs?: Record<string, string>
  /** Optional source URL — recorded in README for the merchant. */
  sourceUrl?: string
  /** Real reviews scraped from the source listing. When present, the
   *  review/UGC/star sections seed from these instead of invented copy. */
  reviews?: ProductReview[]
  /** Aggregate review stats from the source listing. */
  reviewStats?: { average: number; count: number }
}

export type ThemeFiles = Record<string, string>

/* ── helpers ──────────────────────────────────────────────────────── */

/** Escape a string for use in Liquid `{{ "..." }}` literals. We don't
 *  need full HTML escape because Liquid handles that via | escape. */
function liquidString(s: string): string {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/** Escape a string for JSON. */
function j(s: string): string {
  return JSON.stringify(s).slice(1, -1)
}

function moneyCents(n: number): number {
  return Math.round(Math.max(0, n) * 100)
}

function discountPct(sale: number, original: number): number {
  if (!original || original <= sale) return 0
  return Math.round(((original - sale) / original) * 100)
}

/* ── individual file generators ───────────────────────────────────── */

function fileLayout(_c: BuildConfig): string {
  // theme.liquid — the HTML shell wrapping every page. Section groups
  // are rendered top + bottom; the per-template section stack drops
  // into {{ content_for_layout }}. settings.* CSS variables let
  // every section style with one source of truth.
  return `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="{{ settings.color_primary }}">
    <link rel="canonical" href="{{ canonical_url }}">
    {%- if settings.favicon != blank -%}
      <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 64 }}">
    {%- endif -%}
    <title>
      {{ page_title }}
      {%- if current_tags %} &ndash; tagged "{{ current_tags | join: ', ' }}"{% endif -%}
      {%- if current_page != 1 %} &ndash; Page {{ current_page }}{% endif -%}
      {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
    </title>
    {%- if page_description -%}
      <meta name="description" content="{{ page_description | escape }}">
    {%- endif -%}
    {{ content_for_header }}
    {{ 'base.css' | asset_url | stylesheet_tag }}
    <style>
      :root {
        --color-bg: {{ settings.color_bg }};
        --color-surface: {{ settings.color_surface }};
        --color-fg: {{ settings.color_fg }};
        --color-muted: {{ settings.color_muted }};
        --color-primary: {{ settings.color_primary }};
        --color-primary-fg: {{ settings.color_primary_fg }};
        --color-accent: {{ settings.color_accent }};
        --color-border: {{ settings.color_border }};
        --radius: {{ settings.radius_global }}px;
      }
    </style>
  </head>
  <body class="ds-body">
    <a class="ds-skip" href="#MainContent">Skip to content</a>
    {% sections 'header-group' %}
    <main id="MainContent" role="main">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}

    {%- comment -%} Mini-cart drawer — opened by theme.js after any
    add-to-cart and from the header cart icon. Lines are rendered
    client-side from /cart.js. {%- endcomment -%}
    <div class="ds-drawer" data-ds-drawer aria-hidden="true">
      <div class="ds-drawer__overlay" data-ds-drawer-close></div>
      <aside class="ds-drawer__panel" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <header class="ds-drawer__head">
          <div class="ds-drawer__title">Your cart <span class="ds-drawer__count" data-ds-drawer-count>{{ cart.item_count }}</span></div>
          <button type="button" class="ds-drawer__close" data-ds-drawer-close aria-label="Close cart">×</button>
        </header>
        {%- assign ds_threshold = 5000 -%}
        {%- assign ds_pct = cart.total_price | times: 100 | divided_by: ds_threshold -%}
        {%- if ds_pct > 100 -%}{%- assign ds_pct = 100 -%}{%- endif -%}
        <div class="ds-drawer__ship" data-ds-shipbar data-threshold-cents="{{ ds_threshold }}">
          <div class="ds-drawer__ship-copy" data-ds-shipbar-copy aria-live="polite">
            {%- assign ds_remaining = ds_threshold | minus: cart.total_price -%}
            {%- if ds_remaining > 0 -%}
              You're <strong>{{ ds_remaining | money }}</strong> away from free shipping 🚚
            {%- else -%}
              🎉 You unlocked <strong>free shipping</strong>!
            {%- endif -%}
          </div>
          <div class="ds-drawer__ship-track"><div class="ds-drawer__ship-fill" data-ds-shipbar-fill style="width: {{ ds_pct }}%"></div></div>
        </div>
        <ul class="ds-drawer__lines" data-ds-drawer-lines></ul>
        <div class="ds-drawer__empty" data-ds-drawer-empty hidden>
          <div class="ds-drawer__empty-icon">🛒</div>
          <p>Your cart is empty.</p>
          <a href="/#product" class="ds-btn ds-btn-primary ds-btn-sm" data-ds-drawer-close>Shop the product</a>
        </div>
        <footer class="ds-drawer__foot">
          <div class="ds-drawer__row">
            <span>Subtotal</span>
            <strong data-ds-cart-subtotal>{{ cart.total_price | money }}</strong>
          </div>
          <form action="{{ routes.cart_url }}" method="post">
            <button type="submit" name="checkout" class="ds-btn ds-btn-primary ds-btn-lg ds-drawer__checkout">Checkout</button>
          </form>
          <a href="{{ routes.cart_url }}" class="ds-drawer__viewcart">View full cart</a>
          <div class="ds-drawer__payments" aria-label="Accepted payment methods">
            {%- for type in shop.enabled_payment_types limit: 6 -%}
              {{ type | payment_type_svg_tag: class: 'ds-pay-icon' }}
            {%- endfor -%}
          </div>
        </footer>
      </aside>
    </div>
    <style>
      .ds-drawer { position: fixed; inset: 0; z-index: 60; pointer-events: none; }
      .ds-drawer__overlay { position: absolute; inset: 0; background: rgba(0,0,0,.40); opacity: 0; transition: opacity .25s ease; }
      .ds-drawer__panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(420px, 92vw); background: var(--color-bg); display: flex; flex-direction: column; transform: translateX(105%); transition: transform .28s ease; box-shadow: -24px 0 60px -24px rgba(0,0,0,.35); }
      .ds-drawer.is-open { pointer-events: auto; }
      .ds-drawer.is-open .ds-drawer__overlay { opacity: 1; }
      .ds-drawer.is-open .ds-drawer__panel { transform: translateX(0); }
      .ds-drawer__head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); }
      .ds-drawer__title { font-weight: 800; font-size: 1.05rem; color: var(--color-fg); }
      .ds-drawer__count { display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; background: var(--color-primary); color: var(--color-primary-fg); font-size: .72rem; font-weight: 800; margin-left: .35rem; }
      .ds-drawer__close { background: transparent; border: 0; font-size: 22px; line-height: 1; color: var(--color-muted); cursor: pointer; padding: .25rem .5rem; }
      .ds-drawer__ship { padding: .8rem 1.25rem; border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
      .ds-drawer__ship-copy { font-size: .8rem; color: var(--color-fg); margin-bottom: .45rem; }
      .ds-drawer__ship-track { height: 6px; background: color-mix(in srgb, var(--color-fg) 8%, transparent); border-radius: 4px; overflow: hidden; }
      .ds-drawer__ship-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-primary)); border-radius: 4px; transition: width .35s ease; }
      .ds-drawer__lines { list-style: none; margin: 0; padding: .75rem 1.25rem; flex: 1; overflow-y: auto; display: grid; gap: .75rem; align-content: start; }
      .ds-drawer__line { display: grid; grid-template-columns: 64px 1fr auto; gap: .75rem; align-items: center; padding: .6rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; }
      .ds-drawer__line.is-busy { opacity: .55; pointer-events: none; }
      .ds-drawer__line img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; display: block; background: var(--color-bg); }
      .ds-drawer__line-name { font-weight: 700; font-size: .85rem; color: var(--color-fg); line-height: 1.25; }
      .ds-drawer__line-price { color: var(--color-primary); font-weight: 800; font-size: .85rem; margin-top: 2px; }
      .ds-drawer__line-controls { display: grid; gap: .35rem; justify-items: end; }
      .ds-drawer__qty { display: inline-flex; align-items: center; border: 1px solid var(--color-border); border-radius: 9px; overflow: hidden; background: var(--color-bg); }
      .ds-drawer__qty button { padding: .25rem .6rem; background: transparent; border: 0; cursor: pointer; font-size: .95rem; color: var(--color-fg); }
      .ds-drawer__qty span { min-width: 26px; text-align: center; font-weight: 700; font-size: .85rem; font-variant-numeric: tabular-nums; }
      .ds-drawer__line-remove { background: none; border: 0; color: var(--color-muted); font-size: .72rem; cursor: pointer; text-decoration: underline; padding: 0; }
      .ds-drawer__empty { text-align: center; padding: 2.5rem 1.25rem; color: var(--color-muted); }
      .ds-drawer__empty-icon { font-size: 2rem; margin-bottom: .5rem; }
      .ds-drawer__foot { padding: 1rem 1.25rem 1.25rem; border-top: 1px solid var(--color-border); display: grid; gap: .7rem; background: var(--color-surface); }
      .ds-drawer__row { display: flex; justify-content: space-between; font-size: .95rem; color: var(--color-fg); }
      .ds-drawer__checkout { width: 100%; }
      .ds-drawer__viewcart { text-align: center; font-size: .82rem; color: var(--color-muted); text-decoration: underline; }
      .ds-drawer__payments { display: flex; gap: .35rem; justify-content: center; flex-wrap: wrap; }
      .ds-drawer__payments .ds-pay-icon { height: 20px; width: auto; border-radius: 3px; }
    </style>

    <script>window.dsMoneyFormat = {{ shop.money_format | json }};</script>
    <script src="{{ 'theme.js' | asset_url }}" defer></script>
  </body>
</html>
`
}

function fileSettingsSchema(c: BuildConfig): string {
  const p = c.paletteColors
  // theme_info must be FIRST. Shopify uses it for the editor's About
  // panel. The rest are merchant-facing categories.
  return JSON.stringify(
    [
      {
        name: 'theme_info',
        theme_name: 'Zenya Dropship',
        theme_version: '1.0.0',
        theme_author: 'Zenya AI',
        theme_documentation_url: 'https://zenyaai.co/docs/themes',
        theme_support_url: 'https://zenyaai.co/support',
      },
      {
        name: 'Brand',
        settings: [
          { type: 'paragraph', content: 'Your brand identity. These show up in the header, footer, and browser tab.' },
          { type: 'text', id: 'brand_name', label: 'Brand name', default: c.storeName || 'Your Store' },
          { type: 'image_picker', id: 'logo', label: 'Logo (optional)', info: 'Square works best. We fall back to the brand name.' },
          { type: 'image_picker', id: 'favicon', label: 'Favicon' },
        ],
      },
      {
        name: 'Colors',
        settings: [
          { type: 'paragraph', content: 'Set once — every section picks them up automatically.' },
          { type: 'header', content: 'Surfaces' },
          { type: 'color', id: 'color_bg', label: 'Page background', default: p.bg },
          { type: 'color', id: 'color_surface', label: 'Card surface', default: p.surface },
          { type: 'color', id: 'color_border', label: 'Border', default: p.border },
          { type: 'header', content: 'Text' },
          { type: 'color', id: 'color_fg', label: 'Primary text', default: p.fg },
          { type: 'color', id: 'color_muted', label: 'Muted text', default: p.muted },
          { type: 'header', content: 'Buttons' },
          { type: 'color', id: 'color_primary', label: 'Primary button', default: p.primary },
          { type: 'color', id: 'color_primary_fg', label: 'Primary button text', default: p.primaryFg },
          { type: 'color', id: 'color_accent', label: 'Accent (badges, ribbons)', default: p.accent },
        ],
      },
      {
        name: 'Layout',
        settings: [
          { type: 'range', id: 'radius_global', label: 'Corner radius', min: 0, max: 28, step: 2, unit: 'px', default: 16 },
          { type: 'select', id: 'container_width', label: 'Content width', default: 'medium',
            options: [
              { value: 'narrow', label: 'Narrow (920px)' },
              { value: 'medium', label: 'Medium (1140px)' },
              { value: 'wide', label: 'Wide (1320px)' },
            ],
          },
        ],
      },
      {
        name: 'Typography',
        settings: [
          { type: 'font_picker', id: 'font_heading', label: 'Headings', default: 'assistant_n7' },
          { type: 'font_picker', id: 'font_body',    label: 'Body',     default: 'assistant_n4' },
        ],
      },
      {
        name: 'Cart',
        settings: [
          { type: 'select', id: 'cart_type', label: 'Cart behaviour', default: 'drawer',
            options: [
              { value: 'page', label: 'Cart page' },
              { value: 'drawer', label: 'Slide-out drawer' },
              { value: 'notification', label: 'Notification (stays on page)' },
            ],
          },
          { type: 'checkbox', id: 'show_klarna_note', label: 'Show "or 4 payments of…" line', default: true },
        ],
      },
    ],
    null,
    2,
  )
}

function fileSettingsData(c: BuildConfig): string {
  const p = c.paletteColors
  // The `current` block is what the merchant sees on first install.
  // We pre-fill with the palette they picked in /build so the theme
  // looks right immediately.
  const current = {
    brand_name: c.storeName || 'Your Store',
    color_bg: p.bg,
    color_surface: p.surface,
    color_border: p.border,
    color_fg: p.fg,
    color_muted: p.muted,
    color_primary: p.primary,
    color_primary_fg: p.primaryFg,
    color_accent: p.accent,
    radius_global: 16,
    container_width: 'medium',
    cart_type: 'drawer',
    show_klarna_note: true,
  }
  return JSON.stringify({ current, presets: { Default: current } }, null, 2)
}

function fileLocales(_c: BuildConfig): string {
  return JSON.stringify(
    {
      general: {
        accessibility: {
          skip_to_text: 'Skip to content',
          close: 'Close',
          open: 'Open',
          next: 'Next',
          previous: 'Previous',
        },
        cart: {
          title: 'Your cart',
          empty: 'Your cart is empty',
          checkout: 'Checkout',
          subtotal: 'Subtotal',
        },
        product: {
          add_to_cart: 'Add to cart',
          sold_out: 'Sold out',
          unavailable: 'Unavailable',
          quantity: 'Quantity',
          on_sale: 'Sale',
          from_lowest_price: 'From {{ lowest_price }}',
        },
      },
    },
    null,
    2,
  )
}

function fileHeaderGroup(c: BuildConfig): string {
  // A section group is a JSON file under /sections that lists sections
  // rendered together by {% sections 'header-group' %}. Order matters.
  const t = buildTemplate(
    [
      { id: 'announcement', type: 'ds-announcement' },
      { id: 'header',       type: 'ds-header' },
    ],
    c,
  )
  return JSON.stringify({ type: 'header', name: 'Header group', ...t }, null, 2)
}

function fileFooterGroup(c: BuildConfig): string {
  const t = buildTemplate([{ id: 'footer', type: 'ds-footer' }], c)
  return JSON.stringify({ type: 'footer', name: 'Footer group', ...t }, null, 2)
}

function fileIndexTemplate(c: BuildConfig): string {
  // Homepage stack — a high-converting one-product dropshipping flow.
  // Order matters: hook (hero) → social proof → product → urgency →
  // story → conversion. Merchant can drag-rearrange in the editor.
  const t = buildTemplate(
    [
      { id: 'promo',        type: 'ds-promo-bar' },
      { id: 'hero',         type: 'ds-hero' },
      { id: 'marquee',      type: 'ds-marquee' },
      { id: 'logos',        type: 'ds-logo-bar' },
      { id: 'stats',        type: 'ds-stats' },
      { id: 'main',         type: 'ds-product-main' },
      { id: 'bundle',       type: 'ds-bundle' },
      { id: 'countdown',    type: 'ds-countdown' },
      { id: 'stock',        type: 'ds-stock-counter' },
      { id: 'highlights',   type: 'ds-product-highlights' },
      { id: 'before_after', type: 'ds-before-after' },
      { id: 'comparison',   type: 'ds-comparison' },
      { id: 'how_it_works', type: 'ds-how-it-works' },
      { id: 'imgtext',      type: 'ds-image-text' },
      { id: 'reviews',      type: 'ds-reviews' },
      { id: 'ugc',          type: 'ds-ugc-gallery' },
      { id: 'press',        type: 'ds-press' },
      { id: 'founder',      type: 'ds-founder-story' },
      { id: 'guarantee',    type: 'ds-guarantee' },
      { id: 'trust',        type: 'ds-trust-badges' },
      { id: 'faq',          type: 'ds-faq' },
      { id: 'recently',     type: 'ds-recently-bought' },
      { id: 'newsletter',   type: 'ds-newsletter' },
      { id: 'cta',          type: 'ds-cta' },
      { id: 'sticky',       type: 'ds-sticky-atc' },
    ].filter((r) => includeSection(r.type, c)),
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileProductTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      // No standalone ds-bundle here — the buy box has the tier picker.
      // No ds-related-products / ds-recently-viewed — meaningless on a
      // one-product store.
      { id: 'ship_est',   type: 'ds-shipping-estimator' },
      { id: 'main',       type: 'ds-product-main' },
      { id: 'volume',     type: 'ds-volume-discount' },
      { id: 'fbt',        type: 'ds-frequently-bought' },
      { id: 'highlights', type: 'ds-product-highlights' },
      { id: 'specs',      type: 'ds-product-specs' },
      { id: 'video',      type: 'ds-product-video' },
      { id: 'size_chart', type: 'ds-size-chart' },
      { id: 'tabs',       type: 'ds-product-tabs' },
      { id: 'starsum',    type: 'ds-stars-summary' },
      { id: 'reviews',    type: 'ds-reviews' },
      { id: 'photos',     type: 'ds-customer-photos' },
      { id: 'qa',         type: 'ds-product-qa' },
      { id: 'trust',      type: 'ds-trust-badges' },
      { id: 'secure',     type: 'ds-secure-checkout' },
      { id: 'guarantee',  type: 'ds-guarantee' },
      { id: 'faq',        type: 'ds-faq' },
      { id: 'cta',        type: 'ds-cta' },
      { id: 'sticky',     type: 'ds-sticky-atc' },
      { id: 'recently',   type: 'ds-recently-bought' },
    ].filter((r) => includeSection(r.type, c)),
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileCartTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'ship_bar',   type: 'ds-free-shipping-bar' },
      { id: 'main-cart',  type: 'ds-cart' },
      { id: 'upsell',     type: 'ds-cart-upsell' },
      { id: 'guarantee',  type: 'ds-guarantee' },
      { id: 'secure',     type: 'ds-secure-checkout' },
      { id: 'trust',      type: 'ds-trust-badges' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileCollectionTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'promo',            type: 'ds-promo-banner' },
      { id: 'main-collection',  type: 'ds-collection' },
      { id: 'trust',            type: 'ds-trust-badges' },
      { id: 'newsletter',       type: 'ds-newsletter' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function filePageTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'main-page', type: 'ds-page' },
      { id: 'cta',       type: 'ds-cta' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileContactTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'contact', type: 'ds-contact-form' },
      { id: 'icons',   type: 'ds-icon-list' },
      { id: 'faq',     type: 'ds-faq' },
      { id: 'trust',   type: 'ds-trust-badges' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileAboutTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'hero',       type: 'ds-hero-split' },
      { id: 'mission',    type: 'ds-mission' },
      { id: 'timeline',   type: 'ds-timeline' },
      { id: 'values',     type: 'ds-values' },
      { id: 'team',       type: 'ds-team' },
      { id: 'founder',    type: 'ds-founder-story' },
      { id: 'gallery',    type: 'ds-gallery' },
      { id: 'quote',      type: 'ds-quote' },
      { id: 'newsletter', type: 'ds-newsletter' },
      { id: 'cta',        type: 'ds-cta' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileBlogTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'list',       type: 'ds-blog-list' },
      { id: 'newsletter', type: 'ds-newsletter' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileArticleTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'main',       type: 'ds-article-main' },
      { id: 'related',    type: 'ds-blog-grid' },
      { id: 'newsletter', type: 'ds-newsletter' },
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileSearchTemplate(c: BuildConfig): string {
  const t = buildTemplate([{ id: 'main-search', type: 'ds-search' }], c)
  return JSON.stringify(t, null, 2)
}

function file404Template(_c: BuildConfig): string {
  // 404 must be a .liquid template per Shopify spec (not JSON).
  return `<section class="ds-container ds-404">
  <h1>Page not found</h1>
  <p>The page you’re looking for isn’t here. Head back to the homepage.</p>
  <a class="ds-btn ds-btn-primary" href="{{ routes.root_url }}">Take me home</a>
</section>
<style>
  .ds-404 { text-align:center; padding: 6rem 1.5rem; }
  .ds-404 h1 { font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 1rem; }
  .ds-404 p { color: var(--color-muted); margin: 0 0 2rem; }
</style>
`
}

/* ── Sections ─────────────────────────────────────────────────────── */

function sectionAnnouncement(_c: BuildConfig): string {
  return `<section class="ds-announcement" role="region" aria-label="Announcement">
  <div class="ds-container">
    <div class="ds-announcement__inner">
      {%- for block in section.blocks -%}
        <span class="ds-announcement__item" {{ block.shopify_attributes }}>
          {{ block.settings.text }}
        </span>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-announcement { background: var(--color-fg); color: var(--color-bg); font-size: 12.5px; letter-spacing: .04em; }
  .ds-announcement__inner { display: flex; gap: 2rem; justify-content: center; align-items: center; padding: .55rem 0; flex-wrap: wrap; }
  .ds-announcement__item { opacity: .9; }
</style>
{% schema %}
{
  "name": "Announcement bar",
  "tag": "section",
  "settings": [],
  "blocks": [
    {
      "type": "message",
      "name": "Message",
      "settings": [
        { "type": "text", "id": "text", "label": "Message", "default": "Free shipping over $50 · 30-day returns" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{
    "name": "Announcement bar",
    "blocks": [
      { "type": "message", "settings": { "text": "Free shipping over $50" } },
      { "type": "message", "settings": { "text": "30-day money-back guarantee" } },
      { "type": "message", "settings": { "text": "Loved by 12,400+ customers" } }
    ]
  }]
}
{% endschema %}
`
}

function sectionHeader(_c: BuildConfig): string {
  // Sticky header with logo, store name, and cart icon. Cart count
  // updates via {{ cart.item_count }}.
  return `<header class="ds-header">
  <div class="ds-container ds-header__inner">
    <a href="{{ routes.root_url }}" class="ds-header__brand" aria-label="{{ settings.brand_name | escape }}">
      {%- if settings.logo != blank -%}
        {{ settings.logo | image_url: width: 320 | image_tag: alt: settings.brand_name, height: 36, loading: 'eager' }}
      {%- else -%}
        <span class="ds-header__brand-text">{{ settings.brand_name | default: shop.name }}</span>
      {%- endif -%}
    </a>
    <nav class="ds-header__nav" aria-label="Primary">
      {%- for link in linklists.main-menu.links limit: 5 -%}
        <a href="{{ link.url }}" class="ds-header__link">{{ link.title }}</a>
      {%- endfor -%}
    </nav>
    <a href="{{ routes.cart_url }}" class="ds-header__cart" aria-label="Cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"></path>
      </svg>
      {%- if cart.item_count > 0 -%}
        <span class="ds-header__count" aria-label="{{ cart.item_count }} items">{{ cart.item_count }}</span>
      {%- endif -%}
    </a>
  </div>
</header>
<style>
  .ds-header { background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 30; }
  .ds-header__inner { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.5rem; gap: 1.5rem; }
  .ds-header__brand { display: flex; align-items: center; text-decoration: none; color: var(--color-fg); }
  .ds-header__brand-text { font-weight: 800; font-size: 1.05rem; letter-spacing: -0.01em; }
  .ds-header__nav { display: flex; gap: 1.25rem; }
  .ds-header__link { color: var(--color-fg); text-decoration: none; font-size: .92rem; font-weight: 500; opacity: .85; }
  .ds-header__link:hover { opacity: 1; }
  .ds-header__cart { position: relative; color: var(--color-fg); }
  .ds-header__count { position: absolute; top: -6px; right: -8px; background: var(--color-primary); color: var(--color-primary-fg); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; min-width: 16px; text-align: center; }
  @media (max-width: 720px) { .ds-header__nav { display: none; } }
</style>
{% schema %}
{
  "name": "Header",
  "tag": "header",
  "settings": [
    { "type": "paragraph", "content": "Logo, brand name, and cart icon. Brand is set in theme settings → Brand." }
  ],
  "presets": [{ "name": "Header" }]
}
{% endschema %}
`
}

function sectionFooter(_c: BuildConfig): string {
  return `<footer class="ds-footer">
  <div class="ds-container ds-footer__top">
    <div class="ds-footer__brand">
      <div class="ds-footer__brandname">{{ settings.brand_name | default: shop.name }}</div>
      <p class="ds-footer__tag">{{ section.settings.tagline }}</p>
    </div>
    <div class="ds-footer__cols">
      {%- for block in section.blocks -%}
        {%- case block.type -%}
        {%- when 'column' -%}
          <div class="ds-footer__col" {{ block.shopify_attributes }}>
            <div class="ds-footer__h">{{ block.settings.heading }}</div>
            <ul>
              {%- assign lines = block.settings.links | newline_to_br | split: '<br />' -%}
              {%- for line in lines -%}
                {%- assign t = line | strip -%}
                {%- if t != blank -%}
                  {%- assign parts = t | split: '|' -%}
                  {%- assign label = parts[0] | strip -%}
                  {%- assign href = parts[1] | strip -%}
                  {%- if href == 'mailto:' -%}
                    <li><a href="mailto:{{ shop.email }}">{{ label }}</a></li>
                  {%- elsif href != blank -%}
                    <li><a href="{{ href }}">{{ label }}</a></li>
                  {%- else -%}
                    <li><a href="{{ routes.root_url }}">{{ label }}</a></li>
                  {%- endif -%}
                {%- endif -%}
              {%- endfor -%}
            </ul>
          </div>
        {%- when 'newsletter' -%}
          <div class="ds-footer__col" {{ block.shopify_attributes }}>
            <div class="ds-footer__h">{{ block.settings.heading }}</div>
            <p class="ds-footer__copy">{{ block.settings.copy }}</p>
            {% form 'customer', class: 'ds-footer__form' %}
              <input type="hidden" name="contact[tags]" value="newsletter">
              <input type="email" name="contact[email]" placeholder="you@example.com" required>
              <button type="submit" class="ds-btn ds-btn-primary ds-btn-sm">Subscribe</button>
            {% endform %}
          </div>
        {%- endcase -%}
      {%- endfor -%}
    </div>
  </div>
  <div class="ds-container ds-footer__bottom">
    <div>© {{ 'now' | date: '%Y' }} {{ settings.brand_name | default: shop.name }}. All rights reserved.</div>
    <div class="ds-footer__legal">
      <a href="/policies/privacy-policy">Privacy</a>
      <a href="/policies/terms-of-service">Terms</a>
      <a href="/policies/refund-policy">Refunds</a>
    </div>
  </div>
</footer>
<style>
  .ds-footer { background: var(--color-surface); color: var(--color-fg); margin-top: 4rem; border-top: 1px solid var(--color-border); }
  .ds-footer__top { display: grid; grid-template-columns: 1fr 2fr; gap: 3rem; padding: 3rem 1.5rem 2rem; }
  .ds-footer__brandname { font-weight: 800; font-size: 1.4rem; letter-spacing: -0.02em; }
  .ds-footer__tag { color: var(--color-muted); font-size: .9rem; margin-top: .5rem; max-width: 32ch; }
  .ds-footer__cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
  .ds-footer__h { font-weight: 700; font-size: .82rem; text-transform: uppercase; letter-spacing: .12em; margin-bottom: .8rem; color: var(--color-muted); }
  .ds-footer__col ul { list-style: none; padding: 0; margin: 0; display: grid; gap: .45rem; font-size: .9rem; }
  .ds-footer__col a { color: var(--color-fg); text-decoration: none; opacity: .85; }
  .ds-footer__copy { color: var(--color-muted); font-size: .88rem; margin: 0 0 .8rem; }
  .ds-footer__form { display: flex; gap: .5rem; }
  .ds-footer__form input { flex: 1; padding: .55rem .75rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-fg); font-size: .9rem; }
  .ds-footer__bottom { display: flex; justify-content: space-between; gap: 1rem; padding: 1.5rem; border-top: 1px solid var(--color-border); font-size: .8rem; color: var(--color-muted); flex-wrap: wrap; }
  .ds-footer__legal { display: flex; gap: 1rem; }
  .ds-footer__legal a { color: var(--color-muted); }
  @media (max-width: 720px) {
    .ds-footer__top { grid-template-columns: 1fr; gap: 2rem; }
    .ds-footer__cols { grid-template-columns: 1fr 1fr; }
  }
</style>
{% schema %}
{
  "name": "Footer",
  "tag": "footer",
  "settings": [
    { "type": "text", "id": "tagline", "label": "Tagline", "default": "Premium products, fast shipping, real humans behind the support email." }
  ],
  "blocks": [
    {
      "type": "column",
      "name": "Link column",
      "settings": [
        { "type": "text", "id": "heading", "label": "Heading", "default": "Shop" },
        { "type": "textarea", "id": "links", "label": "Links — one per line, Label|URL", "default": "Shop now|/#product\\nBundle deals|/#bundle" }
      ]
    },
    {
      "type": "newsletter",
      "name": "Newsletter",
      "limit": 1,
      "settings": [
        { "type": "text", "id": "heading", "label": "Heading", "default": "Get the drop" },
        { "type": "text", "id": "copy", "label": "Copy", "default": "Restock alerts and members-only deals. No spam." }
      ]
    }
  ],
  "max_blocks": 5,
  "default": {
    "blocks": [
      { "type": "column", "settings": { "heading": "Shop", "links": "Shop now|/#product\\nBundle deals|/#bundle" } },
      { "type": "column", "settings": { "heading": "Help", "links": "FAQ|/#faq\\nReturns|/#guarantee\\nContact us|mailto:" } },
      { "type": "newsletter", "settings": {} }
    ]
  }
}
{% endschema %}
`
}

function sectionHero(c: BuildConfig): string {
  const heroImage = c.images[0] || ''
  const heroAlt = c.productName || c.storeName
  return `<section class="ds-hero" style="background: var(--color-bg);">
  <div class="ds-container ds-hero__grid">
    <div class="ds-hero__copy">
      <span class="ds-hero__eyebrow">{{ section.settings.eyebrow }}</span>
      <h1 class="ds-hero__title">{{ section.settings.headline }}</h1>
      <p class="ds-hero__sub">{{ section.settings.subhead }}</p>
      <a href="#product" class="ds-btn ds-btn-primary ds-btn-lg">{{ section.settings.cta_label }}</a>
      <div class="ds-hero__proof">
        {%- for block in section.blocks -%}
          <div class="ds-hero__proof-item" {{ block.shopify_attributes }}>
            <strong>{{ block.settings.stat }}</strong>
            <span>{{ block.settings.label }}</span>
          </div>
        {%- endfor -%}
      </div>
    </div>
    <div class="ds-hero__media">
      {%- if section.settings.hero_image != blank -%}
        {{ section.settings.hero_image | image_url: width: 1400 | image_tag: alt: section.settings.headline, loading: 'eager', fetchpriority: 'high', sizes: '(max-width: 820px) 100vw, 50vw', widths: '400, 700, 1000, 1400' }}
      {%- else -%}
        <img src="${liquidString(heroImage)}" alt="${liquidString(heroAlt)}" width="1400" height="1400" loading="eager" fetchpriority="high">
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-hero { padding: 3rem 0; }
  .ds-hero__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
  .ds-hero__eyebrow { font-size: .8rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); }
  .ds-hero__title { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; margin: .6rem 0 1.2rem; letter-spacing: -0.02em; }
  .ds-hero__sub { font-size: 1.05rem; color: var(--color-muted); margin: 0 0 1.8rem; max-width: 48ch; line-height: 1.5; }
  .ds-hero__proof { display: flex; gap: 2rem; margin-top: 2rem; }
  .ds-hero__proof-item { display: flex; flex-direction: column; }
  .ds-hero__proof-item strong { font-size: 1.4rem; font-weight: 800; color: var(--color-fg); }
  .ds-hero__proof-item span { font-size: .75rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .08em; }
  .ds-hero__media img { width: 100%; height: auto; border-radius: calc(var(--radius) * 1.5); display: block; box-shadow: 0 30px 60px -30px rgba(0,0,0,.25); }
  @media (max-width: 820px) {
    .ds-hero__grid { grid-template-columns: 1fr; gap: 2rem; }
    .ds-hero__proof { gap: 1.25rem; }
  }
</style>
{% schema %}
{
  "name": "Hero",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Now shipping" },
    { "type": "text", "id": "headline", "label": "Headline", "default": "${j(c.productName || 'A product worth talking about')}" },
    { "type": "textarea", "id": "subhead", "label": "Sub-headline", "default": "${j('Built for everyday use. Loved by thousands. Backed by a 30-day promise.')}" },
    { "type": "text", "id": "cta_label", "label": "CTA label", "default": "Get yours now" },
    { "type": "image_picker", "id": "hero_image", "label": "Hero image" }
  ],
  "blocks": [
    {
      "type": "stat",
      "name": "Stat",
      "settings": [
        { "type": "text", "id": "stat", "label": "Number", "default": "4.9★" },
        { "type": "text", "id": "label", "label": "Label", "default": "2,400+ reviews" }
      ]
    }
  ],
  "max_blocks": 3,
  "presets": [{
    "name": "Hero",
    "blocks": [
      { "type": "stat", "settings": { "stat": "4.9★", "label": "2,400+ reviews" } },
      { "type": "stat", "settings": { "stat": "30-day", "label": "Money-back" } },
      { "type": "stat", "settings": { "stat": "Free", "label": "Shipping over $50" } }
    ]
  }]
}
{% endschema %}
`
}

function sectionProductMain(c: BuildConfig): string {
  const fallbackPriceCents = moneyCents(c.salePrice)
  const fallbackComparePriceCents = moneyCents(c.originalPrice)
  const dp = discountPct(c.salePrice, c.originalPrice)
  // The product object is preferred when available (real Shopify
  // product). When the merchant first installs and the homepage shows
  // a product that doesn't exist yet, we fall back to section settings
  // so the page still looks right.
  return `{%- liquid
  assign p = product
  if p == blank or p.id == blank
    assign p = collections.all.products.first
  endif
  assign use_real = false
  if p != blank and p.id != blank
    assign use_real = true
  endif
-%}
<section id="product" class="ds-product">
  <div class="ds-container ds-product__grid">
    <div class="ds-product__media">
      {%- if use_real and p.featured_image -%}
        <div class="ds-product__hero">
          {{ p.featured_image | image_url: width: 1400 | image_tag: alt: p.title, loading: 'eager', fetchpriority: 'high', sizes: '(max-width: 880px) 100vw, 50vw', widths: '400, 700, 1000, 1400' }}
        </div>
        <div class="ds-product__thumbs">
          {%- for img in p.images limit: 6 -%}
            <button type="button" class="ds-product__thumb" data-src="{{ img | image_url: width: 1400 }}">
              {{ img | image_url: width: 240 | image_tag: alt: '', loading: 'lazy' }}
            </button>
          {%- endfor -%}
        </div>
      {%- else -%}
        <div class="ds-product__hero">
          {%- if section.settings.fallback_image != blank -%}
            {{ section.settings.fallback_image | image_url: width: 1400 | image_tag: alt: section.settings.fallback_title, loading: 'eager', fetchpriority: 'high', sizes: '(max-width: 880px) 100vw, 50vw', widths: '400, 700, 1000, 1400' }}
          {%- elsif section.settings.fallback_image_url != blank -%}
            <img src="{{ section.settings.fallback_image_url }}" alt="{{ section.settings.fallback_title | escape }}" width="1400" height="1400" loading="eager" fetchpriority="high">
          {%- endif -%}
        </div>
        <div class="ds-product__thumbs">
          {%- for block in section.blocks -%}
            {%- if block.type == 'thumb' -%}
              {%- if block.settings.image != blank -%}
                <button type="button" class="ds-product__thumb" data-src="{{ block.settings.image | image_url: width: 1400 }}">
                  {{ block.settings.image | image_url: width: 240 | image_tag: alt: '', loading: 'lazy' }}
                </button>
              {%- elsif block.settings.image_url != blank -%}
                <button type="button" class="ds-product__thumb" data-src="{{ block.settings.image_url }}">
                  <img src="{{ block.settings.image_url }}" alt="" width="240" height="240" loading="lazy">
                </button>
              {%- endif -%}
            {%- endif -%}
          {%- endfor -%}
        </div>
      {%- endif -%}
    </div>

    <div class="ds-product__info">
      <div class="ds-product__rating">
        <span class="ds-stars" aria-label="{{ section.settings.rating }} stars">★★★★★</span>
        <span class="ds-product__rating-text">{{ section.settings.rating }} · {{ section.settings.review_count }} reviews</span>
      </div>

      <h1 class="ds-product__title">
        {%- if use_real -%}{{ p.title }}{%- else -%}{{ section.settings.fallback_title }}{%- endif -%}
      </h1>

      <p class="ds-product__desc">
        {%- if use_real -%}{{ p.description | strip_html | truncate: 220 }}{%- else -%}{{ section.settings.fallback_desc }}{%- endif -%}
      </p>

      <div class="ds-product__price">
        {%- if use_real -%}
          {%- assign v = p.selected_or_first_available_variant -%}
          <span class="ds-product__price-sale">{{ v.price | money }}</span>
          {%- if v.compare_at_price > v.price -%}
            <span class="ds-product__price-compare">{{ v.compare_at_price | money }}</span>
            {%- assign d = v.compare_at_price | minus: v.price | times: 100 | divided_by: v.compare_at_price -%}
            <span class="ds-product__discount">Save {{ d }}%</span>
          {%- endif -%}
        {%- else -%}
          <span class="ds-product__price-sale">{{ ${fallbackPriceCents} | money }}</span>
          {%- if ${fallbackComparePriceCents} > ${fallbackPriceCents} -%}
            <span class="ds-product__price-compare">{{ ${fallbackComparePriceCents} | money }}</span>
            <span class="ds-product__discount">Save ${dp}%</span>
          {%- endif -%}
        {%- endif -%}
      </div>

      {%- if settings.show_klarna_note -%}
        <div class="ds-product__klarna">Or 4 interest-free payments. Available at checkout.</div>
      {%- endif -%}

      <div class="ds-product__stock">
        <span class="ds-stock-dot"></span>
        In stock · ships in 24h
      </div>

      {%- liquid
        assign unit_cents = ${fallbackPriceCents}
        if use_real
          assign unit_cents = p.selected_or_first_available_variant.price
        endif
        assign has_tiers = false
        for block in section.blocks
          if block.type == 'tier'
            assign has_tiers = true
          endif
        endfor
      -%}
      {%- if has_tiers -%}
        <div class="ds-product__tiers" data-ds-pm-tiers>
          <div class="ds-product__tiers-label">Bundle &amp; save</div>
          {%- for block in section.blocks -%}
            {%- if block.type == 'tier' -%}
              {%- assign tier_units = block.settings.units | default: 1 -%}
              {%- assign tier_total = unit_cents | times: tier_units -%}
              <label class="ds-product__tier {% if block.settings.featured %}ds-product__tier--featured{% endif %}" {{ block.shopify_attributes }}>
                <input type="radio" name="pm-tier-{{ section.id }}" data-ds-pm-tier data-units="{{ tier_units }}" {% if forloop.first %}checked{% endif %}>
                <span class="ds-product__tier-label">{{ block.settings.label }}</span>
                {%- if block.settings.badge != blank -%}
                  <span class="ds-product__tier-badge">{{ block.settings.badge }}</span>
                {%- endif -%}
                <span class="ds-product__tier-price">{{ tier_total | money }}</span>
              </label>
            {%- endif -%}
          {%- endfor -%}
        </div>
      {%- endif -%}

      {%- if use_real -%}
        {% form 'product', p, id: 'ds-product-form', class: 'ds-product__form' %}
          <input type="hidden" name="id" value="{{ p.selected_or_first_available_variant.id }}">
          {%- if p.has_only_default_variant == false -%}
            <div class="ds-product__variants">
              {%- for option in p.options_with_values -%}
                <label class="ds-product__variant-label">
                  <span class="ds-product__variant-name">{{ option.name }}</span>
                  <select name="options[{{ option.name | escape }}]" class="ds-product__variant-select">
                    {%- for value in option.values -%}
                      <option value="{{ value | escape }}" {% if option.selected_value == value %}selected{% endif %}>{{ value }}</option>
                    {%- endfor -%}
                  </select>
                </label>
              {%- endfor -%}
            </div>
          {%- endif -%}
          <div class="ds-product__qty-row">
            <label class="ds-product__qty">
              <button type="button" class="ds-qty-btn" data-step="-1" aria-label="Decrease">−</button>
              <input type="number" name="quantity" value="1" min="1" inputmode="numeric" data-ds-pm-qty>
              <button type="button" class="ds-qty-btn" data-step="1" aria-label="Increase">+</button>
            </label>
            <button type="submit" class="ds-btn ds-btn-primary ds-btn-xl ds-product__atc">
              Add to cart · <span data-ds-atc-price data-unit-cents="{{ unit_cents }}">{{ unit_cents | money }}</span>
            </button>
          </div>
          {{ form | payment_button }}
        {% endform %}
        <div class="ds-product__payments" aria-label="Accepted payment methods">
          {%- for type in shop.enabled_payment_types limit: 7 -%}
            {{ type | payment_type_svg_tag: class: 'ds-pay-icon' }}
          {%- endfor -%}
          <span class="ds-product__payments-note">Secure 256-bit encrypted checkout</span>
        </div>
      {%- else -%}
        <div class="ds-product__form">
          <a href="#bundle" class="ds-btn ds-btn-primary ds-btn-xl ds-product__atc">Add to cart</a>
          <p class="ds-product__placeholder-note">Add your product in Shopify admin to enable live checkout — this button activates automatically.</p>
        </div>
      {%- endif -%}

      <ul class="ds-product__trust">
        {%- for block in section.blocks -%}
          {%- if block.type == 'trust' -%}
            <li {{ block.shopify_attributes }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              {{ block.settings.text }}
            </li>
          {%- endif -%}
        {%- endfor -%}
      </ul>

      <div class="ds-product__accordions">
        {%- if use_real and p.description != blank -%}
          <details class="ds-product__acc">
            <summary>Description<span class="ds-product__acc-icon" aria-hidden="true"></span></summary>
            <div class="ds-product__acc-body">{{ p.description }}</div>
          </details>
        {%- endif -%}
        {%- for block in section.blocks -%}
          {%- if block.type == 'accordion' -%}
            <details class="ds-product__acc" {{ block.shopify_attributes }}>
              <summary>{{ block.settings.title }}<span class="ds-product__acc-icon" aria-hidden="true"></span></summary>
              <div class="ds-product__acc-body">{{ block.settings.body | newline_to_br }}</div>
            </details>
          {%- endif -%}
        {%- endfor -%}
      </div>
    </div>
  </div>
</section>
<style>
  .ds-product { padding: 2.5rem 0 4rem; }
  .ds-product__grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 3rem; align-items: start; }
  .ds-product__hero { aspect-ratio: 1/1; border-radius: calc(var(--radius) * 1.5); overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); }
  .ds-product__hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ds-product__thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: .5rem; margin-top: .75rem; }
  .ds-product__thumb { aspect-ratio: 1/1; border-radius: calc(var(--radius) * .75); overflow: hidden; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; padding: 0; }
  .ds-product__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ds-product__rating { display: flex; gap: .5rem; align-items: center; }
  .ds-stars { color: var(--color-accent); letter-spacing: 2px; font-size: 14px; }
  .ds-product__rating-text { color: var(--color-muted); font-size: .85rem; }
  .ds-product__title { font-size: clamp(1.45rem, 2.6vw, 2.05rem); margin: .55rem 0 .8rem; letter-spacing: -0.02em; line-height: 1.12; }
  .ds-product__desc { color: var(--color-muted); font-size: .94rem; line-height: 1.55; margin: 0 0 1.25rem; max-width: 52ch; }
  .ds-product__price { display: flex; gap: .65rem; align-items: baseline; margin-bottom: .45rem; }
  .ds-product__price-sale { font-size: 1.65rem; font-weight: 800; color: var(--color-primary); letter-spacing: -0.01em; }
  .ds-product__price-compare { text-decoration: line-through; color: var(--color-muted); font-size: 1rem; }
  .ds-product__discount { background: color-mix(in srgb, var(--color-accent) 14%, transparent); color: var(--color-accent); font-size: .8rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
  .ds-product__klarna { font-size: .85rem; color: var(--color-muted); margin-bottom: 1rem; }
  .ds-product__stock { display: inline-flex; gap: .5rem; align-items: center; font-size: .85rem; color: var(--color-muted); margin-bottom: 1.5rem; }
  .ds-stock-dot { width: 7px; height: 7px; border-radius: 4px; background: #22c55e; display: inline-block; }
  .ds-product__form { display: grid; gap: 1rem; }
  .ds-product__variants { display: flex; gap: 1rem; flex-wrap: wrap; }
  .ds-product__variant-label { display: flex; flex-direction: column; gap: .35rem; flex: 1; min-width: 130px; }
  .ds-product__variant-name { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--color-muted); }
  .ds-product__variant-select { padding: .65rem .8rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); color: var(--color-fg); font-size: .95rem; }
  .ds-product__qty-row { display: flex; gap: .75rem; align-items: stretch; }
  .ds-product__qty { display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
  .ds-qty-btn { padding: 0 .9rem; background: var(--color-surface); border: 0; cursor: pointer; font-size: 1.1rem; color: var(--color-fg); }
  .ds-product__qty input { width: 48px; text-align: center; border: 0; padding: .85rem 0; font-size: 1rem; background: var(--color-surface); color: var(--color-fg); }
  .ds-product__atc { flex: 1; }
  .ds-product__placeholder-note { color: var(--color-muted); font-size: .8rem; }
  .ds-product__payments { display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; margin-top: .25rem; }
  .ds-product__payments .ds-pay-icon { height: 22px; width: auto; border-radius: 3px; }
  .ds-product__payments-note { font-size: .72rem; color: var(--color-muted); margin-left: .35rem; }
  .ds-product__tiers { display: grid; gap: .5rem; margin-bottom: 1.4rem; }
  .ds-product__tiers-label { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--color-muted); }
  .ds-product__tier { position: relative; display: flex; align-items: center; gap: .65rem; padding: .8rem 1rem; border: 1.5px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); cursor: pointer; transition: border-color .15s, box-shadow .15s; }
  .ds-product__tier:has(input:checked) { border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); }
  .ds-product__tier input { accent-color: var(--color-primary); margin: 0; }
  .ds-product__tier-label { font-weight: 700; font-size: .92rem; color: var(--color-fg); flex: 1; }
  .ds-product__tier-badge { background: var(--color-primary); color: var(--color-primary-fg); font-size: .66rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; }
  .ds-product__tier-price { font-weight: 800; color: var(--color-primary); font-size: .95rem; font-variant-numeric: tabular-nums; }
  .ds-product__tier--featured { border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border)); }
  .ds-product__accordions { margin-top: 1.5rem; border-top: 1px solid var(--color-border); }
  .ds-product__acc { border-bottom: 1px solid var(--color-border); }
  .ds-product__acc summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .9rem 2px; font-weight: 700; font-size: .92rem; color: var(--color-fg); cursor: pointer; list-style: none; }
  .ds-product__acc summary::-webkit-details-marker { display: none; }
  .ds-product__acc-icon { position: relative; width: 14px; height: 14px; flex-shrink: 0; }
  .ds-product__acc-icon::before, .ds-product__acc-icon::after { content: ''; position: absolute; inset: 0; margin: auto; background: var(--color-muted); transition: transform .2s; }
  .ds-product__acc-icon::before { width: 14px; height: 2px; }
  .ds-product__acc-icon::after { width: 2px; height: 14px; }
  .ds-product__acc[open] .ds-product__acc-icon::after { transform: rotate(90deg); }
  .ds-product__acc-body { padding: 0 2px 1rem; color: var(--color-muted); font-size: .9rem; line-height: 1.6; }
  .ds-product__acc-body p { margin: 0 0 .6rem; }
  /* Dynamic checkout (Buy it now) — match the theme instead of the
     unstyled default. Branded buttons (Shop Pay etc.) keep their brand
     color but inherit the radius. */
  .shopify-payment-button__button { border-radius: var(--radius) !important; font-weight: 700 !important; }
  .shopify-payment-button__button--unbranded { background: var(--color-fg) !important; color: var(--color-bg) !important; padding: .95rem 1.5rem !important; font-size: 1rem !important; transition: opacity .15s !important; }
  .shopify-payment-button__button--unbranded:hover { opacity: .88 !important; }
  .shopify-payment-button__more-options { color: var(--color-muted) !important; font-size: .8rem !important; }
  .ds-product__trust { list-style: none; padding: 0; margin: 1.4rem 0 0; display: grid; gap: .5rem; }
  .ds-product__trust li { display: flex; gap: .5rem; align-items: center; font-size: .9rem; color: var(--color-fg); }
  .ds-product__trust svg { color: #16a34a; }
  @media (max-width: 880px) {
    .ds-product__grid { grid-template-columns: 1fr; gap: 2rem; }
  }
</style>
{% schema %}
{
  "name": "Product",
  "tag": "section",
  "settings": [
    { "type": "header", "content": "Fallback defaults (no product yet)" },
    { "type": "text",   "id": "fallback_title", "label": "Fallback title", "default": "${j(c.productName || 'Your product')}" },
    { "type": "textarea","id": "fallback_desc", "label": "Fallback description", "default": "${j(c.description || 'Premium build, fast shipping, and a 30-day no-questions return policy.')}" },
    { "type": "image_picker", "id": "fallback_image", "label": "Fallback image" },
    { "type": "text",         "id": "fallback_image_url", "label": "Or fallback image URL (external)" },
    { "type": "header", "content": "Social proof" },
    { "type": "text",   "id": "rating", "label": "Star rating", "default": "4.9" },
    { "type": "text",   "id": "review_count", "label": "Review count", "default": "2,431" }
  ],
  "blocks": [
    {
      "type": "thumb",
      "name": "Gallery thumb",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text",         "id": "image_url", "label": "Or image URL (external)" }
      ]
    },
    {
      "type": "trust",
      "name": "Trust point",
      "settings": [
        { "type": "text", "id": "text", "label": "Text", "default": "Free shipping over $50" }
      ]
    },
    {
      "type": "tier",
      "name": "Bundle tier",
      "settings": [
        { "type": "paragraph", "content": "Price shows units × the live product price. Selecting a tier sets the add-to-cart quantity." },
        { "type": "text", "id": "label", "label": "Label", "default": "1× — Single" },
        { "type": "number", "id": "units", "label": "Units added to cart", "default": 1 },
        { "type": "text", "id": "badge", "label": "Badge (optional)" },
        { "type": "checkbox", "id": "featured", "label": "Accent border" }
      ]
    },
    {
      "type": "accordion",
      "name": "Info accordion",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Shipping & delivery" },
        { "type": "textarea", "id": "body", "label": "Body" }
      ]
    }
  ],
  "max_blocks": 20,
  "presets": [{ "name": "Product", "blocks": [
      { "type": "tier", "settings": { "label": "1× — Single", "units": 1 } },
      { "type": "tier", "settings": { "label": "2× — Pair & save", "units": 2, "badge": "Most popular", "featured": true } },
      { "type": "trust", "settings": { "text": "Free shipping over $50" } },
      { "type": "trust", "settings": { "text": "30-day money-back guarantee" } },
      { "type": "trust", "settings": { "text": "Tracked delivery in 3-5 days" } },
      { "type": "accordion", "settings": { "title": "Shipping & delivery", "body": "Orders ship within 24 hours on business days with a tracked carrier. Typical delivery is 3-5 business days; you'll get the tracking number by email." } },
      { "type": "accordion", "settings": { "title": "Returns & guarantee", "body": "30-day money-back guarantee. Return for any reason and we cover the return label." } }
    ] }]
}
{% endschema %}
`
}

function sectionBundle(c: BuildConfig): string {
  const single = moneyCents(c.salePrice)
  return `{%- liquid
  assign bp = product
  if bp == blank or bp.id == blank
    assign bp = collections.all.products.first
  endif
-%}
<section id="bundle" class="ds-bundle" data-ds-bundle>
  <div class="ds-container">
    <div class="ds-bundle__head">
      <span class="ds-bundle__eyebrow">{{ section.settings.eyebrow }}</span>
      <h2 class="ds-bundle__title">{{ section.settings.title }}</h2>
    </div>
    <div class="ds-bundle__grid">
      {%- for block in section.blocks -%}
        <label class="ds-bundle__card {% if block.settings.featured %}ds-bundle__card--featured{% endif %}" {{ block.shopify_attributes }}>
          {%- if block.settings.featured -%}
            <div class="ds-bundle__ribbon">{{ block.settings.ribbon }}</div>
          {%- endif -%}
          <input type="radio" name="bundle-{{ section.id }}" data-ds-bundle-option data-units="{{ block.settings.units | default: 1 }}" data-price="{{ block.settings.price | escape }}" {% if block.settings.featured %}checked{% endif %}>
          <div class="ds-bundle__qty">{{ block.settings.qty }}</div>
          <div class="ds-bundle__name">{{ block.settings.name }}</div>
          <div class="ds-bundle__price">{{ block.settings.price }}</div>
          {%- if block.settings.subtext != blank -%}
            <div class="ds-bundle__sub">{{ block.settings.subtext }}</div>
          {%- endif -%}
        </label>
      {%- endfor -%}
    </div>
    {%- if bp != blank and bp.id != blank -%}
      <button type="button" class="ds-btn ds-btn-primary ds-btn-lg ds-bundle__cta" data-ds-bundle-add data-variant-id="{{ bp.selected_or_first_available_variant.id }}" data-label="{{ section.settings.cta | escape }}">{{ section.settings.cta }}</button>
    {%- else -%}
      <a href="#product" class="ds-btn ds-btn-primary ds-btn-lg ds-bundle__cta">{{ section.settings.cta }}</a>
    {%- endif -%}
    <p class="ds-bundle__note">{{ section.settings.note }}</p>
  </div>
</section>
<style>
  .ds-bundle { padding: 3rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-bundle__head { text-align: center; margin-bottom: 2rem; }
  .ds-bundle__eyebrow { font-size: .8rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); }
  .ds-bundle__title { font-size: clamp(1.4rem, 3vw, 2rem); margin: .4rem 0 0; letter-spacing: -0.01em; }
  .ds-bundle__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 820px; margin: 0 auto; }
  .ds-bundle__card { position: relative; padding: 1.5rem 1rem; border: 2px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); cursor: pointer; text-align: center; display: flex; flex-direction: column; gap: .4rem; align-items: center; transition: border-color .15s, transform .15s; }
  .ds-bundle__card:hover { transform: translateY(-2px); }
  .ds-bundle__card--featured { border-color: var(--color-primary); }
  .ds-bundle__card input { position: absolute; top: 1rem; right: 1rem; accent-color: var(--color-primary); }
  .ds-bundle__ribbon { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: var(--color-primary-fg); font-size: .7rem; font-weight: 700; letter-spacing: .08em; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; }
  .ds-bundle__qty { font-size: 2rem; font-weight: 800; color: var(--color-fg); }
  .ds-bundle__name { font-weight: 700; color: var(--color-fg); font-size: .98rem; }
  .ds-bundle__price { font-size: 1.2rem; font-weight: 800; color: var(--color-primary); }
  .ds-bundle__sub { font-size: .78rem; color: var(--color-muted); }
  .ds-bundle__cta { display: block; margin: 2rem auto 0; max-width: 360px; width: 100%; }
  .ds-bundle__cta[disabled] { opacity: .6; cursor: wait; }
  .ds-bundle__note { text-align: center; color: var(--color-muted); font-size: .8rem; margin: .8rem 0 0; }
  @media (max-width: 720px) {
    .ds-bundle__grid { grid-template-columns: 1fr; }
  }
</style>
{% schema %}
{
  "name": "Bundle",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "The button adds the selected quantity of your store's product straight to the cart." },
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Save more, get more" },
    { "type": "text", "id": "title", "label": "Title", "default": "Pick your bundle" },
    { "type": "text", "id": "cta",   "label": "CTA",   "default": "Continue to cart" },
    { "type": "text", "id": "note",  "label": "Note under CTA", "default": "Free shipping over $50 · 30-day money-back guarantee" }
  ],
  "blocks": [
    {
      "type": "tier",
      "name": "Tier",
      "settings": [
        { "type": "text", "id": "qty",   "label": "Quantity headline", "default": "1×" },
        { "type": "number", "id": "units", "label": "Units added to cart", "default": 1 },
        { "type": "text", "id": "name",  "label": "Tier name", "default": "Single" },
        { "type": "text", "id": "price", "label": "Price label", "default": "${j(`$${(single / 100).toFixed(2)}`)}" },
        { "type": "text", "id": "subtext", "label": "Sub-text", "default": "Try it out" },
        { "type": "checkbox", "id": "featured", "label": "Highlight as best deal" },
        { "type": "text", "id": "ribbon", "label": "Ribbon text", "default": "Best value" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{ "name": "Bundle", "blocks": [
      { "type": "tier", "settings": { "qty": "1×", "units": 1, "name": "Single", "price": "${j(`$${(single / 100).toFixed(2)}`)}", "subtext": "Try it out" } },
      { "type": "tier", "settings": { "qty": "2×", "units": 2, "name": "Double up", "price": "${j(`$${((single * 2 * 0.85) / 100).toFixed(2)}`)}", "subtext": "Save 15%", "featured": true, "ribbon": "Most popular" } },
      { "type": "tier", "settings": { "qty": "3×", "units": 3, "name": "Best value", "price": "${j(`$${((single * 3 * 0.75) / 100).toFixed(2)}`)}", "subtext": "Save 25%" } }
    ] }]
}
{% endschema %}
`
}

function sectionFeatures(_c: BuildConfig): string {
  return `<section class="ds-features">
  <div class="ds-container">
    <h2 class="ds-features__title">{{ section.settings.title }}</h2>
    <div class="ds-features__grid">
      {%- for block in section.blocks -%}
        <div class="ds-features__card" {{ block.shopify_attributes }}>
          <div class="ds-features__icon">{{ block.settings.icon }}</div>
          <div class="ds-features__name">{{ block.settings.heading }}</div>
          <div class="ds-features__body">{{ block.settings.body }}</div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-features { padding: 4rem 0; }
  .ds-features__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; letter-spacing: -0.01em; }
  .ds-features__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-features__card { padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-features__icon { font-size: 1.6rem; line-height: 1; margin-bottom: .8rem; }
  .ds-features__name { font-weight: 700; margin-bottom: .35rem; color: var(--color-fg); }
  .ds-features__body { color: var(--color-muted); font-size: .92rem; line-height: 1.45; }
  @media (max-width: 880px) {
    .ds-features__grid { grid-template-columns: 1fr 1fr; }
  }
</style>
{% schema %}
{
  "name": "Features",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Why people pick us" }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Feature",
      "settings": [
        { "type": "text", "id": "icon",    "label": "Icon (emoji or unicode)", "default": "✨" },
        { "type": "text", "id": "heading", "label": "Heading", "default": "Free shipping" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "Tracked delivery in 3-5 business days, on us." }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Features", "blocks": [
      { "type": "feature", "settings": { "icon": "🚚", "heading": "Free shipping",       "body": "Tracked delivery in 3-5 business days, on us." } },
      { "type": "feature", "settings": { "icon": "↩️", "heading": "30-day returns",      "body": "Try it. If it's not for you, send it back." } },
      { "type": "feature", "settings": { "icon": "🔒", "heading": "Secure checkout",     "body": "Stripe-grade payments. Your data stays yours." } },
      { "type": "feature", "settings": { "icon": "💬", "heading": "Real-human support",  "body": "Reply within 6 hours, every weekday." } }
    ] }]
}
{% endschema %}
`
}

function sectionComparison(c: BuildConfig): string {
  return `<section class="ds-compare">
  <div class="ds-container">
    <h2 class="ds-compare__title">{{ section.settings.title }}</h2>
    <p class="ds-compare__sub">{{ section.settings.subtitle }}</p>
    <div class="ds-compare__table">
      <div class="ds-compare__row ds-compare__row--head">
        <div></div>
        <div class="ds-compare__h ds-compare__h--us">{{ section.settings.us_label }}</div>
        <div class="ds-compare__h ds-compare__h--them">{{ section.settings.them_label }}</div>
      </div>
      {%- for block in section.blocks -%}
        <div class="ds-compare__row" {{ block.shopify_attributes }}>
          <div class="ds-compare__feat">{{ block.settings.feature }}</div>
          <div class="ds-compare__cell ds-compare__cell--us">{% if block.settings.us %}✓{% else %}—{% endif %}</div>
          <div class="ds-compare__cell ds-compare__cell--them">{% if block.settings.them %}✓{% else %}—{% endif %}</div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-compare { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-compare__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .6rem; }
  .ds-compare__sub { text-align: center; color: var(--color-muted); margin: 0 auto 2.2rem; max-width: 50ch; }
  .ds-compare__table { max-width: 720px; margin: 0 auto; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--color-border); background: var(--color-bg); }
  .ds-compare__row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: .9rem 1.2rem; align-items: center; }
  .ds-compare__row + .ds-compare__row { border-top: 1px solid var(--color-border); }
  .ds-compare__row--head { background: var(--color-surface); font-weight: 700; }
  .ds-compare__h { text-align: center; font-size: .9rem; }
  .ds-compare__h--us { color: var(--color-primary); }
  .ds-compare__h--them { color: var(--color-muted); }
  .ds-compare__feat { font-weight: 500; color: var(--color-fg); }
  .ds-compare__cell { text-align: center; font-size: 1.2rem; font-weight: 800; }
  .ds-compare__cell--us { color: #16a34a; }
  .ds-compare__cell--them { color: var(--color-muted); }
</style>
{% schema %}
{
  "name": "Comparison",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",    "label": "Title",    "default": "How we compare" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "${j(`Quick check vs. the next-cheapest option you'll find.`)}" },
    { "type": "text", "id": "us_label", "label": "Your column", "default": "${j(c.storeName || 'Us')}" },
    { "type": "text", "id": "them_label", "label": "Other column", "default": "Generic" }
  ],
  "blocks": [
    {
      "type": "row",
      "name": "Row",
      "settings": [
        { "type": "text", "id": "feature", "label": "Feature" },
        { "type": "checkbox", "id": "us", "label": "We have it", "default": true },
        { "type": "checkbox", "id": "them", "label": "They have it", "default": false }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Comparison", "blocks": [
      { "type": "row", "settings": { "feature": "Free 3-5 day shipping",  "us": true, "them": false } },
      { "type": "row", "settings": { "feature": "30-day money-back",       "us": true, "them": false } },
      { "type": "row", "settings": { "feature": "Real-human support",      "us": true, "them": false } },
      { "type": "row", "settings": { "feature": "Premium-grade materials", "us": true, "them": false } },
      { "type": "row", "settings": { "feature": "Bulk savings",            "us": true, "them": true  } }
    ] }]
}
{% endschema %}
`
}

function sectionReviews(_c: BuildConfig): string {
  return `<section class="ds-reviews" id="reviews">
  <div class="ds-container">
    <div class="ds-reviews__head">
      <h2 class="ds-reviews__title">{{ section.settings.title }}</h2>
      <div class="ds-reviews__summary">
        <span class="ds-stars">★★★★★</span>
        <span class="ds-reviews__rating">{{ section.settings.average }}</span>
        <span class="ds-reviews__count">{{ section.settings.count }}</span>
      </div>
    </div>
    <div class="ds-reviews__grid">
      {%- for block in section.blocks -%}
        <article class="ds-reviews__card" {{ block.shopify_attributes }}>
          {%- assign r = block.settings.rating | default: 5 | at_least: 1 | at_most: 5 -%}
          <div class="ds-stars" aria-label="{{ r }} out of 5 stars">{{ '★★★★★' | slice: 0, r }}<span class="ds-stars--off">{{ '★★★★★' | slice: r, 5 }}</span></div>
          <h3 class="ds-reviews__quote">{{ block.settings.headline }}</h3>
          <p class="ds-reviews__body">{{ block.settings.body }}</p>
          <div class="ds-reviews__author">{{ block.settings.author }}{%- if block.settings.location != blank -%} <span>· {{ block.settings.location }}</span>{%- endif -%}{%- if block.settings.verified -%} <span class="ds-reviews__verified">✓ Verified buyer</span>{%- endif -%}</div>
        </article>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-reviews { padding: 4rem 0; }
  .ds-reviews__head { display: flex; justify-content: space-between; gap: 1rem; align-items: end; margin-bottom: 2rem; flex-wrap: wrap; }
  .ds-reviews__title { font-size: clamp(1.4rem, 3vw, 2rem); margin: 0; }
  .ds-reviews__summary { display: flex; gap: .6rem; align-items: center; }
  .ds-reviews__rating { font-weight: 800; font-size: 1.1rem; }
  .ds-reviews__count { color: var(--color-muted); }
  .ds-reviews__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .ds-reviews__card { padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-reviews__quote { font-size: 1.05rem; line-height: 1.3; margin: .6rem 0 .6rem; }
  .ds-reviews__body { color: var(--color-muted); font-size: .92rem; line-height: 1.5; margin: 0 0 1rem; }
  .ds-reviews__author { font-size: .82rem; color: var(--color-fg); font-weight: 700; }
  .ds-reviews__author span { font-weight: 400; color: var(--color-muted); }
  .ds-stars--off { opacity: .25; }
  .ds-reviews__verified { color: #16a34a !important; font-size: .75rem; }
  @media (max-width: 880px) {
    .ds-reviews__grid { grid-template-columns: 1fr; }
  }
</style>
{% schema %}
{
  "name": "Reviews",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",   "label": "Title",   "default": "What people are saying" },
    { "type": "text", "id": "average", "label": "Average rating", "default": "4.9 out of 5" },
    { "type": "text", "id": "count",   "label": "Review count text", "default": "2,431 verified reviews" }
  ],
  "blocks": [
    {
      "type": "review",
      "name": "Review",
      "settings": [
        { "type": "range", "id": "rating", "label": "Stars", "min": 1, "max": 5, "step": 1, "default": 5 },
        { "type": "text", "id": "headline", "label": "Headline" },
        { "type": "textarea", "id": "body", "label": "Body" },
        { "type": "text", "id": "author", "label": "Author" },
        { "type": "text", "id": "location", "label": "Location" },
        { "type": "checkbox", "id": "verified", "label": "Show verified-buyer badge" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Reviews", "blocks": [
      { "type": "review", "settings": { "headline": "Honestly worth every dollar",          "body": "${j(`I was skeptical given the price, but it's been a part of my daily routine for two months and I have zero complaints.`)}", "author": "Alex P.",   "location": "Austin, TX" } },
      { "type": "review", "settings": { "headline": "Shipped fast and felt premium",         "body": "${j(`Showed up in three days in a really nice box. Build quality feels like something twice the price.`)}",                  "author": "Maya R.",   "location": "Brooklyn, NY" } },
      { "type": "review", "settings": { "headline": "Bought one. Came back for the bundle.", "body": "${j(`The 2-for-1 deal got me. Gave one to my mom for her birthday and she's been raving about it.`)}",                   "author": "Jordan S.", "location": "Seattle, WA" } }
    ] }]
}
{% endschema %}
`
}

function sectionFaq(_c: BuildConfig): string {
  return `<section class="ds-faq" id="faq">
  <div class="ds-container ds-faq__inner">
    <h2 class="ds-faq__title">{{ section.settings.title }}</h2>
    <div class="ds-faq__list">
      {%- for block in section.blocks -%}
        <details class="ds-faq__item" {{ block.shopify_attributes }}>
          <summary>
            <span>{{ block.settings.question }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </summary>
          <div class="ds-faq__body">{{ block.settings.answer }}</div>
        </details>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-faq { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-faq__inner { max-width: 760px; }
  .ds-faq__title { font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 1.6rem; text-align: center; }
  .ds-faq__list { display: grid; gap: .6rem; }
  .ds-faq__item { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 0; }
  .ds-faq__item summary { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 1.1rem 1.3rem; font-weight: 600; cursor: pointer; list-style: none; }
  .ds-faq__item summary::-webkit-details-marker { display: none; }
  .ds-faq__item[open] summary svg { transform: rotate(180deg); }
  .ds-faq__item summary svg { transition: transform .2s; flex-shrink: 0; }
  .ds-faq__body { padding: 0 1.3rem 1.2rem; color: var(--color-muted); line-height: 1.55; font-size: .95rem; }
</style>
{% schema %}
{
  "name": "FAQ",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Common questions" }
  ],
  "blocks": [
    {
      "type": "qa",
      "name": "Q&A",
      "settings": [
        { "type": "text", "id": "question", "label": "Question" },
        { "type": "textarea", "id": "answer", "label": "Answer" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "FAQ", "blocks": [
      { "type": "qa", "settings": { "question": "When does it ship?",            "answer": "${j(`Same-day if you order before 3pm local time, otherwise the next business day. You'll get a tracking number by email.`)}" } },
      { "type": "qa", "settings": { "question": "What's the return policy?",     "answer": "${j(`30 days, no questions asked. Send it back in any condition for a full refund — we'll even cover the return label.`)}" } },
      { "type": "qa", "settings": { "question": "How long is the warranty?",     "answer": "${j(`12 months against manufacturing defects. If something breaks, email us and we'll replace it.`)}" } },
      { "type": "qa", "settings": { "question": "Can I pay in installments?",    "answer": "${j(`Yes — Klarna and Shop Pay are available at checkout. Pick "4 payments" to split the total.`)}" } },
      { "type": "qa", "settings": { "question": "Do you ship internationally?",  "answer": "${j(`We ship to the US, Canada, UK, EU, and Australia. Other countries on request — just email us.`)}" } }
    ] }]
}
{% endschema %}
`
}

function sectionCta(_c: BuildConfig): string {
  return `<section class="ds-cta" style="background: var(--color-primary); color: var(--color-primary-fg);">
  <div class="ds-container ds-cta__inner">
    <h2 class="ds-cta__title">{{ section.settings.title }}</h2>
    <p class="ds-cta__sub">{{ section.settings.subtitle }}</p>
    <a href="{{ section.settings.cta_url | default: '/#product' }}" class="ds-btn ds-btn-on-primary ds-btn-xl">{{ section.settings.cta }}</a>
  </div>
</section>
<style>
  .ds-cta { padding: 4rem 0; text-align: center; }
  .ds-cta__title { font-size: clamp(1.6rem, 4vw, 2.6rem); margin: 0 0 .6rem; letter-spacing: -0.02em; }
  .ds-cta__sub { opacity: .85; max-width: 50ch; margin: 0 auto 1.6rem; }
</style>
{% schema %}
{
  "name": "Final CTA",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",    "label": "Title",    "default": "Get yours before the next restock" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "Free shipping over $50. 30-day returns. Real humans on email." },
    { "type": "text", "id": "cta",      "label": "CTA",      "default": "Add to cart" },
    { "type": "text", "id": "cta_url",  "label": "CTA link", "default": "/#product" }
  ],
  "presets": [{ "name": "Final CTA" }]
}
{% endschema %}
`
}

function sectionStickyAtc(c: BuildConfig): string {
  const fallbackPriceCents = moneyCents(c.salePrice)
  return `{%- liquid
  assign p = product
  if p == blank or p.id == blank
    assign p = collections.all.products.first
  endif
  assign use_real = false
  if p != blank and p.id != blank
    assign use_real = true
  endif
-%}
<div class="ds-sticky" data-ds-sticky aria-hidden="true">
  <div class="ds-container ds-sticky__inner">
    <div class="ds-sticky__media">
      {%- if use_real and p.featured_image -%}
        {{ p.featured_image | image_url: width: 96 | image_tag: alt: '', loading: 'lazy' }}
      {%- elsif section.settings.fallback_image != blank -%}
        {{ section.settings.fallback_image | image_url: width: 96 | image_tag: alt: '', loading: 'lazy' }}
      {%- elsif section.settings.fallback_image_url != blank -%}
        <img src="{{ section.settings.fallback_image_url }}" alt="" width="96" height="96" loading="lazy">
      {%- endif -%}
    </div>
    <div class="ds-sticky__copy">
      <div class="ds-sticky__name">{%- if use_real -%}{{ p.title }}{%- else -%}{{ section.settings.fallback_title }}{%- endif -%}</div>
      <div class="ds-sticky__price">
        {%- if use_real -%}
          {{ p.selected_or_first_available_variant.price | money }}
        {%- else -%}
          {{ ${fallbackPriceCents} | money }}
        {%- endif -%}
      </div>
    </div>
    {%- if use_real -%}
      {% form 'product', p %}
        <input type="hidden" name="id" value="{{ p.selected_or_first_available_variant.id }}">
        <button type="submit" class="ds-btn ds-btn-primary">{{ section.settings.cta }}</button>
      {% endform %}
    {%- else -%}
      <a href="#product" class="ds-btn ds-btn-primary">{{ section.settings.cta }}</a>
    {%- endif -%}
  </div>
</div>
<style>
  .ds-sticky { position: fixed; bottom: 0; left: 0; right: 0; background: var(--color-surface); border-top: 1px solid var(--color-border); transform: translateY(110%); transition: transform .25s ease; z-index: 40; box-shadow: 0 -10px 30px -10px rgba(0,0,0,.10); }
  .ds-sticky.is-visible { transform: translateY(0); }
  .ds-sticky__inner { display: flex; gap: 1rem; align-items: center; padding: .7rem 1.5rem; }
  .ds-sticky__media img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; display: block; }
  .ds-sticky__copy { flex: 1; min-width: 0; }
  .ds-sticky__name { font-weight: 700; font-size: .92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ds-sticky__price { color: var(--color-primary); font-weight: 800; font-size: .9rem; }
</style>
{% schema %}
{
  "name": "Sticky add-to-cart",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "${j(`Appears once the visitor scrolls past the main add-to-cart button. Increases mobile conversions ~10% on dropshipping stores.`)}" },
    { "type": "text", "id": "cta", "label": "CTA", "default": "Add to cart" },
    { "type": "text", "id": "fallback_title", "label": "Fallback title", "default": "${j(c.productName || 'Your product')}" },
    { "type": "image_picker", "id": "fallback_image", "label": "Fallback image" },
    { "type": "text",         "id": "fallback_image_url", "label": "Or fallback image URL (external)" }
  ],
  "presets": [{ "name": "Sticky add-to-cart" }]
}
{% endschema %}
`
}

function sectionCart(_c: BuildConfig): string {
  // AJAX cart page: quantity steppers and remove-line hit /cart/change.js
  // and re-paint prices from the JSON response — no full-page reloads.
  // The "add one more" nudge re-adds the first line's variant. All the
  // wiring lives in theme.js, keyed off data-ds-cart-* attributes.
  return `<section class="ds-cart-page" data-ds-cart>
  <div class="ds-container">
    <h1 class="ds-cart__title">{{ 'general.cart.title' | t }} <span class="ds-cart__countpill" data-ds-cart-count-pill {% if cart.item_count == 0 %}hidden{% endif %}><span data-ds-cart-count>{{ cart.item_count }}</span> items</span></h1>
    <div data-ds-cart-filled {% if cart.item_count == 0 %}hidden{% endif %}>
      <div class="ds-cart__layout">
        <div>
          <ul class="ds-cart__list" data-ds-cart-lines>
            {%- for item in cart.items -%}
              <li class="ds-cart__item" data-ds-cart-line="{{ forloop.index }}">
                <a href="{{ item.url }}" class="ds-cart__media">
                  {{ item.image | image_url: width: 160 | image_tag: alt: item.title, loading: 'lazy' }}
                </a>
                <div class="ds-cart__info">
                  <div class="ds-cart__name">{{ item.product.title }}</div>
                  {%- unless item.product.has_only_default_variant -%}
                    <div class="ds-cart__variant">{{ item.variant.title }}</div>
                  {%- endunless -%}
                  <div class="ds-cart__price" data-ds-line-price>{{ item.final_line_price | money }}</div>
                  {%- if item.original_line_price > item.final_line_price -%}
                    <div class="ds-cart__was">{{ item.original_line_price | money }}</div>
                  {%- endif -%}
                </div>
                <div class="ds-cart__controls">
                  <div class="ds-cart__qty" data-ds-cart-qty>
                    <button type="button" class="ds-qty-btn" data-ds-cart-step="-1" aria-label="Decrease quantity">−</button>
                    <span class="ds-cart__qty-num" data-ds-cart-qty-num>{{ item.quantity }}</span>
                    <button type="button" class="ds-qty-btn" data-ds-cart-step="1" aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" class="ds-cart__remove" data-ds-cart-remove aria-label="Remove {{ item.product.title | escape }}">Remove</button>
                </div>
              </li>
            {%- endfor -%}
          </ul>

          {%- if section.settings.show_addmore and cart.item_count > 0 -%}
            {%- assign first_item = cart.items | first -%}
            <div class="ds-cart__nudge" data-ds-cart-nudge>
              <div class="ds-cart__nudge-copy">
                <strong>{{ section.settings.addmore_title }}</strong>
                <span>{{ section.settings.addmore_sub }}</span>
              </div>
              <button type="button" class="ds-btn ds-btn-sm" data-ds-cart-add-more data-variant-id="{{ first_item.variant_id }}">+ Add one more</button>
            </div>
          {%- endif -%}

          {%- if section.settings.show_note -%}
            <label class="ds-cart__note">
              <span>Order note (optional)</span>
              <textarea name="note" rows="2" placeholder="Gift message, delivery instructions…" data-ds-cart-note>{{ cart.note }}</textarea>
            </label>
          {%- endif -%}
        </div>

        <aside class="ds-cart__summary">
          <div class="ds-cart__summary-card">
            <div class="ds-cart__row">
              <span>{{ 'general.cart.subtotal' | t }}</span>
              <strong data-ds-cart-subtotal>{{ cart.total_price | money }}</strong>
            </div>
            <div class="ds-cart__row ds-cart__row--muted" data-ds-cart-savings {% if cart.total_discount <= 0 %}hidden{% endif %}>
              <span>You saved</span>
              <strong data-ds-cart-savings-amount>{{ cart.total_discount | money }}</strong>
            </div>
            <div class="ds-cart__row ds-cart__row--muted">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <form action="{{ routes.cart_url }}" method="post" novalidate>
              <button type="submit" name="checkout" class="ds-btn ds-btn-primary ds-btn-xl ds-cart__checkout">{{ 'general.cart.checkout' | t }} · <span data-ds-cart-subtotal>{{ cart.total_price | money }}</span></button>
            </form>
            <div class="ds-cart__payments" aria-label="Accepted payment methods">
              {%- for type in shop.enabled_payment_types limit: 7 -%}
                {{ type | payment_type_svg_tag: class: 'ds-pay-icon' }}
              {%- endfor -%}
            </div>
            <ul class="ds-cart__assurance">
              <li>🔒 Secure 256-bit encrypted checkout</li>
              <li>↩️ 30-day money-back guarantee</li>
              <li>🚚 Tracked shipping with live updates</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>

    <div class="ds-cart__empty" data-ds-cart-empty {% if cart.item_count > 0 %}hidden{% endif %}>
      <div class="ds-cart__empty-icon">🛒</div>
      <h2>{{ section.settings.empty_title }}</h2>
      <p>{{ section.settings.empty_sub }}</p>
      <a href="/#product" class="ds-btn ds-btn-primary ds-btn-lg">{{ section.settings.empty_cta }}</a>
    </div>
  </div>
</section>
<style>
  .ds-cart-page { padding: 3rem 0 4rem; }
  .ds-cart__title { display: flex; align-items: center; gap: .75rem; font-size: clamp(1.5rem, 3vw, 2.1rem); margin: 0 0 1.5rem; }
  .ds-cart__countpill { font-size: .8rem; font-weight: 700; background: var(--color-surface); border: 1px solid var(--color-border); padding: .25rem .7rem; border-radius: 999px; color: var(--color-muted); }
  .ds-cart__layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem; align-items: start; }
  .ds-cart__list { list-style: none; padding: 0; display: grid; gap: 1rem; margin: 0; }
  .ds-cart__item { display: grid; grid-template-columns: 96px 1fr auto; gap: 1rem; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); align-items: center; transition: opacity .2s; }
  .ds-cart__item.is-busy { opacity: .55; pointer-events: none; }
  .ds-cart__media img { width: 96px; height: 96px; object-fit: cover; border-radius: calc(var(--radius) * .5); display: block; }
  .ds-cart__name { font-weight: 700; }
  .ds-cart__variant { color: var(--color-muted); font-size: .85rem; }
  .ds-cart__price { font-weight: 700; color: var(--color-primary); margin-top: .25rem; }
  .ds-cart__was { color: var(--color-muted); text-decoration: line-through; font-size: .8rem; }
  .ds-cart__controls { display: grid; gap: .5rem; justify-items: end; }
  .ds-cart__qty { display: inline-flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; background: var(--color-bg); }
  .ds-cart__qty-num { min-width: 36px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
  .ds-cart__remove { background: none; border: 0; color: var(--color-muted); font-size: .78rem; cursor: pointer; text-decoration: underline; padding: 0; }
  .ds-cart__remove:hover { color: var(--color-fg); }
  .ds-cart__nudge { display: flex; gap: 1rem; align-items: center; justify-content: space-between; margin-top: 1rem; padding: .9rem 1.1rem; border: 1.5px dashed var(--color-primary); border-radius: var(--radius); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }
  .ds-cart__nudge-copy { display: grid; gap: 2px; font-size: .9rem; }
  .ds-cart__nudge-copy span { color: var(--color-muted); font-size: .82rem; }
  .ds-cart__note { display: grid; gap: .4rem; margin-top: 1.25rem; font-size: .85rem; color: var(--color-muted); }
  .ds-cart__note textarea { padding: .65rem .8rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); color: var(--color-fg); font: inherit; resize: vertical; }
  .ds-cart__summary-card { position: sticky; top: 84px; padding: 1.4rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); display: grid; gap: .8rem; }
  .ds-cart__row { display: flex; justify-content: space-between; font-size: .95rem; }
  .ds-cart__row strong { font-size: 1.05rem; }
  .ds-cart__row--muted { color: var(--color-muted); font-size: .85rem; }
  .ds-cart__checkout { width: 100%; }
  .ds-cart__payments { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: center; }
  .ds-cart__payments .ds-pay-icon { height: 22px; width: auto; border-radius: 3px; }
  .ds-cart__assurance { list-style: none; padding: .4rem 0 0; margin: 0; display: grid; gap: .35rem; font-size: .8rem; color: var(--color-muted); border-top: 1px solid var(--color-border); }
  .ds-cart__empty { text-align: center; padding: 4rem 0; }
  .ds-cart__empty-icon { font-size: 2.6rem; margin-bottom: .75rem; }
  .ds-cart__empty h2 { margin: 0 0 .4rem; }
  .ds-cart__empty p { color: var(--color-muted); margin: 0 0 1.5rem; }
  @media (max-width: 880px) {
    .ds-cart__layout { grid-template-columns: 1fr; }
    .ds-cart__summary-card { position: static; }
  }
</style>
{% schema %}
{
  "name": "Cart",
  "tag": "section",
  "settings": [
    { "type": "header", "content": "Buy-more nudge" },
    { "type": "checkbox", "id": "show_addmore", "label": "Show add-one-more nudge", "default": true },
    { "type": "text", "id": "addmore_title", "label": "Nudge title", "default": "Make it a pair" },
    { "type": "text", "id": "addmore_sub", "label": "Nudge subtitle", "default": "Most customers add a second one — for a friend or a backup." },
    { "type": "header", "content": "Extras" },
    { "type": "checkbox", "id": "show_note", "label": "Show order-note field", "default": true },
    { "type": "header", "content": "Empty cart" },
    { "type": "text", "id": "empty_title", "label": "Empty title", "default": "Your cart is empty" },
    { "type": "text", "id": "empty_sub", "label": "Empty subtitle", "default": "Free shipping over $50 and a 30-day guarantee are waiting." },
    { "type": "text", "id": "empty_cta", "label": "Empty CTA", "default": "Shop the product" }
  ],
  "presets": [{ "name": "Cart" }]
}
{% endschema %}
`
}

function sectionCollection(_c: BuildConfig): string {
  return `<section class="ds-collection">
  <div class="ds-container">
    <h1>{{ collection.title | default: 'Shop' }}</h1>
    {%- if collection.description != blank -%}<p class="ds-collection__desc">{{ collection.description | strip_html | truncate: 240 }}</p>{%- endif -%}
    <div class="ds-collection__grid">
      {%- for p in collection.products -%}
        <a href="{{ p.url }}" class="ds-collection__card">
          {%- if p.featured_image -%}
            {{ p.featured_image | image_url: width: 600 | image_tag: alt: p.title, loading: 'lazy', sizes: '(max-width: 600px) 50vw, 220px', widths: '220, 440, 600' }}
          {%- endif -%}
          <div class="ds-collection__name">{{ p.title }}</div>
          <div class="ds-collection__price">{{ p.price | money }}</div>
        </a>
      {%- else -%}
        <p>No products in this collection yet.</p>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-collection { padding: 3rem 0; }
  .ds-collection__desc { color: var(--color-muted); max-width: 60ch; }
  .ds-collection__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 2rem; }
  .ds-collection__card { display: grid; gap: .5rem; text-decoration: none; color: var(--color-fg); }
  .ds-collection__card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: var(--radius); background: var(--color-surface); }
  .ds-collection__name { font-weight: 600; }
  .ds-collection__price { color: var(--color-primary); font-weight: 700; }
</style>
{% schema %}
{ "name": "Collection", "tag": "section", "settings": [], "presets": [{ "name": "Collection" }] }
{% endschema %}
`
}

function sectionPage(_c: BuildConfig): string {
  return `<section class="ds-page">
  <div class="ds-container ds-page__inner">
    <h1>{{ page.title }}</h1>
    <div class="ds-rte">{{ page.content }}</div>
  </div>
</section>
<style>
  .ds-page { padding: 3rem 0; }
  .ds-page__inner { max-width: 720px; }
  .ds-rte h2 { margin: 2rem 0 .8rem; font-size: 1.4rem; }
  .ds-rte p { color: var(--color-fg); line-height: 1.6; margin: 0 0 1rem; }
  .ds-rte a { color: var(--color-primary); }
</style>
{% schema %}
{ "name": "Page", "tag": "section", "settings": [], "presets": [{ "name": "Page" }] }
{% endschema %}
`
}

function sectionSearch(_c: BuildConfig): string {
  return `<section class="ds-search">
  <div class="ds-container">
    <h1>Search</h1>
    <form action="{{ routes.search_url }}" method="get">
      <input type="search" name="q" value="{{ search.terms | escape }}" placeholder="Search products…">
      <button type="submit" class="ds-btn ds-btn-primary">Search</button>
    </form>
    {%- if search.performed -%}
      <p class="ds-search__count">{{ search.results_count }} result{% if search.results_count != 1 %}s{% endif %} for "{{ search.terms | escape }}"</p>
      <div class="ds-search__grid">
        {%- for item in search.results -%}
          <a href="{{ item.url }}" class="ds-search__card">
            <div class="ds-search__name">{{ item.title }}</div>
          </a>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>
</section>
<style>
  .ds-search { padding: 3rem 0; }
  .ds-search form { display: flex; gap: .5rem; margin: 1.5rem 0; }
  .ds-search input { flex: 1; padding: .8rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); color: var(--color-fg); }
  .ds-search__grid { display: grid; gap: .5rem; }
  .ds-search__card { padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); text-decoration: none; color: var(--color-fg); }
</style>
{% schema %}
{ "name": "Search", "tag": "section", "settings": [], "presets": [{ "name": "Search" }] }
{% endschema %}
`
}

/* ── Assets ───────────────────────────────────────────────────────── */

function assetBaseCss(_c: BuildConfig): string {
  return `/* Zenya Dropship · base styles. All section-specific styles live
   inline with the section so the merchant can hack them in one place. */

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body.ds-body {
  font-family: var(--font-body-family, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--color-fg);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}
h1, h2, h3, h4 {
  font-family: var(--font-heading-family, inherit);
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0;
}
a { color: inherit; }
img { max-width: 100%; height: auto; }

.ds-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}
body[data-width="narrow"] .ds-container { max-width: 920px; }
body[data-width="wide"] .ds-container { max-width: 1320px; }

.ds-skip {
  position: absolute; left: -9999px; top: 0;
  background: var(--color-fg); color: var(--color-bg);
  padding: .6rem 1rem; z-index: 999; text-decoration: none;
}
.ds-skip:focus { left: 8px; top: 8px; border-radius: 8px; }

.ds-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .75rem 1.3rem; border: 0; border-radius: var(--radius);
  background: var(--color-surface); color: var(--color-fg);
  border: 1px solid var(--color-border);
  font-weight: 700; font-size: .92rem; letter-spacing: .01em;
  text-decoration: none; cursor: pointer;
  transition: transform .12s ease, box-shadow .15s ease, filter .15s ease;
  line-height: 1.15;
}
.ds-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -8px rgba(0,0,0,.25); }
.ds-btn:active { transform: translateY(0); box-shadow: none; }
.ds-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.ds-btn[disabled] { opacity: .6; cursor: wait; transform: none; box-shadow: none; }
.ds-btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border-color: transparent;
  box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--color-primary) 55%, transparent);
}
.ds-btn-primary:hover { filter: brightness(1.06); box-shadow: 0 12px 26px -10px color-mix(in srgb, var(--color-primary) 60%, transparent); }
.ds-btn-on-primary {
  background: var(--color-primary-fg);
  color: var(--color-primary);
  border-color: transparent;
}
.ds-btn-sm { padding: .5rem .9rem; font-size: .82rem; }
.ds-btn-lg { padding: .9rem 1.5rem; font-size: .96rem; }
.ds-btn-xl { padding: 1.05rem 1.7rem; font-size: 1rem; }

.ds-stars { color: var(--color-accent); letter-spacing: 2px; font-size: 14px; }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`
}

function assetThemeJs(_c: BuildConfig): string {
  return `/* Zenya Dropship · client behaviour. Dependency-free, one file.
 * Everything hooks off data-ds-* attributes so sections stay markup-only. */
(function () {
  /* ── Money formatting (uses the store's format injected by layout) ── */
  function fmtMoney(cents) {
    var format = window.dsMoneyFormat || '$0.00';
    var amount = (Math.max(0, cents) / 100).toFixed(2);
    var withComma = amount.replace('.', ',');
    return format
      .replace(/\\{\\{\\s*amount\\s*\\}\\}/g, amount)
      .replace(/\\{\\{\\s*amount_no_decimals\\s*\\}\\}/g, String(Math.round(cents / 100)))
      .replace(/\\{\\{\\s*amount_with_comma_separator\\s*\\}\\}/g, withComma);
  }

  /* ── Cart API helper ──────────────────────────────────────────────── */
  function cartFetch(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.description || j.message || 'Cart error'); });
      return r.json();
    });
  }
  var dsCart = {
    add: function (id, qty) { return cartFetch('/cart/add.js', { items: [{ id: Number(id), quantity: qty || 1 }] }); },
    change: function (line, qty) { return cartFetch('/cart/change.js', { line: line, quantity: qty }); },
    update: function (fields) { return cartFetch('/cart/update.js', fields); },
    get: function () { return fetch('/cart.js', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); }); },
  };
  window.dsCart = dsCart;

  /* ── Shared paint: header count + free-shipping bars ──────────────── */
  function paintGlobals(cart) {
    document.querySelectorAll('.ds-header__count').forEach(function (el) { el.textContent = cart.item_count; });
    document.querySelectorAll('[data-ds-shipbar]').forEach(function (bar) {
      var threshold = parseInt(bar.getAttribute('data-threshold-cents'), 10) || 0;
      if (!threshold) return;
      var fill = bar.querySelector('[data-ds-shipbar-fill]');
      var copy = bar.querySelector('[data-ds-shipbar-copy]');
      var pct = Math.min(100, Math.round((cart.total_price / threshold) * 100));
      if (fill) fill.style.width = pct + '%';
      if (copy) {
        copy.innerHTML = cart.total_price >= threshold
          ? '🎉 You unlocked <strong>free shipping</strong>!'
          : "You're <strong>" + fmtMoney(threshold - cart.total_price) + '</strong> away from free shipping 🚚';
      }
    });
  }

  /* ── Mini-cart drawer ─────────────────────────────────────────────
   * Opens after any AJAX add-to-cart and from the header cart icon.
   * Lines are rebuilt from /cart.js JSON with DOM APIs (no innerHTML
   * for product data). */
  var drawer = document.querySelector('[data-ds-drawer]');
  function renderDrawer(cart) {
    if (!drawer) return;
    var count = drawer.querySelector('[data-ds-drawer-count]');
    if (count) count.textContent = cart.item_count;
    drawer.querySelectorAll('[data-ds-cart-subtotal]').forEach(function (el) { el.textContent = fmtMoney(cart.total_price); });
    var empty = drawer.querySelector('[data-ds-drawer-empty]');
    if (empty) empty.hidden = cart.item_count > 0;
    var list = drawer.querySelector('[data-ds-drawer-lines]');
    if (!list) return;
    list.textContent = '';
    cart.items.forEach(function (item, i) {
      var li = document.createElement('li');
      li.className = 'ds-drawer__line';
      li.setAttribute('data-ds-drawer-line', String(i + 1));
      var img = document.createElement('img');
      if (item.image) { img.src = item.image; img.alt = ''; img.width = 64; img.height = 64; img.loading = 'lazy'; }
      li.appendChild(img);
      var info = document.createElement('div');
      var name = document.createElement('div');
      name.className = 'ds-drawer__line-name';
      name.textContent = item.product_title || item.title || '';
      var price = document.createElement('div');
      price.className = 'ds-drawer__line-price';
      price.textContent = fmtMoney(item.final_line_price);
      info.appendChild(name);
      info.appendChild(price);
      li.appendChild(info);
      var controls = document.createElement('div');
      controls.className = 'ds-drawer__line-controls';
      var qty = document.createElement('div');
      qty.className = 'ds-drawer__qty';
      var minus = document.createElement('button');
      minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('data-ds-drawer-step', '-1'); minus.setAttribute('aria-label', 'Decrease quantity');
      var num = document.createElement('span');
      num.textContent = item.quantity; num.setAttribute('data-ds-drawer-qty-num', '');
      var plus = document.createElement('button');
      plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('data-ds-drawer-step', '1'); plus.setAttribute('aria-label', 'Increase quantity');
      qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);
      var remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'ds-drawer__line-remove'; remove.textContent = 'Remove'; remove.setAttribute('data-ds-drawer-remove', '');
      controls.appendChild(qty); controls.appendChild(remove);
      li.appendChild(controls);
      list.appendChild(li);
    });
  }
  function openDrawer() {
    if (!drawer) return;
    dsCart.get().then(function (cart) {
      paintGlobals(cart);
      renderDrawer(cart);
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-ds-drawer-close]')) { closeDrawer(); return; }
      var step = e.target.closest('[data-ds-drawer-step]');
      var rm = e.target.closest('[data-ds-drawer-remove]');
      if (!step && !rm) return;
      var node = e.target.closest('[data-ds-drawer-line]');
      if (!node) return;
      var line = Array.prototype.indexOf.call(node.parentElement.children, node) + 1;
      var qtyEl = node.querySelector('[data-ds-drawer-qty-num]');
      var next = rm ? 0 : Math.max(0, (parseInt(qtyEl.textContent, 10) || 0) + (parseInt(step.getAttribute('data-ds-drawer-step'), 10) || 0));
      node.classList.add('is-busy');
      dsCart.change(line, next).then(function (cart) {
        paintGlobals(cart);
        renderDrawer(cart);
      }).catch(function () { node.classList.remove('is-busy'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
    // Header cart icon opens the drawer everywhere except the cart page.
    if (!document.querySelector('[data-ds-cart]')) {
      document.querySelectorAll('.ds-header__cart').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
      });
    }
    // Product + sticky ATC forms: AJAX add, then open the drawer
    // instead of navigating away.
    document.querySelectorAll('form[action*="/cart/add"]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var idInput = form.querySelector('input[name="id"]');
        if (!idInput) return; /* let unknown forms submit natively */
        e.preventDefault();
        var qtyInput = form.querySelector('input[name="quantity"]');
        var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        dsCart.add(idInput.value, qty).then(function () {
          if (btn) btn.disabled = false;
          openDrawer();
        }).catch(function () { if (btn) btn.disabled = false; });
      });
    });
  }

  /* ── Sticky ATC visibility ────────────────────────────────────────── */
  var sticky = document.querySelector('[data-ds-sticky]');
  var product = document.getElementById('product');
  // Reserve space at the bottom of the page so the fixed sticky bar never
  // overlaps the last section / footer. We pad the scroll container by the
  // real bar height (recomputed on resize) whenever the bar is showing.
  function dsStickyReserve(on) {
    if (!sticky) return;
    document.body.style.paddingBottom = on ? (sticky.offsetHeight + 'px') : '';
  }
  if (sticky) {
    window.addEventListener('resize', function () {
      if (sticky.classList.contains('is-visible')) dsStickyReserve(true);
    });
  }
  if (sticky && product && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          sticky.classList.remove('is-visible');
          sticky.setAttribute('aria-hidden', 'true');
          dsStickyReserve(false);
        } else if (entry.boundingClientRect.top < 0) {
          sticky.classList.add('is-visible');
          sticky.setAttribute('aria-hidden', 'false');
          dsStickyReserve(true);
        }
      });
    }, { threshold: 0 });
    io.observe(product);
  }

  /* ── Product-form quantity + buy-box bundle tiers ─────────────────
   * The tier radios set the form quantity; the ATC button label shows
   * the live total (units × unit price). Manual qty steppers update
   * the total too. */
  function syncAtcPrice() {
    var priceEl = document.querySelector('[data-ds-atc-price]');
    var qtyInput = document.querySelector('[data-ds-pm-qty]');
    if (!priceEl || !qtyInput) return;
    var unit = parseInt(priceEl.getAttribute('data-unit-cents'), 10) || 0;
    var qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    if (unit) priceEl.textContent = fmtMoney(unit * qty);
  }
  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = parseInt(btn.getAttribute('data-step'), 10) || 0;
      var input = btn.parentElement.querySelector('input[name="quantity"]');
      if (!input) return;
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) + step);
      syncAtcPrice();
    });
  });
  document.querySelectorAll('[data-ds-pm-tier]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var units = parseInt(radio.getAttribute('data-units'), 10) || 1;
      var qtyInput = document.querySelector('[data-ds-pm-qty]');
      if (qtyInput) qtyInput.value = units;
      syncAtcPrice();
    });
  });

  /* ── Gallery thumbnails swap the hero image ───────────────────────── */
  document.querySelectorAll('.ds-product__thumb').forEach(function (t) {
    t.addEventListener('click', function () {
      var src = t.getAttribute('data-src');
      var hero = document.querySelector('.ds-product__hero img');
      if (src && hero) { hero.src = src; hero.removeAttribute('srcset'); }
    });
  });

  /* ── Countdown timers ─────────────────────────────────────────────── */
  document.querySelectorAll('[data-ds-countdown]').forEach(function (el) {
    var end = Date.parse(el.getAttribute('data-end') || '');
    if (!end) return;
    var d = el.querySelector('[data-d]'), h = el.querySelector('[data-h]'),
        m = el.querySelector('[data-m]'), s = el.querySelector('[data-s]');
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function tick() {
      var left = Math.max(0, end - Date.now());
      var sec = Math.floor(left / 1000);
      if (d) d.textContent = pad(Math.floor(sec / 86400));
      if (h) h.textContent = pad(Math.floor((sec % 86400) / 3600));
      if (m) m.textContent = pad(Math.floor((sec % 3600) / 60));
      if (s) s.textContent = pad(sec % 60);
      if (left > 0) setTimeout(tick, 1000);
    }
    tick();
  });

  /* ── Recently-bought corner toast ─────────────────────────────────
   * Slides in from the corner, shows one notification for ~6s, hides
   * for ~12s, then shows the next. Dismiss sticks for the session. */
  document.querySelectorAll('[data-ds-recent-root]').forEach(function (root) {
    var dataEl = root.querySelector('[data-ds-recent-data]');
    var line = root.querySelector('[data-ds-recent]');
    var when = root.querySelector('[data-ds-recent-when]');
    if (!dataEl || !line) return;
    if (sessionStorage.getItem('ds-recent-closed') === '1') { root.classList.add('is-dismissed'); return; }
    var items = [];
    try { items = JSON.parse(dataEl.textContent || '[]'); } catch (e) { return; }
    if (!items.length) return;
    var i = -1;
    function showNext() {
      if (root.classList.contains('is-dismissed')) return;
      i = (i + 1) % items.length;
      var it = items[i];
      line.innerHTML = '<strong></strong> ' + (it.action || 'just bought') + ' <em></em>';
      line.querySelector('strong').textContent = it.name || '';
      line.querySelector('em').textContent = it.product || '';
      if (when) when.textContent = (2 + Math.floor(Math.random() * 38)) + ' min ago · ' + (it.location || '');
      root.classList.add('is-visible');
      root.setAttribute('aria-hidden', 'false');
      setTimeout(function () {
        root.classList.remove('is-visible');
        root.setAttribute('aria-hidden', 'true');
        setTimeout(showNext, 12000);
      }, 6000);
    }
    setTimeout(showNext, 7000);
    var close = root.querySelector('[data-ds-recent-close]');
    if (close) close.addEventListener('click', function () {
      root.classList.add('is-dismissed');
      sessionStorage.setItem('ds-recent-closed', '1');
    });
  });

  /* ── Bundle picker: selected tier drives a real add-to-cart ──────── */
  document.querySelectorAll('[data-ds-bundle]').forEach(function (root) {
    var cta = root.querySelector('[data-ds-bundle-add]');
    function selected() { return root.querySelector('[data-ds-bundle-option]:checked'); }
    function syncLabel() {
      if (!cta) return;
      var opt = selected();
      var base = cta.getAttribute('data-label') || cta.textContent;
      cta.textContent = opt && opt.getAttribute('data-price') ? base + ' — ' + opt.getAttribute('data-price') : base;
    }
    root.querySelectorAll('[data-ds-bundle-option]').forEach(function (r) {
      r.addEventListener('change', syncLabel);
    });
    syncLabel();
    if (!cta) return;
    cta.addEventListener('click', function () {
      var opt = selected();
      var units = opt ? parseInt(opt.getAttribute('data-units'), 10) || 1 : 1;
      var variantId = cta.getAttribute('data-variant-id');
      if (!variantId) return;
      cta.disabled = true;
      var prev = cta.textContent;
      cta.textContent = 'Adding…';
      dsCart.add(variantId, units).then(function () {
        cta.disabled = false;
        cta.textContent = prev;
        if (drawer) openDrawer(); else window.location.href = '/cart';
      }).catch(function () {
        cta.disabled = false;
        cta.textContent = prev;
      });
    });
  });

  /* ── Cart-page wiring (AJAX, no reloads) ──────────────────────────── */
  var cartRoot = document.querySelector('[data-ds-cart]');
  if (cartRoot) {
    function lineNodes() { return Array.prototype.slice.call(cartRoot.querySelectorAll('[data-ds-cart-line]')); }
    function paintCart(cart) {
      paintGlobals(cart);
      cartRoot.querySelectorAll('[data-ds-cart-subtotal]').forEach(function (el) { el.textContent = fmtMoney(cart.total_price); });
      cartRoot.querySelectorAll('[data-ds-cart-count]').forEach(function (el) { el.textContent = cart.item_count; });
      var savings = cartRoot.querySelector('[data-ds-cart-savings]');
      if (savings) {
        savings.hidden = !(cart.total_discount > 0);
        var amt = savings.querySelector('[data-ds-cart-savings-amount]');
        if (amt) amt.textContent = fmtMoney(cart.total_discount);
      }
      var nodes = lineNodes();
      if (cart.items.length !== nodes.length) { window.location.reload(); return; }
      nodes.forEach(function (node, i) {
        var item = cart.items[i];
        node.setAttribute('data-ds-cart-line', String(i + 1));
        var qty = node.querySelector('[data-ds-cart-qty-num]');
        if (qty) qty.textContent = item.quantity;
        var price = node.querySelector('[data-ds-line-price]');
        if (price) price.textContent = fmtMoney(item.final_line_price);
        node.classList.remove('is-busy');
      });
      if (cart.item_count === 0) {
        var filled = cartRoot.querySelector('[data-ds-cart-filled]');
        var empty = cartRoot.querySelector('[data-ds-cart-empty]');
        if (filled) filled.hidden = true;
        if (empty) empty.hidden = false;
        var pill = cartRoot.querySelector('[data-ds-cart-count-pill]');
        if (pill) pill.hidden = true;
      }
    }
    function changeLine(node, qty) {
      var line = lineNodes().indexOf(node) + 1;
      if (line < 1) return;
      node.classList.add('is-busy');
      dsCart.change(line, qty).then(function (cart) {
        if (qty === 0) node.remove();
        paintCart(cart);
      }).catch(function () { node.classList.remove('is-busy'); });
    }
    cartRoot.addEventListener('click', function (e) {
      var step = e.target.closest('[data-ds-cart-step]');
      if (step) {
        var node = step.closest('[data-ds-cart-line]');
        var qtyEl = node.querySelector('[data-ds-cart-qty-num]');
        var next = Math.max(0, (parseInt(qtyEl.textContent, 10) || 0) + (parseInt(step.getAttribute('data-ds-cart-step'), 10) || 0));
        changeLine(node, next);
        return;
      }
      var rm = e.target.closest('[data-ds-cart-remove]');
      if (rm) { changeLine(rm.closest('[data-ds-cart-line]'), 0); return; }
      var more = e.target.closest('[data-ds-cart-add-more]');
      if (more) {
        more.disabled = true;
        dsCart.add(more.getAttribute('data-variant-id'), 1).then(function () {
          return dsCart.get();
        }).then(function (cart) {
          more.disabled = false;
          paintCart(cart);
        }).catch(function () { more.disabled = false; });
      }
    });
    var note = cartRoot.querySelector('[data-ds-cart-note]');
    if (note) {
      note.addEventListener('change', function () { dsCart.update({ note: note.value }).catch(function () {}); });
    }
  }

  /* ── Cart upsell add buttons (real products) ──────────────────────── */
  document.querySelectorAll('[data-ds-upsell-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.disabled = true;
      var prev = btn.textContent;
      btn.textContent = 'Adding…';
      dsCart.add(btn.getAttribute('data-variant-id'), 1).then(function () {
        if (cartRoot) { window.location.reload(); return; }
        btn.disabled = false;
        btn.textContent = prev;
        openDrawer();
      }).catch(function () { btn.disabled = false; btn.textContent = prev; });
    });
  });
})();
`
}

function readme(c: BuildConfig): string {
  const claims = collectClaims(c)
  const checklist = claims
    .map((cl) => `- [ ] ${cl.severity === 'high' ? '🔴' : '🟡'} **${cl.location}** — ${cl.claim}\n      Why: ${cl.why}\n      Fix: ${cl.fix}`)
    .join('\n')
  return `# Zenya Dropship — ${c.storeName || 'Untitled Store'}

Generated by Zenya AI on ${new Date().toISOString().slice(0, 10)}.

## What's inside

A complete Online Store 2.0 Shopify theme tuned for one-product
dropshipping conversions:

- Real add-to-cart everywhere: the buy box, bundle picker, and sticky
  bar automatically attach to your store's product (no editor wiring)
- AJAX cart page: quantity steppers, remove, order notes, free-shipping
  progress, buy-one-more nudge — no page reloads
- Bundle picker (1× / 2× / 3×) that adds the selected quantity to cart
- Feature grid + comparison table, reviews + FAQ, final-CTA banner
- Cart, collection, page, search, 404 fallbacks

Every section is editable in the Shopify theme editor.

## Install

1. Unzip this folder.
2. In Shopify admin → **Online Store → Themes → Add theme → Upload zip**.
3. Add your product (Products → Add product) — the buy buttons attach
   to it automatically.
4. Click **Customize** to edit content/colors.

## ⚠️ Before you launch — the honesty checklist

Parts of this theme were AI-generated and contain information only you
can make true. Go through every item:

${checklist}

## Source

${c.sourceUrl ? `Scraped from: ${c.sourceUrl}` : 'Built from URL scrape via Zenya.'}

Palette: **${c.paletteName}** (${c.paletteVibe})

Built with Zenya AI · https://zenyaai.co
`
}

/* ── Public API ───────────────────────────────────────────────────── */

import { conversionSections }     from './sections/conversion'
import { socialProofSections }    from './sections/social-proof'
import { productExtraSections }   from './sections/product-extras'
import { storytellingSections }   from './sections/storytelling'
import { marketingSections }      from './sections/marketing'
import { sanitizeTemplates }      from './validate'

export function generateTheme(c: BuildConfig): ThemeFiles {
  // Sections defined inline in this file (the original 16). Each is a
  // (BuildConfig) => string and writes to sections/<name>.liquid.
  const coreSections: Record<string, (c: BuildConfig) => string> = {
    'ds-announcement':    sectionAnnouncement,
    'ds-header':          sectionHeader,
    'ds-footer':          sectionFooter,
    'ds-hero':            sectionHero,
    'ds-product-main':    sectionProductMain,
    'ds-bundle':          sectionBundle,
    'ds-features':        sectionFeatures,
    'ds-comparison':      sectionComparison,
    'ds-reviews':         sectionReviews,
    'ds-faq':             sectionFaq,
    'ds-cta':             sectionCta,
    'ds-sticky-atc':      sectionStickyAtc,
    'ds-cart':            sectionCart,
    'ds-collection':      sectionCollection,
    'ds-page':            sectionPage,
    'ds-search':          sectionSearch,
  }

  // All section generators, merged. The expansion files live under
  // lib/build/sections/* — see feedback_theme_sections for why the
  // library has to be deep.
  const allSections: Record<string, (c: BuildConfig) => string> = {
    ...coreSections,
    ...conversionSections,
    ...socialProofSections,
    ...productExtraSections,
    ...storytellingSections,
    ...marketingSections,
  }

  const files: ThemeFiles = {
    'layout/theme.liquid':            fileLayout(c),
    'config/settings_schema.json':    fileSettingsSchema(c),
    'config/settings_data.json':      fileSettingsData(c),
    'locales/en.default.json':        fileLocales(c),
    'sections/header-group.json':     fileHeaderGroup(c),
    'sections/footer-group.json':     fileFooterGroup(c),
    'templates/index.json':           fileIndexTemplate(c),
    'templates/product.json':         fileProductTemplate(c),
    'templates/cart.json':            fileCartTemplate(c),
    'templates/collection.json':      fileCollectionTemplate(c),
    'templates/page.json':            filePageTemplate(c),
    'templates/page.contact.json':    fileContactTemplate(c),
    'templates/page.about.json':      fileAboutTemplate(c),
    'templates/blog.json':            fileBlogTemplate(c),
    'templates/article.json':         fileArticleTemplate(c),
    'templates/search.json':          fileSearchTemplate(c),
    'templates/404.liquid':           file404Template(c),
    'assets/base.css':                assetBaseCss(c),
    'assets/theme.js':                assetThemeJs(c),
    'README.md':                      readme(c),
  }

  for (const [name, fn] of Object.entries(allSections)) {
    files[`sections/${name}.liquid`] = fn(c)
  }

  return sanitizeTemplates(files)
}
