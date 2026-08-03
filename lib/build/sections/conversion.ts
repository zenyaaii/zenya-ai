/**
 * Conversion-focused sections. These cover the workload that a typical
 * dropshipping store offloads to paid Shopify apps:
 *   • Hurrify / Ultimate Sales Boost  → ds-countdown
 *   • Hextom Free Shipping Bar         → ds-free-shipping-bar
 *   • qikify Stock Counter             → ds-stock-counter
 *   • Fomo / Proof recently-bought     → ds-recently-bought
 *   • Trust Hero / TrustBadge          → ds-trust-badges, ds-secure-checkout
 *   • Hextom Promo Bar                 → ds-promo-bar
 *   • Conversion Genie sticky CTA      → ds-floating-cta
 *   • Money-Back Guarantee blocks      → ds-guarantee
 *
 * Each section is fully editable in the Shopify theme editor and
 * driven by the theme's CSS variables so the palette flows through.
 */
import type { BuildConfig } from '../theme-generator'

export type SectionMap = Record<string, (c: BuildConfig) => string>

export const conversionSections: SectionMap = {
  'ds-countdown': () => `<section class="ds-countdown" style="background: var(--color-fg); color: var(--color-bg);">
  <div class="ds-container ds-countdown__inner">
    <div class="ds-countdown__copy">
      <div class="ds-countdown__eyebrow">{{ section.settings.eyebrow }}</div>
      <div class="ds-countdown__title">{{ section.settings.title }}</div>
    </div>
    <div class="ds-countdown__timer" data-ds-countdown data-end="{{ section.settings.end_iso }}">
      <div class="ds-countdown__cell"><span data-d>00</span><label>يوم</label></div>
      <div class="ds-countdown__sep">:</div>
      <div class="ds-countdown__cell"><span data-h>00</span><label>ساعة</label></div>
      <div class="ds-countdown__sep">:</div>
      <div class="ds-countdown__cell"><span data-m>00</span><label>دقيقة</label></div>
      <div class="ds-countdown__sep">:</div>
      <div class="ds-countdown__cell"><span data-s>00</span><label>ثانية</label></div>
    </div>
    {%- if section.settings.cta_label != blank -%}
      <a href="{{ section.settings.cta_url | default: '#product' }}" class="ds-btn ds-btn-on-primary ds-btn-sm">{{ section.settings.cta_label }}</a>
    {%- endif -%}
  </div>
</section>
<style>
  .ds-countdown { padding: 1rem 0; }
  .ds-countdown__inner { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; justify-content: center; }
  .ds-countdown__eyebrow { font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; opacity: .75; }
  .ds-countdown__title { font-size: 1rem; font-weight: 700; margin-top: 2px; }
  .ds-countdown__timer { display: flex; gap: .35rem; align-items: center; }
  .ds-countdown__cell { background: color-mix(in srgb, var(--color-bg) 14%, transparent); padding: .35rem .55rem; border-radius: 8px; text-align: center; min-width: 38px; }
  .ds-countdown__cell span { display: block; font-weight: 800; font-size: 1.05rem; line-height: 1; font-variant-numeric: tabular-nums; }
  .ds-countdown__cell label { display: block; font-size: .58rem; opacity: .7; text-transform: uppercase; letter-spacing: .1em; margin-top: 2px; }
  .ds-countdown__sep { font-weight: 800; opacity: .5; }
</style>
{% schema %}
{
  "name": "Countdown",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Drives urgency with a real ticking timer. The end date is a literal ISO timestamp." },
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Limited offer" },
    { "type": "text", "id": "title",   "label": "Title",   "default": "Sale ends soon" },
    { "type": "text", "id": "end_iso", "label": "End date (YYYY-MM-DDTHH:MM:SSZ)", "default": "2026-12-31T23:59:59Z" },
    { "type": "text", "id": "cta_label", "label": "CTA label", "default": "Shop now" },
    { "type": "url",  "id": "cta_url",   "label": "CTA URL" }
  ],
  "presets": [{ "name": "Countdown" }]
}
{% endschema %}
`,

  'ds-stock-counter': () => `<section class="ds-stock">
  <div class="ds-container ds-stock__inner">
    <div class="ds-stock__pulse"></div>
    <div class="ds-stock__copy">
      <div class="ds-stock__title">{{ section.settings.title | replace: 'COUNT', section.settings.count }}</div>
      <div class="ds-stock__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{ section.settings.percent }}">
        <div class="ds-stock__fill" style="width: {{ section.settings.percent }}%;"></div>
      </div>
      <div class="ds-stock__sub">{{ section.settings.subtitle }}</div>
    </div>
  </div>
</section>
<style>
  .ds-stock { padding: 1.25rem 0; }
  .ds-stock__inner { display: flex; gap: 1rem; align-items: center; padding: 1rem 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); max-width: 720px; margin: 0 auto; }
  .ds-stock__pulse { width: 12px; height: 12px; border-radius: 6px; background: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,.6); animation: ds-pulse 1.6s infinite; flex-shrink: 0; }
  @keyframes ds-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.6); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
  .ds-stock__copy { flex: 1; }
  .ds-stock__title { font-weight: 700; font-size: .95rem; color: var(--color-fg); margin-bottom: .35rem; }
  .ds-stock__bar { height: 6px; background: color-mix(in srgb, var(--color-fg) 8%, transparent); border-radius: 4px; overflow: hidden; }
  .ds-stock__fill { height: 100%; background: linear-gradient(90deg, #ef4444, var(--color-primary)); border-radius: 4px; transition: width .4s ease; }
  .ds-stock__sub { font-size: .78rem; color: var(--color-muted); margin-top: .4rem; }
</style>
{% schema %}
{
  "name": "Stock counter",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Scarcity nudge — shown as a pulsing alert with progress bar. The COUNT placeholder is replaced." },
    { "type": "text", "id": "title",    "label": "Title (use COUNT as placeholder)", "default": "Hurry! Only COUNT left in stock" },
    { "type": "text", "id": "count",    "label": "Stock count", "default": "23" },
    { "type": "range","id": "percent",  "label": "Bar fill %", "min": 0, "max": 100, "step": 5, "default": 25, "unit": "%" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "Once it's gone, it's gone — next restock 2 weeks out." }
  ],
  "presets": [{ "name": "Stock counter" }]
}
{% endschema %}
`,

  'ds-recently-bought': () => `<div class="ds-recent {% if section.settings.position == 'right' %}ds-recent--right{% endif %}" data-ds-recent-root aria-hidden="true">
  <div class="ds-recent__card" aria-live="polite">
    <div class="ds-recent__avatar">{% render 'ds-icon', name: section.settings.icon %}</div>
    <div class="ds-recent__copy">
      <div class="ds-recent__line" data-ds-recent>
        <strong>{{ section.blocks[0].settings.name }}</strong> {{ section.blocks[0].settings.action }} <em>{{ section.blocks[0].settings.product }}</em>
      </div>
      <div class="ds-recent__when" data-ds-recent-when>just now · {{ section.blocks[0].settings.location }}</div>
    </div>
    <div class="ds-recent__check">✓</div>
    <button type="button" class="ds-recent__close" data-ds-recent-close aria-label="Dismiss notifications">×</button>
  </div>
  <script type="application/json" data-ds-recent-data>
    [
      {%- for block in section.blocks -%}
        { "name": {{ block.settings.name | json }}, "action": {{ block.settings.action | json }}, "product": {{ block.settings.product | json }}, "location": {{ block.settings.location | json }} }{%- unless forloop.last -%},{%- endunless -%}
      {%- endfor -%}
    ]
  </script>
</div>
<style>
  .ds-recent { position: fixed; bottom: 1rem; left: 1rem; z-index: 37; max-width: 320px; transform: translateY(150%); opacity: 0; transition: transform .35s ease, opacity .35s ease; pointer-events: none; }
  .ds-recent--right { left: auto; right: 1rem; }
  .ds-recent.is-visible { transform: translateY(0); opacity: 1; pointer-events: auto; }
  .ds-recent.is-dismissed { display: none; }
  .ds-recent__card { position: relative; display: flex; gap: .75rem; align-items: center; padding: .7rem 1.8rem .7rem .9rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 14px; box-shadow: 0 16px 36px -16px rgba(0,0,0,.28); }
  .ds-recent__avatar { width: 34px; height: 34px; border-radius: 17px; background: color-mix(in srgb, var(--color-primary) 14%, transparent); display: grid; place-items: center; flex-shrink: 0; font-size: 15px; }
  .ds-recent__copy { flex: 1; min-width: 0; }
  .ds-recent__line { font-size: .8rem; color: var(--color-fg); line-height: 1.3; }
  .ds-recent__line strong { font-weight: 700; }
  .ds-recent__line em { font-style: normal; font-weight: 600; color: var(--color-primary); }
  .ds-recent__when { font-size: .68rem; color: var(--color-muted); margin-top: 2px; }
  .ds-recent__check { width: 20px; height: 20px; border-radius: 10px; background: #16a34a; color: white; font-size: 12px; display: grid; place-items: center; font-weight: 800; flex-shrink: 0; }
  .ds-recent__close { position: absolute; top: 3px; right: 5px; background: transparent; border: 0; color: var(--color-muted); font-size: 14px; cursor: pointer; padding: 0 4px; line-height: 1; }
  @media (max-width: 540px) { .ds-recent { max-width: calc(100vw - 2rem); } }
</style>
{% schema %}
{
  "name": "Recently bought ticker",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Small corner toast that fades in and out with social-proof notifications. One-tap dismissable." },
    { "type": "select", "id": "position", "label": "Corner", "default": "left", "options": [
      { "value": "left", "label": "Bottom left" },
      { "value": "right", "label": "Bottom right" }
    ] },
    { "type": "text", "id": "icon", "label": "Icon", "default": "🛒" }
  ],
  "blocks": [
    {
      "type": "notification",
      "name": "Notification",
      "settings": [
        { "type": "text", "id": "name",     "label": "Buyer name", "default": "Sarah M." },
        { "type": "text", "id": "action",   "label": "Action verb", "default": "just bought" },
        { "type": "text", "id": "product",  "label": "Product",   "default": "1× Sale Bundle" },
        { "type": "text", "id": "location", "label": "Location",  "default": "Austin, TX" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Recently bought", "blocks": [
      { "type": "notification", "settings": { "name": "Sarah M.",  "action": "just bought", "product": "1× the bundle", "location": "Austin, TX" } },
      { "type": "notification", "settings": { "name": "Jamie L.",  "action": "just bought", "product": "2× pack",       "location": "Brooklyn, NY" } },
      { "type": "notification", "settings": { "name": "Maya R.",   "action": "just bought", "product": "Single",         "location": "Seattle, WA" } },
      { "type": "notification", "settings": { "name": "Daniel K.", "action": "just bought", "product": "Bundle of 3",    "location": "Toronto, ON" } }
    ] }]
}
{% endschema %}
`,

  'ds-free-shipping-bar': () => `{%- assign threshold_cents = section.settings.threshold | times: 100 -%}
{%- assign remaining = threshold_cents | minus: cart.total_price -%}
{%- assign percent = cart.total_price | times: 100 | divided_by: threshold_cents -%}
{%- if percent > 100 -%}{%- assign percent = 100 -%}{%- endif -%}
<section class="ds-ship-bar" data-ds-shipbar data-threshold-cents="{{ threshold_cents }}">
  <div class="ds-container">
    <div class="ds-ship-bar__inner">
      <div class="ds-ship-bar__copy" data-ds-shipbar-copy aria-live="polite">
        {%- if remaining > 0 -%}
          يتبقّى <strong>{{ remaining | money }}</strong> على الشحن المجاني 🚚
        {%- else -%}
          🎉 حصلت على <strong>الشحن المجاني</strong>!
        {%- endif -%}
      </div>
      <div class="ds-ship-bar__track">
        <div class="ds-ship-bar__fill" data-ds-shipbar-fill style="width: {{ percent }}%"></div>
      </div>
    </div>
  </div>
</section>
<style>
  .ds-ship-bar { padding: .75rem 0; background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
  .ds-ship-bar__inner { display: flex; gap: 1rem; align-items: center; }
  .ds-ship-bar__copy { font-size: .85rem; color: var(--color-fg); white-space: nowrap; }
  .ds-ship-bar__track { flex: 1; height: 6px; background: color-mix(in srgb, var(--color-fg) 8%, transparent); border-radius: 4px; overflow: hidden; }
  .ds-ship-bar__fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-primary)); border-radius: 4px; transition: width .35s ease; }
  @media (max-width: 540px) { .ds-ship-bar__inner { flex-direction: column; gap: .5rem; align-items: stretch; } }
</style>
{% schema %}
{
  "name": "Free shipping bar",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Progress bar showing how close the cart is to free shipping. Pairs well with cart or sticky cart drawer." },
    { "type": "number", "id": "threshold", "label": "Free shipping threshold (USD)", "default": 50 }
  ],
  "presets": [{ "name": "Free shipping bar" }]
}
{% endschema %}
`,

  'ds-guarantee': () => `<section class="ds-guarantee" id="guarantee">
  <div class="ds-container ds-guarantee__inner">
    <div class="ds-guarantee__badge">
      <div class="ds-guarantee__seal">{{ section.settings.seal_text }}</div>
      <div class="ds-guarantee__days">{{ section.settings.days }}</div>
    </div>
    <div class="ds-guarantee__copy">
      <h2>{{ section.settings.title }}</h2>
      <p>{{ section.settings.body }}</p>
      <ul>
        {%- for block in section.blocks -%}
          <li {{ block.shopify_attributes }}>
            <span class="ds-guarantee__check" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>{{ block.settings.point }}</span>
          </li>
        {%- endfor -%}
      </ul>
    </div>
  </div>
</section>
<style>
  .ds-guarantee { padding: 4rem 0; }
  .ds-guarantee__inner { display: grid; grid-template-columns: auto 1fr; gap: 3rem; align-items: center; max-width: 900px; margin: 0 auto; }
  .ds-guarantee__badge { width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-primary) 18%, transparent), var(--color-surface) 70%); border: 3px solid var(--color-primary); display: grid; place-items: center; text-align: center; }
  .ds-guarantee__seal { font-size: .68rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--color-primary); }
  .ds-guarantee__days { font-size: 2.6rem; font-weight: 900; line-height: 1; color: var(--color-fg); margin-top: .25rem; letter-spacing: -0.02em; }
  .ds-guarantee__copy h2 { font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .8rem; }
  .ds-guarantee__copy p { color: var(--color-muted); margin: 0 0 1rem; line-height: 1.55; }
  .ds-guarantee__copy ul { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; font-size: .92rem; }
  .ds-guarantee__copy li { display: flex; align-items: center; gap: .6rem; }
  .ds-guarantee__check { flex: none; display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--color-primary) 14%, transparent); color: var(--color-primary); }
  @media (max-width: 720px) {
    .ds-guarantee__inner { grid-template-columns: 1fr; text-align: center; justify-items: center; }
    .ds-guarantee__copy ul { text-align: left; }
  }
</style>
{% schema %}
{
  "name": "Guarantee",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "seal_text", "label": "Seal label", "default": "Money-back" },
    { "type": "text", "id": "days",      "label": "Day count",  "default": "30 days" },
    { "type": "text", "id": "title",     "label": "Title",     "default": "Try it risk-free for 30 days" },
    { "type": "textarea", "id": "body",  "label": "Body",       "default": "If you don't love it, send it back for a full refund — we even cover the return label. Real humans on email, weekdays under 6 hours." }
  ],
  "blocks": [
    {
      "type": "point",
      "name": "Point",
      "settings": [{ "type": "text", "id": "point", "label": "Point" }]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Guarantee", "blocks": [
      { "type": "point", "settings": { "point": "Return for any reason, no questions asked" } },
      { "type": "point", "settings": { "point": "We cover the return shipping label" } },
      { "type": "point", "settings": { "point": "Refund hits your card within 3 days" } }
    ] }]
}
{% endschema %}
`,

  'ds-secure-checkout': () => `<section class="ds-secure">
  <div class="ds-container ds-secure__inner">
    <div class="ds-secure__title">{{ section.settings.title }}</div>
    <div class="ds-secure__icons" aria-label="Accepted payment methods">
      {%- for type in shop.enabled_payment_types limit: 10 -%}
        {{ type | payment_type_svg_tag: class: 'ds-secure__svg' }}
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-secure { padding: 2rem 0; }
  .ds-secure__inner { text-align: center; }
  .ds-secure__title { font-size: .75rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--color-muted); margin-bottom: 1rem; }
  .ds-secure__icons { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; align-items: center; }
  .ds-secure__svg { height: 26px; width: auto; border-radius: 4px; }
</style>
{% schema %}
{
  "name": "Secure checkout badges",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Shows the real payment-method icons enabled on this store's checkout." },
    { "type": "text", "id": "title", "label": "Title", "default": "Secure checkout · 256-bit encrypted" }
  ],
  "presets": [{ "name": "Secure checkout" }]
}
{% endschema %}
`,

  'ds-trust-badges': () => `<section class="ds-trust">
  <div class="ds-container">
    <div class="ds-trust__grid">
      {%- for block in section.blocks -%}
        <div class="ds-trust__item" {{ block.shopify_attributes }}>
          <div class="ds-trust__icon">
            {% render 'ds-icon', name: block.settings.icon %}
          </div>
          <div class="ds-trust__h">{{ block.settings.heading }}</div>
          <div class="ds-trust__b">{{ block.settings.body }}</div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-trust { padding: 3rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-trust__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
  .ds-trust__item { text-align: center; }
  .ds-trust__icon { display: inline-grid; place-items: center; width: 52px; height: 52px; margin: 0 auto .7rem; border-radius: 16px; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-primary); box-shadow: 0 6px 16px -8px rgba(0,0,0,.18); }
  .ds-trust__icon svg { width: 24px; height: 24px; }
  .ds-trust__emoji { font-size: 1.6rem; line-height: 1; }
  .ds-trust__h { font-weight: 800; color: var(--color-fg); font-size: .98rem; }
  .ds-trust__b { color: var(--color-muted); font-size: .85rem; line-height: 1.4; margin-top: .25rem; }
  @media (max-width: 720px) { .ds-trust__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Trust badges row",
  "tag": "section",
  "settings": [],
  "blocks": [
    {
      "type": "badge",
      "name": "Trust badge",
      "settings": [
        { "type": "text", "id": "icon", "label": "Icon (emoji)", "default": "🛡️" },
        { "type": "text", "id": "heading", "label": "Heading", "default": "30-day returns" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "Try it, send it back if it's not right." }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Trust badges", "blocks": [
      { "type": "badge", "settings": { "icon": "🚚", "heading": "Free shipping",   "body": "Tracked delivery in 3-5 days." } },
      { "type": "badge", "settings": { "icon": "🛡️", "heading": "30-day returns",   "body": "We even pay the label." } },
      { "type": "badge", "settings": { "icon": "🔒", "heading": "Secure checkout",  "body": "Stripe-grade encryption." } },
      { "type": "badge", "settings": { "icon": "💬", "heading": "Real-human support","body": "Reply in under 6 hours." } }
    ] }]
}
{% endschema %}
`,

  'ds-floating-cta': () => `<div class="ds-float" data-ds-float aria-hidden="true">
  <div class="ds-float__card">
    {%- if section.settings.image != blank -%}
      <div class="ds-float__media">
        {{ section.settings.image | image_url: width: 180 | image_tag: alt: section.settings.title, loading: 'lazy' }}
      </div>
    {%- elsif section.settings.image_url != blank -%}
      <div class="ds-float__media">
        <img src="{{ section.settings.image_url }}" alt="{{ section.settings.title | escape }}" width="50" height="50" loading="lazy">
      </div>
    {%- endif -%}
    <div class="ds-float__copy">
      <div class="ds-float__title">{{ section.settings.title }}</div>
      <div class="ds-float__sub">{{ section.settings.subtitle }}</div>
    </div>
    <a href="{{ section.settings.cta_url | default: '#product' }}" class="ds-btn ds-btn-primary ds-btn-sm">{{ section.settings.cta }}</a>
    <button type="button" class="ds-float__close" aria-label="Dismiss" data-ds-float-close>×</button>
  </div>
</div>
<style>
  .ds-float { position: fixed; bottom: 1rem; left: 1rem; max-width: 360px; transform: translateY(120%); transition: transform .25s ease; z-index: 38; }
  .ds-float.is-visible { transform: translateY(0); }
  .ds-float.is-dismissed { display: none; }
  .ds-float__card { position: relative; display: flex; gap: .75rem; padding: .75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; box-shadow: 0 16px 36px -16px rgba(0,0,0,.30); align-items: center; }
  .ds-float__media img { width: 50px; height: 50px; object-fit: cover; border-radius: 10px; }
  .ds-float__copy { flex: 1; min-width: 0; }
  .ds-float__title { font-weight: 700; color: var(--color-fg); font-size: .88rem; line-height: 1.15; }
  .ds-float__sub { font-size: .72rem; color: var(--color-muted); margin-top: 2px; }
  .ds-float__close { position: absolute; top: 4px; right: 6px; background: transparent; border: 0; color: var(--color-muted); font-size: 16px; cursor: pointer; padding: 0 4px; }
</style>
<script>
  (function(){
    var el = document.querySelector('[data-ds-float]');
    if (!el) return;
    if (sessionStorage.getItem('ds-float-closed') === '1') { el.classList.add('is-dismissed'); return; }
    setTimeout(function(){ el.classList.add('is-visible'); el.setAttribute('aria-hidden','false'); }, 4000);
    var btn = el.querySelector('[data-ds-float-close]');
    if (btn) btn.addEventListener('click', function(){ el.classList.add('is-dismissed'); sessionStorage.setItem('ds-float-closed','1'); });
  })();
</script>
{% schema %}
{
  "name": "Floating CTA card",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Sticky card that fades in 4 seconds after the page loads. One-tap dismissable. Remembers dismissal per session." },
    { "type": "text", "id": "title",    "label": "Title",    "default": "First-timer? Get 10% off" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "Code TRYME at checkout." },
    { "type": "text", "id": "cta",      "label": "CTA",      "default": "Shop now" },
    { "type": "url",  "id": "cta_url",  "label": "CTA URL" },
    { "type": "image_picker", "id": "image", "label": "Image" },
    { "type": "text", "id": "image_url", "label": "Or image URL (external)" }
  ],
  "presets": [{ "name": "Floating CTA" }]
}
{% endschema %}
`,

  'ds-shipping-info': () => `<section class="ds-shipping">
  <div class="ds-container ds-shipping__grid">
    {%- for block in section.blocks -%}
      <div class="ds-shipping__card" {{ block.shopify_attributes }}>
        <div class="ds-shipping__icon">{% render 'ds-icon', name: block.settings.icon %}</div>
        <div>
          <div class="ds-shipping__h">{{ block.settings.heading }}</div>
          <div class="ds-shipping__b">{{ block.settings.body }}</div>
        </div>
      </div>
    {%- endfor -%}
  </div>
</section>
<style>
  .ds-shipping { padding: 3rem 0; }
  .ds-shipping__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .ds-shipping__card { display: flex; gap: 1rem; padding: 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); align-items: flex-start; }
  .ds-shipping__icon { font-size: 1.6rem; line-height: 1; flex-shrink: 0; }
  .ds-shipping__h { font-weight: 700; color: var(--color-fg); }
  .ds-shipping__b { font-size: .88rem; color: var(--color-muted); margin-top: .25rem; line-height: 1.45; }
  @media (max-width: 720px) { .ds-shipping__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Shipping info",
  "tag": "section",
  "settings": [],
  "blocks": [
    {
      "type": "info",
      "name": "Info",
      "settings": [
        { "type": "text", "id": "icon", "label": "Icon", "default": "🚚" },
        { "type": "text", "id": "heading", "label": "Heading", "default": "Ships in 24h" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "Order by 3pm — leaves our warehouse same day." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Shipping info", "blocks": [
      { "type": "info", "settings": { "icon": "🚚", "heading": "Free shipping over $50",  "body": "Tracked delivery in 3-5 business days, on us." } },
      { "type": "info", "settings": { "icon": "📦", "heading": "Ships from your country", "body": "Local warehouses in US, UK, EU and AU." } },
      { "type": "info", "settings": { "icon": "↩️", "heading": "30-day returns",          "body": "If it's not for you, send it back — refund hits in 3 days." } }
    ] }]
}
{% endschema %}
`,

  'ds-promo-bar': () => `<section class="ds-promo-bar" style="background: {{ section.settings.bg }}; color: {{ section.settings.fg }};">
  <div class="ds-container ds-promo-bar__inner">
    <div class="ds-promo-bar__copy">
      <strong>{{ section.settings.tag }}</strong>
      <span>{{ section.settings.text }}</span>
    </div>
    {%- if section.settings.cta != blank -%}
      <a href="{{ section.settings.cta_url | default: '#' }}" class="ds-promo-bar__cta">{{ section.settings.cta }} →</a>
    {%- endif -%}
  </div>
</section>
<style>
  .ds-promo-bar { padding: .55rem 0; font-size: .85rem; }
  .ds-promo-bar__inner { display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap; }
  .ds-promo-bar__copy strong { font-weight: 800; letter-spacing: .04em; }
  .ds-promo-bar__cta { font-weight: 700; text-decoration: underline; }
</style>
{% schema %}
{
  "name": "Promo bar",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "tag",  "label": "Tag",  "default": "DEAL" },
    { "type": "text", "id": "text", "label": "Text", "default": "Buy 2, get 1 free this week only" },
    { "type": "text", "id": "cta",  "label": "CTA",  "default": "Claim it" },
    { "type": "url",  "id": "cta_url", "label": "CTA URL" },
    { "type": "color","id": "bg", "label": "Background", "default": "#111111" },
    { "type": "color","id": "fg", "label": "Text colour", "default": "#FFFFFF" }
  ],
  "presets": [{ "name": "Promo bar" }]
}
{% endschema %}
`,
}
