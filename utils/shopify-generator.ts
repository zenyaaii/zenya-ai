import JSZip from 'jszip'
import { ALPINE_JS, TAILWIND_JS } from './static-assets'
import { generateShopifyThemeV2, type NovaThemeContent } from './shopify-generator-v2'
import { generateShopifyThemeV3OneProduct } from './shopify-generator-v3'

type ThemeContent = {
  _strategy?: {
    target_avatar: string
    core_pain_point: string
    unique_mechanism: string
    competitor_weakness: string
  }
  hero: { headline: string; subheadline: string; cta: string }
  features: { title: string; desc: string; icon: string }[]
  problem: { headline: string; text: string }
  solution: { headline: string; text: string }
  testimonials: { name: string; text: string; location: string; rating: number }[]
  faq: { q: string; a: string }[]
  guarantee: { title: string; text: string; days: number }
  shopName?: string

  // New Mega Pack Sections
  slideshow?: { heading: string; subheading: string; cta: string }[]
  video_hero?: { heading: string; subheading: string; cta: string }
  timeline?: { year: string; title: string; text: string }[]
  rich_text?: { title: string; text: string }
  image_text?: { title: string; text: string; cta: string }
  newsletter?: { title: string; text: string }
  scrolling_text?: string[]
  comparison?: { feature: string; us: boolean; them: boolean }[]
  multicolumn?: { title: string; text: string }[]
  
  // Phase 1 Expansion: All Sections Dynamic
  contact?: { heading: string; subheading: string }
  upsell?: { heading: string }
  volume_bundles?: { heading: string; label_buy_1: string; label_buy_2: string; label_buy_3: string }
  countdown?: { heading: string; timer_text: string }
  logo_list?: { heading: string }
  before_after?: { heading: string; label_before: string; label_after: string }
  stats?: { value: string; label: string }[]
  visual_showcase?: { heading: string; subheading: string }
  how_it_works?: { title: string; text: string }[]
  trust_badges?: { heading: string }
  accordion?: { title: string; content: string }[]
  tabs?: { title: string; content: string }[]

  // Cross-page generation
  collection_page?: {
    headline: string
    subheadline: string
    filter_help: string
    why_buy_heading: string
    why_buy_points: string[]
  }
  cart_drawer?: {
    headline: string
    free_shipping_before: string
    free_shipping_after: string
    secure_line: string
    reassurance_lines: string[]
    checkout_cta: string
  }
  cart_page?: {
    headline: string
    subheadline: string
    order_summary_heading: string
    checkout_cta: string
    empty_headline: string
    empty_subheadline: string
  }
  pages?: {
    about?: {
      hero_heading: string
      hero_subheading: string
      mission_title: string
      mission_text: string
      craftsmanship_heading: string
      craftsmanship_text: string
      process_heading: string
      process_subheading: string
    }
    contact?: {
      faq_heading: string
      faq_items: { q: string; a: string }[]
    }
    faq?: {
      title: string
      intro: string
      items: { q: string; a: string }[]
    }
  }
  policies?: {
    shipping?: { title: string; bullets: string[] }
    returns?: { title: string; bullets: string[] }
  }
  seo?: {
    homepage?: { title: string; description: string }
    product?: { title: string; description: string }
    collection?: { title: string; description: string }
    og?: { title: string; description: string }
  }
}

export function prepareThemeZip(name: string, content: ThemeContent, colors: { primary: string; secondary: string }, images: string[] = []): JSZip {
  const zip = new JSZip()
  const safeShopName = content.shopName || name

  // 1. Config
  // Internal Configuration for "Hardcoded" Logic
  // These values are injected into Alpine.js states.
  const productConfig = {
    fakeStockCount: 14,       // Starts at 14 items
    fakeTimerSeconds: 43200,  // 12 hours
    bundleDiscount2: 15,      // 15% off for 2 items
    bundleDiscount3: 25       // 25% off for 3 items
  }

  const settingsSchema = [
    {
      "name": "theme_info",
      "theme_name": "Zenya Theme",
      "theme_version": "1.0.0",
      "theme_author": "Zenya AI",
      "theme_documentation_url": "https://zenya.ai",
      "theme_support_url": "https://zenya.ai"
    },
    {
      "name": "Checkout",
      "settings": [
        { "type": "header", "content": "Banner" },
        { "type": "image_picker", "id": "theme_checkout_logo", "label": "Logo" },
        { "type": "range", "id": "theme_checkout_logo_size", "label": "Logo size", "min": 0, "max": 200, "step": 5, "default": 100, "unit": "px" },
        { "type": "image_picker", "id": "theme_checkout_banner", "label": "Background Image" },
        { "type": "header", "content": "Colors" },
        { "type": "color", "id": "theme_checkout_accent_color", "label": "Accents", "default": colors.primary },
        { "type": "color", "id": "theme_checkout_button_color", "label": "Buttons", "default": colors.primary },
        { "type": "color", "id": "theme_checkout_error_color", "label": "Errors", "default": "#ef4444" },
        { "type": "header", "content": "Typography" },
        { "type": "select", "id": "theme_checkout_headings_font", "label": "Headings", "options": [
            { "value": "system", "label": "System" },
            { "value": "serif", "label": "Serif" },
            { "value": "sans-serif", "label": "Sans-serif" }
        ], "default": "sans-serif" }
      ]
    },
    {
      "name": "Actions",
      "settings": [
        { "type": "text", "id": "primary_cta_text", "label": "Primary CTA (Homepage)", "default": content.hero.cta },
        { "type": "text", "id": "add_to_cart_label", "label": "Add to Cart Button", "default": "Add to Cart" },
        { "type": "text", "id": "quick_add_label", "label": "Quick Add Button", "default": "Add" },
        { "type": "text", "id": "checkout_label", "label": "Checkout Button", "default": content.cart_drawer?.checkout_cta || "Checkout Now" },
        { "type": "text", "id": "continue_shopping_label", "label": "Continue Shopping", "default": "Continue Shopping" },
        { "type": "text", "id": "start_shopping_label", "label": "Start Shopping", "default": "Start Shopping" }
      ]
    },
    {
      "name": "Colors",
      "settings": [
        { "type": "color", "id": "primary_color", "label": "Primary Color", "default": colors.primary },
        { "type": "color", "id": "secondary_color", "label": "Secondary Color", "default": colors.secondary }
      ]
    },
    {
      "name": "Motion",
      "settings": [
        { "type": "checkbox", "id": "motion_enabled", "label": "Enable Animations", "default": true },
        { "type": "range", "id": "motion_strength", "label": "Animation Intensity", "min": 0, "max": 100, "step": 5, "default": 65 }
      ]
    }
  ]
  zip.folder('config')?.file('settings_schema.json', JSON.stringify(settingsSchema, null, 2))
  
  const settingsData = {
    "current": "Zenya Theme",
    "presets": {
      "Zenya Theme": {
        "primary_color": colors.primary,
        "secondary_color": colors.secondary,
        "motion_enabled": true,
        "motion_strength": 65,
        "primary_cta_text": content.hero.cta,
        "add_to_cart_label": "Add to Cart",
        "quick_add_label": "Add",
        "checkout_label": content.cart_drawer?.checkout_cta || "Checkout Now",
        "continue_shopping_label": "Continue Shopping",
        "start_shopping_label": "Start Shopping",
        "theme_checkout_accent_color": colors.primary,
        "theme_checkout_button_color": colors.primary,
        "theme_checkout_error_color": "#ef4444",
        "theme_checkout_headings_font": "sans-serif"
      }
    }
  }
  zip.folder('config')?.file('settings_data.json', JSON.stringify(settingsData, null, 2))

  // 1.1 Locales (Critical for valid theme)
  const defaultLocale = {
    "general": {
      "password_page": {
        "login_form_heading": "Enter store using password",
        "login_password_button": "Enter using password"
      }
    }
  }
  zip.folder('locales')?.file('en.default.json', JSON.stringify(defaultLocale, null, 2))

  // 1.2 Header Section
  const headerSchema = {
    name: "Header",
    enabled_on: { groups: ["header"] },
    settings: [
      { type: "image_picker", id: "logo", label: "Logo" },
      { type: "range", id: "logo_width", label: "Logo Width", min: 80, max: 240, step: 10, default: 140, unit: "px" },
      { type: "text", id: "shop_name", label: "Shop Name", default: safeShopName },
      { type: "link_list", id: "menu", label: "Menu", default: "main-menu" },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" },
      { type: "color", id: "text_color", label: "Text Color", default: "#0f172a" },
      { type: "checkbox", id: "sticky_header", label: "Sticky Header", default: true },
      { type: "checkbox", id: "show_search", label: "Show Search", default: true },
      { type: "checkbox", id: "show_cart", label: "Show Cart", default: true },
      { type: "header", content: "Header CTA" },
      { type: "checkbox", id: "show_cta", label: "Show CTA Button", default: true },
      { type: "text", id: "cta_label", label: "CTA Label", default: content.hero.cta },
      { type: "url", id: "cta_link", label: "CTA Link" },
      { type: "header", content: "Announcement Bar" },
      { type: "checkbox", id: "show_announcement", label: "Show Announcement", default: true },
      { type: "text", id: "announcement_text", label: "Announcement Text", default: content.countdown?.heading || "🔥 Free Shipping on Orders Over $50!" },
      { type: "color", id: "announcement_bg", label: "Bar Background", default: "#000000" },
      { type: "color", id: "announcement_text_color", label: "Bar Text", default: "#ffffff" }
    ],
    presets: [{ name: "Zenya Header" }]
  }
  const headerLiquid = `
<div x-data="{ mobileMenuOpen: false, searchOpen: false, searchQuery: '', searchResults: [], loading: false, performSearch() { if (this.searchQuery.length < 2) { this.searchResults = []; return; } this.loading = true; fetch(\`/search/suggest.json?q=\${this.searchQuery}&resources[type]=product&resources[limit]=5\`).then(r => r.json()).then(data => { this.searchResults = data.resources.results.products || []; }).catch(e => console.error(e)).finally(() => this.loading = false); } }">
  {% if section.settings.show_announcement %}
    <div class="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider" 
         style="background: {{ section.settings.announcement_bg }}; color: {{ section.settings.announcement_text_color }};">
      {{ section.settings.announcement_text }}
    </div>
  {% endif %}

  <!-- Search Overlay -->
  <div 
    x-show="searchOpen && section.settings.show_search" 
    x-transition:enter="transition ease-out duration-200"
    x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100"
    x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95"
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
    x-cloak
  >
    <div @click.away="searchOpen = false" class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          x-ref="searchInput"
          type="text" 
          x-model="searchQuery" 
          @input.debounce.300ms="performSearch()"
          placeholder="Search for products..." 
          class="flex-1 border-none focus:ring-0 text-lg placeholder:text-slate-400 font-medium"
        >
        <button @click="searchOpen = false" class="p-2 text-slate-400 hover:text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div class="max-h-[60vh] overflow-y-auto p-4">
        <div x-show="loading" class="text-center py-8 text-slate-500">
          <svg class="animate-spin h-8 w-8 mx-auto text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Searching...
        </div>

        <div x-show="!loading && searchQuery.length >= 2 && searchResults.length === 0" class="text-center py-8 text-slate-500">
          No results found for "<span x-text="searchQuery"></span>"
        </div>

        <div x-show="!loading && searchResults.length > 0" class="grid gap-4">
          <template x-for="product in searchResults" :key="product.id">
            <a :href="product.url" class="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition group">
              <div class="h-16 w-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                <img :src="product.featured_image.url" :alt="product.title" class="h-full w-full object-cover group-hover:scale-105 transition">
              </div>
              <div>
                <h4 class="font-bold text-slate-900 group-hover:text-primary transition" x-text="product.title"></h4>
                <p class="text-sm text-slate-500" x-text="'{{ cart.currency.symbol }}' + product.price"></p>
              </div>
            </a>
          </template>
          
          <div class="pt-4 border-t border-slate-100 text-center">
            <a :href="'{{ routes.search_url }}?q=' + searchQuery" class="text-primary font-bold hover:underline">
              View all results
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="border-b border-slate-200 py-4 relative {% if section.settings.sticky_header %}sticky top-0 z-40{% endif %}" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
    <div class="container mx-auto flex items-center justify-between px-6">
      <div class="text-2xl font-extrabold tracking-tight z-20">
        <a href="{{ routes.root_url }}" class="no-underline hover:opacity-80 transition" style="color: inherit;">
          {% if section.settings.logo != blank %}
            {{ section.settings.logo | image_url: width: 480 | image_tag: class: 'h-auto', style: 'max-width: ' | append: section.settings.logo_width | append: 'px;' }}
          {% else %}
            {{ section.settings.shop_name }}
          {% endif %}
        </a>
      </div>
      
      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8 font-medium">
        {% for link in linklists[section.settings.menu].links %}
          <a href="{{ link.url }}" class="hover:text-primary transition" style="color: inherit;">{{ link.title }}</a>
        {% else %}
          <a href="{{ routes.root_url }}" class="hover:text-primary transition" style="color: inherit;">Home</a>
          <a href="{{ routes.all_products_collection_url }}" class="hover:text-primary transition" style="color: inherit;">Shop</a>
        {% endfor %}

        <!-- Search Trigger -->
        {% if section.settings.show_search %}
          <button @click="searchOpen = true; $nextTick(() => $refs.searchInput.focus())" class="hover:text-primary transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        {% endif %}

        {% if section.settings.show_cart %}
          <a href="{{ routes.cart_url }}" @click.prevent="$dispatch('toggle-cart')" class="relative hover:text-primary transition flex items-center gap-1" style="color: inherit;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {% if cart.item_count > 0 %}
              <span class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-2">{{ cart.item_count }}</span>
            {% endif %}
          </a>
        {% endif %}

        {% assign header_cta_link = section.settings.cta_link %}
        {% if header_cta_link == blank %}
          {% assign header_cta_link = routes.all_products_collection_url %}
        {% endif %}
        {% if section.settings.show_cta %}
          <a href="{{ header_cta_link }}" class="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]" style="background-color: {{ settings.primary_color }};">
            {{ section.settings.cta_label | default: settings.primary_cta_text }}
          </a>
        {% endif %}
        </div>
      </nav>

      <!-- Mobile Menu Button -->
      <div class="md:hidden z-20 flex items-center gap-4">
        {% if section.settings.show_search %}
          <button @click="searchOpen = true; $nextTick(() => $refs.searchInput.focus())" class="focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        {% endif %}
        {% if section.settings.show_cart %}
          <a href="{{ routes.cart_url }}" @click.prevent="$dispatch('toggle-cart')" class="relative hover:text-primary transition" style="color: inherit;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {% if cart.item_count > 0 %}
              <span class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-2">{{ cart.item_count }}</span>
            {% endif %}
          </a>
        {% endif %}
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="p-2 focus:outline-none">
          <span x-show="!mobileMenuOpen" class="text-2xl">☰</span>
          <span x-show="mobileMenuOpen" class="text-2xl" x-cloak>✕</span>
        </button>
      </div>
    </div>

    <!-- Mobile Nav Overlay -->
    <div 
      x-show="mobileMenuOpen" 
      x-transition:enter="transition ease-out duration-200"
      x-transition:enter-start="opacity-0 -translate-y-4"
      x-transition:enter-end="opacity-100 translate-y-0"
      x-transition:leave="transition ease-in duration-150"
      x-transition:leave-start="opacity-100 translate-y-0"
      x-transition:leave-end="opacity-0 -translate-y-4"
      class="absolute top-full left-0 w-full shadow-xl border-b border-slate-100 md:hidden z-10"
      style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};"
      x-cloak
    >
      <nav class="flex flex-col p-6 space-y-4 font-medium text-lg">
        {% for link in linklists[section.settings.menu].links %}
          <a href="{{ link.url }}" class="hover:text-primary transition" style="color: inherit;">{{ link.title }}</a>
        {% else %}
          <a href="{{ routes.root_url }}" class="hover:text-primary transition" style="color: inherit;">Home</a>
          <a href="{{ routes.all_products_collection_url }}" class="hover:text-primary transition" style="color: inherit;">Shop</a>
        {% endfor %}
        {% if section.settings.show_cart %}
          <a href="{{ routes.cart_url }}" @click.prevent="$dispatch('toggle-cart'); mobileMenuOpen = false" class="hover:text-primary transition flex items-center gap-2" style="color: inherit;">
            Cart
            {% if cart.item_count > 0 %}
              <span class="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ cart.item_count }}</span>
            {% endif %}
          </a>
        {% endif %}
        {% if section.settings.show_cta %}
          <a href="{{ header_cta_link }}" class="mt-2 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]" style="background-color: {{ settings.primary_color }};">
            {{ section.settings.cta_label | default: settings.primary_cta_text }}
          </a>
        {% endif %}
      </nav>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(headerSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-header.liquid', headerLiquid)

  // 1.3 Footer Section
  const footerSchema = {
    name: "Footer",
    enabled_on: { groups: ["footer"] },
    settings: [
      { type: "color", id: "bg_color", label: "Background", default: "#0f172a" },
      { type: "color", id: "text_color", label: "Text", default: "#ffffff" },
      { type: "textarea", id: "tagline", label: "Tagline", default: "Premium quality products designed for your lifestyle. We stand behind everything we sell with our industry-leading guarantee." },
      { type: "text", id: "copyright", label: "Copyright Text", default: "© 2024 Zenya. All rights reserved." },
      { type: "link_list", id: "menu_1", label: "First Menu", default: "footer" },
      { type: "link_list", id: "menu_2", label: "Second Menu", default: "main-menu" },
      { type: "header", content: "Social Media" },
      { type: "url", id: "facebook_url", label: "Facebook URL" },
      { type: "url", id: "instagram_url", label: "Instagram URL" },
      { type: "url", id: "twitter_url", label: "Twitter URL" }
    ],
    presets: [{ name: "Zenya Footer" }]
  }
  const footerLiquid = `
<footer class="py-12 border-t border-slate-800" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="container mx-auto px-6">
    <div class="grid gap-8 md:grid-cols-4 mb-12">
      <!-- Brand -->
      <div class="col-span-1 md:col-span-2">
        <h3 class="text-2xl font-extrabold mb-4 tracking-tight">{{ shop.name }}</h3>
        {% if section.settings.tagline != blank %}
          <p class="text-slate-400 max-w-sm mb-6 whitespace-pre-line">
            {{ section.settings.tagline }}
          </p>
        {% endif %}
        <!-- Socials (Stub) -->
        <div class="flex gap-4">
          {% if section.settings.facebook_url != blank %}
          <a href="{{ section.settings.facebook_url }}" class="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition">
            <span class="sr-only">Facebook</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          {% endif %}
          {% if section.settings.instagram_url != blank %}
          <a href="{{ section.settings.instagram_url }}" class="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition">
            <span class="sr-only">Instagram</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.48 2h-.165zm0-2H12.2c-2.69 0-3.023.012-4.086.06-1.258.058-2.35.34-3.264 1.254-.914.914-1.196 2.006-1.254 3.265C3.536 5.676 3.524 6.01 3.524 8.7v.1c0 2.69.012 3.023.06 4.086.058 1.258.34 2.35 1.254 3.264.914.914 2.006 1.196 3.265 1.254 1.063.048 1.397.06 4.086.06h.05c2.69 0 3.023-.012 4.086-.06 1.258-.058 2.35-.34 3.264-1.254.914-.914 1.196-2.006 1.254-3.265.048-1.063.06-1.397.06-4.086v-.05c0-2.69-.012-3.023-.06-4.086-.058-1.258-.34-2.35-1.254-3.264-.914-.914-2.006-1.196-3.265-1.254-1.063-.048-1.397-.06-4.086-.06h-.15zm.165 5.33a5.335 5.335 0 105.335 5.335 5.335 5.335 0 00-5.335-5.335zm0 8.67a3.335 3.335 0 113.335-3.335 3.335 3.335 0 01-3.335 3.335zm5.336-9.102a1.2 1.2 0 11-1.2 1.2 1.2 1.2 0 011.2-1.2z"/></svg>
          </a>
          {% endif %}
          {% if section.settings.twitter_url != blank %}
          <a href="{{ section.settings.twitter_url }}" class="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition">
            <span class="sr-only">Twitter</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          </a>
          {% endif %}
        </div>
      </div>

      <!-- Links -->
      <div>
        <h4 class="font-bold text-white mb-4">{{ linklists[section.settings.menu_1].title | default: 'Shop' }}</h4>
        <ul class="space-y-2 text-sm text-slate-400">
          {% for link in linklists[section.settings.menu_1].links %}
            <li><a href="{{ link.url }}" class="hover:text-primary transition">{{ link.title }}</a></li>
          {% else %}
            <li><a href="{{ routes.all_products_collection_url }}" class="hover:text-primary transition">All Products</a></li>
            <li><a href="{{ routes.search_url }}" class="hover:text-primary transition">Search</a></li>
          {% endfor %}
        </ul>
      </div>

      <!-- Links -->
      <div>
        <h4 class="font-bold text-white mb-4">{{ linklists[section.settings.menu_2].title | default: 'Support' }}</h4>
        <ul class="space-y-2 text-sm text-slate-400">
          {% for link in linklists[section.settings.menu_2].links %}
            <li><a href="{{ link.url }}" class="hover:text-primary transition">{{ link.title }}</a></li>
          {% else %}
            <li><a href="{{ routes.root_url | append: '/pages/contact' | replace: '//', '/' }}" class="hover:text-primary transition">Contact Us</a></li>
            <li><a href="{{ routes.root_url | append: '/policies/shipping-policy' | replace: '//', '/' }}" class="hover:text-primary transition">Shipping Policy</a></li>
            <li><a href="{{ routes.root_url | append: '/policies/refund-policy' | replace: '//', '/' }}" class="hover:text-primary transition">Refund Policy</a></li>
          {% endfor %}
        </ul>
      </div>
    </div>

    <div class="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex flex-col gap-4">
        <div class="text-slate-500 text-sm">
          {{ section.settings.copyright }}
        </div>
        <div class="flex gap-4 items-center">
          {{ shop | login_button: action: 'follow' }}
        </div>
      </div>

      <!-- Localization -->
      <div>
        {% form 'localization' %}
          <div class="flex flex-wrap gap-2">
            {% if localization.available_countries.size > 1 %}
              <select name="country_code" class="bg-slate-800 text-white text-sm border-slate-700 rounded focus:ring-primary">
                {% for country in localization.available_countries %}
                  <option value="{{ country.iso_code }}" {% if country.iso_code == localization.country.iso_code %}selected{% endif %}>
                    {{ country.name }} ({{ country.currency.iso_code }} {{ country.currency.symbol }})
                  </option>
                {% endfor %}
              </select>
            {% endif %}
            {% if localization.available_languages.size > 1 %}
              <select name="language_code" class="bg-slate-800 text-white text-sm border-slate-700 rounded focus:ring-primary">
                {% for language in localization.available_languages %}
                  <option value="{{ language.iso_code }}" {% if language.iso_code == localization.language.iso_code %}selected{% endif %}>
                    {{ language.endonym_name | capitalize }}
                  </option>
                {% endfor %}
              </select>
            {% endif %}
            <button type="submit" class="sr-only">Update</button>
          </div>
        {% endform %}
      </div>
      
      <!-- Payment Icons (Trust Footer) -->
      <div class="flex items-center gap-3 opacity-75 grayscale hover:grayscale-0 transition">
        {% for type in shop.enabled_payment_types %}
          <div class="h-8 bg-white rounded px-2 flex items-center">
            {{ type | payment_type_svg_tag: class: 'h-5' }}
          </div>
        {% endfor %}
      </div>
    </div>
  </div>
</footer>
{% schema %}
${JSON.stringify(footerSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-footer.liquid', footerLiquid)

  // 1.3a Section Groups
  const headerGroup = {
    "name": "Header",
    "sections": {
      "header": {
        "type": "zenya-header",
        "settings": {}
      }
    },
    "order": [
      "header"
    ]
  }
  zip.folder('sections')?.file('header-group.json', JSON.stringify(headerGroup, null, 2))

  const footerGroup = {
    "name": "Footer",
    "sections": {
      "footer": {
        "type": "zenya-footer",
        "settings": {}
      }
    },
    "order": [
      "footer"
    ]
  }
  zip.folder('sections')?.file('footer-group.json', JSON.stringify(footerGroup, null, 2))

  // 1.3b Gift Card Template
  const giftCardLiquid = `
{% layout none %}
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="">
    <link rel="canonical" href="{{ canonical_url }}">
    <title>{{ shop.name }}</title>
    <meta name="description" content="Gift card">
    {{ content_for_header }}
    <style>
      body { font-family: sans-serif; text-align: center; padding: 50px; }
      .gift-card { border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 400px; margin: 0 auto; }
      .code { font-size: 2em; letter-spacing: 2px; margin: 20px 0; background: #f4f4f4; padding: 10px; }
    </style>
  </head>
  <body>
    <div class="gift-card">
      <h1>{{ shop.name }}</h1>
      <h2>{{ gift_card.balance | money }}</h2>
      <p>Gift Card</p>
      <div class="code" onclick="this.classList.add('is-selected');">{{ gift_card.code | format_code }}</div>
      <p>Use this code at checkout to redeem your gift card</p>
      <a href="{{ shop.url }}">{{ settings.start_shopping_label }}</a>
    </div>
    <script>
      document.querySelector('.code').addEventListener('click', function() {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(this);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    </script>
  </body>
</html>
  `
  zip.folder('templates')?.file('gift_card.liquid', giftCardLiquid)

  // 1.4 Cart Drawer (High Converting)
  const cartDrawerSchema = {
    name: "Cart Drawer",
    settings: [
      { type: "checkbox", id: "show_upsells", label: "Show Upsells", default: true },
      { type: "collection", id: "upsell_collection", label: "Upsell Collection" },
      { type: "number", id: "free_shipping_threshold", label: "Free Shipping Threshold (Cents)", default: 10000 },
      { type: "text", id: "free_shipping_before", label: "Free Shipping (Before)", default: content.cart_drawer?.free_shipping_before || "You are {amount} away from Free Shipping!" },
      { type: "text", id: "free_shipping_after", label: "Free Shipping (After)", default: content.cart_drawer?.free_shipping_after || "🎉 You've unlocked Free Shipping!" },
      { type: "text", id: "custom_message", label: "Custom Message", default: content.cart_drawer?.secure_line || "Tax included. Shipping calculated at checkout." },
      { type: "text", id: "reassurance_1", label: "Reassurance Line 1", default: content.cart_drawer?.reassurance_lines?.[0] || "30-day returns" },
      { type: "text", id: "reassurance_2", label: "Reassurance Line 2", default: content.cart_drawer?.reassurance_lines?.[1] || "Fast support" },
      { type: "text", id: "reassurance_3", label: "Reassurance Line 3", default: content.cart_drawer?.reassurance_lines?.[2] || "Tracked delivery" }
    ],
    presets: [{ name: "Zenya Cart Drawer" }]
  }
  
  const cartDrawerLiquid = `
<div x-data="{ 
  open: false,
  loading: false,
  updateCart() {
    this.loading = true;
    fetch('/?section_id=zenya-cart-drawer')
      .then(r => r.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('#CartDrawerContent').innerHTML;
        document.querySelector('#CartDrawerContent').innerHTML = newContent;
        this.loading = false;
      })
      .catch(() => this.loading = false);
  }
}" 
@toggle-cart.window="open = !open" 
@cart-updated.window="open = true; updateCart()"
class="relative z-50" 
role="dialog" 
aria-modal="true">

  <div x-show="open" 
       x-transition:enter="ease-in-out duration-500" 
       x-transition:enter-start="opacity-0" 
       x-transition:enter-end="opacity-100" 
       x-transition:leave="ease-in-out duration-500" 
       x-transition:leave-start="opacity-100" 
       x-transition:leave-end="opacity-0" 
       class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" 
       @click="open = false"
       x-cloak></div>

  <div class="fixed inset-0 overflow-hidden" x-show="open" x-cloak style="pointer-events: none;">
    <div class="absolute inset-0 overflow-hidden">
      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div x-show="open"
             x-transition:enter="transform transition ease-in-out duration-500 sm:duration-700"
             x-transition:enter-start="translate-x-full"
             x-transition:enter-end="translate-x-0"
             x-transition:leave="transform transition ease-in-out duration-500 sm:duration-700"
             x-transition:leave-start="translate-x-0"
             x-transition:leave-end="translate-x-full"
             class="pointer-events-auto w-screen max-w-md"
             style="pointer-events: auto;">
             
          <div class="flex h-full flex-col bg-white shadow-xl relative">
            
            <!-- Close Button -->
            <button @click="open = false" class="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-500">
               <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <!-- Loading Overlay -->
            <div x-show="loading" class="absolute inset-0 bg-white/50 z-20 flex items-center justify-center" x-transition>
               <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>

            <div id="CartDrawerContent" class="flex flex-col h-full">
              <!-- Header -->
              <div class="px-6 py-4 border-b border-gray-100">
                <h2 class="text-xl font-bold text-gray-900">Your Cart ({{ cart.item_count }})</h2>
              </div>

              <!-- Content -->
              <div class="flex-1 overflow-y-auto px-6 py-6">
                 {% if cart.item_count > 0 %}
                    
                    <!-- Free Shipping Bar -->
                    {% assign free_shipping_threshold = section.settings.free_shipping_threshold %}
                    {% assign cart_total = cart.total_price %}
                    {% assign progress = cart_total | times: 100 | divided_by: free_shipping_threshold %}
                    {% if progress > 100 %}{% assign progress = 100 %}{% endif %}
                    {% assign left_to_spend = free_shipping_threshold | minus: cart_total %}
                    {% assign left_to_spend_money = left_to_spend | money %}
                    {% assign amount_token = '{' | append: 'amount' | append: '}' %}

                    <div class="mb-8">
                      {% if left_to_spend > 0 %}
                        <p class="text-sm text-gray-600 mb-2">
                          {{ section.settings.free_shipping_before | replace: amount_token, left_to_spend_money }}
                        </p>
                      {% else %}
                        <p class="text-sm text-green-600 font-bold mb-2">{{ section.settings.free_shipping_after }}</p>
                      {% endif %}
                      <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-black transition-all duration-1000" style="width: {{ progress }}%; background-color: {{ settings.primary_color }};"></div>
                      </div>
                    </div>

                    <!-- Cart Items -->
                    <div class="space-y-6">
                      {% for item in cart.items %}
                        <div class="flex gap-4">
                          <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img src="{{ item.image | image_url: width: 200 }}" alt="{{ item.title }}" width="200" height="200" class="h-full w-full object-cover object-center">
                          </div>

                          <div class="flex flex-1 flex-col">
                            <div>
                              <div class="flex justify-between text-base font-medium text-gray-900">
                                <h3><a href="{{ item.url }}">{{ item.product.title }}</a></h3>
                                <p class="ml-4">{{ item.final_line_price | money }}</p>
                              </div>
                              <p class="mt-1 text-sm text-gray-500">{{ item.variant.title }}</p>
                            </div>
                            <div class="flex flex-1 items-end justify-between text-sm">
                               <div class="flex items-center border border-gray-300 rounded">
                                  <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | minus: 1 }}" class="px-2 py-1 hover:bg-gray-100" @click.prevent="fetch('{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | minus: 1 }}').then(() => $dispatch('cart-updated'))">-</a>
                                  <span class="px-2 font-medium">{{ item.quantity }}</span>
                                  <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | plus: 1 }}" class="px-2 py-1 hover:bg-gray-100" @click.prevent="fetch('{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | plus: 1 }}').then(() => $dispatch('cart-updated'))">+</a>
                               </div>
                               <button type="button" class="font-medium text-red-500 hover:text-red-600" @click.prevent="fetch('{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity=0').then(() => $dispatch('cart-updated'))">Remove</button>
                            </div>
                          </div>
                        </div>
                      {% endfor %}
                    </div>
                 {% else %}
                    <div class="text-center py-12">
                       <div class="text-4xl mb-4">🛒</div>
                       <p class="text-gray-500 mb-6">Your cart is empty.</p>
                       <button @click="open = false" class="inline-block px-6 py-3 rounded-full bg-black text-white font-bold hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">{{ settings.continue_shopping_label }}</button>
                    </div>
                 {% endif %}

                 <!-- Upsells (Only if cart is not empty or always? Usually better if not empty, but can be always) -->
                 {% if section.settings.show_upsells and section.settings.upsell_collection != blank %}
                    <div class="mt-12 pt-8 border-t border-gray-100">
                       <h3 class="font-bold text-gray-900 mb-4">You Might Also Like</h3>
                       <div class="space-y-4">
                          {% for product in collections[section.settings.upsell_collection].products limit: 3 %}
                             <div class="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                                <img src="{{ product.featured_image | image_url: width: 100 }}" width="100" height="100" class="w-16 h-16 object-cover rounded-md" alt="{{ product.title }}">
                                <div class="flex-1 min-w-0">
                                   <h4 class="font-medium text-sm text-gray-900 truncate">{{ product.title }}</h4>
                                   <p class="text-sm text-gray-500">{{ product.price | money }}</p>
                                </div>
                                {% form 'product', product %}
                                  <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
                                  <button type="submit" class="text-xs font-bold bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-100 transition" @click.prevent="
                                    fetch('{{ routes.cart_add_url }}.js', { 
                                      method: 'POST', 
                                      headers: { 'Content-Type': 'application/json' }, 
                                      body: JSON.stringify({ items: [{ id: {{ product.selected_or_first_available_variant.id }}, quantity: 1 }] }) 
                                    }).then(() => $dispatch('cart-updated'))
                                  ">{{ settings.quick_add_label }}</button>
                                {% endform %}
                             </div>
                          {% endfor %}
                       </div>
                    </div>
                 {% endif %}
              </div>

              <!-- Footer -->
              {% if cart.item_count > 0 %}
              <div class="border-t border-gray-200 px-6 py-6 bg-gray-50">
                <div class="flex justify-between text-base font-medium text-gray-900 mb-4">
                  <p>Subtotal</p>
                  <p>{{ cart.total_price | money }}</p>
                </div>
                <p class="mt-0.5 text-sm text-gray-500 mb-6">{{ section.settings.custom_message }}</p>
                <div class="text-xs text-gray-500 text-center space-y-1 mb-6">
                  {% if section.settings.reassurance_1 != blank %}<div>{{ section.settings.reassurance_1 }}</div>{% endif %}
                  {% if section.settings.reassurance_2 != blank %}<div>{{ section.settings.reassurance_2 }}</div>{% endif %}
                  {% if section.settings.reassurance_3 != blank %}<div>{{ section.settings.reassurance_3 }}</div>{% endif %}
                </div>
                
                <form action="{{ routes.cart_url }}" method="post">
                   <button type="submit" name="checkout" class="w-full flex items-center justify-center rounded-full border border-transparent px-6 py-4 text-base font-bold text-white shadow-sm hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">
                     {{ settings.checkout_label | default: 'Checkout' }} • {{ cart.total_price | money }}
                   </button>
                </form>

                <div class="mt-6 flex justify-center gap-2 opacity-60 grayscale">
                   {% for type in shop.enabled_payment_types %}
                     {{ type | payment_type_svg_tag: class: 'h-6' }}
                   {% endfor %}
                </div>
              </div>
              {% endif %}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(cartDrawerSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-cart-drawer.liquid', cartDrawerLiquid)

  // 2. Layout
  const layout = `
<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ page_title }}</title>

    {{ content_for_header }}
    
    <script>document.documentElement.className = document.documentElement.className.replace('no-js', 'js');</script>

    <!-- Tailwind CSS (Bundled) -->
    <script>
      // Suppress Tailwind CDN warning
      (function() {
        var originalWarn = console.warn;
        console.warn = function(...args) {
          if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
          originalWarn.apply(console, args);
        };
      })();
    </script>
    <script src="{{ 'tailwind.js' | asset_url }}" defer></script>
    <script>
      window.tailwind = window.tailwind || {};
      window.tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '{{ settings.primary_color }}',
              secondary: '{{ settings.secondary_color }}',
            }
          }
        }
      }
    </script>

    <!-- Alpine.js (Bundled) -->
    <script defer src="{{ 'alpine.js' | asset_url }}"></script>

    <style>
      [x-cloak] { display: none !important; }
      body { font-family: system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
      .zenya-motion { will-change: transform, opacity; }
      @media (prefers-reduced-motion: reduce) {
        .zenya-motion { animation: none !important; transition: none !important; }
      }
      @keyframes zenyaFloat {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(40px, -30px, 0) scale(1.06); }
      }
      @keyframes zenyaFloatReverse {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(-34px, 28px, 0) scale(1.05); }
      }
      @keyframes zenyaGradientShift {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .22; }
        50% { transform: translate3d(0, -18px, 0) scale(1.04); opacity: .28; }
      }
      .zenya-blob {
        position: absolute;
        width: 32rem;
        height: 32rem;
        border-radius: 9999px;
        filter: blur(46px);
        opacity: .24;
        mix-blend-mode: multiply;
      }
      .zenya-blob--a { top: -14rem; left: -14rem; animation: zenyaFloat 10s ease-in-out infinite; }
      .zenya-blob--b { bottom: -16rem; right: -16rem; animation: zenyaFloatReverse 11s ease-in-out infinite; }
      .zenya-gradient-sheen { animation: zenyaGradientShift 9s ease-in-out infinite; }
    </style>
  </head>
  <body class="bg-slate-50 text-slate-900">
    <a class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50" href="#MainContent">
      Skip to content
    </a>
    {% sections 'header-group' %}
    <main id="MainContent" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
    {% section 'zenya-cart-drawer' %}
  </body>
