import {
  Home as HomeIcon, FileText, Image as ImageIcon, MapPin, Type as TypeIcon,
  Star, Sparkles, MessageCircle, Calendar, Mail, Newspaper, HelpCircle,
  AtSign, Phone,
} from 'lucide-react'
import { RESTAURANT_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',    label: 'Primary' },
  { key: 'accent',     label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface',    label: 'Surface' },
  { key: 'text',       label: 'Text' },
  { key: 'muted',      label: 'Muted text' },
  { key: 'border',     label: 'Border' },
]

export const RESTAURANT_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'restaurant',
  themeName:       'Maison · Restaurant',
  defaultPresetId: 'onyx',
  brandNamePath:   'brand.name',
  colorPresets:    RESTAURANT_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',    label: 'Home',    icon: HomeIcon },
    { id: 'menu',    label: 'Menu',    icon: FileText },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'visit',   label: 'Visit',   icon: MapPin },
    { id: 'about',   label: 'About',   icon: TypeIcon },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ],

  panels: [
    /* ── Home ─────────────────────────────────────────────────────────── */
    {
      id: 'hero', label: 'Hero', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'Eyebrow' },
        { type: 'textarea', path: 'hero.headline',      label: 'Headline', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'Subheadline', rows: 3 },
        { type: 'text',     path: 'hero.primary_cta',   label: 'Primary CTA' },
        { type: 'text',     path: 'hero.secondary_cta', label: 'Secondary CTA' },
        { type: 'image',    path: 'hero.image',         label: 'Hero image' },
      ],
    },
    {
      id: 'signature_dishes', label: 'Signature dishes', icon: Star, page: 'home',
      fields: [
        { type: 'textarea', path: 'signature_dishes_heading', label: 'Heading', rows: 2 },
        {
          type: 'array', path: 'signature_dishes',
          label: 'Dishes', itemLabel: 'dish', itemTitle: 'name',
          makeItem: () => ({ name: 'New dish', description: '', price: '', image: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'Name' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 2 },
            { type: 'text',     path: 'price',       label: 'Price' },
            { type: 'image',    path: 'image',       label: 'Photo' },
          ],
        },
      ],
    },
    {
      id: 'press', label: 'Press', icon: Newspaper, page: 'home',
      fields: [
        { type: 'text', path: 'press.heading', label: 'Heading' },
        {
          type: 'array', path: 'press.items',
          label: 'Press items', itemLabel: 'mention', itemTitle: 'outlet',
          makeItem: () => ({ outlet: 'New outlet', quote: '' }),
          itemFields: [
            { type: 'text',     path: 'outlet', label: 'Outlet' },
            { type: 'textarea', path: 'quote',  label: 'Quote', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'newsletter', label: 'Newsletter', icon: Mail, page: 'home',
      fields: [
        { type: 'textarea', path: 'newsletter.heading',      label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'newsletter.subheading',   label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'newsletter.button_label', label: 'Button label' },
      ],
    },

    /* ── Menu ─────────────────────────────────────────────────────────── */
    {
      id: 'menu', label: 'Menu', icon: FileText, page: 'menu',
      fields: [
        { type: 'textarea', path: 'menu.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'menu.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'menu.categories',
          label: 'Categories', itemLabel: 'category', itemTitle: 'name',
          makeItem: () => ({
            id: Math.random().toString(36).slice(2, 9),
            name: 'New category',
            description: '',
            items: [],
          }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'Category name' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 2 },
            {
              type: 'array', path: 'items',
              label: 'Items', itemLabel: 'item', itemTitle: 'name',
              makeItem: () => ({ name: 'New item', description: '', price: '', badge: '', image: '' }),
              itemFields: [
                { type: 'text',     path: 'name',        label: 'Name' },
                { type: 'textarea', path: 'description', label: 'Description', rows: 2 },
                { type: 'text',     path: 'price',       label: 'Price' },
                { type: 'text',     path: 'badge',       label: 'Badge (optional)' },
                { type: 'image',    path: 'image',       label: 'Photo (optional)' },
              ],
            },
          ],
        },
      ],
    },

    /* ── Gallery ──────────────────────────────────────────────────────── */
    {
      id: 'gallery', label: 'Gallery', icon: ImageIcon, page: 'gallery',
      fields: [
        { type: 'textarea', path: 'gallery.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'gallery.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'gallery.images',
          label: 'Photos', itemLabel: 'photo', itemTitle: 'alt',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'Photo' },
            { type: 'text',  path: 'alt', label: 'Alt text' },
          ],
        },
        { type: 'note', content: 'Attribution: "from_venue" credits the restaurant. "from_unsplash" credits Unsplash. Leave blank to hide the line.' },
        { type: 'text', path: 'gallery.attribution', label: 'Attribution (from_venue / from_unsplash)' },
      ],
    },

    /* ── Visit ────────────────────────────────────────────────────────── */
    {
      id: 'hours_location', label: 'Hours & location', icon: MapPin, page: 'visit',
      fields: [
        { type: 'textarea', path: 'hours_location.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'hours_location.subheading', label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'hours_location.address',    label: 'Address' },
        { type: 'text',     path: 'hours_location.phone',      label: 'Phone' },
        { type: 'text',     path: 'hours_location.email',      label: 'Email' },
        { type: 'text',     path: 'hours_location.map_link',   label: 'Google Maps link' },
        {
          type: 'array', path: 'hours_location.hours',
          label: 'Opening hours', itemLabel: 'day', itemTitle: 'label',
          makeItem: () => ({ day: 'monday', label: 'Monday', open: '', close: '', closed: false }),
          itemFields: [
            { type: 'text', path: 'label', label: 'Day label' },
            { type: 'text', path: 'open',  label: 'Open' },
            { type: 'text', path: 'close', label: 'Close' },
          ],
        },
      ],
    },
    {
      id: 'reservations', label: 'Reservations', icon: Calendar, page: 'visit',
      fields: [
        { type: 'textarea', path: 'reservations.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'reservations.subheading', label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'reservations.cta_label',  label: 'CTA label' },
        { type: 'textarea', path: 'reservations.note',       label: 'Note', rows: 2 },
        { type: 'note', content: 'Provider type: opentable / resy / sevenrooms / phone / form. Plus the matching URL or phone number.' },
        { type: 'text', path: 'reservations.provider.type', label: 'Provider type' },
        { type: 'text', path: 'reservations.provider.url',  label: 'Provider URL (if web)' },
        { type: 'text', path: 'reservations.provider.number', label: 'Phone number (if phone)' },
      ],
    },

    /* ── About ────────────────────────────────────────────────────────── */
    {
      id: 'story', label: 'Our story', icon: TypeIcon, page: 'about',
      fields: [
        { type: 'text',     path: 'story.eyebrow',     label: 'Eyebrow' },
        { type: 'textarea', path: 'story.heading',     label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'story.body',        label: 'Story body', rows: 6 },
        { type: 'text',     path: 'story.chef_name',   label: 'Chef name' },
        { type: 'text',     path: 'story.chef_title',  label: 'Chef title' },
        { type: 'textarea', path: 'story.chef_bio',    label: 'Chef bio', rows: 4 },
        { type: 'image',    path: 'story.chef_photo',  label: 'Chef photo' },
        { type: 'image',    path: 'story.accent_image', label: 'Accent image' },
      ],
    },

    /* ── Reviews ──────────────────────────────────────────────────────── */
    {
      id: 'reviews', label: 'Reviews', icon: Star, page: 'reviews',
      fields: [
        { type: 'textarea', path: 'reviews.heading',        label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'reviews.subheading',     label: 'Subheading', rows: 2 },
        { type: 'number',   path: 'reviews.overall_rating', label: 'Overall rating', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'reviews.review_count',   label: 'Review count' },
        {
          type: 'array', path: 'reviews.testimonials',
          label: 'Testimonials', itemLabel: 'review', itemTitle: 'name',
          makeItem: () => ({ name: 'Guest', text: '', source: '', rating: 5 }),
          itemFields: [
            { type: 'text',     path: 'name',   label: 'Name' },
            { type: 'textarea', path: 'text',   label: 'Quote', rows: 3 },
            { type: 'text',     path: 'source', label: 'Source (optional)' },
            { type: 'number',   path: 'rating', label: 'Rating', min: 1, max: 5 },
          ],
        },
      ],
    },
    {
      id: 'faq', label: 'FAQ', icon: HelpCircle, page: 'reviews',
      fields: [
        { type: 'text', path: 'faq.heading', label: 'Heading' },
        {
          type: 'array', path: 'faq.items',
          label: 'Questions', itemLabel: 'question', itemTitle: 'q',
          makeItem: () => ({ q: 'New question?', a: '' }),
          itemFields: [
            { type: 'text',     path: 'q', label: 'Question' },
            { type: 'textarea', path: 'a', label: 'Answer', rows: 3 },
          ],
        },
      ],
    },
  ],

  globalPanels: [
    {
      id: 'brand_global', label: 'Brand', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',         label: 'Restaurant name' },
        { type: 'text', path: 'brand.cuisine',      label: 'Cuisine' },
        { type: 'text', path: 'brand.tagline',      label: 'Tagline' },
        { type: 'text', path: 'brand.city',         label: 'City' },
        { type: 'text', path: 'brand.neighborhood', label: 'Neighborhood' },
      ],
    },
    {
      id: 'social', label: 'Social', icon: AtSign,
      fields: [
        { type: 'text', path: 'social_links.instagram', label: 'Instagram URL' },
        { type: 'text', path: 'social_links.facebook',  label: 'Facebook URL' },
        { type: 'text', path: 'social_links.tiktok',    label: 'TikTok URL' },
        { type: 'text', path: 'social_links.whatsapp',  label: 'WhatsApp URL' },
        { type: 'text', path: 'social_links.youtube',   label: 'YouTube URL' },
        { type: 'text', path: 'social_links.website',   label: 'Website URL' },
      ],
    },
    {
      id: 'footer', label: 'Footer', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'Tagline' },
        { type: 'text', path: 'footer.legal',   label: 'Legal' },
      ],
    },
    {
      id: 'seo', label: 'SEO', icon: MessageCircle,
      fields: [
        { type: 'text',     path: 'seo.title',       label: 'Page title' },
        { type: 'textarea', path: 'seo.description', label: 'Description', rows: 3 },
      ],
    },
  ],
}
