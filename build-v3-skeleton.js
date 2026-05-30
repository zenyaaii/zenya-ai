const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, 'shopify-theme-v3');

const files = {
  'layout/theme.liquid': \`<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ page_title }}</title>
    {{ content_for_header }}
    {{ 'base.css' | asset_url | stylesheet_tag }}
  </head>
  <body>
    {% sections 'header-group' %}
    <main id="MainContent" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
  </body>
</html>\`,
  'layout/password.liquid': \`<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ shop.name }}</title>
    {{ content_for_header }}
  </head>
  <body>
    <main id="MainContent" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
  </body>
</html>\`,
  'templates/404.json': \`{
  "sections": { "main": { "type": "main-404" } },
  "order": ["main"]
}\`,
  'templates/article.json': \`{
  "sections": { "main": { "type": "main-article" } },
  "order": ["main"]
}\`,
  'templates/blog.json': \`{
  "sections": { "main": { "type": "main-blog" } },
  "order": ["main"]
}\`,
  'templates/cart.json': \`{
  "sections": { "main": { "type": "main-cart" } },
  "order": ["main"]
}\`,
  'templates/collection.json': \`{
  "sections": { "main": { "type": "main-collection" } },
  "order": ["main"]
}\`,
  'templates/index.json': \`{
  "sections": {
    "hero": { "type": "v3-hero-video" },
    "benefits": { "type": "v3-benefits-bar" },
    "featured_product": { "type": "v3-featured-product" },
    "comparison": { "type": "v3-comparison" },
    "social_proof": { "type": "v3-social-proof" },
    "faq": { "type": "v3-faq" }
  },
  "order": ["hero", "benefits", "featured_product", "comparison", "social_proof", "faq"]
}\`,
  'templates/list-collections.json': \`{
  "sections": { "main": { "type": "main-list-collections" } },
  "order": ["main"]
}\`,
  'templates/page.json': \`{
  "sections": { "main": { "type": "main-page" } },
  "order": ["main"]
}\`,
  'templates/page.contact.json': \`{
  "sections": {
    "main": { "type": "main-page" },
    "form": { "type": "contact-form" }
  },
  "order": ["main", "form"]
}\`,
  'templates/password.json': \`{
  "sections": { "main": { "type": "main-password" } },
  "order": ["main"]
}\`,
  'templates/product.json': \`{
  "sections": {
    "main": { "type": "v3-main-product" },
    "upsell": { "type": "v3-upsell-bundles" },
    "sticky_atc": { "type": "v3-sticky-atc" }
  },
  "order": ["main", "upsell", "sticky_atc"]
}\`,
  'templates/search.json': \`{
  "sections": { "main": { "type": "main-search" } },
  "order": ["main"]
}\`,
  'templates/gift_card.liquid': \`<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Gift Card</title>
    {{ content_for_header }}
  </head>
  <body>
    <main>
      <h1>Here is your gift card!</h1>
    </main>
  </body>
</html>\`,
  'config/settings_schema.json': \`[
  {
    "name": "theme_info",
    "theme_name": "Zenya V3 One Product",
    "theme_author": "Zenya AI",
    "theme_version": "3.0.0",
    "theme_documentation_url": "https://zenyaai.co",
    "theme_support_url": "https://zenyaai.co/support"
  },
  {
    "name": "Colors",
    "settings": [
      {
        "type": "color",
        "id": "color_primary",
        "label": "Primary Color",
        "default": "#000000"
      }
    ]
  }
]\`,
  'locales/en.default.json': \`{
  "general": {
    "404": {
      "title": "Page not found",
      "subtext": "The page you requested does not exist.",
      "link": "Continue shopping"
    }
  }
}\`,
  'assets/base.css': \`body { margin: 0; font-family: sans-serif; background: var(--bg, #fff); color: var(--text, #000); }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.btn { display: inline-block; padding: 10px 20px; background: var(--primary, #000); color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
\`
};

const sections = [
  'main-404', 'main-article', 'main-blog', 'main-cart', 'main-collection',
  'main-list-collections', 'main-page', 'contact-form', 'main-password', 'main-search',
  'v3-hero-video', 'v3-benefits-bar', 'v3-featured-product', 'v3-comparison', 
  'v3-social-proof', 'v3-faq', 'v3-main-product', 'v3-upsell-bundles', 'v3-sticky-atc',
  'header-group', 'footer-group', 'v3-header', 'v3-footer'
];

sections.forEach(sec => {
  if (sec === 'header-group' || sec === 'footer-group') {
    const typeName = sec.split('-')[0];
    files[\`sections/\${sec}.json\`] = \`{
  "name": "\${sec}",
  "type": "\${typeName}",
  "sections": {
    "main": {
      "type": "v3-\${typeName}"
    }
  },
  "order": ["main"]
}\`;
  } else {
    const readableName = sec.replace(/-/g, ' ');
    files[\`sections/\${sec}.liquid\`] = \`<section class="container">
  <h2>\${readableName}</h2>
</section>
{% schema %}
{
  "name": "\${readableName}",
  "settings": [],
  "presets": [{"name": "\${readableName}"}]
}
{% endschema %}
\`;
  }
});

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(themeDir, filepath), content);
}

console.log('V3 Skeleton created successfully.');