</html>
  `
  zip.folder('layout')?.file('theme.liquid', layout)

  // Duplicate removed

  // 2.1 Assets
  zip.folder('assets')?.file('alpine.js', ALPINE_JS)
  zip.folder('assets')?.file('tailwind.js', TAILWIND_JS)

  // 3. Sections
  // Hero
  const heroSchema = {
    name: "Hero",
    settings: [
      { type: "text", id: "headline", label: "Headline", default: content.hero.headline },
      { type: "textarea", id: "subheadline", label: "Subheadline", default: content.hero.subheadline },
      { type: "text", id: "cta", label: "Button Text", default: content.hero.cta },
      { type: "url", id: "cta_link", label: "Button Link" },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: true },
      { type: "image_picker", id: "image", label: "Image" },
      { type: "product", id: "product", label: "Product (For Image Fallback)" },
      { type: "text", id: "external_image_url", label: "External Image URL (Fallback)" },
      { type: "header", content: "Social Proof Badge" },
      { type: "checkbox", id: "show_social_proof", label: "Show Badge", default: true },
      { type: "textarea", id: "social_proof_text", label: "Badge Text", default: "Trusted by 10k+ happy customers" }
    ],
    presets: [{ name: "Zenya Hero" }]
  }
  const heroLiquid = `
<div class="relative overflow-hidden bg-white py-20 lg:py-28">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.primary_color }}, transparent 70%); animation-duration: {{ 16 | minus: settings.motion_strength | at_least: 8 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.secondary_color }}, transparent 70%); animation-duration: {{ 18 | minus: settings.motion_strength | at_least: 9 }}s;"></div>
      <div class="absolute inset-0 zenya-gradient-sheen zenya-motion" style="background: radial-gradient(circle at 20% 10%, {{ settings.secondary_color }}, transparent 55%), radial-gradient(circle at 90% 60%, {{ settings.primary_color }}, transparent 55%);"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center relative">
    <div>
      <h1 class="text-4xl lg:text-6xl font-extrabold tracking-tight leading-none mb-6 text-slate-900">{{ section.settings.headline }}</h1>
      <p class="text-xl text-slate-600 mb-8 leading-relaxed">{{ section.settings.subheadline }}</p>
      {% assign hero_link = section.settings.cta_link %}
      {% if hero_link == blank and section.settings.product != blank %}
        {% assign hero_link = all_products[section.settings.product].url %}
      {% endif %}
      {% if hero_link == blank %}
        {% assign hero_link = routes.all_products_collection_url %}
      {% endif %}
      <a href="{{ hero_link }}" class="inline-flex items-center justify-center rounded-full px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:opacity-90 hover:scale-105 active:scale-95" style="background-color: {{ settings.primary_color }};">
        {{ section.settings.cta | default: settings.primary_cta_text }}
      </a>
    </div>
    <div class="relative">
      {% if section.settings.image != blank %}
        {{ section.settings.image | image_url: width: 1000 | image_tag: class: 'w-full rounded-3xl shadow-2xl object-cover aspect-[4/3]' }}
      {% elsif all_products[section.settings.product].featured_image != blank %}
        {{ all_products[section.settings.product].featured_image | image_url: width: 1000 | image_tag: class: 'w-full rounded-3xl shadow-2xl object-cover aspect-[4/3]' }}
      {% elsif section.settings.external_image_url != blank %}
        <img src="{{ section.settings.external_image_url }}" class="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3]" alt="{{ section.settings.headline }}">
      {% else %}
        {{ 'lifestyle-1' | placeholder_svg_tag: 'w-full rounded-3xl bg-slate-100 shadow-2xl aspect-[4/3]' }}
      {% endif %}
      {% if section.settings.show_social_proof %}
        <div class="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 zenya-motion" {% if settings.motion_enabled %}style="animation: zenyaFloat 8s ease-in-out infinite;"{% endif %}>
          <div class="flex -space-x-2">
            <div class="h-8 w-8 rounded-full bg-slate-200 border-2 border-white"></div>
            <div class="h-8 w-8 rounded-full bg-slate-300 border-2 border-white"></div>
            <div class="h-8 w-8 rounded-full bg-slate-400 border-2 border-white"></div>
          </div>
          <div class="text-xs font-bold text-slate-900 leading-tight whitespace-pre-line">{{ section.settings.social_proof_text }}</div>
        </div>
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(heroSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-hero.liquid', heroLiquid)

  const featuredProductSchema = {
    name: "Featured Product",
    settings: [
      { type: "product", id: "product", label: "Product" },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: true },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" },
      { type: "text", id: "kicker", label: "Kicker", default: "Best Seller" },
      { type: "text", id: "headline", label: "Headline", default: "Everything you need. Nothing you don’t." },
      { type: "textarea", id: "subheadline", label: "Subheadline", default: "A clean, one-product section with price, benefits, and a strong Add to Cart." },
      { type: "text", id: "bullet_1", label: "Bullet 1", default: "Fast shipping with tracking" },
      { type: "text", id: "bullet_2", label: "Bullet 2", default: "30-day returns" },
      { type: "text", id: "bullet_3", label: "Bullet 3", default: "Secure checkout" },
      { type: "text", id: "support_line", label: "Support Line", default: "Need help? We respond fast." },
    ],
    presets: [{ name: "Zenya Featured Product" }],
  }

  const featuredProductLiquid = `
<div class="relative overflow-hidden py-20" style="background-color: {{ section.settings.bg_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.secondary_color }}, transparent 70%); opacity: .14; animation-duration: {{ 20 | minus: settings.motion_strength | at_least: 10 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.primary_color }}, transparent 70%); opacity: .12; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
      <div class="absolute inset-0 zenya-gradient-sheen zenya-motion" style="background: radial-gradient(circle at 10% 20%, {{ settings.primary_color }}, transparent 55%), radial-gradient(circle at 90% 80%, {{ settings.secondary_color }}, transparent 55%); opacity: .12;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 max-w-6xl relative">
    {% assign fp = all_products[section.settings.product] %}
    {% if fp == blank %}
      {% assign fp = collections.all.products.first %}
    {% endif %}
    {% if fp != blank %}
      <div class="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <div class="relative">
          <div class="absolute -top-3 left-6 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {{ section.settings.kicker }}
          </div>
          <div class="relative overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
            {% if fp.featured_image %}
              <img src="{{ fp.featured_image | image_url: width: 1200 }}" width="{{ fp.featured_image.width }}" height="{{ fp.featured_image.height }}" alt="{{ fp.title | escape }}" class="w-full h-full object-cover aspect-[4/3]">
            {% else %}
              {{ 'product-1' | placeholder_svg_tag: 'w-full h-full bg-slate-100 aspect-[4/3]' }}
            {% endif %}
            {% if fp.compare_at_price > fp.price %}
              <div class="absolute top-5 left-5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                Sale
              </div>
            {% endif %}
          </div>
        </div>

        <div>
          <h2 class="text-3xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            {{ section.settings.headline }}
          </h2>
          {% if section.settings.subheadline != blank %}
            <p class="text-lg text-slate-600 mb-6 leading-relaxed">{{ section.settings.subheadline }}</p>
          {% endif %}

          <div class="flex items-end gap-3 mb-6">
            <div class="text-3xl font-extrabold text-slate-900">{{ fp.price | money }}</div>
            {% if fp.compare_at_price > fp.price %}
              <div class="text-slate-400 line-through mb-1">{{ fp.compare_at_price | money }}</div>
            {% endif %}
          </div>

          <div class="space-y-2 mb-8">
            {% if section.settings.bullet_1 != blank %}<div class="flex items-start gap-2 text-slate-700"><span class="mt-1 text-green-600">✓</span><span>{{ section.settings.bullet_1 }}</span></div>{% endif %}
            {% if section.settings.bullet_2 != blank %}<div class="flex items-start gap-2 text-slate-700"><span class="mt-1 text-green-600">✓</span><span>{{ section.settings.bullet_2 }}</span></div>{% endif %}
            {% if section.settings.bullet_3 != blank %}<div class="flex items-start gap-2 text-slate-700"><span class="mt-1 text-green-600">✓</span><span>{{ section.settings.bullet_3 }}</span></div>{% endif %}
          </div>

          {% form 'product', fp %}
            <input type="hidden" name="id" value="{{ fp.selected_or_first_available_variant.id }}">
            <button type="submit" class="w-full rounded-full py-4 text-lg font-bold text-white shadow-xl transition hover:opacity-90 active:scale-[0.98]" style="background-color: {{ settings.primary_color }};">
              {{ settings.add_to_cart_label }}
            </button>
          {% endform %}

          {% if section.settings.support_line != blank %}
            <div class="mt-4 text-sm text-slate-500 text-center">{{ section.settings.support_line }}</div>
          {% endif %}
        </div>
      </div>
    {% else %}
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        Add a product to your store, then select it in this section’s settings.
      </div>
    {% endif %}
  </div>
</div>
{% schema %}
${JSON.stringify(featuredProductSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-featured-product.liquid', featuredProductLiquid)

  // Features (Grid)
  const featuresSchema = {
    name: "Features",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Why it works" },
      { type: "textarea", id: "subheading", label: "Subheading", default: "Clear benefits that matter day one." },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "color", id: "bg_color", label: "Background Color", default: "#f8fafc" }
    ],
    blocks: [
      {
        type: "feature",
        name: "Feature",
        settings: [
          { type: "text", id: "title", label: "Title" },
          { type: "textarea", id: "desc", label: "Description" },
          { type: "text", id: "icon", label: "Icon Name (Lucide)", default: "star" }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya Features",
        blocks: content.features.map(f => ({
          type: "feature",
          settings: {
            title: f.title,
            desc: f.desc,
            icon: f.icon || "star"
          }
        }))
      }
    ]
  }
  const featuresLiquid = `
<div class="relative overflow-hidden py-24" style="background-color: {{ section.settings.bg_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.secondary_color }}, transparent 70%); opacity: .14; animation-duration: {{ 20 | minus: settings.motion_strength | at_least: 10 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.primary_color }}, transparent 70%); opacity: .12; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 relative">
    <div class="mx-auto mb-12 max-w-3xl text-center">
      <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="text-slate-600">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>
    <div class="grid gap-8 md:grid-cols-3">
      {% for block in section.blocks %}
        <div class="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition transform hover:-translate-y-1 group">
          <div class="h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style="background: color-mix(in srgb, {{ settings.primary_color }} 12%, white); color: {{ settings.primary_color }};">
            <span class="font-bold text-xl">
              {% case block.settings.icon %}
                {% when 'shield' %}🛡️
                {% when 'zap' %}⚡
                {% when 'leaf' %}🌿
                {% when 'clock' %}⏱️
                {% else %}★
              {% endcase %}
            </span>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">{{ block.settings.title }}</h3>
          <p class="text-slate-600 leading-relaxed text-sm">{{ block.settings.desc }}</p>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(featuresSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-features.liquid', featuresLiquid)

  // Problem/Solution
  const problemSolutionSchema = {
    name: "Problem/Solution",
    settings: [
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "text", id: "problem_label", label: "Problem Label", default: "The Problem" },
      { type: "text", id: "problem_headline", label: "Problem Headline", default: content.problem.headline },
      { type: "textarea", id: "problem_text", label: "Problem Text", default: content.problem.text },
      { type: "text", id: "solution_label", label: "Solution Label", default: "The Solution" },
      { type: "text", id: "solution_headline", label: "Solution Headline", default: content.solution.headline },
      { type: "textarea", id: "solution_text", label: "Solution Text", default: content.solution.text },
      { type: "image_picker", id: "image", label: "Image" },
      { type: "text", id: "external_image_url", label: "External Image URL (Fallback)" }
    ],
    presets: [{ name: "Zenya Problem/Solution" }]
  }
  const problemSolutionLiquid = `
<div class="relative overflow-hidden bg-white py-24">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute inset-0 zenya-gradient-sheen zenya-motion" style="background: radial-gradient(circle at 10% 20%, {{ settings.primary_color }}, transparent 55%), radial-gradient(circle at 90% 80%, {{ settings.secondary_color }}, transparent 55%); opacity: .12;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 grid gap-16 lg:grid-cols-2 items-center relative">
    <div class="space-y-8">
      <div class="p-8 rounded-3xl border border-slate-100 bg-slate-50">
        <h3 class="text-slate-700 font-bold uppercase tracking-wider text-xs mb-2">{{ section.settings.problem_label }}</h3>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">{{ section.settings.problem_headline }}</h2>
        <p class="text-slate-600 leading-relaxed">{{ section.settings.problem_text }}</p>
      </div>
      <div class="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm">
        <h3 class="font-bold uppercase tracking-wider text-xs mb-2" style="color: {{ settings.primary_color }};">{{ section.settings.solution_label }}</h3>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">{{ section.settings.solution_headline }}</h2>
        <p class="text-slate-600 leading-relaxed">{{ section.settings.solution_text }}</p>
      </div>
    </div>
    <div>
      {% if section.settings.image != blank %}
        <img 
          src="{{ section.settings.image | image_url: width: 800 }}" 
          width="{{ section.settings.image.width }}"
          height="{{ section.settings.image.height }}"
          alt="Problem Solution" 
          class="w-full rounded-2xl shadow-2xl">
      {% elsif section.settings.external_image_url != blank %}
        <img src="{{ section.settings.external_image_url }}" class="w-full rounded-2xl shadow-2xl" alt="Solution">
      {% else %}
        {{ 'product-2' | placeholder_svg_tag: 'w-full rounded-2xl bg-slate-100' }}
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(problemSolutionSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-problem-solution.liquid', problemSolutionLiquid)

  // Testimonials
  const testimonialsSchema = {
    name: "Testimonials",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: content.stats?.[0]?.value ? "What people are saying" : "Real Results" },
      { type: "textarea", id: "subheading", label: "Subheading", default: "Real reviews from real customers." },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" }
    ],
    blocks: [
      {
        type: "testimonial",
        name: "Testimonial",
        settings: [
          { type: "text", id: "name", label: "Name" },
          { type: "textarea", id: "text", label: "Review" },
          { type: "text", id: "location", label: "Location" }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya Testimonials",
        blocks: content.testimonials.map(t => ({
          type: "testimonial",
          settings: {
            name: t.name,
            text: t.text,
            location: t.location
          }
        }))
      }
    ]
  }
  const testimonialsLiquid = `
<div class="relative overflow-hidden py-24" style="background-color: {{ section.settings.bg_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.primary_color }}, transparent 70%); opacity: .10; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.secondary_color }}, transparent 70%); opacity: .10; animation-duration: {{ 24 | minus: settings.motion_strength | at_least: 12 }}s;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 relative">
    <div class="mx-auto mb-14 max-w-3xl text-center">
      <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="text-slate-600">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>
    <div class="grid gap-8 md:grid-cols-3">
      {% for block in section.blocks %}
        <div class="bg-white/90 backdrop-blur p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="mb-4 text-lg flex gap-1" style="color: {{ settings.secondary_color }};">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
          <p class="mb-6 leading-relaxed text-slate-700">“{{ block.settings.text }}”</p>
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style="background-color: {{ settings.primary_color }};">
              {{ block.settings.name | slice: 0, 1 }}
            </div>
            <div>
              <div class="font-bold text-slate-900">{{ block.settings.name }}</div>
              <div class="text-sm text-slate-500 flex items-center gap-1">
                <span style="color: {{ settings.primary_color }};">✓</span> {{ block.settings.location }}
              </div>
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(testimonialsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-testimonials.liquid', testimonialsLiquid)

  // FAQ
  const faqSchema = {
    name: "FAQ",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Frequently Asked Questions" },
      { type: "textarea", id: "subheading", label: "Subheading", default: "Quick answers to the most common questions." }
    ],
    blocks: [
      {
        type: "faq",
        name: "Question",
        settings: [
          { type: "text", id: "q", label: "Question" },
          { type: "textarea", id: "a", label: "Answer" }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya FAQ",
        blocks: content.faq.map(f => ({
          type: "faq",
          settings: {
            q: f.q,
            a: f.a
          }
        }))
      }
    ]
  }
  const faqLiquid = `
<div class="bg-white py-24">
  <div class="container mx-auto px-6 max-w-3xl">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="text-slate-600">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>
    <div class="space-y-4" x-data="{ active: null }">
      {% for block in section.blocks %}
        <div class="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5">
          <button 
            @click="active = (active === {{ forloop.index0 }} ? null : {{ forloop.index0 }})" 
            class="flex w-full items-center justify-between text-left font-bold text-slate-900 focus:outline-none"
          >
            <span class="text-lg">{{ block.settings.q }}</span>
            <span class="ml-4 transform transition-transform duration-200" :class="active === {{ forloop.index0 }} ? 'rotate-180' : ''">▼</span>
          </button>
          <div 
            x-show="active === {{ forloop.index0 }}" 
            x-collapse 
            class="mt-4 text-slate-600 leading-relaxed"
          >
            {{ block.settings.a }}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(faqSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-faq.liquid', faqLiquid)

  // Guarantee
  const guaranteeSchema = {
    name: "Guarantee",
    settings: [
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "color", id: "bg_color", label: "Background Color", default: "#f8fafc" },
      { type: "text", id: "icon", label: "Icon (Emoji)", default: "🛡️" },
      { type: "text", id: "title", label: "Title", default: content.guarantee.title },
      { type: "textarea", id: "text", label: "Text", default: content.guarantee.text }
    ],
    presets: [{ name: "Zenya Guarantee" }]
  }
  const guaranteeLiquid = `
<div class="relative overflow-hidden py-24 text-center" style="background-color: {{ section.settings.bg_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute inset-0 zenya-gradient-sheen zenya-motion" style="background: radial-gradient(circle at 20% 20%, {{ settings.secondary_color }}, transparent 55%), radial-gradient(circle at 80% 70%, {{ settings.primary_color }}, transparent 55%); opacity: .10;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 max-w-2xl relative">
    <div class="bg-white/90 backdrop-blur p-12 rounded-3xl shadow-xl border border-slate-100">
      <div class="text-6xl mb-6">{{ section.settings.icon }}</div>
      <h2 class="text-2xl font-bold mb-4 text-slate-900">{{ section.settings.title }}</h2>
      <p class="text-slate-600 leading-relaxed">{{ section.settings.text }}</p>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(guaranteeSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-guarantee.liquid', guaranteeLiquid)

  // 4. Templates (Index)
  const sections: any = {}
  const order: string[] = []

  const addSection = (key: string, data: any) => {
    sections[key] = data
    order.push(key)
  }

  addSection("hero", {
    "type": "zenya-hero",
    "settings": {
      "headline": content.hero.headline,
      "subheadline": content.hero.subheadline,
      "cta": content.hero.cta,
      "external_image_url": images[0] || ""
    }
  })

  addSection("featured_product", {
    "type": "zenya-featured-product",
    "settings": {
      "enable_bg_motion": true,
      "kicker": "Limited Offer",
      "headline": content.hero.headline,
      "subheadline": content.hero.subheadline,
      "bullet_1": "Fast shipping with tracking",
      "bullet_2": "30-day returns",
      "bullet_3": "Secure checkout",
      "support_line": "Questions? We respond fast."
    }
  })

  addSection("trust_badges", {
    "type": "zenya-trust-badges",
    "settings": {
      "heading": content.trust_badges?.heading || "Shop with Confidence"
    },
    "blocks": {
      "badge_0": { "type": "badge", "settings": { "title": "Free Shipping", "subtext": "On all orders", "icon": "box" } },
      "badge_1": { "type": "badge", "settings": { "title": "30-Day Returns", "subtext": "Hassle-free", "icon": "check" } },
      "badge_2": { "type": "badge", "settings": { "title": "Secure Checkout", "subtext": "Encrypted", "icon": "lock" } },
      "badge_3": { "type": "badge", "settings": { "title": "Fast Support", "subtext": "We respond fast", "icon": "chat" } }
    },
    "block_order": ["badge_0", "badge_1", "badge_2", "badge_3"]
  })

  addSection("features", {
    "type": "zenya-features",
    "settings": {
      "heading": `Why ${name} works`,
      "subheading": "Clear benefits that matter day one."
    },
    "blocks": (content.features || []).reduce((acc, f, i) => ({
      ...acc,
      [`feature_${i}`]: {
        "type": "feature",
        "settings": {
          "title": f.title,
          "desc": f.desc,
          "icon": f.icon || "star"
        }
      }
    }), {}),
    "block_order": (content.features || []).map((_, i) => `feature_${i}`)
  })

  addSection("problem_solution", {
    "type": "zenya-problem-solution",
    "settings": {
      "problem_headline": content.problem.headline,
      "problem_text": content.problem.text,
      "solution_headline": content.solution.headline,
      "solution_text": content.solution.text,
      "external_image_url": images[1] || images[0] || ""
    }
  })

  // Comparison Table (Optional -> Default)
  const comparisonData = (content.comparison && content.comparison.length > 0) 
    ? content.comparison 
    : [
        { feature: "Quality", us: true, them: false },
        { feature: "Durability", us: true, them: false },
        { feature: "Price", us: true, them: false }
      ]

  addSection("comparison", {
    "type": "zenya-comparison",
    "settings": {
      "heading": "Why Choose Us?"
    },
    "blocks": comparisonData.reduce((acc, comp, i) => ({
      ...acc,
      [`comp_${i}`]: {
        "type": "row",
        "settings": {
          "feature": comp.feature,
          "us_check": comp.us,
          "them_check": comp.them
        }
      }
    }), {}),
    "block_order": comparisonData.map((_, i) => `comp_${i}`)
  })

  addSection("testimonials", {
    "type": "zenya-testimonials",
    "blocks": (content.testimonials || []).reduce((acc, t, i) => ({
      ...acc,
      [`testimonial_${i}`]: {
        "type": "testimonial",
        "settings": {
          "name": t.name,
          "text": t.text,
          "location": t.location
        }
      }
    }), {}),
    "block_order": (content.testimonials || []).map((_, i) => `testimonial_${i}`)
  })

  addSection("faq", {
    "type": "zenya-faq",
    "blocks": (content.faq || []).reduce((acc, f, i) => ({
      ...acc,
      [`faq_${i}`]: {
        "type": "faq",
        "settings": {
          "q": f.q,
          "a": f.a
        }
      }
    }), {}),
    "block_order": (content.faq || []).map((_, i) => `faq_${i}`)
  })

  addSection("guarantee", {
    "type": "zenya-guarantee",
    "settings": {
      "title": content.guarantee?.title || "Our Promise",
      "text": content.guarantee?.text || "Satisfaction guaranteed."
    }
  })

  // Newsletter (Optional -> Default)
  addSection("newsletter", {
    "type": "zenya-newsletter",
    "settings": {
      "title": content.newsletter?.title || "Join Our Newsletter",
      "text": content.newsletter?.text || "Subscribe for updates and exclusive offers."
    }
  })

  const trustBadgesSchema = {
    name: "Trust Badges",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: content.trust_badges?.heading || "Shop with Confidence" },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "color", id: "bg_color", label: "Background Color", default: "#f8fafc" },
      { type: "color", id: "text_color", label: "Text Color", default: "#0f172a" }
    ],
    blocks: [
      {
        type: "badge",
        name: "Badge",
        settings: [
          { type: "text", id: "title", label: "Title", default: "Free Shipping" },
          { type: "text", id: "subtext", label: "Subtext", default: "On all orders" },
          { type: "select", id: "icon", label: "Icon", default: "box", "options": [
            { "value": "box", "label": "Box" },
            { "value": "check", "label": "Check" },
            { "value": "lock", "label": "Lock" },
            { "value": "chat", "label": "Chat" },
            { "value": "refresh", "label": "Refresh" },
            { "value": "shield", "label": "Shield" }
          ]}
        ]
      }
    ],
    presets: [{ name: "Zenya Trust Badges" }]
  }
  const trustBadgesLiquid = `
<div class="relative overflow-hidden py-10" style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.primary_color }}, transparent 70%); opacity: .10; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.secondary_color }}, transparent 70%); opacity: .10; animation-duration: {{ 24 | minus: settings.motion_strength | at_least: 12 }}s;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 relative">
    <div class="rounded-3xl border border-slate-100 bg-white/90 backdrop-blur p-6 shadow-sm">
      <div class="mb-5 text-center">
        <h3 class="text-sm font-bold uppercase tracking-wider opacity-80">{{ section.settings.heading }}</h3>
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {% for block in section.blocks %}
          <div class="flex flex-col items-center text-center rounded-2xl border border-slate-100 bg-white p-4">
            <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm" style="background: color-mix(in srgb, {{ settings.primary_color }} 10%, white); color: {{ settings.primary_color }};">
              {% case block.settings.icon %}
                {% when 'lock' %}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {% when 'check' %}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {% when 'refresh' %}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {% when 'chat' %}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-3A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {% when 'shield' %}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" /></svg>
                {% else %}
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              {% endcase %}
            </div>
            <div class="text-xs font-bold text-slate-900">{{ block.settings.title }}</div>
            <div class="text-[10px] text-slate-500">{{ block.settings.subtext }}</div>
          </div>
        {% endfor %}
      </div>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(trustBadgesSchema, null, 2)}
{% endschema %}
`
  zip.folder('sections')?.file('zenya-trust-badges.liquid', trustBadgesLiquid)

  const upsellSchema = {
    name: "Upsell",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: content.upsell?.heading || "Frequently Bought Together" },
      { type: "product", id: "product", label: "Main Product" },
      { type: "product", id: "upsell_product", label: "Upsell Product" },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" },
      { type: "color", id: "primary_color", label: "Primary Color", default: "#000000" }
    ],
    presets: [{ name: "Zenya Upsell" }]
  }

  const upsellLiquid = `
<div class="py-8" style="background-color: {{ section.settings.bg_color }};">
  <div class="container mx-auto px-6 max-w-lg">
    {% assign main_product = all_products[section.settings.product] %}
    {% assign upsell_product = all_products[section.settings.upsell_product] %}
    
    {% if main_product != blank and upsell_product != blank %}
      <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <h3 class="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wide">
          {{ section.settings.heading }}
        </h3>
        
        <div class="flex items-center gap-4">
          <!-- Images -->
          <div class="flex items-center gap-2">
            <div class="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {{ main_product.featured_image | image_url: width: 200 | image_tag: class: 'h-full w-full object-cover' }}
            </div>
            <span class="text-slate-400 font-bold">+</span>
            <div class="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {{ upsell_product.featured_image | image_url: width: 200 | image_tag: class: 'h-full w-full object-cover' }}
            </div>
          </div>
  
          <!-- Info -->
          <div class="flex-1">
            <div class="text-sm font-medium text-slate-900 line-clamp-1">{{ upsell_product.title }}</div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-red-600">{{ upsell_product.price | money }}</span>
              {% if upsell_product.compare_at_price > upsell_product.price %}
                <span class="text-xs text-slate-400 line-through">{{ upsell_product.compare_at_price | money }}</span>
              {% endif %}
            </div>
          </div>
  
          <!-- Add Button -->
          <form method="post" action="{{ routes.cart_add_url }}">
            <input type="hidden" name="id" value="{{ upsell_product.selected_or_first_available_variant.id }}">
            <button
              type="submit"
              class="shrink-0 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              style="background-color: {{ section.settings.primary_color }};"
            >
              Add +
            </button>
          </form>
        </div>
        
        <div class="mt-3 text-xs text-slate-500">
          <span class="text-green-600 font-bold">✓ Free Shipping</span> applied to this bundle
        </div>
      </div>
    {% else %}
       <div class="text-center p-4 border border-dashed border-slate-300 rounded-lg">
         Select products in the editor to see the upsell.
       </div>
    {% endif %}
  </div>
</div>
{% schema %}
${JSON.stringify(upsellSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-upsell.liquid', upsellLiquid)

  const volumeBundlesSchema = {
    name: "Volume Bundles",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: content.volume_bundles?.heading || "Buy More, Save More" },
      { type: "text", id: "label_1", label: "Label 1", default: content.volume_bundles?.label_buy_1 || "Starter Pack" },
      { type: "text", id: "label_2", label: "Label 2", default: content.volume_bundles?.label_buy_2 || "Most Popular" },
      { type: "text", id: "label_3", label: "Label 3", default: content.volume_bundles?.label_buy_3 || "Best Value" },
      { type: "product", id: "product", label: "Product" },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" },
      { type: "color", id: "primary_color", label: "Primary Color", default: "#000000" }
    ],
    presets: [{ name: "Zenya Volume Bundles" }]
  }
  
  const volumeBundlesLiquid = `
<div class="py-8" style="background-color: {{ section.settings.bg_color }};" x-data="{ selectedQuantity: 2 }">
  <div class="container mx-auto px-6 max-w-lg">
    {% assign product = all_products[section.settings.product] %}
    {% if product != blank %}
      
      <div class="my-6 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-slate-900">Select Quantity</span>
          <span class="text-xs font-medium text-red-600 animate-pulse">
            🔥 High demand
          </span>
        </div>

        <div class="space-y-3">
          <!-- Option 1 -->
          <div 
            @click="selectedQuantity = 1"
            class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
            :class="selectedQuantity === 1 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
            style="--tw-ring-color: {{ section.settings.primary_color }}; --tw-border-opacity: 1;"
            :style="selectedQuantity === 1 ? 'border-color: {{ section.settings.primary_color }}' : ''"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                   :style="selectedQuantity === 1 ? 'border-color: {{ section.settings.primary_color }}; background-color: {{ section.settings.primary_color }}' : 'background-color: transparent'"
                >
                  <div x-show="selectedQuantity === 1" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-base">Buy 1</div>
                  <div class="text-xs text-slate-500">Standard Price</div>
                </div>
              </div>
              <div class="font-bold text-slate-900 text-lg">{{ product.price | money }}</div>
            </div>
          </div>

          <!-- Option 2 -->
          <div 
            @click="selectedQuantity = 2"
            class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
            :class="selectedQuantity === 2 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
             style="--tw-ring-color: {{ section.settings.primary_color }};"
             :style="selectedQuantity === 2 ? 'border-color: {{ section.settings.primary_color }}' : ''"
          >
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full bg-primary uppercase tracking-wide" style="background-color: {{ section.settings.primary_color }}">
              Most Popular
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                   :style="selectedQuantity === 2 ? 'border-color: {{ section.settings.primary_color }}; background-color: {{ section.settings.primary_color }}' : 'background-color: transparent'"
                >
                  <div x-show="selectedQuantity === 2" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-base">Buy 2</div>
                  <div class="text-xs font-bold text-green-600">Save 15% OFF</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-slate-900 text-lg">{{ product.price | times: 2 | times: 0.85 | money }}</div>
                <div class="text-xs text-slate-400 line-through">{{ product.price | times: 2 | money }}</div>
              </div>
            </div>
          </div>
          
           <!-- Option 3 -->
          <div 
            @click="selectedQuantity = 3"
            class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
            :class="selectedQuantity === 3 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
             style="--tw-ring-color: {{ section.settings.primary_color }};"
             :style="selectedQuantity === 3 ? 'border-color: {{ section.settings.primary_color }}' : ''"
          >
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full bg-red-500 uppercase tracking-wide">
              Best Value
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                   :style="selectedQuantity === 3 ? 'border-color: {{ section.settings.primary_color }}; background-color: {{ section.settings.primary_color }}' : 'background-color: transparent'"
                >
                  <div x-show="selectedQuantity === 3" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-base">Buy 3</div>
                  <div class="text-xs font-bold text-green-600">Save 25% OFF</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-slate-900 text-lg">{{ product.price | times: 3 | times: 0.75 | money }}</div>
                <div class="text-xs text-slate-400 line-through">{{ product.price | times: 3 | money }}</div>
              </div>
            </div>
          </div>

        </div>
        
        <form method="post" action="{{ routes.cart_add_url }}">
            <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
            <input type="hidden" name="quantity" :value="selectedQuantity">
            <button 
              type="submit" 
              class="w-full rounded-full py-4 text-xl font-bold text-white shadow-xl transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 bg-primary mt-6 mb-4"
              style="background-color: {{ section.settings.primary_color }}"
            >
              <span>{{ settings.add_to_cart_label }}</span>
            </button>
        </form>

      </div>
    {% else %}
        <div class="text-center p-4 border border-dashed border-slate-300 rounded-lg">
            Select a product to see volume bundles.
        </div>
    {% endif %}
  </div>
