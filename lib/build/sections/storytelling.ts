/**
 * Brand-storytelling sections — the difference between a generic
 * dropshipping store and one that reads as a brand. Critical for
 * organic, ad, and influencer traffic.
 *
 * Covers what merchants typically build via static pages or pay for
 * via "About page" theme add-ons.
 */
import type { BuildConfig } from '../theme-generator'
import type { SectionMap } from './conversion'

export const storytellingSections: SectionMap = {
  'ds-hero-video': () => `<section class="ds-vhero">
  {%- if section.settings.video != blank -%}
    {{ section.settings.video | video_tag: autoplay: true, loop: true, muted: true, controls: false, image_size: '1500x' }}
  {%- elsif section.settings.video_url != blank -%}
    <iframe class="ds-vhero__bg" src="{{ section.settings.video_url }}" title="Background video" loading="lazy" allow="autoplay; encrypted-media" muted></iframe>
  {%- elsif section.settings.poster != blank -%}
    {{ section.settings.poster | image_url: width: 2000 | image_tag: alt: section.settings.headline, loading: 'eager', fetchpriority: 'high' }}
  {%- endif -%}
  <div class="ds-vhero__overlay" style="background: linear-gradient(180deg, rgba(0,0,0,{{ section.settings.dim_top }}) 0%, rgba(0,0,0,{{ section.settings.dim_bottom }}) 100%);"></div>
  <div class="ds-container ds-vhero__copy">
    <div class="ds-vhero__eyebrow">{{ section.settings.eyebrow }}</div>
    <h1 class="ds-vhero__title">{{ section.settings.headline }}</h1>
    <p class="ds-vhero__sub">{{ section.settings.subhead }}</p>
    <a href="{{ section.settings.cta_url | default: '#product' }}" class="ds-btn ds-btn-primary ds-btn-xl">{{ section.settings.cta }}</a>
  </div>
</section>
<style>
  .ds-vhero { position: relative; min-height: 600px; display: flex; align-items: center; overflow: hidden; color: white; }
  .ds-vhero > video, .ds-vhero > img, .ds-vhero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border: 0; }
  .ds-vhero__overlay { position: absolute; inset: 0; }
  .ds-vhero__copy { position: relative; z-index: 2; text-align: center; padding: 5rem 1.5rem; }
  .ds-vhero__eyebrow { font-size: .82rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; opacity: .85; }
  .ds-vhero__title { font-size: clamp(2.2rem, 6vw, 4.5rem); margin: .8rem 0 1rem; line-height: 1.02; letter-spacing: -0.03em; max-width: 22ch; margin-inline: auto; }
  .ds-vhero__sub { font-size: 1.05rem; opacity: .9; max-width: 50ch; margin: 0 auto 2rem; line-height: 1.5; }
</style>
{% schema %}
{
  "name": "Video hero",
  "tag": "section",
  "settings": [
    { "type": "video",     "id": "video",      "label": "Background video (mp4)" },
    { "type": "video_url", "id": "video_url",  "label": "Or YouTube/Vimeo URL", "accept": ["youtube","vimeo"] },
    { "type": "image_picker", "id": "poster", "label": "Fallback / poster image" },
    { "type": "text",      "id": "eyebrow",   "label": "Eyebrow",  "default": "Now shipping" },
    { "type": "text",      "id": "headline",  "label": "Headline", "default": "Built for the everyday." },
    { "type": "textarea",  "id": "subhead",   "label": "Sub-headline", "default": "An honest product made by a small team you can email." },
    { "type": "text",      "id": "cta",       "label": "CTA",      "default": "Shop the drop" },
    { "type": "url",       "id": "cta_url",   "label": "CTA URL" },
    { "type": "range",     "id": "dim_top",   "label": "Dim top",  "min": 0, "max": 80, "step": 5, "default": 30, "unit": "%" },
    { "type": "range",     "id": "dim_bottom","label": "Dim bottom", "min": 0, "max": 90, "step": 5, "default": 60, "unit": "%" }
  ],
  "presets": [{ "name": "Video hero" }]
}
{% endschema %}
`,

  'ds-hero-split': () => `<section class="ds-shero" style="background: var(--color-bg);">
  <div class="ds-container ds-shero__grid {% if section.settings.flip %}ds-shero--flip{% endif %}">
    <div class="ds-shero__copy">
      <div class="ds-shero__eyebrow">{{ section.settings.eyebrow }}</div>
      <h1 class="ds-shero__title">{{ section.settings.headline }}</h1>
      <p class="ds-shero__sub">{{ section.settings.subhead }}</p>
      <div class="ds-shero__ctas">
        <a href="{{ section.settings.cta_url | default: '#product' }}" class="ds-btn ds-btn-primary ds-btn-lg">{{ section.settings.cta }}</a>
        {%- if section.settings.cta2 != blank -%}
          <a href="{{ section.settings.cta2_url | default: '#' }}" class="ds-btn ds-btn-lg">{{ section.settings.cta2 }}</a>
        {%- endif -%}
      </div>
      <ul class="ds-shero__bullets">
        {%- for block in section.blocks -%}
          <li {{ block.shopify_attributes }}>✓ {{ block.settings.point }}</li>
        {%- endfor -%}
      </ul>
    </div>
    <div class="ds-shero__media">
      {%- if section.settings.image != blank -%}
        {{ section.settings.image | image_url: width: 1400 | image_tag: alt: section.settings.headline, loading: 'eager', fetchpriority: 'high', sizes: '(max-width: 820px) 100vw, 50vw', widths: '500, 800, 1200, 1400' }}
      {%- elsif section.settings.image_url != blank -%}
        <img src="{{ section.settings.image_url }}" alt="{{ section.settings.headline | escape }}" width="1400" height="1400" loading="eager" fetchpriority="high">
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-shero { padding: 3rem 0; }
  .ds-shero__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
  .ds-shero--flip .ds-shero__media { order: -1; }
  .ds-shero__eyebrow { font-size: .8rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); }
  .ds-shero__title { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; margin: .6rem 0 1.2rem; letter-spacing: -0.02em; }
  .ds-shero__sub { font-size: 1.05rem; color: var(--color-muted); margin: 0 0 1.5rem; max-width: 50ch; line-height: 1.5; }
  .ds-shero__ctas { display: flex; gap: .75rem; flex-wrap: wrap; }
  .ds-shero__bullets { list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: .4rem; color: var(--color-fg); font-size: .92rem; }
  .ds-shero__media img { width: 100%; height: auto; border-radius: calc(var(--radius) * 1.5); box-shadow: 0 30px 60px -30px rgba(0,0,0,.25); }
  @media (max-width: 820px) {
    .ds-shero__grid { grid-template-columns: 1fr; gap: 2rem; }
    .ds-shero--flip .ds-shero__media { order: initial; }
  }
</style>
{% schema %}
{
  "name": "Hero split",
  "tag": "section",
  "settings": [
    { "type": "text",     "id": "eyebrow",  "label": "Eyebrow",  "default": "New drop" },
    { "type": "text",     "id": "headline", "label": "Headline", "default": "A product you'll actually use" },
    { "type": "textarea", "id": "subhead",  "label": "Sub-headline", "default": "Designed for daily wear. Built to last. Loved by 12,000+ customers." },
    { "type": "text",     "id": "cta",      "label": "Primary CTA", "default": "Shop now" },
    { "type": "url",      "id": "cta_url",  "label": "Primary CTA URL" },
    { "type": "text",     "id": "cta2",     "label": "Secondary CTA" },
    { "type": "url",      "id": "cta2_url", "label": "Secondary CTA URL" },
    { "type": "image_picker", "id": "image", "label": "Image" },
    { "type": "text", "id": "image_url", "label": "Or image URL (external)" },
    { "type": "checkbox", "id": "flip",     "label": "Flip image to the left" }
  ],
  "blocks": [
    {
      "type": "bullet",
      "name": "Bullet",
      "settings": [{ "type": "text", "id": "point", "label": "Bullet" }]
    }
  ],
  "max_blocks": 5,
  "presets": [{ "name": "Hero split", "blocks": [
      { "type": "bullet", "settings": { "point": "Free shipping over $50" } },
      { "type": "bullet", "settings": { "point": "30-day money-back guarantee" } },
      { "type": "bullet", "settings": { "point": "Ships in 24 hours" } }
    ] }]
}
{% endschema %}
`,

  'ds-founder-story': () => `<section class="ds-founder" id="our-story">
  <div class="ds-container ds-founder__grid">
    <div class="ds-founder__media">
      {%- if section.settings.image != blank -%}
        {{ section.settings.image | image_url: width: 1000 | image_tag: alt: section.settings.name, loading: 'lazy', sizes: '(max-width: 820px) 100vw, 50vw' }}
      {%- elsif section.settings.image_url != blank -%}
        <img src="{{ section.settings.image_url }}" alt="{{ section.settings.name | escape }}" width="1000" height="1250" loading="lazy">
      {%- endif -%}
    </div>
    <div class="ds-founder__copy">
      <div class="ds-founder__quote">"{{ section.settings.quote }}"</div>
      <div class="ds-founder__sig">
        <strong>{{ section.settings.name }}</strong>
        <span>{{ section.settings.role }}</span>
      </div>
      <a href="{{ section.settings.cta_url | default: '/pages/about' }}" class="ds-btn ds-btn-lg">{{ section.settings.cta }}</a>
    </div>
  </div>
</section>
<style>
  .ds-founder { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-founder__grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 3rem; align-items: center; max-width: 1000px; margin: 0 auto; }
  .ds-founder__media img { width: 100%; border-radius: calc(var(--radius) * 1.5); aspect-ratio: 4/5; object-fit: cover; }
  .ds-founder__quote { font-size: clamp(1.2rem, 2.5vw, 1.6rem); line-height: 1.4; color: var(--color-fg); font-weight: 500; letter-spacing: -0.01em; }
  .ds-founder__sig { margin: 1.5rem 0; }
  .ds-founder__sig strong { font-weight: 800; color: var(--color-fg); font-size: 1rem; }
  .ds-founder__sig span { color: var(--color-muted); font-size: .9rem; margin-left: .5rem; }
  @media (max-width: 820px) { .ds-founder__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Founder story",
  "tag": "section",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "Founder photo" },
    { "type": "text", "id": "image_url", "label": "Or photo URL (external)" },
    { "type": "textarea", "id": "quote", "label": "Quote", "default": "I started this because the products on the market were either overpriced or felt cheap. We made the one I'd want to own." },
    { "type": "text",     "id": "name",  "label": "Name",  "default": "Founder name" },
    { "type": "text",     "id": "role",  "label": "Role",  "default": "Founder & CEO" },
    { "type": "text",     "id": "cta",   "label": "CTA",   "default": "Read our story" },
    { "type": "url",      "id": "cta_url","label": "CTA URL" }
  ],
  "presets": [{ "name": "Founder story" }]
}
{% endschema %}
`,

  'ds-mission': () => `<section class="ds-mission">
  <div class="ds-container ds-mission__inner">
    <div class="ds-mission__mark">{{ section.settings.mark }}</div>
    <p class="ds-mission__quote">{{ section.settings.quote }}</p>
    <div class="ds-mission__line"></div>
    <div class="ds-mission__by">{{ section.settings.by }}</div>
  </div>
</section>
<style>
  .ds-mission { padding: 5rem 0; }
  .ds-mission__inner { max-width: 720px; text-align: center; margin: 0 auto; }
  .ds-mission__mark { font-size: 4rem; line-height: .8; color: var(--color-accent); font-family: Georgia, serif; opacity: .5; }
  .ds-mission__quote { font-size: clamp(1.3rem, 3vw, 1.8rem); line-height: 1.4; color: var(--color-fg); font-weight: 500; letter-spacing: -0.01em; margin: 0 0 2rem; }
  .ds-mission__line { width: 60px; height: 2px; background: var(--color-primary); margin: 0 auto 1rem; }
  .ds-mission__by { color: var(--color-muted); font-size: .85rem; text-transform: uppercase; letter-spacing: .14em; font-weight: 700; }
</style>
{% schema %}
{
  "name": "Mission statement",
  "tag": "section",
  "settings": [
    { "type": "text",     "id": "mark",  "label": "Decorative mark", "default": "❝" },
    { "type": "textarea", "id": "quote", "label": "Mission",          "default": "To make the one product worth owning — and stand behind it for life." },
    { "type": "text",     "id": "by",    "label": "Attribution",     "default": "Our promise" }
  ],
  "presets": [{ "name": "Mission" }]
}
{% endschema %}
`,

  'ds-timeline': () => `<section class="ds-timeline">
  <div class="ds-container">
    <h2 class="ds-timeline__title">{{ section.settings.title }}</h2>
    <ol class="ds-timeline__list">
      {%- for block in section.blocks -%}
        <li {{ block.shopify_attributes }}>
          <div class="ds-timeline__year">{{ block.settings.year }}</div>
          <div class="ds-timeline__milestone">
            <h3>{{ block.settings.heading }}</h3>
            <p>{{ block.settings.body }}</p>
          </div>
        </li>
      {%- endfor -%}
    </ol>
  </div>
</section>
<style>
  .ds-timeline { padding: 4rem 0; }
  .ds-timeline__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2.5rem; }
  .ds-timeline__list { list-style: none; padding: 0; margin: 0 auto; max-width: 720px; display: grid; gap: 2rem; position: relative; }
  .ds-timeline__list::before { content: ''; position: absolute; left: 60px; top: 16px; bottom: 16px; width: 2px; background: var(--color-border); }
  .ds-timeline__list li { display: grid; grid-template-columns: 60px 1fr; gap: 2rem; align-items: start; position: relative; }
  .ds-timeline__year { font-weight: 900; color: var(--color-primary); font-size: 1rem; position: relative; padding-top: .3rem; }
  .ds-timeline__year::after { content: ''; position: absolute; right: -10px; top: .5rem; width: 12px; height: 12px; border-radius: 6px; background: var(--color-primary); border: 3px solid var(--color-bg); }
  .ds-timeline__milestone h3 { font-size: 1.1rem; margin: 0 0 .25rem; color: var(--color-fg); }
  .ds-timeline__milestone p { color: var(--color-muted); margin: 0; line-height: 1.5; }
</style>
{% schema %}
{
  "name": "Timeline",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Our story" }
  ],
  "blocks": [
    {
      "type": "milestone",
      "name": "Milestone",
      "settings": [
        { "type": "text",     "id": "year",    "label": "Year",    "default": "2022" },
        { "type": "text",     "id": "heading", "label": "Heading", "default": "Founded in a garage" },
        { "type": "textarea", "id": "body",    "label": "Body",    "default": "Two co-founders, one prototype, no money." }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Timeline", "blocks": [
      { "type": "milestone", "settings": { "year": "2022", "heading": "Founded in a garage",        "body": "Two co-founders, one prototype, no money." } },
      { "type": "milestone", "settings": { "year": "2023", "heading": "First 1,000 customers",     "body": "Sold out our first run in 14 days." } },
      { "type": "milestone", "settings": { "year": "2024", "heading": "10× growth",                "body": "Doubled the team, opened warehouses in 4 countries." } },
      { "type": "milestone", "settings": { "year": "2025", "heading": "12,400+ happy customers",   "body": "And counting." } }
    ] }]
}
{% endschema %}
`,

  'ds-values': () => `<section class="ds-values">
  <div class="ds-container">
    <h2 class="ds-values__title">{{ section.settings.title }}</h2>
    <p class="ds-values__sub">{{ section.settings.subtitle }}</p>
    <div class="ds-values__grid">
      {%- for block in section.blocks -%}
        <div class="ds-values__card" {{ block.shopify_attributes }}>
          <div class="ds-values__icon">{{ block.settings.icon }}</div>
          <h3>{{ block.settings.heading }}</h3>
          <p>{{ block.settings.body }}</p>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-values { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-values__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .5rem; }
  .ds-values__sub { text-align: center; color: var(--color-muted); margin: 0 auto 2rem; max-width: 50ch; }
  .ds-values__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .ds-values__card { padding: 2rem 1.5rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-values__icon { width: 52px; height: 52px; border-radius: 26px; background: color-mix(in srgb, var(--color-primary) 14%, transparent); display: grid; place-items: center; font-size: 1.6rem; margin-bottom: 1rem; }
  .ds-values__card h3 { margin: 0 0 .5rem; font-size: 1.1rem; }
  .ds-values__card p { color: var(--color-muted); margin: 0; line-height: 1.55; font-size: .92rem; }
  @media (max-width: 720px) { .ds-values__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Values",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",    "label": "Title",    "default": "What we believe" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "Three principles every product passes through." }
  ],
  "blocks": [
    {
      "type": "value",
      "name": "Value",
      "settings": [
        { "type": "text",     "id": "icon",    "label": "Icon",    "default": "🌱" },
        { "type": "text",     "id": "heading", "label": "Heading", "default": "Sustainably sourced" },
        { "type": "textarea", "id": "body",    "label": "Body",    "default": "We pay more for materials so the planet pays less." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Values", "blocks": [
      { "type": "value", "settings": { "icon": "🌱", "heading": "Sustainably sourced", "body": "We pay more for materials so the planet pays less." } },
      { "type": "value", "settings": { "icon": "💛", "heading": "Honest pricing",      "body": "We tell you exactly what each piece costs to make." } },
      { "type": "value", "settings": { "icon": "🛠️", "heading": "Built to last",       "body": "If it breaks in the first year, we replace it." } }
    ] }]
}
{% endschema %}
`,

  'ds-team': () => `<section class="ds-team">
  <div class="ds-container">
    <h2 class="ds-team__title">{{ section.settings.title }}</h2>
    <div class="ds-team__grid">
      {%- for block in section.blocks -%}
        <div class="ds-team__card" {{ block.shopify_attributes }}>
          <div class="ds-team__media">
            {%- if block.settings.image != blank -%}
              {{ block.settings.image | image_url: width: 500 | image_tag: alt: block.settings.name, loading: 'lazy' }}
            {%- else -%}
              <div class="ds-team__placeholder">{{ block.settings.name | slice: 0,1 | upcase }}</div>
            {%- endif -%}
          </div>
          <div class="ds-team__name">{{ block.settings.name }}</div>
          <div class="ds-team__role">{{ block.settings.role }}</div>
          {%- if block.settings.bio != blank -%}<p class="ds-team__bio">{{ block.settings.bio }}</p>{%- endif -%}
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-team { padding: 4rem 0; }
  .ds-team__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-team__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-team__card { text-align: center; }
  .ds-team__media { aspect-ratio: 1/1; border-radius: calc(var(--radius) * 1.5); overflow: hidden; background: var(--color-surface); margin-bottom: .8rem; }
  .ds-team__media img { width: 100%; height: 100%; object-fit: cover; }
  .ds-team__placeholder { width: 100%; height: 100%; display: grid; place-items: center; background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)); font-size: 2.5rem; font-weight: 800; color: var(--color-primary); }
  .ds-team__name { font-weight: 800; color: var(--color-fg); }
  .ds-team__role { font-size: .85rem; color: var(--color-muted); }
  .ds-team__bio { font-size: .82rem; color: var(--color-muted); margin: .5rem 0 0; line-height: 1.45; }
  @media (max-width: 720px) { .ds-team__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Team",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "The team" }
  ],
  "blocks": [
    {
      "type": "person",
      "name": "Person",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Photo" },
        { "type": "text", "id": "name", "label": "Name",  "default": "Sarah" },
        { "type": "text", "id": "role", "label": "Role",  "default": "Founder" },
        { "type": "textarea", "id": "bio", "label": "Short bio" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Team", "blocks": [
      { "type": "person", "settings": { "name": "Sarah",  "role": "Founder" } },
      { "type": "person", "settings": { "name": "Alex",   "role": "Design" } },
      { "type": "person", "settings": { "name": "Maya",   "role": "Operations" } },
      { "type": "person", "settings": { "name": "Jordan", "role": "Support" } }
    ] }]
}
{% endschema %}
`,

  'ds-before-after': () => `<section class="ds-ba">
  <div class="ds-container">
    <h2 class="ds-ba__title">{{ section.settings.title }}</h2>
    <p class="ds-ba__sub">{{ section.settings.subtitle }}</p>
    <div class="ds-ba__compare" data-ds-ba>
      {%- if section.settings.after != blank -%}
        {{ section.settings.after | image_url: width: 1200 | image_tag: alt: 'After', loading: 'lazy', class: 'ds-ba__after' }}
      {%- elsif section.settings.after_url != blank -%}
        <img src="{{ section.settings.after_url }}" alt="After" width="1200" height="900" loading="lazy" class="ds-ba__after">
      {%- endif -%}
      <div class="ds-ba__before-wrap" data-ds-ba-clip>
        {%- if section.settings.before != blank -%}
          {{ section.settings.before | image_url: width: 1200 | image_tag: alt: 'Before', loading: 'lazy', class: 'ds-ba__before' }}
        {%- elsif section.settings.before_url != blank -%}
          <img src="{{ section.settings.before_url }}" alt="Before" width="1200" height="900" loading="lazy" class="ds-ba__before">
        {%- endif -%}
        <div class="ds-ba__label ds-ba__label--before">{{ section.settings.before_label }}</div>
      </div>
      <div class="ds-ba__label ds-ba__label--after">{{ section.settings.after_label }}</div>
      <input type="range" min="0" max="100" value="50" class="ds-ba__slider" data-ds-ba-slider aria-label="شريط المقارنة">
      <div class="ds-ba__handle" data-ds-ba-handle><span>↔</span></div>
    </div>
  </div>
</section>
<script>
  (function(){
    var root = document.querySelector('[data-ds-ba]');
    if (!root) return;
    var clip = root.querySelector('[data-ds-ba-clip]');
    var slider = root.querySelector('[data-ds-ba-slider]');
    var handle = root.querySelector('[data-ds-ba-handle]');
    function set(v){
      clip.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      handle.style.left = v + '%';
    }
    slider.addEventListener('input', function(){ set(this.value); });
    set(50);
  })();
</script>
<style>
  .ds-ba { padding: 4rem 0; }
  .ds-ba__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .5rem; }
  .ds-ba__sub { text-align: center; color: var(--color-muted); margin: 0 0 2rem; }
  .ds-ba__compare { position: relative; max-width: 900px; margin: 0 auto; aspect-ratio: 4/3; border-radius: var(--radius); overflow: hidden; background: var(--color-surface); user-select: none; }
  .ds-ba__compare img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .ds-ba__before-wrap { position: absolute; inset: 0; clip-path: inset(0 50% 0 0); }
  .ds-ba__slider { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: ew-resize; }
  .ds-ba__handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 44px; height: 44px; border-radius: 22px; background: white; color: var(--color-fg); display: grid; place-items: center; font-weight: 800; box-shadow: 0 6px 16px rgba(0,0,0,.25); pointer-events: none; }
  .ds-ba__label { position: absolute; top: 12px; padding: 4px 10px; border-radius: 999px; font-size: .75rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; background: rgba(0,0,0,.6); color: white; }
  .ds-ba__label--before { left: 12px; }
  .ds-ba__label--after  { right: 12px; }
</style>
{% schema %}
{
  "name": "Before & after",
  "tag": "section",
  "settings": [
    { "type": "text",     "id": "title",    "label": "Title",    "default": "See the difference" },
    { "type": "text",     "id": "subtitle", "label": "Subtitle", "default": "Drag the handle to compare." },
    { "type": "image_picker", "id": "before", "label": "Before image" },
    { "type": "text",         "id": "before_url", "label": "Or before URL (external)" },
    { "type": "image_picker", "id": "after",  "label": "After image" },
    { "type": "text",         "id": "after_url",  "label": "Or after URL (external)" },
    { "type": "text",     "id": "before_label", "label": "Before label", "default": "Before" },
    { "type": "text",     "id": "after_label",  "label": "After label",  "default": "After" }
  ],
  "presets": [{ "name": "Before & after" }]
}
{% endschema %}
`,

  'ds-how-it-works': () => `<section class="ds-how" id="how-it-works">
  <div class="ds-container">
    <h2 class="ds-how__title">{{ section.settings.title }}</h2>
    <div class="ds-how__grid">
      {%- for block in section.blocks -%}
        <div class="ds-how__step" {{ block.shopify_attributes }}>
          <div class="ds-how__num">{{ forloop.index }}</div>
          <h3>{{ block.settings.heading }}</h3>
          <p>{{ block.settings.body }}</p>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-how { padding: 4rem 0; }
  .ds-how__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2.5rem; }
  .ds-how__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; position: relative; }
  .ds-how__step { text-align: center; }
  .ds-how__num { width: 48px; height: 48px; border-radius: 24px; background: var(--color-primary); color: var(--color-primary-fg); font-weight: 900; font-size: 1.4rem; display: grid; place-items: center; margin: 0 auto 1rem; }
  .ds-how__step h3 { font-size: 1.05rem; margin: 0 0 .35rem; }
  .ds-how__step p { color: var(--color-muted); font-size: .9rem; line-height: 1.5; margin: 0; }
  @media (max-width: 720px) { .ds-how__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "How it works",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "How it works" }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "Step",
      "settings": [
        { "type": "text",     "id": "heading", "label": "Heading", "default": "Pick your bundle" },
        { "type": "textarea", "id": "body",    "label": "Body",    "default": "Choose 1, 2, or 3 — the more you buy, the more you save." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "How it works", "blocks": [
      { "type": "step", "settings": { "heading": "Pick your bundle",  "body": "Choose 1, 2, or 3 — the more you buy, the more you save." } },
      { "type": "step", "settings": { "heading": "Order in seconds",  "body": "Apple Pay, Shop Pay, or card — your call. Ships in 24h." } },
      { "type": "step", "settings": { "heading": "Track it home",     "body": "Real-time tracking by email. Usually arrives in 3-5 days." } },
      { "type": "step", "settings": { "heading": "Love it or refund", "body": "30 days to decide. We even pay the return label." } }
    ] }]
}
{% endschema %}
`,

  'ds-image-text': () => `<section class="ds-imgtext">
  <div class="ds-container ds-imgtext__grid {% if section.settings.flip %}ds-imgtext--flip{% endif %}">
    <div class="ds-imgtext__media">
      {%- if section.settings.image != blank -%}
        {{ section.settings.image | image_url: width: 1200 | image_tag: alt: section.settings.heading, loading: 'lazy', sizes: '(max-width: 820px) 100vw, 50vw' }}
      {%- elsif section.settings.image_url != blank -%}
        <img src="{{ section.settings.image_url }}" alt="{{ section.settings.heading | escape }}" width="1200" height="900" loading="lazy">
      {%- endif -%}
    </div>
    <div class="ds-imgtext__copy">
      <div class="ds-imgtext__eyebrow">{{ section.settings.eyebrow }}</div>
      <h2>{{ section.settings.heading }}</h2>
      <div class="ds-imgtext__body">{{ section.settings.body }}</div>
      {%- if section.settings.cta != blank -%}
        <a href="{{ section.settings.cta_url | default: '#' }}" class="ds-btn ds-btn-primary ds-btn-lg">{{ section.settings.cta }}</a>
      {%- endif -%}
    </div>
  </div>
</section>
<style>
  .ds-imgtext { padding: 4rem 0; }
  .ds-imgtext__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
  .ds-imgtext--flip .ds-imgtext__media { order: 1; }
  .ds-imgtext__media img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: calc(var(--radius) * 1.5); display: block; }
  .ds-imgtext__eyebrow { font-size: .8rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); margin-bottom: .8rem; }
  .ds-imgtext__copy h2 { font-size: clamp(1.5rem, 3vw, 2.4rem); margin: 0 0 1rem; letter-spacing: -0.02em; }
  .ds-imgtext__body { color: var(--color-muted); line-height: 1.6; margin-bottom: 1.5rem; font-size: 1rem; }
  .ds-imgtext__body p { margin: 0 0 .8rem; }
  @media (max-width: 820px) {
    .ds-imgtext__grid { grid-template-columns: 1fr; gap: 2rem; }
    .ds-imgtext--flip .ds-imgtext__media { order: initial; }
  }
</style>
{% schema %}
{
  "name": "Image with text",
  "tag": "section",
  "settings": [
    { "type": "image_picker", "id": "image",   "label": "Image" },
    { "type": "text",         "id": "image_url", "label": "Or image URL (external)" },
    { "type": "text",         "id": "eyebrow", "label": "Eyebrow", "default": "Made for you" },
    { "type": "text",         "id": "heading", "label": "Heading", "default": "An honest product made by a small team" },
    { "type": "richtext",     "id": "body",    "label": "Body",    "default": "<p>Most products are made in factories you'll never see. Ours isn't. Every piece is checked by a human before it ships. We email you back personally if something's off.</p>" },
    { "type": "text",         "id": "cta",     "label": "CTA",     "default": "Read our story" },
    { "type": "url",          "id": "cta_url", "label": "CTA URL" },
    { "type": "checkbox",     "id": "flip",    "label": "Flip image to the right" }
  ],
  "presets": [{ "name": "Image with text" }]
}
{% endschema %}
`,
}
