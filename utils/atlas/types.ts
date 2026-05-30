export type AtlasStylePresetId = 'orbit' | 'midnight' | 'aurora' | 'carbon'

export type AtlasColors = {
  primary: string
  primaryMuted: string
  accent: string
  background: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  border: string
  gradient: string
  glowPrimary: string
}

export type AtlasFeature = {
  icon: string
  title: string
  description: string
  badge?: string
}

export type AtlasPricingTier = {
  name: string
  price: string
  period: string
  description: string
  cta: string
  highlighted: boolean
  features: string[]
}

export type AtlasIntegration = {
  name: string
  icon: string
  category: string
}

export type AtlasTestimonial = {
  quote: string
  author: string
  role: string
  company: string
  rating: number
  avatar_letter: string
}

export type AtlasFaqItem = {
  q: string
  a: string
}

export type AtlasStep = {
  step: string
  title: string
  description: string
  icon: string
}

export type AtlasContent = {
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
    social_proof: string
    badge?: string
  }
  trust_bar: {
    label: string
    logos: string[]
  }
  features: {
    eyebrow: string
    heading: string
    subheading: string
    items: AtlasFeature[]
  }
  how_it_works: {
    eyebrow: string
    heading: string
    subheading: string
    steps: AtlasStep[]
  }
  pricing: {
    eyebrow: string
    heading: string
    subheading: string
    tiers: AtlasPricingTier[]
  }
  integrations: {
    heading: string
    subheading: string
    items: AtlasIntegration[]
  }
  testimonials: {
    eyebrow: string
    heading: string
    items: AtlasTestimonial[]
  }
  security: {
    heading: string
    items: string[]
  }
  cta: {
    eyebrow: string
    heading: string
    subheading: string
    cta_primary: string
    cta_secondary: string
    note: string
  }
  faq: {
    heading: string
    items: AtlasFaqItem[]
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
