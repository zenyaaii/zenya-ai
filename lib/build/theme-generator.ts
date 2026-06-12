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

import { buildTemplate } from './seed'

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
  /** Optional source URL — recorded in README for the merchant. */
  sourceUrl?: string
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
    ],
    c,
  )
  return JSON.stringify(t, null, 2)
}

function fileProductTemplate(c: BuildConfig): string {
  const t = buildTemplate(
    [
      { id: 'ship_est',   type: 'ds-shipping-estimator' },
      { id: 'main',       type: 'ds-product-main' },
      { id: 'volume',     type: 'ds-volume-discount' },
      { id: 'bundle',     type: 'ds-bundle' },
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
      { id: 'related',    type: 'ds-related-products' },
      { id: 'recent',     type: 'ds-recently-viewed' },
      { id: 'guarantee',  type: 'ds-guarantee' },
      { id: 'faq',        type: 'ds-faq' },
      { id: 'cta',        type: 'ds-cta' },
      { id: 'sticky',     type: 'ds-sticky-atc' },
      { id: 'recently',   type: 'ds-recently-bought' },
    ],
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
                {%- if t != blank -%}<li><a href="#">{{ t }}</a></li>{%- endif -%}
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
        { "type": "textarea", "id": "links", "label": "Links (one per line)", "default": "Bestsellers\\nNew arrivals\\nBundle deals" }
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
      { "type": "column", "settings": { "heading": "Shop", "links": "Bestsellers\\nNew arrivals\\nBundle deals" } },
      { "type": "column", "settings": { "heading": "Help", "links": "Shipping\\nReturns\\nContact" } },
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
              <input type="number" name="quantity" value="1" min="1" inputmode="numeric">
              <button type="button" class="ds-qty-btn" data-step="1" aria-label="Increase">+</button>
            </label>
            <button type="submit" class="ds-btn ds-btn-primary ds-btn-xl ds-product__atc">
              Add to cart
            </button>
          </div>
          {{ form | payment_button }}
        {% endform %}
      {%- else -%}
        <div class="ds-product__form">
          <a href="{{ routes.cart_url }}" class="ds-btn ds-btn-primary ds-btn-xl ds-product__atc">Add to cart</a>
          <p class="ds-product__placeholder-note">Connect your product in Shopify to enable checkout.</p>
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
  .ds-product__title { font-size: clamp(1.6rem, 3vw, 2.4rem); margin: .6rem 0 .9rem; letter-spacing: -0.02em; line-height: 1.1; }
  .ds-product__desc { color: var(--color-muted); font-size: .98rem; line-height: 1.55; margin: 0 0 1.4rem; max-width: 52ch; }
  .ds-product__price { display: flex; gap: .75rem; align-items: baseline; margin-bottom: .5rem; }
  .ds-product__price-sale { font-size: 2rem; font-weight: 800; color: var(--color-primary); }
  .ds-product__price-compare { text-decoration: line-through; color: var(--color-muted); font-size: 1.1rem; }
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
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Product", "blocks": [
      { "type": "trust", "settings": { "text": "Free shipping over $50" } },
      { "type": "trust", "settings": { "text": "30-day money-back guarantee" } },
      { "type": "trust", "settings": { "text": "Tracked delivery in 3-5 days" } }
    ] }]
}
{% endschema %}
`
}

function sectionBundle(c: BuildConfig): string {
  const single = moneyCents(c.salePrice)
  const twoFree = moneyCents(c.salePrice * 2)
  const threeFree = moneyCents(c.salePrice * 3)
  return `<section class="ds-bundle">
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
          <input type="radio" name="bundle" {% if block.settings.featured %}checked{% endif %}>
          <div class="ds-bundle__qty">{{ block.settings.qty }}</div>
          <div class="ds-bundle__name">{{ block.settings.name }}</div>
          <div class="ds-bundle__price">{{ block.settings.price }}</div>
          {%- if block.settings.subtext != blank -%}
            <div class="ds-bundle__sub">{{ block.settings.subtext }}</div>
          {%- endif -%}
        </label>
      {%- endfor -%}
    </div>
    <a href="#product" class="ds-btn ds-btn-primary ds-btn-lg ds-bundle__cta">{{ section.settings.cta }}</a>
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
  .ds-bundle__cta { display: block; margin: 2rem auto 0; max-width: 320px; }
  @media (max-width: 720px) {
    .ds-bundle__grid { grid-template-columns: 1fr; }
  }
