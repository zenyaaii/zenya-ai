/**
 * English per-template landing pages — the /en mirror of lib/template-pages.tsx.
 * Slugs match the Arabic pages so hreflang can pair them 1:1. Facts match the
 * live product; commerce templates note Shopify handles payments.
 */

import type { ReactNode } from 'react'
import type { QA } from '@/app/(main)/faq/faq-data'

export type TemplatePageEn = {
  key: string
  slug: string
  label: string
  name: string
  accent: string
  demoHref: string
  title: string
  metaDescription: string
  h1: ReactNode
  intro: string[]
  includes: string[]
  audience: string
  keywords: string[]
  faqs: QA[]
}

const faqAi: QA = {
  q: 'Does the AI write the content automatically?',
  a: 'Yes. You write a short brief about your business, and the AI writes all of the site copy — headlines, descriptions, and calls to action — which you can then edit with simple instructions.',
}
const faqTime: QA = {
  q: 'How long does it take to build the site?',
  a: 'Minutes. Once you write your brief, the AI generates the full site; you review, edit, and publish in the same session.',
}
const faqDomain: QA = {
  q: 'Can I connect my own domain?',
  a: 'Yes, on the Pro plan, with SSL and no Zenya badge, plus a free custom domain for the first two months. Hosting is inside the EU.',
}
const faqPayments: QA = {
  q: 'How does payment work for the store?',
  a: 'The commerce template exports as a ready Shopify theme that runs on your store, where Shopify handles the cart, secure checkout, and products.',
}

