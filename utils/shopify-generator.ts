import JSZip from 'jszip'
import { ALPINE_JS, TAILWIND_JS } from './static-assets'

type ThemeContent = {
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
}

export function prepareThemeZip(name: string, content: ThemeContent, colors: { primary: string; secondary: string }) {
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
      "theme_name": "Zenya AI Theme",
      "theme_version": "1.0.0",
      "theme_author": "Zenya AI",
      "theme_documentation_url": "https://zenya.ai",
      "theme_support_url": "https://zenya.ai"
    },
    {
      "name": "Colors",
      "settings": [
        { "type": "color", "id": "primary_color", "label": "Primary Color", "default": colors.primary },
        { "type": "color", "id": "secondary_color", "label": "Secondary Color", "default": colors.secondary }
      ]
    }
  ]
  zip.folder('config')?.file('settings_schema.json', JSON.stringify(settingsSchema, null, 2))
  
  const settingsData = {
    "current": {
      "primary_color": colors.primary,
      "secondary_color": colors.secondary
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
    settings: [
      { type: "text", id: "shop_name", label: "Shop Name", default: safeShopName },
      { type: "link_list", id: "menu", label: "Menu", default: "main-menu" },
      { type: "color", id: "bg_color", label: "Background Color", default: "#ffffff" },
      { type: "color", id: "text_color", label: "Text Color", default: "#0f172a" },
      { type: "header", content: "Announcement Bar" },
      { type: "checkbox", id: "show_announcement", label: "Show Announcement", default: true },
      { type: "text", id: "announcement_text", label: "Announcement Text", default: "🔥 Free Shipping on Orders Over $50!" },
      { type: "color", id: "announcement_bg", label: "Bar Background", default: "#000000" },
      { type: "color", id: "announcement_text_color", label: "Bar Text", default: "#ffffff" }
    ],
    presets: [{ name: "Zenya Header" }]
  }
  const headerLiquid = `
<div x-data="{ mobileMenuOpen: false }">
  {% if section.settings.show_announcement %}
    <div class="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider" 
         style="background: {{ section.settings.announcement_bg }}; color: {{ section.settings.announcement_text_color }};">
      {{ section.settings.announcement_text }}
    </div>
  {% endif %}

  <div class="border-b border-slate-200 py-4 relative" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
    <div class="container mx-auto flex items-center justify-between px-6">
      <div class="text-2xl font-extrabold tracking-tight z-20">
        <a href="{{ routes.root_url }}" class="no-underline hover:opacity-80 transition" style="color: inherit;">
          {{ section.settings.shop_name }}
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

        <a href="{{ routes.cart_url }}" class="hover:text-primary transition flex items-center gap-1" style="color: inherit;">
          Cart
          {% if cart.item_count > 0 %}
            <span class="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ cart.item_count }}</span>
          {% endif %}
        </a>
      </nav>

      <!-- Mobile Menu Button -->
      <div class="md:hidden z-20">
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
        <a href="{{ routes.cart_url }}" class="hover:text-primary transition flex items-center gap-2" style="color: inherit;">
          Cart
          {% if cart.item_count > 0 %}
            <span class="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ cart.item_count }}</span>
          {% endif %}
        </a>
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
    settings: [
      { type: "color", id: "bg_color", label: "Background", default: "#0f172a" },
      { type: "color", id: "text_color", label: "Text", default: "#ffffff" },
      { type: "text", id: "copyright", label: "Copyright Text", default: "© 2024 Zenya. All rights reserved." },
      { type: "link_list", id: "menu_1", label: "First Menu", default: "footer" },
      { type: "link_list", id: "menu_2", label: "Second Menu", default: "main-menu" }
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
        <p class="text-slate-400 max-w-sm mb-6">
          Premium quality products designed for your lifestyle. We stand behind everything we sell with our industry-leading guarantee.
        </p>
        <!-- Socials (Stub) -->
        <div class="flex gap-4">
          <a href="#" class="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition">
            <span class="sr-only">Facebook</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="#" class="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition">
            <span class="sr-only">Instagram</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.48 2h-.165zm0-2H12.2c-2.69 0-3.023.012-4.086.06-1.258.058-2.35.34-3.264 1.254-.914.914-1.196 2.006-1.254 3.265C3.536 5.676 3.524 6.01 3.524 8.7v.1c0 2.69.012 3.023.06 4.086.058 1.258.34 2.35 1.254 3.264.914.914 2.006 1.196 3.265 1.254 1.063.048 1.397.06 4.086.06h.05c2.69 0 3.023-.012 4.086-.06 1.258-.058 2.35-.34 3.264-1.254.914-.914 1.196-2.006 1.254-3.265.048-1.063.06-1.397.06-4.086v-.05c0-2.69-.012-3.023-.06-4.086-.058-1.258-.34-2.35-1.254-3.264-.914-.914-2.006-1.196-3.265-1.254-1.063-.048-1.397-.06-4.086-.06h-.15zm.165 5.33a5.335 5.335 0 105.335 5.335 5.335 5.335 0 00-5.335-5.335zm0 8.67a3.335 3.335 0 113.335-3.335 3.335 3.335 0 01-3.335 3.335zm5.336-9.102a1.2 1.2 0 11-1.2 1.2 1.2 1.2 0 011.2-1.2z"/></svg>
          </a>
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
            <li><a href="{{ routes.collections_url }}/new" class="hover:text-primary transition">New Arrivals</a></li>
            <li><a href="{{ routes.collections_url }}/best-sellers" class="hover:text-primary transition">Best Sellers</a></li>
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
            <li><a href="/pages/contact" class="hover:text-primary transition">Contact Us</a></li>
            <li><a href="/pages/shipping" class="hover:text-primary transition">Shipping Policy</a></li>
            <li><a href="/pages/returns" class="hover:text-primary transition">Returns & Refunds</a></li>
          {% endfor %}
        </ul>
      </div>
    </div>

    <div class="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="text-slate-500 text-sm">
        {{ section.settings.copyright }}
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
    
    <!-- Tailwind CSS (Bundled) -->
    <script src="{{ 'tailwind.js' | asset_url }}" defer></script>
    <script>
      tailwind.config = {
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
    </style>
  </head>
  <body class="bg-slate-50 text-slate-900">
    {% section 'zenya-header' %}
    <main>
      {{ content_for_layout }}
    </main>
    {% section 'zenya-footer' %}
  </body>
</html>
  `
  zip.folder('layout')?.file('theme.liquid', layout)

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
      { type: "image_picker", id: "image", label: "Image" }
    ],
    presets: [{ name: "Zenya Hero" }]
  }
  const heroLiquid = `
<div class="bg-white py-20 lg:py-32">
  <div class="container mx-auto px-6 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
    <div>
      <h1 class="text-4xl lg:text-6xl font-extrabold tracking-tight leading-none mb-6 text-slate-900">{{ section.settings.headline }}</h1>
      <p class="text-xl text-slate-600 mb-8 leading-relaxed">{{ section.settings.subheadline }}</p>
      <a href="{{ section.settings.cta_link | default: routes.all_products_collection_url }}" class="inline-flex items-center justify-center rounded-full px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:opacity-90 hover:scale-105 active:scale-95" style="background-color: {{ settings.primary_color }};">
        {{ section.settings.cta }}
      </a>
    </div>
    <div>
      {% if section.settings.image != blank %}
        <img 
          src="{{ section.settings.image | image_url: width: 800 }}" 
          width="{{ section.settings.image.width }}"
          height="{{ section.settings.image.height }}"
          alt="{{ section.settings.headline }}" 
          class="w-full rounded-2xl shadow-2xl">
      {% else %}
        {{ 'product-1' | placeholder_svg_tag: 'w-full rounded-2xl bg-slate-100' }}
      {% endif %}
    </div>
  </div>
</div>
{% schema %}
${JSON.stringify(heroSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-hero.liquid', heroLiquid)

  // Features
  const featuresSchema = {
    name: "Features",
    blocks: [
      {
        type: "feature",
        name: "Feature",
        settings: [
          { type: "text", id: "title", label: "Title" },
          { type: "textarea", id: "desc", label: "Description" }
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
            desc: f.desc
          }
        }))
      }
    ]
  }
  const featuresLiquid = `
