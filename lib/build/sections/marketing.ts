/**
 * Marketing + page-specific sections.
 *
 * Covers:
 *   • Promo banner & callouts        → ds-promo-banner, ds-featured-product, ds-featured-collection
 *   • Email capture (Klaviyo et al.) → ds-newsletter, ds-newsletter-modal
 *   • Instagram embeds               → ds-instagram
 *   • Blog teasers / lookbook        → ds-blog-grid, ds-gallery, ds-video
 *   • Utility / generic layout       → ds-rich-text, ds-image, ds-quote, ds-multi-column, ds-icon-list, ds-divider
 *   • Cart extras                    → ds-cart-upsell, ds-cart-shipping-bar, ds-cart-guarantee
 *   • Contact page                   → ds-contact-form, ds-contact-info
 *   • Blog / article                 → ds-blog-list, ds-article-main, ds-article-author, ds-article-related
 */
import type { BuildConfig } from '../theme-generator'
import type { SectionMap } from './conversion'

export const marketingSections: SectionMap = {
  'ds-promo-banner': () => `<section class="ds-promo">
  <div class="ds-container">
    <div class="ds-promo__card" {%- if section.settings.image != blank -%}style="background-image: url({{ section.settings.image | image_url: width: 1800 }});"{%- elsif section.settings.image_url != blank -%}style="background-image: url({{ section.settings.image_url }});"{%- endif -%}>
      <div class="ds-promo__overlay" style="background: linear-gradient(135deg, rgba(0,0,0,{{ section.settings.dim }}) 0%, rgba(0,0,0,{{ section.settings.dim }}) 100%);"></div>
      <div class="ds-promo__copy">
        <div class="ds-promo__eyebrow">{{ section.settings.eyebrow }}</div>
        <h2>{{ section.settings.title }}</h2>
        <p>{{ section.settings.subtitle }}</p>
        <a href="{{ section.settings.cta_url | default: '#' }}" class="ds-btn ds-btn-on-primary ds-btn-lg">{{ section.settings.cta }}</a>
      </div>
    </div>
  </div>
</section>
<style>
  .ds-promo { padding: 3rem 0; }
  .ds-promo__card { position: relative; min-height: 380px; border-radius: calc(var(--radius) * 1.5); overflow: hidden; background-size: cover; background-position: center; display: flex; align-items: center; padding: 3rem; color: white; }
  .ds-promo__overlay { position: absolute; inset: 0; }
  .ds-promo__copy { position: relative; z-index: 1; max-width: 480px; }
  .ds-promo__eyebrow { font-size: .82rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--color-accent); }
  .ds-promo__card h2 { font-size: clamp(1.6rem, 3vw, 2.6rem); margin: .8rem 0 1rem; letter-spacing: -0.02em; }
  .ds-promo__card p { font-size: 1rem; margin: 0 0 1.5rem; opacity: .9; }
</style>
{% schema %}
{
  "name": "Promo banner",
  "tag": "section",
  "settings": [
    { "type": "image_picker", "id": "image",   "label": "Background image" },
    { "type": "text",         "id": "image_url", "label": "Or background URL (external)" },
    { "type": "text",         "id": "eyebrow", "label": "Eyebrow", "default": "Sale" },
    { "type": "text",         "id": "title",   "label": "Title",   "default": "Up to 40% off summer drop" },
    { "type": "textarea",     "id": "subtitle","label": "Subtitle", "default": "Limited stock — ends Sunday." },
    { "type": "text",         "id": "cta",     "label": "CTA",     "default": "Shop the sale" },
    { "type": "url",          "id": "cta_url", "label": "CTA URL" },
    { "type": "range",        "id": "dim",     "label": "Overlay opacity", "min": 0, "max": 90, "step": 5, "default": 45, "unit": "%" }
  ],
  "presets": [{ "name": "Promo banner" }]
}
{% endschema %}
`,

  'ds-featured-product': () => `<section class="ds-fproduct">
  <div class="ds-container ds-fproduct__grid">
    <div class="ds-fproduct__media">
      {%- if section.settings.image != blank -%}
        {{ section.settings.image | image_url: width: 1400 | image_tag: alt: section.settings.title, loading: 'lazy', sizes: '(max-width: 880px) 100vw, 50vw' }}
      {%- elsif section.settings.image_url != blank -%}
        <img src="{{ section.settings.image_url }}" alt="{{ section.settings.title | escape }}" width="1400" height="1400" loading="lazy">
      {%- endif -%}
    </div>
    <div class="ds-fproduct__copy">
      <div class="ds-fproduct__rating">★★★★★ <span>{{ section.settings.reviews }}</span></div>
      <h2>{{ section.settings.title }}</h2>
      <p>{{ section.settings.subtitle }}</p>
      <div class="ds-fproduct__price">
        <span class="ds-fproduct__sale">{{ section.settings.price }}</span>
        {%- if section.settings.compare != blank -%}<span class="ds-fproduct__compare">{{ section.settings.compare }}</span>{%- endif -%}
      </div>
      <a href="{{ section.settings.cta_url | default: '#product' }}" class="ds-btn ds-btn-primary ds-btn-xl">{{ section.settings.cta }}</a>
      <ul class="ds-fproduct__bullets">
        {%- for block in section.blocks -%}
          <li {{ block.shopify_attributes }}>✓ {{ block.settings.point }}</li>
        {%- endfor -%}
      </ul>
    </div>
  </div>
</section>
<style>
  .ds-fproduct { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-fproduct__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
  .ds-fproduct__media img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: calc(var(--radius) * 1.5); }
  .ds-fproduct__rating { color: var(--color-accent); letter-spacing: 2px; }
  .ds-fproduct__rating span { color: var(--color-muted); font-size: .85rem; margin-left: .5rem; letter-spacing: 0; }
  .ds-fproduct__copy h2 { font-size: clamp(1.6rem, 3vw, 2.6rem); margin: .6rem 0 .8rem; letter-spacing: -0.02em; }
  .ds-fproduct__copy p { color: var(--color-muted); font-size: 1rem; margin: 0 0 1.5rem; line-height: 1.5; max-width: 48ch; }
  .ds-fproduct__price { display: flex; gap: .75rem; align-items: baseline; margin-bottom: 1.5rem; }
  .ds-fproduct__sale { font-size: 2rem; font-weight: 800; color: var(--color-primary); }
  .ds-fproduct__compare { color: var(--color-muted); text-decoration: line-through; }
  .ds-fproduct__bullets { list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: .35rem; font-size: .9rem; }
  @media (max-width: 880px) { .ds-fproduct__grid { grid-template-columns: 1fr; gap: 2rem; } }
</style>
{% schema %}
{
  "name": "Featured product",
  "tag": "section",
  "settings": [
    { "type": "image_picker", "id": "image",    "label": "Image" },
    { "type": "text",         "id": "image_url", "label": "Or image URL (external)" },
    { "type": "text",         "id": "title",    "label": "Title", "default": "The bestseller" },
    { "type": "textarea",     "id": "subtitle", "label": "Subtitle", "default": "Our flagship product, refined over 3 versions." },
    { "type": "text",         "id": "price",    "label": "Price",   "default": "$49.99" },
    { "type": "text",         "id": "compare",  "label": "Compare-at", "default": "$99.99" },
    { "type": "text",         "id": "reviews",  "label": "Reviews", "default": "(2,431 reviews)" },
    { "type": "text",         "id": "cta",      "label": "CTA", "default": "Add to cart" },
    { "type": "url",          "id": "cta_url",  "label": "CTA URL" }
  ],
  "blocks": [
    {
      "type": "bullet",
      "name": "Bullet",
      "settings": [{ "type": "text", "id": "point", "label": "Bullet" }]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Featured product", "blocks": [
      { "type": "bullet", "settings": { "point": "Free shipping over $50" } },
      { "type": "bullet", "settings": { "point": "30-day money-back guarantee" } },
      { "type": "bullet", "settings": { "point": "Ships within 24 hours" } }
    ] }]
}
{% endschema %}
`,

  'ds-featured-collection': () => `<section class="ds-fcoll">
  <div class="ds-container">
    <div class="ds-fcoll__head">
      <div>
        <div class="ds-fcoll__eyebrow">{{ section.settings.eyebrow }}</div>
        <h2 class="ds-fcoll__title">{{ section.settings.title }}</h2>
      </div>
      {%- if section.settings.see_all != blank -%}
        <a href="{{ section.settings.see_all_url | default: '/collections/all' }}" class="ds-fcoll__see">{{ section.settings.see_all }} →</a>
      {%- endif -%}
    </div>
    <div class="ds-fcoll__grid">
      {%- assign coll = collections[section.settings.collection] -%}
      {%- if coll.products.size > 0 -%}
        {%- for p in coll.products limit: section.settings.count -%}
          <a class="ds-fcoll__card" href="{{ p.url }}">
            {%- if p.featured_image -%}
              {{ p.featured_image | image_url: width: 500 | image_tag: alt: p.title, loading: 'lazy' }}
            {%- endif -%}
            <div class="ds-fcoll__name">{{ p.title }}</div>
            <div class="ds-fcoll__price">{{ p.price | money }}</div>
          </a>
        {%- endfor -%}
      {%- else -%}
        {%- for block in section.blocks -%}
          <div class="ds-fcoll__card" {{ block.shopify_attributes }}>
            <div class="ds-fcoll__placeholder">{{ block.settings.name | slice: 0,1 | upcase }}</div>
            <div class="ds-fcoll__name">{{ block.settings.name }}</div>
            <div class="ds-fcoll__price">{{ block.settings.price }}</div>
          </div>
        {%- endfor -%}
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-fcoll { padding: 4rem 0; }
  .ds-fcoll__head { display: flex; gap: 1rem; justify-content: space-between; align-items: end; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .ds-fcoll__eyebrow { font-size: .8rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); }
  .ds-fcoll__title { font-size: clamp(1.4rem, 3vw, 2rem); margin: .35rem 0 0; }
  .ds-fcoll__see { color: var(--color-primary); font-weight: 700; text-decoration: none; }
  .ds-fcoll__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-fcoll__card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; text-decoration: none; color: var(--color-fg); display: block; transition: transform .15s; }
  .ds-fcoll__card:hover { transform: translateY(-3px); }
  .ds-fcoll__card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
  .ds-fcoll__placeholder { aspect-ratio: 1/1; display: grid; place-items: center; background: var(--color-bg); font-size: 2rem; font-weight: 800; color: var(--color-muted); }
  .ds-fcoll__name { padding: .8rem 1rem .25rem; font-weight: 600; }
  .ds-fcoll__price { padding: 0 1rem .8rem; color: var(--color-primary); font-weight: 700; }
  @media (max-width: 720px) { .ds-fcoll__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Featured collection",
  "tag": "section",
  "settings": [
    { "type": "text",       "id": "eyebrow", "label": "Eyebrow", "default": "Shop" },
    { "type": "text",       "id": "title",   "label": "Title",   "default": "Bestsellers" },
    { "type": "collection", "id": "collection", "label": "Collection" },
    { "type": "range",      "id": "count",   "label": "Count",   "min": 2, "max": 12, "step": 1, "default": 8 },
    { "type": "text",       "id": "see_all", "label": "See all label", "default": "See all" },
    { "type": "url",        "id": "see_all_url", "label": "See all URL" }
  ],
  "blocks": [
    {
      "type": "fallback",
      "name": "Fallback",
      "settings": [
        { "type": "text", "id": "name", "label": "Name", "default": "Product" },
        { "type": "text", "id": "price","label": "Price","default": "$49.99" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Featured collection", "blocks": [
      { "type": "fallback", "settings": { "name": "Bestseller", "price": "$49.99" } },
      { "type": "fallback", "settings": { "name": "New",        "price": "$39.99" } },
      { "type": "fallback", "settings": { "name": "Bundle",     "price": "$89.99" } },
      { "type": "fallback", "settings": { "name": "Refill",     "price": "$19.99" } }
    ] }]
}
{% endschema %}
`,

  'ds-newsletter': () => `<section class="ds-news">
  <div class="ds-container ds-news__inner">
    <div class="ds-news__copy">
      <div class="ds-news__eyebrow">{{ section.settings.eyebrow }}</div>
      <h2>{{ section.settings.title }}</h2>
      <p>{{ section.settings.subtitle }}</p>
    </div>
    {% form 'customer', class: 'ds-news__form' %}
      <input type="hidden" name="contact[tags]" value="newsletter">
      <input type="email" name="contact[email]" placeholder="you@example.com" required>
      <button type="submit" class="ds-btn ds-btn-primary ds-btn-lg">{{ section.settings.cta }}</button>
      {%- if form.posted_successfully? -%}
        <p class="ds-news__ok">Thanks — check your inbox.</p>
      {%- endif -%}
    {% endform %}
  </div>
</section>
<style>
  .ds-news { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-news__inner { max-width: 720px; margin: 0 auto; text-align: center; }
  .ds-news__eyebrow { font-size: .82rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); }
  .ds-news__copy h2 { font-size: clamp(1.5rem, 3vw, 2.2rem); margin: .5rem 0 .5rem; }
  .ds-news__copy p { color: var(--color-muted); margin: 0 0 1.5rem; max-width: 50ch; margin-inline: auto; }
  .ds-news__form { display: flex; gap: .5rem; max-width: 480px; margin: 0 auto; }
  .ds-news__form input { flex: 1; padding: .9rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-fg); font: inherit; }
  .ds-news__ok { color: #16a34a; margin-top: .8rem; font-weight: 600; }
</style>
{% schema %}
{
  "name": "Newsletter",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "eyebrow",  "label": "Eyebrow",  "default": "Insiders" },
    { "type": "text", "id": "title",    "label": "Title",    "default": "Get the drop first" },
    { "type": "textarea", "id": "subtitle", "label": "Subtitle", "default": "Restock alerts and members-only deals. No spam — unsubscribe in one click." },
    { "type": "text", "id": "cta",      "label": "CTA",      "default": "Subscribe" }
  ],
  "presets": [{ "name": "Newsletter" }]
}
{% endschema %}
`,

  'ds-instagram': () => `<section class="ds-ig">
  <div class="ds-container">
    <div class="ds-ig__head">
      <h2>{{ section.settings.title }}</h2>
      {%- if section.settings.handle != blank -%}
        <a href="{{ section.settings.url | default: '#' }}" target="_blank" rel="noreferrer">{{ section.settings.handle }} ↗</a>
      {%- endif -%}
    </div>
    <div class="ds-ig__grid">
      {%- for block in section.blocks -%}
        <a class="ds-ig__cell" href="{{ block.settings.post_url | default: '#' }}" target="_blank" rel="noreferrer" {{ block.shopify_attributes }}>
          {%- if block.settings.image != blank -%}
            {{ block.settings.image | image_url: width: 500 | image_tag: alt: block.settings.alt, loading: 'lazy' }}
          {%- elsif block.settings.image_url != blank -%}
            <img src="{{ block.settings.image_url }}" alt="{{ block.settings.alt | escape }}" width="500" height="500" loading="lazy">
          {%- else -%}
            <div class="ds-ig__placeholder">📷</div>
          {%- endif -%}
        </a>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-ig { padding: 3rem 0; }
  .ds-ig__head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 1.5rem; }
  .ds-ig__head h2 { font-size: clamp(1.3rem, 3vw, 1.8rem); margin: 0; }
  .ds-ig__head a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
  .ds-ig__grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
  .ds-ig__cell { aspect-ratio: 1/1; overflow: hidden; background: var(--color-surface); display: block; }
  .ds-ig__cell img { width: 100%; height: 100%; object-fit: cover; transition: transform .25s; }
  .ds-ig__cell:hover img { transform: scale(1.05); }
  .ds-ig__placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--color-muted); font-size: 1.5rem; }
  @media (max-width: 880px) { .ds-ig__grid { grid-template-columns: repeat(4, 1fr); } }
</style>
{% schema %}
{
  "name": "Instagram feed",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",  "label": "Title",  "default": "Follow along" },
    { "type": "text", "id": "handle", "label": "Handle", "default": "@yourbrand" },
    { "type": "url",  "id": "url",    "label": "URL" }
  ],
  "blocks": [
    {
      "type": "post",
      "name": "Post",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text", "id": "image_url", "label": "Or image URL (external)" },
        { "type": "text", "id": "alt", "label": "Alt text" },
        { "type": "url",  "id": "post_url", "label": "Post URL" }
      ]
    }
  ],
  "max_blocks": 16,
  "presets": [{ "name": "Instagram", "blocks": [
      { "type": "post" }, { "type": "post" }, { "type": "post" }, { "type": "post" },
      { "type": "post" }, { "type": "post" }, { "type": "post" }, { "type": "post" }
    ] }]
}
{% endschema %}
`,

  'ds-blog-grid': () => `<section class="ds-bgrid">
  <div class="ds-container">
    <h2 class="ds-bgrid__title">{{ section.settings.title }}</h2>
    <div class="ds-bgrid__row">
      {%- assign blog_obj = blogs[section.settings.blog] -%}
      {%- if blog_obj.articles_count > 0 -%}
        {%- for a in blog_obj.articles limit: section.settings.count -%}
          <a class="ds-bgrid__card" href="{{ a.url }}">
            {%- if a.image -%}{{ a.image | image_url: width: 600 | image_tag: alt: a.title, loading: 'lazy' }}{%- endif -%}
            <div class="ds-bgrid__meta">{{ a.published_at | date: '%b %d' }} · {{ a.author }}</div>
            <h3>{{ a.title }}</h3>
            <p>{{ a.excerpt_or_content | strip_html | truncate: 120 }}</p>
          </a>
        {%- endfor -%}
      {%- else -%}
        {%- for block in section.blocks -%}
          <div class="ds-bgrid__card" {{ block.shopify_attributes }}>
            <div class="ds-bgrid__placeholder"></div>
            <div class="ds-bgrid__meta">{{ block.settings.meta }}</div>
            <h3>{{ block.settings.title }}</h3>
            <p>{{ block.settings.excerpt }}</p>
          </div>
        {%- endfor -%}
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-bgrid { padding: 4rem 0; }
  .ds-bgrid__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-bgrid__row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .ds-bgrid__card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; text-decoration: none; color: var(--color-fg); display: block; }
  .ds-bgrid__card img { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; }
  .ds-bgrid__placeholder { aspect-ratio: 16/10; background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent)); }
  .ds-bgrid__meta { padding: 1rem 1.25rem .25rem; font-size: .78rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .1em; }
  .ds-bgrid__card h3 { padding: 0 1.25rem; font-size: 1.1rem; margin: 0 0 .5rem; }
  .ds-bgrid__card p { padding: 0 1.25rem 1.25rem; color: var(--color-muted); margin: 0; line-height: 1.5; font-size: .9rem; }
  @media (max-width: 720px) { .ds-bgrid__row { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Blog grid",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "From the journal" },
    { "type": "blog", "id": "blog", "label": "Blog" },
    { "type": "range","id": "count","label": "Count", "min": 1, "max": 12, "step": 1, "default": 3 }
  ],
  "blocks": [
    {
      "type": "fallback",
      "name": "Fallback post",
      "settings": [
        { "type": "text", "id": "title",   "label": "Title",   "default": "Why we chose this material" },
        { "type": "text", "id": "meta",    "label": "Meta",    "default": "MAR 12 · BY MAYA" },
        { "type": "textarea", "id": "excerpt", "label": "Excerpt", "default": "It cost us more but lasted twice as long in our testing." }
      ]
    }
  ],
  "max_blocks": 9,
  "presets": [{ "name": "Blog grid", "blocks": [
      { "type": "fallback", "settings": { "title": "Why we chose this material",   "meta": "MAR 12 · MAYA",  "excerpt": "It cost us more but lasted twice as long in our testing." } },
      { "type": "fallback", "settings": { "title": "Behind the box",                "meta": "MAR 06 · ALEX",  "excerpt": "Our packaging redesign cut waste by 40%." } },
      { "type": "fallback", "settings": { "title": "What customers taught us",      "meta": "FEB 28 · SARAH", "excerpt": "Three lessons from 2,400 emails this quarter." } }
    ] }]
}
{% endschema %}
`,

  'ds-gallery': () => `<section class="ds-gal">
  <div class="ds-container">
    {%- if section.settings.title != blank -%}<h2 class="ds-gal__title">{{ section.settings.title }}</h2>{%- endif -%}
    <div class="ds-gal__grid" style="--cols: {{ section.settings.columns }};">
      {%- for block in section.blocks -%}
        <div class="ds-gal__cell" {{ block.shopify_attributes }}>
          {%- if block.settings.image != blank -%}
            {{ block.settings.image | image_url: width: 1000 | image_tag: alt: block.settings.caption, loading: 'lazy' }}
          {%- elsif block.settings.image_url != blank -%}
            <img src="{{ block.settings.image_url }}" alt="{{ block.settings.caption | escape }}" width="1000" height="1000" loading="lazy">
          {%- endif -%}
          {%- if block.settings.caption != blank -%}<div class="ds-gal__cap">{{ block.settings.caption }}</div>{%- endif -%}
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-gal { padding: 3rem 0; }
  .ds-gal__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 1.5rem; }
  .ds-gal__grid { display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); gap: .75rem; }
  .ds-gal__cell { position: relative; aspect-ratio: 1/1; overflow: hidden; border-radius: var(--radius); background: var(--color-surface); }
  .ds-gal__cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ds-gal__cap { position: absolute; left: 0; right: 0; bottom: 0; padding: .6rem .8rem; background: linear-gradient(to top, rgba(0,0,0,.7), transparent); color: white; font-size: .8rem; }
  @media (max-width: 720px) { .ds-gal__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Gallery",
  "tag": "section",
  "settings": [
    { "type": "text",  "id": "title",   "label": "Title" },
    { "type": "range", "id": "columns", "label": "Columns", "min": 2, "max": 5, "step": 1, "default": 3 }
  ],
  "blocks": [
    {
      "type": "image",
      "name": "Image",
      "settings": [
        { "type": "image_picker", "id": "image",   "label": "Image" },
        { "type": "text",         "id": "image_url", "label": "Or image URL (external)" },
        { "type": "text",         "id": "caption", "label": "Caption" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Gallery", "blocks": [
      { "type": "image" }, { "type": "image" }, { "type": "image" },
      { "type": "image" }, { "type": "image" }, { "type": "image" }
    ] }]
}
{% endschema %}
`,

  'ds-video': () => `<section class="ds-video">
  <div class="ds-container">
    {%- if section.settings.title != blank -%}<h2 class="ds-video__title">{{ section.settings.title }}</h2>{%- endif -%}
    <div class="ds-video__wrap">
      {%- if section.settings.video != blank -%}
        {{ section.settings.video | video_tag: controls: true, image_size: '1500x' }}
      {%- elsif section.settings.video_url != blank -%}
        <iframe src="{{ section.settings.video_url }}" title="Video" loading="lazy" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-video { padding: 3rem 0; }
  .ds-video__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 1.5rem; }
  .ds-video__wrap { max-width: 1000px; margin: 0 auto; aspect-ratio: 16/9; background: var(--color-surface); border-radius: var(--radius); overflow: hidden; }
  .ds-video__wrap video, .ds-video__wrap iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>
{% schema %}
{
  "name": "Video",
  "tag": "section",
  "settings": [
    { "type": "text",       "id": "title",     "label": "Title" },
    { "type": "video",      "id": "video",     "label": "Video file" },
    { "type": "video_url",  "id": "video_url", "label": "YouTube/Vimeo URL", "accept": ["youtube","vimeo"] }
  ],
  "presets": [{ "name": "Video" }]
}
{% endschema %}
`,

  'ds-rich-text': () => `<section class="ds-rt">
  <div class="ds-container ds-rt__inner" style="text-align: {{ section.settings.alignment }};">
    {%- if section.settings.eyebrow != blank -%}<div class="ds-rt__eyebrow">{{ section.settings.eyebrow }}</div>{%- endif -%}
    {%- if section.settings.heading != blank -%}<h2 class="ds-rt__h">{{ section.settings.heading }}</h2>{%- endif -%}
    <div class="ds-rt__b">{{ section.settings.body }}</div>
    {%- if section.settings.cta != blank -%}
      <a href="{{ section.settings.cta_url | default: '#' }}" class="ds-btn ds-btn-primary ds-btn-lg ds-rt__cta">{{ section.settings.cta }}</a>
    {%- endif -%}
  </div>
</section>
<style>
  .ds-rt { padding: 3rem 0; }
  .ds-rt__inner { max-width: 720px; margin: 0 auto; }
  .ds-rt__eyebrow { font-size: .8rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); margin-bottom: .8rem; }
  .ds-rt__h { font-size: clamp(1.5rem, 3vw, 2.4rem); margin: 0 0 1rem; letter-spacing: -0.02em; }
  .ds-rt__b { color: var(--color-fg); line-height: 1.65; font-size: 1rem; }
  .ds-rt__b p { margin: 0 0 1rem; }
  .ds-rt__b h3 { margin: 1.5rem 0 .5rem; font-size: 1.2rem; }
  .ds-rt__cta { margin-top: 1.5rem; }
</style>
{% schema %}
{
  "name": "Rich text",
  "tag": "section",
  "settings": [
    { "type": "text",     "id": "eyebrow",  "label": "Eyebrow" },
    { "type": "text",     "id": "heading",  "label": "Heading", "default": "About this story" },
    { "type": "richtext", "id": "body",     "label": "Body",    "default": "<p>Write anything here. Use it for an about blurb, policy notes, or a hand-written welcome.</p>" },
    { "type": "select",   "id": "alignment","label": "Alignment", "default": "center",
      "options": [
        { "value": "left",   "label": "Left" },
        { "value": "center", "label": "Center" },
        { "value": "right",  "label": "Right" }
      ]
    },
    { "type": "text",     "id": "cta",      "label": "CTA" },
    { "type": "url",      "id": "cta_url",  "label": "CTA URL" }
  ],
  "presets": [{ "name": "Rich text" }]
}
{% endschema %}
`,

  'ds-quote': () => `<section class="ds-quote-sec">
  <div class="ds-container ds-quote-sec__inner">
    <span class="ds-quote-sec__mark">"</span>
    <blockquote>{{ section.settings.quote }}</blockquote>
    <div class="ds-quote-sec__by">— {{ section.settings.author }}</div>
  </div>
</section>
<style>
  .ds-quote-sec { padding: 4rem 0; }
  .ds-quote-sec__inner { max-width: 720px; margin: 0 auto; text-align: center; }
  .ds-quote-sec__mark { font-family: Georgia, serif; font-size: 5rem; line-height: .8; color: var(--color-accent); opacity: .35; }
  .ds-quote-sec__inner blockquote { font-size: clamp(1.3rem, 3vw, 1.8rem); line-height: 1.4; margin: 1rem 0 1.5rem; font-weight: 500; letter-spacing: -0.01em; }
  .ds-quote-sec__by { color: var(--color-muted); font-size: .85rem; text-transform: uppercase; letter-spacing: .14em; font-weight: 700; }
</style>
{% schema %}
{
  "name": "Quote",
  "tag": "section",
  "settings": [
    { "type": "textarea", "id": "quote",  "label": "Quote",  "default": "An honest product made by people who care." },
    { "type": "text",     "id": "author", "label": "Author", "default": "Vogue" }
  ],
  "presets": [{ "name": "Quote" }]
}
{% endschema %}
`,

  'ds-multi-column': () => `<section class="ds-mcol">
  <div class="ds-container">
    {%- if section.settings.title != blank -%}<h2 class="ds-mcol__title">{{ section.settings.title }}</h2>{%- endif -%}
    <div class="ds-mcol__grid" style="--cols: {{ section.settings.columns }};">
      {%- for block in section.blocks -%}
        <div class="ds-mcol__col" {{ block.shopify_attributes }}>
          {%- if block.settings.image != blank -%}
            {{ block.settings.image | image_url: width: 600 | image_tag: alt: block.settings.heading, loading: 'lazy' }}
          {%- endif -%}
          <h3>{{ block.settings.heading }}</h3>
          <div class="ds-mcol__body">{{ block.settings.body }}</div>
          {%- if block.settings.cta != blank -%}
            <a href="{{ block.settings.cta_url | default: '#' }}" class="ds-mcol__link">{{ block.settings.cta }} →</a>
          {%- endif -%}
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-mcol { padding: 4rem 0; }
  .ds-mcol__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-mcol__grid { display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); gap: 1.5rem; }
  .ds-mcol__col img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: var(--radius); margin-bottom: 1rem; }
  .ds-mcol__col h3 { font-size: 1.1rem; margin: 0 0 .5rem; }
  .ds-mcol__body { color: var(--color-muted); line-height: 1.5; font-size: .92rem; }
  .ds-mcol__body p { margin: 0 0 .8rem; }
  .ds-mcol__link { display: inline-block; margin-top: .8rem; color: var(--color-primary); font-weight: 700; text-decoration: none; }
  @media (max-width: 720px) { .ds-mcol__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Multi-column",
  "tag": "section",
  "settings": [
    { "type": "text",  "id": "title",  "label": "Title" },
    { "type": "range", "id": "columns","label": "Columns", "min": 2, "max": 4, "step": 1, "default": 3 }
  ],
  "blocks": [
    {
      "type": "column",
      "name": "Column",
      "settings": [
        { "type": "image_picker", "id": "image",   "label": "Image" },
        { "type": "text",         "id": "heading", "label": "Heading", "default": "Column heading" },
        { "type": "richtext",     "id": "body",    "label": "Body",    "default": "<p>Describe this column.</p>" },
        { "type": "text",         "id": "cta",     "label": "CTA" },
        { "type": "url",          "id": "cta_url", "label": "CTA URL" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Multi-column", "blocks": [{ "type": "column" }, { "type": "column" }, { "type": "column" }] }]
}
{% endschema %}
`,

  'ds-icon-list': () => `<section class="ds-iclist">
  <div class="ds-container">
    {%- if section.settings.title != blank -%}<h2 class="ds-iclist__title">{{ section.settings.title }}</h2>{%- endif -%}
    <ul class="ds-iclist__list">
      {%- for block in section.blocks -%}
        <li {{ block.shopify_attributes }}>
          <div class="ds-iclist__icon">{{ block.settings.icon }}</div>
          <div>
            <div class="ds-iclist__h">{{ block.settings.heading }}</div>
            <div class="ds-iclist__b">{{ block.settings.body }}</div>
          </div>
        </li>
      {%- endfor -%}
    </ul>
  </div>
</section>
<style>
  .ds-iclist { padding: 3rem 0; }
  .ds-iclist__title { text-align: center; font-size: clamp(1.3rem, 3vw, 1.8rem); margin: 0 0 1.5rem; }
  .ds-iclist__list { list-style: none; padding: 0; margin: 0 auto; max-width: 720px; display: grid; gap: 1rem; }
  .ds-iclist__list li { display: grid; grid-template-columns: 44px 1fr; gap: 1rem; padding: 1.2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); align-items: start; }
  .ds-iclist__icon { width: 44px; height: 44px; border-radius: 22px; background: color-mix(in srgb, var(--color-primary) 14%, transparent); display: grid; place-items: center; font-size: 1.3rem; }
  .ds-iclist__h { font-weight: 700; color: var(--color-fg); }
  .ds-iclist__b { color: var(--color-muted); font-size: .9rem; margin-top: .25rem; line-height: 1.5; }
</style>
{% schema %}
{
  "name": "Icon list",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Why us" }
  ],
  "blocks": [
    {
      "type": "row",
      "name": "Row",
      "settings": [
        { "type": "text", "id": "icon",    "label": "Icon", "default": "✓" },
        { "type": "text", "id": "heading", "label": "Heading", "default": "Always free shipping" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "Tracked delivery in 3-5 days, every time." }
      ]
    }
  ],
  "max_blocks": 10,
  "presets": [{ "name": "Icon list", "blocks": [
      { "type": "row", "settings": { "icon": "🚚", "heading": "Always free shipping",     "body": "Tracked delivery in 3-5 days, every time." } },
      { "type": "row", "settings": { "icon": "↩️", "heading": "Return for any reason",    "body": "30 days, no questions asked, we pay the label." } },
      { "type": "row", "settings": { "icon": "💬", "heading": "Real humans on email",      "body": "Reply within 6 hours, weekdays." } }
    ] }]
}
{% endschema %}
`,

  'ds-image-sec': () => `<section class="ds-img">
  <div class="ds-container ds-img__inner" style="max-width: {{ section.settings.width }}px;">
    {%- if section.settings.image != blank -%}
      {{ section.settings.image | image_url: width: 2000 | image_tag: alt: section.settings.caption, loading: 'lazy', sizes: '(max-width: 720px) 100vw, 1140px' }}
    {%- endif -%}
    {%- if section.settings.caption != blank -%}<div class="ds-img__cap">{{ section.settings.caption }}</div>{%- endif -%}
  </div>
</section>
<style>
  .ds-img { padding: 2rem 0; }
  .ds-img__inner { margin: 0 auto; }
  .ds-img__inner img { width: 100%; height: auto; border-radius: var(--radius); display: block; }
  .ds-img__cap { text-align: center; color: var(--color-muted); font-size: .85rem; margin-top: .8rem; }
</style>
{% schema %}
{
  "name": "Image",
  "tag": "section",
  "settings": [
    { "type": "image_picker", "id": "image",   "label": "Image" },
    { "type": "text",         "id": "caption", "label": "Caption" },
    { "type": "range",        "id": "width",   "label": "Max width", "min": 600, "max": 1320, "step": 40, "default": 1000, "unit": "px" }
  ],
  "presets": [{ "name": "Image" }]
}
{% endschema %}
`,

  'ds-divider': () => `<section class="ds-divider">
  <div class="ds-container ds-divider__inner">
    {%- if section.settings.style == 'line' -%}
      <hr class="ds-divider__line">
    {%- elsif section.settings.style == 'ornament' -%}
      <div class="ds-divider__orn">{{ section.settings.ornament }}</div>
    {%- else -%}
      <div style="height: {{ section.settings.height }}px;"></div>
    {%- endif -%}
  </div>
</section>
<style>
  .ds-divider__inner { padding: 1rem 0; }
  .ds-divider__line { border: 0; height: 1px; background: var(--color-border); margin: 0; }
  .ds-divider__orn { text-align: center; color: var(--color-muted); font-size: 1.4rem; letter-spacing: 1.4rem; }
</style>
{% schema %}
{
  "name": "Divider",
  "tag": "section",
  "settings": [
    { "type": "select", "id": "style",  "label": "Style", "default": "line",
      "options": [
        { "value": "line",      "label": "Hairline" },
        { "value": "space",     "label": "Empty space" },
        { "value": "ornament",  "label": "Ornament" }
      ]
    },
    { "type": "range", "id": "height", "label": "Empty-space height", "min": 16, "max": 200, "step": 8, "default": 48, "unit": "px" },
    { "type": "text",  "id": "ornament", "label": "Ornament", "default": "···" }
  ],
  "presets": [{ "name": "Divider" }]
}
{% endschema %}
`,

  'ds-cart-upsell': () => `{%- comment -%}
  Real-product recommender: shows store products that aren't in the cart
  yet, with one-tap AJAX add. Renders nothing when there's nothing real
  to recommend — no fake companion items.
{%- endcomment -%}
{%- assign in_cart = cart.items | map: 'product_id' -%}
{%- capture cup_cards -%}
  {%- assign shown = 0 -%}
  {%- for prod in collections.all.products limit: 8 -%}
    {%- unless in_cart contains prod.id -%}
      {%- if shown < 3 and prod.available -%}
        <div class="ds-cup__card">
          {%- if prod.featured_image -%}
            <a href="{{ prod.url }}">{{ prod.featured_image | image_url: width: 240 | image_tag: alt: prod.title, loading: 'lazy' }}</a>
          {%- endif -%}
          <div class="ds-cup__body">
            <a class="ds-cup__name" href="{{ prod.url }}">{{ prod.title }}</a>
            <div class="ds-cup__price">{{ prod.price | money }}</div>
            <button type="button" class="ds-btn ds-btn-sm" data-ds-upsell-add data-variant-id="{{ prod.selected_or_first_available_variant.id }}">Add</button>
          </div>
        </div>
        {%- assign shown = shown | plus: 1 -%}
      {%- endif -%}
    {%- endunless -%}
  {%- endfor -%}
{%- endcapture -%}
{%- if cup_cards contains 'ds-cup__card' -%}
<section class="ds-cup">
  <div class="ds-container">
    <h2 class="ds-cup__title">{{ section.settings.title }}</h2>
    <div class="ds-cup__row">{{ cup_cards }}</div>
  </div>
</section>
{%- endif -%}
<style>
  .ds-cup { padding: 2.5rem 0; }
  .ds-cup__title { font-size: clamp(1.2rem, 2.5vw, 1.6rem); margin: 0 0 1.2rem; }
  .ds-cup__row { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
  .ds-cup__card { display: flex; gap: .75rem; padding: .75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); align-items: center; }
  .ds-cup__card img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
  .ds-cup__body { flex: 1; min-width: 0; }
  .ds-cup__name { font-weight: 700; font-size: .9rem; color: var(--color-fg); text-decoration: none; display: block; }
  .ds-cup__price { color: var(--color-primary); font-weight: 800; font-size: .9rem; margin: .25rem 0 .5rem; }
  .ds-cup__card .ds-btn[disabled] { opacity: .6; cursor: wait; }
  @media (max-width: 720px) { .ds-cup__row { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Cart upsell",
  "tag": "section",
  "settings": [
    { "type": "paragraph", "content": "Automatically recommends store products that aren't in the cart yet. Hidden when there's nothing to recommend." },
    { "type": "text", "id": "title", "label": "Title", "default": "You may also like" }
  ],
  "presets": [{ "name": "Cart upsell" }]
}
{% endschema %}
`,

  'ds-contact-form': () => `<section class="ds-cf">
  <div class="ds-container ds-cf__grid">
    <div class="ds-cf__copy">
      <div class="ds-cf__eyebrow">{{ section.settings.eyebrow }}</div>
      <h2>{{ section.settings.title }}</h2>
      <p>{{ section.settings.subtitle }}</p>
      <ul class="ds-cf__info">
        {%- for block in section.blocks -%}
          <li {{ block.shopify_attributes }}>
            <strong>{{ block.settings.label }}</strong>
            <span>{{ block.settings.value }}</span>
          </li>
        {%- endfor -%}
      </ul>
    </div>
    {% form 'contact', class: 'ds-cf__form' %}
      {%- if form.posted_successfully? -%}<div class="ds-cf__ok">Thanks — we'll reply within 6 hours.</div>{%- endif -%}
      {%- if form.errors -%}
        <div class="ds-cf__err">
          {%- for field in form.errors -%}<div>{{ form.errors.translated_fields[field] | capitalize }} {{ form.errors.messages[field] }}</div>{%- endfor -%}
        </div>
      {%- endif -%}
      <div class="ds-cf__row">
        <label>الاسم<input type="text" name="contact[name]" required></label>
        <label>البريد الإلكتروني<input type="email" name="contact[email]" required></label>
      </div>
      <label>الموضوع<input type="text" name="contact[subject]"></label>
      <label>الرسالة<textarea name="contact[body]" rows="5" required></textarea></label>
      <button type="submit" class="ds-btn ds-btn-primary ds-btn-lg">إرسال الرسالة</button>
    {% endform %}
  </div>
</section>
<style>
  .ds-cf { padding: 4rem 0; }
  .ds-cf__grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 3rem; align-items: start; }
  .ds-cf__eyebrow { font-size: .82rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); }
  .ds-cf__copy h2 { font-size: clamp(1.5rem, 3vw, 2.4rem); margin: .5rem 0 .8rem; }
  .ds-cf__copy p { color: var(--color-muted); margin: 0 0 1.5rem; line-height: 1.5; }
  .ds-cf__info { list-style: none; padding: 0; margin: 0; display: grid; gap: .8rem; }
  .ds-cf__info li { display: flex; flex-direction: column; gap: 2px; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-cf__info strong { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: var(--color-muted); }
  .ds-cf__form { display: grid; gap: .9rem; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-cf__form label { display: grid; gap: .35rem; font-size: .85rem; font-weight: 600; color: var(--color-fg); }
  .ds-cf__form input, .ds-cf__form textarea { padding: .8rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-fg); font: inherit; }
  .ds-cf__row { display: grid; grid-template-columns: 1fr 1fr; gap: .9rem; }
  .ds-cf__ok { padding: .8rem 1rem; background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.3); border-radius: var(--radius); color: #16a34a; }
  .ds-cf__err { padding: .8rem 1rem; background: rgba(220,38,38,.1); border: 1px solid rgba(220,38,38,.3); border-radius: var(--radius); color: #b91c1c; }
  @media (max-width: 880px) { .ds-cf__grid { grid-template-columns: 1fr; gap: 2rem; } .ds-cf__row { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Contact form",
  "tag": "section",
  "settings": [
    { "type": "text",     "id": "eyebrow",  "label": "Eyebrow",  "default": "Talk to us" },
    { "type": "text",     "id": "title",    "label": "Title",    "default": "We answer every email" },
    { "type": "textarea", "id": "subtitle", "label": "Subtitle", "default": "No bots, no forms-from-hell. Real humans on the other end." }
  ],
  "blocks": [
    {
      "type": "info",
      "name": "Info row",
      "settings": [
        { "type": "text", "id": "label", "label": "Label", "default": "Email" },
        { "type": "text", "id": "value", "label": "Value", "default": "hi@yourstore.com" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Contact form", "blocks": [
      { "type": "info", "settings": { "label": "Email",   "value": "hi@yourstore.com" } },
      { "type": "info", "settings": { "label": "Hours",   "value": "Mon-Fri 9am-6pm" } },
      { "type": "info", "settings": { "label": "Reply by","value": "Within 6 hours" } }
    ] }]
}
{% endschema %}
`,

  'ds-blog-list': () => `<section class="ds-blog">
  <div class="ds-container">
    <header class="ds-blog__head">
      <h1>{{ blog.title | default: 'Journal' }}</h1>
      {%- if blog.metafields.global.description != blank -%}<p>{{ blog.metafields.global.description }}</p>{%- endif -%}
    </header>
    {%- paginate blog.articles by section.settings.per_page -%}
      <div class="ds-blog__grid">
        {%- for a in blog.articles -%}
          <a class="ds-blog__card" href="{{ a.url }}">
            {%- if a.image -%}{{ a.image | image_url: width: 800 | image_tag: alt: a.title, loading: 'lazy' }}{%- else -%}<div class="ds-blog__placeholder"></div>{%- endif -%}
            <div class="ds-blog__meta">{{ a.published_at | date: '%b %d, %Y' }} · {{ a.author }}</div>
            <h2>{{ a.title }}</h2>
            <p>{{ a.excerpt_or_content | strip_html | truncate: 160 }}</p>
          </a>
        {%- else -%}
          <p>No posts yet — check back soon.</p>
        {%- endfor -%}
      </div>
      {%- if paginate.pages > 1 -%}
        <nav class="ds-blog__pages">
          {%- if paginate.previous -%}<a href="{{ paginate.previous.url }}">← Newer</a>{%- endif -%}
          <span>Page {{ paginate.current_page }} of {{ paginate.pages }}</span>
          {%- if paginate.next -%}<a href="{{ paginate.next.url }}">Older →</a>{%- endif -%}
        </nav>
      {%- endif -%}
    {%- endpaginate -%}
  </div>
</section>
<style>
  .ds-blog { padding: 3rem 0; }
  .ds-blog__head { text-align: center; margin-bottom: 2rem; }
  .ds-blog__head h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 0; }
  .ds-blog__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .ds-blog__card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; text-decoration: none; color: var(--color-fg); }
  .ds-blog__card img, .ds-blog__placeholder { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent)); }
  .ds-blog__meta { padding: 1rem 1.25rem .35rem; font-size: .78rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .1em; }
  .ds-blog__card h2 { padding: 0 1.25rem; font-size: 1.15rem; margin: 0 0 .5rem; }
  .ds-blog__card p { padding: 0 1.25rem 1.25rem; color: var(--color-muted); margin: 0; font-size: .92rem; line-height: 1.5; }
  .ds-blog__pages { display: flex; gap: 1rem; justify-content: center; align-items: center; margin-top: 2rem; }
  .ds-blog__pages a { color: var(--color-primary); font-weight: 700; text-decoration: none; }
  @media (max-width: 720px) { .ds-blog__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Blog list",
  "tag": "section",
  "settings": [
    { "type": "range", "id": "per_page", "label": "Posts per page", "min": 3, "max": 24, "step": 3, "default": 9 }
  ],
  "presets": [{ "name": "Blog list" }]
}
{% endschema %}
`,

  'ds-article-main': () => `<article class="ds-art">
  <div class="ds-container ds-art__inner">
    <header class="ds-art__head">
      <a href="{{ blog.url }}" class="ds-art__back">← {{ blog.title | default: 'Back to journal' }}</a>
      <h1>{{ article.title }}</h1>
      <div class="ds-art__meta">{{ article.published_at | date: '%b %d, %Y' }} · By {{ article.author }} · {{ article.content | strip_html | split: ' ' | size | divided_by: 200 | plus: 1 }} min read</div>
      {%- if article.image -%}
        <div class="ds-art__hero">{{ article.image | image_url: width: 1600 | image_tag: alt: article.title, loading: 'eager', sizes: '(max-width: 720px) 100vw, 720px' }}</div>
      {%- endif -%}
    </header>
    <div class="ds-art__body">{{ article.content }}</div>
    {%- if article.tags.size > 0 -%}
      <div class="ds-art__tags">
        {%- for t in article.tags -%}<span>{{ t }}</span>{%- endfor -%}
      </div>
    {%- endif -%}
    <div class="ds-art__share">
      <span>شارك</span>
      <a href="https://twitter.com/intent/tweet?url={{ shop.url }}{{ article.url }}&text={{ article.title | url_encode }}" target="_blank" rel="noreferrer">تويتر</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u={{ shop.url }}{{ article.url }}" target="_blank" rel="noreferrer">فيسبوك</a>
      <a href="mailto:?subject={{ article.title }}&body={{ shop.url }}{{ article.url }}">البريد</a>
    </div>
    {%- if article.comments_enabled? -%}
      <section class="ds-art__comments">
        <h2>التعليقات ({{ article.comments_count }})</h2>
        {%- for c in article.comments -%}
          <div class="ds-art__c">
            <strong>{{ c.author }}</strong>
            <span>{{ c.created_at | date: '%b %d, %Y' }}</span>
            <p>{{ c.content }}</p>
          </div>
        {%- endfor -%}
        {% form 'new_comment', article, class: 'ds-art__cform' %}
          <input type="text" name="comment[author]" placeholder="الاسم" required>
          <input type="email" name="comment[email]" placeholder="البريد الإلكتروني" required>
          <textarea name="comment[body]" placeholder="رأيك…" required></textarea>
          <button type="submit" class="ds-btn ds-btn-primary">أضِف تعليقًا</button>
        {% endform %}
      </section>
    {%- endif -%}
  </div>
</article>
<style>
  .ds-art { padding: 3rem 0; }
  .ds-art__inner { max-width: 760px; }
  .ds-art__back { color: var(--color-primary); text-decoration: none; font-size: .85rem; font-weight: 600; }
  .ds-art__head h1 { font-size: clamp(2rem, 5vw, 3.4rem); margin: .8rem 0 .6rem; letter-spacing: -0.02em; line-height: 1.1; }
  .ds-art__meta { color: var(--color-muted); font-size: .85rem; margin-bottom: 2rem; }
  .ds-art__hero img { width: 100%; height: auto; border-radius: var(--radius); margin-bottom: 2rem; }
  .ds-art__body { color: var(--color-fg); line-height: 1.75; font-size: 1.05rem; }
  .ds-art__body p { margin: 0 0 1.2rem; }
  .ds-art__body h2 { margin: 2.5rem 0 .8rem; font-size: 1.6rem; letter-spacing: -0.01em; }
  .ds-art__body h3 { margin: 2rem 0 .6rem; font-size: 1.3rem; }
  .ds-art__body img { max-width: 100%; border-radius: var(--radius); margin: 1.5rem 0; }
  .ds-art__body blockquote { border-left: 3px solid var(--color-primary); padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: var(--color-muted); }
  .ds-art__tags { margin: 2.5rem 0 0; display: flex; gap: .5rem; flex-wrap: wrap; }
  .ds-art__tags span { padding: 4px 10px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 999px; font-size: .78rem; color: var(--color-muted); }
  .ds-art__share { margin-top: 2rem; display: flex; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--color-border); align-items: center; font-size: .85rem; }
  .ds-art__share span { color: var(--color-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .1em; font-size: .7rem; }
  .ds-art__share a { color: var(--color-primary); text-decoration: none; font-weight: 600; }
  .ds-art__comments { margin-top: 3rem; }
  .ds-art__c { padding: 1.2rem; background: var(--color-surface); border-radius: var(--radius); margin-bottom: .8rem; }
  .ds-art__c strong { font-weight: 700; }
  .ds-art__c span { color: var(--color-muted); font-size: .8rem; margin-left: .5rem; }
  .ds-art__cform { display: grid; gap: .6rem; margin-top: 1.5rem; }
  .ds-art__cform input, .ds-art__cform textarea { padding: .75rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-fg); font: inherit; }
</style>
{% schema %}
{ "name": "Article", "tag": "section", "settings": [], "presets": [{ "name": "Article" }] }
{% endschema %}
`,
}
