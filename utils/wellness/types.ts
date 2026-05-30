export type WellnessStylePresetId = 'zen' | 'bloom' | 'forest' | 'noir'

export type WellnessColors = {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
  overlay: string
}

export type WellnessTreatment = {
  name: string
  category: string
  duration: string
  price: string
  description: string
  badge?: string
}

export type WellnessTeamMember = {
  name: string
  title: string
  specialty: string
  bio: string
  image?: string
}

export type WellnessTestimonial = {
  name: string
  text: string
  treatment?: string
  rating: number
}

export type WellnessFaqItem = {
  q: string
  a: string
}

export type WellnessPhilosophyPillar = {
  icon: string
  title: string
  text: string
}

export type WellnessJourneyStep = {
  step: string
  title: string
  text: string
}

export type WellnessGalleryImage = {
  url: string
  alt?: string
}

export type WellnessContent = {
  brand: {
    name: string
    type: string
    city: string
    region?: string
    tagline: string
  }
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    cta_primary: string
    cta_secondary: string
    image: string
    badge?: string
  }
  trust_bar: {
    items: string[]
  }
  philosophy: {
    eyebrow: string
    heading: string
    subheading: string
    pillars: WellnessPhilosophyPillar[]
  }
  treatments: {
    heading: string
    subheading: string
    items: WellnessTreatment[]
  }
  journey: {
    heading: string
    subheading: string
    steps: WellnessJourneyStep[]
  }
  team: {
    heading: string
    subheading: string
    members: WellnessTeamMember[]
  }
  space: {
    heading: string
    subheading: string
    images: WellnessGalleryImage[]
    amenities: string[]
  }
  testimonials: {
    heading: string
    subheading: string
    average_rating: number
    review_count: string
    items: WellnessTestimonial[]
  }
  booking_cta: {
    eyebrow: string
    heading: string
    subheading: string
    cta_label: string
    note: string
    image: string
  }
  faq: {
    heading: string
    items: WellnessFaqItem[]
  }
  footer: {
    tagline: string
    legal: string
    phone: string
    email: string
    address?: string
    hours?: string
    booking_url?: string
  }
  seo: {
    title: string
    description: string
  }
}
