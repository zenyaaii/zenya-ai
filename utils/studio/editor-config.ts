import {
  Sparkles, Mail, Newspaper, Users, Award, Quote, Clock,
} from 'lucide-react'
import { STUDIO_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',     label: 'Primary' },
  { key: 'accent',      label: 'Accent' },
  { key: 'accentMuted', label: 'Accent muted' },
  { key: 'background',  label: 'Background' },
  { key: 'surface',     label: 'Surface' },
  { key: 'surfaceAlt',  label: 'Surface alt' },
  { key: 'text',        label: 'Text' },
  { key: 'muted',       label: 'Muted text' },
  { key: 'border',      label: 'Border' },
]

export const STUDIO_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'studio',
  themeName:       'Studio',
  defaultPresetId: 'ink',
  brandNamePath:   'brand.name',
  colorPresets:    STUDIO_PRESETS,
  colorTokens:     TOKENS,

  panels: [
    {
      id: 'brand', label: 'Brand', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',     label: 'Studio name' },
        { type: 'text', path: 'brand.tagline',  label: 'Tagline' },
        { type: 'text', path: 'brand.category', label: 'Category' },
        { type: 'text', path: 'brand.founded',  label: 'Founded' },
      ],
    },
    {
      id: 'hero', label: 'Hero', icon: Sparkles,
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'Eyebrow' },
        { type: 'textarea', path: 'hero.manifesto',     label: 'Manifesto', rows: 4 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'Subheadline', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',   label: 'Primary CTA' },
        { type: 'text',     path: 'hero.cta_secondary', label: 'Secondary CTA' },
      ],
    },
    {
      id: 'mission', label: 'Mission', icon: Sparkles,
      fields: [
        { type: 'textarea', path: 'mission.statement',   label: 'Statement', rows: 3 },
        { type: 'textarea', path: 'mission.elaboration', label: 'Elaboration', rows: 5 },
      ],
    },
    {
      id: 'founder_letter', label: 'Founder letter', icon: Quote,
      fields: [
        { type: 'text', path: 'founder_letter.eyebrow',         label: 'Eyebrow' },
        { type: 'text', path: 'founder_letter.heading',         label: 'Heading' },
        { type: 'text', path: 'founder_letter.signature',       label: 'Signature' },
        { type: 'text', path: 'founder_letter.signature_role',  label: 'Signature role' },
        { type: 'strings', path: 'founder_letter.paragraphs',   label: 'Paragraphs', addLabel: 'Add paragraph' },
      ],
    },
    {
      id: 'timeline', label: 'Timeline', icon: Clock,
      fields: [
        { type: 'text',     path: 'timeline.eyebrow', label: 'Eyebrow' },
        { type: 'textarea', path: 'timeline.heading', label: 'Heading', rows: 2 },
        {
          type: 'array', path: 'timeline.events',
          label: 'Events', itemLabel: 'event', itemTitle: 'year',
          makeItem: () => ({ year: 'YYYY', title: '', description: '' }),
          itemFields: [
            { type: 'text',     path: 'year',        label: 'Year' },
            { type: 'text',     path: 'title',       label: 'Title' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'values', label: 'Values', icon: Award,
      fields: [
        { type: 'text',     path: 'values.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'values.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'values.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'values.items',
          label: 'Values', itemLabel: 'value', itemTitle: 'title',
          makeItem: () => ({ number: '01', title: 'New value', body: '' }),
          itemFields: [
            { type: 'text',     path: 'number', label: 'Number' },
            { type: 'text',     path: 'title',  label: 'Title' },
            { type: 'textarea', path: 'body',   label: 'Body', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'process', label: 'Process', icon: Award,
      fields: [
        { type: 'text',     path: 'process.eyebrow', label: 'Eyebrow' },
        { type: 'textarea', path: 'process.heading', label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'process.body',    label: 'Body', rows: 4 },
        {
          type: 'array', path: 'process.steps',
          label: 'Steps', itemLabel: 'step', itemTitle: 'title',
          makeItem: () => ({ title: '', description: '' }),
          itemFields: [
            { type: 'text',     path: 'title',       label: 'Title' },
            { type: 'textarea', path: 'description', label: 'Description', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'team', label: 'Team', icon: Users,
      fields: [
        { type: 'text',     path: 'team.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'team.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'team.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'team.members',
          label: 'Team', itemLabel: 'member', itemTitle: 'name',
          makeItem: () => ({ name: 'New member', role: 'Role', bio: '', avatar_letter: 'N' }),
          itemFields: [
            { type: 'text',     path: 'name',           label: 'Name' },
            { type: 'text',     path: 'role',           label: 'Role' },
            { type: 'textarea', path: 'bio',            label: 'Bio', rows: 3 },
            { type: 'text',     path: 'avatar_letter',  label: 'Avatar initial' },
          ],
        },
      ],
    },
    {
      id: 'press', label: 'Press', icon: Newspaper,
      fields: [
        { type: 'text', path: 'press.heading', label: 'Heading' },
        {
          type: 'array', path: 'press.items',
          label: 'Mentions', itemLabel: 'mention', itemTitle: 'publication',
          makeItem: () => ({ publication: 'Publication', quote: '', year: '' }),
          itemFields: [
            { type: 'text',     path: 'publication', label: 'Publication' },
            { type: 'textarea', path: 'quote',       label: 'Quote', rows: 2 },
            { type: 'text',     path: 'year',        label: 'Year' },
          ],
        },
      ],
    },
    {
      id: 'community', label: 'Community', icon: Users,
      fields: [
        { type: 'text',     path: 'community.eyebrow',    label: 'Eyebrow' },
        { type: 'textarea', path: 'community.heading',    label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'community.subheading', label: 'Subheading', rows: 2 },
        {
          type: 'array', path: 'community.stats',
          label: 'Stats', itemLabel: 'stat', itemTitle: 'value',
          makeItem: () => ({ value: '0', label: 'New stat' }),
          itemFields: [
            { type: 'text', path: 'value', label: 'Value' },
            { type: 'text', path: 'label', label: 'Label' },
          ],
        },
      ],
    },
    {
      id: 'cta', label: 'Final CTA', icon: Sparkles,
      fields: [
        { type: 'text',     path: 'cta.eyebrow',       label: 'Eyebrow' },
        { type: 'textarea', path: 'cta.heading',       label: 'Heading', rows: 2 },
        { type: 'textarea', path: 'cta.subheading',    label: 'Subheading', rows: 2 },
        { type: 'text',     path: 'cta.cta_primary',   label: 'Primary CTA' },
        { type: 'text',     path: 'cta.cta_secondary', label: 'Secondary CTA' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'footer', label: 'Footer', icon: Mail,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'Tagline' },
        { type: 'text', path: 'footer.legal',   label: 'Legal' },
        { type: 'text', path: 'footer.email',   label: 'Email' },
      ],
    },
  ],
}