<div class="bg-slate-50 py-24">
  <div class="container mx-auto px-6">
    <div class="grid gap-8 md:grid-cols-3">
      {% for block in section.blocks %}
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
          <div class="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-6">★</div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">{{ block.settings.title }}</h3>
          <p class="text-slate-600 leading-relaxed">{{ block.settings.desc }}</p>
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
      { type: "text", id: "problem_headline", label: "Problem Headline", default: content.problem.headline },
      { type: "textarea", id: "problem_text", label: "Problem Text", default: content.problem.text },
      { type: "text", id: "solution_headline", label: "Solution Headline", default: content.solution.headline },
      { type: "textarea", id: "solution_text", label: "Solution Text", default: content.solution.text },
      { type: "image_picker", id: "image", label: "Image" }
    ],
    presets: [{ name: "Zenya Problem/Solution" }]
  }
  const problemSolutionLiquid = `
<div class="bg-white py-24">
  <div class="container mx-auto px-6 grid gap-16 lg:grid-cols-2 items-center">
    <div class="space-y-8">
      <div class="p-8 bg-red-50 rounded-2xl border-l-4 border-red-500">
        <h3 class="text-red-700 font-bold uppercase tracking-wider text-xs mb-2">The Problem</h3>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">{{ section.settings.problem_headline }}</h2>
        <p class="text-slate-600 leading-relaxed">{{ section.settings.problem_text }}</p>
      </div>
      <div class="p-8 bg-green-50 rounded-2xl border-l-4 border-green-500">
        <h3 class="text-green-700 font-bold uppercase tracking-wider text-xs mb-2">The Solution</h3>
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
<div class="bg-slate-900 text-white py-24">
  <div class="container mx-auto px-6">
    <h2 class="text-center text-3xl lg:text-4xl font-extrabold mb-16">What people are saying</h2>
    <div class="grid gap-8 md:grid-cols-3">
      {% for block in section.blocks %}
        <div class="bg-slate-800 p-8 rounded-2xl border border-slate-700">
          <div class="text-yellow-400 mb-4 text-lg">★★★★★</div>
          <p class="mb-6 leading-relaxed text-slate-300">"{{ block.settings.text }}"</p>
          <div>
            <div class="font-bold text-white">{{ block.settings.name }}</div>
            <div class="text-sm text-slate-400">{{ block.settings.location }}</div>
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
    <h2 class="text-center text-3xl lg:text-4xl font-extrabold mb-12">Frequently Asked Questions</h2>
    <div class="space-y-4" x-data="{ active: null }">
      {% for block in section.blocks %}
        <div class="border-b border-slate-200 py-4">
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
      { type: "text", id: "title", label: "Title", default: content.guarantee.title },
      { type: "textarea", id: "text", label: "Text", default: content.guarantee.text }
    ],
    presets: [{ name: "Zenya Guarantee" }]
  }
  const guaranteeLiquid = `
