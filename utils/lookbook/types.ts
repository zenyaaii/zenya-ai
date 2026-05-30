export type LookbookStylePresetId = 'noir' | 'blush' | 'earth' | 'void'

export type LookbookColors = {
  primary: string
  accent: string
  background: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  border: string
  overlay: string
  badge: string
  badgeText: string
}

export type LookbookProduct = {
  name: string
  price: string
  original_price?: string
  badge?: string
  category?: string
}

export type LookbookLook = {
  title: string
  subtitle?: string
  tag?: string
}

export type LookbookValue = {
  icon: string
  title: string
  text: string
}

export type LookbookReview = {
  author: string
  rating: number
  text: string
  item?: string
  verified?: boolean
}

export type LookbookContent = {
  brand: {
    name: string
    tagline: string
    category: string
  }
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    cta_primary: string
    cta_secondary: string
    badge?: string
  }
  drop_banner: {
    label: string
    text: string
    cta: string
  }
  lookbook: {
    eyebrow: string
    heading: string
    subheading: string
    looks: LookbookLook[]
  }
  bestsellers: {
    eyebrow: string
    heading: string
    products: LookbookProduct[]
  }
  brand_story: {
    eyebrow: string
    heading: string
    body: string
    values: LookbookValue[]
  }
  press: {
    heading: string
    publications: string[]
  }
  testimonials: {
    eyebrow: string
    heading: string
    average_rating: number
    review_count: string
    items: LookbookReview[]
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