export const TEMPLATE_PAGES_EN: TemplatePageEn[] = [
  {
    key: 'restaurant',
    slug: 'restaurant',
    label: 'Restaurant',
    name: 'restaurant website',
    accent: '#c8a96a',
    demoHref: '/demo/restaurant',
    title: 'Create a Professional Restaurant Website with AI',
    metaDescription:
      'Build a professional Arabic restaurant website in minutes: an elegant menu, dish photos, hours and location, and a reservation call to action — written by AI. Hosting and a custom domain included.',
    h1: <>A <span className="gradient-text">restaurant</span> website that whets your customers’ appetite.</>,
    intro: [
      'Your restaurant deserves a site as good as its dishes. Write a brief about your cuisine and atmosphere, and the AI generates an elegant Arabic site with a clear menu, appetizing sections, and a reservation call to action — ready to publish in minutes.',
      'No designer and no copywriter needed. Zenya writes the descriptions, arranges the sections, and gets the right-to-left layout right, so you get a digital presence that builds trust and brings in reservations.',
    ],
    includes: [
      'An elegant menu grouped by category',
      'Sections for dish and ambiance photos',
      'Hours and location with a map',
      'A clear reservation or order call to action',
      'The restaurant’s story and highlights',
      'A responsive, mobile-friendly design',
    ],
    audience: 'Restaurants, cafes, and bakeries that want an elegant digital menu and a presence that brings in customers.',
    keywords: ['restaurant website builder', 'create restaurant website', 'restaurant website design', 'online menu', 'Arabic restaurant website'],
    faqs: [
      faqAi,
      { q: 'Can I show my menu and prices?', a: 'Yes. The site generates a menu grouped by category with descriptions and prices, which you can edit easily anytime.' },
      faqTime,
      faqDomain,
    ],
  },
  {
    key: 'atlas',
    slug: 'app-landing-page',
    label: 'App',
    name: 'app landing page',
    accent: '#5e6ad2',
    demoHref: '/demo/atlas',
    title: 'Create an App Landing Page with AI',
    metaDescription:
      'A professional landing page for your app or software product in minutes: feature showcase, screenshots, pricing, and download calls to action — written by AI. Hosting and a domain included.',
    h1: <>A landing page for your <span className="gradient-text">app</span> that turns visitors into downloads.</>,
    intro: [
      'Your app needs a page that explains its value in seconds. Write a brief about what your app does, and the AI generates a persuasive landing page that highlights the features and drives visitors to download.',
      'From a feature showcase to download calls to action, pricing, and FAQs — it is all written and designed for you, with proper layout, and ready to publish in minutes.',
    ],
    includes: [
      'A headline that states the app’s value',
      'A feature showcase with clear icons',
      'Spaces for screenshots or a video',
      'Download calls to action (App Store / Google Play)',
      'Pricing and FAQ sections',
      'Testimonials and trust elements',
    ],
    audience: 'App and SaaS makers and marketers who want a high-converting landing page.',
    keywords: ['app landing page', 'saas landing page', 'create landing page', 'app website builder', 'landing page builder'],
    faqs: [
      faqAi,
      { q: 'Can I add my app store links?', a: 'Yes. The page includes clear download calls to action you can link to your App Store and Google Play URLs.' },
      faqTime,
      faqDomain,
    ],
  },
  {
    key: 'lookbook',
    slug: 'fashion-lookbook',
    label: 'Fashion',
    name: 'fashion lookbook website',
    accent: '#1c1c1c',
    demoHref: '/demo/lookbook',
    title: 'Create a Fashion & Lookbook Website with AI',
    metaDescription:
      'A refined visual fashion or lookbook website in minutes: a collection gallery, magazine-style imagery, and a brand story — written by AI. Hosting and a custom domain included.',
    h1: <>A fashion <span className="gradient-text">lookbook</span> worthy of your brand.</>,
    intro: [
      'Fashion sells on image and feeling. Write a brief about your brand and its style, and the AI generates a visually refined lookbook site that presents your collections in a magazine-like layout.',
      'A refined layout, spaces for large imagery, and a carefully written brand story — with proper right-to-left layout, and ready in minutes.',
    ],
    includes: [
      'A magazine-style visual fashion gallery',
      'Sections for seasonal collections',
      'The brand story and identity',
      'Spaces for large, high-impact imagery',
      'Links to shop or get in touch',
      'An elegant, responsive design',
    ],
    audience: 'Fashion brands, designers, and boutiques that want a refined visual showcase of their collections.',
    keywords: ['fashion website', 'lookbook website', 'clothing brand website', 'fashion portfolio', 'fashion website builder'],
    faqs: [
      faqAi,
      { q: 'Can I connect it to my store to sell?', a: 'Yes. You can link the shop buttons to your store, or use Zenya’s store template and export it to Shopify to handle checkout.' },
      faqTime,
      faqDomain,
    ],
  },
  {
    key: 'collective',
    slug: 'online-store',
    label: 'Store',
    name: 'multi-product online store',
    accent: '#10b981',
    demoHref: '/demo/collective',
    title: 'Create a Multi-Product Online Store with AI',
    metaDescription:
      'A professional multi-product online store in minutes: a collection and category showcase, product cards, and a brand story — written by AI, with export to Shopify for secure payments.',
    h1: <>An online <span className="gradient-text">store</span> that showcases your collection professionally.</>,
    intro: [
      'You have multiple products that deserve a great showcase. Write a brief about your store, and the AI generates an elegant storefront that presents your categories and products clearly.',
      'And to close the sale, the template exports as a ready Shopify theme — so Shopify handles the cart and secure checkout, while you get content and design written for you.',
    ],
    includes: [
      'A collection showcase grouped by category',
      'Product cards with images and descriptions',
      'The brand story and values',
      'Clear calls to buy',
      'Export to Shopify for secure payments',
      'A responsive, mobile-friendly design',
    ],
    audience: 'Multi-product stores that want a professional storefront with checkout via Shopify.',
    keywords: ['online store builder', 'create online store', 'ecommerce website', 'shopify store', 'online store design'],
    faqs: [faqAi, faqPayments, faqTime, faqDomain],
  },
  {
    key: 'studio',
    slug: 'brand-story',
    label: 'Studio',
    name: 'brand story website',
    accent: '#1c1c1c',
    demoHref: '/demo/studio',
    title: 'Create a Brand Story Website with AI',
    metaDescription:
      'An editorial website that tells your brand story in minutes: values, work, team, and contact — written by AI. EU hosting and a custom domain included.',
    h1: <>A site that tells your <span className="gradient-text">brand story.</span></>,
    intro: [
      'Strong brands are built on stories. Write a brief about your journey and values, and the AI generates an elegant editorial site that presents your brand in a way that builds trust and stands out.',
      'From the story page to values, work, and contact — carefully written content, with proper layout, and ready to publish in minutes.',
    ],
    includes: [
      'A brand story and journey page',
      'A values and vision section',
      'A showcase of work or projects',
      'A team introduction',
      'A contact call to action',
      'An elegant editorial design',
    ],
    audience: 'Studios, brands, agencies, and ventures that want a site that tells their story well.',
    keywords: ['brand website', 'brand story website', 'company website', 'studio website', 'about page website'],
    faqs: [
      faqAi,
      faqTime,
      faqDomain,
      { q: 'Does it suit both companies and individuals?', a: 'Yes. The template is flexible and suits startups, personal brands, and studios — anyone who wants to present their story professionally.' },
    ],
  },
  {
    key: 'services',
    slug: 'services',
    label: 'Services',
    name: 'services website',
    accent: '#f59e0b',
    demoHref: '/demo/services',
    title: 'Create a Professional Services Website with AI',
    metaDescription:
      'A professional services website in minutes: a service list, packages and pricing, why-choose-us, and a booking call to action — written by AI. Hosting and a custom domain included.',
    h1: <>A <span className="gradient-text">services</span> website that brings you clients.</>,
    intro: [
      'Clients look for a service provider they can trust. Write a brief about your services, and the AI generates a clear site that shows what you offer and why you are the better choice.',
      'From a service list and packages to booking and contact calls to action — it is all written and designed for you, and ready in minutes.',
    ],
    includes: [
      'A service list with clear descriptions',
      'Packages and pricing',
      'A “why choose us” section',
      'Testimonials and trust elements',
      'A booking or contact call to action',
      'Service area and hours',
    ],
    audience: 'Local service providers — maintenance, cleaning, consulting, trades — who want to attract new clients.',
    keywords: ['services website', 'create services website', 'service business website', 'contractor website', 'local business website'],
    faqs: [
      faqAi,
      { q: 'Can I show different packages and prices?', a: 'Yes. The site generates packages and pricing sections you can easily edit to match your services.' },
      faqTime,
      faqDomain,
    ],
  },
  {
    key: 'wellness',
    slug: 'wellness',
    label: 'Wellness',
    name: 'wellness center website',
    accent: '#14b8a6',
    demoHref: '/demo/wellness',
    title: 'Create a Wellness & Spa Website with AI',
    metaDescription:
      'A calm, trust-building website for a wellness center, spa, or yoga studio in minutes: sessions, schedule, instructors, and a booking call to action — written by AI. Hosting and a domain included.',
    h1: <>A <span className="gradient-text">wellness</span> website that radiates calm.</>,
    intro: [
      'Wellness centers sell a feeling of calm and trust. Write a brief about your center and services, and the AI generates a serene site that reflects your atmosphere and encourages booking.',
      'From sessions and schedule to instructors and booking calls to action — carefully written content, with proper layout, and ready in minutes.',
    ],
    includes: [
      'A showcase of sessions and services',
      'A schedule and class times',
      'An introduction to instructors or therapists',
      'A clear booking call to action',
      'Sections for the space and its imagery',
      'Location and hours',
    ],
    audience: 'Wellness centers, yoga studios, spas, and clinics that want a calm presence that builds trust.',
    keywords: ['wellness website', 'spa website', 'yoga website', 'clinic website', 'wellness center website'],
    faqs: [
      faqAi,
      { q: 'Can clients book from the site?', a: 'The site includes clear booking calls to action that can link to a booking system, a WhatsApp number, or a contact form — whatever suits you.' },
      faqTime,
      faqDomain,
    ],
  },
  {
    key: 'one_product',
    slug: 'one-product-store',
    label: 'One product',
    name: 'one-product store',
    accent: '#6366f1',
    demoHref: '/demo',
    title: 'Create a High-Converting One-Product Store with AI',
    metaDescription:
      'A focused, high-converting page for a single product in minutes: product benefits, images, reviews, and a strong call to buy — written by AI, with export to Shopify for payments.',
    h1: <>A <span className="gradient-text">one-product</span> store that sells hard.</>,
    intro: [
      'A standout single product needs a page that focuses all attention on it. Paste your product link or write a brief, and the AI generates a persuasive store page that highlights its benefits and drives the sale.',
      'And to close the sale, the template exports as a ready Shopify theme where Shopify handles secure payment — so you combine content written for you with high conversion.',
    ],
    includes: [
      'A focused, compelling product page',
      'Highlighted product benefits and features',
      'Spaces for product images',
      'Sections for reviews and trust-building',
      'A strong, clear call to buy',
      'Export to Shopify for secure payments',
    ],
    audience: 'Anyone selling a single standout product (dropshipping or a product brand) who wants a high-converting page.',
    keywords: ['one product store', 'product landing page', 'dropshipping store', 'single product website', 'product page builder'],
    faqs: [
      { q: 'Can I start from a product link?', a: 'Yes. Paste your product link and the AI extracts the details and writes a full store page around it, which you can then edit.' },
      faqPayments,
      faqTime,
      faqDomain,
    ],
  },
]

export function getTemplatePageEn(slug: string): TemplatePageEn | undefined {
  return TEMPLATE_PAGES_EN.find((t) => t.slug === slug)
}
