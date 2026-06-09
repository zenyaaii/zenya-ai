import {
  Sparkles, Shirt, Star, Mail, Image as ImageIcon, Phone, Newspaper, Heart,
  Home as HomeIcon, ShoppingBag, BookOpen,
} from 'lucide-react'
import { LOOKBOOK_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',    label: 'Primary' },
  { key: 'accent',     label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface',    label: 'Surface' },
  { key: 'surfaceAlt', label: 'Surface alt' },
  { key: 'text',       label: 'Text' },
  { key: 'muted',      label: 'Muted text' },
  { key: 'border',     label: 'Border' },
  { key: 'overlay',    label: 'Overlay' },
  { key: 'badge',      label: 'Badge bg' },
  { key: 'badgeText',  label: 'Badge text' },
]

export const LOOKBOOK_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'lookbook',
  themeName:       'Lookbook',
  defaultPresetId: 'noir',
  brandNamePath:   'brand.name',
  colorPresets:    LOOKBOOK_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',     label: 'Home',     icon: HomeIcon },
    { id: 'shop',     label: 'Shop',     icon: ShoppingBag },
    { id: 'lookbook', label: 'Lookbook', icon: ImageIcon },
    { id: 'about',    label: 'About',    icon: BookOpen },
  ],

  panels: [
    {
      id: 'brand', label: 'Brand', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',     label: 'Brand name' },
        { type: 'text', path: 'brand.tagline',  label: 'Tagline' },
        { type: 'text', path: 'brand.category', label: 'Category' },
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
      ],
    },
    {
      id: 'drop_banner', label: 'Drop banner', icon: Newspaper,
      fields: [
        { type: 'text', path: 'drop_banner.label', label: 'Label' },
        { type: 'text', path: 'drop_banner.text',  label: 'Text' },
        { type: 'text', path: 'drop_banner.cta',   label: 'CTA' },
      ],
    },
    {
      id: 'lookbook_section', label: 'Lookbook', icon: ImageIcon, page: 'lookbook',
      fields: [
        { type: 'text',     path: 'lookbook.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'lookbook.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'lookbook.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'lookbook.looks',
          label: 'Looks', itemLabel: 'look', itemTitle: 'title',
          makeItem: () => ({ title: 'New look', subtitle: '', tag: '' }),
          itemFields: [
            { type: 'text', path: 'title',    label: 'Title' },
            { type: 'text', path: 'subtitle', label: 'Subtitle' },
            { type: 'text', path: 'tag',      label: 'Tag' },
          ],
        },
      ],
    },
    {
      id: 'bestsellers', label: 'Bestsellers', icon: Shirt, page: 'home',
      fields: [
        { type: 'text',     path: 'bestsellers.eyebrow', label: 'Eyebrow' },
        { type: 'textarea', path: 'bestsellers.heading', label: 'Heading', rows: 2 },
        {
          type: 'array', path: 'bestsellers.products',
          label: 'Products', itemLabel: 'product', itemTitle: 'name',
          makeItem: () => ({ name: 'New product', price: '$0', original_price: '', badge: '', category: '' }),
          itemFields: [
            { type: 'text', path: 'name',           label: 'Name' },
            { type: 'text', path: 'price',          label: 'Price' },
            { type: 'text', path: 'original_price', label: 'Original price' },
            { type: 'text', path: 'badge',          label: 'Badge' },
            { type: 'text', path: 'category',       label: 'Category' },
          ],
        },
      ],
    },
    {
      id: 'brand_story', label: 'Brand story', icon: Heart, page: 'about',
      fields: [
        { type: 'text',     path: 'brand_story.eyebrow', label: 'Eyebrow' },
        { type: 'textarea', path: 'brand_story.heading', label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'brand_story.body',    label: 'Body', rows: 5 },
        {
          type: 'array', path: 'brand_story.values',
          label: 'Brand values', itemLabel: 'value', itemTitle: 'title',
          makeItem: () => ({ icon: 'star', title: 'New value', text: '' }),
          itemFields: [
            { type: 'text',     path: 'icon',  label: 'Icon name' },
            { type: 'text',     path: 'title', label: 'Title' },
            { type: 'textarea', path: 'text',  label: 'Text', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'press', label: 'Press', icon: Newspaper, page: 'about',
      fields: [
        { type: 'text',    path: 'press.heading',      label: 'Heading' },
        { type: 'strings', path: 'press.publications', label: 'Publications', addLabel: 'Add publication' },
      ],
    },
    {
      id: 'testimonials', label: 'Reviews', icon: Star, page: 'home',
      fields: [
        { type: 'text',     path: 'testimonials.eyebrow',        label: 'Eyebrow' },
        { type: 'textarea', path: 'testimonials.heading',        label: 'Heading', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'Average rating', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'Review count text' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'Reviews', itemLabel: 'review', itemTitle: 'author',
          makeItem: () => ({ author: 'Customer', rating: 5, text: '', item: '', verified: true }),
          itemFields: [
            { type: 'text',     path: 'author', label: 'Author' },
            { type: 'number',   path: 'rating', label: 'Rating', min: 1, max: 5 },
            { type: 'textarea', path: 'text',   label: 'Review text', rows: 3 },
            { type: 'text',     path: 'item',   label: 'Item bought (optional)' },
          ],
        },
      ],
    },
    {
      id: 'newsletter', label: 'Newsletter', icon: Mail, page: 'home',
      fields: [
        { type: 'text',     path: 'newsletter.eyebrow',     label: 'Eyebrow' },
        { type: 'textarea', path: 'newsletter.heading',     label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'newsletter.subheading',  label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'newsletter.placeholder', label: 'Input placeholder' },
        { type: 'text',     path: 'newsletter.cta',         label: 'CTA' },
        { type: 'text',     path: 'newsletter.note',        label: 'Note' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'footer', label: 'Footer', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'Tagline' },
        { type: 'text', path: 'footer.legal',   label: 'Legal' },
        { type: 'text', path: 'footer.email',   label: 'Email' },
      ],
    },
  ],
}
