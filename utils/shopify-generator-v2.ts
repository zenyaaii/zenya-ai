import JSZip from 'jszip'

export type NovaThemeContent = {
  brand: {
    name: string
    tagline: string
  }
  hero: {
    heading: string
    subheading: string
    primaryLabel: string
    secondaryLabel: string
  }
  highlights: Array<{
    title: string
    text: string
  }>
  testimonials: Array<{
    name: string
    text: string
  }>
  faq: Array<{
    question: string
    answer: string
  }>
  product: {
    reassurance: string
  }
}

export type NovaThemeColors = {
  primary: string
  accent: string
  background?: string
  surface?: string
  text?: string
}

type MarketingSectionSpec = {
  handle: string
  name: string
  heading: string
  subheading: string
  cta: string
  badge: string
}

type SurfaceMode = 'soft' | 'glass' | 'minimal'
type StylePresetId = 'clean_light' | 'bold_gradient' | 'luxury_dark'
type WebsiteStyleId = 'one_product' | 'catalog_store' | 'brand_story'

type PresetSectionModes = {
  heroPanel: SurfaceMode
  marketing: SurfaceMode
  socialProof: SurfaceMode
  faq: SurfaceMode
  productMedia: SurfaceMode
  countdown: SurfaceMode
  volume: SurfaceMode
  upsellBundles: SurfaceMode
  frequentlyBought: SurfaceMode
  guaranteeBar: SurfaceMode
  stickyAtc: SurfaceMode
}

const PRESET_SECTION_MODES: Record<StylePresetId, PresetSectionModes> = {
  clean_light: {
    heroPanel: 'soft',
    marketing: 'soft',
    socialProof: 'soft',
    faq: 'soft',
    productMedia: 'soft',
    countdown: 'glass',
    volume: 'soft',
    upsellBundles: 'soft',
    frequentlyBought: 'soft',
    guaranteeBar: 'soft',
    stickyAtc: 'glass'
  },
  bold_gradient: {
    heroPanel: 'glass',
    marketing: 'glass',
    socialProof: 'glass',
    faq: 'soft',
    productMedia: 'glass',
    countdown: 'glass',
    volume: 'glass',
    upsellBundles: 'glass',
    frequentlyBought: 'glass',
    guaranteeBar: 'soft',
    stickyAtc: 'glass'
  },
  luxury_dark: {
    heroPanel: 'minimal',
    marketing: 'minimal',
    socialProof: 'minimal',
    faq: 'minimal',
    productMedia: 'minimal',
    countdown: 'minimal',
    volume: 'minimal',
    upsellBundles: 'minimal',
    frequentlyBought: 'minimal',
    guaranteeBar: 'minimal',
    stickyAtc: 'minimal'
  }
}

function resolvePresetModes(rawPreset: unknown): PresetSectionModes {
  const preset = rawPreset === 'bold_gradient' || rawPreset === 'luxury_dark' || rawPreset === 'clean_light'
    ? rawPreset
    : 'clean_light'
  return PRESET_SECTION_MODES[preset]
}

function resolveWebsiteStyle(rawStyle: unknown): WebsiteStyleId {
  if (rawStyle === 'catalog_store' || rawStyle === 'brand_story' || rawStyle === 'one_product') return rawStyle
  return 'one_product'
}

function escapeJson(value: string) {
  return JSON.stringify(value ?? '').slice(1, -1)
}

function normalize(content: Partial<NovaThemeContent>): NovaThemeContent {
  const base: NovaThemeContent = {
    brand: {
      name: 'Zenya',
      tagline: 'Modern commerce experiences built for conversion.'
    },
    hero: {
      heading: 'A premium modern storefront from scratch',
      subheading: 'Built for conversion, speed, and clean editing inside Shopify.',
      primaryLabel: 'Shop now',
      secondaryLabel: 'Learn more'
    },
    highlights: [
      { title: 'Fast Shipping', text: 'Orders are dispatched quickly with tracking updates.' },
      { title: 'Secure Checkout', text: 'Payments are encrypted and handled safely.' },
      { title: 'Reliable Support', text: 'Help is available whenever customers need it.' }
    ],
    testimonials: [
      { name: 'Sarah', text: 'Beautiful store and easy checkout. Highly recommended.' },
      { name: 'Adam', text: 'The product quality and delivery speed are excellent.' }
    ],
    faq: [
      { question: 'How long is shipping?', answer: 'Most orders arrive in 3-7 business days.' },
      { question: 'Can I return my order?', answer: 'Yes, returns are available on eligible items.' }
    ],
    product: {
      reassurance: 'Secure checkout, tracked shipping, and simple returns.'
    }
  }

  return {
    brand: {
      name: content.brand?.name || base.brand.name,
      tagline: content.brand?.tagline || base.brand.tagline
    },
    hero: {
      heading: content.hero?.heading || base.hero.heading,
      subheading: content.hero?.subheading || base.hero.subheading,
      primaryLabel: content.hero?.primaryLabel || base.hero.primaryLabel,
      secondaryLabel: content.hero?.secondaryLabel || base.hero.secondaryLabel
    },
    highlights: (content.highlights && content.highlights.length ? content.highlights : base.highlights).slice(0, 6),
    testimonials: (content.testimonials && content.testimonials.length ? content.testimonials : base.testimonials).slice(0, 6),
    faq: (content.faq && content.faq.length ? content.faq : base.faq).slice(0, 8),
    product: {
      reassurance: content.product?.reassurance || base.product.reassurance
    }
  }
}

function buildMarketingSection(spec: MarketingSectionSpec) {
  return `<section class="container zen-section">
  <div class="zen-band zen-surface-{{ section.settings.style_mode }} {% if section.settings.enable_float %}zen-animated{% endif %}">
    <div class="zen-band-head" style="text-align: {{ section.settings.text_align }};">
      {% if section.settings.badge_text != blank %}
        <div class="zen-kicker">{{ section.settings.badge_text }}</div>
      {% endif %}
      <h2 class="zen-heading">{{ section.settings.heading }}</h2>
      <p class="zen-subheading">{{ section.settings.subheading }}</p>
      {% if section.settings.show_chips %}
        <div class="zen-chip-row">
          {% if section.settings.chip_1 != blank %}<span class="zen-pill">{{ section.settings.chip_1 }}</span>{% endif %}
          {% if section.settings.chip_2 != blank %}<span class="zen-pill">{{ section.settings.chip_2 }}</span>{% endif %}
          {% if section.settings.chip_3 != blank %}<span class="zen-pill">{{ section.settings.chip_3 }}</span>{% endif %}
        </div>
      {% endif %}
      {% if section.settings.cta_text != blank %}
        <a class="zen-btn zen-btn-primary" href="{{ section.settings.cta_url }}">{{ section.settings.cta_text }}</a>
      {% endif %}
    </div>
    <div class="zen-band-body">
      <div class="zen-feature-grid" style="--cards: {{ section.settings.columns_desktop }};">
        {% if section.blocks.size > 0 %}
          {% for block in section.blocks %}
            <article class="zen-feature-card" {{ block.shopify_attributes }}>
              <h3>{{ block.settings.title }}</h3>
              <p>{{ block.settings.text }}</p>
            </article>
          {% endfor %}
        {% else %}
          <article class="zen-feature-card"><h3>{{ section.settings.fallback_title_1 }}</h3><p>{{ section.settings.fallback_text_1 }}</p></article>
          <article class="zen-feature-card"><h3>{{ section.settings.fallback_title_2 }}</h3><p>{{ section.settings.fallback_text_2 }}</p></article>
          <article class="zen-feature-card"><h3>{{ section.settings.fallback_title_3 }}</h3><p>{{ section.settings.fallback_text_3 }}</p></article>
        {% endif %}
      </div>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "${escapeJson(spec.name)}",
  "settings": [
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    },
    {
      "type": "select",
      "id": "text_align",
      "label": "Text align",
      "default": "left",
      "options": [
        { "value": "left", "label": "Left" },
        { "value": "center", "label": "Center" }
      ]
    },
    { "type": "range", "id": "columns_desktop", "label": "Cards per row (desktop)", "min": 2, "max": 4, "step": 1, "default": 3 },
    { "type": "checkbox", "id": "enable_float", "label": "Enable float animation", "default": false },
    { "type": "text", "id": "badge_text", "label": "Badge", "default": "${escapeJson(spec.badge)}" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "${escapeJson(spec.heading)}" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "${escapeJson(spec.subheading)}" },
    { "type": "checkbox", "id": "show_chips", "label": "Show chips", "default": true },
    { "type": "text", "id": "chip_1", "label": "Chip 1", "default": "+18% AOV ready" },
    { "type": "text", "id": "chip_2", "label": "Chip 2", "default": "Trust-focused" },
    { "type": "text", "id": "chip_3", "label": "Chip 3", "default": "No extra app needed" },
    { "type": "text", "id": "fallback_title_1", "label": "Fallback card 1 title", "default": "Built for conversion" },
    { "type": "textarea", "id": "fallback_text_1", "label": "Fallback card 1 text", "default": "Designed to reduce drop-off and keep buyers focused on checkout." },
    { "type": "text", "id": "fallback_title_2", "label": "Fallback card 2 title", "default": "Modern visual rhythm" },
    { "type": "textarea", "id": "fallback_text_2", "label": "Fallback card 2 text", "default": "Balanced spacing and color contrast that guide eye movement naturally." },
    { "type": "text", "id": "fallback_title_3", "label": "Fallback card 3 title", "default": "Shopify-native editing" },
    { "type": "textarea", "id": "fallback_text_3", "label": "Fallback card 3 text", "default": "Everything can be customized from the theme editor without extra apps." },
    { "type": "text", "id": "cta_text", "label": "Button label", "default": "${escapeJson(spec.cta)}" },
    { "type": "url", "id": "cta_url", "label": "Button URL", "default": "/collections/all" }
  ],
  "blocks": [
    {
      "type": "point",
      "name": "Point card",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Key point" },
        { "type": "textarea", "id": "text", "label": "Text", "default": "Explain the benefit with clear, direct copy." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [
    {
      "name": "${escapeJson(spec.name)}",
      "blocks": [
        { "type": "point", "settings": { "title": "Built for conversion", "text": "Designed to reduce drop-off and keep buyers focused on checkout." } },
        { "type": "point", "settings": { "title": "Modern visual rhythm", "text": "Balanced spacing and color contrast that guide eye movement naturally." } },
        { "type": "point", "settings": { "title": "Shopify-native editing", "text": "Everything can be customized from the theme editor without extra apps." } }
      ]
    }
  ]
}
{% endschema %}
`
}

