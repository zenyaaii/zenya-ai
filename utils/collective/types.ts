export type CollectiveStylePresetId = 'jade' | 'dusk' | 'pearl' | 'iris'

export type CollectiveColors = {
  primary: string
  primaryLight: string
  accent: string
  accentMuted: string
  background: string
  surface: string
  surfaceGlass: string
  surfaceAlt: string
  text: string
  textInverse: string
  muted: string
  border: string
  borderGlass: string
  overlay: string
  gradient: string
  auroraA: string
  auroraB: string
  auroraC: string
  glowPrimary: string
  glowAccent: string
}

export type CollectiveProduct = {
  name: string
  price: string
  original_price?: string
  badge?: string
  category: string
  rating?: number
}

export type CollectiveCollection = {
  name: string
  tagline: string
  product_count: string
  tag?: string
}

export type CollectiveTestimonial = {
  quote: string
  author: string
  location: string
  rating: number
  avatar_letter: string
  product?: string
}

export type CollectiveContent = {
  brand: {
    name: string
    tagline: string
    description: string
  }
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    cta_primary: string
    cta_secondary: string
    badge?: string
  }
  collections: {
    eyebrow: string
    heading: string
    subheading: string
    items: CollectiveCollection[]
  }
  new_arrivals: {
    eyebrow: string
    heading: string
    products: CollectiveProduct[]
  }
  brand_promise: {
    eyebrow: string
    headline: string
    body: string
    stats: { value: string; label: string }[]
  }
  bestsellers: {
    eyebrow: string
    heading: string
    subheading: string
    products: CollectiveProduct[]
  }
  perks: {
    items: { icon: string; title: string; description: string }[]
  }
  testimonials: {
    eyebrow: string
    heading: string
    average_rating: number
    review_count: string
    items: CollectiveTestimonial[]
  }
  newsletter: {
    eyebrow: string
    heading: string
    subheading: string
    placeholder: string
    cta: string
    note: string
  }
  footer: {
    tagline: string
    legal: string
    email: string
  }
  seo: {
    title: string
    description: string
  }
}
