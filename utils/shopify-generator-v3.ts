import JSZip from 'jszip'
import type { NovaThemeContent, NovaThemeColors } from './shopify-generator-v2'

function normalize(contentInput: Partial<NovaThemeContent>): NovaThemeContent {
  return {
    brand: {
      name: contentInput.brand?.name || 'Zenya Store',
      tagline: contentInput.brand?.tagline || 'Premium products, clear storytelling, and conversion-first design.'
    },
    hero: {
      heading: contentInput.hero?.heading || 'A premium one-product storefront that feels custom built',
      subheading:
        contentInput.hero?.subheading ||
        'Turn product interest into trust with modern sections, strong hierarchy, and a cleaner buying path.',
      primaryLabel: contentInput.hero?.primaryLabel || 'Shop the offer',
      secondaryLabel: contentInput.hero?.secondaryLabel || 'See details'
    },
    highlights: (contentInput.highlights?.length
      ? contentInput.highlights
      : [
          { title: 'Fast shipping', text: 'Clear delivery expectations and tracked orders.' },
          { title: 'Secure checkout', text: 'A friction-light buying flow shoppers trust.' },
          { title: 'Premium quality', text: 'Stronger positioning with proof-led messaging.' }
        ]).slice(0, 6),
    testimonials: (contentInput.testimonials?.length
      ? contentInput.testimonials
      : [
          { name: 'Sarah M.', text: 'The product page feels premium and makes the buying decision easy.' },
          { name: 'Adam K.', text: 'Beautiful layout, clear messaging, and better trust than most simple themes.' },
          { name: 'Lina R.', text: 'The structure looks polished and still stays easy to edit inside Shopify.' }
        ]).slice(0, 6),
    faq: (contentInput.faq?.length
      ? contentInput.faq
      : [
          { question: 'How long does shipping take?', answer: 'Most orders arrive in 3-7 business days.' },
          { question: 'Can the merchant edit the theme later?', answer: 'Yes, the key text, layout, colors, spacing, and blocks are editable in Shopify Editor.' },
          { question: 'Can the product page feel premium?', answer: 'Yes, the theme includes stronger structure, trust content, and richer conversion sections.' }
        ]).slice(0, 8),
    product: {
      reassurance:
        contentInput.product?.reassurance ||
        'Secure checkout, tracked delivery, and a cleaner post-generation editing experience.'
    }
  }
}

function withSchema(markup: string, schema: Record<string, unknown>) {
  return `${markup}\n{% schema %}\n${JSON.stringify(schema, null, 2)}\n{% endschema %}\n`
}

function buildBlocks<T>(
  items: T[],
  prefix: string,
  type: string,
  mapSettings: (item: T, index: number) => Record<string, unknown>
) {
  const blocks: Record<string, { type: string; settings: Record<string, unknown> }> = {}
  const blockOrder: string[] = []

  items.forEach((item, index) => {
    const id = `${prefix}${index + 1}`
    blocks[id] = { type, settings: mapSettings(item, index) }
    blockOrder.push(id)
  })

  return { blocks, block_order: blockOrder }
}

function addSection(zip: JSZip, filename: string, markup: string, schema: Record<string, unknown>) {
  zip.folder('sections')?.file(filename, withSchema(markup, schema))
}