<div class="bg-slate-50 py-24 text-center">
  <div class="container mx-auto px-6 max-w-2xl">
    <div class="bg-white p-12 rounded-3xl shadow-xl border border-slate-100">
      <div class="text-6xl mb-6">🛡️</div>
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
  const indexJson = {
    "sections": {
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
      "hero": {
        "type": "zenya-hero",
        "settings": {
          "headline": content.hero.headline,
          "subheadline": content.hero.subheadline,
          "cta": content.hero.cta
        }
      },
      "logo_list": { 
        "type": "zenya-logo-list",
        "settings": { "title": "Featured In" }
      },
      "video_hero": {
        "type": "zenya-video-hero",
        "settings": {
          "heading": content.video_hero?.heading || "Cinematic Excellence",
          "subheading": content.video_hero?.subheading || "Immerse yourself in the story behind the brand.",
          "cta_text": content.video_hero?.cta || "Watch Film"
        }
      },
      "features": {
        "type": "zenya-features",
        "blocks": content.features.reduce((acc, f, i) => ({
          ...acc,
          [`feature_${i}`]: {
            "type": "feature",
            "settings": {
              "title": f.title,
              "desc": f.desc
            }
          }
        }), {}),
        "block_order": content.features.map((_, i) => `feature_${i}`)
      },
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
        "settings": {
          "heading": "Why Choose Us?"
        },
        "blocks": (content.comparison || []).reduce((acc, comp, i) => ({
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
        "block_order": (content.comparison || []).map((_, i) => `comp_${i}`)
      },
      "featured_collection": {
        "type": "zenya-featured-collection",
        "settings": {
          "title": "Best Sellers",
          "limit": 4
        }
      },
      "multicolumn": {
        "type": "zenya-multicolumn",
        "settings": { "title": "Why People Love Us" },
        "blocks": (content.multicolumn || []).reduce((acc, col, i) => ({
          ...acc,
          [`col_${i}`]: {
            "type": "column",
            "settings": {
              "title": col.title,
              "text": col.text
            }
          }
        }), {}),
        "block_order": (content.multicolumn || []).map((_, i) => `col_${i}`)
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
          "title": content.guarantee.title,
          "text": content.guarantee.text
        }
      },
      "rich_text": {
        "type": "zenya-rich-text",
        "settings": {
          "title": content.rich_text?.title || "Our Brand Story",
          "text": content.rich_text?.text || "Share information about your brand with your customers."
        }
      },
      "image_text": {
        "type": "zenya-image-text",
        "settings": {
          "title": content.image_text?.title || "Image with text",
          "text": content.image_text?.text || "Pair text with an image to focus on your chosen product.",
          "cta_text": content.image_text?.cta || "Learn More"
        }
      },
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "heading": content.newsletter?.title || "Subscribe to our emails",
          "text": content.newsletter?.text || "Be the first to know about new collections and exclusive offers."
        }
      }
    },
    "order": [
      "scrolling_text", 
      "slideshow", 
      "logo_list", 
      "problem_solution", 
      "video_hero", 
      "features", 
      "comparison", 
      "featured_collection", 
      "image_text", 
      "multicolumn", 
      "testimonials", 
      "rich_text", 
      "faq", 
      "guarantee", 
      "newsletter"
    ]
  }
  zip.folder('templates')?.file('index.json', JSON.stringify(indexJson, null, 2))

  // ==========================================
  // 5. PRODUCT PAGE (High Conversion)
  // ==========================================
  
  const mainProductSchema = {
    name: "Product Page",
    settings: [
      { type: "checkbox", id: "show_sticky_bar", label: "Show Sticky Add to Cart", default: true },
      { type: "checkbox", id: "show_stock", label: "Show Stock Counter", default: true },
      { type: "text", id: "benefit_1", label: "Benefit 1", default: "Free Shipping" },
      { type: "text", id: "benefit_2", label: "Benefit 2", default: "30-Day Returns" },
      { type: "text", id: "benefit_3", label: "Benefit 3", default: "Secure Checkout" },
      { type: "number", id: "review_count", label: "Review Count", default: 124 }
    ],
    presets: [{ name: "Zenya Product Main" }]
  }

  const mainProductLiquid = `
<div x-data="{ 
  selectedVariantId: {{ product.selected_or_first_available_variant.id }},
  currentPrice: {{ product.selected_or_first_available_variant.price }},
  comparePrice: {{ product.selected_or_first_available_variant.compare_at_price | default: 'null' }},
  currentImage: '{{ product.featured_image | image_url }}',
  scrolled: false,
  stockLeft: ${productConfig.fakeStockCount},
  options: {
    {% for option in product.options_with_values %}
      '{{ option.name | escape }}': '{{ option.selected_value | escape }}'{% unless forloop.last %},{% endunless %}
    {% endfor %}
  },
  optionNames: {{ product.options | json }},
  variants: [
    {% for variant in product.variants %}
      {
        id: {{ variant.id }},
        title: '{{ variant.title | escape }}',
        price: {{ variant.price }},
        compare_at_price: {{ variant.compare_at_price | default: 'null' }},
        image: '{{ variant.featured_image | image_url }}',
        options: {{ variant.options | json }},
        available: {{ variant.available }}
      }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ],
  updateVariant() {
    const matched = this.variants.find(v => {
      return this.optionNames.every((name, i) => {
        return v.options[i] === this.options[name];
      });
    });
    
    if (matched) {
      this.selectedVariantId = matched.id;
      this.currentPrice = matched.price;
      this.comparePrice = matched.compare_at_price;
      if (matched.image && matched.image !== '') {
        this.currentImage = matched.image;
      }
      // Update URL
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('variant', matched.id);
      window.history.replaceState({}, '', newUrl);
    }
  },
  formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }
}" 
@scroll.window="scrolled = (window.pageYOffset > 500)"
class="bg-white pb-20">

  <!-- Breadcrumbs -->
  <div class="container mx-auto px-6 py-4 text-sm text-slate-500">
    <a href="{{ routes.root_url }}" class="hover:text-primary">Home</a> / <span class="text-slate-900">{{ product.title }}</span>
  </div>

  <div class="container mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20">
    
    <!-- Gallery -->
    <div class="space-y-4">
      <div class="aspect-[1/1] rounded-2xl overflow-hidden bg-slate-100 relative group">
        <img
              :src="currentImage"
              width="{{ product.featured_image.width }}"
              height="{{ product.featured_image.height }}"
              alt="{{ product.title | escape }}"
              class="w-full h-full object-cover transition duration-500 group-hover:scale-105">
        <template x-if="comparePrice > currentPrice">
          <div class="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm shadow-md">
            SALE
          </div>
        </template>
      </div>
      <div class="grid grid-cols-4 gap-4">
        {% for media in product.media %}
          <div @click="currentImage = '{{ media | image_url }}'" class="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition bg-slate-50">
            <img 
              src="{{ media | image_url: width: 200 }}" 
              width="{{ media.width }}" 
              height="{{ media.height }}"
              alt="{{ media.alt | escape }}"
              class="w-full h-full object-cover">
          </div>
        {% endfor %}
      </div>
    </div>

    <!-- Info -->
    <div class="space-y-8">
      
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <div class="flex text-yellow-400 text-sm">★★★★★</div>
          <span class="text-slate-500 text-sm">({{ section.settings.review_count }} Reviews)</span>
        </div>
        <h1 class="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">{{ product.title }}</h1>
        <div class="flex items-end gap-4">
          <span class="text-3xl font-bold text-slate-900" x-text="formatMoney(currentPrice)">{{ product.price | money }}</span>
          <template x-if="comparePrice > currentPrice">
            <span class="text-xl text-slate-400 line-through mb-1" x-text="formatMoney(comparePrice)">{{ product.compare_at_price | money }}</span>
          </template>
        </div>
      </div>

      <!-- Benefit Row -->
      <div class="flex flex-wrap gap-4 py-4 border-y border-slate-100">
        <div class="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">🚚</span>
          {{ section.settings.benefit_1 }}
        </div>
        <div class="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">🛡️</span>
          {{ section.settings.benefit_2 }}
        </div>
        <div class="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">🔒</span>
          {{ section.settings.benefit_3 }}
        </div>
      </div>

      <!-- Stock Counter (FOMO) -->
      {% if section.settings.show_stock %}
        <div class="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
          <span>🔥</span> Only <span x-text="stockLeft"></span> items left in stock!
        </div>
      {% endif %}

      <!-- Variants -->
      {% unless product.has_only_default_variant %}
        <div class="space-y-4">
          {% for option in product.options_with_values %}
            <div>
              <label class="block text-sm font-bold text-slate-900 mb-2">{{ option.name }}</label>
              <div class="flex flex-wrap gap-2">
                {% for value in option.values %}
                  <button 
                    @click="options['{{ option.name | escape }}'] = '{{ value | escape }}'; updateVariant()"
                    :class="options['{{ option.name | escape }}'] === '{{ value | escape }}' ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'"
                    class="px-4 py-2 rounded border transition text-sm font-medium relative"
                  >
                    {{ value }}
                  </button>
                {% endfor %}
              </div>
            </div>
          {% endfor %}
        </div>
      {% endunless %}

      <!-- Actions -->
      {% form 'product', product %}
        <input type="hidden" name="id" :value="selectedVariantId">
        <div class="space-y-4">
          <button type="submit" name="add" class="w-full py-5 rounded-full text-xl font-bold text-white shadow-xl hover:opacity-90 transition transform hover:scale-[1.02] active:scale-[0.98]" style="background-color: {{ settings.primary_color }};">
            <span x-text="'Add to Cart - ' + formatMoney(currentPrice)">Add to Cart - {{ product.price | money }}</span>
          </button>
          <div class="text-center text-xs text-slate-500 flex justify-center gap-4">
            <span>🔒 SSL Secure Checkout</span>
            <span>⚡ Fast Shipping</span>
          </div>
        </div>
      {% endform %}

      <!-- Accordions -->
      <div class="space-y-2 pt-6" x-data="{ active: 'desc' }">
        <!-- Description -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button @click="active = (active === 'desc' ? null : 'desc')" class="w-full flex items-center justify-between p-4 bg-slate-50 font-bold text-slate-900">
            <span>Description</span>
            <span x-text="active === 'desc' ? '−' : '+'" class="text-xl"></span>
          </button>
          <div x-show="active === 'desc'" x-collapse class="p-4 text-slate-600 leading-relaxed prose prose-slate">
            {{ product.description }}
          </div>
        </div>
        
        <!-- Shipping -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button @click="active = (active === 'ship' ? null : 'ship')" class="w-full flex items-center justify-between p-4 bg-slate-50 font-bold text-slate-900">
            <span>Shipping & Returns</span>
            <span x-text="active === 'ship' ? '−' : '+'" class="text-xl"></span>
          </button>
          <div x-show="active === 'ship'" x-collapse class="p-4 text-slate-600 leading-relaxed">
            We ship worldwide with tracked shipping. Orders are processed within 24 hours. Returns are accepted within 30 days of delivery for a full refund.
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sticky ATC Bar -->
  {% if section.settings.show_sticky_bar %}
    <div x-show="scrolled" 
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="translate-y-full"
         x-transition:enter-end="translate-y-0"
         x-transition:leave="transition ease-in duration-300"
         x-transition:leave-start="translate-y-0"
         x-transition:leave-end="translate-y-full"
         class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-2xl z-50 lg:hidden">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="font-bold text-slate-900 truncate">{{ product.title }}</div>
          <div class="text-sm text-slate-500" x-text="formatMoney(currentPrice)">{{ product.price | money }}</div>
        </div>
        {% form 'product', product %}
          <input type="hidden" name="id" :value="selectedVariantId">
          <button type="submit" class="px-6 py-3 rounded-full font-bold text-white text-sm" style="background-color: {{ settings.primary_color }};">
            Add to Cart
          </button>
        {% endform %}
      </div>
    </div>
  {% endif %}

</div>
{% schema %}
${JSON.stringify(mainProductSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('main-product.liquid', mainProductLiquid)

  // Product Template
  const productJson = {
    "sections": {
      "main": {
        "type": "main-product",
        "settings": {
          "show_stock": true,
          "sticky_atc": true
        }
      },
      "recommendations": {
        "type": "zenya-featured-collection",
        "settings": { "title": "You May Also Like" }
      },
      "reviews": {
        "type": "zenya-testimonials",
        "settings": { "title": "Customer Reviews" }
      },
      "faq": {
        "type": "zenya-faq"
      }
    },
    "order": ["main", "recommendations", "reviews", "faq"]
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

  const collectionJson = {
    "sections": {
      "banner": { "type": "zenya-hero", "settings": { "headline": "Shop Our Collection", "subheadline": "Browse our premium selection.", "cta": "Scroll Down" }},
      "main": { "type": "main-collection" }
    },
    "order": ["banner", "main"]
  }
  zip.folder('templates')?.file('collection.json', JSON.stringify(collectionJson, null, 2))

  // ==========================================
  // 7. CART PAGE
  // ==========================================
  
  const mainCartSchema = {
    name: "Cart Page",
    settings: [
      { type: "number", id: "free_shipping_threshold", label: "Free Shipping Threshold (Cents)", default: 10000 }
    ],
    presets: [{ name: "Zenya Cart Main" }]
  }
  
  const mainCartLiquid = `
