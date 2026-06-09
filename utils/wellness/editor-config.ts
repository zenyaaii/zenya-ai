import {
  Sparkles, Leaf, Hand, Users, Star, HelpCircle, Mail, Phone, Image as ImageIcon,
  Calendar, Home as HomeIcon, Info,
} from 'lucide-react'
import { WELLNESS_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',    label: 'Primary' },
  { key: 'accent',     label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface',    label: 'Surface' },
  { key: 'text',       label: 'Text' },
  { key: 'muted',      label: 'Muted text' },
  { key: 'border',     label: 'Border' },
  { key: 'overlay',    label: 'Overlay' },
]

export const WELLNESS_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'wellness',
  themeName:       'Wellness',
  defaultPresetId: 'zen',
  brandNamePath:   'brand.name',
  colorPresets:    WELLNESS_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',       label: 'Home',       icon: HomeIcon },
    { id: 'treatments', label: 'Treatments', icon: Hand },
    { id: 'team',       label: 'Team',       icon: Users },
    { id: 'space',      label: 'Space',      icon: ImageIcon },
    { id: 'about',      label: 'About',      icon: Info },
    { id: 'contact',    label: 'Contact',    icon: Phone },
  ],

  panels: [
    {
      id: 'brand', label: 'Brand', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',    label: 'Brand name' },
        { type: 'text', path: 'brand.type',    label: 'Type (e.g. Spa)' },
        { type: 'text', path: 'brand.city',    label: 'City' },
        { type: 'text', path: 'brand.region',  label: 'Region (optional)' },
        { type: 'text', path: 'brand.tagline', label: 'Tagline' },
      ],
    },
    {
      id: 'hero', label: 'Hero', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'Eyebrow' },
        { type: 'textarea', path: 'hero.headline',      label: 'Headline', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'Subheadline', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',   label: 'Primary CTA' },
        { type: 'text',     path: 'hero.cta_secondary', label: 'Secondary CTA' },
        { type: 'text',     path: 'hero.badge',         label: 'Badge (optional)' },
        { type: 'image',    path: 'hero.image',         label: 'Hero image' },
      ],
    },
    {
      id: 'trust_bar', label: 'Trust bar', icon: Star, page: 'home',
      fields: [
        { type: 'strings', path: 'trust_bar.items', label: 'Trust items', addLabel: 'Add item' },
      ],
    },
    {
      id: 'philosophy', label: 'Philosophy', icon: Leaf, page: 'home',
      fields: [
        { type: 'text',     path: 'philosophy.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'philosophy.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'philosophy.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'philosophy.pillars',
          label: 'Pillars', itemLabel: 'pillar', itemTitle: 'title',
          makeItem: () => ({ icon: 'leaf', title: 'New pillar', text: '' }),
          itemFields: [
            { type: 'text',     path: 'icon',  label: 'Icon name' },
            { type: 'text',     path: 'title', label: 'Title' },
            { type: 'textarea', path: 'text',  label: 'Text', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'treatments', label: 'Treatments', icon: Hand, page: 'treatments',
      fields: [
        { type: 'textarea', path: 'treatments.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'treatments.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'treatments.items',
          label: 'Treatments', itemLabel: 'treatment', itemTitle: 'name',
          makeItem: () => ({ name: 'New treatment', category: '', duration: '60 min', price: '$0', description: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'Name' },
            { type: 'text',     path: 'category',    label: 'Category' },
            { type: 'text',     path: 'duration',    label: 'Duration' },
            { type: 'text',     path: 'price',       label: 'Price' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 3 },
            { type: 'text',     path: 'badge',       label: 'Badge (optional)' },
          ],
        },
      ],
    },
    {
      id: 'journey', label: 'Journey', icon: Sparkles, page: 'treatments',
      fields: [
        { type: 'textarea', path: 'journey.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'journey.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'journey.steps',
          label: 'Steps', itemLabel: 'step', itemTitle: 'title',
          makeItem: () => ({ step: '01', title: 'New step', text: '' }),
          itemFields: [
            { type: 'text',     path: 'step',  label: 'Step number' },
            { type: 'text',     path: 'title', label: 'Title' },
            { type: 'textarea', path: 'text',  label: 'Text', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'team', label: 'Team', icon: Users, page: 'team',
      fields: [
        { type: 'textarea', path: 'team.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'team.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'team.members',
          label: 'Team members', itemLabel: 'member', itemTitle: 'name',
          makeItem: () => ({ name: 'New therapist', title: 'Therapist', specialty: '', bio: '', image: '' }),
          itemFields: [
            { type: 'text',     path: 'name',      label: 'Name' },
            { type: 'text',     path: 'title',     label: 'Title' },
            { type: 'text',     path: 'specialty', label: 'Specialty' },
            { type: 'textarea', path: 'bio',       label: 'Short bio', rows: 3 },
            { type: 'image',    path: 'image',     label: 'Portrait' },
          ],
        },
      ],
    },
    {
      id: 'space', label: 'The space', icon: ImageIcon, page: 'space',
      fields: [
        { type: 'textarea', path: 'space.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'space.subheading', label: 'Subheading', rows: 2 },
        { type: 'strings',  path: 'space.amenities',  label: 'Amenities', addLabel: 'Add amenity' },
        {
          type: 'array', path: 'space.images',
          label: 'Gallery photos', itemLabel: 'photo', itemTitle: 'alt',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'Photo' },
            { type: 'text',  path: 'alt', label: 'Alt text' },
          ],
        },
      ],
    },
    {
      id: 'testimonials', label: 'Testimonials', icon: Star, page: 'home',
      fields: [
        { type: 'textarea', path: 'testimonials.heading',        label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'testimonials.subheading',     label: 'Subheading', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'Average rating', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'Review count text' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'Reviews', itemLabel: 'review', itemTitle: 'name',
          makeItem: () => ({ name: 'Client', text: '', treatment: '', rating: 5 }),
          itemFields: [
            { type: 'text',     path: 'name',      label: 'Name' },
            { type: 'textarea', path: 'text',      label: 'Quote', rows: 3 },
            { type: 'text',     path: 'treatment', label: 'Treatment' },
            { type: 'number',   path: 'rating',    label: 'Rating', min: 1, max: 5 },
          ],
        },
      ],
    },
    {
      id: 'booking_cta', label: 'Booking CTA', icon: Calendar, page: 'home',
      fields: [
        { type: 'text',     path: 'booking_cta.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'booking_cta.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'booking_cta.subheading', label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'booking_cta.cta_label',  label: 'CTA label' },
        { type: 'text',     path: 'booking_cta.note',       label: 'Note' },
        { type: 'image',    path: 'booking_cta.image',      label: 'Image' },
      ],
    },
    {
      id: 'faq', label: 'FAQ', icon: HelpCircle, page: 'contact',
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
      id: 'footer', label: 'Footer', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline',     label: 'Tagline' },
        { type: 'text', path: 'footer.legal',       label: 'Legal' },
        { type: 'text', path: 'footer.phone',       label: 'Phone' },
        { type: 'text', path: 'footer.email',       label: 'Email' },
        { type: 'text', path: 'footer.address',     label: 'Address' },
        { type: 'text', path: 'footer.hours',       label: 'Hours' },
        { type: 'text', path: 'footer.booking_url', label: 'Booking URL' },
      ],
    },
  ],
}
