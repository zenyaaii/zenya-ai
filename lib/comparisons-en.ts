/**
 * English competitor comparisons — the /en mirror of lib/comparisons.ts, for
 * English-language search ("best Arabic website builder", "Zenya vs Wix").
 * Slugs match the Arabic pages so hreflang can pair them 1:1.
 *
 * Same honesty rule: factual, fair, and openly states when a competitor is the
 * better pick. Facts match the live product.
 */

import type { QA } from '@/app/(main)/faq/faq-data'

export type CompareRowEn = { label: string; zenya: string; them: string; zenyaWins?: boolean }

export type ComparisonEn = {
  slug: string
  them: string
  themLatin: string
  summary: string
  title: string
  metaDescription: string
  intro: string[]
  rows: CompareRowEn[]
  chooseThem: string
  chooseZenya: string
  faqs: QA[]
}

const zLang = 'Arabic-first: RTL layout, Arabic fonts, and content built for Arabic from the ground up.'
const zContent = 'AI writes the full site content from a short brief.'
const zTime = 'Minutes — from a brief to a publish-ready site.'
const zPrice = 'Free to try, then $14.99–$24.99 per month.'
const zHosting = 'Hosted inside the EU with automatic SSL and GDPR compliance (Pro plan).'
const zDomain = 'Custom domain on Pro, with the first year free.'
const zSkill = 'No coding, no design — built for business owners, not developers.'

