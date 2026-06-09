import {
  Sparkles, Wrench, Star, MapPin, Phone, Award, HelpCircle, Image as ImageIcon,
  Quote, Home as HomeIcon, BookOpen, Workflow,
} from 'lucide-react'
import { SERVICE_PRESETS } from './presets'
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

export const SERVICES_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'services',
  themeName:       'Services',
  defaultPresetId: 'cobalt',
  brandNamePath:   'brand.name',
  colorPresets:    SERVICE_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',     label: 'Home',     icon: HomeIcon },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'about',    label: 'About',    icon: BookOpen },
    { id: 'process',  label: 'Process',  icon: Workflow },
    { id: 'contact',  label: 'Contact',  icon: Phone },
  ],

  panels: [
    {
      id: 'brand', label: 'Business', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',       label: 'Business name' },
        { type: 'text', path: 'brand.category',   label: 'Category (e.g. Plumber)' },
        { type: 'text', path: 'brand.city',       label: 'City' },
        { type: 'text', path: 'brand.region',     label: 'Region' },
        { type: 'text', path: 'brand.tagline',    label: 'Tagline' },
        { type: 'text', path: 'brand.owner_name', label: 'Owner name (optional)' },
      ],
    },
    {
      id: 'hero', label: 'Hero', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'Eyebrow' },
        { type: 'textarea', path: 'hero.headline',      label: 'Headline', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'Subheadline', rows: 3 },
        { type: 'text',     path: 'hero.primary_cta',   label: 'Primary CTA' },
        { type: 'text',     path: 'hero.secondary_cta', label: 'Secondary CTA' },
        { type: 'image',    path: 'hero.image',         label: 'Hero image' },
        {
          type: 'array', path: 'hero.stats',
          label: 'Stat tiles', itemLabel: 'stat', itemTitle: 'label',
          makeItem: () => ({ value: '0', label: 'New stat' }),
          itemFields: [
            { type: 'text', path: 'value', label: 'Value' },
            { type: 'text', path: 'label', label: 'Label' },
          ],
        },
      ],
    },
    {
      id: 'trust_bar', label: 'Trust bar', icon: Star, page: 'home',
      fields: [
        { type: 'strings', path: 'trust_bar.items', label: 'Trust items', addLabel: 'Add item' },
      ],
    },
    {
      id: 'services', label: 'Services', icon: Wrench, page: 'services',
      fields: [
        { type: 'textarea', path: 'services.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'services.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'services.items',
          label: 'Services', itemLabel: 'service', itemTitle: 'name',
          makeItem: () => ({ name: 'New service', description: '', price_from: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'Name' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 3 },
            { type: 'text',     path: 'price_from',  label: 'Starting price' },
            { type: 'text',     path: 'badge',       label: 'Badge (optional)' },
          ],
        },
      ],
    },
    {
      id: 'story', label: 'Story', icon: Quote, page: 'about',
      fields: [
        { type: 'text',     path: 'story.eyebrow',     label: 'Eyebrow' },
        { type: 'textarea', path: 'story.heading',     label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'story.body',        label: 'Body', rows: 5 },
        { type: 'text',     path: 'story.owner_name',  label: 'Owner name' },
        { type: 'text',     path: 'story.owner_title', label: 'Owner title' },
        { type: 'textarea', path: 'story.quote',       label: 'Quote', rows: 2 },
        { type: 'image',    path: 'story.image',       label: 'Owner photo' },
      ],
    },
    {
      id: 'proof', label: 'Proof', icon: Award, page: 'services',
      fields: [
        { type: 'textarea', path: 'proof.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'proof.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'proof.items',
          label: 'Proof items', itemLabel: 'proof', itemTitle: 'title',
          makeItem: () => ({ title: 'New proof', text: '' }),
          itemFields: [
            { type: 'text',     path: 'title', label: 'Title' },
            { type: 'textarea', path: 'text',  label: 'Text', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'before_after', label: 'Before / after', icon: ImageIcon, page: 'services',
      fields: [
        { type: 'textarea', path: 'before_after.heading',      label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'before_after.subheading',   label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'before_after.before_label', label: 'Before label' },
        { type: 'text',     path: 'before_after.after_label',  label: 'After label' },
        { type: 'image',    path: 'before_after.before_image', label: 'Before image' },
        { type: 'image',    path: 'before_after.after_image',  label: 'After image' },
        { type: 'strings',  path: 'before_after.highlights',   label: 'Highlights', addLabel: 'Add highlight' },
      ],
    },
    {
      id: 'process', label: 'Process', icon: Award, page: 'process',
      fields: [
        { type: 'textarea', path: 'process.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'process.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'process.steps',
          label: 'Steps', itemLabel: 'step', itemTitle: 'title',
          makeItem: () => ({ step: '01', title: '', text: '' }),
          itemFields: [
            { type: 'text',     path: 'step',  label: 'Step number' },
            { type: 'text',     path: 'title', label: 'Title' },
            { type: 'textarea', path: 'text',  label: 'Text', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'areas', label: 'Areas served', icon: MapPin, page: 'contact',
      fields: [
        { type: 'textarea', path: 'areas.heading',       label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'areas.subheading',    label: 'Subheading', rows: 2 },
        { type: 'strings',  path: 'areas.areas_served',  label: 'Areas', addLabel: 'Add area' },
        { type: 'text',     path: 'areas.response_time', label: 'Response time' },
        { type: 'text',     path: 'areas.availability',  label: 'Availability' },
      ],
    },
    {
      id: 'offer', label: 'Offer', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'offer.badge',      label: 'Badge' },
        { type: 'textarea', path: 'offer.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'offer.subheading', label: 'Subheading', rows: 2 },
        { type: 'strings',  path: 'offer.points',     label: 'Bullet points', addLabel: 'Add point' },
        { type: 'text',     path: 'offer.cta_label',  label: 'CTA label' },
      ],
    },
    {
      id: 'testimonials', label: 'Testimonials', icon: Star, page: 'home',
      fields: [
        { type: 'textarea', path: 'testimonials.heading',        label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'testimonials.subheading',     label: 'Subheading', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'Average rating', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'Review count' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'Reviews', itemLabel: 'review', itemTitle: 'name',
          makeItem: () => ({ name: 'Customer', text: '', source: '', rating: 5 }),
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
      id: 'gallery', label: 'Gallery', icon: ImageIcon, page: 'services',
      fields: [
        { type: 'text', path: 'gallery.heading', label: 'Heading' },
        {
          type: 'array', path: 'gallery.images',
          label: 'Photos', itemLabel: 'photo', itemTitle: 'alt',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'Photo' },
            { type: 'text',  path: 'alt', label: 'Alt text' },
          ],
        },
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
    {
      id: 'final_cta', label: 'Final CTA', icon: Sparkles, page: 'home',
      fields: [
        { type: 'textarea', path: 'final_cta.heading',        label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'final_cta.subheading',     label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'final_cta.cta_label',      label: 'CTA label' },
        { type: 'text',     path: 'final_cta.secondary_text', label: 'Secondary text' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'footer', label: 'Footer', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'Tagline' },
        { type: 'text', path: 'footer.legal',   label: 'Legal' },
        { type: 'text', path: 'footer.phone',   label: 'Phone' },
        { type: 'text', path: 'footer.email',   label: 'Email' },
        { type: 'text', path: 'footer.address', label: 'Address' },
      ],
    },
  ],
}
