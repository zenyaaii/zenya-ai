import {
  Home, Layers, DollarSign, ZapIcon, Star, HelpCircle,
  Sparkles, Type, Shield, Phone,
} from 'lucide-react'
import { ATLAS_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const ATLAS_COLOR_TOKENS = [
  { key: 'primary',      label: 'الأساسي' },
  { key: 'primaryMuted', label: 'الأساسي الخافت' },
  { key: 'accent',       label: 'اللون المميز' },
  { key: 'background',   label: 'الخلفية' },
  { key: 'surface',      label: 'الأسطح · البطاقات' },
  { key: 'surfaceAlt',   label: 'الأسطح البديلة' },
  { key: 'text',         label: 'النص' },
  { key: 'muted',        label: 'نص خافت' },
  { key: 'border',       label: 'الحدود' },
]

export const ATLAS_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'atlas',
  themeName:       'أطلس',
  defaultPresetId: 'orbit',
  brandNamePath:   'brand.name',
  colorPresets:    ATLAS_PRESETS,
  colorTokens:     ATLAS_COLOR_TOKENS,

  pages: [
    { id: 'home',         label: 'الرئيسية',         icon: Home },
    { id: 'features',     label: 'المزايا',     icon: Layers },
    { id: 'pricing',      label: 'الأسعار',      icon: DollarSign },
    { id: 'integrations', label: 'التكاملات', icon: ZapIcon },
    { id: 'docs',         label: 'المساعدة / الأسئلة الشائعة',   icon: HelpCircle },
  ],

  panels: [
    {
      id: 'brand', label: 'العلامة التجارية', icon: Sparkles,
      fields: [
        { type: 'text',     path: 'brand.name',     label: 'اسم المنتج' },
        { type: 'text',     path: 'brand.tagline',  label: 'الشعار النصي' },
        { type: 'text',     path: 'brand.category', label: 'الفئة' },
      ],
    },
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',      label: 'عنوان صغير' },
        { type: 'textarea', path: 'hero.headline',     label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',  label: 'العنوان الفرعي', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',  label: 'الزر الرئيسي' },
        { type: 'text',     path: 'hero.cta_secondary',label: 'الزر الثاني' },
        { type: 'text',     path: 'hero.social_proof', label: 'سطر إثبات الثقة' },
        { type: 'text',     path: 'hero.badge',        label: 'شارة (اختياري)' },
      ],
    },
    {
      id: 'trust_bar', label: 'شريط الثقة', icon: Star, page: 'home',
      fields: [
        { type: 'text',    path: 'trust_bar.label', label: 'التسمية' },
        { type: 'strings', path: 'trust_bar.logos', label: 'أسماء الشعارات', addLabel: 'إضافة شعار' },
      ],
    },
    {
      id: 'features', label: 'المزايا', icon: Layers, page: 'features',
      fields: [
        { type: 'text',     path: 'features.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'features.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'features.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'features.items',
          label: 'بطاقات المزايا', itemLabel: 'ميزة', itemTitle: 'title',
          makeItem: () => ({ icon: 'sparkles', title: 'ميزة جديدة', description: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'icon',        label: 'اسم الأيقونة (lucide)' },
            { type: 'text',     path: 'title',       label: 'العنوان' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 3 },
            { type: 'text',     path: 'badge',       label: 'شارة (اختياري)' },
          ],
        },
      ],
    },
    {
      id: 'how_it_works', label: 'كيف يعمل', icon: Layers, page: 'home',
      fields: [
        { type: 'text',     path: 'how_it_works.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'how_it_works.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'how_it_works.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'how_it_works.steps',
          label: 'الخطوات', itemLabel: 'خطوة', itemTitle: 'title',
          makeItem: () => ({ step: '01', title: 'خطوة جديدة', description: '', icon: 'sparkles' }),
          itemFields: [
            { type: 'text',     path: 'step',        label: 'رقم الخطوة' },
            { type: 'text',     path: 'title',       label: 'العنوان' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 3 },
            { type: 'text',     path: 'icon',        label: 'اسم الأيقونة (lucide)' },
          ],
        },
      ],
    },
    {
      id: 'pricing', label: 'الأسعار', icon: DollarSign, page: 'pricing',
      fields: [
        { type: 'text',     path: 'pricing.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'pricing.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'pricing.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'pricing.tiers',
          label: 'الباقات', itemLabel: 'باقة', itemTitle: 'name',
          makeItem: () => ({ name: 'باقة جديدة', price: '$0', period: '/شهريًا', description: '', cta: 'ابدأ الآن', highlighted: false, features: [] }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'الاسم' },
            { type: 'text',     path: 'price',       label: 'السعر' },
            { type: 'text',     path: 'period',      label: 'المدة' },
            { type: 'textarea', path: 'description', label: 'الوصف' },
            { type: 'text',     path: 'cta',         label: 'زر' },
            { type: 'strings',  path: 'features',    label: 'المزايا', addLabel: 'إضافة ميزة' },
          ],
        },
      ],
    },
    {
      id: 'integrations', label: 'التكاملات', icon: ZapIcon, page: 'integrations',
      fields: [
        { type: 'textarea', path: 'integrations.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'integrations.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'integrations.items',
          label: 'التكاملات', itemLabel: 'تكامل', itemTitle: 'name',
          makeItem: () => ({ name: 'تكامل جديد', icon: 'plug', category: 'أخرى' }),
          itemFields: [
            { type: 'text', path: 'name',     label: 'الاسم' },
            { type: 'text', path: 'icon',     label: 'اسم الأيقونة' },
            { type: 'text', path: 'category', label: 'الفئة' },
          ],
        },
      ],
    },
    {
      id: 'testimonials', label: 'التقييمات', icon: Star, page: 'home',
      fields: [
        { type: 'reviews', path: 'testimonials.items' },
        { type: 'text',     path: 'testimonials.eyebrow', label: 'عنوان صغير' },
        { type: 'textarea', path: 'testimonials.heading', label: 'العنوان', rows: 2 },
        {
          type: 'array', path: 'testimonials.items',
          label: 'الاقتباسات', itemLabel: 'تقييم', itemTitle: 'author',
          makeItem: () => ({ quote: '', author: 'عميل', role: 'المنصب', company: 'الشركة', rating: 5, avatar_letter: 'ع' }),
          itemFields: [
            { type: 'textarea', path: 'quote',         label: 'الاقتباس', rows: 3 },
            { type: 'text',     path: 'author',        label: 'الكاتب' },
            { type: 'text',     path: 'role',          label: 'المنصب' },
            { type: 'text',     path: 'company',       label: 'الشركة' },
            { type: 'number',   path: 'rating',        label: 'التقييم (1-5)', min: 1, max: 5 },
            { type: 'text',     path: 'avatar_letter', label: 'الحرف الأول للصورة' },
          ],
        },
      ],
    },
    {
      id: 'security', label: 'الأمان', icon: Shield, page: 'features',
      fields: [
        { type: 'text',    path: 'security.heading', label: 'العنوان' },
        { type: 'strings', path: 'security.items',   label: 'نقاط الأمان', addLabel: 'إضافة نقطة' },
      ],
    },
    {
      id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle, page: 'docs',
      fields: [
        { type: 'text', path: 'faq.heading', label: 'العنوان' },
        {
          type: 'array', path: 'faq.items',
          label: 'الأسئلة', itemLabel: 'سؤال', itemTitle: 'q',
          makeItem: () => ({ q: 'سؤال جديد؟', a: '' }),
          itemFields: [
            { type: 'text',     path: 'q', label: 'السؤال' },
            { type: 'textarea', path: 'a', label: 'الإجابة', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'cta', label: 'الزر الختامي', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'cta.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'cta.heading',       label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'cta.subheading',    label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'cta.cta_primary',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'cta.cta_secondary', label: 'الزر الثاني' },
        { type: 'text',     path: 'cta.note',          label: 'ملاحظة صغيرة' },
      ],
    },
  ],

  globalPanels: [
    {
      id: 'footer', label: 'تذييل الصفحة', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'الشعار النصي' },
        { type: 'text', path: 'footer.legal',   label: 'سطر الحقوق' },
        { type: 'text', path: 'footer.email',   label: 'بريد التواصل' },
      ],
    },
  ],
}