export const COMPARISONS_EN: ComparisonEn[] = [
  {
    slug: 'wix',
    them: 'Wix',
    themLatin: 'Wix',
    summary: 'A general drag-and-drop builder; Zenya writes your Arabic site with AI in minutes.',
    title: 'Zenya vs Wix: Which Is Better for an Arabic Website?',
    metaDescription:
      'An honest comparison of Zenya and Wix for building an Arabic website: language and RTL support, AI-written content, time to launch, price, and hosting — and when to choose each.',
    intro: [
      'Wix is a mature, global drag-and-drop builder with a huge template library and enormous design flexibility. But it is English-first, its Arabic and right-to-left support is an add-on rather than the default, and you write every word of the content yourself.',
      'Zenya is different at its core: it is Arabic-first, and its AI writes your content and lays out your sections from a short brief — so you get a professional, publish-ready site in minutes instead of hours of dragging and writing.',
    ],
    rows: [
      { label: 'Language & direction', zenya: zLang, them: 'English-first; Arabic and RTL are a later add-on.', zenyaWins: true },
      { label: 'Content writing', zenya: zContent, them: 'You write all of the copy yourself.', zenyaWins: true },
      { label: 'Time to launch', zenya: zTime, them: 'Hours — manual design and copywriting.', zenyaWins: true },
      { label: 'Skill required', zenya: zSkill, them: 'Relatively easy, but needs time and design taste.' },
      { label: 'Monthly price', zenya: zPrice, them: 'Multiple tiers, often higher with add-ons.' },
      { label: 'Hosting & SSL', zenya: zHosting, them: 'Managed hosting with SSL.' },
      { label: 'Custom domain', zenya: zDomain, them: 'Available on paid plans.' },
      { label: 'Design flexibility', zenya: 'Focused templates per business type — less choice overload.', them: 'Very broad flexibility and a large app market.' },
      { label: 'Best for', zenya: 'Arab business owners who want a fast site written for them.', them: 'People who want full control and have time to build it.' },
    ],
    chooseThem:
      'Choose Wix if you want maximum control over every design detail, you have time to build the site and write its content yourself, and Arabic being an add-on is fine for you.',
    chooseZenya:
      'Choose Zenya if you are an Arabic business that wants a professional site with AI-written content, proper RTL layout, and a launch in minutes for a fraction of the effort.',
    faqs: [
      { q: 'Is Zenya cheaper than Wix?', a: 'Zenya is free to try, then $14.99/month (Starter) and $24.99/month (Pro, with full hosting and a domain). Wix total cost usually rises with paid apps and add-ons.' },
      { q: 'Does Wix support Arabic and right-to-left?', a: 'Wix supports Arabic, but it is not at the core of its design and RTL often needs manual adjustment. Zenya is Arabic-first and RTL by default.' },
      { q: 'Does either write the content for me?', a: 'On Wix you write the content yourself. On Zenya the AI writes your entire site copy from a short brief, which you can then edit.' },
    ],
  },
  {
    slug: 'squarespace',
    them: 'Squarespace',
    themLatin: 'Squarespace',
    summary: 'Elegant, English-first templates you fill yourself; Zenya writes yours in Arabic.',
    title: 'Zenya vs Squarespace: A Comparison for Arabic Websites',
    metaDescription:
      'Zenya or Squarespace? An honest comparison across Arabic and RTL support, AI-written content, time to launch, price, and hosting — and when to choose each.',
    intro: [
      'Squarespace is known for its polished, design-forward templates and is a favorite of photographers and visually driven brands. But it is English-first, you write all of the content yourself, and its Arabic and RTL support is limited.',
      'Zenya gives you comparable polish but with Arabic content written by AI, authentic RTL layout, and a launch measured in minutes — purpose-built for the Arab market.',
    ],
    rows: [
      { label: 'Language & direction', zenya: zLang, them: 'English-first; limited Arabic/RTL support.', zenyaWins: true },
      { label: 'Content writing', zenya: zContent, them: 'You write all of the copy yourself.', zenyaWins: true },
      { label: 'Time to launch', zenya: zTime, them: 'Hours to set up a template and write content.', zenyaWins: true },
      { label: 'Template polish', zenya: 'Modern templates focused per business type.', them: 'Very elegant, visually oriented templates.' },
      { label: 'Monthly price', zenya: zPrice, them: 'Fixed monthly/annual plans.' },
      { label: 'Hosting & SSL', zenya: zHosting, them: 'Managed hosting with SSL.' },
      { label: 'Custom domain', zenya: zDomain, them: 'Available on paid plans.' },
      { label: 'Skill required', zenya: zSkill, them: 'Needs time and a design sensibility.' },
      { label: 'Best for', zenya: 'Arabic businesses that want content and launch fast.', them: 'People who want refined visual templates and already have their content.' },
    ],
    chooseThem:
      'Choose Squarespace if your content is ready, you have a clear design sense, and you want refined visual templates in English.',
    chooseZenya:
      'Choose Zenya if you want an Arabic site whose content the AI writes for you, with authentic RTL layout and a launch in minutes.',
    faqs: [
      { q: 'Is Squarespace good for Arabic websites?', a: 'Its templates are beautiful, but it is English-first and its Arabic/RTL support is limited and needs adjustment. Zenya is built for Arabic from the ground up.' },
      { q: 'What is the core difference?', a: 'On Squarespace you design and write yourself; on Zenya the AI writes your content and prepares the site in minutes.' },
      { q: 'Which launches faster?', a: 'Zenya is usually faster because it generates content and design together, while Squarespace requires manual building and writing.' },
    ],
  },
  {
    slug: 'shopify',
    them: 'Shopify',
    themLatin: 'Shopify',
    summary: 'A full commerce platform you build yourself; Zenya generates the store — and can export to Shopify.',
    title: 'Zenya vs Shopify: Which One Do You Need?',
    metaDescription:
      'Zenya or Shopify? Shopify is a full e-commerce platform; Zenya is an AI website builder that generates your store and can export to Shopify. An honest comparison and when to choose each.',
    intro: [
      'Shopify is a full, powerful e-commerce platform: cart, secure checkout, inventory, and products at scale. But you build and design the store yourself (or buy a theme), and you write its content yourself.',
      'Zenya is not a replacement for the commerce engine — it generates your site and content with AI. Better still: Zenya’s two commerce templates export as ready Shopify themes, so you get the best of both — content written for you, and payments handled by Shopify.',
    ],
    rows: [
      { label: 'Primary role', zenya: 'Generates the site and content with AI.', them: 'A full e-commerce engine (cart, checkout, inventory).' },
      { label: 'Language & direction', zenya: zLang, them: 'Supports Arabic; themes vary in RTL quality.', zenyaWins: true },
      { label: 'Content writing', zenya: zContent, them: 'You write the content and build the store yourself.', zenyaWins: true },
      { label: 'Payments & cart', zenya: 'Via export to Shopify — Shopify handles secure payment.', them: 'Fully built-in and advanced.' },
      { label: 'Time to launch', zenya: zTime, them: 'Longer — set up store, theme, and content.', zenyaWins: true },
      { label: 'Monthly price', zenya: zPrice, them: 'Platform subscription plus possible fees.' },
      { label: 'Best for', zenya: 'Anyone who wants a site/store written for them, fast.', them: 'Large stores with big catalogs and broad operations.' },
    ],
    chooseThem:
      'Choose Shopify alone if you have a large catalog and advanced commerce operations and want to build and manage the store in detail yourself.',
    chooseZenya:
      'Choose Zenya if you want your site and content written for you by AI quickly — then export to Shopify to handle payments if you need a store.',
    faqs: [
      { q: 'Is Zenya a replacement for Shopify?', a: 'No. Shopify is a commerce engine (cart and checkout); Zenya generates the site and content with AI. They work together: Zenya’s commerce templates export as Shopify themes.' },
      { q: 'How does payment work on a Zenya site?', a: 'For stores, you export the commerce template to Shopify, which handles cart, secure checkout, and products. Brochure sites (restaurants, services…) are hosted by Zenya.' },
      { q: 'Do I need a Shopify account?', a: 'Only if you want a full checkout store. Many businesses (restaurant, services, wellness) just need a brochure site that Zenya hosts, without Shopify.' },
    ],
  },
  {
    slug: 'wordpress',
    them: 'WordPress',
    themLatin: 'WordPress',
    summary: 'Powerful and flexible but complex and high-maintenance; Zenya generates a ready Arabic site with no plugins.',
    title: 'Zenya vs WordPress: The Simpler Path to an Arabic Website',
    metaDescription:
      'Zenya or WordPress? WordPress is powerful and flexible but needs plugins, themes, and maintenance. Zenya generates a full Arabic site with AI-written content and ready hosting. An honest comparison.',
    intro: [
      'WordPress powers a large share of the web and is powerful and endlessly flexible through themes and plugins. But that power comes with complexity: you choose hosting, install themes and plugins, and manage security and updates — and you write all of the content yourself.',
      'Zenya removes that complexity entirely: pick a template, write a brief, and the AI generates a full Arabic site with content, hosting, and SSL ready — no plugins and no maintenance.',
    ],
    rows: [
      { label: 'Language & direction', zenya: zLang, them: 'Supports Arabic via themes/plugins; RTL quality varies.', zenyaWins: true },
      { label: 'Content writing', zenya: zContent, them: 'You write all of the content yourself.', zenyaWins: true },
      { label: 'Setup & maintenance', zenya: 'None — everything is managed.', them: 'Plugins, updates, security, and ongoing maintenance.', zenyaWins: true },
      { label: 'Time to launch', zenya: zTime, them: 'Hours to days depending on setup.', zenyaWins: true },
      { label: 'Skill required', zenya: zSkill, them: 'Needs technical knowledge or a developer.', zenyaWins: true },
      { label: 'Flexibility', zenya: 'Focused templates per business type.', them: 'Near-unlimited flexibility via plugins.' },
      { label: 'Cost', zenya: zPrice, them: 'Hosting + themes + often paid plugins.' },
      { label: 'Best for', zenya: 'Anyone who wants simplicity and speed with no maintenance.', them: 'Those who want full control and have technical skill.' },
    ],
    chooseThem:
      'Choose WordPress if you want full technical control and unlimited flexibility, and you have the skill (or a developer) for setup and maintenance.',
    chooseZenya:
      'Choose Zenya if you want a professional Arabic site with no plugins and no maintenance, with AI-written content and ready hosting.',
    faqs: [
      { q: 'Is WordPress harder than Zenya?', a: 'Usually yes. WordPress requires choosing hosting, installing themes and plugins, and ongoing maintenance, while Zenya is fully managed and generates the site in minutes.' },
      { q: 'Does either write the content?', a: 'WordPress does not write content. On Zenya, the AI writes all of your site copy from a short brief.' },
      { q: 'What about hosting?', a: 'On WordPress you arrange hosting yourself. On Zenya, EU hosting with SSL and GDPR is ready on the Pro plan.' },
    ],
  },
  {
    slug: 'agency',
    them: 'an agency or freelancer',
    themLatin: 'Agency',
    summary: 'Custom but expensive and slow (weeks); Zenya delivers a professional result in minutes at a fraction of the cost.',
    title: 'Zenya vs a Design Agency or Freelancer: Faster and Cheaper',
    metaDescription:
      'Zenya or a design agency/freelancer? An agency offers custom work but at high cost and longer timelines (weeks). Zenya generates a professional website with AI in minutes at a fraction of the cost.',
    intro: [
      'An agency or freelancer offers custom, human-crafted work and strategy — excellent for large projects with unique needs. But the price is high (hundreds to thousands of dollars), the timeline stretches into weeks, and every later change goes through them.',
      'Zenya gives you a site that looks agency-made — but in minutes, with content written by AI, at a small monthly cost, and with full control to edit it yourself whenever you want.',
    ],
    rows: [
      { label: 'Cost', zenya: 'Free to try, then $14.99–$24.99/month.', them: 'Hundreds to thousands of dollars per project.', zenyaWins: true },
      { label: 'Delivery time', zenya: zTime, them: 'Days to weeks.', zenyaWins: true },
      { label: 'Content writing', zenya: zContent, them: 'Written by a human team (at cost and time).' },
      { label: 'Language & direction', zenya: zLang, them: 'Depends on the agency’s Arabic expertise.' },
      { label: 'Edits', zenya: 'Edit it yourself instantly with simple instructions.', them: 'Every change goes through them and may cost extra.', zenyaWins: true },
      { label: 'Deep customization', zenya: 'Focused, editable templates.', them: 'Fully bespoke design from scratch.' },
      { label: 'Hosting & SSL', zenya: zHosting, them: 'Depends on the contract; may be managed or handed off.' },
      { label: 'Best for', zenya: 'Businesses that want a professional result fast and affordably.', them: 'Large projects with unique requirements and a budget.' },
    ],
    chooseThem:
      'Choose an agency or freelancer if your project is large and unique and needs strategy and fully bespoke design from scratch, and you have the budget and time.',
    chooseZenya:
      'Choose Zenya if you want a site that looks agency-designed but in minutes and at a small fraction of the cost, with the freedom to edit it yourself.',
    faqs: [
      { q: 'Does Zenya’s quality match agency work?', a: 'Zenya generates cohesive, professional design and content with a clear identity. For standard projects the result is very close to agency work, at a fraction of the cost and time.' },
      { q: 'How much do I save versus an agency?', a: 'Agencies typically charge hundreds to thousands of dollars per site. Zenya is free to start, then just $14.99–$24.99/month.' },
      { q: 'Can I edit it later without going back to anyone?', a: 'Yes. You edit your site yourself anytime with simple instructions — no waiting and no extra fee per change.' },
    ],
  },
]

export function getComparisonEn(slug: string): ComparisonEn | undefined {
  return COMPARISONS_EN.find((c) => c.slug === slug)
}
