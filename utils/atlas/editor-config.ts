import {
  Home, Layers, DollarSign, ZapIcon, Star, HelpCircle,
  Sparkles, Type, Shield, Phone,
} from 'lucide-react'
import { ATLAS_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const ATLAS_COLOR_TOKENS = [
  { key: 'primary',      label: 'Primary' },
  { key: 'primaryMuted', label: 'Primary muted' },
  { key: 'accent',       label: 'Accent' },
  { key: 'background',   label: 'Background' },
  { key: 'surface',      label: 'Surface · cards' },
  { key: 'surfaceAlt',   label: 'Surface alt' },
  { key: 'text',         label: 'Text' },
  { key: 'muted',        label: 'Muted text' },
  { key: 'border',       label: 'Border' },
]

export const ATLAS_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'atlas',
  themeName:       'Atlas',
  defaultPresetId: 'orbit',
  brandNamePath:   'brand.name',
  colorPresets:    ATLAS_PRESETS,
  colorTokens:     ATLAS_COLOR_TOKENS,

  pages: [
    { id: 'home',         label: 'Home',         icon: Home },
    { id: 'features',     label: 'Features',     icon: Layers },
    { id: 'pricing',      label: 'Pricing',      icon: DollarSign },
    { id: 'integrations', label: 'Integrations', icon: ZapIcon },
    { id: 'docs',         label: 'Docs / FAQ',   icon: HelpCircle },
  ],

  panels: [
    {
      id: 'brand', label: 'Brand', icon: Sparkles,
      fields: [
        { type: 'text',     path: 'brand.name',     label: 'Product name' },
        { type: 'text',     path: 'brand.tagline',  label: 'Tagline' },
        { type: 'text',     path: 'brand.category', label: 'Category' },
      ],
    },
    {
      id: 'hero', label: 'Hero', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',      label: 'Eyebrow' },
        { type: 'textarea', path: 'hero.headline',     label: 'Headline', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',  label: 'Subheadline', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',  label: 'Primary CTA' },
        { type: 'text',     path: 'hero.cta_secondary',label: 'Secondary CTA' },
        { type: 'text',     path: 'hero.social_proof', label: 'Social proof line' },
        { type: 'text',     path: 'hero.badge',        label: 'Badge (optional)' },
      ],
    },
    {
      id: 'trust_bar', label: 'Trust bar', icon: Star, page: 'home',
      fields: [
        { type: 'text',    path: 'trust_bar.label', label: 'Label' },
        { type: 'strings', path: 'trust_bar.logos', label: 'Logo names', addLabel: 'Add logo' },
      ],
    },
    {
      id: 'features', label: 'Features', icon: Layers, page: 'features',
      fields: [
        { type: 'text',     path: 'features.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'features.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'features.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'features.items',
          label: 'Feature cards', itemLabel: 'feature', itemTitle: 'title',
          makeItem: () => ({ icon: 'sparkles', title: 'New feature', description: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'icon',        label: 'Icon name (lucide)' },
            { type: 'text',     path: 'title',       label: 'Title' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 3 },
            { type: 'text',     path: 'badge',       label: 'Badge (optional)' },
          ],
        },
      ],
    },
    {
      id: 'how_it_works', label: 'How it works', icon: Layers, page: 'home',
      fields: [
        { type: 'text',     path: 'how_it_works.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'how_it_works.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'how_it_works.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'how_it_works.steps',
          label: 'Steps', itemLabel: 'step', itemTitle: 'title',
          makeItem: () => ({ step: '01', title: 'New step', description: '', icon: 'sparkles' }),
          itemFields: [
            { type: 'text',     path: 'step',        label: 'Step number' },
            { type: 'text',     path: 'title',       label: 'Title' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 3 },
            { type: 'text',     path: 'icon',        label: 'Icon name (lucide)' },
          ],
        },
      ],
    },
    {
      id: 'pricing', label: 'Pricing', icon: DollarSign, page: 'pricing',
      fields: [
        { type: 'text',     path: 'pricing.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'pricing.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'pricing.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'pricing.tiers',
          label: 'Tiers', itemLabel: 'tier', itemTitle: 'name',
          makeItem: () => ({ name: 'New tier', price: '$0', period: '/mo', description: '', cta: 'Get started', highlighted: false, features: [] }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'Name' },
            { type: 'text',     path: 'price',       label: 'Price' },
            { type: 'text',     path: 'period',      label: 'Period' },
            { type: 'textarea', path: 'description', label: 'Description' },
            { type: 'text',     path: 'cta',         label: 'CTA' },
            { type: 'strings',  path: 'features',    label: 'Features', addLabel: 'Add feature' },
          ],
        },
      ],
    },
    {
      id: 'integrations', label: 'Integrations', icon: ZapIcon, page: 'integrations',
      fields: [
        { type: 'textarea', path: 'integrations.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'integrations.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'integrations.items',
          label: 'Integrations', itemLabel: 'integration', itemTitle: 'name',
          makeItem: () => ({ name: 'New integration', icon: 'plug', category: 'Other' }),
          itemFields: [
            { type: 'text', path: 'name',     label: 'Name' },
            { type: 'text', path: 'icon',     label: 'Icon name' },
            { type: 'text', path: 'category', label: 'Category' },
          ],
        },
      ],
    },
    {
      id: 'testimonials', label: 'Testimonials', icon: Star, page: 'home',
      fields: [
        { type: 'text',     path: 'testimonials.eyebrow', label: 'Eyebrow' },
        { type: 'textarea', path: 'testimonials.heading', label: 'Heading', rows: 2 },
        {
          type: 'array', path: 'testimonials.items',
          label: 'Quotes', itemLabel: 'testimonial', itemTitle: 'author',
          makeItem: () => ({ quote: '', author: 'Customer', role: 'Role', company: 'Company', rating: 5, avatar_letter: 'C' }),
          itemFields: [
            { type: 'textarea', path: 'quote',         label: 'Quote', rows: 3 },
            { type: 'text',     path: 'author',        label: 'Author' },
            { type: 'text',     path: 'role',          label: 'Role' },
            { type: 'text',     path: 'company',       label: 'Company' },
            { type: 'number',   path: 'rating',        label: 'Rating (1-5)', min: 1, max: 5 },
            { type: 'text',     path: 'avatar_letter', label: 'Avatar initial' },
          ],
        },
      ],
    },
    {
      id: 'security', label: 'Security', icon: Shield, page: 'features',
      fields: [
        { type: 'text',    path: 'security.heading', label: 'Heading' },
        { type: 'strings', path: 'security.items',   label: 'Security bullets', addLabel: 'Add bullet' },
      ],
    },
    {
      id: 'faq', label: 'FAQ', icon: HelpCircle, page: 'docs',
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
      id: 'cta', label: 'Final CTA', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'cta.eyebrow',       label: 'Eyebrow' },
        { type: 'textarea', path: 'cta.heading',       label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'cta.subheading',    label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'cta.cta_primary',   label: 'Primary CTA' },
        { type: 'text',     path: 'cta.cta_secondary', label: 'Secondary CTA' },
        { type: 'text',     path: 'cta.note',          label: 'Small note' },
      ],
    },
  ],

  globalPanels: [
    {
      id: 'footer', label: 'Footer', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'Tagline' },
        { type: 'text', path: 'footer.legal',   label: 'Legal line' },
        { type: 'text', path: 'footer.email',   label: 'Contact email' },
      ],
    },
  ],
}
