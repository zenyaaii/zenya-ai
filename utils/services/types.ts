export type ServiceStylePresetId = 'cobalt' | 'graphite' | 'amber' | 'emerald'

export type ServiceColors = {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
}

export type ServiceStat = {
  value: string
  label: string
}

export type ServiceItem = {
  name: string
  description: string
  price_from?: string
  badge?: string
}

export type ServiceProofItem = {
  title: string
  text: string
}

export type ServiceStep = {
  step: string
  title: string
  text: string
}

export type ServiceTestimonial = {
  name: string
  text: string
  source?: string
  rating: number
}

export type ServiceFaqItem = {
  q: string
  a: string
}

export type ServiceGalleryImage = {
  url: string
  alt?: string
}

export type ServiceContent = {
  brand: {
    name: string
    category: string
    city: string
    region?: string
    tagline: string
    owner_name?: string
  }
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    primary_cta: string
    secondary_cta: string
    image: string
    stats: ServiceStat[]
  }
  trust_bar: {
    items: string[]
  }
  services: {
    heading: string
    subheading: string
    items: ServiceItem[]
  }
  story: {
    eyebrow: string
    heading: string
    body: string
    owner_name?: string
    owner_title?: string
    quote?: string
    image?: string
  }
  proof: {
    heading: string
    subheading: string
    items: ServiceProofItem[]
  }
  before_after: {
    heading: string
    subheading: string
    before_label: string
    after_label: string
    before_image: string
    after_image: string
    highlights: string[]
  }
  process: {
    heading: string
    subheading: string
    steps: ServiceStep[]
  }
  areas: {
    heading: string
    subheading: string
    areas_served: string[]
    response_time: string
    availability: string
  }
  offer: {
    badge?: string
    heading: string
    subheading: string
    points: string[]
    cta_label: string
  }
  testimonials: {
    heading: string
    subheading: string
    average_rating: number
    review_count: string
    items: ServiceTestimonial[]
  }
  faq: {
    heading: string
    items: ServiceFaqItem[]
  }
  final_cta: {
    heading: string
    subheading: string
    cta_label: string
    secondary_text: string
  }
  gallery: {
    heading: string
    images: ServiceGalleryImage[]
  }
  footer: {
    tagline: string
    legal: string
    phone: string
    email: string
    address?: string
  }
  seo: {
    title: string
    description: string
  }
}