export function generateShopifyThemeV3OneProduct(
  contentInput: Partial<NovaThemeContent>,
  colors: NovaThemeColors
) {
  const zip = new JSZip()
  const content = normalize(contentInput)
  const themeColors = {
    primary: colors.primary || '#5b5bd6',
    accent: colors.accent || '#22c55e',
    background: colors.background || '#f5f7fb',
    surface: colors.surface || '#ffffff',
    text: colors.text || '#111827',
    border: '#d8dfeb'
  }

  const homeBenefits = buildBlocks(content.highlights, 'benefit_', 'benefit', (item) => ({
    icon: '?',
    title: item.title,
    text: item.text
  }))
  const testimonials = buildBlocks(content.testimonials, 'review_', 'review', (item) => ({
    stars: '?????',
    text: item.text,
    author: item.name,
    meta: 'Verified buyer',
    verified: true
  }))
  const faqBlocks = buildBlocks(content.faq, 'faq_', 'faq', (item) => ({
    question: item.question,
    answer: item.answer
  }))
  const featureCards = buildBlocks(content.highlights, 'feature_', 'card', (item, index) => ({
    eyebrow: index === 0 ? 'Most important' : 'Editable',
    title: item.title,
    text: item.text,
    badge: index === 0 ? 'Core benefit' : 'Flexible'
  }))
  const productStoryBlocks = buildBlocks(content.highlights.slice(0, 4), 'point_', 'point', (item, index) => ({
    title: item.title,
    text: item.text,
    badge: index === 0 ? 'Why it converts' : 'Merchant editable'
  }))
  const productDetailTabs = buildBlocks(content.highlights.slice(0, 3), 'tab_', 'tab', (item, index) => ({
    label: index === 0 ? 'Details' : index === 1 ? 'Materials' : 'Shipping',
    heading: item.title,
    text: item.text,
    secondary_text:
      index === 0
        ? 'Use this tab to explain what the product does and why it deserves attention.'
        : index === 1
          ? 'Add craftsmanship, materials, performance, or finish details here.'
          : 'Explain delivery timing, support, or what the merchant includes after purchase.'
  }))
  const productSpecRows = buildBlocks(content.highlights.slice(0, 4), 'spec_', 'spec', (item, index) => ({
    label: index === 0 ? 'What stands out' : index === 1 ? 'Core advantage' : index === 2 ? 'Best for' : 'Why shoppers care',
    value: item.title,
    text: item.text
  }))
  const productResultMetrics = buildBlocks(content.highlights.slice(0, 3), 'metric_', 'metric', (item, index) => ({
    value: index === 0 ? '4.9/5' : index === 1 ? '30-day' : 'Fast',
    label: index === 0 ? 'Customer rating' : index === 1 ? 'Confidence window' : 'Fulfilment',
    text: index === 0 ? 'Use this block for review proof.' : index === 1 ? 'Use this block for return or guarantee logic.' : 'Use this block for delivery, setup, or ease-of-use proof.'
  }))
  const productStepBlocks = buildBlocks(content.highlights.slice(0, 3), 'step_', 'step', (item, index) => ({
    step: `0${index + 1}`,
    title: item.title,
    text: item.text,
    badge: index === 0 ? 'Simple' : index === 1 ? 'Fast' : 'Premium'
  }))
  const productGalleryCards = buildBlocks(content.highlights.slice(0, 3), 'gallery_', 'card', (item, index) => ({
    kicker: index === 0 ? 'Lifestyle' : index === 1 ? 'Close-up' : 'In use',
    heading: item.title,
    text: item.text
  }))
  const productSignalBlocks = buildBlocks(
    ['Premium quality', 'Editor friendly', 'Trust-led', 'High intent'],
    'signal_',
    'signal',
    (item, index) => ({
      title: item,
      text:
        index === 0
          ? 'Use this to highlight materials, finish, or product positioning.'
          : index === 1
            ? 'Keep the page rich while staying easy to edit inside Shopify.'
            : index === 2
              ? 'Support the offer with reviews, reassurance, and cleaner hierarchy.'
              : 'Use this strip for authority, press-style proof, or shopper confidence.'
    })
  )
  const productLogoBlocks = buildBlocks(
    ['Featured in', 'Design pick', 'Gift guide', 'Top rated'],
    'logo_',
    'logo',
    (item, index) => ({
      name:
        index === 0
          ? `${content.brand.name} Journal`
          : index === 1
            ? 'Modern Living'
            : index === 2
              ? 'Editors Choice'
              : 'Best in category',
      label: item,
      subtext: 'Replace with a real press logo, retailer mark, or authority mention.'
    })
  )
  const productUgcBlocks = buildBlocks(content.testimonials.slice(0, 4), 'ugc_', 'quote', (item, index) => ({
    quote: item.text,
    author: item.name,
    handle: index === 0 ? '@verifiedbuyer' : index === 1 ? '@dailyroutine' : index === 2 ? '@giftguide' : '@trustedreview',
    meta: index === 0 ? 'Verified purchase' : index === 1 ? 'Shared after 2 weeks' : index === 2 ? 'Customer favourite' : 'Real shopper feedback',
    badge: index === 0 ? 'UGC' : index === 1 ? 'Daily use' : index === 2 ? 'Loved' : '5 star'
  }))
  const productSupportBlocks = {
    blocks: {
      ...buildBlocks([0, 1, 2], 'service_', 'service', (_, index) => ({
        title: index === 0 ? 'Shipping' : index === 1 ? 'Returns' : 'Support',
        text:
          index === 0
            ? 'Use this card for shipping speed, fulfilment windows, or delivery coverage.'
            : index === 1
              ? 'Use this for return policy, exchanges, or confidence-building reassurance.'
              : 'Use this for support response times, setup help, or concierge-style assistance.',
        badge: index === 0 ? 'Tracked' : index === 1 ? 'Simple' : 'Helpful'
      })).blocks,
      ...buildBlocks(content.faq.slice(0, 3), 'support_faq_', 'faq', (item) => ({
        question: item.question,
        answer: item.answer
      })).blocks
    },
    block_order: [
      ...buildBlocks([0, 1, 2], 'service_', 'service', (_, index) => ({
        title: index === 0 ? 'Shipping' : index === 1 ? 'Returns' : 'Support',
        text:
          index === 0
            ? 'Use this card for shipping speed, fulfilment windows, or delivery coverage.'
            : index === 1
              ? 'Use this for return policy, exchanges, or confidence-building reassurance.'
              : 'Use this for support response times, setup help, or concierge-style assistance.',
        badge: index === 0 ? 'Tracked' : index === 1 ? 'Simple' : 'Helpful'
      })).block_order,
      ...buildBlocks(content.faq.slice(0, 3), 'support_faq_', 'faq', (item) => ({
        question: item.question,
        answer: item.answer
      })).block_order
    ]
  }

  zip.folder('layout')?.file(
    'theme.liquid',
    `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ page_title }}</title>
    {{ content_for_header }}
    {{ 'base.css' | asset_url | stylesheet_tag }}
    <style>
      :root {
        --page-width: {{ settings.page_width | default: 1240 }}px;
        --section-spacing: {{ settings.section_spacing | default: 84 }}px;
        --radius-large: {{ settings.radius_large | default: 28 }}px;
        --radius-small: {{ settings.radius_small | default: 16 }}px;
        --color-primary: {{ settings.color_primary | default: '#5b5bd6' }};
        --color-accent: {{ settings.color_accent | default: '#22c55e' }};
        --color-background: {{ settings.color_background | default: '#f5f7fb' }};
        --color-surface: {{ settings.color_surface | default: '#ffffff' }};
        --color-text: {{ settings.color_text | default: '#111827' }};
        --color-border: {{ settings.color_border | default: '#d8dfeb' }};
        --button-text: {{ settings.button_text_color | default: '#ffffff' }};
        --button-radius: {{ settings.button_radius | default: 100 }}px;
        --font-display: Inter, Arial, sans-serif;
        --font-body: Inter, Arial, sans-serif;
        --font-mono: 'JetBrains Mono', ui-monospace, monospace;
        --muted-text: #5b6474;
        --shadow-soft: 0 24px 80px rgba(15,24,39,.10);
        --shadow-crisp: 0 10px 30px rgba(15,24,39,.08);
      }
    </style>
  </head>
  <body class="theme-direction-{{ settings.design_direction | default: 'modern-minimal' }} {% if settings.enable_page_gradient %}theme-gradient{% endif %}">
    <a class="skip-link" href="#MainContent">Skip to content</a>
    {% sections 'header-group' %}
    <main id="MainContent" role="main" tabindex="-1">{{ content_for_layout }}</main>
    {% sections 'footer-group' %}
  </body>
</html>`
  )

  zip.folder('layout')?.file(
    'password.liquid',
    `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ shop.name }}</title>
    {{ content_for_header }}
    {{ 'base.css' | asset_url | stylesheet_tag }}
  </head>
  <body class="theme-gradient">
    <main id="MainContent" role="main" tabindex="-1">{{ content_for_layout }}</main>
  </body>
</html>`
  )

  const templates = {
    '404.json': { sections: { main: { type: 'main-404' } }, order: ['main'] },
    'article.json': { sections: { main: { type: 'main-article' } }, order: ['main'] },
    'blog.json': { sections: { main: { type: 'main-blog' } }, order: ['main'] },
    'cart.json': { sections: { main: { type: 'main-cart' }, guarantee: { type: 'v3-guarantee-strip' } }, order: ['main', 'guarantee'] },
    'collection.json': { sections: { main: { type: 'main-collection' }, email: { type: 'v3-email-capture' } }, order: ['main', 'email'] },
    'index.json': {
      sections: {
        hero: { type: 'v3-hero-video' },
        benefits: { type: 'v3-benefits-bar', ...homeBenefits },
        featured_product: { type: 'v3-featured-product' },
        feature_grid: { type: 'v3-feature-grid', ...featureCards },
        comparison: {
          type: 'v3-comparison',
          blocks: {
            row_1: { type: 'row', settings: { feature: 'Premium presentation', us: true, them: false } },
            row_2: { type: 'row', settings: { feature: 'Shopify-native editing', us: true, them: false } },
            row_3: { type: 'row', settings: { feature: 'Built-in upsells', us: true, them: false } },
            row_4: { type: 'row', settings: { feature: 'Trust-led storytelling', us: true, them: false } }
          },
          block_order: ['row_1', 'row_2', 'row_3', 'row_4']
        },
        social_proof: { type: 'v3-social-proof', ...testimonials },
        faq: { type: 'v3-faq', ...faqBlocks },
        email_capture: { type: 'v3-email-capture' }
      },
      order: ['hero', 'benefits', 'featured_product', 'feature_grid', 'comparison', 'social_proof', 'faq', 'email_capture']
    },
    'list-collections.json': { sections: { main: { type: 'main-list-collections' } }, order: ['main'] },
    'page.json': { sections: { main: { type: 'main-page' } }, order: ['main'] },
    'page.contact.json': { sections: { main: { type: 'main-page' }, form: { type: 'contact-form' } }, order: ['main', 'form'] },
    'password.json': { sections: { main: { type: 'main-password' } }, order: ['main'] },
    'product.json': {
      sections: {
        main: { type: 'v3-main-product' },
        guarantee: { type: 'v3-guarantee-strip' },
        story: { type: 'v3-product-story', ...productStoryBlocks },
        details: { type: 'v3-product-details-tabs', ...productDetailTabs },
        specs: { type: 'v3-product-specs', ...productSpecRows },
        results: { type: 'v3-product-results', ...productResultMetrics },
        gallery: { type: 'v3-product-gallery', ...productGalleryCards },
        logos: { type: 'v3-logo-strip', ...productLogoBlocks },
        signals: { type: 'v3-product-signal-strip', ...productSignalBlocks },
        steps: { type: 'v3-product-steps', ...productStepBlocks },
        ugc: { type: 'v3-ugc-wall', ...productUgcBlocks },
        proof: { type: 'v3-social-proof', ...testimonials },
        founder: { type: 'v3-founder-note' },
        bundles: { type: 'v3-upsell-bundles' },
        support: { type: 'v3-product-support', ...productSupportBlocks },
        faq: { type: 'v3-faq', ...faqBlocks },
        sticky_atc: { type: 'v3-sticky-atc' }
      },
      order: ['main', 'guarantee', 'story', 'details', 'specs', 'results', 'gallery', 'logos', 'signals', 'steps', 'ugc', 'proof', 'founder', 'bundles', 'support', 'faq', 'sticky_atc']
    },
    'search.json': { sections: { main: { type: 'main-search' } }, order: ['main'] }
  }

  Object.entries(templates).forEach(([filename, template]) => {
    zip.folder('templates')?.file(filename, JSON.stringify(template, null, 2))
  })

  addSection(
    zip,
    'main-404.liquid',
    `<section class="zen-page-shell zen-centered"><div class="zen-card zen-stack" style="max-width:760px;text-align:center;"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ section.settings.heading }}</h1><p class="zen-copy">{{ section.settings.text }}</p><a class="zen-btn zen-btn-primary" href="{{ routes.root_url }}">{{ section.settings.button_label }}</a></div></section>`,
    {
      name: 'Main 404',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Page missing' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'This page could not be found' },
        { type: 'textarea', id: 'text', label: 'Text', default: 'The page may have moved, been removed, or never existed.' },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Back to home' }
      ]
    }
  )

  addSection(
    zip,
    'main-article.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><article class="zen-card zen-prose {% if section.settings.content_width == 'narrow' %}zen-narrow{% endif %}"><p class="zen-eyebrow">{{ blog.title }}</p><h1>{{ article.title }}</h1>{% if section.settings.show_meta %}<p class="zen-muted">Published {{ article.published_at | date: "%b %d, %Y" }}{% if article.author != blank %} by {{ article.author }}{% endif %}</p>{% endif %}{{ article.content }}</article></div></section>`,
    {
      name: 'Main Article',
      settings: [
        { type: 'checkbox', id: 'show_meta', label: 'Show publish info', default: true },
        { type: 'select', id: 'content_width', label: 'Content width', default: 'narrow', options: [{ value: 'narrow', label: 'Narrow' }, { value: 'wide', label: 'Wide' }] }
      ]
    }
  )

  addSection(
    zip,
    'main-blog.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ blog.title }}</h1></div>{% paginate blog.articles by section.settings.articles_per_page %}<div class="zen-grid zen-grid-3">{% for article in blog.articles %}<article class="zen-card zen-stack"><h3><a href="{{ article.url }}">{{ article.title }}</a></h3><p class="zen-copy">{{ article.excerpt_or_content | strip_html | truncate: 140 }}</p></article>{% endfor %}</div>{% endpaginate %}</div></section>`,
    {
      name: 'Main Blog',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Latest stories' },
        { type: 'range', id: 'articles_per_page', label: 'Articles per page', min: 3, max: 12, step: 1, default: 6 },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ]
    }
  )

  addSection(
    zip,
    'main-cart.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ section.settings.heading }}</h1><p class="zen-copy">{{ section.settings.subheading }}</p></div>{% if cart.item_count == 0 %}<div class="zen-card zen-stack"><h2>{{ section.settings.empty_heading }}</h2><p class="zen-copy">{{ section.settings.empty_text }}</p><a class="zen-btn zen-btn-primary" href="{{ routes.all_products_collection_url }}">{{ section.settings.empty_button }}</a></div>{% else %}<form class="zen-grid zen-cart-grid" action="{{ routes.cart_url }}" method="post" novalidate><div class="zen-stack">{% for item in cart.items %}<div class="zen-card zen-cart-line"><div>{% if item.image != blank %}{{ item.image | image_url: width: 240 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: item.product.title }}{% endif %}</div><div class="zen-stack zen-stack-tight"><h3><a href="{{ item.url }}">{{ item.product.title }}</a></h3><p class="zen-price">{{ item.final_line_price | money }}</p><label class="zen-label" for="updates_{{ item.key }}">Quantity</label><input class="zen-input" id="updates_{{ item.key }}" type="number" name="updates[]" min="0" value="{{ item.quantity }}"><a class="zen-link" href="{{ item.url_to_remove }}">Remove</a></div></div>{% endfor %}</div><aside class="zen-card zen-stack zen-summary-card"><label class="zen-label" for="Cart-note">Order note</label><textarea class="zen-input" id="Cart-note" name="note" rows="4">{{ cart.note }}</textarea><div class="zen-summary-row"><span>Subtotal</span><strong>{{ cart.total_price | money }}</strong></div><p class="zen-muted">{{ section.settings.checkout_note }}</p><button class="zen-btn zen-btn-secondary zen-btn-full" type="submit" name="update">Update cart</button><button class="zen-btn zen-btn-primary zen-btn-full" type="submit" name="checkout">{{ section.settings.checkout_label }}</button></aside></form>{% endif %}</div></section>`,
    {
      name: 'Main Cart',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Your cart' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Review your order before checkout' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Keep the cart page clean, easy to scan, and ready for conversion.' },
        { type: 'text', id: 'checkout_note', label: 'Checkout note', default: 'Taxes and shipping are calculated at checkout.' },
        { type: 'text', id: 'checkout_label', label: 'Checkout label', default: 'Proceed to checkout' },
        { type: 'text', id: 'empty_heading', label: 'Empty heading', default: 'Your cart is empty' },
        { type: 'textarea', id: 'empty_text', label: 'Empty text', default: 'Start with the hero product or browse the collection to add something beautiful.' },
        { type: 'text', id: 'empty_button', label: 'Empty button', default: 'Continue shopping' }
      ]
    }
  )

  addSection(
    zip,
    'main-collection.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ collection.title }}</h1>{% if collection.description != blank and section.settings.show_description %}<p class="zen-copy">{{ collection.description }}</p>{% endif %}</div>{% paginate collection.products by section.settings.products_per_page %}<div class="zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for product in collection.products %}<article class="zen-card zen-stack"><a href="{{ product.url }}">{% if product.featured_image != blank %}{{ product.featured_image | image_url: width: 960 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title }}{% endif %}</a><div class="zen-stack zen-stack-tight"><h3><a href="{{ product.url }}">{{ product.title }}</a></h3>{% if section.settings.show_vendor and product.vendor != blank %}<p class="zen-muted">{{ product.vendor }}</p>{% endif %}<p class="zen-price">{{ product.price | money }}</p></div></article>{% endfor %}</div>{% endpaginate %}</div></section>`,
    {
      name: 'Main Collection',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Collection' },
        { type: 'checkbox', id: 'show_description', label: 'Show description', default: true },
        { type: 'checkbox', id: 'show_vendor', label: 'Show vendor', default: false },
        { type: 'range', id: 'products_per_page', label: 'Products per page', min: 4, max: 24, step: 4, default: 12 },
        { type: 'select', id: 'columns_desktop', label: 'Desktop columns', default: '3', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ]
    }
  )

  addSection(
    zip,
    'main-list-collections.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ section.settings.heading }}</h1><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-3">{% for collection in collections %}<article class="zen-card zen-stack"><h3><a href="{{ collection.url }}">{{ collection.title }}</a></h3><p class="zen-copy">{{ collection.description | strip_html | truncate: 120 }}</p></article>{% endfor %}</div></div></section>`,
    {
      name: 'Main List Collections',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Browse collections' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Explore the catalog' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Group products into clear collection pages that still match the premium one-product brand feel.' },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ]
    }
  )

  addSection(
    zip,
    'main-page.liquid',
    `<section class="zen-page-shell"><div class="{% if section.settings.content_width == 'narrow' %}zen-narrow{% else %}zen-wide{% endif %}"><article class="zen-card zen-prose">{% if section.settings.show_title %}<h1>{{ page.title }}</h1>{% endif %}{{ page.content }}</article></div></section>`,
    {
      name: 'Main Page',
      settings: [
        { type: 'checkbox', id: 'show_title', label: 'Show page title', default: true },
        { type: 'select', id: 'content_width', label: 'Content width', default: 'narrow', options: [{ value: 'narrow', label: 'Narrow' }, { value: 'wide', label: 'Wide' }] }
      ]
    }
  )

  addSection(
    zip,
    'contact-form.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-grid zen-split-grid"><div class="zen-card zen-stack"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.text }}</p></div><div class="zen-card">{% form 'contact' %}{% if form.posted_successfully? %}<p class="zen-success">{{ section.settings.success_text }}</p>{% endif %}{{ form.errors | default_errors }}<div class="zen-field-grid"><div><label class="zen-label" for="ContactFormName">Name</label><input class="zen-input" id="ContactFormName" type="text" name="contact[name]" value="{{ form.name }}"></div><div><label class="zen-label" for="ContactFormEmail">Email</label><input class="zen-input" id="ContactFormEmail" type="email" name="contact[email]" value="{{ form.email }}" required></div></div><div><label class="zen-label" for="ContactFormMessage">Message</label><textarea class="zen-input" id="ContactFormMessage" name="contact[body]" rows="6">{{ form.body }}</textarea></div><button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button>{% endform %}</div></div></section>`,
    {
      name: 'Contact Form',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Contact us' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Talk to the brand directly' },
        { type: 'textarea', id: 'text', label: 'Text', default: 'Use this section for support requests, wholesale conversations, or pre-purchase questions.' },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Send message' },
        { type: 'text', id: 'success_text', label: 'Success text', default: 'Thanks, your message was sent successfully.' }
      ]
    }
  )

  addSection(
    zip,
    'main-password.liquid',
    `<section class="zen-page-shell zen-centered" style="min-height:100vh;"><div class="zen-card zen-stack" style="max-width:620px;text-align:center;"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ section.settings.heading }}</h1><p class="zen-copy">{{ section.settings.subheading }}</p>{% form 'storefront_password' %}{{ form.errors | default_errors }}<div class="zen-inline-form"><input class="zen-input" type="password" name="password" placeholder="{{ section.settings.placeholder }}"><button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button></div>{% endform %}</div></section>`,
    {
      name: 'Main Password',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Opening soon' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'A premium storefront is on the way' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Use the password page to tease the launch and collect early demand.' },
        { type: 'text', id: 'placeholder', label: 'Placeholder', default: 'Enter password' },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Enter store' }
      ]
    }
  )

  addSection(
    zip,
    'main-search.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading"><p class="zen-eyebrow">{{ section.settings.eyebrow }}</p><h1>{{ section.settings.heading }}</h1><form class="zen-inline-form" action="{{ routes.search_url }}" method="get" role="search"><input class="zen-input" type="search" name="q" value="{{ search.terms | escape }}" placeholder="{{ section.settings.placeholder }}"><input type="hidden" name="options[prefix]" value="last"><button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button></form></div>{% if search.performed %}<div class="zen-grid zen-grid-3">{% for item in search.results %}<article class="zen-card zen-stack"><p class="zen-eyebrow">{{ item.object_type | capitalize }}</p><h3><a href="{{ item.url }}">{{ item.title }}</a></h3>{% if item.price %}<p class="zen-price">{{ item.price | money }}</p>{% else %}<p class="zen-copy">{{ item.content | strip_html | truncate: 120 }}</p>{% endif %}</article>{% endfor %}</div>{% endif %}</div></section>`,
    {
      name: 'Main Search',
      settings: [
        { type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Search' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Find products, pages, and stories' },
        { type: 'text', id: 'placeholder', label: 'Placeholder', default: 'Search the store' },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Search' }
      ]
    }
  )

  addSection(
    zip,
    'v3-announcement-bar.liquid',
    `<div class="zen-announcement" style="background: {{ section.settings.background }}; color: {{ section.settings.text_color }};"><div class="zen-wide zen-announcement-inner"><p>{{ section.settings.text }}</p>{% if section.settings.show_link and section.settings.link_label != blank %}<a href="{{ section.settings.link_url }}">{{ section.settings.link_label }}</a>{% endif %}</div></div>`,
    {
      name: 'Announcement Bar',
      settings: [
        { type: 'text', id: 'text', label: 'Text', default: 'Free tracked shipping on premium orders today.' },
        { type: 'checkbox', id: 'show_link', label: 'Show link', default: true },
        { type: 'text', id: 'link_label', label: 'Link label', default: 'Shop now' },
        { type: 'url', id: 'link_url', label: 'Link URL' },
        { type: 'color', id: 'background', label: 'Background color', default: '#111827' },
        { type: 'color', id: 'text_color', label: 'Text color', default: '#ffffff' }
      ]
    }
  )

  addSection(
    zip,
    'v3-header.liquid',
    `<header class="zen-header {% if section.settings.enable_sticky %}zen-header-sticky{% endif %}" style="background: {{ section.settings.background }};"><div class="zen-wide zen-header-row"><a class="zen-logo" href="{{ routes.root_url }}">{% if section.settings.logo != blank %}{{ section.settings.logo | image_url: width: 320 | image_tag: loading: 'lazy', alt: shop.name }}{% else %}<span>{{ settings.brand_name | default: shop.name }}</span>{% endif %}</a><nav class="zen-header-nav">{% for link in linklists[section.settings.menu].links %}<a href="{{ link.url }}">{{ link.title }}</a>{% endfor %}</nav><div class="zen-header-actions">{% if section.settings.show_search %}<a class="zen-link" href="{{ routes.search_url }}">Search</a>{% endif %}<a class="zen-link" href="{{ routes.cart_url }}">Cart ({{ cart.item_count }})</a>{% if section.settings.button_label != blank %}<a class="zen-btn zen-btn-primary zen-header-cta" href="{{ section.settings.button_link }}">{{ section.settings.button_label }}</a>{% endif %}</div></div></header>`,
    {
      name: 'Header',
      settings: [
        { type: 'image_picker', id: 'logo', label: 'Logo' },
        { type: 'link_list', id: 'menu', label: 'Menu' },
        { type: 'checkbox', id: 'enable_sticky', label: 'Enable sticky header', default: true },
        { type: 'checkbox', id: 'show_search', label: 'Show search link', default: true },
        { type: 'text', id: 'button_label', label: 'CTA label', default: 'Shop now' },
        { type: 'url', id: 'button_link', label: 'CTA link' },
        { type: 'color', id: 'background', label: 'Background color', default: '#ffffff' }
      ]
    }
  )

  addSection(
    zip,
    'v3-footer.liquid',
    `<footer class="zen-footer" style="background: {{ section.settings.background }}; color: {{ section.settings.text_color }};"><div class="zen-wide zen-footer-grid"><div class="zen-stack zen-stack-tight"><h2>{{ section.settings.heading }}</h2><p>{{ section.settings.text }}</p><div class="zen-footer-socials">{% if settings.social_instagram != blank %}<a href="{{ settings.social_instagram }}">Instagram</a>{% endif %}{% if settings.social_facebook != blank %}<a href="{{ settings.social_facebook }}">Facebook</a>{% endif %}{% if settings.social_tiktok != blank %}<a href="{{ settings.social_tiktok }}">TikTok</a>{% endif %}</div></div><div class="zen-stack zen-stack-tight"><h3>{{ section.settings.menu_heading }}</h3>{% for link in linklists[section.settings.menu].links %}<a class="zen-footer-link" href="{{ link.url }}">{{ link.title }}</a>{% endfor %}</div><div class="zen-stack zen-stack-tight"><h3>{{ section.settings.newsletter_heading }}</h3><p>{{ section.settings.newsletter_text }}</p>{% form 'customer' %}<input type="hidden" name="contact[tags]" value="newsletter"><div class="zen-inline-form"><input class="zen-input" type="email" name="contact[email]" placeholder="{{ section.settings.newsletter_placeholder }}" required><button class="zen-btn zen-btn-secondary" type="submit">{{ section.settings.newsletter_button }}</button></div>{% endform %}</div></div><div class="zen-wide zen-footer-bottom"><p>{{ section.settings.bottom_text }}</p></div></footer>`,
    {
      name: 'Footer',
      settings: [
        { type: 'text', id: 'heading', label: 'Heading', default: content.brand.name },
        { type: 'textarea', id: 'text', label: 'Text', default: content.brand.tagline },
        { type: 'text', id: 'menu_heading', label: 'Menu heading', default: 'Quick links' },
        { type: 'link_list', id: 'menu', label: 'Menu' },
        { type: 'text', id: 'newsletter_heading', label: 'Newsletter heading', default: 'Stay close to the launch' },
        { type: 'textarea', id: 'newsletter_text', label: 'Newsletter text', default: 'Collect email subscribers directly from the footer with a simple brand-aligned prompt.' },
        { type: 'text', id: 'newsletter_placeholder', label: 'Newsletter placeholder', default: 'Enter your email' },
        { type: 'text', id: 'newsletter_button', label: 'Newsletter button', default: 'Join' },
        { type: 'text', id: 'bottom_text', label: 'Bottom text', default: `${content.brand.name} copyright.` },
        { type: 'color', id: 'background', label: 'Background color', default: '#111827' },
        { type: 'color', id: 'text_color', label: 'Text color', default: '#ffffff' }
      ]
    }
  )

  addSection(
    zip,
    'v3-hero-video.liquid',
    `<section class="zen-hero" style="padding-top: {{ section.settings.padding_top }}px; padding-bottom: {{ section.settings.padding_bottom }}px;"><div class="zen-wide"><div class="zen-hero-shell {% if section.settings.layout == 'split' %}zen-hero-split{% endif %}"><div class="zen-hero-media" style="border-radius: {{ section.settings.media_radius }}px;">{% if section.settings.video_url != blank %}<video autoplay muted loop playsinline poster="{% if section.settings.fallback_image != blank %}{{ section.settings.fallback_image | image_url: width: 1800 }}{% endif %}"><source src="{{ section.settings.video_url }}" type="video/mp4"></video>{% elsif section.settings.fallback_image != blank %}{{ section.settings.fallback_image | image_url: width: 1800 | image_tag: loading: 'lazy', alt: section.settings.heading }}{% else %}<div class="zen-hero-placeholder"></div>{% endif %}<div class="zen-hero-overlay" style="background: linear-gradient({{ section.settings.overlay_angle }}deg, {{ section.settings.overlay_start }}, {{ section.settings.overlay_end }}); opacity: {{ section.settings.overlay_opacity | divided_by: 100.0 }};"></div></div><div class="zen-hero-content" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h1 class="zen-hero-heading zen-heading-{{ section.settings.heading_size }}">{{ section.settings.heading }}</h1><p class="zen-copy zen-hero-copy">{{ section.settings.subheading }}</p><div class="zen-inline-actions {% if section.settings.text_align == 'center' %}zen-inline-center{% endif %}">{% if section.settings.button_label != blank %}<a class="zen-btn zen-btn-primary" href="{{ section.settings.button_link }}">{{ section.settings.button_label }}</a>{% endif %}{% if section.settings.secondary_label != blank %}<a class="zen-btn zen-btn-secondary" href="{{ section.settings.secondary_link }}">{{ section.settings.secondary_label }}</a>{% endif %}</div><div class="zen-inline-points {% if section.settings.text_align == 'center' %}zen-inline-center{% endif %}">{% if section.settings.point_1 != blank %}<span class="zen-pill">{{ section.settings.point_1 }}</span>{% endif %}{% if section.settings.point_2 != blank %}<span class="zen-pill">{{ section.settings.point_2 }}</span>{% endif %}{% if section.settings.point_3 != blank %}<span class="zen-pill">{{ section.settings.point_3 }}</span>{% endif %}</div></div></div></div></section>`,
    {
      name: 'Hero Video',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Premium product experience' },
        { type: 'text', id: 'heading', label: 'Heading', default: content.hero.heading },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: content.hero.subheading },
        { type: 'text', id: 'button_label', label: 'Primary button', default: content.hero.primaryLabel },
        { type: 'url', id: 'button_link', label: 'Primary link' },
        { type: 'text', id: 'secondary_label', label: 'Secondary button', default: content.hero.secondaryLabel },
        { type: 'url', id: 'secondary_link', label: 'Secondary link' },
        { type: 'text', id: 'point_1', label: 'Point 1', default: 'Clear trust signals' },
        { type: 'text', id: 'point_2', label: 'Point 2', default: 'Premium visual style' },
        { type: 'text', id: 'point_3', label: 'Point 3', default: 'Easy theme editor control' },
        { type: 'text', id: 'video_url', label: 'Direct MP4 URL', default: 'https://cdn.shopify.com/videos/c/o/v/7f91d3b6ef6e4d7ea8e3b5b3cb6cf0ef.mp4' },
        { type: 'image_picker', id: 'fallback_image', label: 'Fallback image' },
        { type: 'select', id: 'layout', label: 'Layout', default: 'overlay', options: [{ value: 'overlay', label: 'Overlay' }, { value: 'split', label: 'Split' }] },
        { type: 'select', id: 'text_align', label: 'Text align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
        { type: 'select', id: 'heading_size', label: 'Heading size', default: 'xl', options: [{ value: 'l', label: 'Large' }, { value: 'xl', label: 'Extra large' }, { value: 'xxl', label: 'Oversized' }] },
        { type: 'range', id: 'overlay_opacity', label: 'Overlay opacity', min: 0, max: 90, step: 5, default: 45 },
        { type: 'range', id: 'overlay_angle', label: 'Overlay angle', min: 0, max: 180, step: 5, default: 145 },
        { type: 'color', id: 'overlay_start', label: 'Overlay start', default: '#111827' },
        { type: 'color', id: 'overlay_end', label: 'Overlay end', default: '#5b5bd6' },
        { type: 'range', id: 'media_radius', label: 'Media radius', min: 0, max: 48, step: 2, default: 30 },
        { type: 'range', id: 'padding_top', label: 'Top spacing', min: 40, max: 180, step: 4, default: 96 },
        { type: 'range', id: 'padding_bottom', label: 'Bottom spacing', min: 40, max: 180, step: 4, default: 96 }
      ],
      presets: [{ name: 'Hero Video' }]
    }
  )

  addSection(
    zip,
    'v3-benefits-bar.liquid',
    `<section class="zen-page-shell zen-page-shell-tight"><div class="zen-wide"><div class="zen-benefits-bar zen-surface-{{ section.settings.surface_mode }}" style="grid-template-columns: repeat({{ section.settings.columns_desktop }}, minmax(0,1fr));">{% for block in section.blocks %}<div class="zen-benefit-item" {{ block.shopify_attributes }}><div class="zen-benefit-icon">{{ block.settings.icon }}</div><div class="zen-stack zen-stack-tight"><h3>{{ block.settings.title }}</h3><p>{{ block.settings.text }}</p></div></div>{% endfor %}</div></div></section>`,
    {
      name: 'Benefits Bar',
      settings: [
        { type: 'select', id: 'surface_mode', label: 'Surface style', default: 'soft', options: [{ value: 'soft', label: 'Soft' }, { value: 'glass', label: 'Glass' }, { value: 'minimal', label: 'Minimal' }] },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 }
      ],
      blocks: [{ type: 'benefit', name: 'Benefit', settings: [{ type: 'text', id: 'icon', label: 'Icon', default: '?' }, { type: 'text', id: 'title', label: 'Title', default: 'Fast shipping' }, { type: 'text', id: 'text', label: 'Text', default: 'On all premium orders' }] }],
      max_blocks: 6,
      presets: [{ name: 'Benefits Bar' }]
    }
  )

  addSection(
    zip,
    'v3-featured-product.liquid',
    `<section class="zen-page-shell"><div class="zen-wide"><div class="zen-card zen-featured-product"><div class="zen-featured-product-grid {% if section.settings.media_position == 'right' %}zen-featured-product-grid-reverse{% endif %}">{% assign product = all_products[section.settings.product] %}<div class="zen-stack">{% if product.featured_image != blank %}{{ product.featured_image | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title, style: 'transform: rotate(' | append: section.settings.media_angle | append: 'deg);' }}{% else %}<div class="zen-placeholder-box">Select a product in the theme editor</div>{% endif %}</div><div class="zen-stack"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading | default: product.title }}</h2><p class="zen-copy">{{ section.settings.text }}</p>{% if product != blank %}<p class="zen-price">{{ product.price | money }}</p>{% if section.settings.show_description %}<div class="zen-copy">{{ product.description }}</div>{% endif %}{% form 'product', product %}{% if section.settings.show_variant_picker and product.variants.size > 1 %}<label class="zen-label" for="FeaturedProductVariant">Variant</label><select class="zen-input" id="FeaturedProductVariant" name="id">{% for variant in product.variants %}<option value="{{ variant.id }}" {% unless variant.available %}disabled{% endunless %}>{{ variant.title }} - {{ variant.price | money }}</option>{% endfor %}</select>{% else %}<input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">{% endif %}<button class="zen-btn zen-btn-primary zen-btn-full" type="submit">{{ section.settings.button_label }}</button>{% endform %}{% else %}<p class="zen-copy">{{ section.settings.placeholder_text }}</p>{% endif %}<div class="zen-inline-points">{% if section.settings.point_1 != blank %}<span class="zen-pill">{{ section.settings.point_1 }}</span>{% endif %}{% if section.settings.point_2 != blank %}<span class="zen-pill">{{ section.settings.point_2 }}</span>{% endif %}{% if section.settings.point_3 != blank %}<span class="zen-pill">{{ section.settings.point_3 }}</span>{% endif %}</div></div></div></div></div></section>`,
    {
      name: 'Featured Product',
      settings: [
        { type: 'product', id: 'product', label: 'Product' },
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Featured product' },
        { type: 'text', id: 'heading', label: 'Custom heading', default: 'Featured product' },
        { type: 'textarea', id: 'text', label: 'Supporting text', default: 'Use this section to create a premium landing block for the product the merchant wants to push hardest.' },
        { type: 'checkbox', id: 'show_description', label: 'Show product description', default: true },
        { type: 'checkbox', id: 'show_variant_picker', label: 'Show variant picker', default: true },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Add to cart' },
        { type: 'text', id: 'point_1', label: 'Point 1', default: 'Premium presentation' },
        { type: 'text', id: 'point_2', label: 'Point 2', default: 'Native Shopify form' },
        { type: 'text', id: 'point_3', label: 'Point 3', default: 'Easy post-generation edits' },
        { type: 'textarea', id: 'placeholder_text', label: 'Placeholder text', default: 'Choose a product in Shopify Editor to connect this section.' },
        { type: 'select', id: 'media_position', label: 'Media position', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
        { type: 'range', id: 'media_angle', label: 'Media angle', min: -8, max: 8, step: 1, default: 0 }
      ],
      presets: [{ name: 'Featured Product' }]
    }
  )

  addSection(
    zip,
    'v3-feature-grid.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for block in section.blocks %}<article class="zen-card zen-stack" style="transform: rotate({{ section.settings.card_angle }}deg); text-align: {{ section.settings.text_align }};" {{ block.shopify_attributes }}>{% if block.settings.eyebrow != blank %}<p class="zen-eyebrow">{{ block.settings.eyebrow }}</p>{% endif %}<h3>{{ block.settings.title }}</h3><p class="zen-copy">{{ block.settings.text }}</p>{% if block.settings.badge != blank %}<span class="zen-pill">{{ block.settings.badge }}</span>{% endif %}</article>{% endfor %}</div></div></section>`,
    {
      name: 'Feature Grid',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Why the product feels premium' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Make the page feel more custom and complete' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'This section is built for editable storytelling cards so the merchant can keep refining the offer after generation.' },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 },
        { type: 'range', id: 'card_angle', label: 'Card angle', min: -4, max: 4, step: 1, default: 0 },
        { type: 'select', id: 'text_align', label: 'Text align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'card', name: 'Card', settings: [{ type: 'text', id: 'eyebrow', label: 'Eyebrow', default: 'Value' }, { type: 'text', id: 'title', label: 'Title', default: 'Deeply editable card' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Edit the title, supporting copy, visual rhythm, and card count inside Shopify Editor.' }, { type: 'text', id: 'badge', label: 'Badge', default: 'Flexible' }] }],
      max_blocks: 8,
      presets: [{ name: 'Feature Grid' }]
    }
  )

  addSection(
    zip,
    'v3-comparison.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-card zen-comparison-table"><div class="zen-comparison-row zen-comparison-head"><div>{{ section.settings.feature_label }}</div><div>{{ section.settings.us_label }}</div><div>{{ section.settings.them_label }}</div></div>{% for block in section.blocks %}<div class="zen-comparison-row" {{ block.shopify_attributes }}><div>{{ block.settings.feature }}</div><div class="zen-comparison-check {% if block.settings.us %}is-active{% endif %}">{% if block.settings.us %}{{ section.settings.yes_symbol }}{% else %}{{ section.settings.no_symbol }}{% endif %}</div><div class="zen-comparison-check {% if block.settings.them %}is-active{% endif %}">{% if block.settings.them %}{{ section.settings.yes_symbol }}{% else %}{{ section.settings.no_symbol }}{% endif %}</div></div>{% endfor %}</div></div></section>`,
    {
      name: 'Comparison',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Why this wins' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Position the offer against weaker alternatives' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Comparison sections help the generated theme feel more complete and more conversion-focused.' },
        { type: 'text', id: 'feature_label', label: 'Feature label', default: 'Feature' },
        { type: 'text', id: 'us_label', label: 'Our label', default: 'This brand' },
        { type: 'text', id: 'them_label', label: 'Their label', default: 'Others' },
        { type: 'text', id: 'yes_symbol', label: 'Yes symbol', default: 'Yes' },
        { type: 'text', id: 'no_symbol', label: 'No symbol', default: 'No' },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'row', name: 'Row', settings: [{ type: 'text', id: 'feature', label: 'Feature', default: 'Premium messaging' }, { type: 'checkbox', id: 'us', label: 'Our brand has it', default: true }, { type: 'checkbox', id: 'them', label: 'Others have it', default: false }] }],
      max_blocks: 10,
      presets: [{ name: 'Comparison' }]
    }
  )

  addSection(
    zip,
    'v3-social-proof.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for block in section.blocks %}<article class="zen-card zen-stack" {{ block.shopify_attributes }}><p class="zen-stars">{{ block.settings.stars }}</p><p class="zen-copy">"{{ block.settings.text }}"</p><div class="zen-stack zen-stack-tight"><strong>{{ block.settings.author }}</strong><span class="zen-muted">{{ block.settings.meta }}</span>{% if block.settings.verified %}<span class="zen-success">Verified buyer</span>{% endif %}</div></article>{% endfor %}</div></div></section>`,
    {
      name: 'Social Proof',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Proof that feels real' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Customer reviews that support the premium message' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Merchants can edit each review block, the layout, and the supporting text later inside Shopify.' },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'review', name: 'Review', settings: [{ type: 'text', id: 'stars', label: 'Stars', default: '?????' }, { type: 'textarea', id: 'text', label: 'Review text', default: 'The theme feels more premium than a simple generated storefront.' }, { type: 'text', id: 'author', label: 'Author', default: 'Customer name' }, { type: 'text', id: 'meta', label: 'Meta text', default: 'Verified purchase' }, { type: 'checkbox', id: 'verified', label: 'Show verified badge', default: true }] }],
      max_blocks: 8,
      presets: [{ name: 'Social Proof' }]
    }
  )

  addSection(
    zip,
    'v3-faq.liquid',
    `<section class="zen-page-shell"><div class="zen-narrow zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-stack zen-stack-tight">{% for block in section.blocks %}<details class="zen-card zen-faq-item" {% if section.settings.open_first and forloop.first %}open{% endif %} {{ block.shopify_attributes }}><summary>{{ block.settings.question }}</summary><div class="zen-copy">{{ block.settings.answer }}</div></details>{% endfor %}</div></div></section>`,
    {
      name: 'FAQ',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Questions answered' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Frequently asked questions' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'This section keeps high-intent objections out of the way and stays editable inside the theme editor.' },
        { type: 'checkbox', id: 'open_first', label: 'Open first item', default: true },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'faq', name: 'FAQ item', settings: [{ type: 'text', id: 'question', label: 'Question', default: 'How editable is the generated theme?' }, { type: 'textarea', id: 'answer', label: 'Answer', default: 'The merchant can update headings, body copy, layout choices, section spacing, and most key surface controls directly in Shopify Editor.' }] }],
      max_blocks: 10,
      presets: [{ name: 'FAQ' }]
    }
  )

  addSection(
    zip,
    'v3-email-capture.liquid',
    `<section class="zen-page-shell"><div class="zen-wide"><div class="zen-card zen-email-banner" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p>{% form 'customer' %}<input type="hidden" name="contact[tags]" value="newsletter">{% if form.posted_successfully? %}<p class="zen-success">{{ section.settings.success_text }}</p>{% endif %}<div class="zen-inline-form"><input class="zen-input" type="email" name="contact[email]" placeholder="{{ section.settings.placeholder }}" required><button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button></div>{% endform %}</div></div></section>`,
    {
      name: 'Email Capture',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Retention layer' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Keep warm traffic inside the brand orbit' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'A clean email capture section makes the homepage and collection pages feel more complete.' },
        { type: 'text', id: 'placeholder', label: 'Placeholder', default: 'Enter your email' },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Subscribe' },
        { type: 'text', id: 'success_text', label: 'Success text', default: 'Thanks, you are on the list.' },
        { type: 'select', id: 'text_align', label: 'Text align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      presets: [{ name: 'Email Capture' }]
    }
  )

  addSection(
    zip,
    'v3-main-product.liquid',
    `<section class="zen-page-shell">
      <div class="zen-wide">
        {% assign current_variant = product.selected_or_first_available_variant %}
        {% assign has_offer_blocks = false %}
        {% for block in section.blocks %}
          {% if block.type == 'bundle_option' %}
            {% assign has_offer_blocks = true %}
          {% endif %}
        {% endfor %}
        <div class="zen-product-layout {% if section.settings.media_position == 'right' %}zen-product-layout-reverse{% endif %}">
          <div class="zen-product-gallery zen-stack">
            {% if product.media.size > 0 %}
              <div class="zen-product-main-media">{{ product.featured_media | image_url: width: 1600 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title }}</div>
              {% if section.settings.show_thumbnail_grid %}
                <div class="zen-product-thumbs">
                  {% for media in product.media limit: 6 %}
                    {% if media.media_type == 'image' %}
                      {{ media | image_url: width: 240 | image_tag: class: 'zen-thumb', loading: 'lazy', alt: product.title }}
                    {% endif %}
                  {% endfor %}
                </div>
              {% endif %}
            {% else %}
              <div class="zen-placeholder-box">Product media appears here</div>
            {% endif %}
          </div>
          <div class="zen-card zen-product-buybox zen-stack" data-main-buybox style="text-align: {{ section.settings.text_align }};">
            <div class="zen-product-badges">
              {% if section.settings.badge_text != blank %}<span class="zen-pill">{{ section.settings.badge_text }}</span>{% endif %}
              {% if section.settings.rating_text != blank %}<span class="zen-pill zen-pill-muted">{{ section.settings.rating_text }}</span>{% endif %}
            </div>
            {% if section.settings.show_vendor and product.vendor != blank %}<p class="zen-eyebrow">{{ product.vendor }}</p>{% endif %}
            <h1>{{ product.title }}</h1>
            <div class="zen-product-price-row">
              <p class="zen-price">{{ current_variant.price | money }}</p>
              {% if current_variant.compare_at_price > current_variant.price %}<span class="zen-price-compare">{{ current_variant.compare_at_price | money }}</span>{% endif %}
            </div>
            {% if section.settings.inventory_note != blank %}<p class="zen-product-meta">{{ section.settings.inventory_note }}</p>{% endif %}
            {% if section.settings.show_description %}<div class="zen-copy zen-product-description">{{ product.description }}</div>{% endif %}
            {% form 'product', product %}
              <div class="zen-product-form">
                {% if has_offer_blocks %}
                  <div class="zen-offer-stack" data-offer-stack>
                    <div class="zen-offer-header">
                      <strong>{{ section.settings.bundle_heading }}</strong>
                      <span class="zen-muted">{{ section.settings.bundle_subheading }}</span>
                    </div>
                    {% for block in section.blocks %}
                      {% if block.type == 'bundle_option' %}
                        <label
                          class="zen-offer-card {% if block.settings.highlight %}is-highlighted{% endif %}"
                          data-offer-card
                          data-offer-title="{{ block.settings.title | escape }}"
                          data-offer-price="{{ block.settings.price_text | escape }}"
                          data-offer-subtext="{{ block.settings.subtext | escape }}"
                          data-offer-quantity="{{ block.settings.quantity }}"
                          {{ block.shopify_attributes }}
                        >
                          <input class="zen-offer-radio" type="radio" name="quantity" value="{{ block.settings.quantity }}" {% if block.settings.default_selected %}checked{% endif %}>
                          <div class="zen-offer-card-main">
                            <div>
                              <span class="zen-pill {% unless block.settings.highlight %}zen-pill-muted{% endunless %}">{{ block.settings.kicker }}</span>
                              <strong>{{ block.settings.title }}</strong>
                              <p>{{ block.settings.text }}</p>
                            </div>
                            <div class="zen-offer-price">
                              <strong>{{ block.settings.price_text }}</strong>
                              <span>{{ block.settings.subtext }}</span>
                            </div>
                          </div>
                          {% if block.settings.badge != blank %}<span class="zen-bundle-flag">{{ block.settings.badge }}</span>{% endif %}
                        </label>
                      {% endif %}
                    {% endfor %}
                  </div>
                {% endif %}
                {% if product.variants.size > 1 or section.settings.show_quantity and has_offer_blocks == false %}
                  <div class="zen-field-grid">
                    {% if product.variants.size > 1 %}
                      <div>
                        <label class="zen-label" for="ProductVariant-{{ section.id }}">Variant</label>
                        <select class="zen-input" id="ProductVariant-{{ section.id }}" name="id">
                          {% for variant in product.variants %}
                            <option value="{{ variant.id }}" {% unless variant.available %}disabled{% endunless %}>{{ variant.title }} - {{ variant.price | money }}</option>
                          {% endfor %}
                        </select>
                      </div>
                    {% else %}
                      <input type="hidden" name="id" value="{{ current_variant.id }}">
                    {% endif %}
                    {% if section.settings.show_quantity and has_offer_blocks == false %}
                      <div>
                        <label class="zen-label" for="Quantity-{{ section.id }}">Quantity</label>
                        <input class="zen-input" id="Quantity-{{ section.id }}" type="number" name="quantity" min="1" value="1">
                      </div>
                    {% endif %}
                  </div>
                {% else %}
                  <input type="hidden" name="id" value="{{ current_variant.id }}">
                {% endif %}
                <button class="zen-btn zen-btn-primary zen-btn-full" type="submit">{{ section.settings.button_label }}</button>
                {% if section.settings.show_dynamic_checkout %}<div class="zen-dynamic-checkout">{{ form | payment_button }}</div>{% endif %}
              </div>
            {% endform %}
            {% if section.settings.shipping_note != blank %}<p class="zen-product-shipping">{{ section.settings.shipping_note }}</p>{% endif %}
            <div class="zen-stack zen-stack-tight">
              {% for block in section.blocks %}
                {% if block.type == 'trust_point' %}
                  <div class="zen-trust-line" {{ block.shopify_attributes }}>
                    <span class="zen-trust-icon">{{ block.settings.icon }}</span>
                    <div>
                      <strong>{{ block.settings.title }}</strong>
                      <p>{{ block.settings.text }}</p>
                    </div>
                  </div>
                {% endif %}
              {% endfor %}
            </div>
            <p class="zen-muted">{{ section.settings.reassurance }}</p>
          </div>
        </div>
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', function(){
          var root = document.getElementById('shopify-section-{{ section.id }}');
          if(!root) return;
          var cards = Array.prototype.slice.call(root.querySelectorAll('[data-offer-card]'));
          if(!cards.length) return;
          function syncOffers() {
            var selected = null;
            cards.forEach(function(card){
              var radio = card.querySelector('.zen-offer-radio');
              var isChecked = !!(radio && radio.checked);
              card.classList.toggle('is-selected', isChecked);
              if(isChecked) selected = card;
            });
            if(!selected) selected = cards[0];
            if(!selected) return;
            document.dispatchEvent(new CustomEvent('zenya:offer-change', {
              detail: {
                title: selected.getAttribute('data-offer-title') || '',
                price: selected.getAttribute('data-offer-price') || '',
                subtext: selected.getAttribute('data-offer-subtext') || '',
                quantity: selected.getAttribute('data-offer-quantity') || '1'
              }
            }));
          }
          cards.forEach(function(card){
            var radio = card.querySelector('.zen-offer-radio');
            if(radio){
              radio.addEventListener('change', syncOffers);
            }
            card.addEventListener('click', function(){
              if(radio){
                radio.checked = true;
                syncOffers();
              }
            });
          });
          syncOffers();
        });
      </script>
    </section>`,
    {
      name: 'Main Product',
      settings: [
        { type: 'text', id: 'badge_text', label: 'Badge', default: 'Best seller' },
        { type: 'text', id: 'rating_text', label: 'Rating text', default: '4.9/5 verified reviews' },
        { type: 'checkbox', id: 'show_vendor', label: 'Show vendor', default: false },
        { type: 'checkbox', id: 'show_description', label: 'Show description', default: true },
        { type: 'checkbox', id: 'show_quantity', label: 'Show quantity', default: true },
        { type: 'checkbox', id: 'show_dynamic_checkout', label: 'Show dynamic checkout', default: true },
        { type: 'checkbox', id: 'show_thumbnail_grid', label: 'Show thumbnail grid', default: true },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Add to cart' },
        { type: 'text', id: 'inventory_note', label: 'Inventory note', default: 'Limited stock available for this offer.' },
        { type: 'text', id: 'shipping_note', label: 'Shipping note', default: 'Free tracked shipping and simple returns.' },
        { type: 'text', id: 'bundle_heading', label: 'Bundle selector heading', default: 'Choose your offer' },
        { type: 'text', id: 'bundle_subheading', label: 'Bundle selector subheading', default: 'Show premium quantity offers next to the buy box.' },
        { type: 'textarea', id: 'reassurance', label: 'Reassurance', default: content.product.reassurance },
        { type: 'select', id: 'media_position', label: 'Media position', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
        { type: 'select', id: 'text_align', label: 'Text align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [
        { type: 'bundle_option', name: 'Bundle option', settings: [{ type: 'text', id: 'kicker', label: 'Top label', default: '2 units' }, { type: 'text', id: 'title', label: 'Title', default: 'Buy 2' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Lower per-item cost with a cleaner premium offer.' }, { type: 'text', id: 'price_text', label: 'Price text', default: 'Save 15%' }, { type: 'text', id: 'subtext', label: 'Subtext', default: 'Good for gifting or a spare.' }, { type: 'text', id: 'badge', label: 'Badge', default: 'Popular' }, { type: 'range', id: 'quantity', label: 'Quantity', min: 1, max: 10, step: 1, default: 2 }, { type: 'checkbox', id: 'highlight', label: 'Highlight', default: false }, { type: 'checkbox', id: 'default_selected', label: 'Default selected', default: false }] },
        { type: 'trust_point', name: 'Trust point', settings: [{ type: 'text', id: 'icon', label: 'Icon', default: '?' }, { type: 'text', id: 'title', label: 'Title', default: 'Secure checkout' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Customers can check out confidently with a simple, native Shopify flow.' }] }
      ],
      max_blocks: 8,
      presets: [{ name: 'Main Product', blocks: [{ type: 'bundle_option', settings: { kicker: '2 units', title: 'Buy 2', text: 'Lower per-item cost with a cleaner premium offer.', price_text: 'Save 15%', subtext: 'Good for gifting or a spare.', badge: 'Popular', quantity: 2, highlight: false, default_selected: true } }, { type: 'bundle_option', settings: { kicker: '3 units', title: 'Buy 3', text: 'The highest-converting bundle card for stronger AOV.', price_text: 'Save 20%', subtext: 'Best value for the highest-intent customer.', badge: 'Best value', quantity: 3, highlight: true, default_selected: false } }, { type: 'trust_point' }, { type: 'trust_point', settings: { icon: '?', title: 'Simple returns', text: 'Keep purchase anxiety low with a clear returns message.' } }, { type: 'trust_point', settings: { icon: '?', title: 'Premium feel', text: 'Support the page with a richer trust stack under the buy box.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-guarantee-strip.liquid',
    `<section class="zen-page-shell zen-page-shell-tight"><div class="zen-wide"><div class="zen-benefits-bar zen-surface-soft">{% for block in section.blocks %}<div class="zen-benefit-item" {{ block.shopify_attributes }}><div class="zen-benefit-icon">{{ block.settings.icon }}</div><div class="zen-stack zen-stack-tight"><h3>{{ block.settings.title }}</h3><p>{{ block.settings.text }}</p></div></div>{% endfor %}</div></div></section>`,
    {
      name: 'Guarantee Strip',
      blocks: [{ type: 'item', name: 'Item', settings: [{ type: 'text', id: 'icon', label: 'Icon', default: '?' }, { type: 'text', id: 'title', label: 'Title', default: 'Secure checkout' }, { type: 'text', id: 'text', label: 'Text', default: 'Payments are protected and easy to complete.' }] }],
      max_blocks: 4,
      presets: [{ name: 'Guarantee Strip', blocks: [{ type: 'item' }, { type: 'item', settings: { icon: '?', title: 'Simple returns', text: 'Give buyers confidence with a clear return promise.' } }, { type: 'item', settings: { icon: '?', title: 'Tracked shipping', text: 'Set better expectations with order tracking.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-story.liquid',
    `<section class="zen-page-shell"><div class="zen-wide"><div class="zen-product-section-split {% if section.settings.media_position == 'left' %}zen-product-layout-reverse{% endif %}"><div class="zen-card zen-stack"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.text }}</p>{% if section.settings.secondary_text != blank %}<p class="zen-copy">{{ section.settings.secondary_text }}</p>{% endif %}<div class="zen-check-list">{% for block in section.blocks %}<div class="zen-check-item" {{ block.shopify_attributes }}><div><strong>{{ block.settings.title }}</strong><p>{{ block.settings.text }}</p></div>{% if block.settings.badge != blank %}<span class="zen-pill zen-pill-muted">{{ block.settings.badge }}</span>{% endif %}</div>{% endfor %}</div>{% if section.settings.button_label != blank %}<div><a class="zen-btn zen-btn-secondary" href="{{ section.settings.button_link }}">{{ section.settings.button_label }}</a></div>{% endif %}</div><div class="zen-card zen-stack">{% if section.settings.image != blank %}{{ section.settings.image | image_url: width: 1400 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: section.settings.heading }}{% elsif product.featured_image != blank %}{{ product.featured_image | image_url: width: 1400 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title }}{% else %}<div class="zen-placeholder-box">Add an image in Shopify Editor</div>{% endif %}</div></div></div></section>`,
    {
      name: 'Product Story',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Why the product page feels stronger' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Give the product a fuller story beyond the buy box' },
        { type: 'textarea', id: 'text', label: 'Text', default: 'A premium product page needs more than price and buttons. This section helps merchants explain what makes the product worth choosing.' },
        { type: 'textarea', id: 'secondary_text', label: 'Secondary text', default: 'Use it for feature proof, experience benefits, craftsmanship language, or lifestyle positioning.' },
        { type: 'image_picker', id: 'image', label: 'Image override' },
        { type: 'select', id: 'media_position', label: 'Media position', default: 'right', options: [{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }] },
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Learn more' },
        { type: 'url', id: 'button_link', label: 'Button link' }
      ],
      blocks: [{ type: 'point', name: 'Point', settings: [{ type: 'text', id: 'title', label: 'Title', default: 'A clearer reason to buy' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Use this row to explain one specific reason shoppers choose the product.' }, { type: 'text', id: 'badge', label: 'Badge', default: 'Merchant editable' }] }],
      max_blocks: 6,
      presets: [{ name: 'Product Story', blocks: [{ type: 'point' }, { type: 'point', settings: { title: 'Show stronger proof', text: 'Add the most persuasive product benefit here so the page feels more complete.', badge: 'Trust building' } }, { type: 'point', settings: { title: 'Support the visual story', text: 'Pair lifestyle imagery with clear copy to make the page feel like a real premium PDP.', badge: 'Premium feel' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-details-tabs.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-card zen-stack"><div class="zen-tab-nav" role="tablist" aria-label="{{ section.settings.heading }}">{% for block in section.blocks %}<button class="zen-tab-button {% if forloop.first %}is-active{% endif %}" type="button" role="tab" id="TabButton-{{ section.id }}-{{ forloop.index }}" aria-controls="TabPanel-{{ section.id }}-{{ forloop.index }}" aria-selected="{% if forloop.first %}true{% else %}false{% endif %}" data-tab-target="TabPanel-{{ section.id }}-{{ forloop.index }}" {{ block.shopify_attributes }}>{{ block.settings.label }}</button>{% endfor %}</div><div class="zen-tab-panels">{% for block in section.blocks %}<div class="zen-tab-panel {% if forloop.first %}is-active{% endif %}" id="TabPanel-{{ section.id }}-{{ forloop.index }}" role="tabpanel" aria-labelledby="TabButton-{{ section.id }}-{{ forloop.index }}" {% unless forloop.first %}hidden{% endunless %}><div class="zen-grid zen-grid-2"><div class="zen-stack"><p class="zen-eyebrow">{{ block.settings.label }}</p><h3>{{ block.settings.heading }}</h3><p class="zen-copy">{{ block.settings.text }}</p></div><div class="zen-card zen-stack zen-stack-tight"><strong>{{ section.settings.secondary_heading }}</strong><p class="zen-copy">{{ block.settings.secondary_text }}</p></div></div></div>{% endfor %}</div></div></div><script>document.addEventListener('DOMContentLoaded', function(){var root=document.getElementById('shopify-section-{{ section.id }}');if(!root)return;var buttons=root.querySelectorAll('[data-tab-target]');var panels=root.querySelectorAll('.zen-tab-panel');buttons.forEach(function(button){button.addEventListener('click', function(){var target=button.getAttribute('data-tab-target');buttons.forEach(function(item){item.classList.remove('is-active');item.setAttribute('aria-selected','false');});panels.forEach(function(panel){panel.classList.remove('is-active');panel.setAttribute('hidden','hidden');});button.classList.add('is-active');button.setAttribute('aria-selected','true');var panel=root.querySelector('#'+target);if(panel){panel.classList.add('is-active');panel.removeAttribute('hidden');}});});});</script></section>`,
    {
      name: 'Product Details Tabs',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Details that reduce hesitation' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Show the important product details in a cleaner premium layout' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Tabs make the page feel more complete while keeping the product detail area easy to scan.' },
        { type: 'text', id: 'secondary_heading', label: 'Secondary panel heading', default: 'Why this matters' },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'tab', name: 'Tab', settings: [{ type: 'text', id: 'label', label: 'Tab label', default: 'Details' }, { type: 'text', id: 'heading', label: 'Panel heading', default: 'Everything the shopper should know fast' }, { type: 'textarea', id: 'text', label: 'Main text', default: 'Use this tab for the most important product information so the PDP feels richer and more trustworthy.' }, { type: 'textarea', id: 'secondary_text', label: 'Secondary text', default: 'This secondary panel is ideal for explaining why the detail matters or how it improves the customer experience.' }] }],
      max_blocks: 4,
      presets: [{ name: 'Product Details Tabs', blocks: [{ type: 'tab' }, { type: 'tab', settings: { label: 'Materials', heading: 'Explain what the product is made from', text: 'Use this tab for finish, durability, material quality, or craftsmanship language.', secondary_text: 'Good material details make the product feel more premium and intentional.' } }, { type: 'tab', settings: { label: 'Shipping', heading: 'Set expectations clearly', text: 'Use this tab for fulfilment, shipping time, returns, or support information.', secondary_text: 'Clear logistics reduce hesitation and support trust at the purchase moment.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-specs.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-card zen-stack">{% for block in section.blocks %}<div class="zen-spec-row" {{ block.shopify_attributes }}><div class="zen-stack zen-stack-tight"><span class="zen-eyebrow">{{ block.settings.label }}</span><strong>{{ block.settings.value }}</strong></div><p class="zen-copy">{{ block.settings.text }}</p></div>{% endfor %}</div></div></section>`,
    {
      name: 'Product Specs',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Comparison and specs' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Give the product page a proper specs section' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'This section helps the product page feel more like a high-end PDP instead of a short landing page.' },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'spec', name: 'Spec row', settings: [{ type: 'text', id: 'label', label: 'Label', default: 'What stands out' }, { type: 'text', id: 'value', label: 'Value', default: 'Premium quality' }, { type: 'textarea', id: 'text', label: 'Supporting text', default: 'Use this row for specifications, product fit, performance, compatibility, or comparative value.' }] }],
      max_blocks: 8,
      presets: [{ name: 'Product Specs', blocks: [{ type: 'spec' }, { type: 'spec', settings: { label: 'Core advantage', value: 'Built to feel premium', text: 'Use this row to explain the key shopper-facing difference versus cheaper alternatives.' } }, { type: 'spec', settings: { label: 'Best for', value: 'Daily use or gifting', text: 'A clear use case makes the page feel more complete and reduces guesswork.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-results.liquid',
    `<section class="zen-page-shell"><div class="zen-wide"><div class="zen-product-section-split"><div class="zen-stack"><div class="zen-section-heading" style="text-align: left;"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-3">{% for block in section.blocks %}<article class="zen-card zen-stack zen-stack-tight" {{ block.shopify_attributes }}><strong class="zen-result-value">{{ block.settings.value }}</strong><p class="zen-eyebrow">{{ block.settings.label }}</p><p class="zen-copy">{{ block.settings.text }}</p></article>{% endfor %}</div></div><div class="zen-card zen-stack"><div class="zen-before-after-grid">{% if section.settings.before_image != blank %}<div class="zen-stack zen-stack-tight"><span class="zen-pill zen-pill-muted">{{ section.settings.before_label }}</span>{{ section.settings.before_image | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: section.settings.before_label }}</div>{% endif %}{% if section.settings.after_image != blank %}<div class="zen-stack zen-stack-tight"><span class="zen-pill">{{ section.settings.after_label }}</span>{{ section.settings.after_image | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: section.settings.after_label }}</div>{% endif %}</div>{% if section.settings.caption != blank %}<p class="zen-copy">{{ section.settings.caption }}</p>{% endif %}</div></div></div></section>`,
    {
      name: 'Product Results',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Before and after or results' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Use proof, outcomes, or visual transformation to make the offer stronger' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'This section works for before and after visuals, usage outcomes, performance proof, or measurable trust signals.' },
        { type: 'image_picker', id: 'before_image', label: 'Before image' },
        { type: 'image_picker', id: 'after_image', label: 'After image' },
        { type: 'text', id: 'before_label', label: 'Before label', default: 'Before' },
        { type: 'text', id: 'after_label', label: 'After label', default: 'After' },
        { type: 'textarea', id: 'caption', label: 'Caption', default: 'If the product is not a transformation product, use this space for results, usage proof, or a visual improvement story.' }
      ],
      blocks: [{ type: 'metric', name: 'Metric', settings: [{ type: 'text', id: 'value', label: 'Value', default: '4.9/5' }, { type: 'text', id: 'label', label: 'Label', default: 'Customer rating' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Use this for a metric, guarantee, or performance note that supports the purchase.' }] }],
      max_blocks: 4,
      presets: [{ name: 'Product Results', blocks: [{ type: 'metric' }, { type: 'metric', settings: { value: '30-day', label: 'Confidence window', text: 'Use this for a return promise, guarantee, or trial-style reassurance.' } }, { type: 'metric', settings: { value: 'Fast', label: 'Fulfilment', text: 'Use this block for shipping speed, easy setup, or quick customer payoff.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-steps.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for block in section.blocks %}<article class="zen-card zen-step-card" {{ block.shopify_attributes }}><span class="zen-step-number">{{ block.settings.step }}</span><div class="zen-stack zen-stack-tight"><h3>{{ block.settings.title }}</h3><p class="zen-copy">{{ block.settings.text }}</p>{% if block.settings.badge != blank %}<span class="zen-pill zen-pill-muted">{{ block.settings.badge }}</span>{% endif %}</div></article>{% endfor %}</div></div></section>`,
    {
      name: 'Product Steps',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'How it fits into the shopper journey' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Add a clean usage or process section to the product page' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'This section helps explain how the product works, how to use it, or what the customer experiences after buying.' },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'step', name: 'Step', settings: [{ type: 'text', id: 'step', label: 'Step number', default: '01' }, { type: 'text', id: 'title', label: 'Title', default: 'Unbox and set up fast' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Use this block to explain one simple step in the customer journey or product experience.' }, { type: 'text', id: 'badge', label: 'Badge', default: 'Simple' }] }],
      max_blocks: 6,
      presets: [{ name: 'Product Steps', blocks: [{ type: 'step' }, { type: 'step', settings: { step: '02', title: 'Use it with confidence', text: 'Explain the key usage moment, routine, or benefit that makes the product compelling.', badge: 'Fast' } }, { type: 'step', settings: { step: '03', title: 'Feel the premium payoff', text: 'Use the last card for the emotional result, quality signal, or retention hook.', badge: 'Premium' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-gallery.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for block in section.blocks %}<article class="zen-card zen-stack zen-gallery-card" {{ block.shopify_attributes }}>{% assign media_index = forloop.index0 %}{% assign fallback_media = product.media[media_index] %}{% if block.settings.image != blank %}{{ block.settings.image | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: block.settings.heading }}{% elsif fallback_media != blank and fallback_media.media_type == 'image' %}{{ fallback_media | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title }}{% elsif product.featured_image != blank %}{{ product.featured_image | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title }}{% else %}<div class="zen-placeholder-box">Add a lifestyle image in Shopify Editor</div>{% endif %}<div class="zen-stack zen-stack-tight"><p class="zen-eyebrow">{{ block.settings.kicker }}</p><h3>{{ block.settings.heading }}</h3><p class="zen-copy">{{ block.settings.text }}</p></div></article>{% endfor %}</div></div></section>`,
    {
      name: 'Product Gallery',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Lifestyle and UGC style gallery' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Show the product in context so the PDP feels more complete' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Use this section for lifestyle imagery, use cases, close-up shots, or a cleaner user-generated content style layout.' },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'card', name: 'Gallery card', settings: [{ type: 'image_picker', id: 'image', label: 'Image override' }, { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Lifestyle' }, { type: 'text', id: 'heading', label: 'Heading', default: 'Show the product in a premium environment' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Use this card for a lifestyle scene, close-up detail, or real customer context.' }] }],
      max_blocks: 4,
      presets: [{ name: 'Product Gallery', blocks: [{ type: 'card' }, { type: 'card', settings: { kicker: 'Close-up', heading: 'Highlight texture, finish, or craftsmanship', text: 'A closer shot helps the product feel more intentional and premium.' } }, { type: 'card', settings: { kicker: 'In use', heading: 'Explain the product in the real world', text: 'Use the third card for routine, setup, or outcome-based product context.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-logo-strip.liquid',
    `<section class="zen-page-shell zen-page-shell-tight"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-logo-strip">{% for block in section.blocks %}<article class="zen-logo-block" {{ block.shopify_attributes }}>{% if block.settings.logo != blank %}{{ block.settings.logo | image_url: width: 320 | image_tag: loading: 'lazy', alt: block.settings.name }}{% endif %}<strong>{{ block.settings.name }}</strong><span>{{ block.settings.label }}</span><p>{{ block.settings.subtext }}</p></article>{% endfor %}</div></div></section>`,
    {
      name: 'Logo Strip',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Press and authority strip' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Add real logo blocks so the product page feels more established' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Use these blocks for press mentions, partner retailers, editorial picks, or any authority signal the merchant wants to show.' },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'logo', name: 'Logo block', settings: [{ type: 'image_picker', id: 'logo', label: 'Logo image' }, { type: 'text', id: 'name', label: 'Name', default: 'Press name' }, { type: 'text', id: 'label', label: 'Label', default: 'Featured in' }, { type: 'textarea', id: 'subtext', label: 'Subtext', default: 'Replace with a real press logo, retailer mark, or authority mention.' }] }],
      max_blocks: 6,
      presets: [{ name: 'Logo Strip', blocks: [{ type: 'logo' }, { type: 'logo', settings: { name: 'Modern Living', label: 'Design pick', subtext: 'Use this block for editorial or category authority.' } }, { type: 'logo', settings: { name: 'Editors Choice', label: 'Gift guide', subtext: 'A simple logo strip makes the PDP feel more established.' } }, { type: 'logo', settings: { name: 'Best in category', label: 'Top rated', subtext: 'Swap in real logos or badges after generation.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-signal-strip.liquid',
    `<section class="zen-page-shell zen-page-shell-tight"><div class="zen-wide"><div class="zen-signal-strip">{% for block in section.blocks %}<article class="zen-signal-card" {{ block.shopify_attributes }}><p class="zen-signal-title">{{ block.settings.title }}</p><p>{{ block.settings.text }}</p></article>{% endfor %}</div></div></section>`,
    {
      name: 'Product Signal Strip',
      blocks: [{ type: 'signal', name: 'Signal', settings: [{ type: 'text', id: 'title', label: 'Title', default: 'Premium quality' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Use this for authority, product quality, press-style mentions, or trust cues.' }] }],
      max_blocks: 6,
      presets: [{ name: 'Product Signal Strip', blocks: [{ type: 'signal' }, { type: 'signal', settings: { title: 'Editor friendly', text: 'Keep the PDP rich and still easy to customize inside Shopify.' } }, { type: 'signal', settings: { title: 'Trust led', text: 'Support the offer with cleaner hierarchy, proof, and reassurance.' } }, { type: 'signal', settings: { title: 'High intent', text: 'Use this strip for press mentions, authority, or conversion-oriented proof.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-ugc-wall.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for block in section.blocks %}<article class="zen-card zen-stack zen-ugc-card" {{ block.shopify_attributes }}>{% if block.settings.image != blank %}{{ block.settings.image | image_url: width: 1200 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: block.settings.author }}{% endif %}<div class="zen-ugc-quote-mark">"</div><p class="zen-copy zen-ugc-quote">{{ block.settings.quote }}</p><div class="zen-stack zen-stack-tight"><strong>{{ block.settings.author }}</strong><span class="zen-muted">{{ block.settings.handle }}</span><span class="zen-muted">{{ block.settings.meta }}</span>{% if block.settings.badge != blank %}<span class="zen-pill zen-pill-muted">{{ block.settings.badge }}</span>{% endif %}</div></article>{% endfor %}</div></div></section>`,
    {
      name: 'UGC Wall',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'UGC quote wall' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Layer in social proof that feels closer to real product discovery' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Use this section for customer quotes, creator-style feedback, or lifestyle testimonials that make the PDP feel more premium.' },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'quote', name: 'UGC quote', settings: [{ type: 'image_picker', id: 'image', label: 'Image' }, { type: 'textarea', id: 'quote', label: 'Quote', default: 'The product page feels premium and makes the buying decision easier.' }, { type: 'text', id: 'author', label: 'Author', default: 'Customer name' }, { type: 'text', id: 'handle', label: 'Handle', default: '@verifiedbuyer' }, { type: 'text', id: 'meta', label: 'Meta', default: 'Verified purchase' }, { type: 'text', id: 'badge', label: 'Badge', default: 'UGC' }] }],
      max_blocks: 6,
      presets: [{ name: 'UGC Wall', blocks: [{ type: 'quote' }, { type: 'quote', settings: { author: 'Adam K.', handle: '@dailyroutine', meta: 'Shared after 2 weeks', badge: 'Daily use' } }, { type: 'quote', settings: { author: 'Lina R.', handle: '@giftguide', meta: 'Customer favourite', badge: 'Loved' } }] }]
    }
  )

  addSection(
    zip,
    'v3-founder-note.liquid',
    `<section class="zen-page-shell"><div class="zen-wide"><div class="zen-product-section-split"><div class="zen-card zen-stack"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy zen-founder-quote">"{{ section.settings.quote }}"</p><p class="zen-copy">{{ section.settings.text }}</p><div class="zen-founder-signature"><div class="zen-signature-mark">{{ section.settings.signature_mark }}</div><div class="zen-stack zen-stack-tight"><strong>{{ section.settings.signature_name }}</strong><span class="zen-muted">{{ section.settings.signature_role }}</span><span class="zen-muted">{{ section.settings.signature_note }}</span></div></div></div><div class="zen-card zen-stack">{% if section.settings.image != blank %}{{ section.settings.image | image_url: width: 1400 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: section.settings.heading }}{% elsif product.featured_image != blank %}{{ product.featured_image | image_url: width: 1400 | image_tag: class: 'zen-media-card', loading: 'lazy', alt: product.title }}{% else %}<div class="zen-placeholder-box">Add a founder or brand image in Shopify Editor</div>{% endif %}</div></div></div></section>`,
    {
      name: 'Founder Note',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Founder note or brand promise' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Finish the product page with a more personal premium message' },
        { type: 'textarea', id: 'quote', label: 'Quote', default: 'We built this to feel thoughtful, beautiful, and easy to trust from the first visit.' },
        { type: 'textarea', id: 'text', label: 'Text', default: 'Use this section for founder context, craftsmanship positioning, or a simple brand promise that makes the PDP feel more considered.' },
        { type: 'text', id: 'signature_name', label: 'Signature name', default: content.brand.name },
        { type: 'text', id: 'signature_role', label: 'Signature role', default: 'Founder' },
        { type: 'text', id: 'signature_mark', label: 'Signature mark', default: content.brand.name },
        { type: 'text', id: 'signature_note', label: 'Signature note', default: 'A short founder signature or brand promise line.' },
        { type: 'image_picker', id: 'image', label: 'Image override' }
      ],
      presets: [{ name: 'Founder Note' }]
    }
  )

  addSection(
    zip,
    'v3-upsell-bundles.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-bundle-grid zen-grid zen-grid-{{ section.settings.columns_desktop }}">{% for block in section.blocks %}<article class="zen-bundle-card {% if block.settings.highlight %}is-highlighted{% endif %} zen-stack" {{ block.shopify_attributes }}><div class="zen-bundle-meta"><span class="zen-pill {% unless block.settings.highlight %}zen-pill-muted{% endunless %}">{{ block.settings.kicker }}</span>{% if block.settings.highlight %}<span class="zen-bundle-flag">{{ section.settings.highlight_label }}</span>{% endif %}</div><h3>{{ block.settings.title }}</h3><p class="zen-price">{{ block.settings.discount_text }}</p><p class="zen-copy">{{ block.settings.description }}</p>{% if block.settings.bonus_text != blank %}<p class="zen-bundle-note">{{ block.settings.bonus_text }}</p>{% endif %}{% form 'product', product %}<input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}"><input type="hidden" name="quantity" value="{{ block.settings.quantity }}"><button class="zen-btn {% if block.settings.highlight %}zen-btn-primary{% else %}zen-btn-secondary{% endif %} zen-btn-full" type="submit">{{ block.settings.button_label }}</button>{% endform %}{% if block.settings.subnote != blank %}<p class="zen-muted">{{ block.settings.subnote }}</p>{% endif %}</article>{% endfor %}</div></div></section>`,
    {
      name: 'Upsell Bundles',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Increase order value' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Bundle options that make the offer stronger' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Let the merchant control bundle messaging, quantity tiers, highlight states, and CTA labels.' },
        { type: 'text', id: 'highlight_label', label: 'Highlight label', default: 'Best value' },
        { type: 'range', id: 'columns_desktop', label: 'Desktop columns', min: 2, max: 4, step: 1, default: 3 },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [{ type: 'bundle', name: 'Bundle', settings: [{ type: 'text', id: 'kicker', label: 'Top label', default: '2 units' }, { type: 'text', id: 'title', label: 'Title', default: 'Buy 2' }, { type: 'text', id: 'discount_text', label: 'Discount text', default: 'Save 15%' }, { type: 'textarea', id: 'description', label: 'Description', default: 'Perfect for sharing with a friend.' }, { type: 'text', id: 'bonus_text', label: 'Bonus text', default: 'Lower per-item cost and a stronger perceived offer.' }, { type: 'text', id: 'subnote', label: 'Subnote', default: 'Best for shoppers buying ahead or gifting.' }, { type: 'range', id: 'quantity', label: 'Quantity', min: 1, max: 10, step: 1, default: 2 }, { type: 'checkbox', id: 'highlight', label: 'Highlight', default: false }, { type: 'text', id: 'button_label', label: 'Button label', default: 'Add bundle' }] }],
      max_blocks: 4,
      presets: [{ name: 'Upsell Bundles', blocks: [{ type: 'bundle' }, { type: 'bundle', settings: { kicker: '3 units', title: 'Buy 3', discount_text: 'Save 20%', description: 'Ideal for the best value customer.', bonus_text: 'Makes the offer feel fuller and more premium on the page.', subnote: 'Popular for gifting or keeping a spare.', quantity: 3, highlight: true, button_label: 'Get best value' } }, { type: 'bundle', settings: { kicker: '4 units', title: 'Buy 4', discount_text: 'Save 25%', description: 'For loyal customers stocking up.', bonus_text: 'Push a stronger AOV with a cleaner premium bundle presentation.', subnote: 'Strong option for families or repeat buyers.', quantity: 4, highlight: false, button_label: 'Stock up' } }] }]
    }
  )

  addSection(
    zip,
    'v3-product-support.liquid',
    `<section class="zen-page-shell"><div class="zen-wide zen-stack"><div class="zen-section-heading" style="text-align: {{ section.settings.text_align }};"><p class="zen-eyebrow">{{ section.settings.kicker }}</p><h2>{{ section.settings.heading }}</h2><p class="zen-copy">{{ section.settings.subheading }}</p></div><div class="zen-support-grid"><div class="zen-stack"><h3>{{ section.settings.service_heading }}</h3>{% for block in section.blocks %}{% if block.type == 'service' %}<article class="zen-service-card" {{ block.shopify_attributes }}><div><strong>{{ block.settings.title }}</strong><p>{{ block.settings.text }}</p></div>{% if block.settings.badge != blank %}<span class="zen-pill zen-pill-muted">{{ block.settings.badge }}</span>{% endif %}</article>{% endif %}{% endfor %}</div><div class="zen-stack"><h3>{{ section.settings.faq_heading }}</h3>{% for block in section.blocks %}{% if block.type == 'faq' %}<details class="zen-card zen-faq-item" {% if forloop.first %}open{% endif %} {{ block.shopify_attributes }}><summary>{{ block.settings.question }}</summary><div class="zen-copy">{{ block.settings.answer }}</div></details>{% endif %}{% endfor %}</div></div></div></section>`,
    {
      name: 'Product Support Split',
      settings: [
        { type: 'text', id: 'kicker', label: 'Eyebrow', default: 'Shipping, returns, and support' },
        { type: 'text', id: 'heading', label: 'Heading', default: 'Add a premium split layout for logistics and buying confidence' },
        { type: 'textarea', id: 'subheading', label: 'Subheading', default: 'Use the left side for service cards and the right side for the top product questions so the PDP feels more complete.' },
        { type: 'text', id: 'service_heading', label: 'Service column heading', default: 'Delivery and support' },
        { type: 'text', id: 'faq_heading', label: 'FAQ column heading', default: 'Common questions' },
        { type: 'select', id: 'text_align', label: 'Heading align', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] }
      ],
      blocks: [
        { type: 'service', name: 'Service card', settings: [{ type: 'text', id: 'title', label: 'Title', default: 'Shipping' }, { type: 'textarea', id: 'text', label: 'Text', default: 'Use this for fulfilment windows, shipping promises, or delivery coverage.' }, { type: 'text', id: 'badge', label: 'Badge', default: 'Tracked' }] },
        { type: 'faq', name: 'FAQ item', settings: [{ type: 'text', id: 'question', label: 'Question', default: 'How long does shipping take?' }, { type: 'textarea', id: 'answer', label: 'Answer', default: 'Most orders arrive in 3-7 business days.' }] }
      ],
      max_blocks: 8,
      presets: [{ name: 'Product Support Split', blocks: [{ type: 'service' }, { type: 'service', settings: { title: 'Returns', text: 'Use this card for return policy, exchanges, or confidence-building reassurance.', badge: 'Simple' } }, { type: 'service', settings: { title: 'Support', text: 'Use this for support response times, setup help, or concierge-style assistance.', badge: 'Helpful' } }, { type: 'faq' }, { type: 'faq', settings: { question: 'Can I edit this later?', answer: 'Yes, key text, layout, colors, spacing, and blocks stay editable in Shopify Editor.' } }] }]
    }
  )

  addSection(
    zip,
    'v3-sticky-atc.liquid',
    `<div id="v3-sticky-atc" class="zen-sticky-atc" style="background: {{ section.settings.background }};">
      <div class="zen-wide zen-sticky-atc-row zen-sticky-atc-rich">
        <div class="zen-stack zen-stack-tight zen-sticky-atc-copy">
          <strong>{{ product.title }}</strong>
          <span class="zen-muted">{{ product.selected_or_first_available_variant.price | money }}</span>
          <span class="zen-muted" data-sticky-offer-meta>{{ section.settings.default_offer_text }}</span>
        </div>
        <div class="zen-sticky-offer-pills" data-sticky-offer-pills></div>
        {% form 'product', product %}
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
          <input type="hidden" name="quantity" value="1" data-sticky-quantity>
          <button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button>
        {% endform %}
      </div>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', function(){
        var bar = document.getElementById('v3-sticky-atc');
        if(!bar) return;
        var pillsHost = bar.querySelector('[data-sticky-offer-pills]');
        var offerMeta = bar.querySelector('[data-sticky-offer-meta]');
        var quantityInput = bar.querySelector('[data-sticky-quantity]');
        function syncVisibility() {
          bar.classList.toggle('is-visible', window.scrollY > {{ section.settings.reveal_after }});
        }
        function buildOfferPills() {
          if(!pillsHost) return;
          var sourceCards = Array.prototype.slice.call(document.querySelectorAll('[data-offer-card]'));
          pillsHost.innerHTML = '';
          sourceCards.forEach(function(card){
            var title = card.getAttribute('data-offer-title') || 'Offer';
            var price = card.getAttribute('data-offer-price') || '';
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'zen-sticky-offer-pill';
            button.setAttribute('data-offer-title', title);
            button.textContent = price ? title + ' · ' + price : title;
            button.addEventListener('click', function(){
              var radio = card.querySelector('.zen-offer-radio');
              if(radio){
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
            pillsHost.appendChild(button);
          });
          bar.classList.toggle('has-offers', sourceCards.length > 0);
        }
        function syncSelected(detail) {
          if(quantityInput && detail && detail.quantity) quantityInput.value = detail.quantity;
          if(offerMeta && detail) {
            offerMeta.textContent = detail.title && detail.price ? detail.title + ' · ' + detail.price + ' · Qty ' + detail.quantity : '{{ section.settings.default_offer_text }}';
          }
          if(pillsHost && detail) {
            Array.prototype.slice.call(pillsHost.querySelectorAll('.zen-sticky-offer-pill')).forEach(function(button){
              button.classList.toggle('is-active', button.getAttribute('data-offer-title') === detail.title);
            });
          }
        }
        buildOfferPills();
        syncVisibility();
        window.addEventListener('scroll', syncVisibility, { passive: true });
        document.addEventListener('zenya:offer-change', function(event){
          syncSelected(event.detail);
        });
      });
    </script>`,
    {
      name: 'Sticky Add To Cart',
      settings: [
        { type: 'text', id: 'button_label', label: 'Button label', default: 'Add to cart' },
        { type: 'range', id: 'reveal_after', label: 'Reveal after scroll', min: 100, max: 1200, step: 50, default: 500 },
        { type: 'text', id: 'default_offer_text', label: 'Default offer text', default: 'Select a bundle above to keep the sticky bar in sync.' },
        { type: 'color', id: 'background', label: 'Background color', default: '#ffffff' }
      ],
      presets: [{ name: 'Sticky Add To Cart' }]
    }
  )

  zip.folder('sections')?.file('header-group.json', JSON.stringify({ name: 'Header', type: 'header', sections: { announcement: { type: 'v3-announcement-bar' }, header: { type: 'v3-header' } }, order: ['announcement', 'header'] }, null, 2))
  zip.folder('sections')?.file('footer-group.json', JSON.stringify({ name: 'Footer', type: 'footer', sections: { footer: { type: 'v3-footer' } }, order: ['footer'] }, null, 2))

  zip.folder('config')?.file('settings_schema.json', JSON.stringify([
    {
      name: 'theme_info',
      theme_name: 'Zenya V3 Premium',
      theme_author: 'Zenya AI',
      theme_version: '3.0.0',
      theme_documentation_url: 'https://shopify.dev/docs/storefronts/themes/architecture',
      theme_support_url: 'https://zenyaai.co'
    },
    { name: 'Brand', settings: [{ type: 'text', id: 'brand_name', label: 'Brand name', default: content.brand.name }] },
    {
      name: 'Design',
      settings: [
        {
          type: 'select',
          id: 'design_direction',
          label: 'Design direction',
          default: 'modern-minimal',
          options: [
            { value: 'modern-minimal', label: 'Modern minimal' },
            { value: 'premium', label: 'Premium polished' },
            { value: 'editorial', label: 'Editorial' },
            { value: 'shopify-dark', label: 'Commerce dark' }
          ]
        },
        { type: 'range', id: 'button_radius', label: 'Button radius', min: 0, max: 100, step: 1, default: 100 }
      ]
    },
    {
      name: 'Colors',
      settings: [
        { type: 'color', id: 'color_primary', label: 'Primary', default: themeColors.primary },
        { type: 'color', id: 'color_accent', label: 'Accent', default: themeColors.accent },
        { type: 'color', id: 'color_background', label: 'Background', default: themeColors.background },
        { type: 'color', id: 'color_surface', label: 'Surface', default: themeColors.surface },
        { type: 'color', id: 'color_text', label: 'Text', default: themeColors.text },
        { type: 'color', id: 'color_border', label: 'Border', default: themeColors.border },
        { type: 'color', id: 'button_text_color', label: 'Button text', default: '#ffffff' }
      ]
    },
    {
      name: 'Layout',
      settings: [
        { type: 'range', id: 'page_width', label: 'Page width', min: 960, max: 1600, step: 20, default: 1240 },
        { type: 'range', id: 'section_spacing', label: 'Section spacing', min: 40, max: 140, step: 4, default: 84 },
        { type: 'range', id: 'radius_large', label: 'Large radius', min: 0, max: 40, step: 2, default: 28 },
        { type: 'range', id: 'radius_small', label: 'Small radius', min: 0, max: 28, step: 2, default: 16 },
        { type: 'checkbox', id: 'enable_page_gradient', label: 'Enable background gradient', default: true }
      ]
    },
    {
      name: 'Social',
      settings: [
        { type: 'text', id: 'social_instagram', label: 'Instagram URL', default: 'https://instagram.com/zenyaai' },
        { type: 'text', id: 'social_facebook', label: 'Facebook URL', default: 'https://facebook.com/zenyaai' },
        { type: 'text', id: 'social_tiktok', label: 'TikTok URL', default: 'https://tiktok.com/@zenyaai' }
      ]
    }
  ], null, 2))

  zip.folder('config')?.file('settings_data.json', JSON.stringify({
    current: 'Zenya V3 Premium',
    presets: {
      'Zenya V3 Premium': {
        design_direction: 'modern-minimal',
        color_primary: themeColors.primary,
        color_accent: themeColors.accent,
        color_background: themeColors.background,
        color_surface: themeColors.surface,
        color_text: themeColors.text,
        color_border: themeColors.border,
        button_text_color: '#ffffff',
        button_radius: 100,
        page_width: 1240,
        section_spacing: 84,
        radius_large: 28,
        radius_small: 16,
        enable_page_gradient: true,
        brand_name: content.brand.name,
        social_instagram: 'https://instagram.com/zenyaai',
        social_facebook: 'https://facebook.com/zenyaai',
        social_tiktok: 'https://tiktok.com/@zenyaai'
      }
    }
  }, null, 2))
  zip.folder('locales')?.file('en.default.json', JSON.stringify({ general: { search: { placeholder: 'Search the store' }, newsletter: { success: 'Thanks for subscribing.' } } }, null, 2))
  zip.folder('assets')?.file('base.css', `*{box-sizing:border-box}
html{scroll-behavior:smooth}
:root{color-scheme:light}
body{margin:0;background:var(--color-background);color:var(--color-text);font-family:var(--font-body);line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body.theme-direction-premium{--font-display:Inter,Arial,sans-serif;--font-body:Inter,Arial,sans-serif;--muted-text:#5f6c7b;--shadow-soft:0 30px 90px rgba(15,23,42,.12);--shadow-crisp:0 16px 40px rgba(15,23,42,.08)}
body.theme-direction-modern-minimal{--font-display:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,Arial,sans-serif;--font-body:-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,Arial,sans-serif;--muted-text:#616b7a;--shadow-soft:0 16px 48px rgba(15,23,42,.07);--shadow-crisp:0 8px 24px rgba(15,23,42,.05)}
body.theme-direction-editorial{--font-display:'Iowan Old Style','Charter',Georgia,serif;--font-body:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;--muted-text:#625c57;--shadow-soft:none;--shadow-crisp:none;--button-radius:0px}
body.theme-direction-shopify-dark{--font-display:'Inter',Arial,sans-serif;--font-body:'Inter',Arial,sans-serif;--color-background:#02090A;--color-surface:#061A1C;--color-text:#FFFFFF;--color-border:#1E2C31;--button-text:#02090A;--muted-text:#A1A1AA;--shadow-soft:0 30px 90px rgba(0,0,0,.42);--shadow-crisp:0 16px 40px rgba(0,0,0,.3);color-scheme:dark}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:none}
img,video{display:block;max-width:100%}
h1,h2,h3,h4,h5,h6{margin:0;font-family:var(--font-display);line-height:.98;letter-spacing:-.03em}
h1{font-size:clamp(2.6rem,5vw,5.8rem)}
h2{font-size:clamp(2rem,3.4vw,4rem)}
h3{font-size:clamp(1.2rem,2vw,1.6rem)}
p{margin:0}
button,input,select,textarea{font:inherit}
.skip-link{position:absolute;left:-9999px}
.skip-link:focus{left:1rem;top:1rem;z-index:70;background:#fff;color:#000;padding:.75rem 1rem;border-radius:999px}
.theme-gradient{background:radial-gradient(circle at top left,rgba(91,91,214,.12),transparent 30%),radial-gradient(circle at top right,rgba(34,197,94,.1),transparent 22%),linear-gradient(180deg,rgba(255,255,255,.55),transparent 18%),var(--color-background)}
body.theme-direction-editorial.theme-gradient{background:linear-gradient(180deg,rgba(17,17,17,.04),transparent 12%),var(--color-background)}
body.theme-direction-shopify-dark.theme-gradient{background:radial-gradient(circle at top center,rgba(54,244,164,.08),transparent 24%),radial-gradient(circle at 10% 0%,rgba(16,38,32,.82),transparent 32%),linear-gradient(180deg,#02090A,#02090A)}
.zen-page-shell{padding:var(--section-spacing) 1rem}
.zen-page-shell-tight{padding:24px 1rem}
.zen-wide,.zen-narrow{width:min(100%,var(--page-width));margin:0 auto}
.zen-narrow{max-width:820px}
.zen-centered{display:grid;place-items:center}
.zen-stack{display:flex;flex-direction:column;gap:1.25rem}
.zen-stack-tight{gap:.5rem}
.zen-grid{display:grid;gap:1.5rem}
.zen-grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.zen-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.zen-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.zen-split-grid,.zen-cart-grid,.zen-product-layout,.zen-featured-product-grid,.zen-hero-shell{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem;align-items:center}
.zen-product-layout-reverse>:first-child,.zen-featured-product-grid-reverse>:first-child{order:2}
.zen-card,.zen-benefits-bar,.zen-hero-content,.zen-product-main-media,.zen-sticky-atc,.zen-email-banner{background:color-mix(in srgb,var(--color-surface) 94%,white 6%);border:1px solid var(--color-border);border-radius:var(--radius-large);box-shadow:var(--shadow-soft)}
body.theme-direction-editorial .zen-card,body.theme-direction-editorial .zen-benefits-bar,body.theme-direction-editorial .zen-hero-content,body.theme-direction-editorial .zen-product-main-media,body.theme-direction-editorial .zen-email-banner{background:var(--color-surface);border-radius:0;box-shadow:none}
body.theme-direction-shopify-dark .zen-card,body.theme-direction-shopify-dark .zen-benefits-bar,body.theme-direction-shopify-dark .zen-hero-content,body.theme-direction-shopify-dark .zen-product-main-media,body.theme-direction-shopify-dark .zen-email-banner,body.theme-direction-shopify-dark .zen-sticky-atc{background:rgba(6,26,28,.92)}
.zen-card{padding:clamp(1.25rem,2vw,2rem)}
.zen-copy,.zen-prose p,.zen-muted{color:var(--muted-text)}
.zen-prose{max-width:none}
.zen-prose>*+*{margin-top:1rem}
.zen-section-heading{display:flex;flex-direction:column;gap:1rem;max-width:760px}
.zen-section-heading h1,.zen-section-heading h2{max-width:14ch}
.zen-eyebrow{margin:0;font-family:var(--font-mono);font-size:.8rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--color-primary)}
body.theme-direction-editorial .zen-eyebrow{color:var(--color-text)}
.zen-price{margin:0;font-size:clamp(1.8rem,2vw,2.6rem);font-weight:800;letter-spacing:-.03em}
.zen-btn{display:inline-flex;justify-content:center;align-items:center;gap:.5rem;padding:1rem 1.35rem;border-radius:var(--button-radius);border:1px solid transparent;font-weight:700;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease,background .2s ease,color .2s ease,border-color .2s ease}
.zen-btn:hover{transform:translateY(-1px)}
.zen-btn-full{width:100%}
.zen-btn-primary{background:var(--color-primary);color:var(--button-text);box-shadow:var(--shadow-crisp)}
.zen-btn-secondary{background:transparent;border-color:var(--color-border);color:var(--color-text)}
body.theme-direction-shopify-dark .zen-btn-primary{background:#36F4A4;color:#02090A}
body.theme-direction-shopify-dark .zen-btn-secondary{border-color:#36F4A4;color:#fff}
.zen-pill{display:inline-flex;align-items:center;gap:.35rem;padding:.6rem .9rem;border:1px solid color-mix(in srgb,var(--color-primary) 22%,var(--color-border));border-radius:999px;background:color-mix(in srgb,var(--color-primary) 10%,var(--color-surface));color:var(--color-text);font-size:.84rem;font-weight:700}
body.theme-direction-editorial .zen-pill{border-radius:0;background:transparent}
body.theme-direction-shopify-dark .zen-pill{background:rgba(54,244,164,.08);border-color:rgba(54,244,164,.22);color:#C1FBD4}
.zen-link{text-decoration:underline;text-decoration-thickness:.08em;text-underline-offset:.2em}
.zen-input{width:100%;padding:1rem 1.05rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 2px);background:color-mix(in srgb,var(--color-surface) 94%,white 6%);color:var(--color-text)}
body.theme-direction-shopify-dark .zen-input{background:rgba(2,9,10,.85)}
.zen-input:focus{outline:2px solid color-mix(in srgb,var(--color-primary) 45%,white);outline-offset:2px}
.zen-label{display:block;margin-bottom:.45rem;font-size:.9rem;font-weight:700;color:var(--color-text)}
.zen-field-grid,.zen-inline-form,.zen-header-row,.zen-announcement-inner,.zen-footer-grid,.zen-footer-bottom,.zen-sticky-atc-row{display:flex;gap:1rem}
.zen-field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
.zen-inline-form{align-items:center}
.zen-inline-form .zen-input{flex:1}
.zen-announcement{border-bottom:1px solid rgba(255,255,255,.08)}
.zen-announcement-inner{justify-content:space-between;align-items:center;padding:.85rem 0;font-size:.92rem;font-weight:600}
.zen-header{position:relative;z-index:40;border-bottom:1px solid var(--color-border);backdrop-filter:blur(18px)}
.zen-header-sticky{position:sticky;top:0}
.zen-header-row{align-items:center;justify-content:space-between;padding:1rem 0}
.zen-logo{display:inline-flex;align-items:center;font-family:var(--font-display);font-size:1.15rem;font-weight:800;letter-spacing:-.03em}
.zen-logo img{max-width:180px;height:auto}
.zen-header-nav,.zen-header-actions,.zen-footer-socials{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.zen-header-nav{font-size:.95rem;color:var(--muted-text)}
.zen-header-actions{justify-content:flex-end}
.zen-header-cta{margin-left:.35rem}
.zen-hero{position:relative}
.zen-hero-shell{align-items:stretch}
.zen-hero-media{position:relative;overflow:hidden;min-height:580px;border:1px solid var(--color-border);box-shadow:var(--shadow-soft);background:linear-gradient(135deg,color-mix(in srgb,var(--color-primary) 45%,#0f172a),color-mix(in srgb,var(--color-accent) 28%,#020617))}
.zen-hero-media img,.zen-hero-media video{width:100%;height:100%;object-fit:cover}
.zen-hero-overlay{position:absolute;inset:0;mix-blend-mode:multiply}
.zen-hero-placeholder{height:100%;min-height:580px;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.18),transparent 24%),linear-gradient(135deg,color-mix(in srgb,var(--color-primary) 55%,#0f172a),color-mix(in srgb,var(--color-accent) 26%,#020617))}
.zen-hero-content{position:relative;justify-content:center;padding:clamp(1.5rem,4vw,3rem)}
.zen-hero-heading{max-width:11ch}
.zen-heading-sm{font-size:clamp(2.5rem,4vw,4.25rem)}
.zen-heading-md{font-size:clamp(2.9rem,5vw,5.2rem)}
.zen-heading-lg{font-size:clamp(3.2rem,5.8vw,6.3rem)}
.zen-hero-copy{max-width:56ch;font-size:1.06rem}
.zen-inline-actions,.zen-inline-points{display:flex;flex-wrap:wrap;gap:.85rem}
.zen-inline-center{justify-content:center}
.zen-benefits-bar{display:grid;gap:1rem;padding:1rem}
.zen-benefit-item{display:flex;gap:1rem;align-items:flex-start;padding:1rem;border-radius:calc(var(--radius-small) + 8px);background:color-mix(in srgb,var(--color-surface) 92%,white 8%)}
body.theme-direction-shopify-dark .zen-benefit-item{background:rgba(2,9,10,.75)}
.zen-benefit-item h3{font-size:1.05rem}
.zen-benefit-item p{color:var(--muted-text)}
.zen-benefit-icon{display:grid;place-items:center;min-width:2.75rem;height:2.75rem;border-radius:999px;background:var(--color-primary);color:var(--button-text);font-weight:800}
body.theme-direction-shopify-dark .zen-benefit-icon{background:#36F4A4;color:#02090A}
.zen-surface-soft{background:color-mix(in srgb,var(--color-surface) 95%,white 5%)}
.zen-surface-glass{background:rgba(255,255,255,.72);backdrop-filter:blur(18px)}
.zen-surface-minimal{background:transparent;box-shadow:none}
body.theme-direction-shopify-dark .zen-surface-glass{background:rgba(6,26,28,.72)}
.zen-media-card{width:100%;border-radius:calc(var(--radius-large) - 8px);border:1px solid color-mix(in srgb,var(--color-border) 92%,white 8%);box-shadow:var(--shadow-crisp);overflow:hidden}
body.theme-direction-editorial .zen-media-card{border-radius:0;box-shadow:none}
.zen-placeholder-box{display:grid;place-items:center;min-height:360px;padding:2rem;text-align:center;border:1px dashed var(--color-border);border-radius:calc(var(--radius-large) - 8px);color:var(--muted-text)}
.zen-comparison-table{overflow:hidden}
.zen-comparison-row{display:grid;grid-template-columns:1.4fr .8fr .8fr;gap:1rem;align-items:center;padding:1rem 1.25rem;border-top:1px solid var(--color-border)}
.zen-comparison-row:first-child{border-top:0}
.zen-comparison-head{font-family:var(--font-mono);font-size:.8rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted-text)}
.zen-comparison-check{font-weight:800;text-align:center;color:var(--muted-text)}
.zen-comparison-check.is-active{color:var(--color-primary)}
body.theme-direction-shopify-dark .zen-comparison-check.is-active{color:#36F4A4}
.zen-stars{font-size:.9rem;font-weight:900;letter-spacing:.2em;color:#f59e0b}
.zen-success{font-size:.85rem;font-weight:700;color:#15803d}
body.theme-direction-shopify-dark .zen-success{color:#C1FBD4}
.zen-faq-item summary{cursor:pointer;list-style:none;font-weight:800;font-size:1.05rem}
.zen-faq-item summary::-webkit-details-marker{display:none}
.zen-email-banner{padding:clamp(1.5rem,3vw,2.75rem)}
.zen-product-main-media{padding:.6rem}
.zen-product-gallery{gap:1rem}
.zen-product-buybox{gap:1.1rem;position:sticky;top:110px;align-self:start}
.zen-product-badges{display:flex;flex-wrap:wrap;gap:.7rem}
.zen-pill-muted{background:transparent;border-color:var(--color-border);color:var(--muted-text)}
.zen-product-price-row{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.zen-price-compare{font-size:1.05rem;font-weight:700;color:var(--muted-text);text-decoration:line-through}
.zen-product-meta{font-size:.95rem;font-weight:700;color:color-mix(in srgb,var(--color-primary) 82%,#111827)}
.zen-product-description{max-width:62ch}
.zen-product-form{display:flex;flex-direction:column;gap:1rem}
.zen-product-shipping{font-size:.95rem;color:var(--muted-text)}
.zen-offer-stack{display:flex;flex-direction:column;gap:.9rem}
.zen-offer-header{display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap}
.zen-offer-card{display:flex;flex-direction:column;gap:.85rem;padding:1rem 1.1rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 8px);background:color-mix(in srgb,var(--color-surface) 96%,white 4%);cursor:pointer}
.zen-offer-card.is-highlighted{border-color:color-mix(in srgb,var(--color-primary) 32%,var(--color-border));background:linear-gradient(180deg,color-mix(in srgb,var(--color-primary) 10%,var(--color-surface)),color-mix(in srgb,var(--color-surface) 96%,white 4%))}
.zen-offer-card.is-selected{outline:2px solid color-mix(in srgb,var(--color-primary) 40%,white);outline-offset:2px}
.zen-offer-card-main{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}
.zen-offer-card-main strong{display:block;margin-top:.55rem;font-size:1.02rem}
.zen-offer-card-main p{margin-top:.35rem;color:var(--muted-text)}
.zen-offer-price{display:flex;flex-direction:column;align-items:flex-end;text-align:right;gap:.25rem}
.zen-offer-price strong{font-size:1.1rem;color:var(--color-primary)}
.zen-offer-price span{font-size:.88rem;color:var(--muted-text)}
.zen-offer-radio{accent-color:var(--color-primary);width:1.05rem;height:1.05rem}
.zen-product-thumbs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.85rem}
.zen-thumb{width:100%;border-radius:calc(var(--radius-small) + 4px);border:1px solid var(--color-border)}
.zen-trust-line{display:flex;gap:.9rem;padding:1rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 6px);background:color-mix(in srgb,var(--color-surface) 94%,white 6%)}
.zen-trust-icon{display:grid;place-items:center;min-width:2.2rem;height:2.2rem;border-radius:999px;background:var(--color-primary);color:var(--button-text);font-weight:800}
body.theme-direction-shopify-dark .zen-trust-line{background:rgba(2,9,10,.82)}
.zen-product-section-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem;align-items:center}
.zen-check-list{display:flex;flex-direction:column;gap:1rem}
.zen-check-item{display:flex;justify-content:space-between;gap:1rem;padding:1rem 1.1rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 6px);background:color-mix(in srgb,var(--color-surface) 95%,white 5%)}
.zen-check-item strong{display:block;margin-bottom:.25rem}
.zen-check-item p{color:var(--muted-text)}
.zen-tab-nav{display:flex;gap:.75rem;flex-wrap:wrap}
.zen-tab-button{padding:.85rem 1.1rem;border:1px solid var(--color-border);border-radius:999px;background:transparent;color:var(--muted-text);font:inherit;font-weight:700;cursor:pointer}
.zen-tab-button.is-active{background:var(--color-primary);border-color:var(--color-primary);color:var(--button-text)}
.zen-tab-panels{display:flex;flex-direction:column;gap:1rem}
.zen-tab-panel{display:block}
.zen-spec-row{display:grid;grid-template-columns:.9fr 1.1fr;gap:1.5rem;align-items:start;padding:1rem 0;border-top:1px solid var(--color-border)}
.zen-spec-row:first-child{padding-top:0;border-top:0}
.zen-before-after-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.zen-result-value{font-size:clamp(2rem,3vw,3rem);line-height:1;letter-spacing:-.05em}
.zen-gallery-card{height:100%}
.zen-logo-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}
.zen-logo-block{display:flex;flex-direction:column;gap:.5rem;justify-content:center;align-items:flex-start;padding:1.15rem 1.2rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 8px);background:color-mix(in srgb,var(--color-surface) 95%,white 5%)}
.zen-logo-block img{max-width:150px;height:auto;opacity:.92}
.zen-logo-block span{font-family:var(--font-mono);font-size:.74rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--color-primary)}
.zen-logo-block p{color:var(--muted-text)}
.zen-signal-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}
.zen-signal-card{padding:1.15rem 1.2rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 8px);background:color-mix(in srgb,var(--color-surface) 95%,white 5%)}
.zen-signal-title{margin-bottom:.45rem;font-family:var(--font-mono);font-size:.76rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--color-primary)}
.zen-founder-quote{font-size:clamp(1.2rem,2vw,1.6rem);line-height:1.45;color:var(--color-text)}
.zen-founder-signature{display:flex;align-items:flex-start;gap:1rem;padding-top:.4rem;border-top:1px solid var(--color-border)}
.zen-signature-mark{font-family:'Brush Script MT','Segoe Script',cursive;font-size:clamp(1.8rem,3vw,2.7rem);line-height:1;color:var(--color-primary)}
.zen-ugc-card{height:100%}
.zen-ugc-quote-mark{font-size:3rem;line-height:.7;color:color-mix(in srgb,var(--color-primary) 45%,white)}
.zen-ugc-quote{font-size:1.04rem;line-height:1.8;color:var(--color-text)}
.zen-support-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:1.5rem}
.zen-service-card{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1.1rem 1.15rem;border:1px solid var(--color-border);border-radius:calc(var(--radius-small) + 8px);background:color-mix(in srgb,var(--color-surface) 95%,white 5%)}
.zen-service-card p{margin-top:.35rem;color:var(--muted-text)}
.zen-step-card{display:flex;gap:1rem;align-items:flex-start}
.zen-step-number{display:grid;place-items:center;min-width:3rem;height:3rem;border-radius:999px;background:color-mix(in srgb,var(--color-primary) 12%,var(--color-surface));color:var(--color-primary);font-family:var(--font-mono);font-weight:800}
.zen-bundle-grid{align-items:stretch}
.zen-bundle-card{position:relative;display:flex;flex-direction:column;gap:1rem;padding:1.5rem;border:1px solid var(--color-border);border-radius:var(--radius-large);background:color-mix(in srgb,var(--color-surface) 96%,white 4%);box-shadow:var(--shadow-soft)}
.zen-bundle-card.is-highlighted{background:linear-gradient(180deg,color-mix(in srgb,var(--color-primary) 12%,var(--color-surface)),color-mix(in srgb,var(--color-surface) 94%,white 6%));border-color:color-mix(in srgb,var(--color-primary) 26%,var(--color-border))}
.zen-bundle-meta{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}
.zen-bundle-flag{font-family:var(--font-mono);font-size:.76rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--color-primary)}
.zen-bundle-note{font-size:.95rem;font-weight:700;color:var(--color-text)}
body.theme-direction-shopify-dark .zen-offer-card{background:rgba(6,26,28,.92)}
body.theme-direction-shopify-dark .zen-offer-card.is-highlighted{background:linear-gradient(180deg,rgba(54,244,164,.08),rgba(6,26,28,.92))}
body.theme-direction-shopify-dark .zen-bundle-card{background:rgba(6,26,28,.92)}
body.theme-direction-shopify-dark .zen-bundle-card.is-highlighted{background:linear-gradient(180deg,rgba(54,244,164,.1),rgba(6,26,28,.92))}
body.theme-direction-shopify-dark .zen-logo-block,body.theme-direction-shopify-dark .zen-service-card{background:rgba(6,26,28,.92)}
body.theme-direction-shopify-dark .zen-signal-card{background:rgba(6,26,28,.92)}
.zen-cart-line{display:grid;grid-template-columns:180px 1fr}
.zen-summary-card{position:sticky;top:110px}
.zen-summary-row{justify-content:space-between;align-items:center;padding-top:.5rem;border-top:1px solid var(--color-border)}
.zen-footer{margin-top:2rem}
.zen-footer-grid{display:grid;grid-template-columns:1.3fr .85fr 1fr;gap:2rem;padding:clamp(2rem,4vw,3.5rem) 0}
.zen-footer-link{color:inherit;opacity:.85}
.zen-footer-bottom{justify-content:space-between;align-items:center;padding:1.1rem 0 2rem;border-top:1px solid rgba(255,255,255,.12)}
.zen-sticky-atc{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:60;transform:translateY(calc(100% + 2rem));transition:transform .28s ease}
.zen-sticky-atc.is-visible{transform:translateY(0)}
.zen-sticky-atc-row{justify-content:space-between;align-items:center;padding:1rem 1.2rem}
.zen-sticky-atc-rich{display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:center}
.zen-sticky-atc-copy{min-width:220px}
.zen-sticky-offer-pills{display:none;gap:.75rem;flex-wrap:wrap}
.zen-sticky-atc.has-offers .zen-sticky-offer-pills{display:flex}
.zen-sticky-offer-pill{padding:.8rem 1rem;border:1px solid var(--color-border);border-radius:999px;background:transparent;color:var(--color-text);font:inherit;font-weight:700;cursor:pointer}
.zen-sticky-offer-pill.is-active{background:var(--color-primary);border-color:var(--color-primary);color:var(--button-text)}
.shopify-payment-button{margin-top:.85rem}
.shopify-payment-button__button{border-radius:var(--button-radius)!important;min-height:52px!important}
@media (max-width: 989px){.zen-split-grid,.zen-cart-grid,.zen-product-layout,.zen-featured-product-grid,.zen-hero-shell,.zen-grid-4,.zen-grid-3,.zen-grid-2,.zen-product-section-split,.zen-before-after-grid,.zen-spec-row,.zen-signal-strip,.zen-logo-strip,.zen-support-grid,.zen-sticky-atc-rich{grid-template-columns:1fr}.zen-field-grid,.zen-footer-grid,.zen-product-thumbs{grid-template-columns:1fr 1fr}.zen-header-nav{display:none}.zen-header-row,.zen-announcement-inner,.zen-sticky-atc-row,.zen-inline-form,.zen-offer-card-main,.zen-service-card{flex-direction:column;align-items:stretch}.zen-offer-price{text-align:left;align-items:flex-start}.zen-summary-card,.zen-product-buybox{position:static}.zen-hero-media,.zen-hero-placeholder{min-height:360px}.zen-comparison-row{grid-template-columns:1.2fr .8fr .8fr}}
@media (max-width: 640px){.zen-page-shell{padding:clamp(44px,10vw,68px) 1rem}.zen-card,.zen-email-banner,.zen-hero-content{padding:1.25rem}.zen-field-grid,.zen-product-thumbs{grid-template-columns:1fr}.zen-comparison-row{font-size:.92rem;padding:.9rem}.zen-tab-nav,.zen-sticky-offer-pills{flex-direction:column}.zen-sticky-atc{left:.5rem;right:.5rem;bottom:.5rem}}
`)

  return zip.generateAsync({ type: 'blob' })
}
