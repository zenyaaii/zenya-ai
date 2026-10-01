import {
  Sparkles, Shirt, Star, Mail, Image as ImageIcon, Phone, Newspaper, Heart,
  Home as HomeIcon, ShoppingBag, BookOpen,
} from 'lucide-react'
import { LOOKBOOK_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',    label: 'الأساسي' },
  { key: 'accent',     label: 'اللون المميز' },
  { key: 'background', label: 'الخلفية' },
  { key: 'surface',    label: 'الأسطح' },
  { key: 'surfaceAlt', label: 'الأسطح البديلة' },
  { key: 'text',       label: 'النص' },
  { key: 'muted',      label: 'نص خافت' },
  { key: 'border',     label: 'الحدود' },
  { key: 'overlay',    label: 'الطبقة الشفافة' },
  { key: 'badge',      label: 'خلفية الشارة' },
  { key: 'badgeText',  label: 'نص الشارة' },
]

export const LOOKBOOK_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'lookbook',
  themeName:       'لوك بوك',
  defaultPresetId: 'noir',
  brandNamePath:   'brand.name',
  colorPresets:    LOOKBOOK_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',     label: 'الرئيسية',     icon: HomeIcon },
    { id: 'shop',     label: 'المتجر',     icon: ShoppingBag },
    { id: 'lookbook', label: 'معرض الإطلالات', icon: ImageIcon },
    { id: 'about',    label: 'من نحن',    icon: BookOpen },
  ],

  panels: [
    {
      id: 'brand', label: 'العلامة التجارية', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',     label: 'اسم العلامة' },
        { type: 'text', path: 'brand.tagline',  label: 'الشعار النصي' },
        { type: 'text', path: 'brand.category', label: 'الفئة' },
      ],
    },
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'hero.headline',      label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'العنوان الفرعي', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'hero.cta_secondary', label: 'الزر الثاني' },
        { type: 'text',     path: 'hero.badge',         label: 'شارة (اختياري)' },
      ],
    },
    {
      id: 'drop_banner', label: 'شريط الإصدار الجديد', icon: Newspaper,
      fields: [
        { type: 'text', path: 'drop_banner.label', label: 'التسمية' },
        { type: 'text', path: 'drop_banner.text',  label: 'النص' },
        { type: 'text', path: 'drop_banner.cta',   label: 'زر' },
      ],
    },
    {
      id: 'lookbook_section', label: 'معرض الإطلالات', icon: ImageIcon, page: 'lookbook',
      fields: [
        { type: 'text',     path: 'lookbook.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'lookbook.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'lookbook.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'lookbook.looks',
          label: 'الإطلالات', itemLabel: 'إطلالة', itemTitle: 'title',
          makeItem: () => ({ title: 'إطلالة جديدة', subtitle: '', tag: '' }),
          itemFields: [
            { type: 'text', path: 'title',    label: 'العنوان' },
            { type: 'text', path: 'subtitle', label: 'العنوان الفرعي' },
            { type: 'text', path: 'tag',      label: 'الوسم' },
          ],
        },
      ],
    },
    {
      id: 'bestsellers', label: 'الأكثر مبيعًا', icon: Shirt, page: 'home',
      fields: [
        { type: 'text',     path: 'bestsellers.eyebrow', label: 'عنوان صغير' },
        { type: 'textarea', path: 'bestsellers.heading', label: 'العنوان', rows: 2 },
        {
          type: 'array', path: 'bestsellers.products',
          label: 'المنتجات', itemLabel: 'منتج', itemTitle: 'name',
          makeItem: () => ({ name: 'منتج جديد', price: '$0', original_price: '', badge: '', category: '' }),
          itemFields: [
            { type: 'text', path: 'name',           label: 'الاسم' },
            { type: 'text', path: 'price',          label: 'السعر' },
            { type: 'text', path: 'original_price', label: 'السعر الأصلي' },
            { type: 'text', path: 'badge',          label: 'شارة' },
            { type: 'text', path: 'category',       label: 'الفئة' },
          ],
        },
      ],
    },
    {
      id: 'brand_story', label: 'قصة العلامة', icon: Heart, page: 'about',
      fields: [
        { type: 'text',     path: 'brand_story.eyebrow', label: 'عنوان صغير' },
        { type: 'textarea', path: 'brand_story.heading', label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'brand_story.body',    label: 'النص', rows: 5 },
        {
          type: 'array', path: 'brand_story.values',
          label: 'قيم العلامة', itemLabel: 'قيمة', itemTitle: 'title',
          makeItem: () => ({ icon: 'star', title: 'قيمة جديدة', text: '' }),
          itemFields: [
            { type: 'text',     path: 'icon',  label: 'اسم الأيقونة' },
            { type: 'text',     path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'text',  label: 'النص', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'press', label: 'الصحافة', icon: Newspaper, page: 'about',
      fields: [
        { type: 'text',    path: 'press.heading',      label: 'العنوان' },
        { type: 'strings', path: 'press.publications', label: 'المنشورات', addLabel: 'إضافة منشور' },
      ],
    },
    {
      id: 'testimonials', label: 'التقييمات', icon: Star, page: 'home',
      fields: [
        { type: 'reviews', path: 'testimonials.items' },
        { type: 'text',     path: 'testimonials.eyebrow',        label: 'عنوان صغير' },
        { type: 'textarea', path: 'testimonials.heading',        label: 'العنوان', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'متوسط التقييم', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'نص عدد التقييمات' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'التقييمات', itemLabel: 'تقييم', itemTitle: 'author',
          makeItem: () => ({ author: 'عميل', rating: 5, text: '', item: '', verified: true }),
          itemFields: [
            { type: 'text',     path: 'author', label: 'الكاتب' },
            { type: 'number',   path: 'rating', label: 'التقييم', min: 1, max: 5 },
            { type: 'textarea', path: 'text',   label: 'نص التقييم', rows: 3 },
            { type: 'text',     path: 'item',   label: 'المنتج المشترى (اختياري)' },
          ],
        },
      ],
    },
    {
      id: 'newsletter', label: 'النشرة البريدية', icon: Mail, page: 'home',
      fields: [
        { type: 'text',     path: 'newsletter.eyebrow',     label: 'عنوان صغير' },
        { type: 'textarea', path: 'newsletter.heading',     label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'newsletter.subheading',  label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'newsletter.placeholder', label: 'نص حقل الإدخال' },
        { type: 'text',     path: 'newsletter.cta',         label: 'زر' },
        { type: 'text',     path: 'newsletter.note',        label: 'ملاحظة' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'footer', label: 'تذييل الصفحة', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'الشعار النصي' },
        { type: 'text', path: 'footer.legal',   label: 'الحقوق' },
        { type: 'text', path: 'footer.email',   label: 'البريد الإلكتروني' },
      ],
    },
  ],
}
