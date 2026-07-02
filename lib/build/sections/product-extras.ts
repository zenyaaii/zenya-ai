/**
 * Product-page conversion extras. These bolt onto the main product
 * section and each replaces a $20-50/mo Shopify app:
 *   • Bold Quantity Breaks    → ds-volume-discount
 *   • ReConvert FBT           → ds-frequently-bought
 *   • Spotlight Product Tabs  → ds-product-tabs
 *   • Globo Q&A               → ds-product-qa
 *   • Easyship date estimator → ds-shipping-estimator
 *   • Kiwi Size Chart         → ds-size-chart
 *   • Loox / Yotpo highlights → ds-product-highlights
 *   • Vimotia recently viewed → ds-recently-viewed
 */
import type { BuildConfig } from '../theme-generator'
import type { SectionMap } from './conversion'

export const productExtraSections: SectionMap = {
  'ds-volume-discount': () => `{%- assign p = product -%}
{%- liquid
  if p == blank or p.id == blank
    assign base_cents = section.settings.fallback_price | times: 100
  else
    assign base_cents = p.selected_or_first_available_variant.price
  endif
-%}
<section class="ds-vd">
  <div class="ds-container">
    <h2 class="ds-vd__title">{{ section.settings.title }}</h2>
    <p class="ds-vd__sub">{{ section.settings.subtitle }}</p>
    <div class="ds-vd__grid">
      {%- for block in section.blocks -%}
        {%- assign disc = block.settings.discount_pct -%}
        {%- assign each_cents = base_cents | times: 100 | minus: base_cents | times: disc | divided_by: 100 -%}
        {%- assign total_cents = each_cents | times: block.settings.qty -%}
        <label class="ds-vd__tier {% if block.settings.featured %}ds-vd__tier--featured{% endif %}" {{ block.shopify_attributes }}>
          {%- if block.settings.featured -%}<div class="ds-vd__rib">{{ block.settings.ribbon }}</div>{%- endif -%}
          <input type="radio" name="ds-vd" {% if block.settings.featured %}checked{% endif %}>
          <div class="ds-vd__qty">Buy {{ block.settings.qty }}</div>
          {%- if disc > 0 -%}
            <div class="ds-vd__save">Save {{ disc }}%</div>
          {%- else -%}
            <div class="ds-vd__save">—</div>
          {%- endif -%}
          <div class="ds-vd__each">{{ each_cents | money }} <span>each</span></div>
          <div class="ds-vd__total">Total {{ total_cents | money }}</div>
        </label>
      {%- endfor -%}
    </div>
    <a href="#product" class="ds-btn ds-btn-primary ds-btn-lg ds-vd__cta">{{ section.settings.cta }}</a>
  </div>
</section>
<style>
  .ds-vd { padding: 3rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-vd__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .4rem; }
  .ds-vd__sub { text-align: center; color: var(--color-muted); margin: 0 0 2rem; }
  .ds-vd__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; max-width: 900px; margin: 0 auto; }
  .ds-vd__tier { position: relative; padding: 1.25rem 1rem; background: var(--color-bg); border: 2px solid var(--color-border); border-radius: var(--radius); text-align: center; cursor: pointer; transition: transform .15s, border-color .15s; }
  .ds-vd__tier:hover { transform: translateY(-2px); }
  .ds-vd__tier--featured { border-color: var(--color-primary); }
  .ds-vd__tier input { position: absolute; top: 1rem; right: 1rem; accent-color: var(--color-primary); }
  .ds-vd__rib { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: var(--color-primary-fg); font-size: .65rem; font-weight: 800; letter-spacing: .12em; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; }
  .ds-vd__qty { font-size: 1.4rem; font-weight: 800; color: var(--color-fg); }
  .ds-vd__save { font-size: .85rem; font-weight: 700; color: var(--color-accent); margin: .25rem 0; }
  .ds-vd__each { color: var(--color-primary); font-weight: 800; font-size: 1.05rem; }
  .ds-vd__each span { font-weight: 500; color: var(--color-muted); font-size: .8rem; }
  .ds-vd__total { color: var(--color-muted); font-size: .78rem; margin-top: .2rem; }
  .ds-vd__cta { display: block; margin: 1.8rem auto 0; max-width: 320px; }
  @media (max-width: 720px) { .ds-vd__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Volume discount",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Quantity-break pricing. Each tier shows per-item price after the discount." },
    { "type": "text",   "id": "title",          "label": "Title", "default": "Buy more, save more" },
    { "type": "text",   "id": "subtitle",       "label": "Subtitle", "default": "Stock up — the more you buy, the less each one costs." },
    { "type": "number", "id": "fallback_price", "label": "Fallback price (no product connected)", "default": 49 },
    { "type": "text",   "id": "cta",            "label": "CTA",  "default": "Add to cart" }
  ],
  "blocks": [
    {
      "type": "tier",
      "name": "Tier",
      "settings": [
        { "type": "number", "id": "qty",         "label": "Quantity", "default": 1 },
        { "type": "range",  "id": "discount_pct","label": "Discount %", "min": 0, "max": 60, "step": 5, "default": 0, "unit": "%" },
        { "type": "checkbox","id": "featured",    "label": "Highlight" },
        { "type": "text",    "id": "ribbon",     "label": "Ribbon",   "default": "Best value" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{ "name": "Volume discount", "blocks": [
      { "type": "tier", "settings": { "qty": 1, "discount_pct": 0 } },
      { "type": "tier", "settings": { "qty": 2, "discount_pct": 15 } },
      { "type": "tier", "settings": { "qty": 3, "discount_pct": 25, "featured": true, "ribbon": "Most popular" } },
      { "type": "tier", "settings": { "qty": 5, "discount_pct": 40 } }
    ] }]
}
{% endschema %}
`,

  'ds-frequently-bought': () => `<section class="ds-fbt">
  <div class="ds-container">
    <h2 class="ds-fbt__title">{{ section.settings.title }}</h2>
    <div class="ds-fbt__row">
      {%- for block in section.blocks -%}
        <label class="ds-fbt__item" {{ block.shopify_attributes }}>
          <input type="checkbox" {% if block.settings.preselected %}checked{% endif %}>
          <div class="ds-fbt__media">
            {%- if block.settings.image != blank -%}
              {{ block.settings.image | image_url: width: 240 | image_tag: alt: block.settings.name, loading: 'lazy' }}
            {%- elsif block.settings.image_url != blank -%}
              <img src="{{ block.settings.image_url }}" alt="{{ block.settings.name | escape }}" width="240" height="240" loading="lazy">
            {%- endif -%}
          </div>
          <div class="ds-fbt__name">{{ block.settings.name }}</div>
          <div class="ds-fbt__price">{{ block.settings.price }}</div>
        </label>
        {%- unless forloop.last -%}<div class="ds-fbt__plus">+</div>{%- endunless -%}
      {%- endfor -%}
    </div>
    <div class="ds-fbt__foot">
      <div>
        <div class="ds-fbt__label">إجمالي الباقة</div>
        <div class="ds-fbt__total">{{ section.settings.bundle_total }}</div>
      </div>
      <a href="#product" class="ds-btn ds-btn-primary ds-btn-lg">{{ section.settings.cta }}</a>
    </div>
  </div>
</section>
<style>
  .ds-fbt { padding: 3rem 0; }
  .ds-fbt__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-fbt__row { display: flex; gap: .5rem; align-items: center; justify-content: center; flex-wrap: wrap; }
  .ds-fbt__item { background: var(--color-surface); border: 2px solid var(--color-border); border-radius: var(--radius); padding: 1rem; width: 180px; text-align: center; cursor: pointer; position: relative; }
  .ds-fbt__item input { position: absolute; top: .5rem; left: .5rem; accent-color: var(--color-primary); }
  .ds-fbt__media { aspect-ratio: 1/1; background: var(--color-bg); border-radius: 10px; overflow: hidden; margin-bottom: .6rem; display: grid; place-items: center; color: var(--color-muted); font-size: .75rem; }
  .ds-fbt__media img { width: 100%; height: 100%; object-fit: cover; }
  .ds-fbt__name { font-weight: 600; font-size: .9rem; color: var(--color-fg); }
  .ds-fbt__price { font-weight: 800; color: var(--color-primary); margin-top: .25rem; }
  .ds-fbt__plus { font-size: 1.4rem; font-weight: 300; color: var(--color-muted); }
  .ds-fbt__foot { display: flex; justify-content: space-between; align-items: center; max-width: 540px; margin: 2rem auto 0; padding: 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-fbt__label { font-size: .72rem; text-transform: uppercase; letter-spacing: .12em; color: var(--color-muted); font-weight: 700; }
  .ds-fbt__total { font-size: 1.6rem; font-weight: 900; color: var(--color-primary); }
</style>
{% schema %}
{
  "name": "Frequently bought",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",        "label": "Title",        "default": "Frequently bought together" },
    { "type": "text", "id": "bundle_total", "label": "Bundle total", "default": "$79.97" },
    { "type": "text", "id": "cta",          "label": "CTA",          "default": "Add all to cart" }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Item",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text", "id": "image_url", "label": "Or image URL (external)" },
        { "type": "text", "id": "name",  "label": "Name",  "default": "This product" },
        { "type": "text", "id": "price", "label": "Price", "default": "$49.99" },
        { "type": "checkbox", "id": "preselected", "label": "Pre-selected", "default": true }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{ "name": "Frequently bought", "blocks": [
      { "type": "item", "settings": { "name": "This product", "price": "$49.99", "preselected": true } },
      { "type": "item", "settings": { "name": "Accessory",    "price": "$19.99", "preselected": true } },
      { "type": "item", "settings": { "name": "Add-on",       "price": "$9.99",  "preselected": false } }
    ] }]
}
{% endschema %}
`,

  'ds-product-highlights': () => `<section class="ds-ph">
  <div class="ds-container">
    <h2 class="ds-ph__title">{{ section.settings.title }}</h2>
    <div class="ds-ph__grid">
      {%- for block in section.blocks -%}
        <div class="ds-ph__card" {{ block.shopify_attributes }}>
          <div class="ds-ph__icon">{{ block.settings.icon }}</div>
          <h3>{{ block.settings.heading }}</h3>
          <p>{{ block.settings.body }}</p>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-ph { padding: 3rem 0; }
  .ds-ph__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-ph__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .ds-ph__card { padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-ph__icon { width: 44px; height: 44px; border-radius: 12px; background: color-mix(in srgb, var(--color-primary) 14%, transparent); display: grid; place-items: center; font-size: 1.4rem; }
  .ds-ph__card h3 { font-size: 1.05rem; margin: .8rem 0 .35rem; }
  .ds-ph__card p { color: var(--color-muted); font-size: .9rem; line-height: 1.5; margin: 0; }
  @media (max-width: 720px) { .ds-ph__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Product highlights",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Why it's different" }
  ],
  "blocks": [
    {
      "type": "highlight",
      "name": "Highlight",
      "settings": [
        { "type": "text", "id": "icon",    "label": "Icon (emoji)", "default": "⚡" },
        { "type": "text", "id": "heading", "label": "Heading",     "default": "Engineered for daily use" },
        { "type": "textarea", "id": "body", "label": "Body",        "default": "Tested to outlast competitors by 3×." }
      ]
    }
  ],
  "max_blocks": 9,
  "presets": [{ "name": "Product highlights", "blocks": [
      { "type": "highlight", "settings": { "icon": "⚡", "heading": "Engineered for daily use", "body": "Tested to outlast competitors by 3×." } },
      { "type": "highlight", "settings": { "icon": "🌱", "heading": "Sustainably sourced",      "body": "Carbon-neutral shipping and packaging." } },
      { "type": "highlight", "settings": { "icon": "🛠️", "heading": "12-month warranty",        "body": "Anything goes wrong, we replace it." } }
    ] }]
}
{% endschema %}
`,

  'ds-product-specs': () => `<section class="ds-specs">
  <div class="ds-container ds-specs__inner">
    <h2 class="ds-specs__title">{{ section.settings.title }}</h2>
    <dl class="ds-specs__list">
      {%- for block in section.blocks -%}
        <div class="ds-specs__row" {{ block.shopify_attributes }}>
          <dt>{{ block.settings.label }}</dt>
          <dd>{{ block.settings.value }}</dd>
        </div>
      {%- endfor -%}
    </dl>
  </div>
</section>
<style>
  .ds-specs { padding: 3rem 0; }
  .ds-specs__inner { max-width: 720px; }
  .ds-specs__title { font-size: clamp(1.3rem, 3vw, 1.8rem); margin: 0 0 1.5rem; }
  .ds-specs__list { display: grid; gap: 0; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; background: var(--color-surface); }
  .ds-specs__row { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; padding: 1rem 1.25rem; }
  .ds-specs__row + .ds-specs__row { border-top: 1px solid var(--color-border); }
  .ds-specs__row dt { font-weight: 700; color: var(--color-muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .1em; }
  .ds-specs__row dd { margin: 0; color: var(--color-fg); font-weight: 500; }
</style>
{% schema %}
{
  "name": "Product specs",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Specs" }
  ],
  "blocks": [
    {
      "type": "spec",
      "name": "Spec",
      "settings": [
        { "type": "text", "id": "label", "label": "Label" },
        { "type": "text", "id": "value", "label": "Value" }
      ]
    }
  ],
  "max_blocks": 20,
  "presets": [{ "name": "Product specs", "blocks": [
      { "type": "spec", "settings": { "label": "Material", "value": "Premium grade" } },
      { "type": "spec", "settings": { "label": "Dimensions", "value": "18 × 12 × 4 cm" } },
      { "type": "spec", "settings": { "label": "Weight", "value": "320 g" } },
      { "type": "spec", "settings": { "label": "Warranty", "value": "12 months" } },
      { "type": "spec", "settings": { "label": "Box contents", "value": "Product, manual, USB-C cable" } }
    ] }]
}
{% endschema %}
`,

  'ds-product-video': () => `<section class="ds-pvideo">
  <div class="ds-container">
    <h2 class="ds-pvideo__title">{{ section.settings.title }}</h2>
    <div class="ds-pvideo__wrap">
      {%- if section.settings.video != blank -%}
        {{ section.settings.video | video_tag: controls: true, image_size: '1500x' }}
      {%- elsif section.settings.video_url != blank -%}
        <iframe src="{{ section.settings.video_url }}" title="فيديو المنتج" loading="lazy" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
      {%- else -%}
        <div class="ds-pvideo__placeholder">أضِف فيديو من إعدادات القسم.</div>
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-pvideo { padding: 3rem 0; }
  .ds-pvideo__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 1.5rem; }
  .ds-pvideo__wrap { max-width: 880px; margin: 0 auto; aspect-ratio: 16/9; background: var(--color-surface); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--color-border); }
  .ds-pvideo__wrap video, .ds-pvideo__wrap iframe { width: 100%; height: 100%; display: block; border: 0; }
  .ds-pvideo__placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--color-muted); font-size: .9rem; }
</style>
{% schema %}
{
  "name": "Product video",
  "tag": "section",
  "settings": [
    { "type": "text",       "id": "title",     "label": "Title", "default": "See it in action" },
    { "type": "video",      "id": "video",     "label": "Upload video" },
    { "type": "video_url",  "id": "video_url", "label": "Or YouTube/Vimeo URL", "accept": ["youtube","vimeo"] }
  ],
  "presets": [{ "name": "Product video" }]
}
{% endschema %}
`,

  'ds-size-chart': () => `{%- liquid
  assign sc_p = product
  if sc_p == blank or sc_p.id == blank
    assign sc_p = collections.all.products.first
  endif
  assign sc_has_size = false
  if sc_p != blank and sc_p.id != blank
    for sc_opt in sc_p.options_with_values
      assign sc_name = sc_opt.name | downcase
      if sc_name contains 'size' or sc_name contains 'مقاس' or sc_name contains 'حجم'
        assign sc_has_size = true
      endif
    endfor
  else
    assign sc_has_size = true
  endif
-%}
{%- if sc_has_size -%}
<section class="ds-sizechart">
  <div class="ds-container ds-sizechart__inner">
    <details class="ds-sizechart__panel" open>
      <summary>
        <span>📐 {{ section.settings.title }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </summary>
      <p class="ds-sizechart__note">{{ section.settings.note }}</p>
      <div class="ds-sizechart__table">
        <div class="ds-sizechart__row ds-sizechart__row--head">
          <div>المقاس</div>
          {%- for h in section.settings.headers -%}<div>{{ h }}</div>{%- endfor -%}
        </div>
        {%- for block in section.blocks -%}
          <div class="ds-sizechart__row" {{ block.shopify_attributes }}>
            <div><strong>{{ block.settings.size }}</strong></div>
            <div>{{ block.settings.col1 }}</div>
            <div>{{ block.settings.col2 }}</div>
            <div>{{ block.settings.col3 }}</div>
          </div>
        {%- endfor -%}
      </div>
    </details>
  </div>
</section>
{%- endif -%}
<style>
  .ds-sizechart { padding: 2rem 0; }
  .ds-sizechart__inner { max-width: 760px; }
  .ds-sizechart__panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 0; }
  .ds-sizechart__panel summary { display: flex; gap: 1rem; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; font-weight: 700; cursor: pointer; list-style: none; }
  .ds-sizechart__panel summary::-webkit-details-marker { display: none; }
  .ds-sizechart__panel[open] summary svg { transform: rotate(180deg); }
  .ds-sizechart__panel summary svg { transition: transform .2s; }
  .ds-sizechart__note { padding: 0 1.25rem; color: var(--color-muted); font-size: .9rem; margin: 0 0 1rem; }
  .ds-sizechart__table { padding: 0 0 1rem; }
  .ds-sizechart__row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: .6rem 1.25rem; font-size: .9rem; }
  .ds-sizechart__row + .ds-sizechart__row { border-top: 1px solid var(--color-border); }
  .ds-sizechart__row--head { background: color-mix(in srgb, var(--color-fg) 5%, transparent); font-weight: 700; font-size: .78rem; text-transform: uppercase; letter-spacing: .1em; color: var(--color-muted); }
</style>
{% schema %}
{
  "name": "Size chart",
  "tag": "section",
  "settings": [
    { "type": "text",     "id": "title",   "label": "Title", "default": "Size guide" },
    { "type": "textarea", "id": "note",    "label": "Note",  "default": "Measurements are in centimetres. When in doubt, size up." },
    { "type": "text",     "id": "headers", "label": "Column headers (comma-sep)", "default": "Chest, Length, Sleeve" }
  ],
  "blocks": [
    {
      "type": "row",
      "name": "Row",
      "settings": [
        { "type": "text", "id": "size", "label": "Size" },
        { "type": "text", "id": "col1", "label": "Col 1" },
        { "type": "text", "id": "col2", "label": "Col 2" },
        { "type": "text", "id": "col3", "label": "Col 3" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Size chart", "blocks": [
      { "type": "row", "settings": { "size": "S",  "col1": "92",  "col2": "66", "col3": "58" } },
      { "type": "row", "settings": { "size": "M",  "col1": "98",  "col2": "68", "col3": "60" } },
      { "type": "row", "settings": { "size": "L",  "col1": "104", "col2": "70", "col3": "62" } },
      { "type": "row", "settings": { "size": "XL", "col1": "112", "col2": "72", "col3": "64" } }
    ] }]
}
{% endschema %}
`,

  'ds-shipping-estimator': () => `<section class="ds-est">
  <div class="ds-container ds-est__inner">
    <div class="ds-est__icon">📦</div>
    <div class="ds-est__copy">
      <div class="ds-est__line">Order in the next <strong>{{ section.settings.cutoff }}</strong> for delivery by</div>
      <div class="ds-est__date" data-ds-est-date>{{ section.settings.deliver_label }}</div>
    </div>
  </div>
</section>
<script>
  (function(){
    var el = document.querySelector('[data-ds-est-date]');
    if (!el) return;
    var days = parseInt(el.getAttribute('data-days') || '4', 10);
    var d = new Date();
    d.setDate(d.getDate() + days);
    var opts = { weekday: 'long', month: 'short', day: 'numeric' };
    el.textContent = d.toLocaleDateString(undefined, opts);
  })();
</script>
<style>
  .ds-est { padding: 1.5rem 0; }
  .ds-est__inner { display: flex; gap: 1rem; align-items: center; padding: 1rem 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); max-width: 540px; margin: 0 auto; }
  .ds-est__icon { font-size: 1.6rem; flex-shrink: 0; }
  .ds-est__line { font-size: .85rem; color: var(--color-muted); }
  .ds-est__line strong { color: var(--color-primary); }
  .ds-est__date { font-weight: 800; color: var(--color-fg); font-size: 1.05rem; margin-top: .15rem; }
</style>
{% schema %}
{
  "name": "Shipping estimator",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Live-calculated delivery date — runs in the browser using the days-from-now setting below." },
    { "type": "text",   "id": "cutoff",        "label": "Cutoff window", "default": "2h 14m" },
    { "type": "number", "id": "days_from_now", "label": "Delivery days from order", "default": 4 },
    { "type": "text",   "id": "deliver_label", "label": "Fallback label",          "default": "in 3-5 business days" }
  ],
  "presets": [{ "name": "Shipping estimator" }]
}
{% endschema %}
`,

  'ds-related-products': () => `<section class="ds-rel">
  <div class="ds-container">
    <h2 class="ds-rel__title">{{ section.settings.title }}</h2>
    <div class="ds-rel__grid">
      {%- if recommendations.products_count > 0 -%}
        {%- for p in recommendations.products limit: section.settings.count -%}
          <a class="ds-rel__card" href="{{ p.url }}">
            {%- if p.featured_image -%}
              {{ p.featured_image | image_url: width: 400 | image_tag: alt: p.title, loading: 'lazy', sizes: '(max-width: 720px) 50vw, 280px', widths: '280, 400, 560' }}
            {%- endif -%}
            <div class="ds-rel__name">{{ p.title }}</div>
            <div class="ds-rel__price">{{ p.price | money }}</div>
          </a>
        {%- endfor -%}
      {%- else -%}
        {%- for block in section.blocks -%}
          <div class="ds-rel__card" {{ block.shopify_attributes }}>
            <div class="ds-rel__placeholder">{{ block.settings.name | slice: 0,1 | upcase }}</div>
            <div class="ds-rel__name">{{ block.settings.name }}</div>
            <div class="ds-rel__price">{{ block.settings.price }}</div>
          </div>
        {%- endfor -%}
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-rel { padding: 3rem 0; }
  .ds-rel__title { text-align: center; font-size: clamp(1.3rem, 3vw, 1.8rem); margin: 0 0 1.5rem; }
  .ds-rel__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-rel__card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; text-decoration: none; color: var(--color-fg); display: block; transition: transform .15s; }
  .ds-rel__card:hover { transform: translateY(-3px); }
  .ds-rel__card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
  .ds-rel__placeholder { aspect-ratio: 1/1; display: grid; place-items: center; background: var(--color-bg); font-size: 2rem; font-weight: 800; color: var(--color-muted); }
  .ds-rel__name { padding: .8rem 1rem .35rem; font-weight: 600; }
  .ds-rel__price { padding: 0 1rem .8rem; color: var(--color-primary); font-weight: 700; }
  @media (max-width: 720px) { .ds-rel__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Related products",
  "tag": "section",
  "settings": [
    { "type": "text",   "id": "title", "label": "Title", "default": "You may also like" },
    { "type": "range",  "id": "count", "label": "Count", "min": 2, "max": 8, "step": 1, "default": 4 }
  ],
  "blocks": [
    {
      "type": "fallback",
      "name": "Fallback card",
      "settings": [
        { "type": "text", "id": "name",  "label": "Name",  "default": "Companion" },
        { "type": "text", "id": "price", "label": "Price", "default": "$29.99" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Related products", "blocks": [
      { "type": "fallback", "settings": { "name": "Travel case", "price": "$19.99" } },
      { "type": "fallback", "settings": { "name": "Refill pack", "price": "$24.99" } },
      { "type": "fallback", "settings": { "name": "Companion",   "price": "$34.99" } },
      { "type": "fallback", "settings": { "name": "Bundle save",  "price": "$59.99" } }
    ] }]
}
{% endschema %}
`,

  'ds-product-tabs': () => `<section class="ds-tabs">
  <div class="ds-container ds-tabs__inner">
    <div class="ds-tabs__nav" role="tablist">
      {%- for block in section.blocks -%}
        <button type="button" class="ds-tabs__btn{% if forloop.first %} is-active{% endif %}" data-ds-tab="{{ forloop.index }}" role="tab">{{ block.settings.label }}</button>
      {%- endfor -%}
    </div>
    {%- for block in section.blocks -%}
      <div class="ds-tabs__panel{% if forloop.first %} is-active{% endif %}" data-ds-tab-panel="{{ forloop.index }}" role="tabpanel" {{ block.shopify_attributes }}>
        {{ block.settings.body }}
      </div>
    {%- endfor -%}
  </div>
</section>
<script>
  (function(){
    var nav = document.querySelectorAll('[data-ds-tab]');
    nav.forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-ds-tab');
        document.querySelectorAll('[data-ds-tab]').forEach(function(x){ x.classList.toggle('is-active', x.getAttribute('data-ds-tab') === id); });
        document.querySelectorAll('[data-ds-tab-panel]').forEach(function(x){ x.classList.toggle('is-active', x.getAttribute('data-ds-tab-panel') === id); });
      });
    });
  })();
</script>
<style>
  .ds-tabs { padding: 3rem 0; }
  .ds-tabs__inner { max-width: 820px; }
  .ds-tabs__nav { display: flex; gap: .25rem; border-bottom: 2px solid var(--color-border); flex-wrap: wrap; }
  .ds-tabs__btn { background: transparent; border: 0; padding: .75rem 1.1rem; cursor: pointer; font-weight: 700; color: var(--color-muted); position: relative; bottom: -2px; }
  .ds-tabs__btn.is-active { color: var(--color-fg); border-bottom: 2px solid var(--color-primary); }
  .ds-tabs__panel { display: none; padding: 1.5rem 0; color: var(--color-fg); line-height: 1.65; }
  .ds-tabs__panel.is-active { display: block; }
</style>
{% schema %}
{
  "name": "Product tabs",
  "tag": "section",
  "settings": [],
  "blocks": [
    {
      "type": "tab",
      "name": "Tab",
      "settings": [
        { "type": "text",     "id": "label", "label": "Label", "default": "Description" },
        { "type": "richtext", "id": "body",  "label": "Body",  "default": "<p>Tell the story behind your product.</p>" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Product tabs", "blocks": [
      { "type": "tab", "settings": { "label": "Description",  "body": "<p>Built for everyday use. Backed by a 30-day promise.</p>" } },
      { "type": "tab", "settings": { "label": "Shipping",     "body": "<p>Ships in 24h from local warehouses. Free over $50.</p>" } },
      { "type": "tab", "settings": { "label": "Returns",      "body": "<p>30 days, no questions asked. We pay the return label.</p>" } },
      { "type": "tab", "settings": { "label": "Care",         "body": "<p>Wipe with a soft cloth. Avoid harsh detergents.</p>" } }
    ] }]
}
{% endschema %}
`,

  'ds-product-qa': () => `<section class="ds-qa">
  <div class="ds-container ds-qa__inner">
    <h2 class="ds-qa__title">{{ section.settings.title }}</h2>
    <p class="ds-qa__sub">{{ section.settings.subtitle }}</p>
    <ul class="ds-qa__list">
      {%- for block in section.blocks -%}
        <li {{ block.shopify_attributes }}>
          <div class="ds-qa__q"><span>Q.</span>{{ block.settings.question }}</div>
          <div class="ds-qa__a"><span>A.</span>{{ block.settings.answer }}<div class="ds-qa__by">— {{ block.settings.answered_by }}</div></div>
        </li>
      {%- endfor -%}
    </ul>
    <form action="{{ routes.contact_url }}" method="post" class="ds-qa__form" accept-charset="UTF-8" enctype="multipart/form-data">
      <input type="hidden" name="form_type" value="contact">
      <input type="hidden" name="utf8" value="✓">
      <input type="hidden" name="contact[tags]" value="product-question">
      <input type="email" name="contact[email]" placeholder="بريدك الإلكتروني" required>
      <textarea name="contact[body]" placeholder="اسأل أي شيء عن هذا المنتج…" required></textarea>
      <button type="submit" class="ds-btn ds-btn-primary">أرسل السؤال</button>
    </form>
  </div>
</section>
<style>
  .ds-qa { padding: 3rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-qa__inner { max-width: 760px; }
  .ds-qa__title { font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .35rem; }
  .ds-qa__sub { color: var(--color-muted); margin: 0 0 1.5rem; }
  .ds-qa__list { list-style: none; padding: 0; display: grid; gap: 1rem; }
  .ds-qa__list li { padding: 1.25rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-qa__q, .ds-qa__a { display: grid; grid-template-columns: 28px 1fr; gap: .4rem; align-items: start; line-height: 1.5; }
  .ds-qa__q span, .ds-qa__a span { font-weight: 800; color: var(--color-primary); }
  .ds-qa__q { font-weight: 700; color: var(--color-fg); }
  .ds-qa__a { color: var(--color-muted); margin-top: .5rem; }
  .ds-qa__by { font-size: .75rem; color: var(--color-muted); margin-top: .35rem; font-style: italic; }
  .ds-qa__form { margin-top: 1.5rem; display: grid; gap: .6rem; }
  .ds-qa__form input, .ds-qa__form textarea { padding: .75rem .9rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-fg); font: inherit; }
  .ds-qa__form textarea { min-height: 90px; resize: vertical; }
</style>
{% schema %}
{
  "name": "Product Q&A",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",    "label": "Title",    "default": "Questions from buyers" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "Real answers from the team and recent customers." }
  ],
  "blocks": [
    {
      "type": "qa",
      "name": "Q&A",
      "settings": [
        { "type": "text",     "id": "question",    "label": "Question" },
        { "type": "textarea", "id": "answer",      "label": "Answer" },
        { "type": "text",     "id": "answered_by", "label": "Answered by", "default": "The team" }
      ]
    }
  ],
  "max_blocks": 10,
  "presets": [{ "name": "Product Q&A", "blocks": [
      { "type": "qa", "settings": { "question": "Is this safe for sensitive skin?", "answer": "Yes — formulated with hypoallergenic ingredients. Tested by dermatologists.", "answered_by": "The team" } },
      { "type": "qa", "settings": { "question": "How long does shipping take?",     "answer": "Tracked 3-5 business days in the US. International 7-12 days.",          "answered_by": "Sarah, Customer Care" } },
      { "type": "qa", "settings": { "question": "Will it work on my model?",        "answer": "Compatible with most modern devices. Check the specs section for exact models.", "answered_by": "Tech support" } }
    ] }]
}
{% endschema %}
`,

  'ds-recently-viewed': () => `<section class="ds-recent-viewed" data-ds-recent-viewed>
  <div class="ds-container">
    <h2 class="ds-recent-viewed__title">{{ section.settings.title }}</h2>
    <div class="ds-recent-viewed__grid" id="ds-recent-viewed-grid">
      <p class="ds-recent-viewed__empty">Nothing yet — browse some products and they'll show up here.</p>
    </div>
  </div>
</section>
<script>
  (function(){
    var KEY = 'ds-recently-viewed';
    var grid = document.getElementById('ds-recent-viewed-grid');
    if (!grid) return;
    if (window.location.pathname.indexOf('/products/') === 0) {
      try {
        var handle = window.location.pathname.split('/products/')[1].split('/')[0];
        var list = JSON.parse(localStorage.getItem(KEY) || '[]');
        list = list.filter(function(h){ return h !== handle; });
        list.unshift(handle);
        list = list.slice(0, 8);
        localStorage.setItem(KEY, JSON.stringify(list));
      } catch (e) {}
    }
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!list.length) return;
      grid.innerHTML = '';
      list.forEach(function(h){
        var a = document.createElement('a');
        a.href = '/products/' + h;
        a.className = 'ds-recent-viewed__card';
        a.textContent = h.replace(/-/g, ' ');
        grid.appendChild(a);
      });
    } catch(e) {}
  })();
</script>
<style>
  .ds-recent-viewed { padding: 3rem 0; }
  .ds-recent-viewed__title { font-size: clamp(1.3rem, 3vw, 1.8rem); margin: 0 0 1.5rem; }
  .ds-recent-viewed__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-recent-viewed__card { padding: 1.5rem 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); text-decoration: none; color: var(--color-fg); font-weight: 600; text-transform: capitalize; }
  .ds-recent-viewed__empty { color: var(--color-muted); font-size: .9rem; grid-column: 1 / -1; }
  @media (max-width: 720px) { .ds-recent-viewed__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Recently viewed",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Tracks product handles in localStorage — no auth needed. Honours the user's last 8 visits." },
    { "type": "text", "id": "title", "label": "Title", "default": "Recently viewed" }
  ],
  "presets": [{ "name": "Recently viewed" }]
}
{% endschema %}
`,
}
