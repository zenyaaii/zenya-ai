import type { CollectiveContent } from './types'

export const COLLECTIVE_MOCK_CONTENT: CollectiveContent = {
  brand: {
    name: 'REALM',
    tagline: 'Curated for the life well lived.',
    description: 'A luxury multi-brand marketplace for the things that matter — home, wardrobe, wellness, and beauty.'
  },
  hero: {
    eyebrow: 'New season · Spring / Summer 2025',
    headline: 'The things worth\nhaving. Curated.',
    subheadline: 'Four hundred carefully chosen products across eight categories. Each one tested, considered, and worth the shelf space.',
    cta_primary: 'Shop new arrivals',
    cta_secondary: 'Browse collections',
    badge: 'Free shipping over $150'
  },
  collections: {
    eyebrow: 'Shop by collection',
    heading: 'Built around how\nyou actually live.',
    subheading: 'Each collection is a considered world — not a category dump. Products that belong together, live together.',
    items: [
      { name: 'The Living Room Edit', tagline: 'Objects that make a room worth being in.', product_count: '64 pieces', tag: 'New season' },
      { name: 'The Wardrobe Foundation', tagline: 'The 12 pieces every wardrobe needs, elevated.', product_count: '48 pieces', tag: 'Bestseller' },
      { name: 'The Morning Ritual', tagline: 'Skincare, coffee, and calm — in that order.', product_count: '36 pieces', tag: 'Staff picks' },
      { name: 'The Work from Anywhere', tagline: 'For the laptop-on-the-road life. Done properly.', product_count: '29 pieces', tag: 'New' }
    ]
  },
  new_arrivals: {
    eyebrow: 'Just landed',
    heading: 'New this week.',
    products: [
      { name: 'Linen Throw — Warm Sand', price: '$185', badge: 'New', category: 'Home', rating: 5 },
      { name: 'The Daily Moisturiser SPF50', price: '$68', badge: 'New', category: 'Beauty', rating: 5 },
      { name: 'Merino Crew Knit — Ivory', price: '$225', badge: 'New', category: 'Wardrobe', rating: 5 },
      { name: 'Walnut Serving Board', price: '$145', badge: 'Handmade', category: 'Kitchen', rating: 5 },
      { name: 'The Leather Card Holder', price: '$95', badge: 'New', category: 'Accessories', rating: 4 },
      { name: 'Ceramic Mug Set — Ash', price: '$72', badge: 'New', category: 'Kitchen', rating: 5 }
    ]
  },
  brand_promise: {
    eyebrow: 'Why REALM',
    headline: 'We test everything.\nWe list the rest.',
    body: 'Every product on REALM passed through our team\'s hands before it passed through yours. We buy it, we use it, we argue about it — and then we decide. That\'s why we carry 400 products instead of 40,000. It is harder to curate than to aggregate, and that is exactly the point.',
    stats: [
      { value: '400+', label: 'Curated products' },
      { value: '92%', label: 'Would buy again' },
      { value: '14 days', label: 'Free returns' },
      { value: '4.9★', label: 'Average rating' }
    ]
  },
  bestsellers: {
    eyebrow: 'Consistently loved',
    heading: 'The ones that never\ngo out of stock long.',
    subheading: 'These are reordered before they run out. That tells you something.',
    products: [
      { name: 'Cashmere Ribbed Beanie', price: '$145', category: 'Wardrobe', rating: 5, badge: '🔁 Reorder favourite' },
      { name: 'The Anatomy of Rest Candle', price: '$58', category: 'Home', rating: 5 },
      { name: 'Organic Cotton Robe', price: '$195', category: 'Wellness', rating: 5, badge: 'Top rated' },
      { name: 'Vitamin C Serum — 20%', price: '$88', original_price: '$110', category: 'Beauty', rating: 5 },
      { name: 'Leather Belt — Cognac', price: '$120', category: 'Accessories', rating: 5 },
      { name: 'Linen Duvet Cover — Flint', price: '$265', category: 'Home', rating: 5, badge: 'Almost gone' },
      { name: 'Stainless Thermal Flask 1L', price: '$75', category: 'Kitchen', rating: 5 },
      { name: 'Merino Socks — 3 Pack', price: '$55', category: 'Wardrobe', rating: 5, badge: '🔁 Reorder favourite' }
    ]
  },
  perks: {
    items: [
      { icon: '📦', title: 'Free shipping over $150', description: 'Delivered within 3–5 business days. Express available.' },
      { icon: '↩️', title: '14-day free returns', description: 'No questions, no friction. Print the label, drop it off.' },
      { icon: '✓', title: 'Every product tested', description: 'We use everything we sell. If it didn\'t make the cut, it\'s not listed.' },
      { icon: '🌿', title: 'Sustainability vetted', description: 'All suppliers verified for ethical sourcing and fair production.' }
    ]
  },
  testimonials: {
    eyebrow: 'From our customers',
    heading: 'They said it better than we could.',
    average_rating: 4.9,
    review_count: '6,800+ verified reviews',
    items: [
      {
        quote: 'I stopped shopping everywhere else. The curation is so good that I just start here. If REALM stocks it, I trust it. That\'s saved me from so many bad purchases.',
        author: 'Isabelle M.',
        location: 'London, UK',
        rating: 5,
        avatar_letter: 'I',
        product: 'The Wardrobe Foundation'
      },
      {
        quote: 'The linen duvet is everything. I have tried three premium brands and nothing compares. Ships fast, feels expensive, and the colour in the photos is exactly what arrives. No tricks.',
        author: 'Daniel K.',
        location: 'New York, USA',
        rating: 5,
        avatar_letter: 'D',
        product: 'Linen Duvet Cover — Flint'
      },
      {
        quote: 'I bought the Vitamin C serum as a gift for my mother who is very hard to please. She emailed me two weeks later to ask where I bought it and to tell me it was the best thing she had tried in years.',
        author: 'Sophie R.',
        location: 'Melbourne, AU',
        rating: 5,
        avatar_letter: 'S',
        product: 'Vitamin C Serum — 20%'
      }
    ]
  },
  newsletter: {
    eyebrow: 'The REALM Edit',
    heading: 'The best things,\nbefore everyone else.',
    subheading: 'New arrivals, restocks, and the occasional essay on why we chose something. Twice a month. Never more.',
    placeholder: 'your@email.com',
    cta: 'Subscribe',
    note: 'No noise. Unsubscribe any time. We take inbox seriously.'
  },
  footer: {
    tagline: 'Curated for the life well lived.',
    legal: '© 2025 REALM. All rights reserved.',
    email: 'hello@realm.co'
  },
  seo: {
    title: 'REALM — Curated Luxury Multi-Brand Store',
    description: 'Four hundred carefully curated products across home, wardrobe, beauty, and wellness. Every one tested. Every one worth it.'
  }
}