export function prepareThemeZipV2(
  contentInput: Partial<NovaThemeContent>,
  colors: NovaThemeColors
): JSZip {
  const rawInput = contentInput as any
  const content = normalize(contentInput)
  const zip = new JSZip()
  const presetModes = resolvePresetModes(rawInput?.stylePreset || rawInput?._preview?.stylePreset)
  const websiteStyle = resolveWebsiteStyle(rawInput?.websiteStyle || rawInput?._preview?.websiteStyle)

  const colorPrimary = colors.primary || '#4f46e5'
  const colorAccent = colors.accent || '#0ea5e9'
  const colorBg = colors.background || '#f6f8ff'
  const colorSurface = colors.surface || '#ffffff'
  const colorText = colors.text || '#0f172a'

  const marketingSections: MarketingSectionSpec[] = [
    { handle: 'v2-value-stack', name: 'Value Stack', heading: 'Everything needed to say yes, in one glance', subheading: 'Stack value clearly, remove friction, and push confident checkouts.', cta: 'Shop the offer', badge: 'High-converting' },
    { handle: 'v2-problem-solution', name: 'Problem Solution', heading: 'Call out the pain, then show the fix', subheading: 'Create immediate relevance with pain-first messaging and a clear solution.', cta: 'See the difference', badge: 'Psychology-first' },
    { handle: 'v2-feature-spotlight', name: 'Feature Spotlight', heading: 'Highlight one killer feature', subheading: 'Focus customer attention on the differentiator that justifies buying now.', cta: 'Explore feature', badge: 'Differentiation' },
    { handle: 'v2-benefits-grid', name: 'Benefits Grid', heading: 'Benefits customers actually care about', subheading: 'Translate product specs into outcomes shoppers can feel and trust.', cta: 'Get yours now', badge: 'Benefit-led' },
    { handle: 'v2-how-it-works-pro', name: 'How It Works Pro', heading: 'Simple process, fast payoff', subheading: 'Show exactly how easy it is so buyers imagine using it instantly.', cta: 'Start now', badge: 'Clarity' },
    { handle: 'v2-results-metrics', name: 'Results Metrics', heading: 'Numbers that build confidence', subheading: 'Use simple metrics and proof points to increase perceived certainty.', cta: 'See proof', badge: 'Data-backed' },
    { handle: 'v2-press-quotes', name: 'Press Quotes', heading: 'Social trust at a glance', subheading: 'Highlight brand mentions and short editorial-style proof snippets.', cta: 'Read more', badge: 'Authority' },
    { handle: 'v2-brand-story', name: 'Brand Story', heading: 'Give your brand a human voice', subheading: 'Tell a short origin story that creates connection and memorability.', cta: 'Our story', badge: 'Brand trust' },
    { handle: 'v2-ingredient-callouts', name: 'Ingredient Callouts', heading: 'What makes it better inside', subheading: 'Break down core components with simple language and buyer benefits.', cta: 'View details', badge: 'Transparency' },
    { handle: 'v2-material-science', name: 'Material Science', heading: 'Engineered details that matter daily', subheading: 'Explain quality and durability without overloading technical jargon.', cta: 'See quality', badge: 'Premium feel' },
    { handle: 'v2-lifestyle-cards', name: 'Lifestyle Cards', heading: 'Show it in real life moments', subheading: 'Visual use-case framing that helps shoppers picture ownership.', cta: 'Shop lifestyle', badge: 'Use-case' },
    { handle: 'v2-use-case-tiles', name: 'Use Case Tiles', heading: 'Fits your routine in every setting', subheading: 'Map product benefits to morning, work, travel, and evening moments.', cta: 'Find your fit', badge: 'Versatility' },
    { handle: 'v2-comparison-points', name: 'Comparison Points', heading: 'Why this beats cheap alternatives', subheading: 'Side-by-side positioning that defends margin and reduces objections.', cta: 'Compare now', badge: 'Margin defense' },
    { handle: 'v2-risk-reversal', name: 'Risk Reversal', heading: 'Lower buying anxiety instantly', subheading: 'Guarantees, support, and shipping confidence in one high-trust panel.', cta: 'Shop risk-free', badge: 'Trust boost' },
    { handle: 'v2-shipping-promise', name: 'Shipping Promise', heading: 'Fast dispatch with clear expectations', subheading: 'Set transparent shipping timing to reduce support tickets and churn.', cta: 'Order today', badge: 'Fulfillment' },
    { handle: 'v2-support-strip', name: 'Support Strip', heading: 'Real support when customers need it', subheading: 'Reassure shoppers with response-time and help-channel clarity.', cta: 'Contact support', badge: 'Support-first' },
    { handle: 'v2-faq-teaser', name: 'FAQ Teaser', heading: 'Top buying questions answered early', subheading: 'Remove high-intent objections before they block checkout intent.', cta: 'Read FAQs', badge: 'Objection killer' },
    { handle: 'v2-review-highlight', name: 'Review Highlight', heading: 'Real customer voice, not generic claims', subheading: 'Feature concise testimonial snapshots that feel authentic and specific.', cta: 'See reviews', badge: 'Social proof' },
    { handle: 'v2-social-counter', name: 'Social Counter', heading: 'Loved by a fast-growing community', subheading: 'Use count-based trust signals to reinforce momentum and demand.', cta: 'Join customers', badge: 'Momentum' },
    { handle: 'v2-logo-marquee', name: 'Logo Marquee', heading: 'Trusted by teams and creators', subheading: 'Continuous logo strip creates premium familiarity and confidence.', cta: 'View partners', badge: 'Credibility' },
    { handle: 'v2-ugc-wall', name: 'UGC Wall', heading: 'Real customer moments, real context', subheading: 'Social-style layout that turns community content into conversion signals.', cta: 'Shop now', badge: 'Community' },
    { handle: 'v2-video-testimonials', name: 'Video Testimonials', heading: 'Proof customers can feel', subheading: 'Use short narrative framing to make testimonial content more believable.', cta: 'Watch stories', badge: 'Believability' },
    { handle: 'v2-creator-picks', name: 'Creator Picks', heading: 'Curated picks from trusted voices', subheading: 'Creator-style recommendation modules increase confidence and basket size.', cta: 'Shop picks', badge: 'Influence' },
    { handle: 'v2-routine-builder', name: 'Routine Builder', heading: 'Bundle into a daily routine', subheading: 'Help shoppers build a simple routine that increases order value.', cta: 'Build routine', badge: 'AOV growth' },
    { handle: 'v2-before-after-grid', name: 'Before After Grid', heading: 'See the transformation clearly', subheading: 'Before/after style framing communicates impact with minimal copy.', cta: 'See results', badge: 'Outcome-led' },
    { handle: 'v2-spec-grid', name: 'Spec Grid', heading: 'Quick specs, easy decisions', subheading: 'Technical details presented in a clean grid for quick comparison.', cta: 'View specs', badge: 'Decision speed' },
    { handle: 'v2-compatibility', name: 'Compatibility', heading: 'Works with your setup', subheading: 'Compatibility notes reduce pre-purchase doubt and return risk.', cta: 'Check fit', badge: 'Reduced returns' },
    { handle: 'v2-care-guide', name: 'Care Guide', heading: 'Keep performance high for longer', subheading: 'Simple care instructions improve product longevity and customer satisfaction.', cta: 'Care tips', badge: 'Retention' },
    { handle: 'v2-collection-teaser', name: 'Collection Teaser', heading: 'Discover matching bestsellers', subheading: 'Drive deeper browsing with complementary collection highlights.', cta: 'Explore collection', badge: 'Cross-sell' },
    { handle: 'v2-related-articles', name: 'Related Articles', heading: 'Educate buyers with useful content', subheading: 'Content-led sections improve trust and conversion for informed buyers.', cta: 'Read insights', badge: 'Education' },
    { handle: 'v2-newsletter-banner', name: 'Newsletter Banner', heading: 'Capture leads with a premium offer', subheading: 'Grow your list using clear value exchange and tasteful CTA placement.', cta: 'Join list', badge: 'Retention channel' },
    { handle: 'v2-app-download', name: 'App Download', heading: 'Extend the experience beyond checkout', subheading: 'Promote companion app moments for deeper product engagement.', cta: 'Get the app', badge: 'LTV' },
    { handle: 'v2-store-locator', name: 'Store Locator', heading: 'Prefer shopping in person?', subheading: 'Blend online and offline trust with a clean location prompt.', cta: 'Find a store', badge: 'Omnichannel' },
    { handle: 'v2-gifting-banner', name: 'Gifting Banner', heading: 'Gift-ready offers that convert fast', subheading: 'Seasonal and gifting angles unlock additional purchase occasions.', cta: 'Shop gifts', badge: 'Seasonal AOV' },
    { handle: 'v2-seasonal-promo', name: 'Seasonal Promo', heading: 'Limited seasonal drop', subheading: 'Launch-ready promo module with urgency-friendly structure.', cta: 'Claim offer', badge: 'Urgency' }
  ]

  const settingsSchema = [
    {
      name: 'theme_info',
      theme_name: 'Zenya Nova',
      theme_version: '2.0.0',
      theme_author: 'Zenya AI',
      theme_documentation_url: 'https://shopify.dev/docs/storefronts/themes/architecture',
      theme_support_url: 'https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks'
    },
    {
      name: 'Brand',
      settings: [
        { type: 'text', id: 'brand_name', label: 'Brand Name', default: content.brand.name },
        { type: 'text', id: 'brand_tagline', label: 'Brand Tagline', default: content.brand.tagline },
        { type: 'color', id: 'color_primary', label: 'Primary', default: colorPrimary },
        { type: 'color', id: 'color_accent', label: 'Accent', default: colorAccent },
        { type: 'color', id: 'color_bg', label: 'Background', default: colorBg },
        { type: 'color', id: 'color_surface', label: 'Surface', default: colorSurface },
        { type: 'color', id: 'color_text', label: 'Text', default: colorText },
        { type: 'range', id: 'radius_global', label: 'Corner Radius', min: 0, max: 28, step: 2, unit: 'px', default: 16 }
      ]
    }
  ]

  const settingsData = {
    current: 'Zenya Nova',
    presets: {
      'Zenya Nova': {
        brand_name: content.brand.name,
        brand_tagline: content.brand.tagline,
        color_primary: colorPrimary,
        color_accent: colorAccent,
        color_bg: colorBg,
        color_surface: colorSurface,
        color_text: colorText,
        radius_global: 16
      }
    }
  }

  const heroBlocks = content.highlights
    .map((item) => {
      return `<div class="card" style="padding: .9rem;">
        <h3 style="margin: 0 0 .35rem; font-size: 1rem;">${escapeJson(item.title)}</h3>
        <p style="margin: 0; color: #475569; font-size: .95rem;">${escapeJson(item.text)}</p>
      </div>`
    })
    .join('\n')

  const testimonialBlocks = content.testimonials
    .map((item) => {
      return `<article class="card" style="padding: 1rem;">
        <p style="margin: 0 0 .7rem; color: #334155;">"${escapeJson(item.text)}"</p>
        <p style="margin: 0; font-weight: 700;">${escapeJson(item.name)}</p>
      </article>`
    })
    .join('\n')

  const faqBlocks = content.faq
    .map((item) => {
      return `<details class="card" style="padding: .9rem;">
        <summary style="cursor: pointer; font-weight: 700;">${escapeJson(item.question)}</summary>
        <p style="margin: .6rem 0 0; color: #475569;">${escapeJson(item.answer)}</p>
      </details>`
    })
    .join('\n')

  zip.folder('layout')?.file(
    'theme.liquid',
    `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="{{ settings.color_primary }}">
    {{ content_for_header }}
    <style>
      :root {
        --bg: {{ settings.color_bg | default: '#f6f8ff' }};
        --surface: {{ settings.color_surface | default: '#ffffff' }};
        --text: {{ settings.color_text | default: '#0f172a' }};
        --muted: #475569;
        --primary: {{ settings.color_primary | default: '#4f46e5' }};
        --accent: {{ settings.color_accent | default: '#0ea5e9' }};
        --radius: {{ settings.radius_global | default: 16 }}px;
      }
    </style>
    {{ 'base.css' | asset_url | stylesheet_tag }}
  </head>
  <body>
    <div class="zen-bg" aria-hidden="true"></div>
    {% sections 'header-group' %}
    <main id="MainContent" role="main">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
  </body>
</html>
`
  )

  zip.folder('assets')?.file(
    'base.css',
    `* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Space Grotesk", "Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  background: #f8fafc;
  color: #0f172a;
  line-height: 1.58;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
a { color: inherit; text-decoration: none; }
.container { width: min(1320px, 100% - 1.6rem); margin-inline: auto; }
.card {
  background: #ffffff;
  border-radius: 8px;
  border: 2px solid #0f172a;
  box-shadow: 8px 8px 0 #0f172a;
}
.zen-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(50rem 30rem at 0% -10%, rgba(99,102,241,.26), transparent 70%),
    radial-gradient(46rem 26rem at 100% 0%, rgba(6,182,212,.22), transparent 72%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  opacity: 1;
}
.zen-section {
  padding: 2.4rem 0;
  position: relative;
}
.zen-section::before {
  content: none;
}
.zen-heading {
  margin: 0 0 .76rem;
  font-size: clamp(1.8rem, 2.9vw, 3rem);
  line-height: 1.04;
  letter-spacing: -.03em;
}
.zen-subheading {
  margin: 0 0 1.25rem;
  color: #334155;
  max-width: 72ch;
  font-size: 1.02rem;
}
.zen-badge {
  display: inline-flex;
  align-items: center;
  border: 2px solid #0f172a;
  background: #fef08a;
  color: #0f172a;
  border-radius: 6px;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: .34rem .82rem;
  margin-bottom: .9rem;
  backdrop-filter: blur(10px);
}
.zen-glow-card {
  background: #ffffff;
  border: 2px solid #0f172a;
  border-radius: 10px;
  padding: 1.48rem;
  box-shadow: 10px 10px 0 #0f172a;
}
.zen-animated { animation: zenFloat 7s ease-in-out infinite; }
.zen-feature-grid { display: grid; gap: .98rem; margin: 1rem 0 1.24rem; }
.zen-feature-card {
  border: 2px solid #0f172a;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
  transition: transform .26s ease, box-shadow .26s ease, border-color .26s ease;
}
.zen-feature-card:hover {
  transform: translate(-2px, -2px);
  border-color: #0f172a;
  box-shadow: 6px 6px 0 #0f172a;
}
.zen-feature-card h3 { margin: 0 0 .34rem; font-size: 1rem; letter-spacing: -.01em; }
.zen-feature-card p { margin: 0; color: #334155; font-size: .95rem; }
.zen-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: .84rem 1.16rem;
  font-weight: 800;
  border: 2px solid #0f172a;
  cursor: pointer;
  text-decoration: none;
  transition: transform .24s ease, box-shadow .24s ease, filter .24s ease;
}
.zen-btn-primary {
  color: #fff !important;
  background: #0f172a;
  box-shadow: 4px 4px 0 #334155;
}
.zen-btn-primary:hover {
  transform: translateY(-1px);
  filter: none;
  box-shadow: 6px 6px 0 #334155;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  border-radius: 8px;
  padding: .9rem 1.2rem;
  font-weight: 800;
  border: 2px solid #0f172a;
  cursor: pointer;
  text-decoration: none;
  transition: transform .24s ease, box-shadow .24s ease, filter .24s ease;
}
.btn-primary {
  background: #0f172a;
  color: #fff !important;

  box-shadow: 4px 4px 0 #334155;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 6px 6px 0 #334155;
}
.btn-secondary {
  background: #ffffff;
  color: #0f172a;
  border: 2px solid #0f172a;
}
.grid { display: grid; gap: 1rem; }
.zen-shell {
  background: #ffffff;
  border: 2px solid #0f172a;
  border-radius: 8px;
  box-shadow: 8px 8px 0 #0f172a;
}
.zen-surface-soft {
  background: #ffffff;
  border-color: #0f172a;
}
.zen-surface-glass {
  background: #f8fafc;
  border-color: #0f172a;
  backdrop-filter: none;
}
.zen-surface-minimal {
  background: #ffffff;
  border-color: #0f172a;
  box-shadow: none;
}
.zen-nav a { color: #0f172a; }
.zen-nav a:hover { color: #1d4ed8; }
.zen-eyebrow {
  font-size: .73rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: #1e3a8a;
  margin: 0 0 .6rem;
  font-weight: 800;
}
.zen-hero-title {
  font-size: clamp(2.3rem, 5.1vw, 5.2rem);
  line-height: .98;
  margin: .2rem 0 1.08rem;
  letter-spacing: -.04em;
}
.zen-product-title {
  margin: .2rem 0 1rem;
  font-size: clamp(1.9rem, 3.2vw, 2.8rem);
  letter-spacing: -.03em;
  line-height: 1.02;
}
.zen-muted { color: #334155; }
.zen-kicker {
  margin: 0 0 .9rem;
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: #1e3a8a;
  font-weight: 800;
}
.zen-pill {
  display: inline-flex;
  align-items: center;
  border: 2px solid #0f172a;
  background: #dcfce7;
  color: #0f172a;
  border-radius: 999px;
  padding: .28rem .72rem;
  font-size: .72rem;
  font-weight: 700;
}
.zen-chip-row { display:flex; gap:.55rem; flex-wrap:wrap; margin:0 0 1rem; }
.zen-band {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  border-radius: 10px;
  padding: 1.2rem;
  border: 2px solid #0f172a;
  background: linear-gradient(140deg, #ffffff, #f8fafc);
  box-shadow: 8px 8px 0 #0f172a;
}
.zen-band-head { padding: .2rem; }
.zen-band-body { padding: .2rem; }
@media (min-width: 992px) {
  .lg-2 { grid-template-columns: 1.05fr .95fr; }
  .lg-3 { grid-template-columns: repeat(3, 1fr); }
  .zen-feature-grid { grid-template-columns: repeat(var(--cards, 3), minmax(0, 1fr)); }
  .zen-band { grid-template-columns: .95fr 1.05fr; align-items: start; }
}
@keyframes zenFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}
@keyframes zenTicker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`
  )

  zip.folder('config')?.file('settings_schema.json', JSON.stringify(settingsSchema, null, 2))
  zip.folder('config')?.file('settings_data.json', JSON.stringify(settingsData, null, 2))
  zip.folder('locales')?.file(
    'en.default.json',
    JSON.stringify(
      {
        general: {
          '404': {
            title: 'Page not found',
            subtext: 'The page you requested was not found.',
            link: 'Continue shopping'
          }
        }
      },
      null,
      2
    )
  )

  zip.folder('snippets')?.file(
    'v2-product-card.liquid',
    `<article class="zen-feature-card" style="overflow:hidden;">
  <a href="{{ product.url }}">
    {% if product.featured_image %}
      <img
        src="{{ product.featured_image | image_url: width: 900 }}"
        width="{{ product.featured_image.width }}"
        height="{{ product.featured_image.height }}"
        alt="{{ product.title | escape }}"
        style="width:100%; height:auto; display:block; border-radius: 8px;"
      >
    {% endif %}
    <div style="padding-top:.75rem;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:.75rem;">
        <h3 style="margin:0; font-size:1rem; letter-spacing:-.01em;">{{ product.title }}</h3>
        <div style="font-weight:800; white-space:nowrap;">{{ product.price | money }}</div>
      </div>
      {% if product.compare_at_price > product.price %}
        <div style="margin-top:.25rem; color: var(--muted, #334155); font-size:.9rem;">
          <span style="text-decoration: line-through; opacity:.75;">{{ product.compare_at_price | money }}</span>
        </div>
      {% endif %}
    </div>
  </a>
</article>
`
  )

  zip.folder('sections')?.file(
    'v2-header.liquid',
    `<header class="container zen-section" style="padding-top: 1rem; padding-bottom: 1rem;">
  <div class="zen-shell" style="padding: 1rem 1.15rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-width: {% if section.settings.show_border %}1px{% else %}0{% endif %};">
    <a href="{{ routes.root_url }}" style="font-weight: 800; font-size: {{ section.settings.logo_size }}px; letter-spacing: -.01em;">{{ section.settings.logo_text | default: settings.brand_name | default: shop.name }}</a>
    {% if section.settings.show_menu %}
    <nav class="zen-nav" style="display: flex; gap: 1.1rem; font-weight: 700; font-size: .9rem; text-transform: uppercase; letter-spacing: .08em;">
      {% for link in linklists[section.settings.menu].links %}
        <a href="{{ link.url }}">{{ link.title }}</a>
      {% else %}
        <a href="{{ routes.root_url }}">Home</a>
        <a href="{{ routes.all_products_collection_url }}">Shop</a>
      {% endfor %}
    </nav>
    {% endif %}
  </div>
</header>
{% schema %}
{
  "name": "Nova Header",
  "enabled_on": { "groups": ["header"] },
  "settings": [
    { "type": "text", "id": "logo_text", "label": "Logo text", "default": "${escapeJson(content.brand.name)}" },
    { "type": "range", "id": "logo_size", "label": "Logo size", "min": 16, "max": 36, "step": 1, "default": 18 },
    { "type": "checkbox", "id": "show_menu", "label": "Show menu", "default": true },
    { "type": "checkbox", "id": "show_border", "label": "Show shell border", "default": true },
    { "type": "link_list", "id": "menu", "label": "Menu", "default": "main-menu" }
  ]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-hero.liquid',
    `<section class="container zen-section" style="padding-top: 1.2rem;">
  <div class="grid lg-2" style="align-items: stretch; gap: 1.25rem;">
    <div class="zen-glow-card zen-surface-glass" style="display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <p class="zen-kicker">{{ section.settings.eyebrow | default: settings.brand_name }}</p>
        <h1 class="zen-hero-title">{{ section.settings.heading }}</h1>
        <p class="zen-muted" style="font-size: 1.05rem; max-width: 56ch; margin: 0 0 1.25rem;">{{ section.settings.subheading }}</p>
      </div>
      <div style="display: flex; gap: .7rem; flex-wrap: wrap;">
        <a class="btn btn-primary" href="{{ section.settings.primary_url }}">{{ section.settings.primary_label }}</a>
        {% if section.settings.show_secondary %}
          <a class="btn btn-secondary" href="{{ section.settings.secondary_url }}">{{ section.settings.secondary_label }}</a>
        {% endif %}
      </div>
    </div>
    {% if section.settings.show_feature_panel %}
      <div class="zen-glow-card zen-surface-{{ section.settings.panel_style }}" style="padding: 1rem;">
        <div class="grid lg-3">
          {% if section.blocks.size > 0 %}
            {% for block in section.blocks %}
              <article class="zen-feature-card" {{ block.shopify_attributes }}>
                <h3>{{ block.settings.title }}</h3>
                <p>{{ block.settings.text }}</p>
              </article>
            {% endfor %}
          {% else %}
            ${heroBlocks}
          {% endif %}
        </div>
      </div>
    {% endif %}
  </div>
</section>
{% schema %}
{
  "name": "Nova Hero",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow text", "default": "${escapeJson(content.brand.name)}" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "${escapeJson(content.hero.heading)}" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "${escapeJson(content.hero.subheading)}" },
    { "type": "text", "id": "primary_label", "label": "Primary Button", "default": "${escapeJson(content.hero.primaryLabel)}" },
    { "type": "url", "id": "primary_url", "label": "Primary URL", "default": "/collections/all" },
    { "type": "checkbox", "id": "show_secondary", "label": "Show secondary button", "default": true },
    { "type": "text", "id": "secondary_label", "label": "Secondary Button", "default": "${escapeJson(content.hero.secondaryLabel)}" },
    { "type": "url", "id": "secondary_url", "label": "Secondary URL", "default": "/" },
    { "type": "checkbox", "id": "show_feature_panel", "label": "Show feature cards", "default": true },
    {
      "type": "select",
      "id": "panel_style",
      "label": "Feature panel style",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Hero feature",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Premium detail" },
        { "type": "textarea", "id": "text", "label": "Text", "default": "Short proof point that supports the hero promise." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Nova Hero" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-product-main.liquid',
    `<section class="container zen-section" style="padding-bottom: 2rem;">
  <div class="grid lg-2" style="align-items: stretch; gap: 1.2rem;">
    <div class="zen-glow-card zen-surface-{{ section.settings.media_style }}" style="padding: .7rem; overflow:hidden;">
      {% if product.featured_image %}
        <img src="{{ product.featured_image | image_url: width: 1400 }}" width="{{ product.featured_image.width }}" height="{{ product.featured_image.height }}" alt="{{ product.title | escape }}" style="width: 100%; height: auto; border-radius: 12px; display: block;">
      {% else %}
        {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
      {% endif %}
    </div>
    <div class="zen-glow-card zen-surface-glass" style="padding: 1.25rem;">
      <p class="zen-kicker">Product Spotlight</p>
      <h1 class="zen-product-title">{{ product.title }}</h1>
      {% if section.settings.show_description %}
        <p class="zen-muted" style="margin: 0 0 1rem;">{{ product.description | strip_html | truncate: section.settings.description_limit }}</p>
      {% endif %}
      {% form 'product', product %}
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
        <button class="btn btn-primary" type="submit" style="width: 100%;">{{ section.settings.button_label }} - {{ product.selected_or_first_available_variant.price | money }}</button>
      {% endform %}
      {% if section.settings.show_reassurance %}
        <p class="zen-muted" style="font-size: .9rem; margin: .85rem 0 0;">{{ section.settings.reassurance_text }}</p>
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Nova Product",
  "settings": [
    { "type": "checkbox", "id": "show_description", "label": "Show description", "default": true },
    { "type": "range", "id": "description_limit", "label": "Description length", "min": 60, "max": 320, "step": 10, "default": 160 },
    {
      "type": "select",
      "id": "media_style",
      "label": "Media card style",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    },
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Add to cart" },
    { "type": "checkbox", "id": "show_reassurance", "label": "Show reassurance text", "default": true },
    { "type": "text", "id": "reassurance_text", "label": "Reassurance", "default": "${escapeJson(content.product.reassurance)}" }
  ],
  "presets": [{ "name": "Nova Product" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-social-proof.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="grid lg-3">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <p style="margin:0 0 .55rem;">“{{ block.settings.quote }}”</p>
            <p style="margin:0; font-weight:700;">{{ block.settings.author }}</p>
          </article>
        {% endfor %}
      {% else %}
        ${testimonialBlocks}
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Nova Social Proof",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "What customers say" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Real customer feedback that builds trust before checkout." },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "testimonial",
      "name": "Testimonial",
      "settings": [
        { "type": "textarea", "id": "quote", "label": "Quote", "default": "Beautiful store and easy checkout." },
        { "type": "text", "id": "author", "label": "Author", "default": "Customer name" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Nova Social Proof" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-faq.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="grid">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3>{{ block.settings.question }}</h3>
            <p>{{ block.settings.answer }}</p>
          </article>
        {% endfor %}
      {% else %}
        ${faqBlocks}
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Nova FAQ",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Frequently asked questions" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Answer objections clearly before they block purchase." },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "faq",
      "name": "FAQ item",
      "settings": [
        { "type": "text", "id": "question", "label": "Question", "default": "How long is shipping?" },
        { "type": "textarea", "id": "answer", "label": "Answer", "default": "Most orders arrive in 3-7 business days." }
      ]
    }
  ],
  "max_blocks": 10,
  "presets": [{ "name": "Nova FAQ" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-footer.liquid',
    `{% assign current_year = 'now' | date: '%Y' %}
<footer class="container zen-section" style="padding-bottom: 2.2rem; z-index: 10; position: relative;">
  <div class="zen-shell" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: #ffffff;">
    <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 1rem;">{{ section.settings.copyright_text | replace: '{{year}}', current_year }}</p>
    {% if section.settings.show_footer_menu %}
    <div style="display: flex; gap: 1.2rem; font-size: 1rem; font-weight: 600;">
      {% for link in linklists[section.settings.footer_menu].links %}
        <a href="{{ link.url }}" style="color: #0f172a;">{{ link.title }}</a>
      {% else %}
        <a href="{{ routes.search_url }}" style="color: #0f172a;">Search</a>
      {% endfor %}
    </div>
    {% endif %}
  </div>
</footer>
{% schema %}
{
  "name": "Nova Footer",
  "enabled_on": { "groups": ["footer"] },
  "settings": [
    { "type": "checkbox", "id": "show_footer_menu", "label": "Show footer menu", "default": true },
    { "type": "text", "id": "copyright_text", "label": "Copyright text", "default": "© {{year}} ${escapeJson(content.brand?.name || 'Your Store')}. All rights reserved." },
    { "type": "link_list", "id": "footer_menu", "label": "Footer menu", "default": "footer" }
  ],
  "presets": [{ "name": "Nova Footer" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-featured-collection.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    {% assign target_collection = collections[section.settings.collection] %}
    <div class="zen-feature-grid" style="--cards: {{ section.settings.columns_desktop }};">
      {% if target_collection != blank %}
        {% for product in target_collection.products limit: section.settings.products_limit %}
          {% render 'v2-product-card', product: product %}
        {% endfor %}
      {% else %}
        <article class="zen-feature-card"><h3>Pick a collection</h3><p>Select a collection in theme editor to show products here.</p></article>
        <article class="zen-feature-card"><h3>Best sellers</h3><p>This area becomes a product grid for a multi-product store.</p></article>
        <article class="zen-feature-card"><h3>New arrivals</h3><p>Use this block to drive browsing and average order value.</p></article>
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Featured Collection",
  "enabled_on": { "templates": ["index"] },
  "settings": [
    { "type": "collection", "id": "collection", "label": "Collection" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Shop bestsellers" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Multi-product browsing section to increase cart size." },
    { "type": "range", "id": "products_limit", "label": "Products", "min": 3, "max": 16, "step": 1, "default": 8 },
    { "type": "range", "id": "columns_desktop", "label": "Columns (desktop)", "min": 2, "max": 4, "step": 1, "default": 4 },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "presets": [{ "name": "Featured Collection" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-collection-main.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h1 class="zen-heading" style="margin-bottom:.35rem;">{{ collection.title }}</h1>
    {% if collection.description != blank %}
      <p class="zen-subheading">{{ collection.description | strip_html }}</p>
    {% endif %}
    {% paginate collection.products by section.settings.products_per_page %}
      <div class="zen-feature-grid" style="--cards: {{ section.settings.columns_desktop }};">
        {% for product in collection.products %}
          {% render 'v2-product-card', product: product %}
        {% endfor %}
      </div>
      {% if paginate.pages > 1 %}
        <div style="display:flex; gap:.5rem; justify-content:center; margin-top:1rem; flex-wrap:wrap;">
          {% if paginate.previous %}
            <a class="btn btn-secondary" href="{{ paginate.previous.url }}">Previous</a>
          {% endif %}
          {% if paginate.next %}
            <a class="btn btn-secondary" href="{{ paginate.next.url }}">Next</a>
          {% endif %}
        </div>
      {% endif %}
    {% endpaginate %}
  </div>
</section>
{% schema %}
{
  "name": "Collection Main",
  "enabled_on": { "templates": ["collection"] },
  "settings": [
    { "type": "range", "id": "products_per_page", "label": "Products per page", "min": 4, "max": 24, "step": 1, "default": 12 },
    { "type": "range", "id": "columns_desktop", "label": "Columns (desktop)", "min": 2, "max": 4, "step": 1, "default": 3 },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "presets": [{ "name": "Collection Main" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-page-main.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h1 class="zen-heading" style="margin-bottom:.6rem;">{{ page.title }}</h1>
    <div class="rte" style="color: {{ settings.color_text }};">
      {{ page.content }}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Page Main",
  "enabled_on": { "templates": ["page"] },
  "settings": [
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "presets": [{ "name": "Page Main" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-search-main.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h1 class="zen-heading" style="margin-bottom:.6rem;">Search</h1>
    {% if search.performed %}
      {% if search.results_count == 0 %}
        <p class="zen-subheading">No results found.</p>
      {% else %}
        <p class="zen-subheading">{{ search.results_count }} results</p>
        <div class="zen-feature-grid" style="--cards: {{ section.settings.columns_desktop }};">
          {% for item in search.results %}
            {% if item.object_type == 'product' %}
              {% render 'v2-product-card', product: item %}
            {% endif %}
          {% endfor %}
        </div>
      {% endif %}
    {% else %}
      <p class="zen-subheading">Try searching for a product.</p>
    {% endif %}
  </div>
</section>
{% schema %}
{
  "name": "Search Main",
  "enabled_on": { "templates": ["search"] },
  "settings": [
    { "type": "range", "id": "columns_desktop", "label": "Columns (desktop)", "min": 2, "max": 4, "step": 1, "default": 3 },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "presets": [{ "name": "Search Main" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-upsell-bundles.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <span class="zen-badge">{{ section.settings.badge_text }}</span>
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="grid lg-3">
      {% for block in section.blocks %}
        {% if block.settings.product != blank %}
          {% assign p = block.settings.product %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3 style="margin:0 0 .35rem;">{{ block.settings.title | default: p.title }}</h3>
            <p style="margin:0 0 .6rem; color:#475569;">{{ block.settings.save_text }}</p>
            <p style="margin:0 0 .7rem; font-weight:700;">{{ p.price | money }}</p>
            {% form 'product', p %}
              <input type="hidden" name="id" value="{{ p.selected_or_first_available_variant.id }}">
              <button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button>
            {% endform %}
          </article>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Upsell Bundles",
  "settings": [
    { "type": "text", "id": "badge_text", "label": "Badge text", "default": "Upsell + Bundles" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Boost your order with smart bundles" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Give shoppers high-value add-ons without paying for external upsell apps." },
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Add Bundle" },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "bundle",
      "name": "Bundle item",
      "settings": [
        { "type": "product", "id": "product", "label": "Product" },
        { "type": "text", "id": "title", "label": "Custom title" },
        { "type": "text", "id": "save_text", "label": "Save label", "default": "Save more when purchased together" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Upsell Bundles" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-volume-discounts.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <span class="zen-badge">{{ section.settings.badge_text }}</span>
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="grid lg-3">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3>{{ block.settings.title }}</h3>
            <p>{{ block.settings.text }}</p>
          </article>
        {% endfor %}
      {% else %}
        <article class="zen-feature-card"><h3>{{ section.settings.tier1_title }}</h3><p>{{ section.settings.tier1_desc }}</p></article>
        <article class="zen-feature-card"><h3>{{ section.settings.tier2_title }}</h3><p>{{ section.settings.tier2_desc }}</p></article>
        <article class="zen-feature-card"><h3>{{ section.settings.tier3_title }}</h3><p>{{ section.settings.tier3_desc }}</p></article>
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Volume Discounts",
  "settings": [
    { "type": "text", "id": "badge_text", "label": "Badge text", "default": "Volume Discounts" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Buy more, save more" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Encourage larger carts with clear discount tiers." },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    },
    { "type": "text", "id": "tier1_title", "label": "Tier 1 title", "default": "Buy 1 - Standard Price" },
    { "type": "text", "id": "tier1_desc", "label": "Tier 1 description", "default": "Perfect for first-time buyers." },
    { "type": "text", "id": "tier2_title", "label": "Tier 2 title", "default": "Buy 2 - Save 15%" },
    { "type": "text", "id": "tier2_desc", "label": "Tier 2 description", "default": "Best value for frequent usage." },
    { "type": "text", "id": "tier3_title", "label": "Tier 3 title", "default": "Buy 3 - Save 25%" },
    { "type": "text", "id": "tier3_desc", "label": "Tier 3 description", "default": "Maximum value for family bundles." }
  ],
  "blocks": [
    {
      "type": "tier",
      "name": "Discount tier",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Buy 2 - Save 15%" },
        { "type": "textarea", "id": "text", "label": "Description", "default": "Best value for frequent usage." }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{ "name": "Volume Discounts" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-countdown-offer.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }} {% if section.settings.enable_float %}zen-animated{% endif %}">
    <span class="zen-badge">{{ section.settings.badge_text }}</span>
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <p style="margin:0;font-weight:700;font-size: {{ section.settings.timer_size }}px;">{{ section.settings.timer_text }}</p>
  </div>
</section>
{% schema %}
{
  "name": "Countdown Offer",
  "settings": [
    { "type": "text", "id": "badge_text", "label": "Badge text", "default": "Limited Offer" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Today-only launch pricing" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Use urgency to improve conversion during campaign windows." },
    { "type": "text", "id": "timer_text", "label": "Timer text", "default": "Offer ends soon - secure your deal now." },
    { "type": "range", "id": "timer_size", "label": "Timer text size", "min": 14, "max": 36, "step": 1, "default": 20 },
    { "type": "checkbox", "id": "enable_float", "label": "Enable float animation", "default": true },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "glass",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "presets": [{ "name": "Countdown Offer" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-guarantee-bar.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    {% if section.settings.heading != blank %}<h2 class="zen-heading">{{ section.settings.heading }}</h2>{% endif %}
    {% if section.settings.subheading != blank %}<p class="zen-subheading">{{ section.settings.subheading }}</p>{% endif %}
    <div class="grid lg-3">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3>{{ block.settings.title }}</h3>
            <p>{{ block.settings.text }}</p>
          </article>
        {% endfor %}
      {% else %}
        <article class="zen-feature-card"><h3>{{ section.settings.item1_title }}</h3><p>{{ section.settings.item1_text }}</p></article>
        <article class="zen-feature-card"><h3>{{ section.settings.item2_title }}</h3><p>{{ section.settings.item2_text }}</p></article>
        <article class="zen-feature-card"><h3>{{ section.settings.item3_title }}</h3><p>{{ section.settings.item3_text }}</p></article>
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Guarantee Bar",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Shop with confidence" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Clear reassurance points that reduce hesitation." },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    },
    { "type": "text", "id": "item1_title", "label": "Item 1 title", "default": "30-Day Guarantee" },
    { "type": "text", "id": "item1_text", "label": "Item 1 text", "default": "Try it risk-free with easy returns." },
    { "type": "text", "id": "item2_title", "label": "Item 2 title", "default": "Secure Checkout" },
    { "type": "text", "id": "item2_text", "label": "Item 2 text", "default": "Encrypted payments and trusted processing." },
    { "type": "text", "id": "item3_title", "label": "Item 3 title", "default": "Fast Support" },
    { "type": "text", "id": "item3_text", "label": "Item 3 text", "default": "Helpful team ready when customers need help." }
  ],
  "blocks": [
    {
      "type": "point",
      "name": "Guarantee point",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Secure checkout" },
        { "type": "textarea", "id": "text", "label": "Text", "default": "Encrypted payments and trusted processing." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Guarantee Bar" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-frequently-bought.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <span class="zen-badge">{{ section.settings.badge_text }}</span>
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="grid lg-3">
      {% for block in section.blocks %}
        {% if block.settings.product != blank %}
          {% assign p = block.settings.product %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3 style="margin:0 0 .35rem;">{{ p.title }}</h3>
            <p style="margin:0 0 .7rem; font-weight:700;">{{ p.price | money }}</p>
            {% form 'product', p %}
              <input type="hidden" name="id" value="{{ p.selected_or_first_available_variant.id }}">
              <button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button>
            {% endform %}
          </article>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Frequently Bought",
  "settings": [
    { "type": "text", "id": "badge_text", "label": "Badge text", "default": "Frequently Bought Together" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Customers also add these" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Increase average order value with relevant add-ons." },
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Add Item" },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Product item",
      "settings": [{ "type": "product", "id": "product", "label": "Product" }]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Frequently Bought" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-sticky-atc.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}" style="position: sticky; bottom: {{ section.settings.sticky_bottom }}px;">
    <div style="display:flex; justify-content:space-between; gap:.8rem; align-items:center; flex-wrap:wrap;">
      <div>
        <p style="margin:0; font-weight:700;">{{ product.title }}</p>
        {% if section.settings.show_reassurance %}<p style="margin:0; color:#475569;">{{ section.settings.reassurance }}</p>{% endif %}
      </div>
      {% form 'product', product %}
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
        <button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }} - {{ product.selected_or_first_available_variant.price | money }}</button>
      {% endform %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Sticky Add To Cart",
  "enabled_on": { "templates": ["product"] },
  "settings": [
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Add to cart" },
    { "type": "checkbox", "id": "show_reassurance", "label": "Show reassurance text", "default": true },
    { "type": "text", "id": "reassurance", "label": "Reassurance text", "default": "Secure checkout, tracked shipping, easy returns." },
    { "type": "range", "id": "sticky_bottom", "label": "Sticky bottom offset", "min": 0, "max": 40, "step": 1, "default": 16 },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "glass",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "presets": [{ "name": "Sticky Add To Cart" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-announcement-ticker.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}" style="overflow:hidden;">
    <div style="display:flex; gap:1.2rem; white-space:nowrap; animation: zenTicker {{ section.settings.speed }}s linear infinite;">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          <span {{ block.shopify_attributes }}>{{ block.settings.text }}</span>
        {% endfor %}
        {% for block in section.blocks %}
          <span>{{ block.settings.text }}</span>
        {% endfor %}
      {% else %}
        <span>{{ section.settings.msg_1 }}</span>
        <span>{{ section.settings.msg_2 }}</span>
        <span>{{ section.settings.msg_3 }}</span>
        <span>{{ section.settings.msg_1 }}</span>
        <span>{{ section.settings.msg_2 }}</span>
        <span>{{ section.settings.msg_3 }}</span>
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Announcement Ticker",
  "settings": [
    { "type": "range", "id": "speed", "label": "Ticker speed (seconds)", "min": 8, "max": 40, "step": 1, "default": 16 },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    },
    { "type": "text", "id": "msg_1", "label": "Message 1", "default": "Free shipping over $50" },
    { "type": "text", "id": "msg_2", "label": "Message 2", "default": "30-day money back guarantee" },
    { "type": "text", "id": "msg_3", "label": "Message 3", "default": "Secure checkout and fast support" }
  ],
  "blocks": [
    {
      "type": "message",
      "name": "Ticker message",
      "settings": [
        { "type": "text", "id": "text", "label": "Message", "default": "Fast shipping and secure checkout" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Announcement Ticker" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-comparison-table.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="card" style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding:.8rem; border-bottom:1px solid #e2e8f0;">Feature</th>
            <th style="text-align:left; padding:.8rem; border-bottom:1px solid #e2e8f0;">{{ section.settings.col_us }}</th>
            <th style="text-align:left; padding:.8rem; border-bottom:1px solid #e2e8f0;">{{ section.settings.col_them }}</th>
          </tr>
        </thead>
        <tbody>
          {% if section.blocks.size > 0 %}
            {% for block in section.blocks %}
              <tr {{ block.shopify_attributes }}>
                <td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">{{ block.settings.feature }}</td>
                <td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">{{ block.settings.us_value }}</td>
                <td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">{{ block.settings.them_value }}</td>
              </tr>
            {% endfor %}
          {% else %}
            <tr><td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">Premium build</td><td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">✓</td><td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">✕</td></tr>
            <tr><td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">Fast support</td><td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">✓</td><td style="padding:.7rem; border-bottom:1px solid #f1f5f9;">✕</td></tr>
            <tr><td style="padding:.7rem;">Risk-free returns</td><td style="padding:.7rem;">✓</td><td style="padding:.7rem;">✕</td></tr>
          {% endif %}
        </tbody>
      </table>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Comparison Table",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Why customers choose us" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Simple comparison that protects margins and helps shoppers decide faster." },
    { "type": "text", "id": "col_us", "label": "Your brand column", "default": "Our Store" },
    { "type": "text", "id": "col_them", "label": "Other stores column", "default": "Others" },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "row",
      "name": "Feature row",
      "settings": [
        { "type": "text", "id": "feature", "label": "Feature", "default": "Premium build" },
        { "type": "text", "id": "us_value", "label": "Your value", "default": "✓" },
        { "type": "text", "id": "them_value", "label": "Other value", "default": "✕" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Comparison Table" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-cart-upsell.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    <span class="zen-badge">{{ section.settings.badge_text }}</span>
    <h2 class="zen-heading">{{ section.settings.heading }}</h2>
    <p class="zen-subheading">{{ section.settings.subheading }}</p>
    <div class="grid lg-3">
      {% for block in section.blocks %}
        {% if block.settings.product != blank %}
          {% assign p = block.settings.product %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3>{{ p.title }}</h3>
            <p>{{ block.settings.pitch }}</p>
            <p style="font-weight:700;">{{ p.price | money }}</p>
            {% form 'product', p %}
              <input type="hidden" name="id" value="{{ p.selected_or_first_available_variant.id }}">
              <button class="zen-btn zen-btn-primary" type="submit">{{ section.settings.button_label }}</button>
            {% endform %}
          </article>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Cart Upsell",
  "enabled_on": { "templates": ["cart"] },
  "settings": [
    { "type": "text", "id": "badge_text", "label": "Badge text", "default": "Cart Upsell" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Complete your order with top add-ons" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Show relevant add-ons in cart to boost average order value." },
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Add to cart" },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Upsell item",
      "settings": [
        { "type": "product", "id": "product", "label": "Product" },
        { "type": "text", "id": "pitch", "label": "Pitch", "default": "Popular companion product" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{ "name": "Cart Upsell" }]
}
{% endschema %}
`
  )

  zip.folder('sections')?.file(
    'v2-cart-reassurance.liquid',
    `<section class="container zen-section">
  <div class="zen-glow-card zen-surface-{{ section.settings.style_mode }}">
    {% if section.settings.heading != blank %}<h2 class="zen-heading">{{ section.settings.heading }}</h2>{% endif %}
    {% if section.settings.subheading != blank %}<p class="zen-subheading">{{ section.settings.subheading }}</p>{% endif %}
    <div class="grid lg-3">
      {% if section.blocks.size > 0 %}
        {% for block in section.blocks %}
          <article class="zen-feature-card" {{ block.shopify_attributes }}>
            <h3>{{ block.settings.title }}</h3>
            <p>{{ block.settings.text }}</p>
          </article>
        {% endfor %}
      {% else %}
        <article class="zen-feature-card"><h3>{{ section.settings.item1 }}</h3><p>Clarity to reduce checkout hesitation.</p></article>
        <article class="zen-feature-card"><h3>{{ section.settings.item2 }}</h3><p>Reassurance that lowers abandonment risk.</p></article>
        <article class="zen-feature-card"><h3>{{ section.settings.item3 }}</h3><p>Trust-first messaging around payment and support.</p></article>
      {% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Cart Reassurance",
  "enabled_on": { "templates": ["cart"] },
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Checkout reassurance" },
    { "type": "textarea", "id": "subheading", "label": "Subheading", "default": "Clear confidence points that reduce abandonment." },
    { "type": "text", "id": "item1", "label": "Item 1", "default": "Secure checkout" },
    { "type": "text", "id": "item2", "label": "Item 2", "default": "30-day returns" },
    { "type": "text", "id": "item3", "label": "Item 3", "default": "Fast support" },
    {
      "type": "select",
      "id": "style_mode",
      "label": "Style mode",
      "default": "soft",
      "options": [
        { "value": "soft", "label": "Soft modern" },
        { "value": "glass", "label": "Glass premium" },
        { "value": "minimal", "label": "Minimal clean" }
      ]
    }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Reassurance item",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Secure checkout" },
        { "type": "textarea", "id": "text", "label": "Text", "default": "Trust-first messaging around payment and support." }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Cart Reassurance" }]
}
{% endschema %}
`
  )

  for (const section of marketingSections) {
    zip.folder('sections')?.file(`${section.handle}.liquid`, buildMarketingSection(section))
  }

  zip.folder('sections')?.file(
    'header-group.json',
    JSON.stringify(
      {
        name: 'Header group',
        type: 'header',
        sections: {
          header: { type: 'v2-header', settings: {} }
        },
        order: ['header']
      },
      null,
      2
    )
  )

  zip.folder('sections')?.file(
    'footer-group.json',
    JSON.stringify(
      {
        name: 'Footer group',
        type: 'footer',
        sections: {
          footer: { type: 'v2-footer', settings: {} }
        },
        order: ['footer']
      },
      null,
      2
    )
  )

  const indexTemplate =
    websiteStyle === 'catalog_store'
      ? {
          sections: {
            hero: { type: 'v2-hero', settings: { panel_style: presetModes.heroPanel } },
            featured_collection: { type: 'v2-featured-collection', settings: { style_mode: presetModes.marketing } },
            value_stack: { type: 'v2-value-stack', settings: { style_mode: presetModes.marketing } },
            benefits_grid: { type: 'v2-benefits-grid', settings: { style_mode: presetModes.marketing } },
            logo_marquee: { type: 'v2-logo-marquee', settings: { style_mode: presetModes.marketing } },
            social: { type: 'v2-social-proof', settings: { style_mode: presetModes.socialProof } },
            newsletter_banner: { type: 'v2-newsletter-banner', settings: { style_mode: presetModes.marketing } },
            faq: { type: 'v2-faq', settings: { style_mode: presetModes.faq } }
          },
          order: ['hero', 'featured_collection', 'value_stack', 'benefits_grid', 'logo_marquee', 'social', 'newsletter_banner', 'faq']
        }
      : websiteStyle === 'brand_story'
        ? {
            sections: {
              hero: { type: 'v2-hero', settings: { panel_style: presetModes.heroPanel } },
              brand_story: { type: 'v2-brand-story', settings: { style_mode: presetModes.marketing } },
              feature_spotlight: { type: 'v2-feature-spotlight', settings: { style_mode: presetModes.marketing } },
              lifestyle_cards: { type: 'v2-lifestyle-cards', settings: { style_mode: presetModes.marketing } },
              press_quotes: { type: 'v2-press-quotes', settings: { style_mode: presetModes.marketing } },
              ugc_wall: { type: 'v2-ugc-wall', settings: { style_mode: presetModes.marketing } },
              newsletter_banner: { type: 'v2-newsletter-banner', settings: { style_mode: presetModes.marketing } },
              faq: { type: 'v2-faq', settings: { style_mode: presetModes.faq } }
            },
            order: ['hero', 'brand_story', 'feature_spotlight', 'lifestyle_cards', 'press_quotes', 'ugc_wall', 'newsletter_banner', 'faq']
          }
        : {
            sections: {
              hero: { type: 'v2-hero', settings: { panel_style: presetModes.heroPanel } },
              announcement_ticker: { type: 'v2-announcement-ticker', settings: { style_mode: presetModes.marketing } },
              value_stack: { type: 'v2-value-stack', settings: { style_mode: presetModes.marketing } },
              benefits_grid: { type: 'v2-benefits-grid', settings: { style_mode: presetModes.marketing } },
              comparison_table: { type: 'v2-comparison-table', settings: { style_mode: presetModes.marketing } },
              results_metrics: { type: 'v2-results-metrics', settings: { style_mode: presetModes.marketing } },
              press_quotes: { type: 'v2-press-quotes', settings: { style_mode: presetModes.marketing } },
              logo_marquee: { type: 'v2-logo-marquee', settings: { style_mode: presetModes.marketing } },
              social_counter: { type: 'v2-social-counter', settings: { style_mode: presetModes.marketing } },
              newsletter_banner: { type: 'v2-newsletter-banner', settings: { style_mode: presetModes.marketing } },
              social: { type: 'v2-social-proof', settings: { style_mode: presetModes.socialProof } },
              faq: { type: 'v2-faq', settings: { style_mode: presetModes.faq } }
            },
            order: ['hero', 'announcement_ticker', 'value_stack', 'benefits_grid', 'comparison_table', 'results_metrics', 'press_quotes', 'logo_marquee', 'social_counter', 'newsletter_banner', 'social', 'faq']
          }

  zip.folder('templates')?.file('index.json', JSON.stringify(indexTemplate, null, 2))
  zip.folder('templates')?.file(
    'product.json',
    JSON.stringify(
      {
        sections: {
          main: { type: 'v2-product-main', settings: { media_style: presetModes.productMedia } },
          countdown_offer: { type: 'v2-countdown-offer', settings: { style_mode: presetModes.countdown } },
          volume_discounts: { type: 'v2-volume-discounts', settings: { style_mode: presetModes.volume } },
          upsell_bundles: { type: 'v2-upsell-bundles', settings: { style_mode: presetModes.upsellBundles } },
          frequently_bought: { type: 'v2-frequently-bought', settings: { style_mode: presetModes.frequentlyBought } },
          guarantee_bar: { type: 'v2-guarantee-bar', settings: { style_mode: presetModes.guaranteeBar } },
          sticky_atc: { type: 'v2-sticky-atc', settings: { style_mode: presetModes.stickyAtc } },
          faq: { type: 'v2-faq', settings: { style_mode: presetModes.faq } }
        },
        order: ['main', 'countdown_offer', 'volume_discounts', 'upsell_bundles', 'frequently_bought', 'guarantee_bar', 'sticky_atc', 'faq']
      },
      null,
      2
    )
  )
  zip.folder('templates')?.file(
    'collection.json',
    JSON.stringify(
      {
        sections: { main: { type: 'v2-collection-main', settings: { style_mode: presetModes.marketing } } },
        order: ['main']
      },
      null,
      2
    )
  )
  zip.folder('templates')?.file(
    'cart.json',
    JSON.stringify(
      {
        sections: {
          reassurance: { type: 'v2-cart-reassurance', settings: { style_mode: presetModes.guaranteeBar } },
          upsell: { type: 'v2-cart-upsell', settings: { style_mode: presetModes.upsellBundles } },
        },
        order: ['reassurance', 'upsell'],
      },
      null,
      2
    )
  )
  zip.folder('templates')?.file(
    'page.json',
    JSON.stringify(
      {
        sections: { main: { type: 'v2-page-main', settings: { style_mode: presetModes.marketing } } },
        order: ['main']
      },
      null,
      2
    )
  )
  zip.folder('templates')?.file(
    'search.json',
    JSON.stringify(
      {
        sections: { main: { type: 'v2-search-main', settings: { style_mode: presetModes.marketing } } },
        order: ['main']
      },
      null,
      2
    )
  )
  zip.folder('templates')?.file(
    '404.liquid',
    `<section class="container" style="padding: 3rem 0; text-align: center;">
  <h1>{{ 'general.404.title' | t }}</h1>
  <p>{{ 'general.404.subtext' | t }}</p>
  <a class="btn btn-primary" href="{{ routes.root_url }}">{{ 'general.404.link' | t }}</a>
</section>
`
  )

  return zip
}

export async function generateShopifyThemeV2(
  content: Partial<NovaThemeContent>,
  colors: NovaThemeColors
) {
  const zip = prepareThemeZipV2(content, colors)
  return zip.generateAsync({ type: 'blob' })
}
