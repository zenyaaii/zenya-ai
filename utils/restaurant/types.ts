export type RestaurantStylePresetId = 'onyx' | 'trattoria' | 'coastal' | 'forest'

export type RestaurantColors = {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
}

export type RestaurantHours = {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  label: string
  open: string
  close: string
  closed?: boolean
}

export type RestaurantMenuItem = {
  name: string
  description: string
  price: string
  badge?: string
  image?: string
}

export type RestaurantMenuCategory = {
  id: string
  name: string
  description?: string
  items: RestaurantMenuItem[]
}

export type RestaurantSignatureDish = {
  name: string
  description: string
  price: string
  image: string
}

export type RestaurantTestimonial = {
  name: string
  text: string
  source?: string
  rating: number
}

export type RestaurantPressItem = {
  outlet: string
  quote?: string
}

export type RestaurantFaqItem = {
  q: string
  a: string
}

export type RestaurantGalleryImage = {
  url: string
  alt?: string
}

export type RestaurantReservationProvider =
  | { type: 'opentable'; url: string }
  | { type: 'resy'; url: string }
  | { type: 'sevenrooms'; url: string }
  | { type: 'phone'; number: string }
  | { type: 'form' }

export type RestaurantContent = {
  brand: {
    name: string
    cuisine: string
    tagline: string
    city: string
    neighborhood?: string
  }
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    primary_cta: string
    secondary_cta: string
    image: string
  }
  story: {
    eyebrow: string
    heading: string
    body: string
    chef_name?: string
    chef_title?: string
    chef_bio?: string
    chef_photo?: string
    accent_image?: string
  }
  signature_dishes: RestaurantSignatureDish[]
  menu: {
    heading: string
    subheading: string
    categories: RestaurantMenuCategory[]
  }
  gallery: {
    heading: string
    subheading: string
    images: RestaurantGalleryImage[]
  }
  hours_location: {
    heading: string
    subheading: string
    address: string
    phone: string
    email: string
    map_link?: string
    hours: RestaurantHours[]
  }
  reservations: {
    heading: string
    subheading: string
    cta_label: string
    provider: RestaurantReservationProvider
    note?: string
  }
  reviews: {
    heading: string
    subheading: string
    overall_rating: number
    review_count: string
    testimonials: RestaurantTestimonial[]
  }
  press: {
    heading: string
    items: RestaurantPressItem[]
  }
  newsletter: {
    heading: string
    subheading: string
    button_label: string
  }
  faq: {
    heading: string
    items: RestaurantFaqItem[]
  }
  footer: {
    tagline: string
    legal: string
  }
  seo: {
    title: string
    description: string
  }
}