<div class="py-20 bg-slate-50 min-h-[60vh]">
  <div class="container mx-auto px-6 max-w-4xl">
    <h1 class="text-3xl font-extrabold text-slate-900 mb-8">Your Cart</h1>
    
    {% if cart.item_count > 0 %}
      
      <!-- Free Shipping Progress Bar -->
      {% assign free_shipping_threshold = section.settings.free_shipping_threshold %}
      {% assign cart_total = cart.total_price %}
      {% assign progress = cart_total | times: 100 | divided_by: free_shipping_threshold %}
      {% if progress > 100 %}{% assign progress = 100 %}{% endif %}
      {% assign left_to_spend = free_shipping_threshold | minus: cart_total %}

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        {% if left_to_spend > 0 %}
          <p class="text-center text-slate-900 font-bold mb-3">
            You are <span class="text-primary">{{ left_to_spend | money }}</span> away from <span class="font-extrabold">Free Shipping</span>!
          </p>
        {% else %}
          <p class="text-center text-green-600 font-bold mb-3">
            🎉 You've unlocked <span class="font-extrabold">Free Shipping</span>!
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
                <h3 class="font-bold text-slate-900 text-lg">{{ item.product.title }}</h3>
                <p class="text-sm text-slate-500 mb-2">{{ item.variant.title }}</p>
                <div class="font-bold text-slate-900">{{ item.final_line_price | money }}</div>
              </div>
              <div class="flex items-center gap-4">
                <input type="number" name="updates[]" value="{{ item.quantity }}" min="0" onchange="this.form.submit()" class="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold">
                <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity=0" class="text-red-500 hover:text-red-700 font-bold text-sm">Remove</a>
              </div>
            </div>
          {% endfor %}
        </div>
        <div class="bg-slate-50 p-6 border-t border-slate-200">
          <div class="flex justify-between items-center mb-6">
            <span class="text-xl font-bold text-slate-900">Total</span>
            <span class="text-2xl font-extrabold text-primary">{{ cart.total_price | money }}</span>
          </div>
          <p class="text-sm text-slate-500 mb-6 text-center">Shipping and taxes calculated at checkout.</p>
          <div class="grid gap-4">
            <button type="submit" name="checkout" class="w-full py-4 rounded-full text-xl font-bold text-white shadow-lg hover:opacity-90 transition" style="background-color: {{ settings.primary_color }};">
              Checkout Now
            </button>
            <div class="flex justify-center gap-2 opacity-50 grayscale">
               <!-- Payment Icons -->
               {% for type in shop.enabled_payment_types %}
                 {{ type | payment_type_svg_tag: class: 'h-6' }}
               {% endfor %}
            </div>
          </div>
        </div>
      </form>
    {% else %}
      <div class="text-center py-20">
        <div class="text-6xl mb-6">🛒</div>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
        <a href="{{ routes.root_url }}" class="inline-block px-8 py-3 rounded-full bg-slate-900 text-white font-bold hover:opacity-90 transition">Start Shopping</a>
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
          <a href="{{ section.settings.cta_url }}" class="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-bold text-white shadow-lg transition hover:opacity-90" style="background-color: {{ settings.primary_color }};">
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
      { type: "text", id: "title", label: "Heading", default: "Subscribe to our emails" },
      { type: "textarea", id: "text", label: "Subtext", default: "Be the first to know about new collections and exclusive offers." }
    ],
    presets: [{ name: "Zenya Newsletter" }]
  }
  const newsletterLiquid = `
<div class="py-24 bg-slate-900 text-white text-center">
  <div class="container mx-auto px-6 max-w-2xl">
    <h2 class="text-3xl font-bold mb-4">{{ section.settings.title }}</h2>
    <p class="text-slate-300 mb-8">{{ section.settings.text }}</p>
    {% form 'customer', class: 'flex flex-col sm:flex-row gap-4' %}
      <input type="hidden" name="contact[tags]" value="newsletter">
      <input type="email" name="contact[email]" placeholder="Email address" required class="flex-1 px-6 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary">
      <button type="submit" class="px-8 py-3 rounded-full font-bold bg-white text-slate-900 hover:bg-slate-100 transition">
        Subscribe
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
          <div class="group block">
            <div class="aspect-[1/1] rounded-xl bg-slate-100 mb-4 overflow-hidden">
               {{ 'product-' | append: i | placeholder_svg_tag: 'h-full w-full object-cover opacity-50' }}
            </div>
            <h3 class="font-bold text-slate-900">Demo Product {{ i }}</h3>
            <div class="font-bold text-slate-900">$49.99</div>
          </div>
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
        <a href="{{ collection.url | default: '#' }}" class="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg block">
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
            <div class="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg block bg-slate-200">
               <div class="absolute inset-0 flex items-center justify-center">
                  <h3 class="text-2xl font-bold text-slate-400">Category {{ i }}</h3>
               </div>
            </div>
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
      <button type="submit" class="w-full py-4 rounded-lg font-bold text-white shadow-lg hover:opacity-90 transition active:scale-[0.98]" style="background-color: {{ settings.primary_color }};">Send Message</button>
    {% endform %}
  </div>
</div>
{% schema %}
${JSON.stringify(contactFormSchema, null, 2)}
{% endschema %}
  `
  zip.folder('sections')?.file('zenya-contact.liquid', contactFormLiquid)

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
          <a href="{{ block.settings.cta_url }}" class="inline-block px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 transition shadow-lg transform hover:scale-105">
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
      { type: "text", id: "text", label: "Text", default: "FREE SHIPPING ON ALL ORDERS • 30-DAY MONEY BACK GUARANTEE • 24/7 SUPPORT • " },
      { type: "color", id: "bg_color", label: "Background", default: "#0f172a" },
      { type: "color", id: "text_color", label: "Text Color", default: "#ffffff" },
      { type: "range", id: "speed", label: "Speed", min: 10, max: 60, default: 20 }
    ],
    presets: [{ name: "Zenya Scrolling Text" }]
  }
  const scrollingTextLiquid = `
<div class="overflow-hidden whitespace-nowrap py-4" style="background: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="inline-flex animate-marquee">
    {% for i in (1..10) %}
      <span class="text-xl font-bold uppercase tracking-widest mx-4">{{ section.settings.text }}</span>
    {% endfor %}
  </div>
</div>
<style>
  .animate-marquee { animation: marquee {{ section.settings.speed }}s linear infinite; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
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
          <div class="group block">
            <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4">
              {{ 'image' | placeholder_svg_tag: 'w-full h-full object-cover opacity-50' }}
            </div>
            <div class="text-xs font-bold text-primary uppercase mb-2">October 24, 2024</div>
            <h3 class="text-xl font-bold text-slate-900 group-hover:text-primary transition mb-2">Article Title {{ i }}</h3>
            <p class="text-slate-600">This is a summary of the article content. It is very interesting and you should read it.</p>
          </div>
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
      <a href="{{ section.settings.cta_url }}" class="px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-slate-200 transition transform hover:scale-105 shadow-xl">
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
          
          <div class="md:flex items-start justify-between w-full {{ forloop.index | modulo: 2 | equals: 0 ? 'flex-row-reverse' : '' }}">
            <div class="md:w-[45%] mb-2 md:mb-0 {{ forloop.index | modulo: 2 | equals: 0 ? 'text-left md:text-right' : 'text-left' }}">
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
    presets: [{ name: "Zenya Product" }]
  }

  const productLiquid = `
