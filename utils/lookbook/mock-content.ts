import type { LookbookContent } from './types'

export const LOOKBOOK_MOCK_CONTENT: LookbookContent = {
  brand: {
    name: 'VELA',
    tagline: 'Wear what matters.',
    category: 'Contemporary Women\'s Fashion'
  },
  hero: {
    eyebrow: 'Spring · Summer 2025',
    headline: 'Dressed for\nthe life\nyou\'re living.',
    subheadline:
      'Elevated basics and considered pieces for women who move through the world with intention. Crafted in limited runs, made to last.',
    cta_primary: 'Shop the collection',
    cta_secondary: 'View lookbook',
    badge: 'New drop · Limited pieces'
  },
  drop_banner: {
    label: '🖤 New drop',
    text: 'The Cortège Edit — 18 new pieces, available now. Free shipping on all orders.',
    cta: 'Shop now →'
  },
  lookbook: {
    eyebrow: 'SS25 Lookbook',
    heading: 'The Cortège Edit.',
    subheading:
      'A collection built around ease, intention, and the quiet confidence of a woman who already knows.',
    looks: [
      { title: 'Look 01', subtitle: 'The Linen Column Dress', tag: 'Shop this look' },
      { title: 'Look 02', subtitle: 'The Tailored Slouch', tag: 'Shop this look' },
      { title: 'Look 03', subtitle: 'The Silk Bias Set', tag: 'New arrival' },
      { title: 'Look 04', subtitle: 'The Côte d\'Azur Knit', tag: 'Shop this look' },
      { title: 'Look 05', subtitle: 'The Weekend Trench', tag: 'Almost gone' },
      { title: 'Look 06', subtitle: 'The Studio Trouser', tag: 'Shop this look' }
    ]
  },
  bestsellers: {
    eyebrow: 'Customer favourites',
    heading: 'The pieces they keep reordering.',
    products: [
      { name: 'The Linen Column Dress', price: '$245', badge: 'New', category: 'Dresses' },
      { name: 'The Tailored Blazer', price: '$320', original_price: '$420', badge: 'Sale', category: 'Outerwear' },
      { name: 'The Wide-Leg Trouser', price: '$195', category: 'Bottoms' },
      { name: 'The Silk Camisole', price: '$145', badge: 'Almost gone', category: 'Tops' },
      { name: 'The Cashmere Knit', price: '$285', category: 'Knitwear' },
      { name: 'The Bias-Cut Skirt', price: '$175', badge: 'New', category: 'Bottoms' },
      { name: 'The Oversized Shirt', price: '$165', category: 'Tops' },
      { name: 'The Minimal Mule', price: '$215', category: 'Shoes' }
    ]
  },
  brand_story: {
    eyebrow: 'Our story',
    heading: 'Built slowly.\nFor women\nwho move fast.',
    body:
      'VELA was founded in 2019 with one question: why does getting dressed still feel so hard? We set out to build a wardrobe of considered pieces — things that work together, hold their shape, and get better with time. No seasonal overload. No fast fashion filler. Just the pieces you\'ll reach for on every kind of day.',
    values: [
      {
        icon: '◎',
        title: 'Considered production',
        text: 'We produce in limited runs to eliminate waste and work only with certified ethical manufacturers.'
      },
      {
        icon: '✦',
        title: 'Natural fibres only',
        text: 'Linen, silk, organic cotton, cashmere — materials that breathe, age beautifully, and biodegrade.'
      },
      {
        icon: '→',
        title: 'Timeless over trending',
        text: 'No drops every two weeks. We release two considered collections per year — and that is enough.'
      }
    ]
  },
  press: {
    heading: 'As seen in',
    publications: ['Vogue', 'Harper\'s Bazaar', 'The Cut', 'Refinery29', 'Who What Wear', 'Byrdie']
  },
  testimonials: {
    eyebrow: 'What they\'re saying',
    heading: 'Worn, loved, reordered.',
    average_rating: 4.9,
    review_count: '2,400+ reviews',
    items: [
      {
        author: 'Sophie L.',
        rating: 5,
        text: 'The linen dress is the best thing I have bought in years. I wore it every single day in Sardinia and got stopped three times to ask where it was from. The quality is unlike anything else at this price point.',
        item: 'The Linen Column Dress',
        verified: true
      },
      {
        author: 'Camille R.',
        rating: 5,
        text: 'I have returned more clothes than I care to admit, but I have never returned a single VELA piece. The tailored blazer fits like it was made for me, and the cashmere has survived two machine washes without pilling.',
        item: 'The Tailored Blazer',
        verified: true
      },
      {
        author: 'Nadia M.',
        rating: 5,
        text: 'I bought the wide-leg trouser six months ago and I have worn it at least twice a week since. It hasn\'t stretched, the colour hasn\'t faded, and it still looks as good as the day it arrived. Worth every penny.',
        item: 'The Wide-Leg Trouser',
        verified: true
      }
    ]
  },
  newsletter: {
    eyebrow: 'Join the edit',
    heading: 'First to the new drop.',
    subheading:
      'Get early access to new collections, behind-the-scenes from our ateliers, and styling notes delivered quietly to your inbox.',
    placeholder: 'your@email.com',
    cta: 'Join the list',
    note: 'No spam. Unsubscribe any time. We send 2–3 emails per month.'
  },
  footer: {
    tagline: 'Wear what matters.',
    legal: '© 2025 VELA. All rights reserved.',
    email: 'hello@vela.co'
  },
  seo: {
    title: 'VELA — Contemporary Women\'s Fashion · SS25 Collection',
    description:
      'Elevated basics and considered pieces for women who move with intention. Limited runs, natural fibres, ethical production. Shop the SS25 collection.'
  }
}