</div>
{% schema %}
${JSON.stringify(volumeBundlesSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-volume-bundles.liquid', volumeBundlesLiquid)

  const indexJson = { sections, order }
  zip.folder('templates')?.file('index.json', JSON.stringify(indexJson, null, 2))

  // ==========================================
  // 5. PRODUCT PAGE (High Conversion)
  // ==========================================
  
  const mainProductSchema = {
    "name": "Product Page",
    "settings": [
      {
        "type": "checkbox",
        "id": "show_stock",
        "label": "Show Stock Counter",
        "default": true
      },
      {
        "type": "text",
        "id": "review_count",
        "label": "Review Count Text",
        "default": content.stats?.[0]?.value ? content.stats[0].value + " " + content.stats[0].label : "1,234 Reviews"
      },
      {
        "type": "text",
        "id": "guarantee_text",
        "label": "Guarantee Text",
        "default": content.guarantee?.title || "No questions asked"
      },
      {
        "type": "checkbox",
        "id": "sticky_atc",
        "label": "Show Sticky Add To Cart",
        "default": true
      }
    ],
    "blocks": [
      {
        "type": "@app"
      },
      {
        "type": "pickup_availability",
        "name": "Pickup Availability",
        "limit": 1,
        "settings": []
      },
      {
        "type": "custom_liquid",
        "name": "Custom Liquid",
        "settings": [
          {
            "type": "liquid",
            "id": "custom_liquid",
            "label": "Custom Liquid"
          }
        ]
      }
    ],
    "presets": [
      {
        "name": "Zenya Product"
      }
    ]
  }

  const mainProductLiquid = `
<div class="py-10 lg:py-20 bg-white" id="MainProduct-{{ section.id }}" 
  x-data="{ 
  selectedQuantity: 1,
  
  // Variant Logic
  variants: [
    {% for variant in product.variants %}
      {
        id: {{ variant.id }},
        title: {{ variant.title | json }},
        price: {{ variant.price }},
        compare_at_price: {{ variant.compare_at_price | default: 'null' }},
        featured_media: {{ variant.featured_media | json }},
        options: {{ variant.options | json }},
        unit_price: {{ variant.unit_price | default: 'null' }},
        unit_price_measurement: {{ variant.unit_price_measurement | json }}
      }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ],
  optionNames: {{ product.options | json | escape }},
  options: {
    {% for option in product.options_with_values %}
      {{ option.name | json | escape }}: {{ option.selected_value | json | escape }}{% unless forloop.last %},{% endunless %}
    {% endfor %}
  },
  currentVariantId: {{ product.selected_or_first_available_variant.id }},
  currentPrice: {{ product.selected_or_first_available_variant.price }},
  currentComparePrice: {{ product.selected_or_first_available_variant.compare_at_price | default: 'null' }},
  currentMediaId: {{ product.selected_or_first_available_variant.featured_media.id | default: product.featured_media.id | default: 'null' }},
  stock: 14,
  timeLeft: 43200,
  isStickyVisible: false,
  visitors: 24,
  
  // Computed Properties
  get variant() {
    return this.variants.find(v => {
      return v.options.every((opt, index) => {
        const optionName = this.optionNames[index];
        return this.options[optionName] === opt;
      });
    }) || this.variants[0];
  },

  updateVariant() {
    const matched = this.variants.find(v => {
      // Create array of selected values in correct order
      const selectedValues = [];
      {% for option in product.options %}
        selectedValues.push(this.options[{{ option | json | escape }}]);
      {% endfor %}
      
      return v.options.every((val, i) => val === selectedValues[i]);
    });

    if (matched) {
      this.currentVariantId = matched.id;
      this.currentPrice = matched.price;
      this.currentComparePrice = matched.compare_at_price;
      if (matched.featured_media) {
        this.currentMediaId = matched.featured_media.id;
      }
      
      // Update URL without reload
      const url = new URL(window.location);
      url.searchParams.set('variant', matched.id);
      window.history.replaceState({}, '', url);
    }
  },

  get discount() {
    if (this.selectedQuantity === 2) return 15;
    if (this.selectedQuantity === 3) return 25;
    return 0;
  },
  
  get totalPrice() {
    let total = this.currentPrice * this.selectedQuantity;
    if (this.discount > 0) {
      total = total * (1 - (this.discount / 100));
    }
    return (total / 100).toFixed(2);
  },

  get savings() {
    let regular = this.currentPrice * this.selectedQuantity;
    let discounted = regular * (1 - (this.discount / 100));
    return ((regular - discounted) / 100).toFixed(2);
  },

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return \`\${h}h \${m}m \${s}s\`;
  },

  formatMoney(cents) {
    return '{{ cart.currency.symbol }}' + (cents / 100).toFixed(2);
  },
  
  init() {
    setInterval(() => {
      if(this.timeLeft > 0) this.timeLeft--;
    }, 1000);
    window.addEventListener('scroll', () => {
      const atcButton = document.getElementById('main-atc-button');
      if (atcButton) {
        const rect = atcButton.getBoundingClientRect();
        this.isStickyVisible = rect.top < 0;
      }
    });
    // Live Visitor Counter Logic
    setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      this.visitors = Math.min(Math.max(this.visitors + change, 12), 45);
    }, 4000);
  }
}">
  
  <!-- Sticky Add To Cart Bar -->
  {% if section.settings.sticky_atc %}
  <div 
    x-show="isStickyVisible" 
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="translate-y-full opacity-0"
    x-transition:enter-end="translate-y-0 opacity-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="translate-y-0 opacity-100"
    x-transition:leave-end="translate-y-full opacity-0"
    class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-50 lg:hidden"
    style="display: none;"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex-1">
        <div class="text-xs text-slate-500 font-medium">Total Price</div>
        <div class="font-bold text-slate-900 text-lg">{{ cart.currency.symbol }}<span x-text="totalPrice"></span></div>
      </div>
      <button 
        @click="document.getElementById('main-atc-button').click()"
        class="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition text-sm uppercase tracking-wide"
        style="background-color: {{ settings.primary_color }}"
      >
        {{ settings.add_to_cart_label }}
      </button>
    </div>
  </div>
  {% endif %}

  <div class="container mx-auto px-4 lg:px-6">
    <div class="grid gap-10 lg:grid-cols-12 lg:gap-16">
      
      <!-- Left: Images -->
      <div class="lg:col-span-7">
        <!-- Mobile: Horizontal Scroll (Snap) -->
        <div class="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-4 lg:hidden scrollbar-hide">
          {% if product.media.size > 0 %}
            {% for media in product.media %}
              <div class="snap-center shrink-0 w-[85vw] relative aspect-square rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                {% case media.media_type %}
                  {% when 'image' %}
                    {{ media | image_tag: class: 'h-full w-full object-cover', loading: 'lazy', widths: '400, 600, 800' }}
                  {% when 'video' %}
                    {{ media | video_tag: class: 'h-full w-full object-cover', controls: true, image_size: '800x' }}
                  {% when 'external_video' %}
                    {{ media | external_video_tag: class: 'h-full w-full object-cover' }}
                  {% when 'model' %}
                    {{ media | model_viewer_tag: class: 'h-full w-full object-cover', reveal: 'interaction', image_size: '800x' }}
                {% endcase %}
                {% if forloop.first and product.compare_at_price > product.price %}
                  <div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                    Sale
                  </div>
                {% endif %}
              </div>
            {% endfor %}
          {% else %}
             <div class="snap-center shrink-0 w-[85vw] relative aspect-square rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                <img 
                  src="{{ product.featured_image | image_url: width: 800 }}" 
                  width="{{ product.featured_image.width }}" 
                  height="{{ product.featured_image.height }}"
                  alt="{{ product.title }}" 
                  class="h-full w-full object-cover">
             </div>
          {% endif %}
        </div>

        <!-- Desktop: Main + Thumbnails -->
        <div class="hidden lg:block space-y-4">
          {% if product.media.size > 0 %}
            <div class="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              {% for media in product.media %}
                <div x-show="currentMediaId === {{ media.id }}" x-cloak class="h-full w-full">
                   {% case media.media_type %}
                    {% when 'image' %}
                      {{ media | image_tag: class: 'h-full w-full object-cover', loading: 'eager', widths: '500, 1000, 1500' }}
                    {% when 'video' %}
                      {{ media | video_tag: class: 'h-full w-full object-cover', controls: true, image_size: '1000x' }}
                    {% when 'external_video' %}
                      {{ media | external_video_tag: class: 'h-full w-full object-cover' }}
                    {% when 'model' %}
                      {{ media | model_viewer_tag: class: 'h-full w-full object-cover', reveal: 'interaction', image_size: '1000x' }}
                   {% endcase %}
                </div>
              {% endfor %}
              
              <div x-show="currentComparePrice > currentPrice" class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm z-10">
                Sale
              </div>
            </div>
            <div class="grid grid-cols-6 gap-3">
              {% for media in product.media %}
                <button 
                  @click="currentMediaId = {{ media.id }}"
                  class="relative aspect-square overflow-hidden rounded-lg border-2 transition hover:border-slate-300 focus:ring-2 focus:ring-primary"
                  :class="currentMediaId === {{ media.id }} ? 'border-primary' : 'border-transparent'"
                >
                  {{ media | image_url: width: 200 | image_tag: class: 'h-full w-full object-cover' }}
                  {% if media.media_type == 'video' or media.media_type == 'external_video' %}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  {% elsif media.media_type == 'model' %}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                  {% endif %}
                </button>
              {% endfor %}
            </div>
          {% else %}
            {{ 'product-1' | placeholder_svg_tag: 'w-full h-full bg-slate-100' }}
          {% endif %}
        </div>
      </div>

      <!-- Right: Info -->
      <div class="lg:col-span-5">
        <div class="lg:sticky lg:top-24 h-fit">
          <div class="mb-4">
            <div class="flex flex-wrap items-center gap-3 mb-2">
              <div class="flex items-center gap-1">
                <div class="flex text-yellow-400 text-sm">★★★★★</div>
                <span class="text-xs font-bold text-slate-700">4.9/5</span>
              </div>
              <span class="text-xs text-slate-400">|</span>
              <span class="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2">{{ section.settings.review_count }}</span>
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">{{ product.title }}</h1>
            
            <!-- Benefit Row (Icons) -->
            <div class="flex items-center gap-4 mt-3 text-xs font-medium text-slate-600">
              <div class="flex items-center gap-1.5">
                <div class="p-1 rounded-full bg-green-100 text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                In Stock Ready to Ship
              </div>
              <div class="flex items-center gap-1.5">
                <div class="p-1 rounded-full bg-blue-100 text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                1-Year Warranty
              </div>
            </div>
          </div>
          
          <div class="mb-6 flex items-end gap-3 border-b border-slate-100 pb-6">
            <span class="text-4xl font-bold text-slate-900" x-text="formatMoney(currentPrice)">{{ product.price | money }}</span>
            <span x-show="currentComparePrice > currentPrice" class="mb-1.5 text-xl text-slate-400 line-through" x-text="formatMoney(currentComparePrice)">{{ product.compare_at_price | money }}</span>
            <span x-show="currentComparePrice > currentPrice" class="mb-2 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">SAVE <span x-text="formatMoney(currentComparePrice - currentPrice)"></span></span>
          </div>

          {% if section.settings.show_stock %}
            <div class="mb-8 space-y-3 rounded-lg border border-red-100 bg-red-50 p-4 relative overflow-hidden">
               <!-- Live Visitor Counter -->
               <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-600 shadow-sm">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span x-text="visitors"></span> viewing now
               </div>

              <div class="flex items-center justify-between text-sm font-bold text-red-800 pt-2">
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                     <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Only <span x-text="stock"></span> items left!
                </div>
                <div>Ends in: <span x-text="formatTime(timeLeft)" class="tabular-nums"></span></div>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-red-200">
                <div class="h-full rounded-full bg-red-500 transition-all duration-1000" :style="'width: ' + (stock/50)*100 + '%'"></div>
              </div>
            </div>
          {% endif %}

          {% form 'product', product %}
            <input type="hidden" name="id" :value="currentVariantId">
            <input type="hidden" name="quantity" :value="selectedQuantity">

            <!-- Variant Selectors -->
            {% unless product.has_only_default_variant %}
              <div class="space-y-4 mb-6">
                {% for option in product.options_with_values %}
                  <div>
                    <label class="block text-sm font-bold text-slate-900 mb-2">{{ option.name }}</label>
                    <div class="flex flex-wrap gap-2">
                      {% for value in option.values %}
                        <button 
                          type="button"
                          @click="options['{{ option.name }}'] = '{{ value }}'; updateVariant()"
                          class="px-4 py-2 rounded-full border text-sm font-bold transition-all"
                          :class="options['{{ option.name }}'] === '{{ value }}' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                        >
                          {{ value }}
                        </button>
                      {% endfor %}
                    </div>
                  </div>
                {% endfor %}
              </div>
            {% endunless %}

            <!-- Volume Bundles Widget -->
            <div class="my-6 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-slate-900">Select Quantity</span>
                <span class="text-xs font-medium text-red-600 animate-pulse">
                  🔥 High demand
                </span>
              </div>

              <div class="space-y-3">
                <!-- Option 1 -->
                <div 
                  @click="selectedQuantity = 1"
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="selectedQuantity === 1 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        :class="selectedQuantity === 1 ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'"
                      >
                        <div x-show="selectedQuantity === 1" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-base">Buy 1</div>
                        <div class="text-xs text-slate-500">Standard Price</div>
                      </div>
                    </div>
                    <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice)">{{ product.price | money }}</div>
                  </div>
                </div>

                <!-- Option 2 -->
                <div 
                  @click="selectedQuantity = 2"
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="selectedQuantity === 2 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
                >
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full bg-primary uppercase tracking-wide">
                    Most Popular
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        :class="selectedQuantity === 2 ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'"
                      >
                        <div x-show="selectedQuantity === 2" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-base">Buy 2</div>
                        <div class="text-xs font-bold text-green-600">Save 15% OFF</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice * 2 * 0.85)"></div>
                      <div class="text-xs text-slate-400 line-through" x-text="formatMoney(currentPrice * 2)"></div>
                    </div>
                  </div>
                </div>

                <!-- Option 3 -->
                <div 
                  @click="selectedQuantity = 3"
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="selectedQuantity === 3 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
                >
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full bg-red-500 uppercase tracking-wide">
                    Best Value
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        :class="selectedQuantity === 3 ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'"
                      >
                        <div x-show="selectedQuantity === 3" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-base">Buy 3</div>
                        <div class="text-xs font-bold text-green-600">Save 25% OFF</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice * 3 * 0.75)"></div>
                      <div class="text-xs text-slate-400 line-through" x-text="formatMoney(currentPrice * 3)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              id="main-atc-button"
              type="submit" 
              class="w-full rounded-full py-4 text-xl font-bold text-white shadow-xl transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 bg-primary mt-6 mb-4"
            >
              <span>{{ settings.add_to_cart_label }}</span>
              <span class="text-sm opacity-90 font-normal">- <span x-text="savings > 0 ? 'Save ' + '{{ cart.currency.symbol }}' + savings : ''"></span></span>
            </button>
            
            <div class="mt-4 mb-4 dynamic-checkout-buttons">
              {{ form | payment_button }}
            </div>
            
            {%- for block in section.blocks -%}
              {%- case block.type -%}
                {%- when '@app' -%}
                  {% render block %}
                {%- when 'pickup_availability' -%}
                  <div class="pickup-availability-container mb-6">
                    {% assign pick_up_availabilities = product.selected_or_first_available_variant.store_availabilities | where: 'pick_up_enabled', true %}
                    {% if pick_up_availabilities.size > 0 %}
                       <div class="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-700 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          <div class="text-sm">
                             {% assign closest_location = pick_up_availabilities.first %}
                             {% if closest_location.available %}
                                <p class="font-bold text-slate-900">Pickup available at {{ closest_location.location.name }}</p>
                                <p class="text-slate-500 text-xs">{{ closest_location.pick_up_time }}</p>
                             {% else %}
                                 <p class="font-bold text-slate-900">Check availability at stores</p>
                             {% endif %}
                          </div>
                       </div>
                    {% endif %}
                  </div>
                {%- when 'custom_liquid' -%}
                  {{ block.settings.custom_liquid }}
              {%- endcase -%}
            {%- endfor -%}
            
            <!-- Trust Badges -->
            <div class="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-medium mb-6">
              <div class="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>SSL Secure</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Tracked Shipping</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Money Back</span>
              </div>
            </div>

            <!-- Accordions -->
            <div class="divide-y divide-slate-100 border-t border-slate-100" x-data="{ active: 'desc' }">
              <!-- Description -->
              <div class="py-3">
                <button 
                  type="button"
                  @click="active = active === 'desc' ? null : 'desc'" 
                  class="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition"
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Description
                  </span>
                  <span class="transition transform duration-200" :class="active === 'desc' ? 'rotate-180' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div x-show="active === 'desc'" x-collapse class="mt-3 text-sm leading-relaxed text-slate-600 prose prose-sm max-w-none">
                  {{ product.description }}
                </div>
              </div>
              
              <!-- Shipping -->
              <div class="py-3">
                <button 
                  type="button"
                  @click="active = active === 'ship' ? null : 'ship'" 
                  class="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition"
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect><line x1="16" y1="8" x2="20" y2="8"></line><line x1="16" y1="16" x2="23" y2="16"></line><rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect></svg>
                    Shipping & Returns
                  </span>
                  <span class="transition transform duration-200" :class="active === 'ship' ? 'rotate-180' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div x-show="active === 'ship'" x-collapse class="mt-3 text-sm leading-relaxed text-slate-600">
                  <p class="mb-2"><strong>Free Worldwide Shipping</strong></p>
                  <p>All orders are processed within 24-48 hours. Shipping times depend on your location, generally taking 7-12 business days.</p>
                </div>
              </div>

              <!-- Guarantee -->
              <div class="py-3">
                <button 
                  type="button"
                  @click="active = active === 'guarantee' ? null : 'guarantee'" 
                  class="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition"
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Our Guarantee
                  </span>
                  <span class="transition transform duration-200" :class="active === 'guarantee' ? 'rotate-180' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div x-show="active === 'guarantee'" x-collapse class="mt-3 text-sm leading-relaxed text-slate-600">
                  {{ section.settings.guarantee_text }}
                </div>
              </div>
            </div>
          {% endform %}

        </div>
      </div>
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Product Page",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_stock",
      "label": "Show Stock Counter",
      "default": true
    },
    {
      "type": "text",
      "id": "review_count",
      "label": "Review Count Text",
      "default": "1,234 Reviews"
    },
    {
      "type": "text",
      "id": "guarantee_text",
      "label": "Guarantee Text",
      "default": "No questions asked"
    },
    {
      "type": "checkbox",
      "id": "sticky_atc",
      "label": "Show Sticky Add To Cart",
      "default": true
    }
  ],
  "blocks": [
    {
      "type": "@app"
    },
    {
      "type": "pickup_availability",
      "name": "Pickup Availability",
      "limit": 1,
      "settings": []
    },
    {
      "type": "custom_liquid",
      "name": "Custom Liquid",
      "settings": [
        {
          "type": "liquid",
          "id": "custom_liquid",
          "label": "Custom Liquid"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Zenya Product"
    }
  ]
}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-product.liquid', mainProductLiquid)

  // Product Template — all blocks populated with AI-generated content
  const productFeatureBlocks = Object.fromEntries(
    (content.features || []).map((f, i) => [`pf${i + 1}`, { type: 'feature', settings: { title: f.title, desc: f.desc } }])
  )
  const productHowItWorksBlocks = Object.fromEntries(
    (content.how_it_works || []).map((s, i) => [`hiw${i + 1}`, { type: 'step', settings: { title: s.title, text: s.text } }])
  )
  const productComparisonBlocks = Object.fromEntries(
    (content.comparison || []).map((c, i) => [`cmp${i + 1}`, { type: 'row', settings: { feature: c.feature, us_check: c.us, them_check: c.them } }])
  )
  const productTestimonialBlocks = Object.fromEntries(
    (content.testimonials || []).map((t, i) => [`rev${i + 1}`, { type: 'testimonial', settings: { name: t.name, text: t.text, location: t.location, stars: t.rating } }])
  )
  const productFaqBlocks = Object.fromEntries(
    (content.faq || []).map((q, i) => [`pfaq${i + 1}`, { type: 'faq', settings: { q: q.q, a: q.a } }])
  )

  const productJson = {
    "sections": {
      "main": {
        "type": "zenya-product",
        "settings": { "show_stock": true, "sticky_atc": true }
      },
      "trust_badges": {
        "type": "zenya-trust-badges",
        "settings": { "heading": content.trust_badges?.heading || "Shop with Confidence" }
      },
      "features": {
        "type": "zenya-features",
        "blocks": productFeatureBlocks,
        "block_order": Object.keys(productFeatureBlocks)
      },
      "volume_bundles": {
        "type": "zenya-volume-bundles",
        "settings": { "heading": content.volume_bundles?.heading || "Buy More, Save More" }
      },
      "before_after": {
        "type": "zenya-before-after",
        "settings": {
          "heading": content.before_after?.heading || "See the Difference",
          "label_before": content.before_after?.label_before || "Before",
          "label_after": content.before_after?.label_after || "After"
        }
      },
      "how_it_works": {
        "type": "zenya-how-it-works",
        "settings": {
          "heading": (content as any).how_it_works_section?.heading || "How It Works",
          "subheading": (content as any).how_it_works_section?.subheading || "Simple steps. Real results."
        },
        "blocks": productHowItWorksBlocks,
        "block_order": Object.keys(productHowItWorksBlocks)
      },
      "comparison": {
        "type": "zenya-comparison",
        "settings": { "heading": "Why Choose Us?" },
        "blocks": productComparisonBlocks,
        "block_order": Object.keys(productComparisonBlocks)
      },
      "reviews": {
        "type": "zenya-testimonials",
        "settings": { "title": "Customer Reviews" },
        "blocks": productTestimonialBlocks,
        "block_order": Object.keys(productTestimonialBlocks)
      },
      "faq": {
        "type": "zenya-faq",
        "blocks": productFaqBlocks,
        "block_order": Object.keys(productFaqBlocks)
      },
      "guarantee": {
        "type": "zenya-guarantee",
        "settings": {
          "title": content.guarantee?.title || "Our Promise",
          "text": content.guarantee?.text || "Satisfaction guaranteed."
        }
      },
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "title": content.newsletter?.title || "Get offers first",
          "text": content.newsletter?.text || "Subscribe for updates and exclusive deals."
        }
      },
      "recommendations": {
        "type": "zenya-featured-collection",
        "settings": { "title": "You May Also Like" }
      }
    },
    "order": ["main", "trust_badges", "features", "volume_bundles", "before_after", "how_it_works", "comparison", "reviews", "faq", "guarantee", "newsletter", "recommendations"]
  }
  zip.folder('templates')?.file('product.json', JSON.stringify(productJson, null, 2))

  // ==========================================
  // 6. COLLECTION PAGE
  // ==========================================

  const mainCollectionSchema = {
    name: "Collection Page",
    settings: [
      { type: "range", id: "products_per_page", label: "Products per page", min: 8, max: 24, default: 12 }
    ],
    presets: [{ name: "Zenya Collection Main" }]
  }

  const mainCollectionLiquid = `
<div class="py-12 bg-white">
  <div class="container mx-auto px-6">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-extrabold text-slate-900 mb-4">{{ collection.title }}</h1>
      <div class="text-slate-600 max-w-2xl mx-auto">{{ collection.description }}</div>
    </div>
    
    {% paginate collection.products by section.settings.products_per_page %}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
        {% for product in collection.products %}
          <a href="{{ product.url }}" class="group block">
            <div class="relative aspect-[1/1] overflow-hidden rounded-xl bg-slate-100 mb-4">
              <img 
                src="{{ product.featured_image | image_url: width: 600 }}" 
                width="{{ product.featured_image.width }}" 
                height="{{ product.featured_image.height }}"
                alt="{{ product.title }}" 
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
              {% if product.compare_at_price > product.price %}
                <div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">SALE</div>
              {% endif %}
            </div>
            <h3 class="font-bold text-slate-900 group-hover:text-primary transition">{{ product.title }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="font-bold text-slate-900">{{ product.price | money }}</span>
              {% if product.compare_at_price > product.price %}
                <span class="text-sm text-slate-400 line-through">{{ product.compare_at_price | money }}</span>
              {% endif %}
            </div>
          </a>
        {% endfor %}
      </div>
      
      <!-- Pagination -->
      {% if paginate.pages > 1 %}
        <div class="flex justify-center gap-2 mt-12">
          {% for part in paginate.parts %}
            {% if part.is_link %}
              <a href="{{ part.url }}" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition">{{ part.title }}</a>
            {% else %}
              <span class="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-bold">{{ part.title }}</span>
            {% endif %}
          {% endfor %}
        </div>
      {% endif %}
    {% endpaginate %}
  </div>
</div>
{% schema %}
${JSON.stringify(mainCollectionSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-collection.liquid', mainCollectionLiquid)

  const collectionTrustBadgesRaw: { title: string; desc: string }[] = (content as any).trust_badges?.badges || []
  const collectionTrustBlocks = Object.fromEntries(
    collectionTrustBadgesRaw.map((b, i) => [`ctb${i + 1}`, { type: 'badge', settings: { title: b.title, subtitle: b.desc } }])
  )
  const collectionTestimonialBlocks = Object.fromEntries(
    (content.testimonials || []).slice(0, 3).map((t, i) => [`ctr${i + 1}`, { type: 'testimonial', settings: { name: t.name, text: t.text, location: t.location, stars: t.rating } }])
  )

  const collectionJson = {
    "sections": {
      "banner": {
        "type": "zenya-hero",
        "settings": {
          "headline": content.collection_page?.headline || "Shop Our Collection",
          "subheadline": content.collection_page?.subheadline || "Browse our premium selection.",
          "cta": content.hero.cta || "Shop Now"
        }
      },
      "main": { "type": "main-collection" },
      "trust_badges": {
        "type": "zenya-trust-badges",
        "settings": { "heading": content.trust_badges?.heading || "Shop with Confidence" },
        "blocks": collectionTrustBlocks,
        "block_order": Object.keys(collectionTrustBlocks)
      },
      "reviews": {
        "type": "zenya-testimonials",
        "settings": { "title": "What Customers Are Saying" },
        "blocks": collectionTestimonialBlocks,
        "block_order": Object.keys(collectionTestimonialBlocks)
      },
      "featured_collection": { "type": "zenya-featured-collection", "settings": { "title": "Best Sellers" } },
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "title": content.newsletter?.title || "Join Our Community",
          "text": content.newsletter?.text || "Get exclusive deals and early access."
        }
      }
    },
    "order": ["banner", "main", "trust_badges", "reviews", "featured_collection", "newsletter"]
  }
  zip.folder('templates')?.file('collection.json', JSON.stringify(collectionJson, null, 2))

  // ==========================================
  // 7. CART PAGE
  // ==========================================
  
  const mainCartSchema = {
    name: "Cart Page",
    settings: [
      { type: "number", id: "free_shipping_threshold", label: "Free Shipping Threshold (Cents)", default: 10000 },
      { type: "checkbox", id: "show_upsells", label: "Show Upsells", default: true },
      { type: "collection", id: "upsell_collection", label: "Upsell Collection" },
      { type: "text", id: "free_shipping_before", label: "Free Shipping (Before)", default: content.cart_drawer?.free_shipping_before || "You are {amount} away from Free Shipping!" },
      { type: "text", id: "free_shipping_after", label: "Free Shipping (After)", default: content.cart_drawer?.free_shipping_after || "🎉 You've unlocked Free Shipping!" },
      { type: "text", id: "secure_line", label: "Secure Line", default: content.cart_drawer?.secure_line || "🔒 SSL Encrypted Payment" },
      { type: "text", id: "returns_line", label: "Returns Line", default: content.cart_drawer?.reassurance_lines?.[0] || "↩️ 30-Day Money Back Guarantee" },
      { type: "text", id: "headline", label: "Page Headline", default: content.cart_page?.headline || "Your Cart" },
      { type: "text", id: "empty_headline", label: "Empty Cart Headline", default: content.cart_page?.empty_headline || "Your cart is empty" },
      { type: "text", id: "empty_subheadline", label: "Empty Cart Subheadline", default: content.cart_page?.empty_subheadline || "Looks like you haven't added anything yet." }
    ],
    presets: [{ name: "Zenya Cart Main" }]
  }
  
  const mainCartLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6 max-w-6xl">
    <h1 class="text-3xl font-extrabold text-slate-900 mb-8 text-center">{{ section.settings.headline }}</h1>
    
    {% if cart.item_count > 0 %}
      <div class="flex flex-col lg:flex-row gap-12 items-start">
        
        <!-- Left Column: Cart Items -->
        <div class="flex-1 w-full">
          <!-- Free Shipping Progress Bar -->
          {% assign free_shipping_threshold = section.settings.free_shipping_threshold %}
          {% assign cart_total = cart.total_price %}
          {% assign progress = cart_total | times: 100 | divided_by: free_shipping_threshold %}
          {% if progress > 100 %}{% assign progress = 100 %}{% endif %}
          {% assign left_to_spend = free_shipping_threshold | minus: cart_total %}
          {% assign left_to_spend_money = left_to_spend | money %}
          {% assign amount_token = '{' | append: 'amount' | append: '}' %}

          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            {% if left_to_spend > 0 %}
              <p class="text-center text-slate-900 font-bold mb-3">
                {{ section.settings.free_shipping_before | replace: amount_token, left_to_spend_money }}
              </p>
            {% else %}
              <p class="text-center text-green-600 font-bold mb-3">
                {{ section.settings.free_shipping_after }}
              </p>
            {% endif %}
            <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden" 
                   style="width: {{ progress }}%; background-color: {{ settings.primary_color }};">
                 <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>

          <form action="{{ routes.cart_url }}" method="post" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-6 space-y-6">
            {% for item in cart.items %}
              <div class="flex items-center gap-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                <div class="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src="{{ item.image | image_url: width: 200 }}" 
                    width="{{ item.image.width }}" 
                    height="{{ item.image.height }}"
                    alt="{{ item.product.title | escape }}"
                    class="w-full h-full object-cover">
                </div>
                  <div class="flex-1">
                    <h3 class="font-bold text-slate-900 text-lg"><a href="{{ item.url }}" class="hover:text-primary transition">{{ item.product.title }}</a></h3>
                    <p class="text-sm text-slate-500 mb-2">{{ item.variant.title }}</p>
                    <div class="font-bold text-slate-900">{{ item.final_line_price | money }}</div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <div class="flex items-center border border-slate-200 rounded-lg">
                      <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | minus: 1 }}" class="px-3 py-1 hover:bg-slate-50 text-slate-600">-</a>
                      <span class="px-2 font-bold text-slate-900">{{ item.quantity }}</span>
                      <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | plus: 1 }}" class="px-3 py-1 hover:bg-slate-50 text-slate-600">+</a>
                    </div>
                    <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity=0" class="text-red-500 hover:text-red-700 text-sm font-medium">Remove</a>
                  </div>
                </div>
              {% endfor %}
            </div>
          </form>
          
          <!-- Upsells Section -->
          {% if section.settings.show_upsells and section.settings.upsell_collection != blank %}
            <div class="mt-8">
               <h3 class="text-xl font-bold text-slate-900 mb-4">Complete Your Order</h3>
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {% for product in collections[section.settings.upsell_collection].products limit: 2 %}
                     <div class="bg-white p-4 rounded-xl border border-slate-100 flex gap-4 items-center">
                        <img src="{{ product.featured_image | image_url: width: 100 }}" class="w-20 h-20 object-cover rounded-lg" alt="{{ product.title }}">
                        <div class="flex-1 min-w-0">
                           <h4 class="font-bold text-slate-900 truncate">{{ product.title }}</h4>
                           <p class="text-slate-500 text-sm mb-2">{{ product.price | money }}</p>
                           {% form 'product', product %}
                              <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
                              <button type="submit" class="text-xs font-bold bg-slate-900 text-white rounded px-4 py-2 hover:opacity-90 transition">{{ settings.quick_add_label }}</button>
                           {% endform %}
                        </div>
                     </div>
                  {% endfor %}
               </div>
            </div>
          {% endif %}
        </div>

        <!-- Right Column: Summary -->
        <div class="w-full lg:w-96 flex-shrink-0">
           <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-8">
              <h2 class="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
              
              <div class="flex justify-between items-center mb-4 text-slate-600">
                <span>Subtotal</span>
                <span class="font-bold text-slate-900">{{ cart.total_price | money }}</span>
              </div>
              <div class="flex justify-between items-center mb-6 text-slate-600">
                <span>Shipping</span>
                <span class="text-sm">Calculated at checkout</span>
              </div>
              
              <div class="border-t border-slate-100 pt-4 mb-6">
                <div class="flex justify-between items-center">
                  <span class="text-xl font-bold text-slate-900">Total</span>
                  <span class="text-2xl font-extrabold text-primary">{{ cart.total_price | money }}</span>
                </div>
              </div>

              <div class="grid gap-4">
                <form action="{{ routes.cart_url }}" method="post">
                   <button type="submit" name="checkout" class="w-full py-4 rounded-full text-xl font-bold text-white shadow-lg hover:opacity-90 transition transform hover:scale-[1.02]" style="background-color: {{ settings.primary_color }};">
                     {{ settings.checkout_label | default: 'Checkout' }}
                   </button>
                </form>
                
                <div class="bg-slate-50 rounded-lg p-4 text-center">
                   <p class="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Guaranteed Safe Checkout</p>
                   <div class="flex justify-center gap-2 opacity-60 grayscale">
                      {% for type in shop.enabled_payment_types %}
                        {{ type | payment_type_svg_tag: class: 'h-6' }}
                      {% endfor %}
                   </div>
                </div>
                
                <div class="text-center space-y-2 text-sm text-slate-500">
                   <p>{{ section.settings.secure_line }}</p>
                   <p>{{ section.settings.returns_line }}</p>
                </div>
              </div>
           </div>
        </div>

      </div>
    {% else %}
      <div class="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div class="text-6xl mb-6">🛒</div>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">{{ section.settings.empty_headline }}</h2>
        <p class="text-slate-500 mb-8">{{ section.settings.empty_subheadline }}</p>
        <a href="{{ routes.root_url }}" class="inline-block px-8 py-3 rounded-full bg-slate-900 text-white font-bold hover:opacity-90 transition">{{ settings.start_shopping_label }}</a>
      </div>
    {% endif %}
  </div>