<div class="py-10 lg:py-20 bg-white" id="MainProduct-{{ section.id }}" 
  x-data="{ 
  selectedQuantity: 1,
  
  // Variant Logic
  variants: {{ product.variants | json | replace: '"', "'" }},
  options: {
    {% for option in product.options_with_values %}
      '{{ option.name }}': '{{ option.selected_value }}'{% unless forloop.last %},{% endunless %}
    {% endfor %}
  },
  currentVariantId: {{ product.selected_or_first_available_variant.id }},
  currentPrice: {{ product.selected_or_first_available_variant.price }},
  currentComparePrice: {{ product.selected_or_first_available_variant.compare_at_price | default: 'null' }},
  currentImage: '{{ product.selected_or_first_available_variant.featured_image | image_url: width: 1000 }}',
  stock: ${productConfig.fakeStockCount},
  timeLeft: ${productConfig.fakeTimerSeconds},
  isStickyVisible: false,
  visitors: 24,
  
  // Computed Properties
  get variant() {
    return this.variants.find(v => {
      return v.options.every((opt, index) => {
        const optionName = '{{ product.options | first }}'; // Need robust mapping if possible, but Shopify variant options are ordered array in JSON
        // Actually, v.options is an array of strings like ['Red', 'L']. 
        // We need to map our this.options object values to this array order.
        // Let's use a helper in init or just rely on index matching if we iterate options in same order.
        return Object.values(this.options)[index] === opt;
      });
    }) || this.variants[0];
  },

  updateVariant() {
    const matched = this.variants.find(v => {
      // Create array of selected values in correct order
      const selectedValues = [];
      {% for option in product.options %}
        selectedValues.push(this.options['{{ option }}']);
      {% endfor %}
      
      return v.options.every((val, i) => val === selectedValues[i]);
    });

    if (matched) {
      this.currentVariantId = matched.id;
      this.currentPrice = matched.price;
      this.currentComparePrice = matched.compare_at_price;
      if (matched.featured_image) {
        this.currentImage = matched.featured_image.src;
      }
      
      // Update URL without reload
      const url = new URL(window.location);
      url.searchParams.set('variant', matched.id);
      window.history.replaceState({}, '', url);
    }
  },

  get discount() {
    if (this.selectedQuantity === 2) return ${productConfig.bundleDiscount2};
    if (this.selectedQuantity === 3) return ${productConfig.bundleDiscount3};
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
        Add To Cart
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
                <img 
                  src="{{ media | image_url: width: 800 }}" 
                  width="{{ media.width }}" 
                  height="{{ media.height }}"
                  alt="{{ media.alt }}" 
                  class="h-full w-full object-cover">
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
          {% if product.featured_image %}
            <div class="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              <img 
                :src="currentImage" 
                width="{{ product.featured_image.width }}"
                height="{{ product.featured_image.height }}"
                alt="{{ product.title | escape }}"
                class="h-full w-full object-cover"
              >
              <div x-show="currentComparePrice > currentPrice" class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                Sale
              </div>
            </div>
            <div class="grid grid-cols-6 gap-3">
              {% for media in product.media %}
                <button 
                  @click="currentImage = '{{ media | image_url: width: 1000 }}'"
                  class="relative aspect-square overflow-hidden rounded-lg border-2 transition hover:border-slate-300 focus:ring-2 focus:ring-primary"
                  :class="currentImage.includes('{{ media | image_url: width: 1000 }}'.split('?')[0]) ? 'border-primary' : 'border-transparent'"
                >
                  <img 
                    src="{{ media | image_url: width: 200 }}" 
                    width="{{ media.width }}"
                    height="{{ media.height }}"
                    alt="{{ media.alt }}" 
                    class="h-full w-full object-cover">
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
                        <div class="text-xs font-bold text-green-600">Save ${productConfig.bundleDiscount2}% OFF</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice * 2 * ${1 - productConfig.bundleDiscount2/100})"></div>
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
                        <div class="text-xs font-bold text-green-600">Save ${productConfig.bundleDiscount3}% OFF</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900 text-lg" x-text="formatMoney(currentPrice * 3 * ${1 - productConfig.bundleDiscount3/100})"></div>
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
              <span>Add to Cart</span>
              <span class="text-sm opacity-90 font-normal">- <span x-text="savings > 0 ? 'Save ' + '{{ cart.currency.symbol }}' + savings : ''"></span></span>
            </button>
            
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

  // 5.2 Comparison Table
  const comparisonSchema = {
    name: "Comparison Table",
    settings: [
      { type: "text", id: "heading", label: "Heading", default: "Why Choose Us?" },
      { type: "text", id: "us_label", label: "Our Brand Label", default: safeShopName },
      { type: "text", id: "them_label", label: "Others Label", default: "Others" }
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
<div class="py-24 bg-slate-50">
  <div class="container mx-auto px-6 max-w-4xl">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-extrabold mb-4 text-slate-900">{{ section.settings.heading }}</h2>
    </div>

    <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <!-- Header -->
      <div class="grid grid-cols-[2fr_1fr_1fr] gap-4 p-6 bg-slate-100 font-extrabold text-center text-sm lg:text-base">
        <div class="text-left text-slate-900">Feature</div>
        <div class="text-slate-500">{{ section.settings.them_label }}</div>
        <div class="text-primary">{{ section.settings.us_label }}</div>
      </div>

      <!-- Rows -->
      {% for block in section.blocks %}
        <div class="grid grid-cols-[2fr_1fr_1fr] gap-4 p-6 border-b border-slate-100 items-center text-center last:border-0 hover:bg-slate-50 transition">
          <div class="text-left font-bold text-slate-700 text-sm lg:text-base">{{ block.settings.feature }}</div>
          
          <!-- Them -->
          <div>
            {% if block.settings.them_check %}
              <span class="text-green-500 text-xl">✔</span>
            {% else %}
              <span class="text-slate-300 text-xl">✘</span>
            {% endif %}
          </div>

          <!-- Us -->
          <div class="bg-green-50 -my-4 py-4 rounded-lg">
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
      "main": { "type": "main-product" },
      "comparison": { "type": "zenya-comparison" },
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
      }
    },
    "order": ["main", "comparison", "testimonials", "faq"]
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
          "title": content.rich_text?.title || "Our Brand Story",
          "text": content.rich_text?.text || "Share information about your brand with your customers."
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
          "title": content.image_text?.title || "Image with text",
          "text": content.image_text?.text || "Pair text with an image to focus on your chosen product.",
          "cta_text": content.image_text?.cta || "Learn More"
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
      "newsletter": {
        "type": "zenya-newsletter",
        "settings": {
          "heading": content.newsletter?.title || "Subscribe to our emails",
          "text": content.newsletter?.text || "Be the first to know about new collections and exclusive offers."
        }
      }
    },
    "order": [
      "hero_video", "scrolling_text", "slideshow", "rich_text", "logo_list", 
      "features", "image_text", "shoppable", "featured_collection", "countdown", 
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

  return zip
}

export async function generateShopifyTheme(name: string, content: ThemeContent, colors: { primary: string; secondary: string }) {
  const zip = await prepareThemeZip(name, content, colors)
  return await zip.generateAsync({ type: 'blob' })
}
