/**
 * Social-proof sections. Showing other people trust the brand is the
 * single biggest non-product lever for converting cold traffic. Each
 * of these replaces a paid app:
 *   • Press / As-Seen-In bars  → ds-logo-bar, ds-press
 *   • Foursixty / Pixlee UGC   → ds-ugc-gallery, ds-customer-photos
 *   • Yotpo aggregate rating   → ds-stars-summary
 *   • Loox video reviews        → ds-testimonials-video
 *   • Stats counters (Hextom)   → ds-stats
 *   • Award badges              → ds-awards
 */
import type { BuildConfig } from '../theme-generator'
import type { SectionMap } from './conversion'

export const socialProofSections: SectionMap = {
  'ds-logo-bar': () => `<section class="ds-logo-bar">
  <div class="ds-container">
    <div class="ds-logo-bar__title">{{ section.settings.title }}</div>
    <div class="ds-logo-bar__row">
      {%- for block in section.blocks -%}
        <div class="ds-logo-bar__cell" {{ block.shopify_attributes }}>
          {%- if block.settings.image != blank -%}
            {{ block.settings.image | image_url: width: 240 | image_tag: alt: block.settings.label, loading: 'lazy' }}
          {%- else -%}
            <span class="ds-logo-bar__text">{{ block.settings.label }}</span>
          {%- endif -%}
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-logo-bar { padding: 2.5rem 0; }
  .ds-logo-bar__title { text-align: center; font-size: .72rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: var(--color-muted); margin-bottom: 1.2rem; }
  .ds-logo-bar__row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.5rem; align-items: center; opacity: .8; }
  .ds-logo-bar__cell { display: grid; place-items: center; min-height: 36px; }
  .ds-logo-bar__cell img { max-height: 28px; object-fit: contain; filter: grayscale(1); transition: filter .15s; }
  .ds-logo-bar__cell:hover img { filter: none; }
  .ds-logo-bar__text { font-weight: 800; letter-spacing: .08em; color: var(--color-muted); font-size: .95rem; }
  @media (max-width: 720px) { .ds-logo-bar__row { grid-template-columns: repeat(3, 1fr); gap: 1rem; } }
</style>
{% schema %}
{
  "name": "Logo bar (as seen in)",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "As seen in" }
  ],
  "blocks": [
    {
      "type": "logo",
      "name": "Logo",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Logo image" },
        { "type": "text", "id": "label", "label": "Text fallback", "default": "FORBES" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Logo bar", "blocks": [
      { "type": "logo", "settings": { "label": "FORBES" } },
      { "type": "logo", "settings": { "label": "WIRED" } },
      { "type": "logo", "settings": { "label": "TECHCRUNCH" } },
      { "type": "logo", "settings": { "label": "VOGUE" } },
      { "type": "logo", "settings": { "label": "GQ" } },
      { "type": "logo", "settings": { "label": "BUZZFEED" } }
    ] }]
}
{% endschema %}
`,

  'ds-stats': () => `<section class="ds-stats">
  <div class="ds-container">
    <div class="ds-stats__grid">
      {%- for block in section.blocks -%}
        <div class="ds-stats__cell" {{ block.shopify_attributes }}>
          <div class="ds-stats__num">{{ block.settings.number }}</div>
          <div class="ds-stats__label">{{ block.settings.label }}</div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-stats { padding: 4rem 0; }
  .ds-stats__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
  .ds-stats__cell { text-align: center; padding: 1.5rem .5rem; }
  .ds-stats__num { font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; line-height: 1; letter-spacing: -0.03em; background: linear-gradient(135deg, var(--color-fg), var(--color-primary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .ds-stats__label { font-size: .8rem; color: var(--color-muted); margin-top: .5rem; text-transform: uppercase; letter-spacing: .14em; font-weight: 600; }
  @media (max-width: 720px) { .ds-stats__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Stats counter",
  "tag": "section",
  "settings": [],
  "blocks": [
    {
      "type": "stat",
      "name": "Stat",
      "settings": [
        { "type": "text", "id": "number", "label": "Number", "default": "12,400+" },
        { "type": "text", "id": "label",  "label": "Label",  "default": "Happy customers" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Stats counter", "blocks": [
      { "type": "stat", "settings": { "number": "12,400+", "label": "Happy customers" } },
      { "type": "stat", "settings": { "number": "4.9★",    "label": "Average rating" } },
      { "type": "stat", "settings": { "number": "30 day",  "label": "Money-back guarantee" } },
      { "type": "stat", "settings": { "number": "24h",     "label": "Ships within" } }
    ] }]
}
{% endschema %}
`,

  'ds-press': () => `<section class="ds-press" id="press">
  <div class="ds-container">
    <h2 class="ds-press__title">{{ section.settings.title }}</h2>
    <div class="ds-press__grid">
      {%- for block in section.blocks -%}
        <figure class="ds-press__card" {{ block.shopify_attributes }}>
          <blockquote>"{{ block.settings.quote }}"</blockquote>
          <figcaption>
            <strong>{{ block.settings.source }}</strong>
          </figcaption>
        </figure>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-press { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-press__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-press__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .ds-press__card { margin: 0; padding: 1.5rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-press__card blockquote { margin: 0 0 1rem; font-size: 1rem; line-height: 1.5; color: var(--color-fg); }
  .ds-press__card figcaption strong { font-weight: 800; letter-spacing: .04em; color: var(--color-primary); }
  @media (max-width: 720px) { .ds-press__grid { grid-template-columns: 1fr; } }
</style>
{% schema %}
{
  "name": "Press quotes",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "What the press is saying" }
  ],
  "blocks": [
    {
      "type": "quote",
      "name": "Quote",
      "settings": [
        { "type": "textarea", "id": "quote", "label": "Quote" },
        { "type": "text", "id": "source", "label": "Source", "default": "FORBES" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Press", "blocks": [
      { "type": "quote", "settings": { "quote": "The kind of one-product brand that actually delivers.", "source": "FORBES" } },
      { "type": "quote", "settings": { "quote": "Builds you'd expect at twice the price.",                "source": "WIRED" } },
      { "type": "quote", "settings": { "quote": "A standout in a crowded category.",                       "source": "TECHCRUNCH" } }
    ] }]
}
{% endschema %}
`,

  'ds-awards': () => `<section class="ds-awards">
  <div class="ds-container">
    <h2 class="ds-awards__title">{{ section.settings.title }}</h2>
    <div class="ds-awards__row">
      {%- for block in section.blocks -%}
        <div class="ds-awards__card" {{ block.shopify_attributes }}>
          <div class="ds-awards__icon">{% render 'ds-icon', name: block.settings.icon %}</div>
          <div class="ds-awards__year">{{ block.settings.year }}</div>
          <div class="ds-awards__name">{{ block.settings.name }}</div>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-awards { padding: 3rem 0; }
  .ds-awards__title { text-align: center; font-size: .8rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--color-muted); margin: 0 0 1.5rem; }
  .ds-awards__row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-awards__card { text-align: center; padding: 1.4rem 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-awards__icon { font-size: 1.8rem; line-height: 1; }
  .ds-awards__year { font-size: .72rem; color: var(--color-muted); margin-top: .4rem; letter-spacing: .1em; font-weight: 600; }
  .ds-awards__name { font-weight: 700; color: var(--color-fg); font-size: .9rem; margin-top: .25rem; }
  @media (max-width: 720px) { .ds-awards__row { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Awards",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Recognition" }
  ],
  "blocks": [
    {
      "type": "award",
      "name": "Award",
      "settings": [
        { "type": "text", "id": "icon", "label": "Icon (emoji)", "default": "🏆" },
        { "type": "text", "id": "year", "label": "Year", "default": "2025" },
        { "type": "text", "id": "name", "label": "Name", "default": "Editors' Pick" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Awards", "blocks": [
      { "type": "award", "settings": { "icon": "🏆", "year": "2025", "name": "Editors' Pick" } },
      { "type": "award", "settings": { "icon": "🥇", "year": "2025", "name": "Best New Brand" } },
      { "type": "award", "settings": { "icon": "⭐", "year": "2024", "name": "Top Rated" } },
      { "type": "award", "settings": { "icon": "✨", "year": "2024", "name": "Innovation Award" } }
    ] }]
}
{% endschema %}
`,

  'ds-ugc-gallery': () => `<section class="ds-ugc" id="customer-photos">
  <div class="ds-container">
    <div class="ds-ugc__head">
      <div>
        <div class="ds-ugc__eyebrow">{{ section.settings.eyebrow }}</div>
        <h2 class="ds-ugc__title">{{ section.settings.title }}</h2>
      </div>
      {%- if section.settings.handle != blank -%}
        <a class="ds-ugc__handle" href="{{ section.settings.url | default: '#' }}" target="_blank" rel="noreferrer">{{ section.settings.handle }} ↗</a>
      {%- endif -%}
    </div>
    <div class="ds-ugc__grid">
      {%- for block in section.blocks -%}
        <a class="ds-ugc__tile" href="{{ block.settings.url | default: '#' }}" target="_blank" rel="noreferrer" {{ block.shopify_attributes }}>
          {%- if block.settings.image != blank -%}
            {{ block.settings.image | image_url: width: 600 | image_tag: alt: block.settings.caption, loading: 'lazy' }}
          {%- elsif block.settings.image_url != blank -%}
            <img src="{{ block.settings.image_url }}" alt="{{ block.settings.caption | escape }}" width="600" height="600" loading="lazy">
          {%- endif -%}
          {%- if block.settings.caption != blank -%}
            <div class="ds-ugc__caption">{{ block.settings.caption }}</div>
          {%- endif -%}
        </a>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-ugc { padding: 4rem 0; }
  .ds-ugc__head { display: flex; gap: 1rem; justify-content: space-between; align-items: end; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .ds-ugc__eyebrow { font-size: .72rem; letter-spacing: .18em; text-transform: uppercase; color: var(--color-accent); font-weight: 800; }
  .ds-ugc__title { font-size: clamp(1.4rem, 3vw, 2rem); margin: .35rem 0 0; }
  .ds-ugc__handle { color: var(--color-primary); font-weight: 700; text-decoration: none; }
  .ds-ugc__grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: .5rem; }
  .ds-ugc__tile { position: relative; aspect-ratio: 1/1; overflow: hidden; border-radius: 10px; background: var(--color-surface); display: block; }
  .ds-ugc__tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .25s ease; }
  .ds-ugc__tile:hover img { transform: scale(1.05); }
  .ds-ugc__caption { position: absolute; left: 0; right: 0; bottom: 0; padding: .35rem .5rem; background: linear-gradient(to top, rgba(0,0,0,.7), transparent); color: white; font-size: .7rem; }
  @media (max-width: 720px) { .ds-ugc__grid { grid-template-columns: repeat(3, 1fr); } }
</style>
{% schema %}
{
  "name": "UGC gallery",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "#brand" },
    { "type": "text", "id": "title",   "label": "Title",   "default": "Loved by our community" },
    { "type": "text", "id": "handle",  "label": "Handle",  "default": "@yourbrand on Instagram" },
    { "type": "url",  "id": "url",     "label": "Handle URL" }
  ],
  "blocks": [
    {
      "type": "post",
      "name": "Post",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text", "id": "image_url", "label": "Or image URL (external)" },
        { "type": "text", "id": "caption", "label": "Caption" },
        { "type": "url", "id": "url", "label": "Post URL" }
      ]
    }
  ],
  "max_blocks": 24,
  "presets": [{ "name": "UGC gallery", "blocks": [
      { "type": "post", "settings": { "caption": "@maya" } },
      { "type": "post", "settings": { "caption": "@alexp" } },
      { "type": "post", "settings": { "caption": "@jordan" } },
      { "type": "post", "settings": { "caption": "@sam" } },
      { "type": "post", "settings": { "caption": "@riley" } },
      { "type": "post", "settings": { "caption": "@taylor" } }
    ] }]
}
{% endschema %}
`,

  'ds-testimonials-video': () => `<section class="ds-vtest">
  <div class="ds-container">
    <h2 class="ds-vtest__title">{{ section.settings.title }}</h2>
    <p class="ds-vtest__sub">{{ section.settings.subtitle }}</p>
    <div class="ds-vtest__grid">
      {%- for block in section.blocks -%}
        <article class="ds-vtest__card" {{ block.shopify_attributes }}>
          <div class="ds-vtest__media" style="aspect-ratio: 9/16;">
            {%- if block.settings.poster != blank -%}
              {{ block.settings.poster | image_url: width: 540 | image_tag: alt: block.settings.author, loading: 'lazy' }}
            {%- endif -%}
            <div class="ds-vtest__play">▶</div>
            {%- if block.settings.video_url != blank -%}
              <a class="ds-vtest__cover" href="{{ block.settings.video_url }}" target="_blank" rel="noreferrer" aria-label="Play"></a>
            {%- endif -%}
          </div>
          <div class="ds-vtest__quote">"{{ block.settings.quote }}"</div>
          <div class="ds-vtest__author">— {{ block.settings.author }}</div>
        </article>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-vtest { padding: 4rem 0; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
  .ds-vtest__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 .5rem; }
  .ds-vtest__sub { text-align: center; color: var(--color-muted); margin: 0 0 2rem; }
  .ds-vtest__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-vtest__card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); padding: .75rem; }
  .ds-vtest__media { position: relative; border-radius: calc(var(--radius) * .75); overflow: hidden; background: var(--color-surface); }
  .ds-vtest__media img { width: 100%; height: 100%; object-fit: cover; }
  .ds-vtest__play { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 48px; height: 48px; border-radius: 24px; background: rgba(0,0,0,.6); color: white; display: grid; place-items: center; font-size: 18px; pointer-events: none; }
  .ds-vtest__cover { position: absolute; inset: 0; }
  .ds-vtest__quote { font-size: .85rem; color: var(--color-fg); margin-top: .75rem; line-height: 1.4; }
  .ds-vtest__author { font-size: .78rem; color: var(--color-muted); margin-top: .35rem; font-weight: 600; }
  @media (max-width: 880px) { .ds-vtest__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Video testimonials",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title",    "label": "Title",    "default": "Real customers, real stories" },
    { "type": "text", "id": "subtitle", "label": "Subtitle", "default": "Tap any clip to watch the unedited review." }
  ],
  "blocks": [
    {
      "type": "video",
      "name": "Video testimonial",
      "settings": [
        { "type": "image_picker", "id": "poster", "label": "Thumbnail" },
        { "type": "url", "id": "video_url", "label": "Video URL" },
        { "type": "textarea", "id": "quote", "label": "Quote" },
        { "type": "text", "id": "author", "label": "Author" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Video testimonials", "blocks": [
      { "type": "video", "settings": { "quote": "Honestly the best thing I bought this year.", "author": "Sarah, Austin" } },
      { "type": "video", "settings": { "quote": "Use it every single day.",                     "author": "Alex, Brooklyn" } },
      { "type": "video", "settings": { "quote": "Worth every penny.",                            "author": "Maya, Seattle" } },
      { "type": "video", "settings": { "quote": "I bought two more for my parents.",             "author": "Jordan, Toronto" } }
    ] }]
}
{% endschema %}
`,

  'ds-customer-photos': () => `<section class="ds-cphotos">
  <div class="ds-container">
    <h2 class="ds-cphotos__title">{{ section.settings.title }}</h2>
    <div class="ds-cphotos__grid">
      {%- for block in section.blocks -%}
        <figure class="ds-cphotos__cell" {{ block.shopify_attributes }}>
          {%- if block.settings.image != blank -%}
            {{ block.settings.image | image_url: width: 600 | image_tag: alt: block.settings.author, loading: 'lazy' }}
          {%- elsif block.settings.image_url != blank -%}
            <img src="{{ block.settings.image_url }}" alt="{{ block.settings.author | escape }}" width="600" height="600" loading="lazy">
          {%- endif -%}
          <figcaption>
            <div class="ds-cphotos__rating">★★★★★</div>
            <div class="ds-cphotos__author">{{ block.settings.author }}</div>
            <div class="ds-cphotos__note">{{ block.settings.note }}</div>
          </figcaption>
        </figure>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-cphotos { padding: 4rem 0; }
  .ds-cphotos__title { text-align: center; font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 2rem; }
  .ds-cphotos__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ds-cphotos__cell { margin: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
  .ds-cphotos__cell img { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
  .ds-cphotos__cell figcaption { padding: .8rem 1rem; }
  .ds-cphotos__rating { color: var(--color-accent); letter-spacing: 2px; font-size: 12px; }
  .ds-cphotos__author { font-weight: 700; color: var(--color-fg); font-size: .85rem; margin-top: .2rem; }
  .ds-cphotos__note { color: var(--color-muted); font-size: .8rem; margin-top: .15rem; }
  @media (max-width: 720px) { .ds-cphotos__grid { grid-template-columns: 1fr 1fr; } }
</style>
{% schema %}
{
  "name": "Customer photos",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Real customers, real photos" }
  ],
  "blocks": [
    {
      "type": "photo",
      "name": "Customer photo",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text", "id": "image_url", "label": "Or image URL (external)" },
        { "type": "text", "id": "author", "label": "Author", "default": "Sarah M." },
        { "type": "text", "id": "note", "label": "Note", "default": "Verified buyer" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Customer photos", "blocks": [
      { "type": "photo", "settings": { "author": "Sarah M.", "note": "Verified buyer" } },
      { "type": "photo", "settings": { "author": "Alex P.",  "note": "Verified buyer" } },
      { "type": "photo", "settings": { "author": "Maya R.",  "note": "Verified buyer" } },
      { "type": "photo", "settings": { "author": "Jordan S.","note": "Verified buyer" } }
    ] }]
}
{% endschema %}
`,

  'ds-stars-summary': () => `<section class="ds-stars-sum">
  <div class="ds-container ds-stars-sum__inner">
    <div class="ds-stars-sum__avg">{{ section.settings.average }}</div>
    <div class="ds-stars-sum__stars">★★★★★</div>
    <div class="ds-stars-sum__count">{{ section.settings.count }}</div>
    <div class="ds-stars-sum__bars">
      {%- for block in section.blocks -%}
        <div class="ds-stars-sum__row" {{ block.shopify_attributes }}>
          <span>{{ block.settings.label }}</span>
          <div class="ds-stars-sum__track"><div class="ds-stars-sum__fill" style="width: {{ block.settings.percent }}%;"></div></div>
          <span>{{ block.settings.percent }}%</span>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>
<style>
  .ds-stars-sum { padding: 3rem 0; }
  .ds-stars-sum__inner { display: grid; grid-template-columns: auto auto 1fr; gap: 2rem; align-items: center; max-width: 720px; margin: 0 auto; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
  .ds-stars-sum__avg { font-size: 3rem; font-weight: 900; line-height: 1; color: var(--color-fg); letter-spacing: -0.02em; }
  .ds-stars-sum__stars { color: var(--color-accent); letter-spacing: 3px; font-size: 18px; grid-column: 2; }
  .ds-stars-sum__count { font-size: .8rem; color: var(--color-muted); grid-column: 2; margin-top: .25rem; }
  .ds-stars-sum__bars { grid-column: 3; grid-row: 1 / span 3; display: grid; gap: .35rem; align-self: center; }
  .ds-stars-sum__row { display: grid; grid-template-columns: 20px 1fr 36px; gap: .5rem; align-items: center; font-size: .78rem; color: var(--color-muted); }
  .ds-stars-sum__track { height: 6px; background: color-mix(in srgb, var(--color-fg) 8%, transparent); border-radius: 4px; overflow: hidden; }
  .ds-stars-sum__fill { height: 100%; background: var(--color-accent); border-radius: 4px; }
  @media (max-width: 720px) { .ds-stars-sum__inner { grid-template-columns: 1fr; text-align: center; } .ds-stars-sum__bars { grid-column: 1; grid-row: auto; } }
</style>
{% schema %}
{
  "name": "Stars summary",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "average", "label": "Average rating", "default": "4.9" },
    { "type": "text", "id": "count",   "label": "Count text",    "default": "Based on 2,431 reviews" }
  ],
  "blocks": [
    {
      "type": "bar",
      "name": "Star row",
      "settings": [
        { "type": "text", "id": "label", "label": "Label", "default": "5★" },
        { "type": "range","id": "percent", "label": "Percent", "min": 0, "max": 100, "step": 1, "default": 85, "unit": "%" }
      ]
    }
  ],
  "max_blocks": 5,
  "presets": [{ "name": "Stars summary", "blocks": [
      { "type": "bar", "settings": { "label": "5★", "percent": 88 } },
      { "type": "bar", "settings": { "label": "4★", "percent": 8 } },
      { "type": "bar", "settings": { "label": "3★", "percent": 2 } },
      { "type": "bar", "settings": { "label": "2★", "percent": 1 } },
      { "type": "bar", "settings": { "label": "1★", "percent": 1 } }
    ] }]
}
{% endschema %}
`,

  'ds-marquee': () => `<section class="ds-marquee" style="background: {{ section.settings.bg }}; color: {{ section.settings.fg }};">
  <div class="ds-marquee__track">
    {%- for i in (1..2) -%}
      <div class="ds-marquee__row" aria-hidden="{% if forloop.index > 1 %}true{% else %}false{% endif %}">
        {%- for block in section.blocks -%}
          <span class="ds-marquee__item" {{ block.shopify_attributes }}>{{ block.settings.text }}</span>
          <span class="ds-marquee__dot">·</span>
        {%- endfor -%}
      </div>
    {%- endfor -%}
  </div>
</section>
<style>
  .ds-marquee { overflow: hidden; padding: .9rem 0; border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent); border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent); }
  .ds-marquee__track { display: flex; gap: 2rem; animation: ds-marquee 30s linear infinite; will-change: transform; }
  .ds-marquee__row { display: flex; gap: 2rem; align-items: center; white-space: nowrap; padding-right: 2rem; }
  .ds-marquee__item { font-weight: 800; letter-spacing: .05em; font-size: .92rem; }
  .ds-marquee__dot { opacity: .5; }
  @keyframes ds-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .ds-marquee__track { animation: none; } }
</style>
{% schema %}
{
  "name": "Scrolling marquee",
  "tag": "section",
  "settings": [
    { "type": "color", "id": "bg", "label": "Background", "default": "#111111" },
    { "type": "color", "id": "fg", "label": "Text colour", "default": "#FFFFFF" }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Item",
      "settings": [{ "type": "text", "id": "text", "label": "Text", "default": "Free shipping over $50" }]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "Marquee", "blocks": [
      { "type": "item", "settings": { "text": "★ Loved by 12,400+ customers" } },
      { "type": "item", "settings": { "text": "Free shipping over $50" } },
      { "type": "item", "settings": { "text": "30-day money-back guarantee" } },
      { "type": "item", "settings": { "text": "Ships in 24 hours" } },
      { "type": "item", "settings": { "text": "Real-human support" } }
    ] }]
}
{% endschema %}
`,
}