</div>
{% schema %}
${JSON.stringify(mainCartSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-cart.liquid', mainCartLiquid)

  const cartJson = {
    "sections": {
      "main": { "type": "main-cart" }
    },
    "order": ["main"]
  }
  zip.folder('templates')?.file('cart.json', JSON.stringify(cartJson, null, 2))

  // ==========================================
  // 7. MISSING STANDARD TEMPLATES (404, Page, Search, Blog)
  // ==========================================

  // 7.1 404 Page
  const main404Schema = {
    name: "404 Page",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Page Not Found" },
      { type: "text", id: "subtext", label: "Subtext", default: "The page you were looking for does not exist." }
    ]
  }
  const main404Liquid = `
<div class="py-20 bg-white text-center">
  <div class="container mx-auto px-6">
    <h1 class="text-6xl font-extrabold text-slate-900 mb-6">{{ section.settings.heading }}</h1>
    <p class="text-xl text-slate-600 mb-8">{{ section.settings.subtext }}</p>
    <a href="{{ routes.root_url }}" class="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-bold text-white shadow-lg transition hover:opacity-90" style="background-color: {{ settings.primary_color }};">
      {{ settings.start_shopping_label }}
    </a>
  </div>
</div>
{% schema %}
${JSON.stringify(main404Schema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-404.liquid', main404Liquid)
  zip.folder('templates')?.file('404.json', JSON.stringify({ sections: { main: { type: "main-404" } }, order: ["main"] }, null, 2))

  // 7.2.1 About Page — AI-generated content throughout
  const aboutTimelineContent = (content.timeline || []).length >= 2 ? content.timeline! : [
    { year: "Year 1", title: "The Idea", text: "The seed was planted." },
    { year: "Year 2", title: "Built with Purpose", text: "We turned the concept into reality." },
    { year: "Year 3", title: "Growing Together", text: "Thousands of happy customers worldwide." }
  ]
  const aboutTimelineBlocks = Object.fromEntries(
    aboutTimelineContent.map((t, i) => [`abt${i + 1}`, { type: 'milestone', settings: { year: t.year, title: t.title, text: t.text } }])
  )
  const aboutHowItWorksBlocks = Object.fromEntries(
    (content.how_it_works || []).map((s, i) => [`abthiw${i + 1}`, { type: 'step', settings: { title: s.title, text: s.text } }])
  )
  const aboutTestimonialBlocks = Object.fromEntries(
    (content.testimonials || []).map((t, i) => [`abtr${i + 1}`, { type: 'testimonial', settings: { name: t.name, text: t.text, location: t.location, stars: t.rating } }])
  )
  const aboutValueBlocks = Object.fromEntries(
    (content.multicolumn || []).map((m, i) => [`abtm${i + 1}`, { type: 'column', settings: { title: m.title, text: m.text } }])
  )

  const aboutJson = {
    "sections": {
      "hero": { "type": "zenya-hero", "settings": { "headline": content.pages?.about?.hero_heading || "Our Story", "subheadline": content.pages?.about?.hero_subheading || "Built on passion, delivered with care." } },
      "rich_text": { "type": "zenya-rich-text", "settings": { "title": content.pages?.about?.mission_title || "Our Mission", "text": content.pages?.about?.mission_text || "We exist to create products that solve real problems." } },
      "values": {
        "type": "zenya-multicolumn",
        "settings": { "title": content.pages?.about?.craftsmanship_heading || "What We Stand For" },
        "blocks": aboutValueBlocks,
        "block_order": Object.keys(aboutValueBlocks)
      },
      "how_it_works": {
        "type": "zenya-how-it-works",
        "settings": { "heading": content.pages?.about?.process_heading || "Our Process", "subheading": content.pages?.about?.process_subheading || "Thoughtful design. Quality delivery." },
        "blocks": aboutHowItWorksBlocks,
        "block_order": Object.keys(aboutHowItWorksBlocks)
      },
      "timeline": {
        "type": "zenya-timeline",
        "blocks": aboutTimelineBlocks,
        "block_order": Object.keys(aboutTimelineBlocks)
      },
      "testimonials": {
        "type": "zenya-testimonials",
        "settings": { "title": "What Our Customers Say" },
        "blocks": aboutTestimonialBlocks,
        "block_order": Object.keys(aboutTestimonialBlocks)
      },
      "stats": { "type": "zenya-stats" },
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "title": content.newsletter?.title || "Stay in the Loop",
          "text": content.newsletter?.text || "Get exclusive updates and early access."
        }
      }
    },
    "order": ["hero", "rich_text", "values", "how_it_works", "timeline", "testimonials", "stats", "newsletter"]
  }
  zip.folder('templates')?.file('page.about.json', JSON.stringify(aboutJson, null, 2))

  // 7.2.2 Contact Page — AI-generated FAQ items
  const contactFaqItems = (content.pages?.contact?.faq_items || []).length >= 2
    ? content.pages!.contact!.faq_items!
    : [
        { q: "How fast is shipping?", a: content.faq?.find(f => /ship/i.test(f.q))?.a || "Most orders ship within 24-48 hours with tracking." },
        { q: "What is your return policy?", a: content.guarantee?.text || "30-day hassle-free returns. No questions asked." }
      ]
  const contactFaqBlocks = Object.fromEntries(
    contactFaqItems.map((q, i) => [`cfq${i + 1}`, { type: 'item', settings: { title: q.q, text: `<p>${q.a}</p>` } }])
  )

  const contactJson = {
    "sections": {
      "intro": {
        "type": "zenya-rich-text",
        "settings": {
          "title": content.contact?.heading || "Get in Touch",
          "text": content.contact?.subheading || "We'd love to hear from you. Our team is here to help."
        }
      },
      "contact_form": { "type": "zenya-contact" },
      "faq": {
        "type": "zenya-accordion",
        "settings": { "title": content.pages?.contact?.faq_heading || "Common Questions" },
        "blocks": contactFaqBlocks,
        "block_order": Object.keys(contactFaqBlocks)
      }
    },
    "order": ["intro", "contact_form", "faq"]
  }
  zip.folder('templates')?.file('page.contact.json', JSON.stringify(contactJson, null, 2))

  // 7.2.3 FAQ Page — all AI-generated FAQ items
  const faqPageItems = [
    ...(content.pages?.faq?.items || []),
    ...(content.faq || [])
  ].filter((v, i, arr) => arr.findIndex(x => x.q === v.q) === i).slice(0, 8)

  const faqPageBlocks = Object.fromEntries(
    faqPageItems.map((q, i) => [`fpi${i + 1}`, { type: 'item', settings: { title: q.q, text: `<p>${q.a}</p>` } }])
  )

  const faqJson = {
    "sections": {
      "main": { "type": "main-page" },
      "intro": { "type": "zenya-rich-text", "settings": { "title": content.pages?.faq?.title || "Help Center", "text": content.pages?.faq?.intro || "Find the answers you need below." } },
      "accordion": {
        "type": "zenya-accordion",
        "blocks": faqPageBlocks,
        "block_order": Object.keys(faqPageBlocks)
      },
      "contact": { "type": "zenya-contact" }
    },
    "order": ["main", "intro", "accordion", "contact"]
  }
  zip.folder('templates')?.file('page.faq.json', JSON.stringify(faqJson, null, 2))

  // 7.2.4 Shipping & Returns Pages (template-only content)
  const shippingPolicyJson = {
    "sections": {
      "main": { "type": "main-page" },
      "policy": {
        "type": "zenya-accordion",
        "settings": { "title": content.policies?.shipping?.title || "Shipping Policy" },
        "blocks": (content.policies?.shipping?.bullets || ["Fast processing", "Tracked delivery", "Support if anything goes wrong"]).reduce((acc: any, t: string, i: number) => {
          acc[`b${i + 1}`] = { "type": "item", "settings": { "title": `•`, "text": `<p>${t}</p>` } }
          return acc
        }, {}),
        "block_order": (content.policies?.shipping?.bullets || ["Fast processing", "Tracked delivery", "Support if anything goes wrong"]).map((_: any, i: number) => `b${i + 1}`)
      }
    },
    "order": ["main", "policy"]
  }
  zip.folder('templates')?.file('page.shipping.json', JSON.stringify(shippingPolicyJson, null, 2))

  const returnsPolicyJson = {
    "sections": {
      "main": { "type": "main-page" },
      "policy": {
        "type": "zenya-accordion",
        "settings": { "title": content.policies?.returns?.title || "Returns & Refunds" },
        "blocks": (content.policies?.returns?.bullets || ["30-day returns", "Simple process", "Fast help from support"]).reduce((acc: any, t: string, i: number) => {
          acc[`b${i + 1}`] = { "type": "item", "settings": { "title": `•`, "text": `<p>${t}</p>` } }
          return acc
        }, {}),
        "block_order": (content.policies?.returns?.bullets || ["30-day returns", "Simple process", "Fast help from support"]).map((_: any, i: number) => `b${i + 1}`)
      }
    },
    "order": ["main", "policy"]
  }
  zip.folder('templates')?.file('page.returns.json', JSON.stringify(returnsPolicyJson, null, 2))

  // 7.6 List Collections Page
  const mainListCollectionsSchema = {
    name: "Collections List",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "All Collections" }
    ]
  }
  const mainListCollectionsLiquid = `
<div class="py-12 bg-white">
  <div class="container mx-auto px-6">
    <h1 class="text-4xl font-extrabold text-slate-900 mb-12 text-center">{{ section.settings.title }}</h1>
    <div class="grid md:grid-cols-3 gap-8">
      {% for collection in collections %}
        <a href="{{ collection.url }}" class="group block">
          <div class="aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-4 relative">
            {% if collection.image %}
              <img src="{{ collection.image | image_url: width: 600 }}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="{{ collection.title }}">
            {% elsif collection.products.first.featured_image %}
              <img src="{{ collection.products.first.featured_image | image_url: width: 600 }}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="{{ collection.title }}">
            {% endif %}
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-1 group-hover:text-primary transition">{{ collection.title }}</h2>
          <p class="text-slate-500">{{ collection.all_products_count }} products</p>
        </a>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(mainListCollectionsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-list-collections.liquid', mainListCollectionsLiquid)
  zip.folder('templates')?.file('list-collections.json', JSON.stringify({ sections: { main: { type: "main-list-collections" } }, order: ["main"] }, null, 2))

  // 7.7 Password Page
  const mainPasswordSchema = {
    name: "Password Page",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Coming Soon" },
      { type: "textarea", id: "text", label: "Text", default: "We are launching soon. Stay tuned." }
    ]
  }
  const mainPasswordLiquid = `
<div class="min-h-screen flex items-center justify-center bg-slate-900 text-white text-center p-6">
  <div class="max-w-md">
    <h1 class="text-5xl font-extrabold mb-6">{{ section.settings.heading }}</h1>
    <p class="text-xl text-slate-300 mb-8">{{ section.settings.text }}</p>
    {% form 'storefront_password' %}
      {{ form.errors | default_errors }}
      <div class="flex gap-2">
        <input type="password" name="password" placeholder="Enter store password" class="flex-1 px-4 py-3 rounded-lg text-slate-900 focus:outline-none">
        <button type="submit" class="px-6 py-3 rounded-lg font-bold bg-primary text-white hover:opacity-90 transition">Enter</button>
      </div>
    {% endform %}
  </div>
</div>
{% schema %}
${JSON.stringify(mainPasswordSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-password.liquid', mainPasswordLiquid)
  zip.folder('templates')?.file('password.json', JSON.stringify({ sections: { main: { type: "main-password" } }, order: ["main"] }, null, 2))

  // 7.8 Customers (Login, Register, Account, etc.)
  
  // Login
  const mainLoginLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-md">
    <div x-data="{ recover: false }">
      <div x-show="!recover">
        <h1 class="text-3xl font-extrabold text-slate-900 mb-8 text-center">Login</h1>
        {% form 'customer_login' %}
          {{ form.errors | default_errors }}
          <div class="space-y-4">
            <input type="email" name="customer[email]" placeholder="Email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
            <input type="password" name="customer[password]" placeholder="Password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
            <button type="submit" class="w-full py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">Sign In</button>
          </div>
          <div class="mt-6 text-center text-sm text-slate-500">
            <button @click="recover = true" type="button" class="underline hover:text-primary">Forgot your password?</button>
            <span class="mx-2">•</span>
            <a href="{{ routes.account_register_url }}" class="underline hover:text-primary">Create account</a>
          </div>
        {% endform %}
      </div>

      <div x-show="recover" x-cloak>
        <h1 class="text-3xl font-extrabold text-slate-900 mb-2 text-center">Reset Password</h1>
        <p class="text-center text-slate-500 mb-8">We will send you an email to reset your password.</p>
        {% form 'recover_customer_password' %}
          {{ form.errors | default_errors }}
          <div class="space-y-4">
            <input type="email" name="email" placeholder="Email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
            <button type="submit" class="w-full py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">Submit</button>
            <button @click="recover = false" type="button" class="w-full py-3 text-slate-500 font-bold hover:text-slate-900">Cancel</button>
          </div>
        {% endform %}
      </div>
    </div>
  </div>
</div>
{% schema %}
{ "name": "Login", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-login.liquid', mainLoginLiquid)
  zip.folder('templates')?.folder('customers')?.file('login.json', JSON.stringify({ sections: { main: { type: "main-login" } }, order: ["main"] }, null, 2))

  // Register
  const mainRegisterLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-md">
    <h1 class="text-3xl font-extrabold text-slate-900 mb-8 text-center">Create Account</h1>
    {% form 'create_customer' %}
      {{ form.errors | default_errors }}
      <div class="space-y-4">
        <input type="text" name="customer[first_name]" placeholder="First Name" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <input type="text" name="customer[last_name]" placeholder="Last Name" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <input type="email" name="customer[email]" placeholder="Email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <input type="password" name="customer[password]" placeholder="Password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <button type="submit" class="w-full py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">Create</button>
      </div>
      <div class="mt-6 text-center text-sm text-slate-500">
        <a href="{{ routes.account_login_url }}" class="underline hover:text-primary">Already have an account? Login</a>
      </div>
    {% endform %}
  </div>
</div>
{% schema %}
{ "name": "Register", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-register.liquid', mainRegisterLiquid)
  zip.folder('templates')?.folder('customers')?.file('register.json', JSON.stringify({ sections: { main: { type: "main-register" } }, order: ["main"] }, null, 2))

  // Account
  const mainAccountLiquid = `
<div class="py-16 bg-slate-50">
  <div class="container mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
      <h1 class="text-3xl font-extrabold text-slate-900">My Account</h1>
      <a href="{{ routes.account_logout_url }}" class="text-sm font-bold text-red-500 hover:text-red-700">Log out</a>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Order History -->
      <div class="md:col-span-2 bg-white rounded-2xl p-8 shadow-sm">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Order History</h2>
        {% paginate customer.orders by 20 %}
          {% if customer.orders.size > 0 %}
            <div class="space-y-4">
              {% for order in customer.orders %}
                <div class="flex flex-wrap items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                  <div>
                    <div class="font-bold text-slate-900">{{ order.name }}</div>
                    <div class="text-sm text-slate-500">{{ order.created_at | date: "%B %d, %Y" }}</div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{{ order.financial_status_label }}</span>
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{{ order.fulfillment_status_label }}</span>
                    <span class="font-bold text-slate-900">{{ order.total_price | money }}</span>
                    <a href="{{ order.customer_url }}" class="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:opacity-90">View</a>
                  </div>
                </div>
              {% endfor %}
            </div>
            {% if paginate.pages > 1 %}
              <div class="mt-8 text-center">{{ paginate | default_pagination }}</div>
            {% endif %}
          {% else %}
            <p class="text-slate-500">You haven't placed any orders yet.</p>
          {% endif %}
        {% endpaginate %}
      </div>

      <!-- Account Details -->
      <div class="bg-white rounded-2xl p-8 shadow-sm h-fit">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Account Details</h2>
        <div class="text-slate-600 mb-6">
          {{ customer.default_address | format_address }}
        </div>
        <a href="{{ routes.account_addresses_url }}" class="inline-block px-6 py-2 rounded-lg bg-slate-100 text-slate-900 font-bold text-sm hover:bg-slate-200 transition">View Addresses ({{ customer.addresses_count }})</a>
      </div>
    </div>
  </div>
</div>
{% schema %}
{ "name": "Account", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-account.liquid', mainAccountLiquid)
  zip.folder('templates')?.folder('customers')?.file('account.json', JSON.stringify({ sections: { main: { type: "main-account" } }, order: ["main"] }, null, 2))

  // Addresses
  const mainAddressesLiquid = `
<div class="py-16 bg-slate-50" x-data="{ newAddress: false }">
  <div class="container mx-auto px-6 max-w-4xl">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-extrabold text-slate-900">Addresses</h1>
      <div class="flex gap-4">
        <a href="{{ routes.account_url }}" class="text-slate-500 hover:text-slate-900 font-bold">Back to Account</a>
        <button @click="newAddress = !newAddress" class="px-6 py-2 rounded-full bg-primary text-white font-bold hover:opacity-90">Add New</button>
      </div>
    </div>

    <!-- Add New Form -->
    <div x-show="newAddress" class="bg-white rounded-2xl p-8 shadow-sm mb-8" x-cloak>
      <h2 class="text-xl font-bold mb-6">Add a New Address</h2>
      {% form 'customer_address', customer.new_address %}
        <div class="grid md:grid-cols-2 gap-4 mb-4">
          <input type="text" name="address[first_name]" value="{{ form.first_name }}" placeholder="First Name" class="px-4 py-3 rounded-lg border border-slate-300">
          <input type="text" name="address[last_name]" value="{{ form.last_name }}" placeholder="Last Name" class="px-4 py-3 rounded-lg border border-slate-300">
        </div>
        <input type="text" name="address[company]" value="{{ form.company }}" placeholder="Company" class="w-full px-4 py-3 rounded-lg border border-slate-300 mb-4">
        <input type="text" name="address[address1]" value="{{ form.address1 }}" placeholder="Address 1" class="w-full px-4 py-3 rounded-lg border border-slate-300 mb-4">
        <input type="text" name="address[address2]" value="{{ form.address2 }}" placeholder="Address 2" class="w-full px-4 py-3 rounded-lg border border-slate-300 mb-4">
        <div class="grid md:grid-cols-2 gap-4 mb-4">
          <input type="text" name="address[city]" value="{{ form.city }}" placeholder="City" class="px-4 py-3 rounded-lg border border-slate-300">
          <input type="text" name="address[country]" value="{{ form.country }}" placeholder="Country" class="px-4 py-3 rounded-lg border border-slate-300">
        </div>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <input type="text" name="address[zip]" value="{{ form.zip }}" placeholder="Zip/Postal Code" class="px-4 py-3 rounded-lg border border-slate-300">
          <input type="text" name="address[phone]" value="{{ form.phone }}" placeholder="Phone" class="px-4 py-3 rounded-lg border border-slate-300">
        </div>
        <div class="flex items-center gap-2 mb-6">
          {{ form.set_as_default_checkbox }}
          <label for="address_default_address_new">Set as default address</label>
        </div>
        <div class="flex gap-4">
          <button type="submit" class="px-8 py-3 rounded-lg bg-slate-900 text-white font-bold">Add Address</button>
          <button @click="newAddress = false" type="button" class="px-8 py-3 rounded-lg text-slate-500 font-bold">Cancel</button>
        </div>
      {% endform %}
    </div>

    <!-- List -->
    <div class="grid md:grid-cols-2 gap-6">
      {% for address in customer.addresses %}
        <div class="bg-white rounded-2xl p-8 shadow-sm relative">
          {% if address == customer.default_address %}
            <span class="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Default</span>
          {% endif %}
          <div class="text-slate-600 leading-relaxed mb-6">
            {{ address | format_address }}
          </div>
          <div class="flex gap-4">
            <form method="post" action="{{ routes.account_addresses_url }}/{{ address.id }}">
              <input type="hidden" name="_method" value="delete">
              <button type="submit" class="text-red-500 font-bold text-sm hover:underline">Delete</button>
            </form>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
{ "name": "Addresses", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-addresses.liquid', mainAddressesLiquid)
  zip.folder('templates')?.folder('customers')?.file('addresses.json', JSON.stringify({ sections: { main: { type: "main-addresses" } }, order: ["main"] }, null, 2))

  // Order
  const mainOrderLiquid = `
<div class="py-16 bg-white">
  <div class="container mx-auto px-6 max-w-4xl">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 mb-2">Order {{ order.name }}</h1>
        <p class="text-slate-500">{{ order.created_at | date: "%B %d, %Y at %I:%M%p" }}</p>
      </div>
      <a href="{{ routes.account_url }}" class="text-slate-500 hover:text-slate-900 font-bold">Back to Account</a>
    </div>

    <div class="grid md:grid-cols-3 gap-12">
      <div class="md:col-span-2 space-y-8">
        <div class="bg-slate-50 rounded-2xl p-6">
          {% for line_item in order.line_items %}
            <div class="flex items-center gap-6 py-4 border-b border-slate-200 last:border-0">
              {% if line_item.image %}
                <img src="{{ line_item.image | image_url: width: 100 }}" class="w-16 h-16 object-cover rounded-lg bg-white" alt="{{ line_item.title }}">
              {% endif %}
              <div class="flex-1">
                <div class="font-bold text-slate-900">{{ line_item.title }}</div>
                <div class="text-sm text-slate-500">{{ line_item.variant.title }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-slate-900">{{ line_item.final_line_price | money }}</div>
                <div class="text-xs text-slate-500">Qty: {{ line_item.quantity }}</div>
              </div>
            </div>
          {% endfor %}
        </div>
        
        <div class="space-y-2 text-right">
          <div class="flex justify-between">
            <span class="text-slate-500">Subtotal</span>
            <span class="font-bold text-slate-900">{{ order.line_items_subtotal_price | money }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Shipping ({{ order.shipping_methods.first.title }})</span>
            <span class="font-bold text-slate-900">{{ order.shipping_price | money }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tax</span>
            <span class="font-bold text-slate-900">{{ order.tax_price | money }}</span>
          </div>
          <div class="flex justify-between pt-4 border-t border-slate-100">
            <span class="text-xl font-bold text-slate-900">Total</span>
            <span class="text-xl font-extrabold text-primary">{{ order.total_price | money }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <div>
          <h3 class="font-bold text-slate-900 mb-2">Billing Address</h3>
          <div class="text-slate-600 text-sm leading-relaxed">
            <p>{{ order.billing_address.name }}</p>
            <p>{{ order.billing_address.company }}</p>
            <p>{{ order.billing_address.street }}</p>
            <p>{{ order.billing_address.city }}, {{ order.billing_address.province }}</p>
            <p>{{ order.billing_address.country }} {{ order.billing_address.zip }}</p>
          </div>
        </div>
        <div>
          <h3 class="font-bold text-slate-900 mb-2">Shipping Address</h3>
          <div class="text-slate-600 text-sm leading-relaxed">
            <p>{{ order.shipping_address.name }}</p>
            <p>{{ order.shipping_address.company }}</p>
            <p>{{ order.shipping_address.street }}</p>
            <p>{{ order.shipping_address.city }}, {{ order.shipping_address.province }}</p>
            <p>{{ order.shipping_address.country }} {{ order.shipping_address.zip }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{% schema %}
{ "name": "Order", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-order.liquid', mainOrderLiquid)
  zip.folder('templates')?.folder('customers')?.file('order.json', JSON.stringify({ sections: { main: { type: "main-order" } }, order: ["main"] }, null, 2))




  // Activate Account
  const mainActivateAccountLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-md">
    <h1 class="text-3xl font-extrabold text-slate-900 mb-4 text-center">Activate Account</h1>
    <p class="text-center text-slate-500 mb-8">Create your password to activate your account.</p>
    {% form 'activate_customer_password' %}
      {{ form.errors | default_errors }}
      <div class="space-y-4">
        <input type="password" name="customer[password]" placeholder="Password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <input type="password" name="customer[password_confirmation]" placeholder="Confirm Password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <div class="flex gap-4">
          <button type="submit" class="flex-1 py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">Activate Account</button>
          <button type="submit" name="decline" class="flex-1 py-3 rounded-full font-bold text-slate-500 hover:text-slate-900 transition">Decline</button>
        </div>
      </div>
    {% endform %}
  </div>
</div>
{% schema %}
{ "name": "Activate Account", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-activate-account.liquid', mainActivateAccountLiquid)
  zip.folder('templates')?.folder('customers')?.file('activate_account.json', JSON.stringify({ sections: { main: { type: "main-activate-account" } }, order: ["main"] }, null, 2))

  // Reset Password
  const mainResetPasswordLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-md">
    <h1 class="text-3xl font-extrabold text-slate-900 mb-4 text-center">Reset Password</h1>
    <p class="text-center text-slate-500 mb-8">Enter a new password for your account</p>
    {% form 'reset_customer_password' %}
      {{ form.errors | default_errors }}
      <div class="space-y-4">
        <input type="password" name="customer[password]" placeholder="Password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <input type="password" name="customer[password_confirmation]" placeholder="Confirm Password" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <button type="submit" class="w-full py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">Reset Password</button>
      </div>
    {% endform %}
  </div>
</div>
{% schema %}
{ "name": "Reset Password", "settings": [] }
{% endschema %}
  `
  zip.folder('sections')?.file('main-reset-password.liquid', mainResetPasswordLiquid)
  zip.folder('templates')?.folder('customers')?.file('reset_password.json', JSON.stringify({ sections: { main: { type: "main-reset-password" } }, order: ["main"] }, null, 2))

  
  // 4.1 Rich Text Section
  const richTextSchema = {
    name: "Rich Text",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Our Brand Story" },
      { type: "textarea", id: "text", label: "Text", default: "Share information about your brand with your customers. Describe a product, make announcements, or welcome customers to your store." },
      { type: "select", id: "align", label: "Alignment", options: [{value: "left", label: "Left"}, {value: "center", label: "Center"}], default: "center" }
    ],
    presets: [{ name: "Zenya Rich Text" }]
  }
  const richTextLiquid = `
<div class="py-16 bg-white">
  <div class="container mx-auto px-6 max-w-4xl" style="text-align: {{ section.settings.align }}">
    <h2 class="text-3xl font-bold text-slate-900 mb-6">{{ section.settings.title }}</h2>
    <div class="text-lg text-slate-600 leading-relaxed prose prose-slate">
      {{ section.settings.text }}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(richTextSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-rich-text.liquid', richTextLiquid)

  // 4.2 Image with Text Section
  const imageTextSchema = {
    name: "Image with Text",
    settings: [
      { type: "image_picker", id: "image", label: "Image" },
      { type: "text", id: "title", label: "Heading", default: "Image with text" },
      { type: "textarea", id: "text", label: "Text", default: "Pair text with an image to focus on your chosen product, collection, or blog post." },
      { type: "text", id: "cta_text", label: "Button Label", default: "Learn More" },
      { type: "url", id: "cta_url", label: "Button Link" },
      { type: "select", id: "layout", label: "Image Position", options: [{value: "left", label: "Left"}, {value: "right", label: "Right"}], default: "left" }
    ],
    presets: [{ name: "Zenya Image with Text" }]
  }
  const imageTextLiquid = `
<div class="py-20 bg-slate-50">
  <div class="container mx-auto px-6">
    <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
      <div class="w-full lg:w-1/2 {% if section.settings.layout == 'right' %}lg:order-2{% endif %}">
        {% if section.settings.image != blank %}
          <img 
            src="{{ section.settings.image | image_url: width: 800 }}" 
            width="{{ section.settings.image.width }}"
            height="{{ section.settings.image.height }}"
            alt="{{ section.settings.title }}" 
            class="w-full rounded-2xl shadow-xl">
        {% else %}
          {{ 'image' | placeholder_svg_tag: 'w-full rounded-2xl bg-slate-200' }}
        {% endif %}
      </div>
      <div class="w-full lg:w-1/2 space-y-6">
        <h2 class="text-3xl lg:text-4xl font-bold text-slate-900">{{ section.settings.title }}</h2>
        <p class="text-lg text-slate-600 leading-relaxed">{{ section.settings.text }}</p>
        {% if section.settings.cta_text != blank %}
          <a href="{{ section.settings.cta_url | default: routes.all_products_collection_url }}" class="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-bold text-white shadow-lg transition hover:opacity-90" style="background-color: {{ settings.primary_color }};">
            {{ section.settings.cta_text }}
          </a>
        {% endif %}
      </div>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(imageTextSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-image-text.liquid', imageTextLiquid)

  // 4.3 Newsletter Section
  const newsletterSchema = {
    name: "Newsletter",
    settings: [
      { type: "text", id: "title", label: "Heading", default: content.newsletter?.title || "Join the list" },
      { type: "textarea", id: "text", label: "Subtext", default: content.newsletter?.text || "Get launches, deals, and tips. No spam." },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "text", id: "button_label", label: "Button Label", default: "Subscribe" },
      { type: "text", id: "email_placeholder", label: "Email Placeholder", default: "Email address" }
    ],
    presets: [{ name: "Zenya Newsletter" }]
  }
  const newsletterLiquid = `
<div class="relative overflow-hidden py-24 text-center bg-slate-900 text-white">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.primary_color }}, transparent 70%); opacity: .16; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.secondary_color }}, transparent 70%); opacity: .16; animation-duration: {{ 24 | minus: settings.motion_strength | at_least: 12 }}s;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 max-w-2xl relative">
    <h2 class="text-3xl font-extrabold mb-4">{{ section.settings.title }}</h2>
    <p class="text-slate-300 mb-8">{{ section.settings.text }}</p>
    {% form 'customer', class: 'flex flex-col sm:flex-row gap-4' %}
      <input type="hidden" name="contact[tags]" value="newsletter">
      <input type="email" name="contact[email]" placeholder="{{ section.settings.email_placeholder }}" required class="flex-1 px-6 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary">
      <button type="submit" class="px-8 py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">
        {{ section.settings.button_label }}
      </button>
    {% endform %}
  </div>
</div>
{% schema %}
${JSON.stringify(newsletterSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-newsletter.liquid', newsletterLiquid)

  // 4.4 Logo List Section
  const logoListSchema = {
    name: "Logo List",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "As Seen In" }
    ],
    blocks: [
      {
        type: "logo",
        name: "Logo",
        settings: [
          { type: "image_picker", id: "image", label: "Logo Image" }
        ]
      }
    ],
    presets: [{ name: "Zenya Logo List" }]
  }
  const logoListLiquid = `
<div class="py-12 border-y border-slate-100 bg-white">
  <div class="container mx-auto px-6 text-center">
    <h3 class="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">{{ section.settings.title }}</h3>
    <div class="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
      {% for block in section.blocks %}
        {% if block.settings.image != blank %}
          <img 
            src="{{ block.settings.image | image_url: width: 200 }}" 
            width="{{ block.settings.image.width }}"
            height="{{ block.settings.image.height }}"
            alt="Brand Logo" 
            class="h-8 lg:h-10 w-auto object-contain">
        {% else %}
           <div class="h-10 w-32 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-400 font-bold">LOGO</div>
        {% endif %}
      {% endfor %}
      {% if section.blocks.size == 0 %}
        <!-- Demo Logos -->
        <div class="h-8 font-serif text-xl italic font-bold text-slate-400">Forbes</div>
        <div class="h-8 font-sans text-xl font-black text-slate-400">WIRED</div>
        <div class="h-8 font-serif text-xl font-bold text-slate-400">Vogue</div>
        <div class="h-8 font-mono text-xl font-bold text-slate-400">TechCrunch</div>
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(logoListSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-logo-list.liquid', logoListLiquid)

  // 4.5 Featured Collection
  const featuredCollectionSchema = {
    name: "Featured Collection",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Best Sellers" },
      { type: "collection", id: "collection", label: "Collection" },
      { type: "range", id: "limit", label: "Products to Show", min: 4, max: 12, step: 4, default: 4 }
    ],
    presets: [{ name: "Zenya Featured Collection" }]
  }
  const featuredCollectionLiquid = `
<div class="py-20 bg-white">
  <div class="container mx-auto px-6">
    <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">{{ section.settings.title }}</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
      {% assign collection = collections[section.settings.collection] %}
      {% if collection != blank %}
        {% for product in collection.products limit: section.settings.limit %}
          <a href="{{ product.url }}" class="group block">
            <div class="relative aspect-[1/1] overflow-hidden rounded-xl bg-slate-100 mb-4">
              <img 
                src="{{ product.featured_image | image_url: width: 600 }}" 
                width="{{ product.featured_image.width }}" 
                height="{{ product.featured_image.height }}"
                alt="{{ product.title }}" 
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
              {% if product.compare_at_price > product.price %}
                <div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">SALE</div>
              {% endif %}
            </div>
            <h3 class="font-bold text-slate-900 group-hover:text-primary transition">{{ product.title }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="font-bold text-slate-900">{{ product.price | money }}</span>
              {% if product.compare_at_price > product.price %}
                <span class="text-sm text-slate-400 line-through">{{ product.compare_at_price | money }}</span>
              {% endif %}
            </div>
          </a>
        {% endfor %}
      {% else %}
        <!-- Demo Products -->
        {% for i in (1..4) %}
          <a href="{{ routes.all_products_collection_url }}" class="group block">
            <div class="aspect-[1/1] rounded-xl bg-slate-100 mb-4 overflow-hidden">
               {{ 'product-' | append: i | placeholder_svg_tag: 'h-full w-full object-cover opacity-50' }}
            </div>
            <h3 class="font-bold text-slate-900">Demo Product {{ i }}</h3>
            <div class="font-bold text-slate-900">$49.99</div>
          </a>
        {% endfor %}
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(featuredCollectionSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-featured-collection.liquid', featuredCollectionLiquid)

  // 4.6 Video Section
  const videoSchema = {
    name: "Video",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Watch Our Story" },
      { type: "image_picker", id: "cover", label: "Cover Image" },
      { type: "video_url", id: "video_url", label: "Video URL", accept: ["youtube", "vimeo"], default: "https://www.youtube.com/watch?v=_9VUPq3SxOc" }
    ],
    presets: [{ name: "Zenya Video" }]
  }
  const videoLiquid = `
<div class="py-24 bg-slate-900 text-white">
  <div class="container mx-auto px-6 text-center">
    <h2 class="text-3xl font-bold mb-12">{{ section.settings.heading }}</h2>
    <div class="relative w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black">
      {% if section.settings.video_url.type == 'youtube' %}
        <iframe src="https://www.youtube.com/embed/{{ section.settings.video_url.id }}?enablejsapi=1" class="absolute inset-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      {% elsif section.settings.video_url.type == 'vimeo' %}
        <iframe src="https://player.vimeo.com/video/{{ section.settings.video_url.id }}" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
      {% else %}
        <div class="flex items-center justify-center h-full text-slate-500">
          Video placeholder (Select a YouTube or Vimeo URL)
        </div>
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(videoSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-video.liquid', videoLiquid)

  // 4.7 Collection List
  const collectionListSchema = {
    name: "Collection List",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Shop by Category" }
    ],
    blocks: [
      {
        type: "collection",
        name: "Collection",
        settings: [
          { type: "collection", id: "collection", label: "Collection" }
        ]
      }
    ],
    presets: [{ name: "Zenya Collection List" }]
  }
  const collectionListLiquid = `
<div class="py-20 bg-slate-50">
  <div class="container mx-auto px-6">
    <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">{{ section.settings.title }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {% for block in section.blocks %}
        {% assign collection = collections[block.settings.collection] %}
        <a href="{{ collection.url | default: routes.all_products_collection_url }}" class="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg block">
          {% if collection.image != blank %}
            <img 
              src="{{ collection.image | image_url: width: 800 }}" 
              width="{{ collection.image.width }}"
              height="{{ collection.image.height }}"
              alt="{{ collection.title }}" 
              class="h-full w-full object-cover transition duration-500 group-hover:scale-110">
          {% else %}
             {{ 'collection-' | append: forloop.index | placeholder_svg_tag: 'h-full w-full object-cover bg-slate-200 transition duration-500 group-hover:scale-110' }}
          {% endif %}
          <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <h3 class="text-2xl font-bold text-white tracking-wide border-b-2 border-white/0 group-hover:border-white transition-all pb-1">
              {{ collection.title | default: "Collection Name" }}
            </h3>
          </div>
        </a>
      {% endfor %}
      {% if section.blocks.size == 0 %}
         {% for i in (1..3) %}
            <a href="{{ routes.all_products_collection_url }}" class="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg block bg-slate-200">
               <div class="absolute inset-0 flex items-center justify-center">
                  <h3 class="text-2xl font-bold text-slate-400">Category {{ i }}</h3>
               </div>
            </a>
         {% endfor %}
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(collectionListSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-collection-list.liquid', collectionListLiquid)

  // 4.8 Contact Form
  const contactFormSchema = {
    name: "Contact Form",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Get in Touch" },
      { type: "textarea", id: "text", label: "Text", default: "Have a question? We're here to help." }
    ],
    presets: [{ name: "Zenya Contact Form" }]
  }
  const contactFormLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-2xl">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-slate-900 mb-4">{{ section.settings.title }}</h2>
      <p class="text-slate-600">{{ section.settings.text }}</p>
    </div>
    {% form 'contact', class: 'space-y-6' %}
      {% if form.posted_successfully? %}
        <div class="p-4 bg-green-50 text-green-700 rounded-lg text-center font-bold">Thanks for contacting us! We'll get back to you shortly.</div>
      {% elsif form.errors %}
        <div class="p-4 bg-red-50 text-red-700 rounded-lg text-center font-bold">Please check the form for errors.</div>
      {% endif %}
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="ContactFormName" class="text-sm font-bold text-slate-700">Name</label>
          <input type="text" id="ContactFormName" name="contact[name]" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition" placeholder="Your Name" required>
        </div>
        <div class="space-y-2">
          <label for="ContactFormEmail" class="text-sm font-bold text-slate-700">Email</label>
          <input type="email" id="ContactFormEmail" name="contact[email]" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition" placeholder="email@example.com" required>
        </div>
      </div>
      <div class="space-y-2">
        <label for="ContactFormMessage" class="text-sm font-bold text-slate-700">Message</label>
        <textarea rows="5" id="ContactFormMessage" name="contact[body]" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition" placeholder="How can we help?" required></textarea>
      </div>
      <button type="submit" class="w-full py-4 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition transform active:scale-95" style="background-color: {{ settings.primary_color }};">
        Send Message
      </button>
    {% endform %}
  </div>
</div>
{% schema %}
${JSON.stringify(contactFormSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-contact.liquid', contactFormLiquid)

  // Duplicates removed (Timeline, Multicolumn, Map, Accordion, VideoHero, Slideshow, ScrollingText, Comparison) - see later implementations

  // ==========================================
  // 5.2b How It Works Section
  // ==========================================
  const howItWorksSchema = {
    name: "How It Works",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "How It Works" },
      { type: "textarea", id: "subheading", label: "Subheading", default: "Simple, fast, and hassle-free process." }
    ],
    blocks: [
      {
        type: "step",
        name: "Step",
        limit: 3,
        settings: [
          { type: "text", id: "title", label: "Title", default: "Step Title" },
          { type: "textarea", id: "text", label: "Description", default: "Step description." }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya How It Works",
        blocks: [
          { type: "step", settings: { title: "Place Your Order", text: "Select your preferred options." } },
          { type: "step", settings: { title: "We Ship Fast", text: "Ships within 24 hours." } },
          { type: "step", settings: { title: "Enjoy", text: "Experience quality." } }
        ]
      }
    ]
  }

  const howItWorksLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold text-slate-900 mb-4">{{ section.settings.heading }}</h2>
      <p class="text-slate-600">{{ section.settings.subheading }}</p>
    </div>

    <div class="grid gap-8 md:grid-cols-3 relative">
      <!-- Connector Line (Desktop) -->
      <div class="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10"></div>

      {% for block in section.blocks %}
        <div class="flex flex-col items-center text-center bg-white">
          <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl border-4 border-slate-50 text-primary" style="color: {{ settings.primary_color }};">
            <span class="text-2xl font-bold">{{ forloop.index }}</span>
          </div>
          <h3 class="mb-2 text-xl font-bold text-slate-900">{{ block.settings.title }}</h3>
          <p class="max-w-xs text-sm text-slate-500">{{ block.settings.text }}</p>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(howItWorksSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-how-it-works.liquid', howItWorksLiquid)

  // ==========================================
  // 5.2c Visual Showcase Section
  // ==========================================
  const visualShowcaseSchema = {
    name: "Visual Showcase",
    settings: [
      { type: "image_picker", id: "image", label: "Background Image" },
      { type: "text", id: "heading", label: "Heading", default: "Experience Perfection" },
      { type: "textarea", id: "text", label: "Text", default: "Don't settle for less." },
      { type: "text", id: "cta_text", label: "Button Text", default: "Get Yours Today" },
      { type: "url", id: "cta_link", label: "Button Link" }
    ],
    presets: [{ name: "Zenya Visual Showcase" }]
  }

  const visualShowcaseLiquid = `
<div class="relative h-[600px] w-full overflow-hidden bg-slate-900" x-data="{ shown: false }" x-intersect.once="shown = true">
  <div class="absolute inset-0 opacity-60">
    {% if section.settings.image != blank %}
      {{ section.settings.image | image_url: width: 2000 | image_tag: class: 'object-cover w-full h-full', loading: 'lazy' }}
    {% else %}
      {{ 'lifestyle-1' | placeholder_svg_tag: 'object-cover w-full h-full bg-slate-800' }}
    {% endif %}
  </div>
  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
  
  <div class="relative z-10 flex h-full items-end justify-center pb-20 text-center">
    <div class="px-6 max-w-2xl">
      <div 
        x-show="shown"
        x-transition:enter="transition ease-out duration-700"
        x-transition:enter-start="opacity-0 translate-y-10"
        x-transition:enter-end="opacity-100 translate-y-0"
        x-cloak
      >
        <h2 class="mb-6 text-4xl font-bold text-white md:text-5xl drop-shadow-lg">
          {{ section.settings.heading }}
        </h2>
        <p class="mb-8 text-lg text-slate-200 drop-shadow-md">
          {{ section.settings.text }}
        </p>
        <a href="{{ section.settings.cta_link | default: routes.all_products_collection_url }}" 
           class="inline-block rounded-full px-10 py-4 text-lg font-bold text-white shadow-2xl transition hover:scale-105 active:scale-95"
           style="background-color: {{ settings.primary_color }};">
          {{ section.settings.cta_text }}
        </a>
      </div>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(visualShowcaseSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-visual-showcase.liquid', visualShowcaseLiquid)

  // 4.9 Slideshow Section (Classic Hero Slider)
  const slideshowSchema = {
    name: "Slideshow",
    settings: [
      { type: "select", id: "height", label: "Slide Height", options: [{value: "h-96", label: "Small"}, {value: "h-[32rem]", label: "Medium"}, {value: "h-screen", label: "Full Screen"}], default: "h-[32rem]" },
      { type: "range", id: "speed", label: "Autoplay Speed (s)", min: 3, max: 10, default: 5 }
    ],
    blocks: [
      {
        type: "slide",
        name: "Slide",
        settings: [
          { type: "image_picker", id: "image", label: "Image" },
          { type: "text", id: "heading", label: "Heading", default: "Welcome to Zenya" },
          { type: "text", id: "subheading", label: "Subheading", default: "The best products for your lifestyle." },
          { type: "text", id: "cta_text", label: "Button Label", default: "Shop Now" },
          { type: "url", id: "cta_url", label: "Button Link" }
        ]
      }
    ],
    presets: [{ name: "Zenya Slideshow" }]
  }
  const slideshowLiquid = `
<div x-data="{ active: 0, count: {{ section.blocks.size }}, timer: null }" 
     x-init="timer = setInterval(() => { active = (active + 1) % count }, {{ section.settings.speed | times: 1000 }})"
     class="relative w-full {{ section.settings.height }} overflow-hidden bg-slate-900 group">
  
  {% for block in section.blocks %}
    <div x-show="active === {{ forloop.index0 }}"
         x-transition:enter="transition ease-out duration-700"
         x-transition:enter-start="opacity-0 scale-105"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-in duration-700 absolute inset-0"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-100"
         class="absolute inset-0 w-full h-full flex items-center justify-center text-center">
      
      <!-- Background Image -->
      {% if block.settings.image != blank %}
        <img 
          src="{{ block.settings.image | image_url: width: 1600 }}" 
          width="{{ block.settings.image.width }}"
          height="{{ block.settings.image.height }}"
          alt="{{ block.settings.image.alt | default: block.settings.heading }}"
          class="absolute inset-0 w-full h-full object-cover opacity-60">
      {% else %}
        {{ 'lifestyle-' | append: forloop.index | placeholder_svg_tag: 'absolute inset-0 w-full h-full object-cover opacity-60' }}
      {% endif %}
      
      <!-- Content -->
      <div class="relative z-10 max-w-2xl px-6">
        <h2 class="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">{{ block.settings.heading }}</h2>
        <p class="text-xl text-slate-100 mb-8 drop-shadow">{{ block.settings.subheading }}</p>
        {% if block.settings.cta_text != blank %}
          <a href="{{ block.settings.cta_url | default: routes.all_products_collection_url }}" class="inline-block px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 transition shadow-lg transform hover:scale-105">
            {{ block.settings.cta_text }}
          </a>
        {% endif %}
      </div>
    </div>
  {% endfor %}

  <!-- Controls -->
  <button @click="active = (active - 1 + count) % count; clearInterval(timer)" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white backdrop-blur-sm transition opacity-0 group-hover:opacity-100">❮</button>
  <button @click="active = (active + 1) % count; clearInterval(timer)" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white backdrop-blur-sm transition opacity-0 group-hover:opacity-100">❯</button>

  <!-- Indicators -->
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
    {% for block in section.blocks %}
      <button @click="active = {{ forloop.index0 }}" class="w-3 h-3 rounded-full transition-all" :class="active === {{ forloop.index0 }} ? 'bg-white scale-125' : 'bg-white/50'"></button>
    {% endfor %}
  </div>
</div>
{% schema %}
${JSON.stringify(slideshowSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-slideshow.liquid', slideshowLiquid)

  // 4.10 Scrolling Text (Marquee)
  const scrollingTextSchema = {
    name: "Scrolling Text",
    settings: [
      { type: "text", id: "text", label: "Default Text", default: "FREE SHIPPING ON ALL ORDERS • 30-DAY MONEY BACK GUARANTEE • 24/7 SUPPORT • " },
      { type: "color", id: "bg_color", label: "Background", default: "#0f172a" },
      { type: "color", id: "text_color", label: "Text Color", default: "#ffffff" },
      { type: "range", id: "speed", label: "Speed", min: 10, max: 60, default: 20 }
    ],
    blocks: [
      {
        type: "text_block",
        name: "Text Block",
        settings: [
          { type: "text", id: "text", label: "Text", default: "Free Shipping" }
        ]
      }
    ],
    presets: [{
      name: "Zenya Scrolling Text",
      blocks: [
        { type: "text_block", settings: { text: "Free Shipping" } },
        { type: "text_block", settings: { text: "Sale Now On" } },
        { type: "text_block", settings: { text: "New Arrivals" } }
      ]
    }]
  }
  const scrollingTextLiquid = `
<div class="overflow-hidden whitespace-nowrap py-4" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="inline-flex animate-marquee">
    {% for block in section.blocks %}
      <span class="text-xl font-bold uppercase tracking-widest mx-4" {{ block.shopify_attributes }}>{{ block.settings.text }}</span>
    {% endfor %}
    {% comment %} Duplicate for infinite scroll effect {% endcomment %}
    {% for block in section.blocks %}
      <span class="text-xl font-bold uppercase tracking-widest mx-4" aria-hidden="true">{{ block.settings.text }}</span>
    {% endfor %}
    {% for block in section.blocks %}
      <span class="text-xl font-bold uppercase tracking-widest mx-4" aria-hidden="true">{{ block.settings.text }}</span>
    {% endfor %}
    {% if section.blocks.size == 0 %}
       {% for i in (1..10) %}
        <span class="text-xl font-bold uppercase tracking-widest mx-4">{{ section.settings.text }}</span>
      {% endfor %}
    {% endif %}
  </div>
</div>
<style>
  .animate-marquee { animation: marquee {{ section.settings.speed }}s linear infinite; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
</style>
{% schema %}
${JSON.stringify(scrollingTextSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-scrolling-text.liquid', scrollingTextLiquid)




  // 4.11 Multi-Column (Features/Team/Process)
  const multiColumnSchema = {
    name: "Multi-Column",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Our Process" },
      { type: "select", id: "align", label: "Alignment", options: [{value: "left", label: "Left"}, {value: "center", label: "Center"}], default: "center" }
    ],
    blocks: [
      {
        type: "column",
        name: "Column",
        settings: [
          { type: "image_picker", id: "image", label: "Image" },
          { type: "text", id: "title", label: "Title", default: "Feature" },
          { type: "textarea", id: "text", label: "Text", default: "Description of this feature or step." }
        ]
      }
    ],
    presets: [{ name: "Zenya Multi-Column" }]
  }
  const multiColumnLiquid = `
<div class="py-20 bg-white">
  <div class="container mx-auto px-6">
    {% if section.settings.title != blank %}
      <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">{{ section.settings.title }}</h2>
    {% endif %}
    <div class="grid md:grid-cols-3 gap-12 text-{{ section.settings.align }}">
      {% for block in section.blocks %}
        <div class="space-y-4">
          <div class="w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden mb-4">
            {% if block.settings.image != blank %}
              <img 
                src="{{ block.settings.image | image_url: width: 600 }}" 
                width="{{ block.settings.image.width }}"
                height="{{ block.settings.image.height }}"
                alt="{{ block.settings.title }}"
                class="w-full h-full object-cover">
            {% else %}
              {{ 'image' | placeholder_svg_tag: 'w-full h-full object-cover opacity-50' }}
            {% endif %}
          </div>
          <h3 class="text-xl font-bold text-slate-900">{{ block.settings.title }}</h3>
          <p class="text-slate-600 leading-relaxed">{{ block.settings.text }}</p>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(multiColumnSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-multicolumn.liquid', multiColumnLiquid)

  // 4.12 Before/After Slider (Interactive)
  const beforeAfterSchema = {
    name: "Before/After Slider",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "See the Difference" },
      { type: "image_picker", id: "image_before", label: "Before Image" },
      { type: "image_picker", id: "image_after", label: "After Image" }
    ],
    presets: [{ name: "Zenya Before/After" }]
  }
  const beforeAfterLiquid = `
<div class="py-24 bg-slate-50" x-data="{ slider: 50 }">
  <div class="container mx-auto px-6 text-center">
    <h2 class="text-3xl font-bold text-slate-900 mb-12">{{ section.settings.heading }}</h2>
    <div class="relative w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none">
      
      <!-- After Image (Background) -->
      <div class="absolute inset-0">
        {% if section.settings.image_after != blank %}
          <img 
            src="{{ section.settings.image_after | image_url: width: 1200 }}" 
            width="{{ section.settings.image_after.width }}"
            height="{{ section.settings.image_after.height }}"
            class="w-full h-full object-cover">
        {% else %}
          <div class="w-full h-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-4xl">AFTER</div>
        {% endif %}
      </div>

      <!-- Before Image (Clipped) -->
      <div class="absolute inset-0 overflow-hidden" :style="'width: ' + slider + '%'">
        <div class="absolute inset-0 w-[100vw] max-w-4xl h-full">
           {% if section.settings.image_before != blank %}
             <img 
               src="{{ section.settings.image_before | image_url: width: 1200 }}" 
               width="{{ section.settings.image_before.width }}"
               height="{{ section.settings.image_before.height }}"
               class="w-full h-full object-cover">
           {% else %}
             <div class="w-full h-full bg-red-100 flex items-center justify-center text-red-800 font-bold text-4xl">BEFORE</div>
           {% endif %}
        </div>
      </div>

      <!-- Handle -->
      <div class="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.3)]" :style="'left: ' + slider + '%'">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-400">
          ↔
        </div>
      </div>

      <!-- Input Range -->
      <input type="range" min="0" max="100" x-model="slider" class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20">
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(beforeAfterSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-before-after.liquid', beforeAfterLiquid)

  // 4.13 Stats Section
  const statsSchema = {
    name: "Stats",
    settings: [
      { type: "color", id: "bg_color", label: "Background Color", default: "#3b82f6" },
      { type: "color", id: "text_color", label: "Text Color", default: "#ffffff" }
    ],
    blocks: [
      {
        type: "stat",
        name: "Stat",
        settings: [
          { type: "text", id: "value", label: "Value", default: "10k+" },
          { type: "text", id: "label", label: "Label", default: "Happy Customers" }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya Stats",
        blocks: [
          { type: "stat", settings: { value: "10k+", label: "Themes Generated" } },
          { type: "stat", settings: { value: "2.5s", label: "Avg. Load Time" } },
          { type: "stat", settings: { value: "$40M+", label: "Client Revenue" } },
          { type: "stat", settings: { value: "24/7", label: "AI Availability" } }
        ]
      }
    ]
  }
  const statsLiquid = `
<section class="py-12" style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="container mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-white/10 md:divide-x">
      {% for block in section.blocks %}
        <div class="flex flex-col items-center">
          <div class="text-4xl font-black tracking-tight mb-1">{{ block.settings.value }}</div>
          <div class="text-sm font-medium uppercase tracking-wider opacity-80">{{ block.settings.label }}</div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(statsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-stats.liquid', statsLiquid)

  // 4.14 Logo Cloud (Trusted By)
  const logosSchema = {
    name: "Logo Cloud",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Powered by modern commerce stack" }
    ],
    blocks: [
      {
        type: "logo",
        name: "Logo",
        settings: [
          { type: "image_picker", id: "image", label: "Logo Image" },
          { type: "text", id: "alt", label: "Alt Text", default: "Partner" }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya Logo Cloud",
        blocks: [
          { type: "logo" },
          { type: "logo" },
          { type: "logo" },
          { type: "logo" }
        ]
      }
    ]
  }
  const logosLiquid = `
<section class="py-12 bg-white">
  <div class="container mx-auto px-6">
    {% if section.settings.heading != blank %}
      <p class="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-8">{{ section.settings.heading }}</p>
    {% endif %}
    <div class="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale transition duration-500 hover:grayscale-0 hover:opacity-100">
      {% for block in section.blocks %}
        {% if block.settings.image != blank %}
          {{ block.settings.image | image_url: width: 300 | image_tag: class: 'h-8 w-auto object-contain' }}
        {% else %}
          <div class="h-8 flex items-center justify-center text-xl font-bold tracking-tight text-slate-400">Logo {{ forloop.index }}</div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(logosSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-logos.liquid', logosLiquid)

  // 4.13 Blog Posts (Articles)
  const blogPostsSchema = {
    name: "Blog Posts",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Latest News" },
      { type: "blog", id: "blog", label: "Blog Source" },
      { type: "range", id: "limit", label: "Posts to Show", min: 3, max: 9, step: 3, default: 3 }
    ],
    presets: [{ name: "Zenya Blog Posts" }]
  }
  const blogPostsLiquid = `
<div class="py-20 bg-white">
  <div class="container mx-auto px-6">
    <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">{{ section.settings.title }}</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {% assign blog = blogs[section.settings.blog] %}
      {% if blog != blank %}
        {% for article in blog.articles limit: section.settings.limit %}
          <a href="{{ article.url }}" class="group block">
            <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4">
              {% if article.image %}
                <img 
                  src="{{ article.image | image_url: width: 600 }}" 
                  width="{{ article.image.width }}" 
                  height="{{ article.image.height }}"
                  alt="{{ article.title | escape }}"
                  class="w-full h-full object-cover transition duration-500 group-hover:scale-105">
              {% endif %}
            </div>
            <div class="text-xs font-bold text-primary uppercase mb-2">{{ article.published_at | date: "%B %d, %Y" }}</div>
            <h3 class="text-xl font-bold text-slate-900 group-hover:text-primary transition mb-2">{{ article.title }}</h3>
            <p class="text-slate-600 line-clamp-2">{{ article.excerpt_or_content | strip_html }}</p>
          </a>
        {% endfor %}
      {% else %}
        <!-- Demo Articles -->
        {% for i in (1..3) %}
          <a href="{{ routes.all_products_collection_url }}" class="group block">
            <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4">
              {{ 'image' | placeholder_svg_tag: 'w-full h-full object-cover opacity-50' }}
            </div>
            <div class="text-xs font-bold text-primary uppercase mb-2">October 24, 2024</div>
            <h3 class="text-xl font-bold text-slate-900 group-hover:text-primary transition mb-2">Article Title {{ i }}</h3>
            <p class="text-slate-600">This is a summary of the article content. It is very interesting and you should read it.</p>
          </a>
        {% endfor %}
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(blogPostsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-blog-posts.liquid', blogPostsLiquid)

  // 4.14 Map (Location)
  const mapSchema = {
    name: "Map",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Visit Our Store" },
      { type: "text", id: "address", label: "Address", default: "123 Main St, New York, NY 10001" },
      { type: "text", id: "map_api_key", label: "Google Maps API Key (Optional)", info: "Leave blank to use iframe embed" }
    ],
    presets: [{ name: "Zenya Map" }]
  }
  const mapLiquid = `
<div class="py-0 bg-slate-100 relative h-96">
  <div class="absolute inset-0 grayscale">
    <iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q={{ section.settings.address | url_encode }}&t=&z=13&ie=UTF8&iwloc=&output=embed"></iframe>
  </div>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4">
    <h3 class="text-xl font-bold text-slate-900 mb-2">{{ section.settings.heading }}</h3>
    <p class="text-slate-600">{{ section.settings.address }}</p>
    <a href="https://maps.google.com/maps?q={{ section.settings.address | url_encode }}" target="_blank" class="inline-block mt-4 text-primary font-bold hover:underline">Get Directions →</a>
  </div>
</div>
{% schema %}
${JSON.stringify(mapSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-map.liquid', mapLiquid)

  // 4.15 Custom Liquid (Code Injection)
  const customLiquidSchema = {
    name: "Custom Liquid",
    settings: [
      { type: "liquid", id: "custom_liquid", label: "Custom Liquid", info: "Add app snippets or other code to create advanced customizations." },
      { type: "checkbox", id: "full_width", label: "Full Width", default: false }
    ],
    presets: [{ name: "Zenya Custom Liquid" }]
  }
  const customLiquidLiquid = `
<div class="{% unless section.settings.full_width %}container mx-auto px-6{% endunless %} py-12">
  {{ section.settings.custom_liquid }}
</div>
{% schema %}
${JSON.stringify(customLiquidSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-custom-liquid.liquid', customLiquidLiquid)

  // 4.16 Countdown Banner (Standalone)
  const countdownBannerSchema = {
    name: "Countdown Banner",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Flash Sale Ends In" },
      { type: "text", id: "date", label: "End Date (YYYY-MM-DD)", default: "2025-12-31" },
      { type: "color", id: "bg_color", label: "Background", default: "#dc2626" },
      { type: "color", id: "text_color", label: "Text Color", default: "#ffffff" }
    ],
    presets: [{ name: "Zenya Countdown Banner" }]
  }
  const countdownBannerLiquid = `
<div class="py-12 text-center" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};"
     x-data="{ 
       timeLeft: 0,
       endDate: new Date('{{ section.settings.date }}').getTime(),
       init() {
         this.update();
         setInterval(() => this.update(), 1000);
       },
       update() {
         const now = new Date().getTime();
         this.timeLeft = Math.max(0, Math.floor((this.endDate - now) / 1000));
       },
       format(t) {
         const d = Math.floor(t / 86400);
         const h = Math.floor((t % 86400) / 3600);
         const m = Math.floor((t % 3600) / 60);
         const s = t % 60;
         return { d, h, m, s };
       }
     }">
  <h2 class="text-2xl md:text-3xl font-black uppercase tracking-widest mb-6">{{ section.settings.heading }}</h2>
  <div class="flex justify-center gap-4 md:gap-8 font-mono">
    <div class="flex flex-col items-center">
      <span class="text-4xl md:text-6xl font-bold" x-text="format(timeLeft).d">00</span>
      <span class="text-xs uppercase opacity-75">Days</span>
    </div>
    <div class="text-4xl md:text-6xl font-bold opacity-50">:</div>
    <div class="flex flex-col items-center">
      <span class="text-4xl md:text-6xl font-bold" x-text="format(timeLeft).h">00</span>
      <span class="text-xs uppercase opacity-75">Hours</span>
    </div>
    <div class="text-4xl md:text-6xl font-bold opacity-50">:</div>
    <div class="flex flex-col items-center">
      <span class="text-4xl md:text-6xl font-bold" x-text="format(timeLeft).m">00</span>
      <span class="text-xs uppercase opacity-75">Minutes</span>
    </div>
    <div class="text-4xl md:text-6xl font-bold opacity-50">:</div>
    <div class="flex flex-col items-center">
      <span class="text-4xl md:text-6xl font-bold" x-text="format(timeLeft).s">00</span>
      <span class="text-xs uppercase opacity-75">Seconds</span>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(countdownBannerSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-countdown-banner.liquid', countdownBannerLiquid)

  // 4.17 Shoppable Image (Hotspots)
  const shoppableImageSchema = {
    name: "Shoppable Image",
    settings: [
      { type: "image_picker", id: "image", label: "Main Image" }
    ],
    blocks: [
      {
        type: "hotspot",
        name: "Product Hotspot",
        settings: [
          { type: "product", id: "product", label: "Product" },
          { type: "range", id: "top", label: "Top Position (%)", min: 0, max: 100, default: 50 },
          { type: "range", id: "left", label: "Left Position (%)", min: 0, max: 100, default: 50 }
        ]
      }
    ],
    presets: [{ name: "Zenya Shoppable Image" }]
  }
  const shoppableImageLiquid = `
<div class="relative w-full aspect-[4/3] md:aspect-[21/9] bg-slate-100 overflow-hidden group">
  {% if section.settings.image != blank %}
    <img 
      src="{{ section.settings.image | image_url: width: 2000 }}" 
      width="{{ section.settings.image.width }}" 
      height="{{ section.settings.image.height }}"
      alt=""
      class="absolute inset-0 w-full h-full object-cover">
  {% else %}
    {{ 'collection-1' | placeholder_svg_tag: 'absolute inset-0 w-full h-full object-cover opacity-50' }}
  {% endif %}

  {% for block in section.blocks %}
    <div class="absolute w-8 h-8 -ml-4 -mt-4 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition z-10 flex items-center justify-center group/hotspot"
         style="top: {{ block.settings.top }}%; left: {{ block.settings.left }}%;">
      <span class="w-3 h-3 bg-primary rounded-full animate-ping absolute"></span>
      <span class="w-3 h-3 bg-primary rounded-full relative"></span>
      
      <!-- Tooltip -->
      <div class="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-white p-3 rounded-lg shadow-xl opacity-0 invisible group-hover/hotspot:opacity-100 group-hover/hotspot:visible transition-all duration-300 transform translate-y-2 group-hover/hotspot:translate-y-0">
        {% assign product = all_products[block.settings.product] %}
        {% if product != blank %}
          <div class="aspect-square bg-slate-100 rounded mb-2 overflow-hidden">
            <img 
              src="{{ product.featured_image | image_url: width: 200 }}" 
              width="{{ product.featured_image.width }}" 
              height="{{ product.featured_image.height }}"
              alt="{{ product.title | escape }}"
              class="w-full h-full object-cover">
          </div>
          <div class="font-bold text-sm text-slate-900 mb-1">{{ product.title }}</div>
          <div class="text-xs text-slate-600 mb-2">{{ product.price | money }}</div>
          <a href="{{ product.url }}" class="block w-full text-center bg-primary text-white text-xs font-bold py-1.5 rounded hover:bg-primary-dark transition">View</a>
        {% else %}
          <div class="font-bold text-sm text-slate-900">Select Product</div>
        {% endif %}
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
      </div>
    </div>
  {% endfor %}
</div>
{% schema %}
${JSON.stringify(shoppableImageSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-shoppable-image.liquid', shoppableImageLiquid)

  // 4.18 Accordion (FAQ General)
  const accordionSchema = {
    name: "Accordion",
    settings: [
      { type: "text", id: "title", label: "Heading", default: "Frequently Asked Questions" },
      { type: "text", id: "button_text", label: "Button Label", default: "Contact Support" },
      { type: "url", id: "button_url", label: "Button Link" }
    ],
    blocks: [
      {
        type: "item",
        name: "Item",
        settings: [
          { type: "text", id: "title", label: "Question", default: "Question goes here?" },
          { type: "richtext", id: "text", label: "Answer", default: "<p>Answer goes here.</p>" }
        ]
      }
    ],
    presets: [{ name: "Zenya Accordion" }]
  }
  const accordionLiquid = `
<div class="py-20 bg-slate-50">
  <div class="container mx-auto px-6 max-w-3xl">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-slate-900 mb-4">{{ section.settings.title }}</h2>
      {% if section.settings.button_text != blank %}
        <a href="{{ section.settings.button_url }}" class="text-primary font-bold hover:underline">{{ section.settings.button_text }} →</a>
      {% endif %}
    </div>
    <div class="space-y-4">
      {% for block in section.blocks %}
        <div x-data="{ open: false }" class="bg-white rounded-xl shadow-sm overflow-hidden">
          <button @click="open = !open" class="w-full flex items-center justify-between p-6 text-left font-bold text-slate-900 hover:bg-slate-50 transition">
            <span>{{ block.settings.title }}</span>
            <span class="transform transition duration-300" :class="open ? 'rotate-180' : ''">▼</span>
          </button>
          <div x-show="open" x-collapse class="px-6 pb-6 text-slate-600 prose prose-sm max-w-none">
            {{ block.settings.text }}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(accordionSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-accordion.liquid', accordionLiquid)

  // 4.19 Tabs (Content Switcher)
  const tabsSchema = {
    name: "Tabs",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Details" }
    ],
    blocks: [
      {
        type: "tab",
        name: "Tab",
        settings: [
          { type: "text", id: "title", label: "Tab Title", default: "Description" },
          { type: "richtext", id: "content", label: "Content", default: "<p>Content goes here.</p>" }
        ]
      }
    ],
    presets: [{ name: "Zenya Tabs" }]
  }
  const tabsLiquid = `
<div class="py-20 bg-white" x-data="{ activeTab: 0 }">
  <div class="container mx-auto px-6 max-w-4xl">
    <h2 class="text-3xl font-bold text-slate-900 mb-8 text-center">{{ section.settings.heading }}</h2>
    
    <!-- Tab Headers -->
    <div class="flex border-b border-slate-200 mb-8 overflow-x-auto">
      {% for block in section.blocks %}
        <button @click="activeTab = {{ forloop.index0 }}" 
                class="px-8 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition whitespace-nowrap"
                :class="activeTab === {{ forloop.index0 }} ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'">
          {{ block.settings.title }}
        </button>
      {% endfor %}
    </div>

    <!-- Tab Content -->
    <div class="min-h-[200px]">
      {% for block in section.blocks %}
        <div x-show="activeTab === {{ forloop.index0 }}" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-4"
             x-transition:enter-end="opacity-100 translate-y-0"
             class="prose max-w-none text-slate-600">
          {{ block.settings.content }}
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(tabsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-tabs.liquid', tabsLiquid)

  // 4.20 Video Hero (Background Video)
  const videoHeroSchema = {
    name: "Video Hero",
    settings: [
      { type: "text", id: "video_url", label: "Video URL (MP4)", info: "Direct link to MP4 file" },
      { type: "text", id: "heading", label: "Heading", default: "Cinematic Experience" },
      { type: "text", id: "subheading", label: "Subheading", default: "Immerse your customers in your brand story." },
      { type: "text", id: "cta_text", label: "Button Label", default: "Watch More" },
      { type: "url", id: "cta_url", label: "Button Link" }
    ],
    presets: [{ name: "Zenya Video Hero" }]
  }
  const videoHeroLiquid = `
<div class="relative h-screen w-full overflow-hidden bg-black">
  {% if section.settings.video != blank %}
    {{ section.settings.video | video_tag: autoplay: true, loop: true, muted: true, controls: false, class: 'absolute inset-0 w-full h-full object-cover opacity-60' }}
  {% else %}
    <div class="absolute inset-0 bg-slate-900 opacity-60"></div>
  {% endif %}
  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
    <h1 class="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-lg">{{ section.settings.heading }}</h1>
    <p class="text-xl md:text-2xl text-slate-200 mb-10 max-w-2xl drop-shadow">{{ section.settings.subheading }}</p>
    {% if section.settings.cta_text != blank %}
      <a href="{{ section.settings.cta_url | default: routes.all_products_collection_url }}" class="px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-slate-200 transition transform hover:scale-105 shadow-xl">
        {{ section.settings.cta_text }}
      </a>
    {% endif %}
  </div>
</div>
{% schema %}
${JSON.stringify(videoHeroSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-video-hero.liquid', videoHeroLiquid)

  // 4.21 Timeline (History)
  const timelineSchema = {
    name: "Timeline",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Our Journey" }
    ],
    blocks: [
      {
        type: "milestone",
        name: "Milestone",
        settings: [
          { type: "text", id: "year", label: "Year", default: "2020" },
          { type: "text", id: "title", label: "Title", default: "Founded" },
          { type: "textarea", id: "text", label: "Description", default: "We started in a garage..." }
        ]
      }
    ],
    presets: [{ name: "Zenya Timeline" }]
  }
  const timelineLiquid = `
<div class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-4xl">
    <h2 class="text-3xl font-bold text-slate-900 mb-16 text-center">{{ section.settings.heading }}</h2>
    <div class="relative border-l-4 border-slate-100 ml-4 md:ml-1/2 space-y-12">
      {% for block in section.blocks %}
        <div class="relative pl-12 md:pl-0">
          <!-- Dot -->
          <div class="absolute top-0 left-[-10px] w-5 h-5 bg-primary rounded-full border-4 border-white shadow md:left-1/2 md:-translate-x-1/2"></div>
          
          {% assign is_even = forloop.index | modulo: 2 %}
          <div class="md:flex items-start justify-between w-full {% if is_even == 0 %}flex-row-reverse{% endif %}">
            <div class="md:w-[45%] mb-2 md:mb-0 {% if is_even == 0 %}text-left md:text-right{% else %}text-left{% endif %}">
              <span class="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-sm rounded-full mb-2">{{ block.settings.year }}</span>
              <h3 class="text-xl font-bold text-slate-900 mb-2">{{ block.settings.title }}</h3>
              <p class="text-slate-600 leading-relaxed">{{ block.settings.text }}</p>
            </div>
            <div class="hidden md:block w-[45%]"></div> <!-- Spacer -->
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(timelineSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-timeline.liquid', timelineLiquid)

  // 5. Product Page
  // 5.1 Product Section with Volume Bundles
  const productSchema = {
    name: "Product Page",
    settings: [
      { type: "checkbox", id: "show_stock", label: "Show Stock Counter", default: true },
      { type: "text", id: "review_count", label: "Review Count Text", default: "1,234 Reviews" },
      { type: "text", id: "guarantee_text", label: "Guarantee Text", default: content.guarantee.text },
      { type: "checkbox", id: "sticky_atc", label: "Show Sticky Add To Cart", default: true }
    ],
    blocks: [
      { type: "@app" }
    ],
    presets: [{ name: "Zenya Product" }]
  }

  const productLiquid = `
<div class="py-10 lg:py-20 bg-white" id="MainProduct-{{ section.id }}" 
  x-data="{ 
  selectedQuantity: 1,
  
  // Variant Logic
  variants: [
    {% for variant in product.variants %}
      {
        id: {{ variant.id }},
        title: {{ variant.title | json }},
        price: {{ variant.price }},
        compare_at_price: {{ variant.compare_at_price | default: 'null' }},
        featured_media: {{ variant.featured_media | json }},
        options: {{ variant.options | json }},
        unit_price: {{ variant.unit_price | default: 'null' }},
        unit_price_measurement: {{ variant.unit_price_measurement | json }}
      }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ],
  optionNames: {{ product.options | json | escape }},
  options: {
    {% for option in product.options_with_values %}
      {{ option.name | json | escape }}: {{ option.selected_value | json | escape }}{% unless forloop.last %},{% endunless %}
    {% endfor %}
  },
  currentVariantId: {{ product.selected_or_first_available_variant.id }},
  currentPrice: {{ product.selected_or_first_available_variant.price }},
  currentComparePrice: {{ product.selected_or_first_available_variant.compare_at_price | default: 'null' }},
  currentMediaId: {{ product.selected_or_first_available_variant.featured_media.id | default: product.featured_media.id | default: 'null' }},
  stock: 14,
  timeLeft: 43200,
  isStickyVisible: false,
  visitors: 24,
  
  // Computed Properties
  get variant() {
    return this.variants.find(v => {
      return v.options.every((opt, index) => {
        const optionName = this.optionNames[index];
        return this.options[optionName] === opt;
      });
    }) || this.variants[0];
  },

  updateVariant() {
    const matched = this.variants.find(v => {
      // Create array of selected values in correct order
      const selectedValues = [];
      {% for option in product.options %}
        selectedValues.push(this.options[{{ option | json | escape }}]);
      {% endfor %}
      
      return v.options.every((val, i) => val === selectedValues[i]);
    });

    if (matched) {
      this.currentVariantId = matched.id;
      this.currentPrice = matched.price;
      this.currentComparePrice = matched.compare_at_price;
      if (matched.featured_media) {
        this.currentMediaId = matched.featured_media.id;
      }
      
      // Update URL without reload
      const url = new URL(window.location);
      url.searchParams.set('variant', matched.id);
      window.history.replaceState({}, '', url);

      // Fetch Pickup Availability
      fetch(\`/?section_id=pickup-availability&variant=\${matched.id}\`)
        .then(r => r.text())
        .then(t => {
          const p = new DOMParser().parseFromString(t, 'text/html');
          const c = document.getElementById('pickup-availability-container');
          const s = p.querySelector('.shopify-section');
          if (c && s) c.innerHTML = s.innerHTML;
        });
    }
  },

  get discount() {
    if (this.selectedQuantity === 2) return 15;
    if (this.selectedQuantity === 3) return 25;
    return 0;
  },
  
  get totalPrice() {
    let total = this.currentPrice * this.selectedQuantity;
    if (this.discount > 0) {
      total = total * (1 - (this.discount / 100));
    }
    return (total / 100).toFixed(2);
  },

  get savings() {
    let regular = this.currentPrice * this.selectedQuantity;
    let discounted = regular * (1 - (this.discount / 100));
    return ((regular - discounted) / 100).toFixed(2);
  },

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return \`\${h}h \${m}m \${s}s\`;
  },

  formatMoney(cents) {
    return '{{ cart.currency.symbol }}' + (cents / 100).toFixed(2);
  },
  
  init() {
    setInterval(() => {
      if(this.timeLeft > 0) this.timeLeft--;
    }, 1000);
    window.addEventListener('scroll', () => {
      const atcButton = document.getElementById('main-atc-button');
      if (atcButton) {
        const rect = atcButton.getBoundingClientRect();
        this.isStickyVisible = rect.top < 0;
      }
    });
    // Live Visitor Counter Logic
    setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      this.visitors = Math.min(Math.max(this.visitors + change, 12), 45);
    }, 4000);
  }
}">
  
  <!-- Sticky Add To Cart Bar -->
  {% if section.settings.sticky_atc %}
  <div 
    x-show="isStickyVisible" 
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="translate-y-full opacity-0"
    x-transition:enter-end="translate-y-0 opacity-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="translate-y-0 opacity-100"
    x-transition:leave-end="translate-y-full opacity-0"
    class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-50 lg:hidden"
    style="display: none;"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex-1">
        <div class="text-xs text-slate-500 font-medium">Total Price</div>
        <div class="font-bold text-slate-900 text-lg">{{ cart.currency.symbol }}<span x-text="totalPrice"></span></div>
      </div>
      <button 
        @click="document.getElementById('main-atc-button').click()"
        class="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition text-sm uppercase tracking-wide"
        style="background-color: {{ settings.primary_color }}"
      >
        {{ settings.add_to_cart_label }}
      </button>
    </div>
  </div>
  {% endif %}

  <div class="container mx-auto px-4 lg:px-6">
    <div class="grid gap-10 lg:grid-cols-12 lg:gap-16">
      
      <!-- Left: Images -->
      <div class="lg:col-span-7">
        <!-- Mobile: Horizontal Scroll (Snap) -->
        <div class="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-4 lg:hidden scrollbar-hide">
          {% if product.media.size > 0 %}
            {% for media in product.media %}
              <div class="snap-center shrink-0 w-[85vw] relative aspect-square rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                {% case media.media_type %}
                  {% when 'image' %}
                    {{ media | image_tag: class: 'h-full w-full object-cover', loading: 'lazy', widths: '400, 600, 800' }}
                  {% when 'video' %}
                    {{ media | video_tag: class: 'h-full w-full object-cover', controls: true, image_size: '800x' }}
                  {% when 'external_video' %}
                    {{ media | external_video_tag: class: 'h-full w-full object-cover' }}
                  {% when 'model' %}
                    {{ media | model_viewer_tag: class: 'h-full w-full object-cover', reveal: 'interaction', image_size: '800x' }}
                {% endcase %}
                {% if forloop.first and product.compare_at_price > product.price %}
                  <div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                    Sale
                  </div>
                {% endif %}
              </div>
            {% endfor %}
          {% else %}
             <div class="snap-center shrink-0 w-[85vw] relative aspect-square rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                <img 
                  src="{{ product.featured_image | image_url: width: 800 }}" 
                  width="{{ product.featured_image.width }}" 
                  height="{{ product.featured_image.height }}"
                  alt="{{ product.title }}" 
                  class="h-full w-full object-cover">
             </div>
          {% endif %}
        </div>

        <!-- Desktop: Main + Thumbnails -->
        <div class="hidden lg:block space-y-4">
          {% if product.media.size > 0 %}
            <div class="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              {% for media in product.media %}
                <div x-show="currentMediaId === {{ media.id }}" x-cloak class="h-full w-full">
                   {% case media.media_type %}
                    {% when 'image' %}
                      {{ media | image_url: width: 1000 | image_tag: class: 'h-full w-full object-cover', loading: 'eager' }}
                    {% when 'video' %}
                      {{ media | video_tag: class: 'h-full w-full object-cover', controls: true, image_size: '1000x' }}
                    {% when 'external_video' %}
                      {{ media | external_video_tag: class: 'h-full w-full object-cover' }}
                    {% when 'model' %}
                      {{ media | model_viewer_tag: class: 'h-full w-full object-cover', reveal: 'interaction', image_size: '1000x' }}
                   {% endcase %}
                </div>
              {% endfor %}
              
              <div x-show="currentComparePrice > currentPrice" class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm z-10">
                Sale
              </div>
            </div>
            <div class="grid grid-cols-6 gap-3">
              {% for media in product.media %}
                <button 
                  @click="currentMediaId = {{ media.id }}"
                  class="relative aspect-square overflow-hidden rounded-lg border-2 transition hover:border-slate-300 focus:ring-2 focus:ring-primary"
                  :class="currentMediaId === {{ media.id }} ? 'border-primary' : 'border-transparent'"
                >
                  {{ media | image_url: width: 200 | image_tag: class: 'h-full w-full object-cover' }}
                  {% if media.media_type == 'video' or media.media_type == 'external_video' %}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  {% elsif media.media_type == 'model' %}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                  {% endif %}
                </button>
              {% endfor %}
            </div>
          {% else %}
            {{ 'product-1' | placeholder_svg_tag: 'w-full h-full bg-slate-100' }}
          {% endif %}
        </div>
      </div>

      <!-- Right: Info -->
      <div class="lg:col-span-5">
        <div class="lg:sticky lg:top-24 h-fit">
          <div class="mb-4">
            <div class="flex flex-wrap items-center gap-3 mb-2">
              <div class="flex items-center gap-1">
                <div class="flex text-yellow-400 text-sm">★★★★★</div>
                <span class="text-xs font-bold text-slate-700">4.9/5</span>
              </div>
              <span class="text-xs text-slate-400">|</span>
              <span class="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2">{{ section.settings.review_count }}</span>
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">{{ product.title }}</h1>
            
            <!-- Benefit Row (Icons) -->
            <div class="flex items-center gap-4 mt-3 text-xs font-medium text-slate-600">
              <div class="flex items-center gap-1.5">
                <div class="p-1 rounded-full bg-green-100 text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                In Stock Ready to Ship
              </div>
              <div class="flex items-center gap-1.5">
                <div class="p-1 rounded-full bg-blue-100 text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                1-Year Warranty
              </div>
            </div>
          </div>
          
          <div class="mb-6 flex items-end gap-3 border-b border-slate-100 pb-6">
            <span class="text-4xl font-bold text-slate-900" x-text="formatMoney(currentPrice)">{{ product.price | money }}</span>
            <span x-show="currentComparePrice > currentPrice" class="mb-1.5 text-xl text-slate-400 line-through" x-text="formatMoney(currentComparePrice)">{{ product.compare_at_price | money }}</span>
            <span x-show="currentComparePrice > currentPrice" class="mb-2 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">SAVE <span x-text="formatMoney(currentComparePrice - currentPrice)"></span></span>
          </div>

          {% if section.settings.show_stock %}
            <div class="mb-8 space-y-3 rounded-lg border border-red-100 bg-red-50 p-4 relative overflow-hidden">
               <!-- Live Visitor Counter -->
               <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-600 shadow-sm">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span x-text="visitors"></span> viewing now
               </div>

              <div class="flex items-center justify-between text-sm font-bold text-red-800 pt-2">
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                     <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Only <span x-text="stock"></span> items left!
                </div>
                <div>Ends in: <span x-text="formatTime(timeLeft)" class="tabular-nums"></span></div>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-red-200">
                <div class="h-full rounded-full bg-red-500 transition-all duration-1000" :style="'width: ' + (stock/50)*100 + '%'"></div>
              </div>
            </div>
          {% endif %}

          {% form 'product', product %}
            <input type="hidden" name="id" :value="currentVariantId">
            <input type="hidden" name="quantity" :value="selectedQuantity">

            <!-- Variant Selectors -->
            {% unless product.has_only_default_variant %}
              <div class="space-y-4 mb-6">
                {% for option in product.options_with_values %}
                  <div>
                    <label class="block text-sm font-bold text-slate-900 mb-2">{{ option.name }}</label>
                    <div class="flex flex-wrap gap-2">
                      {% for value in option.values %}
                        <button 
                          type="button"
                          @click="options['{{ option.name }}'] = '{{ value }}'; updateVariant()"
                          class="px-4 py-2 rounded-full border text-sm font-bold transition-all"
                          :class="options['{{ option.name }}'] === '{{ value }}' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                        >
                          {{ value }}
                        </button>
                      {% endfor %}
                    </div>
                  </div>
                {% endfor %}
              </div>
            {% endunless %}
            
            <!-- Pickup Availability -->
            <div id="pickup-availability-container" class="mb-6"></div>

            <!-- Volume Bundles Widget -->
            <div class="my-6 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-slate-900">Select Quantity</span>
                <span class="text-xs font-medium text-red-600 animate-pulse">
                  🔥 High demand
                </span>
              </div>

              <div class="space-y-3">
                <!-- Option 1 -->
                <div 
                  @click="selectedQuantity = 1"
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="selectedQuantity === 1 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        :class="selectedQuantity === 1 ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'"
                      >
                        <div x-show="selectedQuantity === 1" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-base">Buy 1</div>
                        <div class="text-xs text-slate-500">Standard Price</div>
                      </div>
                    </div>
                    <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice)">{{ product.price | money }}</div>
                  </div>
                </div>

                <!-- Option 2 -->
                <div 
                  @click="selectedQuantity = 2"
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="selectedQuantity === 2 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
                >
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full bg-primary uppercase tracking-wide">
                    Most Popular
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        :class="selectedQuantity === 2 ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'"
                      >
                        <div x-show="selectedQuantity === 2" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-base">Buy 2</div>
                        <div class="text-xs font-bold text-green-600">Save 15% OFF</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice * 2 * 0.85)"></div>
                      <div class="text-xs text-slate-400 line-through" x-text="formatMoney(currentPrice * 2)"></div>
                    </div>
                  </div>
                </div>

                <!-- Option 3 -->
                <div 
                  @click="selectedQuantity = 3"
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="selectedQuantity === 3 ? 'bg-slate-50 border-primary shadow-md ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'"
                >
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full bg-red-500 uppercase tracking-wide">
                    Best Value
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        :class="selectedQuantity === 3 ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'"
                      >
                        <div x-show="selectedQuantity === 3" class="h-2.5 w-2.5 rounded-full bg-white"></div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-base">Buy 3</div>
                        <div class="text-xs font-bold text-green-600">Save 25% OFF</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice * 3 * 0.75)"></div>
                      <div class="text-xs text-slate-400 line-through" x-text="formatMoney(currentPrice * 3)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              id="main-atc-button"
              type="submit" 
              class="w-full rounded-full py-4 text-xl font-bold text-white shadow-xl transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 bg-primary mt-6 mb-4"
            >
              <span>{{ settings.add_to_cart_label }}</span>
              <span class="text-sm opacity-90 font-normal">- <span x-text="savings > 0 ? 'Save ' + '{{ cart.currency.symbol }}' + savings : ''"></span></span>
            </button>
            
            <div class="mt-4 mb-4 dynamic-checkout-buttons">
              {{ form | payment_button }}
            </div>
            
            {%- for block in section.blocks -%}
              {%- case block.type -%}
                {%- when '@app' -%}
                  {% render block %}
              {%- endcase -%}
            {%- endfor -%}
            
            <!-- Trust Badges -->
            <div class="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-medium mb-6">
              <div class="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>SSL Secure</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Tracked Shipping</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Money Back</span>
              </div>
            </div>

            <!-- Accordions -->
            <div class="divide-y divide-slate-100 border-t border-slate-100" x-data="{ active: 'desc' }">
              <!-- Description -->
              <div class="py-3">
                <button 
                  type="button"
                  @click="active = active === 'desc' ? null : 'desc'" 
                  class="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition"
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Description
                  </span>
                  <span class="transition transform duration-200" :class="active === 'desc' ? 'rotate-180' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div x-show="active === 'desc'" x-collapse class="mt-3 text-sm leading-relaxed text-slate-600 prose prose-sm max-w-none">
                  {{ product.description }}
                </div>
              </div>
              
              <!-- Shipping -->
              <div class="py-3">
                <button 
                  type="button"
                  @click="active = active === 'ship' ? null : 'ship'" 
                  class="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition"
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect><line x1="16" y1="8" x2="20" y2="8"></line><line x1="16" y1="16" x2="23" y2="16"></line><rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect></svg>
                    Shipping & Returns
                  </span>
                  <span class="transition transform duration-200" :class="active === 'ship' ? 'rotate-180' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div x-show="active === 'ship'" x-collapse class="mt-3 text-sm leading-relaxed text-slate-600">
                  <p class="mb-2"><strong>Free Worldwide Shipping</strong></p>
                  <p>All orders are processed within 24-48 hours. Shipping times depend on your location, generally taking 7-12 business days.</p>
                </div>
              </div>

              <!-- Guarantee -->
              <div class="py-3">
                <button 
                  type="button"
                  @click="active = active === 'guarantee' ? null : 'guarantee'" 
                  class="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition"
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Our Guarantee
                  </span>
                  <span class="transition transform duration-200" :class="active === 'guarantee' ? 'rotate-180' : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div x-show="active === 'guarantee'" x-collapse class="mt-3 text-sm leading-relaxed text-slate-600">
                  {{ section.settings.guarantee_text }}
                </div>
              </div>
            </div>
          {% endform %}

        </div>
      </div>
    </div>
  </div>
</div>

{% schema %}
${JSON.stringify(productSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-product.liquid', productLiquid)

  const pickupAvailabilityLiquid = `
{%- assign pick_up_availabilities = product.selected_or_first_available_variant.store_availabilities | where: 'pick_up_enabled', true -%}

{%- if pick_up_availabilities.size > 0 -%}
  <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fade-in">
    <div class="text-slate-700 mt-0.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
    </div>
    <div class="flex-1">
      {%- assign closest_location = pick_up_availabilities.first -%}
      {%- if closest_location.available -%}
        <p class="font-bold text-slate-900 text-sm mb-0.5">Pickup available at {{ closest_location.location.name }}</p>
        <p class="text-slate-500 text-xs">{{ closest_location.pick_up_time }}</p>
      {%- else -%}
        <p class="font-bold text-slate-900 text-sm mb-0.5">Check availability at nearby stores</p>
      {%- endif -%}
      
      {%- if pick_up_availabilities.size > 1 -%}
        <button class="text-xs font-bold text-primary hover:underline mt-2">
          Check {{ pick_up_availabilities.size | minus: 1 }} other stores
        </button>
      {%- endif -%}
    </div>
  </div>
{%- endif -%}

{% schema %}
{
  "name": "Pickup Availability",
  "settings": []
}
{% endschema %}
  `
  zip.folder('sections')?.file('pickup-availability.liquid', pickupAvailabilityLiquid)

  const relatedProductsLiquid = `
<div 
  class="py-12 lg:py-16 border-t border-slate-100"
  x-data="{
    loading: true,
    loaded: false
  }"
  x-init="
    fetch('{{ routes.product_recommendations_url }}?section_id={{ section.id }}&product_id={{ product.id }}&limit={{ section.settings.products_to_show }}')
      .then(response => response.text())
      .then(text => {
        const html = new DOMParser().parseFromString(text, 'text/html');
        const recommendations = html.querySelector('.product-recommendations');
        if (recommendations && recommendations.innerHTML.trim().length) {
          $el.querySelector('.product-recommendations').innerHTML = recommendations.innerHTML;
          loaded = true;
        }
        loading = false;
      })
  "
  x-show="loaded"
  x-cloak
>
  <div class="container mx-auto px-4 lg:px-6">
    <h2 class="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-8">{{ section.settings.heading }}</h2>
    
    <div class="product-recommendations grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
      <!-- Products will be injected here -->
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Related Products",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "You May Also Like"
    },
    {
      "type": "range",
      "id": "products_to_show",
      "min": 2,
      "max": 10,
      "step": 1,
      "default": 4,
      "label": "Maximum products to show"
    }
  ],
  "presets": [
    {
      "name": "Related Products"
    }
  ]
}
{% endschema %}
  `
  zip.folder('sections')?.file('related-products.liquid', relatedProductsLiquid)

  const complementaryProductsLiquid = `
<div class="complementary-products">
  {%- if recommendations.performed and recommendations.products_count > 0 -%}
    <h3 class="font-bold text-slate-900 mb-4">{{ section.settings.heading }}</h3>
    <div class="space-y-4">
      {%- for product in recommendations.products -%}
        <div class="flex gap-4 items-start group">
          <a href="{{ product.url }}" class="shrink-0 w-20 h-20 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 group-hover:border-primary transition">
            {{ product.featured_image | image_tag: class: 'w-full h-full object-cover', loading: 'lazy' }}
          </a>
          <div class="flex-1 min-w-0">
            <a href="{{ product.url }}" class="block font-bold text-slate-900 text-sm hover:text-primary transition truncate">{{ product.title }}</a>
            <div class="text-sm font-medium text-slate-500 mb-2">{{ product.price | money }}</div>
            
            {% form 'product', product %}
              <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
              <button type="submit" class="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-primary transition">{{ settings.quick_add_label }}</button>
            {% endform %}
          </div>
        </div>
      {%- endfor -%}
    </div>
  {%- endif -%}
</div>

{% schema %}
{
  "name": "Complementary Products",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Pairs Well With"
    }
  ]
}
{% endschema %}
  `
  zip.folder('sections')?.file('complementary-products.liquid', complementaryProductsLiquid)

  // 5.2 Comparison Table
  const comparisonSchema = {
    name: "Comparison Table",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Why Choose Us?" },
      { type: "text", id: "us_label", label: "Our Brand Label", default: safeShopName },
      { type: "text", id: "them_label", label: "Others Label", default: "Others" },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "color", id: "bg_color", label: "Background Color", default: "#f8fafc" }
    ],
    blocks: [
      {
        type: "row",
        name: "Feature Row",
        settings: [
          { type: "text", id: "feature", label: "Feature Name", default: "Premium Quality" },
          { type: "checkbox", id: "us_check", label: "We Have It", default: true },
          { type: "checkbox", id: "them_check", label: "They Have It", default: false }
        ]
      }
    ],
    presets: [
      {
        name: "Zenya Comparison",
        blocks: [
          { type: "row", settings: { feature: "Premium Quality Materials" } },
          { type: "row", settings: { feature: "24/7 Customer Support" } },
          { type: "row", settings: { feature: "30-Day Money Back Guarantee" } },
          { type: "row", settings: { feature: "Fast & Free Shipping" } }
        ]
      }
    ]
  }

  const comparisonLiquid = `
<div class="relative overflow-hidden py-24" style="background-color: {{ section.settings.bg_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.secondary_color }}, transparent 70%); opacity: .12; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.primary_color }}, transparent 70%); opacity: .10; animation-duration: {{ 24 | minus: settings.motion_strength | at_least: 12 }}s;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 max-w-4xl relative">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-extrabold mb-4 text-slate-900">{{ section.settings.heading }}</h2>
    </div>

    <div class="bg-white/90 backdrop-blur rounded-3xl shadow-xl overflow-hidden border border-slate-200">
      <div class="grid grid-cols-[2fr_1fr_1fr] gap-4 p-6 bg-slate-100 font-extrabold text-center text-sm lg:text-base">
        <div class="text-left text-slate-900">Feature</div>
        <div class="text-slate-500">{{ section.settings.them_label }}</div>
        <div class="text-primary">{{ section.settings.us_label }}</div>
      </div>

      {% for block in section.blocks %}
        <div class="grid grid-cols-[2fr_1fr_1fr] gap-4 p-6 border-b border-slate-100 items-center text-center last:border-0 hover:bg-slate-50 transition">
          <div class="text-left font-bold text-slate-700 text-sm lg:text-base">{{ block.settings.feature }}</div>
          
          <div>
            {% if block.settings.them_check %}
              <span class="text-green-600 text-xl">✔</span>
            {% else %}
              <span class="text-slate-300 text-xl">✘</span>
            {% endif %}
          </div>

          <div class="bg-white -my-4 py-4 rounded-2xl border border-slate-100 shadow-sm">
            {% if block.settings.us_check %}
              <span class="text-primary text-2xl">✔</span>
            {% else %}
              <span class="text-red-500 text-2xl">✘</span>
            {% endif %}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(comparisonSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-comparison.liquid', comparisonLiquid)

  // 5.3 Product Template JSON
  const zenyaProductJson = {
    "sections": {
      "main": { "type": "zenya-product" },
      "pickup_availability": { "type": "pickup-availability" },
      "trust_badges": {
        "type": "zenya-trust-badges",
        "settings": { "heading": content.trust_badges?.heading || "Shop with Confidence" }
      },
      "volume_bundles": {
        "type": "zenya-volume-bundles",
        "settings": { "heading": content.volume_bundles?.heading || "Buy More, Save More" }
      },
      "before_after": {
        "type": "zenya-before-after",
        "settings": {
          "heading": content.before_after?.heading || "See the Difference",
          "label_before": content.before_after?.label_before || "Before",
          "label_after": content.before_after?.label_after || "After"
        }
      },
      "how_it_works": {
        "type": "zenya-how-it-works",
        "settings": { "heading": "How it works" },
        "blocks": (content.how_it_works || []).reduce((acc, s, i) => ({
          ...acc,
          [`step_${i}`]: {
            "type": "step",
            "settings": { "title": s.title, "text": s.text }
          }
        }), {}),
        "block_order": (content.how_it_works || []).map((_, i) => `step_${i}`)
      },
      "comparison": { "type": "zenya-comparison" },
      "features": { 
        "type": "zenya-features",
        "settings": {
          "heading": `Why ${name} works`,
          "subheading": "Clear benefits that matter day one."
        },
        "blocks": (content.features || []).reduce((acc, f, i) => ({
          ...acc,
          [`feature_${i}`]: {
            "type": "feature",
            "settings": {
              "title": f.title,
              "desc": f.desc,
              "icon": f.icon || "star"
            }
          }
        }), {}),
        "block_order": (content.features || []).map((_, i) => `feature_${i}`)
      },
      "testimonials": {
        "type": "zenya-testimonials",
        "blocks": content.testimonials.reduce((acc, t, i) => ({
          ...acc,
          [`testimonial_${i}`]: {
            "type": "testimonial",
            "settings": {
              "name": t.name,
              "text": t.text,
              "location": t.location
            }
          }
        }), {}),
        "block_order": content.testimonials.map((_, i) => `testimonial_${i}`)
      },
      "faq": {
        "type": "zenya-faq",
        "blocks": content.faq.reduce((acc, f, i) => ({
          ...acc,
          [`faq_${i}`]: {
            "type": "faq",
            "settings": {
              "q": f.q,
              "a": f.a
            }
          }
        }), {}),
        "block_order": content.faq.map((_, i) => `faq_${i}`)
      },
      "guarantee": {
        "type": "zenya-guarantee",
        "settings": {
          "title": content.guarantee?.title || "Our Promise",
          "text": content.guarantee?.text || "Satisfaction guaranteed."
        }
      },
      "related": { "type": "related-products" },
      "complementary": { "type": "complementary-products" },
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "title": content.newsletter?.title || "Get offers first",
          "text": content.newsletter?.text || "Subscribe for updates and exclusive deals."
        }
      }
    },
    "order": ["main", "trust_badges", "volume_bundles", "before_after", "how_it_works", "features", "comparison", "testimonials", "faq", "guarantee", "newsletter", "complementary", "related"]
  }
  zip.folder('templates')?.file('product.json', JSON.stringify(zenyaProductJson, null, 2))

  // 5.4 All Sections Demo Page (Kitchen Sink)
  const allSectionsJson = {
    "sections": {
      "hero_video": {
        "type": "zenya-video-hero",
        "settings": {
          "heading": content.video_hero?.heading || "Cinematic Excellence",
          "subheading": content.video_hero?.subheading || "Immerse yourself in the story behind the brand.",
          "cta_text": content.video_hero?.cta || "Watch Film"
        }
      },
      "scrolling_text": {
        "type": "zenya-scrolling-text",
        "blocks": (content.scrolling_text || ["Free Shipping", "Lifetime Warranty"]).reduce((acc, text, i) => ({
          ...acc,
          [`text_${i}`]: { "type": "text_block", "settings": { "text": text } }
        }), {}),
        "block_order": (content.scrolling_text || ["Free Shipping", "Lifetime Warranty"]).map((_, i) => `text_${i}`)
      },
      "slideshow": {
        "type": "zenya-slideshow",
        "blocks": (content.slideshow || []).reduce((acc, slide, i) => ({
          ...acc,
          [`slide_${i}`]: {
            "type": "slide",
            "settings": {
              "heading": slide.heading,
              "subheading": slide.subheading,
              "cta_text": slide.cta
            }
          }
        }), {}),
        "block_order": (content.slideshow || []).map((_, i) => `slide_${i}`)
      },
      "rich_text": {
        "type": "zenya-rich-text",
        "settings": {
          "title": content.rich_text?.title || "Our Philosophy",
          "text": content.rich_text?.text || "We are dedicated to providing premium quality products that enhance your daily life. Our commitment to excellence ensures you get the best."
        }
      },
      "logo_list": { "type": "zenya-logo-list" },
      "features": {
        "type": "zenya-features",
        "blocks": content.features.reduce((acc, f, i) => ({
          ...acc,
          [`feature_${i}`]: { "type": "feature", "settings": { "title": f.title, "desc": f.desc } }
        }), {}),
        "block_order": content.features.map((_, i) => `feature_${i}`)
      },
      "image_text": {
        "type": "zenya-image-text",
        "settings": {
          "title": content.image_text?.title || "Designed for Excellence",
          "text": content.image_text?.text || "Experience the perfect blend of style and functionality. Meticulously crafted to meet your highest standards.",
          "cta_text": content.image_text?.cta || "Discover More"
        }
      },
      "shoppable": { "type": "zenya-shoppable-image" },
      "featured_collection": { "type": "zenya-featured-collection" },
      "countdown": { "type": "zenya-countdown-banner" },
      "problem_solution": {
        "type": "zenya-problem-solution",
        "settings": {
          "problem_headline": content.problem.headline,
          "problem_text": content.problem.text,
          "solution_headline": content.solution.headline,
          "solution_text": content.solution.text
        }
      },
      "comparison": {
        "type": "zenya-comparison",
        "blocks": (content.comparison || []).reduce((acc, comp, i) => ({
          ...acc,
          [`comp_${i}`]: {
            "type": "feature_row",
            "settings": { "feature": comp.feature, "us_check": comp.us, "them_check": comp.them }
          }
        }), {}),
        "block_order": (content.comparison || []).map((_, i) => `comp_${i}`)
      },
      "tabs": { "type": "zenya-tabs" },
      "accordion": { "type": "zenya-accordion" },
      "timeline": {
        "type": "zenya-timeline",
        "blocks": (content.timeline || []).reduce((acc, t, i) => ({
          ...acc,
          [`timeline_${i}`]: { "type": "milestone", "settings": { "year": t.year, "title": t.title, "text": t.text } }
        }), {}),
        "block_order": (content.timeline || []).map((_, i) => `timeline_${i}`)
      },
      "map": { "type": "zenya-map" },
      "multicolumn": {
        "type": "zenya-multicolumn",
        "blocks": (content.multicolumn || []).reduce((acc, col, i) => ({
          ...acc,
          [`col_${i}`]: { "type": "column", "settings": { "title": col.title, "text": col.text } }
        }), {}),
        "block_order": (content.multicolumn || []).map((_, i) => `col_${i}`)
      },
      "video": { "type": "zenya-video" },
      "testimonials": {
        "type": "zenya-testimonials",
        "blocks": content.testimonials.reduce((acc, t, i) => ({
          ...acc,
          [`testimonial_${i}`]: { "type": "testimonial", "settings": { "name": t.name, "text": t.text, "location": t.location } }
        }), {}),
        "block_order": content.testimonials.map((_, i) => `testimonial_${i}`)
      },
      "contact": { "type": "zenya-contact" },
      "how_it_works": { "type": "zenya-how-it-works" },
      "visual_showcase": { "type": "zenya-visual-showcase" },
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "heading": content.newsletter?.title || "Join the Inner Circle",
          "text": content.newsletter?.text || "Unlock exclusive access to new releases, insider tips, and members-only offers."
        }
      }
    },
    "order": [
      "hero_video", "scrolling_text", "visual_showcase", "slideshow", "rich_text", "logo_list", 
      "features", "how_it_works", "image_text", "shoppable", "featured_collection", "countdown", 
      "problem_solution", "comparison", "tabs", "accordion", "timeline", 
      "map", "multicolumn", "video", "testimonials", "contact", "newsletter"
    ]
  }
  zip.folder('templates')?.file('page.sections.json', JSON.stringify(allSectionsJson, null, 2))

  // ==========================================
  // 8. 404 PAGE
  // ==========================================
  const notFoundSchema = {
    name: "404 Page",
    settings: [],
    presets: [{ name: "Zenya 404" }]
  }
  const notFoundLiquid = `
<div class="py-32 bg-slate-50 text-center min-h-[60vh] flex flex-col items-center justify-center">
  <div class="container mx-auto px-6">
    <h1 class="text-9xl font-extrabold text-slate-200 mb-4">404</h1>
    <h2 class="text-3xl font-bold text-slate-900 mb-6">Page Not Found</h2>
    <p class="text-slate-600 mb-8 max-w-md mx-auto">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
    <a href="{{ routes.root_url }}" class="inline-flex items-center justify-center rounded-full px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:opacity-90 hover:scale-105" style="background-color: {{ settings.primary_color }};">
      Back to Home
    </a>
  </div>
</div>
{% schema %}
${JSON.stringify(notFoundSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-404.liquid', notFoundLiquid)
  
  const notFoundJson = {
    "sections": { "main": { "type": "main-404" } },
    "order": ["main"]
  }
  zip.folder('templates')?.file('404.json', JSON.stringify(notFoundJson, null, 2))

  // Duplicate removed

  // ==========================================
  // 9. SEARCH PAGE
  // ==========================================
  const searchSchema = {
    name: "Search Page",
    settings: [],
    presets: [{ name: "Zenya Search" }]
  }
  const searchLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6">
    <h1 class="text-3xl font-extrabold text-slate-900 mb-8 text-center">Search Results</h1>
    
    <div class="max-w-2xl mx-auto mb-12">
      <form action="{{ routes.search_url }}" method="get" role="search" class="relative">
        <input type="search" name="q" value="{{ search.terms | escape }}" placeholder="Search products..." class="w-full pl-6 pr-12 py-4 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-lg">
        <button type="submit" class="absolute right-2 top-2 p-2 rounded-full bg-slate-900 text-white hover:bg-primary transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </form>
    </div>

    {% if search.performed %}
      {% if search.results_count == 0 %}
        <div class="text-center text-slate-500 py-12">
          <p class="text-xl">No results found for "{{ search.terms }}". Check the spelling or use a different keyword.</p>
        </div>
      {% else %}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {% for item in search.results %}
            {% if item.object_type == 'product' %}
              <a href="{{ item.url }}" class="group block">
                <div class="relative aspect-[1/1] overflow-hidden rounded-xl bg-slate-100 mb-4">
                  {% if item.featured_image %}
                    <img 
                      src="{{ item.featured_image | image_url: width: 600 }}" 
                      width="{{ item.featured_image.width }}"
                      height="{{ item.featured_image.height }}"
                      alt="{{ item.title }}" 
                      class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
                  {% else %}
                    {{ 'product-1' | placeholder_svg_tag: 'h-full w-full object-cover opacity-50' }}
                  {% endif %}
                </div>
                <h3 class="font-bold text-slate-900 group-hover:text-primary transition">{{ item.title }}</h3>
                <div class="font-bold text-slate-900 mt-1">{{ item.price | money }}</div>
              </a>
            {% endif %}
          {% endfor %}
        </div>
      {% endif %}
    {% endif %}
  </div>
</div>
{% schema %}
${JSON.stringify(searchSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-search.liquid', searchLiquid)
  
  const searchJson = {
    "sections": { "main": { "type": "main-search" } },
    "order": ["main"]
  }
  zip.folder('templates')?.file('search.json', JSON.stringify(searchJson, null, 2))

  // ==========================================
  // 10. GENERIC PAGE
  // ==========================================
  const pageSchema = {
    name: "Page",
    settings: [],
    presets: [{ name: "Zenya Page" }]
  }
  const pageLiquid = `
<div class="py-20 bg-white min-h-[50vh]">
  <div class="container mx-auto px-6 max-w-4xl">
    <h1 class="text-4xl font-extrabold text-slate-900 mb-8 text-center">{{ page.title }}</h1>
    <div class="prose prose-lg prose-slate mx-auto text-slate-600">
      {{ page.content }}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(pageSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-page.liquid', pageLiquid)

  const pageJson = {
    "sections": { "main": { "type": "main-page" } },
    "order": ["main"]
  }
  zip.folder('templates')?.file('page.json', JSON.stringify(pageJson, null, 2))

  // ==========================================
  // 11. BLOG PAGE
  // ==========================================
  const blogSchema = {
    name: "Blog",
    settings: [],
    presets: [{ name: "Zenya Blog" }]
  }
  const blogLiquid = `
{% paginate blog.articles by 12 %}
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6">
    <h1 class="text-4xl font-extrabold text-slate-900 mb-12 text-center">{{ blog.title }}</h1>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {% for article in blog.articles %}
        <article class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition group">
          <a href="{{ article.url }}" class="block">
            <div class="aspect-video bg-slate-200 overflow-hidden relative">
              {% if article.image %}
                <img src="{{ article.image | image_url: width: 800 }}" width="{{ article.image.width }}" height="{{ article.image.height }}" alt="{{ article.title }}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105">
              {% else %}
                {{ 'image' | placeholder_svg_tag: 'w-full h-full object-cover opacity-50' }}
              {% endif %}
              <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900">
                {{ article.published_at | date: "%B %d, %Y" }}
              </div>
            </div>
            <div class="p-8">
              <h2 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition">{{ article.title }}</h2>
              <div class="text-slate-600 mb-4 line-clamp-3">{{ article.excerpt_or_content | strip_html | truncatewords: 30 }}</div>
              <span class="text-primary font-bold text-sm uppercase tracking-wider">Read Article &rarr;</span>
            </div>
          </a>
        </article>
      {% endfor %}
    </div>
    
    {% if paginate.pages > 1 %}
      <div class="mt-12 text-center">
        {{ paginate | default_pagination }}
      </div>
    {% endif %}
  </div>
</div>
{% endpaginate %}
{% schema %}
${JSON.stringify(blogSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-blog.liquid', blogLiquid)

  const blogJson = {
    "sections": { "main": { "type": "main-blog" } },
    "order": ["main"]
  }
  zip.folder('templates')?.file('blog.json', JSON.stringify(blogJson, null, 2))

  // ==========================================
  // 12. ARTICLE PAGE
  // ==========================================
  const articleSchema = {
    name: "Article",
    settings: [],
    presets: [{ name: "Zenya Article" }]
  }
  const articleLiquid = `
<article class="py-20 bg-white min-h-[60vh]">
  {% if article.image %}
    <div class="w-full h-[400px] lg:h-[500px] mb-12 relative overflow-hidden">
      <img src="{{ article.image | image_url: width: 1600 }}" width="{{ article.image.width }}" height="{{ article.image.height }}" alt="{{ article.title }}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="container mx-auto px-6 text-center text-white">
          <h1 class="text-4xl lg:text-6xl font-extrabold mb-4">{{ article.title }}</h1>
          <div class="flex items-center justify-center gap-4 text-sm font-medium opacity-90">
            <span>{{ article.author }}</span>
            <span>&bull;</span>
            <span>{{ article.published_at | date: "%B %d, %Y" }}</span>
          </div>
        </div>
      </div>
    </div>
  {% else %}
    <div class="container mx-auto px-6 text-center mb-12">
      <h1 class="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">{{ article.title }}</h1>
      <div class="text-slate-500">{{ article.published_at | date: "%B %d, %Y" }}</div>
    </div>
  {% endif %}

  <div class="container mx-auto px-6 max-w-3xl">
    <div class="prose prose-lg prose-slate mx-auto">
      {{ article.content }}
    </div>
    
    <div class="mt-12 pt-8 border-t border-slate-200 text-center">
      <a href="{{ blog.url }}" class="text-primary font-bold hover:underline">&larr; Back to Blog</a>
    </div>
  </div>
</article>
{% schema %}
${JSON.stringify(articleSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-article.liquid', articleLiquid)

  const articleJson = {
    "sections": { "main": { "type": "main-article" } },
    "order": ["main"]
  }
  zip.folder('templates')?.file('article.json', JSON.stringify(articleJson, null, 2))

  // ==========================================
  // 13. LIST COLLECTIONS PAGE
  // ==========================================
  const listCollectionsSchema = {
    "name": "Collections List",
    "settings": [
      { "type": "text", "id": "title", "label": "Heading", "default": "All Collections" }
    ],
    "presets": [{ "name": "Zenya Collections List" }]
  }
  const listCollectionsLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6">
    <h1 class="text-4xl font-extrabold text-slate-900 mb-12 text-center">{{ section.settings.title }}</h1>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {% for collection in collections %}
        <a href="{{ collection.url }}" class="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg block">
          {% if collection.image != blank %}
            <img 
              src="{{ collection.image | image_url: width: 800 }}" 
              width="{{ collection.image.width }}" 
              height="{{ collection.image.height }}"
              alt="{{ collection.title }}" 
              class="h-full w-full object-cover transition duration-500 group-hover:scale-110">
          {% else %}
             {{ 'collection-1' | placeholder_svg_tag: 'h-full w-full object-cover bg-slate-200 transition duration-500 group-hover:scale-110' }}
          {% endif %}
          <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <h3 class="text-2xl font-bold text-white tracking-wide border-b-2 border-white/0 group-hover:border-white transition-all pb-1">
              {{ collection.title }}
            </h3>
          </div>
        </a>
      {% endfor %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(listCollectionsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-list-collections.liquid', listCollectionsLiquid)

  const listCollectionsJson = {
    "sections": { "main": { "type": "main-list-collections" } },
    "order": ["main"]
  }
  zip.folder('templates')?.file('list-collections.json', JSON.stringify(listCollectionsJson, null, 2))

  // ==========================================
  // 14. CUSTOMER PAGES (Login, Register, Account, Order)
  // ==========================================
  
  // Login
  const loginSchema = { "name": "Login", "settings": [] }
  const loginLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh] flex items-center justify-center">
  <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8 text-slate-900">Login</h1>
    {% form 'customer_login' %}
      {{ form.errors | default_errors }}
      <div class="space-y-4">
        <div>
          <label for="CustomerEmail" class="block text-sm font-bold text-slate-700 mb-1">Email</label>
          <input type="email" name="customer[email]" id="CustomerEmail" autocomplete="email" autocorrect="off" autocapitalize="off" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Email">
        </div>
        <div>
          <label for="CustomerPassword" class="block text-sm font-bold text-slate-700 mb-1">Password</label>
          <input type="password" value="" name="customer[password]" id="CustomerPassword" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Password">
        </div>
        <button type="submit" class="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:opacity-90 transition">Sign In</button>
      </div>
      <div class="mt-6 text-center text-sm text-slate-500">
        <a href="{{ routes.account_register_url }}" class="text-primary hover:underline">Create account</a> | <a href="{{ routes.account_login_url }}#recover" class="text-slate-500 hover:text-slate-700">Forgot password?</a>
      </div>
    {% endform %}
  </div>
</div>
{% schema %}
${JSON.stringify(loginSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-login.liquid', loginLiquid)
  zip.folder('templates')?.file('customers/login.json', JSON.stringify({ "sections": { "main": { "type": "main-login" } }, "order": ["main"] }, null, 2))

  // Register
  const registerSchema = { "name": "Register", "settings": [] }
  const registerLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh] flex items-center justify-center">
  <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8 text-slate-900">Create Account</h1>
    {% form 'create_customer' %}
      {{ form.errors | default_errors }}
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="FirstName" class="block text-sm font-bold text-slate-700 mb-1">First Name</label>
            <input type="text" name="customer[first_name]" id="FirstName" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
          <div>
            <label for="LastName" class="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
            <input type="text" name="customer[last_name]" id="LastName" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
        </div>
        <div>
          <label for="Email" class="block text-sm font-bold text-slate-700 mb-1">Email</label>
          <input type="email" name="customer[email]" id="Email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent">
        </div>
        <div>
          <label for="CreatePassword" class="block text-sm font-bold text-slate-700 mb-1">Password</label>
          <input type="password" name="customer[password]" id="CreatePassword" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent">
        </div>
        <button type="submit" class="w-full py-3 bg-primary text-white font-bold rounded-lg hover:brightness-110 transition" style="background-color: {{ settings.primary_color }};">Create</button>
      </div>
      <div class="mt-6 text-center text-sm text-slate-500">
        <a href="{{ routes.account_login_url }}" class="text-primary hover:underline">Already have an account? Login</a>
      </div>
    {% endform %}
  </div>
</div>
{% schema %}
${JSON.stringify(registerSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-register.liquid', registerLiquid)
  zip.folder('templates')?.file('customers/register.json', JSON.stringify({ "sections": { "main": { "type": "main-register" } }, "order": ["main"] }, null, 2))

  // Account
  const accountSchema = { "name": "Account", "settings": [] }
  const accountLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6 max-w-5xl">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">My Account</h1>
      <a href="{{ routes.account_logout_url }}" class="text-red-500 font-bold hover:underline">Logout</a>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div class="md:col-span-2 space-y-6">
        <h2 class="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Order History</h2>
        {% if customer.orders.size > 0 %}
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <table class="w-full text-left">
              <thead class="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                <tr>
                  <th class="p-4">Order</th>
                  <th class="p-4">Date</th>
                  <th class="p-4">Status</th>
                  <th class="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {% for order in customer.orders %}
                  <tr class="hover:bg-slate-50 transition">
                    <td class="p-4 font-bold text-primary">
                      <a href="{{ order.customer_url }}">{{ order.name }}</a>
                    </td>
                    <td class="p-4 text-slate-500">{{ order.created_at | date: "%b %d, %Y" }}</td>
                    <td class="p-4">
                      <span class="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{{ order.financial_status_label }}</span>
                      <span class="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{{ order.fulfillment_status_label }}</span>
                    </td>
                    <td class="p-4 text-right font-bold text-slate-900">{{ order.total_price | money }}</td>
                  </tr>
                {% endfor %}
              </tbody>
            </table>
          </div>
        {% else %}
          <div class="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
            <p>You haven't placed any orders yet.</p>
          </div>
        {% endif %}
      </div>
      
      <div>
        <h2 class="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Account Details</h2>
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <p class="font-bold text-slate-900 mb-2">{{ customer.name }}</p>
          <p class="text-slate-600 mb-4">{{ customer.email }}</p>
          {% if customer.default_address %}
            <div class="text-sm text-slate-500">
              <p>{{ customer.default_address.address1 }}</p>
              {% if customer.default_address.address2 != "" %}
                <p>{{ customer.default_address.address2 }}</p>
              {% endif %}
              <p>{{ customer.default_address.city }}, {{ customer.default_address.province_code }} {{ customer.default_address.zip }}</p>
              <p>{{ customer.default_address.country }}</p>
            </div>
          {% endif %}
          <a href="{{ routes.account_addresses_url }}" class="block mt-4 text-primary font-bold text-sm hover:underline">View Addresses ({{ customer.addresses_count }})</a>
        </div>
      </div>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(accountSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-account.liquid', accountLiquid)
  zip.folder('templates')?.file('customers/account.json', JSON.stringify({ "sections": { "main": { "type": "main-account" } }, "order": ["main"] }, null, 2))

  // Order
  const orderSchema = { "name": "Order", "settings": [] }
  const orderLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6 max-w-4xl">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Order {{ order.name }}</h1>
      <a href="{{ routes.account_url }}" class="text-primary font-bold hover:underline">&larr; Back to Account</a>
    </div>
    
    <div class="grid md:grid-cols-3 gap-8">
      <div class="md:col-span-2 space-y-6">
        <div class="bg-white rounded-xl shadow-sm overflow-hidden p-6">
           <div class="mb-4 text-sm text-slate-500">Placed on {{ order.created_at | date: "%B %d, %Y at %I:%M%p" }}</div>
           {% if order.cancelled %}
             <div class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
               <p class="font-bold">Order Cancelled on {{ order.cancelled_at | date: "%B %d, %Y" }}</p>
               <p class="text-sm">{{ order.cancel_reason_label }}</p>
             </div>
           {% endif %}
           
           <table class="w-full text-left">
             <tbody class="divide-y divide-slate-100">
               {% for line_item in order.line_items %}
                 <tr>
                   <td class="py-4">
                     <div class="font-bold text-slate-900">{{ line_item.title }}</div>
                     <div class="text-sm text-slate-500">{{ line_item.sku }}</div>
                   </td>
                   <td class="py-4 text-right">
                     <div class="text-slate-600">{{ line_item.quantity }} x {{ line_item.price | money }}</div>
                     <div class="font-bold text-slate-900">{{ line_item.final_line_price | money }}</div>
                   </td>
                 </tr>
               {% endfor %}
             </tbody>
             <tfoot class="border-t-2 border-slate-100">
               <tr>
                 <td class="py-4 font-bold text-slate-600">Subtotal</td>
                 <td class="py-4 text-right font-bold text-slate-900">{{ order.line_items_subtotal_price | money }}</td>
               </tr>
               <tr>
                 <td class="py-2 text-slate-600">Shipping</td>
                 <td class="py-2 text-right text-slate-900">{{ order.shipping_price | money }}</td>
               </tr>
               <tr>
                 <td class="py-2 text-slate-600">Tax</td>
                 <td class="py-2 text-right text-slate-900">{{ order.tax_price | money }}</td>
               </tr>
               <tr class="text-xl">
                 <td class="py-4 font-extrabold text-slate-900">Total</td>
                 <td class="py-4 text-right font-extrabold text-primary">{{ order.total_price | money }}</td>
               </tr>
             </tfoot>
           </table>
        </div>
      </div>
      
      <div>
        <div class="bg-white p-6 rounded-xl shadow-sm space-y-6">
          <div>
            <h3 class="font-bold text-slate-900 mb-2">Billing Address</h3>
            <div class="text-sm text-slate-500">
              <p>Payment Status: <span class="font-bold text-slate-700">{{ order.financial_status_label }}</span></p>
              <div class="mt-2">{{ order.billing_address | format_address }}</div>
            </div>
          </div>
          <div>
            <h3 class="font-bold text-slate-900 mb-2">Shipping Address</h3>
            <div class="text-sm text-slate-500">
              <p>Fulfillment Status: <span class="font-bold text-slate-700">{{ order.fulfillment_status_label }}</span></p>
              <div class="mt-2">{{ order.shipping_address | format_address }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(orderSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-order.liquid', orderLiquid)
  zip.folder('templates')?.file('customers/order.json', JSON.stringify({ "sections": { "main": { "type": "main-order" } }, "order": ["main"] }, null, 2))

  // ==========================================
  // 17. 404 PAGE
  // ==========================================
  {
    const notFoundSchema = { "name": "404 Page", "settings": [] }
    const notFoundLiquid = `
<div class="py-32 bg-slate-50 text-center min-h-[60vh] flex flex-col items-center justify-center">
  <div class="container mx-auto px-6">
    <div class="text-9xl mb-4">🤷‍♂️</div>
    <h1 class="text-4xl font-extrabold text-slate-900 mb-4">Page Not Found</h1>
    <p class="text-slate-600 mb-8 max-w-md mx-auto">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
    <a href="{{ routes.root_url }}" class="inline-flex items-center justify-center rounded-full px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:opacity-90 hover:scale-105" style="background-color: {{ settings.primary_color }};">{{ settings.start_shopping_label }}</a>
  </div>
</div>
{% schema %}
${JSON.stringify(notFoundSchema, null, 2)}
{% endschema %}
  `
    zip.folder('sections')?.file('main-404.liquid', notFoundLiquid)
    zip.folder('templates')?.file('404.json', JSON.stringify({ "sections": { "main": { "type": "main-404" } }, "order": ["main"] }, null, 2))
  }

  // ==========================================
  // 18. SEARCH PAGE
  // ==========================================
  {
  const searchSchema = { "name": "Search Page", "settings": [] }
  const searchLiquid = `
{% paginate search.results by 16 %}
<div class="py-20 bg-white min-h-[60vh]">
  <div class="container mx-auto px-6">
    <div class="max-w-3xl mx-auto text-center mb-16">
      <h1 class="text-4xl font-extrabold text-slate-900 mb-8">Search Results</h1>
      <form action="{{ routes.search_url }}" method="get" role="search" class="relative">
        <input
          type="search"
          name="q"
          value="{{ search.terms | escape }}"
          placeholder="Search for products..."
          class="w-full px-6 py-4 rounded-full border-2 border-slate-200 focus:border-primary focus:ring-primary text-lg"
        >
        <input type="hidden" name="type" value="product">
        <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-full hover:bg-primary hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
      </form>
    </div>

    {% if search.performed %}
      <div class="mb-8 text-center text-slate-500">
        {% if search.results_count == 0 %}
          <p>No results found for "{{ search.terms }}". Check the spelling or try a different keyword.</p>
        {% else %}
          <p>Showing {{ search.results_count }} results for "{{ search.terms }}"</p>
        {% endif %}
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {% for item in search.results %}
          {% if item.object_type == 'product' %}
            <div class="group">
              <div class="relative aspect-[3/4] mb-4 overflow-hidden rounded-xl bg-slate-100">
                {% if item.featured_image %}
                  <img 
                    src="{{ item.featured_image | image_url: width: 600 }}" 
                    alt="{{ item.featured_image.alt | escape }}"
                    width="{{ item.featured_image.width }}"
                    height="{{ item.featured_image.height }}"
                    class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  >
                {% else %}
                  {{ 'product-1' | placeholder_svg_tag: 'h-full w-full object-cover opacity-50' }}
                {% endif %}
                
                <button class="absolute bottom-4 right-4 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-900 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 hover:bg-primary hover:text-white" onclick="window.location.href='{{ item.url }}'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                </button>
              </div>
              
              <h3 class="text-sm font-bold text-slate-900 mb-1">
                <a href="{{ item.url }}" class="hover:text-primary transition">{{ item.title }}</a>
              </h3>
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium text-slate-900">{{ item.price | money }}</span>
                {% if item.compare_at_price > item.price %}
                  <span class="text-slate-400 line-through text-xs">{{ item.compare_at_price | money }}</span>
                {% endif %}
              </div>
            </div>
          {% endif %}
        {% endfor %}
      </div>

      {% if paginate.pages > 1 %}
        <div class="mt-16 text-center">
          {{ paginate | default_pagination }}
        </div>
      {% endif %}
    {% endif %}
  </div>
</div>
{% endpaginate %}
{% schema %}
${JSON.stringify(searchSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-search.liquid', searchLiquid)
  }

  const mustHaveFiles = [
    'layout/theme.liquid',
    'config/settings_schema.json',
    'config/settings_data.json',
    'sections/header-group.json',
    'sections/footer-group.json',
    'sections/zenya-header.liquid',
    'sections/zenya-footer.liquid',
    'sections/zenya-features.liquid',
    'templates/index.json',
    'templates/product.json',
    'templates/cart.json',
    'templates/collection.json',
  ]
  const missing = mustHaveFiles.filter((p) => !zip.file(p))
  if (missing.length) {
    throw new Error(`Theme build missing files: ${missing.join(', ')}`)
  }

  return zip
}

export function prepareThemeZipFromZero(name: string, content: ThemeContent, colors: { primary: string; secondary: string }, images: string[] = []): JSZip {
  const zip = new JSZip()
  const safeShopName = content.shopName || name

  const settingsSchema = [
    {
      "name": "theme_info",
      "theme_name": "Zenya Nova",
      "theme_version": "2.0.0",
      "theme_author": "Zenya AI",
      "theme_documentation_url": "https://zenya.ai",
      "theme_support_url": "https://zenya.ai"
    },
    {
      "name": "Design",
      "settings": [
        { "type": "header", "content": "Brand" },
        { "type": "text", "id": "brand_name", "label": "Brand Name", "default": safeShopName },
        { "type": "color", "id": "primary_color", "label": "Primary Color", "default": colors.primary },
        { "type": "color", "id": "secondary_color", "label": "Secondary Color", "default": colors.secondary },
        { "type": "header", "content": "Typography" },
        { "type": "select", "id": "font_style", "label": "Font Style", "default": "system", "options": [
          { "value": "system", "label": "System" },
          { "value": "serif", "label": "Serif" }
        ]},
        { "type": "header", "content": "Motion" },
        { "type": "checkbox", "id": "motion_enabled", "label": "Enable Animations", "default": true },
        { "type": "range", "id": "motion_strength", "label": "Animation Intensity", "min": 0, "max": 100, "step": 5, "default": 65 }
      ]
    },
    {
      "name": "Actions",
      "settings": [
        { "type": "text", "id": "add_to_cart_label", "label": "Add to Cart Label", "default": "Add to Cart" },
        { "type": "text", "id": "checkout_label", "label": "Checkout Label", "default": content.cart_drawer?.checkout_cta || "Checkout" }
      ]
    }
  ]
  zip.folder('config')?.file('settings_schema.json', JSON.stringify(settingsSchema, null, 2))

  const settingsData = {
    "current": "Zenya Nova",
    "presets": {
      "Zenya Nova": {
        "brand_name": safeShopName,
        "primary_color": colors.primary,
        "secondary_color": colors.secondary,
        "font_style": "system",
        "motion_enabled": true,
        "motion_strength": 65,
        "add_to_cart_label": "Add to Cart",
        "checkout_label": content.cart_drawer?.checkout_cta || "Checkout"
      }
    }
  }
  zip.folder('config')?.file('settings_data.json', JSON.stringify(settingsData, null, 2))

  zip.folder('locales')?.file(
    'en.default.json',
    JSON.stringify(
      {
        general: {
          password_page: {
            login_form_heading: 'Enter store using password',
            login_password_button: 'Enter using password',
          },
        },
      },
      null,
      2
    )
  )

  zip.folder('assets')?.file('alpine.js', ALPINE_JS)
  zip.folder('assets')?.file('tailwind.js', TAILWIND_JS)

  const layout = `
<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ page_title }}</title>
    {{ content_for_header }}
    <script>document.documentElement.className = document.documentElement.className.replace('no-js', 'js');</script>
    <script defer src="{{ 'tailwind.js' | asset_url }}"></script>
    <script>
      window.tailwind = window.tailwind || {};
      window.tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '{{ settings.primary_color }}',
              secondary: '{{ settings.secondary_color }}',
            }
          }
        }
      }
    </script>
    <script defer src="{{ 'alpine.js' | asset_url }}"></script>
    <style>
      [x-cloak] { display: none !important; }
      body {
        font-family: {% if settings.font_style == 'serif' %}ui-serif, Georgia, Cambria, "Times New Roman", Times, serif{% else %}system-ui, -apple-system, sans-serif{% endif %};
        -webkit-font-smoothing: antialiased;
        background: #f8fafc;
        color: #0f172a;
      }
      .zenya-motion { will-change: transform, opacity; }
      @media (prefers-reduced-motion: reduce) { .zenya-motion { animation: none !important; transition: none !important; } }
      @keyframes zenyaFloat { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(40px, -30px, 0) scale(1.06); } }
      @keyframes zenyaFloatReverse { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(-34px, 28px, 0) scale(1.05); } }
      @keyframes zenyaGradientShift { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .22; } 50% { transform: translate3d(0, -18px, 0) scale(1.04); opacity: .28; } }
      .zenya-blob { position: absolute; width: 32rem; height: 32rem; border-radius: 9999px; filter: blur(46px); opacity: .22; mix-blend-mode: multiply; }
      .zenya-blob--a { top: -14rem; left: -14rem; animation: zenyaFloat 10s ease-in-out infinite; }
      .zenya-blob--b { bottom: -16rem; right: -16rem; animation: zenyaFloatReverse 11s ease-in-out infinite; }
      .zenya-sheen { animation: zenyaGradientShift 9s ease-in-out infinite; }
    </style>
  </head>
  <body>
    {% sections 'header-group' %}
    <main id="MainContent" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
  </body>
</html>
  `
  zip.folder('layout')?.file('theme.liquid', layout)

  const headerGroup = {
    name: "Header",
    sections: { header: { type: "zenya-nova-header", settings: {} } },
    order: ["header"]
  }
  zip.folder('sections')?.file('header-group.json', JSON.stringify(headerGroup, null, 2))

  const footerGroup = {
    name: "Footer",
    sections: { footer: { type: "zenya-nova-footer", settings: {} } },
    order: ["footer"]
  }
  zip.folder('sections')?.file('footer-group.json', JSON.stringify(footerGroup, null, 2))

  const novaHeaderSchema = {
    name: "Nova Header",
    enabled_on: { groups: ["header"] },
    settings: [
      { type: "image_picker", id: "logo", label: "Logo" },
      { type: "range", id: "logo_width", label: "Logo Width", min: 80, max: 220, step: 10, default: 140, unit: "px" },
      { type: "link_list", id: "menu", label: "Menu", default: "main-menu" },
      { type: "checkbox", id: "sticky", label: "Sticky Header", default: true },
      { type: "header", content: "Announcement" },
      { type: "checkbox", id: "show_announcement", label: "Show Announcement", default: true },
      { type: "text", id: "announcement_text", label: "Announcement Text", default: content.countdown?.heading || "Free shipping today • Limited stock" },
      { type: "url", id: "announcement_link", label: "Announcement Link" },
      { type: "header", content: "CTA" },
      { type: "checkbox", id: "show_cta", label: "Show CTA", default: true },
      { type: "text", id: "cta_label", label: "CTA Label", default: content.hero.cta },
      { type: "url", id: "cta_link", label: "CTA Link" }
    ],
    presets: [{ name: "Zenya Nova Header" }]
  }

  const novaHeaderLiquid = `
<header class="bg-white/80 backdrop-blur border-b border-slate-200 {% if section.settings.sticky %}sticky top-0 z-40{% endif %}">
  {% if section.settings.show_announcement %}
    {% assign ann_link = section.settings.announcement_link %}
    <div class="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider" style="background: {{ settings.primary_color }}; color: white;">
      {% if ann_link != blank %}
        <a href="{{ ann_link }}" class="underline decoration-white/40 hover:decoration-white transition">{{ section.settings.announcement_text }}</a>
      {% else %}
        {{ section.settings.announcement_text }}
      {% endif %}
    </div>
  {% endif %}
  <div class="container mx-auto px-6 py-4 flex items-center justify-between gap-6">
    <div class="flex items-center gap-3">
      <a href="{{ routes.root_url }}" class="no-underline text-slate-900 font-extrabold tracking-tight text-xl">
        {% if section.settings.logo != blank %}
          {{ section.settings.logo | image_url: width: 480 | image_tag: class: 'h-auto', style: 'max-width: ' | append: section.settings.logo_width | append: 'px;' }}
        {% else %}
          {{ settings.brand_name | default: shop.name }}
        {% endif %}
      </a>
    </div>

    <nav class="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700">
      {% for link in linklists[section.settings.menu].links %}
        <a href="{{ link.url }}" class="hover:text-primary transition">{{ link.title }}</a>
      {% else %}
        <a href="{{ routes.root_url }}" class="hover:text-primary transition">Home</a>
        <a href="{{ routes.all_products_collection_url }}" class="hover:text-primary transition">Shop</a>
      {% endfor %}
    </nav>

    <div class="flex items-center gap-3">
      {% assign cta_href = section.settings.cta_link %}
      {% if cta_href == blank %}{% assign cta_href = routes.all_products_collection_url %}{% endif %}
      {% if section.settings.show_cta %}
        <a href="{{ cta_href }}" class="hidden sm:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]" style="background: {{ settings.primary_color }};">
          {{ section.settings.cta_label }}
        </a>
      {% endif %}
      <a href="{{ routes.cart_url }}" class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 transition" aria-label="Cart">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
      </a>
    </div>
  </div>
</header>
{% schema %}
${JSON.stringify(novaHeaderSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-header.liquid', novaHeaderLiquid)

  const novaFooterSchema = {
    name: "Nova Footer",
    enabled_on: { groups: ["footer"] },
    settings: [
      { type: "textarea", id: "tagline", label: "Tagline", default: "Built for conversion. Designed for trust. Made to scale." },
      { type: "link_list", id: "menu_1", label: "Menu 1", default: "footer" },
      { type: "link_list", id: "menu_2", label: "Menu 2", default: "main-menu" },
      { type: "text", id: "copyright", label: "Copyright", default: `© ${new Date().getFullYear()} ${safeShopName}. All rights reserved.` }
    ],
    presets: [{ name: "Zenya Nova Footer" }]
  }

  const novaFooterLiquid = `
<footer class="bg-slate-950 text-white">
  <div class="container mx-auto px-6 py-14">
    <div class="grid gap-10 md:grid-cols-4">
      <div class="md:col-span-2">
        <div class="text-2xl font-extrabold tracking-tight mb-3">{{ settings.brand_name | default: shop.name }}</div>
        <div class="text-slate-300 max-w-md whitespace-pre-line">{{ section.settings.tagline }}</div>
        <div class="mt-6 flex flex-wrap gap-2 opacity-90">
          {% for type in shop.enabled_payment_types %}
            <div class="h-9 bg-white rounded px-2 flex items-center">
              {{ type | payment_type_svg_tag: class: 'h-5' }}
            </div>
          {% endfor %}
        </div>
      </div>
      <div>
        <div class="font-bold mb-3">{{ linklists[section.settings.menu_1].title | default: 'Shop' }}</div>
        <ul class="space-y-2 text-sm text-slate-300">
          {% for link in linklists[section.settings.menu_1].links %}
            <li><a class="hover:text-white transition" href="{{ link.url }}">{{ link.title }}</a></li>
          {% endfor %}
        </ul>
      </div>
      <div>
        <div class="font-bold mb-3">{{ linklists[section.settings.menu_2].title | default: 'Support' }}</div>
        <ul class="space-y-2 text-sm text-slate-300">
          {% for link in linklists[section.settings.menu_2].links %}
            <li><a class="hover:text-white transition" href="{{ link.url }}">{{ link.title }}</a></li>
          {% endfor %}
        </ul>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-white/10 text-sm text-slate-400 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div>{{ section.settings.copyright }}</div>
      <div class="flex gap-4">
        <a class="hover:text-white transition" href="{{ routes.privacy_policy_url | default: routes.root_url }}">Privacy</a>
        <a class="hover:text-white transition" href="{{ routes.terms_of_service_url | default: routes.root_url }}">Terms</a>
      </div>
    </div>
  </div>
</footer>
{% schema %}
${JSON.stringify(novaFooterSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-footer.liquid', novaFooterLiquid)

  const novaHeroSchema = {
    name: "Nova Hero",
    settings: [
      { type: "text", id: "headline", label: "Headline", default: content.hero.headline },
      { type: "textarea", id: "subheadline", label: "Subheadline", default: content.hero.subheadline },
      { type: "text", id: "cta_label", label: "CTA Label", default: content.hero.cta },
      { type: "url", id: "cta_link", label: "CTA Link" },
      { type: "image_picker", id: "image", label: "Image" },
      { type: "text", id: "external_image_url", label: "External Image URL (Fallback)", default: images[0] || "" },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: true },
      { type: "textarea", id: "badge_text", label: "Badge Text", default: "Trusted by 10k+ customers" }
    ],
    presets: [{ name: "Zenya Nova Hero" }]
  }

  const novaHeroLiquid = `
<section class="relative overflow-hidden bg-white">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.primary_color }}, transparent 70%); animation-duration: {{ 16 | minus: settings.motion_strength | at_least: 8 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.secondary_color }}, transparent 70%); animation-duration: {{ 18 | minus: settings.motion_strength | at_least: 9 }}s;"></div>
      <div class="absolute inset-0 zenya-sheen zenya-motion" style="background: radial-gradient(circle at 20% 10%, {{ settings.secondary_color }}, transparent 55%), radial-gradient(circle at 90% 60%, {{ settings.primary_color }}, transparent 55%);"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 py-20 lg:py-28 grid gap-14 lg:grid-cols-2 items-center relative">
    <div>
      <div class="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-extrabold uppercase tracking-wider mb-6">
        <span class="h-2 w-2 rounded-full bg-green-400"></span>
        <span>{{ section.settings.badge_text }}</span>
      </div>
      <h1 class="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.02] text-slate-900">{{ section.settings.headline }}</h1>
      <p class="mt-6 text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">{{ section.settings.subheadline }}</p>
      {% assign hero_link = section.settings.cta_link %}
      {% if hero_link == blank %}{% assign hero_link = routes.all_products_collection_url %}{% endif %}
      <div class="mt-10 flex flex-wrap items-center gap-4">
        <a href="{{ hero_link }}" class="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-extrabold text-white shadow-xl transition hover:opacity-90 active:scale-[0.98]" style="background: {{ settings.primary_color }};">
          {{ section.settings.cta_label }}
        </a>
        <a href="#zenya-nova-proof" class="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-bold text-slate-900 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition">
          See results
        </a>
      </div>
      <div class="mt-10 grid grid-cols-3 gap-3 max-w-md text-xs text-slate-700">
        <div class="rounded-2xl bg-white/80 backdrop-blur border border-slate-100 p-4 shadow-sm">
          <div class="font-extrabold text-slate-900 text-sm">Fast</div>
          <div class="opacity-80">Shipping</div>
        </div>
        <div class="rounded-2xl bg-white/80 backdrop-blur border border-slate-100 p-4 shadow-sm">
          <div class="font-extrabold text-slate-900 text-sm">30-day</div>
          <div class="opacity-80">Returns</div>
        </div>
        <div class="rounded-2xl bg-white/80 backdrop-blur border border-slate-100 p-4 shadow-sm">
          <div class="font-extrabold text-slate-900 text-sm">Secure</div>
          <div class="opacity-80">Checkout</div>
        </div>
      </div>
    </div>
    <div class="relative">
      <div class="relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-2xl border border-slate-200">
        {% if section.settings.image != blank %}
          {{ section.settings.image | image_url: width: 1400 | image_tag: class: 'w-full object-cover aspect-[4/3]' }}
        {% elsif section.settings.external_image_url != blank %}
          <img src="{{ section.settings.external_image_url }}" class="w-full object-cover aspect-[4/3]" alt="{{ section.settings.headline }}">
        {% else %}
          {{ 'lifestyle-1' | placeholder_svg_tag: 'w-full bg-slate-100 aspect-[4/3]' }}
        {% endif %}
      </div>
      <div class="absolute -bottom-6 -left-6 rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-lg p-5 zenya-motion" {% if settings.motion_enabled %}style="animation: zenyaFloat 8s ease-in-out infinite;"{% endif %}>
        <div class="text-xs font-extrabold text-slate-900">Live support</div>
        <div class="text-xs text-slate-600 mt-1">We respond fast and help you pick the right option.</div>
      </div>
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(novaHeroSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-hero.liquid', novaHeroLiquid)

  const novaBenefitsSchema = {
    name: "Nova Benefits",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: `Why ${name} works` },
      { type: "textarea", id: "subheading", label: "Subheading", default: "Clean benefits, fast scanning, strong trust." },
      { type: "checkbox", id: "enable_bg_motion", label: "Enable Background Motion", default: false },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" }
    ],
    blocks: [
      {
        type: "benefit",
        name: "Benefit",
        settings: [
          { type: "text", id: "title", label: "Title", default: "Premium build" },
          { type: "textarea", id: "text", label: "Text", default: "Designed to look and feel expensive." },
          { type: "select", id: "icon", label: "Icon", default: "sparkle", options: [
            { value: "sparkle", label: "Sparkle" },
            { value: "shield", label: "Shield" },
            { value: "truck", label: "Truck" },
            { value: "leaf", label: "Leaf" }
          ]}
        ]
      }
    ],
    presets: [{ name: "Zenya Nova Benefits" }]
  }

  const novaBenefitsLiquid = `
<section class="relative overflow-hidden py-20" style="background-color: {{ section.settings.bg_color }};">
  {% if settings.motion_enabled and section.settings.enable_bg_motion %}
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="zenya-blob zenya-blob--a zenya-motion" style="background: radial-gradient(circle at 30% 30%, {{ settings.secondary_color }}, transparent 70%); opacity: .12; animation-duration: {{ 22 | minus: settings.motion_strength | at_least: 11 }}s;"></div>
      <div class="zenya-blob zenya-blob--b zenya-motion" style="background: radial-gradient(circle at 70% 70%, {{ settings.primary_color }}, transparent 70%); opacity: .10; animation-duration: {{ 24 | minus: settings.motion_strength | at_least: 12 }}s;"></div>
    </div>
  {% endif %}
  <div class="container mx-auto px-6 relative">
    <div class="mx-auto mb-12 max-w-3xl text-center">
      <h2 class="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">{{ section.settings.heading }}</h2>
      <p class="mt-3 text-slate-600">{{ section.settings.subheading }}</p>
    </div>
    <div class="grid gap-6 md:grid-cols-3">
      {% for block in section.blocks %}
        <div class="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 hover:shadow-md transition">
          <div class="h-12 w-12 rounded-2xl flex items-center justify-center mb-6" style="background: color-mix(in srgb, {{ settings.primary_color }} 14%, white); color: {{ settings.primary_color }};">
            {% case block.settings.icon %}
              {% when 'truck' %}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 104 0m-4 0a2 2 0 104 0m-4 0H7a4 4 0 01-4-4V5a2 2 0 012-2h8a2 2 0 012 2v8a4 4 0 01-4 4H9zm8 0h2a2 2 0 002-2v-3a2 2 0 00-.586-1.414l-2-2A2 2 0 0016.828 8H15v9z"/></svg>
              {% when 'shield' %}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l8 4v6c0 5-3.5 9.4-8 11-4.5-1.6-8-6-8-11V7l8-4z"/></svg>
              {% when 'leaf' %}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 21c8 0 14-6 14-14V3h-4C7 3 1 9 1 17v4h4z"/></svg>
              {% else %}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/></svg>
            {% endcase %}
          </div>
          <div class="text-xl font-extrabold text-slate-900">{{ block.settings.title }}</div>
          <div class="mt-2 text-sm text-slate-600 leading-relaxed">{{ block.settings.text }}</div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(novaBenefitsSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-benefits.liquid', novaBenefitsLiquid)

  const novaProofSchema = {
    name: "Nova Social Proof",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Real people. Real results." },
      { type: "textarea", id: "subheading", label: "Subheading", default: "UGC-style quotes that build trust fast." },
      { type: "color", id: "bg_color", label: "Background Color", default: "#0f172a" }
    ],
    blocks: [
      {
        type: "quote",
        name: "Quote",
        settings: [
          { type: "text", id: "name", label: "Name", default: "Alex M." },
          { type: "text", id: "meta", label: "Meta", default: "Verified buyer" },
          { type: "range", id: "rating", label: "Rating", min: 1, max: 5, step: 1, default: 5 },
          { type: "textarea", id: "text", label: "Text", default: "Looks premium and works perfectly." },
          { type: "image_picker", id: "image", label: "Image (Optional)" }
        ]
      }
    ],
    presets: [{ name: "Zenya Nova Social Proof" }]
  }

  const novaProofLiquid = `
<section class="py-24" id="zenya-nova-proof" style="background-color: {{ section.settings.bg_color }};">
  <div class="container mx-auto px-6">
    <div class="mx-auto mb-12 max-w-3xl text-center">
      <h2 class="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">{{ section.settings.heading }}</h2>
      <p class="mt-3 text-slate-300">{{ section.settings.subheading }}</p>
    </div>
    <div class="grid gap-6 md:grid-cols-3">
      {% for block in section.blocks %}
        <div class="rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
          <div class="flex items-center justify-between mb-4">
            <div class="text-yellow-300 text-sm tracking-wide">
              {% for i in (1..block.settings.rating) %}★{% endfor %}
            </div>
            <div class="text-xs text-slate-300">{{ block.settings.meta }}</div>
          </div>
          <div class="text-slate-100 font-semibold leading-relaxed">&ldquo;{{ block.settings.text }}&rdquo;</div>
          <div class="mt-6 flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white">
              {% if block.settings.image != blank %}
                {{ block.settings.image | image_url: width: 120 | image_tag: class: 'h-full w-full object-cover' }}
              {% else %}
                {{ block.settings.name | slice: 0, 1 }}
              {% endif %}
            </div>
            <div>
              <div class="text-white font-bold">{{ block.settings.name }}</div>
              <div class="text-xs text-slate-300">Verified purchase</div>
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(novaProofSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-social-proof.liquid', novaProofLiquid)

  const novaFaqSchema = {
    name: "Nova FAQ",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "FAQ" },
      { type: "textarea", id: "subheading", label: "Subheading", default: "Everything you need to know before you buy." }
    ],
    blocks: [
      {
        type: "faq",
        name: "FAQ Item",
        settings: [
          { type: "text", id: "q", label: "Question", default: "How long does shipping take?" },
          { type: "textarea", id: "a", label: "Answer", default: "Shipping usually takes 3–5 business days." }
        ]
      }
    ],
    presets: [{ name: "Zenya Nova FAQ" }]
  }

  const novaFaqLiquid = `
<section class="py-24 bg-white">
  <div class="container mx-auto px-6 max-w-4xl">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">{{ section.settings.heading }}</h2>
      <p class="mt-3 text-slate-600">{{ section.settings.subheading }}</p>
    </div>
    <div class="space-y-4" x-data="{ active: 0 }">
      {% for block in section.blocks %}
        <div class="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-5">
          <button @click="active = (active === {{ forloop.index0 }} ? null : {{ forloop.index0 }})" class="flex w-full items-center justify-between text-left font-extrabold text-slate-900">
            <span class="text-lg">{{ block.settings.q }}</span>
            <span class="ml-4 transform transition-transform duration-200" :class="active === {{ forloop.index0 }} ? 'rotate-180' : ''">▼</span>
          </button>
          <div 
            x-show="active === {{ forloop.index0 }}" 
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0 -translate-y-1"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-in duration-150"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 -translate-y-1"
            class="mt-4 text-slate-600 leading-relaxed"
            x-cloak
          >
            {{ block.settings.a }}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(novaFaqSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-faq.liquid', novaFaqLiquid)

  const novaGuaranteeSchema = {
    name: "Nova Guarantee",
    settings: [
      { type: "text", id: "title", label: "Title", default: content.guarantee?.title || "Risk-Free Guarantee" },
      { type: "textarea", id: "text", label: "Text", default: content.guarantee?.text || "Try it risk-free. If you don’t love it, we’ll refund you." },
      { type: "text", id: "icon", label: "Icon", default: "🛡️" }
    ],
    presets: [{ name: "Zenya Nova Guarantee" }]
  }

  const novaGuaranteeLiquid = `
<section class="py-24 bg-slate-50">
  <div class="container mx-auto px-6 max-w-3xl text-center">
    <div class="rounded-[2rem] bg-white border border-slate-100 shadow-xl p-12">
      <div class="text-6xl mb-6">{{ section.settings.icon }}</div>
      <h2 class="text-3xl font-extrabold text-slate-900">{{ section.settings.title }}</h2>
      <p class="mt-4 text-slate-600 leading-relaxed">{{ section.settings.text }}</p>
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(novaGuaranteeSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-guarantee.liquid', novaGuaranteeLiquid)

  const novaNewsletterSchema = {
    name: "Nova Newsletter",
    settings: [
      { type: "text", id: "title", label: "Title", default: content.newsletter?.title || "Get deals before anyone else" },
      { type: "textarea", id: "text", label: "Text", default: content.newsletter?.text || "Subscribe for drops, discounts, and product updates." },
      { type: "text", id: "placeholder", label: "Email Placeholder", default: "Enter your email" },
      { type: "text", id: "button_text", label: "Button Text", default: "Subscribe" }
    ],
    presets: [{ name: "Zenya Nova Newsletter" }]
  }

  const novaNewsletterLiquid = `
<section class="py-20 bg-white">
  <div class="container mx-auto px-6 max-w-2xl text-center">
    <div class="rounded-[2rem] border border-slate-100 bg-slate-50 p-10 shadow-sm">
      <h2 class="text-3xl font-extrabold text-slate-900">{{ section.settings.title }}</h2>
      <p class="mt-3 text-slate-600">{{ section.settings.text }}</p>
      <form method="post" action="/contact#contact_form" accept-charset="UTF-8" class="mt-8">
        <input type="hidden" name="form_type" value="customer">
        <input type="hidden" name="utf8" value="✓">
        <div class="flex flex-col sm:flex-row gap-3">
          <input type="email" name="contact[email]" class="w-full rounded-full border border-slate-200 px-5 py-4 text-base focus:border-primary focus:ring-primary" placeholder="{{ section.settings.placeholder }}" required>
          <button type="submit" class="rounded-full px-8 py-4 text-base font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]" style="background: {{ settings.primary_color }};">
            {{ section.settings.button_text }}
          </button>
        </div>
      </form>
      <div class="mt-4 text-xs text-slate-500">No spam. Unsubscribe anytime.</div>
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(novaNewsletterSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-nova-newsletter.liquid', novaNewsletterLiquid)

  const mainProductSchema = {
    name: "Main Product",
    settings: [
      { type: "checkbox", id: "show_trust", label: "Show Trust Row", default: true },
      { type: "text", id: "trust_text", label: "Trust Text", default: "Secure checkout • Fast shipping • Easy returns" }
    ],
    presets: [{ name: "Zenya Nova Product" }]
  }

  const mainProductLiquid = `
<section class="bg-white">
  <div class="container mx-auto px-6 py-10 lg:py-16">
    <div class="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
      <div class="rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
        {% if product.featured_image %}
          {{ product.featured_image | image_url: width: 1400 | image_tag: class: 'w-full object-cover aspect-square' }}
        {% else %}
          {{ 'product-1' | placeholder_svg_tag: 'w-full aspect-square bg-slate-100' }}
        {% endif %}
      </div>
      <div>
        <h1 class="text-3xl lg:text-5xl font-extrabold tracking-tight text-slate-900">{{ product.title }}</h1>
        <div class="mt-5 flex items-end gap-3">
          <div class="text-3xl font-extrabold text-slate-900">{{ product.selected_or_first_available_variant.price | money }}</div>
          {% if product.selected_or_first_available_variant.compare_at_price > product.selected_or_first_available_variant.price %}
            <div class="text-slate-400 line-through mb-1">{{ product.selected_or_first_available_variant.compare_at_price | money }}</div>
          {% endif %}
        </div>
        {% if product.description != blank %}
          <div class="mt-6 text-slate-600 leading-relaxed">{{ product.description }}</div>
        {% endif %}
        {% form 'product', product, class: 'mt-8 space-y-4' %}
          {% if product.variants.size > 1 %}
            <div>
              <label class="block text-sm font-bold text-slate-900 mb-2">Choose an option</label>
              <select name="id" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base focus:border-primary focus:ring-primary">
                {% for variant in product.variants %}
                  <option value="{{ variant.id }}" {% if variant.id == product.selected_or_first_available_variant.id %}selected{% endif %}>
                    {{ variant.title }} — {{ variant.price | money }}
                  </option>
                {% endfor %}
              </select>
            </div>
          {% else %}
            <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
          {% endif %}
          <div class="flex items-center gap-3">
            <input type="number" name="quantity" value="1" min="1" class="w-24 rounded-2xl border border-slate-200 px-4 py-3 text-base">
            <button type="submit" class="flex-1 rounded-full px-8 py-4 text-base font-extrabold text-white shadow-xl transition hover:opacity-90 active:scale-[0.98]" style="background: {{ settings.primary_color }};">
              {{ settings.add_to_cart_label | default: 'Add to Cart' }}
            </button>
          </div>
        {% endform %}
        {% if section.settings.show_trust %}
          <div class="mt-6 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm text-slate-700">
            {{ section.settings.trust_text }}
          </div>
        {% endif %}
      </div>
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(mainProductSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-product.liquid', mainProductLiquid)

  const mainCartSchema = {
    name: "Main Cart",
    settings: [],
    presets: [{ name: "Zenya Nova Cart" }]
  }

  const mainCartLiquid = `
<section class="bg-white">
  <div class="container mx-auto px-6 py-12">
    <h1 class="text-3xl font-extrabold text-slate-900">Your cart</h1>
    {% if cart.item_count == 0 %}
      <div class="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-10 text-center">
        <div class="text-slate-600">Your cart is empty.</div>
        <a class="mt-6 inline-flex rounded-full px-8 py-4 font-extrabold text-white shadow-sm transition hover:opacity-90" style="background: {{ settings.primary_color }};" href="{{ routes.all_products_collection_url }}">
          Continue shopping
        </a>
      </div>
    {% else %}
      <form action="{{ routes.cart_url }}" method="post" class="mt-8 grid gap-8 lg:grid-cols-3 items-start">
        <div class="lg:col-span-2 space-y-4">
          {% for item in cart.items %}
            <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex gap-5">
              <div class="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {% if item.image %}
                  <img src="{{ item.image | image_url: width: 240 }}" alt="{{ item.product.title | escape }}" class="h-full w-full object-cover">
                {% endif %}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <a href="{{ item.url }}" class="font-extrabold text-slate-900 hover:text-primary transition">{{ item.product.title }}</a>
                    <div class="text-sm text-slate-500">{{ item.variant.title }}</div>
                  </div>
                  <div class="font-extrabold text-slate-900">{{ item.final_line_price | money }}</div>
                </div>
                <div class="mt-4 flex items-center justify-between gap-4">
                  <input class="w-28 rounded-2xl border border-slate-200 px-4 py-2" type="number" name="updates[]" value="{{ item.quantity }}" min="0">
                  <a class="text-sm font-bold text-red-600 hover:underline" href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity=0">Remove</a>
                </div>
              </div>
            </div>
          {% endfor %}
        </div>
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-8 shadow-sm">
          <div class="flex items-center justify-between text-slate-900 font-extrabold">
            <div>Subtotal</div>
            <div>{{ cart.total_price | money }}</div>
          </div>
          <button class="mt-6 w-full rounded-full px-8 py-4 text-base font-extrabold text-white shadow-xl transition hover:opacity-90 active:scale-[0.98]" style="background: {{ settings.primary_color }};" type="submit" name="checkout">
            {{ settings.checkout_label | default: 'Checkout' }}
          </button>
          <button class="mt-3 w-full rounded-full px-8 py-4 text-base font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition" type="submit">
            Update cart
          </button>
        </div>
      </form>
    {% endif %}
  </div>
</section>
{% schema %}
${JSON.stringify(mainCartSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-cart.liquid', mainCartLiquid)

  const mainCollectionSchema = {
    name: "Main Collection",
    settings: [],
    presets: [{ name: "Zenya Nova Collection" }]
  }

  const mainCollectionLiquid = `
<section class="bg-white">
  <div class="container mx-auto px-6 py-12">
    <div class="flex items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900">{{ collection.title }}</h1>
        {% if collection.description != blank %}
          <div class="mt-2 text-slate-600">{{ collection.description }}</div>
        {% endif %}
      </div>
    </div>
    <div class="mt-10 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {% for product in collection.products %}
        <a href="{{ product.url }}" class="group rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
          <div class="aspect-[4/5] bg-slate-100 overflow-hidden">
            {% if product.featured_image %}
              <img src="{{ product.featured_image | image_url: width: 900 }}" alt="{{ product.title | escape }}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
            {% else %}
              {{ 'product-1' | placeholder_svg_tag: 'h-full w-full object-cover opacity-50' }}
            {% endif %}
          </div>
          <div class="p-4">
            <div class="font-extrabold text-slate-900 text-sm">{{ product.title }}</div>
            <div class="mt-2 flex items-center gap-2 text-sm">
              <div class="font-bold text-slate-900">{{ product.price | money }}</div>
              {% if product.compare_at_price > product.price %}
                <div class="text-slate-400 line-through text-xs">{{ product.compare_at_price | money }}</div>
              {% endif %}
            </div>
          </div>
        </a>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
${JSON.stringify(mainCollectionSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-collection.liquid', mainCollectionLiquid)

  const mainPageSchema = { name: "Main Page", settings: [], presets: [{ name: "Zenya Nova Page" }] }
  const mainPageLiquid = `
<section class="bg-white">
  <div class="container mx-auto px-6 py-14 max-w-3xl">
    <h1 class="text-4xl font-extrabold tracking-tight text-slate-900">{{ page.title }}</h1>
    <div class="prose prose-slate mt-8 max-w-none">{{ page.content }}</div>
  </div>
</section>
{% schema %}
${JSON.stringify(mainPageSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-page.liquid', mainPageLiquid)

  const main404Schema = { name: "Main 404", settings: [], presets: [{ name: "Zenya Nova 404" }] }
  const main404Liquid = `
<section class="bg-white">
  <div class="container mx-auto px-6 py-20 text-center">
    <div class="text-6xl mb-6">404</div>
    <h1 class="text-3xl font-extrabold text-slate-900">Page not found</h1>
    <p class="mt-3 text-slate-600">The page you’re looking for doesn’t exist.</p>
    <a href="{{ routes.root_url }}" class="mt-8 inline-flex rounded-full px-8 py-4 font-extrabold text-white shadow-sm transition hover:opacity-90" style="background: {{ settings.primary_color }};">
      Back to home
    </a>
  </div>
</section>
{% schema %}
${JSON.stringify(main404Schema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-404.liquid', main404Liquid)

  const mainSearchSchema = { name: "Main Search", settings: [], presets: [{ name: "Zenya Nova Search" }] }
  const mainSearchLiquid = `
{% paginate search.results by 24 %}
<section class="bg-white">
  <div class="container mx-auto px-6 py-12">
    <h1 class="text-3xl font-extrabold text-slate-900">Search</h1>
    <form action="{{ routes.search_url }}" method="get" class="mt-6 relative max-w-2xl">
      <input type="search" name="q" value="{{ search.terms | escape }}" placeholder="Search products..." class="w-full rounded-full border border-slate-200 px-6 py-4 text-base focus:border-primary focus:ring-primary">
      <input type="hidden" name="type" value="product">
      <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-full hover:bg-primary hover:text-white transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
    </form>
    {% if search.performed %}
      <div class="mt-10 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {% for item in search.results %}
          {% if item.object_type == 'product' %}
            <a href="{{ item.url }}" class="group rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
              <div class="aspect-[4/5] bg-slate-100 overflow-hidden">
                {% if item.featured_image %}
                  <img src="{{ item.featured_image | image_url: width: 900 }}" alt="{{ item.title | escape }}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
                {% else %}
                  {{ 'product-1' | placeholder_svg_tag: 'h-full w-full object-cover opacity-50' }}
                {% endif %}
              </div>
              <div class="p-4">
                <div class="font-extrabold text-slate-900 text-sm">{{ item.title }}</div>
                <div class="mt-2 flex items-center gap-2 text-sm">
                  <div class="font-bold text-slate-900">{{ item.price | money }}</div>
                </div>
              </div>
            </a>
          {% endif %}
        {% endfor %}
      </div>
    {% endif %}
    {% if paginate.pages > 1 %}
      <div class="mt-16 text-center">
        {{ paginate | default_pagination }}
      </div>
    {% endif %}
  </div>
</section>
{% endpaginate %}
{% schema %}
${JSON.stringify(mainSearchSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-search.liquid', mainSearchLiquid)

  const indexSections: any = {}
  const indexOrder: string[] = []
  const add = (id: string, section: any) => {
    indexSections[id] = section
    indexOrder.push(id)
  }

  add("hero", { type: "zenya-nova-hero", settings: { headline: content.hero.headline, subheadline: content.hero.subheadline, cta_label: content.hero.cta, external_image_url: images[0] || "" } })
  add("benefits", {
    type: "zenya-nova-benefits",
    settings: { heading: `Why ${name} works`, subheading: "Clear benefits that matter day one." },
    blocks: (content.features || []).slice(0, 6).reduce((acc, f, i) => ({
      ...acc,
      [`benefit_${i}`]: { type: "benefit", settings: { title: f.title, text: f.desc, icon: f.icon || "sparkle" } }
    }), {}),
    block_order: (content.features || []).slice(0, 6).map((_, i) => `benefit_${i}`)
  })

  add("proof", {
    type: "zenya-nova-social-proof",
    settings: { heading: "Real people. Real results.", subheading: "Quick proof that makes buyers feel safe." },
    blocks: (content.testimonials || []).slice(0, 6).reduce((acc, t, i) => ({
      ...acc,
      [`quote_${i}`]: { type: "quote", settings: { name: t.name, meta: t.location || "Verified buyer", rating: t.rating || 5, text: t.text } }
    }), {}),
    block_order: (content.testimonials || []).slice(0, 6).map((_, i) => `quote_${i}`)
  })

  add("faq", {
    type: "zenya-nova-faq",
    settings: { heading: "FAQ", subheading: "Everything you need to know." },
    blocks: (content.faq || []).slice(0, 8).reduce((acc, f, i) => ({
      ...acc,
      [`faq_${i}`]: { type: "faq", settings: { q: f.q, a: f.a } }
    }), {}),
    block_order: (content.faq || []).slice(0, 8).map((_, i) => `faq_${i}`)
  })

  add("guarantee", { type: "zenya-nova-guarantee", settings: { title: content.guarantee?.title || content.guarantee?.days ? `${content.guarantee.days}-Day Guarantee` : "Risk-Free Guarantee", text: content.guarantee?.text || "Try it risk-free." } })
  add("newsletter", { type: "zenya-nova-newsletter", settings: { title: content.newsletter?.title || "Get deals before anyone else", text: content.newsletter?.text || "Subscribe for drops and discounts." } })

  zip.folder('templates')?.file('index.json', JSON.stringify({ sections: indexSections, order: indexOrder }, null, 2))

  zip.folder('templates')?.file('product.json', JSON.stringify({ sections: { main: { type: "main-product", settings: {} } }, order: ["main"] }, null, 2))
  zip.folder('templates')?.file('collection.json', JSON.stringify({ sections: { main: { type: "main-collection", settings: {} } }, order: ["main"] }, null, 2))
  zip.folder('templates')?.file('cart.json', JSON.stringify({ sections: { main: { type: "main-cart", settings: {} } }, order: ["main"] }, null, 2))
  zip.folder('templates')?.file('search.json', JSON.stringify({ sections: { main: { type: "main-search", settings: {} } }, order: ["main"] }, null, 2))
  zip.folder('templates')?.file('page.json', JSON.stringify({ sections: { main: { type: "main-page", settings: {} } }, order: ["main"] }, null, 2))
  zip.folder('templates')?.file('404.json', JSON.stringify({ sections: { main: { type: "main-404", settings: {} } }, order: ["main"] }, null, 2))

  const mustHaveFiles = [
    'layout/theme.liquid',
    'config/settings_schema.json',
    'config/settings_data.json',
    'sections/header-group.json',
    'sections/footer-group.json',
    'sections/zenya-nova-header.liquid',
    'sections/zenya-nova-footer.liquid',
    'sections/zenya-nova-hero.liquid',
    'sections/zenya-nova-benefits.liquid',
    'sections/zenya-nova-social-proof.liquid',
    'sections/zenya-nova-faq.liquid',
    'sections/zenya-nova-guarantee.liquid',
    'sections/zenya-nova-newsletter.liquid',
    'sections/main-product.liquid',
    'sections/main-cart.liquid',
    'sections/main-collection.liquid',
    'templates/index.json',
    'templates/product.json',
    'templates/cart.json',
    'templates/collection.json',
  ]
  const missing = mustHaveFiles.filter((p) => !zip.file(p))
  if (missing.length) throw new Error(`Theme build missing files: ${missing.join(', ')}`)

  return zip
}


function mapLegacyContentToV2(name: string, content: ThemeContent): Partial<NovaThemeContent> {
  const mapped: Partial<NovaThemeContent> & {
    stylePreset?: string
    websiteStyle?: string
    _preview?: { stylePreset?: string; sectionStyles?: Record<string, string>; websiteStyle?: string }
  } = {
    brand: {
      name: content.shopName || name,
      tagline: content.solution?.text || content.problem?.text || ''
    },
    hero: {
      heading: content.hero?.headline || `Welcome to ${name}`,
      subheading: content.hero?.subheadline || '',
      primaryLabel: content.hero?.cta || 'Shop now',
      secondaryLabel: 'Learn more'
    },
    highlights: (content.features || []).slice(0, 6).map((f) => ({
      title: f.title,
      text: f.desc
    })),
    testimonials: (content.testimonials || []).slice(0, 6).map((t) => ({
      name: t.name,
      text: t.text
    })),
    faq: (content.faq || []).slice(0, 8).map((f) => ({
      question: f.q,
      answer: f.a
    })),
    product: {
      reassurance:
        content.guarantee?.text ||
        content.cart_drawer?.secure_line ||
        'Secure checkout, tracked shipping, and simple returns.'
    }
  }

  const raw = content as any
  if (typeof raw?.stylePreset === 'string') mapped.stylePreset = raw.stylePreset
  if (typeof raw?.websiteStyle === 'string') mapped.websiteStyle = raw.websiteStyle
  if (raw?._preview) {
    mapped._preview = {
      stylePreset: typeof raw._preview.stylePreset === 'string' ? raw._preview.stylePreset : undefined,
      sectionStyles: raw._preview.sectionStyles && typeof raw._preview.sectionStyles === 'object'
        ? raw._preview.sectionStyles
        : undefined,
      websiteStyle: typeof raw._preview.websiteStyle === 'string' ? raw._preview.websiteStyle : undefined
    }
  }

  return mapped as Partial<NovaThemeContent>
}

export async function generateShopifyTheme(name: string, content: ThemeContent, colors: { primary: string; secondary: string }, images: string[] = []) {
  const _images = images
  // Uses V3 Engine now!
  return generateShopifyThemeV3OneProduct(mapLegacyContentToV2(name, content), {
    primary: colors.primary,
    accent: colors.secondary
  })
}