</style>
{% schema %}
{
  "name": "Bundle",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Save more, get more" },
    { "type": "text", "id": "title", "label": "Title", "default": "Pick your bundle" },
    { "type": "text", "id": "cta",   "label": "CTA",   "default": "Continue to cart" }
  ],
  "blocks": [
    {
      "type": "tier",
      "name": "Tier",
      "settings": [
        { "type": "text", "id": "qty",   "label": "Quantity headline", "default": "1×" },
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
      { "type": "tier", "settings": { "qty": "1×", "name": "Single", "price": "${j(`$${(single / 100).toFixed(2)}`)}", "subtext": "Try it out" } },
      { "type": "tier", "settings": { "qty": "2× + 1 free", "name": "Best value", "price": "${j(`$${(twoFree / 100).toFixed(2)}`)}", "subtext": "${j(`Save vs $${(threeFree / 100).toFixed(2)}`)}", "featured": true, "ribbon": "Most popular" } },
      { "type": "tier", "settings": { "qty": "3× + 2 free", "name": "Bulk", "price": "${j(`$${((single * 3) / 100).toFixed(2)}`)}", "subtext": "Stock the shelf" } }
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
  return `<section class="ds-reviews">
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
          <div class="ds-stars">★★★★★</div>
          <h3 class="ds-reviews__quote">{{ block.settings.headline }}</h3>
          <p class="ds-reviews__body">{{ block.settings.body }}</p>
          <div class="ds-reviews__author">{{ block.settings.author }} <span>· {{ block.settings.location }}</span></div>
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
        { "type": "text", "id": "headline", "label": "Headline" },
        { "type": "textarea", "id": "body", "label": "Body" },
        { "type": "text", "id": "author", "label": "Author" },
        { "type": "text", "id": "location", "label": "Location" }
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
  return `<section class="ds-faq">
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
    <a href="#product" class="ds-btn ds-btn-on-primary ds-btn-xl">{{ section.settings.cta }}</a>
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
    { "type": "text", "id": "cta",      "label": "CTA",      "default": "Add to cart" }
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
  return `<section class="ds-cart-page">
  <div class="ds-container">
    <h1>{{ 'general.cart.title' | t }}</h1>
    {%- if cart.item_count > 0 -%}
      <form action="{{ routes.cart_url }}" method="post" novalidate>
        <ul class="ds-cart__list">
          {%- for item in cart.items -%}
            <li class="ds-cart__item">
              {{ item.image | image_url: width: 160 | image_tag: alt: item.title, loading: 'lazy' }}
              <div class="ds-cart__info">
                <div class="ds-cart__name">{{ item.product.title }}</div>
                {%- unless item.product.has_only_default_variant -%}
                  <div class="ds-cart__variant">{{ item.variant.title }}</div>
                {%- endunless -%}
                <div class="ds-cart__price">{{ item.final_line_price | money }}</div>
              </div>
              <input type="number" name="updates[]" value="{{ item.quantity }}" min="0" aria-label="Quantity">
            </li>
          {%- endfor -%}
        </ul>
        <div class="ds-cart__foot">
          <div>
            <div class="ds-cart__label">{{ 'general.cart.subtotal' | t }}</div>
            <div class="ds-cart__total">{{ cart.total_price | money }}</div>
          </div>
          <div class="ds-cart__actions">
            <button type="submit" name="update" class="ds-btn">Update</button>
            <button type="submit" name="checkout" class="ds-btn ds-btn-primary">{{ 'general.cart.checkout' | t }}</button>
          </div>
        </div>
      </form>
    {%- else -%}
      <p>{{ 'general.cart.empty' | t }}</p>
      <a href="{{ routes.root_url }}" class="ds-btn ds-btn-primary">Continue shopping</a>
    {%- endif -%}
  </div>
</section>
<style>
  .ds-cart-page { padding: 3rem 0; }
  .ds-cart__list { list-style: none; padding: 0; display: grid; gap: 1rem; margin: 2rem 0; }
  .ds-cart__item { display: grid; grid-template-columns: 96px 1fr 80px; gap: 1rem; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); align-items: center; }
  .ds-cart__item img { width: 96px; height: 96px; object-fit: cover; border-radius: calc(var(--radius) * .5); }
  .ds-cart__name { font-weight: 700; }
  .ds-cart__variant { color: var(--color-muted); font-size: .85rem; }
  .ds-cart__price { font-weight: 700; color: var(--color-primary); }
  .ds-cart__foot { display: flex; justify-content: space-between; gap: 1rem; padding: 1.2rem 0; border-top: 1px solid var(--color-border); margin-top: 1.5rem; }
  .ds-cart__label { font-size: .8rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .1em; }
  .ds-cart__total { font-size: 1.6rem; font-weight: 800; color: var(--color-fg); }
  .ds-cart__actions { display: flex; gap: .6rem; align-items: center; }
</style>
{% schema %}
{
  "name": "Cart",
  "tag": "section",
  "settings": [],
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
  padding: .8rem 1.4rem; border: 0; border-radius: var(--radius);
  background: var(--color-surface); color: var(--color-fg);
  border: 1px solid var(--color-border);
  font-weight: 700; font-size: .95rem; text-decoration: none; cursor: pointer;
  transition: transform .12s ease, opacity .12s ease, box-shadow .12s ease;
  line-height: 1;
}
.ds-btn:hover { transform: translateY(-1px); }
.ds-btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border-color: transparent;
  box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--color-primary) 40%, transparent);
}
.ds-btn-on-primary {
  background: var(--color-primary-fg);
  color: var(--color-primary);
  border-color: transparent;
}
.ds-btn-sm { padding: .55rem .9rem; font-size: .85rem; }
.ds-btn-lg { padding: 1rem 1.6rem; font-size: 1.02rem; }
.ds-btn-xl { padding: 1.2rem 1.8rem; font-size: 1.08rem; }

.ds-stars { color: var(--color-accent); letter-spacing: 2px; font-size: 14px; }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`
}

function assetThemeJs(_c: BuildConfig): string {
  return `/* Zenya Dropship · client behaviour. Keep small + dependency-free. */
(function () {
  // Sticky ATC visibility — show once the user scrolls past the main
  // ATC button, hide if they return to it. We use IntersectionObserver
  // on the #product section: invisible = sticky on, visible = sticky off.
  var sticky = document.querySelector('[data-ds-sticky]');
  var product = document.getElementById('product');
  if (sticky && product && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          sticky.classList.remove('is-visible');
          sticky.setAttribute('aria-hidden', 'true');
        } else if (entry.boundingClientRect.top < 0) {
          sticky.classList.add('is-visible');
          sticky.setAttribute('aria-hidden', 'false');
        }
      });
    }, { threshold: 0 });
    io.observe(product);
  }

  // Quantity buttons.
  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = parseInt(btn.getAttribute('data-step'), 10) || 0;
      var input = btn.parentElement.querySelector('input[name="quantity"]');
      if (!input) return;
      var v = Math.max(1, (parseInt(input.value, 10) || 1) + step);
      input.value = v;
    });
  });

  // Thumbnail click swaps hero.
  document.querySelectorAll('.ds-product__thumb').forEach(function (t) {
    t.addEventListener('click', function () {
      var src = t.getAttribute('data-src');
      var hero = document.querySelector('.ds-product__hero img');
      if (src && hero) hero.src = src;
    });
  });
})();
`
}

function readme(c: BuildConfig): string {
  return `# Zenya Dropship — ${c.storeName || 'Untitled Store'}

Generated by Zenya AI on ${new Date().toISOString().slice(0, 10)}.

## What's inside

A complete Online Store 2.0 Shopify theme tuned for one-product
dropshipping conversions:

- Sticky add-to-cart bar (shows when the main CTA scrolls off)
- Bundle picker (1× / 2× + 1 free / 3× + 2 free)
- Feature grid + comparison table
- Reviews + FAQ
- Final-CTA banner
- Cart, collection, page, search, 404 fallbacks

Every section is editable in the Shopify theme editor.

## Install

1. Unzip this folder.
2. In Shopify admin → **Online Store → Themes → Add theme → Upload zip**.
3. After upload, click **Customize** to edit content/colors.
4. Optional: set the homepage section's product to your real product
   on Shopify so checkout pulls live inventory + prices.

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
