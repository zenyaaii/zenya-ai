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
  /**
   * Heading for the signature-dishes section. Optional so older generated
   * sites (which stored only the array) keep working — the renderer falls
   * back to an Arabic default when absent. Editable from the editor.
   */
  signature_dishes_heading?: string
  menu: {
    heading: string
    subheading: string
    categories: RestaurantMenuCategory[]
  }
  gallery: {
    heading: string
    subheading: string
    images: RestaurantGalleryImage[]
    /**
     * Where the gallery images came from. Drives the small attribution
     * note under the gallery on the live site:
     *   from_venue   → "Photography by the venue."
     *   from_unsplash → "Photography sourced from Unsplash."
     * Set by the generator based on whether the user provided uploads.
     * Editable from the editor.
     */
    attribution?: 'from_venue' | 'from_unsplash'
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

  /**
   * Sections the owner has hidden in the editor. The renderer checks
   * this list at the start of each toggleable section and skips render
   * when present. Always-on sections (brand, footer) are never listed.
   */
  hidden_sections?: RestaurantSectionKey[]

  /**
   * Social media URLs the owner wants in the footer. Empty strings or
   * missing keys = don't render the icon. If every value is empty, the
   * whole social bar disappears.
   */
  social_links?: {
    instagram?: string
    facebook?: string
    tiktok?: string
    whatsapp?: string
    youtube?: string
    website?: string
  }

  /**
   * Typography preset id picked from utils/restaurant/typography.ts.
   * Independent from the colour preset (style_preset). When absent the
   * preview falls back to the color preset's heading/body fonts.
   */
  typography_preset?: string

  /**
   * Per-token colour overrides layered on top of the colour preset.
   * Any missing key falls back to the preset's value.
   */
  color_overrides?: Partial<RestaurantColors>

  /**
   * Per-section text-size + alignment overrides. Keyed by section panel id
   * (e.g. "hero", "menu"). Empty/missing sections fall back to defaults.
   * Applied via [data-section] CSS scoping in the preview.
   */
  section_styles?: Record<string, { text_scale?: number; text_align?: 'left' | 'center' | 'right' }>
}

/**
 * Sections users can show/hide from the editor. Keep this list in sync
 * with the RestaurantContent fields above.
 */
export type RestaurantSectionKey =
  | 'hero'
  | 'story'
  | 'signature_dishes'
  | 'menu'
  | 'gallery'
  | 'hours_location'
  | 'reservations'
  | 'reviews'
  | 'press'
  | 'newsletter'
  | 'faq'

export const RESTAURANT_SECTION_LABELS: Record<RestaurantSectionKey, string> = {
  hero:             'Hero',
  story:            'Our story',
  signature_dishes: 'Signature dishes',
  menu:             'Menu',
  gallery:          'Gallery',
  hours_location:   'Hours & location',
  reservations:     'Reservations',
  reviews:          'Reviews',
  press:            'Press',
  newsletter:       'Newsletter',
  faq:              'FAQ',
}
